"use client";

import { useSyncExternalStore } from "react";

const URL_CHANGE_EVENT = "feynman:url-change";

function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener(URL_CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(URL_CHANGE_EVENT, listener);
  };
}

function getSnapshot() {
  return window.location.search;
}

function getServerSnapshot() {
  return "";
}

export function useSearchParam(name: string) {
  const search = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return new URLSearchParams(search).get(name);
}

export function useSearchString() {
  const search = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return search.startsWith("?") ? search.slice(1) : search;
}

export function replaceSearchParams(
  update: (params: URLSearchParams) => void,
) {
  const params = new URLSearchParams(window.location.search);
  update(params);

  const search = params.toString();
  const href = `${window.location.pathname}${search ? `?${search}` : ""}${
    window.location.hash
  }`;
  const current = `${window.location.pathname}${window.location.search}${
    window.location.hash
  }`;
  if (href === current) return;

  window.history.replaceState(window.history.state, "", href);
  window.dispatchEvent(new Event(URL_CHANGE_EVENT));
}
