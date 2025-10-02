import { LayoutProps, LayoutType, Position, Font, SideEnum, ImageLayoutProps, TextLayoutProps } from '../types';

// Константы по умолчанию
const DEFAULT_VALUES = {
    POSITION: { x: 0, y: 0 } as Position,
    SIZE: 1,
    ASPECT_RATIO: 1,
    ANGLE: 0,
    TEXT: 'PrintLoop',
    FONT: { family: 'Arial', size: 12 } as Font,
} as const;

export class Layout {
    readonly id: string;
    readonly type: LayoutType;
    position: Position;
    size: number;
    aspectRatio: number;
    view: SideEnum;
    angle: number;
    name: string | null;

    // Свойства для изображений
    url?: string;

    // Свойства для текста
    text?: string;
    font?: Font;

    constructor(props: LayoutProps) {
        // Базовые свойства
        this.id = props.id || Layout.generateId();
        this.type = props.type;
        this.position = props.position || { ...DEFAULT_VALUES.POSITION };
        this.size = this.validateSize(props.size ?? DEFAULT_VALUES.SIZE);
        this.aspectRatio = this.validateAspectRatio(props.aspectRatio ?? DEFAULT_VALUES.ASPECT_RATIO);
        this.view = props.view;
        this.angle = this.normalizeAngle(props.angle ?? DEFAULT_VALUES.ANGLE);
        this.name = props.name ?? null;

        // Специфичные свойства в зависимости от типа
        if (props.type === 'image') {
            this.url = props.url;
        } else if (props.type === 'text') {
            this.text = props.text || DEFAULT_VALUES.TEXT;
            this.font = props.font ? { ...props.font } : { ...DEFAULT_VALUES.FONT };
        }
    }

    // Генерация уникального ID
    static generateId(): string {
        // Используем crypto.randomUUID если доступен, иначе fallback
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback для старых браузеров
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    // Валидация размера
    private validateSize(size: number): number {
        if (size <= 0) {
            console.warn(`Invalid size ${size}, using default ${DEFAULT_VALUES.SIZE}`);
            return DEFAULT_VALUES.SIZE;
        }
        return size;
    }

    // Валидация соотношения сторон
    private validateAspectRatio(ratio: number): number {
        if (ratio <= 0) {
            console.warn(`Invalid aspect ratio ${ratio}, using default ${DEFAULT_VALUES.ASPECT_RATIO}`);
            return DEFAULT_VALUES.ASPECT_RATIO;
        }
        return ratio;
    }

    // Нормализация угла к диапазону 0-360
    private normalizeAngle(angle: number): number {
        const normalized = angle % 360;
        return normalized < 0 ? normalized + 360 : normalized;
    }

    // Type guards для проверки типа
    isImageLayout(): this is Layout & { url: string } {
        return this.type === 'image' && this.url !== undefined;
    }

    isTextLayout(): this is Layout & { text: string; font: Font } {
        return this.type === 'text' && this.text !== undefined && this.font !== undefined;
    }

    // Методы для обновления позиции и трансформации
    setPosition(x: number, y: number): void {
        this.position = { x, y };
    }

    move(dx: number, dy: number): void {
        this.position.x += dx;
        this.position.y += dy;
    }

    setSize(size: number): void {
        this.size = this.validateSize(size);
    }

    rotate(angle: number): void {
        this.angle = this.normalizeAngle(this.angle + angle);
    }

    setAngle(angle: number): void {
        this.angle = this.normalizeAngle(angle);
    }

    // Методы для работы с текстом
    setText(text: string): void {
        if (this.isTextLayout()) {
            this.text = text;
        }
    }

    setFont(font: Partial<Font>): void {
        if (this.isTextLayout() && this.font) {
            this.font = { ...this.font, ...font };
        }
    }

    // Клонирование
    clone(): Layout {
        if (this.type === 'image') {
            const props: ImageLayoutProps = {
                type: 'image',
                url: this.url!,
                position: { ...this.position },
                size: this.size,
                aspectRatio: this.aspectRatio,
                view: this.view,
                angle: this.angle,
                name: this.name,
            };
            return new Layout(props);
        } else {
            const props: TextLayoutProps = {
                type: 'text',
                position: { ...this.position },
                size: this.size,
                aspectRatio: this.aspectRatio,
                view: this.view,
                angle: this.angle,
                name: this.name,
            };
            // Добавляем опциональные свойства, если они существуют
            if (this.text !== undefined) {
                props.text = this.text;
            }
            if (this.font !== undefined) {
                props.font = { ...this.font };
            }
            return new Layout(props);
        }
    }

    // Сериализация в plain object
    toJSON(): Record<string, any> {
        const base = {
            id: this.id,
            type: this.type,
            position: this.position,
            size: this.size,
            aspectRatio: this.aspectRatio,
            view: this.view,
            angle: this.angle,
            name: this.name,
        };

        if (this.type === 'image') {
            return { ...base, url: this.url };
        } else if (this.type === 'text') {
            return { ...base, text: this.text, font: this.font };
        }

        return base;
    }

    // Десериализация из plain object
    static fromJSON(json: any): Layout {
        return new Layout(json as LayoutProps);
    }

    // Статические методы-фабрики для удобства создания
    static createImage(props: Omit<ImageLayoutProps, 'type'>): Layout {
        return new Layout({ ...props, type: 'image' });
    }

    static createText(props: Omit<TextLayoutProps, 'type'>): Layout {
        return new Layout({ ...props, type: 'text' });
    }
}

