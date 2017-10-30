export interface WalkSyncEntry {
  relativePath: string;
  mode: string;
  size: number;
  mtime: Date;
  isDirectory(): boolean;
}

export type WalkSyncOptions = {
  globs?: string[],
  directories?: boolean,
  ignore?: string[],
};

declare function walkSync(baseDir: string, options?: WalkSyncOptions): string[];

declare namespace walkSync {
  export var entries: (path: string) => WalkSyncEntry[];
}

export default walkSync;
