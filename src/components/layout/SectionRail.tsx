'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useChapter } from '@/components/three/ChapterContext'
import { DEFAULT_CHAPTER_ID } from '@/data/chapters'
import type { PageType } from '@/components/three/shots'

/**
 * The sections of the site, docked to the bottom edge of the viewport.
 *
 * This replaces a hamburger menu. The old design hid all five sections behind
 * an icon on mobile, which meant a first-time visitor saw a picture and some
 * cards with no visible way in — the single biggest reason people did not know
 * what to do here.
 *
 * It sits at the bottom on purpose, and on every screen size:
 *
 *  - Each section is a camera angle in the room directly above it. Putting the
 *    control against the thing it moves is what makes that legible without a
 *    paragraph explaining it.
 *  - On a phone it lands under the thumb rather than in the far top corner.
 *
 * The active item is marked with the one hot colour in the palette, so "you are
 * here" reads at a glance against otherwise quiet chrome.
 */

const SECTIONS: { section: PageType; label: string; href: string }[] = [
  { section: 'home', label: 'Home', href: '/' },
  { section: 'about', label: 'About', href: '/about' },
  { section: 'projects', label: 'Projects', href: '/projects' },
  { section: 'cv', label: 'CV', href: '/cv' },
  { section: 'blog', label: 'Blog', href: '/blog' },
]

export function SectionRail() {
  const pathname = usePathname()
  const { chapter } = useChapter()

  const items = SECTIONS.filter((s) => chapter.sections.includes(s.section)).map(
    (s) => ({
      ...s,
      // Carry the era through navigation, or the URL quietly drops it and a
      // refresh snaps you back to the default chapter.
      href:
        chapter.id === DEFAULT_CHAPTER_ID ? s.href : `${s.href}?era=${chapter.id}`,
    })
  )

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--rule-soft)]
                 bg-[var(--veil-strong)] backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-5xl items-stretch">
        {items.map((item) => {
          const active = pathname === item.href.split('?')[0]
          return (
            <li key={item.section} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className="group relative flex h-[var(--rail-h)] items-center justify-center
                           px-2 text-[0.9375rem] transition-colors
                           focus:outline-none focus-visible:bg-[var(--plaster-lift)]"
                style={{
                  fontVariationSettings: active
                    ? '"wdth" 104, "wght" 600'
                    : '"wdth" 100, "wght" 450',
                  color: active ? 'var(--ink)' : 'var(--ink-soft)',
                }}
              >
                {item.label}
                {/* The marker, not a underline-on-hover flourish: it only ever
                    indicates the section you are looking at. */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[2px] transition-opacity"
                  style={{
                    background: 'var(--live)',
                    opacity: active ? 1 : 0,
                  }}
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
