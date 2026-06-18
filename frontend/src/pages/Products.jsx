import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../services/api";
import ProductForm from "../components/ProductForm";
import ConfirmModal from "../components/ConfirmModal";

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

  function load() {
    getProducts().then(setProducts).catch(() => toast.error("Failed to load products"));
  }

  useEffect(load, []);

  async function handleCreate(data) {
    setLoading(true);
    try {
      await createProduct(data);
      toast.success("Product created successfully");
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

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">
          <h1>Products</h1>
          <p className="page-subtitle">{products.length} product{products.length !== 1 ? "s" : ""} in catalog</p>
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => { setShowForm((v) => !v); setEditing(null); }}
        >
          {showForm ? "✕ Close" : "+ New Product"}
        </button>
      </div>

      {showForm && !editing && (
        <ProductForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={loading} />
      )}

      {products.length === 0 ? (
        <div className="table-wrapper">
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p>No products yet — add your first one above</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
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
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => { setEditing(p); setShowForm(false); }}
                      >
                        ✎ Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(p)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                  {editing?.id === p.id && (
                    <tr key={`edit-${p.id}`}>
                      <td colSpan={6} style={{ padding: "1rem 1.1rem", background: "rgba(99,102,241,.03)" }}>
                        <ProductForm
                          initial={{
                            name: p.name,
                            sku: p.sku,
                            price: String(p.price),
                            quantity_in_stock: String(p.quantity_in_stock),
                          }}
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
          <div className="table-footer">{products.length} product{products.length !== 1 ? "s" : ""} total</div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Product"
          message={`Are you sure you want to delete "${deleteTarget.name}" (SKU: ${deleteTarget.sku})? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
