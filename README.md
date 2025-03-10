# Tarik Isildar Portfolio

An interactive portfolio website inspired by Bruno Simon's approach, built with Next.js, Three.js, and TailwindCSS.

## Features

- Interactive 3D background experience using Three.js
- Responsive design for all device sizes
- Projects showcase with filtering by technology
- About page with animated skill bars
- Printable CV page
- Individual project detail pages
- Dark/light mode support based on system preferences

## Technologies Used

- **Next.js**: React framework for server-side rendering and routing
- **TypeScript**: For type safety and better developer experience
- **Three.js**: For 3D graphics and interactive elements
- **React Three Fiber**: React renderer for Three.js
- **TailwindCSS**: Utility-first CSS framework for styling
- **ESLint**: For code linting

## Project Structure

```
.
├── public/              # Static assets (images, etc.)
├── src/                 # Source code
│   ├── app/             # Next.js app router pages
│   │   ├── about/       # About page
│   │   ├── cv/          # CV page
│   │   ├── projects/    # Projects listing page
│   │   │   └── [slug]/  # Individual project detail page
│   │   ├── globals.css  # Global CSS styles
│   │   ├── layout.tsx   # Root layout component
│   │   ├── page.tsx     # Home page
│   │   └── not-found.tsx # 404 page
│   ├── components/      # React components
│   │   ├── three/       # Three.js related components
│   │   │   └── Experience.tsx # Main 3D experience
│   │   └── ui/          # UI components
│   │       ├── Footer.tsx
│   │       ├── Header.tsx
│   │       ├── Hero.tsx
│   │       └── ProjectCard.tsx
│   └── data/            # Data files
│       ├── about.ts     # About page data
│       └── projects.ts  # Projects data
└── package.json         # Project dependencies and scripts
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
  longDescription: string[]; // Array of paragraphs
  imageUrl: string;
  tags: string[];
  demoUrl?: string; // Optional
  codeUrl?: string; // Optional
  featured: boolean; // Whether to show on homepage
}
```

Add new project images to the `public/images/` directory.

### Updating Personal Information

To update your personal information, edit the `src/data/about.ts` file. This includes:

- Bio
- Skills
- Work Experience
- Education

### Modifying the 3D Experience

The 3D interactive background can be modified in `src/components/three/Experience.tsx`. The current implementation includes:

- Interactive 3D cubes that respond to hover
- Floating animation
- Stars background
- Orbit controls for camera rotation

## Getting Started

### Prerequisites

- Node.js 18.17 or later

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/tarikisildar/portfolio.git
   cd portfolio
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```
npm run build
```

## Deployment

This project can be deployed on any platform that supports Next.js applications, such as:

- Vercel
- Netlify
- AWS Amplify
- GitHub Pages
- Your own server

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Inspired by [Bruno Simon's portfolio](https://bruno-simon.com/)
- Built with [Next.js](https://nextjs.org/) and [Three.js](https://threejs.org/)
