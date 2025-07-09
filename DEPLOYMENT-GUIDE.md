# 🚀 ILOS Backend - Vercel Deployment Guide

## ✅ Prerequisites Completed
- ✅ Vercel serverless functions created
- ✅ All routes converted to serverless endpoints
- ✅ CORS handling implemented
- ✅ Environment variables configured
- ✅ Git repository updated with main branch

## 📋 Deployment Steps

### 1. Vercel Project Setup
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import from Git repository: `https://github.com/intelikimu/ILOS-Backend`
4. Select **main branch** (default)
5. Click **"Deploy"**

### 2. Environment Variables Setup
Go to your Vercel project → Settings → Environment Variables and add:

```env
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_PORT=3306
NODE_ENV=production
```

### 3. Deployment Configuration
The project includes `vercel.json` with all route configurations:
- ✅ Health check: `/health`
- ✅ Customer lookup: `/getNTB_ETB`
- ✅ CIF details: `/cif/:id`
- ✅ All API routes: `/api/*`

### 4. Test Deployment
After deployment, test these endpoints:
- **Health**: `https://your-project.vercel.app/health`
- **Customer lookup**: `https://your-project.vercel.app/getNTB_ETB`
- **Applications**: `https://your-project.vercel.app/api/applications`

## 🔧 Local Development
```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Test endpoints
curl http://localhost:5000/health
```

## 📝 Available Endpoints

### Core Endpoints
- `GET /health` - Health check
- `POST /getNTB_ETB` - Customer status lookup
- `GET /cif/:consumerId` - CIF details

### Application Endpoints
- `POST /api/applications` - Create application
- `GET /api/applications` - Get applications
- `GET /api/applications/:id` - Get application by ID
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application

### Data Endpoints
- `/api/personal-details` - Personal details management
- `/api/current-address` - Current address management
- `/api/permanent-address` - Permanent address management
- `/api/employment-details` - Employment details management
- `/api/reference-contacts` - Reference contacts management
- `/api/vehicle-details` - Vehicle details management
- `/api/insurance-details` - Insurance details management
- `/api/contact-details` - Contact details management
- `/api/verification` - Verification management

### Product Endpoints
- `/api/autoloan` - Auto loan applications
- `/api/cashplus` - Cash plus applications
- `/api/creditcard` - Credit card applications

## 🔍 Troubleshooting

### Common Issues:
1. **Database Connection**: Verify environment variables
2. **CORS Errors**: Check CORS configuration in `_utils.js`
3. **Route Not Found**: Verify `vercel.json` routing
4. **Timeout**: Check function timeout settings

### Logs:
- Vercel Dashboard → Functions → View logs
- Real-time logs: `vercel logs`

## 🏆 Success Indicators
- ✅ All endpoints return proper responses
- ✅ CORS headers included
- ✅ Database connections working
- ✅ No timeout errors
- ✅ Environment variables loaded

## 🔗 Next Steps
1. Deploy frontend to Vercel
2. Update frontend `NEXT_PUBLIC_API_URL` to backend URL
3. Test full integration
4. Monitor performance and logs

---
**Backend Deployment Status: ✅ READY FOR PRODUCTION** 