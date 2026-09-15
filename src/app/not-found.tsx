import Link from 'next/link'

// Header, the 3D scene and Footer all come from SiteWrapper in app/layout.tsx,
// which wraps this page too. Scene3D already resolves any unrecognised path to
// the 'notFound' camera shot, so this file only supplies the copy.
export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto text-center py-20 px-4">
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
  )
}