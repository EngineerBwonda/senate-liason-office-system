"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Landmark,
  GraduationCap,
  Users,
  User,
  Globe,
  MapPin,
  Briefcase,
  FileSignature,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";
//import { QuickAccessCard } from "./QuickAccessGrid"; // adjust path as needed
import styles from "../styles/statcardC.module.css";
import { QuickAccessCard } from "./statcardC";

/* ------------------------------------------------------------------ */
/*  Types (reuse the same shape as QuickAccessGrid)                    */
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

interface DelegationItem {
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
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const delegationItems: DelegationItem[] = [
  {
    id: "county-assembly",
    icon: Landmark,
    title: "County Assembly",
    description: "Visits from county assembly members and staff",
    pillLabel: "2 Scheduled",
    pillTone: "info",
    accent: "blue",
    href: "/delegation/county-assembly",
  },
  {
    id: "schools",
    icon: GraduationCap,
    title: "Schools",
    description: "Educational visits and student tours",
    pillLabel: "1 Upcoming",
    pillTone: "info",
    accent: "teal",
    href: "/delegation/schools",
  },
  {
    id: "organised-groups",
    icon: Users,
    title: "Organised Groups",
    description: "Community and organisation group visits",
    pillLabel: "3 Confirmed",
    pillTone: "success",
    accent: "purple",
    href: "/delegation/organised-groups",
  },
  {
    id: "individuals",
    icon: User,
    title: "Individuals",
    description: "Single-visitor appointments and walk-ins",
    pillLabel: "Open",
    pillTone: "neutral",
    accent: "indigo",
    href: "/delegation/individuals",
  },
  {
    id: "international-delegates",
    icon: Globe,
    title: "International Delegates",
    description: "Visiting delegations from other countries",
    pillLabel: "1 Pending",
    pillTone: "warning",
    accent: "red",
    href: "/delegation/international",
  },
  {
    id: "local-delegates",
    icon: MapPin,
    title: "Local Delegates",
    description: "Delegations from within the county",
    pillLabel: "Confirmed",
    pillTone: "success",
    accent: "amber",
    href: "/delegation/local",
  },
  {
    id: "internship",
    icon: Briefcase,
    title: "Internship",
    description: "Internship placements and inquiries",
    pillLabel: "4 Active",
    pillTone: "info",
    accent: "cyan",
    href: "/delegation/internship",
  },
  {
    id: "attachment",
    icon: FileSignature,
    title: "Attachment",
    description: "Industrial attachment placements",
    pillLabel: "2 Active",
    pillTone: "info",
    accent: "pink",
    href: "/delegation/attachment",
  },
  {
    id: "volunteers",
    icon: HeartHandshake,
    title: "Volunteers",
    description: "Volunteer sign-ups and coordination",
    pillLabel: "6 Active",
    pillTone: "success",
    accent: "green",
    href: "/delegation/volunteers",
  },
];

/* ------------------------------------------------------------------ */
/*  Motion variants                                                     */
/* ------------------------------------------------------------------ */

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

/* ------------------------------------------------------------------ */
/*  Grid + section header                                              */
/* ------------------------------------------------------------------ */

export default function VisitingDelegationGrid() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Visiting Delegation</h2>
      </div>

      <motion.div
        className={styles.grid}
        role="list"
        aria-label="Visiting delegation shortcuts"
        variants={prefersReducedMotion ? undefined : container}
        initial={prefersReducedMotion ? undefined : "hidden"}
        whileInView={prefersReducedMotion ? undefined : "show"}
        viewport={{ once: true, amount: 0.3 }}
      >
        {delegationItems.map((entry) => (
          <div role="listitem" key={entry.id} className={styles.gridItem}>
            <QuickAccessCard {...entry} />
          </div>
        ))}
      </motion.div>
    </section>
  );
}
