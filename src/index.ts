type Position = {
    x: number;
    y: number;
}

class Layout {
    id: string;
    type: string;
    position: Position;
    size: number;
    aspectRatio: number = 1;
    view: SideEnum;
    angle: number = 0;
    name: string | null = null;

    constructor({ type, view, name }: { type: string, view: SideEnum, name?: string }) {
        this.id = (Math.random() + 1).toString(36).substring(7) + (Math.random() + 1).toString(36).substring(7);
        this.type = type;
        this.position = {
            x: 0,
            y: 0,
        };
        this.size = 1;
        this.view = view;
        this.name = name || null;
    }
}

class ImageLayout extends Layout {
    url: string;

    constructor({ view, url, name }: { view: SideEnum, url: string, name?: string }) {
        super({ type: 'image', view });
        this.url = url;
        this.name = name || null;
    }
}

type Font = {
    family: string;
    size: number;
}

type EditorState = {
    date: string;
    color: string;
    side: string;
    type: string;
    layouts: Layout[];
    size: string;
}

type UserData = {
    userId: string;
}

type HistoryItem = {
    id: string;
    timestamp: number;
    side: SideEnum;
    type: Product['type'];
    color: string;
    size: string;
    layouts: Layout[];
    description?: string;
}

type HistoryFilter = {
    side: SideEnum;
    type: Product['type'];
}

