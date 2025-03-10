'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import ProjectCard from '@/components/ui/ProjectCard'
import projects from '@/data/projects'

export default function Projects() {
  const searchParams = useSearchParams()
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Game' | 'Software'>('All')
  const [underlineStyle, setUnderlineStyle] = useState({
    width: '0px',
    transform: 'translateX(0px)',
  })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null)

  const allTabRef = useRef<HTMLButtonElement>(null)
  const softwareTabRef = useRef<HTMLButtonElement>(null)
  const gameTabRef = useRef<HTMLButtonElement>(null)

  // Check URL parameters for specific project to open
  useEffect(() => {
    const projectSlug = searchParams.get('project')
    if (projectSlug) {
      const projectToOpen = projects.find(p => p.slug === projectSlug)
      if (projectToOpen) {
        // Set the category based on the project's category
        setSelectedCategory(projectToOpen.category as 'All' | 'Game' | 'Software')

        // After a small delay to ensure category change is processed
        setTimeout(() => {
          setExpandedProjectId(projectToOpen.id)
        }, 300)
      }
    }
  }, [searchParams])

  // Get projects for the current category
  const categoryProjects = useMemo(() => {
    if (selectedCategory === 'All') {
      return projects;
    }
    return projects.filter(project => project.category === selectedCategory);
  }, [selectedCategory]);

  // Get all unique tags from the current category's projects
  const categoryTags = useMemo(() => {
    return Array.from(
      new Set(categoryProjects.flatMap((project) => project.tags))
    ).sort();
  }, [categoryProjects]);

  // When category changes, reset the selected tag if it doesn't exist in the new category
  useEffect(() => {
    if (selectedTag && !categoryTags.includes(selectedTag)) {
      setSelectedTag('');
    }
    // Also collapse any expanded project when switching categories
    setExpandedProjectId(null);
  }, [selectedCategory, categoryTags, selectedTag]);

  // Filter projects based on selected tag and category
  const filteredProjects = useMemo(() => {
    return categoryProjects.filter(project => {
      return selectedTag ? project.tags.includes(selectedTag) : true;
    });
  }, [categoryProjects, selectedTag]);

  // Update underline position when category changes
  useEffect(() => {
    const updateUnderlinePosition = () => {
      let currentTab;
      if (selectedCategory === 'All') {
        currentTab = allTabRef.current;
      } else if (selectedCategory === 'Software') {
        currentTab = softwareTabRef.current;
      } else {
        currentTab = gameTabRef.current;
      }

      if (currentTab) {
        // Set the width and position of the underline based on the selected tab
        setUnderlineStyle({
          width: `${currentTab.offsetWidth}px`,
          transform: `translateX(${currentTab.offsetLeft}px)`,
        });
      }
    };

    // Call immediately and add a small delay for safety
    updateUnderlinePosition();
    const timeout = setTimeout(updateUnderlinePosition, 50);

    // Add window resize handler to ensure correct positioning on resize
    window.addEventListener('resize', updateUnderlinePosition);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateUnderlinePosition);
    };
  }, [selectedCategory]);

  // Handle category change with smooth transition
  const handleCategoryChange = (category: 'All' | 'Game' | 'Software') => {
    if (category === selectedCategory) return;

    // Start transition
    setIsTransitioning(true);

    // After a short delay, change the category
    setTimeout(() => {
      setSelectedCategory(category);

      // After category changes, wait for render then end transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 250);
  };

  // Handle project expansion
  const handleProjectExpand = (projectId: number | null) => {
    setExpandedProjectId(projectId);
  };

  const tabContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '3rem',
    position: 'relative' as const,
  };

  const tabButtonStyle = {
    padding: '12px 32px',
    fontSize: '18px',
    fontWeight: '500' as const,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    position: 'relative' as const,
    color: 'rgba(0, 0, 0, 0.6)',
    transition: 'color 0.3s ease',
  };

  const activeTabButtonStyle = {
    ...tabButtonStyle,
    color: '#3b82f6', // primary blue color
  };

  const animatedUnderlineStyle = {
    position: 'absolute' as const,
    bottom: '0px',
    left: '0',
    height: '3px',
    backgroundColor: '#3b82f6',
    transition: 'all 0.3s ease-in-out',
    ...underlineStyle,
  };

  return (
    <main className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Heading */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">My Projects</h1>
          <p className="text-foreground/70 max-w-3xl mx-auto">
            Explore all of my projects below. You can filter by technology to find specific projects.
          </p>
        </div>

        {/* Tabs with Animated Underline */}
        <div style={tabContainerStyle}>
          <button
            ref={allTabRef}
            onClick={() => handleCategoryChange('All')}
            style={selectedCategory === 'All' ? activeTabButtonStyle : tabButtonStyle}
          >
            All
          </button>

          <button
            ref={softwareTabRef}
            onClick={() => handleCategoryChange('Software')}
            style={selectedCategory === 'Software' ? activeTabButtonStyle : tabButtonStyle}
          >
            Software
          </button>

          <button
            ref={gameTabRef}
            onClick={() => handleCategoryChange('Game')}
            style={selectedCategory === 'Game' ? activeTabButtonStyle : tabButtonStyle}
          >
            Games
          </button>

          {/* Single animated underline */}
          <div style={animatedUnderlineStyle}></div>
        </div>

        {/* Dynamic Filter Tags with transition effect */}
        <div className={`filter-container transition-opacity duration-300 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
             style={{ minHeight: '60px' }}>
          {categoryTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-12 transition-all duration-300 ease-in-out">
              <button
                onClick={() => setSelectedTag('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === ''
                    ? 'bg-primary text-foreground shadow-md border-2 border-primary'
                    : 'bg-foreground/5 hover:bg-foreground/10 text-foreground/70'
                }`}
              >
                All
              </button>

              {categoryTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-primary text-foreground shadow-md border-2 border-primary'
                      : 'bg-foreground/5 hover:bg-foreground/10 text-foreground/70'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Projects Grid with transition effect */}
        <div className={`transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onExpand={handleProjectExpand}
                isExpanded={expandedProjectId === project.id}
              />
            ))}
          </div>

          {/* No Results Message */}
          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">No projects found</h3>
              <p className="text-foreground/70">
                No projects match the selected filter. Please try a different filter or category.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}