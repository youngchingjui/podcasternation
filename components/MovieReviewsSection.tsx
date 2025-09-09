"use client";

import { useMemo } from "react";

export type IndividualReview = {
  by: "Greg" | "Michael" | "Ching" | (string & {});
  rating: number; // 0-10
  comment: string;
};

export type MovieReview = {
  id: string;
  title: string;
  year?: number;
  reviews: IndividualReview[];
};

function weightedScore(reviews: IndividualReview[]) {
  const weights = { Greg: 2 } as Record<string, number>;
  let total = 0;
  let denom = 0;
  for (const r of reviews) {
    const w = weights[r.by] ?? 1;
    total += r.rating * w;
    denom += w;
  }
  return denom === 0 ? 0 : Number((total / denom).toFixed(1));
}

export default function MovieReviewsSection() {
  // For now, keep a small, static set we can expand later or fetch from a backend
  const data: MovieReview[] = useMemo(
    () => [
      {
        id: "dune-part-two",
        title: "Dune: Part Two",
        year: 2024,
        reviews: [
          {
            by: "Greg",
            rating: 9.5,
            comment: "Thunderous scale, great pacing. The sandworms are the moment.",
          },
          {
            by: "Michael",
            rating: 8.5,
            comment: "Denis really went for it. Could have used two more scenes with Stilgar.",
          },
          {
            by: "Ching",
            rating: 8,
            comment: "Audio mix in theater was intense; visually stunning throughout.",
          },
        ],
      },
      {
        id: "the-bear-movie",
        title: "The Bear (Movie Night Mix)",
        year: 2023,
        reviews: [
          {
            by: "Greg",
            rating: 8.8,
            comment: "Good heat, clean sear, impeccable vibes. Yes, chef.",
          },
          {
            by: "Michael",
            rating: 8.2,
            comment: "Loved the momentum and kitchen anxiety.",
          },
          {
            by: "Ching",
            rating: 7.9,
            comment: "Made me hungry halfway through. Strong ensemble work.",
          },
        ],
      },
      {
        id: "spiderverse",
        title: "Spider‑Verse: Across the Multiverse",
        year: 2023,
        reviews: [
          { by: "Greg", rating: 9.2, comment: "Frames you can live in. Art direction goes crazy." },
          { by: "Michael", rating: 8.7, comment: "Bold storytelling, gorgeous animation." },
          { by: "Ching", rating: 8.4, comment: "Inventive and heartfelt. Great soundtrack." },
        ],
      },
    ],
    []
  );

  return (
    <section id="movies" className="flex flex-col gap-6">
      <h2 className="text-3xl font-semibold">Movie Reviews</h2>
      <p className="text-slate-600 dark:text-slate-300">
        Our thoughts on movies we watched together. Group scores give extra weight to Greg&apos;s
        opinion.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((movie) => {
          const score = weightedScore(movie.reviews);
          const sorted = [...movie.reviews].sort((a, b) => (a.by === "Greg" ? -1 : b.by === "Greg" ? 1 : 0));
          return (
            <article
              key={movie.id}
              className="rounded-lg border border-slate-200 dark:border-slate-800 p-5 bg-white/60 dark:bg-black/20 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {movie.title} {movie.year ? <span className="text-slate-500">({movie.year})</span> : null}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-slate-500">Group</span>
                  <span className="text-lg font-semibold" aria-label="group score">
                    {score}
                  </span>
                </div>
              </div>
              <ul className="flex flex-col gap-2">
                {sorted.map((r, i) => (
                  <li key={i} className="text-sm leading-snug">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs " +
                          (r.by === "Greg"
                            ? "border-amber-400 text-amber-700 dark:text-amber-300"
                            : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300")
                        }
                        aria-label={`reviewer ${r.by}`}
                        title={r.by === "Greg" ? "Greg counts double in the group score" : undefined}
                      >
                        {r.by}
                      </span>
                      <span className="text-slate-500">{r.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">{r.comment}</p>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}

