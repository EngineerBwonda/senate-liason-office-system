"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Inbox,
  UploadCloud,
  Mail,
  MessageSquare,
  CalendarPlus,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";
import styles from "../styles/quickactionB.module.css";

type Accent = "blue" | "purple" | "green" | "cyan" | "orange" | "indigo";

interface ActionItem {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
  accent: Accent;
}

const actions: ActionItem[] = [
  {
    id: "receive-minutes",
    icon: Inbox,
    label: "Receive Minutes",
    href: "#",
    accent: "blue",
  },
  {
    id: "upload-report",
    icon: UploadCloud,
    label: "Upload Report",
    href: "#",
    accent: "purple",
  },
  {
    id: "view-correspondence",
    icon: Mail,
    label: "View Corresp.",
    href: "#",
    accent: "green",
  },
  {
    id: "open-chat",
    icon: MessageSquare,
    label: "Open Chat",
    href: "#",
    accent: "cyan",
  },
  {
    id: "schedule-meeting",
    icon: CalendarPlus,
    label: "Schedule Meeting",
    href: "#",
    accent: "orange",
  },
  {
    id: "view-gallery",
    icon: ImageIcon,
    label: "View Gallery",
    href: "#",
    accent: "indigo",
  },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const MotionLink = motion(Link);

function ActionCard({ icon: Icon, label, href, accent }: ActionItem) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <MotionLink
      href={href}
      className={styles.card}
      data-accent={accent}
      aria-label={label}
      variants={prefersReducedMotion ? undefined : item}
      whileHover={prefersReducedMotion ? undefined : { y: -5, scale: 1.03 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={(e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("showToast"));
      }}
    >
      <span className={styles.glow} aria-hidden="true" />
      <span className={styles.iconWrap}>
        <Icon size={19} strokeWidth={2} />
      </span>
      <span className={styles.label}>{label}</span>
    </MotionLink>
  );
}

export default function QuickActions() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section>
      <div className={styles.sectionHeader}>
        <h6 className={styles.sectionTitle}>Quick Actions</h6>
      </div>

      <motion.div
        className={styles.grid}
        role="list"
        aria-label="Quick actions"
        variants={prefersReducedMotion ? undefined : container}
        initial={prefersReducedMotion ? undefined : "hidden"}
        whileInView={prefersReducedMotion ? undefined : "show"}
        viewport={{ once: true, amount: 0.3 }}
      >
        {actions.map((action) => (
          <div role="listitem" key={action.id} className={styles.gridItem}>
            <ActionCard {...action} />
          </div>
        ))}
      </motion.div>
    </section>
  );
}
