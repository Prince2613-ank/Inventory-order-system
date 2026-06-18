import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../services/api";
import ProductForm from "../components/ProductForm";
import ConfirmModal from "../components/ConfirmModal";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // product being edited
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditing(null); }}>
          + New Product
        </button>
      </div>

      {(showForm && !editing) && (
        <ProductForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={loading} />
      )}

      {products.length === 0 ? (
        <p className="empty-state">No products yet. Add one above.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>SKU</th><th>Price</th><th>Stock</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <>
                <tr key={p.id} className={p.quantity_in_stock < 10 ? (p.quantity_in_stock === 0 ? "row-danger" : "row-warning") : ""}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.sku}</td>
                  <td>${parseFloat(p.price).toFixed(2)}</td>
                  <td>{p.quantity_in_stock}</td>
                  <td className="action-cell">
                    <button className="btn btn-sm btn-secondary" onClick={() => { setEditing(p); setShowForm(false); }}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(p)}>Delete</button>
                  </td>
                </tr>
                {editing?.id === p.id && (
                  <tr key={`edit-${p.id}`}>
                    <td colSpan={6}>
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
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete "${deleteTarget.name}" (SKU: ${deleteTarget.sku})? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
