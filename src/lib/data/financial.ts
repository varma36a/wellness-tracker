import { createClient } from "@/lib/supabase/server";
import type { FinancialEntry } from "@/lib/types";

export async function getFinancialEntries(): Promise<FinancialEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("financial_entries")
    .select("*")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}
