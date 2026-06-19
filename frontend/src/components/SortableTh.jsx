import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export default function SortableTh({ label, sortKey, sort, onSort, className = "" }) {
  const active = sort.key === sortKey;
  return (
    <th
      className={`sortable-th ${active ? "sort-active" : ""} ${className}`}
      onClick={() => onSort(sortKey)}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      {label}
      <span className="sort-icon">
        {active
          ? (sort.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)
          : <ArrowUpDown size={12} />}
      </span>
    </th>
  );
}
