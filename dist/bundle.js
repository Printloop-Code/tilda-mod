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
    constructor({ blocks, productConfigs, formConfig, apiConfig }) {
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
        this.isGenerating = false;
        this.loadingTime = 0;
        this.loadingInterval = null;
        this.colorBlocks = [];
        this.sizeBlocks = [];
        this.productBlocks = [];
        this.loadedUserImage = null;
        this.editorLoadWithAi = false;
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
        window.onbeforeunload = () => {
            return alert("Вы уверены, что хотите покинуть эту страницу?");
        };
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
            this.emit(EditorEventType.MOCKUP_LOADING, true);
            const layoutId = this._selectLayout || _models_Layout__WEBPACK_IMPORTED_MODULE_1__.Layout.generateId();
            try {
                const url = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_4__.generateImage)({
                    prompt,
                    shirtColor: this._selectColor.name,
                    image: this._selectLayout ? this.loadedUserImage !== this.layouts.find(layout => layout.id === this._selectLayout)?.url ? this.loadedUserImage : null : this.loadedUserImage,
                    withAi: this.editorLoadWithAi,
                    layoutId,
                    isNew: this._selectLayout ? false : true,
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
        const newSide = this._selectSide === 'front' ? 'back' : 'front';
        this.setActiveSide(newSide);
        this.updateMockup();
        this.showLayoutList();
        this.updateLayouts();
        this.saveState();
        this.emit(EditorEventType.STATE_CHANGED, undefined);
    }
    changeColor(colorName) {
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
    }
    resetUserUploadImage() {
        if (this.editorUploadViewBlock) {
            this.editorUploadViewBlock.style.display = 'none';
        }
        this.loadedUserImage = null;
        this.cancelEditLayout();
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

const API_ENDPOINTS = {
    WEBHOOK_REQUEST: 'https://primary-production-654c.up.railway.app/webhook/request',
};
async function generateImage({ prompt, shirtColor, image, withAi, layoutId, isNew = true, }) {
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
    const response = await fetch(API_ENDPOINTS.WEBHOOK_REQUEST, {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtFQUErRSxtQkFBbUI7QUFDbEc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0RUFBNEUsMEJBQTBCO0FBQ3RHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtFQUErRSxTQUFTO0FBQ3hGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFLGVBQWU7QUFDakYsaUVBQWlFLGVBQWU7QUFDaEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzREFBc0Qsb0NBQW9DLEVBQUUsa0NBQWtDO0FBQzlIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxRUFBcUUsU0FBUztBQUM5RTtBQUNBO0FBQ0Esa0VBQWtFLFNBQVM7QUFDM0U7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFD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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaURBQWlELDJCQUEyQjtBQUM1RTtBQUNBO0FBQ0EsaURBQWlELGtEQUFNO0FBQ3ZEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkNBQTJDLEtBQUs7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0VBQXdFLFNBQVM7QUFDakY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsdUJBQXVCO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbURBQW1ELG1DQUFtQztBQUN0RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0Esb0JBQW9CLHVCQUF1QjtBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2Q0FBNkMsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsdUJBQXVCO0FBQzVHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEIsaUJBQWlCLEdBQUcsaUJBQWlCLEdBQUcsdUJBQXVCO0FBQzNGO0FBQ0E7QUFDQTtB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QUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdFQUFnRSxzQkFBc0I7QUFDdEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9EQUFvRCxPQUFPO0FBQzNEO0FBQ0E7QUFDQTtBQUNBLG1EQUFtRCxrREFBTTtBQUN6RDtBQUNBLGtDQUFrQyx5REFBYTtBQUMvQztBQUNBO0FBQ0E7QUFDQTtBQUNB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdDQUF3QywrREFBWTtBQUNwRCwyQ0FBMkMsK0RBQVk7QUFDdkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdDQUF3QywrREFBWTtBQUNwRCwyQ0FBMkMsK0RBQVk7QUFDdkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsK0RBQVk7QUFDcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQ0FBZ0MsK0RBQVk7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQix1Q0FBdUM7QUFDbEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLHVDQUF1QztBQUNsRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0NBQWtDLEtBQUs7QUFDdkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNEQUFzRCxLQUFLO0FBQzNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FB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QUF5QixvREFBb0Q7QUFDcEY7QUFDQSx5RUFBeUUsb0JBQW9CLG9CQUFvQiwrQkFBK0IsaUNBQWlDLG9CQUFvQixvQkFBb0IsK0JBQStCLG9DQUFvQyxvQkFBb0Isb0JBQW9CLCtCQUErQjtBQUNuVztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWMsaUNBQWlDO0FBQy9DLGNBQWMsMENBQTBDO0FBQ3hELGNBQWMscUNBQXFDO0FBQ25ELGNBQWMscUNBQXFDO0FBQ25ELGNBQWMsaUZBQWlGO0FBQy9GO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7QUMzRU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7VUNOQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQ3RCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHlDQUF5Qyx3Q0FBd0M7V0FDakY7V0FDQTtXQUNBLEU7Ozs7O1dDUEEsd0Y7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdELEU7Ozs7Ozs7Ozs7Ozs7O0FDTnVDO0FBQ0U7QUFDUTtBQUNqRCxlQUFlLHlEQUFLO0FBQ3BCLGdCQUFnQiwwREFBTTtBQUN0QixrQkFBa0IsMERBQVEiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL2NvbXBvbmVudHMvQ2FyZEZvcm0udHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9jb21wb25lbnRzL0VkaXRvci50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL2NvbXBvbmVudHMvUG9wdXAudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9tYW5hZ2Vycy9FZGl0b3JTdG9yYWdlTWFuYWdlci50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL21vZGVscy9MYXlvdXQudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy91dGlscy9UeXBlZEV2ZW50RW1pdHRlci50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL3V0aWxzL2FwaS50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL3V0aWxzL3RpbGRhVXRpbHMudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgRE9NX1NFTEVDVE9SUyA9IHtcbiAgICBDQVJUX0NPTlRBSU5FUjogJy50NzA2X19jYXJ0d2luLXByb2R1Y3RzLCAudC1zdG9yZV9fY2FydC1wcm9kdWN0cywgLnQtc3RvcmUnLFxuICAgIENBUlRfUFJPRFVDVDogJy50NzA2X19jYXJ0d2luLXByb2R1Y3QsIC50LXN0b3JlX19jYXJkLCAudDcwNl9fcHJvZHVjdCcsXG4gICAgUFJPRFVDVF9USVRMRTogJy50NzA2X19wcm9kdWN0LXRpdGxlLCAudC1zdG9yZV9fY2FyZF9fdGl0bGUsIC50NzA2X19wcm9kdWN0LW5hbWUnLFxuICAgIFBST0RVQ1RfREVMX0JVVFRPTjogJy50NzA2X19wcm9kdWN0LWRlbCcsXG4gICAgUFJPRFVDVF9QTFVTX0JVVFRPTjogJy50NzA2X19wcm9kdWN0LXBsdXMnLFxuICAgIFBST0RVQ1RfTUlOVVNfQlVUVE9OOiAnLnQ3MDZfX3Byb2R1Y3QtbWludXMnLFxuICAgIFBST0RVQ1RfUExVU01JTlVTOiAnLnQ3MDZfX3Byb2R1Y3QtcGx1c21pbnVzJyxcbiAgICBQUk9EVUNUX1FVQU5USVRZOiAnLnQ3MDZfX3Byb2R1Y3QtcXVhbnRpdHksIC50LXN0b3JlX19jYXJkX19xdWFudGl0eScsXG4gICAgQ0FSVF9DT1VOVEVSOiAnLnQ3MDZfX2NhcnRpY29uLWNvdW50ZXIsIC50LXN0b3JlX19jb3VudGVyJyxcbiAgICBDQVJUX0FNT1VOVDogJy50NzA2X19jYXJ0d2luLXByb2RhbW91bnQsIC50LXN0b3JlX190b3RhbC1hbW91bnQnLFxufTtcbmNvbnN0IERFTEFZUyA9IHtcbiAgICBDQVJUX1VQREFURTogMzAwLFxuICAgIERPTV9VUERBVEU6IDEwMCxcbiAgICBPQlNFUlZFUl9DSEVDSzogNTAwLFxuICAgIENBUlRfTE9BRF9USU1FT1VUOiAzMDAwLFxufTtcbmNsYXNzIENhcnRVdGlscyB7XG4gICAgc3RhdGljIHdhaXQobXMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpO1xuICAgIH1cbiAgICBzdGF0aWMgYXN5bmMgd2FpdEZvckVsZW1lbnQoc2VsZWN0b3IsIG1heEF0dGVtcHRzID0gMTAsIGludGVydmFsID0gMTAwKSB7XG4gICAgICAgIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgbWF4QXR0ZW1wdHM7IGF0dGVtcHQrKykge1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhdHRlbXB0IDwgbWF4QXR0ZW1wdHMgLSAxKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy53YWl0KGludGVydmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgc3RhdGljIGZpbmRQcm9kdWN0RWxlbWVudChwcm9kdWN0TmFtZSkge1xuICAgICAgICBjb25zdCBwcm9kdWN0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoRE9NX1NFTEVDVE9SUy5DQVJUX1BST0RVQ1QpO1xuICAgICAgICBmb3IgKGNvbnN0IHByb2R1Y3Qgb2YgcHJvZHVjdHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHRpdGxlID0gcHJvZHVjdC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9USVRMRSk7XG4gICAgICAgICAgICBpZiAodGl0bGUgJiYgdGl0bGUudGV4dENvbnRlbnQ/LnRyaW0oKSA9PT0gcHJvZHVjdE5hbWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb2R1Y3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIENhcmRGb3JtIHtcbiAgICBjb25zdHJ1Y3Rvcih7IGNhcmRCbG9ja0lkLCBydWxlcyB9KSB7XG4gICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5pc1VwZGF0aW5nQ2FydCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNhcmRCbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY2FyZEJsb2NrSWQpO1xuICAgICAgICBpZiAoIXRoaXMuY2FyZEJsb2NrKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBDYXJkIGJsb2NrIHdpdGggaWQgJHtjYXJkQmxvY2tJZH0gbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mb3JtID0gdGhpcy5jYXJkQmxvY2sucXVlcnlTZWxlY3RvcignZm9ybScpO1xuICAgICAgICBpZiAoIXRoaXMuZm9ybSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRm9ybSBibG9jayB3aXRoIGlkICR7Y2FyZEJsb2NrSWR9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pbml0Rm9ybSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucnVsZXMgPSBydWxlcztcbiAgICAgICAgdGhpcy5maWVsZHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudC1pbnB1dC1ncm91cCcpO1xuICAgICAgICB0aGlzLmluaXRSdWxlcygpO1xuICAgICAgICB0aGlzLmluaXRDYXJ0T2JzZXJ2ZXIoKTtcbiAgICB9XG4gICAgaW5pdEZvcm0oKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdF0nLCB0aGlzLmZvcm0uZWxlbWVudHMpO1xuICAgICAgICB0aGlzLmZvcm0uYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSB0YXJnZXQ/Lm5hbWU7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFZhbHVlID0gdGFyZ2V0Py52YWx1ZTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5wdXRdJywgZSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGZpZWxkVmFsdWUsIFwifFwiLCBmaWVsZE5hbWUpO1xuICAgICAgICAgICAgY29uc3QgcnVsZSA9IHRoaXMucnVsZXMuZmluZChyID0+IHIudmFyaWFibGUgPT09IGZpZWxkTmFtZSk7XG4gICAgICAgICAgICBpZiAocnVsZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZFN0YXRlID0gbmV3IE1hcCh0aGlzLmFjdGlvbnNTdGF0ZXMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IHJ1bGUuYWN0aW9ucy5maW5kKGEgPT4gYS52YWx1ZSA9PT0gZmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuc2V0KGZpZWxkTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGZpZWxkVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGFjdGlvblxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcy5zZXQoZmllbGROYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwbHlBY3Rpb25zKG9sZFN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZm9ybS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSB0YXJnZXQ/Lm5hbWU7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFZhbHVlID0gdGFyZ2V0Py52YWx1ZTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2hhbmdlXScsIGUpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhmaWVsZFZhbHVlLCBcInxcIiwgZmllbGROYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IHJ1bGUgPSB0aGlzLnJ1bGVzLmZpbmQociA9PiByLnZhcmlhYmxlID09PSBmaWVsZE5hbWUpO1xuICAgICAgICAgICAgaWYgKHJ1bGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb24gPSBydWxlLmFjdGlvbnMuZmluZChhID0+IGEudmFsdWUgPT09IGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkU3RhdGUgPSBuZXcgTWFwKHRoaXMuYWN0aW9uc1N0YXRlcyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcy5zZXQoZmllbGROYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZmllbGRWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmFwcGx5QWN0aW9ucyhvbGRTdGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRTdGF0ZSA9IG5ldyBNYXAodGhpcy5hY3Rpb25zU3RhdGVzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLnNldChmaWVsZE5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogbnVsbFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHBseUFjdGlvbnMob2xkU3RhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGluaXRSdWxlcygpIHtcbiAgICAgICAgdGhpcy5ydWxlcy5mb3JFYWNoKHJ1bGUgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmllbGQgPSB0aGlzLmZvcm0uZWxlbWVudHMubmFtZWRJdGVtKHJ1bGUudmFyaWFibGUpO1xuICAgICAgICAgICAgaWYgKGZpZWxkKSB7XG4gICAgICAgICAgICAgICAgbGV0IGZpZWxkVmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQgaW5zdGFuY2VvZiBSYWRpb05vZGVMaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrZWRSYWRpbyA9IEFycmF5LmZyb20oZmllbGQpLmZpbmQoKHJhZGlvKSA9PiByYWRpby5jaGVja2VkKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZSA9IGNoZWNrZWRSYWRpbz8udmFsdWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGZpZWxkIGluc3RhbmNlb2YgSFRNTFNlbGVjdEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZSA9IGZpZWxkLnZhbHVlIHx8ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChmaWVsZCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09ICdyYWRpbycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWUgPSBmaWVsZC5jaGVja2VkID8gZmllbGQudmFsdWUgOiAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChmaWVsZC50eXBlID09PSAnY2hlY2tib3gnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlID0gZmllbGQuY2hlY2tlZCA/IGZpZWxkLnZhbHVlIDogJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlID0gZmllbGQudmFsdWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtpbml0UnVsZXNdINCf0L7Qu9C1OicsIHJ1bGUudmFyaWFibGUsICfQl9C90LDRh9C10L3QuNC1OicsIGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IHJ1bGUuYWN0aW9ucy5maW5kKGEgPT4gYS52YWx1ZSA9PT0gZmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbiAmJiBmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcy5zZXQocnVsZS52YXJpYWJsZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGZpZWxkVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGFjdGlvblxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtpbml0UnVsZXNdINCY0L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdC+INGB0L7RgdGC0L7Rj9C90LjQtSDQtNC70Y86JywgcnVsZS52YXJpYWJsZSwgYWN0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNsZWFudXBDYXJ0T25Jbml0KCk7XG4gICAgfVxuICAgIGFzeW5jIGNsZWFudXBDYXJ0T25Jbml0KCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQndCw0YfQsNC70L4g0L7Rh9C40YHRgtC60Lgg0LrQvtGA0LfQuNC90YsnKTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjaGVja0NhcnQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICAgICAgICAgIGlmICh0aWxkYUNhcnQgJiYgdGlsZGFDYXJ0LnByb2R1Y3RzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodm9pZCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoY2hlY2tDYXJ0LCAyMDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjaGVja0NhcnQoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgaWYgKCF0aWxkYUNhcnQgfHwgIUFycmF5LmlzQXJyYXkodGlsZGFDYXJ0LnByb2R1Y3RzKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQmtC+0YDQt9C40L3QsCDQvdC10LTQvtGB0YLRg9C/0L3QsCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCi0L7QstCw0YDRiyDQsiDQutC+0YDQt9C40L3QtTonLCB0aWxkYUNhcnQucHJvZHVjdHMubWFwKChwKSA9PiBwLm5hbWUpKTtcbiAgICAgICAgY29uc3QgYWxsUnVsZVByb2R1Y3RzID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLnJ1bGVzLmZvckVhY2gocnVsZSA9PiB7XG4gICAgICAgICAgICBydWxlLmFjdGlvbnMuZm9yRWFjaChhY3Rpb24gPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYWxsUnVsZVByb2R1Y3RzLmFkZChhY3Rpb24udmFsdWUudHJpbSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGFjdGl2ZVByb2R1Y3RzID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuZm9yRWFjaCgoc3RhdGUpID0+IHtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5hY3Rpb24gJiYgc3RhdGUuYWN0aW9uLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgYWN0aXZlUHJvZHVjdHMuYWRkKHN0YXRlLmFjdGlvbi52YWx1ZS50cmltKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0JLRgdC1INGC0L7QstCw0YDRiyDQuNC3INC/0YDQsNCy0LjQuzonLCBBcnJheS5mcm9tKGFsbFJ1bGVQcm9kdWN0cykpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQkNC60YLQuNCy0L3Ri9C1INGC0L7QstCw0YDRizonLCBBcnJheS5mcm9tKGFjdGl2ZVByb2R1Y3RzKSk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3RzVG9SZW1vdmUgPSBbXTtcbiAgICAgICAgdGlsZGFDYXJ0LnByb2R1Y3RzLmZvckVhY2goKHByb2R1Y3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3ROYW1lID0gcHJvZHVjdC5uYW1lPy50cmltKCk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdE5hbWUgJiYgYWxsUnVsZVByb2R1Y3RzLmhhcyhwcm9kdWN0TmFtZSkgJiYgIWFjdGl2ZVByb2R1Y3RzLmhhcyhwcm9kdWN0TmFtZSkpIHtcbiAgICAgICAgICAgICAgICBwcm9kdWN0c1RvUmVtb3ZlLnB1c2gocHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0KLQvtCy0LDRgNGLINC00LvRjyDRg9C00LDQu9C10L3QuNGPOicsIHByb2R1Y3RzVG9SZW1vdmUpO1xuICAgICAgICBpZiAocHJvZHVjdHNUb1JlbW92ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHByb2R1Y3ROYW1lIG9mIHByb2R1Y3RzVG9SZW1vdmUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQo9C00LDQu9GP0LXQvDonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5yZW1vdmVQcm9kdWN0RnJvbUNhcnQocHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g4pyTINCe0YfQuNGB0YLQutCwINC30LDQstC10YDRiNC10L3QsCcpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0J3QtdGCINGC0L7QstCw0YDQvtCyINC00LvRjyDRg9C00LDQu9C10L3QuNGPJyk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5oaWRlUXVhbnRpdHlDb250cm9sc0ZvclJ1bGVQcm9kdWN0cygpO1xuICAgIH1cbiAgICBzYXZlVGlsZGFDYXJ0KHRpbGRhQ2FydCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5pc1VwZGF0aW5nQ2FydCA9IHRydWU7XG4gICAgICAgICAgICB0aWxkYUNhcnQudXBkYXRlZCA9IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApO1xuICAgICAgICAgICAgY29uc3QgY2FydERhdGEgPSB7XG4gICAgICAgICAgICAgICAgcHJvZHVjdHM6IHRpbGRhQ2FydC5wcm9kdWN0cyB8fCBbXSxcbiAgICAgICAgICAgICAgICBwcm9kYW1vdW50OiB0aWxkYUNhcnQucHJvZGFtb3VudCB8fCAwLFxuICAgICAgICAgICAgICAgIGFtb3VudDogdGlsZGFDYXJ0LmFtb3VudCB8fCAwLFxuICAgICAgICAgICAgICAgIHRvdGFsOiB0aWxkYUNhcnQucHJvZHVjdHM/Lmxlbmd0aCB8fCAwLFxuICAgICAgICAgICAgICAgIHVwZGF0ZWQ6IHRpbGRhQ2FydC51cGRhdGVkLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5OiB0aWxkYUNhcnQuY3VycmVuY3kgfHwgXCLRgC5cIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV9zaWRlOiB0aWxkYUNhcnQuY3VycmVuY3lfc2lkZSB8fCBcInJcIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV9zZXA6IHRpbGRhQ2FydC5jdXJyZW5jeV9zZXAgfHwgXCIsXCIsXG4gICAgICAgICAgICAgICAgY3VycmVuY3lfZGVjOiB0aWxkYUNhcnQuY3VycmVuY3lfZGVjIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgY3VycmVuY3lfdHh0OiB0aWxkYUNhcnQuY3VycmVuY3lfdHh0IHx8IFwi0YAuXCIsXG4gICAgICAgICAgICAgICAgY3VycmVuY3lfdHh0X3I6IHRpbGRhQ2FydC5jdXJyZW5jeV90eHRfciB8fCBcIiDRgC5cIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV90eHRfbDogdGlsZGFDYXJ0LmN1cnJlbmN5X3R4dF9sIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgc3lzdGVtOiB0aWxkYUNhcnQuc3lzdGVtIHx8IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgIHNldHRpbmdzOiB0aWxkYUNhcnQuc2V0dGluZ3MgfHwge30sXG4gICAgICAgICAgICAgICAgZGVsaXZlcnk6IHRpbGRhQ2FydC5kZWxpdmVyeSB8fCB7IG5hbWU6IFwibm9kZWxpdmVyeVwiLCBwcmljZTogMCB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3RjYXJ0JywgSlNPTi5zdHJpbmdpZnkoY2FydERhdGEpKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbc2F2ZVRpbGRhQ2FydF0g4pyTINCa0L7RgNC30LjQvdCwINGB0L7RhdGA0LDQvdC10L3QsCDQsiBsb2NhbFN0b3JhZ2UnKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNVcGRhdGluZ0NhcnQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3NhdmVUaWxkYUNhcnRdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjzonLCBlKTtcbiAgICAgICAgICAgIHRoaXMuaXNVcGRhdGluZ0NhcnQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0Q2FydE9ic2VydmVyKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRDYXJ0T2JzZXJ2ZXJdINCY0L3QuNGG0LjQsNC70LjQt9Cw0YbQuNGPINC90LDQsdC70Y7QtNCw0YLQtdC70Y8g0LrQvtGA0LfQuNC90YsnKTtcbiAgICAgICAgbGV0IGxhc3RNYWluUHJvZHVjdHNRdHkgPSB0aGlzLmdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCk7XG4gICAgICAgIGNvbnN0IGNoZWNrQ2FydENoYW5nZXMgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50UXR5ID0gdGhpcy5nZXRNYWluUHJvZHVjdHNRdWFudGl0eSgpO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdHkgIT09IGxhc3RNYWluUHJvZHVjdHNRdHkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0g0JjQt9C80LXQvdC40LvQvtGB0Ywg0LrQvtC70LjRh9C10YHRgtCy0L4g0YLQvtCy0LDRgNC+0LI6Jywge1xuICAgICAgICAgICAgICAgICAgICDQsdGL0LvQvjogbGFzdE1haW5Qcm9kdWN0c1F0eSxcbiAgICAgICAgICAgICAgICAgICAg0YHRgtCw0LvQvjogY3VycmVudFF0eVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGxhc3RNYWluUHJvZHVjdHNRdHkgPSBjdXJyZW50UXR5O1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgb2JzZXJ2ZUNhcnQgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjYXJ0Q29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLkNBUlRfQ09OVEFJTkVSKTtcbiAgICAgICAgICAgIGlmIChjYXJ0Q29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2FydE9ic2VydmVyXSBNdXRhdGlvbk9ic2VydmVyOiDQvtCx0L3QsNGA0YPQttC10L3RiyDQuNC30LzQtdC90LXQvdC40Y8nKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdRdHkgPSB0aGlzLmdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV3UXR5ICE9PSBsYXN0TWFpblByb2R1Y3RzUXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdE1haW5Qcm9kdWN0c1F0eSA9IG5ld1F0eTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZGVRdWFudGl0eUNvbnRyb2xzRm9yUnVsZVByb2R1Y3RzKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIERFTEFZUy5DQVJUX1VQREFURSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShjYXJ0Q29udGFpbmVyLCB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRDYXJ0T2JzZXJ2ZXJdIOKckyBNdXRhdGlvbk9ic2VydmVyINGD0YHRgtCw0L3QvtCy0LvQtdC9Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KG9ic2VydmVDYXJ0LCAxMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgb2JzZXJ2ZUNhcnQoKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgICAgICBjb25zdCBkZWxldGVCdXR0b24gPSB0YXJnZXQuY2xvc2VzdChET01fU0VMRUNUT1JTLlBST0RVQ1RfREVMX0JVVFRPTik7XG4gICAgICAgICAgICBpZiAoZGVsZXRlQnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdEVsZW1lbnQgPSBkZWxldGVCdXR0b24uY2xvc2VzdChET01fU0VMRUNUT1JTLkNBUlRfUFJPRFVDVCk7XG4gICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRpdGxlRWwgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9USVRMRSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3ROYW1lID0gdGl0bGVFbD8udGV4dENvbnRlbnQ/LnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2R1Y3ROYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0g0KPQtNCw0LvQtdC90LjQtSDRgtC+0LLQsNGA0LA6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVSdWxlUHJvZHVjdERlbGV0aW9uKHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGlzQ2FydEJ1dHRvbiA9IHRhcmdldC5jbG9zZXN0KGAke0RPTV9TRUxFQ1RPUlMuUFJPRFVDVF9QTFVTX0JVVFRPTn0sICR7RE9NX1NFTEVDVE9SUy5QUk9EVUNUX01JTlVTX0JVVFRPTn0sICR7RE9NX1NFTEVDVE9SUy5QUk9EVUNUX0RFTF9CVVRUT059YCk7XG4gICAgICAgICAgICBpZiAoaXNDYXJ0QnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjYXJ0T2JzZXJ2ZXJdINCa0LvQuNC6INC90LAg0LrQvdC+0L/QutGDINC60L7RgNC30LjQvdGLJyk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBjaGVja0NhcnRDaGFuZ2VzKCksIERFTEFZUy5PQlNFUlZFUl9DSEVDSyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBzZXR1cExvY2FsU3RvcmFnZUludGVyY2VwdG9yID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF3aW5kb3cuX19jYXJkZm9ybV9sb2NhbHN0b3JhZ2VfaW50ZXJjZXB0ZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvcmlnaW5hbFNldEl0ZW0gPSBTdG9yYWdlLnByb3RvdHlwZS5zZXRJdGVtO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAgIFN0b3JhZ2UucHJvdG90eXBlLnNldEl0ZW0gPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBvcmlnaW5hbFNldEl0ZW0uYXBwbHkodGhpcywgW2tleSwgdmFsdWVdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ3RjYXJ0JyAmJiAhc2VsZi5pc1VwZGF0aW5nQ2FydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjYXJ0T2JzZXJ2ZXJdIGxvY2FsU3RvcmFnZSB0Y2FydCDQuNC30LzQtdC90LXQvSDQuNC30LLQvdC1Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGNoZWNrQ2FydENoYW5nZXMoKSwgREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgd2luZG93Ll9fY2FyZGZvcm1fbG9jYWxzdG9yYWdlX2ludGVyY2VwdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRDYXJ0T2JzZXJ2ZXJdIOKckyBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSDQv9C10YDQtdGF0LLQsNGH0LXQvScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuICAgICAgICAgICAgc2V0dXBMb2NhbFN0b3JhZ2VJbnRlcmNlcHRvcigpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBzZXR1cExvY2FsU3RvcmFnZUludGVyY2VwdG9yKTtcbiAgICAgICAgfVxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaDtcbiAgICAgICAgICAgIGlmIChoYXNoID09PSAnI29wZW5jYXJ0Jykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2FydE9ic2VydmVyXSDQmtC+0YDQt9C40L3QsCDQvtGC0LrRgNGL0LLQsNC10YLRgdGPINGH0LXRgNC10LcgI29wZW5jYXJ0Jyk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZVF1YW50aXR5Q29udHJvbHNGb3JSdWxlUHJvZHVjdHMoKTtcbiAgICAgICAgICAgICAgICB9LCBERUxBWVMuQ0FSVF9VUERBVEUgKyAyMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgb2JzZXJ2ZUNhcnRWaXNpYmlsaXR5ID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2FydFdpbmRvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy50NzA2X19jYXJ0d2luJyk7XG4gICAgICAgICAgICBpZiAoY2FydFdpbmRvdykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZpc2liaWxpdHlPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbXV0YXRpb25zLmZvckVhY2goKG11dGF0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobXV0YXRpb24udHlwZSA9PT0gJ2F0dHJpYnV0ZXMnICYmIG11dGF0aW9uLmF0dHJpYnV0ZU5hbWUgPT09ICdjbGFzcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gbXV0YXRpb24udGFyZ2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygndDcwNl9fY2FydHdpbl9zaG93ZWQnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0g0JrQvtGA0LfQuNC90LAg0L/QvtC60LDQt9Cw0L3QsCAo0LrQu9Cw0YHRgSB0NzA2X19jYXJ0d2luX3Nob3dlZCknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZGVRdWFudGl0eUNvbnRyb2xzRm9yUnVsZVByb2R1Y3RzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIERFTEFZUy5DQVJUX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB2aXNpYmlsaXR5T2JzZXJ2ZXIub2JzZXJ2ZShjYXJ0V2luZG93LCB7XG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZUZpbHRlcjogWydjbGFzcyddXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtpbml0Q2FydE9ic2VydmVyXSDinJMg0J3QsNCx0LvRjtC00LDRgtC10LvRjCDQstC40LTQuNC80L7RgdGC0Lgg0LrQvtGA0LfQuNC90Ysg0YPRgdGC0LDQvdC+0LLQu9C10L0nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQob2JzZXJ2ZUNhcnRWaXNpYmlsaXR5LCAxMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgb2JzZXJ2ZUNhcnRWaXNpYmlsaXR5KCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdENhcnRPYnNlcnZlcl0g4pyTINCd0LDQsdC70Y7QtNCw0YLQtdC70Lgg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90YsnKTtcbiAgICB9XG4gICAgaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbihwcm9kdWN0TmFtZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCf0YDQvtCy0LXRgNC60LAg0YLQvtCy0LDRgNCwOicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgZm9yIChjb25zdCBba2V5LCBzdGF0ZV0gb2YgdGhpcy5hY3Rpb25zU3RhdGVzKSB7XG4gICAgICAgICAgICBpZiAoc3RhdGUuYWN0aW9uICYmIHN0YXRlLmFjdGlvbi52YWx1ZSA9PT0gcHJvZHVjdE5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCi0L7QstCw0YAg0LjQtyDQv9GA0LDQstC40LvQsCDQvdCw0LnQtNC10L06Jywge1xuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZToga2V5LFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHN0YXRlLmFjdGlvbi52YWx1ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGxldCBmb3VuZEVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsbElucHV0cyA9IHRoaXMuZm9ybS5xdWVyeVNlbGVjdG9yQWxsKCdpbnB1dCwgc2VsZWN0Jyk7XG4gICAgICAgICAgICAgICAgYWxsSW5wdXRzLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWwgPSBlbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAoKGVsLnR5cGUgPT09ICdyYWRpbycgfHwgZWwudHlwZSA9PT0gJ2NoZWNrYm94JykgJiYgZWwudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbC52YWx1ZS50cmltKCkgPT09IHN0YXRlLmFjdGlvbi52YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZEVsZW1lbnQgPSBlbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCd0LDQudC00LXQvSDRjdC70LXQvNC10L3RgjonLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGVsLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBlbC52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZDogZWwuY2hlY2tlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCh0L3QuNC80LDQtdC8INCy0YvQsdC+0YAg0YE6JywgZm91bmRFbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgZm91bmRFbGVtZW50LmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dIOKckyDQn9GA0LDQstC40LvQviDQvtGC0LzQtdC90LXQvdC+LCBjaGVja2JveCDRgdC90Y/RgicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCt0LvQtdC80LXQvdGCINGE0L7RgNC80Ysg0L3QtSDQvdCw0LnQtNC10L0g0LTQu9GPOicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uVmFsdWU6IHN0YXRlLmFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZUlucHV0czogQXJyYXkuZnJvbShhbGxJbnB1dHMpLm1hcChlbCA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGVsLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGVsLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIHVwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5KCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDQndCw0YfQsNC70L4g0L7QsdC90L7QstC70LXQvdC40Y8g0LrQvtC70LjRh9C10YHRgtCy0LAnKTtcbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAoIXRpbGRhQ2FydCB8fCAhQXJyYXkuaXNBcnJheSh0aWxkYUNhcnQucHJvZHVjdHMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCa0L7RgNC30LjQvdCwINC90LXQtNC+0YHRgtGD0L/QvdCwJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0JDQutGC0LjQstC90YvRhSDQv9GA0LDQstC40Ls6JywgdGhpcy5hY3Rpb25zU3RhdGVzLnNpemUpO1xuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHN0YXRlXSBvZiB0aGlzLmFjdGlvbnNTdGF0ZXMpIHtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5hY3Rpb24gJiYgc3RhdGUuYWN0aW9uLnF1YW50aXR5VHlwZSA9PT0gJ3BlclByb2R1Y3QnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3UXVhbnRpdHkgPSB0aGlzLmNhbGN1bGF0ZVJ1bGVQcm9kdWN0UXVhbnRpdHkoc3RhdGUuYWN0aW9uKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0SW5kZXggPSB0aWxkYUNhcnQucHJvZHVjdHMuZmluZEluZGV4KChwKSA9PiBwLm5hbWU/LnRyaW0oKSA9PT0gc3RhdGUuYWN0aW9uLnZhbHVlLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkUXVhbnRpdHkgPSBwYXJzZUludCh0aWxkYUNhcnQucHJvZHVjdHNbcHJvZHVjdEluZGV4XS5xdWFudGl0eSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCi0L7QstCw0YAgXCIke3N0YXRlLmFjdGlvbi52YWx1ZX1cIjpgLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRRdWFudGl0eTogb2xkUXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdRdWFudGl0eTogbmV3UXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICBuZWVkc1VwZGF0ZTogb2xkUXVhbnRpdHkgIT09IG5ld1F1YW50aXR5XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAob2xkUXVhbnRpdHkgIT09IG5ld1F1YW50aXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDimqEg0J7QsdC90L7QstC70Y/QtdC8INGH0LXRgNC10LcgdGNhcnRfX3Byb2R1Y3RfX3VwZGF0ZVF1YW50aXR5Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcHJvZHVjdEVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCAxMDsgYXR0ZW1wdCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdEVsZW1lbnQgPSBDYXJ0VXRpbHMuZmluZFByb2R1Y3RFbGVtZW50KHN0YXRlLmFjdGlvbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCt0LvQtdC80LXQvdGCINC90LDQudC00LXQvSDQvdCwINC/0L7Qv9GL0YLQutC1OicsIGF0dGVtcHQgKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRlbXB0IDwgOSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuRE9NX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcXVhbnRpdHlFbGVtZW50ID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLlBST0RVQ1RfUVVBTlRJVFkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChxdWFudGl0eUVsZW1lbnQgJiYgdHlwZW9mIHdpbmRvdy50Y2FydF9fcHJvZHVjdF9fdXBkYXRlUXVhbnRpdHkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnRjYXJ0X19wcm9kdWN0X191cGRhdGVRdWFudGl0eShxdWFudGl0eUVsZW1lbnQsIHByb2R1Y3RFbGVtZW50LCBwcm9kdWN0SW5kZXgsIG5ld1F1YW50aXR5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g4pyTINCa0L7Qu9C40YfQtdGB0YLQstC+INC+0LHQvdC+0LLQu9C10L3QviDRh9C10YDQtdC3IFRpbGRhIEFQSTonLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRRdWFudGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1F1YW50aXR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuRE9NX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsdXNNaW51c0J1dHRvbnMgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9QTFVTTUlOVVMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGx1c01pbnVzQnV0dG9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1c01pbnVzQnV0dG9ucy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCd0LUg0L3QsNC50LTQtdC9IHF1YW50aXR5RWxlbWVudCDQuNC70Lgg0YTRg9C90LrRhtC40Y8gdXBkYXRlUXVhbnRpdHknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCd0LUg0L3QsNC50LTQtdC9IERPTSDRjdC70LXQvNC10L3RgiDRgtC+0LLQsNGA0LAg0L/QvtGB0LvQtSDQvtC20LjQtNCw0L3QuNGPJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0KLQvtCy0LDRgCBcIiR7c3RhdGUuYWN0aW9uLnZhbHVlfVwiINCd0JUg0L3QsNC50LTQtdC9INCyINC60L7RgNC30LjQvdC1YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldIOKckyDQntCx0L3QvtCy0LvQtdC90LjQtSDQt9Cw0LLQtdGA0YjQtdC90L4nKTtcbiAgICAgICAgYXdhaXQgdGhpcy5oaWRlUXVhbnRpdHlDb250cm9sc0ZvclJ1bGVQcm9kdWN0cygpO1xuICAgIH1cbiAgICB1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET00ocHJvZHVjdE5hbWUsIG5ld1F1YW50aXR5KSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDQntCx0L3QvtCy0LvQtdC90LjQtTonLCB7IHByb2R1Y3ROYW1lLCBuZXdRdWFudGl0eSB9KTtcbiAgICAgICAgY29uc3QgdGl0bGVTZWxlY3RvcnMgPSBbXG4gICAgICAgICAgICAnLnQ3MDZfX3Byb2R1Y3QtdGl0bGUnLFxuICAgICAgICAgICAgJy50LXN0b3JlX19wcm9kdWN0LW5hbWUnLFxuICAgICAgICAgICAgJy50LXByb2R1Y3RfX3RpdGxlJyxcbiAgICAgICAgICAgICcuanMtcHJvZHVjdC1uYW1lJ1xuICAgICAgICBdO1xuICAgICAgICBsZXQgcHJvZHVjdEVsZW1lbnQgPSBudWxsO1xuICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHRpdGxlU2VsZWN0b3JzKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0VGl0bGVzID0gWy4uLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDQn9C+0LjRgdC6INGH0LXRgNC10LcgXCIke3NlbGVjdG9yfVwiOmAsIHByb2R1Y3RUaXRsZXMubGVuZ3RoLCAn0Y3Qu9C10LzQtdC90YLQvtCyJyk7XG4gICAgICAgICAgICBjb25zdCBmb3VuZEVsZW1lbnQgPSBwcm9kdWN0VGl0bGVzLmZpbmQoZWwgPT4gZWwuaW5uZXJUZXh0LnRyaW0oKSA9PT0gcHJvZHVjdE5hbWUudHJpbSgpKTtcbiAgICAgICAgICAgIGlmIChmb3VuZEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBwcm9kdWN0RWxlbWVudCA9IGZvdW5kRWxlbWVudC5jbG9zZXN0KCcudDcwNl9fY2FydHdpbi1wcm9kdWN0LCAudC1zdG9yZV9fcHJvZHVjdCwgLnQtcHJvZHVjdCcpO1xuICAgICAgICAgICAgICAgIGlmIChwcm9kdWN0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g4pyTINCi0L7QstCw0YAg0L3QsNC50LTQtdC9INGH0LXRgNC10Lc6Jywgc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFwcm9kdWN0RWxlbWVudCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g4pyXINCt0LvQtdC80LXQvdGCINGC0L7QstCw0YDQsCDQndCVINC90LDQudC00LXQvSDQsiBET006JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dINCS0YHQtSDRgtC+0LLQsNGA0Ysg0LIgRE9NOicsIFsuLi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudDcwNl9fcHJvZHVjdC10aXRsZSwgLnQtc3RvcmVfX3Byb2R1Y3QtbmFtZScpXS5tYXAoKGVsKSA9PiBlbC5pbm5lclRleHQpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBxdWFudGl0eUlucHV0U2VsZWN0b3JzID0gW1xuICAgICAgICAgICAgJy50NzA2X19wcm9kdWN0LXF1YW50aXR5JyxcbiAgICAgICAgICAgICcudC1zdG9yZV9fcXVhbnRpdHktaW5wdXQnLFxuICAgICAgICAgICAgJ2lucHV0W25hbWU9XCJxdWFudGl0eVwiXScsXG4gICAgICAgICAgICAnLmpzLXByb2R1Y3QtcXVhbnRpdHknXG4gICAgICAgIF07XG4gICAgICAgIGxldCBxdWFudGl0eUlucHV0ID0gbnVsbDtcbiAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBxdWFudGl0eUlucHV0U2VsZWN0b3JzKSB7XG4gICAgICAgICAgICBxdWFudGl0eUlucHV0ID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgICAgICBpZiAocXVhbnRpdHlJbnB1dCkge1xuICAgICAgICAgICAgICAgIHF1YW50aXR5SW5wdXQudmFsdWUgPSBuZXdRdWFudGl0eS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIHF1YW50aXR5SW5wdXQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2NoYW5nZScsIHsgYnViYmxlczogdHJ1ZSB9KSk7XG4gICAgICAgICAgICAgICAgcXVhbnRpdHlJbnB1dC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnaW5wdXQnLCB7IGJ1YmJsZXM6IHRydWUgfSkpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDinJMg0J7QsdC90L7QstC70LXQvSBpbnB1dCDRh9C10YDQtdC3OicsIHNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBxdWFudGl0eURpc3BsYXlTZWxlY3RvcnMgPSBbXG4gICAgICAgICAgICAnLnQtcXVhbnRpdHlfX3ZhbHVlJyxcbiAgICAgICAgICAgICcudDcwNl9fcHJvZHVjdC1xdWFudGl0eS12YWx1ZScsXG4gICAgICAgICAgICAnLnQtc3RvcmVfX3F1YW50aXR5LXZhbHVlJ1xuICAgICAgICBdO1xuICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHF1YW50aXR5RGlzcGxheVNlbGVjdG9ycykge1xuICAgICAgICAgICAgY29uc3QgcXVhbnRpdHlEaXNwbGF5ID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgICAgICBpZiAocXVhbnRpdHlEaXNwbGF5KSB7XG4gICAgICAgICAgICAgICAgcXVhbnRpdHlEaXNwbGF5LnRleHRDb250ZW50ID0gbmV3UXVhbnRpdHkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g4pyTINCe0LHQvdC+0LLQu9C10L0gZGlzcGxheSDRh9C10YDQtdC3OicsIHNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICh0aWxkYUNhcnQpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aWxkYUNhcnQucHJvZHVjdHMuZmluZCgocCkgPT4gcC5uYW1lPy50cmltKCkgPT09IHByb2R1Y3ROYW1lLnRyaW0oKSk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsUHJpY2UgPSBwYXJzZUZsb2F0KHByb2R1Y3QucHJpY2UpICogbmV3UXVhbnRpdHk7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJpY2VTZWxlY3RvcnMgPSBbXG4gICAgICAgICAgICAgICAgICAgICcudDcwNl9fcHJvZHVjdC1wcmljZScsXG4gICAgICAgICAgICAgICAgICAgICcudC1zdG9yZV9fcHJvZHVjdC1wcmljZScsXG4gICAgICAgICAgICAgICAgICAgICcudC1wcm9kdWN0X19wcmljZScsXG4gICAgICAgICAgICAgICAgICAgICcuanMtcHJvZHVjdC1wcmljZSdcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgcHJpY2VTZWxlY3RvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJpY2VFbGVtZW50ID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmljZUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaWNlRWxlbWVudC50ZXh0Q29udGVudCA9IGAke3RvdGFsUHJpY2UudG9Mb2NhbGVTdHJpbmcoJ3J1LVJVJyl9ICR7dGlsZGFDYXJ0LmN1cnJlbmN5X3R4dF9yIHx8ICcg0YAuJ31gO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dIOKckyDQntCx0L3QvtCy0LvQtdC90LAg0YHRgtC+0LjQvNC+0YHRgtGMINGH0LXRgNC10Lc6Jywgc2VsZWN0b3IsIHRvdGFsUHJpY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dIOKckyDQntCx0L3QvtCy0LvQtdC90LjQtSDQt9Cw0LLQtdGA0YjQtdC90L4g0LTQu9GPOicsIHByb2R1Y3ROYW1lKTtcbiAgICB9XG4gICAgdXBkYXRlQWxsQ2FydEl0ZW1zSW5ET00oKSB7XG4gICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgaWYgKCF0aWxkYUNhcnQgfHwgIUFycmF5LmlzQXJyYXkodGlsZGFDYXJ0LnByb2R1Y3RzKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3VwZGF0ZUFsbENhcnRJdGVtc0luRE9NXSDQmtC+0YDQt9C40L3QsCDQvdC10LTQvtGB0YLRg9C/0L3QsCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQWxsQ2FydEl0ZW1zSW5ET01dINCe0LHQvdC+0LLQu9GP0LXQvCDQstGB0LUg0YLQvtCy0LDRgNGLINCyIERPTScpO1xuICAgICAgICB0aWxkYUNhcnQucHJvZHVjdHMuZm9yRWFjaCgocHJvZHVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdE5hbWUgPSBwcm9kdWN0Lm5hbWU/LnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IHF1YW50aXR5ID0gcGFyc2VJbnQocHJvZHVjdC5xdWFudGl0eSB8fCAxKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0TmFtZSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NKHByb2R1Y3ROYW1lLCBxdWFudGl0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUFsbENhcnRJdGVtc0luRE9NXSDinJMg0JLRgdC1INGC0L7QstCw0YDRiyDQvtCx0L3QvtCy0LvQtdC90YsnKTtcbiAgICB9XG4gICAgcmVmcmVzaENhcnRVSSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtyZWZyZXNoQ2FydFVJXSDQndCw0YfQsNC70L4g0L7QsdC90L7QstC70LXQvdC40Y8gVUkg0LrQvtGA0LfQuNC90YsnKTtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cudF9zdG9yZV9fcmVmcmVzaGNhcnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHdpbmRvdy50X3N0b3JlX19yZWZyZXNoY2FydCgpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtyZWZyZXNoQ2FydFVJXSDinJMg0JLRi9C30LLQsNC9IHRfc3RvcmVfX3JlZnJlc2hjYXJ0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVmcmVzaEZ1bmN0aW9ucyA9IFtcbiAgICAgICAgICAgICd0NzA2X191cGRhdGVDYXJ0JyxcbiAgICAgICAgICAgICd0Y2FydF9fdXBkYXRlQ2FydCcsXG4gICAgICAgICAgICAndF9zdG9yZV9fdXBkYXRlQ2FydCcsXG4gICAgICAgICAgICAndDcwNl9pbml0J1xuICAgICAgICBdO1xuICAgICAgICByZWZyZXNoRnVuY3Rpb25zLmZvckVhY2goZnVuY05hbWUgPT4ge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3dbZnVuY05hbWVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93W2Z1bmNOYW1lXSgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW3JlZnJlc2hDYXJ0VUldIOKckyDQktGL0LfQstCw0L0gJHtmdW5jTmFtZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZm9ybV0gW3JlZnJlc2hDYXJ0VUldINCe0YjQuNCx0LrQsCAke2Z1bmNOYW1lfTpgLCBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnVwZGF0ZUFsbENhcnRJdGVtc0luRE9NKCk7XG4gICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnY2FydC11cGRhdGVkJykpO1xuICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgndGNhcnQtdXBkYXRlZCcpKTtcbiAgICAgICAgdGhpcy51cGRhdGVDYXJ0Q291bnRlcnMoKTtcbiAgICB9XG4gICAgdXBkYXRlQ2FydENvdW50ZXJzKCkge1xuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICghdGlsZGFDYXJ0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBjYXJ0Q291bnRlcnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKERPTV9TRUxFQ1RPUlMuQ0FSVF9DT1VOVEVSKTtcbiAgICAgICAgY2FydENvdW50ZXJzLmZvckVhY2goY291bnRlciA9PiB7XG4gICAgICAgICAgICBpZiAoY291bnRlcikge1xuICAgICAgICAgICAgICAgIGNvdW50ZXIudGV4dENvbnRlbnQgPSB0aWxkYUNhcnQudG90YWwudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGNhcnRBbW91bnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChET01fU0VMRUNUT1JTLkNBUlRfQU1PVU5UKTtcbiAgICAgICAgY2FydEFtb3VudHMuZm9yRWFjaChhbW91bnQgPT4ge1xuICAgICAgICAgICAgaWYgKGFtb3VudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdHRlZEFtb3VudCA9IHRpbGRhQ2FydC5hbW91bnQudG9Mb2NhbGVTdHJpbmcoJ3J1LVJVJyk7XG4gICAgICAgICAgICAgICAgYW1vdW50LnRleHRDb250ZW50ID0gYCR7Zm9ybWF0dGVkQW1vdW50fSAke3RpbGRhQ2FydC5jdXJyZW5jeV90eHRfciB8fCAnINGALid9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydENvdW50ZXJzXSDinJMg0KHRh9C10YLRh9C40LrQuCDQvtCx0L3QvtCy0LvQtdC90YsnKTtcbiAgICB9XG4gICAgZ2V0TWFpblByb2R1Y3RzUXVhbnRpdHkoKSB7XG4gICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgaWYgKCF0aWxkYUNhcnQgfHwgIUFycmF5LmlzQXJyYXkodGlsZGFDYXJ0LnByb2R1Y3RzKSkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcnVsZVByb2R1Y3ROYW1lcyA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5ydWxlcy5mb3JFYWNoKHJ1bGUgPT4ge1xuICAgICAgICAgICAgcnVsZS5hY3Rpb25zLmZvckVhY2goYWN0aW9uID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bGVQcm9kdWN0TmFtZXMuYWRkKGFjdGlvbi52YWx1ZS50cmltKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgbGV0IHRvdGFsUXVhbnRpdHkgPSAwO1xuICAgICAgICBjb25zdCBtYWluUHJvZHVjdHMgPSBbXTtcbiAgICAgICAgdGlsZGFDYXJ0LnByb2R1Y3RzLmZvckVhY2goKHByb2R1Y3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3ROYW1lID0gcHJvZHVjdC5uYW1lPy50cmltKCk7XG4gICAgICAgICAgICBjb25zdCBpc1J1bGVQcm9kdWN0ID0gcnVsZVByb2R1Y3ROYW1lcy5oYXMocHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgY29uc3QgcXR5ID0gcGFyc2VJbnQocHJvZHVjdC5xdWFudGl0eSB8fCAxKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0TmFtZSAmJiAhaXNSdWxlUHJvZHVjdCkge1xuICAgICAgICAgICAgICAgIHRvdGFsUXVhbnRpdHkgKz0gcXR5O1xuICAgICAgICAgICAgICAgIG1haW5Qcm9kdWN0cy5wdXNoKGAke3Byb2R1Y3ROYW1lfSAoJHtxdHl9INGI0YIpYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2dldE1haW5Qcm9kdWN0c1F1YW50aXR5XScsIHtcbiAgICAgICAgICAgICfQntGB0L3QvtCy0L3Ri9GFINGC0L7QstCw0YDQvtCyJzogdG90YWxRdWFudGl0eSxcbiAgICAgICAgICAgICfQodC/0LjRgdC+0LonOiBtYWluUHJvZHVjdHMsXG4gICAgICAgICAgICAn0KLQvtCy0LDRgNGLINC/0YDQsNCy0LjQuyc6IEFycmF5LmZyb20ocnVsZVByb2R1Y3ROYW1lcylcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0b3RhbFF1YW50aXR5O1xuICAgIH1cbiAgICBjYWxjdWxhdGVSdWxlUHJvZHVjdFF1YW50aXR5KGFjdGlvbikge1xuICAgICAgICBpZiAoYWN0aW9uLnF1YW50aXR5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBhY3Rpb24ucXVhbnRpdHk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFjdGlvbi5xdWFudGl0eVR5cGUgPT09ICdwZXJQcm9kdWN0Jykge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGgubWF4KDEsIHRoaXMuZ2V0TWFpblByb2R1Y3RzUXVhbnRpdHkoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIGFzeW5jIHJlbW92ZVByb2R1Y3RGcm9tQ2FydChwcm9kdWN0TmFtZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3JlbW92ZVByb2R1Y3RdINCf0L7Qv9GL0YLQutCwINGD0LTQsNC70LjRgtGMOicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgY29uc3QgcHJvZHVjdEVsZW1lbnQgPSBDYXJ0VXRpbHMuZmluZFByb2R1Y3RFbGVtZW50KHByb2R1Y3ROYW1lKTtcbiAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICBjb25zdCBkZWxQcm9kdWN0QnV0dG9uID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLlBST0RVQ1RfREVMX0JVVFRPTik7XG4gICAgICAgICAgICBpZiAoZGVsUHJvZHVjdEJ1dHRvbikge1xuICAgICAgICAgICAgICAgIGRlbFByb2R1Y3RCdXR0b24uY2xpY2soKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3JlbW92ZVByb2R1Y3RdIOKckyDQo9C00LDQu9C10L3QviDRh9C10YDQtdC3IERPTSAo0LrQu9C40LopOicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuQ0FSVF9VUERBVEUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgaWYgKHRpbGRhQ2FydCAmJiBBcnJheS5pc0FycmF5KHRpbGRhQ2FydC5wcm9kdWN0cykpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RJbmRleCA9IHRpbGRhQ2FydC5wcm9kdWN0cy5maW5kSW5kZXgoKHApID0+IHAubmFtZT8udHJpbSgpID09PSBwcm9kdWN0TmFtZS50cmltKCkpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3RJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGlsZGFDYXJ0LnByb2R1Y3RzW3Byb2R1Y3RJbmRleF07XG4gICAgICAgICAgICAgICAgY29uc3QgcmVtb3ZlRnVuY3Rpb25zID0gW1xuICAgICAgICAgICAgICAgICAgICAndGNhcnRfX3JlbW92ZVByb2R1Y3QnLFxuICAgICAgICAgICAgICAgICAgICAndGNhcnRfcmVtb3ZlUHJvZHVjdCcsXG4gICAgICAgICAgICAgICAgICAgICd0X3N0b3JlX19yZW1vdmVQcm9kdWN0J1xuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBmdW5jTmFtZSBvZiByZW1vdmVGdW5jdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3dbZnVuY05hbWVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvd1tmdW5jTmFtZV0ocHJvZHVjdC51aWQgfHwgcHJvZHVjdC5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtyZW1vdmVQcm9kdWN0XSDinJMg0KPQtNCw0LvQtdC90L4g0YfQtdGA0LXQtyAke2Z1bmNOYW1lfTpgLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgQ2FydFV0aWxzLndhaXQoREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZm9ybV0gW3JlbW92ZVByb2R1Y3RdINCe0YjQuNCx0LrQsCAke2Z1bmNOYW1lfTpgLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aWxkYUNhcnQucHJvZHVjdHMuc3BsaWNlKHByb2R1Y3RJbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgdGlsZGFDYXJ0LmFtb3VudCA9IHRpbGRhQ2FydC5wcm9kdWN0cy5yZWR1Y2UoKHN1bSwgcCkgPT4gc3VtICsgKHBhcnNlRmxvYXQocC5wcmljZSkgKiBwYXJzZUludChwLnF1YW50aXR5IHx8IDEpKSwgMCk7XG4gICAgICAgICAgICAgICAgdGlsZGFDYXJ0LnByb2RhbW91bnQgPSB0aWxkYUNhcnQucHJvZHVjdHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHRpbGRhQ2FydC50b3RhbCA9IHRpbGRhQ2FydC5wcm9kdWN0cy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdGlsZGFDYXJ0LnVwZGF0ZWQgPSBNYXRoLmZsb29yKERhdGUubm93KCkgLyAxMDAwKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zYXZlVGlsZGFDYXJ0KHRpbGRhQ2FydCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cudF9zdG9yZV9fcmVmcmVzaGNhcnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy50X3N0b3JlX19yZWZyZXNoY2FydCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbcmVtb3ZlUHJvZHVjdF0g4pyTINCj0LTQsNC70LXQvdC+INC90LDQv9GA0Y/QvNGD0Y4g0LjQtyDQvNCw0YHRgdC40LLQsDonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IENhcnRVdGlscy53YWl0KERFTEFZUy5DQVJUX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbcmVtb3ZlUHJvZHVjdF0g4pyXINCd0LUg0YPQtNCw0LvQvtGB0Ywg0YPQtNCw0LvQuNGC0Ywg0YLQvtCy0LDRgDonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYXN5bmMgYXBwbHlBY3Rpb25zKG9sZFN0YXRlID0gbmV3IE1hcCgpKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQndCw0YfQsNC70L4g0L/RgNC40LzQtdC90LXQvdC40Y8g0LTQtdC50YHRgtCy0LjQuScpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0KHRgtCw0YDQvtC1INGB0L7RgdGC0L7Rj9C90LjQtTonLCBPYmplY3QuZnJvbUVudHJpZXMob2xkU3RhdGUpKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdINCd0L7QstC+0LUg0YHQvtGB0YLQvtGP0L3QuNC1OicsIE9iamVjdC5mcm9tRW50cmllcyh0aGlzLmFjdGlvbnNTdGF0ZXMpKTtcbiAgICAgICAgY29uc3QgY2FydExvYWRlZCA9IGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICAgICAgICBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFsuLi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAudDcwNl9fcHJvZHVjdC10aXRsZWApXS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCAyMDApO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZShmYWxzZSksIDMwMDApKVxuICAgICAgICBdKTtcbiAgICAgICAgaWYgKCFjYXJ0TG9hZGVkKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQmtC+0YDQt9C40L3QsCDQvdC1INC30LDQs9GA0YPQt9C40LvQsNGB0Ywg0LfQsCAzINGB0LXQutGD0L3QtNGLLCDQv9GA0L7QtNC+0LvQttCw0LXQvCcpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgW2tleSwgc3RhdGVdIG9mIHRoaXMuYWN0aW9uc1N0YXRlcykge1xuICAgICAgICAgICAgY29uc3Qgb2xkVmFsdWUgPSBvbGRTdGF0ZS5nZXQoa2V5KT8udmFsdWU7XG4gICAgICAgICAgICBjb25zdCBvbGRBY3Rpb24gPSBvbGRTdGF0ZS5nZXQoa2V5KT8uYWN0aW9uO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFthcHBseUFjdGlvbnNdINCe0LHRgNCw0LHQvtGC0LrQsCDQv9C+0LvRjyBcIiR7a2V5fVwiOmAsIHtcbiAgICAgICAgICAgICAgICBvbGRWYWx1ZSxcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZTogc3RhdGUudmFsdWUsXG4gICAgICAgICAgICAgICAgb2xkQWN0aW9uOiBvbGRBY3Rpb24/LnZhbHVlLFxuICAgICAgICAgICAgICAgIG5ld0FjdGlvbjogc3RhdGUuYWN0aW9uPy52YWx1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoc3RhdGUudmFsdWUgIT09IG9sZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9sZEFjdGlvbiAmJiBvbGRBY3Rpb24udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdINCj0LTQsNC70Y/QtdC8INGB0YLQsNGA0YvQuSDRgtC+0LLQsNGAOicsIG9sZEFjdGlvbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucmVtb3ZlUHJvZHVjdEZyb21DYXJ0KG9sZEFjdGlvbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS52YWx1ZSAmJiBzdGF0ZS5hY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdElkID0gYHJ1bGVfJHtrZXl9XyR7RGF0ZS5ub3coKX1gO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0UXVhbnRpdHkgPSB0aGlzLmNhbGN1bGF0ZVJ1bGVQcm9kdWN0UXVhbnRpdHkoc3RhdGUuYWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdINCU0L7QsdCw0LLQu9GP0LXQvCDQvdC+0LLRi9C5INGC0L7QstCw0YA6Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHByb2R1Y3RJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHN0YXRlLmFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaWNlOiBzdGF0ZS5hY3Rpb24uc3VtIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWFudGl0eTogcHJvZHVjdFF1YW50aXR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgcXVhbnRpdHlUeXBlOiBzdGF0ZS5hY3Rpb24ucXVhbnRpdHlUeXBlIHx8ICdmaXhlZCdcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy50Y2FydF9fYWRkUHJvZHVjdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogcHJvZHVjdElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogc3RhdGUuYWN0aW9uLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJpY2U6IHN0YXRlLmFjdGlvbi5zdW0gfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXR5OiBwcm9kdWN0UXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGFuZ2VQcm9kdWN0ID0gYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGFuZ2VQcm9kdWN0ID0gWy4uLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC50NzA2X19wcm9kdWN0LXRpdGxlYCldXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKChlKSA9PiBlLmlubmVyVGV4dC50cmltKCkgPT09IHN0YXRlLmFjdGlvbi52YWx1ZS50cmltKCkpPy5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoY2hhbmdlUHJvZHVjdCB8fCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VQcm9kdWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGFuZ2VQcm9kdWN0QnV0dG9uID0gY2hhbmdlUHJvZHVjdC5xdWVyeVNlbGVjdG9yKGAudDcwNl9fcHJvZHVjdC1wbHVzbWludXNgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VQcm9kdWN0QnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlUHJvZHVjdEJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDinJMg0KHQutGA0YvRgtGLINC60L3QvtC/0LrQuCDQutC+0LvQuNGH0LXRgdGC0LLQsCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFzdGF0ZS52YWx1ZSB8fCAhc3RhdGUuYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQl9C90LDRh9C10L3QuNC1INGB0LHRgNC+0YjQtdC90L4sINGC0L7QstCw0YAg0YPQtNCw0LvQtdC9Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDinJMg0J/RgNC40LzQtdC90LXQvdC40LUg0LTQtdC50YHRgtCy0LjQuSDQt9Cw0LLQtdGA0YjQtdC90L4nKTtcbiAgICAgICAgYXdhaXQgdGhpcy5oaWRlUXVhbnRpdHlDb250cm9sc0ZvclJ1bGVQcm9kdWN0cygpO1xuICAgIH1cbiAgICBnZXRBbGxSdWxlUHJvZHVjdE5hbWVzKCkge1xuICAgICAgICBjb25zdCBydWxlUHJvZHVjdE5hbWVzID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLnJ1bGVzLmZvckVhY2gocnVsZSA9PiB7XG4gICAgICAgICAgICBydWxlLmFjdGlvbnMuZm9yRWFjaChhY3Rpb24gPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVsZVByb2R1Y3ROYW1lcy5hZGQoYWN0aW9uLnZhbHVlLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hpZGVRdWFudGl0eV0g0JLRgdC1INGC0L7QstCw0YDRiyDQuNC3INC/0YDQsNCy0LjQuzonLCBBcnJheS5mcm9tKHJ1bGVQcm9kdWN0TmFtZXMpKTtcbiAgICAgICAgcmV0dXJuIHJ1bGVQcm9kdWN0TmFtZXM7XG4gICAgfVxuICAgIGFzeW5jIGhpZGVRdWFudGl0eUNvbnRyb2xzRm9yUnVsZVByb2R1Y3RzKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hpZGVRdWFudGl0eV0g0J3QsNGH0LDQu9C+INGB0LrRgNGL0YLQuNGPINGB0YfQtdGC0YfQuNC60L7QsiDQtNC70Y8g0YLQvtCy0LDRgNC+0LIg0LjQtyDQv9GA0LDQstC40LsnKTtcbiAgICAgICAgY29uc3QgcnVsZVByb2R1Y3ROYW1lcyA9IHRoaXMuZ2V0QWxsUnVsZVByb2R1Y3ROYW1lcygpO1xuICAgICAgICBpZiAocnVsZVByb2R1Y3ROYW1lcy5zaXplID09PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hpZGVRdWFudGl0eV0g0J3QtdGCINGC0L7QstCw0YDQvtCyINC40Lcg0L/RgNCw0LLQuNC7Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgQ2FydFV0aWxzLndhaXQoREVMQVlTLkRPTV9VUERBVEUpO1xuICAgICAgICBjb25zdCBwcm9kdWN0RWxlbWVudHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKERPTV9TRUxFQ1RPUlMuQ0FSVF9QUk9EVUNUKTtcbiAgICAgICAgbGV0IGhpZGRlbkNvdW50ID0gMDtcbiAgICAgICAgcHJvZHVjdEVsZW1lbnRzLmZvckVhY2goKHByb2R1Y3RFbGVtZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0aXRsZUVsZW1lbnQgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9USVRMRSk7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0TmFtZSA9IHRpdGxlRWxlbWVudD8udGV4dENvbnRlbnQ/LnRyaW0oKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0TmFtZSAmJiBydWxlUHJvZHVjdE5hbWVzLmhhcyhwcm9kdWN0TmFtZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwbHVzTWludXNCbG9jayA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoRE9NX1NFTEVDVE9SUy5QUk9EVUNUX1BMVVNNSU5VUyk7XG4gICAgICAgICAgICAgICAgaWYgKHBsdXNNaW51c0Jsb2NrICYmIHBsdXNNaW51c0Jsb2NrLnN0eWxlLmRpc3BsYXkgIT09ICdub25lJykge1xuICAgICAgICAgICAgICAgICAgICBwbHVzTWludXNCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICBoaWRkZW5Db3VudCsrO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW2hpZGVRdWFudGl0eV0g4pyTINCh0LrRgNGL0YLRiyDQutC90L7Qv9C60Lgg0LTQu9GPINGC0L7QstCw0YDQsDogXCIke3Byb2R1Y3ROYW1lfVwiYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtoaWRlUXVhbnRpdHldIOKckyDQodC60YDRi9GC0L4g0YHRh9C10YLRh9C40LrQvtCyOiAke2hpZGRlbkNvdW50fWApO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IEVkaXRvclN0b3JhZ2VNYW5hZ2VyIH0gZnJvbSAnLi4vbWFuYWdlcnMvRWRpdG9yU3RvcmFnZU1hbmFnZXInO1xuaW1wb3J0IHsgTGF5b3V0IH0gZnJvbSAnLi4vbW9kZWxzL0xheW91dCc7XG5pbXBvcnQgeyBnZXRMYXN0Q2hpbGQgfSBmcm9tICcuLi91dGlscy90aWxkYVV0aWxzJztcbmltcG9ydCB7IFR5cGVkRXZlbnRFbWl0dGVyIH0gZnJvbSAnLi4vdXRpbHMvVHlwZWRFdmVudEVtaXR0ZXInO1xuaW1wb3J0IHsgZ2VuZXJhdGVJbWFnZSwgY3JlYXRlUHJvZHVjdCB9IGZyb20gJy4uL3V0aWxzL2FwaSc7XG5jb25zdCBDT05TVEFOVFMgPSB7XG4gICAgU1RBVEVfRVhQSVJBVElPTl9EQVlTOiAzMCxcbiAgICBDQU5WQVNfQVJFQV9IRUlHSFQ6IDYwMCxcbiAgICBMT0FESU5HX0lOVEVSVkFMX01TOiAxMDAsXG59O1xuZXhwb3J0IHZhciBFZGl0b3JFdmVudFR5cGU7XG4oZnVuY3Rpb24gKEVkaXRvckV2ZW50VHlwZSkge1xuICAgIEVkaXRvckV2ZW50VHlwZVtcIk1PQ0tVUF9MT0FESU5HXCJdID0gXCJtb2NrdXAtbG9hZGluZ1wiO1xuICAgIEVkaXRvckV2ZW50VHlwZVtcIk1PQ0tVUF9VUERBVEVEXCJdID0gXCJtb2NrdXAtdXBkYXRlZFwiO1xuICAgIEVkaXRvckV2ZW50VHlwZVtcIkxPQURJTkdfVElNRV9VUERBVEVEXCJdID0gXCJsb2FkaW5nLXRpbWUtdXBkYXRlZFwiO1xuICAgIEVkaXRvckV2ZW50VHlwZVtcIlNUQVRFX0NIQU5HRURcIl0gPSBcInN0YXRlLWNoYW5nZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJMQVlPVVRfQURERURcIl0gPSBcImxheW91dC1hZGRlZFwiO1xuICAgIEVkaXRvckV2ZW50VHlwZVtcIkxBWU9VVF9SRU1PVkVEXCJdID0gXCJsYXlvdXQtcmVtb3ZlZFwiO1xuICAgIEVkaXRvckV2ZW50VHlwZVtcIkxBWU9VVF9VUERBVEVEXCJdID0gXCJsYXlvdXQtdXBkYXRlZFwiO1xufSkoRWRpdG9yRXZlbnRUeXBlIHx8IChFZGl0b3JFdmVudFR5cGUgPSB7fSkpO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRWRpdG9yIHtcbiAgICBnZXQgc2VsZWN0VHlwZSgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdFR5cGU7IH1cbiAgICBnZXQgc2VsZWN0Q29sb3IoKSB7IHJldHVybiB0aGlzLl9zZWxlY3RDb2xvcjsgfVxuICAgIGdldCBzZWxlY3RTaWRlKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0U2lkZTsgfVxuICAgIGdldCBzZWxlY3RTaXplKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0U2l6ZTsgfVxuICAgIGdldCBzZWxlY3RMYXlvdXQoKSB7IHJldHVybiB0aGlzLl9zZWxlY3RMYXlvdXQ7IH1cbiAgICBjb25zdHJ1Y3Rvcih7IGJsb2NrcywgcHJvZHVjdENvbmZpZ3MsIGZvcm1Db25maWcsIGFwaUNvbmZpZyB9KSB7XG4gICAgICAgIHRoaXMucXVhbnRpdHlGb3JtQmxvY2sgPSBudWxsO1xuICAgICAgICB0aGlzLmZvcm1CbG9jayA9IG51bGw7XG4gICAgICAgIHRoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lID0gbnVsbDtcbiAgICAgICAgdGhpcy5mb3JtQnV0dG9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5fc2VsZWN0TGF5b3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5sYXlvdXRzID0gW107XG4gICAgICAgIHRoaXMuY2FudmFzZXMgPSBbXTtcbiAgICAgICAgdGhpcy5sYXllcnNDYW52YXNlcyA9IFtdO1xuICAgICAgICB0aGlzLmFjdGl2ZUNhbnZhcyA9IG51bGw7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IFR5cGVkRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMubGF5ZXJzSGlzdG9yeSA9IFtdO1xuICAgICAgICB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPSAtMTtcbiAgICAgICAgdGhpcy5pc1Jlc3RvcmluZ0Zyb21IaXN0b3J5ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pc0FkZGluZ1RvQ2FydCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzR2VuZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxvYWRpbmdUaW1lID0gMDtcbiAgICAgICAgdGhpcy5sb2FkaW5nSW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICB0aGlzLmNvbG9yQmxvY2tzID0gW107XG4gICAgICAgIHRoaXMuc2l6ZUJsb2NrcyA9IFtdO1xuICAgICAgICB0aGlzLnByb2R1Y3RCbG9ja3MgPSBbXTtcbiAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBudWxsO1xuICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbWFnZUNhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmxvYWRpbmdFbGVtZW50c0NhY2hlID0ge307XG4gICAgICAgIHRoaXMucHJvZHVjdENhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLm1vY2t1cENhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICBpZiAoIXByb2R1Y3RDb25maWdzIHx8IHByb2R1Y3RDb25maWdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbRWRpdG9yXSDQndC1INC/0YDQtdC00L7RgdGC0LDQstC70LXQvdGLINC60L7QvdGE0LjQs9GD0YDQsNGG0LjQuCDQv9GA0L7QtNGD0LrRgtC+0LInKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0b3JhZ2VNYW5hZ2VyID0gbmV3IEVkaXRvclN0b3JhZ2VNYW5hZ2VyKCk7XG4gICAgICAgIHRoaXMucHJvZHVjdENvbmZpZ3MgPSBwcm9kdWN0Q29uZmlncztcbiAgICAgICAgdGhpcy5hcGlDb25maWcgPSBhcGlDb25maWc7XG4gICAgICAgIHRoaXMuZWRpdG9yQmxvY2sgPSB0aGlzLmdldFJlcXVpcmVkRWxlbWVudChibG9ja3MuZWRpdG9yQmxvY2tDbGFzcyk7XG4gICAgICAgIHRoaXMuY2hhbmdlU2lkZUJ1dHRvbiA9IHRoaXMuZ2V0UmVxdWlyZWRFbGVtZW50KGJsb2Nrcy5jaGFuZ2VTaWRlQnV0dG9uQ2xhc3MpO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2sgPSB0aGlzLmdldFJlcXVpcmVkRWxlbWVudChibG9ja3MuZWRpdG9ySGlzdG9yeVVuZG9CbG9ja0NsYXNzKTtcbiAgICAgICAgdGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrID0gdGhpcy5nZXRSZXF1aXJlZEVsZW1lbnQoYmxvY2tzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2tDbGFzcyk7XG4gICAgICAgIHRoaXMucXVhbnRpdHlGb3JtQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JRdWFudGl0eUZvcm1CbG9ja0NsYXNzKTtcbiAgICAgICAgY29uc3QgcHJvZHVjdExpc3RCbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLnByb2R1Y3RMaXN0QmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChwcm9kdWN0TGlzdEJsb2NrKVxuICAgICAgICAgICAgdGhpcy5wcm9kdWN0TGlzdEJsb2NrID0gcHJvZHVjdExpc3RCbG9jaztcbiAgICAgICAgY29uc3QgcHJvZHVjdEl0ZW1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLnByb2R1Y3RJdGVtQ2xhc3MpO1xuICAgICAgICBpZiAocHJvZHVjdEl0ZW1CbG9jaylcbiAgICAgICAgICAgIHRoaXMucHJvZHVjdEl0ZW1CbG9jayA9IHByb2R1Y3RJdGVtQmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvckNvbG9yc0xpc3RCbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvckNvbG9yc0xpc3RCbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvckNvbG9yc0xpc3RCbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yQ29sb3JzTGlzdEJsb2NrID0gZWRpdG9yQ29sb3JzTGlzdEJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JDb2xvckl0ZW1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvckNvbG9ySXRlbUJsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yQ29sb3JJdGVtQmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvckNvbG9ySXRlbUJsb2NrID0gZWRpdG9yQ29sb3JJdGVtQmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvclNpemVzTGlzdEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yU2l6ZXNMaXN0QmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JTaXplc0xpc3RCbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yU2l6ZXNMaXN0QmxvY2sgPSBlZGl0b3JTaXplc0xpc3RCbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yU2l6ZUl0ZW1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclNpemVJdGVtQmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JTaXplSXRlbUJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JTaXplSXRlbUJsb2NrID0gZWRpdG9yU2l6ZUl0ZW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yTGF5b3V0c0xpc3RCbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvckxheW91dHNMaXN0QmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JMYXlvdXRzTGlzdEJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRzTGlzdEJsb2NrID0gZWRpdG9yTGF5b3V0c0xpc3RCbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yTGF5b3V0SXRlbUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yTGF5b3V0SXRlbUJsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yTGF5b3V0SXRlbUJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2sgPSBlZGl0b3JMYXlvdXRJdGVtQmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvclVwbG9hZEltYWdlQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b25DbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b24gPSBlZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbjtcbiAgICAgICAgY29uc3QgZWRpdG9yVXBsb2FkVmlld0Jsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yVXBsb2FkVmlld0Jsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yVXBsb2FkVmlld0Jsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2sgPSBlZGl0b3JVcGxvYWRWaWV3QmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbkNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uID0gZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uO1xuICAgICAgICBjb25zdCBlZGl0b3JMb2FkV2l0aEFpQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbkNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvckxvYWRXaXRoQWlCdXR0b24pXG4gICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24gPSBlZGl0b3JMb2FkV2l0aEFpQnV0dG9uO1xuICAgICAgICBjb25zdCBlZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbkNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24pXG4gICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24gPSBlZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uO1xuICAgICAgICBjb25zdCBlZGl0b3JBZGRPcmRlckJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvckFkZE9yZGVyQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yQWRkT3JkZXJCdXR0b24pXG4gICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uID0gZWRpdG9yQWRkT3JkZXJCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvclN1bUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yU3VtQmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JTdW1CbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yU3VtQmxvY2sgPSBlZGl0b3JTdW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yUHJvZHVjdE5hbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JQcm9kdWN0TmFtZUNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclByb2R1Y3ROYW1lKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JQcm9kdWN0TmFtZSA9IGVkaXRvclByb2R1Y3ROYW1lO1xuICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja1ZpZXdDbGFzcyA9IGJsb2Nrcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tWaWV3Q2xhc3M7XG4gICAgICAgIHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrTmFtZUNsYXNzID0gYmxvY2tzLmVkaXRvckxheW91dEl0ZW1CbG9ja05hbWVDbGFzcztcbiAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tSZW1vdmVDbGFzcyA9IGJsb2Nrcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tSZW1vdmVDbGFzcztcbiAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tFZGl0Q2xhc3MgPSBibG9ja3MuZWRpdG9yTGF5b3V0SXRlbUJsb2NrRWRpdENsYXNzO1xuICAgICAgICBpZiAoZm9ybUNvbmZpZykge1xuICAgICAgICAgICAgdGhpcy5mb3JtQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGZvcm1Db25maWcuZm9ybUJsb2NrQ2xhc3MpO1xuICAgICAgICAgICAgdGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWUgPSBmb3JtQ29uZmlnLmZvcm1JbnB1dFZhcmlhYmxlTmFtZTtcbiAgICAgICAgICAgIHRoaXMuZm9ybUJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZm9ybUNvbmZpZy5mb3JtQnV0dG9uQ2xhc3MpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlZmF1bHRQcm9kdWN0ID0gcHJvZHVjdENvbmZpZ3NbMF07XG4gICAgICAgIGlmICghZGVmYXVsdFByb2R1Y3QpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW0VkaXRvcl0g0J3QtSDQvdCw0LnQtNC10L0g0LTQtdGE0L7Qu9GC0L3Ri9C5INC/0YDQvtC00YPQutGCJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGVmYXVsdE1vY2t1cCA9IGRlZmF1bHRQcm9kdWN0Lm1vY2t1cHNbMF07XG4gICAgICAgIGlmICghZGVmYXVsdE1vY2t1cCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbRWRpdG9yXSDQndC1INC90LDQudC00LXQvSDQtNC10YTQvtC70YLQvdGL0LkgbW9ja3VwJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc2VsZWN0Q29sb3IgPSBkZWZhdWx0TW9ja3VwLmNvbG9yO1xuICAgICAgICB0aGlzLl9zZWxlY3RTaWRlID0gZGVmYXVsdE1vY2t1cC5zaWRlO1xuICAgICAgICB0aGlzLl9zZWxlY3RUeXBlID0gZGVmYXVsdFByb2R1Y3QudHlwZTtcbiAgICAgICAgdGhpcy5fc2VsZWN0U2l6ZSA9IGRlZmF1bHRQcm9kdWN0LnNpemVzPy5bMF0gfHwgJ00nO1xuICAgICAgICB0aGlzLmVkaXRvckJsb2NrLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgdGhpcy5jcmVhdGVCYWNrZ3JvdW5kQmxvY2soKTtcbiAgICAgICAgdGhpcy5tb2NrdXBCbG9jayA9IHRoaXMuY3JlYXRlTW9ja3VwQmxvY2soKTtcbiAgICAgICAgdGhpcy5jYW52YXNlc0NvbnRhaW5lciA9IHRoaXMuY3JlYXRlQ2FudmFzZXNDb250YWluZXIoKTtcbiAgICAgICAgdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2sgPSB0aGlzLmNyZWF0ZUVkaXRvckxvYWRpbmdCbG9jaygpO1xuICAgICAgICB0aGlzLmluaXRFdmVudHMoKTtcbiAgICAgICAgdGhpcy5pbml0S2V5Ym9hcmRTaG9ydGN1dHMoKTtcbiAgICAgICAgdGhpcy5pbml0TG9hZGluZ0V2ZW50cygpO1xuICAgICAgICB0aGlzLmluaXRVSUNvbXBvbmVudHMoKTtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplRWRpdG9yKCk7XG4gICAgICAgIHdpbmRvdy5nZXRMYXlvdXRzID0gKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0cy5tYXAobGF5b3V0ID0+ICh7IC4uLmxheW91dCwgdXJsOiB1bmRlZmluZWQgfSkpO1xuICAgICAgICB9O1xuICAgICAgICB3aW5kb3cubG9hZExheW91dHMgPSAobGF5b3V0cykgPT4ge1xuICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gbGF5b3V0cy5tYXAobGF5b3V0ID0+IExheW91dC5mcm9tSlNPTihsYXlvdXQpKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICB9O1xuICAgICAgICB3aW5kb3cuZXhwb3J0UHJpbnQgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBleHBvcnRlZEFydCA9IGF3YWl0IHRoaXMuZXhwb3J0QXJ0KGZhbHNlLCA0MDk2KTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qgc2lkZSBvZiBPYmplY3Qua2V5cyhleHBvcnRlZEFydCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkb3dubG9hZExpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkb3dubG9hZExpbmspO1xuICAgICAgICAgICAgICAgIGRvd25sb2FkTGluay5ocmVmID0gZXhwb3J0ZWRBcnRbc2lkZV07XG4gICAgICAgICAgICAgICAgZG93bmxvYWRMaW5rLnRhcmdldCA9ICdfc2VsZic7XG4gICAgICAgICAgICAgICAgZG93bmxvYWRMaW5rLmRvd25sb2FkID0gYCR7c2lkZX0ucG5nYDtcbiAgICAgICAgICAgICAgICBkb3dubG9hZExpbmsuY2xpY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBleHBvcnRlZEFydDtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaW5pdFVJQ29tcG9uZW50cygpIHtcbiAgICAgICAgaWYgKHRoaXMuY2hhbmdlU2lkZUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5jaGFuZ2VTaWRlQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlU2lkZUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gdGhpcy5jaGFuZ2VTaWRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jaykge1xuICAgICAgICAgICAgdGhpcy5pbml0SGlzdG9yeVVuZG9CbG9jaygpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEhpc3RvcnlSZWRvQmxvY2soKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wcm9kdWN0TGlzdEJsb2NrICYmIHRoaXMucHJvZHVjdEl0ZW1CbG9jaykge1xuICAgICAgICAgICAgdGhpcy5pbml0UHJvZHVjdExpc3QoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5pbml0QWRkT3JkZXJCdXR0b24oKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5pbml0VXBsb2FkSW1hZ2VCdXR0b24oKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5mb3JtQmxvY2sgJiYgdGhpcy5mb3JtQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRGb3JtKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucXVhbnRpdHlGb3JtQmxvY2spIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5pbml0Rml4UXVhbnRpdHlGb3JtKCksIDUwMCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jaykge1xuICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRDYW5jZWxCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRDYW5jZWxCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkIGltYWdlIGJ1dHRvbl0gY2FuY2VsIGJ1dHRvbiBjbGlja2VkJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldFVzZXJVcGxvYWRJbWFnZSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRSZXF1aXJlZEVsZW1lbnQoc2VsZWN0b3IpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgW0VkaXRvcl0g0J3QtSDQvdCw0LnQtNC10L0g0L7QsdGP0LfQsNGC0LXQu9GM0L3Ri9C5INGN0LvQtdC80LXQvdGCOiAke3NlbGVjdG9yfWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbiAgICBhc3luYyBpbml0aWFsaXplRWRpdG9yKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZFN0YXRlKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnByZWxvYWRBbGxNb2NrdXBzKCk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZWRpdG9yXSDQmNC90LjRhtC40LDQu9C40LfQsNGG0LjRjyDQt9Cw0LLQtdGA0YjQtdC90LAnKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tlZGl0b3JdINCe0YjQuNCx0LrQsCDQuNC90LjRhtC40LDQu9C40LfQsNGG0LjQuDonLCBlcnJvcik7XG4gICAgICAgICAgICB0aGlzLmluaXRpYWxpemVXaXRoRGVmYXVsdHMoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBpbml0aWFsaXplV2l0aERlZmF1bHRzKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZWRpdG9yXSDQmNC90LjRhtC40LDQu9C40LfQsNGG0LjRjyDRgSDQtNC10YTQvtC70YLQvdGL0LzQuCDQt9C90LDRh9C10L3QuNGP0LzQuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbZWRpdG9yXSDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCBtb2NrdXAg0L/QviDRg9C80L7Qu9GH0LDQvdC40Y46JywgZXJyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0RXZlbnRzKCkge1xuICAgICAgICB3aW5kb3cub25iZWZvcmV1bmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYWxlcnQoXCLQktGLINGD0LLQtdGA0LXQvdGLLCDRh9GC0L4g0YXQvtGC0LjRgtC1INC/0L7QutC40L3Rg9GC0Ywg0Y3RgtGDINGB0YLRgNCw0L3QuNGG0YM/XCIpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmV2ZW50cy5vbihFZGl0b3JFdmVudFR5cGUuTU9DS1VQX1VQREFURUQsIChkYXRhVVJMKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vY2t1cEJsb2NrLnNyYyA9IGRhdGFVUkw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpbml0TG9hZGluZ0V2ZW50cygpIHtcbiAgICAgICAgdGhpcy5sb2FkaW5nRWxlbWVudHNDYWNoZS5sb2FkaW5nVGV4dCA9IHRoaXMuZWRpdG9yTG9hZGluZ0Jsb2NrLnF1ZXJ5U2VsZWN0b3IoJyNsb2FkaW5nLXRleHQnKTtcbiAgICAgICAgdGhpcy5sb2FkaW5nRWxlbWVudHNDYWNoZS5zcGlubmVyID0gdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2sucXVlcnlTZWxlY3RvcignI3NwaW5uZXInKTtcbiAgICAgICAgdGhpcy5ldmVudHMub24oRWRpdG9yRXZlbnRUeXBlLkxPQURJTkdfVElNRV9VUERBVEVELCAobG9hZGluZ1RpbWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHsgbG9hZGluZ1RleHQsIHNwaW5uZXIgfSA9IHRoaXMubG9hZGluZ0VsZW1lbnRzQ2FjaGU7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0xvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb2FkaW5nVGltZSA+IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuaW5uZXJUZXh0ID0gYCR7KHRoaXMubG9hZGluZ1RpbWUgLyAxMCkudG9GaXhlZCgxKX1gO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzcGlubmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNzQ1KVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzcGlubmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRpbmdCbG9jay5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMClcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGluZ1RleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZXZlbnRzLm9uKEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgKGlzTG9hZGluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBsb2FkaW5nVGV4dCwgc3Bpbm5lciB9ID0gdGhpcy5sb2FkaW5nRWxlbWVudHNDYWNoZTtcbiAgICAgICAgICAgIGlmIChpc0xvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb2FkaW5nSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmxvYWRpbmdJbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZ1RpbWUgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbbW9ja3VwXSBsb2FkaW5nIG1vY2t1cCcpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZ0ludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmdUaW1lKys7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTE9BRElOR19USU1FX1VQREFURUQsIHRoaXMubG9hZGluZ1RpbWUpO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRpbmdCbG9jay5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMClcIjtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGluZ1RleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3Bpbm5lcikge1xuICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb2FkaW5nSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmxvYWRpbmdJbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZ0ludGVydmFsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nVGltZSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbWl0KHR5cGUsIGRldGFpbCkge1xuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KHR5cGUsIGRldGFpbCk7XG4gICAgfVxuICAgIGluaXRLZXlib2FyZFNob3J0Y3V0cygpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlRWxlbWVudCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCBpc0lucHV0RmllbGQgPSBhY3RpdmVFbGVtZW50ICYmIChhY3RpdmVFbGVtZW50LnRhZ05hbWUgPT09ICdJTlBVVCcgfHxcbiAgICAgICAgICAgICAgICBhY3RpdmVFbGVtZW50LnRhZ05hbWUgPT09ICdURVhUQVJFQScgfHxcbiAgICAgICAgICAgICAgICBhY3RpdmVFbGVtZW50LmNvbnRlbnRFZGl0YWJsZSA9PT0gJ3RydWUnIHx8XG4gICAgICAgICAgICAgICAgYWN0aXZlRWxlbWVudC5pc0NvbnRlbnRFZGl0YWJsZSk7XG4gICAgICAgICAgICBpZiAoaXNJbnB1dEZpZWxkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGlmIChldmVudC5jdHJsS2V5ICYmIGV2ZW50LmNvZGUgPT09ICdLZXlaJyAmJiAhZXZlbnQuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudW5kbygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgoZXZlbnQuY3RybEtleSAmJiBldmVudC5zaGlmdEtleSAmJiBldmVudC5jb2RlID09PSAnS2V5WicpIHx8XG4gICAgICAgICAgICAgICAgKGV2ZW50LmN0cmxLZXkgJiYgZXZlbnQuY29kZSA9PT0gJ0tleVknICYmICFldmVudC5zaGlmdEtleSkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVkbygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNyZWF0ZUJhY2tncm91bmRCbG9jaygpIHtcbiAgICAgICAgY29uc3QgYmFja2dyb3VuZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBiYWNrZ3JvdW5kLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1wb3NpdGlvbicpO1xuICAgICAgICBiYWNrZ3JvdW5kLmlkID0gJ2VkaXRvci1iYWNrZ3JvdW5kJztcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jay5hcHBlbmRDaGlsZChiYWNrZ3JvdW5kKTtcbiAgICAgICAgcmV0dXJuIGJhY2tncm91bmQ7XG4gICAgfVxuICAgIGNyZWF0ZU1vY2t1cEJsb2NrKCkge1xuICAgICAgICBjb25zdCBtb2NrdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgICAgICAgbW9ja3VwLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1wb3NpdGlvbicpO1xuICAgICAgICBtb2NrdXAuaWQgPSAnZWRpdG9yLW1vY2t1cCc7XG4gICAgICAgIHRoaXMuZWRpdG9yQmxvY2suYXBwZW5kQ2hpbGQobW9ja3VwKTtcbiAgICAgICAgcmV0dXJuIG1vY2t1cDtcbiAgICB9XG4gICAgY3JlYXRlQ2FudmFzZXNDb250YWluZXIoKSB7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBjYW52YXMuY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXBvc2l0aW9uJyk7XG4gICAgICAgIGNhbnZhcy5pZCA9ICdlZGl0b3ItY2FudmFzZXMtY29udGFpbmVyJztcbiAgICAgICAgY2FudmFzLnN0eWxlLnpJbmRleCA9ICcxMCc7XG4gICAgICAgIGNhbnZhcy5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICB0aGlzLmVkaXRvckJsb2NrLmFwcGVuZENoaWxkKGNhbnZhcyk7XG4gICAgICAgIHJldHVybiBjYW52YXM7XG4gICAgfVxuICAgIGNyZWF0ZUVkaXRvckxvYWRpbmdCbG9jaygpIHtcbiAgICAgICAgY29uc3QgZWRpdG9yTG9hZGluZ0Jsb2NrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5zdHlsZS5kaXNwbGF5ID0gXCJmbGV4XCI7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItcG9zaXRpb24nKTtcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLmlkID0gJ2VkaXRvci1sb2FkaW5nJztcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLnN0eWxlLnpJbmRleCA9IFwiMTAwMFwiO1xuICAgICAgICBlZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUucG9pbnRlckV2ZW50cyA9IFwibm9uZVwiO1xuICAgICAgICBjb25zdCBsb2FkaW5nVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBsb2FkaW5nVGV4dC5pZCA9ICdsb2FkaW5nLXRleHQnO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLnRleHRBbGlnbiA9IFwiY2VudGVyXCI7XG4gICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS50b3AgPSBcIjUwJVwiO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5sZWZ0ID0gXCI1MCVcIjtcbiAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoLTUwJSwgLTUwJSlcIjtcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLmFwcGVuZENoaWxkKGxvYWRpbmdUZXh0KTtcbiAgICAgICAgY29uc3Qgc3Bpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBzcGlubmVyLmlkID0gJ3NwaW5uZXInO1xuICAgICAgICBzcGlubmVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLmFwcGVuZENoaWxkKHNwaW5uZXIpO1xuICAgICAgICB0aGlzLmVkaXRvckJsb2NrLmFwcGVuZENoaWxkKGVkaXRvckxvYWRpbmdCbG9jayk7XG4gICAgICAgIHJldHVybiBlZGl0b3JMb2FkaW5nQmxvY2s7XG4gICAgfVxuICAgIGFzeW5jIHVwZGF0ZU1vY2t1cCgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW21vY2t1cF0gdXBkYXRlIGZvciAke3RoaXMuX3NlbGVjdFR5cGV9ICR7dGhpcy5fc2VsZWN0U2lkZX0gJHt0aGlzLl9zZWxlY3RDb2xvci5uYW1lfWApO1xuICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCB0cnVlKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG1vY2t1cEltYWdlVXJsID0gdGhpcy5maW5kTW9ja3VwVXJsKCk7XG4gICAgICAgICAgICBpZiAoIW1vY2t1cEltYWdlVXJsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbbW9ja3VwXSDQndC1INC90LDQudC00LXQvSBtb2NrdXAg0LTQu9GPINGC0LXQutGD0YnQuNGFINC/0LDRgNCw0LzQtdGC0YDQvtCyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkYXRhVVJMID0gYXdhaXQgdGhpcy5sb2FkQW5kQ29udmVydEltYWdlKG1vY2t1cEltYWdlVXJsKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX1VQREFURUQsIGRhdGFVUkwpO1xuICAgICAgICAgICAgdGhpcy5tb2NrdXBCbG9jay5zcmMgPSBkYXRhVVJMO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW21vY2t1cF0gTW9ja3VwINGD0YHQv9C10YjQvdC+INC+0LHQvdC+0LLQu9C10L0nKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1ttb2NrdXBdINCe0YjQuNCx0LrQsCDQvtCx0L3QvtCy0LvQtdC90LjRjyBtb2NrdXA6JywgZXJyb3IpO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZmluZE1vY2t1cFVybCgpIHtcbiAgICAgICAgY29uc3QgY2FjaGVLZXkgPSBgJHt0aGlzLl9zZWxlY3RUeXBlfS0ke3RoaXMuX3NlbGVjdFNpZGV9LSR7dGhpcy5fc2VsZWN0Q29sb3IubmFtZX1gO1xuICAgICAgICBpZiAodGhpcy5tb2NrdXBDYWNoZS5oYXMoY2FjaGVLZXkpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tb2NrdXBDYWNoZS5nZXQoY2FjaGVLZXkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdCkge1xuICAgICAgICAgICAgdGhpcy5tb2NrdXBDYWNoZS5zZXQoY2FjaGVLZXksIG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbW9ja3VwID0gcHJvZHVjdC5tb2NrdXBzLmZpbmQobSA9PiBtLnNpZGUgPT09IHRoaXMuX3NlbGVjdFNpZGUgJiYgbS5jb2xvci5uYW1lID09PSB0aGlzLl9zZWxlY3RDb2xvci5uYW1lKTtcbiAgICAgICAgY29uc3QgdXJsID0gbW9ja3VwPy51cmwgfHwgbnVsbDtcbiAgICAgICAgdGhpcy5tb2NrdXBDYWNoZS5zZXQoY2FjaGVLZXksIHVybCk7XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxuICAgIGdldFByb2R1Y3RCeVR5cGUodHlwZSkge1xuICAgICAgICBpZiAoIXRoaXMucHJvZHVjdENhY2hlLmhhcyh0eXBlKSkge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMucHJvZHVjdENvbmZpZ3MuZmluZChwID0+IHAudHlwZSA9PT0gdHlwZSk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdCkge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvZHVjdENhY2hlLnNldCh0eXBlLCBwcm9kdWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5wcm9kdWN0Q2FjaGUuZ2V0KHR5cGUpO1xuICAgIH1cbiAgICBjbGVhck1vY2t1cENhY2hlKCkge1xuICAgICAgICB0aGlzLm1vY2t1cENhY2hlLmNsZWFyKCk7XG4gICAgfVxuICAgIGFzeW5jIGxvYWRBbmRDb252ZXJ0SW1hZ2UoaW1hZ2VVcmwpIHtcbiAgICAgICAgaWYgKHRoaXMuaW1hZ2VDYWNoZS5oYXMoaW1hZ2VVcmwpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbY2FjaGVdINCY0LfQvtCx0YDQsNC20LXQvdC40LUg0LfQsNCz0YDRg9C20LXQvdC+INC40Lcg0LrRjdGI0LA6JywgaW1hZ2VVcmwpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW1hZ2VDYWNoZS5nZXQoaW1hZ2VVcmwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgaW1hZ2Uuc2V0QXR0cmlidXRlKCdjcm9zc09yaWdpbicsICdhbm9ueW1vdXMnKTtcbiAgICAgICAgICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gaW1hZ2Uud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWN0eCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcign0J3QtSDRg9C00LDQu9C+0YHRjCDQv9C+0LvRg9GH0LjRgtGMINC60L7QvdGC0LXQutGB0YIgY2FudmFzJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoaW1hZ2UsIDAsIDApO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhVVJMID0gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VDYWNoZS5zZXQoaW1hZ2VVcmwsIGRhdGFVUkwpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbY2FjaGVdINCY0LfQvtCx0YDQsNC20LXQvdC40LUg0YHQvtGF0YDQsNC90LXQvdC+INCyINC60Y3RiDonLCBpbWFnZVVybCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YVVSTCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbWFnZS5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYNCe0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4INC40LfQvtCx0YDQsNC20LXQvdC40Y86ICR7aW1hZ2VVcmx9YCkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGltYWdlLnNyYyA9IGltYWdlVXJsO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgc2F2ZVN0YXRlKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbc3RhdGVdINCh0L7RhdGA0LDQvdC10L3QuNC1INGB0L7RgdGC0L7Rj9C90LjRjyDRgNC10LTQsNC60YLQvtGA0LAnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvclN0YXRlID0ge1xuICAgICAgICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICB0eXBlOiB0aGlzLl9zZWxlY3RUeXBlLFxuICAgICAgICAgICAgICAgIGNvbG9yOiB0aGlzLl9zZWxlY3RDb2xvci5uYW1lLFxuICAgICAgICAgICAgICAgIHNpZGU6IHRoaXMuX3NlbGVjdFNpZGUsXG4gICAgICAgICAgICAgICAgc2l6ZTogdGhpcy5fc2VsZWN0U2l6ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtzdGF0ZV0g0KHQvtGF0YDQsNC90Y/QtdC8OiB0eXBlPSR7ZWRpdG9yU3RhdGUudHlwZX0sIGNvbG9yPSR7ZWRpdG9yU3RhdGUuY29sb3J9LCBzaWRlPSR7ZWRpdG9yU3RhdGUuc2lkZX0sIHNpemU9JHtlZGl0b3JTdGF0ZS5zaXplfWApO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci5zYXZlRWRpdG9yU3RhdGUoZWRpdG9yU3RhdGUpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3N0YXRlXSDQodC+0YHRgtC+0Y/QvdC40LUg0YPRgdC/0LXRiNC90L4g0YHQvtGF0YDQsNC90LXQvdC+Jyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbc3RhdGVdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC+0YHRgtC+0Y/QvdC40Y86JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIHNhdmVMYXlvdXRzKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbbGF5ZXJzXSDQodC+0YXRgNCw0L3QtdC90LjQtSDRgdC70L7RkdCyJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLnNhdmVMYXllcnModGhpcy5sYXlvdXRzKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tsYXllcnNdINCh0LvQvtC4INGD0YHQv9C10YjQvdC+INGB0L7RhdGA0LDQvdC10L3RiycpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2xheWVyc10g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPINGB0LvQvtGR0LI6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGxvYWRMYXlvdXRzKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbbGF5ZXJzXSDQl9Cw0LPRgNGD0LfQutCwINGB0LvQvtGR0LInKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNhdmVkTGF5b3V0cyA9IGF3YWl0IHRoaXMuc3RvcmFnZU1hbmFnZXIubG9hZExheWVycygpO1xuICAgICAgICAgICAgaWYgKHNhdmVkTGF5b3V0cyAmJiBBcnJheS5pc0FycmF5KHNhdmVkTGF5b3V0cykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxheW91dHMgPSBzYXZlZExheW91dHMubWFwKChsYXlvdXREYXRhKSA9PiBuZXcgTGF5b3V0KGxheW91dERhdGEpKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbbGF5ZXJzXSDQl9Cw0LPRgNGD0LbQtdC90L4gJHt0aGlzLmxheW91dHMubGVuZ3RofSDRgdC70L7RkdCyYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxheW91dHMgPSBbXTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbbGF5ZXJzXSDQndC10YIg0YHQvtGF0YDQsNC90ZHQvdC90YvRhSDRgdC70L7RkdCyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNhdmVMYXllcnNUb0hpc3RvcnkoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4INGB0LvQvtGR0LI6JywgZXJyb3IpO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gW107XG4gICAgICAgICAgICB0aGlzLnNhdmVMYXllcnNUb0hpc3RvcnkoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBsb2FkU3RhdGUoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tzdGF0ZV0g0JfQsNCz0YDRg9C30LrQsCDRgdC+0YHRgtC+0Y/QvdC40Y8g0YDQtdC00LDQutGC0L7RgNCwJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3JTdGF0ZSA9IGF3YWl0IHRoaXMuc3RvcmFnZU1hbmFnZXIubG9hZEVkaXRvclN0YXRlKCk7XG4gICAgICAgICAgICBpZiAoIWVkaXRvclN0YXRlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3N0YXRlXSDQodC+0YXRgNCw0L3QtdC90L3QvtC1INGB0L7RgdGC0L7Rj9C90LjQtSDQvdC1INC90LDQudC00LXQvdC+Jyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRQcm9kdWN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0Q29sb3JzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdFNpemVzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmlzU3RhdGVFeHBpcmVkKGVkaXRvclN0YXRlLmRhdGUpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbc3RhdGVdINCh0L7RgdGC0L7Rj9C90LjQtSDRg9GB0YLQsNGA0LXQu9C+LCDQvtGH0LjRidCw0LXQvCcpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RvcmFnZU1hbmFnZXIuY2xlYXJFZGl0b3JTdGF0ZSgpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkUHJvZHVjdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdENvbG9yc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRTaXplc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBhcHBsaWVkID0gYXdhaXQgdGhpcy5hcHBseVN0YXRlKGVkaXRvclN0YXRlKTtcbiAgICAgICAgICAgIGlmIChhcHBsaWVkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3N0YXRlXSDQodC+0YHRgtC+0Y/QvdC40LUg0YPRgdC/0LXRiNC90L4g0LfQsNCz0YDRg9C20LXQvdC+Jyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRQcm9kdWN0KCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvZHVjdEJsb2Nrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvZHVjdEJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrLnN0eWxlLmJhY2tncm91bmQgPSAncmdiKDIyMiAyMjIgMjIyKSc7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3RpdmVCbG9jayA9IHRoaXMucHJvZHVjdEJsb2Nrcy5maW5kKGJsb2NrID0+IGJsb2NrLmNsYXNzTGlzdC5jb250YWlucygnZWRpdG9yLXNldHRpbmdzX19wcm9kdWN0LWJsb2NrX18nICsgdGhpcy5fc2VsZWN0VHlwZSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZlQmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZUJsb2NrLnN0eWxlLmJhY2tncm91bmQgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWRMYXlvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0Q29sb3JzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdFNpemVzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbc3RhdGVdINCd0LUg0YPQtNCw0LvQvtGB0Ywg0L/RgNC40LzQtdC90LjRgtGMINGB0L7RhdGA0LDQvdC10L3QvdC+0LUg0YHQvtGB0YLQvtGP0L3QuNC1Jyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRQcm9kdWN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0Q29sb3JzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdFNpemVzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCDRgdC+0YHRgtC+0Y/QvdC40Y86JywgZXJyb3IpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdENvbG9yc0xpc3QoKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdFNpemVzTGlzdCgpO1xuICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlzU3RhdGVFeHBpcmVkKGRhdGVTdHJpbmcpIHtcbiAgICAgICAgY29uc3Qgc3RhdGVEYXRlID0gbmV3IERhdGUoZGF0ZVN0cmluZyk7XG4gICAgICAgIGNvbnN0IGV4cGlyYXRpb25EYXRlID0gRGF0ZS5ub3coKSAtIChDT05TVEFOVFMuU1RBVEVfRVhQSVJBVElPTl9EQVlTICogMjQgKiA2MCAqIDYwICogMTAwMCk7XG4gICAgICAgIHJldHVybiBzdGF0ZURhdGUuZ2V0VGltZSgpIDwgZXhwaXJhdGlvbkRhdGU7XG4gICAgfVxuICAgIGFzeW5jIGFwcGx5U3RhdGUoZWRpdG9yU3RhdGUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICghZWRpdG9yU3RhdGUudHlwZSB8fCAhZWRpdG9yU3RhdGUuY29sb3IgfHwgIWVkaXRvclN0YXRlLnNpZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tzdGF0ZV0g0J3QtdC60L7RgNGA0LXQutGC0L3QvtC1INGB0L7RgdGC0L7Rj9C90LjQtTog0L7RgtGB0YPRgtGB0YLQstGD0Y7RgiDQvtCx0Y/Qt9Cw0YLQtdC70YzQvdGL0LUg0L/QvtC70Y8nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbc3RhdGVdINCS0L7RgdGB0YLQsNC90L7QstC70LXQvdC40LUg0YHQvtGB0YLQvtGP0L3QuNGPOiB0eXBlPSR7ZWRpdG9yU3RhdGUudHlwZX0sIGNvbG9yPSR7ZWRpdG9yU3RhdGUuY29sb3J9LCBzaWRlPSR7ZWRpdG9yU3RhdGUuc2lkZX0sIHNpemU9JHtlZGl0b3JTdGF0ZS5zaXplfWApO1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMucHJvZHVjdENvbmZpZ3MuZmluZChwID0+IHAudHlwZSA9PT0gZWRpdG9yU3RhdGUudHlwZSk7XG4gICAgICAgICAgICBpZiAoIXByb2R1Y3QpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtzdGF0ZV0g0J/RgNC+0LTRg9C60YIg0YLQuNC/0LAgJHtlZGl0b3JTdGF0ZS50eXBlfSDQvdC1INC90LDQudC00LXQvWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG1vY2t1cCA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG0gPT4gbS5jb2xvci5uYW1lID09PSBlZGl0b3JTdGF0ZS5jb2xvcik7XG4gICAgICAgICAgICBpZiAoIW1vY2t1cCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW3N0YXRlXSBNb2NrdXAg0YEg0YbQstC10YLQvtC8ICR7ZWRpdG9yU3RhdGUuY29sb3J9INC90LUg0L3QsNC50LTQtdC9INC00LvRjyDQv9GA0L7QtNGD0LrRgtCwICR7ZWRpdG9yU3RhdGUudHlwZX1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RUeXBlID0gZWRpdG9yU3RhdGUudHlwZTtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gbW9ja3VwLmNvbG9yO1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0U2lkZSA9IGVkaXRvclN0YXRlLnNpZGU7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RTaXplID0gZWRpdG9yU3RhdGUuc2l6ZSB8fCB0aGlzLl9zZWxlY3RTaXplO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3N0YXRlXSDQodC+0YHRgtC+0Y/QvdC40LUg0L/RgNC40LzQtdC90LXQvdC+OiB0eXBlPSR7dGhpcy5fc2VsZWN0VHlwZX0sIGNvbG9yPSR7dGhpcy5fc2VsZWN0Q29sb3IubmFtZX0sIHNpZGU9JHt0aGlzLl9zZWxlY3RTaWRlfSwgc2l6ZT0ke3RoaXMuX3NlbGVjdFNpemV9YCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINC/0YDQuNC80LXQvdC10L3QuNGPINGB0L7RgdGC0L7Rj9C90LjRjzonLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0VHlwZSh0eXBlKSB7XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RUeXBlICE9PSB0eXBlKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RUeXBlID0gdHlwZTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJNb2NrdXBDYWNoZSgpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5TVEFURV9DSEFOR0VELCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y86JywgZXJyKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0Q29sb3IoY29sb3IpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdENvbG9yICE9PSBjb2xvcikge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0Q29sb3IgPSBjb2xvcjtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJNb2NrdXBDYWNoZSgpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5TVEFURV9DSEFOR0VELCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y86JywgZXJyKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0U2lkZShzaWRlKSB7XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RTaWRlICE9PSBzaWRlKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RTaWRlID0gc2lkZTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJNb2NrdXBDYWNoZSgpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5TVEFURV9DSEFOR0VELCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y86JywgZXJyKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0U2l6ZShzaXplKSB7XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RTaXplICE9PSBzaXplKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RTaXplID0gc2l6ZTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuU1RBVEVfQ0hBTkdFRCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPOicsIGVycikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFkZExheW91dChsYXlvdXQpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSkge1xuICAgICAgICAgICAgdGhpcy5sYXlvdXRzLnB1c2gobGF5b3V0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0cy5wdXNoKGxheW91dCk7XG4gICAgICAgICAgICB0aGlzLnNhdmVMYXllcnNUb0hpc3RvcnkoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLkxBWU9VVF9BRERFRCwgbGF5b3V0KTtcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgdGhpcy5zYXZlTGF5b3V0cygpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbbGF5ZXJzXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y8g0YHQu9C+0ZHQsjonLCBlcnIpKTtcbiAgICB9XG4gICAgcmVtb3ZlTGF5b3V0KGxheW91dElkKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5sYXlvdXRzLmZpbmRJbmRleChsID0+IGwuaWQgPT09IGxheW91dElkKTtcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0ID0gdGhpcy5sYXlvdXRzW2luZGV4XTtcbiAgICAgICAgICAgIGlmIChsYXlvdXQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxheW91dHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNhdmVMYXllcnNUb0hpc3RvcnkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5MQVlPVVRfUkVNT1ZFRCwgbGF5b3V0SWQpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZUxheW91dHMoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW2xheWVyc10g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPINGB0LvQvtGR0LI6JywgZXJyKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB1cGRhdGVMYXlvdXQobGF5b3V0SWQsIHVwZGF0ZXMpIHtcbiAgICAgICAgY29uc3QgbGF5b3V0ID0gdGhpcy5sYXlvdXRzLmZpbmQobCA9PiBsLmlkID09PSBsYXlvdXRJZCk7XG4gICAgICAgIGlmIChsYXlvdXQpIHtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24obGF5b3V0LCB1cGRhdGVzKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc1Jlc3RvcmluZ0Zyb21IaXN0b3J5KSB7XG4gICAgICAgICAgICAgICAgaWYgKCd1cmwnIGluIHVwZGF0ZXMgfHwgJ25hbWUnIGluIHVwZGF0ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5MQVlPVVRfVVBEQVRFRCwgbGF5b3V0KTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZUxheW91dHMoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW2xheWVyc10g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPINGB0LvQvtGR0LI6JywgZXJyKSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGdldExheW91dChsYXlvdXRJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXRzLmZpbmQobCA9PiBsLmlkID09PSBsYXlvdXRJZCk7XG4gICAgfVxuICAgIGdldExheW91dHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxheW91dHM7XG4gICAgfVxuICAgIGluaXRIaXN0b3J5VW5kb0Jsb2NrKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbaGlzdG9yeSBibG9ja10gaW5pdCB1bmRvJyk7XG4gICAgICAgIHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jay5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgIHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jay5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnkgdW5kbyBibG9ja10gY2xpY2tlZCcpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51bmRvKCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudXBkYXRlSGlzdG9yeUJ1dHRvbnNTdGF0ZSgpO1xuICAgIH1cbiAgICBpbml0SGlzdG9yeVJlZG9CbG9jaygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnkgcmVkbyBibG9ja10gaW5pdCByZWRvJyk7XG4gICAgICAgIHRoaXMuZWRpdG9ySGlzdG9yeVJlZG9CbG9jay5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgIHRoaXMuZWRpdG9ySGlzdG9yeVJlZG9CbG9jay5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnkgcmVkbyBibG9ja10gY2xpY2tlZCcpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5yZWRvKCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudXBkYXRlSGlzdG9yeUJ1dHRvbnNTdGF0ZSgpO1xuICAgIH1cbiAgICBpbml0UHJvZHVjdExpc3QoKSB7XG4gICAgICAgIGlmICghdGhpcy5wcm9kdWN0TGlzdEJsb2NrIHx8ICF0aGlzLnByb2R1Y3RJdGVtQmxvY2spXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tQcm9kdWN0TGlzdF0gaW5pdCBwcm9kdWN0IGxpc3QnKTtcbiAgICAgICAgdGhpcy5wcm9kdWN0SXRlbUJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMucHJvZHVjdENvbmZpZ3MuZm9yRWFjaChwcm9kdWN0ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RJdGVtID0gdGhpcy5wcm9kdWN0SXRlbUJsb2NrLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIHByb2R1Y3RJdGVtLnN0eWxlLmRpc3BsYXkgPSAndGFibGUnO1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdEltYWdlV3JhcHBlciA9IHByb2R1Y3RJdGVtLnF1ZXJ5U2VsZWN0b3IoJy5wcm9kdWN0LWl0ZW0taW1hZ2UnKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0SW1hZ2VXcmFwcGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdEltYWdlID0gZ2V0TGFzdENoaWxkKHByb2R1Y3RJbWFnZVdyYXBwZXIpO1xuICAgICAgICAgICAgICAgIGlmIChwcm9kdWN0SW1hZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvZHVjdEltYWdlLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IGB1cmwoJHtwcm9kdWN0Lm1vY2t1cHNbMF0/LnVybH0pYDtcbiAgICAgICAgICAgICAgICAgICAgcHJvZHVjdEltYWdlLnN0eWxlLmJhY2tncm91bmRTaXplID0gJ2NvdmVyJztcbiAgICAgICAgICAgICAgICAgICAgcHJvZHVjdEltYWdlLnN0eWxlLmJhY2tncm91bmRQb3NpdGlvbiA9ICdjZW50ZXInO1xuICAgICAgICAgICAgICAgICAgICBwcm9kdWN0SW1hZ2Uuc3R5bGUuYmFja2dyb3VuZFJlcGVhdCA9ICduby1yZXBlYXQnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RUZXh0V3JhcHBlciA9IHByb2R1Y3RJdGVtLnF1ZXJ5U2VsZWN0b3IoJy5wcm9kdWN0LWl0ZW0tdGV4dCcpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3RUZXh0V3JhcHBlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RUZXh0ID0gZ2V0TGFzdENoaWxkKHByb2R1Y3RUZXh0V3JhcHBlcik7XG4gICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RUZXh0LmlubmVyVGV4dCA9IHByb2R1Y3QucHJvZHVjdE5hbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcHJvZHVjdEJsb2NrID0gcHJvZHVjdEl0ZW0uZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBwcm9kdWN0QmxvY2suY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXNldHRpbmdzX19wcm9kdWN0LWJsb2NrX18nICsgcHJvZHVjdC50eXBlKTtcbiAgICAgICAgICAgIHByb2R1Y3RCbG9jay5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICBwcm9kdWN0QmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICAgICAgICAgICAgcHJvZHVjdEl0ZW0ub25jbGljayA9ICgpID0+IHRoaXMuY2hhbmdlUHJvZHVjdChwcm9kdWN0LnR5cGUpO1xuICAgICAgICAgICAgdGhpcy5wcm9kdWN0QmxvY2tzLnB1c2gocHJvZHVjdEJsb2NrKTtcbiAgICAgICAgICAgIHRoaXMucHJvZHVjdExpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5hcHBlbmRDaGlsZChwcm9kdWN0SXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5wcm9kdWN0QmxvY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMucHJvZHVjdEJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgICAgICBibG9jay5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYigyMjIgMjIyIDIyMiknO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBhY3RpdmVCbG9jayA9IHRoaXMucHJvZHVjdEJsb2Nrcy5maW5kKGJsb2NrID0+IGJsb2NrLmNsYXNzTGlzdC5jb250YWlucygnZWRpdG9yLXNldHRpbmdzX19wcm9kdWN0LWJsb2NrX18nICsgdGhpcy5fc2VsZWN0VHlwZSkpO1xuICAgICAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgYWN0aXZlQmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGluaXRDb2xvcnNMaXN0KCkge1xuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yQ29sb3JzTGlzdEJsb2NrIHx8ICF0aGlzLmVkaXRvckNvbG9ySXRlbUJsb2NrKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIGluaXQgY29sb3JzIGZvciAke3RoaXMuX3NlbGVjdFR5cGV9YCk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5lZGl0b3JDb2xvckl0ZW1CbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBjb25zdCBjb2xvcnNDb250YWluZXIgPSB0aGlzLmVkaXRvckNvbG9yc0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgY29sb3JzQ29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuICAgICAgICB0aGlzLmNvbG9yQmxvY2tzID0gW107XG4gICAgICAgIGNvbnN0IGNvbG9ycyA9IHByb2R1Y3QubW9ja3Vwc1xuICAgICAgICAgICAgLmZpbHRlcihtb2NrdXAgPT4gbW9ja3VwLnNpZGUgPT09IHRoaXMuX3NlbGVjdFNpZGUpXG4gICAgICAgICAgICAubWFwKG1vY2t1cCA9PiBtb2NrdXAuY29sb3IpO1xuICAgICAgICBjb2xvcnMuZm9yRWFjaChjb2xvciA9PiB7XG4gICAgICAgICAgICBjb25zdCBjb2xvckl0ZW0gPSB0aGlzLmVkaXRvckNvbG9ySXRlbUJsb2NrLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIGNvbG9ySXRlbS5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIGNvbnN0IGNvbG9yQmxvY2sgPSBjb2xvckl0ZW0uZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBjb2xvckJsb2NrLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1zZXR0aW5nc19fY29sb3ItYmxvY2tfXycgKyBjb2xvci5uYW1lKTtcbiAgICAgICAgICAgIGNvbG9yQmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgY29sb3JCbG9jay5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvci5oZXg7XG4gICAgICAgICAgICBjb2xvckJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgICAgICAgICAgIGNvbG9ySXRlbS5vbmNsaWNrID0gKCkgPT4gdGhpcy5jaGFuZ2VDb2xvcihjb2xvci5uYW1lKTtcbiAgICAgICAgICAgIHRoaXMuY29sb3JCbG9ja3MucHVzaChjb2xvckJsb2NrKTtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yQ29sb3JzTGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkLmFwcGVuZENoaWxkKGNvbG9ySXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5jb2xvckJsb2Nrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmNvbG9yQmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgICAgIGJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBhY3RpdmVCbG9jayA9IHRoaXMuY29sb3JCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fY29sb3ItYmxvY2tfXycgKyB0aGlzLl9zZWxlY3RDb2xvci5uYW1lKSk7XG4gICAgICAgICAgICBpZiAoYWN0aXZlQmxvY2spIHtcbiAgICAgICAgICAgICAgICBhY3RpdmVCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGluaXRTaXplc0xpc3QoKSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JTaXplc0xpc3RCbG9jayB8fCAhdGhpcy5lZGl0b3JTaXplSXRlbUJsb2NrKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIGluaXQgc2l6ZXMgZm9yICR7dGhpcy5fc2VsZWN0VHlwZX1gKTtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0IHx8ICFwcm9kdWN0LnNpemVzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmVkaXRvclNpemVJdGVtQmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgY29uc3Qgc2l6ZXNDb250YWluZXIgPSB0aGlzLmVkaXRvclNpemVzTGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICBzaXplc0NvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgdGhpcy5zaXplQmxvY2tzID0gW107XG4gICAgICAgIHByb2R1Y3Quc2l6ZXMuZm9yRWFjaChzaXplID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNpemVJdGVtID0gdGhpcy5lZGl0b3JTaXplSXRlbUJsb2NrLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIHNpemVJdGVtLnN0eWxlLmRpc3BsYXkgPSAndGFibGUnO1xuICAgICAgICAgICAgc2l6ZUl0ZW0uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgc2l6ZUl0ZW0uc3R5bGUudXNlclNlbGVjdCA9ICdub25lJztcbiAgICAgICAgICAgIHNpemVJdGVtLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1zZXR0aW5nc19fc2l6ZS1ibG9ja19fJyArIHNpemUpO1xuICAgICAgICAgICAgY29uc3QgYm9yZGVyQmxvY2sgPSBzaXplSXRlbS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGJvcmRlckJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICAgICAgY29uc3Qgc2l6ZVRleHQgPSBnZXRMYXN0Q2hpbGQoc2l6ZUl0ZW0pO1xuICAgICAgICAgICAgaWYgKHNpemVUZXh0KSB7XG4gICAgICAgICAgICAgICAgc2l6ZVRleHQuaW5uZXJUZXh0ID0gc2l6ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNpemVJdGVtLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNoYW5nZVNpemUoc2l6ZSk7XG4gICAgICAgICAgICB0aGlzLnNpemVCbG9ja3MucHVzaChzaXplSXRlbSk7XG4gICAgICAgICAgICB0aGlzLmVkaXRvclNpemVzTGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkLmFwcGVuZENoaWxkKHNpemVJdGVtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLnNpemVCbG9ja3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5zaXplQmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJvcmRlckJsb2NrID0gYmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICAgICAgaWYgKGJvcmRlckJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgIGJvcmRlckJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLnNpemVCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fc2l6ZS1ibG9ja19fJyArIHRoaXMuX3NlbGVjdFNpemUpKTtcbiAgICAgICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJvcmRlckJsb2NrID0gYWN0aXZlQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICAgICAgaWYgKGJvcmRlckJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgIGJvcmRlckJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHNob3dMYXlvdXRMaXN0KCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbc2V0dGluZ3NdIFtsYXlvdXRzXSBzaG93IGxheW91dHMgbGlzdCcpO1xuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW3NldHRpbmdzXSBbbGF5b3V0c10gZWRpdG9yTGF5b3V0SXRlbUJsb2NrIGlzIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jaykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIltzZXR0aW5nc10gW2xheW91dHNdIGVkaXRvckxheW91dHNMaXN0QmxvY2sgaXMgbm90IGluaXRpYWxpemVkXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBbbGF5b3V0c10gbGF5b3V0cyBsaXN0IGJsb2NrIGNoaWxkcmVuOiAke3RoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5jaGlsZHJlbi5sZW5ndGh9YCk7XG4gICAgICAgIHRoaXMubGF5b3V0cy5mb3JFYWNoKGxheW91dCA9PiB7XG4gICAgICAgICAgICBjb25zdCBsYXlvdXRJdGVtID0gdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2suY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgbGF5b3V0SXRlbS5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIGNvbnN0IGlzRWRpdGluZyA9IHRoaXMuX3NlbGVjdExheW91dCA9PT0gbGF5b3V0LmlkO1xuICAgICAgICAgICAgY29uc3QgcHJldmlld0Jsb2NrID0gdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tWaWV3Q2xhc3NcbiAgICAgICAgICAgICAgICA/IGxheW91dEl0ZW0ucXVlcnlTZWxlY3Rvcih0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja1ZpZXdDbGFzcylcbiAgICAgICAgICAgICAgICA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCBuYW1lQmxvY2sgPSB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja05hbWVDbGFzc1xuICAgICAgICAgICAgICAgID8gbGF5b3V0SXRlbS5xdWVyeVNlbGVjdG9yKHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrTmFtZUNsYXNzKVxuICAgICAgICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IHJlbW92ZUJsb2NrID0gdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tSZW1vdmVDbGFzc1xuICAgICAgICAgICAgICAgID8gbGF5b3V0SXRlbS5xdWVyeVNlbGVjdG9yKHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrUmVtb3ZlQ2xhc3MpXG4gICAgICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgZWRpdEJsb2NrID0gdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tFZGl0Q2xhc3NcbiAgICAgICAgICAgICAgICA/IGxheW91dEl0ZW0ucXVlcnlTZWxlY3Rvcih0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja0VkaXRDbGFzcylcbiAgICAgICAgICAgICAgICA6IG51bGw7XG4gICAgICAgICAgICBpZiAocHJldmlld0Jsb2NrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxheW91dC5pc0ltYWdlTGF5b3V0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJldmlld0VsZW1lbnQgPSBwcmV2aWV3QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmV2aWV3RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlld0VsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gYHVybCgke2xheW91dC51cmx9KWA7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3RWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9ICdjb250YWluJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJhY2tncm91bmRQb3NpdGlvbiA9ICdjZW50ZXInO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlld0VsZW1lbnQuc3R5bGUuYmFja2dyb3VuZFJlcGVhdCA9ICduby1yZXBlYXQnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0VkaXRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJvcmRlckNvbG9yID0gJ3JnYigyNTQsIDk0LCA1OCknO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlld0VsZW1lbnQuc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChsYXlvdXQudHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5hbWVCbG9jaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWVFbGVtZW50ID0gbmFtZUJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgIGlmIChuYW1lRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGF5b3V0LnR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3BsYXlOYW1lID0gIWxheW91dC5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBcItCY0LfQvtCx0YDQsNC20LXQvdC40LVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbGF5b3V0Lm5hbWUuaW5jbHVkZXMoXCJcXG5cIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBsYXlvdXQubmFtZS5zcGxpdChcIlxcblwiKVswXSArIFwiLi4uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBsYXlvdXQubmFtZS5sZW5ndGggPiA0MFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBsYXlvdXQubmFtZS5zbGljZSgwLCA0MCkgKyBcIi4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGxheW91dC5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZUVsZW1lbnQuaW5uZXJUZXh0ID0gZGlzcGxheU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobGF5b3V0LnR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZUVsZW1lbnQuaW5uZXJUZXh0ID0gbGF5b3V0Lm5hbWUgfHwgXCLQotC10LrRgdGCXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVtb3ZlQmxvY2spIHtcbiAgICAgICAgICAgICAgICByZW1vdmVCbG9jay5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICAgICAgcmVtb3ZlQmxvY2sub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVMYXlvdXQobGF5b3V0LmlkKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNFZGl0aW5nKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW5jZWxFZGl0TGF5b3V0KCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3RvcmVJY29uRnJvbURhdGFPcmlnaW5hbChyZW1vdmVCbG9jay5maXJzdEVsZW1lbnRDaGlsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWRpdEJsb2NrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzRWRpdGluZyB8fCBsYXlvdXQuaWQgPT09IFwic3RhcnRcIikge1xuICAgICAgICAgICAgICAgICAgICBlZGl0QmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWRpdEJsb2NrLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgICAgICBlZGl0QmxvY2sub25jbGljayA9ICgpID0+IHRoaXMuZWRpdExheW91dChsYXlvdXQpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVzdG9yZUljb25Gcm9tRGF0YU9yaWdpbmFsKGdldExhc3RDaGlsZChlZGl0QmxvY2spKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5hcHBlbmRDaGlsZChsYXlvdXRJdGVtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gW2xheW91dHNdIGxheW91dHMgc2hvd246ICR7dGhpcy5lZGl0b3JMYXlvdXRzTGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkLmNoaWxkcmVuLmxlbmd0aH1gKTtcbiAgICB9XG4gICAgaW5pdEFkZE9yZGVyQnV0dG9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmV2ZW50cy5vbihFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIChpc0xvYWRpbmcpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzTG9hZGluZykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMC41JztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAnbm90LWFsbG93ZWQnO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0JrQvdC+0L/QutCwINC30LDQsdC70L7QutC40YDQvtCy0LDQvdCwICjQuNC00LXRgiDQs9C10L3QtdGA0LDRhtC40Y8pJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0JrQvdC+0L/QutCwINGA0LDQt9Cx0LvQvtC60LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLm9uY2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0FkZGluZ1RvQ2FydCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW29yZGVyXSDQn9GA0L7RhtC10YHRgSDQtNC+0LHQsNCy0LvQtdC90LjRjyDRg9C20LUg0LjQtNC10YIsINC40LPQvdC+0YDQuNGA0YPQtdC8INC/0L7QstGC0L7RgNC90L7QtSDQvdCw0LbQsNGC0LjQtScpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmdldFN1bSgpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQoJ9CU0LvRjyDQtNC+0LHQsNCy0LvQtdC90LjRjyDQt9Cw0LrQsNC30LAg0L/RgNC+0LTRg9C60YIg0L3QtSDQvNC+0LbQtdGCINCx0YvRgtGMINC/0YPRgdGC0YvQvCcpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmxheW91dHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQoJ9Cf0L7QttCw0LvRg9C50YHRgtCwLCDQtNC+0LbQtNC40YLQtdGB0Ywg0LfQsNCy0LXRgNGI0LXQvdC40Y8g0LPQtdC90LXRgNCw0YbQuNC4INC00LjQt9Cw0LnQvdCwJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbb3JkZXJdINCf0L7Qv9GL0YLQutCwINC00L7QsdCw0LLQuNGC0Ywg0LIg0LrQvtGA0LfQuNC90YMg0LHQtdC3INC00LjQt9Cw0LnQvdCwJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGJ1dHRvblRleHRFbGVtZW50ID0gdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbj8ucXVlcnlTZWxlY3RvcignLnRuLWF0b20nKTtcbiAgICAgICAgICAgIGlmICghYnV0dG9uVGV4dEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBidXR0b25UZXh0RWxlbWVudCA9IHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24/LnF1ZXJ5U2VsZWN0b3IoJ2Rpdiwgc3BhbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxUZXh0ID0gYnV0dG9uVGV4dEVsZW1lbnQ/LnRleHRDb250ZW50Py50cmltKCkgfHwgJ9CU0L7QsdCw0LLQuNGC0Ywg0LIg0LrQvtGA0LfQuNC90YMnO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQWRkaW5nVG9DYXJ0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEFkZFRvQ2FydEJ1dHRvbkxvYWRpbmcodHJ1ZSwgJ9CU0L7QsdCw0LLQu9C10L3QuNC1Li4uJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgYXJ0aWNsZSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqICg5OTk5OTk5OSAtIDk5OTk5OSArIDEpKSArIDk5OTk5OTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCd0LDRh9Cw0LvQviDRgdC+0LfQtNCw0L3QuNGPINC30LDQutCw0LfQsCcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4cG9ydGVkQXJ0ID0gYXdhaXQgdGhpcy5leHBvcnRBcnQodHJ1ZSwgNTEyKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCt0LrRgdC/0L7RgNGCINC00LjQt9Cw0LnQvdCwINC30LDQstC10YDRiNC10L06JywgT2JqZWN0LmtleXMoZXhwb3J0ZWRBcnQpKTtcbiAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMoZXhwb3J0ZWRBcnQpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBhbGVydCgn0J7RiNC40LHQutCwOiDQvdC1INGD0LTQsNC70L7RgdGMINGN0LrRgdC/0L7RgNGC0LjRgNC+0LLQsNGC0Ywg0LTQuNC30LDQudC9LiDQn9C+0L/RgNC+0LHRg9C50YLQtSDQtdGJ0LUg0YDQsNC3LicpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbb3JkZXJdINCt0LrRgdC/0L7RgNGCINCy0LXRgNC90YPQuyDQv9GD0YHRgtC+0Lkg0YDQtdC30YPQu9GM0YLQsNGCJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3Qgc2lkZXMgPSBPYmplY3Qua2V5cyhleHBvcnRlZEFydCkubWFwKHNpZGUgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VfdXJsOiBleHBvcnRlZEFydFtzaWRlXSB8fCAnJyxcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQl9Cw0LPRgNGD0LfQutCwINC40LfQvtCx0YDQsNC20LXQvdC40Lkg0L3QsCDRgdC10YDQstC10YAuLi4nKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1cGxvYWRQcm9taXNlcyA9IHNpZGVzLm1hcChhc3luYyAoc2lkZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBiYXNlNjQgPSBzaWRlLmltYWdlX3VybC5zcGxpdCgnLCcpWzFdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1cGxvYWRlZFVybCA9IGF3YWl0IHRoaXMudXBsb2FkSW1hZ2VUb1NlcnZlcihiYXNlNjQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBzaWRlLCB1cGxvYWRlZFVybCB9O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVwbG9hZGVkU2lkZXMgPSBhd2FpdCBQcm9taXNlLmFsbCh1cGxvYWRQcm9taXNlcyk7XG4gICAgICAgICAgICAgICAgdXBsb2FkZWRTaWRlcy5mb3JFYWNoKCh7IHNpZGUsIHVwbG9hZGVkVXJsIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2lkZS5pbWFnZV91cmwgPSB1cGxvYWRlZFVybDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCY0LfQvtCx0YDQsNC20LXQvdC40Y8g0LfQsNCz0YDRg9C20LXQvdGLINC90LAg0YHQtdGA0LLQtdGAJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdE5hbWUgPSBgJHt0aGlzLmNhcGl0YWxpemVGaXJzdExldHRlcih0aGlzLmdldFByb2R1Y3ROYW1lKCkpfSDRgSDQstCw0YjQuNC8ICR7T2JqZWN0LmtleXMoZXhwb3J0ZWRBcnQpLmxlbmd0aCA9PSAxID8gJ9C+0LTQvdC+0YHRgtC+0YDQvtC90L3QuNC8JyA6ICfQtNCy0YPRhdGB0YLQvtGA0L7QvdC90LjQvCd9INC/0YDQuNC90YLQvtC8YDtcbiAgICAgICAgICAgICAgICBjb25zdCBsYXlvdXRzID0gdGhpcy5sYXlvdXRzLm1hcChsYXlvdXQgPT4gKHsgLi4ubGF5b3V0LCB1cmw6IHVuZGVmaW5lZCB9KSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdXNlcklkID0gYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci5nZXRVc2VySWQoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICAgICAgICAgIGZvcm1EYXRhLmFwcGVuZChcImxheW91dHNcIiwgSlNPTi5zdHJpbmdpZnkobGF5b3V0cykpO1xuICAgICAgICAgICAgICAgIGZvcm1EYXRhLmFwcGVuZChcInVzZXJfaWRcIiwgdXNlcklkKTtcbiAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoXCJhcnRcIiwgYXJ0aWNsZS50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBmZXRjaCh0aGlzLmFwaUNvbmZpZy53ZWJob29rQ2FydCwge1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgICAgICAgICBib2R5OiBmb3JtRGF0YVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNyZWF0ZVByb2R1Y3Qoe1xuICAgICAgICAgICAgICAgICAgICBxdWFudGl0eTogdGhpcy5nZXRRdWFudGl0eSgpLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBwcm9kdWN0TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogdGhpcy5fc2VsZWN0U2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IHRoaXMuX3NlbGVjdENvbG9yLFxuICAgICAgICAgICAgICAgICAgICBzaWRlcyxcbiAgICAgICAgICAgICAgICAgICAgYXJ0aWNsZSxcbiAgICAgICAgICAgICAgICAgICAgcHJpY2U6IHRoaXMuZ2V0U3VtKCksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQl9Cw0LrQsNC3INGD0YHQv9C10YjQvdC+INGB0L7Qt9C00LDQvScpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyhmYWxzZSwgJ+KckyDQlNC+0LHQsNCy0LvQtdC90L4hJyk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyhmYWxzZSwgb3JpZ2luYWxUZXh0KTtcbiAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tvcmRlcl0g0J7RiNC40LHQutCwINGB0L7Qt9C00LDQvdC40Y8g0LfQsNC60LDQt9CwOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBhbGVydCgn0J7RiNC40LHQutCwINC/0YDQuCDRgdC+0LfQtNCw0L3QuNC4INC30LDQutCw0LfQsCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyhmYWxzZSwgb3JpZ2luYWxUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzQWRkaW5nVG9DYXJ0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0KTQu9Cw0LMgaXNBZGRpbmdUb0NhcnQg0YHQsdGA0L7RiNC10L0nKTtcbiAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyhpc0xvYWRpbmcsIHRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmluamVjdFB1bHNlQW5pbWF0aW9uKCk7XG4gICAgICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b247XG4gICAgICAgIGxldCBidXR0b25UZXh0RWxlbWVudCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCcudG4tYXRvbScpO1xuICAgICAgICBpZiAoIWJ1dHRvblRleHRFbGVtZW50KSB7XG4gICAgICAgICAgICBidXR0b25UZXh0RWxlbWVudCA9IGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdkaXYsIHNwYW4nKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZXh0VGFyZ2V0ID0gYnV0dG9uVGV4dEVsZW1lbnQgfHwgYnV0dG9uO1xuICAgICAgICBpZiAoaXNMb2FkaW5nKSB7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9ICcwLjcnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmN1cnNvciA9ICdub3QtYWxsb3dlZCc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICAgICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgdGV4dFRhcmdldC50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuYW5pbWF0aW9uID0gJ2NhcnRCdXR0b25QdWxzZSAxLjVzIGVhc2UtaW4tb3V0IGluZmluaXRlJztcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0gW2FuaW1hdGlvbl0g0JrQvdC+0L/QutCwINC30LDQsdC70L7QutC40YDQvtCy0LDQvdCwOicsIHRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuYW5pbWF0aW9uID0gJ25vbmUnO1xuICAgICAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgICAgICB0ZXh0VGFyZ2V0LnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0gW2FuaW1hdGlvbl0g0JrQvdC+0L/QutCwINGA0LDQt9Cx0LvQvtC60LjRgNC+0LLQsNC90LA6JywgdGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5qZWN0UHVsc2VBbmltYXRpb24oKSB7XG4gICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FydC1idXR0b24tcHVsc2UtYW5pbWF0aW9uJykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgIHN0eWxlLmlkID0gJ2NhcnQtYnV0dG9uLXB1bHNlLWFuaW1hdGlvbic7XG4gICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gYFxyXG4gICAgICAgICAgICBAa2V5ZnJhbWVzIGNhcnRCdXR0b25QdWxzZSB7XHJcbiAgICAgICAgICAgICAgICAwJSwgMTAwJSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBzY2FsZSgxKTtcclxuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLjc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICA1MCUge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMS4wMik7XHJcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMC44NTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIGA7XG4gICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbYW5pbWF0aW9uXSBDU1Mg0LDQvdC40LzQsNGG0LjRjyDQv9GD0LvRjNGB0LDRhtC40Lgg0LTQvtCx0LDQstC70LXQvdCwJyk7XG4gICAgfVxuICAgIHNldEdlbmVyYXRlQnV0dG9uTG9hZGluZyhpc0xvYWRpbmcsIHRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmZvcm1CdXR0b24pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuaW5qZWN0UHVsc2VBbmltYXRpb24oKTtcbiAgICAgICAgY29uc3QgYnV0dG9uID0gdGhpcy5mb3JtQnV0dG9uO1xuICAgICAgICBsZXQgYnV0dG9uVGV4dEVsZW1lbnQgPSBidXR0b24ucXVlcnlTZWxlY3RvcignLnRuLWF0b20nKTtcbiAgICAgICAgaWYgKCFidXR0b25UZXh0RWxlbWVudCkge1xuICAgICAgICAgICAgYnV0dG9uVGV4dEVsZW1lbnQgPSBidXR0b24ucXVlcnlTZWxlY3RvcignZGl2LCBzcGFuJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dFRhcmdldCA9IGJ1dHRvblRleHRFbGVtZW50IHx8IGJ1dHRvbjtcbiAgICAgICAgaWYgKGlzTG9hZGluZykge1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMC43JztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAnbm90LWFsbG93ZWQnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgICAgIHRleHRUYXJnZXQudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmFuaW1hdGlvbiA9ICdjYXJ0QnV0dG9uUHVsc2UgMS41cyBlYXNlLWluLW91dCBpbmZpbml0ZSc7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZ2VuZXJhdGVdIFthbmltYXRpb25dINCa0L3QvtC/0LrQsCDQt9Cw0LHQu9C+0LrQuNGA0L7QstCw0L3QsDonLCB0ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmFuaW1hdGlvbiA9ICdub25lJztcbiAgICAgICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgdGV4dFRhcmdldC50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZ2VuZXJhdGVdIFthbmltYXRpb25dINCa0L3QvtC/0LrQsCDRgNCw0LfQsdC70L7QutC40YDQvtCy0LDQvdCwOicsIHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGluaXRVcGxvYWRJbWFnZUJ1dHRvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvclVwbG9hZEltYWdlQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnJlc2V0VXNlclVwbG9hZEltYWdlKCk7XG4gICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmVkaXRvclVwbG9hZEltYWdlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGxvYWRVc2VySW1hZ2UoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGluaXRGaXhRdWFudGl0eUZvcm0oKSB7XG4gICAgICAgIGlmICghdGhpcy5xdWFudGl0eUZvcm1CbG9jaylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZm9ybSA9IHRoaXMucXVhbnRpdHlGb3JtQmxvY2sucXVlcnlTZWxlY3RvcignZm9ybScpO1xuICAgICAgICBjb25zdCBpbnB1dCA9IGZvcm0/LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJxdWFudGl0eVwiXScpO1xuICAgICAgICBpZiAoIWlucHV0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB2YWxpZGF0ZVF1YW50aXR5ID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBpbnB1dC52YWx1ZS50cmltKCk7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09ICcnIHx8IGlzTmFOKE51bWJlcih2YWx1ZSkpKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQudmFsdWUgPSAnMSc7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcXVhbnRpdHkgPSBwYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgICAgaWYgKHF1YW50aXR5IDwgMSB8fCBxdWFudGl0eSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlucHV0LnZhbHVlID0gJzEnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIHZhbGlkYXRlUXVhbnRpdHkpO1xuICAgICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgdmFsaWRhdGVRdWFudGl0eSk7XG4gICAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHZhbGlkYXRlUXVhbnRpdHkpO1xuICAgICAgICB2YWxpZGF0ZVF1YW50aXR5KCk7XG4gICAgfVxuICAgIGFzeW5jIGluaXRGb3JtKCkge1xuICAgICAgICBpZiAoIXRoaXMuZm9ybUJsb2NrIHx8ICF0aGlzLmZvcm1CdXR0b24gfHwgIXRoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBmb3JtQmxvY2sgPSB0aGlzLmZvcm1CbG9jaztcbiAgICAgICAgY29uc3QgZm9ybUlucHV0VmFyaWFibGVOYW1lID0gdGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWU7XG4gICAgICAgIGNvbnN0IGZvcm1CdXR0b24gPSB0aGlzLmZvcm1CdXR0b247XG4gICAgICAgIGNvbnN0IGhhbmRsZUNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtidXR0b25dIGNsaWNrZWQnKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzR2VuZXJhdGluZykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dINCT0LXQvdC10YDQsNGG0LjRjyDRg9C20LUg0LjQtNC10YIsINC40LPQvdC+0YDQuNGA0YPQtdC8INC/0L7QstGC0L7RgNC90L7QtSDQvdCw0LbQsNGC0LjQtScpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGZvcm1JbnB1dCA9IGZvcm1CbG9jay5xdWVyeVNlbGVjdG9yKGBbbmFtZT1cIiR7Zm9ybUlucHV0VmFyaWFibGVOYW1lfVwiXWApO1xuICAgICAgICAgICAgY29uc3QgcHJvbXB0ID0gZm9ybUlucHV0LnZhbHVlO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmxvYWRlZFVzZXJJbWFnZSkge1xuICAgICAgICAgICAgICAgIGlmICghcHJvbXB0IHx8IHByb21wdC50cmltKCkgPT09IFwiXCIgfHwgcHJvbXB0Lmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW2lucHV0XSBwcm9tcHQgaXMgZW1wdHkgb3IgdG9vIHNob3J0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwi0JzQuNC90LjQvNCw0LvRjNC90LDRjyDQtNC70LjQvdCwINC30LDQv9GA0L7RgdCwIDEg0YHQuNC80LLQvtC7XCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtpbnB1dF0gcHJvbXB0OiAke3Byb21wdH1gKTtcbiAgICAgICAgICAgIHRoaXMuaXNHZW5lcmF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc2V0R2VuZXJhdGVCdXR0b25Mb2FkaW5nKHRydWUsICfQk9C10L3QtdGA0LDRhtC40Y8uLi4nKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIHRydWUpO1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0SWQgPSB0aGlzLl9zZWxlY3RMYXlvdXQgfHwgTGF5b3V0LmdlbmVyYXRlSWQoKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXJsID0gYXdhaXQgZ2VuZXJhdGVJbWFnZSh7XG4gICAgICAgICAgICAgICAgICAgIHByb21wdCxcbiAgICAgICAgICAgICAgICAgICAgc2hpcnRDb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2U6IHRoaXMuX3NlbGVjdExheW91dCA/IHRoaXMubG9hZGVkVXNlckltYWdlICE9PSB0aGlzLmxheW91dHMuZmluZChsYXlvdXQgPT4gbGF5b3V0LmlkID09PSB0aGlzLl9zZWxlY3RMYXlvdXQpPy51cmwgPyB0aGlzLmxvYWRlZFVzZXJJbWFnZSA6IG51bGwgOiB0aGlzLmxvYWRlZFVzZXJJbWFnZSxcbiAgICAgICAgICAgICAgICAgICAgd2l0aEFpOiB0aGlzLmVkaXRvckxvYWRXaXRoQWksXG4gICAgICAgICAgICAgICAgICAgIGxheW91dElkLFxuICAgICAgICAgICAgICAgICAgICBpc05ldzogdGhpcy5fc2VsZWN0TGF5b3V0ID8gZmFsc2UgOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy55bSgxMDMyNzkyMTQsICdyZWFjaEdvYWwnLCAnZ2VuZXJhdGVkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikgeyB9XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlRGF0YSA9IGF3YWl0IHRoaXMuZ2V0SW1hZ2VEYXRhKHVybCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtpbnB1dF0gaW1hZ2UgZGF0YSByZWNlaXZlZGApO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zZWxlY3RMYXlvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGF5b3V0ID0gdGhpcy5sYXlvdXRzLmZpbmQobGF5b3V0ID0+IGxheW91dC5pZCA9PT0gbGF5b3V0SWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGF5b3V0ICYmIGxheW91dC5pc0ltYWdlTGF5b3V0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbaW5wdXRdIHVwZGF0aW5nIGxheW91dDogJHtsYXlvdXQuaWR9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXlvdXQubmFtZSA9IHByb21wdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheW91dC51cmwgPSBpbWFnZURhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW2lucHV0XSBsYXlvdXQgdXBkYXRlZGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZExheW91dChMYXlvdXQuY3JlYXRlSW1hZ2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGxheW91dElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmlldzogdGhpcy5fc2VsZWN0U2lkZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogaW1hZ2VEYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcHJvbXB0XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9ybUlucHV0LnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdExheW91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgZm9ybUlucHV0LnZhbHVlID0gXCJcIjtcbiAgICAgICAgICAgICAgICB0aGlzLmNhbmNlbEVkaXRMYXlvdXQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0VXNlclVwbG9hZEltYWdlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0R2VuZXJhdGVCdXR0b25Mb2FkaW5nKGZhbHNlLCAn4pyTINCT0L7RgtC+0LLQviEnKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRHZW5lcmF0ZUJ1dHRvbkxvYWRpbmcoZmFsc2UsICfQodCz0LXQvdC10YDQuNGA0L7QstCw0YLRjCcpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzR2VuZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0g0KTQu9Cw0LMgaXNHZW5lcmF0aW5nINGB0LHRgNC+0YjQtdC9Jyk7XG4gICAgICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2Zvcm1dIFtpbnB1dF0gZXJyb3InLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgYWxlcnQoXCLQntGI0LjQsdC60LAg0L/RgNC4INCz0LXQvdC10YDQsNGG0LjQuCDQuNC30L7QsdGA0LDQttC10L3QuNGPXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0R2VuZXJhdGVCdXR0b25Mb2FkaW5nKGZhbHNlLCAn0KHQs9C10L3QtdGA0LjRgNC+0LLQsNGC0YwnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzR2VuZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxvYWRlZFVzZXJJbWFnZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc2V0VXNlclVwbG9hZEltYWdlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zZWxlY3RMYXlvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0TGF5b3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW5jZWxFZGl0TGF5b3V0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBmb3JtID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm0gPSBmb3JtQmxvY2sucXVlcnlTZWxlY3RvcihcImZvcm1cIik7XG4gICAgICAgICAgICAgICAgaWYgKGZvcm0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZm9ybSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICB9LCAxMDAwICogMTApO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFmb3JtKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBmb3JtIG5vdCBmb3VuZCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZvcm0uYWN0aW9uID0gXCJcIjtcbiAgICAgICAgZm9ybS5tZXRob2QgPSBcIkdFVFwiO1xuICAgICAgICBmb3JtLm9uc3VibWl0ID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgaGFuZGxlQ2xpY2soKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgZml4SW5wdXRCbG9jayA9IGZvcm0ucXVlcnlTZWxlY3RvcihgdGV4dGFyZWFbbmFtZT0nJHtmb3JtSW5wdXRWYXJpYWJsZU5hbWV9J11gKTtcbiAgICAgICAgaWYgKGZpeElucHV0QmxvY2spIHtcbiAgICAgICAgICAgIGZpeElucHV0QmxvY2suc3R5bGUucGFkZGluZyA9IFwiOHB4XCI7XG4gICAgICAgIH1cbiAgICAgICAgZm9ybUJ1dHRvbi5vbmNsaWNrID0gaGFuZGxlQ2xpY2s7XG4gICAgICAgIGZvcm1CdXR0b24uc3R5bGUuY3Vyc29yID0gXCJwb2ludGVyXCI7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSDQmNC90LjRhtC40LDQu9C40LfQsNGG0LjRjyDRhNC+0YDQvNGLINC30LDQstC10YDRiNC10L3QsCcpO1xuICAgIH1cbiAgICByZXN0b3JlSWNvbkZyb21EYXRhT3JpZ2luYWwoZWxlbWVudCkge1xuICAgICAgICBpZiAoIWVsZW1lbnQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGRhdGFPcmlnaW5hbCA9IGVsZW1lbnQuYXR0cmlidXRlcy5nZXROYW1lZEl0ZW0oXCJkYXRhLW9yaWdpbmFsXCIpPy52YWx1ZTtcbiAgICAgICAgaWYgKGRhdGFPcmlnaW5hbCkge1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBgdXJsKFwiJHtkYXRhT3JpZ2luYWx9XCIpYDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjaGFuZ2VQcm9kdWN0KHByb2R1Y3RUeXBlKSB7XG4gICAgICAgIHRoaXMuX3NlbGVjdFR5cGUgPSBwcm9kdWN0VHlwZTtcbiAgICAgICAgdGhpcy5jbGVhck1vY2t1cENhY2hlKCk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUocHJvZHVjdFR5cGUpO1xuICAgICAgICBpZiAocHJvZHVjdCkge1xuICAgICAgICAgICAgY29uc3QgbW9ja3VwV2l0aEN1cnJlbnRDb2xvciA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG0gPT4gbS5zaWRlID09PSB0aGlzLl9zZWxlY3RTaWRlICYmIG0uY29sb3IubmFtZSA9PT0gdGhpcy5fc2VsZWN0Q29sb3IubmFtZSk7XG4gICAgICAgICAgICBpZiAoIW1vY2t1cFdpdGhDdXJyZW50Q29sb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaXJzdE1vY2t1cCA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG0gPT4gbS5zaWRlID09PSB0aGlzLl9zZWxlY3RTaWRlKTtcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3RNb2NrdXApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0Q29sb3IgPSBmaXJzdE1vY2t1cC5jb2xvcjtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3Byb2R1Y3RdINCm0LLQtdGCINC40LfQvNC10L3QtdC9INC90LAgJHt0aGlzLl9zZWxlY3RDb2xvci5uYW1lfSDQtNC70Y8g0L/RgNC+0LTRg9C60YLQsCAke3Byb2R1Y3RUeXBlfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVwZGF0ZVByb2R1Y3RCbG9ja3NVSSgpO1xuICAgICAgICB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICB0aGlzLmxvYWRQcm9kdWN0KCk7XG4gICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgfVxuICAgIHVwZGF0ZVByb2R1Y3RCbG9ja3NVSSgpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvZHVjdEJsb2Nrcy5sZW5ndGggPT09IDApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMucHJvZHVjdEJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgIGJsb2NrLnN0eWxlLmJhY2tncm91bmQgPSAncmdiKDIyMiAyMjIgMjIyKSc7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBhY3RpdmVCbG9jayA9IHRoaXMucHJvZHVjdEJsb2Nrcy5maW5kKGJsb2NrID0+IGJsb2NrLmNsYXNzTGlzdC5jb250YWlucygnZWRpdG9yLXNldHRpbmdzX19wcm9kdWN0LWJsb2NrX18nICsgdGhpcy5fc2VsZWN0VHlwZSkpO1xuICAgICAgICBpZiAoYWN0aXZlQmxvY2spIHtcbiAgICAgICAgICAgIGFjdGl2ZUJsb2NrLnN0eWxlLmJhY2tncm91bmQgPSAnJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjaGFuZ2VTaWRlKCkge1xuICAgICAgICBjb25zdCBuZXdTaWRlID0gdGhpcy5fc2VsZWN0U2lkZSA9PT0gJ2Zyb250JyA/ICdiYWNrJyA6ICdmcm9udCc7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlU2lkZShuZXdTaWRlKTtcbiAgICAgICAgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5TVEFURV9DSEFOR0VELCB1bmRlZmluZWQpO1xuICAgIH1cbiAgICBjaGFuZ2VDb2xvcihjb2xvck5hbWUpIHtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBtb2NrdXAgPSBwcm9kdWN0Lm1vY2t1cHMuZmluZChtID0+IG0uY29sb3IubmFtZSA9PT0gY29sb3JOYW1lKTtcbiAgICAgICAgaWYgKCFtb2NrdXApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gbW9ja3VwLmNvbG9yO1xuICAgICAgICB0aGlzLmNsZWFyTW9ja3VwQ2FjaGUoKTtcbiAgICAgICAgdGhpcy51cGRhdGVDb2xvckJsb2Nrc1VJKGNvbG9yTmFtZSk7XG4gICAgICAgIHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgfVxuICAgIHVwZGF0ZUNvbG9yQmxvY2tzVUkoY29sb3JOYW1lKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbG9yQmxvY2tzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5jb2xvckJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgIGJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLmNvbG9yQmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX2NvbG9yLWJsb2NrX18nICsgY29sb3JOYW1lKSk7XG4gICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgYWN0aXZlQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjaGFuZ2VTaXplKHNpemUpIHtcbiAgICAgICAgdGhpcy51cGRhdGVTaXplQmxvY2tzVUkoc2l6ZSk7XG4gICAgICAgIHRoaXMuX3NlbGVjdFNpemUgPSBzaXplO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgIH1cbiAgICB1cGRhdGVTaXplQmxvY2tzVUkoc2l6ZSkge1xuICAgICAgICBpZiAodGhpcy5zaXplQmxvY2tzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5zaXplQmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgY29uc3QgYm9yZGVyQmxvY2sgPSBibG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGlmIChib3JkZXJCbG9jaykge1xuICAgICAgICAgICAgICAgIGJvcmRlckJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLnNpemVCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fc2l6ZS1ibG9ja19fJyArIHNpemUpKTtcbiAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICBjb25zdCBib3JkZXJCbG9jayA9IGFjdGl2ZUJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgaWYgKGJvcmRlckJsb2NrKSB7XG4gICAgICAgICAgICAgICAgYm9yZGVyQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBlZGl0TGF5b3V0KGxheW91dCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSBlZGl0IGxheW91dCAke2xheW91dC5pZH1gKTtcbiAgICAgICAgdGhpcy5fc2VsZWN0TGF5b3V0ID0gbGF5b3V0LmlkO1xuICAgICAgICBpZiAodGhpcy5mb3JtQmxvY2sgJiYgdGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGZvcm1JbnB1dCA9IHRoaXMuZm9ybUJsb2NrLnF1ZXJ5U2VsZWN0b3IoYFtuYW1lPVwiJHt0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZX1cIl1gKTtcbiAgICAgICAgICAgIGlmIChmb3JtSW5wdXQpIHtcbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQudmFsdWUgPSBsYXlvdXQubmFtZSB8fCAnJztcbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQuc3R5bGUuYm9yZGVyQ29sb3IgPSAncmdiKDI1NCwgOTQsIDU4KSc7XG4gICAgICAgICAgICAgICAgZm9ybUlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBbbGF5b3V0c10g0KPRgdGC0LDQvdC+0LLQu9C10L3QviDQt9C90LDRh9C10L3QuNC1INCyINGE0L7RgNC80YM6IFwiJHtsYXlvdXQubmFtZX1cImApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSDQndC1INC90LDQudC00LXQvSDRjdC70LXQvNC10L3RgiDRhNC+0YDQvNGLINGBINC40LzQtdC90LXQvCBcIiR7dGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWV9XCJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSkge1xuICAgICAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBsYXlvdXQudXJsO1xuICAgICAgICAgICAgdGhpcy5zZXRVc2VyVXBsb2FkSW1hZ2UobGF5b3V0LnVybCk7XG4gICAgICAgICAgICB0aGlzLmluaXRBaUJ1dHRvbnMoKTtcbiAgICAgICAgICAgIHRoaXMuaGlkZUFpQnV0dG9ucygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5yZXNldFVzZXJVcGxvYWRJbWFnZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICB9XG4gICAgY2FuY2VsRWRpdExheW91dCgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBbbGF5b3V0c10gY2FuY2VsIGVkaXQgbGF5b3V0YCk7XG4gICAgICAgIHRoaXMuX3NlbGVjdExheW91dCA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLmZvcm1CbG9jayAmJiB0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSkge1xuICAgICAgICAgICAgY29uc3QgZm9ybUlucHV0ID0gdGhpcy5mb3JtQmxvY2sucXVlcnlTZWxlY3RvcihgW25hbWU9XCIke3RoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lfVwiXWApO1xuICAgICAgICAgICAgaWYgKGZvcm1JbnB1dCkge1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC52YWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxvYWRlZFVzZXJJbWFnZSA9IG51bGw7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gW2xheW91dHNdINCg0LXQtNCw0LrRgtC40YDQvtCy0LDQvdC40LUg0L7RgtC80LXQvdC10L3QvmApO1xuICAgIH1cbiAgICBpbml0QWlCdXR0b25zKCkge1xuICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jaGFuZ2VMb2FkV2l0aEFpKCk7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZUxvYWRXaXRoQWkodHJ1ZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZUxvYWRXaXRoQWkoZmFsc2UpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBoaWRlQWlCdXR0b25zKCkge1xuICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWkgPSB0cnVlO1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uKSB7XG4gICAgICAgICAgICAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uLnBhcmVudEVsZW1lbnQ/LnBhcmVudEVsZW1lbnQ/LnBhcmVudEVsZW1lbnQpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2hvd0FpQnV0dG9ucygpIHtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbikge1xuICAgICAgICAgICAgKHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbi5wYXJlbnRFbGVtZW50Py5wYXJlbnRFbGVtZW50Py5wYXJlbnRFbGVtZW50KS5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgICB9XG4gICAgfVxuICAgIHVwbG9hZFVzZXJJbWFnZSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZCB1c2VyIGltYWdlXSBzdGFydGluZyB1c2VyIGltYWdlIHVwbG9hZCcpO1xuICAgICAgICB0aGlzLmluaXRBaUJ1dHRvbnMoKTtcbiAgICAgICAgdGhpcy5zaG93QWlCdXR0b25zKCk7XG4gICAgICAgIGNvbnN0IGZpbGVJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgIGZpbGVJbnB1dC50eXBlID0gJ2ZpbGUnO1xuICAgICAgICBmaWxlSW5wdXQuYWNjZXB0ID0gJ2ltYWdlLyonO1xuICAgICAgICBmaWxlSW5wdXQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgZmlsZUlucHV0Lm9uY2hhbmdlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG4gICAgICAgICAgICBjb25zdCBmaWxlID0gdGFyZ2V0LmZpbGVzPy5bMF07XG4gICAgICAgICAgICBpZiAoZmlsZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWQgdXNlciBpbWFnZV0gZmlsZSBzZWxlY3RlZDonLCBmaWxlLm5hbWUpO1xuICAgICAgICAgICAgICAgIGlmICghZmlsZS50eXBlLnN0YXJ0c1dpdGgoJ2ltYWdlLycpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW3VwbG9hZCB1c2VyIGltYWdlXSBzZWxlY3RlZCBmaWxlIGlzIG5vdCBhbiBpbWFnZScpO1xuICAgICAgICAgICAgICAgICAgICBhbGVydCgn0J/QvtC20LDQu9GD0LnRgdGC0LAsINCy0YvQsdC10YDQuNGC0LUg0YTQsNC50Lsg0LjQt9C+0LHRgNCw0LbQtdC90LjRjycpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGFzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlVXJsID0gZS50YXJnZXQ/LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZCB1c2VyIGltYWdlXSBmaWxlIGxvYWRlZCBhcyBkYXRhIFVSTCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbWFnZURhdGEgPSBhd2FpdCB0aGlzLmdldEltYWdlRGF0YShpbWFnZVVybCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0VXNlclVwbG9hZEltYWdlKGltYWdlRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWQgdXNlciBpbWFnZV0gaW1hZ2UgbGF5b3V0IGFkZGVkIHN1Y2Nlc3NmdWxseScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1t1cGxvYWQgdXNlciBpbWFnZV0gZXJyb3IgcmVhZGluZyBmaWxlJyk7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCfQntGI0LjQsdC60LAg0L/RgNC4INC30LDQs9GA0YPQt9C60LUg0YTQsNC50LvQsCcpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZmlsZUlucHV0KTtcbiAgICAgICAgZmlsZUlucHV0LmNsaWNrKCk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZmlsZUlucHV0KTtcbiAgICB9XG4gICAgc2V0VXNlclVwbG9hZEltYWdlKGltYWdlKSB7XG4gICAgICAgIHRoaXMubG9hZGVkVXNlckltYWdlID0gaW1hZ2U7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvclVwbG9hZFZpZXdCbG9jaykge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2suc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICBjb25zdCBpbWFnZUJsb2NrID0gZ2V0TGFzdENoaWxkKHRoaXMuZWRpdG9yVXBsb2FkVmlld0Jsb2NrKTtcbiAgICAgICAgICAgIGlmIChpbWFnZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VCbG9jay5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBgdXJsKCR7aW1hZ2V9KWA7XG4gICAgICAgICAgICAgICAgaW1hZ2VCbG9jay5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9ICdjb250YWluJztcbiAgICAgICAgICAgICAgICBpbWFnZUJsb2NrLnN0eWxlLmJhY2tncm91bmRQb3NpdGlvbiA9ICdjZW50ZXInO1xuICAgICAgICAgICAgICAgIGltYWdlQmxvY2suc3R5bGUuYmFja2dyb3VuZFJlcGVhdCA9ICduby1yZXBlYXQnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJlc2V0VXNlclVwbG9hZEltYWdlKCkge1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkVmlld0Jsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBudWxsO1xuICAgICAgICB0aGlzLmNhbmNlbEVkaXRMYXlvdXQoKTtcbiAgICB9XG4gICAgY2hhbmdlTG9hZFdpdGhBaSh2YWx1ZSA9IGZhbHNlKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IHZhbHVlO1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uICYmIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbikge1xuICAgICAgICAgICAgY29uc3QgYnV0dG9uV2l0aEFpID0gdGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uO1xuICAgICAgICAgICAgY29uc3QgYnV0dG9uV2l0aG91dEFpID0gdGhpcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZml4QnV0dG9uV2l0aEFpID0gZ2V0TGFzdENoaWxkKGJ1dHRvbldpdGhBaSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZml4QnV0dG9uV2l0aG91dEFpID0gZ2V0TGFzdENoaWxkKGJ1dHRvbldpdGhvdXRBaSk7XG4gICAgICAgICAgICAgICAgaWYgKGZpeEJ1dHRvbldpdGhBaSkge1xuICAgICAgICAgICAgICAgICAgICBmaXhCdXR0b25XaXRoQWkuc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZpeEJ1dHRvbldpdGhvdXRBaSkge1xuICAgICAgICAgICAgICAgICAgICBmaXhCdXR0b25XaXRob3V0QWkuc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YyZjJmMic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZml4QnV0dG9uV2l0aEFpID0gZ2V0TGFzdENoaWxkKGJ1dHRvbldpdGhBaSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZml4QnV0dG9uV2l0aG91dEFpID0gZ2V0TGFzdENoaWxkKGJ1dHRvbldpdGhvdXRBaSk7XG4gICAgICAgICAgICAgICAgaWYgKGZpeEJ1dHRvbldpdGhBaSkge1xuICAgICAgICAgICAgICAgICAgICBmaXhCdXR0b25XaXRoQWkuc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YyZjJmMic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmaXhCdXR0b25XaXRob3V0QWkpIHtcbiAgICAgICAgICAgICAgICAgICAgZml4QnV0dG9uV2l0aG91dEFpLnN0eWxlLmJvcmRlckNvbG9yID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGxvYWRJbWFnZShzcmMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgaW1nLmNyb3NzT3JpZ2luID0gJ2Fub255bW91cyc7XG4gICAgICAgICAgICBpbWcub25sb2FkID0gKCkgPT4gcmVzb2x2ZShpbWcpO1xuICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSByZWplY3Q7XG4gICAgICAgICAgICBpbWcuc3JjID0gc3JjO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0UXVhbnRpdHkoKSB7XG4gICAgICAgIGlmICghdGhpcy5xdWFudGl0eUZvcm1CbG9jaylcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICBjb25zdCBmb3JtID0gdGhpcy5xdWFudGl0eUZvcm1CbG9jay5xdWVyeVNlbGVjdG9yKCdmb3JtJyk7XG4gICAgICAgIGNvbnN0IGlucHV0ID0gZm9ybT8ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cInF1YW50aXR5XCJdJyk7XG4gICAgICAgIGlmICghaW5wdXQpXG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KGlucHV0LnZhbHVlKSB8fCAxO1xuICAgIH1cbiAgICBnZXRTdW0oKSB7XG4gICAgICAgIGNvbnN0IGhhc0Zyb250ID0gdGhpcy5sYXlvdXRzLnNvbWUobGF5b3V0ID0+IGxheW91dC52aWV3ID09PSAnZnJvbnQnKTtcbiAgICAgICAgY29uc3QgaGFzQmFjayA9IHRoaXMubGF5b3V0cy5zb21lKGxheW91dCA9PiBsYXlvdXQudmlldyA9PT0gJ2JhY2snKTtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0KVxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIGNvbnN0IHByaWNlID0gaGFzQmFjayAmJiBoYXNGcm9udFxuICAgICAgICAgICAgPyBwcm9kdWN0LmRvdWJsZVNpZGVkUHJpY2VcbiAgICAgICAgICAgIDogcHJvZHVjdC5wcmljZTtcbiAgICAgICAgcmV0dXJuIHByaWNlO1xuICAgIH1cbiAgICB1cGRhdGVTdW0oKSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JTdW1CbG9jaylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgc3VtID0gdGhpcy5nZXRTdW0oKTtcbiAgICAgICAgY29uc3Qgc3VtVGV4dCA9IGdldExhc3RDaGlsZCh0aGlzLmVkaXRvclN1bUJsb2NrKTtcbiAgICAgICAgaWYgKHN1bVRleHQpIHtcbiAgICAgICAgICAgIHN1bVRleHQuaW5uZXJUZXh0ID0gc3VtLnRvU3RyaW5nKCkgKyAnIOKCvSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24pIHtcbiAgICAgICAgICAgIGNvbnN0IGJ1dHRvbkJsb2NrID0gZ2V0TGFzdENoaWxkKHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24pO1xuICAgICAgICAgICAgaWYgKGJ1dHRvbkJsb2NrKSB7XG4gICAgICAgICAgICAgICAgYnV0dG9uQmxvY2suc3R5bGUuYmFja2dyb3VuZENvbG9yID0gc3VtID09PSAwID8gJ3JnYigxMjEgMTIxIDEyMSknIDogJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgbG9hZFByb2R1Y3QoKSB7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdCB8fCAhcHJvZHVjdC5wcmludENvbmZpZykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbcHJvZHVjdF0gcHJvZHVjdCBvciBwcmludENvbmZpZyBub3QgZm91bmQnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNsZWFyQWxsQ2FudmFzKCk7XG4gICAgICAgIGZvciAoY29uc3QgcHJpbnRDb25maWcgb2YgcHJvZHVjdC5wcmludENvbmZpZykge1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVDYW52YXNGb3JTaWRlKHByaW50Q29uZmlnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldEFjdGl2ZVNpZGUodGhpcy5fc2VsZWN0U2lkZSk7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIGZhbHNlKTtcbiAgICAgICAgfSwgMTAwKTtcbiAgICB9XG4gICAgY2xlYXJBbGxDYW52YXMoKSB7XG4gICAgICAgIGlmICh0aGlzLmNhbnZhc2VzQ29udGFpbmVyKSB7XG4gICAgICAgICAgICB0aGlzLmNhbnZhc2VzQ29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2FudmFzZXMuZm9yRWFjaChjYW52YXMgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjYW52YXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tjYW52YXNdINCe0YjQuNCx0LrQsCDQvtGH0LjRgdGC0LrQuCBjYW52YXM6JywgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY2FudmFzZXMgPSBbXTtcbiAgICAgICAgdGhpcy5sYXllcnNDYW52YXNlcyA9IFtdO1xuICAgICAgICB0aGlzLmFjdGl2ZUNhbnZhcyA9IG51bGw7XG4gICAgfVxuICAgIGNyZWF0ZUNhbnZhc0ZvclNpZGUocHJpbnRDb25maWcpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbnZhc2VzQ29udGFpbmVyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbY2FudmFzXSBjYW52YXNlc0NvbnRhaW5lciDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvScpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxheWVyc0NhbnZhc0Jsb2NrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGxheWVyc0NhbnZhc0Jsb2NrLmlkID0gJ2xheWVycy0tJyArIHByaW50Q29uZmlnLnNpZGU7XG4gICAgICAgIGxheWVyc0NhbnZhc0Jsb2NrLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1wb3NpdGlvbicpO1xuICAgICAgICBsYXllcnNDYW52YXNCbG9jay5zZXRBdHRyaWJ1dGUoJ3JlZicsIHByaW50Q29uZmlnLnNpZGUpO1xuICAgICAgICBsYXllcnNDYW52YXNCbG9jay5zdHlsZS56SW5kZXggPSAnNyc7XG4gICAgICAgIHRoaXMuY2FudmFzZXNDb250YWluZXIuYXBwZW5kQ2hpbGQobGF5ZXJzQ2FudmFzQmxvY2spO1xuICAgICAgICBjb25zdCBsYXllcnNDYW52YXMgPSBuZXcgZmFicmljLlN0YXRpY0NhbnZhcyhsYXllcnNDYW52YXNCbG9jaywge1xuICAgICAgICAgICAgd2lkdGg6IHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0LFxuICAgICAgICB9KTtcbiAgICAgICAgbGF5ZXJzQ2FudmFzLnNpZGUgPSBwcmludENvbmZpZy5zaWRlO1xuICAgICAgICBsYXllcnNDYW52YXMubmFtZSA9ICdzdGF0aWMtJyArIHByaW50Q29uZmlnLnNpZGU7XG4gICAgICAgIGNvbnN0IGVkaXRhYmxlQ2FudmFzQmxvY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgZWRpdGFibGVDYW52YXNCbG9jay5pZCA9ICdlZGl0YWJsZS0tJyArIHByaW50Q29uZmlnLnNpZGU7XG4gICAgICAgIGVkaXRhYmxlQ2FudmFzQmxvY2suc2V0QXR0cmlidXRlKCdyZWYnLCBwcmludENvbmZpZy5zaWRlKTtcbiAgICAgICAgZWRpdGFibGVDYW52YXNCbG9jay5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItcG9zaXRpb24nKTtcbiAgICAgICAgZWRpdGFibGVDYW52YXNCbG9jay5zdHlsZS56SW5kZXggPSAnOSc7XG4gICAgICAgIHRoaXMuY2FudmFzZXNDb250YWluZXIuYXBwZW5kQ2hpbGQoZWRpdGFibGVDYW52YXNCbG9jayk7XG4gICAgICAgIGNvbnN0IGVkaXRhYmxlQ2FudmFzID0gbmV3IGZhYnJpYy5DYW52YXMoZWRpdGFibGVDYW52YXNCbG9jaywge1xuICAgICAgICAgICAgY29udHJvbHNBYm92ZU92ZXJsYXk6IHRydWUsXG4gICAgICAgICAgICB3aWR0aDogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICB1bmlmb3JtU2NhbGluZzogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgZWRpdGFibGVDYW52YXMuc2lkZSA9IHByaW50Q29uZmlnLnNpZGU7XG4gICAgICAgIGVkaXRhYmxlQ2FudmFzLm5hbWUgPSAnZWRpdGFibGUtJyArIHByaW50Q29uZmlnLnNpZGU7XG4gICAgICAgIHRoaXMubGF5ZXJzQ2FudmFzZXMucHVzaChsYXllcnNDYW52YXMpO1xuICAgICAgICB0aGlzLmNhbnZhc2VzLnB1c2goZWRpdGFibGVDYW52YXMpO1xuICAgICAgICBpZiAodGhpcy5jYW52YXNlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlQ2FudmFzID0gZWRpdGFibGVDYW52YXM7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbml0TWFpbkNhbnZhcyhlZGl0YWJsZUNhbnZhcywgcHJpbnRDb25maWcpO1xuICAgIH1cbiAgICBpbml0TWFpbkNhbnZhcyhjYW52YXMsIHByaW50Q29uZmlnKSB7XG4gICAgICAgIGlmICghY2FudmFzIHx8ICEoY2FudmFzIGluc3RhbmNlb2YgZmFicmljLkNhbnZhcykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2NhbnZhc10gY2FudmFzINC90LUg0LLQsNC70LjQtNC10L0nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB3aWR0aCA9IHByaW50Q29uZmlnLnNpemUud2lkdGggLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBwcmludENvbmZpZy5zaXplLmhlaWdodCAvIDYwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0O1xuICAgICAgICBjb25zdCBsZWZ0ID0gKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGggLSB3aWR0aCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnggLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoKTtcbiAgICAgICAgY29uc3QgdG9wID0gKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0IC0gaGVpZ2h0KSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueSAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgY29uc3QgY2xpcEFyZWEgPSBuZXcgZmFicmljLlJlY3Qoe1xuICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQsXG4gICAgICAgICAgICBsZWZ0LFxuICAgICAgICAgICAgdG9wLFxuICAgICAgICAgICAgZmlsbDogJ3JnYigyNTUsIDAsIDApJyxcbiAgICAgICAgICAgIG5hbWU6ICdhcmVhOmNsaXAnLFxuICAgICAgICAgICAgZXZlbnRlZDogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBhcmVhQm9yZGVyID0gbmV3IGZhYnJpYy5SZWN0KHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCAtIDMsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCAtIDMsXG4gICAgICAgICAgICBsZWZ0LFxuICAgICAgICAgICAgdG9wLFxuICAgICAgICAgICAgZmlsbDogJ3JnYmEoMCwwLDAsMCknLFxuICAgICAgICAgICAgc3Ryb2tlV2lkdGg6IDMsXG4gICAgICAgICAgICBzdHJva2U6ICdyZ2IoMjU0LCA5NCwgNTgpJyxcbiAgICAgICAgICAgIG5hbWU6ICdhcmVhOmJvcmRlcicsXG4gICAgICAgICAgICBvcGFjaXR5OiAwLjMsXG4gICAgICAgICAgICBldmVudGVkOiBmYWxzZSxcbiAgICAgICAgICAgIHNlbGVjdGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgaGFzQ29udHJvbHM6IGZhbHNlLFxuICAgICAgICAgICAgc3Ryb2tlRGFzaEFycmF5OiBbNSwgNV0sXG4gICAgICAgIH0pO1xuICAgICAgICBjYW52YXMuYWRkKGFyZWFCb3JkZXIpO1xuICAgICAgICBjYW52YXMuY2xpcFBhdGggPSBjbGlwQXJlYTtcbiAgICAgICAgdGhpcy5zZXR1cENhbnZhc0V2ZW50SGFuZGxlcnMoY2FudmFzLCBwcmludENvbmZpZyk7XG4gICAgfVxuICAgIHNldHVwQ2FudmFzRXZlbnRIYW5kbGVycyhjYW52YXMsIHByaW50Q29uZmlnKSB7XG4gICAgICAgIGNhbnZhcy5vbignbW91c2U6ZG93bicsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGJvcmRlciA9IHRoaXMuZ2V0T2JqZWN0KCdhcmVhOmJvcmRlcicsIGNhbnZhcyk7XG4gICAgICAgICAgICBpZiAoYm9yZGVyKSB7XG4gICAgICAgICAgICAgICAgYm9yZGVyLnNldCgnb3BhY2l0eScsIDAuOCk7XG4gICAgICAgICAgICAgICAgY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNhbnZhcy5vbignbW91c2U6dXAnLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBib3JkZXIgPSB0aGlzLmdldE9iamVjdCgnYXJlYTpib3JkZXInLCBjYW52YXMpO1xuICAgICAgICAgICAgaWYgKGJvcmRlcikge1xuICAgICAgICAgICAgICAgIGJvcmRlci5zZXQoJ29wYWNpdHknLCAwLjMpO1xuICAgICAgICAgICAgICAgIGNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjYW52YXMub24oJ29iamVjdDpyb3RhdGluZycsIChlKSA9PiB7XG4gICAgICAgICAgICBpZiAoZS50YXJnZXQ/LmFuZ2xlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhbmdsZXMgPSBbMCwgOTAsIDE4MCwgMjcwXTtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50QW5nbGUgPSBlLnRhcmdldC5hbmdsZSAlIDM2MDtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHNuYXBBbmdsZSBvZiBhbmdsZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGN1cnJlbnRBbmdsZSAtIHNuYXBBbmdsZSkgPCA1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnRhcmdldC5yb3RhdGUoc25hcEFuZ2xlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNhbnZhcy5vbignb2JqZWN0Om1vdmluZycsIChlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZU9iamVjdE1vdmluZyhlLCBjYW52YXMsIHByaW50Q29uZmlnKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNhbnZhcy5vbignb2JqZWN0Om1vZGlmaWVkJywgKGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlT2JqZWN0TW9kaWZpZWQoZSwgY2FudmFzLCBwcmludENvbmZpZyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBoYW5kbGVPYmplY3RNb3ZpbmcoZSwgY2FudmFzLCBwcmludENvbmZpZykge1xuICAgICAgICBpZiAoIWUudGFyZ2V0IHx8IGUudGFyZ2V0Lm5hbWUgPT09ICdhcmVhOmJvcmRlcicgfHwgZS50YXJnZXQubmFtZSA9PT0gJ2FyZWE6Y2xpcCcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsYXlvdXQgPSB0aGlzLmxheW91dHMuZmluZChsID0+IGwuaWQgPT09IGUudGFyZ2V0Lm5hbWUpO1xuICAgICAgICBpZiAoIWxheW91dClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgd2lkdGggPSBwcmludENvbmZpZy5zaXplLndpZHRoIC8gNjAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aDtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gcHJpbnRDb25maWcuc2l6ZS5oZWlnaHQgLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodDtcbiAgICAgICAgY29uc3QgbGVmdCA9IE1hdGgucm91bmQoKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGggLSB3aWR0aCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnggLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoKSk7XG4gICAgICAgIGNvbnN0IHRvcCA9IE1hdGgucm91bmQoKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0IC0gaGVpZ2h0KSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueSAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0KSk7XG4gICAgICAgIGNvbnN0IG9ialdpZHRoID0gZS50YXJnZXQud2lkdGggKiBlLnRhcmdldC5zY2FsZVg7XG4gICAgICAgIGNvbnN0IG9iakhlaWdodCA9IGUudGFyZ2V0LmhlaWdodCAqIGUudGFyZ2V0LnNjYWxlWTtcbiAgICAgICAgY29uc3Qgb2JqQ2VudGVyTGVmdCA9IGUudGFyZ2V0LmxlZnQgKyBvYmpXaWR0aCAvIDI7XG4gICAgICAgIGNvbnN0IG9iakNlbnRlclRvcCA9IGUudGFyZ2V0LnRvcCArIG9iakhlaWdodCAvIDI7XG4gICAgICAgIGNvbnN0IG5lYXJYID0gTWF0aC5hYnMob2JqQ2VudGVyTGVmdCAtIChsZWZ0ICsgd2lkdGggLyAyKSkgPCA3O1xuICAgICAgICBjb25zdCBuZWFyWSA9IE1hdGguYWJzKG9iakNlbnRlclRvcCAtICh0b3AgKyBoZWlnaHQgLyAyKSkgPCA3O1xuICAgICAgICBpZiAobmVhclgpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0d1aWRlbGluZShjYW52YXMsICd2ZXJ0aWNhbCcsIGxlZnQgKyB3aWR0aCAvIDIsIDAsIGxlZnQgKyB3aWR0aCAvIDIsIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgICAgIGUudGFyZ2V0LnNldCh7IGxlZnQ6IGxlZnQgKyB3aWR0aCAvIDIgLSBvYmpXaWR0aCAvIDIgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmhpZGVHdWlkZWxpbmUoY2FudmFzLCAndmVydGljYWwnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmVhclkpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0d1aWRlbGluZShjYW52YXMsICdob3Jpem9udGFsJywgMCwgdG9wICsgaGVpZ2h0IC8gMiwgdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCwgdG9wICsgaGVpZ2h0IC8gMik7XG4gICAgICAgICAgICBlLnRhcmdldC5zZXQoeyB0b3A6IHRvcCArIGhlaWdodCAvIDIgLSBvYmpIZWlnaHQgLyAyIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5oaWRlR3VpZGVsaW5lKGNhbnZhcywgJ2hvcml6b250YWwnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBoYW5kbGVPYmplY3RNb2RpZmllZChlLCBjYW52YXMsIHByaW50Q29uZmlnKSB7XG4gICAgICAgIGNvbnN0IG9iamVjdCA9IGUudGFyZ2V0O1xuICAgICAgICBpZiAoIW9iamVjdClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5oaWRlR3VpZGVsaW5lKGNhbnZhcywgJ3ZlcnRpY2FsJyk7XG4gICAgICAgIHRoaXMuaGlkZUd1aWRlbGluZShjYW52YXMsICdob3Jpem9udGFsJyk7XG4gICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0cy5maW5kKGwgPT4gbC5pZCA9PT0gb2JqZWN0Lm5hbWUpO1xuICAgICAgICBpZiAoIWxheW91dClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgd2lkdGggPSBwcmludENvbmZpZy5zaXplLndpZHRoIC8gNjAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aDtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gcHJpbnRDb25maWcuc2l6ZS5oZWlnaHQgLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodDtcbiAgICAgICAgY29uc3QgbGVmdCA9IE1hdGgucm91bmQoKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGggLSB3aWR0aCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnggLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoKSk7XG4gICAgICAgIGNvbnN0IHRvcCA9IE1hdGgucm91bmQoKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0IC0gaGVpZ2h0KSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueSAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0KSk7XG4gICAgICAgIGxheW91dC5wb3NpdGlvbi54ID0gKG9iamVjdC5sZWZ0IC0gbGVmdCkgLyB3aWR0aDtcbiAgICAgICAgbGF5b3V0LnBvc2l0aW9uLnkgPSAob2JqZWN0LnRvcCAtIHRvcCkgLyBoZWlnaHQ7XG4gICAgICAgIGxheW91dC5zaXplID0gb2JqZWN0LnNjYWxlWDtcbiAgICAgICAgbGF5b3V0LmFzcGVjdFJhdGlvID0gb2JqZWN0LnNjYWxlWSAvIG9iamVjdC5zY2FsZVg7XG4gICAgICAgIGxheW91dC5hbmdsZSA9IG9iamVjdC5hbmdsZTtcbiAgICAgICAgdGhpcy5zYXZlTGF5b3V0cygpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbbGF5ZXJzXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y8g0YHQu9C+0ZHQsjonLCBlcnIpKTtcbiAgICB9XG4gICAgc2hvd0d1aWRlbGluZShjYW52YXMsIHR5cGUsIHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBgZ3VpZGVsaW5lOiR7dHlwZX1gO1xuICAgICAgICBsZXQgZ3VpZGVsaW5lID0gdGhpcy5nZXRPYmplY3QobmFtZSwgY2FudmFzKTtcbiAgICAgICAgaWYgKCFndWlkZWxpbmUpIHtcbiAgICAgICAgICAgIGd1aWRlbGluZSA9IG5ldyBmYWJyaWMuTGluZShbeDEsIHkxLCB4MiwgeTJdLCB7XG4gICAgICAgICAgICAgICAgc3Ryb2tlOiAncmdiKDI1NCwgOTQsIDU4KScsXG4gICAgICAgICAgICAgICAgc3Ryb2tlV2lkdGg6IDIsXG4gICAgICAgICAgICAgICAgc3Ryb2tlRGFzaEFycmF5OiBbNSwgNV0sXG4gICAgICAgICAgICAgICAgc2VsZWN0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXZlbnRlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGd1aWRlbGluZSkge1xuICAgICAgICAgICAgICAgIGNhbnZhcy5hZGQoZ3VpZGVsaW5lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBoaWRlR3VpZGVsaW5lKGNhbnZhcywgdHlwZSkge1xuICAgICAgICBjb25zdCBndWlkZWxpbmUgPSB0aGlzLmdldE9iamVjdChgZ3VpZGVsaW5lOiR7dHlwZX1gLCBjYW52YXMpO1xuICAgICAgICBpZiAoZ3VpZGVsaW5lKSB7XG4gICAgICAgICAgICBjYW52YXMucmVtb3ZlKGd1aWRlbGluZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0T2JqZWN0KG5hbWUsIGNhbnZhcykge1xuICAgICAgICBjb25zdCB0YXJnZXRDYW52YXMgPSBjYW52YXMgfHwgdGhpcy5hY3RpdmVDYW52YXMgfHwgdGhpcy5jYW52YXNlc1swXTtcbiAgICAgICAgaWYgKCF0YXJnZXRDYW52YXMpXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gdGFyZ2V0Q2FudmFzLmdldE9iamVjdHMoKS5maW5kKG9iaiA9PiBvYmoubmFtZSA9PT0gbmFtZSk7XG4gICAgfVxuICAgIHNldEFjdGl2ZVNpZGUoc2lkZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbY2FudmFzXSDQo9GB0YLQsNC90L7QstC60LAg0LDQutGC0LjQstC90L7QuSDRgdGC0L7RgNC+0L3RizonLCBzaWRlKTtcbiAgICAgICAgdGhpcy5jYW52YXNlcy5mb3JFYWNoKGNhbnZhcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBjYW52YXNFbGVtZW50ID0gY2FudmFzLmdldEVsZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lckVsZW1lbnQgPSBjYW52YXNFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICBpZiAoY2FudmFzLnNpZGUgPT09IHNpZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNhbnZhcyA9IGNhbnZhcztcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhbnZhc0VsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FudmFzRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5sYXllcnNDYW52YXNlcy5mb3JFYWNoKGxheWVyc0NhbnZhcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBjYW52YXNFbGVtZW50ID0gbGF5ZXJzQ2FudmFzLmdldEVsZW1lbnQoKTtcbiAgICAgICAgICAgIGNhbnZhc0VsZW1lbnQuc3R5bGUuZGlzcGxheSA9IGxheWVyc0NhbnZhcy5zaWRlID09PSBzaWRlID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX3NlbGVjdFNpZGUgPSBzaWRlO1xuICAgIH1cbiAgICBhc3luYyBhZGRMYXlvdXRUb0NhbnZhcyhsYXlvdXQpIHtcbiAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNlcy5maW5kKGMgPT4gYy5zaWRlID09PSBsYXlvdXQudmlldyk7XG4gICAgICAgIGlmICghY2FudmFzKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtjYW52YXNdIGNhbnZhcyDQtNC70Y8gJHtsYXlvdXQudmlld30g0L3QtSDQvdCw0LnQtNC10L1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHByaW50Q29uZmlnID0gcHJvZHVjdC5wcmludENvbmZpZy5maW5kKHBjID0+IHBjLnNpZGUgPT09IGxheW91dC52aWV3KTtcbiAgICAgICAgaWYgKCFwcmludENvbmZpZylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgd2lkdGggPSBwcmludENvbmZpZy5zaXplLndpZHRoIC8gNjAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aDtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gcHJpbnRDb25maWcuc2l6ZS5oZWlnaHQgLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodDtcbiAgICAgICAgY29uc3QgbGVmdCA9IE1hdGgucm91bmQoKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGggLSB3aWR0aCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnggLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoKSk7XG4gICAgICAgIGNvbnN0IHRvcCA9IE1hdGgucm91bmQoKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0IC0gaGVpZ2h0KSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueSAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0KSk7XG4gICAgICAgIGNvbnN0IGFic29sdXRlTGVmdCA9IGxlZnQgKyAod2lkdGggKiBsYXlvdXQucG9zaXRpb24ueCk7XG4gICAgICAgIGNvbnN0IGFic29sdXRlVG9wID0gdG9wICsgKGhlaWdodCAqIGxheW91dC5wb3NpdGlvbi55KTtcbiAgICAgICAgaWYgKGxheW91dC5pc0ltYWdlTGF5b3V0KCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGltYWdlID0gbmV3IGZhYnJpYy5JbWFnZShhd2FpdCB0aGlzLmxvYWRJbWFnZShsYXlvdXQudXJsKSk7XG4gICAgICAgICAgICBpZiAobGF5b3V0LnNpemUgPT09IDEgJiYgaW1hZ2Uud2lkdGggPiB3aWR0aCkge1xuICAgICAgICAgICAgICAgIGxheW91dC5zaXplID0gd2lkdGggLyBpbWFnZS53aWR0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGltYWdlLnNldCh7XG4gICAgICAgICAgICAgICAgbGVmdDogYWJzb2x1dGVMZWZ0LFxuICAgICAgICAgICAgICAgIHRvcDogYWJzb2x1dGVUb3AsXG4gICAgICAgICAgICAgICAgbmFtZTogbGF5b3V0LmlkLFxuICAgICAgICAgICAgICAgIGxheW91dFVybDogbGF5b3V0LnVybCxcbiAgICAgICAgICAgICAgICBzY2FsZVg6IGxheW91dC5zaXplLFxuICAgICAgICAgICAgICAgIHNjYWxlWTogbGF5b3V0LnNpemUgKiBsYXlvdXQuYXNwZWN0UmF0aW8sXG4gICAgICAgICAgICAgICAgYW5nbGU6IGxheW91dC5hbmdsZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2FudmFzLmFkZChpbWFnZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobGF5b3V0LmlzVGV4dExheW91dCgpKSB7XG4gICAgICAgICAgICBjb25zdCB0ZXh0ID0gbmV3IGZhYnJpYy5UZXh0KGxheW91dC50ZXh0LCB7XG4gICAgICAgICAgICAgICAgZm9udEZhbWlseTogbGF5b3V0LmZvbnQuZmFtaWx5LFxuICAgICAgICAgICAgICAgIGZvbnRTaXplOiBsYXlvdXQuZm9udC5zaXplLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0ZXh0LnNldCh7XG4gICAgICAgICAgICAgICAgdG9wOiBhYnNvbHV0ZVRvcCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBhYnNvbHV0ZUxlZnQsXG4gICAgICAgICAgICAgICAgbmFtZTogbGF5b3V0LmlkLFxuICAgICAgICAgICAgICAgIHNjYWxlWDogbGF5b3V0LnNpemUsXG4gICAgICAgICAgICAgICAgc2NhbGVZOiBsYXlvdXQuc2l6ZSAqIGxheW91dC5hc3BlY3RSYXRpbyxcbiAgICAgICAgICAgICAgICBhbmdsZTogbGF5b3V0LmFuZ2xlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjYW52YXMuYWRkKHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZUxheW91dHMoKSB7XG4gICAgICAgIGlmICghdGhpcy5hY3RpdmVDYW52YXMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0c0ZvclNpZGUodGhpcy5fc2VsZWN0U2lkZSk7XG4gICAgfVxuICAgIHVwZGF0ZUxheW91dHNGb3JTaWRlKHNpZGUpIHtcbiAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNlcy5maW5kKGMgPT4gYy5zaWRlID09PSBzaWRlKTtcbiAgICAgICAgaWYgKCFjYW52YXMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IG9iamVjdHMgPSBjYW52YXMuZ2V0T2JqZWN0cygpO1xuICAgICAgICBjb25zdCBvYmplY3RzVG9SZW1vdmUgPSBvYmplY3RzXG4gICAgICAgICAgICAuZmlsdGVyKG9iaiA9PiBvYmoubmFtZSAhPT0gJ2FyZWE6Ym9yZGVyJyAmJiBvYmoubmFtZSAhPT0gJ2FyZWE6Y2xpcCcgJiYgIW9iai5uYW1lPy5zdGFydHNXaXRoKCdndWlkZWxpbmUnKSlcbiAgICAgICAgICAgIC5maWx0ZXIob2JqID0+ICF0aGlzLmxheW91dHMuZmluZChsYXlvdXQgPT4gbGF5b3V0LmlkID09PSBvYmoubmFtZSkpO1xuICAgICAgICBvYmplY3RzVG9SZW1vdmUuZm9yRWFjaChvYmogPT4ge1xuICAgICAgICAgICAgY2FudmFzLnJlbW92ZShvYmopO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgbGF5b3V0c0ZvclNpZGUgPSB0aGlzLmxheW91dHMuZmlsdGVyKGxheW91dCA9PiBsYXlvdXQudmlldyA9PT0gc2lkZSk7XG4gICAgICAgIGNvbnN0IG9iamVjdHNUb1VwZGF0ZSA9IFtdO1xuICAgICAgICBjb25zdCBvYmplY3RzVG9BZGQgPSBbXTtcbiAgICAgICAgbGF5b3V0c0ZvclNpZGUuZm9yRWFjaChsYXlvdXQgPT4ge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdPYmogPSBvYmplY3RzLmZpbmQob2JqID0+IG9iai5uYW1lID09PSBsYXlvdXQuaWQpO1xuICAgICAgICAgICAgaWYgKGV4aXN0aW5nT2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxheW91dC5pc0ltYWdlTGF5b3V0KCkgJiYgZXhpc3RpbmdPYmoubGF5b3V0VXJsICE9PSBsYXlvdXQudXJsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtjYW52YXNdIExheW91dCAke2xheW91dC5pZH0g0LjQt9C80LXQvdC40LvRgdGPLCDRgtGA0LXQsdGD0LXRgtGB0Y8g0L7QsdC90L7QstC70LXQvdC40LVgKTtcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0c1RvVXBkYXRlLnB1c2gobGF5b3V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBvYmplY3RzVG9BZGQucHVzaChsYXlvdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgb2JqZWN0c1RvVXBkYXRlLmZvckVhY2gobGF5b3V0ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nT2JqID0gb2JqZWN0cy5maW5kKG9iaiA9PiBvYmoubmFtZSA9PT0gbGF5b3V0LmlkKTtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ09iaikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtjYW52YXNdINCj0LTQsNC70Y/QtdC8INGB0YLQsNGA0YvQuSDQvtCx0YrQtdC60YIg0LTQu9GPINC+0LHQvdC+0LLQu9C10L3QuNGPOiAke2xheW91dC5pZH1gKTtcbiAgICAgICAgICAgICAgICBjYW52YXMucmVtb3ZlKGV4aXN0aW5nT2JqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtjYW52YXNdINCU0L7QsdCw0LLQu9GP0LXQvCDQvtCx0L3QvtCy0LvQtdC90L3Ri9C5INC+0LHRitC10LrRgjogJHtsYXlvdXQuaWR9YCk7XG4gICAgICAgICAgICB0aGlzLmFkZExheW91dFRvQ2FudmFzKGxheW91dCk7XG4gICAgICAgIH0pO1xuICAgICAgICBvYmplY3RzVG9BZGQuZm9yRWFjaChsYXlvdXQgPT4ge1xuICAgICAgICAgICAgdGhpcy5hZGRMYXlvdXRUb0NhbnZhcyhsYXlvdXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLnJlbmRlckFsbCgpO1xuICAgIH1cbiAgICBhc3luYyBwcmVsb2FkQWxsTW9ja3VwcygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3ByZWxvYWRdINCd0LDRh9Cw0LvQviDQv9GA0LXQtNC30LDQs9GA0YPQt9C60LggbW9ja3VwcycpO1xuICAgICAgICBmb3IgKGNvbnN0IHByb2R1Y3Qgb2YgdGhpcy5wcm9kdWN0Q29uZmlncykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtb2NrdXAgb2YgcHJvZHVjdC5tb2NrdXBzKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9ja3VwRGF0YVVybCA9IGF3YWl0IHRoaXMuZ2V0SW1hZ2VEYXRhKG1vY2t1cC51cmwpO1xuICAgICAgICAgICAgICAgICAgICBtb2NrdXAudXJsID0gbW9ja3VwRGF0YVVybDtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3ByZWxvYWRdIE1vY2t1cCDQt9Cw0LPRgNGD0LbQtdC9OiAke21vY2t1cC5jb2xvci5uYW1lfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW3ByZWxvYWRdINCe0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4IG1vY2t1cCAke21vY2t1cC51cmx9OmAsIGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3ByZWxvYWRdINCf0YDQtdC00LfQsNCz0YDRg9C30LrQsCDQt9Cw0LLQtdGA0YjQtdC90LAnKTtcbiAgICB9XG4gICAgYXN5bmMgZ2V0SW1hZ2VEYXRhKHVybCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2FkQW5kQ29udmVydEltYWdlKHVybCk7XG4gICAgfVxuICAgIGFzeW5jIHVwbG9hZEltYWdlKGZpbGUpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZF0g0JfQsNCz0YDRg9C30LrQsCDRhNCw0LnQu9CwOicsIGZpbGUubmFtZSk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGFzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YVVybCA9IGUudGFyZ2V0Py5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZERhdGFVcmwgPSBhd2FpdCB0aGlzLmdldEltYWdlRGF0YShkYXRhVXJsKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZF0g0KTQsNC50Lsg0YPRgdC/0LXRiNC90L4g0LfQsNCz0YDRg9C20LXQvScpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGNvbnZlcnRlZERhdGFVcmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3VwbG9hZF0g0J7RiNC40LHQutCwINC+0LHRgNCw0LHQvtGC0LrQuCDRhNCw0LnQu9CwOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3VwbG9hZF0g0J7RiNC40LHQutCwINGH0YLQtdC90LjRjyDRhNCw0LnQu9CwJyk7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcign0J3QtSDRg9C00LDQu9C+0YHRjCDQv9GA0L7Rh9C40YLQsNGC0Ywg0YTQsNC50LsnKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyB1cGxvYWRJbWFnZVRvU2VydmVyKGJhc2U2NCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkXSDQl9Cw0LPRgNGD0LfQutCwINC40LfQvtCx0YDQsNC20LXQvdC40Y8g0L3QsCDRgdC10YDQstC10YAnKTtcbiAgICAgICAgY29uc3QgdXNlcklkID0gYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci5nZXRVc2VySWQoKTtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh0aGlzLmFwaUNvbmZpZy51cGxvYWRJbWFnZSwge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGltYWdlOiBiYXNlNjQsIHVzZXJfaWQ6IHVzZXJJZCB9KSxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZF0g0JjQt9C+0LHRgNCw0LbQtdC90LjQtSDQt9Cw0LPRgNGD0LbQtdC90L4g0L3QsCDRgdC10YDQstC10YA6JywgZGF0YS5pbWFnZV91cmwpO1xuICAgICAgICByZXR1cm4gZGF0YS5pbWFnZV91cmw7XG4gICAgfVxuICAgIGdldFByb2R1Y3ROYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpPy5wcm9kdWN0TmFtZSB8fCAnJztcbiAgICB9XG4gICAgY2FwaXRhbGl6ZUZpcnN0TGV0dGVyKHN0cmluZykge1xuICAgICAgICByZXR1cm4gc3RyaW5nLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyaW5nLnNsaWNlKDEpO1xuICAgIH1cbiAgICBnZXRNb2NrdXBVcmwoc2lkZSkge1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgY29uc3QgbW9ja3VwID0gcHJvZHVjdC5tb2NrdXBzLmZpbmQobW9ja3VwID0+IG1vY2t1cC5zaWRlID09PSBzaWRlICYmIG1vY2t1cC5jb2xvci5uYW1lID09PSB0aGlzLl9zZWxlY3RDb2xvci5uYW1lKTtcbiAgICAgICAgcmV0dXJuIG1vY2t1cCA/IG1vY2t1cC51cmwgOiBudWxsO1xuICAgIH1cbiAgICBhc3luYyBleHBvcnRBcnQod2l0aE1vY2t1cCA9IHRydWUsIHJlc29sdXRpb24gPSAxMDI0KSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICBjb25zdCBzaWRlc1dpdGhMYXllcnMgPSB0aGlzLmdldFNpZGVzV2l0aExheWVycygpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZXhwb3J0XSDQndCw0LnQtNC10L3RiyDRgdGC0L7RgNC+0L3RiyDRgSDRgdC70L7Rj9C80Lg6Jywgc2lkZXNXaXRoTGF5ZXJzLCAnKGZyb250INC/0LXRgNCy0YvQuSknLCB3aXRoTW9ja3VwID8gJ9GBINC80L7QutCw0L/QvtC8JyA6ICfQsdC10Lcg0LzQvtC60LDQv9CwJywgYNGA0LDQt9GA0LXRiNC10L3QuNC1OiAke3Jlc29sdXRpb259cHhgKTtcbiAgICAgICAgY29uc3QgZXhwb3J0UHJvbWlzZXMgPSBzaWRlc1dpdGhMYXllcnMubWFwKGFzeW5jIChzaWRlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4cG9ydGVkU2lkZSA9IGF3YWl0IHRoaXMuZXhwb3J0U2lkZShzaWRlLCB3aXRoTW9ja3VwLCByZXNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAoZXhwb3J0ZWRTaWRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCh0YLQvtGA0L7QvdCwICR7c2lkZX0g0YPRgdC/0LXRiNC90L4g0Y3QutGB0L/QvtGA0YLQuNGA0L7QstCw0L3QsGApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBzaWRlLCBkYXRhOiBleHBvcnRlZFNpZGUgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbZXhwb3J0XSDQntGI0LjQsdC60LAg0L/RgNC4INGN0LrRgdC/0L7RgNGC0LUg0YHRgtC+0YDQvtC90YsgJHtzaWRlfTpgLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGV4cG9ydGVkU2lkZXMgPSBhd2FpdCBQcm9taXNlLmFsbChleHBvcnRQcm9taXNlcyk7XG4gICAgICAgIGV4cG9ydGVkU2lkZXMuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W2l0ZW0uc2lkZV0gPSBpdGVtLmRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQrdC60YHQv9C+0YDRgiDQt9Cw0LLQtdGA0YjQtdC9INC00LvRjyAke09iamVjdC5rZXlzKHJlc3VsdCkubGVuZ3RofSDRgdGC0L7RgNC+0L1gKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgZ2V0U2lkZXNXaXRoTGF5ZXJzKCkge1xuICAgICAgICBjb25zdCBhbGxTaWRlc1dpdGhMYXllcnMgPSBbLi4ubmV3IFNldCh0aGlzLmxheW91dHMubWFwKGxheW91dCA9PiBsYXlvdXQudmlldykpXTtcbiAgICAgICAgcmV0dXJuIGFsbFNpZGVzV2l0aExheWVycy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICBpZiAoYSA9PT0gJ2Zyb250JylcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICBpZiAoYiA9PT0gJ2Zyb250JylcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgZXhwb3J0U2lkZShzaWRlLCB3aXRoTW9ja3VwID0gdHJ1ZSwgcmVzb2x1dGlvbiA9IDEwMjQpIHtcbiAgICAgICAgY29uc3QgY2FudmFzZXMgPSB0aGlzLmdldENhbnZhc2VzRm9yU2lkZShzaWRlKTtcbiAgICAgICAgaWYgKCFjYW52YXNlcy5lZGl0YWJsZUNhbnZhcykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZXhwb3J0XSBDYW52YXMg0LTQu9GPINGB0YLQvtGA0L7QvdGLICR7c2lkZX0g0L3QtSDQvdCw0LnQtNC10L1gKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0c0ZvclNpZGUoc2lkZSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCt0LrRgdC/0L7RgNGC0LjRgNGD0LXQvCDRgdGC0L7RgNC+0L3RgyAke3NpZGV9JHt3aXRoTW9ja3VwID8gJyDRgSDQvNC+0LrQsNC/0L7QvCcgOiAnINCx0LXQtyDQvNC+0LrQsNC/0LAnfSAoJHtyZXNvbHV0aW9ufXB4KS4uLmApO1xuICAgICAgICBpZiAoIXdpdGhNb2NrdXApIHtcbiAgICAgICAgICAgIGNvbnN0IGNyb3BwZWRDYW52YXMgPSBhd2FpdCB0aGlzLmV4cG9ydERlc2lnbldpdGhDbGlwUGF0aChjYW52YXNlcy5lZGl0YWJsZUNhbnZhcywgY2FudmFzZXMubGF5ZXJzQ2FudmFzLCBzaWRlLCByZXNvbHV0aW9uKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCt0LrRgdC/0L7RgNGC0LjRgNC+0LLQsNC9INGH0LjRgdGC0YvQuSDQtNC40LfQsNC50L0g0LTQu9GPICR7c2lkZX0gKNC+0LHRgNC10LfQsNC9INC/0L4gY2xpcFBhdGgpYCk7XG4gICAgICAgICAgICByZXR1cm4gY3JvcHBlZENhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycsIDEuMCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbW9ja3VwSW1nID0gYXdhaXQgdGhpcy5sb2FkTW9ja3VwRm9yU2lkZShzaWRlKTtcbiAgICAgICAgaWYgKCFtb2NrdXBJbWcpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgY29uc3QgeyBjYW52YXM6IHRlbXBDYW52YXMsIGN0eCwgbW9ja3VwRGltZW5zaW9ucyB9ID0gdGhpcy5jcmVhdGVFeHBvcnRDYW52YXMocmVzb2x1dGlvbiwgbW9ja3VwSW1nKTtcbiAgICAgICAgY29uc3QgZGVzaWduQ2FudmFzID0gYXdhaXQgdGhpcy5jcmVhdGVEZXNpZ25DYW52YXMoY2FudmFzZXMuZWRpdGFibGVDYW52YXMsIGNhbnZhc2VzLmxheWVyc0NhbnZhcywgc2lkZSk7XG4gICAgICAgIGN0eC5kcmF3SW1hZ2UoZGVzaWduQ2FudmFzLCAwLCAwLCBkZXNpZ25DYW52YXMud2lkdGgsIGRlc2lnbkNhbnZhcy5oZWlnaHQsIG1vY2t1cERpbWVuc2lvbnMueCwgbW9ja3VwRGltZW5zaW9ucy55LCBtb2NrdXBEaW1lbnNpb25zLndpZHRoLCBtb2NrdXBEaW1lbnNpb25zLmhlaWdodCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCd0LDQu9C+0LbQtdC9INC00LjQt9Cw0LnQvSDQvdCwINC80L7QutCw0L8g0LTQu9GPICR7c2lkZX1gKTtcbiAgICAgICAgcmV0dXJuIHRlbXBDYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnLCAxLjApO1xuICAgIH1cbiAgICBnZXRDYW52YXNlc0ZvclNpZGUoc2lkZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZWRpdGFibGVDYW52YXM6IHRoaXMuY2FudmFzZXMuZmluZChjID0+IGMuc2lkZSA9PT0gc2lkZSksXG4gICAgICAgICAgICBsYXllcnNDYW52YXM6IHRoaXMubGF5ZXJzQ2FudmFzZXMuZmluZChjID0+IGMuc2lkZSA9PT0gc2lkZSlcbiAgICAgICAgfTtcbiAgICB9XG4gICAgYXN5bmMgbG9hZE1vY2t1cEZvclNpZGUoc2lkZSkge1xuICAgICAgICBjb25zdCBtb2NrdXBVcmwgPSB0aGlzLmdldE1vY2t1cFVybChzaWRlKTtcbiAgICAgICAgaWYgKCFtb2NrdXBVcmwpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2V4cG9ydF0g0JzQvtC60LDQvyDQtNC70Y8g0YHRgtC+0YDQvtC90YsgJHtzaWRlfSDQvdC1INC90LDQudC00LXQvWApO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbW9ja3VwSW1nID0gYXdhaXQgdGhpcy5sb2FkSW1hZ2UobW9ja3VwVXJsKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0JfQsNCz0YDRg9C20LXQvSDQvNC+0LrQsNC/INC00LvRjyAke3NpZGV9OiAke21vY2t1cFVybH1gKTtcbiAgICAgICAgcmV0dXJuIG1vY2t1cEltZztcbiAgICB9XG4gICAgY3JlYXRlRXhwb3J0Q2FudmFzKGV4cG9ydFNpemUsIG1vY2t1cEltZykge1xuICAgICAgICBjb25zdCB0ZW1wQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGNvbnN0IGN0eCA9IHRlbXBDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgdGVtcENhbnZhcy53aWR0aCA9IGV4cG9ydFNpemU7XG4gICAgICAgIHRlbXBDYW52YXMuaGVpZ2h0ID0gZXhwb3J0U2l6ZTtcbiAgICAgICAgY29uc3QgbW9ja3VwU2NhbGUgPSBNYXRoLm1pbihleHBvcnRTaXplIC8gbW9ja3VwSW1nLndpZHRoLCBleHBvcnRTaXplIC8gbW9ja3VwSW1nLmhlaWdodCk7XG4gICAgICAgIGNvbnN0IHNjYWxlZE1vY2t1cFdpZHRoID0gbW9ja3VwSW1nLndpZHRoICogbW9ja3VwU2NhbGU7XG4gICAgICAgIGNvbnN0IHNjYWxlZE1vY2t1cEhlaWdodCA9IG1vY2t1cEltZy5oZWlnaHQgKiBtb2NrdXBTY2FsZTtcbiAgICAgICAgY29uc3QgbW9ja3VwWCA9IChleHBvcnRTaXplIC0gc2NhbGVkTW9ja3VwV2lkdGgpIC8gMjtcbiAgICAgICAgY29uc3QgbW9ja3VwWSA9IChleHBvcnRTaXplIC0gc2NhbGVkTW9ja3VwSGVpZ2h0KSAvIDI7XG4gICAgICAgIGN0eC5kcmF3SW1hZ2UobW9ja3VwSW1nLCBtb2NrdXBYLCBtb2NrdXBZLCBzY2FsZWRNb2NrdXBXaWR0aCwgc2NhbGVkTW9ja3VwSGVpZ2h0KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0J3QsNGA0LjRgdC+0LLQsNC9INC80L7QutCw0L8g0LrQsNC6INGE0L7QvSAoJHtzY2FsZWRNb2NrdXBXaWR0aH14JHtzY2FsZWRNb2NrdXBIZWlnaHR9KWApO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY2FudmFzOiB0ZW1wQ2FudmFzLFxuICAgICAgICAgICAgY3R4LFxuICAgICAgICAgICAgbW9ja3VwRGltZW5zaW9uczoge1xuICAgICAgICAgICAgICAgIHg6IG1vY2t1cFgsXG4gICAgICAgICAgICAgICAgeTogbW9ja3VwWSxcbiAgICAgICAgICAgICAgICB3aWR0aDogc2NhbGVkTW9ja3VwV2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBzY2FsZWRNb2NrdXBIZWlnaHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgYXN5bmMgY3JlYXRlRGVzaWduQ2FudmFzKGVkaXRhYmxlQ2FudmFzLCBsYXllcnNDYW52YXMsIHNpZGUpIHtcbiAgICAgICAgY29uc3QgcXVhbGl0eU11bHRpcGxpZXIgPSAxMDtcbiAgICAgICAgY29uc3QgYmFzZVdpZHRoID0gZWRpdGFibGVDYW52YXMuZ2V0V2lkdGgoKTtcbiAgICAgICAgY29uc3QgYmFzZUhlaWdodCA9IGVkaXRhYmxlQ2FudmFzLmdldEhlaWdodCgpO1xuICAgICAgICBjb25zdCBkZXNpZ25DYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgY29uc3QgZGVzaWduQ3R4ID0gZGVzaWduQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIGRlc2lnbkNhbnZhcy53aWR0aCA9IGJhc2VXaWR0aCAqIHF1YWxpdHlNdWx0aXBsaWVyO1xuICAgICAgICBkZXNpZ25DYW52YXMuaGVpZ2h0ID0gYmFzZUhlaWdodCAqIHF1YWxpdHlNdWx0aXBsaWVyO1xuICAgICAgICBhd2FpdCB0aGlzLmFkZFN0YXRpY0xheWVyc1RvQ2FudmFzKGxheWVyc0NhbnZhcywgZGVzaWduQ3R4LCBkZXNpZ25DYW52YXMsIHNpZGUpO1xuICAgICAgICBhd2FpdCB0aGlzLmFkZEVkaXRhYmxlT2JqZWN0c1RvQ2FudmFzKGVkaXRhYmxlQ2FudmFzLCBkZXNpZ25DdHgsIGRlc2lnbkNhbnZhcywgYmFzZVdpZHRoLCBiYXNlSGVpZ2h0LCBzaWRlKTtcbiAgICAgICAgcmV0dXJuIGRlc2lnbkNhbnZhcztcbiAgICB9XG4gICAgYXN5bmMgYWRkU3RhdGljTGF5ZXJzVG9DYW52YXMobGF5ZXJzQ2FudmFzLCBjdHgsIGNhbnZhcywgc2lkZSkge1xuICAgICAgICBpZiAoIWxheWVyc0NhbnZhcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGxheWVyc0RhdGFVcmwgPSBsYXllcnNDYW52YXMudG9EYXRhVVJMKHtcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdwbmcnLFxuICAgICAgICAgICAgICAgIG11bHRpcGxpZXI6IDEwLFxuICAgICAgICAgICAgICAgIHF1YWxpdHk6IDEuMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBlbXB0eURhdGFVcmwgPSAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBRUFBQUFCQ0FZQUFBQWZGY1NKQUFBQURVbEVRVlI0Mm1Oa1lQaGZEd0FDaHdHQTYwZTZrZ0FBQUFCSlJVNUVya0pnZ2c9PSc7XG4gICAgICAgICAgICBpZiAobGF5ZXJzRGF0YVVybCAhPT0gZW1wdHlEYXRhVXJsICYmIGxheWVyc0RhdGFVcmwubGVuZ3RoID4gZW1wdHlEYXRhVXJsLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxheWVyc0ltZyA9IGF3YWl0IHRoaXMubG9hZEltYWdlKGxheWVyc0RhdGFVcmwpO1xuICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UobGF5ZXJzSW1nLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCU0L7QsdCw0LLQu9C10L3RiyDRgdGC0LDRgtC40YfQtdGB0LrQuNC1INGB0LvQvtC4INC00LvRjyAke3NpZGV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtleHBvcnRdINCe0YjQuNCx0LrQsCDRjdC60YHQv9C+0YDRgtCwINGB0YLQsNGC0LjRh9C10YHQutC40YUg0YHQu9C+0LXQsiDQtNC70Y8gJHtzaWRlfTpgLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgYWRkRWRpdGFibGVPYmplY3RzVG9DYW52YXMoZWRpdGFibGVDYW52YXMsIGN0eCwgY2FudmFzLCBiYXNlV2lkdGgsIGJhc2VIZWlnaHQsIHNpZGUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHRlbXBFZGl0YWJsZUNhbnZhcyA9IG5ldyBmYWJyaWMuU3RhdGljQ2FudmFzKG51bGwsIHtcbiAgICAgICAgICAgICAgICB3aWR0aDogYmFzZVdpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogYmFzZUhlaWdodCxcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd0cmFuc3BhcmVudCdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGVkaXRhYmxlQ2FudmFzLmNsaXBQYXRoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2xvbmVkQ2xpcCA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRhYmxlQ2FudmFzLmNsaXBQYXRoLmNsb25lKChjbG9uZWQpID0+IHJlc29sdmUoY2xvbmVkKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGVtcEVkaXRhYmxlQ2FudmFzLmNsaXBQYXRoID0gY2xvbmVkQ2xpcDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQn9GA0LjQvNC10L3RkdC9IGNsaXBQYXRoINC00LvRjyDRjdC60YHQv9C+0YDRgtCwINGB0YLQvtGA0L7QvdGLICR7c2lkZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRlc2lnbk9iamVjdHMgPSB0aGlzLmZpbHRlckRlc2lnbk9iamVjdHMoZWRpdGFibGVDYW52YXMuZ2V0T2JqZWN0cygpKTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qgb2JqIG9mIGRlc2lnbk9iamVjdHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjbG9uZWRPYmogPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBvYmouY2xvbmUoKGNsb25lZCkgPT4gcmVzb2x2ZShjbG9uZWQpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0ZW1wRWRpdGFibGVDYW52YXMuYWRkKGNsb25lZE9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkZXNpZ25EYXRhVXJsID0gdGVtcEVkaXRhYmxlQ2FudmFzLnRvRGF0YVVSTCh7XG4gICAgICAgICAgICAgICAgZm9ybWF0OiAncG5nJyxcbiAgICAgICAgICAgICAgICBtdWx0aXBsaWVyOiAxMCxcbiAgICAgICAgICAgICAgICBxdWFsaXR5OiAxLjBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgZW1wdHlEYXRhVXJsID0gJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQUVBQUFBQkNBWUFBQUFmRmNTSkFBQUFEVWxFUVZSNDJtTmtZUGhmRHdBQ2h3R0E2MGU2a2dBQUFBQkpSVTVFcmtKZ2dnPT0nO1xuICAgICAgICAgICAgaWYgKGRlc2lnbkRhdGFVcmwgIT09IGVtcHR5RGF0YVVybCAmJiBkZXNpZ25EYXRhVXJsLmxlbmd0aCA+IGVtcHR5RGF0YVVybC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkZXNpZ25JbWcgPSBhd2FpdCB0aGlzLmxvYWRJbWFnZShkZXNpZ25EYXRhVXJsKTtcbiAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKGRlc2lnbkltZywgMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQlNC+0LHQsNCy0LvQtdC90Ysg0L7QsdGK0LXQutGC0Ysg0LTQuNC30LDQudC90LAg0LHQtdC3INCz0YDQsNC90LjRhiDQtNC70Y8gJHtzaWRlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGVtcEVkaXRhYmxlQ2FudmFzLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2V4cG9ydF0g0J7RiNC40LHQutCwINGB0L7Qt9C00LDQvdC40Y8g0LTQuNC30LDQudC90LAg0LHQtdC3INCz0YDQsNC90LjRhiDQtNC70Y8gJHtzaWRlfTpgLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZmlsdGVyRGVzaWduT2JqZWN0cyhhbGxPYmplY3RzKSB7XG4gICAgICAgIGNvbnN0IHNlcnZpY2VPYmplY3ROYW1lcyA9IG5ldyBTZXQoW1xuICAgICAgICAgICAgXCJhcmVhOmJvcmRlclwiLFxuICAgICAgICAgICAgXCJhcmVhOmNsaXBcIixcbiAgICAgICAgICAgIFwiZ3VpZGVsaW5lXCIsXG4gICAgICAgICAgICBcImd1aWRlbGluZTp2ZXJ0aWNhbFwiLFxuICAgICAgICAgICAgXCJndWlkZWxpbmU6aG9yaXpvbnRhbFwiXG4gICAgICAgIF0pO1xuICAgICAgICByZXR1cm4gYWxsT2JqZWN0cy5maWx0ZXIoKG9iaikgPT4gIXNlcnZpY2VPYmplY3ROYW1lcy5oYXMob2JqLm5hbWUpKTtcbiAgICB9XG4gICAgYXN5bmMgZXhwb3J0RGVzaWduV2l0aENsaXBQYXRoKGVkaXRhYmxlQ2FudmFzLCBsYXllcnNDYW52YXMsIHNpZGUsIHJlc29sdXRpb24pIHtcbiAgICAgICAgY29uc3QgcXVhbGl0eU11bHRpcGxpZXIgPSAxMDtcbiAgICAgICAgY29uc3QgY2xpcFBhdGggPSBlZGl0YWJsZUNhbnZhcy5jbGlwUGF0aDtcbiAgICAgICAgaWYgKCFjbGlwUGF0aCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZXhwb3J0XSBjbGlwUGF0aCDQvdC1INC90LDQudC00LXQvSwg0Y3QutGB0L/QvtGA0YLQuNGA0YPQtdC8INCy0LXRgdGMIGNhbnZhcycpO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlRGVzaWduQ2FudmFzKGVkaXRhYmxlQ2FudmFzLCBsYXllcnNDYW52YXMsIHNpZGUpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNsaXBXaWR0aCA9IGNsaXBQYXRoLndpZHRoO1xuICAgICAgICBjb25zdCBjbGlwSGVpZ2h0ID0gY2xpcFBhdGguaGVpZ2h0O1xuICAgICAgICBjb25zdCBjbGlwTGVmdCA9IGNsaXBQYXRoLmxlZnQ7XG4gICAgICAgIGNvbnN0IGNsaXBUb3AgPSBjbGlwUGF0aC50b3A7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdIGNsaXBQYXRoOiAke2NsaXBXaWR0aH14JHtjbGlwSGVpZ2h0fSBhdCAoJHtjbGlwTGVmdH0sICR7Y2xpcFRvcH0pYCk7XG4gICAgICAgIGNvbnN0IGZ1bGxEZXNpZ25DYW52YXMgPSBhd2FpdCB0aGlzLmNyZWF0ZURlc2lnbkNhbnZhcyhlZGl0YWJsZUNhbnZhcywgbGF5ZXJzQ2FudmFzLCBzaWRlKTtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSByZXNvbHV0aW9uIC8gTWF0aC5tYXgoY2xpcFdpZHRoLCBjbGlwSGVpZ2h0KTtcbiAgICAgICAgY29uc3QgY3JvcHBlZENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBjcm9wcGVkQ2FudmFzLndpZHRoID0gY2xpcFdpZHRoICogc2NhbGU7XG4gICAgICAgIGNyb3BwZWRDYW52YXMuaGVpZ2h0ID0gY2xpcEhlaWdodCAqIHNjYWxlO1xuICAgICAgICBjb25zdCBjdHggPSBjcm9wcGVkQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIGNvbnN0IHNvdXJjZVNjYWxlID0gcXVhbGl0eU11bHRpcGxpZXI7XG4gICAgICAgIGN0eC5kcmF3SW1hZ2UoZnVsbERlc2lnbkNhbnZhcywgY2xpcExlZnQgKiBzb3VyY2VTY2FsZSwgY2xpcFRvcCAqIHNvdXJjZVNjYWxlLCBjbGlwV2lkdGggKiBzb3VyY2VTY2FsZSwgY2xpcEhlaWdodCAqIHNvdXJjZVNjYWxlLCAwLCAwLCBjcm9wcGVkQ2FudmFzLndpZHRoLCBjcm9wcGVkQ2FudmFzLmhlaWdodCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCU0LjQt9Cw0LnQvSDQvtCx0YDQtdC30LDQvSDQv9C+IGNsaXBQYXRoOiAke2Nyb3BwZWRDYW52YXMud2lkdGh9eCR7Y3JvcHBlZENhbnZhcy5oZWlnaHR9cHhgKTtcbiAgICAgICAgcmV0dXJuIGNyb3BwZWRDYW52YXM7XG4gICAgfVxuICAgIGFzeW5jIHVwbG9hZERlc2lnblRvU2VydmVyKGRlc2lnbnMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tleHBvcnRdINCX0LDQs9GA0YPQt9C60LAg0LTQuNC30LDQudC90LAg0L3QsCDRgdC10YDQstC10YAnKTtcbiAgICAgICAgICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtzaWRlLCBkYXRhVXJsXSBvZiBPYmplY3QuZW50cmllcyhkZXNpZ25zKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZGF0YVVybCk7XG4gICAgICAgICAgICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IHJlc3BvbnNlLmJsb2IoKTtcbiAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoc2lkZSwgYmxvYiwgYCR7c2lkZX0ucG5nYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tleHBvcnRdINCX0LDQs9GA0YPQt9C60LAg0L3QsCDRgdC10YDQstC10YAg0L3QtSDRgNC10LDQu9C40LfQvtCy0LDQvdCwJyk7XG4gICAgICAgICAgICByZXR1cm4gZGVzaWducztcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tleHBvcnRdINCe0YjQuNCx0LrQsCDQv9GA0Lgg0LfQsNCz0YDRg9C30LrQtSDQvdCwINGB0LXRgNCy0LXRgDonLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzYXZlTGF5ZXJzVG9IaXN0b3J5KCkge1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50SGlzdG9yeUluZGV4IDwgdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzSGlzdG9yeSA9IHRoaXMubGF5ZXJzSGlzdG9yeS5zbGljZSgwLCB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggKyAxKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsYXllcnNDb3B5ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0aGlzLmxheW91dHMpKTtcbiAgICAgICAgY29uc3QgaGlzdG9yeUl0ZW0gPSB7XG4gICAgICAgICAgICBsYXllcnM6IGxheWVyc0NvcHkubWFwKChkYXRhKSA9PiBuZXcgTGF5b3V0KGRhdGEpKSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmxheWVyc0hpc3RvcnkucHVzaChoaXN0b3J5SXRlbSk7XG4gICAgICAgIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA9IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxO1xuICAgICAgICBjb25zdCBNQVhfSElTVE9SWV9TSVpFID0gNTA7XG4gICAgICAgIGlmICh0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoID4gTUFYX0hJU1RPUllfU0laRSkge1xuICAgICAgICAgICAgdGhpcy5sYXllcnNIaXN0b3J5LnNoaWZ0KCk7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXgtLTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKGBbaGlzdG9yeV0g0KHQvtGF0YDQsNC90LXQvdC+INGB0L7RgdGC0L7Rj9C90LjQtSDRgdC70L7RkdCyLiDQmNC90LTQtdC60YE6ICR7dGhpcy5jdXJyZW50SGlzdG9yeUluZGV4fSwg0JLRgdC10LPQvjogJHt0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RofSwg0KHQu9C+0ZHQsjogJHt0aGlzLmxheW91dHMubGVuZ3RofWApO1xuICAgICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKTtcbiAgICB9XG4gICAgY2FuVW5kbygpIHtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA9PT0gdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoID49IDI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID4gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYW5SZWRvKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4IDwgdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDE7XG4gICAgfVxuICAgIHVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKSB7XG4gICAgICAgIGNvbnN0IGNhblVuZG8gPSB0aGlzLmNhblVuZG8oKTtcbiAgICAgICAgY29uc3QgY2FuUmVkbyA9IHRoaXMuY2FuUmVkbygpO1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JIaXN0b3J5VW5kb0Jsb2NrICYmIHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jay5maXJzdEVsZW1lbnRDaGlsZCkge1xuICAgICAgICAgICAgY29uc3QgdW5kb0J1dHRvbiA9IHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGlmIChjYW5VbmRvKSB7XG4gICAgICAgICAgICAgICAgdW5kb0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnJztcbiAgICAgICAgICAgICAgICB1bmRvQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHVuZG9CdXR0b24uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyNmMmYyZjInO1xuICAgICAgICAgICAgICAgIHVuZG9CdXR0b24uc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2sgJiYgdGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrLmZpcnN0RWxlbWVudENoaWxkKSB7XG4gICAgICAgICAgICBjb25zdCByZWRvQnV0dG9uID0gdGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgaWYgKGNhblJlZG8pIHtcbiAgICAgICAgICAgICAgICByZWRvQnV0dG9uLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcnO1xuICAgICAgICAgICAgICAgIHJlZG9CdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVkb0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnI2YyZjJmMic7XG4gICAgICAgICAgICAgICAgcmVkb0J1dHRvbi5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnldINCh0L7RgdGC0L7Rj9C90LjQtSDQutC90L7Qv9C+0Lo6IHVuZG8gPScsIGNhblVuZG8sICcsIHJlZG8gPScsIGNhblJlZG8pO1xuICAgIH1cbiAgICBhc3luYyB1bmRvKCkge1xuICAgICAgICBpZiAoIXRoaXMuY2FuVW5kbygpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbaGlzdG9yeV0gVW5kbyDQvdC10LLQvtC30LzQvtC20LXQvScpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPT09IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxICYmIHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggPj0gMikge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID0gdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPSBNYXRoLm1heCgwLCB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggLSAxKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBoaXN0b3J5SXRlbSA9IHRoaXMubGF5ZXJzSGlzdG9yeVt0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXhdO1xuICAgICAgICBpZiAoIWhpc3RvcnlJdGVtKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1toaXN0b3J5XSDQmNGB0YLQvtGA0LjRjyDQvdC1INC90LDQudC00LXQvdCwJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2hpc3RvcnldIFVuZG8g0Log0LjQvdC00LXQutGB0YMgJHt0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXh9INC40LcgJHt0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMX1gKTtcbiAgICAgICAgYXdhaXQgdGhpcy5yZXN0b3JlTGF5ZXJzRnJvbUhpc3RvcnkoaGlzdG9yeUl0ZW0pO1xuICAgICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGFzeW5jIHJlZG8oKSB7XG4gICAgICAgIGlmICghdGhpcy5jYW5SZWRvKCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5XSBSZWRvINC90LXQstC+0LfQvNC+0LbQtdC9Jyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4Kys7XG4gICAgICAgIGNvbnN0IGhpc3RvcnlJdGVtID0gdGhpcy5sYXllcnNIaXN0b3J5W3RoaXMuY3VycmVudEhpc3RvcnlJbmRleF07XG4gICAgICAgIGlmICghaGlzdG9yeUl0ZW0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2hpc3RvcnldINCY0YHRgtC+0YDQuNGPINC90LUg0L3QsNC50LTQtdC90LAnKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKGBbaGlzdG9yeV0gUmVkbyDQuiDQuNC90LTQtdC60YHRgyAke3RoaXMuY3VycmVudEhpc3RvcnlJbmRleH0g0LjQtyAke3RoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxfWApO1xuICAgICAgICBhd2FpdCB0aGlzLnJlc3RvcmVMYXllcnNGcm9tSGlzdG9yeShoaXN0b3J5SXRlbSk7XG4gICAgICAgIHRoaXMudXBkYXRlSGlzdG9yeUJ1dHRvbnNTdGF0ZSgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgYXN5bmMgcmVzdG9yZUxheWVyc0Zyb21IaXN0b3J5KGhpc3RvcnlJdGVtKSB7XG4gICAgICAgIHRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSA9IHRydWU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLmxheW91dHMgPSBbXTtcbiAgICAgICAgICAgIGhpc3RvcnlJdGVtLmxheWVycy5mb3JFYWNoKGxheW91dCA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXlvdXRzLnB1c2gobmV3IExheW91dChsYXlvdXQpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtoaXN0b3J5XSDQktC+0YHRgdGC0LDQvdC+0LLQu9C10L3QviAke3RoaXMubGF5b3V0cy5sZW5ndGh9INGB0LvQvtGR0LJgKTtcbiAgICAgICAgfVxuICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tlZGl0b3JdINCe0YfQuNGB0YLQutCwINGA0LXRgdGD0YDRgdC+0LIg0YDQtdC00LDQutGC0L7RgNCwJyk7XG4gICAgICAgIGlmICh0aGlzLmxvYWRpbmdJbnRlcnZhbCkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmxvYWRpbmdJbnRlcnZhbCk7XG4gICAgICAgICAgICB0aGlzLmxvYWRpbmdJbnRlcnZhbCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ldmVudHMuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLmNhbnZhc2VzLmZvckVhY2goY2FudmFzID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2FudmFzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbY2xlYW51cF0g0J7RiNC40LHQutCwINC+0YfQuNGB0YLQutC4IGNhbnZhczonLCBlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jYW52YXNlcyA9IFtdO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzLmZvckVhY2goY2FudmFzID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2FudmFzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbY2xlYW51cF0g0J7RiNC40LHQutCwINC+0YfQuNGB0YLQutC4IGxheWVyIGNhbnZhczonLCBlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5sYXllcnNDYW52YXNlcyA9IFtdO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZWRpdG9yXSDQoNC10YHRg9GA0YHRiyDRg9GB0L/QtdGI0L3QviDQvtGH0LjRidC10L3RiycpO1xuICAgIH1cbiAgICBnZXRDdXJyZW50U3RhdGUoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiB0aGlzLl9zZWxlY3RUeXBlLFxuICAgICAgICAgICAgY29sb3I6IHRoaXMuX3NlbGVjdENvbG9yLFxuICAgICAgICAgICAgc2lkZTogdGhpcy5fc2VsZWN0U2lkZSxcbiAgICAgICAgICAgIHNpemU6IHRoaXMuX3NlbGVjdFNpemUsXG4gICAgICAgICAgICBsYXlvdXRzOiB0aGlzLmxheW91dHMsXG4gICAgICAgICAgICBpc0xvYWRpbmc6IHRoaXMuaXNMb2FkaW5nLFxuICAgICAgICB9O1xuICAgIH1cbn1cbiIsImNvbnN0IHBvcHVwTG9nZ2VyID0gY29uc29sZS5kZWJ1Zy5iaW5kKGNvbnNvbGUsICdbUG9wdXBdJyk7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQb3B1cCB7XG4gICAgY29uc3RydWN0b3IoeyBwb3B1cElkLCBwb3B1cENvbnRlbnRDbGFzcywgY2xvc2VCdXR0b25DbGFzcywgdGltZW91dFNlY29uZHMgPSAxMCwgYXV0b1Nob3cgPSB0cnVlLCBjb29raWVOYW1lID0gJ3BvcHVwJywgY29va2llRXhwaXJlc0RheXMgPSAxLCB9KSB7XG4gICAgICAgIHRoaXMuY2xvc2VCdXR0b24gPSBudWxsO1xuICAgICAgICB0aGlzLmF1dG9TaG93ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYXV0b1Nob3dUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy50aW1lb3V0U2Vjb25kcyA9IDI1O1xuICAgICAgICB0aGlzLmNvb2tpZU5hbWUgPSBcInBvcHVwXCI7XG4gICAgICAgIHRoaXMuY29va2llRXhwaXJlc0RheXMgPSAxO1xuICAgICAgICBpZiAoIXBvcHVwSWQgfHwgIXBvcHVwQ29udGVudENsYXNzKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbUG9wdXBdIHBvcHVwSWQgb3IgcG9wdXBDb250ZW50Q2xhc3MgaXMgbm90IHByb3ZpZGVkJyk7XG4gICAgICAgIGNvbnN0IGZpbmRQb3B1cEJsb2NrID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocG9wdXBJZCk7XG4gICAgICAgIGlmICghZmluZFBvcHVwQmxvY2spIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUG9wdXAgYmxvY2sgd2l0aCBpZCAke3BvcHVwSWR9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbmRQb3B1cENvbnRlbnRCbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke3BvcHVwQ29udGVudENsYXNzfWApO1xuICAgICAgICBpZiAoIWZpbmRQb3B1cENvbnRlbnRCbG9jaykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQb3B1cCBjb250ZW50IGJsb2NrIHdpdGggY2xhc3MgJHtwb3B1cENvbnRlbnRDbGFzc30gbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wb3B1cEJsb2NrID0gZmluZFBvcHVwQmxvY2s7XG4gICAgICAgIHRoaXMucG9wdXBDb250ZW50QmxvY2sgPSBmaW5kUG9wdXBDb250ZW50QmxvY2s7XG4gICAgICAgIHRoaXMuaW5pdFBvcHVwQmxvY2soKTtcbiAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXJCbG9jayA9IHRoaXMuaW5pdFBvcHVwV3JhcHBlcigpO1xuICAgICAgICBjb25zdCBmaW5kQ2xvc2VCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuJHtjbG9zZUJ1dHRvbkNsYXNzfWApO1xuICAgICAgICBpZiAoIWZpbmRDbG9zZUJ1dHRvbikge1xuICAgICAgICAgICAgcG9wdXBMb2dnZXIoYGNsb3NlIGJ1dHRvbiB3aXRoIGNsYXNzICR7Y2xvc2VCdXR0b25DbGFzc30gbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbiA9IGZpbmRDbG9zZUJ1dHRvbjtcbiAgICAgICAgdGhpcy5pbml0Q2xvc2VCdXR0b24oKTtcbiAgICAgICAgaWYgKHRpbWVvdXRTZWNvbmRzKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVvdXRTZWNvbmRzID0gdGltZW91dFNlY29uZHM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGF1dG9TaG93KSB7XG4gICAgICAgICAgICB0aGlzLmF1dG9TaG93ID0gYXV0b1Nob3c7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvb2tpZU5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuY29va2llTmFtZSA9IGNvb2tpZU5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvb2tpZUV4cGlyZXNEYXlzKSB7XG4gICAgICAgICAgICB0aGlzLmNvb2tpZUV4cGlyZXNEYXlzID0gY29va2llRXhwaXJlc0RheXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucG9wdXBCbG9jayAmJiB0aGlzLmNsb3NlQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRBdXRvU2hvdygpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGluaXRQb3B1cFdyYXBwZXIoKSB7XG4gICAgICAgIGNvbnN0IHBvcHVwV3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5pZCA9ICdwb3B1cC13cmFwcGVyJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLnJpZ2h0ID0gJzAnO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUuYm90dG9tID0gJzAnO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS56SW5kZXggPSAnOTk5OSc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgICAgICByZXR1cm4gcG9wdXBXcmFwcGVyO1xuICAgIH1cbiAgICBpbml0UG9wdXBCbG9jaygpIHtcbiAgICAgICAgdGhpcy5wb3B1cEJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgfVxuICAgIGluaXRDbG9zZUJ1dHRvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNsb3NlQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmNsb3NlQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gdGhpcy5jbG9zZSgpO1xuICAgIH1cbiAgICBpbml0QXV0b1Nob3coKSB7XG4gICAgICAgIGlmICh0aGlzLmF1dG9TaG93ICYmICFkb2N1bWVudC5jb29raWUuaW5jbHVkZXMoYCR7dGhpcy5jb29raWVOYW1lfT10cnVlYCkpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0b1Nob3dUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLnNob3coKSwgdGhpcy50aW1lb3V0U2Vjb25kcyAqIDEwMDApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcG9wdXBMb2dnZXIoJ2lzIG5vdCBhdXRvIHNob3duJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2hvdygpIHtcbiAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXJCbG9jay5hcHBlbmRDaGlsZCh0aGlzLnBvcHVwQmxvY2spO1xuICAgICAgICB0aGlzLnBvcHVwQ29udGVudEJsb2NrLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICAgIHRoaXMucG9wdXBCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLnBvcHVwV3JhcHBlckJsb2NrKTtcbiAgICB9XG4gICAgY2xvc2UoKSB7XG4gICAgICAgIHRoaXMucG9wdXBXcmFwcGVyQmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgZG9jdW1lbnQuY29va2llID0gYCR7dGhpcy5jb29raWVOYW1lfT10cnVlOyBleHBpcmVzPSR7bmV3IERhdGUoRGF0ZS5ub3coKSArIHRoaXMuY29va2llRXhwaXJlc0RheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwKS50b1VUQ1N0cmluZygpfTsgcGF0aD0vO2A7XG4gICAgfVxufVxuIiwiZXhwb3J0IGNsYXNzIEVkaXRvclN0b3JhZ2VNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5kYXRhYmFzZSA9IG51bGw7XG4gICAgICAgIHRoaXMuaXNSZWFkeSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlYWR5UHJvbWlzZSA9IHRoaXMuaW5pdCgpO1xuICAgIH1cbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb3BlblJlcXVlc3QgPSBpbmRleGVkREIub3BlbihcImVkaXRvclwiLCAyKTtcbiAgICAgICAgICAgIG9wZW5SZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGFiYXNlID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICBpZiAoIWRhdGFiYXNlLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoJ2hpc3RvcnknKSkge1xuICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS5jcmVhdGVPYmplY3RTdG9yZSgnaGlzdG9yeScsIHsga2V5UGF0aDogJ2lkJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFkYXRhYmFzZS5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKCdlZGl0b3Jfc3RhdGUnKSkge1xuICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS5jcmVhdGVPYmplY3RTdG9yZSgnZWRpdG9yX3N0YXRlJywgeyBrZXlQYXRoOiAna2V5JyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFkYXRhYmFzZS5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKCd1c2VyX2RhdGEnKSkge1xuICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS5jcmVhdGVPYmplY3RTdG9yZSgndXNlcl9kYXRhJywgeyBrZXlQYXRoOiAna2V5JyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgb3BlblJlcXVlc3Qub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi0J7RiNC40LHQutCwINC+0YLQutGA0YvRgtC40Y8gSW5kZXhlZERCXCIsIG9wZW5SZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgICAgICByZWplY3Qob3BlblJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG9wZW5SZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFiYXNlID0gb3BlblJlcXVlc3QucmVzdWx0O1xuICAgICAgICAgICAgICAgIHRoaXMuaXNSZWFkeSA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIHdhaXRGb3JSZWFkeSgpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5yZWFkeVByb21pc2U7XG4gICAgfVxuICAgIGFzeW5jIHNhdmVFZGl0b3JTdGF0ZShzdGF0ZSkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnZWRpdG9yX3N0YXRlJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnZWRpdG9yX3N0YXRlJyk7XG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgIHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ2RhdGUnLCBzdGF0ZS5kYXRlKSxcbiAgICAgICAgICAgIHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ2NvbG9yJywgc3RhdGUuY29sb3IpLFxuICAgICAgICAgICAgdGhpcy5wdXREYXRhKG9iamVjdFN0b3JlLCAnc2lkZScsIHN0YXRlLnNpZGUpLFxuICAgICAgICAgICAgdGhpcy5wdXREYXRhKG9iamVjdFN0b3JlLCAndHlwZScsIHN0YXRlLnR5cGUpLFxuICAgICAgICAgICAgdGhpcy5wdXREYXRhKG9iamVjdFN0b3JlLCAnc2l6ZScsIHN0YXRlLnNpemUpXG4gICAgICAgIF0pO1xuICAgIH1cbiAgICBhc3luYyBsb2FkRWRpdG9yU3RhdGUoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydlZGl0b3Jfc3RhdGUnXSwgJ3JlYWRvbmx5Jyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2VkaXRvcl9zdGF0ZScpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgW2RhdGUsIGNvbG9yLCBzaWRlLCB0eXBlLCBzaXplXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICdkYXRlJyksXG4gICAgICAgICAgICAgICAgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAnY29sb3InKSxcbiAgICAgICAgICAgICAgICB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICdzaWRlJyksXG4gICAgICAgICAgICAgICAgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAndHlwZScpLFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ3NpemUnKVxuICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICBpZiAoIWRhdGUgfHwgIWNvbG9yIHx8ICFzaWRlIHx8ICF0eXBlIHx8ICFzaXplKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGRhdGUsXG4gICAgICAgICAgICAgICAgY29sb3IsXG4gICAgICAgICAgICAgICAgc2lkZSxcbiAgICAgICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgICAgIHNpemVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCDRgdC+0YHRgtC+0Y/QvdC40Y8g0YDQtdC00LDQutGC0L7RgNCwOicsIGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGNsZWFyRWRpdG9yU3RhdGUoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydlZGl0b3Jfc3RhdGUnXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdlZGl0b3Jfc3RhdGUnKTtcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgdGhpcy5kZWxldGVEYXRhKG9iamVjdFN0b3JlLCAnZGF0ZScpLFxuICAgICAgICAgICAgdGhpcy5kZWxldGVEYXRhKG9iamVjdFN0b3JlLCAnY29sb3InKSxcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlRGF0YShvYmplY3RTdG9yZSwgJ3NpZGUnKSxcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlRGF0YShvYmplY3RTdG9yZSwgJ3R5cGUnKSxcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlRGF0YShvYmplY3RTdG9yZSwgJ3NpemUnKVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgYXN5bmMgZ2V0VXNlcklkKCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsndXNlcl9kYXRhJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgndXNlcl9kYXRhJyk7XG4gICAgICAgIGxldCB1c2VySWQgPSBhd2FpdCB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICd1c2VySWQnKTtcbiAgICAgICAgaWYgKCF1c2VySWQpIHtcbiAgICAgICAgICAgIHVzZXJJZCA9IGNyeXB0by5yYW5kb21VVUlEKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICd1c2VySWQnLCB1c2VySWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1c2VySWQ7XG4gICAgfVxuICAgIGFzeW5jIHNhdmVUb0hpc3RvcnkoaXRlbSwgZGVzY3JpcHRpb24pIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IGhpc3RvcnlJdGVtID0ge1xuICAgICAgICAgICAgLi4uaXRlbSxcbiAgICAgICAgICAgIGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uIHx8IGDQmNC30LzQtdC90LXQvdC40Y8g0L7RgiAke25ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoKX1gXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5hZGQoaGlzdG9yeUl0ZW0pO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaGlzdG9yeUl0ZW0uaWQ7XG4gICAgfVxuICAgIGFzeW5jIHNhdmVMYXllck9wZXJhdGlvbihvcGVyYXRpb24sIGxheW91dCwgc2lkZSwgdHlwZSwgZGVzY3JpcHRpb24pIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IGxheWVySGlzdG9yeUl0ZW0gPSB7XG4gICAgICAgICAgICBpZDogY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIG9wZXJhdGlvbixcbiAgICAgICAgICAgIGxheW91dDogSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShsYXlvdXQpKSxcbiAgICAgICAgICAgIHNpZGUsXG4gICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uIHx8IGAke29wZXJhdGlvbiA9PT0gJ2FkZCcgPyAn0JTQvtCx0LDQstC70LXQvScgOiAn0KPQtNCw0LvQtdC9J30g0YHQu9C+0Lk6ICR7bGF5b3V0Lm5hbWUgfHwgbGF5b3V0LnR5cGV9YFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydoaXN0b3J5J10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuYWRkKHsgLi4ubGF5ZXJIaXN0b3J5SXRlbSwgaXNMYXllck9wZXJhdGlvbjogdHJ1ZSB9KTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGxheWVySGlzdG9yeUl0ZW0uaWQ7XG4gICAgfVxuICAgIGFzeW5jIGdldExheWVySGlzdG9yeShmaWx0ZXIsIGxpbWl0ID0gNTApIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWRvbmx5Jyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5nZXRBbGwoKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsbEl0ZW1zID0gcmVxdWVzdC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgY29uc3QgbGF5ZXJPcGVyYXRpb25zID0gYWxsSXRlbXNcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcigoaXRlbSkgPT4gaXRlbS5pc0xheWVyT3BlcmF0aW9uICYmIGl0ZW0uc2lkZSA9PT0gZmlsdGVyLnNpZGUgJiYgaXRlbS50eXBlID09PSBmaWx0ZXIudHlwZSlcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgoaXRlbSkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGl0ZW0uaWQsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogaXRlbS50aW1lc3RhbXAsXG4gICAgICAgICAgICAgICAgICAgIG9wZXJhdGlvbjogaXRlbS5vcGVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgIGxheW91dDogaXRlbS5sYXlvdXQsXG4gICAgICAgICAgICAgICAgICAgIHNpZGU6IGl0ZW0uc2lkZSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogaXRlbS50eXBlLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogaXRlbS5kZXNjcmlwdGlvblxuICAgICAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgICAgICAgICAuc29ydCgoYSwgYikgPT4gYi50aW1lc3RhbXAgLSBhLnRpbWVzdGFtcClcbiAgICAgICAgICAgICAgICAgICAgLnNsaWNlKDAsIGxpbWl0KTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGxheWVyT3BlcmF0aW9ucyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgZ2V0UmVjZW50TGF5ZXJPcGVyYXRpb25zKGZpbHRlciwgbGltaXQgPSAxMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRMYXllckhpc3RvcnkoZmlsdGVyLCBsaW1pdCk7XG4gICAgfVxuICAgIGFzeW5jIGdldEhpc3RvcnkoZmlsdGVyLCBsaW1pdCA9IDUwKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydoaXN0b3J5J10sICdyZWFkb25seScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuZ2V0QWxsKCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhbGxJdGVtcyA9IHJlcXVlc3QucmVzdWx0O1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlcmVkSXRlbXMgPSBhbGxJdGVtc1xuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKGl0ZW0gPT4gaXRlbS5zaWRlID09PSBmaWx0ZXIuc2lkZSAmJiBpdGVtLnR5cGUgPT09IGZpbHRlci50eXBlKVxuICAgICAgICAgICAgICAgICAgICAuc29ydCgoYSwgYikgPT4gYi50aW1lc3RhbXAgLSBhLnRpbWVzdGFtcClcbiAgICAgICAgICAgICAgICAgICAgLnNsaWNlKDAsIGxpbWl0KTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGZpbHRlcmVkSXRlbXMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIGdldEhpc3RvcnlJdGVtKGlkKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydoaXN0b3J5J10sICdyZWFkb25seScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuZ2V0KGlkKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZShyZXF1ZXN0LnJlc3VsdCB8fCBudWxsKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIGRlbGV0ZUhpc3RvcnlJdGVtKGlkKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydoaXN0b3J5J10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuZGVsZXRlKGlkKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgY2xlYXJIaXN0b3J5KGZpbHRlcikge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgaWYgKCFmaWx0ZXIpIHtcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGFsbEl0ZW1zID0gYXdhaXQgdGhpcy5nZXRIaXN0b3J5KGZpbHRlciwgMTAwMCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgYWxsSXRlbXMpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmRlbGV0ZUhpc3RvcnlJdGVtKGl0ZW0uaWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIHNhdmVMYXllcnMobGF5ZXJzKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydlZGl0b3Jfc3RhdGUnXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdlZGl0b3Jfc3RhdGUnKTtcbiAgICAgICAgYXdhaXQgdGhpcy5wdXREYXRhKG9iamVjdFN0b3JlLCAnbGF5ZXJzJywgbGF5ZXJzKTtcbiAgICB9XG4gICAgYXN5bmMgbG9hZExheWVycygpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydlZGl0b3Jfc3RhdGUnXSwgJ3JlYWRvbmx5Jyk7XG4gICAgICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdlZGl0b3Jfc3RhdGUnKTtcbiAgICAgICAgICAgIGNvbnN0IGxheWVycyA9IGF3YWl0IHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ2xheWVycycpO1xuICAgICAgICAgICAgcmV0dXJuIGxheWVycyB8fCBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcign0J7RiNC40LHQutCwINC30LDQs9GA0YPQt9C60Lgg0YHQu9C+0ZHQsjonLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwdXREYXRhKG9iamVjdFN0b3JlLCBrZXksIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUucHV0KHsga2V5LCB2YWx1ZSB9KTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0RGF0YShvYmplY3RTdG9yZSwga2V5KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuZ2V0KGtleSk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUocmVxdWVzdC5yZXN1bHQ/LnZhbHVlIHx8IG51bGwpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZGVsZXRlRGF0YShvYmplY3RTdG9yZSwga2V5KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIiwiY29uc3QgREVGQVVMVF9WQUxVRVMgPSB7XG4gICAgUE9TSVRJT046IHsgeDogMCwgeTogMCB9LFxuICAgIFNJWkU6IDEsXG4gICAgQVNQRUNUX1JBVElPOiAxLFxuICAgIEFOR0xFOiAwLFxuICAgIFRFWFQ6ICdQcmludExvb3AnLFxuICAgIEZPTlQ6IHsgZmFtaWx5OiAnQXJpYWwnLCBzaXplOiAxMiB9LFxufTtcbmV4cG9ydCBjbGFzcyBMYXlvdXQge1xuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHRoaXMuaWQgPSBwcm9wcy5pZCB8fCBMYXlvdXQuZ2VuZXJhdGVJZCgpO1xuICAgICAgICB0aGlzLnR5cGUgPSBwcm9wcy50eXBlO1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gcHJvcHMucG9zaXRpb24gfHwgeyAuLi5ERUZBVUxUX1ZBTFVFUy5QT1NJVElPTiB9O1xuICAgICAgICB0aGlzLnNpemUgPSB0aGlzLnZhbGlkYXRlU2l6ZShwcm9wcy5zaXplID8/IERFRkFVTFRfVkFMVUVTLlNJWkUpO1xuICAgICAgICB0aGlzLmFzcGVjdFJhdGlvID0gdGhpcy52YWxpZGF0ZUFzcGVjdFJhdGlvKHByb3BzLmFzcGVjdFJhdGlvID8/IERFRkFVTFRfVkFMVUVTLkFTUEVDVF9SQVRJTyk7XG4gICAgICAgIHRoaXMudmlldyA9IHByb3BzLnZpZXc7XG4gICAgICAgIHRoaXMuYW5nbGUgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKHByb3BzLmFuZ2xlID8/IERFRkFVTFRfVkFMVUVTLkFOR0xFKTtcbiAgICAgICAgdGhpcy5uYW1lID0gcHJvcHMubmFtZSA/PyBudWxsO1xuICAgICAgICBpZiAocHJvcHMudHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgICAgICAgdGhpcy51cmwgPSBwcm9wcy51cmw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocHJvcHMudHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICAgICAgICB0aGlzLnRleHQgPSBwcm9wcy50ZXh0IHx8IERFRkFVTFRfVkFMVUVTLlRFWFQ7XG4gICAgICAgICAgICB0aGlzLmZvbnQgPSBwcm9wcy5mb250ID8geyAuLi5wcm9wcy5mb250IH0gOiB7IC4uLkRFRkFVTFRfVkFMVUVTLkZPTlQgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgZ2VuZXJhdGVJZCgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjcnlwdG8gIT09ICd1bmRlZmluZWQnICYmIGNyeXB0by5yYW5kb21VVUlEKSB7XG4gICAgICAgICAgICByZXR1cm4gY3J5cHRvLnJhbmRvbVVVSUQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYCR7RGF0ZS5ub3coKX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMiwgMTEpfWA7XG4gICAgfVxuICAgIHZhbGlkYXRlU2l6ZShzaXplKSB7XG4gICAgICAgIGlmIChzaXplIDw9IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgSW52YWxpZCBzaXplICR7c2l6ZX0sIHVzaW5nIGRlZmF1bHQgJHtERUZBVUxUX1ZBTFVFUy5TSVpFfWApO1xuICAgICAgICAgICAgcmV0dXJuIERFRkFVTFRfVkFMVUVTLlNJWkU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNpemU7XG4gICAgfVxuICAgIHZhbGlkYXRlQXNwZWN0UmF0aW8ocmF0aW8pIHtcbiAgICAgICAgaWYgKHJhdGlvIDw9IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgSW52YWxpZCBhc3BlY3QgcmF0aW8gJHtyYXRpb30sIHVzaW5nIGRlZmF1bHQgJHtERUZBVUxUX1ZBTFVFUy5BU1BFQ1RfUkFUSU99YCk7XG4gICAgICAgICAgICByZXR1cm4gREVGQVVMVF9WQUxVRVMuQVNQRUNUX1JBVElPO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByYXRpbztcbiAgICB9XG4gICAgbm9ybWFsaXplQW5nbGUoYW5nbGUpIHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IGFuZ2xlICUgMzYwO1xuICAgICAgICByZXR1cm4gbm9ybWFsaXplZCA8IDAgPyBub3JtYWxpemVkICsgMzYwIDogbm9ybWFsaXplZDtcbiAgICB9XG4gICAgaXNJbWFnZUxheW91dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZSA9PT0gJ2ltYWdlJyAmJiB0aGlzLnVybCAhPT0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpc1RleHRMYXlvdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGUgPT09ICd0ZXh0JyAmJiB0aGlzLnRleHQgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZvbnQgIT09IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgc2V0UG9zaXRpb24oeCwgeSkge1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0geyB4LCB5IH07XG4gICAgfVxuICAgIG1vdmUoZHgsIGR5KSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24ueCArPSBkeDtcbiAgICAgICAgdGhpcy5wb3NpdGlvbi55ICs9IGR5O1xuICAgIH1cbiAgICBzZXRTaXplKHNpemUpIHtcbiAgICAgICAgdGhpcy5zaXplID0gdGhpcy52YWxpZGF0ZVNpemUoc2l6ZSk7XG4gICAgfVxuICAgIHJvdGF0ZShhbmdsZSkge1xuICAgICAgICB0aGlzLmFuZ2xlID0gdGhpcy5ub3JtYWxpemVBbmdsZSh0aGlzLmFuZ2xlICsgYW5nbGUpO1xuICAgIH1cbiAgICBzZXRBbmdsZShhbmdsZSkge1xuICAgICAgICB0aGlzLmFuZ2xlID0gdGhpcy5ub3JtYWxpemVBbmdsZShhbmdsZSk7XG4gICAgfVxuICAgIHNldFRleHQodGV4dCkge1xuICAgICAgICBpZiAodGhpcy5pc1RleHRMYXlvdXQoKSkge1xuICAgICAgICAgICAgdGhpcy50ZXh0ID0gdGV4dDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXRGb250KGZvbnQpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNUZXh0TGF5b3V0KCkgJiYgdGhpcy5mb250KSB7XG4gICAgICAgICAgICB0aGlzLmZvbnQgPSB7IC4uLnRoaXMuZm9udCwgLi4uZm9udCB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIGNsb25lKCkge1xuICAgICAgICBpZiAodGhpcy50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9wcyA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UnLFxuICAgICAgICAgICAgICAgIHVybDogdGhpcy51cmwsXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHsgLi4udGhpcy5wb3NpdGlvbiB9LFxuICAgICAgICAgICAgICAgIHNpemU6IHRoaXMuc2l6ZSxcbiAgICAgICAgICAgICAgICBhc3BlY3RSYXRpbzogdGhpcy5hc3BlY3RSYXRpbyxcbiAgICAgICAgICAgICAgICB2aWV3OiB0aGlzLnZpZXcsXG4gICAgICAgICAgICAgICAgYW5nbGU6IHRoaXMuYW5nbGUsXG4gICAgICAgICAgICAgICAgbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgTGF5b3V0KHByb3BzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyAuLi50aGlzLnBvc2l0aW9uIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogdGhpcy5zaXplLFxuICAgICAgICAgICAgICAgIGFzcGVjdFJhdGlvOiB0aGlzLmFzcGVjdFJhdGlvLFxuICAgICAgICAgICAgICAgIHZpZXc6IHRoaXMudmlldyxcbiAgICAgICAgICAgICAgICBhbmdsZTogdGhpcy5hbmdsZSxcbiAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHRoaXMudGV4dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcHJvcHMudGV4dCA9IHRoaXMudGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmZvbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHByb3BzLmZvbnQgPSB7IC4uLnRoaXMuZm9udCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBMYXlvdXQocHJvcHMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRvSlNPTigpIHtcbiAgICAgICAgY29uc3QgYmFzZSA9IHtcbiAgICAgICAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMucG9zaXRpb24sXG4gICAgICAgICAgICBzaXplOiB0aGlzLnNpemUsXG4gICAgICAgICAgICBhc3BlY3RSYXRpbzogdGhpcy5hc3BlY3RSYXRpbyxcbiAgICAgICAgICAgIHZpZXc6IHRoaXMudmlldyxcbiAgICAgICAgICAgIGFuZ2xlOiB0aGlzLmFuZ2xlLFxuICAgICAgICAgICAgbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICByZXR1cm4geyAuLi5iYXNlLCB1cmw6IHRoaXMudXJsIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgIHJldHVybiB7IC4uLmJhc2UsIHRleHQ6IHRoaXMudGV4dCwgZm9udDogdGhpcy5mb250IH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhc2U7XG4gICAgfVxuICAgIHN0YXRpYyBmcm9tSlNPTihqc29uKSB7XG4gICAgICAgIHJldHVybiBuZXcgTGF5b3V0KGpzb24pO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlSW1hZ2UocHJvcHMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMYXlvdXQoeyAuLi5wcm9wcywgdHlwZTogJ2ltYWdlJyB9KTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZVRleHQocHJvcHMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMYXlvdXQoeyAuLi5wcm9wcywgdHlwZTogJ3RleHQnIH0pO1xuICAgIH1cbn1cbiIsImV4cG9ydCBjbGFzcyBUeXBlZEV2ZW50RW1pdHRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBvbihldmVudCwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmxpc3RlbmVycy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5zZXQoZXZlbnQsIG5ldyBTZXQoKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMuZ2V0KGV2ZW50KS5hZGQobGlzdGVuZXIpO1xuICAgIH1cbiAgICBvbmNlKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgICBjb25zdCBvbmNlV3JhcHBlciA9IChkZXRhaWwpID0+IHtcbiAgICAgICAgICAgIGxpc3RlbmVyKGRldGFpbCk7XG4gICAgICAgICAgICB0aGlzLm9mZihldmVudCwgb25jZVdyYXBwZXIpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm9uKGV2ZW50LCBvbmNlV3JhcHBlcik7XG4gICAgfVxuICAgIG9mZihldmVudCwgbGlzdGVuZXIpIHtcbiAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycy5nZXQoZXZlbnQpO1xuICAgICAgICBpZiAoZXZlbnRMaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIGV2ZW50TGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gICAgICAgICAgICBpZiAoZXZlbnRMaXN0ZW5lcnMuc2l6ZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZW1pdChldmVudCwgZGV0YWlsKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50TGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnMuZ2V0KGV2ZW50KTtcbiAgICAgICAgaWYgKGV2ZW50TGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBldmVudExpc3RlbmVycy5mb3JFYWNoKGxpc3RlbmVyID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcihkZXRhaWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW0V2ZW50RW1pdHRlcl0g0J7RiNC40LHQutCwINCyINC+0LHRgNCw0LHQvtGC0YfQuNC60LUg0YHQvtCx0YvRgtC40Y8gXCIke1N0cmluZyhldmVudCl9XCI6YCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShldmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5jbGVhcigpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGxpc3RlbmVyQ291bnQoZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXJzLmdldChldmVudCk/LnNpemUgfHwgMDtcbiAgICB9XG4gICAgaGFzTGlzdGVuZXJzKGV2ZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVyQ291bnQoZXZlbnQpID4gMDtcbiAgICB9XG4gICAgZXZlbnROYW1lcygpIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5saXN0ZW5lcnMua2V5cygpKTtcbiAgICB9XG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMuY2xlYXIoKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBFZGl0b3JTdG9yYWdlTWFuYWdlciB9IGZyb20gJy4uL21hbmFnZXJzL0VkaXRvclN0b3JhZ2VNYW5hZ2VyJztcbmNvbnN0IEFQSV9FTkRQT0lOVFMgPSB7XG4gICAgV0VCSE9PS19SRVFVRVNUOiAnaHR0cHM6Ly9wcmltYXJ5LXByb2R1Y3Rpb24tNjU0Yy51cC5yYWlsd2F5LmFwcC93ZWJob29rL3JlcXVlc3QnLFxufTtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUltYWdlKHsgcHJvbXB0LCBzaGlydENvbG9yLCBpbWFnZSwgd2l0aEFpLCBsYXlvdXRJZCwgaXNOZXcgPSB0cnVlLCB9KSB7XG4gICAgY29uc3QgdGVtcFN0b3JhZ2VNYW5hZ2VyID0gbmV3IEVkaXRvclN0b3JhZ2VNYW5hZ2VyKCk7XG4gICAgY29uc3QgdXNlcklkID0gYXdhaXQgdGVtcFN0b3JhZ2VNYW5hZ2VyLmdldFVzZXJJZCgpO1xuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgZm9ybURhdGEuc2V0KCd1c2VySWQnLCB1c2VySWQpO1xuICAgIGZvcm1EYXRhLnNldCgncHJvbXB0JywgcHJvbXB0KTtcbiAgICBmb3JtRGF0YS5zZXQoJ3NoaXJ0Q29sb3InLCBzaGlydENvbG9yKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3BsYWNlbWVudCcsICdjZW50ZXInKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3ByaW50U2l6ZScsIFwiYmlnXCIpO1xuICAgIGZvcm1EYXRhLnNldCgndHJhbnNmZXJUeXBlJywgJycpO1xuICAgIGZvcm1EYXRhLnNldCgncmVxdWVzdF90eXBlJywgJ2dlbmVyYXRlJyk7XG4gICAgaWYgKGxheW91dElkKVxuICAgICAgICBmb3JtRGF0YS5zZXQoJ2xheW91dElkJywgbGF5b3V0SWQpO1xuICAgIGlmIChpbWFnZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZ2VuZXJhdGUgaW1hZ2VdJywgaW1hZ2UpO1xuICAgICAgICBjb25zdCBbaGVhZGVyLCBkYXRhXSA9IGltYWdlLnNwbGl0KCcsJyk7XG4gICAgICAgIGNvbnN0IHR5cGUgPSBoZWFkZXIuc3BsaXQoJzonKVsxXS5zcGxpdCgnOycpWzBdO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZ2VuZXJhdGUgaW1hZ2VdIFt0eXBlXScsIHR5cGUpO1xuICAgICAgICBjb25zdCBieXRlQ2hhcmFjdGVycyA9IGF0b2IoZGF0YSk7XG4gICAgICAgIGNvbnN0IGJ5dGVOdW1iZXJzID0gbmV3IEFycmF5KGJ5dGVDaGFyYWN0ZXJzLmxlbmd0aCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnl0ZUNoYXJhY3RlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGJ5dGVOdW1iZXJzW2ldID0gYnl0ZUNoYXJhY3RlcnMuY2hhckNvZGVBdChpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBieXRlQXJyYXkgPSBuZXcgVWludDhBcnJheShieXRlTnVtYmVycyk7XG4gICAgICAgIGZvcm1EYXRhLnNldCgncmVxdWVzdF90eXBlJywgJ2ltYWdlJyk7XG4gICAgICAgIGZvcm1EYXRhLnNldCgndXNlcl9pbWFnZScsIG5ldyBCbG9iKFtieXRlQXJyYXldLCB7IHR5cGU6IFwiaW1hZ2UvcG5nXCIgfSkpO1xuICAgICAgICBmb3JtRGF0YS5zZXQoJ3RyYW5zZmVyVHlwZScsIHdpdGhBaSA/IFwiYWlcIiA6IFwibm8tYWlcIik7XG4gICAgfVxuICAgIGlmICghaXNOZXcpIHtcbiAgICAgICAgZm9ybURhdGEuc2V0KCdyZXF1ZXN0X3R5cGUnLCAnZWRpdCcpO1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKEFQSV9FTkRQT0lOVFMuV0VCSE9PS19SRVFVRVNULCB7XG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGJvZHk6IGZvcm1EYXRhLFxuICAgIH0pO1xuICAgIGNvbnN0IHJlc3BvbnNlRGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICByZXR1cm4gcmVzcG9uc2VEYXRhLmltYWdlX3VybCB8fCByZXNwb25zZURhdGEuaW1hZ2U7XG59XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHJvZHVjdCh7IHF1YW50aXR5LCBuYW1lLCBzaXplLCBjb2xvciwgc2lkZXMsIGFydGljbGUsIHByaWNlIH0pIHtcbiAgICBjb25zdCBwcm9kdWN0SWQgPSAnNjk4MzQxNjQyODMyXycgKyBEYXRlLm5vdygpO1xuICAgIGNvbnN0IGRlc2lnblZhcmlhbnQgPSBzaWRlcy5sZW5ndGggPiAxID8gYDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCIke3NpZGVzWzBdPy5pbWFnZV91cmx9XCIgdGFyZ2V0PVwiX2JsYW5rXCI+JHtzaWRlc1swXT8uaW1hZ2VfdXJsLnNsaWNlKC0xMCl9PC9hPiwgPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiR7c2lkZXNbMV0/LmltYWdlX3VybH1cIiB0YXJnZXQ9XCJfYmxhbmtcIj4ke3NpZGVzWzFdPy5pbWFnZV91cmwuc2xpY2UoLTEwKX08L2E+YCA6IGA8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiJHtzaWRlc1swXT8uaW1hZ2VfdXJsfVwiIHRhcmdldD1cIl9ibGFua1wiPiR7c2lkZXNbMF0/LmltYWdlX3VybC5zbGljZSgtMTApfTwvYT5gO1xuICAgIGNvbnN0IHJlc3VsdFByb2R1Y3QgPSB7XG4gICAgICAgIGlkOiBwcm9kdWN0SWQsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIHByaWNlLFxuICAgICAgICBxdWFudGl0eTogcXVhbnRpdHksXG4gICAgICAgIGltZzogc2lkZXNbMF0/LmltYWdlX3VybCxcbiAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgICAgeyBvcHRpb246ICfQoNCw0LfQvNC10YAnLCB2YXJpYW50OiBzaXplIH0sXG4gICAgICAgICAgICB7IG9wdGlvbjogJ9CU0LjQt9Cw0LnQvScsIHZhcmlhbnQ6IGRlc2lnblZhcmlhbnQgfSxcbiAgICAgICAgICAgIHsgb3B0aW9uOiAn0JDRgNGC0LjQutGD0LsnLCB2YXJpYW50OiBhcnRpY2xlIH0sXG4gICAgICAgICAgICB7IG9wdGlvbjogJ9Cm0LLQtdGCJywgdmFyaWFudDogY29sb3IubmFtZSB9LFxuICAgICAgICAgICAgeyBvcHRpb246ICfQn9GA0LjQvdGCJywgdmFyaWFudDogc2lkZXMubGVuZ3RoID09IDEgPyAn0J7QtNC90L7RgdGC0L7RgNC+0L3QvdC40LknIDogJ9CU0LLRg9GF0YHRgtC+0YDQvtC90L3QuNC5JyB9LFxuICAgICAgICBdXG4gICAgfTtcbiAgICBjb25zb2xlLmRlYnVnKCdbY2FydF0gYWRkIHByb2R1Y3QnLCByZXN1bHRQcm9kdWN0KTtcbiAgICBpZiAodHlwZW9mIHdpbmRvdy50Y2FydF9fYWRkUHJvZHVjdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgd2luZG93LnRjYXJ0X19hZGRQcm9kdWN0KHJlc3VsdFByb2R1Y3QpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB3aW5kb3cueW0oMTAzMjc5MjE0LCAncmVhY2hHb2FsJywgJ2FkZF90b19jYXJ0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHsgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NhcnRdINCe0YjQuNCx0LrQsCDQv9GA0Lgg0LTQvtCx0LDQstC70LXQvdC40Lgg0L/RgNC+0LTRg9C60YLQsCDQsiDQutC+0YDQt9C40L3RgycsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbY2FydF0g0JrQvtGA0LfQuNC90LAgVGlsZGEg0L3QtSDQt9Cw0LPRgNGD0LbQtdC90LAuJyk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RDaGlsZChlbGVtZW50KSB7XG4gICAgaWYgKCFlbGVtZW50KVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICBpZiAoIWVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQpXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIHJldHVybiBnZXRMYXN0Q2hpbGQoZWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZCk7XG59XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCBQb3B1cCBmcm9tICcuL2NvbXBvbmVudHMvUG9wdXAnO1xuaW1wb3J0IEVkaXRvciBmcm9tICcuL2NvbXBvbmVudHMvRWRpdG9yJztcbmltcG9ydCB7IENhcmRGb3JtIH0gZnJvbSAnLi9jb21wb25lbnRzL0NhcmRGb3JtJztcbndpbmRvdy5wb3B1cCA9IFBvcHVwO1xud2luZG93LmVkaXRvciA9IEVkaXRvcjtcbndpbmRvdy5jYXJkRm9ybSA9IENhcmRGb3JtO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9