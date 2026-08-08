import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getUser } from "@/lib/supabase/auth";
import { DashboardNav } from "@/components/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  try {
    const user = await getUser();

    if (!user) {
      redirect("/login");
    }

    return (
      <div className="flex min-h-screen dashboard-bg">
        <DashboardNav email={user.email ?? ""} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    );
  } catch {
    redirect("/login");
  }
}
