const fs = require('fs');
const path = require('path');

// อ่าน .env.local
const envPath = path.join(__dirname, 'sirinx-app', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return match ? match[1].trim() : null;
};

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

console.log('🔍 ทดสอบ Supabase Connection...');
console.log(`URL: ${url}`);
console.log(`KEY: ${key ? key.substring(0, 20) + '...' : 'ไม่พบ'}`);
console.log('');

async function test() {
  try {
    // Test 1: REST API root
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    if (res.ok || res.status === 200) {
      console.log(`✅ REST API: ${res.status} - เชื่อมต่อสำเร็จ!`);
    } else {
      const body = await res.text();
      console.log(`❌ REST API: ${res.status} - ${body}`);
    }

    // Test 2: Auth health
    const authRes = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
    });
    const authBody = await authRes.json();
    if (authRes.ok) {
      console.log(`✅ Auth Service: ${authRes.status} - ${JSON.stringify(authBody)}`);
    } else {
      console.log(`❌ Auth Service: ${authRes.status} - ${JSON.stringify(authBody)}`);
    }

  } catch (err) {
    console.log(`❌ Connection Error: ${err.message}`);
  }
}

test();
