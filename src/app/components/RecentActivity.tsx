// components/dashboard/RecentActivities.tsx
import styles from "../styles/recentactivities.module.css";

export default function RecentActivities() {
  const activities = [
    {
      name: "Mary",
      bg: "#0A3D91",
      title: "Correspondence received",
      detail: "Ministry of Finance · 2h ago",
    },
    {
      name: "David",
      bg: "#0D6EFD",
      title: "Report uploaded: Q2 Budget",
      detail: "by Christopher · 4h ago",
    },
    {
      name: "Sarah",
      bg: "#198754",
      title: "Meeting scheduled: External Affairs",
      detail: "Tomorrow 10:00 AM",
    },
  ];

  return (
    <div className={`${styles.card} card glass p-3 mb-4`}>
      <h5 className={styles.header}>
        <i className="bi bi-clock-history me-2 text-primary"></i>Recent
        Activities
      </h5>
      {activities.map((activity, index) => (
        <div
          key={index}
          className={`${styles.activity} ${index < activities.length - 1 ? styles.borderBottom : ""}`}
        >
          <img
            src={`https://ui-avatars.com/api/?name=${activity.name}+Senate&background=${activity.bg.replace("#", "")}&color=fff`}
            className="rounded-circle"
            width="36"
            height="36"
            alt={activity.name}
          />
          <div>
            <div className={styles.activityTitle}>{activity.title}</div>
            <div className={styles.activityDetail}>{activity.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
