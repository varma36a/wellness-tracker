import { getUser } from "@/lib/supabase/auth";
import { getFinancialEntries } from "@/lib/data/financial";
import { FinancialClient } from "./FinancialClient";

export default async function FinancialPage() {
  const [user, entries] = await Promise.all([getUser(), getFinancialEntries()]);
  return <FinancialClient initialEntries={entries} userId={user!.id} />;
}
