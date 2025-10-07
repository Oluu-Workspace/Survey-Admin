# Backend Connection Setup

## ✅ Current Configuration

The Survey Research Platform (Vite app) is now connected to the remote backend:

- **Backend URL**: `https://survey-backend-dkid.onrender.com/api/v1`
- **Status**: ✅ Connected and configured

## 🔐 Login Credentials

Use these credentials to access the platform:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@surveypro.ke` | `admin123` | Full system access |
| **Agent** | `agent@surveypro.ke` | `agent123` | Field agent access |
| **Manager** | `manager@surveypro.ke` | `manager123` | Project manager access |

## 🚀 How to Use

1. **Start the Vite app**:
   ```bash
   cd Survey-Research-Platform
   npm run dev
   ```

2. **Open the app**: Navigate to `http://localhost:8080`

3. **Test the connection**: Click "Test Backend Connection" on the login page

4. **Login**: Use any of the credentials above

## 🔧 API Configuration

The app is configured to automatically connect to the remote backend. The API base URL is set in:

- **File**: `src/services/api.ts`
- **Environment Variable**: `VITE_API_BASE_URL` (optional)
- **Fallback**: `https://survey-backend-dkid.onrender.com/api/v1`

## 📡 Available API Endpoints

The app now includes comprehensive API integration for:

- **Authentication**: Login, register, profile management
- **Agents**: CRUD operations, activation/deactivation
- **Surveys**: Create, update, assign, statistics
- **Responses**: Submit, validate, view statistics
- **Analytics**: Dashboard stats, trends, completion rates
- **Health Check**: Backend connectivity testing

## 🛠️ Development

To change the backend URL:

1. **Environment Variable** (recommended):
   ```bash
   # Create .env file
   VITE_API_BASE_URL=https://your-backend-url.com/api/v1
   ```

2. **Direct Configuration**:
   Edit `src/services/api.ts` and update the `API_BASE_URL` constant

## 🔍 Troubleshooting

If you encounter connection issues:

1. **Check Backend Status**: Use the "Test Backend Connection" button
2. **Verify URL**: Ensure the backend URL is correct
3. **Check CORS**: Backend should allow requests from your frontend domain
4. **Network**: Ensure both frontend and backend are accessible

## 📊 Features Available

With the backend connection, you can now:

- ✅ User authentication and authorization
- ✅ Dashboard with real-time statistics
- ✅ Agent management (create, edit, activate/deactivate)
- ✅ Survey management (create, assign, track)
- ✅ Response collection and validation
- ✅ Analytics and reporting
- ✅ Regional data management

The platform is now fully functional with the remote backend!
