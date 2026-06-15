import { redirect } from "next/navigation";

/** Qabul (CRM) bo'limining asosiy sahifasi — Lidlar ro'yxatiga yo'naltiradi. */
export default function CrmIndexPage() {
  redirect("/crm/leads");
}
