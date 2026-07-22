import React, { useState, useEffect, useMemo, useCallback } from "react";

/* ---------------------------------------------------------------
   TRAIL TRACKER — a merit badge progress companion for Scouts BSA
   --------------------------------------------------------------- */

import trailData from "../data/trail-tracker-data.json";

const CATS = trailData.CATS;
const BADGES = trailData.BADGES;
const BADGE_BY_ID = Object.fromEntries(BADGES.map((b) => [b.id, b]));
const CHOICE_GROUP_LABEL = trailData.CHOICE_GROUP_LABEL;

// Real Scouts BSA rank ladder. Only Star, Life, and Eagle have merit-badge
// count requirements — everything below that is skill-based, not badge-based.
const RANKS = trailData.RANKS;
const RANK_MB_REQUIREMENTS = trailData.RANK_MB_REQUIREMENTS;


// Given a scout's current rank, what's the next badge-count milestone worth
// showing? Ranks below Star have no badge requirement yet, so they all point
// at Star — that's the next real target, not the far-off Eagle finish line.
function milestoneFor(rankId) {
  if (rankId === "star") return "life";
  if (rankId === "life") return "eagle";
  if (rankId === "eagle") return null;
  return "star";
}

const STATUS = {
  none: { label: "Not started", short: "—", color: "#9C948490" },
  want: { label: "Want to earn", short: "\u2606", color: "#B0791E" },
  progress: { label: "In progress", short: "\u25D0", color: "#3B5D8A" },
  done: { label: "Completed", short: "\u2713", color: "#3F6B4A" },
};

// Trail Points are just a fun, non-official counter of effort — NOT a rank.
// The only ranks in this app are the real Scouts BSA ranks in RANKS above.
const XP = { want: 5, progress: 15, done: 40 };

// Original encouragement lines — not official BSA text — just here to keep
// the trail feeling fun. Rotates based on progress so it stays fresh.
const QUOTES = [
  "Every badge starts with just being curious about something.",
  "Progress counts even on the slow weeks — keep at it.",
  "Pick the badge that sounds fun today. That's the right one.",
  "A little bit each week adds up faster than you'd think.",
  "Asking your counselor a question is part of earning the badge.",
  "The best Scouts aren't the fastest — they're the ones who keep showing up.",
  "You don't have to do it all this month. The trail's long on purpose.",
  "Camp badges count just as much as the ones from a Tuesday meeting.",
  "Getting started is the hardest requirement in any badge.",
  "Every rank you've already earned took real effort — be proud of that.",
  "It's okay to work on three badges at once, or just one at a time.",
  "The outdoors badges hit different when you actually earn them outside.",
  "Someone had to be a first-year Scout before they were an Eagle Scout.",
  "Bring your handbook to camp — that's where badges get signed off.",
  "A finished badge feels better than a perfect one. Just finish it.",
];

function pickQuote(seed) {
  const idx = Math.abs(seed) % QUOTES.length;
  return QUOTES[idx];
}

const STARTER_PACK = [
  "first-aid", "swimming", "cooking", "fishing", "geocaching",
  "chess", "art", "leatherwork", "wood-carving", "orienteering",
];

export default function ScoutApp({ profile, onUpdateProfile, onSetBadgeStatus, onSetBadgeField, onLogout, loading }) {
  const [toast, setToast] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(
    !profile.rank || !profile.interests || profile.interests.length === 0
  );

  const flashToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingBadge}>⛺</div>
        <div style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2 }}>LOADING TRAIL...</div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <Onboarding
        profile={profile}
        onComplete={(fields) => {
          onUpdateProfile(fields);
          setShowOnboarding(false);
        }}
      />
    );
  }

  return (
    <Dashboard
      profile={profile}
      setBadgeStatus={onSetBadgeStatus}
      setBadgeField={onSetBadgeField}
      onSwitch={onLogout}
      onEditProfile={() => setShowOnboarding(true)}
      flashToast={flashToast}
      toast={toast}
    />
  );
}

/* ---------------- fonts / shared styles ---------------- */
const FONT_DISPLAY = "'Arial Black', Impact, 'Helvetica Neue', sans-serif";
const FONT_BODY = "'Segoe UI', -apple-system, Roboto, Helvetica, Arial, sans-serif";

const BG = "#F5F0E4";
const INK = "#2A2118";
const PINE = "#2D4A34";
const PINE_DARK = "#1D3223";
const GOLD = "#C99A2E";
const PAPER = "#FFFDF7";

