import { transformSync } from '@babel/core'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig, type Plugin } from 'vite'

// The code-builder preview is built with VITE_SELECT_MODE=1 (see _start_preview
// in sessions.py). Only then do we stamp elements for the visual select/edit
// overlay — a real deploy build runs without the flag and stays completely clean.
const SELECT_MODE = process.env.VITE_SELECT_MODE === '1'

const SRC_DIR = path.resolve(__dirname, 'src')

// Babel visitor: stamp every JSX element with data-sel-id="<file>:<line>:<col>"
// so the parent (www) can map a clicked DOM node back to a stable identity.
// babel AST nodes are untyped here
function stampSelectionIds({ types: t }: { types: any }) {
  return {
    name: 'stamp-selection-ids',
    visitor: {
      JSXOpeningElement(elementPath: any, state: any) {
        const node = elementPath.node
        if (!node.loc) return // generated nodes
        const already = node.attributes.some(
          (attr: any) => attr.type === 'JSXAttribute' && attr.name?.name === 'data-sel-id',
        )
        if (already) return
        const filename: string = state.filename ?? ''
        const rel = path.relative(SRC_DIR, filename).split(path.sep).join('/')
        const { line, column } = node.loc.start
        // Insert as the FIRST attribute (fallback), NOT the last. A shadcn-style
        // primitive spreads `{...props}` onto its root (`<span {...props}/>`), and the
        // call site's data-sel-id rides in via props. If our stamp came AFTER that
        // spread it would OVERRIDE the call-site id, so the DOM node would carry the
        // ui-primitive's own id (e.g. ui/badge.tsx:…) instead of the call site
        // (Badges.tsx:…) — which is what the extractor's tree uses, so a preview click
        // would report an id absent from the tree and select/scroll nothing. Stamping
        // first makes a propagated data-sel-id win, keeping the DOM id == the tree id.
        node.attributes.unshift(
          t.jsxAttribute(
            t.jsxIdentifier('data-sel-id'),
            t.stringLiteral(`${rel}:${line}:${column}`),
          ),
        )
      },
    },
  }
}

// @vitejs/plugin-react v6 (rolldown/oxc) does NOT run user babel plugins — it
// compiles JSX with oxc. So we run our own syntax-only babel pass as an
// enforce:'pre' transform (JSX preserved) to stamp elements before oxc handles
// them. Active only in the VITE_SELECT_MODE preview build.
function selectionStampPlugin(): Plugin {
  return {
    name: 'ua-selection-stamp',
    enforce: 'pre',
    transform(code, id) {
      const file = id.split('?')[0]
      if (!file.startsWith(SRC_DIR) || !/\.[jt]sx$/.test(file)) return null
      const result = transformSync(code, {
        filename: file,
        babelrc: false,
        configFile: false,
        // parse only — keep JSX + TS in the output for oxc to compile
        parserOpts: { plugins: ['jsx', 'typescript'] },
        plugins: [stampSelectionIds],
        sourceMaps: true,
      })
      if (!result?.code) return null
      return { code: result.code, map: result.map }
    },
  }
}

export default defineConfig({
  // An engine-hosted build is served from an absolute subpath (the live preview, a
  // historical version), which the engine bakes in as VITE_APP_BASE at build time
  // (_run_preview_build / _version_build_env in sessions.py). Absolute makes index.html
  // reference assets absolutely, so deep links load the JS/CSS at ANY depth — a relative
  // base resolves './assets/…' against the deep-linked directory and 404s below the first
  // level. It is also where App.tsx's router basename comes from (read back as BASE_URL).
  // A deploy build (no VITE_APP_BASE) keeps the relative './' base and runs at the root.
  base: process.env.VITE_APP_BASE || './',
  build: {
    // Preview builds write the default `dist/`. A deploy/publish build overrides this to
    // `deployed/dist` (VITE_OUT_DIR, set by the engine's _run_deploy_build) so the
    // published bundle lands in app/deployed/dist and NEVER overwrites the live preview at
    // app/dist — the preview keeps serving throughout a publish (no flash).
    outDir: process.env.VITE_OUT_DIR || 'dist',
  },
  plugins: [react(), tailwindcss(), ...(SELECT_MODE ? [selectionStampPlugin()] : [])],
  resolve: {
    alias: {
      // the SDK is vendored (src/@unifyapps/app-builder-sdk); keep the old npm
      // specifier resolving so existing generated apps still build
      '@unifyapps/app-builder-sdk': path.resolve(__dirname, './src/@unifyapps/app-builder-sdk'),
      '@': path.resolve(__dirname, './src'),
    },
  },
})
