'use client'

import Link from "next/link";
import { useRouter } from "next/navigation";
import ProjectCard from "@/components/ui/ProjectCard";
import projects from "@/data/projects";
import Image from "next/image";
import { useProcrastinate } from '@/components/three/ProcrastinateContext';
import { useChapter } from '@/components/three/ChapterContext';

export default function Home() {
  const router = useRouter();
  const { start: startProcrastinating } = useProcrastinate();
  // Landing copy is per chapter: the greeting, the description of *this* room,
  // and the About teaser all belong to the era you are standing in.
  const { chapter } = useChapter();
  const home = chapter.content.home;
  const [from, to] = chapter.period;

  const featuredProjects = projects.filter((project) => project.featured);

  const handleProjectExpand = (projectId: number | null) => {
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        router.push(`/projects?project=${project.slug}`);
      }
    }
  };

  const triggerProcrastinate = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    startProcrastinating('card_click', 'homepage');
  };

  return (
    <>
      {/* The room has had the whole screen above this, so the page does not
          greet you a second time — it tells you where you have been standing. */}
      <section className="border-b border-[var(--rule-soft)]">
        <div className="mx-auto max-w-6xl px-6 pb-14 pt-8 sm:pb-20 sm:pt-10">
          <div className="grid gap-8 md:grid-cols-[1fr_minmax(0,20rem)] md:items-end">
            <div>
              <h1 className="u-display text-[clamp(2.25rem,6vw,4rem)]">
                {home.greeting}
              </h1>
              <p className="u-lede mt-4 text-[1.0625rem] text-[var(--ink-soft)]">
                {home.roomBlurb}
              </p>
            </div>

            {/* A caption to the viewport above, rather than a card competing
                with it. The "getting around" line is the one piece of
                instruction left, and it points at controls that are now
                visible instead of describing invisible ones. */}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[var(--rule-soft)] pt-6 md:border-t-0 md:pt-0">
              <div>
                <dt className="text-[0.8125rem] text-[var(--ink-soft)]">Place</dt>
                <dd
                  className="mt-1 text-[1.0625rem]"
                  style={{ fontVariationSettings: '"wdth" 106, "wght" 600' }}
                >
                  {chapter.city}
                </dd>
              </div>
              <div>
                <dt className="text-[0.8125rem] text-[var(--ink-soft)]">Years</dt>
                <dd className="u-figures mt-1 text-[1.0625rem]">
                  {from}&ndash;{to ?? 'now'}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[0.8125rem] text-[var(--ink-soft)]">
                  Getting around
                </dt>
                <dd className="mt-1 text-[0.9375rem] leading-relaxed">
                  Click the marked objects in the room, or use the bar along the
                  bottom. The years up top take you somewhere I lived earlier.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--rule-soft)]">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
            <h2
              className="text-[clamp(1.5rem,3vw,2rem)]"
              style={{ fontVariationSettings: '"wdth" 112, "wght" 600' }}
            >
              Selected work
            </h2>
            <Link
              href="/projects"
              className="text-[0.9375rem] text-[var(--ink-soft)] underline-offset-4 transition-colors hover:text-[var(--ink)] hover:underline"
            >
              All {projects.length} projects
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isExpanded={false}
                onExpand={handleProjectExpand}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--rule-soft)]">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:py-20 md:grid-cols-2 md:items-center">
          <div className="order-2 md:order-1">
            <h2
              className="text-[clamp(1.5rem,3vw,2rem)]"
              style={{ fontVariationSettings: '"wdth" 112, "wght" 600' }}
            >
              About me
            </h2>
            {home.aboutPreview.map((paragraph, i) => (
              <p
                key={i}
                className="u-lede mt-5 text-[1.0625rem] text-[var(--ink-soft)]"
              >
                {paragraph}
              </p>
            ))}
            <Link
              href="/about"
              className="mt-8 inline-block border-b-2 border-[var(--live)] pb-1 text-[0.9375rem] transition-colors hover:text-[var(--live)]"
              style={{ fontVariationSettings: '"wdth" 102, "wght" 550' }}
            >
              More about me
            </Link>
          </div>

          <div className="order-1 md:order-2">
            <div className="relative aspect-[4/5] overflow-hidden bg-[var(--plaster-deep)]">
              <Image
                src={home.photo}
                alt="Tarik Isildar"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* The one joke on the page, as an aside rather than a third identical
          card competing with the real content. */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="u-lede text-[1.0625rem] text-[var(--ink-soft)]">
            Feeling unproductive?{' '}
            <button
              onClick={triggerProcrastinate}
              className="border-b-2 border-[var(--live)] pb-0.5 text-[var(--ink)] transition-colors hover:text-[var(--live)] focus:outline-none focus-visible:text-[var(--live)]"
              style={{ fontVariationSettings: '"wdth" 102, "wght" 550' }}
            >
              Put something on the screen
            </button>{' '}
            and see what I do instead of working. There is exactly one rickroll
            on this website.
          </p>
        </div>
      </section>
    </>
  );
}
