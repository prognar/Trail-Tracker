import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "./lib/supabaseClient.js";
import { getMyScout, signOut } from "./lib/dataClient.js";
import RoleChooser from "./screens/RoleChooser.jsx";
import LeaderAuth from "./screens/LeaderAuth.jsx";
import ScoutCodeEntry from "./screens/ScoutCodeEntry.jsx";
import LeaderDashboard from "./screens/LeaderDashboard.jsx";
import ScoutDataView from "./scout/ScoutDataView.jsx";

const PINE_DARK = "#1D3223";
const FONT_DISPLAY = "'Arial Black', Impact, 'Helvetica Neue', sans-serif";

function LoadingScreen() {
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", background: PINE_DARK, color: "#F5F0E4", gap: 12,
    }}>
      <div style={{ fontSize: 48 }}>⛺</div>
      <div style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2 }}>LOADING TRAIL...</div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [route, setRoute] = useState("chooser"); // chooser | leader-auth | scout-code
  const [scout, setScout] = useState(undefined); // undefined = not checked, null = anon but unclaimed

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setScout(undefined);
      return;
    }
    if (session.user.is_anonymous) {
      getMyScout().then(setScout);
    }
  }, [session]);

  const handleLogout = useCallback(async () => {
    await signOut();
    setSession(null);
    setScout(undefined);
    setRoute("chooser");
  }, []);

  if (session === undefined) return <LoadingScreen />;

  // No session yet: show the role chooser, then the relevant auth screen.
  if (!session) {
    if (route === "leader-auth") {
      return <LeaderAuth onSignedIn={() => {}} onBack={() => setRoute("chooser")} />;
    }
    if (route === "scout-code") {
      return (
        <ScoutCodeEntry
          onClaimed={() => {
            // onAuthStateChange fires from signInAnonymously; re-check scout claim status.
            supabase.auth.getSession().then(({ data }) => setSession(data.session));
          }}
          onBack={() => setRoute("chooser")}
        />
      );
    }
    return (
      <RoleChooser
        onChooseLeader={() => setRoute("leader-auth")}
        onChooseScout={() => setRoute("scout-code")}
      />
    );
  }

  // Session exists and belongs to an anonymous (scout) user.
  if (session.user.is_anonymous) {
    if (scout === undefined) return <LoadingScreen />;
    if (!scout) {
      // Anonymous session exists but hasn't successfully claimed a scout yet.
      return (
        <ScoutCodeEntry
          onClaimed={() => getMyScout().then(setScout)}
          onBack={handleLogout}
        />
      );
    }
    return <ScoutDataView scout={scout} onLogout={handleLogout} />;
  }

  // Session exists and belongs to a real (leader) user.
  return <LeaderDashboard onLogout={handleLogout} />;
}
