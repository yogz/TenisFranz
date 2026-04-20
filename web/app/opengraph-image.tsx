import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "TenisFranz — Qui va gagner ?";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a0a0a",
          color: "#f5f5f5",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 18px",
            borderRadius: 999,
            border: "1px solid #262626",
            backgroundColor: "#121212",
            color: "#a1a1aa",
            fontSize: 22,
            alignSelf: "flex-start",
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: "#ccff00",
              display: "block",
            }}
          />
          TenisFranz
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 128,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: "#f5f5f5",
            }}
          >
            Qui va gagner&nbsp;?
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.35, color: "#a1a1aa", maxWidth: 900 }}>
            Prédictions transparentes pour tous les matchs ATP &amp; WTA.
            Modèle entraîné sur 15+ ans de données, track record public.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#a1a1aa",
          }}
        >
          <span>tenis-franz.vercel.app</span>
          <span style={{ color: "#ccff00" }}>ATP · WTA · daily</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
