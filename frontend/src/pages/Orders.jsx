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
      toast.success("Order cancelled and stock restored");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to cancel order");
      setDeleteTarget(null);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Orders</h1>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Hide Form" : "+ New Order"}
        </button>
      </div>

      {showForm && <OrderForm onSubmit={handleCreate} loading={loading} />}

      {orders.length === 0 ? (
        <p className="empty-state">No orders yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <>
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.customer_name}</td>
                  <td>${parseFloat(o.total_amount).toFixed(2)}</td>
                  <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="action-cell">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                    >
                      {expandedOrder === o.id ? "Hide" : "Details"}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(o)}>Cancel</button>
                  </td>
                </tr>
                {expandedOrder === o.id && (
                  <tr key={`details-${o.id}`} className="order-detail-row">
                    <td colSpan={6}>
                      <table className="inner-table">
                        <thead>
                          <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Line Total</th></tr>
                        </thead>
                        <tbody>
                          {o.items.map((item) => (
                            <tr key={item.id}>
                              <td>{item.product_name}</td>
                              <td>{item.quantity}</td>
                              <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                              <td>${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</td>
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
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Cancel order #${deleteTarget.id} for ${deleteTarget.customer_name}? Stock will be restored.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
