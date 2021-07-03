import { esbuildPlugin } from '@web/dev-server-esbuild'

export default {
  nodeResolve: true,
  plugins: [
    esbuildPlugin({
      ts: true,
      tsx: true,
      jsx: true,
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
    }),
  ],
}
