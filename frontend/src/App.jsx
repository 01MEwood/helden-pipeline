import { useEffect, useState } from "react";

// API_URL wird beim Vite-Build aus dem ENV gebacken.
// Default: relative URL "/api" — funktioniert mit dem NPM Custom-Location
// Setup, das Pfade unter /api an den Backend-Container weiterleitet.
const API_URL = import.meta.env.VITE_API_URL || "/api";

export default function App() {
  const [status, setStatus] = useState("loading");
  const [pong, setPong] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/ping`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setPong(data);
        setStatus("ok");
      })
      .catch((e) => {
        setError(e.message);
        setStatus("error");
      });
  }, []);

  return (
    <main
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        maxWidth: 720,
        margin: "0 auto",
        padding: "3rem 1.5rem",
        color: "#1a1a1a",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
        helden-pipeline
      </h1>
      <p style={{ color: "#666", marginTop: 0 }}>
        MEOS:HELDEN 2.0 — Website-Automat Pipeline
      </p>

      <section
        style={{
          marginTop: "2rem",
          padding: "1.25rem 1.5rem",
          background: "#f5f7fa",
          borderRadius: 12,
          border: "1px solid #e1e6ee",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
          Pipeline-Status
        </h2>
        <p>
          <strong>Frontend:</strong>{" "}
          <span style={{ color: "#16a34a" }}>● live</span>
        </p>
        <p>
          <strong>Backend:</strong>{" "}
          {status === "loading" && <span>● lädt …</span>}
          {status === "ok" && (
            <span style={{ color: "#16a34a" }}>● erreichbar</span>
          )}
          {status === "error" && (
            <span style={{ color: "#dc2626" }}>● Fehler</span>
          )}
        </p>
        {pong && (
          <pre
            style={{
              background: "#fff",
              padding: "0.75rem",
              borderRadius: 8,
              border: "1px solid #e1e6ee",
              fontSize: "0.85rem",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(pong, null, 2)}
          </pre>
        )}
        {error && (
          <p style={{ color: "#dc2626", fontSize: "0.9rem" }}>
            Backend nicht erreichbar: {error}
            <br />
            <small>
              API URL: <code>{API_URL}/ping</code>
            </small>
          </p>
        )}
      </section>

      <footer style={{ marginTop: "2rem", color: "#888", fontSize: "0.85rem" }}>
        Build: {import.meta.env.MODE} · API: <code>{API_URL}</code>
      </footer>
    </main>
  );
}
