import { type ReactNode } from "react";

type BadgeVariant = "default" | "gold" | "teal" | "outline";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-bg-primary border border-overlay/20 text-text-primary",
  gold: "bg-bg-primary border border-accent-gold text-accent-gold",
  teal: "bg-bg-primary border border-accent-teal text-accent-teal",
  outline: "bg-bg-primary border border-accent-gold text-accent-gold",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
