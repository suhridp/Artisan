// src/catagorylabel.jsx
export default function Catagory({
  selected,
  onChange,
  multi = false,
  options = ["Handicraft", "Spice", "Book", "Clothing", "Others"],
  title = "Categories",
  hint = "Select the most appropriate category",
  allowClear = true,
  disabled = false,
  required = false,
  error = "",
  name = "category",
  className = "",
}) {
  // Normalize options to { value, label }
  const normalized = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  // Normalize selected to array for internal logic
  const selArray = Array.isArray(selected)
    ? selected
    : selected
    ? [selected]
    : [];

  // Helpers
  const isActive = (v) => selArray.includes(v);

  function emit(next) {
    if (typeof onChange !== "function") return;
    if (multi) onChange(next); // array
    else onChange(next[0] || ""); // string (or empty if cleared)
  }

  function toggle(value) {
    if (disabled) return;

    if (multi) {
      if (isActive(value)) {
        emit(selArray.filter((v) => v !== value));
      } else {
        emit([...selArray, value]);
      }
    } else {
      if (isActive(value)) {
        emit(allowClear ? [] : selArray); // clear only if allowed
      } else {
        emit([value]);
      }
    }
  }

  const groupProps = multi
    ? { role: "group", "aria-label": title }
    : { role: "radiogroup", "aria-label": title };

  return (
    <section className={`space-y-2 ${className}`}>
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-xl tracking-tight text-neutral-900">
          {title}
          {required && <span className="ml-1 text-red-600">*</span>}
        </h2>
        {error && (
          <span className="text-sm text-red-600" role="alert">
            {error}
          </span>
        )}
      </div>
      {hint && <p className="text-sm text-neutral-600">{hint}</p>}

      <div
        {...groupProps}
        aria-disabled={disabled ? "true" : "false"}
        className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6"
      >
        {normalized.map(({ value, label }) => {
          const active = isActive(value);
          const ariaProps = multi
            ? { "aria-pressed": active } // toggle button
            : { role: "radio", "aria-checked": active };
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              disabled={disabled}
              {...ariaProps}
              className={[
                "inline-flex items-center justify-center rounded-full px-3 py-2 text-sm transition-colors",
                "border focus:outline-none focus:ring-2 focus:ring-neutral-500/30",
                active
                  ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                  : "bg-white text-neutral-800 border-neutral-300 hover:border-neutral-500 hover:text-neutral-900",
                disabled ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Accessible inputs kept in sync (useful for forms/validation) */}
      <div className="sr-only" aria-hidden>
        {normalized.map(({ value, label }) => (
          <label key={`sr-${value}`}>
            <input
              type={multi ? "checkbox" : "radio"}
              name={name}
              value={value}
              checked={isActive(value)}
              onChange={() => toggle(value)}
              disabled={disabled}
              required={required && !multi}
            />
            {label}
          </label>
        ))}
      </div>
    </section>
  );
}
