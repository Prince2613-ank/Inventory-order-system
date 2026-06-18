import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">Inventory System</div>
      <ul className="navbar-links">
        <li><NavLink to="/" end>Dashboard</NavLink></li>
        <li><NavLink to="/products">Products</NavLink></li>
        <li><NavLink to="/customers">Customers</NavLink></li>
        <li><NavLink to="/orders">Orders</NavLink></li>
      </ul>
    </nav>
  );
}
