export default {
  name: 'project',
  title: 'Project Entity',
  type: 'document',
  groups: [
    { name: 'content', title: 'Narrative Content' },
    { name: 'media', title: 'Visual Assets' },
    { name: 'meta', title: 'System & Discovery' },
  ],
  fields: [
    {
      name: 'title',
      title: 'Project Title',
      type: 'string',
      group: 'content',
      description: 'The main name of the project or case study'
    },
    {
      name: 'slug',
      title: 'URL Identifier',
      type: 'slug',
      group: 'meta',
      options: { source: 'title' },
    },
    {
      name: 'sector',
      title: 'Assigned Sector',
      type: 'reference',
      to: [{ type: 'section' }],
      group: 'content',
      description: 'Which 3D statue does this project belong to?'
    },
    {
      name: 'mainImage',
      title: 'Primary Visual (Hero)',
      type: 'image',
      group: 'media',
      options: { hotspot: true }
    },
    {
      name: 'gallery',
      title: 'Asset Gallery',
      type: 'array',
      group: 'media',
      of: [
        { type: 'image', options: { hotspot: true } },
        { type: 'file', title: 'Video Clip' }
      ],
    },
    {
      name: 'description',
      title: 'Project Narrative',
      type: 'text',
      group: 'content',
      rows: 5
    },
    {
      name: 'technologies',
      title: 'Tech Stack / Tags',
      type: 'array',
      group: 'content',
      of: [{ type: 'string' }],
      options: { 
        layout: 'tags' 
      },
      description: 'Add skills or tools used in this project'
    },
    {
      name: 'featured',
      title: 'Highlight in Simulation',
      type: 'boolean',
      group: 'meta',
      initialValue: false
    },
    {
      name: 'order',
      title: 'List Priority',
      type: 'number',
      group: 'meta'
    },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'mainImage',
      sector: 'sector.title'
    },
    prepare({ title, media, sector }: any) {
      return {
        title,
        media,
        subtitle: sector ? `Sector: ${sector}` : 'No Sector Assigned'
      }
    }
  }
}
