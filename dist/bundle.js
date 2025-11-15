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
/* harmony import */ var _utils_canvasUtils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/canvasUtils */ "./src/utils/canvasUtils.ts");






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
                try {
                    window.OpenReplay.issue("generate", {
                        uri: this.apiConfig.webhookRequest,
                        prompt,
                        shirtColor: this._selectColor.name,
                        image: this._selectLayout ? this.loadedUserImage !== this.layouts.find(layout => layout.id === this._selectLayout)?.url ? this.loadedUserImage : null : this.loadedUserImage,
                        withAi: this.editorLoadWithAi,
                        layoutId,
                        isNew: this._selectLayout ? false : true,
                        background: !this.editorRemoveBackground,
                    });
                }
                catch (error) {
                    console.error('Ошибка установки ID пользователя в tracker:', error);
                }
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
                    try {
                        window.OpenReplay.issue("load-file", file.name);
                    }
                    catch (error) {
                        console.error('Ошибка установки ID пользователя в tracker:', error);
                    }
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
/* harmony import */ var _utils_safeRouteIntegrationV2__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils/safeRouteIntegrationV2 */ "./src/utils/safeRouteIntegrationV2.ts");




window.popup = _components_Popup__WEBPACK_IMPORTED_MODULE_0__["default"];
window.editor = _components_Editor__WEBPACK_IMPORTED_MODULE_1__["default"];
window.cardForm = _components_CardForm__WEBPACK_IMPORTED_MODULE_2__.CardForm;
(0,_utils_safeRouteIntegrationV2__WEBPACK_IMPORTED_MODULE_3__.initSafeRouteV2)();

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhCQUE4Qix1QkFBdUI7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ087QUFDUCxrQkFBa0Isb0JBQW9CO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnREFBZ0QsYUFBYTtBQUM3RDtBQUNBO0FBQ0E7QUFDQSxnREFBZ0QsYUFBYTtBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0RBQWtEO0FBQ2xELGtEQUFrRDtBQUNsRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtREFBbUQsa0NBQWtDLElBQUksbUNBQW1DLElBQUksaUNBQWlDO0FBQ2pLO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUM7QUFDakM7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QixxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnRkFBZ0YsbUJBQW1CO0FBQ25HO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUM7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrRUFBK0UsbUJBQW1CO0FBQ2xHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNEVBQTRFLDBCQUEwQjtBQUN0RztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrRUFBK0UsU0FBUztBQUN4RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtFQUFrRSxlQUFlO0FBQ2pGLGlFQUFpRSxlQUFlO0FBQ2hGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0RBQXNELG9DQUFvQyxFQUFFLGtDQUFrQztBQUM5SDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUVBQXFFLFNBQVM7QUFDOUU7QUFDQTtBQUNBLGtFQUFrRSxTQUFTO0FBQzNFO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdDQUF3QyxpQkFBaUIsRUFBRSxrQ0FBa0M7QUFDN0Y7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUMsYUFBYSxHQUFHLEtBQUs7QUFDMUQ7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvRkFBb0YsU0FBUztBQUM3RjtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBFQUEwRSxTQUFTO0FBQ25GO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1RUFBdUUsSUFBSTtBQUMzRTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsSUFBSSxHQUFHLFdBQVc7QUFDcEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdGQUF3RixZQUFZO0FBQ3BHO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsbUVBQW1FLFlBQVk7QUFDL0U7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3QwQndFO0FBQzlCO0FBQ1M7QUFDWTtBQUNIO0FBQ21CO0FBQy9FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDLDBDQUEwQztBQUM1QjtBQUNmLHVCQUF1QjtBQUN2Qix3QkFBd0I7QUFDeEIsdUJBQXVCO0FBQ3ZCLHVCQUF1QjtBQUN2Qix5QkFBeUI7QUFDekIsa0JBQWtCLHdEQUF3RDtBQUMxRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEIsdUVBQWlCO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0NBQWtDLGdGQUFvQjtBQUN0RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUFpRCwyQkFBMkI7QUFDNUU7QUFDQTtBQUNBLGlEQUFpRCxrREFBTTtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJDQUEyQyxLQUFLO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdFQUF3RSxTQUFTO0FBQ2pGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQix1QkFBdUI7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtREFBbUQsbUNBQW1DO0FBQ3RGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxvQkFBb0IsdUJBQXVCO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsNkVBQXlCO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLDhCQUE4QjtBQUN6RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsOEJBQThCO0FBQ3pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCLEtBQUssRUFBRSxVQUFVO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsc0JBQXNCLElBQUksc0JBQXNCLEdBQUcsc0JBQXNCLEdBQUcsdUJBQXVCO0FBQ3RIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzREFBc0QsS0FBSztBQUMzRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ087QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7QUM1T087QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7VUNOQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQ3RCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHlDQUF5Qyx3Q0FBd0M7V0FDakY7V0FDQTtXQUNBLEU7Ozs7O1dDUEEsd0Y7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdELEU7Ozs7Ozs7Ozs7Ozs7OztBQ051QztBQUNFO0FBQ1E7QUFDZ0I7QUFDakUsZUFBZSx5REFBSztBQUNwQixnQkFBZ0IsMERBQU07QUFDdEIsa0JBQWtCLDBEQUFRO0FBQzFCLDhFQUFlIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9jb21wb25lbnRzL0NhcmRGb3JtLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvY29tcG9uZW50cy9FZGl0b3IudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9jb21wb25lbnRzL1BvcHVwLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvbWFuYWdlcnMvRWRpdG9yU3RvcmFnZU1hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9tb2RlbHMvTGF5b3V0LnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvdXRpbHMvVHlwZWRFdmVudEVtaXR0ZXIudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy91dGlscy9hcGkudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy91dGlscy9jYW52YXNVdGlscy50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL3V0aWxzL3NhZmVSb3V0ZUludGVncmF0aW9uVjIudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy91dGlscy90aWxkYVV0aWxzLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IERPTV9TRUxFQ1RPUlMgPSB7XG4gICAgQ0FSVF9DT05UQUlORVI6ICcudDcwNl9fY2FydHdpbi1wcm9kdWN0cywgLnQtc3RvcmVfX2NhcnQtcHJvZHVjdHMsIC50LXN0b3JlJyxcbiAgICBDQVJUX1BST0RVQ1Q6ICcudDcwNl9fY2FydHdpbi1wcm9kdWN0LCAudC1zdG9yZV9fY2FyZCwgLnQ3MDZfX3Byb2R1Y3QnLFxuICAgIFBST0RVQ1RfVElUTEU6ICcudDcwNl9fcHJvZHVjdC10aXRsZSwgLnQtc3RvcmVfX2NhcmRfX3RpdGxlLCAudDcwNl9fcHJvZHVjdC1uYW1lJyxcbiAgICBQUk9EVUNUX0RFTF9CVVRUT046ICcudDcwNl9fcHJvZHVjdC1kZWwnLFxuICAgIFBST0RVQ1RfUExVU19CVVRUT046ICcudDcwNl9fcHJvZHVjdC1wbHVzJyxcbiAgICBQUk9EVUNUX01JTlVTX0JVVFRPTjogJy50NzA2X19wcm9kdWN0LW1pbnVzJyxcbiAgICBQUk9EVUNUX1BMVVNNSU5VUzogJy50NzA2X19wcm9kdWN0LXBsdXNtaW51cycsXG4gICAgUFJPRFVDVF9RVUFOVElUWTogJy50NzA2X19wcm9kdWN0LXF1YW50aXR5LCAudC1zdG9yZV9fY2FyZF9fcXVhbnRpdHknLFxuICAgIENBUlRfQ09VTlRFUjogJy50NzA2X19jYXJ0aWNvbi1jb3VudGVyLCAudC1zdG9yZV9fY291bnRlcicsXG4gICAgQ0FSVF9BTU9VTlQ6ICcudDcwNl9fY2FydHdpbi1wcm9kYW1vdW50LCAudC1zdG9yZV9fdG90YWwtYW1vdW50Jyxcbn07XG5jb25zdCBERUxBWVMgPSB7XG4gICAgQ0FSVF9VUERBVEU6IDMwMCxcbiAgICBET01fVVBEQVRFOiAxMDAsXG4gICAgT0JTRVJWRVJfQ0hFQ0s6IDUwMCxcbiAgICBDQVJUX0xPQURfVElNRU9VVDogMzAwMCxcbn07XG5jbGFzcyBDYXJ0VXRpbHMge1xuICAgIHN0YXRpYyB3YWl0KG1zKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbiAgICB9XG4gICAgc3RhdGljIGFzeW5jIHdhaXRGb3JFbGVtZW50KHNlbGVjdG9yLCBtYXhBdHRlbXB0cyA9IDEwLCBpbnRlcnZhbCA9IDEwMCkge1xuICAgICAgICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IG1heEF0dGVtcHRzOyBhdHRlbXB0KyspIHtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXR0ZW1wdCA8IG1heEF0dGVtcHRzIC0gMSkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMud2FpdChpbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHN0YXRpYyBmaW5kUHJvZHVjdEVsZW1lbnQocHJvZHVjdE5hbWUpIHtcbiAgICAgICAgY29uc3QgcHJvZHVjdHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKERPTV9TRUxFQ1RPUlMuQ0FSVF9QUk9EVUNUKTtcbiAgICAgICAgZm9yIChjb25zdCBwcm9kdWN0IG9mIHByb2R1Y3RzKSB7XG4gICAgICAgICAgICBjb25zdCB0aXRsZSA9IHByb2R1Y3QucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLlBST0RVQ1RfVElUTEUpO1xuICAgICAgICAgICAgaWYgKHRpdGxlICYmIHRpdGxlLnRleHRDb250ZW50Py50cmltKCkgPT09IHByb2R1Y3ROYW1lLnRyaW0oKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9kdWN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBDYXJkRm9ybSB7XG4gICAgY29uc3RydWN0b3IoeyBjYXJkQmxvY2tJZCwgcnVsZXMgfSkge1xuICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuaXNVcGRhdGluZ0NhcnQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc0FwcGx5aW5nQWN0aW9ucyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNhcmRCbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY2FyZEJsb2NrSWQpO1xuICAgICAgICBpZiAoIXRoaXMuY2FyZEJsb2NrKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBDYXJkIGJsb2NrIHdpdGggaWQgJHtjYXJkQmxvY2tJZH0gbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mb3JtID0gdGhpcy5jYXJkQmxvY2sucXVlcnlTZWxlY3RvcignZm9ybScpO1xuICAgICAgICBpZiAoIXRoaXMuZm9ybSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRm9ybSBibG9jayB3aXRoIGlkICR7Y2FyZEJsb2NrSWR9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pbml0Rm9ybSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucnVsZXMgPSBydWxlcztcbiAgICAgICAgdGhpcy5maWVsZHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudC1pbnB1dC1ncm91cCcpO1xuICAgICAgICB0aGlzLmluaXRSdWxlcygpO1xuICAgICAgICB0aGlzLmluaXRDYXJ0T2JzZXJ2ZXIoKTtcbiAgICB9XG4gICAgaW5pdEZvcm0oKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdF0nLCB0aGlzLmZvcm0uZWxlbWVudHMpO1xuICAgICAgICB0aGlzLmZvcm0uYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSB0YXJnZXQ/Lm5hbWU7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFZhbHVlID0gdGFyZ2V0Py52YWx1ZTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5wdXRdJywgZSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGZpZWxkVmFsdWUsIFwifFwiLCBmaWVsZE5hbWUpO1xuICAgICAgICAgICAgY29uc3QgcnVsZSA9IHRoaXMucnVsZXMuZmluZChyID0+IHIudmFyaWFibGUgPT09IGZpZWxkTmFtZSk7XG4gICAgICAgICAgICBpZiAocnVsZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZFN0YXRlID0gbmV3IE1hcCh0aGlzLmFjdGlvbnNTdGF0ZXMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IHJ1bGUuYWN0aW9ucy5maW5kKGEgPT4gYS52YWx1ZSA9PT0gZmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuc2V0KGZpZWxkTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGZpZWxkVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGFjdGlvblxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcy5zZXQoZmllbGROYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwbHlBY3Rpb25zKG9sZFN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZm9ybS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSB0YXJnZXQ/Lm5hbWU7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFZhbHVlID0gdGFyZ2V0Py52YWx1ZTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2hhbmdlXScsIGUpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhmaWVsZFZhbHVlLCBcInxcIiwgZmllbGROYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IHJ1bGUgPSB0aGlzLnJ1bGVzLmZpbmQociA9PiByLnZhcmlhYmxlID09PSBmaWVsZE5hbWUpO1xuICAgICAgICAgICAgaWYgKHJ1bGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb24gPSBydWxlLmFjdGlvbnMuZmluZChhID0+IGEudmFsdWUgPT09IGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkU3RhdGUgPSBuZXcgTWFwKHRoaXMuYWN0aW9uc1N0YXRlcyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcy5zZXQoZmllbGROYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZmllbGRWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmFwcGx5QWN0aW9ucyhvbGRTdGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRTdGF0ZSA9IG5ldyBNYXAodGhpcy5hY3Rpb25zU3RhdGVzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLnNldChmaWVsZE5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogbnVsbFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHBseUFjdGlvbnMob2xkU3RhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIGluaXRSdWxlcygpIHtcbiAgICAgICAgdGhpcy5ydWxlcy5mb3JFYWNoKHJ1bGUgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bGUuYWx3YXlzQWN0aXZlICYmIHJ1bGUuYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gcnVsZS5hY3Rpb25zWzBdO1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLnNldChydWxlLnZhcmlhYmxlLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogYWN0aW9uLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdFJ1bGVzXSDQmNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QviDQv9C+0YHRgtC+0Y/QvdC90L7QtSDQv9GA0LDQstC40LvQvjonLCBydWxlLnZhcmlhYmxlLCBhY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBmaWVsZCA9IHRoaXMuZm9ybS5lbGVtZW50cy5uYW1lZEl0ZW0ocnVsZS52YXJpYWJsZSk7XG4gICAgICAgICAgICBpZiAoZmllbGQpIHtcbiAgICAgICAgICAgICAgICBsZXQgZmllbGRWYWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZCBpbnN0YW5jZW9mIFJhZGlvTm9kZUxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2tlZFJhZGlvID0gQXJyYXkuZnJvbShmaWVsZCkuZmluZCgocmFkaW8pID0+IHJhZGlvLmNoZWNrZWQpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlID0gY2hlY2tlZFJhZGlvPy52YWx1ZSB8fCAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZmllbGQgaW5zdGFuY2VvZiBIVE1MU2VsZWN0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlID0gZmllbGQudmFsdWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGZpZWxkIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gJ3JhZGlvJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZSA9IGZpZWxkLmNoZWNrZWQgPyBmaWVsZC52YWx1ZSA6ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09ICdjaGVja2JveCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWUgPSBmaWVsZC5jaGVja2VkID8gZmllbGQudmFsdWUgOiAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWUgPSBmaWVsZC52YWx1ZSB8fCAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRSdWxlc10g0J/QvtC70LU6JywgcnVsZS52YXJpYWJsZSwgJ9CX0L3QsNGH0LXQvdC40LU6JywgZmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gcnVsZS5hY3Rpb25zLmZpbmQoYSA9PiBhLnZhbHVlID09PSBmaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uICYmIGZpZWxkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLnNldChydWxlLnZhcmlhYmxlLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZmllbGRWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRSdWxlc10g0JjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90L4g0YHQvtGB0YLQvtGP0L3QuNC1INC00LvRjzonLCBydWxlLnZhcmlhYmxlLCBhY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IHRoaXMuY2xlYW51cENhcnRPbkluaXQoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5hcHBseUFjdGlvbnMoKTtcbiAgICB9XG4gICAgYXN5bmMgY2xlYW51cENhcnRPbkluaXQoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCd0LDRh9Cw0LvQviDQvtGH0LjRgdGC0LrQuCDQutC+0YDQt9C40L3RiycpO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNoZWNrQ2FydCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgICAgICAgICAgaWYgKHRpbGRhQ2FydCAmJiB0aWxkYUNhcnQucHJvZHVjdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh2b2lkIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChjaGVja0NhcnQsIDIwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNoZWNrQ2FydCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAoIXRpbGRhQ2FydCB8fCAhQXJyYXkuaXNBcnJheSh0aWxkYUNhcnQucHJvZHVjdHMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCa0L7RgNC30LjQvdCwINC90LXQtNC+0YHRgtGD0L/QvdCwJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0KLQvtCy0LDRgNGLINCyINC60L7RgNC30LjQvdC1OicsIHRpbGRhQ2FydC5wcm9kdWN0cy5tYXAoKHApID0+IHAubmFtZSkpO1xuICAgICAgICBjb25zdCBhbGxSdWxlUHJvZHVjdHMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMucnVsZXMuZm9yRWFjaChydWxlID0+IHtcbiAgICAgICAgICAgIHJ1bGUuYWN0aW9ucy5mb3JFYWNoKGFjdGlvbiA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBhbGxSdWxlUHJvZHVjdHMuYWRkKGFjdGlvbi52YWx1ZS50cmltKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYWN0aXZlUHJvZHVjdHMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcy5mb3JFYWNoKChzdGF0ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHN0YXRlLmFjdGlvbiAmJiBzdGF0ZS5hY3Rpb24udmFsdWUpIHtcbiAgICAgICAgICAgICAgICBhY3RpdmVQcm9kdWN0cy5hZGQoc3RhdGUuYWN0aW9uLnZhbHVlLnRyaW0oKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQktGB0LUg0YLQvtCy0LDRgNGLINC40Lcg0L/RgNCw0LLQuNC7OicsIEFycmF5LmZyb20oYWxsUnVsZVByb2R1Y3RzKSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCQ0LrRgtC40LLQvdGL0LUg0YLQvtCy0LDRgNGLOicsIEFycmF5LmZyb20oYWN0aXZlUHJvZHVjdHMpKTtcbiAgICAgICAgY29uc3QgcHJvZHVjdHNUb1JlbW92ZSA9IFtdO1xuICAgICAgICB0aWxkYUNhcnQucHJvZHVjdHMuZm9yRWFjaCgocHJvZHVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdE5hbWUgPSBwcm9kdWN0Lm5hbWU/LnRyaW0oKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0TmFtZSAmJiBhbGxSdWxlUHJvZHVjdHMuaGFzKHByb2R1Y3ROYW1lKSAmJiAhYWN0aXZlUHJvZHVjdHMuaGFzKHByb2R1Y3ROYW1lKSkge1xuICAgICAgICAgICAgICAgIHByb2R1Y3RzVG9SZW1vdmUucHVzaChwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQotC+0LLQsNGA0Ysg0LTQu9GPINGD0LTQsNC70LXQvdC40Y86JywgcHJvZHVjdHNUb1JlbW92ZSk7XG4gICAgICAgIGlmIChwcm9kdWN0c1RvUmVtb3ZlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcHJvZHVjdE5hbWUgb2YgcHJvZHVjdHNUb1JlbW92ZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCj0LTQsNC70Y/QtdC8OicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlbW92ZVByb2R1Y3RGcm9tQ2FydChwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDinJMg0J7Rh9C40YHRgtC60LAg0LfQsNCy0LXRgNGI0LXQvdCwJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQndC10YIg0YLQvtCy0LDRgNC+0LIg0LTQu9GPINGD0LTQsNC70LXQvdC40Y8nKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLmhpZGVRdWFudGl0eUNvbnRyb2xzRm9yUnVsZVByb2R1Y3RzKCk7XG4gICAgfVxuICAgIHNhdmVUaWxkYUNhcnQodGlsZGFDYXJ0KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLmlzVXBkYXRpbmdDYXJ0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRpbGRhQ2FydC51cGRhdGVkID0gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCk7XG4gICAgICAgICAgICBjb25zdCBjYXJ0RGF0YSA9IHtcbiAgICAgICAgICAgICAgICBwcm9kdWN0czogdGlsZGFDYXJ0LnByb2R1Y3RzIHx8IFtdLFxuICAgICAgICAgICAgICAgIHByb2RhbW91bnQ6IHRpbGRhQ2FydC5wcm9kYW1vdW50IHx8IDAsXG4gICAgICAgICAgICAgICAgYW1vdW50OiB0aWxkYUNhcnQuYW1vdW50IHx8IDAsXG4gICAgICAgICAgICAgICAgdG90YWw6IHRpbGRhQ2FydC5wcm9kdWN0cz8ubGVuZ3RoIHx8IDAsXG4gICAgICAgICAgICAgICAgdXBkYXRlZDogdGlsZGFDYXJ0LnVwZGF0ZWQsXG4gICAgICAgICAgICAgICAgY3VycmVuY3k6IHRpbGRhQ2FydC5jdXJyZW5jeSB8fCBcItGALlwiLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5X3NpZGU6IHRpbGRhQ2FydC5jdXJyZW5jeV9zaWRlIHx8IFwiclwiLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5X3NlcDogdGlsZGFDYXJ0LmN1cnJlbmN5X3NlcCB8fCBcIixcIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV9kZWM6IHRpbGRhQ2FydC5jdXJyZW5jeV9kZWMgfHwgXCJcIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV90eHQ6IHRpbGRhQ2FydC5jdXJyZW5jeV90eHQgfHwgXCLRgC5cIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV90eHRfcjogdGlsZGFDYXJ0LmN1cnJlbmN5X3R4dF9yIHx8IFwiINGALlwiLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5X3R4dF9sOiB0aWxkYUNhcnQuY3VycmVuY3lfdHh0X2wgfHwgXCJcIixcbiAgICAgICAgICAgICAgICBzeXN0ZW06IHRpbGRhQ2FydC5zeXN0ZW0gfHwgXCJub25lXCIsXG4gICAgICAgICAgICAgICAgc2V0dGluZ3M6IHRpbGRhQ2FydC5zZXR0aW5ncyB8fCB7fSxcbiAgICAgICAgICAgICAgICBkZWxpdmVyeTogdGlsZGFDYXJ0LmRlbGl2ZXJ5IHx8IHsgbmFtZTogXCJub2RlbGl2ZXJ5XCIsIHByaWNlOiAwIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndGNhcnQnLCBKU09OLnN0cmluZ2lmeShjYXJ0RGF0YSkpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtzYXZlVGlsZGFDYXJ0XSDinJMg0JrQvtGA0LfQuNC90LAg0YHQvtGF0YDQsNC90LXQvdCwINCyIGxvY2FsU3RvcmFnZScpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc1VwZGF0aW5nQ2FydCA9IGZhbHNlO1xuICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbc2F2ZVRpbGRhQ2FydF0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPOicsIGUpO1xuICAgICAgICAgICAgdGhpcy5pc1VwZGF0aW5nQ2FydCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGluaXRDYXJ0T2JzZXJ2ZXIoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdENhcnRPYnNlcnZlcl0g0JjQvdC40YbQuNCw0LvQuNC30LDRhtC40Y8g0L3QsNCx0LvRjtC00LDRgtC10LvRjyDQutC+0YDQt9C40L3RiycpO1xuICAgICAgICBsZXQgbGFzdE1haW5Qcm9kdWN0c1F0eSA9IHRoaXMuZ2V0TWFpblByb2R1Y3RzUXVhbnRpdHkoKTtcbiAgICAgICAgY29uc3QgY2hlY2tDYXJ0Q2hhbmdlcyA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRRdHkgPSB0aGlzLmdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCk7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF0eSAhPT0gbGFzdE1haW5Qcm9kdWN0c1F0eSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2FydE9ic2VydmVyXSDQmNC30LzQtdC90LjQu9C+0YHRjCDQutC+0LvQuNGH0LXRgdGC0LLQviDRgtC+0LLQsNGA0L7QsjonLCB7XG4gICAgICAgICAgICAgICAgICAgINCx0YvQu9C+OiBsYXN0TWFpblByb2R1Y3RzUXR5LFxuICAgICAgICAgICAgICAgICAgICDRgdGC0LDQu9C+OiBjdXJyZW50UXR5XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbGFzdE1haW5Qcm9kdWN0c1F0eSA9IGN1cnJlbnRRdHk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBvYnNlcnZlQ2FydCA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNhcnRDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuQ0FSVF9DT05UQUlORVIpO1xuICAgICAgICAgICAgaWYgKGNhcnRDb250YWluZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjYXJ0T2JzZXJ2ZXJdIE11dGF0aW9uT2JzZXJ2ZXI6INC+0LHQvdCw0YDRg9C20LXQvdGLINC40LfQvNC10L3QtdC90LjRjycpO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1F0eSA9IHRoaXMuZ2V0TWFpblByb2R1Y3RzUXVhbnRpdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXdRdHkgIT09IGxhc3RNYWluUHJvZHVjdHNRdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0TWFpblByb2R1Y3RzUXR5ID0gbmV3UXR5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZVF1YW50aXR5Q29udHJvbHNGb3JSdWxlUHJvZHVjdHMoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGNhcnRDb250YWluZXIsIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdENhcnRPYnNlcnZlcl0g4pyTIE11dGF0aW9uT2JzZXJ2ZXIg0YPRgdGC0LDQvdC+0LLQu9C10L0nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQob2JzZXJ2ZUNhcnQsIDEwMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBvYnNlcnZlQ2FydCgpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICAgICAgICAgIGNvbnN0IGRlbGV0ZUJ1dHRvbiA9IHRhcmdldC5jbG9zZXN0KERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9ERUxfQlVUVE9OKTtcbiAgICAgICAgICAgIGlmIChkZWxldGVCdXR0b24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0RWxlbWVudCA9IGRlbGV0ZUJ1dHRvbi5jbG9zZXN0KERPTV9TRUxFQ1RPUlMuQ0FSVF9QUk9EVUNUKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvZHVjdEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGl0bGVFbCA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoRE9NX1NFTEVDVE9SUy5QUk9EVUNUX1RJVExFKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdE5hbWUgPSB0aXRsZUVsPy50ZXh0Q29udGVudD8udHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvZHVjdE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2FydE9ic2VydmVyXSDQo9C00LDQu9C10L3QuNC1INGC0L7QstCw0YDQsDonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb24ocHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaXNDYXJ0QnV0dG9uID0gdGFyZ2V0LmNsb3Nlc3QoYCR7RE9NX1NFTEVDVE9SUy5QUk9EVUNUX1BMVVNfQlVUVE9OfSwgJHtET01fU0VMRUNUT1JTLlBST0RVQ1RfTUlOVVNfQlVUVE9OfSwgJHtET01fU0VMRUNUT1JTLlBST0RVQ1RfREVMX0JVVFRPTn1gKTtcbiAgICAgICAgICAgIGlmIChpc0NhcnRCdXR0b24pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0g0JrQu9C40Log0L3QsCDQutC90L7Qv9C60YMg0LrQvtGA0LfQuNC90YsnKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGNoZWNrQ2FydENoYW5nZXMoKSwgREVMQVlTLk9CU0VSVkVSX0NIRUNLKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHNldHVwTG9jYWxTdG9yYWdlSW50ZXJjZXB0b3IgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXdpbmRvdy5fX2NhcmRmb3JtX2xvY2Fsc3RvcmFnZV9pbnRlcmNlcHRlZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsU2V0SXRlbSA9IFN0b3JhZ2UucHJvdG90eXBlLnNldEl0ZW07XG4gICAgICAgICAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgU3RvcmFnZS5wcm90b3R5cGUuc2V0SXRlbSA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IG9yaWdpbmFsU2V0SXRlbS5hcHBseSh0aGlzLCBba2V5LCB2YWx1ZV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSAndGNhcnQnICYmICFzZWxmLmlzVXBkYXRpbmdDYXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0gbG9jYWxTdG9yYWdlIHRjYXJ0INC40LfQvNC10L3QtdC9INC40LfQstC90LUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gY2hlY2tDYXJ0Q2hhbmdlcygpLCBERUxBWVMuQ0FSVF9VUERBVEUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB3aW5kb3cuX19jYXJkZm9ybV9sb2NhbHN0b3JhZ2VfaW50ZXJjZXB0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdENhcnRPYnNlcnZlcl0g4pyTIGxvY2FsU3RvcmFnZS5zZXRJdGVtINC/0LXRgNC10YXQstCw0YfQtdC9Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XG4gICAgICAgICAgICBzZXR1cExvY2FsU3RvcmFnZUludGVyY2VwdG9yKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIHNldHVwTG9jYWxTdG9yYWdlSW50ZXJjZXB0b3IpO1xuICAgICAgICB9XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaGFzaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoO1xuICAgICAgICAgICAgaWYgKGhhc2ggPT09ICcjb3BlbmNhcnQnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjYXJ0T2JzZXJ2ZXJdINCa0L7RgNC30LjQvdCwINC+0YLQutGA0YvQstCw0LXRgtGB0Y8g0YfQtdGA0LXQtyAjb3BlbmNhcnQnKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRlUXVhbnRpdHlDb250cm9sc0ZvclJ1bGVQcm9kdWN0cygpO1xuICAgICAgICAgICAgICAgIH0sIERFTEFZUy5DQVJUX1VQREFURSArIDIwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBvYnNlcnZlQ2FydFZpc2liaWxpdHkgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjYXJ0V2luZG93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnQ3MDZfX2NhcnR3aW4nKTtcbiAgICAgICAgICAgIGlmIChjYXJ0V2luZG93KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmlzaWJpbGl0eU9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKG11dGF0aW9ucykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBtdXRhdGlvbnMuZm9yRWFjaCgobXV0YXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtdXRhdGlvbi50eXBlID09PSAnYXR0cmlidXRlcycgJiYgbXV0YXRpb24uYXR0cmlidXRlTmFtZSA9PT0gJ2NsYXNzJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBtdXRhdGlvbi50YXJnZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCd0NzA2X19jYXJ0d2luX3Nob3dlZCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2FydE9ic2VydmVyXSDQmtC+0YDQt9C40L3QsCDQv9C+0LrQsNC30LDQvdCwICjQutC70LDRgdGBIHQ3MDZfX2NhcnR3aW5fc2hvd2VkKScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZVF1YW50aXR5Q29udHJvbHNGb3JSdWxlUHJvZHVjdHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHZpc2liaWxpdHlPYnNlcnZlci5vYnNlcnZlKGNhcnRXaW5kb3csIHtcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlRmlsdGVyOiBbJ2NsYXNzJ11cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRDYXJ0T2JzZXJ2ZXJdIOKckyDQndCw0LHQu9GO0LTQsNGC0LXQu9GMINCy0LjQtNC40LzQvtGB0YLQuCDQutC+0YDQt9C40L3RiyDRg9GB0YLQsNC90L7QstC70LXQvScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChvYnNlcnZlQ2FydFZpc2liaWxpdHksIDEwMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBvYnNlcnZlQ2FydFZpc2liaWxpdHkoKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtpbml0Q2FydE9ic2VydmVyXSDinJMg0J3QsNCx0LvRjtC00LDRgtC10LvQuCDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3RiycpO1xuICAgIH1cbiAgICBoYW5kbGVSdWxlUHJvZHVjdERlbGV0aW9uKHByb2R1Y3ROYW1lKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbl0g0J/RgNC+0LLQtdGA0LrQsCDRgtC+0LLQsNGA0LA6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHN0YXRlXSBvZiB0aGlzLmFjdGlvbnNTdGF0ZXMpIHtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5hY3Rpb24gJiYgc3RhdGUuYWN0aW9uLnZhbHVlID09PSBwcm9kdWN0TmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbl0g0KLQvtCy0LDRgCDQuNC3INC/0YDQsNCy0LjQu9CwINC90LDQudC00LXQvTonLCB7XG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlOiBrZXksXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogc3RhdGUuYWN0aW9uLnZhbHVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbGV0IGZvdW5kRWxlbWVudCA9IG51bGw7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsSW5wdXRzID0gdGhpcy5mb3JtLnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0LCBzZWxlY3QnKTtcbiAgICAgICAgICAgICAgICBhbGxJbnB1dHMuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICgoZWwudHlwZSA9PT0gJ3JhZGlvJyB8fCBlbC50eXBlID09PSAnY2hlY2tib3gnKSAmJiBlbC52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsLnZhbHVlLnRyaW0oKSA9PT0gc3RhdGUuYWN0aW9uLnZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kRWxlbWVudCA9IGVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbl0g0J3QsNC50LTQtdC9INGN0LvQtdC80LXQvdGCOicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogZWwudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGVsLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2VkOiBlbC5jaGVja2VkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbl0g0KHQvdC40LzQsNC10Lwg0LLRi9Cx0L7RgCDRgTonLCBmb3VuZEVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICBmb3VuZEVsZW1lbnQuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbl0g4pyTINCf0YDQsNCy0LjQu9C+INC+0YLQvNC10L3QtdC90L4sIGNoZWNrYm94INGB0L3Rj9GCJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbl0g0K3Qu9C10LzQtdC90YIg0YTQvtGA0LzRiyDQvdC1INC90LDQudC00LXQvSDQtNC70Y86Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb25WYWx1ZTogc3RhdGUuYWN0aW9uLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlSW5wdXRzOiBBcnJheS5mcm9tKGFsbElucHV0cykubWFwKGVsID0+ICh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogZWwudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZWwudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHkoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCd0LDRh9Cw0LvQviDQvtCx0L3QvtCy0LvQtdC90LjRjyDQutC+0LvQuNGH0LXRgdGC0LLQsCcpO1xuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICghdGlsZGFDYXJ0IHx8ICFBcnJheS5pc0FycmF5KHRpbGRhQ2FydC5wcm9kdWN0cykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0JrQvtGA0LfQuNC90LAg0L3QtdC00L7RgdGC0YPQv9C90LAnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDQkNC60YLQuNCy0L3Ri9GFINC/0YDQsNCy0LjQuzonLCB0aGlzLmFjdGlvbnNTdGF0ZXMuc2l6ZSk7XG4gICAgICAgIGZvciAoY29uc3QgW2tleSwgc3RhdGVdIG9mIHRoaXMuYWN0aW9uc1N0YXRlcykge1xuICAgICAgICAgICAgaWYgKHN0YXRlLmFjdGlvbiAmJiBzdGF0ZS5hY3Rpb24ucXVhbnRpdHlUeXBlID09PSAncGVyUHJvZHVjdCcpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdRdWFudGl0eSA9IHRoaXMuY2FsY3VsYXRlUnVsZVByb2R1Y3RRdWFudGl0eShzdGF0ZS5hY3Rpb24pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RJbmRleCA9IHRpbGRhQ2FydC5wcm9kdWN0cy5maW5kSW5kZXgoKHApID0+IHAubmFtZT8udHJpbSgpID09PSBzdGF0ZS5hY3Rpb24udmFsdWUudHJpbSgpKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvZHVjdEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRRdWFudGl0eSA9IHBhcnNlSW50KHRpbGRhQ2FydC5wcm9kdWN0c1twcm9kdWN0SW5kZXhdLnF1YW50aXR5KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0KLQvtCy0LDRgCBcIiR7c3RhdGUuYWN0aW9uLnZhbHVlfVwiOmAsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sZFF1YW50aXR5OiBvbGRRdWFudGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1F1YW50aXR5OiBuZXdRdWFudGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5lZWRzVXBkYXRlOiBvbGRRdWFudGl0eSAhPT0gbmV3UXVhbnRpdHlcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvbGRRdWFudGl0eSAhPT0gbmV3UXVhbnRpdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldIOKaoSDQntCx0L3QvtCy0LvRj9C10Lwg0YfQtdGA0LXQtyB0Y2FydF9fcHJvZHVjdF9fdXBkYXRlUXVhbnRpdHknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwcm9kdWN0RWxlbWVudCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IDEwOyBhdHRlbXB0KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0RWxlbWVudCA9IENhcnRVdGlscy5maW5kUHJvZHVjdEVsZW1lbnQoc3RhdGUuYWN0aW9uLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvZHVjdEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0K3Qu9C10LzQtdC90YIg0L3QsNC50LTQtdC9INC90LAg0L/QvtC/0YvRgtC60LU6JywgYXR0ZW1wdCArIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dGVtcHQgPCA5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IENhcnRVdGlscy53YWl0KERFTEFZUy5ET01fVVBEQVRFKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvZHVjdEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBxdWFudGl0eUVsZW1lbnQgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9RVUFOVElUWSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHF1YW50aXR5RWxlbWVudCAmJiB0eXBlb2Ygd2luZG93LnRjYXJ0X19wcm9kdWN0X191cGRhdGVRdWFudGl0eSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cudGNhcnRfX3Byb2R1Y3RfX3VwZGF0ZVF1YW50aXR5KHF1YW50aXR5RWxlbWVudCwgcHJvZHVjdEVsZW1lbnQsIHByb2R1Y3RJbmRleCwgbmV3UXVhbnRpdHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDinJMg0JrQvtC70LjRh9C10YHRgtCy0L4g0L7QsdC90L7QstC70LXQvdC+INGH0LXRgNC10LcgVGlsZGEgQVBJOicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHN0YXRlLmFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFF1YW50aXR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3UXVhbnRpdHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IENhcnRVdGlscy53YWl0KERFTEFZUy5ET01fVVBEQVRFKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGx1c01pbnVzQnV0dG9ucyA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoRE9NX1NFTEVDVE9SUy5QUk9EVUNUX1BMVVNNSU5VUyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwbHVzTWludXNCdXR0b25zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbHVzTWludXNCdXR0b25zLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0J3QtSDQvdCw0LnQtNC10L0gcXVhbnRpdHlFbGVtZW50INC40LvQuCDRhNGD0L3QutGG0LjRjyB1cGRhdGVRdWFudGl0eScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0J3QtSDQvdCw0LnQtNC10L0gRE9NINGN0LvQtdC80LXQvdGCINGC0L7QstCw0YDQsCDQv9C+0YHQu9C1INC+0LbQuNC00LDQvdC40Y8nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDQotC+0LLQsNGAIFwiJHtzdGF0ZS5hY3Rpb24udmFsdWV9XCIg0J3QlSDQvdCw0LnQtNC10L0g0LIg0LrQvtGA0LfQuNC90LVgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g4pyTINCe0LHQvdC+0LLQu9C10L3QuNC1INC30LDQstC10YDRiNC10L3QvicpO1xuICAgICAgICBhd2FpdCB0aGlzLmhpZGVRdWFudGl0eUNvbnRyb2xzRm9yUnVsZVByb2R1Y3RzKCk7XG4gICAgfVxuICAgIHVwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTShwcm9kdWN0TmFtZSwgbmV3UXVhbnRpdHkpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dINCe0LHQvdC+0LLQu9C10L3QuNC1OicsIHsgcHJvZHVjdE5hbWUsIG5ld1F1YW50aXR5IH0pO1xuICAgICAgICBjb25zdCB0aXRsZVNlbGVjdG9ycyA9IFtcbiAgICAgICAgICAgICcudDcwNl9fcHJvZHVjdC10aXRsZScsXG4gICAgICAgICAgICAnLnQtc3RvcmVfX3Byb2R1Y3QtbmFtZScsXG4gICAgICAgICAgICAnLnQtcHJvZHVjdF9fdGl0bGUnLFxuICAgICAgICAgICAgJy5qcy1wcm9kdWN0LW5hbWUnXG4gICAgICAgIF07XG4gICAgICAgIGxldCBwcm9kdWN0RWxlbWVudCA9IG51bGw7XG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgdGl0bGVTZWxlY3RvcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RUaXRsZXMgPSBbLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcildO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dINCf0L7QuNGB0Log0YfQtdGA0LXQtyBcIiR7c2VsZWN0b3J9XCI6YCwgcHJvZHVjdFRpdGxlcy5sZW5ndGgsICfRjdC70LXQvNC10L3RgtC+0LInKTtcbiAgICAgICAgICAgIGNvbnN0IGZvdW5kRWxlbWVudCA9IHByb2R1Y3RUaXRsZXMuZmluZChlbCA9PiBlbC5pbm5lclRleHQudHJpbSgpID09PSBwcm9kdWN0TmFtZS50cmltKCkpO1xuICAgICAgICAgICAgaWYgKGZvdW5kRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHByb2R1Y3RFbGVtZW50ID0gZm91bmRFbGVtZW50LmNsb3Nlc3QoJy50NzA2X19jYXJ0d2luLXByb2R1Y3QsIC50LXN0b3JlX19wcm9kdWN0LCAudC1wcm9kdWN0Jyk7XG4gICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDinJMg0KLQvtCy0LDRgCDQvdCw0LnQtNC10L0g0YfQtdGA0LXQtzonLCBzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDinJcg0K3Qu9C10LzQtdC90YIg0YLQvtCy0LDRgNCwINCd0JUg0L3QsNC50LTQtdC9INCyIERPTTonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g0JLRgdC1INGC0L7QstCw0YDRiyDQsiBET006JywgWy4uLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50NzA2X19wcm9kdWN0LXRpdGxlLCAudC1zdG9yZV9fcHJvZHVjdC1uYW1lJyldLm1hcCgoZWwpID0+IGVsLmlubmVyVGV4dCkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1YW50aXR5SW5wdXRTZWxlY3RvcnMgPSBbXG4gICAgICAgICAgICAnLnQ3MDZfX3Byb2R1Y3QtcXVhbnRpdHknLFxuICAgICAgICAgICAgJy50LXN0b3JlX19xdWFudGl0eS1pbnB1dCcsXG4gICAgICAgICAgICAnaW5wdXRbbmFtZT1cInF1YW50aXR5XCJdJyxcbiAgICAgICAgICAgICcuanMtcHJvZHVjdC1xdWFudGl0eSdcbiAgICAgICAgXTtcbiAgICAgICAgbGV0IHF1YW50aXR5SW5wdXQgPSBudWxsO1xuICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHF1YW50aXR5SW5wdXRTZWxlY3RvcnMpIHtcbiAgICAgICAgICAgIHF1YW50aXR5SW5wdXQgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIGlmIChxdWFudGl0eUlucHV0KSB7XG4gICAgICAgICAgICAgICAgcXVhbnRpdHlJbnB1dC52YWx1ZSA9IG5ld1F1YW50aXR5LnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgcXVhbnRpdHlJbnB1dC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnY2hhbmdlJywgeyBidWJibGVzOiB0cnVlIH0pKTtcbiAgICAgICAgICAgICAgICBxdWFudGl0eUlucHV0LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdpbnB1dCcsIHsgYnViYmxlczogdHJ1ZSB9KSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dIOKckyDQntCx0L3QvtCy0LvQtdC9IGlucHV0INGH0LXRgNC10Lc6Jywgc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1YW50aXR5RGlzcGxheVNlbGVjdG9ycyA9IFtcbiAgICAgICAgICAgICcudC1xdWFudGl0eV9fdmFsdWUnLFxuICAgICAgICAgICAgJy50NzA2X19wcm9kdWN0LXF1YW50aXR5LXZhbHVlJyxcbiAgICAgICAgICAgICcudC1zdG9yZV9fcXVhbnRpdHktdmFsdWUnXG4gICAgICAgIF07XG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgcXVhbnRpdHlEaXNwbGF5U2VsZWN0b3JzKSB7XG4gICAgICAgICAgICBjb25zdCBxdWFudGl0eURpc3BsYXkgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIGlmIChxdWFudGl0eURpc3BsYXkpIHtcbiAgICAgICAgICAgICAgICBxdWFudGl0eURpc3BsYXkudGV4dENvbnRlbnQgPSBuZXdRdWFudGl0eS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDinJMg0J7QsdC90L7QstC70LXQvSBkaXNwbGF5INGH0LXRgNC10Lc6Jywgc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgaWYgKHRpbGRhQ2FydCkge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRpbGRhQ2FydC5wcm9kdWN0cy5maW5kKChwKSA9PiBwLm5hbWU/LnRyaW0oKSA9PT0gcHJvZHVjdE5hbWUudHJpbSgpKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWxQcmljZSA9IHBhcnNlRmxvYXQocHJvZHVjdC5wcmljZSkgKiBuZXdRdWFudGl0eTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcmljZVNlbGVjdG9ycyA9IFtcbiAgICAgICAgICAgICAgICAgICAgJy50NzA2X19wcm9kdWN0LXByaWNlJyxcbiAgICAgICAgICAgICAgICAgICAgJy50LXN0b3JlX19wcm9kdWN0LXByaWNlJyxcbiAgICAgICAgICAgICAgICAgICAgJy50LXByb2R1Y3RfX3ByaWNlJyxcbiAgICAgICAgICAgICAgICAgICAgJy5qcy1wcm9kdWN0LXByaWNlJ1xuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBwcmljZVNlbGVjdG9ycykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcmljZUVsZW1lbnQgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByaWNlRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpY2VFbGVtZW50LnRleHRDb250ZW50ID0gYCR7dG90YWxQcmljZS50b0xvY2FsZVN0cmluZygncnUtUlUnKX0gJHt0aWxkYUNhcnQuY3VycmVuY3lfdHh0X3IgfHwgJyDRgC4nfWA7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g4pyTINCe0LHQvdC+0LLQu9C10L3QsCDRgdGC0L7QuNC80L7RgdGC0Ywg0YfQtdGA0LXQtzonLCBzZWxlY3RvciwgdG90YWxQcmljZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g4pyTINCe0LHQvdC+0LLQu9C10L3QuNC1INC30LDQstC10YDRiNC10L3QviDQtNC70Y86JywgcHJvZHVjdE5hbWUpO1xuICAgIH1cbiAgICB1cGRhdGVBbGxDYXJ0SXRlbXNJbkRPTSgpIHtcbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAoIXRpbGRhQ2FydCB8fCAhQXJyYXkuaXNBcnJheSh0aWxkYUNhcnQucHJvZHVjdHMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlQWxsQ2FydEl0ZW1zSW5ET01dINCa0L7RgNC30LjQvdCwINC90LXQtNC+0YHRgtGD0L/QvdCwJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVBbGxDYXJ0SXRlbXNJbkRPTV0g0J7QsdC90L7QstC70Y/QtdC8INCy0YHQtSDRgtC+0LLQsNGA0Ysg0LIgRE9NJyk7XG4gICAgICAgIHRpbGRhQ2FydC5wcm9kdWN0cy5mb3JFYWNoKChwcm9kdWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0TmFtZSA9IHByb2R1Y3QubmFtZT8udHJpbSgpO1xuICAgICAgICAgICAgY29uc3QgcXVhbnRpdHkgPSBwYXJzZUludChwcm9kdWN0LnF1YW50aXR5IHx8IDEpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3ROYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET00ocHJvZHVjdE5hbWUsIHF1YW50aXR5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQWxsQ2FydEl0ZW1zSW5ET01dIOKckyDQktGB0LUg0YLQvtCy0LDRgNGLINC+0LHQvdC+0LLQu9C10L3RiycpO1xuICAgIH1cbiAgICByZWZyZXNoQ2FydFVJKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3JlZnJlc2hDYXJ0VUldINCd0LDRh9Cw0LvQviDQvtCx0L3QvtCy0LvQtdC90LjRjyBVSSDQutC+0YDQt9C40L3RiycpO1xuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy50X3N0b3JlX19yZWZyZXNoY2FydCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgd2luZG93LnRfc3RvcmVfX3JlZnJlc2hjYXJ0KCk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3JlZnJlc2hDYXJ0VUldIOKckyDQktGL0LfQstCw0L0gdF9zdG9yZV9fcmVmcmVzaGNhcnQnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZWZyZXNoRnVuY3Rpb25zID0gW1xuICAgICAgICAgICAgJ3Q3MDZfX3VwZGF0ZUNhcnQnLFxuICAgICAgICAgICAgJ3RjYXJ0X191cGRhdGVDYXJ0JyxcbiAgICAgICAgICAgICd0X3N0b3JlX191cGRhdGVDYXJ0JyxcbiAgICAgICAgICAgICd0NzA2X2luaXQnXG4gICAgICAgIF07XG4gICAgICAgIHJlZnJlc2hGdW5jdGlvbnMuZm9yRWFjaChmdW5jTmFtZSA9PiB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvd1tmdW5jTmFtZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3dbZnVuY05hbWVdKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbcmVmcmVzaENhcnRVSV0g4pyTINCS0YvQt9Cy0LDQvSAke2Z1bmNOYW1lfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtmb3JtXSBbcmVmcmVzaENhcnRVSV0g0J7RiNC40LHQutCwICR7ZnVuY05hbWV9OmAsIGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMudXBkYXRlQWxsQ2FydEl0ZW1zSW5ET00oKTtcbiAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdjYXJ0LXVwZGF0ZWQnKSk7XG4gICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCd0Y2FydC11cGRhdGVkJykpO1xuICAgICAgICB0aGlzLnVwZGF0ZUNhcnRDb3VudGVycygpO1xuICAgIH1cbiAgICB1cGRhdGVDYXJ0Q291bnRlcnMoKSB7XG4gICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgaWYgKCF0aWxkYUNhcnQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGNhcnRDb3VudGVycyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoRE9NX1NFTEVDVE9SUy5DQVJUX0NPVU5URVIpO1xuICAgICAgICBjYXJ0Q291bnRlcnMuZm9yRWFjaChjb3VudGVyID0+IHtcbiAgICAgICAgICAgIGlmIChjb3VudGVyKSB7XG4gICAgICAgICAgICAgICAgY291bnRlci50ZXh0Q29udGVudCA9IHRpbGRhQ2FydC50b3RhbC50b1N0cmluZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgY2FydEFtb3VudHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKERPTV9TRUxFQ1RPUlMuQ0FSVF9BTU9VTlQpO1xuICAgICAgICBjYXJ0QW1vdW50cy5mb3JFYWNoKGFtb3VudCA9PiB7XG4gICAgICAgICAgICBpZiAoYW1vdW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybWF0dGVkQW1vdW50ID0gdGlsZGFDYXJ0LmFtb3VudC50b0xvY2FsZVN0cmluZygncnUtUlUnKTtcbiAgICAgICAgICAgICAgICBhbW91bnQudGV4dENvbnRlbnQgPSBgJHtmb3JtYXR0ZWRBbW91bnR9ICR7dGlsZGFDYXJ0LmN1cnJlbmN5X3R4dF9yIHx8ICcg0YAuJ31gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0Q291bnRlcnNdIOKckyDQodGH0LXRgtGH0LjQutC4INC+0LHQvdC+0LLQu9C10L3RiycpO1xuICAgIH1cbiAgICBnZXRNYWluUHJvZHVjdHNRdWFudGl0eSgpIHtcbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAoIXRpbGRhQ2FydCB8fCAhQXJyYXkuaXNBcnJheSh0aWxkYUNhcnQucHJvZHVjdHMpKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBydWxlUHJvZHVjdE5hbWVzID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLnJ1bGVzLmZvckVhY2gocnVsZSA9PiB7XG4gICAgICAgICAgICBydWxlLmFjdGlvbnMuZm9yRWFjaChhY3Rpb24gPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVsZVByb2R1Y3ROYW1lcy5hZGQoYWN0aW9uLnZhbHVlLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgdG90YWxRdWFudGl0eSA9IDA7XG4gICAgICAgIGNvbnN0IG1haW5Qcm9kdWN0cyA9IFtdO1xuICAgICAgICB0aWxkYUNhcnQucHJvZHVjdHMuZm9yRWFjaCgocHJvZHVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdE5hbWUgPSBwcm9kdWN0Lm5hbWU/LnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IGlzUnVsZVByb2R1Y3QgPSBydWxlUHJvZHVjdE5hbWVzLmhhcyhwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICBjb25zdCBxdHkgPSBwYXJzZUludChwcm9kdWN0LnF1YW50aXR5IHx8IDEpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3ROYW1lICYmICFpc1J1bGVQcm9kdWN0KSB7XG4gICAgICAgICAgICAgICAgdG90YWxRdWFudGl0eSArPSBxdHk7XG4gICAgICAgICAgICAgICAgbWFpblByb2R1Y3RzLnB1c2goYCR7cHJvZHVjdE5hbWV9ICgke3F0eX0g0YjRgilgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbZ2V0TWFpblByb2R1Y3RzUXVhbnRpdHldJywge1xuICAgICAgICAgICAgJ9Ce0YHQvdC+0LLQvdGL0YUg0YLQvtCy0LDRgNC+0LInOiB0b3RhbFF1YW50aXR5LFxuICAgICAgICAgICAgJ9Ch0L/QuNGB0L7Quic6IG1haW5Qcm9kdWN0cyxcbiAgICAgICAgICAgICfQotC+0LLQsNGA0Ysg0L/RgNCw0LLQuNC7JzogQXJyYXkuZnJvbShydWxlUHJvZHVjdE5hbWVzKVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRvdGFsUXVhbnRpdHk7XG4gICAgfVxuICAgIGNhbGN1bGF0ZVJ1bGVQcm9kdWN0UXVhbnRpdHkoYWN0aW9uKSB7XG4gICAgICAgIGlmIChhY3Rpb24ucXVhbnRpdHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGFjdGlvbi5xdWFudGl0eTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYWN0aW9uLnF1YW50aXR5VHlwZSA9PT0gJ3BlclByb2R1Y3QnKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5tYXgoMSwgdGhpcy5nZXRNYWluUHJvZHVjdHNRdWFudGl0eSgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgYXN5bmMgcmVtb3ZlUHJvZHVjdEZyb21DYXJ0KHByb2R1Y3ROYW1lKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbcmVtb3ZlUHJvZHVjdF0g0J/QvtC/0YvRgtC60LAg0YPQtNCw0LvQuNGC0Yw6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICBjb25zdCBwcm9kdWN0RWxlbWVudCA9IENhcnRVdGlscy5maW5kUHJvZHVjdEVsZW1lbnQocHJvZHVjdE5hbWUpO1xuICAgICAgICBpZiAocHJvZHVjdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlbFByb2R1Y3RCdXR0b24gPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9ERUxfQlVUVE9OKTtcbiAgICAgICAgICAgIGlmIChkZWxQcm9kdWN0QnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgZGVsUHJvZHVjdEJ1dHRvbi5jbGljaygpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbcmVtb3ZlUHJvZHVjdF0g4pyTINCj0LTQsNC70LXQvdC+INGH0LXRgNC10LcgRE9NICjQutC70LjQuik6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgIGF3YWl0IENhcnRVdGlscy53YWl0KERFTEFZUy5DQVJUX1VQREFURSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAodGlsZGFDYXJ0ICYmIEFycmF5LmlzQXJyYXkodGlsZGFDYXJ0LnByb2R1Y3RzKSkge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdEluZGV4ID0gdGlsZGFDYXJ0LnByb2R1Y3RzLmZpbmRJbmRleCgocCkgPT4gcC5uYW1lPy50cmltKCkgPT09IHByb2R1Y3ROYW1lLnRyaW0oKSk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aWxkYUNhcnQucHJvZHVjdHNbcHJvZHVjdEluZGV4XTtcbiAgICAgICAgICAgICAgICBjb25zdCByZW1vdmVGdW5jdGlvbnMgPSBbXG4gICAgICAgICAgICAgICAgICAgICd0Y2FydF9fcmVtb3ZlUHJvZHVjdCcsXG4gICAgICAgICAgICAgICAgICAgICd0Y2FydF9yZW1vdmVQcm9kdWN0JyxcbiAgICAgICAgICAgICAgICAgICAgJ3Rfc3RvcmVfX3JlbW92ZVByb2R1Y3QnXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZ1bmNOYW1lIG9mIHJlbW92ZUZ1bmN0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvd1tmdW5jTmFtZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93W2Z1bmNOYW1lXShwcm9kdWN0LnVpZCB8fCBwcm9kdWN0LmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW3JlbW92ZVByb2R1Y3RdIOKckyDQo9C00LDQu9C10L3QviDRh9C10YDQtdC3ICR7ZnVuY05hbWV9OmAsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuQ0FSVF9VUERBVEUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtmb3JtXSBbcmVtb3ZlUHJvZHVjdF0g0J7RiNC40LHQutCwICR7ZnVuY05hbWV9OmAsIGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRpbGRhQ2FydC5wcm9kdWN0cy5zcGxpY2UocHJvZHVjdEluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICB0aWxkYUNhcnQuYW1vdW50ID0gdGlsZGFDYXJ0LnByb2R1Y3RzLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyAocGFyc2VGbG9hdChwLnByaWNlKSAqIHBhcnNlSW50KHAucXVhbnRpdHkgfHwgMSkpLCAwKTtcbiAgICAgICAgICAgICAgICB0aWxkYUNhcnQucHJvZGFtb3VudCA9IHRpbGRhQ2FydC5wcm9kdWN0cy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdGlsZGFDYXJ0LnRvdGFsID0gdGlsZGFDYXJ0LnByb2R1Y3RzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB0aWxkYUNhcnQudXBkYXRlZCA9IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNhdmVUaWxkYUNhcnQodGlsZGFDYXJ0KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy50X3N0b3JlX19yZWZyZXNoY2FydCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnRfc3RvcmVfX3JlZnJlc2hjYXJ0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtyZW1vdmVQcm9kdWN0XSDinJMg0KPQtNCw0LvQtdC90L4g0L3QsNC/0YDRj9C80YPRjiDQuNC3INC80LDRgdGB0LjQstCwOicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgQ2FydFV0aWxzLndhaXQoREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFtyZW1vdmVQcm9kdWN0XSDinJcg0J3QtSDRg9C00LDQu9C+0YHRjCDRg9C00LDQu9C40YLRjCDRgtC+0LLQsNGAOicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhc3luYyBhcHBseUFjdGlvbnMob2xkU3RhdGUgPSBuZXcgTWFwKCkpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNBcHBseWluZ0FjdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQo9C20LUg0LLRi9C/0L7Qu9C90Y/QtdGC0YHRjywg0L/RgNC+0L/Rg9GB0LrQsNC10LwnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlzQXBwbHlpbmdBY3Rpb25zID0gdHJ1ZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQndCw0YfQsNC70L4g0L/RgNC40LzQtdC90LXQvdC40Y8g0LTQtdC50YHRgtCy0LjQuScpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdINCh0YLQsNGA0L7QtSDRgdC+0YHRgtC+0Y/QvdC40LU6JywgT2JqZWN0LmZyb21FbnRyaWVzKG9sZFN0YXRlKSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0J3QvtCy0L7QtSDRgdC+0YHRgtC+0Y/QvdC40LU6JywgT2JqZWN0LmZyb21FbnRyaWVzKHRoaXMuYWN0aW9uc1N0YXRlcykpO1xuICAgICAgICAgICAgY29uc3QgY2FydExvYWRlZCA9IGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICAgICAgICAgICAgbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFsuLi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAudDcwNl9fcHJvZHVjdC10aXRsZWApXS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZShmYWxzZSksIDMwMDApKVxuICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICBpZiAoIWNhcnRMb2FkZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQmtC+0YDQt9C40L3QsCDQvdC1INC30LDQs9GA0YPQt9C40LvQsNGB0Ywg0LfQsCAzINGB0LXQutGD0L3QtNGLLCDQv9GA0L7QtNC+0LvQttCw0LXQvCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBba2V5LCBzdGF0ZV0gb2YgdGhpcy5hY3Rpb25zU3RhdGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkVmFsdWUgPSBvbGRTdGF0ZS5nZXQoa2V5KT8udmFsdWU7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkQWN0aW9uID0gb2xkU3RhdGUuZ2V0KGtleSk/LmFjdGlvbjtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW2FwcGx5QWN0aW9uc10g0J7QsdGA0LDQsdC+0YLQutCwINC/0L7Qu9GPIFwiJHtrZXl9XCI6YCwge1xuICAgICAgICAgICAgICAgICAgICBvbGRWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWU6IHN0YXRlLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBvbGRBY3Rpb246IG9sZEFjdGlvbj8udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIG5ld0FjdGlvbjogc3RhdGUuYWN0aW9uPy52YWx1ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS52YWx1ZSAhPT0gb2xkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZEFjdGlvbiAmJiBvbGRBY3Rpb24udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQo9C00LDQu9GP0LXQvCDRgdGC0LDRgNGL0Lkg0YLQvtCy0LDRgDonLCBvbGRBY3Rpb24udmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5yZW1vdmVQcm9kdWN0RnJvbUNhcnQob2xkQWN0aW9uLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdGUudmFsdWUgJiYgc3RhdGUuYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0SWQgPSBgcnVsZV8ke2tleX1fJHtEYXRlLm5vdygpfWA7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0UXVhbnRpdHkgPSB0aGlzLmNhbGN1bGF0ZVJ1bGVQcm9kdWN0UXVhbnRpdHkoc3RhdGUuYWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQlNC+0LHQsNCy0LvRj9C10Lwg0L3QvtCy0YvQuSDRgtC+0LLQsNGAOicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogcHJvZHVjdElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHN0YXRlLmFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmljZTogc3RhdGUuYWN0aW9uLnN1bSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXR5OiBwcm9kdWN0UXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbnRpdHlUeXBlOiBzdGF0ZS5hY3Rpb24ucXVhbnRpdHlUeXBlIHx8ICdmaXhlZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnRjYXJ0X19hZGRQcm9kdWN0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogcHJvZHVjdElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHN0YXRlLmFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmljZTogc3RhdGUuYWN0aW9uLnN1bSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXR5OiBwcm9kdWN0UXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoYW5nZVByb2R1Y3QgPSBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hhbmdlUHJvZHVjdCA9IFsuLi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAudDcwNl9fcHJvZHVjdC10aXRsZWApXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQoKGUpID0+IGUuaW5uZXJUZXh0LnRyaW0oKSA9PT0gc3RhdGUuYWN0aW9uLnZhbHVlLnRyaW0oKSk/LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoY2hhbmdlUHJvZHVjdCB8fCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VQcm9kdWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hhbmdlUHJvZHVjdEJ1dHRvbiA9IGNoYW5nZVByb2R1Y3QucXVlcnlTZWxlY3RvcihgLnQ3MDZfX3Byb2R1Y3QtcGx1c21pbnVzYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoYW5nZVByb2R1Y3RCdXR0b24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlUHJvZHVjdEJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g4pyTINCh0LrRgNGL0YLRiyDQutC90L7Qv9C60Lgg0LrQvtC70LjRh9C10YHRgtCy0LAnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIXN0YXRlLnZhbHVlIHx8ICFzdGF0ZS5hY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQl9C90LDRh9C10L3QuNC1INGB0LHRgNC+0YjQtdC90L4sINGC0L7QstCw0YAg0YPQtNCw0LvQtdC9Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g4pyTINCf0YDQuNC80LXQvdC10L3QuNC1INC00LXQudGB0YLQstC40Lkg0LfQsNCy0LXRgNGI0LXQvdC+Jyk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmhpZGVRdWFudGl0eUNvbnRyb2xzRm9yUnVsZVByb2R1Y3RzKCk7XG4gICAgICAgIH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLmlzQXBwbHlpbmdBY3Rpb25zID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0QWxsUnVsZVByb2R1Y3ROYW1lcygpIHtcbiAgICAgICAgY29uc3QgcnVsZVByb2R1Y3ROYW1lcyA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5ydWxlcy5mb3JFYWNoKHJ1bGUgPT4ge1xuICAgICAgICAgICAgcnVsZS5hY3Rpb25zLmZvckVhY2goYWN0aW9uID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bGVQcm9kdWN0TmFtZXMuYWRkKGFjdGlvbi52YWx1ZS50cmltKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtoaWRlUXVhbnRpdHldINCS0YHQtSDRgtC+0LLQsNGA0Ysg0LjQtyDQv9GA0LDQstC40Ls6JywgQXJyYXkuZnJvbShydWxlUHJvZHVjdE5hbWVzKSk7XG4gICAgICAgIHJldHVybiBydWxlUHJvZHVjdE5hbWVzO1xuICAgIH1cbiAgICBhc3luYyBoaWRlUXVhbnRpdHlDb250cm9sc0ZvclJ1bGVQcm9kdWN0cygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtoaWRlUXVhbnRpdHldINCd0LDRh9Cw0LvQviDRgdC60YDRi9GC0LjRjyDRgdGH0LXRgtGH0LjQutC+0LIg0LTQu9GPINGC0L7QstCw0YDQvtCyINC40Lcg0L/RgNCw0LLQuNC7Jyk7XG4gICAgICAgIGNvbnN0IHJ1bGVQcm9kdWN0TmFtZXMgPSB0aGlzLmdldEFsbFJ1bGVQcm9kdWN0TmFtZXMoKTtcbiAgICAgICAgaWYgKHJ1bGVQcm9kdWN0TmFtZXMuc2l6ZSA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtoaWRlUXVhbnRpdHldINCd0LXRgiDRgtC+0LLQsNGA0L7QsiDQuNC3INC/0YDQsNCy0LjQuycpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IENhcnRVdGlscy53YWl0KERFTEFZUy5ET01fVVBEQVRFKTtcbiAgICAgICAgY29uc3QgcHJvZHVjdEVsZW1lbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChET01fU0VMRUNUT1JTLkNBUlRfUFJPRFVDVCk7XG4gICAgICAgIGxldCBoaWRkZW5Db3VudCA9IDA7XG4gICAgICAgIHByb2R1Y3RFbGVtZW50cy5mb3JFYWNoKChwcm9kdWN0RWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGl0bGVFbGVtZW50ID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLlBST0RVQ1RfVElUTEUpO1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdE5hbWUgPSB0aXRsZUVsZW1lbnQ/LnRleHRDb250ZW50Py50cmltKCk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdE5hbWUgJiYgcnVsZVByb2R1Y3ROYW1lcy5oYXMocHJvZHVjdE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGx1c01pbnVzQmxvY2sgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9QTFVTTUlOVVMpO1xuICAgICAgICAgICAgICAgIGlmIChwbHVzTWludXNCbG9jayAmJiBwbHVzTWludXNCbG9jay5zdHlsZS5kaXNwbGF5ICE9PSAnbm9uZScpIHtcbiAgICAgICAgICAgICAgICAgICAgcGx1c01pbnVzQmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgaGlkZGVuQ291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtoaWRlUXVhbnRpdHldIOKckyDQodC60YDRi9GC0Ysg0LrQvdC+0L/QutC4INC00LvRjyDRgtC+0LLQsNGA0LA6IFwiJHtwcm9kdWN0TmFtZX1cImApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbaGlkZVF1YW50aXR5XSDinJMg0KHQutGA0YvRgtC+INGB0YfQtdGC0YfQuNC60L7QsjogJHtoaWRkZW5Db3VudH1gKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBFZGl0b3JTdG9yYWdlTWFuYWdlciB9IGZyb20gJy4uL21hbmFnZXJzL0VkaXRvclN0b3JhZ2VNYW5hZ2VyJztcbmltcG9ydCB7IExheW91dCB9IGZyb20gJy4uL21vZGVscy9MYXlvdXQnO1xuaW1wb3J0IHsgZ2V0TGFzdENoaWxkIH0gZnJvbSAnLi4vdXRpbHMvdGlsZGFVdGlscyc7XG5pbXBvcnQgeyBUeXBlZEV2ZW50RW1pdHRlciB9IGZyb20gJy4uL3V0aWxzL1R5cGVkRXZlbnRFbWl0dGVyJztcbmltcG9ydCB7IGdlbmVyYXRlSW1hZ2UsIGNyZWF0ZVByb2R1Y3QgfSBmcm9tICcuLi91dGlscy9hcGknO1xuaW1wb3J0IHsgcmVuZGVyTGF5b3V0LCBjYWxjdWxhdGVMYXlvdXREaW1lbnNpb25zIH0gZnJvbSAnLi4vdXRpbHMvY2FudmFzVXRpbHMnO1xuY29uc3QgQ09OU1RBTlRTID0ge1xuICAgIFNUQVRFX0VYUElSQVRJT05fREFZUzogMzAsXG4gICAgQ0FOVkFTX0FSRUFfSEVJR0hUOiA2MDAsXG4gICAgTE9BRElOR19JTlRFUlZBTF9NUzogMTAwLFxufTtcbmV4cG9ydCB2YXIgRWRpdG9yRXZlbnRUeXBlO1xuKGZ1bmN0aW9uIChFZGl0b3JFdmVudFR5cGUpIHtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJNT0NLVVBfTE9BRElOR1wiXSA9IFwibW9ja3VwLWxvYWRpbmdcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJNT0NLVVBfVVBEQVRFRFwiXSA9IFwibW9ja3VwLXVwZGF0ZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJMT0FESU5HX1RJTUVfVVBEQVRFRFwiXSA9IFwibG9hZGluZy10aW1lLXVwZGF0ZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJTVEFURV9DSEFOR0VEXCJdID0gXCJzdGF0ZS1jaGFuZ2VkXCI7XG4gICAgRWRpdG9yRXZlbnRUeXBlW1wiTEFZT1VUX0FEREVEXCJdID0gXCJsYXlvdXQtYWRkZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJMQVlPVVRfUkVNT1ZFRFwiXSA9IFwibGF5b3V0LXJlbW92ZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJMQVlPVVRfVVBEQVRFRFwiXSA9IFwibGF5b3V0LXVwZGF0ZWRcIjtcbn0pKEVkaXRvckV2ZW50VHlwZSB8fCAoRWRpdG9yRXZlbnRUeXBlID0ge30pKTtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEVkaXRvciB7XG4gICAgZ2V0IHNlbGVjdFR5cGUoKSB7IHJldHVybiB0aGlzLl9zZWxlY3RUeXBlOyB9XG4gICAgZ2V0IHNlbGVjdENvbG9yKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0Q29sb3I7IH1cbiAgICBnZXQgc2VsZWN0U2lkZSgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdFNpZGU7IH1cbiAgICBnZXQgc2VsZWN0U2l6ZSgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdFNpemU7IH1cbiAgICBnZXQgc2VsZWN0TGF5b3V0KCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0TGF5b3V0OyB9XG4gICAgY29uc3RydWN0b3IoeyBibG9ja3MsIHByb2R1Y3RDb25maWdzLCBmb3JtQ29uZmlnLCBhcGlDb25maWcsIG9wdGlvbnMgfSkge1xuICAgICAgICB0aGlzLnF1YW50aXR5Rm9ybUJsb2NrID0gbnVsbDtcbiAgICAgICAgdGhpcy5mb3JtQmxvY2sgPSBudWxsO1xuICAgICAgICB0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSA9IG51bGw7XG4gICAgICAgIHRoaXMuZm9ybUJ1dHRvbiA9IG51bGw7XG4gICAgICAgIHRoaXMuX3NlbGVjdExheW91dCA9IG51bGw7XG4gICAgICAgIHRoaXMubGF5b3V0cyA9IFtdO1xuICAgICAgICB0aGlzLmNhbnZhc2VzID0gW107XG4gICAgICAgIHRoaXMubGF5ZXJzQ2FudmFzZXMgPSBbXTtcbiAgICAgICAgdGhpcy5hY3RpdmVDYW52YXMgPSBudWxsO1xuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBUeXBlZEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmxheWVyc0hpc3RvcnkgPSBbXTtcbiAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID0gLTE7XG4gICAgICAgIHRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzTG9hZGluZyA9IHRydWU7XG4gICAgICAgIHRoaXMuaXNBZGRpbmdUb0NhcnQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc0FkZGVkVG9DYXJ0ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNHZW5lcmF0aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMubG9hZGluZ1RpbWUgPSAwO1xuICAgICAgICB0aGlzLmxvYWRpbmdJbnRlcnZhbCA9IG51bGw7XG4gICAgICAgIHRoaXMuY29sb3JCbG9ja3MgPSBbXTtcbiAgICAgICAgdGhpcy5zaXplQmxvY2tzID0gW107XG4gICAgICAgIHRoaXMucHJvZHVjdEJsb2NrcyA9IFtdO1xuICAgICAgICB0aGlzLmxvYWRlZFVzZXJJbWFnZSA9IG51bGw7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbWFnZUNhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmxvYWRpbmdFbGVtZW50c0NhY2hlID0ge307XG4gICAgICAgIHRoaXMucHJvZHVjdENhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLm1vY2t1cENhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICBpZiAoIXByb2R1Y3RDb25maWdzIHx8IHByb2R1Y3RDb25maWdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbRWRpdG9yXSDQndC1INC/0YDQtdC00L7RgdGC0LDQstC70LXQvdGLINC60L7QvdGE0LjQs9GD0YDQsNGG0LjQuCDQv9GA0L7QtNGD0LrRgtC+0LInKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0b3JhZ2VNYW5hZ2VyID0gbmV3IEVkaXRvclN0b3JhZ2VNYW5hZ2VyKCk7XG4gICAgICAgIHRoaXMucHJvZHVjdENvbmZpZ3MgPSBwcm9kdWN0Q29uZmlncztcbiAgICAgICAgdGhpcy5hcGlDb25maWcgPSBhcGlDb25maWc7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuZWRpdG9yQmxvY2sgPSB0aGlzLmdldFJlcXVpcmVkRWxlbWVudChibG9ja3MuZWRpdG9yQmxvY2tDbGFzcyk7XG4gICAgICAgIHRoaXMuY2hhbmdlU2lkZUJ1dHRvbiA9IHRoaXMuZ2V0UmVxdWlyZWRFbGVtZW50KGJsb2Nrcy5jaGFuZ2VTaWRlQnV0dG9uQ2xhc3MpO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2sgPSB0aGlzLmdldFJlcXVpcmVkRWxlbWVudChibG9ja3MuZWRpdG9ySGlzdG9yeVVuZG9CbG9ja0NsYXNzKTtcbiAgICAgICAgdGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrID0gdGhpcy5nZXRSZXF1aXJlZEVsZW1lbnQoYmxvY2tzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2tDbGFzcyk7XG4gICAgICAgIHRoaXMucXVhbnRpdHlGb3JtQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JRdWFudGl0eUZvcm1CbG9ja0NsYXNzKTtcbiAgICAgICAgY29uc3QgcHJvZHVjdExpc3RCbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLnByb2R1Y3RMaXN0QmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChwcm9kdWN0TGlzdEJsb2NrKVxuICAgICAgICAgICAgdGhpcy5wcm9kdWN0TGlzdEJsb2NrID0gcHJvZHVjdExpc3RCbG9jaztcbiAgICAgICAgY29uc3QgcHJvZHVjdEl0ZW1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLnByb2R1Y3RJdGVtQ2xhc3MpO1xuICAgICAgICBpZiAocHJvZHVjdEl0ZW1CbG9jaylcbiAgICAgICAgICAgIHRoaXMucHJvZHVjdEl0ZW1CbG9jayA9IHByb2R1Y3RJdGVtQmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvckNvbG9yc0xpc3RCbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvckNvbG9yc0xpc3RCbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvckNvbG9yc0xpc3RCbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yQ29sb3JzTGlzdEJsb2NrID0gZWRpdG9yQ29sb3JzTGlzdEJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JDb2xvckl0ZW1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvckNvbG9ySXRlbUJsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yQ29sb3JJdGVtQmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvckNvbG9ySXRlbUJsb2NrID0gZWRpdG9yQ29sb3JJdGVtQmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvclNpemVzTGlzdEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yU2l6ZXNMaXN0QmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JTaXplc0xpc3RCbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yU2l6ZXNMaXN0QmxvY2sgPSBlZGl0b3JTaXplc0xpc3RCbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yU2l6ZUl0ZW1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclNpemVJdGVtQmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JTaXplSXRlbUJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JTaXplSXRlbUJsb2NrID0gZWRpdG9yU2l6ZUl0ZW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yTGF5b3V0c0xpc3RCbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvckxheW91dHNMaXN0QmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JMYXlvdXRzTGlzdEJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRzTGlzdEJsb2NrID0gZWRpdG9yTGF5b3V0c0xpc3RCbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yTGF5b3V0SXRlbUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yTGF5b3V0SXRlbUJsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yTGF5b3V0SXRlbUJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2sgPSBlZGl0b3JMYXlvdXRJdGVtQmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvclVwbG9hZEltYWdlQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b25DbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b24gPSBlZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbjtcbiAgICAgICAgY29uc3QgZWRpdG9yVXBsb2FkVmlld0Jsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yVXBsb2FkVmlld0Jsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yVXBsb2FkVmlld0Jsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2sgPSBlZGl0b3JVcGxvYWRWaWV3QmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbkNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uID0gZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uO1xuICAgICAgICBjb25zdCBlZGl0b3JMb2FkV2l0aEFpQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbkNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvckxvYWRXaXRoQWlCdXR0b24pXG4gICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24gPSBlZGl0b3JMb2FkV2l0aEFpQnV0dG9uO1xuICAgICAgICBjb25zdCBlZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbkNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24pXG4gICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24gPSBlZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uO1xuICAgICAgICBjb25zdCBlZGl0b3JSZW1vdmVCYWNrZ3JvdW5kQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yUmVtb3ZlQmFja2dyb3VuZEJ1dHRvbkNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b24pXG4gICAgICAgICAgICB0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b24gPSBlZGl0b3JSZW1vdmVCYWNrZ3JvdW5kQnV0dG9uO1xuICAgICAgICBjb25zdCBlZGl0b3JBZGRPcmRlckJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvckFkZE9yZGVyQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yQWRkT3JkZXJCdXR0b24pXG4gICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uID0gZWRpdG9yQWRkT3JkZXJCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvclN1bUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yU3VtQmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JTdW1CbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yU3VtQmxvY2sgPSBlZGl0b3JTdW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yUHJvZHVjdE5hbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JQcm9kdWN0TmFtZUNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclByb2R1Y3ROYW1lKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JQcm9kdWN0TmFtZSA9IGVkaXRvclByb2R1Y3ROYW1lO1xuICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja1ZpZXdDbGFzcyA9IGJsb2Nrcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tWaWV3Q2xhc3M7XG4gICAgICAgIHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrTmFtZUNsYXNzID0gYmxvY2tzLmVkaXRvckxheW91dEl0ZW1CbG9ja05hbWVDbGFzcztcbiAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tSZW1vdmVDbGFzcyA9IGJsb2Nrcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tSZW1vdmVDbGFzcztcbiAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tFZGl0Q2xhc3MgPSBibG9ja3MuZWRpdG9yTGF5b3V0SXRlbUJsb2NrRWRpdENsYXNzO1xuICAgICAgICBpZiAoZm9ybUNvbmZpZykge1xuICAgICAgICAgICAgdGhpcy5mb3JtQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGZvcm1Db25maWcuZm9ybUJsb2NrQ2xhc3MpO1xuICAgICAgICAgICAgdGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWUgPSBmb3JtQ29uZmlnLmZvcm1JbnB1dFZhcmlhYmxlTmFtZTtcbiAgICAgICAgICAgIHRoaXMuZm9ybUJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZm9ybUNvbmZpZy5mb3JtQnV0dG9uQ2xhc3MpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlZmF1bHRQcm9kdWN0ID0gcHJvZHVjdENvbmZpZ3NbMF07XG4gICAgICAgIGlmICghZGVmYXVsdFByb2R1Y3QpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW0VkaXRvcl0g0J3QtSDQvdCw0LnQtNC10L0g0LTQtdGE0L7Qu9GC0L3Ri9C5INC/0YDQvtC00YPQutGCJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGVmYXVsdE1vY2t1cCA9IGRlZmF1bHRQcm9kdWN0Lm1vY2t1cHNbMF07XG4gICAgICAgIGlmICghZGVmYXVsdE1vY2t1cCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbRWRpdG9yXSDQndC1INC90LDQudC00LXQvSDQtNC10YTQvtC70YLQvdGL0LkgbW9ja3VwJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc2VsZWN0Q29sb3IgPSBkZWZhdWx0TW9ja3VwLmNvbG9yO1xuICAgICAgICB0aGlzLl9zZWxlY3RTaWRlID0gZGVmYXVsdE1vY2t1cC5zaWRlO1xuICAgICAgICB0aGlzLl9zZWxlY3RUeXBlID0gZGVmYXVsdFByb2R1Y3QudHlwZTtcbiAgICAgICAgdGhpcy5fc2VsZWN0U2l6ZSA9IGRlZmF1bHRQcm9kdWN0LnNpemVzPy5bMF0gfHwgJ00nO1xuICAgICAgICB0aGlzLmVkaXRvckJsb2NrLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgdGhpcy5jcmVhdGVCYWNrZ3JvdW5kQmxvY2soKTtcbiAgICAgICAgdGhpcy5tb2NrdXBCbG9jayA9IHRoaXMuY3JlYXRlTW9ja3VwQmxvY2soKTtcbiAgICAgICAgdGhpcy5jYW52YXNlc0NvbnRhaW5lciA9IHRoaXMuY3JlYXRlQ2FudmFzZXNDb250YWluZXIoKTtcbiAgICAgICAgdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2sgPSB0aGlzLmNyZWF0ZUVkaXRvckxvYWRpbmdCbG9jaygpO1xuICAgICAgICB0aGlzLmluaXRFdmVudHMoKTtcbiAgICAgICAgdGhpcy5pbml0S2V5Ym9hcmRTaG9ydGN1dHMoKTtcbiAgICAgICAgdGhpcy5pbml0TG9hZGluZ0V2ZW50cygpO1xuICAgICAgICB0aGlzLmluaXRVSUNvbXBvbmVudHMoKTtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplRWRpdG9yKCk7XG4gICAgICAgIHdpbmRvdy5nZXRMYXlvdXRzID0gKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0cy5tYXAobGF5b3V0ID0+ICh7IC4uLmxheW91dCwgdXJsOiB1bmRlZmluZWQgfSkpO1xuICAgICAgICB9O1xuICAgICAgICB3aW5kb3cubG9hZExheW91dHMgPSAobGF5b3V0cykgPT4ge1xuICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gbGF5b3V0cy5tYXAobGF5b3V0ID0+IExheW91dC5mcm9tSlNPTihsYXlvdXQpKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICB9O1xuICAgICAgICB3aW5kb3cuZXhwb3J0UHJpbnQgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBleHBvcnRlZEFydCA9IGF3YWl0IHRoaXMuZXhwb3J0QXJ0KGZhbHNlLCA0MDk2KTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qgc2lkZSBvZiBPYmplY3Qua2V5cyhleHBvcnRlZEFydCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkb3dubG9hZExpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkb3dubG9hZExpbmspO1xuICAgICAgICAgICAgICAgIGRvd25sb2FkTGluay5ocmVmID0gZXhwb3J0ZWRBcnRbc2lkZV07XG4gICAgICAgICAgICAgICAgZG93bmxvYWRMaW5rLnRhcmdldCA9ICdfc2VsZic7XG4gICAgICAgICAgICAgICAgZG93bmxvYWRMaW5rLmRvd25sb2FkID0gYCR7c2lkZX0ucG5nYDtcbiAgICAgICAgICAgICAgICBkb3dubG9hZExpbmsuY2xpY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBleHBvcnRlZEFydDtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaW5pdFVJQ29tcG9uZW50cygpIHtcbiAgICAgICAgaWYgKHRoaXMuY2hhbmdlU2lkZUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5jaGFuZ2VTaWRlQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlU2lkZUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gdGhpcy5jaGFuZ2VTaWRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jaykge1xuICAgICAgICAgICAgdGhpcy5pbml0SGlzdG9yeVVuZG9CbG9jaygpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEhpc3RvcnlSZWRvQmxvY2soKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wcm9kdWN0TGlzdEJsb2NrICYmIHRoaXMucHJvZHVjdEl0ZW1CbG9jaykge1xuICAgICAgICAgICAgdGhpcy5pbml0UHJvZHVjdExpc3QoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5pbml0QWRkT3JkZXJCdXR0b24oKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5pbml0VXBsb2FkSW1hZ2VCdXR0b24oKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uICYmIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbiAmJiB0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEFpQnV0dG9ucygpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmZvcm1CbG9jayAmJiB0aGlzLmZvcm1CdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEZvcm0oKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5xdWFudGl0eUZvcm1CbG9jaykge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmluaXRGaXhRdWFudGl0eUZvcm0oKSwgNTAwKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JMYXlvdXRzTGlzdEJsb2NrKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICB0aGlzLmVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWQgaW1hZ2UgYnV0dG9uXSBjYW5jZWwgYnV0dG9uIGNsaWNrZWQnKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0VXNlclVwbG9hZEltYWdlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldFJlcXVpcmVkRWxlbWVudChzZWxlY3Rvcikge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBbRWRpdG9yXSDQndC1INC90LDQudC00LXQvSDQvtCx0Y/Qt9Cw0YLQtdC70YzQvdGL0Lkg0Y3Qu9C10LzQtdC90YI6ICR7c2VsZWN0b3J9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuICAgIGFzeW5jIGluaXRpYWxpemVFZGl0b3IoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkU3RhdGUoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucHJlbG9hZEFsbE1vY2t1cHMoKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tlZGl0b3JdINCY0L3QuNGG0LjQsNC70LjQt9Cw0YbQuNGPINC30LDQstC10YDRiNC10L3QsCcpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2VkaXRvcl0g0J7RiNC40LHQutCwINC40L3QuNGG0LjQsNC70LjQt9Cw0YbQuNC4OicsIGVycm9yKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZVdpdGhEZWZhdWx0cygpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGluaXRpYWxpemVXaXRoRGVmYXVsdHMoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tlZGl0b3JdINCY0L3QuNGG0LjQsNC70LjQt9Cw0YbQuNGPINGBINC00LXRhNC+0LvRgtC90YvQvNC4INC30L3QsNGH0LXQvdC40Y/QvNC4Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tlZGl0b3JdINCe0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4IG1vY2t1cCDQv9C+INGD0LzQvtC70YfQsNC90LjRjjonLCBlcnIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGluaXRFdmVudHMoKSB7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zPy5kaXNhYmxlQmVmb3JlVW5sb2FkV2FybmluZykge1xuICAgICAgICAgICAgd2luZG93Lm9uYmVmb3JldW5sb2FkID0gKGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sYXlvdXRzLmxlbmd0aCA+IDAgJiYgIXRoaXMuaXNBZGRlZFRvQ2FydCAmJiB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gJ9CU0LjQt9Cw0LnQvSDRgNC10LTQsNC60YLQvtGA0LAg0LzQvtC20LXRgiDQsdGL0YLRjCDQv9C+0YLQtdGA0Y/QvS4g0JLRiyDRg9Cy0LXRgNC10L3Riywg0YfRgtC+INGF0L7RgtC40YLQtSDQv9C+0LrQuNC90YPRgtGMINGB0YLRgNCw0L3QuNGG0YM/JztcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBlLnJldHVyblZhbHVlID0gbWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGxldCByZXNpemVUaW1lb3V0O1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHJlc2l6ZVRpbWVvdXQpO1xuICAgICAgICAgICAgcmVzaXplVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlV2luZG93UmVzaXplKCk7XG4gICAgICAgICAgICB9LCAxNTApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5ldmVudHMub24oRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9VUERBVEVELCAoZGF0YVVSTCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb2NrdXBCbG9jay5zcmMgPSBkYXRhVVJMO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaW5pdExvYWRpbmdFdmVudHMoKSB7XG4gICAgICAgIHRoaXMubG9hZGluZ0VsZW1lbnRzQ2FjaGUubG9hZGluZ1RleHQgPSB0aGlzLmVkaXRvckxvYWRpbmdCbG9jay5xdWVyeVNlbGVjdG9yKCcjbG9hZGluZy10ZXh0Jyk7XG4gICAgICAgIHRoaXMubG9hZGluZ0VsZW1lbnRzQ2FjaGUuc3Bpbm5lciA9IHRoaXMuZWRpdG9yTG9hZGluZ0Jsb2NrLnF1ZXJ5U2VsZWN0b3IoJyNzcGlubmVyJyk7XG4gICAgICAgIHRoaXMuZXZlbnRzLm9uKEVkaXRvckV2ZW50VHlwZS5MT0FESU5HX1RJTUVfVVBEQVRFRCwgKGxvYWRpbmdUaW1lKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB7IGxvYWRpbmdUZXh0LCBzcGlubmVyIH0gPSB0aGlzLmxvYWRpbmdFbGVtZW50c0NhY2hlO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNMb2FkaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9hZGluZ1RpbWUgPiA1KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nVGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRpbmdUZXh0LmlubmVyVGV4dCA9IGAkeyh0aGlzLmxvYWRpbmdUaW1lIC8gMTApLnRvRml4ZWQoMSl9YDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc3Bpbm5lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZGluZ0Jsb2NrLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjc0NSlcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nVGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc3Bpbm5lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDApXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmV2ZW50cy5vbihFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIChpc0xvYWRpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHsgbG9hZGluZ1RleHQsIHNwaW5uZXIgfSA9IHRoaXMubG9hZGluZ0VsZW1lbnRzQ2FjaGU7XG4gICAgICAgICAgICBpZiAoaXNMb2FkaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9hZGluZ0ludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5sb2FkaW5nSW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmdUaW1lID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLmlzTG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW21vY2t1cF0gbG9hZGluZyBtb2NrdXAnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmdJbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nVGltZSsrO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLkxPQURJTkdfVElNRV9VUERBVEVELCB0aGlzLmxvYWRpbmdUaW1lKTtcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDApXCI7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHNwaW5uZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9hZGluZ0ludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5sb2FkaW5nSW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmdJbnRlcnZhbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZ1RpbWUgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZW1pdCh0eXBlLCBkZXRhaWwpIHtcbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdCh0eXBlLCBkZXRhaWwpO1xuICAgIH1cbiAgICBpbml0S2V5Ym9hcmRTaG9ydGN1dHMoKSB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUVsZW1lbnQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgICAgICAgICAgY29uc3QgaXNJbnB1dEZpZWxkID0gYWN0aXZlRWxlbWVudCAmJiAoYWN0aXZlRWxlbWVudC50YWdOYW1lID09PSAnSU5QVVQnIHx8XG4gICAgICAgICAgICAgICAgYWN0aXZlRWxlbWVudC50YWdOYW1lID09PSAnVEVYVEFSRUEnIHx8XG4gICAgICAgICAgICAgICAgYWN0aXZlRWxlbWVudC5jb250ZW50RWRpdGFibGUgPT09ICd0cnVlJyB8fFxuICAgICAgICAgICAgICAgIGFjdGl2ZUVsZW1lbnQuaXNDb250ZW50RWRpdGFibGUpO1xuICAgICAgICAgICAgaWYgKGlzSW5wdXRGaWVsZClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBpZiAoZXZlbnQuY3RybEtleSAmJiBldmVudC5jb2RlID09PSAnS2V5WicgJiYgIWV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVuZG8oKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoKGV2ZW50LmN0cmxLZXkgJiYgZXZlbnQuc2hpZnRLZXkgJiYgZXZlbnQuY29kZSA9PT0gJ0tleVonKSB8fFxuICAgICAgICAgICAgICAgIChldmVudC5jdHJsS2V5ICYmIGV2ZW50LmNvZGUgPT09ICdLZXlZJyAmJiAhZXZlbnQuc2hpZnRLZXkpKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZG8oKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjcmVhdGVCYWNrZ3JvdW5kQmxvY2soKSB7XG4gICAgICAgIGNvbnN0IGJhY2tncm91bmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgYmFja2dyb3VuZC5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItcG9zaXRpb24nKTtcbiAgICAgICAgYmFja2dyb3VuZC5pZCA9ICdlZGl0b3ItYmFja2dyb3VuZCc7XG4gICAgICAgIHRoaXMuZWRpdG9yQmxvY2suYXBwZW5kQ2hpbGQoYmFja2dyb3VuZCk7XG4gICAgICAgIHJldHVybiBiYWNrZ3JvdW5kO1xuICAgIH1cbiAgICBjcmVhdGVNb2NrdXBCbG9jaygpIHtcbiAgICAgICAgY29uc3QgbW9ja3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgICAgIG1vY2t1cC5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItcG9zaXRpb24nKTtcbiAgICAgICAgbW9ja3VwLmlkID0gJ2VkaXRvci1tb2NrdXAnO1xuICAgICAgICB0aGlzLmVkaXRvckJsb2NrLmFwcGVuZENoaWxkKG1vY2t1cCk7XG4gICAgICAgIHJldHVybiBtb2NrdXA7XG4gICAgfVxuICAgIGNyZWF0ZUNhbnZhc2VzQ29udGFpbmVyKCkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgY2FudmFzLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1wb3NpdGlvbicpO1xuICAgICAgICBjYW52YXMuaWQgPSAnZWRpdG9yLWNhbnZhc2VzLWNvbnRhaW5lcic7XG4gICAgICAgIGNhbnZhcy5zdHlsZS56SW5kZXggPSAnMTAnO1xuICAgICAgICBjYW52YXMuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jay5hcHBlbmRDaGlsZChjYW52YXMpO1xuICAgICAgICByZXR1cm4gY2FudmFzO1xuICAgIH1cbiAgICBjcmVhdGVFZGl0b3JMb2FkaW5nQmxvY2soKSB7XG4gICAgICAgIGNvbnN0IGVkaXRvckxvYWRpbmdCbG9jayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBlZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xuICAgICAgICBlZGl0b3JMb2FkaW5nQmxvY2suY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXBvc2l0aW9uJyk7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5pZCA9ICdlZGl0b3ItbG9hZGluZyc7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5zdHlsZS56SW5kZXggPSBcIjEwMDBcIjtcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcIm5vbmVcIjtcbiAgICAgICAgY29uc3QgbG9hZGluZ1RleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgbG9hZGluZ1RleHQuaWQgPSAnbG9hZGluZy10ZXh0JztcbiAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS50ZXh0QWxpZ24gPSBcImNlbnRlclwiO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUudG9wID0gXCI1MCVcIjtcbiAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUubGVmdCA9IFwiNTAlXCI7XG4gICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKC01MCUsIC01MCUpXCI7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5hcHBlbmRDaGlsZChsb2FkaW5nVGV4dCk7XG4gICAgICAgIGNvbnN0IHNwaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgc3Bpbm5lci5pZCA9ICdzcGlubmVyJztcbiAgICAgICAgc3Bpbm5lci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5hcHBlbmRDaGlsZChzcGlubmVyKTtcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jay5hcHBlbmRDaGlsZChlZGl0b3JMb2FkaW5nQmxvY2spO1xuICAgICAgICByZXR1cm4gZWRpdG9yTG9hZGluZ0Jsb2NrO1xuICAgIH1cbiAgICBhc3luYyB1cGRhdGVNb2NrdXAoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFttb2NrdXBdIHVwZGF0ZSBmb3IgJHt0aGlzLl9zZWxlY3RUeXBlfSAke3RoaXMuX3NlbGVjdFNpZGV9ICR7dGhpcy5fc2VsZWN0Q29sb3IubmFtZX1gKTtcbiAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgdHJ1ZSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBtb2NrdXBJbWFnZVVybCA9IHRoaXMuZmluZE1vY2t1cFVybCgpO1xuICAgICAgICAgICAgaWYgKCFtb2NrdXBJbWFnZVVybCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW21vY2t1cF0g0J3QtSDQvdCw0LnQtNC10L0gbW9ja3VwINC00LvRjyDRgtC10LrRg9GJ0LjRhSDQv9Cw0YDQsNC80LXRgtGA0L7QsicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZGF0YVVSTCA9IGF3YWl0IHRoaXMubG9hZEFuZENvbnZlcnRJbWFnZShtb2NrdXBJbWFnZVVybCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9VUERBVEVELCBkYXRhVVJMKTtcbiAgICAgICAgICAgIHRoaXMubW9ja3VwQmxvY2suc3JjID0gZGF0YVVSTDtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1ttb2NrdXBdIE1vY2t1cCDRg9GB0L/QtdGI0L3QviDQvtCx0L3QvtCy0LvQtdC9Jyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbbW9ja3VwXSDQntGI0LjQsdC60LAg0L7QsdC90L7QstC70LXQvdC40Y8gbW9ja3VwOicsIGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgZmFsc2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZpbmRNb2NrdXBVcmwoKSB7XG4gICAgICAgIGNvbnN0IGNhY2hlS2V5ID0gYCR7dGhpcy5fc2VsZWN0VHlwZX0tJHt0aGlzLl9zZWxlY3RTaWRlfS0ke3RoaXMuX3NlbGVjdENvbG9yLm5hbWV9YDtcbiAgICAgICAgaWYgKHRoaXMubW9ja3VwQ2FjaGUuaGFzKGNhY2hlS2V5KSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubW9ja3VwQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpIHtcbiAgICAgICAgICAgIHRoaXMubW9ja3VwQ2FjaGUuc2V0KGNhY2hlS2V5LCBudWxsKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1vY2t1cCA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG0gPT4gbS5zaWRlID09PSB0aGlzLl9zZWxlY3RTaWRlICYmIG0uY29sb3IubmFtZSA9PT0gdGhpcy5fc2VsZWN0Q29sb3IubmFtZSk7XG4gICAgICAgIGNvbnN0IHVybCA9IG1vY2t1cD8udXJsIHx8IG51bGw7XG4gICAgICAgIHRoaXMubW9ja3VwQ2FjaGUuc2V0KGNhY2hlS2V5LCB1cmwpO1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cbiAgICBnZXRQcm9kdWN0QnlUeXBlKHR5cGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLnByb2R1Y3RDYWNoZS5oYXModHlwZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLnByb2R1Y3RDb25maWdzLmZpbmQocCA9PiBwLnR5cGUgPT09IHR5cGUpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByb2R1Y3RDYWNoZS5zZXQodHlwZSwgcHJvZHVjdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucHJvZHVjdENhY2hlLmdldCh0eXBlKTtcbiAgICB9XG4gICAgY2xlYXJNb2NrdXBDYWNoZSgpIHtcbiAgICAgICAgdGhpcy5tb2NrdXBDYWNoZS5jbGVhcigpO1xuICAgIH1cbiAgICBhc3luYyBsb2FkQW5kQ29udmVydEltYWdlKGltYWdlVXJsKSB7XG4gICAgICAgIGlmICh0aGlzLmltYWdlQ2FjaGUuaGFzKGltYWdlVXJsKSkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2NhY2hlXSDQmNC30L7QsdGA0LDQttC10L3QuNC1INC30LDQs9GA0YPQttC10L3QviDQuNC3INC60Y3RiNCwOicsIGltYWdlVXJsKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmltYWdlQ2FjaGUuZ2V0KGltYWdlVXJsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIGltYWdlLnNldEF0dHJpYnV0ZSgnY3Jvc3NPcmlnaW4nLCAnYW5vbnltb3VzJyk7XG4gICAgICAgICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IGltYWdlLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ9Cd0LUg0YPQtNCw0LvQvtGB0Ywg0L/QvtC70YPRh9C40YLRjCDQutC+0L3RgtC10LrRgdGCIGNhbnZhcycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKGltYWdlLCAwLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YVVSTCA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmltYWdlQ2FjaGUuc2V0KGltYWdlVXJsLCBkYXRhVVJMKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2NhY2hlXSDQmNC30L7QsdGA0LDQttC10L3QuNC1INGB0L7RhdGA0LDQvdC10L3QviDQsiDQutGN0Yg6JywgaW1hZ2VVcmwpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGFVUkwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1hZ2Uub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCDQuNC30L7QsdGA0LDQttC10L3QuNGPOiAke2ltYWdlVXJsfWApKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbWFnZS5zcmMgPSBpbWFnZVVybDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIHNhdmVTdGF0ZSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3N0YXRlXSDQodC+0YXRgNCw0L3QtdC90LjQtSDRgdC+0YHRgtC+0Y/QvdC40Y8g0YDQtdC00LDQutGC0L7RgNCwJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3JTdGF0ZSA9IHtcbiAgICAgICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgdHlwZTogdGhpcy5fc2VsZWN0VHlwZSxcbiAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IubmFtZSxcbiAgICAgICAgICAgICAgICBzaWRlOiB0aGlzLl9zZWxlY3RTaWRlLFxuICAgICAgICAgICAgICAgIHNpemU6IHRoaXMuX3NlbGVjdFNpemVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbc3RhdGVdINCh0L7RhdGA0LDQvdGP0LXQvDogdHlwZT0ke2VkaXRvclN0YXRlLnR5cGV9LCBjb2xvcj0ke2VkaXRvclN0YXRlLmNvbG9yfSwgc2lkZT0ke2VkaXRvclN0YXRlLnNpZGV9LCBzaXplPSR7ZWRpdG9yU3RhdGUuc2l6ZX1gKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RvcmFnZU1hbmFnZXIuc2F2ZUVkaXRvclN0YXRlKGVkaXRvclN0YXRlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tzdGF0ZV0g0KHQvtGB0YLQvtGP0L3QuNC1INGD0YHQv9C10YjQvdC+INGB0L7RhdGA0LDQvdC10L3QvicpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y8g0YHQvtGB0YLQvtGP0L3QuNGPOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBzYXZlTGF5b3V0cygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2xheWVyc10g0KHQvtGF0YDQsNC90LXQvdC40LUg0YHQu9C+0ZHQsicpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci5zYXZlTGF5ZXJzKHRoaXMubGF5b3V0cyk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbbGF5ZXJzXSDQodC70L7QuCDRg9GB0L/QtdGI0L3QviDRgdC+0YXRgNCw0L3QtdC90YsnKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBsb2FkTGF5b3V0cygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2xheWVyc10g0JfQsNCz0YDRg9C30LrQsCDRgdC70L7RkdCyJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzYXZlZExheW91dHMgPSBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLmxvYWRMYXllcnMoKTtcbiAgICAgICAgICAgIGlmIChzYXZlZExheW91dHMgJiYgQXJyYXkuaXNBcnJheShzYXZlZExheW91dHMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gc2F2ZWRMYXlvdXRzLm1hcCgobGF5b3V0RGF0YSkgPT4gbmV3IExheW91dChsYXlvdXREYXRhKSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2xheWVyc10g0JfQsNCz0YDRg9C20LXQvdC+ICR7dGhpcy5sYXlvdXRzLmxlbmd0aH0g0YHQu9C+0ZHQsmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gW107XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2xheWVyc10g0J3QtdGCINGB0L7RhdGA0LDQvdGR0L3QvdGL0YUg0YHQu9C+0ZHQsicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbbGF5ZXJzXSDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCDRgdC70L7RkdCyOicsIGVycm9yKTtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0cyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgbG9hZFN0YXRlKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbc3RhdGVdINCX0LDQs9GA0YPQt9C60LAg0YHQvtGB0YLQvtGP0L3QuNGPINGA0LXQtNCw0LrRgtC+0YDQsCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yU3RhdGUgPSBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLmxvYWRFZGl0b3JTdGF0ZSgpO1xuICAgICAgICAgICAgaWYgKCFlZGl0b3JTdGF0ZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tzdGF0ZV0g0KHQvtGF0YDQsNC90LXQvdC90L7QtSDRgdC+0YHRgtC+0Y/QvdC40LUg0L3QtSDQvdCw0LnQtNC10L3QvicpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkUHJvZHVjdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdENvbG9yc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRTaXplc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5pc1N0YXRlRXhwaXJlZChlZGl0b3JTdGF0ZS5kYXRlKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW3N0YXRlXSDQodC+0YHRgtC+0Y/QvdC40LUg0YPRgdGC0LDRgNC10LvQviwg0L7Rh9C40YnQsNC10LwnKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLmNsZWFyRWRpdG9yU3RhdGUoKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRDb2xvcnNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0U2l6ZXNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYXBwbGllZCA9IGF3YWl0IHRoaXMuYXBwbHlTdGF0ZShlZGl0b3JTdGF0ZSk7XG4gICAgICAgICAgICBpZiAoYXBwbGllZCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tzdGF0ZV0g0KHQvtGB0YLQvtGP0L3QuNC1INGD0YHQv9C10YjQvdC+INC30LDQs9GA0YPQttC10L3QvicpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkUHJvZHVjdCgpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb2R1Y3RCbG9ja3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2R1Y3RCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBibG9jay5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYigyMjIgMjIyIDIyMiknO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLnByb2R1Y3RCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fcHJvZHVjdC1ibG9ja19fJyArIHRoaXMuX3NlbGVjdFR5cGUpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmVCbG9jay5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdENvbG9yc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRTaXplc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zYXZlTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tzdGF0ZV0g0J3QtSDRg9C00LDQu9C+0YHRjCDQv9GA0LjQvNC10L3QuNGC0Ywg0YHQvtGF0YDQsNC90LXQvdC90L7QtSDRgdC+0YHRgtC+0Y/QvdC40LUnKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRDb2xvcnNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0U2l6ZXNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbc3RhdGVdINCe0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4INGB0L7RgdGC0L7Rj9C90LjRjzonLCBlcnJvcik7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICAgICAgdGhpcy5sb2FkUHJvZHVjdCgpO1xuICAgICAgICAgICAgdGhpcy5pbml0Q29sb3JzTGlzdCgpO1xuICAgICAgICAgICAgdGhpcy5pbml0U2l6ZXNMaXN0KCk7XG4gICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaXNTdGF0ZUV4cGlyZWQoZGF0ZVN0cmluZykge1xuICAgICAgICBjb25zdCBzdGF0ZURhdGUgPSBuZXcgRGF0ZShkYXRlU3RyaW5nKTtcbiAgICAgICAgY29uc3QgZXhwaXJhdGlvbkRhdGUgPSBEYXRlLm5vdygpIC0gKENPTlNUQU5UUy5TVEFURV9FWFBJUkFUSU9OX0RBWVMgKiAyNCAqIDYwICogNjAgKiAxMDAwKTtcbiAgICAgICAgcmV0dXJuIHN0YXRlRGF0ZS5nZXRUaW1lKCkgPCBleHBpcmF0aW9uRGF0ZTtcbiAgICB9XG4gICAgYXN5bmMgYXBwbHlTdGF0ZShlZGl0b3JTdGF0ZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCFlZGl0b3JTdGF0ZS50eXBlIHx8ICFlZGl0b3JTdGF0ZS5jb2xvciB8fCAhZWRpdG9yU3RhdGUuc2lkZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW3N0YXRlXSDQndC10LrQvtGA0YDQtdC60YLQvdC+0LUg0YHQvtGB0YLQvtGP0L3QuNC1OiDQvtGC0YHRg9GC0YHRgtCy0YPRjtGCINC+0LHRj9C30LDRgtC10LvRjNC90YvQtSDQv9C+0LvRjycpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtzdGF0ZV0g0JLQvtGB0YHRgtCw0L3QvtCy0LvQtdC90LjQtSDRgdC+0YHRgtC+0Y/QvdC40Y86IHR5cGU9JHtlZGl0b3JTdGF0ZS50eXBlfSwgY29sb3I9JHtlZGl0b3JTdGF0ZS5jb2xvcn0sIHNpZGU9JHtlZGl0b3JTdGF0ZS5zaWRlfSwgc2l6ZT0ke2VkaXRvclN0YXRlLnNpemV9YCk7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5wcm9kdWN0Q29uZmlncy5maW5kKHAgPT4gcC50eXBlID09PSBlZGl0b3JTdGF0ZS50eXBlKTtcbiAgICAgICAgICAgIGlmICghcHJvZHVjdCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW3N0YXRlXSDQn9GA0L7QtNGD0LrRgiDRgtC40L/QsCAke2VkaXRvclN0YXRlLnR5cGV9INC90LUg0L3QsNC50LTQtdC9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbW9ja3VwID0gcHJvZHVjdC5tb2NrdXBzLmZpbmQobSA9PiBtLmNvbG9yLm5hbWUgPT09IGVkaXRvclN0YXRlLmNvbG9yKTtcbiAgICAgICAgICAgIGlmICghbW9ja3VwKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbc3RhdGVdIE1vY2t1cCDRgSDRhtCy0LXRgtC+0LwgJHtlZGl0b3JTdGF0ZS5jb2xvcn0g0L3QtSDQvdCw0LnQtNC10L0g0LTQu9GPINC/0YDQvtC00YPQutGC0LAgJHtlZGl0b3JTdGF0ZS50eXBlfWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdFR5cGUgPSBlZGl0b3JTdGF0ZS50eXBlO1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0Q29sb3IgPSBtb2NrdXAuY29sb3I7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RTaWRlID0gZWRpdG9yU3RhdGUuc2lkZTtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdFNpemUgPSBlZGl0b3JTdGF0ZS5zaXplIHx8IHRoaXMuX3NlbGVjdFNpemU7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbc3RhdGVdINCh0L7RgdGC0L7Rj9C90LjQtSDQv9GA0LjQvNC10L3QtdC90L46IHR5cGU9JHt0aGlzLl9zZWxlY3RUeXBlfSwgY29sb3I9JHt0aGlzLl9zZWxlY3RDb2xvci5uYW1lfSwgc2lkZT0ke3RoaXMuX3NlbGVjdFNpZGV9LCBzaXplPSR7dGhpcy5fc2VsZWN0U2l6ZX1gKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0L/RgNC40LzQtdC90LXQvdC40Y8g0YHQvtGB0YLQvtGP0L3QuNGPOicsIGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXRUeXBlKHR5cGUpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdFR5cGUgIT09IHR5cGUpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdFR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgdGhpcy5jbGVhck1vY2t1cENhY2hlKCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLlNUQVRFX0NIQU5HRUQsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbc3RhdGVdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjzonLCBlcnIpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXRDb2xvcihjb2xvcikge1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0Q29sb3IgIT09IGNvbG9yKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RDb2xvciA9IGNvbG9yO1xuICAgICAgICAgICAgdGhpcy5jbGVhck1vY2t1cENhY2hlKCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLlNUQVRFX0NIQU5HRUQsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbc3RhdGVdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjzonLCBlcnIpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXRTaWRlKHNpZGUpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdFNpZGUgIT09IHNpZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdFNpZGUgPSBzaWRlO1xuICAgICAgICAgICAgdGhpcy5jbGVhck1vY2t1cENhY2hlKCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLlNUQVRFX0NIQU5HRUQsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbc3RhdGVdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjzonLCBlcnIpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXRTaXplKHNpemUpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdFNpemUgIT09IHNpemUpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdFNpemUgPSBzaXplO1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5TVEFURV9DSEFOR0VELCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y86JywgZXJyKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYWRkTGF5b3V0KGxheW91dCkge1xuICAgICAgICBpZiAodGhpcy5pc1Jlc3RvcmluZ0Zyb21IaXN0b3J5KSB7XG4gICAgICAgICAgICB0aGlzLmxheW91dHMucHVzaChsYXlvdXQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sYXlvdXRzLnB1c2gobGF5b3V0KTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZUxheWVyc1RvSGlzdG9yeSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTEFZT1VUX0FEREVELCBsYXlvdXQpO1xuICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICB0aGlzLnNhdmVMYXlvdXRzKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycikpO1xuICAgIH1cbiAgICByZW1vdmVMYXlvdXQobGF5b3V0SWQpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmxheW91dHMuZmluZEluZGV4KGwgPT4gbC5pZCA9PT0gbGF5b3V0SWQpO1xuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICBjb25zdCBsYXlvdXQgPSB0aGlzLmxheW91dHNbaW5kZXhdO1xuICAgICAgICAgICAgaWYgKGxheW91dCkge1xuICAgICAgICAgICAgICAgIHRoaXMubGF5b3V0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pc1Jlc3RvcmluZ0Zyb21IaXN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2F2ZUxheWVyc1RvSGlzdG9yeSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLkxBWU9VVF9SRU1PVkVELCBsYXlvdXRJZCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zYXZlTGF5b3V0cygpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbbGF5ZXJzXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y8g0YHQu9C+0ZHQsjonLCBlcnIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHVwZGF0ZUxheW91dChsYXlvdXRJZCwgdXBkYXRlcykge1xuICAgICAgICBjb25zdCBsYXlvdXQgPSB0aGlzLmxheW91dHMuZmluZChsID0+IGwuaWQgPT09IGxheW91dElkKTtcbiAgICAgICAgaWYgKGxheW91dCkge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihsYXlvdXQsIHVwZGF0ZXMpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkpIHtcbiAgICAgICAgICAgICAgICBpZiAoJ3VybCcgaW4gdXBkYXRlcyB8fCAnbmFtZScgaW4gdXBkYXRlcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNhdmVMYXllcnNUb0hpc3RvcnkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLkxBWU9VVF9VUERBVEVELCBsYXlvdXQpO1xuICAgICAgICAgICAgdGhpcy5zYXZlTGF5b3V0cygpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbbGF5ZXJzXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y8g0YHQu9C+0ZHQsjonLCBlcnIpKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZ2V0TGF5b3V0KGxheW91dElkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxheW91dHMuZmluZChsID0+IGwuaWQgPT09IGxheW91dElkKTtcbiAgICB9XG4gICAgZ2V0TGF5b3V0cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0cztcbiAgICB9XG4gICAgaW5pdEhpc3RvcnlVbmRvQmxvY2soKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5IGJsb2NrXSBpbml0IHVuZG8nKTtcbiAgICAgICAgdGhpcy5lZGl0b3JIaXN0b3J5VW5kb0Jsb2NrLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgdGhpcy5lZGl0b3JIaXN0b3J5VW5kb0Jsb2NrLm9uY2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbaGlzdG9yeSB1bmRvIGJsb2NrXSBjbGlja2VkJyk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnVuZG8oKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy51cGRhdGVIaXN0b3J5QnV0dG9uc1N0YXRlKCk7XG4gICAgfVxuICAgIGluaXRIaXN0b3J5UmVkb0Jsb2NrKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbaGlzdG9yeSByZWRvIGJsb2NrXSBpbml0IHJlZG8nKTtcbiAgICAgICAgdGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgdGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrLm9uY2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbaGlzdG9yeSByZWRvIGJsb2NrXSBjbGlja2VkJyk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlZG8oKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy51cGRhdGVIaXN0b3J5QnV0dG9uc1N0YXRlKCk7XG4gICAgfVxuICAgIGluaXRQcm9kdWN0TGlzdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnByb2R1Y3RMaXN0QmxvY2sgfHwgIXRoaXMucHJvZHVjdEl0ZW1CbG9jaylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW1Byb2R1Y3RMaXN0XSBpbml0IHByb2R1Y3QgbGlzdCcpO1xuICAgICAgICB0aGlzLnByb2R1Y3RJdGVtQmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgdGhpcy5wcm9kdWN0Q29uZmlncy5mb3JFYWNoKHByb2R1Y3QgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdEl0ZW0gPSB0aGlzLnByb2R1Y3RJdGVtQmxvY2suY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgcHJvZHVjdEl0ZW0uc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0SW1hZ2VXcmFwcGVyID0gcHJvZHVjdEl0ZW0ucXVlcnlTZWxlY3RvcignLnByb2R1Y3QtaXRlbS1pbWFnZScpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3RJbWFnZVdyYXBwZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0SW1hZ2UgPSBnZXRMYXN0Q2hpbGQocHJvZHVjdEltYWdlV3JhcHBlcik7XG4gICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RJbWFnZSkge1xuICAgICAgICAgICAgICAgICAgICBwcm9kdWN0SW1hZ2Uuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gYHVybCgke3Byb2R1Y3QubW9ja3Vwc1swXT8udXJsfSlgO1xuICAgICAgICAgICAgICAgICAgICBwcm9kdWN0SW1hZ2Uuc3R5bGUuYmFja2dyb3VuZFNpemUgPSAnY292ZXInO1xuICAgICAgICAgICAgICAgICAgICBwcm9kdWN0SW1hZ2Uuc3R5bGUuYmFja2dyb3VuZFBvc2l0aW9uID0gJ2NlbnRlcic7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RJbWFnZS5zdHlsZS5iYWNrZ3JvdW5kUmVwZWF0ID0gJ25vLXJlcGVhdCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcHJvZHVjdFRleHRXcmFwcGVyID0gcHJvZHVjdEl0ZW0ucXVlcnlTZWxlY3RvcignLnByb2R1Y3QtaXRlbS10ZXh0Jyk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdFRleHRXcmFwcGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdFRleHQgPSBnZXRMYXN0Q2hpbGQocHJvZHVjdFRleHRXcmFwcGVyKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvZHVjdFRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvZHVjdFRleHQuaW5uZXJUZXh0ID0gcHJvZHVjdC5wcm9kdWN0TmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0QmxvY2sgPSBwcm9kdWN0SXRlbS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIHByb2R1Y3RCbG9jay5jbGFzc0xpc3QuYWRkKCdlZGl0b3Itc2V0dGluZ3NfX3Byb2R1Y3QtYmxvY2tfXycgKyBwcm9kdWN0LnR5cGUpO1xuICAgICAgICAgICAgcHJvZHVjdEJsb2NrLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHByb2R1Y3RCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgICAgICAgICBwcm9kdWN0SXRlbS5vbmNsaWNrID0gKCkgPT4gdGhpcy5jaGFuZ2VQcm9kdWN0KHByb2R1Y3QudHlwZSk7XG4gICAgICAgICAgICB0aGlzLnByb2R1Y3RCbG9ja3MucHVzaChwcm9kdWN0QmxvY2spO1xuICAgICAgICAgICAgdGhpcy5wcm9kdWN0TGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkLmFwcGVuZENoaWxkKHByb2R1Y3RJdGVtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLnByb2R1Y3RCbG9ja3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5wcm9kdWN0QmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgICAgIGJsb2NrLnN0eWxlLmJhY2tncm91bmQgPSAncmdiKDIyMiAyMjIgMjIyKSc7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUJsb2NrID0gdGhpcy5wcm9kdWN0QmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX3Byb2R1Y3QtYmxvY2tfXycgKyB0aGlzLl9zZWxlY3RUeXBlKSk7XG4gICAgICAgICAgICBpZiAoYWN0aXZlQmxvY2spIHtcbiAgICAgICAgICAgICAgICBhY3RpdmVCbG9jay5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5pdENvbG9yc0xpc3QoKSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JDb2xvcnNMaXN0QmxvY2sgfHwgIXRoaXMuZWRpdG9yQ29sb3JJdGVtQmxvY2spXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gaW5pdCBjb2xvcnMgZm9yICR7dGhpcy5fc2VsZWN0VHlwZX1gKTtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmVkaXRvckNvbG9ySXRlbUJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGNvbnN0IGNvbG9yc0NvbnRhaW5lciA9IHRoaXMuZWRpdG9yQ29sb3JzTGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICBjb2xvcnNDb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIHRoaXMuY29sb3JCbG9ja3MgPSBbXTtcbiAgICAgICAgY29uc3QgY29sb3JzID0gcHJvZHVjdC5tb2NrdXBzXG4gICAgICAgICAgICAuZmlsdGVyKG1vY2t1cCA9PiBtb2NrdXAuc2lkZSA9PT0gdGhpcy5fc2VsZWN0U2lkZSlcbiAgICAgICAgICAgIC5tYXAobW9ja3VwID0+IG1vY2t1cC5jb2xvcik7XG4gICAgICAgIGNvbG9ycy5mb3JFYWNoKGNvbG9yID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9ySXRlbSA9IHRoaXMuZWRpdG9yQ29sb3JJdGVtQmxvY2suY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgY29sb3JJdGVtLnN0eWxlLmRpc3BsYXkgPSAndGFibGUnO1xuICAgICAgICAgICAgY29uc3QgY29sb3JCbG9jayA9IGNvbG9ySXRlbS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGNvbG9yQmxvY2suY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXNldHRpbmdzX19jb2xvci1ibG9ja19fJyArIGNvbG9yLm5hbWUpO1xuICAgICAgICAgICAgY29sb3JCbG9jay5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICBjb2xvckJsb2NrLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yLmhleDtcbiAgICAgICAgICAgIGNvbG9yQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICAgICAgICAgICAgY29sb3JJdGVtLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNoYW5nZUNvbG9yKGNvbG9yLm5hbWUpO1xuICAgICAgICAgICAgdGhpcy5jb2xvckJsb2Nrcy5wdXNoKGNvbG9yQmxvY2spO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JDb2xvcnNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuYXBwZW5kQ2hpbGQoY29sb3JJdGVtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLmNvbG9yQmxvY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuY29sb3JCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICAgICAgYmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YzZjNmMyc7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUJsb2NrID0gdGhpcy5jb2xvckJsb2Nrcy5maW5kKGJsb2NrID0+IGJsb2NrLmNsYXNzTGlzdC5jb250YWlucygnZWRpdG9yLXNldHRpbmdzX19jb2xvci1ibG9ja19fJyArIHRoaXMuX3NlbGVjdENvbG9yLm5hbWUpKTtcbiAgICAgICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgICAgIGFjdGl2ZUJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5pdFNpemVzTGlzdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvclNpemVzTGlzdEJsb2NrIHx8ICF0aGlzLmVkaXRvclNpemVJdGVtQmxvY2spXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gaW5pdCBzaXplcyBmb3IgJHt0aGlzLl9zZWxlY3RUeXBlfWApO1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QgfHwgIXByb2R1Y3Quc2l6ZXMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuZWRpdG9yU2l6ZUl0ZW1CbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBjb25zdCBzaXplc0NvbnRhaW5lciA9IHRoaXMuZWRpdG9yU2l6ZXNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgIHNpemVzQ29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuICAgICAgICB0aGlzLnNpemVCbG9ja3MgPSBbXTtcbiAgICAgICAgcHJvZHVjdC5zaXplcy5mb3JFYWNoKHNpemUgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc2l6ZUl0ZW0gPSB0aGlzLmVkaXRvclNpemVJdGVtQmxvY2suY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgc2l6ZUl0ZW0uc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICBzaXplSXRlbS5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICBzaXplSXRlbS5zdHlsZS51c2VyU2VsZWN0ID0gJ25vbmUnO1xuICAgICAgICAgICAgc2l6ZUl0ZW0uY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXNldHRpbmdzX19zaXplLWJsb2NrX18nICsgc2l6ZSk7XG4gICAgICAgICAgICBjb25zdCBib3JkZXJCbG9jayA9IHNpemVJdGVtLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgYm9yZGVyQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YzZjNmMyc7XG4gICAgICAgICAgICBjb25zdCBzaXplVGV4dCA9IGdldExhc3RDaGlsZChzaXplSXRlbSk7XG4gICAgICAgICAgICBpZiAoc2l6ZVRleHQpIHtcbiAgICAgICAgICAgICAgICBzaXplVGV4dC5pbm5lclRleHQgPSBzaXplO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2l6ZUl0ZW0ub25jbGljayA9ICgpID0+IHRoaXMuY2hhbmdlU2l6ZShzaXplKTtcbiAgICAgICAgICAgIHRoaXMuc2l6ZUJsb2Nrcy5wdXNoKHNpemVJdGVtKTtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yU2l6ZXNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuYXBwZW5kQ2hpbGQoc2l6ZUl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuc2l6ZUJsb2Nrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnNpemVCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYm9yZGVyQmxvY2sgPSBibG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgICAgICBpZiAoYm9yZGVyQmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YzZjNmMyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBhY3RpdmVCbG9jayA9IHRoaXMuc2l6ZUJsb2Nrcy5maW5kKGJsb2NrID0+IGJsb2NrLmNsYXNzTGlzdC5jb250YWlucygnZWRpdG9yLXNldHRpbmdzX19zaXplLWJsb2NrX18nICsgdGhpcy5fc2VsZWN0U2l6ZSkpO1xuICAgICAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYm9yZGVyQmxvY2sgPSBhY3RpdmVCbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgICAgICBpZiAoYm9yZGVyQmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2hvd0xheW91dExpc3QoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tzZXR0aW5nc10gW2xheW91dHNdIHNob3cgbGF5b3V0cyBsaXN0Jyk7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2spIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbc2V0dGluZ3NdIFtsYXlvdXRzXSBlZGl0b3JMYXlvdXRJdGVtQmxvY2sgaXMgbm90IGluaXRpYWxpemVkXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JMYXlvdXRzTGlzdEJsb2NrKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW3NldHRpbmdzXSBbbGF5b3V0c10gZWRpdG9yTGF5b3V0c0xpc3RCbG9jayBpcyBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRzTGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkLmlubmVySFRNTCA9ICcnO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSBsYXlvdXRzIGxpc3QgYmxvY2sgY2hpbGRyZW46ICR7dGhpcy5lZGl0b3JMYXlvdXRzTGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkLmNoaWxkcmVuLmxlbmd0aH1gKTtcbiAgICAgICAgdGhpcy5sYXlvdXRzLmZvckVhY2gobGF5b3V0ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dEl0ZW0gPSB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9jay5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBsYXlvdXRJdGVtLnN0eWxlLmRpc3BsYXkgPSAndGFibGUnO1xuICAgICAgICAgICAgY29uc3QgaXNFZGl0aW5nID0gdGhpcy5fc2VsZWN0TGF5b3V0ID09PSBsYXlvdXQuaWQ7XG4gICAgICAgICAgICBjb25zdCBwcmV2aWV3QmxvY2sgPSB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja1ZpZXdDbGFzc1xuICAgICAgICAgICAgICAgID8gbGF5b3V0SXRlbS5xdWVyeVNlbGVjdG9yKHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrVmlld0NsYXNzKVxuICAgICAgICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IG5hbWVCbG9jayA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrTmFtZUNsYXNzXG4gICAgICAgICAgICAgICAgPyBsYXlvdXRJdGVtLnF1ZXJ5U2VsZWN0b3IodGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tOYW1lQ2xhc3MpXG4gICAgICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgcmVtb3ZlQmxvY2sgPSB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja1JlbW92ZUNsYXNzXG4gICAgICAgICAgICAgICAgPyBsYXlvdXRJdGVtLnF1ZXJ5U2VsZWN0b3IodGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tSZW1vdmVDbGFzcylcbiAgICAgICAgICAgICAgICA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCBlZGl0QmxvY2sgPSB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja0VkaXRDbGFzc1xuICAgICAgICAgICAgICAgID8gbGF5b3V0SXRlbS5xdWVyeVNlbGVjdG9yKHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrRWRpdENsYXNzKVxuICAgICAgICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgICAgIGlmIChwcmV2aWV3QmxvY2spIHtcbiAgICAgICAgICAgICAgICBpZiAobGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcmV2aWV3RWxlbWVudCA9IHByZXZpZXdCbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZXZpZXdFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3RWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBgdXJsKCR7bGF5b3V0LnVybH0pYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJhY2tncm91bmRTaXplID0gJ2NvbnRhaW4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlld0VsZW1lbnQuc3R5bGUuYmFja2dyb3VuZFBvc2l0aW9uID0gJ2NlbnRlcic7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3RWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kUmVwZWF0ID0gJ25vLXJlcGVhdCc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzRWRpdGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlld0VsZW1lbnQuc3R5bGUuYm9yZGVyQ29sb3IgPSAncmdiKDI1NCwgOTQsIDU4KSc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3RWxlbWVudC5zdHlsZS5ib3JkZXJDb2xvciA9ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGxheW91dC50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmFtZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZUVsZW1lbnQgPSBuYW1lQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWVFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXlvdXQudHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzcGxheU5hbWUgPSAhbGF5b3V0Lm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IFwi0JjQt9C+0LHRgNCw0LbQtdC90LjQtVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBsYXlvdXQubmFtZS5pbmNsdWRlcyhcIlxcblwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGxheW91dC5uYW1lLnNwbGl0KFwiXFxuXCIpWzBdICsgXCIuLi5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGxheW91dC5uYW1lLmxlbmd0aCA+IDQwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGxheW91dC5uYW1lLnNsaWNlKDAsIDQwKSArIFwiLi4uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbGF5b3V0Lm5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lRWxlbWVudC5pbm5lclRleHQgPSBkaXNwbGF5TmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChsYXlvdXQudHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lRWxlbWVudC5pbm5lclRleHQgPSBsYXlvdXQubmFtZSB8fCBcItCi0LXQutGB0YJcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZW1vdmVCbG9jaykge1xuICAgICAgICAgICAgICAgIHJlbW92ZUJsb2NrLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgICAgICByZW1vdmVCbG9jay5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUxheW91dChsYXlvdXQuaWQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0VkaXRpbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbmNlbEVkaXRMYXlvdXQoKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMucmVzdG9yZUljb25Gcm9tRGF0YU9yaWdpbmFsKHJlbW92ZUJsb2NrLmZpcnN0RWxlbWVudENoaWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlZGl0QmxvY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNFZGl0aW5nIHx8IGxheW91dC5pZCA9PT0gXCJzdGFydFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdEJsb2NrLnN0eWxlLmRpc3BsYXkgPSAndGFibGUnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlZGl0QmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgICAgIGVkaXRCbG9jay5vbmNsaWNrID0gKCkgPT4gdGhpcy5lZGl0TGF5b3V0KGxheW91dCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXN0b3JlSWNvbkZyb21EYXRhT3JpZ2luYWwoZ2V0TGFzdENoaWxkKGVkaXRCbG9jaykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRzTGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkLmFwcGVuZENoaWxkKGxheW91dEl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBbbGF5b3V0c10gbGF5b3V0cyBzaG93bjogJHt0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuY2hpbGRyZW4ubGVuZ3RofWApO1xuICAgIH1cbiAgICBpbml0QWRkT3JkZXJCdXR0b24oKSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgIHRoaXMuZXZlbnRzLm9uKEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgKGlzTG9hZGluZykgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24pIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNMb2FkaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24uc3R5bGUub3BhY2l0eSA9ICcwLjUnO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdub3QtYWxsb3dlZCc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQmtC90L7Qv9C60LAg0LfQsNCx0LvQvtC60LjRgNC+0LLQsNC90LAgKNC40LTQtdGCINCz0LXQvdC10YDQsNGG0LjRjyknKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24uc3R5bGUub3BhY2l0eSA9ICcxJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQmtC90L7Qv9C60LAg0YDQsNC30LHQu9C+0LrQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24ub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQWRkaW5nVG9DYXJ0KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbb3JkZXJdINCf0YDQvtGG0LXRgdGBINC00L7QsdCw0LLQu9C10L3QuNGPINGD0LbQtSDQuNC00LXRgiwg0LjQs9C90L7RgNC40YDRg9C10Lwg0L/QvtCy0YLQvtGA0L3QvtC1INC90LDQttCw0YLQuNC1Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0U3VtKCkgPT09IDApIHtcbiAgICAgICAgICAgICAgICBhbGVydCgn0JTQu9GPINC00L7QsdCw0LLQu9C10L3QuNGPINC30LDQutCw0LfQsCDQv9GA0L7QtNGD0LrRgiDQvdC1INC80L7QttC10YIg0LHRi9GC0Ywg0L/Rg9GB0YLRi9C8Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMubGF5b3V0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBhbGVydCgn0J/QvtC20LDQu9GD0LnRgdGC0LAsINC00L7QttC00LjRgtC10YHRjCDQt9Cw0LLQtdGA0YjQtdC90LjRjyDQs9C10L3QtdGA0LDRhtC40Lgg0LTQuNC30LDQudC90LAnKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tvcmRlcl0g0J/QvtC/0YvRgtC60LAg0LTQvtCx0LDQstC40YLRjCDQsiDQutC+0YDQt9C40L3RgyDQsdC10Lcg0LTQuNC30LDQudC90LAnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgYnV0dG9uVGV4dEVsZW1lbnQgPSB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uPy5xdWVyeVNlbGVjdG9yKCcudG4tYXRvbScpO1xuICAgICAgICAgICAgaWYgKCFidXR0b25UZXh0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGJ1dHRvblRleHRFbGVtZW50ID0gdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbj8ucXVlcnlTZWxlY3RvcignZGl2LCBzcGFuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvcmlnaW5hbFRleHQgPSBidXR0b25UZXh0RWxlbWVudD8udGV4dENvbnRlbnQ/LnRyaW0oKSB8fCAn0JTQvtCx0LDQstC40YLRjCDQsiDQutC+0YDQt9C40L3Rgyc7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNBZGRpbmdUb0NhcnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyh0cnVlLCAn0JTQvtCx0LDQstC70LXQvdC40LUuLi4nKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhcnRpY2xlID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKDk5OTk5OTk5IC0gOTk5OTk5ICsgMSkpICsgOTk5OTk5O1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0J3QsNGH0LDQu9C+INGB0L7Qt9C00LDQvdC40Y8g0LfQsNC60LDQt9CwJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXhwb3J0ZWRBcnQgPSBhd2FpdCB0aGlzLmV4cG9ydEFydCh0cnVlLCA1MTIpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0K3QutGB0L/QvtGA0YIg0LTQuNC30LDQudC90LAg0LfQsNCy0LXRgNGI0LXQvTonLCBPYmplY3Qua2V5cyhleHBvcnRlZEFydCkpO1xuICAgICAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhleHBvcnRlZEFydCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCfQntGI0LjQsdC60LA6INC90LUg0YPQtNCw0LvQvtGB0Ywg0Y3QutGB0L/QvtGA0YLQuNGA0L7QstCw0YLRjCDQtNC40LfQsNC50L0uINCf0L7Qv9GA0L7QsdGD0LnRgtC1INC10YnQtSDRgNCw0LcuJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tvcmRlcl0g0K3QutGB0L/QvtGA0YIg0LLQtdGA0L3Rg9C7INC/0YPRgdGC0L7QuSDRgNC10LfRg9C70YzRgtCw0YInKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBzaWRlcyA9IE9iamVjdC5rZXlzKGV4cG9ydGVkQXJ0KS5tYXAoc2lkZSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICBpbWFnZV91cmw6IGV4cG9ydGVkQXJ0W3NpZGVdIHx8ICcnLFxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCX0LDQs9GA0YPQt9C60LAg0LjQt9C+0LHRgNCw0LbQtdC90LjQuSDQvdCwINGB0LXRgNCy0LXRgC4uLicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVwbG9hZFByb21pc2VzID0gc2lkZXMubWFwKGFzeW5jIChzaWRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJhc2U2NCA9IHNpZGUuaW1hZ2VfdXJsLnNwbGl0KCcsJylbMV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVwbG9hZGVkVXJsID0gYXdhaXQgdGhpcy51cGxvYWRJbWFnZVRvU2VydmVyKGJhc2U2NCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHNpZGUsIHVwbG9hZGVkVXJsIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdXBsb2FkZWRTaWRlcyA9IGF3YWl0IFByb21pc2UuYWxsKHVwbG9hZFByb21pc2VzKTtcbiAgICAgICAgICAgICAgICB1cGxvYWRlZFNpZGVzLmZvckVhY2goKHsgc2lkZSwgdXBsb2FkZWRVcmwgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzaWRlLmltYWdlX3VybCA9IHVwbG9hZGVkVXJsO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0JjQt9C+0LHRgNCw0LbQtdC90LjRjyDQt9Cw0LPRgNGD0LbQtdC90Ysg0L3QsCDRgdC10YDQstC10YAnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0TmFtZSA9IGAke3RoaXMuY2FwaXRhbGl6ZUZpcnN0TGV0dGVyKHRoaXMuZ2V0UHJvZHVjdE5hbWUoKSl9INGBINCy0LDRiNC40LwgJHtPYmplY3Qua2V5cyhleHBvcnRlZEFydCkubGVuZ3RoID09IDEgPyAn0L7QtNC90L7RgdGC0L7RgNC+0L3QvdC40LwnIDogJ9C00LLRg9GF0YHRgtC+0YDQvtC90L3QuNC8J30g0L/RgNC40L3RgtC+0LxgO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxheW91dHMgPSB0aGlzLmxheW91dHMubWFwKGxheW91dCA9PiAoeyAuLi5sYXlvdXQsIHVybDogdW5kZWZpbmVkIH0pKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1c2VySWQgPSBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLmdldFVzZXJJZCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKFwibGF5b3V0c1wiLCBKU09OLnN0cmluZ2lmeShsYXlvdXRzKSk7XG4gICAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKFwidXNlcl9pZFwiLCB1c2VySWQpO1xuICAgICAgICAgICAgICAgIGZvcm1EYXRhLmFwcGVuZChcImFydFwiLCBhcnRpY2xlLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgIGF3YWl0IGZldGNoKHRoaXMuYXBpQ29uZmlnLndlYmhvb2tDYXJ0LCB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IGZvcm1EYXRhXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY3JlYXRlUHJvZHVjdCh7XG4gICAgICAgICAgICAgICAgICAgIHF1YW50aXR5OiB0aGlzLmdldFF1YW50aXR5KCksXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHByb2R1Y3ROYW1lLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiB0aGlzLl9zZWxlY3RTaXplLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IsXG4gICAgICAgICAgICAgICAgICAgIHNpZGVzLFxuICAgICAgICAgICAgICAgICAgICBhcnRpY2xlLFxuICAgICAgICAgICAgICAgICAgICBwcmljZTogdGhpcy5nZXRTdW0oKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQWRkZWRUb0NhcnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0JfQsNC60LDQtyDRg9GB0L/QtdGI0L3QviDRgdC+0LfQtNCw0L0nKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEFkZFRvQ2FydEJ1dHRvbkxvYWRpbmcoZmFsc2UsICfinJMg0JTQvtCx0LDQstC70LXQvdC+IScpO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEFkZFRvQ2FydEJ1dHRvbkxvYWRpbmcoZmFsc2UsIG9yaWdpbmFsVGV4dCk7XG4gICAgICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbb3JkZXJdINCe0YjQuNCx0LrQsCDRgdC+0LfQtNCw0L3QuNGPINC30LDQutCw0LfQsDonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgYWxlcnQoJ9Ce0YjQuNCx0LrQsCDQv9GA0Lgg0YHQvtC30LTQsNC90LjQuCDQt9Cw0LrQsNC30LAnKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEFkZFRvQ2FydEJ1dHRvbkxvYWRpbmcoZmFsc2UsIG9yaWdpbmFsVGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pc0FkZGluZ1RvQ2FydCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCk0LvQsNCzIGlzQWRkaW5nVG9DYXJ0INGB0LHRgNC+0YjQtdC9Jyk7XG4gICAgICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIHNldEFkZFRvQ2FydEJ1dHRvbkxvYWRpbmcoaXNMb2FkaW5nLCB0ZXh0KSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5pbmplY3RQdWxzZUFuaW1hdGlvbigpO1xuICAgICAgICBjb25zdCBidXR0b24gPSB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uO1xuICAgICAgICBsZXQgYnV0dG9uVGV4dEVsZW1lbnQgPSBidXR0b24ucXVlcnlTZWxlY3RvcignLnRuLWF0b20nKTtcbiAgICAgICAgaWYgKCFidXR0b25UZXh0RWxlbWVudCkge1xuICAgICAgICAgICAgYnV0dG9uVGV4dEVsZW1lbnQgPSBidXR0b24ucXVlcnlTZWxlY3RvcignZGl2LCBzcGFuJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dFRhcmdldCA9IGJ1dHRvblRleHRFbGVtZW50IHx8IGJ1dHRvbjtcbiAgICAgICAgaWYgKGlzTG9hZGluZykge1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMC43JztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAnbm90LWFsbG93ZWQnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgICAgIHRleHRUYXJnZXQudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmFuaW1hdGlvbiA9ICdjYXJ0QnV0dG9uUHVsc2UgMS41cyBlYXNlLWluLW91dCBpbmZpbml0ZSc7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdIFthbmltYXRpb25dINCa0L3QvtC/0LrQsCDQt9Cw0LHQu9C+0LrQuNGA0L7QstCw0L3QsDonLCB0ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmFuaW1hdGlvbiA9ICdub25lJztcbiAgICAgICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgdGV4dFRhcmdldC50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdIFthbmltYXRpb25dINCa0L3QvtC/0LrQsCDRgNCw0LfQsdC70L7QutC40YDQvtCy0LDQvdCwOicsIHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGluamVjdFB1bHNlQW5pbWF0aW9uKCkge1xuICAgICAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhcnQtYnV0dG9uLXB1bHNlLWFuaW1hdGlvbicpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgICAgICBzdHlsZS5pZCA9ICdjYXJ0LWJ1dHRvbi1wdWxzZS1hbmltYXRpb24nO1xuICAgICAgICBzdHlsZS50ZXh0Q29udGVudCA9IGBcbiAgICAgICAgICAgIEBrZXlmcmFtZXMgY2FydEJ1dHRvblB1bHNlIHtcbiAgICAgICAgICAgICAgICAwJSwgMTAwJSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMSk7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDAuNztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgNTAlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBzY2FsZSgxLjAyKTtcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMC44NTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIGA7XG4gICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbYW5pbWF0aW9uXSBDU1Mg0LDQvdC40LzQsNGG0LjRjyDQv9GD0LvRjNGB0LDRhtC40Lgg0LTQvtCx0LDQstC70LXQvdCwJyk7XG4gICAgfVxuICAgIHNldEdlbmVyYXRlQnV0dG9uTG9hZGluZyhpc0xvYWRpbmcsIHRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmZvcm1CdXR0b24pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuaW5qZWN0UHVsc2VBbmltYXRpb24oKTtcbiAgICAgICAgY29uc3QgYnV0dG9uID0gdGhpcy5mb3JtQnV0dG9uO1xuICAgICAgICBsZXQgYnV0dG9uVGV4dEVsZW1lbnQgPSBidXR0b24ucXVlcnlTZWxlY3RvcignLnRuLWF0b20nKTtcbiAgICAgICAgaWYgKCFidXR0b25UZXh0RWxlbWVudCkge1xuICAgICAgICAgICAgYnV0dG9uVGV4dEVsZW1lbnQgPSBidXR0b24ucXVlcnlTZWxlY3RvcignZGl2LCBzcGFuJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dFRhcmdldCA9IGJ1dHRvblRleHRFbGVtZW50IHx8IGJ1dHRvbjtcbiAgICAgICAgaWYgKGlzTG9hZGluZykge1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMC43JztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAnbm90LWFsbG93ZWQnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgICAgIHRleHRUYXJnZXQudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmFuaW1hdGlvbiA9ICdjYXJ0QnV0dG9uUHVsc2UgMS41cyBlYXNlLWluLW91dCBpbmZpbml0ZSc7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZ2VuZXJhdGVdIFthbmltYXRpb25dINCa0L3QvtC/0LrQsCDQt9Cw0LHQu9C+0LrQuNGA0L7QstCw0L3QsDonLCB0ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmFuaW1hdGlvbiA9ICdub25lJztcbiAgICAgICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgdGV4dFRhcmdldC50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZ2VuZXJhdGVdIFthbmltYXRpb25dINCa0L3QvtC/0LrQsCDRgNCw0LfQsdC70L7QutC40YDQvtCy0LDQvdCwOicsIHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldENvbnRyb2xzRGlzYWJsZWQoZGlzYWJsZWQpIHtcbiAgICAgICAgY29uc3Qgb3BhY2l0eSA9IGRpc2FibGVkID8gJzAuNScgOiAnMSc7XG4gICAgICAgIGNvbnN0IHBvaW50ZXJFdmVudHMgPSBkaXNhYmxlZCA/ICdub25lJyA6ICdhdXRvJztcbiAgICAgICAgY29uc3QgY3Vyc29yID0gZGlzYWJsZWQgPyAnbm90LWFsbG93ZWQnIDogJ3BvaW50ZXInO1xuICAgICAgICBpZiAodGhpcy5jaGFuZ2VTaWRlQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmNoYW5nZVNpZGVCdXR0b24uc3R5bGUub3BhY2l0eSA9IG9wYWNpdHk7XG4gICAgICAgICAgICB0aGlzLmNoYW5nZVNpZGVCdXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9IHBvaW50ZXJFdmVudHM7XG4gICAgICAgICAgICB0aGlzLmNoYW5nZVNpZGVCdXR0b24uc3R5bGUuY3Vyc29yID0gY3Vyc29yO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29sb3JCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBibG9jay5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHBhcmVudC5zdHlsZS5vcGFjaXR5ID0gb3BhY2l0eTtcbiAgICAgICAgICAgICAgICBwYXJlbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9IHBvaW50ZXJFdmVudHM7XG4gICAgICAgICAgICAgICAgcGFyZW50LnN0eWxlLmN1cnNvciA9IGN1cnNvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMucHJvZHVjdEJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IGJsb2NrLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcGFyZW50LnN0eWxlLm9wYWNpdHkgPSBvcGFjaXR5O1xuICAgICAgICAgICAgICAgIHBhcmVudC5zdHlsZS5wb2ludGVyRXZlbnRzID0gcG9pbnRlckV2ZW50cztcbiAgICAgICAgICAgICAgICBwYXJlbnQuc3R5bGUuY3Vyc29yID0gY3Vyc29yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2NvbnRyb2xzXSDQrdC70LXQvNC10L3RgtGLINGD0L/RgNCw0LLQu9C10L3QuNGPICR7ZGlzYWJsZWQgPyAn0LfQsNCx0LvQvtC60LjRgNC+0LLQsNC90YsnIDogJ9GA0LDQt9Cx0LvQvtC60LjRgNC+0LLQsNC90YsnfWApO1xuICAgIH1cbiAgICBpbml0VXBsb2FkSW1hZ2VCdXR0b24oKSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5yZXNldFVzZXJVcGxvYWRJbWFnZSgpO1xuICAgICAgICB0aGlzLmVkaXRvclVwbG9hZEltYWdlQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBsb2FkVXNlckltYWdlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpbml0Rml4UXVhbnRpdHlGb3JtKCkge1xuICAgICAgICBpZiAoIXRoaXMucXVhbnRpdHlGb3JtQmxvY2spXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGZvcm0gPSB0aGlzLnF1YW50aXR5Rm9ybUJsb2NrLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcbiAgICAgICAgY29uc3QgaW5wdXQgPSBmb3JtPy5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwicXVhbnRpdHlcIl0nKTtcbiAgICAgICAgaWYgKCFpbnB1dClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgdmFsaWRhdGVRdWFudGl0eSA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gaW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnJyB8fCBpc05hTihOdW1iZXIodmFsdWUpKSkge1xuICAgICAgICAgICAgICAgIGlucHV0LnZhbHVlID0gJzEnO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHF1YW50aXR5ID0gcGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICAgIGlmIChxdWFudGl0eSA8IDEgfHwgcXVhbnRpdHkgPT09IDApIHtcbiAgICAgICAgICAgICAgICBpbnB1dC52YWx1ZSA9ICcxJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCB2YWxpZGF0ZVF1YW50aXR5KTtcbiAgICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHZhbGlkYXRlUXVhbnRpdHkpO1xuICAgICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB2YWxpZGF0ZVF1YW50aXR5KTtcbiAgICAgICAgdmFsaWRhdGVRdWFudGl0eSgpO1xuICAgIH1cbiAgICBhc3luYyBpbml0Rm9ybSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmZvcm1CbG9jayB8fCAhdGhpcy5mb3JtQnV0dG9uIHx8ICF0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZm9ybUJsb2NrID0gdGhpcy5mb3JtQmxvY2s7XG4gICAgICAgIGNvbnN0IGZvcm1JbnB1dFZhcmlhYmxlTmFtZSA9IHRoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lO1xuICAgICAgICBjb25zdCBmb3JtQnV0dG9uID0gdGhpcy5mb3JtQnV0dG9uO1xuICAgICAgICBjb25zdCBoYW5kbGVDbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYnV0dG9uXSBjbGlja2VkJyk7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0dlbmVyYXRpbmcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSDQk9C10L3QtdGA0LDRhtC40Y8g0YPQttC1INC40LTQtdGCLCDQuNCz0L3QvtGA0LjRgNGD0LXQvCDQv9C+0LLRgtC+0YDQvdC+0LUg0L3QsNC20LDRgtC40LUnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBmb3JtSW5wdXQgPSBmb3JtQmxvY2sucXVlcnlTZWxlY3RvcihgW25hbWU9XCIke2Zvcm1JbnB1dFZhcmlhYmxlTmFtZX1cIl1gKTtcbiAgICAgICAgICAgIGNvbnN0IHByb21wdCA9IGZvcm1JbnB1dC52YWx1ZTtcbiAgICAgICAgICAgIGlmICghdGhpcy5sb2FkZWRVc2VySW1hZ2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXByb21wdCB8fCBwcm9tcHQudHJpbSgpID09PSBcIlwiIHx8IHByb21wdC5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFtpbnB1dF0gcHJvbXB0IGlzIGVtcHR5IG9yIHRvbyBzaG9ydCcpO1xuICAgICAgICAgICAgICAgICAgICBhbGVydChcItCc0LjQvdC40LzQsNC70YzQvdCw0Y8g0LTQu9C40L3QsCDQt9Cw0L/RgNC+0YHQsCAxINGB0LjQvNCy0L7Qu1wiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbaW5wdXRdIHByb21wdDogJHtwcm9tcHR9YCk7XG4gICAgICAgICAgICB0aGlzLmlzR2VuZXJhdGluZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNldEdlbmVyYXRlQnV0dG9uTG9hZGluZyh0cnVlLCAn0JPQtdC90LXRgNCw0YbQuNGPLi4uJyk7XG4gICAgICAgICAgICB0aGlzLnNldENvbnRyb2xzRGlzYWJsZWQodHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCB0cnVlKTtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dElkID0gdGhpcy5fc2VsZWN0TGF5b3V0IHx8IExheW91dC5nZW5lcmF0ZUlkKCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHVybCA9IGF3YWl0IGdlbmVyYXRlSW1hZ2Uoe1xuICAgICAgICAgICAgICAgICAgICB1cmk6IHRoaXMuYXBpQ29uZmlnLndlYmhvb2tSZXF1ZXN0LFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQsXG4gICAgICAgICAgICAgICAgICAgIHNoaXJ0Q29sb3I6IHRoaXMuX3NlbGVjdENvbG9yLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGltYWdlOiB0aGlzLl9zZWxlY3RMYXlvdXQgPyB0aGlzLmxvYWRlZFVzZXJJbWFnZSAhPT0gdGhpcy5sYXlvdXRzLmZpbmQobGF5b3V0ID0+IGxheW91dC5pZCA9PT0gdGhpcy5fc2VsZWN0TGF5b3V0KT8udXJsID8gdGhpcy5sb2FkZWRVc2VySW1hZ2UgOiBudWxsIDogdGhpcy5sb2FkZWRVc2VySW1hZ2UsXG4gICAgICAgICAgICAgICAgICAgIHdpdGhBaTogdGhpcy5lZGl0b3JMb2FkV2l0aEFpLFxuICAgICAgICAgICAgICAgICAgICBsYXlvdXRJZCxcbiAgICAgICAgICAgICAgICAgICAgaXNOZXc6IHRoaXMuX3NlbGVjdExheW91dCA/IGZhbHNlIDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogIXRoaXMuZWRpdG9yUmVtb3ZlQmFja2dyb3VuZCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cueW0oMTAzMjc5MjE0LCAncmVhY2hHb2FsJywgJ2dlbmVyYXRlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHsgfVxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbWFnZURhdGEgPSBhd2FpdCB0aGlzLmdldEltYWdlRGF0YSh1cmwpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbaW5wdXRdIGltYWdlIGRhdGEgcmVjZWl2ZWRgKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc2VsZWN0TGF5b3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0cy5maW5kKGxheW91dCA9PiBsYXlvdXQuaWQgPT09IGxheW91dElkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxheW91dCAmJiBsYXlvdXQuaXNJbWFnZUxheW91dCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW2lucHV0XSB1cGRhdGluZyBsYXlvdXQ6ICR7bGF5b3V0LmlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGF5b3V0Lm5hbWUgPSBwcm9tcHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXlvdXQudXJsID0gaW1hZ2VEYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtpbnB1dF0gbGF5b3V0IHVwZGF0ZWRgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRMYXlvdXQoTGF5b3V0LmNyZWF0ZUltYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBsYXlvdXRJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXc6IHRoaXMuX3NlbGVjdFNpZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGltYWdlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHByb21wdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQuc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YzZjNmMyc7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0TGF5b3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQudmFsdWUgPSBcIlwiO1xuICAgICAgICAgICAgICAgIHRoaXMuY2FuY2VsRWRpdExheW91dCgpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVzZXRVc2VyVXBsb2FkSW1hZ2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRHZW5lcmF0ZUJ1dHRvbkxvYWRpbmcoZmFsc2UsICfinJMg0JPQvtGC0L7QstC+IScpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0Q29udHJvbHNEaXNhYmxlZChmYWxzZSk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0R2VuZXJhdGVCdXR0b25Mb2FkaW5nKGZhbHNlLCAn0KHQs9C10L3QtdGA0LjRgNC+0LLQsNGC0YwnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pc0dlbmVyYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dINCk0LvQsNCzIGlzR2VuZXJhdGluZyDRgdCx0YDQvtGI0LXQvScpO1xuICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lk9wZW5SZXBsYXkuaXNzdWUoXCJnZW5lcmF0ZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmk6IHRoaXMuYXBpQ29uZmlnLndlYmhvb2tSZXF1ZXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbXB0LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2hpcnRDb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlOiB0aGlzLl9zZWxlY3RMYXlvdXQgPyB0aGlzLmxvYWRlZFVzZXJJbWFnZSAhPT0gdGhpcy5sYXlvdXRzLmZpbmQobGF5b3V0ID0+IGxheW91dC5pZCA9PT0gdGhpcy5fc2VsZWN0TGF5b3V0KT8udXJsID8gdGhpcy5sb2FkZWRVc2VySW1hZ2UgOiBudWxsIDogdGhpcy5sb2FkZWRVc2VySW1hZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB3aXRoQWk6IHRoaXMuZWRpdG9yTG9hZFdpdGhBaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheW91dElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNOZXc6IHRoaXMuX3NlbGVjdExheW91dCA/IGZhbHNlIDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICF0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmQsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcign0J7RiNC40LHQutCwINGD0YHRgtCw0L3QvtCy0LrQuCBJRCDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8g0LIgdHJhY2tlcjonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbZm9ybV0gW2lucHV0XSBlcnJvcicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBhbGVydChcItCe0YjQuNCx0LrQsCDQv9GA0Lgg0LPQtdC90LXRgNCw0YbQuNC4INC40LfQvtCx0YDQsNC20LXQvdC40Y9cIik7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRHZW5lcmF0ZUJ1dHRvbkxvYWRpbmcoZmFsc2UsICfQodCz0LXQvdC10YDQuNGA0L7QstCw0YLRjCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0Q29udHJvbHNEaXNhYmxlZChmYWxzZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0dlbmVyYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb2FkZWRVc2VySW1hZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNldFVzZXJVcGxvYWRJbWFnZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc2VsZWN0TGF5b3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdExheW91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FuY2VsRWRpdExheW91dCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgZm9ybSA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtID0gZm9ybUJsb2NrLnF1ZXJ5U2VsZWN0b3IoXCJmb3JtXCIpO1xuICAgICAgICAgICAgICAgIGlmIChmb3JtKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGZvcm0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgfSwgMTAwMCAqIDEwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghZm9ybSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gZm9ybSBub3QgZm91bmQnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBmb3JtLmFjdGlvbiA9IFwiXCI7XG4gICAgICAgIGZvcm0ubWV0aG9kID0gXCJHRVRcIjtcbiAgICAgICAgZm9ybS5vbnN1Ym1pdCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGhhbmRsZUNsaWNrKCk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGZpeElucHV0QmxvY2sgPSBmb3JtLnF1ZXJ5U2VsZWN0b3IoYHRleHRhcmVhW25hbWU9JyR7Zm9ybUlucHV0VmFyaWFibGVOYW1lfSddYCk7XG4gICAgICAgIGlmIChmaXhJbnB1dEJsb2NrKSB7XG4gICAgICAgICAgICBmaXhJbnB1dEJsb2NrLnN0eWxlLnBhZGRpbmcgPSBcIjhweFwiO1xuICAgICAgICB9XG4gICAgICAgIGZvcm1CdXR0b24ub25jbGljayA9IGhhbmRsZUNsaWNrO1xuICAgICAgICBmb3JtQnV0dG9uLnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0g0JjQvdC40YbQuNCw0LvQuNC30LDRhtC40Y8g0YTQvtGA0LzRiyDQt9Cw0LLQtdGA0YjQtdC90LAnKTtcbiAgICB9XG4gICAgcmVzdG9yZUljb25Gcm9tRGF0YU9yaWdpbmFsKGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKCFlbGVtZW50KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBkYXRhT3JpZ2luYWwgPSBlbGVtZW50LmF0dHJpYnV0ZXMuZ2V0TmFtZWRJdGVtKFwiZGF0YS1vcmlnaW5hbFwiKT8udmFsdWU7XG4gICAgICAgIGlmIChkYXRhT3JpZ2luYWwpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gYHVybChcIiR7ZGF0YU9yaWdpbmFsfVwiKWA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2hhbmdlUHJvZHVjdChwcm9kdWN0VHlwZSkge1xuICAgICAgICBpZiAodGhpcy5pc0dlbmVyYXRpbmcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2NoYW5nZVByb2R1Y3RdINCT0LXQvdC10YDQsNGG0LjRjyDQsiDQv9GA0L7RhtC10YHRgdC1LCDQv9C10YDQtdC60LvRjtGH0LXQvdC40LUg0LfQsNCx0LvQvtC60LjRgNC+0LLQsNC90L4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zZWxlY3RUeXBlID0gcHJvZHVjdFR5cGU7XG4gICAgICAgIHRoaXMuY2xlYXJNb2NrdXBDYWNoZSgpO1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHByb2R1Y3RUeXBlKTtcbiAgICAgICAgaWYgKHByb2R1Y3QpIHtcbiAgICAgICAgICAgIGNvbnN0IG1vY2t1cFdpdGhDdXJyZW50Q29sb3IgPSBwcm9kdWN0Lm1vY2t1cHMuZmluZChtID0+IG0uc2lkZSA9PT0gdGhpcy5fc2VsZWN0U2lkZSAmJiBtLmNvbG9yLm5hbWUgPT09IHRoaXMuX3NlbGVjdENvbG9yLm5hbWUpO1xuICAgICAgICAgICAgaWYgKCFtb2NrdXBXaXRoQ3VycmVudENvbG9yKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlyc3RNb2NrdXAgPSBwcm9kdWN0Lm1vY2t1cHMuZmluZChtID0+IG0uc2lkZSA9PT0gdGhpcy5fc2VsZWN0U2lkZSk7XG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0TW9ja3VwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gZmlyc3RNb2NrdXAuY29sb3I7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtwcm9kdWN0XSDQptCy0LXRgiDQuNC30LzQtdC90LXQvSDQvdCwICR7dGhpcy5fc2VsZWN0Q29sb3IubmFtZX0g0LTQu9GPINC/0YDQvtC00YPQutGC0LAgJHtwcm9kdWN0VHlwZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVQcm9kdWN0QmxvY2tzVUkoKTtcbiAgICAgICAgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgdGhpcy5sb2FkUHJvZHVjdCgpO1xuICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgIH1cbiAgICB1cGRhdGVQcm9kdWN0QmxvY2tzVUkoKSB7XG4gICAgICAgIGlmICh0aGlzLnByb2R1Y3RCbG9ja3MubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnByb2R1Y3RCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICBibG9jay5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYigyMjIgMjIyIDIyMiknO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLnByb2R1Y3RCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fcHJvZHVjdC1ibG9ja19fJyArIHRoaXMuX3NlbGVjdFR5cGUpKTtcbiAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICBhY3RpdmVCbG9jay5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2hhbmdlU2lkZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNHZW5lcmF0aW5nKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tjaGFuZ2VTaWRlXSDQk9C10L3QtdGA0LDRhtC40Y8g0LIg0L/RgNC+0YbQtdGB0YHQtSwg0L/QtdGA0LXQutC70Y7Rh9C10L3QuNC1INC30LDQsdC70L7QutC40YDQvtCy0LDQvdC+Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmV3U2lkZSA9IHRoaXMuX3NlbGVjdFNpZGUgPT09ICdmcm9udCcgPyAnYmFjaycgOiAnZnJvbnQnO1xuICAgICAgICB0aGlzLnNldEFjdGl2ZVNpZGUobmV3U2lkZSk7XG4gICAgICAgIHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuU1RBVEVfQ0hBTkdFRCwgdW5kZWZpbmVkKTtcbiAgICB9XG4gICAgY2hhbmdlQ29sb3IoY29sb3JOYW1lKSB7XG4gICAgICAgIGlmICh0aGlzLmlzR2VuZXJhdGluZykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbY2hhbmdlQ29sb3JdINCT0LXQvdC10YDQsNGG0LjRjyDQsiDQv9GA0L7RhtC10YHRgdC1LCDQv9C10YDQtdC60LvRjtGH0LXQvdC40LUg0LfQsNCx0LvQvtC60LjRgNC+0LLQsNC90L4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IG1vY2t1cCA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG0gPT4gbS5jb2xvci5uYW1lID09PSBjb2xvck5hbWUpO1xuICAgICAgICBpZiAoIW1vY2t1cClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5fc2VsZWN0Q29sb3IgPSBtb2NrdXAuY29sb3I7XG4gICAgICAgIHRoaXMuY2xlYXJNb2NrdXBDYWNoZSgpO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbG9yQmxvY2tzVUkoY29sb3JOYW1lKTtcbiAgICAgICAgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICB9XG4gICAgdXBkYXRlQ29sb3JCbG9ja3NVSShjb2xvck5hbWUpIHtcbiAgICAgICAgaWYgKHRoaXMuY29sb3JCbG9ja3MubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmNvbG9yQmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgYmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YzZjNmMyc7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBhY3RpdmVCbG9jayA9IHRoaXMuY29sb3JCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fY29sb3ItYmxvY2tfXycgKyBjb2xvck5hbWUpKTtcbiAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICBhY3RpdmVCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcnO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNoYW5nZVNpemUoc2l6ZSkge1xuICAgICAgICB0aGlzLnVwZGF0ZVNpemVCbG9ja3NVSShzaXplKTtcbiAgICAgICAgdGhpcy5fc2VsZWN0U2l6ZSA9IHNpemU7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgfVxuICAgIHVwZGF0ZVNpemVCbG9ja3NVSShzaXplKSB7XG4gICAgICAgIGlmICh0aGlzLnNpemVCbG9ja3MubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnNpemVCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICBjb25zdCBib3JkZXJCbG9jayA9IGJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgaWYgKGJvcmRlckJsb2NrKSB7XG4gICAgICAgICAgICAgICAgYm9yZGVyQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YzZjNmMyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBhY3RpdmVCbG9jayA9IHRoaXMuc2l6ZUJsb2Nrcy5maW5kKGJsb2NrID0+IGJsb2NrLmNsYXNzTGlzdC5jb250YWlucygnZWRpdG9yLXNldHRpbmdzX19zaXplLWJsb2NrX18nICsgc2l6ZSkpO1xuICAgICAgICBpZiAoYWN0aXZlQmxvY2spIHtcbiAgICAgICAgICAgIGNvbnN0IGJvcmRlckJsb2NrID0gYWN0aXZlQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBpZiAoYm9yZGVyQmxvY2spIHtcbiAgICAgICAgICAgICAgICBib3JkZXJCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGVkaXRMYXlvdXQobGF5b3V0KSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gW2xheW91dHNdIGVkaXQgbGF5b3V0ICR7bGF5b3V0LmlkfWApO1xuICAgICAgICB0aGlzLl9zZWxlY3RMYXlvdXQgPSBsYXlvdXQuaWQ7XG4gICAgICAgIGlmICh0aGlzLmZvcm1CbG9jayAmJiB0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSkge1xuICAgICAgICAgICAgY29uc3QgZm9ybUlucHV0ID0gdGhpcy5mb3JtQmxvY2sucXVlcnlTZWxlY3RvcihgW25hbWU9XCIke3RoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lfVwiXWApO1xuICAgICAgICAgICAgaWYgKGZvcm1JbnB1dCkge1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC52YWx1ZSA9IGxheW91dC5uYW1lIHx8ICcnO1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC5zdHlsZS5ib3JkZXJDb2xvciA9ICdyZ2IoMjU0LCA5NCwgNTgpJztcbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSDQo9GB0YLQsNC90L7QstC70LXQvdC+INC30L3QsNGH0LXQvdC40LUg0LIg0YTQvtGA0LzRgzogXCIke2xheW91dC5uYW1lfVwiYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtzZXR0aW5nc10gW2xheW91dHNdINCd0LUg0L3QsNC50LTQtdC9INGN0LvQtdC80LXQvdGCINGE0L7RgNC80Ysg0YEg0LjQvNC10L3QtdC8IFwiJHt0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZX1cImApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChsYXlvdXQuaXNJbWFnZUxheW91dCgpKSB7XG4gICAgICAgICAgICB0aGlzLmxvYWRlZFVzZXJJbWFnZSA9IGxheW91dC51cmw7XG4gICAgICAgICAgICB0aGlzLnNldFVzZXJVcGxvYWRJbWFnZShsYXlvdXQudXJsKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdEFpQnV0dG9ucygpO1xuICAgICAgICAgICAgdGhpcy5oaWRlQWlCdXR0b25zKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxvYWRlZFVzZXJJbWFnZSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnJlc2V0VXNlclVwbG9hZEltYWdlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgIH1cbiAgICBjYW5jZWxFZGl0TGF5b3V0KCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSBjYW5jZWwgZWRpdCBsYXlvdXRgKTtcbiAgICAgICAgdGhpcy5fc2VsZWN0TGF5b3V0ID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuZm9ybUJsb2NrICYmIHRoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lKSB7XG4gICAgICAgICAgICBjb25zdCBmb3JtSW5wdXQgPSB0aGlzLmZvcm1CbG9jay5xdWVyeVNlbGVjdG9yKGBbbmFtZT1cIiR7dGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWV9XCJdYCk7XG4gICAgICAgICAgICBpZiAoZm9ybUlucHV0KSB7XG4gICAgICAgICAgICAgICAgZm9ybUlucHV0LnZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgZm9ybUlucHV0LnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubG9hZGVkVXNlckltYWdlID0gbnVsbDtcbiAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aEFpID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBbbGF5b3V0c10g0KDQtdC00LDQutGC0LjRgNC+0LLQsNC90LjQtSDQvtGC0LzQtdC90LXQvdC+YCk7XG4gICAgfVxuICAgIGluaXRBaUJ1dHRvbnMoKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jaGFuZ2VMb2FkV2l0aEFpKCk7XG4gICAgICAgIHRoaXMuY2hhbmdlUmVtb3ZlQmFja2dyb3VuZCgpO1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VMb2FkV2l0aEFpKHRydWUpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VMb2FkV2l0aEFpKGZhbHNlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yUmVtb3ZlQmFja2dyb3VuZEJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yUmVtb3ZlQmFja2dyb3VuZEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlUmVtb3ZlQmFja2dyb3VuZCghdGhpcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgaGlkZUFpQnV0dG9ucygpIHtcbiAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aEFpID0gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbikge1xuICAgICAgICAgICAgKHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbi5wYXJlbnRFbGVtZW50Py5wYXJlbnRFbGVtZW50Py5wYXJlbnRFbGVtZW50KS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNob3dBaUJ1dHRvbnMoKSB7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24pIHtcbiAgICAgICAgICAgICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24ucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudCkuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGxvYWRVc2VySW1hZ2UoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWQgdXNlciBpbWFnZV0gc3RhcnRpbmcgdXNlciBpbWFnZSB1cGxvYWQnKTtcbiAgICAgICAgdGhpcy5zaG93QWlCdXR0b25zKCk7XG4gICAgICAgIGNvbnN0IGZpbGVJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgIGZpbGVJbnB1dC50eXBlID0gJ2ZpbGUnO1xuICAgICAgICBmaWxlSW5wdXQuYWNjZXB0ID0gJ2ltYWdlLyonO1xuICAgICAgICBmaWxlSW5wdXQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgZmlsZUlucHV0Lm9uY2hhbmdlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG4gICAgICAgICAgICBjb25zdCBmaWxlID0gdGFyZ2V0LmZpbGVzPy5bMF07XG4gICAgICAgICAgICBpZiAoZmlsZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWQgdXNlciBpbWFnZV0gZmlsZSBzZWxlY3RlZDonLCBmaWxlLm5hbWUpO1xuICAgICAgICAgICAgICAgIGlmICghZmlsZS50eXBlLnN0YXJ0c1dpdGgoJ2ltYWdlLycpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW3VwbG9hZCB1c2VyIGltYWdlXSBzZWxlY3RlZCBmaWxlIGlzIG5vdCBhbiBpbWFnZScpO1xuICAgICAgICAgICAgICAgICAgICBhbGVydCgn0J/QvtC20LDQu9GD0LnRgdGC0LAsINCy0YvQsdC10YDQuNGC0LUg0YTQsNC50Lsg0LjQt9C+0LHRgNCw0LbQtdC90LjRjycpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGFzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlVXJsID0gZS50YXJnZXQ/LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZCB1c2VyIGltYWdlXSBmaWxlIGxvYWRlZCBhcyBkYXRhIFVSTCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbWFnZURhdGEgPSBhd2FpdCB0aGlzLmdldEltYWdlRGF0YShpbWFnZVVybCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0VXNlclVwbG9hZEltYWdlKGltYWdlRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWQgdXNlciBpbWFnZV0gaW1hZ2UgbGF5b3V0IGFkZGVkIHN1Y2Nlc3NmdWxseScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1t1cGxvYWQgdXNlciBpbWFnZV0gZXJyb3IgcmVhZGluZyBmaWxlJyk7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCfQntGI0LjQsdC60LAg0L/RgNC4INC30LDQs9GA0YPQt9C60LUg0YTQsNC50LvQsCcpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZmlsZUlucHV0KTtcbiAgICAgICAgZmlsZUlucHV0LmNsaWNrKCk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZmlsZUlucHV0KTtcbiAgICB9XG4gICAgc2V0VXNlclVwbG9hZEltYWdlKGltYWdlKSB7XG4gICAgICAgIHRoaXMubG9hZGVkVXNlckltYWdlID0gaW1hZ2U7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvclVwbG9hZFZpZXdCbG9jaykge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2suc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICBjb25zdCBpbWFnZUJsb2NrID0gZ2V0TGFzdENoaWxkKHRoaXMuZWRpdG9yVXBsb2FkVmlld0Jsb2NrKTtcbiAgICAgICAgICAgIGlmIChpbWFnZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VCbG9jay5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBgdXJsKCR7aW1hZ2V9KWA7XG4gICAgICAgICAgICAgICAgaW1hZ2VCbG9jay5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9ICdjb250YWluJztcbiAgICAgICAgICAgICAgICBpbWFnZUJsb2NrLnN0eWxlLmJhY2tncm91bmRQb3NpdGlvbiA9ICdjZW50ZXInO1xuICAgICAgICAgICAgICAgIGltYWdlQmxvY2suc3R5bGUuYmFja2dyb3VuZFJlcGVhdCA9ICduby1yZXBlYXQnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJlc2V0VXNlclVwbG9hZEltYWdlKCkge1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkVmlld0Jsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBudWxsO1xuICAgICAgICB0aGlzLmNhbmNlbEVkaXRMYXlvdXQoKTtcbiAgICB9XG4gICAgY2hhbmdlTG9hZFdpdGhBaSh2YWx1ZSA9IGZhbHNlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFthaSBidXR0b25zXSBjaGFuZ2VMb2FkV2l0aEFpINCy0YvQt9Cy0LDQvSwgdmFsdWU9JHt2YWx1ZX1gKTtcbiAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aEFpID0gdmFsdWU7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24gJiYgdGhpcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uKSB7XG4gICAgICAgICAgICBjb25zdCBidXR0b25XaXRoQWkgPSB0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b247XG4gICAgICAgICAgICBjb25zdCBidXR0b25XaXRob3V0QWkgPSB0aGlzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b247XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaXhCdXR0b25XaXRoQWkgPSBidXR0b25XaXRoQWkuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICAgICAgY29uc3QgZml4QnV0dG9uV2l0aG91dEFpID0gYnV0dG9uV2l0aG91dEFpLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgIGlmIChmaXhCdXR0b25XaXRoQWkpIHtcbiAgICAgICAgICAgICAgICAgICAgZml4QnV0dG9uV2l0aEFpLnN0eWxlLmJvcmRlckNvbG9yID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFthaSBidXR0b25zXSDQoSDQmNCYOiDRgdCx0YDQvtGI0LXQvSBib3JkZXJDb2xvciAo0L7RgNCw0L3QttC10LLRi9C5KWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZml4QnV0dG9uV2l0aG91dEFpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpeEJ1dHRvbldpdGhvdXRBaS5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjJmMmYyJztcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2FpIGJ1dHRvbnNdINCR0LXQtyDQmNCYOiDRg9GB0YLQsNC90L7QstC70LXQvSBib3JkZXJDb2xvcj0jZjJmMmYyICjRgdC10YDRi9C5KWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpeEJ1dHRvbldpdGhBaSA9IGJ1dHRvbldpdGhBaS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgICAgICBjb25zdCBmaXhCdXR0b25XaXRob3V0QWkgPSBidXR0b25XaXRob3V0QWkuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICAgICAgaWYgKGZpeEJ1dHRvbldpdGhBaSkge1xuICAgICAgICAgICAgICAgICAgICBmaXhCdXR0b25XaXRoQWkuc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YyZjJmMic7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFthaSBidXR0b25zXSDQoSDQmNCYOiDRg9GB0YLQsNC90L7QstC70LXQvSBib3JkZXJDb2xvcj0jZjJmMmYyICjRgdC10YDRi9C5KWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZml4QnV0dG9uV2l0aG91dEFpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpeEJ1dHRvbldpdGhvdXRBaS5zdHlsZS5ib3JkZXJDb2xvciA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbYWkgYnV0dG9uc10g0JHQtdC3INCY0Jg6INGB0LHRgNC+0YjQtdC9IGJvcmRlckNvbG9yICjQvtGA0LDQvdC20LXQstGL0LkpYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlUmVtb3ZlQmFja2dyb3VuZFZpc2liaWxpdHkoKTtcbiAgICB9XG4gICAgY2hhbmdlUmVtb3ZlQmFja2dyb3VuZCh2YWx1ZSA9IGZhbHNlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtyZW1vdmUgYmcgYnV0dG9uXSBjaGFuZ2VSZW1vdmVCYWNrZ3JvdW5kINCy0YvQt9Cy0LDQvSwgdmFsdWU9JHt2YWx1ZX1gKTtcbiAgICAgICAgdGhpcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kID0gdmFsdWU7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvclJlbW92ZUJhY2tncm91bmRCdXR0b24pIHtcbiAgICAgICAgICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuZWRpdG9yUmVtb3ZlQmFja2dyb3VuZEJ1dHRvbjtcbiAgICAgICAgICAgIGNvbnN0IGZpeEJ1dHRvbiA9IGJ1dHRvbi5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGlmIChmaXhCdXR0b24pIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZml4QnV0dG9uLnN0eWxlLmJvcmRlckNvbG9yID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtyZW1vdmUgYmcgYnV0dG9uXSDQo9Cx0YDQsNGC0Ywg0YTQvtC9OiDRgdCx0YDQvtGI0LXQvSBib3JkZXJDb2xvciAo0L7RgNCw0L3QttC10LLRi9C5KWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZml4QnV0dG9uLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmMmYyZjInO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbcmVtb3ZlIGJnIGJ1dHRvbl0g0KPQsdGA0LDRgtGMINGE0L7QvTog0YPRgdGC0LDQvdC+0LLQu9C10L0gYm9yZGVyQ29sb3I9I2YyZjJmMiAo0YHQtdGA0YvQuSlgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlUmVtb3ZlQmFja2dyb3VuZFZpc2liaWxpdHkoKSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBwYXJlbnRFbGVtZW50ID0gdGhpcy5lZGl0b3JSZW1vdmVCYWNrZ3JvdW5kQnV0dG9uLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIGlmICghcGFyZW50RWxlbWVudClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckxvYWRXaXRoQWkpIHtcbiAgICAgICAgICAgIHBhcmVudEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3JlbW92ZSBiZyBidXR0b25dINCa0L3QvtC/0LrQsCDQv9C+0LrQsNC30LDQvdCwICjQkdC10Lcg0JjQmCDQstGL0LHRgNCw0L3QviknKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhcmVudEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlUmVtb3ZlQmFja2dyb3VuZChmYWxzZSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbcmVtb3ZlIGJnIGJ1dHRvbl0g0JrQvdC+0L/QutCwINGB0LrRgNGL0YLQsCAo0KEg0JjQmCDQstGL0LHRgNCw0L3QviknKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsb2FkSW1hZ2Uoc3JjKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIGltZy5jcm9zc09yaWdpbiA9ICdhbm9ueW1vdXMnO1xuICAgICAgICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHJlc29sdmUoaW1nKTtcbiAgICAgICAgICAgIGltZy5vbmVycm9yID0gcmVqZWN0O1xuICAgICAgICAgICAgaW1nLnNyYyA9IHNyYztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldFF1YW50aXR5KCkge1xuICAgICAgICBpZiAoIXRoaXMucXVhbnRpdHlGb3JtQmxvY2spXG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgY29uc3QgZm9ybSA9IHRoaXMucXVhbnRpdHlGb3JtQmxvY2sucXVlcnlTZWxlY3RvcignZm9ybScpO1xuICAgICAgICBjb25zdCBpbnB1dCA9IGZvcm0/LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJxdWFudGl0eVwiXScpO1xuICAgICAgICBpZiAoIWlucHV0KVxuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIHJldHVybiBwYXJzZUludChpbnB1dC52YWx1ZSkgfHwgMTtcbiAgICB9XG4gICAgZ2V0U3VtKCkge1xuICAgICAgICBjb25zdCBoYXNGcm9udCA9IHRoaXMubGF5b3V0cy5zb21lKGxheW91dCA9PiBsYXlvdXQudmlldyA9PT0gJ2Zyb250Jyk7XG4gICAgICAgIGNvbnN0IGhhc0JhY2sgPSB0aGlzLmxheW91dHMuc29tZShsYXlvdXQgPT4gbGF5b3V0LnZpZXcgPT09ICdiYWNrJyk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdClcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICBjb25zdCBwcmljZSA9IGhhc0JhY2sgJiYgaGFzRnJvbnRcbiAgICAgICAgICAgID8gcHJvZHVjdC5kb3VibGVTaWRlZFByaWNlXG4gICAgICAgICAgICA6IHByb2R1Y3QucHJpY2U7XG4gICAgICAgIHJldHVybiBwcmljZTtcbiAgICB9XG4gICAgdXBkYXRlU3VtKCkge1xuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yU3VtQmxvY2spXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHN1bSA9IHRoaXMuZ2V0U3VtKCk7XG4gICAgICAgIGNvbnN0IHN1bVRleHQgPSBnZXRMYXN0Q2hpbGQodGhpcy5lZGl0b3JTdW1CbG9jayk7XG4gICAgICAgIGlmIChzdW1UZXh0KSB7XG4gICAgICAgICAgICBzdW1UZXh0LmlubmVyVGV4dCA9IHN1bS50b1N0cmluZygpICsgJyDigr0nO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uKSB7XG4gICAgICAgICAgICBjb25zdCBidXR0b25CbG9jayA9IGdldExhc3RDaGlsZCh0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uKTtcbiAgICAgICAgICAgIGlmIChidXR0b25CbG9jaykge1xuICAgICAgICAgICAgICAgIGJ1dHRvbkJsb2NrLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHN1bSA9PT0gMCA/ICdyZ2IoMTIxIDEyMSAxMjEpJyA6ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGxvYWRQcm9kdWN0KCkge1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QgfHwgIXByb2R1Y3QucHJpbnRDb25maWcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW3Byb2R1Y3RdIHByb2R1Y3Qgb3IgcHJpbnRDb25maWcgbm90IGZvdW5kJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jbGVhckFsbENhbnZhcygpO1xuICAgICAgICBmb3IgKGNvbnN0IHByaW50Q29uZmlnIG9mIHByb2R1Y3QucHJpbnRDb25maWcpIHtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQ2FudmFzRm9yU2lkZShwcmludENvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRBY3RpdmVTaWRlKHRoaXMuX3NlbGVjdFNpZGUpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCBmYWxzZSk7XG4gICAgICAgIH0sIDEwMCk7XG4gICAgfVxuICAgIGNsZWFyQWxsQ2FudmFzKCkge1xuICAgICAgICBpZiAodGhpcy5jYW52YXNlc0NvbnRhaW5lcikge1xuICAgICAgICAgICAgdGhpcy5jYW52YXNlc0NvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNhbnZhc2VzLmZvckVhY2goY2FudmFzID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2FudmFzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbY2FudmFzXSDQntGI0LjQsdC60LAg0L7Rh9C40YHRgtC60LggY2FudmFzOicsIGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNhbnZhc2VzID0gW107XG4gICAgICAgIHRoaXMubGF5ZXJzQ2FudmFzZXMgPSBbXTtcbiAgICAgICAgdGhpcy5hY3RpdmVDYW52YXMgPSBudWxsO1xuICAgIH1cbiAgICBoYW5kbGVXaW5kb3dSZXNpemUoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tjYW52YXNdINCY0LfQvNC10L3QtdC90LjQtSDRgNCw0LfQvNC10YDQsCDQvtC60L3QsCcpO1xuICAgICAgICBjb25zdCBuZXdXaWR0aCA9IHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGg7XG4gICAgICAgIGNvbnN0IG5ld0hlaWdodCA9IHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0O1xuICAgICAgICB0aGlzLmNhbnZhc2VzLmZvckVhY2goKGNhbnZhcykgPT4ge1xuICAgICAgICAgICAgY2FudmFzLnNldFdpZHRoKG5ld1dpZHRoKTtcbiAgICAgICAgICAgIGNhbnZhcy5zZXRIZWlnaHQobmV3SGVpZ2h0KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubGF5ZXJzQ2FudmFzZXMuZm9yRWFjaCgoY2FudmFzKSA9PiB7XG4gICAgICAgICAgICBjYW52YXMuc2V0V2lkdGgobmV3V2lkdGgpO1xuICAgICAgICAgICAgY2FudmFzLnNldEhlaWdodChuZXdIZWlnaHQpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKHByb2R1Y3QpIHtcbiAgICAgICAgICAgIHByb2R1Y3QucHJpbnRDb25maWcuZm9yRWFjaCgocHJpbnRDb25maWcpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc2VzLmZpbmQoYyA9PiBjLnNpZGUgPT09IHByaW50Q29uZmlnLnNpZGUpO1xuICAgICAgICAgICAgICAgIGlmIChjYW52YXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVQcmludEFyZWEoY2FudmFzLCBwcmludENvbmZpZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jYW52YXNlcy5mb3JFYWNoKChjYW52YXMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNpZGUgPSBjYW52YXMuc2lkZTtcbiAgICAgICAgICAgIGNvbnN0IG9iamVjdHMgPSBjYW52YXMuZ2V0T2JqZWN0cygpO1xuICAgICAgICAgICAgY29uc3QgdG9SZW1vdmUgPSBbXTtcbiAgICAgICAgICAgIG9iamVjdHMuZm9yRWFjaCgob2JqKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG9iai5uYW1lICE9PSAnYXJlYTpib3JkZXInICYmXG4gICAgICAgICAgICAgICAgICAgIG9iai5uYW1lICE9PSAnYXJlYTpjbGlwJyAmJlxuICAgICAgICAgICAgICAgICAgICAhb2JqLm5hbWU/LnN0YXJ0c1dpdGgoJ2d1aWRlbGluZScpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvUmVtb3ZlLnB1c2gob2JqKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRvUmVtb3ZlLmZvckVhY2goKG9iaikgPT4gY2FudmFzLnJlbW92ZShvYmopKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtjYW52YXNdINCj0LTQsNC70LXQvdC+ICR7dG9SZW1vdmUubGVuZ3RofSDQvtCx0YrQtdC60YLQvtCyINC00LvRjyDQv9C10YDQtdGA0LjRgdC+0LLQutC4INC90LAg0YHRgtC+0YDQvtC90LUgJHtzaWRlfWApO1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0c0ZvclNpZGUgPSB0aGlzLmxheW91dHMuZmlsdGVyKGwgPT4gbC52aWV3ID09PSBzaWRlKTtcbiAgICAgICAgICAgIGxheW91dHNGb3JTaWRlLmZvckVhY2gobGF5b3V0ID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZExheW91dFRvQ2FudmFzKGxheW91dCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbY2FudmFzXSDQoNCw0LfQvNC10YAg0LjQt9C80LXQvdC10L06JywgeyB3aWR0aDogbmV3V2lkdGgsIGhlaWdodDogbmV3SGVpZ2h0IH0pO1xuICAgIH1cbiAgICB1cGRhdGVQcmludEFyZWEoY2FudmFzLCBwcmludENvbmZpZykge1xuICAgICAgICBjb25zdCB3aWR0aCA9IHByaW50Q29uZmlnLnNpemUud2lkdGggLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBwcmludENvbmZpZy5zaXplLmhlaWdodCAvIDYwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0O1xuICAgICAgICBjb25zdCBsZWZ0ID0gKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGggLSB3aWR0aCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnggLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoKTtcbiAgICAgICAgY29uc3QgdG9wID0gKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0IC0gaGVpZ2h0KSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueSAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgY29uc3QgY2xpcFBhdGggPSBjYW52YXMuY2xpcFBhdGg7XG4gICAgICAgIGlmIChjbGlwUGF0aCkge1xuICAgICAgICAgICAgY2xpcFBhdGguc2V0KHtcbiAgICAgICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQsXG4gICAgICAgICAgICAgICAgbGVmdCxcbiAgICAgICAgICAgICAgICB0b3BcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJvcmRlciA9IHRoaXMuZ2V0T2JqZWN0KCdhcmVhOmJvcmRlcicsIGNhbnZhcyk7XG4gICAgICAgIGlmIChib3JkZXIpIHtcbiAgICAgICAgICAgIGJvcmRlci5zZXQoe1xuICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCAtIDMsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQgLSAzLFxuICAgICAgICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgICAgICAgdG9wXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYW52YXMucmVxdWVzdFJlbmRlckFsbCgpO1xuICAgIH1cbiAgICBjcmVhdGVDYW52YXNGb3JTaWRlKHByaW50Q29uZmlnKSB7XG4gICAgICAgIGlmICghdGhpcy5jYW52YXNlc0NvbnRhaW5lcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NhbnZhc10gY2FudmFzZXNDb250YWluZXIg0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L0nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsYXllcnNDYW52YXNCbG9jayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBsYXllcnNDYW52YXNCbG9jay5pZCA9ICdsYXllcnMtLScgKyBwcmludENvbmZpZy5zaWRlO1xuICAgICAgICBsYXllcnNDYW52YXNCbG9jay5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItcG9zaXRpb24nKTtcbiAgICAgICAgbGF5ZXJzQ2FudmFzQmxvY2suc2V0QXR0cmlidXRlKCdyZWYnLCBwcmludENvbmZpZy5zaWRlKTtcbiAgICAgICAgbGF5ZXJzQ2FudmFzQmxvY2suc3R5bGUuekluZGV4ID0gJzcnO1xuICAgICAgICB0aGlzLmNhbnZhc2VzQ29udGFpbmVyLmFwcGVuZENoaWxkKGxheWVyc0NhbnZhc0Jsb2NrKTtcbiAgICAgICAgY29uc3QgbGF5ZXJzQ2FudmFzID0gbmV3IGZhYnJpYy5TdGF0aWNDYW52YXMobGF5ZXJzQ2FudmFzQmxvY2ssIHtcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCxcbiAgICAgICAgfSk7XG4gICAgICAgIGxheWVyc0NhbnZhcy5zaWRlID0gcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgbGF5ZXJzQ2FudmFzLm5hbWUgPSAnc3RhdGljLScgKyBwcmludENvbmZpZy5zaWRlO1xuICAgICAgICBjb25zdCBlZGl0YWJsZUNhbnZhc0Jsb2NrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGVkaXRhYmxlQ2FudmFzQmxvY2suaWQgPSAnZWRpdGFibGUtLScgKyBwcmludENvbmZpZy5zaWRlO1xuICAgICAgICBlZGl0YWJsZUNhbnZhc0Jsb2NrLnNldEF0dHJpYnV0ZSgncmVmJywgcHJpbnRDb25maWcuc2lkZSk7XG4gICAgICAgIGVkaXRhYmxlQ2FudmFzQmxvY2suY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXBvc2l0aW9uJyk7XG4gICAgICAgIGVkaXRhYmxlQ2FudmFzQmxvY2suc3R5bGUuekluZGV4ID0gJzknO1xuICAgICAgICB0aGlzLmNhbnZhc2VzQ29udGFpbmVyLmFwcGVuZENoaWxkKGVkaXRhYmxlQ2FudmFzQmxvY2spO1xuICAgICAgICBjb25zdCBlZGl0YWJsZUNhbnZhcyA9IG5ldyBmYWJyaWMuQ2FudmFzKGVkaXRhYmxlQ2FudmFzQmxvY2ssIHtcbiAgICAgICAgICAgIGNvbnRyb2xzQWJvdmVPdmVybGF5OiB0cnVlLFxuICAgICAgICAgICAgd2lkdGg6IHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0LFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgdW5pZm9ybVNjYWxpbmc6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIGVkaXRhYmxlQ2FudmFzLnNpZGUgPSBwcmludENvbmZpZy5zaWRlO1xuICAgICAgICBlZGl0YWJsZUNhbnZhcy5uYW1lID0gJ2VkaXRhYmxlLScgKyBwcmludENvbmZpZy5zaWRlO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzLnB1c2gobGF5ZXJzQ2FudmFzKTtcbiAgICAgICAgdGhpcy5jYW52YXNlcy5wdXNoKGVkaXRhYmxlQ2FudmFzKTtcbiAgICAgICAgaWYgKHRoaXMuY2FudmFzZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUNhbnZhcyA9IGVkaXRhYmxlQ2FudmFzO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5pdE1haW5DYW52YXMoZWRpdGFibGVDYW52YXMsIHByaW50Q29uZmlnKTtcbiAgICB9XG4gICAgaW5pdE1haW5DYW52YXMoY2FudmFzLCBwcmludENvbmZpZykge1xuICAgICAgICBpZiAoIWNhbnZhcyB8fCAhKGNhbnZhcyBpbnN0YW5jZW9mIGZhYnJpYy5DYW52YXMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tjYW52YXNdIGNhbnZhcyDQvdC1INCy0LDQu9C40LTQtdC9Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgd2lkdGggPSBwcmludENvbmZpZy5zaXplLndpZHRoIC8gNjAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aDtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gcHJpbnRDb25maWcuc2l6ZS5oZWlnaHQgLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodDtcbiAgICAgICAgY29uc3QgbGVmdCA9ICh0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoIC0gd2lkdGgpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi54IC8gMTAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCk7XG4gICAgICAgIGNvbnN0IHRvcCA9ICh0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCAtIGhlaWdodCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnkgLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCk7XG4gICAgICAgIGNvbnN0IGNsaXBBcmVhID0gbmV3IGZhYnJpYy5SZWN0KHtcbiAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgICAgbGVmdCxcbiAgICAgICAgICAgIHRvcCxcbiAgICAgICAgICAgIGZpbGw6ICdyZ2IoMjU1LCAwLCAwKScsXG4gICAgICAgICAgICBuYW1lOiAnYXJlYTpjbGlwJyxcbiAgICAgICAgICAgIGV2ZW50ZWQ6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYXJlYUJvcmRlciA9IG5ldyBmYWJyaWMuUmVjdCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGggLSAzLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQgLSAzLFxuICAgICAgICAgICAgbGVmdCxcbiAgICAgICAgICAgIHRvcCxcbiAgICAgICAgICAgIGZpbGw6ICdyZ2JhKDAsMCwwLDApJyxcbiAgICAgICAgICAgIHN0cm9rZVdpZHRoOiAzLFxuICAgICAgICAgICAgc3Ryb2tlOiAncmdiKDI1NCwgOTQsIDU4KScsXG4gICAgICAgICAgICBuYW1lOiAnYXJlYTpib3JkZXInLFxuICAgICAgICAgICAgb3BhY2l0eTogMC4zLFxuICAgICAgICAgICAgZXZlbnRlZDogZmFsc2UsXG4gICAgICAgICAgICBzZWxlY3RhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIGhhc0NvbnRyb2xzOiBmYWxzZSxcbiAgICAgICAgICAgIHN0cm9rZURhc2hBcnJheTogWzUsIDVdLFxuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLmFkZChhcmVhQm9yZGVyKTtcbiAgICAgICAgY2FudmFzLmNsaXBQYXRoID0gY2xpcEFyZWE7XG4gICAgICAgIHRoaXMuc2V0dXBDYW52YXNFdmVudEhhbmRsZXJzKGNhbnZhcywgcHJpbnRDb25maWcpO1xuICAgIH1cbiAgICBzZXR1cENhbnZhc0V2ZW50SGFuZGxlcnMoY2FudmFzLCBwcmludENvbmZpZykge1xuICAgICAgICBjYW52YXMub24oJ21vdXNlOmRvd24nLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBib3JkZXIgPSB0aGlzLmdldE9iamVjdCgnYXJlYTpib3JkZXInLCBjYW52YXMpO1xuICAgICAgICAgICAgaWYgKGJvcmRlcikge1xuICAgICAgICAgICAgICAgIGJvcmRlci5zZXQoJ29wYWNpdHknLCAwLjgpO1xuICAgICAgICAgICAgICAgIGNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjYW52YXMub24oJ21vdXNlOnVwJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYm9yZGVyID0gdGhpcy5nZXRPYmplY3QoJ2FyZWE6Ym9yZGVyJywgY2FudmFzKTtcbiAgICAgICAgICAgIGlmIChib3JkZXIpIHtcbiAgICAgICAgICAgICAgICBib3JkZXIuc2V0KCdvcGFjaXR5JywgMC4zKTtcbiAgICAgICAgICAgICAgICBjYW52YXMucmVxdWVzdFJlbmRlckFsbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLm9uKCdvYmplY3Q6cm90YXRpbmcnLCAoZSkgPT4ge1xuICAgICAgICAgICAgaWYgKGUudGFyZ2V0Py5hbmdsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYW5nbGVzID0gWzAsIDkwLCAxODAsIDI3MF07XG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEFuZ2xlID0gZS50YXJnZXQuYW5nbGUgJSAzNjA7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzbmFwQW5nbGUgb2YgYW5nbGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhjdXJyZW50QW5nbGUgLSBzbmFwQW5nbGUpIDwgNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZS50YXJnZXQucm90YXRlKHNuYXBBbmdsZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjYW52YXMub24oJ29iamVjdDptb3ZpbmcnLCAoZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVPYmplY3RNb3ZpbmcoZSwgY2FudmFzLCBwcmludENvbmZpZyk7XG4gICAgICAgIH0pO1xuICAgICAgICBjYW52YXMub24oJ29iamVjdDptb2RpZmllZCcsIChlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZU9iamVjdE1vZGlmaWVkKGUsIGNhbnZhcywgcHJpbnRDb25maWcpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaGFuZGxlT2JqZWN0TW92aW5nKGUsIGNhbnZhcywgcHJpbnRDb25maWcpIHtcbiAgICAgICAgaWYgKCFlLnRhcmdldCB8fCBlLnRhcmdldC5uYW1lID09PSAnYXJlYTpib3JkZXInIHx8IGUudGFyZ2V0Lm5hbWUgPT09ICdhcmVhOmNsaXAnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGF5b3V0ID0gdGhpcy5sYXlvdXRzLmZpbmQobCA9PiBsLmlkID09PSBlLnRhcmdldC5uYW1lKTtcbiAgICAgICAgaWYgKCFsYXlvdXQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZGltZW5zaW9ucyA9IGNhbGN1bGF0ZUxheW91dERpbWVuc2lvbnMobGF5b3V0LCBwcm9kdWN0LCB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoLCB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCk7XG4gICAgICAgIGNvbnN0IG9ialdpZHRoID0gZS50YXJnZXQud2lkdGggKiBlLnRhcmdldC5zY2FsZVg7XG4gICAgICAgIGNvbnN0IG9iakhlaWdodCA9IGUudGFyZ2V0LmhlaWdodCAqIGUudGFyZ2V0LnNjYWxlWTtcbiAgICAgICAgY29uc3Qgb2JqQ2VudGVyTGVmdCA9IGUudGFyZ2V0LmxlZnQgKyBvYmpXaWR0aCAvIDI7XG4gICAgICAgIGNvbnN0IG9iakNlbnRlclRvcCA9IGUudGFyZ2V0LnRvcCArIG9iakhlaWdodCAvIDI7XG4gICAgICAgIGNvbnN0IGNlbnRlclggPSBkaW1lbnNpb25zLnByaW50QXJlYUxlZnQgKyBkaW1lbnNpb25zLnByaW50QXJlYVdpZHRoIC8gMjtcbiAgICAgICAgY29uc3QgY2VudGVyWSA9IGRpbWVuc2lvbnMucHJpbnRBcmVhVG9wICsgZGltZW5zaW9ucy5wcmludEFyZWFIZWlnaHQgLyAyO1xuICAgICAgICBjb25zdCBuZWFyWCA9IE1hdGguYWJzKG9iakNlbnRlckxlZnQgLSBjZW50ZXJYKSA8IDc7XG4gICAgICAgIGNvbnN0IG5lYXJZID0gTWF0aC5hYnMob2JqQ2VudGVyVG9wIC0gY2VudGVyWSkgPCA3O1xuICAgICAgICBpZiAobmVhclgpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0d1aWRlbGluZShjYW52YXMsICd2ZXJ0aWNhbCcsIGNlbnRlclgsIDAsIGNlbnRlclgsIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgICAgIGUudGFyZ2V0LnNldCh7IGxlZnQ6IGNlbnRlclggLSBvYmpXaWR0aCAvIDIgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmhpZGVHdWlkZWxpbmUoY2FudmFzLCAndmVydGljYWwnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmVhclkpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0d1aWRlbGluZShjYW52YXMsICdob3Jpem9udGFsJywgMCwgY2VudGVyWSwgdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCwgY2VudGVyWSk7XG4gICAgICAgICAgICBlLnRhcmdldC5zZXQoeyB0b3A6IGNlbnRlclkgLSBvYmpIZWlnaHQgLyAyIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5oaWRlR3VpZGVsaW5lKGNhbnZhcywgJ2hvcml6b250YWwnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBoYW5kbGVPYmplY3RNb2RpZmllZChlLCBjYW52YXMsIHByaW50Q29uZmlnKSB7XG4gICAgICAgIGNvbnN0IG9iamVjdCA9IGUudGFyZ2V0O1xuICAgICAgICBpZiAoIW9iamVjdClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5oaWRlR3VpZGVsaW5lKGNhbnZhcywgJ3ZlcnRpY2FsJyk7XG4gICAgICAgIHRoaXMuaGlkZUd1aWRlbGluZShjYW52YXMsICdob3Jpem9udGFsJyk7XG4gICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0cy5maW5kKGwgPT4gbC5pZCA9PT0gb2JqZWN0Lm5hbWUpO1xuICAgICAgICBpZiAoIWxheW91dClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBkaW1lbnNpb25zID0gY2FsY3VsYXRlTGF5b3V0RGltZW5zaW9ucyhsYXlvdXQsIHByb2R1Y3QsIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgsIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgbGF5b3V0LnBvc2l0aW9uLnggPSAob2JqZWN0LmxlZnQgLSBkaW1lbnNpb25zLnByaW50QXJlYUxlZnQpIC8gZGltZW5zaW9ucy5wcmludEFyZWFXaWR0aDtcbiAgICAgICAgbGF5b3V0LnBvc2l0aW9uLnkgPSAob2JqZWN0LnRvcCAtIGRpbWVuc2lvbnMucHJpbnRBcmVhVG9wKSAvIGRpbWVuc2lvbnMucHJpbnRBcmVhSGVpZ2h0O1xuICAgICAgICBsYXlvdXQuc2l6ZSA9IG9iamVjdC5zY2FsZVg7XG4gICAgICAgIGxheW91dC5hc3BlY3RSYXRpbyA9IG9iamVjdC5zY2FsZVkgLyBvYmplY3Quc2NhbGVYO1xuICAgICAgICBsYXlvdXQuYW5nbGUgPSBvYmplY3QuYW5nbGU7XG4gICAgICAgIGNvbnN0IG9iamVjdFdpZHRoID0gKG9iamVjdC53aWR0aCAqIG9iamVjdC5zY2FsZVgpO1xuICAgICAgICBjb25zdCByZWxhdGl2ZVdpZHRoID0gb2JqZWN0V2lkdGggLyBkaW1lbnNpb25zLnByaW50QXJlYVdpZHRoO1xuICAgICAgICBsYXlvdXQuX3JlbGF0aXZlV2lkdGggPSByZWxhdGl2ZVdpZHRoO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbY2FudmFzXSBMYXlvdXQgJHtsYXlvdXQuaWR9IHVwZGF0ZWQ6IHBvc2l0aW9uPSgke2xheW91dC5wb3NpdGlvbi54LnRvRml4ZWQoMyl9LCAke2xheW91dC5wb3NpdGlvbi55LnRvRml4ZWQoMyl9KSwgc2l6ZT0ke2xheW91dC5zaXplLnRvRml4ZWQoMyl9LCByZWxhdGl2ZVdpZHRoPSR7cmVsYXRpdmVXaWR0aC50b0ZpeGVkKDMpfWApO1xuICAgICAgICB0aGlzLnNhdmVMYXlvdXRzKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycikpO1xuICAgIH1cbiAgICBzaG93R3VpZGVsaW5lKGNhbnZhcywgdHlwZSwgeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IGBndWlkZWxpbmU6JHt0eXBlfWA7XG4gICAgICAgIGxldCBndWlkZWxpbmUgPSB0aGlzLmdldE9iamVjdChuYW1lLCBjYW52YXMpO1xuICAgICAgICBpZiAoIWd1aWRlbGluZSkge1xuICAgICAgICAgICAgZ3VpZGVsaW5lID0gbmV3IGZhYnJpYy5MaW5lKFt4MSwgeTEsIHgyLCB5Ml0sIHtcbiAgICAgICAgICAgICAgICBzdHJva2U6ICdyZ2IoMjU0LCA5NCwgNTgpJyxcbiAgICAgICAgICAgICAgICBzdHJva2VXaWR0aDogMixcbiAgICAgICAgICAgICAgICBzdHJva2VEYXNoQXJyYXk6IFs1LCA1XSxcbiAgICAgICAgICAgICAgICBzZWxlY3RhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBldmVudGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZ3VpZGVsaW5lKSB7XG4gICAgICAgICAgICAgICAgY2FudmFzLmFkZChndWlkZWxpbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGhpZGVHdWlkZWxpbmUoY2FudmFzLCB0eXBlKSB7XG4gICAgICAgIGNvbnN0IGd1aWRlbGluZSA9IHRoaXMuZ2V0T2JqZWN0KGBndWlkZWxpbmU6JHt0eXBlfWAsIGNhbnZhcyk7XG4gICAgICAgIGlmIChndWlkZWxpbmUpIHtcbiAgICAgICAgICAgIGNhbnZhcy5yZW1vdmUoZ3VpZGVsaW5lKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRPYmplY3QobmFtZSwgY2FudmFzKSB7XG4gICAgICAgIGNvbnN0IHRhcmdldENhbnZhcyA9IGNhbnZhcyB8fCB0aGlzLmFjdGl2ZUNhbnZhcyB8fCB0aGlzLmNhbnZhc2VzWzBdO1xuICAgICAgICBpZiAoIXRhcmdldENhbnZhcylcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiB0YXJnZXRDYW52YXMuZ2V0T2JqZWN0cygpLmZpbmQob2JqID0+IG9iai5uYW1lID09PSBuYW1lKTtcbiAgICB9XG4gICAgc2V0QWN0aXZlU2lkZShzaWRlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tjYW52YXNdINCj0YHRgtCw0L3QvtCy0LrQsCDQsNC60YLQuNCy0L3QvtC5INGB0YLQvtGA0L7QvdGLOicsIHNpZGUpO1xuICAgICAgICB0aGlzLmNhbnZhc2VzLmZvckVhY2goY2FudmFzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhc0VsZW1lbnQgPSBjYW52YXMuZ2V0RWxlbWVudCgpO1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyRWxlbWVudCA9IGNhbnZhc0VsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgIGlmIChjYW52YXMuc2lkZSA9PT0gc2lkZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ2FudmFzID0gY2FudmFzO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FudmFzRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYW52YXNFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzLmZvckVhY2gobGF5ZXJzQ2FudmFzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhc0VsZW1lbnQgPSBsYXllcnNDYW52YXMuZ2V0RWxlbWVudCgpO1xuICAgICAgICAgICAgY2FudmFzRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gbGF5ZXJzQ2FudmFzLnNpZGUgPT09IHNpZGUgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fc2VsZWN0U2lkZSA9IHNpZGU7XG4gICAgfVxuICAgIGFzeW5jIGFkZExheW91dFRvQ2FudmFzKGxheW91dCkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc2VzLmZpbmQoYyA9PiBjLnNpZGUgPT09IGxheW91dC52aWV3KTtcbiAgICAgICAgaWYgKCFjYW52YXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2NhbnZhc10gY2FudmFzINC00LvRjyAke2xheW91dC52aWV3fSDQvdC1INC90LDQudC00LXQvWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZmFicmljT2JqZWN0ID0gYXdhaXQgcmVuZGVyTGF5b3V0KHtcbiAgICAgICAgICAgIGxheW91dCxcbiAgICAgICAgICAgIHByb2R1Y3QsXG4gICAgICAgICAgICBjb250YWluZXJXaWR0aDogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCxcbiAgICAgICAgICAgIGNvbnRhaW5lckhlaWdodDogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQsXG4gICAgICAgICAgICBsb2FkSW1hZ2U6IHRoaXMubG9hZEltYWdlLmJpbmQodGhpcylcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChmYWJyaWNPYmplY3QpIHtcbiAgICAgICAgICAgIGNhbnZhcy5hZGQoZmFicmljT2JqZWN0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGVMYXlvdXRzKCkge1xuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlQ2FudmFzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHNGb3JTaWRlKHRoaXMuX3NlbGVjdFNpZGUpO1xuICAgIH1cbiAgICB1cGRhdGVMYXlvdXRzRm9yU2lkZShzaWRlKSB7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IHRoaXMuY2FudmFzZXMuZmluZChjID0+IGMuc2lkZSA9PT0gc2lkZSk7XG4gICAgICAgIGlmICghY2FudmFzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBvYmplY3RzID0gY2FudmFzLmdldE9iamVjdHMoKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0c1RvUmVtb3ZlID0gb2JqZWN0c1xuICAgICAgICAgICAgLmZpbHRlcihvYmogPT4gb2JqLm5hbWUgIT09ICdhcmVhOmJvcmRlcicgJiYgb2JqLm5hbWUgIT09ICdhcmVhOmNsaXAnICYmICFvYmoubmFtZT8uc3RhcnRzV2l0aCgnZ3VpZGVsaW5lJykpXG4gICAgICAgICAgICAuZmlsdGVyKG9iaiA9PiAhdGhpcy5sYXlvdXRzLmZpbmQobGF5b3V0ID0+IGxheW91dC5pZCA9PT0gb2JqLm5hbWUpKTtcbiAgICAgICAgb2JqZWN0c1RvUmVtb3ZlLmZvckVhY2gob2JqID0+IHtcbiAgICAgICAgICAgIGNhbnZhcy5yZW1vdmUob2JqKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGxheW91dHNGb3JTaWRlID0gdGhpcy5sYXlvdXRzLmZpbHRlcihsYXlvdXQgPT4gbGF5b3V0LnZpZXcgPT09IHNpZGUpO1xuICAgICAgICBjb25zdCBvYmplY3RzVG9VcGRhdGUgPSBbXTtcbiAgICAgICAgY29uc3Qgb2JqZWN0c1RvQWRkID0gW107XG4gICAgICAgIGxheW91dHNGb3JTaWRlLmZvckVhY2gobGF5b3V0ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nT2JqID0gb2JqZWN0cy5maW5kKG9iaiA9PiBvYmoubmFtZSA9PT0gbGF5b3V0LmlkKTtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ09iaikge1xuICAgICAgICAgICAgICAgIGlmIChsYXlvdXQuaXNJbWFnZUxheW91dCgpICYmIGV4aXN0aW5nT2JqLmxheW91dFVybCAhPT0gbGF5b3V0LnVybCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbY2FudmFzXSBMYXlvdXQgJHtsYXlvdXQuaWR9INC40LfQvNC10L3QuNC70YHRjywg0YLRgNC10LHRg9C10YLRgdGPINC+0LHQvdC+0LLQu9C10L3QuNC1YCk7XG4gICAgICAgICAgICAgICAgICAgIG9iamVjdHNUb1VwZGF0ZS5wdXNoKGxheW91dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgb2JqZWN0c1RvQWRkLnB1c2gobGF5b3V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIG9iamVjdHNUb1VwZGF0ZS5mb3JFYWNoKGxheW91dCA9PiB7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ09iaiA9IG9iamVjdHMuZmluZChvYmogPT4gb2JqLm5hbWUgPT09IGxheW91dC5pZCk7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdPYmopIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbY2FudmFzXSDQo9C00LDQu9GP0LXQvCDRgdGC0LDRgNGL0Lkg0L7QsdGK0LXQutGCINC00LvRjyDQvtCx0L3QvtCy0LvQtdC90LjRjzogJHtsYXlvdXQuaWR9YCk7XG4gICAgICAgICAgICAgICAgY2FudmFzLnJlbW92ZShleGlzdGluZ09iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbY2FudmFzXSDQlNC+0LHQsNCy0LvRj9C10Lwg0L7QsdC90L7QstC70LXQvdC90YvQuSDQvtCx0YrQtdC60YI6ICR7bGF5b3V0LmlkfWApO1xuICAgICAgICAgICAgdGhpcy5hZGRMYXlvdXRUb0NhbnZhcyhsYXlvdXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgb2JqZWN0c1RvQWRkLmZvckVhY2gobGF5b3V0ID0+IHtcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5b3V0VG9DYW52YXMobGF5b3V0KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNhbnZhcy5yZW5kZXJBbGwoKTtcbiAgICB9XG4gICAgYXN5bmMgcHJlbG9hZEFsbE1vY2t1cHMoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1twcmVsb2FkXSDQndCw0YfQsNC70L4g0L/RgNC10LTQt9Cw0LPRgNGD0LfQutC4IG1vY2t1cHMnKTtcbiAgICAgICAgZm9yIChjb25zdCBwcm9kdWN0IG9mIHRoaXMucHJvZHVjdENvbmZpZ3MpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbW9ja3VwIG9mIHByb2R1Y3QubW9ja3Vwcykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vY2t1cERhdGFVcmwgPSBhd2FpdCB0aGlzLmdldEltYWdlRGF0YShtb2NrdXAudXJsKTtcbiAgICAgICAgICAgICAgICAgICAgbW9ja3VwLnVybCA9IG1vY2t1cERhdGFVcmw7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtwcmVsb2FkXSBNb2NrdXAg0LfQsNCz0YDRg9C20LXQvTogJHttb2NrdXAuY29sb3IubmFtZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtwcmVsb2FkXSDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCBtb2NrdXAgJHttb2NrdXAudXJsfTpgLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1twcmVsb2FkXSDQn9GA0LXQtNC30LDQs9GA0YPQt9C60LAg0LfQsNCy0LXRgNGI0LXQvdCwJyk7XG4gICAgfVxuICAgIGFzeW5jIGdldEltYWdlRGF0YSh1cmwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9hZEFuZENvbnZlcnRJbWFnZSh1cmwpO1xuICAgIH1cbiAgICBhc3luYyB1cGxvYWRJbWFnZShmaWxlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWRdINCX0LDQs9GA0YPQt9C60LAg0YTQsNC50LvQsDonLCBmaWxlLm5hbWUpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGFVcmwgPSBlLnRhcmdldD8ucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWREYXRhVXJsID0gYXdhaXQgdGhpcy5nZXRJbWFnZURhdGEoZGF0YVVybCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWRdINCk0LDQudC7INGD0YHQv9C10YjQvdC+INC30LDQs9GA0YPQttC10L0nKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShjb252ZXJ0ZWREYXRhVXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuT3BlblJlcGxheS5pc3N1ZShcImxvYWQtZmlsZVwiLCBmaWxlLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcign0J7RiNC40LHQutCwINGD0YHRgtCw0L3QvtCy0LrQuCBJRCDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8g0LIgdHJhY2tlcjonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3VwbG9hZF0g0J7RiNC40LHQutCwINC+0LHRgNCw0LHQvtGC0LrQuCDRhNCw0LnQu9CwOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3VwbG9hZF0g0J7RiNC40LHQutCwINGH0YLQtdC90LjRjyDRhNCw0LnQu9CwJyk7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcign0J3QtSDRg9C00LDQu9C+0YHRjCDQv9GA0L7Rh9C40YLQsNGC0Ywg0YTQsNC50LsnKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyB1cGxvYWRJbWFnZVRvU2VydmVyKGJhc2U2NCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkXSDQl9Cw0LPRgNGD0LfQutCwINC40LfQvtCx0YDQsNC20LXQvdC40Y8g0L3QsCDRgdC10YDQstC10YAnKTtcbiAgICAgICAgY29uc3QgdXNlcklkID0gYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci5nZXRVc2VySWQoKTtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh0aGlzLmFwaUNvbmZpZy51cGxvYWRJbWFnZSwge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGltYWdlOiBiYXNlNjQsIHVzZXJfaWQ6IHVzZXJJZCB9KSxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZF0g0JjQt9C+0LHRgNCw0LbQtdC90LjQtSDQt9Cw0LPRgNGD0LbQtdC90L4g0L3QsCDRgdC10YDQstC10YA6JywgZGF0YS5pbWFnZV91cmwpO1xuICAgICAgICByZXR1cm4gZGF0YS5pbWFnZV91cmw7XG4gICAgfVxuICAgIGdldFByb2R1Y3ROYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpPy5wcm9kdWN0TmFtZSB8fCAnJztcbiAgICB9XG4gICAgY2FwaXRhbGl6ZUZpcnN0TGV0dGVyKHN0cmluZykge1xuICAgICAgICByZXR1cm4gc3RyaW5nLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyaW5nLnNsaWNlKDEpO1xuICAgIH1cbiAgICBnZXRNb2NrdXBVcmwoc2lkZSkge1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgY29uc3QgbW9ja3VwID0gcHJvZHVjdC5tb2NrdXBzLmZpbmQobW9ja3VwID0+IG1vY2t1cC5zaWRlID09PSBzaWRlICYmIG1vY2t1cC5jb2xvci5uYW1lID09PSB0aGlzLl9zZWxlY3RDb2xvci5uYW1lKTtcbiAgICAgICAgcmV0dXJuIG1vY2t1cCA/IG1vY2t1cC51cmwgOiBudWxsO1xuICAgIH1cbiAgICBhc3luYyBleHBvcnRBcnQod2l0aE1vY2t1cCA9IHRydWUsIHJlc29sdXRpb24gPSAxMDI0KSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICBjb25zdCBzaWRlc1dpdGhMYXllcnMgPSB0aGlzLmdldFNpZGVzV2l0aExheWVycygpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZXhwb3J0XSDQndCw0LnQtNC10L3RiyDRgdGC0L7RgNC+0L3RiyDRgSDRgdC70L7Rj9C80Lg6Jywgc2lkZXNXaXRoTGF5ZXJzLCAnKGZyb250INC/0LXRgNCy0YvQuSknLCB3aXRoTW9ja3VwID8gJ9GBINC80L7QutCw0L/QvtC8JyA6ICfQsdC10Lcg0LzQvtC60LDQv9CwJywgYNGA0LDQt9GA0LXRiNC10L3QuNC1OiAke3Jlc29sdXRpb259cHhgKTtcbiAgICAgICAgY29uc3QgZXhwb3J0UHJvbWlzZXMgPSBzaWRlc1dpdGhMYXllcnMubWFwKGFzeW5jIChzaWRlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4cG9ydGVkU2lkZSA9IGF3YWl0IHRoaXMuZXhwb3J0U2lkZShzaWRlLCB3aXRoTW9ja3VwLCByZXNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAoZXhwb3J0ZWRTaWRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCh0YLQvtGA0L7QvdCwICR7c2lkZX0g0YPRgdC/0LXRiNC90L4g0Y3QutGB0L/QvtGA0YLQuNGA0L7QstCw0L3QsGApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBzaWRlLCBkYXRhOiBleHBvcnRlZFNpZGUgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbZXhwb3J0XSDQntGI0LjQsdC60LAg0L/RgNC4INGN0LrRgdC/0L7RgNGC0LUg0YHRgtC+0YDQvtC90YsgJHtzaWRlfTpgLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGV4cG9ydGVkU2lkZXMgPSBhd2FpdCBQcm9taXNlLmFsbChleHBvcnRQcm9taXNlcyk7XG4gICAgICAgIGV4cG9ydGVkU2lkZXMuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W2l0ZW0uc2lkZV0gPSBpdGVtLmRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQrdC60YHQv9C+0YDRgiDQt9Cw0LLQtdGA0YjQtdC9INC00LvRjyAke09iamVjdC5rZXlzKHJlc3VsdCkubGVuZ3RofSDRgdGC0L7RgNC+0L1gKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgZ2V0U2lkZXNXaXRoTGF5ZXJzKCkge1xuICAgICAgICBjb25zdCBhbGxTaWRlc1dpdGhMYXllcnMgPSBbLi4ubmV3IFNldCh0aGlzLmxheW91dHMubWFwKGxheW91dCA9PiBsYXlvdXQudmlldykpXTtcbiAgICAgICAgcmV0dXJuIGFsbFNpZGVzV2l0aExheWVycy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICBpZiAoYSA9PT0gJ2Zyb250JylcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICBpZiAoYiA9PT0gJ2Zyb250JylcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgZXhwb3J0U2lkZShzaWRlLCB3aXRoTW9ja3VwID0gdHJ1ZSwgcmVzb2x1dGlvbiA9IDEwMjQpIHtcbiAgICAgICAgY29uc3QgY2FudmFzZXMgPSB0aGlzLmdldENhbnZhc2VzRm9yU2lkZShzaWRlKTtcbiAgICAgICAgaWYgKCFjYW52YXNlcy5lZGl0YWJsZUNhbnZhcykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZXhwb3J0XSBDYW52YXMg0LTQu9GPINGB0YLQvtGA0L7QvdGLICR7c2lkZX0g0L3QtSDQvdCw0LnQtNC10L1gKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0c0ZvclNpZGUoc2lkZSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCt0LrRgdC/0L7RgNGC0LjRgNGD0LXQvCDRgdGC0L7RgNC+0L3RgyAke3NpZGV9JHt3aXRoTW9ja3VwID8gJyDRgSDQvNC+0LrQsNC/0L7QvCcgOiAnINCx0LXQtyDQvNC+0LrQsNC/0LAnfSAoJHtyZXNvbHV0aW9ufXB4KS4uLmApO1xuICAgICAgICBpZiAoIXdpdGhNb2NrdXApIHtcbiAgICAgICAgICAgIGNvbnN0IGNyb3BwZWRDYW52YXMgPSBhd2FpdCB0aGlzLmV4cG9ydERlc2lnbldpdGhDbGlwUGF0aChjYW52YXNlcy5lZGl0YWJsZUNhbnZhcywgY2FudmFzZXMubGF5ZXJzQ2FudmFzLCBzaWRlLCByZXNvbHV0aW9uKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCt0LrRgdC/0L7RgNGC0LjRgNC+0LLQsNC9INGH0LjRgdGC0YvQuSDQtNC40LfQsNC50L0g0LTQu9GPICR7c2lkZX0gKNC+0LHRgNC10LfQsNC9INC/0L4gY2xpcFBhdGgpYCk7XG4gICAgICAgICAgICByZXR1cm4gY3JvcHBlZENhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycsIDEuMCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbW9ja3VwSW1nID0gYXdhaXQgdGhpcy5sb2FkTW9ja3VwRm9yU2lkZShzaWRlKTtcbiAgICAgICAgaWYgKCFtb2NrdXBJbWcpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgY29uc3QgcHJpbnRDb25maWcgPSBwcm9kdWN0Py5wcmludENvbmZpZy5maW5kKHBjID0+IHBjLnNpZGUgPT09IHNpZGUpO1xuICAgICAgICBpZiAoIXByaW50Q29uZmlnKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtleHBvcnRdINCd0LUg0L3QsNC50LTQtdC90LAg0LrQvtC90YTQuNCz0YPRgNCw0YbQuNGPINC/0LXRh9Cw0YLQuCDQtNC70Y8gJHtzaWRlfWApO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyBjYW52YXM6IHRlbXBDYW52YXMsIGN0eCwgbW9ja3VwRGltZW5zaW9ucyB9ID0gdGhpcy5jcmVhdGVFeHBvcnRDYW52YXMocmVzb2x1dGlvbiwgbW9ja3VwSW1nKTtcbiAgICAgICAgY29uc3QgY3JvcHBlZERlc2lnbkNhbnZhcyA9IGF3YWl0IHRoaXMuZXhwb3J0RGVzaWduV2l0aENsaXBQYXRoKGNhbnZhc2VzLmVkaXRhYmxlQ2FudmFzLCBjYW52YXNlcy5sYXllcnNDYW52YXMsIHNpZGUsIHJlc29sdXRpb24pO1xuICAgICAgICBjb25zdCBwcmludEFyZWFXaWR0aCA9IChwcmludENvbmZpZy5zaXplLndpZHRoIC8gNjAwKSAqIG1vY2t1cERpbWVuc2lvbnMud2lkdGg7XG4gICAgICAgIGNvbnN0IHByaW50QXJlYUhlaWdodCA9IChwcmludENvbmZpZy5zaXplLmhlaWdodCAvIDYwMCkgKiBtb2NrdXBEaW1lbnNpb25zLmhlaWdodDtcbiAgICAgICAgY29uc3QgcHJpbnRBcmVhWCA9IG1vY2t1cERpbWVuc2lvbnMueCArIChtb2NrdXBEaW1lbnNpb25zLndpZHRoIC0gcHJpbnRBcmVhV2lkdGgpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi54IC8gMTAwKSAqIG1vY2t1cERpbWVuc2lvbnMud2lkdGg7XG4gICAgICAgIGNvbnN0IHByaW50QXJlYVkgPSBtb2NrdXBEaW1lbnNpb25zLnkgKyAobW9ja3VwRGltZW5zaW9ucy5oZWlnaHQgLSBwcmludEFyZWFIZWlnaHQpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi55IC8gMTAwKSAqIG1vY2t1cERpbWVuc2lvbnMuaGVpZ2h0O1xuICAgICAgICBjdHguZHJhd0ltYWdlKGNyb3BwZWREZXNpZ25DYW52YXMsIDAsIDAsIGNyb3BwZWREZXNpZ25DYW52YXMud2lkdGgsIGNyb3BwZWREZXNpZ25DYW52YXMuaGVpZ2h0LCBwcmludEFyZWFYLCBwcmludEFyZWFZLCBwcmludEFyZWFXaWR0aCwgcHJpbnRBcmVhSGVpZ2h0KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0J3QsNC70L7QttC10L0g0L7QsdGA0LXQt9Cw0L3QvdGL0Lkg0LTQuNC30LDQudC9IChjbGlwUGF0aCkg0L3QsCDQvNC+0LrQsNC/INC00LvRjyAke3NpZGV9INCyINC+0LHQu9Cw0YHRgtC4INC/0LXRh9Cw0YLQuCAoJHtNYXRoLnJvdW5kKHByaW50QXJlYVgpfSwgJHtNYXRoLnJvdW5kKHByaW50QXJlYVkpfSwgJHtNYXRoLnJvdW5kKHByaW50QXJlYVdpZHRoKX14JHtNYXRoLnJvdW5kKHByaW50QXJlYUhlaWdodCl9KWApO1xuICAgICAgICByZXR1cm4gdGVtcENhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycsIDEuMCk7XG4gICAgfVxuICAgIGdldENhbnZhc2VzRm9yU2lkZShzaWRlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlZGl0YWJsZUNhbnZhczogdGhpcy5jYW52YXNlcy5maW5kKGMgPT4gYy5zaWRlID09PSBzaWRlKSxcbiAgICAgICAgICAgIGxheWVyc0NhbnZhczogdGhpcy5sYXllcnNDYW52YXNlcy5maW5kKGMgPT4gYy5zaWRlID09PSBzaWRlKVxuICAgICAgICB9O1xuICAgIH1cbiAgICBhc3luYyBsb2FkTW9ja3VwRm9yU2lkZShzaWRlKSB7XG4gICAgICAgIGNvbnN0IG1vY2t1cFVybCA9IHRoaXMuZ2V0TW9ja3VwVXJsKHNpZGUpO1xuICAgICAgICBpZiAoIW1vY2t1cFVybCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZXhwb3J0XSDQnNC+0LrQsNC/INC00LvRjyDRgdGC0L7RgNC+0L3RiyAke3NpZGV9INC90LUg0L3QsNC50LTQtdC9YCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtb2NrdXBJbWcgPSBhd2FpdCB0aGlzLmxvYWRJbWFnZShtb2NrdXBVcmwpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQl9Cw0LPRgNGD0LbQtdC9INC80L7QutCw0L8g0LTQu9GPICR7c2lkZX06ICR7bW9ja3VwVXJsfWApO1xuICAgICAgICByZXR1cm4gbW9ja3VwSW1nO1xuICAgIH1cbiAgICBjcmVhdGVFeHBvcnRDYW52YXMoZXhwb3J0U2l6ZSwgbW9ja3VwSW1nKSB7XG4gICAgICAgIGNvbnN0IHRlbXBDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgY29uc3QgY3R4ID0gdGVtcENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB0ZW1wQ2FudmFzLndpZHRoID0gZXhwb3J0U2l6ZTtcbiAgICAgICAgdGVtcENhbnZhcy5oZWlnaHQgPSBleHBvcnRTaXplO1xuICAgICAgICBjb25zdCBtb2NrdXBTY2FsZSA9IE1hdGgubWluKGV4cG9ydFNpemUgLyBtb2NrdXBJbWcud2lkdGgsIGV4cG9ydFNpemUgLyBtb2NrdXBJbWcuaGVpZ2h0KTtcbiAgICAgICAgY29uc3Qgc2NhbGVkTW9ja3VwV2lkdGggPSBtb2NrdXBJbWcud2lkdGggKiBtb2NrdXBTY2FsZTtcbiAgICAgICAgY29uc3Qgc2NhbGVkTW9ja3VwSGVpZ2h0ID0gbW9ja3VwSW1nLmhlaWdodCAqIG1vY2t1cFNjYWxlO1xuICAgICAgICBjb25zdCBtb2NrdXBYID0gKGV4cG9ydFNpemUgLSBzY2FsZWRNb2NrdXBXaWR0aCkgLyAyO1xuICAgICAgICBjb25zdCBtb2NrdXBZID0gKGV4cG9ydFNpemUgLSBzY2FsZWRNb2NrdXBIZWlnaHQpIC8gMjtcbiAgICAgICAgY3R4LmRyYXdJbWFnZShtb2NrdXBJbWcsIG1vY2t1cFgsIG1vY2t1cFksIHNjYWxlZE1vY2t1cFdpZHRoLCBzY2FsZWRNb2NrdXBIZWlnaHQpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQndCw0YDQuNGB0L7QstCw0L0g0LzQvtC60LDQvyDQutCw0Log0YTQvtC9ICgke3NjYWxlZE1vY2t1cFdpZHRofXgke3NjYWxlZE1vY2t1cEhlaWdodH0pYCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjYW52YXM6IHRlbXBDYW52YXMsXG4gICAgICAgICAgICBjdHgsXG4gICAgICAgICAgICBtb2NrdXBEaW1lbnNpb25zOiB7XG4gICAgICAgICAgICAgICAgeDogbW9ja3VwWCxcbiAgICAgICAgICAgICAgICB5OiBtb2NrdXBZLFxuICAgICAgICAgICAgICAgIHdpZHRoOiBzY2FsZWRNb2NrdXBXaWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHNjYWxlZE1vY2t1cEhlaWdodFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBhc3luYyBjcmVhdGVEZXNpZ25DYW52YXMoZWRpdGFibGVDYW52YXMsIGxheWVyc0NhbnZhcywgc2lkZSkge1xuICAgICAgICBjb25zdCBxdWFsaXR5TXVsdGlwbGllciA9IDEwO1xuICAgICAgICBjb25zdCBiYXNlV2lkdGggPSBlZGl0YWJsZUNhbnZhcy5nZXRXaWR0aCgpO1xuICAgICAgICBjb25zdCBiYXNlSGVpZ2h0ID0gZWRpdGFibGVDYW52YXMuZ2V0SGVpZ2h0KCk7XG4gICAgICAgIGNvbnN0IGRlc2lnbkNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBjb25zdCBkZXNpZ25DdHggPSBkZXNpZ25DYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgZGVzaWduQ2FudmFzLndpZHRoID0gYmFzZVdpZHRoICogcXVhbGl0eU11bHRpcGxpZXI7XG4gICAgICAgIGRlc2lnbkNhbnZhcy5oZWlnaHQgPSBiYXNlSGVpZ2h0ICogcXVhbGl0eU11bHRpcGxpZXI7XG4gICAgICAgIGF3YWl0IHRoaXMuYWRkU3RhdGljTGF5ZXJzVG9DYW52YXMobGF5ZXJzQ2FudmFzLCBkZXNpZ25DdHgsIGRlc2lnbkNhbnZhcywgc2lkZSk7XG4gICAgICAgIGF3YWl0IHRoaXMuYWRkRWRpdGFibGVPYmplY3RzVG9DYW52YXMoZWRpdGFibGVDYW52YXMsIGRlc2lnbkN0eCwgZGVzaWduQ2FudmFzLCBiYXNlV2lkdGgsIGJhc2VIZWlnaHQsIHNpZGUpO1xuICAgICAgICByZXR1cm4gZGVzaWduQ2FudmFzO1xuICAgIH1cbiAgICBhc3luYyBhZGRTdGF0aWNMYXllcnNUb0NhbnZhcyhsYXllcnNDYW52YXMsIGN0eCwgY2FudmFzLCBzaWRlKSB7XG4gICAgICAgIGlmICghbGF5ZXJzQ2FudmFzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbGF5ZXJzRGF0YVVybCA9IGxheWVyc0NhbnZhcy50b0RhdGFVUkwoe1xuICAgICAgICAgICAgICAgIGZvcm1hdDogJ3BuZycsXG4gICAgICAgICAgICAgICAgbXVsdGlwbGllcjogMTAsXG4gICAgICAgICAgICAgICAgcXVhbGl0eTogMS4wXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGVtcHR5RGF0YVVybCA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUFFQUFBQUJDQVlBQUFBZkZjU0pBQUFBRFVsRVFWUjQybU5rWVBoZkR3QUNod0dBNjBlNmtnQUFBQUJKUlU1RXJrSmdnZz09JztcbiAgICAgICAgICAgIGlmIChsYXllcnNEYXRhVXJsICE9PSBlbXB0eURhdGFVcmwgJiYgbGF5ZXJzRGF0YVVybC5sZW5ndGggPiBlbXB0eURhdGFVcmwubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGF5ZXJzSW1nID0gYXdhaXQgdGhpcy5sb2FkSW1hZ2UobGF5ZXJzRGF0YVVybCk7XG4gICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShsYXllcnNJbWcsIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0JTQvtCx0LDQstC70LXQvdGLINGB0YLQsNGC0LjRh9C10YHQutC40LUg0YHQu9C+0Lgg0LTQu9GPICR7c2lkZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2V4cG9ydF0g0J7RiNC40LHQutCwINGN0LrRgdC/0L7RgNGC0LAg0YHRgtCw0YLQuNGH0LXRgdC60LjRhSDRgdC70L7QtdCyINC00LvRjyAke3NpZGV9OmAsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBhZGRFZGl0YWJsZU9iamVjdHNUb0NhbnZhcyhlZGl0YWJsZUNhbnZhcywgY3R4LCBjYW52YXMsIGJhc2VXaWR0aCwgYmFzZUhlaWdodCwgc2lkZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdGVtcEVkaXRhYmxlQ2FudmFzID0gbmV3IGZhYnJpYy5TdGF0aWNDYW52YXMobnVsbCwge1xuICAgICAgICAgICAgICAgIHdpZHRoOiBiYXNlV2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBiYXNlSGVpZ2h0LFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3RyYW5zcGFyZW50J1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZWRpdGFibGVDYW52YXMuY2xpcFBhdGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjbG9uZWRDbGlwID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdGFibGVDYW52YXMuY2xpcFBhdGguY2xvbmUoKGNsb25lZCkgPT4gcmVzb2x2ZShjbG9uZWQpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0ZW1wRWRpdGFibGVDYW52YXMuY2xpcFBhdGggPSBjbG9uZWRDbGlwO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCf0YDQuNC80LXQvdGR0L0gY2xpcFBhdGgg0LTQu9GPINGN0LrRgdC/0L7RgNGC0LAg0YHRgtC+0YDQvtC90YsgJHtzaWRlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZGVzaWduT2JqZWN0cyA9IHRoaXMuZmlsdGVyRGVzaWduT2JqZWN0cyhlZGl0YWJsZUNhbnZhcy5nZXRPYmplY3RzKCkpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBvYmogb2YgZGVzaWduT2JqZWN0cykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNsb25lZE9iaiA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIG9iai5jbG9uZSgoY2xvbmVkKSA9PiByZXNvbHZlKGNsb25lZCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRlbXBFZGl0YWJsZUNhbnZhcy5hZGQoY2xvbmVkT2JqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRlc2lnbkRhdGFVcmwgPSB0ZW1wRWRpdGFibGVDYW52YXMudG9EYXRhVVJMKHtcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdwbmcnLFxuICAgICAgICAgICAgICAgIG11bHRpcGxpZXI6IDEwLFxuICAgICAgICAgICAgICAgIHF1YWxpdHk6IDEuMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBlbXB0eURhdGFVcmwgPSAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBRUFBQUFCQ0FZQUFBQWZGY1NKQUFBQURVbEVRVlI0Mm1Oa1lQaGZEd0FDaHdHQTYwZTZrZ0FBQUFCSlJVNUVya0pnZ2c9PSc7XG4gICAgICAgICAgICBpZiAoZGVzaWduRGF0YVVybCAhPT0gZW1wdHlEYXRhVXJsICYmIGRlc2lnbkRhdGFVcmwubGVuZ3RoID4gZW1wdHlEYXRhVXJsLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlc2lnbkltZyA9IGF3YWl0IHRoaXMubG9hZEltYWdlKGRlc2lnbkRhdGFVcmwpO1xuICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoZGVzaWduSW1nLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCU0L7QsdCw0LLQu9C10L3RiyDQvtCx0YrQtdC60YLRiyDQtNC40LfQsNC50L3QsCDQsdC10Lcg0LPRgNCw0L3QuNGGINC00LvRjyAke3NpZGV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZW1wRWRpdGFibGVDYW52YXMuZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZXhwb3J0XSDQntGI0LjQsdC60LAg0YHQvtC30LTQsNC90LjRjyDQtNC40LfQsNC50L3QsCDQsdC10Lcg0LPRgNCw0L3QuNGGINC00LvRjyAke3NpZGV9OmAsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmaWx0ZXJEZXNpZ25PYmplY3RzKGFsbE9iamVjdHMpIHtcbiAgICAgICAgY29uc3Qgc2VydmljZU9iamVjdE5hbWVzID0gbmV3IFNldChbXG4gICAgICAgICAgICBcImFyZWE6Ym9yZGVyXCIsXG4gICAgICAgICAgICBcImFyZWE6Y2xpcFwiLFxuICAgICAgICAgICAgXCJndWlkZWxpbmVcIixcbiAgICAgICAgICAgIFwiZ3VpZGVsaW5lOnZlcnRpY2FsXCIsXG4gICAgICAgICAgICBcImd1aWRlbGluZTpob3Jpem9udGFsXCJcbiAgICAgICAgXSk7XG4gICAgICAgIHJldHVybiBhbGxPYmplY3RzLmZpbHRlcigob2JqKSA9PiAhc2VydmljZU9iamVjdE5hbWVzLmhhcyhvYmoubmFtZSkpO1xuICAgIH1cbiAgICBhc3luYyBleHBvcnREZXNpZ25XaXRoQ2xpcFBhdGgoZWRpdGFibGVDYW52YXMsIGxheWVyc0NhbnZhcywgc2lkZSwgcmVzb2x1dGlvbikge1xuICAgICAgICBjb25zdCBxdWFsaXR5TXVsdGlwbGllciA9IDEwO1xuICAgICAgICBjb25zdCBjbGlwUGF0aCA9IGVkaXRhYmxlQ2FudmFzLmNsaXBQYXRoO1xuICAgICAgICBpZiAoIWNsaXBQYXRoKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tleHBvcnRdIGNsaXBQYXRoINC90LUg0L3QsNC50LTQtdC9LCDRjdC60YHQv9C+0YDRgtC40YDRg9C10Lwg0LLQtdGB0YwgY2FudmFzJyk7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jcmVhdGVEZXNpZ25DYW52YXMoZWRpdGFibGVDYW52YXMsIGxheWVyc0NhbnZhcywgc2lkZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2xpcFdpZHRoID0gY2xpcFBhdGgud2lkdGg7XG4gICAgICAgIGNvbnN0IGNsaXBIZWlnaHQgPSBjbGlwUGF0aC5oZWlnaHQ7XG4gICAgICAgIGNvbnN0IGNsaXBMZWZ0ID0gY2xpcFBhdGgubGVmdDtcbiAgICAgICAgY29uc3QgY2xpcFRvcCA9IGNsaXBQYXRoLnRvcDtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0gY2xpcFBhdGg6ICR7Y2xpcFdpZHRofXgke2NsaXBIZWlnaHR9IGF0ICgke2NsaXBMZWZ0fSwgJHtjbGlwVG9wfSlgKTtcbiAgICAgICAgY29uc3QgZnVsbERlc2lnbkNhbnZhcyA9IGF3YWl0IHRoaXMuY3JlYXRlRGVzaWduQ2FudmFzKGVkaXRhYmxlQ2FudmFzLCBsYXllcnNDYW52YXMsIHNpZGUpO1xuICAgICAgICBjb25zdCBzY2FsZSA9IHJlc29sdXRpb24gLyBNYXRoLm1heChjbGlwV2lkdGgsIGNsaXBIZWlnaHQpO1xuICAgICAgICBjb25zdCBjcm9wcGVkQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGNyb3BwZWRDYW52YXMud2lkdGggPSBjbGlwV2lkdGggKiBzY2FsZTtcbiAgICAgICAgY3JvcHBlZENhbnZhcy5oZWlnaHQgPSBjbGlwSGVpZ2h0ICogc2NhbGU7XG4gICAgICAgIGNvbnN0IGN0eCA9IGNyb3BwZWRDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgY29uc3Qgc291cmNlU2NhbGUgPSBxdWFsaXR5TXVsdGlwbGllcjtcbiAgICAgICAgY3R4LmRyYXdJbWFnZShmdWxsRGVzaWduQ2FudmFzLCBjbGlwTGVmdCAqIHNvdXJjZVNjYWxlLCBjbGlwVG9wICogc291cmNlU2NhbGUsIGNsaXBXaWR0aCAqIHNvdXJjZVNjYWxlLCBjbGlwSGVpZ2h0ICogc291cmNlU2NhbGUsIDAsIDAsIGNyb3BwZWRDYW52YXMud2lkdGgsIGNyb3BwZWRDYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0JTQuNC30LDQudC9INC+0LHRgNC10LfQsNC9INC/0L4gY2xpcFBhdGg6ICR7Y3JvcHBlZENhbnZhcy53aWR0aH14JHtjcm9wcGVkQ2FudmFzLmhlaWdodH1weGApO1xuICAgICAgICByZXR1cm4gY3JvcHBlZENhbnZhcztcbiAgICB9XG4gICAgYXN5bmMgdXBsb2FkRGVzaWduVG9TZXJ2ZXIoZGVzaWducykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2V4cG9ydF0g0JfQsNCz0YDRg9C30LrQsCDQtNC40LfQsNC50L3QsCDQvdCwINGB0LXRgNCy0LXRgCcpO1xuICAgICAgICAgICAgY29uc3QgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgW3NpZGUsIGRhdGFVcmxdIG9mIE9iamVjdC5lbnRyaWVzKGRlc2lnbnMpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChkYXRhVXJsKTtcbiAgICAgICAgICAgICAgICBjb25zdCBibG9iID0gYXdhaXQgcmVzcG9uc2UuYmxvYigpO1xuICAgICAgICAgICAgICAgIGZvcm1EYXRhLmFwcGVuZChzaWRlLCBibG9iLCBgJHtzaWRlfS5wbmdgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2V4cG9ydF0g0JfQsNCz0YDRg9C30LrQsCDQvdCwINGB0LXRgNCy0LXRgCDQvdC1INGA0LXQsNC70LjQt9C+0LLQsNC90LAnKTtcbiAgICAgICAgICAgIHJldHVybiBkZXNpZ25zO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2V4cG9ydF0g0J7RiNC40LHQutCwINC/0YDQuCDQt9Cw0LPRgNGD0LfQutC1INC90LAg0YHQtdGA0LLQtdGAOicsIGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNhdmVMYXllcnNUb0hpc3RvcnkoKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPCB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgdGhpcy5sYXllcnNIaXN0b3J5ID0gdGhpcy5sYXllcnNIaXN0b3J5LnNsaWNlKDAsIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCArIDEpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxheWVyc0NvcHkgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRoaXMubGF5b3V0cykpO1xuICAgICAgICBjb25zdCBoaXN0b3J5SXRlbSA9IHtcbiAgICAgICAgICAgIGxheWVyczogbGF5ZXJzQ29weS5tYXAoKGRhdGEpID0+IG5ldyBMYXlvdXQoZGF0YSkpLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMubGF5ZXJzSGlzdG9yeS5wdXNoKGhpc3RvcnlJdGVtKTtcbiAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID0gdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDE7XG4gICAgICAgIGNvbnN0IE1BWF9ISVNUT1JZX1NJWkUgPSA1MDtcbiAgICAgICAgaWYgKHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggPiBNQVhfSElTVE9SWV9TSVpFKSB7XG4gICAgICAgICAgICB0aGlzLmxheWVyc0hpc3Rvcnkuc2hpZnQoKTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleC0tO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtoaXN0b3J5XSDQodC+0YXRgNCw0L3QtdC90L4g0YHQvtGB0YLQvtGP0L3QuNC1INGB0LvQvtGR0LIuINCY0L3QtNC10LrRgTogJHt0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXh9LCDQktGB0LXQs9C+OiAke3RoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGh9LCDQodC70L7RkdCyOiAke3RoaXMubGF5b3V0cy5sZW5ndGh9YCk7XG4gICAgICAgIHRoaXMudXBkYXRlSGlzdG9yeUJ1dHRvbnNTdGF0ZSgpO1xuICAgIH1cbiAgICBjYW5VbmRvKCkge1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID09PSB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggPj0gMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPiAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNhblJlZG8oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPCB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMTtcbiAgICB9XG4gICAgdXBkYXRlSGlzdG9yeUJ1dHRvbnNTdGF0ZSgpIHtcbiAgICAgICAgY29uc3QgY2FuVW5kbyA9IHRoaXMuY2FuVW5kbygpO1xuICAgICAgICBjb25zdCBjYW5SZWRvID0gdGhpcy5jYW5SZWRvKCk7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2sgJiYgdGhpcy5lZGl0b3JIaXN0b3J5VW5kb0Jsb2NrLmZpcnN0RWxlbWVudENoaWxkKSB7XG4gICAgICAgICAgICBjb25zdCB1bmRvQnV0dG9uID0gdGhpcy5lZGl0b3JIaXN0b3J5VW5kb0Jsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgaWYgKGNhblVuZG8pIHtcbiAgICAgICAgICAgICAgICB1bmRvQnV0dG9uLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcnO1xuICAgICAgICAgICAgICAgIHVuZG9CdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdW5kb0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnI2YyZjJmMic7XG4gICAgICAgICAgICAgICAgdW5kb0J1dHRvbi5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9ySGlzdG9yeVJlZG9CbG9jayAmJiB0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZG9CdXR0b24gPSB0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBpZiAoY2FuUmVkbykge1xuICAgICAgICAgICAgICAgIHJlZG9CdXR0b24uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyc7XG4gICAgICAgICAgICAgICAgcmVkb0J1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWRvQnV0dG9uLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcjZjJmMmYyJztcbiAgICAgICAgICAgICAgICByZWRvQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdbaGlzdG9yeV0g0KHQvtGB0YLQvtGP0L3QuNC1INC60L3QvtC/0L7QujogdW5kbyA9JywgY2FuVW5kbywgJywgcmVkbyA9JywgY2FuUmVkbyk7XG4gICAgfVxuICAgIGFzeW5jIHVuZG8oKSB7XG4gICAgICAgIGlmICghdGhpcy5jYW5VbmRvKCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5XSBVbmRvINC90LXQstC+0LfQvNC+0LbQtdC9Jyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA9PT0gdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDEgJiYgdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPSB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA9IE1hdGgubWF4KDAsIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCAtIDEpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGhpc3RvcnlJdGVtID0gdGhpcy5sYXllcnNIaXN0b3J5W3RoaXMuY3VycmVudEhpc3RvcnlJbmRleF07XG4gICAgICAgIGlmICghaGlzdG9yeUl0ZW0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2hpc3RvcnldINCY0YHRgtC+0YDQuNGPINC90LUg0L3QsNC50LTQtdC90LAnKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKGBbaGlzdG9yeV0gVW5kbyDQuiDQuNC90LTQtdC60YHRgyAke3RoaXMuY3VycmVudEhpc3RvcnlJbmRleH0g0LjQtyAke3RoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxfWApO1xuICAgICAgICBhd2FpdCB0aGlzLnJlc3RvcmVMYXllcnNGcm9tSGlzdG9yeShoaXN0b3J5SXRlbSk7XG4gICAgICAgIHRoaXMudXBkYXRlSGlzdG9yeUJ1dHRvbnNTdGF0ZSgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgYXN5bmMgcmVkbygpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhblJlZG8oKSkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnldIFJlZG8g0L3QtdCy0L7Qt9C80L7QttC10L0nKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXgrKztcbiAgICAgICAgY29uc3QgaGlzdG9yeUl0ZW0gPSB0aGlzLmxheWVyc0hpc3RvcnlbdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4XTtcbiAgICAgICAgaWYgKCFoaXN0b3J5SXRlbSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbaGlzdG9yeV0g0JjRgdGC0L7RgNC40Y8g0L3QtSDQvdCw0LnQtNC10L3QsCcpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtoaXN0b3J5XSBSZWRvINC6INC40L3QtNC10LrRgdGDICR7dGhpcy5jdXJyZW50SGlzdG9yeUluZGV4fSDQuNC3ICR7dGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDF9YCk7XG4gICAgICAgIGF3YWl0IHRoaXMucmVzdG9yZUxheWVyc0Zyb21IaXN0b3J5KGhpc3RvcnlJdGVtKTtcbiAgICAgICAgdGhpcy51cGRhdGVIaXN0b3J5QnV0dG9uc1N0YXRlKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBhc3luYyByZXN0b3JlTGF5ZXJzRnJvbUhpc3RvcnkoaGlzdG9yeUl0ZW0pIHtcbiAgICAgICAgdGhpcy5pc1Jlc3RvcmluZ0Zyb21IaXN0b3J5ID0gdHJ1ZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0cyA9IFtdO1xuICAgICAgICAgICAgaGlzdG9yeUl0ZW0ubGF5ZXJzLmZvckVhY2gobGF5b3V0ID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmxheW91dHMucHVzaChuZXcgTGF5b3V0KGxheW91dCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2hpc3RvcnldINCS0L7RgdGB0YLQsNC90L7QstC70LXQvdC+ICR7dGhpcy5sYXlvdXRzLmxlbmd0aH0g0YHQu9C+0ZHQsmApO1xuICAgICAgICB9XG4gICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5pc1Jlc3RvcmluZ0Zyb21IaXN0b3J5ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2VkaXRvcl0g0J7Rh9C40YHRgtC60LAg0YDQtdGB0YPRgNGB0L7QsiDRgNC10LTQsNC60YLQvtGA0LAnKTtcbiAgICAgICAgaWYgKHRoaXMubG9hZGluZ0ludGVydmFsKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMubG9hZGluZ0ludGVydmFsKTtcbiAgICAgICAgICAgIHRoaXMubG9hZGluZ0ludGVydmFsID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV2ZW50cy5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuY2FudmFzZXMuZm9yRWFjaChjYW52YXMgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjYW52YXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tjbGVhbnVwXSDQntGI0LjQsdC60LAg0L7Rh9C40YHRgtC60LggY2FudmFzOicsIGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNhbnZhc2VzID0gW107XG4gICAgICAgIHRoaXMubGF5ZXJzQ2FudmFzZXMuZm9yRWFjaChjYW52YXMgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjYW52YXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tjbGVhbnVwXSDQntGI0LjQsdC60LAg0L7Rh9C40YHRgtC60LggbGF5ZXIgY2FudmFzOicsIGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzID0gW107XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tlZGl0b3JdINCg0LXRgdGD0YDRgdGLINGD0YHQv9C10YjQvdC+INC+0YfQuNGJ0LXQvdGLJyk7XG4gICAgfVxuICAgIGdldEN1cnJlbnRTdGF0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IHRoaXMuX3NlbGVjdFR5cGUsXG4gICAgICAgICAgICBjb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IsXG4gICAgICAgICAgICBzaWRlOiB0aGlzLl9zZWxlY3RTaWRlLFxuICAgICAgICAgICAgc2l6ZTogdGhpcy5fc2VsZWN0U2l6ZSxcbiAgICAgICAgICAgIGxheW91dHM6IHRoaXMubGF5b3V0cyxcbiAgICAgICAgICAgIGlzTG9hZGluZzogdGhpcy5pc0xvYWRpbmcsXG4gICAgICAgIH07XG4gICAgfVxufVxuIiwiY29uc3QgcG9wdXBMb2dnZXIgPSBjb25zb2xlLmRlYnVnLmJpbmQoY29uc29sZSwgJ1tQb3B1cF0nKTtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBvcHVwIHtcbiAgICBjb25zdHJ1Y3Rvcih7IHBvcHVwSWQsIHBvcHVwQ29udGVudENsYXNzLCBjbG9zZUJ1dHRvbkNsYXNzLCB0aW1lb3V0U2Vjb25kcyA9IDEwLCBhdXRvU2hvdyA9IHRydWUsIGNvb2tpZU5hbWUgPSAncG9wdXAnLCBjb29raWVFeHBpcmVzRGF5cyA9IDEsIH0pIHtcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbiA9IG51bGw7XG4gICAgICAgIHRoaXMuYXV0b1Nob3cgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5hdXRvU2hvd1RpbWVvdXQgPSBudWxsO1xuICAgICAgICB0aGlzLnRpbWVvdXRTZWNvbmRzID0gMjU7XG4gICAgICAgIHRoaXMuY29va2llTmFtZSA9IFwicG9wdXBcIjtcbiAgICAgICAgdGhpcy5jb29raWVFeHBpcmVzRGF5cyA9IDE7XG4gICAgICAgIGlmICghcG9wdXBJZCB8fCAhcG9wdXBDb250ZW50Q2xhc3MpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tQb3B1cF0gcG9wdXBJZCBvciBwb3B1cENvbnRlbnRDbGFzcyBpcyBub3QgcHJvdmlkZWQnKTtcbiAgICAgICAgY29uc3QgZmluZFBvcHVwQmxvY2sgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwb3B1cElkKTtcbiAgICAgICAgaWYgKCFmaW5kUG9wdXBCbG9jaykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQb3B1cCBibG9jayB3aXRoIGlkICR7cG9wdXBJZH0gbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmluZFBvcHVwQ29udGVudEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLiR7cG9wdXBDb250ZW50Q2xhc3N9YCk7XG4gICAgICAgIGlmICghZmluZFBvcHVwQ29udGVudEJsb2NrKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBvcHVwIGNvbnRlbnQgYmxvY2sgd2l0aCBjbGFzcyAke3BvcHVwQ29udGVudENsYXNzfSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBvcHVwQmxvY2sgPSBmaW5kUG9wdXBCbG9jaztcbiAgICAgICAgdGhpcy5wb3B1cENvbnRlbnRCbG9jayA9IGZpbmRQb3B1cENvbnRlbnRCbG9jaztcbiAgICAgICAgdGhpcy5pbml0UG9wdXBCbG9jaygpO1xuICAgICAgICB0aGlzLnBvcHVwV3JhcHBlckJsb2NrID0gdGhpcy5pbml0UG9wdXBXcmFwcGVyKCk7XG4gICAgICAgIGNvbnN0IGZpbmRDbG9zZUJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke2Nsb3NlQnV0dG9uQ2xhc3N9YCk7XG4gICAgICAgIGlmICghZmluZENsb3NlQnV0dG9uKSB7XG4gICAgICAgICAgICBwb3B1cExvZ2dlcihgY2xvc2UgYnV0dG9uIHdpdGggY2xhc3MgJHtjbG9zZUJ1dHRvbkNsYXNzfSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNsb3NlQnV0dG9uID0gZmluZENsb3NlQnV0dG9uO1xuICAgICAgICB0aGlzLmluaXRDbG9zZUJ1dHRvbigpO1xuICAgICAgICBpZiAodGltZW91dFNlY29uZHMpIHtcbiAgICAgICAgICAgIHRoaXMudGltZW91dFNlY29uZHMgPSB0aW1lb3V0U2Vjb25kcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXV0b1Nob3cpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0b1Nob3cgPSBhdXRvU2hvdztcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29va2llTmFtZSkge1xuICAgICAgICAgICAgdGhpcy5jb29raWVOYW1lID0gY29va2llTmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29va2llRXhwaXJlc0RheXMpIHtcbiAgICAgICAgICAgIHRoaXMuY29va2llRXhwaXJlc0RheXMgPSBjb29raWVFeHBpcmVzRGF5cztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wb3B1cEJsb2NrICYmIHRoaXMuY2xvc2VCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEF1dG9TaG93KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5pdFBvcHVwV3JhcHBlcigpIHtcbiAgICAgICAgY29uc3QgcG9wdXBXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLmlkID0gJ3BvcHVwLXdyYXBwZXInO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUucG9zaXRpb24gPSAnZml4ZWQnO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUucmlnaHQgPSAnMCc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS5ib3R0b20gPSAnMCc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLnpJbmRleCA9ICc5OTk5JztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgICAgIHJldHVybiBwb3B1cFdyYXBwZXI7XG4gICAgfVxuICAgIGluaXRQb3B1cEJsb2NrKCkge1xuICAgICAgICB0aGlzLnBvcHVwQmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9XG4gICAgaW5pdENsb3NlQnV0dG9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuY2xvc2VCdXR0b24pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuY2xvc2VCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmNsb3NlQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNsb3NlKCk7XG4gICAgfVxuICAgIGluaXRBdXRvU2hvdygpIHtcbiAgICAgICAgaWYgKHRoaXMuYXV0b1Nob3cgJiYgIWRvY3VtZW50LmNvb2tpZS5pbmNsdWRlcyhgJHt0aGlzLmNvb2tpZU5hbWV9PXRydWVgKSkge1xuICAgICAgICAgICAgdGhpcy5hdXRvU2hvd1RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuc2hvdygpLCB0aGlzLnRpbWVvdXRTZWNvbmRzICogMTAwMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwb3B1cExvZ2dlcignaXMgbm90IGF1dG8gc2hvd24nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzaG93KCkge1xuICAgICAgICB0aGlzLnBvcHVwV3JhcHBlckJsb2NrLmFwcGVuZENoaWxkKHRoaXMucG9wdXBCbG9jayk7XG4gICAgICAgIHRoaXMucG9wdXBDb250ZW50QmxvY2suc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgdGhpcy5wb3B1cEJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMucG9wdXBXcmFwcGVyQmxvY2spO1xuICAgIH1cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXJCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBkb2N1bWVudC5jb29raWUgPSBgJHt0aGlzLmNvb2tpZU5hbWV9PXRydWU7IGV4cGlyZXM9JHtuZXcgRGF0ZShEYXRlLm5vdygpICsgdGhpcy5jb29raWVFeHBpcmVzRGF5cyAqIDI0ICogNjAgKiA2MCAqIDEwMDApLnRvVVRDU3RyaW5nKCl9OyBwYXRoPS87YDtcbiAgICB9XG59XG4iLCJleHBvcnQgY2xhc3MgRWRpdG9yU3RvcmFnZU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmRhdGFiYXNlID0gbnVsbDtcbiAgICAgICAgdGhpcy5pc1JlYWR5ID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVhZHlQcm9taXNlID0gdGhpcy5pbml0KCk7XG4gICAgfVxuICAgIGFzeW5jIGluaXQoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBvcGVuUmVxdWVzdCA9IGluZGV4ZWREQi5vcGVuKFwiZWRpdG9yXCIsIDIpO1xuICAgICAgICAgICAgb3BlblJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0YWJhc2UgPSBldmVudC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICAgIGlmICghZGF0YWJhc2Uub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucygnaGlzdG9yeScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLmNyZWF0ZU9iamVjdFN0b3JlKCdoaXN0b3J5JywgeyBrZXlQYXRoOiAnaWQnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWRhdGFiYXNlLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoJ2VkaXRvcl9zdGF0ZScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLmNyZWF0ZU9iamVjdFN0b3JlKCdlZGl0b3Jfc3RhdGUnLCB7IGtleVBhdGg6ICdrZXknIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWRhdGFiYXNlLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoJ3VzZXJfZGF0YScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLmNyZWF0ZU9iamVjdFN0b3JlKCd1c2VyX2RhdGEnLCB7IGtleVBhdGg6ICdrZXknIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBvcGVuUmVxdWVzdC5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLQntGI0LjQsdC60LAg0L7RgtC60YDRi9GC0LjRjyBJbmRleGVkREJcIiwgb3BlblJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlamVjdChvcGVuUmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgb3BlblJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YWJhc2UgPSBvcGVuUmVxdWVzdC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgdGhpcy5pc1JlYWR5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgd2FpdEZvclJlYWR5KCkge1xuICAgICAgICBhd2FpdCB0aGlzLnJlYWR5UHJvbWlzZTtcbiAgICB9XG4gICAgYXN5bmMgc2F2ZUVkaXRvclN0YXRlKHN0YXRlKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydlZGl0b3Jfc3RhdGUnXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdlZGl0b3Jfc3RhdGUnKTtcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgdGhpcy5wdXREYXRhKG9iamVjdFN0b3JlLCAnZGF0ZScsIHN0YXRlLmRhdGUpLFxuICAgICAgICAgICAgdGhpcy5wdXREYXRhKG9iamVjdFN0b3JlLCAnY29sb3InLCBzdGF0ZS5jb2xvciksXG4gICAgICAgICAgICB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICdzaWRlJywgc3RhdGUuc2lkZSksXG4gICAgICAgICAgICB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICd0eXBlJywgc3RhdGUudHlwZSksXG4gICAgICAgICAgICB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICdzaXplJywgc3RhdGUuc2l6ZSlcbiAgICAgICAgXSk7XG4gICAgfVxuICAgIGFzeW5jIGxvYWRFZGl0b3JTdGF0ZSgpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2VkaXRvcl9zdGF0ZSddLCAncmVhZG9ubHknKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnZWRpdG9yX3N0YXRlJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBbZGF0ZSwgY29sb3IsIHNpZGUsIHR5cGUsIHNpemVdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ2RhdGUnKSxcbiAgICAgICAgICAgICAgICB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICdjb2xvcicpLFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ3NpZGUnKSxcbiAgICAgICAgICAgICAgICB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICd0eXBlJyksXG4gICAgICAgICAgICAgICAgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAnc2l6ZScpXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIGlmICghZGF0ZSB8fCAhY29sb3IgfHwgIXNpZGUgfHwgIXR5cGUgfHwgIXNpemUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZGF0ZSxcbiAgICAgICAgICAgICAgICBjb2xvcixcbiAgICAgICAgICAgICAgICBzaWRlLFxuICAgICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgICAgc2l6ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ9Ce0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4INGB0L7RgdGC0L7Rj9C90LjRjyDRgNC10LTQsNC60YLQvtGA0LA6JywgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgY2xlYXJFZGl0b3JTdGF0ZSgpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2VkaXRvcl9zdGF0ZSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2VkaXRvcl9zdGF0ZScpO1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZURhdGEob2JqZWN0U3RvcmUsICdkYXRlJyksXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZURhdGEob2JqZWN0U3RvcmUsICdjb2xvcicpLFxuICAgICAgICAgICAgdGhpcy5kZWxldGVEYXRhKG9iamVjdFN0b3JlLCAnc2lkZScpLFxuICAgICAgICAgICAgdGhpcy5kZWxldGVEYXRhKG9iamVjdFN0b3JlLCAndHlwZScpLFxuICAgICAgICAgICAgdGhpcy5kZWxldGVEYXRhKG9iamVjdFN0b3JlLCAnc2l6ZScpXG4gICAgICAgIF0pO1xuICAgIH1cbiAgICBhc3luYyBnZXRVc2VySWQoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWyd1c2VyX2RhdGEnXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd1c2VyX2RhdGEnKTtcbiAgICAgICAgbGV0IHVzZXJJZCA9IGF3YWl0IHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ3VzZXJJZCcpO1xuICAgICAgICBpZiAoIXVzZXJJZCkge1xuICAgICAgICAgICAgdXNlcklkID0gY3J5cHRvLnJhbmRvbVVVSUQoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ3VzZXJJZCcsIHVzZXJJZCk7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHdpbmRvdy5PcGVuUmVwbGF5LnNldFVzZXJJRCh1c2VySWQpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcign0J7RiNC40LHQutCwINGD0YHRgtCw0L3QvtCy0LrQuCBJRCDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8g0LIgdHJhY2tlcjonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVzZXJJZDtcbiAgICB9XG4gICAgYXN5bmMgc2F2ZVRvSGlzdG9yeShpdGVtLCBkZXNjcmlwdGlvbikge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgaGlzdG9yeUl0ZW0gPSB7XG4gICAgICAgICAgICAuLi5pdGVtLFxuICAgICAgICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24gfHwgYNCY0LfQvNC10L3QtdC90LjRjyDQvtGCICR7bmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpfWBcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmFkZChoaXN0b3J5SXRlbSk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBoaXN0b3J5SXRlbS5pZDtcbiAgICB9XG4gICAgYXN5bmMgc2F2ZUxheWVyT3BlcmF0aW9uKG9wZXJhdGlvbiwgbGF5b3V0LCBzaWRlLCB0eXBlLCBkZXNjcmlwdGlvbikge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgbGF5ZXJIaXN0b3J5SXRlbSA9IHtcbiAgICAgICAgICAgIGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgb3BlcmF0aW9uLFxuICAgICAgICAgICAgbGF5b3V0OiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGxheW91dCkpLFxuICAgICAgICAgICAgc2lkZSxcbiAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24gfHwgYCR7b3BlcmF0aW9uID09PSAnYWRkJyA/ICfQlNC+0LHQsNCy0LvQtdC9JyA6ICfQo9C00LDQu9C10L0nfSDRgdC70L7QuTogJHtsYXlvdXQubmFtZSB8fCBsYXlvdXQudHlwZX1gXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5hZGQoeyAuLi5sYXllckhpc3RvcnlJdGVtLCBpc0xheWVyT3BlcmF0aW9uOiB0cnVlIH0pO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbGF5ZXJIaXN0b3J5SXRlbS5pZDtcbiAgICB9XG4gICAgYXN5bmMgZ2V0TGF5ZXJIaXN0b3J5KGZpbHRlciwgbGltaXQgPSA1MCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZG9ubHknKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmdldEFsbCgpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsSXRlbXMgPSByZXF1ZXN0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICBjb25zdCBsYXllck9wZXJhdGlvbnMgPSBhbGxJdGVtc1xuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKChpdGVtKSA9PiBpdGVtLmlzTGF5ZXJPcGVyYXRpb24gJiYgaXRlbS5zaWRlID09PSBmaWx0ZXIuc2lkZSAmJiBpdGVtLnR5cGUgPT09IGZpbHRlci50eXBlKVxuICAgICAgICAgICAgICAgICAgICAubWFwKChpdGVtKSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICBpZDogaXRlbS5pZCxcbiAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wOiBpdGVtLnRpbWVzdGFtcCxcbiAgICAgICAgICAgICAgICAgICAgb3BlcmF0aW9uOiBpdGVtLm9wZXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgbGF5b3V0OiBpdGVtLmxheW91dCxcbiAgICAgICAgICAgICAgICAgICAgc2lkZTogaXRlbS5zaWRlLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBpdGVtLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBpdGVtLmRlc2NyaXB0aW9uXG4gICAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiBiLnRpbWVzdGFtcCAtIGEudGltZXN0YW1wKVxuICAgICAgICAgICAgICAgICAgICAuc2xpY2UoMCwgbGltaXQpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUobGF5ZXJPcGVyYXRpb25zKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBnZXRSZWNlbnRMYXllck9wZXJhdGlvbnMoZmlsdGVyLCBsaW1pdCA9IDEwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldExheWVySGlzdG9yeShmaWx0ZXIsIGxpbWl0KTtcbiAgICB9XG4gICAgYXN5bmMgZ2V0SGlzdG9yeShmaWx0ZXIsIGxpbWl0ID0gNTApIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWRvbmx5Jyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5nZXRBbGwoKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsbEl0ZW1zID0gcmVxdWVzdC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyZWRJdGVtcyA9IGFsbEl0ZW1zXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoaXRlbSA9PiBpdGVtLnNpZGUgPT09IGZpbHRlci5zaWRlICYmIGl0ZW0udHlwZSA9PT0gZmlsdGVyLnR5cGUpXG4gICAgICAgICAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiBiLnRpbWVzdGFtcCAtIGEudGltZXN0YW1wKVxuICAgICAgICAgICAgICAgICAgICAuc2xpY2UoMCwgbGltaXQpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZmlsdGVyZWRJdGVtcyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgZ2V0SGlzdG9yeUl0ZW0oaWQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWRvbmx5Jyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5nZXQoaWQpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKHJlcXVlc3QucmVzdWx0IHx8IG51bGwpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgZGVsZXRlSGlzdG9yeUl0ZW0oaWQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5kZWxldGUoaWQpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBjbGVhckhpc3RvcnkoZmlsdGVyKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydoaXN0b3J5J10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICBpZiAoIWZpbHRlcikge1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5jbGVhcigpO1xuICAgICAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgYWxsSXRlbXMgPSBhd2FpdCB0aGlzLmdldEhpc3RvcnkoZmlsdGVyLCAxMDAwKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBhbGxJdGVtcykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZGVsZXRlSGlzdG9yeUl0ZW0oaXRlbS5pZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgc2F2ZUxheWVycyhsYXllcnMpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2VkaXRvcl9zdGF0ZSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2VkaXRvcl9zdGF0ZScpO1xuICAgICAgICBhd2FpdCB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICdsYXllcnMnLCBsYXllcnMpO1xuICAgIH1cbiAgICBhc3luYyBsb2FkTGF5ZXJzKCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2VkaXRvcl9zdGF0ZSddLCAncmVhZG9ubHknKTtcbiAgICAgICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2VkaXRvcl9zdGF0ZScpO1xuICAgICAgICAgICAgY29uc3QgbGF5ZXJzID0gYXdhaXQgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAnbGF5ZXJzJyk7XG4gICAgICAgICAgICByZXR1cm4gbGF5ZXJzIHx8IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCDRgdC70L7RkdCyOicsIGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHB1dERhdGEob2JqZWN0U3RvcmUsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5wdXQoeyBrZXksIHZhbHVlIH0pO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXREYXRhKG9iamVjdFN0b3JlLCBrZXkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5nZXQoa2V5KTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZShyZXF1ZXN0LnJlc3VsdD8udmFsdWUgfHwgbnVsbCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBkZWxldGVEYXRhKG9iamVjdFN0b3JlLCBrZXkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCJjb25zdCBERUZBVUxUX1ZBTFVFUyA9IHtcbiAgICBQT1NJVElPTjogeyB4OiAwLjUsIHk6IDAuNSB9LFxuICAgIFNJWkU6IDEsXG4gICAgQVNQRUNUX1JBVElPOiAxLFxuICAgIEFOR0xFOiAwLFxuICAgIFRFWFQ6ICdQcmludExvb3AnLFxuICAgIEZPTlQ6IHsgZmFtaWx5OiAnQXJpYWwnLCBzaXplOiAxMiB9LFxufTtcbmV4cG9ydCBjbGFzcyBMYXlvdXQge1xuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHRoaXMuaWQgPSBwcm9wcy5pZCB8fCBMYXlvdXQuZ2VuZXJhdGVJZCgpO1xuICAgICAgICB0aGlzLnR5cGUgPSBwcm9wcy50eXBlO1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gcHJvcHMucG9zaXRpb24gfHwgeyAuLi5ERUZBVUxUX1ZBTFVFUy5QT1NJVElPTiB9O1xuICAgICAgICB0aGlzLnNpemUgPSB0aGlzLnZhbGlkYXRlU2l6ZShwcm9wcy5zaXplID8/IERFRkFVTFRfVkFMVUVTLlNJWkUpO1xuICAgICAgICB0aGlzLmFzcGVjdFJhdGlvID0gdGhpcy52YWxpZGF0ZUFzcGVjdFJhdGlvKHByb3BzLmFzcGVjdFJhdGlvID8/IERFRkFVTFRfVkFMVUVTLkFTUEVDVF9SQVRJTyk7XG4gICAgICAgIHRoaXMudmlldyA9IHByb3BzLnZpZXc7XG4gICAgICAgIHRoaXMuYW5nbGUgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKHByb3BzLmFuZ2xlID8/IERFRkFVTFRfVkFMVUVTLkFOR0xFKTtcbiAgICAgICAgdGhpcy5uYW1lID0gcHJvcHMubmFtZSA/PyBudWxsO1xuICAgICAgICB0aGlzLl9yZWxhdGl2ZVdpZHRoID0gcHJvcHMuX3JlbGF0aXZlV2lkdGg7XG4gICAgICAgIGlmIChwcm9wcy50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICB0aGlzLnVybCA9IHByb3BzLnVybDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChwcm9wcy50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgIHRoaXMudGV4dCA9IHByb3BzLnRleHQgfHwgREVGQVVMVF9WQUxVRVMuVEVYVDtcbiAgICAgICAgICAgIHRoaXMuZm9udCA9IHByb3BzLmZvbnQgPyB7IC4uLnByb3BzLmZvbnQgfSA6IHsgLi4uREVGQVVMVF9WQUxVRVMuRk9OVCB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBnZW5lcmF0ZUlkKCkge1xuICAgICAgICBpZiAodHlwZW9mIGNyeXB0byAhPT0gJ3VuZGVmaW5lZCcgJiYgY3J5cHRvLnJhbmRvbVVVSUQpIHtcbiAgICAgICAgICAgIHJldHVybiBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCAxMSl9YDtcbiAgICB9XG4gICAgdmFsaWRhdGVTaXplKHNpemUpIHtcbiAgICAgICAgaWYgKHNpemUgPD0gMCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBJbnZhbGlkIHNpemUgJHtzaXplfSwgdXNpbmcgZGVmYXVsdCAke0RFRkFVTFRfVkFMVUVTLlNJWkV9YCk7XG4gICAgICAgICAgICByZXR1cm4gREVGQVVMVF9WQUxVRVMuU0laRTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2l6ZTtcbiAgICB9XG4gICAgdmFsaWRhdGVBc3BlY3RSYXRpbyhyYXRpbykge1xuICAgICAgICBpZiAocmF0aW8gPD0gMCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBJbnZhbGlkIGFzcGVjdCByYXRpbyAke3JhdGlvfSwgdXNpbmcgZGVmYXVsdCAke0RFRkFVTFRfVkFMVUVTLkFTUEVDVF9SQVRJT31gKTtcbiAgICAgICAgICAgIHJldHVybiBERUZBVUxUX1ZBTFVFUy5BU1BFQ1RfUkFUSU87XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJhdGlvO1xuICAgIH1cbiAgICBub3JtYWxpemVBbmdsZShhbmdsZSkge1xuICAgICAgICBjb25zdCBub3JtYWxpemVkID0gYW5nbGUgJSAzNjA7XG4gICAgICAgIHJldHVybiBub3JtYWxpemVkIDwgMCA/IG5vcm1hbGl6ZWQgKyAzNjAgOiBub3JtYWxpemVkO1xuICAgIH1cbiAgICBpc0ltYWdlTGF5b3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlID09PSAnaW1hZ2UnICYmIHRoaXMudXJsICE9PSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlzVGV4dExheW91dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZSA9PT0gJ3RleHQnICYmIHRoaXMudGV4dCAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZm9udCAhPT0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBzZXRQb3NpdGlvbih4LCB5KSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSB7IHgsIHkgfTtcbiAgICB9XG4gICAgbW92ZShkeCwgZHkpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbi54ICs9IGR4O1xuICAgICAgICB0aGlzLnBvc2l0aW9uLnkgKz0gZHk7XG4gICAgfVxuICAgIHNldFNpemUoc2l6ZSkge1xuICAgICAgICB0aGlzLnNpemUgPSB0aGlzLnZhbGlkYXRlU2l6ZShzaXplKTtcbiAgICB9XG4gICAgcm90YXRlKGFuZ2xlKSB7XG4gICAgICAgIHRoaXMuYW5nbGUgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKHRoaXMuYW5nbGUgKyBhbmdsZSk7XG4gICAgfVxuICAgIHNldEFuZ2xlKGFuZ2xlKSB7XG4gICAgICAgIHRoaXMuYW5nbGUgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKGFuZ2xlKTtcbiAgICB9XG4gICAgc2V0VGV4dCh0ZXh0KSB7XG4gICAgICAgIGlmICh0aGlzLmlzVGV4dExheW91dCgpKSB7XG4gICAgICAgICAgICB0aGlzLnRleHQgPSB0ZXh0O1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldEZvbnQoZm9udCkge1xuICAgICAgICBpZiAodGhpcy5pc1RleHRMYXlvdXQoKSAmJiB0aGlzLmZvbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZm9udCA9IHsgLi4udGhpcy5mb250LCAuLi5mb250IH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2xvbmUoKSB7XG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdpbWFnZScsXG4gICAgICAgICAgICAgICAgdXJsOiB0aGlzLnVybCxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyAuLi50aGlzLnBvc2l0aW9uIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogdGhpcy5zaXplLFxuICAgICAgICAgICAgICAgIGFzcGVjdFJhdGlvOiB0aGlzLmFzcGVjdFJhdGlvLFxuICAgICAgICAgICAgICAgIHZpZXc6IHRoaXMudmlldyxcbiAgICAgICAgICAgICAgICBhbmdsZTogdGhpcy5hbmdsZSxcbiAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgY2xvbmVkID0gbmV3IExheW91dChwcm9wcyk7XG4gICAgICAgICAgICBjbG9uZWQuX3JlbGF0aXZlV2lkdGggPSB0aGlzLl9yZWxhdGl2ZVdpZHRoO1xuICAgICAgICAgICAgcmV0dXJuIGNsb25lZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyAuLi50aGlzLnBvc2l0aW9uIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogdGhpcy5zaXplLFxuICAgICAgICAgICAgICAgIGFzcGVjdFJhdGlvOiB0aGlzLmFzcGVjdFJhdGlvLFxuICAgICAgICAgICAgICAgIHZpZXc6IHRoaXMudmlldyxcbiAgICAgICAgICAgICAgICBhbmdsZTogdGhpcy5hbmdsZSxcbiAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHRoaXMudGV4dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcHJvcHMudGV4dCA9IHRoaXMudGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmZvbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHByb3BzLmZvbnQgPSB7IC4uLnRoaXMuZm9udCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY2xvbmVkID0gbmV3IExheW91dChwcm9wcyk7XG4gICAgICAgICAgICBjbG9uZWQuX3JlbGF0aXZlV2lkdGggPSB0aGlzLl9yZWxhdGl2ZVdpZHRoO1xuICAgICAgICAgICAgcmV0dXJuIGNsb25lZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIGNvbnN0IGJhc2UgPSB7XG4gICAgICAgICAgICBpZDogdGhpcy5pZCxcbiAgICAgICAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLnBvc2l0aW9uLFxuICAgICAgICAgICAgc2l6ZTogdGhpcy5zaXplLFxuICAgICAgICAgICAgYXNwZWN0UmF0aW86IHRoaXMuYXNwZWN0UmF0aW8sXG4gICAgICAgICAgICB2aWV3OiB0aGlzLnZpZXcsXG4gICAgICAgICAgICBhbmdsZTogdGhpcy5hbmdsZSxcbiAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIF9yZWxhdGl2ZVdpZHRoOiB0aGlzLl9yZWxhdGl2ZVdpZHRoLFxuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICByZXR1cm4geyAuLi5iYXNlLCB1cmw6IHRoaXMudXJsIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgIHJldHVybiB7IC4uLmJhc2UsIHRleHQ6IHRoaXMudGV4dCwgZm9udDogdGhpcy5mb250IH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhc2U7XG4gICAgfVxuICAgIHN0YXRpYyBmcm9tSlNPTihqc29uKSB7XG4gICAgICAgIHJldHVybiBuZXcgTGF5b3V0KGpzb24pO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlSW1hZ2UocHJvcHMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMYXlvdXQoeyAuLi5wcm9wcywgdHlwZTogJ2ltYWdlJyB9KTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZVRleHQocHJvcHMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMYXlvdXQoeyAuLi5wcm9wcywgdHlwZTogJ3RleHQnIH0pO1xuICAgIH1cbn1cbiIsImV4cG9ydCBjbGFzcyBUeXBlZEV2ZW50RW1pdHRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBvbihldmVudCwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmxpc3RlbmVycy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5zZXQoZXZlbnQsIG5ldyBTZXQoKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMuZ2V0KGV2ZW50KS5hZGQobGlzdGVuZXIpO1xuICAgIH1cbiAgICBvbmNlKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgICBjb25zdCBvbmNlV3JhcHBlciA9IChkZXRhaWwpID0+IHtcbiAgICAgICAgICAgIGxpc3RlbmVyKGRldGFpbCk7XG4gICAgICAgICAgICB0aGlzLm9mZihldmVudCwgb25jZVdyYXBwZXIpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm9uKGV2ZW50LCBvbmNlV3JhcHBlcik7XG4gICAgfVxuICAgIG9mZihldmVudCwgbGlzdGVuZXIpIHtcbiAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycy5nZXQoZXZlbnQpO1xuICAgICAgICBpZiAoZXZlbnRMaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIGV2ZW50TGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gICAgICAgICAgICBpZiAoZXZlbnRMaXN0ZW5lcnMuc2l6ZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZW1pdChldmVudCwgZGV0YWlsKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50TGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnMuZ2V0KGV2ZW50KTtcbiAgICAgICAgaWYgKGV2ZW50TGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBldmVudExpc3RlbmVycy5mb3JFYWNoKGxpc3RlbmVyID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcihkZXRhaWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW0V2ZW50RW1pdHRlcl0g0J7RiNC40LHQutCwINCyINC+0LHRgNCw0LHQvtGC0YfQuNC60LUg0YHQvtCx0YvRgtC40Y8gXCIke1N0cmluZyhldmVudCl9XCI6YCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShldmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5jbGVhcigpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGxpc3RlbmVyQ291bnQoZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXJzLmdldChldmVudCk/LnNpemUgfHwgMDtcbiAgICB9XG4gICAgaGFzTGlzdGVuZXJzKGV2ZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVyQ291bnQoZXZlbnQpID4gMDtcbiAgICB9XG4gICAgZXZlbnROYW1lcygpIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5saXN0ZW5lcnMua2V5cygpKTtcbiAgICB9XG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMuY2xlYXIoKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBFZGl0b3JTdG9yYWdlTWFuYWdlciB9IGZyb20gJy4uL21hbmFnZXJzL0VkaXRvclN0b3JhZ2VNYW5hZ2VyJztcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUltYWdlKHsgdXJpLCBwcm9tcHQsIHNoaXJ0Q29sb3IsIGltYWdlLCB3aXRoQWksIGxheW91dElkLCBpc05ldyA9IHRydWUsIGJhY2tncm91bmQgPSB0cnVlLCB9KSB7XG4gICAgY29uc3QgdGVtcFN0b3JhZ2VNYW5hZ2VyID0gbmV3IEVkaXRvclN0b3JhZ2VNYW5hZ2VyKCk7XG4gICAgY29uc3QgdXNlcklkID0gYXdhaXQgdGVtcFN0b3JhZ2VNYW5hZ2VyLmdldFVzZXJJZCgpO1xuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgZm9ybURhdGEuc2V0KCd1c2VySWQnLCB1c2VySWQpO1xuICAgIGZvcm1EYXRhLnNldCgncHJvbXB0JywgcHJvbXB0KTtcbiAgICBmb3JtRGF0YS5zZXQoJ3NoaXJ0Q29sb3InLCBzaGlydENvbG9yKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3BsYWNlbWVudCcsICdjZW50ZXInKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3ByaW50U2l6ZScsIFwiYmlnXCIpO1xuICAgIGZvcm1EYXRhLnNldCgndHJhbnNmZXJUeXBlJywgJycpO1xuICAgIGZvcm1EYXRhLnNldCgncmVxdWVzdF90eXBlJywgJ2dlbmVyYXRlJyk7XG4gICAgZm9ybURhdGEuc2V0KCdiYWNrZ3JvdW5kJywgYmFja2dyb3VuZC50b1N0cmluZygpKTtcbiAgICBpZiAobGF5b3V0SWQpXG4gICAgICAgIGZvcm1EYXRhLnNldCgnbGF5b3V0SWQnLCBsYXlvdXRJZCk7XG4gICAgaWYgKGltYWdlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tnZW5lcmF0ZSBpbWFnZV0nLCBpbWFnZSk7XG4gICAgICAgIGNvbnN0IFtoZWFkZXIsIGRhdGFdID0gaW1hZ2Uuc3BsaXQoJywnKTtcbiAgICAgICAgY29uc3QgdHlwZSA9IGhlYWRlci5zcGxpdCgnOicpWzFdLnNwbGl0KCc7JylbMF07XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tnZW5lcmF0ZSBpbWFnZV0gW3R5cGVdJywgdHlwZSk7XG4gICAgICAgIGNvbnN0IGJ5dGVDaGFyYWN0ZXJzID0gYXRvYihkYXRhKTtcbiAgICAgICAgY29uc3QgYnl0ZU51bWJlcnMgPSBuZXcgQXJyYXkoYnl0ZUNoYXJhY3RlcnMubGVuZ3RoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBieXRlQ2hhcmFjdGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYnl0ZU51bWJlcnNbaV0gPSBieXRlQ2hhcmFjdGVycy5jaGFyQ29kZUF0KGkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KGJ5dGVOdW1iZXJzKTtcbiAgICAgICAgZm9ybURhdGEuc2V0KCdyZXF1ZXN0X3R5cGUnLCAnaW1hZ2UnKTtcbiAgICAgICAgZm9ybURhdGEuc2V0KCd1c2VyX2ltYWdlJywgbmV3IEJsb2IoW2J5dGVBcnJheV0sIHsgdHlwZTogXCJpbWFnZS9wbmdcIiB9KSk7XG4gICAgICAgIGZvcm1EYXRhLnNldCgndHJhbnNmZXJUeXBlJywgd2l0aEFpID8gXCJhaVwiIDogXCJuby1haVwiKTtcbiAgICB9XG4gICAgaWYgKCFpc05ldykge1xuICAgICAgICBmb3JtRGF0YS5zZXQoJ3JlcXVlc3RfdHlwZScsICdlZGl0Jyk7XG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJpLCB7XG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGJvZHk6IGZvcm1EYXRhLFxuICAgIH0pO1xuICAgIGNvbnN0IHJlc3BvbnNlRGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICByZXR1cm4gcmVzcG9uc2VEYXRhLmltYWdlX3VybCB8fCByZXNwb25zZURhdGEuaW1hZ2U7XG59XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHJvZHVjdCh7IHF1YW50aXR5LCBuYW1lLCBzaXplLCBjb2xvciwgc2lkZXMsIGFydGljbGUsIHByaWNlIH0pIHtcbiAgICBjb25zdCBwcm9kdWN0SWQgPSAnNjk4MzQxNjQyODMyXycgKyBEYXRlLm5vdygpO1xuICAgIGNvbnN0IGRlc2lnblZhcmlhbnQgPSBzaWRlcy5sZW5ndGggPiAxID8gYDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCIke3NpZGVzWzBdPy5pbWFnZV91cmx9XCIgdGFyZ2V0PVwiX2JsYW5rXCI+JHtzaWRlc1swXT8uaW1hZ2VfdXJsLnNsaWNlKC0xMCl9PC9hPiwgPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiR7c2lkZXNbMV0/LmltYWdlX3VybH1cIiB0YXJnZXQ9XCJfYmxhbmtcIj4ke3NpZGVzWzFdPy5pbWFnZV91cmwuc2xpY2UoLTEwKX08L2E+YCA6IGA8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiJHtzaWRlc1swXT8uaW1hZ2VfdXJsfVwiIHRhcmdldD1cIl9ibGFua1wiPiR7c2lkZXNbMF0/LmltYWdlX3VybC5zbGljZSgtMTApfTwvYT5gO1xuICAgIGNvbnN0IHJlc3VsdFByb2R1Y3QgPSB7XG4gICAgICAgIGlkOiBwcm9kdWN0SWQsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIHByaWNlLFxuICAgICAgICBxdWFudGl0eTogcXVhbnRpdHksXG4gICAgICAgIGltZzogc2lkZXNbMF0/LmltYWdlX3VybCxcbiAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgICAgeyBvcHRpb246ICfQoNCw0LfQvNC10YAnLCB2YXJpYW50OiBzaXplIH0sXG4gICAgICAgICAgICB7IG9wdGlvbjogJ9CU0LjQt9Cw0LnQvScsIHZhcmlhbnQ6IGRlc2lnblZhcmlhbnQgfSxcbiAgICAgICAgICAgIHsgb3B0aW9uOiAn0JDRgNGC0LjQutGD0LsnLCB2YXJpYW50OiBhcnRpY2xlIH0sXG4gICAgICAgICAgICB7IG9wdGlvbjogJ9Cm0LLQtdGCJywgdmFyaWFudDogY29sb3IubmFtZSB9LFxuICAgICAgICAgICAgeyBvcHRpb246ICfQn9GA0LjQvdGCJywgdmFyaWFudDogc2lkZXMubGVuZ3RoID09IDEgPyAn0J7QtNC90L7RgdGC0L7RgNC+0L3QvdC40LknIDogJ9CU0LLRg9GF0YHRgtC+0YDQvtC90L3QuNC5JyB9LFxuICAgICAgICBdXG4gICAgfTtcbiAgICBjb25zb2xlLmRlYnVnKCdbY2FydF0gYWRkIHByb2R1Y3QnLCByZXN1bHRQcm9kdWN0KTtcbiAgICBpZiAodHlwZW9mIHdpbmRvdy50Y2FydF9fYWRkUHJvZHVjdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgd2luZG93LnRjYXJ0X19hZGRQcm9kdWN0KHJlc3VsdFByb2R1Y3QpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB3aW5kb3cueW0oMTAzMjc5MjE0LCAncmVhY2hHb2FsJywgJ2FkZF90b19jYXJ0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHsgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NhcnRdINCe0YjQuNCx0LrQsCDQv9GA0Lgg0LTQvtCx0LDQstC70LXQvdC40Lgg0L/RgNC+0LTRg9C60YLQsCDQsiDQutC+0YDQt9C40L3RgycsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbY2FydF0g0JrQvtGA0LfQuNC90LAgVGlsZGEg0L3QtSDQt9Cw0LPRgNGD0LbQtdC90LAuJyk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGNhbGN1bGF0ZUxheW91dERpbWVuc2lvbnMobGF5b3V0LCBwcm9kdWN0LCBjb250YWluZXJXaWR0aCwgY29udGFpbmVySGVpZ2h0KSB7XG4gICAgY29uc3QgcHJpbnRDb25maWcgPSBwcm9kdWN0LnByaW50Q29uZmlnLmZpbmQocGMgPT4gcGMuc2lkZSA9PT0gbGF5b3V0LnZpZXcpO1xuICAgIGlmICghcHJpbnRDb25maWcpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQcmludCBjb25maWcgbm90IGZvdW5kIGZvciBzaWRlOiAke2xheW91dC52aWV3fWApO1xuICAgIH1cbiAgICBjb25zdCBwcmludEFyZWFXaWR0aCA9IChwcmludENvbmZpZy5zaXplLndpZHRoIC8gNjAwKSAqIGNvbnRhaW5lcldpZHRoO1xuICAgIGNvbnN0IHByaW50QXJlYUhlaWdodCA9IChwcmludENvbmZpZy5zaXplLmhlaWdodCAvIDYwMCkgKiBjb250YWluZXJIZWlnaHQ7XG4gICAgY29uc3QgcHJpbnRBcmVhTGVmdCA9IE1hdGgucm91bmQoKGNvbnRhaW5lcldpZHRoIC0gcHJpbnRBcmVhV2lkdGgpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi54IC8gMTAwKSAqIGNvbnRhaW5lcldpZHRoKTtcbiAgICBjb25zdCBwcmludEFyZWFUb3AgPSBNYXRoLnJvdW5kKChjb250YWluZXJIZWlnaHQgLSBwcmludEFyZWFIZWlnaHQpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi55IC8gMTAwKSAqIGNvbnRhaW5lckhlaWdodCk7XG4gICAgY29uc3QgbGVmdCA9IHByaW50QXJlYUxlZnQgKyAocHJpbnRBcmVhV2lkdGggKiBsYXlvdXQucG9zaXRpb24ueCk7XG4gICAgY29uc3QgdG9wID0gcHJpbnRBcmVhVG9wICsgKHByaW50QXJlYUhlaWdodCAqIGxheW91dC5wb3NpdGlvbi55KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0LFxuICAgICAgICB0b3AsXG4gICAgICAgIHNjYWxlWDogbGF5b3V0LnNpemUsXG4gICAgICAgIHNjYWxlWTogbGF5b3V0LnNpemUgKiBsYXlvdXQuYXNwZWN0UmF0aW8sXG4gICAgICAgIGFuZ2xlOiBsYXlvdXQuYW5nbGUsXG4gICAgICAgIHByaW50QXJlYVdpZHRoLFxuICAgICAgICBwcmludEFyZWFIZWlnaHQsXG4gICAgICAgIHByaW50QXJlYUxlZnQsXG4gICAgICAgIHByaW50QXJlYVRvcFxuICAgIH07XG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyTGF5b3V0KHBhcmFtcykge1xuICAgIGNvbnN0IHsgbGF5b3V0LCBwcm9kdWN0LCBjb250YWluZXJXaWR0aCwgY29udGFpbmVySGVpZ2h0LCBsb2FkSW1hZ2UgfSA9IHBhcmFtcztcbiAgICBjb25zdCBkaW1lbnNpb25zID0gY2FsY3VsYXRlTGF5b3V0RGltZW5zaW9ucyhsYXlvdXQsIHByb2R1Y3QsIGNvbnRhaW5lcldpZHRoLCBjb250YWluZXJIZWlnaHQpO1xuICAgIGNvbnN0IGZhYnJpYyA9IHdpbmRvdy5mYWJyaWM7XG4gICAgaWYgKCFmYWJyaWMpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignW3JlbmRlckxheW91dF0gZmFicmljLmpzINC90LUg0LfQsNCz0YDRg9C20LXQvScpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKGxheW91dC5pc0ltYWdlTGF5b3V0KCkpIHtcbiAgICAgICAgY29uc3QgaW1nID0gYXdhaXQgbG9hZEltYWdlKGxheW91dC51cmwpO1xuICAgICAgICBjb25zdCBpbWFnZSA9IG5ldyBmYWJyaWMuSW1hZ2UoaW1nKTtcbiAgICAgICAgbGV0IGFjdHVhbFNjYWxlID0gbGF5b3V0LnNpemU7XG4gICAgICAgIGNvbnN0IHJlbGF0aXZlV2lkdGggPSBsYXlvdXQuX3JlbGF0aXZlV2lkdGg7XG4gICAgICAgIGlmIChyZWxhdGl2ZVdpZHRoICYmIHJlbGF0aXZlV2lkdGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRXaWR0aCA9IGRpbWVuc2lvbnMucHJpbnRBcmVhV2lkdGggKiByZWxhdGl2ZVdpZHRoO1xuICAgICAgICAgICAgYWN0dWFsU2NhbGUgPSB0YXJnZXRXaWR0aCAvIGltZy53aWR0aDtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtyZW5kZXJMYXlvdXRdINCQ0LTQsNC/0YLQsNGG0LjRjyDQuiDQvdC+0LLQvtC80YMg0YDQsNC30LzQtdGA0YM6IHJlbGF0aXZlV2lkdGg9JHtyZWxhdGl2ZVdpZHRoLnRvRml4ZWQoMyl9LCB0YXJnZXRXaWR0aD0ke3RhcmdldFdpZHRoLnRvRml4ZWQoMSl9cHgsIHNjYWxlPSR7YWN0dWFsU2NhbGUudG9GaXhlZCgzKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsYXlvdXQuc2l6ZSA9PT0gMSAmJiBpbWcud2lkdGggPiBkaW1lbnNpb25zLnByaW50QXJlYVdpZHRoKSB7XG4gICAgICAgICAgICBhY3R1YWxTY2FsZSA9IGRpbWVuc2lvbnMucHJpbnRBcmVhV2lkdGggLyBpbWcud2lkdGg7XG4gICAgICAgICAgICBsYXlvdXQuc2l6ZSA9IGFjdHVhbFNjYWxlO1xuICAgICAgICAgICAgY29uc3Qgb2JqZWN0V2lkdGggPSBpbWcud2lkdGggKiBhY3R1YWxTY2FsZTtcbiAgICAgICAgICAgIGNvbnN0IHJlbFcgPSBvYmplY3RXaWR0aCAvIGRpbWVuc2lvbnMucHJpbnRBcmVhV2lkdGg7XG4gICAgICAgICAgICBsYXlvdXQuX3JlbGF0aXZlV2lkdGggPSByZWxXO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3JlbmRlckxheW91dF0g0JDQstGC0L7Qv9C+0LTQs9C+0L3QutCwINGA0LDQt9C80LXRgNCwOiAke2ltZy53aWR0aH1weCDihpIgJHtkaW1lbnNpb25zLnByaW50QXJlYVdpZHRofXB4LCBzY2FsZT0ke2FjdHVhbFNjYWxlLnRvRml4ZWQoMyl9LCByZWxhdGl2ZVdpZHRoPSR7cmVsVy50b0ZpeGVkKDMpfWApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFyZWxhdGl2ZVdpZHRoIHx8IHJlbGF0aXZlV2lkdGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG9iamVjdFdpZHRoID0gaW1nLndpZHRoICogbGF5b3V0LnNpemU7XG4gICAgICAgICAgICBjb25zdCByZWxXID0gb2JqZWN0V2lkdGggLyBkaW1lbnNpb25zLnByaW50QXJlYVdpZHRoO1xuICAgICAgICAgICAgbGF5b3V0Ll9yZWxhdGl2ZVdpZHRoID0gcmVsVztcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtyZW5kZXJMYXlvdXRdINCS0YvRh9C40YHQu9C10L0gX3JlbGF0aXZlV2lkdGgg0LTQu9GPINGB0YLQsNGA0L7Qs9C+IGxheW91dDogJHtyZWxXLnRvRml4ZWQoMyl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgaW1hZ2Uuc2V0KHtcbiAgICAgICAgICAgIGxlZnQ6IGRpbWVuc2lvbnMubGVmdCxcbiAgICAgICAgICAgIHRvcDogZGltZW5zaW9ucy50b3AsXG4gICAgICAgICAgICBzY2FsZVg6IGFjdHVhbFNjYWxlLFxuICAgICAgICAgICAgc2NhbGVZOiBhY3R1YWxTY2FsZSAqIGxheW91dC5hc3BlY3RSYXRpbyxcbiAgICAgICAgICAgIGFuZ2xlOiBkaW1lbnNpb25zLmFuZ2xlLFxuICAgICAgICAgICAgbmFtZTogbGF5b3V0LmlkLFxuICAgICAgICAgICAgbGF5b3V0VXJsOiBsYXlvdXQudXJsLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGltYWdlO1xuICAgIH1cbiAgICBlbHNlIGlmIChsYXlvdXQuaXNUZXh0TGF5b3V0KCkpIHtcbiAgICAgICAgY29uc3QgdGV4dCA9IG5ldyBmYWJyaWMuVGV4dChsYXlvdXQudGV4dCwge1xuICAgICAgICAgICAgZm9udEZhbWlseTogbGF5b3V0LmZvbnQuZmFtaWx5LFxuICAgICAgICAgICAgZm9udFNpemU6IGxheW91dC5mb250LnNpemUsXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXh0LnNldCh7XG4gICAgICAgICAgICBsZWZ0OiBkaW1lbnNpb25zLmxlZnQsXG4gICAgICAgICAgICB0b3A6IGRpbWVuc2lvbnMudG9wLFxuICAgICAgICAgICAgc2NhbGVYOiBkaW1lbnNpb25zLnNjYWxlWCxcbiAgICAgICAgICAgIHNjYWxlWTogZGltZW5zaW9ucy5zY2FsZVksXG4gICAgICAgICAgICBhbmdsZTogZGltZW5zaW9ucy5hbmdsZSxcbiAgICAgICAgICAgIG5hbWU6IGxheW91dC5pZCxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0ZXh0O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJMYXlvdXRUb0NhbnZhcyhjdHgsIGxheW91dCwgcHJvZHVjdCwgY29udGFpbmVyV2lkdGgsIGNvbnRhaW5lckhlaWdodCwgbG9hZEltYWdlKSB7XG4gICAgY29uc3QgZGltZW5zaW9ucyA9IGNhbGN1bGF0ZUxheW91dERpbWVuc2lvbnMobGF5b3V0LCBwcm9kdWN0LCBjb250YWluZXJXaWR0aCwgY29udGFpbmVySGVpZ2h0KTtcbiAgICBpZiAobGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSkge1xuICAgICAgICBjb25zdCBpbWcgPSBhd2FpdCBsb2FkSW1hZ2UobGF5b3V0LnVybCk7XG4gICAgICAgIGN0eC5zYXZlKCk7XG4gICAgICAgIGN0eC50cmFuc2xhdGUoZGltZW5zaW9ucy5sZWZ0LCBkaW1lbnNpb25zLnRvcCk7XG4gICAgICAgIGN0eC5yb3RhdGUoKGRpbWVuc2lvbnMuYW5nbGUgKiBNYXRoLlBJKSAvIDE4MCk7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gaW1nLndpZHRoICogZGltZW5zaW9ucy5zY2FsZVg7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IGltZy5oZWlnaHQgKiBkaW1lbnNpb25zLnNjYWxlWTtcbiAgICAgICAgY3R4LmRyYXdJbWFnZShpbWcsIDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICBjdHgucmVzdG9yZSgpO1xuICAgIH1cbiAgICBlbHNlIGlmIChsYXlvdXQuaXNUZXh0TGF5b3V0KCkpIHtcbiAgICAgICAgY3R4LnNhdmUoKTtcbiAgICAgICAgY3R4LnRyYW5zbGF0ZShkaW1lbnNpb25zLmxlZnQsIGRpbWVuc2lvbnMudG9wKTtcbiAgICAgICAgY3R4LnJvdGF0ZSgoZGltZW5zaW9ucy5hbmdsZSAqIE1hdGguUEkpIC8gMTgwKTtcbiAgICAgICAgY3R4LmZvbnQgPSBgJHtsYXlvdXQuZm9udC5zaXplICogZGltZW5zaW9ucy5zY2FsZVh9cHggJHtsYXlvdXQuZm9udC5mYW1pbHl9YDtcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICdibGFjayc7XG4gICAgICAgIGN0eC5maWxsVGV4dChsYXlvdXQudGV4dCwgMCwgMCk7XG4gICAgICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGNsYXNzIFNhZmVSb3V0ZUludGVncmF0aW9uVjIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnBob25lRGF0YSA9IG51bGw7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vcmlnaW5hbEZvcm1EYXRhQXBwZW5kID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgfVxuICAgIGluaXQoKSB7XG4gICAgICAgIGlmICh0aGlzLmluaXRpYWxpemVkKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g8J+agCDQmNC90LjRhtC40LDQu9C40LfQsNGG0LjRjyDQsNCz0YDQtdGB0YHQuNCy0L3QvtC5INCy0LXRgNGB0LjQuC4uLicpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMuaGFuZGxlTWVzc2FnZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5pbnRlcmNlcHRGb3JtRGF0YSgpO1xuICAgICAgICB0aGlzLmludGVyY2VwdFhIUigpO1xuICAgICAgICB0aGlzLmludGVyY2VwdEZldGNoKCk7XG4gICAgICAgIHRoaXMuaW50ZXJjZXB0U3VibWl0KCk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g4pyFINCY0L3QuNGG0LjQsNC70LjQt9Cw0YbQuNGPINC30LDQstC10YDRiNC10L3QsCcpO1xuICAgICAgICB3aW5kb3cuc2FmZVJvdXRlVjIgPSB0aGlzO1xuICAgIH1cbiAgICBoYW5kbGVNZXNzYWdlKGV2ZW50KSB7XG4gICAgICAgIGlmICghZXZlbnQub3JpZ2luLmluY2x1ZGVzKCdzYWZlcm91dGUucnUnKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB0eXBlb2YgZXZlbnQuZGF0YSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICA/IEpTT04ucGFyc2UoZXZlbnQuZGF0YSlcbiAgICAgICAgICAgICAgICA6IGV2ZW50LmRhdGE7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g8J+TrCDQodC+0L7QsdGJ0LXQvdC40LUg0L7RgiBTYWZlUm91dGUnKTtcbiAgICAgICAgICAgIGNvbnN0IHBob25lID0gdGhpcy5leHRyYWN0UGhvbmUoZGF0YSk7XG4gICAgICAgICAgICBpZiAocGhvbmUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g8J+TsSDQotC10LvQtdGE0L7QvTonLCBwaG9uZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRQaG9uZShwaG9uZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbU2FmZVJvdXRlIFYyXSDQntGI0LjQsdC60LAg0L7QsdGA0LDQsdC+0YLQutC4OicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBleHRyYWN0UGhvbmUoZGF0YSkge1xuICAgICAgICByZXR1cm4gZGF0YS5waG9uZSB8fFxuICAgICAgICAgICAgZGF0YS5kYXRhPy5jb250YWN0cz8ucGhvbmUgfHxcbiAgICAgICAgICAgIGRhdGEuY29udGFjdHM/LnBob25lIHx8XG4gICAgICAgICAgICBkYXRhLnJlY2lwaWVudD8ucGhvbmUgfHxcbiAgICAgICAgICAgIG51bGw7XG4gICAgfVxuICAgIHNldFBob25lKHBob25lKSB7XG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IHRoaXMucGFyc2VQaG9uZShwaG9uZSk7XG4gICAgICAgIGlmICghcGFyc2VkKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tTYWZlUm91dGUgVjJdIOKdjCDQndC1INGD0LTQsNC70L7RgdGMINGA0LDRgdC/0LDRgNGB0LjRgtGMOicsIHBob25lKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBob25lRGF0YSA9IHBhcnNlZDtcbiAgICAgICAgY29uc29sZS5sb2coJ1tTYWZlUm91dGUgVjJdIOKchSDQotC10LvQtdGE0L7QvSDRgdC+0YXRgNCw0L3QtdC9OicsIHRoaXMucGhvbmVEYXRhKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oJ3NyX3Bob25lJywgSlNPTi5zdHJpbmdpZnkodGhpcy5waG9uZURhdGEpKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkgeyB9XG4gICAgICAgIHRoaXMuZmlsbFBob25lRmllbGRzKCk7XG4gICAgfVxuICAgIHBhcnNlUGhvbmUocGhvbmUpIHtcbiAgICAgICAgY29uc3QgY2xlYW5lZCA9IHBob25lLnJlcGxhY2UoL1xcRC9nLCAnJyk7XG4gICAgICAgIGlmIChjbGVhbmVkLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBsZXQgaXNvID0gJys3JztcbiAgICAgICAgbGV0IG51bWJlciA9IGNsZWFuZWQ7XG4gICAgICAgIGlmIChjbGVhbmVkLnN0YXJ0c1dpdGgoJzcnKSAmJiBjbGVhbmVkLmxlbmd0aCA9PT0gMTEpIHtcbiAgICAgICAgICAgIG51bWJlciA9IGNsZWFuZWQuc3Vic3RyaW5nKDEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGNsZWFuZWQuc3RhcnRzV2l0aCgnOCcpICYmIGNsZWFuZWQubGVuZ3RoID09PSAxMSkge1xuICAgICAgICAgICAgbnVtYmVyID0gY2xlYW5lZC5zdWJzdHJpbmcoMSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY2xlYW5lZC5sZW5ndGggPT09IDEwKSB7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmb3JtYXR0ZWQgPSB0aGlzLmZvcm1hdFBob25lKG51bWJlcik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpc286IGlzbyxcbiAgICAgICAgICAgIG51bWJlcjogZm9ybWF0dGVkLFxuICAgICAgICAgICAgZnVsbDogYCR7aXNvfSAke2Zvcm1hdHRlZH1gXG4gICAgICAgIH07XG4gICAgfVxuICAgIGZvcm1hdFBob25lKHBob25lKSB7XG4gICAgICAgIGlmIChwaG9uZS5sZW5ndGggIT09IDEwKVxuICAgICAgICAgICAgcmV0dXJuIHBob25lO1xuICAgICAgICByZXR1cm4gYCgke3Bob25lLnN1YnN0cmluZygwLCAzKX0pICR7cGhvbmUuc3Vic3RyaW5nKDMsIDYpfS0ke3Bob25lLnN1YnN0cmluZyg2LCA4KX0tJHtwaG9uZS5zdWJzdHJpbmcoOCwgMTApfWA7XG4gICAgfVxuICAgIGZpbGxQaG9uZUZpZWxkcygpIHtcbiAgICAgICAgaWYgKCF0aGlzLnBob25lRGF0YSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZm9ybXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdmb3JtJyk7XG4gICAgICAgIGxldCBmaWxsZWQgPSBmYWxzZTtcbiAgICAgICAgZm9ybXMuZm9yRWFjaChmb3JtID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGlzb0lucHV0ID0gdGhpcy5lbnN1cmVJbnB1dChmb3JtLCAndGlsZGFzcGVjLXBob25lLXBhcnRbXS1pc28nLCAnaGlkZGVuJyk7XG4gICAgICAgICAgICBjb25zdCBudW1iZXJJbnB1dCA9IHRoaXMuZW5zdXJlSW5wdXQoZm9ybSwgJ3RpbGRhc3BlYy1waG9uZS1wYXJ0W10nLCAndGVsJyk7XG4gICAgICAgICAgICBjb25zdCBwaG9uZUlucHV0ID0gdGhpcy5lbnN1cmVJbnB1dChmb3JtLCAncGhvbmUnLCAnaGlkZGVuJyk7XG4gICAgICAgICAgICBpZiAoaXNvSW5wdXQgJiYgdGhpcy5waG9uZURhdGEpIHtcbiAgICAgICAgICAgICAgICBpc29JbnB1dC52YWx1ZSA9IHRoaXMucGhvbmVEYXRhLmlzbztcbiAgICAgICAgICAgICAgICBmaWxsZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG51bWJlcklucHV0ICYmIHRoaXMucGhvbmVEYXRhKSB7XG4gICAgICAgICAgICAgICAgbnVtYmVySW5wdXQudmFsdWUgPSB0aGlzLnBob25lRGF0YS5udW1iZXI7XG4gICAgICAgICAgICAgICAgZmlsbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaG9uZUlucHV0ICYmIHRoaXMucGhvbmVEYXRhKSB7XG4gICAgICAgICAgICAgICAgcGhvbmVJbnB1dC52YWx1ZSA9IHRoaXMucGhvbmVEYXRhLmZ1bGw7XG4gICAgICAgICAgICAgICAgZmlsbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChmaWxsZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDinIUg0J/QvtC70Y8g0LfQsNC/0L7Qu9C90LXQvdGLJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZW5zdXJlSW5wdXQoZm9ybSwgbmFtZSwgdHlwZSkge1xuICAgICAgICBsZXQgaW5wdXQgPSBmb3JtLnF1ZXJ5U2VsZWN0b3IoYGlucHV0W25hbWU9XCIke25hbWV9XCJdYCk7XG4gICAgICAgIGlmICghaW5wdXQpIHtcbiAgICAgICAgICAgIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICAgIGlucHV0LnR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgaW5wdXQubmFtZSA9IG5hbWU7XG4gICAgICAgICAgICBpbnB1dC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgZm9ybS5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g4p6VINCh0L7Qt9C00LDQvdC+INC/0L7Qu9C1OicsIG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9XG4gICAgaW50ZXJjZXB0Rm9ybURhdGEoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBjb25zdCBPcmlnaW5hbEZvcm1EYXRhID0gd2luZG93LkZvcm1EYXRhO1xuICAgICAgICB3aW5kb3cuRm9ybURhdGEgPSBmdW5jdGlvbiAoZm9ybSkge1xuICAgICAgICAgICAgY29uc3QgZm9ybURhdGEgPSBuZXcgT3JpZ2luYWxGb3JtRGF0YShmb3JtKTtcbiAgICAgICAgICAgIGlmIChzZWxmLnBob25lRGF0YSkge1xuICAgICAgICAgICAgICAgIGlmICghZm9ybURhdGEuaGFzKCdwaG9uZScpIHx8ICFmb3JtRGF0YS5nZXQoJ3Bob25lJykpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybURhdGEuc2V0KCd0aWxkYXNwZWMtcGhvbmUtcGFydFtdLWlzbycsIHNlbGYucGhvbmVEYXRhLmlzbyk7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1EYXRhLnNldCgndGlsZGFzcGVjLXBob25lLXBhcnRbXScsIHNlbGYucGhvbmVEYXRhLm51bWJlcik7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1EYXRhLnNldCgncGhvbmUnLCBzZWxmLnBob25lRGF0YS5mdWxsKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tTYWZlUm91dGUgVjJdIPCfk6Yg0KLQtdC70LXRhNC+0L0g0LTQvtCx0LDQstC70LXQvSDQsiBGb3JtRGF0YScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmb3JtRGF0YTtcbiAgICAgICAgfTtcbiAgICAgICAgd2luZG93LkZvcm1EYXRhLnByb3RvdHlwZSA9IE9yaWdpbmFsRm9ybURhdGEucHJvdG90eXBlO1xuICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g4pyFIEZvcm1EYXRhINC/0LXRgNC10YXQstCw0YfQtdC9Jyk7XG4gICAgfVxuICAgIGludGVyY2VwdFhIUigpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGNvbnN0IG9yaWdpbmFsT3BlbiA9IFhNTEh0dHBSZXF1ZXN0LnByb3RvdHlwZS5vcGVuO1xuICAgICAgICBjb25zdCBvcmlnaW5hbFNlbmQgPSBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUuc2VuZDtcbiAgICAgICAgWE1MSHR0cFJlcXVlc3QucHJvdG90eXBlLm9wZW4gPSBmdW5jdGlvbiAobWV0aG9kLCB1cmwsIC4uLmFyZ3MpIHtcbiAgICAgICAgICAgIHRoaXMuX3VybCA9IHVybDtcbiAgICAgICAgICAgIHRoaXMuX21ldGhvZCA9IG1ldGhvZDtcbiAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbE9wZW4uYXBwbHkodGhpcywgW21ldGhvZCwgdXJsLCAuLi5hcmdzXSk7XG4gICAgICAgIH07XG4gICAgICAgIFhNTEh0dHBSZXF1ZXN0LnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24gKGJvZHkpIHtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IHRoaXMuX3VybCB8fCAnJztcbiAgICAgICAgICAgIGlmICh1cmwuaW5jbHVkZXMoJ2Zvcm1zLnRpbGRhYXBpLmNvbScpIHx8IHVybC5pbmNsdWRlcygnL2Zvcm0vc3VibWl0JykpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g8J+MkCDQn9C10YDQtdGF0LLQsNGCIFhIUiDQujonLCB1cmwpO1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLnBob25lRGF0YSAmJiBib2R5IGluc3RhbmNlb2YgRm9ybURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFib2R5LmhhcygncGhvbmUnKSB8fCAhYm9keS5nZXQoJ3Bob25lJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHkuc2V0KCd0aWxkYXNwZWMtcGhvbmUtcGFydFtdLWlzbycsIHNlbGYucGhvbmVEYXRhLmlzbyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5LnNldCgndGlsZGFzcGVjLXBob25lLXBhcnRbXScsIHNlbGYucGhvbmVEYXRhLm51bWJlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5LnNldCgncGhvbmUnLCBzZWxmLnBob25lRGF0YS5mdWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDinIUg0KLQtdC70LXRhNC+0L0g0LTQvtCx0LDQstC70LXQvSDQsiBYSFInKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzZWxmLnBob25lRGF0YSAmJiB0eXBlb2YgYm9keSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhib2R5KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXJhbXMuaGFzKCdwaG9uZScpIHx8ICFwYXJhbXMuZ2V0KCdwaG9uZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXMuc2V0KCd0aWxkYXNwZWMtcGhvbmUtcGFydFtdLWlzbycsIHNlbGYucGhvbmVEYXRhLmlzbyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXMuc2V0KCd0aWxkYXNwZWMtcGhvbmUtcGFydFtdJywgc2VsZi5waG9uZURhdGEubnVtYmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtcy5zZXQoJ3Bob25lJywgc2VsZi5waG9uZURhdGEuZnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5ID0gcGFyYW1zLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g4pyFINCi0LXQu9C10YTQvtC9INC00L7QsdCw0LLQu9C10L0g0LIgWEhSIChVUkxFbmNvZGVkKScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsU2VuZC5jYWxsKHRoaXMsIGJvZHkpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g4pyFIFhNTEh0dHBSZXF1ZXN0INC/0LXRgNC10YXQstCw0YfQtdC9Jyk7XG4gICAgfVxuICAgIGludGVyY2VwdEZldGNoKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxGZXRjaCA9IHdpbmRvdy5mZXRjaDtcbiAgICAgICAgd2luZG93LmZldGNoID0gZnVuY3Rpb24gKGlucHV0LCBpbml0KSB7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSB0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnID8gaW5wdXQgOiBpbnB1dCBpbnN0YW5jZW9mIFVSTCA/IGlucHV0LmhyZWYgOiBpbnB1dC51cmw7XG4gICAgICAgICAgICBpZiAodXJsLmluY2x1ZGVzKCdmb3Jtcy50aWxkYWFwaS5jb20nKSB8fCB1cmwuaW5jbHVkZXMoJy9mb3JtL3N1Ym1pdCcpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tTYWZlUm91dGUgVjJdIPCfjJAg0J/QtdGA0LXRhdCy0LDRgiBmZXRjaCDQujonLCB1cmwpO1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLnBob25lRGF0YSAmJiBpbml0Py5ib2R5IGluc3RhbmNlb2YgRm9ybURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpbml0LmJvZHkuaGFzKCdwaG9uZScpIHx8ICFpbml0LmJvZHkuZ2V0KCdwaG9uZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbml0LmJvZHkuc2V0KCd0aWxkYXNwZWMtcGhvbmUtcGFydFtdLWlzbycsIHNlbGYucGhvbmVEYXRhLmlzbyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbml0LmJvZHkuc2V0KCd0aWxkYXNwZWMtcGhvbmUtcGFydFtdJywgc2VsZi5waG9uZURhdGEubnVtYmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXQuYm9keS5zZXQoJ3Bob25lJywgc2VsZi5waG9uZURhdGEuZnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g4pyFINCi0LXQu9C10YTQvtC9INC00L7QsdCw0LLQu9C10L0g0LIgZmV0Y2gnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbEZldGNoLmFwcGx5KHdpbmRvdywgW2lucHV0LCBpbml0XSk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDinIUgZmV0Y2gg0L/QtdGA0LXRhdCy0LDRh9C10L0nKTtcbiAgICB9XG4gICAgaW50ZXJjZXB0U3VibWl0KCkge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZvcm0gPSBldmVudC50YXJnZXQ7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g8J+TpCBTdWJtaXQg0YTQvtGA0LzRizonLCBmb3JtLmFjdGlvbik7XG4gICAgICAgICAgICBpZiAodGhpcy5waG9uZURhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGxQaG9uZUZpZWxkcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLnBob25lRGF0YSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNhdmVkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbSgnc3JfcGhvbmUnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNhdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBob25lRGF0YSA9IEpTT04ucGFyc2Uoc2F2ZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxsUGhvbmVGaWVsZHMoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkgeyB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g4pyFIFN1Ym1pdCDQv9C10YDQtdGF0LLQsNGH0LXQvScpO1xuICAgIH1cbiAgICBnZXRQaG9uZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGhvbmVEYXRhO1xuICAgIH1cbn1cbmxldCBpbnN0YW5jZSA9IG51bGw7XG5leHBvcnQgZnVuY3Rpb24gaW5pdFNhZmVSb3V0ZVYyKCkge1xuICAgIGlmICghaW5zdGFuY2UpIHtcbiAgICAgICAgaW5zdGFuY2UgPSBuZXcgU2FmZVJvdXRlSW50ZWdyYXRpb25WMigpO1xuICAgIH1cbiAgICByZXR1cm4gaW5zdGFuY2U7XG59XG5pZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGluaXRTYWZlUm91dGVWMik7XG59XG5lbHNlIHtcbiAgICBpbml0U2FmZVJvdXRlVjIoKTtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0Q2hpbGQoZWxlbWVudCkge1xuICAgIGlmICghZWxlbWVudClcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgaWYgKCFlbGVtZW50LmZpcnN0RWxlbWVudENoaWxkKVxuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICByZXR1cm4gZ2V0TGFzdENoaWxkKGVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQpO1xufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgUG9wdXAgZnJvbSAnLi9jb21wb25lbnRzL1BvcHVwJztcbmltcG9ydCBFZGl0b3IgZnJvbSAnLi9jb21wb25lbnRzL0VkaXRvcic7XG5pbXBvcnQgeyBDYXJkRm9ybSB9IGZyb20gJy4vY29tcG9uZW50cy9DYXJkRm9ybSc7XG5pbXBvcnQgeyBpbml0U2FmZVJvdXRlVjIgfSBmcm9tICcuL3V0aWxzL3NhZmVSb3V0ZUludGVncmF0aW9uVjInO1xud2luZG93LnBvcHVwID0gUG9wdXA7XG53aW5kb3cuZWRpdG9yID0gRWRpdG9yO1xud2luZG93LmNhcmRGb3JtID0gQ2FyZEZvcm07XG5pbml0U2FmZVJvdXRlVjIoKTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==