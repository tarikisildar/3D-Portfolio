export type ContentType = 'text' | 'image' | 'video' | 'pdf' | 'web'

export interface DetailedContent {
  type: ContentType
  content: string
  caption?: string
  width?: string
  height?: string
  scalePercent?: number
  aspectRatio?: string
}

export interface ProjectLink {
  url: string;
  text: string;
}

export interface Project {
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
  codeUrl?: string;
  demoUrl?: string;
}

const projects: Project[] = [
  {
    id: 1,
    title: 'Master\'s Thesis: Real-Time Depth Completion for Autonomous Driving',
    slug: 'thesis',
    description: 'A novel sensor fusion system combining camera and LiDAR data for generating high-fidelity point clouds for autonomous vehicle teleoperation.',
    imageUrl: '/images/thesis.png',
    tags: ['ROS', 'C++', 'OpenGL', 'PyTorch', 'Python', 'Autonomous Driving', 'Deep Learning'],
    links: [
      {
        url: "https://drive.google.com/file/d/19yG4nIO64GA3QoWEGyvRjVp0HOlEN_wm/view?usp=drive_link",
        text: "Thesis Paper"
      }
    ],
    featured: true,
    category: 'Software',
    detailedContent: [
      {
        type: 'text',
        content: "My Master's thesis, \"Enhancing a Visualization Concept for Environmental Perception Data of Autonomous Vehicles,\" addresses a critical challenge in autonomous vehicle (AV) technology: creating effective visualization interfaces for teleoperation systems."
      },
      {
        type: 'text',
        content: "Teleoperation serves as a crucial backup system for autonomous vehicles, allowing human operators to remotely assist when situations exceed the vehicle's autonomous capabilities. My research specifically focuses on Perception Modification (PM), an innovative teleoperation approach where operators can correct perception errors without taking full control of the vehicle. The key contribution is the development and evaluation of an Integrated View interface that combines camera feeds, LiDAR data, and perception outputs in a single, cohesive display."
      },
      {
        type: 'text',
        content: "To implement this integrated visualization, I developed a deep learning-based depth completion system that creates detailed 3D visualizations from sparse sensor data. The core of this system is a modified Dynamic Spatial Propagation Network (DySPN) architecture that generates dense depth maps from sparse LiDAR inputs and RGB camera images. This approach enables real-time operation essential for teleoperation scenarios while providing a more intuitive spatial understanding of the vehicle's environment."
      },
      {
        type: 'text',
        content: "For comparative analysis, I also implemented a traditional Separate View interface that presents information across multiple windows. Both interfaces were developed using a user-centered design approach following the W-shaped development cycle, ensuring they met the established requirements for situational awareness, cognitive load management, and technical performance."
      },
      {
        type: 'image',
        content: "/images/thesis_1.png",
        caption: "Comparison of the separate view and integrated view interfaces",
        scalePercent: 100,
        aspectRatio: "16/5"
      },
      {
        type: 'text',
        content: "The testing framework utilized a custom simulation environment based on Munich's road layout, with particular focus on the Gärtnerplatz area, creating realistic testing conditions for German operators. Evaluation metrics included the Situation Awareness Global Assessment Technique (SAGAT) for measuring operator awareness and NASA Task Load Index (NASA-TLX) for assessing cognitive workload."
      },
      {
        type: 'text',
        content: "While the comprehensive user testing was ongoing at the time of thesis completion, initial technical assessments demonstrated the feasibility of real-time depth completion in teleoperation systems. The research establishes a foundation for future interface improvements and contributes to developing more effective teleoperation systems, strengthening the role of human oversight in autonomous vehicle operations."
      },
      {
        type: 'video',
        content: "https://drive.google.com/file/d/1YVv6W0x94HZSgA0Qk0oL3s8NFY6WLwSJ/view",
        caption: "Performance of the integrated view interface compared to the ground truth"
      }
    ]
  },
  {
    id: 2,
    title: "Visualization System for Autonomous Vehicle Teleoperation",
    slug: "idp-interface",
    description: "Developed a real-time 3D visualization system for enhancing situational awareness in teleoperated autonomous vehicles, combining perception data with camera feeds.",
    imageUrl: "/images/tod_visual.png",
    tags: ["OpenGL", "C++", "ROS", "Autonomous Driving"],
    links: [

    ],
    featured: true,
    category: 'Software',
    detailedContent: [
      {
        type: 'text',
        content: "As part of my Interdisciplinary Project (IDP) at TUM's Chair of Automotive Technology, I developed a teleoperation interface for remote assistance of autonomous vehicles. The system enhances situational awareness for teleoperators by visualizing environmental perception data in real-time."
      },
      {
        type: 'text',
        content: "Key improvements and contributions I made include:\n- Implemented a flexible layer system architecture for modular feature development\n- Designed and built an entity-component system for scene management\n- Created specialized rendering for detected objects, planned trajectories, and LiDAR point clouds\n- Integrated OpenGL-based rendering pipeline with ROS messaging system\n- Developed a docking UI system with DearImGui for customizable views"
      },
      {
        type: 'video',
        content: "https://drive.google.com/file/d/1N0dNYYXjM-AuTIQ4OaH5U4AgHk3O12wx/view?usp=sharing",
        caption: "Demonstration of the teleoperation interface showing perception visualization"
      },
      {
        type: 'text',
        content: "The project focused on maintaining low latency while providing rich visualization features, ensuring teleoperators can make quick, informed decisions when assisting autonomous vehicles in challenging scenarios."
      }
    ]
  },
  {
    id: 10,
    title: "Police Simulator: Patrol Officers",
    slug: "police-simulator",
    description: "An immersive law enforcement simulation game where players patrol accurately recreated city districts, enforce traffic laws, and investigate crime scenes. Recognized as one of the Top 5 Early Access Games of 2022 by Steam.",
    imageUrl: "/images/police.jpg",
    tags: ["Unreal Engine 4", "C++"],
    links: [
      {
        url: "https://store.steampowered.com/app/997010/Police_Simulator_Patrol_Officers/",
        text: "Steam Page"
      }
    ],
    featured: true,
    category: 'Game',
    detailedContent: [
      {
        type: 'text',
        content: "Police Simulator: Patrol Officers is a professional game project I worked on during my time at Aesir Interactive. The game was recognized as one of the Top 5 Early Access Games of 2022 by Steam, representing a significant achievement for our development team."
      },
      {
        type: 'video',
        content: "https://www.youtube.com/watch?v=ED-7vaYfIo4",
        caption: "Official Police Simulator: Patrol Officers Trailer",
        scalePercent: 75
      },
      {
        type: 'text',
        content: "My Contributions:\n\n• Implemented core gameplay systems using Unreal Engine 4 and C++\n• Developed UI components and interfaces that enhanced player experience\n• Created performance optimizations that improved game stability and framerate\n• Collaborated within an agile team of 30 members throughout the project lifecycle\n• Participated actively in code reviews, technical design discussions, and sprint planning"
      },
      {
        type: 'text',
        content: "The game features multiple detailed city districts, progressive shift system, and various police activities including traffic control, accident responses, and crime scene investigations. Players can patrol Brighton on foot or in a police car, enforce traffic laws, and solve crimes."
      },
      {
        type: 'image',
        content: "/images/imdb.png",
        caption: "",
        scalePercent: 60,
        aspectRatio: "16/9"
      },
      {
        type: 'text',
        content: "Fun fact: This project earned me an IMDB page - my small claim to fame in the entertainment world! I'm still waiting for Steven Spielberg to call"
      }
    ]
  },
  {
    id: 5,
    title: "Judgement Day",
    slug: "judgement-day",
    description: "Multiplayer, beat 'em up style, casual mobile game",
    imageUrl: "/images/judgement.png",
    tags: ["Unity", "C#"],
    links: [
      {
        url: "https://github.com/tarikisildar/Judgement-Day",
        text: "GitHub Repository"
      }
    ],
    featured: false,
    category: 'Game',
    detailedContent: [
      {
        type: 'video',
        content: "https://www.youtube.com/watch?v=qY0Ru8aQSJE",
        caption: "Judgement Day Gameplay Trailer",
        scalePercent: 75,
        aspectRatio: "16/9"
      }
    ]
  },
  {
    id: 6,
    title: "Llamazing",
    slug: "llamazing",
    description: "A WebGL based game where you control a llama in nature, built with Three.js for immersive browser-based gameplay",
    imageUrl: "/images/llamazing.png",
    tags: ["WebGL", "Three.js", "JavaScript"],
    links: [
      {
        url: "https://yavuzerenozer.github.io/llamazing/llamazing/",
        text: "Play Game"
      },
      {
        url: "https://github.com/yavuzerenozer/llamazing",
        text: "GitHub Repository"
      }
    ],
    featured: false,
    category: 'Game',
    detailedContent: [
      {
        type: 'video',
        content: "https://www.youtube.com/watch?v=pmNzJ8oCL0g",
        caption: "Llamazing Game Trailer",
        scalePercent: 75,
        aspectRatio: "16/9"
      },
      {
        type: 'text',
        content: "Llamazing is a WebGL-based game where you control a llama navigating through a natural environment. The game demonstrates the power of 3D rendering in the browser without requiring any plugins. Important to note the game was done pre-AI :) Things took time to built back in my day."
      },
      {
        type: 'web',
        content: "https://yavuzerenozer.github.io/llamazing/llamazing/",
        caption: "Play Llamazing directly in your browser",
        height: "600px",
        width: "100%"
      },
      {
        type: 'text',
        content: "Built using Three.js, this project showcases real-time 3D graphics capabilities in modern browsers. The game features include terrain navigation, obstacle avoidance, and environmental interactions."
      }
    ]
  },
  {
    id: 7,
    title: "Trivia Race Playable Ad",
    slug: "trivia-race-ad",
    description: "A lightweight WebGL playable advertisement for Trivia Race mobile game with 5+ million downloads, optimized to fit within 1MB as a single HTML file.",
    imageUrl: "/images/trivia-race.png",
    tags: ["WebGL", "Three.js", "JavaScript",],
    links: [],
    featured: false,
    category: 'Game',
    detailedContent: [
      {
        type: 'text',
        content: "I developed this playable advertisement for Trivia Race, a popular mobile game with over 5 million downloads across Google Play and the App Store. The challenge was to create an engaging, interactive preview of the full game that could be delivered as a lightweight advertisement."
      },
      {
        type: 'web',
        content: "/trivia.html",
        caption: "Play the Trivia Race ad directly in your browser",
        height: "600px",
        width: "100%"
      },
      {
        type: 'image',
        content: "/images/trivia-editor.png",
        caption: "Custom PyQt GUI editor I built for exporting and configuring the game assets",
        width: "100%"
      },
      {
        type: 'text',
        content: "Technical accomplishments:\n\n- Used WebGL and Three.js to create an interactive 3D experience\n- Optimized all assets to fit within a 1MB file size constraint (industry standard for playable ads)\n- Developed a custom PyQt GUI tool to streamline the workflow of exporting and configuring the game\n- Created a system to bundle multiple JavaScript files, images, and game data into a single HTML file\n- Implemented efficient sprite management and variable configuration for easy customization"
      }
    ]
  },
  {
    id: 8,
    title: "Simulation Based Autonomous Driving",
    slug: "simulation-based-autonomous-driving",
    description: "End-to-end neural network for autonomous navigation in complex urban environments using computer vision and deep learning techniques.",
    imageUrl: "/images/simulation.png",
    tags: ["Python", "PyTorch", "Autonomous Driving", "Deep Learning"],
    links: [
      {
        url: "https://www.youtube.com/watch?v=OKYZA0aYen0",
        text: "Watch Demo"
      }
    ],
    featured: false,
    category: 'Software',
    detailedContent: [
      {
        type: 'text',
        content: "In this project, I designed and trained an end-to-end neural network capable of autonomous navigation in complex urban environments using PyTorch. The system implements custom convolutional architectures to process visual inputs and predict optimal driving actions without relying on intermediate representations."
      },
      {
        type: 'video',
        content: "https://www.youtube.com/watch?v=OKYZA0aYen0",
        caption: "Demonstration of the autonomous driving system navigating urban environments"
      },
      {
        type: 'text',
        content: "Key accomplishments:\n- Implemented custom convolutional architectures for processing complex visual inputs\n- Achieved robust performance across varying traffic densities and road layouts\n- Enhanced system reliability through comprehensive training data augmentation techniques\n- Optimized inference speed for real-time decision making"
      },
      {
        type: 'text',
        content: "End-to-end neural networks in autonomous driving represent a paradigm shift from traditional modular approaches. Instead of dividing the driving task into separate components (perception, planning, control), an end-to-end system directly maps raw sensory inputs (like camera images) to steering commands. This approach allows the network to learn implicit features and relationships that might be overlooked in hand-designed systems. The neural network essentially learns the entire driving process as a single optimization problem, potentially capturing subtle correlations between visual cues and appropriate driving responses that would be difficult to explicitly program."
      }
    ]
  },
  {
    id: 9,
    title: "Exerciser: AI-Powered Exercise Recognition Platform",
    slug: "Exerciser",
    description: "A comprehensive mobile platform that uses computer vision to recognize physical therapy exercises, provide real-time feedback, and facilitate doctor-patient communication for rehabilitation.",
    imageUrl: "/images/exerciser.png",
    tags: ["Flutter", "Dart", "Python", "FastAPI", "MongoDB", "Docker"],
    links: [
      {
        url: "https://github.com/FadeoN/exerciser",
        text: "GitHub Repository"
      }
    ],
    featured: false,
    category: 'Software',
    detailedContent: [
      {
        type: 'text',
        content: "Exerciser was developed as my Bachelor's final project, created over the course of a year in collaboration with a teammate. The platform addresses a critical gap in remote physical therapy by enabling patients to perform exercises correctly without direct supervision while providing therapists with detailed progress tracking."
      },
      {
        type: 'video',
        content: "https://www.youtube.com/watch?v=X9Ls3iCUrUI&t=0s",
        caption: "Application demo showing the user interface and main features"
      },
      {
        type: 'text',
        content: "The technical implementation includes:\n- Multi-platform mobile application built with Flutter/Dart for seamless cross-device compatibility\n- Custom-designed UI/UX for intuitive exercise planning, execution, and history tracking\n- Microservice architecture using Python with Flask and FastAPI for different service components\n- MongoDB database for flexible data storage and efficient querying\n- Docker containerization for simplified deployment and scaling\n- Custom pose estimation and motion recognition algorithms for accurate exercise analysis"
      },
      {
        type: 'video',
        content: "https://www.youtube.com/watch?v=X9Ls3iCUrUI&t=131s",
        caption: "Demonstration of the algorithm detecting exercises and counting repetitions"
      },
      {
        type: 'text',
        content: "The project involved significant research into pose estimation, motion recognition, and repetition counting techniques. We developed a novel algorithm that combines these approaches to accurately identify exercises and provide meaningful feedback to users. The research component was particularly rewarding as it required synthesizing academic knowledge with practical implementation considerations.\n\nThis year-long endeavor taught us valuable lessons in project management, setting realistic deadlines, and adapting to new technologies. Working with tools that were initially unfamiliar to us (Flutter, microservices architecture) proved to be an excellent learning experience that significantly expanded our technical expertise."
      }
    ]
  },
  {
    id: 11,
    title: "Hyper Casuals Portfolio",
    slug: "hyper-casuals",
    description: "A collection of 9 hyper-casual mobile games developed for Apps, optimized for engagement and retention with lightweight, addictive gameplay mechanics.",
    imageUrl: "/images/hyper-casuals.png",
    tags: ["Unity", "C#"],
    links: [],
    featured: false,
    category: 'Game',
    detailedContent: [
      {
        type: 'text',
        content: "During my time working with Apps, I developed numerous hyper-casual mobile games that combined simple mechanics with addictive gameplay loops. These games were designed to be instantly playable with minimal learning curve while maintaining high engagement metrics."
      },
      {
        type: 'video',
        content: "https://drive.google.com/file/d/1tkQGHzOnLfQUyz_-IKsZXEYRj0L-LKO5/view?usp=drive_link",
        caption: "Gangsta Paradise",
        scalePercent: 75,
        aspectRatio: "16/9"
      },
      {
        type: 'video',
        content: "https://drive.google.com/file/d/1lApJjVZcxgxsGJLstecfsBAtKA_szRXm/view?usp=drive_link",
        caption: "Dear President",
        scalePercent: 75,
        aspectRatio: "16/9"
      },
      {
        type: 'video',
        content: "https://drive.google.com/file/d/1QHecVYGxrWcoQH0Vsr58PGWL4qkOEgbA/view?usp=drive_link",
        caption: "Tap Tap Run",
        scalePercent: 75,
        aspectRatio: "16/9"
      },
      {
        type: 'video',
        content: "https://drive.google.com/file/d/1rm32__xBrrzWJEafgoFxfyd4DZUjoSlF/view?usp=drive_link",
        caption: "Journalist Life",
        scalePercent: 75,
        aspectRatio: "16/9"
      },
      {
        type: 'video',
        content: "https://drive.google.com/file/d/1A3OAOTFQMhtgWoX6C2qWYQ1NcrDoKX-5/view?usp=drive_link",
        caption: "ZigZag Runner",
        scalePercent: 75,
        aspectRatio: "16/9"
      },
      {
        type: 'video',
        content: "https://drive.google.com/file/d/1kk0Q5gf1wbeqW7kLNQP5WGYzfJe6EapK/view?usp=drive_link",
        caption: "Stair Race 3D",
        scalePercent: 75,
        aspectRatio: "9/16"
      },
      {
        type: 'video',
        content: "https://drive.google.com/file/d/1dG44aHTWTa0hsMNxI0r7rr_QJDAjxfRh/view?usp=drive_link",
        caption: "Party Cup Frisbee",
        scalePercent: 75,
        aspectRatio: "9/16"
      },
      {
        type: 'video',
        content: "https://drive.google.com/file/d/1gt3ym9kd4KhXyxXbJTPpHOlnwtnxq-Xj/view?usp=drive_link",
        caption: "Bull Seesaw",
        scalePercent: 75,
        aspectRatio: "16/9"
      },
      {
        type: 'video',
        content: "https://drive.google.com/file/d/101g1ItTlCndHgiAks5EFSpkmK8Ln4F7I/view?usp=drive_link",
        caption: "Gold Mine",
        scalePercent: 75,
        aspectRatio: "16/9"
      }
    ]
  }
];

export default projects;