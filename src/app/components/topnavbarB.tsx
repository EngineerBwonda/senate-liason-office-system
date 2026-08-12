// components/layout/TopNavbar.tsx
"use client";

// add user profile picture, name, and role to the top navbar. The user profile should be a dropdown menu with links to the user's profile, settings, and logout. The top navbar should also have a search bar that allows users to search for minutes, correspondence, reports, meetings, and memos. The search bar should have a dropdown that shows the search results as the user types. The top navbar should also have a notification bell icon that shows the number of unread notifications. The top navbar should also have a theme toggle button that allows users to switch between light and dark mode. The top navbar should be responsive and work well on mobile devices.

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "../styles/topnavbarB.module.css";
import { useRouter } from "next/navigation";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

type NavbarUser = {
  name: string;
  role: string;
  avatarUrl: string;
};

type SearchItem = {
  title: string;
  category: "Minutes" | "Correspondence" | "Reports" | "Meetings" | "Memos";
  href: string;
};

const searchData: SearchItem[] = [
  { title: "Q2 Committee Minutes", category: "Minutes", href: "/minutes" },
  {
    title: "Finance Correspondence Tracker",
    category: "Correspondence",
    href: "/correspondence",
  },
  { title: "Budget Oversight Report", category: "Reports", href: "/reports" },
  {
    title: "External Delegation Meeting",
    category: "Meetings",
    href: "/meetings",
  },
  { title: "Procurement Process Memo", category: "Memos", href: "/memos" },
];

export default function TopNavbar() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    return savedTheme || (prefersDark ? "dark" : "light");
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [now, setNow] = useState(() => new Date());
  const [user, setUser] = useState<NavbarUser>({
    name: "Senate User",
    role: "Liaison Officer",
    avatarUrl: "/logo.png",
  });
  const tickingRef = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [theme]);

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const supabase = createSupabaseClient();
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser();

        if (error || !authUser) return;

        const metadataName =
          (authUser.user_metadata?.full_name as string | undefined) ||
          (authUser.user_metadata?.name as string | undefined);
        const emailFallback = authUser.email?.split("@")[0] || "Senate User";
        const role =
          (authUser.user_metadata?.position as string | undefined) ||
          (authUser.user_metadata?.role as string | undefined) ||
          "Liaison Officer";
        const avatarUrl =
          (authUser.user_metadata?.avatar_url as string | undefined) ||
          "/logo.png";

        setUser({
          name: metadataName || emailFallback,
          role,
          avatarUrl,
        });

        const { count } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("is_read", false)
          .eq("user_id", authUser.id);

        if (typeof count === "number") {
          setUnreadCount(count);
        }
      } catch {
        // Keep UI defaults if Supabase data cannot be loaded.
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-bs-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const filteredResults = searchData.filter((item) =>
    `${item.title} ${item.category}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const handleLogout = async () => {
    try {
      const supabase = createSupabaseClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch {
      router.push("/auth/login");
    }
  };

  const formattedTime = now.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedDate = now.toLocaleDateString("en-KE", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
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
                  filteredResults.map((item) => (
                    <Link
                      key={`${item.category}-${item.title}`}
                      href={item.href}
                      role="option"
                      tabIndex={0}
                      className={styles.resultItem}
                      onClick={() => setShowResults(false)}
                    >
                      <i
                        className="bi bi-file-earmark-text"
                        aria-hidden="true"
                      ></i>
                      <span>{item.title}</span>
                      <span className={styles.resultMeta}>{item.category}</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <div
              className={styles.timeDate}
              aria-label={`Current time ${formattedTime} on ${formattedDate}`}
            >
              <span className={styles.timeText}>{formattedTime}</span>
              <span className={styles.dateText}>{formattedDate}</span>
            </div>

            <Link
              href="/upload"
              className={styles.quickUpload}
              aria-label="Quick upload"
            >
              <i className="bi bi-cloud-arrow-up" aria-hidden="true"></i>
              <span>Quick Upload</span>
            </Link>

            <span className={styles.actionsDivider} aria-hidden="true" />

            <Link
              href="/notifications"
              className={styles.iconLink}
              id="notifBell"
              aria-label="Notifications"
            >
              <i className="bi bi-bell fs-5" aria-hidden="true"></i>
              <span className={styles.notificationBadge}>{unreadCount}</span>
            </Link>

            <span className={styles.actionsDivider} aria-hidden="true" />

            <div className={styles.dropdown} ref={menuRef}>
              <button
                className={styles.userMenu}
                aria-haspopup="true"
                aria-expanded={showUserMenu}
                aria-label="User menu"
                onClick={() => setShowUserMenu((prev) => !prev)}
              >
                <span className={styles.avatarRing}>
                  <span
                    className={styles.initialsAvatar}
                    aria-label={`${user.name} avatar`}
                  >
                    {initials || "SU"}
                  </span>
                </span>
                <span className={styles.userInfo}>
                  <span className={styles.userName}>{user.name}</span>
                  <span className={styles.userRole}>{user.role}</span>
                </span>
                <i
                  className={`bi bi-chevron-down ${styles.chevron}`}
                  aria-hidden="true"
                ></i>
              </button>
              <ul
                className={`${styles.dropdownMenu} ${showUserMenu ? styles.menuOpen : ""}`}
              >
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
                  <button
                    type="button"
                    className={`${styles.logoutButton} dropdown-item text-danger`}
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>Logout
                  </button>
                </li>
              </ul>
            </div>

            <button
              className={styles.themeToggle}
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
            </button>
          </div>
        </div>
      </header>
      <div className={styles.navbarSpacer} aria-hidden="true" />
    </>
  );
}
