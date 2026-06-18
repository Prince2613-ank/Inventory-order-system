import { useState, useEffect } from "react";

const EMPTY = { name: "", sku: "", price: "", quantity_in_stock: "" };

export default function ProductForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(initial || EMPTY);
    setErrors({});
  }, [initial]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.sku.trim()) e.sku = "SKU is required";
    const price = parseFloat(form.price);
    if (form.price === "" || isNaN(price) || price < 0) e.price = "Price must be a non-negative number";
    const qty = parseInt(form.quantity_in_stock, 10);
    if (form.quantity_in_stock === "" || isNaN(qty) || qty < 0) e.quantity_in_stock = "Quantity must be a non-negative integer";
    return e;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: parseFloat(form.price),
      quantity_in_stock: parseInt(form.quantity_in_stock, 10),
    });
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label>Product Name</label>
        <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Widget Pro" />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>
      <div className="form-group">
        <label>SKU</label>
        <input name="sku" value={form.sku} onChange={handleChange} placeholder="e.g. WGT-001" />
        {errors.sku && <span className="field-error">{errors.sku}</span>}
      </div>
      <div className="form-group">
        <label>Price ($)</label>
        <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} placeholder="0.00" />
        {errors.price && <span className="field-error">{errors.price}</span>}
      </div>
      <div className="form-group">
        <label>Quantity in Stock</label>
        <input name="quantity_in_stock" type="number" min="0" value={form.quantity_in_stock} onChange={handleChange} placeholder="0" />
        {errors.quantity_in_stock && <span className="field-error">{errors.quantity_in_stock}</span>}
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Saving…" : initial ? "Update Product" : "Create Product"}
        </button>
        {onCancel && <button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
