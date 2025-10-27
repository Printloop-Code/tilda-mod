// ============================================
// ИМПОРТЫ
// ============================================

// Импорт типов данных для редактора
import type { EditorProps, Product, Size, Color, SideEnum, LayoutProps, EditorState, ApiConfig } from '../types';
// Менеджер для работы с localStorage (сохранение/загрузка состояния)
import { EditorStorageManager } from '../managers/EditorStorageManager';
// Модель для работы со слоями (Layout - это изображение или текст на холсте)
import { Layout } from '../models/Layout';
// Утилиты для работы с DOM Tilda
import { getLastChild } from '../utils/tildaUtils';
// Система событий (pub/sub паттерн)
import { TypedEventEmitter } from '../utils/TypedEventEmitter';
// API функции для генерации изображений и создания заказов
import { generateImage, createProduct } from '../utils/api';

// Объявление глобальной переменной fabric (библиотека для работы с canvas)
declare const fabric: any;

// ============================================
// КОНСТАНТЫ
// ============================================

// Основные константы приложения
const CONSTANTS = {
    STATE_EXPIRATION_DAYS: 30,      // Сколько дней хранить состояние в localStorage
    CANVAS_AREA_HEIGHT: 600,         // Высота области canvas в пикселях
    LOADING_INTERVAL_MS: 100,        // Интервал проверки загрузки (мс)
} as const;

// ============================================
// ТИПЫ СОБЫТИЙ
// ============================================

// Перечисление всех возможных событий редактора
export enum EditorEventType {
    MOCKUP_LOADING = 'mockup-loading',              // Событие: загрузка мокапа (футболки/толстовки)
    MOCKUP_UPDATED = 'mockup-updated',              // Событие: мокап обновлен
    LOADING_TIME_UPDATED = 'loading-time-updated',  // Событие: обновление времени загрузки
    STATE_CHANGED = 'state-changed',                // Событие: изменение состояния редактора
    LAYOUT_ADDED = 'layout-added',                  // Событие: добавлен новый слой
    LAYOUT_REMOVED = 'layout-removed',              // Событие: удален слой
    LAYOUT_UPDATED = 'layout-updated',              // Событие: обновлен слой
}

// Типы данных для каждого события (что передается в событие)
export type EditorEventMap = {
    [EditorEventType.MOCKUP_LOADING]: boolean;          // Передается: идет загрузка или нет
    [EditorEventType.MOCKUP_UPDATED]: string;           // Передается: URL нового мокапа
    [EditorEventType.LOADING_TIME_UPDATED]: number;     // Передается: время загрузки (секунды)
    [EditorEventType.STATE_CHANGED]: void;              // Ничего не передается
    [EditorEventType.LAYOUT_ADDED]: Layout;             // Передается: добавленный слой
    [EditorEventType.LAYOUT_REMOVED]: Layout['id'];     // Передается: ID удаленного слоя
    [EditorEventType.LAYOUT_UPDATED]: Layout;           // Передается: обновленный слой
};

// ============================================
// ИНТЕРФЕЙСЫ
// ============================================

// Элемент истории слоёв (для функции отмены/повтора действий - undo/redo)
interface LayersHistoryItem {
    layers: Layout[];       // Массив слоев на момент сохранения
    timestamp: number;      // Временная метка (когда было сохранено)
}

// ============================================
// КЛАСС EDITOR - ОСНОВНОЙ РЕДАКТОР ДИЗАЙНА
// ============================================
/**
 * Класс Editor управляет всем процессом создания дизайна:
 * - Отображение canvas с дизайном футболок/толстовок
 * - Добавление/удаление/редактирование слоев (изображений и текста)
 * - Управление состоянием (цвет, размер, сторона, тип продукта)
 * - Генерация изображений через AI
 * - Сохранение/загрузка состояния из localStorage
 * - История действий (undo/redo)
 * - Добавление товара в корзину Tilda
 */
export default class Editor {
    // ============================================
    // DOM ЭЛЕМЕНТЫ (readonly после инициализации)
    // ============================================
    private readonly editorBlock: HTMLElement;              // Основной контейнер редактора
    private readonly changeSideButton: HTMLElement;         // Кнопка переключения сторон (перед/зад)
    private readonly canvasesContainer: HTMLElement;        // Контейнер для всех canvas элементов
    private readonly editorLoadingBlock: HTMLElement;       // Блок загрузки (спиннер)
    private readonly editorHistoryUndoBlock: HTMLElement;   // Кнопка "Отменить"
    private readonly editorHistoryRedoBlock: HTMLElement;   // Кнопка "Повторить"
    private readonly quantityFormBlock: HTMLElement | null = null;  // Форма с количеством товара
    private mockupBlock: HTMLImageElement;                  // Элемент <img> с мокапом футболки/толстовки

    // ============================================
    // ДОПОЛНИТЕЛЬНЫЕ UI ЭЛЕМЕНТЫ
    // ============================================
    private productListBlock?: HTMLElement;             // Список продуктов (футболка/толстовка)
    private productItemBlock?: HTMLElement;             // Шаблон элемента продукта
    private editorColorsListBlock?: HTMLElement;        // Список цветов
    private editorColorItemBlock?: HTMLElement;         // Шаблон элемента цвета
    private editorSizesListBlock?: HTMLElement;         // Список размеров
    private editorSizeItemBlock?: HTMLElement;          // Шаблон элемента размера
    private editorLayoutsListBlock?: HTMLElement;       // Список слоев
    private editorLayoutItemBlock?: HTMLElement;        // Шаблон элемента слоя
    private editorUploadImageButton?: HTMLElement;      // Кнопка загрузки изображения
    private editorUploadViewBlock?: HTMLElement;        // Блок предпросмотра загруженного изображения
    private editorUploadCancelButton?: HTMLElement;     // Кнопка отмены загрузки
    private editorLoadWithAiButton?: HTMLElement;       // Кнопка "Загрузить с AI"
    private editorLoadWithoutAiButton?: HTMLElement;    // Кнопка "Загрузить без AI"
    private editorRemoveBackgroundButton?: HTMLElement; // Кнопка "Удалить фон"
    private editorAddOrderButton?: HTMLElement;         // Кнопка "Добавить в корзину"
    private editorSumBlock?: HTMLElement;               // Блок с суммой заказа
    private editorProductName?: HTMLElement;            // Название продукта

    // ============================================
    // CSS КЛАССЫ ДЛЯ ДИНАМИЧЕСКИХ ЭЛЕМЕНТОВ
    // ============================================
    private editorLayoutItemBlockViewClass?: string;    // CSS класс для превью слоя
    private editorLayoutItemBlockNameClass?: string;    // CSS класс для имени слоя
    private editorLayoutItemBlockRemoveClass?: string;  // CSS класс для кнопки удаления слоя
    private editorLayoutItemBlockEditClass?: string;    // CSS класс для кнопки редактирования слоя

    // ============================================
    // ФОРМА ГЕНЕРАЦИИ
    // ============================================
    private formBlock: HTMLElement | null = null;           // Контейнер формы
    private formInputVariableName: string | null = null;    // Имя переменной input поля (для Tilda)
    private formButton: HTMLElement | null = null;          // Кнопка "Сгенерировать"

    // ============================================
    // МЕНЕДЖЕРЫ
    // ============================================
    private readonly storageManager: EditorStorageManager;  // Менеджер для работы с localStorage

    // ============================================
    // КОНФИГУРАЦИЯ
    // ============================================
    private readonly apiConfig: ApiConfig;          // Конфигурация API endpoints
    private readonly options?: EditorProps['options'];  // Дополнительные опции редактора

    // ============================================
    // СОСТОЯНИЕ РЕДАКТОРА (приватное, доступ через геттеры)
    // ============================================
    private _selectType: Product['type'];           // Текущий выбранный тип продукта (tshirt/hoodie)
    private _selectColor: Color;                    // Текущий выбранный цвет
    private _selectSide: SideEnum;                  // Текущая выбранная сторона (front/back)
    private _selectSize: Size;                      // Текущий выбранный размер
    private _selectLayout: Layout['id'] | null = null;  // ID редактируемого слоя (null = режим создания)

    // ============================================
    // ДАННЫЕ
    // ============================================
    private readonly productConfigs: Product[];     // Конфигурация всех продуктов (из props)
    private layouts: Layout[] = [];                 // Массив всех слоев (изображения/текст)

    // ============================================
    // CANVAS ДАННЫЕ
    // ============================================
    canvases: fabric.Canvas[] = [];                 // Массив canvas для каждой стороны
    layersCanvases: fabric.StaticCanvas[] = [];     // Статические canvas для превью слоев
    activeCanvas: fabric.Canvas | null = null;      // Текущий активный canvas

    // ============================================
    // СИСТЕМА СОБЫТИЙ
    // ============================================
    readonly events = new TypedEventEmitter<EditorEventMap>();  // Типизированный EventEmitter

    // ============================================
    // ИСТОРИЯ ДЕЙСТВИЙ (undo/redo)
    // ============================================
    private layersHistory: LayersHistoryItem[] = [];    // История всех состояний слоев
    private currentHistoryIndex: number = -1;           // Текущий индекс в истории
    private isRestoringFromHistory: boolean = false;    // Флаг: идет восстановление из истории

    // ============================================
    // ФЛАГИ И ТАЙМЕРЫ
    // ============================================
    private isLoading: boolean = true;                  // Флаг: идет загрузка
    private isAddingToCart: boolean = false;            // Флаг: идет добавление в корзину (защита от дубликатов)
    private isAddedToCart: boolean = false;             // Флаг: дизайн добавлен в корзину (отключает предупреждение при уходе)
    private isGenerating: boolean = false;              // Флаг: идет генерация (защита от дубликатов)
    private loadingTime: number = 0;                    // Счетчик времени загрузки (секунды)
    private loadingInterval: NodeJS.Timeout | null = null;  // Интервал для обновления времени загрузки
    private resizeTimeout: NodeJS.Timeout | null = null;    // Таймер для debounce resize события

    // ============================================
    // МАССИВЫ UI ЭЛЕМЕНТОВ
    // ============================================
    private colorBlocks: HTMLElement[] = [];        // Массив элементов цветов
    private sizeBlocks: HTMLElement[] = [];         // Массив элементов размеров
    private productBlocks: HTMLElement[] = [];      // Массив элементов продуктов

    // ============================================
    // СОСТОЯНИЕ ЗАГРУЗКИ ИЗОБРАЖЕНИЯ
    // ============================================
    private loadedUserImage: string | null = null;  // Data URL загруженного пользователем изображения
    private editorLoadWithAi: boolean = false;      // Флаг: загружать с AI обработкой
    private removeBackgroundEnabled: boolean = false; // Флаг: удалить фон (только для не-ИИ генерации)

    // ============================================
    // КЭШ ДЛЯ ОПТИМИЗАЦИИ
    // ============================================
    private imageCache: Map<string, string> = new Map();   // Кэш изображений (URL -> base64)
    private loadingElementsCache: {                         // Кэш DOM элементов загрузки
        loadingText?: HTMLElement;
        spinner?: HTMLElement;
    } = {};
    private productCache: Map<Product['type'], Product> = new Map();    // Кэш продуктов
    private mockupCache: Map<string, string | null> = new Map();        // Кэш мокапов

    // ============================================
    // ГЕТТЕРЫ ДЛЯ СОСТОЯНИЯ (read-only доступ извне)
    // ============================================
    get selectType(): Product['type'] { return this._selectType; }
    get selectColor(): Color { return this._selectColor; }
    get selectSide(): SideEnum { return this._selectSide; }
    get selectSize(): Size { return this._selectSize; }
    get selectLayout(): Layout['id'] | null { return this._selectLayout; }

    constructor({ blocks, productConfigs, formConfig, apiConfig, options }: EditorProps) {
        // Валидация конфигурации
        if (!productConfigs || productConfigs.length === 0) {
            throw new Error('[Editor] Не предоставлены конфигурации продуктов');
        }

        // Инициализация storage
        this.storageManager = new EditorStorageManager();

        // Конфигурация продуктов
        this.productConfigs = productConfigs;

        // Конфигурация API
        this.apiConfig = apiConfig;

        // Дополнительные опции
        this.options = options;

        // Инициализация обязательных DOM элементов с проверкой
        this.editorBlock = this.getRequiredElement(blocks.editorBlockClass);
        this.changeSideButton = this.getRequiredElement(blocks.changeSideButtonClass);
        this.editorHistoryUndoBlock = this.getRequiredElement(blocks.editorHistoryUndoBlockClass);
        this.editorHistoryRedoBlock = this.getRequiredElement(blocks.editorHistoryRedoBlockClass);
        this.quantityFormBlock = document.querySelector(blocks.editorQuantityFormBlockClass);

        // Инициализация дополнительных DOM элементов (optional)
        const productListBlock = document.querySelector(blocks.productListBlockClass);
        if (productListBlock) this.productListBlock = productListBlock as HTMLElement;

        const productItemBlock = document.querySelector(blocks.productItemClass);
        if (productItemBlock) this.productItemBlock = productItemBlock as HTMLElement;

        const editorColorsListBlock = document.querySelector(blocks.editorColorsListBlockClass);
        if (editorColorsListBlock) this.editorColorsListBlock = editorColorsListBlock as HTMLElement;

        const editorColorItemBlock = document.querySelector(blocks.editorColorItemBlockClass);
        if (editorColorItemBlock) this.editorColorItemBlock = editorColorItemBlock as HTMLElement;

        const editorSizesListBlock = document.querySelector(blocks.editorSizesListBlockClass);
        if (editorSizesListBlock) this.editorSizesListBlock = editorSizesListBlock as HTMLElement;

        const editorSizeItemBlock = document.querySelector(blocks.editorSizeItemBlockClass);
        if (editorSizeItemBlock) this.editorSizeItemBlock = editorSizeItemBlock as HTMLElement;

        const editorLayoutsListBlock = document.querySelector(blocks.editorLayoutsListBlockClass);
        if (editorLayoutsListBlock) this.editorLayoutsListBlock = editorLayoutsListBlock as HTMLElement;

        const editorLayoutItemBlock = document.querySelector(blocks.editorLayoutItemBlockClass);
        if (editorLayoutItemBlock) this.editorLayoutItemBlock = editorLayoutItemBlock as HTMLElement;

        const editorUploadImageButton = document.querySelector(blocks.editorUploadImageButtonClass);
        if (editorUploadImageButton) this.editorUploadImageButton = editorUploadImageButton as HTMLElement;

        const editorUploadViewBlock = document.querySelector(blocks.editorUploadViewBlockClass);
        if (editorUploadViewBlock) this.editorUploadViewBlock = editorUploadViewBlock as HTMLElement;

        const editorUploadCancelButton = document.querySelector(blocks.editorUploadCancelButtonClass);
        if (editorUploadCancelButton) this.editorUploadCancelButton = editorUploadCancelButton as HTMLElement;

        const editorLoadWithAiButton = document.querySelector(blocks.editorLoadWithAiButtonClass);
        if (editorLoadWithAiButton) this.editorLoadWithAiButton = editorLoadWithAiButton as HTMLElement;

        const editorLoadWithoutAiButton = document.querySelector(blocks.editorLoadWithoutAiButtonClass);
        if (editorLoadWithoutAiButton) this.editorLoadWithoutAiButton = editorLoadWithoutAiButton as HTMLElement;

        const editorRemoveBackgroundButton = blocks.editorRemoveBackgroundButtonClass
            ? document.querySelector(blocks.editorRemoveBackgroundButtonClass)
            : null;
        if (editorRemoveBackgroundButton) this.editorRemoveBackgroundButton = editorRemoveBackgroundButton as HTMLElement;

        const editorAddOrderButton = document.querySelector(blocks.editorAddOrderButtonClass);
        if (editorAddOrderButton) this.editorAddOrderButton = editorAddOrderButton as HTMLElement;

        const editorSumBlock = document.querySelector(blocks.editorSumBlockClass);
        if (editorSumBlock) this.editorSumBlock = editorSumBlock as HTMLElement;

        const editorProductName = document.querySelector(blocks.editorProductNameClass);
        if (editorProductName) this.editorProductName = editorProductName as HTMLElement;

        // Сохранение CSS классов
        this.editorLayoutItemBlockViewClass = blocks.editorLayoutItemBlockViewClass;
        this.editorLayoutItemBlockNameClass = blocks.editorLayoutItemBlockNameClass;
        this.editorLayoutItemBlockRemoveClass = blocks.editorLayoutItemBlockRemoveClass;
        this.editorLayoutItemBlockEditClass = blocks.editorLayoutItemBlockEditClass;

        // Инициализация формы если передана
        if (formConfig) {
            this.formBlock = document.querySelector(formConfig.formBlockClass);
            this.formInputVariableName = formConfig.formInputVariableName;
            this.formButton = document.querySelector(formConfig.formButtonClass);
        }

        // Установка дефолтных значений
        const defaultProduct = productConfigs[0];
        if (!defaultProduct) {
            throw new Error('[Editor] Не найден дефолтный продукт');
        }

        const defaultMockup = defaultProduct.mockups[0];
        if (!defaultMockup) {
            throw new Error('[Editor] Не найден дефолтный mockup');
        }

        this._selectColor = defaultMockup.color;
        this._selectSide = defaultMockup.side;
        this._selectType = defaultProduct.type;
        this._selectSize = defaultProduct.sizes?.[0] || 'M' as Size;

        // Создание базовых блоков
        this.editorBlock.style.position = 'relative';
        this.createBackgroundBlock();
        this.mockupBlock = this.createMockupBlock();
        this.canvasesContainer = this.createCanvasesContainer();
        this.editorLoadingBlock = this.createEditorLoadingBlock();

        // Инициализация событий и клавиатурных сокращений
        this.initEvents();
        this.initKeyboardShortcuts();
        this.initLoadingEvents();

        // Инициализация UI компонентов
        this.initUIComponents();

        // Асинхронная инициализация (миграция и загрузка состояния)
        this.initializeEditor();

        (window as any).getLayouts = () => {
            return this.layouts.map(layout => ({ ...layout, url: undefined }));
        }

        (window as any).loadLayouts = (layouts: Layout[]) => {
            this.layouts = layouts.map(layout => Layout.fromJSON(layout));

            this.updateLayouts();
            this.showLayoutList();
        }

        (window as any).exportPrint = async () => {
            const exportedArt = await this.exportArt(false, 4096);
            for (const side of Object.keys(exportedArt)) {
                const downloadLink = document.createElement('a');
                document.body.appendChild(downloadLink);

                downloadLink.href = exportedArt[side]!;
                downloadLink.target = '_self';
                downloadLink.download = `${side}.png`;
                downloadLink.click();
            }

            return exportedArt;
        }
    }

