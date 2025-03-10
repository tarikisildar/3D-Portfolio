'use client'

import Link from "next/link";
import { useRouter } from "next/navigation";
import ProjectCard from "@/components/ui/ProjectCard";
import projects from "@/data/projects";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  // Filter featured projects
  const featuredProjects = projects.filter((project) => project.featured);

  // Handle project expansion by navigating to the projects page
  const handleProjectExpand = (projectId: number | null) => {
    if (projectId) {
      // Navigate to the projects page with the specific project slug
      const project = projects.find(p => p.id === projectId);
      if (project) {
        router.push(`/projects?project=${project.slug}`);
      }
    }
  };

  return (
    <>
      {/* Intro Section */}
      <section className="px-4 py-16 bg-gradient-to-b from-foreground/5 to-foreground/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
              Hi, I&apos;m Tarik
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full my-6"></div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/10 transform transition-all hover:scale-[1.02] hover:shadow-xl">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🏠</span>
                <h3 className="text-xl font-semibold">My Virtual Room</h3>
              </div>
              <p className="text-foreground/80">
                Welcome to my virtual room! It&apos;s an exact replica of the mancave I lived in for the last 2 years in Munich.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/10 transform transition-all hover:scale-[1.02] hover:shadow-xl">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🧭</span>
                <h3 className="text-xl font-semibold">Take a Tour</h3>
              </div>
              <p className="text-foreground/80">
                Navigate through the tabs above to explore different corners of my space. Each section reveals a new perspective of my digital home.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/10 transform transition-all hover:scale-[1.02] hover:shadow-xl md:col-span-2">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">💻</span>
                <h3 className="text-xl font-semibold">Procrastinate</h3>
              </div>
              <p className="text-foreground/80">
                Feeling unproductive? Hit the <span className="font-mono px-2 py-1 rounded bg-red-500/10 text-red-500 font-semibold">Procrastinate</span> button in the 3D view to see exactly what I do instead of working. You might feel better about your own productivity habits!
              </p>
            </div>
          </div>

          <p className="text-center text-lg italic mt-8 font-light">
            Go ahead—click around, procrastinate a little. I won&apos;t tell your boss.
            <br />
            Disclaimer: There&apos;s only 1(one) rickroll in this website.
          </p>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Featured Projects</h2>
            <p className="text-foreground/70 max-w-3xl mx-auto">
              Here are some of the projects I&apos;ve worked on recently.
              Feel free to explore and check out the details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isExpanded={false}
                onExpand={handleProjectExpand}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/projects"
              className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-full font-medium transition-colors inline-block"
            >
              View All Projects
            </Link>
          </div>
        </div>
      </section>

      {/* About Me Preview */}
      <section className="py-16 px-4 bg-foreground/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl font-bold mb-6">About Me</h2>
              <p className="text-foreground/70 mb-6">
                I&apos;m a Computer Graphics and Robotics specialist with an M.Sc. from the Technical University of Munich, where I&apos;ve focused on real-time rendering, autonomous systems, and AI-powered solutions.
              </p>
              <p className="text-foreground/70 mb-8">
                Over the years, I&apos;ve worked on exciting projects ranging from autonomous vehicle systems to real-time visualization tools, blending technical expertise with creativity to solve complex challenges.
              </p>
              <Link
                href="/about"
                className="border border-primary hover:bg-primary hover:text-white text-primary px-6 py-3 rounded-full font-medium transition-colors inline-block"
              >
                Learn More About Me
              </Link>
            </div>

            <div className="order-1 md:order-2 relative">
              <div className="aspect-square rounded-lg overflow-hidden relative bg-foreground/10">
                {/* Personal photo */}
                <Image
                  src="/images/tarik/me.jpg"
                  alt="Profile photo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
