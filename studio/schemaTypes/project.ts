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
      name: 'media',
      title: 'Project Media Library',
      type: 'array',
      group: 'media',
      description: 'Playable videos and images shown in project cards/details.',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'type',
              title: 'Media Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Image', value: 'image' },
                  { title: 'Video', value: 'video' },
                ],
              },
              initialValue: 'image',
            },
            {
              name: 'image',
              title: 'Image',
              type: 'image',
              options: { hotspot: true },
              hidden: ({ parent }: any) => parent?.type && parent.type !== 'image',
            },
            {
              name: 'video',
              title: 'Video',
              type: 'file',
              options: { accept: 'video/mp4,video/webm' },
              hidden: ({ parent }: any) => parent?.type && parent.type !== 'video',
            },
            { name: 'caption', title: 'Caption', type: 'string' },
          ],
          preview: {
            select: { title: 'caption', subtitle: 'type', media: 'image' },
            prepare({ title, subtitle, media }: any) {
              return {
                title: title || 'Project media',
                subtitle: subtitle || 'media',
                media,
              }
            },
          },
        },
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
      name: 'links',
      title: 'Project Links',
      type: 'array',
      group: 'meta',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', title: 'Label', type: 'string' },
            { name: 'url', title: 'URL', type: 'url' },
            {
              name: 'type',
              title: 'Type',
              type: 'string',
              options: {
                list: [
                  { title: 'GitHub', value: 'github' },
                  { title: 'Demo', value: 'demo' },
                  { title: 'YouTube', value: 'youtube' },
                  { title: 'Steam', value: 'steam' },
                  { title: 'Itch', value: 'itch' },
                  { title: 'Other', value: 'other' },
                ],
              },
              initialValue: 'other',
            },
          ],
          preview: {
            select: { title: 'label', subtitle: 'url' },
          },
        },
      ],
      description: 'Unlimited project links.',
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
