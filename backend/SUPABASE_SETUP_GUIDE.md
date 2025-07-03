# Supabase Setup Guide

This guide will walk you through setting up Supabase for your ASD Screening Tool.

## Step 1: Create Supabase Account

1. **Go to [supabase.com](https://supabase.com)**
2. **Click "Start your project"**
3. **Sign up with GitHub, Google, or email**
4. **Verify your email if required**

## Step 2: Create a New Project

1. **Click "New Project"**
2. **Choose your organization** (create one if needed)
3. **Fill in project details:**
   - **Name**: `asd-screening-tool`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your location
4. **Click "Create new project"**
5. **Wait for project to be created** (2-3 minutes)

## Step 3: Get Your API Credentials

1. **In your project dashboard, go to Settings → API**
2. **Copy these values:**

### Project URL
```
https://your-project-id.supabase.co
```

### Anon Public Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdG5wdmJqY2JqY2JqY2JqY2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDQ0NDQ0NDQsImV4cCI6MTk2MDAyMDQ0NH0.example
```

### Service Role Key (Optional but recommended)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdG5wdmJqY2JqY2JqY2JqY2JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0NDQ0NDQ0NCwiZXhwIjoxOTYwMDIwNDQ0fQ.example
```

## Step 4: Update Your .env File

1. **Open your `.env` file** in the backend directory
2. **Replace the placeholder values** with your actual credentials:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# API Keys
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Database Configuration
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here

# Database URL (alternative to Supabase)
DATABASE_URL=postgresql://username:password@localhost:5432/asd_screening_db
```

## Step 5: Run Database Migration

1. **In your Supabase dashboard, go to SQL Editor**
2. **Copy the SQL script** from the migration output
3. **Paste it into the SQL editor**
4. **Click "Run"**
5. **Verify all tables were created** (check Table Editor)

## Step 6: Test Your Setup

Run these commands in order:

```bash
# Check configuration
npm run check-config

# Test database connection
npm run setup-db

# Start the server
npm start
```

## Troubleshooting

### Common Issues

1. **"Connection failed"**
   - Check your SUPABASE_URL and SUPABASE_ANON_KEY
   - Ensure your project is active
   - Verify you've run the SQL migration

2. **"Tables not found"**
   - Run the SQL migration script in Supabase SQL Editor
   - Check for any SQL errors

3. **"Permission denied"**
   - Verify RLS policies are set correctly
   - Check if you're using the correct API key

### Getting Help

- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Community Forum**: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)

## Next Steps

Once setup is complete:

1. **Test API endpoints**
2. **Connect your frontend**
3. **Monitor usage in Supabase dashboard**
4. **Set up backups and monitoring** 