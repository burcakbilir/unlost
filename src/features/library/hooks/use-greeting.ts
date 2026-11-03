import { useSyncExternalStore } from "react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// The greeting depends on the visitor's clock, which the server doesn't know
// (it runs in UTC). The server snapshot is null, so the server renders nothing
// and the browser fills it in after hydration instead of mismatching.
const subscribeToNothing = () => () => {};

export function useGreeting(): string | null {
  return useSyncExternalStore(subscribeToNothing, getGreeting, () => null);
}
