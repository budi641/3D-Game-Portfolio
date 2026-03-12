export default {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  initialValue: {
    title: 'Portfolio Control Hub',
    description: 'Interactive portfolio with game-development inspired visual language.',
    aboutHeadline: 'My Journey',
    contactIntro:
      "I'm always interested in hearing about new opportunities, collaborations, or discussing game development and graphics programming.",
    contactLinks: [
      { label: 'Email', url: 'mailto:aameendev@gmail.com', kind: 'email' },
      { label: 'Phone', url: 'tel:+201094256469', kind: 'phone' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/abdelrahmanameen/', kind: 'social' },
      { label: 'GitHub', url: 'https://github.com/budi641', kind: 'social' },
    ],
    contactRecipientEmail: 'aameendev@gmail.com',
    footerPrimaryText: '© 2026 GAME DEVELOPER PORTFOLIO',
    footerSecondaryText: 'BUILT WITH REACT THREE FIBER + SANITY',
  },
  groups: [
    { name: 'general', title: 'General' },
    { name: 'about', title: 'About Me' },
    { name: 'contact', title: 'Contact' },
  ],
  fields: [
    { name: 'title', type: 'string', title: 'Site Title', group: 'general' },
    { name: 'description', type: 'text', title: 'Site Description', group: 'general' },
    { name: 'logo', type: 'image', title: 'Logo', group: 'general' },
    {
      name: 'footerPrimaryText',
      type: 'string',
      title: 'Footer Primary Text',
      group: 'general',
      description: 'Left side footer text in Normal Mode. Leave empty to hide.',
    },
    {
      name: 'footerSecondaryText',
      type: 'string',
      title: 'Footer Secondary Text',
      group: 'general',
      description: 'Right side footer text in Normal Mode. Leave empty to hide.',
    },
    {
      name: 'aboutPhoto',
      title: 'About Photo',
      type: 'image',
      options: { hotspot: true },
      group: 'about',
    },
    {
      name: 'aboutHeadline',
      title: 'About Headline',
      type: 'string',
      group: 'about',
      initialValue: 'My Journey',
    },
    {
      name: 'aboutContent',
      title: 'About Content',
      type: 'array',
      of: [{ type: 'block' }],
      group: 'about',
      description: 'Main About Me text shown in Normal Mode and About statue panel.',
    },
    {
      name: 'aboutHighlights',
      title: 'About Highlights',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', title: 'Title', type: 'string' },
            { name: 'description', title: 'Description', type: 'text', rows: 3 },
          ],
        },
      ],
      group: 'about',
      description: 'Small highlight cards under About section.',
    },
    {
      name: 'contactIntro',
      title: 'Contact Intro Text',
      type: 'text',
      rows: 4,
      group: 'contact',
      description: 'Intro text shown above links and contact form.',
    },
    {
      name: 'contactRecipientEmail',
      title: 'Contact Form Recipient Email',
      type: 'string',
      group: 'contact',
      description: 'Email where form submissions will be sent.',
    },
    {
      name: 'contactLinks',
      title: 'Contact Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', title: 'Label', type: 'string' },
            { name: 'url', title: 'URL', type: 'string' },
            {
              name: 'kind',
              title: 'Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Email', value: 'email' },
                  { title: 'Phone', value: 'phone' },
                  { title: 'Location', value: 'location' },
                  { title: 'Social', value: 'social' },
                  { title: 'Other', value: 'other' },
                ],
              },
              initialValue: 'social',
            },
          ],
          preview: {
            select: { title: 'label', subtitle: 'url' },
          },
        },
      ],
      group: 'contact',
      description: 'Editable links for the Contact section and Contact statue panel.',
    },
  ]
}
