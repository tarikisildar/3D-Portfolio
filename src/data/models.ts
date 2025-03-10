import { ModelData } from '../components/three/ModelLoader';

// Home page models
export const homeModels: ModelData[] = [
  {
    id: 'boombox',
    path: '/models/home/Booombox.glb',
    position: [-3, -0.1, -0.3],
    rotation: [0, -Math.PI*1.7, 0],
    scale: 0.5,
    animate: false,
    floatOptions: {
      speed: 0.5,
      rotationIntensity: 0.1,
      floatIntensity: 0.1
    }
  },
  {
    id: 'camera',
    path: '/models/home/Camera.glb',
    position: [4, -0.12, -0.5],
    rotation: [0, Math.PI*0.6, 0],
    scale: 0.005,
    animate: false,
    floatOptions: {
      speed: 1,
      rotationIntensity: 0.1,
      floatIntensity: 0.1
    }
  },

  {
    id: 'pixel-sunglasses',
    path: '/models/home/Pixel Sunglasses.glb',
    position: [2, -0.05, 1],
    rotation: [0, -Math.PI*1.2, 0],
    scale: 2,
    animate: false,
    floatOptions: {
      speed: 0,
      rotationIntensity: 0.4,
      floatIntensity: 0.4
    }
  },
  {
    id: 'computer',
    path: '/models/Simple computer.glb',
    position: [-0.4, -0.05, 0.2],
    rotation: [-0.1, -Math.PI*0.9, -0.09],
    scale: 12,
    animate: false,
    floatOptions: {
      speed: 0,
      rotationIntensity: 0.4,
      floatIntensity: 0.4
    }
  }
];

// Projects page models
export const projectsModels: ModelData[] = [
  {
    id: 'police-car',
    path: '/models/projects/Police Car.glb',
    position: [-2, 0, 0],
    rotation: [0, Math.PI * 0.25, 0],
    scale: 1.5,
    animate: false,
    floatOptions: {
      speed: 0.5,
      rotationIntensity: 0.1,
      floatIntensity: 0.1
    }
  },
  {
    id: 'butter-robot',
    path: '/models/projects/Butter Robot.glb',
    position: [0, 0, 0],
    rotation: [0, Math.PI * -0.1, 0],
    scale: 1.0,
    animate: false,
    floatOptions: {
      speed: 1.5,
      rotationIntensity: 0.5,
      floatIntensity: 0.5
    }
  },
  {
    id: 'game-boy',
    path: '/models/projects/Game Boy.glb',
    position: [2, 0, 0],
    rotation: [0, Math.PI * 0.1, 0],
    scale: 2.5,
    animate: false,
    floatOptions: {
      speed: 1.5,
      rotationIntensity: 0.5,
      floatIntensity: 0.5
    }
  }
];

// About page models
export const aboutModels: ModelData[] = [
  {
    id: 'computer',
    path: '/models/Simple computer.glb',
    position: [-0.4, -0.05, 0.2],
    rotation: [-0.1, -Math.PI*0.9, -0.09],
    scale: 12,
    animate: false,
    floatOptions: {
      speed: 0,
      rotationIntensity: 0.4,
      floatIntensity: 0.4
    }
  },
  {
    id: 'kratos',
    path: '/models/about/LoPo Kratos.glb',
    position: [3, 0, -1],
    scale: 0.8,
    animate: false,
    floatOptions: {
      speed: 0,
      rotationIntensity: 0.3,
      floatIntensity: 0.3
    }
  },
  {
    id: 'pretzel',
    path: '/models/about/Pretzel.glb',
    position: [4, 0.5, -2],
    scale: 0.08,
    animate: false,
    floatOptions: {
      speed: 0,
      rotationIntensity: 0.3,
      floatIntensity: 0.3
    }
  },
  {
    id: 'mountain',
    path: '/models/about/Mountain.glb',
    position: [-3, -1, -2],
    scale: 0.08,
    animate: false,
    floatOptions: {
      speed: 0,
      rotationIntensity: 0.3,
      floatIntensity: 0.3
    }
  },
  {
    id: 'moon',
    path: '/models/about/Moon.glb',
    position: [2, 1, -1],
    scale: 0.08,
    animate: false,
    floatOptions: {
      speed: 0,
      rotationIntensity: 0.3,
      floatIntensity: 0.3
    }
  },
  {
    id: 'star',
    path: '/models/about/Star.glb',
    position: [0, -2, 1],
    scale: 0.08,
    animate: false,
    floatOptions: {
      speed: 0,
      rotationIntensity: 0.3,
      floatIntensity: 0.3
    }
  }
];

