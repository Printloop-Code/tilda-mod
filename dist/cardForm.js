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
            window.OpenReplay.handleError(key, payload);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FyZEZvcm0uanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87Ozs7Ozs7Ozs7Ozs7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOEJBQThCLHVCQUF1QjtBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTztBQUNQLGtCQUFrQixvQkFBb0I7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRCxhQUFhO0FBQzdEO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxnREFBZ0QsYUFBYTtBQUM3RDtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtEQUFrRDtBQUNsRCxrREFBa0Q7QUFDbEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1EQUFtRCxrQ0FBa0MsSUFBSSxtQ0FBbUMsSUFBSSxpQ0FBaUM7QUFDaks7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlDQUFpQztBQUNqQztBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnRkFBZ0YsbUJBQW1CO0FBQ25HO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUM7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlDQUFpQztBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlDQUFpQztBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0VBQStFLG1CQUFtQjtBQUNsRztBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRFQUE0RSwwQkFBMEI7QUFDdEc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0VBQStFLFNBQVM7QUFDeEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrRUFBa0UsZUFBZTtBQUNqRixpRUFBaUUsZUFBZTtBQUNoRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNEQUFzRCxvQ0FBb0MsRUFBRSxrQ0FBa0M7QUFDOUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUVBQXFFLFNBQVM7QUFDOUU7QUFDQTtBQUNBLGtFQUFrRSxTQUFTO0FBQzNFO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdDQUF3QyxpQkFBaUIsRUFBRSxrQ0FBa0M7QUFDN0Y7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUMsYUFBYSxHQUFHLEtBQUs7QUFDMUQ7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvRkFBb0YsU0FBUztBQUM3RjtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBFQUEwRSxTQUFTO0FBQ25GO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUVBQXVFLElBQUk7QUFDM0U7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBLGtEQUFrRCxJQUFJLEdBQUcsV0FBVztBQUNwRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdGQUF3RixZQUFZO0FBQ3BHO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsbUVBQW1FLFlBQVk7QUFDL0U7QUFDQTs7Ozs7OztVQ3A2QkE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQSxFOzs7OztXQ1BBLHdGOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RCxFOzs7Ozs7Ozs7Ozs7Ozs7QUNOa0Q7QUFDbEQ7QUFDQSxzQkFBc0IsMERBQVE7QUFDOUI7QUFDQSxpRUFBZSwwREFBUSxFQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24iLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9jb21wb25lbnRzL0NhcmRGb3JtLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL2VudHJpZXMvY2FyZEZvcm0udHMiXSwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wiY2FyZEZvcm1cIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wiY2FyZEZvcm1cIl0gPSBmYWN0b3J5KCk7XG59KSh0aGlzLCAoKSA9PiB7XG5yZXR1cm4gIiwiY29uc3QgbG9nSXNzdWUgPSAoa2V5LCBwYXlsb2FkKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cuT3BlblJlcGxheT8uaGFuZGxlRXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHdpbmRvdy5PcGVuUmVwbGF5LmhhbmRsZUVycm9yKGtleSwgcGF5bG9hZCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbT3BlblJlcGxheV0gRmFpbGVkIHRvIGxvZyBpc3N1ZTonLCBlKTtcbiAgICB9XG59O1xuY29uc3QgRE9NX1NFTEVDVE9SUyA9IHtcbiAgICBDQVJUX0NPTlRBSU5FUjogJy50NzA2X19jYXJ0d2luLXByb2R1Y3RzLCAudC1zdG9yZV9fY2FydC1wcm9kdWN0cywgLnQtc3RvcmUnLFxuICAgIENBUlRfUFJPRFVDVDogJy50NzA2X19jYXJ0d2luLXByb2R1Y3QsIC50LXN0b3JlX19jYXJkLCAudDcwNl9fcHJvZHVjdCcsXG4gICAgUFJPRFVDVF9USVRMRTogJy50NzA2X19wcm9kdWN0LXRpdGxlLCAudC1zdG9yZV9fY2FyZF9fdGl0bGUsIC50NzA2X19wcm9kdWN0LW5hbWUnLFxuICAgIFBST0RVQ1RfREVMX0JVVFRPTjogJy50NzA2X19wcm9kdWN0LWRlbCcsXG4gICAgUFJPRFVDVF9QTFVTX0JVVFRPTjogJy50NzA2X19wcm9kdWN0LXBsdXMnLFxuICAgIFBST0RVQ1RfTUlOVVNfQlVUVE9OOiAnLnQ3MDZfX3Byb2R1Y3QtbWludXMnLFxuICAgIFBST0RVQ1RfUExVU01JTlVTOiAnLnQ3MDZfX3Byb2R1Y3QtcGx1c21pbnVzJyxcbiAgICBQUk9EVUNUX1FVQU5USVRZOiAnLnQ3MDZfX3Byb2R1Y3QtcXVhbnRpdHksIC50LXN0b3JlX19jYXJkX19xdWFudGl0eScsXG4gICAgQ0FSVF9DT1VOVEVSOiAnLnQ3MDZfX2NhcnRpY29uLWNvdW50ZXIsIC50LXN0b3JlX19jb3VudGVyJyxcbiAgICBDQVJUX0FNT1VOVDogJy50NzA2X19jYXJ0d2luLXByb2RhbW91bnQsIC50LXN0b3JlX190b3RhbC1hbW91bnQnLFxufTtcbmNvbnN0IERFTEFZUyA9IHtcbiAgICBDQVJUX1VQREFURTogMzAwLFxuICAgIERPTV9VUERBVEU6IDEwMCxcbiAgICBPQlNFUlZFUl9DSEVDSzogNTAwLFxuICAgIENBUlRfTE9BRF9USU1FT1VUOiAzMDAwLFxufTtcbmNsYXNzIENhcnRVdGlscyB7XG4gICAgc3RhdGljIHdhaXQobXMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpO1xuICAgIH1cbiAgICBzdGF0aWMgYXN5bmMgd2FpdEZvckVsZW1lbnQoc2VsZWN0b3IsIG1heEF0dGVtcHRzID0gMTAsIGludGVydmFsID0gMTAwKSB7XG4gICAgICAgIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgbWF4QXR0ZW1wdHM7IGF0dGVtcHQrKykge1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhdHRlbXB0IDwgbWF4QXR0ZW1wdHMgLSAxKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy53YWl0KGludGVydmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgc3RhdGljIGZpbmRQcm9kdWN0RWxlbWVudChwcm9kdWN0TmFtZSkge1xuICAgICAgICBjb25zdCBwcm9kdWN0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoRE9NX1NFTEVDVE9SUy5DQVJUX1BST0RVQ1QpO1xuICAgICAgICBmb3IgKGNvbnN0IHByb2R1Y3Qgb2YgcHJvZHVjdHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHRpdGxlID0gcHJvZHVjdC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9USVRMRSk7XG4gICAgICAgICAgICBpZiAodGl0bGUgJiYgdGl0bGUudGV4dENvbnRlbnQ/LnRyaW0oKSA9PT0gcHJvZHVjdE5hbWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb2R1Y3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIENhcmRGb3JtIHtcbiAgICBjb25zdHJ1Y3Rvcih7IGNhcmRCbG9ja0lkLCBydWxlcyB9KSB7XG4gICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5pc1VwZGF0aW5nQ2FydCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzQXBwbHlpbmdBY3Rpb25zID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY2FyZEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihjYXJkQmxvY2tJZCk7XG4gICAgICAgIGlmICghdGhpcy5jYXJkQmxvY2spIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYENhcmQgYmxvY2sgd2l0aCBpZCAke2NhcmRCbG9ja0lkfSBub3QgZm91bmRgKTtcbiAgICAgICAgICAgIGxvZ0lzc3VlKCdjYXJkX2Zvcm1faW5pdF9lcnJvcicsIHtcbiAgICAgICAgICAgICAgICBlcnJvcjogJ2NhcmRfYmxvY2tfbm90X2ZvdW5kJyxcbiAgICAgICAgICAgICAgICBjYXJkQmxvY2tJZDogY2FyZEJsb2NrSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZm9ybSA9IHRoaXMuY2FyZEJsb2NrLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcbiAgICAgICAgaWYgKCF0aGlzLmZvcm0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZvcm0gYmxvY2sgd2l0aCBpZCAke2NhcmRCbG9ja0lkfSBub3QgZm91bmRgKTtcbiAgICAgICAgICAgIGxvZ0lzc3VlKCdjYXJkX2Zvcm1faW5pdF9lcnJvcicsIHtcbiAgICAgICAgICAgICAgICBlcnJvcjogJ2Zvcm1fbm90X2ZvdW5kJyxcbiAgICAgICAgICAgICAgICBjYXJkQmxvY2tJZDogY2FyZEJsb2NrSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pbml0Rm9ybSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucnVsZXMgPSBydWxlcztcbiAgICAgICAgdGhpcy5maWVsZHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudC1pbnB1dC1ncm91cCcpO1xuICAgICAgICB0aGlzLmluaXRSdWxlcygpO1xuICAgICAgICB0aGlzLmluaXRDYXJ0T2JzZXJ2ZXIoKTtcbiAgICB9XG4gICAgaW5pdEZvcm0oKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdF0nLCB0aGlzLmZvcm0uZWxlbWVudHMpO1xuICAgICAgICB0aGlzLmZvcm0uYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSB0YXJnZXQ/Lm5hbWU7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFZhbHVlID0gdGFyZ2V0Py52YWx1ZTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5wdXRdJywgZSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGZpZWxkVmFsdWUsIFwifFwiLCBmaWVsZE5hbWUpO1xuICAgICAgICAgICAgY29uc3QgcnVsZSA9IHRoaXMucnVsZXMuZmluZChyID0+IHIudmFyaWFibGUgPT09IGZpZWxkTmFtZSk7XG4gICAgICAgICAgICBpZiAocnVsZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZFN0YXRlID0gbmV3IE1hcCh0aGlzLmFjdGlvbnNTdGF0ZXMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IHJ1bGUuYWN0aW9ucy5maW5kKGEgPT4gYS52YWx1ZSA9PT0gZmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuc2V0KGZpZWxkTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGZpZWxkVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGFjdGlvblxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcy5zZXQoZmllbGROYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwbHlBY3Rpb25zKG9sZFN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZm9ybS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSB0YXJnZXQ/Lm5hbWU7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFZhbHVlID0gdGFyZ2V0Py52YWx1ZTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2hhbmdlXScsIGUpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhmaWVsZFZhbHVlLCBcInxcIiwgZmllbGROYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IHJ1bGUgPSB0aGlzLnJ1bGVzLmZpbmQociA9PiByLnZhcmlhYmxlID09PSBmaWVsZE5hbWUpO1xuICAgICAgICAgICAgaWYgKHJ1bGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb24gPSBydWxlLmFjdGlvbnMuZmluZChhID0+IGEudmFsdWUgPT09IGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkU3RhdGUgPSBuZXcgTWFwKHRoaXMuYWN0aW9uc1N0YXRlcyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcy5zZXQoZmllbGROYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZmllbGRWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmFwcGx5QWN0aW9ucyhvbGRTdGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRTdGF0ZSA9IG5ldyBNYXAodGhpcy5hY3Rpb25zU3RhdGVzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLnNldChmaWVsZE5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogbnVsbFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHBseUFjdGlvbnMob2xkU3RhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIGluaXRSdWxlcygpIHtcbiAgICAgICAgdGhpcy5ydWxlcy5mb3JFYWNoKHJ1bGUgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bGUuYWx3YXlzQWN0aXZlICYmIHJ1bGUuYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gcnVsZS5hY3Rpb25zWzBdO1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLnNldChydWxlLnZhcmlhYmxlLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogYWN0aW9uLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdFJ1bGVzXSDQmNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QviDQv9C+0YHRgtC+0Y/QvdC90L7QtSDQv9GA0LDQstC40LvQvjonLCBydWxlLnZhcmlhYmxlLCBhY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBmaWVsZCA9IHRoaXMuZm9ybS5lbGVtZW50cy5uYW1lZEl0ZW0ocnVsZS52YXJpYWJsZSk7XG4gICAgICAgICAgICBpZiAoZmllbGQpIHtcbiAgICAgICAgICAgICAgICBsZXQgZmllbGRWYWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZCBpbnN0YW5jZW9mIFJhZGlvTm9kZUxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2tlZFJhZGlvID0gQXJyYXkuZnJvbShmaWVsZCkuZmluZCgocmFkaW8pID0+IHJhZGlvLmNoZWNrZWQpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlID0gY2hlY2tlZFJhZGlvPy52YWx1ZSB8fCAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZmllbGQgaW5zdGFuY2VvZiBIVE1MU2VsZWN0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlID0gZmllbGQudmFsdWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGZpZWxkIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gJ3JhZGlvJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZSA9IGZpZWxkLmNoZWNrZWQgPyBmaWVsZC52YWx1ZSA6ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09ICdjaGVja2JveCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWUgPSBmaWVsZC5jaGVja2VkID8gZmllbGQudmFsdWUgOiAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWUgPSBmaWVsZC52YWx1ZSB8fCAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRSdWxlc10g0J/QvtC70LU6JywgcnVsZS52YXJpYWJsZSwgJ9CX0L3QsNGH0LXQvdC40LU6JywgZmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gcnVsZS5hY3Rpb25zLmZpbmQoYSA9PiBhLnZhbHVlID09PSBmaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uICYmIGZpZWxkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLnNldChydWxlLnZhcmlhYmxlLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZmllbGRWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRSdWxlc10g0JjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90L4g0YHQvtGB0YLQvtGP0L3QuNC1INC00LvRjzonLCBydWxlLnZhcmlhYmxlLCBhY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IHRoaXMuY2xlYW51cENhcnRPbkluaXQoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5hcHBseUFjdGlvbnMoKTtcbiAgICB9XG4gICAgYXN5bmMgY2xlYW51cENhcnRPbkluaXQoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCd0LDRh9Cw0LvQviDQvtGH0LjRgdGC0LrQuCDQutC+0YDQt9C40L3RiycpO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNoZWNrQ2FydCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgICAgICAgICAgaWYgKHRpbGRhQ2FydCAmJiB0aWxkYUNhcnQucHJvZHVjdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh2b2lkIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChjaGVja0NhcnQsIDIwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNoZWNrQ2FydCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAoIXRpbGRhQ2FydCB8fCAhQXJyYXkuaXNBcnJheSh0aWxkYUNhcnQucHJvZHVjdHMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCa0L7RgNC30LjQvdCwINC90LXQtNC+0YHRgtGD0L/QvdCwJyk7XG4gICAgICAgICAgICBsb2dJc3N1ZSgnY2FydF91bmF2YWlsYWJsZScsIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0OiAnY2xlYW51cENhcnRPbkluaXQnLFxuICAgICAgICAgICAgICAgIGhhc1RjYXJ0OiAhIXRpbGRhQ2FydCxcbiAgICAgICAgICAgICAgICBoYXNQcm9kdWN0czogISF0aWxkYUNhcnQ/LnByb2R1Y3RzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQotC+0LLQsNGA0Ysg0LIg0LrQvtGA0LfQuNC90LU6JywgdGlsZGFDYXJ0LnByb2R1Y3RzLm1hcCgocCkgPT4gcC5uYW1lKSk7XG4gICAgICAgIGNvbnN0IGFsbFJ1bGVQcm9kdWN0cyA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5ydWxlcy5mb3JFYWNoKHJ1bGUgPT4ge1xuICAgICAgICAgICAgcnVsZS5hY3Rpb25zLmZvckVhY2goYWN0aW9uID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsbFJ1bGVQcm9kdWN0cy5hZGQoYWN0aW9uLnZhbHVlLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBhY3RpdmVQcm9kdWN0cyA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLmZvckVhY2goKHN0YXRlKSA9PiB7XG4gICAgICAgICAgICBpZiAoc3RhdGUuYWN0aW9uICYmIHN0YXRlLmFjdGlvbi52YWx1ZSkge1xuICAgICAgICAgICAgICAgIGFjdGl2ZVByb2R1Y3RzLmFkZChzdGF0ZS5hY3Rpb24udmFsdWUudHJpbSgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCS0YHQtSDRgtC+0LLQsNGA0Ysg0LjQtyDQv9GA0LDQstC40Ls6JywgQXJyYXkuZnJvbShhbGxSdWxlUHJvZHVjdHMpKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0JDQutGC0LjQstC90YvQtSDRgtC+0LLQsNGA0Ys6JywgQXJyYXkuZnJvbShhY3RpdmVQcm9kdWN0cykpO1xuICAgICAgICBjb25zdCBwcm9kdWN0c1RvUmVtb3ZlID0gW107XG4gICAgICAgIHRpbGRhQ2FydC5wcm9kdWN0cy5mb3JFYWNoKChwcm9kdWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0TmFtZSA9IHByb2R1Y3QubmFtZT8udHJpbSgpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3ROYW1lICYmIGFsbFJ1bGVQcm9kdWN0cy5oYXMocHJvZHVjdE5hbWUpICYmICFhY3RpdmVQcm9kdWN0cy5oYXMocHJvZHVjdE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcHJvZHVjdHNUb1JlbW92ZS5wdXNoKHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCi0L7QstCw0YDRiyDQtNC70Y8g0YPQtNCw0LvQtdC90LjRjzonLCBwcm9kdWN0c1RvUmVtb3ZlKTtcbiAgICAgICAgaWYgKHByb2R1Y3RzVG9SZW1vdmUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBwcm9kdWN0TmFtZSBvZiBwcm9kdWN0c1RvUmVtb3ZlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0KPQtNCw0LvRj9C10Lw6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucmVtb3ZlUHJvZHVjdEZyb21DYXJ0KHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdIOKckyDQntGH0LjRgdGC0LrQsCDQt9Cw0LLQtdGA0YjQtdC90LAnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCd0LXRgiDRgtC+0LLQsNGA0L7QsiDQtNC70Y8g0YPQtNCw0LvQtdC90LjRjycpO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuaGlkZVF1YW50aXR5Q29udHJvbHNGb3JSdWxlUHJvZHVjdHMoKTtcbiAgICB9XG4gICAgc2F2ZVRpbGRhQ2FydCh0aWxkYUNhcnQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuaXNVcGRhdGluZ0NhcnQgPSB0cnVlO1xuICAgICAgICAgICAgdGlsZGFDYXJ0LnVwZGF0ZWQgPSBNYXRoLmZsb29yKERhdGUubm93KCkgLyAxMDAwKTtcbiAgICAgICAgICAgIGNvbnN0IGNhcnREYXRhID0ge1xuICAgICAgICAgICAgICAgIHByb2R1Y3RzOiB0aWxkYUNhcnQucHJvZHVjdHMgfHwgW10sXG4gICAgICAgICAgICAgICAgcHJvZGFtb3VudDogdGlsZGFDYXJ0LnByb2RhbW91bnQgfHwgMCxcbiAgICAgICAgICAgICAgICBhbW91bnQ6IHRpbGRhQ2FydC5hbW91bnQgfHwgMCxcbiAgICAgICAgICAgICAgICB0b3RhbDogdGlsZGFDYXJ0LnByb2R1Y3RzPy5sZW5ndGggfHwgMCxcbiAgICAgICAgICAgICAgICB1cGRhdGVkOiB0aWxkYUNhcnQudXBkYXRlZCxcbiAgICAgICAgICAgICAgICBjdXJyZW5jeTogdGlsZGFDYXJ0LmN1cnJlbmN5IHx8IFwi0YAuXCIsXG4gICAgICAgICAgICAgICAgY3VycmVuY3lfc2lkZTogdGlsZGFDYXJ0LmN1cnJlbmN5X3NpZGUgfHwgXCJyXCIsXG4gICAgICAgICAgICAgICAgY3VycmVuY3lfc2VwOiB0aWxkYUNhcnQuY3VycmVuY3lfc2VwIHx8IFwiLFwiLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5X2RlYzogdGlsZGFDYXJ0LmN1cnJlbmN5X2RlYyB8fCBcIlwiLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5X3R4dDogdGlsZGFDYXJ0LmN1cnJlbmN5X3R4dCB8fCBcItGALlwiLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5X3R4dF9yOiB0aWxkYUNhcnQuY3VycmVuY3lfdHh0X3IgfHwgXCIg0YAuXCIsXG4gICAgICAgICAgICAgICAgY3VycmVuY3lfdHh0X2w6IHRpbGRhQ2FydC5jdXJyZW5jeV90eHRfbCB8fCBcIlwiLFxuICAgICAgICAgICAgICAgIHN5c3RlbTogdGlsZGFDYXJ0LnN5c3RlbSB8fCBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBzZXR0aW5nczogdGlsZGFDYXJ0LnNldHRpbmdzIHx8IHt9LFxuICAgICAgICAgICAgICAgIGRlbGl2ZXJ5OiB0aWxkYUNhcnQuZGVsaXZlcnkgfHwgeyBuYW1lOiBcIm5vZGVsaXZlcnlcIiwgcHJpY2U6IDAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd0Y2FydCcsIEpTT04uc3RyaW5naWZ5KGNhcnREYXRhKSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3NhdmVUaWxkYUNhcnRdIOKckyDQmtC+0YDQt9C40L3QsCDRgdC+0YXRgNCw0L3QtdC90LAg0LIgbG9jYWxTdG9yYWdlJyk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzVXBkYXRpbmdDYXJ0ID0gZmFsc2U7XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFtzYXZlVGlsZGFDYXJ0XSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y86JywgZSk7XG4gICAgICAgICAgICBsb2dJc3N1ZSgnY2FydF9zYXZlX2Vycm9yJywge1xuICAgICAgICAgICAgICAgIGVycm9yOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSksXG4gICAgICAgICAgICAgICAgcHJvZHVjdHNDb3VudDogdGlsZGFDYXJ0Py5wcm9kdWN0cz8ubGVuZ3RoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuaXNVcGRhdGluZ0NhcnQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0Q2FydE9ic2VydmVyKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRDYXJ0T2JzZXJ2ZXJdINCY0L3QuNGG0LjQsNC70LjQt9Cw0YbQuNGPINC90LDQsdC70Y7QtNCw0YLQtdC70Y8g0LrQvtGA0LfQuNC90YsnKTtcbiAgICAgICAgbGV0IGxhc3RNYWluUHJvZHVjdHNRdHkgPSB0aGlzLmdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCk7XG4gICAgICAgIGNvbnN0IGNoZWNrQ2FydENoYW5nZXMgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50UXR5ID0gdGhpcy5nZXRNYWluUHJvZHVjdHNRdWFudGl0eSgpO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdHkgIT09IGxhc3RNYWluUHJvZHVjdHNRdHkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0g0JjQt9C80LXQvdC40LvQvtGB0Ywg0LrQvtC70LjRh9C10YHRgtCy0L4g0YLQvtCy0LDRgNC+0LI6Jywge1xuICAgICAgICAgICAgICAgICAgICDQsdGL0LvQvjogbGFzdE1haW5Qcm9kdWN0c1F0eSxcbiAgICAgICAgICAgICAgICAgICAg0YHRgtCw0LvQvjogY3VycmVudFF0eVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGxhc3RNYWluUHJvZHVjdHNRdHkgPSBjdXJyZW50UXR5O1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgb2JzZXJ2ZUNhcnQgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjYXJ0Q29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLkNBUlRfQ09OVEFJTkVSKTtcbiAgICAgICAgICAgIGlmIChjYXJ0Q29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2FydE9ic2VydmVyXSBNdXRhdGlvbk9ic2VydmVyOiDQvtCx0L3QsNGA0YPQttC10L3RiyDQuNC30LzQtdC90LXQvdC40Y8nKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdRdHkgPSB0aGlzLmdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV3UXR5ICE9PSBsYXN0TWFpblByb2R1Y3RzUXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdE1haW5Qcm9kdWN0c1F0eSA9IG5ld1F0eTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZGVRdWFudGl0eUNvbnRyb2xzRm9yUnVsZVByb2R1Y3RzKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIERFTEFZUy5DQVJUX1VQREFURSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShjYXJ0Q29udGFpbmVyLCB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRDYXJ0T2JzZXJ2ZXJdIOKckyBNdXRhdGlvbk9ic2VydmVyINGD0YHRgtCw0L3QvtCy0LvQtdC9Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KG9ic2VydmVDYXJ0LCAxMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgb2JzZXJ2ZUNhcnQoKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgICAgICBjb25zdCBkZWxldGVCdXR0b24gPSB0YXJnZXQuY2xvc2VzdChET01fU0VMRUNUT1JTLlBST0RVQ1RfREVMX0JVVFRPTik7XG4gICAgICAgICAgICBpZiAoZGVsZXRlQnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdEVsZW1lbnQgPSBkZWxldGVCdXR0b24uY2xvc2VzdChET01fU0VMRUNUT1JTLkNBUlRfUFJPRFVDVCk7XG4gICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRpdGxlRWwgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9USVRMRSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3ROYW1lID0gdGl0bGVFbD8udGV4dENvbnRlbnQ/LnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2R1Y3ROYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0g0KPQtNCw0LvQtdC90LjQtSDRgtC+0LLQsNGA0LA6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVSdWxlUHJvZHVjdERlbGV0aW9uKHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGlzQ2FydEJ1dHRvbiA9IHRhcmdldC5jbG9zZXN0KGAke0RPTV9TRUxFQ1RPUlMuUFJPRFVDVF9QTFVTX0JVVFRPTn0sICR7RE9NX1NFTEVDVE9SUy5QUk9EVUNUX01JTlVTX0JVVFRPTn0sICR7RE9NX1NFTEVDVE9SUy5QUk9EVUNUX0RFTF9CVVRUT059YCk7XG4gICAgICAgICAgICBpZiAoaXNDYXJ0QnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjYXJ0T2JzZXJ2ZXJdINCa0LvQuNC6INC90LAg0LrQvdC+0L/QutGDINC60L7RgNC30LjQvdGLJyk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBjaGVja0NhcnRDaGFuZ2VzKCksIERFTEFZUy5PQlNFUlZFUl9DSEVDSyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBzZXR1cExvY2FsU3RvcmFnZUludGVyY2VwdG9yID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF3aW5kb3cuX19jYXJkZm9ybV9sb2NhbHN0b3JhZ2VfaW50ZXJjZXB0ZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvcmlnaW5hbFNldEl0ZW0gPSBTdG9yYWdlLnByb3RvdHlwZS5zZXRJdGVtO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAgIFN0b3JhZ2UucHJvdG90eXBlLnNldEl0ZW0gPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBvcmlnaW5hbFNldEl0ZW0uYXBwbHkodGhpcywgW2tleSwgdmFsdWVdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ3RjYXJ0JyAmJiAhc2VsZi5pc1VwZGF0aW5nQ2FydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjYXJ0T2JzZXJ2ZXJdIGxvY2FsU3RvcmFnZSB0Y2FydCDQuNC30LzQtdC90LXQvSDQuNC30LLQvdC1Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGNoZWNrQ2FydENoYW5nZXMoKSwgREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgd2luZG93Ll9fY2FyZGZvcm1fbG9jYWxzdG9yYWdlX2ludGVyY2VwdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRDYXJ0T2JzZXJ2ZXJdIOKckyBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSDQv9C10YDQtdGF0LLQsNGH0LXQvScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuICAgICAgICAgICAgc2V0dXBMb2NhbFN0b3JhZ2VJbnRlcmNlcHRvcigpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBzZXR1cExvY2FsU3RvcmFnZUludGVyY2VwdG9yKTtcbiAgICAgICAgfVxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaDtcbiAgICAgICAgICAgIGlmIChoYXNoID09PSAnI29wZW5jYXJ0Jykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2FydE9ic2VydmVyXSDQmtC+0YDQt9C40L3QsCDQvtGC0LrRgNGL0LLQsNC10YLRgdGPINGH0LXRgNC10LcgI29wZW5jYXJ0Jyk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZVF1YW50aXR5Q29udHJvbHNGb3JSdWxlUHJvZHVjdHMoKTtcbiAgICAgICAgICAgICAgICB9LCBERUxBWVMuQ0FSVF9VUERBVEUgKyAyMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgb2JzZXJ2ZUNhcnRWaXNpYmlsaXR5ID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2FydFdpbmRvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy50NzA2X19jYXJ0d2luJyk7XG4gICAgICAgICAgICBpZiAoY2FydFdpbmRvdykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZpc2liaWxpdHlPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbXV0YXRpb25zLmZvckVhY2goKG11dGF0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobXV0YXRpb24udHlwZSA9PT0gJ2F0dHJpYnV0ZXMnICYmIG11dGF0aW9uLmF0dHJpYnV0ZU5hbWUgPT09ICdjbGFzcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gbXV0YXRpb24udGFyZ2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygndDcwNl9fY2FydHdpbl9zaG93ZWQnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0g0JrQvtGA0LfQuNC90LAg0L/QvtC60LDQt9Cw0L3QsCAo0LrQu9Cw0YHRgSB0NzA2X19jYXJ0d2luX3Nob3dlZCknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZGVRdWFudGl0eUNvbnRyb2xzRm9yUnVsZVByb2R1Y3RzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIERFTEFZUy5DQVJUX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB2aXNpYmlsaXR5T2JzZXJ2ZXIub2JzZXJ2ZShjYXJ0V2luZG93LCB7XG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZUZpbHRlcjogWydjbGFzcyddXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtpbml0Q2FydE9ic2VydmVyXSDinJMg0J3QsNCx0LvRjtC00LDRgtC10LvRjCDQstC40LTQuNC80L7RgdGC0Lgg0LrQvtGA0LfQuNC90Ysg0YPRgdGC0LDQvdC+0LLQu9C10L0nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQob2JzZXJ2ZUNhcnRWaXNpYmlsaXR5LCAxMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgb2JzZXJ2ZUNhcnRWaXNpYmlsaXR5KCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdENhcnRPYnNlcnZlcl0g4pyTINCd0LDQsdC70Y7QtNCw0YLQtdC70Lgg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90YsnKTtcbiAgICB9XG4gICAgaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbihwcm9kdWN0TmFtZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCf0YDQvtCy0LXRgNC60LAg0YLQvtCy0LDRgNCwOicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgZm9yIChjb25zdCBba2V5LCBzdGF0ZV0gb2YgdGhpcy5hY3Rpb25zU3RhdGVzKSB7XG4gICAgICAgICAgICBpZiAoc3RhdGUuYWN0aW9uICYmIHN0YXRlLmFjdGlvbi52YWx1ZSA9PT0gcHJvZHVjdE5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCi0L7QstCw0YAg0LjQtyDQv9GA0LDQstC40LvQsCDQvdCw0LnQtNC10L06Jywge1xuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZToga2V5LFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHN0YXRlLmFjdGlvbi52YWx1ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGxldCBmb3VuZEVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsbElucHV0cyA9IHRoaXMuZm9ybS5xdWVyeVNlbGVjdG9yQWxsKCdpbnB1dCwgc2VsZWN0Jyk7XG4gICAgICAgICAgICAgICAgYWxsSW5wdXRzLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWwgPSBlbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAoKGVsLnR5cGUgPT09ICdyYWRpbycgfHwgZWwudHlwZSA9PT0gJ2NoZWNrYm94JykgJiYgZWwudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbC52YWx1ZS50cmltKCkgPT09IHN0YXRlLmFjdGlvbi52YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZEVsZW1lbnQgPSBlbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCd0LDQudC00LXQvSDRjdC70LXQvNC10L3RgjonLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGVsLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBlbC52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZDogZWwuY2hlY2tlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCh0L3QuNC80LDQtdC8INCy0YvQsdC+0YAg0YE6JywgZm91bmRFbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgZm91bmRFbGVtZW50LmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dIOKckyDQn9GA0LDQstC40LvQviDQvtGC0LzQtdC90LXQvdC+LCBjaGVja2JveCDRgdC90Y/RgicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCt0LvQtdC80LXQvdGCINGE0L7RgNC80Ysg0L3QtSDQvdCw0LnQtNC10L0g0LTQu9GPOicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uVmFsdWU6IHN0YXRlLmFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZUlucHV0czogQXJyYXkuZnJvbShhbGxJbnB1dHMpLm1hcChlbCA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGVsLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGVsLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGxvZ0lzc3VlKCdmb3JtX2VsZW1lbnRfbm90X2ZvdW5kJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogJ2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRLZXk6IGtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvblZhbHVlOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVJbnB1dHNDb3VudDogYWxsSW5wdXRzLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHkoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCd0LDRh9Cw0LvQviDQvtCx0L3QvtCy0LvQtdC90LjRjyDQutC+0LvQuNGH0LXRgdGC0LLQsCcpO1xuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICghdGlsZGFDYXJ0IHx8ICFBcnJheS5pc0FycmF5KHRpbGRhQ2FydC5wcm9kdWN0cykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0JrQvtGA0LfQuNC90LAg0L3QtdC00L7RgdGC0YPQv9C90LAnKTtcbiAgICAgICAgICAgIGxvZ0lzc3VlKCdjYXJ0X3VuYXZhaWxhYmxlJywge1xuICAgICAgICAgICAgICAgIGNvbnRleHQ6ICd1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eSdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCQ0LrRgtC40LLQvdGL0YUg0L/RgNCw0LLQuNC7OicsIHRoaXMuYWN0aW9uc1N0YXRlcy5zaXplKTtcbiAgICAgICAgZm9yIChjb25zdCBba2V5LCBzdGF0ZV0gb2YgdGhpcy5hY3Rpb25zU3RhdGVzKSB7XG4gICAgICAgICAgICBpZiAoc3RhdGUuYWN0aW9uICYmIHN0YXRlLmFjdGlvbi5xdWFudGl0eVR5cGUgPT09ICdwZXJQcm9kdWN0Jykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1F1YW50aXR5ID0gdGhpcy5jYWxjdWxhdGVSdWxlUHJvZHVjdFF1YW50aXR5KHN0YXRlLmFjdGlvbik7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdEluZGV4ID0gdGlsZGFDYXJ0LnByb2R1Y3RzLmZpbmRJbmRleCgocCkgPT4gcC5uYW1lPy50cmltKCkgPT09IHN0YXRlLmFjdGlvbi52YWx1ZS50cmltKCkpO1xuICAgICAgICAgICAgICAgIGlmIChwcm9kdWN0SW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9sZFF1YW50aXR5ID0gcGFyc2VJbnQodGlsZGFDYXJ0LnByb2R1Y3RzW3Byb2R1Y3RJbmRleF0ucXVhbnRpdHkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDQotC+0LLQsNGAIFwiJHtzdGF0ZS5hY3Rpb24udmFsdWV9XCI6YCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdEluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgb2xkUXVhbnRpdHk6IG9sZFF1YW50aXR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3UXVhbnRpdHk6IG5ld1F1YW50aXR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgbmVlZHNVcGRhdGU6IG9sZFF1YW50aXR5ICE9PSBuZXdRdWFudGl0eVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZFF1YW50aXR5ICE9PSBuZXdRdWFudGl0eSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g4pqhINCe0LHQvdC+0LLQu9GP0LXQvCDRh9C10YDQtdC3IHRjYXJ0X19wcm9kdWN0X191cGRhdGVRdWFudGl0eScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHByb2R1Y3RFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgMTA7IGF0dGVtcHQrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RFbGVtZW50ID0gQ2FydFV0aWxzLmZpbmRQcm9kdWN0RWxlbWVudChzdGF0ZS5hY3Rpb24udmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9kdWN0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDQrdC70LXQvNC10L3RgiDQvdCw0LnQtNC10L0g0L3QsCDQv9C+0L/Ri9GC0LrQtTonLCBhdHRlbXB0ICsgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0ZW1wdCA8IDkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgQ2FydFV0aWxzLndhaXQoREVMQVlTLkRPTV9VUERBVEUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9kdWN0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHF1YW50aXR5RWxlbWVudCA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoRE9NX1NFTEVDVE9SUy5QUk9EVUNUX1FVQU5USVRZKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocXVhbnRpdHlFbGVtZW50ICYmIHR5cGVvZiB3aW5kb3cudGNhcnRfX3Byb2R1Y3RfX3VwZGF0ZVF1YW50aXR5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy50Y2FydF9fcHJvZHVjdF9fdXBkYXRlUXVhbnRpdHkocXVhbnRpdHlFbGVtZW50LCBwcm9kdWN0RWxlbWVudCwgcHJvZHVjdEluZGV4LCBuZXdRdWFudGl0eSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldIOKckyDQmtC+0LvQuNGH0LXRgdGC0LLQviDQvtCx0L3QvtCy0LvQtdC90L4g0YfQtdGA0LXQtyBUaWxkYSBBUEk6Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogc3RhdGUuYWN0aW9uLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkUXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdRdWFudGl0eVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nSXNzdWUoJ3J1bGVfcHJvZHVjdF9xdWFudGl0eV91cGRhdGVkJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdE5hbWU6IHN0YXRlLmFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFF1YW50aXR5OiBvbGRRdWFudGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1F1YW50aXR5OiBuZXdRdWFudGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXR5VHlwZTogc3RhdGUuYWN0aW9uLnF1YW50aXR5VHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgQ2FydFV0aWxzLndhaXQoREVMQVlTLkRPTV9VUERBVEUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwbHVzTWludXNCdXR0b25zID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLlBST0RVQ1RfUExVU01JTlVTKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBsdXNNaW51c0J1dHRvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsdXNNaW51c0J1dHRvbnMuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDQndC1INC90LDQudC00LXQvSBxdWFudGl0eUVsZW1lbnQg0LjQu9C4INGE0YPQvdC60YbQuNGPIHVwZGF0ZVF1YW50aXR5Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ0lzc3VlKCdjYXJ0X3VwZGF0ZV9lbGVtZW50X25vdF9mb3VuZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6ICd1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0TmFtZTogc3RhdGUuYWN0aW9uLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzUXVhbnRpdHlFbGVtZW50OiAhIXF1YW50aXR5RWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc1VwZGF0ZUZ1bmN0aW9uOiB0eXBlb2Ygd2luZG93LnRjYXJ0X19wcm9kdWN0X191cGRhdGVRdWFudGl0eSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCd0LUg0L3QsNC50LTQtdC9IERPTSDRjdC70LXQvNC10L3RgiDRgtC+0LLQsNGA0LAg0L/QvtGB0LvQtSDQvtC20LjQtNCw0L3QuNGPJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nSXNzdWUoJ3Byb2R1Y3RfZWxlbWVudF9ub3RfZm91bmQnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6ICd1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3ROYW1lOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dGVtcHRzOiAxMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCi0L7QstCw0YAgXCIke3N0YXRlLmFjdGlvbi52YWx1ZX1cIiDQndCVINC90LDQudC00LXQvSDQsiDQutC+0YDQt9C40L3QtWApO1xuICAgICAgICAgICAgICAgICAgICBsb2dJc3N1ZSgncHJvZHVjdF9ub3RfZm91bmRfaW5fY2FydCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6ICd1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eScsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0TmFtZTogc3RhdGUuYWN0aW9uLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FydFByb2R1Y3RzQ291bnQ6IHRpbGRhQ2FydC5wcm9kdWN0cy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldIOKckyDQntCx0L3QvtCy0LvQtdC90LjQtSDQt9Cw0LLQtdGA0YjQtdC90L4nKTtcbiAgICAgICAgYXdhaXQgdGhpcy5oaWRlUXVhbnRpdHlDb250cm9sc0ZvclJ1bGVQcm9kdWN0cygpO1xuICAgIH1cbiAgICB1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET00ocHJvZHVjdE5hbWUsIG5ld1F1YW50aXR5KSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDQntCx0L3QvtCy0LvQtdC90LjQtTonLCB7IHByb2R1Y3ROYW1lLCBuZXdRdWFudGl0eSB9KTtcbiAgICAgICAgY29uc3QgdGl0bGVTZWxlY3RvcnMgPSBbXG4gICAgICAgICAgICAnLnQ3MDZfX3Byb2R1Y3QtdGl0bGUnLFxuICAgICAgICAgICAgJy50LXN0b3JlX19wcm9kdWN0LW5hbWUnLFxuICAgICAgICAgICAgJy50LXByb2R1Y3RfX3RpdGxlJyxcbiAgICAgICAgICAgICcuanMtcHJvZHVjdC1uYW1lJ1xuICAgICAgICBdO1xuICAgICAgICBsZXQgcHJvZHVjdEVsZW1lbnQgPSBudWxsO1xuICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHRpdGxlU2VsZWN0b3JzKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0VGl0bGVzID0gWy4uLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDQn9C+0LjRgdC6INGH0LXRgNC10LcgXCIke3NlbGVjdG9yfVwiOmAsIHByb2R1Y3RUaXRsZXMubGVuZ3RoLCAn0Y3Qu9C10LzQtdC90YLQvtCyJyk7XG4gICAgICAgICAgICBjb25zdCBmb3VuZEVsZW1lbnQgPSBwcm9kdWN0VGl0bGVzLmZpbmQoZWwgPT4gZWwuaW5uZXJUZXh0LnRyaW0oKSA9PT0gcHJvZHVjdE5hbWUudHJpbSgpKTtcbiAgICAgICAgICAgIGlmIChmb3VuZEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBwcm9kdWN0RWxlbWVudCA9IGZvdW5kRWxlbWVudC5jbG9zZXN0KCcudDcwNl9fY2FydHdpbi1wcm9kdWN0LCAudC1zdG9yZV9fcHJvZHVjdCwgLnQtcHJvZHVjdCcpO1xuICAgICAgICAgICAgICAgIGlmIChwcm9kdWN0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g4pyTINCi0L7QstCw0YAg0L3QsNC50LTQtdC9INGH0LXRgNC10Lc6Jywgc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFwcm9kdWN0RWxlbWVudCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g4pyXINCt0LvQtdC80LXQvdGCINGC0L7QstCw0YDQsCDQndCVINC90LDQudC00LXQvSDQsiBET006JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dINCS0YHQtSDRgtC+0LLQsNGA0Ysg0LIgRE9NOicsIFsuLi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudDcwNl9fcHJvZHVjdC10aXRsZSwgLnQtc3RvcmVfX3Byb2R1Y3QtbmFtZScpXS5tYXAoKGVsKSA9PiBlbC5pbm5lclRleHQpKTtcbiAgICAgICAgICAgIGxvZ0lzc3VlKCdwcm9kdWN0X2VsZW1lbnRfbm90X2ZvdW5kX2luX2RvbScsIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0OiAndXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NJyxcbiAgICAgICAgICAgICAgICBwcm9kdWN0TmFtZTogcHJvZHVjdE5hbWUsXG4gICAgICAgICAgICAgICAgcHJvZHVjdHNJbkRPTTogWy4uLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50NzA2X19wcm9kdWN0LXRpdGxlLCAudC1zdG9yZV9fcHJvZHVjdC1uYW1lJyldLmxlbmd0aFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVhbnRpdHlJbnB1dFNlbGVjdG9ycyA9IFtcbiAgICAgICAgICAgICcudDcwNl9fcHJvZHVjdC1xdWFudGl0eScsXG4gICAgICAgICAgICAnLnQtc3RvcmVfX3F1YW50aXR5LWlucHV0JyxcbiAgICAgICAgICAgICdpbnB1dFtuYW1lPVwicXVhbnRpdHlcIl0nLFxuICAgICAgICAgICAgJy5qcy1wcm9kdWN0LXF1YW50aXR5J1xuICAgICAgICBdO1xuICAgICAgICBsZXQgcXVhbnRpdHlJbnB1dCA9IG51bGw7XG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgcXVhbnRpdHlJbnB1dFNlbGVjdG9ycykge1xuICAgICAgICAgICAgcXVhbnRpdHlJbnB1dCA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICAgICAgaWYgKHF1YW50aXR5SW5wdXQpIHtcbiAgICAgICAgICAgICAgICBxdWFudGl0eUlucHV0LnZhbHVlID0gbmV3UXVhbnRpdHkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICBxdWFudGl0eUlucHV0LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdjaGFuZ2UnLCB7IGJ1YmJsZXM6IHRydWUgfSkpO1xuICAgICAgICAgICAgICAgIHF1YW50aXR5SW5wdXQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2lucHV0JywgeyBidWJibGVzOiB0cnVlIH0pKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g4pyTINCe0LHQvdC+0LLQu9C10L0gaW5wdXQg0YfQtdGA0LXQtzonLCBzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVhbnRpdHlEaXNwbGF5U2VsZWN0b3JzID0gW1xuICAgICAgICAgICAgJy50LXF1YW50aXR5X192YWx1ZScsXG4gICAgICAgICAgICAnLnQ3MDZfX3Byb2R1Y3QtcXVhbnRpdHktdmFsdWUnLFxuICAgICAgICAgICAgJy50LXN0b3JlX19xdWFudGl0eS12YWx1ZSdcbiAgICAgICAgXTtcbiAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBxdWFudGl0eURpc3BsYXlTZWxlY3RvcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHF1YW50aXR5RGlzcGxheSA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICAgICAgaWYgKHF1YW50aXR5RGlzcGxheSkge1xuICAgICAgICAgICAgICAgIHF1YW50aXR5RGlzcGxheS50ZXh0Q29udGVudCA9IG5ld1F1YW50aXR5LnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dIOKckyDQntCx0L3QvtCy0LvQtdC9IGRpc3BsYXkg0YfQtdGA0LXQtzonLCBzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAodGlsZGFDYXJ0KSB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGlsZGFDYXJ0LnByb2R1Y3RzLmZpbmQoKHApID0+IHAubmFtZT8udHJpbSgpID09PSBwcm9kdWN0TmFtZS50cmltKCkpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3QpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbFByaWNlID0gcGFyc2VGbG9hdChwcm9kdWN0LnByaWNlKSAqIG5ld1F1YW50aXR5O1xuICAgICAgICAgICAgICAgIGNvbnN0IHByaWNlU2VsZWN0b3JzID0gW1xuICAgICAgICAgICAgICAgICAgICAnLnQ3MDZfX3Byb2R1Y3QtcHJpY2UnLFxuICAgICAgICAgICAgICAgICAgICAnLnQtc3RvcmVfX3Byb2R1Y3QtcHJpY2UnLFxuICAgICAgICAgICAgICAgICAgICAnLnQtcHJvZHVjdF9fcHJpY2UnLFxuICAgICAgICAgICAgICAgICAgICAnLmpzLXByb2R1Y3QtcHJpY2UnXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHByaWNlU2VsZWN0b3JzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByaWNlRWxlbWVudCA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJpY2VFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmljZUVsZW1lbnQudGV4dENvbnRlbnQgPSBgJHt0b3RhbFByaWNlLnRvTG9jYWxlU3RyaW5nKCdydS1SVScpfSAke3RpbGRhQ2FydC5jdXJyZW5jeV90eHRfciB8fCAnINGALid9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDinJMg0J7QsdC90L7QstC70LXQvdCwINGB0YLQvtC40LzQvtGB0YLRjCDRh9C10YDQtdC3OicsIHNlbGVjdG9yLCB0b3RhbFByaWNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDinJMg0J7QsdC90L7QstC70LXQvdC40LUg0LfQsNCy0LXRgNGI0LXQvdC+INC00LvRjzonLCBwcm9kdWN0TmFtZSk7XG4gICAgfVxuICAgIHVwZGF0ZUFsbENhcnRJdGVtc0luRE9NKCkge1xuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICghdGlsZGFDYXJ0IHx8ICFBcnJheS5pc0FycmF5KHRpbGRhQ2FydC5wcm9kdWN0cykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFt1cGRhdGVBbGxDYXJ0SXRlbXNJbkRPTV0g0JrQvtGA0LfQuNC90LAg0L3QtdC00L7RgdGC0YPQv9C90LAnKTtcbiAgICAgICAgICAgIGxvZ0lzc3VlKCdjYXJ0X3VuYXZhaWxhYmxlJywge1xuICAgICAgICAgICAgICAgIGNvbnRleHQ6ICd1cGRhdGVBbGxDYXJ0SXRlbXNJbkRPTSdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQWxsQ2FydEl0ZW1zSW5ET01dINCe0LHQvdC+0LLQu9GP0LXQvCDQstGB0LUg0YLQvtCy0LDRgNGLINCyIERPTScpO1xuICAgICAgICB0aWxkYUNhcnQucHJvZHVjdHMuZm9yRWFjaCgocHJvZHVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdE5hbWUgPSBwcm9kdWN0Lm5hbWU/LnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IHF1YW50aXR5ID0gcGFyc2VJbnQocHJvZHVjdC5xdWFudGl0eSB8fCAxKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0TmFtZSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NKHByb2R1Y3ROYW1lLCBxdWFudGl0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUFsbENhcnRJdGVtc0luRE9NXSDinJMg0JLRgdC1INGC0L7QstCw0YDRiyDQvtCx0L3QvtCy0LvQtdC90YsnKTtcbiAgICB9XG4gICAgcmVmcmVzaENhcnRVSSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtyZWZyZXNoQ2FydFVJXSDQndCw0YfQsNC70L4g0L7QsdC90L7QstC70LXQvdC40Y8gVUkg0LrQvtGA0LfQuNC90YsnKTtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cudF9zdG9yZV9fcmVmcmVzaGNhcnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHdpbmRvdy50X3N0b3JlX19yZWZyZXNoY2FydCgpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtyZWZyZXNoQ2FydFVJXSDinJMg0JLRi9C30LLQsNC9IHRfc3RvcmVfX3JlZnJlc2hjYXJ0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVmcmVzaEZ1bmN0aW9ucyA9IFtcbiAgICAgICAgICAgICd0NzA2X191cGRhdGVDYXJ0JyxcbiAgICAgICAgICAgICd0Y2FydF9fdXBkYXRlQ2FydCcsXG4gICAgICAgICAgICAndF9zdG9yZV9fdXBkYXRlQ2FydCcsXG4gICAgICAgICAgICAndDcwNl9pbml0J1xuICAgICAgICBdO1xuICAgICAgICByZWZyZXNoRnVuY3Rpb25zLmZvckVhY2goZnVuY05hbWUgPT4ge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3dbZnVuY05hbWVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93W2Z1bmNOYW1lXSgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW3JlZnJlc2hDYXJ0VUldIOKckyDQktGL0LfQstCw0L0gJHtmdW5jTmFtZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZm9ybV0gW3JlZnJlc2hDYXJ0VUldINCe0YjQuNCx0LrQsCAke2Z1bmNOYW1lfTpgLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgbG9nSXNzdWUoJ2NhcnRfcmVmcmVzaF9mdW5jdGlvbl9lcnJvcicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6ICdyZWZyZXNoQ2FydFVJJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uTmFtZTogZnVuY05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMudXBkYXRlQWxsQ2FydEl0ZW1zSW5ET00oKTtcbiAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdjYXJ0LXVwZGF0ZWQnKSk7XG4gICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCd0Y2FydC11cGRhdGVkJykpO1xuICAgICAgICB0aGlzLnVwZGF0ZUNhcnRDb3VudGVycygpO1xuICAgIH1cbiAgICB1cGRhdGVDYXJ0Q291bnRlcnMoKSB7XG4gICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgaWYgKCF0aWxkYUNhcnQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGNhcnRDb3VudGVycyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoRE9NX1NFTEVDVE9SUy5DQVJUX0NPVU5URVIpO1xuICAgICAgICBjYXJ0Q291bnRlcnMuZm9yRWFjaChjb3VudGVyID0+IHtcbiAgICAgICAgICAgIGlmIChjb3VudGVyKSB7XG4gICAgICAgICAgICAgICAgY291bnRlci50ZXh0Q29udGVudCA9IHRpbGRhQ2FydC50b3RhbC50b1N0cmluZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgY2FydEFtb3VudHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKERPTV9TRUxFQ1RPUlMuQ0FSVF9BTU9VTlQpO1xuICAgICAgICBjYXJ0QW1vdW50cy5mb3JFYWNoKGFtb3VudCA9PiB7XG4gICAgICAgICAgICBpZiAoYW1vdW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybWF0dGVkQW1vdW50ID0gdGlsZGFDYXJ0LmFtb3VudC50b0xvY2FsZVN0cmluZygncnUtUlUnKTtcbiAgICAgICAgICAgICAgICBhbW91bnQudGV4dENvbnRlbnQgPSBgJHtmb3JtYXR0ZWRBbW91bnR9ICR7dGlsZGFDYXJ0LmN1cnJlbmN5X3R4dF9yIHx8ICcg0YAuJ31gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0Q291bnRlcnNdIOKckyDQodGH0LXRgtGH0LjQutC4INC+0LHQvdC+0LLQu9C10L3RiycpO1xuICAgIH1cbiAgICBnZXRNYWluUHJvZHVjdHNRdWFudGl0eSgpIHtcbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAoIXRpbGRhQ2FydCB8fCAhQXJyYXkuaXNBcnJheSh0aWxkYUNhcnQucHJvZHVjdHMpKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBydWxlUHJvZHVjdE5hbWVzID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLnJ1bGVzLmZvckVhY2gocnVsZSA9PiB7XG4gICAgICAgICAgICBydWxlLmFjdGlvbnMuZm9yRWFjaChhY3Rpb24gPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVsZVByb2R1Y3ROYW1lcy5hZGQoYWN0aW9uLnZhbHVlLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgdG90YWxRdWFudGl0eSA9IDA7XG4gICAgICAgIGNvbnN0IG1haW5Qcm9kdWN0cyA9IFtdO1xuICAgICAgICB0aWxkYUNhcnQucHJvZHVjdHMuZm9yRWFjaCgocHJvZHVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdE5hbWUgPSBwcm9kdWN0Lm5hbWU/LnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IGlzUnVsZVByb2R1Y3QgPSBydWxlUHJvZHVjdE5hbWVzLmhhcyhwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICBjb25zdCBxdHkgPSBwYXJzZUludChwcm9kdWN0LnF1YW50aXR5IHx8IDEpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3ROYW1lICYmICFpc1J1bGVQcm9kdWN0KSB7XG4gICAgICAgICAgICAgICAgdG90YWxRdWFudGl0eSArPSBxdHk7XG4gICAgICAgICAgICAgICAgbWFpblByb2R1Y3RzLnB1c2goYCR7cHJvZHVjdE5hbWV9ICgke3F0eX0g0YjRgilgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbZ2V0TWFpblByb2R1Y3RzUXVhbnRpdHldJywge1xuICAgICAgICAgICAgJ9Ce0YHQvdC+0LLQvdGL0YUg0YLQvtCy0LDRgNC+0LInOiB0b3RhbFF1YW50aXR5LFxuICAgICAgICAgICAgJ9Ch0L/QuNGB0L7Quic6IG1haW5Qcm9kdWN0cyxcbiAgICAgICAgICAgICfQotC+0LLQsNGA0Ysg0L/RgNCw0LLQuNC7JzogQXJyYXkuZnJvbShydWxlUHJvZHVjdE5hbWVzKVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRvdGFsUXVhbnRpdHk7XG4gICAgfVxuICAgIGNhbGN1bGF0ZVJ1bGVQcm9kdWN0UXVhbnRpdHkoYWN0aW9uKSB7XG4gICAgICAgIGlmIChhY3Rpb24ucXVhbnRpdHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGFjdGlvbi5xdWFudGl0eTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYWN0aW9uLnF1YW50aXR5VHlwZSA9PT0gJ3BlclByb2R1Y3QnKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5tYXgoMSwgdGhpcy5nZXRNYWluUHJvZHVjdHNRdWFudGl0eSgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgYXN5bmMgcmVtb3ZlUHJvZHVjdEZyb21DYXJ0KHByb2R1Y3ROYW1lKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbcmVtb3ZlUHJvZHVjdF0g0J/QvtC/0YvRgtC60LAg0YPQtNCw0LvQuNGC0Yw6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICBjb25zdCBwcm9kdWN0RWxlbWVudCA9IENhcnRVdGlscy5maW5kUHJvZHVjdEVsZW1lbnQocHJvZHVjdE5hbWUpO1xuICAgICAgICBpZiAocHJvZHVjdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlbFByb2R1Y3RCdXR0b24gPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9ERUxfQlVUVE9OKTtcbiAgICAgICAgICAgIGlmIChkZWxQcm9kdWN0QnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgZGVsUHJvZHVjdEJ1dHRvbi5jbGljaygpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbcmVtb3ZlUHJvZHVjdF0g4pyTINCj0LTQsNC70LXQvdC+INGH0LXRgNC10LcgRE9NICjQutC70LjQuik6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgIGF3YWl0IENhcnRVdGlscy53YWl0KERFTEFZUy5DQVJUX1VQREFURSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAodGlsZGFDYXJ0ICYmIEFycmF5LmlzQXJyYXkodGlsZGFDYXJ0LnByb2R1Y3RzKSkge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdEluZGV4ID0gdGlsZGFDYXJ0LnByb2R1Y3RzLmZpbmRJbmRleCgocCkgPT4gcC5uYW1lPy50cmltKCkgPT09IHByb2R1Y3ROYW1lLnRyaW0oKSk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aWxkYUNhcnQucHJvZHVjdHNbcHJvZHVjdEluZGV4XTtcbiAgICAgICAgICAgICAgICBjb25zdCByZW1vdmVGdW5jdGlvbnMgPSBbXG4gICAgICAgICAgICAgICAgICAgICd0Y2FydF9fcmVtb3ZlUHJvZHVjdCcsXG4gICAgICAgICAgICAgICAgICAgICd0Y2FydF9yZW1vdmVQcm9kdWN0JyxcbiAgICAgICAgICAgICAgICAgICAgJ3Rfc3RvcmVfX3JlbW92ZVByb2R1Y3QnXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZ1bmNOYW1lIG9mIHJlbW92ZUZ1bmN0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvd1tmdW5jTmFtZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93W2Z1bmNOYW1lXShwcm9kdWN0LnVpZCB8fCBwcm9kdWN0LmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW3JlbW92ZVByb2R1Y3RdIOKckyDQo9C00LDQu9C10L3QviDRh9C10YDQtdC3ICR7ZnVuY05hbWV9OmAsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuQ0FSVF9VUERBVEUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtmb3JtXSBbcmVtb3ZlUHJvZHVjdF0g0J7RiNC40LHQutCwICR7ZnVuY05hbWV9OmAsIGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRpbGRhQ2FydC5wcm9kdWN0cy5zcGxpY2UocHJvZHVjdEluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICB0aWxkYUNhcnQuYW1vdW50ID0gdGlsZGFDYXJ0LnByb2R1Y3RzLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyAocGFyc2VGbG9hdChwLnByaWNlKSAqIHBhcnNlSW50KHAucXVhbnRpdHkgfHwgMSkpLCAwKTtcbiAgICAgICAgICAgICAgICB0aWxkYUNhcnQucHJvZGFtb3VudCA9IHRpbGRhQ2FydC5wcm9kdWN0cy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdGlsZGFDYXJ0LnRvdGFsID0gdGlsZGFDYXJ0LnByb2R1Y3RzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB0aWxkYUNhcnQudXBkYXRlZCA9IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNhdmVUaWxkYUNhcnQodGlsZGFDYXJ0KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy50X3N0b3JlX19yZWZyZXNoY2FydCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnRfc3RvcmVfX3JlZnJlc2hjYXJ0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtyZW1vdmVQcm9kdWN0XSDinJMg0KPQtNCw0LvQtdC90L4g0L3QsNC/0YDRj9C80YPRjiDQuNC3INC80LDRgdGB0LjQstCwOicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgQ2FydFV0aWxzLndhaXQoREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFtyZW1vdmVQcm9kdWN0XSDinJcg0J3QtSDRg9C00LDQu9C+0YHRjCDRg9C00LDQu9C40YLRjCDRgtC+0LLQsNGAOicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgbG9nSXNzdWUoJ3Byb2R1Y3RfcmVtb3ZhbF9mYWlsZWQnLCB7XG4gICAgICAgICAgICBjb250ZXh0OiAncmVtb3ZlUHJvZHVjdEZyb21DYXJ0JyxcbiAgICAgICAgICAgIHByb2R1Y3ROYW1lOiBwcm9kdWN0TmFtZSxcbiAgICAgICAgICAgIGNhcnRQcm9kdWN0c0NvdW50OiB0aWxkYUNhcnQ/LnByb2R1Y3RzPy5sZW5ndGhcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYXN5bmMgYXBwbHlBY3Rpb25zKG9sZFN0YXRlID0gbmV3IE1hcCgpKSB7XG4gICAgICAgIGlmICh0aGlzLmlzQXBwbHlpbmdBY3Rpb25zKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0KPQttC1INCy0YvQv9C+0LvQvdGP0LXRgtGB0Y8sINC/0YDQvtC/0YPRgdC60LDQtdC8Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pc0FwcGx5aW5nQWN0aW9ucyA9IHRydWU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0J3QsNGH0LDQu9C+INC/0YDQuNC80LXQvdC10L3QuNGPINC00LXQudGB0YLQstC40LknKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQodGC0LDRgNC+0LUg0YHQvtGB0YLQvtGP0L3QuNC1OicsIE9iamVjdC5mcm9tRW50cmllcyhvbGRTdGF0ZSkpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdINCd0L7QstC+0LUg0YHQvtGB0YLQvtGP0L3QuNC1OicsIE9iamVjdC5mcm9tRW50cmllcyh0aGlzLmFjdGlvbnNTdGF0ZXMpKTtcbiAgICAgICAgICAgIGNvbnN0IGNhcnRMb2FkZWQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgICAgIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChbLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLnQ3MDZfX3Byb2R1Y3QtdGl0bGVgKV0ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIDIwMCk7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUoZmFsc2UpLCAzMDAwKSlcbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgaWYgKCFjYXJ0TG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0JrQvtGA0LfQuNC90LAg0L3QtSDQt9Cw0LPRgNGD0LfQuNC70LDRgdGMINC30LAgMyDRgdC10LrRg9C90LTRiywg0L/RgNC+0LTQvtC70LbQsNC10LwnKTtcbiAgICAgICAgICAgICAgICBsb2dJc3N1ZSgnY2FydF9sb2FkX3RpbWVvdXQnLCB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6ICdhcHBseUFjdGlvbnMnLFxuICAgICAgICAgICAgICAgICAgICB0aW1lb3V0OiAzMDAwXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHN0YXRlXSBvZiB0aGlzLmFjdGlvbnNTdGF0ZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvbGRWYWx1ZSA9IG9sZFN0YXRlLmdldChrZXkpPy52YWx1ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBvbGRBY3Rpb24gPSBvbGRTdGF0ZS5nZXQoa2V5KT8uYWN0aW9uO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbYXBwbHlBY3Rpb25zXSDQntCx0YDQsNCx0L7RgtC60LAg0L/QvtC70Y8gXCIke2tleX1cIjpgLCB7XG4gICAgICAgICAgICAgICAgICAgIG9sZFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZTogc3RhdGUudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIG9sZEFjdGlvbjogb2xkQWN0aW9uPy52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgbmV3QWN0aW9uOiBzdGF0ZS5hY3Rpb24/LnZhbHVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlLnZhbHVlICE9PSBvbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAob2xkQWN0aW9uICYmIG9sZEFjdGlvbi52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdINCj0LTQsNC70Y/QtdC8INGB0YLQsNGA0YvQuSDRgtC+0LLQsNGAOicsIG9sZEFjdGlvbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZW1vdmVkID0gYXdhaXQgdGhpcy5yZW1vdmVQcm9kdWN0RnJvbUNhcnQob2xkQWN0aW9uLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZW1vdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nSXNzdWUoJ3J1bGVfcHJvZHVjdF9yZW1vdmVkJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0TmFtZTogb2xkQWN0aW9uLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZEtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmljZTogb2xkQWN0aW9uLnN1bSB8fCAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlLnZhbHVlICYmIHN0YXRlLmFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdElkID0gYHJ1bGVfJHtrZXl9XyR7RGF0ZS5ub3coKX1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdFF1YW50aXR5ID0gdGhpcy5jYWxjdWxhdGVSdWxlUHJvZHVjdFF1YW50aXR5KHN0YXRlLmFjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0JTQvtCx0LDQstC70Y/QtdC8INC90L7QstGL0Lkg0YLQvtCy0LDRgDonLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHByb2R1Y3RJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpY2U6IHN0YXRlLmFjdGlvbi5zdW0gfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWFudGl0eTogcHJvZHVjdFF1YW50aXR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXR5VHlwZTogc3RhdGUuYWN0aW9uLnF1YW50aXR5VHlwZSB8fCAnZml4ZWQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy50Y2FydF9fYWRkUHJvZHVjdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHByb2R1Y3RJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpY2U6IHN0YXRlLmFjdGlvbi5zdW0gfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWFudGl0eTogcHJvZHVjdFF1YW50aXR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dJc3N1ZSgncnVsZV9wcm9kdWN0X2FkZGVkJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3ROYW1lOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRLZXk6IGtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmljZTogc3RhdGUuYWN0aW9uLnN1bSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXR5OiBwcm9kdWN0UXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbnRpdHlUeXBlOiBzdGF0ZS5hY3Rpb24ucXVhbnRpdHlUeXBlIHx8ICdmaXhlZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hhbmdlUHJvZHVjdCA9IGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGFuZ2VQcm9kdWN0ID0gWy4uLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC50NzA2X19wcm9kdWN0LXRpdGxlYCldXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgoZSkgPT4gZS5pbm5lclRleHQudHJpbSgpID09PSBzdGF0ZS5hY3Rpb24udmFsdWUudHJpbSgpKT8ucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShjaGFuZ2VQcm9kdWN0IHx8IHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoYW5nZVByb2R1Y3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGFuZ2VQcm9kdWN0QnV0dG9uID0gY2hhbmdlUHJvZHVjdC5xdWVyeVNlbGVjdG9yKGAudDcwNl9fcHJvZHVjdC1wbHVzbWludXNgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hhbmdlUHJvZHVjdEJ1dHRvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VQcm9kdWN0QnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDinJMg0KHQutGA0YvRgtGLINC60L3QvtC/0LrQuCDQutC+0LvQuNGH0LXRgdGC0LLQsCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICghc3RhdGUudmFsdWUgfHwgIXN0YXRlLmFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdINCX0L3QsNGH0LXQvdC40LUg0YHQsdGA0L7RiNC10L3Qviwg0YLQvtCy0LDRgCDRg9C00LDQu9C10L0nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDinJMg0J/RgNC40LzQtdC90LXQvdC40LUg0LTQtdC50YHRgtCy0LjQuSDQt9Cw0LLQtdGA0YjQtdC90L4nKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaGlkZVF1YW50aXR5Q29udHJvbHNGb3JSdWxlUHJvZHVjdHMoKTtcbiAgICAgICAgfVxuICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuaXNBcHBseWluZ0FjdGlvbnMgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRBbGxSdWxlUHJvZHVjdE5hbWVzKCkge1xuICAgICAgICBjb25zdCBydWxlUHJvZHVjdE5hbWVzID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLnJ1bGVzLmZvckVhY2gocnVsZSA9PiB7XG4gICAgICAgICAgICBydWxlLmFjdGlvbnMuZm9yRWFjaChhY3Rpb24gPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVsZVByb2R1Y3ROYW1lcy5hZGQoYWN0aW9uLnZhbHVlLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hpZGVRdWFudGl0eV0g0JLRgdC1INGC0L7QstCw0YDRiyDQuNC3INC/0YDQsNCy0LjQuzonLCBBcnJheS5mcm9tKHJ1bGVQcm9kdWN0TmFtZXMpKTtcbiAgICAgICAgcmV0dXJuIHJ1bGVQcm9kdWN0TmFtZXM7XG4gICAgfVxuICAgIGFzeW5jIGhpZGVRdWFudGl0eUNvbnRyb2xzRm9yUnVsZVByb2R1Y3RzKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hpZGVRdWFudGl0eV0g0J3QsNGH0LDQu9C+INGB0LrRgNGL0YLQuNGPINGB0YfQtdGC0YfQuNC60L7QsiDQtNC70Y8g0YLQvtCy0LDRgNC+0LIg0LjQtyDQv9GA0LDQstC40LsnKTtcbiAgICAgICAgY29uc3QgcnVsZVByb2R1Y3ROYW1lcyA9IHRoaXMuZ2V0QWxsUnVsZVByb2R1Y3ROYW1lcygpO1xuICAgICAgICBpZiAocnVsZVByb2R1Y3ROYW1lcy5zaXplID09PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hpZGVRdWFudGl0eV0g0J3QtdGCINGC0L7QstCw0YDQvtCyINC40Lcg0L/RgNCw0LLQuNC7Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgQ2FydFV0aWxzLndhaXQoREVMQVlTLkRPTV9VUERBVEUpO1xuICAgICAgICBjb25zdCBwcm9kdWN0RWxlbWVudHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKERPTV9TRUxFQ1RPUlMuQ0FSVF9QUk9EVUNUKTtcbiAgICAgICAgbGV0IGhpZGRlbkNvdW50ID0gMDtcbiAgICAgICAgcHJvZHVjdEVsZW1lbnRzLmZvckVhY2goKHByb2R1Y3RFbGVtZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0aXRsZUVsZW1lbnQgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9USVRMRSk7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0TmFtZSA9IHRpdGxlRWxlbWVudD8udGV4dENvbnRlbnQ/LnRyaW0oKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0TmFtZSAmJiBydWxlUHJvZHVjdE5hbWVzLmhhcyhwcm9kdWN0TmFtZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwbHVzTWludXNCbG9jayA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoRE9NX1NFTEVDVE9SUy5QUk9EVUNUX1BMVVNNSU5VUyk7XG4gICAgICAgICAgICAgICAgaWYgKHBsdXNNaW51c0Jsb2NrICYmIHBsdXNNaW51c0Jsb2NrLnN0eWxlLmRpc3BsYXkgIT09ICdub25lJykge1xuICAgICAgICAgICAgICAgICAgICBwbHVzTWludXNCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICBoaWRkZW5Db3VudCsrO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW2hpZGVRdWFudGl0eV0g4pyTINCh0LrRgNGL0YLRiyDQutC90L7Qv9C60Lgg0LTQu9GPINGC0L7QstCw0YDQsDogXCIke3Byb2R1Y3ROYW1lfVwiYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtoaWRlUXVhbnRpdHldIOKckyDQodC60YDRi9GC0L4g0YHRh9C10YLRh9C40LrQvtCyOiAke2hpZGRlbkNvdW50fWApO1xuICAgIH1cbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IHsgQ2FyZEZvcm0gfSBmcm9tICcuLi9jb21wb25lbnRzL0NhcmRGb3JtJztcbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHdpbmRvdy5DYXJkRm9ybSA9IENhcmRGb3JtO1xufVxuZXhwb3J0IGRlZmF1bHQgQ2FyZEZvcm07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=