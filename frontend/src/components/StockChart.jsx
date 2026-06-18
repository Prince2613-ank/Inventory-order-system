import { BarChart2 } from "lucide-react";

export default function StockChart({ products }) {
  if (!products || products.length === 0) {
    return (
      <div className="empty-state empty-state-sm">
        <div className="empty-state-svg"><BarChart2 size={36} /></div>
        <p>No products to display</p>
      </div>
    );
  }

  const display = [...products]
    .sort((a, b) => b.quantity_in_stock - a.quantity_in_stock)
    .slice(0, 10);
  const max = Math.max(...display.map((p) => p.quantity_in_stock), 1);

  return (
    <div className="stock-chart">
      {display.map((p, i) => {
        const pct = Math.max((p.quantity_in_stock / max) * 100, p.quantity_in_stock > 0 ? 2 : 0);
        const barCls =
          p.quantity_in_stock === 0 ? "bar-empty" :
          p.quantity_in_stock < 10 ? "bar-low" : "bar-ok";
        return (
          <div key={p.id} className="chart-row" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="chart-label" title={p.name}>{p.name}</div>
            <div className="chart-track">
              <div className={`chart-bar ${barCls}`} style={{ "--bar-pct": `${pct}%` }} />
            </div>
            <div className="chart-val">{p.quantity_in_stock}</div>
          </div>
        );
      })}
    </div>
  );
}
