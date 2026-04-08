import { notFound } from "next/navigation";
import { getProspectPageData } from "@/app/actions/agency";
import { ProspectWorkspace } from "./prospect-workspace";

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProspectPageData(id);
  if (!data) notFound();
  return <ProspectWorkspace data={data} />;
}
