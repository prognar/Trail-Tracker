import React, { useEffect, useState, useCallback } from "react";
import {
  getMyTroop,
  createTroop,
  listScouts,
  createScout,
  resetScoutCode,
  signOut,
} from "../lib/dataClient.js";
import ScoutDataView from "../scout/ScoutDataView.jsx";

const PINE_DARK = "#1D3223";
const PINE = "#2D4A34";
const GOLD = "#C99A2E";
const PAPER = "#FFFDF7";
const BG = "#F5F0E4";
const INK = "#2A2118";
const FONT_DISPLAY = "'Arial Black', Impact, 'Helvetica Neue', sans-serif";
const FONT_BODY = "'Segoe UI', -apple-system, Roboto, Helvetica, Arial, sans-serif";

const fieldInput = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 9,
  border: "1.5px solid #e6ddc5", fontSize: 13.5, outline: "none", background: "#fffef9",
};
const btn = (bg, color) => ({
  padding: "10px 16px", borderRadius: 10, border: "none", background: bg, color,
  fontWeight: 800, fontSize: 13.5, cursor: "pointer",
});

function CodeRevealModal({ displayName, code, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(20,16,10,0.55)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: PAPER, width: "100%", maxWidth: 400, borderRadius: 16,
        padding: "24px 22px", border: `3px solid ${GOLD}`, textAlign: "center",
      }}>
        <h3 style={{ fontFamily: FONT_DISPLAY, color: PINE_DARK, fontSize: 17, margin: "0 0 6px" }}>
          {displayName}'S CODE
        </h3>
        <p style={{ fontSize: 12.5, color: "#8a7c60", margin: "0 0 16px" }}>
          Write this down or hand it to them now — it won't be shown again. If it's lost, you can
          always generate a new one from this dashboard.
        </p>
        <div style={{
          fontFamily: "monospace", fontSize: 24, fontWeight: 800, letterSpacing: 2,
          background: "#eaf1ea", border: `1.5px solid ${PINE}`, borderRadius: 10, padding: "14px 0",
          color: PINE_DARK, marginBottom: 16,
        }}>{code}</div>
        <button onClick={onClose} style={{ ...btn(PINE, "#fff"), width: "100%" }}>Done</button>
      </div>
    </div>
  );
}

