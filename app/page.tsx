"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const HERO_TITLE: string = "Every security point. One registry.";
const HERO_WORDS: string[] = HERO_TITLE.split(" ");

type Feature = {
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    title: "Central registry",
    description:
      "Point name, responsible person, and phone number — every entry in one searchable, always-current list.",
  },
  {
    title: "Quick registration",
    description:
      "Register a new point in seconds with a three-field form and instant duplicate-name protection.",
  },
  {
    title: "Single-account security",
    description:
      "One incharge account, gated by Supabase Auth and row-level security. Login is required to view points and attendance.",
  },
];

export default function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const prefersReducedMotion: boolean = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        return;
      }

      const timeline = gsap.timeline({
        defaults: { ease: "power3.out", duration: 0.6 },
      });

      timeline
        .fromTo(
          ".hero-badge",
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.45 }
        )
        .fromTo(
          ".hero-word",
          { yPercent: 110 },
          { yPercent: 0, duration: 0.75, stagger: 0.07, ease: "power4.out" },
          "-=0.1"
        )
        .fromTo(
          ".hero-subtitle",
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.6 },
          "-=0.35"
        )
        .fromTo(
          ".hero-cta",
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1 },
          "-=0.3"
        )
        .fromTo(
          ".feature-card",
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.1 },
          "-=0.3"
        );
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="flex flex-1 flex-col">
      <section className="container mx-auto flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center sm:py-24">
        <span className="hero-badge inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
          Alaman Security · Point Registry
        </span>

        <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {HERO_WORDS.map((word: string, index: number) => (
            <span
              key={`${word}-${index}`}
              className="inline-block overflow-hidden pb-1 -mb-1"
            >
              <span className="hero-word inline-block will-change-transform">
                {word}&nbsp;
              </span>
            </span>
          ))}
        </h1>

        <p className="hero-subtitle max-w-xl text-base text-muted-foreground sm:text-lg">
          The incharge&apos;s registry for every security point — login is
          required to view registered points and guard attendance.
        </p>

<div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
  <Link href="/login" className="flex w-full sm:w-auto">
    <Button
      size="lg"
      className="hero-cta w-full rounded-full sm:w-auto"
    >
      Incharge Login
    </Button>
  </Link>
  <Link href="/register" className="flex w-full sm:w-auto">
    <Button
      variant="outline"
      size="lg"
      className="hero-cta w-full rounded-full sm:w-auto"
    >
      Register a Point
    </Button>
  </Link>
</div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {FEATURES.map((feature: Feature) => (
            <Card
              key={feature.title}
              className="feature-card rounded-3xl text-left"
            >
              <CardHeader>
                <span className="mb-3 h-1.5 w-8 rounded-full bg-primary" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription className="leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Alaman Security</span>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="rounded-full text-primary hover:underline"
            >
              Incharge Login
            </Link>
            <Link
              href="/register"
              className="rounded-full text-primary hover:underline"
            >
              Register a Point
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}