import { useCallback, useRef, useState } from "react";

// Undo/redo for a value. Changes within `coalesceMs` of each other (typing) merge
// into one undo step, as do changes with the same `tag` (one drag of a slider).
export function useHistory<T>(initial: () => T, coalesceMs = 500) {
  const [state, setState] = useState(() => ({ past: [] as T[], present: initial(), future: [] as T[] }));
  const last = useRef(0);
  const lastTag = useRef<string | undefined>(undefined);

  const set = useCallback((next: T | ((prev: T) => T), tag?: string) => {
    setState((h) => {
      const value = typeof next === "function" ? (next as (p: T) => T)(h.present) : next;
      if (value === h.present) return h;
      const now = Date.now();
      const merge = h.past.length > 0 && (tag ? tag === lastTag.current : now - last.current < coalesceMs);
      last.current = now;
      lastTag.current = tag;
      return {
        past: merge ? h.past : [...h.past, h.present].slice(-200),
        present: value,
        future: [],
      };
    });
  }, [coalesceMs]);

  // Replace the value and forget its history (opening a file)
  const reset = useCallback((value: T) => {
    last.current = 0;
    lastTag.current = undefined;
    setState({ past: [], present: value, future: [] });
  }, []);

  const undo = useCallback(() => {
    last.current = 0;
    setState((h) => (h.past.length === 0 ? h : {
      past: h.past.slice(0, -1),
      present: h.past[h.past.length - 1],
      future: [h.present, ...h.future],
    }));
  }, []);

  const redo = useCallback(() => {
    last.current = 0;
    setState((h) => (h.future.length === 0 ? h : {
      past: [...h.past, h.present],
      present: h.future[0],
      future: h.future.slice(1),
    }));
  }, []);

  return { value: state.present, set, reset, undo, redo, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}
