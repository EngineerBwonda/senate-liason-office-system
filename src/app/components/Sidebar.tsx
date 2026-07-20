// components/layout/Sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../styles/Sidebar.module.css";

const navItems = [
  { icon: "bi-speedometer2", label: "Dashboard", href: "/" },
  { icon: "bi-journal-text", label: "Minutes", href: "/minutes" },
  {
    icon: "bi-envelope-paper",
    label: "Correspondence",
    href: "/correspondence",
  },
  { icon: "bi-bar-chart-line", label: "Reports", href: "/reports" },
  { icon: "bi-people", label: "Internal Meetings", href: "/internal-meetings" },
  {
    icon: "bi-people-fill",
    label: "External Meetings",
    href: "/external-meetings",
  },
  { icon: "bi-file-earmark-text", label: "Memos", href: "/memos" },
  { icon: "bi-images", label: "Gallery", href: "/gallery" },
  { icon: "bi-newspaper", label: "Office Feed", href: "/feed" },
  { icon: "bi-chat-dots", label: "Chats", href: "/chats" },
  { icon: "bi-person-badge", label: "Delegates", href: "/delegates" },
  { icon: "bi-calendar-event", label: "Calendar", href: "/calendar" },
  { icon: "bi-bell", label: "Notifications", href: "/notifications" },
  { icon: "bi-person-circle", label: "User Profile", href: "/profile" },
  { icon: "bi-gear", label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <nav
      className={`${styles.sidebar} glass d-none d-md-flex flex-column p-3 ${collapsed ? styles.collapsed : ""}`}
    >
      <div className={styles.logoContainer}>
        <i className="bi bi-building fs-2 text-primary"></i>
        <span className={styles.logoText}>Senate Liaison Office</span>
        <button
          className={styles.toggleBtn}
          onClick={() => setCollapsed(!collapsed)}
        >
          <i
            className={`bi ${collapsed ? "bi-chevron-right" : "bi-chevron-left"}`}
          ></i>
        </button>
      </div>
      <ul className={styles.navList}>
        {navItems.map((item) => (
          <li key={item.href} className={styles.navItem}>
            <Link
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href ? styles.active : ""}`}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
