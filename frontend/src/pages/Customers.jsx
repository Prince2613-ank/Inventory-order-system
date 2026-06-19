import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Download, X, Search, Users } from "lucide-react";
import { getCustomers, createCustomer, deleteCustomer } from "../services/api";
import CustomerForm from "../components/CustomerForm";
import ConfirmModal from "../components/ConfirmModal";
import SearchBar from "../components/SearchBar";
import SortableTh from "../components/SortableTh";
import { useDebounce } from "../hooks/useDebounce";
import { useSortableData } from "../hooks/useSortableData";
import { exportToCsv } from "../utils/exportCsv";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);

  function load() {
    getCustomers().then(setCustomers).catch(() => toast.error("Failed to load customers"));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return customers;
    const t = debouncedSearch.toLowerCase();
    return customers.filter((c) =>
      c.full_name.toLowerCase().includes(t) || c.email.toLowerCase().includes(t)
    );
  }, [customers, debouncedSearch]);

  const { sorted, sort, requestSort } = useSortableData(filtered, "id", "asc");

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

  function handleExport() {
    exportToCsv(`customers-${new Date().toISOString().slice(0, 10)}.csv`,
      customers.map((c) => ({
        ID: c.id, "Full Name": c.full_name, Email: c.email,
        Phone: c.phone || "",
        Joined: new Date(c.created_at).toLocaleDateString(),
      }))
    );
    toast.success("Customers exported to CSV");
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">
          <h1>Customers</h1>
          <p className="page-subtitle">{customers.length} registered customer{customers.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExport}><Download size={15} /> Export CSV</button>
          <button className="btn btn-primary btn-lg" onClick={() => setShowForm((v) => !v)}>
            {showForm ? <><X size={15} /> Close</> : "+ Add Customer"}
          </button>
        </div>
      </div>

      {showForm && <CustomerForm onSubmit={handleCreate} loading={loading} />}

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by name or email…"
        resultCount={debouncedSearch ? filtered.length : undefined}
      />

      {sorted.length === 0 ? (
        <div className="table-wrapper">
          <div className="empty-state">
            <div className="empty-state-svg">
              {debouncedSearch ? <Search size={36} /> : <Users size={36} />}
            </div>
            <p>{debouncedSearch ? `No customers match "${debouncedSearch}"` : "No customers yet"}</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <SortableTh label="#"      sortKey="id"         sort={sort} onSort={requestSort} className="col-hide-xs" />
                <SortableTh label="Name"   sortKey="full_name"  sort={sort} onSort={requestSort} />
                <SortableTh label="Email"  sortKey="email"      sort={sort} onSort={requestSort} />
                <th className="col-hide-xs">Phone</th>
                <SortableTh label="Joined" sortKey="created_at" sort={sort} onSort={requestSort} className="col-hide-xs" />
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.id}>
                  <td className="td-id col-hide-xs">{c.id}</td>
                  <td>
                    <div className="td-name-cell">
                      <div className="avatar">{c.full_name.charAt(0).toUpperCase()}</div>
                      <strong>{c.full_name}</strong>
                    </div>
                  </td>
                  <td className="td-email">{c.email}</td>
                  <td className="col-hide-xs">{c.phone || <span className="td-muted">—</span>}</td>
                  <td className="td-date col-hide-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-cell">
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(c)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            Showing {sorted.length} of {customers.length} customer{customers.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Customer"
          message={`Delete "${deleteTarget.full_name}" (${deleteTarget.email})? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
