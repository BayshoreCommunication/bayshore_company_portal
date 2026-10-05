"use client";

// A checkbox with a third look: a dash when only some of what it stands for is
// ticked (a main service with part of its sub-services, "select all" with part of
// the list). Clicking it always goes to all-or-nothing, decided by the caller.
const TriCheckbox = ({
  checked,
  partial = false,
  label,
  onChange,
  className = "",
}: {
  checked: boolean;
  partial?: boolean;
  label: string;
  onChange: () => void;
  className?: string;
}) => (
  <input
    type="checkbox"
    className={`h-4 w-4 shrink-0 cursor-pointer accent-[#0b0c24] ${className}`}
    aria-label={label}
    aria-checked={partial ? "mixed" : checked}
    checked={checked}
    // `indeterminate` exists only as a DOM property, not as an attribute.
    ref={(element) => {
      if (element) element.indeterminate = partial && !checked;
    }}
    onChange={onChange}
  />
);

export default TriCheckbox;
