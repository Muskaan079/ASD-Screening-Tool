# Supabase PostgreSQL Connection Setup

This guide will help you connect your ASD Screening Tool backend to Supabase using the PostgreSQL connection string.

## 🔗 **Your Supabase Connection**

**Connection String:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.coyrwjexrrfynjaalmpr.supabase.co:5432/postgres
```

## 📋 **Setup Steps**

### **1. Get Your Supabase Password**

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **Settings → Database**
3. Find your **Database Password**
4. Copy the password (you'll need it for the connection string)

### **2. Test Local Connection**

```bash
# Set up your local environment
npm run setup-db-connection

# Enter your Supabase password when prompted

# Test the connection
npm run test-db
```

### **3. Update Render Environment Variables**

In your Render dashboard for `https://asd-screening-backend.onrender.com`, add:

```env
# Database Connection
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.coyrwjexrrfynjaalmpr.supabase.co:5432/postgres

# Security (Generate these)
API_SECRET_KEY=your_secure_api_key_here
JWT_SECRET=your_jwt_secret_key_here

# Environment
NODE_ENV=production
CORS_ORIGIN=https://asd-screening-tool.vercel.app

# Optional: OpenAI
OPENAI_API_KEY=your_openai_api_key_here
```

### **4. Update Vercel Environment Variables**

In your Vercel dashboard for `https://asd-screening-tool.vercel.app`, add:

```env
REACT_APP_API_KEY=your_secure_api_key_here
REACT_APP_API_URL=https://asd-screening-backend.onrender.com/api
```

## 🔧 **What Changed**

### **New Database Configuration**
- ✅ Direct PostgreSQL connection to Supabase
- ✅ Automatic table creation and indexing
- ✅ Connection pooling for better performance
- ✅ SSL support for production

### **Security Improvements**
- ✅ API key authentication
- ✅ Rate limiting
- ✅ Session cleanup
- ✅ Data anonymization

### **Database Tables Created**
- `screening_sessions` - Store screening sessions
- `session_responses` - Store question responses
- `emotion_history` - Store emotion tracking data
- `motion_history` - Store motion tracking data
- `clinical_reports` - Store generated reports
- `users` - Store user information

## 🧪 **Testing Your Setup**

### **1. Test Database Connection**
```bash
node test-db-connection.js
```

### **2. Test API Endpoints**
```