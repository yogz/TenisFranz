import Image from "next/image";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";

interface Props {
  name: string;
  photoUrl: string | null;
  size?: number;
  className?: string;
}

export function PlayerAvatar({ name, photoUrl, size = 48, className }: Props) {
  const base = cn(
    "relative shrink-0 overflow-hidden rounded-full bg-surface2 ring-1 ring-border",
    className,
  );
  if (!photoUrl) {
    return (
      <div
        className={cn(base, "flex items-center justify-center font-display text-muted")}
        style={{ width: size, height: size, fontSize: size / 2.8 }}
      >
        {initials(name)}
      </div>
    );
  }
  return (
    <div className={base} style={{ width: size, height: size }}>
      <Image
        src={photoUrl}
        alt={name}
        fill
        sizes={`${size}px`}
        unoptimized
        className="object-cover"
      />
    </div>
  );
}
