'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Project, DetailedContent } from '@/data/projects'

// Extract Google Drive file ID from URL
const extractGoogleDriveFileId = (url: string): string | null => {
  const match = url.match(/(?:drive\.google\.com\/file\/d\/|id=|open\?id=)([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

// Custom hook to detect if screen is mobile sized
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initial check
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set on mount
    checkIfMobile();

    // Add resize listener
    window.addEventListener('resize', checkIfMobile);

    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return isMobile;
};

interface ProjectCardProps {
  project: Project
  isExpanded: boolean
  onExpand: (projectId: number | null) => void
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isExpanded,
  onExpand,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const cardImageRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Track the card position for animation
  useEffect(() => {
    if (cardImageRef.current) {
      // We're using this to ensure the ref is attached properly
    }
  }, []);

  const handleCardClick = () => {
    if (!isExpanded) {
      onExpand(project.id);
    } else {
      handleCloseClick({ stopPropagation: () => {} } as React.MouseEvent);
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering handleCardClick
    setIsClosing(true);
    // Add a delay before actually closing to allow animation to complete
    setTimeout(() => {
      onExpand(null);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  const isGoogleDriveUrl = (url: string): boolean => {
    return url.includes('drive.google.com');
  };

  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    try {
      // Parse the URL to handle all parameters properly
      const urlObj = new URL(url);
      let videoId = '';
      let startTime = '';

      // Handle youtu.be format
      if (url.includes('youtu.be')) {
        const pathParts = urlObj.pathname.split('/');
        videoId = pathParts[pathParts.length - 1];
      }
      // Handle youtube.com format
      else if (url.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v') || '';
      }

      // Check for timestamp parameters
      if (urlObj.searchParams.has('t')) {
        startTime = urlObj.searchParams.get('t') || '';
      } else if (urlObj.searchParams.has('start')) {
        startTime = urlObj.searchParams.get('start') || '';
      }

      // Build the embed URL
      let embedUrl = `https://www.youtube.com/embed/${videoId}`;

      // Add timestamp if present - convert to seconds if needed
      if (startTime) {
        // Handle time formats like '1m30s'
        if (startTime.includes('m') || startTime.includes('h') || startTime.includes('s')) {
          let seconds = 0;

          // Extract hours if present
          if (startTime.includes('h')) {
            const hours = parseInt(startTime.split('h')[0]);
            seconds += hours * 3600;
            startTime = startTime.split('h')[1];
          }

          // Extract minutes if present
          if (startTime.includes('m')) {
            const minutes = parseInt(startTime.split('m')[0]);
            seconds += minutes * 60;
            startTime = startTime.split('m')[1];
          }

          // Extract seconds if present
          if (startTime.includes('s')) {
            const secs = parseInt(startTime.split('s')[0]);
            seconds += secs;
          }

          startTime = seconds.toString();
        }

        embedUrl += `?start=${startTime}`;
      }

      return embedUrl;
    } catch (error) {
      console.error('Error parsing YouTube URL:', error);
      return url; // Return original URL if parsing fails
    }
  };

  const renderContentByType = (content: DetailedContent) => {
    switch (content.type) {
      case 'text':
        return (
          <div className="prose prose-slate dark:prose-invert max-w-none mb-4">
            {content.content.split('\n\n').map((paragraph, index) => (
              <p key={index}>
                {paragraph.split('\n').map((line, lineIndex, lineArray) => (
                  <React.Fragment key={lineIndex}>
                    {line}
                    {lineIndex < lineArray.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            ))}
          </div>
        )
      case 'video':
        if (isYouTubeUrl(content.content)) {
          const embedUrl = getYouTubeEmbedUrl(content.content);
          const containerStyle: React.CSSProperties = isMobile
            ? { width: '100%' }
            : content.scalePercent
              ? { width: `${content.scalePercent}%`, margin: '0 auto' }
              : { width: '100%' };

          return (
            <div style={containerStyle} className="mb-4">
              <iframe
                className="w-full aspect-video rounded-lg"
                src={embedUrl}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          );
        }

        // Handle Google Drive videos
        if (isGoogleDriveUrl(content.content)) {
          const fileId = extractGoogleDriveFileId(content.content);
          if (fileId) {
            const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

            // Calculate container style based on mobile status
            const containerStyle: React.CSSProperties = isMobile
              ? { width: '100%' }
              : content.scalePercent
                ? { width: `${content.scalePercent}%`, margin: '0 auto' }
                : { width: '100%' };

            return (
              <div style={containerStyle} className="mb-4">
                <iframe
                  className="w-full aspect-video rounded-lg"
                  src={embedUrl}
                  title="Google Drive video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            );
          }
        }

        // Default video embed
        // Calculate container style based on mobile status
        const videoContainerStyle: React.CSSProperties = isMobile
          ? { width: '100%' }
          : content.scalePercent
            ? { width: `${content.scalePercent}%`, margin: '0 auto' }
            : { width: '100%' };

        return (
          <div style={videoContainerStyle} className="mb-4">
            <iframe
              className="w-full aspect-video rounded-lg"
              src={content.content}
              title="Video content"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )
      case 'image':
        // Calculate container style based on mobile status
        const imageContainerStyle: React.CSSProperties = isMobile
          ? { width: '100%' }
          : {width:'100%' }
        // Create a style object for the image container with the aspect ratio
        const imageStyle: React.CSSProperties = {
          position: 'relative',
          width: '100%',
          aspectRatio: content.aspectRatio || '16/9'
        };

        return (
          <div style={imageContainerStyle} className="mb-4">
            <div style={imageStyle} className="relative w-full">
              <Image
                src={content.content}
                alt={content.caption || 'Project image'}
                fill
                className="object-contain rounded-lg"
              />

            </div>
          </div>
        )
      case 'pdf':
        // Check if it's a Google Drive link
        if (isGoogleDriveUrl(content.content)) {
          const fileId = extractGoogleDriveFileId(content.content);
          if (fileId) {
            const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

            // Calculate container style based on mobile status
            const pdfContainerStyle: React.CSSProperties = isMobile
              ? { width: '100%' }
              : content.scalePercent
                ? { width: `${content.scalePercent}%`, margin: '0 auto' }
                : { width: '100%' };

            return (
              <div style={pdfContainerStyle} className="mb-4">
                <iframe
                  src={embedUrl}
                  className="w-full h-[500px] rounded-lg"
                  title={content.caption || 'PDF document'}
                ></iframe>
                {content.caption && (
                  <p className="text-sm text-foreground/60 text-center mt-2">{content.caption}</p>
                )}
              </div>
            )
          }
        }

        // Calculate container style based on mobile status
        const defaultPdfContainerStyle: React.CSSProperties = isMobile
          ? { width: '100%' }
          : content.scalePercent
            ? { width: `${content.scalePercent}%`, margin: '0 auto' }
            : { width: '100%' };

        return (
          <div style={defaultPdfContainerStyle} className="mb-4">
            <embed
              src={content.content}
              type="application/pdf"
              className="w-full h-[500px] rounded-lg"
            />
            {content.caption && (
              <p className="text-sm text-foreground/60 text-center mt-2">{content.caption}</p>
            )}
          </div>
        )
      case 'web':
        // Calculate container style based on mobile status
        const webContainerStyle: React.CSSProperties = isMobile
          ? { width: '100%' }
          : content.scalePercent
            ? { width: `${content.scalePercent}%`, margin: '0 auto' }
            : { width: '100%' };

        return (
          <div style={webContainerStyle} className="mb-4">
            <iframe
              className="w-full h-[500px] rounded-lg"
              src={content.content}
              title="Web content"
              sandbox="allow-same-origin allow-scripts"
            ></iframe>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={`${isExpanded ? 'expanded-project-container col-span-full' : ''}`}>
      <div
        className={`flex flex-col md:flex-row items-start gap-6 w-full ${
          isExpanded ? 'justify-start' : ''
        }`}
      >
        {/* Main card that maintains 300px width when expanded */}
        <div
          className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
            isExpanded ? 'project-card-expanded' : 'hover:shadow-lg hover:translate-y-[-4px]'
          } ${isClosing ? 'project-card-closing' : ''} cursor-pointer`}
          style={{
            width: isExpanded ? '300px' : '100%',
            maxWidth: '100%',
            flexShrink: 0,
            transition: isExpanded ? 'height 0.3s ease-in-out' : 'transform 0.2s ease, box-shadow 0.2s ease, height 0.3s ease-in-out',
            height: isExpanded ? 'auto' : '430px', // Adjusted height to ensure content fits
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={handleCardClick}
        >
          <div className="flex flex-col h-full">
            {/* Image container - ONLY render when not expanded */}
            {!isExpanded && (
              <div
                ref={cardImageRef}
                className="relative w-full h-48"
      style={{
                  flexShrink: 0,
      }}
    >
          <Image
                  src={project.imageUrl}
                  alt={project.title}
                  fill
                  className="object-cover"
                />
                {/* Expand icon in the corner of image */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white p-1.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                  </svg>
                </div>
              </div>
            )}

            {/* Content area - fills entire card when expanded */}
            <div
              className="p-4 flex flex-col h-full"
              style={{
                height: isExpanded ? '100%' : 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              {/* Top content: title and description */}
              <div>
                <h3 className="font-bold text-xl mb-2">{project.title}</h3>

                {/* Description with max-height and fade */}
                <div className="relative mb-4">
                  <p
                    className={`text-gray-600 dark:text-gray-300 ${isExpanded ? '' : 'line-clamp-3'}`}
                  >
                    {project.description}
                  </p>

                  {/* Gradient overlay for non-expanded cards */}

                </div>
              </div>

              {/* Bottom content: tags and button - this is separate from the top content */}
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {project.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* View details button for non-expanded state */}
                {!isExpanded && (
                  <button
                    className="mt-2 text-primary font-medium flex items-center gap-1 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick();
                    }}
                  >
                    View Details
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>
                )}
              </div>

              {isExpanded && (
                <button
                  onClick={handleCloseClick}
                  className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {/* Simple X icon, no dependencies */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded image that appears to pop out from the card */}
        {isExpanded && (
          <div
            className={`expanded-image-container rounded-lg overflow-hidden shadow-xl ${
              isClosing ? 'closing' : ''
            }`}
            style={{
              flex: 1,
              position: 'relative',
              aspectRatio: '4/3',
              maxHeight: '405px',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              zIndex: 10,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            }}
          >
            <Image
              src={project.imageUrl}
              alt={project.title}
              fill
              className="object-contain rounded-lg"
              priority={isExpanded}
            />
          </div>
        )}
      </div>

      {/* Expanded details section - takes full width and has card styling */}
      {isExpanded && (
        <div
          className={`w-full mt-8 transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-6 ${
            isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
          }`}
        >
        <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((tag) => (
              <span key={tag} className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full">
              {tag}
            </span>
          ))}
        </div>

          {project.detailedContent?.map((content, index) => (
            <div key={index} className="mb-8">
              {content.caption && <h3 className="text-xl font-bold mb-4">{content.caption}</h3>}
              {renderContentByType(content)}
            </div>
          ))}

          {/* Links section */}
          {project.links && project.links.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-8">
              {project.links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
              target="_blank"
              rel="noopener noreferrer"
                  className={index === 0
                    ? "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    : "px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  }
                  onClick={(e) => e.stopPropagation()}
                >
                  {link.text}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProjectCard