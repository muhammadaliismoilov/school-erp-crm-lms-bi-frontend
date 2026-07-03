import {
  GraduationCap,
  LayoutDashboard,
  Users,
  CalendarCheck,
  Wallet,
  Banknote,
  FileClock,
  Briefcase,
  BriefcaseBusiness,
  IdCard,
  Network,
  Plane,
  ListTodo,
  UserPlus,
  TerminalSquare,
  CalendarDays,
  BookOpen,
  BookMarked,
  NotebookPen,
  ClipboardList,
  Award,
  UsersRound,
  UserMinus,
  SquarePen,
  MessagesSquare,
  UserCheck,
  Trophy,
  Building2,
  DoorClosed,
  School,
  UserCog,
  ShieldCheck,
  Settings,
  CalendarRange,
  CalendarClock,
  Clock,
  Blocks,
  Link2,
  BarChart3,
  ArrowRightLeft,
  CreditCard,
  Receipt,
  TrendingDown,
  Megaphone,
  UserSearch,
  FileQuestion,
  Gauge,
  FolderKanban,
  MapPin,
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
    { href: "/students", labelKey: "nav.ac.students", icon: Users },
    { href: "/academic/parents", labelKey: "nav.ac.parents", icon: UsersRound },
    { href: "/academic/departed", labelKey: "nav.ac.departed", icon: UserMinus },
    { href: "/academic/grade-requests", labelKey: "nav.ac.gradeRequests", icon: SquarePen },
    { href: "/academic/parent-comms", labelKey: "nav.ac.parentComms", icon: MessagesSquare },
    { href: "/academic/student-parent", labelKey: "nav.ac.studentParent", icon: UserCheck },
    { href: "/academic/rating", labelKey: "nav.ac.rating", icon: Trophy },
    { href: "/academic/progress-reports", labelKey: "nav.ac.progressReports", icon: BarChart3 },
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
    { href: "/integrations", labelKey: "nav.integrations", icon: Blocks, permission: "integrations.read" },
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
    { href: "/quarters", labelKey: "nav.quarters", icon: CalendarClock, permission: "academic.read" },
    { href: "/lesson-periods", labelKey: "nav.lessonPeriods", icon: Clock, permission: "academic.read" },
    { href: "/rooms", labelKey: "nav.rooms", icon: DoorClosed, permission: "settings.read" },
    { href: "/classes", labelKey: "nav.classes", icon: GraduationCap, permission: "academic.read" },
    { href: "/subjects", labelKey: "nav.subjects", icon: BookOpen, permission: "academic.read" },
    { href: "/courses", labelKey: "nav.courses", icon: BookMarked, permission: "academic.read" },
  ],
};

/** "Moliya" section — transactions and contracts. */
export const FINANCE_GROUP: NavGroup = {
  id: "finance",
  labelKey: "nav.finance",
  icon: Wallet,
  permission: "finance.read",
  children: [
    { href: "/finance/transactions", labelKey: "nav.finance.transactions", icon: ArrowRightLeft, permission: "finance.read" },
    { href: "/finance/student-payments", labelKey: "nav.finance.studentPayments", icon: Receipt, permission: "finance.read" },
    { href: "/finance/debts", labelKey: "nav.finance.debts", icon: TrendingDown, permission: "finance.read" },
    { href: "/finance/payment-types", labelKey: "nav.finance.paymentTypes", icon: CreditCard, permission: "finance.read" },
    { href: "/finance/salaries", labelKey: "nav.finance.salaries", icon: Banknote, permission: "finance.read" },
    { href: "/finance/transactions/update-requests", labelKey: "nav.finance.updateRequests", icon: FileClock, permission: "finance.read" },
    { href: "/finance", labelKey: "nav.finance.contracts", icon: ClipboardList, permission: "finance.read" },
  ],
};

