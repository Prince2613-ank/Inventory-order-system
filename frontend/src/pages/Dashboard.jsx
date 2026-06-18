import { useEffect, useState } from "react";
import { getDashboard, getProducts } from "../services/api";
import AnimatedCount from "../components/AnimatedCount";
import StockChart from "../components/StockChart";

const STATS = [
  { key: "total_products",  label: "Total Products",  icon: "📦", cls: "stat-card-products",  fmt: "integer" },
  { key: "total_customers", label: "Total Customers", icon: "👥", cls: "stat-card-customers", fmt: "integer" },
  { key: "total_orders",    label: "Total Orders",    icon: "🧾", cls: "stat-card-orders",    fmt: "integer" },
  { key: "total_revenue",   label: "Total Revenue",   icon: "💰", cls: "stat-card-revenue",   fmt: "currency" },
];

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getDashboard(), getProducts()])
      .then(([d, p]) => { setData(d); setProducts(p); })
      .catch(() => setError("Failed to load dashboard data"));
  }, []);

  if (error) return (
    <div className="page"><div className="error-banner">⚠ {error}</div></div>
  );

  if (!data) return (
    <div className="loading"><div className="spinner" />Loading dashboard…</div>
  );

  return (
    <div className="page">
      <div className="page-title">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Live overview of your inventory and sales</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="stat-grid stat-grid-4">
        {STATS.map(({ key, label, icon, cls, fmt }) => (
          <div key={key} className={`stat-card ${cls}`}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-content">
              <div className="stat-value">
                <AnimatedCount value={data[key]} format={fmt} />
              </div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Two-column: chart + recent orders ── */}
      <div className="dashboard-grid">
        <div className="card dashboard-panel">
          <h2 className="section-heading" style={{ marginBottom: "1.25rem" }}>📊 Stock Levels</h2>
          <StockChart products={products} />
        </div>

        <div className="card dashboard-panel">
          <h2 className="section-heading" style={{ marginBottom: "1.25rem" }}>🕐 Recent Orders</h2>
          {data.recent_orders.length === 0 ? (
            <div className="empty-state" style={{ padding: "1.5rem" }}>
              <div className="empty-state-icon">🧾</div>
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="recent-list">
              {data.recent_orders.map((o) => (
                <div key={o.id} className="recent-item">
                  <div className="recent-avatar">
                    {o.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="recent-info">
                    <div className="recent-name">{o.customer_name}</div>
                    <div className="recent-meta">
                      {o.items_count} item{o.items_count !== 1 ? "s" : ""} · {timeAgo(o.created_at)}
                    </div>
                  </div>
                  <div className="recent-amount">${parseFloat(o.total_amount).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Low stock alerts ── */}
      <div>
        <div className="low-stock-header" style={{ marginBottom: "0.75rem" }}>
          <h2 className="section-heading">⚠ Low Stock Alert</h2>
          <span className="warning-pill">threshold &lt; 10 units</span>
        </div>

        {data.low_stock_products.length === 0 ? (
          <div className="table-wrapper">
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <p>All products are sufficiently stocked</p>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th><th>SKU</th><th>Stock</th><th>Price</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.low_stock_products.map((p) => (
                  <tr key={p.id} className={p.quantity_in_stock === 0 ? "row-danger" : "row-warning"}>
                    <td><strong>{p.name}</strong></td>
                    <td><span className="sku-chip">{p.sku}</span></td>
                    <td>
                      <span className={`stock-chip ${p.quantity_in_stock === 0 ? "stock-empty" : "stock-low"}`}>
                        {p.quantity_in_stock === 0 ? "⛔" : "⚠"} {p.quantity_in_stock} units
                      </span>
                    </td>
                    <td><span className="price">${parseFloat(p.price).toFixed(2)}</span></td>
                    <td>
                      <span className={`stock-chip ${p.quantity_in_stock === 0 ? "stock-empty" : "stock-low"}`}>
                        {p.quantity_in_stock === 0 ? "Out of Stock" : "Low Stock"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-footer">
              {data.low_stock_products.length} product{data.low_stock_products.length !== 1 ? "s" : ""} need restocking
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
