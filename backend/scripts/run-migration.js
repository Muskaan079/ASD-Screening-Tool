#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📋 Database Migration Instructions');
console.log('==================================\n');

console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the following SQL script:\n');

// Read and display the migration file
const migrationPath = path.join(__dirname, '../database/migrations/001_initial_schema.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');

console.log(migrationContent);
console.log('\n4. Click "Run" to execute the migration');
console.log('5. Verify all tables were created successfully');
console.log('6. Return here and run: npm run setup-db'); 