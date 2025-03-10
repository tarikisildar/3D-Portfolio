'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

export default function Hero() {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollY = window.scrollY
        scrollRef.current.style.transform = `translateY(${scrollY * 0.5}px)`
        scrollRef.current.style.opacity = `${1 - scrollY * 0.002}`
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Parallax scrolling effect */}
      <div
        ref={scrollRef}
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6">
          <span className="block">Hello, I&apos;m</span>
          <span className="block text-primary mt-2">Tarik Isildar</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-foreground/80 mb-10">
          Computer Graphics and Robotics specialist with a passion for real-time rendering,
          autonomous systems, and AI-powered solutions.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            href="/projects"
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-full font-medium transition-colors"
          >
            View My Work
          </Link>
          <Link
            href="/about"
            className="border border-foreground/20 hover:border-primary text-foreground hover:text-primary px-6 py-3 rounded-full font-medium transition-colors"
          >
            About Me
          </Link>
        </div>

        <div className="mt-16 p-4 max-w-2xl mx-auto bg-foreground/5 backdrop-blur-sm rounded-lg">
          <p className="text-foreground/80 italic">
            &ldquo;When I&apos;m not immersed in algorithms or optimizing GPU performance, you&apos;ll find me enjoying photography with a retro aesthetic, exploring music from vinyl records to cassettes, hunting for the perfect coffee brew, or benching. I bench 100 kilos suiii. &rdquo;
          </p>
        </div>

        <div className="mt-12 animate-bounce">
          <svg
            className="w-6 h-6 text-foreground/70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}