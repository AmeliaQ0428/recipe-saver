import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/SearchBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Recipe Saver",
  description: "Discover, browse, and save recipes from around the world.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-10 border-b border-amber-100 bg-amber-50/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-6">
              <Link href="/" className="font-display text-xl font-bold text-amber-800">
                Recipe Saver
              </Link>
              <nav className="flex items-center gap-4 text-sm font-medium text-stone-700">
                <Link href="/" className="hover:text-amber-700">
                  Home
                </Link>
                <Link href="/search" className="hover:text-amber-700">
                  Browse
                </Link>
                {user ? (
                  <Link href="/cookbook" className="hover:text-amber-700">
                    My Cookbook
                  </Link>
                ) : null}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <SearchBar className="hidden w-56 sm:flex" />
              {user ? (
                <form action="/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="text-sm font-medium text-stone-600 hover:text-amber-700"
                  >
                    Log out
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-3 text-sm font-medium">
                  <Link href="/login" className="text-stone-600 hover:text-amber-700">
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-full bg-amber-600 px-3 py-1.5 text-white transition hover:bg-amber-700"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
