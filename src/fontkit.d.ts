declare module "fontkit" {
  // fontkit does not publish TypeScript declarations; pdf-lib validates
  // this adapter at runtime.
  export function create(
    fontData: Uint8Array | ArrayBuffer,
  ): import("pdf-lib/es/types/fontkit").Font;
}
