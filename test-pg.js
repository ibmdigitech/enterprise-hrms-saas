const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'hr_system',
  user: 'hr_admin',
  password: 'postgres',
});
async function main() {
  await client.connect();
  const res = await client.query('SELECT * FROM pg_roles WHERE rolname=\'hr_admin\'');
  console.log(res.rows);
  await client.end();
}
main().catch(console.error);