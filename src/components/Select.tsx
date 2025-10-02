"use client";

export type Option = {
  value: string;
  label: string;
};

type SelectProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  width?: string; // e.g., "w-40" (Tailwind) or "200px"
  fullWidth?: boolean; // takes priority
};

export default function Select({
  options,
  value,
  onChange,
  placeholder = "Select...",
  width = "w-40",
  fullWidth = false,
}: SelectProps) {
  const wrapperClass = fullWidth ? "w-full" : width;

  return (
    <div
      className={`relative inline-block ${wrapperClass}`}
      style={{
        width: fullWidth
          ? "100%" // fullWidth always wins
          : width?.includes("w-")
          ? undefined // handled by Tailwind
          : width, // raw px/rem
      }}
    >
      <select
        className="
          w-full appearance-none bg-white border border-gray-300 rounded-md
          py-2 pr-8 pl-3 text-sm leading-5 cursor-pointer
          truncate
        "
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} title={opt.label}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom dropdown arrow */}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">▾</span>
    </div>
  );
}
