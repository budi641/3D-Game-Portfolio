export default {
  name: 'education',
  title: 'Education',
  type: 'document',
  fields: [
    { name: 'institution', type: 'string', title: 'Institution / Academy' },
    { name: 'logo', type: 'image', title: 'Academy Logo' },
    { name: 'degree', type: 'string', title: 'Major / Degree' },
    { name: 'period', type: 'string', title: 'Study Period', description: 'e.g. 2018 - 2022' }
  ],
  preview: {
    select: {
      title: 'degree',
      subtitle: 'institution',
      media: 'logo'
    }
  }
}
