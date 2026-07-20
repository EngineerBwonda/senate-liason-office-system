// components/dashboard/WelcomeBanner.tsx
import styles from "../styles/welcomeBanner.module.css";

export default function WelcomeBanner() {
  return (
    <div className={`${styles.banner} glass`}>
      <div className={styles.content}>
        <h5 className={styles.greeting}>Good Morning,</h5>
        <h2 className={styles.title}>Welcome back, Siyaat</h2>
        <p className={styles.date}>
          <i className="bi bi-calendar3 me-2"></i>July 19, 2026 · Senate Session
        </p>
        <div className={styles.badges}>
          <span className={styles.badge}>
            <i className="bi bi-journal-text me-1"></i> 12 Minutes
          </span>
          <span className={styles.badge}>
            <i className="bi bi-envelope-paper me-1"></i> 8 Corresp.
          </span>
          <span className={styles.badge}>
            <i className="bi bi-people me-1"></i> 4 Meetings
          </span>
        </div>
      </div>
      <div className={styles.iconContainer}>
        <i className="bi bi-building fs-1"></i>
      </div>
    </div>
  );
}
