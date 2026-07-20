// components/dashboard/OfficeFeed.tsx
import styles from "../styles/officefeed.module.css";

export default function OfficeFeed() {
  const feeds = [
    {
      name: "Anna",
      bg: "#0D6EFD",
      time: "1h",
      content: "New internal memo on procurement.",
    },
    {
      name: "Mark",
      bg: "#198754",
      time: "3h",
      content: "Q3 draft ready for review.",
    },
  ];

  return (
    <div className={`${styles.card} card glass p-3`}>
      <h5 className={styles.header}>
        <i className="bi bi-newspaper me-2 text-primary"></i>Office Feed
      </h5>
      {feeds.map((feed, index) => (
        <div key={index} className={styles.feedItem}>
          <div className={styles.feedContent}>
            <img
              src={`https://ui-avatars.com/api/?name=${feed.name}+Senate&background=${feed.bg.replace("#", "")}&color=fff`}
              width="32"
              height="32"
              className="rounded-circle"
              alt={feed.name}
            />
            <div>
              <span className={styles.author}>{feed.name}</span>
              <span className={styles.time}> · {feed.time}</span>
              <p className={styles.content}>{feed.content}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
