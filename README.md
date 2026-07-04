# Anēk | Ek Se Anēk - Community Civic Network

Anēk (अनेक) is India's community-driven, reward-based platform for civic action. The philosophy is simple: one person (**'Ek'**) taking initiative can inspire a wider community (**'Anēk'**). 

This platform empowers citizens to take charge of their neighborhoods, report local issues, collaborate with neighbors, and earn rewards (Good Citizen Points - GCP) for driving real change.

---

## 🏗️ Architecture Overview

The project is structured as a decoupled Client-Server architecture:

```
├── frontend/             # Client-side SPA built with Vite
└── backend/              # REST API & Socket.IO server built with Node/Express
```

### ⚡ Tech Stack
* **Frontend**: HTML5, Vanilla JavaScript (ES modules), Tailwind CSS, Leaflet.js (dynamic mapping), Vite.
* **Backend**: Node.js, Express, MongoDB (Mongoose schemas & geospatial query layer), Socket.IO (real-time notification broadcasts), Cloudinary (secure media cloud uploads), JWT (cookie-based session rotation).

---

## 🚀 Key Features & Capabilities

1. **Dynamic Local Impact Map**:
   * Uses HTML5 Geolocation to automatically request and focus on user coordinates.
   * Renders dynamic pins on a Leaflet map from the backend database, styled dynamically based on category and resolution status.
2. **Interactive Location Picker**:
   * Let users report problems by dropping a draggable map marker or clicking coordinates on a map to report issue sites.
   * Supports media evidence uploads (compressed images and videos) sent to Cloudinary.
3. **Public Landing Feed**:
   * Landing page showcases the latest reports fetched dynamically from the database.
   * Features a "Show More" / "See All" gated authentication redirect flow.
4. **Civic Rewards Ledger**:
   * Standard user registration starting at `0 GCP`.
   * Real-time ledger records GCP gains/spends (reporting: +10 GCP, claiming/resolving: +50 GCP, redeeming: -GCP).
   * Renders dynamic ranks (Vanguard Rank I/II/Elder) based on points thresholds.

---

## 🛠️ How to Setup & Run

### 1. Backend Server Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` folder based on `.env.example`:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   MONGO_URI=your_mongodb_connection_string
   JWT_ACCESS_SECRET=your_jwt_access_secret
   JWT_REFRESH_SECRET=your_jwt_refresh_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```
4. Start the API server in development mode:
   ```bash
   npm run dev
   ```

### 2. Frontend Client Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the Vite client dev server:
   ```bash
   pnpm run dev
   ```
4. Open the local address in your browser (usually `http://localhost:5173`).

---

## 🔒 Security & Data Sanitization

* **XSS Protection**: Secure HTML escaping on validation middleware schemas (`express-validator`).
* **Session Guard**: JWT tokens are signed securely. Refresh tokens rotate and expire on a 7-day TTL basis in MongoDB.
* **Rate Limiting**: Protects API endpoints against brute force attempts using custom rate limit windows.
* **Error payload isolation**: System error details are automatically hidden from client payloads in production mode.

Hope you liked it *hehe*