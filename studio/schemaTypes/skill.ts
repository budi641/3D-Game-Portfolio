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
      title: 'Classification',
      type: 'string',
      group: 'details',
      options: {
        list: [
          { title: 'Programming', value: 'programming' },
          { title: 'Design', value: 'design' },
          { title: 'Graphics & VFX', value: 'graphics' },
          { title: 'Game Production', value: 'production' },
          { title: 'Tools & Architecture', value: 'tools' },
        ],
      },
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
