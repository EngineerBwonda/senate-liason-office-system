// components/dashboard/WelcomeBanner.tsx
"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import {
  FileText,
  Mail,
  Users,
  CheckCircle2,
  FilePlus2,
  CalendarPlus,
  UploadCloud,
  SendHorizonal,
  Landmark,
  ArrowUpRight,
} from "lucide-react";
import styles from "../styles/welcomebannerB.module.css";

const kpis = [
  { icon: FileText, value: 12, label: "Minutes", trend: "+2 Today", up: true },
  {
    icon: Mail,
    value: 8,
    label: "Correspondence",
    trend: "+1 Today",
    up: true,
  },
  { icon: Users, value: 4, label: "Meetings", trend: "Today", up: null },
  {
    icon: CheckCircle2,
    value: 6,
    label: "Tasks Completed",
    trend: "of 8 this week",
    up: null,
  },
];

const quickActions = [
  { icon: FilePlus2, label: "New Memo" },
  { icon: CalendarPlus, label: "Schedule Meeting" },
  { icon: UploadCloud, label: "Upload Minutes" },
  { icon: SendHorizonal, label: "Create Correspondence" },
];

function useGreeting() {
  const [greeting, setGreeting] = useState("Good Morning");
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(
      hour < 12
        ? "Good Morning"
        : hour < 17
          ? "Good Afternoon"
          : "Good Evening",
    );
  }, []);
  return greeting;
}

const defaultTransition: Transition = {
  duration: 0.45,
  ease: "easeOut",
};

const container: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      ...defaultTransition,
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
};

export default function WelcomeBanner({ name = "Siyaat" }: { name?: string }) {
  const greeting = useGreeting();
  const prefersReducedMotion = useReducedMotion();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      className={styles.banner}
      variants={prefersReducedMotion ? undefined : container}
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate={prefersReducedMotion ? undefined : "show"}
    >
      <div className={styles.decor} aria-hidden="true">
        <span className={styles.glowOne} />
        <span className={styles.glowTwo} />
        <Landmark className={styles.watermark} strokeWidth={0.6} />
      </div>

      <div className={styles.avatarSlot}>
        <div className={styles.avatar}>
          <span>{initials}</span>
          <span className={styles.statusDot} />
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Left: identity + actions */}
        <motion.div
          variants={prefersReducedMotion ? undefined : item}
          className={styles.left}
        >
          <p className={styles.greeting}>{greeting},</p>
          <h1 className={styles.title}>Welcome back, {name}</h1>

          <div className={styles.metaRow}>
            <span className={styles.dateText}>{today}</span>
            <span className={styles.divider} />
            <span className={styles.sessionBadge}>
              <span className={styles.sessionDot} />
              Senate Session · Active
            </span>
          </div>

          <p className={styles.summary}>
            6 of 8 docket items completed this week — you&apos;re ahead of pace.
          </p>

          <div className={styles.actions}>
            {quickActions.map(({ icon: Icon, label }) => (
              <motion.button
                key={label}
                className={styles.actionBtn}
                whileHover={{ y: -2, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <Icon size={15} strokeWidth={2} />
                <span>{label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Right: KPI grid */}
        <div className={styles.kpiGrid}>
          {kpis.map(({ icon: Icon, value, label, trend, up }) => (
            <motion.div
              key={label}
              className={styles.kpiCard}
              variants={prefersReducedMotion ? undefined : item}
              whileHover={{ y: -3, scale: 1.02 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className={styles.kpiIcon}>
                <Icon size={17} strokeWidth={2} />
              </div>
              <span className={styles.kpiValue}>{value}</span>
              <span className={styles.kpiLabel}>{label}</span>
              <span className={styles.kpiTrend} data-up={up === true}>
                {up === true && <ArrowUpRight size={11} strokeWidth={2.5} />}
                {trend}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
