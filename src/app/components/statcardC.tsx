"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Mail,
  Send,
  BarChart3,
  FileText,
  Newspaper,
  FileEdit,
  MessageSquare,
  Image as ImageIcon,
  UserCheck,
  Bell,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import styles from "../styles/statcardC.module.css";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Accent =
  | "blue"
  | "teal"
  | "purple"
  | "indigo"
  | "red"
  | "amber"
  | "cyan"
  | "pink"
  | "green"
  | "orange";

type PillTone = "neutral" | "info" | "success" | "warning" | "danger";

interface QuickAccessItem {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  pillLabel: string;
  pillTone: PillTone;
  accent: Accent;
  href: string;
}

/* ------------------------------------------------------------------ */
/*  Data — swap or extend this list to add / remove cards              */
/* ------------------------------------------------------------------ */

const items: QuickAccessItem[] = [
  {
    id: "internal-correspondence",
    icon: Mail,
    title: "Internal Correspondence",
    description: "Memos and letters shared between departments",
    pillLabel: "3 Unread",
    pillTone: "info",
    accent: "blue",
    href: "/correspondence/internal",
  },
  {
    id: "external-correspondence",
    icon: Send,
    title: "External Correspondence",
    description: "Letters and emails from outside parties",
    pillLabel: "2 Pending",
    pillTone: "warning",
    accent: "teal",
    href: "/correspondence/external",
  },
  {
    id: "reports",
    icon: BarChart3,
    title: "Reports",
    description: "Weekly and monthly performance reports",
    pillLabel: "1 Due Soon",
    pillTone: "warning",
    accent: "purple",
    href: "/reports",
  },
  {
    id: "minutes",
    icon: FileText,
    title: "Minutes",
    description: "Meeting minutes awaiting your review",
    pillLabel: "3 New",
    pillTone: "info",
    accent: "indigo",
    href: "/minutes",
  },
  {
    id: "office-feed",
    icon: Newspaper,
    title: "Office Feed",
    description: "Latest updates and announcements",
    pillLabel: "Live",
    pillTone: "success",
    accent: "red",
    href: "/feed",
  },
  {
    id: "memos",
    icon: FileEdit,
    title: "Memos",
    description: "Internal notes and directives to action",
    pillLabel: "Needs Attention",
    pillTone: "danger",
    accent: "amber",
    href: "../pages/memo",
  },
  {
    id: "group-chat",
    icon: MessageSquare,
    title: "Group Chat",
    description: "Team conversations and active threads",
    pillLabel: "11 Unread",
    pillTone: "info",
    accent: "cyan",
    href: "/chats",
  },
  {
    id: "gallery",
    icon: ImageIcon,
    title: "Gallery",
    description: "Photos and albums from recent events",
    pillLabel: "Updated",
    pillTone: "neutral",
    accent: "pink",
    href: "/gallery",
  },
  {
    id: "delegates",
    icon: UserCheck,
    title: "Delegates",
    description: "Scheduled delegate assignments and coverage",
    pillLabel: "Confirmed",
    pillTone: "success",
    accent: "green",
    href: "/delegates",
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Notifications",
    description: "System alerts and reminders that need eyes",
    pillLabel: "5 New",
    pillTone: "info",
    accent: "orange",
    href: "/notifications",
  },
];

/* ------------------------------------------------------------------ */
/*  Motion variants                                                     */
/* ------------------------------------------------------------------ */

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const MotionLink = motion.create(Link);

/* ------------------------------------------------------------------ */
/*  Reusable card                                                       */
/* ------------------------------------------------------------------ */

export function QuickAccessCard({
  icon: Icon,
  title,
  description,
  pillLabel,
  pillTone,
  accent,
  href,
}: QuickAccessItem) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <MotionLink
      href={href}
      className={styles.card}
      data-accent={accent}
      aria-label={`${title}: ${description}. ${pillLabel}. View details`}
      variants={prefersReducedMotion ? undefined : item}
      whileHover={prefersReducedMotion ? undefined : { y: -6, scale: 1.025 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <span className={styles.glow} aria-hidden="true" />

      <span className={styles.topRow}>
        <span className={styles.iconWrap}>
          <Icon size={20} strokeWidth={2} />
        </span>
        <span className={styles.pill} data-tone={pillTone}>
          {pillLabel}
        </span>
      </span>

      <span className={styles.title}>{title}</span>
      <span className={styles.description}>{description}</span>

      <span className={styles.footer}>
        View details <ChevronRight size={13} strokeWidth={2.5} />
      </span>
    </MotionLink>
  );
}

/* ------------------------------------------------------------------ */
/*  Grid + section header                                              */
/* ------------------------------------------------------------------ */

export default function QuickAccessGrid() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Quick Access</h2>
      </div>

      <motion.div
        className={styles.grid}
        role="list"
        aria-label="Quick access shortcuts"
        variants={prefersReducedMotion ? undefined : container}
        initial={prefersReducedMotion ? undefined : "hidden"}
        whileInView={prefersReducedMotion ? undefined : "show"}
        viewport={{ once: true, amount: 0.3 }}
      >
        {items.map((entry) => (
          <div role="listitem" key={entry.id} className={styles.gridItem}>
            <QuickAccessCard {...entry} />
          </div>
        ))}
      </motion.div>
    </section>
  );
}
