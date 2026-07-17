import { readFileSync } from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';

// 1. Read .env file to extract DATABASE_URL
const envPath = path.resolve('.env');
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  try {
    const envContent = readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) {
      databaseUrl = match[1];
    }
  } catch (err) {
    console.error('Error reading .env file:', err.message);
  }
}

if (!databaseUrl) {
  console.error('DATABASE_URL not found in process.env or .env file');
  process.exit(1);
}

console.log('Connecting to Neon Database...');
const sql = neon(databaseUrl);

const migrationFiles = [
  '001-create-schema.sql',
  '003-update-documents-table.sql',
  '004-add-user-port.sql',
  '005-add-oficial-cim-role.sql',
  '006-add-submitted-status.sql',
  '007-create-notifications-table.sql',
  '008-add-vessel-type-fields.sql'
];

async function runMigrations() {
  for (const file of migrationFiles) {
    const filePath = path.join('scripts', file);
    console.log(`Running migration: ${file}...`);
    try {
      const sqlContent = readFileSync(filePath, 'utf8');
      
      // Execute the migration SQL script
      await sql(sqlContent);
      console.log(`Migration ${file} completed successfully.`);
    } catch (err) {
      console.error(`Error running migration ${file}:`, err);
      process.exit(1);
    }
  }
  console.log('All migrations completed successfully!');
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
