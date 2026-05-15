import { type ReactNode } from "react";
import AuthGate from "./AuthGate";
import TopBar from "./TopBar";

export default function PortalShell({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className="page">
        <div className="frame">
          <TopBar />
          {children}
        </div>
      </div>
    </AuthGate>
  );
}
