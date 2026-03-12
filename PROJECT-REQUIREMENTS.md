# 3D Game Portfolio - Complete Requirements & Delivery Specification

## 1. Purpose and Scope

This document is the complete requirements baseline for the 3D portfolio project. It defines:

- Product vision and user experience goals
- Functional features and interaction behavior
- Technical stack and architecture constraints
- CMS ownership and editable content boundaries
- Accessibility, quality, and performance expectations
- Delivery phases and acceptance criteria

This project is an Unreal-inspired, highly interactive portfolio website with two synchronized experiences:

- **Game Mode**: real-time 3D explorable portfolio
- **Normal Mode**: fully accessible traditional web layout

Both modes must be powered by one source of truth in Sanity CMS.

---

## 2. Product Vision

### 2.1 Creative Direction

The site should feel like a playable Unreal prototype level:

- Greybox/primitives-first environment
- Visible grid floor
- Engine-like viewport chrome and controls
- Third-person movement
- Interactive statues as content portals

The experience must be modern, polished, and visually coherent using a dark grey + blue design system.

### 2.2 Primary Inspiration

- [Bruno Simon - Portfolio](https://bruno-simon.com/)
- [Unreal Engine](https://www.unrealengine.com/)

---

## 3. Audience and Use Cases

### 3.1 Primary users

- Recruiters reviewing projects and experience
- Clients evaluating design/technical capability
- Collaborators reviewing technical skills and process

### 3.2 Core user goals

- Explore portfolio in a unique interactive 3D format
- Quickly switch to an accessible standard layout
- View projects, media, resume-like sections, and contact details
- Navigate smoothly on desktop and mobile

---

## 4. Non-Negotiable Constraints

- Use free tools and services for implementation.
- Sanity is the content source of truth for editable data.
- Fonts are fixed in code (not CMS editable).
- No Sanity preview requirement; separate full level-editor workflow is desired.
- All locked decisions in `LOCKED-DECISIONS.md` must be respected.

---

## 5. Experience Modes

## 5.1 Game Mode (3D)

### Required behavior

- Fullscreen 3D viewport with Unreal-inspired top chrome
- Third-person controllable character
- Minimap in top-right corner
- Stop/Quit button to switch to Normal Mode
- Respawn action ("I'm stuck")
- Statue interactions that reveal section content

### Required controls

- Move: `WASD` and Arrow keys
- Sprint: `Shift`
- Jump: `Space`
- Rotate/look: hold left mouse + drag
- Zoom camera distance: mouse wheel
- Interact with statues/objects: left click

### First-time onboarding

- Show loading/constructing screen before viewport
- Show controls modal at first entry
- Include note explaining Game Mode vs Normal Mode switching

## 5.2 Normal Mode (Accessible)

### Required structure

- Semantic layout with: `main`, `nav`, multiple `section`, one top-level `h1`
- Hamburger navigation menu
- Green PIE button to return to Game Mode

### Required behavior

- Uses exact same underlying content source as Game Mode
- Fully usable without 3D support
- Supports keyboard and screen reader interaction
- Maintains visual quality and responsive design

---

## 6. Scene and World Requirements

## 6.1 World composition

- Greybox/prototype style environment
- Dense primitive composition (box/sphere/cylinder/cone/etc.)
- Mixed visual material styles:
  - Prototype matte
  - Metallic
  - Reflective
  - Wireframe and floating decorative elements

## 6.2 Floor and environment

- Visible grid floor at world ground plane
- Cube map/environment map configurable from CMS
- Environment contributes to PBR reflections and ambient lighting

## 6.3 Construction effect

- Matrix-like real-time "scene constructing" effect on load
- Must be disabled/skipped under reduced motion preference

---

## 7. Statues and Section Navigation System

## 7.1 Section-to-statue mapping

Each core content section is represented by one statue:

- Projects
- Education
- Work
- Skills
- Contact
- About
- Blog/Notes (from day one)

## 7.2 Interaction sequence

1. Player approaches statue
2. Nearby section ground label appears/floats
3. Statue reconstructs from primitives
4. Player clicks statue
5. Camera transitions smoothly to statue focus view
6. UI controls appear for content state navigation and exit

## 7.3 Content presentation

- Content shown as dynamic 2D/HTML overlays (for accessibility, links, forms)
- Multiple state support (list/detail/tabs/pagination where needed)
- Exit returns user to exploration camera state

---

## 8. Character and Movement Requirements

## 8.1 Character source and animation

From CMS, user can configure:

- Character GLB/GLTF
- Animation clip names: idle, walk, run, jump
- Move speed
- Sprint speed
- Jump height
- Capsule radius and height

## 8.2 Physics and controller requirements

- Use kinematic physics movement with collision-aware motion
- Required movement traits:
  - Grounded detection
  - Gravity and jump
  - Air control
  - Slope/step handling
  - Collision sliding
  - Respawn to fixed spawn

## 8.3 Camera behavior

- Third-person follow camera
- Vertical pitch limits
- Zoom min/max limits
- Smooth and consistent camera-target alignment with player state

---

## 9. Rendering and Visual Quality Requirements

## 9.1 PBR baseline

- Physically based materials and lighting behavior
- Environment IBL support
- Correct color management (sRGB output)
- Filmic tone mapping for cinematic contrast

## 9.2 Lighting and shadows

- Directional key light with quality shadow setup
- Fill/ambient balancing for readable geometry
- Contact/grounded shadows for depth

## 9.3 Post-processing

- Subtle but high-quality effects (e.g. antialiasing, bloom)
- Effects must remain tasteful and not reduce readability

---

## 10. CMS and Data Ownership (Sanity)

Sanity must support no-code content operations for all non-engineering updates.

## 10.1 Editable domains

- Global site settings (contact recipient email, default SEO)
- Sections and ordering
- Projects and featured state
- Project media galleries (images/videos)
- Education and work timelines
- Skills
- About profile and links
- Blog posts
- Scene settings and primitives
- Character settings
- Media library assets

## 10.2 Editorial capabilities

- Add/remove/reorder sections
- Publish/unpublish entries
- Update links/text/media without deploy-time code changes
- Manage alt text (optional with reminder)

## 10.3 Required desk organization

- `Content | Media | Scene | Settings`

Detailed schema source: `SANITY-SCHEMA.md`

---

## 11. UI and Design System Requirements

## 11.1 Visual system

- Dark, modern palette with blue accent hierarchy
- Consistent spacing, radius, typography, shadow tokens
- Clear visual states (default/hover/active/focus/disabled)

## 11.2 UX quality targets

- Interface must feel intentional and premium, not placeholder
- Game and Normal modes must feel like one product family
- Responsiveness across typical desktop/laptop/tablet/mobile widths

## 11.3 Engine-style chrome

- Unreal-inspired top bar control language
- Compact, readable, non-cluttered controls
- Clear iconography and tooltips

---

## 12. Accessibility Requirements

- Honor `prefers-reduced-motion: reduce` by disabling/skipping major animation systems
- Strong visible focus indicator (custom blue glow/outline)
- Keyboard-accessible interactive controls
- Semantic HTML in Normal Mode
- Screen-reader friendly labels and roles
- Mobile mode prompt choice: "Try Normal Mode for a smoother experience?"

---

## 13. Performance and Quality Requirements

## 13.1 Runtime quality controls

- Quality profiles:
  - Low
  - Medium
  - High
- Persist quality preference (e.g., local storage)

## 13.2 Stability goals

- Smooth interaction and camera motion
- Predictable input response
- Avoid heavy effects that destabilize low-end devices

## 13.3 Scalability expectations

- Scene complexity and effects should degrade gracefully with quality profile

---

## 14. Tech Stack (Approved)

- **Frontend app**: React + TypeScript + Vite
- **3D rendering**: Three.js through React Three Fiber
- **3D utilities**: Drei
- **Physics**: Rapier via `@react-three/rapier`
- **Postprocessing**: `@react-three/postprocessing`
- **CMS**: Sanity (Studio + Client)
- **Styling**: Tailwind CSS + CSS variable design tokens

---

## 15. Delivery Plan (Phased)

## Phase 1 - Foundation

- App architecture, mode switching, global state/providers
- Initial scene with grid, primitives, base lighting
- Basic viewport chrome and Normal Mode shell

## Phase 2 - Core Gameplay UX

- Kinematic character controller
- Camera and zoom mechanics
- Minimap, respawn, quality toggle shell

## Phase 3 - Content Interaction Layer

- Statue reconstruction/interaction logic
- Camera focus transitions
- HTML overlay content states

## Phase 4 - CMS Integration

- Full Sanity schema + Studio
- Data fetching and rendering in both modes
- Section ordering and featured logic

## Phase 5 - Polish and Accessibility

- Reduced-motion behavior
- Focus and keyboard hardening
- UI polish pass and responsive tuning

## Phase 6 - Migration and Launch Readiness

- Old portfolio content migration
- QA checklist sign-off
- Performance and accessibility verification

---

## 16. Acceptance Criteria (Definition of Done)

The project is complete when all of the following are true:

- Game Mode and Normal Mode both work and are content-synchronized.
- Character movement is kinematic, collision-aware, and configurable from CMS settings.
- Each core section is represented by an interactive statue.
- Projects support featured ordering and mixed media gallery.
- Blog exists as day-one section/statue.
- Contact recipient email is controlled through CMS.
- Scene/environment settings can be changed from CMS.
- Reduced motion and focus accessibility requirements are met.
- UI is consistent with the design system and appears modern/polished.
- Content migration path from legacy portfolio is documented and executable.

---

## 17. Risks and Mitigation

- **Risk:** 3D performance variation across devices  
  **Mitigation:** quality presets, conservative defaults, measured postprocessing.

- **Risk:** Complex interaction logic between camera/player/statues  
  **Mitigation:** clear state machine boundaries and staged implementation.

- **Risk:** CMS schema drift during development  
  **Mitigation:** lock schema contract and version update notes.

- **Risk:** Accessibility regressions in highly visual UI  
  **Mitigation:** regular keyboard/screen-reader QA and focus audits.

---

## 18. References and Inspiration

## Product/style references

- [Bruno Simon - Portfolio](https://bruno-simon.com/)
- [Unreal Engine](https://www.unrealengine.com/)
- [Unreal Engine Documentation](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-6-documentation)

## Technical references

- [Three.js](https://threejs.org/)
- [React Three Fiber](https://r3f.docs.pmnd.rs/)
- [Drei](https://github.com/pmndrs/drei)
- [React Three Rapier](https://github.com/pmndrs/react-three-rapier)
- [Rapier Physics Docs](https://rapier.rs/docs/)
- [Sanity Documentation](https://www.sanity.io/docs)
- [Vite Documentation](https://vite.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 19. Source Documents

This master document consolidates these repo docs:

- `SPEC.md`
- `LOCKED-DECISIONS.md`
- `SANITY-SCHEMA.md`
- `SUGGESTIONS.md`

If there is a conflict, treat `LOCKED-DECISIONS.md` as the final authority for product decisions.

