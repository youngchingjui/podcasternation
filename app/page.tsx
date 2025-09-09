"use client";

import Link from "next/link";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="#home" className="font-semibold">
            Greg, Michael &amp; Ching
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm">
            <a href="#podcasts" className="hover:underline">
              Podcasts
            </a>
            <a href="#burgers" className="hover:underline">
              Burgers
            </a>
            <a href="#more" className="hover:underline">
              ...and more
            </a>
          </nav>
          <SignOutButton />
        </div>
      </header>

      <main id="home" className="mx-auto max-w-6xl px-4 py-12 sm:py-16 flex flex-col gap-16">
        {/* Hero */}
        <section className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-12">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl sm:text-5xl font-bold">
              Three friends. One website.
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              We&apos;re Greg, Michael, and Ching — recording podcasts, eating
              great burgers, and having fun building things together.
            </p>
            <div className="flex gap-3">
              <a href="#podcasts" className="bg-foreground text-background px-4 py-2 rounded-md text-sm">
                Explore Podcasts
              </a>
              <a href="#burgers" className="border border-slate-300 dark:border-slate-700 px-4 py-2 rounded-md text-sm">
                See Burger Collage
              </a>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Hero image is a placeholder for now — replace /public/hero-placeholder.svg with your photo later.
            </p>
          </div>
          <div className="w-full">
            <img
              src="/hero-placeholder.svg"
              alt="Placeholder hero of Greg, Michael & Ching"
              className="w-full h-72 sm:h-96 object-cover rounded-xl shadow"
            />
          </div>
        </section>

        {/* Podcasts */}
        <section id="podcasts" className="flex flex-col gap-6">
          <h2 className="text-3xl font-semibold">Our Podcasts</h2>
          <p className="text-slate-600 dark:text-slate-300">
            A few of the conversations we&apos;ve recorded together.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Episode 1 — How We Met",
                desc: "Origin stories, early projects, and what keeps us collaborating.",
              },
              {
                title: "Episode 2 — Burger Philosophy",
                desc: "From smash to stacked — the debates that shaped our tastings.",
              },
              {
                title: "Episode 3 — Building in Public",
                desc: "Sharing work, lessons learned, and the joy of shipping.",
              },
            ].map((p, i) => (
              <article
                key={i}
                className="rounded-lg border border-slate-200 dark:border-slate-800 p-5 bg-white/60 dark:bg-black/20"
              >
                <h3 className="font-medium">{p.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {p.desc}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <button className="text-sm px-3 py-1.5 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                    Listen
                  </button>
                  <button className="text-sm px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700">
                    Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Burgers collage */}
        <section id="burgers" className="flex flex-col gap-6">
          <h2 className="text-3xl font-semibold">Burger Collage</h2>
          <p className="text-slate-600 dark:text-slate-300">
            A tasty grid of our burger outings. Replace placeholders with your photos.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] overflow-hidden rounded-md">
                <img
                  src="/burger-placeholder.svg"
                  alt={`Burger ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>

        {/* And more */}
        <section id="more" className="flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-2xl font-semibold">...and more</h2>
          <p className="text-slate-600 dark:text-slate-300">
            This site is just getting started. Want to add photo galleries, episode pages,
            maps of burger spots, or anything else? Let&apos;s build it together.
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Open an issue with ideas or a pull request with improvements. We&apos;re excited to collaborate!
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-sm text-slate-600 dark:text-slate-400">
        © {new Date().getFullYear()} Greg · Michael · Ching
      </footer>
    </>
  );
}

function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  if (!isAuthenticated) return null;
  return (
    <button
      className="bg-slate-200 dark:bg-slate-800 text-foreground rounded-md px-2 py-1 text-sm"
      onClick={() =>
        void signOut().then(() => {
          router.push("/signin");
        })
      }
    >
      Sign out
    </button>
  );
}

