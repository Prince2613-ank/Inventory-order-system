import { useState, useMemo } from "react";

export function useSortableData(data, initialKey = null, initialDir = "asc") {
  const [sort, setSort] = useState({ key: initialKey, dir: initialDir });

  const sorted = useMemo(() => {
    if (!sort.key) return data;
    return [...data].sort((a, b) => {
      let aVal = a[sort.key] ?? "";
      let bVal = b[sort.key] ?? "";
      // Coerce numeric strings (e.g. Decimal prices from the API)
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      let cmp;
      if (!isNaN(aNum) && !isNaN(bNum)) {
        cmp = aNum - bNum;
      } else {
        cmp = String(aVal).toLowerCase().localeCompare(String(bVal).toLowerCase());
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [data, sort]);

  function requestSort(key) {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  }

  return { sorted, sort, requestSort };
}
