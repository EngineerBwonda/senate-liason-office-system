"use client";

import Image from "next/image";
import styles from "./home.module.css";

import { useEffect, useState } from "react";

import TopNavbar from "./components/topnavbarB";
import BottomNav from "./components/BottomNav";
import StatsGrid from "./components/StatcardB";
import OfficeFeed from "./components/OfficeFeed";
import SkeletonLoader from "./components/SkeletonLoader";
import ToastContainer from "./components/ToastContainer";
import OfficeFeedSkeleton from "./components/OfficeFeed";
import Sidebar from "./components/Sidebar";
import RecentActivities from "./components/RecentActivity";
import QuickActions from "./components/QuickactionB";
import WelcomeBanner from "./components/WelcomeBannerB";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        {/* <Sidebar /> */}
        <main className={`${styles.main} ${styles.mainWithSidebar}`}>
          <TopNavbar />
          <WelcomeBanner />

          <div className={styles.statsGrid}>
            <StatsGrid />
          </div>

          <QuickActions />

          {loading ? (
            <div className={styles.skeletonGrid}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.skeletonCol}>
                  <SkeletonLoader height="80px" borderRadius="16px" />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.loadedContent}>
              <i className="bi bi-check-circle-fill text-success me-2"></i>
              Content loaded
            </div>
          )}

          <div className={styles.contentGrid}>
            <div className={styles.contentLeft}>
              <RecentActivities />
              <div className={`${styles.emptyState} card glass p-4 mb-3`}>
                <i className="bi bi-inbox fs-1 text-secondary"></i>
                <p className="mt-2">No new notifications</p>
              </div>
            </div>
            <div className={styles.contentRight}>
              <OfficeFeed />
            </div>
          </div>

          <footer className={styles.footer}>
            <span>© 2026 Senate Liaison Office v2.0</span>
            <span>
              <a href="#" className={styles.footerLink}>
                Privacy
              </a>
              {" · "}
              <a href="#" className={styles.footerLink}>
                Help
              </a>
            </span>
          </footer>
        </main>
      </div>
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
