import { ScanRecord, AlertRecord } from '../types';

const DB_NAME = 'sentinel-db';
const DB_VERSION = 1;
const SCANS_STORE = 'scans';
const ALERTS_STORE = 'alerts';

let db: IDBDatabase;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const tempDb = request.result;
            if (!tempDb.objectStoreNames.contains(SCANS_STORE)) {
                const scanStore = tempDb.createObjectStore(SCANS_STORE, { keyPath: 'id', autoIncrement: true });
                scanStore.createIndex('repoFullName', 'repoFullName', { unique: false });
                scanStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
            if (!tempDb.objectStoreNames.contains(ALERTS_STORE)) {
                const alertStore = tempDb.createObjectStore(ALERTS_STORE, { keyPath: 'id', autoIncrement: true });
                alertStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject('Error opening IndexedDB.');
        };
    });
}

export async function addScan(scan: ScanRecord): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(SCANS_STORE, 'readwrite');
    const store = transaction.objectStore(SCANS_STORE);
    store.add(scan);

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

export async function logAlert(alert: AlertRecord): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(ALERTS_STORE, 'readwrite');
    const store = transaction.objectStore(ALERTS_STORE);
    store.add(alert);
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

export async function getAllScans(): Promise<ScanRecord[]> {
    const db = await openDB();
    const transaction = db.transaction(SCANS_STORE, 'readonly');
    const store = transaction.objectStore(SCANS_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function getScansForRepo(repoFullName: string): Promise<ScanRecord[]> {
    const db = await openDB();
    const transaction = db.transaction(SCANS_STORE, 'readonly');
    const store = transaction.objectStore(SCANS_STORE);
    const index = store.index('repoFullName');
    const request = index.getAll(repoFullName);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function getAllAlerts(): Promise<AlertRecord[]> {
    const db = await openDB();
    const transaction = db.transaction(ALERTS_STORE, 'readonly');
    const store = transaction.objectStore(ALERTS_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            // Sort by most recent first
            resolve(request.result.sort((a, b) => b.timestamp - a.timestamp));
        };
        request.onerror = () => reject(request.error);
    });
}

export async function getRecentAlerts(limit: number = 10): Promise<AlertRecord[]> {
    const alerts = await getAllAlerts();
    return alerts.slice(0, limit);
}
