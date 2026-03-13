export default {
  name: 'skill',
  title: 'Skill Matrix',
  type: 'document',
  groups: [
    { name: 'details', title: 'Skill Details' },
    { name: 'visual', title: 'Asset & Branding' },
  ],
  fields: [
    {
      name: 'title',
      title: 'Skill Name',
      type: 'string',
      group: 'details'
    },
    {
      name: 'icon',
      title: 'Icon / Image',
      type: 'image',
      group: 'visual'
    },
    {
      name: 'level',
      title: 'Proficiency Level (0-100)',
      type: 'number',
      group: 'details',
      validation: (Rule: any) => Rule.min(0).max(100),
      description: 'Used for animated progress bars',
      initialValue: 80
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      group: 'details',
      description: 'Group for display in the skills matrix.',
      options: {
        list: [
          { title: 'Game Development', value: 'Game Development' },
          { title: 'Web Development', value: 'Web Development' },
          { title: '3D & Graphics', value: '3D & Graphics' },
          { title: 'Tools', value: 'Tools' },
          { title: 'Programming', value: 'Programming' },
          { title: 'Design', value: 'Design' },
          { title: 'General', value: 'General' },
        ],
      },
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      group: 'details',
      description: 'Lower numbers appear first. Leave empty for alphabetical.',
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      media: 'icon'
    }
  }
}
