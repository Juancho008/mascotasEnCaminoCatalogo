import { useCallback, useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  const onChange = useCallback(() => {
    setMatches(window.matchMedia(query).matches);
  }, [query]);

  useEffect(() => {
    const mq = window.matchMedia(query);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query, onChange]);

  return matches;
}
