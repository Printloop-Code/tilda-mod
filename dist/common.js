"use strict";
(this["webpackChunkfrontend_project"] = this["webpackChunkfrontend_project"] || []).push([["common"],{

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
    formData.set('prompt', prompt);
    formData.set('shirtColor', shirtColor);
    formData.set('placement', 'center');
    formData.set('printSize', "big");
    formData.set('transferType', '');
    formData.set('request_type', 'generate');
    formData.set('background', background.toString());
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

/***/ "./src/utils/safeRouteIntegrationV2.ts":
/*!*********************************************!*\
  !*** ./src/utils/safeRouteIntegrationV2.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SafeRouteIntegrationV2: () => (/* binding */ SafeRouteIntegrationV2),
/* harmony export */   initSafeRouteV2: () => (/* binding */ initSafeRouteV2)
/* harmony export */ });
class SafeRouteIntegrationV2 {
    constructor() {
        this.phoneData = null;
        this.initialized = false;
        this.originalFormDataAppend = null;
        this.init();
    }
    init() {
        if (this.initialized)
            return;
        console.log('[SafeRoute V2] 🚀 Инициализация агрессивной версии...');
        window.addEventListener('message', this.handleMessage.bind(this));
        this.interceptFormData();
        this.interceptXHR();
        this.interceptFetch();
        this.interceptSubmit();
        this.initialized = true;
        console.log('[SafeRoute V2] ✅ Инициализация завершена');
        window.safeRouteV2 = this;
    }
    handleMessage(event) {
        if (!event.origin.includes('saferoute.ru'))
            return;
        try {
            const data = typeof event.data === 'string'
                ? JSON.parse(event.data)
                : event.data;
            console.log('[SafeRoute V2] 📬 Сообщение от SafeRoute');
            const phone = this.extractPhone(data);
            if (phone) {
                console.log('[SafeRoute V2] 📱 Телефон:', phone);
                this.setPhone(phone);
            }
        }
        catch (error) {
            console.debug('[SafeRoute V2] Ошибка обработки:', error);
        }
    }
    extractPhone(data) {
        return data.phone ||
            data.data?.contacts?.phone ||
            data.contacts?.phone ||
            data.recipient?.phone ||
            null;
    }
    setPhone(phone) {
        const parsed = this.parsePhone(phone);
        if (!parsed) {
            console.warn('[SafeRoute V2] ❌ Не удалось распарсить:', phone);
            return;
        }
        this.phoneData = parsed;
        console.log('[SafeRoute V2] ✅ Телефон сохранен:', this.phoneData);
        try {
            sessionStorage.setItem('sr_phone', JSON.stringify(this.phoneData));
        }
        catch (e) { }
        this.fillPhoneFields();
    }
    parsePhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 0)
            return null;
        let iso = '+7';
        let number = cleaned;
        if (cleaned.startsWith('7') && cleaned.length === 11) {
            number = cleaned.substring(1);
        }
        else if (cleaned.startsWith('8') && cleaned.length === 11) {
            number = cleaned.substring(1);
        }
        else if (cleaned.length === 10) {
        }
        else {
            return null;
        }
        const formatted = this.formatPhone(number);
        return {
            iso: iso,
            number: formatted,
            full: `${iso} ${formatted}`
        };
    }
    formatPhone(phone) {
        if (phone.length !== 10)
            return phone;
        return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6, 8)}-${phone.substring(8, 10)}`;
    }
    fillPhoneFields() {
        if (!this.phoneData)
            return;
        const forms = document.querySelectorAll('form');
        let filled = false;
        forms.forEach(form => {
            const isoInput = this.ensureInput(form, 'tildaspec-phone-part[]-iso', 'hidden');
            const numberInput = this.ensureInput(form, 'tildaspec-phone-part[]', 'tel');
            const phoneInput = this.ensureInput(form, 'phone', 'hidden');
            if (isoInput && this.phoneData) {
                isoInput.value = this.phoneData.iso;
                filled = true;
            }
            if (numberInput && this.phoneData) {
                numberInput.value = this.phoneData.number;
                filled = true;
            }
            if (phoneInput && this.phoneData) {
                phoneInput.value = this.phoneData.full;
                filled = true;
            }
        });
        if (filled) {
            console.log('[SafeRoute V2] ✅ Поля заполнены');
        }
    }
    ensureInput(form, name, type) {
        let input = form.querySelector(`input[name="${name}"]`);
        if (!input) {
            input = document.createElement('input');
            input.type = type;
            input.name = name;
            input.style.display = 'none';
            form.appendChild(input);
            console.log('[SafeRoute V2] ➕ Создано поле:', name);
        }
        return input;
    }
    interceptFormData() {
        const self = this;
        const OriginalFormData = window.FormData;
        window.FormData = function (form) {
            const formData = new OriginalFormData(form);
            if (self.phoneData) {
                if (!formData.has('phone') || !formData.get('phone')) {
                    formData.set('tildaspec-phone-part[]-iso', self.phoneData.iso);
                    formData.set('tildaspec-phone-part[]', self.phoneData.number);
                    formData.set('phone', self.phoneData.full);
                    console.log('[SafeRoute V2] 📦 Телефон добавлен в FormData');
                }
            }
            return formData;
        };
        window.FormData.prototype = OriginalFormData.prototype;
        console.log('[SafeRoute V2] ✅ FormData перехвачен');
    }
    interceptXHR() {
        const self = this;
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function (method, url, ...args) {
            this._url = url;
            this._method = method;
            return originalOpen.apply(this, [method, url, ...args]);
        };
        XMLHttpRequest.prototype.send = function (body) {
            const url = this._url || '';
            if (url.includes('forms.tildaapi.com') || url.includes('/form/submit')) {
                console.log('[SafeRoute V2] 🌐 Перехват XHR к:', url);
                if (self.phoneData && body instanceof FormData) {
                    if (!body.has('phone') || !body.get('phone')) {
                        body.set('tildaspec-phone-part[]-iso', self.phoneData.iso);
                        body.set('tildaspec-phone-part[]', self.phoneData.number);
                        body.set('phone', self.phoneData.full);
                        console.log('[SafeRoute V2] ✅ Телефон добавлен в XHR');
                    }
                }
                else if (self.phoneData && typeof body === 'string') {
                    const params = new URLSearchParams(body);
                    if (!params.has('phone') || !params.get('phone')) {
                        params.set('tildaspec-phone-part[]-iso', self.phoneData.iso);
                        params.set('tildaspec-phone-part[]', self.phoneData.number);
                        params.set('phone', self.phoneData.full);
                        body = params.toString();
                        console.log('[SafeRoute V2] ✅ Телефон добавлен в XHR (URLEncoded)');
                    }
                }
            }
            return originalSend.call(this, body);
        };
        console.log('[SafeRoute V2] ✅ XMLHttpRequest перехвачен');
    }
    interceptFetch() {
        const self = this;
        const originalFetch = window.fetch;
        window.fetch = function (input, init) {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
            if (url.includes('forms.tildaapi.com') || url.includes('/form/submit')) {
                console.log('[SafeRoute V2] 🌐 Перехват fetch к:', url);
                if (self.phoneData && init?.body instanceof FormData) {
                    if (!init.body.has('phone') || !init.body.get('phone')) {
                        init.body.set('tildaspec-phone-part[]-iso', self.phoneData.iso);
                        init.body.set('tildaspec-phone-part[]', self.phoneData.number);
                        init.body.set('phone', self.phoneData.full);
                        console.log('[SafeRoute V2] ✅ Телефон добавлен в fetch');
                    }
                }
            }
            return originalFetch.apply(window, [input, init]);
        };
        console.log('[SafeRoute V2] ✅ fetch перехвачен');
    }
    interceptSubmit() {
        document.addEventListener('submit', (event) => {
            const form = event.target;
            console.log('[SafeRoute V2] 📤 Submit формы:', form.action);
            if (this.phoneData) {
                this.fillPhoneFields();
            }
            if (!this.phoneData) {
                try {
                    const saved = sessionStorage.getItem('sr_phone');
                    if (saved) {
                        this.phoneData = JSON.parse(saved);
                        this.fillPhoneFields();
                    }
                }
                catch (e) { }
            }
        }, true);
        console.log('[SafeRoute V2] ✅ Submit перехвачен');
    }
    getPhone() {
        return this.phoneData;
    }
}
let instance = null;
function initSafeRouteV2() {
    if (!instance) {
        instance = new SafeRouteIntegrationV2();
    }
    return instance;
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSafeRouteV2);
}
else {
    initSafeRouteV2();
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

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBLGdCQUFnQixnQkFBZ0I7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLDJCQUEyQjtBQUN2QztBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0EsNENBQTRDO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUMsZ0JBQWdCLElBQUk7QUFDM0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLFdBQVcsR0FBRyw0Q0FBNEM7QUFDNUU7QUFDQTtBQUNBO0FBQ0EseUNBQXlDLEtBQUssa0JBQWtCLG9CQUFvQjtBQUNwRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBaUQsTUFBTSxrQkFBa0IsNEJBQTRCO0FBQ3JHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBCQUEwQjtBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEI7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEIsa0JBQWtCO0FBQzlDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNEJBQTRCLGtCQUFrQjtBQUM5QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtCQUErQjtBQUMvQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNEJBQTRCLHlCQUF5QjtBQUNyRDtBQUNBO0FBQ0EsNEJBQTRCLHdCQUF3QjtBQUNwRDtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7QUNySk87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrRkFBa0YsY0FBYztBQUNoRztBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7OztBQzNEd0U7QUFDakUsK0JBQStCLG9GQUFvRjtBQUMxSCxtQ0FBbUMsZ0ZBQW9CO0FBQ3ZEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtEQUFrRDtBQUNsRDtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsMkJBQTJCO0FBQ25EO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkRBQTJELG1CQUFtQjtBQUM5RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNPLHlCQUF5QixvREFBb0Q7QUFDcEY7QUFDQSx5RUFBeUUsb0JBQW9CLG9CQUFvQiwrQkFBK0IsaUNBQWlDLG9CQUFvQixvQkFBb0IsK0JBQStCLG9DQUFvQyxvQkFBb0Isb0JBQW9CLCtCQUErQjtBQUNuVztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWMsaUNBQWlDO0FBQy9DLGNBQWMsMENBQTBDO0FBQ3hELGNBQWMscUNBQXFDO0FBQ25ELGNBQWMscUNBQXFDO0FBQ25ELGNBQWMsaUZBQWlGO0FBQy9GO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7OztBQ3pFTztBQUNQO0FBQ0E7QUFDQSw0REFBNEQsWUFBWTtBQUN4RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1AsWUFBWSw4REFBOEQ7QUFDMUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNGQUFzRix5QkFBeUIsZ0JBQWdCLHVCQUF1QixZQUFZLHVCQUF1QjtBQUN6TDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtFQUFrRSxVQUFVLE9BQU8sMEJBQTBCLFlBQVksdUJBQXVCLGtCQUFrQixnQkFBZ0I7QUFDbEw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdGQUF3RixnQkFBZ0I7QUFDeEc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCLHFDQUFxQyxLQUFLLG1CQUFtQjtBQUNuRjtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FDeEdPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUIsS0FBSyxFQUFFLFVBQVU7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixzQkFBc0IsSUFBSSxzQkFBc0IsR0FBRyxzQkFBc0IsR0FBRyx1QkFBdUI7QUFDdEg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNEQUFzRCxLQUFLO0FBQzNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7OztBQzVPTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvbW9kZWxzL0xheW91dC50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL3V0aWxzL1R5cGVkRXZlbnRFbWl0dGVyLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvdXRpbHMvYXBpLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvdXRpbHMvY2FudmFzVXRpbHMudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy91dGlscy9zYWZlUm91dGVJbnRlZ3JhdGlvblYyLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvdXRpbHMvdGlsZGFVdGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBERUZBVUxUX1ZBTFVFUyA9IHtcbiAgICBQT1NJVElPTjogeyB4OiAwLjUsIHk6IDAuNSB9LFxuICAgIFNJWkU6IDEsXG4gICAgQVNQRUNUX1JBVElPOiAxLFxuICAgIEFOR0xFOiAwLFxuICAgIFRFWFQ6ICdQcmludExvb3AnLFxuICAgIEZPTlQ6IHsgZmFtaWx5OiAnQXJpYWwnLCBzaXplOiAxMiB9LFxufTtcbmV4cG9ydCBjbGFzcyBMYXlvdXQge1xuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHRoaXMuaWQgPSBwcm9wcy5pZCB8fCBMYXlvdXQuZ2VuZXJhdGVJZCgpO1xuICAgICAgICB0aGlzLnR5cGUgPSBwcm9wcy50eXBlO1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gcHJvcHMucG9zaXRpb24gfHwgeyAuLi5ERUZBVUxUX1ZBTFVFUy5QT1NJVElPTiB9O1xuICAgICAgICB0aGlzLnNpemUgPSB0aGlzLnZhbGlkYXRlU2l6ZShwcm9wcy5zaXplID8/IERFRkFVTFRfVkFMVUVTLlNJWkUpO1xuICAgICAgICB0aGlzLmFzcGVjdFJhdGlvID0gdGhpcy52YWxpZGF0ZUFzcGVjdFJhdGlvKHByb3BzLmFzcGVjdFJhdGlvID8/IERFRkFVTFRfVkFMVUVTLkFTUEVDVF9SQVRJTyk7XG4gICAgICAgIHRoaXMudmlldyA9IHByb3BzLnZpZXc7XG4gICAgICAgIHRoaXMuYW5nbGUgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKHByb3BzLmFuZ2xlID8/IERFRkFVTFRfVkFMVUVTLkFOR0xFKTtcbiAgICAgICAgdGhpcy5uYW1lID0gcHJvcHMubmFtZSA/PyBudWxsO1xuICAgICAgICB0aGlzLl9yZWxhdGl2ZVdpZHRoID0gcHJvcHMuX3JlbGF0aXZlV2lkdGg7XG4gICAgICAgIGlmIChwcm9wcy50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICB0aGlzLnVybCA9IHByb3BzLnVybDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChwcm9wcy50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgIHRoaXMudGV4dCA9IHByb3BzLnRleHQgfHwgREVGQVVMVF9WQUxVRVMuVEVYVDtcbiAgICAgICAgICAgIHRoaXMuZm9udCA9IHByb3BzLmZvbnQgPyB7IC4uLnByb3BzLmZvbnQgfSA6IHsgLi4uREVGQVVMVF9WQUxVRVMuRk9OVCB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBnZW5lcmF0ZUlkKCkge1xuICAgICAgICBpZiAodHlwZW9mIGNyeXB0byAhPT0gJ3VuZGVmaW5lZCcgJiYgY3J5cHRvLnJhbmRvbVVVSUQpIHtcbiAgICAgICAgICAgIHJldHVybiBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCAxMSl9YDtcbiAgICB9XG4gICAgdmFsaWRhdGVTaXplKHNpemUpIHtcbiAgICAgICAgaWYgKHNpemUgPD0gMCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBJbnZhbGlkIHNpemUgJHtzaXplfSwgdXNpbmcgZGVmYXVsdCAke0RFRkFVTFRfVkFMVUVTLlNJWkV9YCk7XG4gICAgICAgICAgICByZXR1cm4gREVGQVVMVF9WQUxVRVMuU0laRTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2l6ZTtcbiAgICB9XG4gICAgdmFsaWRhdGVBc3BlY3RSYXRpbyhyYXRpbykge1xuICAgICAgICBpZiAocmF0aW8gPD0gMCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBJbnZhbGlkIGFzcGVjdCByYXRpbyAke3JhdGlvfSwgdXNpbmcgZGVmYXVsdCAke0RFRkFVTFRfVkFMVUVTLkFTUEVDVF9SQVRJT31gKTtcbiAgICAgICAgICAgIHJldHVybiBERUZBVUxUX1ZBTFVFUy5BU1BFQ1RfUkFUSU87XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJhdGlvO1xuICAgIH1cbiAgICBub3JtYWxpemVBbmdsZShhbmdsZSkge1xuICAgICAgICBjb25zdCBub3JtYWxpemVkID0gYW5nbGUgJSAzNjA7XG4gICAgICAgIHJldHVybiBub3JtYWxpemVkIDwgMCA/IG5vcm1hbGl6ZWQgKyAzNjAgOiBub3JtYWxpemVkO1xuICAgIH1cbiAgICBpc0ltYWdlTGF5b3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlID09PSAnaW1hZ2UnICYmIHRoaXMudXJsICE9PSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlzVGV4dExheW91dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZSA9PT0gJ3RleHQnICYmIHRoaXMudGV4dCAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZm9udCAhPT0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBzZXRQb3NpdGlvbih4LCB5KSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSB7IHgsIHkgfTtcbiAgICB9XG4gICAgbW92ZShkeCwgZHkpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbi54ICs9IGR4O1xuICAgICAgICB0aGlzLnBvc2l0aW9uLnkgKz0gZHk7XG4gICAgfVxuICAgIHNldFNpemUoc2l6ZSkge1xuICAgICAgICB0aGlzLnNpemUgPSB0aGlzLnZhbGlkYXRlU2l6ZShzaXplKTtcbiAgICB9XG4gICAgcm90YXRlKGFuZ2xlKSB7XG4gICAgICAgIHRoaXMuYW5nbGUgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKHRoaXMuYW5nbGUgKyBhbmdsZSk7XG4gICAgfVxuICAgIHNldEFuZ2xlKGFuZ2xlKSB7XG4gICAgICAgIHRoaXMuYW5nbGUgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKGFuZ2xlKTtcbiAgICB9XG4gICAgc2V0VGV4dCh0ZXh0KSB7XG4gICAgICAgIGlmICh0aGlzLmlzVGV4dExheW91dCgpKSB7XG4gICAgICAgICAgICB0aGlzLnRleHQgPSB0ZXh0O1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldEZvbnQoZm9udCkge1xuICAgICAgICBpZiAodGhpcy5pc1RleHRMYXlvdXQoKSAmJiB0aGlzLmZvbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZm9udCA9IHsgLi4udGhpcy5mb250LCAuLi5mb250IH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2xvbmUoKSB7XG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdpbWFnZScsXG4gICAgICAgICAgICAgICAgdXJsOiB0aGlzLnVybCxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyAuLi50aGlzLnBvc2l0aW9uIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogdGhpcy5zaXplLFxuICAgICAgICAgICAgICAgIGFzcGVjdFJhdGlvOiB0aGlzLmFzcGVjdFJhdGlvLFxuICAgICAgICAgICAgICAgIHZpZXc6IHRoaXMudmlldyxcbiAgICAgICAgICAgICAgICBhbmdsZTogdGhpcy5hbmdsZSxcbiAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgY2xvbmVkID0gbmV3IExheW91dChwcm9wcyk7XG4gICAgICAgICAgICBjbG9uZWQuX3JlbGF0aXZlV2lkdGggPSB0aGlzLl9yZWxhdGl2ZVdpZHRoO1xuICAgICAgICAgICAgcmV0dXJuIGNsb25lZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyAuLi50aGlzLnBvc2l0aW9uIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogdGhpcy5zaXplLFxuICAgICAgICAgICAgICAgIGFzcGVjdFJhdGlvOiB0aGlzLmFzcGVjdFJhdGlvLFxuICAgICAgICAgICAgICAgIHZpZXc6IHRoaXMudmlldyxcbiAgICAgICAgICAgICAgICBhbmdsZTogdGhpcy5hbmdsZSxcbiAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHRoaXMudGV4dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcHJvcHMudGV4dCA9IHRoaXMudGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmZvbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHByb3BzLmZvbnQgPSB7IC4uLnRoaXMuZm9udCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY2xvbmVkID0gbmV3IExheW91dChwcm9wcyk7XG4gICAgICAgICAgICBjbG9uZWQuX3JlbGF0aXZlV2lkdGggPSB0aGlzLl9yZWxhdGl2ZVdpZHRoO1xuICAgICAgICAgICAgcmV0dXJuIGNsb25lZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIGNvbnN0IGJhc2UgPSB7XG4gICAgICAgICAgICBpZDogdGhpcy5pZCxcbiAgICAgICAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLnBvc2l0aW9uLFxuICAgICAgICAgICAgc2l6ZTogdGhpcy5zaXplLFxuICAgICAgICAgICAgYXNwZWN0UmF0aW86IHRoaXMuYXNwZWN0UmF0aW8sXG4gICAgICAgICAgICB2aWV3OiB0aGlzLnZpZXcsXG4gICAgICAgICAgICBhbmdsZTogdGhpcy5hbmdsZSxcbiAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIF9yZWxhdGl2ZVdpZHRoOiB0aGlzLl9yZWxhdGl2ZVdpZHRoLFxuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICByZXR1cm4geyAuLi5iYXNlLCB1cmw6IHRoaXMudXJsIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgIHJldHVybiB7IC4uLmJhc2UsIHRleHQ6IHRoaXMudGV4dCwgZm9udDogdGhpcy5mb250IH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhc2U7XG4gICAgfVxuICAgIHN0YXRpYyBmcm9tSlNPTihqc29uKSB7XG4gICAgICAgIHJldHVybiBuZXcgTGF5b3V0KGpzb24pO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlSW1hZ2UocHJvcHMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMYXlvdXQoeyAuLi5wcm9wcywgdHlwZTogJ2ltYWdlJyB9KTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZVRleHQocHJvcHMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMYXlvdXQoeyAuLi5wcm9wcywgdHlwZTogJ3RleHQnIH0pO1xuICAgIH1cbn1cbiIsImV4cG9ydCBjbGFzcyBUeXBlZEV2ZW50RW1pdHRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBvbihldmVudCwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmxpc3RlbmVycy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5zZXQoZXZlbnQsIG5ldyBTZXQoKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMuZ2V0KGV2ZW50KS5hZGQobGlzdGVuZXIpO1xuICAgIH1cbiAgICBvbmNlKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgICBjb25zdCBvbmNlV3JhcHBlciA9IChkZXRhaWwpID0+IHtcbiAgICAgICAgICAgIGxpc3RlbmVyKGRldGFpbCk7XG4gICAgICAgICAgICB0aGlzLm9mZihldmVudCwgb25jZVdyYXBwZXIpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm9uKGV2ZW50LCBvbmNlV3JhcHBlcik7XG4gICAgfVxuICAgIG9mZihldmVudCwgbGlzdGVuZXIpIHtcbiAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycy5nZXQoZXZlbnQpO1xuICAgICAgICBpZiAoZXZlbnRMaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIGV2ZW50TGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gICAgICAgICAgICBpZiAoZXZlbnRMaXN0ZW5lcnMuc2l6ZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZW1pdChldmVudCwgZGV0YWlsKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50TGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnMuZ2V0KGV2ZW50KTtcbiAgICAgICAgaWYgKGV2ZW50TGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBldmVudExpc3RlbmVycy5mb3JFYWNoKGxpc3RlbmVyID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcihkZXRhaWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW0V2ZW50RW1pdHRlcl0g0J7RiNC40LHQutCwINCyINC+0LHRgNCw0LHQvtGC0YfQuNC60LUg0YHQvtCx0YvRgtC40Y8gXCIke1N0cmluZyhldmVudCl9XCI6YCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShldmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5jbGVhcigpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGxpc3RlbmVyQ291bnQoZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXJzLmdldChldmVudCk/LnNpemUgfHwgMDtcbiAgICB9XG4gICAgaGFzTGlzdGVuZXJzKGV2ZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVyQ291bnQoZXZlbnQpID4gMDtcbiAgICB9XG4gICAgZXZlbnROYW1lcygpIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5saXN0ZW5lcnMua2V5cygpKTtcbiAgICB9XG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMuY2xlYXIoKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBFZGl0b3JTdG9yYWdlTWFuYWdlciB9IGZyb20gJy4uL21hbmFnZXJzL0VkaXRvclN0b3JhZ2VNYW5hZ2VyJztcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUltYWdlKHsgdXJpLCBwcm9tcHQsIHNoaXJ0Q29sb3IsIGltYWdlLCB3aXRoQWksIGxheW91dElkLCBpc05ldyA9IHRydWUsIGJhY2tncm91bmQgPSB0cnVlLCB9KSB7XG4gICAgY29uc3QgdGVtcFN0b3JhZ2VNYW5hZ2VyID0gbmV3IEVkaXRvclN0b3JhZ2VNYW5hZ2VyKCk7XG4gICAgY29uc3QgdXNlcklkID0gYXdhaXQgdGVtcFN0b3JhZ2VNYW5hZ2VyLmdldFVzZXJJZCgpO1xuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgZm9ybURhdGEuc2V0KCd1c2VySWQnLCB1c2VySWQpO1xuICAgIGZvcm1EYXRhLnNldCgncHJvbXB0JywgcHJvbXB0KTtcbiAgICBmb3JtRGF0YS5zZXQoJ3NoaXJ0Q29sb3InLCBzaGlydENvbG9yKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3BsYWNlbWVudCcsICdjZW50ZXInKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3ByaW50U2l6ZScsIFwiYmlnXCIpO1xuICAgIGZvcm1EYXRhLnNldCgndHJhbnNmZXJUeXBlJywgJycpO1xuICAgIGZvcm1EYXRhLnNldCgncmVxdWVzdF90eXBlJywgJ2dlbmVyYXRlJyk7XG4gICAgZm9ybURhdGEuc2V0KCdiYWNrZ3JvdW5kJywgYmFja2dyb3VuZC50b1N0cmluZygpKTtcbiAgICBpZiAobGF5b3V0SWQpXG4gICAgICAgIGZvcm1EYXRhLnNldCgnbGF5b3V0SWQnLCBsYXlvdXRJZCk7XG4gICAgaWYgKGltYWdlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tnZW5lcmF0ZSBpbWFnZV0nLCBpbWFnZSk7XG4gICAgICAgIGNvbnN0IFtoZWFkZXIsIGRhdGFdID0gaW1hZ2Uuc3BsaXQoJywnKTtcbiAgICAgICAgY29uc3QgdHlwZSA9IGhlYWRlci5zcGxpdCgnOicpWzFdLnNwbGl0KCc7JylbMF07XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tnZW5lcmF0ZSBpbWFnZV0gW3R5cGVdJywgdHlwZSk7XG4gICAgICAgIGNvbnN0IGJ5dGVDaGFyYWN0ZXJzID0gYXRvYihkYXRhKTtcbiAgICAgICAgY29uc3QgYnl0ZU51bWJlcnMgPSBuZXcgQXJyYXkoYnl0ZUNoYXJhY3RlcnMubGVuZ3RoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBieXRlQ2hhcmFjdGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYnl0ZU51bWJlcnNbaV0gPSBieXRlQ2hhcmFjdGVycy5jaGFyQ29kZUF0KGkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KGJ5dGVOdW1iZXJzKTtcbiAgICAgICAgZm9ybURhdGEuc2V0KCdyZXF1ZXN0X3R5cGUnLCAnaW1hZ2UnKTtcbiAgICAgICAgZm9ybURhdGEuc2V0KCd1c2VyX2ltYWdlJywgbmV3IEJsb2IoW2J5dGVBcnJheV0sIHsgdHlwZTogXCJpbWFnZS9wbmdcIiB9KSk7XG4gICAgICAgIGZvcm1EYXRhLnNldCgndHJhbnNmZXJUeXBlJywgd2l0aEFpID8gXCJhaVwiIDogXCJuby1haVwiKTtcbiAgICB9XG4gICAgaWYgKCFpc05ldykge1xuICAgICAgICBmb3JtRGF0YS5zZXQoJ3JlcXVlc3RfdHlwZScsICdlZGl0Jyk7XG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJpLCB7XG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGJvZHk6IGZvcm1EYXRhLFxuICAgIH0pO1xuICAgIGNvbnN0IHJlc3BvbnNlRGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICByZXR1cm4gcmVzcG9uc2VEYXRhLmltYWdlX3VybCB8fCByZXNwb25zZURhdGEuaW1hZ2U7XG59XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHJvZHVjdCh7IHF1YW50aXR5LCBuYW1lLCBzaXplLCBjb2xvciwgc2lkZXMsIGFydGljbGUsIHByaWNlIH0pIHtcbiAgICBjb25zdCBwcm9kdWN0SWQgPSAnNjk4MzQxNjQyODMyXycgKyBEYXRlLm5vdygpO1xuICAgIGNvbnN0IGRlc2lnblZhcmlhbnQgPSBzaWRlcy5sZW5ndGggPiAxID8gYDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCIke3NpZGVzWzBdPy5pbWFnZV91cmx9XCIgdGFyZ2V0PVwiX2JsYW5rXCI+JHtzaWRlc1swXT8uaW1hZ2VfdXJsLnNsaWNlKC0xMCl9PC9hPiwgPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiR7c2lkZXNbMV0/LmltYWdlX3VybH1cIiB0YXJnZXQ9XCJfYmxhbmtcIj4ke3NpZGVzWzFdPy5pbWFnZV91cmwuc2xpY2UoLTEwKX08L2E+YCA6IGA8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiJHtzaWRlc1swXT8uaW1hZ2VfdXJsfVwiIHRhcmdldD1cIl9ibGFua1wiPiR7c2lkZXNbMF0/LmltYWdlX3VybC5zbGljZSgtMTApfTwvYT5gO1xuICAgIGNvbnN0IHJlc3VsdFByb2R1Y3QgPSB7XG4gICAgICAgIGlkOiBwcm9kdWN0SWQsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIHByaWNlLFxuICAgICAgICBxdWFudGl0eTogcXVhbnRpdHksXG4gICAgICAgIGltZzogc2lkZXNbMF0/LmltYWdlX3VybCxcbiAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgICAgeyBvcHRpb246ICfQoNCw0LfQvNC10YAnLCB2YXJpYW50OiBzaXplIH0sXG4gICAgICAgICAgICB7IG9wdGlvbjogJ9CU0LjQt9Cw0LnQvScsIHZhcmlhbnQ6IGRlc2lnblZhcmlhbnQgfSxcbiAgICAgICAgICAgIHsgb3B0aW9uOiAn0JDRgNGC0LjQutGD0LsnLCB2YXJpYW50OiBhcnRpY2xlIH0sXG4gICAgICAgICAgICB7IG9wdGlvbjogJ9Cm0LLQtdGCJywgdmFyaWFudDogY29sb3IubmFtZSB9LFxuICAgICAgICAgICAgeyBvcHRpb246ICfQn9GA0LjQvdGCJywgdmFyaWFudDogc2lkZXMubGVuZ3RoID09IDEgPyAn0J7QtNC90L7RgdGC0L7RgNC+0L3QvdC40LknIDogJ9CU0LLRg9GF0YHRgtC+0YDQvtC90L3QuNC5JyB9LFxuICAgICAgICBdXG4gICAgfTtcbiAgICBjb25zb2xlLmRlYnVnKCdbY2FydF0gYWRkIHByb2R1Y3QnLCByZXN1bHRQcm9kdWN0KTtcbiAgICBpZiAodHlwZW9mIHdpbmRvdy50Y2FydF9fYWRkUHJvZHVjdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgd2luZG93LnRjYXJ0X19hZGRQcm9kdWN0KHJlc3VsdFByb2R1Y3QpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB3aW5kb3cueW0oMTAzMjc5MjE0LCAncmVhY2hHb2FsJywgJ2FkZF90b19jYXJ0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHsgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NhcnRdINCe0YjQuNCx0LrQsCDQv9GA0Lgg0LTQvtCx0LDQstC70LXQvdC40Lgg0L/RgNC+0LTRg9C60YLQsCDQsiDQutC+0YDQt9C40L3RgycsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbY2FydF0g0JrQvtGA0LfQuNC90LAgVGlsZGEg0L3QtSDQt9Cw0LPRgNGD0LbQtdC90LAuJyk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGNhbGN1bGF0ZUxheW91dERpbWVuc2lvbnMobGF5b3V0LCBwcm9kdWN0LCBjb250YWluZXJXaWR0aCwgY29udGFpbmVySGVpZ2h0KSB7XG4gICAgY29uc3QgcHJpbnRDb25maWcgPSBwcm9kdWN0LnByaW50Q29uZmlnLmZpbmQocGMgPT4gcGMuc2lkZSA9PT0gbGF5b3V0LnZpZXcpO1xuICAgIGlmICghcHJpbnRDb25maWcpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQcmludCBjb25maWcgbm90IGZvdW5kIGZvciBzaWRlOiAke2xheW91dC52aWV3fWApO1xuICAgIH1cbiAgICBjb25zdCBwcmludEFyZWFXaWR0aCA9IChwcmludENvbmZpZy5zaXplLndpZHRoIC8gNjAwKSAqIGNvbnRhaW5lcldpZHRoO1xuICAgIGNvbnN0IHByaW50QXJlYUhlaWdodCA9IChwcmludENvbmZpZy5zaXplLmhlaWdodCAvIDYwMCkgKiBjb250YWluZXJIZWlnaHQ7XG4gICAgY29uc3QgcHJpbnRBcmVhTGVmdCA9IE1hdGgucm91bmQoKGNvbnRhaW5lcldpZHRoIC0gcHJpbnRBcmVhV2lkdGgpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi54IC8gMTAwKSAqIGNvbnRhaW5lcldpZHRoKTtcbiAgICBjb25zdCBwcmludEFyZWFUb3AgPSBNYXRoLnJvdW5kKChjb250YWluZXJIZWlnaHQgLSBwcmludEFyZWFIZWlnaHQpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi55IC8gMTAwKSAqIGNvbnRhaW5lckhlaWdodCk7XG4gICAgY29uc3QgbGVmdCA9IHByaW50QXJlYUxlZnQgKyAocHJpbnRBcmVhV2lkdGggKiBsYXlvdXQucG9zaXRpb24ueCk7XG4gICAgY29uc3QgdG9wID0gcHJpbnRBcmVhVG9wICsgKHByaW50QXJlYUhlaWdodCAqIGxheW91dC5wb3NpdGlvbi55KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0LFxuICAgICAgICB0b3AsXG4gICAgICAgIHNjYWxlWDogbGF5b3V0LnNpemUsXG4gICAgICAgIHNjYWxlWTogbGF5b3V0LnNpemUgKiBsYXlvdXQuYXNwZWN0UmF0aW8sXG4gICAgICAgIGFuZ2xlOiBsYXlvdXQuYW5nbGUsXG4gICAgICAgIHByaW50QXJlYVdpZHRoLFxuICAgICAgICBwcmludEFyZWFIZWlnaHQsXG4gICAgICAgIHByaW50QXJlYUxlZnQsXG4gICAgICAgIHByaW50QXJlYVRvcFxuICAgIH07XG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyTGF5b3V0KHBhcmFtcykge1xuICAgIGNvbnN0IHsgbGF5b3V0LCBwcm9kdWN0LCBjb250YWluZXJXaWR0aCwgY29udGFpbmVySGVpZ2h0LCBsb2FkSW1hZ2UgfSA9IHBhcmFtcztcbiAgICBjb25zdCBkaW1lbnNpb25zID0gY2FsY3VsYXRlTGF5b3V0RGltZW5zaW9ucyhsYXlvdXQsIHByb2R1Y3QsIGNvbnRhaW5lcldpZHRoLCBjb250YWluZXJIZWlnaHQpO1xuICAgIGNvbnN0IGZhYnJpYyA9IHdpbmRvdy5mYWJyaWM7XG4gICAgaWYgKCFmYWJyaWMpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignW3JlbmRlckxheW91dF0gZmFicmljLmpzINC90LUg0LfQsNCz0YDRg9C20LXQvScpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKGxheW91dC5pc0ltYWdlTGF5b3V0KCkpIHtcbiAgICAgICAgY29uc3QgaW1nID0gYXdhaXQgbG9hZEltYWdlKGxheW91dC51cmwpO1xuICAgICAgICBjb25zdCBpbWFnZSA9IG5ldyBmYWJyaWMuSW1hZ2UoaW1nKTtcbiAgICAgICAgbGV0IGFjdHVhbFNjYWxlID0gbGF5b3V0LnNpemU7XG4gICAgICAgIGNvbnN0IHJlbGF0aXZlV2lkdGggPSBsYXlvdXQuX3JlbGF0aXZlV2lkdGg7XG4gICAgICAgIGlmIChyZWxhdGl2ZVdpZHRoICYmIHJlbGF0aXZlV2lkdGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRXaWR0aCA9IGRpbWVuc2lvbnMucHJpbnRBcmVhV2lkdGggKiByZWxhdGl2ZVdpZHRoO1xuICAgICAgICAgICAgYWN0dWFsU2NhbGUgPSB0YXJnZXRXaWR0aCAvIGltZy53aWR0aDtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtyZW5kZXJMYXlvdXRdINCQ0LTQsNC/0YLQsNGG0LjRjyDQuiDQvdC+0LLQvtC80YMg0YDQsNC30LzQtdGA0YM6IHJlbGF0aXZlV2lkdGg9JHtyZWxhdGl2ZVdpZHRoLnRvRml4ZWQoMyl9LCB0YXJnZXRXaWR0aD0ke3RhcmdldFdpZHRoLnRvRml4ZWQoMSl9cHgsIHNjYWxlPSR7YWN0dWFsU2NhbGUudG9GaXhlZCgzKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsYXlvdXQuc2l6ZSA9PT0gMSAmJiBpbWcud2lkdGggPiBkaW1lbnNpb25zLnByaW50QXJlYVdpZHRoKSB7XG4gICAgICAgICAgICBhY3R1YWxTY2FsZSA9IGRpbWVuc2lvbnMucHJpbnRBcmVhV2lkdGggLyBpbWcud2lkdGg7XG4gICAgICAgICAgICBsYXlvdXQuc2l6ZSA9IGFjdHVhbFNjYWxlO1xuICAgICAgICAgICAgY29uc3Qgb2JqZWN0V2lkdGggPSBpbWcud2lkdGggKiBhY3R1YWxTY2FsZTtcbiAgICAgICAgICAgIGNvbnN0IHJlbFcgPSBvYmplY3RXaWR0aCAvIGRpbWVuc2lvbnMucHJpbnRBcmVhV2lkdGg7XG4gICAgICAgICAgICBsYXlvdXQuX3JlbGF0aXZlV2lkdGggPSByZWxXO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3JlbmRlckxheW91dF0g0JDQstGC0L7Qv9C+0LTQs9C+0L3QutCwINGA0LDQt9C80LXRgNCwOiAke2ltZy53aWR0aH1weCDihpIgJHtkaW1lbnNpb25zLnByaW50QXJlYVdpZHRofXB4LCBzY2FsZT0ke2FjdHVhbFNjYWxlLnRvRml4ZWQoMyl9LCByZWxhdGl2ZVdpZHRoPSR7cmVsVy50b0ZpeGVkKDMpfWApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFyZWxhdGl2ZVdpZHRoIHx8IHJlbGF0aXZlV2lkdGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG9iamVjdFdpZHRoID0gaW1nLndpZHRoICogbGF5b3V0LnNpemU7XG4gICAgICAgICAgICBjb25zdCByZWxXID0gb2JqZWN0V2lkdGggLyBkaW1lbnNpb25zLnByaW50QXJlYVdpZHRoO1xuICAgICAgICAgICAgbGF5b3V0Ll9yZWxhdGl2ZVdpZHRoID0gcmVsVztcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtyZW5kZXJMYXlvdXRdINCS0YvRh9C40YHQu9C10L0gX3JlbGF0aXZlV2lkdGgg0LTQu9GPINGB0YLQsNGA0L7Qs9C+IGxheW91dDogJHtyZWxXLnRvRml4ZWQoMyl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgaW1hZ2Uuc2V0KHtcbiAgICAgICAgICAgIGxlZnQ6IGRpbWVuc2lvbnMubGVmdCxcbiAgICAgICAgICAgIHRvcDogZGltZW5zaW9ucy50b3AsXG4gICAgICAgICAgICBzY2FsZVg6IGFjdHVhbFNjYWxlLFxuICAgICAgICAgICAgc2NhbGVZOiBhY3R1YWxTY2FsZSAqIGxheW91dC5hc3BlY3RSYXRpbyxcbiAgICAgICAgICAgIGFuZ2xlOiBkaW1lbnNpb25zLmFuZ2xlLFxuICAgICAgICAgICAgbmFtZTogbGF5b3V0LmlkLFxuICAgICAgICAgICAgbGF5b3V0VXJsOiBsYXlvdXQudXJsLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGltYWdlO1xuICAgIH1cbiAgICBlbHNlIGlmIChsYXlvdXQuaXNUZXh0TGF5b3V0KCkpIHtcbiAgICAgICAgY29uc3QgdGV4dCA9IG5ldyBmYWJyaWMuVGV4dChsYXlvdXQudGV4dCwge1xuICAgICAgICAgICAgZm9udEZhbWlseTogbGF5b3V0LmZvbnQuZmFtaWx5LFxuICAgICAgICAgICAgZm9udFNpemU6IGxheW91dC5mb250LnNpemUsXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXh0LnNldCh7XG4gICAgICAgICAgICBsZWZ0OiBkaW1lbnNpb25zLmxlZnQsXG4gICAgICAgICAgICB0b3A6IGRpbWVuc2lvbnMudG9wLFxuICAgICAgICAgICAgc2NhbGVYOiBkaW1lbnNpb25zLnNjYWxlWCxcbiAgICAgICAgICAgIHNjYWxlWTogZGltZW5zaW9ucy5zY2FsZVksXG4gICAgICAgICAgICBhbmdsZTogZGltZW5zaW9ucy5hbmdsZSxcbiAgICAgICAgICAgIG5hbWU6IGxheW91dC5pZCxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0ZXh0O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJMYXlvdXRUb0NhbnZhcyhjdHgsIGxheW91dCwgcHJvZHVjdCwgY29udGFpbmVyV2lkdGgsIGNvbnRhaW5lckhlaWdodCwgbG9hZEltYWdlKSB7XG4gICAgY29uc3QgZGltZW5zaW9ucyA9IGNhbGN1bGF0ZUxheW91dERpbWVuc2lvbnMobGF5b3V0LCBwcm9kdWN0LCBjb250YWluZXJXaWR0aCwgY29udGFpbmVySGVpZ2h0KTtcbiAgICBpZiAobGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSkge1xuICAgICAgICBjb25zdCBpbWcgPSBhd2FpdCBsb2FkSW1hZ2UobGF5b3V0LnVybCk7XG4gICAgICAgIGN0eC5zYXZlKCk7XG4gICAgICAgIGN0eC50cmFuc2xhdGUoZGltZW5zaW9ucy5sZWZ0LCBkaW1lbnNpb25zLnRvcCk7XG4gICAgICAgIGN0eC5yb3RhdGUoKGRpbWVuc2lvbnMuYW5nbGUgKiBNYXRoLlBJKSAvIDE4MCk7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gaW1nLndpZHRoICogZGltZW5zaW9ucy5zY2FsZVg7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IGltZy5oZWlnaHQgKiBkaW1lbnNpb25zLnNjYWxlWTtcbiAgICAgICAgY3R4LmRyYXdJbWFnZShpbWcsIDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICBjdHgucmVzdG9yZSgpO1xuICAgIH1cbiAgICBlbHNlIGlmIChsYXlvdXQuaXNUZXh0TGF5b3V0KCkpIHtcbiAgICAgICAgY3R4LnNhdmUoKTtcbiAgICAgICAgY3R4LnRyYW5zbGF0ZShkaW1lbnNpb25zLmxlZnQsIGRpbWVuc2lvbnMudG9wKTtcbiAgICAgICAgY3R4LnJvdGF0ZSgoZGltZW5zaW9ucy5hbmdsZSAqIE1hdGguUEkpIC8gMTgwKTtcbiAgICAgICAgY3R4LmZvbnQgPSBgJHtsYXlvdXQuZm9udC5zaXplICogZGltZW5zaW9ucy5zY2FsZVh9cHggJHtsYXlvdXQuZm9udC5mYW1pbHl9YDtcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICdibGFjayc7XG4gICAgICAgIGN0eC5maWxsVGV4dChsYXlvdXQudGV4dCwgMCwgMCk7XG4gICAgICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGNsYXNzIFNhZmVSb3V0ZUludGVncmF0aW9uVjIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnBob25lRGF0YSA9IG51bGw7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vcmlnaW5hbEZvcm1EYXRhQXBwZW5kID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgfVxuICAgIGluaXQoKSB7XG4gICAgICAgIGlmICh0aGlzLmluaXRpYWxpemVkKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g8J+agCDQmNC90LjRhtC40LDQu9C40LfQsNGG0LjRjyDQsNCz0YDQtdGB0YHQuNCy0L3QvtC5INCy0LXRgNGB0LjQuC4uLicpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMuaGFuZGxlTWVzc2FnZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5pbnRlcmNlcHRGb3JtRGF0YSgpO1xuICAgICAgICB0aGlzLmludGVyY2VwdFhIUigpO1xuICAgICAgICB0aGlzLmludGVyY2VwdEZldGNoKCk7XG4gICAgICAgIHRoaXMuaW50ZXJjZXB0U3VibWl0KCk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g4pyFINCY0L3QuNGG0LjQsNC70LjQt9Cw0YbQuNGPINC30LDQstC10YDRiNC10L3QsCcpO1xuICAgICAgICB3aW5kb3cuc2FmZVJvdXRlVjIgPSB0aGlzO1xuICAgIH1cbiAgICBoYW5kbGVNZXNzYWdlKGV2ZW50KSB7XG4gICAgICAgIGlmICghZXZlbnQub3JpZ2luLmluY2x1ZGVzKCdzYWZlcm91dGUucnUnKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB0eXBlb2YgZXZlbnQuZGF0YSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICA/IEpTT04ucGFyc2UoZXZlbnQuZGF0YSlcbiAgICAgICAgICAgICAgICA6IGV2ZW50LmRhdGE7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g8J+TrCDQodC+0L7QsdGJ0LXQvdC40LUg0L7RgiBTYWZlUm91dGUnKTtcbiAgICAgICAgICAgIGNvbnN0IHBob25lID0gdGhpcy5leHRyYWN0UGhvbmUoZGF0YSk7XG4gICAgICAgICAgICBpZiAocGhvbmUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g8J+TsSDQotC10LvQtdGE0L7QvTonLCBwaG9uZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRQaG9uZShwaG9uZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbU2FmZVJvdXRlIFYyXSDQntGI0LjQsdC60LAg0L7QsdGA0LDQsdC+0YLQutC4OicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBleHRyYWN0UGhvbmUoZGF0YSkge1xuICAgICAgICByZXR1cm4gZGF0YS5waG9uZSB8fFxuICAgICAgICAgICAgZGF0YS5kYXRhPy5jb250YWN0cz8ucGhvbmUgfHxcbiAgICAgICAgICAgIGRhdGEuY29udGFjdHM/LnBob25lIHx8XG4gICAgICAgICAgICBkYXRhLnJlY2lwaWVudD8ucGhvbmUgfHxcbiAgICAgICAgICAgIG51bGw7XG4gICAgfVxuICAgIHNldFBob25lKHBob25lKSB7XG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IHRoaXMucGFyc2VQaG9uZShwaG9uZSk7XG4gICAgICAgIGlmICghcGFyc2VkKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tTYWZlUm91dGUgVjJdIOKdjCDQndC1INGD0LTQsNC70L7RgdGMINGA0LDRgdC/0LDRgNGB0LjRgtGMOicsIHBob25lKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBob25lRGF0YSA9IHBhcnNlZDtcbiAgICAgICAgY29uc29sZS5sb2coJ1tTYWZlUm91dGUgVjJdIOKchSDQotC10LvQtdGE0L7QvSDRgdC+0YXRgNCw0L3QtdC9OicsIHRoaXMucGhvbmVEYXRhKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oJ3NyX3Bob25lJywgSlNPTi5zdHJpbmdpZnkodGhpcy5waG9uZURhdGEpKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkgeyB9XG4gICAgICAgIHRoaXMuZmlsbFBob25lRmllbGRzKCk7XG4gICAgfVxuICAgIHBhcnNlUGhvbmUocGhvbmUpIHtcbiAgICAgICAgY29uc3QgY2xlYW5lZCA9IHBob25lLnJlcGxhY2UoL1xcRC9nLCAnJyk7XG4gICAgICAgIGlmIChjbGVhbmVkLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBsZXQgaXNvID0gJys3JztcbiAgICAgICAgbGV0IG51bWJlciA9IGNsZWFuZWQ7XG4gICAgICAgIGlmIChjbGVhbmVkLnN0YXJ0c1dpdGgoJzcnKSAmJiBjbGVhbmVkLmxlbmd0aCA9PT0gMTEpIHtcbiAgICAgICAgICAgIG51bWJlciA9IGNsZWFuZWQuc3Vic3RyaW5nKDEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGNsZWFuZWQuc3RhcnRzV2l0aCgnOCcpICYmIGNsZWFuZWQubGVuZ3RoID09PSAxMSkge1xuICAgICAgICAgICAgbnVtYmVyID0gY2xlYW5lZC5zdWJzdHJpbmcoMSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY2xlYW5lZC5sZW5ndGggPT09IDEwKSB7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmb3JtYXR0ZWQgPSB0aGlzLmZvcm1hdFBob25lKG51bWJlcik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpc286IGlzbyxcbiAgICAgICAgICAgIG51bWJlcjogZm9ybWF0dGVkLFxuICAgICAgICAgICAgZnVsbDogYCR7aXNvfSAke2Zvcm1hdHRlZH1gXG4gICAgICAgIH07XG4gICAgfVxuICAgIGZvcm1hdFBob25lKHBob25lKSB7XG4gICAgICAgIGlmIChwaG9uZS5sZW5ndGggIT09IDEwKVxuICAgICAgICAgICAgcmV0dXJuIHBob25lO1xuICAgICAgICByZXR1cm4gYCgke3Bob25lLnN1YnN0cmluZygwLCAzKX0pICR7cGhvbmUuc3Vic3RyaW5nKDMsIDYpfS0ke3Bob25lLnN1YnN0cmluZyg2LCA4KX0tJHtwaG9uZS5zdWJzdHJpbmcoOCwgMTApfWA7XG4gICAgfVxuICAgIGZpbGxQaG9uZUZpZWxkcygpIHtcbiAgICAgICAgaWYgKCF0aGlzLnBob25lRGF0YSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZm9ybXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdmb3JtJyk7XG4gICAgICAgIGxldCBmaWxsZWQgPSBmYWxzZTtcbiAgICAgICAgZm9ybXMuZm9yRWFjaChmb3JtID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGlzb0lucHV0ID0gdGhpcy5lbnN1cmVJbnB1dChmb3JtLCAndGlsZGFzcGVjLXBob25lLXBhcnRbXS1pc28nLCAnaGlkZGVuJyk7XG4gICAgICAgICAgICBjb25zdCBudW1iZXJJbnB1dCA9IHRoaXMuZW5zdXJlSW5wdXQoZm9ybSwgJ3RpbGRhc3BlYy1waG9uZS1wYXJ0W10nLCAndGVsJyk7XG4gICAgICAgICAgICBjb25zdCBwaG9uZUlucHV0ID0gdGhpcy5lbnN1cmVJbnB1dChmb3JtLCAncGhvbmUnLCAnaGlkZGVuJyk7XG4gICAgICAgICAgICBpZiAoaXNvSW5wdXQgJiYgdGhpcy5waG9uZURhdGEpIHtcbiAgICAgICAgICAgICAgICBpc29JbnB1dC52YWx1ZSA9IHRoaXMucGhvbmVEYXRhLmlzbztcbiAgICAgICAgICAgICAgICBmaWxsZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG51bWJlcklucHV0ICYmIHRoaXMucGhvbmVEYXRhKSB7XG4gICAgICAgICAgICAgICAgbnVtYmVySW5wdXQudmFsdWUgPSB0aGlzLnBob25lRGF0YS5udW1iZXI7XG4gICAgICAgICAgICAgICAgZmlsbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaG9uZUlucHV0ICYmIHRoaXMucGhvbmVEYXRhKSB7XG4gICAgICAgICAgICAgICAgcGhvbmVJbnB1dC52YWx1ZSA9IHRoaXMucGhvbmVEYXRhLmZ1bGw7XG4gICAgICAgICAgICAgICAgZmlsbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChmaWxsZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDinIUg0J/QvtC70Y8g0LfQsNC/0L7Qu9C90LXQvdGLJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZW5zdXJlSW5wdXQoZm9ybSwgbmFtZSwgdHlwZSkge1xuICAgICAgICBsZXQgaW5wdXQgPSBmb3JtLnF1ZXJ5U2VsZWN0b3IoYGlucHV0W25hbWU9XCIke25hbWV9XCJdYCk7XG4gICAgICAgIGlmICghaW5wdXQpIHtcbiAgICAgICAgICAgIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICAgIGlucHV0LnR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgaW5wdXQubmFtZSA9IG5hbWU7XG4gICAgICAgICAgICBpbnB1dC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgZm9ybS5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g4p6VINCh0L7Qt9C00LDQvdC+INC/0L7Qu9C1OicsIG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9XG4gICAgaW50ZXJjZXB0Rm9ybURhdGEoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBjb25zdCBPcmlnaW5hbEZvcm1EYXRhID0gd2luZG93LkZvcm1EYXRhO1xuICAgICAgICB3aW5kb3cuRm9ybURhdGEgPSBmdW5jdGlvbiAoZm9ybSkge1xuICAgICAgICAgICAgY29uc3QgZm9ybURhdGEgPSBuZXcgT3JpZ2luYWxGb3JtRGF0YShmb3JtKTtcbiAgICAgICAgICAgIGlmIChzZWxmLnBob25lRGF0YSkge1xuICAgICAgICAgICAgICAgIGlmICghZm9ybURhdGEuaGFzKCdwaG9uZScpIHx8ICFmb3JtRGF0YS5nZXQoJ3Bob25lJykpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybURhdGEuc2V0KCd0aWxkYXNwZWMtcGhvbmUtcGFydFtdLWlzbycsIHNlbGYucGhvbmVEYXRhLmlzbyk7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1EYXRhLnNldCgndGlsZGFzcGVjLXBob25lLXBhcnRbXScsIHNlbGYucGhvbmVEYXRhLm51bWJlcik7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1EYXRhLnNldCgncGhvbmUnLCBzZWxmLnBob25lRGF0YS5mdWxsKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tTYWZlUm91dGUgVjJdIPCfk6Yg0KLQtdC70LXRhNC+0L0g0LTQvtCx0LDQstC70LXQvSDQsiBGb3JtRGF0YScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmb3JtRGF0YTtcbiAgICAgICAgfTtcbiAgICAgICAgd2luZG93LkZvcm1EYXRhLnByb3RvdHlwZSA9IE9yaWdpbmFsRm9ybURhdGEucHJvdG90eXBlO1xuICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g4pyFIEZvcm1EYXRhINC/0LXRgNC10YXQstCw0YfQtdC9Jyk7XG4gICAgfVxuICAgIGludGVyY2VwdFhIUigpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGNvbnN0IG9yaWdpbmFsT3BlbiA9IFhNTEh0dHBSZXF1ZXN0LnByb3RvdHlwZS5vcGVuO1xuICAgICAgICBjb25zdCBvcmlnaW5hbFNlbmQgPSBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUuc2VuZDtcbiAgICAgICAgWE1MSHR0cFJlcXVlc3QucHJvdG90eXBlLm9wZW4gPSBmdW5jdGlvbiAobWV0aG9kLCB1cmwsIC4uLmFyZ3MpIHtcbiAgICAgICAgICAgIHRoaXMuX3VybCA9IHVybDtcbiAgICAgICAgICAgIHRoaXMuX21ldGhvZCA9IG1ldGhvZDtcbiAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbE9wZW4uYXBwbHkodGhpcywgW21ldGhvZCwgdXJsLCAuLi5hcmdzXSk7XG4gICAgICAgIH07XG4gICAgICAgIFhNTEh0dHBSZXF1ZXN0LnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24gKGJvZHkpIHtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IHRoaXMuX3VybCB8fCAnJztcbiAgICAgICAgICAgIGlmICh1cmwuaW5jbHVkZXMoJ2Zvcm1zLnRpbGRhYXBpLmNvbScpIHx8IHVybC5pbmNsdWRlcygnL2Zvcm0vc3VibWl0JykpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g8J+MkCDQn9C10YDQtdGF0LLQsNGCIFhIUiDQujonLCB1cmwpO1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLnBob25lRGF0YSAmJiBib2R5IGluc3RhbmNlb2YgRm9ybURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFib2R5LmhhcygncGhvbmUnKSB8fCAhYm9keS5nZXQoJ3Bob25lJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHkuc2V0KCd0aWxkYXNwZWMtcGhvbmUtcGFydFtdLWlzbycsIHNlbGYucGhvbmVEYXRhLmlzbyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5LnNldCgndGlsZGFzcGVjLXBob25lLXBhcnRbXScsIHNlbGYucGhvbmVEYXRhLm51bWJlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5LnNldCgncGhvbmUnLCBzZWxmLnBob25lRGF0YS5mdWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDinIUg0KLQtdC70LXRhNC+0L0g0LTQvtCx0LDQstC70LXQvSDQsiBYSFInKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzZWxmLnBob25lRGF0YSAmJiB0eXBlb2YgYm9keSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhib2R5KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXJhbXMuaGFzKCdwaG9uZScpIHx8ICFwYXJhbXMuZ2V0KCdwaG9uZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXMuc2V0KCd0aWxkYXNwZWMtcGhvbmUtcGFydFtdLWlzbycsIHNlbGYucGhvbmVEYXRhLmlzbyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXMuc2V0KCd0aWxkYXNwZWMtcGhvbmUtcGFydFtdJywgc2VsZi5waG9uZURhdGEubnVtYmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtcy5zZXQoJ3Bob25lJywgc2VsZi5waG9uZURhdGEuZnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5ID0gcGFyYW1zLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g4pyFINCi0LXQu9C10YTQvtC9INC00L7QsdCw0LLQu9C10L0g0LIgWEhSIChVUkxFbmNvZGVkKScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsU2VuZC5jYWxsKHRoaXMsIGJvZHkpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g4pyFIFhNTEh0dHBSZXF1ZXN0INC/0LXRgNC10YXQstCw0YfQtdC9Jyk7XG4gICAgfVxuICAgIGludGVyY2VwdEZldGNoKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxGZXRjaCA9IHdpbmRvdy5mZXRjaDtcbiAgICAgICAgd2luZG93LmZldGNoID0gZnVuY3Rpb24gKGlucHV0LCBpbml0KSB7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSB0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnID8gaW5wdXQgOiBpbnB1dCBpbnN0YW5jZW9mIFVSTCA/IGlucHV0LmhyZWYgOiBpbnB1dC51cmw7XG4gICAgICAgICAgICBpZiAodXJsLmluY2x1ZGVzKCdmb3Jtcy50aWxkYWFwaS5jb20nKSB8fCB1cmwuaW5jbHVkZXMoJy9mb3JtL3N1Ym1pdCcpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tTYWZlUm91dGUgVjJdIPCfjJAg0J/QtdGA0LXRhdCy0LDRgiBmZXRjaCDQujonLCB1cmwpO1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLnBob25lRGF0YSAmJiBpbml0Py5ib2R5IGluc3RhbmNlb2YgRm9ybURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpbml0LmJvZHkuaGFzKCdwaG9uZScpIHx8ICFpbml0LmJvZHkuZ2V0KCdwaG9uZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbml0LmJvZHkuc2V0KCd0aWxkYXNwZWMtcGhvbmUtcGFydFtdLWlzbycsIHNlbGYucGhvbmVEYXRhLmlzbyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbml0LmJvZHkuc2V0KCd0aWxkYXNwZWMtcGhvbmUtcGFydFtdJywgc2VsZi5waG9uZURhdGEubnVtYmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXQuYm9keS5zZXQoJ3Bob25lJywgc2VsZi5waG9uZURhdGEuZnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g4pyFINCi0LXQu9C10YTQvtC9INC00L7QsdCw0LLQu9C10L0g0LIgZmV0Y2gnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbEZldGNoLmFwcGx5KHdpbmRvdywgW2lucHV0LCBpbml0XSk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDinIUgZmV0Y2gg0L/QtdGA0LXRhdCy0LDRh9C10L0nKTtcbiAgICB9XG4gICAgaW50ZXJjZXB0U3VibWl0KCkge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZvcm0gPSBldmVudC50YXJnZXQ7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g8J+TpCBTdWJtaXQg0YTQvtGA0LzRizonLCBmb3JtLmFjdGlvbik7XG4gICAgICAgICAgICBpZiAodGhpcy5waG9uZURhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGxQaG9uZUZpZWxkcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLnBob25lRGF0YSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNhdmVkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbSgnc3JfcGhvbmUnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNhdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBob25lRGF0YSA9IEpTT04ucGFyc2Uoc2F2ZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxsUGhvbmVGaWVsZHMoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkgeyB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g4pyFIFN1Ym1pdCDQv9C10YDQtdGF0LLQsNGH0LXQvScpO1xuICAgIH1cbiAgICBnZXRQaG9uZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGhvbmVEYXRhO1xuICAgIH1cbn1cbmxldCBpbnN0YW5jZSA9IG51bGw7XG5leHBvcnQgZnVuY3Rpb24gaW5pdFNhZmVSb3V0ZVYyKCkge1xuICAgIGlmICghaW5zdGFuY2UpIHtcbiAgICAgICAgaW5zdGFuY2UgPSBuZXcgU2FmZVJvdXRlSW50ZWdyYXRpb25WMigpO1xuICAgIH1cbiAgICByZXR1cm4gaW5zdGFuY2U7XG59XG5pZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGluaXRTYWZlUm91dGVWMik7XG59XG5lbHNlIHtcbiAgICBpbml0U2FmZVJvdXRlVjIoKTtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0Q2hpbGQoZWxlbWVudCkge1xuICAgIGlmICghZWxlbWVudClcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgaWYgKCFlbGVtZW50LmZpcnN0RWxlbWVudENoaWxkKVxuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICByZXR1cm4gZ2V0TGFzdENoaWxkKGVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQpO1xufVxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9