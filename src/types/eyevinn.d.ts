declare module 'm3u8-parser' {
  export class Parser {
    constructor();
    push(chunk: string): void;
    end(): void;
    manifest: any;
  }
}
