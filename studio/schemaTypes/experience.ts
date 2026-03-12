export default {
  name: 'experience',
  title: 'Work Experience',
  type: 'document',
  groups: [
    { name: 'main', title: 'Main Info' },
    { name: 'details', title: 'Work Details' },
  ],
  fields: [
    {
      name: 'company',
      title: 'Company / Studio',
      type: 'string',
      group: 'main'
    },
    {
      name: 'logo',
      title: 'Company Logo',
      type: 'image',
      options: { hotspot: true },
      group: 'main'
    },
    {
      name: 'role',
      title: 'Job Title / Role',
      type: 'string',
      group: 'main'
    },
    {
      name: 'period',
      title: 'Active Period',
      type: 'string',
      description: 'e.g. June 2021 - Present',
      group: 'main'
    },
    {
      name: 'description',
      title: 'Key Contributions',
      type: 'text',
      rows: 4,
      group: 'details'
    },
    {
      name: 'skills',
      title: 'Applied Technologies',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      group: 'details'
    }
  ],
  preview: {
    select: {
      title: 'role',
      subtitle: 'company',
      media: 'logo'
    }
  }
}
