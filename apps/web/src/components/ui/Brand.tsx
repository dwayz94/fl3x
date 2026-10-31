import type { ReactNode } from "react";

/**
 * Moga headings swap selected letters to the brand pink, e.g. FL<3>X.
 * Wrap the letters to highlight in [brackets]: <Brand>FL[3]X</Brand>.
 */
export function Brand({ children }: { children: string }): ReactNode {
  // One span: inside a flex parent with a gap, loose text nodes would each get spaced apart.
  return (
    <span>
      {children.split(/(\[[^\]]+\])/g).map((part, i) =>
        part.startsWith("[") ? (
          <span key={i} className="text-brand">
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  );
}
