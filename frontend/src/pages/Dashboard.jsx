import { useEffect, useState } from "react";
import { getDashboard } from "../services/api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => setError("Failed to load dashboard data"));
  }, []);

  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return <div className="loading">Loading dashboard…</div>;

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{data.total_products}</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.total_customers}</div>
          <div className="stat-label">Total Customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.total_orders}</div>
          <div className="stat-label">Total Orders</div>
        </div>
      </div>

      <h2>Low Stock Products <span className="badge">threshold: &lt; 10 units</span></h2>
      {data.low_stock_products.length === 0 ? (
        <p className="empty-state">All products are sufficiently stocked.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Qty in Stock</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {data.low_stock_products.map((p) => (
              <tr key={p.id} className={p.quantity_in_stock === 0 ? "row-danger" : "row-warning"}>
                <td>{p.name}</td>
                <td>{p.sku}</td>
                <td>{p.quantity_in_stock}</td>
                <td>${parseFloat(p.price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
