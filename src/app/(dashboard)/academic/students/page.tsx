import { redirect } from "next/navigation";

/**
 * The rich students experience lives at `/students` (list) and `/students/[id]`
 * (9-tab profile). This legacy route now redirects there so the sidebar and any
 * old bookmarks land on the full-featured page instead of the basic table.
 */
export default function AcademicStudentsRedirect() {
  redirect("/students");
}
