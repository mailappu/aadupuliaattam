import { useEffect, useState } from "react";

/**
 * Debug mode toggle: enabled via `?debug=true` URL param OR Shift+D shortcut.
 * Exposes a stateful boolean so any component can show debug overlays.
 */
export function useDebugMode(): [boolean, (v: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("debug") === "true";
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Shift+D toggles. Ignore when typing in an input.
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        setEnabled((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return [enabled, setEnabled];
}
