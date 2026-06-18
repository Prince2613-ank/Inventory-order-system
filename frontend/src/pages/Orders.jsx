import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getOrders, createOrder, deleteOrder } from "../services/api";
import OrderForm from "../components/OrderForm";
import ConfirmModal from "../components/ConfirmModal";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function load() {
    getOrders().then(setOrders).catch(() => toast.error("Failed to load orders"));
  }

  useEffect(load, []);

  async function handleCreate(data) {
    setLoading(true);
    try {
      await createOrder(data);
      toast.success("Order placed successfully");
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to place order");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteOrder(deleteTarget.id);
      toast.success("Order cancelled — stock restored");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to cancel order");
      setDeleteTarget(null);
    }
  }

  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total_amount), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">
          <h1>Orders</h1>
          <p className="page-subtitle">
            {orders.length} order{orders.length !== 1 ? "s" : ""} · Total revenue ${totalRevenue.toFixed(2)}
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "✕ Close" : "+ New Order"}
        </button>
      </div>

      {showForm && <OrderForm onSubmit={handleCreate} loading={loading} />}

      {orders.length === 0 ? (
        <div className="table-wrapper">
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <p>No orders yet — place your first one above</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <>
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700, color: "var(--indigo-600)" }}>#{o.id}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: "linear-gradient(135deg, var(--emerald-500), var(--sky-500))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 700, fontSize: "0.75rem", flexShrink: 0
                        }}>
                          {o.customer_name.charAt(0).toUpperCase()}
                        </div>
                        {o.customer_name}
                      </div>
                    </td>
                    <td>
                      <span className="badge">{o.items.length} item{o.items.length !== 1 ? "s" : ""}</span>
                    </td>
                    <td><span className="price-large">${parseFloat(o.total_amount).toFixed(2)}</span></td>
                    <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                    <td style={{ color: "var(--navy-400)" }}>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="action-cell">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                      >
                        {expandedOrder === o.id ? "▲ Hide" : "▼ Details"}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(o)}>
                        Cancel
                      </button>
                    </td>
                  </tr>
                  {expandedOrder === o.id && (
                    <tr key={`details-${o.id}`} className="order-detail-row">
                      <td colSpan={7}>
                        <table className="inner-table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Quantity</th>
                              <th>Unit Price</th>
                              <th>Line Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {o.items.map((item) => (
                              <tr key={item.id}>
                                <td><strong>{item.product_name}</strong></td>
                                <td>{item.quantity}</td>
                                <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                                <td><span className="price">${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          <div className="table-footer">{orders.length} order{orders.length !== 1 ? "s" : ""} · Total revenue: ${totalRevenue.toFixed(2)}</div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Cancel Order"
          message={`Cancel order #${deleteTarget.id} for ${deleteTarget.customer_name}? All reserved stock will be restored to inventory.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
