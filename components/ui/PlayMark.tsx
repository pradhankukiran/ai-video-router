import type { SVGProps } from "react";

interface PlayMarkProps extends SVGProps<SVGGElement> {
  cx?: number;
  cy?: number;
  r?: number;
}

/**
 * The app's brand mark: a red circle with a white play triangle.
 * Rendered as an SVG `<g>` so it can be positioned anywhere inside a
 * host `<svg>` (hero, card placeholder, etc.).
 *
 * Triangle is centroid-centered — the visual weight sits at the
 * circle's centre, not the bounding box — which reads as balanced the
 * way classic play buttons do (YouTube, Netflix).
 *
 *   triangle width  = 0.80 × r
 *   triangle height = 0.85 × r
 */
export function PlayMark({
  cx = 50,
  cy = 50,
  r = 50,
  ...rest
}: PlayMarkProps) {
  const triW = r * 0.8;
  const triH = r * 0.85;
  const baseX = cx - triW / 3;
  const apexX = cx + (triW * 2) / 3;
  const baseTop = cy - triH / 2;
  const baseBottom = cy + triH / 2;
  return (
    <g {...rest}>
      <circle cx={cx} cy={cy} r={r} fill="#d92f2a" />
      <polygon
        points={`${baseX},${baseTop} ${baseX},${baseBottom} ${apexX},${cy}`}
        fill="#ffffff"
      />
    </g>
  );
}
