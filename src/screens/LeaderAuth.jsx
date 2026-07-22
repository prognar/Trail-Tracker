import React, { useState } from "react";
import {
  signInLeader,
  signUpLeader,
  signInWithGoogle,
  signInWithApple,
  requestPasswordReset,
} from "../lib/dataClient.js";

const PINE_DARK = "#1D3223";
const PINE = "#2D4A34";
const GOLD = "#C99A2E";
const PAPER = "#FFFDF7";
const INK = "#2A2118";
const FONT_DISPLAY = "'Arial Black', Impact, 'Helvetica Neue', sans-serif";
const FONT_BODY = "'Segoe UI', -apple-system, Roboto, Helvetica, Arial, sans-serif";

const fieldLabel = { display: "block", fontSize: 11, fontWeight: 800, color: PINE_DARK, margin: "10px 0 5px" };
const fieldInput = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 9,
  border: "1.5px solid #e6ddc5", fontSize: 13.5, outline: "none", background: "#fffef9",
};
const btn = (bg, color) => ({
  padding: "11px 16px", borderRadius: 10, border: "none", background: bg, color,
  fontWeight: 800, fontSize: 14, cursor: "pointer", width: "100%",
});

export default function LeaderAuth({ onSignedIn, onBack }) {
  const [mode, setMode] = useState("signin"); // signin | signup | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUpLeader(email, password);
        setInfo("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else if (mode === "reset") {
        await requestPasswordReset(email);
        setInfo("Password reset email sent.");
      } else {
        await signInLeader(email, password);
        onSignedIn();
      }
    } catch (e) {
      setError(e.message || "Something went wrong.");
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
          {mode === "signup" ? "CREATE LEADER ACCOUNT" : mode === "reset" ? "RESET PASSWORD" : "TROOP LEADER SIGN IN"}
        </h2>
        <p style={{ fontSize: 13, color: "#8a7c60", margin: "0 0 16px" }}>
          This is a real account, since you'll be managing your scouts' progress and access codes.
        </p>

        <label style={fieldLabel}>EMAIL</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" style={fieldInput} />

        {mode !== "reset" && (
          <>
            <label style={fieldLabel}>PASSWORD</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" style={fieldInput} />
          </>
        )}

        {error && <p style={{ fontSize: 12.5, color: "#a33", margin: "10px 0 0" }}>{error}</p>}
        {info && <p style={{ fontSize: 12.5, color: "#3F6B4A", margin: "10px 0 0" }}>{info}</p>}

        <div style={{ marginTop: 16 }}>
          <button disabled={busy} onClick={handleSubmit} style={btn(PINE, "#fff")}>
            {mode === "signup" ? "Create account" : mode === "reset" ? "Send reset email" : "Sign in"}
          </button>
        </div>

        {mode === "signin" && (
          <>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={signInWithGoogle} style={{ ...btn("#fffef9", INK), border: "1.5px solid #e6ddc5" }}>
                Continue with Google
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={signInWithApple} style={{ ...btn("#fffef9", INK), border: "1.5px solid #e6ddc5" }}>
                Continue with Apple
              </button>
            </div>
          </>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: 12.5 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "#8a7c60", cursor: "pointer" }}>
            ← Back
          </button>
          <div style={{ display: "flex", gap: 12 }}>
            {mode !== "signin" && (
              <button onClick={() => setMode("signin")} style={{ background: "none", border: "none", color: PINE, cursor: "pointer", fontWeight: 700 }}>
                Sign in
              </button>
            )}
            {mode !== "signup" && (
              <button onClick={() => setMode("signup")} style={{ background: "none", border: "none", color: PINE, cursor: "pointer", fontWeight: 700 }}>
                Create account
              </button>
            )}
            {mode !== "reset" && (
              <button onClick={() => setMode("reset")} style={{ background: "none", border: "none", color: PINE, cursor: "pointer", fontWeight: 700 }}>
                Forgot password?
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
