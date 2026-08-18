# HospiQ Express Backend

This is a simple Node + Express API for the HospiQ hospital queue app.

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

## Deploy to Render

1. Push this folder to GitHub.
2. In Render, click New > Web Service.
3. Connect the repository.
4. Set the root directory to `backend`.
5. Use these values:
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add environment variables:
   - `PORT=10000` (Render usually sets this automatically)
   - `CORS_ORIGIN=https://your-frontend-domain.com`
7. Deploy.

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

For production, use your deployed backend URL.

## Production note

This backend currently stores data in a JSON file. That is fine for a demo or MVP, but for a real production app you should move to PostgreSQL or MongoDB.
