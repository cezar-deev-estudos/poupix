const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function run() {
  const r1 = await fetch(url + '/rest/v1/categories?select=id,name,parent_id,type', {
    headers: { apikey: key, Authorization: 'Bearer ' + key }
  });
  const resText = await r1.text();
  console.log('Status:', r1.status);
  try {
    const cats = JSON.parse(resText);
    if (Array.isArray(cats)) {
      console.log('Total cats:', cats.length);
      cats.forEach(c => {
        if (c.name.toLowerCase().includes('transp') || c.name.toLowerCase().includes('uber') || c.name.toLowerCase().includes('carro')) {
          console.log('Cat:', c.id, c.name, 'parent_id:', c.parent_id);
        }
      });
    } else {
      console.log('Objeto retornado:', cats);
    }
  } catch(e) {
    console.error('Erro parse:', resText);
  }
}
run();
