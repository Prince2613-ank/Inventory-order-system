import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../services/api";
import ProductForm from "../components/ProductForm";
import ConfirmModal from "../components/ConfirmModal";
import SearchBar from "../components/SearchBar";
import SortableTh from "../components/SortableTh";
import { useDebounce } from "../hooks/useDebounce";
import { useSortableData } from "../hooks/useSortableData";
import { exportToCsv } from "../utils/exportCsv";

function StockBadge({ qty }) {
  if (qty === 0) return <span className="stock-chip stock-empty">⛔ Out of Stock</span>;
  if (qty < 10) return <span className="stock-chip stock-low">⚠ {qty}</span>;
  return <span className="stock-chip stock-ok">✓ {qty}</span>;
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);

  function load() {
    getProducts().then(setProducts).catch(() => toast.error("Failed to load products"));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return products;
    const t = debouncedSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t));
  }, [products, debouncedSearch]);

  const { sorted, sort, requestSort } = useSortableData(filtered, "id", "asc");

  async function handleCreate(data) {
    setLoading(true);
    try {
      await createProduct(data);
      toast.success("Product created");
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create product");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(data) {
    setLoading(true);
    try {
      await updateProduct(editing.id, data);
      toast.success("Product updated");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update product");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteProduct(deleteTarget.id);
      toast.success("Product deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete product");
      setDeleteTarget(null);
    }
  }

  function handleExport() {
    exportToCsv(`products-${new Date().toISOString().slice(0, 10)}.csv`,
      products.map((p) => ({
        ID: p.id, Name: p.name, SKU: p.sku,
        Price: parseFloat(p.price).toFixed(2),
        "Stock Qty": p.quantity_in_stock,
        Created: new Date(p.created_at).toLocaleDateString(),
      }))
    );
    toast.success("Products exported to CSV");
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">
          <h1>Products</h1>
          <p className="page-subtitle">{products.length} product{products.length !== 1 ? "s" : ""} in catalog</p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={handleExport} title="Export to CSV">⬇ Export CSV</button>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => { setShowForm((v) => !v); setEditing(null); }}
          >
            {showForm ? "✕ Close" : "+ New Product"}
          </button>
        </div>
      </div>

      {showForm && !editing && (
        <ProductForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={loading} />
      )}

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by name or SKU…"
        resultCount={debouncedSearch ? filtered.length : undefined}
      />

      {sorted.length === 0 ? (
        <div className="table-wrapper">
          <div className="empty-state">
            <div className="empty-state-icon">{debouncedSearch ? "🔍" : "📦"}</div>
            <p>{debouncedSearch ? `No products match "${debouncedSearch}"` : "No products yet — add your first one above"}</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <SortableTh label="#" sortKey="id" sort={sort} onSort={requestSort} />
                <SortableTh label="Product Name" sortKey="name" sort={sort} onSort={requestSort} />
                <SortableTh label="SKU" sortKey="sku" sort={sort} onSort={requestSort} />
                <SortableTh label="Price" sortKey="price" sort={sort} onSort={requestSort} />
                <SortableTh label="Stock" sortKey="quantity_in_stock" sort={sort} onSort={requestSort} />
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <>
                  <tr
                    key={p.id}
                    className={p.quantity_in_stock === 0 ? "row-danger" : p.quantity_in_stock < 10 ? "row-warning" : ""}
                  >
                    <td style={{ color: "var(--navy-400)", fontWeight: 600 }}>{p.id}</td>
                    <td><strong>{p.name}</strong></td>
                    <td><span className="sku-chip">{p.sku}</span></td>
                    <td><span className="price">${parseFloat(p.price).toFixed(2)}</span></td>
                    <td><StockBadge qty={p.quantity_in_stock} /></td>
                    <td className="action-cell">
                      <button className="btn btn-sm btn-secondary" onClick={() => { setEditing(p); setShowForm(false); }}>
                        ✎ Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(p)}>Delete</button>
                    </td>
                  </tr>
                  {editing?.id === p.id && (
                    <tr key={`edit-${p.id}`}>
                      <td colSpan={6} style={{ padding: "1rem 1.1rem", background: "rgba(99,102,241,.03)" }}>
                        <ProductForm
                          initial={{ name: p.name, sku: p.sku, price: String(p.price), quantity_in_stock: String(p.quantity_in_stock) }}
                          onSubmit={handleUpdate}
                          onCancel={() => setEditing(null)}
                          loading={loading}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            Showing {sorted.length} of {products.length} product{products.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Product"
          message={`Delete "${deleteTarget.name}" (SKU: ${deleteTarget.sku})? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
