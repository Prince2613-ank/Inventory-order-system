import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: "◈", end: true },
  { to: "/products", label: "Products", icon: "⬡" },
  { to: "/customers", label: "Customers", icon: "◎" },
  { to: "/orders", label: "Orders", icon: "◷" },
];

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-brand-icon">📦</div>
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
