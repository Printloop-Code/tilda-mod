# Редактор Дизайна Одежды

Мощный веб-редактор для создания дизайна футболок и толстовок с поддержкой слоев, AI-генерации изображений, истории изменений и автосохранения в IndexedDB.

## 🚀 Возможности

- **Визуальный редактор** на основе Fabric.js
- **Поддержка продуктов**: футболки, толстовки
- **Слои**: добавление текста и изображений
- **AI-генерация изображений** через API
- **Удаление фона** изображений при не-ИИ генерации
- **История изменений** с функциями отмены/повтора (Undo/Redo)
- **Автосохранение** состояния в IndexedDB
- **Миграция данных** из localStorage в IndexedDB
- **Экспорт дизайна** в различных форматах
- **Интеграция с Tilda** для добавления товаров в корзину
- **TypeScript поддержка** с полной типизацией

## 📦 Установка

### Через CDN (рекомендуется)

```html
<!-- Зависимости -->
<script src="https://unpkg.com/lucide@latest"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>

<!-- Редактор -->
<script src="path/to/bundle.js"></script>
```

### Через npm/yarn

```bash
# Клонирование репозитория
git clone <repository-url>
cd <project-directory>

# Установка зависимостей
yarn install
# или
npm install

# Сборка
yarn build
# или
npm run build
```

## 🎯 Быстрый старт

### 1. HTML разметка

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>
</head>
<body>
    <!-- Основной контейнер редактора -->
    <div id="editor-container">
        <!-- Область с мокапом и canvas -->
        <div id="editor-content">
            <img id="editor-mockup" src="" alt="Мокап товара" />
            <div id="editor-canvases"></div>
        </div>
        
        <!-- Кнопка переключения сторон -->
        <button id="change-side-btn">Изменить сторону</button>
        
        <!-- Список цветов -->
        <div id="colors-list">
            <div id="color-item" style="display: none;">
                <div class="color-block"></div>
            </div>
        </div>
        
        <!-- Список размеров -->
        <div id="sizes-list">
            <div id="size-item" style="display: none;">
                <div class="size-border">
                    <span class="size-text">M</span>
                </div>
            </div>
        </div>
        
        <!-- Кнопки истории -->
        <button id="history-undo">↶ Отменить</button>
        <button id="history-redo">↷ Повторить</button>
        
        <!-- Кнопка добавления в корзину -->
        <button id="add-order-btn">
            <span class="btn-text">Добавить в корзину</span>
        </button>
        
        <!-- Отображение суммы -->
        <div id="editor-sum">
            <span>0 ₽</span>
        </div>
    </div>

    <script src="path/to/bundle.js"></script>
</body>
</html>
```

### 2. JavaScript инициализация

```javascript
// Конфигурация редактора
const editorConfig = {
    // Селекторы DOM элементов
    blocks: {
        editorBlockClass: '#editor-container',
        changeSideButtonClass: '#change-side-btn',
        productListBlockClass: '#product-list',
        productItemClass: '#product-item',
        productItemImageClass: '#product-item-image',
        productItemTextClass: '#product-item-text',
        editorSumBlockClass: '#editor-sum',
        editorSettingsBlockClass: '#editor-settings',
        editorClipImageBlockClass: '#editor-clip-image',
        editorAddOrderButtonClass: '#add-order-btn',
        editorProductNameClass: '#product-name',
        editorColorsListBlockClass: '#colors-list',
        editorColorItemBlockClass: '#color-item',
        editorSizesListBlockClass: '#sizes-list',
        editorSizeItemBlockClass: '#size-item',
        editorLayoutsListBlockClass: '#layouts-list',
        editorLayoutItemBlockClass: '#layout-item',
        editorLayoutItemBlockViewClass: '.layout-view',
        editorLayoutItemBlockNameClass: '.layout-name',
        editorLayoutItemBlockRemoveClass: '.layout-remove',
        editorUploadImageButtonClass: '#upload-image-btn',
        editorUploadViewBlockClass: '#upload-view',
        editorUploadCancelButtonClass: '#upload-cancel',
        editorLayoutItemBlockEditClass: '.layout-edit',
        editorQuantityFormBlockClass: '#quantity-form',
        editorHistoryUndoBlockClass: '#history-undo',
        editorHistoryRedoBlockClass: '#history-redo',
        editorLoadWithAiButtonClass: '#load-with-ai',
        editorLoadWithoutAiButtonClass: '#load-without-ai',
        editorRemoveBackgroundButtonClass: '#remove-background-button' // Опционально
    },
    
    // Конфигурация продуктов
    productConfigs: [
        {
            type: 'tshirt',
            productName: 'Футболка',
            sizes: ['S', 'M', 'L', 'XL', '2XL'],
            mockups: [
                {
                    side: 'front',
                    url: '/images/tshirt-front-white.png',
                    color: { name: 'white', hex: '#ffffff' }
                },
                {
                    side: 'back', 
                    url: '/images/tshirt-back-white.png',
                    color: { name: 'white', hex: '#ffffff' }
                },
                {
                    side: 'front',
                    url: '/images/tshirt-front-black.png', 
                    color: { name: 'black', hex: '#000000' }
                },
                {
                    side: 'back',
                    url: '/images/tshirt-back-black.png',
                    color: { name: 'black', hex: '#000000' }
                }
            ],
            printConfig: [
                {
                    side: 'front',
                    position: { x: 0, y: -5 },
                    size: { width: 200, height: 250 }
                },
                {
                    side: 'back',
                    position: { x: 0, y: -5 },
                    size: { width: 200, height: 250 }
                }
            ]
        }
    ],
    
    // API конфигурация
    apiConfig: {
        generateImageUrl: '/api/generate-image',
        createProductUrl: '/api/create-product'
    },
    
    // Дополнительные опции (опциональные)
    options: {
        disableBeforeUnloadWarning: false  // Показывать предупреждение при уходе со страницы
    }
};

