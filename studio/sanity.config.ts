import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { colorInput } from '@sanity/color-input'
import { schemaTypes } from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: '3D Game Portfolio',

  projectId: 'wsg4349i',
  dataset: 'production',

  plugins: [deskTool(), visionTool(), colorInput()],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev) => prev, // Keep all default actions including Delete
  },
})
