import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Router,
  SlidersHorizontal,
  BellRing,
  ReceiptText,
  MonitorSmartphone,
  CalendarCheck,
  Calculator,
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
  Crown,
  Brain,
  type LucideIcon,
} from "lucide-react";

/**
 * Menyu darvozalari — GRANULAR kodlar bilan.
 *
 * Har yaproq o'zi ochadigan sahifaning ASOSIY endpointi talab qiladigan kodni
 * ko'rsatadi (`/hr/employees` → `hr-staff.read`). Guruhda darvoza YO'Q: guruh
 * kamida bitta ko'rinadigan bolasi bo'lsa ko'rinadi.
 *
 * Nega guruh darvozasi olib tashlangan: u `VA` shartida ishlar edi va bitta
 * keng kod (`hr.read`) 21 ta bolani birdan yashirardi. Keng kodlar esa
 * granular rolloutdan keyin bironta endpoint tomonidan talab qilinmay qolgan
 * (1790200000000 migratsiyasi ularni o'chirdi), ya'ni menyu haqiqatda
 * tekshirilmaydigan narsani tekshirardi. Endi menyu darvozasi va backend
 * guardi bir xil kodga qaraydi.
 */
export interface NavLeaf {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /** Required permission; omit for always-visible items (self-service pages). */
  permission?: string;
  /**
   * Muqobil kodlar: shulardan BITTASI yetarli.
   *
   * Kerak bo'lgan holat: bitta sahifani ikki xil qamrovdagi foydalanuvchi
   * ochadi. `/appeals` — rahbariyat `appeals.read` bilan hammasini,
   * biriktirilgan xodim esa `appeals.read-assigned` bilan faqat o'zinikini
   * ko'radi. Bitta kod bilan darvoza ikkinchisini butunlay to'sib qo'yardi.
   */
  anyOf?: string[];
  /**
   * Maktab darajasidagi modul kaliti — bo'lim faqat CEO uni shu maktabga
   * YOQQANDA ko'rinadi. Ruxsatdan ALOHIDA qatlam: `director` global rol
   * bo'lgani uchun "faqat bitta maktabga berish" ruxsat orqali imkonsiz.
   * Backendda `@RequiresModule` bilan bir xil kalit.
   */
  module?: string;
}

export interface NavGroup {
  /** Stable id used to persist the expanded/collapsed state. */
  id: string;
  labelKey: string;
  icon: LucideIcon;
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
  children: [
    { href: "/academic/schedule", labelKey: "nav.ac.schedule", icon: CalendarDays, permission: "lms-lessons.read" },
    { href: "/academic/journal", labelKey: "nav.ac.journal", icon: BookOpen, permission: "lms-gradebook.read" },
    { href: "/academic/calendar", labelKey: "nav.ac.calendar", icon: NotebookPen, permission: "academic-courses.read" },
    { href: "/academic/progress-exams", labelKey: "nav.ac.progressExams", icon: ClipboardList, permission: "lms-exams.read" },
    { href: "/academic/state-exam", labelKey: "nav.ac.stateExam", icon: Award, permission: "lms-exams.read" },
    { href: "/students", labelKey: "nav.ac.students", icon: Users, permission: "students.read" },
    { href: "/academic/parents", labelKey: "nav.ac.parents", icon: UsersRound, permission: "users.read" },
    { href: "/academic/departed", labelKey: "nav.ac.departed", icon: UserMinus, permission: "students.read" },
    { href: "/academic/grade-requests", labelKey: "nav.ac.gradeRequests", icon: SquarePen, permission: "grade-requests.read" },
    { href: "/academic/parent-comms", labelKey: "nav.ac.parentComms", icon: MessagesSquare, permission: "parent-communications.read" },
    { href: "/academic/student-parent", labelKey: "nav.ac.studentParent", icon: UserCheck, permission: "student-parents.read" },
    { href: "/academic/rating", labelKey: "nav.ac.rating", icon: Trophy, permission: "students.read" },
    { href: "/academic/progress-reports", labelKey: "nav.ac.progressReports", icon: BarChart3, permission: "lms.read" },
  ],
};

/** "Boshqaruv" section — school records and platform settings. */
export const MANAGEMENT_GROUP: NavGroup = {
  id: "management",
  labelKey: "nav.management",
  icon: Building2,
  children: [
    { href: "/schools", labelKey: "nav.schools", icon: School, permission: "settings.read" },
    { href: "/users", labelKey: "nav.users", icon: UserCog, permission: "users.read" },
    { href: "/roles", labelKey: "nav.roles", icon: ShieldCheck, permission: "roles.read" },
    {
      href: "/appeals",
      labelKey: "nav.appeals",
      icon: MessagesSquare,
      anyOf: ["appeals.read", "appeals.read-assigned"],
    },
    { href: "/integrations", labelKey: "nav.integrations", icon: Blocks, permission: "integrations.read", module: "integrations" },
  ],
};

