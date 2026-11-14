const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5434,
  user: 'hr_admin',
  password: 'postgres',
  database: 'hr_system',
  ssl: false,
});

async function test() {
  try {
    console.log('Connecting with pg (no SSL)...');
    await client.connect();
    console.log('Connected!');
    const res = await client.query('SELECT 1');
    console.log('Result:', res.rows);
  } catch(e) {
    console.error('Error:', e.message, e.code);
  } finally {
    await client.end();
  }
}

test();