const styles = {
  loadingScreen: {
    height: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", background: PINE_DARK, color: "#F5F0E4", gap: 12,
  },
  loadingBadge: { fontSize: 48 },
};

/* ---------------- Onboarding: troop info + rank + interests ---------------- */
function Onboarding({ profile, onComplete }) {
  const [step, setStep] = useState(0);
  const [rank, setRank] = useState(profile.rank || "scout");
  const [interests, setInterests] = useState(profile.interests || []);

  const toggleInterest = (id) => {
    setInterests((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const finish = () => {
    onComplete({ rank, interests });
  };

  return (
    <div style={{
      minHeight: "100vh", background: `radial-gradient(circle at 20% 10%, #3a5c43 0%, ${PINE_DARK} 55%)`,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: FONT_BODY,
    }}>
      <div style={{
        width: "100%", maxWidth: 440, background: PAPER, borderRadius: 18,
        padding: "28px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.45)", border: `3px solid ${GOLD}`,
      }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: step >= 0 ? GOLD : "#eee3c8" }} />
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: step >= 1 ? GOLD : "#eee3c8" }} />
        </div>

        {step === 0 && (
          <>
            <h2 style={{ fontFamily: FONT_DISPLAY, color: PINE_DARK, fontSize: 20, margin: "0 0 4px" }}>
              WHAT'S YOUR RANK RIGHT NOW?
            </h2>
            <p style={{ fontSize: 13, color: "#8a7c60", margin: "0 0 16px" }}>
              This helps us point you at the very next milestone, not the whole trail.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {RANKS.map((r) => (
                <button key={r.id} onClick={() => setRank(r.id)} style={{
                  textAlign: "left", padding: "11px 14px", borderRadius: 10, cursor: "pointer",
                  border: rank === r.id ? `2px solid ${PINE}` : "1.5px solid #e6ddc5",
                  background: rank === r.id ? "#eaf1ea" : "#fffef9",
                  fontWeight: rank === r.id ? 800 : 600, fontSize: 14, color: INK,
                }}>{r.name}</button>
              ))}
            </div>
            <button onClick={() => setStep(1)} style={{ ...btn(PINE, "#fff"), width: "100%" }}>Next →</button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 style={{ fontFamily: FONT_DISPLAY, color: PINE_DARK, fontSize: 20, margin: "0 0 4px" }}>
              WHAT SOUNDS FUN?
            </h2>
            <p style={{ fontSize: 13, color: "#8a7c60", margin: "0 0 16px" }}>
              Pick anything that interests you — we'll suggest badges to match. You can change this anytime.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {Object.entries(CATS).map(([id, c]) => {
                const active = interests.includes(id);
                return (
                  <button key={id} onClick={() => toggleInterest(id)} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 10px", borderRadius: 10,
                    border: active ? `2px solid ${PINE}` : "1.5px solid #e6ddc5",
                    background: active ? "#eaf1ea" : "#fffef9", cursor: "pointer", textAlign: "left",
                  }}>
                    <span style={{ fontSize: 18 }}>{c.icon}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: INK, lineHeight: 1.2 }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep(0)} style={{ ...btn("#eee3c8", "#5c5240"), flex: 1 }}>← Back</button>
              <button
                disabled={interests.length === 0}
                onClick={finish}
                style={{ ...btn(interests.length === 0 ? "#e0d5b8" : GOLD, "#3a2c0d"), flex: 2 }}
              >Start Tracking</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function btn(bg, color) {
  return {
    padding: "10px 16px", borderRadius: 10, border: "none", background: bg, color,
    fontWeight: 800, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap",
  };
}
/* ---------------- Dashboard ---------------- */
function Dashboard({ profile, setBadgeStatus, setBadgeField, onSwitch, onEditProfile, flashToast, toast }) {
  const [tab, setTab] = useState("home");
  const [catFilter, setCatFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [onlyFirstYear, setOnlyFirstYear] = useState(false);
  const [openBadge, setOpenBadge] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const badgeState = (id) => profile.badges[id]?.status || "none";
  const interests = profile.interests || [];
  const rankId = profile.rank || "scout";
  const rankInfo = RANKS.find((r) => r.id === rankId) || RANKS[0];

  const xp = useMemo(() => {
    let total = 0;
    for (const b of Object.values(profile.badges)) total += XP[b.status] || 0;
    return total;
  }, [profile.badges]);

  const quote = useMemo(() => pickQuote(xp * 7 + Object.keys(profile.badges).length * 3), [xp, profile.badges]);

  const doneIds = useMemo(
    () => new Set(Object.entries(profile.badges).filter(([, v]) => v.status === "done").map(([k]) => k)),
    [profile.badges]
  );
  const inProgressIds = useMemo(
    () => new Set(Object.entries(profile.badges).filter(([, v]) => v.status === "progress").map(([k]) => k)),
    [profile.badges]
  );

  // Required-list math (used to gauge progress toward Star / Life / Eagle)
  const eagleReq = BADGES.filter((b) => b.eagle === "req");
  const choiceGroups = ["choice-A", "choice-B", "choice-C"];
  const eagleReqDone = eagleReq.filter((b) => doneIds.has(b.id)).length;
  const choiceDone = choiceGroups.filter((g) =>
    BADGES.some((b) => b.eagle === g && doneIds.has(b.id))
  ).length;
  const requiredListDone = eagleReqDone + choiceDone; // 0-13
  const totalDone = doneIds.size;

  // Next milestone relative to the scout's *current* rank — Star if below
  // Star, Life if currently Star, Eagle if currently Life. This is the near
  // target we show everywhere, not the full 21-badge finish line.
  const milestoneId = milestoneFor(rankId);
  const milestone = milestoneId ? RANK_MB_REQUIREMENTS[milestoneId] : null;

  const filtered = useMemo(() => {
    return BADGES
      .filter((b) => {
        if (catFilter !== "all" && b.cat !== catFilter) return false;
        if (onlyFirstYear && !b.firstYear) return false;
        if (query && !b.name.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const eagleDiff = (b.eagle ? 1 : 0) - (a.eagle ? 1 : 0);
        if (eagleDiff !== 0) return eagleDiff;
        return (isUnlocked(b, doneIds) ? 0 : 1) - (isUnlocked(a, doneIds) ? 0 : 1);
      });
  }, [catFilter, onlyFirstYear, query, doneIds]);

  // Required-list badges front and center — every one of these counts toward
  // Star, Life, and Eagle, so they're shown as a full set, not-yet-earned first.
  const requiredBadges = useMemo(() => {
    const rankOf = (id) => { const s = badgeState(id); return s === "done" ? 2 : s === "progress" ? 1 : 0; };
    return BADGES.filter((b) => b.eagle).sort((a, b) => rankOf(a.id) - rankOf(b.id));
  }, [profile.badges]);

  // Advanced badges that just became reachable because their groundwork badge
  // is now done — this is the "bubble up" as a scout ranks up / earns more.
  const unlockedAdvanced = useMemo(() => {
    return BADGES.filter((b) => b.prereq && isUnlocked(b, doneIds) && badgeState(b.id) === "none");
  }, [doneIds, profile.badges]);

  const suggestions = useMemo(() => {
    // Electives only, matched to the scout's stated interests first, then
    // backfilled with other first-year-friendly electives so there's a full set.
    const unlockedIds = new Set(unlockedAdvanced.map((b) => b.id));
    const notStarted = BADGES.filter((b) => !b.eagle && badgeState(b.id) === "none" && !unlockedIds.has(b.id));
    const matched = notStarted.filter((b) => interests.includes(b.cat));
    const matchedSorted = matched.sort((a, b) => (a.firstYear === b.firstYear) ? 0 : a.firstYear ? -1 : 1);
    const rest = notStarted.filter((b) => !interests.includes(b.cat) && b.firstYear);
    return [...matchedSorted, ...rest].slice(0, 6);
  }, [profile.badges, interests, unlockedAdvanced]);

  const handleStatus = (badge, status) => {
    setBadgeStatus(badge.id, status);
    if (status === "done") flashToast(`\u{1F31F} ${badge.name} completed — nice work!`);
    else if (status === "progress") flashToast(`${badge.name} moved to In Progress`);
    else if (status === "want") flashToast(`${badge.name} added to your goals`);
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: FONT_BODY, color: INK, paddingBottom: 40 }}>
      <TopBar profile={profile} rankInfo={rankInfo} xp={xp} onSwitch={onSwitch} onEditProfile={onEditProfile} onOpenSearch={() => setShowSearch(true)} />

      {toast && (
        <div style={{
          position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)",
          background: PINE_DARK, color: "#fff", padding: "10px 18px", borderRadius: 999,
          fontSize: 13.5, fontWeight: 700, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        }}>{toast}</div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>
        <EncouragementBar quote={quote} xp={xp} />

        <TabBar tab={tab} setTab={setTab} />

        {tab === "home" && (
          <HomeTab
            rankInfo={rankInfo}
            totalDone={totalDone}
            inProgressCount={inProgressIds.size}
            milestone={milestone}
            requiredListDone={requiredListDone}
            requiredBadges={requiredBadges}
            unlockedAdvanced={unlockedAdvanced}
            suggestions={suggestions}
            badgeState={badgeState}
            doneIds={doneIds}
            openBadge={setOpenBadge}
            onGoto={() => setTab("badges")}
          />
        )}

        {tab === "next" && (
          <NextRankTab
            rankInfo={rankInfo}
            milestone={milestone}
            totalDone={totalDone}
            requiredListDone={requiredListDone}
            doneIds={doneIds}
            inProgressIds={inProgressIds}
            openBadge={setOpenBadge}
          />
        )}

        {tab === "badges" && (
          <BadgesTab
            query={query} setQuery={setQuery}
            catFilter={catFilter} setCatFilter={setCatFilter}
            onlyFirstYear={onlyFirstYear} setOnlyFirstYear={setOnlyFirstYear}
            filtered={filtered}
            badgeState={badgeState}
            doneIds={doneIds}
            openBadge={setOpenBadge}
          />
        )}
      </div>

      {showSearch && (
        <SearchOverlay
          badgeState={badgeState}
          onClose={() => setShowSearch(false)}
          onOpenBadge={(b) => { setShowSearch(false); setOpenBadge(b); }}
          onQuickComplete={(b) => { handleStatus(b, "done"); }}
        />
      )}

      {openBadge && (
        <BadgeModal
          badge={openBadge}
          data={profile.badges[openBadge.id]}
          doneIds={doneIds}
          onClose={() => setOpenBadge(null)}
          onStatus={(s) => { handleStatus(openBadge, s); }}
          onField={(f, v) => setBadgeField(openBadge.id, f, v)}
        />
      )}
    </div>
  );
}

function TopBar({ profile, rankInfo, xp, onSwitch, onEditProfile, onOpenSearch }) {
  return (
    <div style={{ background: PINE, color: "#fff" }}>
      <div style={{
        maxWidth: 900, margin: "0 auto", padding: "14px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>⛺</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, letterSpacing: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.name}</div>
            <div style={{ fontSize: 11.5, opacity: 0.85 }}>
              {rankInfo.name} Scout{profile.troop ? ` · Troop ${profile.troop}` : ""} · {xp} pts
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={onOpenSearch} style={{
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff", borderRadius: 8, padding: "7px 10px", fontSize: 14, cursor: "pointer",
          }} aria-label="Search badges">🔍</button>
          <button onClick={onEditProfile} style={{
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff", borderRadius: 8, padding: "7px 10px", fontSize: 12.5, cursor: "pointer",
          }}>Edit</button>
          <button onClick={onSwitch} style={{
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff", borderRadius: 8, padding: "7px 10px", fontSize: 12.5, cursor: "pointer",
          }}>Switch</button>
        </div>
      </div>
    </div>
  );
}

function EncouragementBar({ quote, xp }) {
  return (
    <div style={{
      background: PAPER, borderRadius: 14, padding: "14px 16px", margin: "16px 0",
      border: "1px solid #e6ddc5", display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>🧭</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: INK, fontStyle: "italic", lineHeight: 1.4 }}>"{quote}"</div>
      </div>
      <div style={{
        flexShrink: 0, fontSize: 11.5, fontWeight: 800, color: PINE_DARK, background: "#eee3c8",
        borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap",
      }}>{xp} pts</div>
    </div>
  );
}

function TabBar({ tab, setTab }) {
  const tabs = [["home", "Home"], ["next", "Next Rank"], ["badges", "All Badges"]];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
      {tabs.map(([id, label]) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          style={{
            flex: 1, padding: "10px 8px", borderRadius: 10, border: "none",
            background: tab === id ? PINE : "#e9e2cd", color: tab === id ? "#fff" : PINE_DARK,
            fontWeight: 800, fontSize: 13.5, cursor: "pointer",
          }}
        >{label}</button>
      ))}
    </div>
  );
}

/* ---------------- Home tab ---------------- */
function HomeTab({ rankInfo, totalDone, inProgressCount, milestone, requiredListDone, requiredBadges, unlockedAdvanced, suggestions, badgeState, doneIds, openBadge, onGoto }) {
  const milestoneReqCapped = milestone ? Math.min(requiredListDone, milestone.eagleRequired) : 0;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <StatCard label="Current Rank" value={rankInfo.name} sub="tap Edit to update" color={PINE} dark />
        <StatCard label="Badges Earned" value={totalDone} sub="on your journey so far" color={PINE} />
        <StatCard label="In Progress" value={inProgressCount} sub="keep going!" color="#3B5D8A" />
        {milestone ? (
          <StatCard label={`Toward ${milestone.name}`} value={`${totalDone}/${milestone.total}`} sub={`${milestoneReqCapped}/${milestone.eagleRequired} required-list`} color={GOLD} />
        ) : (
          <StatCard label="Rank" value="Eagle 🦅" sub="Scouting's highest rank" color={GOLD} />
        )}
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${PINE} 0%, ${PINE_DARK} 100%)`, color: "#fff",
        borderRadius: "14px 14px 0 0", padding: "12px 16px",
      }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, letterSpacing: 0.3 }}>REQUIRED BADGES</div>
        <div style={{ fontSize: 12, opacity: 0.9 }}>
          {milestone
            ? `Every one of these counts toward ${milestone.name} rank — you only need some, but here's the full list`
            : "The full required-badge list — you've cleared the rank ladder, these are here for reference"}
        </div>
      </div>
      <div style={{
        background: PAPER, border: "1px solid #e6ddc5", borderTop: "none", borderRadius: "0 0 14px 14px",
        padding: 12, marginBottom: 24,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {requiredBadges.map((b) => (
            <BadgeCard key={b.id} badge={b} status={badgeState(b.id)} doneIds={doneIds} onClick={() => openBadge(b)} compact />
          ))}
        </div>
      </div>

      {unlockedAdvanced.length > 0 && (
        <>
          <SectionHeader
            title="🔓 Just unlocked"
            sub="You've earned the groundwork — these advanced badges are ready when you are"
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {unlockedAdvanced.map((b) => (
              <BadgeCard key={b.id} badge={b} status={badgeState(b.id)} doneIds={doneIds} onClick={() => openBadge(b)} compact />
            ))}
          </div>
        </>
      )}

      <SectionHeader
        title="More badges you might like"
        sub="Optional electives picked from your interests"
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20, opacity: 0.92 }}>
        {suggestions.map((b) => (
          <BadgeCard key={b.id} badge={b} status={badgeState(b.id)} doneIds={doneIds} onClick={() => openBadge(b)} compact />
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <button onClick={onGoto} style={{
          background: PINE_DARK, color: "#fff", border: "none", borderRadius: 999,
          padding: "10px 22px", fontWeight: 800, fontSize: 13.5, cursor: "pointer",
        }}>Browse all {BADGES.length} badges →</button>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, dark }) {
  return (
    <div style={{
      background: dark ? color : PAPER, color: dark ? "#fff" : INK, borderRadius: 14,
      padding: "14px 16px", border: dark ? "none" : "1px solid #e6ddc5",
    }}>
      <div style={{ fontSize: 26, fontFamily: FONT_DISPLAY, color: dark ? "#fff" : color }}>{value}</div>
      <div style={{ fontSize: 12.5, fontWeight: 800, marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: 11, opacity: dark ? 0.85 : 0.6, marginTop: 1 }}>{sub}</div>
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: PINE_DARK, letterSpacing: 0.3 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: "#8a7c60" }}>{sub}</div>}
    </div>
  );
}

