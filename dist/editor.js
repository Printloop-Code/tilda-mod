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
            borderBlock.style.setProperty('--t396-bordercolor', '#f3f3f3');
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
                    borderBlock.style.setProperty('--t396-bordercolor', '#f3f3f3');
                }
            });
            const activeBlock = this.sizeBlocks.find(block => block.classList.contains('editor-settings__size-block__' + this._selectSize));
            if (activeBlock) {
                const borderBlock = activeBlock.firstElementChild;
                if (borderBlock) {
                    borderBlock.style.setProperty('--t396-bordercolor', '');
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
                borderBlock.style.setProperty('--t396-bordercolor', '#f3f3f3');
            }
        });
        const activeBlock = this.sizeBlocks.find(block => block.classList.contains('editor-settings__size-block__' + size));
        if (activeBlock) {
            const borderBlock = activeBlock.firstElementChild;
            if (borderBlock) {
                borderBlock.style.setProperty('--t396-bordercolor', '');
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
                    fixButtonWithAi.style.setProperty('--t396-bordercolor', '');
                    console.debug(`[ai buttons] С ИИ: сброшен borderColor (оранжевый)`);
                }
                if (fixButtonWithoutAi) {
                    fixButtonWithoutAi.style.setProperty('--t396-bordercolor', '#f2f2f2');
                    console.debug(`[ai buttons] Без ИИ: установлен borderColor=#f2f2f2 (серый)`);
                }
            }
            else {
                const fixButtonWithAi = buttonWithAi.firstElementChild;
                const fixButtonWithoutAi = buttonWithoutAi.firstElementChild;
                if (fixButtonWithAi) {
                    fixButtonWithAi.style.setProperty('--t396-bordercolor', '#f2f2f2');
                    console.debug(`[ai buttons] С ИИ: установлен borderColor=#f2f2f2 (серый)`);
                }
                if (fixButtonWithoutAi) {
                    fixButtonWithoutAi.style.setProperty('--t396-bordercolor', '');
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
                    fixButton.style.setProperty('--t396-bordercolor', '');
                    console.debug(`[remove bg button] Убрать фон: сброшен borderColor (оранжевый)`);
                }
                else {
                    fixButton.style.setProperty('--t396-bordercolor', '#f2f2f2');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNWd0U7QUFDOUI7QUFDUztBQUNZO0FBQ0g7QUFDbUI7QUFDL0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDLDBDQUEwQztBQUM1QjtBQUNmLHVCQUF1QjtBQUN2Qix3QkFBd0I7QUFDeEIsdUJBQXVCO0FBQ3ZCLHVCQUF1QjtBQUN2Qix5QkFBeUI7QUFDekIsa0JBQWtCLHdEQUF3RDtBQUMxRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEIsdUVBQWlCO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0Esa0NBQWtDLGdGQUFvQjtBQUN0RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBaUQsMkJBQTJCO0FBQzVFO0FBQ0E7QUFDQSxpREFBaUQsa0RBQU07QUFDdkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMkMsS0FBSztBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLHdFQUF3RSxTQUFTO0FBQ2pGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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b0Qsb0NBQW9DO0FBQ3hGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQiw2RUFBeUI7QUFDcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsOEJBQThCO0FBQ3pEO0FBQ0E7QUFDQTtBQUNB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UztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ087QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0IscUNBQXFDLEtBQUssbUJBQW1CO0FBQ25GO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7OztBQ3hHTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztVQ05BO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0EsRTs7Ozs7V0NQQSx3Rjs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0QsRTs7Ozs7Ozs7Ozs7Ozs7O0FDTjBDO0FBQzFDO0FBQ0Esb0JBQW9CLDBEQUFNO0FBQzFCO0FBQ0EsaUVBQWUsMERBQU0sRUFBQyIsInNvdXJjZXMiOlsid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvY29tcG9uZW50cy9FZGl0b3IudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9tYW5hZ2Vycy9FZGl0b3JTdG9yYWdlTWFuYWdlci50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL21vZGVscy9MYXlvdXQudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy91dGlscy9UeXBlZEV2ZW50RW1pdHRlci50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL3V0aWxzL2FwaS50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL3V0aWxzL2NhbnZhc1V0aWxzLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvdXRpbHMvdGlsZGFVdGlscy50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9lbnRyaWVzL2VkaXRvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJlZGl0b3JcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wiZWRpdG9yXCJdID0gZmFjdG9yeSgpO1xufSkodGhpcywgKCkgPT4ge1xucmV0dXJuICIsImltcG9ydCB7IEVkaXRvclN0b3JhZ2VNYW5hZ2VyIH0gZnJvbSAnLi4vbWFuYWdlcnMvRWRpdG9yU3RvcmFnZU1hbmFnZXInO1xuaW1wb3J0IHsgTGF5b3V0IH0gZnJvbSAnLi4vbW9kZWxzL0xheW91dCc7XG5pbXBvcnQgeyBnZXRMYXN0Q2hpbGQgfSBmcm9tICcuLi91dGlscy90aWxkYVV0aWxzJztcbmltcG9ydCB7IFR5cGVkRXZlbnRFbWl0dGVyIH0gZnJvbSAnLi4vdXRpbHMvVHlwZWRFdmVudEVtaXR0ZXInO1xuaW1wb3J0IHsgZ2VuZXJhdGVJbWFnZSwgY3JlYXRlUHJvZHVjdCB9IGZyb20gJy4uL3V0aWxzL2FwaSc7XG5pbXBvcnQgeyByZW5kZXJMYXlvdXQsIGNhbGN1bGF0ZUxheW91dERpbWVuc2lvbnMgfSBmcm9tICcuLi91dGlscy9jYW52YXNVdGlscyc7XG5jb25zdCBsb2dJc3N1ZSA9IChrZXksIHBheWxvYWQpID0+IHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5PcGVuUmVwbGF5Py5oYW5kbGVFcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgd2luZG93Lk9wZW5SZXBsYXkuaGFuZGxlRXJyb3IobmV3IEVycm9yKGtleSksIHBheWxvYWQpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnT3BlblJlcGxheS5oYW5kbGVFcnJvcicsIGtleSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbT3BlblJlcGxheV0gRmFpbGVkIHRvIGxvZyBpc3N1ZTonLCBlKTtcbiAgICB9XG59O1xuY29uc3QgQ09OU1RBTlRTID0ge1xuICAgIFNUQVRFX0VYUElSQVRJT05fREFZUzogMzAsXG4gICAgQ0FOVkFTX0FSRUFfSEVJR0hUOiA2MDAsXG4gICAgTE9BRElOR19JTlRFUlZBTF9NUzogMTAwLFxufTtcbmV4cG9ydCB2YXIgRWRpdG9yRXZlbnRUeXBlO1xuKGZ1bmN0aW9uIChFZGl0b3JFdmVudFR5cGUpIHtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJNT0NLVVBfTE9BRElOR1wiXSA9IFwibW9ja3VwLWxvYWRpbmdcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJNT0NLVVBfVVBEQVRFRFwiXSA9IFwibW9ja3VwLXVwZGF0ZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJMT0FESU5HX1RJTUVfVVBEQVRFRFwiXSA9IFwibG9hZGluZy10aW1lLXVwZGF0ZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJTVEFURV9DSEFOR0VEXCJdID0gXCJzdGF0ZS1jaGFuZ2VkXCI7XG4gICAgRWRpdG9yRXZlbnRUeXBlW1wiTEFZT1VUX0FEREVEXCJdID0gXCJsYXlvdXQtYWRkZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJMQVlPVVRfUkVNT1ZFRFwiXSA9IFwibGF5b3V0LXJlbW92ZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJMQVlPVVRfVVBEQVRFRFwiXSA9IFwibGF5b3V0LXVwZGF0ZWRcIjtcbn0pKEVkaXRvckV2ZW50VHlwZSB8fCAoRWRpdG9yRXZlbnRUeXBlID0ge30pKTtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEVkaXRvciB7XG4gICAgZ2V0IHNlbGVjdFR5cGUoKSB7IHJldHVybiB0aGlzLl9zZWxlY3RUeXBlOyB9XG4gICAgZ2V0IHNlbGVjdENvbG9yKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0Q29sb3I7IH1cbiAgICBnZXQgc2VsZWN0U2lkZSgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdFNpZGU7IH1cbiAgICBnZXQgc2VsZWN0U2l6ZSgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdFNpemU7IH1cbiAgICBnZXQgc2VsZWN0TGF5b3V0KCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0TGF5b3V0OyB9XG4gICAgY29uc3RydWN0b3IoeyBibG9ja3MsIHByb2R1Y3RDb25maWdzLCBmb3JtQ29uZmlnLCBhcGlDb25maWcsIG9wdGlvbnMgfSkge1xuICAgICAgICB0aGlzLnF1YW50aXR5Rm9ybUJsb2NrID0gbnVsbDtcbiAgICAgICAgdGhpcy5mb3JtQmxvY2sgPSBudWxsO1xuICAgICAgICB0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSA9IG51bGw7XG4gICAgICAgIHRoaXMuZm9ybUJ1dHRvbiA9IG51bGw7XG4gICAgICAgIHRoaXMuX3NlbGVjdExheW91dCA9IG51bGw7XG4gICAgICAgIHRoaXMubGF5b3V0cyA9IFtdO1xuICAgICAgICB0aGlzLmNhbnZhc2VzID0gW107XG4gICAgICAgIHRoaXMubGF5ZXJzQ2FudmFzZXMgPSBbXTtcbiAgICAgICAgdGhpcy5hY3RpdmVDYW52YXMgPSBudWxsO1xuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBUeXBlZEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmxheWVyc0hpc3RvcnkgPSBbXTtcbiAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID0gLTE7XG4gICAgICAgIHRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzTG9hZGluZyA9IHRydWU7XG4gICAgICAgIHRoaXMuaXNBZGRpbmdUb0NhcnQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc0FkZGVkVG9DYXJ0ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNHZW5lcmF0aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMubG9hZGluZ1RpbWUgPSAwO1xuICAgICAgICB0aGlzLmxvYWRpbmdJbnRlcnZhbCA9IG51bGw7XG4gICAgICAgIHRoaXMuY29sb3JCbG9ja3MgPSBbXTtcbiAgICAgICAgdGhpcy5zaXplQmxvY2tzID0gW107XG4gICAgICAgIHRoaXMucHJvZHVjdEJsb2NrcyA9IFtdO1xuICAgICAgICB0aGlzLmxvYWRlZFVzZXJJbWFnZSA9IG51bGw7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbWFnZUNhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmxvYWRpbmdFbGVtZW50c0NhY2hlID0ge307XG4gICAgICAgIHRoaXMucHJvZHVjdENhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLm1vY2t1cENhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICBpZiAoIXByb2R1Y3RDb25maWdzIHx8IHByb2R1Y3RDb25maWdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgbG9nSXNzdWUoJ2VkaXRvcl9pbml0X2Vycm9yJywge1xuICAgICAgICAgICAgICAgIGVycm9yOiAncHJvZHVjdF9jb25maWdzX21pc3NpbmcnLFxuICAgICAgICAgICAgICAgIGhhc1Byb2R1Y3RDb25maWdzOiAhIXByb2R1Y3RDb25maWdzLFxuICAgICAgICAgICAgICAgIHByb2R1Y3RzQ291bnQ6IHByb2R1Y3RDb25maWdzPy5sZW5ndGggfHwgMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tFZGl0b3JdINCd0LUg0L/RgNC10LTQvtGB0YLQsNCy0LvQtdC90Ysg0LrQvtC90YTQuNCz0YPRgNCw0YbQuNC4INC/0YDQvtC00YPQutGC0L7QsicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RvcmFnZU1hbmFnZXIgPSBuZXcgRWRpdG9yU3RvcmFnZU1hbmFnZXIoKTtcbiAgICAgICAgdGhpcy5wcm9kdWN0Q29uZmlncyA9IHByb2R1Y3RDb25maWdzO1xuICAgICAgICB0aGlzLmFwaUNvbmZpZyA9IGFwaUNvbmZpZztcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jayA9IHRoaXMuZ2V0UmVxdWlyZWRFbGVtZW50KGJsb2Nrcy5lZGl0b3JCbG9ja0NsYXNzKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VTaWRlQnV0dG9uID0gdGhpcy5nZXRSZXF1aXJlZEVsZW1lbnQoYmxvY2tzLmNoYW5nZVNpZGVCdXR0b25DbGFzcyk7XG4gICAgICAgIHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jayA9IHRoaXMuZ2V0UmVxdWlyZWRFbGVtZW50KGJsb2Nrcy5lZGl0b3JIaXN0b3J5VW5kb0Jsb2NrQ2xhc3MpO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2sgPSB0aGlzLmdldFJlcXVpcmVkRWxlbWVudChibG9ja3MuZWRpdG9ySGlzdG9yeVJlZG9CbG9ja0NsYXNzKTtcbiAgICAgICAgdGhpcy5xdWFudGl0eUZvcm1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclF1YW50aXR5Rm9ybUJsb2NrQ2xhc3MpO1xuICAgICAgICBjb25zdCBwcm9kdWN0TGlzdEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MucHJvZHVjdExpc3RCbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKHByb2R1Y3RMaXN0QmxvY2spXG4gICAgICAgICAgICB0aGlzLnByb2R1Y3RMaXN0QmxvY2sgPSBwcm9kdWN0TGlzdEJsb2NrO1xuICAgICAgICBjb25zdCBwcm9kdWN0SXRlbUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MucHJvZHVjdEl0ZW1DbGFzcyk7XG4gICAgICAgIGlmIChwcm9kdWN0SXRlbUJsb2NrKVxuICAgICAgICAgICAgdGhpcy5wcm9kdWN0SXRlbUJsb2NrID0gcHJvZHVjdEl0ZW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yQ29sb3JzTGlzdEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yQ29sb3JzTGlzdEJsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yQ29sb3JzTGlzdEJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JDb2xvcnNMaXN0QmxvY2sgPSBlZGl0b3JDb2xvcnNMaXN0QmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvckNvbG9ySXRlbUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yQ29sb3JJdGVtQmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JDb2xvckl0ZW1CbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yQ29sb3JJdGVtQmxvY2sgPSBlZGl0b3JDb2xvckl0ZW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yU2l6ZXNMaXN0QmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JTaXplc0xpc3RCbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclNpemVzTGlzdEJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JTaXplc0xpc3RCbG9jayA9IGVkaXRvclNpemVzTGlzdEJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JTaXplSXRlbUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yU2l6ZUl0ZW1CbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclNpemVJdGVtQmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvclNpemVJdGVtQmxvY2sgPSBlZGl0b3JTaXplSXRlbUJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JMYXlvdXRzTGlzdEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yTGF5b3V0c0xpc3RCbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvckxheW91dHNMaXN0QmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2sgPSBlZGl0b3JMYXlvdXRzTGlzdEJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JMYXlvdXRJdGVtQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JMYXlvdXRJdGVtQmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9jayA9IGVkaXRvckxheW91dEl0ZW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbkNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclVwbG9hZEltYWdlQnV0dG9uKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbiA9IGVkaXRvclVwbG9hZEltYWdlQnV0dG9uO1xuICAgICAgICBjb25zdCBlZGl0b3JVcGxvYWRWaWV3QmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JVcGxvYWRWaWV3QmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvclVwbG9hZFZpZXdCbG9jayA9IGVkaXRvclVwbG9hZFZpZXdCbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRDYW5jZWxCdXR0b24gPSBlZGl0b3JVcGxvYWRDYW5jZWxCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvckxvYWRXaXRoQWlCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbiA9IGVkaXRvckxvYWRXaXRoQWlCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbiA9IGVkaXRvckxvYWRXaXRob3V0QWlCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yUmVtb3ZlQmFja2dyb3VuZEJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yUmVtb3ZlQmFja2dyb3VuZEJ1dHRvbiA9IGVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvckFkZE9yZGVyQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yQWRkT3JkZXJCdXR0b25DbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JBZGRPcmRlckJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24gPSBlZGl0b3JBZGRPcmRlckJ1dHRvbjtcbiAgICAgICAgY29uc3QgZWRpdG9yU3VtQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JTdW1CbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclN1bUJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JTdW1CbG9jayA9IGVkaXRvclN1bUJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JQcm9kdWN0TmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclByb2R1Y3ROYW1lQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yUHJvZHVjdE5hbWUpXG4gICAgICAgICAgICB0aGlzLmVkaXRvclByb2R1Y3ROYW1lID0gZWRpdG9yUHJvZHVjdE5hbWU7XG4gICAgICAgIHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrVmlld0NsYXNzID0gYmxvY2tzLmVkaXRvckxheW91dEl0ZW1CbG9ja1ZpZXdDbGFzcztcbiAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tOYW1lQ2xhc3MgPSBibG9ja3MuZWRpdG9yTGF5b3V0SXRlbUJsb2NrTmFtZUNsYXNzO1xuICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja1JlbW92ZUNsYXNzID0gYmxvY2tzLmVkaXRvckxheW91dEl0ZW1CbG9ja1JlbW92ZUNsYXNzO1xuICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja0VkaXRDbGFzcyA9IGJsb2Nrcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tFZGl0Q2xhc3M7XG4gICAgICAgIGlmIChmb3JtQ29uZmlnKSB7XG4gICAgICAgICAgICB0aGlzLmZvcm1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZm9ybUNvbmZpZy5mb3JtQmxvY2tDbGFzcyk7XG4gICAgICAgICAgICB0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSA9IGZvcm1Db25maWcuZm9ybUlucHV0VmFyaWFibGVOYW1lO1xuICAgICAgICAgICAgdGhpcy5mb3JtQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihmb3JtQ29uZmlnLmZvcm1CdXR0b25DbGFzcyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGVmYXVsdFByb2R1Y3QgPSBwcm9kdWN0Q29uZmlnc1swXTtcbiAgICAgICAgaWYgKCFkZWZhdWx0UHJvZHVjdCkge1xuICAgICAgICAgICAgbG9nSXNzdWUoJ2VkaXRvcl9pbml0X2Vycm9yJywge1xuICAgICAgICAgICAgICAgIGVycm9yOiAnZGVmYXVsdF9wcm9kdWN0X25vdF9mb3VuZCcsXG4gICAgICAgICAgICAgICAgcHJvZHVjdHNDb3VudDogcHJvZHVjdENvbmZpZ3MubGVuZ3RoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW0VkaXRvcl0g0J3QtSDQvdCw0LnQtNC10L0g0LTQtdGE0L7Qu9GC0L3Ri9C5INC/0YDQvtC00YPQutGCJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGVmYXVsdE1vY2t1cCA9IGRlZmF1bHRQcm9kdWN0Lm1vY2t1cHNbMF07XG4gICAgICAgIGlmICghZGVmYXVsdE1vY2t1cCkge1xuICAgICAgICAgICAgbG9nSXNzdWUoJ2VkaXRvcl9pbml0X2Vycm9yJywge1xuICAgICAgICAgICAgICAgIGVycm9yOiAnZGVmYXVsdF9tb2NrdXBfbm90X2ZvdW5kJyxcbiAgICAgICAgICAgICAgICBwcm9kdWN0VHlwZTogZGVmYXVsdFByb2R1Y3QudHlwZSxcbiAgICAgICAgICAgICAgICBtb2NrdXBzQ291bnQ6IGRlZmF1bHRQcm9kdWN0Lm1vY2t1cHM/Lmxlbmd0aCB8fCAwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW0VkaXRvcl0g0J3QtSDQvdCw0LnQtNC10L0g0LTQtdGE0L7Qu9GC0L3Ri9C5IG1vY2t1cCcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghZGVmYXVsdE1vY2t1cC5jb2xvciB8fCAhZGVmYXVsdE1vY2t1cC5jb2xvci5uYW1lKSB7XG4gICAgICAgICAgICBsb2dJc3N1ZSgnZWRpdG9yX2luaXRfZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgZXJyb3I6ICdkZWZhdWx0X2NvbG9yX25vdF9mb3VuZCcsXG4gICAgICAgICAgICAgICAgcHJvZHVjdFR5cGU6IGRlZmF1bHRQcm9kdWN0LnR5cGUsXG4gICAgICAgICAgICAgICAgbW9ja3VwOiBkZWZhdWx0TW9ja3VwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW0VkaXRvcl0g0KbQstC10YIg0L3QtSDQvtC/0YDQtdC00LXQu9C10L0g0LIg0LTQtdGE0L7Qu9GC0L3QvtC8IG1vY2t1cCcpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gZGVmYXVsdE1vY2t1cC5jb2xvcjtcbiAgICAgICAgdGhpcy5fc2VsZWN0U2lkZSA9IGRlZmF1bHRNb2NrdXAuc2lkZTtcbiAgICAgICAgdGhpcy5fc2VsZWN0VHlwZSA9IGRlZmF1bHRQcm9kdWN0LnR5cGU7XG4gICAgICAgIHRoaXMuX3NlbGVjdFNpemUgPSBkZWZhdWx0UHJvZHVjdC5zaXplcz8uWzBdIHx8ICdNJztcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jay5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgICAgIHRoaXMuY3JlYXRlQmFja2dyb3VuZEJsb2NrKCk7XG4gICAgICAgIHRoaXMubW9ja3VwQmxvY2sgPSB0aGlzLmNyZWF0ZU1vY2t1cEJsb2NrKCk7XG4gICAgICAgIHRoaXMuY2FudmFzZXNDb250YWluZXIgPSB0aGlzLmNyZWF0ZUNhbnZhc2VzQ29udGFpbmVyKCk7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZGluZ0Jsb2NrID0gdGhpcy5jcmVhdGVFZGl0b3JMb2FkaW5nQmxvY2soKTtcbiAgICAgICAgdGhpcy5pbml0RXZlbnRzKCk7XG4gICAgICAgIHRoaXMuaW5pdEtleWJvYXJkU2hvcnRjdXRzKCk7XG4gICAgICAgIHRoaXMuaW5pdExvYWRpbmdFdmVudHMoKTtcbiAgICAgICAgdGhpcy5pbml0VUlDb21wb25lbnRzKCk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZUVkaXRvcigpO1xuICAgICAgICB3aW5kb3cuZ2V0TGF5b3V0cyA9ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxheW91dHMubWFwKGxheW91dCA9PiAoeyAuLi5sYXlvdXQsIHVybDogdW5kZWZpbmVkIH0pKTtcbiAgICAgICAgfTtcbiAgICAgICAgd2luZG93LmxvYWRMYXlvdXRzID0gKGxheW91dHMpID0+IHtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0cyA9IGxheW91dHMubWFwKGxheW91dCA9PiBMYXlvdXQuZnJvbUpTT04obGF5b3V0KSk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgfTtcbiAgICAgICAgd2luZG93LmV4cG9ydFByaW50ID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZXhwb3J0ZWRBcnQgPSBhd2FpdCB0aGlzLmV4cG9ydEFydChmYWxzZSwgNDA5Nik7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHNpZGUgb2YgT2JqZWN0LmtleXMoZXhwb3J0ZWRBcnQpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZG93bmxvYWRMaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZG93bmxvYWRMaW5rKTtcbiAgICAgICAgICAgICAgICBkb3dubG9hZExpbmsuaHJlZiA9IGV4cG9ydGVkQXJ0W3NpZGVdO1xuICAgICAgICAgICAgICAgIGRvd25sb2FkTGluay50YXJnZXQgPSAnX3NlbGYnO1xuICAgICAgICAgICAgICAgIGRvd25sb2FkTGluay5kb3dubG9hZCA9IGAke3NpZGV9LnBuZ2A7XG4gICAgICAgICAgICAgICAgZG93bmxvYWRMaW5rLmNsaWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZXhwb3J0ZWRBcnQ7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGluaXRVSUNvbXBvbmVudHMoKSB7XG4gICAgICAgIGlmICh0aGlzLmNoYW5nZVNpZGVCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlU2lkZUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICB0aGlzLmNoYW5nZVNpZGVCdXR0b24ub25jbGljayA9ICgpID0+IHRoaXMuY2hhbmdlU2lkZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEhpc3RvcnlVbmRvQmxvY2soKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRIaXN0b3J5UmVkb0Jsb2NrKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucHJvZHVjdExpc3RCbG9jayAmJiB0aGlzLnByb2R1Y3RJdGVtQmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdFByb2R1Y3RMaXN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEFkZE9yZGVyQnV0dG9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdFVwbG9hZEltYWdlQnV0dG9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbiAmJiB0aGlzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24gJiYgdGhpcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRBaUJ1dHRvbnMoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5mb3JtQmxvY2sgJiYgdGhpcy5mb3JtQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRGb3JtKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucXVhbnRpdHlGb3JtQmxvY2spIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5pbml0Rml4UXVhbnRpdHlGb3JtKCksIDUwMCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jaykge1xuICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRDYW5jZWxCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRDYW5jZWxCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkIGltYWdlIGJ1dHRvbl0gY2FuY2VsIGJ1dHRvbiBjbGlja2VkJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldFVzZXJVcGxvYWRJbWFnZSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRSZXF1aXJlZEVsZW1lbnQoc2VsZWN0b3IpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIGxvZ0lzc3VlKCdlZGl0b3JfcmVxdWlyZWRfZWxlbWVudF9ub3RfZm91bmQnLCB7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3I6IHNlbGVjdG9yXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgW0VkaXRvcl0g0J3QtSDQvdCw0LnQtNC10L0g0L7QsdGP0LfQsNGC0LXQu9GM0L3Ri9C5INGN0LvQtdC80LXQvdGCOiAke3NlbGVjdG9yfWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbiAgICBhc3luYyBpbml0aWFsaXplRWRpdG9yKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZFN0YXRlKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnByZWxvYWRBbGxNb2NrdXBzKCk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZWRpdG9yXSDQmNC90LjRhtC40LDQu9C40LfQsNGG0LjRjyDQt9Cw0LLQtdGA0YjQtdC90LAnKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tlZGl0b3JdINCe0YjQuNCx0LrQsCDQuNC90LjRhtC40LDQu9C40LfQsNGG0LjQuDonLCBlcnJvcik7XG4gICAgICAgICAgICBsb2dJc3N1ZSgnZWRpdG9yX2luaXRpYWxpemF0aW9uX2Vycm9yJywge1xuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICAgICAgaGFzU3RvcmFnZTogISF0aGlzLnN0b3JhZ2VNYW5hZ2VyXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZVdpdGhEZWZhdWx0cygpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGluaXRpYWxpemVXaXRoRGVmYXVsdHMoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tlZGl0b3JdINCY0L3QuNGG0LjQsNC70LjQt9Cw0YbQuNGPINGBINC00LXRhNC+0LvRgtC90YvQvNC4INC30L3QsNGH0LXQvdC40Y/QvNC4Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tlZGl0b3JdINCe0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4IG1vY2t1cCDQv9C+INGD0LzQvtC70YfQsNC90LjRjjonLCBlcnIpO1xuICAgICAgICAgICAgbG9nSXNzdWUoJ2VkaXRvcl9kZWZhdWx0X21vY2t1cF9sb2FkX2Vycm9yJywge1xuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVyciksXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRUeXBlOiB0aGlzLl9zZWxlY3RUeXBlLFxuICAgICAgICAgICAgICAgIHNlbGVjdGVkQ29sb3I6IHRoaXMuX3NlbGVjdENvbG9yLFxuICAgICAgICAgICAgICAgIHNlbGVjdGVkU2lkZTogdGhpcy5fc2VsZWN0U2lkZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5pdEV2ZW50cygpIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnM/LmRpc2FibGVCZWZvcmVVbmxvYWRXYXJuaW5nKSB7XG4gICAgICAgICAgICB3aW5kb3cub25iZWZvcmV1bmxvYWQgPSAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxheW91dHMubGVuZ3RoID4gMCAmJiAhdGhpcy5pc0FkZGVkVG9DYXJ0ICYmIHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSAn0JTQuNC30LDQudC9INGA0LXQtNCw0LrRgtC+0YDQsCDQvNC+0LbQtdGCINCx0YvRgtGMINC/0L7RgtC10YDRj9C9LiDQktGLINGD0LLQtdGA0LXQvdGLLCDRh9GC0L4g0YXQvtGC0LjRgtC1INC/0L7QutC40L3Rg9GC0Ywg0YHRgtGA0LDQvdC40YbRgz8nO1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBtZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlc2l6ZVRpbWVvdXQ7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQocmVzaXplVGltZW91dCk7XG4gICAgICAgICAgICByZXNpemVUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVXaW5kb3dSZXNpemUoKTtcbiAgICAgICAgICAgIH0sIDE1MCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmV2ZW50cy5vbihFZGl0b3JFdmVudFR5cGUuTU9DS1VQX1VQREFURUQsIChkYXRhVVJMKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vY2t1cEJsb2NrLnNyYyA9IGRhdGFVUkw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpbml0TG9hZGluZ0V2ZW50cygpIHtcbiAgICAgICAgdGhpcy5sb2FkaW5nRWxlbWVudHNDYWNoZS5sb2FkaW5nVGV4dCA9IHRoaXMuZWRpdG9yTG9hZGluZ0Jsb2NrLnF1ZXJ5U2VsZWN0b3IoJyNsb2FkaW5nLXRleHQnKTtcbiAgICAgICAgdGhpcy5sb2FkaW5nRWxlbWVudHNDYWNoZS5zcGlubmVyID0gdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2sucXVlcnlTZWxlY3RvcignI3NwaW5uZXInKTtcbiAgICAgICAgdGhpcy5ldmVudHMub24oRWRpdG9yRXZlbnRUeXBlLkxPQURJTkdfVElNRV9VUERBVEVELCAobG9hZGluZ1RpbWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHsgbG9hZGluZ1RleHQsIHNwaW5uZXIgfSA9IHRoaXMubG9hZGluZ0VsZW1lbnRzQ2FjaGU7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0xvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb2FkaW5nVGltZSA+IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuaW5uZXJUZXh0ID0gYCR7KHRoaXMubG9hZGluZ1RpbWUgLyAxMCkudG9GaXhlZCgxKX1gO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzcGlubmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNzQ1KVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzcGlubmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRpbmdCbG9jay5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMClcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGluZ1RleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZXZlbnRzLm9uKEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgKGlzTG9hZGluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBsb2FkaW5nVGV4dCwgc3Bpbm5lciB9ID0gdGhpcy5sb2FkaW5nRWxlbWVudHNDYWNoZTtcbiAgICAgICAgICAgIGlmIChpc0xvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb2FkaW5nSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmxvYWRpbmdJbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZ1RpbWUgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbbW9ja3VwXSBsb2FkaW5nIG1vY2t1cCcpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZ0ludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmdUaW1lKys7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTE9BRElOR19USU1FX1VQREFURUQsIHRoaXMubG9hZGluZ1RpbWUpO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRpbmdCbG9jay5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMClcIjtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGluZ1RleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3Bpbm5lcikge1xuICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb2FkaW5nSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmxvYWRpbmdJbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZ0ludGVydmFsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nVGltZSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbWl0KHR5cGUsIGRldGFpbCkge1xuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KHR5cGUsIGRldGFpbCk7XG4gICAgfVxuICAgIGluaXRLZXlib2FyZFNob3J0Y3V0cygpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlRWxlbWVudCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCBpc0lucHV0RmllbGQgPSBhY3RpdmVFbGVtZW50ICYmIChhY3RpdmVFbGVtZW50LnRhZ05hbWUgPT09ICdJTlBVVCcgfHxcbiAgICAgICAgICAgICAgICBhY3RpdmVFbGVtZW50LnRhZ05hbWUgPT09ICdURVhUQVJFQScgfHxcbiAgICAgICAgICAgICAgICBhY3RpdmVFbGVtZW50LmNvbnRlbnRFZGl0YWJsZSA9PT0gJ3RydWUnIHx8XG4gICAgICAgICAgICAgICAgYWN0aXZlRWxlbWVudC5pc0NvbnRlbnRFZGl0YWJsZSk7XG4gICAgICAgICAgICBpZiAoaXNJbnB1dEZpZWxkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGlmIChldmVudC5jdHJsS2V5ICYmIGV2ZW50LmNvZGUgPT09ICdLZXlaJyAmJiAhZXZlbnQuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudW5kbygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgoZXZlbnQuY3RybEtleSAmJiBldmVudC5zaGlmdEtleSAmJiBldmVudC5jb2RlID09PSAnS2V5WicpIHx8XG4gICAgICAgICAgICAgICAgKGV2ZW50LmN0cmxLZXkgJiYgZXZlbnQuY29kZSA9PT0gJ0tleVknICYmICFldmVudC5zaGlmdEtleSkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVkbygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNyZWF0ZUJhY2tncm91bmRCbG9jaygpIHtcbiAgICAgICAgY29uc3QgYmFja2dyb3VuZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBiYWNrZ3JvdW5kLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1wb3NpdGlvbicpO1xuICAgICAgICBiYWNrZ3JvdW5kLmlkID0gJ2VkaXRvci1iYWNrZ3JvdW5kJztcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jay5hcHBlbmRDaGlsZChiYWNrZ3JvdW5kKTtcbiAgICAgICAgcmV0dXJuIGJhY2tncm91bmQ7XG4gICAgfVxuICAgIGNyZWF0ZU1vY2t1cEJsb2NrKCkge1xuICAgICAgICBjb25zdCBtb2NrdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgICAgICAgbW9ja3VwLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1wb3NpdGlvbicpO1xuICAgICAgICBtb2NrdXAuaWQgPSAnZWRpdG9yLW1vY2t1cCc7XG4gICAgICAgIHRoaXMuZWRpdG9yQmxvY2suYXBwZW5kQ2hpbGQobW9ja3VwKTtcbiAgICAgICAgcmV0dXJuIG1vY2t1cDtcbiAgICB9XG4gICAgY3JlYXRlQ2FudmFzZXNDb250YWluZXIoKSB7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBjYW52YXMuY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXBvc2l0aW9uJyk7XG4gICAgICAgIGNhbnZhcy5pZCA9ICdlZGl0b3ItY2FudmFzZXMtY29udGFpbmVyJztcbiAgICAgICAgY2FudmFzLnN0eWxlLnpJbmRleCA9ICcxMCc7XG4gICAgICAgIGNhbnZhcy5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICB0aGlzLmVkaXRvckJsb2NrLmFwcGVuZENoaWxkKGNhbnZhcyk7XG4gICAgICAgIHJldHVybiBjYW52YXM7XG4gICAgfVxuICAgIGNyZWF0ZUVkaXRvckxvYWRpbmdCbG9jaygpIHtcbiAgICAgICAgY29uc3QgZWRpdG9yTG9hZGluZ0Jsb2NrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5zdHlsZS5kaXNwbGF5ID0gXCJmbGV4XCI7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItcG9zaXRpb24nKTtcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLmlkID0gJ2VkaXRvci1sb2FkaW5nJztcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLnN0eWxlLnpJbmRleCA9IFwiMTAwMFwiO1xuICAgICAgICBlZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUucG9pbnRlckV2ZW50cyA9IFwibm9uZVwiO1xuICAgICAgICBjb25zdCBsb2FkaW5nVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBsb2FkaW5nVGV4dC5pZCA9ICdsb2FkaW5nLXRleHQnO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLnRleHRBbGlnbiA9IFwiY2VudGVyXCI7XG4gICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS50b3AgPSBcIjUwJVwiO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5sZWZ0ID0gXCI1MCVcIjtcbiAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoLTUwJSwgLTUwJSlcIjtcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLmFwcGVuZENoaWxkKGxvYWRpbmdUZXh0KTtcbiAgICAgICAgY29uc3Qgc3Bpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBzcGlubmVyLmlkID0gJ3NwaW5uZXInO1xuICAgICAgICBzcGlubmVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLmFwcGVuZENoaWxkKHNwaW5uZXIpO1xuICAgICAgICB0aGlzLmVkaXRvckJsb2NrLmFwcGVuZENoaWxkKGVkaXRvckxvYWRpbmdCbG9jayk7XG4gICAgICAgIHJldHVybiBlZGl0b3JMb2FkaW5nQmxvY2s7XG4gICAgfVxuICAgIGFzeW5jIHVwZGF0ZU1vY2t1cCgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW21vY2t1cF0gdXBkYXRlIGZvciAke3RoaXMuX3NlbGVjdFR5cGV9ICR7dGhpcy5fc2VsZWN0U2lkZX0gJHt0aGlzLl9zZWxlY3RDb2xvci5uYW1lfWApO1xuICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCB0cnVlKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG1vY2t1cEltYWdlVXJsID0gdGhpcy5maW5kTW9ja3VwVXJsKCk7XG4gICAgICAgICAgICBpZiAoIW1vY2t1cEltYWdlVXJsKSB7XG4gICAgICAgICAgICAgICAgbG9nSXNzdWUoJ21vY2t1cF9ub3RfZm91bmQnLCB7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RUeXBlOiB0aGlzLl9zZWxlY3RUeXBlLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2lkZTogdGhpcy5fc2VsZWN0U2lkZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW21vY2t1cF0g0J3QtSDQvdCw0LnQtNC10L0gbW9ja3VwINC00LvRjyDRgtC10LrRg9GJ0LjRhSDQv9Cw0YDQsNC80LXRgtGA0L7QsicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZGF0YVVSTCA9IGF3YWl0IHRoaXMubG9hZEFuZENvbnZlcnRJbWFnZShtb2NrdXBJbWFnZVVybCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9VUERBVEVELCBkYXRhVVJMKTtcbiAgICAgICAgICAgIHRoaXMubW9ja3VwQmxvY2suc3JjID0gZGF0YVVSTDtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1ttb2NrdXBdIE1vY2t1cCDRg9GB0L/QtdGI0L3QviDQvtCx0L3QvtCy0LvQtdC9Jyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbbW9ja3VwXSDQntGI0LjQsdC60LAg0L7QsdC90L7QstC70LXQvdC40Y8gbW9ja3VwOicsIGVycm9yKTtcbiAgICAgICAgICAgIGxvZ0lzc3VlKCdtb2NrdXBfdXBkYXRlX2Vycm9yJywge1xuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICAgICAgcHJvZHVjdFR5cGU6IHRoaXMuX3NlbGVjdFR5cGUsXG4gICAgICAgICAgICAgICAgY29sb3I6IHRoaXMuX3NlbGVjdENvbG9yLm5hbWUsXG4gICAgICAgICAgICAgICAgc2lkZTogdGhpcy5fc2VsZWN0U2lkZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmaW5kTW9ja3VwVXJsKCkge1xuICAgICAgICBjb25zdCBjYWNoZUtleSA9IGAke3RoaXMuX3NlbGVjdFR5cGV9LSR7dGhpcy5fc2VsZWN0U2lkZX0tJHt0aGlzLl9zZWxlY3RDb2xvci5uYW1lfWA7XG4gICAgICAgIGlmICh0aGlzLm1vY2t1cENhY2hlLmhhcyhjYWNoZUtleSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1vY2t1cENhY2hlLmdldChjYWNoZUtleSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0KSB7XG4gICAgICAgICAgICB0aGlzLm1vY2t1cENhY2hlLnNldChjYWNoZUtleSwgbnVsbCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtb2NrdXAgPSBwcm9kdWN0Lm1vY2t1cHMuZmluZChtID0+IG0uc2lkZSA9PT0gdGhpcy5fc2VsZWN0U2lkZSAmJiBtLmNvbG9yLm5hbWUgPT09IHRoaXMuX3NlbGVjdENvbG9yLm5hbWUpO1xuICAgICAgICBjb25zdCB1cmwgPSBtb2NrdXA/LnVybCB8fCBudWxsO1xuICAgICAgICB0aGlzLm1vY2t1cENhY2hlLnNldChjYWNoZUtleSwgdXJsKTtcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG4gICAgZ2V0UHJvZHVjdEJ5VHlwZSh0eXBlKSB7XG4gICAgICAgIGlmICghdGhpcy5wcm9kdWN0Q2FjaGUuaGFzKHR5cGUpKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5wcm9kdWN0Q29uZmlncy5maW5kKHAgPT4gcC50eXBlID09PSB0eXBlKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9kdWN0Q2FjaGUuc2V0KHR5cGUsIHByb2R1Y3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnByb2R1Y3RDYWNoZS5nZXQodHlwZSk7XG4gICAgfVxuICAgIGNsZWFyTW9ja3VwQ2FjaGUoKSB7XG4gICAgICAgIHRoaXMubW9ja3VwQ2FjaGUuY2xlYXIoKTtcbiAgICB9XG4gICAgYXN5bmMgbG9hZEFuZENvbnZlcnRJbWFnZShpbWFnZVVybCkge1xuICAgICAgICBpZiAodGhpcy5pbWFnZUNhY2hlLmhhcyhpbWFnZVVybCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tjYWNoZV0g0JjQt9C+0LHRgNCw0LbQtdC90LjQtSDQt9Cw0LPRgNGD0LbQtdC90L4g0LjQtyDQutGN0YjQsDonLCBpbWFnZVVybCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbWFnZUNhY2hlLmdldChpbWFnZVVybCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICAgICAgICBpbWFnZS5zZXRBdHRyaWJ1dGUoJ2Nyb3NzT3JpZ2luJywgJ2Fub255bW91cycpO1xuICAgICAgICAgICAgaW1hZ2Uub25sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICAgICAgICAgICAgICBjYW52YXMud2lkdGggPSBpbWFnZS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGltYWdlLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY3R4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCfQndC1INGD0LTQsNC70L7RgdGMINC/0L7Qu9GD0YfQuNGC0Ywg0LrQvtC90YLQtdC60YHRgiBjYW52YXMnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShpbWFnZSwgMCwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGFVUkwgPSBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbWFnZUNhY2hlLnNldChpbWFnZVVybCwgZGF0YVVSTCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tjYWNoZV0g0JjQt9C+0LHRgNCw0LbQtdC90LjQtSDRgdC+0YXRgNCw0L3QtdC90L4g0LIg0LrRjdGIOicsIGltYWdlVXJsKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhVVJMKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGltYWdlLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihg0J7RiNC40LHQutCwINC30LDQs9GA0YPQt9C60Lgg0LjQt9C+0LHRgNCw0LbQtdC90LjRjzogJHtpbWFnZVVybH1gKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1hZ2Uuc3JjID0gaW1hZ2VVcmw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBzYXZlU3RhdGUoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tzdGF0ZV0g0KHQvtGF0YDQsNC90LXQvdC40LUg0YHQvtGB0YLQvtGP0L3QuNGPINGA0LXQtNCw0LrRgtC+0YDQsCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yU3RhdGUgPSB7XG4gICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgICAgIHR5cGU6IHRoaXMuX3NlbGVjdFR5cGUsXG4gICAgICAgICAgICAgICAgY29sb3I6IHRoaXMuX3NlbGVjdENvbG9yLm5hbWUsXG4gICAgICAgICAgICAgICAgc2lkZTogdGhpcy5fc2VsZWN0U2lkZSxcbiAgICAgICAgICAgICAgICBzaXplOiB0aGlzLl9zZWxlY3RTaXplXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3N0YXRlXSDQodC+0YXRgNCw0L3Rj9C10Lw6IHR5cGU9JHtlZGl0b3JTdGF0ZS50eXBlfSwgY29sb3I9JHtlZGl0b3JTdGF0ZS5jb2xvcn0sIHNpZGU9JHtlZGl0b3JTdGF0ZS5zaWRlfSwgc2l6ZT0ke2VkaXRvclN0YXRlLnNpemV9YCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLnNhdmVFZGl0b3JTdGF0ZShlZGl0b3JTdGF0ZSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbc3RhdGVdINCh0L7RgdGC0L7Rj9C90LjQtSDRg9GB0L/QtdGI0L3QviDRgdC+0YXRgNCw0L3QtdC90L4nKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPINGB0L7RgdGC0L7Rj9C90LjRjzonLCBlcnJvcik7XG4gICAgICAgICAgICBsb2dJc3N1ZSgnZWRpdG9yX3N0YXRlX3NhdmVfZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgICBzdGF0ZToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiB0aGlzLl9zZWxlY3RUeXBlLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2lkZTogdGhpcy5fc2VsZWN0U2lkZSxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogdGhpcy5fc2VsZWN0U2l6ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIHNhdmVMYXlvdXRzKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbbGF5ZXJzXSDQodC+0YXRgNCw0L3QtdC90LjQtSDRgdC70L7RkdCyJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLnNhdmVMYXllcnModGhpcy5sYXlvdXRzKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tsYXllcnNdINCh0LvQvtC4INGD0YHQv9C10YjQvdC+INGB0L7RhdGA0LDQvdC10L3RiycpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2xheWVyc10g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPINGB0LvQvtGR0LI6JywgZXJyb3IpO1xuICAgICAgICAgICAgbG9nSXNzdWUoJ2VkaXRvcl9sYXllcnNfc2F2ZV9lcnJvcicsIHtcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgICAgICAgIGxheWVyc0NvdW50OiB0aGlzLmxheW91dHMubGVuZ3RoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBsb2FkTGF5b3V0cygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2xheWVyc10g0JfQsNCz0YDRg9C30LrQsCDRgdC70L7RkdCyJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzYXZlZExheW91dHMgPSBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLmxvYWRMYXllcnMoKTtcbiAgICAgICAgICAgIGlmIChzYXZlZExheW91dHMgJiYgQXJyYXkuaXNBcnJheShzYXZlZExheW91dHMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gc2F2ZWRMYXlvdXRzLm1hcCgobGF5b3V0RGF0YSkgPT4gbmV3IExheW91dChsYXlvdXREYXRhKSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2xheWVyc10g0JfQsNCz0YDRg9C20LXQvdC+ICR7dGhpcy5sYXlvdXRzLmxlbmd0aH0g0YHQu9C+0ZHQsmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gW107XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2xheWVyc10g0J3QtdGCINGB0L7RhdGA0LDQvdGR0L3QvdGL0YUg0YHQu9C+0ZHQsicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbbGF5ZXJzXSDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCDRgdC70L7RkdCyOicsIGVycm9yKTtcbiAgICAgICAgICAgIGxvZ0lzc3VlKCdlZGl0b3JfbGF5ZXJzX2xvYWRfZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmxheW91dHMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZUxheWVyc1RvSGlzdG9yeSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGxvYWRTdGF0ZSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3N0YXRlXSDQl9Cw0LPRgNGD0LfQutCwINGB0L7RgdGC0L7Rj9C90LjRjyDRgNC10LTQsNC60YLQvtGA0LAnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvclN0YXRlID0gYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci5sb2FkRWRpdG9yU3RhdGUoKTtcbiAgICAgICAgICAgIGlmICghZWRpdG9yU3RhdGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbc3RhdGVdINCh0L7RhdGA0LDQvdC10L3QvdC+0LUg0YHQvtGB0YLQvtGP0L3QuNC1INC90LUg0L3QsNC50LTQtdC90L4nKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRDb2xvcnNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0U2l6ZXNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuaXNTdGF0ZUV4cGlyZWQoZWRpdG9yU3RhdGUuZGF0ZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tzdGF0ZV0g0KHQvtGB0YLQvtGP0L3QuNC1INGD0YHRgtCw0YDQtdC70L4sINC+0YfQuNGJ0LDQtdC8Jyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci5jbGVhckVkaXRvclN0YXRlKCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRQcm9kdWN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0Q29sb3JzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdFNpemVzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGFwcGxpZWQgPSBhd2FpdCB0aGlzLmFwcGx5U3RhdGUoZWRpdG9yU3RhdGUpO1xuICAgICAgICAgICAgaWYgKGFwcGxpZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbc3RhdGVdINCh0L7RgdGC0L7Rj9C90LjQtSDRg9GB0L/QtdGI0L3QviDQt9Cw0LPRgNGD0LbQtdC90L4nKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm9kdWN0QmxvY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9kdWN0QmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2IoMjIyIDIyMiAyMjIpJztcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUJsb2NrID0gdGhpcy5wcm9kdWN0QmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX3Byb2R1Y3QtYmxvY2tfXycgKyB0aGlzLl9zZWxlY3RUeXBlKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlQmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZExheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRDb2xvcnNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0U2l6ZXNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbc3RhdGVdINCd0LUg0YPQtNCw0LvQvtGB0Ywg0L/RgNC40LzQtdC90LjRgtGMINGB0L7RhdGA0LDQvdC10L3QvdC+0LUg0YHQvtGB0YLQvtGP0L3QuNC1Jyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRQcm9kdWN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0Q29sb3JzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdFNpemVzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCDRgdC+0YHRgtC+0Y/QvdC40Y86JywgZXJyb3IpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdENvbG9yc0xpc3QoKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdFNpemVzTGlzdCgpO1xuICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlzU3RhdGVFeHBpcmVkKGRhdGVTdHJpbmcpIHtcbiAgICAgICAgY29uc3Qgc3RhdGVEYXRlID0gbmV3IERhdGUoZGF0ZVN0cmluZyk7XG4gICAgICAgIGNvbnN0IGV4cGlyYXRpb25EYXRlID0gRGF0ZS5ub3coKSAtIChDT05TVEFOVFMuU1RBVEVfRVhQSVJBVElPTl9EQVlTICogMjQgKiA2MCAqIDYwICogMTAwMCk7XG4gICAgICAgIHJldHVybiBzdGF0ZURhdGUuZ2V0VGltZSgpIDwgZXhwaXJhdGlvbkRhdGU7XG4gICAgfVxuICAgIGFzeW5jIGFwcGx5U3RhdGUoZWRpdG9yU3RhdGUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICghZWRpdG9yU3RhdGUudHlwZSB8fCAhZWRpdG9yU3RhdGUuY29sb3IgfHwgIWVkaXRvclN0YXRlLnNpZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tzdGF0ZV0g0J3QtdC60L7RgNGA0LXQutGC0L3QvtC1INGB0L7RgdGC0L7Rj9C90LjQtTog0L7RgtGB0YPRgtGB0YLQstGD0Y7RgiDQvtCx0Y/Qt9Cw0YLQtdC70YzQvdGL0LUg0L/QvtC70Y8nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbc3RhdGVdINCS0L7RgdGB0YLQsNC90L7QstC70LXQvdC40LUg0YHQvtGB0YLQvtGP0L3QuNGPOiB0eXBlPSR7ZWRpdG9yU3RhdGUudHlwZX0sIGNvbG9yPSR7ZWRpdG9yU3RhdGUuY29sb3J9LCBzaWRlPSR7ZWRpdG9yU3RhdGUuc2lkZX0sIHNpemU9JHtlZGl0b3JTdGF0ZS5zaXplfWApO1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMucHJvZHVjdENvbmZpZ3MuZmluZChwID0+IHAudHlwZSA9PT0gZWRpdG9yU3RhdGUudHlwZSk7XG4gICAgICAgICAgICBpZiAoIXByb2R1Y3QpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtzdGF0ZV0g0J/RgNC+0LTRg9C60YIg0YLQuNC/0LAgJHtlZGl0b3JTdGF0ZS50eXBlfSDQvdC1INC90LDQudC00LXQvWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG1vY2t1cCA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG0gPT4gbS5jb2xvci5uYW1lID09PSBlZGl0b3JTdGF0ZS5jb2xvcik7XG4gICAgICAgICAgICBpZiAoIW1vY2t1cCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW3N0YXRlXSBNb2NrdXAg0YEg0YbQstC10YLQvtC8ICR7ZWRpdG9yU3RhdGUuY29sb3J9INC90LUg0L3QsNC50LTQtdC9INC00LvRjyDQv9GA0L7QtNGD0LrRgtCwICR7ZWRpdG9yU3RhdGUudHlwZX1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RUeXBlID0gZWRpdG9yU3RhdGUudHlwZTtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gbW9ja3VwLmNvbG9yO1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0U2lkZSA9IGVkaXRvclN0YXRlLnNpZGU7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RTaXplID0gZWRpdG9yU3RhdGUuc2l6ZSB8fCB0aGlzLl9zZWxlY3RTaXplO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3N0YXRlXSDQodC+0YHRgtC+0Y/QvdC40LUg0L/RgNC40LzQtdC90LXQvdC+OiB0eXBlPSR7dGhpcy5fc2VsZWN0VHlwZX0sIGNvbG9yPSR7dGhpcy5fc2VsZWN0Q29sb3IubmFtZX0sIHNpZGU9JHt0aGlzLl9zZWxlY3RTaWRlfSwgc2l6ZT0ke3RoaXMuX3NlbGVjdFNpemV9YCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINC/0YDQuNC80LXQvdC10L3QuNGPINGB0L7RgdGC0L7Rj9C90LjRjzonLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0VHlwZSh0eXBlKSB7XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RUeXBlICE9PSB0eXBlKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RUeXBlID0gdHlwZTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJNb2NrdXBDYWNoZSgpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5TVEFURV9DSEFOR0VELCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y86JywgZXJyKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0Q29sb3IoY29sb3IpIHtcbiAgICAgICAgaWYgKCFjb2xvciB8fCAhY29sb3IubmFtZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW0VkaXRvcl0g0J/QvtC/0YvRgtC60LAg0YPRgdGC0LDQvdC+0LLQuNGC0Ywg0L3QtdC60L7RgNGA0LXQutGC0L3Ri9C5INGG0LLQtdGCJywgY29sb3IpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RDb2xvciAhPT0gY29sb3IpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gY29sb3I7XG4gICAgICAgICAgICB0aGlzLmNsZWFyTW9ja3VwQ2FjaGUoKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuU1RBVEVfQ0hBTkdFRCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPOicsIGVycikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldFNpZGUoc2lkZSkge1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0U2lkZSAhPT0gc2lkZSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0U2lkZSA9IHNpZGU7XG4gICAgICAgICAgICB0aGlzLmNsZWFyTW9ja3VwQ2FjaGUoKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuU1RBVEVfQ0hBTkdFRCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPOicsIGVycikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldFNpemUoc2l6ZSkge1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0U2l6ZSAhPT0gc2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0U2l6ZSA9IHNpemU7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLlNUQVRFX0NIQU5HRUQsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbc3RhdGVdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjzonLCBlcnIpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhZGRMYXlvdXQobGF5b3V0KSB7XG4gICAgICAgIGlmICh0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkpIHtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0cy5wdXNoKGxheW91dCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxheW91dHMucHVzaChsYXlvdXQpO1xuICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5MQVlPVVRfQURERUQsIGxheW91dCk7XG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgIHRoaXMuc2F2ZUxheW91dHMoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW2xheWVyc10g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPINGB0LvQvtGR0LI6JywgZXJyKSk7XG4gICAgfVxuICAgIHJlbW92ZUxheW91dChsYXlvdXRJZCkge1xuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMubGF5b3V0cy5maW5kSW5kZXgobCA9PiBsLmlkID09PSBsYXlvdXRJZCk7XG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0c1tpbmRleF07XG4gICAgICAgICAgICBpZiAobGF5b3V0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXlvdXRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTEFZT1VUX1JFTU9WRUQsIGxheW91dElkKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNhdmVMYXlvdXRzKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycikpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdXBkYXRlTGF5b3V0KGxheW91dElkLCB1cGRhdGVzKSB7XG4gICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0cy5maW5kKGwgPT4gbC5pZCA9PT0gbGF5b3V0SWQpO1xuICAgICAgICBpZiAobGF5b3V0KSB7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGxheW91dCwgdXBkYXRlcyk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSkge1xuICAgICAgICAgICAgICAgIGlmICgndXJsJyBpbiB1cGRhdGVzIHx8ICduYW1lJyBpbiB1cGRhdGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2F2ZUxheWVyc1RvSGlzdG9yeSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTEFZT1VUX1VQREFURUQsIGxheW91dCk7XG4gICAgICAgICAgICB0aGlzLnNhdmVMYXlvdXRzKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycikpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBnZXRMYXlvdXQobGF5b3V0SWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0cy5maW5kKGwgPT4gbC5pZCA9PT0gbGF5b3V0SWQpO1xuICAgIH1cbiAgICBnZXRMYXlvdXRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXRzO1xuICAgIH1cbiAgICBpbml0SGlzdG9yeVVuZG9CbG9jaygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnkgYmxvY2tdIGluaXQgdW5kbycpO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2sub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5IHVuZG8gYmxvY2tdIGNsaWNrZWQnKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudW5kbygpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKTtcbiAgICB9XG4gICAgaW5pdEhpc3RvcnlSZWRvQmxvY2soKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5IHJlZG8gYmxvY2tdIGluaXQgcmVkbycpO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2sub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5IHJlZG8gYmxvY2tdIGNsaWNrZWQnKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucmVkbygpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKTtcbiAgICB9XG4gICAgaW5pdFByb2R1Y3RMaXN0KCkge1xuICAgICAgICBpZiAoIXRoaXMucHJvZHVjdExpc3RCbG9jayB8fCAhdGhpcy5wcm9kdWN0SXRlbUJsb2NrKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbUHJvZHVjdExpc3RdIGluaXQgcHJvZHVjdCBsaXN0Jyk7XG4gICAgICAgIHRoaXMucHJvZHVjdEl0ZW1CbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB0aGlzLnByb2R1Y3RDb25maWdzLmZvckVhY2gocHJvZHVjdCA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0SXRlbSA9IHRoaXMucHJvZHVjdEl0ZW1CbG9jay5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBwcm9kdWN0SXRlbS5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RJbWFnZVdyYXBwZXIgPSBwcm9kdWN0SXRlbS5xdWVyeVNlbGVjdG9yKCcucHJvZHVjdC1pdGVtLWltYWdlJyk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdEltYWdlV3JhcHBlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RJbWFnZSA9IGdldExhc3RDaGlsZChwcm9kdWN0SW1hZ2VXcmFwcGVyKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvZHVjdEltYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RJbWFnZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBgdXJsKCR7cHJvZHVjdC5tb2NrdXBzWzBdPy51cmx9KWA7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RJbWFnZS5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9ICdjb3Zlcic7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RJbWFnZS5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb24gPSAnY2VudGVyJztcbiAgICAgICAgICAgICAgICAgICAgcHJvZHVjdEltYWdlLnN0eWxlLmJhY2tncm91bmRSZXBlYXQgPSAnbm8tcmVwZWF0JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0VGV4dFdyYXBwZXIgPSBwcm9kdWN0SXRlbS5xdWVyeVNlbGVjdG9yKCcucHJvZHVjdC1pdGVtLXRleHQnKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0VGV4dFdyYXBwZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0VGV4dCA9IGdldExhc3RDaGlsZChwcm9kdWN0VGV4dFdyYXBwZXIpO1xuICAgICAgICAgICAgICAgIGlmIChwcm9kdWN0VGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9kdWN0VGV4dC5pbm5lclRleHQgPSBwcm9kdWN0LnByb2R1Y3ROYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RCbG9jayA9IHByb2R1Y3RJdGVtLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgcHJvZHVjdEJsb2NrLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1zZXR0aW5nc19fcHJvZHVjdC1ibG9ja19fJyArIHByb2R1Y3QudHlwZSk7XG4gICAgICAgICAgICBwcm9kdWN0QmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgcHJvZHVjdEJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgICAgICAgICAgIHByb2R1Y3RJdGVtLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNoYW5nZVByb2R1Y3QocHJvZHVjdC50eXBlKTtcbiAgICAgICAgICAgIHRoaXMucHJvZHVjdEJsb2Nrcy5wdXNoKHByb2R1Y3RCbG9jayk7XG4gICAgICAgICAgICB0aGlzLnByb2R1Y3RMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuYXBwZW5kQ2hpbGQocHJvZHVjdEl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMucHJvZHVjdEJsb2Nrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnByb2R1Y3RCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICAgICAgYmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2IoMjIyIDIyMiAyMjIpJztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLnByb2R1Y3RCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fcHJvZHVjdC1ibG9ja19fJyArIHRoaXMuX3NlbGVjdFR5cGUpKTtcbiAgICAgICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgICAgIGFjdGl2ZUJsb2NrLnN0eWxlLmJhY2tncm91bmQgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0Q29sb3JzTGlzdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckNvbG9yc0xpc3RCbG9jayB8fCAhdGhpcy5lZGl0b3JDb2xvckl0ZW1CbG9jaylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBpbml0IGNvbG9ycyBmb3IgJHt0aGlzLl9zZWxlY3RUeXBlfWApO1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuZWRpdG9yQ29sb3JJdGVtQmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgY29uc3QgY29sb3JzQ29udGFpbmVyID0gdGhpcy5lZGl0b3JDb2xvcnNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgIGNvbG9yc0NvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgdGhpcy5jb2xvckJsb2NrcyA9IFtdO1xuICAgICAgICBjb25zdCBjb2xvcnMgPSBwcm9kdWN0Lm1vY2t1cHNcbiAgICAgICAgICAgIC5maWx0ZXIobW9ja3VwID0+IG1vY2t1cC5zaWRlID09PSB0aGlzLl9zZWxlY3RTaWRlKVxuICAgICAgICAgICAgLm1hcChtb2NrdXAgPT4gbW9ja3VwLmNvbG9yKTtcbiAgICAgICAgY29sb3JzLmZvckVhY2goY29sb3IgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29sb3JJdGVtID0gdGhpcy5lZGl0b3JDb2xvckl0ZW1CbG9jay5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBjb2xvckl0ZW0uc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICBjb25zdCBjb2xvckJsb2NrID0gY29sb3JJdGVtLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgY29sb3JCbG9jay5jbGFzc0xpc3QuYWRkKCdlZGl0b3Itc2V0dGluZ3NfX2NvbG9yLWJsb2NrX18nICsgY29sb3IubmFtZSk7XG4gICAgICAgICAgICBjb2xvckJsb2NrLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIGNvbG9yQmxvY2suc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3IuaGV4O1xuICAgICAgICAgICAgY29sb3JCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgICAgICAgICBjb2xvckl0ZW0ub25jbGljayA9ICgpID0+IHRoaXMuY2hhbmdlQ29sb3IoY29sb3IubmFtZSk7XG4gICAgICAgICAgICB0aGlzLmNvbG9yQmxvY2tzLnB1c2goY29sb3JCbG9jayk7XG4gICAgICAgICAgICB0aGlzLmVkaXRvckNvbG9yc0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5hcHBlbmRDaGlsZChjb2xvckl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuY29sb3JCbG9ja3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5jb2xvckJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgICAgICBibG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLmNvbG9yQmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX2NvbG9yLWJsb2NrX18nICsgdGhpcy5fc2VsZWN0Q29sb3IubmFtZSkpO1xuICAgICAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgYWN0aXZlQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0U2l6ZXNMaXN0KCkge1xuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yU2l6ZXNMaXN0QmxvY2sgfHwgIXRoaXMuZWRpdG9yU2l6ZUl0ZW1CbG9jaylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBpbml0IHNpemVzIGZvciAke3RoaXMuX3NlbGVjdFR5cGV9YCk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdCB8fCAhcHJvZHVjdC5zaXplcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5lZGl0b3JTaXplSXRlbUJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGNvbnN0IHNpemVzQ29udGFpbmVyID0gdGhpcy5lZGl0b3JTaXplc0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgc2l6ZXNDb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIHRoaXMuc2l6ZUJsb2NrcyA9IFtdO1xuICAgICAgICBwcm9kdWN0LnNpemVzLmZvckVhY2goc2l6ZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzaXplSXRlbSA9IHRoaXMuZWRpdG9yU2l6ZUl0ZW1CbG9jay5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBzaXplSXRlbS5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIHNpemVJdGVtLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHNpemVJdGVtLnN0eWxlLnVzZXJTZWxlY3QgPSAnbm9uZSc7XG4gICAgICAgICAgICBzaXplSXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0b3Itc2V0dGluZ3NfX3NpemUtYmxvY2tfXycgKyBzaXplKTtcbiAgICAgICAgICAgIGNvbnN0IGJvcmRlckJsb2NrID0gc2l6ZUl0ZW0uZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBib3JkZXJCbG9jay5zdHlsZS5zZXRQcm9wZXJ0eSgnLS10Mzk2LWJvcmRlcmNvbG9yJywgJyNmM2YzZjMnKTtcbiAgICAgICAgICAgIGNvbnN0IHNpemVUZXh0ID0gZ2V0TGFzdENoaWxkKHNpemVJdGVtKTtcbiAgICAgICAgICAgIGlmIChzaXplVGV4dCkge1xuICAgICAgICAgICAgICAgIHNpemVUZXh0LmlubmVyVGV4dCA9IHNpemU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzaXplSXRlbS5vbmNsaWNrID0gKCkgPT4gdGhpcy5jaGFuZ2VTaXplKHNpemUpO1xuICAgICAgICAgICAgdGhpcy5zaXplQmxvY2tzLnB1c2goc2l6ZUl0ZW0pO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JTaXplc0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5hcHBlbmRDaGlsZChzaXplSXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5zaXplQmxvY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuc2l6ZUJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBib3JkZXJCbG9jayA9IGJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgIGlmIChib3JkZXJCbG9jaykge1xuICAgICAgICAgICAgICAgICAgICBib3JkZXJCbG9jay5zdHlsZS5zZXRQcm9wZXJ0eSgnLS10Mzk2LWJvcmRlcmNvbG9yJywgJyNmM2YzZjMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUJsb2NrID0gdGhpcy5zaXplQmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX3NpemUtYmxvY2tfXycgKyB0aGlzLl9zZWxlY3RTaXplKSk7XG4gICAgICAgICAgICBpZiAoYWN0aXZlQmxvY2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBib3JkZXJCbG9jayA9IGFjdGl2ZUJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgIGlmIChib3JkZXJCbG9jaykge1xuICAgICAgICAgICAgICAgICAgICBib3JkZXJCbG9jay5zdHlsZS5zZXRQcm9wZXJ0eSgnLS10Mzk2LWJvcmRlcmNvbG9yJywgJycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBzaG93TGF5b3V0TGlzdCgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3NldHRpbmdzXSBbbGF5b3V0c10gc2hvdyBsYXlvdXRzIGxpc3QnKTtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9jaykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIltzZXR0aW5nc10gW2xheW91dHNdIGVkaXRvckxheW91dEl0ZW1CbG9jayBpcyBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2spIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbc2V0dGluZ3NdIFtsYXlvdXRzXSBlZGl0b3JMYXlvdXRzTGlzdEJsb2NrIGlzIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gW2xheW91dHNdIGxheW91dHMgbGlzdCBibG9jayBjaGlsZHJlbjogJHt0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuY2hpbGRyZW4ubGVuZ3RofWApO1xuICAgICAgICB0aGlzLmxheW91dHMuZm9yRWFjaChsYXlvdXQgPT4ge1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0SXRlbSA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIGxheW91dEl0ZW0uc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICBjb25zdCBpc0VkaXRpbmcgPSB0aGlzLl9zZWxlY3RMYXlvdXQgPT09IGxheW91dC5pZDtcbiAgICAgICAgICAgIGNvbnN0IHByZXZpZXdCbG9jayA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrVmlld0NsYXNzXG4gICAgICAgICAgICAgICAgPyBsYXlvdXRJdGVtLnF1ZXJ5U2VsZWN0b3IodGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tWaWV3Q2xhc3MpXG4gICAgICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgbmFtZUJsb2NrID0gdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tOYW1lQ2xhc3NcbiAgICAgICAgICAgICAgICA/IGxheW91dEl0ZW0ucXVlcnlTZWxlY3Rvcih0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja05hbWVDbGFzcylcbiAgICAgICAgICAgICAgICA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCByZW1vdmVCbG9jayA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrUmVtb3ZlQ2xhc3NcbiAgICAgICAgICAgICAgICA/IGxheW91dEl0ZW0ucXVlcnlTZWxlY3Rvcih0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja1JlbW92ZUNsYXNzKVxuICAgICAgICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRCbG9jayA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrRWRpdENsYXNzXG4gICAgICAgICAgICAgICAgPyBsYXlvdXRJdGVtLnF1ZXJ5U2VsZWN0b3IodGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tFZGl0Q2xhc3MpXG4gICAgICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICAgICAgaWYgKHByZXZpZXdCbG9jaykge1xuICAgICAgICAgICAgICAgIGlmIChsYXlvdXQuaXNJbWFnZUxheW91dCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZXZpZXdFbGVtZW50ID0gcHJldmlld0Jsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJldmlld0VsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IGB1cmwoJHtsYXlvdXQudXJsfSlgO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlld0VsZW1lbnQuc3R5bGUuYmFja2dyb3VuZFNpemUgPSAnY29udGFpbic7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3RWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb24gPSAnY2VudGVyJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJhY2tncm91bmRSZXBlYXQgPSAnbm8tcmVwZWF0JztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNFZGl0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3RWxlbWVudC5zdHlsZS5ib3JkZXJDb2xvciA9ICdyZ2IoMjU0LCA5NCwgNTgpJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJvcmRlckNvbG9yID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobGF5b3V0LnR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuYW1lQmxvY2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lRWxlbWVudCA9IG5hbWVCbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgICAgICBpZiAobmFtZUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxheW91dC50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwbGF5TmFtZSA9ICFsYXlvdXQubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gXCLQmNC30L7QsdGA0LDQttC10L3QuNC1XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGxheW91dC5uYW1lLmluY2x1ZGVzKFwiXFxuXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbGF5b3V0Lm5hbWUuc3BsaXQoXCJcXG5cIilbMF0gKyBcIi4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbGF5b3V0Lm5hbWUubGVuZ3RoID4gNDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbGF5b3V0Lm5hbWUuc2xpY2UoMCwgNDApICsgXCIuLi5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBsYXlvdXQubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVFbGVtZW50LmlubmVyVGV4dCA9IGRpc3BsYXlOYW1lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGxheW91dC50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVFbGVtZW50LmlubmVyVGV4dCA9IGxheW91dC5uYW1lIHx8IFwi0KLQtdC60YHRglwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlbW92ZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlQmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgICAgIHJlbW92ZUJsb2NrLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTGF5b3V0KGxheW91dC5pZCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzRWRpdGluZylcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FuY2VsRWRpdExheW91dCgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5yZXN0b3JlSWNvbkZyb21EYXRhT3JpZ2luYWwocmVtb3ZlQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVkaXRCbG9jaykge1xuICAgICAgICAgICAgICAgIGlmIChpc0VkaXRpbmcgfHwgbGF5b3V0LmlkID09PSBcInN0YXJ0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdEJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlZGl0QmxvY2suc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVkaXRCbG9jay5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICAgICAgZWRpdEJsb2NrLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmVkaXRMYXlvdXQobGF5b3V0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3RvcmVJY29uRnJvbURhdGFPcmlnaW5hbChnZXRMYXN0Q2hpbGQoZWRpdEJsb2NrKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuYXBwZW5kQ2hpbGQobGF5b3V0SXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSBsYXlvdXRzIHNob3duOiAke3RoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5jaGlsZHJlbi5sZW5ndGh9YCk7XG4gICAgfVxuICAgIGluaXRBZGRPcmRlckJ1dHRvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgdGhpcy5ldmVudHMub24oRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCAoaXNMb2FkaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbikge1xuICAgICAgICAgICAgICAgIGlmIChpc0xvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzAuNSc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24uc3R5bGUuY3Vyc29yID0gJ25vdC1hbGxvd2VkJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCa0L3QvtC/0LrQsCDQt9Cw0LHQu9C+0LrQuNGA0L7QstCw0L3QsCAo0LjQtNC10YIg0LPQtdC90LXRgNCw0YbQuNGPKScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCa0L3QvtC/0LrQsCDRgNCw0LfQsdC70L7QutC40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNBZGRpbmdUb0NhcnQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tvcmRlcl0g0J/RgNC+0YbQtdGB0YEg0LTQvtCx0LDQstC70LXQvdC40Y8g0YPQttC1INC40LTQtdGCLCDQuNCz0L3QvtGA0LjRgNGD0LXQvCDQv9C+0LLRgtC+0YDQvdC+0LUg0L3QsNC20LDRgtC40LUnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5nZXRTdW0oKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGFsZXJ0KCfQlNC70Y8g0LTQvtCx0LDQstC70LXQvdC40Y8g0LfQsNC60LDQt9CwINC/0YDQvtC00YPQutGCINC90LUg0LzQvtC20LXRgiDQsdGL0YLRjCDQv9GD0YHRgtGL0LwnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5sYXlvdXRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGFsZXJ0KCfQn9C+0LbQsNC70YPQudGB0YLQsCwg0LTQvtC20LTQuNGC0LXRgdGMINC30LDQstC10YDRiNC10L3QuNGPINCz0LXQvdC10YDQsNGG0LjQuCDQtNC40LfQsNC50L3QsCcpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW29yZGVyXSDQn9C+0L/Ri9GC0LrQsCDQtNC+0LHQsNCy0LjRgtGMINCyINC60L7RgNC30LjQvdGDINCx0LXQtyDQtNC40LfQsNC50L3QsCcpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBidXR0b25UZXh0RWxlbWVudCA9IHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24/LnF1ZXJ5U2VsZWN0b3IoJy50bi1hdG9tJyk7XG4gICAgICAgICAgICBpZiAoIWJ1dHRvblRleHRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgYnV0dG9uVGV4dEVsZW1lbnQgPSB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uPy5xdWVyeVNlbGVjdG9yKCdkaXYsIHNwYW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsVGV4dCA9IGJ1dHRvblRleHRFbGVtZW50Py50ZXh0Q29udGVudD8udHJpbSgpIHx8ICfQlNC+0LHQsNCy0LjRgtGMINCyINC60L7RgNC30LjQvdGDJztcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0FkZGluZ1RvQ2FydCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRBZGRUb0NhcnRCdXR0b25Mb2FkaW5nKHRydWUsICfQlNC+0LHQsNCy0LvQtdC90LjQtS4uLicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFydGljbGUgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoOTk5OTk5OTkgLSA5OTk5OTkgKyAxKSkgKyA5OTk5OTk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQndCw0YfQsNC70L4g0YHQvtC30LTQsNC90LjRjyDQt9Cw0LrQsNC30LAnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBleHBvcnRlZEFydCA9IGF3YWl0IHRoaXMuZXhwb3J0QXJ0KHRydWUsIDUxMik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQrdC60YHQv9C+0YDRgiDQtNC40LfQsNC50L3QsCDQt9Cw0LLQtdGA0YjQtdC9OicsIE9iamVjdC5rZXlzKGV4cG9ydGVkQXJ0KSk7XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKGV4cG9ydGVkQXJ0KS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ9Ce0YjQuNCx0LrQsDog0L3QtSDRg9C00LDQu9C+0YHRjCDRjdC60YHQv9C+0YDRgtC40YDQvtCy0LDRgtGMINC00LjQt9Cw0LnQvS4g0J/QvtC/0YDQvtCx0YPQudGC0LUg0LXRidC1INGA0LDQty4nKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW29yZGVyXSDQrdC60YHQv9C+0YDRgiDQstC10YDQvdGD0Lsg0L/Rg9GB0YLQvtC5INGA0LXQt9GD0LvRjNGC0LDRgicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHNpZGVzID0gT2JqZWN0LmtleXMoZXhwb3J0ZWRBcnQpLm1hcChzaWRlID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIGltYWdlX3VybDogZXhwb3J0ZWRBcnRbc2lkZV0gfHwgJycsXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0JfQsNCz0YDRg9C30LrQsCDQuNC30L7QsdGA0LDQttC10L3QuNC5INC90LAg0YHQtdGA0LLQtdGALi4uJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgdXBsb2FkUHJvbWlzZXMgPSBzaWRlcy5tYXAoYXN5bmMgKHNpZGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmFzZTY0ID0gc2lkZS5pbWFnZV91cmwuc3BsaXQoJywnKVsxXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXBsb2FkZWRVcmwgPSBhd2FpdCB0aGlzLnVwbG9hZEltYWdlVG9TZXJ2ZXIoYmFzZTY0KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgc2lkZSwgdXBsb2FkZWRVcmwgfTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCB1cGxvYWRlZFNpZGVzID0gYXdhaXQgUHJvbWlzZS5hbGwodXBsb2FkUHJvbWlzZXMpO1xuICAgICAgICAgICAgICAgIHVwbG9hZGVkU2lkZXMuZm9yRWFjaCgoeyBzaWRlLCB1cGxvYWRlZFVybCB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNpZGUuaW1hZ2VfdXJsID0gdXBsb2FkZWRVcmw7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQmNC30L7QsdGA0LDQttC10L3QuNGPINC30LDQs9GA0YPQttC10L3RiyDQvdCwINGB0LXRgNCy0LXRgCcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3ROYW1lID0gYCR7dGhpcy5jYXBpdGFsaXplRmlyc3RMZXR0ZXIodGhpcy5nZXRQcm9kdWN0TmFtZSgpKX0g0YEg0LLQsNGI0LjQvCAke09iamVjdC5rZXlzKGV4cG9ydGVkQXJ0KS5sZW5ndGggPT0gMSA/ICfQvtC00L3QvtGB0YLQvtGA0L7QvdC90LjQvCcgOiAn0LTQstGD0YXRgdGC0L7RgNC+0L3QvdC40LwnfSDQv9GA0LjQvdGC0L7QvGA7XG4gICAgICAgICAgICAgICAgY29uc3QgbGF5b3V0cyA9IHRoaXMubGF5b3V0cy5tYXAobGF5b3V0ID0+ICh7IC4uLmxheW91dCwgdXJsOiB1bmRlZmluZWQgfSkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJJZCA9IGF3YWl0IHRoaXMuc3RvcmFnZU1hbmFnZXIuZ2V0VXNlcklkKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoXCJsYXlvdXRzXCIsIEpTT04uc3RyaW5naWZ5KGxheW91dHMpKTtcbiAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoXCJ1c2VyX2lkXCIsIHVzZXJJZCk7XG4gICAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKFwiYXJ0XCIsIGFydGljbGUudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgZmV0Y2godGhpcy5hcGlDb25maWcud2ViaG9va0NhcnQsIHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgICAgICAgICAgYm9keTogZm9ybURhdGFcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjcmVhdGVQcm9kdWN0KHtcbiAgICAgICAgICAgICAgICAgICAgcXVhbnRpdHk6IHRoaXMuZ2V0UXVhbnRpdHkoKSxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogcHJvZHVjdE5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHNpemU6IHRoaXMuX3NlbGVjdFNpemUsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiB0aGlzLl9zZWxlY3RDb2xvcixcbiAgICAgICAgICAgICAgICAgICAgc2lkZXMsXG4gICAgICAgICAgICAgICAgICAgIGFydGljbGUsXG4gICAgICAgICAgICAgICAgICAgIHByaWNlOiB0aGlzLmdldFN1bSgpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNBZGRlZFRvQ2FydCA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQl9Cw0LrQsNC3INGD0YHQv9C10YjQvdC+INGB0L7Qt9C00LDQvScpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyhmYWxzZSwgJ+KckyDQlNC+0LHQsNCy0LvQtdC90L4hJyk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyhmYWxzZSwgb3JpZ2luYWxUZXh0KTtcbiAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tvcmRlcl0g0J7RiNC40LHQutCwINGB0L7Qt9C00LDQvdC40Y8g0LfQsNC60LDQt9CwOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBsb2dJc3N1ZSgnb3JkZXJfY3JlYXRpb25fZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RUeXBlOiB0aGlzLl9zZWxlY3RUeXBlLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiB0aGlzLl9zZWxlY3RTaXplLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXJzQ291bnQ6IHRoaXMubGF5b3V0cy5sZW5ndGhcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBhbGVydCgn0J7RiNC40LHQutCwINC/0YDQuCDRgdC+0LfQtNCw0L3QuNC4INC30LDQutCw0LfQsCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyhmYWxzZSwgb3JpZ2luYWxUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzQWRkaW5nVG9DYXJ0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0KTQu9Cw0LMgaXNBZGRpbmdUb0NhcnQg0YHQsdGA0L7RiNC10L0nKTtcbiAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyhpc0xvYWRpbmcsIHRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmluamVjdFB1bHNlQW5pbWF0aW9uKCk7XG4gICAgICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b247XG4gICAgICAgIGxldCBidXR0b25UZXh0RWxlbWVudCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCcudG4tYXRvbScpO1xuICAgICAgICBpZiAoIWJ1dHRvblRleHRFbGVtZW50KSB7XG4gICAgICAgICAgICBidXR0b25UZXh0RWxlbWVudCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdkaXYsIHNwYW4nKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZXh0VGFyZ2V0ID0gYnV0dG9uVGV4dEVsZW1lbnQgfHwgYnV0dG9uO1xuICAgICAgICBpZiAoaXNMb2FkaW5nKSB7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9ICcwLjcnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmN1cnNvciA9ICdub3QtYWxsb3dlZCc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICAgICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgdGV4dFRhcmdldC50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuYW5pbWF0aW9uID0gJ2NhcnRCdXR0b25QdWxzZSAxLjVzIGVhc2UtaW4tb3V0IGluZmluaXRlJztcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0gW2FuaW1hdGlvbl0g0JrQvdC+0L/QutCwINC30LDQsdC70L7QutC40YDQvtCy0LDQvdCwOicsIHRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuYW5pbWF0aW9uID0gJ25vbmUnO1xuICAgICAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgICAgICB0ZXh0VGFyZ2V0LnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0gW2FuaW1hdGlvbl0g0JrQvdC+0L/QutCwINGA0LDQt9Cx0LvQvtC60LjRgNC+0LLQsNC90LA6JywgdGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5qZWN0UHVsc2VBbmltYXRpb24oKSB7XG4gICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FydC1idXR0b24tcHVsc2UtYW5pbWF0aW9uJykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgIHN0eWxlLmlkID0gJ2NhcnQtYnV0dG9uLXB1bHNlLWFuaW1hdGlvbic7XG4gICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gYFxuICAgICAgICAgICAgQGtleWZyYW1lcyBjYXJ0QnV0dG9uUHVsc2Uge1xuICAgICAgICAgICAgICAgIDAlLCAxMDAlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBzY2FsZSgxKTtcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMC43O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA1MCUge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMDIpO1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLjg1O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgYDtcbiAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1thbmltYXRpb25dIENTUyDQsNC90LjQvNCw0YbQuNGPINC/0YPQu9GM0YHQsNGG0LjQuCDQtNC+0LHQsNCy0LvQtdC90LAnKTtcbiAgICB9XG4gICAgc2V0R2VuZXJhdGVCdXR0b25Mb2FkaW5nKGlzTG9hZGluZywgdGV4dCkge1xuICAgICAgICBpZiAoIXRoaXMuZm9ybUJ1dHRvbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5pbmplY3RQdWxzZUFuaW1hdGlvbigpO1xuICAgICAgICBjb25zdCBidXR0b24gPSB0aGlzLmZvcm1CdXR0b247XG4gICAgICAgIGxldCBidXR0b25UZXh0RWxlbWVudCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCcudG4tYXRvbScpO1xuICAgICAgICBpZiAoIWJ1dHRvblRleHRFbGVtZW50KSB7XG4gICAgICAgICAgICBidXR0b25UZXh0RWxlbWVudCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdkaXYsIHNwYW4nKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZXh0VGFyZ2V0ID0gYnV0dG9uVGV4dEVsZW1lbnQgfHwgYnV0dG9uO1xuICAgICAgICBpZiAoaXNMb2FkaW5nKSB7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9ICcwLjcnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmN1cnNvciA9ICdub3QtYWxsb3dlZCc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICAgICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgdGV4dFRhcmdldC50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuYW5pbWF0aW9uID0gJ2NhcnRCdXR0b25QdWxzZSAxLjVzIGVhc2UtaW4tb3V0IGluZmluaXRlJztcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tnZW5lcmF0ZV0gW2FuaW1hdGlvbl0g0JrQvdC+0L/QutCwINC30LDQsdC70L7QutC40YDQvtCy0LDQvdCwOicsIHRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuYW5pbWF0aW9uID0gJ25vbmUnO1xuICAgICAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgICAgICB0ZXh0VGFyZ2V0LnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tnZW5lcmF0ZV0gW2FuaW1hdGlvbl0g0JrQvdC+0L/QutCwINGA0LDQt9Cx0LvQvtC60LjRgNC+0LLQsNC90LA6JywgdGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0Q29udHJvbHNEaXNhYmxlZChkaXNhYmxlZCkge1xuICAgICAgICBjb25zdCBvcGFjaXR5ID0gZGlzYWJsZWQgPyAnMC41JyA6ICcxJztcbiAgICAgICAgY29uc3QgcG9pbnRlckV2ZW50cyA9IGRpc2FibGVkID8gJ25vbmUnIDogJ2F1dG8nO1xuICAgICAgICBjb25zdCBjdXJzb3IgPSBkaXNhYmxlZCA/ICdub3QtYWxsb3dlZCcgOiAncG9pbnRlcic7XG4gICAgICAgIGlmICh0aGlzLmNoYW5nZVNpZGVCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlU2lkZUJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gb3BhY2l0eTtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlU2lkZUJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gcG9pbnRlckV2ZW50cztcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlU2lkZUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSBjdXJzb3I7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb2xvckJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IGJsb2NrLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcGFyZW50LnN0eWxlLm9wYWNpdHkgPSBvcGFjaXR5O1xuICAgICAgICAgICAgICAgIHBhcmVudC5zdHlsZS5wb2ludGVyRXZlbnRzID0gcG9pbnRlckV2ZW50cztcbiAgICAgICAgICAgICAgICBwYXJlbnQuc3R5bGUuY3Vyc29yID0gY3Vyc29yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5wcm9kdWN0QmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gYmxvY2sucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnQuc3R5bGUub3BhY2l0eSA9IG9wYWNpdHk7XG4gICAgICAgICAgICAgICAgcGFyZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPSBwb2ludGVyRXZlbnRzO1xuICAgICAgICAgICAgICAgIHBhcmVudC5zdHlsZS5jdXJzb3IgPSBjdXJzb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbY29udHJvbHNdINCt0LvQtdC80LXQvdGC0Ysg0YPQv9GA0LDQstC70LXQvdC40Y8gJHtkaXNhYmxlZCA/ICfQt9Cw0LHQu9C+0LrQuNGA0L7QstCw0L3RiycgOiAn0YDQsNC30LHQu9C+0LrQuNGA0L7QstCw0L3Riyd9YCk7XG4gICAgfVxuICAgIGluaXRVcGxvYWRJbWFnZUJ1dHRvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvclVwbG9hZEltYWdlQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnJlc2V0VXNlclVwbG9hZEltYWdlKCk7XG4gICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmVkaXRvclVwbG9hZEltYWdlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGxvYWRVc2VySW1hZ2UoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGluaXRGaXhRdWFudGl0eUZvcm0oKSB7XG4gICAgICAgIGlmICghdGhpcy5xdWFudGl0eUZvcm1CbG9jaylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZm9ybSA9IHRoaXMucXVhbnRpdHlGb3JtQmxvY2sucXVlcnlTZWxlY3RvcignZm9ybScpO1xuICAgICAgICBjb25zdCBpbnB1dCA9IGZvcm0/LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJxdWFudGl0eVwiXScpO1xuICAgICAgICBpZiAoIWlucHV0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB2YWxpZGF0ZVF1YW50aXR5ID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBpbnB1dC52YWx1ZS50cmltKCk7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09ICcnIHx8IGlzTmFOKE51bWJlcih2YWx1ZSkpKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQudmFsdWUgPSAnMSc7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcXVhbnRpdHkgPSBwYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgICAgaWYgKHF1YW50aXR5IDwgMSB8fCBxdWFudGl0eSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlucHV0LnZhbHVlID0gJzEnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIHZhbGlkYXRlUXVhbnRpdHkpO1xuICAgICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgdmFsaWRhdGVRdWFudGl0eSk7XG4gICAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHZhbGlkYXRlUXVhbnRpdHkpO1xuICAgICAgICB2YWxpZGF0ZVF1YW50aXR5KCk7XG4gICAgfVxuICAgIGFzeW5jIGluaXRGb3JtKCkge1xuICAgICAgICBpZiAoIXRoaXMuZm9ybUJsb2NrIHx8ICF0aGlzLmZvcm1CdXR0b24gfHwgIXRoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBmb3JtQmxvY2sgPSB0aGlzLmZvcm1CbG9jaztcbiAgICAgICAgY29uc3QgZm9ybUlucHV0VmFyaWFibGVOYW1lID0gdGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWU7XG4gICAgICAgIGNvbnN0IGZvcm1CdXR0b24gPSB0aGlzLmZvcm1CdXR0b247XG4gICAgICAgIGNvbnN0IGhhbmRsZUNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtidXR0b25dIGNsaWNrZWQnKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzR2VuZXJhdGluZykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dINCT0LXQvdC10YDQsNGG0LjRjyDRg9C20LUg0LjQtNC10YIsINC40LPQvdC+0YDQuNGA0YPQtdC8INC/0L7QstGC0L7RgNC90L7QtSDQvdCw0LbQsNGC0LjQtScpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGZvcm1JbnB1dCA9IGZvcm1CbG9jay5xdWVyeVNlbGVjdG9yKGBbbmFtZT1cIiR7Zm9ybUlucHV0VmFyaWFibGVOYW1lfVwiXWApO1xuICAgICAgICAgICAgY29uc3QgcHJvbXB0ID0gZm9ybUlucHV0LnZhbHVlO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmxvYWRlZFVzZXJJbWFnZSkge1xuICAgICAgICAgICAgICAgIGlmICghcHJvbXB0IHx8IHByb21wdC50cmltKCkgPT09IFwiXCIgfHwgcHJvbXB0Lmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW2lucHV0XSBwcm9tcHQgaXMgZW1wdHkgb3IgdG9vIHNob3J0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwi0JzQuNC90LjQvNCw0LvRjNC90LDRjyDQtNC70LjQvdCwINC30LDQv9GA0L7RgdCwIDEg0YHQuNC80LLQvtC7XCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtpbnB1dF0gcHJvbXB0OiAke3Byb21wdH1gKTtcbiAgICAgICAgICAgIHRoaXMuaXNHZW5lcmF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc2V0R2VuZXJhdGVCdXR0b25Mb2FkaW5nKHRydWUsICfQk9C10L3QtdGA0LDRhtC40Y8uLi4nKTtcbiAgICAgICAgICAgIHRoaXMuc2V0Q29udHJvbHNEaXNhYmxlZCh0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIHRydWUpO1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0SWQgPSB0aGlzLl9zZWxlY3RMYXlvdXQgfHwgTGF5b3V0LmdlbmVyYXRlSWQoKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9zZWxlY3RDb2xvciB8fCAhdGhpcy5fc2VsZWN0Q29sb3IubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ9Cm0LLQtdGCINC90LUg0L7Qv9GA0LXQtNC10LvQtdC9LiDQn9C+0LbQsNC70YPQudGB0YLQsCwg0LLRi9Cx0LXRgNC40YLQtSDRhtCy0LXRgiDRgtC+0LLQsNGA0LAuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHVybCA9IGF3YWl0IGdlbmVyYXRlSW1hZ2Uoe1xuICAgICAgICAgICAgICAgICAgICB1cmk6IHRoaXMuYXBpQ29uZmlnLndlYmhvb2tSZXF1ZXN0LFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQsXG4gICAgICAgICAgICAgICAgICAgIHNoaXJ0Q29sb3I6IHRoaXMuX3NlbGVjdENvbG9yLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGltYWdlOiB0aGlzLl9zZWxlY3RMYXlvdXQgPyB0aGlzLmxvYWRlZFVzZXJJbWFnZSAhPT0gdGhpcy5sYXlvdXRzLmZpbmQobGF5b3V0ID0+IGxheW91dC5pZCA9PT0gdGhpcy5fc2VsZWN0TGF5b3V0KT8udXJsID8gdGhpcy5sb2FkZWRVc2VySW1hZ2UgOiBudWxsIDogdGhpcy5sb2FkZWRVc2VySW1hZ2UsXG4gICAgICAgICAgICAgICAgICAgIHdpdGhBaTogdGhpcy5lZGl0b3JMb2FkV2l0aEFpLFxuICAgICAgICAgICAgICAgICAgICBsYXlvdXRJZCxcbiAgICAgICAgICAgICAgICAgICAgaXNOZXc6IHRoaXMuX3NlbGVjdExheW91dCA/IGZhbHNlIDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogIXRoaXMuZWRpdG9yUmVtb3ZlQmFja2dyb3VuZCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cueW0oMTAzMjc5MjE0LCAncmVhY2hHb2FsJywgJ2dlbmVyYXRlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHsgfVxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbWFnZURhdGEgPSBhd2FpdCB0aGlzLmdldEltYWdlRGF0YSh1cmwpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbaW5wdXRdIGltYWdlIGRhdGEgcmVjZWl2ZWRgKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc2VsZWN0TGF5b3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0cy5maW5kKGxheW91dCA9PiBsYXlvdXQuaWQgPT09IGxheW91dElkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxheW91dCAmJiBsYXlvdXQuaXNJbWFnZUxheW91dCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW2lucHV0XSB1cGRhdGluZyBsYXlvdXQ6ICR7bGF5b3V0LmlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGF5b3V0Lm5hbWUgPSBwcm9tcHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXlvdXQudXJsID0gaW1hZ2VEYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtpbnB1dF0gbGF5b3V0IHVwZGF0ZWRgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5pc1Jlc3RvcmluZ0Zyb21IaXN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNhdmVMYXlvdXRzKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycikpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZExheW91dChMYXlvdXQuY3JlYXRlSW1hZ2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGxheW91dElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmlldzogdGhpcy5fc2VsZWN0U2lkZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogaW1hZ2VEYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcHJvbXB0LFxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHsgeDogMCwgeTogMCB9LFxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RMYXlvdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC52YWx1ZSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW5jZWxFZGl0TGF5b3V0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldFVzZXJVcGxvYWRJbWFnZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEdlbmVyYXRlQnV0dG9uTG9hZGluZyhmYWxzZSwgJ+KckyDQk9C+0YLQvtCy0L4hJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRDb250cm9sc0Rpc2FibGVkKGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRHZW5lcmF0ZUJ1dHRvbkxvYWRpbmcoZmFsc2UsICfQodCz0LXQvdC10YDQuNGA0L7QstCw0YLRjCcpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzR2VuZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0g0KTQu9Cw0LMgaXNHZW5lcmF0aW5nINGB0LHRgNC+0YjQtdC9Jyk7XG4gICAgICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBsb2dJc3N1ZSgnaW1hZ2VfZ2VuZXJhdGlvbl9lcnJvcicsIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBwcm9tcHQsXG4gICAgICAgICAgICAgICAgICAgIHNoaXJ0Q29sb3I6IHRoaXMuX3NlbGVjdENvbG9yPy5uYW1lIHx8ICd1bmtub3duJyxcbiAgICAgICAgICAgICAgICAgICAgd2l0aEFpOiB0aGlzLmVkaXRvckxvYWRXaXRoQWksXG4gICAgICAgICAgICAgICAgICAgIGlzRWRpdGluZzogISF0aGlzLl9zZWxlY3RMYXlvdXRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2Zvcm1dIFtpbnB1dF0gZXJyb3InLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgYWxlcnQoXCLQntGI0LjQsdC60LAg0L/RgNC4INCz0LXQvdC10YDQsNGG0LjQuCDQuNC30L7QsdGA0LDQttC10L3QuNGPXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0R2VuZXJhdGVCdXR0b25Mb2FkaW5nKGZhbHNlLCAn0KHQs9C10L3QtdGA0LjRgNC+0LLQsNGC0YwnKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldENvbnRyb2xzRGlzYWJsZWQoZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNHZW5lcmF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9hZGVkVXNlckltYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzZXRVc2VyVXBsb2FkSW1hZ2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NlbGVjdExheW91dCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RMYXlvdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbmNlbEVkaXRMYXlvdXQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGZvcm0gPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybSA9IGZvcm1CbG9jay5xdWVyeVNlbGVjdG9yKFwiZm9ybVwiKTtcbiAgICAgICAgICAgICAgICBpZiAoZm9ybSkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShmb3JtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgICAgICAgIH0sIDEwMDAgKiAxMCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIWZvcm0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIGZvcm0gbm90IGZvdW5kJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZm9ybS5hY3Rpb24gPSBcIlwiO1xuICAgICAgICBmb3JtLm1ldGhvZCA9IFwiR0VUXCI7XG4gICAgICAgIGZvcm0ub25zdWJtaXQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBoYW5kbGVDbGljaygpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBmaXhJbnB1dEJsb2NrID0gZm9ybS5xdWVyeVNlbGVjdG9yKGB0ZXh0YXJlYVtuYW1lPScke2Zvcm1JbnB1dFZhcmlhYmxlTmFtZX0nXWApO1xuICAgICAgICBpZiAoZml4SW5wdXRCbG9jaykge1xuICAgICAgICAgICAgZml4SW5wdXRCbG9jay5zdHlsZS5wYWRkaW5nID0gXCI4cHhcIjtcbiAgICAgICAgfVxuICAgICAgICBmb3JtQnV0dG9uLm9uY2xpY2sgPSBoYW5kbGVDbGljaztcbiAgICAgICAgZm9ybUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSBcInBvaW50ZXJcIjtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dINCY0L3QuNGG0LjQsNC70LjQt9Cw0YbQuNGPINGE0L7RgNC80Ysg0LfQsNCy0LXRgNGI0LXQvdCwJyk7XG4gICAgfVxuICAgIHJlc3RvcmVJY29uRnJvbURhdGFPcmlnaW5hbChlbGVtZW50KSB7XG4gICAgICAgIGlmICghZWxlbWVudClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZGF0YU9yaWdpbmFsID0gZWxlbWVudC5hdHRyaWJ1dGVzLmdldE5hbWVkSXRlbShcImRhdGEtb3JpZ2luYWxcIik/LnZhbHVlO1xuICAgICAgICBpZiAoZGF0YU9yaWdpbmFsKSB7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IGB1cmwoXCIke2RhdGFPcmlnaW5hbH1cIilgO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNoYW5nZVByb2R1Y3QocHJvZHVjdFR5cGUpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNHZW5lcmF0aW5nKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tjaGFuZ2VQcm9kdWN0XSDQk9C10L3QtdGA0LDRhtC40Y8g0LIg0L/RgNC+0YbQtdGB0YHQtSwg0L/QtdGA0LXQutC70Y7Rh9C10L3QuNC1INC30LDQsdC70L7QutC40YDQvtCy0LDQvdC+Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc2VsZWN0VHlwZSA9IHByb2R1Y3RUeXBlO1xuICAgICAgICB0aGlzLmNsZWFyTW9ja3VwQ2FjaGUoKTtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZShwcm9kdWN0VHlwZSk7XG4gICAgICAgIGlmIChwcm9kdWN0KSB7XG4gICAgICAgICAgICBjb25zdCBtb2NrdXBXaXRoQ3VycmVudENvbG9yID0gcHJvZHVjdC5tb2NrdXBzLmZpbmQobSA9PiBtLnNpZGUgPT09IHRoaXMuX3NlbGVjdFNpZGUgJiYgbS5jb2xvci5uYW1lID09PSB0aGlzLl9zZWxlY3RDb2xvci5uYW1lKTtcbiAgICAgICAgICAgIGlmICghbW9ja3VwV2l0aEN1cnJlbnRDb2xvcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0TW9ja3VwID0gcHJvZHVjdC5tb2NrdXBzLmZpbmQobSA9PiBtLnNpZGUgPT09IHRoaXMuX3NlbGVjdFNpZGUpO1xuICAgICAgICAgICAgICAgIGlmIChmaXJzdE1vY2t1cCAmJiBmaXJzdE1vY2t1cC5jb2xvciAmJiBmaXJzdE1vY2t1cC5jb2xvci5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gZmlyc3RNb2NrdXAuY29sb3I7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtwcm9kdWN0XSDQptCy0LXRgiDQuNC30LzQtdC90LXQvSDQvdCwICR7dGhpcy5fc2VsZWN0Q29sb3IubmFtZX0g0LTQu9GPINC/0YDQvtC00YPQutGC0LAgJHtwcm9kdWN0VHlwZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVQcm9kdWN0QmxvY2tzVUkoKTtcbiAgICAgICAgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgdGhpcy5sb2FkUHJvZHVjdCgpO1xuICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgIH1cbiAgICB1cGRhdGVQcm9kdWN0QmxvY2tzVUkoKSB7XG4gICAgICAgIGlmICh0aGlzLnByb2R1Y3RCbG9ja3MubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnByb2R1Y3RCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICBibG9jay5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYigyMjIgMjIyIDIyMiknO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLnByb2R1Y3RCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fcHJvZHVjdC1ibG9ja19fJyArIHRoaXMuX3NlbGVjdFR5cGUpKTtcbiAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICBhY3RpdmVCbG9jay5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2hhbmdlU2lkZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNHZW5lcmF0aW5nKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tjaGFuZ2VTaWRlXSDQk9C10L3QtdGA0LDRhtC40Y8g0LIg0L/RgNC+0YbQtdGB0YHQtSwg0L/QtdGA0LXQutC70Y7Rh9C10L3QuNC1INC30LDQsdC70L7QutC40YDQvtCy0LDQvdC+Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmV3U2lkZSA9IHRoaXMuX3NlbGVjdFNpZGUgPT09ICdmcm9udCcgPyAnYmFjaycgOiAnZnJvbnQnO1xuICAgICAgICB0aGlzLnNldEFjdGl2ZVNpZGUobmV3U2lkZSk7XG4gICAgICAgIHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuU1RBVEVfQ0hBTkdFRCwgdW5kZWZpbmVkKTtcbiAgICB9XG4gICAgY2hhbmdlQ29sb3IoY29sb3JOYW1lKSB7XG4gICAgICAgIGlmICh0aGlzLmlzR2VuZXJhdGluZykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbY2hhbmdlQ29sb3JdINCT0LXQvdC10YDQsNGG0LjRjyDQsiDQv9GA0L7RhtC10YHRgdC1LCDQv9C10YDQtdC60LvRjtGH0LXQvdC40LUg0LfQsNCx0LvQvtC60LjRgNC+0LLQsNC90L4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IG1vY2t1cCA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG0gPT4gbS5jb2xvci5uYW1lID09PSBjb2xvck5hbWUpO1xuICAgICAgICBpZiAoIW1vY2t1cCB8fCAhbW9ja3VwLmNvbG9yIHx8ICFtb2NrdXAuY29sb3IubmFtZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5fc2VsZWN0Q29sb3IgPSBtb2NrdXAuY29sb3I7XG4gICAgICAgIHRoaXMuY2xlYXJNb2NrdXBDYWNoZSgpO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbG9yQmxvY2tzVUkoY29sb3JOYW1lKTtcbiAgICAgICAgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICB9XG4gICAgdXBkYXRlQ29sb3JCbG9ja3NVSShjb2xvck5hbWUpIHtcbiAgICAgICAgaWYgKHRoaXMuY29sb3JCbG9ja3MubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmNvbG9yQmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgYmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YzZjNmMyc7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBhY3RpdmVCbG9jayA9IHRoaXMuY29sb3JCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fY29sb3ItYmxvY2tfXycgKyBjb2xvck5hbWUpKTtcbiAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICBhY3RpdmVCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcnO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNoYW5nZVNpemUoc2l6ZSkge1xuICAgICAgICB0aGlzLnVwZGF0ZVNpemVCbG9ja3NVSShzaXplKTtcbiAgICAgICAgdGhpcy5fc2VsZWN0U2l6ZSA9IHNpemU7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgfVxuICAgIHVwZGF0ZVNpemVCbG9ja3NVSShzaXplKSB7XG4gICAgICAgIGlmICh0aGlzLnNpemVCbG9ja3MubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnNpemVCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICBjb25zdCBib3JkZXJCbG9jayA9IGJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgaWYgKGJvcmRlckJsb2NrKSB7XG4gICAgICAgICAgICAgICAgYm9yZGVyQmxvY2suc3R5bGUuc2V0UHJvcGVydHkoJy0tdDM5Ni1ib3JkZXJjb2xvcicsICcjZjNmM2YzJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBhY3RpdmVCbG9jayA9IHRoaXMuc2l6ZUJsb2Nrcy5maW5kKGJsb2NrID0+IGJsb2NrLmNsYXNzTGlzdC5jb250YWlucygnZWRpdG9yLXNldHRpbmdzX19zaXplLWJsb2NrX18nICsgc2l6ZSkpO1xuICAgICAgICBpZiAoYWN0aXZlQmxvY2spIHtcbiAgICAgICAgICAgIGNvbnN0IGJvcmRlckJsb2NrID0gYWN0aXZlQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBpZiAoYm9yZGVyQmxvY2spIHtcbiAgICAgICAgICAgICAgICBib3JkZXJCbG9jay5zdHlsZS5zZXRQcm9wZXJ0eSgnLS10Mzk2LWJvcmRlcmNvbG9yJywgJycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGVkaXRMYXlvdXQobGF5b3V0KSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gW2xheW91dHNdIGVkaXQgbGF5b3V0ICR7bGF5b3V0LmlkfWApO1xuICAgICAgICB0aGlzLl9zZWxlY3RMYXlvdXQgPSBsYXlvdXQuaWQ7XG4gICAgICAgIGlmICh0aGlzLmZvcm1CbG9jayAmJiB0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSkge1xuICAgICAgICAgICAgY29uc3QgZm9ybUlucHV0ID0gdGhpcy5mb3JtQmxvY2sucXVlcnlTZWxlY3RvcihgW25hbWU9XCIke3RoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lfVwiXWApO1xuICAgICAgICAgICAgaWYgKGZvcm1JbnB1dCkge1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC52YWx1ZSA9IGxheW91dC5uYW1lIHx8ICcnO1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC5zdHlsZS5ib3JkZXJDb2xvciA9ICdyZ2IoMjU0LCA5NCwgNTgpJztcbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSDQo9GB0YLQsNC90L7QstC70LXQvdC+INC30L3QsNGH0LXQvdC40LUg0LIg0YTQvtGA0LzRgzogXCIke2xheW91dC5uYW1lfVwiYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtzZXR0aW5nc10gW2xheW91dHNdINCd0LUg0L3QsNC50LTQtdC9INGN0LvQtdC80LXQvdGCINGE0L7RgNC80Ysg0YEg0LjQvNC10L3QtdC8IFwiJHt0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZX1cImApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChsYXlvdXQuaXNJbWFnZUxheW91dCgpKSB7XG4gICAgICAgICAgICB0aGlzLmxvYWRlZFVzZXJJbWFnZSA9IGxheW91dC51cmw7XG4gICAgICAgICAgICB0aGlzLnNldFVzZXJVcGxvYWRJbWFnZShsYXlvdXQudXJsKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdEFpQnV0dG9ucygpO1xuICAgICAgICAgICAgdGhpcy5oaWRlQWlCdXR0b25zKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxvYWRlZFVzZXJJbWFnZSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnJlc2V0VXNlclVwbG9hZEltYWdlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgIH1cbiAgICBjYW5jZWxFZGl0TGF5b3V0KCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSBjYW5jZWwgZWRpdCBsYXlvdXRgKTtcbiAgICAgICAgdGhpcy5fc2VsZWN0TGF5b3V0ID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuZm9ybUJsb2NrICYmIHRoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lKSB7XG4gICAgICAgICAgICBjb25zdCBmb3JtSW5wdXQgPSB0aGlzLmZvcm1CbG9jay5xdWVyeVNlbGVjdG9yKGBbbmFtZT1cIiR7dGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWV9XCJdYCk7XG4gICAgICAgICAgICBpZiAoZm9ybUlucHV0KSB7XG4gICAgICAgICAgICAgICAgZm9ybUlucHV0LnZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgZm9ybUlucHV0LnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubG9hZGVkVXNlckltYWdlID0gbnVsbDtcbiAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aEFpID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBbbGF5b3V0c10g0KDQtdC00LDQutGC0LjRgNC+0LLQsNC90LjQtSDQvtGC0LzQtdC90LXQvdC+YCk7XG4gICAgfVxuICAgIGluaXRBaUJ1dHRvbnMoKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jaGFuZ2VMb2FkV2l0aEFpKCk7XG4gICAgICAgIHRoaXMuY2hhbmdlUmVtb3ZlQmFja2dyb3VuZCgpO1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VMb2FkV2l0aEFpKHRydWUpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VMb2FkV2l0aEFpKGZhbHNlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yUmVtb3ZlQmFja2dyb3VuZEJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yUmVtb3ZlQmFja2dyb3VuZEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlUmVtb3ZlQmFja2dyb3VuZCghdGhpcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgaGlkZUFpQnV0dG9ucygpIHtcbiAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aEFpID0gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbikge1xuICAgICAgICAgICAgKHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbi5wYXJlbnRFbGVtZW50Py5wYXJlbnRFbGVtZW50Py5wYXJlbnRFbGVtZW50KS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNob3dBaUJ1dHRvbnMoKSB7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24pIHtcbiAgICAgICAgICAgICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24ucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudCkuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGxvYWRVc2VySW1hZ2UoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWQgdXNlciBpbWFnZV0gc3RhcnRpbmcgdXNlciBpbWFnZSB1cGxvYWQnKTtcbiAgICAgICAgdGhpcy5zaG93QWlCdXR0b25zKCk7XG4gICAgICAgIGNvbnN0IGZpbGVJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgIGZpbGVJbnB1dC50eXBlID0gJ2ZpbGUnO1xuICAgICAgICBmaWxlSW5wdXQuYWNjZXB0ID0gJ2ltYWdlLyonO1xuICAgICAgICBmaWxlSW5wdXQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgZmlsZUlucHV0Lm9uY2hhbmdlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG4gICAgICAgICAgICBjb25zdCBmaWxlID0gdGFyZ2V0LmZpbGVzPy5bMF07XG4gICAgICAgICAgICBpZiAoZmlsZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWQgdXNlciBpbWFnZV0gZmlsZSBzZWxlY3RlZDonLCBmaWxlLm5hbWUpO1xuICAgICAgICAgICAgICAgIGlmICghZmlsZS50eXBlLnN0YXJ0c1dpdGgoJ2ltYWdlLycpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW3VwbG9hZCB1c2VyIGltYWdlXSBzZWxlY3RlZCBmaWxlIGlzIG5vdCBhbiBpbWFnZScpO1xuICAgICAgICAgICAgICAgICAgICBhbGVydCgn0J/QvtC20LDQu9GD0LnRgdGC0LAsINCy0YvQsdC10YDQuNGC0LUg0YTQsNC50Lsg0LjQt9C+0LHRgNCw0LbQtdC90LjRjycpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGFzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlVXJsID0gZS50YXJnZXQ/LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZCB1c2VyIGltYWdlXSBmaWxlIGxvYWRlZCBhcyBkYXRhIFVSTCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbWFnZURhdGEgPSBhd2FpdCB0aGlzLmdldEltYWdlRGF0YShpbWFnZVVybCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0VXNlclVwbG9hZEltYWdlKGltYWdlRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWQgdXNlciBpbWFnZV0gaW1hZ2UgbGF5b3V0IGFkZGVkIHN1Y2Nlc3NmdWxseScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1t1cGxvYWQgdXNlciBpbWFnZV0gZXJyb3IgcmVhZGluZyBmaWxlJyk7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCfQntGI0LjQsdC60LAg0L/RgNC4INC30LDQs9GA0YPQt9C60LUg0YTQsNC50LvQsCcpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZmlsZUlucHV0KTtcbiAgICAgICAgZmlsZUlucHV0LmNsaWNrKCk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZmlsZUlucHV0KTtcbiAgICB9XG4gICAgc2V0VXNlclVwbG9hZEltYWdlKGltYWdlKSB7XG4gICAgICAgIHRoaXMubG9hZGVkVXNlckltYWdlID0gaW1hZ2U7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvclVwbG9hZFZpZXdCbG9jaykge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2suc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICBjb25zdCBpbWFnZUJsb2NrID0gZ2V0TGFzdENoaWxkKHRoaXMuZWRpdG9yVXBsb2FkVmlld0Jsb2NrKTtcbiAgICAgICAgICAgIGlmIChpbWFnZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VCbG9jay5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBgdXJsKCR7aW1hZ2V9KWA7XG4gICAgICAgICAgICAgICAgaW1hZ2VCbG9jay5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9ICdjb250YWluJztcbiAgICAgICAgICAgICAgICBpbWFnZUJsb2NrLnN0eWxlLmJhY2tncm91bmRQb3NpdGlvbiA9ICdjZW50ZXInO1xuICAgICAgICAgICAgICAgIGltYWdlQmxvY2suc3R5bGUuYmFja2dyb3VuZFJlcGVhdCA9ICduby1yZXBlYXQnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJlc2V0VXNlclVwbG9hZEltYWdlKCkge1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkVmlld0Jsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBudWxsO1xuICAgICAgICB0aGlzLmNhbmNlbEVkaXRMYXlvdXQoKTtcbiAgICB9XG4gICAgY2hhbmdlTG9hZFdpdGhBaSh2YWx1ZSA9IGZhbHNlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFthaSBidXR0b25zXSBjaGFuZ2VMb2FkV2l0aEFpINCy0YvQt9Cy0LDQvSwgdmFsdWU9JHt2YWx1ZX1gKTtcbiAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aEFpID0gdmFsdWU7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24gJiYgdGhpcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uKSB7XG4gICAgICAgICAgICBjb25zdCBidXR0b25XaXRoQWkgPSB0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b247XG4gICAgICAgICAgICBjb25zdCBidXR0b25XaXRob3V0QWkgPSB0aGlzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b247XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaXhCdXR0b25XaXRoQWkgPSBidXR0b25XaXRoQWkuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICAgICAgY29uc3QgZml4QnV0dG9uV2l0aG91dEFpID0gYnV0dG9uV2l0aG91dEFpLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgIGlmIChmaXhCdXR0b25XaXRoQWkpIHtcbiAgICAgICAgICAgICAgICAgICAgZml4QnV0dG9uV2l0aEFpLnN0eWxlLnNldFByb3BlcnR5KCctLXQzOTYtYm9yZGVyY29sb3InLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFthaSBidXR0b25zXSDQoSDQmNCYOiDRgdCx0YDQvtGI0LXQvSBib3JkZXJDb2xvciAo0L7RgNCw0L3QttC10LLRi9C5KWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZml4QnV0dG9uV2l0aG91dEFpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpeEJ1dHRvbldpdGhvdXRBaS5zdHlsZS5zZXRQcm9wZXJ0eSgnLS10Mzk2LWJvcmRlcmNvbG9yJywgJyNmMmYyZjInKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2FpIGJ1dHRvbnNdINCR0LXQtyDQmNCYOiDRg9GB0YLQsNC90L7QstC70LXQvSBib3JkZXJDb2xvcj0jZjJmMmYyICjRgdC10YDRi9C5KWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpeEJ1dHRvbldpdGhBaSA9IGJ1dHRvbldpdGhBaS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgICAgICBjb25zdCBmaXhCdXR0b25XaXRob3V0QWkgPSBidXR0b25XaXRob3V0QWkuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICAgICAgaWYgKGZpeEJ1dHRvbldpdGhBaSkge1xuICAgICAgICAgICAgICAgICAgICBmaXhCdXR0b25XaXRoQWkuc3R5bGUuc2V0UHJvcGVydHkoJy0tdDM5Ni1ib3JkZXJjb2xvcicsICcjZjJmMmYyJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFthaSBidXR0b25zXSDQoSDQmNCYOiDRg9GB0YLQsNC90L7QstC70LXQvSBib3JkZXJDb2xvcj0jZjJmMmYyICjRgdC10YDRi9C5KWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZml4QnV0dG9uV2l0aG91dEFpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpeEJ1dHRvbldpdGhvdXRBaS5zdHlsZS5zZXRQcm9wZXJ0eSgnLS10Mzk2LWJvcmRlcmNvbG9yJywgJycpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbYWkgYnV0dG9uc10g0JHQtdC3INCY0Jg6INGB0LHRgNC+0YjQtdC9IGJvcmRlckNvbG9yICjQvtGA0LDQvdC20LXQstGL0LkpYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlUmVtb3ZlQmFja2dyb3VuZFZpc2liaWxpdHkoKTtcbiAgICB9XG4gICAgY2hhbmdlUmVtb3ZlQmFja2dyb3VuZCh2YWx1ZSA9IGZhbHNlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtyZW1vdmUgYmcgYnV0dG9uXSBjaGFuZ2VSZW1vdmVCYWNrZ3JvdW5kINCy0YvQt9Cy0LDQvSwgdmFsdWU9JHt2YWx1ZX1gKTtcbiAgICAgICAgdGhpcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kID0gdmFsdWU7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b24pIHtcbiAgICAgICAgICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuZWRpdG9yUmVtb3ZlQmFja2dyb3VuZEJ1dHRvbjtcbiAgICAgICAgICAgIGNvbnN0IGZpeEJ1dHRvbiA9IGJ1dHRvbi5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGlmIChmaXhCdXR0b24pIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZml4QnV0dG9uLnN0eWxlLnNldFByb3BlcnR5KCctLXQzOTYtYm9yZGVyY29sb3InLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtyZW1vdmUgYmcgYnV0dG9uXSDQo9Cx0YDQsNGC0Ywg0YTQvtC9OiDRgdCx0YDQvtGI0LXQvSBib3JkZXJDb2xvciAo0L7RgNCw0L3QttC10LLRi9C5KWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZml4QnV0dG9uLnN0eWxlLnNldFByb3BlcnR5KCctLXQzOTYtYm9yZGVyY29sb3InLCAnI2YyZjJmMicpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbcmVtb3ZlIGJnIGJ1dHRvbl0g0KPQsdGA0LDRgtGMINGE0L7QvTog0YPRgdGC0LDQvdC+0LLQu9C10L0gYm9yZGVyQ29sb3I9I2YyZjJmMiAo0YHQtdGA0YvQuSlgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlUmVtb3ZlQmFja2dyb3VuZFZpc2liaWxpdHkoKSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBwYXJlbnRFbGVtZW50ID0gdGhpcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kQnV0dG9uLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIGlmICghcGFyZW50RWxlbWVudClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckxvYWRXaXRoQWkpIHtcbiAgICAgICAgICAgIHBhcmVudEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3JlbW92ZSBiZyBidXR0b25dINCa0L3QvtC/0LrQsCDQv9C+0LrQsNC30LDQvdCwICjQkdC10Lcg0JjQmCDQstGL0LHRgNCw0L3QviknKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhcmVudEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlUmVtb3ZlQmFja2dyb3VuZChmYWxzZSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbcmVtb3ZlIGJnIGJ1dHRvbl0g0JrQvdC+0L/QutCwINGB0LrRgNGL0YLQsCAo0KEg0JjQmCDQstGL0LHRgNCw0L3QviknKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsb2FkSW1hZ2Uoc3JjKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIGltZy5jcm9zc09yaWdpbiA9ICdhbm9ueW1vdXMnO1xuICAgICAgICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHJlc29sdmUoaW1nKTtcbiAgICAgICAgICAgIGltZy5vbmVycm9yID0gcmVqZWN0O1xuICAgICAgICAgICAgaW1nLnNyYyA9IHNyYztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldFF1YW50aXR5KCkge1xuICAgICAgICBpZiAoIXRoaXMucXVhbnRpdHlGb3JtQmxvY2spXG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgY29uc3QgZm9ybSA9IHRoaXMucXVhbnRpdHlGb3JtQmxvY2sucXVlcnlTZWxlY3RvcignZm9ybScpO1xuICAgICAgICBjb25zdCBpbnB1dCA9IGZvcm0/LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJxdWFudGl0eVwiXScpO1xuICAgICAgICBpZiAoIWlucHV0KVxuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIHJldHVybiBwYXJzZUludChpbnB1dC52YWx1ZSkgfHwgMTtcbiAgICB9XG4gICAgZ2V0U3VtKCkge1xuICAgICAgICBjb25zdCBoYXNGcm9udCA9IHRoaXMubGF5b3V0cy5zb21lKGxheW91dCA9PiBsYXlvdXQudmlldyA9PT0gJ2Zyb250Jyk7XG4gICAgICAgIGNvbnN0IGhhc0JhY2sgPSB0aGlzLmxheW91dHMuc29tZShsYXlvdXQgPT4gbGF5b3V0LnZpZXcgPT09ICdiYWNrJyk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdClcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICBjb25zdCBwcmljZSA9IGhhc0JhY2sgJiYgaGFzRnJvbnRcbiAgICAgICAgICAgID8gcHJvZHVjdC5kb3VibGVTaWRlZFByaWNlXG4gICAgICAgICAgICA6IHByb2R1Y3QucHJpY2U7XG4gICAgICAgIHJldHVybiBwcmljZTtcbiAgICB9XG4gICAgdXBkYXRlU3VtKCkge1xuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yU3VtQmxvY2spXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHN1bSA9IHRoaXMuZ2V0U3VtKCk7XG4gICAgICAgIGNvbnN0IHN1bVRleHQgPSBnZXRMYXN0Q2hpbGQodGhpcy5lZGl0b3JTdW1CbG9jayk7XG4gICAgICAgIGlmIChzdW1UZXh0KSB7XG4gICAgICAgICAgICBzdW1UZXh0LmlubmVyVGV4dCA9IHN1bS50b1N0cmluZygpICsgJyDigr0nO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uKSB7XG4gICAgICAgICAgICBjb25zdCBidXR0b25CbG9jayA9IGdldExhc3RDaGlsZCh0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uKTtcbiAgICAgICAgICAgIGlmIChidXR0b25CbG9jaykge1xuICAgICAgICAgICAgICAgIGJ1dHRvbkJsb2NrLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHN1bSA9PT0gMCA/ICdyZ2IoMTIxIDEyMSAxMjEpJyA6ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGxvYWRQcm9kdWN0KCkge1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QgfHwgIXByb2R1Y3QucHJpbnRDb25maWcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW3Byb2R1Y3RdIHByb2R1Y3Qgb3IgcHJpbnRDb25maWcgbm90IGZvdW5kJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jbGVhckFsbENhbnZhcygpO1xuICAgICAgICBmb3IgKGNvbnN0IHByaW50Q29uZmlnIG9mIHByb2R1Y3QucHJpbnRDb25maWcpIHtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQ2FudmFzRm9yU2lkZShwcmludENvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRBY3RpdmVTaWRlKHRoaXMuX3NlbGVjdFNpZGUpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCBmYWxzZSk7XG4gICAgICAgIH0sIDEwMCk7XG4gICAgfVxuICAgIGNsZWFyQWxsQ2FudmFzKCkge1xuICAgICAgICBpZiAodGhpcy5jYW52YXNlc0NvbnRhaW5lcikge1xuICAgICAgICAgICAgdGhpcy5jYW52YXNlc0NvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNhbnZhc2VzLmZvckVhY2goY2FudmFzID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2FudmFzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbY2FudmFzXSDQntGI0LjQsdC60LAg0L7Rh9C40YHRgtC60LggY2FudmFzOicsIGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNhbnZhc2VzID0gW107XG4gICAgICAgIHRoaXMubGF5ZXJzQ2FudmFzZXMgPSBbXTtcbiAgICAgICAgdGhpcy5hY3RpdmVDYW52YXMgPSBudWxsO1xuICAgIH1cbiAgICBoYW5kbGVXaW5kb3dSZXNpemUoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tjYW52YXNdINCY0LfQvNC10L3QtdC90LjQtSDRgNCw0LfQvNC10YDQsCDQvtC60L3QsCcpO1xuICAgICAgICBjb25zdCBuZXdXaWR0aCA9IHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGg7XG4gICAgICAgIGNvbnN0IG5ld0hlaWdodCA9IHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0O1xuICAgICAgICB0aGlzLmNhbnZhc2VzLmZvckVhY2goKGNhbnZhcykgPT4ge1xuICAgICAgICAgICAgY2FudmFzLnNldFdpZHRoKG5ld1dpZHRoKTtcbiAgICAgICAgICAgIGNhbnZhcy5zZXRIZWlnaHQobmV3SGVpZ2h0KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubGF5ZXJzQ2FudmFzZXMuZm9yRWFjaCgoY2FudmFzKSA9PiB7XG4gICAgICAgICAgICBjYW52YXMuc2V0V2lkdGgobmV3V2lkdGgpO1xuICAgICAgICAgICAgY2FudmFzLnNldEhlaWdodChuZXdIZWlnaHQpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKHByb2R1Y3QpIHtcbiAgICAgICAgICAgIHByb2R1Y3QucHJpbnRDb25maWcuZm9yRWFjaCgocHJpbnRDb25maWcpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc2VzLmZpbmQoYyA9PiBjLnNpZGUgPT09IHByaW50Q29uZmlnLnNpZGUpO1xuICAgICAgICAgICAgICAgIGlmIChjYW52YXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVQcmludEFyZWEoY2FudmFzLCBwcmludENvbmZpZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jYW52YXNlcy5mb3JFYWNoKChjYW52YXMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNpZGUgPSBjYW52YXMuc2lkZTtcbiAgICAgICAgICAgIGNvbnN0IG9iamVjdHMgPSBjYW52YXMuZ2V0T2JqZWN0cygpO1xuICAgICAgICAgICAgY29uc3QgdG9SZW1vdmUgPSBbXTtcbiAgICAgICAgICAgIG9iamVjdHMuZm9yRWFjaCgob2JqKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG9iai5uYW1lICE9PSAnYXJlYTpib3JkZXInICYmXG4gICAgICAgICAgICAgICAgICAgIG9iai5uYW1lICE9PSAnYXJlYTpjbGlwJyAmJlxuICAgICAgICAgICAgICAgICAgICAhb2JqLm5hbWU/LnN0YXJ0c1dpdGgoJ2d1aWRlbGluZScpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvUmVtb3ZlLnB1c2gob2JqKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRvUmVtb3ZlLmZvckVhY2goKG9iaikgPT4gY2FudmFzLnJlbW92ZShvYmopKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtjYW52YXNdINCj0LTQsNC70LXQvdC+ICR7dG9SZW1vdmUubGVuZ3RofSDQvtCx0YrQtdC60YLQvtCyINC00LvRjyDQv9C10YDQtdGA0LjRgdC+0LLQutC4INC90LAg0YHRgtC+0YDQvtC90LUgJHtzaWRlfWApO1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0c0ZvclNpZGUgPSB0aGlzLmxheW91dHMuZmlsdGVyKGwgPT4gbC52aWV3ID09PSBzaWRlKTtcbiAgICAgICAgICAgIGxheW91dHNGb3JTaWRlLmZvckVhY2gobGF5b3V0ID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZExheW91dFRvQ2FudmFzKGxheW91dCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbY2FudmFzXSDQoNCw0LfQvNC10YAg0LjQt9C80LXQvdC10L06JywgeyB3aWR0aDogbmV3V2lkdGgsIGhlaWdodDogbmV3SGVpZ2h0IH0pO1xuICAgIH1cbiAgICB1cGRhdGVQcmludEFyZWEoY2FudmFzLCBwcmludENvbmZpZykge1xuICAgICAgICBjb25zdCB3aWR0aCA9IHByaW50Q29uZmlnLnNpemUud2lkdGggLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBwcmludENvbmZpZy5zaXplLmhlaWdodCAvIDYwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0O1xuICAgICAgICBjb25zdCBsZWZ0ID0gKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGggLSB3aWR0aCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnggLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoKTtcbiAgICAgICAgY29uc3QgdG9wID0gKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0IC0gaGVpZ2h0KSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueSAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgY29uc3QgY2xpcFBhdGggPSBjYW52YXMuY2xpcFBhdGg7XG4gICAgICAgIGlmIChjbGlwUGF0aCkge1xuICAgICAgICAgICAgY2xpcFBhdGguc2V0KHtcbiAgICAgICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQsXG4gICAgICAgICAgICAgICAgbGVmdCxcbiAgICAgICAgICAgICAgICB0b3BcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJvcmRlciA9IHRoaXMuZ2V0T2JqZWN0KCdhcmVhOmJvcmRlcicsIGNhbnZhcyk7XG4gICAgICAgIGlmIChib3JkZXIpIHtcbiAgICAgICAgICAgIGJvcmRlci5zZXQoe1xuICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCAtIDMsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQgLSAzLFxuICAgICAgICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgICAgICAgdG9wXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYW52YXMucmVxdWVzdFJlbmRlckFsbCgpO1xuICAgIH1cbiAgICBjcmVhdGVDYW52YXNGb3JTaWRlKHByaW50Q29uZmlnKSB7XG4gICAgICAgIGlmICghdGhpcy5jYW52YXNlc0NvbnRhaW5lcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NhbnZhc10gY2FudmFzZXNDb250YWluZXIg0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L0nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsYXllcnNDYW52YXNCbG9jayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBsYXllcnNDYW52YXNCbG9jay5pZCA9ICdsYXllcnMtLScgKyBwcmludENvbmZpZy5zaWRlO1xuICAgICAgICBsYXllcnNDYW52YXNCbG9jay5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItcG9zaXRpb24nKTtcbiAgICAgICAgbGF5ZXJzQ2FudmFzQmxvY2suc2V0QXR0cmlidXRlKCdyZWYnLCBwcmludENvbmZpZy5zaWRlKTtcbiAgICAgICAgbGF5ZXJzQ2FudmFzQmxvY2suc3R5bGUuekluZGV4ID0gJzcnO1xuICAgICAgICB0aGlzLmNhbnZhc2VzQ29udGFpbmVyLmFwcGVuZENoaWxkKGxheWVyc0NhbnZhc0Jsb2NrKTtcbiAgICAgICAgY29uc3QgbGF5ZXJzQ2FudmFzID0gbmV3IGZhYnJpYy5TdGF0aWNDYW52YXMobGF5ZXJzQ2FudmFzQmxvY2ssIHtcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCxcbiAgICAgICAgfSk7XG4gICAgICAgIGxheWVyc0NhbnZhcy5zaWRlID0gcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgbGF5ZXJzQ2FudmFzLm5hbWUgPSAnc3RhdGljLScgKyBwcmludENvbmZpZy5zaWRlO1xuICAgICAgICBjb25zdCBlZGl0YWJsZUNhbnZhc0Jsb2NrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGVkaXRhYmxlQ2FudmFzQmxvY2suaWQgPSAnZWRpdGFibGUtLScgKyBwcmludENvbmZpZy5zaWRlO1xuICAgICAgICBlZGl0YWJsZUNhbnZhc0Jsb2NrLnNldEF0dHJpYnV0ZSgncmVmJywgcHJpbnRDb25maWcuc2lkZSk7XG4gICAgICAgIGVkaXRhYmxlQ2FudmFzQmxvY2suY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXBvc2l0aW9uJyk7XG4gICAgICAgIGVkaXRhYmxlQ2FudmFzQmxvY2suc3R5bGUuekluZGV4ID0gJzknO1xuICAgICAgICB0aGlzLmNhbnZhc2VzQ29udGFpbmVyLmFwcGVuZENoaWxkKGVkaXRhYmxlQ2FudmFzQmxvY2spO1xuICAgICAgICBjb25zdCBlZGl0YWJsZUNhbnZhcyA9IG5ldyBmYWJyaWMuQ2FudmFzKGVkaXRhYmxlQ2FudmFzQmxvY2ssIHtcbiAgICAgICAgICAgIGNvbnRyb2xzQWJvdmVPdmVybGF5OiB0cnVlLFxuICAgICAgICAgICAgd2lkdGg6IHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0LFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgdW5pZm9ybVNjYWxpbmc6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIGVkaXRhYmxlQ2FudmFzLnNpZGUgPSBwcmludENvbmZpZy5zaWRlO1xuICAgICAgICBlZGl0YWJsZUNhbnZhcy5uYW1lID0gJ2VkaXRhYmxlLScgKyBwcmludENvbmZpZy5zaWRlO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzLnB1c2gobGF5ZXJzQ2FudmFzKTtcbiAgICAgICAgdGhpcy5jYW52YXNlcy5wdXNoKGVkaXRhYmxlQ2FudmFzKTtcbiAgICAgICAgaWYgKHRoaXMuY2FudmFzZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUNhbnZhcyA9IGVkaXRhYmxlQ2FudmFzO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5pdE1haW5DYW52YXMoZWRpdGFibGVDYW52YXMsIHByaW50Q29uZmlnKTtcbiAgICB9XG4gICAgaW5pdE1haW5DYW52YXMoY2FudmFzLCBwcmludENvbmZpZykge1xuICAgICAgICBpZiAoIWNhbnZhcyB8fCAhKGNhbnZhcyBpbnN0YW5jZW9mIGZhYnJpYy5DYW52YXMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tjYW52YXNdIGNhbnZhcyDQvdC1INCy0LDQu9C40LTQtdC9Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgd2lkdGggPSBwcmludENvbmZpZy5zaXplLndpZHRoIC8gNjAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aDtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gcHJpbnRDb25maWcuc2l6ZS5oZWlnaHQgLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodDtcbiAgICAgICAgY29uc3QgbGVmdCA9ICh0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoIC0gd2lkdGgpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi54IC8gMTAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCk7XG4gICAgICAgIGNvbnN0IHRvcCA9ICh0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCAtIGhlaWdodCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnkgLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCk7XG4gICAgICAgIGNvbnN0IGNsaXBBcmVhID0gbmV3IGZhYnJpYy5SZWN0KHtcbiAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgICAgbGVmdCxcbiAgICAgICAgICAgIHRvcCxcbiAgICAgICAgICAgIGZpbGw6ICdyZ2IoMjU1LCAwLCAwKScsXG4gICAgICAgICAgICBuYW1lOiAnYXJlYTpjbGlwJyxcbiAgICAgICAgICAgIGV2ZW50ZWQ6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYXJlYUJvcmRlciA9IG5ldyBmYWJyaWMuUmVjdCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGggLSAzLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQgLSAzLFxuICAgICAgICAgICAgbGVmdCxcbiAgICAgICAgICAgIHRvcCxcbiAgICAgICAgICAgIGZpbGw6ICdyZ2JhKDAsMCwwLDApJyxcbiAgICAgICAgICAgIHN0cm9rZVdpZHRoOiAzLFxuICAgICAgICAgICAgc3Ryb2tlOiAncmdiKDI1NCwgOTQsIDU4KScsXG4gICAgICAgICAgICBuYW1lOiAnYXJlYTpib3JkZXInLFxuICAgICAgICAgICAgb3BhY2l0eTogMC4zLFxuICAgICAgICAgICAgZXZlbnRlZDogZmFsc2UsXG4gICAgICAgICAgICBzZWxlY3RhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIGhhc0NvbnRyb2xzOiBmYWxzZSxcbiAgICAgICAgICAgIHN0cm9rZURhc2hBcnJheTogWzUsIDVdLFxuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLmFkZChhcmVhQm9yZGVyKTtcbiAgICAgICAgY2FudmFzLmNsaXBQYXRoID0gY2xpcEFyZWE7XG4gICAgICAgIHRoaXMuc2V0dXBDYW52YXNFdmVudEhhbmRsZXJzKGNhbnZhcywgcHJpbnRDb25maWcpO1xuICAgIH1cbiAgICBzZXR1cENhbnZhc0V2ZW50SGFuZGxlcnMoY2FudmFzLCBwcmludENvbmZpZykge1xuICAgICAgICBjYW52YXMub24oJ21vdXNlOmRvd24nLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBib3JkZXIgPSB0aGlzLmdldE9iamVjdCgnYXJlYTpib3JkZXInLCBjYW52YXMpO1xuICAgICAgICAgICAgaWYgKGJvcmRlcikge1xuICAgICAgICAgICAgICAgIGJvcmRlci5zZXQoJ29wYWNpdHknLCAwLjgpO1xuICAgICAgICAgICAgICAgIGNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjYW52YXMub24oJ21vdXNlOnVwJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYm9yZGVyID0gdGhpcy5nZXRPYmplY3QoJ2FyZWE6Ym9yZGVyJywgY2FudmFzKTtcbiAgICAgICAgICAgIGlmIChib3JkZXIpIHtcbiAgICAgICAgICAgICAgICBib3JkZXIuc2V0KCdvcGFjaXR5JywgMC4zKTtcbiAgICAgICAgICAgICAgICBjYW52YXMucmVxdWVzdFJlbmRlckFsbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLm9uKCdvYmplY3Q6cm90YXRpbmcnLCAoZSkgPT4ge1xuICAgICAgICAgICAgaWYgKGUudGFyZ2V0Py5hbmdsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYW5nbGVzID0gWzAsIDkwLCAxODAsIDI3MF07XG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEFuZ2xlID0gZS50YXJnZXQuYW5nbGUgJSAzNjA7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzbmFwQW5nbGUgb2YgYW5nbGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhjdXJyZW50QW5nbGUgLSBzbmFwQW5nbGUpIDwgNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZS50YXJnZXQucm90YXRlKHNuYXBBbmdsZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjYW52YXMub24oJ29iamVjdDptb3ZpbmcnLCAoZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVPYmplY3RNb3ZpbmcoZSwgY2FudmFzLCBwcmludENvbmZpZyk7XG4gICAgICAgIH0pO1xuICAgICAgICBjYW52YXMub24oJ29iamVjdDptb2RpZmllZCcsIChlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZU9iamVjdE1vZGlmaWVkKGUsIGNhbnZhcywgcHJpbnRDb25maWcpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaGFuZGxlT2JqZWN0TW92aW5nKGUsIGNhbnZhcywgcHJpbnRDb25maWcpIHtcbiAgICAgICAgaWYgKCFlLnRhcmdldCB8fCBlLnRhcmdldC5uYW1lID09PSAnYXJlYTpib3JkZXInIHx8IGUudGFyZ2V0Lm5hbWUgPT09ICdhcmVhOmNsaXAnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGF5b3V0ID0gdGhpcy5sYXlvdXRzLmZpbmQobCA9PiBsLmlkID09PSBlLnRhcmdldC5uYW1lKTtcbiAgICAgICAgaWYgKCFsYXlvdXQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZGltZW5zaW9ucyA9IGNhbGN1bGF0ZUxheW91dERpbWVuc2lvbnMobGF5b3V0LCBwcm9kdWN0LCB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoLCB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCk7XG4gICAgICAgIGNvbnN0IG9ialdpZHRoID0gZS50YXJnZXQud2lkdGggKiBlLnRhcmdldC5zY2FsZVg7XG4gICAgICAgIGNvbnN0IG9iakhlaWdodCA9IGUudGFyZ2V0LmhlaWdodCAqIGUudGFyZ2V0LnNjYWxlWTtcbiAgICAgICAgY29uc3Qgb2JqQ2VudGVyTGVmdCA9IGUudGFyZ2V0LmxlZnQgKyBvYmpXaWR0aCAvIDI7XG4gICAgICAgIGNvbnN0IG9iakNlbnRlclRvcCA9IGUudGFyZ2V0LnRvcCArIG9iakhlaWdodCAvIDI7XG4gICAgICAgIGNvbnN0IGNlbnRlclggPSBkaW1lbnNpb25zLnByaW50QXJlYUxlZnQgKyBkaW1lbnNpb25zLnByaW50QXJlYVdpZHRoIC8gMjtcbiAgICAgICAgY29uc3QgY2VudGVyWSA9IGRpbWVuc2lvbnMucHJpbnRBcmVhVG9wICsgZGltZW5zaW9ucy5wcmludEFyZWFIZWlnaHQgLyAyO1xuICAgICAgICBjb25zdCBuZWFyWCA9IE1hdGguYWJzKG9iakNlbnRlckxlZnQgLSBjZW50ZXJYKSA8IDc7XG4gICAgICAgIGNvbnN0IG5lYXJZID0gTWF0aC5hYnMob2JqQ2VudGVyVG9wIC0gY2VudGVyWSkgPCA3O1xuICAgICAgICBpZiAobmVhclgpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0d1aWRlbGluZShjYW52YXMsICd2ZXJ0aWNhbCcsIGNlbnRlclgsIDAsIGNlbnRlclgsIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgICAgIGUudGFyZ2V0LnNldCh7IGxlZnQ6IGNlbnRlclggLSBvYmpXaWR0aCAvIDIgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmhpZGVHdWlkZWxpbmUoY2FudmFzLCAndmVydGljYWwnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmVhclkpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0d1aWRlbGluZShjYW52YXMsICdob3Jpem9udGFsJywgMCwgY2VudGVyWSwgdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCwgY2VudGVyWSk7XG4gICAgICAgICAgICBlLnRhcmdldC5zZXQoeyB0b3A6IGNlbnRlclkgLSBvYmpIZWlnaHQgLyAyIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5oaWRlR3VpZGVsaW5lKGNhbnZhcywgJ2hvcml6b250YWwnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBoYW5kbGVPYmplY3RNb2RpZmllZChlLCBjYW52YXMsIHByaW50Q29uZmlnKSB7XG4gICAgICAgIGNvbnN0IG9iamVjdCA9IGUudGFyZ2V0O1xuICAgICAgICBpZiAoIW9iamVjdClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5oaWRlR3VpZGVsaW5lKGNhbnZhcywgJ3ZlcnRpY2FsJyk7XG4gICAgICAgIHRoaXMuaGlkZUd1aWRlbGluZShjYW52YXMsICdob3Jpem9udGFsJyk7XG4gICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0cy5maW5kKGwgPT4gbC5pZCA9PT0gb2JqZWN0Lm5hbWUpO1xuICAgICAgICBpZiAoIWxheW91dClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBkaW1lbnNpb25zID0gY2FsY3VsYXRlTGF5b3V0RGltZW5zaW9ucyhsYXlvdXQsIHByb2R1Y3QsIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgsIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgbGF5b3V0LnBvc2l0aW9uLnggPSAob2JqZWN0LmxlZnQgLSBkaW1lbnNpb25zLnByaW50QXJlYUxlZnQpIC8gZGltZW5zaW9ucy5wcmludEFyZWFXaWR0aDtcbiAgICAgICAgbGF5b3V0LnBvc2l0aW9uLnkgPSAob2JqZWN0LnRvcCAtIGRpbWVuc2lvbnMucHJpbnRBcmVhVG9wKSAvIGRpbWVuc2lvbnMucHJpbnRBcmVhSGVpZ2h0O1xuICAgICAgICBsYXlvdXQuc2l6ZSA9IG9iamVjdC5zY2FsZVg7XG4gICAgICAgIGxheW91dC5hc3BlY3RSYXRpbyA9IG9iamVjdC5zY2FsZVkgLyBvYmplY3Quc2NhbGVYO1xuICAgICAgICBsYXlvdXQuYW5nbGUgPSBvYmplY3QuYW5nbGU7XG4gICAgICAgIGNvbnN0IG9iamVjdFdpZHRoID0gKG9iamVjdC53aWR0aCAqIG9iamVjdC5zY2FsZVgpO1xuICAgICAgICBjb25zdCByZWxhdGl2ZVdpZHRoID0gb2JqZWN0V2lkdGggLyBkaW1lbnNpb25zLnByaW50QXJlYVdpZHRoO1xuICAgICAgICBsYXlvdXQuX3JlbGF0aXZlV2lkdGggPSByZWxhdGl2ZVdpZHRoO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbY2FudmFzXSBMYXlvdXQgJHtsYXlvdXQuaWR9IHVwZGF0ZWQ6IHBvc2l0aW9uPSgke2xheW91dC5wb3NpdGlvbi54LnRvRml4ZWQoMyl9LCAke2xheW91dC5wb3NpdGlvbi55LnRvRml4ZWQoMyl9KSwgc2l6ZT0ke2xheW91dC5zaXplLnRvRml4ZWQoMyl9LCByZWxhdGl2ZVdpZHRoPSR7cmVsYXRpdmVXaWR0aC50b0ZpeGVkKDMpfWApO1xuICAgICAgICB0aGlzLnNhdmVMYXlvdXRzKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycikpO1xuICAgIH1cbiAgICBzaG93R3VpZGVsaW5lKGNhbnZhcywgdHlwZSwgeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IGBndWlkZWxpbmU6JHt0eXBlfWA7XG4gICAgICAgIGxldCBndWlkZWxpbmUgPSB0aGlzLmdldE9iamVjdChuYW1lLCBjYW52YXMpO1xuICAgICAgICBpZiAoIWd1aWRlbGluZSkge1xuICAgICAgICAgICAgZ3VpZGVsaW5lID0gbmV3IGZhYnJpYy5MaW5lKFt4MSwgeTEsIHgyLCB5Ml0sIHtcbiAgICAgICAgICAgICAgICBzdHJva2U6ICdyZ2IoMjU0LCA5NCwgNTgpJyxcbiAgICAgICAgICAgICAgICBzdHJva2VXaWR0aDogMixcbiAgICAgICAgICAgICAgICBzdHJva2VEYXNoQXJyYXk6IFs1LCA1XSxcbiAgICAgICAgICAgICAgICBzZWxlY3RhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBldmVudGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZ3VpZGVsaW5lKSB7XG4gICAgICAgICAgICAgICAgY2FudmFzLmFkZChndWlkZWxpbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGhpZGVHdWlkZWxpbmUoY2FudmFzLCB0eXBlKSB7XG4gICAgICAgIGNvbnN0IGd1aWRlbGluZSA9IHRoaXMuZ2V0T2JqZWN0KGBndWlkZWxpbmU6JHt0eXBlfWAsIGNhbnZhcyk7XG4gICAgICAgIGlmIChndWlkZWxpbmUpIHtcbiAgICAgICAgICAgIGNhbnZhcy5yZW1vdmUoZ3VpZGVsaW5lKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRPYmplY3QobmFtZSwgY2FudmFzKSB7XG4gICAgICAgIGNvbnN0IHRhcmdldENhbnZhcyA9IGNhbnZhcyB8fCB0aGlzLmFjdGl2ZUNhbnZhcyB8fCB0aGlzLmNhbnZhc2VzWzBdO1xuICAgICAgICBpZiAoIXRhcmdldENhbnZhcylcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiB0YXJnZXRDYW52YXMuZ2V0T2JqZWN0cygpLmZpbmQob2JqID0+IG9iai5uYW1lID09PSBuYW1lKTtcbiAgICB9XG4gICAgc2V0QWN0aXZlU2lkZShzaWRlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tjYW52YXNdINCj0YHRgtCw0L3QvtCy0LrQsCDQsNC60YLQuNCy0L3QvtC5INGB0YLQvtGA0L7QvdGLOicsIHNpZGUpO1xuICAgICAgICB0aGlzLmNhbnZhc2VzLmZvckVhY2goY2FudmFzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhc0VsZW1lbnQgPSBjYW52YXMuZ2V0RWxlbWVudCgpO1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyRWxlbWVudCA9IGNhbnZhc0VsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgIGlmIChjYW52YXMuc2lkZSA9PT0gc2lkZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ2FudmFzID0gY2FudmFzO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FudmFzRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYW52YXNFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzLmZvckVhY2gobGF5ZXJzQ2FudmFzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhc0VsZW1lbnQgPSBsYXllcnNDYW52YXMuZ2V0RWxlbWVudCgpO1xuICAgICAgICAgICAgY2FudmFzRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gbGF5ZXJzQ2FudmFzLnNpZGUgPT09IHNpZGUgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fc2VsZWN0U2lkZSA9IHNpZGU7XG4gICAgfVxuICAgIGFzeW5jIGFkZExheW91dFRvQ2FudmFzKGxheW91dCkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc2VzLmZpbmQoYyA9PiBjLnNpZGUgPT09IGxheW91dC52aWV3KTtcbiAgICAgICAgaWYgKCFjYW52YXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2NhbnZhc10gY2FudmFzINC00LvRjyAke2xheW91dC52aWV3fSDQvdC1INC90LDQudC00LXQvWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZmFicmljT2JqZWN0ID0gYXdhaXQgcmVuZGVyTGF5b3V0KHtcbiAgICAgICAgICAgIGxheW91dCxcbiAgICAgICAgICAgIHByb2R1Y3QsXG4gICAgICAgICAgICBjb250YWluZXJXaWR0aDogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCxcbiAgICAgICAgICAgIGNvbnRhaW5lckhlaWdodDogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQsXG4gICAgICAgICAgICBsb2FkSW1hZ2U6IHRoaXMubG9hZEltYWdlLmJpbmQodGhpcylcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChmYWJyaWNPYmplY3QpIHtcbiAgICAgICAgICAgIGNhbnZhcy5hZGQoZmFicmljT2JqZWN0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGVMYXlvdXRzKCkge1xuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlQ2FudmFzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHNGb3JTaWRlKHRoaXMuX3NlbGVjdFNpZGUpO1xuICAgIH1cbiAgICB1cGRhdGVMYXlvdXRzRm9yU2lkZShzaWRlKSB7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IHRoaXMuY2FudmFzZXMuZmluZChjID0+IGMuc2lkZSA9PT0gc2lkZSk7XG4gICAgICAgIGlmICghY2FudmFzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBvYmplY3RzID0gY2FudmFzLmdldE9iamVjdHMoKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0c1RvUmVtb3ZlID0gb2JqZWN0c1xuICAgICAgICAgICAgLmZpbHRlcihvYmogPT4gb2JqLm5hbWUgIT09ICdhcmVhOmJvcmRlcicgJiYgb2JqLm5hbWUgIT09ICdhcmVhOmNsaXAnICYmICFvYmoubmFtZT8uc3RhcnRzV2l0aCgnZ3VpZGVsaW5lJykpXG4gICAgICAgICAgICAuZmlsdGVyKG9iaiA9PiAhdGhpcy5sYXlvdXRzLmZpbmQobGF5b3V0ID0+IGxheW91dC5pZCA9PT0gb2JqLm5hbWUpKTtcbiAgICAgICAgb2JqZWN0c1RvUmVtb3ZlLmZvckVhY2gob2JqID0+IHtcbiAgICAgICAgICAgIGNhbnZhcy5yZW1vdmUob2JqKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGxheW91dHNGb3JTaWRlID0gdGhpcy5sYXlvdXRzLmZpbHRlcihsYXlvdXQgPT4gbGF5b3V0LnZpZXcgPT09IHNpZGUpO1xuICAgICAgICBjb25zdCBvYmplY3RzVG9VcGRhdGUgPSBbXTtcbiAgICAgICAgY29uc3Qgb2JqZWN0c1RvQWRkID0gW107XG4gICAgICAgIGxheW91dHNGb3JTaWRlLmZvckVhY2gobGF5b3V0ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nT2JqID0gb2JqZWN0cy5maW5kKG9iaiA9PiBvYmoubmFtZSA9PT0gbGF5b3V0LmlkKTtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ09iaikge1xuICAgICAgICAgICAgICAgIGlmIChsYXlvdXQuaXNJbWFnZUxheW91dCgpICYmIGV4aXN0aW5nT2JqLmxheW91dFVybCAhPT0gbGF5b3V0LnVybCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbY2FudmFzXSBMYXlvdXQgJHtsYXlvdXQuaWR9INC40LfQvNC10L3QuNC70YHRjywg0YLRgNC10LHRg9C10YLRgdGPINC+0LHQvdC+0LLQu9C10L3QuNC1YCk7XG4gICAgICAgICAgICAgICAgICAgIG9iamVjdHNUb1VwZGF0ZS5wdXNoKGxheW91dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgb2JqZWN0c1RvQWRkLnB1c2gobGF5b3V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIG9iamVjdHNUb1VwZGF0ZS5mb3JFYWNoKGxheW91dCA9PiB7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ09iaiA9IG9iamVjdHMuZmluZChvYmogPT4gb2JqLm5hbWUgPT09IGxheW91dC5pZCk7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdPYmopIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbY2FudmFzXSDQo9C00LDQu9GP0LXQvCDRgdGC0LDRgNGL0Lkg0L7QsdGK0LXQutGCINC00LvRjyDQvtCx0L3QvtCy0LvQtdC90LjRjzogJHtsYXlvdXQuaWR9YCk7XG4gICAgICAgICAgICAgICAgY2FudmFzLnJlbW92ZShleGlzdGluZ09iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbY2FudmFzXSDQlNC+0LHQsNCy0LvRj9C10Lwg0L7QsdC90L7QstC70LXQvdC90YvQuSDQvtCx0YrQtdC60YI6ICR7bGF5b3V0LmlkfWApO1xuICAgICAgICAgICAgdGhpcy5hZGRMYXlvdXRUb0NhbnZhcyhsYXlvdXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgb2JqZWN0c1RvQWRkLmZvckVhY2gobGF5b3V0ID0+IHtcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5b3V0VG9DYW52YXMobGF5b3V0KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNhbnZhcy5yZW5kZXJBbGwoKTtcbiAgICB9XG4gICAgYXN5bmMgcHJlbG9hZEFsbE1vY2t1cHMoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1twcmVsb2FkXSDQndCw0YfQsNC70L4g0L/RgNC10LTQt9Cw0LPRgNGD0LfQutC4IG1vY2t1cHMnKTtcbiAgICAgICAgZm9yIChjb25zdCBwcm9kdWN0IG9mIHRoaXMucHJvZHVjdENvbmZpZ3MpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbW9ja3VwIG9mIHByb2R1Y3QubW9ja3Vwcykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vY2t1cERhdGFVcmwgPSBhd2FpdCB0aGlzLmdldEltYWdlRGF0YShtb2NrdXAudXJsKTtcbiAgICAgICAgICAgICAgICAgICAgbW9ja3VwLnVybCA9IG1vY2t1cERhdGFVcmw7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtwcmVsb2FkXSBNb2NrdXAg0LfQsNCz0YDRg9C20LXQvTogJHttb2NrdXAuY29sb3IubmFtZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtwcmVsb2FkXSDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCBtb2NrdXAgJHttb2NrdXAudXJsfTpgLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1twcmVsb2FkXSDQn9GA0LXQtNC30LDQs9GA0YPQt9C60LAg0LfQsNCy0LXRgNGI0LXQvdCwJyk7XG4gICAgfVxuICAgIGFzeW5jIGdldEltYWdlRGF0YSh1cmwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9hZEFuZENvbnZlcnRJbWFnZSh1cmwpO1xuICAgIH1cbiAgICBhc3luYyB1cGxvYWRJbWFnZShmaWxlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWRdINCX0LDQs9GA0YPQt9C60LAg0YTQsNC50LvQsDonLCBmaWxlLm5hbWUpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGFVcmwgPSBlLnRhcmdldD8ucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWREYXRhVXJsID0gYXdhaXQgdGhpcy5nZXRJbWFnZURhdGEoZGF0YVVybCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWRdINCk0LDQudC7INGD0YHQv9C10YjQvdC+INC30LDQs9GA0YPQttC10L0nKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShjb252ZXJ0ZWREYXRhVXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ0lzc3VlKCdsb2FkX2ZpbGUnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZV9uYW1lOiBmaWxlLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1t1cGxvYWRdINCe0YjQuNCx0LrQsCDQvtCx0YDQsNCx0L7RgtC60Lgg0YTQsNC50LvQsDonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlYWRlci5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1t1cGxvYWRdINCe0YjQuNCx0LrQsCDRh9GC0LXQvdC40Y8g0YTQsNC50LvQsCcpO1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ9Cd0LUg0YPQtNCw0LvQvtGB0Ywg0L/RgNC+0YfQuNGC0LDRgtGMINGE0LDQudC7JykpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgdXBsb2FkSW1hZ2VUb1NlcnZlcihiYXNlNjQpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZF0g0JfQsNCz0YDRg9C30LrQsCDQuNC30L7QsdGA0LDQttC10L3QuNGPINC90LAg0YHQtdGA0LLQtdGAJyk7XG4gICAgICAgIGNvbnN0IHVzZXJJZCA9IGF3YWl0IHRoaXMuc3RvcmFnZU1hbmFnZXIuZ2V0VXNlcklkKCk7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godGhpcy5hcGlDb25maWcudXBsb2FkSW1hZ2UsIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBpbWFnZTogYmFzZTY0LCB1c2VyX2lkOiB1c2VySWQgfSksXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWRdINCY0LfQvtCx0YDQsNC20LXQvdC40LUg0LfQsNCz0YDRg9C20LXQvdC+INC90LAg0YHQtdGA0LLQtdGAOicsIGRhdGEuaW1hZ2VfdXJsKTtcbiAgICAgICAgcmV0dXJuIGRhdGEuaW1hZ2VfdXJsO1xuICAgIH1cbiAgICBnZXRQcm9kdWN0TmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKT8ucHJvZHVjdE5hbWUgfHwgJyc7XG4gICAgfVxuICAgIGNhcGl0YWxpemVGaXJzdExldHRlcihzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0cmluZy5zbGljZSgxKTtcbiAgICB9XG4gICAgZ2V0TW9ja3VwVXJsKHNpZGUpIHtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0KVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGNvbnN0IG1vY2t1cCA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG1vY2t1cCA9PiBtb2NrdXAuc2lkZSA9PT0gc2lkZSAmJiBtb2NrdXAuY29sb3IubmFtZSA9PT0gdGhpcy5fc2VsZWN0Q29sb3IubmFtZSk7XG4gICAgICAgIHJldHVybiBtb2NrdXAgPyBtb2NrdXAudXJsIDogbnVsbDtcbiAgICB9XG4gICAgYXN5bmMgZXhwb3J0QXJ0KHdpdGhNb2NrdXAgPSB0cnVlLCByZXNvbHV0aW9uID0gMTAyNCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgICAgY29uc3Qgc2lkZXNXaXRoTGF5ZXJzID0gdGhpcy5nZXRTaWRlc1dpdGhMYXllcnMoKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2V4cG9ydF0g0J3QsNC50LTQtdC90Ysg0YHRgtC+0YDQvtC90Ysg0YEg0YHQu9C+0Y/QvNC4OicsIHNpZGVzV2l0aExheWVycywgJyhmcm9udCDQv9C10YDQstGL0LkpJywgd2l0aE1vY2t1cCA/ICfRgSDQvNC+0LrQsNC/0L7QvCcgOiAn0LHQtdC3INC80L7QutCw0L/QsCcsIGDRgNCw0LfRgNC10YjQtdC90LjQtTogJHtyZXNvbHV0aW9ufXB4YCk7XG4gICAgICAgIGNvbnN0IGV4cG9ydFByb21pc2VzID0gc2lkZXNXaXRoTGF5ZXJzLm1hcChhc3luYyAoc2lkZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBleHBvcnRlZFNpZGUgPSBhd2FpdCB0aGlzLmV4cG9ydFNpZGUoc2lkZSwgd2l0aE1vY2t1cCwgcmVzb2x1dGlvbik7XG4gICAgICAgICAgICAgICAgaWYgKGV4cG9ydGVkU2lkZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQodGC0L7RgNC+0L3QsCAke3NpZGV9INGD0YHQv9C10YjQvdC+INGN0LrRgdC/0L7RgNGC0LjRgNC+0LLQsNC90LBgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgc2lkZSwgZGF0YTogZXhwb3J0ZWRTaWRlIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW2V4cG9ydF0g0J7RiNC40LHQutCwINC/0YDQuCDRjdC60YHQv9C+0YDRgtC1INGB0YLQvtGA0L7QvdGLICR7c2lkZX06YCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIGxvZ0lzc3VlKCdleHBvcnRfc2lkZV9lcnJvcicsIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgICAgICAgc2lkZTogc2lkZSxcbiAgICAgICAgICAgICAgICAgICAgd2l0aE1vY2t1cDogd2l0aE1vY2t1cCxcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x1dGlvbjogcmVzb2x1dGlvblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBleHBvcnRlZFNpZGVzID0gYXdhaXQgUHJvbWlzZS5hbGwoZXhwb3J0UHJvbWlzZXMpO1xuICAgICAgICBleHBvcnRlZFNpZGVzLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtpdGVtLnNpZGVdID0gaXRlbS5kYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0K3QutGB0L/QvtGA0YIg0LfQsNCy0LXRgNGI0LXQvSDQtNC70Y8gJHtPYmplY3Qua2V5cyhyZXN1bHQpLmxlbmd0aH0g0YHRgtC+0YDQvtC9YCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIGdldFNpZGVzV2l0aExheWVycygpIHtcbiAgICAgICAgY29uc3QgYWxsU2lkZXNXaXRoTGF5ZXJzID0gWy4uLm5ldyBTZXQodGhpcy5sYXlvdXRzLm1hcChsYXlvdXQgPT4gbGF5b3V0LnZpZXcpKV07XG4gICAgICAgIHJldHVybiBhbGxTaWRlc1dpdGhMYXllcnMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgaWYgKGEgPT09ICdmcm9udCcpXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgaWYgKGIgPT09ICdmcm9udCcpXG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIGV4cG9ydFNpZGUoc2lkZSwgd2l0aE1vY2t1cCA9IHRydWUsIHJlc29sdXRpb24gPSAxMDI0KSB7XG4gICAgICAgIGNvbnN0IGNhbnZhc2VzID0gdGhpcy5nZXRDYW52YXNlc0ZvclNpZGUoc2lkZSk7XG4gICAgICAgIGlmICghY2FudmFzZXMuZWRpdGFibGVDYW52YXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2V4cG9ydF0gQ2FudmFzINC00LvRjyDRgdGC0L7RgNC+0L3RiyAke3NpZGV9INC90LUg0L3QsNC50LTQtdC9YCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHNGb3JTaWRlKHNpZGUpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQrdC60YHQv9C+0YDRgtC40YDRg9C10Lwg0YHRgtC+0YDQvtC90YMgJHtzaWRlfSR7d2l0aE1vY2t1cCA/ICcg0YEg0LzQvtC60LDQv9C+0LwnIDogJyDQsdC10Lcg0LzQvtC60LDQv9CwJ30gKCR7cmVzb2x1dGlvbn1weCkuLi5gKTtcbiAgICAgICAgaWYgKCF3aXRoTW9ja3VwKSB7XG4gICAgICAgICAgICBjb25zdCBjcm9wcGVkQ2FudmFzID0gYXdhaXQgdGhpcy5leHBvcnREZXNpZ25XaXRoQ2xpcFBhdGgoY2FudmFzZXMuZWRpdGFibGVDYW52YXMsIGNhbnZhc2VzLmxheWVyc0NhbnZhcywgc2lkZSwgcmVzb2x1dGlvbik7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQrdC60YHQv9C+0YDRgtC40YDQvtCy0LDQvSDRh9C40YHRgtGL0Lkg0LTQuNC30LDQudC9INC00LvRjyAke3NpZGV9ICjQvtCx0YDQtdC30LDQvSDQv9C+IGNsaXBQYXRoKWApO1xuICAgICAgICAgICAgcmV0dXJuIGNyb3BwZWRDYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnLCAxLjApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1vY2t1cEltZyA9IGF3YWl0IHRoaXMubG9hZE1vY2t1cEZvclNpZGUoc2lkZSk7XG4gICAgICAgIGlmICghbW9ja3VwSW1nKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGNvbnN0IHByaW50Q29uZmlnID0gcHJvZHVjdD8ucHJpbnRDb25maWcuZmluZChwYyA9PiBwYy5zaWRlID09PSBzaWRlKTtcbiAgICAgICAgaWYgKCFwcmludENvbmZpZykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZXhwb3J0XSDQndC1INC90LDQudC00LXQvdCwINC60L7QvdGE0LjQs9GD0YDQsNGG0LjRjyDQv9C10YfQsNGC0Lgg0LTQu9GPICR7c2lkZX1gKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgY2FudmFzOiB0ZW1wQ2FudmFzLCBjdHgsIG1vY2t1cERpbWVuc2lvbnMgfSA9IHRoaXMuY3JlYXRlRXhwb3J0Q2FudmFzKHJlc29sdXRpb24sIG1vY2t1cEltZyk7XG4gICAgICAgIGNvbnN0IGNyb3BwZWREZXNpZ25DYW52YXMgPSBhd2FpdCB0aGlzLmV4cG9ydERlc2lnbldpdGhDbGlwUGF0aChjYW52YXNlcy5lZGl0YWJsZUNhbnZhcywgY2FudmFzZXMubGF5ZXJzQ2FudmFzLCBzaWRlLCByZXNvbHV0aW9uKTtcbiAgICAgICAgY29uc3QgcHJpbnRBcmVhV2lkdGggPSAocHJpbnRDb25maWcuc2l6ZS53aWR0aCAvIDYwMCkgKiBtb2NrdXBEaW1lbnNpb25zLndpZHRoO1xuICAgICAgICBjb25zdCBwcmludEFyZWFIZWlnaHQgPSAocHJpbnRDb25maWcuc2l6ZS5oZWlnaHQgLyA2MDApICogbW9ja3VwRGltZW5zaW9ucy5oZWlnaHQ7XG4gICAgICAgIGNvbnN0IHByaW50QXJlYVggPSBtb2NrdXBEaW1lbnNpb25zLnggKyAobW9ja3VwRGltZW5zaW9ucy53aWR0aCAtIHByaW50QXJlYVdpZHRoKSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueCAvIDEwMCkgKiBtb2NrdXBEaW1lbnNpb25zLndpZHRoO1xuICAgICAgICBjb25zdCBwcmludEFyZWFZID0gbW9ja3VwRGltZW5zaW9ucy55ICsgKG1vY2t1cERpbWVuc2lvbnMuaGVpZ2h0IC0gcHJpbnRBcmVhSGVpZ2h0KSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueSAvIDEwMCkgKiBtb2NrdXBEaW1lbnNpb25zLmhlaWdodDtcbiAgICAgICAgY3R4LmRyYXdJbWFnZShjcm9wcGVkRGVzaWduQ2FudmFzLCAwLCAwLCBjcm9wcGVkRGVzaWduQ2FudmFzLndpZHRoLCBjcm9wcGVkRGVzaWduQ2FudmFzLmhlaWdodCwgcHJpbnRBcmVhWCwgcHJpbnRBcmVhWSwgcHJpbnRBcmVhV2lkdGgsIHByaW50QXJlYUhlaWdodCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCd0LDQu9C+0LbQtdC9INC+0LHRgNC10LfQsNC90L3Ri9C5INC00LjQt9Cw0LnQvSAoY2xpcFBhdGgpINC90LAg0LzQvtC60LDQvyDQtNC70Y8gJHtzaWRlfSDQsiDQvtCx0LvQsNGB0YLQuCDQv9C10YfQsNGC0LggKCR7TWF0aC5yb3VuZChwcmludEFyZWFYKX0sICR7TWF0aC5yb3VuZChwcmludEFyZWFZKX0sICR7TWF0aC5yb3VuZChwcmludEFyZWFXaWR0aCl9eCR7TWF0aC5yb3VuZChwcmludEFyZWFIZWlnaHQpfSlgKTtcbiAgICAgICAgcmV0dXJuIHRlbXBDYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnLCAxLjApO1xuICAgIH1cbiAgICBnZXRDYW52YXNlc0ZvclNpZGUoc2lkZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZWRpdGFibGVDYW52YXM6IHRoaXMuY2FudmFzZXMuZmluZChjID0+IGMuc2lkZSA9PT0gc2lkZSksXG4gICAgICAgICAgICBsYXllcnNDYW52YXM6IHRoaXMubGF5ZXJzQ2FudmFzZXMuZmluZChjID0+IGMuc2lkZSA9PT0gc2lkZSlcbiAgICAgICAgfTtcbiAgICB9XG4gICAgYXN5bmMgbG9hZE1vY2t1cEZvclNpZGUoc2lkZSkge1xuICAgICAgICBjb25zdCBtb2NrdXBVcmwgPSB0aGlzLmdldE1vY2t1cFVybChzaWRlKTtcbiAgICAgICAgaWYgKCFtb2NrdXBVcmwpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2V4cG9ydF0g0JzQvtC60LDQvyDQtNC70Y8g0YHRgtC+0YDQvtC90YsgJHtzaWRlfSDQvdC1INC90LDQudC00LXQvWApO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbW9ja3VwSW1nID0gYXdhaXQgdGhpcy5sb2FkSW1hZ2UobW9ja3VwVXJsKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0JfQsNCz0YDRg9C20LXQvSDQvNC+0LrQsNC/INC00LvRjyAke3NpZGV9OiAke21vY2t1cFVybH1gKTtcbiAgICAgICAgcmV0dXJuIG1vY2t1cEltZztcbiAgICB9XG4gICAgY3JlYXRlRXhwb3J0Q2FudmFzKGV4cG9ydFNpemUsIG1vY2t1cEltZykge1xuICAgICAgICBjb25zdCB0ZW1wQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGNvbnN0IGN0eCA9IHRlbXBDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgdGVtcENhbnZhcy53aWR0aCA9IGV4cG9ydFNpemU7XG4gICAgICAgIHRlbXBDYW52YXMuaGVpZ2h0ID0gZXhwb3J0U2l6ZTtcbiAgICAgICAgY29uc3QgbW9ja3VwU2NhbGUgPSBNYXRoLm1pbihleHBvcnRTaXplIC8gbW9ja3VwSW1nLndpZHRoLCBleHBvcnRTaXplIC8gbW9ja3VwSW1nLmhlaWdodCk7XG4gICAgICAgIGNvbnN0IHNjYWxlZE1vY2t1cFdpZHRoID0gbW9ja3VwSW1nLndpZHRoICogbW9ja3VwU2NhbGU7XG4gICAgICAgIGNvbnN0IHNjYWxlZE1vY2t1cEhlaWdodCA9IG1vY2t1cEltZy5oZWlnaHQgKiBtb2NrdXBTY2FsZTtcbiAgICAgICAgY29uc3QgbW9ja3VwWCA9IChleHBvcnRTaXplIC0gc2NhbGVkTW9ja3VwV2lkdGgpIC8gMjtcbiAgICAgICAgY29uc3QgbW9ja3VwWSA9IChleHBvcnRTaXplIC0gc2NhbGVkTW9ja3VwSGVpZ2h0KSAvIDI7XG4gICAgICAgIGN0eC5kcmF3SW1hZ2UobW9ja3VwSW1nLCBtb2NrdXBYLCBtb2NrdXBZLCBzY2FsZWRNb2NrdXBXaWR0aCwgc2NhbGVkTW9ja3VwSGVpZ2h0KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0J3QsNGA0LjRgdC+0LLQsNC9INC80L7QutCw0L8g0LrQsNC6INGE0L7QvSAoJHtzY2FsZWRNb2NrdXBXaWR0aH14JHtzY2FsZWRNb2NrdXBIZWlnaHR9KWApO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY2FudmFzOiB0ZW1wQ2FudmFzLFxuICAgICAgICAgICAgY3R4LFxuICAgICAgICAgICAgbW9ja3VwRGltZW5zaW9uczoge1xuICAgICAgICAgICAgICAgIHg6IG1vY2t1cFgsXG4gICAgICAgICAgICAgICAgeTogbW9ja3VwWSxcbiAgICAgICAgICAgICAgICB3aWR0aDogc2NhbGVkTW9ja3VwV2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBzY2FsZWRNb2NrdXBIZWlnaHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgYXN5bmMgY3JlYXRlRGVzaWduQ2FudmFzKGVkaXRhYmxlQ2FudmFzLCBsYXllcnNDYW52YXMsIHNpZGUpIHtcbiAgICAgICAgY29uc3QgcXVhbGl0eU11bHRpcGxpZXIgPSAxMDtcbiAgICAgICAgY29uc3QgYmFzZVdpZHRoID0gZWRpdGFibGVDYW52YXMuZ2V0V2lkdGgoKTtcbiAgICAgICAgY29uc3QgYmFzZUhlaWdodCA9IGVkaXRhYmxlQ2FudmFzLmdldEhlaWdodCgpO1xuICAgICAgICBjb25zdCBkZXNpZ25DYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgY29uc3QgZGVzaWduQ3R4ID0gZGVzaWduQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIGRlc2lnbkNhbnZhcy53aWR0aCA9IGJhc2VXaWR0aCAqIHF1YWxpdHlNdWx0aXBsaWVyO1xuICAgICAgICBkZXNpZ25DYW52YXMuaGVpZ2h0ID0gYmFzZUhlaWdodCAqIHF1YWxpdHlNdWx0aXBsaWVyO1xuICAgICAgICBhd2FpdCB0aGlzLmFkZFN0YXRpY0xheWVyc1RvQ2FudmFzKGxheWVyc0NhbnZhcywgZGVzaWduQ3R4LCBkZXNpZ25DYW52YXMsIHNpZGUpO1xuICAgICAgICBhd2FpdCB0aGlzLmFkZEVkaXRhYmxlT2JqZWN0c1RvQ2FudmFzKGVkaXRhYmxlQ2FudmFzLCBkZXNpZ25DdHgsIGRlc2lnbkNhbnZhcywgYmFzZVdpZHRoLCBiYXNlSGVpZ2h0LCBzaWRlKTtcbiAgICAgICAgcmV0dXJuIGRlc2lnbkNhbnZhcztcbiAgICB9XG4gICAgYXN5bmMgYWRkU3RhdGljTGF5ZXJzVG9DYW52YXMobGF5ZXJzQ2FudmFzLCBjdHgsIGNhbnZhcywgc2lkZSkge1xuICAgICAgICBpZiAoIWxheWVyc0NhbnZhcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGxheWVyc0RhdGFVcmwgPSBsYXllcnNDYW52YXMudG9EYXRhVVJMKHtcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdwbmcnLFxuICAgICAgICAgICAgICAgIG11bHRpcGxpZXI6IDEwLFxuICAgICAgICAgICAgICAgIHF1YWxpdHk6IDEuMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBlbXB0eURhdGFVcmwgPSAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBRUFBQUFCQ0FZQUFBQWZGY1NKQUFBQURVbEVRVlI0Mm1Oa1lQaGZEd0FDaHdHQTYwZTZrZ0FBQUFCSlJVNUVya0pnZ2c9PSc7XG4gICAgICAgICAgICBpZiAobGF5ZXJzRGF0YVVybCAhPT0gZW1wdHlEYXRhVXJsICYmIGxheWVyc0RhdGFVcmwubGVuZ3RoID4gZW1wdHlEYXRhVXJsLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxheWVyc0ltZyA9IGF3YWl0IHRoaXMubG9hZEltYWdlKGxheWVyc0RhdGFVcmwpO1xuICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UobGF5ZXJzSW1nLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCU0L7QsdCw0LLQu9C10L3RiyDRgdGC0LDRgtC40YfQtdGB0LrQuNC1INGB0LvQvtC4INC00LvRjyAke3NpZGV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtleHBvcnRdINCe0YjQuNCx0LrQsCDRjdC60YHQv9C+0YDRgtCwINGB0YLQsNGC0LjRh9C10YHQutC40YUg0YHQu9C+0LXQsiDQtNC70Y8gJHtzaWRlfTpgLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgYWRkRWRpdGFibGVPYmplY3RzVG9DYW52YXMoZWRpdGFibGVDYW52YXMsIGN0eCwgY2FudmFzLCBiYXNlV2lkdGgsIGJhc2VIZWlnaHQsIHNpZGUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHRlbXBFZGl0YWJsZUNhbnZhcyA9IG5ldyBmYWJyaWMuU3RhdGljQ2FudmFzKG51bGwsIHtcbiAgICAgICAgICAgICAgICB3aWR0aDogYmFzZVdpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogYmFzZUhlaWdodCxcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd0cmFuc3BhcmVudCdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGVkaXRhYmxlQ2FudmFzLmNsaXBQYXRoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2xvbmVkQ2xpcCA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRhYmxlQ2FudmFzLmNsaXBQYXRoLmNsb25lKChjbG9uZWQpID0+IHJlc29sdmUoY2xvbmVkKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGVtcEVkaXRhYmxlQ2FudmFzLmNsaXBQYXRoID0gY2xvbmVkQ2xpcDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQn9GA0LjQvNC10L3RkdC9IGNsaXBQYXRoINC00LvRjyDRjdC60YHQv9C+0YDRgtCwINGB0YLQvtGA0L7QvdGLICR7c2lkZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRlc2lnbk9iamVjdHMgPSB0aGlzLmZpbHRlckRlc2lnbk9iamVjdHMoZWRpdGFibGVDYW52YXMuZ2V0T2JqZWN0cygpKTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qgb2JqIG9mIGRlc2lnbk9iamVjdHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjbG9uZWRPYmogPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBvYmouY2xvbmUoKGNsb25lZCkgPT4gcmVzb2x2ZShjbG9uZWQpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0ZW1wRWRpdGFibGVDYW52YXMuYWRkKGNsb25lZE9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkZXNpZ25EYXRhVXJsID0gdGVtcEVkaXRhYmxlQ2FudmFzLnRvRGF0YVVSTCh7XG4gICAgICAgICAgICAgICAgZm9ybWF0OiAncG5nJyxcbiAgICAgICAgICAgICAgICBtdWx0aXBsaWVyOiAxMCxcbiAgICAgICAgICAgICAgICBxdWFsaXR5OiAxLjBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgZW1wdHlEYXRhVXJsID0gJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQUVBQUFBQkNBWUFBQUFmRmNTSkFBQUFEVWxFUVZSNDJtTmtZUGhmRHdBQ2h3R0E2MGU2a2dBQUFBQkpSVTVFcmtKZ2dnPT0nO1xuICAgICAgICAgICAgaWYgKGRlc2lnbkRhdGFVcmwgIT09IGVtcHR5RGF0YVVybCAmJiBkZXNpZ25EYXRhVXJsLmxlbmd0aCA+IGVtcHR5RGF0YVVybC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkZXNpZ25JbWcgPSBhd2FpdCB0aGlzLmxvYWRJbWFnZShkZXNpZ25EYXRhVXJsKTtcbiAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKGRlc2lnbkltZywgMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQlNC+0LHQsNCy0LvQtdC90Ysg0L7QsdGK0LXQutGC0Ysg0LTQuNC30LDQudC90LAg0LHQtdC3INCz0YDQsNC90LjRhiDQtNC70Y8gJHtzaWRlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGVtcEVkaXRhYmxlQ2FudmFzLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2V4cG9ydF0g0J7RiNC40LHQutCwINGB0L7Qt9C00LDQvdC40Y8g0LTQuNC30LDQudC90LAg0LHQtdC3INCz0YDQsNC90LjRhiDQtNC70Y8gJHtzaWRlfTpgLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZmlsdGVyRGVzaWduT2JqZWN0cyhhbGxPYmplY3RzKSB7XG4gICAgICAgIGNvbnN0IHNlcnZpY2VPYmplY3ROYW1lcyA9IG5ldyBTZXQoW1xuICAgICAgICAgICAgXCJhcmVhOmJvcmRlclwiLFxuICAgICAgICAgICAgXCJhcmVhOmNsaXBcIixcbiAgICAgICAgICAgIFwiZ3VpZGVsaW5lXCIsXG4gICAgICAgICAgICBcImd1aWRlbGluZTp2ZXJ0aWNhbFwiLFxuICAgICAgICAgICAgXCJndWlkZWxpbmU6aG9yaXpvbnRhbFwiXG4gICAgICAgIF0pO1xuICAgICAgICByZXR1cm4gYWxsT2JqZWN0cy5maWx0ZXIoKG9iaikgPT4gIXNlcnZpY2VPYmplY3ROYW1lcy5oYXMob2JqLm5hbWUpKTtcbiAgICB9XG4gICAgYXN5bmMgZXhwb3J0RGVzaWduV2l0aENsaXBQYXRoKGVkaXRhYmxlQ2FudmFzLCBsYXllcnNDYW52YXMsIHNpZGUsIHJlc29sdXRpb24pIHtcbiAgICAgICAgY29uc3QgcXVhbGl0eU11bHRpcGxpZXIgPSAxMDtcbiAgICAgICAgY29uc3QgY2xpcFBhdGggPSBlZGl0YWJsZUNhbnZhcy5jbGlwUGF0aDtcbiAgICAgICAgaWYgKCFjbGlwUGF0aCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZXhwb3J0XSBjbGlwUGF0aCDQvdC1INC90LDQudC00LXQvSwg0Y3QutGB0L/QvtGA0YLQuNGA0YPQtdC8INCy0LXRgdGMIGNhbnZhcycpO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlRGVzaWduQ2FudmFzKGVkaXRhYmxlQ2FudmFzLCBsYXllcnNDYW52YXMsIHNpZGUpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNsaXBXaWR0aCA9IGNsaXBQYXRoLndpZHRoO1xuICAgICAgICBjb25zdCBjbGlwSGVpZ2h0ID0gY2xpcFBhdGguaGVpZ2h0O1xuICAgICAgICBjb25zdCBjbGlwTGVmdCA9IGNsaXBQYXRoLmxlZnQ7XG4gICAgICAgIGNvbnN0IGNsaXBUb3AgPSBjbGlwUGF0aC50b3A7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdIGNsaXBQYXRoOiAke2NsaXBXaWR0aH14JHtjbGlwSGVpZ2h0fSBhdCAoJHtjbGlwTGVmdH0sICR7Y2xpcFRvcH0pYCk7XG4gICAgICAgIGNvbnN0IGZ1bGxEZXNpZ25DYW52YXMgPSBhd2FpdCB0aGlzLmNyZWF0ZURlc2lnbkNhbnZhcyhlZGl0YWJsZUNhbnZhcywgbGF5ZXJzQ2FudmFzLCBzaWRlKTtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSByZXNvbHV0aW9uIC8gTWF0aC5tYXgoY2xpcFdpZHRoLCBjbGlwSGVpZ2h0KTtcbiAgICAgICAgY29uc3QgY3JvcHBlZENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBjcm9wcGVkQ2FudmFzLndpZHRoID0gY2xpcFdpZHRoICogc2NhbGU7XG4gICAgICAgIGNyb3BwZWRDYW52YXMuaGVpZ2h0ID0gY2xpcEhlaWdodCAqIHNjYWxlO1xuICAgICAgICBjb25zdCBjdHggPSBjcm9wcGVkQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIGNvbnN0IHNvdXJjZVNjYWxlID0gcXVhbGl0eU11bHRpcGxpZXI7XG4gICAgICAgIGN0eC5kcmF3SW1hZ2UoZnVsbERlc2lnbkNhbnZhcywgY2xpcExlZnQgKiBzb3VyY2VTY2FsZSwgY2xpcFRvcCAqIHNvdXJjZVNjYWxlLCBjbGlwV2lkdGggKiBzb3VyY2VTY2FsZSwgY2xpcEhlaWdodCAqIHNvdXJjZVNjYWxlLCAwLCAwLCBjcm9wcGVkQ2FudmFzLndpZHRoLCBjcm9wcGVkQ2FudmFzLmhlaWdodCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCU0LjQt9Cw0LnQvSDQvtCx0YDQtdC30LDQvSDQv9C+IGNsaXBQYXRoOiAke2Nyb3BwZWRDYW52YXMud2lkdGh9eCR7Y3JvcHBlZENhbnZhcy5oZWlnaHR9cHhgKTtcbiAgICAgICAgcmV0dXJuIGNyb3BwZWRDYW52YXM7XG4gICAgfVxuICAgIGFzeW5jIHVwbG9hZERlc2lnblRvU2VydmVyKGRlc2lnbnMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tleHBvcnRdINCX0LDQs9GA0YPQt9C60LAg0LTQuNC30LDQudC90LAg0L3QsCDRgdC10YDQstC10YAnKTtcbiAgICAgICAgICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtzaWRlLCBkYXRhVXJsXSBvZiBPYmplY3QuZW50cmllcyhkZXNpZ25zKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZGF0YVVybCk7XG4gICAgICAgICAgICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IHJlc3BvbnNlLmJsb2IoKTtcbiAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoc2lkZSwgYmxvYiwgYCR7c2lkZX0ucG5nYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tleHBvcnRdINCX0LDQs9GA0YPQt9C60LAg0L3QsCDRgdC10YDQstC10YAg0L3QtSDRgNC10LDQu9C40LfQvtCy0LDQvdCwJyk7XG4gICAgICAgICAgICByZXR1cm4gZGVzaWducztcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tleHBvcnRdINCe0YjQuNCx0LrQsCDQv9GA0Lgg0LfQsNCz0YDRg9C30LrQtSDQvdCwINGB0LXRgNCy0LXRgDonLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzYXZlTGF5ZXJzVG9IaXN0b3J5KCkge1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50SGlzdG9yeUluZGV4IDwgdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzSGlzdG9yeSA9IHRoaXMubGF5ZXJzSGlzdG9yeS5zbGljZSgwLCB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggKyAxKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsYXllcnNDb3B5ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0aGlzLmxheW91dHMpKTtcbiAgICAgICAgY29uc3QgaGlzdG9yeUl0ZW0gPSB7XG4gICAgICAgICAgICBsYXllcnM6IGxheWVyc0NvcHkubWFwKChkYXRhKSA9PiBuZXcgTGF5b3V0KGRhdGEpKSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmxheWVyc0hpc3RvcnkucHVzaChoaXN0b3J5SXRlbSk7XG4gICAgICAgIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA9IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxO1xuICAgICAgICBjb25zdCBNQVhfSElTVE9SWV9TSVpFID0gNTA7XG4gICAgICAgIGlmICh0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoID4gTUFYX0hJU1RPUllfU0laRSkge1xuICAgICAgICAgICAgdGhpcy5sYXllcnNIaXN0b3J5LnNoaWZ0KCk7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXgtLTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKGBbaGlzdG9yeV0g0KHQvtGF0YDQsNC90LXQvdC+INGB0L7RgdGC0L7Rj9C90LjQtSDRgdC70L7RkdCyLiDQmNC90LTQtdC60YE6ICR7dGhpcy5jdXJyZW50SGlzdG9yeUluZGV4fSwg0JLRgdC10LPQvjogJHt0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RofSwg0KHQu9C+0ZHQsjogJHt0aGlzLmxheW91dHMubGVuZ3RofWApO1xuICAgICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKTtcbiAgICB9XG4gICAgY2FuVW5kbygpIHtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA9PT0gdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoID49IDI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID4gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYW5SZWRvKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4IDwgdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDE7XG4gICAgfVxuICAgIHVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKSB7XG4gICAgICAgIGNvbnN0IGNhblVuZG8gPSB0aGlzLmNhblVuZG8oKTtcbiAgICAgICAgY29uc3QgY2FuUmVkbyA9IHRoaXMuY2FuUmVkbygpO1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JIaXN0b3J5VW5kb0Jsb2NrICYmIHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jay5maXJzdEVsZW1lbnRDaGlsZCkge1xuICAgICAgICAgICAgY29uc3QgdW5kb0J1dHRvbiA9IHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGlmIChjYW5VbmRvKSB7XG4gICAgICAgICAgICAgICAgdW5kb0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnJztcbiAgICAgICAgICAgICAgICB1bmRvQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHVuZG9CdXR0b24uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyNmMmYyZjInO1xuICAgICAgICAgICAgICAgIHVuZG9CdXR0b24uc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2sgJiYgdGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrLmZpcnN0RWxlbWVudENoaWxkKSB7XG4gICAgICAgICAgICBjb25zdCByZWRvQnV0dG9uID0gdGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgaWYgKGNhblJlZG8pIHtcbiAgICAgICAgICAgICAgICByZWRvQnV0dG9uLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcnO1xuICAgICAgICAgICAgICAgIHJlZG9CdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVkb0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnI2YyZjJmMic7XG4gICAgICAgICAgICAgICAgcmVkb0J1dHRvbi5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnldINCh0L7RgdGC0L7Rj9C90LjQtSDQutC90L7Qv9C+0Lo6IHVuZG8gPScsIGNhblVuZG8sICcsIHJlZG8gPScsIGNhblJlZG8pO1xuICAgIH1cbiAgICBhc3luYyB1bmRvKCkge1xuICAgICAgICBpZiAoIXRoaXMuY2FuVW5kbygpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbaGlzdG9yeV0gVW5kbyDQvdC10LLQvtC30LzQvtC20LXQvScpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPT09IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxICYmIHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggPj0gMikge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID0gdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPSBNYXRoLm1heCgwLCB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggLSAxKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBoaXN0b3J5SXRlbSA9IHRoaXMubGF5ZXJzSGlzdG9yeVt0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXhdO1xuICAgICAgICBpZiAoIWhpc3RvcnlJdGVtKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1toaXN0b3J5XSDQmNGB0YLQvtGA0LjRjyDQvdC1INC90LDQudC00LXQvdCwJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2hpc3RvcnldIFVuZG8g0Log0LjQvdC00LXQutGB0YMgJHt0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXh9INC40LcgJHt0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMX1gKTtcbiAgICAgICAgYXdhaXQgdGhpcy5yZXN0b3JlTGF5ZXJzRnJvbUhpc3RvcnkoaGlzdG9yeUl0ZW0pO1xuICAgICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGFzeW5jIHJlZG8oKSB7XG4gICAgICAgIGlmICghdGhpcy5jYW5SZWRvKCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5XSBSZWRvINC90LXQstC+0LfQvNC+0LbQtdC9Jyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4Kys7XG4gICAgICAgIGNvbnN0IGhpc3RvcnlJdGVtID0gdGhpcy5sYXllcnNIaXN0b3J5W3RoaXMuY3VycmVudEhpc3RvcnlJbmRleF07XG4gICAgICAgIGlmICghaGlzdG9yeUl0ZW0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2hpc3RvcnldINCY0YHRgtC+0YDQuNGPINC90LUg0L3QsNC50LTQtdC90LAnKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKGBbaGlzdG9yeV0gUmVkbyDQuiDQuNC90LTQtdC60YHRgyAke3RoaXMuY3VycmVudEhpc3RvcnlJbmRleH0g0LjQtyAke3RoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxfWApO1xuICAgICAgICBhd2FpdCB0aGlzLnJlc3RvcmVMYXllcnNGcm9tSGlzdG9yeShoaXN0b3J5SXRlbSk7XG4gICAgICAgIHRoaXMudXBkYXRlSGlzdG9yeUJ1dHRvbnNTdGF0ZSgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgYXN5bmMgcmVzdG9yZUxheWVyc0Zyb21IaXN0b3J5KGhpc3RvcnlJdGVtKSB7XG4gICAgICAgIHRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSA9IHRydWU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLmxheW91dHMgPSBbXTtcbiAgICAgICAgICAgIGhpc3RvcnlJdGVtLmxheWVycy5mb3JFYWNoKGxheW91dCA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXlvdXRzLnB1c2gobmV3IExheW91dChsYXlvdXQpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtoaXN0b3J5XSDQktC+0YHRgdGC0LDQvdC+0LLQu9C10L3QviAke3RoaXMubGF5b3V0cy5sZW5ndGh9INGB0LvQvtGR0LJgKTtcbiAgICAgICAgfVxuICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tlZGl0b3JdINCe0YfQuNGB0YLQutCwINGA0LXRgdGD0YDRgdC+0LIg0YDQtdC00LDQutGC0L7RgNCwJyk7XG4gICAgICAgIGlmICh0aGlzLmxvYWRpbmdJbnRlcnZhbCkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmxvYWRpbmdJbnRlcnZhbCk7XG4gICAgICAgICAgICB0aGlzLmxvYWRpbmdJbnRlcnZhbCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ldmVudHMuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLmNhbnZhc2VzLmZvckVhY2goY2FudmFzID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2FudmFzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbY2xlYW51cF0g0J7RiNC40LHQutCwINC+0YfQuNGB0YLQutC4IGNhbnZhczonLCBlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jYW52YXNlcyA9IFtdO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzLmZvckVhY2goY2FudmFzID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2FudmFzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbY2xlYW51cF0g0J7RiNC40LHQutCwINC+0YfQuNGB0YLQutC4IGxheWVyIGNhbnZhczonLCBlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5sYXllcnNDYW52YXNlcyA9IFtdO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZWRpdG9yXSDQoNC10YHRg9GA0YHRiyDRg9GB0L/QtdGI0L3QviDQvtGH0LjRidC10L3RiycpO1xuICAgIH1cbiAgICBnZXRDdXJyZW50U3RhdGUoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiB0aGlzLl9zZWxlY3RUeXBlLFxuICAgICAgICAgICAgY29sb3I6IHRoaXMuX3NlbGVjdENvbG9yLFxuICAgICAgICAgICAgc2lkZTogdGhpcy5fc2VsZWN0U2lkZSxcbiAgICAgICAgICAgIHNpemU6IHRoaXMuX3NlbGVjdFNpemUsXG4gICAgICAgICAgICBsYXlvdXRzOiB0aGlzLmxheW91dHMsXG4gICAgICAgICAgICBpc0xvYWRpbmc6IHRoaXMuaXNMb2FkaW5nLFxuICAgICAgICB9O1xuICAgIH1cbn1cbiIsImV4cG9ydCBjbGFzcyBFZGl0b3JTdG9yYWdlTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZGF0YWJhc2UgPSBudWxsO1xuICAgICAgICB0aGlzLmlzUmVhZHkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZWFkeVByb21pc2UgPSB0aGlzLmluaXQoKTtcbiAgICB9XG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9wZW5SZXF1ZXN0ID0gaW5kZXhlZERCLm9wZW4oXCJlZGl0b3JcIiwgMik7XG4gICAgICAgICAgICBvcGVuUmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRhYmFzZSA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgaWYgKCFkYXRhYmFzZS5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKCdoaXN0b3J5JykpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlT2JqZWN0U3RvcmUoJ2hpc3RvcnknLCB7IGtleVBhdGg6ICdpZCcgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghZGF0YWJhc2Uub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucygnZWRpdG9yX3N0YXRlJykpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlT2JqZWN0U3RvcmUoJ2VkaXRvcl9zdGF0ZScsIHsga2V5UGF0aDogJ2tleScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghZGF0YWJhc2Uub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucygndXNlcl9kYXRhJykpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlT2JqZWN0U3RvcmUoJ3VzZXJfZGF0YScsIHsga2V5UGF0aDogJ2tleScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG9wZW5SZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcItCe0YjQuNCx0LrQsCDQvtGC0LrRgNGL0YLQuNGPIEluZGV4ZWREQlwiLCBvcGVuUmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG9wZW5SZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBvcGVuUmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhYmFzZSA9IG9wZW5SZXF1ZXN0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICB0aGlzLmlzUmVhZHkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyB3YWl0Rm9yUmVhZHkoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMucmVhZHlQcm9taXNlO1xuICAgIH1cbiAgICBhc3luYyBzYXZlRWRpdG9yU3RhdGUoc3RhdGUpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2VkaXRvcl9zdGF0ZSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2VkaXRvcl9zdGF0ZScpO1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICdkYXRlJywgc3RhdGUuZGF0ZSksXG4gICAgICAgICAgICB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICdjb2xvcicsIHN0YXRlLmNvbG9yKSxcbiAgICAgICAgICAgIHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ3NpZGUnLCBzdGF0ZS5zaWRlKSxcbiAgICAgICAgICAgIHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ3R5cGUnLCBzdGF0ZS50eXBlKSxcbiAgICAgICAgICAgIHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ3NpemUnLCBzdGF0ZS5zaXplKVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgYXN5bmMgbG9hZEVkaXRvclN0YXRlKCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnZWRpdG9yX3N0YXRlJ10sICdyZWFkb25seScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdlZGl0b3Jfc3RhdGUnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IFtkYXRlLCBjb2xvciwgc2lkZSwgdHlwZSwgc2l6ZV0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICAgICAgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAnZGF0ZScpLFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ2NvbG9yJyksXG4gICAgICAgICAgICAgICAgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAnc2lkZScpLFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ3R5cGUnKSxcbiAgICAgICAgICAgICAgICB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICdzaXplJylcbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgaWYgKCFkYXRlIHx8ICFjb2xvciB8fCAhc2lkZSB8fCAhdHlwZSB8fCAhc2l6ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBkYXRlLFxuICAgICAgICAgICAgICAgIGNvbG9yLFxuICAgICAgICAgICAgICAgIHNpZGUsXG4gICAgICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgICAgICBzaXplXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcign0J7RiNC40LHQutCwINC30LDQs9GA0YPQt9C60Lgg0YHQvtGB0YLQvtGP0L3QuNGPINGA0LXQtNCw0LrRgtC+0YDQsDonLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBjbGVhckVkaXRvclN0YXRlKCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnZWRpdG9yX3N0YXRlJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnZWRpdG9yX3N0YXRlJyk7XG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlRGF0YShvYmplY3RTdG9yZSwgJ2RhdGUnKSxcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlRGF0YShvYmplY3RTdG9yZSwgJ2NvbG9yJyksXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZURhdGEob2JqZWN0U3RvcmUsICdzaWRlJyksXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZURhdGEob2JqZWN0U3RvcmUsICd0eXBlJyksXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZURhdGEob2JqZWN0U3RvcmUsICdzaXplJylcbiAgICAgICAgXSk7XG4gICAgfVxuICAgIGFzeW5jIGdldFVzZXJJZCgpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ3VzZXJfZGF0YSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3VzZXJfZGF0YScpO1xuICAgICAgICBsZXQgdXNlcklkID0gYXdhaXQgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAndXNlcklkJyk7XG4gICAgICAgIGlmICghdXNlcklkKSB7XG4gICAgICAgICAgICB1c2VySWQgPSBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wdXREYXRhKG9iamVjdFN0b3JlLCAndXNlcklkJywgdXNlcklkKTtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgd2luZG93Lk9wZW5SZXBsYXkuc2V0VXNlcklEKHVzZXJJZCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfQntGI0LjQsdC60LAg0YPRgdGC0LDQvdC+0LLQutC4IElEINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjyDQsiB0cmFja2VyOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXNlcklkO1xuICAgIH1cbiAgICBhc3luYyBzYXZlVG9IaXN0b3J5KGl0ZW0sIGRlc2NyaXB0aW9uKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCBoaXN0b3J5SXRlbSA9IHtcbiAgICAgICAgICAgIC4uLml0ZW0sXG4gICAgICAgICAgICBpZDogY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbiB8fCBg0JjQt9C80LXQvdC10L3QuNGPINC+0YIgJHtuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCl9YFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydoaXN0b3J5J10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuYWRkKGhpc3RvcnlJdGVtKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGhpc3RvcnlJdGVtLmlkO1xuICAgIH1cbiAgICBhc3luYyBzYXZlTGF5ZXJPcGVyYXRpb24ob3BlcmF0aW9uLCBsYXlvdXQsIHNpZGUsIHR5cGUsIGRlc2NyaXB0aW9uKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCBsYXllckhpc3RvcnlJdGVtID0ge1xuICAgICAgICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICAgICAgICBvcGVyYXRpb24sXG4gICAgICAgICAgICBsYXlvdXQ6IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobGF5b3V0KSksXG4gICAgICAgICAgICBzaWRlLFxuICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbiB8fCBgJHtvcGVyYXRpb24gPT09ICdhZGQnID8gJ9CU0L7QsdCw0LLQu9C10L0nIDogJ9Cj0LTQsNC70LXQvSd9INGB0LvQvtC5OiAke2xheW91dC5uYW1lIHx8IGxheW91dC50eXBlfWBcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmFkZCh7IC4uLmxheWVySGlzdG9yeUl0ZW0sIGlzTGF5ZXJPcGVyYXRpb246IHRydWUgfSk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBsYXllckhpc3RvcnlJdGVtLmlkO1xuICAgIH1cbiAgICBhc3luYyBnZXRMYXllckhpc3RvcnkoZmlsdGVyLCBsaW1pdCA9IDUwKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydoaXN0b3J5J10sICdyZWFkb25seScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuZ2V0QWxsKCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhbGxJdGVtcyA9IHJlcXVlc3QucmVzdWx0O1xuICAgICAgICAgICAgICAgIGNvbnN0IGxheWVyT3BlcmF0aW9ucyA9IGFsbEl0ZW1zXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uaXNMYXllck9wZXJhdGlvbiAmJiBpdGVtLnNpZGUgPT09IGZpbHRlci5zaWRlICYmIGl0ZW0udHlwZSA9PT0gZmlsdGVyLnR5cGUpXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKGl0ZW0pID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBpdGVtLmlkLFxuICAgICAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IGl0ZW0udGltZXN0YW1wLFxuICAgICAgICAgICAgICAgICAgICBvcGVyYXRpb246IGl0ZW0ub3BlcmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICBsYXlvdXQ6IGl0ZW0ubGF5b3V0LFxuICAgICAgICAgICAgICAgICAgICBzaWRlOiBpdGVtLnNpZGUsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGl0ZW0udHlwZSxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGl0ZW0uZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IGIudGltZXN0YW1wIC0gYS50aW1lc3RhbXApXG4gICAgICAgICAgICAgICAgICAgIC5zbGljZSgwLCBsaW1pdCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShsYXllck9wZXJhdGlvbnMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIGdldFJlY2VudExheWVyT3BlcmF0aW9ucyhmaWx0ZXIsIGxpbWl0ID0gMTApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TGF5ZXJIaXN0b3J5KGZpbHRlciwgbGltaXQpO1xuICAgIH1cbiAgICBhc3luYyBnZXRIaXN0b3J5KGZpbHRlciwgbGltaXQgPSA1MCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZG9ubHknKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmdldEFsbCgpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsSXRlbXMgPSByZXF1ZXN0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJlZEl0ZW1zID0gYWxsSXRlbXNcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihpdGVtID0+IGl0ZW0uc2lkZSA9PT0gZmlsdGVyLnNpZGUgJiYgaXRlbS50eXBlID09PSBmaWx0ZXIudHlwZSlcbiAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IGIudGltZXN0YW1wIC0gYS50aW1lc3RhbXApXG4gICAgICAgICAgICAgICAgICAgIC5zbGljZSgwLCBsaW1pdCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShmaWx0ZXJlZEl0ZW1zKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBnZXRIaXN0b3J5SXRlbShpZCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZG9ubHknKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmdldChpZCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUocmVxdWVzdC5yZXN1bHQgfHwgbnVsbCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBkZWxldGVIaXN0b3J5SXRlbShpZCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmRlbGV0ZShpZCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIGNsZWFySGlzdG9yeShmaWx0ZXIpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIGlmICghZmlsdGVyKSB7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBhbGxJdGVtcyA9IGF3YWl0IHRoaXMuZ2V0SGlzdG9yeShmaWx0ZXIsIDEwMDApO1xuICAgICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGFsbEl0ZW1zKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5kZWxldGVIaXN0b3J5SXRlbShpdGVtLmlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBzYXZlTGF5ZXJzKGxheWVycykge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnZWRpdG9yX3N0YXRlJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnZWRpdG9yX3N0YXRlJyk7XG4gICAgICAgIGF3YWl0IHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ2xheWVycycsIGxheWVycyk7XG4gICAgfVxuICAgIGFzeW5jIGxvYWRMYXllcnMoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnZWRpdG9yX3N0YXRlJ10sICdyZWFkb25seScpO1xuICAgICAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnZWRpdG9yX3N0YXRlJyk7XG4gICAgICAgICAgICBjb25zdCBsYXllcnMgPSBhd2FpdCB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICdsYXllcnMnKTtcbiAgICAgICAgICAgIHJldHVybiBsYXllcnMgfHwgbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ9Ce0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4INGB0LvQvtGR0LI6JywgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHV0RGF0YShvYmplY3RTdG9yZSwga2V5LCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLnB1dCh7IGtleSwgdmFsdWUgfSk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldERhdGEob2JqZWN0U3RvcmUsIGtleSkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmdldChrZXkpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKHJlcXVlc3QucmVzdWx0Py52YWx1ZSB8fCBudWxsKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGRlbGV0ZURhdGEob2JqZWN0U3RvcmUsIGtleSkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiIsImNvbnN0IERFRkFVTFRfVkFMVUVTID0ge1xuICAgIFBPU0lUSU9OOiB7IHg6IDAuNSwgeTogMC41IH0sXG4gICAgU0laRTogMSxcbiAgICBBU1BFQ1RfUkFUSU86IDEsXG4gICAgQU5HTEU6IDAsXG4gICAgVEVYVDogJ1ByaW50TG9vcCcsXG4gICAgRk9OVDogeyBmYW1pbHk6ICdBcmlhbCcsIHNpemU6IDEyIH0sXG59O1xuZXhwb3J0IGNsYXNzIExheW91dCB7XG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgdGhpcy5pZCA9IHByb3BzLmlkIHx8IExheW91dC5nZW5lcmF0ZUlkKCk7XG4gICAgICAgIHRoaXMudHlwZSA9IHByb3BzLnR5cGU7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwcm9wcy5wb3NpdGlvbiB8fCB7IC4uLkRFRkFVTFRfVkFMVUVTLlBPU0lUSU9OIH07XG4gICAgICAgIHRoaXMuc2l6ZSA9IHRoaXMudmFsaWRhdGVTaXplKHByb3BzLnNpemUgPz8gREVGQVVMVF9WQUxVRVMuU0laRSk7XG4gICAgICAgIHRoaXMuYXNwZWN0UmF0aW8gPSB0aGlzLnZhbGlkYXRlQXNwZWN0UmF0aW8ocHJvcHMuYXNwZWN0UmF0aW8gPz8gREVGQVVMVF9WQUxVRVMuQVNQRUNUX1JBVElPKTtcbiAgICAgICAgdGhpcy52aWV3ID0gcHJvcHMudmlldztcbiAgICAgICAgdGhpcy5hbmdsZSA9IHRoaXMubm9ybWFsaXplQW5nbGUocHJvcHMuYW5nbGUgPz8gREVGQVVMVF9WQUxVRVMuQU5HTEUpO1xuICAgICAgICB0aGlzLm5hbWUgPSBwcm9wcy5uYW1lID8/IG51bGw7XG4gICAgICAgIHRoaXMuX3JlbGF0aXZlV2lkdGggPSBwcm9wcy5fcmVsYXRpdmVXaWR0aDtcbiAgICAgICAgaWYgKHByb3BzLnR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgICAgIHRoaXMudXJsID0gcHJvcHMudXJsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHByb3BzLnR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgICAgICAgdGhpcy50ZXh0ID0gcHJvcHMudGV4dCB8fCBERUZBVUxUX1ZBTFVFUy5URVhUO1xuICAgICAgICAgICAgdGhpcy5mb250ID0gcHJvcHMuZm9udCA/IHsgLi4ucHJvcHMuZm9udCB9IDogeyAuLi5ERUZBVUxUX1ZBTFVFUy5GT05UIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljIGdlbmVyYXRlSWQoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY3J5cHRvICE9PSAndW5kZWZpbmVkJyAmJiBjcnlwdG8ucmFuZG9tVVVJRCkge1xuICAgICAgICAgICAgcmV0dXJuIGNyeXB0by5yYW5kb21VVUlEKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGAke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIsIDExKX1gO1xuICAgIH1cbiAgICB2YWxpZGF0ZVNpemUoc2l6ZSkge1xuICAgICAgICBpZiAoc2l6ZSA8PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEludmFsaWQgc2l6ZSAke3NpemV9LCB1c2luZyBkZWZhdWx0ICR7REVGQVVMVF9WQUxVRVMuU0laRX1gKTtcbiAgICAgICAgICAgIHJldHVybiBERUZBVUxUX1ZBTFVFUy5TSVpFO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaXplO1xuICAgIH1cbiAgICB2YWxpZGF0ZUFzcGVjdFJhdGlvKHJhdGlvKSB7XG4gICAgICAgIGlmIChyYXRpbyA8PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEludmFsaWQgYXNwZWN0IHJhdGlvICR7cmF0aW99LCB1c2luZyBkZWZhdWx0ICR7REVGQVVMVF9WQUxVRVMuQVNQRUNUX1JBVElPfWApO1xuICAgICAgICAgICAgcmV0dXJuIERFRkFVTFRfVkFMVUVTLkFTUEVDVF9SQVRJTztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmF0aW87XG4gICAgfVxuICAgIG5vcm1hbGl6ZUFuZ2xlKGFuZ2xlKSB7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBhbmdsZSAlIDM2MDtcbiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQgPCAwID8gbm9ybWFsaXplZCArIDM2MCA6IG5vcm1hbGl6ZWQ7XG4gICAgfVxuICAgIGlzSW1hZ2VMYXlvdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGUgPT09ICdpbWFnZScgJiYgdGhpcy51cmwgIT09IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaXNUZXh0TGF5b3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlID09PSAndGV4dCcgJiYgdGhpcy50ZXh0ICE9PSB1bmRlZmluZWQgJiYgdGhpcy5mb250ICE9PSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHNldFBvc2l0aW9uKHgsIHkpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHsgeCwgeSB9O1xuICAgIH1cbiAgICBtb3ZlKGR4LCBkeSkge1xuICAgICAgICB0aGlzLnBvc2l0aW9uLnggKz0gZHg7XG4gICAgICAgIHRoaXMucG9zaXRpb24ueSArPSBkeTtcbiAgICB9XG4gICAgc2V0U2l6ZShzaXplKSB7XG4gICAgICAgIHRoaXMuc2l6ZSA9IHRoaXMudmFsaWRhdGVTaXplKHNpemUpO1xuICAgIH1cbiAgICByb3RhdGUoYW5nbGUpIHtcbiAgICAgICAgdGhpcy5hbmdsZSA9IHRoaXMubm9ybWFsaXplQW5nbGUodGhpcy5hbmdsZSArIGFuZ2xlKTtcbiAgICB9XG4gICAgc2V0QW5nbGUoYW5nbGUpIHtcbiAgICAgICAgdGhpcy5hbmdsZSA9IHRoaXMubm9ybWFsaXplQW5nbGUoYW5nbGUpO1xuICAgIH1cbiAgICBzZXRUZXh0KHRleHQpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNUZXh0TGF5b3V0KCkpIHtcbiAgICAgICAgICAgIHRoaXMudGV4dCA9IHRleHQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0Rm9udChmb250KSB7XG4gICAgICAgIGlmICh0aGlzLmlzVGV4dExheW91dCgpICYmIHRoaXMuZm9udCkge1xuICAgICAgICAgICAgdGhpcy5mb250ID0geyAuLi50aGlzLmZvbnQsIC4uLmZvbnQgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjbG9uZSgpIHtcbiAgICAgICAgaWYgKHRoaXMudHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgICAgICAgY29uc3QgcHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlJyxcbiAgICAgICAgICAgICAgICB1cmw6IHRoaXMudXJsLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7IC4uLnRoaXMucG9zaXRpb24gfSxcbiAgICAgICAgICAgICAgICBzaXplOiB0aGlzLnNpemUsXG4gICAgICAgICAgICAgICAgYXNwZWN0UmF0aW86IHRoaXMuYXNwZWN0UmF0aW8sXG4gICAgICAgICAgICAgICAgdmlldzogdGhpcy52aWV3LFxuICAgICAgICAgICAgICAgIGFuZ2xlOiB0aGlzLmFuZ2xlLFxuICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCBjbG9uZWQgPSBuZXcgTGF5b3V0KHByb3BzKTtcbiAgICAgICAgICAgIGNsb25lZC5fcmVsYXRpdmVXaWR0aCA9IHRoaXMuX3JlbGF0aXZlV2lkdGg7XG4gICAgICAgICAgICByZXR1cm4gY2xvbmVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgcHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7IC4uLnRoaXMucG9zaXRpb24gfSxcbiAgICAgICAgICAgICAgICBzaXplOiB0aGlzLnNpemUsXG4gICAgICAgICAgICAgICAgYXNwZWN0UmF0aW86IHRoaXMuYXNwZWN0UmF0aW8sXG4gICAgICAgICAgICAgICAgdmlldzogdGhpcy52aWV3LFxuICAgICAgICAgICAgICAgIGFuZ2xlOiB0aGlzLmFuZ2xlLFxuICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAodGhpcy50ZXh0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBwcm9wcy50ZXh0ID0gdGhpcy50ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZm9udCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcHJvcHMuZm9udCA9IHsgLi4udGhpcy5mb250IH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjbG9uZWQgPSBuZXcgTGF5b3V0KHByb3BzKTtcbiAgICAgICAgICAgIGNsb25lZC5fcmVsYXRpdmVXaWR0aCA9IHRoaXMuX3JlbGF0aXZlV2lkdGg7XG4gICAgICAgICAgICByZXR1cm4gY2xvbmVkO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRvSlNPTigpIHtcbiAgICAgICAgY29uc3QgYmFzZSA9IHtcbiAgICAgICAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMucG9zaXRpb24sXG4gICAgICAgICAgICBzaXplOiB0aGlzLnNpemUsXG4gICAgICAgICAgICBhc3BlY3RSYXRpbzogdGhpcy5hc3BlY3RSYXRpbyxcbiAgICAgICAgICAgIHZpZXc6IHRoaXMudmlldyxcbiAgICAgICAgICAgIGFuZ2xlOiB0aGlzLmFuZ2xlLFxuICAgICAgICAgICAgbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICAgICAgX3JlbGF0aXZlV2lkdGg6IHRoaXMuX3JlbGF0aXZlV2lkdGgsXG4gICAgICAgIH07XG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgICAgIHJldHVybiB7IC4uLmJhc2UsIHVybDogdGhpcy51cmwgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLnR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgICAgICAgcmV0dXJuIHsgLi4uYmFzZSwgdGV4dDogdGhpcy50ZXh0LCBmb250OiB0aGlzLmZvbnQgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmFzZTtcbiAgICB9XG4gICAgc3RhdGljIGZyb21KU09OKGpzb24pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMYXlvdXQoanNvbik7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGVJbWFnZShwcm9wcykge1xuICAgICAgICByZXR1cm4gbmV3IExheW91dCh7IC4uLnByb3BzLCB0eXBlOiAnaW1hZ2UnIH0pO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlVGV4dChwcm9wcykge1xuICAgICAgICByZXR1cm4gbmV3IExheW91dCh7IC4uLnByb3BzLCB0eXBlOiAndGV4dCcgfSk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGNsYXNzIFR5cGVkRXZlbnRFbWl0dGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIG9uKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgICBpZiAoIXRoaXMubGlzdGVuZXJzLmhhcyhldmVudCkpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLnNldChldmVudCwgbmV3IFNldCgpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpc3RlbmVycy5nZXQoZXZlbnQpLmFkZChsaXN0ZW5lcik7XG4gICAgfVxuICAgIG9uY2UoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIGNvbnN0IG9uY2VXcmFwcGVyID0gKGRldGFpbCkgPT4ge1xuICAgICAgICAgICAgbGlzdGVuZXIoZGV0YWlsKTtcbiAgICAgICAgICAgIHRoaXMub2ZmKGV2ZW50LCBvbmNlV3JhcHBlcik7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMub24oZXZlbnQsIG9uY2VXcmFwcGVyKTtcbiAgICB9XG4gICAgb2ZmKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgICBjb25zdCBldmVudExpc3RlbmVycyA9IHRoaXMubGlzdGVuZXJzLmdldChldmVudCk7XG4gICAgICAgIGlmIChldmVudExpc3RlbmVycykge1xuICAgICAgICAgICAgZXZlbnRMaXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcbiAgICAgICAgICAgIGlmIChldmVudExpc3RlbmVycy5zaXplID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuZGVsZXRlKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBlbWl0KGV2ZW50LCBkZXRhaWwpIHtcbiAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycy5nZXQoZXZlbnQpO1xuICAgICAgICBpZiAoZXZlbnRMaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIGV2ZW50TGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyKGRldGFpbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbRXZlbnRFbWl0dGVyXSDQntGI0LjQsdC60LAg0LIg0L7QsdGA0LDQsdC+0YLRh9C40LrQtSDRgdC+0LHRi9GC0LjRjyBcIiR7U3RyaW5nKGV2ZW50KX1cIjpgLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudCkge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuZGVsZXRlKGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmNsZWFyKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGlzdGVuZXJDb3VudChldmVudCkge1xuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lcnMuZ2V0KGV2ZW50KT8uc2l6ZSB8fCAwO1xuICAgIH1cbiAgICBoYXNMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXJDb3VudChldmVudCkgPiAwO1xuICAgIH1cbiAgICBldmVudE5hbWVzKCkge1xuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLmxpc3RlbmVycy5rZXlzKCkpO1xuICAgIH1cbiAgICBkZXN0cm95KCkge1xuICAgICAgICB0aGlzLmxpc3RlbmVycy5jbGVhcigpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IEVkaXRvclN0b3JhZ2VNYW5hZ2VyIH0gZnJvbSAnLi4vbWFuYWdlcnMvRWRpdG9yU3RvcmFnZU1hbmFnZXInO1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlSW1hZ2UoeyB1cmksIHByb21wdCwgc2hpcnRDb2xvciwgaW1hZ2UsIHdpdGhBaSwgbGF5b3V0SWQsIGlzTmV3ID0gdHJ1ZSwgYmFja2dyb3VuZCA9IHRydWUsIH0pIHtcbiAgICBjb25zdCB0ZW1wU3RvcmFnZU1hbmFnZXIgPSBuZXcgRWRpdG9yU3RvcmFnZU1hbmFnZXIoKTtcbiAgICBjb25zdCB1c2VySWQgPSBhd2FpdCB0ZW1wU3RvcmFnZU1hbmFnZXIuZ2V0VXNlcklkKCk7XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3VzZXJJZCcsIHVzZXJJZCk7XG4gICAgZm9ybURhdGEuc2V0KCdwcm9tcHQnLCBwcm9tcHQgfHwgXCJcIik7XG4gICAgZm9ybURhdGEuc2V0KCdzaGlydENvbG9yJywgc2hpcnRDb2xvcik7XG4gICAgZm9ybURhdGEuc2V0KCdwbGFjZW1lbnQnLCAnY2VudGVyJyk7XG4gICAgZm9ybURhdGEuc2V0KCdwcmludFNpemUnLCBcImJpZ1wiKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3RyYW5zZmVyVHlwZScsICcnKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3JlcXVlc3RfdHlwZScsICdnZW5lcmF0ZScpO1xuICAgIGZvcm1EYXRhLnNldCgnYmFja2dyb3VuZCcsIGJhY2tncm91bmQ/LnRvU3RyaW5nKCkgfHwgXCJ0cnVlXCIpO1xuICAgIGlmIChsYXlvdXRJZClcbiAgICAgICAgZm9ybURhdGEuc2V0KCdsYXlvdXRJZCcsIGxheW91dElkKTtcbiAgICBpZiAoaW1hZ2UpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2dlbmVyYXRlIGltYWdlXScsIGltYWdlKTtcbiAgICAgICAgY29uc3QgW2hlYWRlciwgZGF0YV0gPSBpbWFnZS5zcGxpdCgnLCcpO1xuICAgICAgICBjb25zdCB0eXBlID0gaGVhZGVyLnNwbGl0KCc6JylbMV0uc3BsaXQoJzsnKVswXTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2dlbmVyYXRlIGltYWdlXSBbdHlwZV0nLCB0eXBlKTtcbiAgICAgICAgY29uc3QgYnl0ZUNoYXJhY3RlcnMgPSBhdG9iKGRhdGEpO1xuICAgICAgICBjb25zdCBieXRlTnVtYmVycyA9IG5ldyBBcnJheShieXRlQ2hhcmFjdGVycy5sZW5ndGgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJ5dGVDaGFyYWN0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBieXRlTnVtYmVyc1tpXSA9IGJ5dGVDaGFyYWN0ZXJzLmNoYXJDb2RlQXQoaSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYnl0ZUFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYnl0ZU51bWJlcnMpO1xuICAgICAgICBmb3JtRGF0YS5zZXQoJ3JlcXVlc3RfdHlwZScsICdpbWFnZScpO1xuICAgICAgICBmb3JtRGF0YS5zZXQoJ3VzZXJfaW1hZ2UnLCBuZXcgQmxvYihbYnl0ZUFycmF5XSwgeyB0eXBlOiBcImltYWdlL3BuZ1wiIH0pKTtcbiAgICAgICAgZm9ybURhdGEuc2V0KCd0cmFuc2ZlclR5cGUnLCB3aXRoQWkgPyBcImFpXCIgOiBcIm5vLWFpXCIpO1xuICAgIH1cbiAgICBpZiAoIWlzTmV3KSB7XG4gICAgICAgIGZvcm1EYXRhLnNldCgncmVxdWVzdF90eXBlJywgJ2VkaXQnKTtcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmksIHtcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgYm9keTogZm9ybURhdGEsXG4gICAgfSk7XG4gICAgY29uc3QgcmVzcG9uc2VEYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgIHJldHVybiByZXNwb25zZURhdGEuaW1hZ2VfdXJsIHx8IHJlc3BvbnNlRGF0YS5pbWFnZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQcm9kdWN0KHsgcXVhbnRpdHksIG5hbWUsIHNpemUsIGNvbG9yLCBzaWRlcywgYXJ0aWNsZSwgcHJpY2UgfSkge1xuICAgIGNvbnN0IHByb2R1Y3RJZCA9ICc2OTgzNDE2NDI4MzJfJyArIERhdGUubm93KCk7XG4gICAgY29uc3QgZGVzaWduVmFyaWFudCA9IHNpZGVzLmxlbmd0aCA+IDEgPyBgPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiR7c2lkZXNbMF0/LmltYWdlX3VybH1cIiB0YXJnZXQ9XCJfYmxhbmtcIj4ke3NpZGVzWzBdPy5pbWFnZV91cmwuc2xpY2UoLTEwKX08L2E+LCA8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiJHtzaWRlc1sxXT8uaW1hZ2VfdXJsfVwiIHRhcmdldD1cIl9ibGFua1wiPiR7c2lkZXNbMV0/LmltYWdlX3VybC5zbGljZSgtMTApfTwvYT5gIDogYDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCIke3NpZGVzWzBdPy5pbWFnZV91cmx9XCIgdGFyZ2V0PVwiX2JsYW5rXCI+JHtzaWRlc1swXT8uaW1hZ2VfdXJsLnNsaWNlKC0xMCl9PC9hPmA7XG4gICAgY29uc3QgcmVzdWx0UHJvZHVjdCA9IHtcbiAgICAgICAgaWQ6IHByb2R1Y3RJZCxcbiAgICAgICAgbmFtZSxcbiAgICAgICAgcHJpY2UsXG4gICAgICAgIHF1YW50aXR5OiBxdWFudGl0eSxcbiAgICAgICAgaW1nOiBzaWRlc1swXT8uaW1hZ2VfdXJsLFxuICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICB7IG9wdGlvbjogJ9Cg0LDQt9C80LXRgCcsIHZhcmlhbnQ6IHNpemUgfSxcbiAgICAgICAgICAgIHsgb3B0aW9uOiAn0JTQuNC30LDQudC9JywgdmFyaWFudDogZGVzaWduVmFyaWFudCB9LFxuICAgICAgICAgICAgeyBvcHRpb246ICfQkNGA0YLQuNC60YPQuycsIHZhcmlhbnQ6IGFydGljbGUgfSxcbiAgICAgICAgICAgIHsgb3B0aW9uOiAn0KbQstC10YInLCB2YXJpYW50OiBjb2xvci5uYW1lIH0sXG4gICAgICAgICAgICB7IG9wdGlvbjogJ9Cf0YDQuNC90YInLCB2YXJpYW50OiBzaWRlcy5sZW5ndGggPT0gMSA/ICfQntC00L3QvtGB0YLQvtGA0L7QvdC90LjQuScgOiAn0JTQstGD0YXRgdGC0L7RgNC+0L3QvdC40LknIH0sXG4gICAgICAgIF1cbiAgICB9O1xuICAgIGNvbnNvbGUuZGVidWcoJ1tjYXJ0XSBhZGQgcHJvZHVjdCcsIHJlc3VsdFByb2R1Y3QpO1xuICAgIGlmICh0eXBlb2Ygd2luZG93LnRjYXJ0X19hZGRQcm9kdWN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB3aW5kb3cudGNhcnRfX2FkZFByb2R1Y3QocmVzdWx0UHJvZHVjdCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy55bSgxMDMyNzkyMTQsICdyZWFjaEdvYWwnLCAnYWRkX3RvX2NhcnQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikgeyB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbY2FydF0g0J7RiNC40LHQutCwINC/0YDQuCDQtNC+0LHQsNCy0LvQtdC90LjQuCDQv9GA0L7QtNGD0LrRgtCwINCyINC60L7RgNC30LjQvdGDJywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1tjYXJ0XSDQmtC+0YDQt9C40L3QsCBUaWxkYSDQvdC1INC30LDQs9GA0YPQttC10L3QsC4nKTtcbiAgICB9XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlTGF5b3V0RGltZW5zaW9ucyhsYXlvdXQsIHByb2R1Y3QsIGNvbnRhaW5lcldpZHRoLCBjb250YWluZXJIZWlnaHQpIHtcbiAgICBjb25zdCBwcmludENvbmZpZyA9IHByb2R1Y3QucHJpbnRDb25maWcuZmluZChwYyA9PiBwYy5zaWRlID09PSBsYXlvdXQudmlldyk7XG4gICAgaWYgKCFwcmludENvbmZpZykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFByaW50IGNvbmZpZyBub3QgZm91bmQgZm9yIHNpZGU6ICR7bGF5b3V0LnZpZXd9YCk7XG4gICAgfVxuICAgIGNvbnN0IHByaW50QXJlYVdpZHRoID0gKHByaW50Q29uZmlnLnNpemUud2lkdGggLyA2MDApICogY29udGFpbmVyV2lkdGg7XG4gICAgY29uc3QgcHJpbnRBcmVhSGVpZ2h0ID0gKHByaW50Q29uZmlnLnNpemUuaGVpZ2h0IC8gNjAwKSAqIGNvbnRhaW5lckhlaWdodDtcbiAgICBjb25zdCBwcmludEFyZWFMZWZ0ID0gTWF0aC5yb3VuZCgoY29udGFpbmVyV2lkdGggLSBwcmludEFyZWFXaWR0aCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnggLyAxMDApICogY29udGFpbmVyV2lkdGgpO1xuICAgIGNvbnN0IHByaW50QXJlYVRvcCA9IE1hdGgucm91bmQoKGNvbnRhaW5lckhlaWdodCAtIHByaW50QXJlYUhlaWdodCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnkgLyAxMDApICogY29udGFpbmVySGVpZ2h0KTtcbiAgICBjb25zdCBsZWZ0ID0gcHJpbnRBcmVhTGVmdCArIChwcmludEFyZWFXaWR0aCAqIGxheW91dC5wb3NpdGlvbi54KTtcbiAgICBjb25zdCB0b3AgPSBwcmludEFyZWFUb3AgKyAocHJpbnRBcmVhSGVpZ2h0ICogbGF5b3V0LnBvc2l0aW9uLnkpO1xuICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQsXG4gICAgICAgIHRvcCxcbiAgICAgICAgc2NhbGVYOiBsYXlvdXQuc2l6ZSxcbiAgICAgICAgc2NhbGVZOiBsYXlvdXQuc2l6ZSAqIGxheW91dC5hc3BlY3RSYXRpbyxcbiAgICAgICAgYW5nbGU6IGxheW91dC5hbmdsZSxcbiAgICAgICAgcHJpbnRBcmVhV2lkdGgsXG4gICAgICAgIHByaW50QXJlYUhlaWdodCxcbiAgICAgICAgcHJpbnRBcmVhTGVmdCxcbiAgICAgICAgcHJpbnRBcmVhVG9wXG4gICAgfTtcbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJMYXlvdXQocGFyYW1zKSB7XG4gICAgY29uc3QgeyBsYXlvdXQsIHByb2R1Y3QsIGNvbnRhaW5lcldpZHRoLCBjb250YWluZXJIZWlnaHQsIGxvYWRJbWFnZSB9ID0gcGFyYW1zO1xuICAgIGNvbnN0IGRpbWVuc2lvbnMgPSBjYWxjdWxhdGVMYXlvdXREaW1lbnNpb25zKGxheW91dCwgcHJvZHVjdCwgY29udGFpbmVyV2lkdGgsIGNvbnRhaW5lckhlaWdodCk7XG4gICAgY29uc3QgZmFicmljID0gd2luZG93LmZhYnJpYztcbiAgICBpZiAoIWZhYnJpYykge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdbcmVuZGVyTGF5b3V0XSBmYWJyaWMuanMg0L3QtSDQt9Cw0LPRgNGD0LbQtdC9Jyk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAobGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSkge1xuICAgICAgICBjb25zdCBpbWcgPSBhd2FpdCBsb2FkSW1hZ2UobGF5b3V0LnVybCk7XG4gICAgICAgIGNvbnN0IGltYWdlID0gbmV3IGZhYnJpYy5JbWFnZShpbWcpO1xuICAgICAgICBsZXQgYWN0dWFsU2NhbGUgPSBsYXlvdXQuc2l6ZTtcbiAgICAgICAgY29uc3QgcmVsYXRpdmVXaWR0aCA9IGxheW91dC5fcmVsYXRpdmVXaWR0aDtcbiAgICAgICAgaWYgKHJlbGF0aXZlV2lkdGggJiYgcmVsYXRpdmVXaWR0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldFdpZHRoID0gZGltZW5zaW9ucy5wcmludEFyZWFXaWR0aCAqIHJlbGF0aXZlV2lkdGg7XG4gICAgICAgICAgICBhY3R1YWxTY2FsZSA9IHRhcmdldFdpZHRoIC8gaW1nLndpZHRoO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3JlbmRlckxheW91dF0g0JDQtNCw0L/RgtCw0YbQuNGPINC6INC90L7QstC+0LzRgyDRgNCw0LfQvNC10YDRgzogcmVsYXRpdmVXaWR0aD0ke3JlbGF0aXZlV2lkdGgudG9GaXhlZCgzKX0sIHRhcmdldFdpZHRoPSR7dGFyZ2V0V2lkdGgudG9GaXhlZCgxKX1weCwgc2NhbGU9JHthY3R1YWxTY2FsZS50b0ZpeGVkKDMpfWApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGxheW91dC5zaXplID09PSAxICYmIGltZy53aWR0aCA+IGRpbWVuc2lvbnMucHJpbnRBcmVhV2lkdGgpIHtcbiAgICAgICAgICAgIGFjdHVhbFNjYWxlID0gZGltZW5zaW9ucy5wcmludEFyZWFXaWR0aCAvIGltZy53aWR0aDtcbiAgICAgICAgICAgIGxheW91dC5zaXplID0gYWN0dWFsU2NhbGU7XG4gICAgICAgICAgICBjb25zdCBvYmplY3RXaWR0aCA9IGltZy53aWR0aCAqIGFjdHVhbFNjYWxlO1xuICAgICAgICAgICAgY29uc3QgcmVsVyA9IG9iamVjdFdpZHRoIC8gZGltZW5zaW9ucy5wcmludEFyZWFXaWR0aDtcbiAgICAgICAgICAgIGxheW91dC5fcmVsYXRpdmVXaWR0aCA9IHJlbFc7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbcmVuZGVyTGF5b3V0XSDQkNCy0YLQvtC/0L7QtNCz0L7QvdC60LAg0YDQsNC30LzQtdGA0LA6ICR7aW1nLndpZHRofXB4IOKGkiAke2RpbWVuc2lvbnMucHJpbnRBcmVhV2lkdGh9cHgsIHNjYWxlPSR7YWN0dWFsU2NhbGUudG9GaXhlZCgzKX0sIHJlbGF0aXZlV2lkdGg9JHtyZWxXLnRvRml4ZWQoMyl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIXJlbGF0aXZlV2lkdGggfHwgcmVsYXRpdmVXaWR0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc3Qgb2JqZWN0V2lkdGggPSBpbWcud2lkdGggKiBsYXlvdXQuc2l6ZTtcbiAgICAgICAgICAgIGNvbnN0IHJlbFcgPSBvYmplY3RXaWR0aCAvIGRpbWVuc2lvbnMucHJpbnRBcmVhV2lkdGg7XG4gICAgICAgICAgICBsYXlvdXQuX3JlbGF0aXZlV2lkdGggPSByZWxXO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3JlbmRlckxheW91dF0g0JLRi9GH0LjRgdC70LXQvSBfcmVsYXRpdmVXaWR0aCDQtNC70Y8g0YHRgtCw0YDQvtCz0L4gbGF5b3V0OiAke3JlbFcudG9GaXhlZCgzKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBpbWFnZS5zZXQoe1xuICAgICAgICAgICAgbGVmdDogZGltZW5zaW9ucy5sZWZ0LFxuICAgICAgICAgICAgdG9wOiBkaW1lbnNpb25zLnRvcCxcbiAgICAgICAgICAgIHNjYWxlWDogYWN0dWFsU2NhbGUsXG4gICAgICAgICAgICBzY2FsZVk6IGFjdHVhbFNjYWxlICogbGF5b3V0LmFzcGVjdFJhdGlvLFxuICAgICAgICAgICAgYW5nbGU6IGRpbWVuc2lvbnMuYW5nbGUsXG4gICAgICAgICAgICBuYW1lOiBsYXlvdXQuaWQsXG4gICAgICAgICAgICBsYXlvdXRVcmw6IGxheW91dC51cmwsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaW1hZ2U7XG4gICAgfVxuICAgIGVsc2UgaWYgKGxheW91dC5pc1RleHRMYXlvdXQoKSkge1xuICAgICAgICBjb25zdCB0ZXh0ID0gbmV3IGZhYnJpYy5UZXh0KGxheW91dC50ZXh0LCB7XG4gICAgICAgICAgICBmb250RmFtaWx5OiBsYXlvdXQuZm9udC5mYW1pbHksXG4gICAgICAgICAgICBmb250U2l6ZTogbGF5b3V0LmZvbnQuc2l6ZSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRleHQuc2V0KHtcbiAgICAgICAgICAgIGxlZnQ6IGRpbWVuc2lvbnMubGVmdCxcbiAgICAgICAgICAgIHRvcDogZGltZW5zaW9ucy50b3AsXG4gICAgICAgICAgICBzY2FsZVg6IGRpbWVuc2lvbnMuc2NhbGVYLFxuICAgICAgICAgICAgc2NhbGVZOiBkaW1lbnNpb25zLnNjYWxlWSxcbiAgICAgICAgICAgIGFuZ2xlOiBkaW1lbnNpb25zLmFuZ2xlLFxuICAgICAgICAgICAgbmFtZTogbGF5b3V0LmlkLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlckxheW91dFRvQ2FudmFzKGN0eCwgbGF5b3V0LCBwcm9kdWN0LCBjb250YWluZXJXaWR0aCwgY29udGFpbmVySGVpZ2h0LCBsb2FkSW1hZ2UpIHtcbiAgICBjb25zdCBkaW1lbnNpb25zID0gY2FsY3VsYXRlTGF5b3V0RGltZW5zaW9ucyhsYXlvdXQsIHByb2R1Y3QsIGNvbnRhaW5lcldpZHRoLCBjb250YWluZXJIZWlnaHQpO1xuICAgIGlmIChsYXlvdXQuaXNJbWFnZUxheW91dCgpKSB7XG4gICAgICAgIGNvbnN0IGltZyA9IGF3YWl0IGxvYWRJbWFnZShsYXlvdXQudXJsKTtcbiAgICAgICAgY3R4LnNhdmUoKTtcbiAgICAgICAgY3R4LnRyYW5zbGF0ZShkaW1lbnNpb25zLmxlZnQsIGRpbWVuc2lvbnMudG9wKTtcbiAgICAgICAgY3R4LnJvdGF0ZSgoZGltZW5zaW9ucy5hbmdsZSAqIE1hdGguUEkpIC8gMTgwKTtcbiAgICAgICAgY29uc3Qgd2lkdGggPSBpbWcud2lkdGggKiBkaW1lbnNpb25zLnNjYWxlWDtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gaW1nLmhlaWdodCAqIGRpbWVuc2lvbnMuc2NhbGVZO1xuICAgICAgICBjdHguZHJhd0ltYWdlKGltZywgMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGxheW91dC5pc1RleHRMYXlvdXQoKSkge1xuICAgICAgICBjdHguc2F2ZSgpO1xuICAgICAgICBjdHgudHJhbnNsYXRlKGRpbWVuc2lvbnMubGVmdCwgZGltZW5zaW9ucy50b3ApO1xuICAgICAgICBjdHgucm90YXRlKChkaW1lbnNpb25zLmFuZ2xlICogTWF0aC5QSSkgLyAxODApO1xuICAgICAgICBjdHguZm9udCA9IGAke2xheW91dC5mb250LnNpemUgKiBkaW1lbnNpb25zLnNjYWxlWH1weCAke2xheW91dC5mb250LmZhbWlseX1gO1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gJ2JsYWNrJztcbiAgICAgICAgY3R4LmZpbGxUZXh0KGxheW91dC50ZXh0LCAwLCAwKTtcbiAgICAgICAgY3R4LnJlc3RvcmUoKTtcbiAgICB9XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gZ2V0TGFzdENoaWxkKGVsZW1lbnQpIHtcbiAgICBpZiAoIWVsZW1lbnQpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIGlmICghZWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZClcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgcmV0dXJuIGdldExhc3RDaGlsZChlbGVtZW50LmZpcnN0RWxlbWVudENoaWxkKTtcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IEVkaXRvciBmcm9tICcuLi9jb21wb25lbnRzL0VkaXRvcic7XG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB3aW5kb3cuRWRpdG9yID0gRWRpdG9yO1xufVxuZXhwb3J0IGRlZmF1bHQgRWRpdG9yO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9