class EditorStorageManager {
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
            this.putData(objectStore, 'layouts', JSON.stringify(state.layouts)),
            this.putData(objectStore, 'size', state.size)
        ]);
    }

    async loadEditorState(): Promise<EditorState | null> {
        await this.waitForReady();
        if (!this.database) throw new Error('Database не инициализирована');

        const transaction = this.database.transaction(['editor_state'], 'readonly');
        const objectStore = transaction.objectStore('editor_state');

        try {
            const [date, color, side, type, layouts, size] = await Promise.all([
                this.getData(objectStore, 'date'),
                this.getData(objectStore, 'color'),
                this.getData(objectStore, 'side'),
                this.getData(objectStore, 'type'),
                this.getData(objectStore, 'layouts'),
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
                layouts: layouts ? JSON.parse(layouts) : [],
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
            this.deleteData(objectStore, 'layouts'),
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

    async getHistoryStore(): Promise<IDBObjectStore> {
        await this.waitForReady();
        if (!this.database) throw new Error('Database не инициализирована');

        const transaction = this.database.transaction(['history'], 'readwrite');
        return transaction.objectStore('history');
    }

    // Сохранить состояние в историю
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

    // Получить историю для определенной стороны и типа товара
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
                    .sort((a, b) => b.timestamp - a.timestamp) // Сортировка по времени (новые первые)
                    .slice(0, limit);
                resolve(filteredItems);
            };
        });
    }

    // Получить конкретный элемент истории по ID
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

    // Удалить элемент истории по ID
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

    // Очистить историю для определенной стороны и типа
    async clearHistory(filter?: HistoryFilter): Promise<void> {
        await this.waitForReady();
        if (!this.database) throw new Error('Database не инициализирована');

        const transaction = this.database.transaction(['history'], 'readwrite');
        const objectStore = transaction.objectStore('history');

        if (!filter) {
            // Очистить всю историю
            await new Promise<void>((resolve, reject) => {
                const request = objectStore.clear();
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        } else {
            // Очистить историю для конкретной стороны и типа
            const allItems = await this.getHistory(filter, 1000); // Получаем все элементы
            for (const item of allItems) {
                await this.deleteHistoryItem(item.id);
            }
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

class TextLayout extends Layout {
    text: string;
    font: Font;

    constructor({ view, text = "PrintLoop", font }: { view: SideEnum, text?: string, font?: Font }) {
        super({ type: 'text', view });
        this.text = text;
        this.font = {
            family: font?.family || 'Arial',
            size: font?.size || 12,
        };
    }
}

type PrintConfig = {
    side: SideEnum;
    position: Position;
    size: {
        width: number;
        height: number;
    };
}

type Color = {
    name: string;
    hex: string;
}

type SideEnum = 'front' | 'back';

type Mockup = {
    side: SideEnum;
    url: string;
    color: Color;
}

type Size = "S" | "M" | "L" | "XL" | "2XL";

type Product = {
    type: 'tshirt' | 'hoodie';
    productName: string;
    sizes?: Size[];
    mockups: Mockup[];
    printConfig: PrintConfig[];
}

type EditorProps = {
    blocks: {
        editorBlockClass: string;
        changeSideButtonClass: string;
        productListBlockClass: string;
        productItemClass: string;
        productItemImageClass: string;
        productItemTextClass: string;
        editorSumBlockClass: string;
        editorSettingsBlockClass: string;
        editorClipImageBlockClass: string;
        editorAddOrderButtonClass: string;
        editorProductNameClass: string;
        editorColorsListBlockClass: string;
        editorColorItemBlockClass: string;
        editorSizesListBlockClass: string;
        editorSizeItemBlockClass: string;
        editorLayoutsListBlockClass: string;
        editorLayoutItemBlockClass: string;
        editorLayoutItemBlockViewClass: string;
        editorLayoutItemBlockNameClass: string;
        editorLayoutItemBlockRemoveClass: string;
        editorUploadImageButtonClass: string;
        editorUploadViewBlockClass: string;
        editorUploadCancelButtonClass: string;
        editorLayoutItemBlockEditClass: string;
        editorQuantityFormBlockClass: string;
        editorHistoryBlockClass: string;
        editorLoadWithAiButtonClass: string;
        editorLoadWithoutAiButtonClass: string;
    }
    formConfig?: {
        formBlockClass: string;
        formInputVariableName: string;
        formButtonClass: string;
    }
    productConfigs: Product[];
}

class Editor {
    editorBlock: HTMLElement;
    changeSideButton: HTMLElement;
    mockupBlock: HTMLImageElement;
    productListBlock: HTMLElement;
    productItemBlock: HTMLElement;
    productItemImageBlock: HTMLElement;
    productItemTextBlock: HTMLElement;
    editorSumBlock: HTMLElement;
    editorSettingsBlock: HTMLElement;
    editorClipImageBlock: HTMLElement;
    editorAddOrderButton: HTMLElement;
    editorProductName: HTMLElement;
    editorLoadingBlock: HTMLElement;
    canvasesContainer: HTMLElement;
    editorColorsListBlock: HTMLElement;
    editorColorItemBlock: HTMLElement;
    editorSizesListBlock: HTMLElement;
    editorSizeItemBlock: HTMLElement;
    editorLayoutsListBlock: HTMLElement;
    editorLayoutItemBlock: HTMLElement;
    editorLayoutItemBlockViewClass: string;
    editorLayoutItemBlockNameClass: string;
    editorLayoutItemBlockRemoveClass: string;
    editorLayoutItemBlockEditClass: string;
    quantityFormBlock: HTMLElement | null = null;
    editorHistoryBlock: HTMLElement;

    formBlock: HTMLElement | null;
    formInputVariableName: string | null;
    formButton: HTMLElement | null;

    events = new EventTarget();

    selectType: Product['type'];
    selectColor: Color;
    selectSide: SideEnum;
    selectSize: Size;
    selectLayout: Layout['id'] | null = null;
    productConfigs: Product[];

    isLoading: boolean;
    loadingTime: number = 0;
    loadingInterval: NodeJS.Timeout | null = null;

    layersCanvases: fabric.StaticCanvas[] = [];
    canvases: fabric.Canvas[] = [];
    layouts: Layout[] = [];
    activeCanvas: fabric.Canvas | null = null;

    colorBocks: HTMLElement[] = [];
    sizeBocks: HTMLElement[] = [];
    productBlocks: HTMLElement[] = [];

    loadedUserImage: string | null = null;
    editorUploadImageButton: HTMLElement;
    editorUploadViewBlock: HTMLElement;
    editorUploadCancelButton: HTMLElement;
    editorLoadWithAi: boolean = false;
    editorLoadWithAiButton: HTMLElement;
    editorLoadWithoutAiButton: HTMLElement;

    history: IDBObjectStore | null = null;
    dataBase: IDBDatabase | null = null;
    storageManager: EditorStorageManager;

    canvasAreaHeight = 600;

    constructor({ blocks, productConfigs, formConfig }: EditorProps) {
        // Инициализируем новый EditorStorageManager
        this.storageManager = new EditorStorageManager();

        // Мигрируем данные из localStorage (если они есть)
        this.migrateFromLocalStorage();


        this.editorBlock = document.querySelector(blocks.editorBlockClass)!;
        this.changeSideButton = document.querySelector(blocks.changeSideButtonClass)!;
        this.productListBlock = document.querySelector(blocks.productListBlockClass)!;
        this.productItemBlock = document.querySelector(blocks.productItemClass)!;
        this.productItemImageBlock = document.querySelector(blocks.productItemImageClass)!;
        this.productItemTextBlock = document.querySelector(blocks.productItemTextClass)!;
        this.editorSumBlock = document.querySelector(blocks.editorSumBlockClass)!;
        this.editorSettingsBlock = document.querySelector(blocks.editorSettingsBlockClass)!;
        this.editorClipImageBlock = document.querySelector(blocks.editorClipImageBlockClass)!;
        this.editorAddOrderButton = document.querySelector(blocks.editorAddOrderButtonClass)!;
        this.editorProductName = document.querySelector(blocks.editorProductNameClass)!;
        this.editorColorsListBlock = document.querySelector(blocks.editorColorsListBlockClass)!;
        this.editorColorItemBlock = document.querySelector(blocks.editorColorItemBlockClass)!;
        this.editorSizesListBlock = document.querySelector(blocks.editorSizesListBlockClass)!;
        this.editorSizeItemBlock = document.querySelector(blocks.editorSizeItemBlockClass)!;
        this.editorLayoutsListBlock = document.querySelector(blocks.editorLayoutsListBlockClass)!;
        this.editorLayoutItemBlock = document.querySelector(blocks.editorLayoutItemBlockClass)!;
        this.editorUploadImageButton = document.querySelector(blocks.editorUploadImageButtonClass)!;
        this.editorUploadViewBlock = document.querySelector(blocks.editorUploadViewBlockClass)!;
        this.editorUploadCancelButton = document.querySelector(blocks.editorUploadCancelButtonClass)!;
        this.editorHistoryBlock = document.querySelector(blocks.editorHistoryBlockClass)!;

        this.editorLoadWithAiButton = document.querySelector(blocks.editorLoadWithAiButtonClass)!;
        this.editorLoadWithoutAiButton = document.querySelector(blocks.editorLoadWithoutAiButtonClass)!;

        this.quantityFormBlock = document.querySelector(blocks.editorQuantityFormBlockClass)!;

        this.editorLayoutItemBlockViewClass = blocks.editorLayoutItemBlockViewClass;
        this.editorLayoutItemBlockNameClass = blocks.editorLayoutItemBlockNameClass;
        this.editorLayoutItemBlockRemoveClass = blocks.editorLayoutItemBlockRemoveClass;
        this.editorLayoutItemBlockEditClass = blocks.editorLayoutItemBlockEditClass;
        this.formBlock = formConfig?.formBlockClass ? document.querySelector(formConfig?.formBlockClass) : null;
        this.formInputVariableName = formConfig?.formInputVariableName ? formConfig?.formInputVariableName : null;
        this.formButton = formConfig?.formButtonClass ? document.querySelector(formConfig?.formButtonClass) : null;

        this.productConfigs = productConfigs;


        // Set default values
        this.isLoading = true;
        this.selectColor = productConfigs[0]!.mockups[0]!.color;
        this.selectSide = productConfigs[0]!.mockups[0]!.side;
        this.selectType = productConfigs[0]!.type;
        this.selectSize = productConfigs[0]!.sizes![0]!;
        this.changeProductName(this.selectType);

        // Инициализируем редактор асинхронно
        this.initializeEditor();


        // TODO: Remove DEBUG
        // if (this.layouts.length === 0) {
        //     this.addLayout(new ImageLayout({
        //         view: 'front',
        //         url: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Felis_silvestris_silvestris.jpg',
        //     }));
        //     // this.addLayout(new TextLayout({
        //     //     view: 'front',
        //     // }));
        // }

        if (!this.editorLayoutsListBlock) {
            console.warn('Editor layouts list block not found');
        } else {
            this.showLayoutList();
        }

        if (!this.editorBlock) {
            throw new Error('Editor block not found');
        }

        if (!this.changeSideButton) {
            console.warn('Change side button not found');
        } else {
            this.initChangeSideButton();
        }

        if (!this.editorColorsListBlock) {
            console.warn('Editor colors list block not found');
        }

        if (!this.editorSizesListBlock) {
            console.warn('Editor sizes list block not found');
        }

        // Цвета и размеры будут инициализированы в initializeEditor() после загрузки состояния

        if (!this.formBlock) {
            console.warn('Form block not found');
        } else {
            this.initForm();
        }

        if (!this.editorAddOrderButton) {
            console.warn('Editor add order button not found');
        } else {
            this.initAddOrderButton();
        }

        if (!this.editorClipImageBlock) {
            console.warn('Editor clip image block not found');
        } else {
            this.initClipImageBlock();
        }

        if (!this.editorUploadImageButton) {
            console.warn('Editor upload image button not found');
        } else {
            this.initUploadImageButton();
        }

        if (!this.editorHistoryBlock) {
            console.warn('Editor history block not found');
        } else {
            this.initHistoryBlock();
        }

        // if (!this.editorSettingsBlock) {
        //     console.warn('Editor settings block not found');
        // } else {
        //     this.initSettings();
        // }

        if (!this.productListBlock) {
            console.warn('Product list block not found');
        } else {
            this.initProductList();
        }

        if (!this.quantityFormBlock) {
            console.warn('Quantity form block not found');
        }

        this.editorBlock.style.position = 'relative';

        this.createBackgroundBlock();
        this.mockupBlock = this.createMockupBlock();
        this.canvasesContainer = this.createCanvasesContainer();
        this.editorLoadingBlock = this.createEditorLoadingBlock();

        this.loadProduct();
        this.updateMockup();
        this.updateLayouts();
        this.updateSum();

        this.preloadAllMockups();
        this.events.addEventListener('mockup-updated', (event) => {
            this.mockupBlock.src = (event as CustomEvent).detail;
        })

        this.events.addEventListener('loading-time-updated', (event) => {
            if (this.isLoading) {
                if (this.loadingTime > 5) {
                    (this.editorLoadingBlock.querySelector('#loading-text')! as HTMLElement).style.display = "block";
                    (this.editorLoadingBlock.querySelector('#loading-text')! as HTMLElement).innerText = `${(this.loadingTime / 10).toFixed(1)}`;
                    (this.editorLoadingBlock.querySelector('#spinner')! as HTMLElement).style.display = "block";
                    this.editorLoadingBlock.style.backgroundColor = "rgba(255, 255, 255, 0.745)";
                } else {
                    (this.editorLoadingBlock.querySelector('#loading-text')! as HTMLElement).style.display = "none";
                    (this.editorLoadingBlock.querySelector('#loading-text')! as HTMLElement).innerText = "";
                    (this.editorLoadingBlock.querySelector('#spinner')! as HTMLElement).style.display = "none";
                    this.editorLoadingBlock.style.backgroundColor = "rgba(255, 255, 255, 0)";
                }
            } else {
                (this.editorLoadingBlock.querySelector('#loading-text')! as HTMLElement).style.display = "none";
                (this.editorLoadingBlock.querySelector('#loading-text')! as HTMLElement).innerText = "";
            }
        })

        this.events.addEventListener('mockup-loading', (event) => {
            if ((event as CustomEvent).detail) {
                this.loadingTime = 0;
                this.isLoading = true;
                console.debug(`[mockup] loading mockup`);

                this.loadingInterval = setInterval(() => {
                    this.loadingTime++;
                    this.events.dispatchEvent(new CustomEvent('loading-time-updated', { detail: this.loadingTime }));
                }, 100);
            } else {
                this.editorLoadingBlock.style.backgroundColor = "rgba(255, 255, 255, 0)";
                (this.editorLoadingBlock.querySelector('#loading-text')! as HTMLElement).style.display = "none";
                (this.editorLoadingBlock.querySelector('#loading-text')! as HTMLElement).innerText = "";
                (this.editorLoadingBlock.querySelector('#spinner')! as HTMLElement).style.display = "none";
                this.isLoading = false;
                clearInterval(this.loadingInterval!);
                this.loadingTime = 0;
            }
        })
    }

    async preloadAllMockups() {
        for (const product of this.productConfigs) {
            for (const mockup of product.mockups) {
                const mockupDataUrl = await this.getImageData(mockup.url);
                mockup.url = mockupDataUrl;
            }
        }
    }

    initHistoryBlock() {
        console.debug('[history block] init');

        if (!this.editorHistoryBlock) {
            console.warn('Editor history block not found');
            return;
        }

        this.editorHistoryBlock.style.cursor = 'pointer';

        this.editorHistoryBlock.onclick = () => {
            console.debug('[history block] clicked');

        };
    }

    getQuantity() {
        if (!this.quantityFormBlock) {
            return 1;
        }

        const form = this.quantityFormBlock.querySelector("form")! as HTMLFormElement;
        const input = form.querySelector("input[name='quantity']")! as HTMLInputElement;

        if (!input) {
            return 1;
        }

        return parseInt(input.value);
    }

    resetUserUploadImage() {
        const editorUploadViewBlock = this.editorUploadViewBlock;
        if (!editorUploadViewBlock) {
            console.warn('Editor upload view block not found');
        } else {
            editorUploadViewBlock.style.display = 'none';
        }

        const editorUploadCancelButton = this.editorUploadCancelButton;
        if (!editorUploadCancelButton) {
            console.warn('Editor upload cancel button not found');
        } else {
            editorUploadCancelButton.style.cursor = 'pointer';
        }

        editorUploadCancelButton.addEventListener('click', () => {
            console.debug('[upload image button] cancel button clicked');
            this.resetUserUploadImage();
            this.loadedUserImage = null;
        });
    }

    initUploadImageButton() {
        this.resetUserUploadImage();

        console.debug('[upload image button] init');
        this.editorUploadImageButton.style.cursor = 'pointer';
        this.editorUploadImageButton.addEventListener('click', () => {
            console.debug('[upload image button] clicked');
            this.uploadUserImage();
        });
    }

    changeLoadWithAi(value: boolean = false) {
        this.editorLoadWithAi = value;

        if (this.editorLoadWithAiButton && this.editorLoadWithoutAiButton) {
            const buttonWithAi = this.editorLoadWithAiButton;
            const buttonWithoutAi = this.editorLoadWithoutAiButton;

            if (value) {
                const fixButtonWithAi = this.getLastChild(buttonWithAi);
                const fixButtonWithoutAi = this.getLastChild(buttonWithoutAi);
                if (fixButtonWithAi) {
                    fixButtonWithAi.style.borderColor = '';
                }
                if (fixButtonWithoutAi) {
                    fixButtonWithoutAi.style.borderColor = '#f2f2f2';
                }
            } else {
                const fixButtonWithAi = this.getLastChild(buttonWithAi);
                const fixButtonWithoutAi = this.getLastChild(buttonWithoutAi);
                if (fixButtonWithAi) {
                    fixButtonWithAi.style.borderColor = '#f2f2f2';
                }
                if (fixButtonWithoutAi) {
                    fixButtonWithoutAi.style.borderColor = '';
                }
            }

        }
    }

    uploadUserImage() {
        console.debug('[upload user image] starting user image upload');

        this.editorLoadWithAi = false;

        this.changeLoadWithAi();

        if (this.editorLoadWithAiButton) {
            this.editorLoadWithAiButton.style.cursor = 'pointer';
            this.editorLoadWithAiButton.onclick = () => {
                this.changeLoadWithAi(true);
            }
        }

        if (this.editorLoadWithoutAiButton) {
            this.editorLoadWithoutAiButton.style.cursor = 'pointer';
            this.editorLoadWithoutAiButton.onclick = () => {
                this.changeLoadWithAi(false);
            }
        }

        // Создаем input элемент для выбора файла
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';

        // Обработчик выбора файла
        fileInput.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];

            if (file) {
                console.debug('[upload user image] file selected:', file.name);

                // Проверяем, что это изображение
                if (!file.type.startsWith('image/')) {
                    console.warn('[upload user image] selected file is not an image');
                    alert('Пожалуйста, выберите файл изображения');
                    return;
                }

                // Создаем FileReader для чтения файла
                const reader = new FileReader();

                reader.onload = async (e) => {
                    const imageUrl = e.target?.result as string;
                    console.debug('[upload user image] file loaded as data URL');

                    const imageData = await this.getImageData(imageUrl);

                    // Сохраняем загруженное изображение
                    this.setUserUploadImage(imageData);

                    console.debug('[upload user image] image layout added successfully');
                };

                reader.onerror = () => {
                    console.error('[upload user image] error reading file');
                    alert('Ошибка при загрузке файла');
                };

                // Читаем файл как data URL
                reader.readAsDataURL(file);
            }
        };

        // Программно кликаем по input для открытия диалога выбора файла
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    setUserUploadImage(image: string) {
        this.loadedUserImage = image;

        this.editorUploadViewBlock.style.display = 'block';
        // this.editorUploadCanselButton.style.display = 'block';
        const imageBlock = this.getLastChild(this.editorUploadViewBlock);
        if (imageBlock) {
            imageBlock.style.backgroundImage = `url(${image})`;
            imageBlock.style.backgroundSize = 'contain';
            imageBlock.style.backgroundPosition = 'center';
            imageBlock.style.backgroundRepeat = 'no-repeat';
        }
    }

    initClipImageBlock() {
        this.editorClipImageBlock.style.cursor = 'pointer';

        this.editorClipImageBlock.addEventListener('click', () => {
            console.debug('[clip image] clicked');
        });
    }

    initAddOrderButton() {
        this.editorAddOrderButton.style.cursor = 'pointer';

        this.editorAddOrderButton.onclick = async () => {
            if (this.getSum() === 0) {
                alert('Для добавления заказа продукт не может быть пустым');
                return;
            }

            const exportedArt = await this.exportArt();

            const sides = Object.keys(exportedArt).map(side => ({
                image_url: exportedArt[side] || '',
            }));

            for (const side of sides) {
                side.image_url = await this.uploadImage(side.image_url.split(',')[1]!);
            }

            createProduct({
                quantity: this.getQuantity(),
                name: `${this.capitalizeFirstLetter(this.getProductName())} с вашим ${Object.keys(exportedArt).length == 1 ? 'односторонним' : 'двухсторонним'} принтом`,
                size: this.selectSize,
                color: this.selectColor,
                sides,
            });
        }
    }

    async uploadImage(base64: string) {
        const tempStorageManager = new EditorStorageManager();
        const userId = await (tempStorageManager as any).getUserId();

        const response = await fetch('https://1804633-image.fl.gridesk.ru/upload', {
            method: 'POST',
            body: JSON.stringify({ image: base64, user_id: userId }),
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();
        return data.image_url;
    }

    getProductName() {
        return this.productConfigs.find(product => product.type === this.selectType)?.productName || '';
    }

    capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    async exportArt(): Promise<{ [side: string]: string }> {
        const result: { [side: string]: string } = {};

        // Получаем все стороны, для которых есть хотя бы один слой
        const allSidesWithLayers = [...new Set(this.layouts.map(layout => layout.view))];

        // Сортируем так, чтобы front был первым, если он есть
        const sidesWithLayers = allSidesWithLayers.sort((a, b) => {
            if (a === 'front') return -1;  // front в начало
            if (b === 'front') return 1;   // front в начало
            return 0;  // остальные в исходном порядке
        });

        console.debug(`[exportArt] Найдены стороны с слоями:`, sidesWithLayers, '(front первый)');

        for (const side of sidesWithLayers) {
            try {
                // Находим canvas'ы для этой стороны
                const editableCanvas = this.canvases.find(canvas => (canvas as any).side === side);
                const layersCanvas = this.layersCanvases.find(canvas => (canvas as any).side === side);

                if (!editableCanvas) {
                    console.warn(`[exportArt] Canvas для стороны ${side} не найден`);
                    continue;
                }

                console.debug(`[exportArt] Экспортируем сторону ${side} с мокапом...`);

                // Загружаем мокап для текущей стороны и цвета
                const mockupUrl = this.getMockupUrl(side as SideEnum);
                if (!mockupUrl) {
                    console.warn(`[exportArt] Мокап для стороны ${side} не найден`);
                    continue;
                }

                const mockupImg = await this.loadImage(mockupUrl);
                console.debug(`[exportArt] Загружен мокап для ${side}: ${mockupUrl}`);

                // Создаем временный canvas размером с мокап
                const tempCanvas = document.createElement('canvas');
                const ctx = tempCanvas.getContext('2d')!;

                tempCanvas.width = mockupImg.width;
                tempCanvas.height = mockupImg.height;

                // Рисуем мокап как фон
                ctx.drawImage(mockupImg, 0, 0);
                console.debug(`[exportArt] Нарисован мокап как фон для ${side}`);

                // Вычисляем масштаб и позицию для наложения дизайна
                const scaleX = mockupImg.width / editableCanvas.getWidth();
                const scaleY = mockupImg.height / editableCanvas.getHeight();

                // Создаем временный canvas для дизайна без границ
                const designCanvas = document.createElement('canvas');
                const designCtx = designCanvas.getContext('2d')!;
                designCanvas.width = editableCanvas.getWidth();
                designCanvas.height = editableCanvas.getHeight();

                // Добавляем статические слои без границ
                if (layersCanvas) {
                    try {
                        const layersDataUrl = layersCanvas.toDataURL({
                            format: 'png',
                            multiplier: 1
                        });

                        const emptyDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
                        if (layersDataUrl !== emptyDataUrl && layersDataUrl.length > emptyDataUrl.length) {
                            const layersImg = await this.loadImageForDataUrl(layersDataUrl);
                            designCtx.drawImage(layersImg, 0, 0);
                            console.debug(`[exportArt] Добавлены статические слои для ${side}`);
                        }
                    } catch (error) {
                        console.warn(`[exportArt] Ошибка экспорта статических слоев для ${side}:`, error);
                    }
                }

                // Добавляем редактируемые объекты БЕЗ границ, но С учётом clipPath
                try {
                    const tempEditableCanvas = new fabric.StaticCanvas(null, {
                        width: editableCanvas.getWidth(),
                        height: editableCanvas.getHeight(),
                        backgroundColor: 'transparent'
                    });

                    // Применяем clipPath с основного canvas если он существует
                    if (editableCanvas.clipPath) {
                        const clonedClip = await new Promise<fabric.Object>((resolve) => {
                            editableCanvas.clipPath!.clone((cloned: fabric.Object) => resolve(cloned));
                        });
                        tempEditableCanvas.clipPath = clonedClip;
                        console.debug(`[exportArt] Применён clipPath для экспорта стороны ${side}`);
                    }

                    // Копируем все объекты кроме служебных
                    const allObjects = editableCanvas.getObjects();
                    const designObjects = allObjects.filter(obj => {
                        const objName = (obj as any).name;
                        return objName !== "area:border" &&
                            objName !== "area:clip" &&
                            objName !== "guideline" &&
                            objName !== "guideline:vertical" &&
                            objName !== "guideline:horizontal";
                    });

                    for (const obj of designObjects) {
                        const clonedObj = await new Promise<fabric.Object>((resolve) => {
                            obj.clone((cloned: fabric.Object) => resolve(cloned));
                        });
                        tempEditableCanvas.add(clonedObj);
                    }

                    const designDataUrl = tempEditableCanvas.toDataURL({
                        format: 'png',
                        multiplier: 1
                    });

                    const emptyDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
                    if (designDataUrl !== emptyDataUrl && designDataUrl.length > emptyDataUrl.length) {
                        const designImg = await this.loadImageForDataUrl(designDataUrl);
                        designCtx.drawImage(designImg, 0, 0);
                        console.debug(`[exportArt] Добавлены объекты дизайна без границ для ${side}`);
                    }

                    // Очищаем временный canvas
                    tempEditableCanvas.dispose();
                } catch (error) {
                    console.warn(`[exportArt] Ошибка создания дизайна без границ для ${side}:`, error);
                }

                // Накладываем дизайн поверх мокапа с правильным масштабом
                ctx.save();
                ctx.scale(scaleX, scaleY);
                ctx.drawImage(designCanvas, 0, 0);
                ctx.restore();

                console.debug(`[exportArt] Наложен дизайн на мокап для ${side}`);

                // Конвертируем в data URL и сохраняем результат
                const resultDataUrl = tempCanvas.toDataURL('image/png', 0.9);
                result[side] = resultDataUrl;

                console.debug(`[exportArt] Экспортирован дизайн с мокапом для стороны ${side}`);

            } catch (error) {
                console.error(`[exportArt] Ошибка экспорта для стороны ${side}:`, error);

                if (error instanceof Error && error.name === 'SecurityError') {
                    console.error(`[exportArt] CORS ошибка! Проверьте что все изображения имеют правильные заголовки CORS`);
                    throw new Error(`CORS ошибка при экспорте стороны ${side}. Убедитесь что все изображения поддерживают CORS.`);
                }

                throw error;
            }
        }

        console.debug(`[exportArt] Экспортированы стороны с мокапами:`, Object.keys(result));
        return result;
    }

    // Функция получения URL мокапа для заданной стороны
    getMockupUrl(side: SideEnum): string | null {
        const mockup = this.productConfigs
            .find(product => product.type === this.selectType)?.mockups
            .find(mockup => mockup.side === side && mockup.color.name === this.selectColor.name);

        return mockup ? mockup.url : null;
    }

    // Отдельная функция для загрузки data URL (для них не нужен CORS)
    loadImageForDataUrl(dataUrl: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            // Для data URL не устанавливаем crossOrigin
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    // Альтернативный метод экспорта - экспортирует canvas'ы с мокапом без объединения слоев
    async exportArtAlternative(): Promise<{ [side: string]: string }> {
        const result: { [side: string]: string } = {};

        // Получаем все стороны, для которых есть хотя бы один слой
        const allSidesWithLayers = [...new Set(this.layouts.map(layout => layout.view))];

        // Сортируем так, чтобы front был первым, если он есть
        const sidesWithLayers = allSidesWithLayers.sort((a, b) => {
            if (a === 'front') return -1;  // front в начало
            if (b === 'front') return 1;   // front в начало
            return 0;  // остальные в исходном порядке
        });

        console.debug(`[exportArtAlternative] Найдены стороны с слоями:`, sidesWithLayers, '(front первый)');

        for (const side of sidesWithLayers) {
            try {
                // Находим canvas для этой стороны
                const editableCanvas = this.canvases.find(canvas => (canvas as any).side === side);

                if (!editableCanvas) {
                    console.warn(`[exportArtAlternative] Canvas для стороны ${side} не найден`);
                    continue;
                }

                console.debug(`[exportArtAlternative] Экспортируем сторону ${side} с мокапом (простой метод)...`);

                // Загружаем мокап для текущей стороны и цвета
                const mockupUrl = this.getMockupUrl(side as SideEnum);
                if (!mockupUrl) {
                    console.warn(`[exportArtAlternative] Мокап для стороны ${side} не найден`);
                    continue;
                }

                const mockupImg = await this.loadImage(mockupUrl);
                console.debug(`[exportArtAlternative] Загружен мокап для ${side}: ${mockupUrl}`);

                // Создаем временный canvas размером с мокап
                const tempCanvas = document.createElement('canvas');
                const ctx = tempCanvas.getContext('2d')!;

                tempCanvas.width = mockupImg.width;
                tempCanvas.height = mockupImg.height;

                // Рисуем мокап как фон
                ctx.drawImage(mockupImg, 0, 0);

                // Простое наложение canvas'а дизайна поверх мокапа
                try {
                    // Создаем копию canvas без служебных объектов
                    const tempEditableCanvas = new fabric.StaticCanvas(null, {
                        width: editableCanvas.getWidth(),
                        height: editableCanvas.getHeight(),
                        backgroundColor: 'transparent'
                    });

                    // Копируем все объекты кроме служебных
                    const allObjects = editableCanvas.getObjects();
                    const designObjects = allObjects.filter(obj => {
                        const objName = (obj as any).name;
                        return objName !== "area:border" &&
                            objName !== "area:clip" &&
                            objName !== "guideline" &&
                            objName !== "guideline:vertical" &&
                            objName !== "guideline:horizontal";
                    });

                    for (const obj of designObjects) {
                        const clonedObj = await new Promise<fabric.Object>((resolve) => {
                            obj.clone((cloned: fabric.Object) => resolve(cloned));
                        });
                        tempEditableCanvas.add(clonedObj);
                    }

                    const designDataUrl = tempEditableCanvas.toDataURL({
                        format: 'png',
                        multiplier: 1
                    });

                    const emptyDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
                    if (designDataUrl !== emptyDataUrl && designDataUrl.length > emptyDataUrl.length) {
                        const designImg = await this.loadImageForDataUrl(designDataUrl);

                        // Накладываем дизайн с простым масштабированием
                        const scaleX = mockupImg.width / editableCanvas.getWidth();
                        const scaleY = mockupImg.height / editableCanvas.getHeight();

                        ctx.save();
                        ctx.scale(scaleX, scaleY);
                        ctx.drawImage(designImg, 0, 0);
                        ctx.restore();

                        console.debug(`[exportArtAlternative] Наложен дизайн на мокап для ${side}`);
                    }

                    // Очищаем временный canvas
                    tempEditableCanvas.dispose();

                } catch (designError) {
                    console.warn(`[exportArtAlternative] Ошибка создания дизайна для ${side}:`, designError);
                }

                // Конвертируем в data URL и сохраняем результат
                const resultDataUrl = tempCanvas.toDataURL('image/png', 0.9);
                result[side] = resultDataUrl;
                console.debug(`[exportArtAlternative] Экспортирован дизайн с мокапом для стороны ${side}`);

            } catch (error) {
                console.error(`[exportArtAlternative] Ошибка экспорта для стороны ${side}:`, error);

                if (error instanceof Error && error.name === 'SecurityError') {
                    console.error(`[exportArtAlternative] CORS ошибка для стороны ${side}!`);
                    // Не бросаем ошибку, пропускаем эту сторону
                    continue;
                }

                throw error;
            }
        }

        console.debug(`[exportArtAlternative] Экспортированы стороны с мокапами:`, Object.keys(result));

        if (Object.keys(result).length === 0) {
            throw new Error('Не удалось экспортировать ни одной стороны. Проверьте CORS настройки изображений.');
        }

        return result;
    }

    initChangeSideButton() {
        this.changeSideButton.style.cursor = 'pointer';
        this.changeSideButton.onclick = () => this.changeSide();
    }

    initColorsList() {
        console.debug(`[settings] init for ${this.selectType}`);
        const product = this.productConfigs.find(product => product.type === this.selectType)!;

        // hide color item block
        this.editorColorItemBlock.style.display = 'none';

        // Очищаем контейнер от предыдущих элементов
        const colorsContainer = this.editorColorsListBlock.firstElementChild!;
        colorsContainer.innerHTML = '';

        // Очищаем массив ссылок на цветные блоки
        this.colorBocks = [];

        // init colors block
        console.debug(`[settings] [colors] init colors block`)
        const colors = product.mockups.filter(mockup => mockup.side === this.selectSide).map(mockup => mockup.color);
        colors.forEach(color => {
            console.debug(`[settings] [colors] init color item ${color.name}`);
            const colorItem = this.editorColorItemBlock.cloneNode(true) as HTMLElement;
            colorItem.style.display = 'table';

            const colorBlock = colorItem.firstElementChild! as HTMLElement;
            colorBlock.classList.add('editor-settings__color-block__' + color.name);
            colorBlock.style.cursor = 'pointer';
            colorBlock.style.backgroundColor = color.hex;
            colorBlock.style.borderColor = "transparent";

            colorItem.onclick = () => this.changeColor(color.name)

            this.colorBocks.push(colorBlock);
            this.editorColorsListBlock.firstElementChild!.appendChild(colorItem);
        });

        this.changeColor(this.selectColor.name);
    }

    initSizesList() {
        console.debug(`[settings] [sizes] init for ${this.selectType}`);
        const product = this.productConfigs.find(product => product.type === this.selectType)!;

        // if (!this.editorSizeItemBlock) {
        //     console.error("[settings] [sizes] editorSizeItemBlock is not initialized");
        //     return;
        // }

        if (!this.editorSizesListBlock) {
            console.error("[settings] [sizes] editorSizesListBlock is not initialized");
            return;
        }

        this.editorSizeItemBlock.style.display = 'none';

        // Очищаем контейнер от предыдущих элементов
        const sizesContainer = this.editorSizesListBlock.firstElementChild!;
        sizesContainer.innerHTML = '';

        // Очищаем массив ссылок на размерные блоки
        this.sizeBocks = [];

        product.sizes!.forEach(size => {
            console.debug(`[settings] [sizes] init size item ${size}`);
            const sizeItem = this.editorSizeItemBlock.cloneNode(true) as HTMLElement;
            sizeItem.style.display = 'table';
            sizeItem.style.cursor = 'pointer';
            sizeItem.style.userSelect = 'none';
            sizeItem.classList.add('editor-settings__size-block__' + size);

            const borderBlock = sizeItem.firstElementChild! as HTMLElement;
            borderBlock.style.borderColor = "#f3f3f3";

            const sizeTextBlock = this.getLastChild(sizeItem)!;
            sizeTextBlock.innerText = size;


            sizeItem.onclick = () => this.changeSize(size);
            this.sizeBocks.push(sizeItem);
            this.editorSizesListBlock.firstElementChild!.appendChild(sizeItem);

        });

        this.changeSize(this.selectSize);
    }

    showLayoutList() {
        console.debug(`[settings] [layouts] show layouts list`);

        if (!this.editorLayoutItemBlock) {
            console.error("[settings] [layouts] editorLayoutItemBlock is not initialized");
            return;
        }

        if (!this.editorLayoutsListBlock) {
            console.error("[settings] [layouts] editorLayoutsListBlock is not initialized");
            return;
        }

        this.editorLayoutItemBlock.style.display = 'none';
        this.editorLayoutsListBlock.firstElementChild!.innerHTML = "";

        console.debug(`[settings] [layouts] layouts list block children: ${this.editorLayoutsListBlock.firstElementChild!.children.length}`);

        const layoutsToShow = this.layouts.filter(layout => layout.view === this.selectSide);
        console.debug(`[settings] [layouts] layouts to show: ${layoutsToShow.length}`);

        layoutsToShow.forEach(layout => {
            const layoutItem = this.editorLayoutItemBlock.cloneNode(true) as HTMLElement;
            layoutItem.style.display = 'table';

            const previewBlock = layoutItem.querySelector(this.editorLayoutItemBlockViewClass)! as HTMLElement;
            const nameBlock = layoutItem.querySelector(this.editorLayoutItemBlockNameClass)! as HTMLElement;
            const removeBlock = layoutItem.querySelector(this.editorLayoutItemBlockRemoveClass)! as HTMLElement;
            const editBlock = layoutItem.querySelector(this.editorLayoutItemBlockEditClass)! as HTMLElement;

            if (previewBlock) {
                if (layout.type === 'image') {
                    (previewBlock.firstElementChild! as HTMLElement).style.backgroundImage = `url(${(layout as ImageLayout).url})`;
                    (previewBlock.firstElementChild! as HTMLElement).style.backgroundSize = "contain";
                    (previewBlock.firstElementChild! as HTMLElement).style.backgroundPosition = "center";
                    (previewBlock.firstElementChild! as HTMLElement).style.backgroundRepeat = "no-repeat";
                } else if (layout.type === 'text') { }
            }

            if (nameBlock) {
                if (layout.type === 'image') {
                    (nameBlock.firstElementChild! as HTMLElement).innerText = !layout.name ? "Изображение" : layout.name.includes("\n") ? layout.name.split("\n")[0] + "..." : layout.name.length > 40 ? layout.name.slice(0, 40) + "..." : layout.name;
                } else if (layout.type === 'text') {
                    (nameBlock.firstElementChild! as HTMLElement).innerText = layout.name || "Текст";
                }
            }

            if (removeBlock) {
                removeBlock.style.cursor = "pointer";
                removeBlock.onclick = () => this.removeLayout(layout);

                const fixIconBlock = removeBlock.firstElementChild! as HTMLElement;
                fixIconBlock.style.backgroundImage = `url("${fixIconBlock.attributes.getNamedItem("data-original")?.value}")`;
            }

            if (editBlock) {
                editBlock.style.cursor = "pointer";
                editBlock.onclick = () => this.editLayout(layout);

                const fixIconBlock = this.getLastChild(editBlock)! as HTMLElement;
                fixIconBlock.style.backgroundImage = `url("${fixIconBlock.attributes.getNamedItem("data-original")?.value}")`;
            }

            this.editorLayoutsListBlock.firstElementChild!.appendChild(layoutItem);
        })

        console.debug(`[settings] [layouts] layouts shown: ${this.editorLayoutsListBlock.firstElementChild!.children.length}`);
    }

    editLayout(layout: Layout | ImageLayout | TextLayout) {
        console.debug(`[settings] [layouts] edit layout ${layout.id}`);

        this.selectLayout = layout.id;

        const formInput = this.formBlock!.querySelector(`[name="${this.formInputVariableName}"]`) as HTMLInputElement;
        formInput.value = layout.name || "";

        this.loadedUserImage = layout.type === 'image' ? (layout as ImageLayout).url : null;
        this.setUserUploadImage(this.loadedUserImage!);
    }

    async initForm() {
        const formBlock = this.formBlock!;
        const formInputVariableName = this.formInputVariableName!;
        const formButton = this.formButton!;

        const handleClick = async () => {
            console.debug('[form] [button] clicked');

            const formInput = formBlock.querySelector(`[name="${formInputVariableName}"]`) as HTMLInputElement;
            const prompt = formInput.value;

            if (this.loadedUserImage && this.editorLoadWithAi) {
                if (!prompt || prompt.trim() === "" || prompt.length < 3) {
                    console.warn('[form] [input] prompt is empty or too short');
                    alert("Минимальная длина запроса 3 символа");
                    return;
                }
            } else if (!this.loadedUserImage) {
                if (!prompt || prompt.trim() === "" || prompt.length < 3) {
                    console.warn('[form] [input] prompt is empty or too short');
                    alert("Минимальная длина запроса 3 символа");
                    return;
                }
            }

            console.debug(`[form] [input] prompt: ${prompt}`);

            this.events.dispatchEvent(new CustomEvent('mockup-loading', { detail: true }));
            try {

                const url = await generateImage(prompt, this.selectColor.name, this.loadedUserImage!, this.editorLoadWithAi, this.selectLayout!);
                this.events.dispatchEvent(new CustomEvent('mockup-loading', { detail: false }));

                const imageData = await this.getImageData(url);
                console.debug(`[form] [input] image data: ${imageData}`);

                if (this.selectLayout) {
                    const layout = this.layouts.find(layout => layout.id === this.selectLayout)! as ImageLayout;

                    console.debug(`[form] [input] select layout: ${layout}`);

                    layout.name = prompt;
                    layout.url = imageData;

                    console.debug(`[form] [input] layout updated: ${layout}`);

                    this.showLayoutList();
                    this.updateLayouts();
                } else {
                    this.addLayout(new ImageLayout({
                        view: this.selectSide,
                        url: imageData,
                        name: prompt
                    }))
                }

                formInput.value = "";

                if (this.loadedUserImage)
                    this.resetUserUploadImage();
            } catch (error) {
                this.events.dispatchEvent(new CustomEvent('mockup-loading', { detail: false }));
                console.error('[form] [input] error', error);
                alert("Ошибка при генерации изображения");
                return;
            } finally {
                if (this.loadedUserImage)
                    this.resetUserUploadImage();

                if (this.selectLayout) {
                    this.selectLayout = null;
                }
            }

        }

        const form = await new Promise<HTMLFormElement | null>((resolve) => {
            const inteval = setInterval(() => {
                const form = formBlock.querySelector("form")! as HTMLFormElement;
                if (form) {
                    clearInterval(inteval);
                    resolve(form);
                }
            }, 100);

            setTimeout(() => {
                clearInterval(inteval);
                resolve(null);
            }, 1000 * 10);
        });


        if (!form) {
            console.warn('[form] form not found');
            return;
        }

        form.action = "";
        form.method = "GET";
        form.onsubmit = (event) => {
            event.preventDefault();
            handleClick();
        }

        const fixInputBlock = form.querySelector(`textarea[name='${formInputVariableName}']`)! as HTMLElement;
        fixInputBlock.style.padding = "8px";
        formButton.onclick = handleClick;
        formButton.style.cursor = "pointer";
    }

    async getImageData(imageUrl: string) {
        const image = await this.loadImage(imageUrl);
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d')!;

        tempCanvas.width = image.width;
        tempCanvas.height = image.height;

        // Рисуем мокап как фон
        ctx.drawImage(image, 0, 0);

        return tempCanvas.toDataURL("image/png");
    }


    changeSize(size: Size) {
        this.sizeBocks.forEach(sizeBlock => {
            const borderBlock = sizeBlock.firstElementChild! as HTMLElement;
            borderBlock.style.borderColor = "#f3f3f3";
        });

        const borderBlock = this.sizeBocks.find(sizeBlock => sizeBlock.classList.contains('editor-settings__size-block__' + size))!.firstElementChild! as HTMLElement;
        borderBlock.style.borderColor = "";

        if (this.selectSize === size) {
            return;
        }

        this.selectSize = size;

        this.events.dispatchEvent(new CustomEvent('size-updated', { detail: size }));
        this.saveState();
    }

    getLastChild(element: HTMLElement): HTMLElement | null {

        if (!element) {
            return null;
        }

        if (!element.firstElementChild) {
            return element;
        }

        const children = element.firstElementChild!;

        if (!children.lastElementChild) {
            return children as HTMLElement;
        }

        return this.getLastChild(children as HTMLElement);
    }

    updateSettings() {
        // Очищаем старые настройки
        this.editorSettingsBlock.innerHTML = '';

        // Создаем новые настройки для текущего продукта
        // this.initSettings();
    }

    createEditorLoadingBlock() {
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

        editorLoadingBlock.appendChild(spinner);
        spinner.style.display = "none";

        this.editorBlock.appendChild(editorLoadingBlock);

        return editorLoadingBlock;
    }

    createBackgroundBlock() {
        const background = document.createElement('div');
        background.classList.add('editor-position');
        background.id = 'editor-background';
        this.editorBlock.appendChild(background);

        return background;
    }

    createMockupBlock() {
        const mockup = document.createElement('img');
        mockup.classList.add('editor-position');
        mockup.id = 'editor-mockup';
        this.editorBlock.appendChild(mockup);

        return mockup;
    }

    createCanvasesContainer() {
        const canvas = document.createElement('div');
        canvas.classList.add('editor-position');
        canvas.id = 'editor-canvases-container';
        canvas.style.zIndex = '10';
        canvas.style.pointerEvents = 'auto';
        this.editorBlock.appendChild(canvas);

        return canvas;
    }

    initProductList() {
        console.debug(`[settings] init product list`);

        // hide color item block
        this.productItemBlock.style.display = 'none';

        // init colors block
        console.debug(`[ProductList] init product list`)
        this.productConfigs.forEach(product => {
            console.debug(`[ProductList] init product item ${product.type}`);
            const productItem = this.productItemBlock.cloneNode(true) as HTMLElement;
            productItem.style.display = 'table';

            const productImageWrapperBlock = productItem.querySelector('.product-item-image')! as HTMLElement;
            const productImageBlock = this.getLastChild(productImageWrapperBlock)! as HTMLElement;
            if (productImageBlock) {
                productImageBlock.style.backgroundImage = `url(${product.mockups[0]!.url})`;
                productImageBlock.style.backgroundSize = 'cover';
                productImageBlock.style.backgroundPosition = 'center';
                productImageBlock.style.backgroundRepeat = 'no-repeat';
            }


            const productTextBlockWrapper = productItem.querySelector('.product-item-text')! as HTMLElement;
            const productTextBlock = this.getLastChild(productTextBlockWrapper)! as HTMLElement;
            productTextBlock.innerText = product.productName;

            const productBlock = productItem.firstElementChild! as HTMLElement;
            productBlock.classList.add('editor-settings__product-block__' + product.type);
            productBlock.style.cursor = 'pointer';
            productBlock.style.borderColor = "transparent";

            productItem.onclick = () => this.changeProduct(product.type)

            this.productBlocks.push(productBlock);

            this.productListBlock.firstElementChild!.appendChild(productItem);
        });

        this.changeProduct(this.selectType);
    }

    clearAllCanvas() {
        // Удаляем все DOM элементы canvas из контейнера
        if (this.canvasesContainer) {
            this.canvasesContainer.innerHTML = '';
        }

        // Очищаем массивы canvas
        this.canvases = [];
        this.layersCanvases = [];
        this.activeCanvas = null;
    }

    loadProduct() {
        const product = this.productConfigs.find(product => product.type === this.selectType)!;

        this.clearAllCanvas();

        if (!product || !product.printConfig) {
            console.warn("[product] product or printConfig not found");
            return;
        }

        for (const printConfig of product.printConfig) {
            this.createCanvasForSide(printConfig);
        }

        this.setActiveSide(this.selectSide);

        setTimeout(() => {
            this.isLoading = false;
            this.events.dispatchEvent(new CustomEvent('mockup-loading', { detail: false }));
        }, 100);
    }

    createCanvasForSide(printConfig: any) {
        if (!this.canvasesContainer) {
            console.error("[canvas] canvasesContainer is not initialized");
            return;
        }

        const layersCanvasBlock = document.createElement("canvas");
        layersCanvasBlock.id = "layers--" + printConfig.side;
        layersCanvasBlock.classList.add('editor-position');
        layersCanvasBlock.setAttribute("ref", printConfig.side);
        layersCanvasBlock.style.zIndex = '7';

        this.canvasesContainer.appendChild(layersCanvasBlock);

        const layersCanvas = new fabric.StaticCanvas(layersCanvasBlock, {
            width: this.editorBlock.clientWidth,
            height: this.editorBlock.clientHeight,
        });
        (layersCanvas as any).side = printConfig.side;
        (layersCanvas as any).name = "static-" + printConfig.side;

        const edtableCanvasBlock = document.createElement("canvas");
        edtableCanvasBlock.id = "edtable--" + printConfig.side;
        edtableCanvasBlock.setAttribute("ref", printConfig.side);
        edtableCanvasBlock.classList.add('editor-position');
        edtableCanvasBlock.style.zIndex = '9';

        if (!this.canvasesContainer) {
            console.error("[canvas] canvasesContainer is not initialized for editable canvas");
            return;
        }

        this.canvasesContainer.appendChild(edtableCanvasBlock);

        const edtableCanvas = new fabric.Canvas(edtableCanvasBlock, {
            controlsAboveOverlay: true,
            width: this.editorBlock.clientWidth,
            height: this.editorBlock.clientHeight,
            backgroundColor: 'transparent',
            uniformScaling: true
        });
        (edtableCanvas as any).side = printConfig.side;
        (edtableCanvas as any).name = "editable-" + printConfig.side;

        this.layersCanvases.push(layersCanvas);
        this.canvases.push(edtableCanvas);

        // Если это первый canvas, делаем его активным
        if (this.canvases.length === 1) {
            this.activeCanvas = edtableCanvas;
        }

        this.initMainCanvas(edtableCanvas, printConfig);
    }

    initMainCanvas(canvas: fabric.Canvas, printConfig: any) {
        if (!canvas || !(canvas instanceof fabric.Canvas)) {
            console.warn("[canvas] canvas is not valid");
            return;
        }

        const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
        const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
        const left = (this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth);
        const top = (this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight);

        const clipArea = new fabric.Rect({
            width: width,
            height: height,
            left,
            top,
            fill: "rgb(255, 0, 0)",
            name: "area:clip",
            evented: false,
        })

        const areaBorder = new fabric.Rect({
            width: width - 3,
            height: height - 3,
            left,
            top,
            fill: "rgba(0,0,0,0)",
            strokeWidth: 3,
            stroke: "rgb(254, 94, 58)",
            name: "area:border",
            opacity: 0.3,
            evented: false,
            selectable: false,
            hasControls: false
        });

        areaBorder.set({
            opacity: 0.3,
            strokeDashArray: [5, 5],
            strokeWidth: 3
        });

        canvas.add(areaBorder);
        canvas.clipPath = clipArea;

        canvas.on("mouse:down", () => {
            console.debug(`[canvas] mouse:down`);
            const border = this.getObject("area:border", canvas);
            if (border) {
                border.set("opacity", 8);
                canvas.requestRenderAll();
            }
        });

        canvas.on("mouse:up", () => {
            console.debug(`[canvas] mouse:up`);
            const border = this.getObject("area:border", canvas);
            if (border) {
                border.set("opacity", 0.3);
                canvas.requestRenderAll();
            }
        });

        canvas.on("object:rotating", (e) => {
            console.debug(`[canvas] ${e.target?.name} object:rotating`);

            if (e.target?.angle !== undefined) {
                const angles = [0, 90, 180, 270];
                const currentAngle = e.target.angle % 360;
                for (const snapAngle of angles) {
                    if (
                        Math.abs(currentAngle - snapAngle) < 5
                        || Math.abs(currentAngle - snapAngle + 360) < 5
                        || Math.abs(currentAngle - snapAngle - 360) < 5
                    ) {
                        e.target.rotate(snapAngle);
                    }
                }
            }
        });

        // canvas.on("", (e) => {

        // })

        canvas.on("object:moving", (e) => {
            console.debug(`[canvas] ${e.target?.name} object:moving`);

            if (e.target?.name == "area:border" || e.target?.name == "area:clip" || e.target?.name == "guideline") {
                return;
            }

            const layout = this.layouts.find(layout => layout.id === e.target?.name);
            if (layout) {
                const printConfig = this.productConfigs.find(product => product.type === this.selectType)!.printConfig.find(printConfig => printConfig.side === layout.view)!;

                const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
                const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
                const left = Math.round((this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth));
                const top = Math.round((this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight));

                const objWidth = e.target?.width! * e.target?.scaleX!;
                const objHeight = e.target?.height! * e.target?.scaleY!;

                const objCenterLeft = e.target?.left! + objWidth / 2;
                const objCenterTop = e.target?.top! + objHeight / 2;

                const nearX = Math.abs(objCenterLeft - (left + width / 2)) < 7;
                const nearY = Math.abs(objCenterTop - (top + height / 2)) < 7;

                if (nearX) {
                    const guideline = this.getObject("guideline:vertical", canvas);
                    if (!guideline) {
                        const verticalGuideline = new fabric.Line([left + width / 2, 0, left + width / 2, this.editorBlock.clientHeight], {
                            stroke: "rgb(254, 94, 58)",
                            strokeWidth: 2,
                            strokeDashArray: [5, 5],
                            selectable: false,
                            evented: false,
                            name: "guideline:vertical",
                        });
                        canvas.add(verticalGuideline);
                    }

                    e.target?.set({
                        left: left + width / 2 - objWidth / 2,
                    });
                } else {
                    const guideline = this.getObject("guideline:vertical", canvas);
                    if (guideline) {
                        canvas.remove(guideline);
                    }
                }

                if (nearY) {
                    const guideline = this.getObject("guideline:horizontal", canvas);
                    if (!guideline) {
                        const horizontalGuideline = new fabric.Line([0, top + height / 2, this.editorBlock.clientWidth, top + height / 2], {
                            stroke: "rgb(254, 94, 58)",
                            strokeWidth: 2,
                            strokeDashArray: [5, 5],
                            selectable: false,
                            evented: false,
                            name: "guideline:horizontal",
                        });
                        canvas.add(horizontalGuideline);
                    }

                    e.target?.set({
                        top: top + height / 2 - objHeight / 2,
                    });
                } else {
                    const guideline = this.getObject("guideline:horizontal", canvas);
                    if (guideline) {
                        canvas.remove(guideline);
                    }
                }
            }

        })

        canvas.on("object:modified", (e) => {
            console.debug(`[canvas] ${e.target?.name} object:modified`);
            const object = e.target;

            const guideline = this.getObject("guideline:vertical", canvas);
            const guidelineHorizontal = this.getObject("guideline:horizontal", canvas);
            if (guideline) {
                canvas.remove(guideline);
            }
            if (guidelineHorizontal) {
                canvas.remove(guidelineHorizontal);
            }

            if (object) {
                const layout = this.layouts.find(layout => layout.id === object.name);
                if (layout) {

                    const printConfig = this.productConfigs.find(product => product.type === this.selectType)!.printConfig.find(printConfig => printConfig.side === layout.view)!;

                    const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
                    const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
                    const left = Math.round((this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth));
                    const top = Math.round((this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight));

                    layout.position.x = (object.left! - left) / width;
                    layout.position.y = (object.top! - top) / height;
                    layout.size = object.scaleX!;
                    layout.aspectRatio = object.scaleY! / object.scaleX!;
                    layout.angle = object.angle!;

                    this.saveState();
                }
            }
        })
    }

    getObject(name: string, canvas?: fabric.Canvas): fabric.Object | undefined {
        const targetCanvas = canvas || this.activeCanvas || this.canvases[0];
        if (!targetCanvas) return undefined;

        return targetCanvas.getObjects().find(obj => (obj as any).name === name);
    }

    setActiveSide(side: string) {
        console.debug("Setting active side: ", side);

        this.canvases.forEach(canvas => {
            const canvasElement = canvas.getElement();
            const containerElement = canvasElement.parentElement;

            if ((canvas as any).side === side) {
                this.activeCanvas = canvas;
                if (containerElement) {
                    containerElement.style.pointerEvents = "auto";
                    containerElement.style.display = "block";
                }
                canvasElement.style.display = "block";
            } else {
                if (containerElement) {
                    containerElement.style.pointerEvents = "none";
                    containerElement.style.display = "none";
                }
                canvasElement.style.display = "none";
            }
        });

        this.layersCanvases.forEach(layersCanvas => {
            const canvasElement = layersCanvas.getElement();

            if ((layersCanvas as any).side === side) {
                canvasElement.style.display = "block";
            } else {
                canvasElement.style.display = "none";
            }
        });

        this.selectSide = side as any;
    }

    async updateMockup() {
        console.debug(`[settings] [mockup] update mockup for ${this.selectType} ${this.selectSide} ${this.selectColor.name}`);

        this.events.dispatchEvent(new CustomEvent('mockup-loading', { detail: true }));

        return new Promise((resolve, reject) => {
            const mockupImageUrl = this.productConfigs.find(product => product.type === this.selectType)!.mockups.find(mockup => mockup.side === this.selectSide && mockup.color.name === this.selectColor.name)!.url;

            const mockupImage = new Image()
            mockupImage.setAttribute('crossOrigin', 'anonymous')
            mockupImage.src = mockupImageUrl;

            mockupImage.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = mockupImage.width;
                canvas.height = mockupImage.height;
                const ctx = canvas.getContext("2d");
                ctx!.drawImage(mockupImage, 0, 0);
                const dataURL = canvas.toDataURL("image/png");

                resolve(dataURL);
                this.events.dispatchEvent(new CustomEvent('mockup-updated', { detail: dataURL }));
                this.events.dispatchEvent(new CustomEvent('mockup-loading', { detail: false }));

                if (this.mockupBlock) {
                    this.mockupBlock.src = dataURL;
                }
            }
        })
    }

    changeProduct(productType: Product['type']) {
        this.selectType = productType;
        this.changeProductName(productType);

        if (this.selectType) {
            this.productBlocks.forEach(productBlock => {
                productBlock.style.borderColor = "transparent";
            });
            this.productBlocks.find(productBlock => productBlock.classList.contains('editor-settings__product-block__' + this.selectType))!.style.borderColor = "";
        } else {
            console.warn(`[settings] [products] product ${this.selectType} not found. Select first product`);
        }

        this.updateMockup();
        this.loadProduct();
        this.showLayoutList();
        this.updateLayouts();
        this.updateSum();
        // this.saveState();
    }

    changeProductName(productType: Product['type']) {
        if (!this.editorProductName) {
            console.error("[settings] [product] editorProductName is not initialized");
            return;
        }

        const getChild = (elem: HTMLElement) => {
            return elem.lastElementChild as HTMLElement;
        }

        const lastChild = getChild(this.editorProductName);

        if (lastChild) {
            lastChild.innerText = this.productConfigs.find(product => product.type === productType)!.productName;
        }
    }

    changeSide() {
        const newSide = this.selectSide === 'front' ? 'back' : 'front';
        this.setActiveSide(newSide);
        this.updateMockup();
        this.showLayoutList();
        this.saveState();

        // Сохраняем в историю при изменении стороны
        this.saveToHistory(`Изменена сторона на: ${newSide}`);
    }

    changeColor(colorName: Color['name']) {
        console.debug(`[settings] [colors] change color to ${colorName}`);

        const trySelectColor = this.productConfigs.find(product => product.type === this.selectType)!.mockups.find(mockup => mockup.color.name === colorName)!.color;

        if (trySelectColor) {
            this.selectColor = trySelectColor;
            this.colorBocks.forEach(colorBlock => {
                colorBlock.style.borderColor = "#f3f3f3";
            });
            this.colorBocks.find(colorBlock => colorBlock.classList.contains('editor-settings__color-block__' + colorName))!.style.borderColor = "";
        } else {
            console.warn(`[settings] [colors] color ${colorName} not found. Select first color`);
            this.selectColor = this.productConfigs.find(product => product.type === this.selectType)!.mockups[0]!.color;
        }

        this.updateMockup();
        this.saveState();

        // Сохраняем в историю при изменении цвета
        this.saveToHistory(`Изменен цвет на: ${colorName}`);
    }

    addLayout(layout: Layout) {
        layout.view = this.selectSide;
        this.layouts.push(layout);
        this.saveState();
        this.showLayoutList();

        // Сохраняем в историю при добавлении макета
        this.saveToHistory(`Добавлен макет: ${layout.name || layout.type}`);
        this.updateLayouts();
        this.updateSum();
        // this.addLayoutToCanvas(layout);
    }

    removeLayout(layout: Layout) {
        const layoutName = layout.name || layout.type;
        this.layouts = this.layouts.filter(fLayout => fLayout.id !== layout.id);

        if (this.selectLayout === layout.id) {
            this.selectLayout = null;
        }

        this.saveState();
        this.showLayoutList();

        // Сохраняем в историю при удалении макета
        this.saveToHistory(`Удален макет: ${layoutName}`);
        this.updateLayouts();
        this.updateSum();
    }

    getSum() {
        const hasFront = this.layouts.some(layout => layout.view === 'front');
        const hasBack = this.layouts.some(layout => layout.view === 'back');

        if (hasBack && hasFront) {
            return 1920 + 500;
        }

        if (hasBack || hasFront) {
            return 1920;
        }

        return 0;
    }

    updateSum() {
        const sum = this.getSum();

        if (sum === 0) {
            const buttonBlock = this.getLastChild(this.editorAddOrderButton);
            if (buttonBlock) {
                buttonBlock.style.backgroundColor = "rgb(121 121 121)";
            }
        } else {
            const buttonBlock = this.getLastChild(this.editorAddOrderButton);
            if (buttonBlock) {
                buttonBlock.style.backgroundColor = "";
            }
        }

        const sumBlock = this.getLastChild(this.editorSumBlock);

        if (sumBlock) {
            sumBlock.innerText = sum.toString() + " ₽";
        }
    }

    async saveState() {
        console.debug(`[state] save state `);
        try {
            const editorState: EditorState = {
                date: new Date().toISOString(),
                color: this.selectColor.name,
                side: this.selectSide,
                type: this.selectType,
                layouts: this.layouts,
                size: this.selectSize
            };
            await (this.storageManager as any).saveEditorState(editorState);
        } catch (error) {
            console.error('[state] Ошибка сохранения состояния:', error);
        }
    }

    async loadState() {
        console.debug(`[state] load state`);
        let stateLoaded = false;

        try {
            const editorState = await (this.storageManager as any).loadEditorState();

            if (editorState) {
                const date = new Date(editorState.date);
                const thirtyDaysAgo = new Date().getTime() - 1000 * 60 * 60 * 24 * 30;

                if (date.getTime() > thirtyDaysAgo) {
                    console.debug(`[state] load state from IndexedDB`);

                    if (editorState.size) {
                        this.selectSize = editorState.size as Size;
                    }

                    if (editorState.type && editorState.color && editorState.side) {
                        this.selectType = editorState.type as Product['type'];

                        // Безопасно найти цвет
                        const colorMockup = this.productConfigs
                            .find(product => product.type === this.selectType)
                            ?.mockups.find(mockup => mockup.color.name === editorState.color);

                        if (colorMockup) {
                            this.selectColor = colorMockup.color;
                            this.selectSide = editorState.side as SideEnum;
                            this.layouts = editorState.layouts || [];
                            stateLoaded = true;
                            console.debug("[state] Состояние успешно загружено из IndexedDB");
                        } else {
                            console.warn("[state] Цвет не найден в конфигурации:", editorState.color);
                        }
                    } else {
                        console.warn("[state] load state from IndexedDB is not valid");
                    }
                } else {
                    console.warn("[state] load state from IndexedDB is expired");
                    await (this.storageManager as any).clearEditorState();
                }
            } else {
                console.debug("[state] load state from IndexedDB is not found");
            }
        } catch (error) {
            console.error('[state] Ошибка загрузки состояния:', error);
        }

        // ВСЕГДА обновляем интерфейс после попытки загрузки состояния
        this.updateMockup();
        this.initColorsList();
        this.initSizesList();
        this.showLayoutList();
        this.updateLayouts(); // Обновляем слои на канвасе
        this.updateSum(); // Обновляем сумму заказа
        this.changeProduct(this.selectType)

        if (!stateLoaded) {
            console.debug("[state] Используются дефолтные значения");
        }
    }

    // Метод для миграции данных из localStorage в IndexedDB
    private async migrateFromLocalStorage(): Promise<void> {
        try {
            // Мигрируем состояние редактора
            const date = localStorage.getItem("editor-state-date");
            if (date) {
                console.log('[migration] Найдены данные в localStorage, выполняем миграцию...');

                const color = localStorage.getItem("editor-state-color");
                const side = localStorage.getItem("editor-state-side");
                const type = localStorage.getItem("editor-state-type");
                const layouts = localStorage.getItem("editor-state-layouts");
                const size = localStorage.getItem("editor-state-size");

                if (color && side && type && size) {
                    const editorState: EditorState = {
                        date,
                        color,
                        side,
                        type,
                        layouts: layouts ? JSON.parse(layouts) : [],
                        size
                    };

                    await (this.storageManager as any).saveEditorState(editorState);
                    console.log('[migration] Состояние редактора успешно мигрировано в IndexedDB');

                    // Очищаем localStorage после успешной миграции
                    localStorage.removeItem("editor-state-date");
                    localStorage.removeItem("editor-state-color");
                    localStorage.removeItem("editor-state-side");
                    localStorage.removeItem("editor-state-type");
                    localStorage.removeItem("editor-state-layouts");
                    localStorage.removeItem("editor-state-size");
                }
            }

            // Мигрируем userId
            const userId = localStorage.getItem('userId');
            if (userId) {
                console.log('[migration] Мигрируем userId...');
                // Просто удаляем из localStorage - новый userId будет создан автоматически при первом обращении
                localStorage.removeItem('userId');
                console.log('[migration] userId удален из localStorage');
            }

            if (date || userId) {
                console.log('[migration] localStorage очищен');
            }
        } catch (error) {
            console.error('[migration] Ошибка при миграции данных:', error);
        }
    }

    // Асинхронная инициализация редактора
    private async initializeEditor(): Promise<void> {
        try {
            // Ждем инициализации хранилища и миграции
            await this.storageManager.waitForReady();

            // Загружаем состояние из базы данных
            await this.loadState();

            console.debug('[editor] Инициализация завершена');
        } catch (error) {
            console.error('[editor] Ошибка инициализации:', error);

            // Если ошибка - все равно отрисовываем с дефолтными значениями
            this.initializeWithDefaults();
        }
    }

    // Инициализация с дефолтными значениями
    private initializeWithDefaults(): void {
        console.debug('[editor] Инициализация с дефолтными значениями');
        this.updateMockup();
        this.initColorsList();
        this.initSizesList();
        this.showLayoutList();
        this.updateLayouts(); // Обновляем слои на канвасе
        this.updateSum(); // Обновляем сумму заказа
    }

    // Сохранить текущее состояние в историю
    async saveToHistory(description?: string): Promise<string | null> {
        try {
            const historyItem = {
                side: this.selectSide,
                type: this.selectType,
                color: this.selectColor.name,
                size: this.selectSize,
                layouts: JSON.parse(JSON.stringify(this.layouts)) // глубокое копирование
            };

            console.debug('[history] Сохранение состояния в историю:', historyItem);
            const id = await (this.storageManager as any).saveToHistory(historyItem, description);
            console.debug('[history] Состояние сохранено с ID:', id);
            return id;
        } catch (error) {
            console.error('[history] Ошибка при сохранении в историю:', error);
            return null;
        }
    }

    // Восстановить состояние из истории по ID
    async restoreFromHistory(historyId: string): Promise<boolean> {
        try {
            console.debug('[history] Восстановление состояния с ID:', historyId);
            const historyItem = await (this.storageManager as any).getHistoryItem(historyId);

            if (!historyItem) {
                console.warn('[history] Элемент истории не найден:', historyId);
                return false;
            }

            // Проверяем, подходит ли этот элемент для текущего продукта
            if (historyItem.type !== this.selectType) {
                console.warn('[history] Тип продукта не совпадает:', historyItem.type, '!=', this.selectType);
                return false;
            }

            // Восстанавливаем состояние
            this.selectSide = historyItem.side;
            this.selectSize = historyItem.size as Size;

            // Находим цвет по названию
            const colorMockup = this.productConfigs
                .find(product => product.type === this.selectType)!
                .mockups.find(mockup => mockup.color.name === historyItem.color);

            if (colorMockup) {
                this.selectColor = colorMockup.color;
            } else {
                console.warn('[history] Цвет не найден:', historyItem.color);
            }

            // Восстанавливаем макеты
            this.layouts = historyItem.layouts;

            // Обновляем интерфейс
            this.updateMockup();
            this.showLayoutList();
            this.updateLayouts(); // Обновляем слои на канвасе
            this.updateSum(); // Обновляем сумму заказа

            console.debug('[history] Состояние успешно восстановлено');
            return true;
        } catch (error) {
            console.error('[history] Ошибка при восстановлении из истории:', error);
            return false;
        }
    }

    // Получить историю для текущего продукта и стороны
    async getHistoryForCurrentState(limit: number = 20): Promise<HistoryItem[]> {
        try {
            const filter: HistoryFilter = {
                side: this.selectSide,
                type: this.selectType
            };
            return await (this.storageManager as any).getHistory(filter, limit);
        } catch (error) {
            console.error('[history] Ошибка при получении истории:', error);
            return [];
        }
    }

    // Очистить историю для текущего продукта и стороны
    async clearCurrentHistory(): Promise<void> {
        try {
            const filter: HistoryFilter = {
                side: this.selectSide,
                type: this.selectType
            };
            await (this.storageManager as any).clearHistory(filter);
            console.debug('[history] История очищена для', filter);
        } catch (error) {
            console.error('[history] Ошибка при очистке истории:', error);
        }
    }

    // Удалить конкретный элемент из истории
    async deleteFromHistory(historyId: string): Promise<boolean> {
        try {
            await (this.storageManager as any).deleteHistoryItem(historyId);
            console.debug('[history] Элемент удален из истории:', historyId);
            return true;
        } catch (error) {
            console.error('[history] Ошибка при удалении из истории:', error);
            return false;
        }
    }

    loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Устанавливаем CORS для избежания tainted canvas
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    async addLayoutToCanvas(layout: Layout) {
        const canvas = this.canvases.find(canvas => (canvas as any).side === layout.view);
        if (!canvas) {
            console.warn(`[canvas] canvas for ${layout.view} not found`);
            return;
        }

        const printConfig = this.productConfigs.find(product => product.type === this.selectType)!.printConfig.find(printConfig => printConfig.side === layout.view)!;

        const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
        const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
        const left = Math.round((this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth));
        const top = Math.round((this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight));

        const absoluteLeft = left + (width * layout.position.x);
        const absoluteTop = top + (height * layout.position.y);

        if (layout.type === 'image') {
            const imageLayout = layout as ImageLayout;

            const image = new fabric.Image(await this.loadImage(imageLayout.url));

            if (layout.size == 1 && image.width! > width) {
                layout.size = width / image.width!;
            }

            image.set({
                left: absoluteLeft,
                top: absoluteTop,
                name: layout.id,
                scaleX: layout.size,
                scaleY: layout.size * imageLayout.aspectRatio,
                angle: layout.angle,
            });
            canvas.add(image);
        } else if (layout.type === 'text') {
            const textLayout = layout as TextLayout;

            const text = new fabric.Text(textLayout.text, {
                fontFamily: textLayout.font.family,
                fontSize: textLayout.font.size,
            });
            text.set({
                top: absoluteTop,
                left: absoluteLeft,
                name: layout.id,
                scaleX: layout.size,
                scaleY: layout.size * textLayout.aspectRatio,
                angle: layout.angle,
            });

            canvas.add(text);
        }
    }

    updateLayouts() {
        const objects = this.activeCanvas?.getObjects();

        const objectsToRemove = this.activeCanvas?.getObjects()
            .filter(obj => obj.name !== "area:border" && obj.name !== "area:clip" && obj.name !== "guideline")
            .filter(obj => !this.layouts?.find(layout => layout.id === obj.name));

        const objectsToAdd = this.layouts.filter(layout => !objects?.find(obj => obj.name === layout.id));

        objectsToRemove?.forEach(obj => {
            this.activeCanvas?.remove(obj);
        });

        objectsToAdd.forEach(layout => {
            this.addLayoutToCanvas(layout);
        });
    }
}

const editor = new Editor({
    blocks: {
        editorBlockClass: '.editor-block',
        changeSideButtonClass: '.change-side-button',
        productListBlockClass: '.product-list',
        productItemClass: '.product-item',
        productItemImageClass: '.product-item-image',
        productItemTextClass: '.product-item-text',
        editorSumBlockClass: '.editor-sum',
        editorSettingsBlockClass: '.editor-settings',
        editorHistoryBlockClass: '.editor-history',
        editorClipImageBlockClass: '.editor-settings__clip-image',
        editorAddOrderButtonClass: '.editor-settings__add-order-button',
        editorProductNameClass: '.editor-settings__product-name',
        editorColorsListBlockClass: '.editor-settings__colors-list',
        editorColorItemBlockClass: '.editor-settings__color-item',
        editorSizesListBlockClass: '.editor-settings__sizes-list',
        editorSizeItemBlockClass: '.editor-settings__size-item',
        editorLayoutsListBlockClass: '.editor-layouts__layouts-list',
        editorLayoutItemBlockClass: '.editor-layouts__layout-item',
        editorLayoutItemBlockViewClass: '.editor-layouts__layout-item-view',
        editorLayoutItemBlockNameClass: '.editor-layouts__layout-item-name',
        editorLayoutItemBlockRemoveClass: '.editor-layouts__layout-item-remove',
        editorLayoutItemBlockEditClass: '.editor-layouts__layout-item-edit',
        editorUploadImageButtonClass: '.editor-upload-image-button',
        editorUploadViewBlockClass: '.editor-upload-view-block',
        editorUploadCancelButtonClass: '.editor-upload-cancel-button',
        editorQuantityFormBlockClass: '.editor-quantity-form',
        editorLoadWithAiButtonClass: '.editor-load-with-ai-button',
        editorLoadWithoutAiButtonClass: '.editor-load-without-ai-button',
    },
    formConfig: {
        formBlockClass: '.editor-form',
        formButtonClass: '.editor-form__button',
        formInputVariableName: 'prompt',
    },
    productConfigs: [
        {
            type: 'tshirt',
            productName: 'Футболка',
            sizes: ["S", "M", "L", "XL", "2XL"],
            printConfig: [
                {
                    side: 'front',
                    position: {
                        x: 0,
                        y: 0,
                    },
                    size: {
                        width: 250,
                        height: 350,
                    },
                },
                {
                    side: 'back',
                    position: {
                        x: 0,
                        y: 0,
                    },
                    size: {
                        width: 250,
                        height: 400,
                    },
                }
            ],
            mockups: [
                {
                    side: 'front',
                    url: 'https://res.cloudinary.com/dqt3gnimu/image/upload/v1753958151/white_mockup.webp',
                    color: { name: 'white', hex: '#ffffff' },
                },
                {
                    side: 'back',
                    url: 'https://res.cloudinary.com/dqt3gnimu/image/upload/v1755334227/white_mockup_back.webp',
                    color: { name: 'white', hex: '#ffffff' },
                },
                {
                    side: 'front',
                    url: 'https://res.cloudinary.com/dqt3gnimu/image/upload/v1753959137/black_mockup.webp',
                    color: { name: 'black', hex: '#000000' },
                },
                {
                    side: 'back',
                    url: 'https://res.cloudinary.com/dqt3gnimu/image/upload/v1754896964/black_mockup_back.webp',
                    color: { name: 'black', hex: '#000000' },
                }
            ],
        },
        {
            type: 'hoodie',
            productName: 'Толстовка',
            sizes: ["S", "M", "L", "XL", "2XL"],
            printConfig: [
                {
                    side: 'front',
                    position: {
                        x: 0,
                        y: -9,
                    },
                    size: {
                        width: 250,
                        height: 180,
                    },
                },
                {
                    side: 'back',
                    position: {
                        x: 0,
                        y: 0,
                    },
                    size: {
                        width: 250,
                        height: 300,
                    },
                }
            ],
            mockups: [
                {
                    side: 'front',
                    url: 'https://res.cloudinary.com/dqt3gnimu/image/upload/v1756978139/white_hoddie_mockup.webp',
                    color: { name: 'white', hex: '#ffffff' },
                },
                {
                    side: 'back',
                    url: 'https://res.cloudinary.com/dqt3gnimu/image/upload/v1756978139/white_hoddie_mockup_back.webp',
                    color: { name: 'white', hex: '#ffffff' },
                },
                {
                    side: 'front',
                    url: 'https://res.cloudinary.com/dqt3gnimu/image/upload/v1756978139/black_hoddie_mockup.webp',
                    color: { name: 'black', hex: '#000000' },
                },
                {
                    side: 'back',
                    url: 'https://res.cloudinary.com/dqt3gnimu/image/upload/v1756978139/black_hoddie_mockup_back.webp',
                    color: { name: 'black', hex: '#000000' },
                },
            ],
        }
    ],
});

async function generateImage(prompt: string, shirtColor: string, image?: string, withAi: boolean = false, layoutId?: Layout['id']) {
    // Получаем EditorStorageManager из глобального контекста (если он там есть)
    // или создаем временный экземпляр
    const tempStorageManager = new EditorStorageManager();
    const userId = await (tempStorageManager as any).getUserId();


    const formData = new FormData();
    formData.set('userId', userId);
    formData.set('prompt', prompt);
    formData.set('shirtColor', shirtColor);
    formData.set('placement', 'center');
    formData.set('printSize', "big");
    formData.set('transferType', '');
    formData.set('request_type', 'generate');

    if (image) {
        console.debug('[generate image]', image);

        const [header, data] = image.split(',');
        const type = header!.split(':')[1]!.split(';')[0]!;

        console.debug('[generate image] [type]', type);

        const byteCharacters = atob(data!);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);


        formData.set('request_type', 'image');
        formData.set('user_image', new Blob([byteArray], { type: "image/png" }));
        formData.set('transferType', withAi ? "ai" : "no-ai");
    }

    if (layoutId) {
        formData.set('request_type', 'edit');
        formData.set('layoutId', layoutId);
    }


    const response = await fetch("https://primary-production-654c.up.railway.app/webhook/request", {
        method: "POST",
        body: formData,
    });

    const data = await response.json();

    return data.image_url || data.image
}

type CardProduct = {
    image_url: string;
}

type CreateProductProps = {
    quantity: number;
    name: string;
    size: Size;
    color: Color;
    sides: { image_url: string }[];
}

function createProduct({ quantity, name, size, color, sides }: CreateProductProps) {
    const productId = (Math.random() + 1).toString(36).substring(7) + "_" + Date.now();

    const resultProduct = {
        id: productId,
        name,
        price: sides.length == 1 ? 1990 : 1990 + 500,
        quantity: quantity,
        img: sides[0]?.image_url,
        options: [
            { option: 'Артикул', variant: Math.floor(Math.random() * (999999999 - 999999 + 1) + 999999) },
            { option: 'Размер', variant: size },
            { option: 'Цвет', variant: color.name },
            { option: 'Принт', variant: sides.length == 1 ? 'Односторонний' : 'Двухсторонний' },
        ]
    };

    console.debug('[cart] add product', resultProduct);

    if (typeof (window as any).tcart__addProduct === 'function') {
        try {
            (window as any).tcart__addProduct(resultProduct);
        } catch (error) {
            console.error('[cart] Ошибка при добавлении продукта в корзину', error);
        }
    } else {
        console.warn('[cart] Корзина Tilda не загружена.');
    }
}

(window as any).editor = editor;

(window as any).addTestLayout = () => {
    editor.addLayout(new ImageLayout({
        view: 'front',
        url: 'https://static.tildacdn.com/tild3930-3533-4464-b830-623133666233/Group_20.svg',
        name: "test",
    }));
}

type PopupProps = {
    popupId: string;
    popupContentClass: string;
    timeoutSeconds?: number;
    closeButtonClass?: string;
    autoShow?: boolean;
    cookieName?: string;
    cookieExpiresDays?: number;
}

class Popup {
    popupWrapperBlock: HTMLElement;
    popupBlock: HTMLElement;
    popupContentBlock: HTMLElement;
    closeButton: HTMLElement;


    autoShow: boolean;
    autoShowTimeout: NodeJS.Timeout | null = null;
    timeoutSeconds: number;
    cookieName: string;
    cookieExpiresDays: number;

    constructor({
        popupId,
        popupContentClass,
        closeButtonClass,
        timeoutSeconds = 10,
        autoShow = true,
        cookieName = 'popup',
        cookieExpiresDays = 1,
    }: PopupProps) {

        this.popupBlock = document.getElementById(popupId)! as HTMLElement;
        this.popupContentBlock = document.querySelector(`.${popupContentClass}`)! as HTMLElement;

        if (!this.popupBlock) {
            console.error(`Popup block with id ${popupId} not found`);
        } else {
            this.initPopupBlock();
        }

        this.closeButton = document.querySelector(`.${closeButtonClass}`)! as HTMLElement;

        if (!this.closeButton) {
            console.error(`Close button with class ${closeButtonClass} not found`);
        } else {
            this.initCloseButton();
        }

        this.timeoutSeconds = timeoutSeconds;
        this.autoShow = autoShow;
        this.cookieName = cookieName;
        this.cookieExpiresDays = cookieExpiresDays;
        this.popupWrapperBlock = this.initPopupWrapper();

        if (this.popupBlock && this.closeButton) {
            this.initAutoShow();
        }
    }

    initPopupWrapper() {
        const popupWrapper = document.createElement('div');
        popupWrapper.style.display = 'block';
        popupWrapper.id = 'popup-wrapper';
        popupWrapper.style.position = 'fixed';
        popupWrapper.style.right = '0';
        popupWrapper.style.bottom = '0';
        popupWrapper.style.width = '100%';
        popupWrapper.style.zIndex = '9999';
        popupWrapper.style.pointerEvents = 'none';

        return popupWrapper;
    }

    initPopupBlock() {
        this.popupBlock.style.display = 'none';
    }

    initCloseButton() {
        this.closeButton.style.cursor = 'pointer';
        this.closeButton.addEventListener('click', () => {
            this.close();
        });
    }

    initAutoShow() {
        if (this.autoShow && !document.cookie.includes(`${this.cookieName}=true`)) {
            this.autoShowTimeout = setTimeout(() => {
                this.show();
            }, this.timeoutSeconds * 1000);
        } else {
            console.debug('Popup is not auto shown');
        }
    }

    show() {
        this.popupWrapperBlock.appendChild(this.popupBlock);

        this.popupContentBlock.style.pointerEvents = 'auto';
        this.popupBlock.style.display = 'block';

        document.body.appendChild(this.popupWrapperBlock);
    }

    close() {
        this.popupWrapperBlock.style.display = 'none';
        document.cookie = `${this.cookieName}=true; expires=${new Date(Date.now() + this.cookieExpiresDays * 24 * 60 * 60 * 1000).toUTCString()}; path=/;`;
    }
}


if (document.readyState !== 'loading') {
    creatPopup();
} else {
    document.addEventListener('DOMContentLoaded', creatPopup);
}

function creatPopup() {
    (window as any).popup = new Popup({
        timeoutSeconds: 2,
        popupId: 'rec1269819191',
        popupContentClass: 'popup-content-rec1269819191',
        closeButtonClass: 'popup-close-rec1269819191',
    });
}

(window as any).showPopup = () => {
    (window as any).popup.show();
}

(window as any).closePopup = () => {
    (window as any).popup.close();
}

type RuleCart = {
    variable: string;
    actions: {
        value: string;
        sum?: number;
    }[];
}

type CardFormProps = {
    cardBlockId: string;
    rules: RuleCart[];
}

class CardForm {
    cardBlock: HTMLElement;
    form: HTMLFormElement;

    fields: NodeListOf<Element>;
    rules: RuleCart[];

    actionsStates = new Map();

    constructor({ cardBlockId, rules }: CardFormProps) {

        this.cardBlock = document.querySelector(cardBlockId)! as HTMLElement;

        if (!this.cardBlock) {
            console.error(`Card block with id ${cardBlockId} not found`);
        }

        this.form = this.cardBlock.querySelector('form')! as HTMLFormElement;

        if (!this.form) {
            console.error(`Form block with id ${cardBlockId} not found`);
        } else {
            this.initForm();
        }

        this.rules = rules;
        this.fields = document.querySelectorAll('.t-input-group') as NodeListOf<Element>;

        this.initRules();
    }

    initForm() {
        console.debug('[form] [init]', this.form.elements);

        this.form.addEventListener('input', async (e) => {
            console.debug('[form] [input]', e);
            console.debug((e.target as HTMLInputElement)?.value, "|", (e.target as HTMLInputElement)?.name);

            if ((e.target as HTMLInputElement)?.name == "address") {
                if ((e.target as HTMLInputElement)?.value.length > 3) {
                    const data = await this.searchAddress((e.target as HTMLInputElement)?.value);
                    console.debug('[form] [input] address', data);
                }
            }
        })

        // this.form.onchange = (e) => {
        //     console.debug('[form] [change]', e);

        //     // if ((e.target as HTMLInputElement)?.classList.contains('t-checkbox')) {

        //     // }

        //     if ((e.target as HTMLInputElement)?.name == "delivery_type") {
        //         if ((e.target as HTMLInputElement)?.value == "Доставка до ПВЗ") {
        //             const selectBlock = this.form.querySelector(".t-input-group[data-field-name='delivery_type']") as HTMLElement

        //             const wigetBlock = document.createElement("div");
        //             wigetBlock.id = "delivery-widget";

        //             // wigetBlock.style.display = "block";
        //             // wigetBlock.style.width = "100%";
        //             // wigetBlock.style.aspectRatio = "1/1";
        //             // wigetBlock.style.backgroundColor = "red";

        //             (selectBlock.parentElement as HTMLElement).insertBefore(wigetBlock, selectBlock.nextSibling);
        //         } else {
        //             const wigetBlock = this.form.querySelector("#delivery-widget") as HTMLElement;
        //             if (wigetBlock) {
        //                 wigetBlock.remove();
        //             }
        //         }
        //     }

        //     console.debug((e.target as HTMLInputElement)?.value, "|", (e.target as HTMLInputElement)?.name);
        // }
    }

    async searchAddress(address: string) {
        const response = await fetch("https://b2b.taxi.tst.yandex.net/api/b2b/platform/location/detect", {
            method: "POST",
            body: JSON.stringify({
                location: address,
            }),
        });

        const data = await response.json();

        return data;
    }


    initRules() {

        // this.rules.forEach(rule => {
        //     this.fields.forEach(field => {
        //         const fieldBlock = field.querySelector(`[name="${rule.variable}"]`) as HTMLInputElement;

        //         if (!fieldBlock) {
        //             return;
        //         }

        //         if (rule.type === "checkbox") {
        //             for (const action of rule.actions) {
        //                 this.actionsStates.set(action.value, {
        //                     value: fieldBlock.value.split(";").some((e: string) => e.trim().includes(action.value)),
        //                     fieldBlock: fieldBlock,
        //                     action: action,
        //                 });
        //             }
        //         }

        //         fieldBlock.addEventListener('change', (e) => {
        //             const oldState = new Map(this.actionsStates);

        //             if (rule.type === "checkbox") {
        //                 for (const action of rule.actions) {
        //                     this.actionsStates.set(action.value, {
        //                         value: fieldBlock.value.split(";").some((e: string) => e.trim().includes(action.value)),
        //                         fieldBlock: fieldBlock,
        //                         action: action,
        //                     });
        //                 }
        //             }

        //             this.applyActions(oldState);
        //         });
        //     })
        // })

        this.applyActions();
    }

    async applyActions(oldState = new Map()) {
        await new Promise(resolve => setInterval(() => {
            if ([...document.querySelectorAll(`.t706__product-title`)].length > 0) {
                resolve(void 0);
            }
        }, 200));

        for (const [key, state] of this.actionsStates) {
            if (state.value !== oldState.get(key)?.value) {
                if (state.value) {

                    (window as any).tcart__addProduct({
                        id: 'urgently_' + Date.now(),
                        name: state.action.value,
                        price: state.action.sum,
                        quantity: 1,
                    })

                    const changeProduct = await new Promise<HTMLElement | undefined>(resolve => setTimeout(() => {
                        const changeProduct = ([...document.querySelectorAll(`.t706__product-title`)] as HTMLElement[])
                            .find((e: HTMLElement) => e.innerText === state.action.value)?.parentElement;

                        if (changeProduct) {
                            resolve(changeProduct);
                        }
                    }, 100))

                    if (changeProduct) {
                        const changeProductButton = changeProduct.querySelector(`.t706__product-plusminus`) as HTMLElement;
                        changeProductButton.style.display = 'none';
                    }
                } else {
                    const delProduct = ([...document.querySelectorAll(`.t706__product-title`)] as HTMLElement[])
                        .find((e: HTMLElement) => e.innerText === state.action.value)?.parentElement;

                    if (delProduct) {
                        const delProductButton = delProduct.querySelector(`.t706__product-del`) as HTMLElement;
                        delProductButton.click();
                    }
                }
            }
        }
    }
}

window.onload = () => {
    new CardForm({
        cardBlockId: "#rec1334316211",
        rules: [
            {
                variable: "additional_services",
                actions: [
                    {
                        value: "Срочный заказ, печать до 2 дней (+500р)",
                        sum: 500
                    }
                ]
            },
            {
                variable: "delivery",
                actions: [
                    {
                        value: "Доставка до ПВЗ",
                    },
                    {
                        value: "Доставка курьером"
                    }
                ]
            }

        ]
    });
}