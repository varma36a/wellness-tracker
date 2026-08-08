import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/auth";
import type { Reflection } from "@/lib/types";
import { ReflectionsClient } from "./ReflectionsClient";

async function getReflections(): Promise<Reflection[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reflections")
    .select("*")
    .order("reflection_date", { ascending: false })
    .limit(50);
  return data ?? [];
}

export default async function ReflectionsPage() {
  const [user, reflections] = await Promise.all([getUser(), getReflections()]);
  return <ReflectionsClient initialReflections={reflections} userId={user!.id} />;
}
