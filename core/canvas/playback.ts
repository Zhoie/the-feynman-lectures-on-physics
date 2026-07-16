"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "feynman:animation-paused";
const PLAYBACK_EVENT = "feynman:animation-playback";

let cachedOverride: boolean | null | undefined;

function readStoredOverride() {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "true") return true;
    if (stored === "false") return false;
  } catch {
    return null;
  }
  return null;
}

function getOverrideSnapshot() {
  if (cachedOverride === undefined) {
    cachedOverride = readStoredOverride();
  }
  return cachedOverride;
}

function subscribeOverride(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cachedOverride = readStoredOverride();
    listener();
  };
  const handlePlayback = () => listener();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(PLAYBACK_EVENT, handlePlayback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(PLAYBACK_EVENT, handlePlayback);
  };
}

function getReducedMotionSnapshot() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function subscribeReducedMotion(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function publishOverride(value: boolean | null) {
  cachedOverride = value;
  if (typeof window === "undefined") return;
  try {
    if (value === null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    }
  } catch {
    // The in-memory preference still works when storage is unavailable.
  }
  window.dispatchEvent(new Event(PLAYBACK_EVENT));
}

export function useReducedMotionPreference() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );
}

export function useAnimationPlayback() {
  const reducedMotion = useReducedMotionPreference();
  const override = useSyncExternalStore(
    subscribeOverride,
    getOverrideSnapshot,
    () => null,
  );
  const paused = override ?? reducedMotion;

  return {
    paused,
    followsSystemPreference: override === null,
    toggle: () => publishOverride(!paused),
    useSystemPreference: () => publishOverride(null),
  };
}
