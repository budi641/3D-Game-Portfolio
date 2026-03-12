export default {
  name: 'blog',
  title: 'Blog Post',
  type: 'document',
  fields: [
    { name: 'title', type: 'string', title: 'Title' },
    { name: 'slug', type: 'slug', title: 'Slug', options: { source: 'title' } },
    { name: 'publishedAt', type: 'datetime', title: 'Published at' },
    { name: 'body', type: 'array', title: 'Body', of: [{ type: 'block' }] }
  ]
}
