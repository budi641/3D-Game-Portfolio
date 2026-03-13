import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { colorInput } from '@sanity/color-input'
import { schemaTypes } from '../../../studio/schemaTypes'

const studioConfig = defineConfig({
  name: 'default',
  title: '3D Game Portfolio',
  projectId: 'wsg4349i',
  dataset: 'production',
  basePath: '/studio',
  plugins: [deskTool(), visionTool(), colorInput()],
  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev) => prev, // Keep all default actions including Delete for blog
  },
})

export default studioConfig