function AddScoutModal({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      await onAdd(name.trim());
      onClose();
    } catch (e) {
      setError(e.message || "Couldn't add scout.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(20,16,10,0.55)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: PAPER, width: "100%", maxWidth: 400, borderRadius: 16,
        padding: "24px 22px", border: `3px solid ${GOLD}`,
      }}>
        <h3 style={{ fontFamily: FONT_DISPLAY, color: PINE_DARK, fontSize: 17, margin: "0 0 6px" }}>
          ADD A SCOUT
        </h3>
        <p style={{ fontSize: 12.5, color: "#8a7c60", margin: "0 0 14px" }}>
          Use a first name and last initial only — e.g. "Jordan M." No email or phone needed.
        </p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan M." style={fieldInput} autoFocus />
        {error && <p style={{ fontSize: 12, color: "#a33", margin: "10px 0 0" }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ ...btn("#eee3c8", "#5c5240"), flex: 1 }}>Cancel</button>
          <button disabled={busy || !name.trim()} onClick={submit} style={{ ...btn(PINE, "#fff"), flex: 2 }}>
            {busy ? "Adding..." : "Add scout"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateTroopScreen({ onCreated }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const troop = await createTroop(name.trim());
      onCreated(troop);
    } catch (e) {
      setError(e.message || "Couldn't create troop.");
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
          NAME YOUR TROOP
        </h2>
        <p style={{ fontSize: 13, color: "#8a7c60", margin: "0 0 16px" }}>
          e.g. "Troop 452". You can add scouts right after this.
        </p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Troop 452" style={fieldInput} autoFocus />
        {error && <p style={{ fontSize: 12, color: "#a33", margin: "10px 0 0" }}>{error}</p>}
        <button disabled={busy || !name.trim()} onClick={submit} style={{ ...btn(PINE, "#fff"), width: "100%", marginTop: 16 }}>
          {busy ? "Creating..." : "Create troop"}
        </button>
      </div>
    </div>
  );
}

export default function LeaderDashboard({ onLogout }) {
  const [troop, setTroop] = useState(undefined); // undefined = loading, null = none yet
  const [scouts, setScouts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [reveal, setReveal] = useState(null); // { displayName, code }
  const [activeScout, setActiveScout] = useState(null);
  const [loadingScouts, setLoadingScouts] = useState(false);

  const refreshScouts = useCallback(async (troopId) => {
    setLoadingScouts(true);
    const list = await listScouts(troopId);
    setScouts(list);
    setLoadingScouts(false);
  }, []);

  useEffect(() => {
    (async () => {
      const t = await getMyTroop();
      setTroop(t);
      if (t) await refreshScouts(t.id);
    })();
  }, [refreshScouts]);

  const handleAddScout = async (displayName) => {
    const { scout_id, access_code } = await createScout(troop.id, displayName);
    await refreshScouts(troop.id);
    setReveal({ displayName, code: access_code });
  };

  const handleResetCode = async (scout) => {
    const code = await resetScoutCode(scout.id);
    setReveal({ displayName: scout.display_name, code });
    await refreshScouts(troop.id);
  };

  if (troop === undefined) return null;

  if (troop === null) {
    return <CreateTroopScreen onCreated={(t) => { setTroop(t); refreshScouts(t.id); }} />;
  }

  if (activeScout) {
    return (
      <div>
        <div style={{ background: PINE_DARK, padding: "10px 16px" }}>
          <button
            onClick={() => setActiveScout(null)}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
          >
            ← Back to {troop.name} roster
          </button>
        </div>
        <ScoutDataView scout={activeScout} onLogout={() => setActiveScout(null)} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: FONT_BODY }}>
      <div style={{ background: PINE_DARK, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, color: "#fff", fontSize: 16 }}>{troop.name}</div>
          <div style={{ fontSize: 11.5, color: "#c7d6c9" }}>{scouts.length} scout{scouts.length === 1 ? "" : "s"}</div>
        </div>
        <button onClick={() => signOut().then(onLogout)} style={{ background: "none", border: "1px solid #ffffff55", color: "#fff", borderRadius: 8, padding: "7px 12px", fontSize: 12.5, cursor: "pointer" }}>
          Sign out
        </button>
      </div>

      <div style={{ padding: 20, maxWidth: 640, margin: "0 auto" }}>
        <button onClick={() => setShowAdd(true)} style={{ ...btn(PINE, "#fff"), width: "100%", marginBottom: 16 }}>
          + Add a scout
        </button>

        {loadingScouts && <p style={{ color: "#8a7c60", fontSize: 13 }}>Loading roster...</p>}

        {!loadingScouts && scouts.length === 0 && (
          <p style={{ color: "#8a7c60", fontSize: 13.5, textAlign: "center", marginTop: 30 }}>
            No scouts yet — add your first one above.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {scouts.map((s) => (
            <div key={s.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: PAPER, border: "1.5px solid #e6ddc5", borderRadius: 12, padding: "12px 14px",
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: INK }}>{s.display_name}</div>
                <div style={{ fontSize: 11.5, color: "#8a7c60" }}>
                  {s.rank ? s.rank[0].toUpperCase() + s.rank.slice(1) : "No rank set"}
                  {s.auth_uid ? " · Claimed" : " · Not claimed yet"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setActiveScout(s)} style={{ ...btn("#eaf1ea", PINE_DARK), fontSize: 12 }}>
                  View / edit
                </button>
                <button onClick={() => handleResetCode(s)} style={{ ...btn("#eee3c8", "#5c5240"), fontSize: 12 }}>
                  {s.auth_uid ? "Reset code" : "New code"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAdd && <AddScoutModal onAdd={handleAddScout} onClose={() => setShowAdd(false)} />}
      {reveal && <CodeRevealModal displayName={reveal.displayName} code={reveal.code} onClose={() => setReveal(null)} />}
    </div>
  );
}