    // Инициализация UI компонентов
    private initUIComponents(): void {
        // Инициализация кнопки смены стороны
        if (this.changeSideButton) {
            this.changeSideButton.style.cursor = 'pointer';
            this.changeSideButton.onclick = () => this.changeSide();
        }

        // Инициализация кнопок истории
        if (this.editorHistoryUndoBlock) {
            this.initHistoryUndoBlock();
        }

        if (this.editorHistoryRedoBlock) {
            this.initHistoryRedoBlock();
        }

        // Инициализация списка продуктов
        if (this.productListBlock && this.productItemBlock) {
            this.initProductList();
        }

        // Инициализация кнопки добавления заказа
        if (this.editorAddOrderButton) {
            this.initAddOrderButton();
        }

        // Инициализация кнопки загрузки изображения
        if (this.editorUploadImageButton) {
            this.initUploadImageButton();
        }

        // Инициализация формы
        if (this.formBlock && this.formButton) {
            this.initForm();
        }

        // Инициализация quantity form fix
        if (this.quantityFormBlock) {
            setTimeout(() => this.initFixQuantityForm(), 500);
        }

        // Показ списка layouts
        if (this.editorLayoutsListBlock) {
            this.showLayoutList();
        }

        if (this.editorUploadCancelButton) {
            this.editorUploadCancelButton.style.cursor = 'pointer';
            this.editorUploadCancelButton.onclick = () => {
                console.debug('[upload image button] cancel button clicked');
                // Полностью отменяем редактирование
                this.resetUserUploadImage();
            };
        }
    }

    // Вспомогательный метод для получения обязательных DOM элементов
    private getRequiredElement<T extends HTMLElement = HTMLElement>(selector: string): T {
        const element = document.querySelector<T>(selector);
        if (!element) {
            throw new Error(`[Editor] Не найден обязательный элемент: ${selector}`);
        }
        return element;
    }

    private async initializeEditor(): Promise<void> {
        try {
            // Ожидание готовности storage
            await this.storageManager.waitForReady();

            // Загрузка сохраненного состояния
            await this.loadState();

            // if (this.layouts.length === 0) {
            //     this.addLayout(new Layout({
            //         id: "start",
            //         view: "front",
            //         type: "image",
            //         url: "https://static.tildacdn.com/tild3930-3533-4464-b830-623133666233/Group_20.svg",
            //         name: "PrintLoop",
            //         position: { x: 0.22, y: 0.40 },
            //     }))
            // }

            // Предзагрузка mockups
            await this.preloadAllMockups();

            console.debug('[editor] Инициализация завершена');
        } catch (error) {
            console.error('[editor] Ошибка инициализации:', error);
            this.initializeWithDefaults();
        }
    }

    private async initializeWithDefaults(): Promise<void> {
        console.debug('[editor] Инициализация с дефолтными значениями');
        try {
            await this.updateMockup();
        } catch (err) {
            console.error('[editor] Ошибка загрузки mockup по умолчанию:', err);
        }
    }

    private initEvents(): void {

        // Показываем предупреждение только если опция не отключена и слои есть и дизайн не был добавлен в корзину
        if (!this.options?.disableBeforeUnloadWarning) {
            window.onbeforeunload = (e) => {
                if (this.layouts.length > 0 && !this.isAddedToCart && this.layersHistory.length > 0) {
                    const message = 'Дизайн редактора может быть потерян. Вы уверены, что хотите покинуть страницу?';
                    e.preventDefault();
                    e.returnValue = message; // Для старых браузеров
                    return message; // Для новых браузеров
                }

                return undefined;
            }
        }

        // Обработчик изменения размера окна для динамического пересчета canvas
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Обновление мокапа
        this.events.on(EditorEventType.MOCKUP_UPDATED, (dataURL) => {
            this.mockupBlock.src = dataURL;
        });
    }

    /**
     * Обработчик изменения размера окна с debounce
     * Пересчитывает размеры canvas и перерисовывает все слои
     */
    private handleResize(): void {
        // Очищаем предыдущий таймер
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        // Устанавливаем новый таймер с задержкой 150ms для debounce
        this.resizeTimeout = setTimeout(() => {
            console.debug('[canvas] Изменение размера окна, пересчет canvas');
            this.resizeAllCanvases();
        }, 150);
    }

    /**
     * Пересчитывает размеры всех canvas и перерисовывает слои
     * Этот метод вызывается при изменении размера окна
     */
    private async resizeAllCanvases(): Promise<void> {
        // Пересчитываем размеры всех canvas
        [...this.canvases, ...this.layersCanvases].forEach(canvas => {
            if (canvas) {
                canvas.setDimensions({
                    width: this.editorBlock.clientWidth,
                    height: this.editorBlock.clientHeight
                });
            }
        });

        // Перерисовываем печатные области на всех canvas
        this.canvases.forEach(canvas => {
            this.updatePrintAreaForCanvas(canvas);
        });

        // Перерисовываем все слои для текущей стороны
        if (this.activeCanvas && this._selectSide) {
            await this.redrawAllLayersForSide(this._selectSide);
        }

        // Перерисовываем слои для других сторон
        const otherSide: SideEnum = this._selectSide === 'front' ? 'back' : 'front';
        await this.redrawAllLayersForSide(otherSide);
    }

    /**
     * Получает конфигурацию печатной области для указанной стороны
     * @param side - Сторона (front/back)
     * @returns Конфигурация печатной области или undefined
     */
    private getPrintConfigForSide(side: SideEnum): any {
        const product = this.productConfigs.find(p => p.type === this._selectType);
        if (!product) return undefined;

        return product.printConfig.find((config: any) => config.side === side);
    }

    /**
     * Обновляет печатную область (clip area и border) для canvas
     * @param canvas - Canvas для обновления
     */
    private updatePrintAreaForCanvas(canvas: fabric.Canvas): void {
        if (!canvas) return;

        const side = (canvas as any).side;
        if (!side) return;

        const printConfig = this.getPrintConfigForSide(side);
        if (!printConfig) return;

        // Вычисляем новые размеры и позицию печатной области
        const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
        const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
        const left = (this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth);
        const top = (this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight);

        // Находим и обновляем clip area
        const clipArea = canvas.clipPath as fabric.Rect;
        if (clipArea) {
            clipArea.set({
                width,
                height,
                left,
                top
            });
        }

        // Находим и обновляем border
        const objects = canvas.getObjects() as any[];
        const areaBorder = objects.find(obj => obj.name === 'area:border');
        if (areaBorder) {
            areaBorder.set({
                width: width - 3,
                height: height - 3,
                left,
                top
            });
        }

        canvas.renderAll();
    }

    /**
     * Полностью перерисовывает все слои для указанной стороны
     * @param side - Сторона для перерисовки
     */
    private async redrawAllLayersForSide(side: SideEnum): Promise<void> {
        const canvas = this.canvases.find(c => (c as any).side === side);
        if (!canvas) return;

        // Получаем все объекты кроме служебных (area:border, area:clip)
        const objects = canvas.getObjects() as any[];
        const layoutObjects = objects.filter(obj => obj.name && !obj.name.startsWith('area:'));

        // Удаляем все объекты слоев
        layoutObjects.forEach(obj => canvas.remove(obj));

        // Добавляем все слои заново
        const layersForSide = this.layouts.filter(layout => layout.view === side);
        for (const layout of layersForSide) {
            await this.addLayoutToCanvas(layout);
        }

        canvas.renderAll();
    }

    private initLoadingEvents(): void {
        // Кэшируем DOM элементы для оптимизации
        this.loadingElementsCache.loadingText = this.editorLoadingBlock.querySelector('#loading-text') as HTMLElement;
        this.loadingElementsCache.spinner = this.editorLoadingBlock.querySelector('#spinner') as HTMLElement;

        // Событие обновления времени загрузки
        this.events.on(EditorEventType.LOADING_TIME_UPDATED, (loadingTime) => {
            const { loadingText, spinner } = this.loadingElementsCache;

            if (this.isLoading) {
                if (this.loadingTime > 5) {
                    if (loadingText) {
                        loadingText.style.display = "block";
                        loadingText.innerText = `${(this.loadingTime / 10).toFixed(1)}`;
                    }
                    if (spinner) {
                        spinner.style.display = "block";
                    }
                    this.editorLoadingBlock.style.backgroundColor = "rgba(255, 255, 255, 0.745)";
                } else {
                    if (loadingText) {
                        loadingText.style.display = "none";
                        loadingText.innerText = "";
                    }
                    if (spinner) {
                        spinner.style.display = "none";
                    }
                    this.editorLoadingBlock.style.backgroundColor = "rgba(255, 255, 255, 0)";
                }
            } else {
                if (loadingText) {
                    loadingText.style.display = "none";
                    loadingText.innerText = "";
                }
            }
        });

        // Событие начала/окончания загрузки мокапа
        this.events.on(EditorEventType.MOCKUP_LOADING, (isLoading) => {
            const { loadingText, spinner } = this.loadingElementsCache;

            if (isLoading) {
                // Начало загрузки
                if (this.loadingInterval) {
                    clearInterval(this.loadingInterval);
                }
                this.loadingTime = 0;
                this.isLoading = true;
                console.debug('[mockup] loading mockup');

                this.loadingInterval = setInterval(() => {
                    this.loadingTime++;
                    this.emit(EditorEventType.LOADING_TIME_UPDATED, this.loadingTime);
                }, 100);
            } else {
                // Окончание загрузки
                this.editorLoadingBlock.style.backgroundColor = "rgba(255, 255, 255, 0)";

                if (loadingText) {
                    loadingText.style.display = "none";
                    loadingText.innerText = "";
                }
                if (spinner) {
                    spinner.style.display = "none";
                }

                this.isLoading = false;

                if (this.loadingInterval) {
                    clearInterval(this.loadingInterval);
                    this.loadingInterval = null;
                }
                this.loadingTime = 0;
            }
        });
    }


    // Вспомогательный метод для отправки типизированных событий
    private emit<K extends EditorEventType>(
        type: K,
        detail: EditorEventMap[K]
    ): void {
        this.events.emit(type, detail);
    }

