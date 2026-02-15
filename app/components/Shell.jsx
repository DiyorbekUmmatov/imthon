"use client";

import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", key: "dashboard", label: "Dashboard" },
  { href: "/income", key: "income", label: "Income" },
  { href: "/expenses", key: "expenses", label: "Expenses" },
  { href: "/reports", key: "reports", label: "Reports" },
  { href: "/business", key: "business", label: "Businesses" },
  { href: "/settings", key: "settings", label: "Settings" },
];

export default function Shell({ children }) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">Finex</div>
        <button className="sidebar__collapse" aria-label="Collapse sidebar">☰</button>
        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={clsx("nav__item", pathname === item.href && "nav__item--active")}
            >
              {item.label}
            </Link>
          ))}
          <div className="nav__section">Admin</div>
          <Link className="nav__item" href="/admin/users">Users & Roles</Link>
          <Link className="nav__item" href="/admin/audit">Audit Logs</Link>
        </nav>
        <div className="sidebar__cta">
          <Link className="btn btn--ghost" href="/income">+ New</Link>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar__left">
            <div className="business-pill">
              <span className="pill-dot"></span>
              Acme Studio
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5H7z"></path></svg>
            </div>
            <div className="breadcrumb">{labelFor(pathname)}</div>
          </div>
          <div className="topbar__right">
            <div className="search"><input type="search" placeholder="Qidiruv" /></div>
            <button className="icon-btn" aria-label="Language">UZ</button>
            <button className="icon-btn" aria-label="Notifications">🔔</button>
            <button className="icon-btn profile"><span className="avatar">A</span><span>Admin</span></button>
          </div>
        </header>
        {children}
      </main>

      <nav className="mobile-tabbar">
        {navItems.slice(0, 5).map((item) => (
          <Link key={item.key} href={item.href} className={clsx("tab", pathname === item.href && "tab--active")}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function labelFor(path) {
  if (path === "/") return "Dashboard";
  const parts = path.split("/").filter(Boolean);
  return parts[0]?.[0]?.toUpperCase() + parts[0]?.slice(1) || "Dashboard";
}
