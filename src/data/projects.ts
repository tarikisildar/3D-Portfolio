export interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  longDescription: string[];
  imageUrl: string;
  tags: string[];
  demoUrl?: string;
  codeUrl?: string;
  featured: boolean;
  category: 'Game' | 'Software';
}

const projects: Project[] = [
  {
    id: 1,
    title: "Autonomous Vehicle Perception System",
    slug: "autonomous-perception",
    description: "A deep learning-based perception system for autonomous vehicles that detects and tracks objects in real-time.",
    longDescription: [
      "Developed a robust perception system for autonomous vehicles that uses computer vision and deep learning to detect, classify, and track objects in real-time.",
      "Implemented multiple state-of-the-art neural networks including YOLO, Mask R-CNN, and PointPillars for 2D and 3D object detection using camera, LiDAR, and radar data fusion.",
      "Optimized the models for real-time performance on embedded platforms, achieving a 3x speedup while maintaining accuracy.",
      "Created a flexible data pipeline for training and validation using TensorFlow and PyTorch, handling diverse sensor inputs and environmental conditions."
    ],
    imageUrl: "/images/autonomous-perception.jpg",
    tags: ["Computer Vision", "Deep Learning", "Autonomous Systems", "C++", "Python", "CUDA"],
    demoUrl: "https://autonomous-demo.example.com",
    codeUrl: "https://github.com/tarikisildar/autonomous-perception",
    featured: true,
    category: 'Software'
  },
  {
    id: 2,
    title: "Real-time Global Illumination Renderer",
    slug: "global-illumination-renderer",
    description: "A GPU-accelerated real-time renderer implementing advanced global illumination techniques for photorealistic rendering.",
    longDescription: [
      "Built a real-time rendering engine that implements state-of-the-art global illumination techniques for photorealistic rendering in interactive applications.",
      "Implemented path tracing, screen space reflections, ambient occlusion, and dynamic area lighting with physically-based materials.",
      "Optimized shaders and rendering pipeline to achieve real-time performance on consumer GPUs using compute shaders and ray tracing.",
      "Developed a flexible scene graph and material system that supports a wide range of lighting environments and material properties."
    ],
    imageUrl: "/images/renderer.jpg",
    tags: ["Computer Graphics", "GLSL", "C++", "OpenGL", "Vulkan", "Ray Tracing"],
    demoUrl: "https://renderer-demo.example.com",
    codeUrl: "https://github.com/tarikisildar/rt-renderer",
    featured: true,
    category: 'Software'
  },
  {
    id: 3,
    title: "Robot Motion Planning Framework",
    slug: "robot-motion-planning",
    description: "A comprehensive motion planning framework for robotic manipulators handling complex tasks in dynamic environments.",
    longDescription: [
      "Developed a motion planning framework for robotic manipulators that enables safe and efficient navigation in dynamic environments with obstacles.",
      "Implemented various planning algorithms including RRT*, PRM, and trajectory optimization using model predictive control.",
      "Created a simulation environment with physics-based constraints and collision detection for testing and validating planning strategies.",
      "Integrated the system with ROS (Robot Operating System) for deployment on real robotic hardware, demonstrating successful task completion in real-world scenarios."
    ],
    imageUrl: "/images/motion-planning.jpg",
    tags: ["Robotics", "Motion Planning", "C++", "ROS", "Simulation", "Control Systems"],
    demoUrl: "https://motion-planning-demo.example.com",
    codeUrl: "https://github.com/tarikisildar/motion-planning",
    featured: false,
    category: 'Software'
  },
  {
    id: 4,
    title: "Interactive Medical Visualization Tool",
    slug: "medical-visualization",
    description: "A tool for interactive visualization and analysis of 3D medical imaging data with real-time volumetric rendering.",
    longDescription: [
      "Designed and implemented a tool for interactive visualization and analysis of 3D medical imaging data (CT, MRI) with real-time volumetric rendering.",
      "Developed custom volume rendering techniques with transfer function editing for enhanced visualization of tissue structures.",
      "Implemented segmentation algorithms to isolate specific anatomical structures and support interactive measurements and annotations.",
      "Created an intuitive user interface that allows medical professionals to easily navigate and analyze complex volumetric data."
    ],
    imageUrl: "/images/medical-viz.jpg",
    tags: ["Medical Imaging", "Volumetric Rendering", "Qt", "C++", "GLSL", "VTK"],
    demoUrl: "https://medical-viz-demo.example.com",
    codeUrl: "https://github.com/tarikisildar/medical-viz",
    featured: false,
    category: 'Software'
  },
  {
    id: 5,
    title: "AR Museum Guide Application",
    slug: "ar-museum-guide",
    description: "An augmented reality application that enhances museum visits by providing interactive information about exhibits.",
    longDescription: [
      "Created an augmented reality application that enhances museum visits by overlaying interactive information about exhibits, artifacts, and artworks.",
      "Implemented computer vision algorithms for robust image recognition and tracking of museum exhibits in varying lighting conditions.",
      "Developed 3D visualization techniques to show historical context, alternative views, and animations related to the exhibits.",
      "Built a content management system that allows museum staff to easily update and customize information without technical expertise."
    ],
    imageUrl: "/images/ar-museum.jpg",
    tags: ["Augmented Reality", "Unity3D", "Computer Vision", "C#", "UI/UX", "3D Modeling"],
    demoUrl: "https://ar-museum-demo.example.com",
    codeUrl: "https://github.com/tarikisildar/ar-museum",
    featured: true,
    category: 'Game'
  },
  {
    id: 6,
    title: "Virtual Reality Puzzle Game",
    slug: "vr-puzzle-game",
    description: "An immersive VR puzzle game that challenges players to solve physics-based puzzles in a mysterious ancient temple.",
    longDescription: [
      "Designed and developed a VR puzzle game that transports players to an ancient temple filled with physics-based challenges and mystical mechanisms.",
      "Implemented realistic physics interactions allowing players to manipulate objects naturally using VR controllers.",
      "Created an engaging narrative with progressive difficulty that unfolds as players solve increasingly complex puzzles.",
      "Optimized the game for various VR platforms including Oculus, Vive, and Valve Index with custom control schemes for each."
    ],
    imageUrl: "/images/vr-puzzle.jpg",
    tags: ["Virtual Reality", "Unity3D", "C#", "3D Modeling", "Game Design", "Physics"],
    demoUrl: "https://vr-puzzle-demo.example.com",
    codeUrl: "https://github.com/tarikisildar/vr-puzzle",
    featured: true,
    category: 'Game'
  },
  {
    id: 7,
    title: "Procedural Dungeon Crawler",
    slug: "dungeon-crawler",
    description: "A roguelike dungeon crawler with procedurally generated levels, dynamic lighting, and a deep progression system.",
    longDescription: [
      "Created a roguelike dungeon crawler featuring procedurally generated levels that ensure a unique experience in every playthrough.",
      "Implemented advanced procedural generation algorithms to create varied and balanced dungeon layouts with coherent themes.",
      "Designed a deep character progression system with skill trees, equipment upgrades, and permanent unlocks between runs.",
      "Developed a dynamic lighting and shadow system that enhances the atmospheric dungeon exploration experience."
    ],
    imageUrl: "/images/dungeon-crawler.jpg",
    tags: ["Game Development", "Procedural Generation", "Unity3D", "C#", "Game Design", "Algorithms"],
    demoUrl: "https://dungeon-crawler-demo.example.com",
    codeUrl: "https://github.com/tarikisildar/dungeon-crawler",
    featured: false,
    category: 'Game'
  }
];

export default projects;