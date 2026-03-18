const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function test() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = 'nonexistent@example.com';

  console.log('Testing with URL:', url);
  console.log('Testing with Service Role Key (prefix):', key?.substring(0, 10));

  const supabaseAdmin = createClient(url, key, {
    auth: { persistSession: false }
  });

  try {
    console.log('Checking user by email...');
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    console.log('User data:', userData);
    console.log('User error:', userError);

    if (userData?.user) {
      console.log('Checking profile for user:', userData.user.id);
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userData.user.id)
        .single();
      console.log('Profile data:', profileData);
      console.log('Profile error:', profileError);
    } else {
      console.log('User not found, as expected for test email.');
    }
  } catch (err) {
    console.error('Test failed with exception:', err);
  }
}

test();
