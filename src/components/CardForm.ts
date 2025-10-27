import { CardFormProps, RuleCart } from '../types';

// Константы для селекторов DOM
const DOM_SELECTORS = {
    // Селекторы корзины
    CART_CONTAINER: '.t706__cartwin-products, .t-store__cart-products, .t-store',
    CART_PRODUCT: '.t706__cartwin-product, .t-store__card, .t706__product',
    PRODUCT_TITLE: '.t706__product-title, .t-store__card__title, .t706__product-name',
    PRODUCT_DEL_BUTTON: '.t706__product-del',
    PRODUCT_PLUS_BUTTON: '.t706__product-plus',
    PRODUCT_MINUS_BUTTON: '.t706__product-minus',
    PRODUCT_PLUSMINUS: '.t706__product-plusminus',
    PRODUCT_QUANTITY: '.t706__product-quantity, .t-store__card__quantity',

    // Селекторы счетчиков и сумм
    CART_COUNTER: '.t706__carticon-counter, .t-store__counter',
    CART_AMOUNT: '.t706__cartwin-prodamount, .t-store__total-amount',
} as const;

// Задержки для асинхронных операций
const DELAYS = {
    CART_UPDATE: 300,
    DOM_UPDATE: 100,
    OBSERVER_CHECK: 500,
    CART_LOAD_TIMEOUT: 3000,
} as const;

