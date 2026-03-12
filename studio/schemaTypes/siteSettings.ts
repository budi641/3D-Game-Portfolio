export default {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    { name: 'title', type: 'string', title: 'Site Title' },
    { name: 'description', type: 'text', title: 'Site Description' },
    { name: 'logo', type: 'image', title: 'Logo' }
  ]
}
