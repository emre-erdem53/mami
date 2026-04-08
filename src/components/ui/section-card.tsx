import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { card, cardInner } from "./styles";

export function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  className,
  id,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(card, cardInner, "transition-shadow duration-300 hover:shadow-black/35", className)}
    >
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20">
              <Icon className="size-4" strokeWidth={1.75} />
            </span>
          ) : null}
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}
