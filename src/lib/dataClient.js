import { supabase } from "./supabaseClient.js";

/* ===================== Leader auth ===================== */

export async function signUpLeader(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInLeader(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
  if (error) throw error;
}

export async function signInWithApple() {
  const { error } = await supabase.auth.signInWithOAuth({ provider: "apple" });
  if (error) throw error;
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/* ===================== Role detection ===================== */
// A logged-in auth user could be a leader (owns a troop) or a claimed
// scout (a scouts row with auth_uid = their id). Anonymous auth users
// are always scouts (or unclaimed / mid-claim).

export async function getMyTroop() {
  const { data, error } = await supabase.from("troops").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function createTroop(name) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("troops")
    .insert({ leader_user_id: user.id, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMyScout() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("scouts")
    .select("*")
    .eq("auth_uid", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/* ===================== Leader: manage scouts ===================== */

export async function listScouts(troopId) {
  const { data, error } = await supabase
    .from("scouts")
    .select("*")
    .eq("troop_id", troopId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

// Returns { scout_id, access_code } — access_code is shown ONCE, hand it
// to the scout immediately (printed slip, verbally, etc.) and don't store
// it anywhere client-side beyond this in-memory return value.
export async function createScout(troopId, displayName) {
  const { data, error } = await supabase.rpc("create_scout", {
    p_troop_id: troopId,
    p_display_name: displayName,
  });
  if (error) throw error;
  return data[0];
}

// Leader-only "forgot code" flow. Returns the new plaintext code, shown once.
export async function resetScoutCode(scoutId) {
  const { data, error } = await supabase.rpc("reset_scout_code", {
    p_scout_id: scoutId,
  });
  if (error) throw error;
  return data;
}

export async function getScoutBadges(scoutId) {
  const { data, error } = await supabase
    .from("scout_badges")
    .select("*")
    .eq("scout_id", scoutId);
  if (error) throw error;
  return data;
}

/* ===================== Scout: claim + session ===================== */

// Ensures the current browser has an anonymous Supabase session (creates
// one if needed), then attempts to claim a scout profile using the code
// alone — no scout ID needed, just what the leader handed the scout.
export async function claimScoutWithCode(code) {
  let {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    session = data.session;
  }

  const { data: scoutId, error: claimError } = await supabase.rpc("claim_scout", {
    p_code: code.trim().toUpperCase(),
  });
  if (claimError) throw claimError;
  return { session, scoutId };
}

/* ===================== Shared: scout profile + badges ===================== */

export async function updateScoutProfile(scoutId, fields) {
  const { data, error } = await supabase
    .from("scouts")
    .update(fields)
    .eq("id", scoutId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertBadge(scoutId, badgeId, fields) {
  const { error } = await supabase
    .from("scout_badges")
    .upsert({ scout_id: scoutId, badge_id: badgeId, ...fields }, { onConflict: "scout_id,badge_id" });
  if (error) throw error;
}

export async function deleteBadge(scoutId, badgeId) {
  const { error } = await supabase
    .from("scout_badges")
    .delete()
    .eq("scout_id", scoutId)
    .eq("badge_id", badgeId);
  if (error) throw error;
}