// Создание экземпляра редактора
const editor = new Editor(editorConfig);

// Глобальный доступ (для совместимости с Tilda)
window.editor = editor;
```

## 🛠 Подробная конфигурация

### Структура ProductConfig

```typescript
type Product = {
    type: 'tshirt' | 'hoodie';           // Тип продукта
    productName: string;                  // Название для отображения
    sizes: Size[];                       // Доступные размеры ['S', 'M', 'L', 'XL', '2XL']
    mockups: Mockup[];                   // Мокапы для разных сторон и цветов
    printConfig: PrintConfig[];          // Конфигурация области печати
}

type Mockup = {
    side: 'front' | 'back';              // Сторона товара
    url: string;                         // URL изображения мокапа
    color: {                            // Цвет товара
        name: string;                    // Название цвета ('white', 'black', etc.)
        hex: string;                     // HEX код цвета
    }
}

type PrintConfig = {
    side: 'front' | 'back';              // Сторона для печати
    position: { x: number, y: number };  // Смещение области печати (%)
    size: { width: number, height: number }; // Размер области печати (px)
}
```

### Опции конфигурации

```typescript
type EditorOptions = {
    disableBeforeUnloadWarning?: boolean;  // Отключить предупреждение при уходе со страницы
}
```

**Пример с отключенным предупреждением:**
```javascript
const editorConfig = {
    // ... остальная конфигурация ...
    options: {
        disableBeforeUnloadWarning: true  // Отключает предупреждение
    }
};
```

## 📡 API методы

### Основные методы управления

```javascript
// Изменение типа продукта
editor.changeProductType('hoodie');

// Изменение цвета
editor.changeColor('black');

// Изменение стороны
editor.changeSide();

// Изменение размера  
editor.changeSize('L');

// Добавление текстового слоя
editor.addTextLayout('Мой текст');

// Добавление изображения по URL
editor.addImageLayout('https://example.com/image.jpg');

// Удаление слоя по ID
editor.removeLayout(layoutId);

// Экспорт дизайна в изображения
const exportedImages = await editor.exportArt();
// Возвращает: { front: 'data:image/png;base64,...', back: 'data:image/png;base64,...' }
```

### Работа с историей

```javascript
// Сохранение текущего состояния в историю
const historyId = await editor.saveToHistory('Описание изменения');

// Восстановление состояния из истории
const success = await editor.restoreFromHistory(historyId);

// Получение истории для текущего продукта и стороны
const historyItems = await editor.getHistoryForCurrentState(20);

// Очистка истории
await editor.clearCurrentHistory();

// Отмена последнего действия (Undo)
editor.undo();

