import { useMemo } from "react";
import { LOOKS, applyLook, type Look } from "../lib/looks";
import { buildSvg, svgBlob } from "../lib/render";
import { DEFAULTS } from "../lib/settings";

// Thumbnails are rendered once at 1080p and shown scaled down
let thumbs: string[] | null = null;
function thumbnails(): string[] {
  thumbs ??= LOOKS.map((l) =>
    URL.createObjectURL(svgBlob(buildSvg({ ...applyLook(DEFAULTS, l), width: 1920, height: 1080, tileable: false }))),
  );
  return thumbs;
}

export function Looks({ onPick }: { onPick: (look: Look) => void }) {
  const urls = useMemo(thumbnails, []);
  return (
    <div className="looks">
      {LOOKS.map((l, i) => (
        <button key={l.name} className="look" onClick={() => onPick(l)} title={`Apply “${l.name}” (keeps canvas size)`}>
          <img src={urls[i]} alt="" draggable={false} />
          <span>{l.name}</span>
        </button>
      ))}
    </div>
  );
}
