'use client'

import Link from 'next/link'

export default function Blog() {
  // Placeholder blog posts
  const blogPosts = [
    {
      id: 1,
      title: 'Optimizing Render Performance in OpenGL',
      excerpt: 'Learn how to optimize your rendering pipeline for better performance in real-time graphics applications.',
      date: 'May 15, 2023',
      readTime: '8 min read',
      category: 'Computer Graphics'
    },
    {
      id: 2,
      title: 'Introduction to SLAM for Autonomous Robots',
      excerpt: 'An overview of Simultaneous Localization and Mapping (SLAM) algorithms for autonomous navigation.',
      date: 'April 3, 2023',
      readTime: '10 min read',
      category: 'Robotics'
    },
    {
      id: 3,
      title: 'Building Realistic Physical Materials with PBR',
      excerpt: 'Dive into Physically Based Rendering (PBR) techniques to create realistic materials for 3D assets.',
      date: 'March 22, 2023',
      readTime: '12 min read',
      category: 'Computer Graphics'
    },
    {
      id: 4,
      title: 'Sensor Fusion for Autonomous Vehicles',
      excerpt: 'How to combine data from multiple sensors to create a coherent understanding of the environment.',
      date: 'February 10, 2023',
      readTime: '9 min read',
      category: 'Robotics'
    },
    {
      id: 5,
      title: 'Implementing Ray Tracing on the GPU',
      excerpt: 'A step-by-step guide to implementing real-time ray tracing on modern GPUs.',
      date: 'January 5, 2023',
      readTime: '15 min read',
      category: 'Computer Graphics'
    }
  ]

  return (
    <main className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Heading */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-foreground/70 max-w-3xl mx-auto">
            Thoughts, ideas, and insights on computer graphics, robotics, and beyond.
          </p>
        </div>

        {/* Blog Posts */}
        <div className="space-y-12">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="border-b border-foreground/10 pb-12 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <span className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full mb-2 md:mb-0 inline-block">
                  {post.category}
                </span>
                <div className="text-sm text-foreground/60">
                  {post.date} • {post.readTime}
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-3">
                <Link href={`/blog/${post.id}`} className="hover:text-primary transition-colors">
                  {post.title}
                </Link>
              </h2>

              <p className="text-foreground/70 mb-4">
                {post.excerpt}
              </p>

              <Link
                href={`/blog/${post.id}`}
                className="text-primary hover:text-primary-dark font-medium inline-flex items-center transition-colors"
              >
                Read More
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}