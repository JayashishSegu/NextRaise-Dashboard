"use client";

import { useEffect } from "react";

/** The slice of the Capacitor bridge this app uses. The global only exists inside the Android shell. */
type Plugin = Record<string, ((...args: unknown[]) => unknown) | undefined>;
type CapacitorGlobal = { isNativePlatform?: () => boolean; Plugins?: Record<string, Plugin | undefined> };

/**
 * Wires the page to the Android shell (no-op in a normal browser).
 * The shell keeps its native splash up until the page says it has painted, so
 * without this call the app would sit on the splash forever.
 */
export function NativeBridge() {
  useEffect(() => {
    const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
    if (!cap?.isNativePlatform?.()) return;
    const plugins = cap.Plugins ?? {};
    document.documentElement.classList.add("is-native");

    const hideSplash = window.setTimeout(() => {
      try { plugins.SplashScreen?.hide?.({ fadeOutDuration: 250 }); } catch { /* the shell also auto-hides */ }
    }, 120);

    try {
      plugins.StatusBar?.setStyle?.({ style: "DARK" }); // DARK = light icons for a dark background
      plugins.StatusBar?.setBackgroundColor?.({ color: "#000000" });
      plugins.StatusBar?.setOverlaysWebView?.({ overlay: false });
    } catch { /* cosmetic only */ }

    // Hardware back: step back through screens, and leave the app from the first one.
    let remove: (() => void) | undefined;
    try {
      const sub = plugins.App?.addListener?.("backButton", () => {
        if (window.location.pathname.replace(/\/$/, "") !== "") window.history.back();
        else plugins.App?.exitApp?.();
      }) as Promise<{ remove?: () => void }> | undefined;
      sub?.then((h) => { remove = () => h?.remove?.(); }).catch(() => {});
    } catch { /* back button keeps its default */ }

    return () => {
      window.clearTimeout(hideSplash);
      remove?.();
    };
  }, []);

  return null;
}
