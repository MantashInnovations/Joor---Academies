import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/accept-invite?error=missing_token', request.url))
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  try {
    // 1. Find the invitation
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('academy_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (inviteError || !invitation) {
      return NextResponse.redirect(
        new URL('/accept-invite?error=invalid_or_expired', request.url)
      )
    }

    const { email, academy_id, role, payload } = invitation

    // 2. Find the user's EXISTING auth account (from another academy)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .neq('academy_id', academy_id)
      .limit(1)
      .single()

    if (!existingProfile) {
      return NextResponse.redirect(
        new URL('/accept-invite?error=no_existing_account', request.url)
      )
    }

    // 3. Get the existing user's password hash from auth.users
    // We use a raw SQL query via the admin client because the JS SDK doesn't expose password hashes
    const { data: existingAuthRows, error: hashError } = await supabaseAdmin.rpc(
      'get_user_password_hash',
      { user_id: existingProfile.id }
    )

    // If the RPC doesn't exist yet, fall back to a default password
    let passwordHash: string | null = null
    if (!hashError && existingAuthRows) {
      passwordHash = existingAuthRows
    }

    // 4. Generate the aliased email for this academy
    const [localPart, domain] = email.split('@')
    const authAlias = `${localPart}+${academy_id}@${domain}`

    // 5. Create the new auth user with the SAME password
    const createUserPayload: any = {
      email: authAlias,
      email_confirm: true,
      user_metadata: {
        full_name: payload.full_name || `${payload.first_name || ''} ${payload.last_name || ''}`.trim(),
        role,
        academy_id,
      },
      app_metadata: {
        role,
        academy_id,
      },
    }

    // If we got the password hash, use it. Otherwise fall back to default.
    if (passwordHash) {
      createUserPayload.password_hash = passwordHash
    } else {
      createUserPayload.password = 'Joor123'
    }

    const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser(
      createUserPayload
    )

    if (authError) {
      console.error('[AcceptInvite] Auth creation failed:', authError)
      return NextResponse.redirect(
        new URL('/accept-invite?error=auth_failed', request.url)
      )
    }

    // 6. Create the profile
    const fullName = payload.full_name || `${payload.first_name || ''} ${payload.last_name || ''}`.trim()

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: newAuthUser.user.id,
      full_name: fullName,
      first_name: payload.first_name || null,
      last_name: payload.last_name || null,
      email,
      role,
      cnic: payload.cnic || null,
      academy_id,
      is_profile_completed: true,
      is_active: true,
    }, { onConflict: 'id' })

    if (profileError) {
      console.error('[AcceptInvite] Profile creation error:', profileError)
    }

    // 7. Create the role-specific record (teacher or student)
    if (role === 'teacher') {
      const { error: teacherError } = await supabaseAdmin.from('teachers').insert({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email,
        cnic: payload.cnic,
        phone: payload.phone,
        whatsapp_no: payload.whatsapp_no || null,
        age: payload.age || null,
        address: payload.address || null,
        specialization: payload.specialization || null,
        salary_type: payload.salary_type || 'salary',
        commission_type: payload.commission_type || null,
        commission_rate: payload.commission_rate || 0,
        user_id: newAuthUser.user.id,
        academy_id,
      })
      if (teacherError) {
        console.error('[AcceptInvite] Teacher record error:', teacherError)
      }
    } else if (role === 'student') {
      const { error: studentError } = await supabaseAdmin.from('students').insert({
        full_name: payload.full_name,
        email,
        cnic: payload.cnic,
        student_code: payload.student_code,
        class_name: payload.class_name || null,
        parent_name: payload.parent_name || null,
        parent_phone: payload.parent_phone || null,
        parent_email: payload.parent_email || null,
        address: payload.address || null,
        user_id: newAuthUser.user.id,
        academy_id,
      })
      if (studentError) {
        console.error('[AcceptInvite] Student record error:', studentError)
      }
    }

    // 8. Mark the invitation as accepted
    await supabaseAdmin
      .from('academy_invitations')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', invitation.id)

    // 9. Redirect to success page
    return NextResponse.redirect(
      new URL('/accept-invite?success=true', request.url)
    )
  } catch (error: any) {
    console.error('[AcceptInvite] Unexpected error:', error)
    return NextResponse.redirect(
      new URL('/accept-invite?error=unexpected', request.url)
    )
  }
}
