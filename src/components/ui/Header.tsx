'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useChapter } from '@/components/three/ChapterContext'
import { DEFAULT_CHAPTER_ID } from '@/data/chapters'
import type { PageType } from '@/components/three/shots'

/** Every section the site knows about, in nav order. */
const SECTIONS: { section: PageType; name: string; href: string }[] = [
  { section: 'home', name: 'Home', href: '/' },
  { section: 'about', name: 'About', href: '/about' },
  { section: 'projects', name: 'Projects', href: '/projects' },
  { section: 'cv', name: 'CV', href: '/cv' },
  { section: 'blog', name: 'Blog', href: '/blog' },
]

export default function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { chapter } = useChapter()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // Only the sections this chapter actually offers.
  const navigation = SECTIONS.filter((s) => chapter.sections.includes(s.section))
    // Carry the era through navigation. Chapter lives in client state, so the
    // content would stay correct without this — but the URL would quietly drop
    // ?era= on the first link click, and a refresh would then snap you back to
    // the default chapter.
    .map((s) => ({
      ...s,
      href: chapter.id === DEFAULT_CHAPTER_ID ? s.href : `${s.href}?era=${chapter.id}`,
    }))

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-foreground/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="font-bold text-xl text-foreground">
              Tarik Isildar
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`py-2 text-sm font-medium transition-colors ${
                  pathname === item.href.split('?')[0]
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-foreground/80 hover:text-primary'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground/80 hover:text-primary focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background/95 backdrop-blur-md">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.href.split('?')[0]
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground/80 hover:text-primary'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}