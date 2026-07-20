// components/layout/TopNavbar.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "../styles/topnavbarB.module.css";
import Image from "next/image";

export default function TopNavbar() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const tickingRef = useRef(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-bs-theme", initialTheme);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8);
        tickingRef.current = false;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-bs-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const mockSearchData = [
    "Minutes Q2",
    "Correspondence Finance",
    "Report Budget",
    "Meeting External",
    "Memo Procurement",
  ];
  const filteredResults = mockSearchData.filter((item) =>
    item.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <header
      className={`${styles.navbar} glass ${scrolled ? styles.scrolled : ""}`}
    >
      <div className={styles.container}>
        <Link className={styles.brand} href="/">
          <i className="bi bi-building text-primary me-1"></i>Senate
        </Link>

        <div className={styles.searchContainer}>
          <i
            className={`bi bi-search ${styles.searchIcon}`}
            aria-hidden="true"
          ></i>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Global search..."
            aria-label="Global search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(e.target.value.length > 0);
            }}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            onFocus={() => searchQuery.length > 0 && setShowResults(true)}
          />
          {showResults && (
            <div
              className={styles.searchResults}
              role="listbox"
              aria-label="Search results"
            >
              {filteredResults.length === 0 ? (
                <div className={styles.noResult}>No results found</div>
              ) : (
                filteredResults.map((item, i) => (
                  <div
                    key={i}
                    role="option"
                    tabIndex={0}
                    className={styles.resultItem}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        /* placeholder: handle selection */
                      }
                    }}
                  >
                    <i
                      className="bi bi-file-earmark-text"
                      aria-hidden="true"
                    ></i>
                    {item}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Link
            href="#"
            className={styles.iconLink}
            id="notifBell"
            aria-label="Notifications"
          >
            <i className="bi bi-bell fs-5" aria-hidden="true"></i>
            <span className={styles.notificationBadge}>3</span>
          </Link>

          <span className={styles.actionsDivider} aria-hidden="true" />

          <div className="dropdown">
            <button
              className={styles.userMenu}
              aria-haspopup="true"
              aria-expanded="false"
              aria-label="User menu"
              data-bs-toggle="dropdown"
            >
              <span className={styles.avatarRing}>
                <Image
                  src="https://ui-avatars.com/api/?name=Christopher+Senate&background=0D6EFD&color=fff&size=32"
                  className="rounded-circle"
                  width="32"
                  height="32"
                  alt="Christopher avatar"
                />
              </span>
              <span className={styles.userInfo}>
                <span className={styles.userName}>Christopher</span>
                <span className={styles.userRole}>Bwonda</span>
              </span>
              <i
                className={`bi bi-chevron-down ${styles.chevron}`}
                aria-hidden="true"
              ></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm">
              <li>
                <Link className="dropdown-item" href="/profile">
                  <i className="bi bi-person me-2"></i>Profile
                </Link>
              </li>
              <li>
                <Link className="dropdown-item" href="/settings">
                  <i className="bi bi-gear me-2"></i>Settings
                </Link>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <Link className="dropdown-item text-danger" href="#">
                  <i className="bi bi-box-arrow-right me-2"></i>Logout
                </Link>
              </li>
            </ul>
          </div>

          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            <i
              className={`bi ${theme === "dark" ? "bi-sun-fill" : "bi-moon-fill"}`}
            ></i>
          </button>
        </div>
      </div>
    </header>
  );
}
