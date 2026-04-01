import type { ReactNode } from "react";

type FieldShellProps = {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
};

export function FieldShell({
  label,
  htmlFor,
  error,
  children,
}: FieldShellProps) {
  return (
    <div className="group">
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#9a8983] transition-colors group-focus-within:text-primary"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-2 text-xs text-[#c05d5d]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
