// Small stroke icons, 24×24, inheriting currentColor
const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

export const IconCanvas = () => <Icon d="M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5" />;
export const IconGrid = () => <Icon d="M12 3l7 4v8l-7 4-7-4V7zM12 11v8M5 7l7 4 7-4" />;
export const IconPalette = () => <Icon d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8zM7.5 11.5h0M10 7.5h0M14.5 7.5h0" />;
export const IconNoise = () => <Icon d="M3 12c2-5 4-5 6 0s4 5 6 0 4-5 6 0" />;
export const IconBorder = () => <Icon d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5zM12 6.5l4.8 2.75v5.5L12 17.5l-4.8-2.75v-5.5z" />;
export const IconExport = () => <Icon d="M12 4v11M7 10l5 5 5-5M5 20h14" />;
export const IconDice = () => <Icon d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8.5 8.5h0M15.5 8.5h0M12 12h0M8.5 15.5h0M15.5 15.5h0" />;
export const IconSpark = () => <Icon d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />;
export const IconUndo = () => <Icon d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />;
export const IconRedo = () => <Icon d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" />;
export const IconReset = () => <Icon d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />;
export const IconSave = () => <Icon d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6" />;
export const IconOpen = () => <Icon d="M3 7V5h7l2 2h9v12H3zM3 10h18" />;
export const IconSwap = () => <Icon d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" />;
export const IconScreen = () => <Icon d="M3 5h18v11H3zM8 20h8M12 16v4" />;
export const IconCopy = () => <Icon d="M8 8h11v11H8zM5 15V5h10" />;
export const IconFit = () => <Icon d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />;
export const IconActual = () => <Icon d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M8 11h6M11 8v6" />;
export const IconLink = () => <Icon d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />;
export const IconTiles = () => <Icon d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />;
