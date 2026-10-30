// Fake apps drawn with the scheme's CSS variables. They follow THEME_MANIFEST.md
// (square corners, few borders) and how each kind of app maps base24 slots.
// data-s names the colours an element uses, first the one a click should find.
import type { CSSProperties, ReactNode } from "react";
import type { Slot } from "../../lib/scheme";

const v = (s: Slot) => `var(--${s})`;

// Coloured text
const C = ({ s, bg, children }: { s: Slot; bg?: Slot; children: ReactNode }) => (
  <span data-s={bg ? `${s} ${bg}` : s} style={{ color: v(s), background: bg && v(bg) }}>{children}</span>
);

// A box with a background
const B = ({ s, fg, className, style, children }: {
  s: Slot; fg?: Slot; className?: string; style?: CSSProperties; children?: ReactNode;
}) => (
  <div data-s={fg ? `${s} ${fg}` : s} className={className} style={{ background: v(s), color: fg && v(fg), ...style }}>{children}</div>
);

const ANSI: { name: string; normal: Slot; bright: Slot }[] = [
  { name: "black", normal: "base00", bright: "base03" },
  { name: "red", normal: "base08", bright: "base12" },
  { name: "green", normal: "base0B", bright: "base14" },
  { name: "yellow", normal: "base0A", bright: "base13" },
  { name: "blue", normal: "base0D", bright: "base16" },
  { name: "magenta", normal: "base0E", bright: "base17" },
  { name: "cyan", normal: "base0C", bright: "base15" },
  { name: "white", normal: "base05", bright: "base07" },
];

const Prompt = ({ cmd }: { cmd: string }) => (
  <div><C s="base0D">~/dotfiles</C> <C s="base0B">main</C><C s="base0A">*</C> <C s="base0E">❯</C> <C s="base05">{cmd}</C></div>
);

export function TerminalPreview() {
  return (
    <B s="base00" fg="base05" className="mock term">
      <Prompt cmd="ls -l --color" />
      <div><C s="base05">drwxr-xr-x  4.0K </C><C s="base0D">helpers</C></div>
      <div><C s="base05">lrwxrwxrwx    31 </C><C s="base0C">kitty</C> <C s="base05">{"->"}</C> <C s="base0D">../dotfiles/kitty</C></div>
      <div><C s="base05">-rwxr-xr-x  1.2K </C><C s="base0B">unsplit</C></div>
      <div><C s="base05">-rw-r--r--  1.7K justfile</C></div>
      <div><C s="base05">-rw-r--r--   14M </C><C s="base0E">hex.png</C></div>
      <Prompt cmd="git diff --stat" />
      <div><C s="base0C">@@ -12,3 +12,4 @@</C> <C s="base05">export PATH</C></div>
      <div><C s="base08">- bindsym $mod+Return exec ghostty</C></div>
      <div><C s="base0B">+ bindsym $mod+Return exec kitty</C></div>
      <Prompt cmd="cargo build" />
      <div><C s="base13">warning</C><C s="base05">: unused variable: </C><C s="base0C">`theme`</C></div>
      <div><C s="base12">error[E0425]</C><C s="base05">: cannot find value `palette`</C></div>
      <div><C s="base03">  --{">"} comments and dim hints look like this</C></div>
      <div className="sel"><C s="base02" bg="base05"> selected text </C> <C s="base05">next to normal text</C></div>
      <div className="last"><C s="base0D">~/dotfiles</C> <C s="base0E">❯</C> <B s="base05" className="cursor" /></div>
      <div className="ansi">
        {ANSI.map((a) => (
          <div key={a.name} title={a.name}>
            <B s={a.normal} />
            <B s={a.bright} />
          </div>
        ))}
      </div>
    </B>
  );
}

const Num = ({ n, on }: { n: number; on?: boolean }) => (
  <B s={on ? "base01" : "base00"} fg={on ? "base04" : "base03"} className="gutter">{n}</B>
);

