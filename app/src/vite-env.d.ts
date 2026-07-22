/// <reference types="vite/client" />

interface ImportMetaEnv {
  // baked to "1" only in the code-builder preview build (see vite.config.ts)
  readonly VITE_SELECT_MODE?: string
  // the app's application / interface id (== the session id), injected by the
  // engine as build-time env on every build — always present
  readonly VITE_APPLICATION_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
