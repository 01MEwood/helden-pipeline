// helden-pipeline backend — minimal Hello-World skeleton
// Validiert die Pipeline: GitHub → Docker Hub → Hostinger → NPM → Browser
//
// Endpoints:
//   GET /health        → Container healthcheck (curl from Dockerfile)
//   GET /api/ping      → Frontend smoke test
//   GET /api/info      → Build info
//
// Port wird aus ENV PORT gelesen (helden-pipeline = 4100, MEOS-Konvention)

const express = require("express");
const cors = require("cors");

const PORT = parseInt(process.env.PORT || "4100", 10);
const NODE_ENV = process.env.NODE_ENV || "development";
const APP_NAME = "helden-pipeline";
const APP_VERSION = "0.1.0";
const STARTED_AT = new Date().toISOString();

const app = express();

// CORS — in Prod läuft Frontend & Backend hinter NPM unter derselben Domain,
// daher reicht eine offene Policy. Bei strikteren Setups → origin: 'https://helden-pipeline.meosapp.de'
app.use(cors());
app.use(express.json());

// --- Healthcheck (vom Docker HEALTHCHECK aufgerufen) ---
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: APP_NAME,
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
  });
});

// --- API: Smoke-Test-Endpoint für das Frontend ---
app.get("/api/ping", (req, res) => {
  res.json({
    pong: true,
    app: APP_NAME,
    version: APP_VERSION,
    env: NODE_ENV,
    started_at: STARTED_AT,
    timestamp: new Date().toISOString(),
  });
});

// --- API: Build-Info ---
app.get("/api/info", (req, res) => {
  res.json({
    app: APP_NAME,
    version: APP_VERSION,
    node_version: process.version,
    env: NODE_ENV,
    port: PORT,
    started_at: STARTED_AT,
  });
});

// --- 404 fallback for unknown API paths ---
app.use("/api", (req, res) => {
  res.status(404).json({ error: "not_found", path: req.originalUrl });
});

// --- Graceful shutdown (wichtig für Docker SIGTERM) ---
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`[${APP_NAME}] listening on :${PORT} (${NODE_ENV})`);
});

const shutdown = (signal) => {
  console.log(`[${APP_NAME}] received ${signal}, shutting down …`);
  server.close(() => {
    console.log(`[${APP_NAME}] closed cleanly`);
    process.exit(0);
  });
  // Force exit nach 10s
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
