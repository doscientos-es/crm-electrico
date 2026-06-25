import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';

async function executeSql() {
  const sqlFilePath = process.argv[2] || 'temp/import.sql';
  const connectionString = process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    console.error('Error: SUPABASE_DB_URL environment variable is not set.');
    process.exit(1);
  }

  if (!fs.existsSync(sqlFilePath)) {
    console.error(`Error: SQL file not found at ${sqlFilePath}`);
    process.exit(1);
  }

  console.log(`Reading SQL file: ${sqlFilePath}...`);
  const sql = fs.readFileSync(sqlFilePath, 'utf8');

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Executing SQL...');
    
    // Split the SQL into statements if necessary, but pg.Client.query can handle multiple statements
    // if they are semicolon separated, especially if it's one big transaction.
    const res = await client.query(sql);
    console.log('SQL executed successfully.');
    
    if (Array.isArray(res)) {
        console.log(`Total statements executed: ${res.length}`);
    }
  } catch (err) {
    console.error('Error executing SQL:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

executeSql();
