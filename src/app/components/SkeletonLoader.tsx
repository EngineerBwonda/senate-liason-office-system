// components/ui/SkeletonLoader.tsx
import styles from "../styles/skeletonloader.module.css";

interface SkeletonLoaderProps {
  height?: string;
  borderRadius?: string;
}

export default function SkeletonLoader({
  height = "80px",
  borderRadius = "16px",
}: SkeletonLoaderProps) {
  return (
    <div className={styles.skeleton} style={{ height, borderRadius }}></div>
  );
}
