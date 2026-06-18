import { useEffect, useState } from "react";
import { getDashboard } from "../services/api";

const STATS = [
  { key: "total_products",  label: "Total Products",  icon: "📦", cls: "stat-card-products" },
  { key: "total_customers", label: "Total Customers", icon: "👥", cls: "stat-card-customers" },
  { key: "total_orders",    label: "Total Orders",    icon: "🧾", cls: "stat-card-orders"   },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => setError("Failed to load dashboard data"));
  }, []);

  if (error) return (
    <div className="page">
      <div className="error-banner">⚠ {error}</div>
    </div>
  );

  if (!data) return (
    <div className="loading">
      <div className="spinner" />
      Loading dashboard…
    </div>
  );

  return (
    <div className="page">
      <div className="page-title">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Overview of your inventory and sales activity</p>
      </div>

      <div className="stat-grid">
        {STATS.map(({ key, label, icon, cls }) => (
          <div key={key} className={`stat-card ${cls}`}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-content">
              <div className="stat-value">{data[key]}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="low-stock-header">
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
                <th>Product Name</th>
                <th>SKU</th>
                <th>Qty in Stock</th>
                <th>Price</th>
                <th>Status</th>
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
          <div className="table-footer">{data.low_stock_products.length} product{data.low_stock_products.length !== 1 ? "s" : ""} need restocking</div>
        </div>
      )}
    </div>
  );
}
