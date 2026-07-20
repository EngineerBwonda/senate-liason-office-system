// components/layout/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../styles/BottomNav.module.css";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: "bi-speedometer2", label: "Home", href: "/" },
    { icon: "bi-envelope-paper", label: "Corresp", href: "/correspondence" },
    { icon: "bi-calendar-event", label: "Calendar", href: "/calendar" },
    { icon: "bi-chat-dots", label: "Chats", href: "/chats" },
    { icon: "bi-person-circle", label: "Profile", href: "/profile" },
  ];

  return (
    <div className={styles.bottomNav}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${styles.navItem} ${pathname === item.href ? styles.active : ""}`}
        >
          <i className={`${item.icon} fs-5`}></i>
          <small className={styles.navLabel}>{item.label}</small>
        </Link>
      ))}
    </div>
  );
}