    private initKeyboardShortcuts(): void {
        document.addEventListener('keydown', (event) => {
            const activeElement = document.activeElement as HTMLElement;
            const isInputField = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.contentEditable === 'true' ||
                activeElement.isContentEditable
            );

            if (isInputField) return;

            // Ctrl+Z - undo
            if (event.ctrlKey && event.code === 'KeyZ' && !event.shiftKey) {
                event.preventDefault();
                this.undo();
                return;
            }

            // Ctrl+Shift+Z или Ctrl+Y - redo
            if ((event.ctrlKey && event.shiftKey && event.code === 'KeyZ') ||
                (event.ctrlKey && event.code === 'KeyY' && !event.shiftKey)) {
                event.preventDefault();
                this.redo();
                return;
            }
        });
    }

    private createBackgroundBlock(): HTMLElement {
        const background = document.createElement('div');
        background.classList.add('editor-position');
        background.id = 'editor-background';
        this.editorBlock.appendChild(background);
        return background;
    }

    private createMockupBlock(): HTMLImageElement {
        const mockup = document.createElement('img');
        mockup.classList.add('editor-position');
        mockup.id = 'editor-mockup';
        this.editorBlock.appendChild(mockup);
        return mockup;
    }

    private createCanvasesContainer(): HTMLElement {
        const canvas = document.createElement('div');
        canvas.classList.add('editor-position');
        canvas.id = 'editor-canvases-container';
        canvas.style.zIndex = '10';
        canvas.style.pointerEvents = 'auto';
        this.editorBlock.appendChild(canvas);
        return canvas;
    }

    private createEditorLoadingBlock(): HTMLElement {
        const editorLoadingBlock = document.createElement('div');
        editorLoadingBlock.style.display = "flex";
        editorLoadingBlock.classList.add('editor-position');
        editorLoadingBlock.id = 'editor-loading';
        editorLoadingBlock.style.zIndex = "1000";
        editorLoadingBlock.style.pointerEvents = "none";

        const loadingText = document.createElement('div');
        loadingText.id = 'loading-text';
        loadingText.style.display = "none";
        loadingText.style.textAlign = "center";
        loadingText.style.position = "absolute";
        loadingText.style.top = "50%";
        loadingText.style.left = "50%";
        loadingText.style.transform = "translate(-50%, -50%)";
        editorLoadingBlock.appendChild(loadingText);

        const spinner = document.createElement('div');
        spinner.id = 'spinner';
        spinner.style.display = "none";
        editorLoadingBlock.appendChild(spinner);

        this.editorBlock.appendChild(editorLoadingBlock);
        return editorLoadingBlock;
    }

    async updateMockup(): Promise<void> {
        console.debug(`[mockup] update for ${this._selectType} ${this._selectSide} ${this._selectColor.name}`);

        this.emit(EditorEventType.MOCKUP_LOADING, true);

        try {
            // Поиск URL mockup
            const mockupImageUrl = this.findMockupUrl();
            if (!mockupImageUrl) {
                throw new Error('[mockup] Не найден mockup для текущих параметров');
            }

            // Загрузка и преобразование изображения
            const dataURL = await this.loadAndConvertImage(mockupImageUrl);

            // Обновление UI
            this.emit(EditorEventType.MOCKUP_UPDATED, dataURL);
            this.mockupBlock.src = dataURL;

            console.debug('[mockup] Mockup успешно обновлен');
        } catch (error) {
            console.error('[mockup] Ошибка обновления mockup:', error);
            throw error;
        } finally {
            this.emit(EditorEventType.MOCKUP_LOADING, false);
        }
    }

    // Поиск URL mockup по текущим параметрам с мемоизацией
    private findMockupUrl(): string | null {
        const cacheKey = `${this._selectType}-${this._selectSide}-${this._selectColor.name}`;

        if (this.mockupCache.has(cacheKey)) {
            return this.mockupCache.get(cacheKey)!;
        }

        const product = this.getProductByType(this._selectType);
        if (!product) {
            this.mockupCache.set(cacheKey, null);
            return null;
        }

        const mockup = product.mockups.find(
            m => m.side === this._selectSide && m.color.name === this._selectColor.name
        );

        const url = mockup?.url || null;
        this.mockupCache.set(cacheKey, url);
        return url;
    }

    // Вспомогательный метод для получения продукта с мемоизацией
    private getProductByType(type: Product['type']): Product | undefined {
        if (!this.productCache.has(type)) {
            const product = this.productConfigs.find(p => p.type === type);
            if (product) {
                this.productCache.set(type, product);
            }
        }
        return this.productCache.get(type);
    }

    // Очистка кэша mockup при изменении состояния
    private clearMockupCache(): void {
        this.mockupCache.clear();
    }

    // Загрузка и конвертация изображения в DataURL с кэшированием
    private async loadAndConvertImage(imageUrl: string): Promise<string> {
        // Проверяем кэш
        if (this.imageCache.has(imageUrl)) {
            console.debug('[cache] Изображение загружено из кэша:', imageUrl);
            return this.imageCache.get(imageUrl)!;
        }

        return new Promise((resolve, reject) => {
            const image = new Image();
            image.setAttribute('crossOrigin', 'anonymous');

            image.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = image.width;
                    canvas.height = image.height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Не удалось получить контекст canvas'));
                        return;
                    }

                    ctx.drawImage(image, 0, 0);
                    const dataURL = canvas.toDataURL('image/png');

                    // Сохраняем в кэш
                    this.imageCache.set(imageUrl, dataURL);
                    console.debug('[cache] Изображение сохранено в кэш:', imageUrl);

                    resolve(dataURL);
                } catch (error) {
                    reject(error);
                }
            };

            image.onerror = () => {
                reject(new Error(`Ошибка загрузки изображения: ${imageUrl}`));
            };

            image.src = imageUrl;
        });
    }

    async saveState(): Promise<void> {
        console.debug('[state] Сохранение состояния редактора');
        try {
            const editorState: EditorState = {
                date: new Date().toISOString(),
                type: this._selectType,
                color: this._selectColor.name,
                side: this._selectSide,
                size: this._selectSize
            };
            console.debug(`[state] Сохраняем: type=${editorState.type}, color=${editorState.color}, side=${editorState.side}, size=${editorState.size}`);
            await this.storageManager.saveEditorState(editorState);
            console.debug('[state] Состояние успешно сохранено');
        } catch (error) {
            console.error('[state] Ошибка сохранения состояния:', error);
        }
    }

    async saveLayouts(): Promise<void> {
        console.debug('[layers] Сохранение слоёв');
        try {
            await this.storageManager.saveLayers(this.layouts);
            console.debug('[layers] Слои успешно сохранены');
        } catch (error) {
            console.error('[layers] Ошибка сохранения слоёв:', error);
        }
    }

    async loadLayouts(): Promise<void> {
        console.debug('[layers] Загрузка слоёв');
        try {
            const savedLayouts = await this.storageManager.loadLayers();
            if (savedLayouts && Array.isArray(savedLayouts)) {
                this.layouts = savedLayouts.map((layoutData: any) =>
                    new Layout(layoutData as LayoutProps)
                );
                console.debug(`[layers] Загружено ${this.layouts.length} слоёв`);
            } else {
                this.layouts = [];
                console.debug('[layers] Нет сохранённых слоёв');
            }

            // Всегда сохраняем начальное состояние в историю (даже если пусто)
            this.saveLayersToHistory();
        } catch (error) {
            console.error('[layers] Ошибка загрузки слоёв:', error);
            this.layouts = [];
            // Сохраняем пустое состояние в историю
            this.saveLayersToHistory();
        }
    }

    async loadState(): Promise<void> {
        console.debug('[state] Загрузка состояния редактора');

        try {
            const editorState = await this.storageManager.loadEditorState();

            if (!editorState) {
                console.debug('[state] Сохраненное состояние не найдено');
                await this.updateMockup();
                // Инициализация UI с дефолтными значениями
                this.loadProduct();
                this.initColorsList();
                this.initSizesList();
                this.showLayoutList();
                this.updateLayouts();
                this.updateSum();
                return;
            }

            // Проверка актуальности состояния
            if (this.isStateExpired(editorState.date)) {
                console.warn('[state] Состояние устарело, очищаем');
                await this.storageManager.clearEditorState();
                await this.updateMockup();
                // Инициализация UI с дефолтными значениями
                this.loadProduct();
                this.initColorsList();
                this.initSizesList();
                this.showLayoutList();
                this.updateLayouts();
                this.updateSum();
                return;
            }

            // Применение сохраненного состояния
            const applied = await this.applyState(editorState);

            if (applied) {
                console.debug('[state] Состояние успешно загружено');

                // Обновляем UI с восстановленным состоянием (БЕЗ saveState)
                await this.updateMockup();
                this.loadProduct();

                // Обновление визуального отображения выбранного продукта
                if (this.productBlocks.length > 0) {
                    this.productBlocks.forEach(block => {
                        block.style.background = 'rgb(222 222 222)';
                    });
                    const activeBlock = this.productBlocks.find(block =>
                        block.classList.contains('editor-settings__product-block__' + this._selectType)
                    );
                    if (activeBlock) {
                        activeBlock.style.background = '';
                    }
                }

                // Загрузка слоёв отдельно
                await this.loadLayouts();

                // Инициализация UI после загрузки состояния
                this.initColorsList();
                this.initSizesList();
                this.showLayoutList();
                this.updateLayouts();
                this.updateSum();
            } else {
                console.warn('[state] Не удалось применить сохраненное состояние');

                // Инициализация с дефолтными значениями
                await this.updateMockup();
                this.loadProduct();
                this.initColorsList();
                this.initSizesList();
                this.showLayoutList();
                this.updateLayouts();
                this.updateSum();
            }
        } catch (error) {
            console.error('[state] Ошибка загрузки состояния:', error);
            await this.updateMockup();
            this.loadProduct();
            this.initColorsList();
            this.initSizesList();
            this.showLayoutList();
            this.updateLayouts();
            this.updateSum();
        }
    }

    // Проверка актуальности состояния
    private isStateExpired(dateString: string): boolean {
        const stateDate = new Date(dateString);
        const expirationDate = Date.now() - (CONSTANTS.STATE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
        return stateDate.getTime() < expirationDate;
    }

    // Применение сохраненного состояния
    private async applyState(editorState: any): Promise<boolean> {
        try {
            // Валидация обязательных полей
            if (!editorState.type || !editorState.color || !editorState.side) {
                console.warn('[state] Некорректное состояние: отсутствуют обязательные поля');
                return false;
            }

            console.debug(`[state] Восстановление состояния: type=${editorState.type}, color=${editorState.color}, side=${editorState.side}, size=${editorState.size}`);

            // Поиск продукта
            const product = this.productConfigs.find(p => p.type === editorState.type);
            if (!product) {
                console.warn(`[state] Продукт типа ${editorState.type} не найден`);
                return false;
            }

            // Поиск mockup с нужным цветом
            const mockup = product.mockups.find(m => m.color.name === editorState.color);
            if (!mockup) {
                console.warn(`[state] Mockup с цветом ${editorState.color} не найден для продукта ${editorState.type}`);
                return false;
            }

            // Применение состояния
            this._selectType = editorState.type as Product['type'];
            this._selectColor = mockup.color;
            this._selectSide = editorState.side as SideEnum;
            this._selectSize = editorState.size as Size || this._selectSize;

            console.debug(`[state] Состояние применено: type=${this._selectType}, color=${this._selectColor.name}, side=${this._selectSide}, size=${this._selectSize}`);

            // Слои загружаются отдельно через loadLayouts
            return true;
        } catch (error) {
            console.error('[state] Ошибка применения состояния:', error);
            return false;
        }
    }


    // Методы для управления состоянием (без сохранения истории)
    setType(type: Product['type']): void {
        if (this._selectType !== type) {
            this._selectType = type;
            this.clearMockupCache(); // Очищаем кэш при изменении типа
            this.emit(EditorEventType.STATE_CHANGED, undefined);
            this.saveState().catch(err => console.error('[state] Ошибка сохранения:', err));
        }
    }

    setColor(color: Color): void {
        if (this._selectColor !== color) {
            this._selectColor = color;
            this.clearMockupCache(); // Очищаем кэш при изменении цвета
            this.emit(EditorEventType.STATE_CHANGED, undefined);
            this.saveState().catch(err => console.error('[state] Ошибка сохранения:', err));
        }
    }

    setSide(side: SideEnum): void {
        if (this._selectSide !== side) {
            this._selectSide = side;
            this.clearMockupCache(); // Очищаем кэш при изменении стороны
            this.emit(EditorEventType.STATE_CHANGED, undefined);
            this.saveState().catch(err => console.error('[state] Ошибка сохранения:', err));
        }
    }

    setSize(size: Size): void {
        if (this._selectSize !== size) {
            this._selectSize = size;
            this.emit(EditorEventType.STATE_CHANGED, undefined);
            this.saveState().catch(err => console.error('[state] Ошибка сохранения:', err));
        }
    }

    // Управление layouts (с сохранением истории)
    addLayout(layout: Layout): void {
        if (this.isRestoringFromHistory) {
            // При восстановлении из истории не создаем новую запись
            this.layouts.push(layout);
        } else {
            this.layouts.push(layout);
            this.saveLayersToHistory();
        }

        this.emit(EditorEventType.LAYOUT_ADDED, layout);
        this.updateLayouts();
        this.showLayoutList();
        this.saveLayouts().catch(err => console.error('[layers] Ошибка сохранения слоёв:', err));
    }

    removeLayout(layoutId: Layout['id']): boolean {
        const index = this.layouts.findIndex(l => l.id === layoutId);
        if (index !== -1) {
            const layout = this.layouts[index];
            if (layout) {
                this.layouts.splice(index, 1);

                if (!this.isRestoringFromHistory) {
                    this.saveLayersToHistory();
                }

                this.emit(EditorEventType.LAYOUT_REMOVED, layoutId);
                this.updateLayouts();
                this.saveLayouts().catch(err => console.error('[layers] Ошибка сохранения слоёв:', err));
                return true;
            }
        }
        return false;
    }

    updateLayout(layoutId: Layout['id'], updates: Partial<Layout>): boolean {
        const layout = this.layouts.find(l => l.id === layoutId);
        if (layout) {
            Object.assign(layout, updates);

            if (!this.isRestoringFromHistory) {
                // Сохраняем историю только при изменении картинки или названия
                if ('url' in updates || 'name' in updates) {
                    this.saveLayersToHistory();
                }
            }

            this.emit(EditorEventType.LAYOUT_UPDATED, layout);
            this.saveLayouts().catch(err => console.error('[layers] Ошибка сохранения слоёв:', err));
            return true;
        }
        return false;
    }

    getLayout(layoutId: Layout['id']): Layout | undefined {
        return this.layouts.find(l => l.id === layoutId);
    }

    // Геттеры для коллекций
    getLayouts(): readonly Layout[] {
        return this.layouts;
    }

    // ===========================================
    // Методы работы с UI
    // ===========================================

    private initHistoryUndoBlock(): void {
        console.debug('[history block] init undo');
        this.editorHistoryUndoBlock.style.cursor = 'pointer';
        this.editorHistoryUndoBlock.onclick = async () => {
            console.debug('[history undo block] clicked');
            await this.undo();
        };
        this.updateHistoryButtonsState();
    }

    private initHistoryRedoBlock(): void {
        console.debug('[history redo block] init redo');
        this.editorHistoryRedoBlock.style.cursor = 'pointer';
        this.editorHistoryRedoBlock.onclick = async () => {
            console.debug('[history redo block] clicked');
            await this.redo();
        };
        this.updateHistoryButtonsState();
    }

    private initProductList(): void {
        if (!this.productListBlock || !this.productItemBlock) return;

        console.debug('[ProductList] init product list');
        this.productItemBlock.style.display = 'none';

        this.productConfigs.forEach(product => {
            const productItem = this.productItemBlock!.cloneNode(true) as HTMLElement;
            productItem.style.display = 'table';

            const productImageWrapper = productItem.querySelector('.product-item-image') as HTMLElement;
            if (productImageWrapper) {
                const productImage = getLastChild(productImageWrapper);
                if (productImage) {
                    productImage.style.backgroundImage = `url(${product.mockups[0]?.url})`;
                    productImage.style.backgroundSize = 'cover';
                    productImage.style.backgroundPosition = 'center';
                    productImage.style.backgroundRepeat = 'no-repeat';
                }
            }

            const productTextWrapper = productItem.querySelector('.product-item-text') as HTMLElement;
            if (productTextWrapper) {
                const productText = getLastChild(productTextWrapper);
                if (productText) {
                    productText.innerText = product.productName;
                }
            }

            const productBlock = productItem.firstElementChild as HTMLElement;
            productBlock.classList.add('editor-settings__product-block__' + product.type);
            productBlock.style.cursor = 'pointer';
            productBlock.style.borderColor = 'transparent';

            productItem.onclick = () => this.changeProduct(product.type);
            this.productBlocks.push(productBlock);
            this.productListBlock!.firstElementChild!.appendChild(productItem);
        });

        // Только обновляем UI выбранного продукта, БЕЗ вызова полного changeProduct
        // (который вызывает saveState и перезаписывает состояние до его восстановления)
        if (this.productBlocks.length > 0) {
            this.productBlocks.forEach(block => {
                block.style.background = 'rgb(222 222 222)';
            });
            const activeBlock = this.productBlocks.find(block =>
                block.classList.contains('editor-settings__product-block__' + this._selectType)
            );
            if (activeBlock) {
                activeBlock.style.background = '';
            }
        }
    }

    initColorsList(): void {
        if (!this.editorColorsListBlock || !this.editorColorItemBlock) return;

        console.debug(`[settings] init colors for ${this._selectType}`);
        const product = this.getProductByType(this._selectType);
        if (!product) return;

        this.editorColorItemBlock.style.display = 'none';
        const colorsContainer = this.editorColorsListBlock.firstElementChild!;
        colorsContainer.innerHTML = '';
        this.colorBlocks = [];

        const colors = product.mockups
            .filter(mockup => mockup.side === this._selectSide)
            .map(mockup => mockup.color);

        colors.forEach(color => {
            const colorItem = this.editorColorItemBlock!.cloneNode(true) as HTMLElement;
            colorItem.style.display = 'table';

            const colorBlock = colorItem.firstElementChild as HTMLElement;
            colorBlock.classList.add('editor-settings__color-block__' + color.name);
            colorBlock.style.cursor = 'pointer';
            colorBlock.style.backgroundColor = color.hex;
            colorBlock.style.borderColor = 'transparent';

            colorItem.onclick = () => this.changeColor(color.name);
            this.colorBlocks.push(colorBlock);
            this.editorColorsListBlock!.firstElementChild!.appendChild(colorItem);
        });

        // Обновляем UI для отображения текущего цвета (без вызова changeColor, который вызывает saveState)
        if (this.colorBlocks.length > 0) {
            this.colorBlocks.forEach(block => {
                block.style.borderColor = '#f3f3f3';
            });
            const activeBlock = this.colorBlocks.find(block =>
                block.classList.contains('editor-settings__color-block__' + this._selectColor.name)
            );
            if (activeBlock) {
                activeBlock.style.borderColor = '';
            }
        }
    }

    initSizesList(): void {
        if (!this.editorSizesListBlock || !this.editorSizeItemBlock) return;

        console.debug(`[settings] init sizes for ${this._selectType}`);
        const product = this.getProductByType(this._selectType);
        if (!product || !product.sizes) return;

        this.editorSizeItemBlock.style.display = 'none';
        const sizesContainer = this.editorSizesListBlock.firstElementChild!;
        sizesContainer.innerHTML = '';
        this.sizeBlocks = [];

        product.sizes.forEach(size => {
            const sizeItem = this.editorSizeItemBlock!.cloneNode(true) as HTMLElement;
            sizeItem.style.display = 'table';
            sizeItem.style.cursor = 'pointer';
            sizeItem.style.userSelect = 'none';
            sizeItem.classList.add('editor-settings__size-block__' + size);

            const borderBlock = sizeItem.firstElementChild as HTMLElement;
            borderBlock.style.borderColor = '#f3f3f3';

            const sizeText = getLastChild(sizeItem);
            if (sizeText) {
                sizeText.innerText = size;
            }

            sizeItem.onclick = () => this.changeSize(size);
            this.sizeBlocks.push(sizeItem);
            this.editorSizesListBlock!.firstElementChild!.appendChild(sizeItem);
        });

        // Обновляем UI для отображения текущего размера (без вызова changeSize, который вызывает saveState)
        if (this.sizeBlocks.length > 0) {
            this.sizeBlocks.forEach(block => {
                const borderBlock = block.firstElementChild as HTMLElement;
                if (borderBlock) {
                    borderBlock.style.borderColor = '#f3f3f3';
                }
            });

            const activeBlock = this.sizeBlocks.find(block =>
                block.classList.contains('editor-settings__size-block__' + this._selectSize)
            );
            if (activeBlock) {
                const borderBlock = activeBlock.firstElementChild as HTMLElement;
                if (borderBlock) {
                    borderBlock.style.borderColor = '';
                }
            }
        }
    }

    showLayoutList(): void {
        console.debug('[settings] [layouts] show layouts list');

        if (!this.editorLayoutItemBlock) {
            console.error("[settings] [layouts] editorLayoutItemBlock is not initialized");
            return;
        }

        if (!this.editorLayoutsListBlock) {
            console.error("[settings] [layouts] editorLayoutsListBlock is not initialized");
            return;
        }

        this.editorLayoutItemBlock.style.display = 'none';
        this.editorLayoutsListBlock.firstElementChild!.innerHTML = '';

        console.debug(`[settings] [layouts] layouts list block children: ${this.editorLayoutsListBlock.firstElementChild!.children.length}`);

        // const layoutsToShow = this.layouts.filter(layout => layout.view === this._selectSide);
        // console.debug(`[settings] [layouts] layouts to show: ${layoutsToShow.length}`);

        this.layouts.forEach(layout => {
            const layoutItem = this.editorLayoutItemBlock!.cloneNode(true) as HTMLElement;
            layoutItem.style.display = 'table';

            // Подсвечиваем редактируемый слой
            const isEditing = this._selectLayout === layout.id;

            const previewBlock = this.editorLayoutItemBlockViewClass
                ? layoutItem.querySelector(this.editorLayoutItemBlockViewClass) as HTMLElement
                : null;
            const nameBlock = this.editorLayoutItemBlockNameClass
                ? layoutItem.querySelector(this.editorLayoutItemBlockNameClass) as HTMLElement
                : null;
            const removeBlock = this.editorLayoutItemBlockRemoveClass
                ? layoutItem.querySelector(this.editorLayoutItemBlockRemoveClass) as HTMLElement
                : null;
            const editBlock = this.editorLayoutItemBlockEditClass
                ? layoutItem.querySelector(this.editorLayoutItemBlockEditClass) as HTMLElement
                : null;

            if (previewBlock) {
                if (layout.isImageLayout()) {
                    const previewElement = previewBlock.firstElementChild as HTMLElement;
                    if (previewElement) {
                        previewElement.style.backgroundImage = `url(${layout.url})`;
                        previewElement.style.backgroundSize = 'contain';
                        previewElement.style.backgroundPosition = 'center';
                        previewElement.style.backgroundRepeat = 'no-repeat';
                    }

                    if (isEditing) {
                        previewElement.style.borderColor = 'rgb(254, 94, 58)';
                    } else {
                        previewElement.style.borderColor = '';
                    }
                } else if (layout.type === 'text') {
                    // Можно добавить специальную обработку для текстовых слоёв
                }
            }

            if (nameBlock) {
                const nameElement = nameBlock.firstElementChild as HTMLElement;
                if (nameElement) {
                    if (layout.type === 'image') {
                        const displayName = !layout.name
                            ? "Изображение"
                            : layout.name.includes("\n")
                                ? layout.name.split("\n")[0] + "..."
                                : layout.name.length > 40
                                    ? layout.name.slice(0, 40) + "..."
                                    : layout.name;
                        nameElement.innerText = displayName;
                    } else if (layout.type === 'text') {
                        nameElement.innerText = layout.name || "Текст";
                    }
                }
            }

            if (removeBlock) {
                removeBlock.style.cursor = 'pointer';
                removeBlock.onclick = () => {
                    this.removeLayout(layout.id);
                    this.showLayoutList();
                    if (isEditing) this.cancelEditLayout();
                };

                // Восстанавливаем иконку из data-original атрибута (для Tilda)
                this.restoreIconFromDataOriginal(removeBlock.firstElementChild as HTMLElement);
            }

            if (editBlock) {
                if (isEditing || layout.id === "start") {
                    editBlock.style.display = 'none';
                } else {
                    editBlock.style.display = 'table';
                }
                editBlock.style.cursor = 'pointer';
                editBlock.onclick = () => this.editLayout(layout);

                // Восстанавливаем иконку из data-original атрибута (для Tilda)
                this.restoreIconFromDataOriginal(getLastChild(editBlock));
            }

            this.editorLayoutsListBlock!.firstElementChild!.appendChild(layoutItem);
        });

        this.updateSum();
        console.debug(`[settings] [layouts] layouts shown: ${this.editorLayoutsListBlock.firstElementChild!.children.length}`);
    }

    private initAddOrderButton(): void {
        if (!this.editorAddOrderButton) return;

        this.editorAddOrderButton.style.cursor = 'pointer';

        // ИСПРАВЛЕНИЕ: Блокировать кнопку во время генерации
        this.events.on(EditorEventType.MOCKUP_LOADING, (isLoading) => {
            if (this.editorAddOrderButton) {
                if (isLoading) {
                    // Блокируем кнопку
                    (this.editorAddOrderButton as HTMLElement).style.opacity = '0.5';
                    (this.editorAddOrderButton as HTMLElement).style.cursor = 'not-allowed';
                    (this.editorAddOrderButton as HTMLElement).style.pointerEvents = 'none';
                    console.debug('[order] Кнопка заблокирована (идет генерация)');
                } else {
                    // Разблокируем кнопку
                    (this.editorAddOrderButton as HTMLElement).style.opacity = '1';
                    (this.editorAddOrderButton as HTMLElement).style.cursor = 'pointer';
                    (this.editorAddOrderButton as HTMLElement).style.pointerEvents = 'auto';
                    console.debug('[order] Кнопка разблокирована');
                }
            }
        });

        this.editorAddOrderButton.onclick = async () => {
            // НОВОЕ: Защита от повторных нажатий
            if (this.isAddingToCart) {
                console.warn('[order] Процесс добавления уже идет, игнорируем повторное нажатие');
                return;
            }

            if (this.getSum() === 0) {
                alert('Для добавления заказа продукт не может быть пустым');
                return;
            }

            // ИСПРАВЛЕНИЕ: Проверка что дизайн загружен
            if (this.layouts.length === 0) {
                alert('Пожалуйста, дождитесь завершения генерации дизайна');
                console.warn('[order] Попытка добавить в корзину без дизайна');
                return;
            }

            // Сохраняем оригинальный текст кнопки
            let buttonTextElement = this.editorAddOrderButton?.querySelector('.tn-atom') as HTMLElement;
            if (!buttonTextElement) {
                buttonTextElement = this.editorAddOrderButton?.querySelector('div, span') as HTMLElement;
            }
            const originalText = buttonTextElement?.textContent?.trim() || 'Добавить в корзину';

            try {
                // НОВОЕ: Устанавливаем флаг и показываем анимацию
                this.isAddingToCart = true;
                this.setAddToCartButtonLoading(true, 'Добавление...');
                const article = Math.floor(Math.random() * (99999999 - 999999 + 1)) + 999999;

                console.debug('[order] Начало создания заказа');

                // Экспортируем дизайн со всех сторон
                const exportedArt = await this.exportArt(true, 512);
                console.debug('[order] Экспорт дизайна завершен:', Object.keys(exportedArt));

                // Дополнительная проверка после экспорта
                if (Object.keys(exportedArt).length === 0) {
                    alert('Ошибка: не удалось экспортировать дизайн. Попробуйте еще раз.');
                    console.error('[order] Экспорт вернул пустой результат');
                    return;
                }

                // Преобразуем в формат для отправки
                const sides = Object.keys(exportedArt).map(side => ({
                    image_url: exportedArt[side] || '',
                }));

                // ========================================
                // ОПТИМИЗАЦИЯ (2025): Параллельная загрузка изображений на сервер
                // ========================================
                // БЫЛО: Загрузка по очереди (медленно)
                // СТАЛО: Все изображения загружаются одновременно через Promise.all
                // РЕЗУЛЬТАТ: Время загрузки сократилось в N раз (где N - количество сторон)
                console.debug('[order] Загрузка изображений на сервер...');
                const uploadPromises = sides.map(async (side) => {
                    const base64 = side.image_url.split(',')[1]!;
                    const uploadedUrl = await this.uploadImageToServer(base64);
                    return { side, uploadedUrl };
                });

                // Ждем завершения всех загрузок одновременно
                const uploadedSides = await Promise.all(uploadPromises);

                // Обновляем URL для всех сторон
                uploadedSides.forEach(({ side, uploadedUrl }) => {
                    side.image_url = uploadedUrl;
                });
                console.debug('[order] Изображения загружены на сервер');

                // Создаем продукт и добавляем в корзину
                const productName = `${this.capitalizeFirstLetter(this.getProductName())} с вашим ${Object.keys(exportedArt).length == 1 ? 'односторонним' : 'двухсторонним'} принтом`;


                const layouts = this.layouts.map(layout => ({ ...layout, url: undefined }));

                const userId = await this.storageManager.getUserId();
                const formData = new FormData();
                formData.append("layouts", JSON.stringify(layouts));
                formData.append("user_id", userId);
                formData.append("art", article.toString());

                // ИСПРАВЛЕНИЕ: Добавлен await для webhook
                await fetch(this.apiConfig.webhookCart, {
                    method: "POST",
                    body: formData
                });

                createProduct({
                    quantity: this.getQuantity(),
                    name: productName,
                    size: this._selectSize,
                    color: this._selectColor,
                    sides,
                    article,
                    price: this.getSum(),
                });

                // Устанавливаем флаг, что товар добавлен в корзину (отключаем предупреждение при уходе со страницы)
                this.isAddedToCart = true;

                console.debug('[order] Заказ успешно создан');

                // НОВОЕ: Показываем успешное добавление
                this.setAddToCartButtonLoading(false, '✓ Добавлено!');

                // Возвращаем оригинальный текст через 2 секунды
                setTimeout(() => {
                    this.setAddToCartButtonLoading(false, originalText);
                }, 2000);

            } catch (error) {
                console.error('[order] Ошибка создания заказа:', error);
                alert('Ошибка при создании заказа');

                // НОВОЕ: Восстанавливаем кнопку при ошибке
                this.setAddToCartButtonLoading(false, originalText);
            } finally {
                // НОВОЕ: Всегда сбрасываем флаг через небольшую задержку
                setTimeout(() => {
                    this.isAddingToCart = false;
                    console.debug('[order] Флаг isAddingToCart сброшен');
                }, 2000);
            }
        };
    }

    /**
     * НОВОЕ: Вспомогательная функция для анимации кнопки "Добавить в корзину"
     */
    private setAddToCartButtonLoading(isLoading: boolean, text?: string): void {
        if (!this.editorAddOrderButton) return;

        // Добавляем CSS анимацию если её еще нет
        this.injectPulseAnimation();

        const button = this.editorAddOrderButton as HTMLElement;

        // Пробуем найти текстовый элемент через разные селекторы
        let buttonTextElement = button.querySelector('.tn-atom') as HTMLElement;
        if (!buttonTextElement) {
            // Если .tn-atom не найден, ищем любой текстовый дочерний элемент
            buttonTextElement = button.querySelector('div, span') as HTMLElement;
        }

        // Если всё равно не найден, используем саму кнопку
        const textTarget = buttonTextElement || button;

        if (isLoading) {
            // Блокируем кнопку
            button.style.opacity = '0.7';
            button.style.cursor = 'not-allowed';
            button.style.pointerEvents = 'none';

            // Меняем текст
            if (text) {
                textTarget.textContent = text;
            }

            // Добавляем анимацию пульсации
            button.style.animation = 'cartButtonPulse 1.5s ease-in-out infinite';

            console.debug('[order] [animation] Кнопка заблокирована:', text);
        } else {
            // Разблокируем кнопку
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.style.pointerEvents = 'auto';
            button.style.animation = 'none';

            // Меняем текст
            if (text) {
                textTarget.textContent = text;
            }

            console.debug('[order] [animation] Кнопка разблокирована:', text);
        }
    }

    /**
     * НОВОЕ: Добавляет CSS анимацию пульсации в документ
     */
    private injectPulseAnimation(): void {
        // Проверяем, не добавлена ли уже анимация
        if (document.getElementById('cart-button-pulse-animation')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'cart-button-pulse-animation';
        style.textContent = `
            @keyframes cartButtonPulse {
                0%, 100% {
                    transform: scale(1);
                    opacity: 0.7;
                }
                50% {
                    transform: scale(1.02);
                    opacity: 0.85;
                }
            }
        `;
        document.head.appendChild(style);
        console.debug('[animation] CSS анимация пульсации добавлена');
    }

    /**
     * НОВОЕ: Вспомогательная функция для анимации кнопки "Сгенерировать"
     */
    private setGenerateButtonLoading(isLoading: boolean, text?: string): void {
        if (!this.formButton) return;

        // Добавляем CSS анимацию если её еще нет
        this.injectPulseAnimation();

        const button = this.formButton as HTMLElement;

        // Пробуем найти текстовый элемент через разные селекторы
        let buttonTextElement = button.querySelector('.tn-atom') as HTMLElement;
        if (!buttonTextElement) {
            // Если .tn-atom не найден, ищем любой текстовый дочерний элемент
            buttonTextElement = button.querySelector('div, span') as HTMLElement;
        }

        // Если всё равно не найден, используем саму кнопку
        const textTarget = buttonTextElement || button;

        if (isLoading) {
            // Блокируем кнопку
            button.style.opacity = '0.7';
            button.style.cursor = 'not-allowed';
            button.style.pointerEvents = 'none';

            // Меняем текст
            if (text) {
                textTarget.textContent = text;
            }

            // Добавляем анимацию пульсации
            button.style.animation = 'cartButtonPulse 1.5s ease-in-out infinite';

            console.debug('[generate] [animation] Кнопка заблокирована:', text);
        } else {
            // Разблокируем кнопку
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.style.pointerEvents = 'auto';
            button.style.animation = 'none';

            // Меняем текст
            if (text) {
                textTarget.textContent = text;
            }

            console.debug('[generate] [animation] Кнопка разблокирована:', text);
        }
    }

    /**
     * Блокирует/разблокирует элементы управления (цвет, вид, продукт) во время генерации
     */
    private setControlsDisabled(disabled: boolean): void {
        const opacity = disabled ? '0.5' : '1';
        const pointerEvents = disabled ? 'none' : 'auto';
        const cursor = disabled ? 'not-allowed' : 'pointer';

        // Блокируем кнопку смены вида
        if (this.changeSideButton) {
            this.changeSideButton.style.opacity = opacity;
            this.changeSideButton.style.pointerEvents = pointerEvents;
            this.changeSideButton.style.cursor = cursor;
        }

        // Блокируем блоки цветов
        this.colorBlocks.forEach(block => {
            const parent = block.parentElement;
            if (parent) {
                parent.style.opacity = opacity;
                parent.style.pointerEvents = pointerEvents;
                parent.style.cursor = cursor;
            }
        });

        // Блокируем блоки продуктов
        this.productBlocks.forEach(block => {
            const parent = block.parentElement;
            if (parent) {
                parent.style.opacity = opacity;
                parent.style.pointerEvents = pointerEvents;
                parent.style.cursor = cursor;
            }
        });

        console.debug(`[controls] Элементы управления ${disabled ? 'заблокированы' : 'разблокированы'}`);
    }

    private initUploadImageButton(): void {
        if (!this.editorUploadImageButton) return;

        this.resetUserUploadImage();

        this.editorUploadImageButton.style.cursor = 'pointer';
        this.editorUploadImageButton.addEventListener('click', () => {
            this.uploadUserImage();
        });
    }

    private initFixQuantityForm(): void {
        if (!this.quantityFormBlock) return;

        const form = this.quantityFormBlock.querySelector('form');
        const input = form?.querySelector('input[name="quantity"]') as HTMLInputElement;

        if (!input) return;

        // Оптимизация: используем событие вместо setInterval для лучшей производительности
        const validateQuantity = () => {
            const value = input.value.trim();

            // Если пустое значение или не число
            if (value === '' || isNaN(Number(value))) {
                input.value = '1';
                return;
            }

            const quantity = parseInt(value, 10);

            // Если меньше 1 или равно 0
            if (quantity < 1 || quantity === 0) {
                input.value = '1';
            }
        };

        // Валидация при вводе (в реальном времени)
        input.addEventListener('input', validateQuantity);

        // Валидация при потере фокуса (окончательная проверка)
        input.addEventListener('blur', validateQuantity);

        // Валидация при изменении
        input.addEventListener('change', validateQuantity);

        // Начальная валидация
        validateQuantity();
    }

    private async initForm(): Promise<void> {
        if (!this.formBlock || !this.formButton || !this.formInputVariableName) return;

        const formBlock = this.formBlock;
        const formInputVariableName = this.formInputVariableName;
        const formButton = this.formButton;

        const handleClick = async () => {
            console.debug('[form] [button] clicked');

            // НОВОЕ: Защита от повторных генераций
            if (this.isGenerating) {
                console.warn('[form] Генерация уже идет, игнорируем повторное нажатие');
                return;
            }

            const formInput = formBlock.querySelector(`[name="${formInputVariableName}"]`) as HTMLInputElement | HTMLTextAreaElement;
            const prompt = formInput.value;

            // Валидация
            if (!this.loadedUserImage) {
                if (!prompt || prompt.trim() === "" || prompt.length < 1) {
                    console.warn('[form] [input] prompt is empty or too short');
                    alert("Минимальная длина запроса 1 символ");
                    return;
                }
            }

            console.debug(`[form] [input] prompt: ${prompt}`);

            // НОВОЕ: Устанавливаем флаг и показываем анимацию
            this.isGenerating = true;
            this.setGenerateButtonLoading(true, 'Генерация...');
            this.setControlsDisabled(true);  // Блокируем элементы управления

            this.emit(EditorEventType.MOCKUP_LOADING, true);

            const layoutId = this._selectLayout || Layout.generateId();

            try {
                const url = await generateImage({
                    uri: this.apiConfig.webhookRequest,
                    prompt,
                    shirtColor: this._selectColor.name,
                    image: this._selectLayout ? this.loadedUserImage !== this.layouts.find(layout => layout.id === this._selectLayout)?.url ? this.loadedUserImage : null : this.loadedUserImage,
                    withAi: this.editorLoadWithAi,
                    layoutId,
                    isNew: this._selectLayout ? false : true,
                    background: !this.removeBackgroundEnabled, // Инвертируем: если "удалить фон" включен, то background=false
                });

                try {
                    (window as any).ym(103279214, 'reachGoal', 'generated');
                } catch (error) { }

                this.emit(EditorEventType.MOCKUP_LOADING, false);

                const imageData = await this.getImageData(url);
                console.debug(`[form] [input] image data received`);

                if (this._selectLayout) {
                    // Режим редактирования существующего layout
                    const layout = this.layouts.find(layout => layout.id === layoutId);

                    if (layout && layout.isImageLayout()) {
                        console.debug(`[form] [input] updating layout: ${layout.id}`);

                        layout.name = prompt;
                        layout.url = imageData;

                        console.debug(`[form] [input] layout updated`);

                        this.showLayoutList();
                        this.updateLayouts();
                        this.saveState();
                    }
                } else {
                    // Режим создания нового layout
                    this.addLayout(Layout.createImage({
                        id: layoutId,
                        view: this._selectSide,
                        url: imageData,
                        name: prompt
                    }));
                }


                formInput.style.borderColor = '#f3f3f3';
                this._selectLayout = null;
                formInput.value = "";
                this.cancelEditLayout();
                this.resetUserUploadImage();
                // Обновляем список слоёв для удаления подсветки
                this.showLayoutList();

                // НОВОЕ: Показываем успешную генерацию
                this.setGenerateButtonLoading(false, '✓ Готово!');
                this.setControlsDisabled(false);  // Разблокируем элементы управления

                // Возвращаем оригинальный текст через 2 секунды
                setTimeout(() => {
                    this.setGenerateButtonLoading(false, 'Сгенерировать');
                    this.isGenerating = false;
                    console.debug('[form] Флаг isGenerating сброшен');
                }, 2000);

            } catch (error) {
                this.emit(EditorEventType.MOCKUP_LOADING, false);
                console.error('[form] [input] error', error);
                alert("Ошибка при генерации изображения");

                // НОВОЕ: Восстанавливаем кнопку при ошибке
                this.setGenerateButtonLoading(false, 'Сгенерировать');
                this.setControlsDisabled(false);  // Разблокируем элементы управления
                this.isGenerating = false;

                return;
            } finally {
                if (this.loadedUserImage) {
                    this.resetUserUploadImage();
                }

                // Всегда сбрасываем режим редактирования
                if (this._selectLayout) {
                    this._selectLayout = null;
                    this.cancelEditLayout();
                }
            }
        };

        // Ждём появления формы (для Tilda)
        const form = await new Promise<HTMLFormElement | null>((resolve) => {
            const interval = setInterval(() => {
                const form = formBlock.querySelector("form") as HTMLFormElement;
                if (form) {
                    clearInterval(interval);
                    resolve(form);
                }
            }, 100);

            setTimeout(() => {
                clearInterval(interval);
                resolve(null);
            }, 1000 * 10);
        });

        if (!form) {
            console.warn('[form] form not found');
            return;
        }

        // Настройка формы
        form.action = "";
        form.method = "GET";
        form.onsubmit = (event) => {
            event.preventDefault();
            handleClick();
        };

        // Стилизация textarea
        const fixInputBlock = form.querySelector(`textarea[name='${formInputVariableName}']`) as HTMLElement;
        if (fixInputBlock) {
            fixInputBlock.style.padding = "8px";
        }

        // Настройка кнопки
        formButton.onclick = handleClick;
        formButton.style.cursor = "pointer";

        console.debug('[form] Инициализация формы завершена');
    }

    // ===========================================
    // Вспомогательные методы UI
    // ===========================================

    private restoreIconFromDataOriginal(element: HTMLElement | null): void {
        if (!element) return;

        const dataOriginal = element.attributes.getNamedItem("data-original")?.value;
        if (dataOriginal) {
            element.style.backgroundImage = `url("${dataOriginal}")`;
        }
    }

    changeProduct(productType: Product['type']): void {
        // Блокируем переключение продукта во время генерации
        if (this.isGenerating) {
            console.warn('[changeProduct] Генерация в процессе, переключение заблокировано');
            return;
        }

        this._selectType = productType;
        this.clearMockupCache(); // Очищаем кэш при смене продукта

        // Проверяем, существует ли текущий цвет для нового продукта
        const product = this.getProductByType(productType);
        if (product) {
            const mockupWithCurrentColor = product.mockups.find(
                m => m.side === this._selectSide && m.color.name === this._selectColor.name
            );

            // Если текущий цвет не существует для нового продукта, берем первый доступный цвет
            if (!mockupWithCurrentColor) {
                const firstMockup = product.mockups.find(m => m.side === this._selectSide);
                if (firstMockup) {
                    this._selectColor = firstMockup.color;
                    console.debug(`[product] Цвет изменен на ${this._selectColor.name} для продукта ${productType}`);
                }
            }
        }

        this.updateProductBlocksUI();
        this.updateMockup();
        this.loadProduct();
        this.showLayoutList();
        this.updateLayouts();
        this.updateSum();
        this.saveState();
    }

    // Вспомогательный метод для обновления UI блоков продуктов
    private updateProductBlocksUI(): void {
        if (this.productBlocks.length === 0) return;

        this.productBlocks.forEach(block => {
            block.style.background = 'rgb(222 222 222)';
        });

        const activeBlock = this.productBlocks.find(block =>
            block.classList.contains('editor-settings__product-block__' + this._selectType)
        );
        if (activeBlock) {
            activeBlock.style.background = '';
        }
    }

    changeSide(): void {
        // Блокируем переключение вида во время генерации
        if (this.isGenerating) {
            console.warn('[changeSide] Генерация в процессе, переключение заблокировано');
            return;
        }

        const newSide: SideEnum = this._selectSide === 'front' ? 'back' : 'front';
        this.setActiveSide(newSide);
        this.updateMockup();
        this.showLayoutList();
        this.updateLayouts();
        this.saveState();
        this.emit(EditorEventType.STATE_CHANGED, undefined);
    }

    changeColor(colorName: string): void {
        // Блокируем переключение цвета во время генерации
        if (this.isGenerating) {
            console.warn('[changeColor] Генерация в процессе, переключение заблокировано');
            return;
        }

        const product = this.getProductByType(this._selectType);
        if (!product) return;

        const mockup = product.mockups.find(m => m.color.name === colorName);
        if (!mockup) return;

        this._selectColor = mockup.color;
        this.clearMockupCache(); // Очищаем кэш при смене цвета

        this.updateColorBlocksUI(colorName);
        this.updateMockup();
        this.saveState();
    }

    // Вспомогательный метод для обновления UI блоков цветов
    private updateColorBlocksUI(colorName: string): void {
        if (this.colorBlocks.length === 0) return;

        this.colorBlocks.forEach(block => {
            block.style.borderColor = '#f3f3f3';
        });

        const activeBlock = this.colorBlocks.find(block =>
            block.classList.contains('editor-settings__color-block__' + colorName)
        );
        if (activeBlock) {
            activeBlock.style.borderColor = '';
        }
    }

    changeSize(size: Size): void {
        this.updateSizeBlocksUI(size);
        this._selectSize = size;
        this.saveState();
    }

    // Вспомогательный метод для обновления UI блоков размеров
    private updateSizeBlocksUI(size: Size): void {
        if (this.sizeBlocks.length === 0) return;

        this.sizeBlocks.forEach(block => {
            const borderBlock = block.firstElementChild as HTMLElement;
            if (borderBlock) {
                borderBlock.style.borderColor = '#f3f3f3';
            }
        });

        const activeBlock = this.sizeBlocks.find(block =>
            block.classList.contains('editor-settings__size-block__' + size)
        );
        if (activeBlock) {
            const borderBlock = activeBlock.firstElementChild as HTMLElement;
            if (borderBlock) {
                borderBlock.style.borderColor = '';
            }
        }
    }

    editLayout(layout: Layout): void {
        console.debug(`[settings] [layouts] edit layout ${layout.id}`);
        this._selectLayout = layout.id;

        if (this.formBlock && this.formInputVariableName) {
            // Ищем input или textarea
            const formInput = this.formBlock.querySelector(`[name="${this.formInputVariableName}"]`) as HTMLInputElement | HTMLTextAreaElement;
            if (formInput) {
                formInput.value = layout.name || '';

                // Подсвечиваем textarea при редактировании
                formInput.style.borderColor = 'rgb(254, 94, 58)';

                // Фокусируемся на поле
                formInput.focus();

                console.debug(`[settings] [layouts] Установлено значение в форму: "${layout.name}"`);
            } else {
                console.warn(`[settings] [layouts] Не найден элемент формы с именем "${this.formInputVariableName}"`);
            }
        }

        if (layout.isImageLayout()) {
            this.loadedUserImage = layout.url;
            this.setUserUploadImage(layout.url);
            // Инициализируем кнопки ИИ для редактирования
            this.initAiButtons();
            this.hideAiButtons();
        } else {
            this.loadedUserImage = null;
            this.resetUserUploadImage();
        }

        // Обновляем список слоёв для отображения подсветки
        this.showLayoutList();
    }

    cancelEditLayout(): void {
        console.debug(`[settings] [layouts] cancel edit layout`);

        // Сбрасываем выбранный layout
        this._selectLayout = null;

        // Очищаем форму и сбрасываем подсветку
        if (this.formBlock && this.formInputVariableName) {
            const formInput = this.formBlock.querySelector(`[name="${this.formInputVariableName}"]`) as HTMLInputElement | HTMLTextAreaElement;
            if (formInput) {
                formInput.value = '';
                formInput.style.borderColor = '#f3f3f3';
            }
        }

        // Сбрасываем загруженное изображение
        this.loadedUserImage = null;
        this.editorLoadWithAi = false;

        // Обновляем список слоёв для удаления подсветки
        this.showLayoutList();

        console.debug(`[settings] [layouts] Редактирование отменено`);
    }

    private initAiButtons(): void {
        // Устанавливаем начальное состояние
        this.editorLoadWithAi = false;
        this.changeLoadWithAi();

        // Инициализируем кнопку "С ИИ"
        if (this.editorLoadWithAiButton) {
            this.editorLoadWithAiButton.style.display = 'table';
            this.editorLoadWithAiButton.style.cursor = 'pointer';
            this.editorLoadWithAiButton.onclick = () => {
                this.changeLoadWithAi(true);
            };
        }

        // Инициализируем кнопку "Без ИИ"
        if (this.editorLoadWithoutAiButton) {
            this.editorLoadWithoutAiButton.style.display = 'table';
            this.editorLoadWithoutAiButton.style.cursor = 'pointer';
            this.editorLoadWithoutAiButton.onclick = () => {
                this.changeLoadWithAi(false);
            };
        }

        // Инициализируем чекбокс удаления фона
        this.initRemoveBackgroundCheckbox();
    }

    private initRemoveBackgroundCheckbox(): void {
        if (!this.editorRemoveBackgroundButton) return;

        // Инициализируем начальное состояние
        this.changeRemoveBackground();

        // Устанавливаем обработчик клика по кнопке
        this.editorRemoveBackgroundButton.style.cursor = 'pointer';
        this.editorRemoveBackgroundButton.onclick = () => {
            this.changeRemoveBackground(!this.removeBackgroundEnabled);
        };

        // Начальное состояние - скрыт (будет показан при выборе "Без ИИ")
        this.updateRemoveBackgroundVisibility();
    }

    private updateRemoveBackgroundVisibility(): void {
        if (!this.editorRemoveBackgroundButton) return;

        const parentElement = this.editorRemoveBackgroundButton.parentElement;
        if (!parentElement) return;

        // Кнопка видна только при не-ИИ генерации (когда загружено изображение)
        if (this.loadedUserImage && !this.editorLoadWithAi) {
            parentElement.style.display = '';
            console.debug('[remove background] Кнопка показана (не-ИИ режим)');
        } else {
            parentElement.style.display = 'none';
            this.changeRemoveBackground(false);
            console.debug('[remove background] Кнопка скрыта (ИИ режим или нет изображения)');
        }
    }

    private changeRemoveBackground(value: boolean = false): void {
        this.removeBackgroundEnabled = value;

        if (this.editorRemoveBackgroundButton) {
            const buttonElement = getLastChild(this.editorRemoveBackgroundButton);
            if (buttonElement) {
                if (value) {
                    // Активное состояние - обычная граница
                    buttonElement.style.borderColor = '';
                } else {
                    // Неактивное состояние - серая граница
                    buttonElement.style.borderColor = '#f2f2f2';
                }
            }
        }

        console.debug('[remove background] Состояние изменено:', this.removeBackgroundEnabled);
    }

    private hideAiButtons(): void {
        this.editorLoadWithAi = true;

        if (this.editorLoadWithAiButton) {
            (this.editorLoadWithAiButton.parentElement?.parentElement?.parentElement as HTMLElement).style.display = 'none';
        }

    }

    private showAiButtons(): void {
        if (this.editorLoadWithAiButton) {
            (this.editorLoadWithAiButton.parentElement?.parentElement?.parentElement as HTMLElement).style.display = 'flex';
        }
    }

    uploadUserImage(): void {
        console.debug('[upload user image] starting user image upload');

        // Инициализируем кнопки ИИ
        this.initAiButtons();
        this.showAiButtons();

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';

        fileInput.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];

            if (file) {
                console.debug('[upload user image] file selected:', file.name);

                if (!file.type.startsWith('image/')) {
                    console.warn('[upload user image] selected file is not an image');
                    alert('Пожалуйста, выберите файл изображения');
                    return;
                }

                const reader = new FileReader();
                reader.onload = async (e) => {
                    const imageUrl = e.target?.result as string;
                    console.debug('[upload user image] file loaded as data URL');

                    const imageData = await this.getImageData(imageUrl);
                    this.setUserUploadImage(imageData);

                    console.debug('[upload user image] image layout added successfully');
                };

                reader.onerror = () => {
                    console.error('[upload user image] error reading file');
                    alert('Ошибка при загрузке файла');
                };

                reader.readAsDataURL(file);
            }
        };

        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    setUserUploadImage(image: string): void {
        this.loadedUserImage = image;

        if (this.editorUploadViewBlock) {
            this.editorUploadViewBlock.style.display = 'table';
            const imageBlock = getLastChild(this.editorUploadViewBlock);
            if (imageBlock) {
                imageBlock.style.backgroundImage = `url(${image})`;
                imageBlock.style.backgroundSize = 'contain';
                imageBlock.style.backgroundPosition = 'center';
                imageBlock.style.backgroundRepeat = 'no-repeat';
            }
        }

        // Обновляем видимость чекбокса удаления фона
        this.updateRemoveBackgroundVisibility();
    }

    resetUserUploadImage(): void {
        if (this.editorUploadViewBlock) {
            this.editorUploadViewBlock.style.display = 'none';
        }

        this.loadedUserImage = null;
        this.cancelEditLayout();

        // Обновляем видимость чекбокса удаления фона
        this.updateRemoveBackgroundVisibility();
    }

    changeLoadWithAi(value: boolean = false): void {
        this.editorLoadWithAi = value;

        if (this.editorLoadWithAiButton && this.editorLoadWithoutAiButton) {
            const buttonWithAi = this.editorLoadWithAiButton;
            const buttonWithoutAi = this.editorLoadWithoutAiButton;

            if (value) {
                const fixButtonWithAi = getLastChild(buttonWithAi);
                const fixButtonWithoutAi = getLastChild(buttonWithoutAi);
                if (fixButtonWithAi) {
                    fixButtonWithAi.style.borderColor = '';
                }
                if (fixButtonWithoutAi) {
                    fixButtonWithoutAi.style.borderColor = '#f2f2f2';
                }
            } else {
                const fixButtonWithAi = getLastChild(buttonWithAi);
                const fixButtonWithoutAi = getLastChild(buttonWithoutAi);
                if (fixButtonWithAi) {
                    fixButtonWithAi.style.borderColor = '#f2f2f2';
                }
                if (fixButtonWithoutAi) {
                    fixButtonWithoutAi.style.borderColor = '';
                }
            }
        }

        // Обновляем видимость чекбокса удаления фона
        this.updateRemoveBackgroundVisibility();
    }


    private loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    getQuantity(): number {
        if (!this.quantityFormBlock) return 1;

        const form = this.quantityFormBlock.querySelector('form');
        const input = form?.querySelector('input[name="quantity"]') as HTMLInputElement;

        if (!input) return 1;
        return parseInt(input.value) || 1;
    }

    getSum(): number {
        const hasFront = this.layouts.some(layout => layout.view === 'front');
        const hasBack = this.layouts.some(layout => layout.view === 'back');

        const product = this.getProductByType(this._selectType);
        if (!product) return 0;

        const price = hasBack && hasFront
            ? product.doubleSidedPrice
            : product.price;
        return price;
    }

    updateSum(): void {
        if (!this.editorSumBlock) return;

        const sum = this.getSum();
        const sumText = getLastChild(this.editorSumBlock);
        if (sumText) {
            sumText.innerText = sum.toString() + ' ₽';
        }

        // Update button style based on sum
        if (this.editorAddOrderButton) {
            const buttonBlock = getLastChild(this.editorAddOrderButton);
            if (buttonBlock) {
                buttonBlock.style.backgroundColor = sum === 0 ? 'rgb(121 121 121)' : '';
            }
        }
    }

    // ===========================================
    // Методы работы с Canvas (Fabric.js)
    // ===========================================

    loadProduct(): void {
        const product = this.getProductByType(this._selectType);
        if (!product || !product.printConfig) {
            console.warn('[product] product or printConfig not found');
            return;
        }

        this.clearAllCanvas();

        for (const printConfig of product.printConfig) {
            this.createCanvasForSide(printConfig);
        }

        this.setActiveSide(this._selectSide);

        setTimeout(() => {
            this.isLoading = false;
            this.emit(EditorEventType.MOCKUP_LOADING, false);
        }, 100);
    }

    private clearAllCanvas(): void {
        if (this.canvasesContainer) {
            this.canvasesContainer.innerHTML = '';
        }

        this.canvases.forEach(canvas => {
            try {
                canvas.dispose();
            } catch (err) {
                console.error('[canvas] Ошибка очистки canvas:', err);
            }
        });

        this.canvases = [];
        this.layersCanvases = [];
        this.activeCanvas = null;
    }

    private createCanvasForSide(printConfig: any): void {
        if (!this.canvasesContainer) {
            console.error('[canvas] canvasesContainer не инициализирован');
            return;
        }

        // Создание статического canvas для слоев
        const layersCanvasBlock = document.createElement('canvas');
        layersCanvasBlock.id = 'layers--' + printConfig.side;
        layersCanvasBlock.classList.add('editor-position');
        layersCanvasBlock.setAttribute('ref', printConfig.side);
        layersCanvasBlock.style.zIndex = '7';

        this.canvasesContainer.appendChild(layersCanvasBlock);

        const layersCanvas = new fabric.StaticCanvas(layersCanvasBlock, {
            width: this.editorBlock.clientWidth,
            height: this.editorBlock.clientHeight,
        });
        (layersCanvas as any).side = printConfig.side;
        (layersCanvas as any).name = 'static-' + printConfig.side;

        // Создание редактируемого canvas
        const editableCanvasBlock = document.createElement('canvas');
        editableCanvasBlock.id = 'editable--' + printConfig.side;
        editableCanvasBlock.setAttribute('ref', printConfig.side);
        editableCanvasBlock.classList.add('editor-position');
        editableCanvasBlock.style.zIndex = '9';

        this.canvasesContainer.appendChild(editableCanvasBlock);

        const editableCanvas = new fabric.Canvas(editableCanvasBlock, {
            controlsAboveOverlay: true,
            width: this.editorBlock.clientWidth,
            height: this.editorBlock.clientHeight,
            backgroundColor: 'transparent',
            uniformScaling: true
        });
        (editableCanvas as any).side = printConfig.side;
        (editableCanvas as any).name = 'editable-' + printConfig.side;

        this.layersCanvases.push(layersCanvas);
        this.canvases.push(editableCanvas);

        if (this.canvases.length === 1) {
            this.activeCanvas = editableCanvas;
        }

        this.initMainCanvas(editableCanvas, printConfig);
    }

    private initMainCanvas(canvas: fabric.Canvas, printConfig: any): void {
        if (!canvas || !(canvas instanceof fabric.Canvas)) {
            console.warn('[canvas] canvas не валиден');
            return;
        }

        const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
        const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
        const left = (this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth);
        const top = (this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight);

        // Создание области обрезки
        const clipArea = new fabric.Rect({
            width,
            height,
            left,
            top,
            fill: 'rgb(255, 0, 0)',
            name: 'area:clip',
            evented: false,
        } as any);

        // Создание границы области
        const areaBorder = new fabric.Rect({
            width: width - 3,
            height: height - 3,
            left,
            top,
            fill: 'rgba(0,0,0,0)',
            strokeWidth: 3,
            stroke: 'rgb(254, 94, 58)',
            name: 'area:border',
            opacity: 0.3,
            evented: false,
            selectable: false,
            hasControls: false,
            strokeDashArray: [5, 5],
        } as any);

        canvas.add(areaBorder);
        canvas.clipPath = clipArea;

        // Обработчики событий canvas
        this.setupCanvasEventHandlers(canvas, printConfig);
    }

    private setupCanvasEventHandlers(canvas: fabric.Canvas, printConfig: any): void {
        // Mouse down - показать границу
        canvas.on('mouse:down', () => {
            const border = this.getObject('area:border', canvas);
            if (border) {
                border.set('opacity', 0.8);
                canvas.requestRenderAll();
            }
        });

        // Mouse up - скрыть границу
        canvas.on('mouse:up', () => {
            const border = this.getObject('area:border', canvas);
            if (border) {
                border.set('opacity', 0.3);
                canvas.requestRenderAll();
            }
        });

        // Вращение с привязкой к углам
        canvas.on('object:rotating', (e) => {
            if (e.target?.angle !== undefined) {
                const angles = [0, 90, 180, 270];
                const currentAngle = e.target.angle % 360;
                for (const snapAngle of angles) {
                    if (Math.abs(currentAngle - snapAngle) < 5) {
                        e.target.rotate(snapAngle);
                    }
                }
            }
        });

        // Перемещение с направляющими
        canvas.on('object:moving', (e) => {
            this.handleObjectMoving(e, canvas, printConfig);
        });

        // Изменение объекта
        canvas.on('object:modified', (e) => {
            this.handleObjectModified(e, canvas, printConfig);
        });
    }

    private handleObjectMoving(e: fabric.IEvent, canvas: fabric.Canvas, printConfig: any): void {
        if (!e.target || e.target.name === 'area:border' || e.target.name === 'area:clip') {
            return;
        }

        const layout = this.layouts.find(l => l.id === e.target!.name);
        if (!layout) return;

        const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
        const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
        const left = Math.round((this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth));
        const top = Math.round((this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight));

        const objWidth = e.target.width! * e.target.scaleX!;
        const objHeight = e.target.height! * e.target.scaleY!;
        const objCenterLeft = e.target.left! + objWidth / 2;
        const objCenterTop = e.target.top! + objHeight / 2;

        const nearX = Math.abs(objCenterLeft - (left + width / 2)) < 7;
        const nearY = Math.abs(objCenterTop - (top + height / 2)) < 7;

        // Вертикальная направляющая
        if (nearX) {
            this.showGuideline(canvas, 'vertical', left + width / 2, 0, left + width / 2, this.editorBlock.clientHeight);
            e.target.set({ left: left + width / 2 - objWidth / 2 });
        } else {
            this.hideGuideline(canvas, 'vertical');
        }

        // Горизонтальная направляющая
        if (nearY) {
            this.showGuideline(canvas, 'horizontal', 0, top + height / 2, this.editorBlock.clientWidth, top + height / 2);
            e.target.set({ top: top + height / 2 - objHeight / 2 });
        } else {
            this.hideGuideline(canvas, 'horizontal');
        }
    }

    private handleObjectModified(e: fabric.IEvent, canvas: fabric.Canvas, printConfig: any): void {
        const object = e.target;
        if (!object) return;

        // Удаляем направляющие
        this.hideGuideline(canvas, 'vertical');
        this.hideGuideline(canvas, 'horizontal');

        const layout = this.layouts.find(l => l.id === object.name);
        if (!layout) return;

        const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
        const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
        const left = Math.round((this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth));
        const top = Math.round((this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight));

        // Обновляем layout
        layout.position.x = (object.left! - left) / width;
        layout.position.y = (object.top! - top) / height;
        layout.size = object.scaleX!;
        layout.aspectRatio = object.scaleY! / object.scaleX!;
        layout.angle = object.angle!;

        // Сохраняем позиции слоёв в storage (но не добавляем в историю undo/redo)
        // Перемещение и трансформация объектов на canvas не должны создавать историю
        this.saveLayouts().catch(err => console.error('[layers] Ошибка сохранения слоёв:', err));
    }

    private showGuideline(canvas: fabric.Canvas, type: 'vertical' | 'horizontal', x1: number, y1: number, x2: number, y2: number): void {
        const name = `guideline:${type}`;
        let guideline = this.getObject(name, canvas);

        if (!guideline) {
            guideline = new fabric.Line([x1, y1, x2, y2], {
                stroke: 'rgb(254, 94, 58)',
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false,
                name,
            } as any);
            if (guideline) {
                canvas.add(guideline);
            }
        }
    }

    private hideGuideline(canvas: fabric.Canvas, type: 'vertical' | 'horizontal'): void {
        const guideline = this.getObject(`guideline:${type}`, canvas);
        if (guideline) {
            canvas.remove(guideline);
        }
    }

    private getObject(name: string, canvas?: fabric.Canvas): fabric.Object | undefined {
        const targetCanvas = canvas || this.activeCanvas || this.canvases[0];
        if (!targetCanvas) return undefined;

        return targetCanvas.getObjects().find(obj => (obj as any).name === name);
    }

    setActiveSide(side: SideEnum): void {
        console.debug('[canvas] Установка активной стороны:', side);

        this.canvases.forEach(canvas => {
            const canvasElement = canvas.getElement();
            const containerElement = canvasElement.parentElement;

            if ((canvas as any).side === side) {
                this.activeCanvas = canvas;
                if (containerElement) {
                    containerElement.style.pointerEvents = 'auto';
                    containerElement.style.display = 'block';
                }
                canvasElement.style.display = 'block';
            } else {
                if (containerElement) {
                    containerElement.style.pointerEvents = 'none';
                    containerElement.style.display = 'none';
                }
                canvasElement.style.display = 'none';
            }
        });

        this.layersCanvases.forEach(layersCanvas => {
            const canvasElement = layersCanvas.getElement();
            canvasElement.style.display = (layersCanvas as any).side === side ? 'block' : 'none';
        });

        this._selectSide = side;
    }

    async addLayoutToCanvas(layout: Layout): Promise<void> {
        const canvas = this.canvases.find(c => (c as any).side === layout.view);
        if (!canvas) {
            console.warn(`[canvas] canvas для ${layout.view} не найден`);
            return;
        }

        const product = this.getProductByType(this._selectType);
        if (!product) return;

        const printConfig = product.printConfig.find(pc => pc.side === layout.view);
        if (!printConfig) return;

        const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
        const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
        const left = Math.round((this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth));
        const top = Math.round((this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight));

        const absoluteLeft = left + (width * layout.position.x);
        const absoluteTop = top + (height * layout.position.y);

        if (layout.isImageLayout()) {
            const image = new fabric.Image(await this.loadImage(layout.url));

            if (layout.size === 1 && image.width! > width) {
                layout.size = width / image.width!;
            }

            image.set({
                left: absoluteLeft,
                top: absoluteTop,
                name: layout.id,
                layoutUrl: layout.url, // ИСПРАВЛЕНИЕ (2025): Сохраняем URL изображения в объекте canvas
                // Это позволяет отслеживать изменения URL при редактировании слоя
                // В методе updateLayoutsForSide сравнивается layoutUrl с layout.url
                scaleX: layout.size,
                scaleY: layout.size * layout.aspectRatio,
                angle: layout.angle,
            } as any);
            canvas.add(image);
        } else if (layout.isTextLayout()) {
            const text = new fabric.Text(layout.text, {
                fontFamily: layout.font.family,
                fontSize: layout.font.size,
            });
            text.set({
                top: absoluteTop,
                left: absoluteLeft,
                name: layout.id,
                scaleX: layout.size,
                scaleY: layout.size * layout.aspectRatio,
                angle: layout.angle,
            } as any);
            canvas.add(text);
        }
    }

    // ============================================
    // ОБНОВЛЕНИЕ СЛОЁВ НА CANVAS
    // ============================================

    /**
     * Обновляет слои на текущем активном canvas
     * Вызывается после изменения массива layouts
     */
    updateLayouts(): void {
        if (!this.activeCanvas) return;
        this.updateLayoutsForSide(this._selectSide);
    }

    /**
     * Обновление слоёв для конкретной стороны (front/back)
     * 
     * ЧТО ДЕЛАЕТ:
     * 1. Находит canvas для указанной стороны
     * 2. Удаляет объекты, которых больше нет в массиве layouts
     * 3. Проверяет существующие объекты на изменения (сравнивает URL изображений)
     * 4. Удаляет и заново добавляет измененные объекты (для обновления изображения)
     * 5. Добавляет новые объекты
     * 6. Перерисовывает canvas
     * 
     * ИСПРАВЛЕНИЕ (2025):
     * Добавлена проверка изменений URL для существующих ImageLayout.
     * Раньше при редактировании слоя (изменение layout.url) canvas не обновлялся,
     * пользователь видел старое изображение. Теперь при изменении URL объект
     * удаляется и добавляется заново с новым изображением.
     * 
     * @param side - Сторона для обновления (front/back)
     */
    private updateLayoutsForSide(side: SideEnum): void {
        // Находим canvas для указанной стороны
        const canvas = this.canvases.find(c => (c as any).side === side);
        if (!canvas) return;

        // Получаем все объекты на canvas
        const objects = canvas.getObjects();

        // ШАГ 1: Удаляем объекты, которых больше нет в массиве layouts
        // Исключаем служебные объекты (area:border, area:clip, guideline)
        const objectsToRemove = objects
            .filter(obj => (obj as any).name !== 'area:border' && (obj as any).name !== 'area:clip' && !(obj as any).name?.startsWith('guideline'))
            .filter(obj => !this.layouts.find(layout => layout.id === (obj as any).name));

        objectsToRemove.forEach(obj => {
            canvas.remove(obj);
        });

        // Фильтруем layouts для текущей стороны
        const layoutsForSide = this.layouts.filter(layout => layout.view === side);

        // ШАГ 2: Проверяем существующие объекты на необходимость обновления
        const objectsToUpdate: Layout[] = [];   // Объекты для обновления (изменился URL)
        const objectsToAdd: Layout[] = [];      // Новые объекты для добавления

        layoutsForSide.forEach(layout => {
            const existingObj = objects.find(obj => (obj as any).name === layout.id);
            if (existingObj) {
                // Объект уже существует на canvas
                // Проверяем, изменился ли URL изображения (для ImageLayout)
                if (layout.isImageLayout() && (existingObj as any).layoutUrl !== layout.url) {
                    console.debug(`[canvas] Layout ${layout.id} изменился, требуется обновление`);
                    objectsToUpdate.push(layout);
                }
                // Если URL не изменился - ничего не делаем, объект остается на месте
            } else {
                // Объекта нет на canvas - добавляем
                objectsToAdd.push(layout);
            }
        });

        // ШАГ 3: Удаляем и заново добавляем измененные объекты
        // Это необходимо для обновления изображения (fabric.js не умеет менять src у Image)
        objectsToUpdate.forEach(layout => {
            const existingObj = objects.find(obj => (obj as any).name === layout.id);
            if (existingObj) {
                console.debug(`[canvas] Удаляем старый объект для обновления: ${layout.id}`);
                canvas.remove(existingObj);
            }
            console.debug(`[canvas] Добавляем обновленный объект: ${layout.id}`);
            this.addLayoutToCanvas(layout);
        });

        // ШАГ 4: Добавляем новые объекты
        objectsToAdd.forEach(layout => {
            this.addLayoutToCanvas(layout);
        });

        // ШАГ 5: Перерисовываем canvas
        canvas.renderAll();
    }

    // ===========================================
    // Методы загрузки изображений
    // ===========================================

    async preloadAllMockups(): Promise<void> {
        console.debug('[preload] Начало предзагрузки mockups');

        for (const product of this.productConfigs) {
            for (const mockup of product.mockups) {
                try {
                    const mockupDataUrl = await this.getImageData(mockup.url);
                    mockup.url = mockupDataUrl;
                    console.debug(`[preload] Mockup загружен: ${mockup.color.name}`);
                } catch (error) {
                    console.error(`[preload] Ошибка загрузки mockup ${mockup.url}:`, error);
                }
            }
        }

        console.debug('[preload] Предзагрузка завершена');
    }

    // Используем единый метод для конвертации изображений
    private async getImageData(url: string): Promise<string> {
        return this.loadAndConvertImage(url);
    }

    async uploadImage(file: File): Promise<string> {
        console.debug('[upload] Загрузка файла:', file.name);

        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const dataUrl = e.target?.result as string;

                    // Конвертируем в нужный формат через canvas
                    const convertedDataUrl = await this.getImageData(dataUrl);

                    console.debug('[upload] Файл успешно загружен');
                    resolve(convertedDataUrl);
                } catch (error) {
                    console.error('[upload] Ошибка обработки файла:', error);
                    reject(error);
                }
            };

            reader.onerror = () => {
                console.error('[upload] Ошибка чтения файла');
                reject(new Error('Не удалось прочитать файл'));
            };

            reader.readAsDataURL(file);
        });
    }

    async uploadImageToServer(base64: string): Promise<string> {
        console.debug('[upload] Загрузка изображения на сервер');

        const userId = await this.storageManager.getUserId();

        const response = await fetch(this.apiConfig.uploadImage, {
            method: 'POST',
            body: JSON.stringify({ image: base64, user_id: userId }),
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();
        console.debug('[upload] Изображение загружено на сервер:', data.image_url);
        return data.image_url;
    }

    getProductName(): string {
        return this.getProductByType(this._selectType)?.productName || '';
    }

    capitalizeFirstLetter(string: string): string {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    getMockupUrl(side: SideEnum): string | null {
        const product = this.getProductByType(this._selectType);
        if (!product) return null;

        const mockup = product.mockups.find(
            mockup => mockup.side === side && mockup.color.name === this._selectColor.name
        );

        return mockup ? mockup.url : null;
    }

    // ===========================================
    // Методы экспорта
    // ===========================================

    async exportArt(withMockup: boolean = true, resolution: number = 1024): Promise<{ [side: string]: string }> {
        const result: { [side: string]: string } = {};
        const sidesWithLayers = this.getSidesWithLayers();

        console.debug('[export] Найдены стороны с слоями:', sidesWithLayers, '(front первый)', withMockup ? 'с мокапом' : 'без мокапа', `разрешение: ${resolution}px`);

        // ========================================
        // ОПТИМИЗАЦИЯ (2025): Параллельный экспорт всех сторон вместо последовательного
        // ========================================
        // БЫЛО: for (const side of sides) { await exportSide(side); }
        //       - Экспорт front, затем back (последовательно)
        // СТАЛО: Promise.all([exportSide('front'), exportSide('back')])
        //        - Обе стороны экспортируются одновременно
        // РЕЗУЛЬТАТ: Время экспорта сокращено примерно в 2 раза
        const exportPromises = sidesWithLayers.map(async (side) => {
            try {
                const exportedSide = await this.exportSide(side as SideEnum, withMockup, resolution);
                if (exportedSide) {
                    console.debug(`[export] Сторона ${side} успешно экспортирована`);
                    return { side, data: exportedSide };
                }
            } catch (error) {
                console.error(`[export] Ошибка при экспорте стороны ${side}:`, error);
            }
            return null;
        });

        // Ждем завершения экспорта всех сторон одновременно
        const exportedSides = await Promise.all(exportPromises);

        // Формируем результат из успешно экспортированных сторон
        exportedSides.forEach(item => {
            if (item) {
                result[item.side] = item.data;
            }
        });

        console.debug(`[export] Экспорт завершен для ${Object.keys(result).length} сторон`);
        return result;
    }

    // Получение сторон с слоями, отсортированных (front первый)
    private getSidesWithLayers(): string[] {
        const allSidesWithLayers = [...new Set(this.layouts.map(layout => layout.view))];

        return allSidesWithLayers.sort((a, b) => {
            if (a === 'front') return -1;
            if (b === 'front') return 1;
            return 0;
        });
    }

    // Экспорт одной стороны
    private async exportSide(side: SideEnum, withMockup: boolean = true, resolution: number = 1024): Promise<string | null> {
        const canvases = this.getCanvasesForSide(side);
        if (!canvases.editableCanvas) {
            console.warn(`[export] Canvas для стороны ${side} не найден`);
            return null;
        }

        // ВАЖНО: Убеждаемся, что все слои для этой стороны добавлены на canvas
        // Это необходимо, если пользователь не переключался на эту сторону
        this.updateLayoutsForSide(side);

        console.debug(`[export] Экспортируем сторону ${side}${withMockup ? ' с мокапом' : ' без мокапа'} (${resolution}px)...`);

        // Если экспорт без мокапа - возвращаем дизайн обрезанный по clipPath
        if (!withMockup) {
            const croppedCanvas = await this.exportDesignWithClipPath(
                canvases.editableCanvas,
                canvases.layersCanvas,
                side,
                resolution
            );
            console.debug(`[export] Экспортирован чистый дизайн для ${side} (обрезан по clipPath)`);
            return croppedCanvas.toDataURL('image/png', 1.0);
        }

        // Экспорт с мокапом
        const mockupImg = await this.loadMockupForSide(side);
        if (!mockupImg) return null;

        const { canvas: tempCanvas, ctx, mockupDimensions } = this.createExportCanvas(resolution, mockupImg);

        const designCanvas = await this.createDesignCanvas(
            canvases.editableCanvas,
            canvases.layersCanvas,
            side
        );

        // Накладываем дизайн на мокап
        ctx.drawImage(
            designCanvas,
            0, 0, designCanvas.width, designCanvas.height,
            mockupDimensions.x, mockupDimensions.y,
            mockupDimensions.width, mockupDimensions.height
        );

        console.debug(`[export] Наложен дизайн на мокап для ${side}`);
        return tempCanvas.toDataURL('image/png', 1.0);
    }

    // Получение canvas для стороны
    private getCanvasesForSide(side: SideEnum): {
        editableCanvas: fabric.Canvas | undefined,
        layersCanvas: fabric.StaticCanvas | undefined
    } {
        return {
            editableCanvas: this.canvases.find(c => (c as any).side === side),
            layersCanvas: this.layersCanvases.find(c => (c as any).side === side)
        };
    }

    // Загрузка мокапа для стороны
    private async loadMockupForSide(side: SideEnum): Promise<HTMLImageElement | null> {
        const mockupUrl = this.getMockupUrl(side);
        if (!mockupUrl) {
            console.warn(`[export] Мокап для стороны ${side} не найден`);
            return null;
        }

        const mockupImg = await this.loadImage(mockupUrl);
        console.debug(`[export] Загружен мокап для ${side}: ${mockupUrl}`);
        return mockupImg;
    }

    // Создание canvas для экспорта с мокапом
    private createExportCanvas(exportSize: number, mockupImg: HTMLImageElement): {
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        mockupDimensions: { x: number, y: number, width: number, height: number }
    } {
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d')!;

        tempCanvas.width = exportSize;
        tempCanvas.height = exportSize;

        // Вычисляем масштаб для мокапа
        const mockupScale = Math.min(exportSize / mockupImg.width, exportSize / mockupImg.height);
        const scaledMockupWidth = mockupImg.width * mockupScale;
        const scaledMockupHeight = mockupImg.height * mockupScale;
        const mockupX = (exportSize - scaledMockupWidth) / 2;
        const mockupY = (exportSize - scaledMockupHeight) / 2;

        // Рисуем мокап как фон
        ctx.drawImage(mockupImg, mockupX, mockupY, scaledMockupWidth, scaledMockupHeight);
        console.debug(`[export] Нарисован мокап как фон (${scaledMockupWidth}x${scaledMockupHeight})`);

        return {
            canvas: tempCanvas,
            ctx,
            mockupDimensions: {
                x: mockupX,
                y: mockupY,
                width: scaledMockupWidth,
                height: scaledMockupHeight
            }
        };
    }

    // Создание canvas с дизайном
    private async createDesignCanvas(
        editableCanvas: fabric.Canvas,
        layersCanvas: fabric.StaticCanvas | undefined,
        side: SideEnum
    ): Promise<HTMLCanvasElement> {
        const qualityMultiplier = 10;

        // ИСПРАВЛЕНИЕ: Используем фиксированный базовый размер вместо размера canvas на экране
        // Это гарантирует одинаковый экспорт на любом устройстве
        const baseSize = CONSTANTS.CANVAS_AREA_HEIGHT;
        const baseWidth = baseSize;
        const baseHeight = baseSize;

        const designCanvas = document.createElement('canvas');
        const designCtx = designCanvas.getContext('2d')!;
        designCanvas.width = baseWidth * qualityMultiplier;
        designCanvas.height = baseHeight * qualityMultiplier;

        // Добавляем статические слои
        await this.addStaticLayersToCanvas(layersCanvas, designCtx, designCanvas, side);

        // Добавляем редактируемые объекты
        await this.addEditableObjectsToCanvas(editableCanvas, designCtx, designCanvas, baseWidth, baseHeight, side);

        return designCanvas;
    }

    // Добавление статических слоев на canvas
    private async addStaticLayersToCanvas(
        layersCanvas: fabric.StaticCanvas | undefined,
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        side: SideEnum
    ): Promise<void> {
        if (!layersCanvas) return;

        try {
            const layersDataUrl = (layersCanvas as any).toDataURL({
                format: 'png',
                multiplier: 10,
                quality: 1.0
            });

            const emptyDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            if (layersDataUrl !== emptyDataUrl && layersDataUrl.length > emptyDataUrl.length) {
                const layersImg = await this.loadImage(layersDataUrl);
                ctx.drawImage(layersImg, 0, 0, canvas.width, canvas.height);
                console.debug(`[export] Добавлены статические слои для ${side}`);
            }
        } catch (error) {
            console.warn(`[export] Ошибка экспорта статических слоев для ${side}:`, error);
        }
    }

    // Добавление редактируемых объектов на canvas
    private async addEditableObjectsToCanvas(
        editableCanvas: fabric.Canvas,
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        baseWidth: number,
        baseHeight: number,
        side: SideEnum
    ): Promise<void> {
        try {
            const tempEditableCanvas = new fabric.StaticCanvas(null, {
                width: baseWidth,
                height: baseHeight,
                backgroundColor: 'transparent'
            });

            // ИСПРАВЛЕНИЕ: Создаем clipPath с правильными размерами из конфигурации
            // вместо копирования с текущего canvas (который зависит от размера экрана)
            const printArea = this.calculatePrintAreaDimensions(side, baseWidth);

            const clipArea = new fabric.Rect({
                width: printArea.width,
                height: printArea.height,
                left: printArea.left,
                top: printArea.top,
                fill: 'rgb(255, 0, 0)',
                evented: false,
            } as any);

            tempEditableCanvas.clipPath = clipArea;
            console.debug(`[export] Создан clipPath для экспорта стороны ${side} с размерами из конфигурации`);

            // ИСПРАВЛЕНИЕ: Пересоздаем объекты из массива layouts с правильными координатами
            // вместо копирования объектов с текущего canvas (у которых координаты для размера экрана)
            const layersForSide = this.layouts.filter(layout => layout.view === side);

            for (const layout of layersForSide) {
                await this.addLayoutToExportCanvas(layout, tempEditableCanvas, printArea);
            }

            console.debug(`[export] Добавлено ${layersForSide.length} слоев для экспорта стороны ${side}`);

            const designDataUrl = tempEditableCanvas.toDataURL({
                format: 'png',
                multiplier: 10,
                quality: 1.0
            });

            const emptyDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            if (designDataUrl !== emptyDataUrl && designDataUrl.length > emptyDataUrl.length) {
                const designImg = await this.loadImage(designDataUrl);
                ctx.drawImage(designImg, 0, 0, canvas.width, canvas.height);
                console.debug(`[export] Добавлены объекты дизайна без границ для ${side}`);
            }

            tempEditableCanvas.dispose();
        } catch (error) {
            console.warn(`[export] Ошибка создания дизайна без границ для ${side}:`, error);
        }
    }

    // Фильтрация объектов дизайна (без служебных элементов)
    private filterDesignObjects(allObjects: any[]): any[] {
        const serviceObjectNames = new Set([
            "area:border",
            "area:clip",
            "guideline",
            "guideline:vertical",
            "guideline:horizontal"
        ]);

        return allObjects.filter((obj: any) => !serviceObjectNames.has(obj.name));
    }

    /**
     * Вычисляет размеры печатной области относительно базового размера canvas
     * Это гарантирует, что экспорт будет одинаковым на любом устройстве
     * @param side - Сторона (front/back)
     * @param baseCanvasSize - Базовый размер canvas для расчетов
     * @returns Размеры и позицию печатной области
     */
    private calculatePrintAreaDimensions(side: SideEnum, baseCanvasSize: number = CONSTANTS.CANVAS_AREA_HEIGHT): {
        width: number;
        height: number;
        left: number;
        top: number;
    } {
        const printConfig = this.getPrintConfigForSide(side);
        if (!printConfig) {
            console.warn(`[export] Не найдена конфигурация печати для ${side}`);
            return { width: baseCanvasSize, height: baseCanvasSize, left: 0, top: 0 };
        }

        // Рассчитываем размеры относительно базового размера (600px)
        const width = printConfig.size.width / 600 * baseCanvasSize;
        const height = printConfig.size.height / 600 * baseCanvasSize;
        const left = (baseCanvasSize - width) / 2 + (printConfig.position.x / 100 * baseCanvasSize);
        const top = (baseCanvasSize - height) / 2 + (printConfig.position.y / 100 * baseCanvasSize);

        return { width, height, left, top };
    }

    /**
     * Добавляет слой на экспортный canvas с правильными координатами
     * Использует относительные координаты из layout для расчета абсолютных позиций
     * @param layout - Слой для добавления
     * @param canvas - Canvas для добавления (обычно временный для экспорта)
     * @param printArea - Размеры и позиция печатной области
     */
    private async addLayoutToExportCanvas(
        layout: Layout,
        canvas: fabric.StaticCanvas,
        printArea: { width: number; height: number; left: number; top: number }
    ): Promise<void> {
        // Вычисляем абсолютные координаты из относительных
        const absoluteLeft = printArea.left + (printArea.width * layout.position.x);
        const absoluteTop = printArea.top + (printArea.height * layout.position.y);

        if (layout.isImageLayout()) {
            const image = new fabric.Image(await this.loadImage(layout.url));

            // Автоматически масштабируем, если изображение больше печатной области
            let finalSize = layout.size;
            if (finalSize === 1 && image.width! > printArea.width) {
                finalSize = printArea.width / image.width!;
            }

            image.set({
                left: absoluteLeft,
                top: absoluteTop,
                scaleX: finalSize,
                scaleY: finalSize * layout.aspectRatio,
                angle: layout.angle,
            } as any);

            canvas.add(image);
        } else if (layout.isTextLayout()) {
            const text = new fabric.Text(layout.text, {
                fontFamily: layout.font.family,
                fontSize: layout.font.size,
            });

            text.set({
                left: absoluteLeft,
                top: absoluteTop,
                scaleX: layout.size,
                scaleY: layout.size * layout.aspectRatio,
                angle: layout.angle,
            } as any);

            canvas.add(text);
        }
    }

    // Экспорт дизайна с обрезкой по clipPath
    private async exportDesignWithClipPath(
        editableCanvas: fabric.Canvas,
        layersCanvas: fabric.StaticCanvas | undefined,
        side: SideEnum,
        resolution: number
    ): Promise<HTMLCanvasElement> {
        const qualityMultiplier = 10;

        // ИСПРАВЛЕНИЕ: Вычисляем размеры печатной области из конфигурации,
        // а не берем с canvas (который зависит от размера экрана)
        const printArea = this.calculatePrintAreaDimensions(side, CONSTANTS.CANVAS_AREA_HEIGHT);

        const clipWidth = printArea.width;
        const clipHeight = printArea.height;
        const clipLeft = printArea.left;
        const clipTop = printArea.top;

        console.debug(`[export] Print area (независимо от экрана): ${clipWidth}x${clipHeight} at (${clipLeft}, ${clipTop})`);

        // Создаем полный дизайн
        const fullDesignCanvas = await this.createDesignCanvas(editableCanvas, layersCanvas, side);

        // Вычисляем масштаб для желаемого разрешения
        const scale = resolution / Math.max(clipWidth, clipHeight);

        // Создаем canvas для обрезанного изображения
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = clipWidth * scale;
        croppedCanvas.height = clipHeight * scale;
        const ctx = croppedCanvas.getContext('2d')!;

        // Рисуем только область clipPath
        // fullDesignCanvas уже увеличен в qualityMultiplier раз
        const sourceScale = qualityMultiplier;
        ctx.drawImage(
            fullDesignCanvas,
            clipLeft * sourceScale,           // источник X
            clipTop * sourceScale,            // источник Y
            clipWidth * sourceScale,          // ширина источника
            clipHeight * sourceScale,         // высота источника
            0,                                // назначение X
            0,                                // назначение Y
            croppedCanvas.width,              // ширина назначения
            croppedCanvas.height              // высота назначения
        );

        console.debug(`[export] Дизайн обрезан по clipPath: ${croppedCanvas.width}x${croppedCanvas.height}px`);
        return croppedCanvas;
    }

    private async uploadDesignToServer(designs: { [key: string]: string }): Promise<{ [key: string]: string } | null> {
        try {
            console.debug('[export] Загрузка дизайна на сервер');

            const formData = new FormData();

            for (const [side, dataUrl] of Object.entries(designs)) {
                // Конвертируем dataUrl в Blob
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                formData.append(side, blob, `${side}.png`);
            }

            // TODO: Реализовать реальную загрузку на сервер
            // const response = await fetch('/api/upload-design', {
            //     method: 'POST',
            //     body: formData
            // });
            // const result = await response.json();
            // return result.urls;

            console.warn('[export] Загрузка на сервер не реализована');
            return designs;
        } catch (error) {
            console.error('[export] Ошибка при загрузке на сервер:', error);
            return null;
        }
    }

    // ===========================================
    // История слоёв (Undo/Redo)
    // ===========================================

    private saveLayersToHistory(): void {
        // Удаляем все состояния после текущего индекса (при новом действии после undo)
        if (this.currentHistoryIndex < this.layersHistory.length - 1) {
            this.layersHistory = this.layersHistory.slice(0, this.currentHistoryIndex + 1);
        }

        // Создаем глубокую копию текущих слоёв
        const layersCopy = JSON.parse(JSON.stringify(this.layouts));
        const historyItem: LayersHistoryItem = {
            layers: layersCopy.map((data: any) => new Layout(data as LayoutProps)),
            timestamp: Date.now()
        };

        this.layersHistory.push(historyItem);
        this.currentHistoryIndex = this.layersHistory.length - 1;

        // Ограничиваем размер истории (например, последние 50 состояний)
        const MAX_HISTORY_SIZE = 50;
        if (this.layersHistory.length > MAX_HISTORY_SIZE) {
            this.layersHistory.shift();
            this.currentHistoryIndex--;
        }

        console.debug(`[history] Сохранено состояние слоёв. Индекс: ${this.currentHistoryIndex}, Всего: ${this.layersHistory.length}, Слоёв: ${this.layouts.length}`);
        this.updateHistoryButtonsState();
    }

    private canUndo(): boolean {
        // Можем сделать undo если:
        // 1. Есть минимум 2 элемента в истории (текущее + предыдущее)
        // 2. И мы либо на последнем элементе, либо уже откатились и можем откатиться дальше
        if (this.currentHistoryIndex === this.layersHistory.length - 1) {
            // Если на последнем элементе, проверяем, есть ли куда откатываться
            return this.layersHistory.length >= 2;
        } else {
            // Если уже откатились, проверяем, можем ли откатиться ещё
            return this.currentHistoryIndex > 0;
        }
    }

    private canRedo(): boolean {
        return this.currentHistoryIndex < this.layersHistory.length - 1;
    }

    updateHistoryButtonsState(): void {
        const canUndo = this.canUndo();
        const canRedo = this.canRedo();

        if (this.editorHistoryUndoBlock && this.editorHistoryUndoBlock.firstElementChild) {
            const undoButton = this.editorHistoryUndoBlock.firstElementChild as HTMLElement;
            if (canUndo) {
                undoButton.style.backgroundColor = '';
                undoButton.style.cursor = 'pointer';
            } else {
                undoButton.style.backgroundColor = '#f2f2f2';
                undoButton.style.cursor = 'default';
            }
        }

        if (this.editorHistoryRedoBlock && this.editorHistoryRedoBlock.firstElementChild) {
            const redoButton = this.editorHistoryRedoBlock.firstElementChild as HTMLElement;
            if (canRedo) {
                redoButton.style.backgroundColor = '';
                redoButton.style.cursor = 'pointer';
            } else {
                redoButton.style.backgroundColor = '#f2f2f2';
                redoButton.style.cursor = 'default';
            }
        }

        console.debug('[history] Состояние кнопок: undo =', canUndo, ', redo =', canRedo);
    }

    async undo(): Promise<boolean> {
        if (!this.canUndo()) {
            console.debug('[history] Undo невозможен');
            return false;
        }

        // Если мы на последнем элементе (текущее состояние), нужно перейти к предпоследнему
        // Последний элемент в истории - это текущее состояние, поэтому при первом undo
        // мы переходим к предпоследнему элементу
        if (this.currentHistoryIndex === this.layersHistory.length - 1 && this.layersHistory.length >= 2) {
            // Переходим на предпоследний элемент
            this.currentHistoryIndex = this.layersHistory.length - 2;
        } else {
            // В остальных случаях просто декрементируем индекс
            this.currentHistoryIndex = Math.max(0, this.currentHistoryIndex - 1);
        }

        const historyItem = this.layersHistory[this.currentHistoryIndex];

        if (!historyItem) {
            console.warn('[history] История не найдена');
            return false;
        }

        console.debug(`[history] Undo к индексу ${this.currentHistoryIndex} из ${this.layersHistory.length - 1}`);
        await this.restoreLayersFromHistory(historyItem);
        this.updateHistoryButtonsState();
        return true;
    }

    async redo(): Promise<boolean> {
        if (!this.canRedo()) {
            console.debug('[history] Redo невозможен');
            return false;
        }

        this.currentHistoryIndex++;
        const historyItem = this.layersHistory[this.currentHistoryIndex];

        if (!historyItem) {
            console.warn('[history] История не найдена');
            return false;
        }

        console.debug(`[history] Redo к индексу ${this.currentHistoryIndex} из ${this.layersHistory.length - 1}`);
        await this.restoreLayersFromHistory(historyItem);
        this.updateHistoryButtonsState();
        return true;
    }

    private async restoreLayersFromHistory(historyItem: LayersHistoryItem): Promise<void> {
        this.isRestoringFromHistory = true;

        try {
            // Очищаем текущие слои
            this.layouts = [];

            // Восстанавливаем слои из истории
            historyItem.layers.forEach(layout => {
                this.layouts.push(new Layout(layout as any));
            });

            // Обновляем UI
            this.showLayoutList();
            this.updateLayouts();
            this.updateSum();

            // Сохраняем состояние
            await this.saveState();

            console.debug(`[history] Восстановлено ${this.layouts.length} слоёв`);
        } finally {
            this.isRestoringFromHistory = false;
        }
    }


    // ===========================================
    // Cleanup методы
    // ===========================================

    destroy(): void {
        console.debug('[editor] Очистка ресурсов редактора');

        // Остановка таймеров
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
            this.loadingInterval = null;
        }

        // Очистка событий
        this.events.destroy();

        // Очистка canvas
        this.canvases.forEach(canvas => {
            try {
                canvas.dispose();
            } catch (err) {
                console.error('[cleanup] Ошибка очистки canvas:', err);
            }
        });
        this.canvases = [];

        this.layersCanvases.forEach(canvas => {
            try {
                canvas.dispose();
            } catch (err) {
                console.error('[cleanup] Ошибка очистки layer canvas:', err);
            }
        });
        this.layersCanvases = [];

        // Очистка событий
        // Note: EventTarget не имеет метода removeAllListeners,
        // но при уничтожении объекта они будут собраны GC

        console.debug('[editor] Ресурсы успешно очищены');
    }

    // Получение текущего состояния для экспорта/отладки
    getCurrentState() {
        return {
            type: this._selectType,
            color: this._selectColor,
            side: this._selectSide,
            size: this._selectSize,
            layouts: this.layouts,
            isLoading: this.isLoading,
        };
    }
}