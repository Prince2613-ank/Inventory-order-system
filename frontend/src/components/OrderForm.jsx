import { useState, useEffect } from "react";
import { AlertCircle, ShoppingCart, Plus, X } from "lucide-react";
import { getCustomers, getProducts } from "../services/api";

export default function OrderForm({ onSubmit, loading }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([{ product_id: "", quantity: 1 }]);
  const [errors, setErrors] = useState({});
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    Promise.all([getCustomers(), getProducts()])
      .then(([c, p]) => { setCustomers(c); setProducts(p); })
      .catch(() => setFetchError("Failed to load customers or products"));
  }, []);

  const computedTotal = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === parseInt(item.product_id, 10));
    if (!product || !item.quantity) return sum;
    return sum + parseFloat(product.price) * parseInt(item.quantity, 10);
  }, 0);

  function handleItemChange(index, field, value) {
    setItems((prev) => prev.map((it, i) => i === index ? { ...it, [field]: value } : it));
    setErrors((e) => ({ ...e, [`item_${index}_${field}`]: undefined }));
  }

  function addItem() {
    setItems((prev) => [...prev, { product_id: "", quantity: 1 }]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function validate() {
    const e = {};
    if (!customerId) e.customerId = "Please select a customer";
    items.forEach((item, i) => {
      if (!item.product_id) e[`item_${i}_product_id`] = "Select a product";
      const qty = parseInt(item.quantity, 10);
      if (!item.quantity || isNaN(qty) || qty <= 0) e[`item_${i}_quantity`] = "Must be > 0";
    });
    const ids = items.map((it) => it.product_id).filter(Boolean);
    if (new Set(ids).size !== ids.length) e.duplicates = "Remove duplicate products — combine quantities instead";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({
      customer_id: parseInt(customerId, 10),
      items: items.map((it) => ({ product_id: parseInt(it.product_id, 10), quantity: parseInt(it.quantity, 10) })),
    });
  }

  if (fetchError) return (
    <div className="error-banner"><AlertCircle size={16} /> {fetchError}</div>
  );

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <div className="form-card-title"><ShoppingCart size={15} /> Place New Order</div>

      <div className="form-group">
        <label>Customer</label>
        <select
          value={customerId}
          onChange={(e) => { setCustomerId(e.target.value); setErrors((er) => ({ ...er, customerId: undefined })); }}
        >
          <option value="">— select customer —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name} · {c.email}</option>
          ))}
        </select>
        {errors.customerId && <span className="field-error"><AlertCircle size={13} /> {errors.customerId}</span>}
      </div>

      <div>
        <div className="section-label order-items-label">Order Items</div>
        <div className="order-items-container">
          {items.map((item, index) => (
            <div key={index} className="order-item-row">
              <div className="form-group order-item-product">
                <select
                  value={item.product_id}
                  onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                >
                  <option value="">— select product —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.quantity_in_stock === 0}>
                      {p.name} (SKU: {p.sku}) — ${parseFloat(p.price).toFixed(2)} | Stock: {p.quantity_in_stock}{p.quantity_in_stock === 0 ? " (out)" : ""}
                    </option>
                  ))}
                </select>
                {errors[`item_${index}_product_id`] && (
                  <span className="field-error"><AlertCircle size={13} /> {errors[`item_${index}_product_id`]}</span>
                )}
              </div>
              <div className="form-group order-item-qty">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                  placeholder="Qty"
                />
                {errors[`item_${index}_quantity`] && (
                  <span className="field-error"><AlertCircle size={13} /> {errors[`item_${index}_quantity`]}</span>
                )}
              </div>
              {items.length > 1 && (
                <button
                  className="btn btn-sm btn-danger order-item-remove"
                  type="button"
                  onClick={() => removeItem(index)}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        {errors.duplicates && <span className="field-error"><AlertCircle size={13} /> {errors.duplicates}</span>}
        <button className="btn btn-secondary btn-sm" type="button" onClick={addItem} style={{ marginTop: "0.6rem" }}>
          <Plus size={14} /> Add Another Product
        </button>
      </div>

      <div className="order-total">
        <span>Computed Total:</span>
        <strong>${computedTotal.toFixed(2)}</strong>
      </div>

      <div className="form-actions">
        <button className="btn btn-success btn-lg" type="submit" disabled={loading}>
          {loading ? "Placing Order…" : "Place Order"}
        </button>
      </div>
    </form>
  );
}
