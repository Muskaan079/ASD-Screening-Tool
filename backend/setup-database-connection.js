import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Setting up PostgreSQL connection to Supabase...\n');

// Get password from user input
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter your Supabase database password: ', (password) => {
  const envContent = `# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Security Configuration (Generate these)
API_SECRET_KEY=test_api_key_for_development
JWT_SECRET=test_jwt_secret_for_development

# PostgreSQL Connection to Supabase
DATABASE_URL=postgresql://postgres:${password}@db.coyrwjexrrfynjaalmpr.supabase.co:5432/postgres

# Optional: OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here
`;

  const envPath = path.join(__dirname, '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: node test-db-connection.js');
    console.log('2. If successful, update your Render environment variables');
    console.log('3. Deploy to Render');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  }
  
  rl.close();
}); 