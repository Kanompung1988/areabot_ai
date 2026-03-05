/**
 * TobTan brand icon — Figma "Frame 19" (viewBox 616×616)
 *
 * Props:
 *   size    — px size (default 16)
 *   invert  — true = white bubble + dark sparkle (for dark backgrounds)
 */
export default function TobTanIcon({
  size = 16,
  invert = false,
}: {
  size?: number;
  invert?: boolean;
}) {
  const bubbleColor = invert ? "#FFFFFF" : "#181818";
  const sparkleColor = invert ? "#1a1a1a" : "#FFFFFF";
  const cx = 370;
  const cy = 268;
  const r = 72; // outer point radius
  const ri = r * 0.18; // inner concave indent

  // 4-pointed sparkle with concave sides (quadratic bezier)
  const sparkle = [
    `M ${cx} ${cy - r}`,
    `Q ${cx + ri} ${cy - ri} ${cx + r} ${cy}`,
    `Q ${cx + ri} ${cy + ri} ${cx} ${cy + r}`,
    `Q ${cx - ri} ${cy + ri} ${cx - r} ${cy}`,
    `Q ${cx - ri} ${cy - ri} ${cx} ${cy - r}`,
    "Z",
  ].join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 616 616"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/*
        Bubble + circle subtract using even-odd fill rule.
        Bubble clockwise:  M271,143 → top edge → TR arc → right edge
                           → BR tiny arc → bottom edge → BL arc → TL arc
        Circle clockwise at center(377,299) r=75 → appears as a hole
      */}
      <path
        d="M271 143 L345 143
          A124 124 0 0 1 469 267
          L469 379
          A12 12 0 0 1 457 391
          L271 391
          A124 124 0 0 1 147 267
          A124 124 0 0 1 271 143 Z"
        fill={bubbleColor}
      />

      {/* 4-pointed sparkle */}
      <path d={sparkle} fill={sparkleColor} />
    </svg>
  );
}
