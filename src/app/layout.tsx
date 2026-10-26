import type { Metadata } from "next";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { getUser } from "@/server/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "Punchcard",
  description: "Digital stamp cards for small businesses: scan a QR code, collect a stamp.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <header className="border-b border-stone-200 bg-white">
          <nav className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3 text-sm">
            <Link href="/" className="mr-auto text-base font-bold">
              ☕ Punchcard
            </Link>
            {user ? (
              <>
                <Link href="/cards">My cards</Link>
                <Link href="/business">My business</Link>
                <SignOutButton />
              </>
            ) : (
              <Link href="/login">Sign in</Link>
            )}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
