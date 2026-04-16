const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [k, v] = line.split('=');
    env[k.trim()] = v.trim();
  }
});

const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
);

async function checkUser() {
  const email = `testadmin${Math.floor(Math.random() * 10000)}@gmail.com`;
  const password = 'Password123!';
  
  console.log('Creating temporary admin user to check DB...');
  
  // 1. Create a temp user
  const { data: authData, error: signupErr } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: 'Temp Admin' } }
  });

  if (signupErr) {
    console.error('Signup failed:', signupErr.message);
    return;
  }

  // 2. Make them an admin (simulate what the registration page does)
  const { error: promoteErr } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', authData.user.id);
    
  if (promoteErr) {
    console.error('Promote failed:', promoteErr.message);
    return;
  }

  // Verify we actually became admin
  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single();
  console.log(`Temp Admin Role: ${myProfile?.role}`);

  // 3. Now we are logged in as this admin. Query the target UID.
  const targetUid = '5f5ed338-8239-48e9-8cfb-2eece35c226d';
  console.log(`Querying profile for UID: ${targetUid}...`);
  
  const { data: targetProfile, error: fetchErr } = await supabase
    .from('profiles')
    .select('name, role, created_at')
    .eq('id', targetUid)
    .maybeSingle();

  if (fetchErr) {
    console.error('Fetch failed:', fetchErr.message);
  } else if (!targetProfile) {
    console.log(`\n❌ USER NOT FOUND! The UID ${targetUid} does not exist in the profiles table.\n`);
  } else {
    console.log('\n✅ RESULT FIELD FOR THAT USER:');
    console.log('------------------------------');
    console.log(`Name: ${targetProfile.name}`);
    console.log(`Role: ${targetProfile.role.toUpperCase()}`);
    console.log(`Created: ${targetProfile.created_at}`);
    console.log('------------------------------\n');
  }

  // Cleanup: can't delete user easily without service key, but we can downgrade the role
  await supabase.from('profiles').update({ role: 'member' }).eq('id', authData.user.id);
  console.log('Done.');
}

checkUser();
