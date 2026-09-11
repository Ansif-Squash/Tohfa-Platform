/**
 * Ambient module declarations for static image imports.
 *
 * Metro resolves `require('./some.png')` to a packed asset number; these
 * declarations keep the TypeScript check (tsc --noEmit) happy.
 */
declare module '*.png' {
  const asset: number;
  export default asset;
}

declare module '*.jpg' {
  const asset: number;
  export default asset;
}

declare module '*.jpeg' {
  const asset: number;
  export default asset;
}