"use client";
import Logo from "./Logo";
import NavTabs from "./NavTabs";
import TenantSwitcher from "./TenantSwitcher";
import ProfileMenu from "./ProfileMenu";
import NotificationBell from "./NotificationBell";
import CommandPalette from "./CommandPalette";
import ThemeToggle from "./ThemeToggle";
import UniversalSearch from "./UniversalSearch";

export default function Nav() {
  return (
    <>
      <div className="nav">
        <Logo />
        <NavTabs />
        <div className="nav-right">
          <UniversalSearch />
          <ThemeToggle />
          <NotificationBell />
          <TenantSwitcher />
          <ProfileMenu />
        </div>
      </div>
      <CommandPalette />
    </>
  );
}
