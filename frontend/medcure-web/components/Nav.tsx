"use client";
import Logo from "./Logo";
import NavTabs from "./NavTabs";
import TenantSwitcher from "./TenantSwitcher";
import ProfileMenu from "./ProfileMenu";
import NotificationBell from "./NotificationBell";
import CommandPalette from "./CommandPalette";

export default function Nav() {
  return (
    <>
      <div className="nav">
        <Logo />
        <NavTabs />
        <div className="nav-right">
          <SearchTrigger />
          <NotificationBell />
          <TenantSwitcher />
          <ProfileMenu />
        </div>
      </div>
      <CommandPalette />
    </>
  );
}

function SearchTrigger() {
  function dispatchOpen() {
    const ev = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
    window.dispatchEvent(ev);
  }
  return (
    <button
      className="icon-btn"
      onClick={dispatchOpen}
      aria-label="search"
      title="Search (Ctrl+K)"
      style={{
        width: 36, height: 36, borderRadius: 10,
        background: "#fafbfc", border: "1px solid var(--line)",
        display: "grid", placeItems: "center", cursor: "pointer",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
        <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
      </svg>
    </button>
  );
}
