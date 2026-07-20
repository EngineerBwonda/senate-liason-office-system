// components/dashboard/StatCard.tsx
import styles from "../styles/statcard.module.css";

interface StatCardProps {
  icon: string;
  count: string | number;
  label: string;
}

export default function StatCard({ icon, count, label }: StatCardProps) {
  return (
    <div className={`${styles.card} card p-3`}>
      <i className={`${icon} ${styles.icon}`}></i>
      <h3 className={styles.count}>{count}</h3>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
