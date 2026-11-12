import { redirect } from "next/navigation";

// Compatibility route for older links. The dedicated schools page was retired;
// the "Para quem é" section of About now explains the supported audiences.
export default function SchoolsLegacyRedirect() {
  redirect("/about#para-quem");
}
