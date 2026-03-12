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
    // Reuse the existing Studio schemas from /studio/schemaTypes
    types: schemaTypes,
  },
})

export default studioConfig

