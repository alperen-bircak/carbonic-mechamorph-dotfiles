import { useEffect, useRef, useState } from "react";

export type ViewMode = "fit" | "actual" | "tiled";

export function Preview({ url, width, height, view, transparent, stale }: {
  url: string;
  width: number;
  height: number;
  view: ViewMode;
  transparent: boolean;
  stale: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setArea({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = 48;
  const fit = Math.min(1, (area.w - pad) / width, (area.h - pad) / height);
  const cls = `preview ${transparent ? "checker" : ""} ${stale ? "stale" : ""}`;

  const dpr = window.devicePixelRatio || 1;
  // Tiled: exactly 3 × 3 copies, scaled to fit
  const t = Math.min((area.w - pad) / (3 * width), (area.h - pad) / (3 * height));

  return (
    <div ref={box} className={`stage-area ${view === "actual" ? "scroll" : ""}`}>
      {url && view === "tiled" && (
        <div className={`${cls} tiled`} style={{
          width: width * t * 3,
          height: height * t * 3,
          backgroundImage: `url("${url}")`,
          backgroundSize: `${width * t}px ${height * t}px`,
        }} />
      )}
      {url && view !== "tiled" && (
        <img className={cls} src={url} alt="Generated background" draggable={false}
          width={view === "actual" ? width / dpr : width * fit}
          height={view === "actual" ? height / dpr : height * fit} />
      )}
    </div>
  );
}
