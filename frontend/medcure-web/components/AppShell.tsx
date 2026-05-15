import type { ReactNode } from "react";
import Nav from "./Nav";
import AuthGate from "./AuthGate";
import AIAssistant from "./AIAssistant";
import ErrorBoundary from "./ErrorBoundary";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="page">
      <div className="frame">
        <AuthGate>
          <Nav />
          {/* PRD §14.P — never show a blank screen. ErrorBoundary is a client component. */}
          <ErrorBoundary>{children}</ErrorBoundary>
          <AIAssistant />
        </AuthGate>
      </div>
    </div>
  );
}
