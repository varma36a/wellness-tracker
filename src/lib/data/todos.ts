import { createClient } from "@/lib/supabase/server";
import type { Todo } from "@/lib/types";

export async function getTodos(): Promise<Todo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("todos")
    .select("*")
    .order("completed")
    .order("sort_order")
    .order("created_at", { ascending: false });
  return data ?? [];
}
