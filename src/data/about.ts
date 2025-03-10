export interface Skill {
  name: string;
  level: number; // 1-10
  category: 'graphics' | 'robotics' | 'programming' | 'other';
}

export interface Experience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string | 'Present';
  description: string[];
}

export interface Education {
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface AboutData {
  name: string;
  title: string;
  bio: string[];
  skills: Skill[];
  experience: Experience[];
  education: Education[];
}

const aboutData: AboutData = {
  name: "Tarik Isildar",
  title: "Computer Graphics & Robotics Specialist",
  bio: [
    "I'm a Computer Graphics and Robotics specialist with an M.Sc. from the Technical University of Munich, where I've focused on real-time rendering, autonomous systems, and AI-powered solutions.",
    "Over the years, I've worked on exciting projects ranging from autonomous vehicle systems to real-time visualization tools, blending technical expertise with creativity to solve complex challenges.",
    "My expertise spans multiple domains including real-time rendering, physics simulation, computer vision, and robotic motion planning. I'm particularly passionate about creating visually stunning and technically impressive applications that push the boundaries of what's possible.",
    "When I'm not immersed in algorithms or optimizing GPU performance, you'll find me enjoying photography with a retro aesthetic, exploring music from vinyl records to cassettes, hunting for the perfect coffee brew, or benching. I bench 100 kilos suiii."
  ],
  skills: [
    { name: "OpenGL/Vulkan", level: 9, category: "graphics" },
    { name: "GLSL/HLSL", level: 8, category: "graphics" },
    { name: "Ray Tracing", level: 8, category: "graphics" },
    { name: "WebGL/Three.js", level: 7, category: "graphics" },
    { name: "Unity3D/Unreal", level: 8, category: "graphics" },
    { name: "GPU Programming", level: 8, category: "graphics" },
    { name: "Computer Vision", level: 9, category: "robotics" },
    { name: "ROS", level: 8, category: "robotics" },
    { name: "Motion Planning", level: 8, category: "robotics" },
    { name: "Sensor Fusion", level: 7, category: "robotics" },
    { name: "SLAM", level: 7, category: "robotics" },
    { name: "Control Systems", level: 7, category: "robotics" },
    { name: "C++", level: 9, category: "programming" },
    { name: "Python", level: 8, category: "programming" },
    { name: "CUDA", level: 7, category: "programming" },
    { name: "TensorFlow/PyTorch", level: 7, category: "programming" },
    { name: "JavaScript/WebGL", level: 7, category: "programming" },
    { name: "Git/CI/CD", level: 8, category: "other" },
    { name: "3D Modeling", level: 6, category: "other" },
    { name: "UI/UX Design", level: 6, category: "other" }
  ],
  experience: [
    {
      title: "Senior Computer Graphics Engineer",
      company: "Visual Dynamics GmbH",
      location: "Munich, Germany",
      startDate: "Jan 2021",
      endDate: "Present",
      description: [
        "Lead the development of a real-time global illumination rendering engine for architectural visualization and VR applications.",
        "Implemented and optimized advanced rendering techniques including path tracing, screen space reflections, and physically-based materials.",
        "Collaborated with the VR team to create immersive experiences with photorealistic rendering that maintained high frame rates.",
        "Mentored junior engineers and guided technical decisions for rendering pipeline architecture and optimization strategies."
      ]
    },
    {
      title: "Robotics Research Engineer",
      company: "Autonomous Systems Lab",
      location: "Munich, Germany",
      startDate: "Mar 2018",
      endDate: "Dec 2020",
      description: [
        "Designed and implemented perception systems for autonomous vehicles using computer vision and deep learning techniques.",
        "Developed object detection and tracking algorithms that fused data from multiple sensors (cameras, LiDAR, radar) for robust perception.",
        "Created and maintained a simulation environment for testing perception algorithms in various scenarios and lighting conditions.",
        "Published two research papers on sensor fusion techniques for autonomous navigation in challenging environments."
      ]
    },
    {
      title: "Computer Vision Engineer",
      company: "MedTech Innovations",
      location: "Berlin, Germany",
      startDate: "Jun 2016",
      endDate: "Feb 2018",
      description: [
        "Developed volumetric rendering techniques for medical imaging applications, enabling real-time visualization of CT and MRI data.",
        "Implemented segmentation algorithms to identify and isolate specific anatomical structures in medical scans.",
        "Created interactive tools for surgeons to plan procedures using 3D visualizations of patient-specific anatomy.",
        "Optimized rendering algorithms for performance on standard medical workstations, achieving a 2x performance improvement."
      ]
    }
  ],
  education: [
    {
      degree: "M.Sc. in Computer Science (Specialization in Computer Graphics and Robotics)",
      institution: "Technical University of Munich",
      location: "Munich, Germany",
      startDate: "Sep 2014",
      endDate: "Jul 2016",
      description: "Graduated with honors. Master's thesis on 'Real-time Global Illumination Techniques for Dynamic Scenes' received the department's outstanding thesis award."
    },
    {
      degree: "B.Sc. in Computer Engineering",
      institution: "Middle East Technical University",
      location: "Ankara, Turkey",
      startDate: "Sep 2010",
      endDate: "Jun 2014",
      description: "Graduated summa cum laude. Senior project focused on computer vision-based navigation for mobile robots."
    }
  ]
};

export default aboutData;