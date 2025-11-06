import { DollarSign } from "lucide-react";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-20" }: LogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-full bg-primary/10 animate-pulse"></div>
        <div className="absolute h-20 w-20 rounded-full bg-primary/20"></div>
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <DollarSign className="h-10 w-10 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
}