// Повтор действия (Redo)  
editor.redo();
```

### AI генерация изображений

```javascript
// Генерация изображения по текстовому описанию
const generatedImageUrl = await generateImage({
    uri: '/api/generate-image',
    prompt: 'котик в космосе',     // Описание
    shirtColor: 'white',            // Цвет товара
    image: null,                    // Базовое изображение (опционально)
    withAi: true,                   // С AI или без
    layoutId: null,                 // ID слоя (опционально)
    isNew: true,                    // Новый или редактирование
    background: true                // Сохранить фон (true) или удалить (false)
});

// Добавление сгенерированного изображения на холст
if (generatedImageUrl) {
    editor.addImageLayout(generatedImageUrl);
}
```

### Удаление фона изображений

Функция удаления фона доступна только при **не-ИИ генерации** (когда пользователь загружает своё изображение).

#### Интеграция чекбокса удаления фона

**HTML:**
```html
<div class="t-checkbox" style="display: none;">
    <input type="checkbox" 
           id="remove-background-checkbox" 
           class="remove-background-checkbox"
           name="remove-background">
    <label for="remove-background-checkbox">Удалить фон</label>
</div>
```

**JavaScript:**
```javascript
const editor = new Editor({
    blocks: {
        // ... другие блоки ...
        editorRemoveBackgroundButtonClass: '.remove-background-button'
    },
    // ... остальная конфигурация ...
});
```

**Особенности:**
- ✅ Кнопка-переключатель отображается только при не-ИИ генерации
- ✅ Кнопка скрывается при ИИ генерации
- ✅ Параметр `background` передается в API автоматически
- ✅ Визуальная индикация активного состояния через изменение цвета границы
- ✅ По умолчанию фон сохраняется (`background: true`)

**Подробная документация:** См. файл [REMOVE_BACKGROUND_FEATURE.md](./REMOVE_BACKGROUND_FEATURE.md)

### Управление состоянием

```javascript
// Получение текущего состояния
const currentState = {
    type: editor.selectType,      // 'tshirt' | 'hoodie'
    color: editor.selectColor,    // { name: string, hex: string }
    side: editor.selectSide,      // 'front' | 'back'  
    size: editor.selectSize,      // 'S' | 'M' | 'L' | 'XL' | '2XL'
    layouts: editor.layouts       // Layout[]
};

// Получение стоимости заказа
const orderSum = editor.getSum();
// Возвращает: 0 (пусто), 1920 (одна сторона), 2420 (две стороны)

// Получение количества товара
const quantity = editor.getQuantity();
```

## 🎨 События

Редактор поддерживает систему событий для реакции на изменения:

```javascript
// Подписка на события
editor.events.on('mockup-updated', (imageDataURL) => {
    console.log('Мокап обновлен:', imageDataURL);
});

editor.events.on('layout-added', (layout) => {
    console.log('Добавлен слой:', layout);
});

editor.events.on('layout-removed', (layoutId) => {
    console.log('Удален слой:', layoutId);
});

editor.events.on('state-changed', (newState) => {
    console.log('Состояние изменено:', newState);
});

// Доступные события:
// - 'mockup-loading': boolean          // Загрузка мокапа
// - 'mockup-updated': string           // Обновлен мокап (data URL)
// - 'loading-time-updated': number     // Обновлено время загрузки
// - 'state-changed': EditorState       // Изменено состояние
// - 'layout-added': Layout             // Добавлен слой
// - 'layout-removed': string           // Удален слой (ID)
// - 'layout-updated': Layout           // Обновлен слой
```

## 🗄 Структура данных

### Layout (Слой)

```typescript
// Базовый слой
type Layout = {
    id: string;                    // Уникальный ID
    type: 'image' | 'text';        // Тип слоя
    position: { x: number, y: number }; // Позиция на холсте
    size: number;                  // Размер (коэффициент)
    aspectRatio: number;           // Соотношение сторон
    view: 'front' | 'back';        // На какой стороне расположен
    angle: number;                 // Угол поворота
    name?: string;                 // Пользовательское название
}

// Текстовый слой
type TextLayout = Layout & {
    type: 'text';
    text: string;                  // Текст
    font: {
        family: string;            // Шрифт
        size: number;              // Размер шрифта
    };
}

