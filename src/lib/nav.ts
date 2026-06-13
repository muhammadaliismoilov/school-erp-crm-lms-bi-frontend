import {
  GraduationCap,
  LayoutDashboard,
  Users,
  CalendarCheck,
  Wallet,
  UserPlus,
  TerminalSquare,
  CalendarDays,
  BookOpen,
  NotebookPen,
  ClipboardList,
  Award,
  UsersRound,
  UserMinus,
  SquarePen,
  MessagesSquare,
  UserCheck,
  Trophy,
  FileBarChart,
  Building2,
  School,
  UserCog,
  ShieldCheck,
  Settings,
  CalendarRange,
  type LucideIcon,
} from "lucide-react";

export interface NavLeaf {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /** Required permission; omit for always-visible items. */
  permission?: string;
  /** Optional badge text rendered on the right (e.g. endpoint count). */
  badge?: "explorer";
}

export interface NavGroup {
  /** Stable id used to persist the expanded/collapsed state. */
  id: string;
  labelKey: string;
  icon: LucideIcon;
  permission?: string;
  children: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

export function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

/** The full "Ta'lim" (Academic) section — matches the Durbin reference layout. */
export const ACADEMIC_GROUP: NavGroup = {
  id: "academic",
  labelKey: "nav.academic",
  icon: GraduationCap,
  permission: "academic.read",
  children: [
    { href: "/academic/schedule", labelKey: "nav.ac.schedule", icon: CalendarDays },
    { href: "/academic/journal", labelKey: "nav.ac.journal", icon: BookOpen },
    { href: "/academic/calendar", labelKey: "nav.ac.calendar", icon: NotebookPen },
    { href: "/academic/progress-exams", labelKey: "nav.ac.progressExams", icon: ClipboardList },
    { href: "/academic/state-exam", labelKey: "nav.ac.stateExam", icon: Award },
    { href: "/academic/students", labelKey: "nav.ac.students", icon: Users },
    { href: "/academic/parents", labelKey: "nav.ac.parents", icon: UsersRound },
    { href: "/academic/departed", labelKey: "nav.ac.departed", icon: UserMinus },
    { href: "/academic/grade-requests", labelKey: "nav.ac.gradeRequests", icon: SquarePen },
    { href: "/academic/parent-comms", labelKey: "nav.ac.parentComms", icon: MessagesSquare },
    { href: "/academic/student-parent", labelKey: "nav.ac.studentParent", icon: UserCheck },
    { href: "/academic/rating", labelKey: "nav.ac.rating", icon: Trophy },
    { href: "/academic/reports", labelKey: "nav.ac.reports", icon: FileBarChart },
  ],
};

/** "Boshqaruv" section — school records and platform settings. */
export const MANAGEMENT_GROUP: NavGroup = {
  id: "management",
  labelKey: "nav.management",
  icon: Building2,
  permission: "settings.read",
  children: [
    { href: "/schools", labelKey: "nav.schools", icon: School, permission: "settings.read" },
    { href: "/users", labelKey: "nav.users", icon: UserCog, permission: "users.read" },
    { href: "/roles", labelKey: "nav.roles", icon: ShieldCheck, permission: "roles.read" },
    { href: "/appeals", labelKey: "nav.appeals", icon: MessagesSquare, permission: "appeals.read" },
  ],
};

/** "Sozlamalar" section — academic calendar and reference data. */
export const SETTINGS_GROUP: NavGroup = {
  id: "settings",
  labelKey: "nav.settings",
  icon: Settings,
  permission: "academic.read",
  children: [
    { href: "/academic-years", labelKey: "nav.academicYears", icon: CalendarRange, permission: "academic.read" },
  ],
};

export const NAV_ITEMS: NavEntry[] = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/explorer", labelKey: "nav.explorer", icon: TerminalSquare, badge: "explorer" },
  ACADEMIC_GROUP,
  {
    href: "/attendance",
    labelKey: "nav.attendance",
    icon: CalendarCheck,
    permission: "attendance.read",
  },
  {
    href: "/finance",
    labelKey: "nav.finance",
    icon: Wallet,
    permission: "finance.read",
  },
  {
    href: "/crm",
    labelKey: "nav.crm",
    icon: UserPlus,
    permission: "crm.read",
  },
  MANAGEMENT_GROUP,
  SETTINGS_GROUP,
];

/** Every navigable leaf, flattened — used for page-title resolution. */
export const NAV_LEAVES: NavLeaf[] = NAV_ITEMS.flatMap((entry) =>
  isGroup(entry) ? entry.children : [entry],
);
