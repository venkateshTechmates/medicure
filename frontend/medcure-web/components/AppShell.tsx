import type { ReactNode } from "react";
import Nav from "./Nav";
import AuthGate from "./AuthGate";
import AIAssistant from "./AIAssistant";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="page">
      <div className="frame">
        <AuthGate>
          <Nav />
          {children}
          <AIAssistant />
        </AuthGate>
      </div>
    </div>
  );
}
