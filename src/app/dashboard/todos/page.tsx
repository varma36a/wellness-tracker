import { getUser } from "@/lib/supabase/auth";
import { getTodos } from "@/lib/data/todos";
import { TodoClient } from "./TodoClient";

export default async function TodosPage() {
  const [user, todos] = await Promise.all([getUser(), getTodos()]);
  return <TodoClient initialTodos={todos} userId={user!.id} />;
}
