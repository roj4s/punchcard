import { getToken } from "@/server/loyalty";
import { requireUser } from "@/server/session";
import { Collect } from "./collect";

// Collecting is a button, not a side effect of opening the link, so link
// previews and prefetching can't use up the token
export default async function ScanPage({ params }: PageProps<"/scan/[token]">) {
  const { token } = await params;
  await requireUser(`/scan/${encodeURIComponent(token)}`);
  const found = getToken(token);

  return (
    <main className="page max-w-sm">
      {!found ? (
        <p className="text-red-600">This QR code isn&apos;t valid.</p>
      ) : found.usedAt ? (
        <p className="text-red-600">This QR code was already used. Ask for a new one at the counter.</p>
      ) : (
        <>
          <h1 className="title">{found.businessName}</h1>
          <p className="mb-6 text-stone-600">Collect stamps for {found.reward}.</p>
          <Collect token={token} />
        </>
      )}
    </main>
  );
}
