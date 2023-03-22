import { defineConfig } from 'vite';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

console.log(monacoEditorPlugin)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [(monacoEditorPlugin as any).default({})],
})
