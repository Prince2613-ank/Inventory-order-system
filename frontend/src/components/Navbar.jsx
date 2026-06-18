import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, Users, ShoppingCart, Boxes } from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard size={16} />, end: true },
  { to: "/products", label: "Products", icon: <Package size={16} /> },
  { to: "/customers", label: "Customers", icon: <Users size={16} /> },
  { to: "/orders", label: "Orders", icon: <ShoppingCart size={16} /> },
];

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-brand-icon"><Boxes size={18} strokeWidth={2} /></div>
        <span>Inventory OS</span>
      </div>
      <ul className="navbar-links">
        {links.map(({ to, label, icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end}>
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
