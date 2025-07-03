# Database Migration Guide: In-Memory to Supabase

This guide will help you migrate the ASD Screening Tool from in-memory storage to Supabase (PostgreSQL).

## Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Node.js**: Version 18 or higher
3. **Environment Variables**: Set up your `.env` file

## Step 1: Set Up Supabase Project

1. **Create a new Supabase project**:
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization
   - Enter project name (e.g., "asd-screening-tool")
   - Set a database password
   - Choose a region close to your users

2. **Get your project credentials**:
   - Go to Settings → API
   - Copy the following values:
     - Project URL
     - Anon public key
     - Service role key (for admin operations)

## Step 2: Configure Environment Variables

1. **Copy the environment template**:
   ```bash
   cp env.example .env
   ```

2. **Update your `.env` file** with your Supabase credentials:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # CORS Configuration
   CORS_ORIGIN=http://localhost:5173

   # API Keys
   OPENAI_API_KEY=your_openai_api_key_here

   # Supabase Database Configuration
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

## Step 3: Set Up Database Schema

1. **Open your Supabase project dashboard**
2. **Go to SQL Editor**
3. **Run the migration script**:
   - Copy the contents of `database/migrations/001_initial_schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the migration

This will create the following tables:
- `users` - Patient and practitioner information
- `screening_sessions` - Session metadata and state
- `session_responses` - Individual question responses
- `emotion_history` - Real-time emotion tracking data
- `motion_history` - Motion and behavior tracking data
- `clinical_reports` - Generated clinical reports

## Step 4: Install Dependencies

```bash
cd backend
npm install
```

This will install the Supabase client library and other required dependencies.

## Step 5: Test Database Connection

Run the database setup script to verify everything is working:

```bash
npm run setup-db
```

This script will:
- Test the Supabase connection
- Verify all tables exist
- Create sample data for testing
- Provide feedback on the setup

## Step 6: Start the Backend Server

```bash
npm start
```

The server will now:
- Initialize the database connection
- Use Supabase for all data operations
- Log database connection status

## Step 7: Verify Migration

### Test API Endpoints

1. **Health Check**:
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Create a Session**:
   ```bash
   curl -X POST http://localhost:3001/api/screening/start \
     -H "Content-Type: application/json" \
     -d '{
       "patientInfo": {
         "name": "Test Patient",
         "age": 25,
         "gender": "other"
       }
     }'
   ```

3. **Get Analytics**:
   ```bash
   curl http://localhost:3001/api/analytics/statistics
   ```

### Check Database

1. **View data in Supabase Dashboard**:
   - Go to Table Editor in your Supabase dashboard
   - You should see your tables populated with data

2. **Monitor real-time data**:
   - Use the Supabase dashboard to monitor data as you use the application

## Database Schema Overview

### Tables Structure

```sql
-- Users table
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  name VARCHAR NOT NULL,
  age INTEGER,
  gender VARCHAR(10),
  role VARCHAR(20) DEFAULT 'patient',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Screening sessions
screening_sessions (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES users(id),
  patient_info JSONB NOT NULL,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  current_question JSONB,
  total_questions INTEGER DEFAULT 20,
  adaptive_data JSONB DEFAULT '{}',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Session responses
session_responses (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES screening_sessions(id),
  question_id VARCHAR NOT NULL,
  answer TEXT,
  confidence DECIMAL(3,2),
  response_time INTEGER,
  emotion_data JSONB,
  motion_data JSONB,
  voice_data JSONB,
  analysis JSONB,
  created_at TIMESTAMP
)

-- Emotion history
emotion_history (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES screening_sessions(id),
  emotions JSONB NOT NULL,
  dominant_emotion VARCHAR(50),
  confidence DECIMAL(3,2),
  timestamp TIMESTAMP
)

-- Motion history
motion_history (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES screening_sessions(id),
  motion_data JSONB NOT NULL,
  repetitive_motions BOOLEAN DEFAULT FALSE,
  fidgeting BOOLEAN DEFAULT FALSE,
  patterns JSONB,
  timestamp TIMESTAMP
)

-- Clinical reports
clinical_reports (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES screening_sessions(id),
  patient_id UUID REFERENCES users(id),
  practitioner_info JSONB,
  report_data JSONB NOT NULL,
  assessment JSONB,
  recommendations JSONB,
  created_at TIMESTAMP
)
```

## Features Enabled by Supabase

### 1. **Real-time Data**
- Live updates across multiple clients
- WebSocket connections for real-time features

### 2. **Row Level Security (RLS)**
- Secure data access based on user roles
- Automatic data filtering

### 3. **Advanced Queries**
- Complex analytics and reporting
- Efficient data aggregation

### 4. **Data Persistence**
- No data loss on server restart
- Automatic backups

### 5. **Scalability**
- Handles multiple concurrent users
- Automatic scaling

## Troubleshooting

### Common Issues

1. **Connection Failed**:
   - Verify SUPABASE_URL and SUPABASE_ANON_KEY in `.env`
   - Check if your Supabase project is active
   - Ensure you've run the SQL migration

2. **Tables Not Found**:
   - Run the SQL migration script in Supabase SQL Editor
   - Check for any SQL errors in the migration

3. **Permission Denied**:
   - Verify RLS policies are set correctly
   - Check if you're using the correct API key

4. **Data Not Persisting**:
   - Ensure you're not using the old in-memory service
   - Check database connection logs

### Debug Commands

```bash
# Test database connection
npm run setup-db

# Check server logs
npm start

# Run tests
npm test
```

## Migration Checklist

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] SQL migration executed
- [ ] Dependencies installed
- [ ] Database connection tested
- [ ] API endpoints verified
- [ ] Sample data created
- [ ] Frontend integration tested

## Next Steps

After successful migration:

1. **Update Frontend**: Ensure frontend is connecting to the new backend
2. **Test All Features**: Verify all functionality works with Supabase
3. **Monitor Performance**: Use Supabase dashboard to monitor usage
4. **Set Up Backups**: Configure automatic backups in Supabase
5. **Security Review**: Review and customize RLS policies

## Support

If you encounter issues:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review the server logs for error messages
3. Verify your environment configuration
4. Test with the setup script: `npm run setup-db` 