import { useCallback, useRef, useState } from "react";

// Undo/redo for a value. Changes within `coalesceMs` of each other (dragging a
// slider) merge into one undo step.
export function useHistory<T>(initial: () => T, coalesceMs = 500) {
  const [state, setState] = useState(() => ({ past: [] as T[], present: initial(), future: [] as T[] }));
  const last = useRef(0);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setState((h) => {
      const value = typeof next === "function" ? (next as (p: T) => T)(h.present) : next;
      if (value === h.present) return h;
      const now = Date.now();
      const merge = now - last.current < coalesceMs && h.past.length > 0;
      last.current = now;
      return {
        past: merge ? h.past : [...h.past, h.present].slice(-200),
        present: value,
        future: [],
      };
    });
  }, [coalesceMs]);

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

  return { value: state.present, set, undo, redo, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}
