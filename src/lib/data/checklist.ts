import { endOfMonth, format, startOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { ChecklistItem, ChecklistLog } from "@/lib/types";

export type ChecklistData = {
  items: ChecklistItem[];
  logs: ChecklistLog[];
  monthLogs: ChecklistLog[];
};

function monthRange(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);
  const monthStart = startOfMonth(new Date(year, month - 1));
  return {
    start: format(monthStart, "yyyy-MM-dd"),
    end: format(endOfMonth(monthStart), "yyyy-MM-dd"),
  };
}

export async function getChecklistData(date: string, monthValue: string): Promise<ChecklistData> {
  const supabase = await createClient();
  const { start, end } = monthRange(monthValue);

  const [itemsRes, logsRes, monthLogsRes] = await Promise.all([
    supabase
      .from("checklist_items")
      .select("id,title,sort_order,is_active,user_id,created_at")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("checklist_logs")
      .select("id,item_id,log_date,completed,user_id,created_at")
      .eq("log_date", date),
    supabase
      .from("checklist_logs")
      .select("id,item_id,log_date,completed,user_id,created_at")
      .gte("log_date", start)
      .lte("log_date", end),
  ]);

  return {
    items: itemsRes.data ?? [],
    logs: logsRes.data ?? [],
    monthLogs: monthLogsRes.data ?? [],
  };
}