// Утилиты
class CartUtils {
    /**
     * Универсальная задержка
     */
    static wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Поиск элемента с ожиданием
     */
    static async waitForElement(
        selector: string,
        maxAttempts: number = 10,
        interval: number = 100
    ): Promise<Element | null> {
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

    /**
     * Поиск товара в DOM по названию
     */
    static findProductElement(productName: string): Element | null {
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

export class CardForm {
    cardBlock: HTMLElement;
    form: HTMLFormElement;

    fields: NodeListOf<Element>;
    rules: RuleCart[];

    actionsStates = new Map();
    isUpdatingCart = false; // Флаг для предотвращения циклических обновлений
    isApplyingActions = false; // Флаг для предотвращения одновременного выполнения applyActions

    constructor({ cardBlockId, rules }: CardFormProps) {

        this.cardBlock = document.querySelector(cardBlockId)! as HTMLElement;

        if (!this.cardBlock) {
            console.error(`Card block with id ${cardBlockId} not found`);
        }

        this.form = this.cardBlock.querySelector('form')! as HTMLFormElement;

        if (!this.form) {
            console.error(`Form block with id ${cardBlockId} not found`);
        } else {
            this.initForm();
        }

        this.rules = rules;
        this.fields = document.querySelectorAll('.t-input-group') as NodeListOf<Element>;

        this.initRules();
        this.initCartObserver();
    }

    initForm() {
        console.debug('[form] [init]', this.form.elements);

        this.form.addEventListener('input', async (e) => {
            const target = e.target as HTMLInputElement;
            const fieldName = target?.name;
            const fieldValue = target?.value;

            console.debug('[form] [input]', e);
            console.debug(fieldValue, "|", fieldName);

            // Проверяем, есть ли правило для этого поля
            const rule = this.rules.find(r => r.variable === fieldName);

            if (rule) {
                // Сохраняем старое состояние ПЕРЕД изменением
                const oldState = new Map(this.actionsStates);

                // Находим соответствующее действие из правил
                const action = rule.actions.find(a => a.value === fieldValue);

                if (action) {
                    // Сохраняем состояние с действием
                    this.actionsStates.set(fieldName, {
                        value: fieldValue,
                        action: action
                    });
                } else {
                    // Если значение не соответствует ни одному действию, сбрасываем
                    this.actionsStates.set(fieldName, {
                        value: '',
                        action: null
                    });
                }

                await this.applyActions(oldState);
            }
        });

        // Обработка для select и radio полей
        this.form.addEventListener('change', async (e) => {
            const target = e.target as HTMLInputElement | HTMLSelectElement;
            const fieldName = target?.name;
            const fieldValue = target?.value;

            console.debug('[form] [change]', e);
            console.debug(fieldValue, "|", fieldName);

            // Проверяем, есть ли правило для этого поля
            const rule = this.rules.find(r => r.variable === fieldName);

            if (rule) {
                // Находим соответствующее действие из правил
                const action = rule.actions.find(a => a.value === fieldValue);

                if (action) {
                    // Сохраняем состояние с действием
                    const oldState = new Map(this.actionsStates);
                    this.actionsStates.set(fieldName, {
                        value: fieldValue,
                        action: action
                    });

                    await this.applyActions(oldState);
                } else {
                    // Если значение не соответствует ни одному действию, сбрасываем
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
        // Инициализируем состояние на основе текущих значений формы
        this.rules.forEach(rule => {
            // Обработка правил, которые всегда активны (например, сервисный сбор)
            if (rule.alwaysActive && rule.actions.length > 0) {
                const action = rule.actions[0]; // Берем первое действие
                if (action) {
                    this.actionsStates.set(rule.variable, {
                        value: action.value,
                        action: action
                    });
                    console.debug('[form] [initRules] Инициализировано постоянное правило:', rule.variable, action);
                }
                return;
            }

            const field = this.form.elements.namedItem(rule.variable) as HTMLInputElement | HTMLSelectElement | RadioNodeList | null;

            if (field) {
                let fieldValue = '';

                // Обработка разных типов полей
                if (field instanceof RadioNodeList) {
                    // Radio buttons
                    const checkedRadio = Array.from(field).find((radio: any) => radio.checked) as HTMLInputElement | undefined;
                    fieldValue = checkedRadio?.value || '';
                } else if (field instanceof HTMLSelectElement) {
                    // Select dropdown
                    fieldValue = field.value || '';
                } else if (field instanceof HTMLInputElement) {
                    if (field.type === 'radio') {
                        fieldValue = field.checked ? field.value : '';
                    } else if (field.type === 'checkbox') {
                        fieldValue = field.checked ? field.value : '';
                    } else {
                        fieldValue = field.value || '';
                    }
                }

                console.debug('[form] [initRules] Поле:', rule.variable, 'Значение:', fieldValue);

                // Находим соответствующее действие
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

        // Очищаем корзину от товаров правил, которые не соответствуют текущим значениям
        await this.cleanupCartOnInit();

        // Применяем все активные правила (включая alwaysActive)
        await this.applyActions();
    }

    /**
     * Очищает корзину от товаров правил при инициализации
     * Удаляет товары, которые есть в правилах, но не выбраны в форме
     */
    async cleanupCartOnInit() {
        console.debug('[form] [cleanupCartOnInit] Начало очистки корзины');

        // Ждем загрузки корзины
        await new Promise(resolve => {
            const checkCart = () => {
                const tildaCart = (window as any).tcart;
                if (tildaCart && tildaCart.products) {
                    resolve(void 0);
                } else {
                    setTimeout(checkCart, 200);
                }
            };
            checkCart();
        });

        const tildaCart = (window as any).tcart;
        if (!tildaCart || !Array.isArray(tildaCart.products)) {
            console.warn('[form] [cleanupCartOnInit] Корзина недоступна');
            return;
        }

        console.debug('[form] [cleanupCartOnInit] Товары в корзине:', tildaCart.products.map((p: any) => p.name));

        // Собираем все возможные названия товаров из правил
        const allRuleProducts = new Set<string>();
        this.rules.forEach(rule => {
            rule.actions.forEach(action => {
                if (action.value) {
                    allRuleProducts.add(action.value.trim());
                }
            });
        });

        // Собираем активные товары (которые должны быть в корзине)
        const activeProducts = new Set<string>();
        this.actionsStates.forEach((state: any) => {
            if (state.action && state.action.value) {
                activeProducts.add(state.action.value.trim());
            }
        });

        console.debug('[form] [cleanupCartOnInit] Все товары из правил:', Array.from(allRuleProducts));
        console.debug('[form] [cleanupCartOnInit] Активные товары:', Array.from(activeProducts));

        // Находим товары для удаления
        const productsToRemove: string[] = [];
        tildaCart.products.forEach((product: any) => {
            const productName = product.name?.trim();
            if (productName && allRuleProducts.has(productName) && !activeProducts.has(productName)) {
                productsToRemove.push(productName);
            }
        });

        console.debug('[form] [cleanupCartOnInit] Товары для удаления:', productsToRemove);

        // Удаляем найденные товары
        if (productsToRemove.length > 0) {
            for (const productName of productsToRemove) {
                console.debug('[form] [cleanupCartOnInit] Удаляем:', productName);
                await this.removeProductFromCart(productName);
            }
            console.debug('[form] [cleanupCartOnInit] ✓ Очистка завершена');
        } else {
            console.debug('[form] [cleanupCartOnInit] Нет товаров для удаления');
        }

        // Скрываем счетчики количества для всех товаров из правил после инициализации
        await this.hideQuantityControlsForRuleProducts();
    }

    /**
     * Сохраняет корзину Tilda в localStorage с правильной структурой
     */
    saveTildaCart(tildaCart: any): boolean {
        try {
            // Устанавливаем флаг, чтобы перехват не реагировал на наши изменения
            this.isUpdatingCart = true;

            // Обновляем метку времени
            tildaCart.updated = Math.floor(Date.now() / 1000);

            // Создаем полную структуру корзины Tilda
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

            // Сбрасываем флаг после небольшой задержки
            setTimeout(() => {
                this.isUpdatingCart = false;
            }, 100);

            return true;
        } catch (e) {
            console.warn('[form] [saveTildaCart] Ошибка сохранения:', e);
            this.isUpdatingCart = false;
            return false;
        }
    }

    /**
     * Инициализирует наблюдение за изменениями в корзине
     * Оптимизированная версия с меньшим количеством механизмов
     */
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

        // Механизм 1: MutationObserver (основной) - отслеживает изменения DOM
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
                        // Скрываем счетчики для товаров из правил после любых изменений корзины
                        this.hideQuantityControlsForRuleProducts();
                    }, DELAYS.CART_UPDATE);
                });

                observer.observe(cartContainer, {
                    childList: true,
                    subtree: true,
                });

                console.debug('[form] [initCartObserver] ✓ MutationObserver установлен');
            } else {
                setTimeout(observeCart, 1000);
            }
        };

        observeCart();

        // Механизм 2: Обработка кликов (дополнительный) - для быстрой реакции
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const deleteButton = target.closest(DOM_SELECTORS.PRODUCT_DEL_BUTTON);

            // Если это кнопка удаления, проверяем, не товар ли это из правила
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

            // Обработка кликов на +/- для быстрой реакции
            const isCartButton = target.closest(`${DOM_SELECTORS.PRODUCT_PLUS_BUTTON}, ${DOM_SELECTORS.PRODUCT_MINUS_BUTTON}, ${DOM_SELECTORS.PRODUCT_DEL_BUTTON}`);
            if (isCartButton) {
                console.debug('[form] [cartObserver] Клик на кнопку корзины');
                setTimeout(() => checkCartChanges(), DELAYS.OBSERVER_CHECK);
            }
        });

        // Механизм 3: Перехват localStorage (резервный) - на случай внешних изменений
        const setupLocalStorageInterceptor = () => {
            if (!(window as any).__cardform_localstorage_intercepted) {
                const originalSetItem = Storage.prototype.setItem;
                const self = this;
                Storage.prototype.setItem = function (key: string, value: string) {
                    const result = originalSetItem.apply(this, [key, value]);
                    if (key === 'tcart' && !self.isUpdatingCart) {
                        console.debug('[form] [cartObserver] localStorage tcart изменен извне');
                        setTimeout(() => checkCartChanges(), DELAYS.CART_UPDATE);
                    }
                    return result;
                };
                (window as any).__cardform_localstorage_intercepted = true;
                console.debug('[form] [initCartObserver] ✓ localStorage.setItem перехвачен');
            }
        };

        if (document.readyState === 'complete') {
            setupLocalStorageInterceptor();
        } else {
            window.addEventListener('load', setupLocalStorageInterceptor);
        }

        // Механизм 4: Отслеживание открытия корзины через hashchange
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            if (hash === '#opencart') {
                console.debug('[form] [cartObserver] Корзина открывается через #opencart');
                // Ждем, пока корзина полностью отрисуется
                setTimeout(() => {
                    this.hideQuantityControlsForRuleProducts();
                }, DELAYS.CART_UPDATE + 200);
            }
        });

