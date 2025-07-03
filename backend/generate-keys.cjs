const crypto = require('crypto');

console.log('🔑 Generating secure keys for your deployment...\n');

// Generate API Secret Key
const apiSecretKey = crypto.randomBytes(32).toString('hex');
console.log(`API_SECRET_KEY=${apiSecretKey}`);

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log(`JWT_SECRET=${jwtSecret}`);

console.log('\n📋 Copy these keys to your environment variables:');
console.log('1. Render (Backend): Add both keys');
console.log('2. Vercel (Frontend): Add API_SECRET_KEY as REACT_APP_API_KEY');
console.log('\n⚠️  Keep these keys secure and never commit them to version control!'); 