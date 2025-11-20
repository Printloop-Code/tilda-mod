(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["cardForm"] = factory();
	else
		root["cardForm"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/components/CardForm.ts":
/*!************************************!*\
  !*** ./src/components/CardForm.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CardForm: () => (/* binding */ CardForm)
/* harmony export */ });
const logIssue = (key, payload) => {
    try {
        if (typeof window.OpenReplay?.handleError === 'function') {
            window.OpenReplay.handleError(new Error(key), payload);
        }
    }
    catch (e) {
        console.warn('[OpenReplay] Failed to log issue:', e);
    }
};
const DOM_SELECTORS = {
    CART_CONTAINER: '.t706__cartwin-products, .t-store__cart-products, .t-store',
    CART_PRODUCT: '.t706__cartwin-product, .t-store__card, .t706__product',
    PRODUCT_TITLE: '.t706__product-title, .t-store__card__title, .t706__product-name',
    PRODUCT_DEL_BUTTON: '.t706__product-del',
    PRODUCT_PLUS_BUTTON: '.t706__product-plus',
    PRODUCT_MINUS_BUTTON: '.t706__product-minus',
    PRODUCT_PLUSMINUS: '.t706__product-plusminus',
    PRODUCT_QUANTITY: '.t706__product-quantity, .t-store__card__quantity',
    CART_COUNTER: '.t706__carticon-counter, .t-store__counter',
    CART_AMOUNT: '.t706__cartwin-prodamount, .t-store__total-amount',
};
const DELAYS = {
    CART_UPDATE: 300,
    DOM_UPDATE: 100,
    OBSERVER_CHECK: 500,
    CART_LOAD_TIMEOUT: 3000,
};
class CartUtils {
    static wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    static async waitForElement(selector, maxAttempts = 10, interval = 100) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
            if (attempt < maxAttempts - 1) {
                await this.wait(interval);
            }
        }
        return null;
    }
    static findProductElement(productName) {
        const products = document.querySelectorAll(DOM_SELECTORS.CART_PRODUCT);
        for (const product of products) {
            const title = product.querySelector(DOM_SELECTORS.PRODUCT_TITLE);
            if (title && title.textContent?.trim() === productName.trim()) {
                return product;
            }
        }
        return null;
    }
}
class CardForm {
    constructor({ cardBlockId, rules }) {
        this.actionsStates = new Map();
        this.isUpdatingCart = false;
        this.isApplyingActions = false;
        this.cardBlock = document.querySelector(cardBlockId);
        if (!this.cardBlock) {
            console.error(`Card block with id ${cardBlockId} not found`);
            logIssue('card_form_init_error', {
                error: 'card_block_not_found',
                cardBlockId: cardBlockId
            });
        }
        this.form = this.cardBlock.querySelector('form');
        if (!this.form) {
            console.error(`Form block with id ${cardBlockId} not found`);
            logIssue('card_form_init_error', {
                error: 'form_not_found',
                cardBlockId: cardBlockId
            });
        }
        else {
            this.initForm();
        }
        this.rules = rules;
        this.fields = document.querySelectorAll('.t-input-group');
        this.initRules();
        this.initCartObserver();
    }
    initForm() {
        console.debug('[form] [init]', this.form.elements);
        this.form.addEventListener('input', async (e) => {
            const target = e.target;
            const fieldName = target?.name;
            const fieldValue = target?.value;
            console.debug('[form] [input]', e);
            console.debug(fieldValue, "|", fieldName);
            const rule = this.rules.find(r => r.variable === fieldName);
            if (rule) {
                const oldState = new Map(this.actionsStates);
                const action = rule.actions.find(a => a.value === fieldValue);
                if (action) {
                    this.actionsStates.set(fieldName, {
                        value: fieldValue,
                        action: action
                    });
                }
                else {
                    this.actionsStates.set(fieldName, {
                        value: '',
                        action: null
                    });
                }
                await this.applyActions(oldState);
            }
        });
        this.form.addEventListener('change', async (e) => {
            const target = e.target;
            const fieldName = target?.name;
            const fieldValue = target?.value;
            console.debug('[form] [change]', e);
            console.debug(fieldValue, "|", fieldName);
            const rule = this.rules.find(r => r.variable === fieldName);
            if (rule) {
                const action = rule.actions.find(a => a.value === fieldValue);
                if (action) {
                    const oldState = new Map(this.actionsStates);
                    this.actionsStates.set(fieldName, {
                        value: fieldValue,
                        action: action
                    });
                    await this.applyActions(oldState);
                }
                else {
                    const oldState = new Map(this.actionsStates);
                    this.actionsStates.set(fieldName, {
                        value: '',
                        action: null
                    });
                    await this.applyActions(oldState);
                }
            }
        });
    }
    async initRules() {
        this.rules.forEach(rule => {
            if (rule.alwaysActive && rule.actions.length > 0) {
                const action = rule.actions[0];
                if (action) {
                    this.actionsStates.set(rule.variable, {
                        value: action.value,
                        action: action
                    });
                    console.debug('[form] [initRules] Инициализировано постоянное правило:', rule.variable, action);
                }
                return;
            }
            const field = this.form.elements.namedItem(rule.variable);
            if (field) {
                let fieldValue = '';
                if (field instanceof RadioNodeList) {
                    const checkedRadio = Array.from(field).find((radio) => radio.checked);
                    fieldValue = checkedRadio?.value || '';
                }
                else if (field instanceof HTMLSelectElement) {
                    fieldValue = field.value || '';
                }
                else if (field instanceof HTMLInputElement) {
                    if (field.type === 'radio') {
                        fieldValue = field.checked ? field.value : '';
                    }
                    else if (field.type === 'checkbox') {
                        fieldValue = field.checked ? field.value : '';
                    }
                    else {
                        fieldValue = field.value || '';
                    }
                }
                console.debug('[form] [initRules] Поле:', rule.variable, 'Значение:', fieldValue);
                const action = rule.actions.find(a => a.value === fieldValue);
                if (action && fieldValue) {
                    this.actionsStates.set(rule.variable, {
                        value: fieldValue,
                        action: action
                    });
                    console.debug('[form] [initRules] Инициализировано состояние для:', rule.variable, action);
                }
            }
        });
        await this.cleanupCartOnInit();
        await this.applyActions();
    }
    async cleanupCartOnInit() {
        console.debug('[form] [cleanupCartOnInit] Начало очистки корзины');
        await new Promise(resolve => {
            const checkCart = () => {
                const tildaCart = window.tcart;
                if (tildaCart && tildaCart.products) {
                    resolve(void 0);
                }
                else {
                    setTimeout(checkCart, 200);
                }
            };
            checkCart();
        });
        const tildaCart = window.tcart;
        if (!tildaCart || !Array.isArray(tildaCart.products)) {
            console.warn('[form] [cleanupCartOnInit] Корзина недоступна');
            logIssue('cart_unavailable', {
                context: 'cleanupCartOnInit',
                hasTcart: !!tildaCart,
                hasProducts: !!tildaCart?.products
            });
            return;
        }
        console.debug('[form] [cleanupCartOnInit] Товары в корзине:', tildaCart.products.map((p) => p.name));
        const allRuleProducts = new Set();
        this.rules.forEach(rule => {
            rule.actions.forEach(action => {
                if (action.value) {
                    allRuleProducts.add(action.value.trim());
                }
            });
        });
        const activeProducts = new Set();
        this.actionsStates.forEach((state) => {
            if (state.action && state.action.value) {
                activeProducts.add(state.action.value.trim());
            }
        });
        console.debug('[form] [cleanupCartOnInit] Все товары из правил:', Array.from(allRuleProducts));
        console.debug('[form] [cleanupCartOnInit] Активные товары:', Array.from(activeProducts));
        const productsToRemove = [];
        tildaCart.products.forEach((product) => {
            const productName = product.name?.trim();
            if (productName && allRuleProducts.has(productName) && !activeProducts.has(productName)) {
                productsToRemove.push(productName);
            }
        });
        console.debug('[form] [cleanupCartOnInit] Товары для удаления:', productsToRemove);
        if (productsToRemove.length > 0) {
            for (const productName of productsToRemove) {
                console.debug('[form] [cleanupCartOnInit] Удаляем:', productName);
                await this.removeProductFromCart(productName);
            }
            console.debug('[form] [cleanupCartOnInit] ✓ Очистка завершена');
        }
        else {
            console.debug('[form] [cleanupCartOnInit] Нет товаров для удаления');
        }
        await this.hideQuantityControlsForRuleProducts();
    }
    saveTildaCart(tildaCart) {
        try {
            this.isUpdatingCart = true;
            tildaCart.updated = Math.floor(Date.now() / 1000);
            const cartData = {
                products: tildaCart.products || [],
                prodamount: tildaCart.prodamount || 0,
                amount: tildaCart.amount || 0,
                total: tildaCart.products?.length || 0,
                updated: tildaCart.updated,
                currency: tildaCart.currency || "р.",
                currency_side: tildaCart.currency_side || "r",
                currency_sep: tildaCart.currency_sep || ",",
                currency_dec: tildaCart.currency_dec || "",
                currency_txt: tildaCart.currency_txt || "р.",
                currency_txt_r: tildaCart.currency_txt_r || " р.",
                currency_txt_l: tildaCart.currency_txt_l || "",
                system: tildaCart.system || "none",
                settings: tildaCart.settings || {},
                delivery: tildaCart.delivery || { name: "nodelivery", price: 0 }
            };
            localStorage.setItem('tcart', JSON.stringify(cartData));
            console.debug('[form] [saveTildaCart] ✓ Корзина сохранена в localStorage');
            setTimeout(() => {
                this.isUpdatingCart = false;
            }, 100);
            return true;
        }
        catch (e) {
            console.warn('[form] [saveTildaCart] Ошибка сохранения:', e);
            logIssue('cart_save_error', {
                error: e instanceof Error ? e.message : String(e),
                productsCount: tildaCart?.products?.length
            });
            this.isUpdatingCart = false;
            return false;
        }
    }
    initCartObserver() {
        console.debug('[form] [initCartObserver] Инициализация наблюдателя корзины');
        let lastMainProductsQty = this.getMainProductsQuantity();
        const checkCartChanges = () => {
            const currentQty = this.getMainProductsQuantity();
            if (currentQty !== lastMainProductsQty) {
                console.debug('[form] [cartObserver] Изменилось количество товаров:', {
                    было: lastMainProductsQty,
                    стало: currentQty
                });
                lastMainProductsQty = currentQty;
                this.updateRuleProductsQuantity();
            }
        };
        const observeCart = () => {
            const cartContainer = document.querySelector(DOM_SELECTORS.CART_CONTAINER);
            if (cartContainer) {
                const observer = new MutationObserver(() => {
                    console.debug('[form] [cartObserver] MutationObserver: обнаружены изменения');
                    setTimeout(() => {
                        const newQty = this.getMainProductsQuantity();
                        if (newQty !== lastMainProductsQty) {
                            lastMainProductsQty = newQty;
                            this.updateRuleProductsQuantity();
                        }
                        this.hideQuantityControlsForRuleProducts();
                    }, DELAYS.CART_UPDATE);
                });
                observer.observe(cartContainer, {
                    childList: true,
                    subtree: true,
                });
                console.debug('[form] [initCartObserver] ✓ MutationObserver установлен');
            }
            else {
                setTimeout(observeCart, 1000);
            }
        };
        observeCart();
        document.addEventListener('click', (e) => {
            const target = e.target;
            const deleteButton = target.closest(DOM_SELECTORS.PRODUCT_DEL_BUTTON);
            if (deleteButton) {
                const productElement = deleteButton.closest(DOM_SELECTORS.CART_PRODUCT);
                if (productElement) {
                    const titleEl = productElement.querySelector(DOM_SELECTORS.PRODUCT_TITLE);
                    const productName = titleEl?.textContent?.trim();
                    if (productName) {
                        console.debug('[form] [cartObserver] Удаление товара:', productName);
                        this.handleRuleProductDeletion(productName);
                    }
                }
            }
            const isCartButton = target.closest(`${DOM_SELECTORS.PRODUCT_PLUS_BUTTON}, ${DOM_SELECTORS.PRODUCT_MINUS_BUTTON}, ${DOM_SELECTORS.PRODUCT_DEL_BUTTON}`);
            if (isCartButton) {
                console.debug('[form] [cartObserver] Клик на кнопку корзины');
                setTimeout(() => checkCartChanges(), DELAYS.OBSERVER_CHECK);
            }
        });
        const setupLocalStorageInterceptor = () => {
            if (!window.__cardform_localstorage_intercepted) {
                const originalSetItem = Storage.prototype.setItem;
                const self = this;
                Storage.prototype.setItem = function (key, value) {
                    const result = originalSetItem.apply(this, [key, value]);
                    if (key === 'tcart' && !self.isUpdatingCart) {
                        console.debug('[form] [cartObserver] localStorage tcart изменен извне');
                        setTimeout(() => checkCartChanges(), DELAYS.CART_UPDATE);
                    }
                    return result;
                };
                window.__cardform_localstorage_intercepted = true;
                console.debug('[form] [initCartObserver] ✓ localStorage.setItem перехвачен');
            }
        };
        if (document.readyState === 'complete') {
            setupLocalStorageInterceptor();
        }
        else {
            window.addEventListener('load', setupLocalStorageInterceptor);
        }
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            if (hash === '#opencart') {
                console.debug('[form] [cartObserver] Корзина открывается через #opencart');
                setTimeout(() => {
                    this.hideQuantityControlsForRuleProducts();
                }, DELAYS.CART_UPDATE + 200);
            }
        });
        const observeCartVisibility = () => {
            const cartWindow = document.querySelector('.t706__cartwin');
            if (cartWindow) {
                const visibilityObserver = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            const element = mutation.target;
                            if (element.classList.contains('t706__cartwin_showed')) {
                                console.debug('[form] [cartObserver] Корзина показана (класс t706__cartwin_showed)');
                                setTimeout(() => {
                                    this.hideQuantityControlsForRuleProducts();
                                }, DELAYS.CART_UPDATE);
                            }
                        }
                    });
                });
                visibilityObserver.observe(cartWindow, {
                    attributes: true,
                    attributeFilter: ['class']
                });
                console.debug('[form] [initCartObserver] ✓ Наблюдатель видимости корзины установлен');
            }
            else {
                setTimeout(observeCartVisibility, 1000);
            }
        };
        observeCartVisibility();
        console.debug('[form] [initCartObserver] ✓ Наблюдатели инициализированы');
    }
    handleRuleProductDeletion(productName) {
        console.debug('[form] [handleRuleProductDeletion] Проверка товара:', productName);
        for (const [key, state] of this.actionsStates) {
            if (state.action && state.action.value === productName) {
                console.debug('[form] [handleRuleProductDeletion] Товар из правила найден:', {
                    variable: key,
                    action: state.action.value
                });
                let foundElement = null;
                const allInputs = this.form.querySelectorAll('input, select');
                allInputs.forEach((element) => {
                    const el = element;
                    if ((el.type === 'radio' || el.type === 'checkbox') && el.value) {
                        if (el.value.trim() === state.action.value.trim()) {
                            foundElement = el;
                            console.debug('[form] [handleRuleProductDeletion] Найден элемент:', {
                                type: el.type,
                                value: el.value,
                                checked: el.checked
                            });
                        }
                    }
                });
                if (foundElement) {
                    console.debug('[form] [handleRuleProductDeletion] Снимаем выбор с:', foundElement);
                    foundElement.checked = false;
                    this.actionsStates.delete(key);
                    console.debug('[form] [handleRuleProductDeletion] ✓ Правило отменено, checkbox снят');
                }
                else {
                    console.warn('[form] [handleRuleProductDeletion] Элемент формы не найден для:', {
                        key: key,
                        actionValue: state.action.value,
                        availableInputs: Array.from(allInputs).map(el => ({
                            type: el.type,
                            value: el.value
                        }))
                    });
                    logIssue('form_element_not_found', {
                        context: 'handleRuleProductDeletion',
                        fieldKey: key,
                        actionValue: state.action.value,
                        availableInputsCount: allInputs.length
                    });
                }
                break;
            }
        }
    }
    async updateRuleProductsQuantity() {
        console.debug('[form] [updateRuleProductsQuantity] Начало обновления количества');
        const tildaCart = window.tcart;
        if (!tildaCart || !Array.isArray(tildaCart.products)) {
            console.warn('[form] [updateRuleProductsQuantity] Корзина недоступна');
            logIssue('cart_unavailable', {
                context: 'updateRuleProductsQuantity'
            });
            return;
        }
        console.debug('[form] [updateRuleProductsQuantity] Активных правил:', this.actionsStates.size);
        for (const [key, state] of this.actionsStates) {
            if (state.action && state.action.quantityType === 'perProduct') {
                const newQuantity = this.calculateRuleProductQuantity(state.action);
                const productIndex = tildaCart.products.findIndex((p) => p.name?.trim() === state.action.value.trim());
                if (productIndex !== -1) {
                    const oldQuantity = parseInt(tildaCart.products[productIndex].quantity);
                    console.debug(`[form] [updateRuleProductsQuantity] Товар "${state.action.value}":`, {
                        productIndex,
                        oldQuantity: oldQuantity,
                        newQuantity: newQuantity,
                        needsUpdate: oldQuantity !== newQuantity
                    });
                    if (oldQuantity !== newQuantity) {
                        console.debug('[form] [updateRuleProductsQuantity] ⚡ Обновляем через tcart__product__updateQuantity');
                        let productElement = null;
                        for (let attempt = 0; attempt < 10; attempt++) {
                            productElement = CartUtils.findProductElement(state.action.value);
                            if (productElement) {
                                console.debug('[form] [updateRuleProductsQuantity] Элемент найден на попытке:', attempt + 1);
                                break;
                            }
                            if (attempt < 9) {
                                await CartUtils.wait(DELAYS.DOM_UPDATE);
                            }
                        }
                        if (productElement) {
                            const quantityElement = productElement.querySelector(DOM_SELECTORS.PRODUCT_QUANTITY);
                            if (quantityElement && typeof window.tcart__product__updateQuantity === 'function') {
                                window.tcart__product__updateQuantity(quantityElement, productElement, productIndex, newQuantity);
                                console.debug('[form] [updateRuleProductsQuantity] ✓ Количество обновлено через Tilda API:', {
                                    name: state.action.value,
                                    oldQuantity,
                                    newQuantity
                                });
                                logIssue('rule_product_quantity_updated', {
                                    productName: state.action.value,
                                    oldQuantity: oldQuantity,
                                    newQuantity: newQuantity,
                                    quantityType: state.action.quantityType
                                });
                                await CartUtils.wait(DELAYS.DOM_UPDATE);
                                const plusMinusButtons = productElement.querySelector(DOM_SELECTORS.PRODUCT_PLUSMINUS);
                                if (plusMinusButtons) {
                                    plusMinusButtons.style.display = 'none';
                                }
                            }
                            else {
                                console.warn('[form] [updateRuleProductsQuantity] Не найден quantityElement или функция updateQuantity');
                                logIssue('cart_update_element_not_found', {
                                    context: 'updateRuleProductsQuantity',
                                    productName: state.action.value,
                                    hasQuantityElement: !!quantityElement,
                                    hasUpdateFunction: typeof window.tcart__product__updateQuantity === 'function'
                                });
                            }
                        }
                        else {
                            console.warn('[form] [updateRuleProductsQuantity] Не найден DOM элемент товара после ожидания');
                            logIssue('product_element_not_found', {
                                context: 'updateRuleProductsQuantity',
                                productName: state.action.value,
                                attempts: 10
                            });
                        }
                    }
                }
                else {
                    console.warn(`[form] [updateRuleProductsQuantity] Товар "${state.action.value}" НЕ найден в корзине`);
                    logIssue('product_not_found_in_cart', {
                        context: 'updateRuleProductsQuantity',
                        productName: state.action.value,
                        cartProductsCount: tildaCart.products.length
                    });
                }
            }
        }
        console.debug('[form] [updateRuleProductsQuantity] ✓ Обновление завершено');
        await this.hideQuantityControlsForRuleProducts();
    }
    updateCartItemQuantityInDOM(productName, newQuantity) {
        console.debug('[form] [updateCartItemQuantityInDOM] Обновление:', { productName, newQuantity });
        const titleSelectors = [
            '.t706__product-title',
            '.t-store__product-name',
            '.t-product__title',
            '.js-product-name'
        ];
        let productElement = null;
        for (const selector of titleSelectors) {
            const productTitles = [...document.querySelectorAll(selector)];
            console.debug(`[form] [updateCartItemQuantityInDOM] Поиск через "${selector}":`, productTitles.length, 'элементов');
            const foundElement = productTitles.find(el => el.innerText.trim() === productName.trim());
            if (foundElement) {
                productElement = foundElement.closest('.t706__cartwin-product, .t-store__product, .t-product');
                if (productElement) {
                    console.debug('[form] [updateCartItemQuantityInDOM] ✓ Товар найден через:', selector);
                    break;
                }
            }
        }
        if (!productElement) {
            console.warn('[form] [updateCartItemQuantityInDOM] ✗ Элемент товара НЕ найден в DOM:', productName);
            console.debug('[form] [updateCartItemQuantityInDOM] Все товары в DOM:', [...document.querySelectorAll('.t706__product-title, .t-store__product-name')].map((el) => el.innerText));
            logIssue('product_element_not_found_in_dom', {
                context: 'updateCartItemQuantityInDOM',
                productName: productName,
                productsInDOM: [...document.querySelectorAll('.t706__product-title, .t-store__product-name')].length
            });
            return;
        }
        const quantityInputSelectors = [
            '.t706__product-quantity',
            '.t-store__quantity-input',
            'input[name="quantity"]',
            '.js-product-quantity'
        ];
        let quantityInput = null;
        for (const selector of quantityInputSelectors) {
            quantityInput = productElement.querySelector(selector);
            if (quantityInput) {
                quantityInput.value = newQuantity.toString();
                quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
                quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
                console.debug('[form] [updateCartItemQuantityInDOM] ✓ Обновлен input через:', selector);
                break;
            }
        }
        const quantityDisplaySelectors = [
            '.t-quantity__value',
            '.t706__product-quantity-value',
            '.t-store__quantity-value'
        ];
        for (const selector of quantityDisplaySelectors) {
            const quantityDisplay = productElement.querySelector(selector);
            if (quantityDisplay) {
                quantityDisplay.textContent = newQuantity.toString();
                console.debug('[form] [updateCartItemQuantityInDOM] ✓ Обновлен display через:', selector);
                break;
            }
        }
        const tildaCart = window.tcart;
        if (tildaCart) {
            const product = tildaCart.products.find((p) => p.name?.trim() === productName.trim());
            if (product) {
                const totalPrice = parseFloat(product.price) * newQuantity;
                const priceSelectors = [
                    '.t706__product-price',
                    '.t-store__product-price',
                    '.t-product__price',
                    '.js-product-price'
                ];
                for (const selector of priceSelectors) {
                    const priceElement = productElement.querySelector(selector);
                    if (priceElement) {
                        priceElement.textContent = `${totalPrice.toLocaleString('ru-RU')} ${tildaCart.currency_txt_r || ' р.'}`;
                        console.debug('[form] [updateCartItemQuantityInDOM] ✓ Обновлена стоимость через:', selector, totalPrice);
                        break;
                    }
                }
            }
        }
        console.debug('[form] [updateCartItemQuantityInDOM] ✓ Обновление завершено для:', productName);
    }
    updateAllCartItemsInDOM() {
        const tildaCart = window.tcart;
        if (!tildaCart || !Array.isArray(tildaCart.products)) {
            console.warn('[form] [updateAllCartItemsInDOM] Корзина недоступна');
            logIssue('cart_unavailable', {
                context: 'updateAllCartItemsInDOM'
            });
            return;
        }
        console.debug('[form] [updateAllCartItemsInDOM] Обновляем все товары в DOM');
        tildaCart.products.forEach((product) => {
            const productName = product.name?.trim();
            const quantity = parseInt(product.quantity || 1);
            if (productName) {
                this.updateCartItemQuantityInDOM(productName, quantity);
            }
        });
        console.debug('[form] [updateAllCartItemsInDOM] ✓ Все товары обновлены');
    }
    refreshCartUI() {
        console.debug('[form] [refreshCartUI] Начало обновления UI корзины');
        if (typeof window.t_store__refreshcart === 'function') {
            window.t_store__refreshcart();
            console.debug('[form] [refreshCartUI] ✓ Вызван t_store__refreshcart');
        }
        const refreshFunctions = [
            't706__updateCart',
            'tcart__updateCart',
            't_store__updateCart',
            't706_init'
        ];
        refreshFunctions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                try {
                    window[funcName]();
                    console.debug(`[form] [refreshCartUI] ✓ Вызван ${funcName}`);
                }
                catch (e) {
                    console.warn(`[form] [refreshCartUI] Ошибка ${funcName}:`, e);
                    logIssue('cart_refresh_function_error', {
                        context: 'refreshCartUI',
                        functionName: funcName,
                        error: e instanceof Error ? e.message : String(e)
                    });
                }
            }
        });
        this.updateAllCartItemsInDOM();
        window.dispatchEvent(new Event('cart-updated'));
        document.dispatchEvent(new Event('tcart-updated'));
        this.updateCartCounters();
    }
    updateCartCounters() {
        const tildaCart = window.tcart;
        if (!tildaCart)
            return;
        const cartCounters = document.querySelectorAll(DOM_SELECTORS.CART_COUNTER);
        cartCounters.forEach(counter => {
            if (counter) {
                counter.textContent = tildaCart.total.toString();
            }
        });
        const cartAmounts = document.querySelectorAll(DOM_SELECTORS.CART_AMOUNT);
        cartAmounts.forEach(amount => {
            if (amount) {
                const formattedAmount = tildaCart.amount.toLocaleString('ru-RU');
                amount.textContent = `${formattedAmount} ${tildaCart.currency_txt_r || ' р.'}`;
            }
        });
        console.debug('[form] [updateCartCounters] ✓ Счетчики обновлены');
    }
    getMainProductsQuantity() {
        const tildaCart = window.tcart;
        if (!tildaCart || !Array.isArray(tildaCart.products)) {
            return 0;
        }
        const ruleProductNames = new Set();
        this.rules.forEach(rule => {
            rule.actions.forEach(action => {
                if (action.value) {
                    ruleProductNames.add(action.value.trim());
                }
            });
        });
        let totalQuantity = 0;
        const mainProducts = [];
        tildaCart.products.forEach((product) => {
            const productName = product.name?.trim();
            const isRuleProduct = ruleProductNames.has(productName);
            const qty = parseInt(product.quantity || 1);
            if (productName && !isRuleProduct) {
                totalQuantity += qty;
                mainProducts.push(`${productName} (${qty} шт)`);
            }
        });
        console.debug('[form] [getMainProductsQuantity]', {
            'Основных товаров': totalQuantity,
            'Список': mainProducts,
            'Товары правил': Array.from(ruleProductNames)
        });
        return totalQuantity;
    }
    calculateRuleProductQuantity(action) {
        if (action.quantity !== undefined) {
            return action.quantity;
        }
        if (action.quantityType === 'perProduct') {
            return Math.max(1, this.getMainProductsQuantity());
        }
        return 1;
    }
    async removeProductFromCart(productName) {
        console.debug('[form] [removeProduct] Попытка удалить:', productName);
        const productElement = CartUtils.findProductElement(productName);
        if (productElement) {
            const delProductButton = productElement.querySelector(DOM_SELECTORS.PRODUCT_DEL_BUTTON);
            if (delProductButton) {
                delProductButton.click();
                console.debug('[form] [removeProduct] ✓ Удалено через DOM (клик):', productName);
                await CartUtils.wait(DELAYS.CART_UPDATE);
                return true;
            }
        }
        const tildaCart = window.tcart;
        if (tildaCart && Array.isArray(tildaCart.products)) {
            const productIndex = tildaCart.products.findIndex((p) => p.name?.trim() === productName.trim());
            if (productIndex !== -1) {
                const product = tildaCart.products[productIndex];
                const removeFunctions = [
                    'tcart__removeProduct',
                    'tcart_removeProduct',
                    't_store__removeProduct'
                ];
                for (const funcName of removeFunctions) {
                    if (typeof window[funcName] === 'function') {
                        try {
                            window[funcName](product.uid || product.id);
                            console.debug(`[form] [removeProduct] ✓ Удалено через ${funcName}:`, productName);
                            await CartUtils.wait(DELAYS.CART_UPDATE);
                            return true;
                        }
                        catch (e) {
                            console.warn(`[form] [removeProduct] Ошибка ${funcName}:`, e);
                        }
                    }
                }
                tildaCart.products.splice(productIndex, 1);
                tildaCart.amount = tildaCart.products.reduce((sum, p) => sum + (parseFloat(p.price) * parseInt(p.quantity || 1)), 0);
                tildaCart.prodamount = tildaCart.products.length;
                tildaCart.total = tildaCart.products.length;
                tildaCart.updated = Math.floor(Date.now() / 1000);
                if (this.saveTildaCart(tildaCart)) {
                    if (typeof window.t_store__refreshcart === 'function') {
                        window.t_store__refreshcart();
                    }
                    console.debug('[form] [removeProduct] ✓ Удалено напрямую из массива:', productName);
                    await CartUtils.wait(DELAYS.CART_UPDATE);
                    return true;
                }
            }
        }
        console.warn('[form] [removeProduct] ✗ Не удалось удалить товар:', productName);
        logIssue('product_removal_failed', {
            context: 'removeProductFromCart',
            productName: productName,
            cartProductsCount: tildaCart?.products?.length
        });
        return false;
    }
    async applyActions(oldState = new Map()) {
        if (this.isApplyingActions) {
            console.debug('[form] [applyActions] Уже выполняется, пропускаем');
            return;
        }
        this.isApplyingActions = true;
        try {
            console.debug('[form] [applyActions] Начало применения действий');
            console.debug('[form] [applyActions] Старое состояние:', Object.fromEntries(oldState));
            console.debug('[form] [applyActions] Новое состояние:', Object.fromEntries(this.actionsStates));
            const cartLoaded = await Promise.race([
                new Promise(resolve => {
                    const interval = setInterval(() => {
                        if ([...document.querySelectorAll(`.t706__product-title`)].length > 0) {
                            clearInterval(interval);
                            resolve(true);
                        }
                    }, 200);
                }),
                new Promise(resolve => setTimeout(() => resolve(false), 3000))
            ]);
            if (!cartLoaded) {
                console.warn('[form] [applyActions] Корзина не загрузилась за 3 секунды, продолжаем');
                logIssue('cart_load_timeout', {
                    context: 'applyActions',
                    timeout: 3000
                });
            }
            for (const [key, state] of this.actionsStates) {
                const oldValue = oldState.get(key)?.value;
                const oldAction = oldState.get(key)?.action;
                console.debug(`[form] [applyActions] Обработка поля "${key}":`, {
                    oldValue,
                    newValue: state.value,
                    oldAction: oldAction?.value,
                    newAction: state.action?.value
                });
                if (state.value !== oldValue) {
                    if (oldAction && oldAction.value) {
                        console.debug('[form] [applyActions] Удаляем старый товар:', oldAction.value);
                        const removed = await this.removeProductFromCart(oldAction.value);
                        if (removed) {
                            logIssue('rule_product_removed', {
                                productName: oldAction.value,
                                fieldKey: key,
                                price: oldAction.sum || 0
                            });
                        }
                    }
                    if (state.value && state.action) {
                        const productId = `rule_${key}_${Date.now()}`;
                        const productQuantity = this.calculateRuleProductQuantity(state.action);
                        console.debug('[form] [applyActions] Добавляем новый товар:', {
                            id: productId,
                            name: state.action.value,
                            price: state.action.sum || 0,
                            quantity: productQuantity,
                            quantityType: state.action.quantityType || 'fixed'
                        });
                        window.tcart__addProduct({
                            id: productId,
                            name: state.action.value,
                            price: state.action.sum || 0,
                            quantity: productQuantity,
                        });
                        logIssue('rule_product_added', {
                            productName: state.action.value,
                            fieldKey: key,
                            price: state.action.sum || 0,
                            quantity: productQuantity,
                            quantityType: state.action.quantityType || 'fixed'
                        });
                        const changeProduct = await new Promise(resolve => {
                            setTimeout(() => {
                                const changeProduct = [...document.querySelectorAll(`.t706__product-title`)]
                                    .find((e) => e.innerText.trim() === state.action.value.trim())?.parentElement;
                                resolve(changeProduct || undefined);
                            }, 300);
                        });
                        if (changeProduct) {
                            const changeProductButton = changeProduct.querySelector(`.t706__product-plusminus`);
                            if (changeProductButton) {
                                changeProductButton.style.display = 'none';
                                console.debug('[form] [applyActions] ✓ Скрыты кнопки количества');
                            }
                        }
                    }
                    else if (!state.value || !state.action) {
                        console.debug('[form] [applyActions] Значение сброшено, товар удален');
                    }
                }
            }
            console.debug('[form] [applyActions] ✓ Применение действий завершено');
            await this.hideQuantityControlsForRuleProducts();
        }
        finally {
            this.isApplyingActions = false;
        }
    }
    getAllRuleProductNames() {
        const ruleProductNames = new Set();
        this.rules.forEach(rule => {
            rule.actions.forEach(action => {
                if (action.value) {
                    ruleProductNames.add(action.value.trim());
                }
            });
        });
        console.debug('[form] [hideQuantity] Все товары из правил:', Array.from(ruleProductNames));
        return ruleProductNames;
    }
    async hideQuantityControlsForRuleProducts() {
        console.debug('[form] [hideQuantity] Начало скрытия счетчиков для товаров из правил');
        const ruleProductNames = this.getAllRuleProductNames();
        if (ruleProductNames.size === 0) {
            console.debug('[form] [hideQuantity] Нет товаров из правил');
            return;
        }
        await CartUtils.wait(DELAYS.DOM_UPDATE);
        const productElements = document.querySelectorAll(DOM_SELECTORS.CART_PRODUCT);
        let hiddenCount = 0;
        productElements.forEach((productElement) => {
            const titleElement = productElement.querySelector(DOM_SELECTORS.PRODUCT_TITLE);
            const productName = titleElement?.textContent?.trim();
            if (productName && ruleProductNames.has(productName)) {
                const plusMinusBlock = productElement.querySelector(DOM_SELECTORS.PRODUCT_PLUSMINUS);
                if (plusMinusBlock && plusMinusBlock.style.display !== 'none') {
                    plusMinusBlock.style.display = 'none';
                    hiddenCount++;
                    console.debug(`[form] [hideQuantity] ✓ Скрыты кнопки для товара: "${productName}"`);
                }
            }
        });
        console.debug(`[form] [hideQuantity] ✓ Скрыто счетчиков: ${hiddenCount}`);
    }
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
/*!*********************************!*\
  !*** ./src/entries/cardForm.ts ***!
  \*********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _components_CardForm__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../components/CardForm */ "./src/components/CardForm.ts");

