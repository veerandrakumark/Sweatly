# Project Setup Guide - Sweatly

Follow this guide to set up the Sweatly development environment.

## Prerequisites
*   **Node.js:** version 18.x or 20.x
*   **MongoDB:** Local installation running on `mongodb://localhost:27017` (or Docker container)
*   **Docker Desktop:** Optional, for containerized deployments

---

## 1. Initial Setup
1. Clone the project and navigate into the root directory.
2. Run the environment copy utility:
   ```bash
   # Unix users
   ./scripts/setup.sh

   # Windows PowerShell users
   .\scripts\setup.ps1
   ```
   This will automatically copy `.env.example` templates to `.env` files in `client/` and `server/` subfolders.
3. Verify that the `.env` settings in the `server` folder match your local MongoDB connection URI:
   ```env
   MONGODB_URI=mongodb://localhost:27017/sweatly
   ```

---

## 2. Bootstrapping Dependencies
Install node modules globally across all workspaces from the root folder:
```bash
npm install
```
This triggers Husky setup, installs dependencies (like React, Tailwind, Express, Mongoose, Zod, ts-node), and maps npm workspaces.

---

## 3. Running the Services

### Standard Local Execution
Start both the React client and the Express backend concurrently:
```bash
npm run dev
```
The React development server runs at [http://localhost:3000](http://localhost:3000) and the backend API server is available at [http://localhost:5000](http://localhost:5000).

---

## 4. Troubleshooting
*   **Mongoose Connection Failures:** Ensure your local MongoDB service is active. You can start it locally or run `docker-compose up database` to start a MongoDB container.
*   **TypeScript Resolution Conflicts:** If shared workspaces are not compiling, run `npm run shared:build` to compile shared TS assets before running the services.
