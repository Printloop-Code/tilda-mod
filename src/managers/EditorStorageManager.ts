import { EditorState, HistoryItem, LayerHistoryItem, LayerOperation, HistoryFilter, Product, SideEnum } from '../types';
import { Layout } from '../models/Layout';

export class EditorStorageManager {
    private database: IDBDatabase | null = null;
    private isReady: boolean = false;
    private readyPromise: Promise<void>;

    constructor() {
        this.readyPromise = this.init();
    }

    private async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const openRequest = indexedDB.open("editor", 2);

            openRequest.onupgradeneeded = (event) => {
                const database = (event.target as IDBOpenDBRequest).result;

                // Создаем ObjectStore для истории
                if (!database.objectStoreNames.contains('history')) {
                    database.createObjectStore('history', { keyPath: 'id' });
                }

                // Создаем ObjectStore для состояния редактора
                if (!database.objectStoreNames.contains('editor_state')) {
                    database.createObjectStore('editor_state', { keyPath: 'key' });
                }

                // Создаем ObjectStore для пользовательских данных
                if (!database.objectStoreNames.contains('user_data')) {
                    database.createObjectStore('user_data', { keyPath: 'key' });
                }
            };

            openRequest.onerror = () => {
                console.error("Ошибка открытия IndexedDB", openRequest.error);
                reject(openRequest.error);
            };

