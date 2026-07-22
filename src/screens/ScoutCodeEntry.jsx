import React, { useState } from "react";
import { claimScoutWithCode } from "../lib/dataClient.js";

const PINE_DARK = "#1D3223";
const PINE = "#2D4A34";
const GOLD = "#C99A2E";
const PAPER = "#FFFDF7";
const FONT_DISPLAY = "'Arial Black', Impact, 'Helvetica Neue', sans-serif";
const FONT_BODY = "'Segoe UI', -apple-system, Roboto, Helvetica, Arial, sans-serif";

const fieldInput = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 9,
  border: "1.5px solid #e6ddc5", fontSize: 18, outline: "none", background: "#fffef9",
  textAlign: "center", letterSpacing: 2, textTransform: "uppercase", fontFamily: "monospace",
};

export default function ScoutCodeEntry({ onClaimed, onBack }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setBusy(true);
    try {
      await claimScoutWithCode(code);
      onClaimed();
    } catch (e) {
      setError(e.message || "That code didn't work. Double check it and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: `radial-gradient(circle at 20% 10%, #3a5c43 0%, ${PINE_DARK} 55%)`,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: FONT_BODY,
    }}>
      <div style={{
        width: "100%", maxWidth: 420, background: PAPER, borderRadius: 18,
        padding: "28px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.45)", border: `3px solid ${GOLD}`,
      }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, color: PINE_DARK, fontSize: 20, margin: "0 0 4px" }}>
          ENTER YOUR CODE
        </h2>
        <p style={{ fontSize: 13, color: "#8a7c60", margin: "0 0 18px" }}>
          Your troop leader gave you a code like <b>7F3-KQ9-2LM</b>. No email or password needed —
          just type it in.
        </p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="XXX-XXX-XXX"
          style={fieldInput}
          autoFocus
        />
        {error && <p style={{ fontSize: 12.5, color: "#a33", margin: "10px 0 0" }}>{error}</p>}
        <button
          disabled={busy || !code.trim()}
          onClick={handleSubmit}
          style={{
            width: "100%", marginTop: 16, padding: "12px 0", borderRadius: 10, border: "none",
            background: PINE, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
          }}
        >
          {busy ? "Checking..." : "Continue"}
        </button>
        <p style={{ fontSize: 11.5, color: "#9c8f75", margin: "14px 0 0", lineHeight: 1.4 }}>
          Lost your code? Ask your troop leader — they can give you a new one anytime.
        </p>
        <button onClick={onBack} style={{ marginTop: 14, background: "none", border: "none", color: "#8a7c60", cursor: "pointer", fontSize: 12.5 }}>
          ← Back
        </button>
      </div>
    </div>
  );
}
