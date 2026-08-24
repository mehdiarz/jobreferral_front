// src/types/bidi-js.d.ts
declare module "bidi-js" {
  type BidiLevels = {
    levels: Uint8Array | number[];
    paragraphs: Array<{
      start: number;
      end: number;
      level: number;
    }>;
  };

  type BidiInstance = {
    getEmbeddingLevels(text: string, baseDirection?: "ltr" | "rtl"): BidiLevels;
    getReorderedString(text: string, levels: BidiLevels): string;
  };

  const bidiFactory: () => BidiInstance;
  export default bidiFactory;
}
