import { redirect } from "next/navigation";

export default function GuardianRequiredPage() {
  redirect("/guardian");
}
