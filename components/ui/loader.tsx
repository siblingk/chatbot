import { cn } from "@/lib/utils";

export function Loader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" />
    </div>
  );
}
