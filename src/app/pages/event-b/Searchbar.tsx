"use client";

import { Search, CalendarDays } from "lucide-react";

type SearchBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
};

export default function SearchBar({
  query,
  onQueryChange,
  dateFilter,
  onDateFilterChange,
}: SearchBarProps) {
  return (
    <div className="d-flex flex-wrap gap-2" style={{ flex: 1 }}>
      <div style={{ position: "relative", flex: "1 1 220px", minWidth: 200 }}>
        <Search
          style={{
            width: "1rem",
            height: "1rem",
            position: "absolute",
            left: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#6c757d",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          className="form-control"
          placeholder="Search events..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          style={{ paddingLeft: "2.25rem", fontFamily: "inherit" }}
          aria-label="Search events by title"
        />
      </div>

      <div style={{ position: "relative", flex: "0 1 200px", minWidth: 170 }}>
        <CalendarDays
          style={{
            width: "1rem",
            height: "1rem",
            position: "absolute",
            left: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#6c757d",
            pointerEvents: "none",
          }}
        />
        <input
          type="date"
          className="form-control"
          value={dateFilter}
          onChange={(e) => onDateFilterChange(e.target.value)}
          style={{ paddingLeft: "2.25rem", fontFamily: "inherit" }}
          aria-label="Filter events by date"
        />
      </div>
    </div>
  );
}