if (typeof window !== 'undefined') {
    window.CardForm = _components_CardForm__WEBPACK_IMPORTED_MODULE_0__.CardForm;
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_components_CardForm__WEBPACK_IMPORTED_MODULE_0__.CardForm);

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FyZEZvcm0uanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87Ozs7Ozs7Ozs7Ozs7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOEJBQThCLHVCQUF1QjtBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTztBQUNQLGtCQUFrQixvQkFBb0I7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRCxhQUFhO0FBQzdEO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxnREFBZ0QsYUFBYTtBQUM3RDtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtEQUFrRDtBQUNsRCxrREFBa0Q7QUFDbEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1EQUFtRCxrQ0FBa0MsSUFBSSxtQ0FBbUMsSUFBSSxpQ0FBaUM7QUFDaks7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlDQUFpQztBQUNqQztBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnRkFBZ0YsbUJBQW1CO0FBQ25HO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUM7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlDQUFpQztBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlDQUFpQztBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0VBQStFLG1CQUFtQjtBQUNsRztBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRFQUE0RSwwQkFBMEI7QUFDdEc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0VBQStFLFNBQVM7QUFDeEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrRUFBa0UsZUFBZTtBQUNqRixpRUFBaUUsZUFBZTtBQUNoRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNEQUFzRCxvQ0FBb0MsRUFBRSxrQ0FBa0M7QUFDOUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUVBQXFFLFNBQVM7QUFDOUU7QUFDQTtBQUNBLGtFQUFrRSxTQUFTO0FBQzNFO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdDQUF3QyxpQkFBaUIsRUFBRSxrQ0FBa0M7QUFDN0Y7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUMsYUFBYSxHQUFHLEtBQUs7QUFDMUQ7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvRkFBb0YsU0FBUztBQUM3RjtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBFQUEwRSxTQUFTO0FBQ25GO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUVBQXVFLElBQUk7QUFDM0U7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBLGtEQUFrRCxJQUFJLEdBQUcsV0FBVztBQUNwRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdGQUF3RixZQUFZO0FBQ3BHO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsbUVBQW1FLFlBQVk7QUFDL0U7QUFDQTs7Ozs7OztVQ3A2QkE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQSxFOzs7OztXQ1BBLHdGOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RCxFOzs7Ozs7Ozs7Ozs7Ozs7QUNOa0Q7QUFDbEQ7QUFDQSxzQkFBc0IsMERBQVE7QUFDOUI7QUFDQSxpRUFBZSwwREFBUSxFQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24iLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9jb21wb25lbnRzL0NhcmRGb3JtLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL2VudHJpZXMvY2FyZEZvcm0udHMiXSwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wiY2FyZEZvcm1cIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wiY2FyZEZvcm1cIl0gPSBmYWN0b3J5KCk7XG59KSh0aGlzLCAoKSA9PiB7XG5yZXR1cm4gIiwiY29uc3QgbG9nSXNzdWUgPSAoa2V5LCBwYXlsb2FkKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cuT3BlblJlcGxheT8uaGFuZGxlRXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHdpbmRvdy5PcGVuUmVwbGF5LmhhbmRsZUVycm9yKG5ldyBFcnJvcihrZXkpLCBwYXlsb2FkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1tPcGVuUmVwbGF5XSBGYWlsZWQgdG8gbG9nIGlzc3VlOicsIGUpO1xuICAgIH1cbn07XG5jb25zdCBET01fU0VMRUNUT1JTID0ge1xuICAgIENBUlRfQ09OVEFJTkVSOiAnLnQ3MDZfX2NhcnR3aW4tcHJvZHVjdHMsIC50LXN0b3JlX19jYXJ0LXByb2R1Y3RzLCAudC1zdG9yZScsXG4gICAgQ0FSVF9QUk9EVUNUOiAnLnQ3MDZfX2NhcnR3aW4tcHJvZHVjdCwgLnQtc3RvcmVfX2NhcmQsIC50NzA2X19wcm9kdWN0JyxcbiAgICBQUk9EVUNUX1RJVExFOiAnLnQ3MDZfX3Byb2R1Y3QtdGl0bGUsIC50LXN0b3JlX19jYXJkX190aXRsZSwgLnQ3MDZfX3Byb2R1Y3QtbmFtZScsXG4gICAgUFJPRFVDVF9ERUxfQlVUVE9OOiAnLnQ3MDZfX3Byb2R1Y3QtZGVsJyxcbiAgICBQUk9EVUNUX1BMVVNfQlVUVE9OOiAnLnQ3MDZfX3Byb2R1Y3QtcGx1cycsXG4gICAgUFJPRFVDVF9NSU5VU19CVVRUT046ICcudDcwNl9fcHJvZHVjdC1taW51cycsXG4gICAgUFJPRFVDVF9QTFVTTUlOVVM6ICcudDcwNl9fcHJvZHVjdC1wbHVzbWludXMnLFxuICAgIFBST0RVQ1RfUVVBTlRJVFk6ICcudDcwNl9fcHJvZHVjdC1xdWFudGl0eSwgLnQtc3RvcmVfX2NhcmRfX3F1YW50aXR5JyxcbiAgICBDQVJUX0NPVU5URVI6ICcudDcwNl9fY2FydGljb24tY291bnRlciwgLnQtc3RvcmVfX2NvdW50ZXInLFxuICAgIENBUlRfQU1PVU5UOiAnLnQ3MDZfX2NhcnR3aW4tcHJvZGFtb3VudCwgLnQtc3RvcmVfX3RvdGFsLWFtb3VudCcsXG59O1xuY29uc3QgREVMQVlTID0ge1xuICAgIENBUlRfVVBEQVRFOiAzMDAsXG4gICAgRE9NX1VQREFURTogMTAwLFxuICAgIE9CU0VSVkVSX0NIRUNLOiA1MDAsXG4gICAgQ0FSVF9MT0FEX1RJTUVPVVQ6IDMwMDAsXG59O1xuY2xhc3MgQ2FydFV0aWxzIHtcbiAgICBzdGF0aWMgd2FpdChtcykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XG4gICAgfVxuICAgIHN0YXRpYyBhc3luYyB3YWl0Rm9yRWxlbWVudChzZWxlY3RvciwgbWF4QXR0ZW1wdHMgPSAxMCwgaW50ZXJ2YWwgPSAxMDApIHtcbiAgICAgICAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCBtYXhBdHRlbXB0czsgYXR0ZW1wdCsrKSB7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGF0dGVtcHQgPCBtYXhBdHRlbXB0cyAtIDEpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLndhaXQoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBzdGF0aWMgZmluZFByb2R1Y3RFbGVtZW50KHByb2R1Y3ROYW1lKSB7XG4gICAgICAgIGNvbnN0IHByb2R1Y3RzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChET01fU0VMRUNUT1JTLkNBUlRfUFJPRFVDVCk7XG4gICAgICAgIGZvciAoY29uc3QgcHJvZHVjdCBvZiBwcm9kdWN0cykge1xuICAgICAgICAgICAgY29uc3QgdGl0bGUgPSBwcm9kdWN0LnF1ZXJ5U2VsZWN0b3IoRE9NX1NFTEVDVE9SUy5QUk9EVUNUX1RJVExFKTtcbiAgICAgICAgICAgIGlmICh0aXRsZSAmJiB0aXRsZS50ZXh0Q29udGVudD8udHJpbSgpID09PSBwcm9kdWN0TmFtZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvZHVjdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgQ2FyZEZvcm0ge1xuICAgIGNvbnN0cnVjdG9yKHsgY2FyZEJsb2NrSWQsIHJ1bGVzIH0pIHtcbiAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmlzVXBkYXRpbmdDYXJ0ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNBcHBseWluZ0FjdGlvbnMgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jYXJkQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGNhcmRCbG9ja0lkKTtcbiAgICAgICAgaWYgKCF0aGlzLmNhcmRCbG9jaykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQ2FyZCBibG9jayB3aXRoIGlkICR7Y2FyZEJsb2NrSWR9IG5vdCBmb3VuZGApO1xuICAgICAgICAgICAgbG9nSXNzdWUoJ2NhcmRfZm9ybV9pbml0X2Vycm9yJywge1xuICAgICAgICAgICAgICAgIGVycm9yOiAnY2FyZF9ibG9ja19ub3RfZm91bmQnLFxuICAgICAgICAgICAgICAgIGNhcmRCbG9ja0lkOiBjYXJkQmxvY2tJZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mb3JtID0gdGhpcy5jYXJkQmxvY2sucXVlcnlTZWxlY3RvcignZm9ybScpO1xuICAgICAgICBpZiAoIXRoaXMuZm9ybSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRm9ybSBibG9jayB3aXRoIGlkICR7Y2FyZEJsb2NrSWR9IG5vdCBmb3VuZGApO1xuICAgICAgICAgICAgbG9nSXNzdWUoJ2NhcmRfZm9ybV9pbml0X2Vycm9yJywge1xuICAgICAgICAgICAgICAgIGVycm9yOiAnZm9ybV9ub3RfZm91bmQnLFxuICAgICAgICAgICAgICAgIGNhcmRCbG9ja0lkOiBjYXJkQmxvY2tJZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmluaXRGb3JtKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ydWxlcyA9IHJ1bGVzO1xuICAgICAgICB0aGlzLmZpZWxkcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50LWlucHV0LWdyb3VwJyk7XG4gICAgICAgIHRoaXMuaW5pdFJ1bGVzKCk7XG4gICAgICAgIHRoaXMuaW5pdENhcnRPYnNlcnZlcigpO1xuICAgIH1cbiAgICBpbml0Rm9ybSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtpbml0XScsIHRoaXMuZm9ybS5lbGVtZW50cyk7XG4gICAgICAgIHRoaXMuZm9ybS5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGFzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IHRhcmdldD8ubmFtZTtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkVmFsdWUgPSB0YXJnZXQ/LnZhbHVlO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtpbnB1dF0nLCBlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoZmllbGRWYWx1ZSwgXCJ8XCIsIGZpZWxkTmFtZSk7XG4gICAgICAgICAgICBjb25zdCBydWxlID0gdGhpcy5ydWxlcy5maW5kKHIgPT4gci52YXJpYWJsZSA9PT0gZmllbGROYW1lKTtcbiAgICAgICAgICAgIGlmIChydWxlKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkU3RhdGUgPSBuZXcgTWFwKHRoaXMuYWN0aW9uc1N0YXRlcyk7XG4gICAgICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gcnVsZS5hY3Rpb25zLmZpbmQoYSA9PiBhLnZhbHVlID09PSBmaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcy5zZXQoZmllbGROYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZmllbGRWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLnNldChmaWVsZE5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogbnVsbFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHBseUFjdGlvbnMob2xkU3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5mb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGFzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IHRhcmdldD8ubmFtZTtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkVmFsdWUgPSB0YXJnZXQ/LnZhbHVlO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjaGFuZ2VdJywgZSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGZpZWxkVmFsdWUsIFwifFwiLCBmaWVsZE5hbWUpO1xuICAgICAgICAgICAgY29uc3QgcnVsZSA9IHRoaXMucnVsZXMuZmluZChyID0+IHIudmFyaWFibGUgPT09IGZpZWxkTmFtZSk7XG4gICAgICAgICAgICBpZiAocnVsZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IHJ1bGUuYWN0aW9ucy5maW5kKGEgPT4gYS52YWx1ZSA9PT0gZmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRTdGF0ZSA9IG5ldyBNYXAodGhpcy5hY3Rpb25zU3RhdGVzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLnNldChmaWVsZE5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBmaWVsZFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwbHlBY3Rpb25zKG9sZFN0YXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9sZFN0YXRlID0gbmV3IE1hcCh0aGlzLmFjdGlvbnNTdGF0ZXMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuc2V0KGZpZWxkTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBudWxsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmFwcGx5QWN0aW9ucyhvbGRTdGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgaW5pdFJ1bGVzKCkge1xuICAgICAgICB0aGlzLnJ1bGVzLmZvckVhY2gocnVsZSA9PiB7XG4gICAgICAgICAgICBpZiAocnVsZS5hbHdheXNBY3RpdmUgJiYgcnVsZS5hY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb24gPSBydWxlLmFjdGlvbnNbMF07XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuc2V0KHJ1bGUudmFyaWFibGUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBhY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGFjdGlvblxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtpbml0UnVsZXNdINCY0L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdC+INC/0L7RgdGC0L7Rj9C90L3QvtC1INC/0YDQsNCy0LjQu9C+OicsIHJ1bGUudmFyaWFibGUsIGFjdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gdGhpcy5mb3JtLmVsZW1lbnRzLm5hbWVkSXRlbShydWxlLnZhcmlhYmxlKTtcbiAgICAgICAgICAgIGlmIChmaWVsZCkge1xuICAgICAgICAgICAgICAgIGxldCBmaWVsZFZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkIGluc3RhbmNlb2YgUmFkaW9Ob2RlTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVja2VkUmFkaW8gPSBBcnJheS5mcm9tKGZpZWxkKS5maW5kKChyYWRpbykgPT4gcmFkaW8uY2hlY2tlZCk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWUgPSBjaGVja2VkUmFkaW8/LnZhbHVlIHx8ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChmaWVsZCBpbnN0YW5jZW9mIEhUTUxTZWxlY3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWUgPSBmaWVsZC52YWx1ZSB8fCAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZmllbGQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlID09PSAncmFkaW8nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlID0gZmllbGQuY2hlY2tlZCA/IGZpZWxkLnZhbHVlIDogJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gJ2NoZWNrYm94Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZSA9IGZpZWxkLmNoZWNrZWQgPyBmaWVsZC52YWx1ZSA6ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZSA9IGZpZWxkLnZhbHVlIHx8ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdFJ1bGVzXSDQn9C+0LvQtTonLCBydWxlLnZhcmlhYmxlLCAn0JfQvdCw0YfQtdC90LjQtTonLCBmaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb24gPSBydWxlLmFjdGlvbnMuZmluZChhID0+IGEudmFsdWUgPT09IGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gJiYgZmllbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuc2V0KHJ1bGUudmFyaWFibGUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBmaWVsZFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdFJ1bGVzXSDQmNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QviDRgdC+0YHRgtC+0Y/QvdC40LUg0LTQu9GPOicsIHJ1bGUudmFyaWFibGUsIGFjdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgdGhpcy5jbGVhbnVwQ2FydE9uSW5pdCgpO1xuICAgICAgICBhd2FpdCB0aGlzLmFwcGx5QWN0aW9ucygpO1xuICAgIH1cbiAgICBhc3luYyBjbGVhbnVwQ2FydE9uSW5pdCgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0J3QsNGH0LDQu9C+INC+0YfQuNGB0YLQutC4INC60L7RgNC30LjQvdGLJyk7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2hlY2tDYXJ0ID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgICAgICAgICBpZiAodGlsZGFDYXJ0ICYmIHRpbGRhQ2FydC5wcm9kdWN0cykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHZvaWQgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrQ2FydCwgMjAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY2hlY2tDYXJ0KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICghdGlsZGFDYXJ0IHx8ICFBcnJheS5pc0FycmF5KHRpbGRhQ2FydC5wcm9kdWN0cykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0JrQvtGA0LfQuNC90LAg0L3QtdC00L7RgdGC0YPQv9C90LAnKTtcbiAgICAgICAgICAgIGxvZ0lzc3VlKCdjYXJ0X3VuYXZhaWxhYmxlJywge1xuICAgICAgICAgICAgICAgIGNvbnRleHQ6ICdjbGVhbnVwQ2FydE9uSW5pdCcsXG4gICAgICAgICAgICAgICAgaGFzVGNhcnQ6ICEhdGlsZGFDYXJ0LFxuICAgICAgICAgICAgICAgIGhhc1Byb2R1Y3RzOiAhIXRpbGRhQ2FydD8ucHJvZHVjdHNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCi0L7QstCw0YDRiyDQsiDQutC+0YDQt9C40L3QtTonLCB0aWxkYUNhcnQucHJvZHVjdHMubWFwKChwKSA9PiBwLm5hbWUpKTtcbiAgICAgICAgY29uc3QgYWxsUnVsZVByb2R1Y3RzID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLnJ1bGVzLmZvckVhY2gocnVsZSA9PiB7XG4gICAgICAgICAgICBydWxlLmFjdGlvbnMuZm9yRWFjaChhY3Rpb24gPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYWxsUnVsZVByb2R1Y3RzLmFkZChhY3Rpb24udmFsdWUudHJpbSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGFjdGl2ZVByb2R1Y3RzID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuZm9yRWFjaCgoc3RhdGUpID0+IHtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5hY3Rpb24gJiYgc3RhdGUuYWN0aW9uLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgYWN0aXZlUHJvZHVjdHMuYWRkKHN0YXRlLmFjdGlvbi52YWx1ZS50cmltKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0JLRgdC1INGC0L7QstCw0YDRiyDQuNC3INC/0YDQsNCy0LjQuzonLCBBcnJheS5mcm9tKGFsbFJ1bGVQcm9kdWN0cykpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQkNC60YLQuNCy0L3Ri9C1INGC0L7QstCw0YDRizonLCBBcnJheS5mcm9tKGFjdGl2ZVByb2R1Y3RzKSk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3RzVG9SZW1vdmUgPSBbXTtcbiAgICAgICAgdGlsZGFDYXJ0LnByb2R1Y3RzLmZvckVhY2goKHByb2R1Y3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3ROYW1lID0gcHJvZHVjdC5uYW1lPy50cmltKCk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdE5hbWUgJiYgYWxsUnVsZVByb2R1Y3RzLmhhcyhwcm9kdWN0TmFtZSkgJiYgIWFjdGl2ZVByb2R1Y3RzLmhhcyhwcm9kdWN0TmFtZSkpIHtcbiAgICAgICAgICAgICAgICBwcm9kdWN0c1RvUmVtb3ZlLnB1c2gocHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0KLQvtCy0LDRgNGLINC00LvRjyDRg9C00LDQu9C10L3QuNGPOicsIHByb2R1Y3RzVG9SZW1vdmUpO1xuICAgICAgICBpZiAocHJvZHVjdHNUb1JlbW92ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHByb2R1Y3ROYW1lIG9mIHByb2R1Y3RzVG9SZW1vdmUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQo9C00LDQu9GP0LXQvDonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5yZW1vdmVQcm9kdWN0RnJvbUNhcnQocHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g4pyTINCe0YfQuNGB0YLQutCwINC30LDQstC10YDRiNC10L3QsCcpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0J3QtdGCINGC0L7QstCw0YDQvtCyINC00LvRjyDRg9C00LDQu9C10L3QuNGPJyk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5oaWRlUXVhbnRpdHlDb250cm9sc0ZvclJ1bGVQcm9kdWN0cygpO1xuICAgIH1cbiAgICBzYXZlVGlsZGFDYXJ0KHRpbGRhQ2FydCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5pc1VwZGF0aW5nQ2FydCA9IHRydWU7XG4gICAgICAgICAgICB0aWxkYUNhcnQudXBkYXRlZCA9IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApO1xuICAgICAgICAgICAgY29uc3QgY2FydERhdGEgPSB7XG4gICAgICAgICAgICAgICAgcHJvZHVjdHM6IHRpbGRhQ2FydC5wcm9kdWN0cyB8fCBbXSxcbiAgICAgICAgICAgICAgICBwcm9kYW1vdW50OiB0aWxkYUNhcnQucHJvZGFtb3VudCB8fCAwLFxuICAgICAgICAgICAgICAgIGFtb3VudDogdGlsZGFDYXJ0LmFtb3VudCB8fCAwLFxuICAgICAgICAgICAgICAgIHRvdGFsOiB0aWxkYUNhcnQucHJvZHVjdHM/Lmxlbmd0aCB8fCAwLFxuICAgICAgICAgICAgICAgIHVwZGF0ZWQ6IHRpbGRhQ2FydC51cGRhdGVkLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5OiB0aWxkYUNhcnQuY3VycmVuY3kgfHwgXCLRgC5cIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV9zaWRlOiB0aWxkYUNhcnQuY3VycmVuY3lfc2lkZSB8fCBcInJcIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV9zZXA6IHRpbGRhQ2FydC5jdXJyZW5jeV9zZXAgfHwgXCIsXCIsXG4gICAgICAgICAgICAgICAgY3VycmVuY3lfZGVjOiB0aWxkYUNhcnQuY3VycmVuY3lfZGVjIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgY3VycmVuY3lfdHh0OiB0aWxkYUNhcnQuY3VycmVuY3lfdHh0IHx8IFwi0YAuXCIsXG4gICAgICAgICAgICAgICAgY3VycmVuY3lfdHh0X3I6IHRpbGRhQ2FydC5jdXJyZW5jeV90eHRfciB8fCBcIiDRgC5cIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV90eHRfbDogdGlsZGFDYXJ0LmN1cnJlbmN5X3R4dF9sIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgc3lzdGVtOiB0aWxkYUNhcnQuc3lzdGVtIHx8IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgIHNldHRpbmdzOiB0aWxkYUNhcnQuc2V0dGluZ3MgfHwge30sXG4gICAgICAgICAgICAgICAgZGVsaXZlcnk6IHRpbGRhQ2FydC5kZWxpdmVyeSB8fCB7IG5hbWU6IFwibm9kZWxpdmVyeVwiLCBwcmljZTogMCB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3RjYXJ0JywgSlNPTi5zdHJpbmdpZnkoY2FydERhdGEpKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbc2F2ZVRpbGRhQ2FydF0g4pyTINCa0L7RgNC30LjQvdCwINGB0L7RhdGA0LDQvdC10L3QsCDQsiBsb2NhbFN0b3JhZ2UnKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNVcGRhdGluZ0NhcnQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3NhdmVUaWxkYUNhcnRdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjzonLCBlKTtcbiAgICAgICAgICAgIGxvZ0lzc3VlKCdjYXJ0X3NhdmVfZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgZXJyb3I6IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSxcbiAgICAgICAgICAgICAgICBwcm9kdWN0c0NvdW50OiB0aWxkYUNhcnQ/LnByb2R1Y3RzPy5sZW5ndGhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5pc1VwZGF0aW5nQ2FydCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGluaXRDYXJ0T2JzZXJ2ZXIoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdENhcnRPYnNlcnZlcl0g0JjQvdC40YbQuNCw0LvQuNC30LDRhtC40Y8g0L3QsNCx0LvRjtC00LDRgtC10LvRjyDQutC+0YDQt9C40L3RiycpO1xuICAgICAgICBsZXQgbGFzdE1haW5Qcm9kdWN0c1F0eSA9IHRoaXMuZ2V0TWFpblByb2R1Y3RzUXVhbnRpdHkoKTtcbiAgICAgICAgY29uc3QgY2hlY2tDYXJ0Q2hhbmdlcyA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRRdHkgPSB0aGlzLmdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCk7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF0eSAhPT0gbGFzdE1haW5Qcm9kdWN0c1F0eSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2FydE9ic2VydmVyXSDQmNC30LzQtdC90LjQu9C+0YHRjCDQutC+0LvQuNGH0LXRgdGC0LLQviDRgtC+0LLQsNGA0L7QsjonLCB7XG4gICAgICAgICAgICAgICAgICAgINCx0YvQu9C+OiBsYXN0TWFpblByb2R1Y3RzUXR5LFxuICAgICAgICAgICAgICAgICAgICDRgdGC0LDQu9C+OiBjdXJyZW50UXR5XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbGFzdE1haW5Qcm9kdWN0c1F0eSA9IGN1cnJlbnRRdHk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBvYnNlcnZlQ2FydCA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNhcnRDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuQ0FSVF9DT05UQUlORVIpO1xuICAgICAgICAgICAgaWYgKGNhcnRDb250YWluZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjYXJ0T2JzZXJ2ZXJdIE11dGF0aW9uT2JzZXJ2ZXI6INC+0LHQvdCw0YDRg9C20LXQvdGLINC40LfQvNC10L3QtdC90LjRjycpO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1F0eSA9IHRoaXMuZ2V0TWFpblByb2R1Y3RzUXVhbnRpdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXdRdHkgIT09IGxhc3RNYWluUHJvZHVjdHNRdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0TWFpblByb2R1Y3RzUXR5ID0gbmV3UXR5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZVF1YW50aXR5Q29udHJvbHNGb3JSdWxlUHJvZHVjdHMoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGNhcnRDb250YWluZXIsIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdENhcnRPYnNlcnZlcl0g4pyTIE11dGF0aW9uT2JzZXJ2ZXIg0YPRgdGC0LDQvdC+0LLQu9C10L0nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQob2JzZXJ2ZUNhcnQsIDEwMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBvYnNlcnZlQ2FydCgpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICAgICAgICAgIGNvbnN0IGRlbGV0ZUJ1dHRvbiA9IHRhcmdldC5jbG9zZXN0KERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9ERUxfQlVUVE9OKTtcbiAgICAgICAgICAgIGlmIChkZWxldGVCdXR0b24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0RWxlbWVudCA9IGRlbGV0ZUJ1dHRvbi5jbG9zZXN0KERPTV9TRUxFQ1RPUlMuQ0FSVF9QUk9EVUNUKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvZHVjdEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGl0bGVFbCA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoRE9NX1NFTEVDVE9SUy5QUk9EVUNUX1RJVExFKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdE5hbWUgPSB0aXRsZUVsPy50ZXh0Q29udGVudD8udHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvZHVjdE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2FydE9ic2VydmVyXSDQo9C00LDQu9C10L3QuNC1INGC0L7QstCw0YDQsDonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb24ocHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaXNDYXJ0QnV0dG9uID0gdGFyZ2V0LmNsb3Nlc3QoYCR7RE9NX1NFTEVDVE9SUy5QUk9EVUNUX1BMVVNfQlVUVE9OfSwgJHtET01fU0VMRUNUT1JTLlBST0RVQ1RfTUlOVVNfQlVUVE9OfSwgJHtET01fU0VMRUNUT1JTLlBST0RVQ1RfREVMX0JVVFRPTn1gKTtcbiAgICAgICAgICAgIGlmIChpc0NhcnRCdXR0b24pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0g0JrQu9C40Log0L3QsCDQutC90L7Qv9C60YMg0LrQvtGA0LfQuNC90YsnKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGNoZWNrQ2FydENoYW5nZXMoKSwgREVMQVlTLk9CU0VSVkVSX0NIRUNLKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHNldHVwTG9jYWxTdG9yYWdlSW50ZXJjZXB0b3IgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXdpbmRvdy5fX2NhcmRmb3JtX2xvY2Fsc3RvcmFnZV9pbnRlcmNlcHRlZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsU2V0SXRlbSA9IFN0b3JhZ2UucHJvdG90eXBlLnNldEl0ZW07XG4gICAgICAgICAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgU3RvcmFnZS5wcm90b3R5cGUuc2V0SXRlbSA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IG9yaWdpbmFsU2V0SXRlbS5hcHBseSh0aGlzLCBba2V5LCB2YWx1ZV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSAndGNhcnQnICYmICFzZWxmLmlzVXBkYXRpbmdDYXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0gbG9jYWxTdG9yYWdlIHRjYXJ0INC40LfQvNC10L3QtdC9INC40LfQstC90LUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gY2hlY2tDYXJ0Q2hhbmdlcygpLCBERUxBWVMuQ0FSVF9VUERBVEUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB3aW5kb3cuX19jYXJkZm9ybV9sb2NhbHN0b3JhZ2VfaW50ZXJjZXB0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdENhcnRPYnNlcnZlcl0g4pyTIGxvY2FsU3RvcmFnZS5zZXRJdGVtINC/0LXRgNC10YXQstCw0YfQtdC9Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XG4gICAgICAgICAgICBzZXR1cExvY2FsU3RvcmFnZUludGVyY2VwdG9yKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIHNldHVwTG9jYWxTdG9yYWdlSW50ZXJjZXB0b3IpO1xuICAgICAgICB9XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaGFzaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoO1xuICAgICAgICAgICAgaWYgKGhhc2ggPT09ICcjb3BlbmNhcnQnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjYXJ0T2JzZXJ2ZXJdINCa0L7RgNC30LjQvdCwINC+0YLQutGA0YvQstCw0LXRgtGB0Y8g0YfQtdGA0LXQtyAjb3BlbmNhcnQnKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRlUXVhbnRpdHlDb250cm9sc0ZvclJ1bGVQcm9kdWN0cygpO1xuICAgICAgICAgICAgICAgIH0sIERFTEFZUy5DQVJUX1VQREFURSArIDIwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBvYnNlcnZlQ2FydFZpc2liaWxpdHkgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjYXJ0V2luZG93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnQ3MDZfX2NhcnR3aW4nKTtcbiAgICAgICAgICAgIGlmIChjYXJ0V2luZG93KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmlzaWJpbGl0eU9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKG11dGF0aW9ucykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBtdXRhdGlvbnMuZm9yRWFjaCgobXV0YXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtdXRhdGlvbi50eXBlID09PSAnYXR0cmlidXRlcycgJiYgbXV0YXRpb24uYXR0cmlidXRlTmFtZSA9PT0gJ2NsYXNzJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBtdXRhdGlvbi50YXJnZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCd0NzA2X19jYXJ0d2luX3Nob3dlZCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2FydE9ic2VydmVyXSDQmtC+0YDQt9C40L3QsCDQv9C+0LrQsNC30LDQvdCwICjQutC70LDRgdGBIHQ3MDZfX2NhcnR3aW5fc2hvd2VkKScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZVF1YW50aXR5Q29udHJvbHNGb3JSdWxlUHJvZHVjdHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHZpc2liaWxpdHlPYnNlcnZlci5vYnNlcnZlKGNhcnRXaW5kb3csIHtcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlRmlsdGVyOiBbJ2NsYXNzJ11cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRDYXJ0T2JzZXJ2ZXJdIOKckyDQndCw0LHQu9GO0LTQsNGC0LXQu9GMINCy0LjQtNC40LzQvtGB0YLQuCDQutC+0YDQt9C40L3RiyDRg9GB0YLQsNC90L7QstC70LXQvScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChvYnNlcnZlQ2FydFZpc2liaWxpdHksIDEwMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBvYnNlcnZlQ2FydFZpc2liaWxpdHkoKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtpbml0Q2FydE9ic2VydmVyXSDinJMg0J3QsNCx0LvRjtC00LDRgtC10LvQuCDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3RiycpO1xuICAgIH1cbiAgICBoYW5kbGVSdWxlUHJvZHVjdERlbGV0aW9uKHByb2R1Y3ROYW1lKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbl0g0J/RgNC+0LLQtdGA0LrQsCDRgtC+0LLQsNGA0LA6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHN0YXRlXSBvZiB0aGlzLmFjdGlvbnNTdGF0ZXMpIHtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5hY3Rpb24gJiYgc3RhdGUuYWN0aW9uLnZhbHVlID09PSBwcm9kdWN0TmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbl0g0KLQvtCy0LDRgCDQuNC3INC/0YDQsNCy0LjQu9CwINC90LDQudC00LXQvTonLCB7XG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlOiBrZXksXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogc3RhdGUuYWN0aW9uLnZhbHVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbGV0IGZvdW5kRWxlbWVudCA9IG51bGw7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsSW5wdXRzID0gdGhpcy5mb3JtLnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0LCBzZWxlY3QnKTtcbiAgICAgICAgICAgICAgICBhbGxJbnB1dHMuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICgoZWwudHlwZSA9PT0gJ3JhZGlvJyB8fCBlbC50eXBlID09PSAnY2hlY2tib3gnKSAmJiBlbC52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsLnZhbHVlLnRyaW0oKSA9PT0gc3RhdGUuYWN0aW9uLnZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kRWxlbWVudCA9IGVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbl0g0J3QsNC50LTQtdC9INGN0LvQtdC80LXQvdGCOicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogZWwudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGVsLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2VkOiBlbC5jaGVja2VkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbl0g0KHQvdC40LzQsNC10Lwg0LLRi9Cx0L7RgCDRgTonLCBmb3VuZEVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICBmb3VuZEVsZW1lbnQuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbl0g4pyTINCf0YDQsNCy0LjQu9C+INC+0YLQvNC10L3QtdC90L4sIGNoZWNrYm94INGB0L3Rj9GCJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbl0g0K3Qu9C10LzQtdC90YIg0YTQvtGA0LzRiyDQvdC1INC90LDQudC00LXQvSDQtNC70Y86Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb25WYWx1ZTogc3RhdGUuYWN0aW9uLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlSW5wdXRzOiBBcnJheS5mcm9tKGFsbElucHV0cykubWFwKGVsID0+ICh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogZWwudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZWwudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgbG9nSXNzdWUoJ2Zvcm1fZWxlbWVudF9ub3RfZm91bmQnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiAnaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZEtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uVmFsdWU6IHN0YXRlLmFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZUlucHV0c0NvdW50OiBhbGxJbnB1dHMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyB1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0J3QsNGH0LDQu9C+INC+0LHQvdC+0LLQu9C10L3QuNGPINC60L7Qu9C40YfQtdGB0YLQstCwJyk7XG4gICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgaWYgKCF0aWxkYUNhcnQgfHwgIUFycmF5LmlzQXJyYXkodGlsZGFDYXJ0LnByb2R1Y3RzKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDQmtC+0YDQt9C40L3QsCDQvdC10LTQvtGB0YLRg9C/0L3QsCcpO1xuICAgICAgICAgICAgbG9nSXNzdWUoJ2NhcnRfdW5hdmFpbGFibGUnLCB7XG4gICAgICAgICAgICAgICAgY29udGV4dDogJ3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5J1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0JDQutGC0LjQstC90YvRhSDQv9GA0LDQstC40Ls6JywgdGhpcy5hY3Rpb25zU3RhdGVzLnNpemUpO1xuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHN0YXRlXSBvZiB0aGlzLmFjdGlvbnNTdGF0ZXMpIHtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5hY3Rpb24gJiYgc3RhdGUuYWN0aW9uLnF1YW50aXR5VHlwZSA9PT0gJ3BlclByb2R1Y3QnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3UXVhbnRpdHkgPSB0aGlzLmNhbGN1bGF0ZVJ1bGVQcm9kdWN0UXVhbnRpdHkoc3RhdGUuYWN0aW9uKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0SW5kZXggPSB0aWxkYUNhcnQucHJvZHVjdHMuZmluZEluZGV4KChwKSA9PiBwLm5hbWU/LnRyaW0oKSA9PT0gc3RhdGUuYWN0aW9uLnZhbHVlLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkUXVhbnRpdHkgPSBwYXJzZUludCh0aWxkYUNhcnQucHJvZHVjdHNbcHJvZHVjdEluZGV4XS5xdWFudGl0eSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCi0L7QstCw0YAgXCIke3N0YXRlLmFjdGlvbi52YWx1ZX1cIjpgLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRRdWFudGl0eTogb2xkUXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdRdWFudGl0eTogbmV3UXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICBuZWVkc1VwZGF0ZTogb2xkUXVhbnRpdHkgIT09IG5ld1F1YW50aXR5XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAob2xkUXVhbnRpdHkgIT09IG5ld1F1YW50aXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDimqEg0J7QsdC90L7QstC70Y/QtdC8INGH0LXRgNC10LcgdGNhcnRfX3Byb2R1Y3RfX3VwZGF0ZVF1YW50aXR5Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcHJvZHVjdEVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCAxMDsgYXR0ZW1wdCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdEVsZW1lbnQgPSBDYXJ0VXRpbHMuZmluZFByb2R1Y3RFbGVtZW50KHN0YXRlLmFjdGlvbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCt0LvQtdC80LXQvdGCINC90LDQudC00LXQvSDQvdCwINC/0L7Qv9GL0YLQutC1OicsIGF0dGVtcHQgKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRlbXB0IDwgOSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuRE9NX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcXVhbnRpdHlFbGVtZW50ID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLlBST0RVQ1RfUVVBTlRJVFkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChxdWFudGl0eUVsZW1lbnQgJiYgdHlwZW9mIHdpbmRvdy50Y2FydF9fcHJvZHVjdF9fdXBkYXRlUXVhbnRpdHkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnRjYXJ0X19wcm9kdWN0X191cGRhdGVRdWFudGl0eShxdWFudGl0eUVsZW1lbnQsIHByb2R1Y3RFbGVtZW50LCBwcm9kdWN0SW5kZXgsIG5ld1F1YW50aXR5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g4pyTINCa0L7Qu9C40YfQtdGB0YLQstC+INC+0LHQvdC+0LLQu9C10L3QviDRh9C10YDQtdC3IFRpbGRhIEFQSTonLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRRdWFudGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1F1YW50aXR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dJc3N1ZSgncnVsZV9wcm9kdWN0X3F1YW50aXR5X3VwZGF0ZWQnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0TmFtZTogc3RhdGUuYWN0aW9uLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkUXVhbnRpdHk6IG9sZFF1YW50aXR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3UXVhbnRpdHk6IG5ld1F1YW50aXR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbnRpdHlUeXBlOiBzdGF0ZS5hY3Rpb24ucXVhbnRpdHlUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuRE9NX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsdXNNaW51c0J1dHRvbnMgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9QTFVTTUlOVVMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGx1c01pbnVzQnV0dG9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1c01pbnVzQnV0dG9ucy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCd0LUg0L3QsNC50LTQtdC9IHF1YW50aXR5RWxlbWVudCDQuNC70Lgg0YTRg9C90LrRhtC40Y8gdXBkYXRlUXVhbnRpdHknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nSXNzdWUoJ2NhcnRfdXBkYXRlX2VsZW1lbnRfbm90X2ZvdW5kJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogJ3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3ROYW1lOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNRdWFudGl0eUVsZW1lbnQ6ICEhcXVhbnRpdHlFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzVXBkYXRlRnVuY3Rpb246IHR5cGVvZiB3aW5kb3cudGNhcnRfX3Byb2R1Y3RfX3VwZGF0ZVF1YW50aXR5ID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0J3QtSDQvdCw0LnQtNC10L0gRE9NINGN0LvQtdC80LXQvdGCINGC0L7QstCw0YDQsCDQv9C+0YHQu9C1INC+0LbQuNC00LDQvdC40Y8nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dJc3N1ZSgncHJvZHVjdF9lbGVtZW50X25vdF9mb3VuZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogJ3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdE5hbWU6IHN0YXRlLmFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0ZW1wdHM6IDEwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0KLQvtCy0LDRgCBcIiR7c3RhdGUuYWN0aW9uLnZhbHVlfVwiINCd0JUg0L3QsNC50LTQtdC9INCyINC60L7RgNC30LjQvdC1YCk7XG4gICAgICAgICAgICAgICAgICAgIGxvZ0lzc3VlKCdwcm9kdWN0X25vdF9mb3VuZF9pbl9jYXJ0Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogJ3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3ROYW1lOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJ0UHJvZHVjdHNDb3VudDogdGlsZGFDYXJ0LnByb2R1Y3RzLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g4pyTINCe0LHQvdC+0LLQu9C10L3QuNC1INC30LDQstC10YDRiNC10L3QvicpO1xuICAgICAgICBhd2FpdCB0aGlzLmhpZGVRdWFudGl0eUNvbnRyb2xzRm9yUnVsZVByb2R1Y3RzKCk7XG4gICAgfVxuICAgIHVwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTShwcm9kdWN0TmFtZSwgbmV3UXVhbnRpdHkpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dINCe0LHQvdC+0LLQu9C10L3QuNC1OicsIHsgcHJvZHVjdE5hbWUsIG5ld1F1YW50aXR5IH0pO1xuICAgICAgICBjb25zdCB0aXRsZVNlbGVjdG9ycyA9IFtcbiAgICAgICAgICAgICcudDcwNl9fcHJvZHVjdC10aXRsZScsXG4gICAgICAgICAgICAnLnQtc3RvcmVfX3Byb2R1Y3QtbmFtZScsXG4gICAgICAgICAgICAnLnQtcHJvZHVjdF9fdGl0bGUnLFxuICAgICAgICAgICAgJy5qcy1wcm9kdWN0LW5hbWUnXG4gICAgICAgIF07XG4gICAgICAgIGxldCBwcm9kdWN0RWxlbWVudCA9IG51bGw7XG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgdGl0bGVTZWxlY3RvcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RUaXRsZXMgPSBbLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcildO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dINCf0L7QuNGB0Log0YfQtdGA0LXQtyBcIiR7c2VsZWN0b3J9XCI6YCwgcHJvZHVjdFRpdGxlcy5sZW5ndGgsICfRjdC70LXQvNC10L3RgtC+0LInKTtcbiAgICAgICAgICAgIGNvbnN0IGZvdW5kRWxlbWVudCA9IHByb2R1Y3RUaXRsZXMuZmluZChlbCA9PiBlbC5pbm5lclRleHQudHJpbSgpID09PSBwcm9kdWN0TmFtZS50cmltKCkpO1xuICAgICAgICAgICAgaWYgKGZvdW5kRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHByb2R1Y3RFbGVtZW50ID0gZm91bmRFbGVtZW50LmNsb3Nlc3QoJy50NzA2X19jYXJ0d2luLXByb2R1Y3QsIC50LXN0b3JlX19wcm9kdWN0LCAudC1wcm9kdWN0Jyk7XG4gICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDinJMg0KLQvtCy0LDRgCDQvdCw0LnQtNC10L0g0YfQtdGA0LXQtzonLCBzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDinJcg0K3Qu9C10LzQtdC90YIg0YLQvtCy0LDRgNCwINCd0JUg0L3QsNC50LTQtdC9INCyIERPTTonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g0JLRgdC1INGC0L7QstCw0YDRiyDQsiBET006JywgWy4uLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50NzA2X19wcm9kdWN0LXRpdGxlLCAudC1zdG9yZV9fcHJvZHVjdC1uYW1lJyldLm1hcCgoZWwpID0+IGVsLmlubmVyVGV4dCkpO1xuICAgICAgICAgICAgbG9nSXNzdWUoJ3Byb2R1Y3RfZWxlbWVudF9ub3RfZm91bmRfaW5fZG9tJywge1xuICAgICAgICAgICAgICAgIGNvbnRleHQ6ICd1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET00nLFxuICAgICAgICAgICAgICAgIHByb2R1Y3ROYW1lOiBwcm9kdWN0TmFtZSxcbiAgICAgICAgICAgICAgICBwcm9kdWN0c0luRE9NOiBbLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnQ3MDZfX3Byb2R1Y3QtdGl0bGUsIC50LXN0b3JlX19wcm9kdWN0LW5hbWUnKV0ubGVuZ3RoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBxdWFudGl0eUlucHV0U2VsZWN0b3JzID0gW1xuICAgICAgICAgICAgJy50NzA2X19wcm9kdWN0LXF1YW50aXR5JyxcbiAgICAgICAgICAgICcudC1zdG9yZV9fcXVhbnRpdHktaW5wdXQnLFxuICAgICAgICAgICAgJ2lucHV0W25hbWU9XCJxdWFudGl0eVwiXScsXG4gICAgICAgICAgICAnLmpzLXByb2R1Y3QtcXVhbnRpdHknXG4gICAgICAgIF07XG4gICAgICAgIGxldCBxdWFudGl0eUlucHV0ID0gbnVsbDtcbiAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBxdWFudGl0eUlucHV0U2VsZWN0b3JzKSB7XG4gICAgICAgICAgICBxdWFudGl0eUlucHV0ID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgICAgICBpZiAocXVhbnRpdHlJbnB1dCkge1xuICAgICAgICAgICAgICAgIHF1YW50aXR5SW5wdXQudmFsdWUgPSBuZXdRdWFudGl0eS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIHF1YW50aXR5SW5wdXQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2NoYW5nZScsIHsgYnViYmxlczogdHJ1ZSB9KSk7XG4gICAgICAgICAgICAgICAgcXVhbnRpdHlJbnB1dC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnaW5wdXQnLCB7IGJ1YmJsZXM6IHRydWUgfSkpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDinJMg0J7QsdC90L7QstC70LXQvSBpbnB1dCDRh9C10YDQtdC3OicsIHNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBxdWFudGl0eURpc3BsYXlTZWxlY3RvcnMgPSBbXG4gICAgICAgICAgICAnLnQtcXVhbnRpdHlfX3ZhbHVlJyxcbiAgICAgICAgICAgICcudDcwNl9fcHJvZHVjdC1xdWFudGl0eS12YWx1ZScsXG4gICAgICAgICAgICAnLnQtc3RvcmVfX3F1YW50aXR5LXZhbHVlJ1xuICAgICAgICBdO1xuICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHF1YW50aXR5RGlzcGxheVNlbGVjdG9ycykge1xuICAgICAgICAgICAgY29uc3QgcXVhbnRpdHlEaXNwbGF5ID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgICAgICBpZiAocXVhbnRpdHlEaXNwbGF5KSB7XG4gICAgICAgICAgICAgICAgcXVhbnRpdHlEaXNwbGF5LnRleHRDb250ZW50ID0gbmV3UXVhbnRpdHkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g4pyTINCe0LHQvdC+0LLQu9C10L0gZGlzcGxheSDRh9C10YDQtdC3OicsIHNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICh0aWxkYUNhcnQpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aWxkYUNhcnQucHJvZHVjdHMuZmluZCgocCkgPT4gcC5uYW1lPy50cmltKCkgPT09IHByb2R1Y3ROYW1lLnRyaW0oKSk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsUHJpY2UgPSBwYXJzZUZsb2F0KHByb2R1Y3QucHJpY2UpICogbmV3UXVhbnRpdHk7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJpY2VTZWxlY3RvcnMgPSBbXG4gICAgICAgICAgICAgICAgICAgICcudDcwNl9fcHJvZHVjdC1wcmljZScsXG4gICAgICAgICAgICAgICAgICAgICcudC1zdG9yZV9fcHJvZHVjdC1wcmljZScsXG4gICAgICAgICAgICAgICAgICAgICcudC1wcm9kdWN0X19wcmljZScsXG4gICAgICAgICAgICAgICAgICAgICcuanMtcHJvZHVjdC1wcmljZSdcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgcHJpY2VTZWxlY3RvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJpY2VFbGVtZW50ID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmljZUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaWNlRWxlbWVudC50ZXh0Q29udGVudCA9IGAke3RvdGFsUHJpY2UudG9Mb2NhbGVTdHJpbmcoJ3J1LVJVJyl9ICR7dGlsZGFDYXJ0LmN1cnJlbmN5X3R4dF9yIHx8ICcg0YAuJ31gO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dIOKckyDQntCx0L3QvtCy0LvQtdC90LAg0YHRgtC+0LjQvNC+0YHRgtGMINGH0LXRgNC10Lc6Jywgc2VsZWN0b3IsIHRvdGFsUHJpY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dIOKckyDQntCx0L3QvtCy0LvQtdC90LjQtSDQt9Cw0LLQtdGA0YjQtdC90L4g0LTQu9GPOicsIHByb2R1Y3ROYW1lKTtcbiAgICB9XG4gICAgdXBkYXRlQWxsQ2FydEl0ZW1zSW5ET00oKSB7XG4gICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgaWYgKCF0aWxkYUNhcnQgfHwgIUFycmF5LmlzQXJyYXkodGlsZGFDYXJ0LnByb2R1Y3RzKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3VwZGF0ZUFsbENhcnRJdGVtc0luRE9NXSDQmtC+0YDQt9C40L3QsCDQvdC10LTQvtGB0YLRg9C/0L3QsCcpO1xuICAgICAgICAgICAgbG9nSXNzdWUoJ2NhcnRfdW5hdmFpbGFibGUnLCB7XG4gICAgICAgICAgICAgICAgY29udGV4dDogJ3VwZGF0ZUFsbENhcnRJdGVtc0luRE9NJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVBbGxDYXJ0SXRlbXNJbkRPTV0g0J7QsdC90L7QstC70Y/QtdC8INCy0YHQtSDRgtC+0LLQsNGA0Ysg0LIgRE9NJyk7XG4gICAgICAgIHRpbGRhQ2FydC5wcm9kdWN0cy5mb3JFYWNoKChwcm9kdWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0TmFtZSA9IHByb2R1Y3QubmFtZT8udHJpbSgpO1xuICAgICAgICAgICAgY29uc3QgcXVhbnRpdHkgPSBwYXJzZUludChwcm9kdWN0LnF1YW50aXR5IHx8IDEpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3ROYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET00ocHJvZHVjdE5hbWUsIHF1YW50aXR5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQWxsQ2FydEl0ZW1zSW5ET01dIOKckyDQktGB0LUg0YLQvtCy0LDRgNGLINC+0LHQvdC+0LLQu9C10L3RiycpO1xuICAgIH1cbiAgICByZWZyZXNoQ2FydFVJKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3JlZnJlc2hDYXJ0VUldINCd0LDRh9Cw0LvQviDQvtCx0L3QvtCy0LvQtdC90LjRjyBVSSDQutC+0YDQt9C40L3RiycpO1xuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy50X3N0b3JlX19yZWZyZXNoY2FydCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgd2luZG93LnRfc3RvcmVfX3JlZnJlc2hjYXJ0KCk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3JlZnJlc2hDYXJ0VUldIOKckyDQktGL0LfQstCw0L0gdF9zdG9yZV9fcmVmcmVzaGNhcnQnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZWZyZXNoRnVuY3Rpb25zID0gW1xuICAgICAgICAgICAgJ3Q3MDZfX3VwZGF0ZUNhcnQnLFxuICAgICAgICAgICAgJ3RjYXJ0X191cGRhdGVDYXJ0JyxcbiAgICAgICAgICAgICd0X3N0b3JlX191cGRhdGVDYXJ0JyxcbiAgICAgICAgICAgICd0NzA2X2luaXQnXG4gICAgICAgIF07XG4gICAgICAgIHJlZnJlc2hGdW5jdGlvbnMuZm9yRWFjaChmdW5jTmFtZSA9PiB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvd1tmdW5jTmFtZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3dbZnVuY05hbWVdKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbcmVmcmVzaENhcnRVSV0g4pyTINCS0YvQt9Cy0LDQvSAke2Z1bmNOYW1lfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtmb3JtXSBbcmVmcmVzaENhcnRVSV0g0J7RiNC40LHQutCwICR7ZnVuY05hbWV9OmAsIGUpO1xuICAgICAgICAgICAgICAgICAgICBsb2dJc3N1ZSgnY2FydF9yZWZyZXNoX2Z1bmN0aW9uX2Vycm9yJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogJ3JlZnJlc2hDYXJ0VUknLFxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25OYW1lOiBmdW5jTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSlcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy51cGRhdGVBbGxDYXJ0SXRlbXNJbkRPTSgpO1xuICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2NhcnQtdXBkYXRlZCcpKTtcbiAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ3RjYXJ0LXVwZGF0ZWQnKSk7XG4gICAgICAgIHRoaXMudXBkYXRlQ2FydENvdW50ZXJzKCk7XG4gICAgfVxuICAgIHVwZGF0ZUNhcnRDb3VudGVycygpIHtcbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAoIXRpbGRhQ2FydClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgY2FydENvdW50ZXJzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChET01fU0VMRUNUT1JTLkNBUlRfQ09VTlRFUik7XG4gICAgICAgIGNhcnRDb3VudGVycy5mb3JFYWNoKGNvdW50ZXIgPT4ge1xuICAgICAgICAgICAgaWYgKGNvdW50ZXIpIHtcbiAgICAgICAgICAgICAgICBjb3VudGVyLnRleHRDb250ZW50ID0gdGlsZGFDYXJ0LnRvdGFsLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBjYXJ0QW1vdW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoRE9NX1NFTEVDVE9SUy5DQVJUX0FNT1VOVCk7XG4gICAgICAgIGNhcnRBbW91bnRzLmZvckVhY2goYW1vdW50ID0+IHtcbiAgICAgICAgICAgIGlmIChhbW91bnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtYXR0ZWRBbW91bnQgPSB0aWxkYUNhcnQuYW1vdW50LnRvTG9jYWxlU3RyaW5nKCdydS1SVScpO1xuICAgICAgICAgICAgICAgIGFtb3VudC50ZXh0Q29udGVudCA9IGAke2Zvcm1hdHRlZEFtb3VudH0gJHt0aWxkYUNhcnQuY3VycmVuY3lfdHh0X3IgfHwgJyDRgC4nfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRDb3VudGVyc10g4pyTINCh0YfQtdGC0YfQuNC60Lgg0L7QsdC90L7QstC70LXQvdGLJyk7XG4gICAgfVxuICAgIGdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCkge1xuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICghdGlsZGFDYXJ0IHx8ICFBcnJheS5pc0FycmF5KHRpbGRhQ2FydC5wcm9kdWN0cykpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJ1bGVQcm9kdWN0TmFtZXMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMucnVsZXMuZm9yRWFjaChydWxlID0+IHtcbiAgICAgICAgICAgIHJ1bGUuYWN0aW9ucy5mb3JFYWNoKGFjdGlvbiA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBydWxlUHJvZHVjdE5hbWVzLmFkZChhY3Rpb24udmFsdWUudHJpbSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGxldCB0b3RhbFF1YW50aXR5ID0gMDtcbiAgICAgICAgY29uc3QgbWFpblByb2R1Y3RzID0gW107XG4gICAgICAgIHRpbGRhQ2FydC5wcm9kdWN0cy5mb3JFYWNoKChwcm9kdWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0TmFtZSA9IHByb2R1Y3QubmFtZT8udHJpbSgpO1xuICAgICAgICAgICAgY29uc3QgaXNSdWxlUHJvZHVjdCA9IHJ1bGVQcm9kdWN0TmFtZXMuaGFzKHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IHF0eSA9IHBhcnNlSW50KHByb2R1Y3QucXVhbnRpdHkgfHwgMSk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdE5hbWUgJiYgIWlzUnVsZVByb2R1Y3QpIHtcbiAgICAgICAgICAgICAgICB0b3RhbFF1YW50aXR5ICs9IHF0eTtcbiAgICAgICAgICAgICAgICBtYWluUHJvZHVjdHMucHVzaChgJHtwcm9kdWN0TmFtZX0gKCR7cXR5fSDRiNGCKWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtnZXRNYWluUHJvZHVjdHNRdWFudGl0eV0nLCB7XG4gICAgICAgICAgICAn0J7RgdC90L7QstC90YvRhSDRgtC+0LLQsNGA0L7Qsic6IHRvdGFsUXVhbnRpdHksXG4gICAgICAgICAgICAn0KHQv9C40YHQvtC6JzogbWFpblByb2R1Y3RzLFxuICAgICAgICAgICAgJ9Ci0L7QstCw0YDRiyDQv9GA0LDQstC40LsnOiBBcnJheS5mcm9tKHJ1bGVQcm9kdWN0TmFtZXMpXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdG90YWxRdWFudGl0eTtcbiAgICB9XG4gICAgY2FsY3VsYXRlUnVsZVByb2R1Y3RRdWFudGl0eShhY3Rpb24pIHtcbiAgICAgICAgaWYgKGFjdGlvbi5xdWFudGl0eSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gYWN0aW9uLnF1YW50aXR5O1xuICAgICAgICB9XG4gICAgICAgIGlmIChhY3Rpb24ucXVhbnRpdHlUeXBlID09PSAncGVyUHJvZHVjdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLm1heCgxLCB0aGlzLmdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBhc3luYyByZW1vdmVQcm9kdWN0RnJvbUNhcnQocHJvZHVjdE5hbWUpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtyZW1vdmVQcm9kdWN0XSDQn9C+0L/Ri9GC0LrQsCDRg9C00LDQu9C40YLRjDonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3RFbGVtZW50ID0gQ2FydFV0aWxzLmZpbmRQcm9kdWN0RWxlbWVudChwcm9kdWN0TmFtZSk7XG4gICAgICAgIGlmIChwcm9kdWN0RWxlbWVudCkge1xuICAgICAgICAgICAgY29uc3QgZGVsUHJvZHVjdEJ1dHRvbiA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoRE9NX1NFTEVDVE9SUy5QUk9EVUNUX0RFTF9CVVRUT04pO1xuICAgICAgICAgICAgaWYgKGRlbFByb2R1Y3RCdXR0b24pIHtcbiAgICAgICAgICAgICAgICBkZWxQcm9kdWN0QnV0dG9uLmNsaWNrKCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtyZW1vdmVQcm9kdWN0XSDinJMg0KPQtNCw0LvQtdC90L4g0YfQtdGA0LXQtyBET00gKNC60LvQuNC6KTonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgQ2FydFV0aWxzLndhaXQoREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICh0aWxkYUNhcnQgJiYgQXJyYXkuaXNBcnJheSh0aWxkYUNhcnQucHJvZHVjdHMpKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0SW5kZXggPSB0aWxkYUNhcnQucHJvZHVjdHMuZmluZEluZGV4KChwKSA9PiBwLm5hbWU/LnRyaW0oKSA9PT0gcHJvZHVjdE5hbWUudHJpbSgpKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0SW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRpbGRhQ2FydC5wcm9kdWN0c1twcm9kdWN0SW5kZXhdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlbW92ZUZ1bmN0aW9ucyA9IFtcbiAgICAgICAgICAgICAgICAgICAgJ3RjYXJ0X19yZW1vdmVQcm9kdWN0JyxcbiAgICAgICAgICAgICAgICAgICAgJ3RjYXJ0X3JlbW92ZVByb2R1Y3QnLFxuICAgICAgICAgICAgICAgICAgICAndF9zdG9yZV9fcmVtb3ZlUHJvZHVjdCdcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZnVuY05hbWUgb2YgcmVtb3ZlRnVuY3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93W2Z1bmNOYW1lXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3dbZnVuY05hbWVdKHByb2R1Y3QudWlkIHx8IHByb2R1Y3QuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbcmVtb3ZlUHJvZHVjdF0g4pyTINCj0LTQsNC70LXQvdC+INGH0LXRgNC10LcgJHtmdW5jTmFtZX06YCwgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IENhcnRVdGlscy53YWl0KERFTEFZUy5DQVJUX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2Zvcm1dIFtyZW1vdmVQcm9kdWN0XSDQntGI0LjQsdC60LAgJHtmdW5jTmFtZX06YCwgZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGlsZGFDYXJ0LnByb2R1Y3RzLnNwbGljZShwcm9kdWN0SW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIHRpbGRhQ2FydC5hbW91bnQgPSB0aWxkYUNhcnQucHJvZHVjdHMucmVkdWNlKChzdW0sIHApID0+IHN1bSArIChwYXJzZUZsb2F0KHAucHJpY2UpICogcGFyc2VJbnQocC5xdWFudGl0eSB8fCAxKSksIDApO1xuICAgICAgICAgICAgICAgIHRpbGRhQ2FydC5wcm9kYW1vdW50ID0gdGlsZGFDYXJ0LnByb2R1Y3RzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB0aWxkYUNhcnQudG90YWwgPSB0aWxkYUNhcnQucHJvZHVjdHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHRpbGRhQ2FydC51cGRhdGVkID0gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2F2ZVRpbGRhQ2FydCh0aWxkYUNhcnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LnRfc3RvcmVfX3JlZnJlc2hjYXJ0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cudF9zdG9yZV9fcmVmcmVzaGNhcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3JlbW92ZVByb2R1Y3RdIOKckyDQo9C00LDQu9C10L3QviDQvdCw0L/RgNGP0LzRg9GOINC40Lcg0LzQsNGB0YHQuNCy0LA6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuQ0FSVF9VUERBVEUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3JlbW92ZVByb2R1Y3RdIOKclyDQndC1INGD0LTQsNC70L7RgdGMINGD0LTQsNC70LjRgtGMINGC0L7QstCw0YA6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICBsb2dJc3N1ZSgncHJvZHVjdF9yZW1vdmFsX2ZhaWxlZCcsIHtcbiAgICAgICAgICAgIGNvbnRleHQ6ICdyZW1vdmVQcm9kdWN0RnJvbUNhcnQnLFxuICAgICAgICAgICAgcHJvZHVjdE5hbWU6IHByb2R1Y3ROYW1lLFxuICAgICAgICAgICAgY2FydFByb2R1Y3RzQ291bnQ6IHRpbGRhQ2FydD8ucHJvZHVjdHM/Lmxlbmd0aFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhc3luYyBhcHBseUFjdGlvbnMob2xkU3RhdGUgPSBuZXcgTWFwKCkpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNBcHBseWluZ0FjdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQo9C20LUg0LLRi9C/0L7Qu9C90Y/QtdGC0YHRjywg0L/RgNC+0L/Rg9GB0LrQsNC10LwnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlzQXBwbHlpbmdBY3Rpb25zID0gdHJ1ZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQndCw0YfQsNC70L4g0L/RgNC40LzQtdC90LXQvdC40Y8g0LTQtdC50YHRgtCy0LjQuScpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdINCh0YLQsNGA0L7QtSDRgdC+0YHRgtC+0Y/QvdC40LU6JywgT2JqZWN0LmZyb21FbnRyaWVzKG9sZFN0YXRlKSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0J3QvtCy0L7QtSDRgdC+0YHRgtC+0Y/QvdC40LU6JywgT2JqZWN0LmZyb21FbnRyaWVzKHRoaXMuYWN0aW9uc1N0YXRlcykpO1xuICAgICAgICAgICAgY29uc3QgY2FydExvYWRlZCA9IGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICAgICAgICAgICAgbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFsuLi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAudDcwNl9fcHJvZHVjdC10aXRsZWApXS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZShmYWxzZSksIDMwMDApKVxuICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICBpZiAoIWNhcnRMb2FkZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQmtC+0YDQt9C40L3QsCDQvdC1INC30LDQs9GA0YPQt9C40LvQsNGB0Ywg0LfQsCAzINGB0LXQutGD0L3QtNGLLCDQv9GA0L7QtNC+0LvQttCw0LXQvCcpO1xuICAgICAgICAgICAgICAgIGxvZ0lzc3VlKCdjYXJ0X2xvYWRfdGltZW91dCcsIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dDogJ2FwcGx5QWN0aW9ucycsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6IDMwMDBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3QgW2tleSwgc3RhdGVdIG9mIHRoaXMuYWN0aW9uc1N0YXRlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZFZhbHVlID0gb2xkU3RhdGUuZ2V0KGtleSk/LnZhbHVlO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZEFjdGlvbiA9IG9sZFN0YXRlLmdldChrZXkpPy5hY3Rpb247XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFthcHBseUFjdGlvbnNdINCe0LHRgNCw0LHQvtGC0LrQsCDQv9C+0LvRjyBcIiR7a2V5fVwiOmAsIHtcbiAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlOiBzdGF0ZS52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgb2xkQWN0aW9uOiBvbGRBY3Rpb24/LnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBuZXdBY3Rpb246IHN0YXRlLmFjdGlvbj8udmFsdWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUudmFsdWUgIT09IG9sZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvbGRBY3Rpb24gJiYgb2xkQWN0aW9uLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0KPQtNCw0LvRj9C10Lwg0YHRgtCw0YDRi9C5INGC0L7QstCw0YA6Jywgb2xkQWN0aW9uLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbW92ZWQgPSBhd2FpdCB0aGlzLnJlbW92ZVByb2R1Y3RGcm9tQ2FydChvbGRBY3Rpb24udmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlbW92ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dJc3N1ZSgncnVsZV9wcm9kdWN0X3JlbW92ZWQnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3ROYW1lOiBvbGRBY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkS2V5OiBrZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaWNlOiBvbGRBY3Rpb24uc3VtIHx8IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdGUudmFsdWUgJiYgc3RhdGUuYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0SWQgPSBgcnVsZV8ke2tleX1fJHtEYXRlLm5vdygpfWA7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0UXVhbnRpdHkgPSB0aGlzLmNhbGN1bGF0ZVJ1bGVQcm9kdWN0UXVhbnRpdHkoc3RhdGUuYWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQlNC+0LHQsNCy0LvRj9C10Lwg0L3QvtCy0YvQuSDRgtC+0LLQsNGAOicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogcHJvZHVjdElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHN0YXRlLmFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmljZTogc3RhdGUuYWN0aW9uLnN1bSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXR5OiBwcm9kdWN0UXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbnRpdHlUeXBlOiBzdGF0ZS5hY3Rpb24ucXVhbnRpdHlUeXBlIHx8ICdmaXhlZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnRjYXJ0X19hZGRQcm9kdWN0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogcHJvZHVjdElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHN0YXRlLmFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmljZTogc3RhdGUuYWN0aW9uLnN1bSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXR5OiBwcm9kdWN0UXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ0lzc3VlKCdydWxlX3Byb2R1Y3RfYWRkZWQnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdE5hbWU6IHN0YXRlLmFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZEtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaWNlOiBzdGF0ZS5hY3Rpb24uc3VtIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbnRpdHk6IHByb2R1Y3RRdWFudGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWFudGl0eVR5cGU6IHN0YXRlLmFjdGlvbi5xdWFudGl0eVR5cGUgfHwgJ2ZpeGVkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGFuZ2VQcm9kdWN0ID0gYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoYW5nZVByb2R1Y3QgPSBbLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLnQ3MDZfX3Byb2R1Y3QtdGl0bGVgKV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKChlKSA9PiBlLmlubmVyVGV4dC50cmltKCkgPT09IHN0YXRlLmFjdGlvbi52YWx1ZS50cmltKCkpPy5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGNoYW5nZVByb2R1Y3QgfHwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAzMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hhbmdlUHJvZHVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoYW5nZVByb2R1Y3RCdXR0b24gPSBjaGFuZ2VQcm9kdWN0LnF1ZXJ5U2VsZWN0b3IoYC50NzA2X19wcm9kdWN0LXBsdXNtaW51c2ApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VQcm9kdWN0QnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZVByb2R1Y3RCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdIOKckyDQodC60YDRi9GC0Ysg0LrQvdC+0L/QutC4INC60L7Qu9C40YfQtdGB0YLQstCwJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFzdGF0ZS52YWx1ZSB8fCAhc3RhdGUuYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0JfQvdCw0YfQtdC90LjQtSDRgdCx0YDQvtGI0LXQvdC+LCDRgtC+0LLQsNGAINGD0LTQsNC70LXQvScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdIOKckyDQn9GA0LjQvNC10L3QtdC90LjQtSDQtNC10LnRgdGC0LLQuNC5INC30LDQstC10YDRiNC10L3QvicpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5oaWRlUXVhbnRpdHlDb250cm9sc0ZvclJ1bGVQcm9kdWN0cygpO1xuICAgICAgICB9XG4gICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5pc0FwcGx5aW5nQWN0aW9ucyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldEFsbFJ1bGVQcm9kdWN0TmFtZXMoKSB7XG4gICAgICAgIGNvbnN0IHJ1bGVQcm9kdWN0TmFtZXMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMucnVsZXMuZm9yRWFjaChydWxlID0+IHtcbiAgICAgICAgICAgIHJ1bGUuYWN0aW9ucy5mb3JFYWNoKGFjdGlvbiA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBydWxlUHJvZHVjdE5hbWVzLmFkZChhY3Rpb24udmFsdWUudHJpbSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaGlkZVF1YW50aXR5XSDQktGB0LUg0YLQvtCy0LDRgNGLINC40Lcg0L/RgNCw0LLQuNC7OicsIEFycmF5LmZyb20ocnVsZVByb2R1Y3ROYW1lcykpO1xuICAgICAgICByZXR1cm4gcnVsZVByb2R1Y3ROYW1lcztcbiAgICB9XG4gICAgYXN5bmMgaGlkZVF1YW50aXR5Q29udHJvbHNGb3JSdWxlUHJvZHVjdHMoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaGlkZVF1YW50aXR5XSDQndCw0YfQsNC70L4g0YHQutGA0YvRgtC40Y8g0YHRh9C10YLRh9C40LrQvtCyINC00LvRjyDRgtC+0LLQsNGA0L7QsiDQuNC3INC/0YDQsNCy0LjQuycpO1xuICAgICAgICBjb25zdCBydWxlUHJvZHVjdE5hbWVzID0gdGhpcy5nZXRBbGxSdWxlUHJvZHVjdE5hbWVzKCk7XG4gICAgICAgIGlmIChydWxlUHJvZHVjdE5hbWVzLnNpemUgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaGlkZVF1YW50aXR5XSDQndC10YIg0YLQvtCy0LDRgNC+0LIg0LjQtyDQv9GA0LDQstC40LsnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuRE9NX1VQREFURSk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3RFbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoRE9NX1NFTEVDVE9SUy5DQVJUX1BST0RVQ1QpO1xuICAgICAgICBsZXQgaGlkZGVuQ291bnQgPSAwO1xuICAgICAgICBwcm9kdWN0RWxlbWVudHMuZm9yRWFjaCgocHJvZHVjdEVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRpdGxlRWxlbWVudCA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoRE9NX1NFTEVDVE9SUy5QUk9EVUNUX1RJVExFKTtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3ROYW1lID0gdGl0bGVFbGVtZW50Py50ZXh0Q29udGVudD8udHJpbSgpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3ROYW1lICYmIHJ1bGVQcm9kdWN0TmFtZXMuaGFzKHByb2R1Y3ROYW1lKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBsdXNNaW51c0Jsb2NrID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLlBST0RVQ1RfUExVU01JTlVTKTtcbiAgICAgICAgICAgICAgICBpZiAocGx1c01pbnVzQmxvY2sgJiYgcGx1c01pbnVzQmxvY2suc3R5bGUuZGlzcGxheSAhPT0gJ25vbmUnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBsdXNNaW51c0Jsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgIGhpZGRlbkNvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbaGlkZVF1YW50aXR5XSDinJMg0KHQutGA0YvRgtGLINC60L3QvtC/0LrQuCDQtNC70Y8g0YLQvtCy0LDRgNCwOiBcIiR7cHJvZHVjdE5hbWV9XCJgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW2hpZGVRdWFudGl0eV0g4pyTINCh0LrRgNGL0YLQviDRgdGH0LXRgtGH0LjQutC+0LI6ICR7aGlkZGVuQ291bnR9YCk7XG4gICAgfVxufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgeyBDYXJkRm9ybSB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ2FyZEZvcm0nO1xuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgd2luZG93LkNhcmRGb3JtID0gQ2FyZEZvcm07XG59XG5leHBvcnQgZGVmYXVsdCBDYXJkRm9ybTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==