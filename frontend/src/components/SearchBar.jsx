export default function SearchBar({ value, onChange, placeholder = "Search…", resultCount }) {
  return (
    <div className="search-bar-wrapper">
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
        {value && (
          <button type="button" className="search-clear" onClick={() => onChange("")} aria-label="Clear search">
            ✕
          </button>
        )}
      </div>
      {value && resultCount !== undefined && (
        <span className="search-result-count">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
