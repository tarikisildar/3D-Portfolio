import type { AboutData } from '@/data/about'

/**
 * The About page as it stood during the Nuremberg years.
 *
 */
const nurembergAbout: AboutData = {
  profilePic: "/images/tarik/munich-marathon.jpg",
  name: "Tarik Isildar",
  title: "Software Engineer - Graphics",
  bio: [
    "I'm a Software Engineer with an M.Sc. from the Technical University of Munich, where I've focused on real-time rendering, autonomous systems, and AI-powered solutions.",
    "I truly enjoy building software, I'm missing the old days of spending hours trying to figure out how to make the piece of code more clean and robust and nitpick on small typos. And in contrast I nowadays find myself vibing more often than not, and I am mostly working on 5 things on parallel.",
    "From the first years of my career, I got good at creating PoCs and communicate it's potential impacts to the other stakeholders. I believe an image tells a story better than a thousand words, and that's why I believed no one would read my webpage but the interaction I built can make people remember some things from it. ",
    "When I'm not nerding on a computer program, you'll find me in a specialty coffee place, signing up my next marathon, or searching for people to go karaoke with ;)"
  ],
  skills: [
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
}

export default nurembergAbout
