import { getDashboardOverview } from "@/lib/data/dashboard";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

export default async function DashboardPage() {
  const data = await getDashboardOverview();
  return <DashboardOverview data={data} />;
}
