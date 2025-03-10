'use client'

import Link from 'next/link'

import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import ThreeHeader from '@/components/three/ThreeHeader'
import NotFoundHeader from '@/components/three/NotFoundHeader'

export default function NotFound() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header />

      {/* 3D Header Section */}
      <ThreeHeader height="50vh" showControls={true}>
        <NotFoundHeader />
      </ThreeHeader>

      {/* 404 Content */}
      <main className="py-20 px-4 flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Oops! This page doesn&apos;t exist</h2>
          <p className="text-xl text-foreground/70 mb-10">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/"
              className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-full font-medium transition-colors inline-block"
            >
              Back to Home
            </Link>
            <Link
              href="/projects"
              className="border border-foreground/20 hover:border-primary text-foreground hover:text-primary px-6 py-3 rounded-full font-medium transition-colors inline-block"
            >
              View Projects
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}