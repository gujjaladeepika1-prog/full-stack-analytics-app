const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get("/api/status", (req, res) => {
  res.json({ status: "ok", service: "analytics-backend" });
});

app.post("/api/events", (req, res) => {
  const { eventType, metadata } = req.body;

  if (!eventType || typeof eventType !== "string") {
    return res.status(400).json({ error: "eventType is required" });
  }

  const payload = JSON.stringify(metadata || {});
  const sql = `INSERT INTO analytics_events (event_type, metadata) VALUES (?, ?)`;

  db.run(sql, [eventType, payload], function (err) {
    if (err) {
      console.error("Insert failed", err);
      return res.status(500).json({ error: "Failed to save event" });
    }

    res.status(201).json({ id: this.lastID, eventType, metadata });
  });
});

app.get("/api/events", (req, res) => {
  const sql = `SELECT id, event_type as eventType, metadata, created_at as createdAt FROM analytics_events ORDER BY id DESC LIMIT 50`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Fetch events failed", err);
      return res.status(500).json({ error: "Failed to load events" });
    }
    const events = rows.map((row) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
    }));
    res.json(events);
  });
});

app.get("/api/metrics", (req, res) => {
  const typeTotals = `SELECT event_type AS eventType, COUNT(*) AS count FROM analytics_events GROUP BY event_type ORDER BY count DESC`;
  const dailyTotals = `SELECT DATE(created_at) AS day, COUNT(*) AS count FROM analytics_events GROUP BY day ORDER BY day DESC LIMIT 14`;

  db.serialize(() => {
    db.all(typeTotals, [], (err, typeRows) => {
      if (err) {
        console.error("Metrics type query failed", err);
        return res.status(500).json({ error: "Failed to compute metrics" });
      }

      db.all(dailyTotals, [], (err2, dailyRows) => {
        if (err2) {
          console.error("Metrics daily query failed", err2);
          return res.status(500).json({ error: "Failed to compute metrics" });
        }

        res.json({ typeTotals: typeRows, dailyTotals: dailyRows });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Analytics backend running on http://localhost:${PORT}`);
});
