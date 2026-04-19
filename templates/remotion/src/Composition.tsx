import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";

export const mainSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
});

export const MainComposition: React.FC<z.infer<typeof mainSchema>> = ({
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [0, 25], [24, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#ffffff",
        color: "#0f172a",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 120, fontWeight: 600, margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 40, color: "#475569", margin: 0 }}>{subtitle}</p>
      </div>
    </AbsoluteFill>
  );
};