// Слой изображения
type ImageLayout = Layout & {
    type: 'image'; 
    url: string;                   // URL изображения
}
```

### Состояние редактора

```typescript
type EditorState = {
    date: string;                  // Дата сохранения
    color: string;                 // Название цвета
    side: 'front' | 'back';        // Текущая сторона
    type: 'tshirt' | 'hoodie';     // Тип продукта
    layouts: Layout[];             // Массив слоев
    size: string;                  // Размер товара
}
```

## 🔧 Интеграция с Tilda

### Добавление товара в корзину

```javascript
// Функция вызывается автоматически при клике на кнопку "Добавить в корзину"
// Но можно вызвать и программно:

async function addToCart() {
    if (editor.getSum() === 0) {
        alert('Для добавления заказа продукт не может быть пустым');
        return;
    }

    // Экспорт дизайна
    const exportedArt = await editor.exportArt();
    
    // Создание товара через API
    const product = await createProduct({
        quantity: editor.getQuantity(),
        name: `Футболка с вашим принтом`,
        size: editor.selectSize,
        color: editor.selectColor,
        sides: Object.keys(exportedArt).map(side => ({
            image_url: exportedArt[side] || '',
        })),
    });
    
    console.log('Товар добавлен:', product);
}
```

### Получение данных из формы Tilda

```javascript
// Конфигурация формы для генерации AI изображений
const formConfig = {
    formBlockClass: '#generation-form',
    formInputVariableName: 'prompt',      // Имя поля в Tilda
    formButtonClass: '#generate-btn'
};

// Добавление в конфигурацию редактора
const editorConfig = {
    // ... остальная конфигурация ...
    formConfig: formConfig
};
```

## 💾 Автосохранение и история

Редактор автоматически:

1. **Сохраняет состояние** в IndexedDB при каждом изменении
2. **Мигрирует данные** из localStorage в IndexedDB при первом запуске
3. **Создает точки истории** при важных действиях:
   - Добавление/удаление слоя
   - Изменение цвета/стороны
   - Ручное сохранение

### Срок хранения данных

- **Состояние редактора**: 30 дней
- **История изменений**: без ограничений (до очистки пользователем)

## 📱 Адаптивность

Редактор адаптируется под различные размеры экранов:

```css
.editor-content {
    aspect-ratio: 1 / 1;
    width: 100%;
    max-width: 100vw;
    background: #F9F9F9;
    border-radius: 24px;
}

@media (min-width: 768px) {
    .editor-content {
        max-width: 600px;
    }
}
```

## ⚠️ Требования и ограничения

### Минимальные требования

- **Браузер**: Chrome 90+, Firefox 88+, Safari 14+
- **JavaScript**: ES2020+ (поддержка async/await, optional chaining)
- **IndexedDB**: для сохранения состояния
- **Canvas**: для отрисовки дизайна

### Зависимости

- **Fabric.js 5.3+**: для работы с canvas
- **Lucide Icons**: для иконок интерфейса

### Ограничения

- Максимальный размер изображения: зависит от памяти браузера
- Количество слоев: рекомендуется не более 20 на сторону
- Форматы изображений: JPG, PNG, GIF, WebP

## 🐛 Troubleshooting

### Частые проблемы

**Редактор не инициализируется**
```javascript
// Проверьте наличие зависимостей
console.log(typeof fabric);  // должно быть 'object'
console.log(typeof lucide);  // должно быть 'object'
```

**Canvas не отображается**
```javascript
// Проверьте размеры контейнера
console.log(editor.editorBlock.clientWidth);  // должно быть > 0
console.log(editor.editorBlock.clientHeight); // должно быть > 0
```

**Изображения не загружаются**
- Проверьте CORS политики для изображений
- Убедитесь в корректности URL
- Проверьте размер изображений (не более 10MB)

**Состояние не сохраняется**
- Проверьте поддержку IndexedDB в браузере
- Очистите данные сайта и попробуйте снова

## 📄 Лицензия

MIT License - смотрите файл LICENSE для подробностей.

## 🤝 Поддержка

Для вопросов и проблем:

1. Проверьте этот README
2. Изучите примеры в папке `examples/`
3. Проверьте консоль браузера на наличие ошибок
4. Создайте issue с подробным описанием проблемы

## 🔔 Компонент Popup

Компонент для создания всплывающих окон с автоматическим показом и системой cookie для запоминания закрытия.

### Особенности Popup

- **Автоматический показ** через заданное время
- **Cookie система** - запоминает закрытие пользователем  
- **Адаптивное позиционирование** (fixed position)
- **Программное управление** показом/скрытием
- **TypeScript поддержка** с полной типизацией

### Быстрый старт с Popup

#### 1. HTML разметка

```html
<!-- Контент popup (скрытый изначально) -->
<div id="my-popup" style="display: none;">
    <div class="popup-content">
        <div class="popup-header">
            <h3>Заголовок popup</h3>
            <button class="popup-close">✖</button>
        </div>
        <div class="popup-body">
            <p>Содержимое вашего popup...</p>
            <button>Действие</button>
        </div>
    </div>
