import { cn } from '@/lib.js';
// Labeled buttons keep primary camera actions discoverable without hover or icon guessing.
export function GlassDock({ items }) {
  return (
    <div role="toolbar" aria-label="Hand input" className="flex flex-wrap items-center gap-2">
      {items.map(({ icon, id, label }) => (
        <button key={id} id={id} type="button" aria-label={label} className="input-mode">
          {icon}<span>{label}</span>
        </button>
      ))}
    </div>
  );
}
