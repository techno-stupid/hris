// Run this script with: npx ts-node src/database/clear-db.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

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

async function clearDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('Connected to database');

    // Drop all tables in the correct order (reverse of dependencies)
    const queries = [
      'DROP TABLE IF EXISTS employee_roles CASCADE',
      'DROP TABLE IF EXISTS employees CASCADE',
      'DROP TABLE IF EXISTS roles CASCADE',
      'DROP TABLE IF EXISTS companies CASCADE',
      'DROP TABLE IF EXISTS subscription_plans CASCADE'
    ];

    for (const query of queries) {
      console.log(`Executing: ${query}`);
      await AppDataSource.query(query);
    }

    console.log('Database cleared successfully!');
    console.log('Now restart your application with SEED_DATABASE=true');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

clearDatabase();