/** "Sozlamalar" section — academic calendar and reference data. */
export const SETTINGS_GROUP: NavGroup = {
  id: "settings",
  labelKey: "nav.settings",
  icon: Settings,
  children: [
    { href: "/academic-years", labelKey: "nav.academicYears", icon: CalendarRange, permission: "academic-years.read" },
    { href: "/quarters", labelKey: "nav.quarters", icon: CalendarClock, permission: "academic-quarters.read" },
    { href: "/lesson-periods", labelKey: "nav.lessonPeriods", icon: Clock, permission: "academic-lesson-periods.read" },
    { href: "/rooms", labelKey: "nav.rooms", icon: DoorClosed, permission: "settings-rooms.read" },
    { href: "/classes", labelKey: "nav.classes", icon: GraduationCap, permission: "academic-classes.read" },
    { href: "/subjects", labelKey: "nav.subjects", icon: BookOpen, permission: "academic-subjects.read" },
    { href: "/courses", labelKey: "nav.courses", icon: BookMarked, permission: "academic-courses.read" },
  ],
};

/** "Moliya" section — transactions and contracts. */
export const FINANCE_GROUP: NavGroup = {
  id: "finance",
  labelKey: "nav.finance",
  icon: Wallet,
  children: [
    { href: "/finance/transactions", labelKey: "nav.finance.transactions", icon: ArrowRightLeft, permission: "transactions.read" },
    // `finance.read` — TIRIK keng kod: o'quvchi to'lovlari/qarzlar endpointlari
    // aynan shuni talab qiladi (granular kodga bo'linmagan).
    { href: "/finance/student-payments", labelKey: "nav.finance.studentPayments", icon: Receipt, permission: "finance.read" },
    { href: "/finance/debts", labelKey: "nav.finance.debts", icon: TrendingDown, permission: "finance.read" },
    { href: "/finance/payment-types", labelKey: "nav.finance.paymentTypes", icon: CreditCard, permission: "transaction-payment-types.read" },
    { href: "/finance/salaries", labelKey: "nav.finance.salaries", icon: Banknote, permission: "finance-salaries.read" },
    { href: "/finance/transactions/update-requests", labelKey: "nav.finance.updateRequests", icon: FileClock, permission: "transaction-change-requests.read" },
    { href: "/finance", labelKey: "nav.finance.contracts", icon: ClipboardList, permission: "finance-contracts.read" },
  ],
};

/** "HR" section — staff management. */
export const HR_GROUP: NavGroup = {
  id: "hr",
  labelKey: "nav.hr",
  icon: Briefcase,
  children: [
    { href: "/hr", labelKey: "nav.hr.dashboard", icon: LayoutDashboard, permission: "hr-statistics.read" },
    { href: "/hr/employees", labelKey: "nav.hr.employees", icon: IdCard, permission: "hr-staff.read" },
    { href: "/hr/tasks", labelKey: "nav.hr.tasks", icon: ListTodo, permission: "hr-tasks.read" },
    { href: "/hr/attendance", labelKey: "nav.hr.attendance", icon: CalendarCheck, permission: "hr-attendance.read" },
    { href: "/hr/leaves", labelKey: "nav.hr.leaves", icon: Plane, permission: "hr-leaves.read" },
    { href: "/hr/communications", labelKey: "nav.hr.communications", icon: MessagesSquare, permission: "hr-interactions.read" },
    { href: "/hr/vacancies", labelKey: "nav.hr.vacancies", icon: Megaphone, permission: "hr-vacancies.read" },
    { href: "/hr/candidates", labelKey: "nav.hr.candidates", icon: UserSearch, permission: "hr-candidates.read" },
    { href: "/hr/surveys", labelKey: "nav.hr.surveys", icon: FileQuestion, permission: "hr-surveys.read" },
    { href: "/hr/performance", labelKey: "nav.hr.performance", icon: Gauge, permission: "hr-performance-reviews.read" },
    { href: "/hr/branches", labelKey: "nav.hr.branches", icon: Building2, permission: "hr-branches.read", module: "branches" },
    { href: "/hr/departments", labelKey: "nav.hr.departments", icon: Network, permission: "hr-departments.read" },
    { href: "/hr/positions", labelKey: "nav.hr.positions", icon: BriefcaseBusiness, permission: "hr-positions.read" },
    { href: "/hr/schedules", labelKey: "nav.hr.schedules", icon: CalendarDays, permission: "hr-work-schedules.read" },
    { href: "/hr/time-tracking", labelKey: "nav.hr.timeTracking", icon: Clock, permission: "hr-timesheets.read" },
    { href: "/hr/payroll", labelKey: "nav.hr.payroll", icon: Calculator, permission: "hr-payrolls.read" },
    { href: "/hr/payments", labelKey: "nav.hr.payments", icon: Banknote, permission: "hr-payments.read" },
    { href: "/hr/projects", labelKey: "nav.hr.projects", icon: FolderKanban, permission: "hr-projects.read" },
    { href: "/hr/geofences", labelKey: "nav.hr.geofences", icon: MapPin, permission: "hr-geofences.read" },
    { href: "/hr/teachers", labelKey: "nav.hr.teachers", icon: GraduationCap, permission: "hr-teachers.read" },
    { href: "/hr/statistics", labelKey: "nav.hr.statistics", icon: BarChart3, permission: "hr-statistics.read" },
    { href: "/hr/class-leaderships", labelKey: "nav.hr.classLeaderships", icon: Crown, permission: "hr-class-leaderships.read" },
  ],
};

