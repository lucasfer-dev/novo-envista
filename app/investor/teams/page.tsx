import { redirect } from "next/navigation";
import { requireProductUser } from "@/lib/auth/require-product-user";

export default async function InvestorTeamsIndexPage() {
  await requireProductUser("investor");
  redirect("/investor/explore");
}
