import { useState } from "react";

const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CustomerForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.email.trim() || !EMAIL_RE.test(form.email)) e.email = "A valid email address is required";
    if (form.phone && !PHONE_RE.test(form.phone)) e.phone = "Phone must be 7–20 characters (digits, spaces, +, -, (, ))";
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
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
    });
    setForm({ full_name: "", email: "", phone: "" });
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label>Full Name</label>
        <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Jane Doe" />
        {errors.full_name && <span className="field-error">{errors.full_name}</span>}
      </div>
      <div className="form-group">
        <label>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane@example.com" />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>
      <div className="form-group">
        <label>Phone (optional)</label>
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 555 000 0000" />
        {errors.phone && <span className="field-error">{errors.phone}</span>}
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Saving…" : "Add Customer"}
        </button>
      </div>
    </form>
  );
}
