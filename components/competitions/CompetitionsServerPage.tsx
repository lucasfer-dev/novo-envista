import ProductShell from "@/components/real/ProductShell";
import { CompetitionDetailClient, CompetitionsBrowser } from "@/components/competitions/CompetitionsClient";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";

export async function CompetitionsServerPage({ expectedRole }: { expectedRole: ProductRole }) {
  const { appUser } = await requireProductUser(expectedRole);
  const basePath = expectedRole === "investor" ? "/investor/competitions" : "/app/competitions";
  return <ProductShell user={appUser} title="Competições"><CompetitionsBrowser basePath={basePath} /></ProductShell>;
}

export async function CompetitionDetailServerPage({ expectedRole, slug }: { expectedRole: ProductRole; slug: string }) {
  const { appUser } = await requireProductUser(expectedRole);
  const basePath = expectedRole === "investor" ? "/investor/competitions" : "/app/competitions";
  return <ProductShell user={appUser} title="Competições"><CompetitionDetailClient basePath={basePath} slug={slug} /></ProductShell>;
}
