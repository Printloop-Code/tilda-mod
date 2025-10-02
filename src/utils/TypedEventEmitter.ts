/**
 * Типизированный EventEmitter для работы с событиями редактора
 * Похож на EventEmitter из Node.js, но с полной типизацией TypeScript
 */
export class TypedEventEmitter<EventMap extends Record<string, any>> {
    private listeners: Map<keyof EventMap, Set<Function>> = new Map();

    /**
     * Подписка на событие
     */
    on<K extends keyof EventMap>(
        event: K,
        listener: (detail: EventMap[K]) => void
    ): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);
    }

    /**
     * Одноразовая подписка на событие
     */
    once<K extends keyof EventMap>(
        event: K,
        listener: (detail: EventMap[K]) => void
    ): void {
        const onceWrapper = (detail: EventMap[K]) => {
            listener(detail);
            this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
    }

    /**
     * Отписка от события
     */
    off<K extends keyof EventMap>(
        event: K,
        listener: (detail: EventMap[K]) => void
    ): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(listener);
            if (eventListeners.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    /**
     * Отправка события
     */
    emit<K extends keyof EventMap>(
        event: K,
        detail: EventMap[K]
    ): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(listener => {
                try {
                    listener(detail);
                } catch (error) {
                    console.error(`[EventEmitter] Ошибка в обработчике события "${String(event)}":`, error);
                }
            });
        }
    }

    /**
     * Удаление всех подписчиков события
     */
    removeAllListeners<K extends keyof EventMap>(event?: K): void {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Получение количества подписчиков на событие
     */
    listenerCount<K extends keyof EventMap>(event: K): number {
        return this.listeners.get(event)?.size || 0;
    }

    /**
     * Проверка наличия подписчиков на событие
     */
    hasListeners<K extends keyof EventMap>(event: K): boolean {
        return this.listenerCount(event) > 0;
    }

    /**
     * Получение списка всех событий с подписчиками
     */
    eventNames(): Array<keyof EventMap> {
        return Array.from(this.listeners.keys());
    }

    /**
     * Очистка всех подписчиков и ресурсов
     */
    destroy(): void {
        this.listeners.clear();
    }
}


