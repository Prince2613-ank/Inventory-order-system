import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, Users, FileText, DollarSign,
  BarChart2, Clock, AlertTriangle, CheckCircle, XCircle,
  TrendingUp,
} from "lucide-react";
import { getDashboard, getProducts } from "../services/api";
import AnimatedCount from "../components/AnimatedCount";
import StockChart from "../components/StockChart";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function DashboardSkeleton() {
  return (
    <div className="page">
      <div className="page-title">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Loading…</p>
      </div>
      <div className="stat-grid stat-grid-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 120 }} />
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="skeleton" style={{ height: 300 }} />
        <div className="skeleton" style={{ height: 300 }} />
      </div>
      <div className="skeleton" style={{ height: 180 }} />
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getDashboard(), getProducts()])
      .then(([d, p]) => { setData(d); setProducts(p); })
      .catch(() => setError("Failed to load dashboard data"));
  }, []);

  if (error) return (
    <div className="page">
      <div className="error-banner"><AlertTriangle size={16} /> {error}</div>
    </div>
  );

  if (!data) return <DashboardSkeleton />;

  const avgOrderValue = data.completed_orders > 0
    ? (parseFloat(data.total_revenue) / data.completed_orders).toFixed(2)
    : null;

  const stats = [
    {
      key: "total_products",
      label: "Total Products",
      icon: <Package size={24} />,
      cls: "stat-card-products",
      fmt: "integer",
      to: "/products",
      sub: data.low_stock_count > 0
        ? { text: `${data.low_stock_count} low stock`, type: "warn" }
        : { text: "All items stocked", type: "ok" },
    },
    {
      key: "total_customers",
      label: "Total Customers",
      icon: <Users size={24} />,
      cls: "stat-card-customers",
      fmt: "integer",
      to: "/customers",
      sub: data.customers_with_orders > 0
        ? { text: `${data.customers_with_orders} have placed orders`, type: "ok" }
        : { text: "No orders placed yet", type: "muted" },
    },
    {
      key: "total_orders",
      label: "Total Orders",
      icon: <FileText size={24} />,
      cls: "stat-card-orders",
      fmt: "integer",
      to: "/orders",
      sub: data.total_orders > 0
        ? { text: `${data.active_orders} active · ${data.completed_orders} completed`, type: "ok" }
        : { text: "No orders yet", type: "muted" },
    },
    {
      key: "total_revenue",
      label: "Total Revenue",
      icon: <DollarSign size={24} />,
      cls: "stat-card-revenue",
      fmt: "currency",
      to: "/orders",
      sub: avgOrderValue
        ? { text: `avg $${avgOrderValue} per order`, type: "ok" }
        : { text: "Complete orders to earn revenue", type: "muted" },
    },
  ];

  return (
    <div className="page">
      <div className="page-title">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Live overview of your inventory and sales</p>
      </div>

      <div className="stat-grid stat-grid-4">
        {stats.map(({ key, label, icon, cls, fmt, sub, to }) => (
          <div
            key={key}
            className={`stat-card ${cls} stat-card-clickable`}
            onClick={() => navigate(to)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate(to)}
          >
            <div className="stat-card-header">
              <div className="stat-label">{label}</div>
              <div className="stat-icon">{icon}</div>
            </div>
            <div className="stat-value">
              <AnimatedCount value={data[key]} format={fmt} />
            </div>
            <div className={`stat-sub stat-sub-${sub.type}`}>{sub.text}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-panel">
          <h2 className="section-heading section-heading-spaced"><BarChart2 size={16} /> Stock Levels</h2>
          <StockChart products={products} />
        </div>

        <div className="card dashboard-panel">
          <h2 className="section-heading section-heading-spaced"><Clock size={16} /> Recent Orders</h2>
          {data.recent_orders.length === 0 ? (
            <div className="empty-state empty-state-sm">
              <div className="empty-state-svg"><FileText size={36} /></div>
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="recent-list">
              {data.recent_orders.map((o) => (
                <div key={o.id} className="recent-item">
                  <div className="recent-avatar">{o.customer_name.charAt(0).toUpperCase()}</div>
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

      <div className="dashboard-order-summary">
        <div className="order-summary-card order-summary-active">
          <div className="order-summary-icon"><TrendingUp size={18} /></div>
          <div className="order-summary-info">
            <div className="order-summary-value">{data.active_orders}</div>
            <div className="order-summary-label">Active Orders</div>
          </div>
        </div>
        <div className="order-summary-card order-summary-completed">
          <div className="order-summary-icon"><CheckCircle size={18} /></div>
          <div className="order-summary-info">
            <div className="order-summary-value">{data.completed_orders}</div>
            <div className="order-summary-label">Completed</div>
          </div>
        </div>
        <div className="order-summary-card order-summary-cancelled">
          <div className="order-summary-icon"><XCircle size={18} /></div>
          <div className="order-summary-info">
            <div className="order-summary-value">{data.cancelled_orders}</div>
            <div className="order-summary-label">Cancelled</div>
          </div>
        </div>
        <div className="order-summary-card order-summary-revenue">
          <div className="order-summary-icon"><DollarSign size={18} /></div>
          <div className="order-summary-info">
            <div className="order-summary-value">
              {avgOrderValue ? `$${avgOrderValue}` : "—"}
            </div>
            <div className="order-summary-label">Avg Order Value</div>
          </div>
        </div>
      </div>

      <div>
        <div className="low-stock-header">
          <h2 className="section-heading"><AlertTriangle size={16} /> Low Stock Alert</h2>
          <span className="warning-pill">threshold &lt; 10 units</span>
        </div>

        {data.low_stock_products.length === 0 ? (
          <div className="table-wrapper">
            <div className="empty-state">
              <div className="empty-state-svg"><CheckCircle size={36} /></div>
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
                        {p.quantity_in_stock === 0 ? <XCircle size={12} /> : <AlertTriangle size={12} />} {p.quantity_in_stock} units
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
