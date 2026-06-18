import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getCustomers, createCustomer, deleteCustomer } from "../services/api";
import CustomerForm from "../components/CustomerForm";
import ConfirmModal from "../components/ConfirmModal";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
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
      <h1>Customers</h1>
      <CustomerForm onSubmit={handleCreate} loading={loading} />

      {customers.length === 0 ? (
        <p className="empty-state">No customers yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.full_name}</td>
                <td>{c.email}</td>
                <td>{c.phone || "—"}</td>
                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                <td className="action-cell">
                  <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(c)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete customer "${deleteTarget.full_name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
