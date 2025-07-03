import dotenv from 'dotenv';
import { testConnection, initializeDatabase } from './src/config/database.js';

dotenv.config();

async function testDatabaseConnection() {
  console.log('🔍 Testing PostgreSQL connection to Supabase...\n');
  
  try {
    // Test connection
    const connected = await testConnection();
    
    if (connected) {
      console.log('✅ Database connection successful!');
      
      // Test table initialization
      console.log('\n🗄️  Testing table initialization...');
      await initializeDatabase();
      console.log('✅ Tables initialized successfully!');
      
      console.log('\n🎉 Your PostgreSQL connection to Supabase is working perfectly!');
      console.log('\n📋 Next steps:');
      console.log('1. Update your Render environment variables with:');
      console.log(`   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.coyrwjexrrfynjaalmpr.supabase.co:5432/postgres`);
      console.log('2. Deploy your backend to Render');
      console.log('3. Test the API endpoints');
      
    } else {
      console.log('❌ Database connection failed!');
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check your DATABASE_URL in .env file');
      console.log('2. Verify your Supabase password');
      console.log('3. Ensure your IP is allowed in Supabase');
    }
  } catch (error) {
    console.error('❌ Error testing database:', error.message);
  }
  
  process.exit(0);
}

testDatabaseConnection(); 