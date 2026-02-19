
import { cn } from "@/shared/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="leading-tight">
        <div className="text-base font-extrabold tracking-tight">Academy</div>
        <div className="text-xs text-muted-foreground">Aprende. Crece. Mide.</div>
      </div>
    </div>
  );
}

export default Logo;