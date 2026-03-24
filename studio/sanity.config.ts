import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './schemaTypes/index'

export default defineConfig({
  name: 'default',
  title: 'PhysicaNova',

  projectId: '3778qog4', // TODO: `.env` veya panelden alınacak ID
  dataset: 'production',

  plugins: [structureTool()],

  schema: {
    types: schemaTypes,
  },
})
