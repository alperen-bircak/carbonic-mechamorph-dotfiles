import { useRef, type PointerEvent } from "react";

const norm = (a: number) => +(((a % 360) + 360) % 360).toFixed(2);

// Drag to rotate. Snaps to `snap`° steps (hold Shift for free rotation); with
// snap off it still gently catches the hexagon's natural angles.
export function AngleDial({ value, onChange, snap, size = 104, hexagon = true, disabled }: {
  value: number;
  onChange: (v: number) => void;
  snap: number;
  size?: number;
  hexagon?: boolean;
  disabled?: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const c = size / 2, R = c - 6;

  const fromEvent = (e: PointerEvent) => {
    const box = ref.current!.getBoundingClientRect();
    const dx = e.clientX - (box.left + box.width / 2);
    const dy = e.clientY - (box.top + box.height / 2);
    let a = norm((Math.atan2(dy, dx) * 180) / Math.PI + 90); // 0° at the top, clockwise
    if (!e.shiftKey) {
      if (snap > 0) a = norm(Math.round(a / snap) * snap);
      else {
        const near = Math.round(a / 15) * 15;
        if (Math.abs(near - a) < 2) a = norm(near);
        else a = Math.round(a);
      }
    }
    if (a !== value) onChange(a);
  };

  const step = snap > 0 && snap >= 5 ? snap : 15;
  const ticks = [];
  for (let a = 0; a < 360; a += step) {
    const major = a % 90 === 0;
    const rad = ((a - 90) * Math.PI) / 180;
    const r1 = R - (major ? 9 : 5);
    ticks.push(
      <line key={a} x1={c + Math.cos(rad) * r1} y1={c + Math.sin(rad) * r1} x2={c + Math.cos(rad) * R} y2={c + Math.sin(rad) * R}
        className={major ? "tick major" : "tick"} />,
    );
  }

  const rad = ((value - 90) * Math.PI) / 180;
  const hr = R * 0.42;
  const hex = Array.from({ length: 6 }, (_, k) => {
    const a = ((value + 30 + 60 * k) * Math.PI) / 180; // matches the grid's pointy-top at 0°
    return `${c + Math.cos(a) * hr},${c + Math.sin(a) * hr}`;
  }).join(" ");

  return (
    <svg
      ref={ref}
      className={`dial ${disabled ? "disabled" : ""}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="slider"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={360}
      tabIndex={0}
      onPointerDown={(e) => {
        if (disabled) return;
        (e.target as Element).setPointerCapture(e.pointerId);
        fromEvent(e);
      }}
      onPointerMove={(e) => !disabled && e.buttons === 1 && fromEvent(e)}
      onKeyDown={(e) => {
        if (disabled) return;
        const d = snap > 0 ? snap : 1;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); onChange(norm(value + d)); }
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); onChange(norm(value - d)); }
      }}
    >
      <circle cx={c} cy={c} r={R} className="dial-face" />
      {ticks}
      {hexagon && <polygon points={hex} className="dial-hex" />}
      <line x1={c} y1={c} x2={c + Math.cos(rad) * (R - 3)} y2={c + Math.sin(rad) * (R - 3)} className="dial-needle" />
      <circle cx={c + Math.cos(rad) * (R - 3)} cy={c + Math.sin(rad) * (R - 3)} r={5} className="dial-knob" />
      <circle cx={c} cy={c} r={3} className="dial-hub" />
    </svg>
  );
}
