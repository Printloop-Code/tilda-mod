(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["editor"] = factory();
	else
		root["editor"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/components/Editor.ts":
/*!**********************************!*\
  !*** ./src/components/Editor.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EditorEventType: () => (/* binding */ EditorEventType),
/* harmony export */   "default": () => (/* binding */ Editor)
/* harmony export */ });
/* harmony import */ var _managers_EditorStorageManager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../managers/EditorStorageManager */ "./src/managers/EditorStorageManager.ts");
/* harmony import */ var _models_Layout__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../models/Layout */ "./src/models/Layout.ts");
/* harmony import */ var _utils_tildaUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/tildaUtils */ "./src/utils/tildaUtils.ts");
/* harmony import */ var _utils_TypedEventEmitter__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/TypedEventEmitter */ "./src/utils/TypedEventEmitter.ts");
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/api */ "./src/utils/api.ts");
/* harmony import */ var _utils_canvasUtils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/canvasUtils */ "./src/utils/canvasUtils.ts");






const logIssue = (key, payload) => {
    try {
        if (typeof window.OpenReplay?.handleError === 'function') {
            window.OpenReplay.handleError(new Error(key), payload);
            console.debug('OpenReplay.handleError', key);
        }
    }
    catch (e) {
        console.warn('[OpenReplay] Failed to log issue:', e);
    }
};
const CONSTANTS = {
    STATE_EXPIRATION_DAYS: 30,
    CANVAS_AREA_HEIGHT: 600,
    LOADING_INTERVAL_MS: 100,
};
var EditorEventType;
(function (EditorEventType) {
    EditorEventType["MOCKUP_LOADING"] = "mockup-loading";
    EditorEventType["MOCKUP_UPDATED"] = "mockup-updated";
    EditorEventType["LOADING_TIME_UPDATED"] = "loading-time-updated";
    EditorEventType["STATE_CHANGED"] = "state-changed";
    EditorEventType["LAYOUT_ADDED"] = "layout-added";
    EditorEventType["LAYOUT_REMOVED"] = "layout-removed";
    EditorEventType["LAYOUT_UPDATED"] = "layout-updated";
})(EditorEventType || (EditorEventType = {}));
class Editor {
    get selectType() { return this._selectType; }
    get selectColor() { return this._selectColor; }
    get selectSide() { return this._selectSide; }
    get selectSize() { return this._selectSize; }
    get selectLayout() { return this._selectLayout; }
    constructor({ blocks, productConfigs, formConfig, apiConfig, options }) {
        this.quantityFormBlock = null;
        this.formBlock = null;
        this.formInputVariableName = null;
        this.formButton = null;
        this._selectLayout = null;
        this.layouts = [];
        this.canvases = [];
        this.layersCanvases = [];
        this.activeCanvas = null;
        this.events = new _utils_TypedEventEmitter__WEBPACK_IMPORTED_MODULE_3__.TypedEventEmitter();
        this.layersHistory = [];
        this.currentHistoryIndex = -1;
        this.isRestoringFromHistory = false;
        this.isLoading = true;
        this.isAddingToCart = false;
        this.isAddedToCart = false;
        this.isGenerating = false;
        this.loadingTime = 0;
        this.loadingInterval = null;
        this.colorBlocks = [];
        this.sizeBlocks = [];
        this.productBlocks = [];
        this.loadedUserImage = null;
        this.editorLoadWithAi = false;
        this.editorRemoveBackground = false;
        this.imageCache = new Map();
        this.loadingElementsCache = {};
        this.productCache = new Map();
        this.mockupCache = new Map();
        if (!productConfigs || productConfigs.length === 0) {
            logIssue('editor_init_error', {
                error: 'product_configs_missing',
                hasProductConfigs: !!productConfigs,
                productsCount: productConfigs?.length || 0
            });
            throw new Error('[Editor] Не предоставлены конфигурации продуктов');
        }
        this.storageManager = new _managers_EditorStorageManager__WEBPACK_IMPORTED_MODULE_0__.EditorStorageManager();
        this.productConfigs = productConfigs;
        this.apiConfig = apiConfig;
        this.options = options;
        this.editorBlock = this.getRequiredElement(blocks.editorBlockClass);
        this.changeSideButton = this.getRequiredElement(blocks.changeSideButtonClass);
        this.editorHistoryUndoBlock = this.getRequiredElement(blocks.editorHistoryUndoBlockClass);
        this.editorHistoryRedoBlock = this.getRequiredElement(blocks.editorHistoryRedoBlockClass);
        this.quantityFormBlock = document.querySelector(blocks.editorQuantityFormBlockClass);
        const productListBlock = document.querySelector(blocks.productListBlockClass);
        if (productListBlock)
            this.productListBlock = productListBlock;
        const productItemBlock = document.querySelector(blocks.productItemClass);
        if (productItemBlock)
            this.productItemBlock = productItemBlock;
        const editorColorsListBlock = document.querySelector(blocks.editorColorsListBlockClass);
        if (editorColorsListBlock)
            this.editorColorsListBlock = editorColorsListBlock;
        const editorColorItemBlock = document.querySelector(blocks.editorColorItemBlockClass);
        if (editorColorItemBlock)
            this.editorColorItemBlock = editorColorItemBlock;
        const editorSizesListBlock = document.querySelector(blocks.editorSizesListBlockClass);
        if (editorSizesListBlock)
            this.editorSizesListBlock = editorSizesListBlock;
        const editorSizeItemBlock = document.querySelector(blocks.editorSizeItemBlockClass);
        if (editorSizeItemBlock)
            this.editorSizeItemBlock = editorSizeItemBlock;
        const editorLayoutsListBlock = document.querySelector(blocks.editorLayoutsListBlockClass);
        if (editorLayoutsListBlock)
            this.editorLayoutsListBlock = editorLayoutsListBlock;
        const editorLayoutItemBlock = document.querySelector(blocks.editorLayoutItemBlockClass);
        if (editorLayoutItemBlock)
            this.editorLayoutItemBlock = editorLayoutItemBlock;
        const editorUploadImageButton = document.querySelector(blocks.editorUploadImageButtonClass);
        if (editorUploadImageButton)
            this.editorUploadImageButton = editorUploadImageButton;
        const editorUploadViewBlock = document.querySelector(blocks.editorUploadViewBlockClass);
        if (editorUploadViewBlock)
            this.editorUploadViewBlock = editorUploadViewBlock;
        const editorUploadCancelButton = document.querySelector(blocks.editorUploadCancelButtonClass);
        if (editorUploadCancelButton)
            this.editorUploadCancelButton = editorUploadCancelButton;
        const editorLoadWithAiButton = document.querySelector(blocks.editorLoadWithAiButtonClass);
        if (editorLoadWithAiButton)
            this.editorLoadWithAiButton = editorLoadWithAiButton;
        const editorLoadWithoutAiButton = document.querySelector(blocks.editorLoadWithoutAiButtonClass);
        if (editorLoadWithoutAiButton)
            this.editorLoadWithoutAiButton = editorLoadWithoutAiButton;
        const editorRemoveBackgroundButton = document.querySelector(blocks.editorRemoveBackgroundButtonClass);
        if (editorRemoveBackgroundButton)
            this.editorRemoveBackgroundButton = editorRemoveBackgroundButton;
        const editorAddOrderButton = document.querySelector(blocks.editorAddOrderButtonClass);
        if (editorAddOrderButton)
            this.editorAddOrderButton = editorAddOrderButton;
        const editorSumBlock = document.querySelector(blocks.editorSumBlockClass);
        if (editorSumBlock)
            this.editorSumBlock = editorSumBlock;
        const editorProductName = document.querySelector(blocks.editorProductNameClass);
        if (editorProductName)
            this.editorProductName = editorProductName;
        this.editorLayoutItemBlockViewClass = blocks.editorLayoutItemBlockViewClass;
        this.editorLayoutItemBlockNameClass = blocks.editorLayoutItemBlockNameClass;
        this.editorLayoutItemBlockRemoveClass = blocks.editorLayoutItemBlockRemoveClass;
        this.editorLayoutItemBlockEditClass = blocks.editorLayoutItemBlockEditClass;
        if (formConfig) {
            this.formBlock = document.querySelector(formConfig.formBlockClass);
            this.formInputVariableName = formConfig.formInputVariableName;
            this.formButton = document.querySelector(formConfig.formButtonClass);
        }
        const defaultProduct = productConfigs[0];
        if (!defaultProduct) {
            logIssue('editor_init_error', {
                error: 'default_product_not_found',
                productsCount: productConfigs.length
            });
            throw new Error('[Editor] Не найден дефолтный продукт');
        }
        const defaultMockup = defaultProduct.mockups[0];
        if (!defaultMockup) {
            logIssue('editor_init_error', {
                error: 'default_mockup_not_found',
                productType: defaultProduct.type,
                mockupsCount: defaultProduct.mockups?.length || 0
            });
            throw new Error('[Editor] Не найден дефолтный mockup');
        }
        if (!defaultMockup.color || !defaultMockup.color.name) {
            logIssue('editor_init_error', {
                error: 'default_color_not_found',
                productType: defaultProduct.type,
                mockup: defaultMockup
            });
            throw new Error('[Editor] Цвет не определен в дефолтном mockup');
        }
        this._selectColor = defaultMockup.color;
        this._selectSide = defaultMockup.side;
        this._selectType = defaultProduct.type;
        this._selectSize = defaultProduct.sizes?.[0] || 'M';
        this.editorBlock.style.position = 'relative';
        this.createBackgroundBlock();
        this.mockupBlock = this.createMockupBlock();
        this.canvasesContainer = this.createCanvasesContainer();
        this.editorLoadingBlock = this.createEditorLoadingBlock();
        this.initEvents();
        this.initKeyboardShortcuts();
        this.initLoadingEvents();
        this.initUIComponents();
        this.initializeEditor();
        window.getLayouts = () => {
            return this.layouts.map(layout => ({ ...layout, url: undefined }));
        };
        window.loadLayouts = (layouts) => {
            this.layouts = layouts.map(layout => _models_Layout__WEBPACK_IMPORTED_MODULE_1__.Layout.fromJSON(layout));
            this.updateLayouts();
            this.showLayoutList();
        };
        window.exportPrint = async () => {
            const exportedArt = await this.exportArt(false, 4096);
            for (const side of Object.keys(exportedArt)) {
                const downloadLink = document.createElement('a');
                document.body.appendChild(downloadLink);
                downloadLink.href = exportedArt[side];
                downloadLink.target = '_self';
                downloadLink.download = `${side}.png`;
                downloadLink.click();
            }
            return exportedArt;
        };
    }
    initUIComponents() {
        if (this.changeSideButton) {
            this.changeSideButton.style.cursor = 'pointer';
            this.changeSideButton.onclick = () => this.changeSide();
        }
        if (this.editorHistoryUndoBlock) {
            this.initHistoryUndoBlock();
        }
        if (this.editorHistoryRedoBlock) {
            this.initHistoryRedoBlock();
        }
        if (this.productListBlock && this.productItemBlock) {
            this.initProductList();
        }
        if (this.editorAddOrderButton) {
            this.initAddOrderButton();
        }
        if (this.editorUploadImageButton) {
            this.initUploadImageButton();
        }
        if (this.editorLoadWithAiButton && this.editorLoadWithoutAiButton && this.editorRemoveBackgroundButton) {
            this.initAiButtons();
        }
        if (this.formBlock && this.formButton) {
            this.initForm();
        }
        if (this.quantityFormBlock) {
            setTimeout(() => this.initFixQuantityForm(), 500);
        }
        if (this.editorLayoutsListBlock) {
            this.showLayoutList();
        }
        if (this.editorUploadCancelButton) {
            this.editorUploadCancelButton.style.cursor = 'pointer';
            this.editorUploadCancelButton.onclick = () => {
                console.debug('[upload image button] cancel button clicked');
                this.resetUserUploadImage();
            };
        }
    }
    getRequiredElement(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            logIssue('editor_required_element_not_found', {
                selector: selector
            });
            throw new Error(`[Editor] Не найден обязательный элемент: ${selector}`);
        }
        return element;
    }
    async initializeEditor() {
        try {
            await this.storageManager.waitForReady();
            await this.loadState();
            await this.preloadAllMockups();
            console.debug('[editor] Инициализация завершена');
        }
        catch (error) {
            console.error('[editor] Ошибка инициализации:', error);
            logIssue('editor_initialization_error', {
                error: error instanceof Error ? error.message : String(error),
                hasStorage: !!this.storageManager
            });
            this.initializeWithDefaults();
        }
    }
    async initializeWithDefaults() {
        console.debug('[editor] Инициализация с дефолтными значениями');
        try {
            await this.updateMockup();
        }
        catch (err) {
            console.error('[editor] Ошибка загрузки mockup по умолчанию:', err);
            logIssue('editor_default_mockup_load_error', {
                error: err instanceof Error ? err.message : String(err),
                selectedType: this._selectType,
                selectedColor: this._selectColor,
                selectedSide: this._selectSide
            });
        }
    }
    initEvents() {
        if (!this.options?.disableBeforeUnloadWarning) {
            window.onbeforeunload = (e) => {
                if (this.layouts.length > 0 && !this.isAddedToCart && this.layersHistory.length > 0) {
                    const message = 'Дизайн редактора может быть потерян. Вы уверены, что хотите покинуть страницу?';
                    e.preventDefault();
                    e.returnValue = message;
                    return message;
                }
                return undefined;
            };
        }
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleWindowResize();
            }, 150);
        });
        this.events.on(EditorEventType.MOCKUP_UPDATED, (dataURL) => {
            this.mockupBlock.src = dataURL;
        });
    }
    initLoadingEvents() {
        this.loadingElementsCache.loadingText = this.editorLoadingBlock.querySelector('#loading-text');
        this.loadingElementsCache.spinner = this.editorLoadingBlock.querySelector('#spinner');
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
                }
                else {
                    if (loadingText) {
                        loadingText.style.display = "none";
                        loadingText.innerText = "";
                    }
                    if (spinner) {
                        spinner.style.display = "none";
                    }
                    this.editorLoadingBlock.style.backgroundColor = "rgba(255, 255, 255, 0)";
                }
            }
            else {
                if (loadingText) {
                    loadingText.style.display = "none";
                    loadingText.innerText = "";
                }
            }
        });
        this.events.on(EditorEventType.MOCKUP_LOADING, (isLoading) => {
            const { loadingText, spinner } = this.loadingElementsCache;
            if (isLoading) {
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
            }
            else {
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
    emit(type, detail) {
        this.events.emit(type, detail);
    }
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            const activeElement = document.activeElement;
            const isInputField = activeElement && (activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.contentEditable === 'true' ||
                activeElement.isContentEditable);
            if (isInputField)
                return;
            if (event.ctrlKey && event.code === 'KeyZ' && !event.shiftKey) {
                event.preventDefault();
                this.undo();
                return;
            }
            if ((event.ctrlKey && event.shiftKey && event.code === 'KeyZ') ||
                (event.ctrlKey && event.code === 'KeyY' && !event.shiftKey)) {
                event.preventDefault();
                this.redo();
                return;
            }
        });
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
        spinner.style.display = "none";
        editorLoadingBlock.appendChild(spinner);
        this.editorBlock.appendChild(editorLoadingBlock);
        return editorLoadingBlock;
    }
    async updateMockup() {
        console.debug(`[mockup] update for ${this._selectType} ${this._selectSide} ${this._selectColor.name}`);
        this.emit(EditorEventType.MOCKUP_LOADING, true);
        try {
            const mockupImageUrl = this.findMockupUrl();
            if (!mockupImageUrl) {
                logIssue('mockup_not_found', {
                    productType: this._selectType,
                    color: this._selectColor.name,
                    side: this._selectSide
                });
                throw new Error('[mockup] Не найден mockup для текущих параметров');
            }
            const dataURL = await this.loadAndConvertImage(mockupImageUrl);
            this.emit(EditorEventType.MOCKUP_UPDATED, dataURL);
            this.mockupBlock.src = dataURL;
            console.debug('[mockup] Mockup успешно обновлен');
        }
        catch (error) {
            console.error('[mockup] Ошибка обновления mockup:', error);
            logIssue('mockup_update_error', {
                error: error instanceof Error ? error.message : String(error),
                productType: this._selectType,
                color: this._selectColor.name,
                side: this._selectSide
            });
            throw error;
        }
        finally {
            this.emit(EditorEventType.MOCKUP_LOADING, false);
        }
    }
    findMockupUrl() {
        const cacheKey = `${this._selectType}-${this._selectSide}-${this._selectColor.name}`;
        if (this.mockupCache.has(cacheKey)) {
            return this.mockupCache.get(cacheKey);
        }
        const product = this.getProductByType(this._selectType);
        if (!product) {
            this.mockupCache.set(cacheKey, null);
            return null;
        }
        const mockup = product.mockups.find(m => m.side === this._selectSide && m.color.name === this._selectColor.name);
        const url = mockup?.url || null;
        this.mockupCache.set(cacheKey, url);
        return url;
    }
    getProductByType(type) {
        if (!this.productCache.has(type)) {
            const product = this.productConfigs.find(p => p.type === type);
            if (product) {
                this.productCache.set(type, product);
            }
        }
        return this.productCache.get(type);
    }
    clearMockupCache() {
        this.mockupCache.clear();
    }
    async loadAndConvertImage(imageUrl) {
        if (this.imageCache.has(imageUrl)) {
            console.debug('[cache] Изображение загружено из кэша:', imageUrl);
            return this.imageCache.get(imageUrl);
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
                    this.imageCache.set(imageUrl, dataURL);
                    console.debug('[cache] Изображение сохранено в кэш:', imageUrl);
                    resolve(dataURL);
                }
                catch (error) {
                    reject(error);
                }
            };
            image.onerror = () => {
                reject(new Error(`Ошибка загрузки изображения: ${imageUrl}`));
            };
            image.src = imageUrl;
        });
    }
    async saveState() {
        console.debug('[state] Сохранение состояния редактора');
        try {
            const editorState = {
                date: new Date().toISOString(),
                type: this._selectType,
                color: this._selectColor.name,
                side: this._selectSide,
                size: this._selectSize
            };
            console.debug(`[state] Сохраняем: type=${editorState.type}, color=${editorState.color}, side=${editorState.side}, size=${editorState.size}`);
            await this.storageManager.saveEditorState(editorState);
            console.debug('[state] Состояние успешно сохранено');
        }
        catch (error) {
            console.error('[state] Ошибка сохранения состояния:', error);
            logIssue('editor_state_save_error', {
                error: error instanceof Error ? error.message : String(error),
                state: {
                    type: this._selectType,
                    color: this._selectColor.name,
                    side: this._selectSide,
                    size: this._selectSize
                }
            });
        }
    }
    async saveLayouts() {
        console.debug('[layers] Сохранение слоёв');
        try {
            await this.storageManager.saveLayers(this.layouts);
            console.debug('[layers] Слои успешно сохранены');
        }
        catch (error) {
            console.error('[layers] Ошибка сохранения слоёв:', error);
            logIssue('editor_layers_save_error', {
                error: error instanceof Error ? error.message : String(error),
                layersCount: this.layouts.length
            });
        }
    }
    async loadLayouts() {
        console.debug('[layers] Загрузка слоёв');
        try {
            const savedLayouts = await this.storageManager.loadLayers();
            if (savedLayouts && Array.isArray(savedLayouts)) {
                this.layouts = savedLayouts.map((layoutData) => new _models_Layout__WEBPACK_IMPORTED_MODULE_1__.Layout(layoutData));
                console.debug(`[layers] Загружено ${this.layouts.length} слоёв`);
            }
            else {
                this.layouts = [];
                console.debug('[layers] Нет сохранённых слоёв');
            }
            this.saveLayersToHistory();
        }
        catch (error) {
            console.error('[layers] Ошибка загрузки слоёв:', error);
            logIssue('editor_layers_load_error', {
                error: error instanceof Error ? error.message : String(error)
            });
            this.layouts = [];
            this.saveLayersToHistory();
        }
    }
    async loadState() {
        console.debug('[state] Загрузка состояния редактора');
        try {
            const editorState = await this.storageManager.loadEditorState();
            if (!editorState) {
                console.debug('[state] Сохраненное состояние не найдено');
                await this.updateMockup();
                this.loadProduct();
                this.initColorsList();
                this.initSizesList();
                this.showLayoutList();
                this.updateLayouts();
                this.updateSum();
                return;
            }
            if (this.isStateExpired(editorState.date)) {
                console.warn('[state] Состояние устарело, очищаем');
                await this.storageManager.clearEditorState();
                await this.updateMockup();
                this.loadProduct();
                this.initColorsList();
                this.initSizesList();
                this.showLayoutList();
                this.updateLayouts();
                this.updateSum();
                return;
            }
            const applied = await this.applyState(editorState);
            if (applied) {
                console.debug('[state] Состояние успешно загружено');
                await this.updateMockup();
                this.loadProduct();
                if (this.productBlocks.length > 0) {
                    this.productBlocks.forEach(block => {
                        block.style.background = 'rgb(222 222 222)';
                    });
                    const activeBlock = this.productBlocks.find(block => block.classList.contains('editor-settings__product-block__' + this._selectType));
                    if (activeBlock) {
                        activeBlock.style.background = '';
                    }
                }
                await this.loadLayouts();
                this.initColorsList();
                this.initSizesList();
                this.showLayoutList();
                this.updateLayouts();
                await this.saveLayouts();
                this.updateSum();
            }
            else {
                console.warn('[state] Не удалось применить сохраненное состояние');
                await this.updateMockup();
                this.loadProduct();
                this.initColorsList();
                this.initSizesList();
                this.showLayoutList();
                this.updateLayouts();
                this.updateSum();
            }
        }
        catch (error) {
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
    isStateExpired(dateString) {
        const stateDate = new Date(dateString);
        const expirationDate = Date.now() - (CONSTANTS.STATE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
        return stateDate.getTime() < expirationDate;
    }
    async applyState(editorState) {
        try {
            if (!editorState.type || !editorState.color || !editorState.side) {
                console.warn('[state] Некорректное состояние: отсутствуют обязательные поля');
                return false;
            }
            console.debug(`[state] Восстановление состояния: type=${editorState.type}, color=${editorState.color}, side=${editorState.side}, size=${editorState.size}`);
            const product = this.productConfigs.find(p => p.type === editorState.type);
            if (!product) {
                console.warn(`[state] Продукт типа ${editorState.type} не найден`);
                return false;
            }
            const mockup = product.mockups.find(m => m.color.name === editorState.color);
            if (!mockup) {
                console.warn(`[state] Mockup с цветом ${editorState.color} не найден для продукта ${editorState.type}`);
                return false;
            }
            this._selectType = editorState.type;
            this._selectColor = mockup.color;
            this._selectSide = editorState.side;
            this._selectSize = editorState.size || this._selectSize;
            console.debug(`[state] Состояние применено: type=${this._selectType}, color=${this._selectColor.name}, side=${this._selectSide}, size=${this._selectSize}`);
            return true;
        }
        catch (error) {
            console.error('[state] Ошибка применения состояния:', error);
            return false;
        }
    }
    setType(type) {
        if (this._selectType !== type) {
            this._selectType = type;
            this.clearMockupCache();
            this.emit(EditorEventType.STATE_CHANGED, undefined);
            this.saveState().catch(err => console.error('[state] Ошибка сохранения:', err));
        }
    }
    setColor(color) {
        if (!color || !color.name) {
            console.error('[Editor] Попытка установить некорректный цвет', color);
            return;
        }
        if (this._selectColor !== color) {
            this._selectColor = color;
            this.clearMockupCache();
            this.emit(EditorEventType.STATE_CHANGED, undefined);
            this.saveState().catch(err => console.error('[state] Ошибка сохранения:', err));
        }
    }
    setSide(side) {
        if (this._selectSide !== side) {
            this._selectSide = side;
            this.clearMockupCache();
            this.emit(EditorEventType.STATE_CHANGED, undefined);
            this.saveState().catch(err => console.error('[state] Ошибка сохранения:', err));
        }
    }
    setSize(size) {
        if (this._selectSize !== size) {
            this._selectSize = size;
            this.emit(EditorEventType.STATE_CHANGED, undefined);
            this.saveState().catch(err => console.error('[state] Ошибка сохранения:', err));
        }
    }
    addLayout(layout) {
        if (this.isRestoringFromHistory) {
            this.layouts.push(layout);
        }
        else {
            this.layouts.push(layout);
            this.saveLayersToHistory();
        }
        this.emit(EditorEventType.LAYOUT_ADDED, layout);
        this.updateLayouts();
        this.showLayoutList();
        this.saveLayouts().catch(err => console.error('[layers] Ошибка сохранения слоёв:', err));
    }
    removeLayout(layoutId) {
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
    updateLayout(layoutId, updates) {
        const layout = this.layouts.find(l => l.id === layoutId);
        if (layout) {
            Object.assign(layout, updates);
            if (!this.isRestoringFromHistory) {
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
    getLayout(layoutId) {
        return this.layouts.find(l => l.id === layoutId);
    }
    getLayouts() {
        return this.layouts;
    }
    initHistoryUndoBlock() {
        console.debug('[history block] init undo');
        this.editorHistoryUndoBlock.style.cursor = 'pointer';
        this.editorHistoryUndoBlock.onclick = async () => {
            console.debug('[history undo block] clicked');
            await this.undo();
        };
        this.updateHistoryButtonsState();
    }
    initHistoryRedoBlock() {
        console.debug('[history redo block] init redo');
        this.editorHistoryRedoBlock.style.cursor = 'pointer';
        this.editorHistoryRedoBlock.onclick = async () => {
            console.debug('[history redo block] clicked');
            await this.redo();
        };
        this.updateHistoryButtonsState();
    }
    initProductList() {
        if (!this.productListBlock || !this.productItemBlock)
            return;
        console.debug('[ProductList] init product list');
        this.productItemBlock.style.display = 'none';
        this.productConfigs.forEach(product => {
            const productItem = this.productItemBlock.cloneNode(true);
            productItem.style.display = 'table';
            const productImageWrapper = productItem.querySelector('.product-item-image');
            if (productImageWrapper) {
                const productImage = (0,_utils_tildaUtils__WEBPACK_IMPORTED_MODULE_2__.getLastChild)(productImageWrapper);
                if (productImage) {
                    productImage.style.backgroundImage = `url(${product.mockups[0]?.url})`;
                    productImage.style.backgroundSize = 'cover';
                    productImage.style.backgroundPosition = 'center';
                    productImage.style.backgroundRepeat = 'no-repeat';
                }
            }
            const productTextWrapper = productItem.querySelector('.product-item-text');
            if (productTextWrapper) {
                const productText = (0,_utils_tildaUtils__WEBPACK_IMPORTED_MODULE_2__.getLastChild)(productTextWrapper);
                if (productText) {
                    productText.innerText = product.productName;
                }
            }
            const productBlock = productItem.firstElementChild;
            productBlock.classList.add('editor-settings__product-block__' + product.type);
            productBlock.style.cursor = 'pointer';
            productBlock.style.borderColor = 'transparent';
            productItem.onclick = () => this.changeProduct(product.type);
            this.productBlocks.push(productBlock);
            this.productListBlock.firstElementChild.appendChild(productItem);
        });
        if (this.productBlocks.length > 0) {
            this.productBlocks.forEach(block => {
                block.style.background = 'rgb(222 222 222)';
            });
            const activeBlock = this.productBlocks.find(block => block.classList.contains('editor-settings__product-block__' + this._selectType));
            if (activeBlock) {
                activeBlock.style.background = '';
            }
        }
    }
    initColorsList() {
        if (!this.editorColorsListBlock || !this.editorColorItemBlock)
            return;
        console.debug(`[settings] init colors for ${this._selectType}`);
        const product = this.getProductByType(this._selectType);
        if (!product)
            return;
        this.editorColorItemBlock.style.display = 'none';
        const colorsContainer = this.editorColorsListBlock.firstElementChild;
        colorsContainer.innerHTML = '';
        this.colorBlocks = [];
        const colors = product.mockups
            .filter(mockup => mockup.side === this._selectSide)
            .map(mockup => mockup.color);
        colors.forEach(color => {
            const colorItem = this.editorColorItemBlock.cloneNode(true);
            colorItem.style.display = 'table';
            const colorBlock = colorItem.firstElementChild;
            colorBlock.classList.add('editor-settings__color-block__' + color.name);
            colorBlock.style.cursor = 'pointer';
            colorBlock.style.backgroundColor = color.hex;
            colorBlock.style.borderColor = 'transparent';
            colorItem.onclick = () => this.changeColor(color.name);
            this.colorBlocks.push(colorBlock);
            this.editorColorsListBlock.firstElementChild.appendChild(colorItem);
        });
        if (this.colorBlocks.length > 0) {
            this.colorBlocks.forEach(block => {
                block.style.borderColor = '#f3f3f3';
            });
            const activeBlock = this.colorBlocks.find(block => block.classList.contains('editor-settings__color-block__' + this._selectColor.name));
            if (activeBlock) {
                activeBlock.style.borderColor = '';
            }
        }
    }
    initSizesList() {
        if (!this.editorSizesListBlock || !this.editorSizeItemBlock)
            return;
        console.debug(`[settings] init sizes for ${this._selectType}`);
        const product = this.getProductByType(this._selectType);
        if (!product || !product.sizes)
            return;
        this.editorSizeItemBlock.style.display = 'none';
        const sizesContainer = this.editorSizesListBlock.firstElementChild;
        sizesContainer.innerHTML = '';
        this.sizeBlocks = [];
        product.sizes.forEach(size => {
            const sizeItem = this.editorSizeItemBlock.cloneNode(true);
            sizeItem.style.display = 'table';
            sizeItem.style.cursor = 'pointer';
            sizeItem.style.userSelect = 'none';
            sizeItem.classList.add('editor-settings__size-block__' + size);
            const borderBlock = sizeItem.firstElementChild;
            borderBlock.style.borderColor = '#f3f3f3';
            const sizeText = (0,_utils_tildaUtils__WEBPACK_IMPORTED_MODULE_2__.getLastChild)(sizeItem);
            if (sizeText) {
                sizeText.innerText = size;
            }
            sizeItem.onclick = () => this.changeSize(size);
            this.sizeBlocks.push(sizeItem);
            this.editorSizesListBlock.firstElementChild.appendChild(sizeItem);
        });
        if (this.sizeBlocks.length > 0) {
            this.sizeBlocks.forEach(block => {
                const borderBlock = block.firstElementChild;
                if (borderBlock) {
                    borderBlock.style.borderColor = '#f3f3f3';
                }
            });
            const activeBlock = this.sizeBlocks.find(block => block.classList.contains('editor-settings__size-block__' + this._selectSize));
            if (activeBlock) {
                const borderBlock = activeBlock.firstElementChild;
                if (borderBlock) {
                    borderBlock.style.borderColor = '';
                }
            }
        }
    }
    showLayoutList() {
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
        this.editorLayoutsListBlock.firstElementChild.innerHTML = '';
        console.debug(`[settings] [layouts] layouts list block children: ${this.editorLayoutsListBlock.firstElementChild.children.length}`);
        this.layouts.forEach(layout => {
            const layoutItem = this.editorLayoutItemBlock.cloneNode(true);
            layoutItem.style.display = 'table';
            const isEditing = this._selectLayout === layout.id;
            const previewBlock = this.editorLayoutItemBlockViewClass
                ? layoutItem.querySelector(this.editorLayoutItemBlockViewClass)
                : null;
            const nameBlock = this.editorLayoutItemBlockNameClass
                ? layoutItem.querySelector(this.editorLayoutItemBlockNameClass)
                : null;
            const removeBlock = this.editorLayoutItemBlockRemoveClass
                ? layoutItem.querySelector(this.editorLayoutItemBlockRemoveClass)
                : null;
            const editBlock = this.editorLayoutItemBlockEditClass
                ? layoutItem.querySelector(this.editorLayoutItemBlockEditClass)
                : null;
            if (previewBlock) {
                if (layout.isImageLayout()) {
                    const previewElement = previewBlock.firstElementChild;
                    if (previewElement) {
                        previewElement.style.backgroundImage = `url(${layout.url})`;
                        previewElement.style.backgroundSize = 'contain';
                        previewElement.style.backgroundPosition = 'center';
                        previewElement.style.backgroundRepeat = 'no-repeat';
                    }
                    if (isEditing) {
                        previewElement.style.borderColor = 'rgb(254, 94, 58)';
                    }
                    else {
                        previewElement.style.borderColor = '';
                    }
                }
                else if (layout.type === 'text') {
                }
            }
            if (nameBlock) {
                const nameElement = nameBlock.firstElementChild;
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
                    }
                    else if (layout.type === 'text') {
                        nameElement.innerText = layout.name || "Текст";
                    }
                }
            }
            if (removeBlock) {
                removeBlock.style.cursor = 'pointer';
                removeBlock.onclick = () => {
                    this.removeLayout(layout.id);
                    this.showLayoutList();
                    if (isEditing)
                        this.cancelEditLayout();
                };
                this.restoreIconFromDataOriginal(removeBlock.firstElementChild);
            }
            if (editBlock) {
                if (isEditing || layout.id === "start") {
                    editBlock.style.display = 'none';
                }
                else {
                    editBlock.style.display = 'table';
                }
                editBlock.style.cursor = 'pointer';
                editBlock.onclick = () => this.editLayout(layout);
                this.restoreIconFromDataOriginal((0,_utils_tildaUtils__WEBPACK_IMPORTED_MODULE_2__.getLastChild)(editBlock));
            }
            this.editorLayoutsListBlock.firstElementChild.appendChild(layoutItem);
        });
        this.updateSum();
        console.debug(`[settings] [layouts] layouts shown: ${this.editorLayoutsListBlock.firstElementChild.children.length}`);
    }
    initAddOrderButton() {
        if (!this.editorAddOrderButton)
            return;
        this.editorAddOrderButton.style.cursor = 'pointer';
        this.events.on(EditorEventType.MOCKUP_LOADING, (isLoading) => {
            if (this.editorAddOrderButton) {
                if (isLoading) {
                    this.editorAddOrderButton.style.opacity = '0.5';
                    this.editorAddOrderButton.style.cursor = 'not-allowed';
                    this.editorAddOrderButton.style.pointerEvents = 'none';
                    console.debug('[order] Кнопка заблокирована (идет генерация)');
                }
                else {
                    this.editorAddOrderButton.style.opacity = '1';
                    this.editorAddOrderButton.style.cursor = 'pointer';
                    this.editorAddOrderButton.style.pointerEvents = 'auto';
                    console.debug('[order] Кнопка разблокирована');
                }
            }
        });
        this.editorAddOrderButton.onclick = async () => {
            if (this.isAddingToCart) {
                console.warn('[order] Процесс добавления уже идет, игнорируем повторное нажатие');
                return;
            }
            if (this.getSum() === 0) {
                alert('Для добавления заказа продукт не может быть пустым');
                return;
            }
            if (this.layouts.length === 0) {
                alert('Пожалуйста, дождитесь завершения генерации дизайна');
                console.warn('[order] Попытка добавить в корзину без дизайна');
                return;
            }
            let buttonTextElement = this.editorAddOrderButton?.querySelector('.tn-atom');
            if (!buttonTextElement) {
                buttonTextElement = this.editorAddOrderButton?.querySelector('div, span');
            }
            const originalText = buttonTextElement?.textContent?.trim() || 'Добавить в корзину';
            try {
                this.isAddingToCart = true;
                this.setAddToCartButtonLoading(true, 'Добавление...');
                const article = Math.floor(Math.random() * (99999999 - 999999 + 1)) + 999999;
                console.debug('[order] Начало создания заказа');
                const exportedArt = await this.exportArt(true, 512);
                console.debug('[order] Экспорт дизайна завершен:', Object.keys(exportedArt));
                if (Object.keys(exportedArt).length === 0) {
                    alert('Ошибка: не удалось экспортировать дизайн. Попробуйте еще раз.');
                    console.error('[order] Экспорт вернул пустой результат');
                    return;
                }
                const sides = Object.keys(exportedArt).map(side => ({
                    image_url: exportedArt[side] || '',
                }));
                console.debug('[order] Загрузка изображений на сервер...');
                const uploadPromises = sides.map(async (side) => {
                    const base64 = side.image_url.split(',')[1];
                    const uploadedUrl = await this.uploadImageToServer(base64);
                    return { side, uploadedUrl };
                });
                const uploadedSides = await Promise.all(uploadPromises);
                uploadedSides.forEach(({ side, uploadedUrl }) => {
                    side.image_url = uploadedUrl;
                });
                console.debug('[order] Изображения загружены на сервер');
                const productName = `${this.capitalizeFirstLetter(this.getProductName())} с вашим ${Object.keys(exportedArt).length == 1 ? 'односторонним' : 'двухсторонним'} принтом`;
                const layouts = this.layouts.map(layout => ({ ...layout, url: undefined }));
                const userId = await this.storageManager.getUserId();
                const formData = new FormData();
                formData.append("layouts", JSON.stringify(layouts));
                formData.append("user_id", userId);
                formData.append("art", article.toString());
                await fetch(this.apiConfig.webhookCart, {
                    method: "POST",
                    body: formData
                });
                (0,_utils_api__WEBPACK_IMPORTED_MODULE_4__.createProduct)({
                    quantity: this.getQuantity(),
                    name: productName,
                    size: this._selectSize,
                    color: this._selectColor,
                    sides,
                    article,
                    price: this.getSum(),
                });
                this.isAddedToCart = true;
                console.debug('[order] Заказ успешно создан');
                this.setAddToCartButtonLoading(false, '✓ Добавлено!');
                setTimeout(() => {
                    this.setAddToCartButtonLoading(false, originalText);
                }, 2000);
            }
            catch (error) {
                console.error('[order] Ошибка создания заказа:', error);
                logIssue('order_creation_error', {
                    error: error instanceof Error ? error.message : String(error),
                    productType: this._selectType,
                    size: this._selectSize,
                    color: this._selectColor.name,
                    layersCount: this.layouts.length
                });
                alert('Ошибка при создании заказа');
                this.setAddToCartButtonLoading(false, originalText);
            }
            finally {
                setTimeout(() => {
                    this.isAddingToCart = false;
                    console.debug('[order] Флаг isAddingToCart сброшен');
                }, 2000);
            }
        };
    }
    setAddToCartButtonLoading(isLoading, text) {
        if (!this.editorAddOrderButton)
            return;
        this.injectPulseAnimation();
        const button = this.editorAddOrderButton;
        let buttonTextElement = button.querySelector('.tn-atom');
        if (!buttonTextElement) {
            buttonTextElement = button.querySelector('div, span');
        }
        const textTarget = buttonTextElement || button;
        if (isLoading) {
            button.style.opacity = '0.7';
            button.style.cursor = 'not-allowed';
            button.style.pointerEvents = 'none';
            if (text) {
                textTarget.textContent = text;
            }
            button.style.animation = 'cartButtonPulse 1.5s ease-in-out infinite';
            console.debug('[order] [animation] Кнопка заблокирована:', text);
        }
        else {
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.style.pointerEvents = 'auto';
            button.style.animation = 'none';
            if (text) {
                textTarget.textContent = text;
            }
            console.debug('[order] [animation] Кнопка разблокирована:', text);
        }
    }
    injectPulseAnimation() {
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
    setGenerateButtonLoading(isLoading, text) {
        if (!this.formButton)
            return;
        this.injectPulseAnimation();
        const button = this.formButton;
        let buttonTextElement = button.querySelector('.tn-atom');
        if (!buttonTextElement) {
            buttonTextElement = button.querySelector('div, span');
        }
        const textTarget = buttonTextElement || button;
        if (isLoading) {
            button.style.opacity = '0.7';
            button.style.cursor = 'not-allowed';
            button.style.pointerEvents = 'none';
            if (text) {
                textTarget.textContent = text;
            }
            button.style.animation = 'cartButtonPulse 1.5s ease-in-out infinite';
            console.debug('[generate] [animation] Кнопка заблокирована:', text);
        }
        else {
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.style.pointerEvents = 'auto';
            button.style.animation = 'none';
            if (text) {
                textTarget.textContent = text;
            }
            console.debug('[generate] [animation] Кнопка разблокирована:', text);
        }
    }
    setControlsDisabled(disabled) {
        const opacity = disabled ? '0.5' : '1';
        const pointerEvents = disabled ? 'none' : 'auto';
        const cursor = disabled ? 'not-allowed' : 'pointer';
        if (this.changeSideButton) {
            this.changeSideButton.style.opacity = opacity;
            this.changeSideButton.style.pointerEvents = pointerEvents;
            this.changeSideButton.style.cursor = cursor;
        }
        this.colorBlocks.forEach(block => {
            const parent = block.parentElement;
            if (parent) {
                parent.style.opacity = opacity;
                parent.style.pointerEvents = pointerEvents;
                parent.style.cursor = cursor;
            }
        });
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
    initUploadImageButton() {
        if (!this.editorUploadImageButton)
            return;
        this.resetUserUploadImage();
        this.editorUploadImageButton.style.cursor = 'pointer';
        this.editorUploadImageButton.addEventListener('click', () => {
            this.uploadUserImage();
        });
    }
    initFixQuantityForm() {
        if (!this.quantityFormBlock)
            return;
        const form = this.quantityFormBlock.querySelector('form');
        const input = form?.querySelector('input[name="quantity"]');
        if (!input)
            return;
        const validateQuantity = () => {
            const value = input.value.trim();
            if (value === '' || isNaN(Number(value))) {
                input.value = '1';
                return;
            }
            const quantity = parseInt(value, 10);
            if (quantity < 1 || quantity === 0) {
                input.value = '1';
            }
        };
        input.addEventListener('input', validateQuantity);
        input.addEventListener('blur', validateQuantity);
        input.addEventListener('change', validateQuantity);
        validateQuantity();
    }
    async initForm() {
        if (!this.formBlock || !this.formButton || !this.formInputVariableName)
            return;
        const formBlock = this.formBlock;
        const formInputVariableName = this.formInputVariableName;
        const formButton = this.formButton;
        const handleClick = async () => {
            console.debug('[form] [button] clicked');
            if (this.isGenerating) {
                console.warn('[form] Генерация уже идет, игнорируем повторное нажатие');
                return;
            }
            const formInput = formBlock.querySelector(`[name="${formInputVariableName}"]`);
            const prompt = formInput.value;
            if (!this.loadedUserImage) {
                if (!prompt || prompt.trim() === "" || prompt.length < 1) {
                    console.warn('[form] [input] prompt is empty or too short');
                    alert("Минимальная длина запроса 1 символ");
                    return;
                }
            }
            console.debug(`[form] [input] prompt: ${prompt}`);
            this.isGenerating = true;
            this.setGenerateButtonLoading(true, 'Генерация...');
            this.setControlsDisabled(true);
            this.emit(EditorEventType.MOCKUP_LOADING, true);
            const layoutId = this._selectLayout || _models_Layout__WEBPACK_IMPORTED_MODULE_1__.Layout.generateId();
            try {
                if (!this._selectColor || !this._selectColor.name) {
                    throw new Error('Цвет не определен. Пожалуйста, выберите цвет товара.');
                }
                const url = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_4__.generateImage)({
                    uri: this.apiConfig.webhookRequest,
                    prompt,
                    shirtColor: this._selectColor.name,
                    image: this._selectLayout ? this.loadedUserImage !== this.layouts.find(layout => layout.id === this._selectLayout)?.url ? this.loadedUserImage : null : this.loadedUserImage,
                    withAi: this.editorLoadWithAi,
                    layoutId,
                    isNew: this._selectLayout ? false : true,
                    background: !this.editorRemoveBackground,
                });
                try {
                    window.ym(103279214, 'reachGoal', 'generated');
                }
                catch (error) { }
                this.emit(EditorEventType.MOCKUP_LOADING, false);
                const imageData = await this.getImageData(url);
                console.debug(`[form] [input] image data received`);
                if (this._selectLayout) {
                    const layout = this.layouts.find(layout => layout.id === layoutId);
                    if (layout && layout.isImageLayout()) {
                        console.debug(`[form] [input] updating layout: ${layout.id}`);
                        layout.name = prompt;
                        layout.url = imageData;
                        console.debug(`[form] [input] layout updated`);
                        if (!this.isRestoringFromHistory) {
                            this.saveLayersToHistory();
                        }
                        this.showLayoutList();
                        this.updateLayouts();
                        this.saveState();
                        this.saveLayouts().catch(err => console.error('[layers] Ошибка сохранения слоёв:', err));
                    }
                }
                else {
                    this.addLayout(_models_Layout__WEBPACK_IMPORTED_MODULE_1__.Layout.createImage({
                        id: layoutId,
                        view: this._selectSide,
                        url: imageData,
                        name: prompt,
                        position: { x: 0, y: 0 },
                    }));
                }
                formInput.style.borderColor = '#f3f3f3';
                this._selectLayout = null;
                formInput.value = "";
                this.cancelEditLayout();
                this.resetUserUploadImage();
                this.showLayoutList();
                this.setGenerateButtonLoading(false, '✓ Готово!');
                this.setControlsDisabled(false);
                setTimeout(() => {
                    this.setGenerateButtonLoading(false, 'Сгенерировать');
                    this.isGenerating = false;
                    console.debug('[form] Флаг isGenerating сброшен');
                }, 2000);
            }
            catch (error) {
                logIssue('image_generation_error', {
                    error: error instanceof Error ? error.message : String(error),
                    prompt: prompt,
                    shirtColor: this._selectColor?.name || 'unknown',
                    withAi: this.editorLoadWithAi,
                    isEditing: !!this._selectLayout
                });
                this.emit(EditorEventType.MOCKUP_LOADING, false);
                console.error('[form] [input] error', error);
                alert("Ошибка при генерации изображения");
                this.setGenerateButtonLoading(false, 'Сгенерировать');
                this.setControlsDisabled(false);
                this.isGenerating = false;
                return;
            }
            finally {
                if (this.loadedUserImage) {
                    this.resetUserUploadImage();
                }
                if (this._selectLayout) {
                    this._selectLayout = null;
                    this.cancelEditLayout();
                }
            }
        };
        const form = await new Promise((resolve) => {
            const interval = setInterval(() => {
                const form = formBlock.querySelector("form");
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
        form.action = "";
        form.method = "GET";
        form.onsubmit = (event) => {
            event.preventDefault();
            handleClick();
        };
        const fixInputBlock = form.querySelector(`textarea[name='${formInputVariableName}']`);
        if (fixInputBlock) {
            fixInputBlock.style.padding = "8px";
        }
        formButton.onclick = handleClick;
        formButton.style.cursor = "pointer";
        console.debug('[form] Инициализация формы завершена');
    }
    restoreIconFromDataOriginal(element) {
        if (!element)
            return;
        const dataOriginal = element.attributes.getNamedItem("data-original")?.value;
        if (dataOriginal) {
            element.style.backgroundImage = `url("${dataOriginal}")`;
        }
    }
    changeProduct(productType) {
        if (this.isGenerating) {
            console.warn('[changeProduct] Генерация в процессе, переключение заблокировано');
            return;
        }
        this._selectType = productType;
        this.clearMockupCache();
        const product = this.getProductByType(productType);
        if (product) {
            const mockupWithCurrentColor = product.mockups.find(m => m.side === this._selectSide && m.color.name === this._selectColor.name);
            if (!mockupWithCurrentColor) {
                const firstMockup = product.mockups.find(m => m.side === this._selectSide);
                if (firstMockup && firstMockup.color && firstMockup.color.name) {
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
    updateProductBlocksUI() {
        if (this.productBlocks.length === 0)
            return;
        this.productBlocks.forEach(block => {
            block.style.background = 'rgb(222 222 222)';
        });
        const activeBlock = this.productBlocks.find(block => block.classList.contains('editor-settings__product-block__' + this._selectType));
        if (activeBlock) {
            activeBlock.style.background = '';
        }
    }
    changeSide() {
        if (this.isGenerating) {
            console.warn('[changeSide] Генерация в процессе, переключение заблокировано');
            return;
        }
        const newSide = this._selectSide === 'front' ? 'back' : 'front';
        this.setActiveSide(newSide);
        this.updateMockup();
        this.showLayoutList();
        this.updateLayouts();
        this.saveState();
        this.emit(EditorEventType.STATE_CHANGED, undefined);
    }
    changeColor(colorName) {
        if (this.isGenerating) {
            console.warn('[changeColor] Генерация в процессе, переключение заблокировано');
            return;
        }
        const product = this.getProductByType(this._selectType);
        if (!product)
            return;
        const mockup = product.mockups.find(m => m.color.name === colorName);
        if (!mockup || !mockup.color || !mockup.color.name)
            return;
        this._selectColor = mockup.color;
        this.clearMockupCache();
        this.updateColorBlocksUI(colorName);
        this.updateMockup();
        this.saveState();
    }
    updateColorBlocksUI(colorName) {
        if (this.colorBlocks.length === 0)
            return;
        this.colorBlocks.forEach(block => {
            block.style.borderColor = '#f3f3f3';
        });
        const activeBlock = this.colorBlocks.find(block => block.classList.contains('editor-settings__color-block__' + colorName));
        if (activeBlock) {
            activeBlock.style.borderColor = '';
        }
    }
    changeSize(size) {
        this.updateSizeBlocksUI(size);
        this._selectSize = size;
        this.saveState();
    }
    updateSizeBlocksUI(size) {
        if (this.sizeBlocks.length === 0)
            return;
        this.sizeBlocks.forEach(block => {
            const borderBlock = block.firstElementChild;
            if (borderBlock) {
                borderBlock.style.borderColor = '#f3f3f3';
            }
        });
        const activeBlock = this.sizeBlocks.find(block => block.classList.contains('editor-settings__size-block__' + size));
        if (activeBlock) {
            const borderBlock = activeBlock.firstElementChild;
            if (borderBlock) {
                borderBlock.style.borderColor = '';
            }
        }
    }
    editLayout(layout) {
        console.debug(`[settings] [layouts] edit layout ${layout.id}`);
        this._selectLayout = layout.id;
        if (this.formBlock && this.formInputVariableName) {
            const formInput = this.formBlock.querySelector(`[name="${this.formInputVariableName}"]`);
            if (formInput) {
                formInput.value = layout.name || '';
                formInput.style.borderColor = 'rgb(254, 94, 58)';
                formInput.focus();
                console.debug(`[settings] [layouts] Установлено значение в форму: "${layout.name}"`);
            }
            else {
                console.warn(`[settings] [layouts] Не найден элемент формы с именем "${this.formInputVariableName}"`);
            }
        }
        if (layout.isImageLayout()) {
            this.loadedUserImage = layout.url;
            this.setUserUploadImage(layout.url);
            this.initAiButtons();
            this.hideAiButtons();
        }
        else {
            this.loadedUserImage = null;
            this.resetUserUploadImage();
        }
        this.showLayoutList();
    }
    cancelEditLayout() {
        console.debug(`[settings] [layouts] cancel edit layout`);
        this._selectLayout = null;
        if (this.formBlock && this.formInputVariableName) {
            const formInput = this.formBlock.querySelector(`[name="${this.formInputVariableName}"]`);
            if (formInput) {
                formInput.value = '';
                formInput.style.borderColor = '#f3f3f3';
            }
        }
        this.loadedUserImage = null;
        this.editorLoadWithAi = false;
        this.showLayoutList();
        console.debug(`[settings] [layouts] Редактирование отменено`);
    }
    initAiButtons() {
        this.editorLoadWithAi = false;
        this.editorRemoveBackground = false;
        this.changeLoadWithAi();
        this.changeRemoveBackground();
        if (this.editorLoadWithAiButton) {
            this.editorLoadWithAiButton.style.cursor = 'pointer';
            this.editorLoadWithAiButton.onclick = () => {
                this.changeLoadWithAi(true);
            };
        }
        if (this.editorLoadWithoutAiButton) {
            this.editorLoadWithoutAiButton.style.cursor = 'pointer';
            this.editorLoadWithoutAiButton.onclick = () => {
                this.changeLoadWithAi(false);
            };
        }
        if (this.editorRemoveBackgroundButton) {
            this.editorRemoveBackgroundButton.style.cursor = 'pointer';
            this.editorRemoveBackgroundButton.onclick = () => {
                this.changeRemoveBackground(!this.editorRemoveBackground);
            };
        }
    }
    hideAiButtons() {
        this.editorLoadWithAi = true;
        if (this.editorLoadWithAiButton) {
            (this.editorLoadWithAiButton.parentElement?.parentElement?.parentElement).style.display = 'none';
        }
    }
    showAiButtons() {
        if (this.editorLoadWithAiButton) {
            (this.editorLoadWithAiButton.parentElement?.parentElement?.parentElement).style.display = 'flex';
        }
    }
    uploadUserImage() {
        console.debug('[upload user image] starting user image upload');
        this.showAiButtons();
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.onchange = (event) => {
            const target = event.target;
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
                    const imageUrl = e.target?.result;
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
    setUserUploadImage(image) {
        this.loadedUserImage = image;
        if (this.editorUploadViewBlock) {
            this.editorUploadViewBlock.style.display = 'table';
            const imageBlock = (0,_utils_tildaUtils__WEBPACK_IMPORTED_MODULE_2__.getLastChild)(this.editorUploadViewBlock);
            if (imageBlock) {
                imageBlock.style.backgroundImage = `url(${image})`;
                imageBlock.style.backgroundSize = 'contain';
                imageBlock.style.backgroundPosition = 'center';
                imageBlock.style.backgroundRepeat = 'no-repeat';
            }
        }
    }
    resetUserUploadImage() {
        if (this.editorUploadViewBlock) {
            this.editorUploadViewBlock.style.display = 'none';
        }
        this.loadedUserImage = null;
        this.cancelEditLayout();
    }
    changeLoadWithAi(value = false) {
        console.debug(`[ai buttons] changeLoadWithAi вызван, value=${value}`);
        this.editorLoadWithAi = value;
        if (this.editorLoadWithAiButton && this.editorLoadWithoutAiButton) {
            const buttonWithAi = this.editorLoadWithAiButton;
            const buttonWithoutAi = this.editorLoadWithoutAiButton;
            if (value) {
                const fixButtonWithAi = buttonWithAi.firstElementChild;
                const fixButtonWithoutAi = buttonWithoutAi.firstElementChild;
                if (fixButtonWithAi) {
                    fixButtonWithAi.style.borderColor = '';
                    console.debug(`[ai buttons] С ИИ: сброшен borderColor (оранжевый)`);
                }
                if (fixButtonWithoutAi) {
                    fixButtonWithoutAi.style.borderColor = '#f2f2f2';
                    console.debug(`[ai buttons] Без ИИ: установлен borderColor=#f2f2f2 (серый)`);
                }
            }
            else {
                const fixButtonWithAi = buttonWithAi.firstElementChild;
                const fixButtonWithoutAi = buttonWithoutAi.firstElementChild;
                if (fixButtonWithAi) {
                    fixButtonWithAi.style.borderColor = '#f2f2f2';
                    console.debug(`[ai buttons] С ИИ: установлен borderColor=#f2f2f2 (серый)`);
                }
                if (fixButtonWithoutAi) {
                    fixButtonWithoutAi.style.borderColor = '';
                    console.debug(`[ai buttons] Без ИИ: сброшен borderColor (оранжевый)`);
                }
            }
        }
        this.updateRemoveBackgroundVisibility();
    }
    changeRemoveBackground(value = false) {
        console.debug(`[remove bg button] changeRemoveBackground вызван, value=${value}`);
        this.editorRemoveBackground = value;
        if (this.editorRemoveBackgroundButton) {
            const button = this.editorRemoveBackgroundButton;
            const fixButton = button.firstElementChild;
            if (fixButton) {
                if (value) {
                    fixButton.style.borderColor = '';
                    console.debug(`[remove bg button] Убрать фон: сброшен borderColor (оранжевый)`);
                }
                else {
                    fixButton.style.borderColor = '#f2f2f2';
                    console.debug(`[remove bg button] Убрать фон: установлен borderColor=#f2f2f2 (серый)`);
                }
            }
        }
    }
    updateRemoveBackgroundVisibility() {
        if (!this.editorRemoveBackgroundButton)
            return;
        const parentElement = this.editorRemoveBackgroundButton.parentElement;
        if (!parentElement)
            return;
        if (!this.editorLoadWithAi) {
            parentElement.style.display = '';
            console.debug('[remove bg button] Кнопка показана (Без ИИ выбрано)');
        }
        else {
            parentElement.style.display = 'none';
            this.changeRemoveBackground(false);
            console.debug('[remove bg button] Кнопка скрыта (С ИИ выбрано)');
        }
    }
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    getQuantity() {
        if (!this.quantityFormBlock)
            return 1;
        const form = this.quantityFormBlock.querySelector('form');
        const input = form?.querySelector('input[name="quantity"]');
        if (!input)
            return 1;
        return parseInt(input.value) || 1;
    }
    getSum() {
        const hasFront = this.layouts.some(layout => layout.view === 'front');
        const hasBack = this.layouts.some(layout => layout.view === 'back');
        const product = this.getProductByType(this._selectType);
        if (!product)
            return 0;
        const price = hasBack && hasFront
            ? product.doubleSidedPrice
            : product.price;
        return price;
    }
    updateSum() {
        if (!this.editorSumBlock)
            return;
        const sum = this.getSum();
        const sumText = (0,_utils_tildaUtils__WEBPACK_IMPORTED_MODULE_2__.getLastChild)(this.editorSumBlock);
        if (sumText) {
            sumText.innerText = sum.toString() + ' ₽';
        }
        if (this.editorAddOrderButton) {
            const buttonBlock = (0,_utils_tildaUtils__WEBPACK_IMPORTED_MODULE_2__.getLastChild)(this.editorAddOrderButton);
            if (buttonBlock) {
                buttonBlock.style.backgroundColor = sum === 0 ? 'rgb(121 121 121)' : '';
            }
        }
    }
    loadProduct() {
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
    clearAllCanvas() {
        if (this.canvasesContainer) {
            this.canvasesContainer.innerHTML = '';
        }
        this.canvases.forEach(canvas => {
            try {
                canvas.dispose();
            }
            catch (err) {
                console.error('[canvas] Ошибка очистки canvas:', err);
            }
        });
        this.canvases = [];
        this.layersCanvases = [];
        this.activeCanvas = null;
    }
    handleWindowResize() {
        console.debug('[canvas] Изменение размера окна');
        const newWidth = this.editorBlock.clientWidth;
        const newHeight = this.editorBlock.clientHeight;
        this.canvases.forEach((canvas) => {
            canvas.setWidth(newWidth);
            canvas.setHeight(newHeight);
        });
        this.layersCanvases.forEach((canvas) => {
            canvas.setWidth(newWidth);
            canvas.setHeight(newHeight);
        });
        const product = this.getProductByType(this._selectType);
        if (product) {
            product.printConfig.forEach((printConfig) => {
                const canvas = this.canvases.find(c => c.side === printConfig.side);
                if (canvas) {
                    this.updatePrintArea(canvas, printConfig);
                }
            });
        }
        this.canvases.forEach((canvas) => {
            const side = canvas.side;
            const objects = canvas.getObjects();
            const toRemove = [];
            objects.forEach((obj) => {
                if (obj.name !== 'area:border' &&
                    obj.name !== 'area:clip' &&
                    !obj.name?.startsWith('guideline')) {
                    toRemove.push(obj);
                }
            });
            toRemove.forEach((obj) => canvas.remove(obj));
            console.debug(`[canvas] Удалено ${toRemove.length} объектов для перерисовки на стороне ${side}`);
            const layoutsForSide = this.layouts.filter(l => l.view === side);
            layoutsForSide.forEach(layout => {
                this.addLayoutToCanvas(layout);
            });
            canvas.requestRenderAll();
        });
        console.debug('[canvas] Размер изменен:', { width: newWidth, height: newHeight });
    }
    updatePrintArea(canvas, printConfig) {
        const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
        const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
        const left = (this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth);
        const top = (this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight);
        const clipPath = canvas.clipPath;
        if (clipPath) {
            clipPath.set({
                width,
                height,
                left,
                top
            });
        }
        const border = this.getObject('area:border', canvas);
        if (border) {
            border.set({
                width: width - 3,
                height: height - 3,
                left,
                top
            });
        }
        canvas.requestRenderAll();
    }
    createCanvasForSide(printConfig) {
        if (!this.canvasesContainer) {
            console.error('[canvas] canvasesContainer не инициализирован');
            return;
        }
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
        layersCanvas.side = printConfig.side;
        layersCanvas.name = 'static-' + printConfig.side;
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
        editableCanvas.side = printConfig.side;
        editableCanvas.name = 'editable-' + printConfig.side;
        this.layersCanvases.push(layersCanvas);
        this.canvases.push(editableCanvas);
        if (this.canvases.length === 1) {
            this.activeCanvas = editableCanvas;
        }
        this.initMainCanvas(editableCanvas, printConfig);
    }
    initMainCanvas(canvas, printConfig) {
        if (!canvas || !(canvas instanceof fabric.Canvas)) {
            console.warn('[canvas] canvas не валиден');
            return;
        }
        const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
        const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
        const left = (this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth);
        const top = (this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight);
        const clipArea = new fabric.Rect({
            width,
            height,
            left,
            top,
            fill: 'rgb(255, 0, 0)',
            name: 'area:clip',
            evented: false,
        });
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
        });
        canvas.add(areaBorder);
        canvas.clipPath = clipArea;
        this.setupCanvasEventHandlers(canvas, printConfig);
    }
    setupCanvasEventHandlers(canvas, printConfig) {
        canvas.on('mouse:down', () => {
            const border = this.getObject('area:border', canvas);
            if (border) {
                border.set('opacity', 0.8);
                canvas.requestRenderAll();
            }
        });
        canvas.on('mouse:up', () => {
            const border = this.getObject('area:border', canvas);
            if (border) {
                border.set('opacity', 0.3);
                canvas.requestRenderAll();
            }
        });
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
        canvas.on('object:moving', (e) => {
            this.handleObjectMoving(e, canvas, printConfig);
        });
        canvas.on('object:modified', (e) => {
            this.handleObjectModified(e, canvas, printConfig);
        });
    }
    handleObjectMoving(e, canvas, printConfig) {
        if (!e.target || e.target.name === 'area:border' || e.target.name === 'area:clip') {
            return;
        }
        const layout = this.layouts.find(l => l.id === e.target.name);
        if (!layout)
            return;
        const product = this.getProductByType(this._selectType);
        if (!product)
            return;
        const dimensions = (0,_utils_canvasUtils__WEBPACK_IMPORTED_MODULE_5__.calculateLayoutDimensions)(layout, product, this.editorBlock.clientWidth, this.editorBlock.clientHeight);
        const objWidth = e.target.width * e.target.scaleX;
        const objHeight = e.target.height * e.target.scaleY;
        const objCenterLeft = e.target.left + objWidth / 2;
        const objCenterTop = e.target.top + objHeight / 2;
        const centerX = dimensions.printAreaLeft + dimensions.printAreaWidth / 2;
        const centerY = dimensions.printAreaTop + dimensions.printAreaHeight / 2;
        const nearX = Math.abs(objCenterLeft - centerX) < 7;
        const nearY = Math.abs(objCenterTop - centerY) < 7;
        if (nearX) {
            this.showGuideline(canvas, 'vertical', centerX, 0, centerX, this.editorBlock.clientHeight);
            e.target.set({ left: centerX - objWidth / 2 });
        }
        else {
            this.hideGuideline(canvas, 'vertical');
        }
        if (nearY) {
            this.showGuideline(canvas, 'horizontal', 0, centerY, this.editorBlock.clientWidth, centerY);
            e.target.set({ top: centerY - objHeight / 2 });
        }
        else {
            this.hideGuideline(canvas, 'horizontal');
        }
    }
    handleObjectModified(e, canvas, printConfig) {
        const object = e.target;
        if (!object)
            return;
        this.hideGuideline(canvas, 'vertical');
        this.hideGuideline(canvas, 'horizontal');
        const layout = this.layouts.find(l => l.id === object.name);
        if (!layout)
            return;
        const product = this.getProductByType(this._selectType);
        if (!product)
            return;
        const dimensions = (0,_utils_canvasUtils__WEBPACK_IMPORTED_MODULE_5__.calculateLayoutDimensions)(layout, product, this.editorBlock.clientWidth, this.editorBlock.clientHeight);
        layout.position.x = (object.left - dimensions.printAreaLeft) / dimensions.printAreaWidth;
        layout.position.y = (object.top - dimensions.printAreaTop) / dimensions.printAreaHeight;
        layout.size = object.scaleX;
        layout.aspectRatio = object.scaleY / object.scaleX;
        layout.angle = object.angle;
        const objectWidth = (object.width * object.scaleX);
        const relativeWidth = objectWidth / dimensions.printAreaWidth;
        layout._relativeWidth = relativeWidth;
        console.debug(`[canvas] Layout ${layout.id} updated: position=(${layout.position.x.toFixed(3)}, ${layout.position.y.toFixed(3)}), size=${layout.size.toFixed(3)}, relativeWidth=${relativeWidth.toFixed(3)}`);
        this.saveLayouts().catch(err => console.error('[layers] Ошибка сохранения слоёв:', err));
    }
    showGuideline(canvas, type, x1, y1, x2, y2) {
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
            });
            if (guideline) {
                canvas.add(guideline);
            }
        }
    }
    hideGuideline(canvas, type) {
        const guideline = this.getObject(`guideline:${type}`, canvas);
        if (guideline) {
            canvas.remove(guideline);
        }
    }
    getObject(name, canvas) {
        const targetCanvas = canvas || this.activeCanvas || this.canvases[0];
        if (!targetCanvas)
            return undefined;
        return targetCanvas.getObjects().find(obj => obj.name === name);
    }
    setActiveSide(side) {
        console.debug('[canvas] Установка активной стороны:', side);
        this.canvases.forEach(canvas => {
            const canvasElement = canvas.getElement();
            const containerElement = canvasElement.parentElement;
            if (canvas.side === side) {
                this.activeCanvas = canvas;
                if (containerElement) {
                    containerElement.style.pointerEvents = 'auto';
                    containerElement.style.display = 'block';
                }
                canvasElement.style.display = 'block';
            }
            else {
                if (containerElement) {
                    containerElement.style.pointerEvents = 'none';
                    containerElement.style.display = 'none';
                }
                canvasElement.style.display = 'none';
            }
        });
        this.layersCanvases.forEach(layersCanvas => {
            const canvasElement = layersCanvas.getElement();
            canvasElement.style.display = layersCanvas.side === side ? 'block' : 'none';
        });
        this._selectSide = side;
    }
    async addLayoutToCanvas(layout) {
        const canvas = this.canvases.find(c => c.side === layout.view);
        if (!canvas) {
            console.warn(`[canvas] canvas для ${layout.view} не найден`);
            return;
        }
        const product = this.getProductByType(this._selectType);
        if (!product)
            return;
        const fabricObject = await (0,_utils_canvasUtils__WEBPACK_IMPORTED_MODULE_5__.renderLayout)({
            layout,
            product,
            containerWidth: this.editorBlock.clientWidth,
            containerHeight: this.editorBlock.clientHeight,
            loadImage: this.loadImage.bind(this)
        });
        if (fabricObject) {
            canvas.add(fabricObject);
        }
    }
    updateLayouts() {
        if (!this.activeCanvas)
            return;
        this.updateLayoutsForSide(this._selectSide);
    }
    updateLayoutsForSide(side) {
        const canvas = this.canvases.find(c => c.side === side);
        if (!canvas)
            return;
        const objects = canvas.getObjects();
        const objectsToRemove = objects
            .filter(obj => obj.name !== 'area:border' && obj.name !== 'area:clip' && !obj.name?.startsWith('guideline'))
            .filter(obj => !this.layouts.find(layout => layout.id === obj.name));
        objectsToRemove.forEach(obj => {
            canvas.remove(obj);
        });
        const layoutsForSide = this.layouts.filter(layout => layout.view === side);
        const objectsToUpdate = [];
        const objectsToAdd = [];
        layoutsForSide.forEach(layout => {
            const existingObj = objects.find(obj => obj.name === layout.id);
            if (existingObj) {
                if (layout.isImageLayout() && existingObj.layoutUrl !== layout.url) {
                    console.debug(`[canvas] Layout ${layout.id} изменился, требуется обновление`);
                    objectsToUpdate.push(layout);
                }
            }
            else {
                objectsToAdd.push(layout);
            }
        });
        objectsToUpdate.forEach(layout => {
            const existingObj = objects.find(obj => obj.name === layout.id);
            if (existingObj) {
                console.debug(`[canvas] Удаляем старый объект для обновления: ${layout.id}`);
                canvas.remove(existingObj);
            }
            console.debug(`[canvas] Добавляем обновленный объект: ${layout.id}`);
            this.addLayoutToCanvas(layout);
        });
        objectsToAdd.forEach(layout => {
            this.addLayoutToCanvas(layout);
        });
        canvas.renderAll();
    }
    async preloadAllMockups() {
        console.debug('[preload] Начало предзагрузки mockups');
        for (const product of this.productConfigs) {
            for (const mockup of product.mockups) {
                try {
                    const mockupDataUrl = await this.getImageData(mockup.url);
                    mockup.url = mockupDataUrl;
                    console.debug(`[preload] Mockup загружен: ${mockup.color.name}`);
                }
                catch (error) {
                    console.error(`[preload] Ошибка загрузки mockup ${mockup.url}:`, error);
                }
            }
        }
        console.debug('[preload] Предзагрузка завершена');
    }
    async getImageData(url) {
        return this.loadAndConvertImage(url);
    }
    async uploadImage(file) {
        console.debug('[upload] Загрузка файла:', file.name);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const dataUrl = e.target?.result;
                    const convertedDataUrl = await this.getImageData(dataUrl);
                    console.debug('[upload] Файл успешно загружен');
                    resolve(convertedDataUrl);
                }
                catch (error) {
                    logIssue('load_file', {
                        error: error instanceof Error ? error.message : String(error),
                        file_name: file.name
                    });
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
    async uploadImageToServer(base64) {
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
    getProductName() {
        return this.getProductByType(this._selectType)?.productName || '';
    }
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    getMockupUrl(side) {
        const product = this.getProductByType(this._selectType);
        if (!product)
            return null;
        const mockup = product.mockups.find(mockup => mockup.side === side && mockup.color.name === this._selectColor.name);
        return mockup ? mockup.url : null;
    }
    async exportArt(withMockup = true, resolution = 1024) {
        const result = {};
        const sidesWithLayers = this.getSidesWithLayers();
        console.debug('[export] Найдены стороны с слоями:', sidesWithLayers, '(front первый)', withMockup ? 'с мокапом' : 'без мокапа', `разрешение: ${resolution}px`);
        const exportPromises = sidesWithLayers.map(async (side) => {
            try {
                const exportedSide = await this.exportSide(side, withMockup, resolution);
                if (exportedSide) {
                    console.debug(`[export] Сторона ${side} успешно экспортирована`);
                    return { side, data: exportedSide };
                }
            }
            catch (error) {
                console.error(`[export] Ошибка при экспорте стороны ${side}:`, error);
                logIssue('export_side_error', {
                    error: error instanceof Error ? error.message : String(error),
                    side: side,
                    withMockup: withMockup,
                    resolution: resolution
                });
            }
            return null;
        });
        const exportedSides = await Promise.all(exportPromises);
        exportedSides.forEach(item => {
            if (item) {
                result[item.side] = item.data;
            }
        });
        console.debug(`[export] Экспорт завершен для ${Object.keys(result).length} сторон`);
        return result;
    }
    getSidesWithLayers() {
        const allSidesWithLayers = [...new Set(this.layouts.map(layout => layout.view))];
        return allSidesWithLayers.sort((a, b) => {
            if (a === 'front')
                return -1;
            if (b === 'front')
                return 1;
            return 0;
        });
    }
    async exportSide(side, withMockup = true, resolution = 1024) {
        const canvases = this.getCanvasesForSide(side);
        if (!canvases.editableCanvas) {
            console.warn(`[export] Canvas для стороны ${side} не найден`);
            return null;
        }
        this.updateLayoutsForSide(side);
        console.debug(`[export] Экспортируем сторону ${side}${withMockup ? ' с мокапом' : ' без мокапа'} (${resolution}px)...`);
        if (!withMockup) {
            const croppedCanvas = await this.exportDesignWithClipPath(canvases.editableCanvas, canvases.layersCanvas, side, resolution);
            console.debug(`[export] Экспортирован чистый дизайн для ${side} (обрезан по clipPath)`);
            return croppedCanvas.toDataURL('image/png', 1.0);
        }
        const mockupImg = await this.loadMockupForSide(side);
        if (!mockupImg)
            return null;
        const product = this.getProductByType(this._selectType);
        const printConfig = product?.printConfig.find(pc => pc.side === side);
        if (!printConfig) {
            console.warn(`[export] Не найдена конфигурация печати для ${side}`);
            return null;
        }
        const { canvas: tempCanvas, ctx, mockupDimensions } = this.createExportCanvas(resolution, mockupImg);
        const croppedDesignCanvas = await this.exportDesignWithClipPath(canvases.editableCanvas, canvases.layersCanvas, side, resolution);
        const printAreaWidth = (printConfig.size.width / 600) * mockupDimensions.width;
        const printAreaHeight = (printConfig.size.height / 600) * mockupDimensions.height;
        const printAreaX = mockupDimensions.x + (mockupDimensions.width - printAreaWidth) / 2 + (printConfig.position.x / 100) * mockupDimensions.width;
        const printAreaY = mockupDimensions.y + (mockupDimensions.height - printAreaHeight) / 2 + (printConfig.position.y / 100) * mockupDimensions.height;
        ctx.drawImage(croppedDesignCanvas, 0, 0, croppedDesignCanvas.width, croppedDesignCanvas.height, printAreaX, printAreaY, printAreaWidth, printAreaHeight);
        console.debug(`[export] Наложен обрезанный дизайн (clipPath) на мокап для ${side} в области печати (${Math.round(printAreaX)}, ${Math.round(printAreaY)}, ${Math.round(printAreaWidth)}x${Math.round(printAreaHeight)})`);
        return tempCanvas.toDataURL('image/png', 1.0);
    }
    getCanvasesForSide(side) {
        return {
            editableCanvas: this.canvases.find(c => c.side === side),
            layersCanvas: this.layersCanvases.find(c => c.side === side)
        };
    }
    async loadMockupForSide(side) {
        const mockupUrl = this.getMockupUrl(side);
        if (!mockupUrl) {
            console.warn(`[export] Мокап для стороны ${side} не найден`);
            return null;
        }
        const mockupImg = await this.loadImage(mockupUrl);
        console.debug(`[export] Загружен мокап для ${side}: ${mockupUrl}`);
        return mockupImg;
    }
    createExportCanvas(exportSize, mockupImg) {
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        tempCanvas.width = exportSize;
        tempCanvas.height = exportSize;
        const mockupScale = Math.min(exportSize / mockupImg.width, exportSize / mockupImg.height);
        const scaledMockupWidth = mockupImg.width * mockupScale;
        const scaledMockupHeight = mockupImg.height * mockupScale;
        const mockupX = (exportSize - scaledMockupWidth) / 2;
        const mockupY = (exportSize - scaledMockupHeight) / 2;
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
    async createDesignCanvas(editableCanvas, layersCanvas, side) {
        const qualityMultiplier = 10;
        const baseWidth = editableCanvas.getWidth();
        const baseHeight = editableCanvas.getHeight();
        const designCanvas = document.createElement('canvas');
        const designCtx = designCanvas.getContext('2d');
        designCanvas.width = baseWidth * qualityMultiplier;
        designCanvas.height = baseHeight * qualityMultiplier;
        await this.addStaticLayersToCanvas(layersCanvas, designCtx, designCanvas, side);
        await this.addEditableObjectsToCanvas(editableCanvas, designCtx, designCanvas, baseWidth, baseHeight, side);
        return designCanvas;
    }
    async addStaticLayersToCanvas(layersCanvas, ctx, canvas, side) {
        if (!layersCanvas)
            return;
        try {
            const layersDataUrl = layersCanvas.toDataURL({
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
        }
        catch (error) {
            console.warn(`[export] Ошибка экспорта статических слоев для ${side}:`, error);
        }
    }
    async addEditableObjectsToCanvas(editableCanvas, ctx, canvas, baseWidth, baseHeight, side) {
        try {
            const tempEditableCanvas = new fabric.StaticCanvas(null, {
                width: baseWidth,
                height: baseHeight,
                backgroundColor: 'transparent'
            });
            if (editableCanvas.clipPath) {
                const clonedClip = await new Promise((resolve) => {
                    editableCanvas.clipPath.clone((cloned) => resolve(cloned));
                });
                tempEditableCanvas.clipPath = clonedClip;
                console.debug(`[export] Применён clipPath для экспорта стороны ${side}`);
            }
            const designObjects = this.filterDesignObjects(editableCanvas.getObjects());
            for (const obj of designObjects) {
                const clonedObj = await new Promise((resolve) => {
                    obj.clone((cloned) => resolve(cloned));
                });
                tempEditableCanvas.add(clonedObj);
            }
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
        }
        catch (error) {
            console.warn(`[export] Ошибка создания дизайна без границ для ${side}:`, error);
        }
    }
    filterDesignObjects(allObjects) {
        const serviceObjectNames = new Set([
            "area:border",
            "area:clip",
            "guideline",
            "guideline:vertical",
            "guideline:horizontal"
        ]);
        return allObjects.filter((obj) => !serviceObjectNames.has(obj.name));
    }
    async exportDesignWithClipPath(editableCanvas, layersCanvas, side, resolution) {
        const qualityMultiplier = 10;
        const clipPath = editableCanvas.clipPath;
        if (!clipPath) {
            console.warn('[export] clipPath не найден, экспортируем весь canvas');
            return await this.createDesignCanvas(editableCanvas, layersCanvas, side);
        }
        const clipWidth = clipPath.width;
        const clipHeight = clipPath.height;
        const clipLeft = clipPath.left;
        const clipTop = clipPath.top;
        console.debug(`[export] clipPath: ${clipWidth}x${clipHeight} at (${clipLeft}, ${clipTop})`);
        const fullDesignCanvas = await this.createDesignCanvas(editableCanvas, layersCanvas, side);
        const scale = resolution / Math.max(clipWidth, clipHeight);
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = clipWidth * scale;
        croppedCanvas.height = clipHeight * scale;
        const ctx = croppedCanvas.getContext('2d');
        const sourceScale = qualityMultiplier;
        ctx.drawImage(fullDesignCanvas, clipLeft * sourceScale, clipTop * sourceScale, clipWidth * sourceScale, clipHeight * sourceScale, 0, 0, croppedCanvas.width, croppedCanvas.height);
        console.debug(`[export] Дизайн обрезан по clipPath: ${croppedCanvas.width}x${croppedCanvas.height}px`);
        return croppedCanvas;
    }
    async uploadDesignToServer(designs) {
        try {
            console.debug('[export] Загрузка дизайна на сервер');
            const formData = new FormData();
            for (const [side, dataUrl] of Object.entries(designs)) {
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                formData.append(side, blob, `${side}.png`);
            }
            console.warn('[export] Загрузка на сервер не реализована');
            return designs;
        }
        catch (error) {
            console.error('[export] Ошибка при загрузке на сервер:', error);
            return null;
        }
    }
    saveLayersToHistory() {
        if (this.currentHistoryIndex < this.layersHistory.length - 1) {
            this.layersHistory = this.layersHistory.slice(0, this.currentHistoryIndex + 1);
        }
        const layersCopy = JSON.parse(JSON.stringify(this.layouts));
        const historyItem = {
            layers: layersCopy.map((data) => new _models_Layout__WEBPACK_IMPORTED_MODULE_1__.Layout(data)),
            timestamp: Date.now()
        };
        this.layersHistory.push(historyItem);
        this.currentHistoryIndex = this.layersHistory.length - 1;
        const MAX_HISTORY_SIZE = 50;
        if (this.layersHistory.length > MAX_HISTORY_SIZE) {
            this.layersHistory.shift();
            this.currentHistoryIndex--;
        }
        console.debug(`[history] Сохранено состояние слоёв. Индекс: ${this.currentHistoryIndex}, Всего: ${this.layersHistory.length}, Слоёв: ${this.layouts.length}`);
        this.updateHistoryButtonsState();
    }
    canUndo() {
        if (this.currentHistoryIndex === this.layersHistory.length - 1) {
            return this.layersHistory.length >= 2;
        }
        else {
            return this.currentHistoryIndex > 0;
        }
    }
    canRedo() {
        return this.currentHistoryIndex < this.layersHistory.length - 1;
    }
    updateHistoryButtonsState() {
        const canUndo = this.canUndo();
        const canRedo = this.canRedo();
        if (this.editorHistoryUndoBlock && this.editorHistoryUndoBlock.firstElementChild) {
            const undoButton = this.editorHistoryUndoBlock.firstElementChild;
            if (canUndo) {
                undoButton.style.backgroundColor = '';
                undoButton.style.cursor = 'pointer';
            }
            else {
                undoButton.style.backgroundColor = '#f2f2f2';
                undoButton.style.cursor = 'default';
            }
        }
        if (this.editorHistoryRedoBlock && this.editorHistoryRedoBlock.firstElementChild) {
            const redoButton = this.editorHistoryRedoBlock.firstElementChild;
            if (canRedo) {
                redoButton.style.backgroundColor = '';
                redoButton.style.cursor = 'pointer';
            }
            else {
                redoButton.style.backgroundColor = '#f2f2f2';
                redoButton.style.cursor = 'default';
            }
        }
        console.debug('[history] Состояние кнопок: undo =', canUndo, ', redo =', canRedo);
    }
    async undo() {
        if (!this.canUndo()) {
            console.debug('[history] Undo невозможен');
            return false;
        }
        if (this.currentHistoryIndex === this.layersHistory.length - 1 && this.layersHistory.length >= 2) {
            this.currentHistoryIndex = this.layersHistory.length - 2;
        }
        else {
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
    async redo() {
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
    async restoreLayersFromHistory(historyItem) {
        this.isRestoringFromHistory = true;
        try {
            this.layouts = [];
            historyItem.layers.forEach(layout => {
                this.layouts.push(new _models_Layout__WEBPACK_IMPORTED_MODULE_1__.Layout(layout));
            });
            this.showLayoutList();
            this.updateLayouts();
            this.updateSum();
            await this.saveState();
            console.debug(`[history] Восстановлено ${this.layouts.length} слоёв`);
        }
        finally {
            this.isRestoringFromHistory = false;
        }
    }
    destroy() {
        console.debug('[editor] Очистка ресурсов редактора');
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
            this.loadingInterval = null;
        }
        this.events.destroy();
        this.canvases.forEach(canvas => {
            try {
                canvas.dispose();
            }
            catch (err) {
                console.error('[cleanup] Ошибка очистки canvas:', err);
            }
        });
        this.canvases = [];
        this.layersCanvases.forEach(canvas => {
            try {
                canvas.dispose();
            }
            catch (err) {
                console.error('[cleanup] Ошибка очистки layer canvas:', err);
            }
        });
        this.layersCanvases = [];
        console.debug('[editor] Ресурсы успешно очищены');
    }
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


/***/ }),

/***/ "./src/managers/EditorStorageManager.ts":
/*!**********************************************!*\
  !*** ./src/managers/EditorStorageManager.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EditorStorageManager: () => (/* binding */ EditorStorageManager)
/* harmony export */ });
class EditorStorageManager {
    constructor() {
        this.database = null;
        this.isReady = false;
        this.readyPromise = this.init();
    }
    async init() {
        return new Promise((resolve, reject) => {
            const openRequest = indexedDB.open("editor", 2);
            openRequest.onupgradeneeded = (event) => {
                const database = event.target.result;
                if (!database.objectStoreNames.contains('history')) {
                    database.createObjectStore('history', { keyPath: 'id' });
                }
                if (!database.objectStoreNames.contains('editor_state')) {
                    database.createObjectStore('editor_state', { keyPath: 'key' });
                }
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
    async waitForReady() {
        await this.readyPromise;
    }
    async saveEditorState(state) {
        await this.waitForReady();
        if (!this.database)
            throw new Error('Database не инициализирована');
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
    async loadEditorState() {
        await this.waitForReady();
        if (!this.database)
            throw new Error('Database не инициализирована');
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
        }
        catch (error) {
            console.error('Ошибка загрузки состояния редактора:', error);
            return null;
        }
    }
    async clearEditorState() {
        await this.waitForReady();
        if (!this.database)
            throw new Error('Database не инициализирована');
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
    async getUserId() {
        await this.waitForReady();
        if (!this.database)
            throw new Error('Database не инициализирована');
        const transaction = this.database.transaction(['user_data'], 'readwrite');
        const objectStore = transaction.objectStore('user_data');
        let userId = await this.getData(objectStore, 'userId');
        if (!userId) {
            userId = crypto.randomUUID();
            await this.putData(objectStore, 'userId', userId);
        }
        try {
            window.OpenReplay.setUserID(userId);
        }
        catch (error) {
            console.error('Ошибка установки ID пользователя в tracker:', error);
        }
        return userId;
    }
    async saveToHistory(item, description) {
        await this.waitForReady();
        if (!this.database)
            throw new Error('Database не инициализирована');
        const historyItem = {
            ...item,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            description: description || `Изменения от ${new Date().toLocaleString()}`
        };
        const transaction = this.database.transaction(['history'], 'readwrite');
        const objectStore = transaction.objectStore('history');
        await new Promise((resolve, reject) => {
            const request = objectStore.add(historyItem);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
        return historyItem.id;
    }
    async saveLayerOperation(operation, layout, side, type, description) {
        await this.waitForReady();
        if (!this.database)
            throw new Error('Database не инициализирована');
        const layerHistoryItem = {
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
        await new Promise((resolve, reject) => {
            const request = objectStore.add({ ...layerHistoryItem, isLayerOperation: true });
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
        return layerHistoryItem.id;
    }
    async getLayerHistory(filter, limit = 50) {
        await this.waitForReady();
        if (!this.database)
            throw new Error('Database не инициализирована');
        const transaction = this.database.transaction(['history'], 'readonly');
        const objectStore = transaction.objectStore('history');
        return new Promise((resolve, reject) => {
            const request = objectStore.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const allItems = request.result;
                const layerOperations = allItems
                    .filter((item) => item.isLayerOperation && item.side === filter.side && item.type === filter.type)
                    .map((item) => ({
                    id: item.id,
                    timestamp: item.timestamp,
                    operation: item.operation,
                    layout: item.layout,
                    side: item.side,
                    type: item.type,
                    description: item.description
                }))
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, limit);
                resolve(layerOperations);
            };
        });
    }
    async getRecentLayerOperations(filter, limit = 10) {
        return this.getLayerHistory(filter, limit);
    }
    async getHistory(filter, limit = 50) {
        await this.waitForReady();
        if (!this.database)
            throw new Error('Database не инициализирована');
        const transaction = this.database.transaction(['history'], 'readonly');
        const objectStore = transaction.objectStore('history');
        return new Promise((resolve, reject) => {
            const request = objectStore.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const allItems = request.result;
                const filteredItems = allItems
                    .filter(item => item.side === filter.side && item.type === filter.type)
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, limit);
                resolve(filteredItems);
            };
        });
    }
    async getHistoryItem(id) {
        await this.waitForReady();
        if (!this.database)
            throw new Error('Database не инициализирована');
        const transaction = this.database.transaction(['history'], 'readonly');
        const objectStore = transaction.objectStore('history');
        return new Promise((resolve, reject) => {
            const request = objectStore.get(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || null);
        });
    }
    async deleteHistoryItem(id) {
        await this.waitForReady();
        if (!this.database)
            throw new Error('Database не инициализирована');
        const transaction = this.database.transaction(['history'], 'readwrite');
        const objectStore = transaction.objectStore('history');
        await new Promise((resolve, reject) => {
            const request = objectStore.delete(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    async clearHistory(filter) {
        await this.waitForReady();
        if (!this.database)
            throw new Error('Database не инициализирована');
        const transaction = this.database.transaction(['history'], 'readwrite');
        const objectStore = transaction.objectStore('history');
        if (!filter) {
            await new Promise((resolve, reject) => {
                const request = objectStore.clear();
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        }
        else {
            const allItems = await this.getHistory(filter, 1000);
            for (const item of allItems) {
                await this.deleteHistoryItem(item.id);
            }
        }
    }
    async saveLayers(layers) {
        await this.waitForReady();
        if (!this.database)
            throw new Error('Database не инициализирована');
        const transaction = this.database.transaction(['editor_state'], 'readwrite');
        const objectStore = transaction.objectStore('editor_state');
        await this.putData(objectStore, 'layers', layers);
    }
    async loadLayers() {
        await this.waitForReady();
        if (!this.database)
            throw new Error('Database не инициализирована');
        try {
            const transaction = this.database.transaction(['editor_state'], 'readonly');
            const objectStore = transaction.objectStore('editor_state');
            const layers = await this.getData(objectStore, 'layers');
            return layers || null;
        }
        catch (error) {
            console.error('Ошибка загрузки слоёв:', error);
            return null;
        }
    }
    putData(objectStore, key, value) {
        return new Promise((resolve, reject) => {
            const request = objectStore.put({ key, value });
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    getData(objectStore, key) {
        return new Promise((resolve, reject) => {
            const request = objectStore.get(key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result?.value || null);
        });
    }
    deleteData(objectStore, key) {
        return new Promise((resolve, reject) => {
            const request = objectStore.delete(key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
}


/***/ }),

/***/ "./src/models/Layout.ts":
/*!******************************!*\
  !*** ./src/models/Layout.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Layout: () => (/* binding */ Layout)
/* harmony export */ });
const DEFAULT_VALUES = {
    POSITION: { x: 0.5, y: 0.5 },
    SIZE: 1,
    ASPECT_RATIO: 1,
    ANGLE: 0,
    TEXT: 'PrintLoop',
    FONT: { family: 'Arial', size: 12 },
};
class Layout {
    constructor(props) {
        this.id = props.id || Layout.generateId();
        this.type = props.type;
        this.position = props.position || { ...DEFAULT_VALUES.POSITION };
        this.size = this.validateSize(props.size ?? DEFAULT_VALUES.SIZE);
        this.aspectRatio = this.validateAspectRatio(props.aspectRatio ?? DEFAULT_VALUES.ASPECT_RATIO);
        this.view = props.view;
        this.angle = this.normalizeAngle(props.angle ?? DEFAULT_VALUES.ANGLE);
        this.name = props.name ?? null;
        this._relativeWidth = props._relativeWidth;
        if (props.type === 'image') {
            this.url = props.url;
        }
        else if (props.type === 'text') {
            this.text = props.text || DEFAULT_VALUES.TEXT;
            this.font = props.font ? { ...props.font } : { ...DEFAULT_VALUES.FONT };
        }
    }
    static generateId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
    validateSize(size) {
        if (size <= 0) {
            console.warn(`Invalid size ${size}, using default ${DEFAULT_VALUES.SIZE}`);
            return DEFAULT_VALUES.SIZE;
        }
        return size;
    }
    validateAspectRatio(ratio) {
        if (ratio <= 0) {
            console.warn(`Invalid aspect ratio ${ratio}, using default ${DEFAULT_VALUES.ASPECT_RATIO}`);
            return DEFAULT_VALUES.ASPECT_RATIO;
        }
        return ratio;
    }
    normalizeAngle(angle) {
        const normalized = angle % 360;
        return normalized < 0 ? normalized + 360 : normalized;
    }
    isImageLayout() {
        return this.type === 'image' && this.url !== undefined;
    }
    isTextLayout() {
        return this.type === 'text' && this.text !== undefined && this.font !== undefined;
    }
    setPosition(x, y) {
        this.position = { x, y };
    }
    move(dx, dy) {
        this.position.x += dx;
        this.position.y += dy;
    }
    setSize(size) {
        this.size = this.validateSize(size);
    }
    rotate(angle) {
        this.angle = this.normalizeAngle(this.angle + angle);
    }
    setAngle(angle) {
        this.angle = this.normalizeAngle(angle);
    }
    setText(text) {
        if (this.isTextLayout()) {
            this.text = text;
        }
    }
    setFont(font) {
        if (this.isTextLayout() && this.font) {
            this.font = { ...this.font, ...font };
        }
    }
    clone() {
        if (this.type === 'image') {
            const props = {
                type: 'image',
                url: this.url,
                position: { ...this.position },
                size: this.size,
                aspectRatio: this.aspectRatio,
                view: this.view,
                angle: this.angle,
                name: this.name,
            };
            const cloned = new Layout(props);
            cloned._relativeWidth = this._relativeWidth;
            return cloned;
        }
        else {
            const props = {
                type: 'text',
                position: { ...this.position },
                size: this.size,
                aspectRatio: this.aspectRatio,
                view: this.view,
                angle: this.angle,
                name: this.name,
            };
            if (this.text !== undefined) {
                props.text = this.text;
            }
            if (this.font !== undefined) {
                props.font = { ...this.font };
            }
            const cloned = new Layout(props);
            cloned._relativeWidth = this._relativeWidth;
            return cloned;
        }
    }
    toJSON() {
        const base = {
            id: this.id,
            type: this.type,
            position: this.position,
            size: this.size,
            aspectRatio: this.aspectRatio,
            view: this.view,
            angle: this.angle,
            name: this.name,
            _relativeWidth: this._relativeWidth,
        };
        if (this.type === 'image') {
            return { ...base, url: this.url };
        }
        else if (this.type === 'text') {
            return { ...base, text: this.text, font: this.font };
        }
        return base;
    }
    static fromJSON(json) {
        return new Layout(json);
    }
    static createImage(props) {
        return new Layout({ ...props, type: 'image' });
    }
    static createText(props) {
        return new Layout({ ...props, type: 'text' });
    }
}


/***/ }),

/***/ "./src/utils/TypedEventEmitter.ts":
/*!****************************************!*\
  !*** ./src/utils/TypedEventEmitter.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   TypedEventEmitter: () => (/* binding */ TypedEventEmitter)
/* harmony export */ });
class TypedEventEmitter {
    constructor() {
        this.listeners = new Map();
    }
    on(event, listener) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(listener);
    }
    once(event, listener) {
        const onceWrapper = (detail) => {
            listener(detail);
            this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
    }
    off(event, listener) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(listener);
            if (eventListeners.size === 0) {
                this.listeners.delete(event);
            }
        }
    }
    emit(event, detail) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(listener => {
                try {
                    listener(detail);
                }
                catch (error) {
                    console.error(`[EventEmitter] Ошибка в обработчике события "${String(event)}":`, error);
                }
            });
        }
    }
    removeAllListeners(event) {
        if (event) {
            this.listeners.delete(event);
        }
        else {
            this.listeners.clear();
        }
    }
    listenerCount(event) {
        return this.listeners.get(event)?.size || 0;
    }
    hasListeners(event) {
        return this.listenerCount(event) > 0;
    }
    eventNames() {
        return Array.from(this.listeners.keys());
    }
    destroy() {
        this.listeners.clear();
    }
}


/***/ }),

/***/ "./src/utils/api.ts":
/*!**************************!*\
  !*** ./src/utils/api.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createProduct: () => (/* binding */ createProduct),
/* harmony export */   generateImage: () => (/* binding */ generateImage)
/* harmony export */ });
/* harmony import */ var _managers_EditorStorageManager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../managers/EditorStorageManager */ "./src/managers/EditorStorageManager.ts");

async function generateImage({ uri, prompt, shirtColor, image, withAi, layoutId, isNew = true, background = true, }) {
    const tempStorageManager = new _managers_EditorStorageManager__WEBPACK_IMPORTED_MODULE_0__.EditorStorageManager();
    const userId = await tempStorageManager.getUserId();
    const formData = new FormData();
    formData.set('userId', userId);
    formData.set('prompt', prompt || "");
    formData.set('shirtColor', shirtColor);
    formData.set('placement', 'center');
    formData.set('printSize', "big");
    formData.set('transferType', '');
    formData.set('request_type', 'generate');
    formData.set('background', background?.toString() || "true");
    if (layoutId)
        formData.set('layoutId', layoutId);
    if (image) {
        console.debug('[generate image]', image);
        const [header, data] = image.split(',');
        const type = header.split(':')[1].split(';')[0];
        console.debug('[generate image] [type]', type);
        const byteCharacters = atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        formData.set('request_type', 'image');
        formData.set('user_image', new Blob([byteArray], { type: "image/png" }));
        formData.set('transferType', withAi ? "ai" : "no-ai");
    }
    if (!isNew) {
        formData.set('request_type', 'edit');
    }
    const response = await fetch(uri, {
        method: "POST",
        body: formData,
    });
    const responseData = await response.json();
    return responseData.image_url || responseData.image;
}
function createProduct({ quantity, name, size, color, sides, article, price }) {
    const productId = '698341642832_' + Date.now();
    const designVariant = sides.length > 1 ? `<a target="_blank" href="${sides[0]?.image_url}" target="_blank">${sides[0]?.image_url.slice(-10)}</a>, <a target="_blank" href="${sides[1]?.image_url}" target="_blank">${sides[1]?.image_url.slice(-10)}</a>` : `<a target="_blank" href="${sides[0]?.image_url}" target="_blank">${sides[0]?.image_url.slice(-10)}</a>`;
    const resultProduct = {
        id: productId,
        name,
        price,
        quantity: quantity,
        img: sides[0]?.image_url,
        options: [
            { option: 'Размер', variant: size },
            { option: 'Дизайн', variant: designVariant },
            { option: 'Артикул', variant: article },
            { option: 'Цвет', variant: color.name },
            { option: 'Принт', variant: sides.length == 1 ? 'Односторонний' : 'Двухсторонний' },
        ]
    };
    console.debug('[cart] add product', resultProduct);
    if (typeof window.tcart__addProduct === 'function') {
        try {
            window.tcart__addProduct(resultProduct);
            try {
                window.ym(103279214, 'reachGoal', 'add_to_cart');
            }
            catch (error) { }
        }
        catch (error) {
            console.error('[cart] Ошибка при добавлении продукта в корзину', error);
        }
    }
    else {
        console.warn('[cart] Корзина Tilda не загружена.');
    }
}


/***/ }),

/***/ "./src/utils/canvasUtils.ts":
/*!**********************************!*\
  !*** ./src/utils/canvasUtils.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   calculateLayoutDimensions: () => (/* binding */ calculateLayoutDimensions),
/* harmony export */   renderLayout: () => (/* binding */ renderLayout),
/* harmony export */   renderLayoutToCanvas: () => (/* binding */ renderLayoutToCanvas)
/* harmony export */ });
function calculateLayoutDimensions(layout, product, containerWidth, containerHeight) {
    const printConfig = product.printConfig.find(pc => pc.side === layout.view);
    if (!printConfig) {
        throw new Error(`Print config not found for side: ${layout.view}`);
    }
    const printAreaWidth = (printConfig.size.width / 600) * containerWidth;
    const printAreaHeight = (printConfig.size.height / 600) * containerHeight;
    const printAreaLeft = Math.round((containerWidth - printAreaWidth) / 2 + (printConfig.position.x / 100) * containerWidth);
    const printAreaTop = Math.round((containerHeight - printAreaHeight) / 2 + (printConfig.position.y / 100) * containerHeight);
    const left = printAreaLeft + (printAreaWidth * layout.position.x);
    const top = printAreaTop + (printAreaHeight * layout.position.y);
    return {
        left,
        top,
        scaleX: layout.size,
        scaleY: layout.size * layout.aspectRatio,
        angle: layout.angle,
        printAreaWidth,
        printAreaHeight,
        printAreaLeft,
        printAreaTop
    };
}
async function renderLayout(params) {
    const { layout, product, containerWidth, containerHeight, loadImage } = params;
    const dimensions = calculateLayoutDimensions(layout, product, containerWidth, containerHeight);
    const fabric = window.fabric;
    if (!fabric) {
        console.error('[renderLayout] fabric.js не загружен');
        return null;
    }
    if (layout.isImageLayout()) {
        const img = await loadImage(layout.url);
        const image = new fabric.Image(img);
        let actualScale = layout.size;
        const relativeWidth = layout._relativeWidth;
        if (relativeWidth && relativeWidth > 0) {
            const targetWidth = dimensions.printAreaWidth * relativeWidth;
            actualScale = targetWidth / img.width;
            console.debug(`[renderLayout] Адаптация к новому размеру: relativeWidth=${relativeWidth.toFixed(3)}, targetWidth=${targetWidth.toFixed(1)}px, scale=${actualScale.toFixed(3)}`);
        }
        else if (layout.size === 1 && img.width > dimensions.printAreaWidth) {
            actualScale = dimensions.printAreaWidth / img.width;
            layout.size = actualScale;
            const objectWidth = img.width * actualScale;
            const relW = objectWidth / dimensions.printAreaWidth;
            layout._relativeWidth = relW;
            console.debug(`[renderLayout] Автоподгонка размера: ${img.width}px → ${dimensions.printAreaWidth}px, scale=${actualScale.toFixed(3)}, relativeWidth=${relW.toFixed(3)}`);
        }
        else if (!relativeWidth || relativeWidth === 0) {
            const objectWidth = img.width * layout.size;
            const relW = objectWidth / dimensions.printAreaWidth;
            layout._relativeWidth = relW;
            console.debug(`[renderLayout] Вычислен _relativeWidth для старого layout: ${relW.toFixed(3)}`);
        }
        image.set({
            left: dimensions.left,
            top: dimensions.top,
            scaleX: actualScale,
            scaleY: actualScale * layout.aspectRatio,
            angle: dimensions.angle,
            name: layout.id,
            layoutUrl: layout.url,
        });
        return image;
    }
    else if (layout.isTextLayout()) {
        const text = new fabric.Text(layout.text, {
            fontFamily: layout.font.family,
            fontSize: layout.font.size,
        });
        text.set({
            left: dimensions.left,
            top: dimensions.top,
            scaleX: dimensions.scaleX,
            scaleY: dimensions.scaleY,
            angle: dimensions.angle,
            name: layout.id,
        });
        return text;
    }
    return null;
}
async function renderLayoutToCanvas(ctx, layout, product, containerWidth, containerHeight, loadImage) {
    const dimensions = calculateLayoutDimensions(layout, product, containerWidth, containerHeight);
    if (layout.isImageLayout()) {
        const img = await loadImage(layout.url);
        ctx.save();
        ctx.translate(dimensions.left, dimensions.top);
        ctx.rotate((dimensions.angle * Math.PI) / 180);
        const width = img.width * dimensions.scaleX;
        const height = img.height * dimensions.scaleY;
        ctx.drawImage(img, 0, 0, width, height);
        ctx.restore();
    }
    else if (layout.isTextLayout()) {
        ctx.save();
        ctx.translate(dimensions.left, dimensions.top);
        ctx.rotate((dimensions.angle * Math.PI) / 180);
        ctx.font = `${layout.font.size * dimensions.scaleX}px ${layout.font.family}`;
        ctx.fillStyle = 'black';
        ctx.fillText(layout.text, 0, 0);
        ctx.restore();
    }
}


/***/ }),

/***/ "./src/utils/tildaUtils.ts":
/*!*********************************!*\
  !*** ./src/utils/tildaUtils.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getLastChild: () => (/* binding */ getLastChild)
/* harmony export */ });
function getLastChild(element) {
    if (!element)
        return null;
    if (!element.firstElementChild)
        return element;
    return getLastChild(element.firstElementChild);
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*******************************!*\
  !*** ./src/entries/editor.ts ***!
  \*******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _components_Editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../components/Editor */ "./src/components/Editor.ts");

if (typeof window !== 'undefined') {
    window.Editor = _components_Editor__WEBPACK_IMPORTED_MODULE_0__["default"];
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_components_Editor__WEBPACK_IMPORTED_MODULE_0__["default"]);

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNWd0U7QUFDOUI7QUFDUztBQUNZO0FBQ0g7QUFDbUI7QUFDL0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDLDBDQUEwQztBQUM1QjtBQUNmLHVCQUF1QjtBQUN2Qix3QkFBd0I7QUFDeEIsdUJBQXVCO0FBQ3ZCLHVCQUF1QjtBQUN2Qix5QkFBeUI7QUFDekIsa0JBQWtCLHdEQUF3RDtBQUMxRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEIsdUVBQWlCO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0Esa0NBQWtDLGdGQUFvQjtBQUN0RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBaUQsMkJBQTJCO0FBQzVFO0FBQ0E7QUFDQSxpREFBaUQsa0RBQU07QUFDdkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMkMsS0FBSztBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLHdFQUF3RSxTQUFTO0FBQ2pGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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b0Qsb0NBQW9DO0FBQ3hGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQiw2RUFBeUI7QUFDcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsOEJBQThCO0FBQ3pEO0FBQ0E7QUFDQTtBQUNB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UztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ087QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0IscUNBQXFDLEtBQUssbUJBQW1CO0FBQ25GO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7OztBQ3hHTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztVQ05BO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0EsRTs7Ozs7V0NQQSx3Rjs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0QsRTs7Ozs7Ozs7Ozs7Ozs7O0FDTjBDO0FBQzFDO0FBQ0Esb0JBQW9CLDBEQUFNO0FBQzFCO0FBQ0EsaUVBQWUsMERBQU0sRUFBQyIsInNvdXJjZXMiOlsid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvY29tcG9uZW50cy9FZGl0b3IudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9tYW5hZ2Vycy9FZGl0b3JTdG9yYWdlTWFuYWdlci50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL21vZGVscy9MYXlvdXQudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy91dGlscy9UeXBlZEV2ZW50RW1pdHRlci50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL3V0aWxzL2FwaS50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL3V0aWxzL2NhbnZhc1V0aWxzLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvdXRpbHMvdGlsZGFVdGlscy50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9lbnRyaWVzL2VkaXRvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJlZGl0b3JcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wiZWRpdG9yXCJdID0gZmFjdG9yeSgpO1xufSkodGhpcywgKCkgPT4ge1xucmV0dXJuICIsImltcG9ydCB7IEVkaXRvclN0b3JhZ2VNYW5hZ2VyIH0gZnJvbSAnLi4vbWFuYWdlcnMvRWRpdG9yU3RvcmFnZU1hbmFnZXInO1xuaW1wb3J0IHsgTGF5b3V0IH0gZnJvbSAnLi4vbW9kZWxzL0xheW91dCc7XG5pbXBvcnQgeyBnZXRMYXN0Q2hpbGQgfSBmcm9tICcuLi91dGlscy90aWxkYVV0aWxzJztcbmltcG9ydCB7IFR5cGVkRXZlbnRFbWl0dGVyIH0gZnJvbSAnLi4vdXRpbHMvVHlwZWRFdmVudEVtaXR0ZXInO1xuaW1wb3J0IHsgZ2VuZXJhdGVJbWFnZSwgY3JlYXRlUHJvZHVjdCB9IGZyb20gJy4uL3V0aWxzL2FwaSc7XG5pbXBvcnQgeyByZW5kZXJMYXlvdXQsIGNhbGN1bGF0ZUxheW91dERpbWVuc2lvbnMgfSBmcm9tICcuLi91dGlscy9jYW52YXNVdGlscyc7XG5jb25zdCBsb2dJc3N1ZSA9IChrZXksIHBheWxvYWQpID0+IHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5PcGVuUmVwbGF5Py5oYW5kbGVFcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgd2luZG93Lk9wZW5SZXBsYXkuaGFuZGxlRXJyb3IobmV3IEVycm9yKGtleSksIHBheWxvYWQpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnT3BlblJlcGxheS5oYW5kbGVFcnJvcicsIGtleSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbT3BlblJlcGxheV0gRmFpbGVkIHRvIGxvZyBpc3N1ZTonLCBlKTtcbiAgICB9XG59O1xuY29uc3QgQ09OU1RBTlRTID0ge1xuICAgIFNUQVRFX0VYUElSQVRJT05fREFZUzogMzAsXG4gICAgQ0FOVkFTX0FSRUFfSEVJR0hUOiA2MDAsXG4gICAgTE9BRElOR19JTlRFUlZBTF9NUzogMTAwLFxufTtcbmV4cG9ydCB2YXIgRWRpdG9yRXZlbnRUeXBlO1xuKGZ1bmN0aW9uIChFZGl0b3JFdmVudFR5cGUpIHtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJNT0NLVVBfTE9BRElOR1wiXSA9IFwibW9ja3VwLWxvYWRpbmdcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJNT0NLVVBfVVBEQVRFRFwiXSA9IFwibW9ja3VwLXVwZGF0ZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJMT0FESU5HX1RJTUVfVVBEQVRFRFwiXSA9IFwibG9hZGluZy10aW1lLXVwZGF0ZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJTVEFURV9DSEFOR0VEXCJdID0gXCJzdGF0ZS1jaGFuZ2VkXCI7XG4gICAgRWRpdG9yRXZlbnRUeXBlW1wiTEFZT1VUX0FEREVEXCJdID0gXCJsYXlvdXQtYWRkZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJMQVlPVVRfUkVNT1ZFRFwiXSA9IFwibGF5b3V0LXJlbW92ZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJMQVlPVVRfVVBEQVRFRFwiXSA9IFwibGF5b3V0LXVwZGF0ZWRcIjtcbn0pKEVkaXRvckV2ZW50VHlwZSB8fCAoRWRpdG9yRXZlbnRUeXBlID0ge30pKTtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEVkaXRvciB7XG4gICAgZ2V0IHNlbGVjdFR5cGUoKSB7IHJldHVybiB0aGlzLl9zZWxlY3RUeXBlOyB9XG4gICAgZ2V0IHNlbGVjdENvbG9yKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0Q29sb3I7IH1cbiAgICBnZXQgc2VsZWN0U2lkZSgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdFNpZGU7IH1cbiAgICBnZXQgc2VsZWN0U2l6ZSgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdFNpemU7IH1cbiAgICBnZXQgc2VsZWN0TGF5b3V0KCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0TGF5b3V0OyB9XG4gICAgY29uc3RydWN0b3IoeyBibG9ja3MsIHByb2R1Y3RDb25maWdzLCBmb3JtQ29uZmlnLCBhcGlDb25maWcsIG9wdGlvbnMgfSkge1xuICAgICAgICB0aGlzLnF1YW50aXR5Rm9ybUJsb2NrID0gbnVsbDtcbiAgICAgICAgdGhpcy5mb3JtQmxvY2sgPSBudWxsO1xuICAgICAgICB0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSA9IG51bGw7XG4gICAgICAgIHRoaXMuZm9ybUJ1dHRvbiA9IG51bGw7XG4gICAgICAgIHRoaXMuX3NlbGVjdExheW91dCA9IG51bGw7XG4gICAgICAgIHRoaXMubGF5b3V0cyA9IFtdO1xuICAgICAgICB0aGlzLmNhbnZhc2VzID0gW107XG4gICAgICAgIHRoaXMubGF5ZXJzQ2FudmFzZXMgPSBbXTtcbiAgICAgICAgdGhpcy5hY3RpdmVDYW52YXMgPSBudWxsO1xuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBUeXBlZEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmxheWVyc0hpc3RvcnkgPSBbXTtcbiAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID0gLTE7XG4gICAgICAgIHRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzTG9hZGluZyA9IHRydWU7XG4gICAgICAgIHRoaXMuaXNBZGRpbmdUb0NhcnQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc0FkZGVkVG9DYXJ0ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNHZW5lcmF0aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMubG9hZGluZ1RpbWUgPSAwO1xuICAgICAgICB0aGlzLmxvYWRpbmdJbnRlcnZhbCA9IG51bGw7XG4gICAgICAgIHRoaXMuY29sb3JCbG9ja3MgPSBbXTtcbiAgICAgICAgdGhpcy5zaXplQmxvY2tzID0gW107XG4gICAgICAgIHRoaXMucHJvZHVjdEJsb2NrcyA9IFtdO1xuICAgICAgICB0aGlzLmxvYWRlZFVzZXJJbWFnZSA9IG51bGw7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbWFnZUNhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmxvYWRpbmdFbGVtZW50c0NhY2hlID0ge307XG4gICAgICAgIHRoaXMucHJvZHVjdENhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLm1vY2t1cENhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICBpZiAoIXByb2R1Y3RDb25maWdzIHx8IHByb2R1Y3RDb25maWdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgbG9nSXNzdWUoJ2VkaXRvcl9pbml0X2Vycm9yJywge1xuICAgICAgICAgICAgICAgIGVycm9yOiAncHJvZHVjdF9jb25maWdzX21pc3NpbmcnLFxuICAgICAgICAgICAgICAgIGhhc1Byb2R1Y3RDb25maWdzOiAhIXByb2R1Y3RDb25maWdzLFxuICAgICAgICAgICAgICAgIHByb2R1Y3RzQ291bnQ6IHByb2R1Y3RDb25maWdzPy5sZW5ndGggfHwgMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tFZGl0b3JdINCd0LUg0L/RgNC10LTQvtGB0YLQsNCy0LvQtdC90Ysg0LrQvtC90YTQuNCz0YPRgNCw0YbQuNC4INC/0YDQvtC00YPQutGC0L7QsicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RvcmFnZU1hbmFnZXIgPSBuZXcgRWRpdG9yU3RvcmFnZU1hbmFnZXIoKTtcbiAgICAgICAgdGhpcy5wcm9kdWN0Q29uZmlncyA9IHByb2R1Y3RDb25maWdzO1xuICAgICAgICB0aGlzLmFwaUNvbmZpZyA9IGFwaUNvbmZpZztcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jayA9IHRoaXMuZ2V0UmVxdWlyZWRFbGVtZW50KGJsb2Nrcy5lZGl0b3JCbG9ja0NsYXNzKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VTaWRlQnV0dG9uID0gdGhpcy5nZXRSZXF1aXJlZEVsZW1lbnQoYmxvY2tzLmNoYW5nZVNpZGVCdXR0b25DbGFzcyk7XG4gICAgICAgIHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jayA9IHRoaXMuZ2V0UmVxdWlyZWRFbGVtZW50KGJsb2Nrcy5lZGl0b3JIaXN0b3J5VW5kb0Jsb2NrQ2xhc3MpO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2sgPSB0aGlzLmdldFJlcXVpcmVkRWxlbWVudChibG9ja3MuZWRpdG9ySGlzdG9yeVJlZG9CbG9ja0NsYXNzKTtcbiAgICAgICAgdGhpcy5xdWFudGl0eUZvcm1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclF1YW50aXR5Rm9ybUJsb2NrQ2xhc3MpO1xuICAgICAgICBjb25zdCBwcm9kdWN0TGlzdEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MucHJvZHVjdExpc3RCbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKHByb2R1Y3RMaXN0QmxvY2spXG4gICAgICAgICAgICB0aGlzLnByb2R1Y3RMaXN0QmxvY2sgPSBwcm9kdWN0TGlzdEJsb2NrO1xuICAgICAgICBjb25zdCBwcm9kdWN0SXRlbUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MucHJvZHVjdEl0ZW1DbGFzcyk7XG4gICAgICAgIGlmIChwcm9kdWN0SXRlbUJsb2NrKVxuICAgICAgICAgICAgdGhpcy5wcm9kdWN0SXRlbUJsb2NrID0gcHJvZHVjdEl0ZW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yQ29sb3JzTGlzdEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yQ29sb3JzTGlzdEJsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yQ29sb3JzTGlzdEJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JDb2xvcnNMaXN0QmxvY2sgPSBlZGl0b3JDb2xvcnNMaXN0QmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvckNvbG9ySXRlbUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yQ29sb3JJdGVtQmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JDb2xvckl0ZW1CbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yQ29sb3JJdGVtQmxvY2sgPSBlZGl0b3JDb2xvckl0ZW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yU2l6ZXNMaXN0QmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JTaXplc0xpc3RCbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclNpemVzTGlzdEJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JTaXplc0xpc3RCbG9jayA9IGVkaXRvclNpemVzTGlzdEJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JTaXplSXRlbUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yU2l6ZUl0ZW1CbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclNpemVJdGVtQmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvclNpemVJdGVtQmxvY2sgPSBlZGl0b3JTaXplSXRlbUJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JMYXlvdXRzTGlzdEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yTGF5b3V0c0xpc3RCbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvckxheW91dHNMaXN0QmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2sgPSBlZGl0b3JMYXlvdXRzTGlzdEJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JMYXlvdXRJdGVtQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JMYXlvdXRJdGVtQmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9jayA9IGVkaXRvckxheW91dEl0ZW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbkNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclVwbG9hZEltYWdlQnV0dG9uKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbiA9IGVkaXRvclVwbG9hZEltYWdlQnV0dG9uO1xuICAgICAgICBjb25zdCBlZGl0b3JVcGxvYWRWaWV3QmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JVcGxvYWRWaWV3QmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvclVwbG9hZFZpZXdCbG9jayA9IGVkaXRvclVwbG9hZFZpZXdCbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRDYW5jZWxCdXR0b24gPSBlZGl0b3JVcGxvYWRDYW5jZWxCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvckxvYWRXaXRoQWlCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbiA9IGVkaXRvckxvYWRXaXRoQWlCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbiA9IGVkaXRvckxvYWRXaXRob3V0QWlCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yUmVtb3ZlQmFja2dyb3VuZEJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yUmVtb3ZlQmFja2dyb3VuZEJ1dHRvbiA9IGVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvckFkZE9yZGVyQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yQWRkT3JkZXJCdXR0b25DbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JBZGRPcmRlckJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24gPSBlZGl0b3JBZGRPcmRlckJ1dHRvbjtcbiAgICAgICAgY29uc3QgZWRpdG9yU3VtQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JTdW1CbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclN1bUJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JTdW1CbG9jayA9IGVkaXRvclN1bUJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JQcm9kdWN0TmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclByb2R1Y3ROYW1lQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yUHJvZHVjdE5hbWUpXG4gICAgICAgICAgICB0aGlzLmVkaXRvclByb2R1Y3ROYW1lID0gZWRpdG9yUHJvZHVjdE5hbWU7XG4gICAgICAgIHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrVmlld0NsYXNzID0gYmxvY2tzLmVkaXRvckxheW91dEl0ZW1CbG9ja1ZpZXdDbGFzcztcbiAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tOYW1lQ2xhc3MgPSBibG9ja3MuZWRpdG9yTGF5b3V0SXRlbUJsb2NrTmFtZUNsYXNzO1xuICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja1JlbW92ZUNsYXNzID0gYmxvY2tzLmVkaXRvckxheW91dEl0ZW1CbG9ja1JlbW92ZUNsYXNzO1xuICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja0VkaXRDbGFzcyA9IGJsb2Nrcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tFZGl0Q2xhc3M7XG4gICAgICAgIGlmIChmb3JtQ29uZmlnKSB7XG4gICAgICAgICAgICB0aGlzLmZvcm1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZm9ybUNvbmZpZy5mb3JtQmxvY2tDbGFzcyk7XG4gICAgICAgICAgICB0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSA9IGZvcm1Db25maWcuZm9ybUlucHV0VmFyaWFibGVOYW1lO1xuICAgICAgICAgICAgdGhpcy5mb3JtQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihmb3JtQ29uZmlnLmZvcm1CdXR0b25DbGFzcyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGVmYXVsdFByb2R1Y3QgPSBwcm9kdWN0Q29uZmlnc1swXTtcbiAgICAgICAgaWYgKCFkZWZhdWx0UHJvZHVjdCkge1xuICAgICAgICAgICAgbG9nSXNzdWUoJ2VkaXRvcl9pbml0X2Vycm9yJywge1xuICAgICAgICAgICAgICAgIGVycm9yOiAnZGVmYXVsdF9wcm9kdWN0X25vdF9mb3VuZCcsXG4gICAgICAgICAgICAgICAgcHJvZHVjdHNDb3VudDogcHJvZHVjdENvbmZpZ3MubGVuZ3RoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW0VkaXRvcl0g0J3QtSDQvdCw0LnQtNC10L0g0LTQtdGE0L7Qu9GC0L3Ri9C5INC/0YDQvtC00YPQutGCJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGVmYXVsdE1vY2t1cCA9IGRlZmF1bHRQcm9kdWN0Lm1vY2t1cHNbMF07XG4gICAgICAgIGlmICghZGVmYXVsdE1vY2t1cCkge1xuICAgICAgICAgICAgbG9nSXNzdWUoJ2VkaXRvcl9pbml0X2Vycm9yJywge1xuICAgICAgICAgICAgICAgIGVycm9yOiAnZGVmYXVsdF9tb2NrdXBfbm90X2ZvdW5kJyxcbiAgICAgICAgICAgICAgICBwcm9kdWN0VHlwZTogZGVmYXVsdFByb2R1Y3QudHlwZSxcbiAgICAgICAgICAgICAgICBtb2NrdXBzQ291bnQ6IGRlZmF1bHRQcm9kdWN0Lm1vY2t1cHM/Lmxlbmd0aCB8fCAwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW0VkaXRvcl0g0J3QtSDQvdCw0LnQtNC10L0g0LTQtdGE0L7Qu9GC0L3Ri9C5IG1vY2t1cCcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghZGVmYXVsdE1vY2t1cC5jb2xvciB8fCAhZGVmYXVsdE1vY2t1cC5jb2xvci5uYW1lKSB7XG4gICAgICAgICAgICBsb2dJc3N1ZSgnZWRpdG9yX2luaXRfZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgZXJyb3I6ICdkZWZhdWx0X2NvbG9yX25vdF9mb3VuZCcsXG4gICAgICAgICAgICAgICAgcHJvZHVjdFR5cGU6IGRlZmF1bHRQcm9kdWN0LnR5cGUsXG4gICAgICAgICAgICAgICAgbW9ja3VwOiBkZWZhdWx0TW9ja3VwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW0VkaXRvcl0g0KbQstC10YIg0L3QtSDQvtC/0YDQtdC00LXQu9C10L0g0LIg0LTQtdGE0L7Qu9GC0L3QvtC8IG1vY2t1cCcpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gZGVmYXVsdE1vY2t1cC5jb2xvcjtcbiAgICAgICAgdGhpcy5fc2VsZWN0U2lkZSA9IGRlZmF1bHRNb2NrdXAuc2lkZTtcbiAgICAgICAgdGhpcy5fc2VsZWN0VHlwZSA9IGRlZmF1bHRQcm9kdWN0LnR5cGU7XG4gICAgICAgIHRoaXMuX3NlbGVjdFNpemUgPSBkZWZhdWx0UHJvZHVjdC5zaXplcz8uWzBdIHx8ICdNJztcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jay5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgICAgIHRoaXMuY3JlYXRlQmFja2dyb3VuZEJsb2NrKCk7XG4gICAgICAgIHRoaXMubW9ja3VwQmxvY2sgPSB0aGlzLmNyZWF0ZU1vY2t1cEJsb2NrKCk7XG4gICAgICAgIHRoaXMuY2FudmFzZXNDb250YWluZXIgPSB0aGlzLmNyZWF0ZUNhbnZhc2VzQ29udGFpbmVyKCk7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZGluZ0Jsb2NrID0gdGhpcy5jcmVhdGVFZGl0b3JMb2FkaW5nQmxvY2soKTtcbiAgICAgICAgdGhpcy5pbml0RXZlbnRzKCk7XG4gICAgICAgIHRoaXMuaW5pdEtleWJvYXJkU2hvcnRjdXRzKCk7XG4gICAgICAgIHRoaXMuaW5pdExvYWRpbmdFdmVudHMoKTtcbiAgICAgICAgdGhpcy5pbml0VUlDb21wb25lbnRzKCk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZUVkaXRvcigpO1xuICAgICAgICB3aW5kb3cuZ2V0TGF5b3V0cyA9ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxheW91dHMubWFwKGxheW91dCA9PiAoeyAuLi5sYXlvdXQsIHVybDogdW5kZWZpbmVkIH0pKTtcbiAgICAgICAgfTtcbiAgICAgICAgd2luZG93LmxvYWRMYXlvdXRzID0gKGxheW91dHMpID0+IHtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0cyA9IGxheW91dHMubWFwKGxheW91dCA9PiBMYXlvdXQuZnJvbUpTT04obGF5b3V0KSk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgfTtcbiAgICAgICAgd2luZG93LmV4cG9ydFByaW50ID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZXhwb3J0ZWRBcnQgPSBhd2FpdCB0aGlzLmV4cG9ydEFydChmYWxzZSwgNDA5Nik7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHNpZGUgb2YgT2JqZWN0LmtleXMoZXhwb3J0ZWRBcnQpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZG93bmxvYWRMaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZG93bmxvYWRMaW5rKTtcbiAgICAgICAgICAgICAgICBkb3dubG9hZExpbmsuaHJlZiA9IGV4cG9ydGVkQXJ0W3NpZGVdO1xuICAgICAgICAgICAgICAgIGRvd25sb2FkTGluay50YXJnZXQgPSAnX3NlbGYnO1xuICAgICAgICAgICAgICAgIGRvd25sb2FkTGluay5kb3dubG9hZCA9IGAke3NpZGV9LnBuZ2A7XG4gICAgICAgICAgICAgICAgZG93bmxvYWRMaW5rLmNsaWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZXhwb3J0ZWRBcnQ7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGluaXRVSUNvbXBvbmVudHMoKSB7XG4gICAgICAgIGlmICh0aGlzLmNoYW5nZVNpZGVCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlU2lkZUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICB0aGlzLmNoYW5nZVNpZGVCdXR0b24ub25jbGljayA9ICgpID0+IHRoaXMuY2hhbmdlU2lkZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEhpc3RvcnlVbmRvQmxvY2soKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRIaXN0b3J5UmVkb0Jsb2NrKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucHJvZHVjdExpc3RCbG9jayAmJiB0aGlzLnByb2R1Y3RJdGVtQmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdFByb2R1Y3RMaXN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEFkZE9yZGVyQnV0dG9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdFVwbG9hZEltYWdlQnV0dG9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbiAmJiB0aGlzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24gJiYgdGhpcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRBaUJ1dHRvbnMoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5mb3JtQmxvY2sgJiYgdGhpcy5mb3JtQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRGb3JtKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucXVhbnRpdHlGb3JtQmxvY2spIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5pbml0Rml4UXVhbnRpdHlGb3JtKCksIDUwMCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jaykge1xuICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRDYW5jZWxCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRDYW5jZWxCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkIGltYWdlIGJ1dHRvbl0gY2FuY2VsIGJ1dHRvbiBjbGlja2VkJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldFVzZXJVcGxvYWRJbWFnZSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRSZXF1aXJlZEVsZW1lbnQoc2VsZWN0b3IpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIGxvZ0lzc3VlKCdlZGl0b3JfcmVxdWlyZWRfZWxlbWVudF9ub3RfZm91bmQnLCB7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3I6IHNlbGVjdG9yXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgW0VkaXRvcl0g0J3QtSDQvdCw0LnQtNC10L0g0L7QsdGP0LfQsNGC0LXQu9GM0L3Ri9C5INGN0LvQtdC80LXQvdGCOiAke3NlbGVjdG9yfWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbiAgICBhc3luYyBpbml0aWFsaXplRWRpdG9yKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZFN0YXRlKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnByZWxvYWRBbGxNb2NrdXBzKCk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZWRpdG9yXSDQmNC90LjRhtC40LDQu9C40LfQsNGG0LjRjyDQt9Cw0LLQtdGA0YjQtdC90LAnKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tlZGl0b3JdINCe0YjQuNCx0LrQsCDQuNC90LjRhtC40LDQu9C40LfQsNGG0LjQuDonLCBlcnJvcik7XG4gICAgICAgICAgICBsb2dJc3N1ZSgnZWRpdG9yX2luaXRpYWxpemF0aW9uX2Vycm9yJywge1xuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICAgICAgaGFzU3RvcmFnZTogISF0aGlzLnN0b3JhZ2VNYW5hZ2VyXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZVdpdGhEZWZhdWx0cygpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGluaXRpYWxpemVXaXRoRGVmYXVsdHMoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tlZGl0b3JdINCY0L3QuNGG0LjQsNC70LjQt9Cw0YbQuNGPINGBINC00LXRhNC+0LvRgtC90YvQvNC4INC30L3QsNGH0LXQvdC40Y/QvNC4Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tlZGl0b3JdINCe0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4IG1vY2t1cCDQv9C+INGD0LzQvtC70YfQsNC90LjRjjonLCBlcnIpO1xuICAgICAgICAgICAgbG9nSXNzdWUoJ2VkaXRvcl9kZWZhdWx0X21vY2t1cF9sb2FkX2Vycm9yJywge1xuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVyciksXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRUeXBlOiB0aGlzLl9zZWxlY3RUeXBlLFxuICAgICAgICAgICAgICAgIHNlbGVjdGVkQ29sb3I6IHRoaXMuX3NlbGVjdENvbG9yLFxuICAgICAgICAgICAgICAgIHNlbGVjdGVkU2lkZTogdGhpcy5fc2VsZWN0U2lkZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5pdEV2ZW50cygpIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnM/LmRpc2FibGVCZWZvcmVVbmxvYWRXYXJuaW5nKSB7XG4gICAgICAgICAgICB3aW5kb3cub25iZWZvcmV1bmxvYWQgPSAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxheW91dHMubGVuZ3RoID4gMCAmJiAhdGhpcy5pc0FkZGVkVG9DYXJ0ICYmIHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSAn0JTQuNC30LDQudC9INGA0LXQtNCw0LrRgtC+0YDQsCDQvNC+0LbQtdGCINCx0YvRgtGMINC/0L7RgtC10YDRj9C9LiDQktGLINGD0LLQtdGA0LXQvdGLLCDRh9GC0L4g0YXQvtGC0LjRgtC1INC/0L7QutC40L3Rg9GC0Ywg0YHRgtGA0LDQvdC40YbRgz8nO1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBtZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlc2l6ZVRpbWVvdXQ7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQocmVzaXplVGltZW91dCk7XG4gICAgICAgICAgICByZXNpemVUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVXaW5kb3dSZXNpemUoKTtcbiAgICAgICAgICAgIH0sIDE1MCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmV2ZW50cy5vbihFZGl0b3JFdmVudFR5cGUuTU9DS1VQX1VQREFURUQsIChkYXRhVVJMKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vY2t1cEJsb2NrLnNyYyA9IGRhdGFVUkw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpbml0TG9hZGluZ0V2ZW50cygpIHtcbiAgICAgICAgdGhpcy5sb2FkaW5nRWxlbWVudHNDYWNoZS5sb2FkaW5nVGV4dCA9IHRoaXMuZWRpdG9yTG9hZGluZ0Jsb2NrLnF1ZXJ5U2VsZWN0b3IoJyNsb2FkaW5nLXRleHQnKTtcbiAgICAgICAgdGhpcy5sb2FkaW5nRWxlbWVudHNDYWNoZS5zcGlubmVyID0gdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2sucXVlcnlTZWxlY3RvcignI3NwaW5uZXInKTtcbiAgICAgICAgdGhpcy5ldmVudHMub24oRWRpdG9yRXZlbnRUeXBlLkxPQURJTkdfVElNRV9VUERBVEVELCAobG9hZGluZ1RpbWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHsgbG9hZGluZ1RleHQsIHNwaW5uZXIgfSA9IHRoaXMubG9hZGluZ0VsZW1lbnRzQ2FjaGU7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0xvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb2FkaW5nVGltZSA+IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuaW5uZXJUZXh0ID0gYCR7KHRoaXMubG9hZGluZ1RpbWUgLyAxMCkudG9GaXhlZCgxKX1gO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzcGlubmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNzQ1KVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzcGlubmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRpbmdCbG9jay5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMClcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGluZ1RleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZXZlbnRzLm9uKEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgKGlzTG9hZGluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBsb2FkaW5nVGV4dCwgc3Bpbm5lciB9ID0gdGhpcy5sb2FkaW5nRWxlbWVudHNDYWNoZTtcbiAgICAgICAgICAgIGlmIChpc0xvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb2FkaW5nSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmxvYWRpbmdJbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZ1RpbWUgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbbW9ja3VwXSBsb2FkaW5nIG1vY2t1cCcpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZ0ludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmdUaW1lKys7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTE9BRElOR19USU1FX1VQREFURUQsIHRoaXMubG9hZGluZ1RpbWUpO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRpbmdCbG9jay5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMClcIjtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGluZ1RleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3Bpbm5lcikge1xuICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb2FkaW5nSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmxvYWRpbmdJbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZ0ludGVydmFsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nVGltZSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbWl0KHR5cGUsIGRldGFpbCkge1xuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KHR5cGUsIGRldGFpbCk7XG4gICAgfVxuICAgIGluaXRLZXlib2FyZFNob3J0Y3V0cygpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlRWxlbWVudCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCBpc0lucHV0RmllbGQgPSBhY3RpdmVFbGVtZW50ICYmIChhY3RpdmVFbGVtZW50LnRhZ05hbWUgPT09ICdJTlBVVCcgfHxcbiAgICAgICAgICAgICAgICBhY3RpdmVFbGVtZW50LnRhZ05hbWUgPT09ICdURVhUQVJFQScgfHxcbiAgICAgICAgICAgICAgICBhY3RpdmVFbGVtZW50LmNvbnRlbnRFZGl0YWJsZSA9PT0gJ3RydWUnIHx8XG4gICAgICAgICAgICAgICAgYWN0aXZlRWxlbWVudC5pc0NvbnRlbnRFZGl0YWJsZSk7XG4gICAgICAgICAgICBpZiAoaXNJbnB1dEZpZWxkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGlmIChldmVudC5jdHJsS2V5ICYmIGV2ZW50LmNvZGUgPT09ICdLZXlaJyAmJiAhZXZlbnQuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudW5kbygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgoZXZlbnQuY3RybEtleSAmJiBldmVudC5zaGlmdEtleSAmJiBldmVudC5jb2RlID09PSAnS2V5WicpIHx8XG4gICAgICAgICAgICAgICAgKGV2ZW50LmN0cmxLZXkgJiYgZXZlbnQuY29kZSA9PT0gJ0tleVknICYmICFldmVudC5zaGlmdEtleSkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVkbygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNyZWF0ZUJhY2tncm91bmRCbG9jaygpIHtcbiAgICAgICAgY29uc3QgYmFja2dyb3VuZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBiYWNrZ3JvdW5kLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1wb3NpdGlvbicpO1xuICAgICAgICBiYWNrZ3JvdW5kLmlkID0gJ2VkaXRvci1iYWNrZ3JvdW5kJztcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jay5hcHBlbmRDaGlsZChiYWNrZ3JvdW5kKTtcbiAgICAgICAgcmV0dXJuIGJhY2tncm91bmQ7XG4gICAgfVxuICAgIGNyZWF0ZU1vY2t1cEJsb2NrKCkge1xuICAgICAgICBjb25zdCBtb2NrdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgICAgICAgbW9ja3VwLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1wb3NpdGlvbicpO1xuICAgICAgICBtb2NrdXAuaWQgPSAnZWRpdG9yLW1vY2t1cCc7XG4gICAgICAgIHRoaXMuZWRpdG9yQmxvY2suYXBwZW5kQ2hpbGQobW9ja3VwKTtcbiAgICAgICAgcmV0dXJuIG1vY2t1cDtcbiAgICB9XG4gICAgY3JlYXRlQ2FudmFzZXNDb250YWluZXIoKSB7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBjYW52YXMuY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXBvc2l0aW9uJyk7XG4gICAgICAgIGNhbnZhcy5pZCA9ICdlZGl0b3ItY2FudmFzZXMtY29udGFpbmVyJztcbiAgICAgICAgY2FudmFzLnN0eWxlLnpJbmRleCA9ICcxMCc7XG4gICAgICAgIGNhbnZhcy5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICB0aGlzLmVkaXRvckJsb2NrLmFwcGVuZENoaWxkKGNhbnZhcyk7XG4gICAgICAgIHJldHVybiBjYW52YXM7XG4gICAgfVxuICAgIGNyZWF0ZUVkaXRvckxvYWRpbmdCbG9jaygpIHtcbiAgICAgICAgY29uc3QgZWRpdG9yTG9hZGluZ0Jsb2NrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5zdHlsZS5kaXNwbGF5ID0gXCJmbGV4XCI7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItcG9zaXRpb24nKTtcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLmlkID0gJ2VkaXRvci1sb2FkaW5nJztcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLnN0eWxlLnpJbmRleCA9IFwiMTAwMFwiO1xuICAgICAgICBlZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUucG9pbnRlckV2ZW50cyA9IFwibm9uZVwiO1xuICAgICAgICBjb25zdCBsb2FkaW5nVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBsb2FkaW5nVGV4dC5pZCA9ICdsb2FkaW5nLXRleHQnO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLnRleHRBbGlnbiA9IFwiY2VudGVyXCI7XG4gICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS50b3AgPSBcIjUwJVwiO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5sZWZ0ID0gXCI1MCVcIjtcbiAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoLTUwJSwgLTUwJSlcIjtcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLmFwcGVuZENoaWxkKGxvYWRpbmdUZXh0KTtcbiAgICAgICAgY29uc3Qgc3Bpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBzcGlubmVyLmlkID0gJ3NwaW5uZXInO1xuICAgICAgICBzcGlubmVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLmFwcGVuZENoaWxkKHNwaW5uZXIpO1xuICAgICAgICB0aGlzLmVkaXRvckJsb2NrLmFwcGVuZENoaWxkKGVkaXRvckxvYWRpbmdCbG9jayk7XG4gICAgICAgIHJldHVybiBlZGl0b3JMb2FkaW5nQmxvY2s7XG4gICAgfVxuICAgIGFzeW5jIHVwZGF0ZU1vY2t1cCgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW21vY2t1cF0gdXBkYXRlIGZvciAke3RoaXMuX3NlbGVjdFR5cGV9ICR7dGhpcy5fc2VsZWN0U2lkZX0gJHt0aGlzLl9zZWxlY3RDb2xvci5uYW1lfWApO1xuICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCB0cnVlKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG1vY2t1cEltYWdlVXJsID0gdGhpcy5maW5kTW9ja3VwVXJsKCk7XG4gICAgICAgICAgICBpZiAoIW1vY2t1cEltYWdlVXJsKSB7XG4gICAgICAgICAgICAgICAgbG9nSXNzdWUoJ21vY2t1cF9ub3RfZm91bmQnLCB7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RUeXBlOiB0aGlzLl9zZWxlY3RUeXBlLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2lkZTogdGhpcy5fc2VsZWN0U2lkZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW21vY2t1cF0g0J3QtSDQvdCw0LnQtNC10L0gbW9ja3VwINC00LvRjyDRgtC10LrRg9GJ0LjRhSDQv9Cw0YDQsNC80LXRgtGA0L7QsicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZGF0YVVSTCA9IGF3YWl0IHRoaXMubG9hZEFuZENvbnZlcnRJbWFnZShtb2NrdXBJbWFnZVVybCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9VUERBVEVELCBkYXRhVVJMKTtcbiAgICAgICAgICAgIHRoaXMubW9ja3VwQmxvY2suc3JjID0gZGF0YVVSTDtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1ttb2NrdXBdIE1vY2t1cCDRg9GB0L/QtdGI0L3QviDQvtCx0L3QvtCy0LvQtdC9Jyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbbW9ja3VwXSDQntGI0LjQsdC60LAg0L7QsdC90L7QstC70LXQvdC40Y8gbW9ja3VwOicsIGVycm9yKTtcbiAgICAgICAgICAgIGxvZ0lzc3VlKCdtb2NrdXBfdXBkYXRlX2Vycm9yJywge1xuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICAgICAgcHJvZHVjdFR5cGU6IHRoaXMuX3NlbGVjdFR5cGUsXG4gICAgICAgICAgICAgICAgY29sb3I6IHRoaXMuX3NlbGVjdENvbG9yLm5hbWUsXG4gICAgICAgICAgICAgICAgc2lkZTogdGhpcy5fc2VsZWN0U2lkZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmaW5kTW9ja3VwVXJsKCkge1xuICAgICAgICBjb25zdCBjYWNoZUtleSA9IGAke3RoaXMuX3NlbGVjdFR5cGV9LSR7dGhpcy5fc2VsZWN0U2lkZX0tJHt0aGlzLl9zZWxlY3RDb2xvci5uYW1lfWA7XG4gICAgICAgIGlmICh0aGlzLm1vY2t1cENhY2hlLmhhcyhjYWNoZUtleSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1vY2t1cENhY2hlLmdldChjYWNoZUtleSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0KSB7XG4gICAgICAgICAgICB0aGlzLm1vY2t1cENhY2hlLnNldChjYWNoZUtleSwgbnVsbCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtb2NrdXAgPSBwcm9kdWN0Lm1vY2t1cHMuZmluZChtID0+IG0uc2lkZSA9PT0gdGhpcy5fc2VsZWN0U2lkZSAmJiBtLmNvbG9yLm5hbWUgPT09IHRoaXMuX3NlbGVjdENvbG9yLm5hbWUpO1xuICAgICAgICBjb25zdCB1cmwgPSBtb2NrdXA/LnVybCB8fCBudWxsO1xuICAgICAgICB0aGlzLm1vY2t1cENhY2hlLnNldChjYWNoZUtleSwgdXJsKTtcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG4gICAgZ2V0UHJvZHVjdEJ5VHlwZSh0eXBlKSB7XG4gICAgICAgIGlmICghdGhpcy5wcm9kdWN0Q2FjaGUuaGFzKHR5cGUpKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5wcm9kdWN0Q29uZmlncy5maW5kKHAgPT4gcC50eXBlID09PSB0eXBlKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9kdWN0Q2FjaGUuc2V0KHR5cGUsIHByb2R1Y3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnByb2R1Y3RDYWNoZS5nZXQodHlwZSk7XG4gICAgfVxuICAgIGNsZWFyTW9ja3VwQ2FjaGUoKSB7XG4gICAgICAgIHRoaXMubW9ja3VwQ2FjaGUuY2xlYXIoKTtcbiAgICB9XG4gICAgYXN5bmMgbG9hZEFuZENvbnZlcnRJbWFnZShpbWFnZVVybCkge1xuICAgICAgICBpZiAodGhpcy5pbWFnZUNhY2hlLmhhcyhpbWFnZVVybCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tjYWNoZV0g0JjQt9C+0LHRgNCw0LbQtdC90LjQtSDQt9Cw0LPRgNGD0LbQtdC90L4g0LjQtyDQutGN0YjQsDonLCBpbWFnZVVybCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbWFnZUNhY2hlLmdldChpbWFnZVVybCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICAgICAgICBpbWFnZS5zZXRBdHRyaWJ1dGUoJ2Nyb3NzT3JpZ2luJywgJ2Fub255bW91cycpO1xuICAgICAgICAgICAgaW1hZ2Uub25sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICAgICAgICAgICAgICBjYW52YXMud2lkdGggPSBpbWFnZS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGltYWdlLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY3R4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCfQndC1INGD0LTQsNC70L7RgdGMINC/0L7Qu9GD0YfQuNGC0Ywg0LrQvtC90YLQtdC60YHRgiBjYW52YXMnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShpbWFnZSwgMCwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGFVUkwgPSBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbWFnZUNhY2hlLnNldChpbWFnZVVybCwgZGF0YVVSTCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tjYWNoZV0g0JjQt9C+0LHRgNCw0LbQtdC90LjQtSDRgdC+0YXRgNCw0L3QtdC90L4g0LIg0LrRjdGIOicsIGltYWdlVXJsKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhVVJMKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGltYWdlLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihg0J7RiNC40LHQutCwINC30LDQs9GA0YPQt9C60Lgg0LjQt9C+0LHRgNCw0LbQtdC90LjRjzogJHtpbWFnZVVybH1gKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1hZ2Uuc3JjID0gaW1hZ2VVcmw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBzYXZlU3RhdGUoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tzdGF0ZV0g0KHQvtGF0YDQsNC90LXQvdC40LUg0YHQvtGB0YLQvtGP0L3QuNGPINGA0LXQtNCw0LrRgtC+0YDQsCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yU3RhdGUgPSB7XG4gICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgICAgIHR5cGU6IHRoaXMuX3NlbGVjdFR5cGUsXG4gICAgICAgICAgICAgICAgY29sb3I6IHRoaXMuX3NlbGVjdENvbG9yLm5hbWUsXG4gICAgICAgICAgICAgICAgc2lkZTogdGhpcy5fc2VsZWN0U2lkZSxcbiAgICAgICAgICAgICAgICBzaXplOiB0aGlzLl9zZWxlY3RTaXplXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3N0YXRlXSDQodC+0YXRgNCw0L3Rj9C10Lw6IHR5cGU9JHtlZGl0b3JTdGF0ZS50eXBlfSwgY29sb3I9JHtlZGl0b3JTdGF0ZS5jb2xvcn0sIHNpZGU9JHtlZGl0b3JTdGF0ZS5zaWRlfSwgc2l6ZT0ke2VkaXRvclN0YXRlLnNpemV9YCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLnNhdmVFZGl0b3JTdGF0ZShlZGl0b3JTdGF0ZSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbc3RhdGVdINCh0L7RgdGC0L7Rj9C90LjQtSDRg9GB0L/QtdGI0L3QviDRgdC+0YXRgNCw0L3QtdC90L4nKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPINGB0L7RgdGC0L7Rj9C90LjRjzonLCBlcnJvcik7XG4gICAgICAgICAgICBsb2dJc3N1ZSgnZWRpdG9yX3N0YXRlX3NhdmVfZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgICBzdGF0ZToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiB0aGlzLl9zZWxlY3RUeXBlLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2lkZTogdGhpcy5fc2VsZWN0U2lkZSxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogdGhpcy5fc2VsZWN0U2l6ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIHNhdmVMYXlvdXRzKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbbGF5ZXJzXSDQodC+0YXRgNCw0L3QtdC90LjQtSDRgdC70L7RkdCyJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLnNhdmVMYXllcnModGhpcy5sYXlvdXRzKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tsYXllcnNdINCh0LvQvtC4INGD0YHQv9C10YjQvdC+INGB0L7RhdGA0LDQvdC10L3RiycpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2xheWVyc10g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPINGB0LvQvtGR0LI6JywgZXJyb3IpO1xuICAgICAgICAgICAgbG9nSXNzdWUoJ2VkaXRvcl9sYXllcnNfc2F2ZV9lcnJvcicsIHtcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgICAgICAgIGxheWVyc0NvdW50OiB0aGlzLmxheW91dHMubGVuZ3RoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBsb2FkTGF5b3V0cygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2xheWVyc10g0JfQsNCz0YDRg9C30LrQsCDRgdC70L7RkdCyJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzYXZlZExheW91dHMgPSBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLmxvYWRMYXllcnMoKTtcbiAgICAgICAgICAgIGlmIChzYXZlZExheW91dHMgJiYgQXJyYXkuaXNBcnJheShzYXZlZExheW91dHMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gc2F2ZWRMYXlvdXRzLm1hcCgobGF5b3V0RGF0YSkgPT4gbmV3IExheW91dChsYXlvdXREYXRhKSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2xheWVyc10g0JfQsNCz0YDRg9C20LXQvdC+ICR7dGhpcy5sYXlvdXRzLmxlbmd0aH0g0YHQu9C+0ZHQsmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gW107XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2xheWVyc10g0J3QtdGCINGB0L7RhdGA0LDQvdGR0L3QvdGL0YUg0YHQu9C+0ZHQsicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbbGF5ZXJzXSDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCDRgdC70L7RkdCyOicsIGVycm9yKTtcbiAgICAgICAgICAgIGxvZ0lzc3VlKCdlZGl0b3JfbGF5ZXJzX2xvYWRfZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmxheW91dHMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZUxheWVyc1RvSGlzdG9yeSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGxvYWRTdGF0ZSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3N0YXRlXSDQl9Cw0LPRgNGD0LfQutCwINGB0L7RgdGC0L7Rj9C90LjRjyDRgNC10LTQsNC60YLQvtGA0LAnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvclN0YXRlID0gYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci5sb2FkRWRpdG9yU3RhdGUoKTtcbiAgICAgICAgICAgIGlmICghZWRpdG9yU3RhdGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbc3RhdGVdINCh0L7RhdGA0LDQvdC10L3QvdC+0LUg0YHQvtGB0YLQvtGP0L3QuNC1INC90LUg0L3QsNC50LTQtdC90L4nKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRDb2xvcnNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0U2l6ZXNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuaXNTdGF0ZUV4cGlyZWQoZWRpdG9yU3RhdGUuZGF0ZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tzdGF0ZV0g0KHQvtGB0YLQvtGP0L3QuNC1INGD0YHRgtCw0YDQtdC70L4sINC+0YfQuNGJ0LDQtdC8Jyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci5jbGVhckVkaXRvclN0YXRlKCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRQcm9kdWN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0Q29sb3JzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdFNpemVzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGFwcGxpZWQgPSBhd2FpdCB0aGlzLmFwcGx5U3RhdGUoZWRpdG9yU3RhdGUpO1xuICAgICAgICAgICAgaWYgKGFwcGxpZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbc3RhdGVdINCh0L7RgdGC0L7Rj9C90LjQtSDRg9GB0L/QtdGI0L3QviDQt9Cw0LPRgNGD0LbQtdC90L4nKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm9kdWN0QmxvY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9kdWN0QmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2IoMjIyIDIyMiAyMjIpJztcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUJsb2NrID0gdGhpcy5wcm9kdWN0QmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX3Byb2R1Y3QtYmxvY2tfXycgKyB0aGlzLl9zZWxlY3RUeXBlKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlQmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZExheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRDb2xvcnNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0U2l6ZXNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbc3RhdGVdINCd0LUg0YPQtNCw0LvQvtGB0Ywg0L/RgNC40LzQtdC90LjRgtGMINGB0L7RhdGA0LDQvdC10L3QvdC+0LUg0YHQvtGB0YLQvtGP0L3QuNC1Jyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRQcm9kdWN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0Q29sb3JzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdFNpemVzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCDRgdC+0YHRgtC+0Y/QvdC40Y86JywgZXJyb3IpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdENvbG9yc0xpc3QoKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdFNpemVzTGlzdCgpO1xuICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlzU3RhdGVFeHBpcmVkKGRhdGVTdHJpbmcpIHtcbiAgICAgICAgY29uc3Qgc3RhdGVEYXRlID0gbmV3IERhdGUoZGF0ZVN0cmluZyk7XG4gICAgICAgIGNvbnN0IGV4cGlyYXRpb25EYXRlID0gRGF0ZS5ub3coKSAtIChDT05TVEFOVFMuU1RBVEVfRVhQSVJBVElPTl9EQVlTICogMjQgKiA2MCAqIDYwICogMTAwMCk7XG4gICAgICAgIHJldHVybiBzdGF0ZURhdGUuZ2V0VGltZSgpIDwgZXhwaXJhdGlvbkRhdGU7XG4gICAgfVxuICAgIGFzeW5jIGFwcGx5U3RhdGUoZWRpdG9yU3RhdGUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICghZWRpdG9yU3RhdGUudHlwZSB8fCAhZWRpdG9yU3RhdGUuY29sb3IgfHwgIWVkaXRvclN0YXRlLnNpZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tzdGF0ZV0g0J3QtdC60L7RgNGA0LXQutGC0L3QvtC1INGB0L7RgdGC0L7Rj9C90LjQtTog0L7RgtGB0YPRgtGB0YLQstGD0Y7RgiDQvtCx0Y/Qt9Cw0YLQtdC70YzQvdGL0LUg0L/QvtC70Y8nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbc3RhdGVdINCS0L7RgdGB0YLQsNC90L7QstC70LXQvdC40LUg0YHQvtGB0YLQvtGP0L3QuNGPOiB0eXBlPSR7ZWRpdG9yU3RhdGUudHlwZX0sIGNvbG9yPSR7ZWRpdG9yU3RhdGUuY29sb3J9LCBzaWRlPSR7ZWRpdG9yU3RhdGUuc2lkZX0sIHNpemU9JHtlZGl0b3JTdGF0ZS5zaXplfWApO1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMucHJvZHVjdENvbmZpZ3MuZmluZChwID0+IHAudHlwZSA9PT0gZWRpdG9yU3RhdGUudHlwZSk7XG4gICAgICAgICAgICBpZiAoIXByb2R1Y3QpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtzdGF0ZV0g0J/RgNC+0LTRg9C60YIg0YLQuNC/0LAgJHtlZGl0b3JTdGF0ZS50eXBlfSDQvdC1INC90LDQudC00LXQvWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG1vY2t1cCA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG0gPT4gbS5jb2xvci5uYW1lID09PSBlZGl0b3JTdGF0ZS5jb2xvcik7XG4gICAgICAgICAgICBpZiAoIW1vY2t1cCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW3N0YXRlXSBNb2NrdXAg0YEg0YbQstC10YLQvtC8ICR7ZWRpdG9yU3RhdGUuY29sb3J9INC90LUg0L3QsNC50LTQtdC9INC00LvRjyDQv9GA0L7QtNGD0LrRgtCwICR7ZWRpdG9yU3RhdGUudHlwZX1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RUeXBlID0gZWRpdG9yU3RhdGUudHlwZTtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gbW9ja3VwLmNvbG9yO1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0U2lkZSA9IGVkaXRvclN0YXRlLnNpZGU7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RTaXplID0gZWRpdG9yU3RhdGUuc2l6ZSB8fCB0aGlzLl9zZWxlY3RTaXplO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3N0YXRlXSDQodC+0YHRgtC+0Y/QvdC40LUg0L/RgNC40LzQtdC90LXQvdC+OiB0eXBlPSR7dGhpcy5fc2VsZWN0VHlwZX0sIGNvbG9yPSR7dGhpcy5fc2VsZWN0Q29sb3IubmFtZX0sIHNpZGU9JHt0aGlzLl9zZWxlY3RTaWRlfSwgc2l6ZT0ke3RoaXMuX3NlbGVjdFNpemV9YCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINC/0YDQuNC80LXQvdC10L3QuNGPINGB0L7RgdGC0L7Rj9C90LjRjzonLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0VHlwZSh0eXBlKSB7XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RUeXBlICE9PSB0eXBlKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RUeXBlID0gdHlwZTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJNb2NrdXBDYWNoZSgpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5TVEFURV9DSEFOR0VELCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y86JywgZXJyKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0Q29sb3IoY29sb3IpIHtcbiAgICAgICAgaWYgKCFjb2xvciB8fCAhY29sb3IubmFtZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW0VkaXRvcl0g0J/QvtC/0YvRgtC60LAg0YPRgdGC0LDQvdC+0LLQuNGC0Ywg0L3QtdC60L7RgNGA0LXQutGC0L3Ri9C5INGG0LLQtdGCJywgY29sb3IpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RDb2xvciAhPT0gY29sb3IpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gY29sb3I7XG4gICAgICAgICAgICB0aGlzLmNsZWFyTW9ja3VwQ2FjaGUoKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuU1RBVEVfQ0hBTkdFRCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPOicsIGVycikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldFNpZGUoc2lkZSkge1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0U2lkZSAhPT0gc2lkZSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0U2lkZSA9IHNpZGU7XG4gICAgICAgICAgICB0aGlzLmNsZWFyTW9ja3VwQ2FjaGUoKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuU1RBVEVfQ0hBTkdFRCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPOicsIGVycikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldFNpemUoc2l6ZSkge1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0U2l6ZSAhPT0gc2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0U2l6ZSA9IHNpemU7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLlNUQVRFX0NIQU5HRUQsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbc3RhdGVdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjzonLCBlcnIpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhZGRMYXlvdXQobGF5b3V0KSB7XG4gICAgICAgIGlmICh0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkpIHtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0cy5wdXNoKGxheW91dCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxheW91dHMucHVzaChsYXlvdXQpO1xuICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5MQVlPVVRfQURERUQsIGxheW91dCk7XG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgIHRoaXMuc2F2ZUxheW91dHMoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW2xheWVyc10g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPINGB0LvQvtGR0LI6JywgZXJyKSk7XG4gICAgfVxuICAgIHJlbW92ZUxheW91dChsYXlvdXRJZCkge1xuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMubGF5b3V0cy5maW5kSW5kZXgobCA9PiBsLmlkID09PSBsYXlvdXRJZCk7XG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0c1tpbmRleF07XG4gICAgICAgICAgICBpZiAobGF5b3V0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXlvdXRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTEFZT1VUX1JFTU9WRUQsIGxheW91dElkKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNhdmVMYXlvdXRzKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycikpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdXBkYXRlTGF5b3V0KGxheW91dElkLCB1cGRhdGVzKSB7XG4gICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0cy5maW5kKGwgPT4gbC5pZCA9PT0gbGF5b3V0SWQpO1xuICAgICAgICBpZiAobGF5b3V0KSB7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGxheW91dCwgdXBkYXRlcyk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSkge1xuICAgICAgICAgICAgICAgIGlmICgndXJsJyBpbiB1cGRhdGVzIHx8ICduYW1lJyBpbiB1cGRhdGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2F2ZUxheWVyc1RvSGlzdG9yeSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTEFZT1VUX1VQREFURUQsIGxheW91dCk7XG4gICAgICAgICAgICB0aGlzLnNhdmVMYXlvdXRzKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycikpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBnZXRMYXlvdXQobGF5b3V0SWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0cy5maW5kKGwgPT4gbC5pZCA9PT0gbGF5b3V0SWQpO1xuICAgIH1cbiAgICBnZXRMYXlvdXRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXRzO1xuICAgIH1cbiAgICBpbml0SGlzdG9yeVVuZG9CbG9jaygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnkgYmxvY2tdIGluaXQgdW5kbycpO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2sub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5IHVuZG8gYmxvY2tdIGNsaWNrZWQnKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudW5kbygpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKTtcbiAgICB9XG4gICAgaW5pdEhpc3RvcnlSZWRvQmxvY2soKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5IHJlZG8gYmxvY2tdIGluaXQgcmVkbycpO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2sub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5IHJlZG8gYmxvY2tdIGNsaWNrZWQnKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucmVkbygpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKTtcbiAgICB9XG4gICAgaW5pdFByb2R1Y3RMaXN0KCkge1xuICAgICAgICBpZiAoIXRoaXMucHJvZHVjdExpc3RCbG9jayB8fCAhdGhpcy5wcm9kdWN0SXRlbUJsb2NrKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbUHJvZHVjdExpc3RdIGluaXQgcHJvZHVjdCBsaXN0Jyk7XG4gICAgICAgIHRoaXMucHJvZHVjdEl0ZW1CbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB0aGlzLnByb2R1Y3RDb25maWdzLmZvckVhY2gocHJvZHVjdCA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0SXRlbSA9IHRoaXMucHJvZHVjdEl0ZW1CbG9jay5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBwcm9kdWN0SXRlbS5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RJbWFnZVdyYXBwZXIgPSBwcm9kdWN0SXRlbS5xdWVyeVNlbGVjdG9yKCcucHJvZHVjdC1pdGVtLWltYWdlJyk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdEltYWdlV3JhcHBlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RJbWFnZSA9IGdldExhc3RDaGlsZChwcm9kdWN0SW1hZ2VXcmFwcGVyKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvZHVjdEltYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RJbWFnZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBgdXJsKCR7cHJvZHVjdC5tb2NrdXBzWzBdPy51cmx9KWA7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RJbWFnZS5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9ICdjb3Zlcic7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RJbWFnZS5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb24gPSAnY2VudGVyJztcbiAgICAgICAgICAgICAgICAgICAgcHJvZHVjdEltYWdlLnN0eWxlLmJhY2tncm91bmRSZXBlYXQgPSAnbm8tcmVwZWF0JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0VGV4dFdyYXBwZXIgPSBwcm9kdWN0SXRlbS5xdWVyeVNlbGVjdG9yKCcucHJvZHVjdC1pdGVtLXRleHQnKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0VGV4dFdyYXBwZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0VGV4dCA9IGdldExhc3RDaGlsZChwcm9kdWN0VGV4dFdyYXBwZXIpO1xuICAgICAgICAgICAgICAgIGlmIChwcm9kdWN0VGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9kdWN0VGV4dC5pbm5lclRleHQgPSBwcm9kdWN0LnByb2R1Y3ROYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RCbG9jayA9IHByb2R1Y3RJdGVtLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgcHJvZHVjdEJsb2NrLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1zZXR0aW5nc19fcHJvZHVjdC1ibG9ja19fJyArIHByb2R1Y3QudHlwZSk7XG4gICAgICAgICAgICBwcm9kdWN0QmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgcHJvZHVjdEJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgICAgICAgICAgIHByb2R1Y3RJdGVtLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNoYW5nZVByb2R1Y3QocHJvZHVjdC50eXBlKTtcbiAgICAgICAgICAgIHRoaXMucHJvZHVjdEJsb2Nrcy5wdXNoKHByb2R1Y3RCbG9jayk7XG4gICAgICAgICAgICB0aGlzLnByb2R1Y3RMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuYXBwZW5kQ2hpbGQocHJvZHVjdEl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMucHJvZHVjdEJsb2Nrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnByb2R1Y3RCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICAgICAgYmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2IoMjIyIDIyMiAyMjIpJztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLnByb2R1Y3RCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fcHJvZHVjdC1ibG9ja19fJyArIHRoaXMuX3NlbGVjdFR5cGUpKTtcbiAgICAgICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgICAgIGFjdGl2ZUJsb2NrLnN0eWxlLmJhY2tncm91bmQgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0Q29sb3JzTGlzdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckNvbG9yc0xpc3RCbG9jayB8fCAhdGhpcy5lZGl0b3JDb2xvckl0ZW1CbG9jaylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBpbml0IGNvbG9ycyBmb3IgJHt0aGlzLl9zZWxlY3RUeXBlfWApO1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuZWRpdG9yQ29sb3JJdGVtQmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgY29uc3QgY29sb3JzQ29udGFpbmVyID0gdGhpcy5lZGl0b3JDb2xvcnNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgIGNvbG9yc0NvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgdGhpcy5jb2xvckJsb2NrcyA9IFtdO1xuICAgICAgICBjb25zdCBjb2xvcnMgPSBwcm9kdWN0Lm1vY2t1cHNcbiAgICAgICAgICAgIC5maWx0ZXIobW9ja3VwID0+IG1vY2t1cC5zaWRlID09PSB0aGlzLl9zZWxlY3RTaWRlKVxuICAgICAgICAgICAgLm1hcChtb2NrdXAgPT4gbW9ja3VwLmNvbG9yKTtcbiAgICAgICAgY29sb3JzLmZvckVhY2goY29sb3IgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29sb3JJdGVtID0gdGhpcy5lZGl0b3JDb2xvckl0ZW1CbG9jay5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBjb2xvckl0ZW0uc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICBjb25zdCBjb2xvckJsb2NrID0gY29sb3JJdGVtLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgY29sb3JCbG9jay5jbGFzc0xpc3QuYWRkKCdlZGl0b3Itc2V0dGluZ3NfX2NvbG9yLWJsb2NrX18nICsgY29sb3IubmFtZSk7XG4gICAgICAgICAgICBjb2xvckJsb2NrLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIGNvbG9yQmxvY2suc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3IuaGV4O1xuICAgICAgICAgICAgY29sb3JCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgICAgICAgICBjb2xvckl0ZW0ub25jbGljayA9ICgpID0+IHRoaXMuY2hhbmdlQ29sb3IoY29sb3IubmFtZSk7XG4gICAgICAgICAgICB0aGlzLmNvbG9yQmxvY2tzLnB1c2goY29sb3JCbG9jayk7XG4gICAgICAgICAgICB0aGlzLmVkaXRvckNvbG9yc0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5hcHBlbmRDaGlsZChjb2xvckl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuY29sb3JCbG9ja3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5jb2xvckJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgICAgICBibG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLmNvbG9yQmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX2NvbG9yLWJsb2NrX18nICsgdGhpcy5fc2VsZWN0Q29sb3IubmFtZSkpO1xuICAgICAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgYWN0aXZlQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0U2l6ZXNMaXN0KCkge1xuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yU2l6ZXNMaXN0QmxvY2sgfHwgIXRoaXMuZWRpdG9yU2l6ZUl0ZW1CbG9jaylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBpbml0IHNpemVzIGZvciAke3RoaXMuX3NlbGVjdFR5cGV9YCk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdCB8fCAhcHJvZHVjdC5zaXplcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5lZGl0b3JTaXplSXRlbUJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGNvbnN0IHNpemVzQ29udGFpbmVyID0gdGhpcy5lZGl0b3JTaXplc0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgc2l6ZXNDb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIHRoaXMuc2l6ZUJsb2NrcyA9IFtdO1xuICAgICAgICBwcm9kdWN0LnNpemVzLmZvckVhY2goc2l6ZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzaXplSXRlbSA9IHRoaXMuZWRpdG9yU2l6ZUl0ZW1CbG9jay5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBzaXplSXRlbS5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIHNpemVJdGVtLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHNpemVJdGVtLnN0eWxlLnVzZXJTZWxlY3QgPSAnbm9uZSc7XG4gICAgICAgICAgICBzaXplSXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0b3Itc2V0dGluZ3NfX3NpemUtYmxvY2tfXycgKyBzaXplKTtcbiAgICAgICAgICAgIGNvbnN0IGJvcmRlckJsb2NrID0gc2l6ZUl0ZW0uZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBib3JkZXJCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgIGNvbnN0IHNpemVUZXh0ID0gZ2V0TGFzdENoaWxkKHNpemVJdGVtKTtcbiAgICAgICAgICAgIGlmIChzaXplVGV4dCkge1xuICAgICAgICAgICAgICAgIHNpemVUZXh0LmlubmVyVGV4dCA9IHNpemU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzaXplSXRlbS5vbmNsaWNrID0gKCkgPT4gdGhpcy5jaGFuZ2VTaXplKHNpemUpO1xuICAgICAgICAgICAgdGhpcy5zaXplQmxvY2tzLnB1c2goc2l6ZUl0ZW0pO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JTaXplc0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5hcHBlbmRDaGlsZChzaXplSXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5zaXplQmxvY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuc2l6ZUJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBib3JkZXJCbG9jayA9IGJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgIGlmIChib3JkZXJCbG9jaykge1xuICAgICAgICAgICAgICAgICAgICBib3JkZXJCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUJsb2NrID0gdGhpcy5zaXplQmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX3NpemUtYmxvY2tfXycgKyB0aGlzLl9zZWxlY3RTaXplKSk7XG4gICAgICAgICAgICBpZiAoYWN0aXZlQmxvY2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBib3JkZXJCbG9jayA9IGFjdGl2ZUJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgIGlmIChib3JkZXJCbG9jaykge1xuICAgICAgICAgICAgICAgICAgICBib3JkZXJCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBzaG93TGF5b3V0TGlzdCgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3NldHRpbmdzXSBbbGF5b3V0c10gc2hvdyBsYXlvdXRzIGxpc3QnKTtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9jaykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIltzZXR0aW5nc10gW2xheW91dHNdIGVkaXRvckxheW91dEl0ZW1CbG9jayBpcyBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2spIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbc2V0dGluZ3NdIFtsYXlvdXRzXSBlZGl0b3JMYXlvdXRzTGlzdEJsb2NrIGlzIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gW2xheW91dHNdIGxheW91dHMgbGlzdCBibG9jayBjaGlsZHJlbjogJHt0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuY2hpbGRyZW4ubGVuZ3RofWApO1xuICAgICAgICB0aGlzLmxheW91dHMuZm9yRWFjaChsYXlvdXQgPT4ge1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0SXRlbSA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIGxheW91dEl0ZW0uc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICBjb25zdCBpc0VkaXRpbmcgPSB0aGlzLl9zZWxlY3RMYXlvdXQgPT09IGxheW91dC5pZDtcbiAgICAgICAgICAgIGNvbnN0IHByZXZpZXdCbG9jayA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrVmlld0NsYXNzXG4gICAgICAgICAgICAgICAgPyBsYXlvdXRJdGVtLnF1ZXJ5U2VsZWN0b3IodGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tWaWV3Q2xhc3MpXG4gICAgICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgbmFtZUJsb2NrID0gdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tOYW1lQ2xhc3NcbiAgICAgICAgICAgICAgICA/IGxheW91dEl0ZW0ucXVlcnlTZWxlY3Rvcih0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja05hbWVDbGFzcylcbiAgICAgICAgICAgICAgICA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCByZW1vdmVCbG9jayA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrUmVtb3ZlQ2xhc3NcbiAgICAgICAgICAgICAgICA/IGxheW91dEl0ZW0ucXVlcnlTZWxlY3Rvcih0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja1JlbW92ZUNsYXNzKVxuICAgICAgICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRCbG9jayA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrRWRpdENsYXNzXG4gICAgICAgICAgICAgICAgPyBsYXlvdXRJdGVtLnF1ZXJ5U2VsZWN0b3IodGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tFZGl0Q2xhc3MpXG4gICAgICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICAgICAgaWYgKHByZXZpZXdCbG9jaykge1xuICAgICAgICAgICAgICAgIGlmIChsYXlvdXQuaXNJbWFnZUxheW91dCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZXZpZXdFbGVtZW50ID0gcHJldmlld0Jsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJldmlld0VsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IGB1cmwoJHtsYXlvdXQudXJsfSlgO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlld0VsZW1lbnQuc3R5bGUuYmFja2dyb3VuZFNpemUgPSAnY29udGFpbic7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3RWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb24gPSAnY2VudGVyJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJhY2tncm91bmRSZXBlYXQgPSAnbm8tcmVwZWF0JztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNFZGl0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3RWxlbWVudC5zdHlsZS5ib3JkZXJDb2xvciA9ICdyZ2IoMjU0LCA5NCwgNTgpJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJvcmRlckNvbG9yID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobGF5b3V0LnR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuYW1lQmxvY2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lRWxlbWVudCA9IG5hbWVCbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgICAgICBpZiAobmFtZUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxheW91dC50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwbGF5TmFtZSA9ICFsYXlvdXQubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gXCLQmNC30L7QsdGA0LDQttC10L3QuNC1XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGxheW91dC5uYW1lLmluY2x1ZGVzKFwiXFxuXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbGF5b3V0Lm5hbWUuc3BsaXQoXCJcXG5cIilbMF0gKyBcIi4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbGF5b3V0Lm5hbWUubGVuZ3RoID4gNDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbGF5b3V0Lm5hbWUuc2xpY2UoMCwgNDApICsgXCIuLi5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBsYXlvdXQubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVFbGVtZW50LmlubmVyVGV4dCA9IGRpc3BsYXlOYW1lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGxheW91dC50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVFbGVtZW50LmlubmVyVGV4dCA9IGxheW91dC5uYW1lIHx8IFwi0KLQtdC60YHRglwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlbW92ZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlQmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgICAgIHJlbW92ZUJsb2NrLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTGF5b3V0KGxheW91dC5pZCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzRWRpdGluZylcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FuY2VsRWRpdExheW91dCgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5yZXN0b3JlSWNvbkZyb21EYXRhT3JpZ2luYWwocmVtb3ZlQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVkaXRCbG9jaykge1xuICAgICAgICAgICAgICAgIGlmIChpc0VkaXRpbmcgfHwgbGF5b3V0LmlkID09PSBcInN0YXJ0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdEJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlZGl0QmxvY2suc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVkaXRCbG9jay5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICAgICAgZWRpdEJsb2NrLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmVkaXRMYXlvdXQobGF5b3V0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3RvcmVJY29uRnJvbURhdGFPcmlnaW5hbChnZXRMYXN0Q2hpbGQoZWRpdEJsb2NrKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuYXBwZW5kQ2hpbGQobGF5b3V0SXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSBsYXlvdXRzIHNob3duOiAke3RoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5jaGlsZHJlbi5sZW5ndGh9YCk7XG4gICAgfVxuICAgIGluaXRBZGRPcmRlckJ1dHRvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgdGhpcy5ldmVudHMub24oRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCAoaXNMb2FkaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbikge1xuICAgICAgICAgICAgICAgIGlmIChpc0xvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzAuNSc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24uc3R5bGUuY3Vyc29yID0gJ25vdC1hbGxvd2VkJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCa0L3QvtC/0LrQsCDQt9Cw0LHQu9C+0LrQuNGA0L7QstCw0L3QsCAo0LjQtNC10YIg0LPQtdC90LXRgNCw0YbQuNGPKScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCa0L3QvtC/0LrQsCDRgNCw0LfQsdC70L7QutC40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNBZGRpbmdUb0NhcnQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tvcmRlcl0g0J/RgNC+0YbQtdGB0YEg0LTQvtCx0LDQstC70LXQvdC40Y8g0YPQttC1INC40LTQtdGCLCDQuNCz0L3QvtGA0LjRgNGD0LXQvCDQv9C+0LLRgtC+0YDQvdC+0LUg0L3QsNC20LDRgtC40LUnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5nZXRTdW0oKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGFsZXJ0KCfQlNC70Y8g0LTQvtCx0LDQstC70LXQvdC40Y8g0LfQsNC60LDQt9CwINC/0YDQvtC00YPQutGCINC90LUg0LzQvtC20LXRgiDQsdGL0YLRjCDQv9GD0YHRgtGL0LwnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5sYXlvdXRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGFsZXJ0KCfQn9C+0LbQsNC70YPQudGB0YLQsCwg0LTQvtC20LTQuNGC0LXRgdGMINC30LDQstC10YDRiNC10L3QuNGPINCz0LXQvdC10YDQsNGG0LjQuCDQtNC40LfQsNC50L3QsCcpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW29yZGVyXSDQn9C+0L/Ri9GC0LrQsCDQtNC+0LHQsNCy0LjRgtGMINCyINC60L7RgNC30LjQvdGDINCx0LXQtyDQtNC40LfQsNC50L3QsCcpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBidXR0b25UZXh0RWxlbWVudCA9IHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24/LnF1ZXJ5U2VsZWN0b3IoJy50bi1hdG9tJyk7XG4gICAgICAgICAgICBpZiAoIWJ1dHRvblRleHRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgYnV0dG9uVGV4dEVsZW1lbnQgPSB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uPy5xdWVyeVNlbGVjdG9yKCdkaXYsIHNwYW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsVGV4dCA9IGJ1dHRvblRleHRFbGVtZW50Py50ZXh0Q29udGVudD8udHJpbSgpIHx8ICfQlNC+0LHQsNCy0LjRgtGMINCyINC60L7RgNC30LjQvdGDJztcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0FkZGluZ1RvQ2FydCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRBZGRUb0NhcnRCdXR0b25Mb2FkaW5nKHRydWUsICfQlNC+0LHQsNCy0LvQtdC90LjQtS4uLicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFydGljbGUgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoOTk5OTk5OTkgLSA5OTk5OTkgKyAxKSkgKyA5OTk5OTk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQndCw0YfQsNC70L4g0YHQvtC30LTQsNC90LjRjyDQt9Cw0LrQsNC30LAnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBleHBvcnRlZEFydCA9IGF3YWl0IHRoaXMuZXhwb3J0QXJ0KHRydWUsIDUxMik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQrdC60YHQv9C+0YDRgiDQtNC40LfQsNC50L3QsCDQt9Cw0LLQtdGA0YjQtdC9OicsIE9iamVjdC5rZXlzKGV4cG9ydGVkQXJ0KSk7XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKGV4cG9ydGVkQXJ0KS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ9Ce0YjQuNCx0LrQsDog0L3QtSDRg9C00LDQu9C+0YHRjCDRjdC60YHQv9C+0YDRgtC40YDQvtCy0LDRgtGMINC00LjQt9Cw0LnQvS4g0J/QvtC/0YDQvtCx0YPQudGC0LUg0LXRidC1INGA0LDQty4nKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW29yZGVyXSDQrdC60YHQv9C+0YDRgiDQstC10YDQvdGD0Lsg0L/Rg9GB0YLQvtC5INGA0LXQt9GD0LvRjNGC0LDRgicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHNpZGVzID0gT2JqZWN0LmtleXMoZXhwb3J0ZWRBcnQpLm1hcChzaWRlID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIGltYWdlX3VybDogZXhwb3J0ZWRBcnRbc2lkZV0gfHwgJycsXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0JfQsNCz0YDRg9C30LrQsCDQuNC30L7QsdGA0LDQttC10L3QuNC5INC90LAg0YHQtdGA0LLQtdGALi4uJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgdXBsb2FkUHJvbWlzZXMgPSBzaWRlcy5tYXAoYXN5bmMgKHNpZGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmFzZTY0ID0gc2lkZS5pbWFnZV91cmwuc3BsaXQoJywnKVsxXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXBsb2FkZWRVcmwgPSBhd2FpdCB0aGlzLnVwbG9hZEltYWdlVG9TZXJ2ZXIoYmFzZTY0KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgc2lkZSwgdXBsb2FkZWRVcmwgfTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCB1cGxvYWRlZFNpZGVzID0gYXdhaXQgUHJvbWlzZS5hbGwodXBsb2FkUHJvbWlzZXMpO1xuICAgICAgICAgICAgICAgIHVwbG9hZGVkU2lkZXMuZm9yRWFjaCgoeyBzaWRlLCB1cGxvYWRlZFVybCB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNpZGUuaW1hZ2VfdXJsID0gdXBsb2FkZWRVcmw7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQmNC30L7QsdGA0LDQttC10L3QuNGPINC30LDQs9GA0YPQttC10L3RiyDQvdCwINGB0LXRgNCy0LXRgCcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3ROYW1lID0gYCR7dGhpcy5jYXBpdGFsaXplRmlyc3RMZXR0ZXIodGhpcy5nZXRQcm9kdWN0TmFtZSgpKX0g0YEg0LLQsNGI0LjQvCAke09iamVjdC5rZXlzKGV4cG9ydGVkQXJ0KS5sZW5ndGggPT0gMSA/ICfQvtC00L3QvtGB0YLQvtGA0L7QvdC90LjQvCcgOiAn0LTQstGD0YXRgdGC0L7RgNC+0L3QvdC40LwnfSDQv9GA0LjQvdGC0L7QvGA7XG4gICAgICAgICAgICAgICAgY29uc3QgbGF5b3V0cyA9IHRoaXMubGF5b3V0cy5tYXAobGF5b3V0ID0+ICh7IC4uLmxheW91dCwgdXJsOiB1bmRlZmluZWQgfSkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJJZCA9IGF3YWl0IHRoaXMuc3RvcmFnZU1hbmFnZXIuZ2V0VXNlcklkKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoXCJsYXlvdXRzXCIsIEpTT04uc3RyaW5naWZ5KGxheW91dHMpKTtcbiAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoXCJ1c2VyX2lkXCIsIHVzZXJJZCk7XG4gICAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKFwiYXJ0XCIsIGFydGljbGUudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgZmV0Y2godGhpcy5hcGlDb25maWcud2ViaG9va0NhcnQsIHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgICAgICAgICAgYm9keTogZm9ybURhdGFcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjcmVhdGVQcm9kdWN0KHtcbiAgICAgICAgICAgICAgICAgICAgcXVhbnRpdHk6IHRoaXMuZ2V0UXVhbnRpdHkoKSxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogcHJvZHVjdE5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHNpemU6IHRoaXMuX3NlbGVjdFNpemUsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiB0aGlzLl9zZWxlY3RDb2xvcixcbiAgICAgICAgICAgICAgICAgICAgc2lkZXMsXG4gICAgICAgICAgICAgICAgICAgIGFydGljbGUsXG4gICAgICAgICAgICAgICAgICAgIHByaWNlOiB0aGlzLmdldFN1bSgpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNBZGRlZFRvQ2FydCA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQl9Cw0LrQsNC3INGD0YHQv9C10YjQvdC+INGB0L7Qt9C00LDQvScpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyhmYWxzZSwgJ+KckyDQlNC+0LHQsNCy0LvQtdC90L4hJyk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyhmYWxzZSwgb3JpZ2luYWxUZXh0KTtcbiAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tvcmRlcl0g0J7RiNC40LHQutCwINGB0L7Qt9C00LDQvdC40Y8g0LfQsNC60LDQt9CwOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBsb2dJc3N1ZSgnb3JkZXJfY3JlYXRpb25fZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RUeXBlOiB0aGlzLl9zZWxlY3RUeXBlLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiB0aGlzLl9zZWxlY3RTaXplLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXJzQ291bnQ6IHRoaXMubGF5b3V0cy5sZW5ndGhcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBhbGVydCgn0J7RiNC40LHQutCwINC/0YDQuCDRgdC+0LfQtNCw0L3QuNC4INC30LDQutCw0LfQsCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyhmYWxzZSwgb3JpZ2luYWxUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzQWRkaW5nVG9DYXJ0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0KTQu9Cw0LMgaXNBZGRpbmdUb0NhcnQg0YHQsdGA0L7RiNC10L0nKTtcbiAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyhpc0xvYWRpbmcsIHRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmluamVjdFB1bHNlQW5pbWF0aW9uKCk7XG4gICAgICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b247XG4gICAgICAgIGxldCBidXR0b25UZXh0RWxlbWVudCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCcudG4tYXRvbScpO1xuICAgICAgICBpZiAoIWJ1dHRvblRleHRFbGVtZW50KSB7XG4gICAgICAgICAgICBidXR0b25UZXh0RWxlbWVudCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdkaXYsIHNwYW4nKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZXh0VGFyZ2V0ID0gYnV0dG9uVGV4dEVsZW1lbnQgfHwgYnV0dG9uO1xuICAgICAgICBpZiAoaXNMb2FkaW5nKSB7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9ICcwLjcnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmN1cnNvciA9ICdub3QtYWxsb3dlZCc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICAgICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgdGV4dFRhcmdldC50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuYW5pbWF0aW9uID0gJ2NhcnRCdXR0b25QdWxzZSAxLjVzIGVhc2UtaW4tb3V0IGluZmluaXRlJztcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0gW2FuaW1hdGlvbl0g0JrQvdC+0L/QutCwINC30LDQsdC70L7QutC40YDQvtCy0LDQvdCwOicsIHRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuYW5pbWF0aW9uID0gJ25vbmUnO1xuICAgICAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgICAgICB0ZXh0VGFyZ2V0LnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0gW2FuaW1hdGlvbl0g0JrQvdC+0L/QutCwINGA0LDQt9Cx0LvQvtC60LjRgNC+0LLQsNC90LA6JywgdGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5qZWN0UHVsc2VBbmltYXRpb24oKSB7XG4gICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FydC1idXR0b24tcHVsc2UtYW5pbWF0aW9uJykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgIHN0eWxlLmlkID0gJ2NhcnQtYnV0dG9uLXB1bHNlLWFuaW1hdGlvbic7XG4gICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gYFxyXG4gICAgICAgICAgICBAa2V5ZnJhbWVzIGNhcnRCdXR0b25QdWxzZSB7XHJcbiAgICAgICAgICAgICAgICAwJSwgMTAwJSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBzY2FsZSgxKTtcclxuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLjc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICA1MCUge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMS4wMik7XHJcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMC44NTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIGA7XG4gICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbYW5pbWF0aW9uXSBDU1Mg0LDQvdC40LzQsNGG0LjRjyDQv9GD0LvRjNGB0LDRhtC40Lgg0LTQvtCx0LDQstC70LXQvdCwJyk7XG4gICAgfVxuICAgIHNldEdlbmVyYXRlQnV0dG9uTG9hZGluZyhpc0xvYWRpbmcsIHRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmZvcm1CdXR0b24pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuaW5qZWN0UHVsc2VBbmltYXRpb24oKTtcbiAgICAgICAgY29uc3QgYnV0dG9uID0gdGhpcy5mb3JtQnV0dG9uO1xuICAgICAgICBsZXQgYnV0dG9uVGV4dEVsZW1lbnQgPSBidXR0b24ucXVlcnlTZWxlY3RvcignLnRuLWF0b20nKTtcbiAgICAgICAgaWYgKCFidXR0b25UZXh0RWxlbWVudCkge1xuICAgICAgICAgICAgYnV0dG9uVGV4dEVsZW1lbnQgPSBidXR0b24ucXVlcnlTZWxlY3RvcignZGl2LCBzcGFuJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dFRhcmdldCA9IGJ1dHRvblRleHRFbGVtZW50IHx8IGJ1dHRvbjtcbiAgICAgICAgaWYgKGlzTG9hZGluZykge1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMC43JztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAnbm90LWFsbG93ZWQnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgICAgIHRleHRUYXJnZXQudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmFuaW1hdGlvbiA9ICdjYXJ0QnV0dG9uUHVsc2UgMS41cyBlYXNlLWluLW91dCBpbmZpbml0ZSc7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZ2VuZXJhdGVdIFthbmltYXRpb25dINCa0L3QvtC/0LrQsCDQt9Cw0LHQu9C+0LrQuNGA0L7QstCw0L3QsDonLCB0ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmFuaW1hdGlvbiA9ICdub25lJztcbiAgICAgICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgdGV4dFRhcmdldC50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZ2VuZXJhdGVdIFthbmltYXRpb25dINCa0L3QvtC/0LrQsCDRgNCw0LfQsdC70L7QutC40YDQvtCy0LDQvdCwOicsIHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldENvbnRyb2xzRGlzYWJsZWQoZGlzYWJsZWQpIHtcbiAgICAgICAgY29uc3Qgb3BhY2l0eSA9IGRpc2FibGVkID8gJzAuNScgOiAnMSc7XG4gICAgICAgIGNvbnN0IHBvaW50ZXJFdmVudHMgPSBkaXNhYmxlZCA/ICdub25lJyA6ICdhdXRvJztcbiAgICAgICAgY29uc3QgY3Vyc29yID0gZGlzYWJsZWQgPyAnbm90LWFsbG93ZWQnIDogJ3BvaW50ZXInO1xuICAgICAgICBpZiAodGhpcy5jaGFuZ2VTaWRlQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmNoYW5nZVNpZGVCdXR0b24uc3R5bGUub3BhY2l0eSA9IG9wYWNpdHk7XG4gICAgICAgICAgICB0aGlzLmNoYW5nZVNpZGVCdXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9IHBvaW50ZXJFdmVudHM7XG4gICAgICAgICAgICB0aGlzLmNoYW5nZVNpZGVCdXR0b24uc3R5bGUuY3Vyc29yID0gY3Vyc29yO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29sb3JCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBibG9jay5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHBhcmVudC5zdHlsZS5vcGFjaXR5ID0gb3BhY2l0eTtcbiAgICAgICAgICAgICAgICBwYXJlbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9IHBvaW50ZXJFdmVudHM7XG4gICAgICAgICAgICAgICAgcGFyZW50LnN0eWxlLmN1cnNvciA9IGN1cnNvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMucHJvZHVjdEJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IGJsb2NrLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcGFyZW50LnN0eWxlLm9wYWNpdHkgPSBvcGFjaXR5O1xuICAgICAgICAgICAgICAgIHBhcmVudC5zdHlsZS5wb2ludGVyRXZlbnRzID0gcG9pbnRlckV2ZW50cztcbiAgICAgICAgICAgICAgICBwYXJlbnQuc3R5bGUuY3Vyc29yID0gY3Vyc29yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2NvbnRyb2xzXSDQrdC70LXQvNC10L3RgtGLINGD0L/RgNCw0LLQu9C10L3QuNGPICR7ZGlzYWJsZWQgPyAn0LfQsNCx0LvQvtC60LjRgNC+0LLQsNC90YsnIDogJ9GA0LDQt9Cx0LvQvtC60LjRgNC+0LLQsNC90YsnfWApO1xuICAgIH1cbiAgICBpbml0VXBsb2FkSW1hZ2VCdXR0b24oKSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5yZXNldFVzZXJVcGxvYWRJbWFnZSgpO1xuICAgICAgICB0aGlzLmVkaXRvclVwbG9hZEltYWdlQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBsb2FkVXNlckltYWdlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpbml0Rml4UXVhbnRpdHlGb3JtKCkge1xuICAgICAgICBpZiAoIXRoaXMucXVhbnRpdHlGb3JtQmxvY2spXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGZvcm0gPSB0aGlzLnF1YW50aXR5Rm9ybUJsb2NrLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcbiAgICAgICAgY29uc3QgaW5wdXQgPSBmb3JtPy5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwicXVhbnRpdHlcIl0nKTtcbiAgICAgICAgaWYgKCFpbnB1dClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgdmFsaWRhdGVRdWFudGl0eSA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gaW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnJyB8fCBpc05hTihOdW1iZXIodmFsdWUpKSkge1xuICAgICAgICAgICAgICAgIGlucHV0LnZhbHVlID0gJzEnO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHF1YW50aXR5ID0gcGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICAgIGlmIChxdWFudGl0eSA8IDEgfHwgcXVhbnRpdHkgPT09IDApIHtcbiAgICAgICAgICAgICAgICBpbnB1dC52YWx1ZSA9ICcxJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCB2YWxpZGF0ZVF1YW50aXR5KTtcbiAgICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHZhbGlkYXRlUXVhbnRpdHkpO1xuICAgICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB2YWxpZGF0ZVF1YW50aXR5KTtcbiAgICAgICAgdmFsaWRhdGVRdWFudGl0eSgpO1xuICAgIH1cbiAgICBhc3luYyBpbml0Rm9ybSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmZvcm1CbG9jayB8fCAhdGhpcy5mb3JtQnV0dG9uIHx8ICF0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZm9ybUJsb2NrID0gdGhpcy5mb3JtQmxvY2s7XG4gICAgICAgIGNvbnN0IGZvcm1JbnB1dFZhcmlhYmxlTmFtZSA9IHRoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lO1xuICAgICAgICBjb25zdCBmb3JtQnV0dG9uID0gdGhpcy5mb3JtQnV0dG9uO1xuICAgICAgICBjb25zdCBoYW5kbGVDbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYnV0dG9uXSBjbGlja2VkJyk7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0dlbmVyYXRpbmcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSDQk9C10L3QtdGA0LDRhtC40Y8g0YPQttC1INC40LTQtdGCLCDQuNCz0L3QvtGA0LjRgNGD0LXQvCDQv9C+0LLRgtC+0YDQvdC+0LUg0L3QsNC20LDRgtC40LUnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBmb3JtSW5wdXQgPSBmb3JtQmxvY2sucXVlcnlTZWxlY3RvcihgW25hbWU9XCIke2Zvcm1JbnB1dFZhcmlhYmxlTmFtZX1cIl1gKTtcbiAgICAgICAgICAgIGNvbnN0IHByb21wdCA9IGZvcm1JbnB1dC52YWx1ZTtcbiAgICAgICAgICAgIGlmICghdGhpcy5sb2FkZWRVc2VySW1hZ2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXByb21wdCB8fCBwcm9tcHQudHJpbSgpID09PSBcIlwiIHx8IHByb21wdC5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFtpbnB1dF0gcHJvbXB0IGlzIGVtcHR5IG9yIHRvbyBzaG9ydCcpO1xuICAgICAgICAgICAgICAgICAgICBhbGVydChcItCc0LjQvdC40LzQsNC70YzQvdCw0Y8g0LTQu9C40L3QsCDQt9Cw0L/RgNC+0YHQsCAxINGB0LjQvNCy0L7Qu1wiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbaW5wdXRdIHByb21wdDogJHtwcm9tcHR9YCk7XG4gICAgICAgICAgICB0aGlzLmlzR2VuZXJhdGluZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNldEdlbmVyYXRlQnV0dG9uTG9hZGluZyh0cnVlLCAn0JPQtdC90LXRgNCw0YbQuNGPLi4uJyk7XG4gICAgICAgICAgICB0aGlzLnNldENvbnRyb2xzRGlzYWJsZWQodHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCB0cnVlKTtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dElkID0gdGhpcy5fc2VsZWN0TGF5b3V0IHx8IExheW91dC5nZW5lcmF0ZUlkKCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fc2VsZWN0Q29sb3IgfHwgIXRoaXMuX3NlbGVjdENvbG9yLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfQptCy0LXRgiDQvdC1INC+0L/RgNC10LTQtdC70LXQvS4g0J/QvtC20LDQu9GD0LnRgdGC0LAsINCy0YvQsdC10YDQuNGC0LUg0YbQstC10YIg0YLQvtCy0LDRgNCwLicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB1cmwgPSBhd2FpdCBnZW5lcmF0ZUltYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgdXJpOiB0aGlzLmFwaUNvbmZpZy53ZWJob29rUmVxdWVzdCxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0LFxuICAgICAgICAgICAgICAgICAgICBzaGlydENvbG9yOiB0aGlzLl9zZWxlY3RDb2xvci5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBpbWFnZTogdGhpcy5fc2VsZWN0TGF5b3V0ID8gdGhpcy5sb2FkZWRVc2VySW1hZ2UgIT09IHRoaXMubGF5b3V0cy5maW5kKGxheW91dCA9PiBsYXlvdXQuaWQgPT09IHRoaXMuX3NlbGVjdExheW91dCk/LnVybCA/IHRoaXMubG9hZGVkVXNlckltYWdlIDogbnVsbCA6IHRoaXMubG9hZGVkVXNlckltYWdlLFxuICAgICAgICAgICAgICAgICAgICB3aXRoQWk6IHRoaXMuZWRpdG9yTG9hZFdpdGhBaSxcbiAgICAgICAgICAgICAgICAgICAgbGF5b3V0SWQsXG4gICAgICAgICAgICAgICAgICAgIGlzTmV3OiB0aGlzLl9zZWxlY3RMYXlvdXQgPyBmYWxzZSA6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICF0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmQsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LnltKDEwMzI3OTIxNCwgJ3JlYWNoR29hbCcsICdnZW5lcmF0ZWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7IH1cbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VEYXRhID0gYXdhaXQgdGhpcy5nZXRJbWFnZURhdGEodXJsKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW2lucHV0XSBpbWFnZSBkYXRhIHJlY2VpdmVkYCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NlbGVjdExheW91dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYXlvdXQgPSB0aGlzLmxheW91dHMuZmluZChsYXlvdXQgPT4gbGF5b3V0LmlkID09PSBsYXlvdXRJZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXlvdXQgJiYgbGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtpbnB1dF0gdXBkYXRpbmcgbGF5b3V0OiAke2xheW91dC5pZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheW91dC5uYW1lID0gcHJvbXB0O1xuICAgICAgICAgICAgICAgICAgICAgICAgbGF5b3V0LnVybCA9IGltYWdlRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbaW5wdXRdIGxheW91dCB1cGRhdGVkYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2F2ZUxheWVyc1RvSGlzdG9yeSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlTGF5b3V0cygpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbbGF5ZXJzXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y8g0YHQu9C+0ZHQsjonLCBlcnIpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRMYXlvdXQoTGF5b3V0LmNyZWF0ZUltYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBsYXlvdXRJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXc6IHRoaXMuX3NlbGVjdFNpZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGltYWdlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHByb21wdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQuc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YzZjNmMyc7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0TGF5b3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQudmFsdWUgPSBcIlwiO1xuICAgICAgICAgICAgICAgIHRoaXMuY2FuY2VsRWRpdExheW91dCgpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVzZXRVc2VyVXBsb2FkSW1hZ2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRHZW5lcmF0ZUJ1dHRvbkxvYWRpbmcoZmFsc2UsICfinJMg0JPQvtGC0L7QstC+IScpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0Q29udHJvbHNEaXNhYmxlZChmYWxzZSk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0R2VuZXJhdGVCdXR0b25Mb2FkaW5nKGZhbHNlLCAn0KHQs9C10L3QtdGA0LjRgNC+0LLQsNGC0YwnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pc0dlbmVyYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dINCk0LvQsNCzIGlzR2VuZXJhdGluZyDRgdCx0YDQvtGI0LXQvScpO1xuICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgbG9nSXNzdWUoJ2ltYWdlX2dlbmVyYXRpb25fZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICAgICAgICAgIHByb21wdDogcHJvbXB0LFxuICAgICAgICAgICAgICAgICAgICBzaGlydENvbG9yOiB0aGlzLl9zZWxlY3RDb2xvcj8ubmFtZSB8fCAndW5rbm93bicsXG4gICAgICAgICAgICAgICAgICAgIHdpdGhBaTogdGhpcy5lZGl0b3JMb2FkV2l0aEFpLFxuICAgICAgICAgICAgICAgICAgICBpc0VkaXRpbmc6ICEhdGhpcy5fc2VsZWN0TGF5b3V0XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tmb3JtXSBbaW5wdXRdIGVycm9yJywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIGFsZXJ0KFwi0J7RiNC40LHQutCwINC/0YDQuCDQs9C10L3QtdGA0LDRhtC40Lgg0LjQt9C+0LHRgNCw0LbQtdC90LjRj1wiKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEdlbmVyYXRlQnV0dG9uTG9hZGluZyhmYWxzZSwgJ9Ch0LPQtdC90LXRgNC40YDQvtCy0LDRgtGMJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRDb250cm9sc0Rpc2FibGVkKGZhbHNlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzR2VuZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxvYWRlZFVzZXJJbWFnZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc2V0VXNlclVwbG9hZEltYWdlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zZWxlY3RMYXlvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0TGF5b3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW5jZWxFZGl0TGF5b3V0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBmb3JtID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm0gPSBmb3JtQmxvY2sucXVlcnlTZWxlY3RvcihcImZvcm1cIik7XG4gICAgICAgICAgICAgICAgaWYgKGZvcm0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZm9ybSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICB9LCAxMDAwICogMTApO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFmb3JtKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBmb3JtIG5vdCBmb3VuZCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZvcm0uYWN0aW9uID0gXCJcIjtcbiAgICAgICAgZm9ybS5tZXRob2QgPSBcIkdFVFwiO1xuICAgICAgICBmb3JtLm9uc3VibWl0ID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgaGFuZGxlQ2xpY2soKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgZml4SW5wdXRCbG9jayA9IGZvcm0ucXVlcnlTZWxlY3RvcihgdGV4dGFyZWFbbmFtZT0nJHtmb3JtSW5wdXRWYXJpYWJsZU5hbWV9J11gKTtcbiAgICAgICAgaWYgKGZpeElucHV0QmxvY2spIHtcbiAgICAgICAgICAgIGZpeElucHV0QmxvY2suc3R5bGUucGFkZGluZyA9IFwiOHB4XCI7XG4gICAgICAgIH1cbiAgICAgICAgZm9ybUJ1dHRvbi5vbmNsaWNrID0gaGFuZGxlQ2xpY2s7XG4gICAgICAgIGZvcm1CdXR0b24uc3R5bGUuY3Vyc29yID0gXCJwb2ludGVyXCI7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSDQmNC90LjRhtC40LDQu9C40LfQsNGG0LjRjyDRhNC+0YDQvNGLINC30LDQstC10YDRiNC10L3QsCcpO1xuICAgIH1cbiAgICByZXN0b3JlSWNvbkZyb21EYXRhT3JpZ2luYWwoZWxlbWVudCkge1xuICAgICAgICBpZiAoIWVsZW1lbnQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGRhdGFPcmlnaW5hbCA9IGVsZW1lbnQuYXR0cmlidXRlcy5nZXROYW1lZEl0ZW0oXCJkYXRhLW9yaWdpbmFsXCIpPy52YWx1ZTtcbiAgICAgICAgaWYgKGRhdGFPcmlnaW5hbCkge1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBgdXJsKFwiJHtkYXRhT3JpZ2luYWx9XCIpYDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjaGFuZ2VQcm9kdWN0KHByb2R1Y3RUeXBlKSB7XG4gICAgICAgIGlmICh0aGlzLmlzR2VuZXJhdGluZykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbY2hhbmdlUHJvZHVjdF0g0JPQtdC90LXRgNCw0YbQuNGPINCyINC/0YDQvtGG0LXRgdGB0LUsINC/0LXRgNC10LrQu9GO0YfQtdC90LjQtSDQt9Cw0LHQu9C+0LrQuNGA0L7QstCw0L3QvicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NlbGVjdFR5cGUgPSBwcm9kdWN0VHlwZTtcbiAgICAgICAgdGhpcy5jbGVhck1vY2t1cENhY2hlKCk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUocHJvZHVjdFR5cGUpO1xuICAgICAgICBpZiAocHJvZHVjdCkge1xuICAgICAgICAgICAgY29uc3QgbW9ja3VwV2l0aEN1cnJlbnRDb2xvciA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG0gPT4gbS5zaWRlID09PSB0aGlzLl9zZWxlY3RTaWRlICYmIG0uY29sb3IubmFtZSA9PT0gdGhpcy5fc2VsZWN0Q29sb3IubmFtZSk7XG4gICAgICAgICAgICBpZiAoIW1vY2t1cFdpdGhDdXJyZW50Q29sb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaXJzdE1vY2t1cCA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG0gPT4gbS5zaWRlID09PSB0aGlzLl9zZWxlY3RTaWRlKTtcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3RNb2NrdXAgJiYgZmlyc3RNb2NrdXAuY29sb3IgJiYgZmlyc3RNb2NrdXAuY29sb3IubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RDb2xvciA9IGZpcnN0TW9ja3VwLmNvbG9yO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbcHJvZHVjdF0g0KbQstC10YIg0LjQt9C80LXQvdC10L0g0L3QsCAke3RoaXMuX3NlbGVjdENvbG9yLm5hbWV9INC00LvRjyDQv9GA0L7QtNGD0LrRgtCwICR7cHJvZHVjdFR5cGV9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlUHJvZHVjdEJsb2Nrc1VJKCk7XG4gICAgICAgIHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICB9XG4gICAgdXBkYXRlUHJvZHVjdEJsb2Nrc1VJKCkge1xuICAgICAgICBpZiAodGhpcy5wcm9kdWN0QmxvY2tzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5wcm9kdWN0QmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgYmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2IoMjIyIDIyMiAyMjIpJztcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGFjdGl2ZUJsb2NrID0gdGhpcy5wcm9kdWN0QmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX3Byb2R1Y3QtYmxvY2tfXycgKyB0aGlzLl9zZWxlY3RUeXBlKSk7XG4gICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgYWN0aXZlQmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICcnO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNoYW5nZVNpZGUoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzR2VuZXJhdGluZykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbY2hhbmdlU2lkZV0g0JPQtdC90LXRgNCw0YbQuNGPINCyINC/0YDQvtGG0LXRgdGB0LUsINC/0LXRgNC10LrQu9GO0YfQtdC90LjQtSDQt9Cw0LHQu9C+0LrQuNGA0L7QstCw0L3QvicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5ld1NpZGUgPSB0aGlzLl9zZWxlY3RTaWRlID09PSAnZnJvbnQnID8gJ2JhY2snIDogJ2Zyb250JztcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVTaWRlKG5ld1NpZGUpO1xuICAgICAgICB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLlNUQVRFX0NIQU5HRUQsIHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIGNoYW5nZUNvbG9yKGNvbG9yTmFtZSkge1xuICAgICAgICBpZiAodGhpcy5pc0dlbmVyYXRpbmcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2NoYW5nZUNvbG9yXSDQk9C10L3QtdGA0LDRhtC40Y8g0LIg0L/RgNC+0YbQtdGB0YHQtSwg0L/QtdGA0LXQutC70Y7Rh9C10L3QuNC1INC30LDQsdC70L7QutC40YDQvtCy0LDQvdC+Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBtb2NrdXAgPSBwcm9kdWN0Lm1vY2t1cHMuZmluZChtID0+IG0uY29sb3IubmFtZSA9PT0gY29sb3JOYW1lKTtcbiAgICAgICAgaWYgKCFtb2NrdXAgfHwgIW1vY2t1cC5jb2xvciB8fCAhbW9ja3VwLmNvbG9yLm5hbWUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gbW9ja3VwLmNvbG9yO1xuICAgICAgICB0aGlzLmNsZWFyTW9ja3VwQ2FjaGUoKTtcbiAgICAgICAgdGhpcy51cGRhdGVDb2xvckJsb2Nrc1VJKGNvbG9yTmFtZSk7XG4gICAgICAgIHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgfVxuICAgIHVwZGF0ZUNvbG9yQmxvY2tzVUkoY29sb3JOYW1lKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbG9yQmxvY2tzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5jb2xvckJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgIGJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLmNvbG9yQmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX2NvbG9yLWJsb2NrX18nICsgY29sb3JOYW1lKSk7XG4gICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgYWN0aXZlQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjaGFuZ2VTaXplKHNpemUpIHtcbiAgICAgICAgdGhpcy51cGRhdGVTaXplQmxvY2tzVUkoc2l6ZSk7XG4gICAgICAgIHRoaXMuX3NlbGVjdFNpemUgPSBzaXplO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgIH1cbiAgICB1cGRhdGVTaXplQmxvY2tzVUkoc2l6ZSkge1xuICAgICAgICBpZiAodGhpcy5zaXplQmxvY2tzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5zaXplQmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgY29uc3QgYm9yZGVyQmxvY2sgPSBibG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGlmIChib3JkZXJCbG9jaykge1xuICAgICAgICAgICAgICAgIGJvcmRlckJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLnNpemVCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fc2l6ZS1ibG9ja19fJyArIHNpemUpKTtcbiAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICBjb25zdCBib3JkZXJCbG9jayA9IGFjdGl2ZUJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgaWYgKGJvcmRlckJsb2NrKSB7XG4gICAgICAgICAgICAgICAgYm9yZGVyQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBlZGl0TGF5b3V0KGxheW91dCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSBlZGl0IGxheW91dCAke2xheW91dC5pZH1gKTtcbiAgICAgICAgdGhpcy5fc2VsZWN0TGF5b3V0ID0gbGF5b3V0LmlkO1xuICAgICAgICBpZiAodGhpcy5mb3JtQmxvY2sgJiYgdGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGZvcm1JbnB1dCA9IHRoaXMuZm9ybUJsb2NrLnF1ZXJ5U2VsZWN0b3IoYFtuYW1lPVwiJHt0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZX1cIl1gKTtcbiAgICAgICAgICAgIGlmIChmb3JtSW5wdXQpIHtcbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQudmFsdWUgPSBsYXlvdXQubmFtZSB8fCAnJztcbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQuc3R5bGUuYm9yZGVyQ29sb3IgPSAncmdiKDI1NCwgOTQsIDU4KSc7XG4gICAgICAgICAgICAgICAgZm9ybUlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBbbGF5b3V0c10g0KPRgdGC0LDQvdC+0LLQu9C10L3QviDQt9C90LDRh9C10L3QuNC1INCyINGE0L7RgNC80YM6IFwiJHtsYXlvdXQubmFtZX1cImApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSDQndC1INC90LDQudC00LXQvSDRjdC70LXQvNC10L3RgiDRhNC+0YDQvNGLINGBINC40LzQtdC90LXQvCBcIiR7dGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWV9XCJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSkge1xuICAgICAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBsYXlvdXQudXJsO1xuICAgICAgICAgICAgdGhpcy5zZXRVc2VyVXBsb2FkSW1hZ2UobGF5b3V0LnVybCk7XG4gICAgICAgICAgICB0aGlzLmluaXRBaUJ1dHRvbnMoKTtcbiAgICAgICAgICAgIHRoaXMuaGlkZUFpQnV0dG9ucygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5yZXNldFVzZXJVcGxvYWRJbWFnZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICB9XG4gICAgY2FuY2VsRWRpdExheW91dCgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBbbGF5b3V0c10gY2FuY2VsIGVkaXQgbGF5b3V0YCk7XG4gICAgICAgIHRoaXMuX3NlbGVjdExheW91dCA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLmZvcm1CbG9jayAmJiB0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSkge1xuICAgICAgICAgICAgY29uc3QgZm9ybUlucHV0ID0gdGhpcy5mb3JtQmxvY2sucXVlcnlTZWxlY3RvcihgW25hbWU9XCIke3RoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lfVwiXWApO1xuICAgICAgICAgICAgaWYgKGZvcm1JbnB1dCkge1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC52YWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxvYWRlZFVzZXJJbWFnZSA9IG51bGw7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gW2xheW91dHNdINCg0LXQtNCw0LrRgtC40YDQvtCy0LDQvdC40LUg0L7RgtC80LXQvdC10L3QvmApO1xuICAgIH1cbiAgICBpbml0QWlCdXR0b25zKCkge1xuICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY2hhbmdlTG9hZFdpdGhBaSgpO1xuICAgICAgICB0aGlzLmNoYW5nZVJlbW92ZUJhY2tncm91bmQoKTtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlTG9hZFdpdGhBaSh0cnVlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlTG9hZFdpdGhBaShmYWxzZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yUmVtb3ZlQmFja2dyb3VuZEJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICB0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZVJlbW92ZUJhY2tncm91bmQoIXRoaXMuZWRpdG9yUmVtb3ZlQmFja2dyb3VuZCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIGhpZGVBaUJ1dHRvbnMoKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IHRydWU7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24pIHtcbiAgICAgICAgICAgICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24ucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudCkuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBzaG93QWlCdXR0b25zKCkge1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uKSB7XG4gICAgICAgICAgICAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uLnBhcmVudEVsZW1lbnQ/LnBhcmVudEVsZW1lbnQ/LnBhcmVudEVsZW1lbnQpLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBsb2FkVXNlckltYWdlKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkIHVzZXIgaW1hZ2VdIHN0YXJ0aW5nIHVzZXIgaW1hZ2UgdXBsb2FkJyk7XG4gICAgICAgIHRoaXMuc2hvd0FpQnV0dG9ucygpO1xuICAgICAgICBjb25zdCBmaWxlSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICBmaWxlSW5wdXQudHlwZSA9ICdmaWxlJztcbiAgICAgICAgZmlsZUlucHV0LmFjY2VwdCA9ICdpbWFnZS8qJztcbiAgICAgICAgZmlsZUlucHV0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGZpbGVJbnB1dC5vbmNoYW5nZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuICAgICAgICAgICAgY29uc3QgZmlsZSA9IHRhcmdldC5maWxlcz8uWzBdO1xuICAgICAgICAgICAgaWYgKGZpbGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkIHVzZXIgaW1hZ2VdIGZpbGUgc2VsZWN0ZWQ6JywgZmlsZS5uYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoIWZpbGUudHlwZS5zdGFydHNXaXRoKCdpbWFnZS8nKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1t1cGxvYWQgdXNlciBpbWFnZV0gc2VsZWN0ZWQgZmlsZSBpcyBub3QgYW4gaW1hZ2UnKTtcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ9Cf0L7QttCw0LvRg9C50YHRgtCwLCDQstGL0LHQtdGA0LjRgtC1INGE0LDQudC7INC40LfQvtCx0YDQsNC20LXQvdC40Y8nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbWFnZVVybCA9IGUudGFyZ2V0Py5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWQgdXNlciBpbWFnZV0gZmlsZSBsb2FkZWQgYXMgZGF0YSBVUkwnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VEYXRhID0gYXdhaXQgdGhpcy5nZXRJbWFnZURhdGEoaW1hZ2VVcmwpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFVzZXJVcGxvYWRJbWFnZShpbWFnZURhdGEpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkIHVzZXIgaW1hZ2VdIGltYWdlIGxheW91dCBhZGRlZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJlYWRlci5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbdXBsb2FkIHVzZXIgaW1hZ2VdIGVycm9yIHJlYWRpbmcgZmlsZScpO1xuICAgICAgICAgICAgICAgICAgICBhbGVydCgn0J7RiNC40LHQutCwINC/0YDQuCDQt9Cw0LPRgNGD0LfQutC1INGE0LDQudC70LAnKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGZpbGVJbnB1dCk7XG4gICAgICAgIGZpbGVJbnB1dC5jbGljaygpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGZpbGVJbnB1dCk7XG4gICAgfVxuICAgIHNldFVzZXJVcGxvYWRJbWFnZShpbWFnZSkge1xuICAgICAgICB0aGlzLmxvYWRlZFVzZXJJbWFnZSA9IGltYWdlO1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkVmlld0Jsb2NrLnN0eWxlLmRpc3BsYXkgPSAndGFibGUnO1xuICAgICAgICAgICAgY29uc3QgaW1hZ2VCbG9jayA9IGdldExhc3RDaGlsZCh0aGlzLmVkaXRvclVwbG9hZFZpZXdCbG9jayk7XG4gICAgICAgICAgICBpZiAoaW1hZ2VCbG9jaykge1xuICAgICAgICAgICAgICAgIGltYWdlQmxvY2suc3R5bGUuYmFja2dyb3VuZEltYWdlID0gYHVybCgke2ltYWdlfSlgO1xuICAgICAgICAgICAgICAgIGltYWdlQmxvY2suc3R5bGUuYmFja2dyb3VuZFNpemUgPSAnY29udGFpbic7XG4gICAgICAgICAgICAgICAgaW1hZ2VCbG9jay5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb24gPSAnY2VudGVyJztcbiAgICAgICAgICAgICAgICBpbWFnZUJsb2NrLnN0eWxlLmJhY2tncm91bmRSZXBlYXQgPSAnbm8tcmVwZWF0JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXNldFVzZXJVcGxvYWRJbWFnZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yVXBsb2FkVmlld0Jsb2NrKSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvclVwbG9hZFZpZXdCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubG9hZGVkVXNlckltYWdlID0gbnVsbDtcbiAgICAgICAgdGhpcy5jYW5jZWxFZGl0TGF5b3V0KCk7XG4gICAgfVxuICAgIGNoYW5nZUxvYWRXaXRoQWkodmFsdWUgPSBmYWxzZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbYWkgYnV0dG9uc10gY2hhbmdlTG9hZFdpdGhBaSDQstGL0LfQstCw0L0sIHZhbHVlPSR7dmFsdWV9YCk7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IHZhbHVlO1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uICYmIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbikge1xuICAgICAgICAgICAgY29uc3QgYnV0dG9uV2l0aEFpID0gdGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uO1xuICAgICAgICAgICAgY29uc3QgYnV0dG9uV2l0aG91dEFpID0gdGhpcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZml4QnV0dG9uV2l0aEFpID0gYnV0dG9uV2l0aEFpLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpeEJ1dHRvbldpdGhvdXRBaSA9IGJ1dHRvbldpdGhvdXRBaS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgICAgICBpZiAoZml4QnV0dG9uV2l0aEFpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpeEJ1dHRvbldpdGhBaS5zdHlsZS5ib3JkZXJDb2xvciA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbYWkgYnV0dG9uc10g0KEg0JjQmDog0YHQsdGA0L7RiNC10L0gYm9yZGVyQ29sb3IgKNC+0YDQsNC90LbQtdCy0YvQuSlgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZpeEJ1dHRvbldpdGhvdXRBaSkge1xuICAgICAgICAgICAgICAgICAgICBmaXhCdXR0b25XaXRob3V0QWkuc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YyZjJmMic7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFthaSBidXR0b25zXSDQkdC10Lcg0JjQmDog0YPRgdGC0LDQvdC+0LLQu9C10L0gYm9yZGVyQ29sb3I9I2YyZjJmMiAo0YHQtdGA0YvQuSlgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaXhCdXR0b25XaXRoQWkgPSBidXR0b25XaXRoQWkuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICAgICAgY29uc3QgZml4QnV0dG9uV2l0aG91dEFpID0gYnV0dG9uV2l0aG91dEFpLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgIGlmIChmaXhCdXR0b25XaXRoQWkpIHtcbiAgICAgICAgICAgICAgICAgICAgZml4QnV0dG9uV2l0aEFpLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmMmYyZjInO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbYWkgYnV0dG9uc10g0KEg0JjQmDog0YPRgdGC0LDQvdC+0LLQu9C10L0gYm9yZGVyQ29sb3I9I2YyZjJmMiAo0YHQtdGA0YvQuSlgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZpeEJ1dHRvbldpdGhvdXRBaSkge1xuICAgICAgICAgICAgICAgICAgICBmaXhCdXR0b25XaXRob3V0QWkuc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2FpIGJ1dHRvbnNdINCR0LXQtyDQmNCYOiDRgdCx0YDQvtGI0LXQvSBib3JkZXJDb2xvciAo0L7RgNCw0L3QttC10LLRi9C5KWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVwZGF0ZVJlbW92ZUJhY2tncm91bmRWaXNpYmlsaXR5KCk7XG4gICAgfVxuICAgIGNoYW5nZVJlbW92ZUJhY2tncm91bmQodmFsdWUgPSBmYWxzZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbcmVtb3ZlIGJnIGJ1dHRvbl0gY2hhbmdlUmVtb3ZlQmFja2dyb3VuZCDQstGL0LfQstCw0L0sIHZhbHVlPSR7dmFsdWV9YCk7XG4gICAgICAgIHRoaXMuZWRpdG9yUmVtb3ZlQmFja2dyb3VuZCA9IHZhbHVlO1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kQnV0dG9uKSB7XG4gICAgICAgICAgICBjb25zdCBidXR0b24gPSB0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b247XG4gICAgICAgICAgICBjb25zdCBmaXhCdXR0b24gPSBidXR0b24uZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBpZiAoZml4QnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpeEJ1dHRvbi5zdHlsZS5ib3JkZXJDb2xvciA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbcmVtb3ZlIGJnIGJ1dHRvbl0g0KPQsdGA0LDRgtGMINGE0L7QvTog0YHQsdGA0L7RiNC10L0gYm9yZGVyQ29sb3IgKNC+0YDQsNC90LbQtdCy0YvQuSlgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZpeEJ1dHRvbi5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjJmMmYyJztcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3JlbW92ZSBiZyBidXR0b25dINCj0LHRgNCw0YLRjCDRhNC+0L06INGD0YHRgtCw0L3QvtCy0LvQtdC9IGJvcmRlckNvbG9yPSNmMmYyZjIgKNGB0LXRgNGL0LkpYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZVJlbW92ZUJhY2tncm91bmRWaXNpYmlsaXR5KCkge1xuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yUmVtb3ZlQmFja2dyb3VuZEJ1dHRvbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgcGFyZW50RWxlbWVudCA9IHRoaXMuZWRpdG9yUmVtb3ZlQmFja2dyb3VuZEJ1dHRvbi5wYXJlbnRFbGVtZW50O1xuICAgICAgICBpZiAoIXBhcmVudEVsZW1lbnQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JMb2FkV2l0aEFpKSB7XG4gICAgICAgICAgICBwYXJlbnRFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tyZW1vdmUgYmcgYnV0dG9uXSDQmtC90L7Qv9C60LAg0L/QvtC60LDQt9Cw0L3QsCAo0JHQtdC3INCY0Jgg0LLRi9Cx0YDQsNC90L4pJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwYXJlbnRFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLmNoYW5nZVJlbW92ZUJhY2tncm91bmQoZmFsc2UpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3JlbW92ZSBiZyBidXR0b25dINCa0L3QvtC/0LrQsCDRgdC60YDRi9GC0LAgKNChINCY0Jgg0LLRi9Cx0YDQsNC90L4pJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbG9hZEltYWdlKHNyYykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgICAgICBpbWcuY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcbiAgICAgICAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiByZXNvbHZlKGltZyk7XG4gICAgICAgICAgICBpbWcub25lcnJvciA9IHJlamVjdDtcbiAgICAgICAgICAgIGltZy5zcmMgPSBzcmM7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXRRdWFudGl0eSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnF1YW50aXR5Rm9ybUJsb2NrKVxuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIGNvbnN0IGZvcm0gPSB0aGlzLnF1YW50aXR5Rm9ybUJsb2NrLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcbiAgICAgICAgY29uc3QgaW5wdXQgPSBmb3JtPy5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwicXVhbnRpdHlcIl0nKTtcbiAgICAgICAgaWYgKCFpbnB1dClcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoaW5wdXQudmFsdWUpIHx8IDE7XG4gICAgfVxuICAgIGdldFN1bSgpIHtcbiAgICAgICAgY29uc3QgaGFzRnJvbnQgPSB0aGlzLmxheW91dHMuc29tZShsYXlvdXQgPT4gbGF5b3V0LnZpZXcgPT09ICdmcm9udCcpO1xuICAgICAgICBjb25zdCBoYXNCYWNrID0gdGhpcy5sYXlvdXRzLnNvbWUobGF5b3V0ID0+IGxheW91dC52aWV3ID09PSAnYmFjaycpO1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpXG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgY29uc3QgcHJpY2UgPSBoYXNCYWNrICYmIGhhc0Zyb250XG4gICAgICAgICAgICA/IHByb2R1Y3QuZG91YmxlU2lkZWRQcmljZVxuICAgICAgICAgICAgOiBwcm9kdWN0LnByaWNlO1xuICAgICAgICByZXR1cm4gcHJpY2U7XG4gICAgfVxuICAgIHVwZGF0ZVN1bSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvclN1bUJsb2NrKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBzdW0gPSB0aGlzLmdldFN1bSgpO1xuICAgICAgICBjb25zdCBzdW1UZXh0ID0gZ2V0TGFzdENoaWxkKHRoaXMuZWRpdG9yU3VtQmxvY2spO1xuICAgICAgICBpZiAoc3VtVGV4dCkge1xuICAgICAgICAgICAgc3VtVGV4dC5pbm5lclRleHQgPSBzdW0udG9TdHJpbmcoKSArICcg4oK9JztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbikge1xuICAgICAgICAgICAgY29uc3QgYnV0dG9uQmxvY2sgPSBnZXRMYXN0Q2hpbGQodGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbik7XG4gICAgICAgICAgICBpZiAoYnV0dG9uQmxvY2spIHtcbiAgICAgICAgICAgICAgICBidXR0b25CbG9jay5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBzdW0gPT09IDAgPyAncmdiKDEyMSAxMjEgMTIxKScgOiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBsb2FkUHJvZHVjdCgpIHtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0IHx8ICFwcm9kdWN0LnByaW50Q29uZmlnKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1twcm9kdWN0XSBwcm9kdWN0IG9yIHByaW50Q29uZmlnIG5vdCBmb3VuZCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xlYXJBbGxDYW52YXMoKTtcbiAgICAgICAgZm9yIChjb25zdCBwcmludENvbmZpZyBvZiBwcm9kdWN0LnByaW50Q29uZmlnKSB7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNhbnZhc0ZvclNpZGUocHJpbnRDb25maWcpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlU2lkZSh0aGlzLl9zZWxlY3RTaWRlKTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgZmFsc2UpO1xuICAgICAgICB9LCAxMDApO1xuICAgIH1cbiAgICBjbGVhckFsbENhbnZhcygpIHtcbiAgICAgICAgaWYgKHRoaXMuY2FudmFzZXNDb250YWluZXIpIHtcbiAgICAgICAgICAgIHRoaXMuY2FudmFzZXNDb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jYW52YXNlcy5mb3JFYWNoKGNhbnZhcyA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNhbnZhcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NhbnZhc10g0J7RiNC40LHQutCwINC+0YfQuNGB0YLQutC4IGNhbnZhczonLCBlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jYW52YXNlcyA9IFtdO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzID0gW107XG4gICAgICAgIHRoaXMuYWN0aXZlQ2FudmFzID0gbnVsbDtcbiAgICB9XG4gICAgaGFuZGxlV2luZG93UmVzaXplKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbY2FudmFzXSDQmNC30LzQtdC90LXQvdC40LUg0YDQsNC30LzQtdGA0LAg0L7QutC90LAnKTtcbiAgICAgICAgY29uc3QgbmV3V2lkdGggPSB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoO1xuICAgICAgICBjb25zdCBuZXdIZWlnaHQgPSB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodDtcbiAgICAgICAgdGhpcy5jYW52YXNlcy5mb3JFYWNoKChjYW52YXMpID0+IHtcbiAgICAgICAgICAgIGNhbnZhcy5zZXRXaWR0aChuZXdXaWR0aCk7XG4gICAgICAgICAgICBjYW52YXMuc2V0SGVpZ2h0KG5ld0hlaWdodCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzLmZvckVhY2goKGNhbnZhcykgPT4ge1xuICAgICAgICAgICAgY2FudmFzLnNldFdpZHRoKG5ld1dpZHRoKTtcbiAgICAgICAgICAgIGNhbnZhcy5zZXRIZWlnaHQobmV3SGVpZ2h0KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmIChwcm9kdWN0KSB7XG4gICAgICAgICAgICBwcm9kdWN0LnByaW50Q29uZmlnLmZvckVhY2goKHByaW50Q29uZmlnKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNlcy5maW5kKGMgPT4gYy5zaWRlID09PSBwcmludENvbmZpZy5zaWRlKTtcbiAgICAgICAgICAgICAgICBpZiAoY2FudmFzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUHJpbnRBcmVhKGNhbnZhcywgcHJpbnRDb25maWcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2FudmFzZXMuZm9yRWFjaCgoY2FudmFzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzaWRlID0gY2FudmFzLnNpZGU7XG4gICAgICAgICAgICBjb25zdCBvYmplY3RzID0gY2FudmFzLmdldE9iamVjdHMoKTtcbiAgICAgICAgICAgIGNvbnN0IHRvUmVtb3ZlID0gW107XG4gICAgICAgICAgICBvYmplY3RzLmZvckVhY2goKG9iaikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChvYmoubmFtZSAhPT0gJ2FyZWE6Ym9yZGVyJyAmJlxuICAgICAgICAgICAgICAgICAgICBvYmoubmFtZSAhPT0gJ2FyZWE6Y2xpcCcgJiZcbiAgICAgICAgICAgICAgICAgICAgIW9iai5uYW1lPy5zdGFydHNXaXRoKCdndWlkZWxpbmUnKSkge1xuICAgICAgICAgICAgICAgICAgICB0b1JlbW92ZS5wdXNoKG9iaik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0b1JlbW92ZS5mb3JFYWNoKChvYmopID0+IGNhbnZhcy5yZW1vdmUob2JqKSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbY2FudmFzXSDQo9C00LDQu9C10L3QviAke3RvUmVtb3ZlLmxlbmd0aH0g0L7QsdGK0LXQutGC0L7QsiDQtNC70Y8g0L/QtdGA0LXRgNC40YHQvtCy0LrQuCDQvdCwINGB0YLQvtGA0L7QvdC1ICR7c2lkZX1gKTtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dHNGb3JTaWRlID0gdGhpcy5sYXlvdXRzLmZpbHRlcihsID0+IGwudmlldyA9PT0gc2lkZSk7XG4gICAgICAgICAgICBsYXlvdXRzRm9yU2lkZS5mb3JFYWNoKGxheW91dCA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRMYXlvdXRUb0NhbnZhcyhsYXlvdXQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjYW52YXMucmVxdWVzdFJlbmRlckFsbCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2NhbnZhc10g0KDQsNC30LzQtdGAINC40LfQvNC10L3QtdC9OicsIHsgd2lkdGg6IG5ld1dpZHRoLCBoZWlnaHQ6IG5ld0hlaWdodCB9KTtcbiAgICB9XG4gICAgdXBkYXRlUHJpbnRBcmVhKGNhbnZhcywgcHJpbnRDb25maWcpIHtcbiAgICAgICAgY29uc3Qgd2lkdGggPSBwcmludENvbmZpZy5zaXplLndpZHRoIC8gNjAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aDtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gcHJpbnRDb25maWcuc2l6ZS5oZWlnaHQgLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodDtcbiAgICAgICAgY29uc3QgbGVmdCA9ICh0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoIC0gd2lkdGgpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi54IC8gMTAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCk7XG4gICAgICAgIGNvbnN0IHRvcCA9ICh0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCAtIGhlaWdodCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnkgLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCk7XG4gICAgICAgIGNvbnN0IGNsaXBQYXRoID0gY2FudmFzLmNsaXBQYXRoO1xuICAgICAgICBpZiAoY2xpcFBhdGgpIHtcbiAgICAgICAgICAgIGNsaXBQYXRoLnNldCh7XG4gICAgICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgICAgICAgdG9wXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBib3JkZXIgPSB0aGlzLmdldE9iamVjdCgnYXJlYTpib3JkZXInLCBjYW52YXMpO1xuICAgICAgICBpZiAoYm9yZGVyKSB7XG4gICAgICAgICAgICBib3JkZXIuc2V0KHtcbiAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGggLSAzLFxuICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0IC0gMyxcbiAgICAgICAgICAgICAgICBsZWZ0LFxuICAgICAgICAgICAgICAgIHRvcFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwoKTtcbiAgICB9XG4gICAgY3JlYXRlQ2FudmFzRm9yU2lkZShwcmludENvbmZpZykge1xuICAgICAgICBpZiAoIXRoaXMuY2FudmFzZXNDb250YWluZXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tjYW52YXNdIGNhbnZhc2VzQ29udGFpbmVyINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC9Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGF5ZXJzQ2FudmFzQmxvY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgbGF5ZXJzQ2FudmFzQmxvY2suaWQgPSAnbGF5ZXJzLS0nICsgcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgbGF5ZXJzQ2FudmFzQmxvY2suY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXBvc2l0aW9uJyk7XG4gICAgICAgIGxheWVyc0NhbnZhc0Jsb2NrLnNldEF0dHJpYnV0ZSgncmVmJywgcHJpbnRDb25maWcuc2lkZSk7XG4gICAgICAgIGxheWVyc0NhbnZhc0Jsb2NrLnN0eWxlLnpJbmRleCA9ICc3JztcbiAgICAgICAgdGhpcy5jYW52YXNlc0NvbnRhaW5lci5hcHBlbmRDaGlsZChsYXllcnNDYW52YXNCbG9jayk7XG4gICAgICAgIGNvbnN0IGxheWVyc0NhbnZhcyA9IG5ldyBmYWJyaWMuU3RhdGljQ2FudmFzKGxheWVyc0NhbnZhc0Jsb2NrLCB7XG4gICAgICAgICAgICB3aWR0aDogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQsXG4gICAgICAgIH0pO1xuICAgICAgICBsYXllcnNDYW52YXMuc2lkZSA9IHByaW50Q29uZmlnLnNpZGU7XG4gICAgICAgIGxheWVyc0NhbnZhcy5uYW1lID0gJ3N0YXRpYy0nICsgcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgY29uc3QgZWRpdGFibGVDYW52YXNCbG9jayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBlZGl0YWJsZUNhbnZhc0Jsb2NrLmlkID0gJ2VkaXRhYmxlLS0nICsgcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgZWRpdGFibGVDYW52YXNCbG9jay5zZXRBdHRyaWJ1dGUoJ3JlZicsIHByaW50Q29uZmlnLnNpZGUpO1xuICAgICAgICBlZGl0YWJsZUNhbnZhc0Jsb2NrLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1wb3NpdGlvbicpO1xuICAgICAgICBlZGl0YWJsZUNhbnZhc0Jsb2NrLnN0eWxlLnpJbmRleCA9ICc5JztcbiAgICAgICAgdGhpcy5jYW52YXNlc0NvbnRhaW5lci5hcHBlbmRDaGlsZChlZGl0YWJsZUNhbnZhc0Jsb2NrKTtcbiAgICAgICAgY29uc3QgZWRpdGFibGVDYW52YXMgPSBuZXcgZmFicmljLkNhbnZhcyhlZGl0YWJsZUNhbnZhc0Jsb2NrLCB7XG4gICAgICAgICAgICBjb250cm9sc0Fib3ZlT3ZlcmxheTogdHJ1ZSxcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgIHVuaWZvcm1TY2FsaW5nOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBlZGl0YWJsZUNhbnZhcy5zaWRlID0gcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgZWRpdGFibGVDYW52YXMubmFtZSA9ICdlZGl0YWJsZS0nICsgcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgdGhpcy5sYXllcnNDYW52YXNlcy5wdXNoKGxheWVyc0NhbnZhcyk7XG4gICAgICAgIHRoaXMuY2FudmFzZXMucHVzaChlZGl0YWJsZUNhbnZhcyk7XG4gICAgICAgIGlmICh0aGlzLmNhbnZhc2VzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVDYW52YXMgPSBlZGl0YWJsZUNhbnZhcztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluaXRNYWluQ2FudmFzKGVkaXRhYmxlQ2FudmFzLCBwcmludENvbmZpZyk7XG4gICAgfVxuICAgIGluaXRNYWluQ2FudmFzKGNhbnZhcywgcHJpbnRDb25maWcpIHtcbiAgICAgICAgaWYgKCFjYW52YXMgfHwgIShjYW52YXMgaW5zdGFuY2VvZiBmYWJyaWMuQ2FudmFzKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbY2FudmFzXSBjYW52YXMg0L3QtSDQstCw0LvQuNC00LXQvScpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHdpZHRoID0gcHJpbnRDb25maWcuc2l6ZS53aWR0aCAvIDYwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGg7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IHByaW50Q29uZmlnLnNpemUuaGVpZ2h0IC8gNjAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQ7XG4gICAgICAgIGNvbnN0IGxlZnQgPSAodGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCAtIHdpZHRoKSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueCAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgpO1xuICAgICAgICBjb25zdCB0b3AgPSAodGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQgLSBoZWlnaHQpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi55IC8gMTAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQpO1xuICAgICAgICBjb25zdCBjbGlwQXJlYSA9IG5ldyBmYWJyaWMuUmVjdCh7XG4gICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodCxcbiAgICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgICB0b3AsXG4gICAgICAgICAgICBmaWxsOiAncmdiKDI1NSwgMCwgMCknLFxuICAgICAgICAgICAgbmFtZTogJ2FyZWE6Y2xpcCcsXG4gICAgICAgICAgICBldmVudGVkOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGFyZWFCb3JkZXIgPSBuZXcgZmFicmljLlJlY3Qoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoIC0gMyxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0IC0gMyxcbiAgICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgICB0b3AsXG4gICAgICAgICAgICBmaWxsOiAncmdiYSgwLDAsMCwwKScsXG4gICAgICAgICAgICBzdHJva2VXaWR0aDogMyxcbiAgICAgICAgICAgIHN0cm9rZTogJ3JnYigyNTQsIDk0LCA1OCknLFxuICAgICAgICAgICAgbmFtZTogJ2FyZWE6Ym9yZGVyJyxcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuMyxcbiAgICAgICAgICAgIGV2ZW50ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgc2VsZWN0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICBoYXNDb250cm9sczogZmFsc2UsXG4gICAgICAgICAgICBzdHJva2VEYXNoQXJyYXk6IFs1LCA1XSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNhbnZhcy5hZGQoYXJlYUJvcmRlcik7XG4gICAgICAgIGNhbnZhcy5jbGlwUGF0aCA9IGNsaXBBcmVhO1xuICAgICAgICB0aGlzLnNldHVwQ2FudmFzRXZlbnRIYW5kbGVycyhjYW52YXMsIHByaW50Q29uZmlnKTtcbiAgICB9XG4gICAgc2V0dXBDYW52YXNFdmVudEhhbmRsZXJzKGNhbnZhcywgcHJpbnRDb25maWcpIHtcbiAgICAgICAgY2FudmFzLm9uKCdtb3VzZTpkb3duJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYm9yZGVyID0gdGhpcy5nZXRPYmplY3QoJ2FyZWE6Ym9yZGVyJywgY2FudmFzKTtcbiAgICAgICAgICAgIGlmIChib3JkZXIpIHtcbiAgICAgICAgICAgICAgICBib3JkZXIuc2V0KCdvcGFjaXR5JywgMC44KTtcbiAgICAgICAgICAgICAgICBjYW52YXMucmVxdWVzdFJlbmRlckFsbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLm9uKCdtb3VzZTp1cCcsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGJvcmRlciA9IHRoaXMuZ2V0T2JqZWN0KCdhcmVhOmJvcmRlcicsIGNhbnZhcyk7XG4gICAgICAgICAgICBpZiAoYm9yZGVyKSB7XG4gICAgICAgICAgICAgICAgYm9yZGVyLnNldCgnb3BhY2l0eScsIDAuMyk7XG4gICAgICAgICAgICAgICAgY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNhbnZhcy5vbignb2JqZWN0OnJvdGF0aW5nJywgKGUpID0+IHtcbiAgICAgICAgICAgIGlmIChlLnRhcmdldD8uYW5nbGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFuZ2xlcyA9IFswLCA5MCwgMTgwLCAyNzBdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRBbmdsZSA9IGUudGFyZ2V0LmFuZ2xlICUgMzYwO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc25hcEFuZ2xlIG9mIGFuZ2xlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoY3VycmVudEFuZ2xlIC0gc25hcEFuZ2xlKSA8IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUudGFyZ2V0LnJvdGF0ZShzbmFwQW5nbGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLm9uKCdvYmplY3Q6bW92aW5nJywgKGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlT2JqZWN0TW92aW5nKGUsIGNhbnZhcywgcHJpbnRDb25maWcpO1xuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLm9uKCdvYmplY3Q6bW9kaWZpZWQnLCAoZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVPYmplY3RNb2RpZmllZChlLCBjYW52YXMsIHByaW50Q29uZmlnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGhhbmRsZU9iamVjdE1vdmluZyhlLCBjYW52YXMsIHByaW50Q29uZmlnKSB7XG4gICAgICAgIGlmICghZS50YXJnZXQgfHwgZS50YXJnZXQubmFtZSA9PT0gJ2FyZWE6Ym9yZGVyJyB8fCBlLnRhcmdldC5uYW1lID09PSAnYXJlYTpjbGlwJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0cy5maW5kKGwgPT4gbC5pZCA9PT0gZS50YXJnZXQubmFtZSk7XG4gICAgICAgIGlmICghbGF5b3V0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGRpbWVuc2lvbnMgPSBjYWxjdWxhdGVMYXlvdXREaW1lbnNpb25zKGxheW91dCwgcHJvZHVjdCwgdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCwgdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQpO1xuICAgICAgICBjb25zdCBvYmpXaWR0aCA9IGUudGFyZ2V0LndpZHRoICogZS50YXJnZXQuc2NhbGVYO1xuICAgICAgICBjb25zdCBvYmpIZWlnaHQgPSBlLnRhcmdldC5oZWlnaHQgKiBlLnRhcmdldC5zY2FsZVk7XG4gICAgICAgIGNvbnN0IG9iakNlbnRlckxlZnQgPSBlLnRhcmdldC5sZWZ0ICsgb2JqV2lkdGggLyAyO1xuICAgICAgICBjb25zdCBvYmpDZW50ZXJUb3AgPSBlLnRhcmdldC50b3AgKyBvYmpIZWlnaHQgLyAyO1xuICAgICAgICBjb25zdCBjZW50ZXJYID0gZGltZW5zaW9ucy5wcmludEFyZWFMZWZ0ICsgZGltZW5zaW9ucy5wcmludEFyZWFXaWR0aCAvIDI7XG4gICAgICAgIGNvbnN0IGNlbnRlclkgPSBkaW1lbnNpb25zLnByaW50QXJlYVRvcCArIGRpbWVuc2lvbnMucHJpbnRBcmVhSGVpZ2h0IC8gMjtcbiAgICAgICAgY29uc3QgbmVhclggPSBNYXRoLmFicyhvYmpDZW50ZXJMZWZ0IC0gY2VudGVyWCkgPCA3O1xuICAgICAgICBjb25zdCBuZWFyWSA9IE1hdGguYWJzKG9iakNlbnRlclRvcCAtIGNlbnRlclkpIDwgNztcbiAgICAgICAgaWYgKG5lYXJYKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dHdWlkZWxpbmUoY2FudmFzLCAndmVydGljYWwnLCBjZW50ZXJYLCAwLCBjZW50ZXJYLCB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCk7XG4gICAgICAgICAgICBlLnRhcmdldC5zZXQoeyBsZWZ0OiBjZW50ZXJYIC0gb2JqV2lkdGggLyAyIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5oaWRlR3VpZGVsaW5lKGNhbnZhcywgJ3ZlcnRpY2FsJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5lYXJZKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dHdWlkZWxpbmUoY2FudmFzLCAnaG9yaXpvbnRhbCcsIDAsIGNlbnRlclksIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgsIGNlbnRlclkpO1xuICAgICAgICAgICAgZS50YXJnZXQuc2V0KHsgdG9wOiBjZW50ZXJZIC0gb2JqSGVpZ2h0IC8gMiB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaGlkZUd1aWRlbGluZShjYW52YXMsICdob3Jpem9udGFsJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaGFuZGxlT2JqZWN0TW9kaWZpZWQoZSwgY2FudmFzLCBwcmludENvbmZpZykge1xuICAgICAgICBjb25zdCBvYmplY3QgPSBlLnRhcmdldDtcbiAgICAgICAgaWYgKCFvYmplY3QpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuaGlkZUd1aWRlbGluZShjYW52YXMsICd2ZXJ0aWNhbCcpO1xuICAgICAgICB0aGlzLmhpZGVHdWlkZWxpbmUoY2FudmFzLCAnaG9yaXpvbnRhbCcpO1xuICAgICAgICBjb25zdCBsYXlvdXQgPSB0aGlzLmxheW91dHMuZmluZChsID0+IGwuaWQgPT09IG9iamVjdC5uYW1lKTtcbiAgICAgICAgaWYgKCFsYXlvdXQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZGltZW5zaW9ucyA9IGNhbGN1bGF0ZUxheW91dERpbWVuc2lvbnMobGF5b3V0LCBwcm9kdWN0LCB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoLCB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCk7XG4gICAgICAgIGxheW91dC5wb3NpdGlvbi54ID0gKG9iamVjdC5sZWZ0IC0gZGltZW5zaW9ucy5wcmludEFyZWFMZWZ0KSAvIGRpbWVuc2lvbnMucHJpbnRBcmVhV2lkdGg7XG4gICAgICAgIGxheW91dC5wb3NpdGlvbi55ID0gKG9iamVjdC50b3AgLSBkaW1lbnNpb25zLnByaW50QXJlYVRvcCkgLyBkaW1lbnNpb25zLnByaW50QXJlYUhlaWdodDtcbiAgICAgICAgbGF5b3V0LnNpemUgPSBvYmplY3Quc2NhbGVYO1xuICAgICAgICBsYXlvdXQuYXNwZWN0UmF0aW8gPSBvYmplY3Quc2NhbGVZIC8gb2JqZWN0LnNjYWxlWDtcbiAgICAgICAgbGF5b3V0LmFuZ2xlID0gb2JqZWN0LmFuZ2xlO1xuICAgICAgICBjb25zdCBvYmplY3RXaWR0aCA9IChvYmplY3Qud2lkdGggKiBvYmplY3Quc2NhbGVYKTtcbiAgICAgICAgY29uc3QgcmVsYXRpdmVXaWR0aCA9IG9iamVjdFdpZHRoIC8gZGltZW5zaW9ucy5wcmludEFyZWFXaWR0aDtcbiAgICAgICAgbGF5b3V0Ll9yZWxhdGl2ZVdpZHRoID0gcmVsYXRpdmVXaWR0aDtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2NhbnZhc10gTGF5b3V0ICR7bGF5b3V0LmlkfSB1cGRhdGVkOiBwb3NpdGlvbj0oJHtsYXlvdXQucG9zaXRpb24ueC50b0ZpeGVkKDMpfSwgJHtsYXlvdXQucG9zaXRpb24ueS50b0ZpeGVkKDMpfSksIHNpemU9JHtsYXlvdXQuc2l6ZS50b0ZpeGVkKDMpfSwgcmVsYXRpdmVXaWR0aD0ke3JlbGF0aXZlV2lkdGgudG9GaXhlZCgzKX1gKTtcbiAgICAgICAgdGhpcy5zYXZlTGF5b3V0cygpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbbGF5ZXJzXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y8g0YHQu9C+0ZHQsjonLCBlcnIpKTtcbiAgICB9XG4gICAgc2hvd0d1aWRlbGluZShjYW52YXMsIHR5cGUsIHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBgZ3VpZGVsaW5lOiR7dHlwZX1gO1xuICAgICAgICBsZXQgZ3VpZGVsaW5lID0gdGhpcy5nZXRPYmplY3QobmFtZSwgY2FudmFzKTtcbiAgICAgICAgaWYgKCFndWlkZWxpbmUpIHtcbiAgICAgICAgICAgIGd1aWRlbGluZSA9IG5ldyBmYWJyaWMuTGluZShbeDEsIHkxLCB4MiwgeTJdLCB7XG4gICAgICAgICAgICAgICAgc3Ryb2tlOiAncmdiKDI1NCwgOTQsIDU4KScsXG4gICAgICAgICAgICAgICAgc3Ryb2tlV2lkdGg6IDIsXG4gICAgICAgICAgICAgICAgc3Ryb2tlRGFzaEFycmF5OiBbNSwgNV0sXG4gICAgICAgICAgICAgICAgc2VsZWN0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXZlbnRlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGd1aWRlbGluZSkge1xuICAgICAgICAgICAgICAgIGNhbnZhcy5hZGQoZ3VpZGVsaW5lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBoaWRlR3VpZGVsaW5lKGNhbnZhcywgdHlwZSkge1xuICAgICAgICBjb25zdCBndWlkZWxpbmUgPSB0aGlzLmdldE9iamVjdChgZ3VpZGVsaW5lOiR7dHlwZX1gLCBjYW52YXMpO1xuICAgICAgICBpZiAoZ3VpZGVsaW5lKSB7XG4gICAgICAgICAgICBjYW52YXMucmVtb3ZlKGd1aWRlbGluZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0T2JqZWN0KG5hbWUsIGNhbnZhcykge1xuICAgICAgICBjb25zdCB0YXJnZXRDYW52YXMgPSBjYW52YXMgfHwgdGhpcy5hY3RpdmVDYW52YXMgfHwgdGhpcy5jYW52YXNlc1swXTtcbiAgICAgICAgaWYgKCF0YXJnZXRDYW52YXMpXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gdGFyZ2V0Q2FudmFzLmdldE9iamVjdHMoKS5maW5kKG9iaiA9PiBvYmoubmFtZSA9PT0gbmFtZSk7XG4gICAgfVxuICAgIHNldEFjdGl2ZVNpZGUoc2lkZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbY2FudmFzXSDQo9GB0YLQsNC90L7QstC60LAg0LDQutGC0LjQstC90L7QuSDRgdGC0L7RgNC+0L3RizonLCBzaWRlKTtcbiAgICAgICAgdGhpcy5jYW52YXNlcy5mb3JFYWNoKGNhbnZhcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBjYW52YXNFbGVtZW50ID0gY2FudmFzLmdldEVsZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lckVsZW1lbnQgPSBjYW52YXNFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICBpZiAoY2FudmFzLnNpZGUgPT09IHNpZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNhbnZhcyA9IGNhbnZhcztcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhbnZhc0VsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FudmFzRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5sYXllcnNDYW52YXNlcy5mb3JFYWNoKGxheWVyc0NhbnZhcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBjYW52YXNFbGVtZW50ID0gbGF5ZXJzQ2FudmFzLmdldEVsZW1lbnQoKTtcbiAgICAgICAgICAgIGNhbnZhc0VsZW1lbnQuc3R5bGUuZGlzcGxheSA9IGxheWVyc0NhbnZhcy5zaWRlID09PSBzaWRlID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX3NlbGVjdFNpZGUgPSBzaWRlO1xuICAgIH1cbiAgICBhc3luYyBhZGRMYXlvdXRUb0NhbnZhcyhsYXlvdXQpIHtcbiAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNlcy5maW5kKGMgPT4gYy5zaWRlID09PSBsYXlvdXQudmlldyk7XG4gICAgICAgIGlmICghY2FudmFzKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtjYW52YXNdIGNhbnZhcyDQtNC70Y8gJHtsYXlvdXQudmlld30g0L3QtSDQvdCw0LnQtNC10L1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGZhYnJpY09iamVjdCA9IGF3YWl0IHJlbmRlckxheW91dCh7XG4gICAgICAgICAgICBsYXlvdXQsXG4gICAgICAgICAgICBwcm9kdWN0LFxuICAgICAgICAgICAgY29udGFpbmVyV2lkdGg6IHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgsXG4gICAgICAgICAgICBjb250YWluZXJIZWlnaHQ6IHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0LFxuICAgICAgICAgICAgbG9hZEltYWdlOiB0aGlzLmxvYWRJbWFnZS5iaW5kKHRoaXMpXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoZmFicmljT2JqZWN0KSB7XG4gICAgICAgICAgICBjYW52YXMuYWRkKGZhYnJpY09iamVjdCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlTGF5b3V0cygpIHtcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZUNhbnZhcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzRm9yU2lkZSh0aGlzLl9zZWxlY3RTaWRlKTtcbiAgICB9XG4gICAgdXBkYXRlTGF5b3V0c0ZvclNpZGUoc2lkZSkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc2VzLmZpbmQoYyA9PiBjLnNpZGUgPT09IHNpZGUpO1xuICAgICAgICBpZiAoIWNhbnZhcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgb2JqZWN0cyA9IGNhbnZhcy5nZXRPYmplY3RzKCk7XG4gICAgICAgIGNvbnN0IG9iamVjdHNUb1JlbW92ZSA9IG9iamVjdHNcbiAgICAgICAgICAgIC5maWx0ZXIob2JqID0+IG9iai5uYW1lICE9PSAnYXJlYTpib3JkZXInICYmIG9iai5uYW1lICE9PSAnYXJlYTpjbGlwJyAmJiAhb2JqLm5hbWU/LnN0YXJ0c1dpdGgoJ2d1aWRlbGluZScpKVxuICAgICAgICAgICAgLmZpbHRlcihvYmogPT4gIXRoaXMubGF5b3V0cy5maW5kKGxheW91dCA9PiBsYXlvdXQuaWQgPT09IG9iai5uYW1lKSk7XG4gICAgICAgIG9iamVjdHNUb1JlbW92ZS5mb3JFYWNoKG9iaiA9PiB7XG4gICAgICAgICAgICBjYW52YXMucmVtb3ZlKG9iaik7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBsYXlvdXRzRm9yU2lkZSA9IHRoaXMubGF5b3V0cy5maWx0ZXIobGF5b3V0ID0+IGxheW91dC52aWV3ID09PSBzaWRlKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0c1RvVXBkYXRlID0gW107XG4gICAgICAgIGNvbnN0IG9iamVjdHNUb0FkZCA9IFtdO1xuICAgICAgICBsYXlvdXRzRm9yU2lkZS5mb3JFYWNoKGxheW91dCA9PiB7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ09iaiA9IG9iamVjdHMuZmluZChvYmogPT4gb2JqLm5hbWUgPT09IGxheW91dC5pZCk7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdPYmopIHtcbiAgICAgICAgICAgICAgICBpZiAobGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSAmJiBleGlzdGluZ09iai5sYXlvdXRVcmwgIT09IGxheW91dC51cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2NhbnZhc10gTGF5b3V0ICR7bGF5b3V0LmlkfSDQuNC30LzQtdC90LjQu9GB0Y8sINGC0YDQtdCx0YPQtdGC0YHRjyDQvtCx0L3QvtCy0LvQtdC90LjQtWApO1xuICAgICAgICAgICAgICAgICAgICBvYmplY3RzVG9VcGRhdGUucHVzaChsYXlvdXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG9iamVjdHNUb0FkZC5wdXNoKGxheW91dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBvYmplY3RzVG9VcGRhdGUuZm9yRWFjaChsYXlvdXQgPT4ge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdPYmogPSBvYmplY3RzLmZpbmQob2JqID0+IG9iai5uYW1lID09PSBsYXlvdXQuaWQpO1xuICAgICAgICAgICAgaWYgKGV4aXN0aW5nT2JqKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2NhbnZhc10g0KPQtNCw0LvRj9C10Lwg0YHRgtCw0YDRi9C5INC+0LHRitC10LrRgiDQtNC70Y8g0L7QsdC90L7QstC70LXQvdC40Y86ICR7bGF5b3V0LmlkfWApO1xuICAgICAgICAgICAgICAgIGNhbnZhcy5yZW1vdmUoZXhpc3RpbmdPYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2NhbnZhc10g0JTQvtCx0LDQstC70Y/QtdC8INC+0LHQvdC+0LLQu9C10L3QvdGL0Lkg0L7QsdGK0LXQutGCOiAke2xheW91dC5pZH1gKTtcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5b3V0VG9DYW52YXMobGF5b3V0KTtcbiAgICAgICAgfSk7XG4gICAgICAgIG9iamVjdHNUb0FkZC5mb3JFYWNoKGxheW91dCA9PiB7XG4gICAgICAgICAgICB0aGlzLmFkZExheW91dFRvQ2FudmFzKGxheW91dCk7XG4gICAgICAgIH0pO1xuICAgICAgICBjYW52YXMucmVuZGVyQWxsKCk7XG4gICAgfVxuICAgIGFzeW5jIHByZWxvYWRBbGxNb2NrdXBzKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbcHJlbG9hZF0g0J3QsNGH0LDQu9C+INC/0YDQtdC00LfQsNCz0YDRg9C30LrQuCBtb2NrdXBzJyk7XG4gICAgICAgIGZvciAoY29uc3QgcHJvZHVjdCBvZiB0aGlzLnByb2R1Y3RDb25maWdzKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG1vY2t1cCBvZiBwcm9kdWN0Lm1vY2t1cHMpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2NrdXBEYXRhVXJsID0gYXdhaXQgdGhpcy5nZXRJbWFnZURhdGEobW9ja3VwLnVybCk7XG4gICAgICAgICAgICAgICAgICAgIG1vY2t1cC51cmwgPSBtb2NrdXBEYXRhVXJsO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbcHJlbG9hZF0gTW9ja3VwINC30LDQs9GA0YPQttC10L06ICR7bW9ja3VwLmNvbG9yLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbcHJlbG9hZF0g0J7RiNC40LHQutCwINC30LDQs9GA0YPQt9C60LggbW9ja3VwICR7bW9ja3VwLnVybH06YCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdbcHJlbG9hZF0g0J/RgNC10LTQt9Cw0LPRgNGD0LfQutCwINC30LDQstC10YDRiNC10L3QsCcpO1xuICAgIH1cbiAgICBhc3luYyBnZXRJbWFnZURhdGEodXJsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvYWRBbmRDb252ZXJ0SW1hZ2UodXJsKTtcbiAgICB9XG4gICAgYXN5bmMgdXBsb2FkSW1hZ2UoZmlsZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkXSDQl9Cw0LPRgNGD0LfQutCwINGE0LDQudC70LA6JywgZmlsZS5uYW1lKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhVXJsID0gZS50YXJnZXQ/LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkRGF0YVVybCA9IGF3YWl0IHRoaXMuZ2V0SW1hZ2VEYXRhKGRhdGFVcmwpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkXSDQpNCw0LnQuyDRg9GB0L/QtdGI0L3QviDQt9Cw0LPRgNGD0LbQtdC9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoY29udmVydGVkRGF0YVVybCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBsb2dJc3N1ZSgnbG9hZF9maWxlJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVfbmFtZTogZmlsZS5uYW1lXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbdXBsb2FkXSDQntGI0LjQsdC60LAg0L7QsdGA0LDQsdC+0YLQutC4INGE0LDQudC70LA6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZWFkZXIub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbdXBsb2FkXSDQntGI0LjQsdC60LAg0YfRgtC10L3QuNGPINGE0LDQudC70LAnKTtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCfQndC1INGD0LTQsNC70L7RgdGMINC/0YDQvtGH0LjRgtCw0YLRjCDRhNCw0LnQuycpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIHVwbG9hZEltYWdlVG9TZXJ2ZXIoYmFzZTY0KSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWRdINCX0LDQs9GA0YPQt9C60LAg0LjQt9C+0LHRgNCw0LbQtdC90LjRjyDQvdCwINGB0LXRgNCy0LXRgCcpO1xuICAgICAgICBjb25zdCB1c2VySWQgPSBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLmdldFVzZXJJZCgpO1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHRoaXMuYXBpQ29uZmlnLnVwbG9hZEltYWdlLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgaW1hZ2U6IGJhc2U2NCwgdXNlcl9pZDogdXNlcklkIH0pLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkXSDQmNC30L7QsdGA0LDQttC10L3QuNC1INC30LDQs9GA0YPQttC10L3QviDQvdCwINGB0LXRgNCy0LXRgDonLCBkYXRhLmltYWdlX3VybCk7XG4gICAgICAgIHJldHVybiBkYXRhLmltYWdlX3VybDtcbiAgICB9XG4gICAgZ2V0UHJvZHVjdE5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk/LnByb2R1Y3ROYW1lIHx8ICcnO1xuICAgIH1cbiAgICBjYXBpdGFsaXplRmlyc3RMZXR0ZXIoc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSk7XG4gICAgfVxuICAgIGdldE1vY2t1cFVybChzaWRlKSB7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBjb25zdCBtb2NrdXAgPSBwcm9kdWN0Lm1vY2t1cHMuZmluZChtb2NrdXAgPT4gbW9ja3VwLnNpZGUgPT09IHNpZGUgJiYgbW9ja3VwLmNvbG9yLm5hbWUgPT09IHRoaXMuX3NlbGVjdENvbG9yLm5hbWUpO1xuICAgICAgICByZXR1cm4gbW9ja3VwID8gbW9ja3VwLnVybCA6IG51bGw7XG4gICAgfVxuICAgIGFzeW5jIGV4cG9ydEFydCh3aXRoTW9ja3VwID0gdHJ1ZSwgcmVzb2x1dGlvbiA9IDEwMjQpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgIGNvbnN0IHNpZGVzV2l0aExheWVycyA9IHRoaXMuZ2V0U2lkZXNXaXRoTGF5ZXJzKCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tleHBvcnRdINCd0LDQudC00LXQvdGLINGB0YLQvtGA0L7QvdGLINGBINGB0LvQvtGP0LzQuDonLCBzaWRlc1dpdGhMYXllcnMsICcoZnJvbnQg0L/QtdGA0LLRi9C5KScsIHdpdGhNb2NrdXAgPyAn0YEg0LzQvtC60LDQv9C+0LwnIDogJ9Cx0LXQtyDQvNC+0LrQsNC/0LAnLCBg0YDQsNC30YDQtdGI0LXQvdC40LU6ICR7cmVzb2x1dGlvbn1weGApO1xuICAgICAgICBjb25zdCBleHBvcnRQcm9taXNlcyA9IHNpZGVzV2l0aExheWVycy5tYXAoYXN5bmMgKHNpZGUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXhwb3J0ZWRTaWRlID0gYXdhaXQgdGhpcy5leHBvcnRTaWRlKHNpZGUsIHdpdGhNb2NrdXAsIHJlc29sdXRpb24pO1xuICAgICAgICAgICAgICAgIGlmIChleHBvcnRlZFNpZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0KHRgtC+0YDQvtC90LAgJHtzaWRlfSDRg9GB0L/QtdGI0L3QviDRjdC60YHQv9C+0YDRgtC40YDQvtCy0LDQvdCwYCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHNpZGUsIGRhdGE6IGV4cG9ydGVkU2lkZSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtleHBvcnRdINCe0YjQuNCx0LrQsCDQv9GA0Lgg0Y3QutGB0L/QvtGA0YLQtSDRgdGC0L7RgNC+0L3RiyAke3NpZGV9OmAsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBsb2dJc3N1ZSgnZXhwb3J0X3NpZGVfZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICAgICAgICAgIHNpZGU6IHNpZGUsXG4gICAgICAgICAgICAgICAgICAgIHdpdGhNb2NrdXA6IHdpdGhNb2NrdXAsXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdXRpb246IHJlc29sdXRpb25cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZXhwb3J0ZWRTaWRlcyA9IGF3YWl0IFByb21pc2UuYWxsKGV4cG9ydFByb21pc2VzKTtcbiAgICAgICAgZXhwb3J0ZWRTaWRlcy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHRbaXRlbS5zaWRlXSA9IGl0ZW0uZGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCt0LrRgdC/0L7RgNGCINC30LDQstC10YDRiNC10L0g0LTQu9GPICR7T2JqZWN0LmtleXMocmVzdWx0KS5sZW5ndGh9INGB0YLQvtGA0L7QvWApO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBnZXRTaWRlc1dpdGhMYXllcnMoKSB7XG4gICAgICAgIGNvbnN0IGFsbFNpZGVzV2l0aExheWVycyA9IFsuLi5uZXcgU2V0KHRoaXMubGF5b3V0cy5tYXAobGF5b3V0ID0+IGxheW91dC52aWV3KSldO1xuICAgICAgICByZXR1cm4gYWxsU2lkZXNXaXRoTGF5ZXJzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIGlmIChhID09PSAnZnJvbnQnKVxuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIGlmIChiID09PSAnZnJvbnQnKVxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBleHBvcnRTaWRlKHNpZGUsIHdpdGhNb2NrdXAgPSB0cnVlLCByZXNvbHV0aW9uID0gMTAyNCkge1xuICAgICAgICBjb25zdCBjYW52YXNlcyA9IHRoaXMuZ2V0Q2FudmFzZXNGb3JTaWRlKHNpZGUpO1xuICAgICAgICBpZiAoIWNhbnZhc2VzLmVkaXRhYmxlQ2FudmFzKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtleHBvcnRdIENhbnZhcyDQtNC70Y8g0YHRgtC+0YDQvtC90YsgJHtzaWRlfSDQvdC1INC90LDQudC00LXQvWApO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzRm9yU2lkZShzaWRlKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0K3QutGB0L/QvtGA0YLQuNGA0YPQtdC8INGB0YLQvtGA0L7QvdGDICR7c2lkZX0ke3dpdGhNb2NrdXAgPyAnINGBINC80L7QutCw0L/QvtC8JyA6ICcg0LHQtdC3INC80L7QutCw0L/QsCd9ICgke3Jlc29sdXRpb259cHgpLi4uYCk7XG4gICAgICAgIGlmICghd2l0aE1vY2t1cCkge1xuICAgICAgICAgICAgY29uc3QgY3JvcHBlZENhbnZhcyA9IGF3YWl0IHRoaXMuZXhwb3J0RGVzaWduV2l0aENsaXBQYXRoKGNhbnZhc2VzLmVkaXRhYmxlQ2FudmFzLCBjYW52YXNlcy5sYXllcnNDYW52YXMsIHNpZGUsIHJlc29sdXRpb24pO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0K3QutGB0L/QvtGA0YLQuNGA0L7QstCw0L0g0YfQuNGB0YLRi9C5INC00LjQt9Cw0LnQvSDQtNC70Y8gJHtzaWRlfSAo0L7QsdGA0LXQt9Cw0L0g0L/QviBjbGlwUGF0aClgKTtcbiAgICAgICAgICAgIHJldHVybiBjcm9wcGVkQ2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJywgMS4wKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtb2NrdXBJbWcgPSBhd2FpdCB0aGlzLmxvYWRNb2NrdXBGb3JTaWRlKHNpZGUpO1xuICAgICAgICBpZiAoIW1vY2t1cEltZylcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBjb25zdCBwcmludENvbmZpZyA9IHByb2R1Y3Q/LnByaW50Q29uZmlnLmZpbmQocGMgPT4gcGMuc2lkZSA9PT0gc2lkZSk7XG4gICAgICAgIGlmICghcHJpbnRDb25maWcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2V4cG9ydF0g0J3QtSDQvdCw0LnQtNC10L3QsCDQutC+0L3RhNC40LPRg9GA0LDRhtC40Y8g0L/QtdGH0LDRgtC4INC00LvRjyAke3NpZGV9YCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IGNhbnZhczogdGVtcENhbnZhcywgY3R4LCBtb2NrdXBEaW1lbnNpb25zIH0gPSB0aGlzLmNyZWF0ZUV4cG9ydENhbnZhcyhyZXNvbHV0aW9uLCBtb2NrdXBJbWcpO1xuICAgICAgICBjb25zdCBjcm9wcGVkRGVzaWduQ2FudmFzID0gYXdhaXQgdGhpcy5leHBvcnREZXNpZ25XaXRoQ2xpcFBhdGgoY2FudmFzZXMuZWRpdGFibGVDYW52YXMsIGNhbnZhc2VzLmxheWVyc0NhbnZhcywgc2lkZSwgcmVzb2x1dGlvbik7XG4gICAgICAgIGNvbnN0IHByaW50QXJlYVdpZHRoID0gKHByaW50Q29uZmlnLnNpemUud2lkdGggLyA2MDApICogbW9ja3VwRGltZW5zaW9ucy53aWR0aDtcbiAgICAgICAgY29uc3QgcHJpbnRBcmVhSGVpZ2h0ID0gKHByaW50Q29uZmlnLnNpemUuaGVpZ2h0IC8gNjAwKSAqIG1vY2t1cERpbWVuc2lvbnMuaGVpZ2h0O1xuICAgICAgICBjb25zdCBwcmludEFyZWFYID0gbW9ja3VwRGltZW5zaW9ucy54ICsgKG1vY2t1cERpbWVuc2lvbnMud2lkdGggLSBwcmludEFyZWFXaWR0aCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnggLyAxMDApICogbW9ja3VwRGltZW5zaW9ucy53aWR0aDtcbiAgICAgICAgY29uc3QgcHJpbnRBcmVhWSA9IG1vY2t1cERpbWVuc2lvbnMueSArIChtb2NrdXBEaW1lbnNpb25zLmhlaWdodCAtIHByaW50QXJlYUhlaWdodCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnkgLyAxMDApICogbW9ja3VwRGltZW5zaW9ucy5oZWlnaHQ7XG4gICAgICAgIGN0eC5kcmF3SW1hZ2UoY3JvcHBlZERlc2lnbkNhbnZhcywgMCwgMCwgY3JvcHBlZERlc2lnbkNhbnZhcy53aWR0aCwgY3JvcHBlZERlc2lnbkNhbnZhcy5oZWlnaHQsIHByaW50QXJlYVgsIHByaW50QXJlYVksIHByaW50QXJlYVdpZHRoLCBwcmludEFyZWFIZWlnaHQpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQndCw0LvQvtC20LXQvSDQvtCx0YDQtdC30LDQvdC90YvQuSDQtNC40LfQsNC50L0gKGNsaXBQYXRoKSDQvdCwINC80L7QutCw0L8g0LTQu9GPICR7c2lkZX0g0LIg0L7QsdC70LDRgdGC0Lgg0L/QtdGH0LDRgtC4ICgke01hdGgucm91bmQocHJpbnRBcmVhWCl9LCAke01hdGgucm91bmQocHJpbnRBcmVhWSl9LCAke01hdGgucm91bmQocHJpbnRBcmVhV2lkdGgpfXgke01hdGgucm91bmQocHJpbnRBcmVhSGVpZ2h0KX0pYCk7XG4gICAgICAgIHJldHVybiB0ZW1wQ2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJywgMS4wKTtcbiAgICB9XG4gICAgZ2V0Q2FudmFzZXNGb3JTaWRlKHNpZGUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGVkaXRhYmxlQ2FudmFzOiB0aGlzLmNhbnZhc2VzLmZpbmQoYyA9PiBjLnNpZGUgPT09IHNpZGUpLFxuICAgICAgICAgICAgbGF5ZXJzQ2FudmFzOiB0aGlzLmxheWVyc0NhbnZhc2VzLmZpbmQoYyA9PiBjLnNpZGUgPT09IHNpZGUpXG4gICAgICAgIH07XG4gICAgfVxuICAgIGFzeW5jIGxvYWRNb2NrdXBGb3JTaWRlKHNpZGUpIHtcbiAgICAgICAgY29uc3QgbW9ja3VwVXJsID0gdGhpcy5nZXRNb2NrdXBVcmwoc2lkZSk7XG4gICAgICAgIGlmICghbW9ja3VwVXJsKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtleHBvcnRdINCc0L7QutCw0L8g0LTQu9GPINGB0YLQvtGA0L7QvdGLICR7c2lkZX0g0L3QtSDQvdCw0LnQtNC10L1gKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1vY2t1cEltZyA9IGF3YWl0IHRoaXMubG9hZEltYWdlKG1vY2t1cFVybCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCX0LDQs9GA0YPQttC10L0g0LzQvtC60LDQvyDQtNC70Y8gJHtzaWRlfTogJHttb2NrdXBVcmx9YCk7XG4gICAgICAgIHJldHVybiBtb2NrdXBJbWc7XG4gICAgfVxuICAgIGNyZWF0ZUV4cG9ydENhbnZhcyhleHBvcnRTaXplLCBtb2NrdXBJbWcpIHtcbiAgICAgICAgY29uc3QgdGVtcENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBjb25zdCBjdHggPSB0ZW1wQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIHRlbXBDYW52YXMud2lkdGggPSBleHBvcnRTaXplO1xuICAgICAgICB0ZW1wQ2FudmFzLmhlaWdodCA9IGV4cG9ydFNpemU7XG4gICAgICAgIGNvbnN0IG1vY2t1cFNjYWxlID0gTWF0aC5taW4oZXhwb3J0U2l6ZSAvIG1vY2t1cEltZy53aWR0aCwgZXhwb3J0U2l6ZSAvIG1vY2t1cEltZy5oZWlnaHQpO1xuICAgICAgICBjb25zdCBzY2FsZWRNb2NrdXBXaWR0aCA9IG1vY2t1cEltZy53aWR0aCAqIG1vY2t1cFNjYWxlO1xuICAgICAgICBjb25zdCBzY2FsZWRNb2NrdXBIZWlnaHQgPSBtb2NrdXBJbWcuaGVpZ2h0ICogbW9ja3VwU2NhbGU7XG4gICAgICAgIGNvbnN0IG1vY2t1cFggPSAoZXhwb3J0U2l6ZSAtIHNjYWxlZE1vY2t1cFdpZHRoKSAvIDI7XG4gICAgICAgIGNvbnN0IG1vY2t1cFkgPSAoZXhwb3J0U2l6ZSAtIHNjYWxlZE1vY2t1cEhlaWdodCkgLyAyO1xuICAgICAgICBjdHguZHJhd0ltYWdlKG1vY2t1cEltZywgbW9ja3VwWCwgbW9ja3VwWSwgc2NhbGVkTW9ja3VwV2lkdGgsIHNjYWxlZE1vY2t1cEhlaWdodCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCd0LDRgNC40YHQvtCy0LDQvSDQvNC+0LrQsNC/INC60LDQuiDRhNC+0L0gKCR7c2NhbGVkTW9ja3VwV2lkdGh9eCR7c2NhbGVkTW9ja3VwSGVpZ2h0fSlgKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNhbnZhczogdGVtcENhbnZhcyxcbiAgICAgICAgICAgIGN0eCxcbiAgICAgICAgICAgIG1vY2t1cERpbWVuc2lvbnM6IHtcbiAgICAgICAgICAgICAgICB4OiBtb2NrdXBYLFxuICAgICAgICAgICAgICAgIHk6IG1vY2t1cFksXG4gICAgICAgICAgICAgICAgd2lkdGg6IHNjYWxlZE1vY2t1cFdpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogc2NhbGVkTW9ja3VwSGVpZ2h0XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIGFzeW5jIGNyZWF0ZURlc2lnbkNhbnZhcyhlZGl0YWJsZUNhbnZhcywgbGF5ZXJzQ2FudmFzLCBzaWRlKSB7XG4gICAgICAgIGNvbnN0IHF1YWxpdHlNdWx0aXBsaWVyID0gMTA7XG4gICAgICAgIGNvbnN0IGJhc2VXaWR0aCA9IGVkaXRhYmxlQ2FudmFzLmdldFdpZHRoKCk7XG4gICAgICAgIGNvbnN0IGJhc2VIZWlnaHQgPSBlZGl0YWJsZUNhbnZhcy5nZXRIZWlnaHQoKTtcbiAgICAgICAgY29uc3QgZGVzaWduQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGNvbnN0IGRlc2lnbkN0eCA9IGRlc2lnbkNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICBkZXNpZ25DYW52YXMud2lkdGggPSBiYXNlV2lkdGggKiBxdWFsaXR5TXVsdGlwbGllcjtcbiAgICAgICAgZGVzaWduQ2FudmFzLmhlaWdodCA9IGJhc2VIZWlnaHQgKiBxdWFsaXR5TXVsdGlwbGllcjtcbiAgICAgICAgYXdhaXQgdGhpcy5hZGRTdGF0aWNMYXllcnNUb0NhbnZhcyhsYXllcnNDYW52YXMsIGRlc2lnbkN0eCwgZGVzaWduQ2FudmFzLCBzaWRlKTtcbiAgICAgICAgYXdhaXQgdGhpcy5hZGRFZGl0YWJsZU9iamVjdHNUb0NhbnZhcyhlZGl0YWJsZUNhbnZhcywgZGVzaWduQ3R4LCBkZXNpZ25DYW52YXMsIGJhc2VXaWR0aCwgYmFzZUhlaWdodCwgc2lkZSk7XG4gICAgICAgIHJldHVybiBkZXNpZ25DYW52YXM7XG4gICAgfVxuICAgIGFzeW5jIGFkZFN0YXRpY0xheWVyc1RvQ2FudmFzKGxheWVyc0NhbnZhcywgY3R4LCBjYW52YXMsIHNpZGUpIHtcbiAgICAgICAgaWYgKCFsYXllcnNDYW52YXMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBsYXllcnNEYXRhVXJsID0gbGF5ZXJzQ2FudmFzLnRvRGF0YVVSTCh7XG4gICAgICAgICAgICAgICAgZm9ybWF0OiAncG5nJyxcbiAgICAgICAgICAgICAgICBtdWx0aXBsaWVyOiAxMCxcbiAgICAgICAgICAgICAgICBxdWFsaXR5OiAxLjBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgZW1wdHlEYXRhVXJsID0gJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQUVBQUFBQkNBWUFBQUFmRmNTSkFBQUFEVWxFUVZSNDJtTmtZUGhmRHdBQ2h3R0E2MGU2a2dBQUFBQkpSVTVFcmtKZ2dnPT0nO1xuICAgICAgICAgICAgaWYgKGxheWVyc0RhdGFVcmwgIT09IGVtcHR5RGF0YVVybCAmJiBsYXllcnNEYXRhVXJsLmxlbmd0aCA+IGVtcHR5RGF0YVVybC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBsYXllcnNJbWcgPSBhd2FpdCB0aGlzLmxvYWRJbWFnZShsYXllcnNEYXRhVXJsKTtcbiAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKGxheWVyc0ltZywgMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQlNC+0LHQsNCy0LvQtdC90Ysg0YHRgtCw0YLQuNGH0LXRgdC60LjQtSDRgdC70L7QuCDQtNC70Y8gJHtzaWRlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZXhwb3J0XSDQntGI0LjQsdC60LAg0Y3QutGB0L/QvtGA0YLQsCDRgdGC0LDRgtC40YfQtdGB0LrQuNGFINGB0LvQvtC10LIg0LTQu9GPICR7c2lkZX06YCwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGFkZEVkaXRhYmxlT2JqZWN0c1RvQ2FudmFzKGVkaXRhYmxlQ2FudmFzLCBjdHgsIGNhbnZhcywgYmFzZVdpZHRoLCBiYXNlSGVpZ2h0LCBzaWRlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB0ZW1wRWRpdGFibGVDYW52YXMgPSBuZXcgZmFicmljLlN0YXRpY0NhbnZhcyhudWxsLCB7XG4gICAgICAgICAgICAgICAgd2lkdGg6IGJhc2VXaWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGJhc2VIZWlnaHQsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAndHJhbnNwYXJlbnQnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChlZGl0YWJsZUNhbnZhcy5jbGlwUGF0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNsb25lZENsaXAgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBlZGl0YWJsZUNhbnZhcy5jbGlwUGF0aC5jbG9uZSgoY2xvbmVkKSA9PiByZXNvbHZlKGNsb25lZCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRlbXBFZGl0YWJsZUNhbnZhcy5jbGlwUGF0aCA9IGNsb25lZENsaXA7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0J/RgNC40LzQtdC90ZHQvSBjbGlwUGF0aCDQtNC70Y8g0Y3QutGB0L/QvtGA0YLQsCDRgdGC0L7RgNC+0L3RiyAke3NpZGV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkZXNpZ25PYmplY3RzID0gdGhpcy5maWx0ZXJEZXNpZ25PYmplY3RzKGVkaXRhYmxlQ2FudmFzLmdldE9iamVjdHMoKSk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG9iaiBvZiBkZXNpZ25PYmplY3RzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2xvbmVkT2JqID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmNsb25lKChjbG9uZWQpID0+IHJlc29sdmUoY2xvbmVkKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGVtcEVkaXRhYmxlQ2FudmFzLmFkZChjbG9uZWRPYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZGVzaWduRGF0YVVybCA9IHRlbXBFZGl0YWJsZUNhbnZhcy50b0RhdGFVUkwoe1xuICAgICAgICAgICAgICAgIGZvcm1hdDogJ3BuZycsXG4gICAgICAgICAgICAgICAgbXVsdGlwbGllcjogMTAsXG4gICAgICAgICAgICAgICAgcXVhbGl0eTogMS4wXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGVtcHR5RGF0YVVybCA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUFFQUFBQUJDQVlBQUFBZkZjU0pBQUFBRFVsRVFWUjQybU5rWVBoZkR3QUNod0dBNjBlNmtnQUFBQUJKUlU1RXJrSmdnZz09JztcbiAgICAgICAgICAgIGlmIChkZXNpZ25EYXRhVXJsICE9PSBlbXB0eURhdGFVcmwgJiYgZGVzaWduRGF0YVVybC5sZW5ndGggPiBlbXB0eURhdGFVcmwubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVzaWduSW1nID0gYXdhaXQgdGhpcy5sb2FkSW1hZ2UoZGVzaWduRGF0YVVybCk7XG4gICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShkZXNpZ25JbWcsIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0JTQvtCx0LDQstC70LXQvdGLINC+0LHRitC10LrRgtGLINC00LjQt9Cw0LnQvdCwINCx0LXQtyDQs9GA0LDQvdC40YYg0LTQu9GPICR7c2lkZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRlbXBFZGl0YWJsZUNhbnZhcy5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtleHBvcnRdINCe0YjQuNCx0LrQsCDRgdC+0LfQtNCw0L3QuNGPINC00LjQt9Cw0LnQvdCwINCx0LXQtyDQs9GA0LDQvdC40YYg0LTQu9GPICR7c2lkZX06YCwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZpbHRlckRlc2lnbk9iamVjdHMoYWxsT2JqZWN0cykge1xuICAgICAgICBjb25zdCBzZXJ2aWNlT2JqZWN0TmFtZXMgPSBuZXcgU2V0KFtcbiAgICAgICAgICAgIFwiYXJlYTpib3JkZXJcIixcbiAgICAgICAgICAgIFwiYXJlYTpjbGlwXCIsXG4gICAgICAgICAgICBcImd1aWRlbGluZVwiLFxuICAgICAgICAgICAgXCJndWlkZWxpbmU6dmVydGljYWxcIixcbiAgICAgICAgICAgIFwiZ3VpZGVsaW5lOmhvcml6b250YWxcIlxuICAgICAgICBdKTtcbiAgICAgICAgcmV0dXJuIGFsbE9iamVjdHMuZmlsdGVyKChvYmopID0+ICFzZXJ2aWNlT2JqZWN0TmFtZXMuaGFzKG9iai5uYW1lKSk7XG4gICAgfVxuICAgIGFzeW5jIGV4cG9ydERlc2lnbldpdGhDbGlwUGF0aChlZGl0YWJsZUNhbnZhcywgbGF5ZXJzQ2FudmFzLCBzaWRlLCByZXNvbHV0aW9uKSB7XG4gICAgICAgIGNvbnN0IHF1YWxpdHlNdWx0aXBsaWVyID0gMTA7XG4gICAgICAgIGNvbnN0IGNsaXBQYXRoID0gZWRpdGFibGVDYW52YXMuY2xpcFBhdGg7XG4gICAgICAgIGlmICghY2xpcFBhdGgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2V4cG9ydF0gY2xpcFBhdGgg0L3QtSDQvdCw0LnQtNC10L0sINGN0LrRgdC/0L7RgNGC0LjRgNGD0LXQvCDQstC10YHRjCBjYW52YXMnKTtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNyZWF0ZURlc2lnbkNhbnZhcyhlZGl0YWJsZUNhbnZhcywgbGF5ZXJzQ2FudmFzLCBzaWRlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjbGlwV2lkdGggPSBjbGlwUGF0aC53aWR0aDtcbiAgICAgICAgY29uc3QgY2xpcEhlaWdodCA9IGNsaXBQYXRoLmhlaWdodDtcbiAgICAgICAgY29uc3QgY2xpcExlZnQgPSBjbGlwUGF0aC5sZWZ0O1xuICAgICAgICBjb25zdCBjbGlwVG9wID0gY2xpcFBhdGgudG9wO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSBjbGlwUGF0aDogJHtjbGlwV2lkdGh9eCR7Y2xpcEhlaWdodH0gYXQgKCR7Y2xpcExlZnR9LCAke2NsaXBUb3B9KWApO1xuICAgICAgICBjb25zdCBmdWxsRGVzaWduQ2FudmFzID0gYXdhaXQgdGhpcy5jcmVhdGVEZXNpZ25DYW52YXMoZWRpdGFibGVDYW52YXMsIGxheWVyc0NhbnZhcywgc2lkZSk7XG4gICAgICAgIGNvbnN0IHNjYWxlID0gcmVzb2x1dGlvbiAvIE1hdGgubWF4KGNsaXBXaWR0aCwgY2xpcEhlaWdodCk7XG4gICAgICAgIGNvbnN0IGNyb3BwZWRDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgY3JvcHBlZENhbnZhcy53aWR0aCA9IGNsaXBXaWR0aCAqIHNjYWxlO1xuICAgICAgICBjcm9wcGVkQ2FudmFzLmhlaWdodCA9IGNsaXBIZWlnaHQgKiBzY2FsZTtcbiAgICAgICAgY29uc3QgY3R4ID0gY3JvcHBlZENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICBjb25zdCBzb3VyY2VTY2FsZSA9IHF1YWxpdHlNdWx0aXBsaWVyO1xuICAgICAgICBjdHguZHJhd0ltYWdlKGZ1bGxEZXNpZ25DYW52YXMsIGNsaXBMZWZ0ICogc291cmNlU2NhbGUsIGNsaXBUb3AgKiBzb3VyY2VTY2FsZSwgY2xpcFdpZHRoICogc291cmNlU2NhbGUsIGNsaXBIZWlnaHQgKiBzb3VyY2VTY2FsZSwgMCwgMCwgY3JvcHBlZENhbnZhcy53aWR0aCwgY3JvcHBlZENhbnZhcy5oZWlnaHQpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQlNC40LfQsNC50L0g0L7QsdGA0LXQt9Cw0L0g0L/QviBjbGlwUGF0aDogJHtjcm9wcGVkQ2FudmFzLndpZHRofXgke2Nyb3BwZWRDYW52YXMuaGVpZ2h0fXB4YCk7XG4gICAgICAgIHJldHVybiBjcm9wcGVkQ2FudmFzO1xuICAgIH1cbiAgICBhc3luYyB1cGxvYWREZXNpZ25Ub1NlcnZlcihkZXNpZ25zKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZXhwb3J0XSDQl9Cw0LPRgNGD0LfQutCwINC00LjQt9Cw0LnQvdCwINC90LAg0YHQtdGA0LLQtdGAJyk7XG4gICAgICAgICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBbc2lkZSwgZGF0YVVybF0gb2YgT2JqZWN0LmVudHJpZXMoZGVzaWducykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGRhdGFVcmwpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJsb2IgPSBhd2FpdCByZXNwb25zZS5ibG9iKCk7XG4gICAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKHNpZGUsIGJsb2IsIGAke3NpZGV9LnBuZ2ApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZXhwb3J0XSDQl9Cw0LPRgNGD0LfQutCwINC90LAg0YHQtdGA0LLQtdGAINC90LUg0YDQtdCw0LvQuNC30L7QstCw0L3QsCcpO1xuICAgICAgICAgICAgcmV0dXJuIGRlc2lnbnM7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbZXhwb3J0XSDQntGI0LjQsdC60LAg0L/RgNC4INC30LDQs9GA0YPQt9C60LUg0L3QsCDRgdC10YDQstC10YA6JywgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2F2ZUxheWVyc1RvSGlzdG9yeSgpIHtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA8IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICB0aGlzLmxheWVyc0hpc3RvcnkgPSB0aGlzLmxheWVyc0hpc3Rvcnkuc2xpY2UoMCwgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ICsgMSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGF5ZXJzQ29weSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGhpcy5sYXlvdXRzKSk7XG4gICAgICAgIGNvbnN0IGhpc3RvcnlJdGVtID0ge1xuICAgICAgICAgICAgbGF5ZXJzOiBsYXllcnNDb3B5Lm1hcCgoZGF0YSkgPT4gbmV3IExheW91dChkYXRhKSksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KClcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5sYXllcnNIaXN0b3J5LnB1c2goaGlzdG9yeUl0ZW0pO1xuICAgICAgICB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPSB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMTtcbiAgICAgICAgY29uc3QgTUFYX0hJU1RPUllfU0laRSA9IDUwO1xuICAgICAgICBpZiAodGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCA+IE1BWF9ISVNUT1JZX1NJWkUpIHtcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzSGlzdG9yeS5zaGlmdCgpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4LS07XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2hpc3RvcnldINCh0L7RhdGA0LDQvdC10L3QviDRgdC+0YHRgtC+0Y/QvdC40LUg0YHQu9C+0ZHQsi4g0JjQvdC00LXQutGBOiAke3RoaXMuY3VycmVudEhpc3RvcnlJbmRleH0sINCS0YHQtdCz0L46ICR7dGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aH0sINCh0LvQvtGR0LI6ICR7dGhpcy5sYXlvdXRzLmxlbmd0aH1gKTtcbiAgICAgICAgdGhpcy51cGRhdGVIaXN0b3J5QnV0dG9uc1N0YXRlKCk7XG4gICAgfVxuICAgIGNhblVuZG8oKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPT09IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCA+PSAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA+IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2FuUmVkbygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA8IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxO1xuICAgIH1cbiAgICB1cGRhdGVIaXN0b3J5QnV0dG9uc1N0YXRlKCkge1xuICAgICAgICBjb25zdCBjYW5VbmRvID0gdGhpcy5jYW5VbmRvKCk7XG4gICAgICAgIGNvbnN0IGNhblJlZG8gPSB0aGlzLmNhblJlZG8oKTtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jayAmJiB0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVuZG9CdXR0b24gPSB0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBpZiAoY2FuVW5kbykge1xuICAgICAgICAgICAgICAgIHVuZG9CdXR0b24uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyc7XG4gICAgICAgICAgICAgICAgdW5kb0J1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB1bmRvQnV0dG9uLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcjZjJmMmYyJztcbiAgICAgICAgICAgICAgICB1bmRvQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrICYmIHRoaXMuZWRpdG9ySGlzdG9yeVJlZG9CbG9jay5maXJzdEVsZW1lbnRDaGlsZCkge1xuICAgICAgICAgICAgY29uc3QgcmVkb0J1dHRvbiA9IHRoaXMuZWRpdG9ySGlzdG9yeVJlZG9CbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGlmIChjYW5SZWRvKSB7XG4gICAgICAgICAgICAgICAgcmVkb0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnJztcbiAgICAgICAgICAgICAgICByZWRvQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlZG9CdXR0b24uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyNmMmYyZjInO1xuICAgICAgICAgICAgICAgIHJlZG9CdXR0b24uc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5XSDQodC+0YHRgtC+0Y/QvdC40LUg0LrQvdC+0L/QvtC6OiB1bmRvID0nLCBjYW5VbmRvLCAnLCByZWRvID0nLCBjYW5SZWRvKTtcbiAgICB9XG4gICAgYXN5bmMgdW5kbygpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhblVuZG8oKSkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnldIFVuZG8g0L3QtdCy0L7Qt9C80L7QttC10L0nKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID09PSB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMSAmJiB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA9IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID0gTWF0aC5tYXgoMCwgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4IC0gMSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaGlzdG9yeUl0ZW0gPSB0aGlzLmxheWVyc0hpc3RvcnlbdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4XTtcbiAgICAgICAgaWYgKCFoaXN0b3J5SXRlbSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbaGlzdG9yeV0g0JjRgdGC0L7RgNC40Y8g0L3QtSDQvdCw0LnQtNC10L3QsCcpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtoaXN0b3J5XSBVbmRvINC6INC40L3QtNC10LrRgdGDICR7dGhpcy5jdXJyZW50SGlzdG9yeUluZGV4fSDQuNC3ICR7dGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDF9YCk7XG4gICAgICAgIGF3YWl0IHRoaXMucmVzdG9yZUxheWVyc0Zyb21IaXN0b3J5KGhpc3RvcnlJdGVtKTtcbiAgICAgICAgdGhpcy51cGRhdGVIaXN0b3J5QnV0dG9uc1N0YXRlKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBhc3luYyByZWRvKCkge1xuICAgICAgICBpZiAoIXRoaXMuY2FuUmVkbygpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbaGlzdG9yeV0gUmVkbyDQvdC10LLQvtC30LzQvtC20LXQvScpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCsrO1xuICAgICAgICBjb25zdCBoaXN0b3J5SXRlbSA9IHRoaXMubGF5ZXJzSGlzdG9yeVt0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXhdO1xuICAgICAgICBpZiAoIWhpc3RvcnlJdGVtKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1toaXN0b3J5XSDQmNGB0YLQvtGA0LjRjyDQvdC1INC90LDQudC00LXQvdCwJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2hpc3RvcnldIFJlZG8g0Log0LjQvdC00LXQutGB0YMgJHt0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXh9INC40LcgJHt0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMX1gKTtcbiAgICAgICAgYXdhaXQgdGhpcy5yZXN0b3JlTGF5ZXJzRnJvbUhpc3RvcnkoaGlzdG9yeUl0ZW0pO1xuICAgICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGFzeW5jIHJlc3RvcmVMYXllcnNGcm9tSGlzdG9yeShoaXN0b3J5SXRlbSkge1xuICAgICAgICB0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkgPSB0cnVlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gW107XG4gICAgICAgICAgICBoaXN0b3J5SXRlbS5sYXllcnMuZm9yRWFjaChsYXlvdXQgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMubGF5b3V0cy5wdXNoKG5ldyBMYXlvdXQobGF5b3V0KSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbaGlzdG9yeV0g0JLQvtGB0YHRgtCw0L3QvtCy0LvQtdC90L4gJHt0aGlzLmxheW91dHMubGVuZ3RofSDRgdC70L7RkdCyYCk7XG4gICAgICAgIH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBkZXN0cm95KCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZWRpdG9yXSDQntGH0LjRgdGC0LrQsCDRgNC10YHRg9GA0YHQvtCyINGA0LXQtNCw0LrRgtC+0YDQsCcpO1xuICAgICAgICBpZiAodGhpcy5sb2FkaW5nSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5sb2FkaW5nSW50ZXJ2YWwpO1xuICAgICAgICAgICAgdGhpcy5sb2FkaW5nSW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXZlbnRzLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5jYW52YXNlcy5mb3JFYWNoKGNhbnZhcyA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNhbnZhcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NsZWFudXBdINCe0YjQuNCx0LrQsCDQvtGH0LjRgdGC0LrQuCBjYW52YXM6JywgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY2FudmFzZXMgPSBbXTtcbiAgICAgICAgdGhpcy5sYXllcnNDYW52YXNlcy5mb3JFYWNoKGNhbnZhcyA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNhbnZhcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NsZWFudXBdINCe0YjQuNCx0LrQsCDQvtGH0LjRgdGC0LrQuCBsYXllciBjYW52YXM6JywgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubGF5ZXJzQ2FudmFzZXMgPSBbXTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2VkaXRvcl0g0KDQtdGB0YPRgNGB0Ysg0YPRgdC/0LXRiNC90L4g0L7Rh9C40YnQtdC90YsnKTtcbiAgICB9XG4gICAgZ2V0Q3VycmVudFN0YXRlKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogdGhpcy5fc2VsZWN0VHlwZSxcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLl9zZWxlY3RDb2xvcixcbiAgICAgICAgICAgIHNpZGU6IHRoaXMuX3NlbGVjdFNpZGUsXG4gICAgICAgICAgICBzaXplOiB0aGlzLl9zZWxlY3RTaXplLFxuICAgICAgICAgICAgbGF5b3V0czogdGhpcy5sYXlvdXRzLFxuICAgICAgICAgICAgaXNMb2FkaW5nOiB0aGlzLmlzTG9hZGluZyxcbiAgICAgICAgfTtcbiAgICB9XG59XG4iLCJleHBvcnQgY2xhc3MgRWRpdG9yU3RvcmFnZU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmRhdGFiYXNlID0gbnVsbDtcbiAgICAgICAgdGhpcy5pc1JlYWR5ID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVhZHlQcm9taXNlID0gdGhpcy5pbml0KCk7XG4gICAgfVxuICAgIGFzeW5jIGluaXQoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBvcGVuUmVxdWVzdCA9IGluZGV4ZWREQi5vcGVuKFwiZWRpdG9yXCIsIDIpO1xuICAgICAgICAgICAgb3BlblJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0YWJhc2UgPSBldmVudC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICAgIGlmICghZGF0YWJhc2Uub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucygnaGlzdG9yeScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLmNyZWF0ZU9iamVjdFN0b3JlKCdoaXN0b3J5JywgeyBrZXlQYXRoOiAnaWQnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWRhdGFiYXNlLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoJ2VkaXRvcl9zdGF0ZScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLmNyZWF0ZU9iamVjdFN0b3JlKCdlZGl0b3Jfc3RhdGUnLCB7IGtleVBhdGg6ICdrZXknIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWRhdGFiYXNlLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoJ3VzZXJfZGF0YScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLmNyZWF0ZU9iamVjdFN0b3JlKCd1c2VyX2RhdGEnLCB7IGtleVBhdGg6ICdrZXknIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBvcGVuUmVxdWVzdC5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLQntGI0LjQsdC60LAg0L7RgtC60YDRi9GC0LjRjyBJbmRleGVkREJcIiwgb3BlblJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlamVjdChvcGVuUmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgb3BlblJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YWJhc2UgPSBvcGVuUmVxdWVzdC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgdGhpcy5pc1JlYWR5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgd2FpdEZvclJlYWR5KCkge1xuICAgICAgICBhd2FpdCB0aGlzLnJlYWR5UHJvbWlzZTtcbiAgICB9XG4gICAgYXN5bmMgc2F2ZUVkaXRvclN0YXRlKHN0YXRlKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydlZGl0b3Jfc3RhdGUnXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdlZGl0b3Jfc3RhdGUnKTtcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgdGhpcy5wdXREYXRhKG9iamVjdFN0b3JlLCAnZGF0ZScsIHN0YXRlLmRhdGUpLFxuICAgICAgICAgICAgdGhpcy5wdXREYXRhKG9iamVjdFN0b3JlLCAnY29sb3InLCBzdGF0ZS5jb2xvciksXG4gICAgICAgICAgICB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICdzaWRlJywgc3RhdGUuc2lkZSksXG4gICAgICAgICAgICB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICd0eXBlJywgc3RhdGUudHlwZSksXG4gICAgICAgICAgICB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICdzaXplJywgc3RhdGUuc2l6ZSlcbiAgICAgICAgXSk7XG4gICAgfVxuICAgIGFzeW5jIGxvYWRFZGl0b3JTdGF0ZSgpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2VkaXRvcl9zdGF0ZSddLCAncmVhZG9ubHknKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnZWRpdG9yX3N0YXRlJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBbZGF0ZSwgY29sb3IsIHNpZGUsIHR5cGUsIHNpemVdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ2RhdGUnKSxcbiAgICAgICAgICAgICAgICB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICdjb2xvcicpLFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ3NpZGUnKSxcbiAgICAgICAgICAgICAgICB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICd0eXBlJyksXG4gICAgICAgICAgICAgICAgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAnc2l6ZScpXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIGlmICghZGF0ZSB8fCAhY29sb3IgfHwgIXNpZGUgfHwgIXR5cGUgfHwgIXNpemUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZGF0ZSxcbiAgICAgICAgICAgICAgICBjb2xvcixcbiAgICAgICAgICAgICAgICBzaWRlLFxuICAgICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgICAgc2l6ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ9Ce0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4INGB0L7RgdGC0L7Rj9C90LjRjyDRgNC10LTQsNC60YLQvtGA0LA6JywgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgY2xlYXJFZGl0b3JTdGF0ZSgpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2VkaXRvcl9zdGF0ZSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2VkaXRvcl9zdGF0ZScpO1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZURhdGEob2JqZWN0U3RvcmUsICdkYXRlJyksXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZURhdGEob2JqZWN0U3RvcmUsICdjb2xvcicpLFxuICAgICAgICAgICAgdGhpcy5kZWxldGVEYXRhKG9iamVjdFN0b3JlLCAnc2lkZScpLFxuICAgICAgICAgICAgdGhpcy5kZWxldGVEYXRhKG9iamVjdFN0b3JlLCAndHlwZScpLFxuICAgICAgICAgICAgdGhpcy5kZWxldGVEYXRhKG9iamVjdFN0b3JlLCAnc2l6ZScpXG4gICAgICAgIF0pO1xuICAgIH1cbiAgICBhc3luYyBnZXRVc2VySWQoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWyd1c2VyX2RhdGEnXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd1c2VyX2RhdGEnKTtcbiAgICAgICAgbGV0IHVzZXJJZCA9IGF3YWl0IHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ3VzZXJJZCcpO1xuICAgICAgICBpZiAoIXVzZXJJZCkge1xuICAgICAgICAgICAgdXNlcklkID0gY3J5cHRvLnJhbmRvbVVVSUQoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ3VzZXJJZCcsIHVzZXJJZCk7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHdpbmRvdy5PcGVuUmVwbGF5LnNldFVzZXJJRCh1c2VySWQpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcign0J7RiNC40LHQutCwINGD0YHRgtCw0L3QvtCy0LrQuCBJRCDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8g0LIgdHJhY2tlcjonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVzZXJJZDtcbiAgICB9XG4gICAgYXN5bmMgc2F2ZVRvSGlzdG9yeShpdGVtLCBkZXNjcmlwdGlvbikge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgaGlzdG9yeUl0ZW0gPSB7XG4gICAgICAgICAgICAuLi5pdGVtLFxuICAgICAgICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24gfHwgYNCY0LfQvNC10L3QtdC90LjRjyDQvtGCICR7bmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpfWBcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmFkZChoaXN0b3J5SXRlbSk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBoaXN0b3J5SXRlbS5pZDtcbiAgICB9XG4gICAgYXN5bmMgc2F2ZUxheWVyT3BlcmF0aW9uKG9wZXJhdGlvbiwgbGF5b3V0LCBzaWRlLCB0eXBlLCBkZXNjcmlwdGlvbikge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgbGF5ZXJIaXN0b3J5SXRlbSA9IHtcbiAgICAgICAgICAgIGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgb3BlcmF0aW9uLFxuICAgICAgICAgICAgbGF5b3V0OiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGxheW91dCkpLFxuICAgICAgICAgICAgc2lkZSxcbiAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24gfHwgYCR7b3BlcmF0aW9uID09PSAnYWRkJyA/ICfQlNC+0LHQsNCy0LvQtdC9JyA6ICfQo9C00LDQu9C10L0nfSDRgdC70L7QuTogJHtsYXlvdXQubmFtZSB8fCBsYXlvdXQudHlwZX1gXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5hZGQoeyAuLi5sYXllckhpc3RvcnlJdGVtLCBpc0xheWVyT3BlcmF0aW9uOiB0cnVlIH0pO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbGF5ZXJIaXN0b3J5SXRlbS5pZDtcbiAgICB9XG4gICAgYXN5bmMgZ2V0TGF5ZXJIaXN0b3J5KGZpbHRlciwgbGltaXQgPSA1MCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZG9ubHknKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmdldEFsbCgpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsSXRlbXMgPSByZXF1ZXN0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICBjb25zdCBsYXllck9wZXJhdGlvbnMgPSBhbGxJdGVtc1xuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKChpdGVtKSA9PiBpdGVtLmlzTGF5ZXJPcGVyYXRpb24gJiYgaXRlbS5zaWRlID09PSBmaWx0ZXIuc2lkZSAmJiBpdGVtLnR5cGUgPT09IGZpbHRlci50eXBlKVxuICAgICAgICAgICAgICAgICAgICAubWFwKChpdGVtKSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICBpZDogaXRlbS5pZCxcbiAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wOiBpdGVtLnRpbWVzdGFtcCxcbiAgICAgICAgICAgICAgICAgICAgb3BlcmF0aW9uOiBpdGVtLm9wZXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgbGF5b3V0OiBpdGVtLmxheW91dCxcbiAgICAgICAgICAgICAgICAgICAgc2lkZTogaXRlbS5zaWRlLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBpdGVtLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBpdGVtLmRlc2NyaXB0aW9uXG4gICAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiBiLnRpbWVzdGFtcCAtIGEudGltZXN0YW1wKVxuICAgICAgICAgICAgICAgICAgICAuc2xpY2UoMCwgbGltaXQpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUobGF5ZXJPcGVyYXRpb25zKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBnZXRSZWNlbnRMYXllck9wZXJhdGlvbnMoZmlsdGVyLCBsaW1pdCA9IDEwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldExheWVySGlzdG9yeShmaWx0ZXIsIGxpbWl0KTtcbiAgICB9XG4gICAgYXN5bmMgZ2V0SGlzdG9yeShmaWx0ZXIsIGxpbWl0ID0gNTApIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWRvbmx5Jyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5nZXRBbGwoKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsbEl0ZW1zID0gcmVxdWVzdC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyZWRJdGVtcyA9IGFsbEl0ZW1zXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoaXRlbSA9PiBpdGVtLnNpZGUgPT09IGZpbHRlci5zaWRlICYmIGl0ZW0udHlwZSA9PT0gZmlsdGVyLnR5cGUpXG4gICAgICAgICAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiBiLnRpbWVzdGFtcCAtIGEudGltZXN0YW1wKVxuICAgICAgICAgICAgICAgICAgICAuc2xpY2UoMCwgbGltaXQpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZmlsdGVyZWRJdGVtcyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgZ2V0SGlzdG9yeUl0ZW0oaWQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWRvbmx5Jyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5nZXQoaWQpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKHJlcXVlc3QucmVzdWx0IHx8IG51bGwpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgZGVsZXRlSGlzdG9yeUl0ZW0oaWQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5kZWxldGUoaWQpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBjbGVhckhpc3RvcnkoZmlsdGVyKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydoaXN0b3J5J10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICBpZiAoIWZpbHRlcikge1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5jbGVhcigpO1xuICAgICAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgYWxsSXRlbXMgPSBhd2FpdCB0aGlzLmdldEhpc3RvcnkoZmlsdGVyLCAxMDAwKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBhbGxJdGVtcykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZGVsZXRlSGlzdG9yeUl0ZW0oaXRlbS5pZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgc2F2ZUxheWVycyhsYXllcnMpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2VkaXRvcl9zdGF0ZSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2VkaXRvcl9zdGF0ZScpO1xuICAgICAgICBhd2FpdCB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICdsYXllcnMnLCBsYXllcnMpO1xuICAgIH1cbiAgICBhc3luYyBsb2FkTGF5ZXJzKCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2VkaXRvcl9zdGF0ZSddLCAncmVhZG9ubHknKTtcbiAgICAgICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2VkaXRvcl9zdGF0ZScpO1xuICAgICAgICAgICAgY29uc3QgbGF5ZXJzID0gYXdhaXQgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAnbGF5ZXJzJyk7XG4gICAgICAgICAgICByZXR1cm4gbGF5ZXJzIHx8IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCDRgdC70L7RkdCyOicsIGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHB1dERhdGEob2JqZWN0U3RvcmUsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5wdXQoeyBrZXksIHZhbHVlIH0pO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXREYXRhKG9iamVjdFN0b3JlLCBrZXkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5nZXQoa2V5KTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZShyZXF1ZXN0LnJlc3VsdD8udmFsdWUgfHwgbnVsbCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBkZWxldGVEYXRhKG9iamVjdFN0b3JlLCBrZXkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCJjb25zdCBERUZBVUxUX1ZBTFVFUyA9IHtcbiAgICBQT1NJVElPTjogeyB4OiAwLjUsIHk6IDAuNSB9LFxuICAgIFNJWkU6IDEsXG4gICAgQVNQRUNUX1JBVElPOiAxLFxuICAgIEFOR0xFOiAwLFxuICAgIFRFWFQ6ICdQcmludExvb3AnLFxuICAgIEZPTlQ6IHsgZmFtaWx5OiAnQXJpYWwnLCBzaXplOiAxMiB9LFxufTtcbmV4cG9ydCBjbGFzcyBMYXlvdXQge1xuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHRoaXMuaWQgPSBwcm9wcy5pZCB8fCBMYXlvdXQuZ2VuZXJhdGVJZCgpO1xuICAgICAgICB0aGlzLnR5cGUgPSBwcm9wcy50eXBlO1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gcHJvcHMucG9zaXRpb24gfHwgeyAuLi5ERUZBVUxUX1ZBTFVFUy5QT1NJVElPTiB9O1xuICAgICAgICB0aGlzLnNpemUgPSB0aGlzLnZhbGlkYXRlU2l6ZShwcm9wcy5zaXplID8/IERFRkFVTFRfVkFMVUVTLlNJWkUpO1xuICAgICAgICB0aGlzLmFzcGVjdFJhdGlvID0gdGhpcy52YWxpZGF0ZUFzcGVjdFJhdGlvKHByb3BzLmFzcGVjdFJhdGlvID8/IERFRkFVTFRfVkFMVUVTLkFTUEVDVF9SQVRJTyk7XG4gICAgICAgIHRoaXMudmlldyA9IHByb3BzLnZpZXc7XG4gICAgICAgIHRoaXMuYW5nbGUgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKHByb3BzLmFuZ2xlID8/IERFRkFVTFRfVkFMVUVTLkFOR0xFKTtcbiAgICAgICAgdGhpcy5uYW1lID0gcHJvcHMubmFtZSA/PyBudWxsO1xuICAgICAgICB0aGlzLl9yZWxhdGl2ZVdpZHRoID0gcHJvcHMuX3JlbGF0aXZlV2lkdGg7XG4gICAgICAgIGlmIChwcm9wcy50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICB0aGlzLnVybCA9IHByb3BzLnVybDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChwcm9wcy50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgIHRoaXMudGV4dCA9IHByb3BzLnRleHQgfHwgREVGQVVMVF9WQUxVRVMuVEVYVDtcbiAgICAgICAgICAgIHRoaXMuZm9udCA9IHByb3BzLmZvbnQgPyB7IC4uLnByb3BzLmZvbnQgfSA6IHsgLi4uREVGQVVMVF9WQUxVRVMuRk9OVCB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBnZW5lcmF0ZUlkKCkge1xuICAgICAgICBpZiAodHlwZW9mIGNyeXB0byAhPT0gJ3VuZGVmaW5lZCcgJiYgY3J5cHRvLnJhbmRvbVVVSUQpIHtcbiAgICAgICAgICAgIHJldHVybiBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCAxMSl9YDtcbiAgICB9XG4gICAgdmFsaWRhdGVTaXplKHNpemUpIHtcbiAgICAgICAgaWYgKHNpemUgPD0gMCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBJbnZhbGlkIHNpemUgJHtzaXplfSwgdXNpbmcgZGVmYXVsdCAke0RFRkFVTFRfVkFMVUVTLlNJWkV9YCk7XG4gICAgICAgICAgICByZXR1cm4gREVGQVVMVF9WQUxVRVMuU0laRTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2l6ZTtcbiAgICB9XG4gICAgdmFsaWRhdGVBc3BlY3RSYXRpbyhyYXRpbykge1xuICAgICAgICBpZiAocmF0aW8gPD0gMCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBJbnZhbGlkIGFzcGVjdCByYXRpbyAke3JhdGlvfSwgdXNpbmcgZGVmYXVsdCAke0RFRkFVTFRfVkFMVUVTLkFTUEVDVF9SQVRJT31gKTtcbiAgICAgICAgICAgIHJldHVybiBERUZBVUxUX1ZBTFVFUy5BU1BFQ1RfUkFUSU87XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJhdGlvO1xuICAgIH1cbiAgICBub3JtYWxpemVBbmdsZShhbmdsZSkge1xuICAgICAgICBjb25zdCBub3JtYWxpemVkID0gYW5nbGUgJSAzNjA7XG4gICAgICAgIHJldHVybiBub3JtYWxpemVkIDwgMCA/IG5vcm1hbGl6ZWQgKyAzNjAgOiBub3JtYWxpemVkO1xuICAgIH1cbiAgICBpc0ltYWdlTGF5b3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlID09PSAnaW1hZ2UnICYmIHRoaXMudXJsICE9PSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlzVGV4dExheW91dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZSA9PT0gJ3RleHQnICYmIHRoaXMudGV4dCAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZm9udCAhPT0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBzZXRQb3NpdGlvbih4LCB5KSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSB7IHgsIHkgfTtcbiAgICB9XG4gICAgbW92ZShkeCwgZHkpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbi54ICs9IGR4O1xuICAgICAgICB0aGlzLnBvc2l0aW9uLnkgKz0gZHk7XG4gICAgfVxuICAgIHNldFNpemUoc2l6ZSkge1xuICAgICAgICB0aGlzLnNpemUgPSB0aGlzLnZhbGlkYXRlU2l6ZShzaXplKTtcbiAgICB9XG4gICAgcm90YXRlKGFuZ2xlKSB7XG4gICAgICAgIHRoaXMuYW5nbGUgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKHRoaXMuYW5nbGUgKyBhbmdsZSk7XG4gICAgfVxuICAgIHNldEFuZ2xlKGFuZ2xlKSB7XG4gICAgICAgIHRoaXMuYW5nbGUgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKGFuZ2xlKTtcbiAgICB9XG4gICAgc2V0VGV4dCh0ZXh0KSB7XG4gICAgICAgIGlmICh0aGlzLmlzVGV4dExheW91dCgpKSB7XG4gICAgICAgICAgICB0aGlzLnRleHQgPSB0ZXh0O1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldEZvbnQoZm9udCkge1xuICAgICAgICBpZiAodGhpcy5pc1RleHRMYXlvdXQoKSAmJiB0aGlzLmZvbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZm9udCA9IHsgLi4udGhpcy5mb250LCAuLi5mb250IH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2xvbmUoKSB7XG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdpbWFnZScsXG4gICAgICAgICAgICAgICAgdXJsOiB0aGlzLnVybCxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyAuLi50aGlzLnBvc2l0aW9uIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogdGhpcy5zaXplLFxuICAgICAgICAgICAgICAgIGFzcGVjdFJhdGlvOiB0aGlzLmFzcGVjdFJhdGlvLFxuICAgICAgICAgICAgICAgIHZpZXc6IHRoaXMudmlldyxcbiAgICAgICAgICAgICAgICBhbmdsZTogdGhpcy5hbmdsZSxcbiAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgY2xvbmVkID0gbmV3IExheW91dChwcm9wcyk7XG4gICAgICAgICAgICBjbG9uZWQuX3JlbGF0aXZlV2lkdGggPSB0aGlzLl9yZWxhdGl2ZVdpZHRoO1xuICAgICAgICAgICAgcmV0dXJuIGNsb25lZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyAuLi50aGlzLnBvc2l0aW9uIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogdGhpcy5zaXplLFxuICAgICAgICAgICAgICAgIGFzcGVjdFJhdGlvOiB0aGlzLmFzcGVjdFJhdGlvLFxuICAgICAgICAgICAgICAgIHZpZXc6IHRoaXMudmlldyxcbiAgICAgICAgICAgICAgICBhbmdsZTogdGhpcy5hbmdsZSxcbiAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHRoaXMudGV4dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcHJvcHMudGV4dCA9IHRoaXMudGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmZvbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHByb3BzLmZvbnQgPSB7IC4uLnRoaXMuZm9udCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY2xvbmVkID0gbmV3IExheW91dChwcm9wcyk7XG4gICAgICAgICAgICBjbG9uZWQuX3JlbGF0aXZlV2lkdGggPSB0aGlzLl9yZWxhdGl2ZVdpZHRoO1xuICAgICAgICAgICAgcmV0dXJuIGNsb25lZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIGNvbnN0IGJhc2UgPSB7XG4gICAgICAgICAgICBpZDogdGhpcy5pZCxcbiAgICAgICAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLnBvc2l0aW9uLFxuICAgICAgICAgICAgc2l6ZTogdGhpcy5zaXplLFxuICAgICAgICAgICAgYXNwZWN0UmF0aW86IHRoaXMuYXNwZWN0UmF0aW8sXG4gICAgICAgICAgICB2aWV3OiB0aGlzLnZpZXcsXG4gICAgICAgICAgICBhbmdsZTogdGhpcy5hbmdsZSxcbiAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIF9yZWxhdGl2ZVdpZHRoOiB0aGlzLl9yZWxhdGl2ZVdpZHRoLFxuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICByZXR1cm4geyAuLi5iYXNlLCB1cmw6IHRoaXMudXJsIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgIHJldHVybiB7IC4uLmJhc2UsIHRleHQ6IHRoaXMudGV4dCwgZm9udDogdGhpcy5mb250IH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhc2U7XG4gICAgfVxuICAgIHN0YXRpYyBmcm9tSlNPTihqc29uKSB7XG4gICAgICAgIHJldHVybiBuZXcgTGF5b3V0KGpzb24pO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlSW1hZ2UocHJvcHMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMYXlvdXQoeyAuLi5wcm9wcywgdHlwZTogJ2ltYWdlJyB9KTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZVRleHQocHJvcHMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMYXlvdXQoeyAuLi5wcm9wcywgdHlwZTogJ3RleHQnIH0pO1xuICAgIH1cbn1cbiIsImV4cG9ydCBjbGFzcyBUeXBlZEV2ZW50RW1pdHRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBvbihldmVudCwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmxpc3RlbmVycy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5zZXQoZXZlbnQsIG5ldyBTZXQoKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMuZ2V0KGV2ZW50KS5hZGQobGlzdGVuZXIpO1xuICAgIH1cbiAgICBvbmNlKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgICBjb25zdCBvbmNlV3JhcHBlciA9IChkZXRhaWwpID0+IHtcbiAgICAgICAgICAgIGxpc3RlbmVyKGRldGFpbCk7XG4gICAgICAgICAgICB0aGlzLm9mZihldmVudCwgb25jZVdyYXBwZXIpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm9uKGV2ZW50LCBvbmNlV3JhcHBlcik7XG4gICAgfVxuICAgIG9mZihldmVudCwgbGlzdGVuZXIpIHtcbiAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycy5nZXQoZXZlbnQpO1xuICAgICAgICBpZiAoZXZlbnRMaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIGV2ZW50TGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gICAgICAgICAgICBpZiAoZXZlbnRMaXN0ZW5lcnMuc2l6ZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZW1pdChldmVudCwgZGV0YWlsKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50TGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnMuZ2V0KGV2ZW50KTtcbiAgICAgICAgaWYgKGV2ZW50TGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBldmVudExpc3RlbmVycy5mb3JFYWNoKGxpc3RlbmVyID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcihkZXRhaWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW0V2ZW50RW1pdHRlcl0g0J7RiNC40LHQutCwINCyINC+0LHRgNCw0LHQvtGC0YfQuNC60LUg0YHQvtCx0YvRgtC40Y8gXCIke1N0cmluZyhldmVudCl9XCI6YCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShldmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5jbGVhcigpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGxpc3RlbmVyQ291bnQoZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXJzLmdldChldmVudCk/LnNpemUgfHwgMDtcbiAgICB9XG4gICAgaGFzTGlzdGVuZXJzKGV2ZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVyQ291bnQoZXZlbnQpID4gMDtcbiAgICB9XG4gICAgZXZlbnROYW1lcygpIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5saXN0ZW5lcnMua2V5cygpKTtcbiAgICB9XG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMuY2xlYXIoKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBFZGl0b3JTdG9yYWdlTWFuYWdlciB9IGZyb20gJy4uL21hbmFnZXJzL0VkaXRvclN0b3JhZ2VNYW5hZ2VyJztcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUltYWdlKHsgdXJpLCBwcm9tcHQsIHNoaXJ0Q29sb3IsIGltYWdlLCB3aXRoQWksIGxheW91dElkLCBpc05ldyA9IHRydWUsIGJhY2tncm91bmQgPSB0cnVlLCB9KSB7XG4gICAgY29uc3QgdGVtcFN0b3JhZ2VNYW5hZ2VyID0gbmV3IEVkaXRvclN0b3JhZ2VNYW5hZ2VyKCk7XG4gICAgY29uc3QgdXNlcklkID0gYXdhaXQgdGVtcFN0b3JhZ2VNYW5hZ2VyLmdldFVzZXJJZCgpO1xuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgZm9ybURhdGEuc2V0KCd1c2VySWQnLCB1c2VySWQpO1xuICAgIGZvcm1EYXRhLnNldCgncHJvbXB0JywgcHJvbXB0IHx8IFwiXCIpO1xuICAgIGZvcm1EYXRhLnNldCgnc2hpcnRDb2xvcicsIHNoaXJ0Q29sb3IpO1xuICAgIGZvcm1EYXRhLnNldCgncGxhY2VtZW50JywgJ2NlbnRlcicpO1xuICAgIGZvcm1EYXRhLnNldCgncHJpbnRTaXplJywgXCJiaWdcIik7XG4gICAgZm9ybURhdGEuc2V0KCd0cmFuc2ZlclR5cGUnLCAnJyk7XG4gICAgZm9ybURhdGEuc2V0KCdyZXF1ZXN0X3R5cGUnLCAnZ2VuZXJhdGUnKTtcbiAgICBmb3JtRGF0YS5zZXQoJ2JhY2tncm91bmQnLCBiYWNrZ3JvdW5kPy50b1N0cmluZygpIHx8IFwidHJ1ZVwiKTtcbiAgICBpZiAobGF5b3V0SWQpXG4gICAgICAgIGZvcm1EYXRhLnNldCgnbGF5b3V0SWQnLCBsYXlvdXRJZCk7XG4gICAgaWYgKGltYWdlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tnZW5lcmF0ZSBpbWFnZV0nLCBpbWFnZSk7XG4gICAgICAgIGNvbnN0IFtoZWFkZXIsIGRhdGFdID0gaW1hZ2Uuc3BsaXQoJywnKTtcbiAgICAgICAgY29uc3QgdHlwZSA9IGhlYWRlci5zcGxpdCgnOicpWzFdLnNwbGl0KCc7JylbMF07XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tnZW5lcmF0ZSBpbWFnZV0gW3R5cGVdJywgdHlwZSk7XG4gICAgICAgIGNvbnN0IGJ5dGVDaGFyYWN0ZXJzID0gYXRvYihkYXRhKTtcbiAgICAgICAgY29uc3QgYnl0ZU51bWJlcnMgPSBuZXcgQXJyYXkoYnl0ZUNoYXJhY3RlcnMubGVuZ3RoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBieXRlQ2hhcmFjdGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYnl0ZU51bWJlcnNbaV0gPSBieXRlQ2hhcmFjdGVycy5jaGFyQ29kZUF0KGkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KGJ5dGVOdW1iZXJzKTtcbiAgICAgICAgZm9ybURhdGEuc2V0KCdyZXF1ZXN0X3R5cGUnLCAnaW1hZ2UnKTtcbiAgICAgICAgZm9ybURhdGEuc2V0KCd1c2VyX2ltYWdlJywgbmV3IEJsb2IoW2J5dGVBcnJheV0sIHsgdHlwZTogXCJpbWFnZS9wbmdcIiB9KSk7XG4gICAgICAgIGZvcm1EYXRhLnNldCgndHJhbnNmZXJUeXBlJywgd2l0aEFpID8gXCJhaVwiIDogXCJuby1haVwiKTtcbiAgICB9XG4gICAgaWYgKCFpc05ldykge1xuICAgICAgICBmb3JtRGF0YS5zZXQoJ3JlcXVlc3RfdHlwZScsICdlZGl0Jyk7XG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJpLCB7XG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGJvZHk6IGZvcm1EYXRhLFxuICAgIH0pO1xuICAgIGNvbnN0IHJlc3BvbnNlRGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICByZXR1cm4gcmVzcG9uc2VEYXRhLmltYWdlX3VybCB8fCByZXNwb25zZURhdGEuaW1hZ2U7XG59XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHJvZHVjdCh7IHF1YW50aXR5LCBuYW1lLCBzaXplLCBjb2xvciwgc2lkZXMsIGFydGljbGUsIHByaWNlIH0pIHtcbiAgICBjb25zdCBwcm9kdWN0SWQgPSAnNjk4MzQxNjQyODMyXycgKyBEYXRlLm5vdygpO1xuICAgIGNvbnN0IGRlc2lnblZhcmlhbnQgPSBzaWRlcy5sZW5ndGggPiAxID8gYDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCIke3NpZGVzWzBdPy5pbWFnZV91cmx9XCIgdGFyZ2V0PVwiX2JsYW5rXCI+JHtzaWRlc1swXT8uaW1hZ2VfdXJsLnNsaWNlKC0xMCl9PC9hPiwgPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiR7c2lkZXNbMV0/LmltYWdlX3VybH1cIiB0YXJnZXQ9XCJfYmxhbmtcIj4ke3NpZGVzWzFdPy5pbWFnZV91cmwuc2xpY2UoLTEwKX08L2E+YCA6IGA8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiJHtzaWRlc1swXT8uaW1hZ2VfdXJsfVwiIHRhcmdldD1cIl9ibGFua1wiPiR7c2lkZXNbMF0/LmltYWdlX3VybC5zbGljZSgtMTApfTwvYT5gO1xuICAgIGNvbnN0IHJlc3VsdFByb2R1Y3QgPSB7XG4gICAgICAgIGlkOiBwcm9kdWN0SWQsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIHByaWNlLFxuICAgICAgICBxdWFudGl0eTogcXVhbnRpdHksXG4gICAgICAgIGltZzogc2lkZXNbMF0/LmltYWdlX3VybCxcbiAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgICAgeyBvcHRpb246ICfQoNCw0LfQvNC10YAnLCB2YXJpYW50OiBzaXplIH0sXG4gICAgICAgICAgICB7IG9wdGlvbjogJ9CU0LjQt9Cw0LnQvScsIHZhcmlhbnQ6IGRlc2lnblZhcmlhbnQgfSxcbiAgICAgICAgICAgIHsgb3B0aW9uOiAn0JDRgNGC0LjQutGD0LsnLCB2YXJpYW50OiBhcnRpY2xlIH0sXG4gICAgICAgICAgICB7IG9wdGlvbjogJ9Cm0LLQtdGCJywgdmFyaWFudDogY29sb3IubmFtZSB9LFxuICAgICAgICAgICAgeyBvcHRpb246ICfQn9GA0LjQvdGCJywgdmFyaWFudDogc2lkZXMubGVuZ3RoID09IDEgPyAn0J7QtNC90L7RgdGC0L7RgNC+0L3QvdC40LknIDogJ9CU0LLRg9GF0YHRgtC+0YDQvtC90L3QuNC5JyB9LFxuICAgICAgICBdXG4gICAgfTtcbiAgICBjb25zb2xlLmRlYnVnKCdbY2FydF0gYWRkIHByb2R1Y3QnLCByZXN1bHRQcm9kdWN0KTtcbiAgICBpZiAodHlwZW9mIHdpbmRvdy50Y2FydF9fYWRkUHJvZHVjdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgd2luZG93LnRjYXJ0X19hZGRQcm9kdWN0KHJlc3VsdFByb2R1Y3QpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB3aW5kb3cueW0oMTAzMjc5MjE0LCAncmVhY2hHb2FsJywgJ2FkZF90b19jYXJ0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHsgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NhcnRdINCe0YjQuNCx0LrQsCDQv9GA0Lgg0LTQvtCx0LDQstC70LXQvdC40Lgg0L/RgNC+0LTRg9C60YLQsCDQsiDQutC+0YDQt9C40L3RgycsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbY2FydF0g0JrQvtGA0LfQuNC90LAgVGlsZGEg0L3QtSDQt9Cw0LPRgNGD0LbQtdC90LAuJyk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGNhbGN1bGF0ZUxheW91dERpbWVuc2lvbnMobGF5b3V0LCBwcm9kdWN0LCBjb250YWluZXJXaWR0aCwgY29udGFpbmVySGVpZ2h0KSB7XG4gICAgY29uc3QgcHJpbnRDb25maWcgPSBwcm9kdWN0LnByaW50Q29uZmlnLmZpbmQocGMgPT4gcGMuc2lkZSA9PT0gbGF5b3V0LnZpZXcpO1xuICAgIGlmICghcHJpbnRDb25maWcpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQcmludCBjb25maWcgbm90IGZvdW5kIGZvciBzaWRlOiAke2xheW91dC52aWV3fWApO1xuICAgIH1cbiAgICBjb25zdCBwcmludEFyZWFXaWR0aCA9IChwcmludENvbmZpZy5zaXplLndpZHRoIC8gNjAwKSAqIGNvbnRhaW5lcldpZHRoO1xuICAgIGNvbnN0IHByaW50QXJlYUhlaWdodCA9IChwcmludENvbmZpZy5zaXplLmhlaWdodCAvIDYwMCkgKiBjb250YWluZXJIZWlnaHQ7XG4gICAgY29uc3QgcHJpbnRBcmVhTGVmdCA9IE1hdGgucm91bmQoKGNvbnRhaW5lcldpZHRoIC0gcHJpbnRBcmVhV2lkdGgpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi54IC8gMTAwKSAqIGNvbnRhaW5lcldpZHRoKTtcbiAgICBjb25zdCBwcmludEFyZWFUb3AgPSBNYXRoLnJvdW5kKChjb250YWluZXJIZWlnaHQgLSBwcmludEFyZWFIZWlnaHQpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi55IC8gMTAwKSAqIGNvbnRhaW5lckhlaWdodCk7XG4gICAgY29uc3QgbGVmdCA9IHByaW50QXJlYUxlZnQgKyAocHJpbnRBcmVhV2lkdGggKiBsYXlvdXQucG9zaXRpb24ueCk7XG4gICAgY29uc3QgdG9wID0gcHJpbnRBcmVhVG9wICsgKHByaW50QXJlYUhlaWdodCAqIGxheW91dC5wb3NpdGlvbi55KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0LFxuICAgICAgICB0b3AsXG4gICAgICAgIHNjYWxlWDogbGF5b3V0LnNpemUsXG4gICAgICAgIHNjYWxlWTogbGF5b3V0LnNpemUgKiBsYXlvdXQuYXNwZWN0UmF0aW8sXG4gICAgICAgIGFuZ2xlOiBsYXlvdXQuYW5nbGUsXG4gICAgICAgIHByaW50QXJlYVdpZHRoLFxuICAgICAgICBwcmludEFyZWFIZWlnaHQsXG4gICAgICAgIHByaW50QXJlYUxlZnQsXG4gICAgICAgIHByaW50QXJlYVRvcFxuICAgIH07XG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyTGF5b3V0KHBhcmFtcykge1xuICAgIGNvbnN0IHsgbGF5b3V0LCBwcm9kdWN0LCBjb250YWluZXJXaWR0aCwgY29udGFpbmVySGVpZ2h0LCBsb2FkSW1hZ2UgfSA9IHBhcmFtcztcbiAgICBjb25zdCBkaW1lbnNpb25zID0gY2FsY3VsYXRlTGF5b3V0RGltZW5zaW9ucyhsYXlvdXQsIHByb2R1Y3QsIGNvbnRhaW5lcldpZHRoLCBjb250YWluZXJIZWlnaHQpO1xuICAgIGNvbnN0IGZhYnJpYyA9IHdpbmRvdy5mYWJyaWM7XG4gICAgaWYgKCFmYWJyaWMpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignW3JlbmRlckxheW91dF0gZmFicmljLmpzINC90LUg0LfQsNCz0YDRg9C20LXQvScpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKGxheW91dC5pc0ltYWdlTGF5b3V0KCkpIHtcbiAgICAgICAgY29uc3QgaW1nID0gYXdhaXQgbG9hZEltYWdlKGxheW91dC51cmwpO1xuICAgICAgICBjb25zdCBpbWFnZSA9IG5ldyBmYWJyaWMuSW1hZ2UoaW1nKTtcbiAgICAgICAgbGV0IGFjdHVhbFNjYWxlID0gbGF5b3V0LnNpemU7XG4gICAgICAgIGNvbnN0IHJlbGF0aXZlV2lkdGggPSBsYXlvdXQuX3JlbGF0aXZlV2lkdGg7XG4gICAgICAgIGlmIChyZWxhdGl2ZVdpZHRoICYmIHJlbGF0aXZlV2lkdGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRXaWR0aCA9IGRpbWVuc2lvbnMucHJpbnRBcmVhV2lkdGggKiByZWxhdGl2ZVdpZHRoO1xuICAgICAgICAgICAgYWN0dWFsU2NhbGUgPSB0YXJnZXRXaWR0aCAvIGltZy53aWR0aDtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtyZW5kZXJMYXlvdXRdINCQ0LTQsNC/0YLQsNGG0LjRjyDQuiDQvdC+0LLQvtC80YMg0YDQsNC30LzQtdGA0YM6IHJlbGF0aXZlV2lkdGg9JHtyZWxhdGl2ZVdpZHRoLnRvRml4ZWQoMyl9LCB0YXJnZXRXaWR0aD0ke3RhcmdldFdpZHRoLnRvRml4ZWQoMSl9cHgsIHNjYWxlPSR7YWN0dWFsU2NhbGUudG9GaXhlZCgzKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsYXlvdXQuc2l6ZSA9PT0gMSAmJiBpbWcud2lkdGggPiBkaW1lbnNpb25zLnByaW50QXJlYVdpZHRoKSB7XG4gICAgICAgICAgICBhY3R1YWxTY2FsZSA9IGRpbWVuc2lvbnMucHJpbnRBcmVhV2lkdGggLyBpbWcud2lkdGg7XG4gICAgICAgICAgICBsYXlvdXQuc2l6ZSA9IGFjdHVhbFNjYWxlO1xuICAgICAgICAgICAgY29uc3Qgb2JqZWN0V2lkdGggPSBpbWcud2lkdGggKiBhY3R1YWxTY2FsZTtcbiAgICAgICAgICAgIGNvbnN0IHJlbFcgPSBvYmplY3RXaWR0aCAvIGRpbWVuc2lvbnMucHJpbnRBcmVhV2lkdGg7XG4gICAgICAgICAgICBsYXlvdXQuX3JlbGF0aXZlV2lkdGggPSByZWxXO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3JlbmRlckxheW91dF0g0JDQstGC0L7Qv9C+0LTQs9C+0L3QutCwINGA0LDQt9C80LXRgNCwOiAke2ltZy53aWR0aH1weCDihpIgJHtkaW1lbnNpb25zLnByaW50QXJlYVdpZHRofXB4LCBzY2FsZT0ke2FjdHVhbFNjYWxlLnRvRml4ZWQoMyl9LCByZWxhdGl2ZVdpZHRoPSR7cmVsVy50b0ZpeGVkKDMpfWApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFyZWxhdGl2ZVdpZHRoIHx8IHJlbGF0aXZlV2lkdGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG9iamVjdFdpZHRoID0gaW1nLndpZHRoICogbGF5b3V0LnNpemU7XG4gICAgICAgICAgICBjb25zdCByZWxXID0gb2JqZWN0V2lkdGggLyBkaW1lbnNpb25zLnByaW50QXJlYVdpZHRoO1xuICAgICAgICAgICAgbGF5b3V0Ll9yZWxhdGl2ZVdpZHRoID0gcmVsVztcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtyZW5kZXJMYXlvdXRdINCS0YvRh9C40YHQu9C10L0gX3JlbGF0aXZlV2lkdGgg0LTQu9GPINGB0YLQsNGA0L7Qs9C+IGxheW91dDogJHtyZWxXLnRvRml4ZWQoMyl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgaW1hZ2Uuc2V0KHtcbiAgICAgICAgICAgIGxlZnQ6IGRpbWVuc2lvbnMubGVmdCxcbiAgICAgICAgICAgIHRvcDogZGltZW5zaW9ucy50b3AsXG4gICAgICAgICAgICBzY2FsZVg6IGFjdHVhbFNjYWxlLFxuICAgICAgICAgICAgc2NhbGVZOiBhY3R1YWxTY2FsZSAqIGxheW91dC5hc3BlY3RSYXRpbyxcbiAgICAgICAgICAgIGFuZ2xlOiBkaW1lbnNpb25zLmFuZ2xlLFxuICAgICAgICAgICAgbmFtZTogbGF5b3V0LmlkLFxuICAgICAgICAgICAgbGF5b3V0VXJsOiBsYXlvdXQudXJsLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGltYWdlO1xuICAgIH1cbiAgICBlbHNlIGlmIChsYXlvdXQuaXNUZXh0TGF5b3V0KCkpIHtcbiAgICAgICAgY29uc3QgdGV4dCA9IG5ldyBmYWJyaWMuVGV4dChsYXlvdXQudGV4dCwge1xuICAgICAgICAgICAgZm9udEZhbWlseTogbGF5b3V0LmZvbnQuZmFtaWx5LFxuICAgICAgICAgICAgZm9udFNpemU6IGxheW91dC5mb250LnNpemUsXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXh0LnNldCh7XG4gICAgICAgICAgICBsZWZ0OiBkaW1lbnNpb25zLmxlZnQsXG4gICAgICAgICAgICB0b3A6IGRpbWVuc2lvbnMudG9wLFxuICAgICAgICAgICAgc2NhbGVYOiBkaW1lbnNpb25zLnNjYWxlWCxcbiAgICAgICAgICAgIHNjYWxlWTogZGltZW5zaW9ucy5zY2FsZVksXG4gICAgICAgICAgICBhbmdsZTogZGltZW5zaW9ucy5hbmdsZSxcbiAgICAgICAgICAgIG5hbWU6IGxheW91dC5pZCxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0ZXh0O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJMYXlvdXRUb0NhbnZhcyhjdHgsIGxheW91dCwgcHJvZHVjdCwgY29udGFpbmVyV2lkdGgsIGNvbnRhaW5lckhlaWdodCwgbG9hZEltYWdlKSB7XG4gICAgY29uc3QgZGltZW5zaW9ucyA9IGNhbGN1bGF0ZUxheW91dERpbWVuc2lvbnMobGF5b3V0LCBwcm9kdWN0LCBjb250YWluZXJXaWR0aCwgY29udGFpbmVySGVpZ2h0KTtcbiAgICBpZiAobGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSkge1xuICAgICAgICBjb25zdCBpbWcgPSBhd2FpdCBsb2FkSW1hZ2UobGF5b3V0LnVybCk7XG4gICAgICAgIGN0eC5zYXZlKCk7XG4gICAgICAgIGN0eC50cmFuc2xhdGUoZGltZW5zaW9ucy5sZWZ0LCBkaW1lbnNpb25zLnRvcCk7XG4gICAgICAgIGN0eC5yb3RhdGUoKGRpbWVuc2lvbnMuYW5nbGUgKiBNYXRoLlBJKSAvIDE4MCk7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gaW1nLndpZHRoICogZGltZW5zaW9ucy5zY2FsZVg7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IGltZy5oZWlnaHQgKiBkaW1lbnNpb25zLnNjYWxlWTtcbiAgICAgICAgY3R4LmRyYXdJbWFnZShpbWcsIDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICBjdHgucmVzdG9yZSgpO1xuICAgIH1cbiAgICBlbHNlIGlmIChsYXlvdXQuaXNUZXh0TGF5b3V0KCkpIHtcbiAgICAgICAgY3R4LnNhdmUoKTtcbiAgICAgICAgY3R4LnRyYW5zbGF0ZShkaW1lbnNpb25zLmxlZnQsIGRpbWVuc2lvbnMudG9wKTtcbiAgICAgICAgY3R4LnJvdGF0ZSgoZGltZW5zaW9ucy5hbmdsZSAqIE1hdGguUEkpIC8gMTgwKTtcbiAgICAgICAgY3R4LmZvbnQgPSBgJHtsYXlvdXQuZm9udC5zaXplICogZGltZW5zaW9ucy5zY2FsZVh9cHggJHtsYXlvdXQuZm9udC5mYW1pbHl9YDtcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICdibGFjayc7XG4gICAgICAgIGN0eC5maWxsVGV4dChsYXlvdXQudGV4dCwgMCwgMCk7XG4gICAgICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RDaGlsZChlbGVtZW50KSB7XG4gICAgaWYgKCFlbGVtZW50KVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICBpZiAoIWVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQpXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIHJldHVybiBnZXRMYXN0Q2hpbGQoZWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZCk7XG59XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCBFZGl0b3IgZnJvbSAnLi4vY29tcG9uZW50cy9FZGl0b3InO1xuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgd2luZG93LkVkaXRvciA9IEVkaXRvcjtcbn1cbmV4cG9ydCBkZWZhdWx0IEVkaXRvcjtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==