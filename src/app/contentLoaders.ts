import type { SourceEntry } from '../types/content';

let sourceRecordsPromise: Promise<SourceEntry[]> | null = null;

/** Load the larger source registry only in views that actually display it. */
export function loadSourceRecords(): Promise<SourceEntry[]> {
  sourceRecordsPromise ??= import('../generated/sources.json')
    .then((module) => module.default as unknown as SourceEntry[]);
  return sourceRecordsPromise;
}
