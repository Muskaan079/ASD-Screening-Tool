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
npm run test-db
```

### **2. Test API Endpoints**
```bash
# Health check (should work)
curl https://asd-screening-backend.onrender.com/api/health

# Protected endpoint (should fail without API key)
curl https://asd-screening-backend.onrender.com/api/analytics/statistics

# Protected endpoint (should work with API key)
curl -H "x-api-key: your-api-key" https://asd-screening-backend.onrender.com/api/analytics/statistics
```

### **3. Test Frontend Connection**
Visit: https://asd-screening-tool.vercel.app

## 🚨 **Troubleshooting**

### **Connection Issues**
1. **Check password** - Ensure your Supabase password is correct
2. **Check IP restrictions** - Make sure your IP is allowed in Supabase
3. **Check SSL** - Production requires SSL, development doesn't

### **Authentication Issues**
1. **Check API keys** - Ensure both Render and Vercel have the same API key
2. **Check headers** - Frontend must send `x-api-key` header
3. **Check CORS** - Ensure CORS origin matches your Vercel domain

### **Database Issues**
1. **Check tables** - Run `npm run test-db` to verify table creation
2. **Check permissions** - Ensure your Supabase user has proper permissions
3. **Check connection pool** - Monitor for connection timeouts

## 📊 **Monitoring**

### **Database Health**
- Check Render logs for database connection errors
- Monitor Supabase dashboard for connection activity
- Use `GET /api/admin/cleanup-stats` to check session cleanup

### **API Health**
- Monitor rate limiting in Render logs
- Check authentication failures
- Monitor session cleanup activity

## 🔐 **Security Notes**

1. **Never commit passwords** to version control
2. **Rotate API keys** regularly
3. **Monitor access logs** for suspicious activity
4. **Use HTTPS** in production
5. **Keep dependencies updated**

## 📞 **Support**

If you encounter issues:

1. Check the troubleshooting section above
2. Review Render and Vercel logs
3. Test with `npm run test-db`
4. Verify environment variables are set correctly

---

**🎉 Your Supabase PostgreSQL connection is now ready!** 