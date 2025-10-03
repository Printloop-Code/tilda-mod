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
const API_ENDPOINTS = {
    WEBHOOK_CART: 'https://primary-production-654c.up.railway.app/webhook/cart',
    UPLOAD_IMAGE: 'https://1804633-image.fl.gridesk.ru/upload',
    WEBHOOK_REQUEST: 'https://primary-production-654c.up.railway.app/webhook/request',
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
    constructor({ blocks, productConfigs, formConfig }) {
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
                await fetch(API_ENDPOINTS.WEBHOOK_CART, {
                    method: "POST",
                    body: formData
                });
                (0,_utils_api__WEBPACK_IMPORTED_MODULE_4__.createProduct)({
                    quantity: this.getQuantity(),
                    name: productName,
                    size: this._selectSize,
                    color: this._selectColor,
                    sides,
                    productType: this._selectType,
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
                formInput.value = "";
                formInput.style.borderColor = '#f3f3f3';
                this._selectLayout = null;
                if (this.loadedUserImage) {
                    this.resetUserUploadImage();
                }
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
        this.resetUserUploadImage();
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
        if (this.editorUploadCancelButton) {
            this.editorUploadCancelButton.style.cursor = 'pointer';
            this.editorUploadCancelButton.onclick = () => {
                console.debug('[upload image button] cancel button clicked');
                this.cancelEditLayout();
            };
        }
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
        const response = await fetch(API_ENDPOINTS.UPLOAD_IMAGE, {
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

/***/ "./src/config/products.ts":
/*!********************************!*\
  !*** ./src/config/products.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   editorBlocks: () => (/* binding */ editorBlocks),
/* harmony export */   formConfig: () => (/* binding */ formConfig),
/* harmony export */   productConfigs: () => (/* binding */ productConfigs)
/* harmony export */ });
const productConfigs = [
    {
        type: 'tshirt',
        productName: 'Футболка',
        sizes: ["S", "M", "L", "XL", "2XL"],
        price: 1290,
        doubleSidedPrice: 1590,
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
        price: 2590,
        doubleSidedPrice: 2890,
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
];
const editorBlocks = {
    editorBlockClass: '.editor-block',
    changeSideButtonClass: '.change-side-button',
    productListBlockClass: '.product-list',
    productItemClass: '.product-item',
    productItemImageClass: '.product-item-image',
    productItemTextClass: '.product-item-text',
    editorSumBlockClass: '.editor-sum',
    editorSettingsBlockClass: '.editor-settings',
    editorHistoryUndoBlockClass: '.editor-history-undo',
    editorHistoryRedoBlockClass: '.editor-history-redo',
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
};
const formConfig = {
    formBlockClass: '.editor-form',
    formButtonClass: '.editor-form__button',
    formInputVariableName: 'prompt',
};


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
/* harmony import */ var _config_products__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config/products */ "./src/config/products.ts");


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
function createProduct({ quantity, name, size, color, sides, productType }) {
    const productId = (Math.random() + 1).toString(36).substring(7) + "_" + Date.now();
    const productConfig = _config_products__WEBPACK_IMPORTED_MODULE_1__.productConfigs.find(p => p.type === productType);
    const price = sides.length == 1
        ? (productConfig?.price || 1990)
        : (productConfig?.doubleSidedPrice || 2490);
    const resultProduct = {
        id: productId,
        name,
        price,
        quantity: quantity,
        img: sides[0]?.image_url,
        options: [
            { option: 'Дизайн', variant: `<a target="_blank" href="${sides[0]?.image_url}" target="_blank">${sides[0]?.image_url.slice(-10)}</a>` },
            (sides.length > 1) && { option: 'Дизайн', variant: `<a target="_blank" href="${sides[1]?.image_url}" target="_blank">${sides[1]?.image_url.slice(-10)}</a>` },
            { option: 'Размер', variant: size },
            { option: 'Цвет', variant: color.name },
            { option: 'Принт', variant: sides.length == 1 ? 'Односторонний' : 'Двухсторонний' },
        ]
    };
    console.debug('[cart] add product', resultProduct);
    if (typeof window.tcart__addProduct === 'function') {
        try {
            window.tcart__addProduct(resultProduct);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhCQUE4Qix1QkFBdUI7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ087QUFDUCxrQkFBa0Isb0JBQW9CO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdELGFBQWE7QUFDN0Q7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdELGFBQWE7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0RBQWtEO0FBQ2xELGtEQUFrRDtBQUNsRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbURBQW1ELGtDQUFrQyxJQUFJLG1DQUFtQyxJQUFJLGlDQUFpQztBQUNqSztBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekIscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0ZBQWdGLG1CQUFtQjtBQUNuRztBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsY0FBYztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0VBQStFLG1CQUFtQjtBQUNsRztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0RUFBNEUsMEJBQTBCO0FBQ3RHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtFQUErRSxTQUFTO0FBQ3hGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFLGVBQWU7QUFDakYsaUVBQWlFLGVBQWU7QUFDaEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzREFBc0Qsb0NBQW9DLEVBQUUsa0NBQWtDO0FBQzlIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxRUFBcUUsU0FBUztBQUM5RTtBQUNBO0FBQ0Esa0VBQWtFLFNBQVM7QUFDM0U7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0NBQXdDLGlCQUFpQixFQUFFLGtDQUFrQztBQUM3RjtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQyxhQUFhLEdBQUcsS0FBSztBQUMxRDtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9GQUFvRixTQUFTO0FBQzdGO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEVBQTBFLFNBQVM7QUFDbkY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1FQUFtRSxJQUFJO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxJQUFJLEdBQUcsV0FBVztBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekIscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNudUJ3RTtBQUM5QjtBQUNTO0FBQ1k7QUFDSDtBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUMsMENBQTBDO0FBQzVCO0FBQ2YsdUJBQXVCO0FBQ3ZCLHdCQUF3QjtBQUN4Qix1QkFBdUI7QUFDdkIsdUJBQXVCO0FBQ3ZCLHlCQUF5QjtBQUN6QixrQkFBa0Isb0NBQW9DO0FBQ3REO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBCQUEwQix1RUFBaUI7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtDQUFrQyxnRkFBb0I7QUFDdEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUFpRCwyQkFBMkI7QUFDNUU7QUFDQTtBQUNBLGlEQUFpRCxrREFBTTtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJDQUEyQyxLQUFLO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3RUFBd0UsU0FBUztBQUNqRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQix1QkFBdUI7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtREFBbUQsbUNBQW1DO0FBQ3RGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxvQkFBb0IsdUJBQXVCO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZDQUE2QyxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSx1QkFBdUI7QUFDNUc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QixpQkFBaUIsR0FBRyxpQkFBaUIsR0FBRyx1QkFBdUI7QUFDM0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUVBQWlFLFNBQVM7QUFDMUU7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscURBQXFELGlCQUFpQixVQUFVLGtCQUFrQixTQUFTLGlCQUFpQixTQUFTLGlCQUFpQjtBQUN0SjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQStCLCtEQUFZO0FBQzNDO0FBQ0EsMERBQTBELE1BQU07QUFDaEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0NBQXdDLCtEQUFZO0FBQ3BELDJDQUEyQywrREFBWTtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0NBQXdDLCtEQUFZO0FBQ3BELDJDQUEyQywrREFBWTtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QiwrREFBWTtBQUNwQztBQUNBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQywrREFBWTtBQUM1QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLHVDQUF1QztBQUNsRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsdUNBQXVDO0FBQ2xFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0MsS0FBSztBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0RBQXNELEtBQUs7QUFDM0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdELGFBQWE7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxREFBcUQsV0FBVztBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FB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VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQSxFOzs7OztXQ1BBLHdGOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RCxFOzs7Ozs7Ozs7Ozs7OztBQ051QztBQUNFO0FBQ1E7QUFDakQsZUFBZSx5REFBSztBQUNwQixnQkFBZ0IsMERBQU07QUFDdEIsa0JBQWtCLDBEQUFRIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9jb21wb25lbnRzL0NhcmRGb3JtLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvY29tcG9uZW50cy9FZGl0b3IudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9jb21wb25lbnRzL1BvcHVwLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvY29uZmlnL3Byb2R1Y3RzLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvbWFuYWdlcnMvRWRpdG9yU3RvcmFnZU1hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9tb2RlbHMvTGF5b3V0LnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvdXRpbHMvVHlwZWRFdmVudEVtaXR0ZXIudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy91dGlscy9hcGkudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy91dGlscy90aWxkYVV0aWxzLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IERPTV9TRUxFQ1RPUlMgPSB7XG4gICAgQ0FSVF9DT05UQUlORVI6ICcudDcwNl9fY2FydHdpbi1wcm9kdWN0cywgLnQtc3RvcmVfX2NhcnQtcHJvZHVjdHMsIC50LXN0b3JlJyxcbiAgICBDQVJUX1BST0RVQ1Q6ICcudDcwNl9fY2FydHdpbi1wcm9kdWN0LCAudC1zdG9yZV9fY2FyZCwgLnQ3MDZfX3Byb2R1Y3QnLFxuICAgIFBST0RVQ1RfVElUTEU6ICcudDcwNl9fcHJvZHVjdC10aXRsZSwgLnQtc3RvcmVfX2NhcmRfX3RpdGxlLCAudDcwNl9fcHJvZHVjdC1uYW1lJyxcbiAgICBQUk9EVUNUX0RFTF9CVVRUT046ICcudDcwNl9fcHJvZHVjdC1kZWwnLFxuICAgIFBST0RVQ1RfUExVU19CVVRUT046ICcudDcwNl9fcHJvZHVjdC1wbHVzJyxcbiAgICBQUk9EVUNUX01JTlVTX0JVVFRPTjogJy50NzA2X19wcm9kdWN0LW1pbnVzJyxcbiAgICBQUk9EVUNUX1BMVVNNSU5VUzogJy50NzA2X19wcm9kdWN0LXBsdXNtaW51cycsXG4gICAgUFJPRFVDVF9RVUFOVElUWTogJy50NzA2X19wcm9kdWN0LXF1YW50aXR5LCAudC1zdG9yZV9fY2FyZF9fcXVhbnRpdHknLFxuICAgIENBUlRfQ09VTlRFUjogJy50NzA2X19jYXJ0aWNvbi1jb3VudGVyLCAudC1zdG9yZV9fY291bnRlcicsXG4gICAgQ0FSVF9BTU9VTlQ6ICcudDcwNl9fY2FydHdpbi1wcm9kYW1vdW50LCAudC1zdG9yZV9fdG90YWwtYW1vdW50Jyxcbn07XG5jb25zdCBERUxBWVMgPSB7XG4gICAgQ0FSVF9VUERBVEU6IDMwMCxcbiAgICBET01fVVBEQVRFOiAxMDAsXG4gICAgT0JTRVJWRVJfQ0hFQ0s6IDUwMCxcbiAgICBDQVJUX0xPQURfVElNRU9VVDogMzAwMCxcbn07XG5jbGFzcyBDYXJ0VXRpbHMge1xuICAgIHN0YXRpYyB3YWl0KG1zKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbiAgICB9XG4gICAgc3RhdGljIGFzeW5jIHdhaXRGb3JFbGVtZW50KHNlbGVjdG9yLCBtYXhBdHRlbXB0cyA9IDEwLCBpbnRlcnZhbCA9IDEwMCkge1xuICAgICAgICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IG1heEF0dGVtcHRzOyBhdHRlbXB0KyspIHtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXR0ZW1wdCA8IG1heEF0dGVtcHRzIC0gMSkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMud2FpdChpbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHN0YXRpYyBmaW5kUHJvZHVjdEVsZW1lbnQocHJvZHVjdE5hbWUpIHtcbiAgICAgICAgY29uc3QgcHJvZHVjdHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKERPTV9TRUxFQ1RPUlMuQ0FSVF9QUk9EVUNUKTtcbiAgICAgICAgZm9yIChjb25zdCBwcm9kdWN0IG9mIHByb2R1Y3RzKSB7XG4gICAgICAgICAgICBjb25zdCB0aXRsZSA9IHByb2R1Y3QucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLlBST0RVQ1RfVElUTEUpO1xuICAgICAgICAgICAgaWYgKHRpdGxlICYmIHRpdGxlLnRleHRDb250ZW50Py50cmltKCkgPT09IHByb2R1Y3ROYW1lLnRyaW0oKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9kdWN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBDYXJkRm9ybSB7XG4gICAgY29uc3RydWN0b3IoeyBjYXJkQmxvY2tJZCwgcnVsZXMgfSkge1xuICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuaXNVcGRhdGluZ0NhcnQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jYXJkQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGNhcmRCbG9ja0lkKTtcbiAgICAgICAgaWYgKCF0aGlzLmNhcmRCbG9jaykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQ2FyZCBibG9jayB3aXRoIGlkICR7Y2FyZEJsb2NrSWR9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZm9ybSA9IHRoaXMuY2FyZEJsb2NrLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcbiAgICAgICAgaWYgKCF0aGlzLmZvcm0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZvcm0gYmxvY2sgd2l0aCBpZCAke2NhcmRCbG9ja0lkfSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEZvcm0oKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJ1bGVzID0gcnVsZXM7XG4gICAgICAgIHRoaXMuZmllbGRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnQtaW5wdXQtZ3JvdXAnKTtcbiAgICAgICAgdGhpcy5pbml0UnVsZXMoKTtcbiAgICAgICAgdGhpcy5pbml0Q2FydE9ic2VydmVyKCk7XG4gICAgfVxuICAgIGluaXRGb3JtKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRdJywgdGhpcy5mb3JtLmVsZW1lbnRzKTtcbiAgICAgICAgdGhpcy5mb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0O1xuICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gdGFyZ2V0Py5uYW1lO1xuICAgICAgICAgICAgY29uc3QgZmllbGRWYWx1ZSA9IHRhcmdldD8udmFsdWU7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2lucHV0XScsIGUpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhmaWVsZFZhbHVlLCBcInxcIiwgZmllbGROYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IHJ1bGUgPSB0aGlzLnJ1bGVzLmZpbmQociA9PiByLnZhcmlhYmxlID09PSBmaWVsZE5hbWUpO1xuICAgICAgICAgICAgaWYgKHJ1bGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvbGRTdGF0ZSA9IG5ldyBNYXAodGhpcy5hY3Rpb25zU3RhdGVzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb24gPSBydWxlLmFjdGlvbnMuZmluZChhID0+IGEudmFsdWUgPT09IGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLnNldChmaWVsZE5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBmaWVsZFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuc2V0KGZpZWxkTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBudWxsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmFwcGx5QWN0aW9ucyhvbGRTdGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmZvcm0uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0O1xuICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gdGFyZ2V0Py5uYW1lO1xuICAgICAgICAgICAgY29uc3QgZmllbGRWYWx1ZSA9IHRhcmdldD8udmFsdWU7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NoYW5nZV0nLCBlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoZmllbGRWYWx1ZSwgXCJ8XCIsIGZpZWxkTmFtZSk7XG4gICAgICAgICAgICBjb25zdCBydWxlID0gdGhpcy5ydWxlcy5maW5kKHIgPT4gci52YXJpYWJsZSA9PT0gZmllbGROYW1lKTtcbiAgICAgICAgICAgIGlmIChydWxlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gcnVsZS5hY3Rpb25zLmZpbmQoYSA9PiBhLnZhbHVlID09PSBmaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9sZFN0YXRlID0gbmV3IE1hcCh0aGlzLmFjdGlvbnNTdGF0ZXMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuc2V0KGZpZWxkTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGZpZWxkVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGFjdGlvblxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHBseUFjdGlvbnMob2xkU3RhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkU3RhdGUgPSBuZXcgTWFwKHRoaXMuYWN0aW9uc1N0YXRlcyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcy5zZXQoZmllbGROYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwbHlBY3Rpb25zKG9sZFN0YXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpbml0UnVsZXMoKSB7XG4gICAgICAgIHRoaXMucnVsZXMuZm9yRWFjaChydWxlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gdGhpcy5mb3JtLmVsZW1lbnRzLm5hbWVkSXRlbShydWxlLnZhcmlhYmxlKTtcbiAgICAgICAgICAgIGlmIChmaWVsZCkge1xuICAgICAgICAgICAgICAgIGxldCBmaWVsZFZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkIGluc3RhbmNlb2YgUmFkaW9Ob2RlTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVja2VkUmFkaW8gPSBBcnJheS5mcm9tKGZpZWxkKS5maW5kKChyYWRpbykgPT4gcmFkaW8uY2hlY2tlZCk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWUgPSBjaGVja2VkUmFkaW8/LnZhbHVlIHx8ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChmaWVsZCBpbnN0YW5jZW9mIEhUTUxTZWxlY3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWUgPSBmaWVsZC52YWx1ZSB8fCAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZmllbGQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlID09PSAncmFkaW8nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlID0gZmllbGQuY2hlY2tlZCA/IGZpZWxkLnZhbHVlIDogJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gJ2NoZWNrYm94Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZSA9IGZpZWxkLmNoZWNrZWQgPyBmaWVsZC52YWx1ZSA6ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZSA9IGZpZWxkLnZhbHVlIHx8ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdFJ1bGVzXSDQn9C+0LvQtTonLCBydWxlLnZhcmlhYmxlLCAn0JfQvdCw0YfQtdC90LjQtTonLCBmaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb24gPSBydWxlLmFjdGlvbnMuZmluZChhID0+IGEudmFsdWUgPT09IGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gJiYgZmllbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuc2V0KHJ1bGUudmFyaWFibGUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBmaWVsZFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdFJ1bGVzXSDQmNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QviDRgdC+0YHRgtC+0Y/QvdC40LUg0LTQu9GPOicsIHJ1bGUudmFyaWFibGUsIGFjdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jbGVhbnVwQ2FydE9uSW5pdCgpO1xuICAgIH1cbiAgICBhc3luYyBjbGVhbnVwQ2FydE9uSW5pdCgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0J3QsNGH0LDQu9C+INC+0YfQuNGB0YLQutC4INC60L7RgNC30LjQvdGLJyk7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2hlY2tDYXJ0ID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgICAgICAgICBpZiAodGlsZGFDYXJ0ICYmIHRpbGRhQ2FydC5wcm9kdWN0cykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHZvaWQgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrQ2FydCwgMjAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY2hlY2tDYXJ0KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICghdGlsZGFDYXJ0IHx8ICFBcnJheS5pc0FycmF5KHRpbGRhQ2FydC5wcm9kdWN0cykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0JrQvtGA0LfQuNC90LAg0L3QtdC00L7RgdGC0YPQv9C90LAnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQotC+0LLQsNGA0Ysg0LIg0LrQvtGA0LfQuNC90LU6JywgdGlsZGFDYXJ0LnByb2R1Y3RzLm1hcCgocCkgPT4gcC5uYW1lKSk7XG4gICAgICAgIGNvbnN0IGFsbFJ1bGVQcm9kdWN0cyA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5ydWxlcy5mb3JFYWNoKHJ1bGUgPT4ge1xuICAgICAgICAgICAgcnVsZS5hY3Rpb25zLmZvckVhY2goYWN0aW9uID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsbFJ1bGVQcm9kdWN0cy5hZGQoYWN0aW9uLnZhbHVlLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBhY3RpdmVQcm9kdWN0cyA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLmZvckVhY2goKHN0YXRlKSA9PiB7XG4gICAgICAgICAgICBpZiAoc3RhdGUuYWN0aW9uICYmIHN0YXRlLmFjdGlvbi52YWx1ZSkge1xuICAgICAgICAgICAgICAgIGFjdGl2ZVByb2R1Y3RzLmFkZChzdGF0ZS5hY3Rpb24udmFsdWUudHJpbSgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCS0YHQtSDRgtC+0LLQsNGA0Ysg0LjQtyDQv9GA0LDQstC40Ls6JywgQXJyYXkuZnJvbShhbGxSdWxlUHJvZHVjdHMpKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0JDQutGC0LjQstC90YvQtSDRgtC+0LLQsNGA0Ys6JywgQXJyYXkuZnJvbShhY3RpdmVQcm9kdWN0cykpO1xuICAgICAgICBjb25zdCBwcm9kdWN0c1RvUmVtb3ZlID0gW107XG4gICAgICAgIHRpbGRhQ2FydC5wcm9kdWN0cy5mb3JFYWNoKChwcm9kdWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0TmFtZSA9IHByb2R1Y3QubmFtZT8udHJpbSgpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3ROYW1lICYmIGFsbFJ1bGVQcm9kdWN0cy5oYXMocHJvZHVjdE5hbWUpICYmICFhY3RpdmVQcm9kdWN0cy5oYXMocHJvZHVjdE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcHJvZHVjdHNUb1JlbW92ZS5wdXNoKHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCi0L7QstCw0YDRiyDQtNC70Y8g0YPQtNCw0LvQtdC90LjRjzonLCBwcm9kdWN0c1RvUmVtb3ZlKTtcbiAgICAgICAgaWYgKHByb2R1Y3RzVG9SZW1vdmUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBwcm9kdWN0TmFtZSBvZiBwcm9kdWN0c1RvUmVtb3ZlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0KPQtNCw0LvRj9C10Lw6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucmVtb3ZlUHJvZHVjdEZyb21DYXJ0KHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdIOKckyDQntGH0LjRgdGC0LrQsCDQt9Cw0LLQtdGA0YjQtdC90LAnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCd0LXRgiDRgtC+0LLQsNGA0L7QsiDQtNC70Y8g0YPQtNCw0LvQtdC90LjRjycpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNhdmVUaWxkYUNhcnQodGlsZGFDYXJ0KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLmlzVXBkYXRpbmdDYXJ0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRpbGRhQ2FydC51cGRhdGVkID0gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCk7XG4gICAgICAgICAgICBjb25zdCBjYXJ0RGF0YSA9IHtcbiAgICAgICAgICAgICAgICBwcm9kdWN0czogdGlsZGFDYXJ0LnByb2R1Y3RzIHx8IFtdLFxuICAgICAgICAgICAgICAgIHByb2RhbW91bnQ6IHRpbGRhQ2FydC5wcm9kYW1vdW50IHx8IDAsXG4gICAgICAgICAgICAgICAgYW1vdW50OiB0aWxkYUNhcnQuYW1vdW50IHx8IDAsXG4gICAgICAgICAgICAgICAgdG90YWw6IHRpbGRhQ2FydC5wcm9kdWN0cz8ubGVuZ3RoIHx8IDAsXG4gICAgICAgICAgICAgICAgdXBkYXRlZDogdGlsZGFDYXJ0LnVwZGF0ZWQsXG4gICAgICAgICAgICAgICAgY3VycmVuY3k6IHRpbGRhQ2FydC5jdXJyZW5jeSB8fCBcItGALlwiLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5X3NpZGU6IHRpbGRhQ2FydC5jdXJyZW5jeV9zaWRlIHx8IFwiclwiLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5X3NlcDogdGlsZGFDYXJ0LmN1cnJlbmN5X3NlcCB8fCBcIixcIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV9kZWM6IHRpbGRhQ2FydC5jdXJyZW5jeV9kZWMgfHwgXCJcIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV90eHQ6IHRpbGRhQ2FydC5jdXJyZW5jeV90eHQgfHwgXCLRgC5cIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV90eHRfcjogdGlsZGFDYXJ0LmN1cnJlbmN5X3R4dF9yIHx8IFwiINGALlwiLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5X3R4dF9sOiB0aWxkYUNhcnQuY3VycmVuY3lfdHh0X2wgfHwgXCJcIixcbiAgICAgICAgICAgICAgICBzeXN0ZW06IHRpbGRhQ2FydC5zeXN0ZW0gfHwgXCJub25lXCIsXG4gICAgICAgICAgICAgICAgc2V0dGluZ3M6IHRpbGRhQ2FydC5zZXR0aW5ncyB8fCB7fSxcbiAgICAgICAgICAgICAgICBkZWxpdmVyeTogdGlsZGFDYXJ0LmRlbGl2ZXJ5IHx8IHsgbmFtZTogXCJub2RlbGl2ZXJ5XCIsIHByaWNlOiAwIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndGNhcnQnLCBKU09OLnN0cmluZ2lmeShjYXJ0RGF0YSkpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtzYXZlVGlsZGFDYXJ0XSDinJMg0JrQvtGA0LfQuNC90LAg0YHQvtGF0YDQsNC90LXQvdCwINCyIGxvY2FsU3RvcmFnZScpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc1VwZGF0aW5nQ2FydCA9IGZhbHNlO1xuICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbc2F2ZVRpbGRhQ2FydF0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPOicsIGUpO1xuICAgICAgICAgICAgdGhpcy5pc1VwZGF0aW5nQ2FydCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGluaXRDYXJ0T2JzZXJ2ZXIoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdENhcnRPYnNlcnZlcl0g0JjQvdC40YbQuNCw0LvQuNC30LDRhtC40Y8g0L3QsNCx0LvRjtC00LDRgtC10LvRjyDQutC+0YDQt9C40L3RiycpO1xuICAgICAgICBsZXQgbGFzdE1haW5Qcm9kdWN0c1F0eSA9IHRoaXMuZ2V0TWFpblByb2R1Y3RzUXVhbnRpdHkoKTtcbiAgICAgICAgY29uc3QgY2hlY2tDYXJ0Q2hhbmdlcyA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRRdHkgPSB0aGlzLmdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCk7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF0eSAhPT0gbGFzdE1haW5Qcm9kdWN0c1F0eSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2FydE9ic2VydmVyXSDQmNC30LzQtdC90LjQu9C+0YHRjCDQutC+0LvQuNGH0LXRgdGC0LLQviDRgtC+0LLQsNGA0L7QsjonLCB7XG4gICAgICAgICAgICAgICAgICAgINCx0YvQu9C+OiBsYXN0TWFpblByb2R1Y3RzUXR5LFxuICAgICAgICAgICAgICAgICAgICDRgdGC0LDQu9C+OiBjdXJyZW50UXR5XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbGFzdE1haW5Qcm9kdWN0c1F0eSA9IGN1cnJlbnRRdHk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBvYnNlcnZlQ2FydCA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNhcnRDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuQ0FSVF9DT05UQUlORVIpO1xuICAgICAgICAgICAgaWYgKGNhcnRDb250YWluZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjYXJ0T2JzZXJ2ZXJdIE11dGF0aW9uT2JzZXJ2ZXI6INC+0LHQvdCw0YDRg9C20LXQvdGLINC40LfQvNC10L3QtdC90LjRjycpO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1F0eSA9IHRoaXMuZ2V0TWFpblByb2R1Y3RzUXVhbnRpdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXdRdHkgIT09IGxhc3RNYWluUHJvZHVjdHNRdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0TWFpblByb2R1Y3RzUXR5ID0gbmV3UXR5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGNhcnRDb250YWluZXIsIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdENhcnRPYnNlcnZlcl0g4pyTIE11dGF0aW9uT2JzZXJ2ZXIg0YPRgdGC0LDQvdC+0LLQu9C10L0nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQob2JzZXJ2ZUNhcnQsIDEwMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBvYnNlcnZlQ2FydCgpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICAgICAgICAgIGNvbnN0IGRlbGV0ZUJ1dHRvbiA9IHRhcmdldC5jbG9zZXN0KERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9ERUxfQlVUVE9OKTtcbiAgICAgICAgICAgIGlmIChkZWxldGVCdXR0b24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0RWxlbWVudCA9IGRlbGV0ZUJ1dHRvbi5jbG9zZXN0KERPTV9TRUxFQ1RPUlMuQ0FSVF9QUk9EVUNUKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvZHVjdEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGl0bGVFbCA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoRE9NX1NFTEVDVE9SUy5QUk9EVUNUX1RJVExFKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdE5hbWUgPSB0aXRsZUVsPy50ZXh0Q29udGVudD8udHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvZHVjdE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2FydE9ic2VydmVyXSDQo9C00LDQu9C10L3QuNC1INGC0L7QstCw0YDQsDonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb24ocHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaXNDYXJ0QnV0dG9uID0gdGFyZ2V0LmNsb3Nlc3QoYCR7RE9NX1NFTEVDVE9SUy5QUk9EVUNUX1BMVVNfQlVUVE9OfSwgJHtET01fU0VMRUNUT1JTLlBST0RVQ1RfTUlOVVNfQlVUVE9OfSwgJHtET01fU0VMRUNUT1JTLlBST0RVQ1RfREVMX0JVVFRPTn1gKTtcbiAgICAgICAgICAgIGlmIChpc0NhcnRCdXR0b24pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0g0JrQu9C40Log0L3QsCDQutC90L7Qv9C60YMg0LrQvtGA0LfQuNC90YsnKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGNoZWNrQ2FydENoYW5nZXMoKSwgREVMQVlTLk9CU0VSVkVSX0NIRUNLKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHNldHVwTG9jYWxTdG9yYWdlSW50ZXJjZXB0b3IgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXdpbmRvdy5fX2NhcmRmb3JtX2xvY2Fsc3RvcmFnZV9pbnRlcmNlcHRlZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsU2V0SXRlbSA9IFN0b3JhZ2UucHJvdG90eXBlLnNldEl0ZW07XG4gICAgICAgICAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgU3RvcmFnZS5wcm90b3R5cGUuc2V0SXRlbSA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IG9yaWdpbmFsU2V0SXRlbS5hcHBseSh0aGlzLCBba2V5LCB2YWx1ZV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSAndGNhcnQnICYmICFzZWxmLmlzVXBkYXRpbmdDYXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0gbG9jYWxTdG9yYWdlIHRjYXJ0INC40LfQvNC10L3QtdC9INC40LfQstC90LUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gY2hlY2tDYXJ0Q2hhbmdlcygpLCBERUxBWVMuQ0FSVF9VUERBVEUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB3aW5kb3cuX19jYXJkZm9ybV9sb2NhbHN0b3JhZ2VfaW50ZXJjZXB0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdENhcnRPYnNlcnZlcl0g4pyTIGxvY2FsU3RvcmFnZS5zZXRJdGVtINC/0LXRgNC10YXQstCw0YfQtdC9Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XG4gICAgICAgICAgICBzZXR1cExvY2FsU3RvcmFnZUludGVyY2VwdG9yKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIHNldHVwTG9jYWxTdG9yYWdlSW50ZXJjZXB0b3IpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdENhcnRPYnNlcnZlcl0g4pyTINCd0LDQsdC70Y7QtNCw0YLQtdC70Lgg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90YsnKTtcbiAgICB9XG4gICAgaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbihwcm9kdWN0TmFtZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCf0YDQvtCy0LXRgNC60LAg0YLQvtCy0LDRgNCwOicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgZm9yIChjb25zdCBba2V5LCBzdGF0ZV0gb2YgdGhpcy5hY3Rpb25zU3RhdGVzKSB7XG4gICAgICAgICAgICBpZiAoc3RhdGUuYWN0aW9uICYmIHN0YXRlLmFjdGlvbi52YWx1ZSA9PT0gcHJvZHVjdE5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCi0L7QstCw0YAg0LjQtyDQv9GA0LDQstC40LvQsCDQvdCw0LnQtNC10L06Jywge1xuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZToga2V5LFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHN0YXRlLmFjdGlvbi52YWx1ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGxldCBmb3VuZEVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsbElucHV0cyA9IHRoaXMuZm9ybS5xdWVyeVNlbGVjdG9yQWxsKCdpbnB1dCwgc2VsZWN0Jyk7XG4gICAgICAgICAgICAgICAgYWxsSW5wdXRzLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWwgPSBlbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAoKGVsLnR5cGUgPT09ICdyYWRpbycgfHwgZWwudHlwZSA9PT0gJ2NoZWNrYm94JykgJiYgZWwudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbC52YWx1ZS50cmltKCkgPT09IHN0YXRlLmFjdGlvbi52YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZEVsZW1lbnQgPSBlbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCd0LDQudC00LXQvSDRjdC70LXQvNC10L3RgjonLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGVsLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBlbC52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZDogZWwuY2hlY2tlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCh0L3QuNC80LDQtdC8INCy0YvQsdC+0YAg0YE6JywgZm91bmRFbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgZm91bmRFbGVtZW50LmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dIOKckyDQn9GA0LDQstC40LvQviDQvtGC0LzQtdC90LXQvdC+LCBjaGVja2JveCDRgdC90Y/RgicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCt0LvQtdC80LXQvdGCINGE0L7RgNC80Ysg0L3QtSDQvdCw0LnQtNC10L0g0LTQu9GPOicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uVmFsdWU6IHN0YXRlLmFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZUlucHV0czogQXJyYXkuZnJvbShhbGxJbnB1dHMpLm1hcChlbCA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGVsLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGVsLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIHVwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5KCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDQndCw0YfQsNC70L4g0L7QsdC90L7QstC70LXQvdC40Y8g0LrQvtC70LjRh9C10YHRgtCy0LAnKTtcbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAoIXRpbGRhQ2FydCB8fCAhQXJyYXkuaXNBcnJheSh0aWxkYUNhcnQucHJvZHVjdHMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCa0L7RgNC30LjQvdCwINC90LXQtNC+0YHRgtGD0L/QvdCwJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0JDQutGC0LjQstC90YvRhSDQv9GA0LDQstC40Ls6JywgdGhpcy5hY3Rpb25zU3RhdGVzLnNpemUpO1xuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHN0YXRlXSBvZiB0aGlzLmFjdGlvbnNTdGF0ZXMpIHtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5hY3Rpb24gJiYgc3RhdGUuYWN0aW9uLnF1YW50aXR5VHlwZSA9PT0gJ3BlclByb2R1Y3QnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3UXVhbnRpdHkgPSB0aGlzLmNhbGN1bGF0ZVJ1bGVQcm9kdWN0UXVhbnRpdHkoc3RhdGUuYWN0aW9uKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0SW5kZXggPSB0aWxkYUNhcnQucHJvZHVjdHMuZmluZEluZGV4KChwKSA9PiBwLm5hbWU/LnRyaW0oKSA9PT0gc3RhdGUuYWN0aW9uLnZhbHVlLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkUXVhbnRpdHkgPSBwYXJzZUludCh0aWxkYUNhcnQucHJvZHVjdHNbcHJvZHVjdEluZGV4XS5xdWFudGl0eSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCi0L7QstCw0YAgXCIke3N0YXRlLmFjdGlvbi52YWx1ZX1cIjpgLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRRdWFudGl0eTogb2xkUXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdRdWFudGl0eTogbmV3UXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICBuZWVkc1VwZGF0ZTogb2xkUXVhbnRpdHkgIT09IG5ld1F1YW50aXR5XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAob2xkUXVhbnRpdHkgIT09IG5ld1F1YW50aXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDimqEg0J7QsdC90L7QstC70Y/QtdC8INGH0LXRgNC10LcgdGNhcnRfX3Byb2R1Y3RfX3VwZGF0ZVF1YW50aXR5Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcHJvZHVjdEVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCAxMDsgYXR0ZW1wdCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdEVsZW1lbnQgPSBDYXJ0VXRpbHMuZmluZFByb2R1Y3RFbGVtZW50KHN0YXRlLmFjdGlvbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCt0LvQtdC80LXQvdGCINC90LDQudC00LXQvSDQvdCwINC/0L7Qv9GL0YLQutC1OicsIGF0dGVtcHQgKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRlbXB0IDwgOSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuRE9NX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcXVhbnRpdHlFbGVtZW50ID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLlBST0RVQ1RfUVVBTlRJVFkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChxdWFudGl0eUVsZW1lbnQgJiYgdHlwZW9mIHdpbmRvdy50Y2FydF9fcHJvZHVjdF9fdXBkYXRlUXVhbnRpdHkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnRjYXJ0X19wcm9kdWN0X191cGRhdGVRdWFudGl0eShxdWFudGl0eUVsZW1lbnQsIHByb2R1Y3RFbGVtZW50LCBwcm9kdWN0SW5kZXgsIG5ld1F1YW50aXR5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g4pyTINCa0L7Qu9C40YfQtdGB0YLQstC+INC+0LHQvdC+0LLQu9C10L3QviDRh9C10YDQtdC3IFRpbGRhIEFQSTonLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRRdWFudGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1F1YW50aXR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuRE9NX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsdXNNaW51c0J1dHRvbnMgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9QTFVTTUlOVVMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGx1c01pbnVzQnV0dG9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1c01pbnVzQnV0dG9ucy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCd0LUg0L3QsNC50LTQtdC9IHF1YW50aXR5RWxlbWVudCDQuNC70Lgg0YTRg9C90LrRhtC40Y8gdXBkYXRlUXVhbnRpdHknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCd0LUg0L3QsNC50LTQtdC9IERPTSDRjdC70LXQvNC10L3RgiDRgtC+0LLQsNGA0LAg0L/QvtGB0LvQtSDQvtC20LjQtNCw0L3QuNGPJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0KLQvtCy0LDRgCBcIiR7c3RhdGUuYWN0aW9uLnZhbHVlfVwiINCd0JUg0L3QsNC50LTQtdC9INCyINC60L7RgNC30LjQvdC1YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldIOKckyDQntCx0L3QvtCy0LvQtdC90LjQtSDQt9Cw0LLQtdGA0YjQtdC90L4nKTtcbiAgICB9XG4gICAgdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NKHByb2R1Y3ROYW1lLCBuZXdRdWFudGl0eSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g0J7QsdC90L7QstC70LXQvdC40LU6JywgeyBwcm9kdWN0TmFtZSwgbmV3UXVhbnRpdHkgfSk7XG4gICAgICAgIGNvbnN0IHRpdGxlU2VsZWN0b3JzID0gW1xuICAgICAgICAgICAgJy50NzA2X19wcm9kdWN0LXRpdGxlJyxcbiAgICAgICAgICAgICcudC1zdG9yZV9fcHJvZHVjdC1uYW1lJyxcbiAgICAgICAgICAgICcudC1wcm9kdWN0X190aXRsZScsXG4gICAgICAgICAgICAnLmpzLXByb2R1Y3QtbmFtZSdcbiAgICAgICAgXTtcbiAgICAgICAgbGV0IHByb2R1Y3RFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiB0aXRsZVNlbGVjdG9ycykge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdFRpdGxlcyA9IFsuLi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKV07XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g0J/QvtC40YHQuiDRh9C10YDQtdC3IFwiJHtzZWxlY3Rvcn1cIjpgLCBwcm9kdWN0VGl0bGVzLmxlbmd0aCwgJ9GN0LvQtdC80LXQvdGC0L7QsicpO1xuICAgICAgICAgICAgY29uc3QgZm91bmRFbGVtZW50ID0gcHJvZHVjdFRpdGxlcy5maW5kKGVsID0+IGVsLmlubmVyVGV4dC50cmltKCkgPT09IHByb2R1Y3ROYW1lLnRyaW0oKSk7XG4gICAgICAgICAgICBpZiAoZm91bmRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgcHJvZHVjdEVsZW1lbnQgPSBmb3VuZEVsZW1lbnQuY2xvc2VzdCgnLnQ3MDZfX2NhcnR3aW4tcHJvZHVjdCwgLnQtc3RvcmVfX3Byb2R1Y3QsIC50LXByb2R1Y3QnKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvZHVjdEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dIOKckyDQotC+0LLQsNGAINC90LDQudC00LXQvSDRh9C10YDQtdC3OicsIHNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghcHJvZHVjdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dIOKclyDQrdC70LXQvNC10L3RgiDRgtC+0LLQsNGA0LAg0J3QlSDQvdCw0LnQtNC10L0g0LIgRE9NOicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDQktGB0LUg0YLQvtCy0LDRgNGLINCyIERPTTonLCBbLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnQ3MDZfX3Byb2R1Y3QtdGl0bGUsIC50LXN0b3JlX19wcm9kdWN0LW5hbWUnKV0ubWFwKChlbCkgPT4gZWwuaW5uZXJUZXh0KSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVhbnRpdHlJbnB1dFNlbGVjdG9ycyA9IFtcbiAgICAgICAgICAgICcudDcwNl9fcHJvZHVjdC1xdWFudGl0eScsXG4gICAgICAgICAgICAnLnQtc3RvcmVfX3F1YW50aXR5LWlucHV0JyxcbiAgICAgICAgICAgICdpbnB1dFtuYW1lPVwicXVhbnRpdHlcIl0nLFxuICAgICAgICAgICAgJy5qcy1wcm9kdWN0LXF1YW50aXR5J1xuICAgICAgICBdO1xuICAgICAgICBsZXQgcXVhbnRpdHlJbnB1dCA9IG51bGw7XG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgcXVhbnRpdHlJbnB1dFNlbGVjdG9ycykge1xuICAgICAgICAgICAgcXVhbnRpdHlJbnB1dCA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICAgICAgaWYgKHF1YW50aXR5SW5wdXQpIHtcbiAgICAgICAgICAgICAgICBxdWFudGl0eUlucHV0LnZhbHVlID0gbmV3UXVhbnRpdHkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICBxdWFudGl0eUlucHV0LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdjaGFuZ2UnLCB7IGJ1YmJsZXM6IHRydWUgfSkpO1xuICAgICAgICAgICAgICAgIHF1YW50aXR5SW5wdXQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2lucHV0JywgeyBidWJibGVzOiB0cnVlIH0pKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g4pyTINCe0LHQvdC+0LLQu9C10L0gaW5wdXQg0YfQtdGA0LXQtzonLCBzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVhbnRpdHlEaXNwbGF5U2VsZWN0b3JzID0gW1xuICAgICAgICAgICAgJy50LXF1YW50aXR5X192YWx1ZScsXG4gICAgICAgICAgICAnLnQ3MDZfX3Byb2R1Y3QtcXVhbnRpdHktdmFsdWUnLFxuICAgICAgICAgICAgJy50LXN0b3JlX19xdWFudGl0eS12YWx1ZSdcbiAgICAgICAgXTtcbiAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBxdWFudGl0eURpc3BsYXlTZWxlY3RvcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHF1YW50aXR5RGlzcGxheSA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICAgICAgaWYgKHF1YW50aXR5RGlzcGxheSkge1xuICAgICAgICAgICAgICAgIHF1YW50aXR5RGlzcGxheS50ZXh0Q29udGVudCA9IG5ld1F1YW50aXR5LnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dIOKckyDQntCx0L3QvtCy0LvQtdC9IGRpc3BsYXkg0YfQtdGA0LXQtzonLCBzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAodGlsZGFDYXJ0KSB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGlsZGFDYXJ0LnByb2R1Y3RzLmZpbmQoKHApID0+IHAubmFtZT8udHJpbSgpID09PSBwcm9kdWN0TmFtZS50cmltKCkpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3QpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbFByaWNlID0gcGFyc2VGbG9hdChwcm9kdWN0LnByaWNlKSAqIG5ld1F1YW50aXR5O1xuICAgICAgICAgICAgICAgIGNvbnN0IHByaWNlU2VsZWN0b3JzID0gW1xuICAgICAgICAgICAgICAgICAgICAnLnQ3MDZfX3Byb2R1Y3QtcHJpY2UnLFxuICAgICAgICAgICAgICAgICAgICAnLnQtc3RvcmVfX3Byb2R1Y3QtcHJpY2UnLFxuICAgICAgICAgICAgICAgICAgICAnLnQtcHJvZHVjdF9fcHJpY2UnLFxuICAgICAgICAgICAgICAgICAgICAnLmpzLXByb2R1Y3QtcHJpY2UnXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHByaWNlU2VsZWN0b3JzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByaWNlRWxlbWVudCA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJpY2VFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmljZUVsZW1lbnQudGV4dENvbnRlbnQgPSBgJHt0b3RhbFByaWNlLnRvTG9jYWxlU3RyaW5nKCdydS1SVScpfSAke3RpbGRhQ2FydC5jdXJyZW5jeV90eHRfciB8fCAnINGALid9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDinJMg0J7QsdC90L7QstC70LXQvdCwINGB0YLQvtC40LzQvtGB0YLRjCDRh9C10YDQtdC3OicsIHNlbGVjdG9yLCB0b3RhbFByaWNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDinJMg0J7QsdC90L7QstC70LXQvdC40LUg0LfQsNCy0LXRgNGI0LXQvdC+INC00LvRjzonLCBwcm9kdWN0TmFtZSk7XG4gICAgfVxuICAgIHVwZGF0ZUFsbENhcnRJdGVtc0luRE9NKCkge1xuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICghdGlsZGFDYXJ0IHx8ICFBcnJheS5pc0FycmF5KHRpbGRhQ2FydC5wcm9kdWN0cykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFt1cGRhdGVBbGxDYXJ0SXRlbXNJbkRPTV0g0JrQvtGA0LfQuNC90LAg0L3QtdC00L7RgdGC0YPQv9C90LAnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUFsbENhcnRJdGVtc0luRE9NXSDQntCx0L3QvtCy0LvRj9C10Lwg0LLRgdC1INGC0L7QstCw0YDRiyDQsiBET00nKTtcbiAgICAgICAgdGlsZGFDYXJ0LnByb2R1Y3RzLmZvckVhY2goKHByb2R1Y3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3ROYW1lID0gcHJvZHVjdC5uYW1lPy50cmltKCk7XG4gICAgICAgICAgICBjb25zdCBxdWFudGl0eSA9IHBhcnNlSW50KHByb2R1Y3QucXVhbnRpdHkgfHwgMSk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdE5hbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTShwcm9kdWN0TmFtZSwgcXVhbnRpdHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVBbGxDYXJ0SXRlbXNJbkRPTV0g4pyTINCS0YHQtSDRgtC+0LLQsNGA0Ysg0L7QsdC90L7QstC70LXQvdGLJyk7XG4gICAgfVxuICAgIHJlZnJlc2hDYXJ0VUkoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbcmVmcmVzaENhcnRVSV0g0J3QsNGH0LDQu9C+INC+0LHQvdC+0LLQu9C10L3QuNGPIFVJINC60L7RgNC30LjQvdGLJyk7XG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93LnRfc3RvcmVfX3JlZnJlc2hjYXJ0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB3aW5kb3cudF9zdG9yZV9fcmVmcmVzaGNhcnQoKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbcmVmcmVzaENhcnRVSV0g4pyTINCS0YvQt9Cy0LDQvSB0X3N0b3JlX19yZWZyZXNoY2FydCcpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlZnJlc2hGdW5jdGlvbnMgPSBbXG4gICAgICAgICAgICAndDcwNl9fdXBkYXRlQ2FydCcsXG4gICAgICAgICAgICAndGNhcnRfX3VwZGF0ZUNhcnQnLFxuICAgICAgICAgICAgJ3Rfc3RvcmVfX3VwZGF0ZUNhcnQnLFxuICAgICAgICAgICAgJ3Q3MDZfaW5pdCdcbiAgICAgICAgXTtcbiAgICAgICAgcmVmcmVzaEZ1bmN0aW9ucy5mb3JFYWNoKGZ1bmNOYW1lID0+IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93W2Z1bmNOYW1lXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvd1tmdW5jTmFtZV0oKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtyZWZyZXNoQ2FydFVJXSDinJMg0JLRi9C30LLQsNC9ICR7ZnVuY05hbWV9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2Zvcm1dIFtyZWZyZXNoQ2FydFVJXSDQntGI0LjQsdC60LAgJHtmdW5jTmFtZX06YCwgZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy51cGRhdGVBbGxDYXJ0SXRlbXNJbkRPTSgpO1xuICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2NhcnQtdXBkYXRlZCcpKTtcbiAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ3RjYXJ0LXVwZGF0ZWQnKSk7XG4gICAgICAgIHRoaXMudXBkYXRlQ2FydENvdW50ZXJzKCk7XG4gICAgfVxuICAgIHVwZGF0ZUNhcnRDb3VudGVycygpIHtcbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAoIXRpbGRhQ2FydClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgY2FydENvdW50ZXJzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChET01fU0VMRUNUT1JTLkNBUlRfQ09VTlRFUik7XG4gICAgICAgIGNhcnRDb3VudGVycy5mb3JFYWNoKGNvdW50ZXIgPT4ge1xuICAgICAgICAgICAgaWYgKGNvdW50ZXIpIHtcbiAgICAgICAgICAgICAgICBjb3VudGVyLnRleHRDb250ZW50ID0gdGlsZGFDYXJ0LnRvdGFsLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBjYXJ0QW1vdW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoRE9NX1NFTEVDVE9SUy5DQVJUX0FNT1VOVCk7XG4gICAgICAgIGNhcnRBbW91bnRzLmZvckVhY2goYW1vdW50ID0+IHtcbiAgICAgICAgICAgIGlmIChhbW91bnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtYXR0ZWRBbW91bnQgPSB0aWxkYUNhcnQuYW1vdW50LnRvTG9jYWxlU3RyaW5nKCdydS1SVScpO1xuICAgICAgICAgICAgICAgIGFtb3VudC50ZXh0Q29udGVudCA9IGAke2Zvcm1hdHRlZEFtb3VudH0gJHt0aWxkYUNhcnQuY3VycmVuY3lfdHh0X3IgfHwgJyDRgC4nfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRDb3VudGVyc10g4pyTINCh0YfQtdGC0YfQuNC60Lgg0L7QsdC90L7QstC70LXQvdGLJyk7XG4gICAgfVxuICAgIGdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCkge1xuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICghdGlsZGFDYXJ0IHx8ICFBcnJheS5pc0FycmF5KHRpbGRhQ2FydC5wcm9kdWN0cykpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJ1bGVQcm9kdWN0TmFtZXMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMucnVsZXMuZm9yRWFjaChydWxlID0+IHtcbiAgICAgICAgICAgIHJ1bGUuYWN0aW9ucy5mb3JFYWNoKGFjdGlvbiA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBydWxlUHJvZHVjdE5hbWVzLmFkZChhY3Rpb24udmFsdWUudHJpbSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGxldCB0b3RhbFF1YW50aXR5ID0gMDtcbiAgICAgICAgY29uc3QgbWFpblByb2R1Y3RzID0gW107XG4gICAgICAgIHRpbGRhQ2FydC5wcm9kdWN0cy5mb3JFYWNoKChwcm9kdWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0TmFtZSA9IHByb2R1Y3QubmFtZT8udHJpbSgpO1xuICAgICAgICAgICAgY29uc3QgaXNSdWxlUHJvZHVjdCA9IHJ1bGVQcm9kdWN0TmFtZXMuaGFzKHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IHF0eSA9IHBhcnNlSW50KHByb2R1Y3QucXVhbnRpdHkgfHwgMSk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdE5hbWUgJiYgIWlzUnVsZVByb2R1Y3QpIHtcbiAgICAgICAgICAgICAgICB0b3RhbFF1YW50aXR5ICs9IHF0eTtcbiAgICAgICAgICAgICAgICBtYWluUHJvZHVjdHMucHVzaChgJHtwcm9kdWN0TmFtZX0gKCR7cXR5fSDRiNGCKWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtnZXRNYWluUHJvZHVjdHNRdWFudGl0eV0nLCB7XG4gICAgICAgICAgICAn0J7RgdC90L7QstC90YvRhSDRgtC+0LLQsNGA0L7Qsic6IHRvdGFsUXVhbnRpdHksXG4gICAgICAgICAgICAn0KHQv9C40YHQvtC6JzogbWFpblByb2R1Y3RzLFxuICAgICAgICAgICAgJ9Ci0L7QstCw0YDRiyDQv9GA0LDQstC40LsnOiBBcnJheS5mcm9tKHJ1bGVQcm9kdWN0TmFtZXMpXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdG90YWxRdWFudGl0eTtcbiAgICB9XG4gICAgY2FsY3VsYXRlUnVsZVByb2R1Y3RRdWFudGl0eShhY3Rpb24pIHtcbiAgICAgICAgaWYgKGFjdGlvbi5xdWFudGl0eSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gYWN0aW9uLnF1YW50aXR5O1xuICAgICAgICB9XG4gICAgICAgIGlmIChhY3Rpb24ucXVhbnRpdHlUeXBlID09PSAncGVyUHJvZHVjdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLm1heCgxLCB0aGlzLmdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBhc3luYyByZW1vdmVQcm9kdWN0RnJvbUNhcnQocHJvZHVjdE5hbWUpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtyZW1vdmVQcm9kdWN0XSDQn9C+0L/Ri9GC0LrQsCDRg9C00LDQu9C40YLRjDonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3RFbGVtZW50ID0gQ2FydFV0aWxzLmZpbmRQcm9kdWN0RWxlbWVudChwcm9kdWN0TmFtZSk7XG4gICAgICAgIGlmIChwcm9kdWN0RWxlbWVudCkge1xuICAgICAgICAgICAgY29uc3QgZGVsUHJvZHVjdEJ1dHRvbiA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoRE9NX1NFTEVDVE9SUy5QUk9EVUNUX0RFTF9CVVRUT04pO1xuICAgICAgICAgICAgaWYgKGRlbFByb2R1Y3RCdXR0b24pIHtcbiAgICAgICAgICAgICAgICBkZWxQcm9kdWN0QnV0dG9uLmNsaWNrKCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtyZW1vdmVQcm9kdWN0XSDinJMg0KPQtNCw0LvQtdC90L4g0YfQtdGA0LXQtyBET00gKNC60LvQuNC6KTonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgQ2FydFV0aWxzLndhaXQoREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICh0aWxkYUNhcnQgJiYgQXJyYXkuaXNBcnJheSh0aWxkYUNhcnQucHJvZHVjdHMpKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0SW5kZXggPSB0aWxkYUNhcnQucHJvZHVjdHMuZmluZEluZGV4KChwKSA9PiBwLm5hbWU/LnRyaW0oKSA9PT0gcHJvZHVjdE5hbWUudHJpbSgpKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0SW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRpbGRhQ2FydC5wcm9kdWN0c1twcm9kdWN0SW5kZXhdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlbW92ZUZ1bmN0aW9ucyA9IFtcbiAgICAgICAgICAgICAgICAgICAgJ3RjYXJ0X19yZW1vdmVQcm9kdWN0JyxcbiAgICAgICAgICAgICAgICAgICAgJ3RjYXJ0X3JlbW92ZVByb2R1Y3QnLFxuICAgICAgICAgICAgICAgICAgICAndF9zdG9yZV9fcmVtb3ZlUHJvZHVjdCdcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZnVuY05hbWUgb2YgcmVtb3ZlRnVuY3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93W2Z1bmNOYW1lXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3dbZnVuY05hbWVdKHByb2R1Y3QudWlkIHx8IHByb2R1Y3QuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbcmVtb3ZlUHJvZHVjdF0g4pyTINCj0LTQsNC70LXQvdC+INGH0LXRgNC10LcgJHtmdW5jTmFtZX06YCwgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IENhcnRVdGlscy53YWl0KERFTEFZUy5DQVJUX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2Zvcm1dIFtyZW1vdmVQcm9kdWN0XSDQntGI0LjQsdC60LAgJHtmdW5jTmFtZX06YCwgZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGlsZGFDYXJ0LnByb2R1Y3RzLnNwbGljZShwcm9kdWN0SW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIHRpbGRhQ2FydC5hbW91bnQgPSB0aWxkYUNhcnQucHJvZHVjdHMucmVkdWNlKChzdW0sIHApID0+IHN1bSArIChwYXJzZUZsb2F0KHAucHJpY2UpICogcGFyc2VJbnQocC5xdWFudGl0eSB8fCAxKSksIDApO1xuICAgICAgICAgICAgICAgIHRpbGRhQ2FydC5wcm9kYW1vdW50ID0gdGlsZGFDYXJ0LnByb2R1Y3RzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB0aWxkYUNhcnQudG90YWwgPSB0aWxkYUNhcnQucHJvZHVjdHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHRpbGRhQ2FydC51cGRhdGVkID0gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2F2ZVRpbGRhQ2FydCh0aWxkYUNhcnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LnRfc3RvcmVfX3JlZnJlc2hjYXJ0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cudF9zdG9yZV9fcmVmcmVzaGNhcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3JlbW92ZVByb2R1Y3RdIOKckyDQo9C00LDQu9C10L3QviDQvdCw0L/RgNGP0LzRg9GOINC40Lcg0LzQsNGB0YHQuNCy0LA6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuQ0FSVF9VUERBVEUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3JlbW92ZVByb2R1Y3RdIOKclyDQndC1INGD0LTQsNC70L7RgdGMINGD0LTQsNC70LjRgtGMINGC0L7QstCw0YA6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGFzeW5jIGFwcGx5QWN0aW9ucyhvbGRTdGF0ZSA9IG5ldyBNYXAoKSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0J3QsNGH0LDQu9C+INC/0YDQuNC80LXQvdC10L3QuNGPINC00LXQudGB0YLQstC40LknKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdINCh0YLQsNGA0L7QtSDRgdC+0YHRgtC+0Y/QvdC40LU6JywgT2JqZWN0LmZyb21FbnRyaWVzKG9sZFN0YXRlKSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQndC+0LLQvtC1INGB0L7RgdGC0L7Rj9C90LjQtTonLCBPYmplY3QuZnJvbUVudHJpZXModGhpcy5hY3Rpb25zU3RhdGVzKSk7XG4gICAgICAgIGNvbnN0IGNhcnRMb2FkZWQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChbLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLnQ3MDZfX3Byb2R1Y3QtdGl0bGVgKV0ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUoZmFsc2UpLCAzMDAwKSlcbiAgICAgICAgXSk7XG4gICAgICAgIGlmICghY2FydExvYWRlZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0JrQvtGA0LfQuNC90LAg0L3QtSDQt9Cw0LPRgNGD0LfQuNC70LDRgdGMINC30LAgMyDRgdC10LrRg9C90LTRiywg0L/RgNC+0LTQvtC70LbQsNC10LwnKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHN0YXRlXSBvZiB0aGlzLmFjdGlvbnNTdGF0ZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IG9sZFZhbHVlID0gb2xkU3RhdGUuZ2V0KGtleSk/LnZhbHVlO1xuICAgICAgICAgICAgY29uc3Qgb2xkQWN0aW9uID0gb2xkU3RhdGUuZ2V0KGtleSk/LmFjdGlvbjtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbYXBwbHlBY3Rpb25zXSDQntCx0YDQsNCx0L7RgtC60LAg0L/QvtC70Y8gXCIke2tleX1cIjpgLCB7XG4gICAgICAgICAgICAgICAgb2xkVmFsdWUsXG4gICAgICAgICAgICAgICAgbmV3VmFsdWU6IHN0YXRlLnZhbHVlLFxuICAgICAgICAgICAgICAgIG9sZEFjdGlvbjogb2xkQWN0aW9uPy52YWx1ZSxcbiAgICAgICAgICAgICAgICBuZXdBY3Rpb246IHN0YXRlLmFjdGlvbj8udmFsdWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHN0YXRlLnZhbHVlICE9PSBvbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmIChvbGRBY3Rpb24gJiYgb2xkQWN0aW9uLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQo9C00LDQu9GP0LXQvCDRgdGC0LDRgNGL0Lkg0YLQvtCy0LDRgDonLCBvbGRBY3Rpb24udmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlbW92ZVByb2R1Y3RGcm9tQ2FydChvbGRBY3Rpb24udmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUudmFsdWUgJiYgc3RhdGUuYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RJZCA9IGBydWxlXyR7a2V5fV8ke0RhdGUubm93KCl9YDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdFF1YW50aXR5ID0gdGhpcy5jYWxjdWxhdGVSdWxlUHJvZHVjdFF1YW50aXR5KHN0YXRlLmFjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQlNC+0LHQsNCy0LvRj9C10Lwg0L3QvtCy0YvQuSDRgtC+0LLQsNGAOicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBwcm9kdWN0SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmljZTogc3RhdGUuYWN0aW9uLnN1bSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgcXVhbnRpdHk6IHByb2R1Y3RRdWFudGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXR5VHlwZTogc3RhdGUuYWN0aW9uLnF1YW50aXR5VHlwZSB8fCAnZml4ZWQnXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cudGNhcnRfX2FkZFByb2R1Y3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHByb2R1Y3RJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHN0YXRlLmFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaWNlOiBzdGF0ZS5hY3Rpb24uc3VtIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWFudGl0eTogcHJvZHVjdFF1YW50aXR5LFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hhbmdlUHJvZHVjdCA9IGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hhbmdlUHJvZHVjdCA9IFsuLi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAudDcwNl9fcHJvZHVjdC10aXRsZWApXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgoZSkgPT4gZS5pbm5lclRleHQudHJpbSgpID09PSBzdGF0ZS5hY3Rpb24udmFsdWUudHJpbSgpKT8ucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGNoYW5nZVByb2R1Y3QgfHwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hhbmdlUHJvZHVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hhbmdlUHJvZHVjdEJ1dHRvbiA9IGNoYW5nZVByb2R1Y3QucXVlcnlTZWxlY3RvcihgLnQ3MDZfX3Byb2R1Y3QtcGx1c21pbnVzYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hhbmdlUHJvZHVjdEJ1dHRvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZVByb2R1Y3RCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g4pyTINCh0LrRgNGL0YLRiyDQutC90L7Qv9C60Lgg0LrQvtC70LjRh9C10YHRgtCy0LAnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICghc3RhdGUudmFsdWUgfHwgIXN0YXRlLmFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0JfQvdCw0YfQtdC90LjQtSDRgdCx0YDQvtGI0LXQvdC+LCDRgtC+0LLQsNGAINGD0LTQsNC70LXQvScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g4pyTINCf0YDQuNC80LXQvdC10L3QuNC1INC00LXQudGB0YLQstC40Lkg0LfQsNCy0LXRgNGI0LXQvdC+Jyk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgRWRpdG9yU3RvcmFnZU1hbmFnZXIgfSBmcm9tICcuLi9tYW5hZ2Vycy9FZGl0b3JTdG9yYWdlTWFuYWdlcic7XG5pbXBvcnQgeyBMYXlvdXQgfSBmcm9tICcuLi9tb2RlbHMvTGF5b3V0JztcbmltcG9ydCB7IGdldExhc3RDaGlsZCB9IGZyb20gJy4uL3V0aWxzL3RpbGRhVXRpbHMnO1xuaW1wb3J0IHsgVHlwZWRFdmVudEVtaXR0ZXIgfSBmcm9tICcuLi91dGlscy9UeXBlZEV2ZW50RW1pdHRlcic7XG5pbXBvcnQgeyBnZW5lcmF0ZUltYWdlLCBjcmVhdGVQcm9kdWN0IH0gZnJvbSAnLi4vdXRpbHMvYXBpJztcbmNvbnN0IENPTlNUQU5UUyA9IHtcbiAgICBTVEFURV9FWFBJUkFUSU9OX0RBWVM6IDMwLFxuICAgIENBTlZBU19BUkVBX0hFSUdIVDogNjAwLFxuICAgIExPQURJTkdfSU5URVJWQUxfTVM6IDEwMCxcbn07XG5jb25zdCBBUElfRU5EUE9JTlRTID0ge1xuICAgIFdFQkhPT0tfQ0FSVDogJ2h0dHBzOi8vcHJpbWFyeS1wcm9kdWN0aW9uLTY1NGMudXAucmFpbHdheS5hcHAvd2ViaG9vay9jYXJ0JyxcbiAgICBVUExPQURfSU1BR0U6ICdodHRwczovLzE4MDQ2MzMtaW1hZ2UuZmwuZ3JpZGVzay5ydS91cGxvYWQnLFxuICAgIFdFQkhPT0tfUkVRVUVTVDogJ2h0dHBzOi8vcHJpbWFyeS1wcm9kdWN0aW9uLTY1NGMudXAucmFpbHdheS5hcHAvd2ViaG9vay9yZXF1ZXN0Jyxcbn07XG5leHBvcnQgdmFyIEVkaXRvckV2ZW50VHlwZTtcbihmdW5jdGlvbiAoRWRpdG9yRXZlbnRUeXBlKSB7XG4gICAgRWRpdG9yRXZlbnRUeXBlW1wiTU9DS1VQX0xPQURJTkdcIl0gPSBcIm1vY2t1cC1sb2FkaW5nXCI7XG4gICAgRWRpdG9yRXZlbnRUeXBlW1wiTU9DS1VQX1VQREFURURcIl0gPSBcIm1vY2t1cC11cGRhdGVkXCI7XG4gICAgRWRpdG9yRXZlbnRUeXBlW1wiTE9BRElOR19USU1FX1VQREFURURcIl0gPSBcImxvYWRpbmctdGltZS11cGRhdGVkXCI7XG4gICAgRWRpdG9yRXZlbnRUeXBlW1wiU1RBVEVfQ0hBTkdFRFwiXSA9IFwic3RhdGUtY2hhbmdlZFwiO1xuICAgIEVkaXRvckV2ZW50VHlwZVtcIkxBWU9VVF9BRERFRFwiXSA9IFwibGF5b3V0LWFkZGVkXCI7XG4gICAgRWRpdG9yRXZlbnRUeXBlW1wiTEFZT1VUX1JFTU9WRURcIl0gPSBcImxheW91dC1yZW1vdmVkXCI7XG4gICAgRWRpdG9yRXZlbnRUeXBlW1wiTEFZT1VUX1VQREFURURcIl0gPSBcImxheW91dC11cGRhdGVkXCI7XG59KShFZGl0b3JFdmVudFR5cGUgfHwgKEVkaXRvckV2ZW50VHlwZSA9IHt9KSk7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFZGl0b3Ige1xuICAgIGdldCBzZWxlY3RUeXBlKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0VHlwZTsgfVxuICAgIGdldCBzZWxlY3RDb2xvcigpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdENvbG9yOyB9XG4gICAgZ2V0IHNlbGVjdFNpZGUoKSB7IHJldHVybiB0aGlzLl9zZWxlY3RTaWRlOyB9XG4gICAgZ2V0IHNlbGVjdFNpemUoKSB7IHJldHVybiB0aGlzLl9zZWxlY3RTaXplOyB9XG4gICAgZ2V0IHNlbGVjdExheW91dCgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdExheW91dDsgfVxuICAgIGNvbnN0cnVjdG9yKHsgYmxvY2tzLCBwcm9kdWN0Q29uZmlncywgZm9ybUNvbmZpZyB9KSB7XG4gICAgICAgIHRoaXMucXVhbnRpdHlGb3JtQmxvY2sgPSBudWxsO1xuICAgICAgICB0aGlzLmZvcm1CbG9jayA9IG51bGw7XG4gICAgICAgIHRoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lID0gbnVsbDtcbiAgICAgICAgdGhpcy5mb3JtQnV0dG9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5fc2VsZWN0TGF5b3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5sYXlvdXRzID0gW107XG4gICAgICAgIHRoaXMuY2FudmFzZXMgPSBbXTtcbiAgICAgICAgdGhpcy5sYXllcnNDYW52YXNlcyA9IFtdO1xuICAgICAgICB0aGlzLmFjdGl2ZUNhbnZhcyA9IG51bGw7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IFR5cGVkRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMubGF5ZXJzSGlzdG9yeSA9IFtdO1xuICAgICAgICB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPSAtMTtcbiAgICAgICAgdGhpcy5pc1Jlc3RvcmluZ0Zyb21IaXN0b3J5ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pc0FkZGluZ1RvQ2FydCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzR2VuZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxvYWRpbmdUaW1lID0gMDtcbiAgICAgICAgdGhpcy5sb2FkaW5nSW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICB0aGlzLmNvbG9yQmxvY2tzID0gW107XG4gICAgICAgIHRoaXMuc2l6ZUJsb2NrcyA9IFtdO1xuICAgICAgICB0aGlzLnByb2R1Y3RCbG9ja3MgPSBbXTtcbiAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBudWxsO1xuICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbWFnZUNhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmxvYWRpbmdFbGVtZW50c0NhY2hlID0ge307XG4gICAgICAgIHRoaXMucHJvZHVjdENhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLm1vY2t1cENhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICBpZiAoIXByb2R1Y3RDb25maWdzIHx8IHByb2R1Y3RDb25maWdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbRWRpdG9yXSDQndC1INC/0YDQtdC00L7RgdGC0LDQstC70LXQvdGLINC60L7QvdGE0LjQs9GD0YDQsNGG0LjQuCDQv9GA0L7QtNGD0LrRgtC+0LInKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0b3JhZ2VNYW5hZ2VyID0gbmV3IEVkaXRvclN0b3JhZ2VNYW5hZ2VyKCk7XG4gICAgICAgIHRoaXMucHJvZHVjdENvbmZpZ3MgPSBwcm9kdWN0Q29uZmlncztcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jayA9IHRoaXMuZ2V0UmVxdWlyZWRFbGVtZW50KGJsb2Nrcy5lZGl0b3JCbG9ja0NsYXNzKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VTaWRlQnV0dG9uID0gdGhpcy5nZXRSZXF1aXJlZEVsZW1lbnQoYmxvY2tzLmNoYW5nZVNpZGVCdXR0b25DbGFzcyk7XG4gICAgICAgIHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jayA9IHRoaXMuZ2V0UmVxdWlyZWRFbGVtZW50KGJsb2Nrcy5lZGl0b3JIaXN0b3J5VW5kb0Jsb2NrQ2xhc3MpO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2sgPSB0aGlzLmdldFJlcXVpcmVkRWxlbWVudChibG9ja3MuZWRpdG9ySGlzdG9yeVJlZG9CbG9ja0NsYXNzKTtcbiAgICAgICAgdGhpcy5xdWFudGl0eUZvcm1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclF1YW50aXR5Rm9ybUJsb2NrQ2xhc3MpO1xuICAgICAgICBjb25zdCBwcm9kdWN0TGlzdEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MucHJvZHVjdExpc3RCbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKHByb2R1Y3RMaXN0QmxvY2spXG4gICAgICAgICAgICB0aGlzLnByb2R1Y3RMaXN0QmxvY2sgPSBwcm9kdWN0TGlzdEJsb2NrO1xuICAgICAgICBjb25zdCBwcm9kdWN0SXRlbUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MucHJvZHVjdEl0ZW1DbGFzcyk7XG4gICAgICAgIGlmIChwcm9kdWN0SXRlbUJsb2NrKVxuICAgICAgICAgICAgdGhpcy5wcm9kdWN0SXRlbUJsb2NrID0gcHJvZHVjdEl0ZW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yQ29sb3JzTGlzdEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yQ29sb3JzTGlzdEJsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yQ29sb3JzTGlzdEJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JDb2xvcnNMaXN0QmxvY2sgPSBlZGl0b3JDb2xvcnNMaXN0QmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvckNvbG9ySXRlbUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yQ29sb3JJdGVtQmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JDb2xvckl0ZW1CbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yQ29sb3JJdGVtQmxvY2sgPSBlZGl0b3JDb2xvckl0ZW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yU2l6ZXNMaXN0QmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JTaXplc0xpc3RCbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclNpemVzTGlzdEJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JTaXplc0xpc3RCbG9jayA9IGVkaXRvclNpemVzTGlzdEJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JTaXplSXRlbUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yU2l6ZUl0ZW1CbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclNpemVJdGVtQmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvclNpemVJdGVtQmxvY2sgPSBlZGl0b3JTaXplSXRlbUJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JMYXlvdXRzTGlzdEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yTGF5b3V0c0xpc3RCbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvckxheW91dHNMaXN0QmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2sgPSBlZGl0b3JMYXlvdXRzTGlzdEJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JMYXlvdXRJdGVtQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JMYXlvdXRJdGVtQmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9jayA9IGVkaXRvckxheW91dEl0ZW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbkNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclVwbG9hZEltYWdlQnV0dG9uKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbiA9IGVkaXRvclVwbG9hZEltYWdlQnV0dG9uO1xuICAgICAgICBjb25zdCBlZGl0b3JVcGxvYWRWaWV3QmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JVcGxvYWRWaWV3QmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvclVwbG9hZFZpZXdCbG9jayA9IGVkaXRvclVwbG9hZFZpZXdCbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRDYW5jZWxCdXR0b24gPSBlZGl0b3JVcGxvYWRDYW5jZWxCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvckxvYWRXaXRoQWlCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbiA9IGVkaXRvckxvYWRXaXRoQWlCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbiA9IGVkaXRvckxvYWRXaXRob3V0QWlCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvckFkZE9yZGVyQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yQWRkT3JkZXJCdXR0b25DbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JBZGRPcmRlckJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24gPSBlZGl0b3JBZGRPcmRlckJ1dHRvbjtcbiAgICAgICAgY29uc3QgZWRpdG9yU3VtQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JTdW1CbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclN1bUJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JTdW1CbG9jayA9IGVkaXRvclN1bUJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JQcm9kdWN0TmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclByb2R1Y3ROYW1lQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yUHJvZHVjdE5hbWUpXG4gICAgICAgICAgICB0aGlzLmVkaXRvclByb2R1Y3ROYW1lID0gZWRpdG9yUHJvZHVjdE5hbWU7XG4gICAgICAgIHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrVmlld0NsYXNzID0gYmxvY2tzLmVkaXRvckxheW91dEl0ZW1CbG9ja1ZpZXdDbGFzcztcbiAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tOYW1lQ2xhc3MgPSBibG9ja3MuZWRpdG9yTGF5b3V0SXRlbUJsb2NrTmFtZUNsYXNzO1xuICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja1JlbW92ZUNsYXNzID0gYmxvY2tzLmVkaXRvckxheW91dEl0ZW1CbG9ja1JlbW92ZUNsYXNzO1xuICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja0VkaXRDbGFzcyA9IGJsb2Nrcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tFZGl0Q2xhc3M7XG4gICAgICAgIGlmIChmb3JtQ29uZmlnKSB7XG4gICAgICAgICAgICB0aGlzLmZvcm1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZm9ybUNvbmZpZy5mb3JtQmxvY2tDbGFzcyk7XG4gICAgICAgICAgICB0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSA9IGZvcm1Db25maWcuZm9ybUlucHV0VmFyaWFibGVOYW1lO1xuICAgICAgICAgICAgdGhpcy5mb3JtQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihmb3JtQ29uZmlnLmZvcm1CdXR0b25DbGFzcyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGVmYXVsdFByb2R1Y3QgPSBwcm9kdWN0Q29uZmlnc1swXTtcbiAgICAgICAgaWYgKCFkZWZhdWx0UHJvZHVjdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbRWRpdG9yXSDQndC1INC90LDQudC00LXQvSDQtNC10YTQvtC70YLQvdGL0Lkg0L/RgNC+0LTRg9C60YInKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkZWZhdWx0TW9ja3VwID0gZGVmYXVsdFByb2R1Y3QubW9ja3Vwc1swXTtcbiAgICAgICAgaWYgKCFkZWZhdWx0TW9ja3VwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tFZGl0b3JdINCd0LUg0L3QsNC50LTQtdC9INC00LXRhNC+0LvRgtC90YvQuSBtb2NrdXAnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zZWxlY3RDb2xvciA9IGRlZmF1bHRNb2NrdXAuY29sb3I7XG4gICAgICAgIHRoaXMuX3NlbGVjdFNpZGUgPSBkZWZhdWx0TW9ja3VwLnNpZGU7XG4gICAgICAgIHRoaXMuX3NlbGVjdFR5cGUgPSBkZWZhdWx0UHJvZHVjdC50eXBlO1xuICAgICAgICB0aGlzLl9zZWxlY3RTaXplID0gZGVmYXVsdFByb2R1Y3Quc2l6ZXM/LlswXSB8fCAnTSc7XG4gICAgICAgIHRoaXMuZWRpdG9yQmxvY2suc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgICAgICB0aGlzLmNyZWF0ZUJhY2tncm91bmRCbG9jaygpO1xuICAgICAgICB0aGlzLm1vY2t1cEJsb2NrID0gdGhpcy5jcmVhdGVNb2NrdXBCbG9jaygpO1xuICAgICAgICB0aGlzLmNhbnZhc2VzQ29udGFpbmVyID0gdGhpcy5jcmVhdGVDYW52YXNlc0NvbnRhaW5lcigpO1xuICAgICAgICB0aGlzLmVkaXRvckxvYWRpbmdCbG9jayA9IHRoaXMuY3JlYXRlRWRpdG9yTG9hZGluZ0Jsb2NrKCk7XG4gICAgICAgIHRoaXMuaW5pdEV2ZW50cygpO1xuICAgICAgICB0aGlzLmluaXRLZXlib2FyZFNob3J0Y3V0cygpO1xuICAgICAgICB0aGlzLmluaXRMb2FkaW5nRXZlbnRzKCk7XG4gICAgICAgIHRoaXMuaW5pdFVJQ29tcG9uZW50cygpO1xuICAgICAgICB0aGlzLmluaXRpYWxpemVFZGl0b3IoKTtcbiAgICAgICAgd2luZG93LmdldExheW91dHMgPSAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXRzLm1hcChsYXlvdXQgPT4gKHsgLi4ubGF5b3V0LCB1cmw6IHVuZGVmaW5lZCB9KSk7XG4gICAgICAgIH07XG4gICAgICAgIHdpbmRvdy5sb2FkTGF5b3V0cyA9IChsYXlvdXRzKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxheW91dHMgPSBsYXlvdXRzLm1hcChsYXlvdXQgPT4gTGF5b3V0LmZyb21KU09OKGxheW91dCkpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgIH07XG4gICAgICAgIHdpbmRvdy5leHBvcnRQcmludCA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGV4cG9ydGVkQXJ0ID0gYXdhaXQgdGhpcy5leHBvcnRBcnQoZmFsc2UsIDQwOTYpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBzaWRlIG9mIE9iamVjdC5rZXlzKGV4cG9ydGVkQXJ0KSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRvd25sb2FkTGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRvd25sb2FkTGluayk7XG4gICAgICAgICAgICAgICAgZG93bmxvYWRMaW5rLmhyZWYgPSBleHBvcnRlZEFydFtzaWRlXTtcbiAgICAgICAgICAgICAgICBkb3dubG9hZExpbmsudGFyZ2V0ID0gJ19zZWxmJztcbiAgICAgICAgICAgICAgICBkb3dubG9hZExpbmsuZG93bmxvYWQgPSBgJHtzaWRlfS5wbmdgO1xuICAgICAgICAgICAgICAgIGRvd25sb2FkTGluay5jbGljaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGV4cG9ydGVkQXJ0O1xuICAgICAgICB9O1xuICAgIH1cbiAgICBpbml0VUlDb21wb25lbnRzKCkge1xuICAgICAgICBpZiAodGhpcy5jaGFuZ2VTaWRlQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmNoYW5nZVNpZGVCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgdGhpcy5jaGFuZ2VTaWRlQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNoYW5nZVNpZGUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JIaXN0b3J5VW5kb0Jsb2NrKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRIaXN0b3J5VW5kb0Jsb2NrKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9ySGlzdG9yeVJlZG9CbG9jaykge1xuICAgICAgICAgICAgdGhpcy5pbml0SGlzdG9yeVJlZG9CbG9jaygpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnByb2R1Y3RMaXN0QmxvY2sgJiYgdGhpcy5wcm9kdWN0SXRlbUJsb2NrKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRQcm9kdWN0TGlzdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRBZGRPcmRlckJ1dHRvbigpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvclVwbG9hZEltYWdlQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRVcGxvYWRJbWFnZUJ1dHRvbigpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmZvcm1CbG9jayAmJiB0aGlzLmZvcm1CdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEZvcm0oKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5xdWFudGl0eUZvcm1CbG9jaykge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmluaXRGaXhRdWFudGl0eUZvcm0oKSwgNTAwKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JMYXlvdXRzTGlzdEJsb2NrKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0UmVxdWlyZWRFbGVtZW50KHNlbGVjdG9yKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFtFZGl0b3JdINCd0LUg0L3QsNC50LTQtdC9INC+0LHRj9C30LDRgtC10LvRjNC90YvQuSDRjdC70LXQvNC10L3RgjogJHtzZWxlY3Rvcn1gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG4gICAgYXN5bmMgaW5pdGlhbGl6ZUVkaXRvcigpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RvcmFnZU1hbmFnZXIud2FpdEZvclJlYWR5KCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWRTdGF0ZSgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wcmVsb2FkQWxsTW9ja3VwcygpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2VkaXRvcl0g0JjQvdC40YbQuNCw0LvQuNC30LDRhtC40Y8g0LfQsNCy0LXRgNGI0LXQvdCwJyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbZWRpdG9yXSDQntGI0LjQsdC60LAg0LjQvdC40YbQuNCw0LvQuNC30LDRhtC40Lg6JywgZXJyb3IpO1xuICAgICAgICAgICAgdGhpcy5pbml0aWFsaXplV2l0aERlZmF1bHRzKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgaW5pdGlhbGl6ZVdpdGhEZWZhdWx0cygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2VkaXRvcl0g0JjQvdC40YbQuNCw0LvQuNC30LDRhtC40Y8g0YEg0LTQtdGE0L7Qu9GC0L3Ri9C80Lgg0LfQvdCw0YfQtdC90LjRj9C80LgnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2VkaXRvcl0g0J7RiNC40LHQutCwINC30LDQs9GA0YPQt9C60LggbW9ja3VwINC/0L4g0YPQvNC+0LvRh9Cw0L3QuNGOOicsIGVycik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5pdEV2ZW50cygpIHtcbiAgICAgICAgd2luZG93Lm9uYmVmb3JldW5sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGFsZXJ0KFwi0JLRiyDRg9Cy0LXRgNC10L3Riywg0YfRgtC+INGF0L7RgtC40YLQtSDQv9C+0LrQuNC90YPRgtGMINGN0YLRgyDRgdGC0YDQsNC90LjRhtGDP1wiKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5ldmVudHMub24oRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9VUERBVEVELCAoZGF0YVVSTCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb2NrdXBCbG9jay5zcmMgPSBkYXRhVVJMO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaW5pdExvYWRpbmdFdmVudHMoKSB7XG4gICAgICAgIHRoaXMubG9hZGluZ0VsZW1lbnRzQ2FjaGUubG9hZGluZ1RleHQgPSB0aGlzLmVkaXRvckxvYWRpbmdCbG9jay5xdWVyeVNlbGVjdG9yKCcjbG9hZGluZy10ZXh0Jyk7XG4gICAgICAgIHRoaXMubG9hZGluZ0VsZW1lbnRzQ2FjaGUuc3Bpbm5lciA9IHRoaXMuZWRpdG9yTG9hZGluZ0Jsb2NrLnF1ZXJ5U2VsZWN0b3IoJyNzcGlubmVyJyk7XG4gICAgICAgIHRoaXMuZXZlbnRzLm9uKEVkaXRvckV2ZW50VHlwZS5MT0FESU5HX1RJTUVfVVBEQVRFRCwgKGxvYWRpbmdUaW1lKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB7IGxvYWRpbmdUZXh0LCBzcGlubmVyIH0gPSB0aGlzLmxvYWRpbmdFbGVtZW50c0NhY2hlO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNMb2FkaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9hZGluZ1RpbWUgPiA1KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nVGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRpbmdUZXh0LmlubmVyVGV4dCA9IGAkeyh0aGlzLmxvYWRpbmdUaW1lIC8gMTApLnRvRml4ZWQoMSl9YDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc3Bpbm5lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZGluZ0Jsb2NrLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjc0NSlcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nVGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc3Bpbm5lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDApXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmV2ZW50cy5vbihFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIChpc0xvYWRpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHsgbG9hZGluZ1RleHQsIHNwaW5uZXIgfSA9IHRoaXMubG9hZGluZ0VsZW1lbnRzQ2FjaGU7XG4gICAgICAgICAgICBpZiAoaXNMb2FkaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9hZGluZ0ludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5sb2FkaW5nSW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmdUaW1lID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLmlzTG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW21vY2t1cF0gbG9hZGluZyBtb2NrdXAnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmdJbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nVGltZSsrO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLkxPQURJTkdfVElNRV9VUERBVEVELCB0aGlzLmxvYWRpbmdUaW1lKTtcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDApXCI7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHNwaW5uZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9hZGluZ0ludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5sb2FkaW5nSW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmdJbnRlcnZhbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZ1RpbWUgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZW1pdCh0eXBlLCBkZXRhaWwpIHtcbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdCh0eXBlLCBkZXRhaWwpO1xuICAgIH1cbiAgICBpbml0S2V5Ym9hcmRTaG9ydGN1dHMoKSB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUVsZW1lbnQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgICAgICAgICAgY29uc3QgaXNJbnB1dEZpZWxkID0gYWN0aXZlRWxlbWVudCAmJiAoYWN0aXZlRWxlbWVudC50YWdOYW1lID09PSAnSU5QVVQnIHx8XG4gICAgICAgICAgICAgICAgYWN0aXZlRWxlbWVudC50YWdOYW1lID09PSAnVEVYVEFSRUEnIHx8XG4gICAgICAgICAgICAgICAgYWN0aXZlRWxlbWVudC5jb250ZW50RWRpdGFibGUgPT09ICd0cnVlJyB8fFxuICAgICAgICAgICAgICAgIGFjdGl2ZUVsZW1lbnQuaXNDb250ZW50RWRpdGFibGUpO1xuICAgICAgICAgICAgaWYgKGlzSW5wdXRGaWVsZClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBpZiAoZXZlbnQuY3RybEtleSAmJiBldmVudC5jb2RlID09PSAnS2V5WicgJiYgIWV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVuZG8oKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoKGV2ZW50LmN0cmxLZXkgJiYgZXZlbnQuc2hpZnRLZXkgJiYgZXZlbnQuY29kZSA9PT0gJ0tleVonKSB8fFxuICAgICAgICAgICAgICAgIChldmVudC5jdHJsS2V5ICYmIGV2ZW50LmNvZGUgPT09ICdLZXlZJyAmJiAhZXZlbnQuc2hpZnRLZXkpKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZG8oKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjcmVhdGVCYWNrZ3JvdW5kQmxvY2soKSB7XG4gICAgICAgIGNvbnN0IGJhY2tncm91bmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgYmFja2dyb3VuZC5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItcG9zaXRpb24nKTtcbiAgICAgICAgYmFja2dyb3VuZC5pZCA9ICdlZGl0b3ItYmFja2dyb3VuZCc7XG4gICAgICAgIHRoaXMuZWRpdG9yQmxvY2suYXBwZW5kQ2hpbGQoYmFja2dyb3VuZCk7XG4gICAgICAgIHJldHVybiBiYWNrZ3JvdW5kO1xuICAgIH1cbiAgICBjcmVhdGVNb2NrdXBCbG9jaygpIHtcbiAgICAgICAgY29uc3QgbW9ja3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgICAgIG1vY2t1cC5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItcG9zaXRpb24nKTtcbiAgICAgICAgbW9ja3VwLmlkID0gJ2VkaXRvci1tb2NrdXAnO1xuICAgICAgICB0aGlzLmVkaXRvckJsb2NrLmFwcGVuZENoaWxkKG1vY2t1cCk7XG4gICAgICAgIHJldHVybiBtb2NrdXA7XG4gICAgfVxuICAgIGNyZWF0ZUNhbnZhc2VzQ29udGFpbmVyKCkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgY2FudmFzLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1wb3NpdGlvbicpO1xuICAgICAgICBjYW52YXMuaWQgPSAnZWRpdG9yLWNhbnZhc2VzLWNvbnRhaW5lcic7XG4gICAgICAgIGNhbnZhcy5zdHlsZS56SW5kZXggPSAnMTAnO1xuICAgICAgICBjYW52YXMuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jay5hcHBlbmRDaGlsZChjYW52YXMpO1xuICAgICAgICByZXR1cm4gY2FudmFzO1xuICAgIH1cbiAgICBjcmVhdGVFZGl0b3JMb2FkaW5nQmxvY2soKSB7XG4gICAgICAgIGNvbnN0IGVkaXRvckxvYWRpbmdCbG9jayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBlZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xuICAgICAgICBlZGl0b3JMb2FkaW5nQmxvY2suY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXBvc2l0aW9uJyk7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5pZCA9ICdlZGl0b3ItbG9hZGluZyc7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5zdHlsZS56SW5kZXggPSBcIjEwMDBcIjtcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcIm5vbmVcIjtcbiAgICAgICAgY29uc3QgbG9hZGluZ1RleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgbG9hZGluZ1RleHQuaWQgPSAnbG9hZGluZy10ZXh0JztcbiAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS50ZXh0QWxpZ24gPSBcImNlbnRlclwiO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUudG9wID0gXCI1MCVcIjtcbiAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUubGVmdCA9IFwiNTAlXCI7XG4gICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKC01MCUsIC01MCUpXCI7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5hcHBlbmRDaGlsZChsb2FkaW5nVGV4dCk7XG4gICAgICAgIGNvbnN0IHNwaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgc3Bpbm5lci5pZCA9ICdzcGlubmVyJztcbiAgICAgICAgc3Bpbm5lci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5hcHBlbmRDaGlsZChzcGlubmVyKTtcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jay5hcHBlbmRDaGlsZChlZGl0b3JMb2FkaW5nQmxvY2spO1xuICAgICAgICByZXR1cm4gZWRpdG9yTG9hZGluZ0Jsb2NrO1xuICAgIH1cbiAgICBhc3luYyB1cGRhdGVNb2NrdXAoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFttb2NrdXBdIHVwZGF0ZSBmb3IgJHt0aGlzLl9zZWxlY3RUeXBlfSAke3RoaXMuX3NlbGVjdFNpZGV9ICR7dGhpcy5fc2VsZWN0Q29sb3IubmFtZX1gKTtcbiAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgdHJ1ZSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBtb2NrdXBJbWFnZVVybCA9IHRoaXMuZmluZE1vY2t1cFVybCgpO1xuICAgICAgICAgICAgaWYgKCFtb2NrdXBJbWFnZVVybCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW21vY2t1cF0g0J3QtSDQvdCw0LnQtNC10L0gbW9ja3VwINC00LvRjyDRgtC10LrRg9GJ0LjRhSDQv9Cw0YDQsNC80LXRgtGA0L7QsicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZGF0YVVSTCA9IGF3YWl0IHRoaXMubG9hZEFuZENvbnZlcnRJbWFnZShtb2NrdXBJbWFnZVVybCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9VUERBVEVELCBkYXRhVVJMKTtcbiAgICAgICAgICAgIHRoaXMubW9ja3VwQmxvY2suc3JjID0gZGF0YVVSTDtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1ttb2NrdXBdIE1vY2t1cCDRg9GB0L/QtdGI0L3QviDQvtCx0L3QvtCy0LvQtdC9Jyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbbW9ja3VwXSDQntGI0LjQsdC60LAg0L7QsdC90L7QstC70LXQvdC40Y8gbW9ja3VwOicsIGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgZmFsc2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZpbmRNb2NrdXBVcmwoKSB7XG4gICAgICAgIGNvbnN0IGNhY2hlS2V5ID0gYCR7dGhpcy5fc2VsZWN0VHlwZX0tJHt0aGlzLl9zZWxlY3RTaWRlfS0ke3RoaXMuX3NlbGVjdENvbG9yLm5hbWV9YDtcbiAgICAgICAgaWYgKHRoaXMubW9ja3VwQ2FjaGUuaGFzKGNhY2hlS2V5KSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubW9ja3VwQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpIHtcbiAgICAgICAgICAgIHRoaXMubW9ja3VwQ2FjaGUuc2V0KGNhY2hlS2V5LCBudWxsKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1vY2t1cCA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG0gPT4gbS5zaWRlID09PSB0aGlzLl9zZWxlY3RTaWRlICYmIG0uY29sb3IubmFtZSA9PT0gdGhpcy5fc2VsZWN0Q29sb3IubmFtZSk7XG4gICAgICAgIGNvbnN0IHVybCA9IG1vY2t1cD8udXJsIHx8IG51bGw7XG4gICAgICAgIHRoaXMubW9ja3VwQ2FjaGUuc2V0KGNhY2hlS2V5LCB1cmwpO1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cbiAgICBnZXRQcm9kdWN0QnlUeXBlKHR5cGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLnByb2R1Y3RDYWNoZS5oYXModHlwZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLnByb2R1Y3RDb25maWdzLmZpbmQocCA9PiBwLnR5cGUgPT09IHR5cGUpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByb2R1Y3RDYWNoZS5zZXQodHlwZSwgcHJvZHVjdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucHJvZHVjdENhY2hlLmdldCh0eXBlKTtcbiAgICB9XG4gICAgY2xlYXJNb2NrdXBDYWNoZSgpIHtcbiAgICAgICAgdGhpcy5tb2NrdXBDYWNoZS5jbGVhcigpO1xuICAgIH1cbiAgICBhc3luYyBsb2FkQW5kQ29udmVydEltYWdlKGltYWdlVXJsKSB7XG4gICAgICAgIGlmICh0aGlzLmltYWdlQ2FjaGUuaGFzKGltYWdlVXJsKSkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2NhY2hlXSDQmNC30L7QsdGA0LDQttC10L3QuNC1INC30LDQs9GA0YPQttC10L3QviDQuNC3INC60Y3RiNCwOicsIGltYWdlVXJsKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmltYWdlQ2FjaGUuZ2V0KGltYWdlVXJsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIGltYWdlLnNldEF0dHJpYnV0ZSgnY3Jvc3NPcmlnaW4nLCAnYW5vbnltb3VzJyk7XG4gICAgICAgICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IGltYWdlLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ9Cd0LUg0YPQtNCw0LvQvtGB0Ywg0L/QvtC70YPRh9C40YLRjCDQutC+0L3RgtC10LrRgdGCIGNhbnZhcycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKGltYWdlLCAwLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YVVSTCA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmltYWdlQ2FjaGUuc2V0KGltYWdlVXJsLCBkYXRhVVJMKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2NhY2hlXSDQmNC30L7QsdGA0LDQttC10L3QuNC1INGB0L7RhdGA0LDQvdC10L3QviDQsiDQutGN0Yg6JywgaW1hZ2VVcmwpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGFVUkwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1hZ2Uub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCDQuNC30L7QsdGA0LDQttC10L3QuNGPOiAke2ltYWdlVXJsfWApKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbWFnZS5zcmMgPSBpbWFnZVVybDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIHNhdmVTdGF0ZSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3N0YXRlXSDQodC+0YXRgNCw0L3QtdC90LjQtSDRgdC+0YHRgtC+0Y/QvdC40Y8g0YDQtdC00LDQutGC0L7RgNCwJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3JTdGF0ZSA9IHtcbiAgICAgICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgdHlwZTogdGhpcy5fc2VsZWN0VHlwZSxcbiAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IubmFtZSxcbiAgICAgICAgICAgICAgICBzaWRlOiB0aGlzLl9zZWxlY3RTaWRlLFxuICAgICAgICAgICAgICAgIHNpemU6IHRoaXMuX3NlbGVjdFNpemVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbc3RhdGVdINCh0L7RhdGA0LDQvdGP0LXQvDogdHlwZT0ke2VkaXRvclN0YXRlLnR5cGV9LCBjb2xvcj0ke2VkaXRvclN0YXRlLmNvbG9yfSwgc2lkZT0ke2VkaXRvclN0YXRlLnNpZGV9LCBzaXplPSR7ZWRpdG9yU3RhdGUuc2l6ZX1gKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RvcmFnZU1hbmFnZXIuc2F2ZUVkaXRvclN0YXRlKGVkaXRvclN0YXRlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tzdGF0ZV0g0KHQvtGB0YLQvtGP0L3QuNC1INGD0YHQv9C10YjQvdC+INGB0L7RhdGA0LDQvdC10L3QvicpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y8g0YHQvtGB0YLQvtGP0L3QuNGPOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBzYXZlTGF5b3V0cygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2xheWVyc10g0KHQvtGF0YDQsNC90LXQvdC40LUg0YHQu9C+0ZHQsicpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci5zYXZlTGF5ZXJzKHRoaXMubGF5b3V0cyk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbbGF5ZXJzXSDQodC70L7QuCDRg9GB0L/QtdGI0L3QviDRgdC+0YXRgNCw0L3QtdC90YsnKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBsb2FkTGF5b3V0cygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2xheWVyc10g0JfQsNCz0YDRg9C30LrQsCDRgdC70L7RkdCyJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzYXZlZExheW91dHMgPSBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLmxvYWRMYXllcnMoKTtcbiAgICAgICAgICAgIGlmIChzYXZlZExheW91dHMgJiYgQXJyYXkuaXNBcnJheShzYXZlZExheW91dHMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gc2F2ZWRMYXlvdXRzLm1hcCgobGF5b3V0RGF0YSkgPT4gbmV3IExheW91dChsYXlvdXREYXRhKSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2xheWVyc10g0JfQsNCz0YDRg9C20LXQvdC+ICR7dGhpcy5sYXlvdXRzLmxlbmd0aH0g0YHQu9C+0ZHQsmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gW107XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2xheWVyc10g0J3QtdGCINGB0L7RhdGA0LDQvdGR0L3QvdGL0YUg0YHQu9C+0ZHQsicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbbGF5ZXJzXSDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCDRgdC70L7RkdCyOicsIGVycm9yKTtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0cyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgbG9hZFN0YXRlKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbc3RhdGVdINCX0LDQs9GA0YPQt9C60LAg0YHQvtGB0YLQvtGP0L3QuNGPINGA0LXQtNCw0LrRgtC+0YDQsCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yU3RhdGUgPSBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLmxvYWRFZGl0b3JTdGF0ZSgpO1xuICAgICAgICAgICAgaWYgKCFlZGl0b3JTdGF0ZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tzdGF0ZV0g0KHQvtGF0YDQsNC90LXQvdC90L7QtSDRgdC+0YHRgtC+0Y/QvdC40LUg0L3QtSDQvdCw0LnQtNC10L3QvicpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkUHJvZHVjdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdENvbG9yc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRTaXplc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5pc1N0YXRlRXhwaXJlZChlZGl0b3JTdGF0ZS5kYXRlKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW3N0YXRlXSDQodC+0YHRgtC+0Y/QvdC40LUg0YPRgdGC0LDRgNC10LvQviwg0L7Rh9C40YnQsNC10LwnKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLmNsZWFyRWRpdG9yU3RhdGUoKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRDb2xvcnNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0U2l6ZXNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYXBwbGllZCA9IGF3YWl0IHRoaXMuYXBwbHlTdGF0ZShlZGl0b3JTdGF0ZSk7XG4gICAgICAgICAgICBpZiAoYXBwbGllZCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tzdGF0ZV0g0KHQvtGB0YLQvtGP0L3QuNC1INGD0YHQv9C10YjQvdC+INC30LDQs9GA0YPQttC10L3QvicpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkUHJvZHVjdCgpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb2R1Y3RCbG9ja3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2R1Y3RCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBibG9jay5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYigyMjIgMjIyIDIyMiknO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLnByb2R1Y3RCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fcHJvZHVjdC1ibG9ja19fJyArIHRoaXMuX3NlbGVjdFR5cGUpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmVCbG9jay5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdENvbG9yc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRTaXplc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW3N0YXRlXSDQndC1INGD0LTQsNC70L7RgdGMINC/0YDQuNC80LXQvdC40YLRjCDRgdC+0YXRgNCw0L3QtdC90L3QvtC1INGB0L7RgdGC0L7Rj9C90LjQtScpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkUHJvZHVjdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdENvbG9yc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRTaXplc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINC30LDQs9GA0YPQt9C60Lgg0YHQvtGB0YLQvtGP0L3QuNGPOicsIGVycm9yKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgICAgICB0aGlzLmxvYWRQcm9kdWN0KCk7XG4gICAgICAgICAgICB0aGlzLmluaXRDb2xvcnNMaXN0KCk7XG4gICAgICAgICAgICB0aGlzLmluaXRTaXplc0xpc3QoKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpc1N0YXRlRXhwaXJlZChkYXRlU3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHN0YXRlRGF0ZSA9IG5ldyBEYXRlKGRhdGVTdHJpbmcpO1xuICAgICAgICBjb25zdCBleHBpcmF0aW9uRGF0ZSA9IERhdGUubm93KCkgLSAoQ09OU1RBTlRTLlNUQVRFX0VYUElSQVRJT05fREFZUyAqIDI0ICogNjAgKiA2MCAqIDEwMDApO1xuICAgICAgICByZXR1cm4gc3RhdGVEYXRlLmdldFRpbWUoKSA8IGV4cGlyYXRpb25EYXRlO1xuICAgIH1cbiAgICBhc3luYyBhcHBseVN0YXRlKGVkaXRvclN0YXRlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoIWVkaXRvclN0YXRlLnR5cGUgfHwgIWVkaXRvclN0YXRlLmNvbG9yIHx8ICFlZGl0b3JTdGF0ZS5zaWRlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbc3RhdGVdINCd0LXQutC+0YDRgNC10LrRgtC90L7QtSDRgdC+0YHRgtC+0Y/QvdC40LU6INC+0YLRgdGD0YLRgdGC0LLRg9GO0YIg0L7QsdGP0LfQsNGC0LXQu9GM0L3Ri9C1INC/0L7Qu9GPJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3N0YXRlXSDQktC+0YHRgdGC0LDQvdC+0LLQu9C10L3QuNC1INGB0L7RgdGC0L7Rj9C90LjRjzogdHlwZT0ke2VkaXRvclN0YXRlLnR5cGV9LCBjb2xvcj0ke2VkaXRvclN0YXRlLmNvbG9yfSwgc2lkZT0ke2VkaXRvclN0YXRlLnNpZGV9LCBzaXplPSR7ZWRpdG9yU3RhdGUuc2l6ZX1gKTtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLnByb2R1Y3RDb25maWdzLmZpbmQocCA9PiBwLnR5cGUgPT09IGVkaXRvclN0YXRlLnR5cGUpO1xuICAgICAgICAgICAgaWYgKCFwcm9kdWN0KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbc3RhdGVdINCf0YDQvtC00YPQutGCINGC0LjQv9CwICR7ZWRpdG9yU3RhdGUudHlwZX0g0L3QtSDQvdCw0LnQtNC10L1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBtb2NrdXAgPSBwcm9kdWN0Lm1vY2t1cHMuZmluZChtID0+IG0uY29sb3IubmFtZSA9PT0gZWRpdG9yU3RhdGUuY29sb3IpO1xuICAgICAgICAgICAgaWYgKCFtb2NrdXApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtzdGF0ZV0gTW9ja3VwINGBINGG0LLQtdGC0L7QvCAke2VkaXRvclN0YXRlLmNvbG9yfSDQvdC1INC90LDQudC00LXQvSDQtNC70Y8g0L/RgNC+0LTRg9C60YLQsCAke2VkaXRvclN0YXRlLnR5cGV9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fc2VsZWN0VHlwZSA9IGVkaXRvclN0YXRlLnR5cGU7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RDb2xvciA9IG1vY2t1cC5jb2xvcjtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdFNpZGUgPSBlZGl0b3JTdGF0ZS5zaWRlO1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0U2l6ZSA9IGVkaXRvclN0YXRlLnNpemUgfHwgdGhpcy5fc2VsZWN0U2l6ZTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtzdGF0ZV0g0KHQvtGB0YLQvtGP0L3QuNC1INC/0YDQuNC80LXQvdC10L3QvjogdHlwZT0ke3RoaXMuX3NlbGVjdFR5cGV9LCBjb2xvcj0ke3RoaXMuX3NlbGVjdENvbG9yLm5hbWV9LCBzaWRlPSR7dGhpcy5fc2VsZWN0U2lkZX0sIHNpemU9JHt0aGlzLl9zZWxlY3RTaXplfWApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbc3RhdGVdINCe0YjQuNCx0LrQsCDQv9GA0LjQvNC10L3QtdC90LjRjyDRgdC+0YHRgtC+0Y/QvdC40Y86JywgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldFR5cGUodHlwZSkge1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0VHlwZSAhPT0gdHlwZSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0VHlwZSA9IHR5cGU7XG4gICAgICAgICAgICB0aGlzLmNsZWFyTW9ja3VwQ2FjaGUoKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuU1RBVEVfQ0hBTkdFRCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPOicsIGVycikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldENvbG9yKGNvbG9yKSB7XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RDb2xvciAhPT0gY29sb3IpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gY29sb3I7XG4gICAgICAgICAgICB0aGlzLmNsZWFyTW9ja3VwQ2FjaGUoKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuU1RBVEVfQ0hBTkdFRCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPOicsIGVycikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldFNpZGUoc2lkZSkge1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0U2lkZSAhPT0gc2lkZSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0U2lkZSA9IHNpZGU7XG4gICAgICAgICAgICB0aGlzLmNsZWFyTW9ja3VwQ2FjaGUoKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuU1RBVEVfQ0hBTkdFRCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPOicsIGVycikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldFNpemUoc2l6ZSkge1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0U2l6ZSAhPT0gc2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0U2l6ZSA9IHNpemU7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLlNUQVRFX0NIQU5HRUQsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbc3RhdGVdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjzonLCBlcnIpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhZGRMYXlvdXQobGF5b3V0KSB7XG4gICAgICAgIGlmICh0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkpIHtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0cy5wdXNoKGxheW91dCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxheW91dHMucHVzaChsYXlvdXQpO1xuICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5MQVlPVVRfQURERUQsIGxheW91dCk7XG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgIHRoaXMuc2F2ZUxheW91dHMoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW2xheWVyc10g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPINGB0LvQvtGR0LI6JywgZXJyKSk7XG4gICAgfVxuICAgIHJlbW92ZUxheW91dChsYXlvdXRJZCkge1xuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMubGF5b3V0cy5maW5kSW5kZXgobCA9PiBsLmlkID09PSBsYXlvdXRJZCk7XG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0c1tpbmRleF07XG4gICAgICAgICAgICBpZiAobGF5b3V0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXlvdXRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTEFZT1VUX1JFTU9WRUQsIGxheW91dElkKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNhdmVMYXlvdXRzKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycikpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdXBkYXRlTGF5b3V0KGxheW91dElkLCB1cGRhdGVzKSB7XG4gICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0cy5maW5kKGwgPT4gbC5pZCA9PT0gbGF5b3V0SWQpO1xuICAgICAgICBpZiAobGF5b3V0KSB7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGxheW91dCwgdXBkYXRlcyk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSkge1xuICAgICAgICAgICAgICAgIGlmICgndXJsJyBpbiB1cGRhdGVzIHx8ICduYW1lJyBpbiB1cGRhdGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2F2ZUxheWVyc1RvSGlzdG9yeSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTEFZT1VUX1VQREFURUQsIGxheW91dCk7XG4gICAgICAgICAgICB0aGlzLnNhdmVMYXlvdXRzKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycikpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBnZXRMYXlvdXQobGF5b3V0SWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0cy5maW5kKGwgPT4gbC5pZCA9PT0gbGF5b3V0SWQpO1xuICAgIH1cbiAgICBnZXRMYXlvdXRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXRzO1xuICAgIH1cbiAgICBpbml0SGlzdG9yeVVuZG9CbG9jaygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnkgYmxvY2tdIGluaXQgdW5kbycpO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2sub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5IHVuZG8gYmxvY2tdIGNsaWNrZWQnKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudW5kbygpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKTtcbiAgICB9XG4gICAgaW5pdEhpc3RvcnlSZWRvQmxvY2soKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5IHJlZG8gYmxvY2tdIGluaXQgcmVkbycpO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2sub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5IHJlZG8gYmxvY2tdIGNsaWNrZWQnKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucmVkbygpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKTtcbiAgICB9XG4gICAgaW5pdFByb2R1Y3RMaXN0KCkge1xuICAgICAgICBpZiAoIXRoaXMucHJvZHVjdExpc3RCbG9jayB8fCAhdGhpcy5wcm9kdWN0SXRlbUJsb2NrKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbUHJvZHVjdExpc3RdIGluaXQgcHJvZHVjdCBsaXN0Jyk7XG4gICAgICAgIHRoaXMucHJvZHVjdEl0ZW1CbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB0aGlzLnByb2R1Y3RDb25maWdzLmZvckVhY2gocHJvZHVjdCA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0SXRlbSA9IHRoaXMucHJvZHVjdEl0ZW1CbG9jay5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBwcm9kdWN0SXRlbS5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RJbWFnZVdyYXBwZXIgPSBwcm9kdWN0SXRlbS5xdWVyeVNlbGVjdG9yKCcucHJvZHVjdC1pdGVtLWltYWdlJyk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdEltYWdlV3JhcHBlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RJbWFnZSA9IGdldExhc3RDaGlsZChwcm9kdWN0SW1hZ2VXcmFwcGVyKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvZHVjdEltYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RJbWFnZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBgdXJsKCR7cHJvZHVjdC5tb2NrdXBzWzBdPy51cmx9KWA7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RJbWFnZS5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9ICdjb3Zlcic7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RJbWFnZS5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb24gPSAnY2VudGVyJztcbiAgICAgICAgICAgICAgICAgICAgcHJvZHVjdEltYWdlLnN0eWxlLmJhY2tncm91bmRSZXBlYXQgPSAnbm8tcmVwZWF0JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0VGV4dFdyYXBwZXIgPSBwcm9kdWN0SXRlbS5xdWVyeVNlbGVjdG9yKCcucHJvZHVjdC1pdGVtLXRleHQnKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0VGV4dFdyYXBwZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0VGV4dCA9IGdldExhc3RDaGlsZChwcm9kdWN0VGV4dFdyYXBwZXIpO1xuICAgICAgICAgICAgICAgIGlmIChwcm9kdWN0VGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9kdWN0VGV4dC5pbm5lclRleHQgPSBwcm9kdWN0LnByb2R1Y3ROYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RCbG9jayA9IHByb2R1Y3RJdGVtLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgcHJvZHVjdEJsb2NrLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1zZXR0aW5nc19fcHJvZHVjdC1ibG9ja19fJyArIHByb2R1Y3QudHlwZSk7XG4gICAgICAgICAgICBwcm9kdWN0QmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgcHJvZHVjdEJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgICAgICAgICAgIHByb2R1Y3RJdGVtLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNoYW5nZVByb2R1Y3QocHJvZHVjdC50eXBlKTtcbiAgICAgICAgICAgIHRoaXMucHJvZHVjdEJsb2Nrcy5wdXNoKHByb2R1Y3RCbG9jayk7XG4gICAgICAgICAgICB0aGlzLnByb2R1Y3RMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuYXBwZW5kQ2hpbGQocHJvZHVjdEl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMucHJvZHVjdEJsb2Nrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnByb2R1Y3RCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICAgICAgYmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2IoMjIyIDIyMiAyMjIpJztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLnByb2R1Y3RCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fcHJvZHVjdC1ibG9ja19fJyArIHRoaXMuX3NlbGVjdFR5cGUpKTtcbiAgICAgICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgICAgIGFjdGl2ZUJsb2NrLnN0eWxlLmJhY2tncm91bmQgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0Q29sb3JzTGlzdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckNvbG9yc0xpc3RCbG9jayB8fCAhdGhpcy5lZGl0b3JDb2xvckl0ZW1CbG9jaylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBpbml0IGNvbG9ycyBmb3IgJHt0aGlzLl9zZWxlY3RUeXBlfWApO1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuZWRpdG9yQ29sb3JJdGVtQmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgY29uc3QgY29sb3JzQ29udGFpbmVyID0gdGhpcy5lZGl0b3JDb2xvcnNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgIGNvbG9yc0NvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgdGhpcy5jb2xvckJsb2NrcyA9IFtdO1xuICAgICAgICBjb25zdCBjb2xvcnMgPSBwcm9kdWN0Lm1vY2t1cHNcbiAgICAgICAgICAgIC5maWx0ZXIobW9ja3VwID0+IG1vY2t1cC5zaWRlID09PSB0aGlzLl9zZWxlY3RTaWRlKVxuICAgICAgICAgICAgLm1hcChtb2NrdXAgPT4gbW9ja3VwLmNvbG9yKTtcbiAgICAgICAgY29sb3JzLmZvckVhY2goY29sb3IgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29sb3JJdGVtID0gdGhpcy5lZGl0b3JDb2xvckl0ZW1CbG9jay5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBjb2xvckl0ZW0uc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICBjb25zdCBjb2xvckJsb2NrID0gY29sb3JJdGVtLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgY29sb3JCbG9jay5jbGFzc0xpc3QuYWRkKCdlZGl0b3Itc2V0dGluZ3NfX2NvbG9yLWJsb2NrX18nICsgY29sb3IubmFtZSk7XG4gICAgICAgICAgICBjb2xvckJsb2NrLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIGNvbG9yQmxvY2suc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3IuaGV4O1xuICAgICAgICAgICAgY29sb3JCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgICAgICAgICBjb2xvckl0ZW0ub25jbGljayA9ICgpID0+IHRoaXMuY2hhbmdlQ29sb3IoY29sb3IubmFtZSk7XG4gICAgICAgICAgICB0aGlzLmNvbG9yQmxvY2tzLnB1c2goY29sb3JCbG9jayk7XG4gICAgICAgICAgICB0aGlzLmVkaXRvckNvbG9yc0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5hcHBlbmRDaGlsZChjb2xvckl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuY29sb3JCbG9ja3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5jb2xvckJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgICAgICBibG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLmNvbG9yQmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX2NvbG9yLWJsb2NrX18nICsgdGhpcy5fc2VsZWN0Q29sb3IubmFtZSkpO1xuICAgICAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgYWN0aXZlQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0U2l6ZXNMaXN0KCkge1xuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yU2l6ZXNMaXN0QmxvY2sgfHwgIXRoaXMuZWRpdG9yU2l6ZUl0ZW1CbG9jaylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBpbml0IHNpemVzIGZvciAke3RoaXMuX3NlbGVjdFR5cGV9YCk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdCB8fCAhcHJvZHVjdC5zaXplcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5lZGl0b3JTaXplSXRlbUJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGNvbnN0IHNpemVzQ29udGFpbmVyID0gdGhpcy5lZGl0b3JTaXplc0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgc2l6ZXNDb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIHRoaXMuc2l6ZUJsb2NrcyA9IFtdO1xuICAgICAgICBwcm9kdWN0LnNpemVzLmZvckVhY2goc2l6ZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzaXplSXRlbSA9IHRoaXMuZWRpdG9yU2l6ZUl0ZW1CbG9jay5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBzaXplSXRlbS5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIHNpemVJdGVtLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHNpemVJdGVtLnN0eWxlLnVzZXJTZWxlY3QgPSAnbm9uZSc7XG4gICAgICAgICAgICBzaXplSXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0b3Itc2V0dGluZ3NfX3NpemUtYmxvY2tfXycgKyBzaXplKTtcbiAgICAgICAgICAgIGNvbnN0IGJvcmRlckJsb2NrID0gc2l6ZUl0ZW0uZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBib3JkZXJCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgIGNvbnN0IHNpemVUZXh0ID0gZ2V0TGFzdENoaWxkKHNpemVJdGVtKTtcbiAgICAgICAgICAgIGlmIChzaXplVGV4dCkge1xuICAgICAgICAgICAgICAgIHNpemVUZXh0LmlubmVyVGV4dCA9IHNpemU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzaXplSXRlbS5vbmNsaWNrID0gKCkgPT4gdGhpcy5jaGFuZ2VTaXplKHNpemUpO1xuICAgICAgICAgICAgdGhpcy5zaXplQmxvY2tzLnB1c2goc2l6ZUl0ZW0pO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JTaXplc0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5hcHBlbmRDaGlsZChzaXplSXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5zaXplQmxvY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuc2l6ZUJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBib3JkZXJCbG9jayA9IGJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgIGlmIChib3JkZXJCbG9jaykge1xuICAgICAgICAgICAgICAgICAgICBib3JkZXJCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUJsb2NrID0gdGhpcy5zaXplQmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX3NpemUtYmxvY2tfXycgKyB0aGlzLl9zZWxlY3RTaXplKSk7XG4gICAgICAgICAgICBpZiAoYWN0aXZlQmxvY2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBib3JkZXJCbG9jayA9IGFjdGl2ZUJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgIGlmIChib3JkZXJCbG9jaykge1xuICAgICAgICAgICAgICAgICAgICBib3JkZXJCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBzaG93TGF5b3V0TGlzdCgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3NldHRpbmdzXSBbbGF5b3V0c10gc2hvdyBsYXlvdXRzIGxpc3QnKTtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9jaykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIltzZXR0aW5nc10gW2xheW91dHNdIGVkaXRvckxheW91dEl0ZW1CbG9jayBpcyBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2spIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbc2V0dGluZ3NdIFtsYXlvdXRzXSBlZGl0b3JMYXlvdXRzTGlzdEJsb2NrIGlzIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gW2xheW91dHNdIGxheW91dHMgbGlzdCBibG9jayBjaGlsZHJlbjogJHt0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuY2hpbGRyZW4ubGVuZ3RofWApO1xuICAgICAgICB0aGlzLmxheW91dHMuZm9yRWFjaChsYXlvdXQgPT4ge1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0SXRlbSA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIGxheW91dEl0ZW0uc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICBjb25zdCBpc0VkaXRpbmcgPSB0aGlzLl9zZWxlY3RMYXlvdXQgPT09IGxheW91dC5pZDtcbiAgICAgICAgICAgIGNvbnN0IHByZXZpZXdCbG9jayA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrVmlld0NsYXNzXG4gICAgICAgICAgICAgICAgPyBsYXlvdXRJdGVtLnF1ZXJ5U2VsZWN0b3IodGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tWaWV3Q2xhc3MpXG4gICAgICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgbmFtZUJsb2NrID0gdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tOYW1lQ2xhc3NcbiAgICAgICAgICAgICAgICA/IGxheW91dEl0ZW0ucXVlcnlTZWxlY3Rvcih0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja05hbWVDbGFzcylcbiAgICAgICAgICAgICAgICA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCByZW1vdmVCbG9jayA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrUmVtb3ZlQ2xhc3NcbiAgICAgICAgICAgICAgICA/IGxheW91dEl0ZW0ucXVlcnlTZWxlY3Rvcih0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja1JlbW92ZUNsYXNzKVxuICAgICAgICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRCbG9jayA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrRWRpdENsYXNzXG4gICAgICAgICAgICAgICAgPyBsYXlvdXRJdGVtLnF1ZXJ5U2VsZWN0b3IodGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tFZGl0Q2xhc3MpXG4gICAgICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICAgICAgaWYgKHByZXZpZXdCbG9jaykge1xuICAgICAgICAgICAgICAgIGlmIChsYXlvdXQuaXNJbWFnZUxheW91dCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZXZpZXdFbGVtZW50ID0gcHJldmlld0Jsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJldmlld0VsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IGB1cmwoJHtsYXlvdXQudXJsfSlgO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlld0VsZW1lbnQuc3R5bGUuYmFja2dyb3VuZFNpemUgPSAnY29udGFpbic7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3RWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb24gPSAnY2VudGVyJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJhY2tncm91bmRSZXBlYXQgPSAnbm8tcmVwZWF0JztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNFZGl0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3RWxlbWVudC5zdHlsZS5ib3JkZXJDb2xvciA9ICdyZ2IoMjU0LCA5NCwgNTgpJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJvcmRlckNvbG9yID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobGF5b3V0LnR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuYW1lQmxvY2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lRWxlbWVudCA9IG5hbWVCbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgICAgICBpZiAobmFtZUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxheW91dC50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwbGF5TmFtZSA9ICFsYXlvdXQubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gXCLQmNC30L7QsdGA0LDQttC10L3QuNC1XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGxheW91dC5uYW1lLmluY2x1ZGVzKFwiXFxuXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbGF5b3V0Lm5hbWUuc3BsaXQoXCJcXG5cIilbMF0gKyBcIi4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbGF5b3V0Lm5hbWUubGVuZ3RoID4gNDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbGF5b3V0Lm5hbWUuc2xpY2UoMCwgNDApICsgXCIuLi5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBsYXlvdXQubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVFbGVtZW50LmlubmVyVGV4dCA9IGRpc3BsYXlOYW1lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGxheW91dC50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVFbGVtZW50LmlubmVyVGV4dCA9IGxheW91dC5uYW1lIHx8IFwi0KLQtdC60YHRglwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlbW92ZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlQmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgICAgIHJlbW92ZUJsb2NrLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTGF5b3V0KGxheW91dC5pZCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzRWRpdGluZylcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FuY2VsRWRpdExheW91dCgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5yZXN0b3JlSWNvbkZyb21EYXRhT3JpZ2luYWwocmVtb3ZlQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVkaXRCbG9jaykge1xuICAgICAgICAgICAgICAgIGlmIChpc0VkaXRpbmcgfHwgbGF5b3V0LmlkID09PSBcInN0YXJ0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdEJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlZGl0QmxvY2suc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVkaXRCbG9jay5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICAgICAgZWRpdEJsb2NrLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmVkaXRMYXlvdXQobGF5b3V0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3RvcmVJY29uRnJvbURhdGFPcmlnaW5hbChnZXRMYXN0Q2hpbGQoZWRpdEJsb2NrKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuYXBwZW5kQ2hpbGQobGF5b3V0SXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSBsYXlvdXRzIHNob3duOiAke3RoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5jaGlsZHJlbi5sZW5ndGh9YCk7XG4gICAgfVxuICAgIGluaXRBZGRPcmRlckJ1dHRvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgdGhpcy5ldmVudHMub24oRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCAoaXNMb2FkaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbikge1xuICAgICAgICAgICAgICAgIGlmIChpc0xvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzAuNSc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24uc3R5bGUuY3Vyc29yID0gJ25vdC1hbGxvd2VkJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCa0L3QvtC/0LrQsCDQt9Cw0LHQu9C+0LrQuNGA0L7QstCw0L3QsCAo0LjQtNC10YIg0LPQtdC90LXRgNCw0YbQuNGPKScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCa0L3QvtC/0LrQsCDRgNCw0LfQsdC70L7QutC40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNBZGRpbmdUb0NhcnQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tvcmRlcl0g0J/RgNC+0YbQtdGB0YEg0LTQvtCx0LDQstC70LXQvdC40Y8g0YPQttC1INC40LTQtdGCLCDQuNCz0L3QvtGA0LjRgNGD0LXQvCDQv9C+0LLRgtC+0YDQvdC+0LUg0L3QsNC20LDRgtC40LUnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5nZXRTdW0oKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGFsZXJ0KCfQlNC70Y8g0LTQvtCx0LDQstC70LXQvdC40Y8g0LfQsNC60LDQt9CwINC/0YDQvtC00YPQutGCINC90LUg0LzQvtC20LXRgiDQsdGL0YLRjCDQv9GD0YHRgtGL0LwnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5sYXlvdXRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGFsZXJ0KCfQn9C+0LbQsNC70YPQudGB0YLQsCwg0LTQvtC20LTQuNGC0LXRgdGMINC30LDQstC10YDRiNC10L3QuNGPINCz0LXQvdC10YDQsNGG0LjQuCDQtNC40LfQsNC50L3QsCcpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW29yZGVyXSDQn9C+0L/Ri9GC0LrQsCDQtNC+0LHQsNCy0LjRgtGMINCyINC60L7RgNC30LjQvdGDINCx0LXQtyDQtNC40LfQsNC50L3QsCcpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBidXR0b25UZXh0RWxlbWVudCA9IHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24/LnF1ZXJ5U2VsZWN0b3IoJy50bi1hdG9tJyk7XG4gICAgICAgICAgICBpZiAoIWJ1dHRvblRleHRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgYnV0dG9uVGV4dEVsZW1lbnQgPSB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uPy5xdWVyeVNlbGVjdG9yKCdkaXYsIHNwYW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsVGV4dCA9IGJ1dHRvblRleHRFbGVtZW50Py50ZXh0Q29udGVudD8udHJpbSgpIHx8ICfQlNC+0LHQsNCy0LjRgtGMINCyINC60L7RgNC30LjQvdGDJztcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0FkZGluZ1RvQ2FydCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRBZGRUb0NhcnRCdXR0b25Mb2FkaW5nKHRydWUsICfQlNC+0LHQsNCy0LvQtdC90LjQtS4uLicpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0J3QsNGH0LDQu9C+INGB0L7Qt9C00LDQvdC40Y8g0LfQsNC60LDQt9CwJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXhwb3J0ZWRBcnQgPSBhd2FpdCB0aGlzLmV4cG9ydEFydCh0cnVlLCA1MTIpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0K3QutGB0L/QvtGA0YIg0LTQuNC30LDQudC90LAg0LfQsNCy0LXRgNGI0LXQvTonLCBPYmplY3Qua2V5cyhleHBvcnRlZEFydCkpO1xuICAgICAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhleHBvcnRlZEFydCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCfQntGI0LjQsdC60LA6INC90LUg0YPQtNCw0LvQvtGB0Ywg0Y3QutGB0L/QvtGA0YLQuNGA0L7QstCw0YLRjCDQtNC40LfQsNC50L0uINCf0L7Qv9GA0L7QsdGD0LnRgtC1INC10YnQtSDRgNCw0LcuJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tvcmRlcl0g0K3QutGB0L/QvtGA0YIg0LLQtdGA0L3Rg9C7INC/0YPRgdGC0L7QuSDRgNC10LfRg9C70YzRgtCw0YInKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBzaWRlcyA9IE9iamVjdC5rZXlzKGV4cG9ydGVkQXJ0KS5tYXAoc2lkZSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICBpbWFnZV91cmw6IGV4cG9ydGVkQXJ0W3NpZGVdIHx8ICcnLFxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCX0LDQs9GA0YPQt9C60LAg0LjQt9C+0LHRgNCw0LbQtdC90LjQuSDQvdCwINGB0LXRgNCy0LXRgC4uLicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVwbG9hZFByb21pc2VzID0gc2lkZXMubWFwKGFzeW5jIChzaWRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJhc2U2NCA9IHNpZGUuaW1hZ2VfdXJsLnNwbGl0KCcsJylbMV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVwbG9hZGVkVXJsID0gYXdhaXQgdGhpcy51cGxvYWRJbWFnZVRvU2VydmVyKGJhc2U2NCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHNpZGUsIHVwbG9hZGVkVXJsIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdXBsb2FkZWRTaWRlcyA9IGF3YWl0IFByb21pc2UuYWxsKHVwbG9hZFByb21pc2VzKTtcbiAgICAgICAgICAgICAgICB1cGxvYWRlZFNpZGVzLmZvckVhY2goKHsgc2lkZSwgdXBsb2FkZWRVcmwgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzaWRlLmltYWdlX3VybCA9IHVwbG9hZGVkVXJsO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0JjQt9C+0LHRgNCw0LbQtdC90LjRjyDQt9Cw0LPRgNGD0LbQtdC90Ysg0L3QsCDRgdC10YDQstC10YAnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0TmFtZSA9IGAke3RoaXMuY2FwaXRhbGl6ZUZpcnN0TGV0dGVyKHRoaXMuZ2V0UHJvZHVjdE5hbWUoKSl9INGBINCy0LDRiNC40LwgJHtPYmplY3Qua2V5cyhleHBvcnRlZEFydCkubGVuZ3RoID09IDEgPyAn0L7QtNC90L7RgdGC0L7RgNC+0L3QvdC40LwnIDogJ9C00LLRg9GF0YHRgtC+0YDQvtC90L3QuNC8J30g0L/RgNC40L3RgtC+0LxgO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxheW91dHMgPSB0aGlzLmxheW91dHMubWFwKGxheW91dCA9PiAoeyAuLi5sYXlvdXQsIHVybDogdW5kZWZpbmVkIH0pKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1c2VySWQgPSBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLmdldFVzZXJJZCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKFwibGF5b3V0c1wiLCBKU09OLnN0cmluZ2lmeShsYXlvdXRzKSk7XG4gICAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKFwidXNlcl9pZFwiLCB1c2VySWQpO1xuICAgICAgICAgICAgICAgIGF3YWl0IGZldGNoKEFQSV9FTkRQT0lOVFMuV0VCSE9PS19DQVJULCB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IGZvcm1EYXRhXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY3JlYXRlUHJvZHVjdCh7XG4gICAgICAgICAgICAgICAgICAgIHF1YW50aXR5OiB0aGlzLmdldFF1YW50aXR5KCksXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHByb2R1Y3ROYW1lLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiB0aGlzLl9zZWxlY3RTaXplLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IsXG4gICAgICAgICAgICAgICAgICAgIHNpZGVzLFxuICAgICAgICAgICAgICAgICAgICBwcm9kdWN0VHlwZTogdGhpcy5fc2VsZWN0VHlwZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCX0LDQutCw0Lcg0YPRgdC/0LXRiNC90L4g0YHQvtC30LTQsNC9Jyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRBZGRUb0NhcnRCdXR0b25Mb2FkaW5nKGZhbHNlLCAn4pyTINCU0L7QsdCw0LLQu9C10L3QviEnKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRBZGRUb0NhcnRCdXR0b25Mb2FkaW5nKGZhbHNlLCBvcmlnaW5hbFRleHQpO1xuICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW29yZGVyXSDQntGI0LjQsdC60LAg0YHQvtC30LTQsNC90LjRjyDQt9Cw0LrQsNC30LA6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIGFsZXJ0KCfQntGI0LjQsdC60LAg0L/RgNC4INGB0L7Qt9C00LDQvdC40Lgg0LfQsNC60LDQt9CwJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRBZGRUb0NhcnRCdXR0b25Mb2FkaW5nKGZhbHNlLCBvcmlnaW5hbFRleHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNBZGRpbmdUb0NhcnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQpNC70LDQsyBpc0FkZGluZ1RvQ2FydCDRgdCx0YDQvtGI0LXQvScpO1xuICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBzZXRBZGRUb0NhcnRCdXR0b25Mb2FkaW5nKGlzTG9hZGluZywgdGV4dCkge1xuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuaW5qZWN0UHVsc2VBbmltYXRpb24oKTtcbiAgICAgICAgY29uc3QgYnV0dG9uID0gdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbjtcbiAgICAgICAgbGV0IGJ1dHRvblRleHRFbGVtZW50ID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJy50bi1hdG9tJyk7XG4gICAgICAgIGlmICghYnV0dG9uVGV4dEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGJ1dHRvblRleHRFbGVtZW50ID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ2Rpdiwgc3BhbicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRleHRUYXJnZXQgPSBidXR0b25UZXh0RWxlbWVudCB8fCBidXR0b247XG4gICAgICAgIGlmIChpc0xvYWRpbmcpIHtcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzAuNyc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuY3Vyc29yID0gJ25vdC1hbGxvd2VkJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgICAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgICAgICB0ZXh0VGFyZ2V0LnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5hbmltYXRpb24gPSAnY2FydEJ1dHRvblB1bHNlIDEuNXMgZWFzZS1pbi1vdXQgaW5maW5pdGUnO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSBbYW5pbWF0aW9uXSDQmtC90L7Qv9C60LAg0LfQsNCx0LvQvtC60LjRgNC+0LLQsNC90LA6JywgdGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9ICcxJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5hbmltYXRpb24gPSAnbm9uZSc7XG4gICAgICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgICAgIHRleHRUYXJnZXQudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSBbYW5pbWF0aW9uXSDQmtC90L7Qv9C60LAg0YDQsNC30LHQu9C+0LrQuNGA0L7QstCw0L3QsDonLCB0ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpbmplY3RQdWxzZUFuaW1hdGlvbigpIHtcbiAgICAgICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYXJ0LWJ1dHRvbi1wdWxzZS1hbmltYXRpb24nKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgc3R5bGUuaWQgPSAnY2FydC1idXR0b24tcHVsc2UtYW5pbWF0aW9uJztcbiAgICAgICAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4gICAgICAgICAgICBAa2V5ZnJhbWVzIGNhcnRCdXR0b25QdWxzZSB7XG4gICAgICAgICAgICAgICAgMCUsIDEwMCUge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDEpO1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLjc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIDUwJSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMS4wMik7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDAuODU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBgO1xuICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2FuaW1hdGlvbl0gQ1NTINCw0L3QuNC80LDRhtC40Y8g0L/Rg9C70YzRgdCw0YbQuNC4INC00L7QsdCw0LLQu9C10L3QsCcpO1xuICAgIH1cbiAgICBzZXRHZW5lcmF0ZUJ1dHRvbkxvYWRpbmcoaXNMb2FkaW5nLCB0ZXh0KSB7XG4gICAgICAgIGlmICghdGhpcy5mb3JtQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmluamVjdFB1bHNlQW5pbWF0aW9uKCk7XG4gICAgICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuZm9ybUJ1dHRvbjtcbiAgICAgICAgbGV0IGJ1dHRvblRleHRFbGVtZW50ID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJy50bi1hdG9tJyk7XG4gICAgICAgIGlmICghYnV0dG9uVGV4dEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGJ1dHRvblRleHRFbGVtZW50ID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ2Rpdiwgc3BhbicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRleHRUYXJnZXQgPSBidXR0b25UZXh0RWxlbWVudCB8fCBidXR0b247XG4gICAgICAgIGlmIChpc0xvYWRpbmcpIHtcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzAuNyc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuY3Vyc29yID0gJ25vdC1hbGxvd2VkJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgICAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgICAgICB0ZXh0VGFyZ2V0LnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5hbmltYXRpb24gPSAnY2FydEJ1dHRvblB1bHNlIDEuNXMgZWFzZS1pbi1vdXQgaW5maW5pdGUnO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2dlbmVyYXRlXSBbYW5pbWF0aW9uXSDQmtC90L7Qv9C60LAg0LfQsNCx0LvQvtC60LjRgNC+0LLQsNC90LA6JywgdGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9ICcxJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5hbmltYXRpb24gPSAnbm9uZSc7XG4gICAgICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgICAgIHRleHRUYXJnZXQudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2dlbmVyYXRlXSBbYW5pbWF0aW9uXSDQmtC90L7Qv9C60LAg0YDQsNC30LHQu9C+0LrQuNGA0L7QstCw0L3QsDonLCB0ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0VXBsb2FkSW1hZ2VCdXR0b24oKSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5yZXNldFVzZXJVcGxvYWRJbWFnZSgpO1xuICAgICAgICB0aGlzLmVkaXRvclVwbG9hZEltYWdlQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBsb2FkVXNlckltYWdlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpbml0Rml4UXVhbnRpdHlGb3JtKCkge1xuICAgICAgICBpZiAoIXRoaXMucXVhbnRpdHlGb3JtQmxvY2spXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGZvcm0gPSB0aGlzLnF1YW50aXR5Rm9ybUJsb2NrLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcbiAgICAgICAgY29uc3QgaW5wdXQgPSBmb3JtPy5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwicXVhbnRpdHlcIl0nKTtcbiAgICAgICAgaWYgKCFpbnB1dClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgdmFsaWRhdGVRdWFudGl0eSA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gaW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnJyB8fCBpc05hTihOdW1iZXIodmFsdWUpKSkge1xuICAgICAgICAgICAgICAgIGlucHV0LnZhbHVlID0gJzEnO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHF1YW50aXR5ID0gcGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICAgIGlmIChxdWFudGl0eSA8IDEgfHwgcXVhbnRpdHkgPT09IDApIHtcbiAgICAgICAgICAgICAgICBpbnB1dC52YWx1ZSA9ICcxJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCB2YWxpZGF0ZVF1YW50aXR5KTtcbiAgICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHZhbGlkYXRlUXVhbnRpdHkpO1xuICAgICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB2YWxpZGF0ZVF1YW50aXR5KTtcbiAgICAgICAgdmFsaWRhdGVRdWFudGl0eSgpO1xuICAgIH1cbiAgICBhc3luYyBpbml0Rm9ybSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmZvcm1CbG9jayB8fCAhdGhpcy5mb3JtQnV0dG9uIHx8ICF0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZm9ybUJsb2NrID0gdGhpcy5mb3JtQmxvY2s7XG4gICAgICAgIGNvbnN0IGZvcm1JbnB1dFZhcmlhYmxlTmFtZSA9IHRoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lO1xuICAgICAgICBjb25zdCBmb3JtQnV0dG9uID0gdGhpcy5mb3JtQnV0dG9uO1xuICAgICAgICBjb25zdCBoYW5kbGVDbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYnV0dG9uXSBjbGlja2VkJyk7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0dlbmVyYXRpbmcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSDQk9C10L3QtdGA0LDRhtC40Y8g0YPQttC1INC40LTQtdGCLCDQuNCz0L3QvtGA0LjRgNGD0LXQvCDQv9C+0LLRgtC+0YDQvdC+0LUg0L3QsNC20LDRgtC40LUnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBmb3JtSW5wdXQgPSBmb3JtQmxvY2sucXVlcnlTZWxlY3RvcihgW25hbWU9XCIke2Zvcm1JbnB1dFZhcmlhYmxlTmFtZX1cIl1gKTtcbiAgICAgICAgICAgIGNvbnN0IHByb21wdCA9IGZvcm1JbnB1dC52YWx1ZTtcbiAgICAgICAgICAgIGlmICghdGhpcy5sb2FkZWRVc2VySW1hZ2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXByb21wdCB8fCBwcm9tcHQudHJpbSgpID09PSBcIlwiIHx8IHByb21wdC5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFtpbnB1dF0gcHJvbXB0IGlzIGVtcHR5IG9yIHRvbyBzaG9ydCcpO1xuICAgICAgICAgICAgICAgICAgICBhbGVydChcItCc0LjQvdC40LzQsNC70YzQvdCw0Y8g0LTQu9C40L3QsCDQt9Cw0L/RgNC+0YHQsCAxINGB0LjQvNCy0L7Qu1wiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbaW5wdXRdIHByb21wdDogJHtwcm9tcHR9YCk7XG4gICAgICAgICAgICB0aGlzLmlzR2VuZXJhdGluZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNldEdlbmVyYXRlQnV0dG9uTG9hZGluZyh0cnVlLCAn0JPQtdC90LXRgNCw0YbQuNGPLi4uJyk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCB0cnVlKTtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dElkID0gdGhpcy5fc2VsZWN0TGF5b3V0IHx8IExheW91dC5nZW5lcmF0ZUlkKCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHVybCA9IGF3YWl0IGdlbmVyYXRlSW1hZ2Uoe1xuICAgICAgICAgICAgICAgICAgICBwcm9tcHQsXG4gICAgICAgICAgICAgICAgICAgIHNoaXJ0Q29sb3I6IHRoaXMuX3NlbGVjdENvbG9yLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGltYWdlOiB0aGlzLl9zZWxlY3RMYXlvdXQgPyB0aGlzLmxvYWRlZFVzZXJJbWFnZSAhPT0gdGhpcy5sYXlvdXRzLmZpbmQobGF5b3V0ID0+IGxheW91dC5pZCA9PT0gdGhpcy5fc2VsZWN0TGF5b3V0KT8udXJsID8gdGhpcy5sb2FkZWRVc2VySW1hZ2UgOiBudWxsIDogdGhpcy5sb2FkZWRVc2VySW1hZ2UsXG4gICAgICAgICAgICAgICAgICAgIHdpdGhBaTogdGhpcy5lZGl0b3JMb2FkV2l0aEFpLFxuICAgICAgICAgICAgICAgICAgICBsYXlvdXRJZCxcbiAgICAgICAgICAgICAgICAgICAgaXNOZXc6IHRoaXMuX3NlbGVjdExheW91dCA/IGZhbHNlIDogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VEYXRhID0gYXdhaXQgdGhpcy5nZXRJbWFnZURhdGEodXJsKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW2lucHV0XSBpbWFnZSBkYXRhIHJlY2VpdmVkYCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NlbGVjdExheW91dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYXlvdXQgPSB0aGlzLmxheW91dHMuZmluZChsYXlvdXQgPT4gbGF5b3V0LmlkID09PSBsYXlvdXRJZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXlvdXQgJiYgbGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtpbnB1dF0gdXBkYXRpbmcgbGF5b3V0OiAke2xheW91dC5pZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheW91dC5uYW1lID0gcHJvbXB0O1xuICAgICAgICAgICAgICAgICAgICAgICAgbGF5b3V0LnVybCA9IGltYWdlRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbaW5wdXRdIGxheW91dCB1cGRhdGVkYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTGF5b3V0KExheW91dC5jcmVhdGVJbWFnZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogbGF5b3V0SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB2aWV3OiB0aGlzLl9zZWxlY3RTaWRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBpbWFnZURhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBwcm9tcHRcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQudmFsdWUgPSBcIlwiO1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RMYXlvdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxvYWRlZFVzZXJJbWFnZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc2V0VXNlclVwbG9hZEltYWdlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEdlbmVyYXRlQnV0dG9uTG9hZGluZyhmYWxzZSwgJ+KckyDQk9C+0YLQvtCy0L4hJyk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0R2VuZXJhdGVCdXR0b25Mb2FkaW5nKGZhbHNlLCAn0KHQs9C10L3QtdGA0LjRgNC+0LLQsNGC0YwnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pc0dlbmVyYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dINCk0LvQsNCzIGlzR2VuZXJhdGluZyDRgdCx0YDQvtGI0LXQvScpO1xuICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tmb3JtXSBbaW5wdXRdIGVycm9yJywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIGFsZXJ0KFwi0J7RiNC40LHQutCwINC/0YDQuCDQs9C10L3QtdGA0LDRhtC40Lgg0LjQt9C+0LHRgNCw0LbQtdC90LjRj1wiKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEdlbmVyYXRlQnV0dG9uTG9hZGluZyhmYWxzZSwgJ9Ch0LPQtdC90LXRgNC40YDQvtCy0LDRgtGMJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0dlbmVyYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb2FkZWRVc2VySW1hZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNldFVzZXJVcGxvYWRJbWFnZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc2VsZWN0TGF5b3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdExheW91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FuY2VsRWRpdExheW91dCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgZm9ybSA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtID0gZm9ybUJsb2NrLnF1ZXJ5U2VsZWN0b3IoXCJmb3JtXCIpO1xuICAgICAgICAgICAgICAgIGlmIChmb3JtKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGZvcm0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgfSwgMTAwMCAqIDEwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghZm9ybSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gZm9ybSBub3QgZm91bmQnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBmb3JtLmFjdGlvbiA9IFwiXCI7XG4gICAgICAgIGZvcm0ubWV0aG9kID0gXCJHRVRcIjtcbiAgICAgICAgZm9ybS5vbnN1Ym1pdCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGhhbmRsZUNsaWNrKCk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGZpeElucHV0QmxvY2sgPSBmb3JtLnF1ZXJ5U2VsZWN0b3IoYHRleHRhcmVhW25hbWU9JyR7Zm9ybUlucHV0VmFyaWFibGVOYW1lfSddYCk7XG4gICAgICAgIGlmIChmaXhJbnB1dEJsb2NrKSB7XG4gICAgICAgICAgICBmaXhJbnB1dEJsb2NrLnN0eWxlLnBhZGRpbmcgPSBcIjhweFwiO1xuICAgICAgICB9XG4gICAgICAgIGZvcm1CdXR0b24ub25jbGljayA9IGhhbmRsZUNsaWNrO1xuICAgICAgICBmb3JtQnV0dG9uLnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0g0JjQvdC40YbQuNCw0LvQuNC30LDRhtC40Y8g0YTQvtGA0LzRiyDQt9Cw0LLQtdGA0YjQtdC90LAnKTtcbiAgICB9XG4gICAgcmVzdG9yZUljb25Gcm9tRGF0YU9yaWdpbmFsKGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKCFlbGVtZW50KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBkYXRhT3JpZ2luYWwgPSBlbGVtZW50LmF0dHJpYnV0ZXMuZ2V0TmFtZWRJdGVtKFwiZGF0YS1vcmlnaW5hbFwiKT8udmFsdWU7XG4gICAgICAgIGlmIChkYXRhT3JpZ2luYWwpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gYHVybChcIiR7ZGF0YU9yaWdpbmFsfVwiKWA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2hhbmdlUHJvZHVjdChwcm9kdWN0VHlwZSkge1xuICAgICAgICB0aGlzLl9zZWxlY3RUeXBlID0gcHJvZHVjdFR5cGU7XG4gICAgICAgIHRoaXMuY2xlYXJNb2NrdXBDYWNoZSgpO1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHByb2R1Y3RUeXBlKTtcbiAgICAgICAgaWYgKHByb2R1Y3QpIHtcbiAgICAgICAgICAgIGNvbnN0IG1vY2t1cFdpdGhDdXJyZW50Q29sb3IgPSBwcm9kdWN0Lm1vY2t1cHMuZmluZChtID0+IG0uc2lkZSA9PT0gdGhpcy5fc2VsZWN0U2lkZSAmJiBtLmNvbG9yLm5hbWUgPT09IHRoaXMuX3NlbGVjdENvbG9yLm5hbWUpO1xuICAgICAgICAgICAgaWYgKCFtb2NrdXBXaXRoQ3VycmVudENvbG9yKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlyc3RNb2NrdXAgPSBwcm9kdWN0Lm1vY2t1cHMuZmluZChtID0+IG0uc2lkZSA9PT0gdGhpcy5fc2VsZWN0U2lkZSk7XG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0TW9ja3VwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gZmlyc3RNb2NrdXAuY29sb3I7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtwcm9kdWN0XSDQptCy0LXRgiDQuNC30LzQtdC90LXQvSDQvdCwICR7dGhpcy5fc2VsZWN0Q29sb3IubmFtZX0g0LTQu9GPINC/0YDQvtC00YPQutGC0LAgJHtwcm9kdWN0VHlwZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVQcm9kdWN0QmxvY2tzVUkoKTtcbiAgICAgICAgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgdGhpcy5sb2FkUHJvZHVjdCgpO1xuICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgIH1cbiAgICB1cGRhdGVQcm9kdWN0QmxvY2tzVUkoKSB7XG4gICAgICAgIGlmICh0aGlzLnByb2R1Y3RCbG9ja3MubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnByb2R1Y3RCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICBibG9jay5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYigyMjIgMjIyIDIyMiknO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLnByb2R1Y3RCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fcHJvZHVjdC1ibG9ja19fJyArIHRoaXMuX3NlbGVjdFR5cGUpKTtcbiAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICBhY3RpdmVCbG9jay5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2hhbmdlU2lkZSgpIHtcbiAgICAgICAgY29uc3QgbmV3U2lkZSA9IHRoaXMuX3NlbGVjdFNpZGUgPT09ICdmcm9udCcgPyAnYmFjaycgOiAnZnJvbnQnO1xuICAgICAgICB0aGlzLnNldEFjdGl2ZVNpZGUobmV3U2lkZSk7XG4gICAgICAgIHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuU1RBVEVfQ0hBTkdFRCwgdW5kZWZpbmVkKTtcbiAgICB9XG4gICAgY2hhbmdlQ29sb3IoY29sb3JOYW1lKSB7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgbW9ja3VwID0gcHJvZHVjdC5tb2NrdXBzLmZpbmQobSA9PiBtLmNvbG9yLm5hbWUgPT09IGNvbG9yTmFtZSk7XG4gICAgICAgIGlmICghbW9ja3VwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLl9zZWxlY3RDb2xvciA9IG1vY2t1cC5jb2xvcjtcbiAgICAgICAgdGhpcy5jbGVhck1vY2t1cENhY2hlKCk7XG4gICAgICAgIHRoaXMudXBkYXRlQ29sb3JCbG9ja3NVSShjb2xvck5hbWUpO1xuICAgICAgICB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgIH1cbiAgICB1cGRhdGVDb2xvckJsb2Nrc1VJKGNvbG9yTmFtZSkge1xuICAgICAgICBpZiAodGhpcy5jb2xvckJsb2Nrcy5sZW5ndGggPT09IDApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuY29sb3JCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICBibG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGFjdGl2ZUJsb2NrID0gdGhpcy5jb2xvckJsb2Nrcy5maW5kKGJsb2NrID0+IGJsb2NrLmNsYXNzTGlzdC5jb250YWlucygnZWRpdG9yLXNldHRpbmdzX19jb2xvci1ibG9ja19fJyArIGNvbG9yTmFtZSkpO1xuICAgICAgICBpZiAoYWN0aXZlQmxvY2spIHtcbiAgICAgICAgICAgIGFjdGl2ZUJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2hhbmdlU2l6ZShzaXplKSB7XG4gICAgICAgIHRoaXMudXBkYXRlU2l6ZUJsb2Nrc1VJKHNpemUpO1xuICAgICAgICB0aGlzLl9zZWxlY3RTaXplID0gc2l6ZTtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICB9XG4gICAgdXBkYXRlU2l6ZUJsb2Nrc1VJKHNpemUpIHtcbiAgICAgICAgaWYgKHRoaXMuc2l6ZUJsb2Nrcy5sZW5ndGggPT09IDApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuc2l6ZUJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGJvcmRlckJsb2NrID0gYmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBpZiAoYm9yZGVyQmxvY2spIHtcbiAgICAgICAgICAgICAgICBib3JkZXJCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGFjdGl2ZUJsb2NrID0gdGhpcy5zaXplQmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX3NpemUtYmxvY2tfXycgKyBzaXplKSk7XG4gICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgY29uc3QgYm9yZGVyQmxvY2sgPSBhY3RpdmVCbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGlmIChib3JkZXJCbG9jaykge1xuICAgICAgICAgICAgICAgIGJvcmRlckJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWRpdExheW91dChsYXlvdXQpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBbbGF5b3V0c10gZWRpdCBsYXlvdXQgJHtsYXlvdXQuaWR9YCk7XG4gICAgICAgIHRoaXMuX3NlbGVjdExheW91dCA9IGxheW91dC5pZDtcbiAgICAgICAgaWYgKHRoaXMuZm9ybUJsb2NrICYmIHRoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lKSB7XG4gICAgICAgICAgICBjb25zdCBmb3JtSW5wdXQgPSB0aGlzLmZvcm1CbG9jay5xdWVyeVNlbGVjdG9yKGBbbmFtZT1cIiR7dGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWV9XCJdYCk7XG4gICAgICAgICAgICBpZiAoZm9ybUlucHV0KSB7XG4gICAgICAgICAgICAgICAgZm9ybUlucHV0LnZhbHVlID0gbGF5b3V0Lm5hbWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgZm9ybUlucHV0LnN0eWxlLmJvcmRlckNvbG9yID0gJ3JnYigyNTQsIDk0LCA1OCknO1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gW2xheW91dHNdINCj0YHRgtCw0L3QvtCy0LvQtdC90L4g0LfQvdCw0YfQtdC90LjQtSDQsiDRhNC+0YDQvNGDOiBcIiR7bGF5b3V0Lm5hbWV9XCJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW3NldHRpbmdzXSBbbGF5b3V0c10g0J3QtSDQvdCw0LnQtNC10L0g0Y3Qu9C10LzQtdC90YIg0YTQvtGA0LzRiyDRgSDQuNC80LXQvdC10LwgXCIke3RoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lfVwiYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxheW91dC5pc0ltYWdlTGF5b3V0KCkpIHtcbiAgICAgICAgICAgIHRoaXMubG9hZGVkVXNlckltYWdlID0gbGF5b3V0LnVybDtcbiAgICAgICAgICAgIHRoaXMuc2V0VXNlclVwbG9hZEltYWdlKGxheW91dC51cmwpO1xuICAgICAgICAgICAgdGhpcy5pbml0QWlCdXR0b25zKCk7XG4gICAgICAgICAgICB0aGlzLmhpZGVBaUJ1dHRvbnMoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubG9hZGVkVXNlckltYWdlID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMucmVzZXRVc2VyVXBsb2FkSW1hZ2UoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgfVxuICAgIGNhbmNlbEVkaXRMYXlvdXQoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gW2xheW91dHNdIGNhbmNlbCBlZGl0IGxheW91dGApO1xuICAgICAgICB0aGlzLl9zZWxlY3RMYXlvdXQgPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5mb3JtQmxvY2sgJiYgdGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGZvcm1JbnB1dCA9IHRoaXMuZm9ybUJsb2NrLnF1ZXJ5U2VsZWN0b3IoYFtuYW1lPVwiJHt0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZX1cIl1gKTtcbiAgICAgICAgICAgIGlmIChmb3JtSW5wdXQpIHtcbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQudmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQuc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YzZjNmMyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBudWxsO1xuICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZXNldFVzZXJVcGxvYWRJbWFnZSgpO1xuICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gW2xheW91dHNdINCg0LXQtNCw0LrRgtC40YDQvtCy0LDQvdC40LUg0L7RgtC80LXQvdC10L3QvmApO1xuICAgIH1cbiAgICBpbml0QWlCdXR0b25zKCkge1xuICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jaGFuZ2VMb2FkV2l0aEFpKCk7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZUxvYWRXaXRoQWkodHJ1ZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZUxvYWRXaXRoQWkoZmFsc2UpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBoaWRlQWlCdXR0b25zKCkge1xuICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWkgPSB0cnVlO1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uKSB7XG4gICAgICAgICAgICAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uLnBhcmVudEVsZW1lbnQ/LnBhcmVudEVsZW1lbnQ/LnBhcmVudEVsZW1lbnQpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2hvd0FpQnV0dG9ucygpIHtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbikge1xuICAgICAgICAgICAgKHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbi5wYXJlbnRFbGVtZW50Py5wYXJlbnRFbGVtZW50Py5wYXJlbnRFbGVtZW50KS5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgICB9XG4gICAgfVxuICAgIHVwbG9hZFVzZXJJbWFnZSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZCB1c2VyIGltYWdlXSBzdGFydGluZyB1c2VyIGltYWdlIHVwbG9hZCcpO1xuICAgICAgICB0aGlzLmluaXRBaUJ1dHRvbnMoKTtcbiAgICAgICAgdGhpcy5zaG93QWlCdXR0b25zKCk7XG4gICAgICAgIGNvbnN0IGZpbGVJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgIGZpbGVJbnB1dC50eXBlID0gJ2ZpbGUnO1xuICAgICAgICBmaWxlSW5wdXQuYWNjZXB0ID0gJ2ltYWdlLyonO1xuICAgICAgICBmaWxlSW5wdXQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgZmlsZUlucHV0Lm9uY2hhbmdlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG4gICAgICAgICAgICBjb25zdCBmaWxlID0gdGFyZ2V0LmZpbGVzPy5bMF07XG4gICAgICAgICAgICBpZiAoZmlsZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWQgdXNlciBpbWFnZV0gZmlsZSBzZWxlY3RlZDonLCBmaWxlLm5hbWUpO1xuICAgICAgICAgICAgICAgIGlmICghZmlsZS50eXBlLnN0YXJ0c1dpdGgoJ2ltYWdlLycpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW3VwbG9hZCB1c2VyIGltYWdlXSBzZWxlY3RlZCBmaWxlIGlzIG5vdCBhbiBpbWFnZScpO1xuICAgICAgICAgICAgICAgICAgICBhbGVydCgn0J/QvtC20LDQu9GD0LnRgdGC0LAsINCy0YvQsdC10YDQuNGC0LUg0YTQsNC50Lsg0LjQt9C+0LHRgNCw0LbQtdC90LjRjycpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGFzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlVXJsID0gZS50YXJnZXQ/LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZCB1c2VyIGltYWdlXSBmaWxlIGxvYWRlZCBhcyBkYXRhIFVSTCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbWFnZURhdGEgPSBhd2FpdCB0aGlzLmdldEltYWdlRGF0YShpbWFnZVVybCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0VXNlclVwbG9hZEltYWdlKGltYWdlRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWQgdXNlciBpbWFnZV0gaW1hZ2UgbGF5b3V0IGFkZGVkIHN1Y2Nlc3NmdWxseScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1t1cGxvYWQgdXNlciBpbWFnZV0gZXJyb3IgcmVhZGluZyBmaWxlJyk7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCfQntGI0LjQsdC60LAg0L/RgNC4INC30LDQs9GA0YPQt9C60LUg0YTQsNC50LvQsCcpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZmlsZUlucHV0KTtcbiAgICAgICAgZmlsZUlucHV0LmNsaWNrKCk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZmlsZUlucHV0KTtcbiAgICB9XG4gICAgc2V0VXNlclVwbG9hZEltYWdlKGltYWdlKSB7XG4gICAgICAgIHRoaXMubG9hZGVkVXNlckltYWdlID0gaW1hZ2U7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvclVwbG9hZFZpZXdCbG9jaykge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2suc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICBjb25zdCBpbWFnZUJsb2NrID0gZ2V0TGFzdENoaWxkKHRoaXMuZWRpdG9yVXBsb2FkVmlld0Jsb2NrKTtcbiAgICAgICAgICAgIGlmIChpbWFnZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VCbG9jay5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBgdXJsKCR7aW1hZ2V9KWA7XG4gICAgICAgICAgICAgICAgaW1hZ2VCbG9jay5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9ICdjb250YWluJztcbiAgICAgICAgICAgICAgICBpbWFnZUJsb2NrLnN0eWxlLmJhY2tncm91bmRQb3NpdGlvbiA9ICdjZW50ZXInO1xuICAgICAgICAgICAgICAgIGltYWdlQmxvY2suc3R5bGUuYmFja2dyb3VuZFJlcGVhdCA9ICduby1yZXBlYXQnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJlc2V0VXNlclVwbG9hZEltYWdlKCkge1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkVmlld0Jsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICB0aGlzLmVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWQgaW1hZ2UgYnV0dG9uXSBjYW5jZWwgYnV0dG9uIGNsaWNrZWQnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNhbmNlbEVkaXRMYXlvdXQoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2hhbmdlTG9hZFdpdGhBaSh2YWx1ZSA9IGZhbHNlKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IHZhbHVlO1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uICYmIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbikge1xuICAgICAgICAgICAgY29uc3QgYnV0dG9uV2l0aEFpID0gdGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uO1xuICAgICAgICAgICAgY29uc3QgYnV0dG9uV2l0aG91dEFpID0gdGhpcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZml4QnV0dG9uV2l0aEFpID0gZ2V0TGFzdENoaWxkKGJ1dHRvbldpdGhBaSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZml4QnV0dG9uV2l0aG91dEFpID0gZ2V0TGFzdENoaWxkKGJ1dHRvbldpdGhvdXRBaSk7XG4gICAgICAgICAgICAgICAgaWYgKGZpeEJ1dHRvbldpdGhBaSkge1xuICAgICAgICAgICAgICAgICAgICBmaXhCdXR0b25XaXRoQWkuc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZpeEJ1dHRvbldpdGhvdXRBaSkge1xuICAgICAgICAgICAgICAgICAgICBmaXhCdXR0b25XaXRob3V0QWkuc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YyZjJmMic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZml4QnV0dG9uV2l0aEFpID0gZ2V0TGFzdENoaWxkKGJ1dHRvbldpdGhBaSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZml4QnV0dG9uV2l0aG91dEFpID0gZ2V0TGFzdENoaWxkKGJ1dHRvbldpdGhvdXRBaSk7XG4gICAgICAgICAgICAgICAgaWYgKGZpeEJ1dHRvbldpdGhBaSkge1xuICAgICAgICAgICAgICAgICAgICBmaXhCdXR0b25XaXRoQWkuc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YyZjJmMic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmaXhCdXR0b25XaXRob3V0QWkpIHtcbiAgICAgICAgICAgICAgICAgICAgZml4QnV0dG9uV2l0aG91dEFpLnN0eWxlLmJvcmRlckNvbG9yID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGxvYWRJbWFnZShzcmMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgaW1nLmNyb3NzT3JpZ2luID0gJ2Fub255bW91cyc7XG4gICAgICAgICAgICBpbWcub25sb2FkID0gKCkgPT4gcmVzb2x2ZShpbWcpO1xuICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSByZWplY3Q7XG4gICAgICAgICAgICBpbWcuc3JjID0gc3JjO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0UXVhbnRpdHkoKSB7XG4gICAgICAgIGlmICghdGhpcy5xdWFudGl0eUZvcm1CbG9jaylcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICBjb25zdCBmb3JtID0gdGhpcy5xdWFudGl0eUZvcm1CbG9jay5xdWVyeVNlbGVjdG9yKCdmb3JtJyk7XG4gICAgICAgIGNvbnN0IGlucHV0ID0gZm9ybT8ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cInF1YW50aXR5XCJdJyk7XG4gICAgICAgIGlmICghaW5wdXQpXG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KGlucHV0LnZhbHVlKSB8fCAxO1xuICAgIH1cbiAgICBnZXRTdW0oKSB7XG4gICAgICAgIGNvbnN0IGhhc0Zyb250ID0gdGhpcy5sYXlvdXRzLnNvbWUobGF5b3V0ID0+IGxheW91dC52aWV3ID09PSAnZnJvbnQnKTtcbiAgICAgICAgY29uc3QgaGFzQmFjayA9IHRoaXMubGF5b3V0cy5zb21lKGxheW91dCA9PiBsYXlvdXQudmlldyA9PT0gJ2JhY2snKTtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0KVxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIGNvbnN0IHByaWNlID0gaGFzQmFjayAmJiBoYXNGcm9udFxuICAgICAgICAgICAgPyBwcm9kdWN0LmRvdWJsZVNpZGVkUHJpY2VcbiAgICAgICAgICAgIDogcHJvZHVjdC5wcmljZTtcbiAgICAgICAgcmV0dXJuIHByaWNlO1xuICAgIH1cbiAgICB1cGRhdGVTdW0oKSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JTdW1CbG9jaylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgc3VtID0gdGhpcy5nZXRTdW0oKTtcbiAgICAgICAgY29uc3Qgc3VtVGV4dCA9IGdldExhc3RDaGlsZCh0aGlzLmVkaXRvclN1bUJsb2NrKTtcbiAgICAgICAgaWYgKHN1bVRleHQpIHtcbiAgICAgICAgICAgIHN1bVRleHQuaW5uZXJUZXh0ID0gc3VtLnRvU3RyaW5nKCkgKyAnIOKCvSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24pIHtcbiAgICAgICAgICAgIGNvbnN0IGJ1dHRvbkJsb2NrID0gZ2V0TGFzdENoaWxkKHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24pO1xuICAgICAgICAgICAgaWYgKGJ1dHRvbkJsb2NrKSB7XG4gICAgICAgICAgICAgICAgYnV0dG9uQmxvY2suc3R5bGUuYmFja2dyb3VuZENvbG9yID0gc3VtID09PSAwID8gJ3JnYigxMjEgMTIxIDEyMSknIDogJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgbG9hZFByb2R1Y3QoKSB7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdCB8fCAhcHJvZHVjdC5wcmludENvbmZpZykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbcHJvZHVjdF0gcHJvZHVjdCBvciBwcmludENvbmZpZyBub3QgZm91bmQnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNsZWFyQWxsQ2FudmFzKCk7XG4gICAgICAgIGZvciAoY29uc3QgcHJpbnRDb25maWcgb2YgcHJvZHVjdC5wcmludENvbmZpZykge1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVDYW52YXNGb3JTaWRlKHByaW50Q29uZmlnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldEFjdGl2ZVNpZGUodGhpcy5fc2VsZWN0U2lkZSk7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIGZhbHNlKTtcbiAgICAgICAgfSwgMTAwKTtcbiAgICB9XG4gICAgY2xlYXJBbGxDYW52YXMoKSB7XG4gICAgICAgIGlmICh0aGlzLmNhbnZhc2VzQ29udGFpbmVyKSB7XG4gICAgICAgICAgICB0aGlzLmNhbnZhc2VzQ29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2FudmFzZXMuZm9yRWFjaChjYW52YXMgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjYW52YXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tjYW52YXNdINCe0YjQuNCx0LrQsCDQvtGH0LjRgdGC0LrQuCBjYW52YXM6JywgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY2FudmFzZXMgPSBbXTtcbiAgICAgICAgdGhpcy5sYXllcnNDYW52YXNlcyA9IFtdO1xuICAgICAgICB0aGlzLmFjdGl2ZUNhbnZhcyA9IG51bGw7XG4gICAgfVxuICAgIGNyZWF0ZUNhbnZhc0ZvclNpZGUocHJpbnRDb25maWcpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbnZhc2VzQ29udGFpbmVyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbY2FudmFzXSBjYW52YXNlc0NvbnRhaW5lciDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvScpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxheWVyc0NhbnZhc0Jsb2NrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGxheWVyc0NhbnZhc0Jsb2NrLmlkID0gJ2xheWVycy0tJyArIHByaW50Q29uZmlnLnNpZGU7XG4gICAgICAgIGxheWVyc0NhbnZhc0Jsb2NrLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1wb3NpdGlvbicpO1xuICAgICAgICBsYXllcnNDYW52YXNCbG9jay5zZXRBdHRyaWJ1dGUoJ3JlZicsIHByaW50Q29uZmlnLnNpZGUpO1xuICAgICAgICBsYXllcnNDYW52YXNCbG9jay5zdHlsZS56SW5kZXggPSAnNyc7XG4gICAgICAgIHRoaXMuY2FudmFzZXNDb250YWluZXIuYXBwZW5kQ2hpbGQobGF5ZXJzQ2FudmFzQmxvY2spO1xuICAgICAgICBjb25zdCBsYXllcnNDYW52YXMgPSBuZXcgZmFicmljLlN0YXRpY0NhbnZhcyhsYXllcnNDYW52YXNCbG9jaywge1xuICAgICAgICAgICAgd2lkdGg6IHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0LFxuICAgICAgICB9KTtcbiAgICAgICAgbGF5ZXJzQ2FudmFzLnNpZGUgPSBwcmludENvbmZpZy5zaWRlO1xuICAgICAgICBsYXllcnNDYW52YXMubmFtZSA9ICdzdGF0aWMtJyArIHByaW50Q29uZmlnLnNpZGU7XG4gICAgICAgIGNvbnN0IGVkaXRhYmxlQ2FudmFzQmxvY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgZWRpdGFibGVDYW52YXNCbG9jay5pZCA9ICdlZGl0YWJsZS0tJyArIHByaW50Q29uZmlnLnNpZGU7XG4gICAgICAgIGVkaXRhYmxlQ2FudmFzQmxvY2suc2V0QXR0cmlidXRlKCdyZWYnLCBwcmludENvbmZpZy5zaWRlKTtcbiAgICAgICAgZWRpdGFibGVDYW52YXNCbG9jay5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItcG9zaXRpb24nKTtcbiAgICAgICAgZWRpdGFibGVDYW52YXNCbG9jay5zdHlsZS56SW5kZXggPSAnOSc7XG4gICAgICAgIHRoaXMuY2FudmFzZXNDb250YWluZXIuYXBwZW5kQ2hpbGQoZWRpdGFibGVDYW52YXNCbG9jayk7XG4gICAgICAgIGNvbnN0IGVkaXRhYmxlQ2FudmFzID0gbmV3IGZhYnJpYy5DYW52YXMoZWRpdGFibGVDYW52YXNCbG9jaywge1xuICAgICAgICAgICAgY29udHJvbHNBYm92ZU92ZXJsYXk6IHRydWUsXG4gICAgICAgICAgICB3aWR0aDogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICB1bmlmb3JtU2NhbGluZzogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgZWRpdGFibGVDYW52YXMuc2lkZSA9IHByaW50Q29uZmlnLnNpZGU7XG4gICAgICAgIGVkaXRhYmxlQ2FudmFzLm5hbWUgPSAnZWRpdGFibGUtJyArIHByaW50Q29uZmlnLnNpZGU7XG4gICAgICAgIHRoaXMubGF5ZXJzQ2FudmFzZXMucHVzaChsYXllcnNDYW52YXMpO1xuICAgICAgICB0aGlzLmNhbnZhc2VzLnB1c2goZWRpdGFibGVDYW52YXMpO1xuICAgICAgICBpZiAodGhpcy5jYW52YXNlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlQ2FudmFzID0gZWRpdGFibGVDYW52YXM7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbml0TWFpbkNhbnZhcyhlZGl0YWJsZUNhbnZhcywgcHJpbnRDb25maWcpO1xuICAgIH1cbiAgICBpbml0TWFpbkNhbnZhcyhjYW52YXMsIHByaW50Q29uZmlnKSB7XG4gICAgICAgIGlmICghY2FudmFzIHx8ICEoY2FudmFzIGluc3RhbmNlb2YgZmFicmljLkNhbnZhcykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2NhbnZhc10gY2FudmFzINC90LUg0LLQsNC70LjQtNC10L0nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB3aWR0aCA9IHByaW50Q29uZmlnLnNpemUud2lkdGggLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBwcmludENvbmZpZy5zaXplLmhlaWdodCAvIDYwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0O1xuICAgICAgICBjb25zdCBsZWZ0ID0gKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGggLSB3aWR0aCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnggLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoKTtcbiAgICAgICAgY29uc3QgdG9wID0gKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0IC0gaGVpZ2h0KSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueSAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgY29uc3QgY2xpcEFyZWEgPSBuZXcgZmFicmljLlJlY3Qoe1xuICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQsXG4gICAgICAgICAgICBsZWZ0LFxuICAgICAgICAgICAgdG9wLFxuICAgICAgICAgICAgZmlsbDogJ3JnYigyNTUsIDAsIDApJyxcbiAgICAgICAgICAgIG5hbWU6ICdhcmVhOmNsaXAnLFxuICAgICAgICAgICAgZXZlbnRlZDogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBhcmVhQm9yZGVyID0gbmV3IGZhYnJpYy5SZWN0KHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCAtIDMsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCAtIDMsXG4gICAgICAgICAgICBsZWZ0LFxuICAgICAgICAgICAgdG9wLFxuICAgICAgICAgICAgZmlsbDogJ3JnYmEoMCwwLDAsMCknLFxuICAgICAgICAgICAgc3Ryb2tlV2lkdGg6IDMsXG4gICAgICAgICAgICBzdHJva2U6ICdyZ2IoMjU0LCA5NCwgNTgpJyxcbiAgICAgICAgICAgIG5hbWU6ICdhcmVhOmJvcmRlcicsXG4gICAgICAgICAgICBvcGFjaXR5OiAwLjMsXG4gICAgICAgICAgICBldmVudGVkOiBmYWxzZSxcbiAgICAgICAgICAgIHNlbGVjdGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgaGFzQ29udHJvbHM6IGZhbHNlLFxuICAgICAgICAgICAgc3Ryb2tlRGFzaEFycmF5OiBbNSwgNV0sXG4gICAgICAgIH0pO1xuICAgICAgICBjYW52YXMuYWRkKGFyZWFCb3JkZXIpO1xuICAgICAgICBjYW52YXMuY2xpcFBhdGggPSBjbGlwQXJlYTtcbiAgICAgICAgdGhpcy5zZXR1cENhbnZhc0V2ZW50SGFuZGxlcnMoY2FudmFzLCBwcmludENvbmZpZyk7XG4gICAgfVxuICAgIHNldHVwQ2FudmFzRXZlbnRIYW5kbGVycyhjYW52YXMsIHByaW50Q29uZmlnKSB7XG4gICAgICAgIGNhbnZhcy5vbignbW91c2U6ZG93bicsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGJvcmRlciA9IHRoaXMuZ2V0T2JqZWN0KCdhcmVhOmJvcmRlcicsIGNhbnZhcyk7XG4gICAgICAgICAgICBpZiAoYm9yZGVyKSB7XG4gICAgICAgICAgICAgICAgYm9yZGVyLnNldCgnb3BhY2l0eScsIDAuOCk7XG4gICAgICAgICAgICAgICAgY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNhbnZhcy5vbignbW91c2U6dXAnLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBib3JkZXIgPSB0aGlzLmdldE9iamVjdCgnYXJlYTpib3JkZXInLCBjYW52YXMpO1xuICAgICAgICAgICAgaWYgKGJvcmRlcikge1xuICAgICAgICAgICAgICAgIGJvcmRlci5zZXQoJ29wYWNpdHknLCAwLjMpO1xuICAgICAgICAgICAgICAgIGNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjYW52YXMub24oJ29iamVjdDpyb3RhdGluZycsIChlKSA9PiB7XG4gICAgICAgICAgICBpZiAoZS50YXJnZXQ/LmFuZ2xlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhbmdsZXMgPSBbMCwgOTAsIDE4MCwgMjcwXTtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50QW5nbGUgPSBlLnRhcmdldC5hbmdsZSAlIDM2MDtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHNuYXBBbmdsZSBvZiBhbmdsZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGN1cnJlbnRBbmdsZSAtIHNuYXBBbmdsZSkgPCA1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnRhcmdldC5yb3RhdGUoc25hcEFuZ2xlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNhbnZhcy5vbignb2JqZWN0Om1vdmluZycsIChlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZU9iamVjdE1vdmluZyhlLCBjYW52YXMsIHByaW50Q29uZmlnKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNhbnZhcy5vbignb2JqZWN0Om1vZGlmaWVkJywgKGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlT2JqZWN0TW9kaWZpZWQoZSwgY2FudmFzLCBwcmludENvbmZpZyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBoYW5kbGVPYmplY3RNb3ZpbmcoZSwgY2FudmFzLCBwcmludENvbmZpZykge1xuICAgICAgICBpZiAoIWUudGFyZ2V0IHx8IGUudGFyZ2V0Lm5hbWUgPT09ICdhcmVhOmJvcmRlcicgfHwgZS50YXJnZXQubmFtZSA9PT0gJ2FyZWE6Y2xpcCcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsYXlvdXQgPSB0aGlzLmxheW91dHMuZmluZChsID0+IGwuaWQgPT09IGUudGFyZ2V0Lm5hbWUpO1xuICAgICAgICBpZiAoIWxheW91dClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgd2lkdGggPSBwcmludENvbmZpZy5zaXplLndpZHRoIC8gNjAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aDtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gcHJpbnRDb25maWcuc2l6ZS5oZWlnaHQgLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodDtcbiAgICAgICAgY29uc3QgbGVmdCA9IE1hdGgucm91bmQoKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGggLSB3aWR0aCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnggLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoKSk7XG4gICAgICAgIGNvbnN0IHRvcCA9IE1hdGgucm91bmQoKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0IC0gaGVpZ2h0KSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueSAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0KSk7XG4gICAgICAgIGNvbnN0IG9ialdpZHRoID0gZS50YXJnZXQud2lkdGggKiBlLnRhcmdldC5zY2FsZVg7XG4gICAgICAgIGNvbnN0IG9iakhlaWdodCA9IGUudGFyZ2V0LmhlaWdodCAqIGUudGFyZ2V0LnNjYWxlWTtcbiAgICAgICAgY29uc3Qgb2JqQ2VudGVyTGVmdCA9IGUudGFyZ2V0LmxlZnQgKyBvYmpXaWR0aCAvIDI7XG4gICAgICAgIGNvbnN0IG9iakNlbnRlclRvcCA9IGUudGFyZ2V0LnRvcCArIG9iakhlaWdodCAvIDI7XG4gICAgICAgIGNvbnN0IG5lYXJYID0gTWF0aC5hYnMob2JqQ2VudGVyTGVmdCAtIChsZWZ0ICsgd2lkdGggLyAyKSkgPCA3O1xuICAgICAgICBjb25zdCBuZWFyWSA9IE1hdGguYWJzKG9iakNlbnRlclRvcCAtICh0b3AgKyBoZWlnaHQgLyAyKSkgPCA3O1xuICAgICAgICBpZiAobmVhclgpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0d1aWRlbGluZShjYW52YXMsICd2ZXJ0aWNhbCcsIGxlZnQgKyB3aWR0aCAvIDIsIDAsIGxlZnQgKyB3aWR0aCAvIDIsIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgICAgIGUudGFyZ2V0LnNldCh7IGxlZnQ6IGxlZnQgKyB3aWR0aCAvIDIgLSBvYmpXaWR0aCAvIDIgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmhpZGVHdWlkZWxpbmUoY2FudmFzLCAndmVydGljYWwnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmVhclkpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0d1aWRlbGluZShjYW52YXMsICdob3Jpem9udGFsJywgMCwgdG9wICsgaGVpZ2h0IC8gMiwgdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCwgdG9wICsgaGVpZ2h0IC8gMik7XG4gICAgICAgICAgICBlLnRhcmdldC5zZXQoeyB0b3A6IHRvcCArIGhlaWdodCAvIDIgLSBvYmpIZWlnaHQgLyAyIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5oaWRlR3VpZGVsaW5lKGNhbnZhcywgJ2hvcml6b250YWwnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBoYW5kbGVPYmplY3RNb2RpZmllZChlLCBjYW52YXMsIHByaW50Q29uZmlnKSB7XG4gICAgICAgIGNvbnN0IG9iamVjdCA9IGUudGFyZ2V0O1xuICAgICAgICBpZiAoIW9iamVjdClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5oaWRlR3VpZGVsaW5lKGNhbnZhcywgJ3ZlcnRpY2FsJyk7XG4gICAgICAgIHRoaXMuaGlkZUd1aWRlbGluZShjYW52YXMsICdob3Jpem9udGFsJyk7XG4gICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0cy5maW5kKGwgPT4gbC5pZCA9PT0gb2JqZWN0Lm5hbWUpO1xuICAgICAgICBpZiAoIWxheW91dClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgd2lkdGggPSBwcmludENvbmZpZy5zaXplLndpZHRoIC8gNjAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aDtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gcHJpbnRDb25maWcuc2l6ZS5oZWlnaHQgLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodDtcbiAgICAgICAgY29uc3QgbGVmdCA9IE1hdGgucm91bmQoKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGggLSB3aWR0aCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnggLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoKSk7XG4gICAgICAgIGNvbnN0IHRvcCA9IE1hdGgucm91bmQoKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0IC0gaGVpZ2h0KSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueSAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0KSk7XG4gICAgICAgIGxheW91dC5wb3NpdGlvbi54ID0gKG9iamVjdC5sZWZ0IC0gbGVmdCkgLyB3aWR0aDtcbiAgICAgICAgbGF5b3V0LnBvc2l0aW9uLnkgPSAob2JqZWN0LnRvcCAtIHRvcCkgLyBoZWlnaHQ7XG4gICAgICAgIGxheW91dC5zaXplID0gb2JqZWN0LnNjYWxlWDtcbiAgICAgICAgbGF5b3V0LmFzcGVjdFJhdGlvID0gb2JqZWN0LnNjYWxlWSAvIG9iamVjdC5zY2FsZVg7XG4gICAgICAgIGxheW91dC5hbmdsZSA9IG9iamVjdC5hbmdsZTtcbiAgICAgICAgdGhpcy5zYXZlTGF5b3V0cygpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbbGF5ZXJzXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y8g0YHQu9C+0ZHQsjonLCBlcnIpKTtcbiAgICB9XG4gICAgc2hvd0d1aWRlbGluZShjYW52YXMsIHR5cGUsIHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBgZ3VpZGVsaW5lOiR7dHlwZX1gO1xuICAgICAgICBsZXQgZ3VpZGVsaW5lID0gdGhpcy5nZXRPYmplY3QobmFtZSwgY2FudmFzKTtcbiAgICAgICAgaWYgKCFndWlkZWxpbmUpIHtcbiAgICAgICAgICAgIGd1aWRlbGluZSA9IG5ldyBmYWJyaWMuTGluZShbeDEsIHkxLCB4MiwgeTJdLCB7XG4gICAgICAgICAgICAgICAgc3Ryb2tlOiAncmdiKDI1NCwgOTQsIDU4KScsXG4gICAgICAgICAgICAgICAgc3Ryb2tlV2lkdGg6IDIsXG4gICAgICAgICAgICAgICAgc3Ryb2tlRGFzaEFycmF5OiBbNSwgNV0sXG4gICAgICAgICAgICAgICAgc2VsZWN0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXZlbnRlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGd1aWRlbGluZSkge1xuICAgICAgICAgICAgICAgIGNhbnZhcy5hZGQoZ3VpZGVsaW5lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBoaWRlR3VpZGVsaW5lKGNhbnZhcywgdHlwZSkge1xuICAgICAgICBjb25zdCBndWlkZWxpbmUgPSB0aGlzLmdldE9iamVjdChgZ3VpZGVsaW5lOiR7dHlwZX1gLCBjYW52YXMpO1xuICAgICAgICBpZiAoZ3VpZGVsaW5lKSB7XG4gICAgICAgICAgICBjYW52YXMucmVtb3ZlKGd1aWRlbGluZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0T2JqZWN0KG5hbWUsIGNhbnZhcykge1xuICAgICAgICBjb25zdCB0YXJnZXRDYW52YXMgPSBjYW52YXMgfHwgdGhpcy5hY3RpdmVDYW52YXMgfHwgdGhpcy5jYW52YXNlc1swXTtcbiAgICAgICAgaWYgKCF0YXJnZXRDYW52YXMpXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gdGFyZ2V0Q2FudmFzLmdldE9iamVjdHMoKS5maW5kKG9iaiA9PiBvYmoubmFtZSA9PT0gbmFtZSk7XG4gICAgfVxuICAgIHNldEFjdGl2ZVNpZGUoc2lkZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbY2FudmFzXSDQo9GB0YLQsNC90L7QstC60LAg0LDQutGC0LjQstC90L7QuSDRgdGC0L7RgNC+0L3RizonLCBzaWRlKTtcbiAgICAgICAgdGhpcy5jYW52YXNlcy5mb3JFYWNoKGNhbnZhcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBjYW52YXNFbGVtZW50ID0gY2FudmFzLmdldEVsZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lckVsZW1lbnQgPSBjYW52YXNFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICBpZiAoY2FudmFzLnNpZGUgPT09IHNpZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNhbnZhcyA9IGNhbnZhcztcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhbnZhc0VsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FudmFzRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5sYXllcnNDYW52YXNlcy5mb3JFYWNoKGxheWVyc0NhbnZhcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBjYW52YXNFbGVtZW50ID0gbGF5ZXJzQ2FudmFzLmdldEVsZW1lbnQoKTtcbiAgICAgICAgICAgIGNhbnZhc0VsZW1lbnQuc3R5bGUuZGlzcGxheSA9IGxheWVyc0NhbnZhcy5zaWRlID09PSBzaWRlID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX3NlbGVjdFNpZGUgPSBzaWRlO1xuICAgIH1cbiAgICBhc3luYyBhZGRMYXlvdXRUb0NhbnZhcyhsYXlvdXQpIHtcbiAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNlcy5maW5kKGMgPT4gYy5zaWRlID09PSBsYXlvdXQudmlldyk7XG4gICAgICAgIGlmICghY2FudmFzKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtjYW52YXNdIGNhbnZhcyDQtNC70Y8gJHtsYXlvdXQudmlld30g0L3QtSDQvdCw0LnQtNC10L1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHByaW50Q29uZmlnID0gcHJvZHVjdC5wcmludENvbmZpZy5maW5kKHBjID0+IHBjLnNpZGUgPT09IGxheW91dC52aWV3KTtcbiAgICAgICAgaWYgKCFwcmludENvbmZpZylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgd2lkdGggPSBwcmludENvbmZpZy5zaXplLndpZHRoIC8gNjAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aDtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gcHJpbnRDb25maWcuc2l6ZS5oZWlnaHQgLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodDtcbiAgICAgICAgY29uc3QgbGVmdCA9IE1hdGgucm91bmQoKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGggLSB3aWR0aCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnggLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoKSk7XG4gICAgICAgIGNvbnN0IHRvcCA9IE1hdGgucm91bmQoKHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0IC0gaGVpZ2h0KSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueSAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0KSk7XG4gICAgICAgIGNvbnN0IGFic29sdXRlTGVmdCA9IGxlZnQgKyAod2lkdGggKiBsYXlvdXQucG9zaXRpb24ueCk7XG4gICAgICAgIGNvbnN0IGFic29sdXRlVG9wID0gdG9wICsgKGhlaWdodCAqIGxheW91dC5wb3NpdGlvbi55KTtcbiAgICAgICAgaWYgKGxheW91dC5pc0ltYWdlTGF5b3V0KCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGltYWdlID0gbmV3IGZhYnJpYy5JbWFnZShhd2FpdCB0aGlzLmxvYWRJbWFnZShsYXlvdXQudXJsKSk7XG4gICAgICAgICAgICBpZiAobGF5b3V0LnNpemUgPT09IDEgJiYgaW1hZ2Uud2lkdGggPiB3aWR0aCkge1xuICAgICAgICAgICAgICAgIGxheW91dC5zaXplID0gd2lkdGggLyBpbWFnZS53aWR0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGltYWdlLnNldCh7XG4gICAgICAgICAgICAgICAgbGVmdDogYWJzb2x1dGVMZWZ0LFxuICAgICAgICAgICAgICAgIHRvcDogYWJzb2x1dGVUb3AsXG4gICAgICAgICAgICAgICAgbmFtZTogbGF5b3V0LmlkLFxuICAgICAgICAgICAgICAgIGxheW91dFVybDogbGF5b3V0LnVybCxcbiAgICAgICAgICAgICAgICBzY2FsZVg6IGxheW91dC5zaXplLFxuICAgICAgICAgICAgICAgIHNjYWxlWTogbGF5b3V0LnNpemUgKiBsYXlvdXQuYXNwZWN0UmF0aW8sXG4gICAgICAgICAgICAgICAgYW5nbGU6IGxheW91dC5hbmdsZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2FudmFzLmFkZChpbWFnZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobGF5b3V0LmlzVGV4dExheW91dCgpKSB7XG4gICAgICAgICAgICBjb25zdCB0ZXh0ID0gbmV3IGZhYnJpYy5UZXh0KGxheW91dC50ZXh0LCB7XG4gICAgICAgICAgICAgICAgZm9udEZhbWlseTogbGF5b3V0LmZvbnQuZmFtaWx5LFxuICAgICAgICAgICAgICAgIGZvbnRTaXplOiBsYXlvdXQuZm9udC5zaXplLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0ZXh0LnNldCh7XG4gICAgICAgICAgICAgICAgdG9wOiBhYnNvbHV0ZVRvcCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBhYnNvbHV0ZUxlZnQsXG4gICAgICAgICAgICAgICAgbmFtZTogbGF5b3V0LmlkLFxuICAgICAgICAgICAgICAgIHNjYWxlWDogbGF5b3V0LnNpemUsXG4gICAgICAgICAgICAgICAgc2NhbGVZOiBsYXlvdXQuc2l6ZSAqIGxheW91dC5hc3BlY3RSYXRpbyxcbiAgICAgICAgICAgICAgICBhbmdsZTogbGF5b3V0LmFuZ2xlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjYW52YXMuYWRkKHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZUxheW91dHMoKSB7XG4gICAgICAgIGlmICghdGhpcy5hY3RpdmVDYW52YXMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0c0ZvclNpZGUodGhpcy5fc2VsZWN0U2lkZSk7XG4gICAgfVxuICAgIHVwZGF0ZUxheW91dHNGb3JTaWRlKHNpZGUpIHtcbiAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy5jYW52YXNlcy5maW5kKGMgPT4gYy5zaWRlID09PSBzaWRlKTtcbiAgICAgICAgaWYgKCFjYW52YXMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IG9iamVjdHMgPSBjYW52YXMuZ2V0T2JqZWN0cygpO1xuICAgICAgICBjb25zdCBvYmplY3RzVG9SZW1vdmUgPSBvYmplY3RzXG4gICAgICAgICAgICAuZmlsdGVyKG9iaiA9PiBvYmoubmFtZSAhPT0gJ2FyZWE6Ym9yZGVyJyAmJiBvYmoubmFtZSAhPT0gJ2FyZWE6Y2xpcCcgJiYgIW9iai5uYW1lPy5zdGFydHNXaXRoKCdndWlkZWxpbmUnKSlcbiAgICAgICAgICAgIC5maWx0ZXIob2JqID0+ICF0aGlzLmxheW91dHMuZmluZChsYXlvdXQgPT4gbGF5b3V0LmlkID09PSBvYmoubmFtZSkpO1xuICAgICAgICBvYmplY3RzVG9SZW1vdmUuZm9yRWFjaChvYmogPT4ge1xuICAgICAgICAgICAgY2FudmFzLnJlbW92ZShvYmopO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgbGF5b3V0c0ZvclNpZGUgPSB0aGlzLmxheW91dHMuZmlsdGVyKGxheW91dCA9PiBsYXlvdXQudmlldyA9PT0gc2lkZSk7XG4gICAgICAgIGNvbnN0IG9iamVjdHNUb1VwZGF0ZSA9IFtdO1xuICAgICAgICBjb25zdCBvYmplY3RzVG9BZGQgPSBbXTtcbiAgICAgICAgbGF5b3V0c0ZvclNpZGUuZm9yRWFjaChsYXlvdXQgPT4ge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdPYmogPSBvYmplY3RzLmZpbmQob2JqID0+IG9iai5uYW1lID09PSBsYXlvdXQuaWQpO1xuICAgICAgICAgICAgaWYgKGV4aXN0aW5nT2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxheW91dC5pc0ltYWdlTGF5b3V0KCkgJiYgZXhpc3RpbmdPYmoubGF5b3V0VXJsICE9PSBsYXlvdXQudXJsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtjYW52YXNdIExheW91dCAke2xheW91dC5pZH0g0LjQt9C80LXQvdC40LvRgdGPLCDRgtGA0LXQsdGD0LXRgtGB0Y8g0L7QsdC90L7QstC70LXQvdC40LVgKTtcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0c1RvVXBkYXRlLnB1c2gobGF5b3V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBvYmplY3RzVG9BZGQucHVzaChsYXlvdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgb2JqZWN0c1RvVXBkYXRlLmZvckVhY2gobGF5b3V0ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nT2JqID0gb2JqZWN0cy5maW5kKG9iaiA9PiBvYmoubmFtZSA9PT0gbGF5b3V0LmlkKTtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ09iaikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtjYW52YXNdINCj0LTQsNC70Y/QtdC8INGB0YLQsNGA0YvQuSDQvtCx0YrQtdC60YIg0LTQu9GPINC+0LHQvdC+0LLQu9C10L3QuNGPOiAke2xheW91dC5pZH1gKTtcbiAgICAgICAgICAgICAgICBjYW52YXMucmVtb3ZlKGV4aXN0aW5nT2JqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtjYW52YXNdINCU0L7QsdCw0LLQu9GP0LXQvCDQvtCx0L3QvtCy0LvQtdC90L3Ri9C5INC+0LHRitC10LrRgjogJHtsYXlvdXQuaWR9YCk7XG4gICAgICAgICAgICB0aGlzLmFkZExheW91dFRvQ2FudmFzKGxheW91dCk7XG4gICAgICAgIH0pO1xuICAgICAgICBvYmplY3RzVG9BZGQuZm9yRWFjaChsYXlvdXQgPT4ge1xuICAgICAgICAgICAgdGhpcy5hZGRMYXlvdXRUb0NhbnZhcyhsYXlvdXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLnJlbmRlckFsbCgpO1xuICAgIH1cbiAgICBhc3luYyBwcmVsb2FkQWxsTW9ja3VwcygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3ByZWxvYWRdINCd0LDRh9Cw0LvQviDQv9GA0LXQtNC30LDQs9GA0YPQt9C60LggbW9ja3VwcycpO1xuICAgICAgICBmb3IgKGNvbnN0IHByb2R1Y3Qgb2YgdGhpcy5wcm9kdWN0Q29uZmlncykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtb2NrdXAgb2YgcHJvZHVjdC5tb2NrdXBzKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9ja3VwRGF0YVVybCA9IGF3YWl0IHRoaXMuZ2V0SW1hZ2VEYXRhKG1vY2t1cC51cmwpO1xuICAgICAgICAgICAgICAgICAgICBtb2NrdXAudXJsID0gbW9ja3VwRGF0YVVybDtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3ByZWxvYWRdIE1vY2t1cCDQt9Cw0LPRgNGD0LbQtdC9OiAke21vY2t1cC5jb2xvci5uYW1lfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW3ByZWxvYWRdINCe0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4IG1vY2t1cCAke21vY2t1cC51cmx9OmAsIGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3ByZWxvYWRdINCf0YDQtdC00LfQsNCz0YDRg9C30LrQsCDQt9Cw0LLQtdGA0YjQtdC90LAnKTtcbiAgICB9XG4gICAgYXN5bmMgZ2V0SW1hZ2VEYXRhKHVybCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2FkQW5kQ29udmVydEltYWdlKHVybCk7XG4gICAgfVxuICAgIGFzeW5jIHVwbG9hZEltYWdlKGZpbGUpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZF0g0JfQsNCz0YDRg9C30LrQsCDRhNCw0LnQu9CwOicsIGZpbGUubmFtZSk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGFzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YVVybCA9IGUudGFyZ2V0Py5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZERhdGFVcmwgPSBhd2FpdCB0aGlzLmdldEltYWdlRGF0YShkYXRhVXJsKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZF0g0KTQsNC50Lsg0YPRgdC/0LXRiNC90L4g0LfQsNCz0YDRg9C20LXQvScpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGNvbnZlcnRlZERhdGFVcmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3VwbG9hZF0g0J7RiNC40LHQutCwINC+0LHRgNCw0LHQvtGC0LrQuCDRhNCw0LnQu9CwOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3VwbG9hZF0g0J7RiNC40LHQutCwINGH0YLQtdC90LjRjyDRhNCw0LnQu9CwJyk7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcign0J3QtSDRg9C00LDQu9C+0YHRjCDQv9GA0L7Rh9C40YLQsNGC0Ywg0YTQsNC50LsnKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyB1cGxvYWRJbWFnZVRvU2VydmVyKGJhc2U2NCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkXSDQl9Cw0LPRgNGD0LfQutCwINC40LfQvtCx0YDQsNC20LXQvdC40Y8g0L3QsCDRgdC10YDQstC10YAnKTtcbiAgICAgICAgY29uc3QgdXNlcklkID0gYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci5nZXRVc2VySWQoKTtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChBUElfRU5EUE9JTlRTLlVQTE9BRF9JTUFHRSwge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGltYWdlOiBiYXNlNjQsIHVzZXJfaWQ6IHVzZXJJZCB9KSxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZF0g0JjQt9C+0LHRgNCw0LbQtdC90LjQtSDQt9Cw0LPRgNGD0LbQtdC90L4g0L3QsCDRgdC10YDQstC10YA6JywgZGF0YS5pbWFnZV91cmwpO1xuICAgICAgICByZXR1cm4gZGF0YS5pbWFnZV91cmw7XG4gICAgfVxuICAgIGdldFByb2R1Y3ROYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpPy5wcm9kdWN0TmFtZSB8fCAnJztcbiAgICB9XG4gICAgY2FwaXRhbGl6ZUZpcnN0TGV0dGVyKHN0cmluZykge1xuICAgICAgICByZXR1cm4gc3RyaW5nLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyaW5nLnNsaWNlKDEpO1xuICAgIH1cbiAgICBnZXRNb2NrdXBVcmwoc2lkZSkge1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgY29uc3QgbW9ja3VwID0gcHJvZHVjdC5tb2NrdXBzLmZpbmQobW9ja3VwID0+IG1vY2t1cC5zaWRlID09PSBzaWRlICYmIG1vY2t1cC5jb2xvci5uYW1lID09PSB0aGlzLl9zZWxlY3RDb2xvci5uYW1lKTtcbiAgICAgICAgcmV0dXJuIG1vY2t1cCA/IG1vY2t1cC51cmwgOiBudWxsO1xuICAgIH1cbiAgICBhc3luYyBleHBvcnRBcnQod2l0aE1vY2t1cCA9IHRydWUsIHJlc29sdXRpb24gPSAxMDI0KSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICBjb25zdCBzaWRlc1dpdGhMYXllcnMgPSB0aGlzLmdldFNpZGVzV2l0aExheWVycygpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZXhwb3J0XSDQndCw0LnQtNC10L3RiyDRgdGC0L7RgNC+0L3RiyDRgSDRgdC70L7Rj9C80Lg6Jywgc2lkZXNXaXRoTGF5ZXJzLCAnKGZyb250INC/0LXRgNCy0YvQuSknLCB3aXRoTW9ja3VwID8gJ9GBINC80L7QutCw0L/QvtC8JyA6ICfQsdC10Lcg0LzQvtC60LDQv9CwJywgYNGA0LDQt9GA0LXRiNC10L3QuNC1OiAke3Jlc29sdXRpb259cHhgKTtcbiAgICAgICAgY29uc3QgZXhwb3J0UHJvbWlzZXMgPSBzaWRlc1dpdGhMYXllcnMubWFwKGFzeW5jIChzaWRlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4cG9ydGVkU2lkZSA9IGF3YWl0IHRoaXMuZXhwb3J0U2lkZShzaWRlLCB3aXRoTW9ja3VwLCByZXNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAoZXhwb3J0ZWRTaWRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCh0YLQvtGA0L7QvdCwICR7c2lkZX0g0YPRgdC/0LXRiNC90L4g0Y3QutGB0L/QvtGA0YLQuNGA0L7QstCw0L3QsGApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBzaWRlLCBkYXRhOiBleHBvcnRlZFNpZGUgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbZXhwb3J0XSDQntGI0LjQsdC60LAg0L/RgNC4INGN0LrRgdC/0L7RgNGC0LUg0YHRgtC+0YDQvtC90YsgJHtzaWRlfTpgLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGV4cG9ydGVkU2lkZXMgPSBhd2FpdCBQcm9taXNlLmFsbChleHBvcnRQcm9taXNlcyk7XG4gICAgICAgIGV4cG9ydGVkU2lkZXMuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W2l0ZW0uc2lkZV0gPSBpdGVtLmRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQrdC60YHQv9C+0YDRgiDQt9Cw0LLQtdGA0YjQtdC9INC00LvRjyAke09iamVjdC5rZXlzKHJlc3VsdCkubGVuZ3RofSDRgdGC0L7RgNC+0L1gKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgZ2V0U2lkZXNXaXRoTGF5ZXJzKCkge1xuICAgICAgICBjb25zdCBhbGxTaWRlc1dpdGhMYXllcnMgPSBbLi4ubmV3IFNldCh0aGlzLmxheW91dHMubWFwKGxheW91dCA9PiBsYXlvdXQudmlldykpXTtcbiAgICAgICAgcmV0dXJuIGFsbFNpZGVzV2l0aExheWVycy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICBpZiAoYSA9PT0gJ2Zyb250JylcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICBpZiAoYiA9PT0gJ2Zyb250JylcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgZXhwb3J0U2lkZShzaWRlLCB3aXRoTW9ja3VwID0gdHJ1ZSwgcmVzb2x1dGlvbiA9IDEwMjQpIHtcbiAgICAgICAgY29uc3QgY2FudmFzZXMgPSB0aGlzLmdldENhbnZhc2VzRm9yU2lkZShzaWRlKTtcbiAgICAgICAgaWYgKCFjYW52YXNlcy5lZGl0YWJsZUNhbnZhcykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZXhwb3J0XSBDYW52YXMg0LTQu9GPINGB0YLQvtGA0L7QvdGLICR7c2lkZX0g0L3QtSDQvdCw0LnQtNC10L1gKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0c0ZvclNpZGUoc2lkZSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCt0LrRgdC/0L7RgNGC0LjRgNGD0LXQvCDRgdGC0L7RgNC+0L3RgyAke3NpZGV9JHt3aXRoTW9ja3VwID8gJyDRgSDQvNC+0LrQsNC/0L7QvCcgOiAnINCx0LXQtyDQvNC+0LrQsNC/0LAnfSAoJHtyZXNvbHV0aW9ufXB4KS4uLmApO1xuICAgICAgICBpZiAoIXdpdGhNb2NrdXApIHtcbiAgICAgICAgICAgIGNvbnN0IGNyb3BwZWRDYW52YXMgPSBhd2FpdCB0aGlzLmV4cG9ydERlc2lnbldpdGhDbGlwUGF0aChjYW52YXNlcy5lZGl0YWJsZUNhbnZhcywgY2FudmFzZXMubGF5ZXJzQ2FudmFzLCBzaWRlLCByZXNvbHV0aW9uKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCt0LrRgdC/0L7RgNGC0LjRgNC+0LLQsNC9INGH0LjRgdGC0YvQuSDQtNC40LfQsNC50L0g0LTQu9GPICR7c2lkZX0gKNC+0LHRgNC10LfQsNC9INC/0L4gY2xpcFBhdGgpYCk7XG4gICAgICAgICAgICByZXR1cm4gY3JvcHBlZENhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycsIDEuMCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbW9ja3VwSW1nID0gYXdhaXQgdGhpcy5sb2FkTW9ja3VwRm9yU2lkZShzaWRlKTtcbiAgICAgICAgaWYgKCFtb2NrdXBJbWcpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgY29uc3QgeyBjYW52YXM6IHRlbXBDYW52YXMsIGN0eCwgbW9ja3VwRGltZW5zaW9ucyB9ID0gdGhpcy5jcmVhdGVFeHBvcnRDYW52YXMocmVzb2x1dGlvbiwgbW9ja3VwSW1nKTtcbiAgICAgICAgY29uc3QgZGVzaWduQ2FudmFzID0gYXdhaXQgdGhpcy5jcmVhdGVEZXNpZ25DYW52YXMoY2FudmFzZXMuZWRpdGFibGVDYW52YXMsIGNhbnZhc2VzLmxheWVyc0NhbnZhcywgc2lkZSk7XG4gICAgICAgIGN0eC5kcmF3SW1hZ2UoZGVzaWduQ2FudmFzLCAwLCAwLCBkZXNpZ25DYW52YXMud2lkdGgsIGRlc2lnbkNhbnZhcy5oZWlnaHQsIG1vY2t1cERpbWVuc2lvbnMueCwgbW9ja3VwRGltZW5zaW9ucy55LCBtb2NrdXBEaW1lbnNpb25zLndpZHRoLCBtb2NrdXBEaW1lbnNpb25zLmhlaWdodCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCd0LDQu9C+0LbQtdC9INC00LjQt9Cw0LnQvSDQvdCwINC80L7QutCw0L8g0LTQu9GPICR7c2lkZX1gKTtcbiAgICAgICAgcmV0dXJuIHRlbXBDYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnLCAxLjApO1xuICAgIH1cbiAgICBnZXRDYW52YXNlc0ZvclNpZGUoc2lkZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZWRpdGFibGVDYW52YXM6IHRoaXMuY2FudmFzZXMuZmluZChjID0+IGMuc2lkZSA9PT0gc2lkZSksXG4gICAgICAgICAgICBsYXllcnNDYW52YXM6IHRoaXMubGF5ZXJzQ2FudmFzZXMuZmluZChjID0+IGMuc2lkZSA9PT0gc2lkZSlcbiAgICAgICAgfTtcbiAgICB9XG4gICAgYXN5bmMgbG9hZE1vY2t1cEZvclNpZGUoc2lkZSkge1xuICAgICAgICBjb25zdCBtb2NrdXBVcmwgPSB0aGlzLmdldE1vY2t1cFVybChzaWRlKTtcbiAgICAgICAgaWYgKCFtb2NrdXBVcmwpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2V4cG9ydF0g0JzQvtC60LDQvyDQtNC70Y8g0YHRgtC+0YDQvtC90YsgJHtzaWRlfSDQvdC1INC90LDQudC00LXQvWApO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbW9ja3VwSW1nID0gYXdhaXQgdGhpcy5sb2FkSW1hZ2UobW9ja3VwVXJsKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0JfQsNCz0YDRg9C20LXQvSDQvNC+0LrQsNC/INC00LvRjyAke3NpZGV9OiAke21vY2t1cFVybH1gKTtcbiAgICAgICAgcmV0dXJuIG1vY2t1cEltZztcbiAgICB9XG4gICAgY3JlYXRlRXhwb3J0Q2FudmFzKGV4cG9ydFNpemUsIG1vY2t1cEltZykge1xuICAgICAgICBjb25zdCB0ZW1wQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGNvbnN0IGN0eCA9IHRlbXBDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgdGVtcENhbnZhcy53aWR0aCA9IGV4cG9ydFNpemU7XG4gICAgICAgIHRlbXBDYW52YXMuaGVpZ2h0ID0gZXhwb3J0U2l6ZTtcbiAgICAgICAgY29uc3QgbW9ja3VwU2NhbGUgPSBNYXRoLm1pbihleHBvcnRTaXplIC8gbW9ja3VwSW1nLndpZHRoLCBleHBvcnRTaXplIC8gbW9ja3VwSW1nLmhlaWdodCk7XG4gICAgICAgIGNvbnN0IHNjYWxlZE1vY2t1cFdpZHRoID0gbW9ja3VwSW1nLndpZHRoICogbW9ja3VwU2NhbGU7XG4gICAgICAgIGNvbnN0IHNjYWxlZE1vY2t1cEhlaWdodCA9IG1vY2t1cEltZy5oZWlnaHQgKiBtb2NrdXBTY2FsZTtcbiAgICAgICAgY29uc3QgbW9ja3VwWCA9IChleHBvcnRTaXplIC0gc2NhbGVkTW9ja3VwV2lkdGgpIC8gMjtcbiAgICAgICAgY29uc3QgbW9ja3VwWSA9IChleHBvcnRTaXplIC0gc2NhbGVkTW9ja3VwSGVpZ2h0KSAvIDI7XG4gICAgICAgIGN0eC5kcmF3SW1hZ2UobW9ja3VwSW1nLCBtb2NrdXBYLCBtb2NrdXBZLCBzY2FsZWRNb2NrdXBXaWR0aCwgc2NhbGVkTW9ja3VwSGVpZ2h0KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0J3QsNGA0LjRgdC+0LLQsNC9INC80L7QutCw0L8g0LrQsNC6INGE0L7QvSAoJHtzY2FsZWRNb2NrdXBXaWR0aH14JHtzY2FsZWRNb2NrdXBIZWlnaHR9KWApO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY2FudmFzOiB0ZW1wQ2FudmFzLFxuICAgICAgICAgICAgY3R4LFxuICAgICAgICAgICAgbW9ja3VwRGltZW5zaW9uczoge1xuICAgICAgICAgICAgICAgIHg6IG1vY2t1cFgsXG4gICAgICAgICAgICAgICAgeTogbW9ja3VwWSxcbiAgICAgICAgICAgICAgICB3aWR0aDogc2NhbGVkTW9ja3VwV2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBzY2FsZWRNb2NrdXBIZWlnaHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgYXN5bmMgY3JlYXRlRGVzaWduQ2FudmFzKGVkaXRhYmxlQ2FudmFzLCBsYXllcnNDYW52YXMsIHNpZGUpIHtcbiAgICAgICAgY29uc3QgcXVhbGl0eU11bHRpcGxpZXIgPSAxMDtcbiAgICAgICAgY29uc3QgYmFzZVdpZHRoID0gZWRpdGFibGVDYW52YXMuZ2V0V2lkdGgoKTtcbiAgICAgICAgY29uc3QgYmFzZUhlaWdodCA9IGVkaXRhYmxlQ2FudmFzLmdldEhlaWdodCgpO1xuICAgICAgICBjb25zdCBkZXNpZ25DYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgY29uc3QgZGVzaWduQ3R4ID0gZGVzaWduQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIGRlc2lnbkNhbnZhcy53aWR0aCA9IGJhc2VXaWR0aCAqIHF1YWxpdHlNdWx0aXBsaWVyO1xuICAgICAgICBkZXNpZ25DYW52YXMuaGVpZ2h0ID0gYmFzZUhlaWdodCAqIHF1YWxpdHlNdWx0aXBsaWVyO1xuICAgICAgICBhd2FpdCB0aGlzLmFkZFN0YXRpY0xheWVyc1RvQ2FudmFzKGxheWVyc0NhbnZhcywgZGVzaWduQ3R4LCBkZXNpZ25DYW52YXMsIHNpZGUpO1xuICAgICAgICBhd2FpdCB0aGlzLmFkZEVkaXRhYmxlT2JqZWN0c1RvQ2FudmFzKGVkaXRhYmxlQ2FudmFzLCBkZXNpZ25DdHgsIGRlc2lnbkNhbnZhcywgYmFzZVdpZHRoLCBiYXNlSGVpZ2h0LCBzaWRlKTtcbiAgICAgICAgcmV0dXJuIGRlc2lnbkNhbnZhcztcbiAgICB9XG4gICAgYXN5bmMgYWRkU3RhdGljTGF5ZXJzVG9DYW52YXMobGF5ZXJzQ2FudmFzLCBjdHgsIGNhbnZhcywgc2lkZSkge1xuICAgICAgICBpZiAoIWxheWVyc0NhbnZhcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGxheWVyc0RhdGFVcmwgPSBsYXllcnNDYW52YXMudG9EYXRhVVJMKHtcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdwbmcnLFxuICAgICAgICAgICAgICAgIG11bHRpcGxpZXI6IDEwLFxuICAgICAgICAgICAgICAgIHF1YWxpdHk6IDEuMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBlbXB0eURhdGFVcmwgPSAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBRUFBQUFCQ0FZQUFBQWZGY1NKQUFBQURVbEVRVlI0Mm1Oa1lQaGZEd0FDaHdHQTYwZTZrZ0FBQUFCSlJVNUVya0pnZ2c9PSc7XG4gICAgICAgICAgICBpZiAobGF5ZXJzRGF0YVVybCAhPT0gZW1wdHlEYXRhVXJsICYmIGxheWVyc0RhdGFVcmwubGVuZ3RoID4gZW1wdHlEYXRhVXJsLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxheWVyc0ltZyA9IGF3YWl0IHRoaXMubG9hZEltYWdlKGxheWVyc0RhdGFVcmwpO1xuICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UobGF5ZXJzSW1nLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCU0L7QsdCw0LLQu9C10L3RiyDRgdGC0LDRgtC40YfQtdGB0LrQuNC1INGB0LvQvtC4INC00LvRjyAke3NpZGV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtleHBvcnRdINCe0YjQuNCx0LrQsCDRjdC60YHQv9C+0YDRgtCwINGB0YLQsNGC0LjRh9C10YHQutC40YUg0YHQu9C+0LXQsiDQtNC70Y8gJHtzaWRlfTpgLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgYWRkRWRpdGFibGVPYmplY3RzVG9DYW52YXMoZWRpdGFibGVDYW52YXMsIGN0eCwgY2FudmFzLCBiYXNlV2lkdGgsIGJhc2VIZWlnaHQsIHNpZGUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHRlbXBFZGl0YWJsZUNhbnZhcyA9IG5ldyBmYWJyaWMuU3RhdGljQ2FudmFzKG51bGwsIHtcbiAgICAgICAgICAgICAgICB3aWR0aDogYmFzZVdpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogYmFzZUhlaWdodCxcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd0cmFuc3BhcmVudCdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGVkaXRhYmxlQ2FudmFzLmNsaXBQYXRoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2xvbmVkQ2xpcCA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRhYmxlQ2FudmFzLmNsaXBQYXRoLmNsb25lKChjbG9uZWQpID0+IHJlc29sdmUoY2xvbmVkKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGVtcEVkaXRhYmxlQ2FudmFzLmNsaXBQYXRoID0gY2xvbmVkQ2xpcDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQn9GA0LjQvNC10L3RkdC9IGNsaXBQYXRoINC00LvRjyDRjdC60YHQv9C+0YDRgtCwINGB0YLQvtGA0L7QvdGLICR7c2lkZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRlc2lnbk9iamVjdHMgPSB0aGlzLmZpbHRlckRlc2lnbk9iamVjdHMoZWRpdGFibGVDYW52YXMuZ2V0T2JqZWN0cygpKTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qgb2JqIG9mIGRlc2lnbk9iamVjdHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjbG9uZWRPYmogPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBvYmouY2xvbmUoKGNsb25lZCkgPT4gcmVzb2x2ZShjbG9uZWQpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0ZW1wRWRpdGFibGVDYW52YXMuYWRkKGNsb25lZE9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkZXNpZ25EYXRhVXJsID0gdGVtcEVkaXRhYmxlQ2FudmFzLnRvRGF0YVVSTCh7XG4gICAgICAgICAgICAgICAgZm9ybWF0OiAncG5nJyxcbiAgICAgICAgICAgICAgICBtdWx0aXBsaWVyOiAxMCxcbiAgICAgICAgICAgICAgICBxdWFsaXR5OiAxLjBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgZW1wdHlEYXRhVXJsID0gJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQUVBQUFBQkNBWUFBQUFmRmNTSkFBQUFEVWxFUVZSNDJtTmtZUGhmRHdBQ2h3R0E2MGU2a2dBQUFBQkpSVTVFcmtKZ2dnPT0nO1xuICAgICAgICAgICAgaWYgKGRlc2lnbkRhdGFVcmwgIT09IGVtcHR5RGF0YVVybCAmJiBkZXNpZ25EYXRhVXJsLmxlbmd0aCA+IGVtcHR5RGF0YVVybC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkZXNpZ25JbWcgPSBhd2FpdCB0aGlzLmxvYWRJbWFnZShkZXNpZ25EYXRhVXJsKTtcbiAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKGRlc2lnbkltZywgMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQlNC+0LHQsNCy0LvQtdC90Ysg0L7QsdGK0LXQutGC0Ysg0LTQuNC30LDQudC90LAg0LHQtdC3INCz0YDQsNC90LjRhiDQtNC70Y8gJHtzaWRlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGVtcEVkaXRhYmxlQ2FudmFzLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2V4cG9ydF0g0J7RiNC40LHQutCwINGB0L7Qt9C00LDQvdC40Y8g0LTQuNC30LDQudC90LAg0LHQtdC3INCz0YDQsNC90LjRhiDQtNC70Y8gJHtzaWRlfTpgLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZmlsdGVyRGVzaWduT2JqZWN0cyhhbGxPYmplY3RzKSB7XG4gICAgICAgIGNvbnN0IHNlcnZpY2VPYmplY3ROYW1lcyA9IG5ldyBTZXQoW1xuICAgICAgICAgICAgXCJhcmVhOmJvcmRlclwiLFxuICAgICAgICAgICAgXCJhcmVhOmNsaXBcIixcbiAgICAgICAgICAgIFwiZ3VpZGVsaW5lXCIsXG4gICAgICAgICAgICBcImd1aWRlbGluZTp2ZXJ0aWNhbFwiLFxuICAgICAgICAgICAgXCJndWlkZWxpbmU6aG9yaXpvbnRhbFwiXG4gICAgICAgIF0pO1xuICAgICAgICByZXR1cm4gYWxsT2JqZWN0cy5maWx0ZXIoKG9iaikgPT4gIXNlcnZpY2VPYmplY3ROYW1lcy5oYXMob2JqLm5hbWUpKTtcbiAgICB9XG4gICAgYXN5bmMgZXhwb3J0RGVzaWduV2l0aENsaXBQYXRoKGVkaXRhYmxlQ2FudmFzLCBsYXllcnNDYW52YXMsIHNpZGUsIHJlc29sdXRpb24pIHtcbiAgICAgICAgY29uc3QgcXVhbGl0eU11bHRpcGxpZXIgPSAxMDtcbiAgICAgICAgY29uc3QgY2xpcFBhdGggPSBlZGl0YWJsZUNhbnZhcy5jbGlwUGF0aDtcbiAgICAgICAgaWYgKCFjbGlwUGF0aCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZXhwb3J0XSBjbGlwUGF0aCDQvdC1INC90LDQudC00LXQvSwg0Y3QutGB0L/QvtGA0YLQuNGA0YPQtdC8INCy0LXRgdGMIGNhbnZhcycpO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlRGVzaWduQ2FudmFzKGVkaXRhYmxlQ2FudmFzLCBsYXllcnNDYW52YXMsIHNpZGUpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNsaXBXaWR0aCA9IGNsaXBQYXRoLndpZHRoO1xuICAgICAgICBjb25zdCBjbGlwSGVpZ2h0ID0gY2xpcFBhdGguaGVpZ2h0O1xuICAgICAgICBjb25zdCBjbGlwTGVmdCA9IGNsaXBQYXRoLmxlZnQ7XG4gICAgICAgIGNvbnN0IGNsaXBUb3AgPSBjbGlwUGF0aC50b3A7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdIGNsaXBQYXRoOiAke2NsaXBXaWR0aH14JHtjbGlwSGVpZ2h0fSBhdCAoJHtjbGlwTGVmdH0sICR7Y2xpcFRvcH0pYCk7XG4gICAgICAgIGNvbnN0IGZ1bGxEZXNpZ25DYW52YXMgPSBhd2FpdCB0aGlzLmNyZWF0ZURlc2lnbkNhbnZhcyhlZGl0YWJsZUNhbnZhcywgbGF5ZXJzQ2FudmFzLCBzaWRlKTtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSByZXNvbHV0aW9uIC8gTWF0aC5tYXgoY2xpcFdpZHRoLCBjbGlwSGVpZ2h0KTtcbiAgICAgICAgY29uc3QgY3JvcHBlZENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBjcm9wcGVkQ2FudmFzLndpZHRoID0gY2xpcFdpZHRoICogc2NhbGU7XG4gICAgICAgIGNyb3BwZWRDYW52YXMuaGVpZ2h0ID0gY2xpcEhlaWdodCAqIHNjYWxlO1xuICAgICAgICBjb25zdCBjdHggPSBjcm9wcGVkQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIGNvbnN0IHNvdXJjZVNjYWxlID0gcXVhbGl0eU11bHRpcGxpZXI7XG4gICAgICAgIGN0eC5kcmF3SW1hZ2UoZnVsbERlc2lnbkNhbnZhcywgY2xpcExlZnQgKiBzb3VyY2VTY2FsZSwgY2xpcFRvcCAqIHNvdXJjZVNjYWxlLCBjbGlwV2lkdGggKiBzb3VyY2VTY2FsZSwgY2xpcEhlaWdodCAqIHNvdXJjZVNjYWxlLCAwLCAwLCBjcm9wcGVkQ2FudmFzLndpZHRoLCBjcm9wcGVkQ2FudmFzLmhlaWdodCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCU0LjQt9Cw0LnQvSDQvtCx0YDQtdC30LDQvSDQv9C+IGNsaXBQYXRoOiAke2Nyb3BwZWRDYW52YXMud2lkdGh9eCR7Y3JvcHBlZENhbnZhcy5oZWlnaHR9cHhgKTtcbiAgICAgICAgcmV0dXJuIGNyb3BwZWRDYW52YXM7XG4gICAgfVxuICAgIGFzeW5jIHVwbG9hZERlc2lnblRvU2VydmVyKGRlc2lnbnMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tleHBvcnRdINCX0LDQs9GA0YPQt9C60LAg0LTQuNC30LDQudC90LAg0L3QsCDRgdC10YDQstC10YAnKTtcbiAgICAgICAgICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtzaWRlLCBkYXRhVXJsXSBvZiBPYmplY3QuZW50cmllcyhkZXNpZ25zKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZGF0YVVybCk7XG4gICAgICAgICAgICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IHJlc3BvbnNlLmJsb2IoKTtcbiAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoc2lkZSwgYmxvYiwgYCR7c2lkZX0ucG5nYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tleHBvcnRdINCX0LDQs9GA0YPQt9C60LAg0L3QsCDRgdC10YDQstC10YAg0L3QtSDRgNC10LDQu9C40LfQvtCy0LDQvdCwJyk7XG4gICAgICAgICAgICByZXR1cm4gZGVzaWducztcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tleHBvcnRdINCe0YjQuNCx0LrQsCDQv9GA0Lgg0LfQsNCz0YDRg9C30LrQtSDQvdCwINGB0LXRgNCy0LXRgDonLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzYXZlTGF5ZXJzVG9IaXN0b3J5KCkge1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50SGlzdG9yeUluZGV4IDwgdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzSGlzdG9yeSA9IHRoaXMubGF5ZXJzSGlzdG9yeS5zbGljZSgwLCB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggKyAxKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsYXllcnNDb3B5ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0aGlzLmxheW91dHMpKTtcbiAgICAgICAgY29uc3QgaGlzdG9yeUl0ZW0gPSB7XG4gICAgICAgICAgICBsYXllcnM6IGxheWVyc0NvcHkubWFwKChkYXRhKSA9PiBuZXcgTGF5b3V0KGRhdGEpKSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmxheWVyc0hpc3RvcnkucHVzaChoaXN0b3J5SXRlbSk7XG4gICAgICAgIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA9IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxO1xuICAgICAgICBjb25zdCBNQVhfSElTVE9SWV9TSVpFID0gNTA7XG4gICAgICAgIGlmICh0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoID4gTUFYX0hJU1RPUllfU0laRSkge1xuICAgICAgICAgICAgdGhpcy5sYXllcnNIaXN0b3J5LnNoaWZ0KCk7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXgtLTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKGBbaGlzdG9yeV0g0KHQvtGF0YDQsNC90LXQvdC+INGB0L7RgdGC0L7Rj9C90LjQtSDRgdC70L7RkdCyLiDQmNC90LTQtdC60YE6ICR7dGhpcy5jdXJyZW50SGlzdG9yeUluZGV4fSwg0JLRgdC10LPQvjogJHt0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RofSwg0KHQu9C+0ZHQsjogJHt0aGlzLmxheW91dHMubGVuZ3RofWApO1xuICAgICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKTtcbiAgICB9XG4gICAgY2FuVW5kbygpIHtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA9PT0gdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoID49IDI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID4gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYW5SZWRvKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4IDwgdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDE7XG4gICAgfVxuICAgIHVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKSB7XG4gICAgICAgIGNvbnN0IGNhblVuZG8gPSB0aGlzLmNhblVuZG8oKTtcbiAgICAgICAgY29uc3QgY2FuUmVkbyA9IHRoaXMuY2FuUmVkbygpO1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JIaXN0b3J5VW5kb0Jsb2NrICYmIHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jay5maXJzdEVsZW1lbnRDaGlsZCkge1xuICAgICAgICAgICAgY29uc3QgdW5kb0J1dHRvbiA9IHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGlmIChjYW5VbmRvKSB7XG4gICAgICAgICAgICAgICAgdW5kb0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnJztcbiAgICAgICAgICAgICAgICB1bmRvQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHVuZG9CdXR0b24uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyNmMmYyZjInO1xuICAgICAgICAgICAgICAgIHVuZG9CdXR0b24uc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2sgJiYgdGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrLmZpcnN0RWxlbWVudENoaWxkKSB7XG4gICAgICAgICAgICBjb25zdCByZWRvQnV0dG9uID0gdGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgaWYgKGNhblJlZG8pIHtcbiAgICAgICAgICAgICAgICByZWRvQnV0dG9uLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcnO1xuICAgICAgICAgICAgICAgIHJlZG9CdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVkb0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnI2YyZjJmMic7XG4gICAgICAgICAgICAgICAgcmVkb0J1dHRvbi5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnldINCh0L7RgdGC0L7Rj9C90LjQtSDQutC90L7Qv9C+0Lo6IHVuZG8gPScsIGNhblVuZG8sICcsIHJlZG8gPScsIGNhblJlZG8pO1xuICAgIH1cbiAgICBhc3luYyB1bmRvKCkge1xuICAgICAgICBpZiAoIXRoaXMuY2FuVW5kbygpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbaGlzdG9yeV0gVW5kbyDQvdC10LLQvtC30LzQvtC20LXQvScpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPT09IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxICYmIHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggPj0gMikge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID0gdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPSBNYXRoLm1heCgwLCB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggLSAxKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBoaXN0b3J5SXRlbSA9IHRoaXMubGF5ZXJzSGlzdG9yeVt0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXhdO1xuICAgICAgICBpZiAoIWhpc3RvcnlJdGVtKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1toaXN0b3J5XSDQmNGB0YLQvtGA0LjRjyDQvdC1INC90LDQudC00LXQvdCwJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2hpc3RvcnldIFVuZG8g0Log0LjQvdC00LXQutGB0YMgJHt0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXh9INC40LcgJHt0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMX1gKTtcbiAgICAgICAgYXdhaXQgdGhpcy5yZXN0b3JlTGF5ZXJzRnJvbUhpc3RvcnkoaGlzdG9yeUl0ZW0pO1xuICAgICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGFzeW5jIHJlZG8oKSB7XG4gICAgICAgIGlmICghdGhpcy5jYW5SZWRvKCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5XSBSZWRvINC90LXQstC+0LfQvNC+0LbQtdC9Jyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4Kys7XG4gICAgICAgIGNvbnN0IGhpc3RvcnlJdGVtID0gdGhpcy5sYXllcnNIaXN0b3J5W3RoaXMuY3VycmVudEhpc3RvcnlJbmRleF07XG4gICAgICAgIGlmICghaGlzdG9yeUl0ZW0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2hpc3RvcnldINCY0YHRgtC+0YDQuNGPINC90LUg0L3QsNC50LTQtdC90LAnKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKGBbaGlzdG9yeV0gUmVkbyDQuiDQuNC90LTQtdC60YHRgyAke3RoaXMuY3VycmVudEhpc3RvcnlJbmRleH0g0LjQtyAke3RoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxfWApO1xuICAgICAgICBhd2FpdCB0aGlzLnJlc3RvcmVMYXllcnNGcm9tSGlzdG9yeShoaXN0b3J5SXRlbSk7XG4gICAgICAgIHRoaXMudXBkYXRlSGlzdG9yeUJ1dHRvbnNTdGF0ZSgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgYXN5bmMgcmVzdG9yZUxheWVyc0Zyb21IaXN0b3J5KGhpc3RvcnlJdGVtKSB7XG4gICAgICAgIHRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSA9IHRydWU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLmxheW91dHMgPSBbXTtcbiAgICAgICAgICAgIGhpc3RvcnlJdGVtLmxheWVycy5mb3JFYWNoKGxheW91dCA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXlvdXRzLnB1c2gobmV3IExheW91dChsYXlvdXQpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtoaXN0b3J5XSDQktC+0YHRgdGC0LDQvdC+0LLQu9C10L3QviAke3RoaXMubGF5b3V0cy5sZW5ndGh9INGB0LvQvtGR0LJgKTtcbiAgICAgICAgfVxuICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tlZGl0b3JdINCe0YfQuNGB0YLQutCwINGA0LXRgdGD0YDRgdC+0LIg0YDQtdC00LDQutGC0L7RgNCwJyk7XG4gICAgICAgIGlmICh0aGlzLmxvYWRpbmdJbnRlcnZhbCkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmxvYWRpbmdJbnRlcnZhbCk7XG4gICAgICAgICAgICB0aGlzLmxvYWRpbmdJbnRlcnZhbCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ldmVudHMuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLmNhbnZhc2VzLmZvckVhY2goY2FudmFzID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2FudmFzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbY2xlYW51cF0g0J7RiNC40LHQutCwINC+0YfQuNGB0YLQutC4IGNhbnZhczonLCBlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jYW52YXNlcyA9IFtdO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzLmZvckVhY2goY2FudmFzID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2FudmFzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbY2xlYW51cF0g0J7RiNC40LHQutCwINC+0YfQuNGB0YLQutC4IGxheWVyIGNhbnZhczonLCBlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5sYXllcnNDYW52YXNlcyA9IFtdO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZWRpdG9yXSDQoNC10YHRg9GA0YHRiyDRg9GB0L/QtdGI0L3QviDQvtGH0LjRidC10L3RiycpO1xuICAgIH1cbiAgICBnZXRDdXJyZW50U3RhdGUoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiB0aGlzLl9zZWxlY3RUeXBlLFxuICAgICAgICAgICAgY29sb3I6IHRoaXMuX3NlbGVjdENvbG9yLFxuICAgICAgICAgICAgc2lkZTogdGhpcy5fc2VsZWN0U2lkZSxcbiAgICAgICAgICAgIHNpemU6IHRoaXMuX3NlbGVjdFNpemUsXG4gICAgICAgICAgICBsYXlvdXRzOiB0aGlzLmxheW91dHMsXG4gICAgICAgICAgICBpc0xvYWRpbmc6IHRoaXMuaXNMb2FkaW5nLFxuICAgICAgICB9O1xuICAgIH1cbn1cbiIsImNvbnN0IHBvcHVwTG9nZ2VyID0gY29uc29sZS5kZWJ1Zy5iaW5kKGNvbnNvbGUsICdbUG9wdXBdJyk7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQb3B1cCB7XG4gICAgY29uc3RydWN0b3IoeyBwb3B1cElkLCBwb3B1cENvbnRlbnRDbGFzcywgY2xvc2VCdXR0b25DbGFzcywgdGltZW91dFNlY29uZHMgPSAxMCwgYXV0b1Nob3cgPSB0cnVlLCBjb29raWVOYW1lID0gJ3BvcHVwJywgY29va2llRXhwaXJlc0RheXMgPSAxLCB9KSB7XG4gICAgICAgIHRoaXMuY2xvc2VCdXR0b24gPSBudWxsO1xuICAgICAgICB0aGlzLmF1dG9TaG93ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYXV0b1Nob3dUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy50aW1lb3V0U2Vjb25kcyA9IDI1O1xuICAgICAgICB0aGlzLmNvb2tpZU5hbWUgPSBcInBvcHVwXCI7XG4gICAgICAgIHRoaXMuY29va2llRXhwaXJlc0RheXMgPSAxO1xuICAgICAgICBpZiAoIXBvcHVwSWQgfHwgIXBvcHVwQ29udGVudENsYXNzKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbUG9wdXBdIHBvcHVwSWQgb3IgcG9wdXBDb250ZW50Q2xhc3MgaXMgbm90IHByb3ZpZGVkJyk7XG4gICAgICAgIGNvbnN0IGZpbmRQb3B1cEJsb2NrID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocG9wdXBJZCk7XG4gICAgICAgIGlmICghZmluZFBvcHVwQmxvY2spIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUG9wdXAgYmxvY2sgd2l0aCBpZCAke3BvcHVwSWR9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbmRQb3B1cENvbnRlbnRCbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke3BvcHVwQ29udGVudENsYXNzfWApO1xuICAgICAgICBpZiAoIWZpbmRQb3B1cENvbnRlbnRCbG9jaykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQb3B1cCBjb250ZW50IGJsb2NrIHdpdGggY2xhc3MgJHtwb3B1cENvbnRlbnRDbGFzc30gbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wb3B1cEJsb2NrID0gZmluZFBvcHVwQmxvY2s7XG4gICAgICAgIHRoaXMucG9wdXBDb250ZW50QmxvY2sgPSBmaW5kUG9wdXBDb250ZW50QmxvY2s7XG4gICAgICAgIHRoaXMuaW5pdFBvcHVwQmxvY2soKTtcbiAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXJCbG9jayA9IHRoaXMuaW5pdFBvcHVwV3JhcHBlcigpO1xuICAgICAgICBjb25zdCBmaW5kQ2xvc2VCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuJHtjbG9zZUJ1dHRvbkNsYXNzfWApO1xuICAgICAgICBpZiAoIWZpbmRDbG9zZUJ1dHRvbikge1xuICAgICAgICAgICAgcG9wdXBMb2dnZXIoYGNsb3NlIGJ1dHRvbiB3aXRoIGNsYXNzICR7Y2xvc2VCdXR0b25DbGFzc30gbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbiA9IGZpbmRDbG9zZUJ1dHRvbjtcbiAgICAgICAgdGhpcy5pbml0Q2xvc2VCdXR0b24oKTtcbiAgICAgICAgaWYgKHRpbWVvdXRTZWNvbmRzKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVvdXRTZWNvbmRzID0gdGltZW91dFNlY29uZHM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGF1dG9TaG93KSB7XG4gICAgICAgICAgICB0aGlzLmF1dG9TaG93ID0gYXV0b1Nob3c7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvb2tpZU5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuY29va2llTmFtZSA9IGNvb2tpZU5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvb2tpZUV4cGlyZXNEYXlzKSB7XG4gICAgICAgICAgICB0aGlzLmNvb2tpZUV4cGlyZXNEYXlzID0gY29va2llRXhwaXJlc0RheXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucG9wdXBCbG9jayAmJiB0aGlzLmNsb3NlQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRBdXRvU2hvdygpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGluaXRQb3B1cFdyYXBwZXIoKSB7XG4gICAgICAgIGNvbnN0IHBvcHVwV3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5pZCA9ICdwb3B1cC13cmFwcGVyJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLnJpZ2h0ID0gJzAnO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUuYm90dG9tID0gJzAnO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS56SW5kZXggPSAnOTk5OSc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgICAgICByZXR1cm4gcG9wdXBXcmFwcGVyO1xuICAgIH1cbiAgICBpbml0UG9wdXBCbG9jaygpIHtcbiAgICAgICAgdGhpcy5wb3B1cEJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgfVxuICAgIGluaXRDbG9zZUJ1dHRvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNsb3NlQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmNsb3NlQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gdGhpcy5jbG9zZSgpO1xuICAgIH1cbiAgICBpbml0QXV0b1Nob3coKSB7XG4gICAgICAgIGlmICh0aGlzLmF1dG9TaG93ICYmICFkb2N1bWVudC5jb29raWUuaW5jbHVkZXMoYCR7dGhpcy5jb29raWVOYW1lfT10cnVlYCkpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0b1Nob3dUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLnNob3coKSwgdGhpcy50aW1lb3V0U2Vjb25kcyAqIDEwMDApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcG9wdXBMb2dnZXIoJ2lzIG5vdCBhdXRvIHNob3duJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2hvdygpIHtcbiAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXJCbG9jay5hcHBlbmRDaGlsZCh0aGlzLnBvcHVwQmxvY2spO1xuICAgICAgICB0aGlzLnBvcHVwQ29udGVudEJsb2NrLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICAgIHRoaXMucG9wdXBCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLnBvcHVwV3JhcHBlckJsb2NrKTtcbiAgICB9XG4gICAgY2xvc2UoKSB7XG4gICAgICAgIHRoaXMucG9wdXBXcmFwcGVyQmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgZG9jdW1lbnQuY29va2llID0gYCR7dGhpcy5jb29raWVOYW1lfT10cnVlOyBleHBpcmVzPSR7bmV3IERhdGUoRGF0ZS5ub3coKSArIHRoaXMuY29va2llRXhwaXJlc0RheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwKS50b1VUQ1N0cmluZygpfTsgcGF0aD0vO2A7XG4gICAgfVxufVxuIiwiZXhwb3J0IGNvbnN0IHByb2R1Y3RDb25maWdzID0gW1xuICAgIHtcbiAgICAgICAgdHlwZTogJ3RzaGlydCcsXG4gICAgICAgIHByb2R1Y3ROYW1lOiAn0KTRg9GC0LHQvtC70LrQsCcsXG4gICAgICAgIHNpemVzOiBbXCJTXCIsIFwiTVwiLCBcIkxcIiwgXCJYTFwiLCBcIjJYTFwiXSxcbiAgICAgICAgcHJpY2U6IDEyOTAsXG4gICAgICAgIGRvdWJsZVNpZGVkUHJpY2U6IDE1OTAsXG4gICAgICAgIHByaW50Q29uZmlnOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2lkZTogJ2Zyb250JyxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2l6ZToge1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogMjUwLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDM1MCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzaWRlOiAnYmFjaycsXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgICAgICAgICAgeTogMCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNpemU6IHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDI1MCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiA0MDAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgbW9ja3VwczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNpZGU6ICdmcm9udCcsXG4gICAgICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9yZXMuY2xvdWRpbmFyeS5jb20vZHF0M2duaW11L2ltYWdlL3VwbG9hZC92MTc1Mzk1ODE1MS93aGl0ZV9tb2NrdXAud2VicCcsXG4gICAgICAgICAgICAgICAgY29sb3I6IHsgbmFtZTogJ3doaXRlJywgaGV4OiAnI2ZmZmZmZicgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2lkZTogJ2JhY2snLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vcmVzLmNsb3VkaW5hcnkuY29tL2RxdDNnbmltdS9pbWFnZS91cGxvYWQvdjE3NTUzMzQyMjcvd2hpdGVfbW9ja3VwX2JhY2sud2VicCcsXG4gICAgICAgICAgICAgICAgY29sb3I6IHsgbmFtZTogJ3doaXRlJywgaGV4OiAnI2ZmZmZmZicgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2lkZTogJ2Zyb250JyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL3Jlcy5jbG91ZGluYXJ5LmNvbS9kcXQzZ25pbXUvaW1hZ2UvdXBsb2FkL3YxNzUzOTU5MTM3L2JsYWNrX21vY2t1cC53ZWJwJyxcbiAgICAgICAgICAgICAgICBjb2xvcjogeyBuYW1lOiAnYmxhY2snLCBoZXg6ICcjMDAwMDAwJyB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzaWRlOiAnYmFjaycsXG4gICAgICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9yZXMuY2xvdWRpbmFyeS5jb20vZHF0M2duaW11L2ltYWdlL3VwbG9hZC92MTc1NDg5Njk2NC9ibGFja19tb2NrdXBfYmFjay53ZWJwJyxcbiAgICAgICAgICAgICAgICBjb2xvcjogeyBuYW1lOiAnYmxhY2snLCBoZXg6ICcjMDAwMDAwJyB9LFxuICAgICAgICAgICAgfVxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICB0eXBlOiAnaG9vZGllJyxcbiAgICAgICAgcHJvZHVjdE5hbWU6ICfQotC+0LvRgdGC0L7QstC60LAnLFxuICAgICAgICBzaXplczogW1wiU1wiLCBcIk1cIiwgXCJMXCIsIFwiWExcIiwgXCIyWExcIl0sXG4gICAgICAgIHByaWNlOiAyNTkwLFxuICAgICAgICBkb3VibGVTaWRlZFByaWNlOiAyODkwLFxuICAgICAgICBwcmludENvbmZpZzogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNpZGU6ICdmcm9udCcsXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgICAgICAgICAgeTogLTksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzaXplOiB7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAyNTAsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogMTgwLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNpZGU6ICdiYWNrJyxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2l6ZToge1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogMjUwLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDMwMCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICBtb2NrdXBzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2lkZTogJ2Zyb250JyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL3Jlcy5jbG91ZGluYXJ5LmNvbS9kcXQzZ25pbXUvaW1hZ2UvdXBsb2FkL3YxNzU2OTc4MTM5L3doaXRlX2hvZGRpZV9tb2NrdXAud2VicCcsXG4gICAgICAgICAgICAgICAgY29sb3I6IHsgbmFtZTogJ3doaXRlJywgaGV4OiAnI2ZmZmZmZicgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2lkZTogJ2JhY2snLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vcmVzLmNsb3VkaW5hcnkuY29tL2RxdDNnbmltdS9pbWFnZS91cGxvYWQvdjE3NTY5NzgxMzkvd2hpdGVfaG9kZGllX21vY2t1cF9iYWNrLndlYnAnLFxuICAgICAgICAgICAgICAgIGNvbG9yOiB7IG5hbWU6ICd3aGl0ZScsIGhleDogJyNmZmZmZmYnIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNpZGU6ICdmcm9udCcsXG4gICAgICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9yZXMuY2xvdWRpbmFyeS5jb20vZHF0M2duaW11L2ltYWdlL3VwbG9hZC92MTc1Njk3ODEzOS9ibGFja19ob2RkaWVfbW9ja3VwLndlYnAnLFxuICAgICAgICAgICAgICAgIGNvbG9yOiB7IG5hbWU6ICdibGFjaycsIGhleDogJyMwMDAwMDAnIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNpZGU6ICdiYWNrJyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL3Jlcy5jbG91ZGluYXJ5LmNvbS9kcXQzZ25pbXUvaW1hZ2UvdXBsb2FkL3YxNzU2OTc4MTM5L2JsYWNrX2hvZGRpZV9tb2NrdXBfYmFjay53ZWJwJyxcbiAgICAgICAgICAgICAgICBjb2xvcjogeyBuYW1lOiAnYmxhY2snLCBoZXg6ICcjMDAwMDAwJyB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9XG5dO1xuZXhwb3J0IGNvbnN0IGVkaXRvckJsb2NrcyA9IHtcbiAgICBlZGl0b3JCbG9ja0NsYXNzOiAnLmVkaXRvci1ibG9jaycsXG4gICAgY2hhbmdlU2lkZUJ1dHRvbkNsYXNzOiAnLmNoYW5nZS1zaWRlLWJ1dHRvbicsXG4gICAgcHJvZHVjdExpc3RCbG9ja0NsYXNzOiAnLnByb2R1Y3QtbGlzdCcsXG4gICAgcHJvZHVjdEl0ZW1DbGFzczogJy5wcm9kdWN0LWl0ZW0nLFxuICAgIHByb2R1Y3RJdGVtSW1hZ2VDbGFzczogJy5wcm9kdWN0LWl0ZW0taW1hZ2UnLFxuICAgIHByb2R1Y3RJdGVtVGV4dENsYXNzOiAnLnByb2R1Y3QtaXRlbS10ZXh0JyxcbiAgICBlZGl0b3JTdW1CbG9ja0NsYXNzOiAnLmVkaXRvci1zdW0nLFxuICAgIGVkaXRvclNldHRpbmdzQmxvY2tDbGFzczogJy5lZGl0b3Itc2V0dGluZ3MnLFxuICAgIGVkaXRvckhpc3RvcnlVbmRvQmxvY2tDbGFzczogJy5lZGl0b3ItaGlzdG9yeS11bmRvJyxcbiAgICBlZGl0b3JIaXN0b3J5UmVkb0Jsb2NrQ2xhc3M6ICcuZWRpdG9yLWhpc3RvcnktcmVkbycsXG4gICAgZWRpdG9yQ2xpcEltYWdlQmxvY2tDbGFzczogJy5lZGl0b3Itc2V0dGluZ3NfX2NsaXAtaW1hZ2UnLFxuICAgIGVkaXRvckFkZE9yZGVyQnV0dG9uQ2xhc3M6ICcuZWRpdG9yLXNldHRpbmdzX19hZGQtb3JkZXItYnV0dG9uJyxcbiAgICBlZGl0b3JQcm9kdWN0TmFtZUNsYXNzOiAnLmVkaXRvci1zZXR0aW5nc19fcHJvZHVjdC1uYW1lJyxcbiAgICBlZGl0b3JDb2xvcnNMaXN0QmxvY2tDbGFzczogJy5lZGl0b3Itc2V0dGluZ3NfX2NvbG9ycy1saXN0JyxcbiAgICBlZGl0b3JDb2xvckl0ZW1CbG9ja0NsYXNzOiAnLmVkaXRvci1zZXR0aW5nc19fY29sb3ItaXRlbScsXG4gICAgZWRpdG9yU2l6ZXNMaXN0QmxvY2tDbGFzczogJy5lZGl0b3Itc2V0dGluZ3NfX3NpemVzLWxpc3QnLFxuICAgIGVkaXRvclNpemVJdGVtQmxvY2tDbGFzczogJy5lZGl0b3Itc2V0dGluZ3NfX3NpemUtaXRlbScsXG4gICAgZWRpdG9yTGF5b3V0c0xpc3RCbG9ja0NsYXNzOiAnLmVkaXRvci1sYXlvdXRzX19sYXlvdXRzLWxpc3QnLFxuICAgIGVkaXRvckxheW91dEl0ZW1CbG9ja0NsYXNzOiAnLmVkaXRvci1sYXlvdXRzX19sYXlvdXQtaXRlbScsXG4gICAgZWRpdG9yTGF5b3V0SXRlbUJsb2NrVmlld0NsYXNzOiAnLmVkaXRvci1sYXlvdXRzX19sYXlvdXQtaXRlbS12aWV3JyxcbiAgICBlZGl0b3JMYXlvdXRJdGVtQmxvY2tOYW1lQ2xhc3M6ICcuZWRpdG9yLWxheW91dHNfX2xheW91dC1pdGVtLW5hbWUnLFxuICAgIGVkaXRvckxheW91dEl0ZW1CbG9ja1JlbW92ZUNsYXNzOiAnLmVkaXRvci1sYXlvdXRzX19sYXlvdXQtaXRlbS1yZW1vdmUnLFxuICAgIGVkaXRvckxheW91dEl0ZW1CbG9ja0VkaXRDbGFzczogJy5lZGl0b3ItbGF5b3V0c19fbGF5b3V0LWl0ZW0tZWRpdCcsXG4gICAgZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b25DbGFzczogJy5lZGl0b3ItdXBsb2FkLWltYWdlLWJ1dHRvbicsXG4gICAgZWRpdG9yVXBsb2FkVmlld0Jsb2NrQ2xhc3M6ICcuZWRpdG9yLXVwbG9hZC12aWV3LWJsb2NrJyxcbiAgICBlZGl0b3JVcGxvYWRDYW5jZWxCdXR0b25DbGFzczogJy5lZGl0b3ItdXBsb2FkLWNhbmNlbC1idXR0b24nLFxuICAgIGVkaXRvclF1YW50aXR5Rm9ybUJsb2NrQ2xhc3M6ICcuZWRpdG9yLXF1YW50aXR5LWZvcm0nLFxuICAgIGVkaXRvckxvYWRXaXRoQWlCdXR0b25DbGFzczogJy5lZGl0b3ItbG9hZC13aXRoLWFpLWJ1dHRvbicsXG4gICAgZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbkNsYXNzOiAnLmVkaXRvci1sb2FkLXdpdGhvdXQtYWktYnV0dG9uJyxcbn07XG5leHBvcnQgY29uc3QgZm9ybUNvbmZpZyA9IHtcbiAgICBmb3JtQmxvY2tDbGFzczogJy5lZGl0b3ItZm9ybScsXG4gICAgZm9ybUJ1dHRvbkNsYXNzOiAnLmVkaXRvci1mb3JtX19idXR0b24nLFxuICAgIGZvcm1JbnB1dFZhcmlhYmxlTmFtZTogJ3Byb21wdCcsXG59O1xuIiwiZXhwb3J0IGNsYXNzIEVkaXRvclN0b3JhZ2VNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5kYXRhYmFzZSA9IG51bGw7XG4gICAgICAgIHRoaXMuaXNSZWFkeSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlYWR5UHJvbWlzZSA9IHRoaXMuaW5pdCgpO1xuICAgIH1cbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb3BlblJlcXVlc3QgPSBpbmRleGVkREIub3BlbihcImVkaXRvclwiLCAyKTtcbiAgICAgICAgICAgIG9wZW5SZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGFiYXNlID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICBpZiAoIWRhdGFiYXNlLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoJ2hpc3RvcnknKSkge1xuICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS5jcmVhdGVPYmplY3RTdG9yZSgnaGlzdG9yeScsIHsga2V5UGF0aDogJ2lkJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFkYXRhYmFzZS5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKCdlZGl0b3Jfc3RhdGUnKSkge1xuICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS5jcmVhdGVPYmplY3RTdG9yZSgnZWRpdG9yX3N0YXRlJywgeyBrZXlQYXRoOiAna2V5JyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFkYXRhYmFzZS5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKCd1c2VyX2RhdGEnKSkge1xuICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS5jcmVhdGVPYmplY3RTdG9yZSgndXNlcl9kYXRhJywgeyBrZXlQYXRoOiAna2V5JyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgb3BlblJlcXVlc3Qub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi0J7RiNC40LHQutCwINC+0YLQutGA0YvRgtC40Y8gSW5kZXhlZERCXCIsIG9wZW5SZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgICAgICByZWplY3Qob3BlblJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG9wZW5SZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFiYXNlID0gb3BlblJlcXVlc3QucmVzdWx0O1xuICAgICAgICAgICAgICAgIHRoaXMuaXNSZWFkeSA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIHdhaXRGb3JSZWFkeSgpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5yZWFkeVByb21pc2U7XG4gICAgfVxuICAgIGFzeW5jIHNhdmVFZGl0b3JTdGF0ZShzdGF0ZSkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnZWRpdG9yX3N0YXRlJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnZWRpdG9yX3N0YXRlJyk7XG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgIHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ2RhdGUnLCBzdGF0ZS5kYXRlKSxcbiAgICAgICAgICAgIHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ2NvbG9yJywgc3RhdGUuY29sb3IpLFxuICAgICAgICAgICAgdGhpcy5wdXREYXRhKG9iamVjdFN0b3JlLCAnc2lkZScsIHN0YXRlLnNpZGUpLFxuICAgICAgICAgICAgdGhpcy5wdXREYXRhKG9iamVjdFN0b3JlLCAndHlwZScsIHN0YXRlLnR5cGUpLFxuICAgICAgICAgICAgdGhpcy5wdXREYXRhKG9iamVjdFN0b3JlLCAnc2l6ZScsIHN0YXRlLnNpemUpXG4gICAgICAgIF0pO1xuICAgIH1cbiAgICBhc3luYyBsb2FkRWRpdG9yU3RhdGUoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydlZGl0b3Jfc3RhdGUnXSwgJ3JlYWRvbmx5Jyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2VkaXRvcl9zdGF0ZScpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgW2RhdGUsIGNvbG9yLCBzaWRlLCB0eXBlLCBzaXplXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICdkYXRlJyksXG4gICAgICAgICAgICAgICAgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAnY29sb3InKSxcbiAgICAgICAgICAgICAgICB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICdzaWRlJyksXG4gICAgICAgICAgICAgICAgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAndHlwZScpLFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ3NpemUnKVxuICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICBpZiAoIWRhdGUgfHwgIWNvbG9yIHx8ICFzaWRlIHx8ICF0eXBlIHx8ICFzaXplKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGRhdGUsXG4gICAgICAgICAgICAgICAgY29sb3IsXG4gICAgICAgICAgICAgICAgc2lkZSxcbiAgICAgICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgICAgIHNpemVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCDRgdC+0YHRgtC+0Y/QvdC40Y8g0YDQtdC00LDQutGC0L7RgNCwOicsIGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGNsZWFyRWRpdG9yU3RhdGUoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydlZGl0b3Jfc3RhdGUnXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdlZGl0b3Jfc3RhdGUnKTtcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgdGhpcy5kZWxldGVEYXRhKG9iamVjdFN0b3JlLCAnZGF0ZScpLFxuICAgICAgICAgICAgdGhpcy5kZWxldGVEYXRhKG9iamVjdFN0b3JlLCAnY29sb3InKSxcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlRGF0YShvYmplY3RTdG9yZSwgJ3NpZGUnKSxcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlRGF0YShvYmplY3RTdG9yZSwgJ3R5cGUnKSxcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlRGF0YShvYmplY3RTdG9yZSwgJ3NpemUnKVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgYXN5bmMgZ2V0VXNlcklkKCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsndXNlcl9kYXRhJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgndXNlcl9kYXRhJyk7XG4gICAgICAgIGxldCB1c2VySWQgPSBhd2FpdCB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICd1c2VySWQnKTtcbiAgICAgICAgaWYgKCF1c2VySWQpIHtcbiAgICAgICAgICAgIHVzZXJJZCA9IGNyeXB0by5yYW5kb21VVUlEKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICd1c2VySWQnLCB1c2VySWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1c2VySWQ7XG4gICAgfVxuICAgIGFzeW5jIHNhdmVUb0hpc3RvcnkoaXRlbSwgZGVzY3JpcHRpb24pIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IGhpc3RvcnlJdGVtID0ge1xuICAgICAgICAgICAgLi4uaXRlbSxcbiAgICAgICAgICAgIGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uIHx8IGDQmNC30LzQtdC90LXQvdC40Y8g0L7RgiAke25ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoKX1gXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5hZGQoaGlzdG9yeUl0ZW0pO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaGlzdG9yeUl0ZW0uaWQ7XG4gICAgfVxuICAgIGFzeW5jIHNhdmVMYXllck9wZXJhdGlvbihvcGVyYXRpb24sIGxheW91dCwgc2lkZSwgdHlwZSwgZGVzY3JpcHRpb24pIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IGxheWVySGlzdG9yeUl0ZW0gPSB7XG4gICAgICAgICAgICBpZDogY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIG9wZXJhdGlvbixcbiAgICAgICAgICAgIGxheW91dDogSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShsYXlvdXQpKSxcbiAgICAgICAgICAgIHNpZGUsXG4gICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uIHx8IGAke29wZXJhdGlvbiA9PT0gJ2FkZCcgPyAn0JTQvtCx0LDQstC70LXQvScgOiAn0KPQtNCw0LvQtdC9J30g0YHQu9C+0Lk6ICR7bGF5b3V0Lm5hbWUgfHwgbGF5b3V0LnR5cGV9YFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydoaXN0b3J5J10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuYWRkKHsgLi4ubGF5ZXJIaXN0b3J5SXRlbSwgaXNMYXllck9wZXJhdGlvbjogdHJ1ZSB9KTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGxheWVySGlzdG9yeUl0ZW0uaWQ7XG4gICAgfVxuICAgIGFzeW5jIGdldExheWVySGlzdG9yeShmaWx0ZXIsIGxpbWl0ID0gNTApIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWRvbmx5Jyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5nZXRBbGwoKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsbEl0ZW1zID0gcmVxdWVzdC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgY29uc3QgbGF5ZXJPcGVyYXRpb25zID0gYWxsSXRlbXNcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcigoaXRlbSkgPT4gaXRlbS5pc0xheWVyT3BlcmF0aW9uICYmIGl0ZW0uc2lkZSA9PT0gZmlsdGVyLnNpZGUgJiYgaXRlbS50eXBlID09PSBmaWx0ZXIudHlwZSlcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgoaXRlbSkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGl0ZW0uaWQsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogaXRlbS50aW1lc3RhbXAsXG4gICAgICAgICAgICAgICAgICAgIG9wZXJhdGlvbjogaXRlbS5vcGVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgIGxheW91dDogaXRlbS5sYXlvdXQsXG4gICAgICAgICAgICAgICAgICAgIHNpZGU6IGl0ZW0uc2lkZSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogaXRlbS50eXBlLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogaXRlbS5kZXNjcmlwdGlvblxuICAgICAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgICAgICAgICAuc29ydCgoYSwgYikgPT4gYi50aW1lc3RhbXAgLSBhLnRpbWVzdGFtcClcbiAgICAgICAgICAgICAgICAgICAgLnNsaWNlKDAsIGxpbWl0KTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGxheWVyT3BlcmF0aW9ucyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgZ2V0UmVjZW50TGF5ZXJPcGVyYXRpb25zKGZpbHRlciwgbGltaXQgPSAxMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRMYXllckhpc3RvcnkoZmlsdGVyLCBsaW1pdCk7XG4gICAgfVxuICAgIGFzeW5jIGdldEhpc3RvcnkoZmlsdGVyLCBsaW1pdCA9IDUwKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydoaXN0b3J5J10sICdyZWFkb25seScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuZ2V0QWxsKCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhbGxJdGVtcyA9IHJlcXVlc3QucmVzdWx0O1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlcmVkSXRlbXMgPSBhbGxJdGVtc1xuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKGl0ZW0gPT4gaXRlbS5zaWRlID09PSBmaWx0ZXIuc2lkZSAmJiBpdGVtLnR5cGUgPT09IGZpbHRlci50eXBlKVxuICAgICAgICAgICAgICAgICAgICAuc29ydCgoYSwgYikgPT4gYi50aW1lc3RhbXAgLSBhLnRpbWVzdGFtcClcbiAgICAgICAgICAgICAgICAgICAgLnNsaWNlKDAsIGxpbWl0KTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGZpbHRlcmVkSXRlbXMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIGdldEhpc3RvcnlJdGVtKGlkKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydoaXN0b3J5J10sICdyZWFkb25seScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuZ2V0KGlkKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZShyZXF1ZXN0LnJlc3VsdCB8fCBudWxsKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIGRlbGV0ZUhpc3RvcnlJdGVtKGlkKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydoaXN0b3J5J10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuZGVsZXRlKGlkKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgY2xlYXJIaXN0b3J5KGZpbHRlcikge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgaWYgKCFmaWx0ZXIpIHtcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGFsbEl0ZW1zID0gYXdhaXQgdGhpcy5nZXRIaXN0b3J5KGZpbHRlciwgMTAwMCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgYWxsSXRlbXMpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmRlbGV0ZUhpc3RvcnlJdGVtKGl0ZW0uaWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIHNhdmVMYXllcnMobGF5ZXJzKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydlZGl0b3Jfc3RhdGUnXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdlZGl0b3Jfc3RhdGUnKTtcbiAgICAgICAgYXdhaXQgdGhpcy5wdXREYXRhKG9iamVjdFN0b3JlLCAnbGF5ZXJzJywgbGF5ZXJzKTtcbiAgICB9XG4gICAgYXN5bmMgbG9hZExheWVycygpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydlZGl0b3Jfc3RhdGUnXSwgJ3JlYWRvbmx5Jyk7XG4gICAgICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdlZGl0b3Jfc3RhdGUnKTtcbiAgICAgICAgICAgIGNvbnN0IGxheWVycyA9IGF3YWl0IHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ2xheWVycycpO1xuICAgICAgICAgICAgcmV0dXJuIGxheWVycyB8fCBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcign0J7RiNC40LHQutCwINC30LDQs9GA0YPQt9C60Lgg0YHQu9C+0ZHQsjonLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwdXREYXRhKG9iamVjdFN0b3JlLCBrZXksIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUucHV0KHsga2V5LCB2YWx1ZSB9KTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0RGF0YShvYmplY3RTdG9yZSwga2V5KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuZ2V0KGtleSk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUocmVxdWVzdC5yZXN1bHQ/LnZhbHVlIHx8IG51bGwpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZGVsZXRlRGF0YShvYmplY3RTdG9yZSwga2V5KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIiwiY29uc3QgREVGQVVMVF9WQUxVRVMgPSB7XG4gICAgUE9TSVRJT046IHsgeDogMCwgeTogMCB9LFxuICAgIFNJWkU6IDEsXG4gICAgQVNQRUNUX1JBVElPOiAxLFxuICAgIEFOR0xFOiAwLFxuICAgIFRFWFQ6ICdQcmludExvb3AnLFxuICAgIEZPTlQ6IHsgZmFtaWx5OiAnQXJpYWwnLCBzaXplOiAxMiB9LFxufTtcbmV4cG9ydCBjbGFzcyBMYXlvdXQge1xuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHRoaXMuaWQgPSBwcm9wcy5pZCB8fCBMYXlvdXQuZ2VuZXJhdGVJZCgpO1xuICAgICAgICB0aGlzLnR5cGUgPSBwcm9wcy50eXBlO1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gcHJvcHMucG9zaXRpb24gfHwgeyAuLi5ERUZBVUxUX1ZBTFVFUy5QT1NJVElPTiB9O1xuICAgICAgICB0aGlzLnNpemUgPSB0aGlzLnZhbGlkYXRlU2l6ZShwcm9wcy5zaXplID8/IERFRkFVTFRfVkFMVUVTLlNJWkUpO1xuICAgICAgICB0aGlzLmFzcGVjdFJhdGlvID0gdGhpcy52YWxpZGF0ZUFzcGVjdFJhdGlvKHByb3BzLmFzcGVjdFJhdGlvID8/IERFRkFVTFRfVkFMVUVTLkFTUEVDVF9SQVRJTyk7XG4gICAgICAgIHRoaXMudmlldyA9IHByb3BzLnZpZXc7XG4gICAgICAgIHRoaXMuYW5nbGUgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKHByb3BzLmFuZ2xlID8/IERFRkFVTFRfVkFMVUVTLkFOR0xFKTtcbiAgICAgICAgdGhpcy5uYW1lID0gcHJvcHMubmFtZSA/PyBudWxsO1xuICAgICAgICBpZiAocHJvcHMudHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgICAgICAgdGhpcy51cmwgPSBwcm9wcy51cmw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocHJvcHMudHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICAgICAgICB0aGlzLnRleHQgPSBwcm9wcy50ZXh0IHx8IERFRkFVTFRfVkFMVUVTLlRFWFQ7XG4gICAgICAgICAgICB0aGlzLmZvbnQgPSBwcm9wcy5mb250ID8geyAuLi5wcm9wcy5mb250IH0gOiB7IC4uLkRFRkFVTFRfVkFMVUVTLkZPTlQgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgZ2VuZXJhdGVJZCgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjcnlwdG8gIT09ICd1bmRlZmluZWQnICYmIGNyeXB0by5yYW5kb21VVUlEKSB7XG4gICAgICAgICAgICByZXR1cm4gY3J5cHRvLnJhbmRvbVVVSUQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYCR7RGF0ZS5ub3coKX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMiwgMTEpfWA7XG4gICAgfVxuICAgIHZhbGlkYXRlU2l6ZShzaXplKSB7XG4gICAgICAgIGlmIChzaXplIDw9IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgSW52YWxpZCBzaXplICR7c2l6ZX0sIHVzaW5nIGRlZmF1bHQgJHtERUZBVUxUX1ZBTFVFUy5TSVpFfWApO1xuICAgICAgICAgICAgcmV0dXJuIERFRkFVTFRfVkFMVUVTLlNJWkU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNpemU7XG4gICAgfVxuICAgIHZhbGlkYXRlQXNwZWN0UmF0aW8ocmF0aW8pIHtcbiAgICAgICAgaWYgKHJhdGlvIDw9IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgSW52YWxpZCBhc3BlY3QgcmF0aW8gJHtyYXRpb30sIHVzaW5nIGRlZmF1bHQgJHtERUZBVUxUX1ZBTFVFUy5BU1BFQ1RfUkFUSU99YCk7XG4gICAgICAgICAgICByZXR1cm4gREVGQVVMVF9WQUxVRVMuQVNQRUNUX1JBVElPO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByYXRpbztcbiAgICB9XG4gICAgbm9ybWFsaXplQW5nbGUoYW5nbGUpIHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IGFuZ2xlICUgMzYwO1xuICAgICAgICByZXR1cm4gbm9ybWFsaXplZCA8IDAgPyBub3JtYWxpemVkICsgMzYwIDogbm9ybWFsaXplZDtcbiAgICB9XG4gICAgaXNJbWFnZUxheW91dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZSA9PT0gJ2ltYWdlJyAmJiB0aGlzLnVybCAhPT0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpc1RleHRMYXlvdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGUgPT09ICd0ZXh0JyAmJiB0aGlzLnRleHQgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZvbnQgIT09IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgc2V0UG9zaXRpb24oeCwgeSkge1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0geyB4LCB5IH07XG4gICAgfVxuICAgIG1vdmUoZHgsIGR5KSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24ueCArPSBkeDtcbiAgICAgICAgdGhpcy5wb3NpdGlvbi55ICs9IGR5O1xuICAgIH1cbiAgICBzZXRTaXplKHNpemUpIHtcbiAgICAgICAgdGhpcy5zaXplID0gdGhpcy52YWxpZGF0ZVNpemUoc2l6ZSk7XG4gICAgfVxuICAgIHJvdGF0ZShhbmdsZSkge1xuICAgICAgICB0aGlzLmFuZ2xlID0gdGhpcy5ub3JtYWxpemVBbmdsZSh0aGlzLmFuZ2xlICsgYW5nbGUpO1xuICAgIH1cbiAgICBzZXRBbmdsZShhbmdsZSkge1xuICAgICAgICB0aGlzLmFuZ2xlID0gdGhpcy5ub3JtYWxpemVBbmdsZShhbmdsZSk7XG4gICAgfVxuICAgIHNldFRleHQodGV4dCkge1xuICAgICAgICBpZiAodGhpcy5pc1RleHRMYXlvdXQoKSkge1xuICAgICAgICAgICAgdGhpcy50ZXh0ID0gdGV4dDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXRGb250KGZvbnQpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNUZXh0TGF5b3V0KCkgJiYgdGhpcy5mb250KSB7XG4gICAgICAgICAgICB0aGlzLmZvbnQgPSB7IC4uLnRoaXMuZm9udCwgLi4uZm9udCB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIGNsb25lKCkge1xuICAgICAgICBpZiAodGhpcy50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9wcyA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UnLFxuICAgICAgICAgICAgICAgIHVybDogdGhpcy51cmwsXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHsgLi4udGhpcy5wb3NpdGlvbiB9LFxuICAgICAgICAgICAgICAgIHNpemU6IHRoaXMuc2l6ZSxcbiAgICAgICAgICAgICAgICBhc3BlY3RSYXRpbzogdGhpcy5hc3BlY3RSYXRpbyxcbiAgICAgICAgICAgICAgICB2aWV3OiB0aGlzLnZpZXcsXG4gICAgICAgICAgICAgICAgYW5nbGU6IHRoaXMuYW5nbGUsXG4gICAgICAgICAgICAgICAgbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgTGF5b3V0KHByb3BzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyAuLi50aGlzLnBvc2l0aW9uIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogdGhpcy5zaXplLFxuICAgICAgICAgICAgICAgIGFzcGVjdFJhdGlvOiB0aGlzLmFzcGVjdFJhdGlvLFxuICAgICAgICAgICAgICAgIHZpZXc6IHRoaXMudmlldyxcbiAgICAgICAgICAgICAgICBhbmdsZTogdGhpcy5hbmdsZSxcbiAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHRoaXMudGV4dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcHJvcHMudGV4dCA9IHRoaXMudGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmZvbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHByb3BzLmZvbnQgPSB7IC4uLnRoaXMuZm9udCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBMYXlvdXQocHJvcHMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRvSlNPTigpIHtcbiAgICAgICAgY29uc3QgYmFzZSA9IHtcbiAgICAgICAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMucG9zaXRpb24sXG4gICAgICAgICAgICBzaXplOiB0aGlzLnNpemUsXG4gICAgICAgICAgICBhc3BlY3RSYXRpbzogdGhpcy5hc3BlY3RSYXRpbyxcbiAgICAgICAgICAgIHZpZXc6IHRoaXMudmlldyxcbiAgICAgICAgICAgIGFuZ2xlOiB0aGlzLmFuZ2xlLFxuICAgICAgICAgICAgbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICByZXR1cm4geyAuLi5iYXNlLCB1cmw6IHRoaXMudXJsIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgIHJldHVybiB7IC4uLmJhc2UsIHRleHQ6IHRoaXMudGV4dCwgZm9udDogdGhpcy5mb250IH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhc2U7XG4gICAgfVxuICAgIHN0YXRpYyBmcm9tSlNPTihqc29uKSB7XG4gICAgICAgIHJldHVybiBuZXcgTGF5b3V0KGpzb24pO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlSW1hZ2UocHJvcHMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMYXlvdXQoeyAuLi5wcm9wcywgdHlwZTogJ2ltYWdlJyB9KTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZVRleHQocHJvcHMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMYXlvdXQoeyAuLi5wcm9wcywgdHlwZTogJ3RleHQnIH0pO1xuICAgIH1cbn1cbiIsImV4cG9ydCBjbGFzcyBUeXBlZEV2ZW50RW1pdHRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBvbihldmVudCwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmxpc3RlbmVycy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5zZXQoZXZlbnQsIG5ldyBTZXQoKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMuZ2V0KGV2ZW50KS5hZGQobGlzdGVuZXIpO1xuICAgIH1cbiAgICBvbmNlKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgICBjb25zdCBvbmNlV3JhcHBlciA9IChkZXRhaWwpID0+IHtcbiAgICAgICAgICAgIGxpc3RlbmVyKGRldGFpbCk7XG4gICAgICAgICAgICB0aGlzLm9mZihldmVudCwgb25jZVdyYXBwZXIpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm9uKGV2ZW50LCBvbmNlV3JhcHBlcik7XG4gICAgfVxuICAgIG9mZihldmVudCwgbGlzdGVuZXIpIHtcbiAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycy5nZXQoZXZlbnQpO1xuICAgICAgICBpZiAoZXZlbnRMaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIGV2ZW50TGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gICAgICAgICAgICBpZiAoZXZlbnRMaXN0ZW5lcnMuc2l6ZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZW1pdChldmVudCwgZGV0YWlsKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50TGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnMuZ2V0KGV2ZW50KTtcbiAgICAgICAgaWYgKGV2ZW50TGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBldmVudExpc3RlbmVycy5mb3JFYWNoKGxpc3RlbmVyID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcihkZXRhaWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW0V2ZW50RW1pdHRlcl0g0J7RiNC40LHQutCwINCyINC+0LHRgNCw0LHQvtGC0YfQuNC60LUg0YHQvtCx0YvRgtC40Y8gXCIke1N0cmluZyhldmVudCl9XCI6YCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShldmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5jbGVhcigpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGxpc3RlbmVyQ291bnQoZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXJzLmdldChldmVudCk/LnNpemUgfHwgMDtcbiAgICB9XG4gICAgaGFzTGlzdGVuZXJzKGV2ZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVyQ291bnQoZXZlbnQpID4gMDtcbiAgICB9XG4gICAgZXZlbnROYW1lcygpIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5saXN0ZW5lcnMua2V5cygpKTtcbiAgICB9XG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMuY2xlYXIoKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBFZGl0b3JTdG9yYWdlTWFuYWdlciB9IGZyb20gJy4uL21hbmFnZXJzL0VkaXRvclN0b3JhZ2VNYW5hZ2VyJztcbmltcG9ydCB7IHByb2R1Y3RDb25maWdzIH0gZnJvbSAnLi4vY29uZmlnL3Byb2R1Y3RzJztcbmNvbnN0IEFQSV9FTkRQT0lOVFMgPSB7XG4gICAgV0VCSE9PS19SRVFVRVNUOiAnaHR0cHM6Ly9wcmltYXJ5LXByb2R1Y3Rpb24tNjU0Yy51cC5yYWlsd2F5LmFwcC93ZWJob29rL3JlcXVlc3QnLFxufTtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUltYWdlKHsgcHJvbXB0LCBzaGlydENvbG9yLCBpbWFnZSwgd2l0aEFpLCBsYXlvdXRJZCwgaXNOZXcgPSB0cnVlLCB9KSB7XG4gICAgY29uc3QgdGVtcFN0b3JhZ2VNYW5hZ2VyID0gbmV3IEVkaXRvclN0b3JhZ2VNYW5hZ2VyKCk7XG4gICAgY29uc3QgdXNlcklkID0gYXdhaXQgdGVtcFN0b3JhZ2VNYW5hZ2VyLmdldFVzZXJJZCgpO1xuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgZm9ybURhdGEuc2V0KCd1c2VySWQnLCB1c2VySWQpO1xuICAgIGZvcm1EYXRhLnNldCgncHJvbXB0JywgcHJvbXB0KTtcbiAgICBmb3JtRGF0YS5zZXQoJ3NoaXJ0Q29sb3InLCBzaGlydENvbG9yKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3BsYWNlbWVudCcsICdjZW50ZXInKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3ByaW50U2l6ZScsIFwiYmlnXCIpO1xuICAgIGZvcm1EYXRhLnNldCgndHJhbnNmZXJUeXBlJywgJycpO1xuICAgIGZvcm1EYXRhLnNldCgncmVxdWVzdF90eXBlJywgJ2dlbmVyYXRlJyk7XG4gICAgaWYgKGxheW91dElkKVxuICAgICAgICBmb3JtRGF0YS5zZXQoJ2xheW91dElkJywgbGF5b3V0SWQpO1xuICAgIGlmIChpbWFnZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZ2VuZXJhdGUgaW1hZ2VdJywgaW1hZ2UpO1xuICAgICAgICBjb25zdCBbaGVhZGVyLCBkYXRhXSA9IGltYWdlLnNwbGl0KCcsJyk7XG4gICAgICAgIGNvbnN0IHR5cGUgPSBoZWFkZXIuc3BsaXQoJzonKVsxXS5zcGxpdCgnOycpWzBdO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZ2VuZXJhdGUgaW1hZ2VdIFt0eXBlXScsIHR5cGUpO1xuICAgICAgICBjb25zdCBieXRlQ2hhcmFjdGVycyA9IGF0b2IoZGF0YSk7XG4gICAgICAgIGNvbnN0IGJ5dGVOdW1iZXJzID0gbmV3IEFycmF5KGJ5dGVDaGFyYWN0ZXJzLmxlbmd0aCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnl0ZUNoYXJhY3RlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGJ5dGVOdW1iZXJzW2ldID0gYnl0ZUNoYXJhY3RlcnMuY2hhckNvZGVBdChpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBieXRlQXJyYXkgPSBuZXcgVWludDhBcnJheShieXRlTnVtYmVycyk7XG4gICAgICAgIGZvcm1EYXRhLnNldCgncmVxdWVzdF90eXBlJywgJ2ltYWdlJyk7XG4gICAgICAgIGZvcm1EYXRhLnNldCgndXNlcl9pbWFnZScsIG5ldyBCbG9iKFtieXRlQXJyYXldLCB7IHR5cGU6IFwiaW1hZ2UvcG5nXCIgfSkpO1xuICAgICAgICBmb3JtRGF0YS5zZXQoJ3RyYW5zZmVyVHlwZScsIHdpdGhBaSA/IFwiYWlcIiA6IFwibm8tYWlcIik7XG4gICAgfVxuICAgIGlmICghaXNOZXcpIHtcbiAgICAgICAgZm9ybURhdGEuc2V0KCdyZXF1ZXN0X3R5cGUnLCAnZWRpdCcpO1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKEFQSV9FTkRQT0lOVFMuV0VCSE9PS19SRVFVRVNULCB7XG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGJvZHk6IGZvcm1EYXRhLFxuICAgIH0pO1xuICAgIGNvbnN0IHJlc3BvbnNlRGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICByZXR1cm4gcmVzcG9uc2VEYXRhLmltYWdlX3VybCB8fCByZXNwb25zZURhdGEuaW1hZ2U7XG59XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHJvZHVjdCh7IHF1YW50aXR5LCBuYW1lLCBzaXplLCBjb2xvciwgc2lkZXMsIHByb2R1Y3RUeXBlIH0pIHtcbiAgICBjb25zdCBwcm9kdWN0SWQgPSAoTWF0aC5yYW5kb20oKSArIDEpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoNykgKyBcIl9cIiArIERhdGUubm93KCk7XG4gICAgY29uc3QgcHJvZHVjdENvbmZpZyA9IHByb2R1Y3RDb25maWdzLmZpbmQocCA9PiBwLnR5cGUgPT09IHByb2R1Y3RUeXBlKTtcbiAgICBjb25zdCBwcmljZSA9IHNpZGVzLmxlbmd0aCA9PSAxXG4gICAgICAgID8gKHByb2R1Y3RDb25maWc/LnByaWNlIHx8IDE5OTApXG4gICAgICAgIDogKHByb2R1Y3RDb25maWc/LmRvdWJsZVNpZGVkUHJpY2UgfHwgMjQ5MCk7XG4gICAgY29uc3QgcmVzdWx0UHJvZHVjdCA9IHtcbiAgICAgICAgaWQ6IHByb2R1Y3RJZCxcbiAgICAgICAgbmFtZSxcbiAgICAgICAgcHJpY2UsXG4gICAgICAgIHF1YW50aXR5OiBxdWFudGl0eSxcbiAgICAgICAgaW1nOiBzaWRlc1swXT8uaW1hZ2VfdXJsLFxuICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICB7IG9wdGlvbjogJ9CU0LjQt9Cw0LnQvScsIHZhcmlhbnQ6IGA8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiJHtzaWRlc1swXT8uaW1hZ2VfdXJsfVwiIHRhcmdldD1cIl9ibGFua1wiPiR7c2lkZXNbMF0/LmltYWdlX3VybC5zbGljZSgtMTApfTwvYT5gIH0sXG4gICAgICAgICAgICAoc2lkZXMubGVuZ3RoID4gMSkgJiYgeyBvcHRpb246ICfQlNC40LfQsNC50L0nLCB2YXJpYW50OiBgPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiR7c2lkZXNbMV0/LmltYWdlX3VybH1cIiB0YXJnZXQ9XCJfYmxhbmtcIj4ke3NpZGVzWzFdPy5pbWFnZV91cmwuc2xpY2UoLTEwKX08L2E+YCB9LFxuICAgICAgICAgICAgeyBvcHRpb246ICfQoNCw0LfQvNC10YAnLCB2YXJpYW50OiBzaXplIH0sXG4gICAgICAgICAgICB7IG9wdGlvbjogJ9Cm0LLQtdGCJywgdmFyaWFudDogY29sb3IubmFtZSB9LFxuICAgICAgICAgICAgeyBvcHRpb246ICfQn9GA0LjQvdGCJywgdmFyaWFudDogc2lkZXMubGVuZ3RoID09IDEgPyAn0J7QtNC90L7RgdGC0L7RgNC+0L3QvdC40LknIDogJ9CU0LLRg9GF0YHRgtC+0YDQvtC90L3QuNC5JyB9LFxuICAgICAgICBdXG4gICAgfTtcbiAgICBjb25zb2xlLmRlYnVnKCdbY2FydF0gYWRkIHByb2R1Y3QnLCByZXN1bHRQcm9kdWN0KTtcbiAgICBpZiAodHlwZW9mIHdpbmRvdy50Y2FydF9fYWRkUHJvZHVjdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgd2luZG93LnRjYXJ0X19hZGRQcm9kdWN0KHJlc3VsdFByb2R1Y3QpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NhcnRdINCe0YjQuNCx0LrQsCDQv9GA0Lgg0LTQvtCx0LDQstC70LXQvdC40Lgg0L/RgNC+0LTRg9C60YLQsCDQsiDQutC+0YDQt9C40L3RgycsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbY2FydF0g0JrQvtGA0LfQuNC90LAgVGlsZGEg0L3QtSDQt9Cw0LPRgNGD0LbQtdC90LAuJyk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RDaGlsZChlbGVtZW50KSB7XG4gICAgaWYgKCFlbGVtZW50KVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICBpZiAoIWVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQpXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIHJldHVybiBnZXRMYXN0Q2hpbGQoZWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZCk7XG59XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCBQb3B1cCBmcm9tICcuL2NvbXBvbmVudHMvUG9wdXAnO1xuaW1wb3J0IEVkaXRvciBmcm9tICcuL2NvbXBvbmVudHMvRWRpdG9yJztcbmltcG9ydCB7IENhcmRGb3JtIH0gZnJvbSAnLi9jb21wb25lbnRzL0NhcmRGb3JtJztcbndpbmRvdy5wb3B1cCA9IFBvcHVwO1xud2luZG93LmVkaXRvciA9IEVkaXRvcjtcbndpbmRvdy5jYXJkRm9ybSA9IENhcmRGb3JtO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9