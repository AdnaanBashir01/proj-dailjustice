// Monochrome initials avatar — minimalist black & white (gold only for the online dot).

const INK = "#16130f";
const IVORY = "#ffffff";
const GOLD = "#c9a45c";

export function paletteFor(_id: string): { bg: string; text: string } {
  return { bg: INK, text: IVORY };
}

export function initialsOf(name: string): string {
  const clean = name.replace(/^Adv\.\s*/i, "");
  const parts = clean.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

interface Props {
  id: string;
  name: string;
  size?: number;
  online?: boolean;
  className?: string;
}

export default function InitialsAvatar({ id, name, size = 56, online, className = "" }: Props) {
  const p = paletteFor(id);
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: p.bg,
        color: p.text,
        fontSize: Math.max(11, size * 0.36),
      }}
    >
      <span className="font-serif font-semibold">{initialsOf(name)}</span>
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-white"
          style={{
            width: Math.max(10, size * 0.26),
            height: Math.max(10, size * 0.26),
            background: GOLD,
          }}
        />
      )}
    </span>
  );
}
