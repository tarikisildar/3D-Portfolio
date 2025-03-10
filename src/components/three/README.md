# 3D Model Loading with React Three Fiber

This directory contains a simplified approach to loading 3D models using React Three Fiber (R3F) from model definitions in models.ts.

## Components

### ModelLoader.tsx

A streamlined model loader that uses React Three Fiber's hooks to load and display 3D models from data defined in models.ts. Features include:

- **Suspense Support**: Works with React's Suspense for lazy loading
- **Preloading**: Preloads models to ensure they're ready when needed
- **Shadow Handling**: Automatically applies shadows to all meshes
- **Simple Animation**: Optional gentle rotation animation
- **Float Effect**: Adds subtle floating animation to models

### ModelExample.tsx

A demonstration component that shows how to use the ModelLoader:

- Loads models directly from models.ts
- Uses Suspense for lazy loading
- Can organize multiple groups of models

## Usage

### Basic Model Loading

```jsx
import { Suspense } from 'react'
import { ModelsGroup, ModelPlaceholder } from './ModelLoader'
import { blogModels } from '@/data/models'

function MyScene() {
  return (
    <Suspense fallback={<ModelPlaceholder />}>
      <ModelsGroup models={blogModels} />
    </Suspense>
  )
}
```

### Model Data Structure

Models are defined in models.ts with this structure:

```typescript
export const blogModels = [
  {
    id: 'model1',
    path: '/models/blog/model.glb',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 0.5,
    animate: true,
    floatOptions: {
      speed: 1,
      rotationIntensity: 0.2,
      floatIntensity: 0.2
    }
  },
  // more models...
]
```

## Key Techniques

1. **Centralized Model Definitions**: All models are defined in models.ts
2. **Lazy Loading**: Using Suspense to load models without blocking the UI
3. **Preloading**: Preloading models with useGLTF.preload
4. **Single Component Approach**: No need to create separate components for each model