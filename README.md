# Tarik Isildar Portfolio

An interactive 3D portfolio website built with Next.js, Three.js, and TailwindCSS. Experience a unique way to showcase projects with an interactive 3D environment.

![Portfolio Preview](/public/images/preview.png)

## Features

- **Interactive 3D Room Environment**: Navigate a 3D space with camera animations for each section
- **Video Screen**: Interactive video screen in the 3D room that can be toggled
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Project Showcase**: Detailed project cards with filtering capabilities
- **Blog**: Markdown-based blog with syntax highlighting
- **Printable CV**: Downloadable and printable resume
- **Optimized Performance**: Built with performance in mind, using React 18 and Next.js 15
- **Modern UI**: Clean, modern UI with TailwindCSS v4

## Technologies Used

- **Frontend**: Next.js 15, React 18, TypeScript
- **3D Graphics**: Three.js, React Three Fiber, React Three Drei
- **Styling**: TailwindCSS v4, tailwindcss/typography
- **Content**: Markdown for blog posts
- **Analytics**: Vercel Analytics + Google Analytics with custom event tracking
- **Deployment**: Vercel

## Project Structure

```
.
├── public/              # Static assets (images, 3D models, etc.)
├── src/                 # Source code
│   ├── app/             # Next.js app router pages
│   │   ├── about/       # About page
│   │   ├── blog/        # Blog listing and individual posts
│   │   │   └── [slug]/  # Individual blog post page
│   │   ├── cv/          # CV page
│   │   ├── projects/    # Projects listing page
│   │   │   └── [slug]/  # Individual project detail page
│   ├── components/      # React components
│   │   ├── three/       # Three.js related components
│   │   │   ├── RoomScene.tsx # 3D room environment
│   │   │   └── Scene3D.tsx   # Main 3D scene wrapper
│   │   └── ui/          # UI components
│   ├── content/         # Markdown content
│   │   └── blog/        # Blog posts in markdown
│   ├── data/            # Data files
│   │   └── projects.ts  # Projects data
│   └── utils/           # Utility functions
└── next.config.mjs      # Next.js configuration
```

## How to Update

### Adding or Editing Projects

To add or edit projects, modify the `src/data/projects.ts` file. Each project follows this structure:

```typescript
{
  id: number;
  title: string;
  slug: string; // URL-friendly name
  description: string;
  imageUrl: string;
  tags: string[];
  links?: ProjectLink[];
  featured: boolean;
  category: 'Game' | 'Software' | 'Web' | 'Other';
  detailedContent?: DetailedContent[]; // Array of content blocks
}
```

### Adding Blog Posts

Create new markdown files in the `src/content/blog/` directory. Each blog post should have a format like:

```markdown
# Blog Post Title

Your content here...

## Subheading

More content...
```

## Development

### Prerequisites

- Node.js 18.17 or later

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tarikisildar/portfolio.git
   cd portfolio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp env.example .env.local
   ```
   Then edit `.env.local` and add your Google Analytics ID:
   ```
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm run start
```

## Deployment

This project is optimized for deployment on Vercel, but can be deployed on any platform that supports Next.js applications.

### Deploying to Vercel (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Set up Vercel Deployment**
   - Go to [vercel.com](https://vercel.com) and sign up/in with GitHub
   - Import your repository
   - Configure the project settings:
     - Framework Preset: Next.js
     - Build Command: `npm run build`
     - Output Directory: `.next` (default)
   - Click "Deploy"

3. **Configure Environment Variables in Vercel**
   - In your Vercel dashboard, go to the project settings
   - Navigate to "Environment Variables"
   - Add `NEXT_PUBLIC_GA_ID` with your Google Analytics Measurement ID
   - Redeploy your application

4. **Set up a custom domain (optional)**
   - In your Vercel dashboard, go to the project settings
   - Navigate to "Domains"
   - Add your custom domain and follow Vercel's DNS configuration instructions

### Troubleshooting Deployment

If you encounter TypeScript errors during deployment, check:
- Parameter types in page components
- TypeScript compatibility with your dependencies
- Proper Next.js configuration in `next.config.mjs`

## Analytics & Tracking

This project includes comprehensive analytics tracking with both Vercel Analytics and Google Analytics:

### Available Tracking Functions
- **`track(eventName, parameters)`**: Send events to both Vercel and Google Analytics
- **`trackButtonClick(buttonName, location, additionalParams)`**: Track button interactions
- **`trackPageView(pageName, additionalParams)`**: Track page views automatically
- **`trackProjectInteraction(projectName, interactionType, additionalParams)`**: Track project-related actions
- **`trackProcrastinateAction(actionType, additionalParams)`**: Track procrastination mode interactions

### Current Tracking Events
- **Procrastinate Button Clicks**: `procrastinate_action` with `action_type: 'button_click'`
- **Procrastinate Card Clicks**: `procrastinate_action` with `action_type: 'card_click'`
- **Teams Button Clicks**: `button_click` with `button_name: 'teams_button'`
- **Random Navigation**: `button_click` with `button_name: 'random_navigation'`
- **Project Card Expansions**: `project_interaction` with `interaction_type: 'expand'`
- **External Link Clicks**: `project_interaction` with `interaction_type: 'external_link_click'`
- **Page Views**: Automatically tracked on route changes

### Example Usage
```typescript
import { track, trackButtonClick, trackProjectInteraction } from '@/utils/analytics';

// Custom event
track('custom_event', { category: 'engagement', action: 'click' });

// Button click
trackButtonClick('submit_button', 'contact_form', { form_type: 'contact' });

// Project interaction
trackProjectInteraction('My Project', 'view_details', { project_id: 123 });
```

## Performance Optimization

This project includes several performance optimizations:
- Lazy loading of 3D models and textures
- Dynamic loading of heavy components
- Optimized Three.js rendering with frustum culling
- React.memo for performance-critical components

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- 3D models and textures from various sources (see attributions in the footer)
- Built with [Next.js](https://nextjs.org/) and [Three.js](https://threejs.org/)
- Inspired by interactive 3D websites and modern portfolio designs