// CV page models
export const cvModels: ModelData[] = [
  {
    id: 'book-stack',
    path: '/models/cv/Book Stack.glb',
    position: [0, 0, 0],
    scale: 1,
    animate: true
  },
  {
    id: 'polaroids',
    path: '/models/cv/Polaroids.glb',
    position: [3, 0, -1],
    scale: 0.8,
    animate: true,
    floatOptions: {
      speed: 1,
      rotationIntensity: 0.3,
      floatIntensity: 0.3
    }
  },
  {
    id: 'graphics-card',
    path: '/models/cv/Graphics card.glb',
    position: [-3, 0, -2],
    scale: 0.8,
    animate: true,
    floatOptions: {
      speed: 1,
      rotationIntensity: 0.3,
      floatIntensity: 0.3
    }
  },
  {
    id: 'paper-stack',
    path: '/models/cv/Small Stack of Paper.glb',
    position: [0, 2.5, 0],
    scale: 1,
    animate: true,
    floatOptions: {
      speed: 0.5,
      rotationIntensity: 0.2,
      floatIntensity: 0.2
    }
  }
];

// Blog page models
export const blogModels: ModelData[] = [
  {
    id: 'cassette',
    path: '/models/blog/Cassette.glb',
    position: [-2, 0, 0],
    rotation: [0, Math.PI * 0.2, 0],
    scale: 1.5,
    animate: false,
    floatOptions: {
      speed: 1.5,
      rotationIntensity: 0.2,
      floatIntensity: 0.3
    }
  },
  {
    id: 'camera',
    path: '/models/blog/Camera.glb',
    position: [0, 0, 0],
    rotation: [0, Math.PI * -0.15, 0],
    scale: 2.0,
    color: '#f5f5f5',
    animate: false,
    floatOptions: {
      speed: 1,
      rotationIntensity: 0.1,
      floatIntensity: 0.2
    }
  },
  {
    id: 'coffee-bean',
    path: '/models/blog/Coffee bean.glb',
    position: [2, 0, 0],
    rotation: [0, Math.PI * 0.2, 0],
    scale: 2.0,
    animate: false,
    floatOptions: {
      speed: 1.5,
      rotationIntensity: 0.2,
      floatIntensity: 0.3
    }
  },
  {
    id: 'coffee-machine',
    path: '/models/blog/Coffee Machine.glb',
    position: [4, 0, 0],
    rotation: [0, Math.PI * -0.1, 0],
    scale: 2.0,
    animate: false,
    floatOptions: {
      speed: 1.5,
      rotationIntensity: 0.2,
      floatIntensity: 0.3
    }
  }
];

// 404 page models - Since no models are available in the not-found folder
// Using models from other categories as placeholders
export const notFoundModels: ModelData[] = [
  {
    id: '404-model',
    path: '/models/projects/Game Boy.glb',
    position: [0, 0, 0],
    scale: 1,
    color: '#f43f5e',
    animate: true
  },
  {
    id: 'not-found-model',
    path: '/models/about/Star.glb',
    position: [0, -2, 0],
    scale: 1,
    color: '#ffffff',
    floatOptions: {
      speed: 0.5,
      rotationIntensity: 0.2,
      floatIntensity: 0.2
    }
  }
];