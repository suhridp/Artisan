// src/perkslabel.jsx
import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_PERKS = [
  "An Elegant Addition to Any Outfit",
  "100% Authentic",
  "A Long-Term Sustainable Investment",
  "Unique Design",
];

export default function Perks({
  selected = [],
  onChange,
  options = DEFAULT_PERKS,
  title = "Perks",
  hint = "Select all that apply",
  name = "perks",
  className = "",
  disabled = false,
  error = "",
  showSelectAll = true,
  allowCustom = false,
}) {
  // Normalize options to { value, label }
  const normalized = useMemo(
    () =>
      options.map((opt) =>
        typeof opt === "string" ? { value: opt, label: opt } : opt
      ),
    [options]
  );

  const values = normalized.map((o) => o.value);
  const selectedSet = useMemo(() => new Set(selected || []), [selected]);

  // Select all state
  const allChecked =
    values.length > 0 && values.every((v) => selectedSet.has(v));
  const noneChecked = values.every((v) => !selectedSet.has(v));
  const indeterminate = !allChecked && !noneChecked;

  const selectAllRef = useRef(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  // Emit helper
  function emit(nextArray) {
    if (typeof onChange === "function") onChange(nextArray);
  }

  function toggle(value, checked) {
    if (disabled) return;
    const next = new Set(selectedSet);
    if (checked) next.add(value);
    else next.delete(value);
    emit([...next]);
  }

  function toggleAll(checked) {
    if (disabled) return;
    if (checked) emit([...new Set([...selectedSet, ...values])]);
    else emit([...selectedSet].filter((v) => !values.includes(v)));
  }

  // Optional custom perk input
  const [custom, setCustom] = useState("");
  function addCustom() {
    const v = custom.trim();
    if (!v) return;
    if (!selectedSet.has(v)) emit([...selectedSet, v]);
    setCustom("");
  }

  return (
    <section className={`space-y-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl tracking-tight text-neutral-900">
          {title}
        </h2>
        {error && (
          <span className="text-sm text-red-600" role="alert">
            {error}
          </span>
        )}
      </div>
      {hint && <p className="text-sm text-neutral-600">{hint}</p>}

      {showSelectAll && (
        <label className="mt-1 inline-flex select-none items-center gap-2 text-sm text-neutral-800">
          <input
            ref={selectAllRef}
            type="checkbox"
            disabled={disabled || values.length === 0}
            checked={allChecked}
            onChange={(e) => toggleAll(e.target.checked)}
          />
          <span>{allChecked ? "Clear all" : "Select all"}</span>
        </label>
      )}

      <div
        role="group"
        aria-label={title}
        aria-disabled={disabled ? "true" : "false"}
        className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6"
      >
        {normalized.map(({ value, label }) => (
          <label
            key={value}
            className={[
              "flex cursor-pointer items-center gap-2 rounded-2xl border p-3 transition",
              disabled
                ? "opacity-60 cursor-not-allowed"
                : "hover:border-neutral-400",
              selectedSet.has(value)
                ? "border-neutral-900 bg-white shadow-sm"
                : "border-neutral-300 bg-white",
            ].join(" ")}
          >
            <input
              type="checkbox"
              name={name}
              disabled={disabled}
              checked={selectedSet.has(value)}
              onChange={(e) => toggle(value, e.target.checked)}
              className="accent-neutral-900"
              value={value}
            />
            <span className="text-sm text-neutral-900">{label}</span>
          </label>
        ))}
      </div>

      {allowCustom && (
        <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            disabled={disabled}
            placeholder="Add a custom perk"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={disabled || !custom.trim()}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 transition hover:bg-neutral-50 disabled:opacity-60"
          >
            Add
          </button>
        </div>
      )}

      {/* SR-only duplicates to play nice with some form libs (optional) */}
      <div className="sr-only" aria-hidden>
        {normalized.map(({ value, label }) => (
          <label key={`sr-${value}`}>
            <input
              type="checkbox"
              name={`${name}-sr`}
              checked={selectedSet.has(value)}
              onChange={() => toggle(value, !selectedSet.has(value))}
              disabled={disabled}
              value={value}
            />
            {label}
          </label>
        ))}
      </div>
    </section>
  );
}
