import React, { useEffect, useState, useCallback } from "react";
import ScoutApp from "./TrailTrackerApp.jsx";
import { getScoutBadges, updateScoutProfile, upsertBadge, deleteBadge } from "../lib/dataClient.js";

// Converts scout_badges rows (snake_case) into the { [badgeId]: {...} }
// shape the UI components expect (camelCase, keyed by badge id).
function badgesRowsToMap(rows) {
  const map = {};
  for (const row of rows) {
    map[row.badge_id] = {
      status: row.status,
      counselor: row.counselor || "",
      notes: row.notes || "",
      dateStarted: row.date_started,
      dateDone: row.date_done,
    };
  }
  return map;
}

export default function ScoutDataView({ scout, onLogout }) {
  const [badges, setBadges] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const rows = await getScoutBadges(scout.id);
      if (cancelled) return;
      setBadges(badgesRowsToMap(rows));
      setProfile({
        name: scout.display_name,
        rank: scout.rank,
        interests: scout.interests || [],
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [scout.id]);

  const onUpdateProfile = useCallback(
    async (fields) => {
      const updated = await updateScoutProfile(scout.id, fields);
      setProfile((prev) => ({ ...prev, rank: updated.rank, interests: updated.interests }));
    },
    [scout.id]
  );

  const onSetBadgeStatus = useCallback(
    async (badgeId, status) => {
      if (status === "none") {
        await deleteBadge(scout.id, badgeId);
        setBadges((prev) => {
          const next = { ...prev };
          delete next[badgeId];
          return next;
        });
        return;
      }
      const existing = badges?.[badgeId] || {};
      const fields = {
        status,
        counselor: existing.counselor || "",
        notes: existing.notes || "",
        date_started: existing.dateStarted || (status !== "want" ? new Date().toISOString() : null),
        date_done: status === "done" ? new Date().toISOString() : null,
      };
      await upsertBadge(scout.id, badgeId, fields);
      setBadges((prev) => ({
        ...prev,
        [badgeId]: {
          status,
          counselor: fields.counselor,
          notes: fields.notes,
          dateStarted: fields.date_started,
          dateDone: fields.date_done,
        },
      }));
    },
    [scout.id, badges]
  );

  const onSetBadgeField = useCallback(
    async (badgeId, field, value) => {
      const existing = badges?.[badgeId] || { status: "want" };
      const dbField = field === "dateStarted" ? "date_started" : field === "dateDone" ? "date_done" : field;
      const fields = {
        status: existing.status,
        counselor: existing.counselor || "",
        notes: existing.notes || "",
        date_started: existing.dateStarted || null,
        date_done: existing.dateDone || null,
        [dbField]: value,
      };
      await upsertBadge(scout.id, badgeId, fields);
      setBadges((prev) => ({ ...prev, [badgeId]: { ...existing, [field]: value } }));
    },
    [scout.id, badges]
  );

  if (loading || !profile || !badges) {
    return null; // ScoutApp shows its own loading screen once profile is ready
  }

  return (
    <ScoutApp
      profile={{ ...profile, badges }}
      onUpdateProfile={onUpdateProfile}
      onSetBadgeStatus={onSetBadgeStatus}
      onSetBadgeField={onSetBadgeField}
      onLogout={onLogout}
      loading={false}
    />
  );
}