        // Механизм 5: Наблюдение за показом корзины через MutationObserver на классе корзины
        const observeCartVisibility = () => {
            const cartWindow = document.querySelector('.t706__cartwin');
            if (cartWindow) {
                const visibilityObserver = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            const element = mutation.target as HTMLElement;
                            if (element.classList.contains('t706__cartwin_showed')) {
                                console.debug('[form] [cartObserver] Корзина показана (класс t706__cartwin_showed)');
                                // Ждем, пока корзина полностью отрисуется
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
            } else {
                setTimeout(observeCartVisibility, 1000);
            }
        };

        observeCartVisibility();

        console.debug('[form] [initCartObserver] ✓ Наблюдатели инициализированы');
    }

    /**
     * Обрабатывает удаление товара из правила пользователем
     * Снимает выбор с соответствующего input элемента в форме
     */
    handleRuleProductDeletion(productName: string) {
        console.debug('[form] [handleRuleProductDeletion] Проверка товара:', productName);

        // Проверяем, является ли удаляемый товар товаром из правила
        for (const [key, state] of this.actionsStates) {
            if (state.action && state.action.value === productName) {
                console.debug('[form] [handleRuleProductDeletion] Товар из правила найден:', {
                    variable: key,
                    action: state.action.value
                });

                // Находим соответствующий input элемент в форме
                // Ищем заново в DOM (на случай, если Tilda перерисовала элементы)
                let foundElement: HTMLInputElement | HTMLSelectElement | null = null;

                // Ищем все input/select элементы в форме
                const allInputs = this.form.querySelectorAll('input, select');

                allInputs.forEach((element) => {
                    const el = element as HTMLInputElement | HTMLSelectElement;

                    // Для radio/checkbox проверяем совпадение value с action.value
                    if ((el.type === 'radio' || el.type === 'checkbox') && el.value) {
                        // Проверяем точное совпадение значения
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

                    // Снимаем выбор
                    (foundElement as HTMLInputElement).checked = false;

                    // Удаляем из actionsStates
                    this.actionsStates.delete(key);

                    console.debug('[form] [handleRuleProductDeletion] ✓ Правило отменено, checkbox снят');
                } else {
                    console.warn('[form] [handleRuleProductDeletion] Элемент формы не найден для:', {
                        key: key,
                        actionValue: state.action.value,
                        availableInputs: Array.from(allInputs).map(el => ({
                            type: (el as HTMLInputElement).type,
                            value: (el as HTMLInputElement).value
                        }))
                    });
                }

                break;
            }
        }
    }

    /**
     * Обновляет количество товаров из правил с типом 'perProduct'
     * Использует нативную функцию Tilda для корректного обновления UI
     */
    async updateRuleProductsQuantity() {
        console.debug('[form] [updateRuleProductsQuantity] Начало обновления количества');

        const tildaCart = (window as any).tcart;
        if (!tildaCart || !Array.isArray(tildaCart.products)) {
            console.warn('[form] [updateRuleProductsQuantity] Корзина недоступна');
            return;
        }

        console.debug('[form] [updateRuleProductsQuantity] Активных правил:', this.actionsStates.size);

        // Проходим по всем активным правилам
        for (const [key, state] of this.actionsStates) {
            if (state.action && state.action.quantityType === 'perProduct') {
                const newQuantity = this.calculateRuleProductQuantity(state.action);

                // Находим индекс товара правила в корзине
                const productIndex = tildaCart.products.findIndex((p: any) =>
                    p.name?.trim() === state.action.value.trim()
                );

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

                        // Ждем появления DOM элемента через утилиту
                        let productElement: Element | null = null;
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

                            if (quantityElement && typeof (window as any).tcart__product__updateQuantity === 'function') {
                                // Используем нативную функцию Tilda для обновления количества
                                (window as any).tcart__product__updateQuantity(
                                    quantityElement,  // элемент количества
                                    productElement,   // элемент товара
                                    productIndex,     // индекс в массиве
                                    newQuantity       // новое количество
                                );

                                console.debug('[form] [updateRuleProductsQuantity] ✓ Количество обновлено через Tilda API:', {
                                    name: state.action.value,
                                    oldQuantity,
                                    newQuantity
                                });

                                // Скрываем кнопки +/- для товаров из правил
                                await CartUtils.wait(DELAYS.DOM_UPDATE);
                                const plusMinusButtons = productElement.querySelector(DOM_SELECTORS.PRODUCT_PLUSMINUS) as HTMLElement;
                                if (plusMinusButtons) {
                                    plusMinusButtons.style.display = 'none';
                                }
                            } else {
                                console.warn('[form] [updateRuleProductsQuantity] Не найден quantityElement или функция updateQuantity');
                            }
                        } else {
                            console.warn('[form] [updateRuleProductsQuantity] Не найден DOM элемент товара после ожидания');
                        }
                    }
                } else {
                    console.warn(`[form] [updateRuleProductsQuantity] Товар "${state.action.value}" НЕ найден в корзине`);
                }
            }
        }