            openRequest.onsuccess = () => {
                this.database = openRequest.result;
                this.isReady = true;
                resolve();
            };
        });
    }

    async waitForReady(): Promise<void> {
        await this.readyPromise;
    }

    async saveEditorState(state: EditorState): Promise<void> {
        await this.waitForReady();
        if (!this.database) throw new Error('Database не инициализирована');

        const transaction = this.database.transaction(['editor_state'], 'readwrite');
        const objectStore = transaction.objectStore('editor_state');

        await Promise.all([
            this.putData(objectStore, 'date', state.date),
            this.putData(objectStore, 'color', state.color),
            this.putData(objectStore, 'side', state.side),
            this.putData(objectStore, 'type', state.type),
            this.putData(objectStore, 'size', state.size)
        ]);
    }

    async loadEditorState(): Promise<EditorState | null> {
        await this.waitForReady();
        if (!this.database) throw new Error('Database не инициализирована');

        const transaction = this.database.transaction(['editor_state'], 'readonly');
        const objectStore = transaction.objectStore('editor_state');

        try {
            const [date, color, side, type, size] = await Promise.all([
                this.getData(objectStore, 'date'),
                this.getData(objectStore, 'color'),
                this.getData(objectStore, 'side'),
                this.getData(objectStore, 'type'),
                this.getData(objectStore, 'size')
            ]);

            if (!date || !color || !side || !type || !size) {
                return null;
            }

            return {
                date,
                color,
                side,
                type,
                size
            };
        } catch (error) {
            console.error('Ошибка загрузки состояния редактора:', error);
            return null;
        }
    }

    async clearEditorState(): Promise<void> {
        await this.waitForReady();
        if (!this.database) throw new Error('Database не инициализирована');

        const transaction = this.database.transaction(['editor_state'], 'readwrite');
        const objectStore = transaction.objectStore('editor_state');

        await Promise.all([
            this.deleteData(objectStore, 'date'),
            this.deleteData(objectStore, 'color'),
            this.deleteData(objectStore, 'side'),
            this.deleteData(objectStore, 'type'),
            this.deleteData(objectStore, 'size')
        ]);
    }

    async getUserId(): Promise<string> {
        await this.waitForReady();
        if (!this.database) throw new Error('Database не инициализирована');

        const transaction = this.database.transaction(['user_data'], 'readwrite');
        const objectStore = transaction.objectStore('user_data');

        let userId = await this.getData(objectStore, 'userId');

        if (!userId) {
            userId = crypto.randomUUID();
            await this.putData(objectStore, 'userId', userId);
        }

        return userId;
    }

    async saveToHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>, description?: string): Promise<string> {
        await this.waitForReady();
        if (!this.database) throw new Error('Database не инициализирована');

        const historyItem: HistoryItem = {
            ...item,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            description: description || `Изменения от ${new Date().toLocaleString()}`
        };

        const transaction = this.database.transaction(['history'], 'readwrite');
        const objectStore = transaction.objectStore('history');

        await new Promise<void>((resolve, reject) => {
            const request = objectStore.add(historyItem);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });

        return historyItem.id;
    }

    async saveLayerOperation(operation: LayerOperation, layout: Layout, side: SideEnum, type: Product['type'], description?: string): Promise<string> {
        await this.waitForReady();
        if (!this.database) throw new Error('Database не инициализирована');

        const layerHistoryItem: LayerHistoryItem = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            operation,
            layout: JSON.parse(JSON.stringify(layout)),
            side,
            type,
            description: description || `${operation === 'add' ? 'Добавлен' : 'Удален'} слой: ${layout.name || layout.type}`
        };

        const transaction = this.database.transaction(['history'], 'readwrite');
        const objectStore = transaction.objectStore('history');

        await new Promise<void>((resolve, reject) => {
            const request = objectStore.add({ ...layerHistoryItem, isLayerOperation: true });
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });

        return layerHistoryItem.id;
    }

    async getLayerHistory(filter: HistoryFilter, limit: number = 50): Promise<LayerHistoryItem[]> {
        await this.waitForReady();
        if (!this.database) throw new Error('Database не инициализирована');

        const transaction = this.database.transaction(['history'], 'readonly');
        const objectStore = transaction.objectStore('history');

        return new Promise((resolve, reject) => {
            const request = objectStore.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const allItems = request.result;
                const layerOperations = allItems
                    .filter((item: any) => item.isLayerOperation && item.side === filter.side && item.type === filter.type)
                    .map((item: any) => ({
                        id: item.id,
                        timestamp: item.timestamp,
                        operation: item.operation,
                        layout: item.layout,
                        side: item.side,
                        type: item.type,
                        description: item.description
                    } as LayerHistoryItem))
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, limit);
                resolve(layerOperations);
            };
        });
    }

    async getRecentLayerOperations(filter: HistoryFilter, limit: number = 10): Promise<LayerHistoryItem[]> {
        return this.getLayerHistory(filter, limit);
    }

    async getHistory(filter: HistoryFilter, limit: number = 50): Promise<HistoryItem[]> {
        await this.waitForReady();
        if (!this.database) throw new Error('Database не инициализирована');

        const transaction = this.database.transaction(['history'], 'readonly');
        const objectStore = transaction.objectStore('history');

        return new Promise((resolve, reject) => {
            const request = objectStore.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const allItems = request.result as HistoryItem[];
                const filteredItems = allItems
                    .filter(item => item.side === filter.side && item.type === filter.type)
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, limit);
                resolve(filteredItems);
            };
        });
    }

    async getHistoryItem(id: string): Promise<HistoryItem | null> {
        await this.waitForReady();
        if (!this.database) throw new Error('Database не инициализирована');

        const transaction = this.database.transaction(['history'], 'readonly');
        const objectStore = transaction.objectStore('history');

        return new Promise((resolve, reject) => {
            const request = objectStore.get(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || null);
        });
    }

    async deleteHistoryItem(id: string): Promise<void> {
        await this.waitForReady();
        if (!this.database) throw new Error('Database не инициализирована');

        const transaction = this.database.transaction(['history'], 'readwrite');
        const objectStore = transaction.objectStore('history');

        await new Promise<void>((resolve, reject) => {
            const request = objectStore.delete(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async clearHistory(filter?: HistoryFilter): Promise<void> {
        await this.waitForReady();
        if (!this.database) throw new Error('Database не инициализирована');

        const transaction = this.database.transaction(['history'], 'readwrite');
        const objectStore = transaction.objectStore('history');

        if (!filter) {
            await new Promise<void>((resolve, reject) => {
                const request = objectStore.clear();
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        } else {
            const allItems = await this.getHistory(filter, 1000);
            for (const item of allItems) {
                await this.deleteHistoryItem(item.id);
            }
        }
    }

    // Методы для работы со слоями (отдельно от состояния редактора)
    async saveLayers(layers: any[]): Promise<void> {
        await this.waitForReady();
        if (!this.database) throw new Error('Database не инициализирована');

        const transaction = this.database.transaction(['editor_state'], 'readwrite');
        const objectStore = transaction.objectStore('editor_state');

        await this.putData(objectStore, 'layers', layers);
    }

    async loadLayers(): Promise<any[] | null> {
        await this.waitForReady();
        if (!this.database) throw new Error('Database не инициализирована');

        try {
            const transaction = this.database.transaction(['editor_state'], 'readonly');
            const objectStore = transaction.objectStore('editor_state');

            const layers = await this.getData(objectStore, 'layers');
            return layers || null;
        } catch (error) {
            console.error('Ошибка загрузки слоёв:', error);
            return null;
        }
    }

    private putData(objectStore: IDBObjectStore, key: string, value: any): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = objectStore.put({ key, value });
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    private getData(objectStore: IDBObjectStore, key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const request = objectStore.get(key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result?.value || null);
        });
    }

    private deleteData(objectStore: IDBObjectStore, key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = objectStore.delete(key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
}