</div>
```

#### 2. CSS стили (рекомендуемые)

```css
.popup-content {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    max-width: 400px;
    margin: 20px;
}

.popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.popup-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #666;
}

.popup-close:hover {
    color: #000;
}
```

#### 3. JavaScript инициализация

```javascript
// Базовая конфигурация
const popup = new Popup({
    popupId: 'my-popup',                    // ID элемента popup
    popupContentClass: 'popup-content',     // CSS класс контента
    closeButtonClass: 'popup-close',        // CSS класс кнопки закрытия
    timeoutSeconds: 5,                      // Показать через 5 секунд
    autoShow: true,                         // Автоматический показ
    cookieName: 'my-popup-closed',          // Имя cookie
    cookieExpiresDays: 7                    // Cookie на 7 дней
});

// Глобальный доступ (опционально)
window.popup = popup;
```

### Конфигурация Popup

```typescript
type PopupProps = {
    popupId: string;                      // ID HTML элемента popup (обязательно)
    popupContentClass: string;            // CSS класс контента (обязательно)
    closeButtonClass?: string;            // CSS класс кнопки закрытия
    timeoutSeconds?: number;              // Задержка показа в секундах (по умолчанию: 10)
    autoShow?: boolean;                   // Автоматический показ (по умолчанию: true)
    cookieName?: string;                  // Имя cookie (по умолчанию: 'popup')
    cookieExpiresDays?: number;           // Срок cookie в днях (по умолчанию: 1)
}
```

### API методы Popup

```javascript
// Показать popup программно
popup.show();

// Закрыть popup программно  
popup.close();

// Проверка состояния автопоказа
console.log(popup.autoShow);              // boolean

// Получение элементов
console.log(popup.popupBlock);            // HTMLElement - основной блок
console.log(popup.popupContentBlock);     // HTMLElement - контент
console.log(popup.popupWrapperBlock);     // HTMLElement - обертка
console.log(popup.closeButton);           // HTMLElement | null - кнопка закрытия
```

### Примеры использования Popup

#### Простой информационный popup

```javascript
const infoPopup = new Popup({
    popupId: 'info-popup',
    popupContentClass: 'info-content',
    closeButtonClass: 'info-close',
    timeoutSeconds: 3,
    cookieName: 'info-shown',
    cookieExpiresDays: 1
});
```

#### Popup промо-акции

```javascript
const promoPopup = new Popup({
    popupId: 'promo-popup', 
    popupContentClass: 'promo-content',
    closeButtonClass: 'promo-close',
    timeoutSeconds: 10,                   // Показать через 10 секунд
    cookieName: 'promo-december-2023',    // Уникальное имя для акции
    cookieExpiresDays: 30                 // Не показывать месяц
});
```

#### Popup без автопоказа

```javascript
const manualPopup = new Popup({
    popupId: 'manual-popup',
    popupContentClass: 'manual-content', 
    closeButtonClass: 'manual-close',
    autoShow: false                       // Отключить автопоказ
});

// Показать по событию
document.getElementById('show-popup-btn').onclick = () => {
    manualPopup.show();
};
```

#### Popup с длительным cookie

```javascript
const rarePopup = new Popup({
    popupId: 'rare-popup',
    popupContentClass: 'rare-content',
    closeButtonClass: 'rare-close', 
    timeoutSeconds: 30,
    cookieName: 'rare-popup-2023',
    cookieExpiresDays: 365                // Не показывать год
});
```

### Расширенные примеры

#### Popup с формой

```html
<div id="subscription-popup" style="display: none;">
    <div class="subscription-content">
        <div class="popup-header">
            <h3>📧 Подписка на новости</h3>
            <button class="subscription-close">✖</button>
        </div>
        <form class="subscription-form">
            <input type="email" placeholder="Ваш email..." required>
            <button type="submit">Подписаться</button>
        </form>
    </div>