export const NAV_ITEMS: NavEntry[] = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  ACADEMIC_GROUP,
  // Maxfiy — faqat PSYCHOLOGIST roli (+ super-admin) ko'radi. Guruhga emas,
  // ATAYLAB alohida elementga qo'yilgan: boshqa guruhga aralashtirish
  // "bu ham boshqalarga ochiq" degan noto'g'ri signal berardi.
  { href: "/counseling", labelKey: "nav.counseling", icon: Brain, permission: "counseling.read" },
  {
    id: "attendance",
    labelKey: "nav.attendance",
    icon: CalendarCheck,
    children: [
      { href: "/attendance/teacher", labelKey: "nav.att.teacher", icon: ClipboardList, permission: "session-attendance.read" },
      { href: "/attendance", labelKey: "nav.att.daily", icon: CalendarCheck, permission: "attendance-records.read" },
      {
        href: "/attendance/devices",
        labelKey: "nav.att.devices",
        icon: Router,
        permission: "turnstile-devices.read",
      },
      {
        href: "/attendance/settings",
        labelKey: "nav.att.settings",
        icon: SlidersHorizontal,
        permission: "attendance-settings.read",
      },
    ],
  },
  { href: "/profile/notifications", labelKey: "nav.notifChannels", icon: BellRing },
  { href: "/profile/payslips", labelKey: "nav.myPayslips", icon: ReceiptText },
  { href: "/profile/devices", labelKey: "nav.myDevices", icon: MonitorSmartphone },
  FINANCE_GROUP,
  HR_GROUP,
  {
    id: "crm",
    labelKey: "nav.crm",
    icon: UserPlus,
    children: [
      { href: "/crm/leads", labelKey: "nav.crm.leads", icon: Users, permission: "crm-leads.read" },
      { href: "/crm/referrals", labelKey: "nav.crm.referrals", icon: Link2, permission: "crm-referrals.read" },
      { href: "/crm/sources", labelKey: "nav.crm.sources", icon: Blocks, permission: "crm-sources.read" },
      // Statistika lidlar ustidan hisoblanadi — endpoint `crm-leads.read` talab qiladi.
      { href: "/crm/stats", labelKey: "nav.crm.statistics", icon: BarChart3, permission: "crm-leads.read" },
    ],
  },
  MANAGEMENT_GROUP,
  SETTINGS_GROUP,
];

/** Every navigable leaf, flattened — used for page-title resolution. */
export const NAV_LEAVES: NavLeaf[] = NAV_ITEMS.flatMap((entry) =>
  isGroup(entry) ? entry.children : [entry],
);

/**
 * Guruh ko'rinadimi: kamida bitta bolasi ruxsat etilgan bo'lsa. `can` — 
 * `useCan()` qaytaradigan funksiya (yoki testlarda oddiy predikat).
 */
/**
 * Yaproq ko'rinadimi — IKKI qatlam: ruxsat VA maktab moduli.
 *
 * `modules` hali kelmagan bo'lsa (so'rov yuklanmoqda) bayroqli bo'lim
 * YASHIRIN qoladi: ko'rsatib keyin olib qo'yishdan ko'ra, kechroq ko'rsatish
 * yaxshiroq. Bayroqli modullarning defaulti baribir "o'chiq".
 */
export function isLeafVisible(
  leaf: NavLeaf,
  can: (permission?: string) => boolean,
  modules?: Record<string, boolean>,
): boolean {
  if (!can(leaf.permission)) return false;
  if (leaf.anyOf && !leaf.anyOf.some((code) => can(code))) return false;
  if (!leaf.module) return true;
  return modules?.[leaf.module] === true;
}

export function isGroupVisible(
  group: NavGroup,
  can: (permission?: string) => boolean,
  modules?: Record<string, boolean>,
): boolean {
  return group.children.some((child) => isLeafVisible(child, can, modules));
}