/** "HR" section — staff management. */
export const HR_GROUP: NavGroup = {
  id: "hr",
  labelKey: "nav.hr",
  icon: Briefcase,
  permission: "hr.read",
  children: [
    { href: "/hr", labelKey: "nav.hr.dashboard", icon: LayoutDashboard, permission: "hr.read" },
    { href: "/hr/employees", labelKey: "nav.hr.employees", icon: IdCard, permission: "hr.read" },
    { href: "/hr/tasks", labelKey: "nav.hr.tasks", icon: ListTodo, permission: "hr.read" },
    { href: "/hr/attendance", labelKey: "nav.hr.attendance", icon: CalendarCheck, permission: "hr.read" },
    { href: "/hr/leaves", labelKey: "nav.hr.leaves", icon: Plane, permission: "hr.read" },
    { href: "/hr/communications", labelKey: "nav.hr.communications", icon: MessagesSquare, permission: "hr.read" },
    { href: "/hr/vacancies", labelKey: "nav.hr.vacancies", icon: Megaphone, permission: "hr.read" },
    { href: "/hr/candidates", labelKey: "nav.hr.candidates", icon: UserSearch, permission: "hr.read" },
    { href: "/hr/surveys", labelKey: "nav.hr.surveys", icon: FileQuestion, permission: "hr.read" },
    { href: "/hr/performance", labelKey: "nav.hr.performance", icon: Gauge, permission: "hr.read" },
    { href: "/hr/branches", labelKey: "nav.hr.branches", icon: Building2, permission: "hr.read" },
    { href: "/hr/departments", labelKey: "nav.hr.departments", icon: Network, permission: "hr.read" },
    { href: "/hr/positions", labelKey: "nav.hr.positions", icon: BriefcaseBusiness, permission: "hr.read" },
    { href: "/hr/schedules", labelKey: "nav.hr.schedules", icon: CalendarDays, permission: "hr.read" },
    { href: "/hr/time-tracking", labelKey: "nav.hr.timeTracking", icon: Clock, permission: "hr.read" },
    { href: "/hr/payments", labelKey: "nav.hr.payments", icon: Banknote, permission: "hr.read" },
    { href: "/hr/projects", labelKey: "nav.hr.projects", icon: FolderKanban, permission: "hr.read" },
    { href: "/hr/geofences", labelKey: "nav.hr.geofences", icon: MapPin, permission: "hr.read" },
    { href: "/hr/teachers", labelKey: "nav.hr.teachers", icon: GraduationCap, permission: "hr.read" },
    { href: "/hr/statistics", labelKey: "nav.hr.statistics", icon: BarChart3, permission: "hr.read" },
  ],
};

export const NAV_ITEMS: NavEntry[] = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/explorer", labelKey: "nav.explorer", icon: TerminalSquare, badge: "explorer" },
  ACADEMIC_GROUP,
  {
    id: "attendance",
    labelKey: "nav.attendance",
    icon: CalendarCheck,
    permission: "attendance.read",
    children: [
      { href: "/attendance/teacher", labelKey: "nav.att.teacher", icon: ClipboardList },
      { href: "/attendance", labelKey: "nav.att.daily", icon: CalendarCheck },
    ],
  },
  FINANCE_GROUP,
  HR_GROUP,
  {
    id: "crm",
    labelKey: "nav.crm",
    icon: UserPlus,
    permission: "crm.read",
    children: [
      { href: "/crm/leads", labelKey: "nav.crm.leads", icon: Users, permission: "crm.read" },
      { href: "/crm/referrals", labelKey: "nav.crm.referrals", icon: Link2, permission: "crm.read" },
      { href: "/crm/sources", labelKey: "nav.crm.sources", icon: Blocks, permission: "crm.read" },
      { href: "/crm/stats", labelKey: "nav.crm.statistics", icon: BarChart3, permission: "crm.read" },
    ],
  },
  MANAGEMENT_GROUP,
  SETTINGS_GROUP,
];

/** Every navigable leaf, flattened — used for page-title resolution. */
export const NAV_LEAVES: NavLeaf[] = NAV_ITEMS.flatMap((entry) =>
  isGroup(entry) ? entry.children : [entry],
);
