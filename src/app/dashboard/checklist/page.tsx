import { format } from "date-fns";
import { getChecklistData } from "@/lib/data/checklist";
import { getUser } from "@/lib/supabase/auth";
import { ChecklistClient } from "./ChecklistClient";

export default async function ChecklistPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const currentMonth = format(new Date(), "yyyy-MM");

  const [user, data] = await Promise.all([getUser(), getChecklistData(today, currentMonth)]);

  return (
    <ChecklistClient
      {...data}
      userId={user!.id}
      initialDate={today}
      initialMonth={currentMonth}
    />
  );
}
