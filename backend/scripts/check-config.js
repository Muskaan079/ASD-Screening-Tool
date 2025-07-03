#!/usr/bin/env node

import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

console.log('🔧 Configuration Check');
console.log('======================\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('❌ .env file not found');
  console.log('   Please create a .env file with your configuration');
  process.exit(1);
}

console.log('✅ .env file found');

// Check required environment variables
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

const missingVars = [];
const configuredVars = [];

for (const varName of requiredVars) {
  const value = process.env[varName];
  if (!value || value.includes('your_') || value === '') {
    missingVars.push(varName);
  } else {
    configuredVars.push(varName);
  }
}

if (configuredVars.length > 0) {
  console.log('✅ Configured variables:');
  configuredVars.forEach(varName => {
    const value = process.env[varName];
    const displayValue = varName.includes('KEY') ? 
      value.substring(0, 10) + '...' : value;
    console.log(`   ${varName}: ${displayValue}`);
  });
}

if (missingVars.length > 0) {
  console.log('\n❌ Missing or unconfigured variables:');
  missingVars.forEach(varName => {
    console.log(`   ${varName}`);
  });
  
  console.log('\n📋 To configure these variables:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to Settings → API');
  console.log('3. Copy the Project URL and anon public key');
  console.log('4. Update your .env file with these values');
  console.log('\nExample:');
  console.log('SUPABASE_URL=https://your-project-id.supabase.co');
  console.log('SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  
  process.exit(1);
}

console.log('\n🎉 All required variables are configured!');
console.log('\n📋 Next steps:');
console.log('1. Run the database migration: npm run migration');
console.log('2. Execute the SQL script in your Supabase SQL Editor');
console.log('3. Test the setup: npm run setup-db');
console.log('4. Start the server: npm start'); 