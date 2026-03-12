# 3D Portfolio Optimization Guide

Optimizations applied to maintain 60 FPS while retaining visuals (animations, cell shading, sky, models).

## Implemented Optimizations

### 1. Animation Distance Culling
- **Statues & Link Relics**: Animations pause when player is far (>12–14 units)
- Saves CPU on 10+ animated models when exploring

### 2. Frustum Culling
- All model meshes have `frustumCulled = true` (Three.js default)
- Sky sphere uses `frustumCulled = false` (camera is inside)

### 3. Performance Tier Geometry
- **Low tier**: Reduced ring segments (32 platform, 24 link relic), sky sphere 16 segments
- **Grid**: Hidden on low tier

### 4. Distance-Based LOD (Placeholder Geometry)
- **Statues**: When player >38 units away → simple colored box (8 vertices). When <28 units → full model
- **Link Relics**: When far → simple cylinder (8 segments). When near → full model
- Models are not loaded until player approaches (lazy loading + LOD)

### 5. GLB Model Optimization Script
```bash
npm run optimize-models
```
Uses `gltf-transform` with meshopt compression. No decoder needed—works with drei useGLTF out of the box.

Output: `public/Models-optimized/`. Replace originals: `cp public/Models-optimized/* public/Models/`

### 6. FPS Stabilization
- Drop to low tier after 5 frames below 52 FPS
- Upgrade to high tier only after 300 frames (~5 sec) above 59 FPS
- FPS display updates every 30 frames to reduce React re-renders

## Recommended Pipeline (Manual)

### Model Compression
```bash
npm run optimize-models
# Then replace: cp public/Models-optimized/* public/Models/
```

### Texture Limits
- Hero assets: 1024×1024 max
- Props: 512×512
- Small props: 256×256

### Target Budgets
- Draw calls: <150
- Triangles: <300k total scene
- Textures: <100MB GPU
- Lights: 1–2 (we use 3: ambient, point, directional)
- Shadow casters: 0 on low tier, 1 on high
- Active animations: Paused when far

## Cell Shading
Uses `MeshToonMaterial` (single-pass). No post-process edge detection.
