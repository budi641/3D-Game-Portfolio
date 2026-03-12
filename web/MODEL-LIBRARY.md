# 3D Model Library and Sources

This project is URL-driven for statue/link models. You can paste any public `glb` URL into your model fields.

## Best large libraries

- Objaverse-XL (research-scale): <https://objaverse.allenai.org/>
- ShapeNet (structured categories): <https://shapenet.org/>
- IconScout 3D icons: <https://iconscout.com/3d-icons>
- A23D assets: <https://www.a23d.co/>
- Khronos glTF sample models (stable public examples): <https://github.com/KhronosGroup/glTF-Sample-Models>

## CDN-first workflow

1. Pick/download model (`.glb`).
2. Host on a public CDN (Cloudflare R2, S3+CloudFront, jsDelivr GitHub release, etc.).
3. Use direct URL in the dashboard fields:
   - `statueModelUrl`
   - `modelUrl` (for link relics)
4. Tune:
   - `modelScale`
   - `modelPosition`
   - `modelRotation`
   - `modelAnimated`
   - `spinSpeed`, `floatAmount`, `floatSpeed`, `glowIntensity`

## Where to set in Sanity

- `Scene` document is now the primary place for current visible objects:
  - `sectionStatues[]` (edit existing main statues already in level)
  - `sectionRadius`

- `Section` documents can still be used for content metadata; model controls are mirrored in `scene.sectionStatues` for direct in-level editing.

- `Section` fields (legacy/main statue controls):
  - `statueModelUrl`
  - `statueModelScale`
  - `statueModelPosition` `[x, y, z]`
  - `statueModelRotation` `[x, y, z]` (radians)
  - `statueModelAnimated`
  - `statueSpinSpeed`
  - `statueFloatAmount`
  - `statueFloatSpeed`

- `Scene` document:
  - `sectionRadius` (equidistant circle radius)

Note: Link statues are currently hard-coded in level code (not dashboard-editable by design).

Current dashboard-editable link relic properties (`Scene` -> `linkRelics`):

- `label` (name shown near relic)
- `url` (click target)
- `color` (relic base color)
- `modelScale` (3D model scale)

Dashboard path now uses fixed objects (no "add new" needed):

- `Scene` -> `linkRelics.github`
- `Scene` -> `linkRelics.linkedin`
- `Scene` -> `linkRelics.itch`

## Reliable direct sample URLs (quick testing)

- RobotExpressive: <https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/RobotExpressive/glTF-Binary/RobotExpressive.glb>
- Fox: <https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Fox/glTF-Binary/Fox.glb>
- Flight Helmet: <https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/FlightHelmet/glTF-Binary/FlightHelmet.glb>
- Damaged Helmet: <https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb>
- Lantern: <https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Lantern/glTF-Binary/Lantern.glb>
- BoomBox: <https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/BoomBox/glTF-Binary/BoomBox.glb>

## Notes on branded icons (GitHub/LinkedIn/Itch)

Official brand kits usually publish SVG/PNG, not GLB. For true 3D brand statues:

- Create your own GLB from official SVG logo (Blender extrusion), or
- Use a licensed third-party 3D icon and host it on your CDN.

Then paste the hosted GLB URL into each link relic `modelUrl`.

## Attribution example (GitHub icon)

Provided source:

- Asset page: <https://iconscout.com/3d-icons/github-2>
- Author page: <https://iconscout.com/contributors/unicons>
- Platform: <https://iconscout.com>

Suggested attribution text:

`"github-2" by Unicons Font on IconScout`

How to use this model in the project:

1. Download the `glb` from the IconScout asset page (respect license terms).
2. Upload that file to your CDN/storage.
3. Copy the final public direct `.glb` URL.
4. In Sanity: `Scene` -> `linkRelics[]` -> `GitHub` -> `modelUrl`.
5. Tune `modelScale`, `modelPosition`, `modelRotation`, `modelAnimated`, `spinSpeed`, `floatAmount`, `floatSpeed`, `glowIntensity`.