        console.debug('[form] [updateRuleProductsQuantity] ✓ Обновление завершено');

        // Скрываем счетчики количества для всех товаров из правил
        await this.hideQuantityControlsForRuleProducts();
    }

    /**
     * Обновляет количество товара в DOM корзины
     */
    updateCartItemQuantityInDOM(productName: string, newQuantity: number) {
        console.debug('[form] [updateCartItemQuantityInDOM] Обновление:', { productName, newQuantity });

        // Список возможных селекторов для названия товара (разные версии Tilda)
        const titleSelectors = [
            '.t706__product-title',
            '.t-store__product-name',
            '.t-product__title',
            '.js-product-name'
        ];

        let productElement: Element | null = null;

        // Пробуем найти элемент через разные селекторы
        for (const selector of titleSelectors) {
            const productTitles = [...document.querySelectorAll(selector)] as HTMLElement[];
            console.debug(`[form] [updateCartItemQuantityInDOM] Поиск через "${selector}":`, productTitles.length, 'элементов');

            const foundElement = productTitles.find(el => el.innerText.trim() === productName.trim());
            if (foundElement) {
                // Ищем родительский контейнер товара
                productElement = foundElement.closest('.t706__cartwin-product, .t-store__product, .t-product');
                if (productElement) {
                    console.debug('[form] [updateCartItemQuantityInDOM] ✓ Товар найден через:', selector);
                    break;
                }
            }
        }

        if (!productElement) {
            console.warn('[form] [updateCartItemQuantityInDOM] ✗ Элемент товара НЕ найден в DOM:', productName);
            console.debug('[form] [updateCartItemQuantityInDOM] Все товары в DOM:',
                [...document.querySelectorAll('.t706__product-title, .t-store__product-name')].map((el: any) => el.innerText)
            );
            return;
        }

        // Обновляем поле ввода количества (разные варианты селекторов)
        const quantityInputSelectors = [
            '.t706__product-quantity',
            '.t-store__quantity-input',
            'input[name="quantity"]',
            '.js-product-quantity'
        ];

        let quantityInput: HTMLInputElement | null = null;
        for (const selector of quantityInputSelectors) {
            quantityInput = productElement.querySelector(selector) as HTMLInputElement;
            if (quantityInput) {
                quantityInput.value = newQuantity.toString();
                // Триггерим событие change для обновления
                quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
                quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
                console.debug('[form] [updateCartItemQuantityInDOM] ✓ Обновлен input через:', selector);
                break;
            }
        }

        // Обновляем визуальное отображение количества
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

        // Обновляем стоимость товара
        const tildaCart = (window as any).tcart;
        if (tildaCart) {
            const product = tildaCart.products.find((p: any) => p.name?.trim() === productName.trim());
            if (product) {
                const totalPrice = parseFloat(product.price) * newQuantity;

                const priceSelectors = [
                    '.t706__product-price',
                    '.t-store__product-price',
                    '.t-product__price',
                    '.js-product-price'
                ];

                for (const selector of priceSelectors) {
                    const priceElement = productElement.querySelector(selector) as HTMLElement;
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

    /**
     * Обновляет все товары в DOM корзины на основе данных из window.tcart
     */
    updateAllCartItemsInDOM() {
        const tildaCart = (window as any).tcart;
        if (!tildaCart || !Array.isArray(tildaCart.products)) {
            console.warn('[form] [updateAllCartItemsInDOM] Корзина недоступна');
            return;
        }

        console.debug('[form] [updateAllCartItemsInDOM] Обновляем все товары в DOM');

        // Обновляем каждый товар из корзины
        tildaCart.products.forEach((product: any) => {
            const productName = product.name?.trim();
            const quantity = parseInt(product.quantity || 1);

            if (productName) {
                this.updateCartItemQuantityInDOM(productName, quantity);
            }
        });

        console.debug('[form] [updateAllCartItemsInDOM] ✓ Все товары обновлены');
    }

    /**
     * Обновляет UI корзины всеми доступными способами
     */
    refreshCartUI() {
        console.debug('[form] [refreshCartUI] Начало обновления UI корзины');

        // Метод 1: Tilda функция обновления
        if (typeof (window as any).t_store__refreshcart === 'function') {
            (window as any).t_store__refreshcart();
            console.debug('[form] [refreshCartUI] ✓ Вызван t_store__refreshcart');
        }

        // Метод 2: Другие возможные функции Tilda
        const refreshFunctions = [
            't706__updateCart',
            'tcart__updateCart',
            't_store__updateCart',
            't706_init'
        ];

        refreshFunctions.forEach(funcName => {
            if (typeof (window as any)[funcName] === 'function') {
                try {
                    (window as any)[funcName]();
                    console.debug(`[form] [refreshCartUI] ✓ Вызван ${funcName}`);
                } catch (e) {
                    console.warn(`[form] [refreshCartUI] Ошибка ${funcName}:`, e);
                }
            }
        });

        // Метод 3: Прямое обновление DOM элементов всех товаров в корзине
        this.updateAllCartItemsInDOM();

        // Метод 4: Триггерим событие изменения
        window.dispatchEvent(new Event('cart-updated'));
        document.dispatchEvent(new Event('tcart-updated'));

        // Метод 5: Прямое обновление счетчиков корзины
        this.updateCartCounters();
    }

    /**
     * Обновляет счетчики корзины в UI
     */
    updateCartCounters() {
        const tildaCart = (window as any).tcart;
        if (!tildaCart) return;

        // Обновляем счетчик товаров в иконке корзины
        const cartCounters = document.querySelectorAll(DOM_SELECTORS.CART_COUNTER);
        cartCounters.forEach(counter => {
            if (counter) {
                counter.textContent = tildaCart.total.toString();
            }
        });

        // Обновляем общую сумму корзины
        const cartAmounts = document.querySelectorAll(DOM_SELECTORS.CART_AMOUNT);
        cartAmounts.forEach(amount => {
            if (amount) {
                const formattedAmount = tildaCart.amount.toLocaleString('ru-RU');
                amount.textContent = `${formattedAmount} ${tildaCart.currency_txt_r || ' р.'}`;
            }
        });

        console.debug('[form] [updateCartCounters] ✓ Счетчики обновлены');
    }

    /**
     * Подсчитывает количество основных товаров в корзине (не из правил)
     */
    getMainProductsQuantity(): number {
        const tildaCart = (window as any).tcart;
        if (!tildaCart || !Array.isArray(tildaCart.products)) {
            return 0;
        }

        // Собираем все названия товаров из правил
        const ruleProductNames = new Set<string>();
        this.rules.forEach(rule => {
            rule.actions.forEach(action => {
                if (action.value) {
                    ruleProductNames.add(action.value.trim());
                }
            });
        });

        // Считаем количество товаров, которые НЕ из правил
        let totalQuantity = 0;
        const mainProducts: string[] = [];
        tildaCart.products.forEach((product: any) => {
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

    /**
     * Вычисляет нужное количество для товара из правила
     */
    calculateRuleProductQuantity(action: any): number {
        // Если указано конкретное количество
        if (action.quantity !== undefined) {
            return action.quantity;
        }

        // Если указан тип количества
        if (action.quantityType === 'perProduct') {
            // Количество = количество основных товаров
            return Math.max(1, this.getMainProductsQuantity());
        }

        // По умолчанию - фиксированное количество = 1
        return 1;
    }

    /**
     * Удаляет товар из корзины по названию
     * Оптимизированная версия с использованием утилит
     */
    async removeProductFromCart(productName: string): Promise<boolean> {
        console.debug('[form] [removeProduct] Попытка удалить:', productName);

        // Метод 1: Поиск через утилиту и клик по кнопке удаления
        const productElement = CartUtils.findProductElement(productName);

        if (productElement) {
            const delProductButton = productElement.querySelector(DOM_SELECTORS.PRODUCT_DEL_BUTTON) as HTMLElement;
            if (delProductButton) {
                delProductButton.click();
                console.debug('[form] [removeProduct] ✓ Удалено через DOM (клик):', productName);
                await CartUtils.wait(DELAYS.CART_UPDATE);
                return true;
            }
        }

        // Метод 2: Использование Tilda Cart API (если доступен)
        const tildaCart = (window as any).tcart;
        if (tildaCart && Array.isArray(tildaCart.products)) {
            const productIndex = tildaCart.products.findIndex((p: any) =>
                p.name?.trim() === productName.trim()
            );

            if (productIndex !== -1) {
                const product = tildaCart.products[productIndex];

                // Пробуем разные методы удаления
                const removeFunctions = [
                    'tcart__removeProduct',
                    'tcart_removeProduct',
                    't_store__removeProduct'
                ];

                for (const funcName of removeFunctions) {
                    if (typeof (window as any)[funcName] === 'function') {
                        try {
                            (window as any)[funcName](product.uid || product.id);
                            console.debug(`[form] [removeProduct] ✓ Удалено через ${funcName}:`, productName);
                            await CartUtils.wait(DELAYS.CART_UPDATE);
                            return true;
                        } catch (e) {
                            console.warn(`[form] [removeProduct] Ошибка ${funcName}:`, e);
                        }
                    }
                }

                // Прямое удаление из массива
                tildaCart.products.splice(productIndex, 1);
                tildaCart.amount = tildaCart.products.reduce((sum: number, p: any) =>
                    sum + (parseFloat(p.price) * parseInt(p.quantity || 1)), 0
                );
                tildaCart.prodamount = tildaCart.products.length;
                tildaCart.total = tildaCart.products.length;
                tildaCart.updated = Math.floor(Date.now() / 1000);

                if (this.saveTildaCart(tildaCart)) {
                    if (typeof (window as any).t_store__refreshcart === 'function') {
                        (window as any).t_store__refreshcart();
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
        // Предотвращаем одновременное выполнение applyActions
        if (this.isApplyingActions) {
            console.debug('[form] [applyActions] Уже выполняется, пропускаем');
            return;
        }

        this.isApplyingActions = true;

        try {
            console.debug('[form] [applyActions] Начало применения действий');
            console.debug('[form] [applyActions] Старое состояние:', Object.fromEntries(oldState));
            console.debug('[form] [applyActions] Новое состояние:', Object.fromEntries(this.actionsStates));

            // Ждем загрузки корзины (с таймаутом)
            const cartLoaded = await Promise.race([
                new Promise<boolean>(resolve => {
                    const interval = setInterval(() => {
                        if ([...document.querySelectorAll(`.t706__product-title`)].length > 0) {
                            clearInterval(interval);
                            resolve(true);
                        }
                    }, 200);
                }),
                new Promise<boolean>(resolve => setTimeout(() => resolve(false), 3000))
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

                // Проверяем, изменилось ли значение
                if (state.value !== oldValue) {

                    // Если было старое действие, удаляем старый продукт
                    if (oldAction && oldAction.value) {
                        console.debug('[form] [applyActions] Удаляем старый товар:', oldAction.value);
                        await this.removeProductFromCart(oldAction.value);
                    }

                    // Если есть новое действие, добавляем новый продукт
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

                        (window as any).tcart__addProduct({
                            id: productId,
                            name: state.action.value,
                            price: state.action.sum || 0,
                            quantity: productQuantity,
                        });

                        // Ждем добавления продукта и скрываем кнопки изменения количества
                        const changeProduct = await new Promise<HTMLElement | undefined>(resolve => {
                            setTimeout(() => {
                                const changeProduct = ([...document.querySelectorAll(`.t706__product-title`)] as HTMLElement[])
                                    .find((e: HTMLElement) => e.innerText.trim() === state.action.value.trim())?.parentElement;

                                resolve(changeProduct || undefined);
                            }, 300);
                        });

                        if (changeProduct) {
                            const changeProductButton = changeProduct.querySelector(`.t706__product-plusminus`) as HTMLElement;
                            if (changeProductButton) {
                                changeProductButton.style.display = 'none';
                                console.debug('[form] [applyActions] ✓ Скрыты кнопки количества');
                            }
                        }
                    } else if (!state.value || !state.action) {
                        // Значение сброшено - товар уже удален выше
                        console.debug('[form] [applyActions] Значение сброшено, товар удален');
                    }
                }
            }

            console.debug('[form] [applyActions] ✓ Применение действий завершено');

            // Скрываем счетчики количества для всех товаров из правил
            await this.hideQuantityControlsForRuleProducts();
        } finally {
            // Сбрасываем флаг в любом случае
            this.isApplyingActions = false;
        }
    }

    // ========================================
    // СКРЫТИЕ СЧЕТЧИКОВ КОЛИЧЕСТВА ДЛЯ ТОВАРОВ ИЗ ПРАВИЛ
    // ========================================

    /**
     * Получает список всех названий товаров из правил
     * @returns Set с названиями товаров
     */
    private getAllRuleProductNames(): Set<string> {
        const ruleProductNames = new Set<string>();

        // Проходим по всем правилам
        this.rules.forEach(rule => {
            // Проходим по всем действиям в каждом правиле
            rule.actions.forEach(action => {
                // Добавляем название товара из действия (action.value)
                if (action.value) {
                    ruleProductNames.add(action.value.trim());
                }
            });
        });

        console.debug('[form] [hideQuantity] Все товары из правил:', Array.from(ruleProductNames));
        return ruleProductNames;
    }

    /**
     * Скрывает счетчики количества (кнопки +/-) для товаров из правил
     * 
     * ЧТО ДЕЛАЕТ:
     * 1. Получает список всех товаров из правил
     * 2. Находит эти товары в DOM корзины
     * 3. Скрывает блок с кнопками +/- (.t706__product-plusminus)
     * 
     * ЗАЧЕМ:
     * Товары из правил управляются автоматически (количество зависит от основных товаров).
     * Пользователь не должен иметь возможность менять их количество вручную.
     */
    private async hideQuantityControlsForRuleProducts(): Promise<void> {
        console.debug('[form] [hideQuantity] Начало скрытия счетчиков для товаров из правил');

        // Получаем все названия товаров из правил
        const ruleProductNames = this.getAllRuleProductNames();

        if (ruleProductNames.size === 0) {
            console.debug('[form] [hideQuantity] Нет товаров из правил');
            return;
        }

        // Ждем, пока корзина отрисуется
        await CartUtils.wait(DELAYS.DOM_UPDATE);

        // Находим все товары в корзине
        const productElements = document.querySelectorAll(DOM_SELECTORS.CART_PRODUCT);
        let hiddenCount = 0;

        productElements.forEach((productElement) => {
            // Находим название товара
            const titleElement = productElement.querySelector(DOM_SELECTORS.PRODUCT_TITLE);
            const productName = titleElement?.textContent?.trim();

            if (productName && ruleProductNames.has(productName)) {
                // Это товар из правил - скрываем кнопки +/-
                const plusMinusBlock = productElement.querySelector(DOM_SELECTORS.PRODUCT_PLUSMINUS) as HTMLElement;

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

