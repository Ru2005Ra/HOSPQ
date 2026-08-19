# HospiQ Express Backend

This is the Node + Express API for the HospiQ hospital queue app. It runs with the JSON store for local development and is configured to use the Supabase project credentials for the online deployment setup.

## Run locally

1. Open a terminal in this folder.
2. Install dependencies:

```bash
npm install
```

3. Copy the example environment file:

```bash
cp .env.example .env
```

4. Start the server:

```bash
npm run dev
```

The API will run on:

```bash
http://localhost:4000
```

## Main endpoints

- `GET /api/health`
- `POST /api/login`
- `POST /api/register-patient`
- `POST /api/patient/token`
- `POST /api/queue/pass-to-doctor`
- `POST /api/queue/call-next`
- `POST /api/queue/update-vitals`
- `POST /api/lab/request`
- `POST /api/lab/result`
- `POST /api/diagnosis`
- `POST /api/payment`
- `POST /api/dispense`
- `GET /api/emergency`
- `POST /api/emergency`
- `DELETE /api/emergency/:departmentCode`

## Supabase setup

1. Open the Supabase SQL editor.
2. Run [`../supabase/schema.sql`](../supabase/schema.sql), including the `emergency_alert` queue column.
3. Copy `backend/.env.example` to `backend/.env`.
4. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from Supabase project settings. Keep the service-role key only on the backend.

The current local client still uses its localStorage compatibility store and mirrors records to Supabase when the Vite variables are present. The Express API is the deployment entry point for shared online access; connect the frontend API base URL to the deployed API before publishing.

## Deploy to Render

The repository includes `render.yaml`, so you can deploy it as a Blueprint:

1. Push the repository to GitHub.
2. In Render, choose **New > Blueprint** and select the repository.
3. Render will detect `render.yaml` and create the `hospiq-backend` service.
4. Enter the three Supabase secret values when Render asks for them.
5. Deploy and copy the generated URL, for example `https://hospiq-backend.onrender.com`.

For manual deployment, use these values:

1. In Render, click **New > Web Service**.
2. Connect the repository.
3. Set the root directory to `backend`.
4. Use these values:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables:
   - `PORT=10000` (Render usually sets this automatically)
   - `CORS_ORIGIN=https://tanstack-start-app.hospquick-site.workers.dev`
   - `SUPABASE_URL=https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...`
6. Deploy.

## Deploy to Railway

1. Import the repository.
2. Set the service root to `backend`.
3. Use the default Node app settings.
4. Set your environment variables.
5. Launch the service.

## Frontend connection

Update the frontend to fetch from the backend instead of `localStorage`.

Example:

```js
const res = await fetch('http://localhost:4000/api/queue');
const data = await res.json();
```

For production, use your deployed backend URL and configure the frontend API base URL to that address.

## Production note

Do not commit `.env` or expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. The checked-in JSON store is only a local fallback; run the SQL schema and provide the Supabase environment variables before using the API for shared production data.
