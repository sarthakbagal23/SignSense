// Letters ride a gentle wave (after Vengeance UI's Kinetic Text Loader). Used for loading states.
export function KineticText({ text, id, className }) {
  return (
    <span id={id} className={className} aria-label={text} role="status">
      {[...text].map((c, i) => <span key={i} aria-hidden className="kinetic-ch" style={{ animationDelay: `${i * 70}ms` }}>{c === ' ' ? ' ' : c}</span>)}
    </span>
  );
}
