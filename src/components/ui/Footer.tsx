'use client'

import { useChapter } from '@/components/three/ChapterContext'
import { professional } from '@/data/links'

/**
 * A colophon, not a second navigation.
 *
 * The old footer repeated the sitemap the bottom rail already shows, under a
 * "Human." tagline and a "Built with ❤️" line, which is the part of a page
 * most likely to read as a template. What is left is what a footer is for:
 * whose this is, how to reach them, and credit for the models the rooms are
 * built from.
 */

const MODEL_CREDITS = [
  'Boombox by Poly by Google [CC-BY] via Poly Pizza',
  'Blackboard by Poly by Google [CC-BY] via Poly Pizza',
  'Air Fryer by Zsky [CC-BY] via Poly Pizza',
  'Coffee Machine by J-Toastie [CC-BY] via Poly Pizza',
  'Furniture Set by Kenney',
  'Graphics card by pgonarg [CC-BY] via Poly Pizza',
  'Gaming Computer by Alex Safayan [CC-BY] via Poly Pizza',
  'Radiator by Poly by Google [CC-BY] via Poly Pizza',
  'Round Table by CMHT Oculus [CC-BY] via Poly Pizza',
]

export default function Footer() {
  const { chapter } = useChapter()
  const [from, to] = chapter.period

  return (
    <footer className="border-t border-[var(--ink)]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="text-[0.9375rem]">
            <span style={{ fontVariationSettings: '"wdth" 112, "wght" 650' }}>Tarik Isildar</span>
            <span className="text-[var(--ink-soft)]">
              {' '}&middot; {chapter.city}, <span className="u-figures">{from}&ndash;{to ?? 'now'}</span>
            </span>
          </p>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem]">
            {professional.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="border-b border-transparent pb-px transition-colors hover:border-[var(--live)] hover:text-[var(--live)]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3 text-[0.8125rem] text-[var(--ink-soft)] sm:flex-row sm:items-start sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Tarik Isildar. Rooms modelled in Blender, rendered with Three.js.</p>

          <details className="group sm:max-w-md sm:text-right">
            <summary className="cursor-pointer list-none transition-colors hover:text-[var(--ink)] [&::-webkit-details-marker]:hidden">
              3D model credits
              <span aria-hidden className="ml-1 inline-block transition-transform group-open:rotate-90">
                &rsaquo;
              </span>
            </summary>
            <ul className="mt-3 space-y-1 text-left">
              {MODEL_CREDITS.map((credit) => (
                <li key={credit}>{credit}</li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </footer>
  )
}
