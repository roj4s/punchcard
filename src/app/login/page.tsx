import { redirect } from "next/navigation";
import { safePath } from "@/lib/safe-path";
import { getUser } from "@/server/session";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const target = safePath(typeof next === "string" ? next : null);
  if (await getUser()) redirect(target);

  return (
    <main className="page max-w-sm">
      <h1 className="title">Sign in</h1>
      {target.startsWith("/scan/") && (
        <p className="mb-4 text-stone-600">Sign in or create an account to collect your stamp.</p>
      )}
      <LoginForm next={target} />
    </main>
  );
}
