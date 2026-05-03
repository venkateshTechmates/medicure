import Link from "next/link";
import Logo from "./Logo";
import NavTabs from "./NavTabs";
import TenantSwitcher from "./TenantSwitcher";
import ProfileMenu from "./ProfileMenu";

export default function Nav() {
  return (
    <div className="nav">
      <Logo />
      <NavTabs />
      <div className="nav-right">
        <Link className="icon-btn" href="/patients" aria-label="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        </Link>
        <Link className="icon-btn" href="/messages" aria-label="notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>
          <span className="dot" />
        </Link>
        <TenantSwitcher />
        <ProfileMenu />
      </div>
    </div>
  );
}
