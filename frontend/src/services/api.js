import axios from "axios";

// nginx proxies /api/* → backend:8000 in Docker; set REACT_APP_API_URL for external deployments
const BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "/api");

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const getProducts = () => api.get("/products").then((r) => r.data);
export const getProduct = (id) => api.get(`/products/${id}`).then((r) => r.data);
export const createProduct = (data) => api.post("/products", data).then((r) => r.data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data).then((r) => r.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

export const getCustomers = () => api.get("/customers").then((r) => r.data);
export const getCustomer = (id) => api.get(`/customers/${id}`).then((r) => r.data);
export const createCustomer = (data) => api.post("/customers", data).then((r) => r.data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

export const getOrders = () => api.get("/orders").then((r) => r.data);
export const getOrder = (id) => api.get(`/orders/${id}`).then((r) => r.data);
export const createOrder = (data) => api.post("/orders", data).then((r) => r.data);
export const cancelOrder = (id) => api.patch(`/orders/${id}/cancel`).then((r) => r.data);
export const completeOrder = (id) => api.patch(`/orders/${id}/complete`).then((r) => r.data);

export const getDashboard = () => api.get("/dashboard").then((r) => r.data);

export default api;
