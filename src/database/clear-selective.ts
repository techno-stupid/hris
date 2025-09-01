// src/database/clear-selective.ts
// Run this script with: npx ts-node src/database/clear-selective.ts

import { DataSource } from 'typeorm';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'hris_saas',
  synchronize: false,
  logging: false
});

async function listSupabaseUsers() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('⚠️  Supabase not configured');
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const {
    data: { users },
    error
  } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error listing users:', error.message);
    return [];
  }

  return users || [];
}

async function deleteSupabaseUser(email: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Find user by email
  const {
    data: { users },
    error: listError
  } = await supabase.auth.admin.listUsers();

  if (listError || !users) {
    return false;
  }

  const user = users.find((u) => u.email === email);
  if (!user) {
    console.log(`User ${email} not found in Supabase`);
    return false;
  }

  // Delete the user
  const { error } = await supabase.auth.admin.deleteUser(user.id);

  if (error) {
    console.error(`Failed to delete ${email}:`, error.message);
    return false;
  }

  return true;
}

async function clearAllSupabaseUsers() {
  const users = await listSupabaseUsers();

  if (users.length === 0) {
    console.log('No users to delete');
    return;
  }

  for (const user of users) {
    const success = await deleteSupabaseUser(user.email!);
    if (success) {
      console.log(`✅ Deleted: ${user.email}`);
    }
  }
}

async function clearSpecificCompany() {
  await AppDataSource.initialize();

  // List all companies
  const companies = await AppDataSource.query(`
    SELECT id, name, email FROM companies
  `);

  if (companies.length === 0) {
    console.log('No companies found');
    return;
  }

  console.log('\nAvailable companies:');
  companies.forEach((c: any, i: number) => {
    console.log(`  ${i + 1}. ${c.name} (${c.email})`);
  });

  const choice = await question(
    '\nEnter company number to delete (or 0 to cancel): '
  );
  const index = parseInt(choice) - 1;

  if (index < 0 || index >= companies.length) {
    console.log('Cancelled');
    return;
  }

  const company = companies[index];

  console.log(`\nDeleting company: ${company.name}`);

  // Get all employees of this company
  const employees = await AppDataSource.query(
    `
    SELECT email FROM employees WHERE "companyId" = $1
  `,
    [company.id]
  );

  // Delete from database
  await AppDataSource.query(`DELETE FROM employees WHERE "companyId" = $1`, [
    company.id
  ]);
  await AppDataSource.query(`DELETE FROM roles WHERE "companyId" = $1`, [
    company.id
  ]);
  await AppDataSource.query(`DELETE FROM companies WHERE id = $1`, [
    company.id
  ]);

  console.log('✅ Deleted from database');

  // Delete from Supabase
  const deleteFromSupabase = await question(
    'Delete users from Supabase Auth too? (yes/no): '
  );

  if (deleteFromSupabase.toLowerCase() === 'yes') {
    // Delete company admin
    await deleteSupabaseUser(company.email);

    // Delete employees
    for (const emp of employees) {
      await deleteSupabaseUser(emp.email);
    }

    console.log('✅ Deleted from Supabase Auth');
  }
}

async function main() {
  console.log('🧹 HRIS SaaS - Database Cleanup Tool');
  console.log('=====================================\n');

  console.log('What would you like to do?');
  console.log('  1. Clear EVERYTHING (Database + All Supabase Users)');
  console.log('  2. Clear Database Tables Only');
  console.log('  3. Clear Supabase Users Only');
  console.log('  4. Delete Specific Company (with its employees)');
  console.log('  5. List Supabase Users');
  console.log('  0. Exit\n');

  const choice = await question('Enter your choice (0-5): ');

  switch (choice) {
    case '1':
      // Clear everything
      const confirmAll = await question(
        '\n⚠️  Delete ALL data and users? (yes/no): '
      );
      if (confirmAll.toLowerCase() === 'yes') {
        await AppDataSource.initialize();
        await AppDataSource.query(`
          DROP TABLE IF EXISTS employee_roles CASCADE;
          DROP TABLE IF EXISTS employees CASCADE;
          DROP TABLE IF EXISTS roles CASCADE;
          DROP TABLE IF EXISTS companies CASCADE;
          DROP TABLE IF EXISTS subscription_plans CASCADE;
        `);
        console.log('✅ Database cleared');

        await clearAllSupabaseUsers();
        console.log('✅ Supabase users cleared');
      }
      break;

    case '2':
      // Clear database only
      const confirmDb = await question(
        '\n⚠️  Delete all database tables? (yes/no): '
      );
      if (confirmDb.toLowerCase() === 'yes') {
        await AppDataSource.initialize();
        await AppDataSource.query(`
          DROP TABLE IF EXISTS employee_roles CASCADE;
          DROP TABLE IF EXISTS employees CASCADE;
          DROP TABLE IF EXISTS roles CASCADE;
          DROP TABLE IF EXISTS companies CASCADE;
          DROP TABLE IF EXISTS subscription_plans CASCADE;
        `);
        console.log('✅ Database cleared');
      }
      break;

    case '3':
      // Clear Supabase only
      const confirmSupabase = await question(
        '\n⚠️  Delete all Supabase users? (yes/no): '
      );
      if (confirmSupabase.toLowerCase() === 'yes') {
        await clearAllSupabaseUsers();
        console.log('✅ Supabase users cleared');
      }
      break;

    case '4':
      // Delete specific company
      await clearSpecificCompany();
      break;

    case '5':
      // List Supabase users
      const users = await listSupabaseUsers();
      console.log(`\nFound ${users.length} Supabase users:`);
      users.forEach((u) => {
        console.log(`  - ${u.email} (ID: ${u.id})`);
      });
      break;

    case '0':
      console.log('Goodbye!');
      break;

    default:
      console.log('Invalid choice');
  }

  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }

  rl.close();
  process.exit(0);
}

main().catch(console.error);
