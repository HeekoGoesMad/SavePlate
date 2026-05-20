# SavePlate Vercel-Only Deployment

This project can be deployed with:

- Frontend: Vercel project using `frontend/`
- Backend API: Vercel project using `backend/`
- Database: MongoDB Atlas

Use two Vercel projects from the same GitHub repository. This is simpler for the current folder structure.

## 1. Prepare MongoDB Atlas

In MongoDB Atlas:

1. Go to **Database Access** and create a database user.
2. Go to **Network Access** and add this IP access rule for a simple student/demo deployment:

```text
0.0.0.0/0
```

3. Go to **Database > Connect > Drivers** and copy your connection string.
4. Add your database name to the URI:

```text
mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/saveplate?retryWrites=true&w=majority
```

This full value is your `MONGODB_URI`.

## 2. Deploy Backend API To Vercel

In Vercel:

1. Click **Add New > Project**.
2. Import your GitHub repository.
3. Set **Root Directory** to:

```text
backend
```

4. Set **Framework Preset** to:

```text
Other
```

5. Use these commands:

```text
Install Command: npm ci
Build Command: leave empty
Output Directory: leave empty
```

6. Add these environment variables:

```text
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=replace-with-a-long-random-secret
CORS_ORIGIN=http://localhost:5173
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-brevo-smtp-user
BREVO_SMTP_PASS=your-brevo-smtp-password
FROM_EMAIL="SavePlate" <noreply@example.com>
```

Only the Brevo variables are optional. Registration/login that sends OTP email needs them.

7. Deploy.
8. After deployment, test:

```text
https://YOUR_BACKEND_PROJECT.vercel.app/api/health
```

The root URL also returns a small API status response:

```text
https://YOUR_BACKEND_PROJECT.vercel.app/
```

If Vercel shows `404: NOT_FOUND`, make sure the latest GitHub commit includes `backend/api/index.js` and `backend/vercel.json`, then redeploy.

## 3. Deploy Frontend To Vercel

Create another Vercel project from the same GitHub repo:

1. Click **Add New > Project**.
2. Import the same repository.
3. Set **Root Directory** to:

```text
frontend
```

4. Set **Framework Preset** to:

```text
Vite
```

5. Add this environment variable:

```text
VITE_API_URL=https://YOUR_BACKEND_PROJECT.vercel.app/api
```

6. Deploy.

## 4. Update Backend CORS

After the frontend deploys, copy the frontend Vercel URL, then go back to the backend Vercel project.

Update:

```text
CORS_ORIGIN=https://YOUR_FRONTEND_PROJECT.vercel.app
```

If you also want local development to keep working:

```text
CORS_ORIGIN=http://localhost:5173,https://YOUR_FRONTEND_PROJECT.vercel.app
```

Redeploy the backend after changing the environment variable.

## 5. Local Development

Frontend local env:

```text
frontend/.env.local
VITE_API_URL=http://localhost:3000/api
```

Backend local env:

```text
backend/.env
PORT=3000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret
CORS_ORIGIN=http://localhost:5173
```

Run locally:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run dev
```

## Notes

- Do not commit real `.env` files.
- Vercel free Hobby is suitable for a personal/student project, but serverless functions can cold start.
- The backend uses Vercel Functions, so it should not call `app.listen()` during deployment. This repo already has the Vercel adapter in `backend/api/index.js`.
