import { cn } from "@/lib/utils";

/** Teacher photo, or coloured initials when no photo is set. */
export default function Avatar({ name, photo, size = 56, className }: { name: string; photo?: string; size?: number; className?: string }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={name} width={size} height={size} className={cn("shrink-0 rounded-2xl object-cover", className)} style={{ width: size, height: size }} />;
  }
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-700 font-semibold text-white", className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