/* ---------------- Next Rank tab ---------------- */
// Scoped to whatever milestone is actually next for THIS scout — Star if
// they're below Star, Life if they're Star, Eagle only once they're Life.
// The full required-list is still shown underneath because every one of
// those badges counts toward all three, but the headline number is always
// the next stop, never the 21-badge finish line.
function NextRankTab({ rankInfo, milestone, totalDone, requiredListDone, doneIds, inProgressIds, openBadge }) {
  const req = BADGES.filter((b) => b.eagle === "req");
  const groups = [
    { id: "choice-A", label: CHOICE_GROUP_LABEL["choice-A"], options: BADGES.filter((b) => b.eagle === "choice-A") },
    { id: "choice-B", label: CHOICE_GROUP_LABEL["choice-B"], options: BADGES.filter((b) => b.eagle === "choice-B") },
    { id: "choice-C", label: CHOICE_GROUP_LABEL["choice-C"], options: BADGES.filter((b) => b.eagle === "choice-C") },
  ];

  if (!milestone) {
    return (
      <div style={{
        background: `linear-gradient(135deg, ${GOLD} 0%, #8a6a1e 100%)`, color: "#fff",
        borderRadius: 16, padding: 22, textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🦅</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, marginBottom: 6 }}>EAGLE SCOUT!</div>
        <div style={{ fontSize: 13, opacity: 0.95, lineHeight: 1.5 }}>
          You've already reached the highest rank in Scouting. Keep earning badges
          for fun, or use All Badges to help mentor other scouts on their own trail.
        </div>
      </div>
    );
  }

  const totalRemaining = Math.max(0, milestone.total - totalDone);
  const reqCapped = Math.min(requiredListDone, milestone.eagleRequired);
  const reqRemaining = Math.max(0, milestone.eagleRequired - reqCapped);
  const totalPct = Math.min(100, Math.round((totalDone / milestone.total) * 100));
  const reqPct = Math.min(100, Math.round((reqCapped / milestone.eagleRequired) * 100));

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, ${PINE} 0%, ${PINE_DARK} 100%)`, color: "#fff",
        borderRadius: 16, padding: 18, marginBottom: 18,
      }}>
        <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>
          {rankInfo.name.toUpperCase()} → {milestone.name.toUpperCase()}
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, marginBottom: 10 }}>
          {totalRemaining === 0 ? "Badge count met!" : `${totalRemaining} more badge${totalRemaining === 1 ? "" : "s"} to go`}
        </div>
        <div style={{ fontSize: 12.5, opacity: 0.9, lineHeight: 1.5 }}>
          {milestone.name} rank needs <b>{milestone.total} merit badges</b> total, with
          <b> {milestone.eagleRequired}</b> coming from the required list below. You're at{" "}
          <b>{totalDone}/{milestone.total}</b> total ({reqCapped}/{milestone.eagleRequired} required-list).
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <ProgressRow label="Total merit badges" value={totalDone} goal={milestone.total} pct={totalPct} color={PINE} />
        <ProgressRow label="From the required list" value={reqCapped} goal={milestone.eagleRequired} pct={reqPct} color={GOLD} />
      </div>

      <SectionHeader title="Required-list categories" sub="Any of these count toward Star, Life, and Eagle — not just Eagle" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        {req.map((b) => (
          <ReqRow key={b.id} label={b.name} status={statusOf(b, doneIds, inProgressIds)} onClick={() => openBadge(b)} />
        ))}
      </div>

      <SectionHeader title="Choose one from each group" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {groups.map((g) => (
          <div key={g.id} style={{ background: PAPER, border: "1px solid #e6ddc5", borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: PINE_DARK, marginBottom: 8 }}>{g.label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {g.options.map((b) => (
                <ReqRow key={b.id} label={b.name} status={statusOf(b, doneIds, inProgressIds)} onClick={() => openBadge(b)} compact />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressRow({ label, value, goal, pct, color }) {
  return (
    <div style={{ background: PAPER, border: "1px solid #e6ddc5", borderRadius: 12, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
        <span style={{ fontWeight: 800, color: PINE_DARK }}>{label}</span>
        <span style={{ color: "#8a7c60" }}>{value}/{goal}</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "#eee3c8", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function statusOf(badge, doneIds, inProgressIds) {
  if (doneIds.has(badge.id)) return "done";
  if (inProgressIds.has(badge.id)) return "progress";
  return "none";
}

function ReqRow({ label, status, onClick, compact }) {
  const st = STATUS[status];
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: compact ? "transparent" : PAPER, border: compact ? "none" : "1px solid #e6ddc5",
      borderRadius: 10, padding: compact ? "4px 2px" : "10px 14px", cursor: "pointer", textAlign: "left",
      width: "100%",
    }}>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: status === "done" ? PINE_DARK : INK }}>{label}</span>
      <span style={{
        fontSize: 12, fontWeight: 800, color: st.color === "#9C948490" ? "#a89b7d" : "#fff",
        background: status === "none" ? "#eee3c8" : st.color,
        borderRadius: 999, padding: "3px 10px",
      }}>{st.label}</span>
    </button>
  );
}

/* ---------------- Badges tab ---------------- */
function BadgesTab({ query, setQuery, catFilter, setCatFilter, onlyFirstYear, setOnlyFirstYear, filtered, badgeState, doneIds, openBadge }) {
  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search badges..."
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e6ddc5",
          marginBottom: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: PAPER,
        }}
      />
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 8 }}>
        <Chip active={catFilter === "all"} onClick={() => setCatFilter("all")} label="All" />
        {Object.entries(CATS).map(([id, c]) => (
          <Chip key={id} active={catFilter === id} onClick={() => setCatFilter(id)} label={`${c.icon} ${c.label}`} />
        ))}
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 14, color: "#6b5f4d" }}>
        <input type="checkbox" checked={onlyFirstYear} onChange={(e) => setOnlyFirstYear(e.target.checked)} />
        Show only first-year-friendly badges
      </label>

      <div style={{ fontSize: 12, color: "#8a7c60", marginBottom: 8 }}>{filtered.length} badges</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {filtered.map((b) => (
          <BadgeCard key={b.id} badge={b} status={badgeState(b.id)} doneIds={doneIds} onClick={() => openBadge(b)} />
        ))}
      </div>
    </div>
  );
}

function Chip({ active, onClick, label }) {
  return (
    <button onClick={onClick} style={{
      flexShrink: 0, padding: "6px 12px", borderRadius: 999, border: "1.5px solid #e6ddc5",
      background: active ? PINE : "#fff", color: active ? "#fff" : "#5c5240",
      fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
    }}>{label}</button>
  );
}

function BadgeCard({ badge, status, doneIds, onClick, compact }) {
  const cat = CATS[badge.cat];
  const st = STATUS[status];
  const locked = badge.prereq && doneIds && !isUnlocked(badge, doneIds) && status === "none";
  return (
    <button onClick={onClick} style={{
      textAlign: "left", background: locked ? "#eee9da" : PAPER,
      border: `1.5px solid ${status === "done" ? PINE : "#e6ddc5"}`,
      borderRadius: 14, padding: "12px 12px", cursor: "pointer", position: "relative",
      display: "flex", flexDirection: "column", gap: 6, minHeight: compact ? undefined : 96,
      opacity: locked ? 0.68 : 1,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 20, filter: locked ? "grayscale(1)" : "none" }}>{cat.icon}</span>
        {badge.eagle && (
          <span style={{
            fontSize: 9.5, fontWeight: 800, background: GOLD, color: "#3a2c0d",
            borderRadius: 999, padding: "2px 7px", letterSpacing: 0.3,
          }}>REQUIRED</span>
        )}
        {!badge.eagle && locked && (
          <span style={{
            fontSize: 9.5, fontWeight: 800, background: "#c7bda0", color: "#4a4230",
            borderRadius: 999, padding: "2px 7px", letterSpacing: 0.3,
          }}>🔒 LOCKED</span>
        )}
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: locked ? "#8a7c60" : INK, lineHeight: 1.25 }}>{badge.name}</div>
      {!compact && <div style={{ fontSize: 11.5, color: "#8a7c60", lineHeight: 1.35 }}>{badge.blurb}</div>}
      {locked ? (
        <div style={{ marginTop: "auto", fontSize: 10.5, fontWeight: 700, color: "#8a7c60" }}>
          {prereqText(badge, doneIds)}
        </div>
      ) : (
        <div style={{
          marginTop: "auto", fontSize: 10.5, fontWeight: 800, alignSelf: "flex-start",
          color: status === "none" ? "#a89b7d" : "#fff",
          background: status === "none" ? "#eee3c8" : st.color, borderRadius: 999, padding: "2px 9px",
        }}>{st.label}</div>
      )}
    </button>
  );
}

/* ---------------- Global search overlay ---------------- */
// Solves "my Scout got Archery at camp, I can't find it to sign off" — search
// works from any tab and lets you mark a badge Completed in one tap.
function SearchOverlay({ badgeState, onClose, onOpenBadge, onQuickComplete }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    if (!q.trim()) return [];
    const needle = q.toLowerCase();
    return BADGES.filter((b) => b.name.toLowerCase().includes(needle)).slice(0, 20);
  }, [q]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(20,16,10,0.6)", zIndex: 110,
      display: "flex", flexDirection: "column", padding: "10vh 16px 16px",
    }}>
      <div style={{
        background: PAPER, borderRadius: 16, padding: 16, maxWidth: 520, width: "100%",
        margin: "0 auto", maxHeight: "76vh", display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search any badge, e.g. Archery..."
            style={{
              flex: 1, padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${PINE}`,
              fontSize: 15, outline: "none", boxSizing: "border-box", background: "#fffef9",
            }}
          />
          <button onClick={onClose} style={{
            background: "#eee3c8", border: "none", borderRadius: 10, padding: "0 14px",
            fontWeight: 800, fontSize: 13, cursor: "pointer", color: "#5c5240",
          }}>Close</button>
        </div>

        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {q.trim() && results.length === 0 && (
            <div style={{ fontSize: 13, color: "#8a7c60", padding: "10px 4px" }}>No badges match "{q}".</div>
          )}
          {results.map((b) => {
            const cat = CATS[b.cat];
            const status = badgeState(b.id);
            return (
              <div key={b.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
                borderRadius: 10, border: "1px solid #e6ddc5", background: "#fffef9",
              }}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                <button onClick={() => onOpenBadge(b)} style={{
                  flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer",
                  fontSize: 13.5, fontWeight: 700, color: INK, padding: 0,
                }}>{b.name}</button>
                {status !== "done" ? (
                  <button onClick={() => onQuickComplete(b)} style={{
                    background: PINE, color: "#fff", border: "none", borderRadius: 8,
                    padding: "6px 10px", fontSize: 11.5, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
                  }}>✓ Mark Done</button>
                ) : (
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: "#fff", background: PINE,
                    borderRadius: 999, padding: "4px 9px",
                  }}>Completed</span>
                )}
              </div>
            );
          })}
        </div>

        {!q.trim() && (
          <div style={{ fontSize: 12, color: "#8a7c60", padding: "10px 4px" }}>
            Type a badge name to find it fast and sign off — great for badges earned at camp.
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Badge detail modal ---------------- */
function BadgeModal({ badge, data, doneIds, onClose, onStatus, onField }) {
  const cat = CATS[badge.cat];
  const status = data?.status || "none";
  const locked = badge.prereq && doneIds && !isUnlocked(badge, doneIds) && status === "none";
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(20,16,10,0.55)", display: "flex",
      alignItems: "flex-end", justifyContent: "center", zIndex: 100,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: PAPER, width: "100%", maxWidth: 480, borderRadius: "18px 18px 0 0",
        padding: "20px 20px 26px", maxHeight: "88vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e0d5b8" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 28, filter: locked ? "grayscale(1)" : "none" }}>{cat.icon}</span>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: PINE_DARK }}>{badge.name}</div>
            <div style={{ fontSize: 11.5, color: "#8a7c60" }}>{cat.label}{badge.eagle ? " \u00B7 On the required list (Star/Life/Eagle)" : ""}</div>
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: "#5c5240", lineHeight: 1.5, margin: "10px 0 16px" }}>{badge.blurb}</p>

        {locked && (
          <div style={{
            background: "#eee9da", border: "1px solid #d8cdb2", borderRadius: 10,
            padding: "10px 12px", marginBottom: 16, fontSize: 12.5, color: "#5c5240",
          }}>
            🔒 <b>{prereqText(badge, doneIds)}</b> to unlock this one. This is just a suggested
            order to build skills — a counselor can still start it anytime.
          </div>
        )}

        <div style={{ fontSize: 12, fontWeight: 800, color: PINE_DARK, marginBottom: 8 }}>STATUS</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {Object.entries(STATUS).map(([id, s]) => {
            const disabled = locked && (id === "progress" || id === "done");
            return (
              <button
                key={id}
                disabled={disabled}
                onClick={() => !disabled && onStatus(id)}
                style={{
                  padding: "8px 12px", borderRadius: 10, border: "none",
                  cursor: disabled ? "not-allowed" : "pointer",
                  fontSize: 12.5, fontWeight: 800,
                  background: status === id ? PINE : disabled ? "#f2ece0" : "#eee3c8",
                  color: status === id ? "#fff" : disabled ? "#c2b899" : "#5c5240",
                }}
              >{s.label}</button>
            );
          })}
        </div>

        {status !== "none" && (
          <>
            <label style={fieldLabel}>MERIT BADGE COUNSELOR</label>
            <input
              value={data?.counselor || ""}
              onChange={(e) => onField("counselor", e.target.value)}
              placeholder="Name (optional)"
              style={fieldInput}
            />
            <label style={fieldLabel}>NOTES</label>
            <textarea
              value={data?.notes || ""}
              onChange={(e) => onField("notes", e.target.value)}
              placeholder="Meeting dates, requirements left, worksheet links..."
              rows={3}
              style={{ ...fieldInput, resize: "vertical", fontFamily: FONT_BODY }}
            />
          </>
        )}

        <p style={{ fontSize: 10.5, color: "#a89b7d", marginTop: 16, lineHeight: 1.5 }}>
          This tracker helps plan and log progress but isn't official record-keeping.
          Always confirm requirement text and sign-offs with a registered merit badge
          counselor, and record official completion in Scoutbook.
        </p>

        <button onClick={onClose} style={{
          width: "100%", marginTop: 16, padding: "11px 0", borderRadius: 10, border: "none",
          background: PINE_DARK, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer",
        }}>Done</button>
      </div>
    </div>
  );
}

const fieldLabel = { display: "block", fontSize: 11, fontWeight: 800, color: PINE_DARK, margin: "10px 0 5px" };
const fieldInput = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 9,
  border: "1.5px solid #e6ddc5", fontSize: 13.5, outline: "none", background: "#fffef9",
};
