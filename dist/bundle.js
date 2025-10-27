/******/ (() => { // webpackBootstrap
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
        }
        this.form = this.cardBlock.querySelector('form');
        if (!this.form) {
            console.error(`Form block with id ${cardBlockId} not found`);
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
    initRules() {
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
        this.cleanupCartOnInit();
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
                                await CartUtils.wait(DELAYS.DOM_UPDATE);
                                const plusMinusButtons = productElement.querySelector(DOM_SELECTORS.PRODUCT_PLUSMINUS);
                                if (plusMinusButtons) {
                                    plusMinusButtons.style.display = 'none';
                                }
                            }
                            else {
                                console.warn('[form] [updateRuleProductsQuantity] Не найден quantityElement или функция updateQuantity');
                            }
                        }
                        else {
                            console.warn('[form] [updateRuleProductsQuantity] Не найден DOM элемент товара после ожидания');
                        }
                    }
                }
                else {
                    console.warn(`[form] [updateRuleProductsQuantity] Товар "${state.action.value}" НЕ найден в корзине`);
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
                        await this.removeProductFromCart(oldAction.value);
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


/***/ }),

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
        this.resizeTimeout = null;
        this.colorBlocks = [];
        this.sizeBlocks = [];
        this.productBlocks = [];
        this.loadedUserImage = null;
        this.editorLoadWithAi = false;
        this.removeBackgroundEnabled = false;
        this.imageCache = new Map();
        this.loadingElementsCache = {};
        this.productCache = new Map();
        this.mockupCache = new Map();
        if (!productConfigs || productConfigs.length === 0) {
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
        const editorRemoveBackgroundButton = blocks.editorRemoveBackgroundButtonClass
            ? document.querySelector(blocks.editorRemoveBackgroundButtonClass)
            : null;
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
            throw new Error('[Editor] Не найден дефолтный продукт');
        }
        const defaultMockup = defaultProduct.mockups[0];
        if (!defaultMockup) {
            throw new Error('[Editor] Не найден дефолтный mockup');
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
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        this.events.on(EditorEventType.MOCKUP_UPDATED, (dataURL) => {
            this.mockupBlock.src = dataURL;
        });
    }
    handleResize() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
            console.debug('[canvas] Изменение размера окна, пересчет canvas');
            this.resizeAllCanvases();
        }, 150);
    }
    async resizeAllCanvases() {
        [...this.canvases, ...this.layersCanvases].forEach(canvas => {
            if (canvas) {
                canvas.setDimensions({
                    width: this.editorBlock.clientWidth,
                    height: this.editorBlock.clientHeight
                });
            }
        });
        this.canvases.forEach(canvas => {
            this.updatePrintAreaForCanvas(canvas);
        });
        if (this.activeCanvas && this._selectSide) {
            await this.redrawAllLayersForSide(this._selectSide);
        }
        const otherSide = this._selectSide === 'front' ? 'back' : 'front';
        await this.redrawAllLayersForSide(otherSide);
    }
    getPrintConfigForSide(side) {
        const product = this.productConfigs.find(p => p.type === this._selectType);
        if (!product)
            return undefined;
        return product.printConfig.find((config) => config.side === side);
    }
    updatePrintAreaForCanvas(canvas) {
        if (!canvas)
            return;
        const side = canvas.side;
        if (!side)
            return;
        const printConfig = this.getPrintConfigForSide(side);
        if (!printConfig)
            return;
        const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
        const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
        const left = (this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth);
        const top = (this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight);
        const clipArea = canvas.clipPath;
        if (clipArea) {
            clipArea.set({
                width,
                height,
                left,
                top
            });
        }
        const objects = canvas.getObjects();
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
    async redrawAllLayersForSide(side) {
        const canvas = this.canvases.find(c => c.side === side);
        if (!canvas)
            return;
        const objects = canvas.getObjects();
        const layoutObjects = objects.filter(obj => obj.name && !obj.name.startsWith('area:'));
        layoutObjects.forEach(obj => canvas.remove(obj));
        const layersForSide = this.layouts.filter(layout => layout.view === side);
        for (const layout of layersForSide) {
            await this.addLayoutToCanvas(layout);
        }
        canvas.renderAll();
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
                throw new Error('[mockup] Не найден mockup для текущих параметров');
            }
            const dataURL = await this.loadAndConvertImage(mockupImageUrl);
            this.emit(EditorEventType.MOCKUP_UPDATED, dataURL);
            this.mockupBlock.src = dataURL;
            console.debug('[mockup] Mockup успешно обновлен');
        }
        catch (error) {
            console.error('[mockup] Ошибка обновления mockup:', error);
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
                const url = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_4__.generateImage)({
                    uri: this.apiConfig.webhookRequest,
                    prompt,
                    shirtColor: this._selectColor.name,
                    image: this._selectLayout ? this.loadedUserImage !== this.layouts.find(layout => layout.id === this._selectLayout)?.url ? this.loadedUserImage : null : this.loadedUserImage,
                    withAi: this.editorLoadWithAi,
                    layoutId,
                    isNew: this._selectLayout ? false : true,
                    background: !this.removeBackgroundEnabled,
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
                        this.showLayoutList();
                        this.updateLayouts();
                        this.saveState();
                    }
                }
                else {
                    this.addLayout(_models_Layout__WEBPACK_IMPORTED_MODULE_1__.Layout.createImage({
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
        if (!mockup)
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
        this.changeLoadWithAi();
        if (this.editorLoadWithAiButton) {
            this.editorLoadWithAiButton.style.display = 'table';
            this.editorLoadWithAiButton.style.cursor = 'pointer';
            this.editorLoadWithAiButton.onclick = () => {
                this.changeLoadWithAi(true);
            };
        }
        if (this.editorLoadWithoutAiButton) {
            this.editorLoadWithoutAiButton.style.display = 'table';
            this.editorLoadWithoutAiButton.style.cursor = 'pointer';
            this.editorLoadWithoutAiButton.onclick = () => {
                this.changeLoadWithAi(false);
            };
        }
        this.initRemoveBackgroundCheckbox();
    }
    initRemoveBackgroundCheckbox() {
        if (!this.editorRemoveBackgroundButton)
            return;
        this.changeRemoveBackground();
        this.editorRemoveBackgroundButton.style.cursor = 'pointer';
        this.editorRemoveBackgroundButton.onclick = () => {
            this.changeRemoveBackground(!this.removeBackgroundEnabled);
        };
        this.updateRemoveBackgroundVisibility();
    }
    updateRemoveBackgroundVisibility() {
        if (!this.editorRemoveBackgroundButton)
            return;
        const parentElement = this.editorRemoveBackgroundButton.parentElement;
        if (!parentElement)
            return;
        if (this.loadedUserImage && !this.editorLoadWithAi) {
            parentElement.style.display = '';
            console.debug('[remove background] Кнопка показана (не-ИИ режим)');
        }
        else {
            parentElement.style.display = 'none';
            this.changeRemoveBackground(false);
            console.debug('[remove background] Кнопка скрыта (ИИ режим или нет изображения)');
        }
    }
    changeRemoveBackground(value = false) {
        this.removeBackgroundEnabled = value;
        if (this.editorRemoveBackgroundButton) {
            const buttonElement = (0,_utils_tildaUtils__WEBPACK_IMPORTED_MODULE_2__.getLastChild)(this.editorRemoveBackgroundButton);
            if (buttonElement) {
                if (value) {
                    buttonElement.style.borderColor = '';
                }
                else {
                    buttonElement.style.borderColor = '#f2f2f2';
                }
            }
        }
        console.debug('[remove background] Состояние изменено:', this.removeBackgroundEnabled);
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
        this.initAiButtons();
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
        this.updateRemoveBackgroundVisibility();
    }
    resetUserUploadImage() {
        if (this.editorUploadViewBlock) {
            this.editorUploadViewBlock.style.display = 'none';
        }
        this.loadedUserImage = null;
        this.cancelEditLayout();
        this.updateRemoveBackgroundVisibility();
    }
    changeLoadWithAi(value = false) {
        this.editorLoadWithAi = value;
        if (this.editorLoadWithAiButton && this.editorLoadWithoutAiButton) {
            const buttonWithAi = this.editorLoadWithAiButton;
            const buttonWithoutAi = this.editorLoadWithoutAiButton;
            if (value) {
                const fixButtonWithAi = (0,_utils_tildaUtils__WEBPACK_IMPORTED_MODULE_2__.getLastChild)(buttonWithAi);
                const fixButtonWithoutAi = (0,_utils_tildaUtils__WEBPACK_IMPORTED_MODULE_2__.getLastChild)(buttonWithoutAi);
                if (fixButtonWithAi) {
                    fixButtonWithAi.style.borderColor = '';
                }
                if (fixButtonWithoutAi) {
                    fixButtonWithoutAi.style.borderColor = '#f2f2f2';
                }
            }
            else {
                const fixButtonWithAi = (0,_utils_tildaUtils__WEBPACK_IMPORTED_MODULE_2__.getLastChild)(buttonWithAi);
                const fixButtonWithoutAi = (0,_utils_tildaUtils__WEBPACK_IMPORTED_MODULE_2__.getLastChild)(buttonWithoutAi);
                if (fixButtonWithAi) {
                    fixButtonWithAi.style.borderColor = '#f2f2f2';
                }
                if (fixButtonWithoutAi) {
                    fixButtonWithoutAi.style.borderColor = '';
                }
            }
        }
        this.updateRemoveBackgroundVisibility();
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
        const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
        const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
        const left = Math.round((this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth));
        const top = Math.round((this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight));
        const objWidth = e.target.width * e.target.scaleX;
        const objHeight = e.target.height * e.target.scaleY;
        const objCenterLeft = e.target.left + objWidth / 2;
        const objCenterTop = e.target.top + objHeight / 2;
        const nearX = Math.abs(objCenterLeft - (left + width / 2)) < 7;
        const nearY = Math.abs(objCenterTop - (top + height / 2)) < 7;
        if (nearX) {
            this.showGuideline(canvas, 'vertical', left + width / 2, 0, left + width / 2, this.editorBlock.clientHeight);
            e.target.set({ left: left + width / 2 - objWidth / 2 });
        }
        else {
            this.hideGuideline(canvas, 'vertical');
        }
        if (nearY) {
            this.showGuideline(canvas, 'horizontal', 0, top + height / 2, this.editorBlock.clientWidth, top + height / 2);
            e.target.set({ top: top + height / 2 - objHeight / 2 });
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
        const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
        const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
        const left = Math.round((this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth));
        const top = Math.round((this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight));
        layout.position.x = (object.left - left) / width;
        layout.position.y = (object.top - top) / height;
        layout.size = object.scaleX;
        layout.aspectRatio = object.scaleY / object.scaleX;
        layout.angle = object.angle;
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
        const printConfig = product.printConfig.find(pc => pc.side === layout.view);
        if (!printConfig)
            return;
        const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
        const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
        const left = Math.round((this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth));
        const top = Math.round((this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight));
        const absoluteLeft = left + (width * layout.position.x);
        const absoluteTop = top + (height * layout.position.y);
        if (layout.isImageLayout()) {
            const image = new fabric.Image(await this.loadImage(layout.url));
            if (layout.size === 1 && image.width > width) {
                layout.size = width / image.width;
            }
            image.set({
                left: absoluteLeft,
                top: absoluteTop,
                name: layout.id,
                layoutUrl: layout.url,
                scaleX: layout.size,
                scaleY: layout.size * layout.aspectRatio,
                angle: layout.angle,
            });
            canvas.add(image);
        }
        else if (layout.isTextLayout()) {
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
            });
            canvas.add(text);
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
        const { canvas: tempCanvas, ctx, mockupDimensions } = this.createExportCanvas(resolution, mockupImg);
        const designCanvas = await this.createDesignCanvas(canvases.editableCanvas, canvases.layersCanvas, side);
        ctx.drawImage(designCanvas, 0, 0, designCanvas.width, designCanvas.height, mockupDimensions.x, mockupDimensions.y, mockupDimensions.width, mockupDimensions.height);
        console.debug(`[export] Наложен дизайн на мокап для ${side}`);
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
        const baseSize = CONSTANTS.CANVAS_AREA_HEIGHT;
        const baseWidth = baseSize;
        const baseHeight = baseSize;
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
            const printArea = this.calculatePrintAreaDimensions(side, baseWidth);
            const clipArea = new fabric.Rect({
                width: printArea.width,
                height: printArea.height,
                left: printArea.left,
                top: printArea.top,
                fill: 'rgb(255, 0, 0)',
                evented: false,
            });
            tempEditableCanvas.clipPath = clipArea;
            console.debug(`[export] Создан clipPath для экспорта стороны ${side} с размерами из конфигурации`);
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
    calculatePrintAreaDimensions(side, baseCanvasSize = CONSTANTS.CANVAS_AREA_HEIGHT) {
        const printConfig = this.getPrintConfigForSide(side);
        if (!printConfig) {
            console.warn(`[export] Не найдена конфигурация печати для ${side}`);
            return { width: baseCanvasSize, height: baseCanvasSize, left: 0, top: 0 };
        }
        const width = printConfig.size.width / 600 * baseCanvasSize;
        const height = printConfig.size.height / 600 * baseCanvasSize;
        const left = (baseCanvasSize - width) / 2 + (printConfig.position.x / 100 * baseCanvasSize);
        const top = (baseCanvasSize - height) / 2 + (printConfig.position.y / 100 * baseCanvasSize);
        return { width, height, left, top };
    }
    async addLayoutToExportCanvas(layout, canvas, printArea) {
        const absoluteLeft = printArea.left + (printArea.width * layout.position.x);
        const absoluteTop = printArea.top + (printArea.height * layout.position.y);
        if (layout.isImageLayout()) {
            const image = new fabric.Image(await this.loadImage(layout.url));
            let finalSize = layout.size;
            if (finalSize === 1 && image.width > printArea.width) {
                finalSize = printArea.width / image.width;
            }
            image.set({
                left: absoluteLeft,
                top: absoluteTop,
                scaleX: finalSize,
                scaleY: finalSize * layout.aspectRatio,
                angle: layout.angle,
            });
            canvas.add(image);
        }
        else if (layout.isTextLayout()) {
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
            });
            canvas.add(text);
        }
    }
    async exportDesignWithClipPath(editableCanvas, layersCanvas, side, resolution) {
        const qualityMultiplier = 10;
        const printArea = this.calculatePrintAreaDimensions(side, CONSTANTS.CANVAS_AREA_HEIGHT);
        const clipWidth = printArea.width;
        const clipHeight = printArea.height;
        const clipLeft = printArea.left;
        const clipTop = printArea.top;
        console.debug(`[export] Print area (независимо от экрана): ${clipWidth}x${clipHeight} at (${clipLeft}, ${clipTop})`);
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

/***/ "./src/components/Popup.ts":
/*!*********************************!*\
  !*** ./src/components/Popup.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Popup)
/* harmony export */ });
const popupLogger = console.debug.bind(console, '[Popup]');
class Popup {
    constructor({ popupId, popupContentClass, closeButtonClass, timeoutSeconds = 10, autoShow = true, cookieName = 'popup', cookieExpiresDays = 1, }) {
        this.closeButton = null;
        this.autoShow = false;
        this.autoShowTimeout = null;
        this.timeoutSeconds = 25;
        this.cookieName = "popup";
        this.cookieExpiresDays = 1;
        if (!popupId || !popupContentClass)
            throw new Error('[Popup] popupId or popupContentClass is not provided');
        const findPopupBlock = document.getElementById(popupId);
        if (!findPopupBlock) {
            throw new Error(`Popup block with id ${popupId} not found`);
        }
        const findPopupContentBlock = document.querySelector(`.${popupContentClass}`);
        if (!findPopupContentBlock) {
            throw new Error(`Popup content block with class ${popupContentClass} not found`);
        }
        this.popupBlock = findPopupBlock;
        this.popupContentBlock = findPopupContentBlock;
        this.initPopupBlock();
        this.popupWrapperBlock = this.initPopupWrapper();
        const findCloseButton = document.querySelector(`.${closeButtonClass}`);
        if (!findCloseButton) {
            popupLogger(`close button with class ${closeButtonClass} not found`);
        }
        this.closeButton = findCloseButton;
        this.initCloseButton();
        if (timeoutSeconds) {
            this.timeoutSeconds = timeoutSeconds;
        }
        if (autoShow) {
            this.autoShow = autoShow;
        }
        if (cookieName) {
            this.cookieName = cookieName;
        }
        if (cookieExpiresDays) {
            this.cookieExpiresDays = cookieExpiresDays;
        }
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
        if (!this.closeButton)
            return;
        this.closeButton.style.cursor = 'pointer';
        this.closeButton.onclick = () => this.close();
    }
    initAutoShow() {
        if (this.autoShow && !document.cookie.includes(`${this.cookieName}=true`)) {
            this.autoShowTimeout = setTimeout(() => this.show(), this.timeoutSeconds * 1000);
        }
        else {
            popupLogger('is not auto shown');
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
            window.tracker.setUserID(userId);
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
    POSITION: { x: 0, y: 0 },
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
            return new Layout(props);
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
            return new Layout(props);
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
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _components_Popup__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./components/Popup */ "./src/components/Popup.ts");
/* harmony import */ var _components_Editor__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./components/Editor */ "./src/components/Editor.ts");
/* harmony import */ var _components_CardForm__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./components/CardForm */ "./src/components/CardForm.ts");



window.popup = _components_Popup__WEBPACK_IMPORTED_MODULE_0__["default"];
window.editor = _components_Editor__WEBPACK_IMPORTED_MODULE_1__["default"];
window.cardForm = _components_CardForm__WEBPACK_IMPORTED_MODULE_2__.CardForm;

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QSxrQ0FBa0MsZ0ZBQW9CO0FBQ3REO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUFpRCwyQkFBMkI7QUFDNUU7QUFDQTtBQUNBLGlEQUFpRCxrREFBTTtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJDQUEyQyxLQUFLO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdFQUF3RSxTQUFTO0FBQ2pGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQix1QkFBdUI7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtREFBbUQsbUNBQW1DO0FBQ3RGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxvQkFBb0IsdUJBQXVCO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZDQUE2QyxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSx1QkFBdUI7QUFDNUc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QixpQkFBaUIsR0FBRyxpQkFBaUIsR0FBRyx1QkFBdUI7QUFDM0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUVBQWlFLFNBQVM7QUFDMUU7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscURBQXFELGlCQUFpQixVQUFVLGtCQUFrQixTQUFTLGlCQUFpQixTQUFTLGlCQUFpQjtBQUN0SjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9FQUFvRSxrREFBTTtBQUMxRSxvREFBb0QscUJBQXFCO0FBQ3pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvRUFBb0UsaUJBQWlCLFVBQVUsa0JBQWtCLFNBQVMsaUJBQWlCLFNBQVMsaUJBQWlCO0FBQ3JLO0FBQ0E7QUFDQSxxREFBcUQsa0JBQWtCO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FB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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtCQUErQiwrREFBWTtBQUMzQztBQUNBLDBEQUEwRCxNQUFNO0FBQ2hFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdDQUF3QywrREFBWTtBQUNwRCwyQ0FBMkMsK0RBQVk7QUFDdkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdDQUF3QywrREFBWTtBQUNwRCwyQ0FBMkMsK0RBQVk7QUFDdkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QiwrREFBWTtBQUNwQztBQUNBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQywrREFBWTtBQUM1QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLHVDQUF1QztBQUNsRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsdUNBQXVDO0FBQ2xFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0MsS0FBSztBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0RBQXNELEtBQUs7QUFDM0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdELGFBQWE7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxREFBcUQsV0FBVztBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsZ0ZBQWdGLFVBQVU7QUFDMUY7QUFDQTtBQUNBLG9FQUFvRSxVQUFVO0FBQzlFO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0VBQWdFLGtCQUFrQjtBQUNsRjtBQUNB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QUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztVQ05BO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0EsRTs7Ozs7V0NQQSx3Rjs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0QsRTs7Ozs7Ozs7Ozs7Ozs7QUNOdUM7QUFDRTtBQUNRO0FBQ2pELGVBQWUseURBQUs7QUFDcEIsZ0JBQWdCLDBEQUFNO0FBQ3RCLGtCQUFrQiwwREFBUSIsInNvdXJjZXMiOlsid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvY29tcG9uZW50cy9DYXJkRm9ybS50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL2NvbXBvbmVudHMvRWRpdG9yLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvY29tcG9uZW50cy9Qb3B1cC50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL21hbmFnZXJzL0VkaXRvclN0b3JhZ2VNYW5hZ2VyLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvbW9kZWxzL0xheW91dC50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL3V0aWxzL1R5cGVkRXZlbnRFbWl0dGVyLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvdXRpbHMvYXBpLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvdXRpbHMvdGlsZGFVdGlscy50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBET01fU0VMRUNUT1JTID0ge1xuICAgIENBUlRfQ09OVEFJTkVSOiAnLnQ3MDZfX2NhcnR3aW4tcHJvZHVjdHMsIC50LXN0b3JlX19jYXJ0LXByb2R1Y3RzLCAudC1zdG9yZScsXG4gICAgQ0FSVF9QUk9EVUNUOiAnLnQ3MDZfX2NhcnR3aW4tcHJvZHVjdCwgLnQtc3RvcmVfX2NhcmQsIC50NzA2X19wcm9kdWN0JyxcbiAgICBQUk9EVUNUX1RJVExFOiAnLnQ3MDZfX3Byb2R1Y3QtdGl0bGUsIC50LXN0b3JlX19jYXJkX190aXRsZSwgLnQ3MDZfX3Byb2R1Y3QtbmFtZScsXG4gICAgUFJPRFVDVF9ERUxfQlVUVE9OOiAnLnQ3MDZfX3Byb2R1Y3QtZGVsJyxcbiAgICBQUk9EVUNUX1BMVVNfQlVUVE9OOiAnLnQ3MDZfX3Byb2R1Y3QtcGx1cycsXG4gICAgUFJPRFVDVF9NSU5VU19CVVRUT046ICcudDcwNl9fcHJvZHVjdC1taW51cycsXG4gICAgUFJPRFVDVF9QTFVTTUlOVVM6ICcudDcwNl9fcHJvZHVjdC1wbHVzbWludXMnLFxuICAgIFBST0RVQ1RfUVVBTlRJVFk6ICcudDcwNl9fcHJvZHVjdC1xdWFudGl0eSwgLnQtc3RvcmVfX2NhcmRfX3F1YW50aXR5JyxcbiAgICBDQVJUX0NPVU5URVI6ICcudDcwNl9fY2FydGljb24tY291bnRlciwgLnQtc3RvcmVfX2NvdW50ZXInLFxuICAgIENBUlRfQU1PVU5UOiAnLnQ3MDZfX2NhcnR3aW4tcHJvZGFtb3VudCwgLnQtc3RvcmVfX3RvdGFsLWFtb3VudCcsXG59O1xuY29uc3QgREVMQVlTID0ge1xuICAgIENBUlRfVVBEQVRFOiAzMDAsXG4gICAgRE9NX1VQREFURTogMTAwLFxuICAgIE9CU0VSVkVSX0NIRUNLOiA1MDAsXG4gICAgQ0FSVF9MT0FEX1RJTUVPVVQ6IDMwMDAsXG59O1xuY2xhc3MgQ2FydFV0aWxzIHtcbiAgICBzdGF0aWMgd2FpdChtcykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XG4gICAgfVxuICAgIHN0YXRpYyBhc3luYyB3YWl0Rm9yRWxlbWVudChzZWxlY3RvciwgbWF4QXR0ZW1wdHMgPSAxMCwgaW50ZXJ2YWwgPSAxMDApIHtcbiAgICAgICAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCBtYXhBdHRlbXB0czsgYXR0ZW1wdCsrKSB7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGF0dGVtcHQgPCBtYXhBdHRlbXB0cyAtIDEpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLndhaXQoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBzdGF0aWMgZmluZFByb2R1Y3RFbGVtZW50KHByb2R1Y3ROYW1lKSB7XG4gICAgICAgIGNvbnN0IHByb2R1Y3RzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChET01fU0VMRUNUT1JTLkNBUlRfUFJPRFVDVCk7XG4gICAgICAgIGZvciAoY29uc3QgcHJvZHVjdCBvZiBwcm9kdWN0cykge1xuICAgICAgICAgICAgY29uc3QgdGl0bGUgPSBwcm9kdWN0LnF1ZXJ5U2VsZWN0b3IoRE9NX1NFTEVDVE9SUy5QUk9EVUNUX1RJVExFKTtcbiAgICAgICAgICAgIGlmICh0aXRsZSAmJiB0aXRsZS50ZXh0Q29udGVudD8udHJpbSgpID09PSBwcm9kdWN0TmFtZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvZHVjdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgQ2FyZEZvcm0ge1xuICAgIGNvbnN0cnVjdG9yKHsgY2FyZEJsb2NrSWQsIHJ1bGVzIH0pIHtcbiAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmlzVXBkYXRpbmdDYXJ0ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNBcHBseWluZ0FjdGlvbnMgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jYXJkQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGNhcmRCbG9ja0lkKTtcbiAgICAgICAgaWYgKCF0aGlzLmNhcmRCbG9jaykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQ2FyZCBibG9jayB3aXRoIGlkICR7Y2FyZEJsb2NrSWR9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZm9ybSA9IHRoaXMuY2FyZEJsb2NrLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcbiAgICAgICAgaWYgKCF0aGlzLmZvcm0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZvcm0gYmxvY2sgd2l0aCBpZCAke2NhcmRCbG9ja0lkfSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEZvcm0oKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJ1bGVzID0gcnVsZXM7XG4gICAgICAgIHRoaXMuZmllbGRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnQtaW5wdXQtZ3JvdXAnKTtcbiAgICAgICAgdGhpcy5pbml0UnVsZXMoKTtcbiAgICAgICAgdGhpcy5pbml0Q2FydE9ic2VydmVyKCk7XG4gICAgfVxuICAgIGluaXRGb3JtKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRdJywgdGhpcy5mb3JtLmVsZW1lbnRzKTtcbiAgICAgICAgdGhpcy5mb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0O1xuICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gdGFyZ2V0Py5uYW1lO1xuICAgICAgICAgICAgY29uc3QgZmllbGRWYWx1ZSA9IHRhcmdldD8udmFsdWU7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2lucHV0XScsIGUpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhmaWVsZFZhbHVlLCBcInxcIiwgZmllbGROYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IHJ1bGUgPSB0aGlzLnJ1bGVzLmZpbmQociA9PiByLnZhcmlhYmxlID09PSBmaWVsZE5hbWUpO1xuICAgICAgICAgICAgaWYgKHJ1bGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvbGRTdGF0ZSA9IG5ldyBNYXAodGhpcy5hY3Rpb25zU3RhdGVzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb24gPSBydWxlLmFjdGlvbnMuZmluZChhID0+IGEudmFsdWUgPT09IGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLnNldChmaWVsZE5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBmaWVsZFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuc2V0KGZpZWxkTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBudWxsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmFwcGx5QWN0aW9ucyhvbGRTdGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmZvcm0uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0O1xuICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gdGFyZ2V0Py5uYW1lO1xuICAgICAgICAgICAgY29uc3QgZmllbGRWYWx1ZSA9IHRhcmdldD8udmFsdWU7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NoYW5nZV0nLCBlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoZmllbGRWYWx1ZSwgXCJ8XCIsIGZpZWxkTmFtZSk7XG4gICAgICAgICAgICBjb25zdCBydWxlID0gdGhpcy5ydWxlcy5maW5kKHIgPT4gci52YXJpYWJsZSA9PT0gZmllbGROYW1lKTtcbiAgICAgICAgICAgIGlmIChydWxlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gcnVsZS5hY3Rpb25zLmZpbmQoYSA9PiBhLnZhbHVlID09PSBmaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9sZFN0YXRlID0gbmV3IE1hcCh0aGlzLmFjdGlvbnNTdGF0ZXMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuc2V0KGZpZWxkTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGZpZWxkVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGFjdGlvblxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHBseUFjdGlvbnMob2xkU3RhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkU3RhdGUgPSBuZXcgTWFwKHRoaXMuYWN0aW9uc1N0YXRlcyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcy5zZXQoZmllbGROYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwbHlBY3Rpb25zKG9sZFN0YXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpbml0UnVsZXMoKSB7XG4gICAgICAgIHRoaXMucnVsZXMuZm9yRWFjaChydWxlID0+IHtcbiAgICAgICAgICAgIGlmIChydWxlLmFsd2F5c0FjdGl2ZSAmJiBydWxlLmFjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IHJ1bGUuYWN0aW9uc1swXTtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcy5zZXQocnVsZS52YXJpYWJsZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRSdWxlc10g0JjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90L4g0L/QvtGB0YLQvtGP0L3QvdC+0LUg0L/RgNCw0LLQuNC70L46JywgcnVsZS52YXJpYWJsZSwgYWN0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZmllbGQgPSB0aGlzLmZvcm0uZWxlbWVudHMubmFtZWRJdGVtKHJ1bGUudmFyaWFibGUpO1xuICAgICAgICAgICAgaWYgKGZpZWxkKSB7XG4gICAgICAgICAgICAgICAgbGV0IGZpZWxkVmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQgaW5zdGFuY2VvZiBSYWRpb05vZGVMaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrZWRSYWRpbyA9IEFycmF5LmZyb20oZmllbGQpLmZpbmQoKHJhZGlvKSA9PiByYWRpby5jaGVja2VkKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZSA9IGNoZWNrZWRSYWRpbz8udmFsdWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGZpZWxkIGluc3RhbmNlb2YgSFRNTFNlbGVjdEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZSA9IGZpZWxkLnZhbHVlIHx8ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChmaWVsZCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09ICdyYWRpbycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWUgPSBmaWVsZC5jaGVja2VkID8gZmllbGQudmFsdWUgOiAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChmaWVsZC50eXBlID09PSAnY2hlY2tib3gnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlID0gZmllbGQuY2hlY2tlZCA/IGZpZWxkLnZhbHVlIDogJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlID0gZmllbGQudmFsdWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtpbml0UnVsZXNdINCf0L7Qu9C1OicsIHJ1bGUudmFyaWFibGUsICfQl9C90LDRh9C10L3QuNC1OicsIGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IHJ1bGUuYWN0aW9ucy5maW5kKGEgPT4gYS52YWx1ZSA9PT0gZmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbiAmJiBmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcy5zZXQocnVsZS52YXJpYWJsZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGZpZWxkVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGFjdGlvblxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtpbml0UnVsZXNdINCY0L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdC+INGB0L7RgdGC0L7Rj9C90LjQtSDQtNC70Y86JywgcnVsZS52YXJpYWJsZSwgYWN0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNsZWFudXBDYXJ0T25Jbml0KCk7XG4gICAgfVxuICAgIGFzeW5jIGNsZWFudXBDYXJ0T25Jbml0KCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQndCw0YfQsNC70L4g0L7Rh9C40YHRgtC60Lgg0LrQvtGA0LfQuNC90YsnKTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjaGVja0NhcnQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICAgICAgICAgIGlmICh0aWxkYUNhcnQgJiYgdGlsZGFDYXJ0LnByb2R1Y3RzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodm9pZCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoY2hlY2tDYXJ0LCAyMDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjaGVja0NhcnQoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgaWYgKCF0aWxkYUNhcnQgfHwgIUFycmF5LmlzQXJyYXkodGlsZGFDYXJ0LnByb2R1Y3RzKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQmtC+0YDQt9C40L3QsCDQvdC10LTQvtGB0YLRg9C/0L3QsCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCi0L7QstCw0YDRiyDQsiDQutC+0YDQt9C40L3QtTonLCB0aWxkYUNhcnQucHJvZHVjdHMubWFwKChwKSA9PiBwLm5hbWUpKTtcbiAgICAgICAgY29uc3QgYWxsUnVsZVByb2R1Y3RzID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLnJ1bGVzLmZvckVhY2gocnVsZSA9PiB7XG4gICAgICAgICAgICBydWxlLmFjdGlvbnMuZm9yRWFjaChhY3Rpb24gPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYWxsUnVsZVByb2R1Y3RzLmFkZChhY3Rpb24udmFsdWUudHJpbSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGFjdGl2ZVByb2R1Y3RzID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuZm9yRWFjaCgoc3RhdGUpID0+IHtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5hY3Rpb24gJiYgc3RhdGUuYWN0aW9uLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgYWN0aXZlUHJvZHVjdHMuYWRkKHN0YXRlLmFjdGlvbi52YWx1ZS50cmltKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0JLRgdC1INGC0L7QstCw0YDRiyDQuNC3INC/0YDQsNCy0LjQuzonLCBBcnJheS5mcm9tKGFsbFJ1bGVQcm9kdWN0cykpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQkNC60YLQuNCy0L3Ri9C1INGC0L7QstCw0YDRizonLCBBcnJheS5mcm9tKGFjdGl2ZVByb2R1Y3RzKSk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3RzVG9SZW1vdmUgPSBbXTtcbiAgICAgICAgdGlsZGFDYXJ0LnByb2R1Y3RzLmZvckVhY2goKHByb2R1Y3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3ROYW1lID0gcHJvZHVjdC5uYW1lPy50cmltKCk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdE5hbWUgJiYgYWxsUnVsZVByb2R1Y3RzLmhhcyhwcm9kdWN0TmFtZSkgJiYgIWFjdGl2ZVByb2R1Y3RzLmhhcyhwcm9kdWN0TmFtZSkpIHtcbiAgICAgICAgICAgICAgICBwcm9kdWN0c1RvUmVtb3ZlLnB1c2gocHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0KLQvtCy0LDRgNGLINC00LvRjyDRg9C00LDQu9C10L3QuNGPOicsIHByb2R1Y3RzVG9SZW1vdmUpO1xuICAgICAgICBpZiAocHJvZHVjdHNUb1JlbW92ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHByb2R1Y3ROYW1lIG9mIHByb2R1Y3RzVG9SZW1vdmUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQo9C00LDQu9GP0LXQvDonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5yZW1vdmVQcm9kdWN0RnJvbUNhcnQocHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g4pyTINCe0YfQuNGB0YLQutCwINC30LDQstC10YDRiNC10L3QsCcpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0J3QtdGCINGC0L7QstCw0YDQvtCyINC00LvRjyDRg9C00LDQu9C10L3QuNGPJyk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5oaWRlUXVhbnRpdHlDb250cm9sc0ZvclJ1bGVQcm9kdWN0cygpO1xuICAgIH1cbiAgICBzYXZlVGlsZGFDYXJ0KHRpbGRhQ2FydCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5pc1VwZGF0aW5nQ2FydCA9IHRydWU7XG4gICAgICAgICAgICB0aWxkYUNhcnQudXBkYXRlZCA9IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApO1xuICAgICAgICAgICAgY29uc3QgY2FydERhdGEgPSB7XG4gICAgICAgICAgICAgICAgcHJvZHVjdHM6IHRpbGRhQ2FydC5wcm9kdWN0cyB8fCBbXSxcbiAgICAgICAgICAgICAgICBwcm9kYW1vdW50OiB0aWxkYUNhcnQucHJvZGFtb3VudCB8fCAwLFxuICAgICAgICAgICAgICAgIGFtb3VudDogdGlsZGFDYXJ0LmFtb3VudCB8fCAwLFxuICAgICAgICAgICAgICAgIHRvdGFsOiB0aWxkYUNhcnQucHJvZHVjdHM/Lmxlbmd0aCB8fCAwLFxuICAgICAgICAgICAgICAgIHVwZGF0ZWQ6IHRpbGRhQ2FydC51cGRhdGVkLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5OiB0aWxkYUNhcnQuY3VycmVuY3kgfHwgXCLRgC5cIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV9zaWRlOiB0aWxkYUNhcnQuY3VycmVuY3lfc2lkZSB8fCBcInJcIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV9zZXA6IHRpbGRhQ2FydC5jdXJyZW5jeV9zZXAgfHwgXCIsXCIsXG4gICAgICAgICAgICAgICAgY3VycmVuY3lfZGVjOiB0aWxkYUNhcnQuY3VycmVuY3lfZGVjIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgY3VycmVuY3lfdHh0OiB0aWxkYUNhcnQuY3VycmVuY3lfdHh0IHx8IFwi0YAuXCIsXG4gICAgICAgICAgICAgICAgY3VycmVuY3lfdHh0X3I6IHRpbGRhQ2FydC5jdXJyZW5jeV90eHRfciB8fCBcIiDRgC5cIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV90eHRfbDogdGlsZGFDYXJ0LmN1cnJlbmN5X3R4dF9sIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgc3lzdGVtOiB0aWxkYUNhcnQuc3lzdGVtIHx8IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgIHNldHRpbmdzOiB0aWxkYUNhcnQuc2V0dGluZ3MgfHwge30sXG4gICAgICAgICAgICAgICAgZGVsaXZlcnk6IHRpbGRhQ2FydC5kZWxpdmVyeSB8fCB7IG5hbWU6IFwibm9kZWxpdmVyeVwiLCBwcmljZTogMCB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3RjYXJ0JywgSlNPTi5zdHJpbmdpZnkoY2FydERhdGEpKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbc2F2ZVRpbGRhQ2FydF0g4pyTINCa0L7RgNC30LjQvdCwINGB0L7RhdGA0LDQvdC10L3QsCDQsiBsb2NhbFN0b3JhZ2UnKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNVcGRhdGluZ0NhcnQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3NhdmVUaWxkYUNhcnRdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjzonLCBlKTtcbiAgICAgICAgICAgIHRoaXMuaXNVcGRhdGluZ0NhcnQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0Q2FydE9ic2VydmVyKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRDYXJ0T2JzZXJ2ZXJdINCY0L3QuNGG0LjQsNC70LjQt9Cw0YbQuNGPINC90LDQsdC70Y7QtNCw0YLQtdC70Y8g0LrQvtGA0LfQuNC90YsnKTtcbiAgICAgICAgbGV0IGxhc3RNYWluUHJvZHVjdHNRdHkgPSB0aGlzLmdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCk7XG4gICAgICAgIGNvbnN0IGNoZWNrQ2FydENoYW5nZXMgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50UXR5ID0gdGhpcy5nZXRNYWluUHJvZHVjdHNRdWFudGl0eSgpO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdHkgIT09IGxhc3RNYWluUHJvZHVjdHNRdHkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0g0JjQt9C80LXQvdC40LvQvtGB0Ywg0LrQvtC70LjRh9C10YHRgtCy0L4g0YLQvtCy0LDRgNC+0LI6Jywge1xuICAgICAgICAgICAgICAgICAgICDQsdGL0LvQvjogbGFzdE1haW5Qcm9kdWN0c1F0eSxcbiAgICAgICAgICAgICAgICAgICAg0YHRgtCw0LvQvjogY3VycmVudFF0eVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGxhc3RNYWluUHJvZHVjdHNRdHkgPSBjdXJyZW50UXR5O1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgb2JzZXJ2ZUNhcnQgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjYXJ0Q29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLkNBUlRfQ09OVEFJTkVSKTtcbiAgICAgICAgICAgIGlmIChjYXJ0Q29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2FydE9ic2VydmVyXSBNdXRhdGlvbk9ic2VydmVyOiDQvtCx0L3QsNGA0YPQttC10L3RiyDQuNC30LzQtdC90LXQvdC40Y8nKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdRdHkgPSB0aGlzLmdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV3UXR5ICE9PSBsYXN0TWFpblByb2R1Y3RzUXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdE1haW5Qcm9kdWN0c1F0eSA9IG5ld1F0eTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZGVRdWFudGl0eUNvbnRyb2xzRm9yUnVsZVByb2R1Y3RzKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIERFTEFZUy5DQVJUX1VQREFURSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShjYXJ0Q29udGFpbmVyLCB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRDYXJ0T2JzZXJ2ZXJdIOKckyBNdXRhdGlvbk9ic2VydmVyINGD0YHRgtCw0L3QvtCy0LvQtdC9Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KG9ic2VydmVDYXJ0LCAxMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgb2JzZXJ2ZUNhcnQoKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgICAgICBjb25zdCBkZWxldGVCdXR0b24gPSB0YXJnZXQuY2xvc2VzdChET01fU0VMRUNUT1JTLlBST0RVQ1RfREVMX0JVVFRPTik7XG4gICAgICAgICAgICBpZiAoZGVsZXRlQnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdEVsZW1lbnQgPSBkZWxldGVCdXR0b24uY2xvc2VzdChET01fU0VMRUNUT1JTLkNBUlRfUFJPRFVDVCk7XG4gICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRpdGxlRWwgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9USVRMRSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3ROYW1lID0gdGl0bGVFbD8udGV4dENvbnRlbnQ/LnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2R1Y3ROYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0g0KPQtNCw0LvQtdC90LjQtSDRgtC+0LLQsNGA0LA6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVSdWxlUHJvZHVjdERlbGV0aW9uKHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGlzQ2FydEJ1dHRvbiA9IHRhcmdldC5jbG9zZXN0KGAke0RPTV9TRUxFQ1RPUlMuUFJPRFVDVF9QTFVTX0JVVFRPTn0sICR7RE9NX1NFTEVDVE9SUy5QUk9EVUNUX01JTlVTX0JVVFRPTn0sICR7RE9NX1NFTEVDVE9SUy5QUk9EVUNUX0RFTF9CVVRUT059YCk7XG4gICAgICAgICAgICBpZiAoaXNDYXJ0QnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjYXJ0T2JzZXJ2ZXJdINCa0LvQuNC6INC90LAg0LrQvdC+0L/QutGDINC60L7RgNC30LjQvdGLJyk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBjaGVja0NhcnRDaGFuZ2VzKCksIERFTEFZUy5PQlNFUlZFUl9DSEVDSyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBzZXR1cExvY2FsU3RvcmFnZUludGVyY2VwdG9yID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF3aW5kb3cuX19jYXJkZm9ybV9sb2NhbHN0b3JhZ2VfaW50ZXJjZXB0ZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvcmlnaW5hbFNldEl0ZW0gPSBTdG9yYWdlLnByb3RvdHlwZS5zZXRJdGVtO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAgIFN0b3JhZ2UucHJvdG90eXBlLnNldEl0ZW0gPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBvcmlnaW5hbFNldEl0ZW0uYXBwbHkodGhpcywgW2tleSwgdmFsdWVdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ3RjYXJ0JyAmJiAhc2VsZi5pc1VwZGF0aW5nQ2FydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjYXJ0T2JzZXJ2ZXJdIGxvY2FsU3RvcmFnZSB0Y2FydCDQuNC30LzQtdC90LXQvSDQuNC30LLQvdC1Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGNoZWNrQ2FydENoYW5nZXMoKSwgREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgd2luZG93Ll9fY2FyZGZvcm1fbG9jYWxzdG9yYWdlX2ludGVyY2VwdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRDYXJ0T2JzZXJ2ZXJdIOKckyBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSDQv9C10YDQtdGF0LLQsNGH0LXQvScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuICAgICAgICAgICAgc2V0dXBMb2NhbFN0b3JhZ2VJbnRlcmNlcHRvcigpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBzZXR1cExvY2FsU3RvcmFnZUludGVyY2VwdG9yKTtcbiAgICAgICAgfVxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaDtcbiAgICAgICAgICAgIGlmIChoYXNoID09PSAnI29wZW5jYXJ0Jykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2FydE9ic2VydmVyXSDQmtC+0YDQt9C40L3QsCDQvtGC0LrRgNGL0LLQsNC10YLRgdGPINGH0LXRgNC10LcgI29wZW5jYXJ0Jyk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZVF1YW50aXR5Q29udHJvbHNGb3JSdWxlUHJvZHVjdHMoKTtcbiAgICAgICAgICAgICAgICB9LCBERUxBWVMuQ0FSVF9VUERBVEUgKyAyMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgb2JzZXJ2ZUNhcnRWaXNpYmlsaXR5ID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2FydFdpbmRvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy50NzA2X19jYXJ0d2luJyk7XG4gICAgICAgICAgICBpZiAoY2FydFdpbmRvdykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZpc2liaWxpdHlPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbXV0YXRpb25zLmZvckVhY2goKG11dGF0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobXV0YXRpb24udHlwZSA9PT0gJ2F0dHJpYnV0ZXMnICYmIG11dGF0aW9uLmF0dHJpYnV0ZU5hbWUgPT09ICdjbGFzcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gbXV0YXRpb24udGFyZ2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygndDcwNl9fY2FydHdpbl9zaG93ZWQnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0g0JrQvtGA0LfQuNC90LAg0L/QvtC60LDQt9Cw0L3QsCAo0LrQu9Cw0YHRgSB0NzA2X19jYXJ0d2luX3Nob3dlZCknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZGVRdWFudGl0eUNvbnRyb2xzRm9yUnVsZVByb2R1Y3RzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIERFTEFZUy5DQVJUX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB2aXNpYmlsaXR5T2JzZXJ2ZXIub2JzZXJ2ZShjYXJ0V2luZG93LCB7XG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZUZpbHRlcjogWydjbGFzcyddXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtpbml0Q2FydE9ic2VydmVyXSDinJMg0J3QsNCx0LvRjtC00LDRgtC10LvRjCDQstC40LTQuNC80L7RgdGC0Lgg0LrQvtGA0LfQuNC90Ysg0YPRgdGC0LDQvdC+0LLQu9C10L0nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQob2JzZXJ2ZUNhcnRWaXNpYmlsaXR5LCAxMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgb2JzZXJ2ZUNhcnRWaXNpYmlsaXR5KCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdENhcnRPYnNlcnZlcl0g4pyTINCd0LDQsdC70Y7QtNCw0YLQtdC70Lgg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90YsnKTtcbiAgICB9XG4gICAgaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbihwcm9kdWN0TmFtZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCf0YDQvtCy0LXRgNC60LAg0YLQvtCy0LDRgNCwOicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgZm9yIChjb25zdCBba2V5LCBzdGF0ZV0gb2YgdGhpcy5hY3Rpb25zU3RhdGVzKSB7XG4gICAgICAgICAgICBpZiAoc3RhdGUuYWN0aW9uICYmIHN0YXRlLmFjdGlvbi52YWx1ZSA9PT0gcHJvZHVjdE5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCi0L7QstCw0YAg0LjQtyDQv9GA0LDQstC40LvQsCDQvdCw0LnQtNC10L06Jywge1xuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZToga2V5LFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHN0YXRlLmFjdGlvbi52YWx1ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGxldCBmb3VuZEVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsbElucHV0cyA9IHRoaXMuZm9ybS5xdWVyeVNlbGVjdG9yQWxsKCdpbnB1dCwgc2VsZWN0Jyk7XG4gICAgICAgICAgICAgICAgYWxsSW5wdXRzLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWwgPSBlbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAoKGVsLnR5cGUgPT09ICdyYWRpbycgfHwgZWwudHlwZSA9PT0gJ2NoZWNrYm94JykgJiYgZWwudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbC52YWx1ZS50cmltKCkgPT09IHN0YXRlLmFjdGlvbi52YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZEVsZW1lbnQgPSBlbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCd0LDQudC00LXQvSDRjdC70LXQvNC10L3RgjonLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGVsLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBlbC52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZDogZWwuY2hlY2tlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCh0L3QuNC80LDQtdC8INCy0YvQsdC+0YAg0YE6JywgZm91bmRFbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgZm91bmRFbGVtZW50LmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dIOKckyDQn9GA0LDQstC40LvQviDQvtGC0LzQtdC90LXQvdC+LCBjaGVja2JveCDRgdC90Y/RgicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCt0LvQtdC80LXQvdGCINGE0L7RgNC80Ysg0L3QtSDQvdCw0LnQtNC10L0g0LTQu9GPOicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uVmFsdWU6IHN0YXRlLmFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZUlucHV0czogQXJyYXkuZnJvbShhbGxJbnB1dHMpLm1hcChlbCA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGVsLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGVsLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIHVwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5KCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDQndCw0YfQsNC70L4g0L7QsdC90L7QstC70LXQvdC40Y8g0LrQvtC70LjRh9C10YHRgtCy0LAnKTtcbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAoIXRpbGRhQ2FydCB8fCAhQXJyYXkuaXNBcnJheSh0aWxkYUNhcnQucHJvZHVjdHMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCa0L7RgNC30LjQvdCwINC90LXQtNC+0YHRgtGD0L/QvdCwJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0JDQutGC0LjQstC90YvRhSDQv9GA0LDQstC40Ls6JywgdGhpcy5hY3Rpb25zU3RhdGVzLnNpemUpO1xuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHN0YXRlXSBvZiB0aGlzLmFjdGlvbnNTdGF0ZXMpIHtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5hY3Rpb24gJiYgc3RhdGUuYWN0aW9uLnF1YW50aXR5VHlwZSA9PT0gJ3BlclByb2R1Y3QnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3UXVhbnRpdHkgPSB0aGlzLmNhbGN1bGF0ZVJ1bGVQcm9kdWN0UXVhbnRpdHkoc3RhdGUuYWN0aW9uKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0SW5kZXggPSB0aWxkYUNhcnQucHJvZHVjdHMuZmluZEluZGV4KChwKSA9PiBwLm5hbWU/LnRyaW0oKSA9PT0gc3RhdGUuYWN0aW9uLnZhbHVlLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkUXVhbnRpdHkgPSBwYXJzZUludCh0aWxkYUNhcnQucHJvZHVjdHNbcHJvZHVjdEluZGV4XS5xdWFudGl0eSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCi0L7QstCw0YAgXCIke3N0YXRlLmFjdGlvbi52YWx1ZX1cIjpgLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRRdWFudGl0eTogb2xkUXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdRdWFudGl0eTogbmV3UXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICBuZWVkc1VwZGF0ZTogb2xkUXVhbnRpdHkgIT09IG5ld1F1YW50aXR5XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAob2xkUXVhbnRpdHkgIT09IG5ld1F1YW50aXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDimqEg0J7QsdC90L7QstC70Y/QtdC8INGH0LXRgNC10LcgdGNhcnRfX3Byb2R1Y3RfX3VwZGF0ZVF1YW50aXR5Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcHJvZHVjdEVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCAxMDsgYXR0ZW1wdCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdEVsZW1lbnQgPSBDYXJ0VXRpbHMuZmluZFByb2R1Y3RFbGVtZW50KHN0YXRlLmFjdGlvbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCt0LvQtdC80LXQvdGCINC90LDQudC00LXQvSDQvdCwINC/0L7Qv9GL0YLQutC1OicsIGF0dGVtcHQgKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRlbXB0IDwgOSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuRE9NX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcXVhbnRpdHlFbGVtZW50ID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLlBST0RVQ1RfUVVBTlRJVFkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChxdWFudGl0eUVsZW1lbnQgJiYgdHlwZW9mIHdpbmRvdy50Y2FydF9fcHJvZHVjdF9fdXBkYXRlUXVhbnRpdHkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnRjYXJ0X19wcm9kdWN0X191cGRhdGVRdWFudGl0eShxdWFudGl0eUVsZW1lbnQsIHByb2R1Y3RFbGVtZW50LCBwcm9kdWN0SW5kZXgsIG5ld1F1YW50aXR5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g4pyTINCa0L7Qu9C40YfQtdGB0YLQstC+INC+0LHQvdC+0LLQu9C10L3QviDRh9C10YDQtdC3IFRpbGRhIEFQSTonLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRRdWFudGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1F1YW50aXR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuRE9NX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsdXNNaW51c0J1dHRvbnMgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9QTFVTTUlOVVMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGx1c01pbnVzQnV0dG9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1c01pbnVzQnV0dG9ucy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCd0LUg0L3QsNC50LTQtdC9IHF1YW50aXR5RWxlbWVudCDQuNC70Lgg0YTRg9C90LrRhtC40Y8gdXBkYXRlUXVhbnRpdHknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCd0LUg0L3QsNC50LTQtdC9IERPTSDRjdC70LXQvNC10L3RgiDRgtC+0LLQsNGA0LAg0L/QvtGB0LvQtSDQvtC20LjQtNCw0L3QuNGPJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0KLQvtCy0LDRgCBcIiR7c3RhdGUuYWN0aW9uLnZhbHVlfVwiINCd0JUg0L3QsNC50LTQtdC9INCyINC60L7RgNC30LjQvdC1YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldIOKckyDQntCx0L3QvtCy0LvQtdC90LjQtSDQt9Cw0LLQtdGA0YjQtdC90L4nKTtcbiAgICAgICAgYXdhaXQgdGhpcy5oaWRlUXVhbnRpdHlDb250cm9sc0ZvclJ1bGVQcm9kdWN0cygpO1xuICAgIH1cbiAgICB1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET00ocHJvZHVjdE5hbWUsIG5ld1F1YW50aXR5KSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDQntCx0L3QvtCy0LvQtdC90LjQtTonLCB7IHByb2R1Y3ROYW1lLCBuZXdRdWFudGl0eSB9KTtcbiAgICAgICAgY29uc3QgdGl0bGVTZWxlY3RvcnMgPSBbXG4gICAgICAgICAgICAnLnQ3MDZfX3Byb2R1Y3QtdGl0bGUnLFxuICAgICAgICAgICAgJy50LXN0b3JlX19wcm9kdWN0LW5hbWUnLFxuICAgICAgICAgICAgJy50LXByb2R1Y3RfX3RpdGxlJyxcbiAgICAgICAgICAgICcuanMtcHJvZHVjdC1uYW1lJ1xuICAgICAgICBdO1xuICAgICAgICBsZXQgcHJvZHVjdEVsZW1lbnQgPSBudWxsO1xuICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHRpdGxlU2VsZWN0b3JzKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0VGl0bGVzID0gWy4uLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDQn9C+0LjRgdC6INGH0LXRgNC10LcgXCIke3NlbGVjdG9yfVwiOmAsIHByb2R1Y3RUaXRsZXMubGVuZ3RoLCAn0Y3Qu9C10LzQtdC90YLQvtCyJyk7XG4gICAgICAgICAgICBjb25zdCBmb3VuZEVsZW1lbnQgPSBwcm9kdWN0VGl0bGVzLmZpbmQoZWwgPT4gZWwuaW5uZXJUZXh0LnRyaW0oKSA9PT0gcHJvZHVjdE5hbWUudHJpbSgpKTtcbiAgICAgICAgICAgIGlmIChmb3VuZEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBwcm9kdWN0RWxlbWVudCA9IGZvdW5kRWxlbWVudC5jbG9zZXN0KCcudDcwNl9fY2FydHdpbi1wcm9kdWN0LCAudC1zdG9yZV9fcHJvZHVjdCwgLnQtcHJvZHVjdCcpO1xuICAgICAgICAgICAgICAgIGlmIChwcm9kdWN0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g4pyTINCi0L7QstCw0YAg0L3QsNC50LTQtdC9INGH0LXRgNC10Lc6Jywgc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFwcm9kdWN0RWxlbWVudCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g4pyXINCt0LvQtdC80LXQvdGCINGC0L7QstCw0YDQsCDQndCVINC90LDQudC00LXQvSDQsiBET006JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dINCS0YHQtSDRgtC+0LLQsNGA0Ysg0LIgRE9NOicsIFsuLi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudDcwNl9fcHJvZHVjdC10aXRsZSwgLnQtc3RvcmVfX3Byb2R1Y3QtbmFtZScpXS5tYXAoKGVsKSA9PiBlbC5pbm5lclRleHQpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBxdWFudGl0eUlucHV0U2VsZWN0b3JzID0gW1xuICAgICAgICAgICAgJy50NzA2X19wcm9kdWN0LXF1YW50aXR5JyxcbiAgICAgICAgICAgICcudC1zdG9yZV9fcXVhbnRpdHktaW5wdXQnLFxuICAgICAgICAgICAgJ2lucHV0W25hbWU9XCJxdWFudGl0eVwiXScsXG4gICAgICAgICAgICAnLmpzLXByb2R1Y3QtcXVhbnRpdHknXG4gICAgICAgIF07XG4gICAgICAgIGxldCBxdWFudGl0eUlucHV0ID0gbnVsbDtcbiAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBxdWFudGl0eUlucHV0U2VsZWN0b3JzKSB7XG4gICAgICAgICAgICBxdWFudGl0eUlucHV0ID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgICAgICBpZiAocXVhbnRpdHlJbnB1dCkge1xuICAgICAgICAgICAgICAgIHF1YW50aXR5SW5wdXQudmFsdWUgPSBuZXdRdWFudGl0eS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIHF1YW50aXR5SW5wdXQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2NoYW5nZScsIHsgYnViYmxlczogdHJ1ZSB9KSk7XG4gICAgICAgICAgICAgICAgcXVhbnRpdHlJbnB1dC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnaW5wdXQnLCB7IGJ1YmJsZXM6IHRydWUgfSkpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDinJMg0J7QsdC90L7QstC70LXQvSBpbnB1dCDRh9C10YDQtdC3OicsIHNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBxdWFudGl0eURpc3BsYXlTZWxlY3RvcnMgPSBbXG4gICAgICAgICAgICAnLnQtcXVhbnRpdHlfX3ZhbHVlJyxcbiAgICAgICAgICAgICcudDcwNl9fcHJvZHVjdC1xdWFudGl0eS12YWx1ZScsXG4gICAgICAgICAgICAnLnQtc3RvcmVfX3F1YW50aXR5LXZhbHVlJ1xuICAgICAgICBdO1xuICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHF1YW50aXR5RGlzcGxheVNlbGVjdG9ycykge1xuICAgICAgICAgICAgY29uc3QgcXVhbnRpdHlEaXNwbGF5ID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgICAgICBpZiAocXVhbnRpdHlEaXNwbGF5KSB7XG4gICAgICAgICAgICAgICAgcXVhbnRpdHlEaXNwbGF5LnRleHRDb250ZW50ID0gbmV3UXVhbnRpdHkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g4pyTINCe0LHQvdC+0LLQu9C10L0gZGlzcGxheSDRh9C10YDQtdC3OicsIHNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICh0aWxkYUNhcnQpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aWxkYUNhcnQucHJvZHVjdHMuZmluZCgocCkgPT4gcC5uYW1lPy50cmltKCkgPT09IHByb2R1Y3ROYW1lLnRyaW0oKSk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsUHJpY2UgPSBwYXJzZUZsb2F0KHByb2R1Y3QucHJpY2UpICogbmV3UXVhbnRpdHk7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJpY2VTZWxlY3RvcnMgPSBbXG4gICAgICAgICAgICAgICAgICAgICcudDcwNl9fcHJvZHVjdC1wcmljZScsXG4gICAgICAgICAgICAgICAgICAgICcudC1zdG9yZV9fcHJvZHVjdC1wcmljZScsXG4gICAgICAgICAgICAgICAgICAgICcudC1wcm9kdWN0X19wcmljZScsXG4gICAgICAgICAgICAgICAgICAgICcuanMtcHJvZHVjdC1wcmljZSdcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgcHJpY2VTZWxlY3RvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJpY2VFbGVtZW50ID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmljZUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaWNlRWxlbWVudC50ZXh0Q29udGVudCA9IGAke3RvdGFsUHJpY2UudG9Mb2NhbGVTdHJpbmcoJ3J1LVJVJyl9ICR7dGlsZGFDYXJ0LmN1cnJlbmN5X3R4dF9yIHx8ICcg0YAuJ31gO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dIOKckyDQntCx0L3QvtCy0LvQtdC90LAg0YHRgtC+0LjQvNC+0YHRgtGMINGH0LXRgNC10Lc6Jywgc2VsZWN0b3IsIHRvdGFsUHJpY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dIOKckyDQntCx0L3QvtCy0LvQtdC90LjQtSDQt9Cw0LLQtdGA0YjQtdC90L4g0LTQu9GPOicsIHByb2R1Y3ROYW1lKTtcbiAgICB9XG4gICAgdXBkYXRlQWxsQ2FydEl0ZW1zSW5ET00oKSB7XG4gICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgaWYgKCF0aWxkYUNhcnQgfHwgIUFycmF5LmlzQXJyYXkodGlsZGFDYXJ0LnByb2R1Y3RzKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3VwZGF0ZUFsbENhcnRJdGVtc0luRE9NXSDQmtC+0YDQt9C40L3QsCDQvdC10LTQvtGB0YLRg9C/0L3QsCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQWxsQ2FydEl0ZW1zSW5ET01dINCe0LHQvdC+0LLQu9GP0LXQvCDQstGB0LUg0YLQvtCy0LDRgNGLINCyIERPTScpO1xuICAgICAgICB0aWxkYUNhcnQucHJvZHVjdHMuZm9yRWFjaCgocHJvZHVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdE5hbWUgPSBwcm9kdWN0Lm5hbWU/LnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IHF1YW50aXR5ID0gcGFyc2VJbnQocHJvZHVjdC5xdWFudGl0eSB8fCAxKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0TmFtZSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NKHByb2R1Y3ROYW1lLCBxdWFudGl0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUFsbENhcnRJdGVtc0luRE9NXSDinJMg0JLRgdC1INGC0L7QstCw0YDRiyDQvtCx0L3QvtCy0LvQtdC90YsnKTtcbiAgICB9XG4gICAgcmVmcmVzaENhcnRVSSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtyZWZyZXNoQ2FydFVJXSDQndCw0YfQsNC70L4g0L7QsdC90L7QstC70LXQvdC40Y8gVUkg0LrQvtGA0LfQuNC90YsnKTtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cudF9zdG9yZV9fcmVmcmVzaGNhcnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHdpbmRvdy50X3N0b3JlX19yZWZyZXNoY2FydCgpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtyZWZyZXNoQ2FydFVJXSDinJMg0JLRi9C30LLQsNC9IHRfc3RvcmVfX3JlZnJlc2hjYXJ0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVmcmVzaEZ1bmN0aW9ucyA9IFtcbiAgICAgICAgICAgICd0NzA2X191cGRhdGVDYXJ0JyxcbiAgICAgICAgICAgICd0Y2FydF9fdXBkYXRlQ2FydCcsXG4gICAgICAgICAgICAndF9zdG9yZV9fdXBkYXRlQ2FydCcsXG4gICAgICAgICAgICAndDcwNl9pbml0J1xuICAgICAgICBdO1xuICAgICAgICByZWZyZXNoRnVuY3Rpb25zLmZvckVhY2goZnVuY05hbWUgPT4ge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3dbZnVuY05hbWVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93W2Z1bmNOYW1lXSgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW3JlZnJlc2hDYXJ0VUldIOKckyDQktGL0LfQstCw0L0gJHtmdW5jTmFtZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZm9ybV0gW3JlZnJlc2hDYXJ0VUldINCe0YjQuNCx0LrQsCAke2Z1bmNOYW1lfTpgLCBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnVwZGF0ZUFsbENhcnRJdGVtc0luRE9NKCk7XG4gICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnY2FydC11cGRhdGVkJykpO1xuICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgndGNhcnQtdXBkYXRlZCcpKTtcbiAgICAgICAgdGhpcy51cGRhdGVDYXJ0Q291bnRlcnMoKTtcbiAgICB9XG4gICAgdXBkYXRlQ2FydENvdW50ZXJzKCkge1xuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICghdGlsZGFDYXJ0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBjYXJ0Q291bnRlcnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKERPTV9TRUxFQ1RPUlMuQ0FSVF9DT1VOVEVSKTtcbiAgICAgICAgY2FydENvdW50ZXJzLmZvckVhY2goY291bnRlciA9PiB7XG4gICAgICAgICAgICBpZiAoY291bnRlcikge1xuICAgICAgICAgICAgICAgIGNvdW50ZXIudGV4dENvbnRlbnQgPSB0aWxkYUNhcnQudG90YWwudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGNhcnRBbW91bnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChET01fU0VMRUNUT1JTLkNBUlRfQU1PVU5UKTtcbiAgICAgICAgY2FydEFtb3VudHMuZm9yRWFjaChhbW91bnQgPT4ge1xuICAgICAgICAgICAgaWYgKGFtb3VudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdHRlZEFtb3VudCA9IHRpbGRhQ2FydC5hbW91bnQudG9Mb2NhbGVTdHJpbmcoJ3J1LVJVJyk7XG4gICAgICAgICAgICAgICAgYW1vdW50LnRleHRDb250ZW50ID0gYCR7Zm9ybWF0dGVkQW1vdW50fSAke3RpbGRhQ2FydC5jdXJyZW5jeV90eHRfciB8fCAnINGALid9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydENvdW50ZXJzXSDinJMg0KHRh9C10YLRh9C40LrQuCDQvtCx0L3QvtCy0LvQtdC90YsnKTtcbiAgICB9XG4gICAgZ2V0TWFpblByb2R1Y3RzUXVhbnRpdHkoKSB7XG4gICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgaWYgKCF0aWxkYUNhcnQgfHwgIUFycmF5LmlzQXJyYXkodGlsZGFDYXJ0LnByb2R1Y3RzKSkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcnVsZVByb2R1Y3ROYW1lcyA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5ydWxlcy5mb3JFYWNoKHJ1bGUgPT4ge1xuICAgICAgICAgICAgcnVsZS5hY3Rpb25zLmZvckVhY2goYWN0aW9uID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bGVQcm9kdWN0TmFtZXMuYWRkKGFjdGlvbi52YWx1ZS50cmltKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgbGV0IHRvdGFsUXVhbnRpdHkgPSAwO1xuICAgICAgICBjb25zdCBtYWluUHJvZHVjdHMgPSBbXTtcbiAgICAgICAgdGlsZGFDYXJ0LnByb2R1Y3RzLmZvckVhY2goKHByb2R1Y3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3ROYW1lID0gcHJvZHVjdC5uYW1lPy50cmltKCk7XG4gICAgICAgICAgICBjb25zdCBpc1J1bGVQcm9kdWN0ID0gcnVsZVByb2R1Y3ROYW1lcy5oYXMocHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgY29uc3QgcXR5ID0gcGFyc2VJbnQocHJvZHVjdC5xdWFudGl0eSB8fCAxKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0TmFtZSAmJiAhaXNSdWxlUHJvZHVjdCkge1xuICAgICAgICAgICAgICAgIHRvdGFsUXVhbnRpdHkgKz0gcXR5O1xuICAgICAgICAgICAgICAgIG1haW5Qcm9kdWN0cy5wdXNoKGAke3Byb2R1Y3ROYW1lfSAoJHtxdHl9INGI0YIpYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2dldE1haW5Qcm9kdWN0c1F1YW50aXR5XScsIHtcbiAgICAgICAgICAgICfQntGB0L3QvtCy0L3Ri9GFINGC0L7QstCw0YDQvtCyJzogdG90YWxRdWFudGl0eSxcbiAgICAgICAgICAgICfQodC/0LjRgdC+0LonOiBtYWluUHJvZHVjdHMsXG4gICAgICAgICAgICAn0KLQvtCy0LDRgNGLINC/0YDQsNCy0LjQuyc6IEFycmF5LmZyb20ocnVsZVByb2R1Y3ROYW1lcylcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0b3RhbFF1YW50aXR5O1xuICAgIH1cbiAgICBjYWxjdWxhdGVSdWxlUHJvZHVjdFF1YW50aXR5KGFjdGlvbikge1xuICAgICAgICBpZiAoYWN0aW9uLnF1YW50aXR5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBhY3Rpb24ucXVhbnRpdHk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFjdGlvbi5xdWFudGl0eVR5cGUgPT09ICdwZXJQcm9kdWN0Jykge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGgubWF4KDEsIHRoaXMuZ2V0TWFpblByb2R1Y3RzUXVhbnRpdHkoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIGFzeW5jIHJlbW92ZVByb2R1Y3RGcm9tQ2FydChwcm9kdWN0TmFtZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3JlbW92ZVByb2R1Y3RdINCf0L7Qv9GL0YLQutCwINGD0LTQsNC70LjRgtGMOicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgY29uc3QgcHJvZHVjdEVsZW1lbnQgPSBDYXJ0VXRpbHMuZmluZFByb2R1Y3RFbGVtZW50KHByb2R1Y3ROYW1lKTtcbiAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICBjb25zdCBkZWxQcm9kdWN0QnV0dG9uID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLlBST0RVQ1RfREVMX0JVVFRPTik7XG4gICAgICAgICAgICBpZiAoZGVsUHJvZHVjdEJ1dHRvbikge1xuICAgICAgICAgICAgICAgIGRlbFByb2R1Y3RCdXR0b24uY2xpY2soKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3JlbW92ZVByb2R1Y3RdIOKckyDQo9C00LDQu9C10L3QviDRh9C10YDQtdC3IERPTSAo0LrQu9C40LopOicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuQ0FSVF9VUERBVEUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgaWYgKHRpbGRhQ2FydCAmJiBBcnJheS5pc0FycmF5KHRpbGRhQ2FydC5wcm9kdWN0cykpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RJbmRleCA9IHRpbGRhQ2FydC5wcm9kdWN0cy5maW5kSW5kZXgoKHApID0+IHAubmFtZT8udHJpbSgpID09PSBwcm9kdWN0TmFtZS50cmltKCkpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3RJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGlsZGFDYXJ0LnByb2R1Y3RzW3Byb2R1Y3RJbmRleF07XG4gICAgICAgICAgICAgICAgY29uc3QgcmVtb3ZlRnVuY3Rpb25zID0gW1xuICAgICAgICAgICAgICAgICAgICAndGNhcnRfX3JlbW92ZVByb2R1Y3QnLFxuICAgICAgICAgICAgICAgICAgICAndGNhcnRfcmVtb3ZlUHJvZHVjdCcsXG4gICAgICAgICAgICAgICAgICAgICd0X3N0b3JlX19yZW1vdmVQcm9kdWN0J1xuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBmdW5jTmFtZSBvZiByZW1vdmVGdW5jdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3dbZnVuY05hbWVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvd1tmdW5jTmFtZV0ocHJvZHVjdC51aWQgfHwgcHJvZHVjdC5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtyZW1vdmVQcm9kdWN0XSDinJMg0KPQtNCw0LvQtdC90L4g0YfQtdGA0LXQtyAke2Z1bmNOYW1lfTpgLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgQ2FydFV0aWxzLndhaXQoREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZm9ybV0gW3JlbW92ZVByb2R1Y3RdINCe0YjQuNCx0LrQsCAke2Z1bmNOYW1lfTpgLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aWxkYUNhcnQucHJvZHVjdHMuc3BsaWNlKHByb2R1Y3RJbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgdGlsZGFDYXJ0LmFtb3VudCA9IHRpbGRhQ2FydC5wcm9kdWN0cy5yZWR1Y2UoKHN1bSwgcCkgPT4gc3VtICsgKHBhcnNlRmxvYXQocC5wcmljZSkgKiBwYXJzZUludChwLnF1YW50aXR5IHx8IDEpKSwgMCk7XG4gICAgICAgICAgICAgICAgdGlsZGFDYXJ0LnByb2RhbW91bnQgPSB0aWxkYUNhcnQucHJvZHVjdHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHRpbGRhQ2FydC50b3RhbCA9IHRpbGRhQ2FydC5wcm9kdWN0cy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdGlsZGFDYXJ0LnVwZGF0ZWQgPSBNYXRoLmZsb29yKERhdGUubm93KCkgLyAxMDAwKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zYXZlVGlsZGFDYXJ0KHRpbGRhQ2FydCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cudF9zdG9yZV9fcmVmcmVzaGNhcnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy50X3N0b3JlX19yZWZyZXNoY2FydCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbcmVtb3ZlUHJvZHVjdF0g4pyTINCj0LTQsNC70LXQvdC+INC90LDQv9GA0Y/QvNGD0Y4g0LjQtyDQvNCw0YHRgdC40LLQsDonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IENhcnRVdGlscy53YWl0KERFTEFZUy5DQVJUX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbcmVtb3ZlUHJvZHVjdF0g4pyXINCd0LUg0YPQtNCw0LvQvtGB0Ywg0YPQtNCw0LvQuNGC0Ywg0YLQvtCy0LDRgDonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYXN5bmMgYXBwbHlBY3Rpb25zKG9sZFN0YXRlID0gbmV3IE1hcCgpKSB7XG4gICAgICAgIGlmICh0aGlzLmlzQXBwbHlpbmdBY3Rpb25zKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0KPQttC1INCy0YvQv9C+0LvQvdGP0LXRgtGB0Y8sINC/0YDQvtC/0YPRgdC60LDQtdC8Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pc0FwcGx5aW5nQWN0aW9ucyA9IHRydWU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0J3QsNGH0LDQu9C+INC/0YDQuNC80LXQvdC10L3QuNGPINC00LXQudGB0YLQstC40LknKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQodGC0LDRgNC+0LUg0YHQvtGB0YLQvtGP0L3QuNC1OicsIE9iamVjdC5mcm9tRW50cmllcyhvbGRTdGF0ZSkpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdINCd0L7QstC+0LUg0YHQvtGB0YLQvtGP0L3QuNC1OicsIE9iamVjdC5mcm9tRW50cmllcyh0aGlzLmFjdGlvbnNTdGF0ZXMpKTtcbiAgICAgICAgICAgIGNvbnN0IGNhcnRMb2FkZWQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgICAgIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChbLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLnQ3MDZfX3Byb2R1Y3QtdGl0bGVgKV0ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIDIwMCk7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUoZmFsc2UpLCAzMDAwKSlcbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgaWYgKCFjYXJ0TG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0JrQvtGA0LfQuNC90LAg0L3QtSDQt9Cw0LPRgNGD0LfQuNC70LDRgdGMINC30LAgMyDRgdC10LrRg9C90LTRiywg0L/RgNC+0LTQvtC70LbQsNC10LwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3QgW2tleSwgc3RhdGVdIG9mIHRoaXMuYWN0aW9uc1N0YXRlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZFZhbHVlID0gb2xkU3RhdGUuZ2V0KGtleSk/LnZhbHVlO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZEFjdGlvbiA9IG9sZFN0YXRlLmdldChrZXkpPy5hY3Rpb247XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFthcHBseUFjdGlvbnNdINCe0LHRgNCw0LHQvtGC0LrQsCDQv9C+0LvRjyBcIiR7a2V5fVwiOmAsIHtcbiAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlOiBzdGF0ZS52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgb2xkQWN0aW9uOiBvbGRBY3Rpb24/LnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBuZXdBY3Rpb246IHN0YXRlLmFjdGlvbj8udmFsdWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUudmFsdWUgIT09IG9sZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvbGRBY3Rpb24gJiYgb2xkQWN0aW9uLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0KPQtNCw0LvRj9C10Lwg0YHRgtCw0YDRi9C5INGC0L7QstCw0YA6Jywgb2xkQWN0aW9uLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucmVtb3ZlUHJvZHVjdEZyb21DYXJ0KG9sZEFjdGlvbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlLnZhbHVlICYmIHN0YXRlLmFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdElkID0gYHJ1bGVfJHtrZXl9XyR7RGF0ZS5ub3coKX1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdFF1YW50aXR5ID0gdGhpcy5jYWxjdWxhdGVSdWxlUHJvZHVjdFF1YW50aXR5KHN0YXRlLmFjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0JTQvtCx0LDQstC70Y/QtdC8INC90L7QstGL0Lkg0YLQvtCy0LDRgDonLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHByb2R1Y3RJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpY2U6IHN0YXRlLmFjdGlvbi5zdW0gfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWFudGl0eTogcHJvZHVjdFF1YW50aXR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXR5VHlwZTogc3RhdGUuYWN0aW9uLnF1YW50aXR5VHlwZSB8fCAnZml4ZWQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy50Y2FydF9fYWRkUHJvZHVjdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHByb2R1Y3RJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpY2U6IHN0YXRlLmFjdGlvbi5zdW0gfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWFudGl0eTogcHJvZHVjdFF1YW50aXR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGFuZ2VQcm9kdWN0ID0gYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoYW5nZVByb2R1Y3QgPSBbLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLnQ3MDZfX3Byb2R1Y3QtdGl0bGVgKV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKChlKSA9PiBlLmlubmVyVGV4dC50cmltKCkgPT09IHN0YXRlLmFjdGlvbi52YWx1ZS50cmltKCkpPy5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGNoYW5nZVByb2R1Y3QgfHwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAzMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hhbmdlUHJvZHVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoYW5nZVByb2R1Y3RCdXR0b24gPSBjaGFuZ2VQcm9kdWN0LnF1ZXJ5U2VsZWN0b3IoYC50NzA2X19wcm9kdWN0LXBsdXNtaW51c2ApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VQcm9kdWN0QnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZVByb2R1Y3RCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdIOKckyDQodC60YDRi9GC0Ysg0LrQvdC+0L/QutC4INC60L7Qu9C40YfQtdGB0YLQstCwJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFzdGF0ZS52YWx1ZSB8fCAhc3RhdGUuYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0JfQvdCw0YfQtdC90LjQtSDRgdCx0YDQvtGI0LXQvdC+LCDRgtC+0LLQsNGAINGD0LTQsNC70LXQvScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdIOKckyDQn9GA0LjQvNC10L3QtdC90LjQtSDQtNC10LnRgdGC0LLQuNC5INC30LDQstC10YDRiNC10L3QvicpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5oaWRlUXVhbnRpdHlDb250cm9sc0ZvclJ1bGVQcm9kdWN0cygpO1xuICAgICAgICB9XG4gICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5pc0FwcGx5aW5nQWN0aW9ucyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldEFsbFJ1bGVQcm9kdWN0TmFtZXMoKSB7XG4gICAgICAgIGNvbnN0IHJ1bGVQcm9kdWN0TmFtZXMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMucnVsZXMuZm9yRWFjaChydWxlID0+IHtcbiAgICAgICAgICAgIHJ1bGUuYWN0aW9ucy5mb3JFYWNoKGFjdGlvbiA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBydWxlUHJvZHVjdE5hbWVzLmFkZChhY3Rpb24udmFsdWUudHJpbSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaGlkZVF1YW50aXR5XSDQktGB0LUg0YLQvtCy0LDRgNGLINC40Lcg0L/RgNCw0LLQuNC7OicsIEFycmF5LmZyb20ocnVsZVByb2R1Y3ROYW1lcykpO1xuICAgICAgICByZXR1cm4gcnVsZVByb2R1Y3ROYW1lcztcbiAgICB9XG4gICAgYXN5bmMgaGlkZVF1YW50aXR5Q29udHJvbHNGb3JSdWxlUHJvZHVjdHMoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaGlkZVF1YW50aXR5XSDQndCw0YfQsNC70L4g0YHQutGA0YvRgtC40Y8g0YHRh9C10YLRh9C40LrQvtCyINC00LvRjyDRgtC+0LLQsNGA0L7QsiDQuNC3INC/0YDQsNCy0LjQuycpO1xuICAgICAgICBjb25zdCBydWxlUHJvZHVjdE5hbWVzID0gdGhpcy5nZXRBbGxSdWxlUHJvZHVjdE5hbWVzKCk7XG4gICAgICAgIGlmIChydWxlUHJvZHVjdE5hbWVzLnNpemUgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaGlkZVF1YW50aXR5XSDQndC10YIg0YLQvtCy0LDRgNC+0LIg0LjQtyDQv9GA0LDQstC40LsnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuRE9NX1VQREFURSk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3RFbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoRE9NX1NFTEVDVE9SUy5DQVJUX1BST0RVQ1QpO1xuICAgICAgICBsZXQgaGlkZGVuQ291bnQgPSAwO1xuICAgICAgICBwcm9kdWN0RWxlbWVudHMuZm9yRWFjaCgocHJvZHVjdEVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRpdGxlRWxlbWVudCA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoRE9NX1NFTEVDVE9SUy5QUk9EVUNUX1RJVExFKTtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3ROYW1lID0gdGl0bGVFbGVtZW50Py50ZXh0Q29udGVudD8udHJpbSgpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3ROYW1lICYmIHJ1bGVQcm9kdWN0TmFtZXMuaGFzKHByb2R1Y3ROYW1lKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBsdXNNaW51c0Jsb2NrID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLlBST0RVQ1RfUExVU01JTlVTKTtcbiAgICAgICAgICAgICAgICBpZiAocGx1c01pbnVzQmxvY2sgJiYgcGx1c01pbnVzQmxvY2suc3R5bGUuZGlzcGxheSAhPT0gJ25vbmUnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBsdXNNaW51c0Jsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgIGhpZGRlbkNvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbaGlkZVF1YW50aXR5XSDinJMg0KHQutGA0YvRgtGLINC60L3QvtC/0LrQuCDQtNC70Y8g0YLQvtCy0LDRgNCwOiBcIiR7cHJvZHVjdE5hbWV9XCJgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW2hpZGVRdWFudGl0eV0g4pyTINCh0LrRgNGL0YLQviDRgdGH0LXRgtGH0LjQutC+0LI6ICR7aGlkZGVuQ291bnR9YCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgRWRpdG9yU3RvcmFnZU1hbmFnZXIgfSBmcm9tICcuLi9tYW5hZ2Vycy9FZGl0b3JTdG9yYWdlTWFuYWdlcic7XG5pbXBvcnQgeyBMYXlvdXQgfSBmcm9tICcuLi9tb2RlbHMvTGF5b3V0JztcbmltcG9ydCB7IGdldExhc3RDaGlsZCB9IGZyb20gJy4uL3V0aWxzL3RpbGRhVXRpbHMnO1xuaW1wb3J0IHsgVHlwZWRFdmVudEVtaXR0ZXIgfSBmcm9tICcuLi91dGlscy9UeXBlZEV2ZW50RW1pdHRlcic7XG5pbXBvcnQgeyBnZW5lcmF0ZUltYWdlLCBjcmVhdGVQcm9kdWN0IH0gZnJvbSAnLi4vdXRpbHMvYXBpJztcbmNvbnN0IENPTlNUQU5UUyA9IHtcbiAgICBTVEFURV9FWFBJUkFUSU9OX0RBWVM6IDMwLFxuICAgIENBTlZBU19BUkVBX0hFSUdIVDogNjAwLFxuICAgIExPQURJTkdfSU5URVJWQUxfTVM6IDEwMCxcbn07XG5leHBvcnQgdmFyIEVkaXRvckV2ZW50VHlwZTtcbihmdW5jdGlvbiAoRWRpdG9yRXZlbnRUeXBlKSB7XG4gICAgRWRpdG9yRXZlbnRUeXBlW1wiTU9DS1VQX0xPQURJTkdcIl0gPSBcIm1vY2t1cC1sb2FkaW5nXCI7XG4gICAgRWRpdG9yRXZlbnRUeXBlW1wiTU9DS1VQX1VQREFURURcIl0gPSBcIm1vY2t1cC11cGRhdGVkXCI7XG4gICAgRWRpdG9yRXZlbnRUeXBlW1wiTE9BRElOR19USU1FX1VQREFURURcIl0gPSBcImxvYWRpbmctdGltZS11cGRhdGVkXCI7XG4gICAgRWRpdG9yRXZlbnRUeXBlW1wiU1RBVEVfQ0hBTkdFRFwiXSA9IFwic3RhdGUtY2hhbmdlZFwiO1xuICAgIEVkaXRvckV2ZW50VHlwZVtcIkxBWU9VVF9BRERFRFwiXSA9IFwibGF5b3V0LWFkZGVkXCI7XG4gICAgRWRpdG9yRXZlbnRUeXBlW1wiTEFZT1VUX1JFTU9WRURcIl0gPSBcImxheW91dC1yZW1vdmVkXCI7XG4gICAgRWRpdG9yRXZlbnRUeXBlW1wiTEFZT1VUX1VQREFURURcIl0gPSBcImxheW91dC11cGRhdGVkXCI7XG59KShFZGl0b3JFdmVudFR5cGUgfHwgKEVkaXRvckV2ZW50VHlwZSA9IHt9KSk7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFZGl0b3Ige1xuICAgIGdldCBzZWxlY3RUeXBlKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0VHlwZTsgfVxuICAgIGdldCBzZWxlY3RDb2xvcigpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdENvbG9yOyB9XG4gICAgZ2V0IHNlbGVjdFNpZGUoKSB7IHJldHVybiB0aGlzLl9zZWxlY3RTaWRlOyB9XG4gICAgZ2V0IHNlbGVjdFNpemUoKSB7IHJldHVybiB0aGlzLl9zZWxlY3RTaXplOyB9XG4gICAgZ2V0IHNlbGVjdExheW91dCgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdExheW91dDsgfVxuICAgIGNvbnN0cnVjdG9yKHsgYmxvY2tzLCBwcm9kdWN0Q29uZmlncywgZm9ybUNvbmZpZywgYXBpQ29uZmlnLCBvcHRpb25zIH0pIHtcbiAgICAgICAgdGhpcy5xdWFudGl0eUZvcm1CbG9jayA9IG51bGw7XG4gICAgICAgIHRoaXMuZm9ybUJsb2NrID0gbnVsbDtcbiAgICAgICAgdGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWUgPSBudWxsO1xuICAgICAgICB0aGlzLmZvcm1CdXR0b24gPSBudWxsO1xuICAgICAgICB0aGlzLl9zZWxlY3RMYXlvdXQgPSBudWxsO1xuICAgICAgICB0aGlzLmxheW91dHMgPSBbXTtcbiAgICAgICAgdGhpcy5jYW52YXNlcyA9IFtdO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzID0gW107XG4gICAgICAgIHRoaXMuYWN0aXZlQ2FudmFzID0gbnVsbDtcbiAgICAgICAgdGhpcy5ldmVudHMgPSBuZXcgVHlwZWRFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgdGhpcy5sYXllcnNIaXN0b3J5ID0gW107XG4gICAgICAgIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA9IC0xO1xuICAgICAgICB0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc0xvYWRpbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLmlzQWRkaW5nVG9DYXJ0ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNBZGRlZFRvQ2FydCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzR2VuZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxvYWRpbmdUaW1lID0gMDtcbiAgICAgICAgdGhpcy5sb2FkaW5nSW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICB0aGlzLnJlc2l6ZVRpbWVvdXQgPSBudWxsO1xuICAgICAgICB0aGlzLmNvbG9yQmxvY2tzID0gW107XG4gICAgICAgIHRoaXMuc2l6ZUJsb2NrcyA9IFtdO1xuICAgICAgICB0aGlzLnByb2R1Y3RCbG9ja3MgPSBbXTtcbiAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBudWxsO1xuICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZW1vdmVCYWNrZ3JvdW5kRW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmltYWdlQ2FjaGUgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMubG9hZGluZ0VsZW1lbnRzQ2FjaGUgPSB7fTtcbiAgICAgICAgdGhpcy5wcm9kdWN0Q2FjaGUgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMubW9ja3VwQ2FjaGUgPSBuZXcgTWFwKCk7XG4gICAgICAgIGlmICghcHJvZHVjdENvbmZpZ3MgfHwgcHJvZHVjdENvbmZpZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tFZGl0b3JdINCd0LUg0L/RgNC10LTQvtGB0YLQsNCy0LvQtdC90Ysg0LrQvtC90YTQuNCz0YPRgNCw0YbQuNC4INC/0YDQvtC00YPQutGC0L7QsicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RvcmFnZU1hbmFnZXIgPSBuZXcgRWRpdG9yU3RvcmFnZU1hbmFnZXIoKTtcbiAgICAgICAgdGhpcy5wcm9kdWN0Q29uZmlncyA9IHByb2R1Y3RDb25maWdzO1xuICAgICAgICB0aGlzLmFwaUNvbmZpZyA9IGFwaUNvbmZpZztcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jayA9IHRoaXMuZ2V0UmVxdWlyZWRFbGVtZW50KGJsb2Nrcy5lZGl0b3JCbG9ja0NsYXNzKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VTaWRlQnV0dG9uID0gdGhpcy5nZXRSZXF1aXJlZEVsZW1lbnQoYmxvY2tzLmNoYW5nZVNpZGVCdXR0b25DbGFzcyk7XG4gICAgICAgIHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jayA9IHRoaXMuZ2V0UmVxdWlyZWRFbGVtZW50KGJsb2Nrcy5lZGl0b3JIaXN0b3J5VW5kb0Jsb2NrQ2xhc3MpO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2sgPSB0aGlzLmdldFJlcXVpcmVkRWxlbWVudChibG9ja3MuZWRpdG9ySGlzdG9yeVJlZG9CbG9ja0NsYXNzKTtcbiAgICAgICAgdGhpcy5xdWFudGl0eUZvcm1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclF1YW50aXR5Rm9ybUJsb2NrQ2xhc3MpO1xuICAgICAgICBjb25zdCBwcm9kdWN0TGlzdEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MucHJvZHVjdExpc3RCbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKHByb2R1Y3RMaXN0QmxvY2spXG4gICAgICAgICAgICB0aGlzLnByb2R1Y3RMaXN0QmxvY2sgPSBwcm9kdWN0TGlzdEJsb2NrO1xuICAgICAgICBjb25zdCBwcm9kdWN0SXRlbUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MucHJvZHVjdEl0ZW1DbGFzcyk7XG4gICAgICAgIGlmIChwcm9kdWN0SXRlbUJsb2NrKVxuICAgICAgICAgICAgdGhpcy5wcm9kdWN0SXRlbUJsb2NrID0gcHJvZHVjdEl0ZW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yQ29sb3JzTGlzdEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yQ29sb3JzTGlzdEJsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yQ29sb3JzTGlzdEJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JDb2xvcnNMaXN0QmxvY2sgPSBlZGl0b3JDb2xvcnNMaXN0QmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvckNvbG9ySXRlbUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yQ29sb3JJdGVtQmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JDb2xvckl0ZW1CbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yQ29sb3JJdGVtQmxvY2sgPSBlZGl0b3JDb2xvckl0ZW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yU2l6ZXNMaXN0QmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JTaXplc0xpc3RCbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclNpemVzTGlzdEJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JTaXplc0xpc3RCbG9jayA9IGVkaXRvclNpemVzTGlzdEJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JTaXplSXRlbUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yU2l6ZUl0ZW1CbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclNpemVJdGVtQmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvclNpemVJdGVtQmxvY2sgPSBlZGl0b3JTaXplSXRlbUJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JMYXlvdXRzTGlzdEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yTGF5b3V0c0xpc3RCbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvckxheW91dHNMaXN0QmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2sgPSBlZGl0b3JMYXlvdXRzTGlzdEJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JMYXlvdXRJdGVtQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JMYXlvdXRJdGVtQmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9jayA9IGVkaXRvckxheW91dEl0ZW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbkNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclVwbG9hZEltYWdlQnV0dG9uKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbiA9IGVkaXRvclVwbG9hZEltYWdlQnV0dG9uO1xuICAgICAgICBjb25zdCBlZGl0b3JVcGxvYWRWaWV3QmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JVcGxvYWRWaWV3QmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvclVwbG9hZFZpZXdCbG9jayA9IGVkaXRvclVwbG9hZFZpZXdCbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRDYW5jZWxCdXR0b24gPSBlZGl0b3JVcGxvYWRDYW5jZWxCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvckxvYWRXaXRoQWlCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbiA9IGVkaXRvckxvYWRXaXRoQWlCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbiA9IGVkaXRvckxvYWRXaXRob3V0QWlCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b24gPSBibG9ja3MuZWRpdG9yUmVtb3ZlQmFja2dyb3VuZEJ1dHRvbkNsYXNzXG4gICAgICAgICAgICA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b25DbGFzcylcbiAgICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgaWYgKGVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b24pXG4gICAgICAgICAgICB0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b24gPSBlZGl0b3JSZW1vdmVCYWNrZ3JvdW5kQnV0dG9uO1xuICAgICAgICBjb25zdCBlZGl0b3JBZGRPcmRlckJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvckFkZE9yZGVyQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yQWRkT3JkZXJCdXR0b24pXG4gICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uID0gZWRpdG9yQWRkT3JkZXJCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvclN1bUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yU3VtQmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JTdW1CbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yU3VtQmxvY2sgPSBlZGl0b3JTdW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yUHJvZHVjdE5hbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JQcm9kdWN0TmFtZUNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclByb2R1Y3ROYW1lKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JQcm9kdWN0TmFtZSA9IGVkaXRvclByb2R1Y3ROYW1lO1xuICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja1ZpZXdDbGFzcyA9IGJsb2Nrcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tWaWV3Q2xhc3M7XG4gICAgICAgIHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrTmFtZUNsYXNzID0gYmxvY2tzLmVkaXRvckxheW91dEl0ZW1CbG9ja05hbWVDbGFzcztcbiAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tSZW1vdmVDbGFzcyA9IGJsb2Nrcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tSZW1vdmVDbGFzcztcbiAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tFZGl0Q2xhc3MgPSBibG9ja3MuZWRpdG9yTGF5b3V0SXRlbUJsb2NrRWRpdENsYXNzO1xuICAgICAgICBpZiAoZm9ybUNvbmZpZykge1xuICAgICAgICAgICAgdGhpcy5mb3JtQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGZvcm1Db25maWcuZm9ybUJsb2NrQ2xhc3MpO1xuICAgICAgICAgICAgdGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWUgPSBmb3JtQ29uZmlnLmZvcm1JbnB1dFZhcmlhYmxlTmFtZTtcbiAgICAgICAgICAgIHRoaXMuZm9ybUJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZm9ybUNvbmZpZy5mb3JtQnV0dG9uQ2xhc3MpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlZmF1bHRQcm9kdWN0ID0gcHJvZHVjdENvbmZpZ3NbMF07XG4gICAgICAgIGlmICghZGVmYXVsdFByb2R1Y3QpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW0VkaXRvcl0g0J3QtSDQvdCw0LnQtNC10L0g0LTQtdGE0L7Qu9GC0L3Ri9C5INC/0YDQvtC00YPQutGCJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGVmYXVsdE1vY2t1cCA9IGRlZmF1bHRQcm9kdWN0Lm1vY2t1cHNbMF07XG4gICAgICAgIGlmICghZGVmYXVsdE1vY2t1cCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbRWRpdG9yXSDQndC1INC90LDQudC00LXQvSDQtNC10YTQvtC70YLQvdGL0LkgbW9ja3VwJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc2VsZWN0Q29sb3IgPSBkZWZhdWx0TW9ja3VwLmNvbG9yO1xuICAgICAgICB0aGlzLl9zZWxlY3RTaWRlID0gZGVmYXVsdE1vY2t1cC5zaWRlO1xuICAgICAgICB0aGlzLl9zZWxlY3RUeXBlID0gZGVmYXVsdFByb2R1Y3QudHlwZTtcbiAgICAgICAgdGhpcy5fc2VsZWN0U2l6ZSA9IGRlZmF1bHRQcm9kdWN0LnNpemVzPy5bMF0gfHwgJ00nO1xuICAgICAgICB0aGlzLmVkaXRvckJsb2NrLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgdGhpcy5jcmVhdGVCYWNrZ3JvdW5kQmxvY2soKTtcbiAgICAgICAgdGhpcy5tb2NrdXBCbG9jayA9IHRoaXMuY3JlYXRlTW9ja3VwQmxvY2soKTtcbiAgICAgICAgdGhpcy5jYW52YXNlc0NvbnRhaW5lciA9IHRoaXMuY3JlYXRlQ2FudmFzZXNDb250YWluZXIoKTtcbiAgICAgICAgdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2sgPSB0aGlzLmNyZWF0ZUVkaXRvckxvYWRpbmdCbG9jaygpO1xuICAgICAgICB0aGlzLmluaXRFdmVudHMoKTtcbiAgICAgICAgdGhpcy5pbml0S2V5Ym9hcmRTaG9ydGN1dHMoKTtcbiAgICAgICAgdGhpcy5pbml0TG9hZGluZ0V2ZW50cygpO1xuICAgICAgICB0aGlzLmluaXRVSUNvbXBvbmVudHMoKTtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplRWRpdG9yKCk7XG4gICAgICAgIHdpbmRvdy5nZXRMYXlvdXRzID0gKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0cy5tYXAobGF5b3V0ID0+ICh7IC4uLmxheW91dCwgdXJsOiB1bmRlZmluZWQgfSkpO1xuICAgICAgICB9O1xuICAgICAgICB3aW5kb3cubG9hZExheW91dHMgPSAobGF5b3V0cykgPT4ge1xuICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gbGF5b3V0cy5tYXAobGF5b3V0ID0+IExheW91dC5mcm9tSlNPTihsYXlvdXQpKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICB9O1xuICAgICAgICB3aW5kb3cuZXhwb3J0UHJpbnQgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBleHBvcnRlZEFydCA9IGF3YWl0IHRoaXMuZXhwb3J0QXJ0KGZhbHNlLCA0MDk2KTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qgc2lkZSBvZiBPYmplY3Qua2V5cyhleHBvcnRlZEFydCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkb3dubG9hZExpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkb3dubG9hZExpbmspO1xuICAgICAgICAgICAgICAgIGRvd25sb2FkTGluay5ocmVmID0gZXhwb3J0ZWRBcnRbc2lkZV07XG4gICAgICAgICAgICAgICAgZG93bmxvYWRMaW5rLnRhcmdldCA9ICdfc2VsZic7XG4gICAgICAgICAgICAgICAgZG93bmxvYWRMaW5rLmRvd25sb2FkID0gYCR7c2lkZX0ucG5nYDtcbiAgICAgICAgICAgICAgICBkb3dubG9hZExpbmsuY2xpY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBleHBvcnRlZEFydDtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaW5pdFVJQ29tcG9uZW50cygpIHtcbiAgICAgICAgaWYgKHRoaXMuY2hhbmdlU2lkZUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5jaGFuZ2VTaWRlQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlU2lkZUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gdGhpcy5jaGFuZ2VTaWRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jaykge1xuICAgICAgICAgICAgdGhpcy5pbml0SGlzdG9yeVVuZG9CbG9jaygpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEhpc3RvcnlSZWRvQmxvY2soKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wcm9kdWN0TGlzdEJsb2NrICYmIHRoaXMucHJvZHVjdEl0ZW1CbG9jaykge1xuICAgICAgICAgICAgdGhpcy5pbml0UHJvZHVjdExpc3QoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5pbml0QWRkT3JkZXJCdXR0b24oKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5pbml0VXBsb2FkSW1hZ2VCdXR0b24oKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5mb3JtQmxvY2sgJiYgdGhpcy5mb3JtQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRGb3JtKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucXVhbnRpdHlGb3JtQmxvY2spIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5pbml0Rml4UXVhbnRpdHlGb3JtKCksIDUwMCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jaykge1xuICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRDYW5jZWxCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRDYW5jZWxCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkIGltYWdlIGJ1dHRvbl0gY2FuY2VsIGJ1dHRvbiBjbGlja2VkJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldFVzZXJVcGxvYWRJbWFnZSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRSZXF1aXJlZEVsZW1lbnQoc2VsZWN0b3IpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgW0VkaXRvcl0g0J3QtSDQvdCw0LnQtNC10L0g0L7QsdGP0LfQsNGC0LXQu9GM0L3Ri9C5INGN0LvQtdC80LXQvdGCOiAke3NlbGVjdG9yfWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbiAgICBhc3luYyBpbml0aWFsaXplRWRpdG9yKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZFN0YXRlKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnByZWxvYWRBbGxNb2NrdXBzKCk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZWRpdG9yXSDQmNC90LjRhtC40LDQu9C40LfQsNGG0LjRjyDQt9Cw0LLQtdGA0YjQtdC90LAnKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tlZGl0b3JdINCe0YjQuNCx0LrQsCDQuNC90LjRhtC40LDQu9C40LfQsNGG0LjQuDonLCBlcnJvcik7XG4gICAgICAgICAgICB0aGlzLmluaXRpYWxpemVXaXRoRGVmYXVsdHMoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBpbml0aWFsaXplV2l0aERlZmF1bHRzKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZWRpdG9yXSDQmNC90LjRhtC40LDQu9C40LfQsNGG0LjRjyDRgSDQtNC10YTQvtC70YLQvdGL0LzQuCDQt9C90LDRh9C10L3QuNGP0LzQuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbZWRpdG9yXSDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCBtb2NrdXAg0L/QviDRg9C80L7Qu9GH0LDQvdC40Y46JywgZXJyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0RXZlbnRzKCkge1xuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucz8uZGlzYWJsZUJlZm9yZVVubG9hZFdhcm5pbmcpIHtcbiAgICAgICAgICAgIHdpbmRvdy5vbmJlZm9yZXVubG9hZCA9IChlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGF5b3V0cy5sZW5ndGggPiAwICYmICF0aGlzLmlzQWRkZWRUb0NhcnQgJiYgdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9ICfQlNC40LfQsNC50L0g0YDQtdC00LDQutGC0L7RgNCwINC80L7QttC10YIg0LHRi9GC0Ywg0L/QvtGC0LXRgNGP0L0uINCS0Ysg0YPQstC10YDQtdC90YssINGH0YLQviDRhdC+0YLQuNGC0LUg0L/QvtC60LjQvdGD0YLRjCDRgdGC0YDQsNC90LjRhtGDPyc7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgZS5yZXR1cm5WYWx1ZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtZXNzYWdlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVSZXNpemUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZXZlbnRzLm9uKEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfVVBEQVRFRCwgKGRhdGFVUkwpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW9ja3VwQmxvY2suc3JjID0gZGF0YVVSTDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGhhbmRsZVJlc2l6ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMucmVzaXplVGltZW91dCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMucmVzaXplVGltZW91dCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZXNpemVUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbY2FudmFzXSDQmNC30LzQtdC90LXQvdC40LUg0YDQsNC30LzQtdGA0LAg0L7QutC90LAsINC/0LXRgNC10YHRh9C10YIgY2FudmFzJyk7XG4gICAgICAgICAgICB0aGlzLnJlc2l6ZUFsbENhbnZhc2VzKCk7XG4gICAgICAgIH0sIDE1MCk7XG4gICAgfVxuICAgIGFzeW5jIHJlc2l6ZUFsbENhbnZhc2VzKCkge1xuICAgICAgICBbLi4udGhpcy5jYW52YXNlcywgLi4udGhpcy5sYXllcnNDYW52YXNlc10uZm9yRWFjaChjYW52YXMgPT4ge1xuICAgICAgICAgICAgaWYgKGNhbnZhcykge1xuICAgICAgICAgICAgICAgIGNhbnZhcy5zZXREaW1lbnNpb25zKHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY2FudmFzZXMuZm9yRWFjaChjYW52YXMgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVQcmludEFyZWFGb3JDYW52YXMoY2FudmFzKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZUNhbnZhcyAmJiB0aGlzLl9zZWxlY3RTaWRlKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlZHJhd0FsbExheWVyc0ZvclNpZGUodGhpcy5fc2VsZWN0U2lkZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb3RoZXJTaWRlID0gdGhpcy5fc2VsZWN0U2lkZSA9PT0gJ2Zyb250JyA/ICdiYWNrJyA6ICdmcm9udCc7XG4gICAgICAgIGF3YWl0IHRoaXMucmVkcmF3QWxsTGF5ZXJzRm9yU2lkZShvdGhlclNpZGUpO1xuICAgIH1cbiAgICBnZXRQcmludENvbmZpZ0ZvclNpZGUoc2lkZSkge1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5wcm9kdWN0Q29uZmlncy5maW5kKHAgPT4gcC50eXBlID09PSB0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0KVxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIHByb2R1Y3QucHJpbnRDb25maWcuZmluZCgoY29uZmlnKSA9PiBjb25maWcuc2lkZSA9PT0gc2lkZSk7XG4gICAgfVxuICAgIHVwZGF0ZVByaW50QXJlYUZvckNhbnZhcyhjYW52YXMpIHtcbiAgICAgICAgaWYgKCFjYW52YXMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHNpZGUgPSBjYW52YXMuc2lkZTtcbiAgICAgICAgaWYgKCFzaWRlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBwcmludENvbmZpZyA9IHRoaXMuZ2V0UHJpbnRDb25maWdGb3JTaWRlKHNpZGUpO1xuICAgICAgICBpZiAoIXByaW50Q29uZmlnKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB3aWR0aCA9IHByaW50Q29uZmlnLnNpemUud2lkdGggLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBwcmludENvbmZpZy5zaXplLmhlaWdodCAvIDYwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0O1xuICAgICAgICBjb25zdCBsZWZ0ID0gKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGggLSB3aWR0aCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnggLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoKTtcbiAgICAgICAgY29uc3QgdG9wID0gKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0IC0gaGVpZ2h0KSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueSAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgY29uc3QgY2xpcEFyZWEgPSBjYW52YXMuY2xpcFBhdGg7XG4gICAgICAgIGlmIChjbGlwQXJlYSkge1xuICAgICAgICAgICAgY2xpcEFyZWEuc2V0KHtcbiAgICAgICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQsXG4gICAgICAgICAgICAgICAgbGVmdCxcbiAgICAgICAgICAgICAgICB0b3BcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9iamVjdHMgPSBjYW52YXMuZ2V0T2JqZWN0cygpO1xuICAgICAgICBjb25zdCBhcmVhQm9yZGVyID0gb2JqZWN0cy5maW5kKG9iaiA9PiBvYmoubmFtZSA9PT0gJ2FyZWE6Ym9yZGVyJyk7XG4gICAgICAgIGlmIChhcmVhQm9yZGVyKSB7XG4gICAgICAgICAgICBhcmVhQm9yZGVyLnNldCh7XG4gICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoIC0gMyxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCAtIDMsXG4gICAgICAgICAgICAgICAgbGVmdCxcbiAgICAgICAgICAgICAgICB0b3BcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhbnZhcy5yZW5kZXJBbGwoKTtcbiAgICB9XG4gICAgYXN5bmMgcmVkcmF3QWxsTGF5ZXJzRm9yU2lkZShzaWRlKSB7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IHRoaXMuY2FudmFzZXMuZmluZChjID0+IGMuc2lkZSA9PT0gc2lkZSk7XG4gICAgICAgIGlmICghY2FudmFzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBvYmplY3RzID0gY2FudmFzLmdldE9iamVjdHMoKTtcbiAgICAgICAgY29uc3QgbGF5b3V0T2JqZWN0cyA9IG9iamVjdHMuZmlsdGVyKG9iaiA9PiBvYmoubmFtZSAmJiAhb2JqLm5hbWUuc3RhcnRzV2l0aCgnYXJlYTonKSk7XG4gICAgICAgIGxheW91dE9iamVjdHMuZm9yRWFjaChvYmogPT4gY2FudmFzLnJlbW92ZShvYmopKTtcbiAgICAgICAgY29uc3QgbGF5ZXJzRm9yU2lkZSA9IHRoaXMubGF5b3V0cy5maWx0ZXIobGF5b3V0ID0+IGxheW91dC52aWV3ID09PSBzaWRlKTtcbiAgICAgICAgZm9yIChjb25zdCBsYXlvdXQgb2YgbGF5ZXJzRm9yU2lkZSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5hZGRMYXlvdXRUb0NhbnZhcyhsYXlvdXQpO1xuICAgICAgICB9XG4gICAgICAgIGNhbnZhcy5yZW5kZXJBbGwoKTtcbiAgICB9XG4gICAgaW5pdExvYWRpbmdFdmVudHMoKSB7XG4gICAgICAgIHRoaXMubG9hZGluZ0VsZW1lbnRzQ2FjaGUubG9hZGluZ1RleHQgPSB0aGlzLmVkaXRvckxvYWRpbmdCbG9jay5xdWVyeVNlbGVjdG9yKCcjbG9hZGluZy10ZXh0Jyk7XG4gICAgICAgIHRoaXMubG9hZGluZ0VsZW1lbnRzQ2FjaGUuc3Bpbm5lciA9IHRoaXMuZWRpdG9yTG9hZGluZ0Jsb2NrLnF1ZXJ5U2VsZWN0b3IoJyNzcGlubmVyJyk7XG4gICAgICAgIHRoaXMuZXZlbnRzLm9uKEVkaXRvckV2ZW50VHlwZS5MT0FESU5HX1RJTUVfVVBEQVRFRCwgKGxvYWRpbmdUaW1lKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB7IGxvYWRpbmdUZXh0LCBzcGlubmVyIH0gPSB0aGlzLmxvYWRpbmdFbGVtZW50c0NhY2hlO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNMb2FkaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9hZGluZ1RpbWUgPiA1KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nVGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRpbmdUZXh0LmlubmVyVGV4dCA9IGAkeyh0aGlzLmxvYWRpbmdUaW1lIC8gMTApLnRvRml4ZWQoMSl9YDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc3Bpbm5lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZGluZ0Jsb2NrLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjc0NSlcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nVGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc3Bpbm5lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDApXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmV2ZW50cy5vbihFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIChpc0xvYWRpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHsgbG9hZGluZ1RleHQsIHNwaW5uZXIgfSA9IHRoaXMubG9hZGluZ0VsZW1lbnRzQ2FjaGU7XG4gICAgICAgICAgICBpZiAoaXNMb2FkaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9hZGluZ0ludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5sb2FkaW5nSW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmdUaW1lID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLmlzTG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW21vY2t1cF0gbG9hZGluZyBtb2NrdXAnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmdJbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nVGltZSsrO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLkxPQURJTkdfVElNRV9VUERBVEVELCB0aGlzLmxvYWRpbmdUaW1lKTtcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDApXCI7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHNwaW5uZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9hZGluZ0ludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5sb2FkaW5nSW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmdJbnRlcnZhbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZ1RpbWUgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZW1pdCh0eXBlLCBkZXRhaWwpIHtcbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdCh0eXBlLCBkZXRhaWwpO1xuICAgIH1cbiAgICBpbml0S2V5Ym9hcmRTaG9ydGN1dHMoKSB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUVsZW1lbnQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgICAgICAgICAgY29uc3QgaXNJbnB1dEZpZWxkID0gYWN0aXZlRWxlbWVudCAmJiAoYWN0aXZlRWxlbWVudC50YWdOYW1lID09PSAnSU5QVVQnIHx8XG4gICAgICAgICAgICAgICAgYWN0aXZlRWxlbWVudC50YWdOYW1lID09PSAnVEVYVEFSRUEnIHx8XG4gICAgICAgICAgICAgICAgYWN0aXZlRWxlbWVudC5jb250ZW50RWRpdGFibGUgPT09ICd0cnVlJyB8fFxuICAgICAgICAgICAgICAgIGFjdGl2ZUVsZW1lbnQuaXNDb250ZW50RWRpdGFibGUpO1xuICAgICAgICAgICAgaWYgKGlzSW5wdXRGaWVsZClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBpZiAoZXZlbnQuY3RybEtleSAmJiBldmVudC5jb2RlID09PSAnS2V5WicgJiYgIWV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVuZG8oKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoKGV2ZW50LmN0cmxLZXkgJiYgZXZlbnQuc2hpZnRLZXkgJiYgZXZlbnQuY29kZSA9PT0gJ0tleVonKSB8fFxuICAgICAgICAgICAgICAgIChldmVudC5jdHJsS2V5ICYmIGV2ZW50LmNvZGUgPT09ICdLZXlZJyAmJiAhZXZlbnQuc2hpZnRLZXkpKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZG8oKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjcmVhdGVCYWNrZ3JvdW5kQmxvY2soKSB7XG4gICAgICAgIGNvbnN0IGJhY2tncm91bmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgYmFja2dyb3VuZC5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItcG9zaXRpb24nKTtcbiAgICAgICAgYmFja2dyb3VuZC5pZCA9ICdlZGl0b3ItYmFja2dyb3VuZCc7XG4gICAgICAgIHRoaXMuZWRpdG9yQmxvY2suYXBwZW5kQ2hpbGQoYmFja2dyb3VuZCk7XG4gICAgICAgIHJldHVybiBiYWNrZ3JvdW5kO1xuICAgIH1cbiAgICBjcmVhdGVNb2NrdXBCbG9jaygpIHtcbiAgICAgICAgY29uc3QgbW9ja3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgICAgIG1vY2t1cC5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItcG9zaXRpb24nKTtcbiAgICAgICAgbW9ja3VwLmlkID0gJ2VkaXRvci1tb2NrdXAnO1xuICAgICAgICB0aGlzLmVkaXRvckJsb2NrLmFwcGVuZENoaWxkKG1vY2t1cCk7XG4gICAgICAgIHJldHVybiBtb2NrdXA7XG4gICAgfVxuICAgIGNyZWF0ZUNhbnZhc2VzQ29udGFpbmVyKCkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgY2FudmFzLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1wb3NpdGlvbicpO1xuICAgICAgICBjYW52YXMuaWQgPSAnZWRpdG9yLWNhbnZhc2VzLWNvbnRhaW5lcic7XG4gICAgICAgIGNhbnZhcy5zdHlsZS56SW5kZXggPSAnMTAnO1xuICAgICAgICBjYW52YXMuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jay5hcHBlbmRDaGlsZChjYW52YXMpO1xuICAgICAgICByZXR1cm4gY2FudmFzO1xuICAgIH1cbiAgICBjcmVhdGVFZGl0b3JMb2FkaW5nQmxvY2soKSB7XG4gICAgICAgIGNvbnN0IGVkaXRvckxvYWRpbmdCbG9jayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBlZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xuICAgICAgICBlZGl0b3JMb2FkaW5nQmxvY2suY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXBvc2l0aW9uJyk7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5pZCA9ICdlZGl0b3ItbG9hZGluZyc7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5zdHlsZS56SW5kZXggPSBcIjEwMDBcIjtcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcIm5vbmVcIjtcbiAgICAgICAgY29uc3QgbG9hZGluZ1RleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgbG9hZGluZ1RleHQuaWQgPSAnbG9hZGluZy10ZXh0JztcbiAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS50ZXh0QWxpZ24gPSBcImNlbnRlclwiO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUudG9wID0gXCI1MCVcIjtcbiAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUubGVmdCA9IFwiNTAlXCI7XG4gICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKC01MCUsIC01MCUpXCI7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5hcHBlbmRDaGlsZChsb2FkaW5nVGV4dCk7XG4gICAgICAgIGNvbnN0IHNwaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgc3Bpbm5lci5pZCA9ICdzcGlubmVyJztcbiAgICAgICAgc3Bpbm5lci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5hcHBlbmRDaGlsZChzcGlubmVyKTtcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jay5hcHBlbmRDaGlsZChlZGl0b3JMb2FkaW5nQmxvY2spO1xuICAgICAgICByZXR1cm4gZWRpdG9yTG9hZGluZ0Jsb2NrO1xuICAgIH1cbiAgICBhc3luYyB1cGRhdGVNb2NrdXAoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFttb2NrdXBdIHVwZGF0ZSBmb3IgJHt0aGlzLl9zZWxlY3RUeXBlfSAke3RoaXMuX3NlbGVjdFNpZGV9ICR7dGhpcy5fc2VsZWN0Q29sb3IubmFtZX1gKTtcbiAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgdHJ1ZSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBtb2NrdXBJbWFnZVVybCA9IHRoaXMuZmluZE1vY2t1cFVybCgpO1xuICAgICAgICAgICAgaWYgKCFtb2NrdXBJbWFnZVVybCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW21vY2t1cF0g0J3QtSDQvdCw0LnQtNC10L0gbW9ja3VwINC00LvRjyDRgtC10LrRg9GJ0LjRhSDQv9Cw0YDQsNC80LXRgtGA0L7QsicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZGF0YVVSTCA9IGF3YWl0IHRoaXMubG9hZEFuZENvbnZlcnRJbWFnZShtb2NrdXBJbWFnZVVybCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9VUERBVEVELCBkYXRhVVJMKTtcbiAgICAgICAgICAgIHRoaXMubW9ja3VwQmxvY2suc3JjID0gZGF0YVVSTDtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1ttb2NrdXBdIE1vY2t1cCDRg9GB0L/QtdGI0L3QviDQvtCx0L3QvtCy0LvQtdC9Jyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbbW9ja3VwXSDQntGI0LjQsdC60LAg0L7QsdC90L7QstC70LXQvdC40Y8gbW9ja3VwOicsIGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgZmFsc2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZpbmRNb2NrdXBVcmwoKSB7XG4gICAgICAgIGNvbnN0IGNhY2hlS2V5ID0gYCR7dGhpcy5fc2VsZWN0VHlwZX0tJHt0aGlzLl9zZWxlY3RTaWRlfS0ke3RoaXMuX3NlbGVjdENvbG9yLm5hbWV9YDtcbiAgICAgICAgaWYgKHRoaXMubW9ja3VwQ2FjaGUuaGFzKGNhY2hlS2V5KSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubW9ja3VwQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpIHtcbiAgICAgICAgICAgIHRoaXMubW9ja3VwQ2FjaGUuc2V0KGNhY2hlS2V5LCBudWxsKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1vY2t1cCA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG0gPT4gbS5zaWRlID09PSB0aGlzLl9zZWxlY3RTaWRlICYmIG0uY29sb3IubmFtZSA9PT0gdGhpcy5fc2VsZWN0Q29sb3IubmFtZSk7XG4gICAgICAgIGNvbnN0IHVybCA9IG1vY2t1cD8udXJsIHx8IG51bGw7XG4gICAgICAgIHRoaXMubW9ja3VwQ2FjaGUuc2V0KGNhY2hlS2V5LCB1cmwpO1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cbiAgICBnZXRQcm9kdWN0QnlUeXBlKHR5cGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLnByb2R1Y3RDYWNoZS5oYXModHlwZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLnByb2R1Y3RDb25maWdzLmZpbmQocCA9PiBwLnR5cGUgPT09IHR5cGUpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByb2R1Y3RDYWNoZS5zZXQodHlwZSwgcHJvZHVjdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucHJvZHVjdENhY2hlLmdldCh0eXBlKTtcbiAgICB9XG4gICAgY2xlYXJNb2NrdXBDYWNoZSgpIHtcbiAgICAgICAgdGhpcy5tb2NrdXBDYWNoZS5jbGVhcigpO1xuICAgIH1cbiAgICBhc3luYyBsb2FkQW5kQ29udmVydEltYWdlKGltYWdlVXJsKSB7XG4gICAgICAgIGlmICh0aGlzLmltYWdlQ2FjaGUuaGFzKGltYWdlVXJsKSkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2NhY2hlXSDQmNC30L7QsdGA0LDQttC10L3QuNC1INC30LDQs9GA0YPQttC10L3QviDQuNC3INC60Y3RiNCwOicsIGltYWdlVXJsKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmltYWdlQ2FjaGUuZ2V0KGltYWdlVXJsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIGltYWdlLnNldEF0dHJpYnV0ZSgnY3Jvc3NPcmlnaW4nLCAnYW5vbnltb3VzJyk7XG4gICAgICAgICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IGltYWdlLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ9Cd0LUg0YPQtNCw0LvQvtGB0Ywg0L/QvtC70YPRh9C40YLRjCDQutC+0L3RgtC10LrRgdGCIGNhbnZhcycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKGltYWdlLCAwLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YVVSTCA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmltYWdlQ2FjaGUuc2V0KGltYWdlVXJsLCBkYXRhVVJMKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2NhY2hlXSDQmNC30L7QsdGA0LDQttC10L3QuNC1INGB0L7RhdGA0LDQvdC10L3QviDQsiDQutGN0Yg6JywgaW1hZ2VVcmwpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGFVUkwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1hZ2Uub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCDQuNC30L7QsdGA0LDQttC10L3QuNGPOiAke2ltYWdlVXJsfWApKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbWFnZS5zcmMgPSBpbWFnZVVybDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIHNhdmVTdGF0ZSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3N0YXRlXSDQodC+0YXRgNCw0L3QtdC90LjQtSDRgdC+0YHRgtC+0Y/QvdC40Y8g0YDQtdC00LDQutGC0L7RgNCwJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3JTdGF0ZSA9IHtcbiAgICAgICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgdHlwZTogdGhpcy5fc2VsZWN0VHlwZSxcbiAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IubmFtZSxcbiAgICAgICAgICAgICAgICBzaWRlOiB0aGlzLl9zZWxlY3RTaWRlLFxuICAgICAgICAgICAgICAgIHNpemU6IHRoaXMuX3NlbGVjdFNpemVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbc3RhdGVdINCh0L7RhdGA0LDQvdGP0LXQvDogdHlwZT0ke2VkaXRvclN0YXRlLnR5cGV9LCBjb2xvcj0ke2VkaXRvclN0YXRlLmNvbG9yfSwgc2lkZT0ke2VkaXRvclN0YXRlLnNpZGV9LCBzaXplPSR7ZWRpdG9yU3RhdGUuc2l6ZX1gKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RvcmFnZU1hbmFnZXIuc2F2ZUVkaXRvclN0YXRlKGVkaXRvclN0YXRlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tzdGF0ZV0g0KHQvtGB0YLQvtGP0L3QuNC1INGD0YHQv9C10YjQvdC+INGB0L7RhdGA0LDQvdC10L3QvicpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y8g0YHQvtGB0YLQvtGP0L3QuNGPOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBzYXZlTGF5b3V0cygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2xheWVyc10g0KHQvtGF0YDQsNC90LXQvdC40LUg0YHQu9C+0ZHQsicpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci5zYXZlTGF5ZXJzKHRoaXMubGF5b3V0cyk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbbGF5ZXJzXSDQodC70L7QuCDRg9GB0L/QtdGI0L3QviDRgdC+0YXRgNCw0L3QtdC90YsnKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBsb2FkTGF5b3V0cygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2xheWVyc10g0JfQsNCz0YDRg9C30LrQsCDRgdC70L7RkdCyJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzYXZlZExheW91dHMgPSBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLmxvYWRMYXllcnMoKTtcbiAgICAgICAgICAgIGlmIChzYXZlZExheW91dHMgJiYgQXJyYXkuaXNBcnJheShzYXZlZExheW91dHMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gc2F2ZWRMYXlvdXRzLm1hcCgobGF5b3V0RGF0YSkgPT4gbmV3IExheW91dChsYXlvdXREYXRhKSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2xheWVyc10g0JfQsNCz0YDRg9C20LXQvdC+ICR7dGhpcy5sYXlvdXRzLmxlbmd0aH0g0YHQu9C+0ZHQsmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gW107XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2xheWVyc10g0J3QtdGCINGB0L7RhdGA0LDQvdGR0L3QvdGL0YUg0YHQu9C+0ZHQsicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbbGF5ZXJzXSDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCDRgdC70L7RkdCyOicsIGVycm9yKTtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0cyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgbG9hZFN0YXRlKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbc3RhdGVdINCX0LDQs9GA0YPQt9C60LAg0YHQvtGB0YLQvtGP0L3QuNGPINGA0LXQtNCw0LrRgtC+0YDQsCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yU3RhdGUgPSBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLmxvYWRFZGl0b3JTdGF0ZSgpO1xuICAgICAgICAgICAgaWYgKCFlZGl0b3JTdGF0ZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tzdGF0ZV0g0KHQvtGF0YDQsNC90LXQvdC90L7QtSDRgdC+0YHRgtC+0Y/QvdC40LUg0L3QtSDQvdCw0LnQtNC10L3QvicpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkUHJvZHVjdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdENvbG9yc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRTaXplc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5pc1N0YXRlRXhwaXJlZChlZGl0b3JTdGF0ZS5kYXRlKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW3N0YXRlXSDQodC+0YHRgtC+0Y/QvdC40LUg0YPRgdGC0LDRgNC10LvQviwg0L7Rh9C40YnQsNC10LwnKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLmNsZWFyRWRpdG9yU3RhdGUoKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRDb2xvcnNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0U2l6ZXNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYXBwbGllZCA9IGF3YWl0IHRoaXMuYXBwbHlTdGF0ZShlZGl0b3JTdGF0ZSk7XG4gICAgICAgICAgICBpZiAoYXBwbGllZCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tzdGF0ZV0g0KHQvtGB0YLQvtGP0L3QuNC1INGD0YHQv9C10YjQvdC+INC30LDQs9GA0YPQttC10L3QvicpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkUHJvZHVjdCgpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb2R1Y3RCbG9ja3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2R1Y3RCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBibG9jay5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYigyMjIgMjIyIDIyMiknO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLnByb2R1Y3RCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fcHJvZHVjdC1ibG9ja19fJyArIHRoaXMuX3NlbGVjdFR5cGUpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmVCbG9jay5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdENvbG9yc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRTaXplc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW3N0YXRlXSDQndC1INGD0LTQsNC70L7RgdGMINC/0YDQuNC80LXQvdC40YLRjCDRgdC+0YXRgNCw0L3QtdC90L3QvtC1INGB0L7RgdGC0L7Rj9C90LjQtScpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkUHJvZHVjdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdENvbG9yc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRTaXplc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINC30LDQs9GA0YPQt9C60Lgg0YHQvtGB0YLQvtGP0L3QuNGPOicsIGVycm9yKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgICAgICB0aGlzLmxvYWRQcm9kdWN0KCk7XG4gICAgICAgICAgICB0aGlzLmluaXRDb2xvcnNMaXN0KCk7XG4gICAgICAgICAgICB0aGlzLmluaXRTaXplc0xpc3QoKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpc1N0YXRlRXhwaXJlZChkYXRlU3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHN0YXRlRGF0ZSA9IG5ldyBEYXRlKGRhdGVTdHJpbmcpO1xuICAgICAgICBjb25zdCBleHBpcmF0aW9uRGF0ZSA9IERhdGUubm93KCkgLSAoQ09OU1RBTlRTLlNUQVRFX0VYUElSQVRJT05fREFZUyAqIDI0ICogNjAgKiA2MCAqIDEwMDApO1xuICAgICAgICByZXR1cm4gc3RhdGVEYXRlLmdldFRpbWUoKSA8IGV4cGlyYXRpb25EYXRlO1xuICAgIH1cbiAgICBhc3luYyBhcHBseVN0YXRlKGVkaXRvclN0YXRlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoIWVkaXRvclN0YXRlLnR5cGUgfHwgIWVkaXRvclN0YXRlLmNvbG9yIHx8ICFlZGl0b3JTdGF0ZS5zaWRlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbc3RhdGVdINCd0LXQutC+0YDRgNC10LrRgtC90L7QtSDRgdC+0YHRgtC+0Y/QvdC40LU6INC+0YLRgdGD0YLRgdGC0LLRg9GO0YIg0L7QsdGP0LfQsNGC0LXQu9GM0L3Ri9C1INC/0L7Qu9GPJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3N0YXRlXSDQktC+0YHRgdGC0LDQvdC+0LLQu9C10L3QuNC1INGB0L7RgdGC0L7Rj9C90LjRjzogdHlwZT0ke2VkaXRvclN0YXRlLnR5cGV9LCBjb2xvcj0ke2VkaXRvclN0YXRlLmNvbG9yfSwgc2lkZT0ke2VkaXRvclN0YXRlLnNpZGV9LCBzaXplPSR7ZWRpdG9yU3RhdGUuc2l6ZX1gKTtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLnByb2R1Y3RDb25maWdzLmZpbmQocCA9PiBwLnR5cGUgPT09IGVkaXRvclN0YXRlLnR5cGUpO1xuICAgICAgICAgICAgaWYgKCFwcm9kdWN0KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbc3RhdGVdINCf0YDQvtC00YPQutGCINGC0LjQv9CwICR7ZWRpdG9yU3RhdGUudHlwZX0g0L3QtSDQvdCw0LnQtNC10L1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBtb2NrdXAgPSBwcm9kdWN0Lm1vY2t1cHMuZmluZChtID0+IG0uY29sb3IubmFtZSA9PT0gZWRpdG9yU3RhdGUuY29sb3IpO1xuICAgICAgICAgICAgaWYgKCFtb2NrdXApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtzdGF0ZV0gTW9ja3VwINGBINGG0LLQtdGC0L7QvCAke2VkaXRvclN0YXRlLmNvbG9yfSDQvdC1INC90LDQudC00LXQvSDQtNC70Y8g0L/RgNC+0LTRg9C60YLQsCAke2VkaXRvclN0YXRlLnR5cGV9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fc2VsZWN0VHlwZSA9IGVkaXRvclN0YXRlLnR5cGU7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RDb2xvciA9IG1vY2t1cC5jb2xvcjtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdFNpZGUgPSBlZGl0b3JTdGF0ZS5zaWRlO1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0U2l6ZSA9IGVkaXRvclN0YXRlLnNpemUgfHwgdGhpcy5fc2VsZWN0U2l6ZTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtzdGF0ZV0g0KHQvtGB0YLQvtGP0L3QuNC1INC/0YDQuNC80LXQvdC10L3QvjogdHlwZT0ke3RoaXMuX3NlbGVjdFR5cGV9LCBjb2xvcj0ke3RoaXMuX3NlbGVjdENvbG9yLm5hbWV9LCBzaWRlPSR7dGhpcy5fc2VsZWN0U2lkZX0sIHNpemU9JHt0aGlzLl9zZWxlY3RTaXplfWApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbc3RhdGVdINCe0YjQuNCx0LrQsCDQv9GA0LjQvNC10L3QtdC90LjRjyDRgdC+0YHRgtC+0Y/QvdC40Y86JywgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldFR5cGUodHlwZSkge1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0VHlwZSAhPT0gdHlwZSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0VHlwZSA9IHR5cGU7XG4gICAgICAgICAgICB0aGlzLmNsZWFyTW9ja3VwQ2FjaGUoKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuU1RBVEVfQ0hBTkdFRCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPOicsIGVycikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldENvbG9yKGNvbG9yKSB7XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RDb2xvciAhPT0gY29sb3IpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gY29sb3I7XG4gICAgICAgICAgICB0aGlzLmNsZWFyTW9ja3VwQ2FjaGUoKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuU1RBVEVfQ0hBTkdFRCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPOicsIGVycikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldFNpZGUoc2lkZSkge1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0U2lkZSAhPT0gc2lkZSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0U2lkZSA9IHNpZGU7XG4gICAgICAgICAgICB0aGlzLmNsZWFyTW9ja3VwQ2FjaGUoKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuU1RBVEVfQ0hBTkdFRCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPOicsIGVycikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldFNpemUoc2l6ZSkge1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0U2l6ZSAhPT0gc2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0U2l6ZSA9IHNpemU7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLlNUQVRFX0NIQU5HRUQsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbc3RhdGVdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjzonLCBlcnIpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhZGRMYXlvdXQobGF5b3V0KSB7XG4gICAgICAgIGlmICh0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkpIHtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0cy5wdXNoKGxheW91dCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxheW91dHMucHVzaChsYXlvdXQpO1xuICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5MQVlPVVRfQURERUQsIGxheW91dCk7XG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgIHRoaXMuc2F2ZUxheW91dHMoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW2xheWVyc10g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPINGB0LvQvtGR0LI6JywgZXJyKSk7XG4gICAgfVxuICAgIHJlbW92ZUxheW91dChsYXlvdXRJZCkge1xuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMubGF5b3V0cy5maW5kSW5kZXgobCA9PiBsLmlkID09PSBsYXlvdXRJZCk7XG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0c1tpbmRleF07XG4gICAgICAgICAgICBpZiAobGF5b3V0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXlvdXRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTEFZT1VUX1JFTU9WRUQsIGxheW91dElkKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNhdmVMYXlvdXRzKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycikpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdXBkYXRlTGF5b3V0KGxheW91dElkLCB1cGRhdGVzKSB7XG4gICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0cy5maW5kKGwgPT4gbC5pZCA9PT0gbGF5b3V0SWQpO1xuICAgICAgICBpZiAobGF5b3V0KSB7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGxheW91dCwgdXBkYXRlcyk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSkge1xuICAgICAgICAgICAgICAgIGlmICgndXJsJyBpbiB1cGRhdGVzIHx8ICduYW1lJyBpbiB1cGRhdGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2F2ZUxheWVyc1RvSGlzdG9yeSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTEFZT1VUX1VQREFURUQsIGxheW91dCk7XG4gICAgICAgICAgICB0aGlzLnNhdmVMYXlvdXRzKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycikpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBnZXRMYXlvdXQobGF5b3V0SWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0cy5maW5kKGwgPT4gbC5pZCA9PT0gbGF5b3V0SWQpO1xuICAgIH1cbiAgICBnZXRMYXlvdXRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXRzO1xuICAgIH1cbiAgICBpbml0SGlzdG9yeVVuZG9CbG9jaygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnkgYmxvY2tdIGluaXQgdW5kbycpO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2sub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5IHVuZG8gYmxvY2tdIGNsaWNrZWQnKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudW5kbygpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKTtcbiAgICB9XG4gICAgaW5pdEhpc3RvcnlSZWRvQmxvY2soKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5IHJlZG8gYmxvY2tdIGluaXQgcmVkbycpO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2sub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5IHJlZG8gYmxvY2tdIGNsaWNrZWQnKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucmVkbygpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKTtcbiAgICB9XG4gICAgaW5pdFByb2R1Y3RMaXN0KCkge1xuICAgICAgICBpZiAoIXRoaXMucHJvZHVjdExpc3RCbG9jayB8fCAhdGhpcy5wcm9kdWN0SXRlbUJsb2NrKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbUHJvZHVjdExpc3RdIGluaXQgcHJvZHVjdCBsaXN0Jyk7XG4gICAgICAgIHRoaXMucHJvZHVjdEl0ZW1CbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB0aGlzLnByb2R1Y3RDb25maWdzLmZvckVhY2gocHJvZHVjdCA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0SXRlbSA9IHRoaXMucHJvZHVjdEl0ZW1CbG9jay5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBwcm9kdWN0SXRlbS5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RJbWFnZVdyYXBwZXIgPSBwcm9kdWN0SXRlbS5xdWVyeVNlbGVjdG9yKCcucHJvZHVjdC1pdGVtLWltYWdlJyk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdEltYWdlV3JhcHBlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RJbWFnZSA9IGdldExhc3RDaGlsZChwcm9kdWN0SW1hZ2VXcmFwcGVyKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvZHVjdEltYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RJbWFnZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBgdXJsKCR7cHJvZHVjdC5tb2NrdXBzWzBdPy51cmx9KWA7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RJbWFnZS5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9ICdjb3Zlcic7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RJbWFnZS5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb24gPSAnY2VudGVyJztcbiAgICAgICAgICAgICAgICAgICAgcHJvZHVjdEltYWdlLnN0eWxlLmJhY2tncm91bmRSZXBlYXQgPSAnbm8tcmVwZWF0JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0VGV4dFdyYXBwZXIgPSBwcm9kdWN0SXRlbS5xdWVyeVNlbGVjdG9yKCcucHJvZHVjdC1pdGVtLXRleHQnKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0VGV4dFdyYXBwZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0VGV4dCA9IGdldExhc3RDaGlsZChwcm9kdWN0VGV4dFdyYXBwZXIpO1xuICAgICAgICAgICAgICAgIGlmIChwcm9kdWN0VGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9kdWN0VGV4dC5pbm5lclRleHQgPSBwcm9kdWN0LnByb2R1Y3ROYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RCbG9jayA9IHByb2R1Y3RJdGVtLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgcHJvZHVjdEJsb2NrLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1zZXR0aW5nc19fcHJvZHVjdC1ibG9ja19fJyArIHByb2R1Y3QudHlwZSk7XG4gICAgICAgICAgICBwcm9kdWN0QmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgcHJvZHVjdEJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgICAgICAgICAgIHByb2R1Y3RJdGVtLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNoYW5nZVByb2R1Y3QocHJvZHVjdC50eXBlKTtcbiAgICAgICAgICAgIHRoaXMucHJvZHVjdEJsb2Nrcy5wdXNoKHByb2R1Y3RCbG9jayk7XG4gICAgICAgICAgICB0aGlzLnByb2R1Y3RMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuYXBwZW5kQ2hpbGQocHJvZHVjdEl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMucHJvZHVjdEJsb2Nrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnByb2R1Y3RCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICAgICAgYmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2IoMjIyIDIyMiAyMjIpJztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLnByb2R1Y3RCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fcHJvZHVjdC1ibG9ja19fJyArIHRoaXMuX3NlbGVjdFR5cGUpKTtcbiAgICAgICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgICAgIGFjdGl2ZUJsb2NrLnN0eWxlLmJhY2tncm91bmQgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0Q29sb3JzTGlzdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckNvbG9yc0xpc3RCbG9jayB8fCAhdGhpcy5lZGl0b3JDb2xvckl0ZW1CbG9jaylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBpbml0IGNvbG9ycyBmb3IgJHt0aGlzLl9zZWxlY3RUeXBlfWApO1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuZWRpdG9yQ29sb3JJdGVtQmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgY29uc3QgY29sb3JzQ29udGFpbmVyID0gdGhpcy5lZGl0b3JDb2xvcnNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgIGNvbG9yc0NvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgdGhpcy5jb2xvckJsb2NrcyA9IFtdO1xuICAgICAgICBjb25zdCBjb2xvcnMgPSBwcm9kdWN0Lm1vY2t1cHNcbiAgICAgICAgICAgIC5maWx0ZXIobW9ja3VwID0+IG1vY2t1cC5zaWRlID09PSB0aGlzLl9zZWxlY3RTaWRlKVxuICAgICAgICAgICAgLm1hcChtb2NrdXAgPT4gbW9ja3VwLmNvbG9yKTtcbiAgICAgICAgY29sb3JzLmZvckVhY2goY29sb3IgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29sb3JJdGVtID0gdGhpcy5lZGl0b3JDb2xvckl0ZW1CbG9jay5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBjb2xvckl0ZW0uc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICBjb25zdCBjb2xvckJsb2NrID0gY29sb3JJdGVtLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgY29sb3JCbG9jay5jbGFzc0xpc3QuYWRkKCdlZGl0b3Itc2V0dGluZ3NfX2NvbG9yLWJsb2NrX18nICsgY29sb3IubmFtZSk7XG4gICAgICAgICAgICBjb2xvckJsb2NrLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIGNvbG9yQmxvY2suc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3IuaGV4O1xuICAgICAgICAgICAgY29sb3JCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgICAgICAgICBjb2xvckl0ZW0ub25jbGljayA9ICgpID0+IHRoaXMuY2hhbmdlQ29sb3IoY29sb3IubmFtZSk7XG4gICAgICAgICAgICB0aGlzLmNvbG9yQmxvY2tzLnB1c2goY29sb3JCbG9jayk7XG4gICAgICAgICAgICB0aGlzLmVkaXRvckNvbG9yc0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5hcHBlbmRDaGlsZChjb2xvckl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuY29sb3JCbG9ja3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5jb2xvckJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgICAgICBibG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLmNvbG9yQmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX2NvbG9yLWJsb2NrX18nICsgdGhpcy5fc2VsZWN0Q29sb3IubmFtZSkpO1xuICAgICAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgYWN0aXZlQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0U2l6ZXNMaXN0KCkge1xuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yU2l6ZXNMaXN0QmxvY2sgfHwgIXRoaXMuZWRpdG9yU2l6ZUl0ZW1CbG9jaylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBpbml0IHNpemVzIGZvciAke3RoaXMuX3NlbGVjdFR5cGV9YCk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdCB8fCAhcHJvZHVjdC5zaXplcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5lZGl0b3JTaXplSXRlbUJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGNvbnN0IHNpemVzQ29udGFpbmVyID0gdGhpcy5lZGl0b3JTaXplc0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgc2l6ZXNDb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIHRoaXMuc2l6ZUJsb2NrcyA9IFtdO1xuICAgICAgICBwcm9kdWN0LnNpemVzLmZvckVhY2goc2l6ZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzaXplSXRlbSA9IHRoaXMuZWRpdG9yU2l6ZUl0ZW1CbG9jay5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBzaXplSXRlbS5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIHNpemVJdGVtLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHNpemVJdGVtLnN0eWxlLnVzZXJTZWxlY3QgPSAnbm9uZSc7XG4gICAgICAgICAgICBzaXplSXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0b3Itc2V0dGluZ3NfX3NpemUtYmxvY2tfXycgKyBzaXplKTtcbiAgICAgICAgICAgIGNvbnN0IGJvcmRlckJsb2NrID0gc2l6ZUl0ZW0uZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBib3JkZXJCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgIGNvbnN0IHNpemVUZXh0ID0gZ2V0TGFzdENoaWxkKHNpemVJdGVtKTtcbiAgICAgICAgICAgIGlmIChzaXplVGV4dCkge1xuICAgICAgICAgICAgICAgIHNpemVUZXh0LmlubmVyVGV4dCA9IHNpemU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzaXplSXRlbS5vbmNsaWNrID0gKCkgPT4gdGhpcy5jaGFuZ2VTaXplKHNpemUpO1xuICAgICAgICAgICAgdGhpcy5zaXplQmxvY2tzLnB1c2goc2l6ZUl0ZW0pO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JTaXplc0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5hcHBlbmRDaGlsZChzaXplSXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5zaXplQmxvY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuc2l6ZUJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBib3JkZXJCbG9jayA9IGJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgIGlmIChib3JkZXJCbG9jaykge1xuICAgICAgICAgICAgICAgICAgICBib3JkZXJCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUJsb2NrID0gdGhpcy5zaXplQmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX3NpemUtYmxvY2tfXycgKyB0aGlzLl9zZWxlY3RTaXplKSk7XG4gICAgICAgICAgICBpZiAoYWN0aXZlQmxvY2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBib3JkZXJCbG9jayA9IGFjdGl2ZUJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgIGlmIChib3JkZXJCbG9jaykge1xuICAgICAgICAgICAgICAgICAgICBib3JkZXJCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBzaG93TGF5b3V0TGlzdCgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3NldHRpbmdzXSBbbGF5b3V0c10gc2hvdyBsYXlvdXRzIGxpc3QnKTtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9jaykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIltzZXR0aW5nc10gW2xheW91dHNdIGVkaXRvckxheW91dEl0ZW1CbG9jayBpcyBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2spIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbc2V0dGluZ3NdIFtsYXlvdXRzXSBlZGl0b3JMYXlvdXRzTGlzdEJsb2NrIGlzIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gW2xheW91dHNdIGxheW91dHMgbGlzdCBibG9jayBjaGlsZHJlbjogJHt0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuY2hpbGRyZW4ubGVuZ3RofWApO1xuICAgICAgICB0aGlzLmxheW91dHMuZm9yRWFjaChsYXlvdXQgPT4ge1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0SXRlbSA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIGxheW91dEl0ZW0uc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICBjb25zdCBpc0VkaXRpbmcgPSB0aGlzLl9zZWxlY3RMYXlvdXQgPT09IGxheW91dC5pZDtcbiAgICAgICAgICAgIGNvbnN0IHByZXZpZXdCbG9jayA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrVmlld0NsYXNzXG4gICAgICAgICAgICAgICAgPyBsYXlvdXRJdGVtLnF1ZXJ5U2VsZWN0b3IodGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tWaWV3Q2xhc3MpXG4gICAgICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgbmFtZUJsb2NrID0gdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tOYW1lQ2xhc3NcbiAgICAgICAgICAgICAgICA/IGxheW91dEl0ZW0ucXVlcnlTZWxlY3Rvcih0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja05hbWVDbGFzcylcbiAgICAgICAgICAgICAgICA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCByZW1vdmVCbG9jayA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrUmVtb3ZlQ2xhc3NcbiAgICAgICAgICAgICAgICA/IGxheW91dEl0ZW0ucXVlcnlTZWxlY3Rvcih0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja1JlbW92ZUNsYXNzKVxuICAgICAgICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRCbG9jayA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrRWRpdENsYXNzXG4gICAgICAgICAgICAgICAgPyBsYXlvdXRJdGVtLnF1ZXJ5U2VsZWN0b3IodGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tFZGl0Q2xhc3MpXG4gICAgICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICAgICAgaWYgKHByZXZpZXdCbG9jaykge1xuICAgICAgICAgICAgICAgIGlmIChsYXlvdXQuaXNJbWFnZUxheW91dCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZXZpZXdFbGVtZW50ID0gcHJldmlld0Jsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJldmlld0VsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IGB1cmwoJHtsYXlvdXQudXJsfSlgO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlld0VsZW1lbnQuc3R5bGUuYmFja2dyb3VuZFNpemUgPSAnY29udGFpbic7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3RWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb24gPSAnY2VudGVyJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJhY2tncm91bmRSZXBlYXQgPSAnbm8tcmVwZWF0JztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNFZGl0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3RWxlbWVudC5zdHlsZS5ib3JkZXJDb2xvciA9ICdyZ2IoMjU0LCA5NCwgNTgpJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJvcmRlckNvbG9yID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobGF5b3V0LnR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuYW1lQmxvY2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lRWxlbWVudCA9IG5hbWVCbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgICAgICBpZiAobmFtZUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxheW91dC50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwbGF5TmFtZSA9ICFsYXlvdXQubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gXCLQmNC30L7QsdGA0LDQttC10L3QuNC1XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGxheW91dC5uYW1lLmluY2x1ZGVzKFwiXFxuXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbGF5b3V0Lm5hbWUuc3BsaXQoXCJcXG5cIilbMF0gKyBcIi4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbGF5b3V0Lm5hbWUubGVuZ3RoID4gNDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbGF5b3V0Lm5hbWUuc2xpY2UoMCwgNDApICsgXCIuLi5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBsYXlvdXQubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVFbGVtZW50LmlubmVyVGV4dCA9IGRpc3BsYXlOYW1lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGxheW91dC50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVFbGVtZW50LmlubmVyVGV4dCA9IGxheW91dC5uYW1lIHx8IFwi0KLQtdC60YHRglwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlbW92ZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlQmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgICAgIHJlbW92ZUJsb2NrLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTGF5b3V0KGxheW91dC5pZCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzRWRpdGluZylcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FuY2VsRWRpdExheW91dCgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5yZXN0b3JlSWNvbkZyb21EYXRhT3JpZ2luYWwocmVtb3ZlQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVkaXRCbG9jaykge1xuICAgICAgICAgICAgICAgIGlmIChpc0VkaXRpbmcgfHwgbGF5b3V0LmlkID09PSBcInN0YXJ0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdEJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlZGl0QmxvY2suc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVkaXRCbG9jay5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICAgICAgZWRpdEJsb2NrLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmVkaXRMYXlvdXQobGF5b3V0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3RvcmVJY29uRnJvbURhdGFPcmlnaW5hbChnZXRMYXN0Q2hpbGQoZWRpdEJsb2NrKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuYXBwZW5kQ2hpbGQobGF5b3V0SXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSBsYXlvdXRzIHNob3duOiAke3RoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5jaGlsZHJlbi5sZW5ndGh9YCk7XG4gICAgfVxuICAgIGluaXRBZGRPcmRlckJ1dHRvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgdGhpcy5ldmVudHMub24oRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCAoaXNMb2FkaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbikge1xuICAgICAgICAgICAgICAgIGlmIChpc0xvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzAuNSc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24uc3R5bGUuY3Vyc29yID0gJ25vdC1hbGxvd2VkJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCa0L3QvtC/0LrQsCDQt9Cw0LHQu9C+0LrQuNGA0L7QstCw0L3QsCAo0LjQtNC10YIg0LPQtdC90LXRgNCw0YbQuNGPKScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCa0L3QvtC/0LrQsCDRgNCw0LfQsdC70L7QutC40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNBZGRpbmdUb0NhcnQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tvcmRlcl0g0J/RgNC+0YbQtdGB0YEg0LTQvtCx0LDQstC70LXQvdC40Y8g0YPQttC1INC40LTQtdGCLCDQuNCz0L3QvtGA0LjRgNGD0LXQvCDQv9C+0LLRgtC+0YDQvdC+0LUg0L3QsNC20LDRgtC40LUnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5nZXRTdW0oKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGFsZXJ0KCfQlNC70Y8g0LTQvtCx0LDQstC70LXQvdC40Y8g0LfQsNC60LDQt9CwINC/0YDQvtC00YPQutGCINC90LUg0LzQvtC20LXRgiDQsdGL0YLRjCDQv9GD0YHRgtGL0LwnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5sYXlvdXRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGFsZXJ0KCfQn9C+0LbQsNC70YPQudGB0YLQsCwg0LTQvtC20LTQuNGC0LXRgdGMINC30LDQstC10YDRiNC10L3QuNGPINCz0LXQvdC10YDQsNGG0LjQuCDQtNC40LfQsNC50L3QsCcpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW29yZGVyXSDQn9C+0L/Ri9GC0LrQsCDQtNC+0LHQsNCy0LjRgtGMINCyINC60L7RgNC30LjQvdGDINCx0LXQtyDQtNC40LfQsNC50L3QsCcpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBidXR0b25UZXh0RWxlbWVudCA9IHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24/LnF1ZXJ5U2VsZWN0b3IoJy50bi1hdG9tJyk7XG4gICAgICAgICAgICBpZiAoIWJ1dHRvblRleHRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgYnV0dG9uVGV4dEVsZW1lbnQgPSB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uPy5xdWVyeVNlbGVjdG9yKCdkaXYsIHNwYW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsVGV4dCA9IGJ1dHRvblRleHRFbGVtZW50Py50ZXh0Q29udGVudD8udHJpbSgpIHx8ICfQlNC+0LHQsNCy0LjRgtGMINCyINC60L7RgNC30LjQvdGDJztcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0FkZGluZ1RvQ2FydCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRBZGRUb0NhcnRCdXR0b25Mb2FkaW5nKHRydWUsICfQlNC+0LHQsNCy0LvQtdC90LjQtS4uLicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFydGljbGUgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoOTk5OTk5OTkgLSA5OTk5OTkgKyAxKSkgKyA5OTk5OTk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQndCw0YfQsNC70L4g0YHQvtC30LTQsNC90LjRjyDQt9Cw0LrQsNC30LAnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBleHBvcnRlZEFydCA9IGF3YWl0IHRoaXMuZXhwb3J0QXJ0KHRydWUsIDUxMik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQrdC60YHQv9C+0YDRgiDQtNC40LfQsNC50L3QsCDQt9Cw0LLQtdGA0YjQtdC9OicsIE9iamVjdC5rZXlzKGV4cG9ydGVkQXJ0KSk7XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKGV4cG9ydGVkQXJ0KS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ9Ce0YjQuNCx0LrQsDog0L3QtSDRg9C00LDQu9C+0YHRjCDRjdC60YHQv9C+0YDRgtC40YDQvtCy0LDRgtGMINC00LjQt9Cw0LnQvS4g0J/QvtC/0YDQvtCx0YPQudGC0LUg0LXRidC1INGA0LDQty4nKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW29yZGVyXSDQrdC60YHQv9C+0YDRgiDQstC10YDQvdGD0Lsg0L/Rg9GB0YLQvtC5INGA0LXQt9GD0LvRjNGC0LDRgicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHNpZGVzID0gT2JqZWN0LmtleXMoZXhwb3J0ZWRBcnQpLm1hcChzaWRlID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIGltYWdlX3VybDogZXhwb3J0ZWRBcnRbc2lkZV0gfHwgJycsXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0JfQsNCz0YDRg9C30LrQsCDQuNC30L7QsdGA0LDQttC10L3QuNC5INC90LAg0YHQtdGA0LLQtdGALi4uJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgdXBsb2FkUHJvbWlzZXMgPSBzaWRlcy5tYXAoYXN5bmMgKHNpZGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmFzZTY0ID0gc2lkZS5pbWFnZV91cmwuc3BsaXQoJywnKVsxXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXBsb2FkZWRVcmwgPSBhd2FpdCB0aGlzLnVwbG9hZEltYWdlVG9TZXJ2ZXIoYmFzZTY0KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgc2lkZSwgdXBsb2FkZWRVcmwgfTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCB1cGxvYWRlZFNpZGVzID0gYXdhaXQgUHJvbWlzZS5hbGwodXBsb2FkUHJvbWlzZXMpO1xuICAgICAgICAgICAgICAgIHVwbG9hZGVkU2lkZXMuZm9yRWFjaCgoeyBzaWRlLCB1cGxvYWRlZFVybCB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNpZGUuaW1hZ2VfdXJsID0gdXBsb2FkZWRVcmw7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQmNC30L7QsdGA0LDQttC10L3QuNGPINC30LDQs9GA0YPQttC10L3RiyDQvdCwINGB0LXRgNCy0LXRgCcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3ROYW1lID0gYCR7dGhpcy5jYXBpdGFsaXplRmlyc3RMZXR0ZXIodGhpcy5nZXRQcm9kdWN0TmFtZSgpKX0g0YEg0LLQsNGI0LjQvCAke09iamVjdC5rZXlzKGV4cG9ydGVkQXJ0KS5sZW5ndGggPT0gMSA/ICfQvtC00L3QvtGB0YLQvtGA0L7QvdC90LjQvCcgOiAn0LTQstGD0YXRgdGC0L7RgNC+0L3QvdC40LwnfSDQv9GA0LjQvdGC0L7QvGA7XG4gICAgICAgICAgICAgICAgY29uc3QgbGF5b3V0cyA9IHRoaXMubGF5b3V0cy5tYXAobGF5b3V0ID0+ICh7IC4uLmxheW91dCwgdXJsOiB1bmRlZmluZWQgfSkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJJZCA9IGF3YWl0IHRoaXMuc3RvcmFnZU1hbmFnZXIuZ2V0VXNlcklkKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoXCJsYXlvdXRzXCIsIEpTT04uc3RyaW5naWZ5KGxheW91dHMpKTtcbiAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoXCJ1c2VyX2lkXCIsIHVzZXJJZCk7XG4gICAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKFwiYXJ0XCIsIGFydGljbGUudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgZmV0Y2godGhpcy5hcGlDb25maWcud2ViaG9va0NhcnQsIHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgICAgICAgICAgYm9keTogZm9ybURhdGFcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjcmVhdGVQcm9kdWN0KHtcbiAgICAgICAgICAgICAgICAgICAgcXVhbnRpdHk6IHRoaXMuZ2V0UXVhbnRpdHkoKSxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogcHJvZHVjdE5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHNpemU6IHRoaXMuX3NlbGVjdFNpemUsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiB0aGlzLl9zZWxlY3RDb2xvcixcbiAgICAgICAgICAgICAgICAgICAgc2lkZXMsXG4gICAgICAgICAgICAgICAgICAgIGFydGljbGUsXG4gICAgICAgICAgICAgICAgICAgIHByaWNlOiB0aGlzLmdldFN1bSgpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNBZGRlZFRvQ2FydCA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQl9Cw0LrQsNC3INGD0YHQv9C10YjQvdC+INGB0L7Qt9C00LDQvScpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyhmYWxzZSwgJ+KckyDQlNC+0LHQsNCy0LvQtdC90L4hJyk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyhmYWxzZSwgb3JpZ2luYWxUZXh0KTtcbiAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tvcmRlcl0g0J7RiNC40LHQutCwINGB0L7Qt9C00LDQvdC40Y8g0LfQsNC60LDQt9CwOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBhbGVydCgn0J7RiNC40LHQutCwINC/0YDQuCDRgdC+0LfQtNCw0L3QuNC4INC30LDQutCw0LfQsCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyhmYWxzZSwgb3JpZ2luYWxUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzQWRkaW5nVG9DYXJ0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0KTQu9Cw0LMgaXNBZGRpbmdUb0NhcnQg0YHQsdGA0L7RiNC10L0nKTtcbiAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyhpc0xvYWRpbmcsIHRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmluamVjdFB1bHNlQW5pbWF0aW9uKCk7XG4gICAgICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b247XG4gICAgICAgIGxldCBidXR0b25UZXh0RWxlbWVudCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCcudG4tYXRvbScpO1xuICAgICAgICBpZiAoIWJ1dHRvblRleHRFbGVtZW50KSB7XG4gICAgICAgICAgICBidXR0b25UZXh0RWxlbWVudCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdkaXYsIHNwYW4nKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZXh0VGFyZ2V0ID0gYnV0dG9uVGV4dEVsZW1lbnQgfHwgYnV0dG9uO1xuICAgICAgICBpZiAoaXNMb2FkaW5nKSB7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9ICcwLjcnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmN1cnNvciA9ICdub3QtYWxsb3dlZCc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICAgICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgdGV4dFRhcmdldC50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuYW5pbWF0aW9uID0gJ2NhcnRCdXR0b25QdWxzZSAxLjVzIGVhc2UtaW4tb3V0IGluZmluaXRlJztcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0gW2FuaW1hdGlvbl0g0JrQvdC+0L/QutCwINC30LDQsdC70L7QutC40YDQvtCy0LDQvdCwOicsIHRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuYW5pbWF0aW9uID0gJ25vbmUnO1xuICAgICAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgICAgICB0ZXh0VGFyZ2V0LnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0gW2FuaW1hdGlvbl0g0JrQvdC+0L/QutCwINGA0LDQt9Cx0LvQvtC60LjRgNC+0LLQsNC90LA6JywgdGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5qZWN0UHVsc2VBbmltYXRpb24oKSB7XG4gICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FydC1idXR0b24tcHVsc2UtYW5pbWF0aW9uJykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgIHN0eWxlLmlkID0gJ2NhcnQtYnV0dG9uLXB1bHNlLWFuaW1hdGlvbic7XG4gICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gYFxuICAgICAgICAgICAgQGtleWZyYW1lcyBjYXJ0QnV0dG9uUHVsc2Uge1xuICAgICAgICAgICAgICAgIDAlLCAxMDAlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBzY2FsZSgxKTtcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMC43O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA1MCUge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMDIpO1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLjg1O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgYDtcbiAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1thbmltYXRpb25dIENTUyDQsNC90LjQvNCw0YbQuNGPINC/0YPQu9GM0YHQsNGG0LjQuCDQtNC+0LHQsNCy0LvQtdC90LAnKTtcbiAgICB9XG4gICAgc2V0R2VuZXJhdGVCdXR0b25Mb2FkaW5nKGlzTG9hZGluZywgdGV4dCkge1xuICAgICAgICBpZiAoIXRoaXMuZm9ybUJ1dHRvbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5pbmplY3RQdWxzZUFuaW1hdGlvbigpO1xuICAgICAgICBjb25zdCBidXR0b24gPSB0aGlzLmZvcm1CdXR0b247XG4gICAgICAgIGxldCBidXR0b25UZXh0RWxlbWVudCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCcudG4tYXRvbScpO1xuICAgICAgICBpZiAoIWJ1dHRvblRleHRFbGVtZW50KSB7XG4gICAgICAgICAgICBidXR0b25UZXh0RWxlbWVudCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdkaXYsIHNwYW4nKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZXh0VGFyZ2V0ID0gYnV0dG9uVGV4dEVsZW1lbnQgfHwgYnV0dG9uO1xuICAgICAgICBpZiAoaXNMb2FkaW5nKSB7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9ICcwLjcnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmN1cnNvciA9ICdub3QtYWxsb3dlZCc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICAgICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgdGV4dFRhcmdldC50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuYW5pbWF0aW9uID0gJ2NhcnRCdXR0b25QdWxzZSAxLjVzIGVhc2UtaW4tb3V0IGluZmluaXRlJztcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tnZW5lcmF0ZV0gW2FuaW1hdGlvbl0g0JrQvdC+0L/QutCwINC30LDQsdC70L7QutC40YDQvtCy0LDQvdCwOicsIHRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuYW5pbWF0aW9uID0gJ25vbmUnO1xuICAgICAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgICAgICB0ZXh0VGFyZ2V0LnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tnZW5lcmF0ZV0gW2FuaW1hdGlvbl0g0JrQvdC+0L/QutCwINGA0LDQt9Cx0LvQvtC60LjRgNC+0LLQsNC90LA6JywgdGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0Q29udHJvbHNEaXNhYmxlZChkaXNhYmxlZCkge1xuICAgICAgICBjb25zdCBvcGFjaXR5ID0gZGlzYWJsZWQgPyAnMC41JyA6ICcxJztcbiAgICAgICAgY29uc3QgcG9pbnRlckV2ZW50cyA9IGRpc2FibGVkID8gJ25vbmUnIDogJ2F1dG8nO1xuICAgICAgICBjb25zdCBjdXJzb3IgPSBkaXNhYmxlZCA/ICdub3QtYWxsb3dlZCcgOiAncG9pbnRlcic7XG4gICAgICAgIGlmICh0aGlzLmNoYW5nZVNpZGVCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlU2lkZUJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gb3BhY2l0eTtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlU2lkZUJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gcG9pbnRlckV2ZW50cztcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlU2lkZUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSBjdXJzb3I7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb2xvckJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IGJsb2NrLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcGFyZW50LnN0eWxlLm9wYWNpdHkgPSBvcGFjaXR5O1xuICAgICAgICAgICAgICAgIHBhcmVudC5zdHlsZS5wb2ludGVyRXZlbnRzID0gcG9pbnRlckV2ZW50cztcbiAgICAgICAgICAgICAgICBwYXJlbnQuc3R5bGUuY3Vyc29yID0gY3Vyc29yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5wcm9kdWN0QmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gYmxvY2sucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnQuc3R5bGUub3BhY2l0eSA9IG9wYWNpdHk7XG4gICAgICAgICAgICAgICAgcGFyZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPSBwb2ludGVyRXZlbnRzO1xuICAgICAgICAgICAgICAgIHBhcmVudC5zdHlsZS5jdXJzb3IgPSBjdXJzb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbY29udHJvbHNdINCt0LvQtdC80LXQvdGC0Ysg0YPQv9GA0LDQstC70LXQvdC40Y8gJHtkaXNhYmxlZCA/ICfQt9Cw0LHQu9C+0LrQuNGA0L7QstCw0L3RiycgOiAn0YDQsNC30LHQu9C+0LrQuNGA0L7QstCw0L3Riyd9YCk7XG4gICAgfVxuICAgIGluaXRVcGxvYWRJbWFnZUJ1dHRvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvclVwbG9hZEltYWdlQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnJlc2V0VXNlclVwbG9hZEltYWdlKCk7XG4gICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmVkaXRvclVwbG9hZEltYWdlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGxvYWRVc2VySW1hZ2UoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGluaXRGaXhRdWFudGl0eUZvcm0oKSB7XG4gICAgICAgIGlmICghdGhpcy5xdWFudGl0eUZvcm1CbG9jaylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZm9ybSA9IHRoaXMucXVhbnRpdHlGb3JtQmxvY2sucXVlcnlTZWxlY3RvcignZm9ybScpO1xuICAgICAgICBjb25zdCBpbnB1dCA9IGZvcm0/LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJxdWFudGl0eVwiXScpO1xuICAgICAgICBpZiAoIWlucHV0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB2YWxpZGF0ZVF1YW50aXR5ID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBpbnB1dC52YWx1ZS50cmltKCk7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09ICcnIHx8IGlzTmFOKE51bWJlcih2YWx1ZSkpKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQudmFsdWUgPSAnMSc7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcXVhbnRpdHkgPSBwYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgICAgaWYgKHF1YW50aXR5IDwgMSB8fCBxdWFudGl0eSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlucHV0LnZhbHVlID0gJzEnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIHZhbGlkYXRlUXVhbnRpdHkpO1xuICAgICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgdmFsaWRhdGVRdWFudGl0eSk7XG4gICAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHZhbGlkYXRlUXVhbnRpdHkpO1xuICAgICAgICB2YWxpZGF0ZVF1YW50aXR5KCk7XG4gICAgfVxuICAgIGFzeW5jIGluaXRGb3JtKCkge1xuICAgICAgICBpZiAoIXRoaXMuZm9ybUJsb2NrIHx8ICF0aGlzLmZvcm1CdXR0b24gfHwgIXRoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBmb3JtQmxvY2sgPSB0aGlzLmZvcm1CbG9jaztcbiAgICAgICAgY29uc3QgZm9ybUlucHV0VmFyaWFibGVOYW1lID0gdGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWU7XG4gICAgICAgIGNvbnN0IGZvcm1CdXR0b24gPSB0aGlzLmZvcm1CdXR0b247XG4gICAgICAgIGNvbnN0IGhhbmRsZUNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtidXR0b25dIGNsaWNrZWQnKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzR2VuZXJhdGluZykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dINCT0LXQvdC10YDQsNGG0LjRjyDRg9C20LUg0LjQtNC10YIsINC40LPQvdC+0YDQuNGA0YPQtdC8INC/0L7QstGC0L7RgNC90L7QtSDQvdCw0LbQsNGC0LjQtScpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGZvcm1JbnB1dCA9IGZvcm1CbG9jay5xdWVyeVNlbGVjdG9yKGBbbmFtZT1cIiR7Zm9ybUlucHV0VmFyaWFibGVOYW1lfVwiXWApO1xuICAgICAgICAgICAgY29uc3QgcHJvbXB0ID0gZm9ybUlucHV0LnZhbHVlO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmxvYWRlZFVzZXJJbWFnZSkge1xuICAgICAgICAgICAgICAgIGlmICghcHJvbXB0IHx8IHByb21wdC50cmltKCkgPT09IFwiXCIgfHwgcHJvbXB0Lmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW2lucHV0XSBwcm9tcHQgaXMgZW1wdHkgb3IgdG9vIHNob3J0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwi0JzQuNC90LjQvNCw0LvRjNC90LDRjyDQtNC70LjQvdCwINC30LDQv9GA0L7RgdCwIDEg0YHQuNC80LLQvtC7XCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtpbnB1dF0gcHJvbXB0OiAke3Byb21wdH1gKTtcbiAgICAgICAgICAgIHRoaXMuaXNHZW5lcmF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc2V0R2VuZXJhdGVCdXR0b25Mb2FkaW5nKHRydWUsICfQk9C10L3QtdGA0LDRhtC40Y8uLi4nKTtcbiAgICAgICAgICAgIHRoaXMuc2V0Q29udHJvbHNEaXNhYmxlZCh0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIHRydWUpO1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0SWQgPSB0aGlzLl9zZWxlY3RMYXlvdXQgfHwgTGF5b3V0LmdlbmVyYXRlSWQoKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXJsID0gYXdhaXQgZ2VuZXJhdGVJbWFnZSh7XG4gICAgICAgICAgICAgICAgICAgIHVyaTogdGhpcy5hcGlDb25maWcud2ViaG9va1JlcXVlc3QsXG4gICAgICAgICAgICAgICAgICAgIHByb21wdCxcbiAgICAgICAgICAgICAgICAgICAgc2hpcnRDb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2U6IHRoaXMuX3NlbGVjdExheW91dCA/IHRoaXMubG9hZGVkVXNlckltYWdlICE9PSB0aGlzLmxheW91dHMuZmluZChsYXlvdXQgPT4gbGF5b3V0LmlkID09PSB0aGlzLl9zZWxlY3RMYXlvdXQpPy51cmwgPyB0aGlzLmxvYWRlZFVzZXJJbWFnZSA6IG51bGwgOiB0aGlzLmxvYWRlZFVzZXJJbWFnZSxcbiAgICAgICAgICAgICAgICAgICAgd2l0aEFpOiB0aGlzLmVkaXRvckxvYWRXaXRoQWksXG4gICAgICAgICAgICAgICAgICAgIGxheW91dElkLFxuICAgICAgICAgICAgICAgICAgICBpc05ldzogdGhpcy5fc2VsZWN0TGF5b3V0ID8gZmFsc2UgOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAhdGhpcy5yZW1vdmVCYWNrZ3JvdW5kRW5hYmxlZCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cueW0oMTAzMjc5MjE0LCAncmVhY2hHb2FsJywgJ2dlbmVyYXRlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHsgfVxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbWFnZURhdGEgPSBhd2FpdCB0aGlzLmdldEltYWdlRGF0YSh1cmwpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbaW5wdXRdIGltYWdlIGRhdGEgcmVjZWl2ZWRgKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc2VsZWN0TGF5b3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0cy5maW5kKGxheW91dCA9PiBsYXlvdXQuaWQgPT09IGxheW91dElkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxheW91dCAmJiBsYXlvdXQuaXNJbWFnZUxheW91dCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW2lucHV0XSB1cGRhdGluZyBsYXlvdXQ6ICR7bGF5b3V0LmlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGF5b3V0Lm5hbWUgPSBwcm9tcHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXlvdXQudXJsID0gaW1hZ2VEYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtpbnB1dF0gbGF5b3V0IHVwZGF0ZWRgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRMYXlvdXQoTGF5b3V0LmNyZWF0ZUltYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBsYXlvdXRJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXc6IHRoaXMuX3NlbGVjdFNpZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGltYWdlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHByb21wdFxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RMYXlvdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC52YWx1ZSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW5jZWxFZGl0TGF5b3V0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldFVzZXJVcGxvYWRJbWFnZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEdlbmVyYXRlQnV0dG9uTG9hZGluZyhmYWxzZSwgJ+KckyDQk9C+0YLQvtCy0L4hJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRDb250cm9sc0Rpc2FibGVkKGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRHZW5lcmF0ZUJ1dHRvbkxvYWRpbmcoZmFsc2UsICfQodCz0LXQvdC10YDQuNGA0L7QstCw0YLRjCcpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzR2VuZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0g0KTQu9Cw0LMgaXNHZW5lcmF0aW5nINGB0LHRgNC+0YjQtdC9Jyk7XG4gICAgICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2Zvcm1dIFtpbnB1dF0gZXJyb3InLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgYWxlcnQoXCLQntGI0LjQsdC60LAg0L/RgNC4INCz0LXQvdC10YDQsNGG0LjQuCDQuNC30L7QsdGA0LDQttC10L3QuNGPXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0R2VuZXJhdGVCdXR0b25Mb2FkaW5nKGZhbHNlLCAn0KHQs9C10L3QtdGA0LjRgNC+0LLQsNGC0YwnKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldENvbnRyb2xzRGlzYWJsZWQoZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNHZW5lcmF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9hZGVkVXNlckltYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzZXRVc2VyVXBsb2FkSW1hZ2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NlbGVjdExheW91dCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RMYXlvdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbmNlbEVkaXRMYXlvdXQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGZvcm0gPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybSA9IGZvcm1CbG9jay5xdWVyeVNlbGVjdG9yKFwiZm9ybVwiKTtcbiAgICAgICAgICAgICAgICBpZiAoZm9ybSkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShmb3JtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgICAgICAgIH0sIDEwMDAgKiAxMCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIWZvcm0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIGZvcm0gbm90IGZvdW5kJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZm9ybS5hY3Rpb24gPSBcIlwiO1xuICAgICAgICBmb3JtLm1ldGhvZCA9IFwiR0VUXCI7XG4gICAgICAgIGZvcm0ub25zdWJtaXQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBoYW5kbGVDbGljaygpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBmaXhJbnB1dEJsb2NrID0gZm9ybS5xdWVyeVNlbGVjdG9yKGB0ZXh0YXJlYVtuYW1lPScke2Zvcm1JbnB1dFZhcmlhYmxlTmFtZX0nXWApO1xuICAgICAgICBpZiAoZml4SW5wdXRCbG9jaykge1xuICAgICAgICAgICAgZml4SW5wdXRCbG9jay5zdHlsZS5wYWRkaW5nID0gXCI4cHhcIjtcbiAgICAgICAgfVxuICAgICAgICBmb3JtQnV0dG9uLm9uY2xpY2sgPSBoYW5kbGVDbGljaztcbiAgICAgICAgZm9ybUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSBcInBvaW50ZXJcIjtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dINCY0L3QuNGG0LjQsNC70LjQt9Cw0YbQuNGPINGE0L7RgNC80Ysg0LfQsNCy0LXRgNGI0LXQvdCwJyk7XG4gICAgfVxuICAgIHJlc3RvcmVJY29uRnJvbURhdGFPcmlnaW5hbChlbGVtZW50KSB7XG4gICAgICAgIGlmICghZWxlbWVudClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZGF0YU9yaWdpbmFsID0gZWxlbWVudC5hdHRyaWJ1dGVzLmdldE5hbWVkSXRlbShcImRhdGEtb3JpZ2luYWxcIik/LnZhbHVlO1xuICAgICAgICBpZiAoZGF0YU9yaWdpbmFsKSB7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IGB1cmwoXCIke2RhdGFPcmlnaW5hbH1cIilgO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNoYW5nZVByb2R1Y3QocHJvZHVjdFR5cGUpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNHZW5lcmF0aW5nKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tjaGFuZ2VQcm9kdWN0XSDQk9C10L3QtdGA0LDRhtC40Y8g0LIg0L/RgNC+0YbQtdGB0YHQtSwg0L/QtdGA0LXQutC70Y7Rh9C10L3QuNC1INC30LDQsdC70L7QutC40YDQvtCy0LDQvdC+Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc2VsZWN0VHlwZSA9IHByb2R1Y3RUeXBlO1xuICAgICAgICB0aGlzLmNsZWFyTW9ja3VwQ2FjaGUoKTtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZShwcm9kdWN0VHlwZSk7XG4gICAgICAgIGlmIChwcm9kdWN0KSB7XG4gICAgICAgICAgICBjb25zdCBtb2NrdXBXaXRoQ3VycmVudENvbG9yID0gcHJvZHVjdC5tb2NrdXBzLmZpbmQobSA9PiBtLnNpZGUgPT09IHRoaXMuX3NlbGVjdFNpZGUgJiYgbS5jb2xvci5uYW1lID09PSB0aGlzLl9zZWxlY3RDb2xvci5uYW1lKTtcbiAgICAgICAgICAgIGlmICghbW9ja3VwV2l0aEN1cnJlbnRDb2xvcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0TW9ja3VwID0gcHJvZHVjdC5tb2NrdXBzLmZpbmQobSA9PiBtLnNpZGUgPT09IHRoaXMuX3NlbGVjdFNpZGUpO1xuICAgICAgICAgICAgICAgIGlmIChmaXJzdE1vY2t1cCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RDb2xvciA9IGZpcnN0TW9ja3VwLmNvbG9yO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbcHJvZHVjdF0g0KbQstC10YIg0LjQt9C80LXQvdC10L0g0L3QsCAke3RoaXMuX3NlbGVjdENvbG9yLm5hbWV9INC00LvRjyDQv9GA0L7QtNGD0LrRgtCwICR7cHJvZHVjdFR5cGV9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlUHJvZHVjdEJsb2Nrc1VJKCk7XG4gICAgICAgIHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICB9XG4gICAgdXBkYXRlUHJvZHVjdEJsb2Nrc1VJKCkge1xuICAgICAgICBpZiAodGhpcy5wcm9kdWN0QmxvY2tzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5wcm9kdWN0QmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgYmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2IoMjIyIDIyMiAyMjIpJztcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGFjdGl2ZUJsb2NrID0gdGhpcy5wcm9kdWN0QmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX3Byb2R1Y3QtYmxvY2tfXycgKyB0aGlzLl9zZWxlY3RUeXBlKSk7XG4gICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgYWN0aXZlQmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICcnO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNoYW5nZVNpZGUoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzR2VuZXJhdGluZykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbY2hhbmdlU2lkZV0g0JPQtdC90LXRgNCw0YbQuNGPINCyINC/0YDQvtGG0LXRgdGB0LUsINC/0LXRgNC10LrQu9GO0YfQtdC90LjQtSDQt9Cw0LHQu9C+0LrQuNGA0L7QstCw0L3QvicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5ld1NpZGUgPSB0aGlzLl9zZWxlY3RTaWRlID09PSAnZnJvbnQnID8gJ2JhY2snIDogJ2Zyb250JztcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVTaWRlKG5ld1NpZGUpO1xuICAgICAgICB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLlNUQVRFX0NIQU5HRUQsIHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIGNoYW5nZUNvbG9yKGNvbG9yTmFtZSkge1xuICAgICAgICBpZiAodGhpcy5pc0dlbmVyYXRpbmcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2NoYW5nZUNvbG9yXSDQk9C10L3QtdGA0LDRhtC40Y8g0LIg0L/RgNC+0YbQtdGB0YHQtSwg0L/QtdGA0LXQutC70Y7Rh9C10L3QuNC1INC30LDQsdC70L7QutC40YDQvtCy0LDQvdC+Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBtb2NrdXAgPSBwcm9kdWN0Lm1vY2t1cHMuZmluZChtID0+IG0uY29sb3IubmFtZSA9PT0gY29sb3JOYW1lKTtcbiAgICAgICAgaWYgKCFtb2NrdXApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gbW9ja3VwLmNvbG9yO1xuICAgICAgICB0aGlzLmNsZWFyTW9ja3VwQ2FjaGUoKTtcbiAgICAgICAgdGhpcy51cGRhdGVDb2xvckJsb2Nrc1VJKGNvbG9yTmFtZSk7XG4gICAgICAgIHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgfVxuICAgIHVwZGF0ZUNvbG9yQmxvY2tzVUkoY29sb3JOYW1lKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbG9yQmxvY2tzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5jb2xvckJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgIGJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLmNvbG9yQmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX2NvbG9yLWJsb2NrX18nICsgY29sb3JOYW1lKSk7XG4gICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgYWN0aXZlQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjaGFuZ2VTaXplKHNpemUpIHtcbiAgICAgICAgdGhpcy51cGRhdGVTaXplQmxvY2tzVUkoc2l6ZSk7XG4gICAgICAgIHRoaXMuX3NlbGVjdFNpemUgPSBzaXplO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgIH1cbiAgICB1cGRhdGVTaXplQmxvY2tzVUkoc2l6ZSkge1xuICAgICAgICBpZiAodGhpcy5zaXplQmxvY2tzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5zaXplQmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgY29uc3QgYm9yZGVyQmxvY2sgPSBibG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGlmIChib3JkZXJCbG9jaykge1xuICAgICAgICAgICAgICAgIGJvcmRlckJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLnNpemVCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fc2l6ZS1ibG9ja19fJyArIHNpemUpKTtcbiAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICBjb25zdCBib3JkZXJCbG9jayA9IGFjdGl2ZUJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgaWYgKGJvcmRlckJsb2NrKSB7XG4gICAgICAgICAgICAgICAgYm9yZGVyQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBlZGl0TGF5b3V0KGxheW91dCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSBlZGl0IGxheW91dCAke2xheW91dC5pZH1gKTtcbiAgICAgICAgdGhpcy5fc2VsZWN0TGF5b3V0ID0gbGF5b3V0LmlkO1xuICAgICAgICBpZiAodGhpcy5mb3JtQmxvY2sgJiYgdGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGZvcm1JbnB1dCA9IHRoaXMuZm9ybUJsb2NrLnF1ZXJ5U2VsZWN0b3IoYFtuYW1lPVwiJHt0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZX1cIl1gKTtcbiAgICAgICAgICAgIGlmIChmb3JtSW5wdXQpIHtcbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQudmFsdWUgPSBsYXlvdXQubmFtZSB8fCAnJztcbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQuc3R5bGUuYm9yZGVyQ29sb3IgPSAncmdiKDI1NCwgOTQsIDU4KSc7XG4gICAgICAgICAgICAgICAgZm9ybUlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBbbGF5b3V0c10g0KPRgdGC0LDQvdC+0LLQu9C10L3QviDQt9C90LDRh9C10L3QuNC1INCyINGE0L7RgNC80YM6IFwiJHtsYXlvdXQubmFtZX1cImApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSDQndC1INC90LDQudC00LXQvSDRjdC70LXQvNC10L3RgiDRhNC+0YDQvNGLINGBINC40LzQtdC90LXQvCBcIiR7dGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWV9XCJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSkge1xuICAgICAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBsYXlvdXQudXJsO1xuICAgICAgICAgICAgdGhpcy5zZXRVc2VyVXBsb2FkSW1hZ2UobGF5b3V0LnVybCk7XG4gICAgICAgICAgICB0aGlzLmluaXRBaUJ1dHRvbnMoKTtcbiAgICAgICAgICAgIHRoaXMuaGlkZUFpQnV0dG9ucygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5yZXNldFVzZXJVcGxvYWRJbWFnZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICB9XG4gICAgY2FuY2VsRWRpdExheW91dCgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBbbGF5b3V0c10gY2FuY2VsIGVkaXQgbGF5b3V0YCk7XG4gICAgICAgIHRoaXMuX3NlbGVjdExheW91dCA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLmZvcm1CbG9jayAmJiB0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSkge1xuICAgICAgICAgICAgY29uc3QgZm9ybUlucHV0ID0gdGhpcy5mb3JtQmxvY2sucXVlcnlTZWxlY3RvcihgW25hbWU9XCIke3RoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lfVwiXWApO1xuICAgICAgICAgICAgaWYgKGZvcm1JbnB1dCkge1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC52YWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxvYWRlZFVzZXJJbWFnZSA9IG51bGw7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gW2xheW91dHNdINCg0LXQtNCw0LrRgtC40YDQvtCy0LDQvdC40LUg0L7RgtC80LXQvdC10L3QvmApO1xuICAgIH1cbiAgICBpbml0QWlCdXR0b25zKCkge1xuICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jaGFuZ2VMb2FkV2l0aEFpKCk7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZUxvYWRXaXRoQWkodHJ1ZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZUxvYWRXaXRoQWkoZmFsc2UpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluaXRSZW1vdmVCYWNrZ3JvdW5kQ2hlY2tib3goKTtcbiAgICB9XG4gICAgaW5pdFJlbW92ZUJhY2tncm91bmRDaGVja2JveCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b24pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuY2hhbmdlUmVtb3ZlQmFja2dyb3VuZCgpO1xuICAgICAgICB0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlUmVtb3ZlQmFja2dyb3VuZCghdGhpcy5yZW1vdmVCYWNrZ3JvdW5kRW5hYmxlZCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudXBkYXRlUmVtb3ZlQmFja2dyb3VuZFZpc2liaWxpdHkoKTtcbiAgICB9XG4gICAgdXBkYXRlUmVtb3ZlQmFja2dyb3VuZFZpc2liaWxpdHkoKSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBwYXJlbnRFbGVtZW50ID0gdGhpcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kQnV0dG9uLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIGlmICghcGFyZW50RWxlbWVudClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKHRoaXMubG9hZGVkVXNlckltYWdlICYmICF0aGlzLmVkaXRvckxvYWRXaXRoQWkpIHtcbiAgICAgICAgICAgIHBhcmVudEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3JlbW92ZSBiYWNrZ3JvdW5kXSDQmtC90L7Qv9C60LAg0L/QvtC60LDQt9Cw0L3QsCAo0L3QtS3QmNCYINGA0LXQttC40LwpJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwYXJlbnRFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLmNoYW5nZVJlbW92ZUJhY2tncm91bmQoZmFsc2UpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3JlbW92ZSBiYWNrZ3JvdW5kXSDQmtC90L7Qv9C60LAg0YHQutGA0YvRgtCwICjQmNCYINGA0LXQttC40Lwg0LjQu9C4INC90LXRgiDQuNC30L7QsdGA0LDQttC10L3QuNGPKScpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNoYW5nZVJlbW92ZUJhY2tncm91bmQodmFsdWUgPSBmYWxzZSkge1xuICAgICAgICB0aGlzLnJlbW92ZUJhY2tncm91bmRFbmFibGVkID0gdmFsdWU7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b24pIHtcbiAgICAgICAgICAgIGNvbnN0IGJ1dHRvbkVsZW1lbnQgPSBnZXRMYXN0Q2hpbGQodGhpcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kQnV0dG9uKTtcbiAgICAgICAgICAgIGlmIChidXR0b25FbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbkVsZW1lbnQuc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbkVsZW1lbnQuc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YyZjJmMic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tyZW1vdmUgYmFja2dyb3VuZF0g0KHQvtGB0YLQvtGP0L3QuNC1INC40LfQvNC10L3QtdC90L46JywgdGhpcy5yZW1vdmVCYWNrZ3JvdW5kRW5hYmxlZCk7XG4gICAgfVxuICAgIGhpZGVBaUJ1dHRvbnMoKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IHRydWU7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24pIHtcbiAgICAgICAgICAgICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24ucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudCkuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBzaG93QWlCdXR0b25zKCkge1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uKSB7XG4gICAgICAgICAgICAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uLnBhcmVudEVsZW1lbnQ/LnBhcmVudEVsZW1lbnQ/LnBhcmVudEVsZW1lbnQpLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBsb2FkVXNlckltYWdlKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkIHVzZXIgaW1hZ2VdIHN0YXJ0aW5nIHVzZXIgaW1hZ2UgdXBsb2FkJyk7XG4gICAgICAgIHRoaXMuaW5pdEFpQnV0dG9ucygpO1xuICAgICAgICB0aGlzLnNob3dBaUJ1dHRvbnMoKTtcbiAgICAgICAgY29uc3QgZmlsZUlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgZmlsZUlucHV0LnR5cGUgPSAnZmlsZSc7XG4gICAgICAgIGZpbGVJbnB1dC5hY2NlcHQgPSAnaW1hZ2UvKic7XG4gICAgICAgIGZpbGVJbnB1dC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBmaWxlSW5wdXQub25jaGFuZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSB0YXJnZXQuZmlsZXM/LlswXTtcbiAgICAgICAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZCB1c2VyIGltYWdlXSBmaWxlIHNlbGVjdGVkOicsIGZpbGUubmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlLnR5cGUuc3RhcnRzV2l0aCgnaW1hZ2UvJykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbdXBsb2FkIHVzZXIgaW1hZ2VdIHNlbGVjdGVkIGZpbGUgaXMgbm90IGFuIGltYWdlJyk7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCfQn9C+0LbQsNC70YPQudGB0YLQsCwg0LLRi9Cx0LXRgNC40YLQtSDRhNCw0LnQuyDQuNC30L7QsdGA0LDQttC10L3QuNGPJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgICAgICByZWFkZXIub25sb2FkID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VVcmwgPSBlLnRhcmdldD8ucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkIHVzZXIgaW1hZ2VdIGZpbGUgbG9hZGVkIGFzIGRhdGEgVVJMJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlRGF0YSA9IGF3YWl0IHRoaXMuZ2V0SW1hZ2VEYXRhKGltYWdlVXJsKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRVc2VyVXBsb2FkSW1hZ2UoaW1hZ2VEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZCB1c2VyIGltYWdlXSBpbWFnZSBsYXlvdXQgYWRkZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZWFkZXIub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3VwbG9hZCB1c2VyIGltYWdlXSBlcnJvciByZWFkaW5nIGZpbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ9Ce0YjQuNCx0LrQsCDQv9GA0Lgg0LfQsNCz0YDRg9C30LrQtSDRhNCw0LnQu9CwJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChmaWxlSW5wdXQpO1xuICAgICAgICBmaWxlSW5wdXQuY2xpY2soKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChmaWxlSW5wdXQpO1xuICAgIH1cbiAgICBzZXRVc2VyVXBsb2FkSW1hZ2UoaW1hZ2UpIHtcbiAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBpbWFnZTtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yVXBsb2FkVmlld0Jsb2NrKSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvclVwbG9hZFZpZXdCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIGNvbnN0IGltYWdlQmxvY2sgPSBnZXRMYXN0Q2hpbGQodGhpcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2spO1xuICAgICAgICAgICAgaWYgKGltYWdlQmxvY2spIHtcbiAgICAgICAgICAgICAgICBpbWFnZUJsb2NrLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IGB1cmwoJHtpbWFnZX0pYDtcbiAgICAgICAgICAgICAgICBpbWFnZUJsb2NrLnN0eWxlLmJhY2tncm91bmRTaXplID0gJ2NvbnRhaW4nO1xuICAgICAgICAgICAgICAgIGltYWdlQmxvY2suc3R5bGUuYmFja2dyb3VuZFBvc2l0aW9uID0gJ2NlbnRlcic7XG4gICAgICAgICAgICAgICAgaW1hZ2VCbG9jay5zdHlsZS5iYWNrZ3JvdW5kUmVwZWF0ID0gJ25vLXJlcGVhdCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVSZW1vdmVCYWNrZ3JvdW5kVmlzaWJpbGl0eSgpO1xuICAgIH1cbiAgICByZXNldFVzZXJVcGxvYWRJbWFnZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yVXBsb2FkVmlld0Jsb2NrKSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvclVwbG9hZFZpZXdCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubG9hZGVkVXNlckltYWdlID0gbnVsbDtcbiAgICAgICAgdGhpcy5jYW5jZWxFZGl0TGF5b3V0KCk7XG4gICAgICAgIHRoaXMudXBkYXRlUmVtb3ZlQmFja2dyb3VuZFZpc2liaWxpdHkoKTtcbiAgICB9XG4gICAgY2hhbmdlTG9hZFdpdGhBaSh2YWx1ZSA9IGZhbHNlKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IHZhbHVlO1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uICYmIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbikge1xuICAgICAgICAgICAgY29uc3QgYnV0dG9uV2l0aEFpID0gdGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uO1xuICAgICAgICAgICAgY29uc3QgYnV0dG9uV2l0aG91dEFpID0gdGhpcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZml4QnV0dG9uV2l0aEFpID0gZ2V0TGFzdENoaWxkKGJ1dHRvbldpdGhBaSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZml4QnV0dG9uV2l0aG91dEFpID0gZ2V0TGFzdENoaWxkKGJ1dHRvbldpdGhvdXRBaSk7XG4gICAgICAgICAgICAgICAgaWYgKGZpeEJ1dHRvbldpdGhBaSkge1xuICAgICAgICAgICAgICAgICAgICBmaXhCdXR0b25XaXRoQWkuc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZpeEJ1dHRvbldpdGhvdXRBaSkge1xuICAgICAgICAgICAgICAgICAgICBmaXhCdXR0b25XaXRob3V0QWkuc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YyZjJmMic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZml4QnV0dG9uV2l0aEFpID0gZ2V0TGFzdENoaWxkKGJ1dHRvbldpdGhBaSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZml4QnV0dG9uV2l0aG91dEFpID0gZ2V0TGFzdENoaWxkKGJ1dHRvbldpdGhvdXRBaSk7XG4gICAgICAgICAgICAgICAgaWYgKGZpeEJ1dHRvbldpdGhBaSkge1xuICAgICAgICAgICAgICAgICAgICBmaXhCdXR0b25XaXRoQWkuc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YyZjJmMic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmaXhCdXR0b25XaXRob3V0QWkpIHtcbiAgICAgICAgICAgICAgICAgICAgZml4QnV0dG9uV2l0aG91dEFpLnN0eWxlLmJvcmRlckNvbG9yID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlUmVtb3ZlQmFja2dyb3VuZFZpc2liaWxpdHkoKTtcbiAgICB9XG4gICAgbG9hZEltYWdlKHNyYykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgICAgICBpbWcuY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcbiAgICAgICAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiByZXNvbHZlKGltZyk7XG4gICAgICAgICAgICBpbWcub25lcnJvciA9IHJlamVjdDtcbiAgICAgICAgICAgIGltZy5zcmMgPSBzcmM7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXRRdWFudGl0eSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnF1YW50aXR5Rm9ybUJsb2NrKVxuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIGNvbnN0IGZvcm0gPSB0aGlzLnF1YW50aXR5Rm9ybUJsb2NrLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcbiAgICAgICAgY29uc3QgaW5wdXQgPSBmb3JtPy5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwicXVhbnRpdHlcIl0nKTtcbiAgICAgICAgaWYgKCFpbnB1dClcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoaW5wdXQudmFsdWUpIHx8IDE7XG4gICAgfVxuICAgIGdldFN1bSgpIHtcbiAgICAgICAgY29uc3QgaGFzRnJvbnQgPSB0aGlzLmxheW91dHMuc29tZShsYXlvdXQgPT4gbGF5b3V0LnZpZXcgPT09ICdmcm9udCcpO1xuICAgICAgICBjb25zdCBoYXNCYWNrID0gdGhpcy5sYXlvdXRzLnNvbWUobGF5b3V0ID0+IGxheW91dC52aWV3ID09PSAnYmFjaycpO1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpXG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgY29uc3QgcHJpY2UgPSBoYXNCYWNrICYmIGhhc0Zyb250XG4gICAgICAgICAgICA/IHByb2R1Y3QuZG91YmxlU2lkZWRQcmljZVxuICAgICAgICAgICAgOiBwcm9kdWN0LnByaWNlO1xuICAgICAgICByZXR1cm4gcHJpY2U7XG4gICAgfVxuICAgIHVwZGF0ZVN1bSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvclN1bUJsb2NrKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBzdW0gPSB0aGlzLmdldFN1bSgpO1xuICAgICAgICBjb25zdCBzdW1UZXh0ID0gZ2V0TGFzdENoaWxkKHRoaXMuZWRpdG9yU3VtQmxvY2spO1xuICAgICAgICBpZiAoc3VtVGV4dCkge1xuICAgICAgICAgICAgc3VtVGV4dC5pbm5lclRleHQgPSBzdW0udG9TdHJpbmcoKSArICcg4oK9JztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbikge1xuICAgICAgICAgICAgY29uc3QgYnV0dG9uQmxvY2sgPSBnZXRMYXN0Q2hpbGQodGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbik7XG4gICAgICAgICAgICBpZiAoYnV0dG9uQmxvY2spIHtcbiAgICAgICAgICAgICAgICBidXR0b25CbG9jay5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBzdW0gPT09IDAgPyAncmdiKDEyMSAxMjEgMTIxKScgOiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBsb2FkUHJvZHVjdCgpIHtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0IHx8ICFwcm9kdWN0LnByaW50Q29uZmlnKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1twcm9kdWN0XSBwcm9kdWN0IG9yIHByaW50Q29uZmlnIG5vdCBmb3VuZCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xlYXJBbGxDYW52YXMoKTtcbiAgICAgICAgZm9yIChjb25zdCBwcmludENvbmZpZyBvZiBwcm9kdWN0LnByaW50Q29uZmlnKSB7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNhbnZhc0ZvclNpZGUocHJpbnRDb25maWcpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlU2lkZSh0aGlzLl9zZWxlY3RTaWRlKTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgZmFsc2UpO1xuICAgICAgICB9LCAxMDApO1xuICAgIH1cbiAgICBjbGVhckFsbENhbnZhcygpIHtcbiAgICAgICAgaWYgKHRoaXMuY2FudmFzZXNDb250YWluZXIpIHtcbiAgICAgICAgICAgIHRoaXMuY2FudmFzZXNDb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jYW52YXNlcy5mb3JFYWNoKGNhbnZhcyA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNhbnZhcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NhbnZhc10g0J7RiNC40LHQutCwINC+0YfQuNGB0YLQutC4IGNhbnZhczonLCBlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jYW52YXNlcyA9IFtdO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzID0gW107XG4gICAgICAgIHRoaXMuYWN0aXZlQ2FudmFzID0gbnVsbDtcbiAgICB9XG4gICAgY3JlYXRlQ2FudmFzRm9yU2lkZShwcmludENvbmZpZykge1xuICAgICAgICBpZiAoIXRoaXMuY2FudmFzZXNDb250YWluZXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tjYW52YXNdIGNhbnZhc2VzQ29udGFpbmVyINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC9Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGF5ZXJzQ2FudmFzQmxvY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgbGF5ZXJzQ2FudmFzQmxvY2suaWQgPSAnbGF5ZXJzLS0nICsgcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgbGF5ZXJzQ2FudmFzQmxvY2suY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXBvc2l0aW9uJyk7XG4gICAgICAgIGxheWVyc0NhbnZhc0Jsb2NrLnNldEF0dHJpYnV0ZSgncmVmJywgcHJpbnRDb25maWcuc2lkZSk7XG4gICAgICAgIGxheWVyc0NhbnZhc0Jsb2NrLnN0eWxlLnpJbmRleCA9ICc3JztcbiAgICAgICAgdGhpcy5jYW52YXNlc0NvbnRhaW5lci5hcHBlbmRDaGlsZChsYXllcnNDYW52YXNCbG9jayk7XG4gICAgICAgIGNvbnN0IGxheWVyc0NhbnZhcyA9IG5ldyBmYWJyaWMuU3RhdGljQ2FudmFzKGxheWVyc0NhbnZhc0Jsb2NrLCB7XG4gICAgICAgICAgICB3aWR0aDogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQsXG4gICAgICAgIH0pO1xuICAgICAgICBsYXllcnNDYW52YXMuc2lkZSA9IHByaW50Q29uZmlnLnNpZGU7XG4gICAgICAgIGxheWVyc0NhbnZhcy5uYW1lID0gJ3N0YXRpYy0nICsgcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgY29uc3QgZWRpdGFibGVDYW52YXNCbG9jayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBlZGl0YWJsZUNhbnZhc0Jsb2NrLmlkID0gJ2VkaXRhYmxlLS0nICsgcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgZWRpdGFibGVDYW52YXNCbG9jay5zZXRBdHRyaWJ1dGUoJ3JlZicsIHByaW50Q29uZmlnLnNpZGUpO1xuICAgICAgICBlZGl0YWJsZUNhbnZhc0Jsb2NrLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1wb3NpdGlvbicpO1xuICAgICAgICBlZGl0YWJsZUNhbnZhc0Jsb2NrLnN0eWxlLnpJbmRleCA9ICc5JztcbiAgICAgICAgdGhpcy5jYW52YXNlc0NvbnRhaW5lci5hcHBlbmRDaGlsZChlZGl0YWJsZUNhbnZhc0Jsb2NrKTtcbiAgICAgICAgY29uc3QgZWRpdGFibGVDYW52YXMgPSBuZXcgZmFicmljLkNhbnZhcyhlZGl0YWJsZUNhbnZhc0Jsb2NrLCB7XG4gICAgICAgICAgICBjb250cm9sc0Fib3ZlT3ZlcmxheTogdHJ1ZSxcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgIHVuaWZvcm1TY2FsaW5nOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBlZGl0YWJsZUNhbnZhcy5zaWRlID0gcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgZWRpdGFibGVDYW52YXMubmFtZSA9ICdlZGl0YWJsZS0nICsgcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgdGhpcy5sYXllcnNDYW52YXNlcy5wdXNoKGxheWVyc0NhbnZhcyk7XG4gICAgICAgIHRoaXMuY2FudmFzZXMucHVzaChlZGl0YWJsZUNhbnZhcyk7XG4gICAgICAgIGlmICh0aGlzLmNhbnZhc2VzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVDYW52YXMgPSBlZGl0YWJsZUNhbnZhcztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluaXRNYWluQ2FudmFzKGVkaXRhYmxlQ2FudmFzLCBwcmludENvbmZpZyk7XG4gICAgfVxuICAgIGluaXRNYWluQ2FudmFzKGNhbnZhcywgcHJpbnRDb25maWcpIHtcbiAgICAgICAgaWYgKCFjYW52YXMgfHwgIShjYW52YXMgaW5zdGFuY2VvZiBmYWJyaWMuQ2FudmFzKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbY2FudmFzXSBjYW52YXMg0L3QtSDQstCw0LvQuNC00LXQvScpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHdpZHRoID0gcHJpbnRDb25maWcuc2l6ZS53aWR0aCAvIDYwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGg7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IHByaW50Q29uZmlnLnNpemUuaGVpZ2h0IC8gNjAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQ7XG4gICAgICAgIGNvbnN0IGxlZnQgPSAodGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCAtIHdpZHRoKSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueCAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgpO1xuICAgICAgICBjb25zdCB0b3AgPSAodGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQgLSBoZWlnaHQpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi55IC8gMTAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQpO1xuICAgICAgICBjb25zdCBjbGlwQXJlYSA9IG5ldyBmYWJyaWMuUmVjdCh7XG4gICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodCxcbiAgICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgICB0b3AsXG4gICAgICAgICAgICBmaWxsOiAncmdiKDI1NSwgMCwgMCknLFxuICAgICAgICAgICAgbmFtZTogJ2FyZWE6Y2xpcCcsXG4gICAgICAgICAgICBldmVudGVkOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGFyZWFCb3JkZXIgPSBuZXcgZmFicmljLlJlY3Qoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoIC0gMyxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0IC0gMyxcbiAgICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgICB0b3AsXG4gICAgICAgICAgICBmaWxsOiAncmdiYSgwLDAsMCwwKScsXG4gICAgICAgICAgICBzdHJva2VXaWR0aDogMyxcbiAgICAgICAgICAgIHN0cm9rZTogJ3JnYigyNTQsIDk0LCA1OCknLFxuICAgICAgICAgICAgbmFtZTogJ2FyZWE6Ym9yZGVyJyxcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuMyxcbiAgICAgICAgICAgIGV2ZW50ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgc2VsZWN0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICBoYXNDb250cm9sczogZmFsc2UsXG4gICAgICAgICAgICBzdHJva2VEYXNoQXJyYXk6IFs1LCA1XSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNhbnZhcy5hZGQoYXJlYUJvcmRlcik7XG4gICAgICAgIGNhbnZhcy5jbGlwUGF0aCA9IGNsaXBBcmVhO1xuICAgICAgICB0aGlzLnNldHVwQ2FudmFzRXZlbnRIYW5kbGVycyhjYW52YXMsIHByaW50Q29uZmlnKTtcbiAgICB9XG4gICAgc2V0dXBDYW52YXNFdmVudEhhbmRsZXJzKGNhbnZhcywgcHJpbnRDb25maWcpIHtcbiAgICAgICAgY2FudmFzLm9uKCdtb3VzZTpkb3duJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYm9yZGVyID0gdGhpcy5nZXRPYmplY3QoJ2FyZWE6Ym9yZGVyJywgY2FudmFzKTtcbiAgICAgICAgICAgIGlmIChib3JkZXIpIHtcbiAgICAgICAgICAgICAgICBib3JkZXIuc2V0KCdvcGFjaXR5JywgMC44KTtcbiAgICAgICAgICAgICAgICBjYW52YXMucmVxdWVzdFJlbmRlckFsbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLm9uKCdtb3VzZTp1cCcsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGJvcmRlciA9IHRoaXMuZ2V0T2JqZWN0KCdhcmVhOmJvcmRlcicsIGNhbnZhcyk7XG4gICAgICAgICAgICBpZiAoYm9yZGVyKSB7XG4gICAgICAgICAgICAgICAgYm9yZGVyLnNldCgnb3BhY2l0eScsIDAuMyk7XG4gICAgICAgICAgICAgICAgY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNhbnZhcy5vbignb2JqZWN0OnJvdGF0aW5nJywgKGUpID0+IHtcbiAgICAgICAgICAgIGlmIChlLnRhcmdldD8uYW5nbGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFuZ2xlcyA9IFswLCA5MCwgMTgwLCAyNzBdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRBbmdsZSA9IGUudGFyZ2V0LmFuZ2xlICUgMzYwO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc25hcEFuZ2xlIG9mIGFuZ2xlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoY3VycmVudEFuZ2xlIC0gc25hcEFuZ2xlKSA8IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUudGFyZ2V0LnJvdGF0ZShzbmFwQW5nbGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLm9uKCdvYmplY3Q6bW92aW5nJywgKGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlT2JqZWN0TW92aW5nKGUsIGNhbnZhcywgcHJpbnRDb25maWcpO1xuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLm9uKCdvYmplY3Q6bW9kaWZpZWQnLCAoZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVPYmplY3RNb2RpZmllZChlLCBjYW52YXMsIHByaW50Q29uZmlnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGhhbmRsZU9iamVjdE1vdmluZyhlLCBjYW52YXMsIHByaW50Q29uZmlnKSB7XG4gICAgICAgIGlmICghZS50YXJnZXQgfHwgZS50YXJnZXQubmFtZSA9PT0gJ2FyZWE6Ym9yZGVyJyB8fCBlLnRhcmdldC5uYW1lID09PSAnYXJlYTpjbGlwJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0cy5maW5kKGwgPT4gbC5pZCA9PT0gZS50YXJnZXQubmFtZSk7XG4gICAgICAgIGlmICghbGF5b3V0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB3aWR0aCA9IHByaW50Q29uZmlnLnNpemUud2lkdGggLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBwcmludENvbmZpZy5zaXplLmhlaWdodCAvIDYwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0O1xuICAgICAgICBjb25zdCBsZWZ0ID0gTWF0aC5yb3VuZCgodGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCAtIHdpZHRoKSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueCAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgpKTtcbiAgICAgICAgY29uc3QgdG9wID0gTWF0aC5yb3VuZCgodGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQgLSBoZWlnaHQpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi55IC8gMTAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQpKTtcbiAgICAgICAgY29uc3Qgb2JqV2lkdGggPSBlLnRhcmdldC53aWR0aCAqIGUudGFyZ2V0LnNjYWxlWDtcbiAgICAgICAgY29uc3Qgb2JqSGVpZ2h0ID0gZS50YXJnZXQuaGVpZ2h0ICogZS50YXJnZXQuc2NhbGVZO1xuICAgICAgICBjb25zdCBvYmpDZW50ZXJMZWZ0ID0gZS50YXJnZXQubGVmdCArIG9ialdpZHRoIC8gMjtcbiAgICAgICAgY29uc3Qgb2JqQ2VudGVyVG9wID0gZS50YXJnZXQudG9wICsgb2JqSGVpZ2h0IC8gMjtcbiAgICAgICAgY29uc3QgbmVhclggPSBNYXRoLmFicyhvYmpDZW50ZXJMZWZ0IC0gKGxlZnQgKyB3aWR0aCAvIDIpKSA8IDc7XG4gICAgICAgIGNvbnN0IG5lYXJZID0gTWF0aC5hYnMob2JqQ2VudGVyVG9wIC0gKHRvcCArIGhlaWdodCAvIDIpKSA8IDc7XG4gICAgICAgIGlmIChuZWFyWCkge1xuICAgICAgICAgICAgdGhpcy5zaG93R3VpZGVsaW5lKGNhbnZhcywgJ3ZlcnRpY2FsJywgbGVmdCArIHdpZHRoIC8gMiwgMCwgbGVmdCArIHdpZHRoIC8gMiwgdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQpO1xuICAgICAgICAgICAgZS50YXJnZXQuc2V0KHsgbGVmdDogbGVmdCArIHdpZHRoIC8gMiAtIG9ialdpZHRoIC8gMiB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaGlkZUd1aWRlbGluZShjYW52YXMsICd2ZXJ0aWNhbCcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuZWFyWSkge1xuICAgICAgICAgICAgdGhpcy5zaG93R3VpZGVsaW5lKGNhbnZhcywgJ2hvcml6b250YWwnLCAwLCB0b3AgKyBoZWlnaHQgLyAyLCB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoLCB0b3AgKyBoZWlnaHQgLyAyKTtcbiAgICAgICAgICAgIGUudGFyZ2V0LnNldCh7IHRvcDogdG9wICsgaGVpZ2h0IC8gMiAtIG9iakhlaWdodCAvIDIgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmhpZGVHdWlkZWxpbmUoY2FudmFzLCAnaG9yaXpvbnRhbCcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGhhbmRsZU9iamVjdE1vZGlmaWVkKGUsIGNhbnZhcywgcHJpbnRDb25maWcpIHtcbiAgICAgICAgY29uc3Qgb2JqZWN0ID0gZS50YXJnZXQ7XG4gICAgICAgIGlmICghb2JqZWN0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmhpZGVHdWlkZWxpbmUoY2FudmFzLCAndmVydGljYWwnKTtcbiAgICAgICAgdGhpcy5oaWRlR3VpZGVsaW5lKGNhbnZhcywgJ2hvcml6b250YWwnKTtcbiAgICAgICAgY29uc3QgbGF5b3V0ID0gdGhpcy5sYXlvdXRzLmZpbmQobCA9PiBsLmlkID09PSBvYmplY3QubmFtZSk7XG4gICAgICAgIGlmICghbGF5b3V0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB3aWR0aCA9IHByaW50Q29uZmlnLnNpemUud2lkdGggLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBwcmludENvbmZpZy5zaXplLmhlaWdodCAvIDYwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0O1xuICAgICAgICBjb25zdCBsZWZ0ID0gTWF0aC5yb3VuZCgodGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCAtIHdpZHRoKSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueCAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgpKTtcbiAgICAgICAgY29uc3QgdG9wID0gTWF0aC5yb3VuZCgodGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQgLSBoZWlnaHQpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi55IC8gMTAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQpKTtcbiAgICAgICAgbGF5b3V0LnBvc2l0aW9uLnggPSAob2JqZWN0LmxlZnQgLSBsZWZ0KSAvIHdpZHRoO1xuICAgICAgICBsYXlvdXQucG9zaXRpb24ueSA9IChvYmplY3QudG9wIC0gdG9wKSAvIGhlaWdodDtcbiAgICAgICAgbGF5b3V0LnNpemUgPSBvYmplY3Quc2NhbGVYO1xuICAgICAgICBsYXlvdXQuYXNwZWN0UmF0aW8gPSBvYmplY3Quc2NhbGVZIC8gb2JqZWN0LnNjYWxlWDtcbiAgICAgICAgbGF5b3V0LmFuZ2xlID0gb2JqZWN0LmFuZ2xlO1xuICAgICAgICB0aGlzLnNhdmVMYXlvdXRzKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycikpO1xuICAgIH1cbiAgICBzaG93R3VpZGVsaW5lKGNhbnZhcywgdHlwZSwgeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IGBndWlkZWxpbmU6JHt0eXBlfWA7XG4gICAgICAgIGxldCBndWlkZWxpbmUgPSB0aGlzLmdldE9iamVjdChuYW1lLCBjYW52YXMpO1xuICAgICAgICBpZiAoIWd1aWRlbGluZSkge1xuICAgICAgICAgICAgZ3VpZGVsaW5lID0gbmV3IGZhYnJpYy5MaW5lKFt4MSwgeTEsIHgyLCB5Ml0sIHtcbiAgICAgICAgICAgICAgICBzdHJva2U6ICdyZ2IoMjU0LCA5NCwgNTgpJyxcbiAgICAgICAgICAgICAgICBzdHJva2VXaWR0aDogMixcbiAgICAgICAgICAgICAgICBzdHJva2VEYXNoQXJyYXk6IFs1LCA1XSxcbiAgICAgICAgICAgICAgICBzZWxlY3RhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBldmVudGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZ3VpZGVsaW5lKSB7XG4gICAgICAgICAgICAgICAgY2FudmFzLmFkZChndWlkZWxpbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGhpZGVHdWlkZWxpbmUoY2FudmFzLCB0eXBlKSB7XG4gICAgICAgIGNvbnN0IGd1aWRlbGluZSA9IHRoaXMuZ2V0T2JqZWN0KGBndWlkZWxpbmU6JHt0eXBlfWAsIGNhbnZhcyk7XG4gICAgICAgIGlmIChndWlkZWxpbmUpIHtcbiAgICAgICAgICAgIGNhbnZhcy5yZW1vdmUoZ3VpZGVsaW5lKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRPYmplY3QobmFtZSwgY2FudmFzKSB7XG4gICAgICAgIGNvbnN0IHRhcmdldENhbnZhcyA9IGNhbnZhcyB8fCB0aGlzLmFjdGl2ZUNhbnZhcyB8fCB0aGlzLmNhbnZhc2VzWzBdO1xuICAgICAgICBpZiAoIXRhcmdldENhbnZhcylcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiB0YXJnZXRDYW52YXMuZ2V0T2JqZWN0cygpLmZpbmQob2JqID0+IG9iai5uYW1lID09PSBuYW1lKTtcbiAgICB9XG4gICAgc2V0QWN0aXZlU2lkZShzaWRlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tjYW52YXNdINCj0YHRgtCw0L3QvtCy0LrQsCDQsNC60YLQuNCy0L3QvtC5INGB0YLQvtGA0L7QvdGLOicsIHNpZGUpO1xuICAgICAgICB0aGlzLmNhbnZhc2VzLmZvckVhY2goY2FudmFzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhc0VsZW1lbnQgPSBjYW52YXMuZ2V0RWxlbWVudCgpO1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyRWxlbWVudCA9IGNhbnZhc0VsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgIGlmIChjYW52YXMuc2lkZSA9PT0gc2lkZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ2FudmFzID0gY2FudmFzO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FudmFzRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYW52YXNFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzLmZvckVhY2gobGF5ZXJzQ2FudmFzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhc0VsZW1lbnQgPSBsYXllcnNDYW52YXMuZ2V0RWxlbWVudCgpO1xuICAgICAgICAgICAgY2FudmFzRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gbGF5ZXJzQ2FudmFzLnNpZGUgPT09IHNpZGUgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fc2VsZWN0U2lkZSA9IHNpZGU7XG4gICAgfVxuICAgIGFzeW5jIGFkZExheW91dFRvQ2FudmFzKGxheW91dCkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc2VzLmZpbmQoYyA9PiBjLnNpZGUgPT09IGxheW91dC52aWV3KTtcbiAgICAgICAgaWYgKCFjYW52YXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2NhbnZhc10gY2FudmFzINC00LvRjyAke2xheW91dC52aWV3fSDQvdC1INC90LDQudC00LXQvWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgcHJpbnRDb25maWcgPSBwcm9kdWN0LnByaW50Q29uZmlnLmZpbmQocGMgPT4gcGMuc2lkZSA9PT0gbGF5b3V0LnZpZXcpO1xuICAgICAgICBpZiAoIXByaW50Q29uZmlnKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB3aWR0aCA9IHByaW50Q29uZmlnLnNpemUud2lkdGggLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBwcmludENvbmZpZy5zaXplLmhlaWdodCAvIDYwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0O1xuICAgICAgICBjb25zdCBsZWZ0ID0gTWF0aC5yb3VuZCgodGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCAtIHdpZHRoKSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueCAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgpKTtcbiAgICAgICAgY29uc3QgdG9wID0gTWF0aC5yb3VuZCgodGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQgLSBoZWlnaHQpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi55IC8gMTAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQpKTtcbiAgICAgICAgY29uc3QgYWJzb2x1dGVMZWZ0ID0gbGVmdCArICh3aWR0aCAqIGxheW91dC5wb3NpdGlvbi54KTtcbiAgICAgICAgY29uc3QgYWJzb2x1dGVUb3AgPSB0b3AgKyAoaGVpZ2h0ICogbGF5b3V0LnBvc2l0aW9uLnkpO1xuICAgICAgICBpZiAobGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSkge1xuICAgICAgICAgICAgY29uc3QgaW1hZ2UgPSBuZXcgZmFicmljLkltYWdlKGF3YWl0IHRoaXMubG9hZEltYWdlKGxheW91dC51cmwpKTtcbiAgICAgICAgICAgIGlmIChsYXlvdXQuc2l6ZSA9PT0gMSAmJiBpbWFnZS53aWR0aCA+IHdpZHRoKSB7XG4gICAgICAgICAgICAgICAgbGF5b3V0LnNpemUgPSB3aWR0aCAvIGltYWdlLndpZHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW1hZ2Uuc2V0KHtcbiAgICAgICAgICAgICAgICBsZWZ0OiBhYnNvbHV0ZUxlZnQsXG4gICAgICAgICAgICAgICAgdG9wOiBhYnNvbHV0ZVRvcCxcbiAgICAgICAgICAgICAgICBuYW1lOiBsYXlvdXQuaWQsXG4gICAgICAgICAgICAgICAgbGF5b3V0VXJsOiBsYXlvdXQudXJsLFxuICAgICAgICAgICAgICAgIHNjYWxlWDogbGF5b3V0LnNpemUsXG4gICAgICAgICAgICAgICAgc2NhbGVZOiBsYXlvdXQuc2l6ZSAqIGxheW91dC5hc3BlY3RSYXRpbyxcbiAgICAgICAgICAgICAgICBhbmdsZTogbGF5b3V0LmFuZ2xlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjYW52YXMuYWRkKGltYWdlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsYXlvdXQuaXNUZXh0TGF5b3V0KCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSBuZXcgZmFicmljLlRleHQobGF5b3V0LnRleHQsIHtcbiAgICAgICAgICAgICAgICBmb250RmFtaWx5OiBsYXlvdXQuZm9udC5mYW1pbHksXG4gICAgICAgICAgICAgICAgZm9udFNpemU6IGxheW91dC5mb250LnNpemUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRleHQuc2V0KHtcbiAgICAgICAgICAgICAgICB0b3A6IGFic29sdXRlVG9wLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGFic29sdXRlTGVmdCxcbiAgICAgICAgICAgICAgICBuYW1lOiBsYXlvdXQuaWQsXG4gICAgICAgICAgICAgICAgc2NhbGVYOiBsYXlvdXQuc2l6ZSxcbiAgICAgICAgICAgICAgICBzY2FsZVk6IGxheW91dC5zaXplICogbGF5b3V0LmFzcGVjdFJhdGlvLFxuICAgICAgICAgICAgICAgIGFuZ2xlOiBsYXlvdXQuYW5nbGUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNhbnZhcy5hZGQodGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlTGF5b3V0cygpIHtcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZUNhbnZhcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzRm9yU2lkZSh0aGlzLl9zZWxlY3RTaWRlKTtcbiAgICB9XG4gICAgdXBkYXRlTGF5b3V0c0ZvclNpZGUoc2lkZSkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc2VzLmZpbmQoYyA9PiBjLnNpZGUgPT09IHNpZGUpO1xuICAgICAgICBpZiAoIWNhbnZhcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgb2JqZWN0cyA9IGNhbnZhcy5nZXRPYmplY3RzKCk7XG4gICAgICAgIGNvbnN0IG9iamVjdHNUb1JlbW92ZSA9IG9iamVjdHNcbiAgICAgICAgICAgIC5maWx0ZXIob2JqID0+IG9iai5uYW1lICE9PSAnYXJlYTpib3JkZXInICYmIG9iai5uYW1lICE9PSAnYXJlYTpjbGlwJyAmJiAhb2JqLm5hbWU/LnN0YXJ0c1dpdGgoJ2d1aWRlbGluZScpKVxuICAgICAgICAgICAgLmZpbHRlcihvYmogPT4gIXRoaXMubGF5b3V0cy5maW5kKGxheW91dCA9PiBsYXlvdXQuaWQgPT09IG9iai5uYW1lKSk7XG4gICAgICAgIG9iamVjdHNUb1JlbW92ZS5mb3JFYWNoKG9iaiA9PiB7XG4gICAgICAgICAgICBjYW52YXMucmVtb3ZlKG9iaik7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBsYXlvdXRzRm9yU2lkZSA9IHRoaXMubGF5b3V0cy5maWx0ZXIobGF5b3V0ID0+IGxheW91dC52aWV3ID09PSBzaWRlKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0c1RvVXBkYXRlID0gW107XG4gICAgICAgIGNvbnN0IG9iamVjdHNUb0FkZCA9IFtdO1xuICAgICAgICBsYXlvdXRzRm9yU2lkZS5mb3JFYWNoKGxheW91dCA9PiB7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ09iaiA9IG9iamVjdHMuZmluZChvYmogPT4gb2JqLm5hbWUgPT09IGxheW91dC5pZCk7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdPYmopIHtcbiAgICAgICAgICAgICAgICBpZiAobGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSAmJiBleGlzdGluZ09iai5sYXlvdXRVcmwgIT09IGxheW91dC51cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2NhbnZhc10gTGF5b3V0ICR7bGF5b3V0LmlkfSDQuNC30LzQtdC90LjQu9GB0Y8sINGC0YDQtdCx0YPQtdGC0YHRjyDQvtCx0L3QvtCy0LvQtdC90LjQtWApO1xuICAgICAgICAgICAgICAgICAgICBvYmplY3RzVG9VcGRhdGUucHVzaChsYXlvdXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG9iamVjdHNUb0FkZC5wdXNoKGxheW91dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBvYmplY3RzVG9VcGRhdGUuZm9yRWFjaChsYXlvdXQgPT4ge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdPYmogPSBvYmplY3RzLmZpbmQob2JqID0+IG9iai5uYW1lID09PSBsYXlvdXQuaWQpO1xuICAgICAgICAgICAgaWYgKGV4aXN0aW5nT2JqKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2NhbnZhc10g0KPQtNCw0LvRj9C10Lwg0YHRgtCw0YDRi9C5INC+0LHRitC10LrRgiDQtNC70Y8g0L7QsdC90L7QstC70LXQvdC40Y86ICR7bGF5b3V0LmlkfWApO1xuICAgICAgICAgICAgICAgIGNhbnZhcy5yZW1vdmUoZXhpc3RpbmdPYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2NhbnZhc10g0JTQvtCx0LDQstC70Y/QtdC8INC+0LHQvdC+0LLQu9C10L3QvdGL0Lkg0L7QsdGK0LXQutGCOiAke2xheW91dC5pZH1gKTtcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5b3V0VG9DYW52YXMobGF5b3V0KTtcbiAgICAgICAgfSk7XG4gICAgICAgIG9iamVjdHNUb0FkZC5mb3JFYWNoKGxheW91dCA9PiB7XG4gICAgICAgICAgICB0aGlzLmFkZExheW91dFRvQ2FudmFzKGxheW91dCk7XG4gICAgICAgIH0pO1xuICAgICAgICBjYW52YXMucmVuZGVyQWxsKCk7XG4gICAgfVxuICAgIGFzeW5jIHByZWxvYWRBbGxNb2NrdXBzKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbcHJlbG9hZF0g0J3QsNGH0LDQu9C+INC/0YDQtdC00LfQsNCz0YDRg9C30LrQuCBtb2NrdXBzJyk7XG4gICAgICAgIGZvciAoY29uc3QgcHJvZHVjdCBvZiB0aGlzLnByb2R1Y3RDb25maWdzKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG1vY2t1cCBvZiBwcm9kdWN0Lm1vY2t1cHMpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2NrdXBEYXRhVXJsID0gYXdhaXQgdGhpcy5nZXRJbWFnZURhdGEobW9ja3VwLnVybCk7XG4gICAgICAgICAgICAgICAgICAgIG1vY2t1cC51cmwgPSBtb2NrdXBEYXRhVXJsO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbcHJlbG9hZF0gTW9ja3VwINC30LDQs9GA0YPQttC10L06ICR7bW9ja3VwLmNvbG9yLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbcHJlbG9hZF0g0J7RiNC40LHQutCwINC30LDQs9GA0YPQt9C60LggbW9ja3VwICR7bW9ja3VwLnVybH06YCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdbcHJlbG9hZF0g0J/RgNC10LTQt9Cw0LPRgNGD0LfQutCwINC30LDQstC10YDRiNC10L3QsCcpO1xuICAgIH1cbiAgICBhc3luYyBnZXRJbWFnZURhdGEodXJsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvYWRBbmRDb252ZXJ0SW1hZ2UodXJsKTtcbiAgICB9XG4gICAgYXN5bmMgdXBsb2FkSW1hZ2UoZmlsZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkXSDQl9Cw0LPRgNGD0LfQutCwINGE0LDQudC70LA6JywgZmlsZS5uYW1lKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhVXJsID0gZS50YXJnZXQ/LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkRGF0YVVybCA9IGF3YWl0IHRoaXMuZ2V0SW1hZ2VEYXRhKGRhdGFVcmwpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkXSDQpNCw0LnQuyDRg9GB0L/QtdGI0L3QviDQt9Cw0LPRgNGD0LbQtdC9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoY29udmVydGVkRGF0YVVybCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbdXBsb2FkXSDQntGI0LjQsdC60LAg0L7QsdGA0LDQsdC+0YLQutC4INGE0LDQudC70LA6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZWFkZXIub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbdXBsb2FkXSDQntGI0LjQsdC60LAg0YfRgtC10L3QuNGPINGE0LDQudC70LAnKTtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCfQndC1INGD0LTQsNC70L7RgdGMINC/0YDQvtGH0LjRgtCw0YLRjCDRhNCw0LnQuycpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIHVwbG9hZEltYWdlVG9TZXJ2ZXIoYmFzZTY0KSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWRdINCX0LDQs9GA0YPQt9C60LAg0LjQt9C+0LHRgNCw0LbQtdC90LjRjyDQvdCwINGB0LXRgNCy0LXRgCcpO1xuICAgICAgICBjb25zdCB1c2VySWQgPSBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLmdldFVzZXJJZCgpO1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHRoaXMuYXBpQ29uZmlnLnVwbG9hZEltYWdlLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgaW1hZ2U6IGJhc2U2NCwgdXNlcl9pZDogdXNlcklkIH0pLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkXSDQmNC30L7QsdGA0LDQttC10L3QuNC1INC30LDQs9GA0YPQttC10L3QviDQvdCwINGB0LXRgNCy0LXRgDonLCBkYXRhLmltYWdlX3VybCk7XG4gICAgICAgIHJldHVybiBkYXRhLmltYWdlX3VybDtcbiAgICB9XG4gICAgZ2V0UHJvZHVjdE5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk/LnByb2R1Y3ROYW1lIHx8ICcnO1xuICAgIH1cbiAgICBjYXBpdGFsaXplRmlyc3RMZXR0ZXIoc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSk7XG4gICAgfVxuICAgIGdldE1vY2t1cFVybChzaWRlKSB7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBjb25zdCBtb2NrdXAgPSBwcm9kdWN0Lm1vY2t1cHMuZmluZChtb2NrdXAgPT4gbW9ja3VwLnNpZGUgPT09IHNpZGUgJiYgbW9ja3VwLmNvbG9yLm5hbWUgPT09IHRoaXMuX3NlbGVjdENvbG9yLm5hbWUpO1xuICAgICAgICByZXR1cm4gbW9ja3VwID8gbW9ja3VwLnVybCA6IG51bGw7XG4gICAgfVxuICAgIGFzeW5jIGV4cG9ydEFydCh3aXRoTW9ja3VwID0gdHJ1ZSwgcmVzb2x1dGlvbiA9IDEwMjQpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgIGNvbnN0IHNpZGVzV2l0aExheWVycyA9IHRoaXMuZ2V0U2lkZXNXaXRoTGF5ZXJzKCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tleHBvcnRdINCd0LDQudC00LXQvdGLINGB0YLQvtGA0L7QvdGLINGBINGB0LvQvtGP0LzQuDonLCBzaWRlc1dpdGhMYXllcnMsICcoZnJvbnQg0L/QtdGA0LLRi9C5KScsIHdpdGhNb2NrdXAgPyAn0YEg0LzQvtC60LDQv9C+0LwnIDogJ9Cx0LXQtyDQvNC+0LrQsNC/0LAnLCBg0YDQsNC30YDQtdGI0LXQvdC40LU6ICR7cmVzb2x1dGlvbn1weGApO1xuICAgICAgICBjb25zdCBleHBvcnRQcm9taXNlcyA9IHNpZGVzV2l0aExheWVycy5tYXAoYXN5bmMgKHNpZGUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXhwb3J0ZWRTaWRlID0gYXdhaXQgdGhpcy5leHBvcnRTaWRlKHNpZGUsIHdpdGhNb2NrdXAsIHJlc29sdXRpb24pO1xuICAgICAgICAgICAgICAgIGlmIChleHBvcnRlZFNpZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0KHRgtC+0YDQvtC90LAgJHtzaWRlfSDRg9GB0L/QtdGI0L3QviDRjdC60YHQv9C+0YDRgtC40YDQvtCy0LDQvdCwYCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHNpZGUsIGRhdGE6IGV4cG9ydGVkU2lkZSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtleHBvcnRdINCe0YjQuNCx0LrQsCDQv9GA0Lgg0Y3QutGB0L/QvtGA0YLQtSDRgdGC0L7RgNC+0L3RiyAke3NpZGV9OmAsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZXhwb3J0ZWRTaWRlcyA9IGF3YWl0IFByb21pc2UuYWxsKGV4cG9ydFByb21pc2VzKTtcbiAgICAgICAgZXhwb3J0ZWRTaWRlcy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHRbaXRlbS5zaWRlXSA9IGl0ZW0uZGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCt0LrRgdC/0L7RgNGCINC30LDQstC10YDRiNC10L0g0LTQu9GPICR7T2JqZWN0LmtleXMocmVzdWx0KS5sZW5ndGh9INGB0YLQvtGA0L7QvWApO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBnZXRTaWRlc1dpdGhMYXllcnMoKSB7XG4gICAgICAgIGNvbnN0IGFsbFNpZGVzV2l0aExheWVycyA9IFsuLi5uZXcgU2V0KHRoaXMubGF5b3V0cy5tYXAobGF5b3V0ID0+IGxheW91dC52aWV3KSldO1xuICAgICAgICByZXR1cm4gYWxsU2lkZXNXaXRoTGF5ZXJzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIGlmIChhID09PSAnZnJvbnQnKVxuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIGlmIChiID09PSAnZnJvbnQnKVxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBleHBvcnRTaWRlKHNpZGUsIHdpdGhNb2NrdXAgPSB0cnVlLCByZXNvbHV0aW9uID0gMTAyNCkge1xuICAgICAgICBjb25zdCBjYW52YXNlcyA9IHRoaXMuZ2V0Q2FudmFzZXNGb3JTaWRlKHNpZGUpO1xuICAgICAgICBpZiAoIWNhbnZhc2VzLmVkaXRhYmxlQ2FudmFzKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtleHBvcnRdIENhbnZhcyDQtNC70Y8g0YHRgtC+0YDQvtC90YsgJHtzaWRlfSDQvdC1INC90LDQudC00LXQvWApO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzRm9yU2lkZShzaWRlKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0K3QutGB0L/QvtGA0YLQuNGA0YPQtdC8INGB0YLQvtGA0L7QvdGDICR7c2lkZX0ke3dpdGhNb2NrdXAgPyAnINGBINC80L7QutCw0L/QvtC8JyA6ICcg0LHQtdC3INC80L7QutCw0L/QsCd9ICgke3Jlc29sdXRpb259cHgpLi4uYCk7XG4gICAgICAgIGlmICghd2l0aE1vY2t1cCkge1xuICAgICAgICAgICAgY29uc3QgY3JvcHBlZENhbnZhcyA9IGF3YWl0IHRoaXMuZXhwb3J0RGVzaWduV2l0aENsaXBQYXRoKGNhbnZhc2VzLmVkaXRhYmxlQ2FudmFzLCBjYW52YXNlcy5sYXllcnNDYW52YXMsIHNpZGUsIHJlc29sdXRpb24pO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0K3QutGB0L/QvtGA0YLQuNGA0L7QstCw0L0g0YfQuNGB0YLRi9C5INC00LjQt9Cw0LnQvSDQtNC70Y8gJHtzaWRlfSAo0L7QsdGA0LXQt9Cw0L0g0L/QviBjbGlwUGF0aClgKTtcbiAgICAgICAgICAgIHJldHVybiBjcm9wcGVkQ2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJywgMS4wKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtb2NrdXBJbWcgPSBhd2FpdCB0aGlzLmxvYWRNb2NrdXBGb3JTaWRlKHNpZGUpO1xuICAgICAgICBpZiAoIW1vY2t1cEltZylcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBjb25zdCB7IGNhbnZhczogdGVtcENhbnZhcywgY3R4LCBtb2NrdXBEaW1lbnNpb25zIH0gPSB0aGlzLmNyZWF0ZUV4cG9ydENhbnZhcyhyZXNvbHV0aW9uLCBtb2NrdXBJbWcpO1xuICAgICAgICBjb25zdCBkZXNpZ25DYW52YXMgPSBhd2FpdCB0aGlzLmNyZWF0ZURlc2lnbkNhbnZhcyhjYW52YXNlcy5lZGl0YWJsZUNhbnZhcywgY2FudmFzZXMubGF5ZXJzQ2FudmFzLCBzaWRlKTtcbiAgICAgICAgY3R4LmRyYXdJbWFnZShkZXNpZ25DYW52YXMsIDAsIDAsIGRlc2lnbkNhbnZhcy53aWR0aCwgZGVzaWduQ2FudmFzLmhlaWdodCwgbW9ja3VwRGltZW5zaW9ucy54LCBtb2NrdXBEaW1lbnNpb25zLnksIG1vY2t1cERpbWVuc2lvbnMud2lkdGgsIG1vY2t1cERpbWVuc2lvbnMuaGVpZ2h0KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0J3QsNC70L7QttC10L0g0LTQuNC30LDQudC9INC90LAg0LzQvtC60LDQvyDQtNC70Y8gJHtzaWRlfWApO1xuICAgICAgICByZXR1cm4gdGVtcENhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycsIDEuMCk7XG4gICAgfVxuICAgIGdldENhbnZhc2VzRm9yU2lkZShzaWRlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlZGl0YWJsZUNhbnZhczogdGhpcy5jYW52YXNlcy5maW5kKGMgPT4gYy5zaWRlID09PSBzaWRlKSxcbiAgICAgICAgICAgIGxheWVyc0NhbnZhczogdGhpcy5sYXllcnNDYW52YXNlcy5maW5kKGMgPT4gYy5zaWRlID09PSBzaWRlKVxuICAgICAgICB9O1xuICAgIH1cbiAgICBhc3luYyBsb2FkTW9ja3VwRm9yU2lkZShzaWRlKSB7XG4gICAgICAgIGNvbnN0IG1vY2t1cFVybCA9IHRoaXMuZ2V0TW9ja3VwVXJsKHNpZGUpO1xuICAgICAgICBpZiAoIW1vY2t1cFVybCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZXhwb3J0XSDQnNC+0LrQsNC/INC00LvRjyDRgdGC0L7RgNC+0L3RiyAke3NpZGV9INC90LUg0L3QsNC50LTQtdC9YCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtb2NrdXBJbWcgPSBhd2FpdCB0aGlzLmxvYWRJbWFnZShtb2NrdXBVcmwpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQl9Cw0LPRgNGD0LbQtdC9INC80L7QutCw0L8g0LTQu9GPICR7c2lkZX06ICR7bW9ja3VwVXJsfWApO1xuICAgICAgICByZXR1cm4gbW9ja3VwSW1nO1xuICAgIH1cbiAgICBjcmVhdGVFeHBvcnRDYW52YXMoZXhwb3J0U2l6ZSwgbW9ja3VwSW1nKSB7XG4gICAgICAgIGNvbnN0IHRlbXBDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgY29uc3QgY3R4ID0gdGVtcENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB0ZW1wQ2FudmFzLndpZHRoID0gZXhwb3J0U2l6ZTtcbiAgICAgICAgdGVtcENhbnZhcy5oZWlnaHQgPSBleHBvcnRTaXplO1xuICAgICAgICBjb25zdCBtb2NrdXBTY2FsZSA9IE1hdGgubWluKGV4cG9ydFNpemUgLyBtb2NrdXBJbWcud2lkdGgsIGV4cG9ydFNpemUgLyBtb2NrdXBJbWcuaGVpZ2h0KTtcbiAgICAgICAgY29uc3Qgc2NhbGVkTW9ja3VwV2lkdGggPSBtb2NrdXBJbWcud2lkdGggKiBtb2NrdXBTY2FsZTtcbiAgICAgICAgY29uc3Qgc2NhbGVkTW9ja3VwSGVpZ2h0ID0gbW9ja3VwSW1nLmhlaWdodCAqIG1vY2t1cFNjYWxlO1xuICAgICAgICBjb25zdCBtb2NrdXBYID0gKGV4cG9ydFNpemUgLSBzY2FsZWRNb2NrdXBXaWR0aCkgLyAyO1xuICAgICAgICBjb25zdCBtb2NrdXBZID0gKGV4cG9ydFNpemUgLSBzY2FsZWRNb2NrdXBIZWlnaHQpIC8gMjtcbiAgICAgICAgY3R4LmRyYXdJbWFnZShtb2NrdXBJbWcsIG1vY2t1cFgsIG1vY2t1cFksIHNjYWxlZE1vY2t1cFdpZHRoLCBzY2FsZWRNb2NrdXBIZWlnaHQpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQndCw0YDQuNGB0L7QstCw0L0g0LzQvtC60LDQvyDQutCw0Log0YTQvtC9ICgke3NjYWxlZE1vY2t1cFdpZHRofXgke3NjYWxlZE1vY2t1cEhlaWdodH0pYCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjYW52YXM6IHRlbXBDYW52YXMsXG4gICAgICAgICAgICBjdHgsXG4gICAgICAgICAgICBtb2NrdXBEaW1lbnNpb25zOiB7XG4gICAgICAgICAgICAgICAgeDogbW9ja3VwWCxcbiAgICAgICAgICAgICAgICB5OiBtb2NrdXBZLFxuICAgICAgICAgICAgICAgIHdpZHRoOiBzY2FsZWRNb2NrdXBXaWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHNjYWxlZE1vY2t1cEhlaWdodFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBhc3luYyBjcmVhdGVEZXNpZ25DYW52YXMoZWRpdGFibGVDYW52YXMsIGxheWVyc0NhbnZhcywgc2lkZSkge1xuICAgICAgICBjb25zdCBxdWFsaXR5TXVsdGlwbGllciA9IDEwO1xuICAgICAgICBjb25zdCBiYXNlU2l6ZSA9IENPTlNUQU5UUy5DQU5WQVNfQVJFQV9IRUlHSFQ7XG4gICAgICAgIGNvbnN0IGJhc2VXaWR0aCA9IGJhc2VTaXplO1xuICAgICAgICBjb25zdCBiYXNlSGVpZ2h0ID0gYmFzZVNpemU7XG4gICAgICAgIGNvbnN0IGRlc2lnbkNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBjb25zdCBkZXNpZ25DdHggPSBkZXNpZ25DYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgZGVzaWduQ2FudmFzLndpZHRoID0gYmFzZVdpZHRoICogcXVhbGl0eU11bHRpcGxpZXI7XG4gICAgICAgIGRlc2lnbkNhbnZhcy5oZWlnaHQgPSBiYXNlSGVpZ2h0ICogcXVhbGl0eU11bHRpcGxpZXI7XG4gICAgICAgIGF3YWl0IHRoaXMuYWRkU3RhdGljTGF5ZXJzVG9DYW52YXMobGF5ZXJzQ2FudmFzLCBkZXNpZ25DdHgsIGRlc2lnbkNhbnZhcywgc2lkZSk7XG4gICAgICAgIGF3YWl0IHRoaXMuYWRkRWRpdGFibGVPYmplY3RzVG9DYW52YXMoZWRpdGFibGVDYW52YXMsIGRlc2lnbkN0eCwgZGVzaWduQ2FudmFzLCBiYXNlV2lkdGgsIGJhc2VIZWlnaHQsIHNpZGUpO1xuICAgICAgICByZXR1cm4gZGVzaWduQ2FudmFzO1xuICAgIH1cbiAgICBhc3luYyBhZGRTdGF0aWNMYXllcnNUb0NhbnZhcyhsYXllcnNDYW52YXMsIGN0eCwgY2FudmFzLCBzaWRlKSB7XG4gICAgICAgIGlmICghbGF5ZXJzQ2FudmFzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbGF5ZXJzRGF0YVVybCA9IGxheWVyc0NhbnZhcy50b0RhdGFVUkwoe1xuICAgICAgICAgICAgICAgIGZvcm1hdDogJ3BuZycsXG4gICAgICAgICAgICAgICAgbXVsdGlwbGllcjogMTAsXG4gICAgICAgICAgICAgICAgcXVhbGl0eTogMS4wXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGVtcHR5RGF0YVVybCA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUFFQUFBQUJDQVlBQUFBZkZjU0pBQUFBRFVsRVFWUjQybU5rWVBoZkR3QUNod0dBNjBlNmtnQUFBQUJKUlU1RXJrSmdnZz09JztcbiAgICAgICAgICAgIGlmIChsYXllcnNEYXRhVXJsICE9PSBlbXB0eURhdGFVcmwgJiYgbGF5ZXJzRGF0YVVybC5sZW5ndGggPiBlbXB0eURhdGFVcmwubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGF5ZXJzSW1nID0gYXdhaXQgdGhpcy5sb2FkSW1hZ2UobGF5ZXJzRGF0YVVybCk7XG4gICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShsYXllcnNJbWcsIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0JTQvtCx0LDQstC70LXQvdGLINGB0YLQsNGC0LjRh9C10YHQutC40LUg0YHQu9C+0Lgg0LTQu9GPICR7c2lkZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2V4cG9ydF0g0J7RiNC40LHQutCwINGN0LrRgdC/0L7RgNGC0LAg0YHRgtCw0YLQuNGH0LXRgdC60LjRhSDRgdC70L7QtdCyINC00LvRjyAke3NpZGV9OmAsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBhZGRFZGl0YWJsZU9iamVjdHNUb0NhbnZhcyhlZGl0YWJsZUNhbnZhcywgY3R4LCBjYW52YXMsIGJhc2VXaWR0aCwgYmFzZUhlaWdodCwgc2lkZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdGVtcEVkaXRhYmxlQ2FudmFzID0gbmV3IGZhYnJpYy5TdGF0aWNDYW52YXMobnVsbCwge1xuICAgICAgICAgICAgICAgIHdpZHRoOiBiYXNlV2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBiYXNlSGVpZ2h0LFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3RyYW5zcGFyZW50J1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBwcmludEFyZWEgPSB0aGlzLmNhbGN1bGF0ZVByaW50QXJlYURpbWVuc2lvbnMoc2lkZSwgYmFzZVdpZHRoKTtcbiAgICAgICAgICAgIGNvbnN0IGNsaXBBcmVhID0gbmV3IGZhYnJpYy5SZWN0KHtcbiAgICAgICAgICAgICAgICB3aWR0aDogcHJpbnRBcmVhLndpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogcHJpbnRBcmVhLmhlaWdodCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBwcmludEFyZWEubGVmdCxcbiAgICAgICAgICAgICAgICB0b3A6IHByaW50QXJlYS50b3AsXG4gICAgICAgICAgICAgICAgZmlsbDogJ3JnYigyNTUsIDAsIDApJyxcbiAgICAgICAgICAgICAgICBldmVudGVkOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGVtcEVkaXRhYmxlQ2FudmFzLmNsaXBQYXRoID0gY2xpcEFyZWE7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQodC+0LfQtNCw0L0gY2xpcFBhdGgg0LTQu9GPINGN0LrRgdC/0L7RgNGC0LAg0YHRgtC+0YDQvtC90YsgJHtzaWRlfSDRgSDRgNCw0LfQvNC10YDQsNC80Lgg0LjQtyDQutC+0L3RhNC40LPRg9GA0LDRhtC40LhgKTtcbiAgICAgICAgICAgIGNvbnN0IGxheWVyc0ZvclNpZGUgPSB0aGlzLmxheW91dHMuZmlsdGVyKGxheW91dCA9PiBsYXlvdXQudmlldyA9PT0gc2lkZSk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGxheW91dCBvZiBsYXllcnNGb3JTaWRlKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hZGRMYXlvdXRUb0V4cG9ydENhbnZhcyhsYXlvdXQsIHRlbXBFZGl0YWJsZUNhbnZhcywgcHJpbnRBcmVhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCU0L7QsdCw0LLQu9C10L3QviAke2xheWVyc0ZvclNpZGUubGVuZ3RofSDRgdC70L7QtdCyINC00LvRjyDRjdC60YHQv9C+0YDRgtCwINGB0YLQvtGA0L7QvdGLICR7c2lkZX1gKTtcbiAgICAgICAgICAgIGNvbnN0IGRlc2lnbkRhdGFVcmwgPSB0ZW1wRWRpdGFibGVDYW52YXMudG9EYXRhVVJMKHtcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdwbmcnLFxuICAgICAgICAgICAgICAgIG11bHRpcGxpZXI6IDEwLFxuICAgICAgICAgICAgICAgIHF1YWxpdHk6IDEuMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBlbXB0eURhdGFVcmwgPSAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBRUFBQUFCQ0FZQUFBQWZGY1NKQUFBQURVbEVRVlI0Mm1Oa1lQaGZEd0FDaHdHQTYwZTZrZ0FBQUFCSlJVNUVya0pnZ2c9PSc7XG4gICAgICAgICAgICBpZiAoZGVzaWduRGF0YVVybCAhPT0gZW1wdHlEYXRhVXJsICYmIGRlc2lnbkRhdGFVcmwubGVuZ3RoID4gZW1wdHlEYXRhVXJsLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlc2lnbkltZyA9IGF3YWl0IHRoaXMubG9hZEltYWdlKGRlc2lnbkRhdGFVcmwpO1xuICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoZGVzaWduSW1nLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCU0L7QsdCw0LLQu9C10L3RiyDQvtCx0YrQtdC60YLRiyDQtNC40LfQsNC50L3QsCDQsdC10Lcg0LPRgNCw0L3QuNGGINC00LvRjyAke3NpZGV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZW1wRWRpdGFibGVDYW52YXMuZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZXhwb3J0XSDQntGI0LjQsdC60LAg0YHQvtC30LTQsNC90LjRjyDQtNC40LfQsNC50L3QsCDQsdC10Lcg0LPRgNCw0L3QuNGGINC00LvRjyAke3NpZGV9OmAsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmaWx0ZXJEZXNpZ25PYmplY3RzKGFsbE9iamVjdHMpIHtcbiAgICAgICAgY29uc3Qgc2VydmljZU9iamVjdE5hbWVzID0gbmV3IFNldChbXG4gICAgICAgICAgICBcImFyZWE6Ym9yZGVyXCIsXG4gICAgICAgICAgICBcImFyZWE6Y2xpcFwiLFxuICAgICAgICAgICAgXCJndWlkZWxpbmVcIixcbiAgICAgICAgICAgIFwiZ3VpZGVsaW5lOnZlcnRpY2FsXCIsXG4gICAgICAgICAgICBcImd1aWRlbGluZTpob3Jpem9udGFsXCJcbiAgICAgICAgXSk7XG4gICAgICAgIHJldHVybiBhbGxPYmplY3RzLmZpbHRlcigob2JqKSA9PiAhc2VydmljZU9iamVjdE5hbWVzLmhhcyhvYmoubmFtZSkpO1xuICAgIH1cbiAgICBjYWxjdWxhdGVQcmludEFyZWFEaW1lbnNpb25zKHNpZGUsIGJhc2VDYW52YXNTaXplID0gQ09OU1RBTlRTLkNBTlZBU19BUkVBX0hFSUdIVCkge1xuICAgICAgICBjb25zdCBwcmludENvbmZpZyA9IHRoaXMuZ2V0UHJpbnRDb25maWdGb3JTaWRlKHNpZGUpO1xuICAgICAgICBpZiAoIXByaW50Q29uZmlnKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtleHBvcnRdINCd0LUg0L3QsNC50LTQtdC90LAg0LrQvtC90YTQuNCz0YPRgNCw0YbQuNGPINC/0LXRh9Cw0YLQuCDQtNC70Y8gJHtzaWRlfWApO1xuICAgICAgICAgICAgcmV0dXJuIHsgd2lkdGg6IGJhc2VDYW52YXNTaXplLCBoZWlnaHQ6IGJhc2VDYW52YXNTaXplLCBsZWZ0OiAwLCB0b3A6IDAgfTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB3aWR0aCA9IHByaW50Q29uZmlnLnNpemUud2lkdGggLyA2MDAgKiBiYXNlQ2FudmFzU2l6ZTtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gcHJpbnRDb25maWcuc2l6ZS5oZWlnaHQgLyA2MDAgKiBiYXNlQ2FudmFzU2l6ZTtcbiAgICAgICAgY29uc3QgbGVmdCA9IChiYXNlQ2FudmFzU2l6ZSAtIHdpZHRoKSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueCAvIDEwMCAqIGJhc2VDYW52YXNTaXplKTtcbiAgICAgICAgY29uc3QgdG9wID0gKGJhc2VDYW52YXNTaXplIC0gaGVpZ2h0KSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueSAvIDEwMCAqIGJhc2VDYW52YXNTaXplKTtcbiAgICAgICAgcmV0dXJuIHsgd2lkdGgsIGhlaWdodCwgbGVmdCwgdG9wIH07XG4gICAgfVxuICAgIGFzeW5jIGFkZExheW91dFRvRXhwb3J0Q2FudmFzKGxheW91dCwgY2FudmFzLCBwcmludEFyZWEpIHtcbiAgICAgICAgY29uc3QgYWJzb2x1dGVMZWZ0ID0gcHJpbnRBcmVhLmxlZnQgKyAocHJpbnRBcmVhLndpZHRoICogbGF5b3V0LnBvc2l0aW9uLngpO1xuICAgICAgICBjb25zdCBhYnNvbHV0ZVRvcCA9IHByaW50QXJlYS50b3AgKyAocHJpbnRBcmVhLmhlaWdodCAqIGxheW91dC5wb3NpdGlvbi55KTtcbiAgICAgICAgaWYgKGxheW91dC5pc0ltYWdlTGF5b3V0KCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGltYWdlID0gbmV3IGZhYnJpYy5JbWFnZShhd2FpdCB0aGlzLmxvYWRJbWFnZShsYXlvdXQudXJsKSk7XG4gICAgICAgICAgICBsZXQgZmluYWxTaXplID0gbGF5b3V0LnNpemU7XG4gICAgICAgICAgICBpZiAoZmluYWxTaXplID09PSAxICYmIGltYWdlLndpZHRoID4gcHJpbnRBcmVhLndpZHRoKSB7XG4gICAgICAgICAgICAgICAgZmluYWxTaXplID0gcHJpbnRBcmVhLndpZHRoIC8gaW1hZ2Uud2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbWFnZS5zZXQoe1xuICAgICAgICAgICAgICAgIGxlZnQ6IGFic29sdXRlTGVmdCxcbiAgICAgICAgICAgICAgICB0b3A6IGFic29sdXRlVG9wLFxuICAgICAgICAgICAgICAgIHNjYWxlWDogZmluYWxTaXplLFxuICAgICAgICAgICAgICAgIHNjYWxlWTogZmluYWxTaXplICogbGF5b3V0LmFzcGVjdFJhdGlvLFxuICAgICAgICAgICAgICAgIGFuZ2xlOiBsYXlvdXQuYW5nbGUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNhbnZhcy5hZGQoaW1hZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGxheW91dC5pc1RleHRMYXlvdXQoKSkge1xuICAgICAgICAgICAgY29uc3QgdGV4dCA9IG5ldyBmYWJyaWMuVGV4dChsYXlvdXQudGV4dCwge1xuICAgICAgICAgICAgICAgIGZvbnRGYW1pbHk6IGxheW91dC5mb250LmZhbWlseSxcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogbGF5b3V0LmZvbnQuc2l6ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGV4dC5zZXQoe1xuICAgICAgICAgICAgICAgIGxlZnQ6IGFic29sdXRlTGVmdCxcbiAgICAgICAgICAgICAgICB0b3A6IGFic29sdXRlVG9wLFxuICAgICAgICAgICAgICAgIHNjYWxlWDogbGF5b3V0LnNpemUsXG4gICAgICAgICAgICAgICAgc2NhbGVZOiBsYXlvdXQuc2l6ZSAqIGxheW91dC5hc3BlY3RSYXRpbyxcbiAgICAgICAgICAgICAgICBhbmdsZTogbGF5b3V0LmFuZ2xlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjYW52YXMuYWRkKHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGV4cG9ydERlc2lnbldpdGhDbGlwUGF0aChlZGl0YWJsZUNhbnZhcywgbGF5ZXJzQ2FudmFzLCBzaWRlLCByZXNvbHV0aW9uKSB7XG4gICAgICAgIGNvbnN0IHF1YWxpdHlNdWx0aXBsaWVyID0gMTA7XG4gICAgICAgIGNvbnN0IHByaW50QXJlYSA9IHRoaXMuY2FsY3VsYXRlUHJpbnRBcmVhRGltZW5zaW9ucyhzaWRlLCBDT05TVEFOVFMuQ0FOVkFTX0FSRUFfSEVJR0hUKTtcbiAgICAgICAgY29uc3QgY2xpcFdpZHRoID0gcHJpbnRBcmVhLndpZHRoO1xuICAgICAgICBjb25zdCBjbGlwSGVpZ2h0ID0gcHJpbnRBcmVhLmhlaWdodDtcbiAgICAgICAgY29uc3QgY2xpcExlZnQgPSBwcmludEFyZWEubGVmdDtcbiAgICAgICAgY29uc3QgY2xpcFRvcCA9IHByaW50QXJlYS50b3A7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdIFByaW50IGFyZWEgKNC90LXQt9Cw0LLQuNGB0LjQvNC+INC+0YIg0Y3QutGA0LDQvdCwKTogJHtjbGlwV2lkdGh9eCR7Y2xpcEhlaWdodH0gYXQgKCR7Y2xpcExlZnR9LCAke2NsaXBUb3B9KWApO1xuICAgICAgICBjb25zdCBmdWxsRGVzaWduQ2FudmFzID0gYXdhaXQgdGhpcy5jcmVhdGVEZXNpZ25DYW52YXMoZWRpdGFibGVDYW52YXMsIGxheWVyc0NhbnZhcywgc2lkZSk7XG4gICAgICAgIGNvbnN0IHNjYWxlID0gcmVzb2x1dGlvbiAvIE1hdGgubWF4KGNsaXBXaWR0aCwgY2xpcEhlaWdodCk7XG4gICAgICAgIGNvbnN0IGNyb3BwZWRDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgY3JvcHBlZENhbnZhcy53aWR0aCA9IGNsaXBXaWR0aCAqIHNjYWxlO1xuICAgICAgICBjcm9wcGVkQ2FudmFzLmhlaWdodCA9IGNsaXBIZWlnaHQgKiBzY2FsZTtcbiAgICAgICAgY29uc3QgY3R4ID0gY3JvcHBlZENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICBjb25zdCBzb3VyY2VTY2FsZSA9IHF1YWxpdHlNdWx0aXBsaWVyO1xuICAgICAgICBjdHguZHJhd0ltYWdlKGZ1bGxEZXNpZ25DYW52YXMsIGNsaXBMZWZ0ICogc291cmNlU2NhbGUsIGNsaXBUb3AgKiBzb3VyY2VTY2FsZSwgY2xpcFdpZHRoICogc291cmNlU2NhbGUsIGNsaXBIZWlnaHQgKiBzb3VyY2VTY2FsZSwgMCwgMCwgY3JvcHBlZENhbnZhcy53aWR0aCwgY3JvcHBlZENhbnZhcy5oZWlnaHQpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQlNC40LfQsNC50L0g0L7QsdGA0LXQt9Cw0L0g0L/QviBjbGlwUGF0aDogJHtjcm9wcGVkQ2FudmFzLndpZHRofXgke2Nyb3BwZWRDYW52YXMuaGVpZ2h0fXB4YCk7XG4gICAgICAgIHJldHVybiBjcm9wcGVkQ2FudmFzO1xuICAgIH1cbiAgICBhc3luYyB1cGxvYWREZXNpZ25Ub1NlcnZlcihkZXNpZ25zKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZXhwb3J0XSDQl9Cw0LPRgNGD0LfQutCwINC00LjQt9Cw0LnQvdCwINC90LAg0YHQtdGA0LLQtdGAJyk7XG4gICAgICAgICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBbc2lkZSwgZGF0YVVybF0gb2YgT2JqZWN0LmVudHJpZXMoZGVzaWducykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGRhdGFVcmwpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJsb2IgPSBhd2FpdCByZXNwb25zZS5ibG9iKCk7XG4gICAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKHNpZGUsIGJsb2IsIGAke3NpZGV9LnBuZ2ApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZXhwb3J0XSDQl9Cw0LPRgNGD0LfQutCwINC90LAg0YHQtdGA0LLQtdGAINC90LUg0YDQtdCw0LvQuNC30L7QstCw0L3QsCcpO1xuICAgICAgICAgICAgcmV0dXJuIGRlc2lnbnM7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbZXhwb3J0XSDQntGI0LjQsdC60LAg0L/RgNC4INC30LDQs9GA0YPQt9C60LUg0L3QsCDRgdC10YDQstC10YA6JywgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2F2ZUxheWVyc1RvSGlzdG9yeSgpIHtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA8IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICB0aGlzLmxheWVyc0hpc3RvcnkgPSB0aGlzLmxheWVyc0hpc3Rvcnkuc2xpY2UoMCwgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ICsgMSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGF5ZXJzQ29weSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGhpcy5sYXlvdXRzKSk7XG4gICAgICAgIGNvbnN0IGhpc3RvcnlJdGVtID0ge1xuICAgICAgICAgICAgbGF5ZXJzOiBsYXllcnNDb3B5Lm1hcCgoZGF0YSkgPT4gbmV3IExheW91dChkYXRhKSksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KClcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5sYXllcnNIaXN0b3J5LnB1c2goaGlzdG9yeUl0ZW0pO1xuICAgICAgICB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPSB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMTtcbiAgICAgICAgY29uc3QgTUFYX0hJU1RPUllfU0laRSA9IDUwO1xuICAgICAgICBpZiAodGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCA+IE1BWF9ISVNUT1JZX1NJWkUpIHtcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzSGlzdG9yeS5zaGlmdCgpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4LS07XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2hpc3RvcnldINCh0L7RhdGA0LDQvdC10L3QviDRgdC+0YHRgtC+0Y/QvdC40LUg0YHQu9C+0ZHQsi4g0JjQvdC00LXQutGBOiAke3RoaXMuY3VycmVudEhpc3RvcnlJbmRleH0sINCS0YHQtdCz0L46ICR7dGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aH0sINCh0LvQvtGR0LI6ICR7dGhpcy5sYXlvdXRzLmxlbmd0aH1gKTtcbiAgICAgICAgdGhpcy51cGRhdGVIaXN0b3J5QnV0dG9uc1N0YXRlKCk7XG4gICAgfVxuICAgIGNhblVuZG8oKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPT09IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCA+PSAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA+IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2FuUmVkbygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA8IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxO1xuICAgIH1cbiAgICB1cGRhdGVIaXN0b3J5QnV0dG9uc1N0YXRlKCkge1xuICAgICAgICBjb25zdCBjYW5VbmRvID0gdGhpcy5jYW5VbmRvKCk7XG4gICAgICAgIGNvbnN0IGNhblJlZG8gPSB0aGlzLmNhblJlZG8oKTtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jayAmJiB0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVuZG9CdXR0b24gPSB0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBpZiAoY2FuVW5kbykge1xuICAgICAgICAgICAgICAgIHVuZG9CdXR0b24uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyc7XG4gICAgICAgICAgICAgICAgdW5kb0J1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB1bmRvQnV0dG9uLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcjZjJmMmYyJztcbiAgICAgICAgICAgICAgICB1bmRvQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrICYmIHRoaXMuZWRpdG9ySGlzdG9yeVJlZG9CbG9jay5maXJzdEVsZW1lbnRDaGlsZCkge1xuICAgICAgICAgICAgY29uc3QgcmVkb0J1dHRvbiA9IHRoaXMuZWRpdG9ySGlzdG9yeVJlZG9CbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGlmIChjYW5SZWRvKSB7XG4gICAgICAgICAgICAgICAgcmVkb0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnJztcbiAgICAgICAgICAgICAgICByZWRvQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlZG9CdXR0b24uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyNmMmYyZjInO1xuICAgICAgICAgICAgICAgIHJlZG9CdXR0b24uc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5XSDQodC+0YHRgtC+0Y/QvdC40LUg0LrQvdC+0L/QvtC6OiB1bmRvID0nLCBjYW5VbmRvLCAnLCByZWRvID0nLCBjYW5SZWRvKTtcbiAgICB9XG4gICAgYXN5bmMgdW5kbygpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhblVuZG8oKSkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnldIFVuZG8g0L3QtdCy0L7Qt9C80L7QttC10L0nKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID09PSB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMSAmJiB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA9IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID0gTWF0aC5tYXgoMCwgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4IC0gMSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaGlzdG9yeUl0ZW0gPSB0aGlzLmxheWVyc0hpc3RvcnlbdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4XTtcbiAgICAgICAgaWYgKCFoaXN0b3J5SXRlbSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbaGlzdG9yeV0g0JjRgdGC0L7RgNC40Y8g0L3QtSDQvdCw0LnQtNC10L3QsCcpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtoaXN0b3J5XSBVbmRvINC6INC40L3QtNC10LrRgdGDICR7dGhpcy5jdXJyZW50SGlzdG9yeUluZGV4fSDQuNC3ICR7dGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDF9YCk7XG4gICAgICAgIGF3YWl0IHRoaXMucmVzdG9yZUxheWVyc0Zyb21IaXN0b3J5KGhpc3RvcnlJdGVtKTtcbiAgICAgICAgdGhpcy51cGRhdGVIaXN0b3J5QnV0dG9uc1N0YXRlKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBhc3luYyByZWRvKCkge1xuICAgICAgICBpZiAoIXRoaXMuY2FuUmVkbygpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbaGlzdG9yeV0gUmVkbyDQvdC10LLQvtC30LzQvtC20LXQvScpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCsrO1xuICAgICAgICBjb25zdCBoaXN0b3J5SXRlbSA9IHRoaXMubGF5ZXJzSGlzdG9yeVt0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXhdO1xuICAgICAgICBpZiAoIWhpc3RvcnlJdGVtKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1toaXN0b3J5XSDQmNGB0YLQvtGA0LjRjyDQvdC1INC90LDQudC00LXQvdCwJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2hpc3RvcnldIFJlZG8g0Log0LjQvdC00LXQutGB0YMgJHt0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXh9INC40LcgJHt0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMX1gKTtcbiAgICAgICAgYXdhaXQgdGhpcy5yZXN0b3JlTGF5ZXJzRnJvbUhpc3RvcnkoaGlzdG9yeUl0ZW0pO1xuICAgICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGFzeW5jIHJlc3RvcmVMYXllcnNGcm9tSGlzdG9yeShoaXN0b3J5SXRlbSkge1xuICAgICAgICB0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkgPSB0cnVlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gW107XG4gICAgICAgICAgICBoaXN0b3J5SXRlbS5sYXllcnMuZm9yRWFjaChsYXlvdXQgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMubGF5b3V0cy5wdXNoKG5ldyBMYXlvdXQobGF5b3V0KSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbaGlzdG9yeV0g0JLQvtGB0YHRgtCw0L3QvtCy0LvQtdC90L4gJHt0aGlzLmxheW91dHMubGVuZ3RofSDRgdC70L7RkdCyYCk7XG4gICAgICAgIH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBkZXN0cm95KCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZWRpdG9yXSDQntGH0LjRgdGC0LrQsCDRgNC10YHRg9GA0YHQvtCyINGA0LXQtNCw0LrRgtC+0YDQsCcpO1xuICAgICAgICBpZiAodGhpcy5sb2FkaW5nSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5sb2FkaW5nSW50ZXJ2YWwpO1xuICAgICAgICAgICAgdGhpcy5sb2FkaW5nSW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXZlbnRzLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5jYW52YXNlcy5mb3JFYWNoKGNhbnZhcyA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNhbnZhcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NsZWFudXBdINCe0YjQuNCx0LrQsCDQvtGH0LjRgdGC0LrQuCBjYW52YXM6JywgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY2FudmFzZXMgPSBbXTtcbiAgICAgICAgdGhpcy5sYXllcnNDYW52YXNlcy5mb3JFYWNoKGNhbnZhcyA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNhbnZhcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NsZWFudXBdINCe0YjQuNCx0LrQsCDQvtGH0LjRgdGC0LrQuCBsYXllciBjYW52YXM6JywgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubGF5ZXJzQ2FudmFzZXMgPSBbXTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2VkaXRvcl0g0KDQtdGB0YPRgNGB0Ysg0YPRgdC/0LXRiNC90L4g0L7Rh9C40YnQtdC90YsnKTtcbiAgICB9XG4gICAgZ2V0Q3VycmVudFN0YXRlKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogdGhpcy5fc2VsZWN0VHlwZSxcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLl9zZWxlY3RDb2xvcixcbiAgICAgICAgICAgIHNpZGU6IHRoaXMuX3NlbGVjdFNpZGUsXG4gICAgICAgICAgICBzaXplOiB0aGlzLl9zZWxlY3RTaXplLFxuICAgICAgICAgICAgbGF5b3V0czogdGhpcy5sYXlvdXRzLFxuICAgICAgICAgICAgaXNMb2FkaW5nOiB0aGlzLmlzTG9hZGluZyxcbiAgICAgICAgfTtcbiAgICB9XG59XG4iLCJjb25zdCBwb3B1cExvZ2dlciA9IGNvbnNvbGUuZGVidWcuYmluZChjb25zb2xlLCAnW1BvcHVwXScpO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUG9wdXAge1xuICAgIGNvbnN0cnVjdG9yKHsgcG9wdXBJZCwgcG9wdXBDb250ZW50Q2xhc3MsIGNsb3NlQnV0dG9uQ2xhc3MsIHRpbWVvdXRTZWNvbmRzID0gMTAsIGF1dG9TaG93ID0gdHJ1ZSwgY29va2llTmFtZSA9ICdwb3B1cCcsIGNvb2tpZUV4cGlyZXNEYXlzID0gMSwgfSkge1xuICAgICAgICB0aGlzLmNsb3NlQnV0dG9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5hdXRvU2hvdyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmF1dG9TaG93VGltZW91dCA9IG51bGw7XG4gICAgICAgIHRoaXMudGltZW91dFNlY29uZHMgPSAyNTtcbiAgICAgICAgdGhpcy5jb29raWVOYW1lID0gXCJwb3B1cFwiO1xuICAgICAgICB0aGlzLmNvb2tpZUV4cGlyZXNEYXlzID0gMTtcbiAgICAgICAgaWYgKCFwb3B1cElkIHx8ICFwb3B1cENvbnRlbnRDbGFzcylcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW1BvcHVwXSBwb3B1cElkIG9yIHBvcHVwQ29udGVudENsYXNzIGlzIG5vdCBwcm92aWRlZCcpO1xuICAgICAgICBjb25zdCBmaW5kUG9wdXBCbG9jayA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHBvcHVwSWQpO1xuICAgICAgICBpZiAoIWZpbmRQb3B1cEJsb2NrKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBvcHVwIGJsb2NrIHdpdGggaWQgJHtwb3B1cElkfSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaW5kUG9wdXBDb250ZW50QmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuJHtwb3B1cENvbnRlbnRDbGFzc31gKTtcbiAgICAgICAgaWYgKCFmaW5kUG9wdXBDb250ZW50QmxvY2spIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUG9wdXAgY29udGVudCBibG9jayB3aXRoIGNsYXNzICR7cG9wdXBDb250ZW50Q2xhc3N9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucG9wdXBCbG9jayA9IGZpbmRQb3B1cEJsb2NrO1xuICAgICAgICB0aGlzLnBvcHVwQ29udGVudEJsb2NrID0gZmluZFBvcHVwQ29udGVudEJsb2NrO1xuICAgICAgICB0aGlzLmluaXRQb3B1cEJsb2NrKCk7XG4gICAgICAgIHRoaXMucG9wdXBXcmFwcGVyQmxvY2sgPSB0aGlzLmluaXRQb3B1cFdyYXBwZXIoKTtcbiAgICAgICAgY29uc3QgZmluZENsb3NlQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLiR7Y2xvc2VCdXR0b25DbGFzc31gKTtcbiAgICAgICAgaWYgKCFmaW5kQ2xvc2VCdXR0b24pIHtcbiAgICAgICAgICAgIHBvcHVwTG9nZ2VyKGBjbG9zZSBidXR0b24gd2l0aCBjbGFzcyAke2Nsb3NlQnV0dG9uQ2xhc3N9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xvc2VCdXR0b24gPSBmaW5kQ2xvc2VCdXR0b247XG4gICAgICAgIHRoaXMuaW5pdENsb3NlQnV0dG9uKCk7XG4gICAgICAgIGlmICh0aW1lb3V0U2Vjb25kcykge1xuICAgICAgICAgICAgdGhpcy50aW1lb3V0U2Vjb25kcyA9IHRpbWVvdXRTZWNvbmRzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhdXRvU2hvdykge1xuICAgICAgICAgICAgdGhpcy5hdXRvU2hvdyA9IGF1dG9TaG93O1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb29raWVOYW1lKSB7XG4gICAgICAgICAgICB0aGlzLmNvb2tpZU5hbWUgPSBjb29raWVOYW1lO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb29raWVFeHBpcmVzRGF5cykge1xuICAgICAgICAgICAgdGhpcy5jb29raWVFeHBpcmVzRGF5cyA9IGNvb2tpZUV4cGlyZXNEYXlzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnBvcHVwQmxvY2sgJiYgdGhpcy5jbG9zZUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5pbml0QXV0b1Nob3coKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0UG9wdXBXcmFwcGVyKCkge1xuICAgICAgICBjb25zdCBwb3B1cFdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICBwb3B1cFdyYXBwZXIuaWQgPSAncG9wdXAtd3JhcHBlcic7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS5yaWdodCA9ICcwJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLmJvdHRvbSA9ICcwJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUuekluZGV4ID0gJzk5OTknO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICAgICAgcmV0dXJuIHBvcHVwV3JhcHBlcjtcbiAgICB9XG4gICAgaW5pdFBvcHVwQmxvY2soKSB7XG4gICAgICAgIHRoaXMucG9wdXBCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH1cbiAgICBpbml0Q2xvc2VCdXR0b24oKSB7XG4gICAgICAgIGlmICghdGhpcy5jbG9zZUJ1dHRvbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgIHRoaXMuY2xvc2VCdXR0b24ub25jbGljayA9ICgpID0+IHRoaXMuY2xvc2UoKTtcbiAgICB9XG4gICAgaW5pdEF1dG9TaG93KCkge1xuICAgICAgICBpZiAodGhpcy5hdXRvU2hvdyAmJiAhZG9jdW1lbnQuY29va2llLmluY2x1ZGVzKGAke3RoaXMuY29va2llTmFtZX09dHJ1ZWApKSB7XG4gICAgICAgICAgICB0aGlzLmF1dG9TaG93VGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5zaG93KCksIHRoaXMudGltZW91dFNlY29uZHMgKiAxMDAwKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBvcHVwTG9nZ2VyKCdpcyBub3QgYXV0byBzaG93bicpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNob3coKSB7XG4gICAgICAgIHRoaXMucG9wdXBXcmFwcGVyQmxvY2suYXBwZW5kQ2hpbGQodGhpcy5wb3B1cEJsb2NrKTtcbiAgICAgICAgdGhpcy5wb3B1cENvbnRlbnRCbG9jay5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICB0aGlzLnBvcHVwQmxvY2suc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5wb3B1cFdyYXBwZXJCbG9jayk7XG4gICAgfVxuICAgIGNsb3NlKCkge1xuICAgICAgICB0aGlzLnBvcHVwV3JhcHBlckJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGRvY3VtZW50LmNvb2tpZSA9IGAke3RoaXMuY29va2llTmFtZX09dHJ1ZTsgZXhwaXJlcz0ke25ldyBEYXRlKERhdGUubm93KCkgKyB0aGlzLmNvb2tpZUV4cGlyZXNEYXlzICogMjQgKiA2MCAqIDYwICogMTAwMCkudG9VVENTdHJpbmcoKX07IHBhdGg9LztgO1xuICAgIH1cbn1cbiIsImV4cG9ydCBjbGFzcyBFZGl0b3JTdG9yYWdlTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZGF0YWJhc2UgPSBudWxsO1xuICAgICAgICB0aGlzLmlzUmVhZHkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZWFkeVByb21pc2UgPSB0aGlzLmluaXQoKTtcbiAgICB9XG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9wZW5SZXF1ZXN0ID0gaW5kZXhlZERCLm9wZW4oXCJlZGl0b3JcIiwgMik7XG4gICAgICAgICAgICBvcGVuUmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRhYmFzZSA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgaWYgKCFkYXRhYmFzZS5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKCdoaXN0b3J5JykpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlT2JqZWN0U3RvcmUoJ2hpc3RvcnknLCB7IGtleVBhdGg6ICdpZCcgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghZGF0YWJhc2Uub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucygnZWRpdG9yX3N0YXRlJykpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlT2JqZWN0U3RvcmUoJ2VkaXRvcl9zdGF0ZScsIHsga2V5UGF0aDogJ2tleScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghZGF0YWJhc2Uub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucygndXNlcl9kYXRhJykpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlT2JqZWN0U3RvcmUoJ3VzZXJfZGF0YScsIHsga2V5UGF0aDogJ2tleScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG9wZW5SZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcItCe0YjQuNCx0LrQsCDQvtGC0LrRgNGL0YLQuNGPIEluZGV4ZWREQlwiLCBvcGVuUmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG9wZW5SZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBvcGVuUmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhYmFzZSA9IG9wZW5SZXF1ZXN0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICB0aGlzLmlzUmVhZHkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyB3YWl0Rm9yUmVhZHkoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMucmVhZHlQcm9taXNlO1xuICAgIH1cbiAgICBhc3luYyBzYXZlRWRpdG9yU3RhdGUoc3RhdGUpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2VkaXRvcl9zdGF0ZSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2VkaXRvcl9zdGF0ZScpO1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICdkYXRlJywgc3RhdGUuZGF0ZSksXG4gICAgICAgICAgICB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICdjb2xvcicsIHN0YXRlLmNvbG9yKSxcbiAgICAgICAgICAgIHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ3NpZGUnLCBzdGF0ZS5zaWRlKSxcbiAgICAgICAgICAgIHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ3R5cGUnLCBzdGF0ZS50eXBlKSxcbiAgICAgICAgICAgIHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ3NpemUnLCBzdGF0ZS5zaXplKVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgYXN5bmMgbG9hZEVkaXRvclN0YXRlKCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnZWRpdG9yX3N0YXRlJ10sICdyZWFkb25seScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdlZGl0b3Jfc3RhdGUnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IFtkYXRlLCBjb2xvciwgc2lkZSwgdHlwZSwgc2l6ZV0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICAgICAgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAnZGF0ZScpLFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ2NvbG9yJyksXG4gICAgICAgICAgICAgICAgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAnc2lkZScpLFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ3R5cGUnKSxcbiAgICAgICAgICAgICAgICB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICdzaXplJylcbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgaWYgKCFkYXRlIHx8ICFjb2xvciB8fCAhc2lkZSB8fCAhdHlwZSB8fCAhc2l6ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBkYXRlLFxuICAgICAgICAgICAgICAgIGNvbG9yLFxuICAgICAgICAgICAgICAgIHNpZGUsXG4gICAgICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgICAgICBzaXplXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcign0J7RiNC40LHQutCwINC30LDQs9GA0YPQt9C60Lgg0YHQvtGB0YLQvtGP0L3QuNGPINGA0LXQtNCw0LrRgtC+0YDQsDonLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBjbGVhckVkaXRvclN0YXRlKCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnZWRpdG9yX3N0YXRlJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnZWRpdG9yX3N0YXRlJyk7XG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlRGF0YShvYmplY3RTdG9yZSwgJ2RhdGUnKSxcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlRGF0YShvYmplY3RTdG9yZSwgJ2NvbG9yJyksXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZURhdGEob2JqZWN0U3RvcmUsICdzaWRlJyksXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZURhdGEob2JqZWN0U3RvcmUsICd0eXBlJyksXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZURhdGEob2JqZWN0U3RvcmUsICdzaXplJylcbiAgICAgICAgXSk7XG4gICAgfVxuICAgIGFzeW5jIGdldFVzZXJJZCgpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ3VzZXJfZGF0YSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3VzZXJfZGF0YScpO1xuICAgICAgICBsZXQgdXNlcklkID0gYXdhaXQgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAndXNlcklkJyk7XG4gICAgICAgIGlmICghdXNlcklkKSB7XG4gICAgICAgICAgICB1c2VySWQgPSBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wdXREYXRhKG9iamVjdFN0b3JlLCAndXNlcklkJywgdXNlcklkKTtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgd2luZG93LnRyYWNrZXIuc2V0VXNlcklEKHVzZXJJZCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfQntGI0LjQsdC60LAg0YPRgdGC0LDQvdC+0LLQutC4IElEINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjyDQsiB0cmFja2VyOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXNlcklkO1xuICAgIH1cbiAgICBhc3luYyBzYXZlVG9IaXN0b3J5KGl0ZW0sIGRlc2NyaXB0aW9uKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCBoaXN0b3J5SXRlbSA9IHtcbiAgICAgICAgICAgIC4uLml0ZW0sXG4gICAgICAgICAgICBpZDogY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbiB8fCBg0JjQt9C80LXQvdC10L3QuNGPINC+0YIgJHtuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCl9YFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydoaXN0b3J5J10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuYWRkKGhpc3RvcnlJdGVtKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGhpc3RvcnlJdGVtLmlkO1xuICAgIH1cbiAgICBhc3luYyBzYXZlTGF5ZXJPcGVyYXRpb24ob3BlcmF0aW9uLCBsYXlvdXQsIHNpZGUsIHR5cGUsIGRlc2NyaXB0aW9uKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCBsYXllckhpc3RvcnlJdGVtID0ge1xuICAgICAgICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICAgICAgICBvcGVyYXRpb24sXG4gICAgICAgICAgICBsYXlvdXQ6IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobGF5b3V0KSksXG4gICAgICAgICAgICBzaWRlLFxuICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbiB8fCBgJHtvcGVyYXRpb24gPT09ICdhZGQnID8gJ9CU0L7QsdCw0LLQu9C10L0nIDogJ9Cj0LTQsNC70LXQvSd9INGB0LvQvtC5OiAke2xheW91dC5uYW1lIHx8IGxheW91dC50eXBlfWBcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmFkZCh7IC4uLmxheWVySGlzdG9yeUl0ZW0sIGlzTGF5ZXJPcGVyYXRpb246IHRydWUgfSk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBsYXllckhpc3RvcnlJdGVtLmlkO1xuICAgIH1cbiAgICBhc3luYyBnZXRMYXllckhpc3RvcnkoZmlsdGVyLCBsaW1pdCA9IDUwKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydoaXN0b3J5J10sICdyZWFkb25seScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuZ2V0QWxsKCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhbGxJdGVtcyA9IHJlcXVlc3QucmVzdWx0O1xuICAgICAgICAgICAgICAgIGNvbnN0IGxheWVyT3BlcmF0aW9ucyA9IGFsbEl0ZW1zXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uaXNMYXllck9wZXJhdGlvbiAmJiBpdGVtLnNpZGUgPT09IGZpbHRlci5zaWRlICYmIGl0ZW0udHlwZSA9PT0gZmlsdGVyLnR5cGUpXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKGl0ZW0pID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBpdGVtLmlkLFxuICAgICAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IGl0ZW0udGltZXN0YW1wLFxuICAgICAgICAgICAgICAgICAgICBvcGVyYXRpb246IGl0ZW0ub3BlcmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICBsYXlvdXQ6IGl0ZW0ubGF5b3V0LFxuICAgICAgICAgICAgICAgICAgICBzaWRlOiBpdGVtLnNpZGUsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGl0ZW0udHlwZSxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGl0ZW0uZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IGIudGltZXN0YW1wIC0gYS50aW1lc3RhbXApXG4gICAgICAgICAgICAgICAgICAgIC5zbGljZSgwLCBsaW1pdCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShsYXllck9wZXJhdGlvbnMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIGdldFJlY2VudExheWVyT3BlcmF0aW9ucyhmaWx0ZXIsIGxpbWl0ID0gMTApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TGF5ZXJIaXN0b3J5KGZpbHRlciwgbGltaXQpO1xuICAgIH1cbiAgICBhc3luYyBnZXRIaXN0b3J5KGZpbHRlciwgbGltaXQgPSA1MCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZG9ubHknKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmdldEFsbCgpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsSXRlbXMgPSByZXF1ZXN0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJlZEl0ZW1zID0gYWxsSXRlbXNcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihpdGVtID0+IGl0ZW0uc2lkZSA9PT0gZmlsdGVyLnNpZGUgJiYgaXRlbS50eXBlID09PSBmaWx0ZXIudHlwZSlcbiAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IGIudGltZXN0YW1wIC0gYS50aW1lc3RhbXApXG4gICAgICAgICAgICAgICAgICAgIC5zbGljZSgwLCBsaW1pdCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShmaWx0ZXJlZEl0ZW1zKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBnZXRIaXN0b3J5SXRlbShpZCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZG9ubHknKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmdldChpZCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUocmVxdWVzdC5yZXN1bHQgfHwgbnVsbCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBkZWxldGVIaXN0b3J5SXRlbShpZCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmRlbGV0ZShpZCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIGNsZWFySGlzdG9yeShmaWx0ZXIpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIGlmICghZmlsdGVyKSB7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBhbGxJdGVtcyA9IGF3YWl0IHRoaXMuZ2V0SGlzdG9yeShmaWx0ZXIsIDEwMDApO1xuICAgICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGFsbEl0ZW1zKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5kZWxldGVIaXN0b3J5SXRlbShpdGVtLmlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBzYXZlTGF5ZXJzKGxheWVycykge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnZWRpdG9yX3N0YXRlJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnZWRpdG9yX3N0YXRlJyk7XG4gICAgICAgIGF3YWl0IHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ2xheWVycycsIGxheWVycyk7XG4gICAgfVxuICAgIGFzeW5jIGxvYWRMYXllcnMoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnZWRpdG9yX3N0YXRlJ10sICdyZWFkb25seScpO1xuICAgICAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnZWRpdG9yX3N0YXRlJyk7XG4gICAgICAgICAgICBjb25zdCBsYXllcnMgPSBhd2FpdCB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICdsYXllcnMnKTtcbiAgICAgICAgICAgIHJldHVybiBsYXllcnMgfHwgbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ9Ce0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4INGB0LvQvtGR0LI6JywgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHV0RGF0YShvYmplY3RTdG9yZSwga2V5LCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLnB1dCh7IGtleSwgdmFsdWUgfSk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldERhdGEob2JqZWN0U3RvcmUsIGtleSkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmdldChrZXkpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKHJlcXVlc3QucmVzdWx0Py52YWx1ZSB8fCBudWxsKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGRlbGV0ZURhdGEob2JqZWN0U3RvcmUsIGtleSkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiIsImNvbnN0IERFRkFVTFRfVkFMVUVTID0ge1xuICAgIFBPU0lUSU9OOiB7IHg6IDAsIHk6IDAgfSxcbiAgICBTSVpFOiAxLFxuICAgIEFTUEVDVF9SQVRJTzogMSxcbiAgICBBTkdMRTogMCxcbiAgICBURVhUOiAnUHJpbnRMb29wJyxcbiAgICBGT05UOiB7IGZhbWlseTogJ0FyaWFsJywgc2l6ZTogMTIgfSxcbn07XG5leHBvcnQgY2xhc3MgTGF5b3V0IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICB0aGlzLmlkID0gcHJvcHMuaWQgfHwgTGF5b3V0LmdlbmVyYXRlSWQoKTtcbiAgICAgICAgdGhpcy50eXBlID0gcHJvcHMudHlwZTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHByb3BzLnBvc2l0aW9uIHx8IHsgLi4uREVGQVVMVF9WQUxVRVMuUE9TSVRJT04gfTtcbiAgICAgICAgdGhpcy5zaXplID0gdGhpcy52YWxpZGF0ZVNpemUocHJvcHMuc2l6ZSA/PyBERUZBVUxUX1ZBTFVFUy5TSVpFKTtcbiAgICAgICAgdGhpcy5hc3BlY3RSYXRpbyA9IHRoaXMudmFsaWRhdGVBc3BlY3RSYXRpbyhwcm9wcy5hc3BlY3RSYXRpbyA/PyBERUZBVUxUX1ZBTFVFUy5BU1BFQ1RfUkFUSU8pO1xuICAgICAgICB0aGlzLnZpZXcgPSBwcm9wcy52aWV3O1xuICAgICAgICB0aGlzLmFuZ2xlID0gdGhpcy5ub3JtYWxpemVBbmdsZShwcm9wcy5hbmdsZSA/PyBERUZBVUxUX1ZBTFVFUy5BTkdMRSk7XG4gICAgICAgIHRoaXMubmFtZSA9IHByb3BzLm5hbWUgPz8gbnVsbDtcbiAgICAgICAgaWYgKHByb3BzLnR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgICAgIHRoaXMudXJsID0gcHJvcHMudXJsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHByb3BzLnR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgICAgICAgdGhpcy50ZXh0ID0gcHJvcHMudGV4dCB8fCBERUZBVUxUX1ZBTFVFUy5URVhUO1xuICAgICAgICAgICAgdGhpcy5mb250ID0gcHJvcHMuZm9udCA/IHsgLi4ucHJvcHMuZm9udCB9IDogeyAuLi5ERUZBVUxUX1ZBTFVFUy5GT05UIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljIGdlbmVyYXRlSWQoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY3J5cHRvICE9PSAndW5kZWZpbmVkJyAmJiBjcnlwdG8ucmFuZG9tVVVJRCkge1xuICAgICAgICAgICAgcmV0dXJuIGNyeXB0by5yYW5kb21VVUlEKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGAke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIsIDExKX1gO1xuICAgIH1cbiAgICB2YWxpZGF0ZVNpemUoc2l6ZSkge1xuICAgICAgICBpZiAoc2l6ZSA8PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEludmFsaWQgc2l6ZSAke3NpemV9LCB1c2luZyBkZWZhdWx0ICR7REVGQVVMVF9WQUxVRVMuU0laRX1gKTtcbiAgICAgICAgICAgIHJldHVybiBERUZBVUxUX1ZBTFVFUy5TSVpFO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaXplO1xuICAgIH1cbiAgICB2YWxpZGF0ZUFzcGVjdFJhdGlvKHJhdGlvKSB7XG4gICAgICAgIGlmIChyYXRpbyA8PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEludmFsaWQgYXNwZWN0IHJhdGlvICR7cmF0aW99LCB1c2luZyBkZWZhdWx0ICR7REVGQVVMVF9WQUxVRVMuQVNQRUNUX1JBVElPfWApO1xuICAgICAgICAgICAgcmV0dXJuIERFRkFVTFRfVkFMVUVTLkFTUEVDVF9SQVRJTztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmF0aW87XG4gICAgfVxuICAgIG5vcm1hbGl6ZUFuZ2xlKGFuZ2xlKSB7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBhbmdsZSAlIDM2MDtcbiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQgPCAwID8gbm9ybWFsaXplZCArIDM2MCA6IG5vcm1hbGl6ZWQ7XG4gICAgfVxuICAgIGlzSW1hZ2VMYXlvdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGUgPT09ICdpbWFnZScgJiYgdGhpcy51cmwgIT09IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaXNUZXh0TGF5b3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlID09PSAndGV4dCcgJiYgdGhpcy50ZXh0ICE9PSB1bmRlZmluZWQgJiYgdGhpcy5mb250ICE9PSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHNldFBvc2l0aW9uKHgsIHkpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHsgeCwgeSB9O1xuICAgIH1cbiAgICBtb3ZlKGR4LCBkeSkge1xuICAgICAgICB0aGlzLnBvc2l0aW9uLnggKz0gZHg7XG4gICAgICAgIHRoaXMucG9zaXRpb24ueSArPSBkeTtcbiAgICB9XG4gICAgc2V0U2l6ZShzaXplKSB7XG4gICAgICAgIHRoaXMuc2l6ZSA9IHRoaXMudmFsaWRhdGVTaXplKHNpemUpO1xuICAgIH1cbiAgICByb3RhdGUoYW5nbGUpIHtcbiAgICAgICAgdGhpcy5hbmdsZSA9IHRoaXMubm9ybWFsaXplQW5nbGUodGhpcy5hbmdsZSArIGFuZ2xlKTtcbiAgICB9XG4gICAgc2V0QW5nbGUoYW5nbGUpIHtcbiAgICAgICAgdGhpcy5hbmdsZSA9IHRoaXMubm9ybWFsaXplQW5nbGUoYW5nbGUpO1xuICAgIH1cbiAgICBzZXRUZXh0KHRleHQpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNUZXh0TGF5b3V0KCkpIHtcbiAgICAgICAgICAgIHRoaXMudGV4dCA9IHRleHQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0Rm9udChmb250KSB7XG4gICAgICAgIGlmICh0aGlzLmlzVGV4dExheW91dCgpICYmIHRoaXMuZm9udCkge1xuICAgICAgICAgICAgdGhpcy5mb250ID0geyAuLi50aGlzLmZvbnQsIC4uLmZvbnQgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjbG9uZSgpIHtcbiAgICAgICAgaWYgKHRoaXMudHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgICAgICAgY29uc3QgcHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlJyxcbiAgICAgICAgICAgICAgICB1cmw6IHRoaXMudXJsLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7IC4uLnRoaXMucG9zaXRpb24gfSxcbiAgICAgICAgICAgICAgICBzaXplOiB0aGlzLnNpemUsXG4gICAgICAgICAgICAgICAgYXNwZWN0UmF0aW86IHRoaXMuYXNwZWN0UmF0aW8sXG4gICAgICAgICAgICAgICAgdmlldzogdGhpcy52aWV3LFxuICAgICAgICAgICAgICAgIGFuZ2xlOiB0aGlzLmFuZ2xlLFxuICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gbmV3IExheW91dChwcm9wcyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBwcm9wcyA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHsgLi4udGhpcy5wb3NpdGlvbiB9LFxuICAgICAgICAgICAgICAgIHNpemU6IHRoaXMuc2l6ZSxcbiAgICAgICAgICAgICAgICBhc3BlY3RSYXRpbzogdGhpcy5hc3BlY3RSYXRpbyxcbiAgICAgICAgICAgICAgICB2aWV3OiB0aGlzLnZpZXcsXG4gICAgICAgICAgICAgICAgYW5nbGU6IHRoaXMuYW5nbGUsXG4gICAgICAgICAgICAgICAgbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICh0aGlzLnRleHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHByb3BzLnRleHQgPSB0aGlzLnRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5mb250ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBwcm9wcy5mb250ID0geyAuLi50aGlzLmZvbnQgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgTGF5b3V0KHByb3BzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIGNvbnN0IGJhc2UgPSB7XG4gICAgICAgICAgICBpZDogdGhpcy5pZCxcbiAgICAgICAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLnBvc2l0aW9uLFxuICAgICAgICAgICAgc2l6ZTogdGhpcy5zaXplLFxuICAgICAgICAgICAgYXNwZWN0UmF0aW86IHRoaXMuYXNwZWN0UmF0aW8sXG4gICAgICAgICAgICB2aWV3OiB0aGlzLnZpZXcsXG4gICAgICAgICAgICBhbmdsZTogdGhpcy5hbmdsZSxcbiAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHRoaXMudHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgICAgICAgcmV0dXJuIHsgLi4uYmFzZSwgdXJsOiB0aGlzLnVybCB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICAgICAgICByZXR1cm4geyAuLi5iYXNlLCB0ZXh0OiB0aGlzLnRleHQsIGZvbnQ6IHRoaXMuZm9udCB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYXNlO1xuICAgIH1cbiAgICBzdGF0aWMgZnJvbUpTT04oanNvbikge1xuICAgICAgICByZXR1cm4gbmV3IExheW91dChqc29uKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZUltYWdlKHByb3BzKSB7XG4gICAgICAgIHJldHVybiBuZXcgTGF5b3V0KHsgLi4ucHJvcHMsIHR5cGU6ICdpbWFnZScgfSk7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGVUZXh0KHByb3BzKSB7XG4gICAgICAgIHJldHVybiBuZXcgTGF5b3V0KHsgLi4ucHJvcHMsIHR5cGU6ICd0ZXh0JyB9KTtcbiAgICB9XG59XG4iLCJleHBvcnQgY2xhc3MgVHlwZWRFdmVudEVtaXR0ZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmxpc3RlbmVycyA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgb24oZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5saXN0ZW5lcnMuaGFzKGV2ZW50KSkge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuc2V0KGV2ZW50LCBuZXcgU2V0KCkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGlzdGVuZXJzLmdldChldmVudCkuYWRkKGxpc3RlbmVyKTtcbiAgICB9XG4gICAgb25jZShldmVudCwgbGlzdGVuZXIpIHtcbiAgICAgICAgY29uc3Qgb25jZVdyYXBwZXIgPSAoZGV0YWlsKSA9PiB7XG4gICAgICAgICAgICBsaXN0ZW5lcihkZXRhaWwpO1xuICAgICAgICAgICAgdGhpcy5vZmYoZXZlbnQsIG9uY2VXcmFwcGVyKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5vbihldmVudCwgb25jZVdyYXBwZXIpO1xuICAgIH1cbiAgICBvZmYoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50TGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnMuZ2V0KGV2ZW50KTtcbiAgICAgICAgaWYgKGV2ZW50TGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBldmVudExpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuICAgICAgICAgICAgaWYgKGV2ZW50TGlzdGVuZXJzLnNpemUgPT09IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5kZWxldGUoZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGVtaXQoZXZlbnQsIGRldGFpbCkge1xuICAgICAgICBjb25zdCBldmVudExpc3RlbmVycyA9IHRoaXMubGlzdGVuZXJzLmdldChldmVudCk7XG4gICAgICAgIGlmIChldmVudExpc3RlbmVycykge1xuICAgICAgICAgICAgZXZlbnRMaXN0ZW5lcnMuZm9yRWFjaChsaXN0ZW5lciA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIoZGV0YWlsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtFdmVudEVtaXR0ZXJdINCe0YjQuNCx0LrQsCDQsiDQvtCx0YDQsNCx0L7RgtGH0LjQutC1INGB0L7QsdGL0YLQuNGPIFwiJHtTdHJpbmcoZXZlbnQpfVwiOmAsIGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5kZWxldGUoZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuY2xlYXIoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsaXN0ZW5lckNvdW50KGV2ZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVycy5nZXQoZXZlbnQpPy5zaXplIHx8IDA7XG4gICAgfVxuICAgIGhhc0xpc3RlbmVycyhldmVudCkge1xuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lckNvdW50KGV2ZW50KSA+IDA7XG4gICAgfVxuICAgIGV2ZW50TmFtZXMoKSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMubGlzdGVuZXJzLmtleXMoKSk7XG4gICAgfVxuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzLmNsZWFyKCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgRWRpdG9yU3RvcmFnZU1hbmFnZXIgfSBmcm9tICcuLi9tYW5hZ2Vycy9FZGl0b3JTdG9yYWdlTWFuYWdlcic7XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVJbWFnZSh7IHVyaSwgcHJvbXB0LCBzaGlydENvbG9yLCBpbWFnZSwgd2l0aEFpLCBsYXlvdXRJZCwgaXNOZXcgPSB0cnVlLCBiYWNrZ3JvdW5kID0gdHJ1ZSwgfSkge1xuICAgIGNvbnN0IHRlbXBTdG9yYWdlTWFuYWdlciA9IG5ldyBFZGl0b3JTdG9yYWdlTWFuYWdlcigpO1xuICAgIGNvbnN0IHVzZXJJZCA9IGF3YWl0IHRlbXBTdG9yYWdlTWFuYWdlci5nZXRVc2VySWQoKTtcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgIGZvcm1EYXRhLnNldCgndXNlcklkJywgdXNlcklkKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3Byb21wdCcsIHByb21wdCk7XG4gICAgZm9ybURhdGEuc2V0KCdzaGlydENvbG9yJywgc2hpcnRDb2xvcik7XG4gICAgZm9ybURhdGEuc2V0KCdwbGFjZW1lbnQnLCAnY2VudGVyJyk7XG4gICAgZm9ybURhdGEuc2V0KCdwcmludFNpemUnLCBcImJpZ1wiKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3RyYW5zZmVyVHlwZScsICcnKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3JlcXVlc3RfdHlwZScsICdnZW5lcmF0ZScpO1xuICAgIGZvcm1EYXRhLnNldCgnYmFja2dyb3VuZCcsIGJhY2tncm91bmQudG9TdHJpbmcoKSk7XG4gICAgaWYgKGxheW91dElkKVxuICAgICAgICBmb3JtRGF0YS5zZXQoJ2xheW91dElkJywgbGF5b3V0SWQpO1xuICAgIGlmIChpbWFnZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZ2VuZXJhdGUgaW1hZ2VdJywgaW1hZ2UpO1xuICAgICAgICBjb25zdCBbaGVhZGVyLCBkYXRhXSA9IGltYWdlLnNwbGl0KCcsJyk7XG4gICAgICAgIGNvbnN0IHR5cGUgPSBoZWFkZXIuc3BsaXQoJzonKVsxXS5zcGxpdCgnOycpWzBdO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZ2VuZXJhdGUgaW1hZ2VdIFt0eXBlXScsIHR5cGUpO1xuICAgICAgICBjb25zdCBieXRlQ2hhcmFjdGVycyA9IGF0b2IoZGF0YSk7XG4gICAgICAgIGNvbnN0IGJ5dGVOdW1iZXJzID0gbmV3IEFycmF5KGJ5dGVDaGFyYWN0ZXJzLmxlbmd0aCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnl0ZUNoYXJhY3RlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGJ5dGVOdW1iZXJzW2ldID0gYnl0ZUNoYXJhY3RlcnMuY2hhckNvZGVBdChpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBieXRlQXJyYXkgPSBuZXcgVWludDhBcnJheShieXRlTnVtYmVycyk7XG4gICAgICAgIGZvcm1EYXRhLnNldCgncmVxdWVzdF90eXBlJywgJ2ltYWdlJyk7XG4gICAgICAgIGZvcm1EYXRhLnNldCgndXNlcl9pbWFnZScsIG5ldyBCbG9iKFtieXRlQXJyYXldLCB7IHR5cGU6IFwiaW1hZ2UvcG5nXCIgfSkpO1xuICAgICAgICBmb3JtRGF0YS5zZXQoJ3RyYW5zZmVyVHlwZScsIHdpdGhBaSA/IFwiYWlcIiA6IFwibm8tYWlcIik7XG4gICAgfVxuICAgIGlmICghaXNOZXcpIHtcbiAgICAgICAgZm9ybURhdGEuc2V0KCdyZXF1ZXN0X3R5cGUnLCAnZWRpdCcpO1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVyaSwge1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBib2R5OiBmb3JtRGF0YSxcbiAgICB9KTtcbiAgICBjb25zdCByZXNwb25zZURhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgcmV0dXJuIHJlc3BvbnNlRGF0YS5pbWFnZV91cmwgfHwgcmVzcG9uc2VEYXRhLmltYWdlO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVByb2R1Y3QoeyBxdWFudGl0eSwgbmFtZSwgc2l6ZSwgY29sb3IsIHNpZGVzLCBhcnRpY2xlLCBwcmljZSB9KSB7XG4gICAgY29uc3QgcHJvZHVjdElkID0gJzY5ODM0MTY0MjgzMl8nICsgRGF0ZS5ub3coKTtcbiAgICBjb25zdCBkZXNpZ25WYXJpYW50ID0gc2lkZXMubGVuZ3RoID4gMSA/IGA8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiJHtzaWRlc1swXT8uaW1hZ2VfdXJsfVwiIHRhcmdldD1cIl9ibGFua1wiPiR7c2lkZXNbMF0/LmltYWdlX3VybC5zbGljZSgtMTApfTwvYT4sIDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCIke3NpZGVzWzFdPy5pbWFnZV91cmx9XCIgdGFyZ2V0PVwiX2JsYW5rXCI+JHtzaWRlc1sxXT8uaW1hZ2VfdXJsLnNsaWNlKC0xMCl9PC9hPmAgOiBgPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiR7c2lkZXNbMF0/LmltYWdlX3VybH1cIiB0YXJnZXQ9XCJfYmxhbmtcIj4ke3NpZGVzWzBdPy5pbWFnZV91cmwuc2xpY2UoLTEwKX08L2E+YDtcbiAgICBjb25zdCByZXN1bHRQcm9kdWN0ID0ge1xuICAgICAgICBpZDogcHJvZHVjdElkLFxuICAgICAgICBuYW1lLFxuICAgICAgICBwcmljZSxcbiAgICAgICAgcXVhbnRpdHk6IHF1YW50aXR5LFxuICAgICAgICBpbWc6IHNpZGVzWzBdPy5pbWFnZV91cmwsXG4gICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICAgIHsgb3B0aW9uOiAn0KDQsNC30LzQtdGAJywgdmFyaWFudDogc2l6ZSB9LFxuICAgICAgICAgICAgeyBvcHRpb246ICfQlNC40LfQsNC50L0nLCB2YXJpYW50OiBkZXNpZ25WYXJpYW50IH0sXG4gICAgICAgICAgICB7IG9wdGlvbjogJ9CQ0YDRgtC40LrRg9C7JywgdmFyaWFudDogYXJ0aWNsZSB9LFxuICAgICAgICAgICAgeyBvcHRpb246ICfQptCy0LXRgicsIHZhcmlhbnQ6IGNvbG9yLm5hbWUgfSxcbiAgICAgICAgICAgIHsgb3B0aW9uOiAn0J/RgNC40L3RgicsIHZhcmlhbnQ6IHNpZGVzLmxlbmd0aCA9PSAxID8gJ9Ce0LTQvdC+0YHRgtC+0YDQvtC90L3QuNC5JyA6ICfQlNCy0YPRhdGB0YLQvtGA0L7QvdC90LjQuScgfSxcbiAgICAgICAgXVxuICAgIH07XG4gICAgY29uc29sZS5kZWJ1ZygnW2NhcnRdIGFkZCBwcm9kdWN0JywgcmVzdWx0UHJvZHVjdCk7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cudGNhcnRfX2FkZFByb2R1Y3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHdpbmRvdy50Y2FydF9fYWRkUHJvZHVjdChyZXN1bHRQcm9kdWN0KTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgd2luZG93LnltKDEwMzI3OTIxNCwgJ3JlYWNoR29hbCcsICdhZGRfdG9fY2FydCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7IH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tjYXJ0XSDQntGI0LjQsdC60LAg0L/RgNC4INC00L7QsdCw0LLQu9C10L3QuNC4INC/0YDQvtC00YPQutGC0LAg0LIg0LrQvtGA0LfQuNC90YMnLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNvbnNvbGUud2FybignW2NhcnRdINCa0L7RgNC30LjQvdCwIFRpbGRhINC90LUg0LfQsNCz0YDRg9C20LXQvdCwLicpO1xuICAgIH1cbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0Q2hpbGQoZWxlbWVudCkge1xuICAgIGlmICghZWxlbWVudClcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgaWYgKCFlbGVtZW50LmZpcnN0RWxlbWVudENoaWxkKVxuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICByZXR1cm4gZ2V0TGFzdENoaWxkKGVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQpO1xufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgUG9wdXAgZnJvbSAnLi9jb21wb25lbnRzL1BvcHVwJztcbmltcG9ydCBFZGl0b3IgZnJvbSAnLi9jb21wb25lbnRzL0VkaXRvcic7XG5pbXBvcnQgeyBDYXJkRm9ybSB9IGZyb20gJy4vY29tcG9uZW50cy9DYXJkRm9ybSc7XG53aW5kb3cucG9wdXAgPSBQb3B1cDtcbndpbmRvdy5lZGl0b3IgPSBFZGl0b3I7XG53aW5kb3cuY2FyZEZvcm0gPSBDYXJkRm9ybTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==