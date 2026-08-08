import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/auth";
import type { JournalEvent } from "@/lib/types";
import { EventsClient } from "./EventsClient";

async function getEvents(): Promise<JournalEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("journal_events")
    .select("*")
    .order("event_date", { ascending: false })
    .limit(50);
  return data ?? [];
}

export default async function EventsPage() {
  const [user, events] = await Promise.all([getUser(), getEvents()]);
  return <EventsClient initialEvents={events} userId={user!.id} />;
}
