import Dexie, { type EntityTable } from 'dexie';
import type { MaterialJSON } from '../types';

interface Setting {
    key: string;
    value: any;
}

export const db = new Dexie('ShadowLoopDB') as Dexie & {
    materials: EntityTable<MaterialJSON, 'id'>;
    settings: EntityTable<Setting, 'key'>;
};

// Schema definition
db.version(1).stores({
    materials: '++id, youtube_id, created_at, title', // Primary key and indexed props
    settings: 'key' // Primary key
});

export type { Setting };
