"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { inputClass, secondaryButtonClass } from "@/components/ui";

export interface SearchableStudent {
  id: string;
  name: string;
  indexNumber: string | null;
}

// Type-to-search student picker — used in place of a plain <select> wherever
// the student list can get long enough that scrolling a dropdown is awkward
// (e.g. promoting a student to course rep). Filters by name or index number
// as the admin types, supports arrow-key navigation, and closes on an
// outside click or Escape. Once a student is picked, shows a compact
// read-only chip with a "Change" button instead of the search box, so it's
// obvious who's selected.
export default function StudentSearchSelect({
  students,
  value,
  onChange,
  placeholder = "Search by name or index number…",
}: {
  students: SearchableStudent[];
  value: string;
  onChange: (studentId: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const selected = students.find((s) => s.id === value) ?? null;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students.slice(0, 20);
    return students
      .filter((s) => s.name.toLowerCase().includes(q) || (s.indexNumber ?? "").toLowerCase().includes(q))
      .slice(0, 20);
  }, [students, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function updateQuery(next: string) {
    setQuery(next);
    setHighlighted(0);
    setOpen(true);
  }

  function pick(studentId: string) {
    onChange(studentId);
    setQuery("");
    setHighlighted(0);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const match = results[highlighted];
      if (match) pick(match.id);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50">
        <span className="flex-1 text-slate-900">
          {selected.name}
          <span className="text-slate-400">
            {" "}
            {selected.indexNumber ? `(${selected.indexNumber})` : "(no index #)"}
          </span>
        </span>
        <button
          type="button"
          className={`${secondaryButtonClass} !py-1 !px-2 text-xs`}
          onClick={() => {
            onChange("");
            setQuery("");
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => updateQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={inputClass}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={listboxId}
      />
      {open && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-400">No matching students.</p>
          ) : (
            results.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="option"
                aria-selected={i === highlighted}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s.id)}
                className={`w-full text-left px-3 py-2 text-sm ${
                  i === highlighted ? "bg-blue-50 text-blue-900" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {s.name}
                <span className="text-slate-400"> {s.indexNumber ? `(${s.indexNumber})` : "(no index #)"}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
