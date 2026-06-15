import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const eventOptions = [
  { label: "Page View", value: "page_view" },
  { label: "User Signup", value: "signup" },
  { label: "Purchase", value: "purchase" },
  { label: "Error", value: "error" },
];

function App() {
  const [metrics, setMetrics] = useState({ typeTotals: [], dailyTotals: [] });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [metricsRes, eventsRes] = await Promise.all([
        fetch(`${API_BASE}/api/metrics`),
        fetch(`${API_BASE}/api/events`),
      ]);

      if (!metricsRes.ok || !eventsRes.ok) {
        throw new Error("Unable to connect to analytics backend");
      }

      const metricsData = await metricsRes.json();
      const eventsData = await eventsRes.json();
      setMetrics(metricsData);
      setEvents(eventsData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Unable to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const sendEvent = async (eventType) => {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, metadata: { source: "dashboard" } }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Event submission failed");
      }

      await fetchDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatMetadata = (metadata) => {
    if (!metadata || Object.keys(metadata).length === 0) {
      return "—";
    }

    return Object.entries(metadata)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" • ");
  };

  const badgeClass = (type) => {
    if (!type) return "badge";
    return `badge badge--${String(type).replace(/\s+/g, "_")}`;
  };

  const EventIcon = ({ type }) => {
    switch (type) {
      case "page_view":
        return <span className="event-icon">👁</span>;
      case "signup":
        return <span className="event-icon">✓</span>;
      case "purchase":
        return <span className="event-icon">💳</span>;
      case "error":
        return <span className="event-icon">⚠</span>;
      default:
        return null;
    }
  };

  const renderBars = (totals) => {
    const max = Math.max(...totals.map((item) => item.count), 1);
    return totals.map((item) => (
      <div className="bar-row" key={item.eventType || item.day}>
        <div className="bar-label">{item.eventType || item.day}</div>
        <div className="bar-fill" style={{ width: `${(item.count / max) * 100}%` }}>
          {item.count}
        </div>
      </div>
    ));
  };

  const totalEvents = events.length;
  const totalTypes = metrics.typeTotals.length;
  const latestEvent = events[0];

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="header-left">
          <img src="/src/assets/logo.svg" alt="Analytics logo" className="site-logo" />
          <div>
            <p className="eyebrow">Analytics Operations Center</p>
            <h1>Full-Stack Analytics Dashboard</h1>
            <div className="signature">by Analytics Team</div>
            <p className="lead">
              This dashboard shows how analytics events flow through the backend, how they are
              stored, and how summary metrics appear in real time.
            </p>
          </div>
        </div>
        <div className="status-chip">
          {loading ? "Loading data…" : `Last refreshed at ${lastUpdated?.toLocaleTimeString()}`}
        </div>
        <img src="/src/assets/hero-illustration.svg" alt="illustration" className="header-illustration" />
      </header>

      <section className="panel overview-panel">
        <div className="overview-copy">
          <h2>What you can do here</h2>
          <p>
            Send simulated events to the backend, review summary statistics, and inspect the most
            recent activity captured in the analytics store.
          </p>
        </div>
        <div className="summary-grid">
          <div className="summary-card">
            <span>Total events</span>
            <strong>{loading ? "—" : totalEvents}</strong>
          </div>
          <div className="summary-card">
            <span>Event types tracked</span>
            <strong>{loading ? "—" : totalTypes}</strong>
          </div>
          <div className="summary-card">
            <span>Latest event</span>
            <strong>
              {loading ? (
                "—"
              ) : latestEvent ? (
                <span className={badgeClass(latestEvent.eventType)}>
                  <EventIcon type={latestEvent.eventType} />
                  {latestEvent.eventType}
                </span>
              ) : (
                "None yet"
              )}
            </strong>
          </div>
        </div>
      </section>

      <section className="panel actions-panel">
        <div className="section-header">
          <div>
            <h2>Analytics event simulator</h2>
            <p>Generate sample analytics events and observe the backend capture workflow in real time.</p>
          </div>
          <button className="ghost-button" onClick={fetchDashboard}>
            Refresh metrics
          </button>
        </div>
        <div className="button-grid">
          {eventOptions.map((option) => (
            <button key={option.value} onClick={() => sendEvent(option.value)}>
              Record {option.label}
            </button>
          ))}
        </div>
      </section>

      {error && <div className="toast error">{error}</div>}

      <section className="panel metrics-panel">
        <div className="section-header">
          <div>
            <h2>Key metrics</h2>
            <p>Review event volume and traffic patterns for the tracked analytics data.</p>
          </div>
        </div>
        {loading ? (
          <p>Loading metrics…</p>
        ) : (
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Event type distribution</h3>
              {metrics.typeTotals.length ? renderBars(metrics.typeTotals) : <p>No analytics events have been captured yet.</p>}
            </div>
            <div className="metric-card">
              <h3>Daily event volume</h3>
              {metrics.dailyTotals.length ? renderBars(metrics.dailyTotals) : <p>No daily event data available yet.</p>}
            </div>
          </div>
        )}
      </section>

      <section className="panel events-panel">
        <div className="section-header">
          <div>
            <h2>Recent event stream</h2>
            <p>Live log of backend event submissions, showing event type, metadata source, and timestamp.</p>
          </div>
        </div>
        {loading ? (
          <p>Loading events…</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Metadata</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {events.length ? (
                  events.map((event) => (
                    <tr key={event.id}>
                      <td>{event.id}</td>
                      <td>
                        <span className={badgeClass(event.eventType)}>
                          <EventIcon type={event.eventType} />
                          {event.eventType}
                        </span>
                      </td>
                      <td className="metadata-cell">{formatMetadata(event.metadata)}</td>
                      <td>{new Date(event.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No events captured yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="app-footer">
        <div className="footer-content">
          <p>Analytics Dashboard v1.0 • Full-Stack Event Tracking & Metrics</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
