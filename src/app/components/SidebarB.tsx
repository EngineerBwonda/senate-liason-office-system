// components/layout/Sidebar.tsx
"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../styles/SidebarB.module.css";

const navGroups = [
  {
    label: "Overview",
    items: [{ icon: "bi-speedometer2", label: "Dashboard", href: "/" }],
  },
  {
    label: "Communications",
    items: [
      { icon: "bi-journal-text", label: "Minutes", href: "/pages/minutes" },
      // {
      //   icon: "bi-envelope-paper",
      //   label: "Correspondence",
      //   href: "/correspondence",
      // },
      {
        icon: "bi-inbox",
        label: "Incoming Correspondence",
        href: "/pages/incoming-correspondence",
      },
      {
        icon: "bi-send",
        label: "Outgoing Correspondence",
        href: "/pages/outgoing-correspondence",
      },
      {
        icon: "bi-file-earmark-text",
        label: "Memos",
        href: "/pages/memo",
      },
      { icon: "bi-newspaper", label: "Office Feed", href: "/feed" },
      { icon: "bi-chat-dots", label: "Chats", href: "/chats" },
    ],
  },
  {
    label: "Meetings",
    items: [
      {
        icon: "bi-people",
        label: "Internal Meetings",
        href: "/internal-meetings",
      },
      {
        icon: "bi-people-fill",
        label: "External Meetings",
        href: "/external-meetings",
      },
      { icon: "bi-calendar-event", label: "Calendar", href: "/pages/event-b" },
      { icon: "bi-person-badge", label: "Delegates", href: "/delegates" },
    ],
  },
  {
    label: "Records",
    items: [
      //{ icon: "bi-bar-chart-line", label: "Reports", href: "/work" },
      {
        icon: "bi-calendar3",
        label: "Monthly Reports",
        href: "/pages/monthly-reports",
      },
      {
        icon: "bi-graph-up-arrow",
        label: "Quarterly Reports",
        href: "/pages/quarterly-reports",
      },
      {
        icon: "bi-file-earmark-bar-graph",
        label: "Annual Reports",
        href: "/pages/annualb",
      },
      { icon: "bi-images", label: "Gallery", href: "/pages/gallery-b" },
    ],
  },
  {
    label: "Account",
    items: [
      { icon: "bi-bell", label: "Notifications", href: "/notifications" },
      { icon: "bi-person-circle", label: "User Profile", href: "/profile" },
      { icon: "bi-gear", label: "Settings", href: "/settings" },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const pathname = usePathname();

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      const storedCollapsed =
        localStorage.getItem("sidebar-collapsed") === "true";
      const savedTheme = localStorage.getItem("theme") as
        | "light"
        | "dark"
        | null;
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;

      setCollapsed(storedCollapsed);
      setTheme(savedTheme || (prefersDark ? "dark" : "light"));
    });

    return () => window.cancelAnimationFrame(rafId);
  }, []);

  // Sync with localStorage only after hydration to avoid SSR mismatch
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [theme]);

  useEffect(() => {
    const width = collapsed ? "72px" : "260px";
    document.documentElement.style.setProperty("--sidebar-width", width);
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-bs-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const isActiveRoute = (href: string) => {
    if (!pathname) return false;
    if (pathname === href) return true;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      className={`${styles.sidebar} glass d-none d-md-flex flex-column ${collapsed ? styles.collapsed : ""}`}
    >
      <button
        className={`${styles.toggleBtn} ${styles.floatingToggle}`}
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <i
          className="bi bi-chevron-left"
          style={{
            display: "inline-block",
            transition: "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
            transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
          }}
        ></i>
      </button>

      <div className={styles.logoContainer}>
        <i className="bi bi-building fs-2"></i>
        <span className={styles.logoText}>Senate Liaison Office</span>
      </div>

      <div className={styles.navScroll}>
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className={styles.sectionLabel}>{group.label}</div>
            <ul className={styles.navList}>
              {group.items.map((item) => (
                <li key={item.href} className={styles.navItem}>
                  <Link
                    href={item.href}
                    className={`${styles.navLink} ${isActiveRoute(item.href) ? styles.active : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <i className={item.icon}></i>
                    <span>{item.label}</span>
                  </Link>
                  <span className={styles.navPopover} aria-hidden="true">
                    {item.label}
                  </span>
                </li>
              ))}
              {group.label === "Account" && (
                <li className={styles.navItem}>
                  <button
                    type="button"
                    className={`${styles.navLink} ${styles.themeButton}`}
                    title={collapsed ? "Toggle theme" : undefined}
                    onClick={toggleTheme}
                    aria-label={
                      theme === "dark"
                        ? "Switch to light mode"
                        : "Switch to dark mode"
                    }
                  >
                    <i
                      className={`bi ${theme === "dark" ? "bi-sun-fill" : "bi-moon-fill"}`}
                    ></i>
                    <span>Theme</span>
                  </button>
                  <span className={styles.navPopover} aria-hidden="true">
                    Theme
                  </span>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
