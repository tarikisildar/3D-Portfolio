# 3D Portfolio Website Overview

## Project Summary
This is a personal portfolio website for Tarik Isildar featuring an interactive 3D room that serves as a creative navigation interface. The 3D room is a digital twin of the developer's actual dorm room in Munich. As users navigate to different sections of the site (home, projects, about, CV, blog), the camera animates to different positions in the 3D room, creating an immersive experience.

## Technical Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **3D Graphics**: Three.js with React Three Fiber (R3F) and React Three Drei
- **Styling**: TailwindCSS v4
- **Content**: Markdown for blog posts
- **Analytics**: Vercel Analytics with custom event tracking
- **Deployment**: Vercel

## Key Files and Directories

### Core Structure
- `/src/app/`: Next.js 13+ App Router pages
  - `/page.tsx`: Homepage with featured projects and intro cards
  - `/about/page.tsx`: About page with bio and social links
  - `/projects/page.tsx`: Projects listing with filtering capability
  - `/projects/[slug]/page.tsx`: Individual project detail pages
  - `/cv/page.tsx`: CV page with embedded Google Drive PDF
  - `/blog/page.tsx`: Blog listing
  - `/blog/[slug]/page.tsx`: Individual blog post pages
- `/src/components/`: React components
  - `/three/`: 3D-related components
  - `/ui/`: UI components
  - `/layout/`: Layout components
- `/src/data/`: Data files (projects.ts, about.ts)
- `/src/content/`: Content files like markdown blog posts
- `/public/`: Static assets including 3D models, images

### Key Component Files
- `/src/components/three/RoomScene.tsx`: Core 3D room implementation with camera positions
- `/src/components/three/Scene3D.tsx`: Wrapper for the 3D scene
- `/src/components/ui/ProjectCard.tsx`: Card component for projects with expansion capability
- `/src/components/layout/SiteWrapper.tsx`: Main layout wrapper including navigation

## Special Features

### Interactive 3D Room Navigation
The centerpiece of the site is the 3D room model that serves as a navigation interface. Each site section corresponds to a different camera position in the room:
- **Home**: Overview of the room
- **About**: Focused on personal photos
- **Projects**: Looking at the desk area
- **CV**: Zoomed in on documents
- **Blog**: Looking at the bookshelf

The camera smoothly animates between positions when navigating between sections. This is implemented in `RoomScene.tsx` with the `cameraPositions` object defining coordinates and field of view for each section.

### Procrastination Mode
A special "Procrastinate" button exists in the 3D view that:
1. Switches the camera to look at the computer screen
2. Displays videos on the virtual computer screen
3. Offers controls to exit the mode or switch videos

This feature is implemented through:
- `ProcrastinateButtons` component in `RoomScene.tsx`
- `VideoScreen` component for displaying content
- Custom button elements injected into the DOM

Users can trigger this mode from either the 3D view button or from a dedicated card on the homepage.

### Analytics Tracking
The site implements Vercel Analytics with custom event tracking for:
- Procrastinate button clicks (`procrastinate_button_click`)
- Teams/Rickroll button clicks (`teams_button_click`)
- Procrastinate card clicks (`procrastinate_card_click`)
- Random navigation (`random_navigation`)

### Project Showcase
The projects section features:
- Filterable project cards by category and technology tags
- Expandable cards with detailed content
- Support for multiple content types (text, image, video, PDF, web embeds)
- Google Drive and YouTube embedding

## Implementation Patterns

### Camera Animation
The 3D camera animations use:
- Cubic easing for smooth motion
- Interpolation between start and end positions
- Persistent camera state maintained between page navigations
- Responsive field of view adjustments

### Content Scaling
Content containers (video, PDF, images) support percentage-based scaling in desktop view but automatically scale to full width on mobile. This is implemented via:
- React hooks for mobile detection
- Responsive container styles

### Page Organization
- **Dynamic Pages**: Project and blog posts use dynamic routes (`[slug]`)
- **Server Components**: Used for data loading (e.g., blog posts)
- **Client Components**: Used for interactive elements

## Data Structure

### Projects
Projects are defined in `src/data/projects.ts` with the structure:
```typescript
interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  tags: string[];
  links?: ProjectLink[];
  featured: boolean;
  category: 'Game' | 'Software' | 'Web' | 'Other';
  detailedContent?: DetailedContent[];
}
```

Each project can have multiple content sections of different types (text, image, video, PDF, web).

### Blog Posts
Blog posts are stored as markdown files in `src/content/blog/` and are parsed using the utilities in `src/utils/mdUtils.ts`.

## Common Patterns

### Component Structure
Components typically follow a pattern of:
1. Import statements
2. Type definitions
3. Helper functions
4. Main component definition
5. Exports

### State Management
- React's built-in state hooks (`useState`, `useEffect`, `useRef`)
- Custom hooks for specific functionality
- Context for shared state where needed

## Customization Points
For future improvements, the main customization points are:

### Content
- Add/edit projects in `src/data/projects.ts`
- Add blog posts as markdown files in `src/content/blog/`
- Update about page content in `src/data/about.ts`

### 3D Environment
- Modify camera positions in `cameraPositions` object in `RoomScene.tsx`
- Replace 3D models in `/public/models/`
- Adjust lighting and scene settings in `Scene3D.tsx`

### Styling
- Update global styles in `src/app/globals.css`
- Modify TailwindCSS theme in `tailwind.config.js`

## Important Implementation Details

### Mobile Responsiveness
The site handles mobile viewing through:
- Responsive container sizing using the `useIsMobile` hook
- Appropriate scaling of content containers
- Mobile-friendly navigation

### Performance Considerations
- 3D models are loaded efficiently
- The camera is animated using optimal interpolation
- Videos and other heavy content are loaded only when needed

### Analytics Integration
Vercel Analytics is integrated in the root layout with custom event tracking throughout the application for user interactions.

### Deployment Configuration
The project is configured for Vercel deployment with special handling for peer dependency conflicts in `vercel.json`.