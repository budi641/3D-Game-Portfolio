export default {
  name: 'section',
  title: 'Sector (3D Statue)',
  type: 'document',
  groups: [
    { name: 'visual', title: 'Visuals & Identity' },
    { name: 'model', title: '3D Model & Animation' },
    { name: 'spatial', title: 'Spatial Placement' },
  ],
  fields: [
    { 
      name: 'title', 
      title: 'Sector Name', 
      type: 'string',
      description: 'The name displayed above the statue',
      group: 'visual'
    },
    {
      name: 'type',
      title: 'Geographic Type',
      type: 'string',
      group: 'visual',
      options: {
        list: [
          { title: 'Hero (Icosahedron)', value: 'hero' },
          { title: 'Utility (Dodecahedron)', value: 'utility' },
          { title: 'Pillar (Box)', value: 'pillar' },
          { title: 'Gear (Torus Knot)', value: 'gear' },
          { title: 'Core (Sphere)', value: 'core' },
        ],
      },
    },
    {
      name: 'archetype',
      title: 'Section Archetype',
      type: 'string',
      group: 'visual',
      options: {
        list: [
          { title: 'Projects', value: 'projects' },
          { title: 'Education', value: 'education' },
          { title: 'Work', value: 'work' },
          { title: 'Skills', value: 'skills' },
          { title: 'Contact', value: 'contact' },
          { title: 'About', value: 'about' },
          { title: 'Blog', value: 'blog' },
        ],
      },
    },
    {
      name: 'color',
      title: 'Brand Color',
      type: 'string',
      group: 'visual',
      description: 'Hex color for the statue and highlights',
      initialValue: '#3b82f6',
      options: {
        list: [
          { title: 'Cyber Blue', value: '#3b82f6' },
          { title: 'Neon Red', value: '#ef4444' },
          { title: 'Emerald Green', value: '#10b981' },
          { title: 'Warning Orange', value: '#f59e0b' },
          { title: 'Royal Purple', value: '#8b5cf6' },
          { title: 'Pure Ghost', value: '#ffffff' },
        ]
      }
    },
    {
      name: 'statueModelUrl',
      title: 'Statue GLB URL',
      type: 'url',
      group: 'model',
      description: 'Direct public .glb link (CDN, S3, jsDelivr, etc.)',
    },
    {
      name: 'statueModelScale',
      title: 'Model Scale',
      type: 'number',
      group: 'model',
      initialValue: 1,
    },
    {
      name: 'statueModelPosition',
      title: 'Model Position Offset',
      type: 'array',
      group: 'model',
      of: [{ type: 'number' }],
      validation: (Rule: any) => Rule.length(3),
      initialValue: [0, 0.35, 0],
      description: '[x, y, z] offset relative to statue center',
    },
    {
      name: 'statueModelRotation',
      title: 'Model Rotation',
      type: 'array',
      group: 'model',
      of: [{ type: 'number' }],
      validation: (Rule: any) => Rule.length(3),
      initialValue: [0, 0, 0],
      description: '[x, y, z] in radians',
    },
    {
      name: 'statueModelAnimated',
      title: 'Play GLB animation clips',
      type: 'boolean',
      group: 'model',
      initialValue: true,
    },
    {
      name: 'statueSpinSpeed',
      title: 'Spin Speed',
      type: 'number',
      group: 'model',
      initialValue: 1.2,
      description: 'Higher = faster spin',
    },
    {
      name: 'statueFloatAmount',
      title: 'Float Amount',
      type: 'number',
      group: 'model',
      initialValue: 0.12,
      description: 'Vertical bob amount',
    },
    {
      name: 'statueFloatSpeed',
      title: 'Float Speed',
      type: 'number',
      group: 'model',
      initialValue: 2.4,
    },
    {
      name: 'position',
      title: '3D Placement',
      type: 'object',
      group: 'spatial',
      description: 'Coordinates in meters (e.g. 0, 0, -35)',
      fields: [
        { name: 'x', type: 'number', initialValue: 0 },
        { name: 'y', type: 'number', initialValue: 0, description: 'Ground is 0' },
        { name: 'z', type: 'number', initialValue: 0 },
      ],
      options: {
        columns: 3
      }
    },
    { 
      name: 'order', 
      title: 'Render Priority', 
      type: 'number',
      group: 'spatial'
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'type',
    },
  },
}
