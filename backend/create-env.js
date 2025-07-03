import fs from 'fs';

// URL encode the password to handle special characters
const password = 'qM8sB4w)4$#r$$5';
const encodedPassword = encodeURIComponent(password);

const envContent = `# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Security Configuration
API_SECRET_KEY=test_api_key_for_testing
JWT_SECRET=test_jwt_secret_for_testing

# API Keys
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Database Configuration
SUPABASE_URL=https://coyrwjexrrfynjaalmpr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNveXJ3amV4cnJmeW5qYWFsbXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjYzMTIsImV4cCI6MjA2NzEwMjMxMn0.nVZERCvL4K90dtUJjW6hchzgSpF_yzHbrNtEz-XZ6Cw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNveXJ3amV4cnJmeW5qYWFsbXByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyNjMxMiwiZXhwIjoyMDY3MTAyMzEyfQ.__lkF2q7_W6EiZV0BROsldUBFHQNRzwxXP76K6x9vuc

# PostgreSQL Connection (Direct connection to Supabase)
DATABASE_URL=postgresql://postgres:${encodedPassword}@db.coyrwjexrrfynjaalmpr.supabase.co:5432/postgres
`;

fs.writeFileSync('.env', envContent);
console.log('✅ .env file created successfully');
console.log('Encoded password:', encodedPassword); 