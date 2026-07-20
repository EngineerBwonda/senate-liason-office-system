"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  animate,
  type Variants,
} from "framer-motion";
import {
  FileText,
  Mail,
  BarChart3,
  Users,
  MessageSquare,
  UserCheck,
  FileEdit,
  Newspaper,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import styles from "../styles/statcardB.module.css";

type Accent =
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "cyan"
  | "indigo"
  | "amber"
  | "red";
type TrendDirection = "up" | "down" | "neutral";

interface StatItem {
  id: string;
  icon: LucideIcon;
  value: number;
  label: string;
  secondary: string;
  trendDirection: TrendDirection;
  accent: Accent;
  href: string;
  progress?: number;
}

const stats: StatItem[] = [
  {
    id: "minutes",
    icon: FileText,
    value: 24,
    label: "Minutes Received",
    secondary: "+3 Today",
    trendDirection: "up",
    accent: "blue",
    href: "/minutes",
  },
  {
    id: "correspondence",
    icon: Mail,
    value: 18,
    label: "Correspondence",
    secondary: "2 Pending Review",
    trendDirection: "neutral",
    accent: "green",
    href: "/correspondence",
  },
  {
    id: "reports",
    icon: BarChart3,
    value: 7,
    label: "Reports",
    secondary: "1 Due This Week",
    trendDirection: "neutral",
    accent: "purple",
    href: "/reports",
    progress: 62,
  },
  {
    id: "meetings",
    icon: Users,
    value: 5,
    label: "Meetings Today",
    secondary: "Next at 2:00 PM",
    trendDirection: "neutral",
    accent: "orange",
    href: "/internal-meetings",
  },
  {
    id: "chats",
    icon: MessageSquare,
    value: 11,
    label: "Unread Chats",
    secondary: "3 New",
    trendDirection: "up",
    accent: "cyan",
    href: "/chats",
  },
  {
    id: "delegates",
    icon: UserCheck,
    value: 3,
    label: "Delegates Scheduled",
    secondary: "Confirmed",
    trendDirection: "neutral",
    accent: "indigo",
    href: "/delegates",
  },
  {
    id: "memos",
    icon: FileEdit,
    value: 9,
    label: "Memos",
    secondary: "Needs Attention",
    trendDirection: "down",
    accent: "amber",
    href: "/memos",
  },
  {
    id: "feed",
    icon: Newspaper,
    value: 14,
    label: "Office Feed",
    secondary: "Last updated 5 mins ago",
    trendDirection: "neutral",
    accent: "red",
    href: "/feed",
  },
];

const trendIconMap = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  neutral: null,
} as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const MotionLink = motion.create(Link);

function StatValue({
  value,
  animateIn,
}: {
  value: number;
  animateIn: boolean;
}) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!animateIn) return;
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(0, value, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate(v) {
        node.textContent = Math.round(v).toString();
      },
    });

    return () => controls.stop();
  }, [value, animateIn]);

  if (!animateIn) return <span>{value}</span>;
  return <span ref={nodeRef}>0</span>;
}

function StatCard({
  icon: Icon,
  value,
  label,
  secondary,
  trendDirection,
  accent,
  href,
  progress,
}: StatItem) {
  const prefersReducedMotion = useReducedMotion();
  const TrendIcon = trendIconMap[trendDirection];

  return (
    <MotionLink
      href={href}
      className={styles.card}
      data-accent={accent}
      aria-label={`${label}: ${value}. ${secondary}. View details`}
      variants={prefersReducedMotion ? undefined : item}
      whileHover={prefersReducedMotion ? undefined : { y: -6, scale: 1.025 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <span className={styles.glow} aria-hidden="true" />

      <span className={styles.iconWrap}>
        <Icon size={20} strokeWidth={2} />
      </span>

      <span className={styles.value}>
        <StatValue value={value} animateIn={!prefersReducedMotion} />
      </span>

      <span className={styles.label}>{label}</span>

      <span className={styles.secondary} data-trend={trendDirection}>
        {TrendIcon && <TrendIcon size={12} strokeWidth={2.5} />}
        {secondary}
      </span>

      {typeof progress === "number" && (
        <span className={styles.progressTrack} aria-hidden="true">
          <span
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </span>
      )}

      <span className={styles.footer}>
        View details <ChevronRight size={13} strokeWidth={2.5} />
      </span>
    </MotionLink>
  );
}

export default function StatsGrid() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={styles.grid}
      role="list"
      aria-label="Dashboard statistics"
      variants={prefersReducedMotion ? undefined : container}
      initial={prefersReducedMotion ? undefined : "hidden"}
      whileInView={prefersReducedMotion ? undefined : "show"}
      viewport={{ once: true, amount: 0.3 }}
    >
      {stats.map((stat) => (
        <div role="listitem" key={stat.id} className={styles.gridItem}>
          <StatCard {...stat} />
        </div>
      ))}
    </motion.div>
  );
}
