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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZDQUE2QyxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSx1QkFBdUI7QUFDNUc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QixpQkFBaUIsR0FBRyxpQkFBaUIsR0FBRyx1QkFBdUI7QUFDM0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUVBQWlFLFNBQVM7QUFDMUU7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscURBQXFELGlCQUFpQixVQUFVLGtCQUFrQixTQUFTLGlCQUFpQixTQUFTLGlCQUFpQjtBQUN0SjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQStCLCtEQUFZO0FBQzNDO0FBQ0EsMERBQTBELE1BQU07QUFDaEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0NBQXdDLCtEQUFZO0FBQ3BELDJDQUEyQywrREFBWTtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0NBQXdDLCtEQUFZO0FBQ3BELDJDQUEyQywrREFBWTtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QiwrREFBWTtBQUNwQztBQUNBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQywrREFBWTtBQUM1QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLHVDQUF1QztBQUNsRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsdUNBQXVDO0FBQ2xFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0MsS0FBSztBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0RBQXNELEtBQUs7QUFDM0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdELGFBQWE7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxREFBcUQsV0FBVztBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQSxFOzs7OztXQ1BBLHdGOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RCxFOzs7Ozs7Ozs7Ozs7OztBQ051QztBQUNFO0FBQ1E7QUFDakQsZUFBZSx5REFBSztBQUNwQixnQkFBZ0IsMERBQU07QUFDdEIsa0JBQWtCLDBEQUFRIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9jb21wb25lbnRzL0NhcmRGb3JtLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvY29tcG9uZW50cy9FZGl0b3IudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9jb21wb25lbnRzL1BvcHVwLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvY29uZmlnL3Byb2R1Y3RzLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvbWFuYWdlcnMvRWRpdG9yU3RvcmFnZU1hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy9tb2RlbHMvTGF5b3V0LnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvdXRpbHMvVHlwZWRFdmVudEVtaXR0ZXIudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy91dGlscy9hcGkudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC8uL3NyYy91dGlscy90aWxkYVV0aWxzLnRzIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3Qvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IERPTV9TRUxFQ1RPUlMgPSB7XG4gICAgQ0FSVF9DT05UQUlORVI6ICcudDcwNl9fY2FydHdpbi1wcm9kdWN0cywgLnQtc3RvcmVfX2NhcnQtcHJvZHVjdHMsIC50LXN0b3JlJyxcbiAgICBDQVJUX1BST0RVQ1Q6ICcudDcwNl9fY2FydHdpbi1wcm9kdWN0LCAudC1zdG9yZV9fY2FyZCwgLnQ3MDZfX3Byb2R1Y3QnLFxuICAgIFBST0RVQ1RfVElUTEU6ICcudDcwNl9fcHJvZHVjdC10aXRsZSwgLnQtc3RvcmVfX2NhcmRfX3RpdGxlLCAudDcwNl9fcHJvZHVjdC1uYW1lJyxcbiAgICBQUk9EVUNUX0RFTF9CVVRUT046ICcudDcwNl9fcHJvZHVjdC1kZWwnLFxuICAgIFBST0RVQ1RfUExVU19CVVRUT046ICcudDcwNl9fcHJvZHVjdC1wbHVzJyxcbiAgICBQUk9EVUNUX01JTlVTX0JVVFRPTjogJy50NzA2X19wcm9kdWN0LW1pbnVzJyxcbiAgICBQUk9EVUNUX1BMVVNNSU5VUzogJy50NzA2X19wcm9kdWN0LXBsdXNtaW51cycsXG4gICAgUFJPRFVDVF9RVUFOVElUWTogJy50NzA2X19wcm9kdWN0LXF1YW50aXR5LCAudC1zdG9yZV9fY2FyZF9fcXVhbnRpdHknLFxuICAgIENBUlRfQ09VTlRFUjogJy50NzA2X19jYXJ0aWNvbi1jb3VudGVyLCAudC1zdG9yZV9fY291bnRlcicsXG4gICAgQ0FSVF9BTU9VTlQ6ICcudDcwNl9fY2FydHdpbi1wcm9kYW1vdW50LCAudC1zdG9yZV9fdG90YWwtYW1vdW50Jyxcbn07XG5jb25zdCBERUxBWVMgPSB7XG4gICAgQ0FSVF9VUERBVEU6IDMwMCxcbiAgICBET01fVVBEQVRFOiAxMDAsXG4gICAgT0JTRVJWRVJfQ0hFQ0s6IDUwMCxcbiAgICBDQVJUX0xPQURfVElNRU9VVDogMzAwMCxcbn07XG5jbGFzcyBDYXJ0VXRpbHMge1xuICAgIHN0YXRpYyB3YWl0KG1zKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbiAgICB9XG4gICAgc3RhdGljIGFzeW5jIHdhaXRGb3JFbGVtZW50KHNlbGVjdG9yLCBtYXhBdHRlbXB0cyA9IDEwLCBpbnRlcnZhbCA9IDEwMCkge1xuICAgICAgICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IG1heEF0dGVtcHRzOyBhdHRlbXB0KyspIHtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXR0ZW1wdCA8IG1heEF0dGVtcHRzIC0gMSkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMud2FpdChpbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHN0YXRpYyBmaW5kUHJvZHVjdEVsZW1lbnQocHJvZHVjdE5hbWUpIHtcbiAgICAgICAgY29uc3QgcHJvZHVjdHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKERPTV9TRUxFQ1RPUlMuQ0FSVF9QUk9EVUNUKTtcbiAgICAgICAgZm9yIChjb25zdCBwcm9kdWN0IG9mIHByb2R1Y3RzKSB7XG4gICAgICAgICAgICBjb25zdCB0aXRsZSA9IHByb2R1Y3QucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLlBST0RVQ1RfVElUTEUpO1xuICAgICAgICAgICAgaWYgKHRpdGxlICYmIHRpdGxlLnRleHRDb250ZW50Py50cmltKCkgPT09IHByb2R1Y3ROYW1lLnRyaW0oKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9kdWN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBDYXJkRm9ybSB7XG4gICAgY29uc3RydWN0b3IoeyBjYXJkQmxvY2tJZCwgcnVsZXMgfSkge1xuICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuaXNVcGRhdGluZ0NhcnQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jYXJkQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGNhcmRCbG9ja0lkKTtcbiAgICAgICAgaWYgKCF0aGlzLmNhcmRCbG9jaykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQ2FyZCBibG9jayB3aXRoIGlkICR7Y2FyZEJsb2NrSWR9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZm9ybSA9IHRoaXMuY2FyZEJsb2NrLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcbiAgICAgICAgaWYgKCF0aGlzLmZvcm0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZvcm0gYmxvY2sgd2l0aCBpZCAke2NhcmRCbG9ja0lkfSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEZvcm0oKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJ1bGVzID0gcnVsZXM7XG4gICAgICAgIHRoaXMuZmllbGRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnQtaW5wdXQtZ3JvdXAnKTtcbiAgICAgICAgdGhpcy5pbml0UnVsZXMoKTtcbiAgICAgICAgdGhpcy5pbml0Q2FydE9ic2VydmVyKCk7XG4gICAgfVxuICAgIGluaXRGb3JtKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2luaXRdJywgdGhpcy5mb3JtLmVsZW1lbnRzKTtcbiAgICAgICAgdGhpcy5mb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0O1xuICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gdGFyZ2V0Py5uYW1lO1xuICAgICAgICAgICAgY29uc3QgZmllbGRWYWx1ZSA9IHRhcmdldD8udmFsdWU7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2lucHV0XScsIGUpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhmaWVsZFZhbHVlLCBcInxcIiwgZmllbGROYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IHJ1bGUgPSB0aGlzLnJ1bGVzLmZpbmQociA9PiByLnZhcmlhYmxlID09PSBmaWVsZE5hbWUpO1xuICAgICAgICAgICAgaWYgKHJ1bGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvbGRTdGF0ZSA9IG5ldyBNYXAodGhpcy5hY3Rpb25zU3RhdGVzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb24gPSBydWxlLmFjdGlvbnMuZmluZChhID0+IGEudmFsdWUgPT09IGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLnNldChmaWVsZE5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBmaWVsZFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuc2V0KGZpZWxkTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBudWxsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmFwcGx5QWN0aW9ucyhvbGRTdGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmZvcm0uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0O1xuICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gdGFyZ2V0Py5uYW1lO1xuICAgICAgICAgICAgY29uc3QgZmllbGRWYWx1ZSA9IHRhcmdldD8udmFsdWU7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NoYW5nZV0nLCBlKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoZmllbGRWYWx1ZSwgXCJ8XCIsIGZpZWxkTmFtZSk7XG4gICAgICAgICAgICBjb25zdCBydWxlID0gdGhpcy5ydWxlcy5maW5kKHIgPT4gci52YXJpYWJsZSA9PT0gZmllbGROYW1lKTtcbiAgICAgICAgICAgIGlmIChydWxlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gcnVsZS5hY3Rpb25zLmZpbmQoYSA9PiBhLnZhbHVlID09PSBmaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9sZFN0YXRlID0gbmV3IE1hcCh0aGlzLmFjdGlvbnNTdGF0ZXMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuc2V0KGZpZWxkTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGZpZWxkVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGFjdGlvblxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHBseUFjdGlvbnMob2xkU3RhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkU3RhdGUgPSBuZXcgTWFwKHRoaXMuYWN0aW9uc1N0YXRlcyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uc1N0YXRlcy5zZXQoZmllbGROYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwbHlBY3Rpb25zKG9sZFN0YXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpbml0UnVsZXMoKSB7XG4gICAgICAgIHRoaXMucnVsZXMuZm9yRWFjaChydWxlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gdGhpcy5mb3JtLmVsZW1lbnRzLm5hbWVkSXRlbShydWxlLnZhcmlhYmxlKTtcbiAgICAgICAgICAgIGlmIChmaWVsZCkge1xuICAgICAgICAgICAgICAgIGxldCBmaWVsZFZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkIGluc3RhbmNlb2YgUmFkaW9Ob2RlTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVja2VkUmFkaW8gPSBBcnJheS5mcm9tKGZpZWxkKS5maW5kKChyYWRpbykgPT4gcmFkaW8uY2hlY2tlZCk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWUgPSBjaGVja2VkUmFkaW8/LnZhbHVlIHx8ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChmaWVsZCBpbnN0YW5jZW9mIEhUTUxTZWxlY3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWUgPSBmaWVsZC52YWx1ZSB8fCAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZmllbGQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlID09PSAncmFkaW8nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlID0gZmllbGQuY2hlY2tlZCA/IGZpZWxkLnZhbHVlIDogJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gJ2NoZWNrYm94Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZSA9IGZpZWxkLmNoZWNrZWQgPyBmaWVsZC52YWx1ZSA6ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZSA9IGZpZWxkLnZhbHVlIHx8ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdFJ1bGVzXSDQn9C+0LvQtTonLCBydWxlLnZhcmlhYmxlLCAn0JfQvdCw0YfQtdC90LjQtTonLCBmaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb24gPSBydWxlLmFjdGlvbnMuZmluZChhID0+IGEudmFsdWUgPT09IGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gJiYgZmllbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnNTdGF0ZXMuc2V0KHJ1bGUudmFyaWFibGUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBmaWVsZFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdFJ1bGVzXSDQmNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QviDRgdC+0YHRgtC+0Y/QvdC40LUg0LTQu9GPOicsIHJ1bGUudmFyaWFibGUsIGFjdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jbGVhbnVwQ2FydE9uSW5pdCgpO1xuICAgIH1cbiAgICBhc3luYyBjbGVhbnVwQ2FydE9uSW5pdCgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0J3QsNGH0LDQu9C+INC+0YfQuNGB0YLQutC4INC60L7RgNC30LjQvdGLJyk7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2hlY2tDYXJ0ID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRpbGRhQ2FydCA9IHdpbmRvdy50Y2FydDtcbiAgICAgICAgICAgICAgICBpZiAodGlsZGFDYXJ0ICYmIHRpbGRhQ2FydC5wcm9kdWN0cykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHZvaWQgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrQ2FydCwgMjAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY2hlY2tDYXJ0KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICghdGlsZGFDYXJ0IHx8ICFBcnJheS5pc0FycmF5KHRpbGRhQ2FydC5wcm9kdWN0cykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0JrQvtGA0LfQuNC90LAg0L3QtdC00L7RgdGC0YPQv9C90LAnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NsZWFudXBDYXJ0T25Jbml0XSDQotC+0LLQsNGA0Ysg0LIg0LrQvtGA0LfQuNC90LU6JywgdGlsZGFDYXJ0LnByb2R1Y3RzLm1hcCgocCkgPT4gcC5uYW1lKSk7XG4gICAgICAgIGNvbnN0IGFsbFJ1bGVQcm9kdWN0cyA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5ydWxlcy5mb3JFYWNoKHJ1bGUgPT4ge1xuICAgICAgICAgICAgcnVsZS5hY3Rpb25zLmZvckVhY2goYWN0aW9uID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsbFJ1bGVQcm9kdWN0cy5hZGQoYWN0aW9uLnZhbHVlLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBhY3RpdmVQcm9kdWN0cyA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLmZvckVhY2goKHN0YXRlKSA9PiB7XG4gICAgICAgICAgICBpZiAoc3RhdGUuYWN0aW9uICYmIHN0YXRlLmFjdGlvbi52YWx1ZSkge1xuICAgICAgICAgICAgICAgIGFjdGl2ZVByb2R1Y3RzLmFkZChzdGF0ZS5hY3Rpb24udmFsdWUudHJpbSgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCS0YHQtSDRgtC+0LLQsNGA0Ysg0LjQtyDQv9GA0LDQstC40Ls6JywgQXJyYXkuZnJvbShhbGxSdWxlUHJvZHVjdHMpKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0JDQutGC0LjQstC90YvQtSDRgtC+0LLQsNGA0Ys6JywgQXJyYXkuZnJvbShhY3RpdmVQcm9kdWN0cykpO1xuICAgICAgICBjb25zdCBwcm9kdWN0c1RvUmVtb3ZlID0gW107XG4gICAgICAgIHRpbGRhQ2FydC5wcm9kdWN0cy5mb3JFYWNoKChwcm9kdWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0TmFtZSA9IHByb2R1Y3QubmFtZT8udHJpbSgpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3ROYW1lICYmIGFsbFJ1bGVQcm9kdWN0cy5oYXMocHJvZHVjdE5hbWUpICYmICFhY3RpdmVQcm9kdWN0cy5oYXMocHJvZHVjdE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcHJvZHVjdHNUb1JlbW92ZS5wdXNoKHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCi0L7QstCw0YDRiyDQtNC70Y8g0YPQtNCw0LvQtdC90LjRjzonLCBwcm9kdWN0c1RvUmVtb3ZlKTtcbiAgICAgICAgaWYgKHByb2R1Y3RzVG9SZW1vdmUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBwcm9kdWN0TmFtZSBvZiBwcm9kdWN0c1RvUmVtb3ZlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjbGVhbnVwQ2FydE9uSW5pdF0g0KPQtNCw0LvRj9C10Lw6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucmVtb3ZlUHJvZHVjdEZyb21DYXJ0KHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdIOKckyDQntGH0LjRgdGC0LrQsCDQt9Cw0LLQtdGA0YjQtdC90LAnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2xlYW51cENhcnRPbkluaXRdINCd0LXRgiDRgtC+0LLQsNGA0L7QsiDQtNC70Y8g0YPQtNCw0LvQtdC90LjRjycpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNhdmVUaWxkYUNhcnQodGlsZGFDYXJ0KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLmlzVXBkYXRpbmdDYXJ0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRpbGRhQ2FydC51cGRhdGVkID0gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCk7XG4gICAgICAgICAgICBjb25zdCBjYXJ0RGF0YSA9IHtcbiAgICAgICAgICAgICAgICBwcm9kdWN0czogdGlsZGFDYXJ0LnByb2R1Y3RzIHx8IFtdLFxuICAgICAgICAgICAgICAgIHByb2RhbW91bnQ6IHRpbGRhQ2FydC5wcm9kYW1vdW50IHx8IDAsXG4gICAgICAgICAgICAgICAgYW1vdW50OiB0aWxkYUNhcnQuYW1vdW50IHx8IDAsXG4gICAgICAgICAgICAgICAgdG90YWw6IHRpbGRhQ2FydC5wcm9kdWN0cz8ubGVuZ3RoIHx8IDAsXG4gICAgICAgICAgICAgICAgdXBkYXRlZDogdGlsZGFDYXJ0LnVwZGF0ZWQsXG4gICAgICAgICAgICAgICAgY3VycmVuY3k6IHRpbGRhQ2FydC5jdXJyZW5jeSB8fCBcItGALlwiLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5X3NpZGU6IHRpbGRhQ2FydC5jdXJyZW5jeV9zaWRlIHx8IFwiclwiLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5X3NlcDogdGlsZGFDYXJ0LmN1cnJlbmN5X3NlcCB8fCBcIixcIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV9kZWM6IHRpbGRhQ2FydC5jdXJyZW5jeV9kZWMgfHwgXCJcIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV90eHQ6IHRpbGRhQ2FydC5jdXJyZW5jeV90eHQgfHwgXCLRgC5cIixcbiAgICAgICAgICAgICAgICBjdXJyZW5jeV90eHRfcjogdGlsZGFDYXJ0LmN1cnJlbmN5X3R4dF9yIHx8IFwiINGALlwiLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5X3R4dF9sOiB0aWxkYUNhcnQuY3VycmVuY3lfdHh0X2wgfHwgXCJcIixcbiAgICAgICAgICAgICAgICBzeXN0ZW06IHRpbGRhQ2FydC5zeXN0ZW0gfHwgXCJub25lXCIsXG4gICAgICAgICAgICAgICAgc2V0dGluZ3M6IHRpbGRhQ2FydC5zZXR0aW5ncyB8fCB7fSxcbiAgICAgICAgICAgICAgICBkZWxpdmVyeTogdGlsZGFDYXJ0LmRlbGl2ZXJ5IHx8IHsgbmFtZTogXCJub2RlbGl2ZXJ5XCIsIHByaWNlOiAwIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndGNhcnQnLCBKU09OLnN0cmluZ2lmeShjYXJ0RGF0YSkpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtzYXZlVGlsZGFDYXJ0XSDinJMg0JrQvtGA0LfQuNC90LAg0YHQvtGF0YDQsNC90LXQvdCwINCyIGxvY2FsU3RvcmFnZScpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc1VwZGF0aW5nQ2FydCA9IGZhbHNlO1xuICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbc2F2ZVRpbGRhQ2FydF0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPOicsIGUpO1xuICAgICAgICAgICAgdGhpcy5pc1VwZGF0aW5nQ2FydCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGluaXRDYXJ0T2JzZXJ2ZXIoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdENhcnRPYnNlcnZlcl0g0JjQvdC40YbQuNCw0LvQuNC30LDRhtC40Y8g0L3QsNCx0LvRjtC00LDRgtC10LvRjyDQutC+0YDQt9C40L3RiycpO1xuICAgICAgICBsZXQgbGFzdE1haW5Qcm9kdWN0c1F0eSA9IHRoaXMuZ2V0TWFpblByb2R1Y3RzUXVhbnRpdHkoKTtcbiAgICAgICAgY29uc3QgY2hlY2tDYXJ0Q2hhbmdlcyA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRRdHkgPSB0aGlzLmdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCk7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF0eSAhPT0gbGFzdE1haW5Qcm9kdWN0c1F0eSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2FydE9ic2VydmVyXSDQmNC30LzQtdC90LjQu9C+0YHRjCDQutC+0LvQuNGH0LXRgdGC0LLQviDRgtC+0LLQsNGA0L7QsjonLCB7XG4gICAgICAgICAgICAgICAgICAgINCx0YvQu9C+OiBsYXN0TWFpblByb2R1Y3RzUXR5LFxuICAgICAgICAgICAgICAgICAgICDRgdGC0LDQu9C+OiBjdXJyZW50UXR5XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbGFzdE1haW5Qcm9kdWN0c1F0eSA9IGN1cnJlbnRRdHk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBvYnNlcnZlQ2FydCA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNhcnRDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuQ0FSVF9DT05UQUlORVIpO1xuICAgICAgICAgICAgaWYgKGNhcnRDb250YWluZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtjYXJ0T2JzZXJ2ZXJdIE11dGF0aW9uT2JzZXJ2ZXI6INC+0LHQvdCw0YDRg9C20LXQvdGLINC40LfQvNC10L3QtdC90LjRjycpO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1F0eSA9IHRoaXMuZ2V0TWFpblByb2R1Y3RzUXVhbnRpdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXdRdHkgIT09IGxhc3RNYWluUHJvZHVjdHNRdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0TWFpblByb2R1Y3RzUXR5ID0gbmV3UXR5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGNhcnRDb250YWluZXIsIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdENhcnRPYnNlcnZlcl0g4pyTIE11dGF0aW9uT2JzZXJ2ZXIg0YPRgdGC0LDQvdC+0LLQu9C10L0nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQob2JzZXJ2ZUNhcnQsIDEwMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBvYnNlcnZlQ2FydCgpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICAgICAgICAgIGNvbnN0IGRlbGV0ZUJ1dHRvbiA9IHRhcmdldC5jbG9zZXN0KERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9ERUxfQlVUVE9OKTtcbiAgICAgICAgICAgIGlmIChkZWxldGVCdXR0b24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0RWxlbWVudCA9IGRlbGV0ZUJ1dHRvbi5jbG9zZXN0KERPTV9TRUxFQ1RPUlMuQ0FSVF9QUk9EVUNUKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvZHVjdEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGl0bGVFbCA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoRE9NX1NFTEVDVE9SUy5QUk9EVUNUX1RJVExFKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdE5hbWUgPSB0aXRsZUVsPy50ZXh0Q29udGVudD8udHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvZHVjdE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbY2FydE9ic2VydmVyXSDQo9C00LDQu9C10L3QuNC1INGC0L7QstCw0YDQsDonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb24ocHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaXNDYXJ0QnV0dG9uID0gdGFyZ2V0LmNsb3Nlc3QoYCR7RE9NX1NFTEVDVE9SUy5QUk9EVUNUX1BMVVNfQlVUVE9OfSwgJHtET01fU0VMRUNUT1JTLlBST0RVQ1RfTUlOVVNfQlVUVE9OfSwgJHtET01fU0VMRUNUT1JTLlBST0RVQ1RfREVMX0JVVFRPTn1gKTtcbiAgICAgICAgICAgIGlmIChpc0NhcnRCdXR0b24pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0g0JrQu9C40Log0L3QsCDQutC90L7Qv9C60YMg0LrQvtGA0LfQuNC90YsnKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGNoZWNrQ2FydENoYW5nZXMoKSwgREVMQVlTLk9CU0VSVkVSX0NIRUNLKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHNldHVwTG9jYWxTdG9yYWdlSW50ZXJjZXB0b3IgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXdpbmRvdy5fX2NhcmRmb3JtX2xvY2Fsc3RvcmFnZV9pbnRlcmNlcHRlZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsU2V0SXRlbSA9IFN0b3JhZ2UucHJvdG90eXBlLnNldEl0ZW07XG4gICAgICAgICAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgU3RvcmFnZS5wcm90b3R5cGUuc2V0SXRlbSA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IG9yaWdpbmFsU2V0SXRlbS5hcHBseSh0aGlzLCBba2V5LCB2YWx1ZV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSAndGNhcnQnICYmICFzZWxmLmlzVXBkYXRpbmdDYXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2NhcnRPYnNlcnZlcl0gbG9jYWxTdG9yYWdlIHRjYXJ0INC40LfQvNC10L3QtdC9INC40LfQstC90LUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gY2hlY2tDYXJ0Q2hhbmdlcygpLCBERUxBWVMuQ0FSVF9VUERBVEUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB3aW5kb3cuX19jYXJkZm9ybV9sb2NhbHN0b3JhZ2VfaW50ZXJjZXB0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdENhcnRPYnNlcnZlcl0g4pyTIGxvY2FsU3RvcmFnZS5zZXRJdGVtINC/0LXRgNC10YXQstCw0YfQtdC9Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XG4gICAgICAgICAgICBzZXR1cExvY2FsU3RvcmFnZUludGVyY2VwdG9yKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIHNldHVwTG9jYWxTdG9yYWdlSW50ZXJjZXB0b3IpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbaW5pdENhcnRPYnNlcnZlcl0g4pyTINCd0LDQsdC70Y7QtNCw0YLQtdC70Lgg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90YsnKTtcbiAgICB9XG4gICAgaGFuZGxlUnVsZVByb2R1Y3REZWxldGlvbihwcm9kdWN0TmFtZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCf0YDQvtCy0LXRgNC60LAg0YLQvtCy0LDRgNCwOicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgZm9yIChjb25zdCBba2V5LCBzdGF0ZV0gb2YgdGhpcy5hY3Rpb25zU3RhdGVzKSB7XG4gICAgICAgICAgICBpZiAoc3RhdGUuYWN0aW9uICYmIHN0YXRlLmFjdGlvbi52YWx1ZSA9PT0gcHJvZHVjdE5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCi0L7QstCw0YAg0LjQtyDQv9GA0LDQstC40LvQsCDQvdCw0LnQtNC10L06Jywge1xuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZToga2V5LFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHN0YXRlLmFjdGlvbi52YWx1ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGxldCBmb3VuZEVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsbElucHV0cyA9IHRoaXMuZm9ybS5xdWVyeVNlbGVjdG9yQWxsKCdpbnB1dCwgc2VsZWN0Jyk7XG4gICAgICAgICAgICAgICAgYWxsSW5wdXRzLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWwgPSBlbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAoKGVsLnR5cGUgPT09ICdyYWRpbycgfHwgZWwudHlwZSA9PT0gJ2NoZWNrYm94JykgJiYgZWwudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbC52YWx1ZS50cmltKCkgPT09IHN0YXRlLmFjdGlvbi52YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZEVsZW1lbnQgPSBlbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCd0LDQudC00LXQvSDRjdC70LXQvNC10L3RgjonLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGVsLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBlbC52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZDogZWwuY2hlY2tlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCh0L3QuNC80LDQtdC8INCy0YvQsdC+0YAg0YE6JywgZm91bmRFbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgZm91bmRFbGVtZW50LmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zU3RhdGVzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dIOKckyDQn9GA0LDQstC40LvQviDQvtGC0LzQtdC90LXQvdC+LCBjaGVja2JveCDRgdC90Y/RgicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW2hhbmRsZVJ1bGVQcm9kdWN0RGVsZXRpb25dINCt0LvQtdC80LXQvdGCINGE0L7RgNC80Ysg0L3QtSDQvdCw0LnQtNC10L0g0LTQu9GPOicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uVmFsdWU6IHN0YXRlLmFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZUlucHV0czogQXJyYXkuZnJvbShhbGxJbnB1dHMpLm1hcChlbCA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGVsLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGVsLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIHVwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5KCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDQndCw0YfQsNC70L4g0L7QsdC90L7QstC70LXQvdC40Y8g0LrQvtC70LjRh9C10YHRgtCy0LAnKTtcbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAoIXRpbGRhQ2FydCB8fCAhQXJyYXkuaXNBcnJheSh0aWxkYUNhcnQucHJvZHVjdHMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCa0L7RgNC30LjQvdCwINC90LXQtNC+0YHRgtGD0L/QvdCwJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0JDQutGC0LjQstC90YvRhSDQv9GA0LDQstC40Ls6JywgdGhpcy5hY3Rpb25zU3RhdGVzLnNpemUpO1xuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHN0YXRlXSBvZiB0aGlzLmFjdGlvbnNTdGF0ZXMpIHtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5hY3Rpb24gJiYgc3RhdGUuYWN0aW9uLnF1YW50aXR5VHlwZSA9PT0gJ3BlclByb2R1Y3QnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3UXVhbnRpdHkgPSB0aGlzLmNhbGN1bGF0ZVJ1bGVQcm9kdWN0UXVhbnRpdHkoc3RhdGUuYWN0aW9uKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0SW5kZXggPSB0aWxkYUNhcnQucHJvZHVjdHMuZmluZEluZGV4KChwKSA9PiBwLm5hbWU/LnRyaW0oKSA9PT0gc3RhdGUuYWN0aW9uLnZhbHVlLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkUXVhbnRpdHkgPSBwYXJzZUludCh0aWxkYUNhcnQucHJvZHVjdHNbcHJvZHVjdEluZGV4XS5xdWFudGl0eSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCi0L7QstCw0YAgXCIke3N0YXRlLmFjdGlvbi52YWx1ZX1cIjpgLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRRdWFudGl0eTogb2xkUXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdRdWFudGl0eTogbmV3UXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICBuZWVkc1VwZGF0ZTogb2xkUXVhbnRpdHkgIT09IG5ld1F1YW50aXR5XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAob2xkUXVhbnRpdHkgIT09IG5ld1F1YW50aXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZVJ1bGVQcm9kdWN0c1F1YW50aXR5XSDimqEg0J7QsdC90L7QstC70Y/QtdC8INGH0LXRgNC10LcgdGNhcnRfX3Byb2R1Y3RfX3VwZGF0ZVF1YW50aXR5Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcHJvZHVjdEVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCAxMDsgYXR0ZW1wdCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdEVsZW1lbnQgPSBDYXJ0VXRpbHMuZmluZFByb2R1Y3RFbGVtZW50KHN0YXRlLmFjdGlvbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCt0LvQtdC80LXQvdGCINC90LDQudC00LXQvSDQvdCwINC/0L7Qv9GL0YLQutC1OicsIGF0dGVtcHQgKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRlbXB0IDwgOSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuRE9NX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcXVhbnRpdHlFbGVtZW50ID0gcHJvZHVjdEVsZW1lbnQucXVlcnlTZWxlY3RvcihET01fU0VMRUNUT1JTLlBST0RVQ1RfUVVBTlRJVFkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChxdWFudGl0eUVsZW1lbnQgJiYgdHlwZW9mIHdpbmRvdy50Y2FydF9fcHJvZHVjdF9fdXBkYXRlUXVhbnRpdHkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnRjYXJ0X19wcm9kdWN0X191cGRhdGVRdWFudGl0eShxdWFudGl0eUVsZW1lbnQsIHByb2R1Y3RFbGVtZW50LCBwcm9kdWN0SW5kZXgsIG5ld1F1YW50aXR5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g4pyTINCa0L7Qu9C40YfQtdGB0YLQstC+INC+0LHQvdC+0LLQu9C10L3QviDRh9C10YDQtdC3IFRpbGRhIEFQSTonLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRRdWFudGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1F1YW50aXR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuRE9NX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsdXNNaW51c0J1dHRvbnMgPSBwcm9kdWN0RWxlbWVudC5xdWVyeVNlbGVjdG9yKERPTV9TRUxFQ1RPUlMuUFJPRFVDVF9QTFVTTUlOVVMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGx1c01pbnVzQnV0dG9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1c01pbnVzQnV0dG9ucy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCd0LUg0L3QsNC50LTQtdC9IHF1YW50aXR5RWxlbWVudCDQuNC70Lgg0YTRg9C90LrRhtC40Y8gdXBkYXRlUXVhbnRpdHknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldINCd0LUg0L3QsNC50LTQtdC9IERPTSDRjdC70LXQvNC10L3RgiDRgtC+0LLQsNGA0LAg0L/QvtGB0LvQtSDQvtC20LjQtNCw0L3QuNGPJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2Zvcm1dIFt1cGRhdGVSdWxlUHJvZHVjdHNRdWFudGl0eV0g0KLQvtCy0LDRgCBcIiR7c3RhdGUuYWN0aW9uLnZhbHVlfVwiINCd0JUg0L3QsNC50LTQtdC9INCyINC60L7RgNC30LjQvdC1YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlUnVsZVByb2R1Y3RzUXVhbnRpdHldIOKckyDQntCx0L3QvtCy0LvQtdC90LjQtSDQt9Cw0LLQtdGA0YjQtdC90L4nKTtcbiAgICB9XG4gICAgdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NKHByb2R1Y3ROYW1lLCBuZXdRdWFudGl0eSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g0J7QsdC90L7QstC70LXQvdC40LU6JywgeyBwcm9kdWN0TmFtZSwgbmV3UXVhbnRpdHkgfSk7XG4gICAgICAgIGNvbnN0IHRpdGxlU2VsZWN0b3JzID0gW1xuICAgICAgICAgICAgJy50NzA2X19wcm9kdWN0LXRpdGxlJyxcbiAgICAgICAgICAgICcudC1zdG9yZV9fcHJvZHVjdC1uYW1lJyxcbiAgICAgICAgICAgICcudC1wcm9kdWN0X190aXRsZScsXG4gICAgICAgICAgICAnLmpzLXByb2R1Y3QtbmFtZSdcbiAgICAgICAgXTtcbiAgICAgICAgbGV0IHByb2R1Y3RFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiB0aXRsZVNlbGVjdG9ycykge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdFRpdGxlcyA9IFsuLi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKV07XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g0J/QvtC40YHQuiDRh9C10YDQtdC3IFwiJHtzZWxlY3Rvcn1cIjpgLCBwcm9kdWN0VGl0bGVzLmxlbmd0aCwgJ9GN0LvQtdC80LXQvdGC0L7QsicpO1xuICAgICAgICAgICAgY29uc3QgZm91bmRFbGVtZW50ID0gcHJvZHVjdFRpdGxlcy5maW5kKGVsID0+IGVsLmlubmVyVGV4dC50cmltKCkgPT09IHByb2R1Y3ROYW1lLnRyaW0oKSk7XG4gICAgICAgICAgICBpZiAoZm91bmRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgcHJvZHVjdEVsZW1lbnQgPSBmb3VuZEVsZW1lbnQuY2xvc2VzdCgnLnQ3MDZfX2NhcnR3aW4tcHJvZHVjdCwgLnQtc3RvcmVfX3Byb2R1Y3QsIC50LXByb2R1Y3QnKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvZHVjdEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dIOKckyDQotC+0LLQsNGAINC90LDQudC00LXQvSDRh9C10YDQtdC3OicsIHNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghcHJvZHVjdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dIOKclyDQrdC70LXQvNC10L3RgiDRgtC+0LLQsNGA0LAg0J3QlSDQvdCw0LnQtNC10L0g0LIgRE9NOicsIHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDQktGB0LUg0YLQvtCy0LDRgNGLINCyIERPTTonLCBbLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnQ3MDZfX3Byb2R1Y3QtdGl0bGUsIC50LXN0b3JlX19wcm9kdWN0LW5hbWUnKV0ubWFwKChlbCkgPT4gZWwuaW5uZXJUZXh0KSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVhbnRpdHlJbnB1dFNlbGVjdG9ycyA9IFtcbiAgICAgICAgICAgICcudDcwNl9fcHJvZHVjdC1xdWFudGl0eScsXG4gICAgICAgICAgICAnLnQtc3RvcmVfX3F1YW50aXR5LWlucHV0JyxcbiAgICAgICAgICAgICdpbnB1dFtuYW1lPVwicXVhbnRpdHlcIl0nLFxuICAgICAgICAgICAgJy5qcy1wcm9kdWN0LXF1YW50aXR5J1xuICAgICAgICBdO1xuICAgICAgICBsZXQgcXVhbnRpdHlJbnB1dCA9IG51bGw7XG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgcXVhbnRpdHlJbnB1dFNlbGVjdG9ycykge1xuICAgICAgICAgICAgcXVhbnRpdHlJbnB1dCA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICAgICAgaWYgKHF1YW50aXR5SW5wdXQpIHtcbiAgICAgICAgICAgICAgICBxdWFudGl0eUlucHV0LnZhbHVlID0gbmV3UXVhbnRpdHkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICBxdWFudGl0eUlucHV0LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdjaGFuZ2UnLCB7IGJ1YmJsZXM6IHRydWUgfSkpO1xuICAgICAgICAgICAgICAgIHF1YW50aXR5SW5wdXQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2lucHV0JywgeyBidWJibGVzOiB0cnVlIH0pKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTV0g4pyTINCe0LHQvdC+0LLQu9C10L0gaW5wdXQg0YfQtdGA0LXQtzonLCBzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVhbnRpdHlEaXNwbGF5U2VsZWN0b3JzID0gW1xuICAgICAgICAgICAgJy50LXF1YW50aXR5X192YWx1ZScsXG4gICAgICAgICAgICAnLnQ3MDZfX3Byb2R1Y3QtcXVhbnRpdHktdmFsdWUnLFxuICAgICAgICAgICAgJy50LXN0b3JlX19xdWFudGl0eS12YWx1ZSdcbiAgICAgICAgXTtcbiAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBxdWFudGl0eURpc3BsYXlTZWxlY3RvcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHF1YW50aXR5RGlzcGxheSA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICAgICAgaWYgKHF1YW50aXR5RGlzcGxheSkge1xuICAgICAgICAgICAgICAgIHF1YW50aXR5RGlzcGxheS50ZXh0Q29udGVudCA9IG5ld1F1YW50aXR5LnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVDYXJ0SXRlbVF1YW50aXR5SW5ET01dIOKckyDQntCx0L3QvtCy0LvQtdC9IGRpc3BsYXkg0YfQtdGA0LXQtzonLCBzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAodGlsZGFDYXJ0KSB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGlsZGFDYXJ0LnByb2R1Y3RzLmZpbmQoKHApID0+IHAubmFtZT8udHJpbSgpID09PSBwcm9kdWN0TmFtZS50cmltKCkpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3QpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbFByaWNlID0gcGFyc2VGbG9hdChwcm9kdWN0LnByaWNlKSAqIG5ld1F1YW50aXR5O1xuICAgICAgICAgICAgICAgIGNvbnN0IHByaWNlU2VsZWN0b3JzID0gW1xuICAgICAgICAgICAgICAgICAgICAnLnQ3MDZfX3Byb2R1Y3QtcHJpY2UnLFxuICAgICAgICAgICAgICAgICAgICAnLnQtc3RvcmVfX3Byb2R1Y3QtcHJpY2UnLFxuICAgICAgICAgICAgICAgICAgICAnLnQtcHJvZHVjdF9fcHJpY2UnLFxuICAgICAgICAgICAgICAgICAgICAnLmpzLXByb2R1Y3QtcHJpY2UnXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHByaWNlU2VsZWN0b3JzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByaWNlRWxlbWVudCA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJpY2VFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmljZUVsZW1lbnQudGV4dENvbnRlbnQgPSBgJHt0b3RhbFByaWNlLnRvTG9jYWxlU3RyaW5nKCdydS1SVScpfSAke3RpbGRhQ2FydC5jdXJyZW5jeV90eHRfciB8fCAnINGALid9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDinJMg0J7QsdC90L7QstC70LXQvdCwINGB0YLQvtC40LzQvtGB0YLRjCDRh9C10YDQtdC3OicsIHNlbGVjdG9yLCB0b3RhbFByaWNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbdXBkYXRlQ2FydEl0ZW1RdWFudGl0eUluRE9NXSDinJMg0J7QsdC90L7QstC70LXQvdC40LUg0LfQsNCy0LXRgNGI0LXQvdC+INC00LvRjzonLCBwcm9kdWN0TmFtZSk7XG4gICAgfVxuICAgIHVwZGF0ZUFsbENhcnRJdGVtc0luRE9NKCkge1xuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICghdGlsZGFDYXJ0IHx8ICFBcnJheS5pc0FycmF5KHRpbGRhQ2FydC5wcm9kdWN0cykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dIFt1cGRhdGVBbGxDYXJ0SXRlbXNJbkRPTV0g0JrQvtGA0LfQuNC90LAg0L3QtdC00L7RgdGC0YPQv9C90LAnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUFsbENhcnRJdGVtc0luRE9NXSDQntCx0L3QvtCy0LvRj9C10Lwg0LLRgdC1INGC0L7QstCw0YDRiyDQsiBET00nKTtcbiAgICAgICAgdGlsZGFDYXJ0LnByb2R1Y3RzLmZvckVhY2goKHByb2R1Y3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb2R1Y3ROYW1lID0gcHJvZHVjdC5uYW1lPy50cmltKCk7XG4gICAgICAgICAgICBjb25zdCBxdWFudGl0eSA9IHBhcnNlSW50KHByb2R1Y3QucXVhbnRpdHkgfHwgMSk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdE5hbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNhcnRJdGVtUXVhbnRpdHlJbkRPTShwcm9kdWN0TmFtZSwgcXVhbnRpdHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFt1cGRhdGVBbGxDYXJ0SXRlbXNJbkRPTV0g4pyTINCS0YHQtSDRgtC+0LLQsNGA0Ysg0L7QsdC90L7QstC70LXQvdGLJyk7XG4gICAgfVxuICAgIHJlZnJlc2hDYXJ0VUkoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbcmVmcmVzaENhcnRVSV0g0J3QsNGH0LDQu9C+INC+0LHQvdC+0LLQu9C10L3QuNGPIFVJINC60L7RgNC30LjQvdGLJyk7XG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93LnRfc3RvcmVfX3JlZnJlc2hjYXJ0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB3aW5kb3cudF9zdG9yZV9fcmVmcmVzaGNhcnQoKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbcmVmcmVzaENhcnRVSV0g4pyTINCS0YvQt9Cy0LDQvSB0X3N0b3JlX19yZWZyZXNoY2FydCcpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlZnJlc2hGdW5jdGlvbnMgPSBbXG4gICAgICAgICAgICAndDcwNl9fdXBkYXRlQ2FydCcsXG4gICAgICAgICAgICAndGNhcnRfX3VwZGF0ZUNhcnQnLFxuICAgICAgICAgICAgJ3Rfc3RvcmVfX3VwZGF0ZUNhcnQnLFxuICAgICAgICAgICAgJ3Q3MDZfaW5pdCdcbiAgICAgICAgXTtcbiAgICAgICAgcmVmcmVzaEZ1bmN0aW9ucy5mb3JFYWNoKGZ1bmNOYW1lID0+IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93W2Z1bmNOYW1lXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvd1tmdW5jTmFtZV0oKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtyZWZyZXNoQ2FydFVJXSDinJMg0JLRi9C30LLQsNC9ICR7ZnVuY05hbWV9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2Zvcm1dIFtyZWZyZXNoQ2FydFVJXSDQntGI0LjQsdC60LAgJHtmdW5jTmFtZX06YCwgZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy51cGRhdGVBbGxDYXJ0SXRlbXNJbkRPTSgpO1xuICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2NhcnQtdXBkYXRlZCcpKTtcbiAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ3RjYXJ0LXVwZGF0ZWQnKSk7XG4gICAgICAgIHRoaXMudXBkYXRlQ2FydENvdW50ZXJzKCk7XG4gICAgfVxuICAgIHVwZGF0ZUNhcnRDb3VudGVycygpIHtcbiAgICAgICAgY29uc3QgdGlsZGFDYXJ0ID0gd2luZG93LnRjYXJ0O1xuICAgICAgICBpZiAoIXRpbGRhQ2FydClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgY2FydENvdW50ZXJzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChET01fU0VMRUNUT1JTLkNBUlRfQ09VTlRFUik7XG4gICAgICAgIGNhcnRDb3VudGVycy5mb3JFYWNoKGNvdW50ZXIgPT4ge1xuICAgICAgICAgICAgaWYgKGNvdW50ZXIpIHtcbiAgICAgICAgICAgICAgICBjb3VudGVyLnRleHRDb250ZW50ID0gdGlsZGFDYXJ0LnRvdGFsLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBjYXJ0QW1vdW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoRE9NX1NFTEVDVE9SUy5DQVJUX0FNT1VOVCk7XG4gICAgICAgIGNhcnRBbW91bnRzLmZvckVhY2goYW1vdW50ID0+IHtcbiAgICAgICAgICAgIGlmIChhbW91bnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtYXR0ZWRBbW91bnQgPSB0aWxkYUNhcnQuYW1vdW50LnRvTG9jYWxlU3RyaW5nKCdydS1SVScpO1xuICAgICAgICAgICAgICAgIGFtb3VudC50ZXh0Q29udGVudCA9IGAke2Zvcm1hdHRlZEFtb3VudH0gJHt0aWxkYUNhcnQuY3VycmVuY3lfdHh0X3IgfHwgJyDRgC4nfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3VwZGF0ZUNhcnRDb3VudGVyc10g4pyTINCh0YfQtdGC0YfQuNC60Lgg0L7QsdC90L7QstC70LXQvdGLJyk7XG4gICAgfVxuICAgIGdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCkge1xuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICghdGlsZGFDYXJ0IHx8ICFBcnJheS5pc0FycmF5KHRpbGRhQ2FydC5wcm9kdWN0cykpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJ1bGVQcm9kdWN0TmFtZXMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMucnVsZXMuZm9yRWFjaChydWxlID0+IHtcbiAgICAgICAgICAgIHJ1bGUuYWN0aW9ucy5mb3JFYWNoKGFjdGlvbiA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBydWxlUHJvZHVjdE5hbWVzLmFkZChhY3Rpb24udmFsdWUudHJpbSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGxldCB0b3RhbFF1YW50aXR5ID0gMDtcbiAgICAgICAgY29uc3QgbWFpblByb2R1Y3RzID0gW107XG4gICAgICAgIHRpbGRhQ2FydC5wcm9kdWN0cy5mb3JFYWNoKChwcm9kdWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0TmFtZSA9IHByb2R1Y3QubmFtZT8udHJpbSgpO1xuICAgICAgICAgICAgY29uc3QgaXNSdWxlUHJvZHVjdCA9IHJ1bGVQcm9kdWN0TmFtZXMuaGFzKHByb2R1Y3ROYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IHF0eSA9IHBhcnNlSW50KHByb2R1Y3QucXVhbnRpdHkgfHwgMSk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdE5hbWUgJiYgIWlzUnVsZVByb2R1Y3QpIHtcbiAgICAgICAgICAgICAgICB0b3RhbFF1YW50aXR5ICs9IHF0eTtcbiAgICAgICAgICAgICAgICBtYWluUHJvZHVjdHMucHVzaChgJHtwcm9kdWN0TmFtZX0gKCR7cXR5fSDRiNGCKWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtnZXRNYWluUHJvZHVjdHNRdWFudGl0eV0nLCB7XG4gICAgICAgICAgICAn0J7RgdC90L7QstC90YvRhSDRgtC+0LLQsNGA0L7Qsic6IHRvdGFsUXVhbnRpdHksXG4gICAgICAgICAgICAn0KHQv9C40YHQvtC6JzogbWFpblByb2R1Y3RzLFxuICAgICAgICAgICAgJ9Ci0L7QstCw0YDRiyDQv9GA0LDQstC40LsnOiBBcnJheS5mcm9tKHJ1bGVQcm9kdWN0TmFtZXMpXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdG90YWxRdWFudGl0eTtcbiAgICB9XG4gICAgY2FsY3VsYXRlUnVsZVByb2R1Y3RRdWFudGl0eShhY3Rpb24pIHtcbiAgICAgICAgaWYgKGFjdGlvbi5xdWFudGl0eSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gYWN0aW9uLnF1YW50aXR5O1xuICAgICAgICB9XG4gICAgICAgIGlmIChhY3Rpb24ucXVhbnRpdHlUeXBlID09PSAncGVyUHJvZHVjdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLm1heCgxLCB0aGlzLmdldE1haW5Qcm9kdWN0c1F1YW50aXR5KCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBhc3luYyByZW1vdmVQcm9kdWN0RnJvbUNhcnQocHJvZHVjdE5hbWUpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtyZW1vdmVQcm9kdWN0XSDQn9C+0L/Ri9GC0LrQsCDRg9C00LDQu9C40YLRjDonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3RFbGVtZW50ID0gQ2FydFV0aWxzLmZpbmRQcm9kdWN0RWxlbWVudChwcm9kdWN0TmFtZSk7XG4gICAgICAgIGlmIChwcm9kdWN0RWxlbWVudCkge1xuICAgICAgICAgICAgY29uc3QgZGVsUHJvZHVjdEJ1dHRvbiA9IHByb2R1Y3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoRE9NX1NFTEVDVE9SUy5QUk9EVUNUX0RFTF9CVVRUT04pO1xuICAgICAgICAgICAgaWYgKGRlbFByb2R1Y3RCdXR0b24pIHtcbiAgICAgICAgICAgICAgICBkZWxQcm9kdWN0QnV0dG9uLmNsaWNrKCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtyZW1vdmVQcm9kdWN0XSDinJMg0KPQtNCw0LvQtdC90L4g0YfQtdGA0LXQtyBET00gKNC60LvQuNC6KTonLCBwcm9kdWN0TmFtZSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgQ2FydFV0aWxzLndhaXQoREVMQVlTLkNBUlRfVVBEQVRFKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aWxkYUNhcnQgPSB3aW5kb3cudGNhcnQ7XG4gICAgICAgIGlmICh0aWxkYUNhcnQgJiYgQXJyYXkuaXNBcnJheSh0aWxkYUNhcnQucHJvZHVjdHMpKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0SW5kZXggPSB0aWxkYUNhcnQucHJvZHVjdHMuZmluZEluZGV4KChwKSA9PiBwLm5hbWU/LnRyaW0oKSA9PT0gcHJvZHVjdE5hbWUudHJpbSgpKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0SW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRpbGRhQ2FydC5wcm9kdWN0c1twcm9kdWN0SW5kZXhdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlbW92ZUZ1bmN0aW9ucyA9IFtcbiAgICAgICAgICAgICAgICAgICAgJ3RjYXJ0X19yZW1vdmVQcm9kdWN0JyxcbiAgICAgICAgICAgICAgICAgICAgJ3RjYXJ0X3JlbW92ZVByb2R1Y3QnLFxuICAgICAgICAgICAgICAgICAgICAndF9zdG9yZV9fcmVtb3ZlUHJvZHVjdCdcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZnVuY05hbWUgb2YgcmVtb3ZlRnVuY3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93W2Z1bmNOYW1lXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3dbZnVuY05hbWVdKHByb2R1Y3QudWlkIHx8IHByb2R1Y3QuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbcmVtb3ZlUHJvZHVjdF0g4pyTINCj0LTQsNC70LXQvdC+INGH0LXRgNC10LcgJHtmdW5jTmFtZX06YCwgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IENhcnRVdGlscy53YWl0KERFTEFZUy5DQVJUX1VQREFURSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2Zvcm1dIFtyZW1vdmVQcm9kdWN0XSDQntGI0LjQsdC60LAgJHtmdW5jTmFtZX06YCwgZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGlsZGFDYXJ0LnByb2R1Y3RzLnNwbGljZShwcm9kdWN0SW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIHRpbGRhQ2FydC5hbW91bnQgPSB0aWxkYUNhcnQucHJvZHVjdHMucmVkdWNlKChzdW0sIHApID0+IHN1bSArIChwYXJzZUZsb2F0KHAucHJpY2UpICogcGFyc2VJbnQocC5xdWFudGl0eSB8fCAxKSksIDApO1xuICAgICAgICAgICAgICAgIHRpbGRhQ2FydC5wcm9kYW1vdW50ID0gdGlsZGFDYXJ0LnByb2R1Y3RzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB0aWxkYUNhcnQudG90YWwgPSB0aWxkYUNhcnQucHJvZHVjdHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHRpbGRhQ2FydC51cGRhdGVkID0gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2F2ZVRpbGRhQ2FydCh0aWxkYUNhcnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LnRfc3RvcmVfX3JlZnJlc2hjYXJ0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cudF9zdG9yZV9fcmVmcmVzaGNhcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW3JlbW92ZVByb2R1Y3RdIOKckyDQo9C00LDQu9C10L3QviDQvdCw0L/RgNGP0LzRg9GOINC40Lcg0LzQsNGB0YHQuNCy0LA6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBDYXJ0VXRpbHMud2FpdChERUxBWVMuQ0FSVF9VUERBVEUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW3JlbW92ZVByb2R1Y3RdIOKclyDQndC1INGD0LTQsNC70L7RgdGMINGD0LTQsNC70LjRgtGMINGC0L7QstCw0YA6JywgcHJvZHVjdE5hbWUpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGFzeW5jIGFwcGx5QWN0aW9ucyhvbGRTdGF0ZSA9IG5ldyBNYXAoKSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0J3QsNGH0LDQu9C+INC/0YDQuNC80LXQvdC10L3QuNGPINC00LXQudGB0YLQstC40LknKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFthcHBseUFjdGlvbnNdINCh0YLQsNGA0L7QtSDRgdC+0YHRgtC+0Y/QvdC40LU6JywgT2JqZWN0LmZyb21FbnRyaWVzKG9sZFN0YXRlKSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQndC+0LLQvtC1INGB0L7RgdGC0L7Rj9C90LjQtTonLCBPYmplY3QuZnJvbUVudHJpZXModGhpcy5hY3Rpb25zU3RhdGVzKSk7XG4gICAgICAgIGNvbnN0IGNhcnRMb2FkZWQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChbLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLnQ3MDZfX3Byb2R1Y3QtdGl0bGVgKV0ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUoZmFsc2UpLCAzMDAwKSlcbiAgICAgICAgXSk7XG4gICAgICAgIGlmICghY2FydExvYWRlZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0JrQvtGA0LfQuNC90LAg0L3QtSDQt9Cw0LPRgNGD0LfQuNC70LDRgdGMINC30LAgMyDRgdC10LrRg9C90LTRiywg0L/RgNC+0LTQvtC70LbQsNC10LwnKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHN0YXRlXSBvZiB0aGlzLmFjdGlvbnNTdGF0ZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IG9sZFZhbHVlID0gb2xkU3RhdGUuZ2V0KGtleSk/LnZhbHVlO1xuICAgICAgICAgICAgY29uc3Qgb2xkQWN0aW9uID0gb2xkU3RhdGUuZ2V0KGtleSk/LmFjdGlvbjtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbYXBwbHlBY3Rpb25zXSDQntCx0YDQsNCx0L7RgtC60LAg0L/QvtC70Y8gXCIke2tleX1cIjpgLCB7XG4gICAgICAgICAgICAgICAgb2xkVmFsdWUsXG4gICAgICAgICAgICAgICAgbmV3VmFsdWU6IHN0YXRlLnZhbHVlLFxuICAgICAgICAgICAgICAgIG9sZEFjdGlvbjogb2xkQWN0aW9uPy52YWx1ZSxcbiAgICAgICAgICAgICAgICBuZXdBY3Rpb246IHN0YXRlLmFjdGlvbj8udmFsdWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHN0YXRlLnZhbHVlICE9PSBvbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmIChvbGRBY3Rpb24gJiYgb2xkQWN0aW9uLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQo9C00LDQu9GP0LXQvCDRgdGC0LDRgNGL0Lkg0YLQvtCy0LDRgDonLCBvbGRBY3Rpb24udmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlbW92ZVByb2R1Y3RGcm9tQ2FydChvbGRBY3Rpb24udmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUudmFsdWUgJiYgc3RhdGUuYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RJZCA9IGBydWxlXyR7a2V5fV8ke0RhdGUubm93KCl9YDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdFF1YW50aXR5ID0gdGhpcy5jYWxjdWxhdGVSdWxlUHJvZHVjdFF1YW50aXR5KHN0YXRlLmFjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSBbYXBwbHlBY3Rpb25zXSDQlNC+0LHQsNCy0LvRj9C10Lwg0L3QvtCy0YvQuSDRgtC+0LLQsNGAOicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBwcm9kdWN0SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzdGF0ZS5hY3Rpb24udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmljZTogc3RhdGUuYWN0aW9uLnN1bSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgcXVhbnRpdHk6IHByb2R1Y3RRdWFudGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXR5VHlwZTogc3RhdGUuYWN0aW9uLnF1YW50aXR5VHlwZSB8fCAnZml4ZWQnXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cudGNhcnRfX2FkZFByb2R1Y3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHByb2R1Y3RJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHN0YXRlLmFjdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaWNlOiBzdGF0ZS5hY3Rpb24uc3VtIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWFudGl0eTogcHJvZHVjdFF1YW50aXR5LFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hhbmdlUHJvZHVjdCA9IGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hhbmdlUHJvZHVjdCA9IFsuLi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAudDcwNl9fcHJvZHVjdC10aXRsZWApXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgoZSkgPT4gZS5pbm5lclRleHQudHJpbSgpID09PSBzdGF0ZS5hY3Rpb24udmFsdWUudHJpbSgpKT8ucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGNoYW5nZVByb2R1Y3QgfHwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hhbmdlUHJvZHVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hhbmdlUHJvZHVjdEJ1dHRvbiA9IGNoYW5nZVByb2R1Y3QucXVlcnlTZWxlY3RvcihgLnQ3MDZfX3Byb2R1Y3QtcGx1c21pbnVzYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hhbmdlUHJvZHVjdEJ1dHRvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZVByb2R1Y3RCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g4pyTINCh0LrRgNGL0YLRiyDQutC90L7Qv9C60Lgg0LrQvtC70LjRh9C10YHRgtCy0LAnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICghc3RhdGUudmFsdWUgfHwgIXN0YXRlLmFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g0JfQvdCw0YfQtdC90LjQtSDRgdCx0YDQvtGI0LXQvdC+LCDRgtC+0LLQsNGAINGD0LTQsNC70LXQvScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0gW2FwcGx5QWN0aW9uc10g4pyTINCf0YDQuNC80LXQvdC10L3QuNC1INC00LXQudGB0YLQstC40Lkg0LfQsNCy0LXRgNGI0LXQvdC+Jyk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgRWRpdG9yU3RvcmFnZU1hbmFnZXIgfSBmcm9tICcuLi9tYW5hZ2Vycy9FZGl0b3JTdG9yYWdlTWFuYWdlcic7XG5pbXBvcnQgeyBMYXlvdXQgfSBmcm9tICcuLi9tb2RlbHMvTGF5b3V0JztcbmltcG9ydCB7IGdldExhc3RDaGlsZCB9IGZyb20gJy4uL3V0aWxzL3RpbGRhVXRpbHMnO1xuaW1wb3J0IHsgVHlwZWRFdmVudEVtaXR0ZXIgfSBmcm9tICcuLi91dGlscy9UeXBlZEV2ZW50RW1pdHRlcic7XG5pbXBvcnQgeyBnZW5lcmF0ZUltYWdlLCBjcmVhdGVQcm9kdWN0IH0gZnJvbSAnLi4vdXRpbHMvYXBpJztcbmNvbnN0IENPTlNUQU5UUyA9IHtcbiAgICBTVEFURV9FWFBJUkFUSU9OX0RBWVM6IDMwLFxuICAgIENBTlZBU19BUkVBX0hFSUdIVDogNjAwLFxuICAgIExPQURJTkdfSU5URVJWQUxfTVM6IDEwMCxcbn07XG5jb25zdCBBUElfRU5EUE9JTlRTID0ge1xuICAgIFdFQkhPT0tfQ0FSVDogJ2h0dHBzOi8vcHJpbWFyeS1wcm9kdWN0aW9uLTY1NGMudXAucmFpbHdheS5hcHAvd2ViaG9vay9jYXJ0JyxcbiAgICBVUExPQURfSU1BR0U6ICdodHRwczovL3ByZXZpZXctc2VydmljZS1wcm9kdWN0aW9uLWZkMjAudXAucmFpbHdheS5hcHAvdXBsb2FkJyxcbiAgICBXRUJIT09LX1JFUVVFU1Q6ICdodHRwczovL3ByaW1hcnktcHJvZHVjdGlvbi02NTRjLnVwLnJhaWx3YXkuYXBwL3dlYmhvb2svcmVxdWVzdCcsXG59O1xuZXhwb3J0IHZhciBFZGl0b3JFdmVudFR5cGU7XG4oZnVuY3Rpb24gKEVkaXRvckV2ZW50VHlwZSkge1xuICAgIEVkaXRvckV2ZW50VHlwZVtcIk1PQ0tVUF9MT0FESU5HXCJdID0gXCJtb2NrdXAtbG9hZGluZ1wiO1xuICAgIEVkaXRvckV2ZW50VHlwZVtcIk1PQ0tVUF9VUERBVEVEXCJdID0gXCJtb2NrdXAtdXBkYXRlZFwiO1xuICAgIEVkaXRvckV2ZW50VHlwZVtcIkxPQURJTkdfVElNRV9VUERBVEVEXCJdID0gXCJsb2FkaW5nLXRpbWUtdXBkYXRlZFwiO1xuICAgIEVkaXRvckV2ZW50VHlwZVtcIlNUQVRFX0NIQU5HRURcIl0gPSBcInN0YXRlLWNoYW5nZWRcIjtcbiAgICBFZGl0b3JFdmVudFR5cGVbXCJMQVlPVVRfQURERURcIl0gPSBcImxheW91dC1hZGRlZFwiO1xuICAgIEVkaXRvckV2ZW50VHlwZVtcIkxBWU9VVF9SRU1PVkVEXCJdID0gXCJsYXlvdXQtcmVtb3ZlZFwiO1xuICAgIEVkaXRvckV2ZW50VHlwZVtcIkxBWU9VVF9VUERBVEVEXCJdID0gXCJsYXlvdXQtdXBkYXRlZFwiO1xufSkoRWRpdG9yRXZlbnRUeXBlIHx8IChFZGl0b3JFdmVudFR5cGUgPSB7fSkpO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRWRpdG9yIHtcbiAgICBnZXQgc2VsZWN0VHlwZSgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdFR5cGU7IH1cbiAgICBnZXQgc2VsZWN0Q29sb3IoKSB7IHJldHVybiB0aGlzLl9zZWxlY3RDb2xvcjsgfVxuICAgIGdldCBzZWxlY3RTaWRlKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0U2lkZTsgfVxuICAgIGdldCBzZWxlY3RTaXplKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0U2l6ZTsgfVxuICAgIGdldCBzZWxlY3RMYXlvdXQoKSB7IHJldHVybiB0aGlzLl9zZWxlY3RMYXlvdXQ7IH1cbiAgICBjb25zdHJ1Y3Rvcih7IGJsb2NrcywgcHJvZHVjdENvbmZpZ3MsIGZvcm1Db25maWcgfSkge1xuICAgICAgICB0aGlzLnF1YW50aXR5Rm9ybUJsb2NrID0gbnVsbDtcbiAgICAgICAgdGhpcy5mb3JtQmxvY2sgPSBudWxsO1xuICAgICAgICB0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSA9IG51bGw7XG4gICAgICAgIHRoaXMuZm9ybUJ1dHRvbiA9IG51bGw7XG4gICAgICAgIHRoaXMuX3NlbGVjdExheW91dCA9IG51bGw7XG4gICAgICAgIHRoaXMubGF5b3V0cyA9IFtdO1xuICAgICAgICB0aGlzLmNhbnZhc2VzID0gW107XG4gICAgICAgIHRoaXMubGF5ZXJzQ2FudmFzZXMgPSBbXTtcbiAgICAgICAgdGhpcy5hY3RpdmVDYW52YXMgPSBudWxsO1xuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBUeXBlZEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmxheWVyc0hpc3RvcnkgPSBbXTtcbiAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID0gLTE7XG4gICAgICAgIHRoaXMuaXNSZXN0b3JpbmdGcm9tSGlzdG9yeSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzTG9hZGluZyA9IHRydWU7XG4gICAgICAgIHRoaXMuaXNBZGRpbmdUb0NhcnQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc0dlbmVyYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5sb2FkaW5nVGltZSA9IDA7XG4gICAgICAgIHRoaXMubG9hZGluZ0ludGVydmFsID0gbnVsbDtcbiAgICAgICAgdGhpcy5jb2xvckJsb2NrcyA9IFtdO1xuICAgICAgICB0aGlzLnNpemVCbG9ja3MgPSBbXTtcbiAgICAgICAgdGhpcy5wcm9kdWN0QmxvY2tzID0gW107XG4gICAgICAgIHRoaXMubG9hZGVkVXNlckltYWdlID0gbnVsbDtcbiAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aEFpID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaW1hZ2VDYWNoZSA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5sb2FkaW5nRWxlbWVudHNDYWNoZSA9IHt9O1xuICAgICAgICB0aGlzLnByb2R1Y3RDYWNoZSA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5tb2NrdXBDYWNoZSA9IG5ldyBNYXAoKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0Q29uZmlncyB8fCBwcm9kdWN0Q29uZmlncy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW0VkaXRvcl0g0J3QtSDQv9GA0LXQtNC+0YHRgtCw0LLQu9C10L3RiyDQutC+0L3RhNC40LPRg9GA0LDRhtC40Lgg0L/RgNC+0LTRg9C60YLQvtCyJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdG9yYWdlTWFuYWdlciA9IG5ldyBFZGl0b3JTdG9yYWdlTWFuYWdlcigpO1xuICAgICAgICB0aGlzLnByb2R1Y3RDb25maWdzID0gcHJvZHVjdENvbmZpZ3M7XG4gICAgICAgIHRoaXMuZWRpdG9yQmxvY2sgPSB0aGlzLmdldFJlcXVpcmVkRWxlbWVudChibG9ja3MuZWRpdG9yQmxvY2tDbGFzcyk7XG4gICAgICAgIHRoaXMuY2hhbmdlU2lkZUJ1dHRvbiA9IHRoaXMuZ2V0UmVxdWlyZWRFbGVtZW50KGJsb2Nrcy5jaGFuZ2VTaWRlQnV0dG9uQ2xhc3MpO1xuICAgICAgICB0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2sgPSB0aGlzLmdldFJlcXVpcmVkRWxlbWVudChibG9ja3MuZWRpdG9ySGlzdG9yeVVuZG9CbG9ja0NsYXNzKTtcbiAgICAgICAgdGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrID0gdGhpcy5nZXRSZXF1aXJlZEVsZW1lbnQoYmxvY2tzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2tDbGFzcyk7XG4gICAgICAgIHRoaXMucXVhbnRpdHlGb3JtQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JRdWFudGl0eUZvcm1CbG9ja0NsYXNzKTtcbiAgICAgICAgY29uc3QgcHJvZHVjdExpc3RCbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLnByb2R1Y3RMaXN0QmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChwcm9kdWN0TGlzdEJsb2NrKVxuICAgICAgICAgICAgdGhpcy5wcm9kdWN0TGlzdEJsb2NrID0gcHJvZHVjdExpc3RCbG9jaztcbiAgICAgICAgY29uc3QgcHJvZHVjdEl0ZW1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLnByb2R1Y3RJdGVtQ2xhc3MpO1xuICAgICAgICBpZiAocHJvZHVjdEl0ZW1CbG9jaylcbiAgICAgICAgICAgIHRoaXMucHJvZHVjdEl0ZW1CbG9jayA9IHByb2R1Y3RJdGVtQmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvckNvbG9yc0xpc3RCbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvckNvbG9yc0xpc3RCbG9ja0NsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvckNvbG9yc0xpc3RCbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yQ29sb3JzTGlzdEJsb2NrID0gZWRpdG9yQ29sb3JzTGlzdEJsb2NrO1xuICAgICAgICBjb25zdCBlZGl0b3JDb2xvckl0ZW1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvckNvbG9ySXRlbUJsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yQ29sb3JJdGVtQmxvY2spXG4gICAgICAgICAgICB0aGlzLmVkaXRvckNvbG9ySXRlbUJsb2NrID0gZWRpdG9yQ29sb3JJdGVtQmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvclNpemVzTGlzdEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yU2l6ZXNMaXN0QmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JTaXplc0xpc3RCbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yU2l6ZXNMaXN0QmxvY2sgPSBlZGl0b3JTaXplc0xpc3RCbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yU2l6ZUl0ZW1CbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclNpemVJdGVtQmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JTaXplSXRlbUJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JTaXplSXRlbUJsb2NrID0gZWRpdG9yU2l6ZUl0ZW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yTGF5b3V0c0xpc3RCbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvckxheW91dHNMaXN0QmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JMYXlvdXRzTGlzdEJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRzTGlzdEJsb2NrID0gZWRpdG9yTGF5b3V0c0xpc3RCbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yTGF5b3V0SXRlbUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yTGF5b3V0SXRlbUJsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yTGF5b3V0SXRlbUJsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2sgPSBlZGl0b3JMYXlvdXRJdGVtQmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvclVwbG9hZEltYWdlQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b25DbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b24gPSBlZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbjtcbiAgICAgICAgY29uc3QgZWRpdG9yVXBsb2FkVmlld0Jsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yVXBsb2FkVmlld0Jsb2NrQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yVXBsb2FkVmlld0Jsb2NrKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2sgPSBlZGl0b3JVcGxvYWRWaWV3QmxvY2s7XG4gICAgICAgIGNvbnN0IGVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbkNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbilcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uID0gZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uO1xuICAgICAgICBjb25zdCBlZGl0b3JMb2FkV2l0aEFpQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbkNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvckxvYWRXaXRoQWlCdXR0b24pXG4gICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24gPSBlZGl0b3JMb2FkV2l0aEFpQnV0dG9uO1xuICAgICAgICBjb25zdCBlZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbkNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24pXG4gICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b24gPSBlZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uO1xuICAgICAgICBjb25zdCBlZGl0b3JBZGRPcmRlckJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYmxvY2tzLmVkaXRvckFkZE9yZGVyQnV0dG9uQ2xhc3MpO1xuICAgICAgICBpZiAoZWRpdG9yQWRkT3JkZXJCdXR0b24pXG4gICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uID0gZWRpdG9yQWRkT3JkZXJCdXR0b247XG4gICAgICAgIGNvbnN0IGVkaXRvclN1bUJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihibG9ja3MuZWRpdG9yU3VtQmxvY2tDbGFzcyk7XG4gICAgICAgIGlmIChlZGl0b3JTdW1CbG9jaylcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yU3VtQmxvY2sgPSBlZGl0b3JTdW1CbG9jaztcbiAgICAgICAgY29uc3QgZWRpdG9yUHJvZHVjdE5hbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGJsb2Nrcy5lZGl0b3JQcm9kdWN0TmFtZUNsYXNzKTtcbiAgICAgICAgaWYgKGVkaXRvclByb2R1Y3ROYW1lKVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JQcm9kdWN0TmFtZSA9IGVkaXRvclByb2R1Y3ROYW1lO1xuICAgICAgICB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja1ZpZXdDbGFzcyA9IGJsb2Nrcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tWaWV3Q2xhc3M7XG4gICAgICAgIHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrTmFtZUNsYXNzID0gYmxvY2tzLmVkaXRvckxheW91dEl0ZW1CbG9ja05hbWVDbGFzcztcbiAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tSZW1vdmVDbGFzcyA9IGJsb2Nrcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tSZW1vdmVDbGFzcztcbiAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tFZGl0Q2xhc3MgPSBibG9ja3MuZWRpdG9yTGF5b3V0SXRlbUJsb2NrRWRpdENsYXNzO1xuICAgICAgICBpZiAoZm9ybUNvbmZpZykge1xuICAgICAgICAgICAgdGhpcy5mb3JtQmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGZvcm1Db25maWcuZm9ybUJsb2NrQ2xhc3MpO1xuICAgICAgICAgICAgdGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWUgPSBmb3JtQ29uZmlnLmZvcm1JbnB1dFZhcmlhYmxlTmFtZTtcbiAgICAgICAgICAgIHRoaXMuZm9ybUJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZm9ybUNvbmZpZy5mb3JtQnV0dG9uQ2xhc3MpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlZmF1bHRQcm9kdWN0ID0gcHJvZHVjdENvbmZpZ3NbMF07XG4gICAgICAgIGlmICghZGVmYXVsdFByb2R1Y3QpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW0VkaXRvcl0g0J3QtSDQvdCw0LnQtNC10L0g0LTQtdGE0L7Qu9GC0L3Ri9C5INC/0YDQvtC00YPQutGCJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGVmYXVsdE1vY2t1cCA9IGRlZmF1bHRQcm9kdWN0Lm1vY2t1cHNbMF07XG4gICAgICAgIGlmICghZGVmYXVsdE1vY2t1cCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbRWRpdG9yXSDQndC1INC90LDQudC00LXQvSDQtNC10YTQvtC70YLQvdGL0LkgbW9ja3VwJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc2VsZWN0Q29sb3IgPSBkZWZhdWx0TW9ja3VwLmNvbG9yO1xuICAgICAgICB0aGlzLl9zZWxlY3RTaWRlID0gZGVmYXVsdE1vY2t1cC5zaWRlO1xuICAgICAgICB0aGlzLl9zZWxlY3RUeXBlID0gZGVmYXVsdFByb2R1Y3QudHlwZTtcbiAgICAgICAgdGhpcy5fc2VsZWN0U2l6ZSA9IGRlZmF1bHRQcm9kdWN0LnNpemVzPy5bMF0gfHwgJ00nO1xuICAgICAgICB0aGlzLmVkaXRvckJsb2NrLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgdGhpcy5jcmVhdGVCYWNrZ3JvdW5kQmxvY2soKTtcbiAgICAgICAgdGhpcy5tb2NrdXBCbG9jayA9IHRoaXMuY3JlYXRlTW9ja3VwQmxvY2soKTtcbiAgICAgICAgdGhpcy5jYW52YXNlc0NvbnRhaW5lciA9IHRoaXMuY3JlYXRlQ2FudmFzZXNDb250YWluZXIoKTtcbiAgICAgICAgdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2sgPSB0aGlzLmNyZWF0ZUVkaXRvckxvYWRpbmdCbG9jaygpO1xuICAgICAgICB0aGlzLmluaXRFdmVudHMoKTtcbiAgICAgICAgdGhpcy5pbml0S2V5Ym9hcmRTaG9ydGN1dHMoKTtcbiAgICAgICAgdGhpcy5pbml0TG9hZGluZ0V2ZW50cygpO1xuICAgICAgICB0aGlzLmluaXRVSUNvbXBvbmVudHMoKTtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplRWRpdG9yKCk7XG4gICAgICAgIHdpbmRvdy5nZXRMYXlvdXRzID0gKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0cy5tYXAobGF5b3V0ID0+ICh7IC4uLmxheW91dCwgdXJsOiB1bmRlZmluZWQgfSkpO1xuICAgICAgICB9O1xuICAgICAgICB3aW5kb3cubG9hZExheW91dHMgPSAobGF5b3V0cykgPT4ge1xuICAgICAgICAgICAgdGhpcy5sYXlvdXRzID0gbGF5b3V0cy5tYXAobGF5b3V0ID0+IExheW91dC5mcm9tSlNPTihsYXlvdXQpKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICB9O1xuICAgICAgICB3aW5kb3cuZXhwb3J0UHJpbnQgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBleHBvcnRlZEFydCA9IGF3YWl0IHRoaXMuZXhwb3J0QXJ0KGZhbHNlLCA0MDk2KTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qgc2lkZSBvZiBPYmplY3Qua2V5cyhleHBvcnRlZEFydCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkb3dubG9hZExpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkb3dubG9hZExpbmspO1xuICAgICAgICAgICAgICAgIGRvd25sb2FkTGluay5ocmVmID0gZXhwb3J0ZWRBcnRbc2lkZV07XG4gICAgICAgICAgICAgICAgZG93bmxvYWRMaW5rLnRhcmdldCA9ICdfc2VsZic7XG4gICAgICAgICAgICAgICAgZG93bmxvYWRMaW5rLmRvd25sb2FkID0gYCR7c2lkZX0ucG5nYDtcbiAgICAgICAgICAgICAgICBkb3dubG9hZExpbmsuY2xpY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBleHBvcnRlZEFydDtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaW5pdFVJQ29tcG9uZW50cygpIHtcbiAgICAgICAgaWYgKHRoaXMuY2hhbmdlU2lkZUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5jaGFuZ2VTaWRlQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlU2lkZUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gdGhpcy5jaGFuZ2VTaWRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9ySGlzdG9yeVVuZG9CbG9jaykge1xuICAgICAgICAgICAgdGhpcy5pbml0SGlzdG9yeVVuZG9CbG9jaygpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEhpc3RvcnlSZWRvQmxvY2soKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wcm9kdWN0TGlzdEJsb2NrICYmIHRoaXMucHJvZHVjdEl0ZW1CbG9jaykge1xuICAgICAgICAgICAgdGhpcy5pbml0UHJvZHVjdExpc3QoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5pbml0QWRkT3JkZXJCdXR0b24oKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5pbml0VXBsb2FkSW1hZ2VCdXR0b24oKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5mb3JtQmxvY2sgJiYgdGhpcy5mb3JtQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRGb3JtKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucXVhbnRpdHlGb3JtQmxvY2spIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5pbml0Rml4UXVhbnRpdHlGb3JtKCksIDUwMCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTGF5b3V0c0xpc3RCbG9jaykge1xuICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldFJlcXVpcmVkRWxlbWVudChzZWxlY3Rvcikge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBbRWRpdG9yXSDQndC1INC90LDQudC00LXQvSDQvtCx0Y/Qt9Cw0YLQtdC70YzQvdGL0Lkg0Y3Qu9C10LzQtdC90YI6ICR7c2VsZWN0b3J9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuICAgIGFzeW5jIGluaXRpYWxpemVFZGl0b3IoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkU3RhdGUoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucHJlbG9hZEFsbE1vY2t1cHMoKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tlZGl0b3JdINCY0L3QuNGG0LjQsNC70LjQt9Cw0YbQuNGPINC30LDQstC10YDRiNC10L3QsCcpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2VkaXRvcl0g0J7RiNC40LHQutCwINC40L3QuNGG0LjQsNC70LjQt9Cw0YbQuNC4OicsIGVycm9yKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZVdpdGhEZWZhdWx0cygpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGluaXRpYWxpemVXaXRoRGVmYXVsdHMoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tlZGl0b3JdINCY0L3QuNGG0LjQsNC70LjQt9Cw0YbQuNGPINGBINC00LXRhNC+0LvRgtC90YvQvNC4INC30L3QsNGH0LXQvdC40Y/QvNC4Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tlZGl0b3JdINCe0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4IG1vY2t1cCDQv9C+INGD0LzQvtC70YfQsNC90LjRjjonLCBlcnIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGluaXRFdmVudHMoKSB7XG4gICAgICAgIHdpbmRvdy5vbmJlZm9yZXVubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhbGVydChcItCS0Ysg0YPQstC10YDQtdC90YssINGH0YLQviDRhdC+0YLQuNGC0LUg0L/QvtC60LjQvdGD0YLRjCDRjdGC0YMg0YHRgtGA0LDQvdC40YbRgz9cIik7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZXZlbnRzLm9uKEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfVVBEQVRFRCwgKGRhdGFVUkwpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW9ja3VwQmxvY2suc3JjID0gZGF0YVVSTDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGluaXRMb2FkaW5nRXZlbnRzKCkge1xuICAgICAgICB0aGlzLmxvYWRpbmdFbGVtZW50c0NhY2hlLmxvYWRpbmdUZXh0ID0gdGhpcy5lZGl0b3JMb2FkaW5nQmxvY2sucXVlcnlTZWxlY3RvcignI2xvYWRpbmctdGV4dCcpO1xuICAgICAgICB0aGlzLmxvYWRpbmdFbGVtZW50c0NhY2hlLnNwaW5uZXIgPSB0aGlzLmVkaXRvckxvYWRpbmdCbG9jay5xdWVyeVNlbGVjdG9yKCcjc3Bpbm5lcicpO1xuICAgICAgICB0aGlzLmV2ZW50cy5vbihFZGl0b3JFdmVudFR5cGUuTE9BRElOR19USU1FX1VQREFURUQsIChsb2FkaW5nVGltZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBsb2FkaW5nVGV4dCwgc3Bpbm5lciB9ID0gdGhpcy5sb2FkaW5nRWxlbWVudHNDYWNoZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzTG9hZGluZykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxvYWRpbmdUaW1lID4gNSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobG9hZGluZ1RleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5pbm5lclRleHQgPSBgJHsodGhpcy5sb2FkaW5nVGltZSAvIDEwKS50b0ZpeGVkKDEpfWA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNwaW5uZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwaW5uZXIuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckxvYWRpbmdCbG9jay5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMC43NDUpXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAobG9hZGluZ1RleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRpbmdUZXh0LmlubmVyVGV4dCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNwaW5uZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwaW5uZXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZGluZ0Jsb2NrLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwKVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nVGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdUZXh0LmlubmVyVGV4dCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5ldmVudHMub24oRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCAoaXNMb2FkaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB7IGxvYWRpbmdUZXh0LCBzcGlubmVyIH0gPSB0aGlzLmxvYWRpbmdFbGVtZW50c0NhY2hlO1xuICAgICAgICAgICAgaWYgKGlzTG9hZGluZykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxvYWRpbmdJbnRlcnZhbCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMubG9hZGluZ0ludGVydmFsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nVGltZSA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1ttb2NrdXBdIGxvYWRpbmcgbW9ja3VwJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZ1RpbWUrKztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5MT0FESU5HX1RJTUVfVVBEQVRFRCwgdGhpcy5sb2FkaW5nVGltZSk7XG4gICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZGluZ0Jsb2NrLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwKVwiO1xuICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nVGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdUZXh0LmlubmVyVGV4dCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzcGlubmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNwaW5uZXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmlzTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxvYWRpbmdJbnRlcnZhbCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMubG9hZGluZ0ludGVydmFsKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nSW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmdUaW1lID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVtaXQodHlwZSwgZGV0YWlsKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzLmVtaXQodHlwZSwgZGV0YWlsKTtcbiAgICB9XG4gICAgaW5pdEtleWJvYXJkU2hvcnRjdXRzKCkge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhY3RpdmVFbGVtZW50ID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgICAgICAgICAgIGNvbnN0IGlzSW5wdXRGaWVsZCA9IGFjdGl2ZUVsZW1lbnQgJiYgKGFjdGl2ZUVsZW1lbnQudGFnTmFtZSA9PT0gJ0lOUFVUJyB8fFxuICAgICAgICAgICAgICAgIGFjdGl2ZUVsZW1lbnQudGFnTmFtZSA9PT0gJ1RFWFRBUkVBJyB8fFxuICAgICAgICAgICAgICAgIGFjdGl2ZUVsZW1lbnQuY29udGVudEVkaXRhYmxlID09PSAndHJ1ZScgfHxcbiAgICAgICAgICAgICAgICBhY3RpdmVFbGVtZW50LmlzQ29udGVudEVkaXRhYmxlKTtcbiAgICAgICAgICAgIGlmIChpc0lucHV0RmllbGQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKGV2ZW50LmN0cmxLZXkgJiYgZXZlbnQuY29kZSA9PT0gJ0tleVonICYmICFldmVudC5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy51bmRvKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKChldmVudC5jdHJsS2V5ICYmIGV2ZW50LnNoaWZ0S2V5ICYmIGV2ZW50LmNvZGUgPT09ICdLZXlaJykgfHxcbiAgICAgICAgICAgICAgICAoZXZlbnQuY3RybEtleSAmJiBldmVudC5jb2RlID09PSAnS2V5WScgJiYgIWV2ZW50LnNoaWZ0S2V5KSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWRvKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgY3JlYXRlQmFja2dyb3VuZEJsb2NrKCkge1xuICAgICAgICBjb25zdCBiYWNrZ3JvdW5kID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGJhY2tncm91bmQuY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXBvc2l0aW9uJyk7XG4gICAgICAgIGJhY2tncm91bmQuaWQgPSAnZWRpdG9yLWJhY2tncm91bmQnO1xuICAgICAgICB0aGlzLmVkaXRvckJsb2NrLmFwcGVuZENoaWxkKGJhY2tncm91bmQpO1xuICAgICAgICByZXR1cm4gYmFja2dyb3VuZDtcbiAgICB9XG4gICAgY3JlYXRlTW9ja3VwQmxvY2soKSB7XG4gICAgICAgIGNvbnN0IG1vY2t1cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICAgICAgICBtb2NrdXAuY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXBvc2l0aW9uJyk7XG4gICAgICAgIG1vY2t1cC5pZCA9ICdlZGl0b3ItbW9ja3VwJztcbiAgICAgICAgdGhpcy5lZGl0b3JCbG9jay5hcHBlbmRDaGlsZChtb2NrdXApO1xuICAgICAgICByZXR1cm4gbW9ja3VwO1xuICAgIH1cbiAgICBjcmVhdGVDYW52YXNlc0NvbnRhaW5lcigpIHtcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGNhbnZhcy5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItcG9zaXRpb24nKTtcbiAgICAgICAgY2FudmFzLmlkID0gJ2VkaXRvci1jYW52YXNlcy1jb250YWluZXInO1xuICAgICAgICBjYW52YXMuc3R5bGUuekluZGV4ID0gJzEwJztcbiAgICAgICAgY2FudmFzLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICAgIHRoaXMuZWRpdG9yQmxvY2suYXBwZW5kQ2hpbGQoY2FudmFzKTtcbiAgICAgICAgcmV0dXJuIGNhbnZhcztcbiAgICB9XG4gICAgY3JlYXRlRWRpdG9yTG9hZGluZ0Jsb2NrKCkge1xuICAgICAgICBjb25zdCBlZGl0b3JMb2FkaW5nQmxvY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIjtcbiAgICAgICAgZWRpdG9yTG9hZGluZ0Jsb2NrLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1wb3NpdGlvbicpO1xuICAgICAgICBlZGl0b3JMb2FkaW5nQmxvY2suaWQgPSAnZWRpdG9yLWxvYWRpbmcnO1xuICAgICAgICBlZGl0b3JMb2FkaW5nQmxvY2suc3R5bGUuekluZGV4ID0gXCIxMDAwXCI7XG4gICAgICAgIGVkaXRvckxvYWRpbmdCbG9jay5zdHlsZS5wb2ludGVyRXZlbnRzID0gXCJub25lXCI7XG4gICAgICAgIGNvbnN0IGxvYWRpbmdUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGxvYWRpbmdUZXh0LmlkID0gJ2xvYWRpbmctdGV4dCc7XG4gICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUudGV4dEFsaWduID0gXCJjZW50ZXJcIjtcbiAgICAgICAgbG9hZGluZ1RleHQuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLnRvcCA9IFwiNTAlXCI7XG4gICAgICAgIGxvYWRpbmdUZXh0LnN0eWxlLmxlZnQgPSBcIjUwJVwiO1xuICAgICAgICBsb2FkaW5nVGV4dC5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZSgtNTAlLCAtNTAlKVwiO1xuICAgICAgICBlZGl0b3JMb2FkaW5nQmxvY2suYXBwZW5kQ2hpbGQobG9hZGluZ1RleHQpO1xuICAgICAgICBjb25zdCBzcGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHNwaW5uZXIuaWQgPSAnc3Bpbm5lcic7XG4gICAgICAgIHNwaW5uZXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBlZGl0b3JMb2FkaW5nQmxvY2suYXBwZW5kQ2hpbGQoc3Bpbm5lcik7XG4gICAgICAgIHRoaXMuZWRpdG9yQmxvY2suYXBwZW5kQ2hpbGQoZWRpdG9yTG9hZGluZ0Jsb2NrKTtcbiAgICAgICAgcmV0dXJuIGVkaXRvckxvYWRpbmdCbG9jaztcbiAgICB9XG4gICAgYXN5bmMgdXBkYXRlTW9ja3VwKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbbW9ja3VwXSB1cGRhdGUgZm9yICR7dGhpcy5fc2VsZWN0VHlwZX0gJHt0aGlzLl9zZWxlY3RTaWRlfSAke3RoaXMuX3NlbGVjdENvbG9yLm5hbWV9YCk7XG4gICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIHRydWUpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbW9ja3VwSW1hZ2VVcmwgPSB0aGlzLmZpbmRNb2NrdXBVcmwoKTtcbiAgICAgICAgICAgIGlmICghbW9ja3VwSW1hZ2VVcmwpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ttb2NrdXBdINCd0LUg0L3QsNC50LTQtdC9IG1vY2t1cCDQtNC70Y8g0YLQtdC60YPRidC40YUg0L/QsNGA0LDQvNC10YLRgNC+0LInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRhdGFVUkwgPSBhd2FpdCB0aGlzLmxvYWRBbmRDb252ZXJ0SW1hZ2UobW9ja3VwSW1hZ2VVcmwpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfVVBEQVRFRCwgZGF0YVVSTCk7XG4gICAgICAgICAgICB0aGlzLm1vY2t1cEJsb2NrLnNyYyA9IGRhdGFVUkw7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbbW9ja3VwXSBNb2NrdXAg0YPRgdC/0LXRiNC90L4g0L7QsdC90L7QstC70LXQvScpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW21vY2t1cF0g0J7RiNC40LHQutCwINC+0LHQvdC+0LLQu9C10L3QuNGPIG1vY2t1cDonLCBlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmaW5kTW9ja3VwVXJsKCkge1xuICAgICAgICBjb25zdCBjYWNoZUtleSA9IGAke3RoaXMuX3NlbGVjdFR5cGV9LSR7dGhpcy5fc2VsZWN0U2lkZX0tJHt0aGlzLl9zZWxlY3RDb2xvci5uYW1lfWA7XG4gICAgICAgIGlmICh0aGlzLm1vY2t1cENhY2hlLmhhcyhjYWNoZUtleSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1vY2t1cENhY2hlLmdldChjYWNoZUtleSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0KSB7XG4gICAgICAgICAgICB0aGlzLm1vY2t1cENhY2hlLnNldChjYWNoZUtleSwgbnVsbCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtb2NrdXAgPSBwcm9kdWN0Lm1vY2t1cHMuZmluZChtID0+IG0uc2lkZSA9PT0gdGhpcy5fc2VsZWN0U2lkZSAmJiBtLmNvbG9yLm5hbWUgPT09IHRoaXMuX3NlbGVjdENvbG9yLm5hbWUpO1xuICAgICAgICBjb25zdCB1cmwgPSBtb2NrdXA/LnVybCB8fCBudWxsO1xuICAgICAgICB0aGlzLm1vY2t1cENhY2hlLnNldChjYWNoZUtleSwgdXJsKTtcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG4gICAgZ2V0UHJvZHVjdEJ5VHlwZSh0eXBlKSB7XG4gICAgICAgIGlmICghdGhpcy5wcm9kdWN0Q2FjaGUuaGFzKHR5cGUpKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5wcm9kdWN0Q29uZmlncy5maW5kKHAgPT4gcC50eXBlID09PSB0eXBlKTtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9kdWN0Q2FjaGUuc2V0KHR5cGUsIHByb2R1Y3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnByb2R1Y3RDYWNoZS5nZXQodHlwZSk7XG4gICAgfVxuICAgIGNsZWFyTW9ja3VwQ2FjaGUoKSB7XG4gICAgICAgIHRoaXMubW9ja3VwQ2FjaGUuY2xlYXIoKTtcbiAgICB9XG4gICAgYXN5bmMgbG9hZEFuZENvbnZlcnRJbWFnZShpbWFnZVVybCkge1xuICAgICAgICBpZiAodGhpcy5pbWFnZUNhY2hlLmhhcyhpbWFnZVVybCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tjYWNoZV0g0JjQt9C+0LHRgNCw0LbQtdC90LjQtSDQt9Cw0LPRgNGD0LbQtdC90L4g0LjQtyDQutGN0YjQsDonLCBpbWFnZVVybCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbWFnZUNhY2hlLmdldChpbWFnZVVybCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICAgICAgICBpbWFnZS5zZXRBdHRyaWJ1dGUoJ2Nyb3NzT3JpZ2luJywgJ2Fub255bW91cycpO1xuICAgICAgICAgICAgaW1hZ2Uub25sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICAgICAgICAgICAgICBjYW52YXMud2lkdGggPSBpbWFnZS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGltYWdlLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY3R4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCfQndC1INGD0LTQsNC70L7RgdGMINC/0L7Qu9GD0YfQuNGC0Ywg0LrQvtC90YLQtdC60YHRgiBjYW52YXMnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShpbWFnZSwgMCwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGFVUkwgPSBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbWFnZUNhY2hlLnNldChpbWFnZVVybCwgZGF0YVVSTCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tjYWNoZV0g0JjQt9C+0LHRgNCw0LbQtdC90LjQtSDRgdC+0YXRgNCw0L3QtdC90L4g0LIg0LrRjdGIOicsIGltYWdlVXJsKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhVVJMKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGltYWdlLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihg0J7RiNC40LHQutCwINC30LDQs9GA0YPQt9C60Lgg0LjQt9C+0LHRgNCw0LbQtdC90LjRjzogJHtpbWFnZVVybH1gKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1hZ2Uuc3JjID0gaW1hZ2VVcmw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBzYXZlU3RhdGUoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tzdGF0ZV0g0KHQvtGF0YDQsNC90LXQvdC40LUg0YHQvtGB0YLQvtGP0L3QuNGPINGA0LXQtNCw0LrRgtC+0YDQsCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yU3RhdGUgPSB7XG4gICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgICAgIHR5cGU6IHRoaXMuX3NlbGVjdFR5cGUsXG4gICAgICAgICAgICAgICAgY29sb3I6IHRoaXMuX3NlbGVjdENvbG9yLm5hbWUsXG4gICAgICAgICAgICAgICAgc2lkZTogdGhpcy5fc2VsZWN0U2lkZSxcbiAgICAgICAgICAgICAgICBzaXplOiB0aGlzLl9zZWxlY3RTaXplXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3N0YXRlXSDQodC+0YXRgNCw0L3Rj9C10Lw6IHR5cGU9JHtlZGl0b3JTdGF0ZS50eXBlfSwgY29sb3I9JHtlZGl0b3JTdGF0ZS5jb2xvcn0sIHNpZGU9JHtlZGl0b3JTdGF0ZS5zaWRlfSwgc2l6ZT0ke2VkaXRvclN0YXRlLnNpemV9YCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLnNhdmVFZGl0b3JTdGF0ZShlZGl0b3JTdGF0ZSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbc3RhdGVdINCh0L7RgdGC0L7Rj9C90LjQtSDRg9GB0L/QtdGI0L3QviDRgdC+0YXRgNCw0L3QtdC90L4nKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tzdGF0ZV0g0J7RiNC40LHQutCwINGB0L7RhdGA0LDQvdC10L3QuNGPINGB0L7RgdGC0L7Rj9C90LjRjzonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgc2F2ZUxheW91dHMoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tsYXllcnNdINCh0L7RhdGA0LDQvdC10L3QuNC1INGB0LvQvtGR0LInKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RvcmFnZU1hbmFnZXIuc2F2ZUxheWVycyh0aGlzLmxheW91dHMpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2xheWVyc10g0KHQu9C+0Lgg0YPRgdC/0LXRiNC90L4g0YHQvtGF0YDQsNC90LXQvdGLJyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbbGF5ZXJzXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y8g0YHQu9C+0ZHQsjonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgbG9hZExheW91dHMoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tsYXllcnNdINCX0LDQs9GA0YPQt9C60LAg0YHQu9C+0ZHQsicpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2F2ZWRMYXlvdXRzID0gYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci5sb2FkTGF5ZXJzKCk7XG4gICAgICAgICAgICBpZiAoc2F2ZWRMYXlvdXRzICYmIEFycmF5LmlzQXJyYXkoc2F2ZWRMYXlvdXRzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMubGF5b3V0cyA9IHNhdmVkTGF5b3V0cy5tYXAoKGxheW91dERhdGEpID0+IG5ldyBMYXlvdXQobGF5b3V0RGF0YSkpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtsYXllcnNdINCX0LDQs9GA0YPQttC10L3QviAke3RoaXMubGF5b3V0cy5sZW5ndGh9INGB0LvQvtGR0LJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubGF5b3V0cyA9IFtdO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tsYXllcnNdINCd0LXRgiDRgdC+0YXRgNCw0L3RkdC90L3Ri9GFINGB0LvQvtGR0LInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2F2ZUxheWVyc1RvSGlzdG9yeSgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2xheWVyc10g0J7RiNC40LHQutCwINC30LDQs9GA0YPQt9C60Lgg0YHQu9C+0ZHQsjonLCBlcnJvcik7XG4gICAgICAgICAgICB0aGlzLmxheW91dHMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZUxheWVyc1RvSGlzdG9yeSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGxvYWRTdGF0ZSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW3N0YXRlXSDQl9Cw0LPRgNGD0LfQutCwINGB0L7RgdGC0L7Rj9C90LjRjyDRgNC10LTQsNC60YLQvtGA0LAnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvclN0YXRlID0gYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci5sb2FkRWRpdG9yU3RhdGUoKTtcbiAgICAgICAgICAgIGlmICghZWRpdG9yU3RhdGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbc3RhdGVdINCh0L7RhdGA0LDQvdC10L3QvdC+0LUg0YHQvtGB0YLQvtGP0L3QuNC1INC90LUg0L3QsNC50LTQtdC90L4nKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRDb2xvcnNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0U2l6ZXNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuaXNTdGF0ZUV4cGlyZWQoZWRpdG9yU3RhdGUuZGF0ZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tzdGF0ZV0g0KHQvtGB0YLQvtGP0L3QuNC1INGD0YHRgtCw0YDQtdC70L4sINC+0YfQuNGJ0LDQtdC8Jyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9yYWdlTWFuYWdlci5jbGVhckVkaXRvclN0YXRlKCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRQcm9kdWN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0Q29sb3JzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdFNpemVzTGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGFwcGxpZWQgPSBhd2FpdCB0aGlzLmFwcGx5U3RhdGUoZWRpdG9yU3RhdGUpO1xuICAgICAgICAgICAgaWYgKGFwcGxpZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbc3RhdGVdINCh0L7RgdGC0L7Rj9C90LjQtSDRg9GB0L/QtdGI0L3QviDQt9Cw0LPRgNGD0LbQtdC90L4nKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm9kdWN0QmxvY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9kdWN0QmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2IoMjIyIDIyMiAyMjIpJztcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUJsb2NrID0gdGhpcy5wcm9kdWN0QmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX3Byb2R1Y3QtYmxvY2tfXycgKyB0aGlzLl9zZWxlY3RUeXBlKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlQmxvY2suc3R5bGUuYmFja2dyb3VuZCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZExheW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRDb2xvcnNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0U2l6ZXNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tzdGF0ZV0g0J3QtSDRg9C00LDQu9C+0YHRjCDQv9GA0LjQvNC10L3QuNGC0Ywg0YHQvtGF0YDQsNC90LXQvdC90L7QtSDRgdC+0YHRgtC+0Y/QvdC40LUnKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZFByb2R1Y3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRDb2xvcnNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0U2l6ZXNMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbc3RhdGVdINCe0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4INGB0L7RgdGC0L7Rj9C90LjRjzonLCBlcnJvcik7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICAgICAgdGhpcy5sb2FkUHJvZHVjdCgpO1xuICAgICAgICAgICAgdGhpcy5pbml0Q29sb3JzTGlzdCgpO1xuICAgICAgICAgICAgdGhpcy5pbml0U2l6ZXNMaXN0KCk7XG4gICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaXNTdGF0ZUV4cGlyZWQoZGF0ZVN0cmluZykge1xuICAgICAgICBjb25zdCBzdGF0ZURhdGUgPSBuZXcgRGF0ZShkYXRlU3RyaW5nKTtcbiAgICAgICAgY29uc3QgZXhwaXJhdGlvbkRhdGUgPSBEYXRlLm5vdygpIC0gKENPTlNUQU5UUy5TVEFURV9FWFBJUkFUSU9OX0RBWVMgKiAyNCAqIDYwICogNjAgKiAxMDAwKTtcbiAgICAgICAgcmV0dXJuIHN0YXRlRGF0ZS5nZXRUaW1lKCkgPCBleHBpcmF0aW9uRGF0ZTtcbiAgICB9XG4gICAgYXN5bmMgYXBwbHlTdGF0ZShlZGl0b3JTdGF0ZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCFlZGl0b3JTdGF0ZS50eXBlIHx8ICFlZGl0b3JTdGF0ZS5jb2xvciB8fCAhZWRpdG9yU3RhdGUuc2lkZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW3N0YXRlXSDQndC10LrQvtGA0YDQtdC60YLQvdC+0LUg0YHQvtGB0YLQvtGP0L3QuNC1OiDQvtGC0YHRg9GC0YHRgtCy0YPRjtGCINC+0LHRj9C30LDRgtC10LvRjNC90YvQtSDQv9C+0LvRjycpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtzdGF0ZV0g0JLQvtGB0YHRgtCw0L3QvtCy0LvQtdC90LjQtSDRgdC+0YHRgtC+0Y/QvdC40Y86IHR5cGU9JHtlZGl0b3JTdGF0ZS50eXBlfSwgY29sb3I9JHtlZGl0b3JTdGF0ZS5jb2xvcn0sIHNpZGU9JHtlZGl0b3JTdGF0ZS5zaWRlfSwgc2l6ZT0ke2VkaXRvclN0YXRlLnNpemV9YCk7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5wcm9kdWN0Q29uZmlncy5maW5kKHAgPT4gcC50eXBlID09PSBlZGl0b3JTdGF0ZS50eXBlKTtcbiAgICAgICAgICAgIGlmICghcHJvZHVjdCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW3N0YXRlXSDQn9GA0L7QtNGD0LrRgiDRgtC40L/QsCAke2VkaXRvclN0YXRlLnR5cGV9INC90LUg0L3QsNC50LTQtdC9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbW9ja3VwID0gcHJvZHVjdC5tb2NrdXBzLmZpbmQobSA9PiBtLmNvbG9yLm5hbWUgPT09IGVkaXRvclN0YXRlLmNvbG9yKTtcbiAgICAgICAgICAgIGlmICghbW9ja3VwKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbc3RhdGVdIE1vY2t1cCDRgSDRhtCy0LXRgtC+0LwgJHtlZGl0b3JTdGF0ZS5jb2xvcn0g0L3QtSDQvdCw0LnQtNC10L0g0LTQu9GPINC/0YDQvtC00YPQutGC0LAgJHtlZGl0b3JTdGF0ZS50eXBlfWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdFR5cGUgPSBlZGl0b3JTdGF0ZS50eXBlO1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0Q29sb3IgPSBtb2NrdXAuY29sb3I7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RTaWRlID0gZWRpdG9yU3RhdGUuc2lkZTtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdFNpemUgPSBlZGl0b3JTdGF0ZS5zaXplIHx8IHRoaXMuX3NlbGVjdFNpemU7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbc3RhdGVdINCh0L7RgdGC0L7Rj9C90LjQtSDQv9GA0LjQvNC10L3QtdC90L46IHR5cGU9JHt0aGlzLl9zZWxlY3RUeXBlfSwgY29sb3I9JHt0aGlzLl9zZWxlY3RDb2xvci5uYW1lfSwgc2lkZT0ke3RoaXMuX3NlbGVjdFNpZGV9LCBzaXplPSR7dGhpcy5fc2VsZWN0U2l6ZX1gKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0L/RgNC40LzQtdC90LXQvdC40Y8g0YHQvtGB0YLQvtGP0L3QuNGPOicsIGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXRUeXBlKHR5cGUpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdFR5cGUgIT09IHR5cGUpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdFR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgdGhpcy5jbGVhck1vY2t1cENhY2hlKCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLlNUQVRFX0NIQU5HRUQsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbc3RhdGVdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjzonLCBlcnIpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXRDb2xvcihjb2xvcikge1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0Q29sb3IgIT09IGNvbG9yKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RDb2xvciA9IGNvbG9yO1xuICAgICAgICAgICAgdGhpcy5jbGVhck1vY2t1cENhY2hlKCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLlNUQVRFX0NIQU5HRUQsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbc3RhdGVdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjzonLCBlcnIpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXRTaWRlKHNpZGUpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdFNpZGUgIT09IHNpZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdFNpZGUgPSBzaWRlO1xuICAgICAgICAgICAgdGhpcy5jbGVhck1vY2t1cENhY2hlKCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLlNUQVRFX0NIQU5HRUQsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbc3RhdGVdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjzonLCBlcnIpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXRTaXplKHNpemUpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdFNpemUgIT09IHNpemUpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdFNpemUgPSBzaXplO1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5TVEFURV9DSEFOR0VELCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKS5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcignW3N0YXRlXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y86JywgZXJyKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYWRkTGF5b3V0KGxheW91dCkge1xuICAgICAgICBpZiAodGhpcy5pc1Jlc3RvcmluZ0Zyb21IaXN0b3J5KSB7XG4gICAgICAgICAgICB0aGlzLmxheW91dHMucHVzaChsYXlvdXQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sYXlvdXRzLnB1c2gobGF5b3V0KTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZUxheWVyc1RvSGlzdG9yeSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTEFZT1VUX0FEREVELCBsYXlvdXQpO1xuICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICB0aGlzLnNhdmVMYXlvdXRzKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycikpO1xuICAgIH1cbiAgICByZW1vdmVMYXlvdXQobGF5b3V0SWQpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmxheW91dHMuZmluZEluZGV4KGwgPT4gbC5pZCA9PT0gbGF5b3V0SWQpO1xuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICBjb25zdCBsYXlvdXQgPSB0aGlzLmxheW91dHNbaW5kZXhdO1xuICAgICAgICAgICAgaWYgKGxheW91dCkge1xuICAgICAgICAgICAgICAgIHRoaXMubGF5b3V0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pc1Jlc3RvcmluZ0Zyb21IaXN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2F2ZUxheWVyc1RvSGlzdG9yeSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLkxBWU9VVF9SRU1PVkVELCBsYXlvdXRJZCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zYXZlTGF5b3V0cygpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbbGF5ZXJzXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y8g0YHQu9C+0ZHQsjonLCBlcnIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHVwZGF0ZUxheW91dChsYXlvdXRJZCwgdXBkYXRlcykge1xuICAgICAgICBjb25zdCBsYXlvdXQgPSB0aGlzLmxheW91dHMuZmluZChsID0+IGwuaWQgPT09IGxheW91dElkKTtcbiAgICAgICAgaWYgKGxheW91dCkge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihsYXlvdXQsIHVwZGF0ZXMpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzUmVzdG9yaW5nRnJvbUhpc3RvcnkpIHtcbiAgICAgICAgICAgICAgICBpZiAoJ3VybCcgaW4gdXBkYXRlcyB8fCAnbmFtZScgaW4gdXBkYXRlcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNhdmVMYXllcnNUb0hpc3RvcnkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLkxBWU9VVF9VUERBVEVELCBsYXlvdXQpO1xuICAgICAgICAgICAgdGhpcy5zYXZlTGF5b3V0cygpLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCdbbGF5ZXJzXSDQntGI0LjQsdC60LAg0YHQvtGF0YDQsNC90LXQvdC40Y8g0YHQu9C+0ZHQsjonLCBlcnIpKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZ2V0TGF5b3V0KGxheW91dElkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxheW91dHMuZmluZChsID0+IGwuaWQgPT09IGxheW91dElkKTtcbiAgICB9XG4gICAgZ2V0TGF5b3V0cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0cztcbiAgICB9XG4gICAgaW5pdEhpc3RvcnlVbmRvQmxvY2soKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5IGJsb2NrXSBpbml0IHVuZG8nKTtcbiAgICAgICAgdGhpcy5lZGl0b3JIaXN0b3J5VW5kb0Jsb2NrLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgdGhpcy5lZGl0b3JIaXN0b3J5VW5kb0Jsb2NrLm9uY2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbaGlzdG9yeSB1bmRvIGJsb2NrXSBjbGlja2VkJyk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnVuZG8oKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy51cGRhdGVIaXN0b3J5QnV0dG9uc1N0YXRlKCk7XG4gICAgfVxuICAgIGluaXRIaXN0b3J5UmVkb0Jsb2NrKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbaGlzdG9yeSByZWRvIGJsb2NrXSBpbml0IHJlZG8nKTtcbiAgICAgICAgdGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgdGhpcy5lZGl0b3JIaXN0b3J5UmVkb0Jsb2NrLm9uY2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbaGlzdG9yeSByZWRvIGJsb2NrXSBjbGlja2VkJyk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlZG8oKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy51cGRhdGVIaXN0b3J5QnV0dG9uc1N0YXRlKCk7XG4gICAgfVxuICAgIGluaXRQcm9kdWN0TGlzdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnByb2R1Y3RMaXN0QmxvY2sgfHwgIXRoaXMucHJvZHVjdEl0ZW1CbG9jaylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW1Byb2R1Y3RMaXN0XSBpbml0IHByb2R1Y3QgbGlzdCcpO1xuICAgICAgICB0aGlzLnByb2R1Y3RJdGVtQmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgdGhpcy5wcm9kdWN0Q29uZmlncy5mb3JFYWNoKHByb2R1Y3QgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdEl0ZW0gPSB0aGlzLnByb2R1Y3RJdGVtQmxvY2suY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgcHJvZHVjdEl0ZW0uc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0SW1hZ2VXcmFwcGVyID0gcHJvZHVjdEl0ZW0ucXVlcnlTZWxlY3RvcignLnByb2R1Y3QtaXRlbS1pbWFnZScpO1xuICAgICAgICAgICAgaWYgKHByb2R1Y3RJbWFnZVdyYXBwZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0SW1hZ2UgPSBnZXRMYXN0Q2hpbGQocHJvZHVjdEltYWdlV3JhcHBlcik7XG4gICAgICAgICAgICAgICAgaWYgKHByb2R1Y3RJbWFnZSkge1xuICAgICAgICAgICAgICAgICAgICBwcm9kdWN0SW1hZ2Uuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gYHVybCgke3Byb2R1Y3QubW9ja3Vwc1swXT8udXJsfSlgO1xuICAgICAgICAgICAgICAgICAgICBwcm9kdWN0SW1hZ2Uuc3R5bGUuYmFja2dyb3VuZFNpemUgPSAnY292ZXInO1xuICAgICAgICAgICAgICAgICAgICBwcm9kdWN0SW1hZ2Uuc3R5bGUuYmFja2dyb3VuZFBvc2l0aW9uID0gJ2NlbnRlcic7XG4gICAgICAgICAgICAgICAgICAgIHByb2R1Y3RJbWFnZS5zdHlsZS5iYWNrZ3JvdW5kUmVwZWF0ID0gJ25vLXJlcGVhdCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcHJvZHVjdFRleHRXcmFwcGVyID0gcHJvZHVjdEl0ZW0ucXVlcnlTZWxlY3RvcignLnByb2R1Y3QtaXRlbS10ZXh0Jyk7XG4gICAgICAgICAgICBpZiAocHJvZHVjdFRleHRXcmFwcGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZHVjdFRleHQgPSBnZXRMYXN0Q2hpbGQocHJvZHVjdFRleHRXcmFwcGVyKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvZHVjdFRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvZHVjdFRleHQuaW5uZXJUZXh0ID0gcHJvZHVjdC5wcm9kdWN0TmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0QmxvY2sgPSBwcm9kdWN0SXRlbS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIHByb2R1Y3RCbG9jay5jbGFzc0xpc3QuYWRkKCdlZGl0b3Itc2V0dGluZ3NfX3Byb2R1Y3QtYmxvY2tfXycgKyBwcm9kdWN0LnR5cGUpO1xuICAgICAgICAgICAgcHJvZHVjdEJsb2NrLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHByb2R1Y3RCbG9jay5zdHlsZS5ib3JkZXJDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgICAgICAgICBwcm9kdWN0SXRlbS5vbmNsaWNrID0gKCkgPT4gdGhpcy5jaGFuZ2VQcm9kdWN0KHByb2R1Y3QudHlwZSk7XG4gICAgICAgICAgICB0aGlzLnByb2R1Y3RCbG9ja3MucHVzaChwcm9kdWN0QmxvY2spO1xuICAgICAgICAgICAgdGhpcy5wcm9kdWN0TGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkLmFwcGVuZENoaWxkKHByb2R1Y3RJdGVtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLnByb2R1Y3RCbG9ja3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5wcm9kdWN0QmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgICAgIGJsb2NrLnN0eWxlLmJhY2tncm91bmQgPSAncmdiKDIyMiAyMjIgMjIyKSc7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUJsb2NrID0gdGhpcy5wcm9kdWN0QmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX3Byb2R1Y3QtYmxvY2tfXycgKyB0aGlzLl9zZWxlY3RUeXBlKSk7XG4gICAgICAgICAgICBpZiAoYWN0aXZlQmxvY2spIHtcbiAgICAgICAgICAgICAgICBhY3RpdmVCbG9jay5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5pdENvbG9yc0xpc3QoKSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JDb2xvcnNMaXN0QmxvY2sgfHwgIXRoaXMuZWRpdG9yQ29sb3JJdGVtQmxvY2spXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gaW5pdCBjb2xvcnMgZm9yICR7dGhpcy5fc2VsZWN0VHlwZX1gKTtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmVkaXRvckNvbG9ySXRlbUJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGNvbnN0IGNvbG9yc0NvbnRhaW5lciA9IHRoaXMuZWRpdG9yQ29sb3JzTGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICBjb2xvcnNDb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIHRoaXMuY29sb3JCbG9ja3MgPSBbXTtcbiAgICAgICAgY29uc3QgY29sb3JzID0gcHJvZHVjdC5tb2NrdXBzXG4gICAgICAgICAgICAuZmlsdGVyKG1vY2t1cCA9PiBtb2NrdXAuc2lkZSA9PT0gdGhpcy5fc2VsZWN0U2lkZSlcbiAgICAgICAgICAgIC5tYXAobW9ja3VwID0+IG1vY2t1cC5jb2xvcik7XG4gICAgICAgIGNvbG9ycy5mb3JFYWNoKGNvbG9yID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9ySXRlbSA9IHRoaXMuZWRpdG9yQ29sb3JJdGVtQmxvY2suY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgY29sb3JJdGVtLnN0eWxlLmRpc3BsYXkgPSAndGFibGUnO1xuICAgICAgICAgICAgY29uc3QgY29sb3JCbG9jayA9IGNvbG9ySXRlbS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGNvbG9yQmxvY2suY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXNldHRpbmdzX19jb2xvci1ibG9ja19fJyArIGNvbG9yLm5hbWUpO1xuICAgICAgICAgICAgY29sb3JCbG9jay5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICBjb2xvckJsb2NrLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yLmhleDtcbiAgICAgICAgICAgIGNvbG9yQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICAgICAgICAgICAgY29sb3JJdGVtLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNoYW5nZUNvbG9yKGNvbG9yLm5hbWUpO1xuICAgICAgICAgICAgdGhpcy5jb2xvckJsb2Nrcy5wdXNoKGNvbG9yQmxvY2spO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JDb2xvcnNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuYXBwZW5kQ2hpbGQoY29sb3JJdGVtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLmNvbG9yQmxvY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuY29sb3JCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICAgICAgYmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YzZjNmMyc7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUJsb2NrID0gdGhpcy5jb2xvckJsb2Nrcy5maW5kKGJsb2NrID0+IGJsb2NrLmNsYXNzTGlzdC5jb250YWlucygnZWRpdG9yLXNldHRpbmdzX19jb2xvci1ibG9ja19fJyArIHRoaXMuX3NlbGVjdENvbG9yLm5hbWUpKTtcbiAgICAgICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgICAgIGFjdGl2ZUJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5pdFNpemVzTGlzdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvclNpemVzTGlzdEJsb2NrIHx8ICF0aGlzLmVkaXRvclNpemVJdGVtQmxvY2spXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtzZXR0aW5nc10gaW5pdCBzaXplcyBmb3IgJHt0aGlzLl9zZWxlY3RUeXBlfWApO1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QgfHwgIXByb2R1Y3Quc2l6ZXMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuZWRpdG9yU2l6ZUl0ZW1CbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBjb25zdCBzaXplc0NvbnRhaW5lciA9IHRoaXMuZWRpdG9yU2l6ZXNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgIHNpemVzQ29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuICAgICAgICB0aGlzLnNpemVCbG9ja3MgPSBbXTtcbiAgICAgICAgcHJvZHVjdC5zaXplcy5mb3JFYWNoKHNpemUgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc2l6ZUl0ZW0gPSB0aGlzLmVkaXRvclNpemVJdGVtQmxvY2suY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgc2l6ZUl0ZW0uc3R5bGUuZGlzcGxheSA9ICd0YWJsZSc7XG4gICAgICAgICAgICBzaXplSXRlbS5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICBzaXplSXRlbS5zdHlsZS51c2VyU2VsZWN0ID0gJ25vbmUnO1xuICAgICAgICAgICAgc2l6ZUl0ZW0uY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXNldHRpbmdzX19zaXplLWJsb2NrX18nICsgc2l6ZSk7XG4gICAgICAgICAgICBjb25zdCBib3JkZXJCbG9jayA9IHNpemVJdGVtLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgYm9yZGVyQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YzZjNmMyc7XG4gICAgICAgICAgICBjb25zdCBzaXplVGV4dCA9IGdldExhc3RDaGlsZChzaXplSXRlbSk7XG4gICAgICAgICAgICBpZiAoc2l6ZVRleHQpIHtcbiAgICAgICAgICAgICAgICBzaXplVGV4dC5pbm5lclRleHQgPSBzaXplO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2l6ZUl0ZW0ub25jbGljayA9ICgpID0+IHRoaXMuY2hhbmdlU2l6ZShzaXplKTtcbiAgICAgICAgICAgIHRoaXMuc2l6ZUJsb2Nrcy5wdXNoKHNpemVJdGVtKTtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yU2l6ZXNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuYXBwZW5kQ2hpbGQoc2l6ZUl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuc2l6ZUJsb2Nrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnNpemVCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYm9yZGVyQmxvY2sgPSBibG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgICAgICBpZiAoYm9yZGVyQmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnI2YzZjNmMyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBhY3RpdmVCbG9jayA9IHRoaXMuc2l6ZUJsb2Nrcy5maW5kKGJsb2NrID0+IGJsb2NrLmNsYXNzTGlzdC5jb250YWlucygnZWRpdG9yLXNldHRpbmdzX19zaXplLWJsb2NrX18nICsgdGhpcy5fc2VsZWN0U2l6ZSkpO1xuICAgICAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYm9yZGVyQmxvY2sgPSBhY3RpdmVCbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgICAgICBpZiAoYm9yZGVyQmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2hvd0xheW91dExpc3QoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tzZXR0aW5nc10gW2xheW91dHNdIHNob3cgbGF5b3V0cyBsaXN0Jyk7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2spIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbc2V0dGluZ3NdIFtsYXlvdXRzXSBlZGl0b3JMYXlvdXRJdGVtQmxvY2sgaXMgbm90IGluaXRpYWxpemVkXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JMYXlvdXRzTGlzdEJsb2NrKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW3NldHRpbmdzXSBbbGF5b3V0c10gZWRpdG9yTGF5b3V0c0xpc3RCbG9jayBpcyBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRzTGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkLmlubmVySFRNTCA9ICcnO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSBsYXlvdXRzIGxpc3QgYmxvY2sgY2hpbGRyZW46ICR7dGhpcy5lZGl0b3JMYXlvdXRzTGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkLmNoaWxkcmVuLmxlbmd0aH1gKTtcbiAgICAgICAgdGhpcy5sYXlvdXRzLmZvckVhY2gobGF5b3V0ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dEl0ZW0gPSB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9jay5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBsYXlvdXRJdGVtLnN0eWxlLmRpc3BsYXkgPSAndGFibGUnO1xuICAgICAgICAgICAgY29uc3QgaXNFZGl0aW5nID0gdGhpcy5fc2VsZWN0TGF5b3V0ID09PSBsYXlvdXQuaWQ7XG4gICAgICAgICAgICBjb25zdCBwcmV2aWV3QmxvY2sgPSB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja1ZpZXdDbGFzc1xuICAgICAgICAgICAgICAgID8gbGF5b3V0SXRlbS5xdWVyeVNlbGVjdG9yKHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrVmlld0NsYXNzKVxuICAgICAgICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IG5hbWVCbG9jayA9IHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrTmFtZUNsYXNzXG4gICAgICAgICAgICAgICAgPyBsYXlvdXRJdGVtLnF1ZXJ5U2VsZWN0b3IodGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tOYW1lQ2xhc3MpXG4gICAgICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgcmVtb3ZlQmxvY2sgPSB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja1JlbW92ZUNsYXNzXG4gICAgICAgICAgICAgICAgPyBsYXlvdXRJdGVtLnF1ZXJ5U2VsZWN0b3IodGhpcy5lZGl0b3JMYXlvdXRJdGVtQmxvY2tSZW1vdmVDbGFzcylcbiAgICAgICAgICAgICAgICA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCBlZGl0QmxvY2sgPSB0aGlzLmVkaXRvckxheW91dEl0ZW1CbG9ja0VkaXRDbGFzc1xuICAgICAgICAgICAgICAgID8gbGF5b3V0SXRlbS5xdWVyeVNlbGVjdG9yKHRoaXMuZWRpdG9yTGF5b3V0SXRlbUJsb2NrRWRpdENsYXNzKVxuICAgICAgICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgICAgIGlmIChwcmV2aWV3QmxvY2spIHtcbiAgICAgICAgICAgICAgICBpZiAobGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcmV2aWV3RWxlbWVudCA9IHByZXZpZXdCbG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZXZpZXdFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3RWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBgdXJsKCR7bGF5b3V0LnVybH0pYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXdFbGVtZW50LnN0eWxlLmJhY2tncm91bmRTaXplID0gJ2NvbnRhaW4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlld0VsZW1lbnQuc3R5bGUuYmFja2dyb3VuZFBvc2l0aW9uID0gJ2NlbnRlcic7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3RWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kUmVwZWF0ID0gJ25vLXJlcGVhdCc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzRWRpdGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlld0VsZW1lbnQuc3R5bGUuYm9yZGVyQ29sb3IgPSAncmdiKDI1NCwgOTQsIDU4KSc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3RWxlbWVudC5zdHlsZS5ib3JkZXJDb2xvciA9ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGxheW91dC50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmFtZUJsb2NrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZUVsZW1lbnQgPSBuYW1lQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWVFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXlvdXQudHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzcGxheU5hbWUgPSAhbGF5b3V0Lm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IFwi0JjQt9C+0LHRgNCw0LbQtdC90LjQtVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBsYXlvdXQubmFtZS5pbmNsdWRlcyhcIlxcblwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGxheW91dC5uYW1lLnNwbGl0KFwiXFxuXCIpWzBdICsgXCIuLi5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGxheW91dC5uYW1lLmxlbmd0aCA+IDQwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGxheW91dC5uYW1lLnNsaWNlKDAsIDQwKSArIFwiLi4uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbGF5b3V0Lm5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lRWxlbWVudC5pbm5lclRleHQgPSBkaXNwbGF5TmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChsYXlvdXQudHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lRWxlbWVudC5pbm5lclRleHQgPSBsYXlvdXQubmFtZSB8fCBcItCi0LXQutGB0YJcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZW1vdmVCbG9jaykge1xuICAgICAgICAgICAgICAgIHJlbW92ZUJsb2NrLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgICAgICByZW1vdmVCbG9jay5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUxheW91dChsYXlvdXQuaWQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0VkaXRpbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbmNlbEVkaXRMYXlvdXQoKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMucmVzdG9yZUljb25Gcm9tRGF0YU9yaWdpbmFsKHJlbW92ZUJsb2NrLmZpcnN0RWxlbWVudENoaWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlZGl0QmxvY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNFZGl0aW5nIHx8IGxheW91dC5pZCA9PT0gXCJzdGFydFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdEJsb2NrLnN0eWxlLmRpc3BsYXkgPSAndGFibGUnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlZGl0QmxvY2suc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgICAgIGVkaXRCbG9jay5vbmNsaWNrID0gKCkgPT4gdGhpcy5lZGl0TGF5b3V0KGxheW91dCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXN0b3JlSWNvbkZyb21EYXRhT3JpZ2luYWwoZ2V0TGFzdENoaWxkKGVkaXRCbG9jaykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5lZGl0b3JMYXlvdXRzTGlzdEJsb2NrLmZpcnN0RWxlbWVudENoaWxkLmFwcGVuZENoaWxkKGxheW91dEl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy51cGRhdGVTdW0oKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBbbGF5b3V0c10gbGF5b3V0cyBzaG93bjogJHt0aGlzLmVkaXRvckxheW91dHNMaXN0QmxvY2suZmlyc3RFbGVtZW50Q2hpbGQuY2hpbGRyZW4ubGVuZ3RofWApO1xuICAgIH1cbiAgICBpbml0QWRkT3JkZXJCdXR0b24oKSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgIHRoaXMuZXZlbnRzLm9uKEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgKGlzTG9hZGluZykgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24pIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNMb2FkaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24uc3R5bGUub3BhY2l0eSA9ICcwLjUnO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdub3QtYWxsb3dlZCc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQmtC90L7Qv9C60LAg0LfQsNCx0LvQvtC60LjRgNC+0LLQsNC90LAgKNC40LTQtdGCINCz0LXQvdC10YDQsNGG0LjRjyknKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24uc3R5bGUub3BhY2l0eSA9ICcxJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW29yZGVyXSDQmtC90L7Qv9C60LAg0YDQsNC30LHQu9C+0LrQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZWRpdG9yQWRkT3JkZXJCdXR0b24ub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQWRkaW5nVG9DYXJ0KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbb3JkZXJdINCf0YDQvtGG0LXRgdGBINC00L7QsdCw0LLQu9C10L3QuNGPINGD0LbQtSDQuNC00LXRgiwg0LjQs9C90L7RgNC40YDRg9C10Lwg0L/QvtCy0YLQvtGA0L3QvtC1INC90LDQttCw0YLQuNC1Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0U3VtKCkgPT09IDApIHtcbiAgICAgICAgICAgICAgICBhbGVydCgn0JTQu9GPINC00L7QsdCw0LLQu9C10L3QuNGPINC30LDQutCw0LfQsCDQv9GA0L7QtNGD0LrRgiDQvdC1INC80L7QttC10YIg0LHRi9GC0Ywg0L/Rg9GB0YLRi9C8Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMubGF5b3V0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBhbGVydCgn0J/QvtC20LDQu9GD0LnRgdGC0LAsINC00L7QttC00LjRgtC10YHRjCDQt9Cw0LLQtdGA0YjQtdC90LjRjyDQs9C10L3QtdGA0LDRhtC40Lgg0LTQuNC30LDQudC90LAnKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tvcmRlcl0g0J/QvtC/0YvRgtC60LAg0LTQvtCx0LDQstC40YLRjCDQsiDQutC+0YDQt9C40L3RgyDQsdC10Lcg0LTQuNC30LDQudC90LAnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgYnV0dG9uVGV4dEVsZW1lbnQgPSB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uPy5xdWVyeVNlbGVjdG9yKCcudG4tYXRvbScpO1xuICAgICAgICAgICAgaWYgKCFidXR0b25UZXh0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGJ1dHRvblRleHRFbGVtZW50ID0gdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbj8ucXVlcnlTZWxlY3RvcignZGl2LCBzcGFuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvcmlnaW5hbFRleHQgPSBidXR0b25UZXh0RWxlbWVudD8udGV4dENvbnRlbnQ/LnRyaW0oKSB8fCAn0JTQvtCx0LDQstC40YLRjCDQsiDQutC+0YDQt9C40L3Rgyc7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNBZGRpbmdUb0NhcnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0QWRkVG9DYXJ0QnV0dG9uTG9hZGluZyh0cnVlLCAn0JTQvtCx0LDQstC70LXQvdC40LUuLi4nKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhcnRpY2xlID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKDk5OTk5OTk5IC0gOTk5OTk5ICsgMSkpICsgOTk5OTk5O1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0J3QsNGH0LDQu9C+INGB0L7Qt9C00LDQvdC40Y8g0LfQsNC60LDQt9CwJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXhwb3J0ZWRBcnQgPSBhd2FpdCB0aGlzLmV4cG9ydEFydCh0cnVlLCA1MTIpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0K3QutGB0L/QvtGA0YIg0LTQuNC30LDQudC90LAg0LfQsNCy0LXRgNGI0LXQvTonLCBPYmplY3Qua2V5cyhleHBvcnRlZEFydCkpO1xuICAgICAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhleHBvcnRlZEFydCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCfQntGI0LjQsdC60LA6INC90LUg0YPQtNCw0LvQvtGB0Ywg0Y3QutGB0L/QvtGA0YLQuNGA0L7QstCw0YLRjCDQtNC40LfQsNC50L0uINCf0L7Qv9GA0L7QsdGD0LnRgtC1INC10YnQtSDRgNCw0LcuJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tvcmRlcl0g0K3QutGB0L/QvtGA0YIg0LLQtdGA0L3Rg9C7INC/0YPRgdGC0L7QuSDRgNC10LfRg9C70YzRgtCw0YInKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBzaWRlcyA9IE9iamVjdC5rZXlzKGV4cG9ydGVkQXJ0KS5tYXAoc2lkZSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICBpbWFnZV91cmw6IGV4cG9ydGVkQXJ0W3NpZGVdIHx8ICcnLFxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCX0LDQs9GA0YPQt9C60LAg0LjQt9C+0LHRgNCw0LbQtdC90LjQuSDQvdCwINGB0LXRgNCy0LXRgC4uLicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVwbG9hZFByb21pc2VzID0gc2lkZXMubWFwKGFzeW5jIChzaWRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJhc2U2NCA9IHNpZGUuaW1hZ2VfdXJsLnNwbGl0KCcsJylbMV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVwbG9hZGVkVXJsID0gYXdhaXQgdGhpcy51cGxvYWRJbWFnZVRvU2VydmVyKGJhc2U2NCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHNpZGUsIHVwbG9hZGVkVXJsIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdXBsb2FkZWRTaWRlcyA9IGF3YWl0IFByb21pc2UuYWxsKHVwbG9hZFByb21pc2VzKTtcbiAgICAgICAgICAgICAgICB1cGxvYWRlZFNpZGVzLmZvckVhY2goKHsgc2lkZSwgdXBsb2FkZWRVcmwgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzaWRlLmltYWdlX3VybCA9IHVwbG9hZGVkVXJsO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0JjQt9C+0LHRgNCw0LbQtdC90LjRjyDQt9Cw0LPRgNGD0LbQtdC90Ysg0L3QsCDRgdC10YDQstC10YAnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0TmFtZSA9IGAke3RoaXMuY2FwaXRhbGl6ZUZpcnN0TGV0dGVyKHRoaXMuZ2V0UHJvZHVjdE5hbWUoKSl9INGBINCy0LDRiNC40LwgJHtPYmplY3Qua2V5cyhleHBvcnRlZEFydCkubGVuZ3RoID09IDEgPyAn0L7QtNC90L7RgdGC0L7RgNC+0L3QvdC40LwnIDogJ9C00LLRg9GF0YHRgtC+0YDQvtC90L3QuNC8J30g0L/RgNC40L3RgtC+0LxgO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxheW91dHMgPSB0aGlzLmxheW91dHMubWFwKGxheW91dCA9PiAoeyAuLi5sYXlvdXQsIHVybDogdW5kZWZpbmVkIH0pKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1c2VySWQgPSBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLmdldFVzZXJJZCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKFwibGF5b3V0c1wiLCBKU09OLnN0cmluZ2lmeShsYXlvdXRzKSk7XG4gICAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKFwidXNlcl9pZFwiLCB1c2VySWQpO1xuICAgICAgICAgICAgICAgIGZvcm1EYXRhLmFwcGVuZChcImFydFwiLCBhcnRpY2xlLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgIGF3YWl0IGZldGNoKEFQSV9FTkRQT0lOVFMuV0VCSE9PS19DQVJULCB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IGZvcm1EYXRhXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY3JlYXRlUHJvZHVjdCh7XG4gICAgICAgICAgICAgICAgICAgIHF1YW50aXR5OiB0aGlzLmdldFF1YW50aXR5KCksXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHByb2R1Y3ROYW1lLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiB0aGlzLl9zZWxlY3RTaXplLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IsXG4gICAgICAgICAgICAgICAgICAgIHNpZGVzLFxuICAgICAgICAgICAgICAgICAgICBwcm9kdWN0VHlwZTogdGhpcy5fc2VsZWN0VHlwZSxcbiAgICAgICAgICAgICAgICAgICAgYXJ0aWNsZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tvcmRlcl0g0JfQsNC60LDQtyDRg9GB0L/QtdGI0L3QviDRgdC+0LfQtNCw0L0nKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEFkZFRvQ2FydEJ1dHRvbkxvYWRpbmcoZmFsc2UsICfinJMg0JTQvtCx0LDQstC70LXQvdC+IScpO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEFkZFRvQ2FydEJ1dHRvbkxvYWRpbmcoZmFsc2UsIG9yaWdpbmFsVGV4dCk7XG4gICAgICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbb3JkZXJdINCe0YjQuNCx0LrQsCDRgdC+0LfQtNCw0L3QuNGPINC30LDQutCw0LfQsDonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgYWxlcnQoJ9Ce0YjQuNCx0LrQsCDQv9GA0Lgg0YHQvtC30LTQsNC90LjQuCDQt9Cw0LrQsNC30LAnKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEFkZFRvQ2FydEJ1dHRvbkxvYWRpbmcoZmFsc2UsIG9yaWdpbmFsVGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pc0FkZGluZ1RvQ2FydCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdINCk0LvQsNCzIGlzQWRkaW5nVG9DYXJ0INGB0LHRgNC+0YjQtdC9Jyk7XG4gICAgICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIHNldEFkZFRvQ2FydEJ1dHRvbkxvYWRpbmcoaXNMb2FkaW5nLCB0ZXh0KSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5pbmplY3RQdWxzZUFuaW1hdGlvbigpO1xuICAgICAgICBjb25zdCBidXR0b24gPSB0aGlzLmVkaXRvckFkZE9yZGVyQnV0dG9uO1xuICAgICAgICBsZXQgYnV0dG9uVGV4dEVsZW1lbnQgPSBidXR0b24ucXVlcnlTZWxlY3RvcignLnRuLWF0b20nKTtcbiAgICAgICAgaWYgKCFidXR0b25UZXh0RWxlbWVudCkge1xuICAgICAgICAgICAgYnV0dG9uVGV4dEVsZW1lbnQgPSBidXR0b24ucXVlcnlTZWxlY3RvcignZGl2LCBzcGFuJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dFRhcmdldCA9IGJ1dHRvblRleHRFbGVtZW50IHx8IGJ1dHRvbjtcbiAgICAgICAgaWYgKGlzTG9hZGluZykge1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMC43JztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAnbm90LWFsbG93ZWQnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgICAgIHRleHRUYXJnZXQudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmFuaW1hdGlvbiA9ICdjYXJ0QnV0dG9uUHVsc2UgMS41cyBlYXNlLWluLW91dCBpbmZpbml0ZSc7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdIFthbmltYXRpb25dINCa0L3QvtC/0LrQsCDQt9Cw0LHQu9C+0LrQuNGA0L7QstCw0L3QsDonLCB0ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmFuaW1hdGlvbiA9ICdub25lJztcbiAgICAgICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgdGV4dFRhcmdldC50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbb3JkZXJdIFthbmltYXRpb25dINCa0L3QvtC/0LrQsCDRgNCw0LfQsdC70L7QutC40YDQvtCy0LDQvdCwOicsIHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGluamVjdFB1bHNlQW5pbWF0aW9uKCkge1xuICAgICAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhcnQtYnV0dG9uLXB1bHNlLWFuaW1hdGlvbicpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgICAgICBzdHlsZS5pZCA9ICdjYXJ0LWJ1dHRvbi1wdWxzZS1hbmltYXRpb24nO1xuICAgICAgICBzdHlsZS50ZXh0Q29udGVudCA9IGBcbiAgICAgICAgICAgIEBrZXlmcmFtZXMgY2FydEJ1dHRvblB1bHNlIHtcbiAgICAgICAgICAgICAgICAwJSwgMTAwJSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMSk7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDAuNztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgNTAlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBzY2FsZSgxLjAyKTtcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMC44NTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIGA7XG4gICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbYW5pbWF0aW9uXSBDU1Mg0LDQvdC40LzQsNGG0LjRjyDQv9GD0LvRjNGB0LDRhtC40Lgg0LTQvtCx0LDQstC70LXQvdCwJyk7XG4gICAgfVxuICAgIHNldEdlbmVyYXRlQnV0dG9uTG9hZGluZyhpc0xvYWRpbmcsIHRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmZvcm1CdXR0b24pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuaW5qZWN0UHVsc2VBbmltYXRpb24oKTtcbiAgICAgICAgY29uc3QgYnV0dG9uID0gdGhpcy5mb3JtQnV0dG9uO1xuICAgICAgICBsZXQgYnV0dG9uVGV4dEVsZW1lbnQgPSBidXR0b24ucXVlcnlTZWxlY3RvcignLnRuLWF0b20nKTtcbiAgICAgICAgaWYgKCFidXR0b25UZXh0RWxlbWVudCkge1xuICAgICAgICAgICAgYnV0dG9uVGV4dEVsZW1lbnQgPSBidXR0b24ucXVlcnlTZWxlY3RvcignZGl2LCBzcGFuJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dFRhcmdldCA9IGJ1dHRvblRleHRFbGVtZW50IHx8IGJ1dHRvbjtcbiAgICAgICAgaWYgKGlzTG9hZGluZykge1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMC43JztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAnbm90LWFsbG93ZWQnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgICAgIHRleHRUYXJnZXQudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmFuaW1hdGlvbiA9ICdjYXJ0QnV0dG9uUHVsc2UgMS41cyBlYXNlLWluLW91dCBpbmZpbml0ZSc7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZ2VuZXJhdGVdIFthbmltYXRpb25dINCa0L3QvtC/0LrQsCDQt9Cw0LHQu9C+0LrQuNGA0L7QstCw0L3QsDonLCB0ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICAgICAgYnV0dG9uLnN0eWxlLmFuaW1hdGlvbiA9ICdub25lJztcbiAgICAgICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgdGV4dFRhcmdldC50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZ2VuZXJhdGVdIFthbmltYXRpb25dINCa0L3QvtC/0LrQsCDRgNCw0LfQsdC70L7QutC40YDQvtCy0LDQvdCwOicsIHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGluaXRVcGxvYWRJbWFnZUJ1dHRvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvclVwbG9hZEltYWdlQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnJlc2V0VXNlclVwbG9hZEltYWdlKCk7XG4gICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkSW1hZ2VCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmVkaXRvclVwbG9hZEltYWdlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGxvYWRVc2VySW1hZ2UoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGluaXRGaXhRdWFudGl0eUZvcm0oKSB7XG4gICAgICAgIGlmICghdGhpcy5xdWFudGl0eUZvcm1CbG9jaylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZm9ybSA9IHRoaXMucXVhbnRpdHlGb3JtQmxvY2sucXVlcnlTZWxlY3RvcignZm9ybScpO1xuICAgICAgICBjb25zdCBpbnB1dCA9IGZvcm0/LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJxdWFudGl0eVwiXScpO1xuICAgICAgICBpZiAoIWlucHV0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB2YWxpZGF0ZVF1YW50aXR5ID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBpbnB1dC52YWx1ZS50cmltKCk7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09ICcnIHx8IGlzTmFOKE51bWJlcih2YWx1ZSkpKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQudmFsdWUgPSAnMSc7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcXVhbnRpdHkgPSBwYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgICAgaWYgKHF1YW50aXR5IDwgMSB8fCBxdWFudGl0eSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlucHV0LnZhbHVlID0gJzEnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIHZhbGlkYXRlUXVhbnRpdHkpO1xuICAgICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgdmFsaWRhdGVRdWFudGl0eSk7XG4gICAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHZhbGlkYXRlUXVhbnRpdHkpO1xuICAgICAgICB2YWxpZGF0ZVF1YW50aXR5KCk7XG4gICAgfVxuICAgIGFzeW5jIGluaXRGb3JtKCkge1xuICAgICAgICBpZiAoIXRoaXMuZm9ybUJsb2NrIHx8ICF0aGlzLmZvcm1CdXR0b24gfHwgIXRoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBmb3JtQmxvY2sgPSB0aGlzLmZvcm1CbG9jaztcbiAgICAgICAgY29uc3QgZm9ybUlucHV0VmFyaWFibGVOYW1lID0gdGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWU7XG4gICAgICAgIGNvbnN0IGZvcm1CdXR0b24gPSB0aGlzLmZvcm1CdXR0b247XG4gICAgICAgIGNvbnN0IGhhbmRsZUNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2Zvcm1dIFtidXR0b25dIGNsaWNrZWQnKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzR2VuZXJhdGluZykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW2Zvcm1dINCT0LXQvdC10YDQsNGG0LjRjyDRg9C20LUg0LjQtNC10YIsINC40LPQvdC+0YDQuNGA0YPQtdC8INC/0L7QstGC0L7RgNC90L7QtSDQvdCw0LbQsNGC0LjQtScpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGZvcm1JbnB1dCA9IGZvcm1CbG9jay5xdWVyeVNlbGVjdG9yKGBbbmFtZT1cIiR7Zm9ybUlucHV0VmFyaWFibGVOYW1lfVwiXWApO1xuICAgICAgICAgICAgY29uc3QgcHJvbXB0ID0gZm9ybUlucHV0LnZhbHVlO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmxvYWRlZFVzZXJJbWFnZSkge1xuICAgICAgICAgICAgICAgIGlmICghcHJvbXB0IHx8IHByb21wdC50cmltKCkgPT09IFwiXCIgfHwgcHJvbXB0Lmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZm9ybV0gW2lucHV0XSBwcm9tcHQgaXMgZW1wdHkgb3IgdG9vIHNob3J0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwi0JzQuNC90LjQvNCw0LvRjNC90LDRjyDQtNC70LjQvdCwINC30LDQv9GA0L7RgdCwIDEg0YHQuNC80LLQvtC7XCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtpbnB1dF0gcHJvbXB0OiAke3Byb21wdH1gKTtcbiAgICAgICAgICAgIHRoaXMuaXNHZW5lcmF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc2V0R2VuZXJhdGVCdXR0b25Mb2FkaW5nKHRydWUsICfQk9C10L3QtdGA0LDRhtC40Y8uLi4nKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIHRydWUpO1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0SWQgPSB0aGlzLl9zZWxlY3RMYXlvdXQgfHwgTGF5b3V0LmdlbmVyYXRlSWQoKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXJsID0gYXdhaXQgZ2VuZXJhdGVJbWFnZSh7XG4gICAgICAgICAgICAgICAgICAgIHByb21wdCxcbiAgICAgICAgICAgICAgICAgICAgc2hpcnRDb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2U6IHRoaXMuX3NlbGVjdExheW91dCA/IHRoaXMubG9hZGVkVXNlckltYWdlICE9PSB0aGlzLmxheW91dHMuZmluZChsYXlvdXQgPT4gbGF5b3V0LmlkID09PSB0aGlzLl9zZWxlY3RMYXlvdXQpPy51cmwgPyB0aGlzLmxvYWRlZFVzZXJJbWFnZSA6IG51bGwgOiB0aGlzLmxvYWRlZFVzZXJJbWFnZSxcbiAgICAgICAgICAgICAgICAgICAgd2l0aEFpOiB0aGlzLmVkaXRvckxvYWRXaXRoQWksXG4gICAgICAgICAgICAgICAgICAgIGxheW91dElkLFxuICAgICAgICAgICAgICAgICAgICBpc05ldzogdGhpcy5fc2VsZWN0TGF5b3V0ID8gZmFsc2UgOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFZGl0b3JFdmVudFR5cGUuTU9DS1VQX0xPQURJTkcsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbWFnZURhdGEgPSBhd2FpdCB0aGlzLmdldEltYWdlRGF0YSh1cmwpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtmb3JtXSBbaW5wdXRdIGltYWdlIGRhdGEgcmVjZWl2ZWRgKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc2VsZWN0TGF5b3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0cy5maW5kKGxheW91dCA9PiBsYXlvdXQuaWQgPT09IGxheW91dElkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxheW91dCAmJiBsYXlvdXQuaXNJbWFnZUxheW91dCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbZm9ybV0gW2lucHV0XSB1cGRhdGluZyBsYXlvdXQ6ICR7bGF5b3V0LmlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGF5b3V0Lm5hbWUgPSBwcm9tcHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXlvdXQudXJsID0gaW1hZ2VEYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2Zvcm1dIFtpbnB1dF0gbGF5b3V0IHVwZGF0ZWRgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRMYXlvdXQoTGF5b3V0LmNyZWF0ZUltYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBsYXlvdXRJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXc6IHRoaXMuX3NlbGVjdFNpZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGltYWdlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHByb21wdFxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC52YWx1ZSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgZm9ybUlucHV0LnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdExheW91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9hZGVkVXNlckltYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzZXRVc2VyVXBsb2FkSW1hZ2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0R2VuZXJhdGVCdXR0b25Mb2FkaW5nKGZhbHNlLCAn4pyTINCT0L7RgtC+0LLQviEnKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRHZW5lcmF0ZUJ1dHRvbkxvYWRpbmcoZmFsc2UsICfQodCz0LXQvdC10YDQuNGA0L7QstCw0YLRjCcpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzR2VuZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbZm9ybV0g0KTQu9Cw0LMgaXNHZW5lcmF0aW5nINGB0LHRgNC+0YjQtdC9Jyk7XG4gICAgICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoRWRpdG9yRXZlbnRUeXBlLk1PQ0tVUF9MT0FESU5HLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2Zvcm1dIFtpbnB1dF0gZXJyb3InLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgYWxlcnQoXCLQntGI0LjQsdC60LAg0L/RgNC4INCz0LXQvdC10YDQsNGG0LjQuCDQuNC30L7QsdGA0LDQttC10L3QuNGPXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0R2VuZXJhdGVCdXR0b25Mb2FkaW5nKGZhbHNlLCAn0KHQs9C10L3QtdGA0LjRgNC+0LLQsNGC0YwnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzR2VuZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxvYWRlZFVzZXJJbWFnZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc2V0VXNlclVwbG9hZEltYWdlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zZWxlY3RMYXlvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0TGF5b3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW5jZWxFZGl0TGF5b3V0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBmb3JtID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm0gPSBmb3JtQmxvY2sucXVlcnlTZWxlY3RvcihcImZvcm1cIik7XG4gICAgICAgICAgICAgICAgaWYgKGZvcm0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZm9ybSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICB9LCAxMDAwICogMTApO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFmb3JtKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmb3JtXSBmb3JtIG5vdCBmb3VuZCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZvcm0uYWN0aW9uID0gXCJcIjtcbiAgICAgICAgZm9ybS5tZXRob2QgPSBcIkdFVFwiO1xuICAgICAgICBmb3JtLm9uc3VibWl0ID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgaGFuZGxlQ2xpY2soKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgZml4SW5wdXRCbG9jayA9IGZvcm0ucXVlcnlTZWxlY3RvcihgdGV4dGFyZWFbbmFtZT0nJHtmb3JtSW5wdXRWYXJpYWJsZU5hbWV9J11gKTtcbiAgICAgICAgaWYgKGZpeElucHV0QmxvY2spIHtcbiAgICAgICAgICAgIGZpeElucHV0QmxvY2suc3R5bGUucGFkZGluZyA9IFwiOHB4XCI7XG4gICAgICAgIH1cbiAgICAgICAgZm9ybUJ1dHRvbi5vbmNsaWNrID0gaGFuZGxlQ2xpY2s7XG4gICAgICAgIGZvcm1CdXR0b24uc3R5bGUuY3Vyc29yID0gXCJwb2ludGVyXCI7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tmb3JtXSDQmNC90LjRhtC40LDQu9C40LfQsNGG0LjRjyDRhNC+0YDQvNGLINC30LDQstC10YDRiNC10L3QsCcpO1xuICAgIH1cbiAgICByZXN0b3JlSWNvbkZyb21EYXRhT3JpZ2luYWwoZWxlbWVudCkge1xuICAgICAgICBpZiAoIWVsZW1lbnQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGRhdGFPcmlnaW5hbCA9IGVsZW1lbnQuYXR0cmlidXRlcy5nZXROYW1lZEl0ZW0oXCJkYXRhLW9yaWdpbmFsXCIpPy52YWx1ZTtcbiAgICAgICAgaWYgKGRhdGFPcmlnaW5hbCkge1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBgdXJsKFwiJHtkYXRhT3JpZ2luYWx9XCIpYDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjaGFuZ2VQcm9kdWN0KHByb2R1Y3RUeXBlKSB7XG4gICAgICAgIHRoaXMuX3NlbGVjdFR5cGUgPSBwcm9kdWN0VHlwZTtcbiAgICAgICAgdGhpcy5jbGVhck1vY2t1cENhY2hlKCk7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUocHJvZHVjdFR5cGUpO1xuICAgICAgICBpZiAocHJvZHVjdCkge1xuICAgICAgICAgICAgY29uc3QgbW9ja3VwV2l0aEN1cnJlbnRDb2xvciA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG0gPT4gbS5zaWRlID09PSB0aGlzLl9zZWxlY3RTaWRlICYmIG0uY29sb3IubmFtZSA9PT0gdGhpcy5fc2VsZWN0Q29sb3IubmFtZSk7XG4gICAgICAgICAgICBpZiAoIW1vY2t1cFdpdGhDdXJyZW50Q29sb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaXJzdE1vY2t1cCA9IHByb2R1Y3QubW9ja3Vwcy5maW5kKG0gPT4gbS5zaWRlID09PSB0aGlzLl9zZWxlY3RTaWRlKTtcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3RNb2NrdXApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0Q29sb3IgPSBmaXJzdE1vY2t1cC5jb2xvcjtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3Byb2R1Y3RdINCm0LLQtdGCINC40LfQvNC10L3QtdC9INC90LAgJHt0aGlzLl9zZWxlY3RDb2xvci5uYW1lfSDQtNC70Y8g0L/RgNC+0LTRg9C60YLQsCAke3Byb2R1Y3RUeXBlfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVwZGF0ZVByb2R1Y3RCbG9ja3NVSSgpO1xuICAgICAgICB0aGlzLnVwZGF0ZU1vY2t1cCgpO1xuICAgICAgICB0aGlzLmxvYWRQcm9kdWN0KCk7XG4gICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzKCk7XG4gICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgfVxuICAgIHVwZGF0ZVByb2R1Y3RCbG9ja3NVSSgpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvZHVjdEJsb2Nrcy5sZW5ndGggPT09IDApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMucHJvZHVjdEJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgIGJsb2NrLnN0eWxlLmJhY2tncm91bmQgPSAncmdiKDIyMiAyMjIgMjIyKSc7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBhY3RpdmVCbG9jayA9IHRoaXMucHJvZHVjdEJsb2Nrcy5maW5kKGJsb2NrID0+IGJsb2NrLmNsYXNzTGlzdC5jb250YWlucygnZWRpdG9yLXNldHRpbmdzX19wcm9kdWN0LWJsb2NrX18nICsgdGhpcy5fc2VsZWN0VHlwZSkpO1xuICAgICAgICBpZiAoYWN0aXZlQmxvY2spIHtcbiAgICAgICAgICAgIGFjdGl2ZUJsb2NrLnN0eWxlLmJhY2tncm91bmQgPSAnJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjaGFuZ2VTaWRlKCkge1xuICAgICAgICBjb25zdCBuZXdTaWRlID0gdGhpcy5fc2VsZWN0U2lkZSA9PT0gJ2Zyb250JyA/ICdiYWNrJyA6ICdmcm9udCc7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlU2lkZShuZXdTaWRlKTtcbiAgICAgICAgdGhpcy51cGRhdGVNb2NrdXAoKTtcbiAgICAgICAgdGhpcy5zaG93TGF5b3V0TGlzdCgpO1xuICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5TVEFURV9DSEFOR0VELCB1bmRlZmluZWQpO1xuICAgIH1cbiAgICBjaGFuZ2VDb2xvcihjb2xvck5hbWUpIHtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBtb2NrdXAgPSBwcm9kdWN0Lm1vY2t1cHMuZmluZChtID0+IG0uY29sb3IubmFtZSA9PT0gY29sb3JOYW1lKTtcbiAgICAgICAgaWYgKCFtb2NrdXApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuX3NlbGVjdENvbG9yID0gbW9ja3VwLmNvbG9yO1xuICAgICAgICB0aGlzLmNsZWFyTW9ja3VwQ2FjaGUoKTtcbiAgICAgICAgdGhpcy51cGRhdGVDb2xvckJsb2Nrc1VJKGNvbG9yTmFtZSk7XG4gICAgICAgIHRoaXMudXBkYXRlTW9ja3VwKCk7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgfVxuICAgIHVwZGF0ZUNvbG9yQmxvY2tzVUkoY29sb3JOYW1lKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbG9yQmxvY2tzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5jb2xvckJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgICAgIGJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLmNvbG9yQmxvY2tzLmZpbmQoYmxvY2sgPT4gYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0b3Itc2V0dGluZ3NfX2NvbG9yLWJsb2NrX18nICsgY29sb3JOYW1lKSk7XG4gICAgICAgIGlmIChhY3RpdmVCbG9jaykge1xuICAgICAgICAgICAgYWN0aXZlQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjaGFuZ2VTaXplKHNpemUpIHtcbiAgICAgICAgdGhpcy51cGRhdGVTaXplQmxvY2tzVUkoc2l6ZSk7XG4gICAgICAgIHRoaXMuX3NlbGVjdFNpemUgPSBzaXplO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgIH1cbiAgICB1cGRhdGVTaXplQmxvY2tzVUkoc2l6ZSkge1xuICAgICAgICBpZiAodGhpcy5zaXplQmxvY2tzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5zaXplQmxvY2tzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICAgICAgY29uc3QgYm9yZGVyQmxvY2sgPSBibG9jay5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGlmIChib3JkZXJCbG9jaykge1xuICAgICAgICAgICAgICAgIGJvcmRlckJsb2NrLnN0eWxlLmJvcmRlckNvbG9yID0gJyNmM2YzZjMnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYWN0aXZlQmxvY2sgPSB0aGlzLnNpemVCbG9ja3MuZmluZChibG9jayA9PiBibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRvci1zZXR0aW5nc19fc2l6ZS1ibG9ja19fJyArIHNpemUpKTtcbiAgICAgICAgaWYgKGFjdGl2ZUJsb2NrKSB7XG4gICAgICAgICAgICBjb25zdCBib3JkZXJCbG9jayA9IGFjdGl2ZUJsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgaWYgKGJvcmRlckJsb2NrKSB7XG4gICAgICAgICAgICAgICAgYm9yZGVyQmxvY2suc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBlZGl0TGF5b3V0KGxheW91dCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSBlZGl0IGxheW91dCAke2xheW91dC5pZH1gKTtcbiAgICAgICAgdGhpcy5fc2VsZWN0TGF5b3V0ID0gbGF5b3V0LmlkO1xuICAgICAgICBpZiAodGhpcy5mb3JtQmxvY2sgJiYgdGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGZvcm1JbnB1dCA9IHRoaXMuZm9ybUJsb2NrLnF1ZXJ5U2VsZWN0b3IoYFtuYW1lPVwiJHt0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZX1cIl1gKTtcbiAgICAgICAgICAgIGlmIChmb3JtSW5wdXQpIHtcbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQudmFsdWUgPSBsYXlvdXQubmFtZSB8fCAnJztcbiAgICAgICAgICAgICAgICBmb3JtSW5wdXQuc3R5bGUuYm9yZGVyQ29sb3IgPSAncmdiKDI1NCwgOTQsIDU4KSc7XG4gICAgICAgICAgICAgICAgZm9ybUlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBbbGF5b3V0c10g0KPRgdGC0LDQvdC+0LLQu9C10L3QviDQt9C90LDRh9C10L3QuNC1INCyINGE0L7RgNC80YM6IFwiJHtsYXlvdXQubmFtZX1cImApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbc2V0dGluZ3NdIFtsYXlvdXRzXSDQndC1INC90LDQudC00LXQvSDRjdC70LXQvNC10L3RgiDRhNC+0YDQvNGLINGBINC40LzQtdC90LXQvCBcIiR7dGhpcy5mb3JtSW5wdXRWYXJpYWJsZU5hbWV9XCJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSkge1xuICAgICAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBsYXlvdXQudXJsO1xuICAgICAgICAgICAgdGhpcy5zZXRVc2VyVXBsb2FkSW1hZ2UobGF5b3V0LnVybCk7XG4gICAgICAgICAgICB0aGlzLmluaXRBaUJ1dHRvbnMoKTtcbiAgICAgICAgICAgIHRoaXMuaGlkZUFpQnV0dG9ucygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5yZXNldFVzZXJVcGxvYWRJbWFnZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICB9XG4gICAgY2FuY2VsRWRpdExheW91dCgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBbbGF5b3V0c10gY2FuY2VsIGVkaXQgbGF5b3V0YCk7XG4gICAgICAgIHRoaXMuX3NlbGVjdExheW91dCA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLmZvcm1CbG9jayAmJiB0aGlzLmZvcm1JbnB1dFZhcmlhYmxlTmFtZSkge1xuICAgICAgICAgICAgY29uc3QgZm9ybUlucHV0ID0gdGhpcy5mb3JtQmxvY2sucXVlcnlTZWxlY3RvcihgW25hbWU9XCIke3RoaXMuZm9ybUlucHV0VmFyaWFibGVOYW1lfVwiXWApO1xuICAgICAgICAgICAgaWYgKGZvcm1JbnB1dCkge1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC52YWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgIGZvcm1JbnB1dC5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjNmM2YzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxvYWRlZFVzZXJJbWFnZSA9IG51bGw7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlc2V0VXNlclVwbG9hZEltYWdlKCk7XG4gICAgICAgIHRoaXMuc2hvd0xheW91dExpc3QoKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3NldHRpbmdzXSBbbGF5b3V0c10g0KDQtdC00LDQutGC0LjRgNC+0LLQsNC90LjQtSDQvtGC0LzQtdC90LXQvdC+YCk7XG4gICAgfVxuICAgIGluaXRBaUJ1dHRvbnMoKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNoYW5nZUxvYWRXaXRoQWkoKTtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAndGFibGUnO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlTG9hZFdpdGhBaSh0cnVlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAndGFibGUnO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhvdXRBaUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlTG9hZFdpdGhBaShmYWxzZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIGhpZGVBaUJ1dHRvbnMoKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yTG9hZFdpdGhBaSA9IHRydWU7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24pIHtcbiAgICAgICAgICAgICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24ucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudCkuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBzaG93QWlCdXR0b25zKCkge1xuICAgICAgICBpZiAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uKSB7XG4gICAgICAgICAgICAodGhpcy5lZGl0b3JMb2FkV2l0aEFpQnV0dG9uLnBhcmVudEVsZW1lbnQ/LnBhcmVudEVsZW1lbnQ/LnBhcmVudEVsZW1lbnQpLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBsb2FkVXNlckltYWdlKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkIHVzZXIgaW1hZ2VdIHN0YXJ0aW5nIHVzZXIgaW1hZ2UgdXBsb2FkJyk7XG4gICAgICAgIHRoaXMuaW5pdEFpQnV0dG9ucygpO1xuICAgICAgICB0aGlzLnNob3dBaUJ1dHRvbnMoKTtcbiAgICAgICAgY29uc3QgZmlsZUlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgZmlsZUlucHV0LnR5cGUgPSAnZmlsZSc7XG4gICAgICAgIGZpbGVJbnB1dC5hY2NlcHQgPSAnaW1hZ2UvKic7XG4gICAgICAgIGZpbGVJbnB1dC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBmaWxlSW5wdXQub25jaGFuZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSB0YXJnZXQuZmlsZXM/LlswXTtcbiAgICAgICAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZCB1c2VyIGltYWdlXSBmaWxlIHNlbGVjdGVkOicsIGZpbGUubmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlLnR5cGUuc3RhcnRzV2l0aCgnaW1hZ2UvJykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbdXBsb2FkIHVzZXIgaW1hZ2VdIHNlbGVjdGVkIGZpbGUgaXMgbm90IGFuIGltYWdlJyk7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCfQn9C+0LbQsNC70YPQudGB0YLQsCwg0LLRi9Cx0LXRgNC40YLQtSDRhNCw0LnQuyDQuNC30L7QsdGA0LDQttC10L3QuNGPJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgICAgICByZWFkZXIub25sb2FkID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VVcmwgPSBlLnRhcmdldD8ucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkIHVzZXIgaW1hZ2VdIGZpbGUgbG9hZGVkIGFzIGRhdGEgVVJMJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlRGF0YSA9IGF3YWl0IHRoaXMuZ2V0SW1hZ2VEYXRhKGltYWdlVXJsKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRVc2VyVXBsb2FkSW1hZ2UoaW1hZ2VEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZCB1c2VyIGltYWdlXSBpbWFnZSBsYXlvdXQgYWRkZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZWFkZXIub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3VwbG9hZCB1c2VyIGltYWdlXSBlcnJvciByZWFkaW5nIGZpbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ9Ce0YjQuNCx0LrQsCDQv9GA0Lgg0LfQsNCz0YDRg9C30LrQtSDRhNCw0LnQu9CwJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChmaWxlSW5wdXQpO1xuICAgICAgICBmaWxlSW5wdXQuY2xpY2soKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChmaWxlSW5wdXQpO1xuICAgIH1cbiAgICBzZXRVc2VyVXBsb2FkSW1hZ2UoaW1hZ2UpIHtcbiAgICAgICAgdGhpcy5sb2FkZWRVc2VySW1hZ2UgPSBpbWFnZTtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yVXBsb2FkVmlld0Jsb2NrKSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvclVwbG9hZFZpZXdCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlJztcbiAgICAgICAgICAgIGNvbnN0IGltYWdlQmxvY2sgPSBnZXRMYXN0Q2hpbGQodGhpcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2spO1xuICAgICAgICAgICAgaWYgKGltYWdlQmxvY2spIHtcbiAgICAgICAgICAgICAgICBpbWFnZUJsb2NrLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IGB1cmwoJHtpbWFnZX0pYDtcbiAgICAgICAgICAgICAgICBpbWFnZUJsb2NrLnN0eWxlLmJhY2tncm91bmRTaXplID0gJ2NvbnRhaW4nO1xuICAgICAgICAgICAgICAgIGltYWdlQmxvY2suc3R5bGUuYmFja2dyb3VuZFBvc2l0aW9uID0gJ2NlbnRlcic7XG4gICAgICAgICAgICAgICAgaW1hZ2VCbG9jay5zdHlsZS5iYWNrZ3JvdW5kUmVwZWF0ID0gJ25vLXJlcGVhdCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmVzZXRVc2VyVXBsb2FkSW1hZ2UoKSB7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvclVwbG9hZFZpZXdCbG9jaykge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3JVcGxvYWRWaWV3QmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JVcGxvYWRDYW5jZWxCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yVXBsb2FkQ2FuY2VsQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3VwbG9hZCBpbWFnZSBidXR0b25dIGNhbmNlbCBidXR0b24gY2xpY2tlZCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2FuY2VsRWRpdExheW91dCgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjaGFuZ2VMb2FkV2l0aEFpKHZhbHVlID0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5lZGl0b3JMb2FkV2l0aEFpID0gdmFsdWU7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b24gJiYgdGhpcy5lZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uKSB7XG4gICAgICAgICAgICBjb25zdCBidXR0b25XaXRoQWkgPSB0aGlzLmVkaXRvckxvYWRXaXRoQWlCdXR0b247XG4gICAgICAgICAgICBjb25zdCBidXR0b25XaXRob3V0QWkgPSB0aGlzLmVkaXRvckxvYWRXaXRob3V0QWlCdXR0b247XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaXhCdXR0b25XaXRoQWkgPSBnZXRMYXN0Q2hpbGQoYnV0dG9uV2l0aEFpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaXhCdXR0b25XaXRob3V0QWkgPSBnZXRMYXN0Q2hpbGQoYnV0dG9uV2l0aG91dEFpKTtcbiAgICAgICAgICAgICAgICBpZiAoZml4QnV0dG9uV2l0aEFpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpeEJ1dHRvbldpdGhBaS5zdHlsZS5ib3JkZXJDb2xvciA9ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZml4QnV0dG9uV2l0aG91dEFpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpeEJ1dHRvbldpdGhvdXRBaS5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjJmMmYyJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaXhCdXR0b25XaXRoQWkgPSBnZXRMYXN0Q2hpbGQoYnV0dG9uV2l0aEFpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaXhCdXR0b25XaXRob3V0QWkgPSBnZXRMYXN0Q2hpbGQoYnV0dG9uV2l0aG91dEFpKTtcbiAgICAgICAgICAgICAgICBpZiAoZml4QnV0dG9uV2l0aEFpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpeEJ1dHRvbldpdGhBaS5zdHlsZS5ib3JkZXJDb2xvciA9ICcjZjJmMmYyJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZpeEJ1dHRvbldpdGhvdXRBaSkge1xuICAgICAgICAgICAgICAgICAgICBmaXhCdXR0b25XaXRob3V0QWkuc3R5bGUuYm9yZGVyQ29sb3IgPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgbG9hZEltYWdlKHNyYykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgICAgICBpbWcuY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcbiAgICAgICAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiByZXNvbHZlKGltZyk7XG4gICAgICAgICAgICBpbWcub25lcnJvciA9IHJlamVjdDtcbiAgICAgICAgICAgIGltZy5zcmMgPSBzcmM7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXRRdWFudGl0eSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnF1YW50aXR5Rm9ybUJsb2NrKVxuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIGNvbnN0IGZvcm0gPSB0aGlzLnF1YW50aXR5Rm9ybUJsb2NrLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcbiAgICAgICAgY29uc3QgaW5wdXQgPSBmb3JtPy5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwicXVhbnRpdHlcIl0nKTtcbiAgICAgICAgaWYgKCFpbnB1dClcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoaW5wdXQudmFsdWUpIHx8IDE7XG4gICAgfVxuICAgIGdldFN1bSgpIHtcbiAgICAgICAgY29uc3QgaGFzRnJvbnQgPSB0aGlzLmxheW91dHMuc29tZShsYXlvdXQgPT4gbGF5b3V0LnZpZXcgPT09ICdmcm9udCcpO1xuICAgICAgICBjb25zdCBoYXNCYWNrID0gdGhpcy5sYXlvdXRzLnNvbWUobGF5b3V0ID0+IGxheW91dC52aWV3ID09PSAnYmFjaycpO1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gdGhpcy5nZXRQcm9kdWN0QnlUeXBlKHRoaXMuX3NlbGVjdFR5cGUpO1xuICAgICAgICBpZiAoIXByb2R1Y3QpXG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgY29uc3QgcHJpY2UgPSBoYXNCYWNrICYmIGhhc0Zyb250XG4gICAgICAgICAgICA/IHByb2R1Y3QuZG91YmxlU2lkZWRQcmljZVxuICAgICAgICAgICAgOiBwcm9kdWN0LnByaWNlO1xuICAgICAgICByZXR1cm4gcHJpY2U7XG4gICAgfVxuICAgIHVwZGF0ZVN1bSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvclN1bUJsb2NrKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBzdW0gPSB0aGlzLmdldFN1bSgpO1xuICAgICAgICBjb25zdCBzdW1UZXh0ID0gZ2V0TGFzdENoaWxkKHRoaXMuZWRpdG9yU3VtQmxvY2spO1xuICAgICAgICBpZiAoc3VtVGV4dCkge1xuICAgICAgICAgICAgc3VtVGV4dC5pbm5lclRleHQgPSBzdW0udG9TdHJpbmcoKSArICcg4oK9JztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbikge1xuICAgICAgICAgICAgY29uc3QgYnV0dG9uQmxvY2sgPSBnZXRMYXN0Q2hpbGQodGhpcy5lZGl0b3JBZGRPcmRlckJ1dHRvbik7XG4gICAgICAgICAgICBpZiAoYnV0dG9uQmxvY2spIHtcbiAgICAgICAgICAgICAgICBidXR0b25CbG9jay5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBzdW0gPT09IDAgPyAncmdiKDEyMSAxMjEgMTIxKScgOiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBsb2FkUHJvZHVjdCgpIHtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHRoaXMuZ2V0UHJvZHVjdEJ5VHlwZSh0aGlzLl9zZWxlY3RUeXBlKTtcbiAgICAgICAgaWYgKCFwcm9kdWN0IHx8ICFwcm9kdWN0LnByaW50Q29uZmlnKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1twcm9kdWN0XSBwcm9kdWN0IG9yIHByaW50Q29uZmlnIG5vdCBmb3VuZCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xlYXJBbGxDYW52YXMoKTtcbiAgICAgICAgZm9yIChjb25zdCBwcmludENvbmZpZyBvZiBwcm9kdWN0LnByaW50Q29uZmlnKSB7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNhbnZhc0ZvclNpZGUocHJpbnRDb25maWcpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlU2lkZSh0aGlzLl9zZWxlY3RTaWRlKTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVkaXRvckV2ZW50VHlwZS5NT0NLVVBfTE9BRElORywgZmFsc2UpO1xuICAgICAgICB9LCAxMDApO1xuICAgIH1cbiAgICBjbGVhckFsbENhbnZhcygpIHtcbiAgICAgICAgaWYgKHRoaXMuY2FudmFzZXNDb250YWluZXIpIHtcbiAgICAgICAgICAgIHRoaXMuY2FudmFzZXNDb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jYW52YXNlcy5mb3JFYWNoKGNhbnZhcyA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNhbnZhcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NhbnZhc10g0J7RiNC40LHQutCwINC+0YfQuNGB0YLQutC4IGNhbnZhczonLCBlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jYW52YXNlcyA9IFtdO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzID0gW107XG4gICAgICAgIHRoaXMuYWN0aXZlQ2FudmFzID0gbnVsbDtcbiAgICB9XG4gICAgY3JlYXRlQ2FudmFzRm9yU2lkZShwcmludENvbmZpZykge1xuICAgICAgICBpZiAoIXRoaXMuY2FudmFzZXNDb250YWluZXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tjYW52YXNdIGNhbnZhc2VzQ29udGFpbmVyINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC9Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGF5ZXJzQ2FudmFzQmxvY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgbGF5ZXJzQ2FudmFzQmxvY2suaWQgPSAnbGF5ZXJzLS0nICsgcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgbGF5ZXJzQ2FudmFzQmxvY2suY2xhc3NMaXN0LmFkZCgnZWRpdG9yLXBvc2l0aW9uJyk7XG4gICAgICAgIGxheWVyc0NhbnZhc0Jsb2NrLnNldEF0dHJpYnV0ZSgncmVmJywgcHJpbnRDb25maWcuc2lkZSk7XG4gICAgICAgIGxheWVyc0NhbnZhc0Jsb2NrLnN0eWxlLnpJbmRleCA9ICc3JztcbiAgICAgICAgdGhpcy5jYW52YXNlc0NvbnRhaW5lci5hcHBlbmRDaGlsZChsYXllcnNDYW52YXNCbG9jayk7XG4gICAgICAgIGNvbnN0IGxheWVyc0NhbnZhcyA9IG5ldyBmYWJyaWMuU3RhdGljQ2FudmFzKGxheWVyc0NhbnZhc0Jsb2NrLCB7XG4gICAgICAgICAgICB3aWR0aDogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQsXG4gICAgICAgIH0pO1xuICAgICAgICBsYXllcnNDYW52YXMuc2lkZSA9IHByaW50Q29uZmlnLnNpZGU7XG4gICAgICAgIGxheWVyc0NhbnZhcy5uYW1lID0gJ3N0YXRpYy0nICsgcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgY29uc3QgZWRpdGFibGVDYW52YXNCbG9jayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBlZGl0YWJsZUNhbnZhc0Jsb2NrLmlkID0gJ2VkaXRhYmxlLS0nICsgcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgZWRpdGFibGVDYW52YXNCbG9jay5zZXRBdHRyaWJ1dGUoJ3JlZicsIHByaW50Q29uZmlnLnNpZGUpO1xuICAgICAgICBlZGl0YWJsZUNhbnZhc0Jsb2NrLmNsYXNzTGlzdC5hZGQoJ2VkaXRvci1wb3NpdGlvbicpO1xuICAgICAgICBlZGl0YWJsZUNhbnZhc0Jsb2NrLnN0eWxlLnpJbmRleCA9ICc5JztcbiAgICAgICAgdGhpcy5jYW52YXNlc0NvbnRhaW5lci5hcHBlbmRDaGlsZChlZGl0YWJsZUNhbnZhc0Jsb2NrKTtcbiAgICAgICAgY29uc3QgZWRpdGFibGVDYW52YXMgPSBuZXcgZmFicmljLkNhbnZhcyhlZGl0YWJsZUNhbnZhc0Jsb2NrLCB7XG4gICAgICAgICAgICBjb250cm9sc0Fib3ZlT3ZlcmxheTogdHJ1ZSxcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudEhlaWdodCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgIHVuaWZvcm1TY2FsaW5nOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBlZGl0YWJsZUNhbnZhcy5zaWRlID0gcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgZWRpdGFibGVDYW52YXMubmFtZSA9ICdlZGl0YWJsZS0nICsgcHJpbnRDb25maWcuc2lkZTtcbiAgICAgICAgdGhpcy5sYXllcnNDYW52YXNlcy5wdXNoKGxheWVyc0NhbnZhcyk7XG4gICAgICAgIHRoaXMuY2FudmFzZXMucHVzaChlZGl0YWJsZUNhbnZhcyk7XG4gICAgICAgIGlmICh0aGlzLmNhbnZhc2VzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVDYW52YXMgPSBlZGl0YWJsZUNhbnZhcztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluaXRNYWluQ2FudmFzKGVkaXRhYmxlQ2FudmFzLCBwcmludENvbmZpZyk7XG4gICAgfVxuICAgIGluaXRNYWluQ2FudmFzKGNhbnZhcywgcHJpbnRDb25maWcpIHtcbiAgICAgICAgaWYgKCFjYW52YXMgfHwgIShjYW52YXMgaW5zdGFuY2VvZiBmYWJyaWMuQ2FudmFzKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbY2FudmFzXSBjYW52YXMg0L3QtSDQstCw0LvQuNC00LXQvScpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHdpZHRoID0gcHJpbnRDb25maWcuc2l6ZS53aWR0aCAvIDYwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGg7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IHByaW50Q29uZmlnLnNpemUuaGVpZ2h0IC8gNjAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQ7XG4gICAgICAgIGNvbnN0IGxlZnQgPSAodGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCAtIHdpZHRoKSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueCAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgpO1xuICAgICAgICBjb25zdCB0b3AgPSAodGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQgLSBoZWlnaHQpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi55IC8gMTAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQpO1xuICAgICAgICBjb25zdCBjbGlwQXJlYSA9IG5ldyBmYWJyaWMuUmVjdCh7XG4gICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodCxcbiAgICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgICB0b3AsXG4gICAgICAgICAgICBmaWxsOiAncmdiKDI1NSwgMCwgMCknLFxuICAgICAgICAgICAgbmFtZTogJ2FyZWE6Y2xpcCcsXG4gICAgICAgICAgICBldmVudGVkOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGFyZWFCb3JkZXIgPSBuZXcgZmFicmljLlJlY3Qoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoIC0gMyxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0IC0gMyxcbiAgICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgICB0b3AsXG4gICAgICAgICAgICBmaWxsOiAncmdiYSgwLDAsMCwwKScsXG4gICAgICAgICAgICBzdHJva2VXaWR0aDogMyxcbiAgICAgICAgICAgIHN0cm9rZTogJ3JnYigyNTQsIDk0LCA1OCknLFxuICAgICAgICAgICAgbmFtZTogJ2FyZWE6Ym9yZGVyJyxcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuMyxcbiAgICAgICAgICAgIGV2ZW50ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgc2VsZWN0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICBoYXNDb250cm9sczogZmFsc2UsXG4gICAgICAgICAgICBzdHJva2VEYXNoQXJyYXk6IFs1LCA1XSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNhbnZhcy5hZGQoYXJlYUJvcmRlcik7XG4gICAgICAgIGNhbnZhcy5jbGlwUGF0aCA9IGNsaXBBcmVhO1xuICAgICAgICB0aGlzLnNldHVwQ2FudmFzRXZlbnRIYW5kbGVycyhjYW52YXMsIHByaW50Q29uZmlnKTtcbiAgICB9XG4gICAgc2V0dXBDYW52YXNFdmVudEhhbmRsZXJzKGNhbnZhcywgcHJpbnRDb25maWcpIHtcbiAgICAgICAgY2FudmFzLm9uKCdtb3VzZTpkb3duJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYm9yZGVyID0gdGhpcy5nZXRPYmplY3QoJ2FyZWE6Ym9yZGVyJywgY2FudmFzKTtcbiAgICAgICAgICAgIGlmIChib3JkZXIpIHtcbiAgICAgICAgICAgICAgICBib3JkZXIuc2V0KCdvcGFjaXR5JywgMC44KTtcbiAgICAgICAgICAgICAgICBjYW52YXMucmVxdWVzdFJlbmRlckFsbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLm9uKCdtb3VzZTp1cCcsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGJvcmRlciA9IHRoaXMuZ2V0T2JqZWN0KCdhcmVhOmJvcmRlcicsIGNhbnZhcyk7XG4gICAgICAgICAgICBpZiAoYm9yZGVyKSB7XG4gICAgICAgICAgICAgICAgYm9yZGVyLnNldCgnb3BhY2l0eScsIDAuMyk7XG4gICAgICAgICAgICAgICAgY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNhbnZhcy5vbignb2JqZWN0OnJvdGF0aW5nJywgKGUpID0+IHtcbiAgICAgICAgICAgIGlmIChlLnRhcmdldD8uYW5nbGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFuZ2xlcyA9IFswLCA5MCwgMTgwLCAyNzBdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRBbmdsZSA9IGUudGFyZ2V0LmFuZ2xlICUgMzYwO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc25hcEFuZ2xlIG9mIGFuZ2xlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoY3VycmVudEFuZ2xlIC0gc25hcEFuZ2xlKSA8IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUudGFyZ2V0LnJvdGF0ZShzbmFwQW5nbGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLm9uKCdvYmplY3Q6bW92aW5nJywgKGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlT2JqZWN0TW92aW5nKGUsIGNhbnZhcywgcHJpbnRDb25maWcpO1xuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLm9uKCdvYmplY3Q6bW9kaWZpZWQnLCAoZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVPYmplY3RNb2RpZmllZChlLCBjYW52YXMsIHByaW50Q29uZmlnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGhhbmRsZU9iamVjdE1vdmluZyhlLCBjYW52YXMsIHByaW50Q29uZmlnKSB7XG4gICAgICAgIGlmICghZS50YXJnZXQgfHwgZS50YXJnZXQubmFtZSA9PT0gJ2FyZWE6Ym9yZGVyJyB8fCBlLnRhcmdldC5uYW1lID09PSAnYXJlYTpjbGlwJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxheW91dCA9IHRoaXMubGF5b3V0cy5maW5kKGwgPT4gbC5pZCA9PT0gZS50YXJnZXQubmFtZSk7XG4gICAgICAgIGlmICghbGF5b3V0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB3aWR0aCA9IHByaW50Q29uZmlnLnNpemUud2lkdGggLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBwcmludENvbmZpZy5zaXplLmhlaWdodCAvIDYwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0O1xuICAgICAgICBjb25zdCBsZWZ0ID0gTWF0aC5yb3VuZCgodGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCAtIHdpZHRoKSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueCAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgpKTtcbiAgICAgICAgY29uc3QgdG9wID0gTWF0aC5yb3VuZCgodGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQgLSBoZWlnaHQpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi55IC8gMTAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQpKTtcbiAgICAgICAgY29uc3Qgb2JqV2lkdGggPSBlLnRhcmdldC53aWR0aCAqIGUudGFyZ2V0LnNjYWxlWDtcbiAgICAgICAgY29uc3Qgb2JqSGVpZ2h0ID0gZS50YXJnZXQuaGVpZ2h0ICogZS50YXJnZXQuc2NhbGVZO1xuICAgICAgICBjb25zdCBvYmpDZW50ZXJMZWZ0ID0gZS50YXJnZXQubGVmdCArIG9ialdpZHRoIC8gMjtcbiAgICAgICAgY29uc3Qgb2JqQ2VudGVyVG9wID0gZS50YXJnZXQudG9wICsgb2JqSGVpZ2h0IC8gMjtcbiAgICAgICAgY29uc3QgbmVhclggPSBNYXRoLmFicyhvYmpDZW50ZXJMZWZ0IC0gKGxlZnQgKyB3aWR0aCAvIDIpKSA8IDc7XG4gICAgICAgIGNvbnN0IG5lYXJZID0gTWF0aC5hYnMob2JqQ2VudGVyVG9wIC0gKHRvcCArIGhlaWdodCAvIDIpKSA8IDc7XG4gICAgICAgIGlmIChuZWFyWCkge1xuICAgICAgICAgICAgdGhpcy5zaG93R3VpZGVsaW5lKGNhbnZhcywgJ3ZlcnRpY2FsJywgbGVmdCArIHdpZHRoIC8gMiwgMCwgbGVmdCArIHdpZHRoIC8gMiwgdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQpO1xuICAgICAgICAgICAgZS50YXJnZXQuc2V0KHsgbGVmdDogbGVmdCArIHdpZHRoIC8gMiAtIG9ialdpZHRoIC8gMiB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaGlkZUd1aWRlbGluZShjYW52YXMsICd2ZXJ0aWNhbCcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuZWFyWSkge1xuICAgICAgICAgICAgdGhpcy5zaG93R3VpZGVsaW5lKGNhbnZhcywgJ2hvcml6b250YWwnLCAwLCB0b3AgKyBoZWlnaHQgLyAyLCB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoLCB0b3AgKyBoZWlnaHQgLyAyKTtcbiAgICAgICAgICAgIGUudGFyZ2V0LnNldCh7IHRvcDogdG9wICsgaGVpZ2h0IC8gMiAtIG9iakhlaWdodCAvIDIgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmhpZGVHdWlkZWxpbmUoY2FudmFzLCAnaG9yaXpvbnRhbCcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGhhbmRsZU9iamVjdE1vZGlmaWVkKGUsIGNhbnZhcywgcHJpbnRDb25maWcpIHtcbiAgICAgICAgY29uc3Qgb2JqZWN0ID0gZS50YXJnZXQ7XG4gICAgICAgIGlmICghb2JqZWN0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmhpZGVHdWlkZWxpbmUoY2FudmFzLCAndmVydGljYWwnKTtcbiAgICAgICAgdGhpcy5oaWRlR3VpZGVsaW5lKGNhbnZhcywgJ2hvcml6b250YWwnKTtcbiAgICAgICAgY29uc3QgbGF5b3V0ID0gdGhpcy5sYXlvdXRzLmZpbmQobCA9PiBsLmlkID09PSBvYmplY3QubmFtZSk7XG4gICAgICAgIGlmICghbGF5b3V0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB3aWR0aCA9IHByaW50Q29uZmlnLnNpemUud2lkdGggLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBwcmludENvbmZpZy5zaXplLmhlaWdodCAvIDYwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0O1xuICAgICAgICBjb25zdCBsZWZ0ID0gTWF0aC5yb3VuZCgodGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCAtIHdpZHRoKSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueCAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgpKTtcbiAgICAgICAgY29uc3QgdG9wID0gTWF0aC5yb3VuZCgodGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQgLSBoZWlnaHQpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi55IC8gMTAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQpKTtcbiAgICAgICAgbGF5b3V0LnBvc2l0aW9uLnggPSAob2JqZWN0LmxlZnQgLSBsZWZ0KSAvIHdpZHRoO1xuICAgICAgICBsYXlvdXQucG9zaXRpb24ueSA9IChvYmplY3QudG9wIC0gdG9wKSAvIGhlaWdodDtcbiAgICAgICAgbGF5b3V0LnNpemUgPSBvYmplY3Quc2NhbGVYO1xuICAgICAgICBsYXlvdXQuYXNwZWN0UmF0aW8gPSBvYmplY3Quc2NhbGVZIC8gb2JqZWN0LnNjYWxlWDtcbiAgICAgICAgbGF5b3V0LmFuZ2xlID0gb2JqZWN0LmFuZ2xlO1xuICAgICAgICB0aGlzLnNhdmVMYXlvdXRzKCkuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoJ1tsYXllcnNdINCe0YjQuNCx0LrQsCDRgdC+0YXRgNCw0L3QtdC90LjRjyDRgdC70L7RkdCyOicsIGVycikpO1xuICAgIH1cbiAgICBzaG93R3VpZGVsaW5lKGNhbnZhcywgdHlwZSwgeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IGBndWlkZWxpbmU6JHt0eXBlfWA7XG4gICAgICAgIGxldCBndWlkZWxpbmUgPSB0aGlzLmdldE9iamVjdChuYW1lLCBjYW52YXMpO1xuICAgICAgICBpZiAoIWd1aWRlbGluZSkge1xuICAgICAgICAgICAgZ3VpZGVsaW5lID0gbmV3IGZhYnJpYy5MaW5lKFt4MSwgeTEsIHgyLCB5Ml0sIHtcbiAgICAgICAgICAgICAgICBzdHJva2U6ICdyZ2IoMjU0LCA5NCwgNTgpJyxcbiAgICAgICAgICAgICAgICBzdHJva2VXaWR0aDogMixcbiAgICAgICAgICAgICAgICBzdHJva2VEYXNoQXJyYXk6IFs1LCA1XSxcbiAgICAgICAgICAgICAgICBzZWxlY3RhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBldmVudGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZ3VpZGVsaW5lKSB7XG4gICAgICAgICAgICAgICAgY2FudmFzLmFkZChndWlkZWxpbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGhpZGVHdWlkZWxpbmUoY2FudmFzLCB0eXBlKSB7XG4gICAgICAgIGNvbnN0IGd1aWRlbGluZSA9IHRoaXMuZ2V0T2JqZWN0KGBndWlkZWxpbmU6JHt0eXBlfWAsIGNhbnZhcyk7XG4gICAgICAgIGlmIChndWlkZWxpbmUpIHtcbiAgICAgICAgICAgIGNhbnZhcy5yZW1vdmUoZ3VpZGVsaW5lKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRPYmplY3QobmFtZSwgY2FudmFzKSB7XG4gICAgICAgIGNvbnN0IHRhcmdldENhbnZhcyA9IGNhbnZhcyB8fCB0aGlzLmFjdGl2ZUNhbnZhcyB8fCB0aGlzLmNhbnZhc2VzWzBdO1xuICAgICAgICBpZiAoIXRhcmdldENhbnZhcylcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiB0YXJnZXRDYW52YXMuZ2V0T2JqZWN0cygpLmZpbmQob2JqID0+IG9iai5uYW1lID09PSBuYW1lKTtcbiAgICB9XG4gICAgc2V0QWN0aXZlU2lkZShzaWRlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tjYW52YXNdINCj0YHRgtCw0L3QvtCy0LrQsCDQsNC60YLQuNCy0L3QvtC5INGB0YLQvtGA0L7QvdGLOicsIHNpZGUpO1xuICAgICAgICB0aGlzLmNhbnZhc2VzLmZvckVhY2goY2FudmFzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhc0VsZW1lbnQgPSBjYW52YXMuZ2V0RWxlbWVudCgpO1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyRWxlbWVudCA9IGNhbnZhc0VsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgIGlmIChjYW52YXMuc2lkZSA9PT0gc2lkZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ2FudmFzID0gY2FudmFzO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FudmFzRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYW52YXNFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzLmZvckVhY2gobGF5ZXJzQ2FudmFzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhc0VsZW1lbnQgPSBsYXllcnNDYW52YXMuZ2V0RWxlbWVudCgpO1xuICAgICAgICAgICAgY2FudmFzRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gbGF5ZXJzQ2FudmFzLnNpZGUgPT09IHNpZGUgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fc2VsZWN0U2lkZSA9IHNpZGU7XG4gICAgfVxuICAgIGFzeW5jIGFkZExheW91dFRvQ2FudmFzKGxheW91dCkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc2VzLmZpbmQoYyA9PiBjLnNpZGUgPT09IGxheW91dC52aWV3KTtcbiAgICAgICAgaWYgKCFjYW52YXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2NhbnZhc10gY2FudmFzINC00LvRjyAke2xheW91dC52aWV3fSDQvdC1INC90LDQudC00LXQvWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgcHJpbnRDb25maWcgPSBwcm9kdWN0LnByaW50Q29uZmlnLmZpbmQocGMgPT4gcGMuc2lkZSA9PT0gbGF5b3V0LnZpZXcpO1xuICAgICAgICBpZiAoIXByaW50Q29uZmlnKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB3aWR0aCA9IHByaW50Q29uZmlnLnNpemUud2lkdGggLyA2MDAgKiB0aGlzLmVkaXRvckJsb2NrLmNsaWVudFdpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBwcmludENvbmZpZy5zaXplLmhlaWdodCAvIDYwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50SGVpZ2h0O1xuICAgICAgICBjb25zdCBsZWZ0ID0gTWF0aC5yb3VuZCgodGhpcy5lZGl0b3JCbG9jay5jbGllbnRXaWR0aCAtIHdpZHRoKSAvIDIgKyAocHJpbnRDb25maWcucG9zaXRpb24ueCAvIDEwMCAqIHRoaXMuZWRpdG9yQmxvY2suY2xpZW50V2lkdGgpKTtcbiAgICAgICAgY29uc3QgdG9wID0gTWF0aC5yb3VuZCgodGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQgLSBoZWlnaHQpIC8gMiArIChwcmludENvbmZpZy5wb3NpdGlvbi55IC8gMTAwICogdGhpcy5lZGl0b3JCbG9jay5jbGllbnRIZWlnaHQpKTtcbiAgICAgICAgY29uc3QgYWJzb2x1dGVMZWZ0ID0gbGVmdCArICh3aWR0aCAqIGxheW91dC5wb3NpdGlvbi54KTtcbiAgICAgICAgY29uc3QgYWJzb2x1dGVUb3AgPSB0b3AgKyAoaGVpZ2h0ICogbGF5b3V0LnBvc2l0aW9uLnkpO1xuICAgICAgICBpZiAobGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSkge1xuICAgICAgICAgICAgY29uc3QgaW1hZ2UgPSBuZXcgZmFicmljLkltYWdlKGF3YWl0IHRoaXMubG9hZEltYWdlKGxheW91dC51cmwpKTtcbiAgICAgICAgICAgIGlmIChsYXlvdXQuc2l6ZSA9PT0gMSAmJiBpbWFnZS53aWR0aCA+IHdpZHRoKSB7XG4gICAgICAgICAgICAgICAgbGF5b3V0LnNpemUgPSB3aWR0aCAvIGltYWdlLndpZHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW1hZ2Uuc2V0KHtcbiAgICAgICAgICAgICAgICBsZWZ0OiBhYnNvbHV0ZUxlZnQsXG4gICAgICAgICAgICAgICAgdG9wOiBhYnNvbHV0ZVRvcCxcbiAgICAgICAgICAgICAgICBuYW1lOiBsYXlvdXQuaWQsXG4gICAgICAgICAgICAgICAgbGF5b3V0VXJsOiBsYXlvdXQudXJsLFxuICAgICAgICAgICAgICAgIHNjYWxlWDogbGF5b3V0LnNpemUsXG4gICAgICAgICAgICAgICAgc2NhbGVZOiBsYXlvdXQuc2l6ZSAqIGxheW91dC5hc3BlY3RSYXRpbyxcbiAgICAgICAgICAgICAgICBhbmdsZTogbGF5b3V0LmFuZ2xlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjYW52YXMuYWRkKGltYWdlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsYXlvdXQuaXNUZXh0TGF5b3V0KCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSBuZXcgZmFicmljLlRleHQobGF5b3V0LnRleHQsIHtcbiAgICAgICAgICAgICAgICBmb250RmFtaWx5OiBsYXlvdXQuZm9udC5mYW1pbHksXG4gICAgICAgICAgICAgICAgZm9udFNpemU6IGxheW91dC5mb250LnNpemUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRleHQuc2V0KHtcbiAgICAgICAgICAgICAgICB0b3A6IGFic29sdXRlVG9wLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGFic29sdXRlTGVmdCxcbiAgICAgICAgICAgICAgICBuYW1lOiBsYXlvdXQuaWQsXG4gICAgICAgICAgICAgICAgc2NhbGVYOiBsYXlvdXQuc2l6ZSxcbiAgICAgICAgICAgICAgICBzY2FsZVk6IGxheW91dC5zaXplICogbGF5b3V0LmFzcGVjdFJhdGlvLFxuICAgICAgICAgICAgICAgIGFuZ2xlOiBsYXlvdXQuYW5nbGUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNhbnZhcy5hZGQodGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlTGF5b3V0cygpIHtcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZUNhbnZhcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzRm9yU2lkZSh0aGlzLl9zZWxlY3RTaWRlKTtcbiAgICB9XG4gICAgdXBkYXRlTGF5b3V0c0ZvclNpZGUoc2lkZSkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc2VzLmZpbmQoYyA9PiBjLnNpZGUgPT09IHNpZGUpO1xuICAgICAgICBpZiAoIWNhbnZhcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgb2JqZWN0cyA9IGNhbnZhcy5nZXRPYmplY3RzKCk7XG4gICAgICAgIGNvbnN0IG9iamVjdHNUb1JlbW92ZSA9IG9iamVjdHNcbiAgICAgICAgICAgIC5maWx0ZXIob2JqID0+IG9iai5uYW1lICE9PSAnYXJlYTpib3JkZXInICYmIG9iai5uYW1lICE9PSAnYXJlYTpjbGlwJyAmJiAhb2JqLm5hbWU/LnN0YXJ0c1dpdGgoJ2d1aWRlbGluZScpKVxuICAgICAgICAgICAgLmZpbHRlcihvYmogPT4gIXRoaXMubGF5b3V0cy5maW5kKGxheW91dCA9PiBsYXlvdXQuaWQgPT09IG9iai5uYW1lKSk7XG4gICAgICAgIG9iamVjdHNUb1JlbW92ZS5mb3JFYWNoKG9iaiA9PiB7XG4gICAgICAgICAgICBjYW52YXMucmVtb3ZlKG9iaik7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBsYXlvdXRzRm9yU2lkZSA9IHRoaXMubGF5b3V0cy5maWx0ZXIobGF5b3V0ID0+IGxheW91dC52aWV3ID09PSBzaWRlKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0c1RvVXBkYXRlID0gW107XG4gICAgICAgIGNvbnN0IG9iamVjdHNUb0FkZCA9IFtdO1xuICAgICAgICBsYXlvdXRzRm9yU2lkZS5mb3JFYWNoKGxheW91dCA9PiB7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ09iaiA9IG9iamVjdHMuZmluZChvYmogPT4gb2JqLm5hbWUgPT09IGxheW91dC5pZCk7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdPYmopIHtcbiAgICAgICAgICAgICAgICBpZiAobGF5b3V0LmlzSW1hZ2VMYXlvdXQoKSAmJiBleGlzdGluZ09iai5sYXlvdXRVcmwgIT09IGxheW91dC51cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2NhbnZhc10gTGF5b3V0ICR7bGF5b3V0LmlkfSDQuNC30LzQtdC90LjQu9GB0Y8sINGC0YDQtdCx0YPQtdGC0YHRjyDQvtCx0L3QvtCy0LvQtdC90LjQtWApO1xuICAgICAgICAgICAgICAgICAgICBvYmplY3RzVG9VcGRhdGUucHVzaChsYXlvdXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG9iamVjdHNUb0FkZC5wdXNoKGxheW91dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBvYmplY3RzVG9VcGRhdGUuZm9yRWFjaChsYXlvdXQgPT4ge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdPYmogPSBvYmplY3RzLmZpbmQob2JqID0+IG9iai5uYW1lID09PSBsYXlvdXQuaWQpO1xuICAgICAgICAgICAgaWYgKGV4aXN0aW5nT2JqKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2NhbnZhc10g0KPQtNCw0LvRj9C10Lwg0YHRgtCw0YDRi9C5INC+0LHRitC10LrRgiDQtNC70Y8g0L7QsdC90L7QstC70LXQvdC40Y86ICR7bGF5b3V0LmlkfWApO1xuICAgICAgICAgICAgICAgIGNhbnZhcy5yZW1vdmUoZXhpc3RpbmdPYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2NhbnZhc10g0JTQvtCx0LDQstC70Y/QtdC8INC+0LHQvdC+0LLQu9C10L3QvdGL0Lkg0L7QsdGK0LXQutGCOiAke2xheW91dC5pZH1gKTtcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5b3V0VG9DYW52YXMobGF5b3V0KTtcbiAgICAgICAgfSk7XG4gICAgICAgIG9iamVjdHNUb0FkZC5mb3JFYWNoKGxheW91dCA9PiB7XG4gICAgICAgICAgICB0aGlzLmFkZExheW91dFRvQ2FudmFzKGxheW91dCk7XG4gICAgICAgIH0pO1xuICAgICAgICBjYW52YXMucmVuZGVyQWxsKCk7XG4gICAgfVxuICAgIGFzeW5jIHByZWxvYWRBbGxNb2NrdXBzKCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbcHJlbG9hZF0g0J3QsNGH0LDQu9C+INC/0YDQtdC00LfQsNCz0YDRg9C30LrQuCBtb2NrdXBzJyk7XG4gICAgICAgIGZvciAoY29uc3QgcHJvZHVjdCBvZiB0aGlzLnByb2R1Y3RDb25maWdzKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG1vY2t1cCBvZiBwcm9kdWN0Lm1vY2t1cHMpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2NrdXBEYXRhVXJsID0gYXdhaXQgdGhpcy5nZXRJbWFnZURhdGEobW9ja3VwLnVybCk7XG4gICAgICAgICAgICAgICAgICAgIG1vY2t1cC51cmwgPSBtb2NrdXBEYXRhVXJsO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbcHJlbG9hZF0gTW9ja3VwINC30LDQs9GA0YPQttC10L06ICR7bW9ja3VwLmNvbG9yLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbcHJlbG9hZF0g0J7RiNC40LHQutCwINC30LDQs9GA0YPQt9C60LggbW9ja3VwICR7bW9ja3VwLnVybH06YCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdbcHJlbG9hZF0g0J/RgNC10LTQt9Cw0LPRgNGD0LfQutCwINC30LDQstC10YDRiNC10L3QsCcpO1xuICAgIH1cbiAgICBhc3luYyBnZXRJbWFnZURhdGEodXJsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvYWRBbmRDb252ZXJ0SW1hZ2UodXJsKTtcbiAgICB9XG4gICAgYXN5bmMgdXBsb2FkSW1hZ2UoZmlsZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkXSDQl9Cw0LPRgNGD0LfQutCwINGE0LDQudC70LA6JywgZmlsZS5uYW1lKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhVXJsID0gZS50YXJnZXQ/LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkRGF0YVVybCA9IGF3YWl0IHRoaXMuZ2V0SW1hZ2VEYXRhKGRhdGFVcmwpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkXSDQpNCw0LnQuyDRg9GB0L/QtdGI0L3QviDQt9Cw0LPRgNGD0LbQtdC9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoY29udmVydGVkRGF0YVVybCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbdXBsb2FkXSDQntGI0LjQsdC60LAg0L7QsdGA0LDQsdC+0YLQutC4INGE0LDQudC70LA6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZWFkZXIub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbdXBsb2FkXSDQntGI0LjQsdC60LAg0YfRgtC10L3QuNGPINGE0LDQudC70LAnKTtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCfQndC1INGD0LTQsNC70L7RgdGMINC/0YDQvtGH0LjRgtCw0YLRjCDRhNCw0LnQuycpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIHVwbG9hZEltYWdlVG9TZXJ2ZXIoYmFzZTY0KSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1t1cGxvYWRdINCX0LDQs9GA0YPQt9C60LAg0LjQt9C+0LHRgNCw0LbQtdC90LjRjyDQvdCwINGB0LXRgNCy0LXRgCcpO1xuICAgICAgICBjb25zdCB1c2VySWQgPSBhd2FpdCB0aGlzLnN0b3JhZ2VNYW5hZ2VyLmdldFVzZXJJZCgpO1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKEFQSV9FTkRQT0lOVFMuVVBMT0FEX0lNQUdFLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgaW1hZ2U6IGJhc2U2NCwgdXNlcl9pZDogdXNlcklkIH0pLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdbdXBsb2FkXSDQmNC30L7QsdGA0LDQttC10L3QuNC1INC30LDQs9GA0YPQttC10L3QviDQvdCwINGB0LXRgNCy0LXRgDonLCBkYXRhLmltYWdlX3VybCk7XG4gICAgICAgIHJldHVybiBkYXRhLmltYWdlX3VybDtcbiAgICB9XG4gICAgZ2V0UHJvZHVjdE5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk/LnByb2R1Y3ROYW1lIHx8ICcnO1xuICAgIH1cbiAgICBjYXBpdGFsaXplRmlyc3RMZXR0ZXIoc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSk7XG4gICAgfVxuICAgIGdldE1vY2t1cFVybChzaWRlKSB7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSB0aGlzLmdldFByb2R1Y3RCeVR5cGUodGhpcy5fc2VsZWN0VHlwZSk7XG4gICAgICAgIGlmICghcHJvZHVjdClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBjb25zdCBtb2NrdXAgPSBwcm9kdWN0Lm1vY2t1cHMuZmluZChtb2NrdXAgPT4gbW9ja3VwLnNpZGUgPT09IHNpZGUgJiYgbW9ja3VwLmNvbG9yLm5hbWUgPT09IHRoaXMuX3NlbGVjdENvbG9yLm5hbWUpO1xuICAgICAgICByZXR1cm4gbW9ja3VwID8gbW9ja3VwLnVybCA6IG51bGw7XG4gICAgfVxuICAgIGFzeW5jIGV4cG9ydEFydCh3aXRoTW9ja3VwID0gdHJ1ZSwgcmVzb2x1dGlvbiA9IDEwMjQpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgIGNvbnN0IHNpZGVzV2l0aExheWVycyA9IHRoaXMuZ2V0U2lkZXNXaXRoTGF5ZXJzKCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tleHBvcnRdINCd0LDQudC00LXQvdGLINGB0YLQvtGA0L7QvdGLINGBINGB0LvQvtGP0LzQuDonLCBzaWRlc1dpdGhMYXllcnMsICcoZnJvbnQg0L/QtdGA0LLRi9C5KScsIHdpdGhNb2NrdXAgPyAn0YEg0LzQvtC60LDQv9C+0LwnIDogJ9Cx0LXQtyDQvNC+0LrQsNC/0LAnLCBg0YDQsNC30YDQtdGI0LXQvdC40LU6ICR7cmVzb2x1dGlvbn1weGApO1xuICAgICAgICBjb25zdCBleHBvcnRQcm9taXNlcyA9IHNpZGVzV2l0aExheWVycy5tYXAoYXN5bmMgKHNpZGUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXhwb3J0ZWRTaWRlID0gYXdhaXQgdGhpcy5leHBvcnRTaWRlKHNpZGUsIHdpdGhNb2NrdXAsIHJlc29sdXRpb24pO1xuICAgICAgICAgICAgICAgIGlmIChleHBvcnRlZFNpZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0KHRgtC+0YDQvtC90LAgJHtzaWRlfSDRg9GB0L/QtdGI0L3QviDRjdC60YHQv9C+0YDRgtC40YDQvtCy0LDQvdCwYCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHNpZGUsIGRhdGE6IGV4cG9ydGVkU2lkZSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtleHBvcnRdINCe0YjQuNCx0LrQsCDQv9GA0Lgg0Y3QutGB0L/QvtGA0YLQtSDRgdGC0L7RgNC+0L3RiyAke3NpZGV9OmAsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZXhwb3J0ZWRTaWRlcyA9IGF3YWl0IFByb21pc2UuYWxsKGV4cG9ydFByb21pc2VzKTtcbiAgICAgICAgZXhwb3J0ZWRTaWRlcy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHRbaXRlbS5zaWRlXSA9IGl0ZW0uZGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCt0LrRgdC/0L7RgNGCINC30LDQstC10YDRiNC10L0g0LTQu9GPICR7T2JqZWN0LmtleXMocmVzdWx0KS5sZW5ndGh9INGB0YLQvtGA0L7QvWApO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBnZXRTaWRlc1dpdGhMYXllcnMoKSB7XG4gICAgICAgIGNvbnN0IGFsbFNpZGVzV2l0aExheWVycyA9IFsuLi5uZXcgU2V0KHRoaXMubGF5b3V0cy5tYXAobGF5b3V0ID0+IGxheW91dC52aWV3KSldO1xuICAgICAgICByZXR1cm4gYWxsU2lkZXNXaXRoTGF5ZXJzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIGlmIChhID09PSAnZnJvbnQnKVxuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIGlmIChiID09PSAnZnJvbnQnKVxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBleHBvcnRTaWRlKHNpZGUsIHdpdGhNb2NrdXAgPSB0cnVlLCByZXNvbHV0aW9uID0gMTAyNCkge1xuICAgICAgICBjb25zdCBjYW52YXNlcyA9IHRoaXMuZ2V0Q2FudmFzZXNGb3JTaWRlKHNpZGUpO1xuICAgICAgICBpZiAoIWNhbnZhc2VzLmVkaXRhYmxlQ2FudmFzKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtleHBvcnRdIENhbnZhcyDQtNC70Y8g0YHRgtC+0YDQvtC90YsgJHtzaWRlfSDQvdC1INC90LDQudC00LXQvWApO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRzRm9yU2lkZShzaWRlKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0K3QutGB0L/QvtGA0YLQuNGA0YPQtdC8INGB0YLQvtGA0L7QvdGDICR7c2lkZX0ke3dpdGhNb2NrdXAgPyAnINGBINC80L7QutCw0L/QvtC8JyA6ICcg0LHQtdC3INC80L7QutCw0L/QsCd9ICgke3Jlc29sdXRpb259cHgpLi4uYCk7XG4gICAgICAgIGlmICghd2l0aE1vY2t1cCkge1xuICAgICAgICAgICAgY29uc3QgY3JvcHBlZENhbnZhcyA9IGF3YWl0IHRoaXMuZXhwb3J0RGVzaWduV2l0aENsaXBQYXRoKGNhbnZhc2VzLmVkaXRhYmxlQ2FudmFzLCBjYW52YXNlcy5sYXllcnNDYW52YXMsIHNpZGUsIHJlc29sdXRpb24pO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0K3QutGB0L/QvtGA0YLQuNGA0L7QstCw0L0g0YfQuNGB0YLRi9C5INC00LjQt9Cw0LnQvSDQtNC70Y8gJHtzaWRlfSAo0L7QsdGA0LXQt9Cw0L0g0L/QviBjbGlwUGF0aClgKTtcbiAgICAgICAgICAgIHJldHVybiBjcm9wcGVkQ2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJywgMS4wKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtb2NrdXBJbWcgPSBhd2FpdCB0aGlzLmxvYWRNb2NrdXBGb3JTaWRlKHNpZGUpO1xuICAgICAgICBpZiAoIW1vY2t1cEltZylcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBjb25zdCB7IGNhbnZhczogdGVtcENhbnZhcywgY3R4LCBtb2NrdXBEaW1lbnNpb25zIH0gPSB0aGlzLmNyZWF0ZUV4cG9ydENhbnZhcyhyZXNvbHV0aW9uLCBtb2NrdXBJbWcpO1xuICAgICAgICBjb25zdCBkZXNpZ25DYW52YXMgPSBhd2FpdCB0aGlzLmNyZWF0ZURlc2lnbkNhbnZhcyhjYW52YXNlcy5lZGl0YWJsZUNhbnZhcywgY2FudmFzZXMubGF5ZXJzQ2FudmFzLCBzaWRlKTtcbiAgICAgICAgY3R4LmRyYXdJbWFnZShkZXNpZ25DYW52YXMsIDAsIDAsIGRlc2lnbkNhbnZhcy53aWR0aCwgZGVzaWduQ2FudmFzLmhlaWdodCwgbW9ja3VwRGltZW5zaW9ucy54LCBtb2NrdXBEaW1lbnNpb25zLnksIG1vY2t1cERpbWVuc2lvbnMud2lkdGgsIG1vY2t1cERpbWVuc2lvbnMuaGVpZ2h0KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0J3QsNC70L7QttC10L0g0LTQuNC30LDQudC9INC90LAg0LzQvtC60LDQvyDQtNC70Y8gJHtzaWRlfWApO1xuICAgICAgICByZXR1cm4gdGVtcENhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycsIDEuMCk7XG4gICAgfVxuICAgIGdldENhbnZhc2VzRm9yU2lkZShzaWRlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlZGl0YWJsZUNhbnZhczogdGhpcy5jYW52YXNlcy5maW5kKGMgPT4gYy5zaWRlID09PSBzaWRlKSxcbiAgICAgICAgICAgIGxheWVyc0NhbnZhczogdGhpcy5sYXllcnNDYW52YXNlcy5maW5kKGMgPT4gYy5zaWRlID09PSBzaWRlKVxuICAgICAgICB9O1xuICAgIH1cbiAgICBhc3luYyBsb2FkTW9ja3VwRm9yU2lkZShzaWRlKSB7XG4gICAgICAgIGNvbnN0IG1vY2t1cFVybCA9IHRoaXMuZ2V0TW9ja3VwVXJsKHNpZGUpO1xuICAgICAgICBpZiAoIW1vY2t1cFVybCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZXhwb3J0XSDQnNC+0LrQsNC/INC00LvRjyDRgdGC0L7RgNC+0L3RiyAke3NpZGV9INC90LUg0L3QsNC50LTQtdC9YCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtb2NrdXBJbWcgPSBhd2FpdCB0aGlzLmxvYWRJbWFnZShtb2NrdXBVcmwpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQl9Cw0LPRgNGD0LbQtdC9INC80L7QutCw0L8g0LTQu9GPICR7c2lkZX06ICR7bW9ja3VwVXJsfWApO1xuICAgICAgICByZXR1cm4gbW9ja3VwSW1nO1xuICAgIH1cbiAgICBjcmVhdGVFeHBvcnRDYW52YXMoZXhwb3J0U2l6ZSwgbW9ja3VwSW1nKSB7XG4gICAgICAgIGNvbnN0IHRlbXBDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgY29uc3QgY3R4ID0gdGVtcENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB0ZW1wQ2FudmFzLndpZHRoID0gZXhwb3J0U2l6ZTtcbiAgICAgICAgdGVtcENhbnZhcy5oZWlnaHQgPSBleHBvcnRTaXplO1xuICAgICAgICBjb25zdCBtb2NrdXBTY2FsZSA9IE1hdGgubWluKGV4cG9ydFNpemUgLyBtb2NrdXBJbWcud2lkdGgsIGV4cG9ydFNpemUgLyBtb2NrdXBJbWcuaGVpZ2h0KTtcbiAgICAgICAgY29uc3Qgc2NhbGVkTW9ja3VwV2lkdGggPSBtb2NrdXBJbWcud2lkdGggKiBtb2NrdXBTY2FsZTtcbiAgICAgICAgY29uc3Qgc2NhbGVkTW9ja3VwSGVpZ2h0ID0gbW9ja3VwSW1nLmhlaWdodCAqIG1vY2t1cFNjYWxlO1xuICAgICAgICBjb25zdCBtb2NrdXBYID0gKGV4cG9ydFNpemUgLSBzY2FsZWRNb2NrdXBXaWR0aCkgLyAyO1xuICAgICAgICBjb25zdCBtb2NrdXBZID0gKGV4cG9ydFNpemUgLSBzY2FsZWRNb2NrdXBIZWlnaHQpIC8gMjtcbiAgICAgICAgY3R4LmRyYXdJbWFnZShtb2NrdXBJbWcsIG1vY2t1cFgsIG1vY2t1cFksIHNjYWxlZE1vY2t1cFdpZHRoLCBzY2FsZWRNb2NrdXBIZWlnaHQpO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbZXhwb3J0XSDQndCw0YDQuNGB0L7QstCw0L0g0LzQvtC60LDQvyDQutCw0Log0YTQvtC9ICgke3NjYWxlZE1vY2t1cFdpZHRofXgke3NjYWxlZE1vY2t1cEhlaWdodH0pYCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjYW52YXM6IHRlbXBDYW52YXMsXG4gICAgICAgICAgICBjdHgsXG4gICAgICAgICAgICBtb2NrdXBEaW1lbnNpb25zOiB7XG4gICAgICAgICAgICAgICAgeDogbW9ja3VwWCxcbiAgICAgICAgICAgICAgICB5OiBtb2NrdXBZLFxuICAgICAgICAgICAgICAgIHdpZHRoOiBzY2FsZWRNb2NrdXBXaWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHNjYWxlZE1vY2t1cEhlaWdodFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBhc3luYyBjcmVhdGVEZXNpZ25DYW52YXMoZWRpdGFibGVDYW52YXMsIGxheWVyc0NhbnZhcywgc2lkZSkge1xuICAgICAgICBjb25zdCBxdWFsaXR5TXVsdGlwbGllciA9IDEwO1xuICAgICAgICBjb25zdCBiYXNlV2lkdGggPSBlZGl0YWJsZUNhbnZhcy5nZXRXaWR0aCgpO1xuICAgICAgICBjb25zdCBiYXNlSGVpZ2h0ID0gZWRpdGFibGVDYW52YXMuZ2V0SGVpZ2h0KCk7XG4gICAgICAgIGNvbnN0IGRlc2lnbkNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBjb25zdCBkZXNpZ25DdHggPSBkZXNpZ25DYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgZGVzaWduQ2FudmFzLndpZHRoID0gYmFzZVdpZHRoICogcXVhbGl0eU11bHRpcGxpZXI7XG4gICAgICAgIGRlc2lnbkNhbnZhcy5oZWlnaHQgPSBiYXNlSGVpZ2h0ICogcXVhbGl0eU11bHRpcGxpZXI7XG4gICAgICAgIGF3YWl0IHRoaXMuYWRkU3RhdGljTGF5ZXJzVG9DYW52YXMobGF5ZXJzQ2FudmFzLCBkZXNpZ25DdHgsIGRlc2lnbkNhbnZhcywgc2lkZSk7XG4gICAgICAgIGF3YWl0IHRoaXMuYWRkRWRpdGFibGVPYmplY3RzVG9DYW52YXMoZWRpdGFibGVDYW52YXMsIGRlc2lnbkN0eCwgZGVzaWduQ2FudmFzLCBiYXNlV2lkdGgsIGJhc2VIZWlnaHQsIHNpZGUpO1xuICAgICAgICByZXR1cm4gZGVzaWduQ2FudmFzO1xuICAgIH1cbiAgICBhc3luYyBhZGRTdGF0aWNMYXllcnNUb0NhbnZhcyhsYXllcnNDYW52YXMsIGN0eCwgY2FudmFzLCBzaWRlKSB7XG4gICAgICAgIGlmICghbGF5ZXJzQ2FudmFzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbGF5ZXJzRGF0YVVybCA9IGxheWVyc0NhbnZhcy50b0RhdGFVUkwoe1xuICAgICAgICAgICAgICAgIGZvcm1hdDogJ3BuZycsXG4gICAgICAgICAgICAgICAgbXVsdGlwbGllcjogMTAsXG4gICAgICAgICAgICAgICAgcXVhbGl0eTogMS4wXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGVtcHR5RGF0YVVybCA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUFFQUFBQUJDQVlBQUFBZkZjU0pBQUFBRFVsRVFWUjQybU5rWVBoZkR3QUNod0dBNjBlNmtnQUFBQUJKUlU1RXJrSmdnZz09JztcbiAgICAgICAgICAgIGlmIChsYXllcnNEYXRhVXJsICE9PSBlbXB0eURhdGFVcmwgJiYgbGF5ZXJzRGF0YVVybC5sZW5ndGggPiBlbXB0eURhdGFVcmwubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGF5ZXJzSW1nID0gYXdhaXQgdGhpcy5sb2FkSW1hZ2UobGF5ZXJzRGF0YVVybCk7XG4gICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShsYXllcnNJbWcsIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0JTQvtCx0LDQstC70LXQvdGLINGB0YLQsNGC0LjRh9C10YHQutC40LUg0YHQu9C+0Lgg0LTQu9GPICR7c2lkZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2V4cG9ydF0g0J7RiNC40LHQutCwINGN0LrRgdC/0L7RgNGC0LAg0YHRgtCw0YLQuNGH0LXRgdC60LjRhSDRgdC70L7QtdCyINC00LvRjyAke3NpZGV9OmAsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBhZGRFZGl0YWJsZU9iamVjdHNUb0NhbnZhcyhlZGl0YWJsZUNhbnZhcywgY3R4LCBjYW52YXMsIGJhc2VXaWR0aCwgYmFzZUhlaWdodCwgc2lkZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdGVtcEVkaXRhYmxlQ2FudmFzID0gbmV3IGZhYnJpYy5TdGF0aWNDYW52YXMobnVsbCwge1xuICAgICAgICAgICAgICAgIHdpZHRoOiBiYXNlV2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBiYXNlSGVpZ2h0LFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3RyYW5zcGFyZW50J1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZWRpdGFibGVDYW52YXMuY2xpcFBhdGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjbG9uZWRDbGlwID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdGFibGVDYW52YXMuY2xpcFBhdGguY2xvbmUoKGNsb25lZCkgPT4gcmVzb2x2ZShjbG9uZWQpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0ZW1wRWRpdGFibGVDYW52YXMuY2xpcFBhdGggPSBjbG9uZWRDbGlwO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCf0YDQuNC80LXQvdGR0L0gY2xpcFBhdGgg0LTQu9GPINGN0LrRgdC/0L7RgNGC0LAg0YHRgtC+0YDQvtC90YsgJHtzaWRlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZGVzaWduT2JqZWN0cyA9IHRoaXMuZmlsdGVyRGVzaWduT2JqZWN0cyhlZGl0YWJsZUNhbnZhcy5nZXRPYmplY3RzKCkpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBvYmogb2YgZGVzaWduT2JqZWN0cykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNsb25lZE9iaiA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIG9iai5jbG9uZSgoY2xvbmVkKSA9PiByZXNvbHZlKGNsb25lZCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRlbXBFZGl0YWJsZUNhbnZhcy5hZGQoY2xvbmVkT2JqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRlc2lnbkRhdGFVcmwgPSB0ZW1wRWRpdGFibGVDYW52YXMudG9EYXRhVVJMKHtcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdwbmcnLFxuICAgICAgICAgICAgICAgIG11bHRpcGxpZXI6IDEwLFxuICAgICAgICAgICAgICAgIHF1YWxpdHk6IDEuMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBlbXB0eURhdGFVcmwgPSAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBRUFBQUFCQ0FZQUFBQWZGY1NKQUFBQURVbEVRVlI0Mm1Oa1lQaGZEd0FDaHdHQTYwZTZrZ0FBQUFCSlJVNUVya0pnZ2c9PSc7XG4gICAgICAgICAgICBpZiAoZGVzaWduRGF0YVVybCAhPT0gZW1wdHlEYXRhVXJsICYmIGRlc2lnbkRhdGFVcmwubGVuZ3RoID4gZW1wdHlEYXRhVXJsLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlc2lnbkltZyA9IGF3YWl0IHRoaXMubG9hZEltYWdlKGRlc2lnbkRhdGFVcmwpO1xuICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoZGVzaWduSW1nLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtleHBvcnRdINCU0L7QsdCw0LLQu9C10L3RiyDQvtCx0YrQtdC60YLRiyDQtNC40LfQsNC50L3QsCDQsdC10Lcg0LPRgNCw0L3QuNGGINC00LvRjyAke3NpZGV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZW1wRWRpdGFibGVDYW52YXMuZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZXhwb3J0XSDQntGI0LjQsdC60LAg0YHQvtC30LTQsNC90LjRjyDQtNC40LfQsNC50L3QsCDQsdC10Lcg0LPRgNCw0L3QuNGGINC00LvRjyAke3NpZGV9OmAsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmaWx0ZXJEZXNpZ25PYmplY3RzKGFsbE9iamVjdHMpIHtcbiAgICAgICAgY29uc3Qgc2VydmljZU9iamVjdE5hbWVzID0gbmV3IFNldChbXG4gICAgICAgICAgICBcImFyZWE6Ym9yZGVyXCIsXG4gICAgICAgICAgICBcImFyZWE6Y2xpcFwiLFxuICAgICAgICAgICAgXCJndWlkZWxpbmVcIixcbiAgICAgICAgICAgIFwiZ3VpZGVsaW5lOnZlcnRpY2FsXCIsXG4gICAgICAgICAgICBcImd1aWRlbGluZTpob3Jpem9udGFsXCJcbiAgICAgICAgXSk7XG4gICAgICAgIHJldHVybiBhbGxPYmplY3RzLmZpbHRlcigob2JqKSA9PiAhc2VydmljZU9iamVjdE5hbWVzLmhhcyhvYmoubmFtZSkpO1xuICAgIH1cbiAgICBhc3luYyBleHBvcnREZXNpZ25XaXRoQ2xpcFBhdGgoZWRpdGFibGVDYW52YXMsIGxheWVyc0NhbnZhcywgc2lkZSwgcmVzb2x1dGlvbikge1xuICAgICAgICBjb25zdCBxdWFsaXR5TXVsdGlwbGllciA9IDEwO1xuICAgICAgICBjb25zdCBjbGlwUGF0aCA9IGVkaXRhYmxlQ2FudmFzLmNsaXBQYXRoO1xuICAgICAgICBpZiAoIWNsaXBQYXRoKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tleHBvcnRdIGNsaXBQYXRoINC90LUg0L3QsNC50LTQtdC9LCDRjdC60YHQv9C+0YDRgtC40YDRg9C10Lwg0LLQtdGB0YwgY2FudmFzJyk7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jcmVhdGVEZXNpZ25DYW52YXMoZWRpdGFibGVDYW52YXMsIGxheWVyc0NhbnZhcywgc2lkZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2xpcFdpZHRoID0gY2xpcFBhdGgud2lkdGg7XG4gICAgICAgIGNvbnN0IGNsaXBIZWlnaHQgPSBjbGlwUGF0aC5oZWlnaHQ7XG4gICAgICAgIGNvbnN0IGNsaXBMZWZ0ID0gY2xpcFBhdGgubGVmdDtcbiAgICAgICAgY29uc3QgY2xpcFRvcCA9IGNsaXBQYXRoLnRvcDtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0gY2xpcFBhdGg6ICR7Y2xpcFdpZHRofXgke2NsaXBIZWlnaHR9IGF0ICgke2NsaXBMZWZ0fSwgJHtjbGlwVG9wfSlgKTtcbiAgICAgICAgY29uc3QgZnVsbERlc2lnbkNhbnZhcyA9IGF3YWl0IHRoaXMuY3JlYXRlRGVzaWduQ2FudmFzKGVkaXRhYmxlQ2FudmFzLCBsYXllcnNDYW52YXMsIHNpZGUpO1xuICAgICAgICBjb25zdCBzY2FsZSA9IHJlc29sdXRpb24gLyBNYXRoLm1heChjbGlwV2lkdGgsIGNsaXBIZWlnaHQpO1xuICAgICAgICBjb25zdCBjcm9wcGVkQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGNyb3BwZWRDYW52YXMud2lkdGggPSBjbGlwV2lkdGggKiBzY2FsZTtcbiAgICAgICAgY3JvcHBlZENhbnZhcy5oZWlnaHQgPSBjbGlwSGVpZ2h0ICogc2NhbGU7XG4gICAgICAgIGNvbnN0IGN0eCA9IGNyb3BwZWRDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgY29uc3Qgc291cmNlU2NhbGUgPSBxdWFsaXR5TXVsdGlwbGllcjtcbiAgICAgICAgY3R4LmRyYXdJbWFnZShmdWxsRGVzaWduQ2FudmFzLCBjbGlwTGVmdCAqIHNvdXJjZVNjYWxlLCBjbGlwVG9wICogc291cmNlU2NhbGUsIGNsaXBXaWR0aCAqIHNvdXJjZVNjYWxlLCBjbGlwSGVpZ2h0ICogc291cmNlU2NhbGUsIDAsIDAsIGNyb3BwZWRDYW52YXMud2lkdGgsIGNyb3BwZWRDYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2V4cG9ydF0g0JTQuNC30LDQudC9INC+0LHRgNC10LfQsNC9INC/0L4gY2xpcFBhdGg6ICR7Y3JvcHBlZENhbnZhcy53aWR0aH14JHtjcm9wcGVkQ2FudmFzLmhlaWdodH1weGApO1xuICAgICAgICByZXR1cm4gY3JvcHBlZENhbnZhcztcbiAgICB9XG4gICAgYXN5bmMgdXBsb2FkRGVzaWduVG9TZXJ2ZXIoZGVzaWducykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2V4cG9ydF0g0JfQsNCz0YDRg9C30LrQsCDQtNC40LfQsNC50L3QsCDQvdCwINGB0LXRgNCy0LXRgCcpO1xuICAgICAgICAgICAgY29uc3QgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgW3NpZGUsIGRhdGFVcmxdIG9mIE9iamVjdC5lbnRyaWVzKGRlc2lnbnMpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChkYXRhVXJsKTtcbiAgICAgICAgICAgICAgICBjb25zdCBibG9iID0gYXdhaXQgcmVzcG9uc2UuYmxvYigpO1xuICAgICAgICAgICAgICAgIGZvcm1EYXRhLmFwcGVuZChzaWRlLCBibG9iLCBgJHtzaWRlfS5wbmdgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2V4cG9ydF0g0JfQsNCz0YDRg9C30LrQsCDQvdCwINGB0LXRgNCy0LXRgCDQvdC1INGA0LXQsNC70LjQt9C+0LLQsNC90LAnKTtcbiAgICAgICAgICAgIHJldHVybiBkZXNpZ25zO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2V4cG9ydF0g0J7RiNC40LHQutCwINC/0YDQuCDQt9Cw0LPRgNGD0LfQutC1INC90LAg0YHQtdGA0LLQtdGAOicsIGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNhdmVMYXllcnNUb0hpc3RvcnkoKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPCB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgdGhpcy5sYXllcnNIaXN0b3J5ID0gdGhpcy5sYXllcnNIaXN0b3J5LnNsaWNlKDAsIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCArIDEpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxheWVyc0NvcHkgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRoaXMubGF5b3V0cykpO1xuICAgICAgICBjb25zdCBoaXN0b3J5SXRlbSA9IHtcbiAgICAgICAgICAgIGxheWVyczogbGF5ZXJzQ29weS5tYXAoKGRhdGEpID0+IG5ldyBMYXlvdXQoZGF0YSkpLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMubGF5ZXJzSGlzdG9yeS5wdXNoKGhpc3RvcnlJdGVtKTtcbiAgICAgICAgdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID0gdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDE7XG4gICAgICAgIGNvbnN0IE1BWF9ISVNUT1JZX1NJWkUgPSA1MDtcbiAgICAgICAgaWYgKHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggPiBNQVhfSElTVE9SWV9TSVpFKSB7XG4gICAgICAgICAgICB0aGlzLmxheWVyc0hpc3Rvcnkuc2hpZnQoKTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleC0tO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtoaXN0b3J5XSDQodC+0YXRgNCw0L3QtdC90L4g0YHQvtGB0YLQvtGP0L3QuNC1INGB0LvQvtGR0LIuINCY0L3QtNC10LrRgTogJHt0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXh9LCDQktGB0LXQs9C+OiAke3RoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGh9LCDQodC70L7RkdCyOiAke3RoaXMubGF5b3V0cy5sZW5ndGh9YCk7XG4gICAgICAgIHRoaXMudXBkYXRlSGlzdG9yeUJ1dHRvbnNTdGF0ZSgpO1xuICAgIH1cbiAgICBjYW5VbmRvKCkge1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50SGlzdG9yeUluZGV4ID09PSB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggPj0gMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPiAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNhblJlZG8oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPCB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMTtcbiAgICB9XG4gICAgdXBkYXRlSGlzdG9yeUJ1dHRvbnNTdGF0ZSgpIHtcbiAgICAgICAgY29uc3QgY2FuVW5kbyA9IHRoaXMuY2FuVW5kbygpO1xuICAgICAgICBjb25zdCBjYW5SZWRvID0gdGhpcy5jYW5SZWRvKCk7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvckhpc3RvcnlVbmRvQmxvY2sgJiYgdGhpcy5lZGl0b3JIaXN0b3J5VW5kb0Jsb2NrLmZpcnN0RWxlbWVudENoaWxkKSB7XG4gICAgICAgICAgICBjb25zdCB1bmRvQnV0dG9uID0gdGhpcy5lZGl0b3JIaXN0b3J5VW5kb0Jsb2NrLmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgaWYgKGNhblVuZG8pIHtcbiAgICAgICAgICAgICAgICB1bmRvQnV0dG9uLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcnO1xuICAgICAgICAgICAgICAgIHVuZG9CdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdW5kb0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnI2YyZjJmMic7XG4gICAgICAgICAgICAgICAgdW5kb0J1dHRvbi5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9ySGlzdG9yeVJlZG9CbG9jayAmJiB0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZG9CdXR0b24gPSB0aGlzLmVkaXRvckhpc3RvcnlSZWRvQmxvY2suZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgICBpZiAoY2FuUmVkbykge1xuICAgICAgICAgICAgICAgIHJlZG9CdXR0b24uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyc7XG4gICAgICAgICAgICAgICAgcmVkb0J1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWRvQnV0dG9uLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcjZjJmMmYyJztcbiAgICAgICAgICAgICAgICByZWRvQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdbaGlzdG9yeV0g0KHQvtGB0YLQvtGP0L3QuNC1INC60L3QvtC/0L7QujogdW5kbyA9JywgY2FuVW5kbywgJywgcmVkbyA9JywgY2FuUmVkbyk7XG4gICAgfVxuICAgIGFzeW5jIHVuZG8oKSB7XG4gICAgICAgIGlmICghdGhpcy5jYW5VbmRvKCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1toaXN0b3J5XSBVbmRvINC90LXQstC+0LfQvNC+0LbQtdC9Jyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA9PT0gdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDEgJiYgdGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXggPSB0aGlzLmxheWVyc0hpc3RvcnkubGVuZ3RoIC0gMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCA9IE1hdGgubWF4KDAsIHRoaXMuY3VycmVudEhpc3RvcnlJbmRleCAtIDEpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGhpc3RvcnlJdGVtID0gdGhpcy5sYXllcnNIaXN0b3J5W3RoaXMuY3VycmVudEhpc3RvcnlJbmRleF07XG4gICAgICAgIGlmICghaGlzdG9yeUl0ZW0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2hpc3RvcnldINCY0YHRgtC+0YDQuNGPINC90LUg0L3QsNC50LTQtdC90LAnKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKGBbaGlzdG9yeV0gVW5kbyDQuiDQuNC90LTQtdC60YHRgyAke3RoaXMuY3VycmVudEhpc3RvcnlJbmRleH0g0LjQtyAke3RoaXMubGF5ZXJzSGlzdG9yeS5sZW5ndGggLSAxfWApO1xuICAgICAgICBhd2FpdCB0aGlzLnJlc3RvcmVMYXllcnNGcm9tSGlzdG9yeShoaXN0b3J5SXRlbSk7XG4gICAgICAgIHRoaXMudXBkYXRlSGlzdG9yeUJ1dHRvbnNTdGF0ZSgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgYXN5bmMgcmVkbygpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhblJlZG8oKSkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW2hpc3RvcnldIFJlZG8g0L3QtdCy0L7Qt9C80L7QttC10L0nKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmN1cnJlbnRIaXN0b3J5SW5kZXgrKztcbiAgICAgICAgY29uc3QgaGlzdG9yeUl0ZW0gPSB0aGlzLmxheWVyc0hpc3RvcnlbdGhpcy5jdXJyZW50SGlzdG9yeUluZGV4XTtcbiAgICAgICAgaWYgKCFoaXN0b3J5SXRlbSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbaGlzdG9yeV0g0JjRgdGC0L7RgNC40Y8g0L3QtSDQvdCw0LnQtNC10L3QsCcpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtoaXN0b3J5XSBSZWRvINC6INC40L3QtNC10LrRgdGDICR7dGhpcy5jdXJyZW50SGlzdG9yeUluZGV4fSDQuNC3ICR7dGhpcy5sYXllcnNIaXN0b3J5Lmxlbmd0aCAtIDF9YCk7XG4gICAgICAgIGF3YWl0IHRoaXMucmVzdG9yZUxheWVyc0Zyb21IaXN0b3J5KGhpc3RvcnlJdGVtKTtcbiAgICAgICAgdGhpcy51cGRhdGVIaXN0b3J5QnV0dG9uc1N0YXRlKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBhc3luYyByZXN0b3JlTGF5ZXJzRnJvbUhpc3RvcnkoaGlzdG9yeUl0ZW0pIHtcbiAgICAgICAgdGhpcy5pc1Jlc3RvcmluZ0Zyb21IaXN0b3J5ID0gdHJ1ZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0cyA9IFtdO1xuICAgICAgICAgICAgaGlzdG9yeUl0ZW0ubGF5ZXJzLmZvckVhY2gobGF5b3V0ID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmxheW91dHMucHVzaChuZXcgTGF5b3V0KGxheW91dCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnNob3dMYXlvdXRMaXN0KCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUxheW91dHMoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU3VtKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW2hpc3RvcnldINCS0L7RgdGB0YLQsNC90L7QstC70LXQvdC+ICR7dGhpcy5sYXlvdXRzLmxlbmd0aH0g0YHQu9C+0ZHQsmApO1xuICAgICAgICB9XG4gICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5pc1Jlc3RvcmluZ0Zyb21IaXN0b3J5ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnW2VkaXRvcl0g0J7Rh9C40YHRgtC60LAg0YDQtdGB0YPRgNGB0L7QsiDRgNC10LTQsNC60YLQvtGA0LAnKTtcbiAgICAgICAgaWYgKHRoaXMubG9hZGluZ0ludGVydmFsKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMubG9hZGluZ0ludGVydmFsKTtcbiAgICAgICAgICAgIHRoaXMubG9hZGluZ0ludGVydmFsID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV2ZW50cy5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuY2FudmFzZXMuZm9yRWFjaChjYW52YXMgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjYW52YXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tjbGVhbnVwXSDQntGI0LjQsdC60LAg0L7Rh9C40YHRgtC60LggY2FudmFzOicsIGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNhbnZhc2VzID0gW107XG4gICAgICAgIHRoaXMubGF5ZXJzQ2FudmFzZXMuZm9yRWFjaChjYW52YXMgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjYW52YXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tjbGVhbnVwXSDQntGI0LjQsdC60LAg0L7Rh9C40YHRgtC60LggbGF5ZXIgY2FudmFzOicsIGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxheWVyc0NhbnZhc2VzID0gW107XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tlZGl0b3JdINCg0LXRgdGD0YDRgdGLINGD0YHQv9C10YjQvdC+INC+0YfQuNGJ0LXQvdGLJyk7XG4gICAgfVxuICAgIGdldEN1cnJlbnRTdGF0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IHRoaXMuX3NlbGVjdFR5cGUsXG4gICAgICAgICAgICBjb2xvcjogdGhpcy5fc2VsZWN0Q29sb3IsXG4gICAgICAgICAgICBzaWRlOiB0aGlzLl9zZWxlY3RTaWRlLFxuICAgICAgICAgICAgc2l6ZTogdGhpcy5fc2VsZWN0U2l6ZSxcbiAgICAgICAgICAgIGxheW91dHM6IHRoaXMubGF5b3V0cyxcbiAgICAgICAgICAgIGlzTG9hZGluZzogdGhpcy5pc0xvYWRpbmcsXG4gICAgICAgIH07XG4gICAgfVxufVxuIiwiY29uc3QgcG9wdXBMb2dnZXIgPSBjb25zb2xlLmRlYnVnLmJpbmQoY29uc29sZSwgJ1tQb3B1cF0nKTtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBvcHVwIHtcbiAgICBjb25zdHJ1Y3Rvcih7IHBvcHVwSWQsIHBvcHVwQ29udGVudENsYXNzLCBjbG9zZUJ1dHRvbkNsYXNzLCB0aW1lb3V0U2Vjb25kcyA9IDEwLCBhdXRvU2hvdyA9IHRydWUsIGNvb2tpZU5hbWUgPSAncG9wdXAnLCBjb29raWVFeHBpcmVzRGF5cyA9IDEsIH0pIHtcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbiA9IG51bGw7XG4gICAgICAgIHRoaXMuYXV0b1Nob3cgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5hdXRvU2hvd1RpbWVvdXQgPSBudWxsO1xuICAgICAgICB0aGlzLnRpbWVvdXRTZWNvbmRzID0gMjU7XG4gICAgICAgIHRoaXMuY29va2llTmFtZSA9IFwicG9wdXBcIjtcbiAgICAgICAgdGhpcy5jb29raWVFeHBpcmVzRGF5cyA9IDE7XG4gICAgICAgIGlmICghcG9wdXBJZCB8fCAhcG9wdXBDb250ZW50Q2xhc3MpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tQb3B1cF0gcG9wdXBJZCBvciBwb3B1cENvbnRlbnRDbGFzcyBpcyBub3QgcHJvdmlkZWQnKTtcbiAgICAgICAgY29uc3QgZmluZFBvcHVwQmxvY2sgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwb3B1cElkKTtcbiAgICAgICAgaWYgKCFmaW5kUG9wdXBCbG9jaykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQb3B1cCBibG9jayB3aXRoIGlkICR7cG9wdXBJZH0gbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmluZFBvcHVwQ29udGVudEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLiR7cG9wdXBDb250ZW50Q2xhc3N9YCk7XG4gICAgICAgIGlmICghZmluZFBvcHVwQ29udGVudEJsb2NrKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBvcHVwIGNvbnRlbnQgYmxvY2sgd2l0aCBjbGFzcyAke3BvcHVwQ29udGVudENsYXNzfSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBvcHVwQmxvY2sgPSBmaW5kUG9wdXBCbG9jaztcbiAgICAgICAgdGhpcy5wb3B1cENvbnRlbnRCbG9jayA9IGZpbmRQb3B1cENvbnRlbnRCbG9jaztcbiAgICAgICAgdGhpcy5pbml0UG9wdXBCbG9jaygpO1xuICAgICAgICB0aGlzLnBvcHVwV3JhcHBlckJsb2NrID0gdGhpcy5pbml0UG9wdXBXcmFwcGVyKCk7XG4gICAgICAgIGNvbnN0IGZpbmRDbG9zZUJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke2Nsb3NlQnV0dG9uQ2xhc3N9YCk7XG4gICAgICAgIGlmICghZmluZENsb3NlQnV0dG9uKSB7XG4gICAgICAgICAgICBwb3B1cExvZ2dlcihgY2xvc2UgYnV0dG9uIHdpdGggY2xhc3MgJHtjbG9zZUJ1dHRvbkNsYXNzfSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNsb3NlQnV0dG9uID0gZmluZENsb3NlQnV0dG9uO1xuICAgICAgICB0aGlzLmluaXRDbG9zZUJ1dHRvbigpO1xuICAgICAgICBpZiAodGltZW91dFNlY29uZHMpIHtcbiAgICAgICAgICAgIHRoaXMudGltZW91dFNlY29uZHMgPSB0aW1lb3V0U2Vjb25kcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXV0b1Nob3cpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0b1Nob3cgPSBhdXRvU2hvdztcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29va2llTmFtZSkge1xuICAgICAgICAgICAgdGhpcy5jb29raWVOYW1lID0gY29va2llTmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29va2llRXhwaXJlc0RheXMpIHtcbiAgICAgICAgICAgIHRoaXMuY29va2llRXhwaXJlc0RheXMgPSBjb29raWVFeHBpcmVzRGF5cztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wb3B1cEJsb2NrICYmIHRoaXMuY2xvc2VCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEF1dG9TaG93KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5pdFBvcHVwV3JhcHBlcigpIHtcbiAgICAgICAgY29uc3QgcG9wdXBXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLmlkID0gJ3BvcHVwLXdyYXBwZXInO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUucG9zaXRpb24gPSAnZml4ZWQnO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUucmlnaHQgPSAnMCc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS5ib3R0b20gPSAnMCc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLnpJbmRleCA9ICc5OTk5JztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgICAgIHJldHVybiBwb3B1cFdyYXBwZXI7XG4gICAgfVxuICAgIGluaXRQb3B1cEJsb2NrKCkge1xuICAgICAgICB0aGlzLnBvcHVwQmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9XG4gICAgaW5pdENsb3NlQnV0dG9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuY2xvc2VCdXR0b24pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuY2xvc2VCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmNsb3NlQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNsb3NlKCk7XG4gICAgfVxuICAgIGluaXRBdXRvU2hvdygpIHtcbiAgICAgICAgaWYgKHRoaXMuYXV0b1Nob3cgJiYgIWRvY3VtZW50LmNvb2tpZS5pbmNsdWRlcyhgJHt0aGlzLmNvb2tpZU5hbWV9PXRydWVgKSkge1xuICAgICAgICAgICAgdGhpcy5hdXRvU2hvd1RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuc2hvdygpLCB0aGlzLnRpbWVvdXRTZWNvbmRzICogMTAwMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwb3B1cExvZ2dlcignaXMgbm90IGF1dG8gc2hvd24nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzaG93KCkge1xuICAgICAgICB0aGlzLnBvcHVwV3JhcHBlckJsb2NrLmFwcGVuZENoaWxkKHRoaXMucG9wdXBCbG9jayk7XG4gICAgICAgIHRoaXMucG9wdXBDb250ZW50QmxvY2suc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgdGhpcy5wb3B1cEJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMucG9wdXBXcmFwcGVyQmxvY2spO1xuICAgIH1cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXJCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBkb2N1bWVudC5jb29raWUgPSBgJHt0aGlzLmNvb2tpZU5hbWV9PXRydWU7IGV4cGlyZXM9JHtuZXcgRGF0ZShEYXRlLm5vdygpICsgdGhpcy5jb29raWVFeHBpcmVzRGF5cyAqIDI0ICogNjAgKiA2MCAqIDEwMDApLnRvVVRDU3RyaW5nKCl9OyBwYXRoPS87YDtcbiAgICB9XG59XG4iLCJleHBvcnQgY29uc3QgcHJvZHVjdENvbmZpZ3MgPSBbXG4gICAge1xuICAgICAgICB0eXBlOiAndHNoaXJ0JyxcbiAgICAgICAgcHJvZHVjdE5hbWU6ICfQpNGD0YLQsdC+0LvQutCwJyxcbiAgICAgICAgc2l6ZXM6IFtcIlNcIiwgXCJNXCIsIFwiTFwiLCBcIlhMXCIsIFwiMlhMXCJdLFxuICAgICAgICBwcmljZTogMTI5MCxcbiAgICAgICAgZG91YmxlU2lkZWRQcmljZTogMTU5MCxcbiAgICAgICAgcHJpbnRDb25maWc6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzaWRlOiAnZnJvbnQnLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzaXplOiB7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAyNTAsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogMzUwLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNpZGU6ICdiYWNrJyxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2l6ZToge1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogMjUwLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDQwMCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICBtb2NrdXBzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2lkZTogJ2Zyb250JyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL3Jlcy5jbG91ZGluYXJ5LmNvbS9kcXQzZ25pbXUvaW1hZ2UvdXBsb2FkL3YxNzUzOTU4MTUxL3doaXRlX21vY2t1cC53ZWJwJyxcbiAgICAgICAgICAgICAgICBjb2xvcjogeyBuYW1lOiAnd2hpdGUnLCBoZXg6ICcjZmZmZmZmJyB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzaWRlOiAnYmFjaycsXG4gICAgICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9yZXMuY2xvdWRpbmFyeS5jb20vZHF0M2duaW11L2ltYWdlL3VwbG9hZC92MTc1NTMzNDIyNy93aGl0ZV9tb2NrdXBfYmFjay53ZWJwJyxcbiAgICAgICAgICAgICAgICBjb2xvcjogeyBuYW1lOiAnd2hpdGUnLCBoZXg6ICcjZmZmZmZmJyB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzaWRlOiAnZnJvbnQnLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vcmVzLmNsb3VkaW5hcnkuY29tL2RxdDNnbmltdS9pbWFnZS91cGxvYWQvdjE3NTM5NTkxMzcvYmxhY2tfbW9ja3VwLndlYnAnLFxuICAgICAgICAgICAgICAgIGNvbG9yOiB7IG5hbWU6ICdibGFjaycsIGhleDogJyMwMDAwMDAnIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNpZGU6ICdiYWNrJyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL3Jlcy5jbG91ZGluYXJ5LmNvbS9kcXQzZ25pbXUvaW1hZ2UvdXBsb2FkL3YxNzU0ODk2OTY0L2JsYWNrX21vY2t1cF9iYWNrLndlYnAnLFxuICAgICAgICAgICAgICAgIGNvbG9yOiB7IG5hbWU6ICdibGFjaycsIGhleDogJyMwMDAwMDAnIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIHR5cGU6ICdob29kaWUnLFxuICAgICAgICBwcm9kdWN0TmFtZTogJ9Ci0L7Qu9GB0YLQvtCy0LrQsCcsXG4gICAgICAgIHNpemVzOiBbXCJTXCIsIFwiTVwiLCBcIkxcIiwgXCJYTFwiLCBcIjJYTFwiXSxcbiAgICAgICAgcHJpY2U6IDI1OTAsXG4gICAgICAgIGRvdWJsZVNpZGVkUHJpY2U6IDI4OTAsXG4gICAgICAgIHByaW50Q29uZmlnOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2lkZTogJ2Zyb250JyxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgICAgICB5OiAtOSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNpemU6IHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDI1MCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAxODAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2lkZTogJ2JhY2snLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzaXplOiB7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAyNTAsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogMzAwLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIG1vY2t1cHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzaWRlOiAnZnJvbnQnLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vcmVzLmNsb3VkaW5hcnkuY29tL2RxdDNnbmltdS9pbWFnZS91cGxvYWQvdjE3NTY5NzgxMzkvd2hpdGVfaG9kZGllX21vY2t1cC53ZWJwJyxcbiAgICAgICAgICAgICAgICBjb2xvcjogeyBuYW1lOiAnd2hpdGUnLCBoZXg6ICcjZmZmZmZmJyB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzaWRlOiAnYmFjaycsXG4gICAgICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9yZXMuY2xvdWRpbmFyeS5jb20vZHF0M2duaW11L2ltYWdlL3VwbG9hZC92MTc1Njk3ODEzOS93aGl0ZV9ob2RkaWVfbW9ja3VwX2JhY2sud2VicCcsXG4gICAgICAgICAgICAgICAgY29sb3I6IHsgbmFtZTogJ3doaXRlJywgaGV4OiAnI2ZmZmZmZicgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2lkZTogJ2Zyb250JyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL3Jlcy5jbG91ZGluYXJ5LmNvbS9kcXQzZ25pbXUvaW1hZ2UvdXBsb2FkL3YxNzU2OTc4MTM5L2JsYWNrX2hvZGRpZV9tb2NrdXAud2VicCcsXG4gICAgICAgICAgICAgICAgY29sb3I6IHsgbmFtZTogJ2JsYWNrJywgaGV4OiAnIzAwMDAwMCcgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2lkZTogJ2JhY2snLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vcmVzLmNsb3VkaW5hcnkuY29tL2RxdDNnbmltdS9pbWFnZS91cGxvYWQvdjE3NTY5NzgxMzkvYmxhY2tfaG9kZGllX21vY2t1cF9iYWNrLndlYnAnLFxuICAgICAgICAgICAgICAgIGNvbG9yOiB7IG5hbWU6ICdibGFjaycsIGhleDogJyMwMDAwMDAnIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH1cbl07XG5leHBvcnQgY29uc3QgZWRpdG9yQmxvY2tzID0ge1xuICAgIGVkaXRvckJsb2NrQ2xhc3M6ICcuZWRpdG9yLWJsb2NrJyxcbiAgICBjaGFuZ2VTaWRlQnV0dG9uQ2xhc3M6ICcuY2hhbmdlLXNpZGUtYnV0dG9uJyxcbiAgICBwcm9kdWN0TGlzdEJsb2NrQ2xhc3M6ICcucHJvZHVjdC1saXN0JyxcbiAgICBwcm9kdWN0SXRlbUNsYXNzOiAnLnByb2R1Y3QtaXRlbScsXG4gICAgcHJvZHVjdEl0ZW1JbWFnZUNsYXNzOiAnLnByb2R1Y3QtaXRlbS1pbWFnZScsXG4gICAgcHJvZHVjdEl0ZW1UZXh0Q2xhc3M6ICcucHJvZHVjdC1pdGVtLXRleHQnLFxuICAgIGVkaXRvclN1bUJsb2NrQ2xhc3M6ICcuZWRpdG9yLXN1bScsXG4gICAgZWRpdG9yU2V0dGluZ3NCbG9ja0NsYXNzOiAnLmVkaXRvci1zZXR0aW5ncycsXG4gICAgZWRpdG9ySGlzdG9yeVVuZG9CbG9ja0NsYXNzOiAnLmVkaXRvci1oaXN0b3J5LXVuZG8nLFxuICAgIGVkaXRvckhpc3RvcnlSZWRvQmxvY2tDbGFzczogJy5lZGl0b3ItaGlzdG9yeS1yZWRvJyxcbiAgICBlZGl0b3JDbGlwSW1hZ2VCbG9ja0NsYXNzOiAnLmVkaXRvci1zZXR0aW5nc19fY2xpcC1pbWFnZScsXG4gICAgZWRpdG9yQWRkT3JkZXJCdXR0b25DbGFzczogJy5lZGl0b3Itc2V0dGluZ3NfX2FkZC1vcmRlci1idXR0b24nLFxuICAgIGVkaXRvclByb2R1Y3ROYW1lQ2xhc3M6ICcuZWRpdG9yLXNldHRpbmdzX19wcm9kdWN0LW5hbWUnLFxuICAgIGVkaXRvckNvbG9yc0xpc3RCbG9ja0NsYXNzOiAnLmVkaXRvci1zZXR0aW5nc19fY29sb3JzLWxpc3QnLFxuICAgIGVkaXRvckNvbG9ySXRlbUJsb2NrQ2xhc3M6ICcuZWRpdG9yLXNldHRpbmdzX19jb2xvci1pdGVtJyxcbiAgICBlZGl0b3JTaXplc0xpc3RCbG9ja0NsYXNzOiAnLmVkaXRvci1zZXR0aW5nc19fc2l6ZXMtbGlzdCcsXG4gICAgZWRpdG9yU2l6ZUl0ZW1CbG9ja0NsYXNzOiAnLmVkaXRvci1zZXR0aW5nc19fc2l6ZS1pdGVtJyxcbiAgICBlZGl0b3JMYXlvdXRzTGlzdEJsb2NrQ2xhc3M6ICcuZWRpdG9yLWxheW91dHNfX2xheW91dHMtbGlzdCcsXG4gICAgZWRpdG9yTGF5b3V0SXRlbUJsb2NrQ2xhc3M6ICcuZWRpdG9yLWxheW91dHNfX2xheW91dC1pdGVtJyxcbiAgICBlZGl0b3JMYXlvdXRJdGVtQmxvY2tWaWV3Q2xhc3M6ICcuZWRpdG9yLWxheW91dHNfX2xheW91dC1pdGVtLXZpZXcnLFxuICAgIGVkaXRvckxheW91dEl0ZW1CbG9ja05hbWVDbGFzczogJy5lZGl0b3ItbGF5b3V0c19fbGF5b3V0LWl0ZW0tbmFtZScsXG4gICAgZWRpdG9yTGF5b3V0SXRlbUJsb2NrUmVtb3ZlQ2xhc3M6ICcuZWRpdG9yLWxheW91dHNfX2xheW91dC1pdGVtLXJlbW92ZScsXG4gICAgZWRpdG9yTGF5b3V0SXRlbUJsb2NrRWRpdENsYXNzOiAnLmVkaXRvci1sYXlvdXRzX19sYXlvdXQtaXRlbS1lZGl0JyxcbiAgICBlZGl0b3JVcGxvYWRJbWFnZUJ1dHRvbkNsYXNzOiAnLmVkaXRvci11cGxvYWQtaW1hZ2UtYnV0dG9uJyxcbiAgICBlZGl0b3JVcGxvYWRWaWV3QmxvY2tDbGFzczogJy5lZGl0b3ItdXBsb2FkLXZpZXctYmxvY2snLFxuICAgIGVkaXRvclVwbG9hZENhbmNlbEJ1dHRvbkNsYXNzOiAnLmVkaXRvci11cGxvYWQtY2FuY2VsLWJ1dHRvbicsXG4gICAgZWRpdG9yUXVhbnRpdHlGb3JtQmxvY2tDbGFzczogJy5lZGl0b3ItcXVhbnRpdHktZm9ybScsXG4gICAgZWRpdG9yTG9hZFdpdGhBaUJ1dHRvbkNsYXNzOiAnLmVkaXRvci1sb2FkLXdpdGgtYWktYnV0dG9uJyxcbiAgICBlZGl0b3JMb2FkV2l0aG91dEFpQnV0dG9uQ2xhc3M6ICcuZWRpdG9yLWxvYWQtd2l0aG91dC1haS1idXR0b24nLFxufTtcbmV4cG9ydCBjb25zdCBmb3JtQ29uZmlnID0ge1xuICAgIGZvcm1CbG9ja0NsYXNzOiAnLmVkaXRvci1mb3JtJyxcbiAgICBmb3JtQnV0dG9uQ2xhc3M6ICcuZWRpdG9yLWZvcm1fX2J1dHRvbicsXG4gICAgZm9ybUlucHV0VmFyaWFibGVOYW1lOiAncHJvbXB0Jyxcbn07XG4iLCJleHBvcnQgY2xhc3MgRWRpdG9yU3RvcmFnZU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmRhdGFiYXNlID0gbnVsbDtcbiAgICAgICAgdGhpcy5pc1JlYWR5ID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVhZHlQcm9taXNlID0gdGhpcy5pbml0KCk7XG4gICAgfVxuICAgIGFzeW5jIGluaXQoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBvcGVuUmVxdWVzdCA9IGluZGV4ZWREQi5vcGVuKFwiZWRpdG9yXCIsIDIpO1xuICAgICAgICAgICAgb3BlblJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0YWJhc2UgPSBldmVudC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICAgIGlmICghZGF0YWJhc2Uub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucygnaGlzdG9yeScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLmNyZWF0ZU9iamVjdFN0b3JlKCdoaXN0b3J5JywgeyBrZXlQYXRoOiAnaWQnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWRhdGFiYXNlLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoJ2VkaXRvcl9zdGF0ZScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLmNyZWF0ZU9iamVjdFN0b3JlKCdlZGl0b3Jfc3RhdGUnLCB7IGtleVBhdGg6ICdrZXknIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWRhdGFiYXNlLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoJ3VzZXJfZGF0YScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLmNyZWF0ZU9iamVjdFN0b3JlKCd1c2VyX2RhdGEnLCB7IGtleVBhdGg6ICdrZXknIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBvcGVuUmVxdWVzdC5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLQntGI0LjQsdC60LAg0L7RgtC60YDRi9GC0LjRjyBJbmRleGVkREJcIiwgb3BlblJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlamVjdChvcGVuUmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgb3BlblJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YWJhc2UgPSBvcGVuUmVxdWVzdC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgdGhpcy5pc1JlYWR5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgd2FpdEZvclJlYWR5KCkge1xuICAgICAgICBhd2FpdCB0aGlzLnJlYWR5UHJvbWlzZTtcbiAgICB9XG4gICAgYXN5bmMgc2F2ZUVkaXRvclN0YXRlKHN0YXRlKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydlZGl0b3Jfc3RhdGUnXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdlZGl0b3Jfc3RhdGUnKTtcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgdGhpcy5wdXREYXRhKG9iamVjdFN0b3JlLCAnZGF0ZScsIHN0YXRlLmRhdGUpLFxuICAgICAgICAgICAgdGhpcy5wdXREYXRhKG9iamVjdFN0b3JlLCAnY29sb3InLCBzdGF0ZS5jb2xvciksXG4gICAgICAgICAgICB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICdzaWRlJywgc3RhdGUuc2lkZSksXG4gICAgICAgICAgICB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICd0eXBlJywgc3RhdGUudHlwZSksXG4gICAgICAgICAgICB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICdzaXplJywgc3RhdGUuc2l6ZSlcbiAgICAgICAgXSk7XG4gICAgfVxuICAgIGFzeW5jIGxvYWRFZGl0b3JTdGF0ZSgpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2VkaXRvcl9zdGF0ZSddLCAncmVhZG9ubHknKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnZWRpdG9yX3N0YXRlJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBbZGF0ZSwgY29sb3IsIHNpZGUsIHR5cGUsIHNpemVdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ2RhdGUnKSxcbiAgICAgICAgICAgICAgICB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICdjb2xvcicpLFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ3NpZGUnKSxcbiAgICAgICAgICAgICAgICB0aGlzLmdldERhdGEob2JqZWN0U3RvcmUsICd0eXBlJyksXG4gICAgICAgICAgICAgICAgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAnc2l6ZScpXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIGlmICghZGF0ZSB8fCAhY29sb3IgfHwgIXNpZGUgfHwgIXR5cGUgfHwgIXNpemUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZGF0ZSxcbiAgICAgICAgICAgICAgICBjb2xvcixcbiAgICAgICAgICAgICAgICBzaWRlLFxuICAgICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgICAgc2l6ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ9Ce0YjQuNCx0LrQsCDQt9Cw0LPRgNGD0LfQutC4INGB0L7RgdGC0L7Rj9C90LjRjyDRgNC10LTQsNC60YLQvtGA0LA6JywgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgY2xlYXJFZGl0b3JTdGF0ZSgpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2VkaXRvcl9zdGF0ZSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2VkaXRvcl9zdGF0ZScpO1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZURhdGEob2JqZWN0U3RvcmUsICdkYXRlJyksXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZURhdGEob2JqZWN0U3RvcmUsICdjb2xvcicpLFxuICAgICAgICAgICAgdGhpcy5kZWxldGVEYXRhKG9iamVjdFN0b3JlLCAnc2lkZScpLFxuICAgICAgICAgICAgdGhpcy5kZWxldGVEYXRhKG9iamVjdFN0b3JlLCAndHlwZScpLFxuICAgICAgICAgICAgdGhpcy5kZWxldGVEYXRhKG9iamVjdFN0b3JlLCAnc2l6ZScpXG4gICAgICAgIF0pO1xuICAgIH1cbiAgICBhc3luYyBnZXRVc2VySWQoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWyd1c2VyX2RhdGEnXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd1c2VyX2RhdGEnKTtcbiAgICAgICAgbGV0IHVzZXJJZCA9IGF3YWl0IHRoaXMuZ2V0RGF0YShvYmplY3RTdG9yZSwgJ3VzZXJJZCcpO1xuICAgICAgICBpZiAoIXVzZXJJZCkge1xuICAgICAgICAgICAgdXNlcklkID0gY3J5cHRvLnJhbmRvbVVVSUQoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucHV0RGF0YShvYmplY3RTdG9yZSwgJ3VzZXJJZCcsIHVzZXJJZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVzZXJJZDtcbiAgICB9XG4gICAgYXN5bmMgc2F2ZVRvSGlzdG9yeShpdGVtLCBkZXNjcmlwdGlvbikge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgaGlzdG9yeUl0ZW0gPSB7XG4gICAgICAgICAgICAuLi5pdGVtLFxuICAgICAgICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24gfHwgYNCY0LfQvNC10L3QtdC90LjRjyDQvtGCICR7bmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpfWBcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmFkZChoaXN0b3J5SXRlbSk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBoaXN0b3J5SXRlbS5pZDtcbiAgICB9XG4gICAgYXN5bmMgc2F2ZUxheWVyT3BlcmF0aW9uKG9wZXJhdGlvbiwgbGF5b3V0LCBzaWRlLCB0eXBlLCBkZXNjcmlwdGlvbikge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgbGF5ZXJIaXN0b3J5SXRlbSA9IHtcbiAgICAgICAgICAgIGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgb3BlcmF0aW9uLFxuICAgICAgICAgICAgbGF5b3V0OiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGxheW91dCkpLFxuICAgICAgICAgICAgc2lkZSxcbiAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24gfHwgYCR7b3BlcmF0aW9uID09PSAnYWRkJyA/ICfQlNC+0LHQsNCy0LvQtdC9JyA6ICfQo9C00LDQu9C10L0nfSDRgdC70L7QuTogJHtsYXlvdXQubmFtZSB8fCBsYXlvdXQudHlwZX1gXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5hZGQoeyAuLi5sYXllckhpc3RvcnlJdGVtLCBpc0xheWVyT3BlcmF0aW9uOiB0cnVlIH0pO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbGF5ZXJIaXN0b3J5SXRlbS5pZDtcbiAgICB9XG4gICAgYXN5bmMgZ2V0TGF5ZXJIaXN0b3J5KGZpbHRlciwgbGltaXQgPSA1MCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKFsnaGlzdG9yeSddLCAncmVhZG9ubHknKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG9iamVjdFN0b3JlLmdldEFsbCgpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsSXRlbXMgPSByZXF1ZXN0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICBjb25zdCBsYXllck9wZXJhdGlvbnMgPSBhbGxJdGVtc1xuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKChpdGVtKSA9PiBpdGVtLmlzTGF5ZXJPcGVyYXRpb24gJiYgaXRlbS5zaWRlID09PSBmaWx0ZXIuc2lkZSAmJiBpdGVtLnR5cGUgPT09IGZpbHRlci50eXBlKVxuICAgICAgICAgICAgICAgICAgICAubWFwKChpdGVtKSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICBpZDogaXRlbS5pZCxcbiAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wOiBpdGVtLnRpbWVzdGFtcCxcbiAgICAgICAgICAgICAgICAgICAgb3BlcmF0aW9uOiBpdGVtLm9wZXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgbGF5b3V0OiBpdGVtLmxheW91dCxcbiAgICAgICAgICAgICAgICAgICAgc2lkZTogaXRlbS5zaWRlLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBpdGVtLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBpdGVtLmRlc2NyaXB0aW9uXG4gICAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiBiLnRpbWVzdGFtcCAtIGEudGltZXN0YW1wKVxuICAgICAgICAgICAgICAgICAgICAuc2xpY2UoMCwgbGltaXQpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUobGF5ZXJPcGVyYXRpb25zKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBnZXRSZWNlbnRMYXllck9wZXJhdGlvbnMoZmlsdGVyLCBsaW1pdCA9IDEwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldExheWVySGlzdG9yeShmaWx0ZXIsIGxpbWl0KTtcbiAgICB9XG4gICAgYXN5bmMgZ2V0SGlzdG9yeShmaWx0ZXIsIGxpbWl0ID0gNTApIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWRvbmx5Jyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5nZXRBbGwoKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsbEl0ZW1zID0gcmVxdWVzdC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyZWRJdGVtcyA9IGFsbEl0ZW1zXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoaXRlbSA9PiBpdGVtLnNpZGUgPT09IGZpbHRlci5zaWRlICYmIGl0ZW0udHlwZSA9PT0gZmlsdGVyLnR5cGUpXG4gICAgICAgICAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiBiLnRpbWVzdGFtcCAtIGEudGltZXN0YW1wKVxuICAgICAgICAgICAgICAgICAgICAuc2xpY2UoMCwgbGltaXQpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZmlsdGVyZWRJdGVtcyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgZ2V0SGlzdG9yeUl0ZW0oaWQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWRvbmx5Jyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2hpc3RvcnknKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5nZXQoaWQpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKHJlcXVlc3QucmVzdWx0IHx8IG51bGwpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgZGVsZXRlSGlzdG9yeUl0ZW0oaWQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2hpc3RvcnknXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICBjb25zdCBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdoaXN0b3J5Jyk7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5kZWxldGUoaWQpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBjbGVhckhpc3RvcnkoZmlsdGVyKSB7XG4gICAgICAgIGF3YWl0IHRoaXMud2FpdEZvclJlYWR5KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhYmFzZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YWJhc2Ug0L3QtSDQuNC90LjRhtC40LDQu9C40LfQuNGA0L7QstCw0L3QsCcpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24oWydoaXN0b3J5J10sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnaGlzdG9yeScpO1xuICAgICAgICBpZiAoIWZpbHRlcikge1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5jbGVhcigpO1xuICAgICAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgYWxsSXRlbXMgPSBhd2FpdCB0aGlzLmdldEhpc3RvcnkoZmlsdGVyLCAxMDAwKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBhbGxJdGVtcykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZGVsZXRlSGlzdG9yeUl0ZW0oaXRlbS5pZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgc2F2ZUxheWVycyhsYXllcnMpIHtcbiAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yUmVhZHkoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFiYXNlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSDQvdC1INC40L3QuNGG0LjQsNC70LjQt9C40YDQvtCy0LDQvdCwJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2VkaXRvcl9zdGF0ZSddLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2VkaXRvcl9zdGF0ZScpO1xuICAgICAgICBhd2FpdCB0aGlzLnB1dERhdGEob2JqZWN0U3RvcmUsICdsYXllcnMnLCBsYXllcnMpO1xuICAgIH1cbiAgICBhc3luYyBsb2FkTGF5ZXJzKCkge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSZWFkeSgpO1xuICAgICAgICBpZiAoIXRoaXMuZGF0YWJhc2UpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlINC90LUg0LjQvdC40YbQuNCw0LvQuNC30LjRgNC+0LLQsNC90LAnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihbJ2VkaXRvcl9zdGF0ZSddLCAncmVhZG9ubHknKTtcbiAgICAgICAgICAgIGNvbnN0IG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ2VkaXRvcl9zdGF0ZScpO1xuICAgICAgICAgICAgY29uc3QgbGF5ZXJzID0gYXdhaXQgdGhpcy5nZXREYXRhKG9iamVjdFN0b3JlLCAnbGF5ZXJzJyk7XG4gICAgICAgICAgICByZXR1cm4gbGF5ZXJzIHx8IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfQntGI0LjQsdC60LAg0LfQsNCz0YDRg9C30LrQuCDRgdC70L7RkdCyOicsIGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHB1dERhdGEob2JqZWN0U3RvcmUsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5wdXQoeyBrZXksIHZhbHVlIH0pO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXREYXRhKG9iamVjdFN0b3JlLCBrZXkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5nZXQoa2V5KTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZShyZXF1ZXN0LnJlc3VsdD8udmFsdWUgfHwgbnVsbCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBkZWxldGVEYXRhKG9iamVjdFN0b3JlLCBrZXkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBvYmplY3RTdG9yZS5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCJjb25zdCBERUZBVUxUX1ZBTFVFUyA9IHtcbiAgICBQT1NJVElPTjogeyB4OiAwLCB5OiAwIH0sXG4gICAgU0laRTogMSxcbiAgICBBU1BFQ1RfUkFUSU86IDEsXG4gICAgQU5HTEU6IDAsXG4gICAgVEVYVDogJ1ByaW50TG9vcCcsXG4gICAgRk9OVDogeyBmYW1pbHk6ICdBcmlhbCcsIHNpemU6IDEyIH0sXG59O1xuZXhwb3J0IGNsYXNzIExheW91dCB7XG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgdGhpcy5pZCA9IHByb3BzLmlkIHx8IExheW91dC5nZW5lcmF0ZUlkKCk7XG4gICAgICAgIHRoaXMudHlwZSA9IHByb3BzLnR5cGU7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwcm9wcy5wb3NpdGlvbiB8fCB7IC4uLkRFRkFVTFRfVkFMVUVTLlBPU0lUSU9OIH07XG4gICAgICAgIHRoaXMuc2l6ZSA9IHRoaXMudmFsaWRhdGVTaXplKHByb3BzLnNpemUgPz8gREVGQVVMVF9WQUxVRVMuU0laRSk7XG4gICAgICAgIHRoaXMuYXNwZWN0UmF0aW8gPSB0aGlzLnZhbGlkYXRlQXNwZWN0UmF0aW8ocHJvcHMuYXNwZWN0UmF0aW8gPz8gREVGQVVMVF9WQUxVRVMuQVNQRUNUX1JBVElPKTtcbiAgICAgICAgdGhpcy52aWV3ID0gcHJvcHMudmlldztcbiAgICAgICAgdGhpcy5hbmdsZSA9IHRoaXMubm9ybWFsaXplQW5nbGUocHJvcHMuYW5nbGUgPz8gREVGQVVMVF9WQUxVRVMuQU5HTEUpO1xuICAgICAgICB0aGlzLm5hbWUgPSBwcm9wcy5uYW1lID8/IG51bGw7XG4gICAgICAgIGlmIChwcm9wcy50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICB0aGlzLnVybCA9IHByb3BzLnVybDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChwcm9wcy50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgIHRoaXMudGV4dCA9IHByb3BzLnRleHQgfHwgREVGQVVMVF9WQUxVRVMuVEVYVDtcbiAgICAgICAgICAgIHRoaXMuZm9udCA9IHByb3BzLmZvbnQgPyB7IC4uLnByb3BzLmZvbnQgfSA6IHsgLi4uREVGQVVMVF9WQUxVRVMuRk9OVCB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBnZW5lcmF0ZUlkKCkge1xuICAgICAgICBpZiAodHlwZW9mIGNyeXB0byAhPT0gJ3VuZGVmaW5lZCcgJiYgY3J5cHRvLnJhbmRvbVVVSUQpIHtcbiAgICAgICAgICAgIHJldHVybiBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCAxMSl9YDtcbiAgICB9XG4gICAgdmFsaWRhdGVTaXplKHNpemUpIHtcbiAgICAgICAgaWYgKHNpemUgPD0gMCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBJbnZhbGlkIHNpemUgJHtzaXplfSwgdXNpbmcgZGVmYXVsdCAke0RFRkFVTFRfVkFMVUVTLlNJWkV9YCk7XG4gICAgICAgICAgICByZXR1cm4gREVGQVVMVF9WQUxVRVMuU0laRTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2l6ZTtcbiAgICB9XG4gICAgdmFsaWRhdGVBc3BlY3RSYXRpbyhyYXRpbykge1xuICAgICAgICBpZiAocmF0aW8gPD0gMCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBJbnZhbGlkIGFzcGVjdCByYXRpbyAke3JhdGlvfSwgdXNpbmcgZGVmYXVsdCAke0RFRkFVTFRfVkFMVUVTLkFTUEVDVF9SQVRJT31gKTtcbiAgICAgICAgICAgIHJldHVybiBERUZBVUxUX1ZBTFVFUy5BU1BFQ1RfUkFUSU87XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJhdGlvO1xuICAgIH1cbiAgICBub3JtYWxpemVBbmdsZShhbmdsZSkge1xuICAgICAgICBjb25zdCBub3JtYWxpemVkID0gYW5nbGUgJSAzNjA7XG4gICAgICAgIHJldHVybiBub3JtYWxpemVkIDwgMCA/IG5vcm1hbGl6ZWQgKyAzNjAgOiBub3JtYWxpemVkO1xuICAgIH1cbiAgICBpc0ltYWdlTGF5b3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlID09PSAnaW1hZ2UnICYmIHRoaXMudXJsICE9PSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlzVGV4dExheW91dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZSA9PT0gJ3RleHQnICYmIHRoaXMudGV4dCAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZm9udCAhPT0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBzZXRQb3NpdGlvbih4LCB5KSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSB7IHgsIHkgfTtcbiAgICB9XG4gICAgbW92ZShkeCwgZHkpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbi54ICs9IGR4O1xuICAgICAgICB0aGlzLnBvc2l0aW9uLnkgKz0gZHk7XG4gICAgfVxuICAgIHNldFNpemUoc2l6ZSkge1xuICAgICAgICB0aGlzLnNpemUgPSB0aGlzLnZhbGlkYXRlU2l6ZShzaXplKTtcbiAgICB9XG4gICAgcm90YXRlKGFuZ2xlKSB7XG4gICAgICAgIHRoaXMuYW5nbGUgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKHRoaXMuYW5nbGUgKyBhbmdsZSk7XG4gICAgfVxuICAgIHNldEFuZ2xlKGFuZ2xlKSB7XG4gICAgICAgIHRoaXMuYW5nbGUgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKGFuZ2xlKTtcbiAgICB9XG4gICAgc2V0VGV4dCh0ZXh0KSB7XG4gICAgICAgIGlmICh0aGlzLmlzVGV4dExheW91dCgpKSB7XG4gICAgICAgICAgICB0aGlzLnRleHQgPSB0ZXh0O1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldEZvbnQoZm9udCkge1xuICAgICAgICBpZiAodGhpcy5pc1RleHRMYXlvdXQoKSAmJiB0aGlzLmZvbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZm9udCA9IHsgLi4udGhpcy5mb250LCAuLi5mb250IH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2xvbmUoKSB7XG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdpbWFnZScsXG4gICAgICAgICAgICAgICAgdXJsOiB0aGlzLnVybCxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyAuLi50aGlzLnBvc2l0aW9uIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogdGhpcy5zaXplLFxuICAgICAgICAgICAgICAgIGFzcGVjdFJhdGlvOiB0aGlzLmFzcGVjdFJhdGlvLFxuICAgICAgICAgICAgICAgIHZpZXc6IHRoaXMudmlldyxcbiAgICAgICAgICAgICAgICBhbmdsZTogdGhpcy5hbmdsZSxcbiAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBMYXlvdXQocHJvcHMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgcHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7IC4uLnRoaXMucG9zaXRpb24gfSxcbiAgICAgICAgICAgICAgICBzaXplOiB0aGlzLnNpemUsXG4gICAgICAgICAgICAgICAgYXNwZWN0UmF0aW86IHRoaXMuYXNwZWN0UmF0aW8sXG4gICAgICAgICAgICAgICAgdmlldzogdGhpcy52aWV3LFxuICAgICAgICAgICAgICAgIGFuZ2xlOiB0aGlzLmFuZ2xlLFxuICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAodGhpcy50ZXh0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBwcm9wcy50ZXh0ID0gdGhpcy50ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZm9udCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcHJvcHMuZm9udCA9IHsgLi4udGhpcy5mb250IH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IExheW91dChwcm9wcyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdG9KU09OKCkge1xuICAgICAgICBjb25zdCBiYXNlID0ge1xuICAgICAgICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICAgICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5wb3NpdGlvbixcbiAgICAgICAgICAgIHNpemU6IHRoaXMuc2l6ZSxcbiAgICAgICAgICAgIGFzcGVjdFJhdGlvOiB0aGlzLmFzcGVjdFJhdGlvLFxuICAgICAgICAgICAgdmlldzogdGhpcy52aWV3LFxuICAgICAgICAgICAgYW5nbGU6IHRoaXMuYW5nbGUsXG4gICAgICAgICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgIH07XG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgICAgIHJldHVybiB7IC4uLmJhc2UsIHVybDogdGhpcy51cmwgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLnR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgICAgICAgcmV0dXJuIHsgLi4uYmFzZSwgdGV4dDogdGhpcy50ZXh0LCBmb250OiB0aGlzLmZvbnQgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmFzZTtcbiAgICB9XG4gICAgc3RhdGljIGZyb21KU09OKGpzb24pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMYXlvdXQoanNvbik7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGVJbWFnZShwcm9wcykge1xuICAgICAgICByZXR1cm4gbmV3IExheW91dCh7IC4uLnByb3BzLCB0eXBlOiAnaW1hZ2UnIH0pO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlVGV4dChwcm9wcykge1xuICAgICAgICByZXR1cm4gbmV3IExheW91dCh7IC4uLnByb3BzLCB0eXBlOiAndGV4dCcgfSk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGNsYXNzIFR5cGVkRXZlbnRFbWl0dGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIG9uKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgICBpZiAoIXRoaXMubGlzdGVuZXJzLmhhcyhldmVudCkpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLnNldChldmVudCwgbmV3IFNldCgpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpc3RlbmVycy5nZXQoZXZlbnQpLmFkZChsaXN0ZW5lcik7XG4gICAgfVxuICAgIG9uY2UoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIGNvbnN0IG9uY2VXcmFwcGVyID0gKGRldGFpbCkgPT4ge1xuICAgICAgICAgICAgbGlzdGVuZXIoZGV0YWlsKTtcbiAgICAgICAgICAgIHRoaXMub2ZmKGV2ZW50LCBvbmNlV3JhcHBlcik7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMub24oZXZlbnQsIG9uY2VXcmFwcGVyKTtcbiAgICB9XG4gICAgb2ZmKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgICBjb25zdCBldmVudExpc3RlbmVycyA9IHRoaXMubGlzdGVuZXJzLmdldChldmVudCk7XG4gICAgICAgIGlmIChldmVudExpc3RlbmVycykge1xuICAgICAgICAgICAgZXZlbnRMaXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcbiAgICAgICAgICAgIGlmIChldmVudExpc3RlbmVycy5zaXplID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuZGVsZXRlKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBlbWl0KGV2ZW50LCBkZXRhaWwpIHtcbiAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycy5nZXQoZXZlbnQpO1xuICAgICAgICBpZiAoZXZlbnRMaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIGV2ZW50TGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyKGRldGFpbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbRXZlbnRFbWl0dGVyXSDQntGI0LjQsdC60LAg0LIg0L7QsdGA0LDQsdC+0YLRh9C40LrQtSDRgdC+0LHRi9GC0LjRjyBcIiR7U3RyaW5nKGV2ZW50KX1cIjpgLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudCkge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuZGVsZXRlKGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmNsZWFyKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGlzdGVuZXJDb3VudChldmVudCkge1xuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lcnMuZ2V0KGV2ZW50KT8uc2l6ZSB8fCAwO1xuICAgIH1cbiAgICBoYXNMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXJDb3VudChldmVudCkgPiAwO1xuICAgIH1cbiAgICBldmVudE5hbWVzKCkge1xuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLmxpc3RlbmVycy5rZXlzKCkpO1xuICAgIH1cbiAgICBkZXN0cm95KCkge1xuICAgICAgICB0aGlzLmxpc3RlbmVycy5jbGVhcigpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IEVkaXRvclN0b3JhZ2VNYW5hZ2VyIH0gZnJvbSAnLi4vbWFuYWdlcnMvRWRpdG9yU3RvcmFnZU1hbmFnZXInO1xuaW1wb3J0IHsgcHJvZHVjdENvbmZpZ3MgfSBmcm9tICcuLi9jb25maWcvcHJvZHVjdHMnO1xuY29uc3QgQVBJX0VORFBPSU5UUyA9IHtcbiAgICBXRUJIT09LX1JFUVVFU1Q6ICdodHRwczovL3ByaW1hcnktcHJvZHVjdGlvbi02NTRjLnVwLnJhaWx3YXkuYXBwL3dlYmhvb2svcmVxdWVzdCcsXG59O1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlSW1hZ2UoeyBwcm9tcHQsIHNoaXJ0Q29sb3IsIGltYWdlLCB3aXRoQWksIGxheW91dElkLCBpc05ldyA9IHRydWUsIH0pIHtcbiAgICBjb25zdCB0ZW1wU3RvcmFnZU1hbmFnZXIgPSBuZXcgRWRpdG9yU3RvcmFnZU1hbmFnZXIoKTtcbiAgICBjb25zdCB1c2VySWQgPSBhd2FpdCB0ZW1wU3RvcmFnZU1hbmFnZXIuZ2V0VXNlcklkKCk7XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICBmb3JtRGF0YS5zZXQoJ3VzZXJJZCcsIHVzZXJJZCk7XG4gICAgZm9ybURhdGEuc2V0KCdwcm9tcHQnLCBwcm9tcHQpO1xuICAgIGZvcm1EYXRhLnNldCgnc2hpcnRDb2xvcicsIHNoaXJ0Q29sb3IpO1xuICAgIGZvcm1EYXRhLnNldCgncGxhY2VtZW50JywgJ2NlbnRlcicpO1xuICAgIGZvcm1EYXRhLnNldCgncHJpbnRTaXplJywgXCJiaWdcIik7XG4gICAgZm9ybURhdGEuc2V0KCd0cmFuc2ZlclR5cGUnLCAnJyk7XG4gICAgZm9ybURhdGEuc2V0KCdyZXF1ZXN0X3R5cGUnLCAnZ2VuZXJhdGUnKTtcbiAgICBpZiAobGF5b3V0SWQpXG4gICAgICAgIGZvcm1EYXRhLnNldCgnbGF5b3V0SWQnLCBsYXlvdXRJZCk7XG4gICAgaWYgKGltYWdlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tnZW5lcmF0ZSBpbWFnZV0nLCBpbWFnZSk7XG4gICAgICAgIGNvbnN0IFtoZWFkZXIsIGRhdGFdID0gaW1hZ2Uuc3BsaXQoJywnKTtcbiAgICAgICAgY29uc3QgdHlwZSA9IGhlYWRlci5zcGxpdCgnOicpWzFdLnNwbGl0KCc7JylbMF07XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tnZW5lcmF0ZSBpbWFnZV0gW3R5cGVdJywgdHlwZSk7XG4gICAgICAgIGNvbnN0IGJ5dGVDaGFyYWN0ZXJzID0gYXRvYihkYXRhKTtcbiAgICAgICAgY29uc3QgYnl0ZU51bWJlcnMgPSBuZXcgQXJyYXkoYnl0ZUNoYXJhY3RlcnMubGVuZ3RoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBieXRlQ2hhcmFjdGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYnl0ZU51bWJlcnNbaV0gPSBieXRlQ2hhcmFjdGVycy5jaGFyQ29kZUF0KGkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KGJ5dGVOdW1iZXJzKTtcbiAgICAgICAgZm9ybURhdGEuc2V0KCdyZXF1ZXN0X3R5cGUnLCAnaW1hZ2UnKTtcbiAgICAgICAgZm9ybURhdGEuc2V0KCd1c2VyX2ltYWdlJywgbmV3IEJsb2IoW2J5dGVBcnJheV0sIHsgdHlwZTogXCJpbWFnZS9wbmdcIiB9KSk7XG4gICAgICAgIGZvcm1EYXRhLnNldCgndHJhbnNmZXJUeXBlJywgd2l0aEFpID8gXCJhaVwiIDogXCJuby1haVwiKTtcbiAgICB9XG4gICAgaWYgKCFpc05ldykge1xuICAgICAgICBmb3JtRGF0YS5zZXQoJ3JlcXVlc3RfdHlwZScsICdlZGl0Jyk7XG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goQVBJX0VORFBPSU5UUy5XRUJIT09LX1JFUVVFU1QsIHtcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgYm9keTogZm9ybURhdGEsXG4gICAgfSk7XG4gICAgY29uc3QgcmVzcG9uc2VEYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgIHJldHVybiByZXNwb25zZURhdGEuaW1hZ2VfdXJsIHx8IHJlc3BvbnNlRGF0YS5pbWFnZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQcm9kdWN0KHsgcXVhbnRpdHksIG5hbWUsIHNpemUsIGNvbG9yLCBzaWRlcywgcHJvZHVjdFR5cGUsIGFydGljbGUgfSkge1xuICAgIGNvbnN0IHByb2R1Y3RJZCA9IChNYXRoLnJhbmRvbSgpICsgMSkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KSArIFwiX1wiICsgRGF0ZS5ub3coKTtcbiAgICBjb25zdCBwcm9kdWN0Q29uZmlnID0gcHJvZHVjdENvbmZpZ3MuZmluZChwID0+IHAudHlwZSA9PT0gcHJvZHVjdFR5cGUpO1xuICAgIGNvbnN0IHByaWNlID0gc2lkZXMubGVuZ3RoID09IDFcbiAgICAgICAgPyAocHJvZHVjdENvbmZpZz8ucHJpY2UgfHwgMTk5MClcbiAgICAgICAgOiAocHJvZHVjdENvbmZpZz8uZG91YmxlU2lkZWRQcmljZSB8fCAyNDkwKTtcbiAgICBjb25zdCByZXN1bHRQcm9kdWN0ID0ge1xuICAgICAgICBpZDogcHJvZHVjdElkLFxuICAgICAgICBuYW1lLFxuICAgICAgICBwcmljZSxcbiAgICAgICAgcXVhbnRpdHk6IHF1YW50aXR5LFxuICAgICAgICBpbWc6IHNpZGVzWzBdPy5pbWFnZV91cmwsXG4gICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICAgIHsgb3B0aW9uOiAn0JTQuNC30LDQudC9JywgdmFyaWFudDogYDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCIke3NpZGVzWzBdPy5pbWFnZV91cmx9XCIgdGFyZ2V0PVwiX2JsYW5rXCI+JHtzaWRlc1swXT8uaW1hZ2VfdXJsLnNsaWNlKC0xMCl9PC9hPmAgfSxcbiAgICAgICAgICAgIChzaWRlcy5sZW5ndGggPiAxKSAmJiB7IG9wdGlvbjogJ9CU0LjQt9Cw0LnQvScsIHZhcmlhbnQ6IGA8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiJHtzaWRlc1sxXT8uaW1hZ2VfdXJsfVwiIHRhcmdldD1cIl9ibGFua1wiPiR7c2lkZXNbMV0/LmltYWdlX3VybC5zbGljZSgtMTApfTwvYT5gIH0sXG4gICAgICAgICAgICB7IG9wdGlvbjogJ9CQ0YDRgtC40LrRg9C7JywgdmFyaWFudDogYXJ0aWNsZSB9LFxuICAgICAgICAgICAgeyBvcHRpb246ICfQoNCw0LfQvNC10YAnLCB2YXJpYW50OiBzaXplIH0sXG4gICAgICAgICAgICB7IG9wdGlvbjogJ9Cm0LLQtdGCJywgdmFyaWFudDogY29sb3IubmFtZSB9LFxuICAgICAgICAgICAgeyBvcHRpb246ICfQn9GA0LjQvdGCJywgdmFyaWFudDogc2lkZXMubGVuZ3RoID09IDEgPyAn0J7QtNC90L7RgdGC0L7RgNC+0L3QvdC40LknIDogJ9CU0LLRg9GF0YHRgtC+0YDQvtC90L3QuNC5JyB9LFxuICAgICAgICBdXG4gICAgfTtcbiAgICBjb25zb2xlLmRlYnVnKCdbY2FydF0gYWRkIHByb2R1Y3QnLCByZXN1bHRQcm9kdWN0KTtcbiAgICBpZiAodHlwZW9mIHdpbmRvdy50Y2FydF9fYWRkUHJvZHVjdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgd2luZG93LnRjYXJ0X19hZGRQcm9kdWN0KHJlc3VsdFByb2R1Y3QpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2NhcnRdINCe0YjQuNCx0LrQsCDQv9GA0Lgg0LTQvtCx0LDQstC70LXQvdC40Lgg0L/RgNC+0LTRg9C60YLQsCDQsiDQutC+0YDQt9C40L3RgycsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbY2FydF0g0JrQvtGA0LfQuNC90LAgVGlsZGEg0L3QtSDQt9Cw0LPRgNGD0LbQtdC90LAuJyk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RDaGlsZChlbGVtZW50KSB7XG4gICAgaWYgKCFlbGVtZW50KVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICBpZiAoIWVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQpXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIHJldHVybiBnZXRMYXN0Q2hpbGQoZWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZCk7XG59XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCBQb3B1cCBmcm9tICcuL2NvbXBvbmVudHMvUG9wdXAnO1xuaW1wb3J0IEVkaXRvciBmcm9tICcuL2NvbXBvbmVudHMvRWRpdG9yJztcbmltcG9ydCB7IENhcmRGb3JtIH0gZnJvbSAnLi9jb21wb25lbnRzL0NhcmRGb3JtJztcbndpbmRvdy5wb3B1cCA9IFBvcHVwO1xud2luZG93LmVkaXRvciA9IEVkaXRvcjtcbndpbmRvdy5jYXJkRm9ybSA9IENhcmRGb3JtO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9