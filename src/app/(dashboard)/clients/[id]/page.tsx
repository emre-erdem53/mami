import { notFound } from "next/navigation";
import { getClientBundle, recordRecentClient } from "@/app/actions/agency";
import { ClientWorkspace } from "./client-workspace";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = await getClientBundle(id);
  if (!bundle) notFound();
  await recordRecentClient(id);
  return <ClientWorkspace bundle={bundle} />;
}
