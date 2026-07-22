import React from "react";

const PINE_DARK = "#1D3223";
const PINE = "#2D4A34";
const GOLD = "#C99A2E";
const PAPER = "#FFFDF7";
const FONT_DISPLAY = "'Arial Black', Impact, 'Helvetica Neue', sans-serif";
const FONT_BODY = "'Segoe UI', -apple-system, Roboto, Helvetica, Arial, sans-serif";

export default function RoleChooser({ onChooseLeader, onChooseScout }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 20% 10%, #3a5c43 0%, ${PINE_DARK} 55%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: FONT_BODY,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: PAPER,
          borderRadius: 18,
          padding: "32px 24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
          border: `3px solid ${GOLD}`,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontFamily: FONT_DISPLAY, color: PINE_DARK, fontSize: 22, margin: "0 0 6px" }}>
          TRAIL TRACKER
        </h1>
        <p style={{ fontSize: 13.5, color: "#8a7c60", margin: "0 0 24px" }}>
          Are you signing in as a troop leader or a scout?
        </p>
        <button
          onClick={onChooseLeader}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
            background: PINE, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", marginBottom: 10,
          }}
        >
          I'm a troop leader
        </button>
        <button
          onClick={onChooseScout}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 10, border: `1.5px solid ${PINE}`,
            background: "#fffef9", color: PINE_DARK, fontWeight: 800, fontSize: 15, cursor: "pointer",
          }}
        >
          I'm a scout
        </button>
      </div>
    </div>
  );
}
