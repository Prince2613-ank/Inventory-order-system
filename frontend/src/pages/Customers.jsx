import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getCustomers, createCustomer, deleteCustomer } from "../services/api";
import CustomerForm from "../components/CustomerForm";
import ConfirmModal from "../components/ConfirmModal";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function load() {
    getCustomers().then(setCustomers).catch(() => toast.error("Failed to load customers"));
  }

  useEffect(load, []);

  async function handleCreate(data) {
    setLoading(true);
    try {
      await createCustomer(data);
      toast.success("Customer added");
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add customer");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteCustomer(deleteTarget.id);
      toast.success("Customer deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete customer");
      setDeleteTarget(null);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">
          <h1>Customers</h1>
          <p className="page-subtitle">{customers.length} registered customer{customers.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "✕ Close" : "+ Add Customer"}
        </button>
      </div>

      {showForm && <CustomerForm onSubmit={handleCreate} loading={loading} />}

      {customers.length === 0 ? (
        <div className="table-wrapper">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>No customers yet — add your first one above</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td style={{ color: "var(--navy-400)", fontWeight: 600 }}>{c.id}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--indigo-500), var(--sky-500))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0
                      }}>
                        {c.full_name.charAt(0).toUpperCase()}
                      </div>
                      <strong>{c.full_name}</strong>
                    </div>
                  </td>
                  <td style={{ color: "var(--indigo-600)", fontWeight: 500 }}>{c.email}</td>
                  <td>{c.phone || <span style={{ color: "var(--navy-300)" }}>—</span>}</td>
                  <td style={{ color: "var(--navy-400)" }}>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="action-cell">
                    <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">{customers.length} customer{customers.length !== 1 ? "s" : ""} total</div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Customer"
          message={`Are you sure you want to delete "${deleteTarget.full_name}" (${deleteTarget.email})? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
