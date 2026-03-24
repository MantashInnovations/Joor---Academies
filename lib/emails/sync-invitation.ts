'use server'

import { resend } from '@/lib/resend'

interface SendSyncInvitationParams {
  to: string
  inviteeName: string
  invitingAcademyName: string
  existingAcademyName: string
  role: 'teacher' | 'student'
  token: string
  baseUrl: string
}

export async function sendSyncInvitationEmail({
  to,
  inviteeName,
  invitingAcademyName,
  existingAcademyName,
  role,
  token,
  baseUrl,
}: SendSyncInvitationParams) {
  const syncUrl = `${baseUrl}/accept-invite?token=${token}`

  const { data, error } = await resend.emails.send({
    from: 'Joor <noreply@contact.tabisharshad.com>',
    to: [to],
    subject: `You've been invited to ${invitingAcademyName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">
                      🎓 Academy Invitation
                    </h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 36px 40px;">
                    <p style="color: #18181b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Hi <strong>${inviteeName}</strong>,
                    </p>
                    <p style="color: #3f3f46; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
                      You've been added as a <strong style="color: #6366f1;">${role}</strong> at 
                      <strong>${invitingAcademyName}</strong>.
                    </p>
                    <p style="color: #3f3f46; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
                      Since you already have an account with <strong>${existingAcademyName}</strong>, 
                      click the button below to link your accounts. Your existing password will work 
                      across both academies — no need to set a new one.
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 4px 0 28px 0;">
                          <a href="${syncUrl}" 
                             style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 36px; border-radius: 10px; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(99,102,241,0.4);">
                            ✨ Synchronize My Account
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Info Box -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius: 10px; background: #f0f0ff; border: 1px solid #e0e0ff;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="color: #4338ca; font-size: 13px; line-height: 1.6; margin: 0;">
                            <strong>What happens when you click?</strong><br>
                            • Your accounts will be linked across both academies<br>
                            • Your current password will work everywhere<br>
                            • You can switch between academies from your dashboard
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px 28px; border-top: 1px solid #f0f0f0;">
                    <p style="color: #a1a1aa; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                      This invitation expires in 7 days. If you didn't expect this, you can safely ignore this email.
                    </p>
                    <p style="color: #d4d4d8; font-size: 11px; margin: 12px 0 0 0; text-align: center;">
                      Powered by Joor — Academy Management System
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  })

  if (error) {
    console.error('[SyncInvitation] Resend error:', error)
    return { error: 'Failed to send invitation email.' }
  }

  return { success: true, data }
}
