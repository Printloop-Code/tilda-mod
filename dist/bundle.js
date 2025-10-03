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
    UPLOAD_IMAGE: 'https://preview-service-production-fd20.up.railway.app/upload',
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
                    article
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
function createProduct({ quantity, name, size, color, sides, productType, article }) {
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
            { option: 'Артикул', variant: article },
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZDQUE2QyxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSx1QkFBdUI7QUFDNUc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QixpQkFBaUIsR0FBRyxpQkFBaUIsR0FBRyx1QkFBdUI7QUFDM0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUVBQWlFLFNBQVM7QUFDMUU7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscURBQXFELGlCQUFpQixVQUFVLGtCQUFrQixTQUFTLGlCQUFpQixTQUFTLGlCQUFpQjtBQUN0SjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0IsK0RBQVk7QUFDM0M7QUFDQSwwREFBMEQsTUFBTTtBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdDQUF3QywrREFBWTtBQUNwRCwyQ0FBMkMsK0RBQVk7QUFDdkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdDQUF3QywrREFBWTtBQUNwRCwyQ0FBMkMsK0RBQVk7QUFDdkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsK0RBQVk7QUFDcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQ0FBZ0MsK0RBQVk7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQix1Q0FBdUM7QUFDbEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLHVDQUF1QztBQUNsRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0NBQWtDLEtBQUs7QUFDdkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNEQUFzRCxLQUFLO0FBQzNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRCxhQUFhO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscURBQXFELFdBQVc7QUFDaEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLFlBQVk7QUFDMUQ7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7Ozs7Ozs7Ozs7Ozs7OztBQzdSQTtBQUNBLGdCQUFnQixZQUFZO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWSwyQkFBMkI7QUFDdkM7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBLDRDQUE0QztBQUM1QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QyxnQkFBZ0IsSUFBSTtBQUMzRDtBQUNBO0FBQ0E7QUFDQTtB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RUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0EsRTs7Ozs7V0NQQSx3Rjs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0QsRTs7Ozs7Ozs7Ozs7Ozs7QUNOdUM7QUFDRTtBQUNRO0FBQ2pELGVBQWUseURBQUs7QUFDcEIsZ0JBQWdCLDBEQUFNO0FBQ3RCLGtCQUFrQiwwREFBUSIsInNvdXJjZXMiOlsid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvY29tcG9uZW50cy9DYXJkRm9ybS50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL2NvbXBvbmVudHMvRWRpdG9yLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvY29tcG9uZW50cy9Qb3B1cC50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL2NvbmZpZy9wcm9kdWN0cy50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL21hbmFnZXJzL0VkaXRvclN0b3JhZ2VNYW5hZ2VyLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvbW9kZWxzL0xheW91dC50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL3V0aWxzL1R5cGVkRXZlbnRFbWl0dGVyLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvdXRpbHMvYXBpLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvdXRpbHMvdGlsZGFVdGlscy50cyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBET01fU0VMRUNUT1JTID0ge1xuICAgIENBUlRfQ09OVEFJTkVSOiAnLnQ3MDZfX2NhcnR3aW4tcHJvZHVjdHMsIC50LXN0b3JlX19jYXJ0LXByb2R1Y3RzLCAudC1zdG9yZScsXG4gICAgQ0FSVF9QUk9EVUNUOiAnLnQ3MDZfX2NhcnR3aW4tcHJvZHVjdCwgLnQtc3RvcmVfX2NhcmQsIC50NzA2X19wcm9kdWN0JyxcbiAgICBQUk9EVUNUX1RJVExFOiAnLnQ3MDZfX3Byb2R1Y3QtdGl0bGUsIC50LXN0b3JlX19jYXJkX190aXRsZSwgLnQ3MDZfX3Byb2R1Y3QtbmFtZScsXG4gICAgUFJPRFVDVF9ERUxfQlVUVE9OOiAnLnQ3MDZfX3Byb2R1Y3QtZGVsJyxcbiAgICBQUk9EVUNUX1BMVVNfQlVUVE9OOiAnLnQ3MDZfX3Byb2R1Y3QtcGx1cycsXG4gICAgUFJPRFVDVF9NSU5VU19CVVRUT046ICcudDcwNl9fcHJvZHVjdC1taW51cycsXG4gICAgUFJPRFVDVF9QTFVTTUlOVVM6ICcudDcwNl9fcHJvZHVjdC1wbHVzbWludXMnLFxuICAgIFBST0RVQ1RfUVVBTlRJVFk6ICcudDcwNl9fcHJvZHVjdC1xdWFudGl0eSwgLnQtc3RvcmVfX2NhcmRfX3F1YW50aXR5JyxcbiAgICBDQVJUX0NPVU5URVI6ICcudDcwNl9fY2FydGljb24tY291bnRlciwgLnQtc3RvcmVfX2NvdW50ZXInLFxuICAgIENBUlRfQU1PVU5UOiAnLnQ3MDZfX2NhcnR3aW4tcHJvZGFtb3VudCwgLnQtc3RvcmVfX3RvdGFsLWFtb3VudCcsXG59O1xuY29uc3QgREVMQVlTID0ge1xuICAgIENBUlRfVVBEQVRFOiAzMDAsXG4gICAgRE9NX1VQREFURTogMTAwLFxuICAgIE9CU0VSVkVSX0NIRUNLOiA1MDAsXG4gICAgQ0FSVF9MT0FEX1RJTUVPVVQ6IDMwMDAsXG59O1xuY2xhc3MgQ2FydFV0aWxzIHtcbiAgICBzdGF0aWMgd2FpdChtcykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XG4gICAgfVxuICAgIHN0YXRpYyBhc3luYyB3YWl0Rm9yRWxlbWVudChzZWxlY3RvciwgbWF4QXR0ZW1wdHMgPSAxMCwgaW50ZXJ2YWwgPSAxMDApIHtcbiAgICAgICAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCBtYXhBdHRlbXB0czsgYXR0ZW1wdCsrKSB7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGF0dGVtcHQgPCBtYXhBdHRlbXB0cyAtIDEpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLndhaXQoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBzdGF0aWMgZmluZFByb2R1Y3RFbGVtZW50KHByb2R1Y3ROYW1lKSB7XG4gICAgICAgIGNvbnN0IHByb2R1Y3RzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChET01fU0VMRUNUT1JTLkNBUlRfUFJPRFVDVCk7XG4gICAgICAgIGZvciAoY29uc3QgcHJvZHVjdCBvZiBwcm9kdWN0cykge1xuICAgICAgICAgICAgY29uc3QgdGl0bGUgPSBwcm9kdWN0LnF1ZXJ5U2VsZWN0b3IoRE9NX1NFTEVDVE9SUy5QUk9EVUNUX1RJVExFKTtcbiAgICAgICAgICAgIGlmICh0aXRsZSAmJiB0aXRsZS50ZXh0Q29udGVudD8udHJpbSgpID09PSBwcm9kdWN0TmFtZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvZHVjdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgQ2FyZEZvcm0ge1xuICAgIGNvbnN0cnVjdG9yKHsgY2FyZEJsb2NrSWQsIHJ1bGVzIH0pIHtcbiAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmlzVXBkYXRpbmdDYXJ0ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY2FyZEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihjYXJkQmxvY2tJZCk7XG4gICAgICAgIGlmICghdGhpcy5jYXJkQmxvY2spIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYENhcmQgYmxvY2sgd2l0aCBpZCAke2NhcmRCbG9ja0lkfSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZvcm0gPSB0aGlzLmNhcmRCbG9jay5xdWVyeVNlbGVjdG9yKCdmb3JtJyk7XG4gICAgICAgIGlmICghdGhpcy5mb3JtKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGb3JtIGJsb2NrIHdpdGggaWQgJHtjYXJkQmxvY2tJZH0gbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmluaXRGb3JtKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ydWxlcyA9IHJ1bGVzO1xuICAgICAgICB0aGlzLmZpZWxkcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50LWlucHV0LWdyb3VwJyk7XG4gICAgICAgIHRoaXMuaW5pdFJ1bGVzKCk7XG4gICAgICAgIHRoaXMuaW5pdENhcnRPYnNlcnZlcigpO1xuICAgIH1cbiAgICBpbml0Rm9ybSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtpbml0XScsIHRoaXMuZm9ybS5lbGVtZW50cyk7XG4gICAgICAgIHRoaXMuZm9ybS5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGFzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IHRhcmdldD8ubmFtZTtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkVmFsdWUgPSB0YXJnZXQ/LnZhbHVlO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtpbnB1dF0nLCBlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoZmllbGRWYWx1ZSwgXCJ8XCIsIGZpZWxkTmFtZSk7XG4gICAgICAgICAgICBjb25zdCBydWxlID0gdGhpcy5ydWxlcy5maW5kKHIgPT4gci52YXJpYWJsZSA9PT0gZmllbGROYW1lKTtcbiAgICAgICAgICAgIGlmIChydWxlKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkU3RhdGUgPSBuZXcgTWFwKHRoaXMuYWN0aW9uc1N0YXRlcyk7XG4gICAgICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gcnVsZS5hY3Rpb25zLmZpbmQoYSA9PiBhLnZhbHVlID09PSBmaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcy5zZXQoZmllbGROYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZmllbGRWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLnNldChmaWVsZE5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogbnVsbFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHBseUFjdGlvbnMob2xkU3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5mb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGFzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IHRhcmdldD8ubmFtZTtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkVmFsdWUgPSB0YXJnZXQ/LnZhbHVlO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjaGFuZ2VdJywgZSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGZpZWxkVmFsdWUsIFwifFwiLCBmaWVsZE5hbWUpO1xuICAgICAgICAgICAgY29uc3QgcnVsZSA9IHRoaXMucnVsZXMuZmluZChyID0+IHIudmFyaWFibGUgPT09IGZpZWxkTmFtZSk7XG4gICAgICAgICAgICBpZiAocnVsZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IHJ1bGUuYWN0aW9ucy5maW5kKGEgPT4gYS52YWx1ZSA9PT0gZmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRTdGF0ZSA9IG5ldyBNYXAodGhpcy5hY3Rpb25zU3RhdGVzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLnNldChmaWVsZE5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBmaWVsZFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwbHlBY3Rpb25zKG9sZFN0YXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9sZFN0YXRlID0gbmV3IE1hcCh0aGlzLmFjdGlvbnNTdGF0ZXMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuc2V0KGZpZWxkTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBudWxsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmFwcGx5QWN0aW9ucyhvbGRTdGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgaW5pdFJ1bGVzKCkge1xuICAgICAgICB0aGlzLnJ1bGVzLmZvckVhY2gocnVsZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZCA9IHRoaXMuZm9ybS5lbGVtZW50cy5uYW1lZEl0ZW0ocnVsZS52YXJpYWJsZSk7XG4gICAgICAgICAgICBpZiAoZmllbGQpIHtcbiAgICAgICAgICAgICAgICBsZXQgZmllbGRWYWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZCBpbnN0YW5jZW9mIFJhZGlvTm9kZUxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2tlZFJhZGlvID0gQXJyYXkuZnJvbShmaWVsZCkuZmluZCgocmFkaW8pID0+IHJhZGlvLmNoZWNrZWQpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlID0gY2hlY2tlZFJhZGlvPy52YWx1ZSB8fCAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZmllbGQgaW5zdGFuY2VvZiBIVE1MU2VsZWN0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlID0gZmllbGQudmFsdWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGZpZWxkIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gJ3JhZGlvJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZSA9IGZpZWxkLmNoZWNrZWQgPyBmaWVsZC52YWx1ZSA6ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09ICdjaGVja2JveCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWUgPSBmaWVsZC5jaGVja2VkID8gZmllbGQudmFsdWUgOiAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWUgPSBmaWVsZC52YWx1ZSB8fCAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRSdWxlc10g0J/QvtC70LU6JywgcnVsZS52YXJpYWJsZSwgJ9CX0L3QsNGH0LXQvdC40LU6JywgZmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gcnVsZS5hY3Rpb25zLmZpbmQoYSA9PiBhLnZhbHVlID09PSBmaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uICYmIGZpZWxkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLnNldChydWxlLnZhcmlhYmxlLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZmllbGRWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRSdWxlc10g0JjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90L4g0YHQvtGB0YLQvtGP0L3QuNC1INC00LvRjzonLCBydWxlLnZhcmlhYmxlLCBhY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY2xlYW51cENhcnRPbkluaXQoKTtcbiAgICB9XG4gICAgYXN5bmMgY2xlYW51cENhcnRPbkluaXQoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCd0LDRh9Cw0LvQviDQvtGH0LjRgdGC0LrQuCDQutC+0YDQt9C40L3RiycpO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNoZWNrQ2FydCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgICAgICAgICAgaWYgKHRpbGRhQ2FydCAmJiB0aWxkYUNhcnQucHJvZHVjdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh2b2lkIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChjaGVja0NhcnQsIDIwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNoZWNrQ2FydCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAoIXRpbGRhQ2FydCB8fCAhQXJyYXkuaXNBcnJheSh0aWxkYUNhcnQucHJvZHVjdHMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCa0L7RgNC30LjQvdCwINC90LXQtNC+0YHRgtGD0L/QvdCwJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0KLQvtCy0LDRgNGLINCyINC60L7RgNC30LjQvdC1OicsIHRpbGRhQ2FydC5wcm9kdWN0cy5tYXAoKHApID0+IHAubmFtZSkpO1xuICAgICAgICBjb25zdCBhbGxSdWxlUHJvZHVjdHMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMucnVsZXMuZm9yRWFjaChydWxlID0+IHtcbiAgICAgICAgICAgIHJ1bGUuYWN0aW9ucy5mb3JFYWNoKGFjdGlvbiA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBhbGxSdWxlUHJvZHVjdHMuYWRkKGFjdGlvbi52YWx1ZS50cmltKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYWN0aXZlUHJvZHVjdHMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcy5mb3JFYWNoKChzdGF0ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHN0YXRlLmFjdGlvbiAmJiBzdGF0ZS5hY3Rpb24udmFsdWUpIHtcbiAgICAgICAgICAgICAgICBhY3RpdmVQcm9kdWN0cy5hZGQoc3RhdGUuYWN0aW9uLnZhbHVlLnRyaW0oKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQktGB0LUg0YLQvtCy0LDRgNGLINC40Lcg0L/RgNCw0LLQuNC7OicsIEFycmF5LmZyb20oYWxsUnVsZVByb2R1Y3RzKSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCQ0LrRgtC40LLQvdGL0LUg0YLQvtCy0LDRgNGLOicsIEFycmF5LmZyb20oYWN0aXZlUHJvZHVjdHMpKTtcbiAgICAgICAgY29uc3QgcHJvZHVjdHNUb1JlbW92ZSA9IFtdO1xuICAgICAgICB0aWxkYUNhcnQucHJvZHVjdHMuZm9yRWFjaCgocHJvZHVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdE5hbWUgPSBwcm9kdWN0Lm5hbWU/LnRyaW0oKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0TmFtZSAmJiBhbGxSdWxlUHJvZHVjdHMuaGFzKHByb2R1Y3ROYW1lKSAmJiAhYWN0aXZlUHJvZHVjdHMuaGFzKHByb2R1Y3ROYW1lKSkge1xuICAgICAgICAgICAgICAgIHByb2R1Y3RzVG9SZW1vdmUucHVzaChwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQotC+0LLQsNGA0Ysg0LTQu9GPINGD0LTQsNC70LXQvdC40Y86JywgcHJvZHVjdHNUb1JlbW92ZSk7XG4gICAgICAgIGlmIChwcm9kdWN0c1RvUmVtb3ZlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcHJvZHVjdE5hbWUgb2YgcHJvZHVjdHNUb1JlbW92ZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCj0LTQsNC70Y/QtdC8OicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlbW92ZVByb2R1Y3RGcm9tQ2FydChwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDinJMg0J7Rh9C40YHRgtC60LAg0LfQsNCy0LXRgNGI0LXQvdCwJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQndC10YIg0YLQvtCy0LDRgNC+0LIg0LTQu9GPINGD0LTQsNC70LXQvdC40Y8nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzYXZlVGlsZGFDYXJ0KHRpbGRhQ2FydCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5pc1VwZGF0aW5nQ2FydCA9IHRydWU7XG4gICAgICAgICAgICB0aWxkYUNhcnQudXBkYXRlZCA9IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApO1xuICAgICAgICAgICAgY29uc3QgY2FydERhdGEgPSB7XG4gICAgICAgICAgICAgICAgcHJvZHVjdHM6IHRpbGRhQ2FydC5wcm9kdWN0cyB8fCBbXSxcbiAgICAgICAgICAgICAgICBwcm9kYW1vdW50OiB0aWxkYUNhcnQucHJvZGFtb3VudCB8fCAwLFxuICAgICAgICAgICAgICAgIGFtb3VudDogdGlsZGFDYXJ0LmFtb3VudCB8fCAwLFxuICAgICAgICAgICAgICAgIHRvdGFsOiB0aWxkYUNhcnQucHJvZHVjdHM/Lmxlbmd0aCB8fCAwLFxuICAgICAgICAgICAgICAgIHVwZGF0ZWQ6IHRpbGRhQ2FydC51cGRhdGVkLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5OiB0aWxkYUNhcnQuY3VycmVuY3kgfHwgXCLRgC5cIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV9zaWRlOiB0aWxkYUNhcnQuY3VycmVuY3lfc2lkZSB8fCBcInJcIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV9zZXA6IHRpbGRhQ2FydC5jdXJyZW5jeV9zZXAgfHwgXCIsXCIsXG4gICAgICAgICAgICAgICAgY3VycmVuY3lfZGVjOiB0aWxkYUNhcnQuY3VycmVuY3lfZGVjIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgY3VycmVuY3lfdHh0OiB0aWxkYUNhcnQuY3VycmVuY3lfdHh0IHx8IFwi0YAuXCIsXG4gICAgICAgICAgICAgICAgY3VycmVuY3lfdHh0X3I6IHRpbGRhQ2FydC5jdXJyZW5jeV90eHRfciB8fCBcIiDRgC5cIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV90eHRfbDogdGlsZGFDYXJ0LmN1cnJlbmN5X3R4dF9sIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgc3lzdGVtOiB0aWxkYUNhcnQuc3lzdGVtIHx8IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgIHNldHRpbmdzOiB0aWxkYUNhcnQuc2V0dGluZ3MgfHwge30sXG4gICAgICAgICAgICAgICAgZGVsaXZlcnk6IHRpbGRhQ2FydC5kZWxpdmVyeSB8fCB7IG5hbWU6IFwibm9kZWxpdmVyeVwiLCBwcmljZTogMCB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3RjYXJ0JywgSlNPTi5zdHJpbmdpZnkoY2FydERhdGEpKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbc2F2ZVRpbGRhQ2FydF0g4pyTINCa0L7RgNC30LjQvdCwINGB0L7RhdGA0LDQvdC10L3QsCDQsiBsb2NhbFN0b3JhZ2UnKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNVcGRhdGluZ0NhcnQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3NhdmVUaWxkYUNhcnRdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjzonLCBlKTtcbiAgICAgICAgICAgIHRoaXMuaXNVcGRhdGluZ0NhcnQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0Q2FydE9ic2VydmVyKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRDYXJ0T2JzZXJ2ZXJdINCY0L3QuNGG0LjQsNC70LjQt9Cw0YbQuNGPINC90LDQsdC70Y7QtNCw0YLQtdC70Y8g0LrQvtGA0LfQuNC90YsnKTtcbiAgICAgICAgbGV0IGxhc3RNYWluUHJvZHVjdHNRdHkgPSB0aGlzLmdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCk7XG4gICAgICAgIGNvbnN0IGNoZWNrQ2FydENoYW5nZXMgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50UXR5ID0gdGhpcy5nZXRNYWluUHJvZHVjdHNRdWFudGl0eSgpO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdHkgIT09IGxhc3RNYWluUHJvZHVjdHNRdHkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0g0JjQt9C80LXQvdC40LvQvtGB0Ywg0LrQvtC70LjRh9C10YHRgtCy0L4g0YLQvtCy0LDRgNC+0LI6Jywge1xuICAgICAgICAgICAgICAgICAgICDQsdGL0LvQvjogbGFzdE1haW5Qcm9kdWN0c1F0eSxcbiAgICAgICAgICAgICAgICAgICAg0YHRgtCw0LvQvjogY3VycmVudFF0eVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGxhc3RNYWluUHJvZHVjdHNRdHkgPSBjdXJyZW50UXR5O1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgb2JzZXJ2ZUNhcnQgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjYXJ0Q29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLkNBUlRfQ09OVEFJTkVSKTtcbiAgICAgICAgICAgIGlmIChjYXJ0Q29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2FydE9ic2VydmVyXSBNdXRhdGlvbk9ic2VydmVyOiDQvtCx0L3QsNGA0YPQttC10L3RiyDQuNC30LzQtdC90LXQvdC40Y8nKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdRdHkgPSB0aGlzLmdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV3UXR5ICE9PSBsYXN0TWFpblByb2R1Y3RzUXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdE1haW5Qcm9kdWN0c1F0eSA9IG5ld1F0eTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIERFTEFZUy5DQVJUX1VQREFURSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShjYXJ0Q29udGFpbmVyLCB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRDYXJ0T2JzZXJ2ZXJdIOKckyBNdXRhdGlvbk9ic2VydmVyINGD0YHRgtCw0L3QvtCy0LvQtdC9Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KG9ic2VydmVDYXJ0LCAxMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgb2JzZXJ2ZUNhcnQoKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgICAgICBjb25zdCBkZWxldGVCdXR0b24gPSB0YXJnZXQuY2xvc2VzdChET01fU0VMRUNUT1JTLlBST0RVQ1RfREVMX0JVVFRPTik7XG4gICAgICAgICAgICBpZiAoZGVsZXRlQnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdEVsZW1lbnQgPSBkZWxldGVCdXR0b24uY2xvc2VzdChET01fU0VMRUNUT1JTLkNBUlRfUFJPRFVDVCk7XG4gICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRpdGxlRWwgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9USVRMRSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3ROYW1lID0gdGl0bGVFbD8udGV4dENvbnRlbnQ/LnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2R1Y3ROYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0g0KPQtNCw0LvQtdC90LjQtSDRgtC+0LLQsNGA0LA6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVSdWxlUHJvZHVjdERlbGV0aW9uKHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGlzQ2FydEJ1dHRvbiA9IHRhcmdldC5jbG9zZXN0KGAke0RPTV9TRUxFQ1RPUlMuUFJPRFVDVF9QTFVTX0JVVFRPTn0sICR7RE9NX1NFTEVDVE9SUy5QUk9EVUNUX01JTlVTX0JVVFRPTn0sICR7RE9NX1NFTEVDVE9SUy5QUk9EVUNUX0RFTF9CVVRUT059YCk7XG4gICAgICAgICAgICBpZiAoaXNDYXJ0QnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjYXJ0T2JzZXJ2ZXJdINCa0LvQuNC6INC90LAg0LrQvdC+0L/QutGDINC60L7RgNC30LjQvdGLJyk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBjaGVja0NhcnRDaGFuZ2VzKCksIERFTEFZUy5PQlNFUlZFUl9DSEVDSyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBzZXR1cExvY2FsU3RvcmFnZUludGVyY2VwdG9yID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF3aW5kb3cuX19jYXJkZm9ybV9sb2NhbHN0b3JhZ2VfaW50ZXJjZXB0ZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvcmlnaW5hbFNldEl0ZW0gPSBTdG9yYWdlLnByb3RvdHlwZS5zZXRJdGVtO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAgIFN0b3JhZ2UucHJvdG90eXBlLnNldEl0ZW0gPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBvcmlnaW5hbFNldEl0ZW0uYXBwbHkodGhpcywgW2tleSwgdmFsdWVdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ3RjYXJ0JyAmJiAhc2VsZi5pc1VwZGF0aW5nQ2FydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjYXJ0T2JzZXJ2ZXJdIGxvY2FsU3RvcmFnZSB0Y2FydCDQuNC30LzQtdC90LXQvSDQuNC30LLQvdC1Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGNoZWNrQ2FydENoYW5nZXMoKSwgREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgd2luZG93Ll9fY2FyZGZvcm1fbG9jYWxzdG9yYWdlX2ludGVyY2VwdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRDYXJ0T2JzZXJ2ZXJdIOKckyBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSDQv9C10YDQtdGF0LLQsNGH0LXQvScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuICAgICAgICAgICAgc2V0dXBMb2NhbFN0b3JhZ2VJbnRlcmNlcHRvcigpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBzZXR1cExvY2FsU3RvcmFnZUludGVyY2VwdG9yKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRDYXJ0T2JzZXJ2ZXJdIOKckyDQndCw0LHQu9GO0LTQsNGC0LXQu9C4INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdGLJyk7XG4gICAgfVxuICAgIGhhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb24ocHJvZHVjdE5hbWUpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtoYW5kbGVSdWxlUHJvZHVjdERlbGV0aW9uXSDQn9GA0L7QstC10YDQutCwINGC0L7QstCw0YDQsDonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgIGZvciAoY29uc3QgW2tleSwgc3RhdGVdIG9mIHRoaXMuYWN0aW9uc1N0YXRlcykge1xuICAgICAgICAgICAgaWYgKHN0YXRlLmFjdGlvbiAmJiBzdGF0ZS5hY3Rpb24udmFsdWUgPT09IHByb2R1Y3ROYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtoYW5kbGVSdWxlUHJvZHVjdERlbGV0aW9uXSDQotC+0LLQsNGAINC40Lcg0L/RgNCw0LLQuNC70LAg0L3QsNC50LTQtdC9OicsIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGU6IGtleSxcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBzdGF0ZS5hY3Rpb24udmFsdWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBsZXQgZm91bmRFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBjb25zdCBhbGxJbnB1dHMgPSB0aGlzLmZvcm0ucXVlcnlTZWxlY3RvckFsbCgnaW5wdXQsIHNlbGVjdCcpO1xuICAgICAgICAgICAgICAgIGFsbElucHV0cy5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gZWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKChlbC50eXBlID09PSAncmFkaW8nIHx8IGVsLnR5cGUgPT09ICdjaGVja2JveCcpICYmIGVsLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWwudmFsdWUudHJpbSgpID09PSBzdGF0ZS5hY3Rpb24udmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRFbGVtZW50ID0gZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtoYW5kbGVSdWxlUHJvZHVjdERlbGV0aW9uXSDQndCw0LnQtNC10L0g0Y3Qu9C10LzQtdC90YI6Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBlbC50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZWwudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ6IGVsLmNoZWNrZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChmb3VuZEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtoYW5kbGVSdWxlUHJvZHVjdERlbGV0aW9uXSDQodC90LjQvNCw0LXQvCDQstGL0LHQvtGAINGBOicsIGZvdW5kRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kRWxlbWVudC5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcy5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtoYW5kbGVSdWxlUHJvZHVjdERlbGV0aW9uXSDinJMg0J/RgNCw0LLQuNC70L4g0L7RgtC80LXQvdC10L3QviwgY2hlY2tib3gg0YHQvdGP0YInKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFtoYW5kbGVSdWxlUHJvZHVjdERlbGV0aW9uXSDQrdC70LXQvNC10L3RgiDRhNC+0YDQvNGLINC90LUg0L3QsNC50LTQtdC9INC00LvRjzonLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvblZhbHVlOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVJbnB1dHM6IEFycmF5LmZyb20oYWxsSW5wdXRzKS5tYXAoZWwgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBlbC50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBlbC52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyB1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0J3QsNGH0LDQu9C+INC+0LHQvdC+0LLQu9C10L3QuNGPINC60L7Qu9C40YfQtdGB0YLQstCwJyk7XG4gICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgaWYgKCF0aWxkYUNhcnQgfHwgIUFycmF5LmlzQXJyYXkodGlsZGFDYXJ0LnByb2R1Y3RzKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDQmtC+0YDQt9C40L3QsCDQvdC10LTQvtGB0YLRg9C/0L3QsCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCQ0LrRgtC40LLQvdGL0YUg0L/RgNCw0LLQuNC7OicsIHRoaXMuYWN0aW9uc1N0YXRlcy5zaXplKTtcbiAgICAgICAgZm9yIChjb25zdCBba2V5LCBzdGF0ZV0gb2YgdGhpcy5hY3Rpb25zU3RhdGVzKSB7XG4gICAgICAgICAgICBpZiAoc3RhdGUuYWN0aW9uICYmIHN0YXRlLmFjdGlvbi5xdWFudGl0eVR5cGUgPT09ICdwZXJQcm9kdWN0Jykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1F1YW50aXR5ID0gdGhpcy5jYWxjdWxhdGVSdWxlUHJvZHVjdFF1YW50aXR5KHN0YXRlLmFjdGlvbik7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdEluZGV4ID0gdGlsZGFDYXJ0LnByb2R1Y3RzLmZpbmRJbmRleCgocCkgPT4gcC5uYW1lPy50cmltKCkgPT09IHN0YXRlLmFjdGlvbi52YWx1ZS50cmltKCkpO1xuICAgICAgICAgICAgICAgIGlmIChwcm9kdWN0SW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9sZFF1YW50aXR5ID0gcGFyc2VJbnQodGlsZGFDYXJ0LnByb2R1Y3RzW3Byb2R1Y3RJbmRleF0ucXVhbnRpdHkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDQotC+0LLQsNGAIFwiJHtzdGF0ZS5hY3Rpb24udmFsdWV9XCI6YCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdEluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgb2xkUXVhbnRpdHk6IG9sZFF1YW50aXR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3UXVhbnRpdHk6IG5ld1F1YW50aXR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgbmVlZHNVcGRhdGU6IG9sZFF1YW50aXR5ICE9PSBuZXdRdWFudGl0eVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZFF1YW50aXR5ICE9PSBuZXdRdWFudGl0eSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g4pqhINCe0LHQvdC+0LLQu9GP0LXQvCDRh9C10YDQtdC3IHRjYXJ0X19wcm9kdWN0X191cGRhdGVRdWFudGl0eScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHByb2R1Y3RFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgMTA7IGF0dGVtcHQrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RFbGVtZW50ID0gQ2FydFV0aWxzLmZpbmRQcm9kdWN0RWxlbWVudChzdGF0ZS5hY3Rpb24udmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9kdWN0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDQrdC70LXQvNC10L3RgiDQvdCw0LnQtNC10L0g0L3QsCDQv9C+0L/Ri9GC0LrQtTonLCBhdHRlbXB0ICsgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0ZW1wdCA8IDkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgQ2FydFV0aWxzLndhaXQoREVMQVlTLkRPTV9VUERBVEUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9kdWN0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHF1YW50aXR5RWxlbWVudCA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoRE9NX1NFTEVDVE9SUy5QUk9EVUNUX1FVQU5USVRZKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocXVhbnRpdHlFbGVtZW50ICYmIHR5cGVvZiB3aW5kb3cudGNhcnRfX3Byb2R1Y3RfX3VwZGF0ZVF1YW50aXR5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy50Y2FydF9fcHJvZHVjdF9fdXBkYXRlUXVhbnRpdHkocXVhbnRpdHlFbGVtZW50LCBwcm9kdWN0RWxlbWVudCwgcHJvZHVjdEluZGV4LCBuZXdRdWFudGl0eSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldIOKckyDQmtC+0LvQuNGH0LXRgdGC0LLQviDQvtCx0L3QvtCy0LvQtdC90L4g0YfQtdGA0LXQtyBUaWxkYSBBUEk6Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogc3RhdGUuYWN0aW9uLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkUXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdRdWFudGl0eVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgQ2FydFV0aWxzLndhaXQoREVMQVlTLkRPTV9VUERBVEUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwbHVzTWludXNCdXR0b25zID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLlBST0RVQ1RfUExVU01JTlVTKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBsdXNNaW51c0J1dHRvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsdXNNaW51c0J1dHRvbnMuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDQndC1INC90LDQudC00LXQvSBxdWFudGl0eUVsZW1lbnQg0LjQu9C4INGE0YPQvdC60YbQuNGPIHVwZGF0ZVF1YW50aXR5Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDQndC1INC90LDQudC00LXQvSBET00g0Y3Qu9C10LzQtdC90YIg0YLQvtCy0LDRgNCwINC/0L7RgdC70LUg0L7QttC40LTQsNC90LjRjycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCi0L7QstCw0YAgXCIke3N0YXRlLmFjdGlvbi52YWx1ZX1cIiDQndCVINC90LDQudC00LXQvSDQsiDQutC+0YDQt9C40L3QtWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDinJMg0J7QsdC90L7QstC70LXQvdC40LUg0LfQsNCy0LXRgNGI0LXQvdC+Jyk7XG4gICAgfVxuICAgIHVwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTShwcm9kdWN0TmFtZSwgbmV3UXVhbnRpdHkpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dINCe0LHQvdC+0LLQu9C10L3QuNC1OicsIHsgcHJvZHVjdE5hbWUsIG5ld1F1YW50aXR5IH0pO1xuICAgICAgICBjb25zdCB0aXRsZVNlbGVjdG9ycyA9IFtcbiAgICAgICAgICAgICcudDcwNl9fcHJvZHVjdC10aXRsZScsXG4gICAgICAgICAgICAnLnQtc3RvcmVfX3Byb2R1Y3QtbmFtZScsXG4gICAgICAgICAgICAnLnQtcHJvZHVjdF9fdGl0bGUnLFxuICAgICAgICAgICAgJy5qcy1wcm9kdWN0LW5hbWUnXG4gICAgICAgIF07XG4gICAgICAgIGxldCBwcm9kdWN0RWxlbWVudCA9IG51bGw7XG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgdGl0bGVTZWxlY3RvcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RUaXRsZXMgPSBbLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcildO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dINCf0L7QuNGB0Log0YfQtdGA0LXQtyBcIiR7c2VsZWN0b3J9XCI6YCwgcHJvZHVjdFRpdGxlcy5sZW5ndGgsICfRjdC70LXQvNC10L3RgtC+0LInKTtcbiAgICAgICAgICAgIGNvbnN0IGZvdW5kRWxlbWVudCA9IHByb2R1Y3RUaXRsZXMuZmluZChlbCA9PiBlbC5pbm5lclRleHQudHJpbSgpID09PSBwcm9kdWN0TmFtZS50cmltKCkpO1xuICAgICAgICAgICAgaWYgKGZvdW5kRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHByb2R1Y3RFbGVtZW50ID0gZm91bmRFbGVtZW50LmNsb3Nlc3QoJy50NzA2X19jYXJ0d2luLXByb2R1Y3QsIC50LXN0b3JlX19wcm9kdWN0LCAudC1wcm9kdWN0Jyk7XG4gICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDinJMg0KLQvtCy0LDRgCDQvdCw0LnQtNC10L0g0YfQtdGA0LXQtzonLCBzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDinJcg0K3Qu9C10LzQtdC90YIg0YLQvtCy0LDRgNCwINCd0JUg0L3QsNC50LTQtdC9INCyIERPTTonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g0JLRgdC1INGC0L7QstCw0YDRiyDQsiBET006JywgWy4uLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50NzA2X19wcm9kdWN0LXRpdGxlLCAudC1zdG9yZV9fcHJvZHVjdC1uYW1lJyldLm1hcCgoZWwpID0+IGVsLmlubmVyVGV4dCkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1YW50aXR5SW5wdXRTZWxlY3RvcnMgPSBbXG4gICAgICAgICAgICAnLnQ3MDZfX3Byb2R1Y3QtcXVhbnRpdHknLFxuICAgICAgICAgICAgJy50LXN0b3JlX19xdWFudGl0eS1pbnB1dCcsXG4gICAgICAgICAgICAnaW5wdXRbbmFtZT1cInF1YW50aXR5XCJdJyxcbiAgICAgICAgICAgICcuanMtcHJvZHVjdC1xdWFudGl0eSdcbiAgICAgICAgXTtcbiAgICAgICAgbGV0IHF1YW50aXR5SW5wdXQgPSBudWxsO1xuICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHF1YW50aXR5SW5wdXRTZWxlY3RvcnMpIHtcbiAgICAgICAgICAgIHF1YW50aXR5SW5wdXQgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIGlmIChxdWFudGl0eUlucHV0KSB7XG4gICAgICAgICAgICAgICAgcXVhbnRpdHlJbnB1dC52YWx1ZSA9IG5ld1F1YW50aXR5LnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgcXVhbnRpdHlJbnB1dC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnY2hhbmdlJywgeyBidWJibGVzOiB0cnVlIH0pKTtcbiAgICAgICAgICAgICAgICBxdWFudGl0eUlucHV0LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdpbnB1dCcsIHsgYnViYmxlczogdHJ1ZSB9KSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dIOKckyDQntCx0L3QvtCy0LvQtdC9IGlucHV0INGH0LXRgNC10Lc6Jywgc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1YW50aXR5RGlzcGxheVNlbGVjdG9ycyA9IFtcbiAgICAgICAgICAgICcudC1xdWFudGl0eV9fdmFsdWUnLFxuICAgICAgICAgICAgJy50NzA2X19wcm9kdWN0LXF1YW50aXR5LXZhbHVlJyxcbiAgICAgICAgICAgICcudC1zdG9yZV9fcXVhbnRpdHktdmFsdWUnXG4gICAgICAgIF07XG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgcXVhbnRpdHlEaXNwbGF5U2VsZWN0b3JzKSB7XG4gICAgICAgICAgICBjb25zdCBxdWFudGl0eURpc3BsYXkgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIGlmIChxdWFudGl0eURpc3BsYXkpIHtcbiAgICAgICAgICAgICAgICBxdWFudGl0eURpc3BsYXkudGV4dENvbnRlbnQgPSBuZXdRdWFudGl0eS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDinJMg0J7QsdC90L7QstC70LXQvSBkaXNwbGF5INGH0LXRgNC10Lc6Jywgc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgaWYgKHRpbGRhQ2FydCkge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRpbGRhQ2FydC5wcm9kdWN0cy5maW5kKChwKSA9PiBwLm5hbWU/LnRyaW0oKSA9PT0gcHJvZHVjdE5hbWUudHJpbSgpKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWxQcmljZSA9IHBhcnNlRmxvYXQocHJvZHVjdC5wcmljZSkgKiBuZXdRdWFudGl0eTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcmljZVNlbGVjdG9ycyA9IFtcbiAgICAgICAgICAgICAgICAgICAgJy50NzA2X19wcm9kdWN0LXByaWNlJyxcbiAgICAgICAgICAgICAgICAgICAgJy50LXN0b3JlX19wcm9kdWN0LXByaWNlJyxcbiAgICAgICAgICAgICAgICAgICAgJy50LXByb2R1Y3RfX3ByaWNlJyxcbiAgICAgICAgICAgICAgICAgICAgJy5qcy1wcm9kdWN0LXByaWNlJ1xuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBwcmljZVNlbGVjdG9ycykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcmljZUVsZW1lbnQgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByaWNlRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpY2VFbGVtZW50LnRleHRDb250ZW50ID0gYCR7dG90YWxQcmljZS50b0xvY2FsZVN0cmluZygncnUtUlUnKX0gJHt0aWxkYUNhcnQuY3VycmVuY3lfdHh0X3IgfHwgJyDRgC4nfWA7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g4pyTINCe0LHQvdC+0LLQu9C10L3QsCDRgdGC0L7QuNC80L7RgdGC0Ywg0YfQtdGA0LXQtzonLCBzZWxlY3RvciwgdG90YWxQcmljZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g4pyTINCe0LHQvdC+0LLQu9C10L3QuNC1INC30LDQstC10YDRiNC10L3QviDQtNC70Y86JywgcHJvZHVjdE5hbWUpO1xuICAgIH1cbiAgICB1cGRhdGVBbGxDYXJ0SXRlbXNJbkRPTSgpIHtcbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAoIXRpbGRhQ2FydCB8fCAhQXJyYXkuaXNBcnJheSh0aWxkYUNhcnQucHJvZHVjdHMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlQWxsQ2FydEl0ZW1zSW5ET01dINCa0L7RgNC30LjQvdCwINC90LXQtNC+0YHRgtGD0L/QvdCwJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVBbGxDYXJ0SXRlbXNJbkRPTV0g0J7QsdC90L7QstC70Y/QtdC8INCy0YHQtSDRgtC+0LLQsNGA0Ysg0LIgRE9NJyk7XG4gICAgICAgIHRpbGRhQ2FydC5wcm9kdWN0cy5mb3JFYWNoKChwcm9kdWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0TmFtZSA9IHByb2R1Y3QubmFtZT8udHJpbSgpO1xuICAgICAgICAgICAgY29uc3QgcXVhbnRpdHkgPSBwYXJzZUludChwcm9kdWN0LnF1YW50aXR5IHx8IDEpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3ROYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET00ocHJvZHVjdE5hbWUsIHF1YW50aXR5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQWxsQ2FydEl0ZW1zSW5ET01dIOKckyDQktGB0LUg0YLQvtCy0LDRgNGLINC+0LHQvdC+0LLQu9C10L3RiycpO1xuICAgIH1cbiAgICByZWZyZXNoQ2FydFVJKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3JlZnJlc2hDYXJ0VUldINCd0LDRh9Cw0LvQviDQvtCx0L3QvtCy0LvQtdC90LjRjyBVSSDQutC+0YDQt9C40L3RiycpO1xuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy50X3N0b3JlX19yZWZyZXNoY2FydCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgd2luZG93LnRfc3RvcmVfX3JlZnJlc2hjYXJ0KCk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3JlZnJlc2hDYXJ0VUldIOKckyDQktGL0LfQstCw0L0gdF9zdG9yZV9fcmVmcmVzaGNhcnQnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZWZyZXNoRnVuY3Rpb25zID0gW1xuICAgICAgICAgICAgJ3Q3MDZfX3VwZGF0ZUNhcnQnLFxuICAgICAgICAgICAgJ3RjYXJ0X191cGRhdGVDYXJ0JyxcbiAgICAgICAgICAgICd0X3N0b3JlX191cGRhdGVDYXJ0JyxcbiAgICAgICAgICAgICd0NzA2X2luaXQnXG4gICAgICAgIF07XG4gICAgICAgIHJlZnJlc2hGdW5jdGlvbnMuZm9yRWFjaChmdW5jTmFtZSA9PiB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvd1tmdW5jTmFtZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3dbZnVuY05hbWVdKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbcmVmcmVzaENhcnRVSV0g4pyTINCS0YvQt9Cy0LDQvSAke2Z1bmNOYW1lfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtmb3JtXSBbcmVmcmVzaENhcnRVSV0g0J7RiNC40LHQutCwICR7ZnVuY05hbWV9OmAsIGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMudXBkYXRlQWxsQ2FydEl0ZW1zSW5ET00oKTtcbiAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdjYXJ0LXVwZGF0ZWQnKSk7XG4gICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCd0Y2FydC11cGRhdGVkJykpO1xuICAgICAgICB0aGlzLnVwZGF0ZUNhcnRDb3VudGVycygpO1xuICAgIH1cbiAgICB1cGRhdGVDYXJ0Q291bnRlcnMoKSB7XG4gICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgaWYgKCF0aWxkYUNhcnQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGNhcnRDb3VudGVycyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoRE9NX1NFTEVDVE9SUy5DQVJUX0NPVU5URVIpO1xuICAgICAgICBjYXJ0Q291bnRlcnMuZm9yRWFjaChjb3VudGVyID0+IHtcbiAgICAgICAgICAgIGlmIChjb3VudGVyKSB7XG4gICAgICAgICAgICAgICAgY291bnRlci50ZXh0Q29udGVudCA9IHRpbGRhQ2FydC50b3RhbC50b1N0cmluZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgY2FydEFtb3VudHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKERPTV9TRUxFQ1RPUlMuQ0FSVF9BTU9VTlQpO1xuICAgICAgICBjYXJ0QW1vdW50cy5mb3JFYWNoKGFtb3VudCA9PiB7XG4gICAgICAgICAgICBpZiAoYW1vdW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybWF0dGVkQW1vdW50ID0gdGlsZGFDYXJ0LmFtb3VudC50b0xvY2FsZVN0cmluZygncnUtUlUnKTtcbiAgICAgICAgICAgICAgICBhbW91bnQudGV4dENvbnRlbnQgPSBgJHtmb3JtYXR0ZWRBbW91bnR9ICR7dGlsZGFDYXJ0LmN1cnJlbmN5X3R4dF9yIHx8ICcg0YAuJ31gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0Q291bnRlcnNdIOKckyDQodGH0LXRgtGH0LjQutC4INC+0LHQvdC+0LLQu9C10L3RiycpO1xuICAgIH1cbiAgICBnZXRNYWluUHJvZHVjdHNRdWFudGl0eSgpIHtcbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAoIXRpbGRhQ2FydCB8fCAhQXJyYXkuaXNBcnJheSh0aWxkYUNhcnQucHJvZHVjdHMpKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBydWxlUHJvZHVjdE5hbWVzID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLnJ1bGVzLmZvckVhY2gocnVsZSA9PiB7XG4gICAgICAgICAgICBydWxlLmFjdGlvbnMuZm9yRWFjaChhY3Rpb24gPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVsZVByb2R1Y3ROYW1lcy5hZGQoYWN0aW9uLnZhbHVlLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgdG90YWxRdWFudGl0eSA9IDA7XG4gICAgICAgIGNvbnN0IG1haW5Qcm9kdWN0cyA9IFtdO1xuICAgICAgICB0aWxkYUNhcnQucHJvZHVjdHMuZm9yRWFjaCgocHJvZHVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdE5hbWUgPSBwcm9kdWN0Lm5hbWU/LnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IGlzUnVsZVByb2R1Y3QgPSBydWxlUHJvZHVjdE5hbWVzLmhhcyhwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICBjb25zdCBxdHkgPSBwYXJzZUludChwcm9kdWN0LnF1YW50aXR5IHx8IDEpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3ROYW1lICYmICFpc1J1bGVQcm9kdWN0KSB7XG4gICAgICAgICAgICAgICAgdG90YWxRdWFudGl0eSArPSBxdHk7XG4gICAgICAgICAgICAgICAgbWFpblByb2R1Y3RzLnB1c2goYCR7cHJvZHVjdE5hbWV9ICgke3F0eX0g0YjRgilgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbZ2V0TWFpblByb2R1Y3RzUXVhbnRpdHldJywge1xuICAgICAgICAgICAgJ9Ce0YHQvdC+0LLQvdGL0YUg0YLQvtCy0LDRgNC+0LInOiB0b3RhbFF1YW50aXR5LFxuICAgICAgICAgICAgJ9Ch0L/QuNGB0L7Quic6IG1haW5Qcm9kdWN0cyxcbiAgICAgICAgICAgICfQotC+0LLQsNGA0Ysg0L/RgNCw0LLQuNC7JzogQXJyYXkuZnJvbShydWxlUHJvZHVjdE5hbWVzKVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRvdGFsUXVhbnRpdHk7XG4gICAgfVxuICAgIGNhbGN1bGF0ZVJ1bGVQcm9kdWN0UXVhbnRpdHkoYWN0aW9uKSB7XG4gICAgICAgIGlmIChhY3Rpb24ucXVhbnRpdHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGFjdGlvbi5xdWFudGl0eTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYWN0aW9uLnF1YW50aXR5VHlwZSA9PT0gJ3BlclByb2R1Y3QnKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5tYXgoMSwgdGhpcy5nZXRNYWluUHJvZHVjdHNRdWFudGl0eSgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgYXN5bmMgcmVtb3ZlUHJvZHVjdEZyb21DYXJ0KHByb2R1Y3ROYW1lKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbcmVtb3ZlUHJvZHVjdF0g0J/QvtC/0YvRgtC60LAg0YPQtNCw0LvQuNGC0Yw6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICBjb25zdCBwcm9kdWN0RWxlbWVudCA9IENhcnRVdGlscy5maW5kUHJvZHVjdEVsZW1lbnQocHJvZHVjdE5hbWUpO1xuICAgICAgICBpZiAocHJvZHVjdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlbFByb2R1Y3RCdXR0b24gPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9ERUxfQlVUVE9OKTtcbiAgICAgICAgICAgIGlmIChkZWxQcm9kdWN0QnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgZGVsUHJvZHVjdEJ1dHRvbi5jbGljaygpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbcmVtb3ZlUHJvZHVjdF0g4pyTINCj0LTQsNC70LXQvdC+INGH0LXRgNC10LcgRE9NICjQutC70LjQuik6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgIGF3YWl0IENhcnRVdGlscy53YWl0KERFTEFZUy5DQVJUX1VQREFURSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAodGlsZGFDYXJ0ICYmIEFycmF5LmlzQXJyYXkodGlsZGFDYXJ0LnByb2R1Y3RzKSkge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdEluZGV4ID0gdGlsZGFDYXJ0LnByb2R1Y3RzLmZpbmRJbmRleCgocCkgPT4gcC5uYW1lPy50cmltKCkgPT09IHByb2R1Y3ROYW1lLnRyaW0oKSk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aWxkYUNhcnQucHJvZHVjdHNbcHJvZHVjdEluZGV4XTtcbiAgICAgICAgICAgICAgICBjb25zdCByZW1vdmVGdW5jdGlvbnMgPSBbXG4gICAgICAgICAgICAgICAgICAgICd0Y2FydF9fcmVtb3ZlUHJvZHVjdCcsXG4gICAgICAgICAgICAgICAgICAgICd0Y2FydF9yZW1vdmVQcm9kdWN0JyxcbiAgICAgICAgICAgICAgICAgICAgJ3Rfc3RvcmVfX3JlbW92ZVByb2R1Y3QnXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZ1bmNOYW1lIG9mIHJlbW92ZUZ1bmN0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvd1tmdW5jTmFtZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93W2Z1bmNOYW1lXShwcm9kdWN0LnVpZCB8fCBwcm9kdWN0LmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW3JlbW92ZVByb2R1Y3RdIOKckyDQo9C00LDQu9C10L3QviDRh9C10YDQtdC3ICR7ZnVuY05hbWV9OmAsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuQ0FSVF9VUERBVEUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtmb3JtXSBbcmVtb3ZlUHJvZHVjdF0g0J7RiNC40LHQutCwICR7ZnVuY05hbWV9OmAsIGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRpbGRhQ2FydC5wcm9kdWN0cy5zcGxpY2UocHJvZHVjdEluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICB0aWxkYUNhcnQuYW1vdW50ID0gdGlsZGFDYXJ0LnByb2R1Y3RzLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyAocGFyc2VGbG9hdChwLnByaWNlKSAqIHBhcnNlSW50KHAucXVhbnRpdHkgfHwgMSkpLCAwKTtcbiAgICAgICAgICAgICAgICB0aWxkYUNhcnQucHJvZGFtb3VudCA9IHRpbGRhQ2FydC5wcm9kdWN0cy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdGlsZGFDYXJ0LnRvdGFsID0gdGlsZGFDYXJ0LnByb2R1Y3RzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB0aWxkYUNhcnQudXBkYXRlZCA9IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNhdmVUaWxkYUNhcnQodGlsZGFDYXJ0KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy50X3N0b3JlX19yZWZyZXNoY2FydCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnRfc3RvcmVfX3JlZnJlc2hjYXJ0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtyZW1vdmVQcm9kdWN0XSDinJMg0KPQtNCw0LvQtdC90L4g0L3QsNC/0YDRj9C80YPRjiDQuNC3INC80LDRgdGB0LjQstCwOicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgQ2FydFV0aWxzLndhaXQoREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFtyZW1vdmVQcm9kdWN0XSDinJcg0J3QtSDRg9C00LDQu9C+0YHRjCDRg9C00LDQu9C40YLRjCDRgtC+0LLQsNGAOicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhc3luYyBhcHBseUFjdGlvbnMob2xkU3RhdGUgPSBuZXcgTWFwKCkpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdINCd0LDRh9Cw0LvQviDQv9GA0LjQvNC10L3QtdC90LjRjyDQtNC10LnRgdGC0LLQuNC5Jyk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQodGC0LDRgNC+0LUg0YHQvtGB0YLQvtGP0L3QuNC1OicsIE9iamVjdC5mcm9tRW50cmllcyhvbGRTdGF0ZSkpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0J3QvtCy0L7QtSDRgdC+0YHRgtC+0Y/QvdC40LU6JywgT2JqZWN0LmZyb21FbnRyaWVzKHRoaXMuYWN0aW9uc1N0YXRlcykpO1xuICAgICAgICBjb25zdCBjYXJ0TG9hZGVkID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoWy4uLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC50NzA2X19wcm9kdWN0LXRpdGxlYCldLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIDIwMCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dCgoKSA9PiByZXNvbHZlKGZhbHNlKSwgMzAwMCkpXG4gICAgICAgIF0pO1xuICAgICAgICBpZiAoIWNhcnRMb2FkZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFthcHBseUFjdGlvbnNdINCa0L7RgNC30LjQvdCwINC90LUg0LfQsNCz0YDRg9C30LjQu9Cw0YHRjCDQt9CwIDMg0YHQtdC60YPQvdC00YssINC/0YDQvtC00L7Qu9C20LDQtdC8Jyk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCBba2V5LCBzdGF0ZV0gb2YgdGhpcy5hY3Rpb25zU3RhdGVzKSB7XG4gICAgICAgICAgICBjb25zdCBvbGRWYWx1ZSA9IG9sZFN0YXRlLmdldChrZXkpPy52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IG9sZEFjdGlvbiA9IG9sZFN0YXRlLmdldChrZXkpPy5hY3Rpb247XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW2FwcGx5QWN0aW9uc10g0J7QsdGA0LDQsdC+0YLQutCwINC/0L7Qu9GPIFwiJHtrZXl9XCI6YCwge1xuICAgICAgICAgICAgICAgIG9sZFZhbHVlLFxuICAgICAgICAgICAgICAgIG5ld1ZhbHVlOiBzdGF0ZS52YWx1ZSxcbiAgICAgICAgICAgICAgICBvbGRBY3Rpb246IG9sZEFjdGlvbj8udmFsdWUsXG4gICAgICAgICAgICAgICAgbmV3QWN0aW9uOiBzdGF0ZS5hY3Rpb24/LnZhbHVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChzdGF0ZS52YWx1ZSAhPT0gb2xkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAob2xkQWN0aW9uICYmIG9sZEFjdGlvbi52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0KPQtNCw0LvRj9C10Lwg0YHRgtCw0YDRi9C5INGC0L7QstCw0YA6Jywgb2xkQWN0aW9uLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5yZW1vdmVQcm9kdWN0RnJvbUNhcnQob2xkQWN0aW9uLnZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlLnZhbHVlICYmIHN0YXRlLmFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0SWQgPSBgcnVsZV8ke2tleX1fJHtEYXRlLm5vdygpfWA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RRdWFudGl0eSA9IHRoaXMuY2FsY3VsYXRlUnVsZVByb2R1Y3RRdWFudGl0eShzdGF0ZS5hY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0JTQvtCx0LDQstC70Y/QtdC8INC90L7QstGL0Lkg0YLQvtCy0LDRgDonLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogcHJvZHVjdElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogc3RhdGUuYWN0aW9uLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJpY2U6IHN0YXRlLmFjdGlvbi5zdW0gfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXR5OiBwcm9kdWN0UXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWFudGl0eVR5cGU6IHN0YXRlLmFjdGlvbi5xdWFudGl0eVR5cGUgfHwgJ2ZpeGVkJ1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LnRjYXJ0X19hZGRQcm9kdWN0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBwcm9kdWN0SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmljZTogc3RhdGUuYWN0aW9uLnN1bSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgcXVhbnRpdHk6IHByb2R1Y3RRdWFudGl0eSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoYW5nZVByb2R1Y3QgPSBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoYW5nZVByb2R1Y3QgPSBbLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLnQ3MDZfX3Byb2R1Y3QtdGl0bGVgKV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQoKGUpID0+IGUuaW5uZXJUZXh0LnRyaW0oKSA9PT0gc3RhdGUuYWN0aW9uLnZhbHVlLnRyaW0oKSk/LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShjaGFuZ2VQcm9kdWN0IHx8IHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCAzMDApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYW5nZVByb2R1Y3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoYW5nZVByb2R1Y3RCdXR0b24gPSBjaGFuZ2VQcm9kdWN0LnF1ZXJ5U2VsZWN0b3IoYC50NzA2X19wcm9kdWN0LXBsdXNtaW51c2ApO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoYW5nZVByb2R1Y3RCdXR0b24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VQcm9kdWN0QnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdIOKckyDQodC60YDRi9GC0Ysg0LrQvdC+0L/QutC4INC60L7Qu9C40YfQtdGB0YLQstCwJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIXN0YXRlLnZhbHVlIHx8ICFzdGF0ZS5hY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdINCX0L3QsNGH0LXQvdC40LUg0YHQsdGA0L7RiNC10L3Qviwg0YLQvtCy0LDRgCDRg9C00LDQu9C10L0nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdIOKckyDQn9GA0LjQvNC10L3QtdC90LjQtSDQtNC10LnRgdGC0LLQuNC5INC30LDQstC10YDRiNC10L3QvicpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IEVkaXRvclN0b3JhZ2VNYW5hZ2VyIH0gZnJvbSAnLi4vbWFuYWdlcnMvRWRpdG9yU3RvcmFnZU1hbmFnZXInO1xuaW1wb3J0IHsgTGF5b3V0IH0gZnJvbSAnLi4vbW9kZWxzL0xheW91dCc7XG5pbXBvcnQgeyBnZXRMYXN0Q2hpbGQgfSBmcm9tICcuLi91dGlscy90aWxkYVV0aWxzJztcbmltcG9ydCB7IFR5cGVkRXZlbnRFbWl0dGVyIH0gZnJvbSAnLi4vdXRpbHMvVHlwZWRFdmVudEVtaXR0ZXInO1xuaW1wb3J0IHsgZ2VuZXJhdGVJbWFnZSwgY3JlYXRlUHJvZHVjdCB9IGZyb20gJy4uL3V0aWxzL2FwaSc7XG5jb25zdCBDT05TVEFOVFMgPSB7XG4gICAgU1RBVEVfRVhQSVJBVElPTl9EQVlTOiAzMCxcbiAgICBDQU5WQVNfQVJFQV9IRUlHSFQ6IDYwMCxcbiAgICBMT0FESU5HX0lOVEVSVkFMX01TOiAxMDAsXG59O1xuY29uc3QgQVBJX0VORFBPSU5UUyA9IHtcbiAgICBXRUJIT09LX0NBUlQ6ICdodHRwczovL3ByaW1hcnktcHJvZHVjdGlvbi02NTRjLnVwLnJhaWx3YXkuYXBwL3dlYmhvb2svY2FydCcsXG4gICAgVVBMT0FEX0lNQUdFOiAnaHR0cHM6Ly9wcmV2aWV3LXNlcnZpY2UtcHJvZHVjdGlvbi1mZDIwLnVwLnJhaWx3YXkuYXBwL3VwbG9hZCcsXG4gICAgV0VCSE9PS19SRVFVRVNUOiAnaHR0cHM6Ly9wcmltYXJ5LXByb2R1Y3Rpb24tNjU0Yy51cC5yYWlsd2F5LmFwcC93ZWJob29rL3JlcXVlc3QnLFxufTtcbmV4cG9ydCB2YXIgRWRpdG9yRXZlbnRUeXBlO1xuKGZ1bmN0aW9uIChFZGl0b3JFdmVudFR5cGUpIHtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJNT0NLVVBfTE9BRElOR1wiXSA9IFwibW9ja3VwLWxvYWRpbmdcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJNT0NLVVBfVVBEQVRFRFwiXSA9IFwibW9ja3VwLXVwZGF0ZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJMT0FESU5HX1RJTUVfVVBEQVRFRFwiXSA9IFwibG9hZGluZy10aW1lLXVwZGF0ZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJTVEFURV9DSEFOR0VEXCJdID0gXCJzdGF0ZS1jaGFuZ2VkXCI7XG4gICAgRWRpdG9yRXZlbnRUeXBlW1wiTEFZT1VUX0FEREVEXCJdID0gXCJsYXlvdXQtYWRkZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJMQVlPVVRfUkVNT1ZFRFwiXSA9IFwibGF5b3V0LXJlbW92ZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJMQVlPVVRfVVBEQVRFRFwiXSA9IFwibGF5b3V0LXVwZGF0ZWRcIjtcbn0pKEVkaXRvckV2ZW50VHlwZSB8fCAoRWRpdG9yRXZlbnRUeXBlID0ge30pKTtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEVkaXRvciB7XG4gICAgZ2V0IHNlbGVjdFR5cGUoKSB7IHJldHVybiB0aGlzLl9zZWxlY3RUeXBlOyB9XG4gICAgZ2V0IHNlbGVjdENvbG9yKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0Q29sb3I7IH1cbiAgICBnZXQgc2VsZWN0U2lkZSgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdFNpZGU7IH1cbiAgICBnZXQgc2VsZWN0U2l6ZSgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdFNpemU7IH1cbiAgICBnZXQgc2VsZWN0TGF5b3V0KCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0TGF5b3V0OyB9XG4gICAgY29uc3RydWN0b3IoeyBibG9ja3MsIHByb2R1Y3RDb25maWdzLCBmb3JtQ29uZmlnIH0pIHtcbiAgICAgICAgdGhpcy5xdWFudGl0eUZvcm1CbG9jayA9IG51bGw7XG4gICAgICAgIHRoaXMuZm9ybUJsb2NrID0gbnVsbDtcbiAgICAgICAgdGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWUgPSBudWxsO1xuICAgICAgICB0aGlzLmZvcm1CdXR0b24gPSBudWxsO1xuICAgICAgICB0aGlzLl9zZWxlY3RMYXlvdXQgPSBudWxsO1xuICAgICAgICB0aGlzLmxheW91dHMgPSBbXTtcbiAgICAgICAgdGhpcy5jYW52YXNlcyA9IFtdO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzID0gW107XG4gICAgICAgIHRoaXMuYWN0aXZlQ2FudmFzID0gbnVsbDtcbiAgICAgICAgdGhpcy5ldmVudHMgPSBuZXcgVHlwZWRFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgdGhpcy5sYXllcnNIaXN0b3J5ID0gW107XG4gICAgICAgIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA9IC0xO1xuICAgICAgICB0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc0xvYWRpbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLmlzQWRkaW5nVG9DYXJ0ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNHZW5lcmF0aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMubG9hZGluZ1RpbWUgPSAwO1xuICAgICAgICB0aGlzLmxvYWRpbmdJbnRlcnZhbCA9IG51bGw7XG4gICAgICAgIHRoaXMuY29sb3JCbG9ja3MgPSBbXTtcbiAgICAgICAgdGhpcy5zaXplQmxvY2tzID0gW107XG4gICAgICAgIHRoaXMucHJvZHVjdEJsb2NrcyA9IFtdO1xuICAgICAgICB0aGlzLmxvYWRlZFVzZXJJbWFnZSA9IG51bGw7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmltYWdlQ2FjaGUgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMubG9hZGluZ0VsZW1lbnRzQ2FjaGUgPSB7fTtcbiAgICAgICAgdGhpcy5wcm9kdWN0Q2FjaGUgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMubW9ja3VwQ2FjaGUgPSBuZXcgTWFwKCk7XG4gICAgICAgIGlmICghcHJvZHVjdENvbmZpZ3MgfHwgcHJvZHVjdENvbmZpZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tFZGl0b3JdINCd0LUg0L/RgNC10LTQvtGB0YLQsNCy0LvQtdC90Ysg0LrQvtC90YTQuNCz0YPRgNCw0YbQuNC4INC/0YDQvtC00YPQutGC0L7QsicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RvcmFnZU1hbmFnZXIgPSBuZXcgRWRpdG9yU3RvcmFnZU1hbmFnZXIoKTtcbiAgICAgICAgdGhpcy5wcm9kdWN0Q29uZmlncyA9IHByb2R1Y3RDb25maWdzO1xuICAgICAgICB0aGlzLmVkaXRvckJsb2NrID0gdGhpcy5nZXRSZXF1aXJlZEVsZW1lbnQoYmxvY2tzLmVkaXRvckJsb2NrQ2xhc3MpO1xuICAgICAgICB0aGlzLmNoYW5nZVNpZGVCdXR0b24gPSB0aGlzLmdldFJlcXVpcmVkRWxlbWVudChibG9ja3MuY2hhbmdlU2lkZUJ1dHRvbkNsYXNzKTtcbiAgICAgICAgdGhpcy5lZGl0b3JIaXN0b3J5VW5kb0Jsb2NrID0gdGhpcy5nZXRSZXF1aXJlZEVsZW1lbnQoYmxvY2tzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2tDbGFzcyk7XG4gICAgICAgIHRoaXMuZWRpdG9ySGlzdG9yeVJlZG9CbG9jayA9IHRoaXMuZ2V0UmVxdWlyZWRFbGVtZW50KGJsb2Nrcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrQ2xhc3MpO1xuICAgICAgICB0aGlzLnF1YW50aXR5Rm9ybUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yUXVhbnRpdHlGb3JtQmxvY2tDbGFzcyk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3RMaXN0QmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5wcm9kdWN0TGlzdEJsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAocHJvZHVjdExpc3RCbG9jaylcbiAgICAgICAgICAgIHRoaXMucHJvZHVjdExpc3RCbG9jayA9IHByb2R1Y3RMaXN0QmxvY2s7XG4gICAgICAgIGNvbnN0IHByb2R1Y3RJdGVtQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5wcm9kdWN0SXRlbUNsYXNzKTtcbiAgICAgICAgaWYgKHByb2R1Y3RJdGVtQmxvY2spXG4gICAgICAgICAgICB0aGlzLnByb2R1Y3RJdGVtQmxvY2sgPSBwcm9kdWN0SXRlbUJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JDb2xvcnNMaXN0QmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JDb2xvcnNMaXN0QmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JDb2xvcnNMaXN0QmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvckNvbG9yc0xpc3RCbG9jayA9IGVkaXRvckNvbG9yc0xpc3RCbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yQ29sb3JJdGVtQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JDb2xvckl0ZW1CbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvckNvbG9ySXRlbUJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JDb2xvckl0ZW1CbG9jayA9IGVkaXRvckNvbG9ySXRlbUJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JTaXplc0xpc3RCbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclNpemVzTGlzdEJsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yU2l6ZXNMaXN0QmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvclNpemVzTGlzdEJsb2NrID0gZWRpdG9yU2l6ZXNMaXN0QmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvclNpemVJdGVtQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JTaXplSXRlbUJsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yU2l6ZUl0ZW1CbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yU2l6ZUl0ZW1CbG9jayA9IGVkaXRvclNpemVJdGVtQmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvckxheW91dHNMaXN0QmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JMYXlvdXRzTGlzdEJsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yTGF5b3V0c0xpc3RCbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jayA9IGVkaXRvckxheW91dHNMaXN0QmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvckxheW91dEl0ZW1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvckxheW91dEl0ZW1CbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvckxheW91dEl0ZW1CbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrID0gZWRpdG9yTGF5b3V0SXRlbUJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclVwbG9hZEltYWdlQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b24pXG4gICAgICAgICAgICB0aGlzLmVkaXRvclVwbG9hZEltYWdlQnV0dG9uID0gZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvclVwbG9hZFZpZXdCbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclVwbG9hZFZpZXdCbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclVwbG9hZFZpZXdCbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkVmlld0Jsb2NrID0gZWRpdG9yVXBsb2FkVmlld0Jsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JVcGxvYWRDYW5jZWxCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JVcGxvYWRDYW5jZWxCdXR0b25DbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JVcGxvYWRDYW5jZWxCdXR0b24pXG4gICAgICAgICAgICB0aGlzLmVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbiA9IGVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbjtcbiAgICAgICAgY29uc3QgZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvckxvYWRXaXRoQWlCdXR0b25DbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JMb2FkV2l0aEFpQnV0dG9uKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uID0gZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbjtcbiAgICAgICAgY29uc3QgZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b25DbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uID0gZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbjtcbiAgICAgICAgY29uc3QgZWRpdG9yQWRkT3JkZXJCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JBZGRPcmRlckJ1dHRvbkNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvckFkZE9yZGVyQnV0dG9uKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbiA9IGVkaXRvckFkZE9yZGVyQnV0dG9uO1xuICAgICAgICBjb25zdCBlZGl0b3JTdW1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclN1bUJsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yU3VtQmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvclN1bUJsb2NrID0gZWRpdG9yU3VtQmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvclByb2R1Y3ROYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yUHJvZHVjdE5hbWVDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JQcm9kdWN0TmFtZSlcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yUHJvZHVjdE5hbWUgPSBlZGl0b3JQcm9kdWN0TmFtZTtcbiAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tWaWV3Q2xhc3MgPSBibG9ja3MuZWRpdG9yTGF5b3V0SXRlbUJsb2NrVmlld0NsYXNzO1xuICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja05hbWVDbGFzcyA9IGJsb2Nrcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tOYW1lQ2xhc3M7XG4gICAgICAgIHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrUmVtb3ZlQ2xhc3MgPSBibG9ja3MuZWRpdG9yTGF5b3V0SXRlbUJsb2NrUmVtb3ZlQ2xhc3M7XG4gICAgICAgIHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrRWRpdENsYXNzID0gYmxvY2tzLmVkaXRvckxheW91dEl0ZW1CbG9ja0VkaXRDbGFzcztcbiAgICAgICAgaWYgKGZvcm1Db25maWcpIHtcbiAgICAgICAgICAgIHRoaXMuZm9ybUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihmb3JtQ29uZmlnLmZvcm1CbG9ja0NsYXNzKTtcbiAgICAgICAgICAgIHRoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lID0gZm9ybUNvbmZpZy5mb3JtSW5wdXRWYXJpYWJsZU5hbWU7XG4gICAgICAgICAgICB0aGlzLmZvcm1CdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGZvcm1Db25maWcuZm9ybUJ1dHRvbkNsYXNzKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkZWZhdWx0UHJvZHVjdCA9IHByb2R1Y3RDb25maWdzWzBdO1xuICAgICAgICBpZiAoIWRlZmF1bHRQcm9kdWN0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tFZGl0b3JdINCd0LUg0L3QsNC50LTQtdC9INC00LXRhNC+0LvRgtC90YvQuSDQv9GA0L7QtNGD0LrRgicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlZmF1bHRNb2NrdXAgPSBkZWZhdWx0UHJvZHVjdC5tb2NrdXBzWzBdO1xuICAgICAgICBpZiAoIWRlZmF1bHRNb2NrdXApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW0VkaXRvcl0g0J3QtSDQvdCw0LnQtNC10L0g0LTQtdGE0L7Qu9GC0L3Ri9C5IG1vY2t1cCcpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gZGVmYXVsdE1vY2t1cC5jb2xvcjtcbiAgICAgICAgdGhpcy5fc2VsZWN0U2lkZSA9IGRlZmF1bHRNb2NrdXAuc2lkZTtcbiAgICAgICAgdGhpcy5fc2VsZWN0VHlwZSA9IGRlZmF1bHRQcm9kdWN0LnR5cGU7XG4gICAgICAgIHRoaXMuX3NlbGVjdFNpemUgPSBkZWZhdWx0UHJvZHVjdC5zaXplcz8uWzBdIHx8ICdNJztcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jay5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgICAgIHRoaXMuY3JlYXRlQmFja2dyb3VuZEJsb2NrKCk7XG4gICAgICAgIHRoaXMubW9ja3VwQmxvY2sgPSB0aGlzLmNyZWF0ZU1vY2t1cEJsb2NrKCk7XG4gICAgICAgIHRoaXMuY2FudmFzZXNDb250YWluZXIgPSB0aGlzLmNyZWF0ZUNhbnZhc2VzQ29udGFpbmVyKCk7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZGluZ0Jsb2NrID0gdGhpcy5jcmVhdGVFZGl0b3JMb2FkaW5nQmxvY2soKTtcbiAgICAgICAgdGhpcy5pbml0RXZlbnRzKCk7XG4gICAgICAgIHRoaXMuaW5pdEtleWJvYXJkU2hvcnRjdXRzKCk7XG4gICAgICAgIHRoaXMuaW5pdExvYWRpbmdFdmVudHMoKTtcbiAgICAgICAgdGhpcy5pbml0VUlDb21wb25lbnRzKCk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZUVkaXRvcigpO1xuICAgICAgICB3aW5kb3cuZ2V0TGF5b3V0cyA9ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxheW91dHMubWFwKGxheW91dCA9PiAoeyAuLi5sYXlvdXQsIHVybDogdW5kZWZpbmVkIH0pKTtcbiAgICAgICAgfTtcbiAgICAgICAgd2luZG93LmxvYWRMYXlvdXRzID0gKGxheW91dHMpID0+IHtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0cyA9IGxheW91dHMubWFwKGxheW91dCA9PiBMYXlvdXQuZnJvbUpTT04obGF5b3V0KSk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgfTtcbiAgICAgICAgd2luZG93LmV4cG9ydFByaW50ID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZXhwb3J0ZWRBcnQgPSBhd2FpdCB0aGlzLmV4cG9ydEFydChmYWxzZSwgNDA5Nik7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHNpZGUgb2YgT2JqZWN0LmtleXMoZXhwb3J0ZWRBcnQpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZG93bmxvYWRMaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZG93bmxvYWRMaW5rKTtcbiAgICAgICAgICAgICAgICBkb3dubG9hZExpbmsuaHJlZiA9IGV4cG9ydGVkQXJ0W3NpZGVdO1xuICAgICAgICAgICAgICAgIGRvd25sb2FkTGluay50YXJnZXQgPSAnX3NlbGYnO1xuICAgICAgICAgICAgICAgIGRvd25sb2FkTGluay5kb3dubG9hZCA9IGAke3NpZGV9LnBuZ2A7XG4gICAgICAgICAgICAgICAgZG93bmxvYWRMaW5rLmNsaWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZXhwb3J0ZWRBcnQ7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGluaXRVSUNvbXBvbmVudHMoKSB7XG4gICAgICAgIGlmICh0aGlzLmNoYW5nZVNpZGVCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlU2lkZUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICB0aGlzLmNoYW5nZVNpZGVCdXR0b24ub25jbGljayA9ICgpID0+IHRoaXMuY2hhbmdlU2lkZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEhpc3RvcnlVbmRvQmxvY2soKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRIaXN0b3J5UmVkb0Jsb2NrKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucHJvZHVjdExpc3RCbG9jayAmJiB0aGlzLnByb2R1Y3RJdGVtQmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdFByb2R1Y3RMaXN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEFkZE9yZGVyQnV0dG9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdFVwbG9hZEltYWdlQnV0dG9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZm9ybUJsb2NrICYmIHRoaXMuZm9ybUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5pbml0Rm9ybSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnF1YW50aXR5Rm9ybUJsb2NrKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuaW5pdEZpeFF1YW50aXR5Rm9ybSgpLCA1MDApO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRSZXF1aXJlZEVsZW1lbnQoc2VsZWN0b3IpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgW0VkaXRvcl0g0J3QtSDQvdCw0LnQtNC10L0g0L7QsdGP0LfQsNGC0LXQu9GM0L3Ri9C5INGN0LvQtdC80LXQvdGCOiAke3NlbGVjdG9yfWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbiAgICBhc3luYyBpbml0aWFsaXplRWRpdG9yKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZFN0YXRlKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnByZWxvYWRBbGxNb2NrdXBzKCk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZWRpdG9yXSDQmNC90LjRhtC40LDQu9C40LfQsNGG0LjRjyDQt9Cw0LLQtdGA0YjQtdC90LAnKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tlZGl0b3JdINCe0YjQuNCx0LrQsCDQuNC90LjRhtC40LDQu9C40LfQsNGG0LjQuDonLCBlcnJvcik7XG4gICAgICAgICAgICB0aGlzLmluaXRpYWxpemVXaXRoRGVmYXVsdHMoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBpbml0aWFsaXplV2l0aERlZmF1bHRzKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZWRpdG9yXSDQmNC90LjRhtC40LDQu9C40LfQsNGG0LjRjyDRgSDQtNC10YTQvtC70YLQvdGL0LzQuCDQt9C90LDRh9C10L3QuNGP0LzQuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbZWRpdG9yXSDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCBtb2NrdXAg0L/QviDRg9C80L7Qu9GH0LDQvdC40Y46JywgZXJyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0RXZlbnRzKCkge1xuICAgICAgICB3aW5kb3cub25iZWZvcmV1bmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYWxlcnQoXCLQktGLINGD0LLQtdGA0LXQvdGLLCDRh9GC0L4g0YXQvtGC0LjRgtC1INC/0L7QutC40L3Rg9GC0Ywg0Y3RgtGDINGB0YLRgNCw0L3QuNGG0YM/XCIpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmV2ZW50cy5vbihFZGl0b3JFdmVudFR5cGUuTU9DS1VQX1VQREFURUQsIChkYXRhVVJMKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vY2t1cEJsb2NrLnNyYyA9IGRhdGFVUkw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpbml0TG9hZGluZ0V2ZW50cygpIHtcbiAgICAgICAgdGhpcy5sb2FkaW5nRWxlbWVudHNDYWNoZS5sb2FkaW5nVGV4dCA9IHRoaXMuZWRpdG9yTG9hZGluZ0Jsb2NrLnF1ZXJ5U2VsZWN0b3IoJyNsb2FkaW5nLXRleHQnKTtcbiAgICAgICAgdGhpcy5sb2FkaW5nRWxlbWVudHNDYWNoZS5zcGlubmVyID0gdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2sucXVlcnlTZWxlY3RvcignI3NwaW5uZXInKTtcbiAgICAgICAgdGhpcy5ldmVudHMub24oRWRpdG9yRXZlbnRUeXBlLkxPQURJTkdfVElNRV9VUERBVEVELCAobG9hZGluZ1RpbWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHsgbG9hZGluZ1RleHQsIHNwaW5uZXIgfSA9IHRoaXMubG9hZGluZ0VsZW1lbnRzQ2FjaGU7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0xvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb2FkaW5nVGltZSA+IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuaW5uZXJUZXh0ID0gYCR7KHRoaXMubG9hZGluZ1RpbWUgLyAxMCkudG9GaXhlZCgxKX1gO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzcGlubmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNzQ1KVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzcGlubmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRpbmdCbG9jay5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMClcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGluZ1RleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZXZlbnRzLm9uKEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgKGlzTG9hZGluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBsb2FkaW5nVGV4dCwgc3Bpbm5lciB9ID0gdGhpcy5sb2FkaW5nRWxlbWVudHNDYWNoZTtcbiAgICAgICAgICAgIGlmIChpc0xvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb2FkaW5nSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmxvYWRpbmdJbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZ1RpbWUgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbbW9ja3VwXSBsb2FkaW5nIG1vY2t1cCcpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZ0ludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmdUaW1lKys7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTE9BRElOR19USU1FX1VQREFURUQsIHRoaXMubG9hZGluZ1RpbWUpO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRpbmdCbG9jay5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMClcIjtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGluZ1RleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3Bpbm5lcikge1xuICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb2FkaW5nSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmxvYWRpbmdJbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZ0ludGVydmFsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nVGltZSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbWl0KHR5cGUsIGRldGFpbCkge1xuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KHR5cGUsIGRldGFpbCk7XG4gICAgfVxuICAgIGluaXRLZXlib2FyZFNob3J0Y3V0cygpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlRWxlbWVudCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCBpc0lucHV0RmllbGQgPSBhY3RpdmVFbGVtZW50ICYmIChhY3RpdmVFbGVtZW50LnRhZ05hbWUgPT09ICdJTlBVVCcgfHxcbiAgICAgICAgICAgICAgICBhY3RpdmVFbGVtZW50LnRhZ05hbWUgPT09ICdURVhUQVJFQScgfHxcbiAgICAgICAgICAgICAgICBhY3RpdmVFbGVtZW50LmNvbnRlbnRFZGl0YWJsZSA9PT0gJ3RydWUnIHx8XG4gICAgICAgICAgICAgICAgYWN0aXZlRWxlbWVudC5pc0NvbnRlbnRFZGl0YWJsZSk7XG4gICAgICAgICAgICBpZiAoaXNJbnB1dEZpZWxkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGlmIChldmVudC5jdHJsS2V5ICYmIGV2ZW50LmNvZGUgPT09ICdLZXlaJyAmJiAhZXZlbnQuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudW5kbygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgoZXZlbnQuY3RybEtleSAmJiBldmVudC5zaGlmdEtleSAmJiBldmVudC5jb2RlID09PSAnS2V5WicpIHx8XG4gICAgICAgICAgICAgICAgKGV2ZW50LmN0cmxLZXkgJiYgZXZlbnQuY29kZSA9PT0gJ0tleVknICYmICFldmVudC5zaGlmdEtleSkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVkbygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNyZWF0ZUJhY2tncm91bmRCbG9jaygpIHtcbiAgICAgICAgY29uc3QgYmFja2dyb3VuZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBiYWNrZ3JvdW5kLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1wb3NpdGlvbicpO1xuICAgICAgICBiYWNrZ3JvdW5kLmlkID0gJ2VkaXRvci1iYWNrZ3JvdW5kJztcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jay5hcHBlbmRDaGlsZChiYWNrZ3JvdW5kKTtcbiAgICAgICAgcmV0dXJuIGJhY2tncm91bmQ7XG4gICAgfVxuICAgIGNyZWF0ZU1vY2t1cEJsb2NrKCkge1xuICAgICAgICBjb25zdCBtb2NrdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgICAgICAgbW9ja3VwLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1wb3NpdGlvbicpO1xuICAgICAgICBtb2NrdXAuaWQgPSAnZWRpdG9yLW1vY2t1cCc7XG4gICAgICAgIHRoaXMuZWRpdG9yQmxvY2suYXBwZW5kQ2hpbGQobW9ja3VwKTtcbiAgICAgICAgcmV0dXJuIG1vY2t1cDtcbiAgICB9XG4gICAgY3JlYXRlQ2FudmFzZXNDb250YWluZXIoKSB7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBjYW52YXMuY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXBvc2l0aW9uJyk7XG4gICAgICAgIGNhbnZhcy5pZCA9ICdlZGl0b3ItY2FudmFzZXMtY29udGFpbmVyJztcbiAgICAgICAgY2FudmFzLnN0eWxlLnpJbmRleCA9ICcxMCc7XG4gICAgICAgIGNhbnZhcy5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICB0aGlzLmVkaXRvckJsb2NrLmFwcGVuZENoaWxkKGNhbnZhcyk7XG4gICAgICAgIHJldHVybiBjYW52YXM7XG4gICAgfVxuICAgIGNyZWF0ZUVkaXRvckxvYWRpbmdCbG9jaygpIHtcbiAgICAgICAgY29uc3QgZWRpdG9yTG9hZGluZ0Jsb2NrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5zdHlsZS5kaXNwbGF5ID0gXCJmbGV4XCI7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItcG9zaXRpb24nKTtcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLmlkID0gJ2VkaXRvci1sb2FkaW5nJztcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLnN0eWxlLnpJbmRleCA9IFwiMTAwMFwiO1xuICAgICAgICBlZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUucG9pbnRlckV2ZW50cyA9IFwibm9uZVwiO1xuICAgICAgICBjb25zdCBsb2FkaW5nVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBsb2FkaW5nVGV4dC5pZCA9ICdsb2FkaW5nLXRleHQnO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLnRleHRBbGlnbiA9IFwiY2VudGVyXCI7XG4gICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS50b3AgPSBcIjUwJVwiO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5sZWZ0ID0gXCI1MCVcIjtcbiAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoLTUwJSwgLTUwJSlcIjtcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLmFwcGVuZENoaWxkKGxvYWRpbmdUZXh0KTtcbiAgICAgICAgY29uc3Qgc3Bpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBzcGlubmVyLmlkID0gJ3NwaW5uZXInO1xuICAgICAgICBzcGlubmVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLmFwcGVuZENoaWxkKHNwaW5uZXIpO1xuICAgICAgICB0aGlzLmVkaXRvckJsb2NrLmFwcGVuZENoaWxkKGVkaXRvckxvYWRpbmdCbG9jayk7XG4gICAgICAgIHJldHVybiBlZGl0b3JMb2FkaW5nQmxvY2s7XG4gICAgfVxuICAgIGFzeW5jIHVwZGF0ZU1vY2t1cCgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW21vY2t1cF0gdXBkYXRlIGZvciAke3RoaXMuX3NlbGVjdFR5cGV9ICR7dGhpcy5fc2VsZWN0U2lkZX0gJHt0aGlzLl9zZWxlY3RDb2xvci5uYW1lfWApO1xuICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCB0cnVlKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG1vY2t1cEltYWdlVXJsID0gdGhpcy5maW5kTW9ja3VwVXJsKCk7XG4gICAgICAgICAgICBpZiAoIW1vY2t1cEltYWdlVXJsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbbW9ja3VwXSDQndC1INC90LDQudC00LXQvSBtb2NrdXAg0LTQu9GPINGC0LXQutGD0YnQuNGFINC/0LDRgNCw0LzQtdGC0YDQvtCyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkYXRhVVJMID0gYXdhaXQgdGhpcy5sb2FkQW5kQ29udmVydEltYWdlKG1vY2t1cEltYWdlVXJsKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX1VQREFURUQsIGRhdGFVUkwpO1xuICAgICAgICAgICAgdGhpcy5tb2NrdXBCbG9jay5zcmMgPSBkYXRhVVJMO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW21vY2t1cF0gTW9ja3VwINGD0YHQv9C10YjQvdC+INC+0LHQvdC+0LLQu9C10L0nKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1ttb2NrdXBdINCe0YjQuNCx0LrQsCDQvtCx0L3QvtCy0LvQtdC90LjRjyBtb2NrdXA6JywgZXJyb3IpO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZmluZE1vY2t1cFVybCgpIHtcbiAgICAgICAgY29uc3QgY2FjaGVLZXkgPSBgJHt0aGlzLl9zZWxlY3RUeXBlfS0ke3RoaXMuX3NlbGVjdFNpZGV9LSR7dGhpcy5fc2VsZWN0Q29sb3IubmFtZX1gO1xuICAgICAgICBpZiAodGhpcy5tb2NrdXBDYWNoZS5oYXMoY2FjaGVLZXkpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tb2NrdXBDYWNoZS5nZXQoY2FjaGVLZXkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdCkge1xuICAgICAgICAgICAgdGhpcy5tb2NrdXBDYWNoZS5zZXQoY2FjaGVLZXksIG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbW9ja3VwID0gcHJvZHVjdC5tb2NrdXBzLmZpbmQobSA9PiBtLnNpZGUgPT09IHRoaXMuX3NlbGVjdFNpZGUgJiYgbS5jb2xvci5uYW1lID09PSB0aGlzLl9zZWxlY3RDb2xvci5uYW1lKTtcbiAgICAgICAgY29uc3QgdXJsID0gbW9ja3VwPy51cmwgfHwgbnVsbDtcbiAgICAgICAgdGhpcy5tb2NrdXBDYWNoZS5zZXQoY2FjaGVLZXksIHVybCk7XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxuICAgIGdldFByb2R1Y3RCeVR5cGUodHlwZSkge1xuICAgICAgICBpZiAoIXRoaXMucHJvZHVjdENhY2hlLmhhcyh0eXBlKSkge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMucHJvZHVjdENvbmZpZ3MuZmluZChwID0+IHAudHlwZSA9PT0gdHlwZSk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdCkge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvZHVjdENhY2hlLnNldCh0eXBlLCBwcm9kdWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5wcm9kdWN0Q2FjaGUuZ2V0KHR5cGUpO1xuICAgIH1cbiAgICBjbGVhck1vY2t1cENhY2hlKCkge1xuICAgICAgICB0aGlzLm1vY2t1cENhY2hlLmNsZWFyKCk7XG4gICAgfVxuICAgIGFzeW5jIGxvYWRBbmRDb252ZXJ0SW1hZ2UoaW1hZ2VVcmwpIHtcbiAgICAgICAgaWYgKHRoaXMuaW1hZ2VDYWNoZS5oYXMoaW1hZ2VVcmwpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbY2FjaGVdINCY0LfQvtCx0YDQsNC20LXQvdC40LUg0LfQsNCz0YDRg9C20LXQvdC+INC40Lcg0LrRjdGI0LA6JywgaW1hZ2VVcmwpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW1hZ2VDYWNoZS5nZXQoaW1hZ2VVcmwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgaW1hZ2Uuc2V0QXR0cmlidXRlKCdjcm9zc09yaWdpbicsICdhbm9ueW1vdXMnKTtcbiAgICAgICAgICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gaW1hZ2Uud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWN0eCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcign0J3QtSDRg9C00LDQu9C+0YHRjCDQv9C+0LvRg9GH0LjRgtGMINC60L7QvdGC0LXQutGB0YIgY2FudmFzJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoaW1hZ2UsIDAsIDApO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhVVJMID0gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VDYWNoZS5zZXQoaW1hZ2VVcmwsIGRhdGFVUkwpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbY2FjaGVdINCY0LfQvtCx0YDQsNC20LXQvdC40LUg0YHQvtGF0YDQsNC90LXQvdC+INCyINC60Y3RiDonLCBpbWFnZVVybCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YVVSTCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbWFnZS5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYNCe0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4INC40LfQvtCx0YDQsNC20LXQvdC40Y86ICR7aW1hZ2VVcmx9YCkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGltYWdlLnNyYyA9IGltYWdlVXJsO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgc2F2ZVN0YXRlKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbc3RhdGVdINCh0L7RhdGA0LDQvdC10L3QuNC1INGB0L7RgdGC0L7Rj9C90LjRjyDRgNC10LTQsNC60YLQvtGA0LAnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvclN0YXRlID0ge1xuICAgICAgICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICB0eXBlOiB0aGlzLl9zZWxlY3RUeXBlLFxuICAgICAgICAgICAgICAgIGNvbG9yOiB0aGlzLl9zZWxlY3RDb2xvci5uYW1lLFxuICAgICAgICAgICAgICAgIHNpZGU6IHRoaXMuX3NlbGVjdFNpZGUsXG4gICAgICAgICAgICAgICAgc2l6ZTogdGhpcy5fc2VsZWN0U2l6ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtzdGF0ZV0g0KHQvtGF0YDQsNC90Y/QtdC8OiB0eXBlPSR7ZWRpdG9yU3RhdGUudHlwZX0sIGNvbG9yPSR7ZWRpdG9yU3RhdGUuY29sb3J9LCBzaWRlPSR7ZWRpdG9yU3RhdGUuc2lkZX0sIHNpemU9JHtlZGl0b3JTdGF0ZS5zaXplfWApO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci5zYXZlRWRpdG9yU3RhdGUoZWRpdG9yU3RhdGUpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3N0YXRlXSDQodC+0YHRgtC+0Y/QvdC40LUg0YPRgdC/0LXRiNC90L4g0YHQvtGF0YDQsNC90LXQvdC+Jyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbc3RhdGVdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC+0YHRgtC+0Y/QvdC40Y86JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIHNhdmVMYXlvdXRzKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbbGF5ZXJzXSDQodC+0YXRgNCw0L3QtdC90LjQtSDRgdC70L7RkdCyJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLnNhdmVMYXllcnModGhpcy5sYXlvdXRzKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tsYXllcnNdINCh0LvQvtC4INGD0YHQv9C10YjQvdC+INGB0L7RhdGA0LDQvdC10L3RiycpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2xheWVyc10g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPINGB0LvQvtGR0LI6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGxvYWRMYXlvdXRzKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbbGF5ZXJzXSDQl9Cw0LPRgNGD0LfQutCwINGB0LvQvtGR0LInKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNhdmVkTGF5b3V0cyA9IGF3YWl0IHRoaXMuc3RvcmFnZU1hbmFnZXIubG9hZExheWVycygpO1xuICAgICAgICAgICAgaWYgKHNhdmVkTGF5b3V0cyAmJiBBcnJheS5pc0FycmF5KHNhdmVkTGF5b3V0cykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxheW91dHMgPSBzYXZlZExheW91dHMubWFwKChsYXlvdXREYXRhKSA9PiBuZXcgTGF5b3V0KGxheW91dERhdGEpKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbbGF5ZXJzXSDQl9Cw0LPRgNGD0LbQtdC90L4gJHt0aGlzLmxheW91dHMubGVuZ3RofSDRgdC70L7RkdCyYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxheW91dHMgPSBbXTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbbGF5ZXJzXSDQndC10YIg0YHQvtGF0YDQsNC90ZHQvdC90YvRhSDRgdC70L7RkdCyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNhdmVMYXllcnNUb0hpc3RvcnkoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4INGB0LvQvtGR0LI6JywgZXJyb3IpO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gW107XG4gICAgICAgICAgICB0aGlzLnNhdmVMYXllcnNUb0hpc3RvcnkoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBsb2FkU3RhdGUoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tzdGF0ZV0g0JfQsNCz0YDRg9C30LrQsCDRgdC+0YHRgtC+0Y/QvdC40Y8g0YDQtdC00LDQutGC0L7RgNCwJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3JTdGF0ZSA9IGF3YWl0IHRoaXMuc3RvcmFnZU1hbmFnZXIubG9hZEVkaXRvclN0YXRlKCk7XG4gICAgICAgICAgICBpZiAoIWVkaXRvclN0YXRlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3N0YXRlXSDQodC+0YXRgNCw0L3QtdC90L3QvtC1INGB0L7RgdGC0L7Rj9C90LjQtSDQvdC1INC90LDQudC00LXQvdC+Jyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRQcm9kdWN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0Q29sb3JzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdFNpemVzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmlzU3RhdGVFeHBpcmVkKGVkaXRvclN0YXRlLmRhdGUpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbc3RhdGVdINCh0L7RgdGC0L7Rj9C90LjQtSDRg9GB0YLQsNGA0LXQu9C+LCDQvtGH0LjRidCw0LXQvCcpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RvcmFnZU1hbmFnZXIuY2xlYXJFZGl0b3JTdGF0ZSgpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkUHJvZHVjdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdENvbG9yc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRTaXplc0xpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBhcHBsaWVkID0gYXdhaXQgdGhpcy5hcHBseVN0YXRlKGVkaXRvclN0YXRlKTtcbiAgICAgICAgICAgIGlmIChhcHBsaWVkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3N0YXRlXSDQodC+0YHRgtC+0Y/QvdC40LUg0YPRgdC/0LXRiNC90L4g0LfQsNCz0YDRg9C20LXQvdC+Jyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRQcm9kdWN0KCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvZHVjdEJsb2Nrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvZHVjdEJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrLnN0eWxlLmJhY2tncm91bmQgPSAncmdiKDIyMiAyMjIgMjIyKSc7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3RpdmVCbG9jayA9IHRoaXMucHJvZHVjdEJsb2Nrcy5maW5kKGJsb2NrID0+IGJsb2NrLmNsYXNzTGlzdC5jb250YWlucygnZWRpdG9yLXNldHRpbmdzX19wcm9kdWN0LWJsb2NrX18nICsgdGhpcy5fc2VsZWN0VHlwZSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZlQmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZUJsb2NrLnN0eWxlLmJhY2tncm91bmQgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWRMYXlvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0Q29sb3JzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdFNpemVzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbc3RhdGVdINCd0LUg0YPQtNCw0LvQvtGB0Ywg0L/RgNC40LzQtdC90LjRgtGMINGB0L7RhdGA0LDQvdC10L3QvdC+0LUg0YHQvtGB0YLQvtGP0L3QuNC1Jyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRQcm9kdWN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0Q29sb3JzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdFNpemVzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCDRgdC+0YHRgtC+0Y/QvdC40Y86JywgZXJyb3IpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdENvbG9yc0xpc3QoKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdFNpemVzTGlzdCgpO1xuICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlzU3RhdGVFeHBpcmVkKGRhdGVTdHJpbmcpIHtcbiAgICAgICAgY29uc3Qgc3RhdGVEYXRlID0gbmV3IERhdGUoZGF0ZVN0cmluZyk7XG4gICAgICAgIGNvbnN0IGV4cGlyYXRpb25EYXRlID0gRGF0ZS5ub3coKSAtIChDT05TVEFOVFMuU1RBVEVfRVhQSVJBVElPTl9EQVlTICogMjQgKiA2MCAqIDYwICogMTAwMCk7XG4gICAgICAgIHJldHVybiBzdGF0ZURhdGUuZ2V0VGltZSgpIDwgZXhwaXJhdGlvbkRhdGU7XG4gICAgfVxuICAgIGFzeW5jIGFwcGx5U3RhdGUoZWRpdG9yU3RhdGUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICghZWRpdG9yU3RhdGUudHlwZSB8fCAhZWRpdG9yU3RhdGUuY29sb3IgfHwgIWVkaXRvclN0YXRlLnNpZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tzdGF0ZV0g0J3QtdC60L7RgNGA0LXQutGC0L3QvtC1INGB0L7RgdGC0L7Rj9C90LjQtTog0L7RgtGB0YPRgtGB0YLQstGD0Y7RgiDQvtCx0Y/Qt9Cw0YLQtdC70YzQvdGL0LUg0L/QvtC70Y8nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbc3RhdGVdINCS0L7RgdGB0YLQsNC90L7QstC70LXQvdC40LUg0YHQvtGB0YLQvtGP0L3QuNGPOiB0eXBlPSR7ZWRpdG9yU3RhdGUudHlwZX0sIGNvbG9yPSR7ZWRpdG9yU3RhdGUuY29sb3J9LCBzaWRlPSR7ZWRpdG9yU3RhdGUuc2lkZX0sIHNpemU9JHtlZGl0b3JTdGF0ZS5zaXplfWApO1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMucHJvZHVjdENvbmZpZ3MuZmluZChwID0+IHAudHlwZSA9PT0gZWRpdG9yU3RhdGUudHlwZSk7XG4gICAgICAgICAgICBpZiAoIXByb2R1Y3QpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtzdGF0ZV0g0J/RgNC+0LTRg9C60YIg0YLQuNC/0LAgJHtlZGl0b3JTdGF0ZS50eXBlfSDQvdC1INC90LDQudC00LXQvWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG1vY2t1cCA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG0gPT4gbS5jb2xvci5uYW1lID09PSBlZGl0b3JTdGF0ZS5jb2xvcik7XG4gICAgICAgICAgICBpZiAoIW1vY2t1cCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW3N0YXRlXSBNb2NrdXAg0YEg0YbQstC10YLQvtC8ICR7ZWRpdG9yU3RhdGUuY29sb3J9INC90LUg0L3QsNC50LTQtdC9INC00LvRjyDQv9GA0L7QtNGD0LrRgtCwICR7ZWRpdG9yU3RhdGUudHlwZX1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RUeXBlID0gZWRpdG9yU3RhdGUudHlwZTtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gbW9ja3VwLmNvbG9yO1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0U2lkZSA9IGVkaXRvclN0YXRlLnNpZGU7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RTaXplID0gZWRpdG9yU3RhdGUuc2l6ZSB8fCB0aGlzLl9zZWxlY3RTaXplO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3N0YXRlXSDQodC+0YHRgtC+0Y/QvdC40LUg0L/RgNC40LzQtdC90LXQvdC+OiB0eXBlPSR7dGhpcy5fc2VsZWN0VHlwZX0sIGNvbG9yPSR7dGhpcy5fc2VsZWN0Q29sb3IubmFtZX0sIHNpZGU9JHt0aGlzLl9zZWxlY3RTaWRlfSwgc2l6ZT0ke3RoaXMuX3NlbGVjdFNpemV9YCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINC/0YDQuNC80LXQvdC10L3QuNGPINGB0L7RgdGC0L7Rj9C90LjRjzonLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0VHlwZSh0eXBlKSB7XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RUeXBlICE9PSB0eXBlKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RUeXBlID0gdHlwZTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJNb2NrdXBDYWNoZSgpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5TVEFURV9DSEFOR0VELCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y86JywgZXJyKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0Q29sb3IoY29sb3IpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdENvbG9yICE9PSBjb2xvcikge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0Q29sb3IgPSBjb2xvcjtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJNb2NrdXBDYWNoZSgpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5TVEFURV9DSEFOR0VELCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y86JywgZXJyKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0U2lkZShzaWRlKSB7XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RTaWRlICE9PSBzaWRlKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RTaWRlID0gc2lkZTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJNb2NrdXBDYWNoZSgpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5TVEFURV9DSEFOR0VELCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y86JywgZXJyKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0U2l6ZShzaXplKSB7XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RTaXplICE9PSBzaXplKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RTaXplID0gc2l6ZTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuU1RBVEVfQ0hBTkdFRCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPOicsIGVycikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFkZExheW91dChsYXlvdXQpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSkge1xuICAgICAgICAgICAgdGhpcy5sYXlvdXRzLnB1c2gobGF5b3V0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0cy5wdXNoKGxheW91dCk7XG4gICAgICAgICAgICB0aGlzLnNhdmVMYXllcnNUb0hpc3RvcnkoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLkxBWU9VVF9BRERFRCwgbGF5b3V0KTtcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgdGhpcy5zYXZlTGF5b3V0cygpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbbGF5ZXJzXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y8g0YHQu9C+0ZHQsjonLCBlcnIpKTtcbiAgICB9XG4gICAgcmVtb3ZlTGF5b3V0KGxheW91dElkKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5sYXlvdXRzLmZpbmRJbmRleChsID0+IGwuaWQgPT09IGxheW91dElkKTtcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0ID0gdGhpcy5sYXlvdXRzW2luZGV4XTtcbiAgICAgICAgICAgIGlmIChsYXlvdXQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxheW91dHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNhdmVMYXllcnNUb0hpc3RvcnkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5MQVlPVVRfUkVNT1ZFRCwgbGF5b3V0SWQpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZUxheW91dHMoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW2xheWVyc10g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPINGB0LvQvtGR0LI6JywgZXJyKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB1cGRhdGVMYXlvdXQobGF5b3V0SWQsIHVwZGF0ZXMpIHtcbiAgICAgICAgY29uc3QgbGF5b3V0ID0gdGhpcy5sYXlvdXRzLmZpbmQobCA9PiBsLmlkID09PSBsYXlvdXRJZCk7XG4gICAgICAgIGlmIChsYXlvdXQpIHtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24obGF5b3V0LCB1cGRhdGVzKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc1Jlc3RvcmluZ0Zyb21IaXN0b3J5KSB7XG4gICAgICAgICAgICAgICAgaWYgKCd1cmwnIGluIHVwZGF0ZXMgfHwgJ25hbWUnIGluIHVwZGF0ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlTGF5ZXJzVG9IaXN0b3J5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5MQVlPVVRfVVBEQVRFRCwgbGF5b3V0KTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZUxheW91dHMoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW2xheWVyc10g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPINGB0LvQvtGR0LI6JywgZXJyKSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGdldExheW91dChsYXlvdXRJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXRzLmZpbmQobCA9PiBsLmlkID09PSBsYXlvdXRJZCk7XG4gICAgfVxuICAgIGdldExheW91dHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxheW91dHM7XG4gICAgfVxuICAgIGluaXRIaXN0b3J5VW5kb0Jsb2NrKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbaGlzdG9yeSBibG9ja10gaW5pdCB1bmRvJyk7XG4gICAgICAgIHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jay5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgIHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jay5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnkgdW5kbyBibG9ja10gY2xpY2tlZCcpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51bmRvKCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudXBkYXRlSGlzdG9yeUJ1dHRvbnNTdGF0ZSgpO1xuICAgIH1cbiAgICBpbml0SGlzdG9yeVJlZG9CbG9jaygpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnkgcmVkbyBibG9ja10gaW5pdCByZWRvJyk7XG4gICAgICAgIHRoaXMuZWRpdG9ySGlzdG9yeVJlZG9CbG9jay5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgIHRoaXMuZWRpdG9ySGlzdG9yeVJlZG9CbG9jay5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnkgcmVkbyBibG9ja10gY2xpY2tlZCcpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5yZWRvKCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudXBkYXRlSGlzdG9yeUJ1dHRvbnNTdGF0ZSgpO1xuICAgIH1cbiAgICBpbml0UHJvZHVjdExpc3QoKSB7XG4gICAgICAgIGlmICghdGhpcy5wcm9kdWN0TGlzdEJsb2NrIHx8ICF0aGlzLnByb2R1Y3RJdGVtQmxvY2spXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tQcm9kdWN0TGlzdF0gaW5pdCBwcm9kdWN0IGxpc3QnKTtcbiAgICAgICAgdGhpcy5wcm9kdWN0SXRlbUJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMucHJvZHVjdENvbmZpZ3MuZm9yRWFjaChwcm9kdWN0ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RJdGVtID0gdGhpcy5wcm9kdWN0SXRlbUJsb2NrLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIHByb2R1Y3RJdGVtLnN0eWxlLmRpc3BsYXkgPSAndGFibGUnO1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdEltYWdlV3JhcHBlciA9IHByb2R1Y3RJdGVtLnF1ZXJ5U2VsZWN0b3IoJy5wcm9kdWN0LWl0ZW0taW1hZ2UnKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0SW1hZ2VXcmFwcGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdEltYWdlID0gZ2V0TGFzdENoaWxkKHByb2R1Y3RJbWFnZVdyYXBwZXIpO1xuICAgICAgICAgICAgICAgIGlmIChwcm9kdWN0SW1hZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvZHVjdEltYWdlLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IGB1cmwoJHtwcm9kdWN0Lm1vY2t1cHNbMF0/LnVybH0pYDtcbiAgICAgICAgICAgICAgICAgICAgcHJvZHVjdEltYWdlLnN0eWxlLmJhY2tncm91bmRTaXplID0gJ2NvdmVyJztcbiAgICAgICAgICAgICAgICAgICAgcHJvZHVjdEltYWdlLnN0eWxlLmJhY2tncm91bmRQb3NpdGlvbiA9ICdjZW50ZXInO1xuICAgICAgICAgICAgICAgICAgICBwcm9kdWN0SW1hZ2Uuc3R5bGUuYmFja2dyb3VuZFJlcGVhdCA9ICduby1yZXBlYXQnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RUZXh0V3JhcHBlciA9IHByb2R1Y3RJdGVtLnF1ZXJ5U2VsZWN0b3IoJy5wcm9kdWN0LWl0ZW0tdGV4dCcpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3RUZXh0V3JhcHBlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RUZXh0ID0gZ2V0TGFzdENoaWxkKHByb2R1Y3RUZXh0V3JhcHBlcik7XG4gICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RUZXh0LmlubmVyVGV4dCA9IHByb2R1Y3QucHJvZHVjdE5hbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcHJvZHVjdEJsb2NrID0gcHJvZHVjdEl0ZW0uZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBwcm9kdWN0QmxvY2suY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXNldHRpbmdzX19wcm9kdWN0LWJsb2NrX18nICsgcHJvZHVjdC50eXBlKTtcbiAgICAgICAgICAgIHByb2R1Y3RCbG9jay5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICBwcm9kdWN0QmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICAgICAgICAgICAgcHJvZHVjdEl0ZW0ub25jbGljayA9ICgpID0+IHRoaXMuY2hhbmdlUHJvZHVjdChwcm9kdWN0LnR5cGUpO1xuICAgICAgICAgICAgdGhpcy5wcm9kdWN0QmxvY2tzLnB1c2gocHJvZHVjdEJsb2NrKTtcbiAgICAgICAgICAgIHRoaXMucHJvZHVjdExpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5hcHBlbmRDaGlsZChwcm9kdWN0SXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5wcm9kdWN0QmxvY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMucHJvZHVjdEJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgICAgICBibG9jay5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYigyMjIgMjIyIDIyMiknO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBhY3RpdmVCbG9jayA9IHRoaXMucHJvZHVjdEJsb2Nrcy5maW5kKGJsb2NrID0+IGJsb2NrLmNsYXNzTGlzdC5jb250YWlucygnZWRpdG9yLXNldHRpbmdzX19wcm9kdWN0LWJsb2NrX18nICsgdGhpcy5fc2VsZWN0VHlwZSkpO1xuICAgICAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgYWN0aXZlQmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGluaXRDb2xvcnNMaXN0KCkge1xuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yQ29sb3JzTGlzdEJsb2NrIHx8ICF0aGlzLmVkaXRvckNvbG9ySXRlbUJsb2NrKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIGluaXQgY29sb3JzIGZvciAke3RoaXMuX3NlbGVjdFR5cGV9YCk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5lZGl0b3JDb2xvckl0ZW1CbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBjb25zdCBjb2xvcnNDb250YWluZXIgPSB0aGlzLmVkaXRvckNvbG9yc0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgY29sb3JzQ29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuICAgICAgICB0aGlzLmNvbG9yQmxvY2tzID0gW107XG4gICAgICAgIGNvbnN0IGNvbG9ycyA9IHByb2R1Y3QubW9ja3Vwc1xuICAgICAgICAgICAgLmZpbHRlcihtb2NrdXAgPT4gbW9ja3VwLnNpZGUgPT09IHRoaXMuX3NlbGVjdFNpZGUpXG4gICAgICAgICAgICAubWFwKG1vY2t1cCA9PiBtb2NrdXAuY29sb3IpO1xuICAgICAgICBjb2xvcnMuZm9yRWFjaChjb2xvciA9PiB7XG4gICAgICAgICAgICBjb25zdCBjb2xvckl0ZW0gPSB0aGlzLmVkaXRvckNvbG9ySXRlbUJsb2NrLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIGNvbG9ySXRlbS5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIGNvbnN0IGNvbG9yQmxvY2sgPSBjb2xvckl0ZW0uZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBjb2xvckJsb2NrLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1zZXR0aW5nc19fY29sb3ItYmxvY2tfXycgKyBjb2xvci5uYW1lKTtcbiAgICAgICAgICAgIGNvbG9yQmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgY29sb3JCbG9jay5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvci5oZXg7XG4gICAgICAgICAgICBjb2xvckJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgICAgICAgICAgIGNvbG9ySXRlbS5vbmNsaWNrID0gKCkgPT4gdGhpcy5jaGFuZ2VDb2xvcihjb2xvci5uYW1lKTtcbiAgICAgICAgICAgIHRoaXMuY29sb3JCbG9ja3MucHVzaChjb2xvckJsb2NrKTtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yQ29sb3JzTGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkLmFwcGVuZENoaWxkKGNvbG9ySXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5jb2xvckJsb2Nrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmNvbG9yQmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgICAgIGJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBhY3RpdmVCbG9jayA9IHRoaXMuY29sb3JCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fY29sb3ItYmxvY2tfXycgKyB0aGlzLl9zZWxlY3RDb2xvci5uYW1lKSk7XG4gICAgICAgICAgICBpZiAoYWN0aXZlQmxvY2spIHtcbiAgICAgICAgICAgICAgICBhY3RpdmVCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGluaXRTaXplc0xpc3QoKSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JTaXplc0xpc3RCbG9jayB8fCAhdGhpcy5lZGl0b3JTaXplSXRlbUJsb2NrKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIGluaXQgc2l6ZXMgZm9yICR7dGhpcy5fc2VsZWN0VHlwZX1gKTtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0IHx8ICFwcm9kdWN0LnNpemVzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmVkaXRvclNpemVJdGVtQmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgY29uc3Qgc2l6ZXNDb250YWluZXIgPSB0aGlzLmVkaXRvclNpemVzTGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICBzaXplc0NvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgdGhpcy5zaXplQmxvY2tzID0gW107XG4gICAgICAgIHByb2R1Y3Quc2l6ZXMuZm9yRWFjaChzaXplID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNpemVJdGVtID0gdGhpcy5lZGl0b3JTaXplSXRlbUJsb2NrLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIHNpemVJdGVtLnN0eWxlLmRpc3BsYXkgPSAndGFibGUnO1xuICAgICAgICAgICAgc2l6ZUl0ZW0uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgc2l6ZUl0ZW0uc3R5bGUudXNlclNlbGVjdCA9ICdub25lJztcbiAgICAgICAgICAgIHNpemVJdGVtLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1zZXR0aW5nc19fc2l6ZS1ibG9ja19fJyArIHNpemUpO1xuICAgICAgICAgICAgY29uc3QgYm9yZGVyQmxvY2sgPSBzaXplSXRlbS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGJvcmRlckJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICAgICAgY29uc3Qgc2l6ZVRleHQgPSBnZXRMYXN0Q2hpbGQoc2l6ZUl0ZW0pO1xuICAgICAgICAgICAgaWYgKHNpemVUZXh0KSB7XG4gICAgICAgICAgICAgICAgc2l6ZVRleHQuaW5uZXJUZXh0ID0gc2l6ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNpemVJdGVtLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNoYW5nZVNpemUoc2l6ZSk7XG4gICAgICAgICAgICB0aGlzLnNpemVCbG9ja3MucHVzaChzaXplSXRlbSk7XG4gICAgICAgICAgICB0aGlzLmVkaXRvclNpemVzTGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkLmFwcGVuZENoaWxkKHNpemVJdGVtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLnNpemVCbG9ja3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5zaXplQmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJvcmRlckJsb2NrID0gYmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICAgICAgaWYgKGJvcmRlckJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgIGJvcmRlckJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLnNpemVCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fc2l6ZS1ibG9ja19fJyArIHRoaXMuX3NlbGVjdFNpemUpKTtcbiAgICAgICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJvcmRlckJsb2NrID0gYWN0aXZlQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICAgICAgaWYgKGJvcmRlckJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgIGJvcmRlckJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHNob3dMYXlvdXRMaXN0KCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbc2V0dGluZ3NdIFtsYXlvdXRzXSBzaG93IGxheW91dHMgbGlzdCcpO1xuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW3NldHRpbmdzXSBbbGF5b3V0c10gZWRpdG9yTGF5b3V0SXRlbUJsb2NrIGlzIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jaykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIltzZXR0aW5nc10gW2xheW91dHNdIGVkaXRvckxheW91dHNMaXN0QmxvY2sgaXMgbm90IGluaXRpYWxpemVkXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBbbGF5b3V0c10gbGF5b3V0cyBsaXN0IGJsb2NrIGNoaWxkcmVuOiAke3RoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5jaGlsZHJlbi5sZW5ndGh9YCk7XG4gICAgICAgIHRoaXMubGF5b3V0cy5mb3JFYWNoKGxheW91dCA9PiB7XG4gICAgICAgICAgICBjb25zdCBsYXlvdXRJdGVtID0gdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2suY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgbGF5b3V0SXRlbS5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIGNvbnN0IGlzRWRpdGluZyA9IHRoaXMuX3NlbGVjdExheW91dCA9PT0gbGF5b3V0LmlkO1xuICAgICAgICAgICAgY29uc3QgcHJldmlld0Jsb2NrID0gdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tWaWV3Q2xhc3NcbiAgICAgICAgICAgICAgICA/IGxheW91dEl0ZW0ucXVlcnlTZWxlY3Rvcih0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja1ZpZXdDbGFzcylcbiAgICAgICAgICAgICAgICA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCBuYW1lQmxvY2sgPSB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja05hbWVDbGFzc1xuICAgICAgICAgICAgICAgID8gbGF5b3V0SXRlbS5xdWVyeVNlbGVjdG9yKHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrTmFtZUNsYXNzKVxuICAgICAgICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IHJlbW92ZUJsb2NrID0gdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tSZW1vdmVDbGFzc1xuICAgICAgICAgICAgICAgID8gbGF5b3V0SXRlbS5xdWVyeVNlbGVjdG9yKHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrUmVtb3ZlQ2xhc3MpXG4gICAgICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgZWRpdEJsb2NrID0gdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tFZGl0Q2xhc3NcbiAgICAgICAgICAgICAgICA/IGxheW91dEl0ZW0ucXVlcnlTZWxlY3Rvcih0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja0VkaXRDbGFzcylcbiAgICAgICAgICAgICAgICA6IG51bGw7XG4gICAgICAgICAgICBpZiAocHJldmlld0Jsb2NrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxheW91dC5pc0ltYWdlTGF5b3V0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJldmlld0VsZW1lbnQgPSBwcmV2aWV3QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmV2aWV3RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlld0VsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gYHVybCgke2xheW91dC51cmx9KWA7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3RWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9ICdjb250YWluJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJhY2tncm91bmRQb3NpdGlvbiA9ICdjZW50ZXInO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlld0VsZW1lbnQuc3R5bGUuYmFja2dyb3VuZFJlcGVhdCA9ICduby1yZXBlYXQnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0VkaXRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJvcmRlckNvbG9yID0gJ3JnYigyNTQsIDk0LCA1OCknO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlld0VsZW1lbnQuc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChsYXlvdXQudHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5hbWVCbG9jaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWVFbGVtZW50ID0gbmFtZUJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgIGlmIChuYW1lRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGF5b3V0LnR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3BsYXlOYW1lID0gIWxheW91dC5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBcItCY0LfQvtCx0YDQsNC20LXQvdC40LVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbGF5b3V0Lm5hbWUuaW5jbHVkZXMoXCJcXG5cIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBsYXlvdXQubmFtZS5zcGxpdChcIlxcblwiKVswXSArIFwiLi4uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBsYXlvdXQubmFtZS5sZW5ndGggPiA0MFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBsYXlvdXQubmFtZS5zbGljZSgwLCA0MCkgKyBcIi4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGxheW91dC5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZUVsZW1lbnQuaW5uZXJUZXh0ID0gZGlzcGxheU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobGF5b3V0LnR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZUVsZW1lbnQuaW5uZXJUZXh0ID0gbGF5b3V0Lm5hbWUgfHwgXCLQotC10LrRgdGCXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVtb3ZlQmxvY2spIHtcbiAgICAgICAgICAgICAgICByZW1vdmVCbG9jay5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICAgICAgcmVtb3ZlQmxvY2sub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVMYXlvdXQobGF5b3V0LmlkKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNFZGl0aW5nKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW5jZWxFZGl0TGF5b3V0KCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3RvcmVJY29uRnJvbURhdGFPcmlnaW5hbChyZW1vdmVCbG9jay5maXJzdEVsZW1lbnRDaGlsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWRpdEJsb2NrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzRWRpdGluZyB8fCBsYXlvdXQuaWQgPT09IFwic3RhcnRcIikge1xuICAgICAgICAgICAgICAgICAgICBlZGl0QmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWRpdEJsb2NrLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgICAgICBlZGl0QmxvY2sub25jbGljayA9ICgpID0+IHRoaXMuZWRpdExheW91dChsYXlvdXQpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVzdG9yZUljb25Gcm9tRGF0YU9yaWdpbmFsKGdldExhc3RDaGlsZChlZGl0QmxvY2spKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jay5maXJzdEVsZW1lbnRDaGlsZC5hcHBlbmRDaGlsZChsYXlvdXRJdGVtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gW2xheW91dHNdIGxheW91dHMgc2hvd246ICR7dGhpcy5lZGl0b3JMYXlvdXRzTGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkLmNoaWxkcmVuLmxlbmd0aH1gKTtcbiAgICB9XG4gICAgaW5pdEFkZE9yZGVyQnV0dG9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmV2ZW50cy5vbihFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIChpc0xvYWRpbmcpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzTG9hZGluZykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMC41JztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAnbm90LWFsbG93ZWQnO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0JrQvdC+0L/QutCwINC30LDQsdC70L7QutC40YDQvtCy0LDQvdCwICjQuNC00LXRgiDQs9C10L3QtdGA0LDRhtC40Y8pJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0JrQvdC+0L/QutCwINGA0LDQt9Cx0LvQvtC60LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLm9uY2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0FkZGluZ1RvQ2FydCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW29yZGVyXSDQn9GA0L7RhtC10YHRgSDQtNC+0LHQsNCy0LvQtdC90LjRjyDRg9C20LUg0LjQtNC10YIsINC40LPQvdC+0YDQuNGA0YPQtdC8INC/0L7QstGC0L7RgNC90L7QtSDQvdCw0LbQsNGC0LjQtScpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmdldFN1bSgpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQoJ9CU0LvRjyDQtNC+0LHQsNCy0LvQtdC90LjRjyDQt9Cw0LrQsNC30LAg0L/RgNC+0LTRg9C60YIg0L3QtSDQvNC+0LbQtdGCINCx0YvRgtGMINC/0YPRgdGC0YvQvCcpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmxheW91dHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQoJ9Cf0L7QttCw0LvRg9C50YHRgtCwLCDQtNC+0LbQtNC40YLQtdGB0Ywg0LfQsNCy0LXRgNGI0LXQvdC40Y8g0LPQtdC90LXRgNCw0YbQuNC4INC00LjQt9Cw0LnQvdCwJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbb3JkZXJdINCf0L7Qv9GL0YLQutCwINC00L7QsdCw0LLQuNGC0Ywg0LIg0LrQvtGA0LfQuNC90YMg0LHQtdC3INC00LjQt9Cw0LnQvdCwJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGJ1dHRvblRleHRFbGVtZW50ID0gdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbj8ucXVlcnlTZWxlY3RvcignLnRuLWF0b20nKTtcbiAgICAgICAgICAgIGlmICghYnV0dG9uVGV4dEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBidXR0b25UZXh0RWxlbWVudCA9IHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24/LnF1ZXJ5U2VsZWN0b3IoJ2Rpdiwgc3BhbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxUZXh0ID0gYnV0dG9uVGV4dEVsZW1lbnQ/LnRleHRDb250ZW50Py50cmltKCkgfHwgJ9CU0L7QsdCw0LLQuNGC0Ywg0LIg0LrQvtGA0LfQuNC90YMnO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQWRkaW5nVG9DYXJ0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEFkZFRvQ2FydEJ1dHRvbkxvYWRpbmcodHJ1ZSwgJ9CU0L7QsdCw0LLQu9C10L3QuNC1Li4uJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgYXJ0aWNsZSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqICg5OTk5OTk5OSAtIDk5OTk5OSArIDEpKSArIDk5OTk5OTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCd0LDRh9Cw0LvQviDRgdC+0LfQtNCw0L3QuNGPINC30LDQutCw0LfQsCcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4cG9ydGVkQXJ0ID0gYXdhaXQgdGhpcy5leHBvcnRBcnQodHJ1ZSwgNTEyKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCt0LrRgdC/0L7RgNGCINC00LjQt9Cw0LnQvdCwINC30LDQstC10YDRiNC10L06JywgT2JqZWN0LmtleXMoZXhwb3J0ZWRBcnQpKTtcbiAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMoZXhwb3J0ZWRBcnQpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBhbGVydCgn0J7RiNC40LHQutCwOiDQvdC1INGD0LTQsNC70L7RgdGMINGN0LrRgdC/0L7RgNGC0LjRgNC+0LLQsNGC0Ywg0LTQuNC30LDQudC9LiDQn9C+0L/RgNC+0LHRg9C50YLQtSDQtdGJ0LUg0YDQsNC3LicpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbb3JkZXJdINCt0LrRgdC/0L7RgNGCINCy0LXRgNC90YPQuyDQv9GD0YHRgtC+0Lkg0YDQtdC30YPQu9GM0YLQsNGCJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3Qgc2lkZXMgPSBPYmplY3Qua2V5cyhleHBvcnRlZEFydCkubWFwKHNpZGUgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VfdXJsOiBleHBvcnRlZEFydFtzaWRlXSB8fCAnJyxcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQl9Cw0LPRgNGD0LfQutCwINC40LfQvtCx0YDQsNC20LXQvdC40Lkg0L3QsCDRgdC10YDQstC10YAuLi4nKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1cGxvYWRQcm9taXNlcyA9IHNpZGVzLm1hcChhc3luYyAoc2lkZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBiYXNlNjQgPSBzaWRlLmltYWdlX3VybC5zcGxpdCgnLCcpWzFdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1cGxvYWRlZFVybCA9IGF3YWl0IHRoaXMudXBsb2FkSW1hZ2VUb1NlcnZlcihiYXNlNjQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBzaWRlLCB1cGxvYWRlZFVybCB9O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVwbG9hZGVkU2lkZXMgPSBhd2FpdCBQcm9taXNlLmFsbCh1cGxvYWRQcm9taXNlcyk7XG4gICAgICAgICAgICAgICAgdXBsb2FkZWRTaWRlcy5mb3JFYWNoKCh7IHNpZGUsIHVwbG9hZGVkVXJsIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2lkZS5pbWFnZV91cmwgPSB1cGxvYWRlZFVybDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCY0LfQvtCx0YDQsNC20LXQvdC40Y8g0LfQsNCz0YDRg9C20LXQvdGLINC90LAg0YHQtdGA0LLQtdGAJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdE5hbWUgPSBgJHt0aGlzLmNhcGl0YWxpemVGaXJzdExldHRlcih0aGlzLmdldFByb2R1Y3ROYW1lKCkpfSDRgSDQstCw0YjQuNC8ICR7T2JqZWN0LmtleXMoZXhwb3J0ZWRBcnQpLmxlbmd0aCA9PSAxID8gJ9C+0LTQvdC+0YHRgtC+0YDQvtC90L3QuNC8JyA6ICfQtNCy0YPRhdGB0YLQvtGA0L7QvdC90LjQvCd9INC/0YDQuNC90YLQvtC8YDtcbiAgICAgICAgICAgICAgICBjb25zdCBsYXlvdXRzID0gdGhpcy5sYXlvdXRzLm1hcChsYXlvdXQgPT4gKHsgLi4ubGF5b3V0LCB1cmw6IHVuZGVmaW5lZCB9KSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdXNlcklkID0gYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci5nZXRVc2VySWQoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICAgICAgICAgIGZvcm1EYXRhLmFwcGVuZChcImxheW91dHNcIiwgSlNPTi5zdHJpbmdpZnkobGF5b3V0cykpO1xuICAgICAgICAgICAgICAgIGZvcm1EYXRhLmFwcGVuZChcInVzZXJfaWRcIiwgdXNlcklkKTtcbiAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoXCJhcnRcIiwgYXJ0aWNsZS50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBmZXRjaChBUElfRU5EUE9JTlRTLldFQkhPT0tfQ0FSVCwge1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgICAgICAgICBib2R5OiBmb3JtRGF0YVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNyZWF0ZVByb2R1Y3Qoe1xuICAgICAgICAgICAgICAgICAgICBxdWFudGl0eTogdGhpcy5nZXRRdWFudGl0eSgpLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBwcm9kdWN0TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogdGhpcy5fc2VsZWN0U2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IHRoaXMuX3NlbGVjdENvbG9yLFxuICAgICAgICAgICAgICAgICAgICBzaWRlcyxcbiAgICAgICAgICAgICAgICAgICAgcHJvZHVjdFR5cGU6IHRoaXMuX3NlbGVjdFR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGFydGljbGVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCX0LDQutCw0Lcg0YPRgdC/0LXRiNC90L4g0YHQvtC30LTQsNC9Jyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRBZGRUb0NhcnRCdXR0b25Mb2FkaW5nKGZhbHNlLCAn4pyTINCU0L7QsdCw0LLQu9C10L3QviEnKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRBZGRUb0NhcnRCdXR0b25Mb2FkaW5nKGZhbHNlLCBvcmlnaW5hbFRleHQpO1xuICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW29yZGVyXSDQntGI0LjQsdC60LAg0YHQvtC30LTQsNC90LjRjyDQt9Cw0LrQsNC30LA6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIGFsZXJ0KCfQntGI0LjQsdC60LAg0L/RgNC4INGB0L7Qt9C00LDQvdC40Lgg0LfQsNC60LDQt9CwJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRBZGRUb0NhcnRCdXR0b25Mb2FkaW5nKGZhbHNlLCBvcmlnaW5hbFRleHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNBZGRpbmdUb0NhcnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQpNC70LDQsyBpc0FkZGluZ1RvQ2FydCDRgdCx0YDQvtGI0LXQvScpO1xuICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBzZXRBZGRUb0NhcnRCdXR0b25Mb2FkaW5nKGlzTG9hZGluZywgdGV4dCkge1xuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuaW5qZWN0UHVsc2VBbmltYXRpb24oKTtcbiAgICAgICAgY29uc3QgYnV0dG9uID0gdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbjtcbiAgICAgICAgbGV0IGJ1dHRvblRleHRFbGVtZW50ID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJy50bi1hdG9tJyk7XG4gICAgICAgIGlmICghYnV0dG9uVGV4dEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGJ1dHRvblRleHRFbGVtZW50ID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ2Rpdiwgc3BhbicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRleHRUYXJnZXQgPSBidXR0b25UZXh0RWxlbWVudCB8fCBidXR0b247XG4gICAgICAgIGlmIChpc0xvYWRpbmcpIHtcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzAuNyc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuY3Vyc29yID0gJ25vdC1hbGxvd2VkJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgICAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgICAgICB0ZXh0VGFyZ2V0LnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5hbmltYXRpb24gPSAnY2FydEJ1dHRvblB1bHNlIDEuNXMgZWFzZS1pbi1vdXQgaW5maW5pdGUnO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSBbYW5pbWF0aW9uXSDQmtC90L7Qv9C60LAg0LfQsNCx0LvQvtC60LjRgNC+0LLQsNC90LA6JywgdGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9ICcxJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5hbmltYXRpb24gPSAnbm9uZSc7XG4gICAgICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgICAgIHRleHRUYXJnZXQudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSBbYW5pbWF0aW9uXSDQmtC90L7Qv9C60LAg0YDQsNC30LHQu9C+0LrQuNGA0L7QstCw0L3QsDonLCB0ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpbmplY3RQdWxzZUFuaW1hdGlvbigpIHtcbiAgICAgICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYXJ0LWJ1dHRvbi1wdWxzZS1hbmltYXRpb24nKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgc3R5bGUuaWQgPSAnY2FydC1idXR0b24tcHVsc2UtYW5pbWF0aW9uJztcbiAgICAgICAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4gICAgICAgICAgICBAa2V5ZnJhbWVzIGNhcnRCdXR0b25QdWxzZSB7XG4gICAgICAgICAgICAgICAgMCUsIDEwMCUge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDEpO1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLjc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIDUwJSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMS4wMik7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDAuODU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBgO1xuICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2FuaW1hdGlvbl0gQ1NTINCw0L3QuNC80LDRhtC40Y8g0L/Rg9C70YzRgdCw0YbQuNC4INC00L7QsdCw0LLQu9C10L3QsCcpO1xuICAgIH1cbiAgICBzZXRHZW5lcmF0ZUJ1dHRvbkxvYWRpbmcoaXNMb2FkaW5nLCB0ZXh0KSB7XG4gICAgICAgIGlmICghdGhpcy5mb3JtQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmluamVjdFB1bHNlQW5pbWF0aW9uKCk7XG4gICAgICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuZm9ybUJ1dHRvbjtcbiAgICAgICAgbGV0IGJ1dHRvblRleHRFbGVtZW50ID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJy50bi1hdG9tJyk7XG4gICAgICAgIGlmICghYnV0dG9uVGV4dEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGJ1dHRvblRleHRFbGVtZW50ID0gYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ2Rpdiwgc3BhbicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRleHRUYXJnZXQgPSBidXR0b25UZXh0RWxlbWVudCB8fCBidXR0b247XG4gICAgICAgIGlmIChpc0xvYWRpbmcpIHtcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzAuNyc7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUuY3Vyc29yID0gJ25vdC1hbGxvd2VkJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgICAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgICAgICB0ZXh0VGFyZ2V0LnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5hbmltYXRpb24gPSAnY2FydEJ1dHRvblB1bHNlIDEuNXMgZWFzZS1pbi1vdXQgaW5maW5pdGUnO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2dlbmVyYXRlXSBbYW5pbWF0aW9uXSDQmtC90L7Qv9C60LAg0LfQsNCx0LvQvtC60LjRgNC+0LLQsNC90LA6JywgdGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9ICcxJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICBidXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5hbmltYXRpb24gPSAnbm9uZSc7XG4gICAgICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgICAgIHRleHRUYXJnZXQudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2dlbmVyYXRlXSBbYW5pbWF0aW9uXSDQmtC90L7Qv9C60LAg0YDQsNC30LHQu9C+0LrQuNGA0L7QstCw0L3QsDonLCB0ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0VXBsb2FkSW1hZ2VCdXR0b24oKSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5yZXNldFVzZXJVcGxvYWRJbWFnZSgpO1xuICAgICAgICB0aGlzLmVkaXRvclVwbG9hZEltYWdlQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBsb2FkVXNlckltYWdlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpbml0Rml4UXVhbnRpdHlGb3JtKCkge1xuICAgICAgICBpZiAoIXRoaXMucXVhbnRpdHlGb3JtQmxvY2spXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGZvcm0gPSB0aGlzLnF1YW50aXR5Rm9ybUJsb2NrLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcbiAgICAgICAgY29uc3QgaW5wdXQgPSBmb3JtPy5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwicXVhbnRpdHlcIl0nKTtcbiAgICAgICAgaWYgKCFpbnB1dClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgdmFsaWRhdGVRdWFudGl0eSA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gaW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnJyB8fCBpc05hTihOdW1iZXIodmFsdWUpKSkge1xuICAgICAgICAgICAgICAgIGlucHV0LnZhbHVlID0gJzEnO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHF1YW50aXR5ID0gcGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICAgIGlmIChxdWFudGl0eSA8IDEgfHwgcXVhbnRpdHkgPT09IDApIHtcbiAgICAgICAgICAgICAgICBpbnB1dC52YWx1ZSA9ICcxJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCB2YWxpZGF0ZVF1YW50aXR5KTtcbiAgICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHZhbGlkYXRlUXVhbnRpdHkpO1xuICAgICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB2YWxpZGF0ZVF1YW50aXR5KTtcbiAgICAgICAgdmFsaWRhdGVRdWFudGl0eSgpO1xuICAgIH1cbiAgICBhc3luYyBpbml0Rm9ybSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmZvcm1CbG9jayB8fCAhdGhpcy5mb3JtQnV0dG9uIHx8ICF0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZm9ybUJsb2NrID0gdGhpcy5mb3JtQmxvY2s7XG4gICAgICAgIGNvbnN0IGZvcm1JbnB1dFZhcmlhYmxlTmFtZSA9IHRoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lO1xuICAgICAgICBjb25zdCBmb3JtQnV0dG9uID0gdGhpcy5mb3JtQnV0dG9uO1xuICAgICAgICBjb25zdCBoYW5kbGVDbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYnV0dG9uXSBjbGlja2VkJyk7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0dlbmVyYXRpbmcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSDQk9C10L3QtdGA0LDRhtC40Y8g0YPQttC1INC40LTQtdGCLCDQuNCz0L3QvtGA0LjRgNGD0LXQvCDQv9C+0LLRgtC+0YDQvdC+0LUg0L3QsNC20LDRgtC40LUnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBmb3JtSW5wdXQgPSBmb3JtQmxvY2sucXVlcnlTZWxlY3RvcihgW25hbWU9XCIke2Zvcm1JbnB1dFZhcmlhYmxlTmFtZX1cIl1gKTtcbiAgICAgICAgICAgIGNvbnN0IHByb21wdCA9IGZvcm1JbnB1dC52YWx1ZTtcbiAgICAgICAgICAgIGlmICghdGhpcy5sb2FkZWRVc2VySW1hZ2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXByb21wdCB8fCBwcm9tcHQudHJpbSgpID09PSBcIlwiIHx8IHByb21wdC5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFtpbnB1dF0gcHJvbXB0IGlzIGVtcHR5IG9yIHRvbyBzaG9ydCcpO1xuICAgICAgICAgICAgICAgICAgICBhbGVydChcItCc0LjQvdC40LzQsNC70YzQvdCw0Y8g0LTQu9C40L3QsCDQt9Cw0L/RgNC+0YHQsCAxINGB0LjQvNCy0L7Qu1wiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbaW5wdXRdIHByb21wdDogJHtwcm9tcHR9YCk7XG4gICAgICAgICAgICB0aGlzLmlzR2VuZXJhdGluZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNldEdlbmVyYXRlQnV0dG9uTG9hZGluZyh0cnVlLCAn0JPQtdC90LXRgNCw0YbQuNGPLi4uJyk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCB0cnVlKTtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dElkID0gdGhpcy5fc2VsZWN0TGF5b3V0IHx8IExheW91dC5nZW5lcmF0ZUlkKCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHVybCA9IGF3YWl0IGdlbmVyYXRlSW1hZ2Uoe1xuICAgICAgICAgICAgICAgICAgICBwcm9tcHQsXG4gICAgICAgICAgICAgICAgICAgIHNoaXJ0Q29sb3I6IHRoaXMuX3NlbGVjdENvbG9yLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGltYWdlOiB0aGlzLl9zZWxlY3RMYXlvdXQgPyB0aGlzLmxvYWRlZFVzZXJJbWFnZSAhPT0gdGhpcy5sYXlvdXRzLmZpbmQobGF5b3V0ID0+IGxheW91dC5pZCA9PT0gdGhpcy5fc2VsZWN0TGF5b3V0KT8udXJsID8gdGhpcy5sb2FkZWRVc2VySW1hZ2UgOiBudWxsIDogdGhpcy5sb2FkZWRVc2VySW1hZ2UsXG4gICAgICAgICAgICAgICAgICAgIHdpdGhBaTogdGhpcy5lZGl0b3JMb2FkV2l0aEFpLFxuICAgICAgICAgICAgICAgICAgICBsYXlvdXRJZCxcbiAgICAgICAgICAgICAgICAgICAgaXNOZXc6IHRoaXMuX3NlbGVjdExheW91dCA/IGZhbHNlIDogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VEYXRhID0gYXdhaXQgdGhpcy5nZXRJbWFnZURhdGEodXJsKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW2lucHV0XSBpbWFnZSBkYXRhIHJlY2VpdmVkYCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NlbGVjdExheW91dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYXlvdXQgPSB0aGlzLmxheW91dHMuZmluZChsYXlvdXQgPT4gbGF5b3V0LmlkID09PSBsYXlvdXRJZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXlvdXQgJiYgbGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtpbnB1dF0gdXBkYXRpbmcgbGF5b3V0OiAke2xheW91dC5pZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheW91dC5uYW1lID0gcHJvbXB0O1xuICAgICAgICAgICAgICAgICAgICAgICAgbGF5b3V0LnVybCA9IGltYWdlRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbaW5wdXRdIGxheW91dCB1cGRhdGVkYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTGF5b3V0KExheW91dC5jcmVhdGVJbWFnZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogbGF5b3V0SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB2aWV3OiB0aGlzLl9zZWxlY3RTaWRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBpbWFnZURhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBwcm9tcHRcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQuc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YzZjNmMyc7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0TGF5b3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQudmFsdWUgPSBcIlwiO1xuICAgICAgICAgICAgICAgIHRoaXMuY2FuY2VsRWRpdExheW91dCgpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVzZXRVc2VyVXBsb2FkSW1hZ2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRHZW5lcmF0ZUJ1dHRvbkxvYWRpbmcoZmFsc2UsICfinJMg0JPQvtGC0L7QstC+IScpO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEdlbmVyYXRlQnV0dG9uTG9hZGluZyhmYWxzZSwgJ9Ch0LPQtdC90LXRgNC40YDQvtCy0LDRgtGMJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNHZW5lcmF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSDQpNC70LDQsyBpc0dlbmVyYXRpbmcg0YHQsdGA0L7RiNC10L0nKTtcbiAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbZm9ybV0gW2lucHV0XSBlcnJvcicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBhbGVydChcItCe0YjQuNCx0LrQsCDQv9GA0Lgg0LPQtdC90LXRgNCw0YbQuNC4INC40LfQvtCx0YDQsNC20LXQvdC40Y9cIik7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRHZW5lcmF0ZUJ1dHRvbkxvYWRpbmcoZmFsc2UsICfQodCz0LXQvdC10YDQuNGA0L7QstCw0YLRjCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNHZW5lcmF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9hZGVkVXNlckltYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzZXRVc2VyVXBsb2FkSW1hZ2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NlbGVjdExheW91dCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RMYXlvdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbmNlbEVkaXRMYXlvdXQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGZvcm0gPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybSA9IGZvcm1CbG9jay5xdWVyeVNlbGVjdG9yKFwiZm9ybVwiKTtcbiAgICAgICAgICAgICAgICBpZiAoZm9ybSkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShmb3JtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgICAgICAgIH0sIDEwMDAgKiAxMCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIWZvcm0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIGZvcm0gbm90IGZvdW5kJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZm9ybS5hY3Rpb24gPSBcIlwiO1xuICAgICAgICBmb3JtLm1ldGhvZCA9IFwiR0VUXCI7XG4gICAgICAgIGZvcm0ub25zdWJtaXQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBoYW5kbGVDbGljaygpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBmaXhJbnB1dEJsb2NrID0gZm9ybS5xdWVyeVNlbGVjdG9yKGB0ZXh0YXJlYVtuYW1lPScke2Zvcm1JbnB1dFZhcmlhYmxlTmFtZX0nXWApO1xuICAgICAgICBpZiAoZml4SW5wdXRCbG9jaykge1xuICAgICAgICAgICAgZml4SW5wdXRCbG9jay5zdHlsZS5wYWRkaW5nID0gXCI4cHhcIjtcbiAgICAgICAgfVxuICAgICAgICBmb3JtQnV0dG9uLm9uY2xpY2sgPSBoYW5kbGVDbGljaztcbiAgICAgICAgZm9ybUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSBcInBvaW50ZXJcIjtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dINCY0L3QuNGG0LjQsNC70LjQt9Cw0YbQuNGPINGE0L7RgNC80Ysg0LfQsNCy0LXRgNGI0LXQvdCwJyk7XG4gICAgfVxuICAgIHJlc3RvcmVJY29uRnJvbURhdGFPcmlnaW5hbChlbGVtZW50KSB7XG4gICAgICAgIGlmICghZWxlbWVudClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZGF0YU9yaWdpbmFsID0gZWxlbWVudC5hdHRyaWJ1dGVzLmdldE5hbWVkSXRlbShcImRhdGEtb3JpZ2luYWxcIik/LnZhbHVlO1xuICAgICAgICBpZiAoZGF0YU9yaWdpbmFsKSB7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IGB1cmwoXCIke2RhdGFPcmlnaW5hbH1cIilgO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNoYW5nZVByb2R1Y3QocHJvZHVjdFR5cGUpIHtcbiAgICAgICAgdGhpcy5fc2VsZWN0VHlwZSA9IHByb2R1Y3RUeXBlO1xuICAgICAgICB0aGlzLmNsZWFyTW9ja3VwQ2FjaGUoKTtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZShwcm9kdWN0VHlwZSk7XG4gICAgICAgIGlmIChwcm9kdWN0KSB7XG4gICAgICAgICAgICBjb25zdCBtb2NrdXBXaXRoQ3VycmVudENvbG9yID0gcHJvZHVjdC5tb2NrdXBzLmZpbmQobSA9PiBtLnNpZGUgPT09IHRoaXMuX3NlbGVjdFNpZGUgJiYgbS5jb2xvci5uYW1lID09PSB0aGlzLl9zZWxlY3RDb2xvci5uYW1lKTtcbiAgICAgICAgICAgIGlmICghbW9ja3VwV2l0aEN1cnJlbnRDb2xvcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0TW9ja3VwID0gcHJvZHVjdC5tb2NrdXBzLmZpbmQobSA9PiBtLnNpZGUgPT09IHRoaXMuX3NlbGVjdFNpZGUpO1xuICAgICAgICAgICAgICAgIGlmIChmaXJzdE1vY2t1cCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RDb2xvciA9IGZpcnN0TW9ja3VwLmNvbG9yO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbcHJvZHVjdF0g0KbQstC10YIg0LjQt9C80LXQvdC10L0g0L3QsCAke3RoaXMuX3NlbGVjdENvbG9yLm5hbWV9INC00LvRjyDQv9GA0L7QtNGD0LrRgtCwICR7cHJvZHVjdFR5cGV9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlUHJvZHVjdEJsb2Nrc1VJKCk7XG4gICAgICAgIHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICB9XG4gICAgdXBkYXRlUHJvZHVjdEJsb2Nrc1VJKCkge1xuICAgICAgICBpZiAodGhpcy5wcm9kdWN0QmxvY2tzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5wcm9kdWN0QmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgYmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2IoMjIyIDIyMiAyMjIpJztcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGFjdGl2ZUJsb2NrID0gdGhpcy5wcm9kdWN0QmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX3Byb2R1Y3QtYmxvY2tfXycgKyB0aGlzLl9zZWxlY3RUeXBlKSk7XG4gICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgYWN0aXZlQmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICcnO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNoYW5nZVNpZGUoKSB7XG4gICAgICAgIGNvbnN0IG5ld1NpZGUgPSB0aGlzLl9zZWxlY3RTaWRlID09PSAnZnJvbnQnID8gJ2JhY2snIDogJ2Zyb250JztcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVTaWRlKG5ld1NpZGUpO1xuICAgICAgICB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLlNUQVRFX0NIQU5HRUQsIHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIGNoYW5nZUNvbG9yKGNvbG9yTmFtZSkge1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IG1vY2t1cCA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG0gPT4gbS5jb2xvci5uYW1lID09PSBjb2xvck5hbWUpO1xuICAgICAgICBpZiAoIW1vY2t1cClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5fc2VsZWN0Q29sb3IgPSBtb2NrdXAuY29sb3I7XG4gICAgICAgIHRoaXMuY2xlYXJNb2NrdXBDYWNoZSgpO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbG9yQmxvY2tzVUkoY29sb3JOYW1lKTtcbiAgICAgICAgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICB9XG4gICAgdXBkYXRlQ29sb3JCbG9ja3NVSShjb2xvck5hbWUpIHtcbiAgICAgICAgaWYgKHRoaXMuY29sb3JCbG9ja3MubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmNvbG9yQmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgYmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YzZjNmMyc7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBhY3RpdmVCbG9jayA9IHRoaXMuY29sb3JCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fY29sb3ItYmxvY2tfXycgKyBjb2xvck5hbWUpKTtcbiAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICBhY3RpdmVCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcnO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNoYW5nZVNpemUoc2l6ZSkge1xuICAgICAgICB0aGlzLnVwZGF0ZVNpemVCbG9ja3NVSShzaXplKTtcbiAgICAgICAgdGhpcy5fc2VsZWN0U2l6ZSA9IHNpemU7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgfVxuICAgIHVwZGF0ZVNpemVCbG9ja3NVSShzaXplKSB7XG4gICAgICAgIGlmICh0aGlzLnNpemVCbG9ja3MubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnNpemVCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICBjb25zdCBib3JkZXJCbG9jayA9IGJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgaWYgKGJvcmRlckJsb2NrKSB7XG4gICAgICAgICAgICAgICAgYm9yZGVyQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YzZjNmMyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBhY3RpdmVCbG9jayA9IHRoaXMuc2l6ZUJsb2Nrcy5maW5kKGJsb2NrID0+IGJsb2NrLmNsYXNzTGlzdC5jb250YWlucygnZWRpdG9yLXNldHRpbmdzX19zaXplLWJsb2NrX18nICsgc2l6ZSkpO1xuICAgICAgICBpZiAoYWN0aXZlQmxvY2spIHtcbiAgICAgICAgICAgIGNvbnN0IGJvcmRlckJsb2NrID0gYWN0aXZlQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBpZiAoYm9yZGVyQmxvY2spIHtcbiAgICAgICAgICAgICAgICBib3JkZXJCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGVkaXRMYXlvdXQobGF5b3V0KSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gW2xheW91dHNdIGVkaXQgbGF5b3V0ICR7bGF5b3V0LmlkfWApO1xuICAgICAgICB0aGlzLl9zZWxlY3RMYXlvdXQgPSBsYXlvdXQuaWQ7XG4gICAgICAgIGlmICh0aGlzLmZvcm1CbG9jayAmJiB0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSkge1xuICAgICAgICAgICAgY29uc3QgZm9ybUlucHV0ID0gdGhpcy5mb3JtQmxvY2sucXVlcnlTZWxlY3RvcihgW25hbWU9XCIke3RoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lfVwiXWApO1xuICAgICAgICAgICAgaWYgKGZvcm1JbnB1dCkge1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC52YWx1ZSA9IGxheW91dC5uYW1lIHx8ICcnO1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC5zdHlsZS5ib3JkZXJDb2xvciA9ICdyZ2IoMjU0LCA5NCwgNTgpJztcbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSDQo9GB0YLQsNC90L7QstC70LXQvdC+INC30L3QsNGH0LXQvdC40LUg0LIg0YTQvtGA0LzRgzogXCIke2xheW91dC5uYW1lfVwiYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtzZXR0aW5nc10gW2xheW91dHNdINCd0LUg0L3QsNC50LTQtdC9INGN0LvQtdC80LXQvdGCINGE0L7RgNC80Ysg0YEg0LjQvNC10L3QtdC8IFwiJHt0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZX1cImApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChsYXlvdXQuaXNJbWFnZUxheW91dCgpKSB7XG4gICAgICAgICAgICB0aGlzLmxvYWRlZFVzZXJJbWFnZSA9IGxheW91dC51cmw7XG4gICAgICAgICAgICB0aGlzLnNldFVzZXJVcGxvYWRJbWFnZShsYXlvdXQudXJsKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdEFpQnV0dG9ucygpO1xuICAgICAgICAgICAgdGhpcy5oaWRlQWlCdXR0b25zKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxvYWRlZFVzZXJJbWFnZSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnJlc2V0VXNlclVwbG9hZEltYWdlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgIH1cbiAgICBjYW5jZWxFZGl0TGF5b3V0KCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSBjYW5jZWwgZWRpdCBsYXlvdXRgKTtcbiAgICAgICAgdGhpcy5fc2VsZWN0TGF5b3V0ID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuZm9ybUJsb2NrICYmIHRoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lKSB7XG4gICAgICAgICAgICBjb25zdCBmb3JtSW5wdXQgPSB0aGlzLmZvcm1CbG9jay5xdWVyeVNlbGVjdG9yKGBbbmFtZT1cIiR7dGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWV9XCJdYCk7XG4gICAgICAgICAgICBpZiAoZm9ybUlucHV0KSB7XG4gICAgICAgICAgICAgICAgZm9ybUlucHV0LnZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgZm9ybUlucHV0LnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubG9hZGVkVXNlckltYWdlID0gbnVsbDtcbiAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aEFpID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBbbGF5b3V0c10g0KDQtdC00LDQutGC0LjRgNC+0LLQsNC90LjQtSDQvtGC0LzQtdC90LXQvdC+YCk7XG4gICAgfVxuICAgIGluaXRBaUJ1dHRvbnMoKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNoYW5nZUxvYWRXaXRoQWkoKTtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAndGFibGUnO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlTG9hZFdpdGhBaSh0cnVlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAndGFibGUnO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlTG9hZFdpdGhBaShmYWxzZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIGhpZGVBaUJ1dHRvbnMoKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IHRydWU7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24pIHtcbiAgICAgICAgICAgICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24ucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudCkuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBzaG93QWlCdXR0b25zKCkge1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uKSB7XG4gICAgICAgICAgICAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uLnBhcmVudEVsZW1lbnQ/LnBhcmVudEVsZW1lbnQ/LnBhcmVudEVsZW1lbnQpLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBsb2FkVXNlckltYWdlKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkIHVzZXIgaW1hZ2VdIHN0YXJ0aW5nIHVzZXIgaW1hZ2UgdXBsb2FkJyk7XG4gICAgICAgIHRoaXMuaW5pdEFpQnV0dG9ucygpO1xuICAgICAgICB0aGlzLnNob3dBaUJ1dHRvbnMoKTtcbiAgICAgICAgY29uc3QgZmlsZUlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgZmlsZUlucHV0LnR5cGUgPSAnZmlsZSc7XG4gICAgICAgIGZpbGVJbnB1dC5hY2NlcHQgPSAnaW1hZ2UvKic7XG4gICAgICAgIGZpbGVJbnB1dC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBmaWxlSW5wdXQub25jaGFuZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSB0YXJnZXQuZmlsZXM/LlswXTtcbiAgICAgICAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZCB1c2VyIGltYWdlXSBmaWxlIHNlbGVjdGVkOicsIGZpbGUubmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlLnR5cGUuc3RhcnRzV2l0aCgnaW1hZ2UvJykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbdXBsb2FkIHVzZXIgaW1hZ2VdIHNlbGVjdGVkIGZpbGUgaXMgbm90IGFuIGltYWdlJyk7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCfQn9C+0LbQsNC70YPQudGB0YLQsCwg0LLRi9Cx0LXRgNC40YLQtSDRhNCw0LnQuyDQuNC30L7QsdGA0LDQttC10L3QuNGPJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgICAgICByZWFkZXIub25sb2FkID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VVcmwgPSBlLnRhcmdldD8ucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkIHVzZXIgaW1hZ2VdIGZpbGUgbG9hZGVkIGFzIGRhdGEgVVJMJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlRGF0YSA9IGF3YWl0IHRoaXMuZ2V0SW1hZ2VEYXRhKGltYWdlVXJsKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRVc2VyVXBsb2FkSW1hZ2UoaW1hZ2VEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZCB1c2VyIGltYWdlXSBpbWFnZSBsYXlvdXQgYWRkZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZWFkZXIub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3VwbG9hZCB1c2VyIGltYWdlXSBlcnJvciByZWFkaW5nIGZpbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ9Ce0YjQuNCx0LrQsCDQv9GA0Lgg0LfQsNCz0YDRg9C30LrQtSDRhNCw0LnQu9CwJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChmaWxlSW5wdXQpO1xuICAgICAgICBmaWxlSW5wdXQuY2xpY2soKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChmaWxlSW5wdXQpO1xuICAgIH1cbiAgICBzZXRVc2VyVXBsb2FkSW1hZ2UoaW1hZ2UpIHtcbiAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBpbWFnZTtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yVXBsb2FkVmlld0Jsb2NrKSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvclVwbG9hZFZpZXdCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIGNvbnN0IGltYWdlQmxvY2sgPSBnZXRMYXN0Q2hpbGQodGhpcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2spO1xuICAgICAgICAgICAgaWYgKGltYWdlQmxvY2spIHtcbiAgICAgICAgICAgICAgICBpbWFnZUJsb2NrLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IGB1cmwoJHtpbWFnZX0pYDtcbiAgICAgICAgICAgICAgICBpbWFnZUJsb2NrLnN0eWxlLmJhY2tncm91bmRTaXplID0gJ2NvbnRhaW4nO1xuICAgICAgICAgICAgICAgIGltYWdlQmxvY2suc3R5bGUuYmFja2dyb3VuZFBvc2l0aW9uID0gJ2NlbnRlcic7XG4gICAgICAgICAgICAgICAgaW1hZ2VCbG9jay5zdHlsZS5iYWNrZ3JvdW5kUmVwZWF0ID0gJ25vLXJlcGVhdCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmVzZXRVc2VyVXBsb2FkSW1hZ2UoKSB7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvclVwbG9hZFZpZXdCbG9jaykge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxvYWRlZFVzZXJJbWFnZSA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRDYW5jZWxCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRDYW5jZWxCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkIGltYWdlIGJ1dHRvbl0gY2FuY2VsIGJ1dHRvbiBjbGlja2VkJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW5jZWxFZGl0TGF5b3V0KCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIGNoYW5nZUxvYWRXaXRoQWkodmFsdWUgPSBmYWxzZSkge1xuICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWkgPSB2YWx1ZTtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbiAmJiB0aGlzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24pIHtcbiAgICAgICAgICAgIGNvbnN0IGJ1dHRvbldpdGhBaSA9IHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbjtcbiAgICAgICAgICAgIGNvbnN0IGJ1dHRvbldpdGhvdXRBaSA9IHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbjtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpeEJ1dHRvbldpdGhBaSA9IGdldExhc3RDaGlsZChidXR0b25XaXRoQWkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpeEJ1dHRvbldpdGhvdXRBaSA9IGdldExhc3RDaGlsZChidXR0b25XaXRob3V0QWkpO1xuICAgICAgICAgICAgICAgIGlmIChmaXhCdXR0b25XaXRoQWkpIHtcbiAgICAgICAgICAgICAgICAgICAgZml4QnV0dG9uV2l0aEFpLnN0eWxlLmJvcmRlckNvbG9yID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmaXhCdXR0b25XaXRob3V0QWkpIHtcbiAgICAgICAgICAgICAgICAgICAgZml4QnV0dG9uV2l0aG91dEFpLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmMmYyZjInO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpeEJ1dHRvbldpdGhBaSA9IGdldExhc3RDaGlsZChidXR0b25XaXRoQWkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpeEJ1dHRvbldpdGhvdXRBaSA9IGdldExhc3RDaGlsZChidXR0b25XaXRob3V0QWkpO1xuICAgICAgICAgICAgICAgIGlmIChmaXhCdXR0b25XaXRoQWkpIHtcbiAgICAgICAgICAgICAgICAgICAgZml4QnV0dG9uV2l0aEFpLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmMmYyZjInO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZml4QnV0dG9uV2l0aG91dEFpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpeEJ1dHRvbldpdGhvdXRBaS5zdHlsZS5ib3JkZXJDb2xvciA9ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBsb2FkSW1hZ2Uoc3JjKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIGltZy5jcm9zc09yaWdpbiA9ICdhbm9ueW1vdXMnO1xuICAgICAgICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHJlc29sdmUoaW1nKTtcbiAgICAgICAgICAgIGltZy5vbmVycm9yID0gcmVqZWN0O1xuICAgICAgICAgICAgaW1nLnNyYyA9IHNyYztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldFF1YW50aXR5KCkge1xuICAgICAgICBpZiAoIXRoaXMucXVhbnRpdHlGb3JtQmxvY2spXG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgY29uc3QgZm9ybSA9IHRoaXMucXVhbnRpdHlGb3JtQmxvY2sucXVlcnlTZWxlY3RvcignZm9ybScpO1xuICAgICAgICBjb25zdCBpbnB1dCA9IGZvcm0/LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJxdWFudGl0eVwiXScpO1xuICAgICAgICBpZiAoIWlucHV0KVxuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIHJldHVybiBwYXJzZUludChpbnB1dC52YWx1ZSkgfHwgMTtcbiAgICB9XG4gICAgZ2V0U3VtKCkge1xuICAgICAgICBjb25zdCBoYXNGcm9udCA9IHRoaXMubGF5b3V0cy5zb21lKGxheW91dCA9PiBsYXlvdXQudmlldyA9PT0gJ2Zyb250Jyk7XG4gICAgICAgIGNvbnN0IGhhc0JhY2sgPSB0aGlzLmxheW91dHMuc29tZShsYXlvdXQgPT4gbGF5b3V0LnZpZXcgPT09ICdiYWNrJyk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdClcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICBjb25zdCBwcmljZSA9IGhhc0JhY2sgJiYgaGFzRnJvbnRcbiAgICAgICAgICAgID8gcHJvZHVjdC5kb3VibGVTaWRlZFByaWNlXG4gICAgICAgICAgICA6IHByb2R1Y3QucHJpY2U7XG4gICAgICAgIHJldHVybiBwcmljZTtcbiAgICB9XG4gICAgdXBkYXRlU3VtKCkge1xuICAgICAgICBpZiAoIXRoaXMuZWRpdG9yU3VtQmxvY2spXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHN1bSA9IHRoaXMuZ2V0U3VtKCk7XG4gICAgICAgIGNvbnN0IHN1bVRleHQgPSBnZXRMYXN0Q2hpbGQodGhpcy5lZGl0b3JTdW1CbG9jayk7XG4gICAgICAgIGlmIChzdW1UZXh0KSB7XG4gICAgICAgICAgICBzdW1UZXh0LmlubmVyVGV4dCA9IHN1bS50b1N0cmluZygpICsgJyDigr0nO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uKSB7XG4gICAgICAgICAgICBjb25zdCBidXR0b25CbG9jayA9IGdldExhc3RDaGlsZCh0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uKTtcbiAgICAgICAgICAgIGlmIChidXR0b25CbG9jaykge1xuICAgICAgICAgICAgICAgIGJ1dHRvbkJsb2NrLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHN1bSA9PT0gMCA/ICdyZ2IoMTIxIDEyMSAxMjEpJyA6ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGxvYWRQcm9kdWN0KCkge1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QgfHwgIXByb2R1Y3QucHJpbnRDb25maWcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW3Byb2R1Y3RdIHByb2R1Y3Qgb3IgcHJpbnRDb25maWcgbm90IGZvdW5kJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jbGVhckFsbENhbnZhcygpO1xuICAgICAgICBmb3IgKGNvbnN0IHByaW50Q29uZmlnIG9mIHByb2R1Y3QucHJpbnRDb25maWcpIHtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQ2FudmFzRm9yU2lkZShwcmludENvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRBY3RpdmVTaWRlKHRoaXMuX3NlbGVjdFNpZGUpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCBmYWxzZSk7XG4gICAgICAgIH0sIDEwMCk7XG4gICAgfVxuICAgIGNsZWFyQWxsQ2FudmFzKCkge1xuICAgICAgICBpZiAodGhpcy5jYW52YXNlc0NvbnRhaW5lcikge1xuICAgICAgICAgICAgdGhpcy5jYW52YXNlc0NvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNhbnZhc2VzLmZvckVhY2goY2FudmFzID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2FudmFzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbY2FudmFzXSDQntGI0LjQsdC60LAg0L7Rh9C40YHRgtC60LggY2FudmFzOicsIGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNhbnZhc2VzID0gW107XG4gICAgICAgIHRoaXMubGF5ZXJzQ2FudmFzZXMgPSBbXTtcbiAgICAgICAgdGhpcy5hY3RpdmVDYW52YXMgPSBudWxsO1xuICAgIH1cbiAgICBjcmVhdGVDYW52YXNGb3JTaWRlKHByaW50Q29uZmlnKSB7XG4gICAgICAgIGlmICghdGhpcy5jYW52YXNlc0NvbnRhaW5lcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NhbnZhc10gY2FudmFzZXNDb250YWluZXIg0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L0nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsYXllcnNDYW52YXNCbG9jayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBsYXllcnNDYW52YXNCbG9jay5pZCA9ICdsYXllcnMtLScgKyBwcmludENvbmZpZy5zaWRlO1xuICAgICAgICBsYXllcnNDYW52YXNCbG9jay5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItcG9zaXRpb24nKTtcbiAgICAgICAgbGF5ZXJzQ2FudmFzQmxvY2suc2V0QXR0cmlidXRlKCdyZWYnLCBwcmludENvbmZpZy5zaWRlKTtcbiAgICAgICAgbGF5ZXJzQ2FudmFzQmxvY2suc3R5bGUuekluZGV4ID0gJzcnO1xuICAgICAgICB0aGlzLmNhbnZhc2VzQ29udGFpbmVyLmFwcGVuZENoaWxkKGxheWVyc0NhbnZhc0Jsb2NrKTtcbiAgICAgICAgY29uc3QgbGF5ZXJzQ2FudmFzID0gbmV3IGZhYnJpYy5TdGF0aWNDYW52YXMobGF5ZXJzQ2FudmFzQmxvY2ssIHtcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCxcbiAgICAgICAgfSk7XG4gICAgICAgIGxheWVyc0NhbnZhcy5zaWRlID0gcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgbGF5ZXJzQ2FudmFzLm5hbWUgPSAnc3RhdGljLScgKyBwcmludENvbmZpZy5zaWRlO1xuICAgICAgICBjb25zdCBlZGl0YWJsZUNhbnZhc0Jsb2NrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGVkaXRhYmxlQ2FudmFzQmxvY2suaWQgPSAnZWRpdGFibGUtLScgKyBwcmludENvbmZpZy5zaWRlO1xuICAgICAgICBlZGl0YWJsZUNhbnZhc0Jsb2NrLnNldEF0dHJpYnV0ZSgncmVmJywgcHJpbnRDb25maWcuc2lkZSk7XG4gICAgICAgIGVkaXRhYmxlQ2FudmFzQmxvY2suY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXBvc2l0aW9uJyk7XG4gICAgICAgIGVkaXRhYmxlQ2FudmFzQmxvY2suc3R5bGUuekluZGV4ID0gJzknO1xuICAgICAgICB0aGlzLmNhbnZhc2VzQ29udGFpbmVyLmFwcGVuZENoaWxkKGVkaXRhYmxlQ2FudmFzQmxvY2spO1xuICAgICAgICBjb25zdCBlZGl0YWJsZUNhbnZhcyA9IG5ldyBmYWJyaWMuQ2FudmFzKGVkaXRhYmxlQ2FudmFzQmxvY2ssIHtcbiAgICAgICAgICAgIGNvbnRyb2xzQWJvdmVPdmVybGF5OiB0cnVlLFxuICAgICAgICAgICAgd2lkdGg6IHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0LFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgdW5pZm9ybVNjYWxpbmc6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIGVkaXRhYmxlQ2FudmFzLnNpZGUgPSBwcmludENvbmZpZy5zaWRlO1xuICAgICAgICBlZGl0YWJsZUNhbnZhcy5uYW1lID0gJ2VkaXRhYmxlLScgKyBwcmludENvbmZpZy5zaWRlO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzLnB1c2gobGF5ZXJzQ2FudmFzKTtcbiAgICAgICAgdGhpcy5jYW52YXNlcy5wdXNoKGVkaXRhYmxlQ2FudmFzKTtcbiAgICAgICAgaWYgKHRoaXMuY2FudmFzZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUNhbnZhcyA9IGVkaXRhYmxlQ2FudmFzO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5pdE1haW5DYW52YXMoZWRpdGFibGVDYW52YXMsIHByaW50Q29uZmlnKTtcbiAgICB9XG4gICAgaW5pdE1haW5DYW52YXMoY2FudmFzLCBwcmludENvbmZpZykge1xuICAgICAgICBpZiAoIWNhbnZhcyB8fCAhKGNhbnZhcyBpbnN0YW5jZW9mIGZhYnJpYy5DYW52YXMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tjYW52YXNdIGNhbnZhcyDQvdC1INCy0LDQu9C40LTQtdC9Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgd2lkdGggPSBwcmludENvbmZpZy5zaXplLndpZHRoIC8gNjAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aDtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gcHJpbnRDb25maWcuc2l6ZS5oZWlnaHQgLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodDtcbiAgICAgICAgY29uc3QgbGVmdCA9ICh0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoIC0gd2lkdGgpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi54IC8gMTAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCk7XG4gICAgICAgIGNvbnN0IHRvcCA9ICh0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCAtIGhlaWdodCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnkgLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCk7XG4gICAgICAgIGNvbnN0IGNsaXBBcmVhID0gbmV3IGZhYnJpYy5SZWN0KHtcbiAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgICAgbGVmdCxcbiAgICAgICAgICAgIHRvcCxcbiAgICAgICAgICAgIGZpbGw6ICdyZ2IoMjU1LCAwLCAwKScsXG4gICAgICAgICAgICBuYW1lOiAnYXJlYTpjbGlwJyxcbiAgICAgICAgICAgIGV2ZW50ZWQ6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYXJlYUJvcmRlciA9IG5ldyBmYWJyaWMuUmVjdCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGggLSAzLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQgLSAzLFxuICAgICAgICAgICAgbGVmdCxcbiAgICAgICAgICAgIHRvcCxcbiAgICAgICAgICAgIGZpbGw6ICdyZ2JhKDAsMCwwLDApJyxcbiAgICAgICAgICAgIHN0cm9rZVdpZHRoOiAzLFxuICAgICAgICAgICAgc3Ryb2tlOiAncmdiKDI1NCwgOTQsIDU4KScsXG4gICAgICAgICAgICBuYW1lOiAnYXJlYTpib3JkZXInLFxuICAgICAgICAgICAgb3BhY2l0eTogMC4zLFxuICAgICAgICAgICAgZXZlbnRlZDogZmFsc2UsXG4gICAgICAgICAgICBzZWxlY3RhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIGhhc0NvbnRyb2xzOiBmYWxzZSxcbiAgICAgICAgICAgIHN0cm9rZURhc2hBcnJheTogWzUsIDVdLFxuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLmFkZChhcmVhQm9yZGVyKTtcbiAgICAgICAgY2FudmFzLmNsaXBQYXRoID0gY2xpcEFyZWE7XG4gICAgICAgIHRoaXMuc2V0dXBDYW52YXNFdmVudEhhbmRsZXJzKGNhbnZhcywgcHJpbnRDb25maWcpO1xuICAgIH1cbiAgICBzZXR1cENhbnZhc0V2ZW50SGFuZGxlcnMoY2FudmFzLCBwcmludENvbmZpZykge1xuICAgICAgICBjYW52YXMub24oJ21vdXNlOmRvd24nLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBib3JkZXIgPSB0aGlzLmdldE9iamVjdCgnYXJlYTpib3JkZXInLCBjYW52YXMpO1xuICAgICAgICAgICAgaWYgKGJvcmRlcikge1xuICAgICAgICAgICAgICAgIGJvcmRlci5zZXQoJ29wYWNpdHknLCAwLjgpO1xuICAgICAgICAgICAgICAgIGNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjYW52YXMub24oJ21vdXNlOnVwJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYm9yZGVyID0gdGhpcy5nZXRPYmplY3QoJ2FyZWE6Ym9yZGVyJywgY2FudmFzKTtcbiAgICAgICAgICAgIGlmIChib3JkZXIpIHtcbiAgICAgICAgICAgICAgICBib3JkZXIuc2V0KCdvcGFjaXR5JywgMC4zKTtcbiAgICAgICAgICAgICAgICBjYW52YXMucmVxdWVzdFJlbmRlckFsbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLm9uKCdvYmplY3Q6cm90YXRpbmcnLCAoZSkgPT4ge1xuICAgICAgICAgICAgaWYgKGUudGFyZ2V0Py5hbmdsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYW5nbGVzID0gWzAsIDkwLCAxODAsIDI3MF07XG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEFuZ2xlID0gZS50YXJnZXQuYW5nbGUgJSAzNjA7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzbmFwQW5nbGUgb2YgYW5nbGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhjdXJyZW50QW5nbGUgLSBzbmFwQW5nbGUpIDwgNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZS50YXJnZXQucm90YXRlKHNuYXBBbmdsZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjYW52YXMub24oJ29iamVjdDptb3ZpbmcnLCAoZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVPYmplY3RNb3ZpbmcoZSwgY2FudmFzLCBwcmludENvbmZpZyk7XG4gICAgICAgIH0pO1xuICAgICAgICBjYW52YXMub24oJ29iamVjdDptb2RpZmllZCcsIChlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZU9iamVjdE1vZGlmaWVkKGUsIGNhbnZhcywgcHJpbnRDb25maWcpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaGFuZGxlT2JqZWN0TW92aW5nKGUsIGNhbnZhcywgcHJpbnRDb25maWcpIHtcbiAgICAgICAgaWYgKCFlLnRhcmdldCB8fCBlLnRhcmdldC5uYW1lID09PSAnYXJlYTpib3JkZXInIHx8IGUudGFyZ2V0Lm5hbWUgPT09ICdhcmVhOmNsaXAnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGF5b3V0ID0gdGhpcy5sYXlvdXRzLmZpbmQobCA9PiBsLmlkID09PSBlLnRhcmdldC5uYW1lKTtcbiAgICAgICAgaWYgKCFsYXlvdXQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHdpZHRoID0gcHJpbnRDb25maWcuc2l6ZS53aWR0aCAvIDYwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGg7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IHByaW50Q29uZmlnLnNpemUuaGVpZ2h0IC8gNjAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQ7XG4gICAgICAgIGNvbnN0IGxlZnQgPSBNYXRoLnJvdW5kKCh0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoIC0gd2lkdGgpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi54IC8gMTAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCkpO1xuICAgICAgICBjb25zdCB0b3AgPSBNYXRoLnJvdW5kKCh0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCAtIGhlaWdodCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnkgLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCkpO1xuICAgICAgICBjb25zdCBvYmpXaWR0aCA9IGUudGFyZ2V0LndpZHRoICogZS50YXJnZXQuc2NhbGVYO1xuICAgICAgICBjb25zdCBvYmpIZWlnaHQgPSBlLnRhcmdldC5oZWlnaHQgKiBlLnRhcmdldC5zY2FsZVk7XG4gICAgICAgIGNvbnN0IG9iakNlbnRlckxlZnQgPSBlLnRhcmdldC5sZWZ0ICsgb2JqV2lkdGggLyAyO1xuICAgICAgICBjb25zdCBvYmpDZW50ZXJUb3AgPSBlLnRhcmdldC50b3AgKyBvYmpIZWlnaHQgLyAyO1xuICAgICAgICBjb25zdCBuZWFyWCA9IE1hdGguYWJzKG9iakNlbnRlckxlZnQgLSAobGVmdCArIHdpZHRoIC8gMikpIDwgNztcbiAgICAgICAgY29uc3QgbmVhclkgPSBNYXRoLmFicyhvYmpDZW50ZXJUb3AgLSAodG9wICsgaGVpZ2h0IC8gMikpIDwgNztcbiAgICAgICAgaWYgKG5lYXJYKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dHdWlkZWxpbmUoY2FudmFzLCAndmVydGljYWwnLCBsZWZ0ICsgd2lkdGggLyAyLCAwLCBsZWZ0ICsgd2lkdGggLyAyLCB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCk7XG4gICAgICAgICAgICBlLnRhcmdldC5zZXQoeyBsZWZ0OiBsZWZ0ICsgd2lkdGggLyAyIC0gb2JqV2lkdGggLyAyIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5oaWRlR3VpZGVsaW5lKGNhbnZhcywgJ3ZlcnRpY2FsJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5lYXJZKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dHdWlkZWxpbmUoY2FudmFzLCAnaG9yaXpvbnRhbCcsIDAsIHRvcCArIGhlaWdodCAvIDIsIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgsIHRvcCArIGhlaWdodCAvIDIpO1xuICAgICAgICAgICAgZS50YXJnZXQuc2V0KHsgdG9wOiB0b3AgKyBoZWlnaHQgLyAyIC0gb2JqSGVpZ2h0IC8gMiB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaGlkZUd1aWRlbGluZShjYW52YXMsICdob3Jpem9udGFsJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaGFuZGxlT2JqZWN0TW9kaWZpZWQoZSwgY2FudmFzLCBwcmludENvbmZpZykge1xuICAgICAgICBjb25zdCBvYmplY3QgPSBlLnRhcmdldDtcbiAgICAgICAgaWYgKCFvYmplY3QpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuaGlkZUd1aWRlbGluZShjYW52YXMsICd2ZXJ0aWNhbCcpO1xuICAgICAgICB0aGlzLmhpZGVHdWlkZWxpbmUoY2FudmFzLCAnaG9yaXpvbnRhbCcpO1xuICAgICAgICBjb25zdCBsYXlvdXQgPSB0aGlzLmxheW91dHMuZmluZChsID0+IGwuaWQgPT09IG9iamVjdC5uYW1lKTtcbiAgICAgICAgaWYgKCFsYXlvdXQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHdpZHRoID0gcHJpbnRDb25maWcuc2l6ZS53aWR0aCAvIDYwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGg7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IHByaW50Q29uZmlnLnNpemUuaGVpZ2h0IC8gNjAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQ7XG4gICAgICAgIGNvbnN0IGxlZnQgPSBNYXRoLnJvdW5kKCh0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoIC0gd2lkdGgpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi54IC8gMTAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCkpO1xuICAgICAgICBjb25zdCB0b3AgPSBNYXRoLnJvdW5kKCh0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCAtIGhlaWdodCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnkgLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCkpO1xuICAgICAgICBsYXlvdXQucG9zaXRpb24ueCA9IChvYmplY3QubGVmdCAtIGxlZnQpIC8gd2lkdGg7XG4gICAgICAgIGxheW91dC5wb3NpdGlvbi55ID0gKG9iamVjdC50b3AgLSB0b3ApIC8gaGVpZ2h0O1xuICAgICAgICBsYXlvdXQuc2l6ZSA9IG9iamVjdC5zY2FsZVg7XG4gICAgICAgIGxheW91dC5hc3BlY3RSYXRpbyA9IG9iamVjdC5zY2FsZVkgLyBvYmplY3Quc2NhbGVYO1xuICAgICAgICBsYXlvdXQuYW5nbGUgPSBvYmplY3QuYW5nbGU7XG4gICAgICAgIHRoaXMuc2F2ZUxheW91dHMoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW2xheWVyc10g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPINGB0LvQvtGR0LI6JywgZXJyKSk7XG4gICAgfVxuICAgIHNob3dHdWlkZWxpbmUoY2FudmFzLCB0eXBlLCB4MSwgeTEsIHgyLCB5Mikge1xuICAgICAgICBjb25zdCBuYW1lID0gYGd1aWRlbGluZToke3R5cGV9YDtcbiAgICAgICAgbGV0IGd1aWRlbGluZSA9IHRoaXMuZ2V0T2JqZWN0KG5hbWUsIGNhbnZhcyk7XG4gICAgICAgIGlmICghZ3VpZGVsaW5lKSB7XG4gICAgICAgICAgICBndWlkZWxpbmUgPSBuZXcgZmFicmljLkxpbmUoW3gxLCB5MSwgeDIsIHkyXSwge1xuICAgICAgICAgICAgICAgIHN0cm9rZTogJ3JnYigyNTQsIDk0LCA1OCknLFxuICAgICAgICAgICAgICAgIHN0cm9rZVdpZHRoOiAyLFxuICAgICAgICAgICAgICAgIHN0cm9rZURhc2hBcnJheTogWzUsIDVdLFxuICAgICAgICAgICAgICAgIHNlbGVjdGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGV2ZW50ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChndWlkZWxpbmUpIHtcbiAgICAgICAgICAgICAgICBjYW52YXMuYWRkKGd1aWRlbGluZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaGlkZUd1aWRlbGluZShjYW52YXMsIHR5cGUpIHtcbiAgICAgICAgY29uc3QgZ3VpZGVsaW5lID0gdGhpcy5nZXRPYmplY3QoYGd1aWRlbGluZToke3R5cGV9YCwgY2FudmFzKTtcbiAgICAgICAgaWYgKGd1aWRlbGluZSkge1xuICAgICAgICAgICAgY2FudmFzLnJlbW92ZShndWlkZWxpbmUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldE9iamVjdChuYW1lLCBjYW52YXMpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0Q2FudmFzID0gY2FudmFzIHx8IHRoaXMuYWN0aXZlQ2FudmFzIHx8IHRoaXMuY2FudmFzZXNbMF07XG4gICAgICAgIGlmICghdGFyZ2V0Q2FudmFzKVxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIHRhcmdldENhbnZhcy5nZXRPYmplY3RzKCkuZmluZChvYmogPT4gb2JqLm5hbWUgPT09IG5hbWUpO1xuICAgIH1cbiAgICBzZXRBY3RpdmVTaWRlKHNpZGUpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2NhbnZhc10g0KPRgdGC0LDQvdC+0LLQutCwINCw0LrRgtC40LLQvdC+0Lkg0YHRgtC+0YDQvtC90Ys6Jywgc2lkZSk7XG4gICAgICAgIHRoaXMuY2FudmFzZXMuZm9yRWFjaChjYW52YXMgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2FudmFzRWxlbWVudCA9IGNhbnZhcy5nZXRFbGVtZW50KCk7XG4gICAgICAgICAgICBjb25zdCBjb250YWluZXJFbGVtZW50ID0gY2FudmFzRWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgaWYgKGNhbnZhcy5zaWRlID09PSBzaWRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDYW52YXMgPSBjYW52YXM7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lckVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYW52YXNFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lckVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhbnZhc0VsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubGF5ZXJzQ2FudmFzZXMuZm9yRWFjaChsYXllcnNDYW52YXMgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2FudmFzRWxlbWVudCA9IGxheWVyc0NhbnZhcy5nZXRFbGVtZW50KCk7XG4gICAgICAgICAgICBjYW52YXNFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBsYXllcnNDYW52YXMuc2lkZSA9PT0gc2lkZSA/ICdibG9jaycgOiAnbm9uZSc7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9zZWxlY3RTaWRlID0gc2lkZTtcbiAgICB9XG4gICAgYXN5bmMgYWRkTGF5b3V0VG9DYW52YXMobGF5b3V0KSB7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IHRoaXMuY2FudmFzZXMuZmluZChjID0+IGMuc2lkZSA9PT0gbGF5b3V0LnZpZXcpO1xuICAgICAgICBpZiAoIWNhbnZhcykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbY2FudmFzXSBjYW52YXMg0LTQu9GPICR7bGF5b3V0LnZpZXd9INC90LUg0L3QsNC50LTQtdC9YCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBwcmludENvbmZpZyA9IHByb2R1Y3QucHJpbnRDb25maWcuZmluZChwYyA9PiBwYy5zaWRlID09PSBsYXlvdXQudmlldyk7XG4gICAgICAgIGlmICghcHJpbnRDb25maWcpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHdpZHRoID0gcHJpbnRDb25maWcuc2l6ZS53aWR0aCAvIDYwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGg7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IHByaW50Q29uZmlnLnNpemUuaGVpZ2h0IC8gNjAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQ7XG4gICAgICAgIGNvbnN0IGxlZnQgPSBNYXRoLnJvdW5kKCh0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoIC0gd2lkdGgpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi54IC8gMTAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCkpO1xuICAgICAgICBjb25zdCB0b3AgPSBNYXRoLnJvdW5kKCh0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCAtIGhlaWdodCkgLyAyICsgKHByaW50Q29uZmlnLnBvc2l0aW9uLnkgLyAxMDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCkpO1xuICAgICAgICBjb25zdCBhYnNvbHV0ZUxlZnQgPSBsZWZ0ICsgKHdpZHRoICogbGF5b3V0LnBvc2l0aW9uLngpO1xuICAgICAgICBjb25zdCBhYnNvbHV0ZVRvcCA9IHRvcCArIChoZWlnaHQgKiBsYXlvdXQucG9zaXRpb24ueSk7XG4gICAgICAgIGlmIChsYXlvdXQuaXNJbWFnZUxheW91dCgpKSB7XG4gICAgICAgICAgICBjb25zdCBpbWFnZSA9IG5ldyBmYWJyaWMuSW1hZ2UoYXdhaXQgdGhpcy5sb2FkSW1hZ2UobGF5b3V0LnVybCkpO1xuICAgICAgICAgICAgaWYgKGxheW91dC5zaXplID09PSAxICYmIGltYWdlLndpZHRoID4gd2lkdGgpIHtcbiAgICAgICAgICAgICAgICBsYXlvdXQuc2l6ZSA9IHdpZHRoIC8gaW1hZ2Uud2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbWFnZS5zZXQoe1xuICAgICAgICAgICAgICAgIGxlZnQ6IGFic29sdXRlTGVmdCxcbiAgICAgICAgICAgICAgICB0b3A6IGFic29sdXRlVG9wLFxuICAgICAgICAgICAgICAgIG5hbWU6IGxheW91dC5pZCxcbiAgICAgICAgICAgICAgICBsYXlvdXRVcmw6IGxheW91dC51cmwsXG4gICAgICAgICAgICAgICAgc2NhbGVYOiBsYXlvdXQuc2l6ZSxcbiAgICAgICAgICAgICAgICBzY2FsZVk6IGxheW91dC5zaXplICogbGF5b3V0LmFzcGVjdFJhdGlvLFxuICAgICAgICAgICAgICAgIGFuZ2xlOiBsYXlvdXQuYW5nbGUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNhbnZhcy5hZGQoaW1hZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGxheW91dC5pc1RleHRMYXlvdXQoKSkge1xuICAgICAgICAgICAgY29uc3QgdGV4dCA9IG5ldyBmYWJyaWMuVGV4dChsYXlvdXQudGV4dCwge1xuICAgICAgICAgICAgICAgIGZvbnRGYW1pbHk6IGxheW91dC5mb250LmZhbWlseSxcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogbGF5b3V0LmZvbnQuc2l6ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGV4dC5zZXQoe1xuICAgICAgICAgICAgICAgIHRvcDogYWJzb2x1dGVUb3AsXG4gICAgICAgICAgICAgICAgbGVmdDogYWJzb2x1dGVMZWZ0LFxuICAgICAgICAgICAgICAgIG5hbWU6IGxheW91dC5pZCxcbiAgICAgICAgICAgICAgICBzY2FsZVg6IGxheW91dC5zaXplLFxuICAgICAgICAgICAgICAgIHNjYWxlWTogbGF5b3V0LnNpemUgKiBsYXlvdXQuYXNwZWN0UmF0aW8sXG4gICAgICAgICAgICAgICAgYW5nbGU6IGxheW91dC5hbmdsZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2FudmFzLmFkZCh0ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGVMYXlvdXRzKCkge1xuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlQ2FudmFzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHNGb3JTaWRlKHRoaXMuX3NlbGVjdFNpZGUpO1xuICAgIH1cbiAgICB1cGRhdGVMYXlvdXRzRm9yU2lkZShzaWRlKSB7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IHRoaXMuY2FudmFzZXMuZmluZChjID0+IGMuc2lkZSA9PT0gc2lkZSk7XG4gICAgICAgIGlmICghY2FudmFzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBvYmplY3RzID0gY2FudmFzLmdldE9iamVjdHMoKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0c1RvUmVtb3ZlID0gb2JqZWN0c1xuICAgICAgICAgICAgLmZpbHRlcihvYmogPT4gb2JqLm5hbWUgIT09ICdhcmVhOmJvcmRlcicgJiYgb2JqLm5hbWUgIT09ICdhcmVhOmNsaXAnICYmICFvYmoubmFtZT8uc3RhcnRzV2l0aCgnZ3VpZGVsaW5lJykpXG4gICAgICAgICAgICAuZmlsdGVyKG9iaiA9PiAhdGhpcy5sYXlvdXRzLmZpbmQobGF5b3V0ID0+IGxheW91dC5pZCA9PT0gb2JqLm5hbWUpKTtcbiAgICAgICAgb2JqZWN0c1RvUmVtb3ZlLmZvckVhY2gob2JqID0+IHtcbiAgICAgICAgICAgIGNhbnZhcy5yZW1vdmUob2JqKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGxheW91dHNGb3JTaWRlID0gdGhpcy5sYXlvdXRzLmZpbHRlcihsYXlvdXQgPT4gbGF5b3V0LnZpZXcgPT09IHNpZGUpO1xuICAgICAgICBjb25zdCBvYmplY3RzVG9VcGRhdGUgPSBbXTtcbiAgICAgICAgY29uc3Qgb2JqZWN0c1RvQWRkID0gW107XG4gICAgICAgIGxheW91dHNGb3JTaWRlLmZvckVhY2gobGF5b3V0ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nT2JqID0gb2JqZWN0cy5maW5kKG9iaiA9PiBvYmoubmFtZSA9PT0gbGF5b3V0LmlkKTtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ09iaikge1xuICAgICAgICAgICAgICAgIGlmIChsYXlvdXQuaXNJbWFnZUxheW91dCgpICYmIGV4aXN0aW5nT2JqLmxheW91dFVybCAhPT0gbGF5b3V0LnVybCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbY2FudmFzXSBMYXlvdXQgJHtsYXlvdXQuaWR9INC40LfQvNC10L3QuNC70YHRjywg0YLRgNC10LHRg9C10YLRgdGPINC+0LHQvdC+0LLQu9C10L3QuNC1YCk7XG4gICAgICAgICAgICAgICAgICAgIG9iamVjdHNUb1VwZGF0ZS5wdXNoKGxheW91dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgb2JqZWN0c1RvQWRkLnB1c2gobGF5b3V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIG9iamVjdHNUb1VwZGF0ZS5mb3JFYWNoKGxheW91dCA9PiB7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ09iaiA9IG9iamVjdHMuZmluZChvYmogPT4gb2JqLm5hbWUgPT09IGxheW91dC5pZCk7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdPYmopIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbY2FudmFzXSDQo9C00LDQu9GP0LXQvCDRgdGC0LDRgNGL0Lkg0L7QsdGK0LXQutGCINC00LvRjyDQvtCx0L3QvtCy0LvQtdC90LjRjzogJHtsYXlvdXQuaWR9YCk7XG4gICAgICAgICAgICAgICAgY2FudmFzLnJlbW92ZShleGlzdGluZ09iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbY2FudmFzXSDQlNC+0LHQsNCy0LvRj9C10Lwg0L7QsdC90L7QstC70LXQvdC90YvQuSDQvtCx0YrQtdC60YI6ICR7bGF5b3V0LmlkfWApO1xuICAgICAgICAgICAgdGhpcy5hZGRMYXlvdXRUb0NhbnZhcyhsYXlvdXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgb2JqZWN0c1RvQWRkLmZvckVhY2gobGF5b3V0ID0+IHtcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5b3V0VG9DYW52YXMobGF5b3V0KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNhbnZhcy5yZW5kZXJBbGwoKTtcbiAgICB9XG4gICAgYXN5bmMgcHJlbG9hZEFsbE1vY2t1cHMoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1twcmVsb2FkXSDQndCw0YfQsNC70L4g0L/RgNC10LTQt9Cw0LPRgNGD0LfQutC4IG1vY2t1cHMnKTtcbiAgICAgICAgZm9yIChjb25zdCBwcm9kdWN0IG9mIHRoaXMucHJvZHVjdENvbmZpZ3MpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbW9ja3VwIG9mIHByb2R1Y3QubW9ja3Vwcykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vY2t1cERhdGFVcmwgPSBhd2FpdCB0aGlzLmdldEltYWdlRGF0YShtb2NrdXAudXJsKTtcbiAgICAgICAgICAgICAgICAgICAgbW9ja3VwLnVybCA9IG1vY2t1cERhdGFVcmw7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtwcmVsb2FkXSBNb2NrdXAg0LfQsNCz0YDRg9C20LXQvTogJHttb2NrdXAuY29sb3IubmFtZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtwcmVsb2FkXSDQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCBtb2NrdXAgJHttb2NrdXAudXJsfTpgLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1twcmVsb2FkXSDQn9GA0LXQtNC30LDQs9GA0YPQt9C60LAg0LfQsNCy0LXRgNGI0LXQvdCwJyk7XG4gICAgfVxuICAgIGFzeW5jIGdldEltYWdlRGF0YSh1cmwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9hZEFuZENvbnZlcnRJbWFnZSh1cmwpO1xuICAgIH1cbiAgICBhc3luYyB1cGxvYWRJbWFnZShmaWxlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWRdINCX0LDQs9GA0YPQt9C60LAg0YTQsNC50LvQsDonLCBmaWxlLm5hbWUpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGFVcmwgPSBlLnRhcmdldD8ucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWREYXRhVXJsID0gYXdhaXQgdGhpcy5nZXRJbWFnZURhdGEoZGF0YVVybCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWRdINCk0LDQudC7INGD0YHQv9C10YjQvdC+INC30LDQs9GA0YPQttC10L0nKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShjb252ZXJ0ZWREYXRhVXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1t1cGxvYWRdINCe0YjQuNCx0LrQsCDQvtCx0YDQsNCx0L7RgtC60Lgg0YTQsNC50LvQsDonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlYWRlci5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1t1cGxvYWRdINCe0YjQuNCx0LrQsCDRh9GC0LXQvdC40Y8g0YTQsNC50LvQsCcpO1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ9Cd0LUg0YPQtNCw0LvQvtGB0Ywg0L/RgNC+0YfQuNGC0LDRgtGMINGE0LDQudC7JykpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgdXBsb2FkSW1hZ2VUb1NlcnZlcihiYXNlNjQpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZF0g0JfQsNCz0YDRg9C30LrQsCDQuNC30L7QsdGA0LDQttC10L3QuNGPINC90LAg0YHQtdGA0LLQtdGAJyk7XG4gICAgICAgIGNvbnN0IHVzZXJJZCA9IGF3YWl0IHRoaXMuc3RvcmFnZU1hbmFnZXIuZ2V0VXNlcklkKCk7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goQVBJX0VORFBPSU5UUy5VUExPQURfSU1BR0UsIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBpbWFnZTogYmFzZTY0LCB1c2VyX2lkOiB1c2VySWQgfSksXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWRdINCY0LfQvtCx0YDQsNC20LXQvdC40LUg0LfQsNCz0YDRg9C20LXQvdC+INC90LAg0YHQtdGA0LLQtdGAOicsIGRhdGEuaW1hZ2VfdXJsKTtcbiAgICAgICAgcmV0dXJuIGRhdGEuaW1hZ2VfdXJsO1xuICAgIH1cbiAgICBnZXRQcm9kdWN0TmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKT8ucHJvZHVjdE5hbWUgfHwgJyc7XG4gICAgfVxuICAgIGNhcGl0YWxpemVGaXJzdExldHRlcihzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0cmluZy5zbGljZSgxKTtcbiAgICB9XG4gICAgZ2V0TW9ja3VwVXJsKHNpZGUpIHtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0KVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGNvbnN0IG1vY2t1cCA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG1vY2t1cCA9PiBtb2NrdXAuc2lkZSA9PT0gc2lkZSAmJiBtb2NrdXAuY29sb3IubmFtZSA9PT0gdGhpcy5fc2VsZWN0Q29sb3IubmFtZSk7XG4gICAgICAgIHJldHVybiBtb2NrdXAgPyBtb2NrdXAudXJsIDogbnVsbDtcbiAgICB9XG4gICAgYXN5bmMgZXhwb3J0QXJ0KHdpdGhNb2NrdXAgPSB0cnVlLCByZXNvbHV0aW9uID0gMTAyNCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgICAgY29uc3Qgc2lkZXNXaXRoTGF5ZXJzID0gdGhpcy5nZXRTaWRlc1dpdGhMYXllcnMoKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2V4cG9ydF0g0J3QsNC50LTQtdC90Ysg0YHRgtC+0YDQvtC90Ysg0YEg0YHQu9C+0Y/QvNC4OicsIHNpZGVzV2l0aExheWVycywgJyhmcm9udCDQv9C10YDQstGL0LkpJywgd2l0aE1vY2t1cCA/ICfRgSDQvNC+0LrQsNC/0L7QvCcgOiAn0LHQtdC3INC80L7QutCw0L/QsCcsIGDRgNCw0LfRgNC10YjQtdC90LjQtTogJHtyZXNvbHV0aW9ufXB4YCk7XG4gICAgICAgIGNvbnN0IGV4cG9ydFByb21pc2VzID0gc2lkZXNXaXRoTGF5ZXJzLm1hcChhc3luYyAoc2lkZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBleHBvcnRlZFNpZGUgPSBhd2FpdCB0aGlzLmV4cG9ydFNpZGUoc2lkZSwgd2l0aE1vY2t1cCwgcmVzb2x1dGlvbik7XG4gICAgICAgICAgICAgICAgaWYgKGV4cG9ydGVkU2lkZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQodGC0L7RgNC+0L3QsCAke3NpZGV9INGD0YHQv9C10YjQvdC+INGN0LrRgdC/0L7RgNGC0LjRgNC+0LLQsNC90LBgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgc2lkZSwgZGF0YTogZXhwb3J0ZWRTaWRlIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW2V4cG9ydF0g0J7RiNC40LHQutCwINC/0YDQuCDRjdC60YHQv9C+0YDRgtC1INGB0YLQvtGA0L7QvdGLICR7c2lkZX06YCwgZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBleHBvcnRlZFNpZGVzID0gYXdhaXQgUHJvbWlzZS5hbGwoZXhwb3J0UHJvbWlzZXMpO1xuICAgICAgICBleHBvcnRlZFNpZGVzLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtpdGVtLnNpZGVdID0gaXRlbS5kYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0K3QutGB0L/QvtGA0YIg0LfQsNCy0LXRgNGI0LXQvSDQtNC70Y8gJHtPYmplY3Qua2V5cyhyZXN1bHQpLmxlbmd0aH0g0YHRgtC+0YDQvtC9YCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIGdldFNpZGVzV2l0aExheWVycygpIHtcbiAgICAgICAgY29uc3QgYWxsU2lkZXNXaXRoTGF5ZXJzID0gWy4uLm5ldyBTZXQodGhpcy5sYXlvdXRzLm1hcChsYXlvdXQgPT4gbGF5b3V0LnZpZXcpKV07XG4gICAgICAgIHJldHVybiBhbGxTaWRlc1dpdGhMYXllcnMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgaWYgKGEgPT09ICdmcm9udCcpXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgaWYgKGIgPT09ICdmcm9udCcpXG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIGV4cG9ydFNpZGUoc2lkZSwgd2l0aE1vY2t1cCA9IHRydWUsIHJlc29sdXRpb24gPSAxMDI0KSB7XG4gICAgICAgIGNvbnN0IGNhbnZhc2VzID0gdGhpcy5nZXRDYW52YXNlc0ZvclNpZGUoc2lkZSk7XG4gICAgICAgIGlmICghY2FudmFzZXMuZWRpdGFibGVDYW52YXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2V4cG9ydF0gQ2FudmFzINC00LvRjyDRgdGC0L7RgNC+0L3RiyAke3NpZGV9INC90LUg0L3QsNC50LTQtdC9YCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHNGb3JTaWRlKHNpZGUpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQrdC60YHQv9C+0YDRgtC40YDRg9C10Lwg0YHRgtC+0YDQvtC90YMgJHtzaWRlfSR7d2l0aE1vY2t1cCA/ICcg0YEg0LzQvtC60LDQv9C+0LwnIDogJyDQsdC10Lcg0LzQvtC60LDQv9CwJ30gKCR7cmVzb2x1dGlvbn1weCkuLi5gKTtcbiAgICAgICAgaWYgKCF3aXRoTW9ja3VwKSB7XG4gICAgICAgICAgICBjb25zdCBjcm9wcGVkQ2FudmFzID0gYXdhaXQgdGhpcy5leHBvcnREZXNpZ25XaXRoQ2xpcFBhdGgoY2FudmFzZXMuZWRpdGFibGVDYW52YXMsIGNhbnZhc2VzLmxheWVyc0NhbnZhcywgc2lkZSwgcmVzb2x1dGlvbik7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQrdC60YHQv9C+0YDRgtC40YDQvtCy0LDQvSDRh9C40YHRgtGL0Lkg0LTQuNC30LDQudC9INC00LvRjyAke3NpZGV9ICjQvtCx0YDQtdC30LDQvSDQv9C+IGNsaXBQYXRoKWApO1xuICAgICAgICAgICAgcmV0dXJuIGNyb3BwZWRDYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnLCAxLjApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1vY2t1cEltZyA9IGF3YWl0IHRoaXMubG9hZE1vY2t1cEZvclNpZGUoc2lkZSk7XG4gICAgICAgIGlmICghbW9ja3VwSW1nKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGNvbnN0IHsgY2FudmFzOiB0ZW1wQ2FudmFzLCBjdHgsIG1vY2t1cERpbWVuc2lvbnMgfSA9IHRoaXMuY3JlYXRlRXhwb3J0Q2FudmFzKHJlc29sdXRpb24sIG1vY2t1cEltZyk7XG4gICAgICAgIGNvbnN0IGRlc2lnbkNhbnZhcyA9IGF3YWl0IHRoaXMuY3JlYXRlRGVzaWduQ2FudmFzKGNhbnZhc2VzLmVkaXRhYmxlQ2FudmFzLCBjYW52YXNlcy5sYXllcnNDYW52YXMsIHNpZGUpO1xuICAgICAgICBjdHguZHJhd0ltYWdlKGRlc2lnbkNhbnZhcywgMCwgMCwgZGVzaWduQ2FudmFzLndpZHRoLCBkZXNpZ25DYW52YXMuaGVpZ2h0LCBtb2NrdXBEaW1lbnNpb25zLngsIG1vY2t1cERpbWVuc2lvbnMueSwgbW9ja3VwRGltZW5zaW9ucy53aWR0aCwgbW9ja3VwRGltZW5zaW9ucy5oZWlnaHQpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQndCw0LvQvtC20LXQvSDQtNC40LfQsNC50L0g0L3QsCDQvNC+0LrQsNC/INC00LvRjyAke3NpZGV9YCk7XG4gICAgICAgIHJldHVybiB0ZW1wQ2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJywgMS4wKTtcbiAgICB9XG4gICAgZ2V0Q2FudmFzZXNGb3JTaWRlKHNpZGUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGVkaXRhYmxlQ2FudmFzOiB0aGlzLmNhbnZhc2VzLmZpbmQoYyA9PiBjLnNpZGUgPT09IHNpZGUpLFxuICAgICAgICAgICAgbGF5ZXJzQ2FudmFzOiB0aGlzLmxheWVyc0NhbnZhc2VzLmZpbmQoYyA9PiBjLnNpZGUgPT09IHNpZGUpXG4gICAgICAgIH07XG4gICAgfVxuICAgIGFzeW5jIGxvYWRNb2NrdXBGb3JTaWRlKHNpZGUpIHtcbiAgICAgICAgY29uc3QgbW9ja3VwVXJsID0gdGhpcy5nZXRNb2NrdXBVcmwoc2lkZSk7XG4gICAgICAgIGlmICghbW9ja3VwVXJsKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtleHBvcnRdINCc0L7QutCw0L8g0LTQu9GPINGB0YLQvtGA0L7QvdGLICR7c2lkZX0g0L3QtSDQvdCw0LnQtNC10L1gKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1vY2t1cEltZyA9IGF3YWl0IHRoaXMubG9hZEltYWdlKG1vY2t1cFVybCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCX0LDQs9GA0YPQttC10L0g0LzQvtC60LDQvyDQtNC70Y8gJHtzaWRlfTogJHttb2NrdXBVcmx9YCk7XG4gICAgICAgIHJldHVybiBtb2NrdXBJbWc7XG4gICAgfVxuICAgIGNyZWF0ZUV4cG9ydENhbnZhcyhleHBvcnRTaXplLCBtb2NrdXBJbWcpIHtcbiAgICAgICAgY29uc3QgdGVtcENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBjb25zdCBjdHggPSB0ZW1wQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIHRlbXBDYW52YXMud2lkdGggPSBleHBvcnRTaXplO1xuICAgICAgICB0ZW1wQ2FudmFzLmhlaWdodCA9IGV4cG9ydFNpemU7XG4gICAgICAgIGNvbnN0IG1vY2t1cFNjYWxlID0gTWF0aC5taW4oZXhwb3J0U2l6ZSAvIG1vY2t1cEltZy53aWR0aCwgZXhwb3J0U2l6ZSAvIG1vY2t1cEltZy5oZWlnaHQpO1xuICAgICAgICBjb25zdCBzY2FsZWRNb2NrdXBXaWR0aCA9IG1vY2t1cEltZy53aWR0aCAqIG1vY2t1cFNjYWxlO1xuICAgICAgICBjb25zdCBzY2FsZWRNb2NrdXBIZWlnaHQgPSBtb2NrdXBJbWcuaGVpZ2h0ICogbW9ja3VwU2NhbGU7XG4gICAgICAgIGNvbnN0IG1vY2t1cFggPSAoZXhwb3J0U2l6ZSAtIHNjYWxlZE1vY2t1cFdpZHRoKSAvIDI7XG4gICAgICAgIGNvbnN0IG1vY2t1cFkgPSAoZXhwb3J0U2l6ZSAtIHNjYWxlZE1vY2t1cEhlaWdodCkgLyAyO1xuICAgICAgICBjdHguZHJhd0ltYWdlKG1vY2t1cEltZywgbW9ja3VwWCwgbW9ja3VwWSwgc2NhbGVkTW9ja3VwV2lkdGgsIHNjYWxlZE1vY2t1cEhlaWdodCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCd0LDRgNC40YHQvtCy0LDQvSDQvNC+0LrQsNC/INC60LDQuiDRhNC+0L0gKCR7c2NhbGVkTW9ja3VwV2lkdGh9eCR7c2NhbGVkTW9ja3VwSGVpZ2h0fSlgKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNhbnZhczogdGVtcENhbnZhcyxcbiAgICAgICAgICAgIGN0eCxcbiAgICAgICAgICAgIG1vY2t1cERpbWVuc2lvbnM6IHtcbiAgICAgICAgICAgICAgICB4OiBtb2NrdXBYLFxuICAgICAgICAgICAgICAgIHk6IG1vY2t1cFksXG4gICAgICAgICAgICAgICAgd2lkdGg6IHNjYWxlZE1vY2t1cFdpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogc2NhbGVkTW9ja3VwSGVpZ2h0XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIGFzeW5jIGNyZWF0ZURlc2lnbkNhbnZhcyhlZGl0YWJsZUNhbnZhcywgbGF5ZXJzQ2FudmFzLCBzaWRlKSB7XG4gICAgICAgIGNvbnN0IHF1YWxpdHlNdWx0aXBsaWVyID0gMTA7XG4gICAgICAgIGNvbnN0IGJhc2VXaWR0aCA9IGVkaXRhYmxlQ2FudmFzLmdldFdpZHRoKCk7XG4gICAgICAgIGNvbnN0IGJhc2VIZWlnaHQgPSBlZGl0YWJsZUNhbnZhcy5nZXRIZWlnaHQoKTtcbiAgICAgICAgY29uc3QgZGVzaWduQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGNvbnN0IGRlc2lnbkN0eCA9IGRlc2lnbkNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICBkZXNpZ25DYW52YXMud2lkdGggPSBiYXNlV2lkdGggKiBxdWFsaXR5TXVsdGlwbGllcjtcbiAgICAgICAgZGVzaWduQ2FudmFzLmhlaWdodCA9IGJhc2VIZWlnaHQgKiBxdWFsaXR5TXVsdGlwbGllcjtcbiAgICAgICAgYXdhaXQgdGhpcy5hZGRTdGF0aWNMYXllcnNUb0NhbnZhcyhsYXllcnNDYW52YXMsIGRlc2lnbkN0eCwgZGVzaWduQ2FudmFzLCBzaWRlKTtcbiAgICAgICAgYXdhaXQgdGhpcy5hZGRFZGl0YWJsZU9iamVjdHNUb0NhbnZhcyhlZGl0YWJsZUNhbnZhcywgZGVzaWduQ3R4LCBkZXNpZ25DYW52YXMsIGJhc2VXaWR0aCwgYmFzZUhlaWdodCwgc2lkZSk7XG4gICAgICAgIHJldHVybiBkZXNpZ25DYW52YXM7XG4gICAgfVxuICAgIGFzeW5jIGFkZFN0YXRpY0xheWVyc1RvQ2FudmFzKGxheWVyc0NhbnZhcywgY3R4LCBjYW52YXMsIHNpZGUpIHtcbiAgICAgICAgaWYgKCFsYXllcnNDYW52YXMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBsYXllcnNEYXRhVXJsID0gbGF5ZXJzQ2FudmFzLnRvRGF0YVVSTCh7XG4gICAgICAgICAgICAgICAgZm9ybWF0OiAncG5nJyxcbiAgICAgICAgICAgICAgICBtdWx0aXBsaWVyOiAxMCxcbiAgICAgICAgICAgICAgICBxdWFsaXR5OiAxLjBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgZW1wdHlEYXRhVXJsID0gJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQUVBQUFBQkNBWUFBQUFmRmNTSkFBQUFEVWxFUVZSNDJtTmtZUGhmRHdBQ2h3R0E2MGU2a2dBQUFBQkpSVTVFcmtKZ2dnPT0nO1xuICAgICAgICAgICAgaWYgKGxheWVyc0RhdGFVcmwgIT09IGVtcHR5RGF0YVVybCAmJiBsYXllcnNEYXRhVXJsLmxlbmd0aCA+IGVtcHR5RGF0YVVybC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBsYXllcnNJbWcgPSBhd2FpdCB0aGlzLmxvYWRJbWFnZShsYXllcnNEYXRhVXJsKTtcbiAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKGxheWVyc0ltZywgMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQlNC+0LHQsNCy0LvQtdC90Ysg0YHRgtCw0YLQuNGH0LXRgdC60LjQtSDRgdC70L7QuCDQtNC70Y8gJHtzaWRlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZXhwb3J0XSDQntGI0LjQsdC60LAg0Y3QutGB0L/QvtGA0YLQsCDRgdGC0LDRgtC40YfQtdGB0LrQuNGFINGB0LvQvtC10LIg0LTQu9GPICR7c2lkZX06YCwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGFkZEVkaXRhYmxlT2JqZWN0c1RvQ2FudmFzKGVkaXRhYmxlQ2FudmFzLCBjdHgsIGNhbnZhcywgYmFzZVdpZHRoLCBiYXNlSGVpZ2h0LCBzaWRlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB0ZW1wRWRpdGFibGVDYW52YXMgPSBuZXcgZmFicmljLlN0YXRpY0NhbnZhcyhudWxsLCB7XG4gICAgICAgICAgICAgICAgd2lkdGg6IGJhc2VXaWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGJhc2VIZWlnaHQsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAndHJhbnNwYXJlbnQnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChlZGl0YWJsZUNhbnZhcy5jbGlwUGF0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNsb25lZENsaXAgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBlZGl0YWJsZUNhbnZhcy5jbGlwUGF0aC5jbG9uZSgoY2xvbmVkKSA9PiByZXNvbHZlKGNsb25lZCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRlbXBFZGl0YWJsZUNhbnZhcy5jbGlwUGF0aCA9IGNsb25lZENsaXA7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0J/RgNC40LzQtdC90ZHQvSBjbGlwUGF0aCDQtNC70Y8g0Y3QutGB0L/QvtGA0YLQsCDRgdGC0L7RgNC+0L3RiyAke3NpZGV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkZXNpZ25PYmplY3RzID0gdGhpcy5maWx0ZXJEZXNpZ25PYmplY3RzKGVkaXRhYmxlQ2FudmFzLmdldE9iamVjdHMoKSk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG9iaiBvZiBkZXNpZ25PYmplY3RzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2xvbmVkT2JqID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmNsb25lKChjbG9uZWQpID0+IHJlc29sdmUoY2xvbmVkKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGVtcEVkaXRhYmxlQ2FudmFzLmFkZChjbG9uZWRPYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZGVzaWduRGF0YVVybCA9IHRlbXBFZGl0YWJsZUNhbnZhcy50b0RhdGFVUkwoe1xuICAgICAgICAgICAgICAgIGZvcm1hdDogJ3BuZycsXG4gICAgICAgICAgICAgICAgbXVsdGlwbGllcjogMTAsXG4gICAgICAgICAgICAgICAgcXVhbGl0eTogMS4wXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGVtcHR5RGF0YVVybCA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUFFQUFBQUJDQVlBQUFBZkZjU0pBQUFBRFVsRVFWUjQybU5rWVBoZkR3QUNod0dBNjBlNmtnQUFBQUJKUlU1RXJrSmdnZz09JztcbiAgICAgICAgICAgIGlmIChkZXNpZ25EYXRhVXJsICE9PSBlbXB0eURhdGFVcmwgJiYgZGVzaWduRGF0YVVybC5sZW5ndGggPiBlbXB0eURhdGFVcmwubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVzaWduSW1nID0gYXdhaXQgdGhpcy5sb2FkSW1hZ2UoZGVzaWduRGF0YVVybCk7XG4gICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShkZXNpZ25JbWcsIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0JTQvtCx0LDQstC70LXQvdGLINC+0LHRitC10LrRgtGLINC00LjQt9Cw0LnQvdCwINCx0LXQtyDQs9GA0LDQvdC40YYg0LTQu9GPICR7c2lkZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRlbXBFZGl0YWJsZUNhbnZhcy5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtleHBvcnRdINCe0YjQuNCx0LrQsCDRgdC+0LfQtNCw0L3QuNGPINC00LjQt9Cw0LnQvdCwINCx0LXQtyDQs9GA0LDQvdC40YYg0LTQu9GPICR7c2lkZX06YCwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZpbHRlckRlc2lnbk9iamVjdHMoYWxsT2JqZWN0cykge1xuICAgICAgICBjb25zdCBzZXJ2aWNlT2JqZWN0TmFtZXMgPSBuZXcgU2V0KFtcbiAgICAgICAgICAgIFwiYXJlYTpib3JkZXJcIixcbiAgICAgICAgICAgIFwiYXJlYTpjbGlwXCIsXG4gICAgICAgICAgICBcImd1aWRlbGluZVwiLFxuICAgICAgICAgICAgXCJndWlkZWxpbmU6dmVydGljYWxcIixcbiAgICAgICAgICAgIFwiZ3VpZGVsaW5lOmhvcml6b250YWxcIlxuICAgICAgICBdKTtcbiAgICAgICAgcmV0dXJuIGFsbE9iamVjdHMuZmlsdGVyKChvYmopID0+ICFzZXJ2aWNlT2JqZWN0TmFtZXMuaGFzKG9iai5uYW1lKSk7XG4gICAgfVxuICAgIGFzeW5jIGV4cG9ydERlc2lnbldpdGhDbGlwUGF0aChlZGl0YWJsZUNhbnZhcywgbGF5ZXJzQ2FudmFzLCBzaWRlLCByZXNvbHV0aW9uKSB7XG4gICAgICAgIGNvbnN0IHF1YWxpdHlNdWx0aXBsaWVyID0gMTA7XG4gICAgICAgIGNvbnN0IGNsaXBQYXRoID0gZWRpdGFibGVDYW52YXMuY2xpcFBhdGg7XG4gICAgICAgIGlmICghY2xpcFBhdGgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2V4cG9ydF0gY2xpcFBhdGgg0L3QtSDQvdCw0LnQtNC10L0sINGN0LrRgdC/0L7RgNGC0LjRgNGD0LXQvCDQstC10YHRjCBjYW52YXMnKTtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNyZWF0ZURlc2lnbkNhbnZhcyhlZGl0YWJsZUNhbnZhcywgbGF5ZXJzQ2FudmFzLCBzaWRlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjbGlwV2lkdGggPSBjbGlwUGF0aC53aWR0aDtcbiAgICAgICAgY29uc3QgY2xpcEhlaWdodCA9IGNsaXBQYXRoLmhlaWdodDtcbiAgICAgICAgY29uc3QgY2xpcExlZnQgPSBjbGlwUGF0aC5sZWZ0O1xuICAgICAgICBjb25zdCBjbGlwVG9wID0gY2xpcFBhdGgudG9wO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSBjbGlwUGF0aDogJHtjbGlwV2lkdGh9eCR7Y2xpcEhlaWdodH0gYXQgKCR7Y2xpcExlZnR9LCAke2NsaXBUb3B9KWApO1xuICAgICAgICBjb25zdCBmdWxsRGVzaWduQ2FudmFzID0gYXdhaXQgdGhpcy5jcmVhdGVEZXNpZ25DYW52YXMoZWRpdGFibGVDYW52YXMsIGxheWVyc0NhbnZhcywgc2lkZSk7XG4gICAgICAgIGNvbnN0IHNjYWxlID0gcmVzb2x1dGlvbiAvIE1hdGgubWF4KGNsaXBXaWR0aCwgY2xpcEhlaWdodCk7XG4gICAgICAgIGNvbnN0IGNyb3BwZWRDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgY3JvcHBlZENhbnZhcy53aWR0aCA9IGNsaXBXaWR0aCAqIHNjYWxlO1xuICAgICAgICBjcm9wcGVkQ2FudmFzLmhlaWdodCA9IGNsaXBIZWlnaHQgKiBzY2FsZTtcbiAgICAgICAgY29uc3QgY3R4ID0gY3JvcHBlZENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICBjb25zdCBzb3VyY2VTY2FsZSA9IHF1YWxpdHlNdWx0aXBsaWVyO1xuICAgICAgICBjdHguZHJhd0ltYWdlKGZ1bGxEZXNpZ25DYW52YXMsIGNsaXBMZWZ0ICogc291cmNlU2NhbGUsIGNsaXBUb3AgKiBzb3VyY2VTY2FsZSwgY2xpcFdpZHRoICogc291cmNlU2NhbGUsIGNsaXBIZWlnaHQgKiBzb3VyY2VTY2FsZSwgMCwgMCwgY3JvcHBlZENhbnZhcy53aWR0aCwgY3JvcHBlZENhbnZhcy5oZWlnaHQpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQlNC40LfQsNC50L0g0L7QsdGA0LXQt9Cw0L0g0L/QviBjbGlwUGF0aDogJHtjcm9wcGVkQ2FudmFzLndpZHRofXgke2Nyb3BwZWRDYW52YXMuaGVpZ2h0fXB4YCk7XG4gICAgICAgIHJldHVybiBjcm9wcGVkQ2FudmFzO1xuICAgIH1cbiAgICBhc3luYyB1cGxvYWREZXNpZ25Ub1NlcnZlcihkZXNpZ25zKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZXhwb3J0XSDQl9Cw0LPRgNGD0LfQutCwINC00LjQt9Cw0LnQvdCwINC90LAg0YHQtdGA0LLQtdGAJyk7XG4gICAgICAgICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBbc2lkZSwgZGF0YVVybF0gb2YgT2JqZWN0LmVudHJpZXMoZGVzaWducykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGRhdGFVcmwpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJsb2IgPSBhd2FpdCByZXNwb25zZS5ibG9iKCk7XG4gICAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKHNpZGUsIGJsb2IsIGAke3NpZGV9LnBuZ2ApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZXhwb3J0XSDQl9Cw0LPRgNGD0LfQutCwINC90LAg0YHQtdGA0LLQtdGAINC90LUg0YDQtdCw0LvQuNC30L7QstCw0L3QsCcpO1xuICAgICAgICAgICAgcmV0dXJuIGRlc2lnbnM7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbZXhwb3J0XSDQntGI0LjQsdC60LAg0L/RgNC4INC30LDQs9GA0YPQt9C60LUg0L3QsCDRgdC10YDQstC10YA6JywgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2F2ZUxheWVyc1RvSGlzdG9yeSgpIHtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA8IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICB0aGlzLmxheWVyc0hpc3RvcnkgPSB0aGlzLmxheWVyc0hpc3Rvcnkuc2xpY2UoMCwgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ICsgMSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGF5ZXJzQ29weSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGhpcy5sYXlvdXRzKSk7XG4gICAgICAgIGNvbnN0IGhpc3RvcnlJdGVtID0ge1xuICAgICAgICAgICAgbGF5ZXJzOiBsYXllcnNDb3B5Lm1hcCgoZGF0YSkgPT4gbmV3IExheW91dChkYXRhKSksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KClcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5sYXllcnNIaXN0b3J5LnB1c2goaGlzdG9yeUl0ZW0pO1xuICAgICAgICB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPSB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMTtcbiAgICAgICAgY29uc3QgTUFYX0hJU1RPUllfU0laRSA9IDUwO1xuICAgICAgICBpZiAodGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCA+IE1BWF9ISVNUT1JZX1NJWkUpIHtcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzSGlzdG9yeS5zaGlmdCgpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4LS07XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2hpc3RvcnldINCh0L7RhdGA0LDQvdC10L3QviDRgdC+0YHRgtC+0Y/QvdC40LUg0YHQu9C+0ZHQsi4g0JjQvdC00LXQutGBOiAke3RoaXMuY3VycmVudEhpc3RvcnlJbmRleH0sINCS0YHQtdCz0L46ICR7dGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aH0sINCh0LvQvtGR0LI6ICR7dGhpcy5sYXlvdXRzLmxlbmd0aH1gKTtcbiAgICAgICAgdGhpcy51cGRhdGVIaXN0b3J5QnV0dG9uc1N0YXRlKCk7XG4gICAgfVxuICAgIGNhblVuZG8oKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPT09IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCA+PSAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA+IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2FuUmVkbygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA8IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxO1xuICAgIH1cbiAgICB1cGRhdGVIaXN0b3J5QnV0dG9uc1N0YXRlKCkge1xuICAgICAgICBjb25zdCBjYW5VbmRvID0gdGhpcy5jYW5VbmRvKCk7XG4gICAgICAgIGNvbnN0IGNhblJlZG8gPSB0aGlzLmNhblJlZG8oKTtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jayAmJiB0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVuZG9CdXR0b24gPSB0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBpZiAoY2FuVW5kbykge1xuICAgICAgICAgICAgICAgIHVuZG9CdXR0b24uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyc7XG4gICAgICAgICAgICAgICAgdW5kb0J1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB1bmRvQnV0dG9uLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcjZjJmMmYyJztcbiAgICAgICAgICAgICAgICB1bmRvQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrICYmIHRoaXMuZWRpdG9ySGlzdG9yeVJlZG9CbG9jay5maXJzdEVsZW1lbnRDaGlsZCkge1xuICAgICAgICAgICAgY29uc3QgcmVkb0J1dHRvbiA9IHRoaXMuZWRpdG9ySGlzdG9yeVJlZG9CbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGlmIChjYW5SZWRvKSB7XG4gICAgICAgICAgICAgICAgcmVkb0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnJztcbiAgICAgICAgICAgICAgICByZWRvQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlZG9CdXR0b24uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyNmMmYyZjInO1xuICAgICAgICAgICAgICAgIHJlZG9CdXR0b24uc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5XSDQodC+0YHRgtC+0Y/QvdC40LUg0LrQvdC+0L/QvtC6OiB1bmRvID0nLCBjYW5VbmRvLCAnLCByZWRvID0nLCBjYW5SZWRvKTtcbiAgICB9XG4gICAgYXN5bmMgdW5kbygpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhblVuZG8oKSkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnldIFVuZG8g0L3QtdCy0L7Qt9C80L7QttC10L0nKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID09PSB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMSAmJiB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA9IHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID0gTWF0aC5tYXgoMCwgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4IC0gMSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaGlzdG9yeUl0ZW0gPSB0aGlzLmxheWVyc0hpc3RvcnlbdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4XTtcbiAgICAgICAgaWYgKCFoaXN0b3J5SXRlbSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbaGlzdG9yeV0g0JjRgdGC0L7RgNC40Y8g0L3QtSDQvdCw0LnQtNC10L3QsCcpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtoaXN0b3J5XSBVbmRvINC6INC40L3QtNC10LrRgdGDICR7dGhpcy5jdXJyZW50SGlzdG9yeUluZGV4fSDQuNC3ICR7dGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDF9YCk7XG4gICAgICAgIGF3YWl0IHRoaXMucmVzdG9yZUxheWVyc0Zyb21IaXN0b3J5KGhpc3RvcnlJdGVtKTtcbiAgICAgICAgdGhpcy51cGRhdGVIaXN0b3J5QnV0dG9uc1N0YXRlKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBhc3luYyByZWRvKCkge1xuICAgICAgICBpZiAoIXRoaXMuY2FuUmVkbygpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbaGlzdG9yeV0gUmVkbyDQvdC10LLQvtC30LzQvtC20LXQvScpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCsrO1xuICAgICAgICBjb25zdCBoaXN0b3J5SXRlbSA9IHRoaXMubGF5ZXJzSGlzdG9yeVt0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXhdO1xuICAgICAgICBpZiAoIWhpc3RvcnlJdGVtKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1toaXN0b3J5XSDQmNGB0YLQvtGA0LjRjyDQvdC1INC90LDQudC00LXQvdCwJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2hpc3RvcnldIFJlZG8g0Log0LjQvdC00LXQutGB0YMgJHt0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXh9INC40LcgJHt0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMX1gKTtcbiAgICAgICAgYXdhaXQgdGhpcy5yZXN0b3JlTGF5ZXJzRnJvbUhpc3RvcnkoaGlzdG9yeUl0ZW0pO1xuICAgICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlCdXR0b25zU3RhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGFzeW5jIHJlc3RvcmVMYXllcnNGcm9tSGlzdG9yeShoaXN0b3J5SXRlbSkge1xuICAgICAgICB0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkgPSB0cnVlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gW107XG4gICAgICAgICAgICBoaXN0b3J5SXRlbS5sYXllcnMuZm9yRWFjaChsYXlvdXQgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMubGF5b3V0cy5wdXNoKG5ldyBMYXlvdXQobGF5b3V0KSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbaGlzdG9yeV0g0JLQvtGB0YHRgtCw0L3QvtCy0LvQtdC90L4gJHt0aGlzLmxheW91dHMubGVuZ3RofSDRgdC70L7RkdCyYCk7XG4gICAgICAgIH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBkZXN0cm95KCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZWRpdG9yXSDQntGH0LjRgdGC0LrQsCDRgNC10YHRg9GA0YHQvtCyINGA0LXQtNCw0LrRgtC+0YDQsCcpO1xuICAgICAgICBpZiAodGhpcy5sb2FkaW5nSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5sb2FkaW5nSW50ZXJ2YWwpO1xuICAgICAgICAgICAgdGhpcy5sb2FkaW5nSW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXZlbnRzLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5jYW52YXNlcy5mb3JFYWNoKGNhbnZhcyA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNhbnZhcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NsZWFudXBdINCe0YjQuNCx0LrQsCDQvtGH0LjRgdGC0LrQuCBjYW52YXM6JywgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY2FudmFzZXMgPSBbXTtcbiAgICAgICAgdGhpcy5sYXllcnNDYW52YXNlcy5mb3JFYWNoKGNhbnZhcyA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNhbnZhcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NsZWFudXBdINCe0YjQuNCx0LrQsCDQvtGH0LjRgdGC0LrQuCBsYXllciBjYW52YXM6JywgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubGF5ZXJzQ2FudmFzZXMgPSBbXTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2VkaXRvcl0g0KDQtdGB0YPRgNGB0Ysg0YPRgdC/0LXRiNC90L4g0L7Rh9C40YnQtdC90YsnKTtcbiAgICB9XG4gICAgZ2V0Q3VycmVudFN0YXRlKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogdGhpcy5fc2VsZWN0VHlwZSxcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLl9zZWxlY3RDb2xvcixcbiAgICAgICAgICAgIHNpZGU6IHRoaXMuX3NlbGVjdFNpZGUsXG4gICAgICAgICAgICBzaXplOiB0aGlzLl9zZWxlY3RTaXplLFxuICAgICAgICAgICAgbGF5b3V0czogdGhpcy5sYXlvdXRzLFxuICAgICAgICAgICAgaXNMb2FkaW5nOiB0aGlzLmlzTG9hZGluZyxcbiAgICAgICAgfTtcbiAgICB9XG59XG4iLCJjb25zdCBwb3B1cExvZ2dlciA9IGNvbnNvbGUuZGVidWcuYmluZChjb25zb2xlLCAnW1BvcHVwXScpO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUG9wdXAge1xuICAgIGNvbnN0cnVjdG9yKHsgcG9wdXBJZCwgcG9wdXBDb250ZW50Q2xhc3MsIGNsb3NlQnV0dG9uQ2xhc3MsIHRpbWVvdXRTZWNvbmRzID0gMTAsIGF1dG9TaG93ID0gdHJ1ZSwgY29va2llTmFtZSA9ICdwb3B1cCcsIGNvb2tpZUV4cGlyZXNEYXlzID0gMSwgfSkge1xuICAgICAgICB0aGlzLmNsb3NlQnV0dG9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5hdXRvU2hvdyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmF1dG9TaG93VGltZW91dCA9IG51bGw7XG4gICAgICAgIHRoaXMudGltZW91dFNlY29uZHMgPSAyNTtcbiAgICAgICAgdGhpcy5jb29raWVOYW1lID0gXCJwb3B1cFwiO1xuICAgICAgICB0aGlzLmNvb2tpZUV4cGlyZXNEYXlzID0gMTtcbiAgICAgICAgaWYgKCFwb3B1cElkIHx8ICFwb3B1cENvbnRlbnRDbGFzcylcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW1BvcHVwXSBwb3B1cElkIG9yIHBvcHVwQ29udGVudENsYXNzIGlzIG5vdCBwcm92aWRlZCcpO1xuICAgICAgICBjb25zdCBmaW5kUG9wdXBCbG9jayA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHBvcHVwSWQpO1xuICAgICAgICBpZiAoIWZpbmRQb3B1cEJsb2NrKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBvcHVwIGJsb2NrIHdpdGggaWQgJHtwb3B1cElkfSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaW5kUG9wdXBDb250ZW50QmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuJHtwb3B1cENvbnRlbnRDbGFzc31gKTtcbiAgICAgICAgaWYgKCFmaW5kUG9wdXBDb250ZW50QmxvY2spIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUG9wdXAgY29udGVudCBibG9jayB3aXRoIGNsYXNzICR7cG9wdXBDb250ZW50Q2xhc3N9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucG9wdXBCbG9jayA9IGZpbmRQb3B1cEJsb2NrO1xuICAgICAgICB0aGlzLnBvcHVwQ29udGVudEJsb2NrID0gZmluZFBvcHVwQ29udGVudEJsb2NrO1xuICAgICAgICB0aGlzLmluaXRQb3B1cEJsb2NrKCk7XG4gICAgICAgIHRoaXMucG9wdXBXcmFwcGVyQmxvY2sgPSB0aGlzLmluaXRQb3B1cFdyYXBwZXIoKTtcbiAgICAgICAgY29uc3QgZmluZENsb3NlQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLiR7Y2xvc2VCdXR0b25DbGFzc31gKTtcbiAgICAgICAgaWYgKCFmaW5kQ2xvc2VCdXR0b24pIHtcbiAgICAgICAgICAgIHBvcHVwTG9nZ2VyKGBjbG9zZSBidXR0b24gd2l0aCBjbGFzcyAke2Nsb3NlQnV0dG9uQ2xhc3N9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xvc2VCdXR0b24gPSBmaW5kQ2xvc2VCdXR0b247XG4gICAgICAgIHRoaXMuaW5pdENsb3NlQnV0dG9uKCk7XG4gICAgICAgIGlmICh0aW1lb3V0U2Vjb25kcykge1xuICAgICAgICAgICAgdGhpcy50aW1lb3V0U2Vjb25kcyA9IHRpbWVvdXRTZWNvbmRzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhdXRvU2hvdykge1xuICAgICAgICAgICAgdGhpcy5hdXRvU2hvdyA9IGF1dG9TaG93O1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb29raWVOYW1lKSB7XG4gICAgICAgICAgICB0aGlzLmNvb2tpZU5hbWUgPSBjb29raWVOYW1lO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb29raWVFeHBpcmVzRGF5cykge1xuICAgICAgICAgICAgdGhpcy5jb29raWVFeHBpcmVzRGF5cyA9IGNvb2tpZUV4cGlyZXNEYXlzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnBvcHVwQmxvY2sgJiYgdGhpcy5jbG9zZUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5pbml0QXV0b1Nob3coKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0UG9wdXBXcmFwcGVyKCkge1xuICAgICAgICBjb25zdCBwb3B1cFdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICBwb3B1cFdyYXBwZXIuaWQgPSAncG9wdXAtd3JhcHBlcic7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS5yaWdodCA9ICcwJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLmJvdHRvbSA9ICcwJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUuekluZGV4ID0gJzk5OTknO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICAgICAgcmV0dXJuIHBvcHVwV3JhcHBlcjtcbiAgICB9XG4gICAgaW5pdFBvcHVwQmxvY2soKSB7XG4gICAgICAgIHRoaXMucG9wdXBCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH1cbiAgICBpbml0Q2xvc2VCdXR0b24oKSB7XG4gICAgICAgIGlmICghdGhpcy5jbG9zZUJ1dHRvbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgIHRoaXMuY2xvc2VCdXR0b24ub25jbGljayA9ICgpID0+IHRoaXMuY2xvc2UoKTtcbiAgICB9XG4gICAgaW5pdEF1dG9TaG93KCkge1xuICAgICAgICBpZiAodGhpcy5hdXRvU2hvdyAmJiAhZG9jdW1lbnQuY29va2llLmluY2x1ZGVzKGAke3RoaXMuY29va2llTmFtZX09dHJ1ZWApKSB7XG4gICAgICAgICAgICB0aGlzLmF1dG9TaG93VGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5zaG93KCksIHRoaXMudGltZW91dFNlY29uZHMgKiAxMDAwKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBvcHVwTG9nZ2VyKCdpcyBub3QgYXV0byBzaG93bicpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNob3coKSB7XG4gICAgICAgIHRoaXMucG9wdXBXcmFwcGVyQmxvY2suYXBwZW5kQ2hpbGQodGhpcy5wb3B1cEJsb2NrKTtcbiAgICAgICAgdGhpcy5wb3B1cENvbnRlbnRCbG9jay5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICB0aGlzLnBvcHVwQmxvY2suc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5wb3B1cFdyYXBwZXJCbG9jayk7XG4gICAgfVxuICAgIGNsb3NlKCkge1xuICAgICAgICB0aGlzLnBvcHVwV3JhcHBlckJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGRvY3VtZW50LmNvb2tpZSA9IGAke3RoaXMuY29va2llTmFtZX09dHJ1ZTsgZXhwaXJlcz0ke25ldyBEYXRlKERhdGUubm93KCkgKyB0aGlzLmNvb2tpZUV4cGlyZXNEYXlzICogMjQgKiA2MCAqIDYwICogMTAwMCkudG9VVENTdHJpbmcoKX07IHBhdGg9LztgO1xuICAgIH1cbn1cbiIsImV4cG9ydCBjb25zdCBwcm9kdWN0Q29uZmlncyA9IFtcbiAgICB7XG4gICAgICAgIHR5cGU6ICd0c2hpcnQnLFxuICAgICAgICBwcm9kdWN0TmFtZTogJ9Ck0YPRgtCx0L7Qu9C60LAnLFxuICAgICAgICBzaXplczogW1wiU1wiLCBcIk1cIiwgXCJMXCIsIFwiWExcIiwgXCIyWExcIl0sXG4gICAgICAgIHByaWNlOiAxMjkwLFxuICAgICAgICBkb3VibGVTaWRlZFByaWNlOiAxNTkwLFxuICAgICAgICBwcmludENvbmZpZzogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNpZGU6ICdmcm9udCcsXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgICAgICAgICAgeTogMCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNpemU6IHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDI1MCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAzNTAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2lkZTogJ2JhY2snLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzaXplOiB7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAyNTAsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogNDAwLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIG1vY2t1cHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzaWRlOiAnZnJvbnQnLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vcmVzLmNsb3VkaW5hcnkuY29tL2RxdDNnbmltdS9pbWFnZS91cGxvYWQvdjE3NTM5NTgxNTEvd2hpdGVfbW9ja3VwLndlYnAnLFxuICAgICAgICAgICAgICAgIGNvbG9yOiB7IG5hbWU6ICd3aGl0ZScsIGhleDogJyNmZmZmZmYnIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNpZGU6ICdiYWNrJyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL3Jlcy5jbG91ZGluYXJ5LmNvbS9kcXQzZ25pbXUvaW1hZ2UvdXBsb2FkL3YxNzU1MzM0MjI3L3doaXRlX21vY2t1cF9iYWNrLndlYnAnLFxuICAgICAgICAgICAgICAgIGNvbG9yOiB7IG5hbWU6ICd3aGl0ZScsIGhleDogJyNmZmZmZmYnIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNpZGU6ICdmcm9udCcsXG4gICAgICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9yZXMuY2xvdWRpbmFyeS5jb20vZHF0M2duaW11L2ltYWdlL3VwbG9hZC92MTc1Mzk1OTEzNy9ibGFja19tb2NrdXAud2VicCcsXG4gICAgICAgICAgICAgICAgY29sb3I6IHsgbmFtZTogJ2JsYWNrJywgaGV4OiAnIzAwMDAwMCcgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2lkZTogJ2JhY2snLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vcmVzLmNsb3VkaW5hcnkuY29tL2RxdDNnbmltdS9pbWFnZS91cGxvYWQvdjE3NTQ4OTY5NjQvYmxhY2tfbW9ja3VwX2JhY2sud2VicCcsXG4gICAgICAgICAgICAgICAgY29sb3I6IHsgbmFtZTogJ2JsYWNrJywgaGV4OiAnIzAwMDAwMCcgfSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgdHlwZTogJ2hvb2RpZScsXG4gICAgICAgIHByb2R1Y3ROYW1lOiAn0KLQvtC70YHRgtC+0LLQutCwJyxcbiAgICAgICAgc2l6ZXM6IFtcIlNcIiwgXCJNXCIsIFwiTFwiLCBcIlhMXCIsIFwiMlhMXCJdLFxuICAgICAgICBwcmljZTogMjU5MCxcbiAgICAgICAgZG91YmxlU2lkZWRQcmljZTogMjg5MCxcbiAgICAgICAgcHJpbnRDb25maWc6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzaWRlOiAnZnJvbnQnLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgICAgIHk6IC05LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2l6ZToge1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogMjUwLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDE4MCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzaWRlOiAnYmFjaycsXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgICAgICAgICAgeTogMCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNpemU6IHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDI1MCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAzMDAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgbW9ja3VwczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNpZGU6ICdmcm9udCcsXG4gICAgICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9yZXMuY2xvdWRpbmFyeS5jb20vZHF0M2duaW11L2ltYWdlL3VwbG9hZC92MTc1Njk3ODEzOS93aGl0ZV9ob2RkaWVfbW9ja3VwLndlYnAnLFxuICAgICAgICAgICAgICAgIGNvbG9yOiB7IG5hbWU6ICd3aGl0ZScsIGhleDogJyNmZmZmZmYnIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNpZGU6ICdiYWNrJyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL3Jlcy5jbG91ZGluYXJ5LmNvbS9kcXQzZ25pbXUvaW1hZ2UvdXBsb2FkL3YxNzU2OTc4MTM5L3doaXRlX2hvZGRpZV9tb2NrdXBfYmFjay53ZWJwJyxcbiAgICAgICAgICAgICAgICBjb2xvcjogeyBuYW1lOiAnd2hpdGUnLCBoZXg6ICcjZmZmZmZmJyB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzaWRlOiAnZnJvbnQnLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vcmVzLmNsb3VkaW5hcnkuY29tL2RxdDNnbmltdS9pbWFnZS91cGxvYWQvdjE3NTY5NzgxMzkvYmxhY2tfaG9kZGllX21vY2t1cC53ZWJwJyxcbiAgICAgICAgICAgICAgICBjb2xvcjogeyBuYW1lOiAnYmxhY2snLCBoZXg6ICcjMDAwMDAwJyB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzaWRlOiAnYmFjaycsXG4gICAgICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9yZXMuY2xvdWRpbmFyeS5jb20vZHF0M2duaW11L2ltYWdlL3VwbG9hZC92MTc1Njk3ODEzOS9ibGFja19ob2RkaWVfbW9ja3VwX2JhY2sud2VicCcsXG4gICAgICAgICAgICAgICAgY29sb3I6IHsgbmFtZTogJ2JsYWNrJywgaGV4OiAnIzAwMDAwMCcgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfVxuXTtcbmV4cG9ydCBjb25zdCBlZGl0b3JCbG9ja3MgPSB7XG4gICAgZWRpdG9yQmxvY2tDbGFzczogJy5lZGl0b3ItYmxvY2snLFxuICAgIGNoYW5nZVNpZGVCdXR0b25DbGFzczogJy5jaGFuZ2Utc2lkZS1idXR0b24nLFxuICAgIHByb2R1Y3RMaXN0QmxvY2tDbGFzczogJy5wcm9kdWN0LWxpc3QnLFxuICAgIHByb2R1Y3RJdGVtQ2xhc3M6ICcucHJvZHVjdC1pdGVtJyxcbiAgICBwcm9kdWN0SXRlbUltYWdlQ2xhc3M6ICcucHJvZHVjdC1pdGVtLWltYWdlJyxcbiAgICBwcm9kdWN0SXRlbVRleHRDbGFzczogJy5wcm9kdWN0LWl0ZW0tdGV4dCcsXG4gICAgZWRpdG9yU3VtQmxvY2tDbGFzczogJy5lZGl0b3Itc3VtJyxcbiAgICBlZGl0b3JTZXR0aW5nc0Jsb2NrQ2xhc3M6ICcuZWRpdG9yLXNldHRpbmdzJyxcbiAgICBlZGl0b3JIaXN0b3J5VW5kb0Jsb2NrQ2xhc3M6ICcuZWRpdG9yLWhpc3RvcnktdW5kbycsXG4gICAgZWRpdG9ySGlzdG9yeVJlZG9CbG9ja0NsYXNzOiAnLmVkaXRvci1oaXN0b3J5LXJlZG8nLFxuICAgIGVkaXRvckNsaXBJbWFnZUJsb2NrQ2xhc3M6ICcuZWRpdG9yLXNldHRpbmdzX19jbGlwLWltYWdlJyxcbiAgICBlZGl0b3JBZGRPcmRlckJ1dHRvbkNsYXNzOiAnLmVkaXRvci1zZXR0aW5nc19fYWRkLW9yZGVyLWJ1dHRvbicsXG4gICAgZWRpdG9yUHJvZHVjdE5hbWVDbGFzczogJy5lZGl0b3Itc2V0dGluZ3NfX3Byb2R1Y3QtbmFtZScsXG4gICAgZWRpdG9yQ29sb3JzTGlzdEJsb2NrQ2xhc3M6ICcuZWRpdG9yLXNldHRpbmdzX19jb2xvcnMtbGlzdCcsXG4gICAgZWRpdG9yQ29sb3JJdGVtQmxvY2tDbGFzczogJy5lZGl0b3Itc2V0dGluZ3NfX2NvbG9yLWl0ZW0nLFxuICAgIGVkaXRvclNpemVzTGlzdEJsb2NrQ2xhc3M6ICcuZWRpdG9yLXNldHRpbmdzX19zaXplcy1saXN0JyxcbiAgICBlZGl0b3JTaXplSXRlbUJsb2NrQ2xhc3M6ICcuZWRpdG9yLXNldHRpbmdzX19zaXplLWl0ZW0nLFxuICAgIGVkaXRvckxheW91dHNMaXN0QmxvY2tDbGFzczogJy5lZGl0b3ItbGF5b3V0c19fbGF5b3V0cy1saXN0JyxcbiAgICBlZGl0b3JMYXlvdXRJdGVtQmxvY2tDbGFzczogJy5lZGl0b3ItbGF5b3V0c19fbGF5b3V0LWl0ZW0nLFxuICAgIGVkaXRvckxheW91dEl0ZW1CbG9ja1ZpZXdDbGFzczogJy5lZGl0b3ItbGF5b3V0c19fbGF5b3V0LWl0ZW0tdmlldycsXG4gICAgZWRpdG9yTGF5b3V0SXRlbUJsb2NrTmFtZUNsYXNzOiAnLmVkaXRvci1sYXlvdXRzX19sYXlvdXQtaXRlbS1uYW1lJyxcbiAgICBlZGl0b3JMYXlvdXRJdGVtQmxvY2tSZW1vdmVDbGFzczogJy5lZGl0b3ItbGF5b3V0c19fbGF5b3V0LWl0ZW0tcmVtb3ZlJyxcbiAgICBlZGl0b3JMYXlvdXRJdGVtQmxvY2tFZGl0Q2xhc3M6ICcuZWRpdG9yLWxheW91dHNfX2xheW91dC1pdGVtLWVkaXQnLFxuICAgIGVkaXRvclVwbG9hZEltYWdlQnV0dG9uQ2xhc3M6ICcuZWRpdG9yLXVwbG9hZC1pbWFnZS1idXR0b24nLFxuICAgIGVkaXRvclVwbG9hZFZpZXdCbG9ja0NsYXNzOiAnLmVkaXRvci11cGxvYWQtdmlldy1ibG9jaycsXG4gICAgZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uQ2xhc3M6ICcuZWRpdG9yLXVwbG9hZC1jYW5jZWwtYnV0dG9uJyxcbiAgICBlZGl0b3JRdWFudGl0eUZvcm1CbG9ja0NsYXNzOiAnLmVkaXRvci1xdWFudGl0eS1mb3JtJyxcbiAgICBlZGl0b3JMb2FkV2l0aEFpQnV0dG9uQ2xhc3M6ICcuZWRpdG9yLWxvYWQtd2l0aC1haS1idXR0b24nLFxuICAgIGVkaXRvckxvYWRXaXRob3V0QWlCdXR0b25DbGFzczogJy5lZGl0b3ItbG9hZC13aXRob3V0LWFpLWJ1dHRvbicsXG59O1xuZXhwb3J0IGNvbnN0IGZvcm1Db25maWcgPSB7XG4gICAgZm9ybUJsb2NrQ2xhc3M6ICcuZWRpdG9yLWZvcm0nLFxuICAgIGZvcm1CdXR0b25DbGFzczogJy5lZGl0b3ItZm9ybV9fYnV0dG9uJyxcbiAgICBmb3JtSW5wdXRWYXJpYWJsZU5hbWU6ICdwcm9tcHQnLFxufTtcbiIsImV4cG9ydCBjbGFzcyBFZGl0b3JTdG9yYWdlTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZGF0YWJhc2UgPSBudWxsO1xuICAgICAgICB0aGlzLmlzUmVhZHkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZWFkeVByb21pc2UgPSB0aGlzLmluaXQoKTtcbiAgICB9XG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9wZW5SZXF1ZXN0ID0gaW5kZXhlZERCLm9wZW4oXCJlZGl0b3JcIiwgMik7XG4gICAgICAgICAgICBvcGVuUmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRhYmFzZSA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgaWYgKCFkYXRhYmFzZS5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKCdoaXN0b3J5JykpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlT2JqZWN0U3RvcmUoJ2hpc3RvcnknLCB7IGtleVBhdGg6ICdpZCcgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghZGF0YWJhc2Uub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucygnZWRpdG9yX3N0YXRlJykpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlT2JqZWN0U3RvcmUoJ2VkaXRvcl9zdGF0ZScsIHsga2V5UGF0aDogJ2tleScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghZGF0YWJhc2Uub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucygndXNlcl9kYXRhJykpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlT2JqZWN0U3RvcmUoJ3VzZXJfZGF0YScsIHsga2V5UGF0aDogJ2tleScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG9wZW5SZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcItCe0YjQuNCx0LrQsCDQvtGC0LrRgNGL0YLQuNGPIEluZGV4ZWREQlwiLCBvcGVuUmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG9wZW5SZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBvcGVuUmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhYmFzZSA9IG9wZW5SZXF1ZXN0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICB0aGlzLmlzUmVhZHkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyB3YWl0Rm9yUmVhZHkoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMucmVhZHlQcm9taXNlO1xuICAgIH1cbiAgICBhc3luYyBzYXZlRWRpdG9yU3RhdGUoc3RhdGUpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2VkaXRvcl9zdGF0ZSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2VkaXRvcl9zdGF0ZScpO1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICdkYXRlJywgc3RhdGUuZGF0ZSksXG4gICAgICAgICAgICB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICdjb2xvcicsIHN0YXRlLmNvbG9yKSxcbiAgICAgICAgICAgIHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ3NpZGUnLCBzdGF0ZS5zaWRlKSxcbiAgICAgICAgICAgIHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ3R5cGUnLCBzdGF0ZS50eXBlKSxcbiAgICAgICAgICAgIHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ3NpemUnLCBzdGF0ZS5zaXplKVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgYXN5bmMgbG9hZEVkaXRvclN0YXRlKCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnZWRpdG9yX3N0YXRlJ10sICdyZWFkb25seScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdlZGl0b3Jfc3RhdGUnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IFtkYXRlLCBjb2xvciwgc2lkZSwgdHlwZSwgc2l6ZV0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICAgICAgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAnZGF0ZScpLFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ2NvbG9yJyksXG4gICAgICAgICAgICAgICAgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAnc2lkZScpLFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ3R5cGUnKSxcbiAgICAgICAgICAgICAgICB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICdzaXplJylcbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgaWYgKCFkYXRlIHx8ICFjb2xvciB8fCAhc2lkZSB8fCAhdHlwZSB8fCAhc2l6ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBkYXRlLFxuICAgICAgICAgICAgICAgIGNvbG9yLFxuICAgICAgICAgICAgICAgIHNpZGUsXG4gICAgICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgICAgICBzaXplXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcign0J7RiNC40LHQutCwINC30LDQs9GA0YPQt9C60Lgg0YHQvtGB0YLQvtGP0L3QuNGPINGA0LXQtNCw0LrRgtC+0YDQsDonLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBjbGVhckVkaXRvclN0YXRlKCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnZWRpdG9yX3N0YXRlJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnZWRpdG9yX3N0YXRlJyk7XG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlRGF0YShvYmplY3RTdG9yZSwgJ2RhdGUnKSxcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlRGF0YShvYmplY3RTdG9yZSwgJ2NvbG9yJyksXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZURhdGEob2JqZWN0U3RvcmUsICdzaWRlJyksXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZURhdGEob2JqZWN0U3RvcmUsICd0eXBlJyksXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZURhdGEob2JqZWN0U3RvcmUsICdzaXplJylcbiAgICAgICAgXSk7XG4gICAgfVxuICAgIGFzeW5jIGdldFVzZXJJZCgpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ3VzZXJfZGF0YSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3VzZXJfZGF0YScpO1xuICAgICAgICBsZXQgdXNlcklkID0gYXdhaXQgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAndXNlcklkJyk7XG4gICAgICAgIGlmICghdXNlcklkKSB7XG4gICAgICAgICAgICB1c2VySWQgPSBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wdXREYXRhKG9iamVjdFN0b3JlLCAndXNlcklkJywgdXNlcklkKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXNlcklkO1xuICAgIH1cbiAgICBhc3luYyBzYXZlVG9IaXN0b3J5KGl0ZW0sIGRlc2NyaXB0aW9uKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCBoaXN0b3J5SXRlbSA9IHtcbiAgICAgICAgICAgIC4uLml0ZW0sXG4gICAgICAgICAgICBpZDogY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbiB8fCBg0JjQt9C80LXQvdC10L3QuNGPINC+0YIgJHtuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCl9YFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydoaXN0b3J5J10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuYWRkKGhpc3RvcnlJdGVtKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGhpc3RvcnlJdGVtLmlkO1xuICAgIH1cbiAgICBhc3luYyBzYXZlTGF5ZXJPcGVyYXRpb24ob3BlcmF0aW9uLCBsYXlvdXQsIHNpZGUsIHR5cGUsIGRlc2NyaXB0aW9uKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCBsYXllckhpc3RvcnlJdGVtID0ge1xuICAgICAgICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICAgICAgICBvcGVyYXRpb24sXG4gICAgICAgICAgICBsYXlvdXQ6IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobGF5b3V0KSksXG4gICAgICAgICAgICBzaWRlLFxuICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbiB8fCBgJHtvcGVyYXRpb24gPT09ICdhZGQnID8gJ9CU0L7QsdCw0LLQu9C10L0nIDogJ9Cj0LTQsNC70LXQvSd9INGB0LvQvtC5OiAke2xheW91dC5uYW1lIHx8IGxheW91dC50eXBlfWBcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmFkZCh7IC4uLmxheWVySGlzdG9yeUl0ZW0sIGlzTGF5ZXJPcGVyYXRpb246IHRydWUgfSk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBsYXllckhpc3RvcnlJdGVtLmlkO1xuICAgIH1cbiAgICBhc3luYyBnZXRMYXllckhpc3RvcnkoZmlsdGVyLCBsaW1pdCA9IDUwKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydoaXN0b3J5J10sICdyZWFkb25seScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gb2JqZWN0U3RvcmUuZ2V0QWxsKCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhbGxJdGVtcyA9IHJlcXVlc3QucmVzdWx0O1xuICAgICAgICAgICAgICAgIGNvbnN0IGxheWVyT3BlcmF0aW9ucyA9IGFsbEl0ZW1zXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uaXNMYXllck9wZXJhdGlvbiAmJiBpdGVtLnNpZGUgPT09IGZpbHRlci5zaWRlICYmIGl0ZW0udHlwZSA9PT0gZmlsdGVyLnR5cGUpXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKGl0ZW0pID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBpdGVtLmlkLFxuICAgICAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IGl0ZW0udGltZXN0YW1wLFxuICAgICAgICAgICAgICAgICAgICBvcGVyYXRpb246IGl0ZW0ub3BlcmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICBsYXlvdXQ6IGl0ZW0ubGF5b3V0LFxuICAgICAgICAgICAgICAgICAgICBzaWRlOiBpdGVtLnNpZGUsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGl0ZW0udHlwZSxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGl0ZW0uZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IGIudGltZXN0YW1wIC0gYS50aW1lc3RhbXApXG4gICAgICAgICAgICAgICAgICAgIC5zbGljZSgwLCBsaW1pdCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShsYXllck9wZXJhdGlvbnMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIGdldFJlY2VudExheWVyT3BlcmF0aW9ucyhmaWx0ZXIsIGxpbWl0ID0gMTApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TGF5ZXJIaXN0b3J5KGZpbHRlciwgbGltaXQpO1xuICAgIH1cbiAgICBhc3luYyBnZXRIaXN0b3J5KGZpbHRlciwgbGltaXQgPSA1MCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZG9ubHknKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmdldEFsbCgpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsSXRlbXMgPSByZXF1ZXN0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJlZEl0ZW1zID0gYWxsSXRlbXNcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihpdGVtID0+IGl0ZW0uc2lkZSA9PT0gZmlsdGVyLnNpZGUgJiYgaXRlbS50eXBlID09PSBmaWx0ZXIudHlwZSlcbiAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IGIudGltZXN0YW1wIC0gYS50aW1lc3RhbXApXG4gICAgICAgICAgICAgICAgICAgIC5zbGljZSgwLCBsaW1pdCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShmaWx0ZXJlZEl0ZW1zKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBnZXRIaXN0b3J5SXRlbShpZCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZG9ubHknKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmdldChpZCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUocmVxdWVzdC5yZXN1bHQgfHwgbnVsbCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBkZWxldGVIaXN0b3J5SXRlbShpZCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmRlbGV0ZShpZCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIGNsZWFySGlzdG9yeShmaWx0ZXIpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIGlmICghZmlsdGVyKSB7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBhbGxJdGVtcyA9IGF3YWl0IHRoaXMuZ2V0SGlzdG9yeShmaWx0ZXIsIDEwMDApO1xuICAgICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGFsbEl0ZW1zKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5kZWxldGVIaXN0b3J5SXRlbShpdGVtLmlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBzYXZlTGF5ZXJzKGxheWVycykge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnZWRpdG9yX3N0YXRlJ10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnZWRpdG9yX3N0YXRlJyk7XG4gICAgICAgIGF3YWl0IHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ2xheWVycycsIGxheWVycyk7XG4gICAgfVxuICAgIGFzeW5jIGxvYWRMYXllcnMoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnZWRpdG9yX3N0YXRlJ10sICdyZWFkb25seScpO1xuICAgICAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnZWRpdG9yX3N0YXRlJyk7XG4gICAgICAgICAgICBjb25zdCBsYXllcnMgPSBhd2FpdCB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICdsYXllcnMnKTtcbiAgICAgICAgICAgIHJldHVybiBsYXllcnMgfHwgbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ9Ce0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4INGB0LvQvtGR0LI6JywgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHV0RGF0YShvYmplY3RTdG9yZSwga2V5LCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLnB1dCh7IGtleSwgdmFsdWUgfSk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldERhdGEob2JqZWN0U3RvcmUsIGtleSkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmdldChrZXkpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKHJlcXVlc3QucmVzdWx0Py52YWx1ZSB8fCBudWxsKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGRlbGV0ZURhdGEob2JqZWN0U3RvcmUsIGtleSkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiIsImNvbnN0IERFRkFVTFRfVkFMVUVTID0ge1xuICAgIFBPU0lUSU9OOiB7IHg6IDAsIHk6IDAgfSxcbiAgICBTSVpFOiAxLFxuICAgIEFTUEVDVF9SQVRJTzogMSxcbiAgICBBTkdMRTogMCxcbiAgICBURVhUOiAnUHJpbnRMb29wJyxcbiAgICBGT05UOiB7IGZhbWlseTogJ0FyaWFsJywgc2l6ZTogMTIgfSxcbn07XG5leHBvcnQgY2xhc3MgTGF5b3V0IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICB0aGlzLmlkID0gcHJvcHMuaWQgfHwgTGF5b3V0LmdlbmVyYXRlSWQoKTtcbiAgICAgICAgdGhpcy50eXBlID0gcHJvcHMudHlwZTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHByb3BzLnBvc2l0aW9uIHx8IHsgLi4uREVGQVVMVF9WQUxVRVMuUE9TSVRJT04gfTtcbiAgICAgICAgdGhpcy5zaXplID0gdGhpcy52YWxpZGF0ZVNpemUocHJvcHMuc2l6ZSA/PyBERUZBVUxUX1ZBTFVFUy5TSVpFKTtcbiAgICAgICAgdGhpcy5hc3BlY3RSYXRpbyA9IHRoaXMudmFsaWRhdGVBc3BlY3RSYXRpbyhwcm9wcy5hc3BlY3RSYXRpbyA/PyBERUZBVUxUX1ZBTFVFUy5BU1BFQ1RfUkFUSU8pO1xuICAgICAgICB0aGlzLnZpZXcgPSBwcm9wcy52aWV3O1xuICAgICAgICB0aGlzLmFuZ2xlID0gdGhpcy5ub3JtYWxpemVBbmdsZShwcm9wcy5hbmdsZSA/PyBERUZBVUxUX1ZBTFVFUy5BTkdMRSk7XG4gICAgICAgIHRoaXMubmFtZSA9IHByb3BzLm5hbWUgPz8gbnVsbDtcbiAgICAgICAgaWYgKHByb3BzLnR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgICAgIHRoaXMudXJsID0gcHJvcHMudXJsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHByb3BzLnR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgICAgICAgdGhpcy50ZXh0ID0gcHJvcHMudGV4dCB8fCBERUZBVUxUX1ZBTFVFUy5URVhUO1xuICAgICAgICAgICAgdGhpcy5mb250ID0gcHJvcHMuZm9udCA/IHsgLi4ucHJvcHMuZm9udCB9IDogeyAuLi5ERUZBVUxUX1ZBTFVFUy5GT05UIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljIGdlbmVyYXRlSWQoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY3J5cHRvICE9PSAndW5kZWZpbmVkJyAmJiBjcnlwdG8ucmFuZG9tVVVJRCkge1xuICAgICAgICAgICAgcmV0dXJuIGNyeXB0by5yYW5kb21VVUlEKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGAke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIsIDExKX1gO1xuICAgIH1cbiAgICB2YWxpZGF0ZVNpemUoc2l6ZSkge1xuICAgICAgICBpZiAoc2l6ZSA8PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEludmFsaWQgc2l6ZSAke3NpemV9LCB1c2luZyBkZWZhdWx0ICR7REVGQVVMVF9WQUxVRVMuU0laRX1gKTtcbiAgICAgICAgICAgIHJldHVybiBERUZBVUxUX1ZBTFVFUy5TSVpFO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaXplO1xuICAgIH1cbiAgICB2YWxpZGF0ZUFzcGVjdFJhdGlvKHJhdGlvKSB7XG4gICAgICAgIGlmIChyYXRpbyA8PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEludmFsaWQgYXNwZWN0IHJhdGlvICR7cmF0aW99LCB1c2luZyBkZWZhdWx0ICR7REVGQVVMVF9WQUxVRVMuQVNQRUNUX1JBVElPfWApO1xuICAgICAgICAgICAgcmV0dXJuIERFRkFVTFRfVkFMVUVTLkFTUEVDVF9SQVRJTztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmF0aW87XG4gICAgfVxuICAgIG5vcm1hbGl6ZUFuZ2xlKGFuZ2xlKSB7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBhbmdsZSAlIDM2MDtcbiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQgPCAwID8gbm9ybWFsaXplZCArIDM2MCA6IG5vcm1hbGl6ZWQ7XG4gICAgfVxuICAgIGlzSW1hZ2VMYXlvdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGUgPT09ICdpbWFnZScgJiYgdGhpcy51cmwgIT09IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaXNUZXh0TGF5b3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlID09PSAndGV4dCcgJiYgdGhpcy50ZXh0ICE9PSB1bmRlZmluZWQgJiYgdGhpcy5mb250ICE9PSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHNldFBvc2l0aW9uKHgsIHkpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHsgeCwgeSB9O1xuICAgIH1cbiAgICBtb3ZlKGR4LCBkeSkge1xuICAgICAgICB0aGlzLnBvc2l0aW9uLnggKz0gZHg7XG4gICAgICAgIHRoaXMucG9zaXRpb24ueSArPSBkeTtcbiAgICB9XG4gICAgc2V0U2l6ZShzaXplKSB7XG4gICAgICAgIHRoaXMuc2l6ZSA9IHRoaXMudmFsaWRhdGVTaXplKHNpemUpO1xuICAgIH1cbiAgICByb3RhdGUoYW5nbGUpIHtcbiAgICAgICAgdGhpcy5hbmdsZSA9IHRoaXMubm9ybWFsaXplQW5nbGUodGhpcy5hbmdsZSArIGFuZ2xlKTtcbiAgICB9XG4gICAgc2V0QW5nbGUoYW5nbGUpIHtcbiAgICAgICAgdGhpcy5hbmdsZSA9IHRoaXMubm9ybWFsaXplQW5nbGUoYW5nbGUpO1xuICAgIH1cbiAgICBzZXRUZXh0KHRleHQpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNUZXh0TGF5b3V0KCkpIHtcbiAgICAgICAgICAgIHRoaXMudGV4dCA9IHRleHQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0Rm9udChmb250KSB7XG4gICAgICAgIGlmICh0aGlzLmlzVGV4dExheW91dCgpICYmIHRoaXMuZm9udCkge1xuICAgICAgICAgICAgdGhpcy5mb250ID0geyAuLi50aGlzLmZvbnQsIC4uLmZvbnQgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjbG9uZSgpIHtcbiAgICAgICAgaWYgKHRoaXMudHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgICAgICAgY29uc3QgcHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlJyxcbiAgICAgICAgICAgICAgICB1cmw6IHRoaXMudXJsLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7IC4uLnRoaXMucG9zaXRpb24gfSxcbiAgICAgICAgICAgICAgICBzaXplOiB0aGlzLnNpemUsXG4gICAgICAgICAgICAgICAgYXNwZWN0UmF0aW86IHRoaXMuYXNwZWN0UmF0aW8sXG4gICAgICAgICAgICAgICAgdmlldzogdGhpcy52aWV3LFxuICAgICAgICAgICAgICAgIGFuZ2xlOiB0aGlzLmFuZ2xlLFxuICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gbmV3IExheW91dChwcm9wcyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBwcm9wcyA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHsgLi4udGhpcy5wb3NpdGlvbiB9LFxuICAgICAgICAgICAgICAgIHNpemU6IHRoaXMuc2l6ZSxcbiAgICAgICAgICAgICAgICBhc3BlY3RSYXRpbzogdGhpcy5hc3BlY3RSYXRpbyxcbiAgICAgICAgICAgICAgICB2aWV3OiB0aGlzLnZpZXcsXG4gICAgICAgICAgICAgICAgYW5nbGU6IHRoaXMuYW5nbGUsXG4gICAgICAgICAgICAgICAgbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICh0aGlzLnRleHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHByb3BzLnRleHQgPSB0aGlzLnRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5mb250ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBwcm9wcy5mb250ID0geyAuLi50aGlzLmZvbnQgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgTGF5b3V0KHByb3BzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIGNvbnN0IGJhc2UgPSB7XG4gICAgICAgICAgICBpZDogdGhpcy5pZCxcbiAgICAgICAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLnBvc2l0aW9uLFxuICAgICAgICAgICAgc2l6ZTogdGhpcy5zaXplLFxuICAgICAgICAgICAgYXNwZWN0UmF0aW86IHRoaXMuYXNwZWN0UmF0aW8sXG4gICAgICAgICAgICB2aWV3OiB0aGlzLnZpZXcsXG4gICAgICAgICAgICBhbmdsZTogdGhpcy5hbmdsZSxcbiAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHRoaXMudHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgICAgICAgcmV0dXJuIHsgLi4uYmFzZSwgdXJsOiB0aGlzLnVybCB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICAgICAgICByZXR1cm4geyAuLi5iYXNlLCB0ZXh0OiB0aGlzLnRleHQsIGZvbnQ6IHRoaXMuZm9udCB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYXNlO1xuICAgIH1cbiAgICBzdGF0aWMgZnJvbUpTT04oanNvbikge1xuICAgICAgICByZXR1cm4gbmV3IExheW91dChqc29uKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZUltYWdlKHByb3BzKSB7XG4gICAgICAgIHJldHVybiBuZXcgTGF5b3V0KHsgLi4ucHJvcHMsIHR5cGU6ICdpbWFnZScgfSk7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGVUZXh0KHByb3BzKSB7XG4gICAgICAgIHJldHVybiBuZXcgTGF5b3V0KHsgLi4ucHJvcHMsIHR5cGU6ICd0ZXh0JyB9KTtcbiAgICB9XG59XG4iLCJleHBvcnQgY2xhc3MgVHlwZWRFdmVudEVtaXR0ZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmxpc3RlbmVycyA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgb24oZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5saXN0ZW5lcnMuaGFzKGV2ZW50KSkge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuc2V0KGV2ZW50LCBuZXcgU2V0KCkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGlzdGVuZXJzLmdldChldmVudCkuYWRkKGxpc3RlbmVyKTtcbiAgICB9XG4gICAgb25jZShldmVudCwgbGlzdGVuZXIpIHtcbiAgICAgICAgY29uc3Qgb25jZVdyYXBwZXIgPSAoZGV0YWlsKSA9PiB7XG4gICAgICAgICAgICBsaXN0ZW5lcihkZXRhaWwpO1xuICAgICAgICAgICAgdGhpcy5vZmYoZXZlbnQsIG9uY2VXcmFwcGVyKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5vbihldmVudCwgb25jZVdyYXBwZXIpO1xuICAgIH1cbiAgICBvZmYoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50TGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnMuZ2V0KGV2ZW50KTtcbiAgICAgICAgaWYgKGV2ZW50TGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBldmVudExpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuICAgICAgICAgICAgaWYgKGV2ZW50TGlzdGVuZXJzLnNpemUgPT09IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5kZWxldGUoZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGVtaXQoZXZlbnQsIGRldGFpbCkge1xuICAgICAgICBjb25zdCBldmVudExpc3RlbmVycyA9IHRoaXMubGlzdGVuZXJzLmdldChldmVudCk7XG4gICAgICAgIGlmIChldmVudExpc3RlbmVycykge1xuICAgICAgICAgICAgZXZlbnRMaXN0ZW5lcnMuZm9yRWFjaChsaXN0ZW5lciA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIoZGV0YWlsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtFdmVudEVtaXR0ZXJdINCe0YjQuNCx0LrQsCDQsiDQvtCx0YDQsNCx0L7RgtGH0LjQutC1INGB0L7QsdGL0YLQuNGPIFwiJHtTdHJpbmcoZXZlbnQpfVwiOmAsIGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5kZWxldGUoZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuY2xlYXIoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsaXN0ZW5lckNvdW50KGV2ZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVycy5nZXQoZXZlbnQpPy5zaXplIHx8IDA7XG4gICAgfVxuICAgIGhhc0xpc3RlbmVycyhldmVudCkge1xuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lckNvdW50KGV2ZW50KSA+IDA7XG4gICAgfVxuICAgIGV2ZW50TmFtZXMoKSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMubGlzdGVuZXJzLmtleXMoKSk7XG4gICAgfVxuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzLmNsZWFyKCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgRWRpdG9yU3RvcmFnZU1hbmFnZXIgfSBmcm9tICcuLi9tYW5hZ2Vycy9FZGl0b3JTdG9yYWdlTWFuYWdlcic7XG5pbXBvcnQgeyBwcm9kdWN0Q29uZmlncyB9IGZyb20gJy4uL2NvbmZpZy9wcm9kdWN0cyc7XG5jb25zdCBBUElfRU5EUE9JTlRTID0ge1xuICAgIFdFQkhPT0tfUkVRVUVTVDogJ2h0dHBzOi8vcHJpbWFyeS1wcm9kdWN0aW9uLTY1NGMudXAucmFpbHdheS5hcHAvd2ViaG9vay9yZXF1ZXN0Jyxcbn07XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVJbWFnZSh7IHByb21wdCwgc2hpcnRDb2xvciwgaW1hZ2UsIHdpdGhBaSwgbGF5b3V0SWQsIGlzTmV3ID0gdHJ1ZSwgfSkge1xuICAgIGNvbnN0IHRlbXBTdG9yYWdlTWFuYWdlciA9IG5ldyBFZGl0b3JTdG9yYWdlTWFuYWdlcigpO1xuICAgIGNvbnN0IHVzZXJJZCA9IGF3YWl0IHRlbXBTdG9yYWdlTWFuYWdlci5nZXRVc2VySWQoKTtcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgIGZvcm1EYXRhLnNldCgndXNlcklkJywgdXNlcklkKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3Byb21wdCcsIHByb21wdCk7XG4gICAgZm9ybURhdGEuc2V0KCdzaGlydENvbG9yJywgc2hpcnRDb2xvcik7XG4gICAgZm9ybURhdGEuc2V0KCdwbGFjZW1lbnQnLCAnY2VudGVyJyk7XG4gICAgZm9ybURhdGEuc2V0KCdwcmludFNpemUnLCBcImJpZ1wiKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3RyYW5zZmVyVHlwZScsICcnKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3JlcXVlc3RfdHlwZScsICdnZW5lcmF0ZScpO1xuICAgIGlmIChsYXlvdXRJZClcbiAgICAgICAgZm9ybURhdGEuc2V0KCdsYXlvdXRJZCcsIGxheW91dElkKTtcbiAgICBpZiAoaW1hZ2UpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2dlbmVyYXRlIGltYWdlXScsIGltYWdlKTtcbiAgICAgICAgY29uc3QgW2hlYWRlciwgZGF0YV0gPSBpbWFnZS5zcGxpdCgnLCcpO1xuICAgICAgICBjb25zdCB0eXBlID0gaGVhZGVyLnNwbGl0KCc6JylbMV0uc3BsaXQoJzsnKVswXTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2dlbmVyYXRlIGltYWdlXSBbdHlwZV0nLCB0eXBlKTtcbiAgICAgICAgY29uc3QgYnl0ZUNoYXJhY3RlcnMgPSBhdG9iKGRhdGEpO1xuICAgICAgICBjb25zdCBieXRlTnVtYmVycyA9IG5ldyBBcnJheShieXRlQ2hhcmFjdGVycy5sZW5ndGgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJ5dGVDaGFyYWN0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBieXRlTnVtYmVyc1tpXSA9IGJ5dGVDaGFyYWN0ZXJzLmNoYXJDb2RlQXQoaSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYnl0ZUFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYnl0ZU51bWJlcnMpO1xuICAgICAgICBmb3JtRGF0YS5zZXQoJ3JlcXVlc3RfdHlwZScsICdpbWFnZScpO1xuICAgICAgICBmb3JtRGF0YS5zZXQoJ3VzZXJfaW1hZ2UnLCBuZXcgQmxvYihbYnl0ZUFycmF5XSwgeyB0eXBlOiBcImltYWdlL3BuZ1wiIH0pKTtcbiAgICAgICAgZm9ybURhdGEuc2V0KCd0cmFuc2ZlclR5cGUnLCB3aXRoQWkgPyBcImFpXCIgOiBcIm5vLWFpXCIpO1xuICAgIH1cbiAgICBpZiAoIWlzTmV3KSB7XG4gICAgICAgIGZvcm1EYXRhLnNldCgncmVxdWVzdF90eXBlJywgJ2VkaXQnKTtcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChBUElfRU5EUE9JTlRTLldFQkhPT0tfUkVRVUVTVCwge1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBib2R5OiBmb3JtRGF0YSxcbiAgICB9KTtcbiAgICBjb25zdCByZXNwb25zZURhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgcmV0dXJuIHJlc3BvbnNlRGF0YS5pbWFnZV91cmwgfHwgcmVzcG9uc2VEYXRhLmltYWdlO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVByb2R1Y3QoeyBxdWFudGl0eSwgbmFtZSwgc2l6ZSwgY29sb3IsIHNpZGVzLCBwcm9kdWN0VHlwZSwgYXJ0aWNsZSB9KSB7XG4gICAgY29uc3QgcHJvZHVjdElkID0gKE1hdGgucmFuZG9tKCkgKyAxKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDcpICsgXCJfXCIgKyBEYXRlLm5vdygpO1xuICAgIGNvbnN0IHByb2R1Y3RDb25maWcgPSBwcm9kdWN0Q29uZmlncy5maW5kKHAgPT4gcC50eXBlID09PSBwcm9kdWN0VHlwZSk7XG4gICAgY29uc3QgcHJpY2UgPSBzaWRlcy5sZW5ndGggPT0gMVxuICAgICAgICA/IChwcm9kdWN0Q29uZmlnPy5wcmljZSB8fCAxOTkwKVxuICAgICAgICA6IChwcm9kdWN0Q29uZmlnPy5kb3VibGVTaWRlZFByaWNlIHx8IDI0OTApO1xuICAgIGNvbnN0IHJlc3VsdFByb2R1Y3QgPSB7XG4gICAgICAgIGlkOiBwcm9kdWN0SWQsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIHByaWNlLFxuICAgICAgICBxdWFudGl0eTogcXVhbnRpdHksXG4gICAgICAgIGltZzogc2lkZXNbMF0/LmltYWdlX3VybCxcbiAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgICAgeyBvcHRpb246ICfQlNC40LfQsNC50L0nLCB2YXJpYW50OiBgPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiR7c2lkZXNbMF0/LmltYWdlX3VybH1cIiB0YXJnZXQ9XCJfYmxhbmtcIj4ke3NpZGVzWzBdPy5pbWFnZV91cmwuc2xpY2UoLTEwKX08L2E+YCB9LFxuICAgICAgICAgICAgKHNpZGVzLmxlbmd0aCA+IDEpICYmIHsgb3B0aW9uOiAn0JTQuNC30LDQudC9JywgdmFyaWFudDogYDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCIke3NpZGVzWzFdPy5pbWFnZV91cmx9XCIgdGFyZ2V0PVwiX2JsYW5rXCI+JHtzaWRlc1sxXT8uaW1hZ2VfdXJsLnNsaWNlKC0xMCl9PC9hPmAgfSxcbiAgICAgICAgICAgIHsgb3B0aW9uOiAn0JDRgNGC0LjQutGD0LsnLCB2YXJpYW50OiBhcnRpY2xlIH0sXG4gICAgICAgICAgICB7IG9wdGlvbjogJ9Cg0LDQt9C80LXRgCcsIHZhcmlhbnQ6IHNpemUgfSxcbiAgICAgICAgICAgIHsgb3B0aW9uOiAn0KbQstC10YInLCB2YXJpYW50OiBjb2xvci5uYW1lIH0sXG4gICAgICAgICAgICB7IG9wdGlvbjogJ9Cf0YDQuNC90YInLCB2YXJpYW50OiBzaWRlcy5sZW5ndGggPT0gMSA/ICfQntC00L3QvtGB0YLQvtGA0L7QvdC90LjQuScgOiAn0JTQstGD0YXRgdGC0L7RgNC+0L3QvdC40LknIH0sXG4gICAgICAgIF1cbiAgICB9O1xuICAgIGNvbnNvbGUuZGVidWcoJ1tjYXJ0XSBhZGQgcHJvZHVjdCcsIHJlc3VsdFByb2R1Y3QpO1xuICAgIGlmICh0eXBlb2Ygd2luZG93LnRjYXJ0X19hZGRQcm9kdWN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB3aW5kb3cudGNhcnRfX2FkZFByb2R1Y3QocmVzdWx0UHJvZHVjdCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbY2FydF0g0J7RiNC40LHQutCwINC/0YDQuCDQtNC+0LHQsNCy0LvQtdC90LjQuCDQv9GA0L7QtNGD0LrRgtCwINCyINC60L7RgNC30LjQvdGDJywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1tjYXJ0XSDQmtC+0YDQt9C40L3QsCBUaWxkYSDQvdC1INC30LDQs9GA0YPQttC10L3QsC4nKTtcbiAgICB9XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gZ2V0TGFzdENoaWxkKGVsZW1lbnQpIHtcbiAgICBpZiAoIWVsZW1lbnQpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIGlmICghZWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZClcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgcmV0dXJuIGdldExhc3RDaGlsZChlbGVtZW50LmZpcnN0RWxlbWVudENoaWxkKTtcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IFBvcHVwIGZyb20gJy4vY29tcG9uZW50cy9Qb3B1cCc7XG5pbXBvcnQgRWRpdG9yIGZyb20gJy4vY29tcG9uZW50cy9FZGl0b3InO1xuaW1wb3J0IHsgQ2FyZEZvcm0gfSBmcm9tICcuL2NvbXBvbmVudHMvQ2FyZEZvcm0nO1xud2luZG93LnBvcHVwID0gUG9wdXA7XG53aW5kb3cuZWRpdG9yID0gRWRpdG9yO1xud2luZG93LmNhcmRGb3JtID0gQ2FyZEZvcm07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=