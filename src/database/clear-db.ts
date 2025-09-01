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
  logging: true
});

async function clearSupabaseUsers() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('⚠️  Supabase not configured - skipping auth user cleanup');
    return;
  }

  console.log('\n📋 Clearing Supabase Auth Users...');

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // List all users
    const {
      data: { users },
      error: listError
    } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('✅ No users to delete in Supabase');
      return;
    }

    console.log(`Found ${users.length} users in Supabase Auth`);

    // Ask for confirmation before deleting users
    const confirmDelete = await question(
      `⚠️  This will delete ${users.length} users from Supabase Auth. Continue? (yes/no): `
    );

    if (confirmDelete.toLowerCase() !== 'yes') {
      console.log('Skipping Supabase user deletion');
      return;
    }

    // Delete each user
    let deletedCount = 0;
    let failedCount = 0;

    for (const user of users) {
      try {
        const { error } = await supabase.auth.admin.deleteUser(user.id);

        if (error) {
          console.error(
            `❌ Failed to delete user ${user.email}:`,
            error.message
          );
          failedCount++;
        } else {
          console.log(`✅ Deleted user: ${user.email}`);
          deletedCount++;
        }
      } catch (err) {
        console.error(`❌ Error deleting user ${user.email}:`, err);
        failedCount++;
      }
    }

    console.log(`\n📊 Supabase Users Summary:`);
    console.log(`   ✅ Deleted: ${deletedCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
  } catch (error) {
    console.error('❌ Error clearing Supabase users:', error);
  }
}

async function clearDatabase() {
  try {
    console.log('\n📋 Clearing Database Tables...');
    await AppDataSource.initialize();
    console.log('✅ Connected to database');

    // Get all tables (excluding TypeORM migrations table)
    const tables = await AppDataSource.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'migrations'
    `);

    if (tables.length === 0) {
      console.log('✅ No tables to drop');
      return;
    }

    console.log(`Found ${tables.length} tables to drop`);

    // Drop all tables with CASCADE
    for (const { tablename } of tables) {
      const query = `DROP TABLE IF EXISTS "${tablename}" CASCADE`;
      console.log(`Dropping table: ${tablename}`);
      await AppDataSource.query(query);
    }

    console.log('✅ All database tables cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

async function main() {
  console.log('🧹 HRIS SaaS - Complete Database & Auth Clear Script');
  console.log('====================================================\n');

  console.log('⚠️  WARNING: This script will:');
  console.log('   1. Delete ALL tables from your database');
  console.log('   2. Delete ALL users from Supabase Auth');
  console.log('   This action cannot be undone!\n');

  const confirm = await question(
    'Are you sure you want to continue? (yes/no): '
  );

  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Operation cancelled');
    rl.close();
    process.exit(0);
  }

  try {
    // Clear database tables first
    await clearDatabase();

    // Then clear Supabase users
    await clearSupabaseUsers();

    console.log('\n✅ Complete cleanup finished!');
    console.log('\n📝 Next steps:');
    console.log('   1. Make sure SEED_DATABASE=true in your .env file');
    console.log('   2. Run: npm run start:dev');
    console.log('   3. The seeder will create fresh demo data\n');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run the script
main().catch(console.error);
