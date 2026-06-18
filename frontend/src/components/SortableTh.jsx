export default function SortableTh({ label, sortKey, sort, onSort }) {
  const active = sort.key === sortKey;
  return (
    <th
      className={`sortable-th ${active ? "sort-active" : ""}`}
      onClick={() => onSort(sortKey)}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      {label}
      <span className="sort-icon">
        {active ? (sort.dir === "asc" ? " ↑" : " ↓") : " ⇅"}
      </span>
    </th>
  );
}
