export default {
  name: 'blog',
  title: 'Blog Post',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content' },
    { name: 'media', title: 'Media' },
    { name: 'meta', title: 'Meta' },
  ],
  fields: [
    { name: 'title', type: 'string', title: 'Title', group: 'content' },
    { name: 'slug', type: 'slug', title: 'Slug', options: { source: 'title' }, group: 'meta' },
    { name: 'publishedAt', type: 'datetime', title: 'Published at', group: 'meta' },
    {
      name: 'body',
      type: 'array',
      title: 'Body',
      group: 'content',
      of: [{ type: 'block' }],
      description: 'Main blog post content.',
    },
    {
      name: 'media',
      title: 'Media Gallery',
      type: 'array',
      group: 'media',
      description: 'Images and videos to display in the post (like project media).',
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
                title: title || 'Blog media',
                subtitle: subtitle || 'media',
                media,
              }
            },
          },
        },
      ],
    },
  ],
}
