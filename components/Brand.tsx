import { cn } from "@/lib/utils";

/** Site logo (uploaded by the admin) or a monogram, followed by the site name. */
export default function Brand({
  name,
  logo,
  size = "md",
  className,
}: {
  name: string;
  logo?: string | null;
  size?: "md" | "lg";
  className?: string;
}) {
  const box = size === "lg" ? "size-10 rounded-xl text-base" : "size-8 rounded-lg text-sm";
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5 font-semibold tracking-tight", className)}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className={cn(box, "shrink-0 object-contain")} />
      ) : (
        <span className={cn(box, "grid shrink-0 place-items-center bg-primary font-bold text-primary-foreground")}>
          {name.trim().charAt(0).toUpperCase() || "W"}
        </span>
      )}
      <span className={cn("truncate", size === "lg" ? "text-lg" : "text-[15px]")}>{name}</span>
    </span>
  );
}