</div>
```

```javascript
const subscriptionPopup = new Popup({
    popupId: 'subscription-popup',
    popupContentClass: 'subscription-content',
    closeButtonClass: 'subscription-close',
    timeoutSeconds: 15,
    cookieName: 'subscription-popup',
    cookieExpiresDays: 14
});

// Обработка формы
document.querySelector('.subscription-form').onsubmit = (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    
    // Отправка данных...
    console.log('Подписка:', email);
    
    // Закрытие popup после успешной подписки
    subscriptionPopup.close();
};
```

#### Popup с изображением

```html
<div id="image-popup" style="display: none;">
    <div class="image-content">
        <button class="image-close">✖</button>
        <img src="/promo-banner.jpg" alt="Промо" style="max-width: 100%;">
        <div class="image-actions">
            <button class="btn-primary">Узнать больше</button>
        </div>
    </div>
</div>
```

```javascript
const imagePopup = new Popup({
    popupId: 'image-popup',
    popupContentClass: 'image-content',
    closeButtonClass: 'image-close',
    timeoutSeconds: 8,
    cookieName: 'promo-banner-2023-dec',
    cookieExpiresDays: 7
});
```

### Множественные popup

```javascript
// Создание нескольких popup с разными настройками
const popups = {
    welcome: new Popup({
        popupId: 'welcome-popup',
        popupContentClass: 'welcome-content',
        closeButtonClass: 'welcome-close',
        timeoutSeconds: 3,
        cookieName: 'welcome-shown'
    }),
    
    discount: new Popup({
        popupId: 'discount-popup', 
        popupContentClass: 'discount-content',
        closeButtonClass: 'discount-close',
        timeoutSeconds: 20,
        cookieName: 'discount-popup-nov',
        cookieExpiresDays: 30
    }),
    
    feedback: new Popup({
        popupId: 'feedback-popup',
        popupContentClass: 'feedback-content',
        closeButtonClass: 'feedback-close',
        autoShow: false,  // Показывать только программно
        cookieName: 'feedback-popup'
    })
};

// Показать feedback popup при определенном событии
setTimeout(() => {
    popups.feedback.show();
}, 60000); // Через минуту
```

### Интеграция с аналитикой

```javascript
const analyticsPopup = new Popup({
    popupId: 'analytics-popup',
    popupContentClass: 'analytics-content', 
    closeButtonClass: 'analytics-close',
    timeoutSeconds: 12,
    cookieName: 'analytics-popup'
});

// Отслеживание показа
const originalShow = analyticsPopup.show.bind(analyticsPopup);
analyticsPopup.show = function() {
    // Аналитика показа
    gtag('event', 'popup_shown', {
        popup_type: 'analytics',
        timing: 12
    });
    
    return originalShow();
};

// Отслеживание закрытия  
const originalClose = analyticsPopup.close.bind(analyticsPopup);
analyticsPopup.close = function() {
    // Аналитика закрытия
    gtag('event', 'popup_closed', {
        popup_type: 'analytics'
    });
    
    return originalClose();
};
```

### Стилизация popup

```css
/* Базовые стили */
.popup-content {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    backdrop-filter: blur(10px);
    max-width: 420px;
    margin: 20px;
    position: relative;
}

/* Анимации */
@keyframes popupSlideIn {
    from {
        transform: translateY(100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.popup-content {
    animation: popupSlideIn 0.3s ease-out;
}

/* Адаптивность */
@media (max-width: 768px) {
    .popup-content {
        margin: 10px;
        max-width: calc(100vw - 20px);
    }
}
```

### Troubleshooting Popup

**Popup не показывается**
```javascript
// Проверьте наличие элементов
console.log(document.getElementById('my-popup')); // не null?
console.log(document.querySelector('.popup-content')); // не null?

// Проверьте cookie
console.log(document.cookie); // содержит ли нужный cookie?
```

**Popup показывается постоянно**
```javascript
// Очистите cookie для тестирования
document.cookie = 'popup-name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
```

**Кнопка закрытия не работает**
```javascript
// Проверьте селектор кнопки
console.log(document.querySelector('.popup-close')); // не null?
```

## 📚 Дополнительные ресурсы

- [Документация Fabric.js](https://fabricjs.com/docs/)
- [Lucide Icons](https://lucide.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