const CODE: ReactNode[] = [
  <C s="base03">{"// Picks the theme for a window"}</C>,
  <><C s="base0E">import</C> <C s="base05">{"{ palette }"}</C> <C s="base0E">from</C> <C s="base0B">"./theme"</C></>,
  "",
  <><C s="base0E">export function</C> <C s="base0D">shade</C><C s="base05">(</C><C s="base08">name</C><C s="base05">: </C><C s="base0A">string</C><C s="base05">, </C><C s="base08">depth</C> <C s="base05">= </C><C s="base09">3</C><C s="base05">) {"{"}</C></>,
  <><C s="base05">  </C><C s="base0E">const</C> <C s="base08">hex</C> <C s="base05">= </C><C s="base08">palette</C><C s="base05">[</C><C s="base08">name</C><C s="base05">];</C></>,
  <><C s="base05">  </C><C s="base0E">if</C> <C s="base05">(!</C><C s="base0C">/^#[0-9a-f]+$/</C><C s="base05">.</C><C s="base0D">test</C><C s="base05">(</C><C s="base08">hex</C><C s="base05">)) {"{"}</C></>,
  <><C s="base05">    </C><C s="base0E">throw new</C> <C s="base0A">Error</C><C s="base05">(</C><C s="base0B">`bad colour: ${"{"}</C><C s="base08">name</C><C s="base0B">{"}"}\n`</C><C s="base05">);</C></>,
  <C s="base05">{"  }"}</C>,
  <><C s="base05">  </C><C s="base0E">return</C> <C s="base0D">mix</C><C s="base05">(</C><C s="base08">hex</C><C s="base05">, </C><C s="base09">true</C><C s="base05">, </C><C s="base08">depth</C> <C s="base05">* </C><C s="base09">0.25</C><C s="base05">);</C></>,
  <C s="base05">{"}"}</C>,
];

export function EditorPreview() {
  return (
    <B s="base00" fg="base05" className="mock editor">
      <div className="ed-tabs">
        <B s="base00" fg="base05">theme.ts</B>
        <B s="base01" fg="base04">colors.lua</B>
      </div>
      <div className="ed-code">
        {CODE.map((line, i) => (
          <div key={i} className="ed-line">
            <Num n={i + 1} on={i === 4} />
            {i === 4
              ? <B s="base01" className="ed-text">{line}</B>
              : i === 6
                ? <div className="ed-text">{line}<C s="base0F"> ■ Unused argument</C></div>
                : <div className="ed-text">{line}</div>}
          </div>
        ))}
        <div className="ed-line">
          <Num n={11} />
          <div className="ed-text"><C s="base03">// </C><C s="base00" bg="base0A">palette</C><C s="base03"> search match, and </C><C s="base05" bg="base02">a selection</C></div>
        </div>
      </div>
      <B s="base01" fg="base04" className="ed-status">
        <C s="base00" bg="base0D"> NORMAL </C>
        <span>theme.ts</span>
        <span className="sp" />
        <C s="base0B">+2</C> <C s="base08">-1</C> <C s="base0F">E1</C>
        <span>5:12</span>
      </B>
      <div className="ed-cmd"><C s="base05">:w</C></div>
    </B>
  );
}

const Meter = ({ label, pct, value }: { label: string; pct: number; value: string }) => {
  const cells = 22;
  const filled = Math.round((pct / 100) * cells);
  return (
    <div className="meter">
      <C s="base04">{label.padEnd(4)}</C>
      {Array.from({ length: cells }, (_, i) => {
        const on = i < filled;
        const s: Slot = !on ? "base02" : i > cells * 0.8 ? "base08" : i > cells * 0.55 ? "base0A" : "base0B";
        return <C key={i} s={s}>{on ? "█" : "░"}</C>;
      })}
      <C s="base05"> {value}</C>
    </div>
  );
};

const Panel = ({ title, focus, children, className = "" }: { title: string; focus?: boolean; children: ReactNode; className?: string }) => (
  <div className={`tui-panel ${className}`} data-s={focus ? "base03" : "base02"} style={{ borderColor: v(focus ? "base03" : "base02") }}>
    <span className="tui-title" style={{ background: v("base00") }}><C s={focus ? "base0D" : "base04"}>{title}</C></span>
    {children}
  </div>
);

const PROCS: [string, string, string, string][] = [
  ["1270", "sway", "2.4", "142M"],
  ["5531", "firefox", "12.1", "1.9G"],
  ["6021", "kitty", "0.8", "88M"],
  ["6120", "nvim", "1.2", "204M"],
  ["7077", "waybar", "0.3", "61M"],
];

export function TuiPreview() {
  return (
    <B s="base00" fg="base05" className="mock tui">
      <div className="tui-row">
        <Panel title="cpu" className="wide">
          <Meter label="0" pct={34} value="34%" />
          <Meter label="1" pct={62} value="62%" />
          <Meter label="2" pct={91} value="91%" />
          <Meter label="mem" pct={47} value="7.4G" />
        </Panel>
      </div>
      <div className="tui-row">
        <Panel title="processes" focus className="wide">
          <div className="tui-line"><C s="base04">PID   NAME          CPU%  MEM</C></div>
          {PROCS.map(([pid, name, cpu, mem], i) => (
            <div key={pid} className="tui-line">
              {i === 1
                ? <C s="base05" bg="base02">{`${pid.padEnd(6)}${name.padEnd(14)}${cpu.padEnd(6)}${mem}`.padEnd(30)}</C>
                : <><C s="base03">{pid.padEnd(6)}</C><C s="base05">{name.padEnd(14)}</C><C s={i === 3 ? "base0A" : "base0B"}>{cpu.padEnd(6)}</C><C s="base0C">{mem}</C></>}
            </div>
          ))}
        </Panel>
      </div>
      <div className="tui-row two">
        <Panel title="devices">
          <div className="tui-line"><C s="base0B">●</C> <C s="base05">Headphones</C></div>
          <div className="tui-line"><C s="base03">○ Keyboard</C></div>
          <div className="tui-line"><C s="base0F">✗ Speaker (failed)</C></div>
        </Panel>
        <Panel title="git">
          <div className="tui-line"><C s="base0B">A</C> <C s="base05">theme-editor/</C></div>
          <div className="tui-line"><C s="base0A">M</C> <C s="base05">justfile</C></div>
          <div className="tui-line"><C s="base08">D</C> <C s="base03">ghostty/config</C></div>
        </Panel>
      </div>
      <div className="tui-keys">
        {["q quit", "/ search", "↵ open", "? help"].map((k) => {
          const [key, ...rest] = k.split(" ");
          return <span key={k}><C s="base00" bg="base0D"> {key} </C> <C s="base04">{rest.join(" ")}</C></span>;
        })}
      </div>
    </B>
  );
}

const Switch = ({ on }: { on?: boolean }) => (
  <B s={on ? "base0D" : "base02"} className={`g-switch ${on ? "on" : ""}`}><B s={on ? "base00" : "base04"} /></B>
);

const GtkRow = ({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) => (
  <B s="base01" className="g-row">
    <div>
      <C s="base05">{title}</C>
      {sub && <small><C s="base03">{sub}</C></small>}
    </div>
    {children}
  </B>
);

export function GtkPreview() {
  return (
    <B s="base00" fg="base05" className="mock gtk">
      <B s="base10" fg="base05" className="g-head">
        <B s="base01" fg="base05" className="g-btn">‹</B>
        <strong>Settings</strong>
        <span className="sp" />
        <B s="base01" fg="base05" className="g-btn">⋮</B>
        <B s="base01" fg="base05" className="g-btn">×</B>
      </B>
      <div className="g-main">
        <B s="base10" fg="base04" className="g-side">
          <B s="base02" fg="base05">Appearance</B>
          <div>Network</div>
          <div>Bluetooth</div>
          <div>Sound</div>
          <div>Displays</div>
        </B>
        <div className="g-content">
          <h3><C s="base05">Appearance</C></h3>
          <GtkRow title="Dark style" sub="Applies to all apps"><Switch on /></GtkRow>
          <GtkRow title="Animations"><Switch /></GtkRow>
          <GtkRow title="Accent"><B s="base02" fg="base05" className="g-combo">Indigo ▾</B></GtkRow>
          <div className="g-line">
            <B s="base02" fg="base05" className="g-entry">Search<B s="base05" className="cursor thin" /></B>
            <B s="base02" fg="base03" className="g-entry">Placeholder</B>
          </div>
          <div className="g-line g-checks">
            <span><B s="base0D" fg="base00" className="g-check">✓</B> <C s="base05">Checked</C></span>
            <span><B s="base02" className="g-check" /> <C s="base05">Off</C></span>
            <span><C s="base03">Disabled</C></span>
          </div>
          <div className="g-line">
            <B s="base02" className="g-bar"><B s="base0D" style={{ width: "62%" }} /></B>
          </div>
          <div className="g-line">
            <B s="base0D" fg="base00" className="g-action">Apply</B>
            <B s="base02" fg="base05" className="g-action">Cancel</B>
            <B s="base0F" fg="base00" className="g-action">Delete</B>
          </div>
          <B s="base02" fg="base05" className="g-toast"><C s="base0F">●</C> Couldn't reach the portal</B>
        </div>
      </div>
    </B>
  );
}

const QT_ROWS: [string, string, string][] = [
  ["kitty.conf", "4.2 KiB", "Config"],
  ["ayu-carbon.yaml", "1.5 KiB", "Scheme"],
  ["waybar.css", "9.8 KiB", "Stylesheet"],
  ["justfile", "1.7 KiB", "Script"],
  ["hex.png", "14 MiB", "Image"],
];

export function QtPreview() {
  return (
    <B s="base00" fg="base05" className="mock qt">
      <B s="base01" fg="base05" className="q-menu">
        {["File", "Edit", "View", "Tools", "Help"].map((m, i) => (
          i === 2 ? <B key={m} s="base0D" fg="base00">{m}</B> : <div key={m}>{m}</div>
        ))}
      </B>
      <B s="base01" fg="base05" className="q-tools">
        <B s="base02" fg="base05">New</B>
        <B s="base02" fg="base05">Open</B>
        <B s="base02" fg="base03">Save</B>
        <span className="sp" />
        <B s="base00" fg="base05" className="q-field">filter…</B>
      </B>
      <div className="q-tabs">
        <B s="base00" fg="base05">Files</B>
        <B s="base01" fg="base04">Details</B>
        <B s="base01" fg="base04">History</B>
      </div>
      <div className="q-table">
        <B s="base02" fg="base05" className="q-row head"><span>Name</span><span>Size</span><span>Type</span></B>
        {QT_ROWS.map((r, i) => (
          i === 1
            ? <B key={r[0]} s="base0D" fg="base00" className="q-row">{r.map((c) => <span key={c}>{c}</span>)}</B>
            : <B key={r[0]} s={i % 2 ? "base01" : "base00"} fg="base05" className="q-row">{r.map((c) => <span key={c}>{c}</span>)}</B>
        ))}
      </div>
      <div className="q-groups">
        <fieldset data-s="base02" style={{ borderColor: v("base02") }}>
          <legend><C s="base04">Options</C></legend>
          <div className="q-opt"><B s="base0D" fg="base00" className="g-check">✓</B> <C s="base05">Show hidden</C></div>
          <div className="q-opt"><B s="base02" className="g-check" /> <C s="base05">Follow links</C></div>
          <div className="q-opt"><B s="base02" fg="base05" className="q-combo">Name ▾</B></div>
        </fieldset>
        <fieldset data-s="base02" style={{ borderColor: v("base02") }}>
          <legend><C s="base04">Progress</C></legend>
          <B s="base02" className="g-bar"><B s="base0D" style={{ width: "40%" }} /></B>
          <div className="q-slider"><B s="base02" /><B s="base05" className="q-knob" /></div>
          <div className="q-buttons">
            <B s="base02" fg="base05">Cancel</B>
            <B s="base0D" fg="base00">OK</B>
          </div>
        </fieldset>
      </div>
      <B s="base01" fg="base04" className="q-status"><span>5 items, 1 selected</span><C s="base0F">1 error</C></B>
    </B>
  );
}

export function DesktopPreview() {
  return (
    <B s="base11" className="mock desk">
      <B s="base10" fg="base04" className="d-bar">
        <C s="base0D">1</C><C s="base04">2</C><C s="base04">3</C>
        <span className="sp" />
        <C s="base05">11:42</C>
        <span className="sp" />
        <C s="base04">wifi 82%</C>
        <C s="base0F">bat 9%</C>
      </B>
      <div className="d-tile">
        <div className="d-win focus" data-s="base03" style={{ borderColor: v("base03"), borderRightColor: v("base0D") }}>
          <B s="base00" fg="base05" className="d-term">
            <div><C s="base0D">~</C> <C s="base0E">❯</C> <C s="base05">swaymsg reload</C></div>
            <div><C s="base0B">success</C></div>
            <div><C s="base0D">~</C> <C s="base0E">❯</C> <B s="base05" className="cursor" /></div>
          </B>
        </div>
        <div className="d-stack">
          <div className="d-win" data-s="base02" style={{ borderColor: v("base02") }}>
            <B s="base00" fg="base04" className="d-term"><div>unfocused window</div><div><C s="base03">same background, gray border</C></div></B>
          </div>
          <div className="d-win" data-s="base02" style={{ borderColor: v("base02") }}>
            <B s="base00" fg="base04" className="d-term"><div>unfocused window</div></B>
          </div>
        </div>
      </div>
      <B s="base01" fg="base05" className="d-rofi">
        <B s="base00" fg="base05" className="d-input">fire<B s="base05" className="cursor thin" /></B>
        <B s="base02" fg="base05">Firefox</B>
        <div><C s="base04">Files</C></div>
        <div><C s="base04">Settings</C></div>
      </B>
      <B s="base01" fg="base05" className="d-note">
        <strong><C s="base05">Update finished</C></strong>
        <small><C s="base04">12 packages upgraded</C></small>
      </B>
      <B s="base01" fg="base05" className="d-note crit">
        <strong><C s="base0F">Battery low</C></strong>
        <small><C s="base04">9% remaining</C></small>
      </B>
    </B>
  );
}
