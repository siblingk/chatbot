import { ReactNode } from "react";

interface AgentsLayoutProps {
  children: ReactNode;
}

export default function AgentsLayout({ children }: AgentsLayoutProps) {
  return <main className="flex-1 overflow-y-auto">{children}</main>;
}
