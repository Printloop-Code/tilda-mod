import { Layout } from '../models/Layout';
import { Product, SideEnum } from '../types';

/**
 * Параметры для отрисовки слоя на canvas
 */
export interface RenderLayoutParams {
    layout: Layout;
    product: Product;
    containerWidth: number;
    containerHeight: number;
    loadImage: (src: string) => Promise<HTMLImageElement>;
}

/**
 * Результат вычисления позиции и размера слоя
 */
export interface LayoutDimensions {
    left: number;
    top: number;
    scaleX: number;
    scaleY: number;
    angle: number;
    printAreaWidth: number;
    printAreaHeight: number;
    printAreaLeft: number;
    printAreaTop: number;
}

/**
 * Вычисляет абсолютные размеры и позицию слоя на основе относительных координат
 * 
 * @param layout - Слой с относительными координатами (position.x, position.y от 0 до 1)
 * @param product - Продукт с конфигурацией области печати
 * @param containerWidth - Ширина контейнера (canvas/editor)
 * @param containerHeight - Высота контейнера (canvas/editor)
 * @returns Абсолютные размеры и позиция для отрисовки
 */
export function calculateLayoutDimensions(
    layout: Layout,
    product: Product,
    containerWidth: number,
    containerHeight: number
): LayoutDimensions {
    // Находим конфигурацию области печати для этой стороны
    const printConfig = product.printConfig.find(pc => pc.side === layout.view);
    if (!printConfig) {
        throw new Error(`Print config not found for side: ${layout.view}`);
    }

    // Вычисляем размеры области печати относительно контейнера
    // printConfig.size хранится как пиксели при ширине 600px (базовое разрешение Tilda)
    const printAreaWidth = (printConfig.size.width / 600) * containerWidth;
    const printAreaHeight = (printConfig.size.height / 600) * containerHeight;

    // Вычисляем позицию области печати (центрированная + смещение из printConfig)
    const printAreaLeft = Math.round(
        (containerWidth - printAreaWidth) / 2 + (printConfig.position.x / 100) * containerWidth
    );
    const printAreaTop = Math.round(
        (containerHeight - printAreaHeight) / 2 + (printConfig.position.y / 100) * containerHeight
    );

    // Вычисляем абсолютную позицию слоя внутри области печати
    // layout.position.x и layout.position.y - это доли от 0 до 1 внутри области печати
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

/**
 * Универсальная функция для отрисовки слоя на canvas с относительными размерами
 * Используется как в редакторе (fabric.js), так и при экспорте (нативный canvas)
 * 
 * @param params - Параметры отрисовки
 * @returns Объект fabric.js (Image или Text) или null если слой не может быть отрисован
 */
export async function renderLayout(params: RenderLayoutParams): Promise<any> {
    const { layout, product, containerWidth, containerHeight, loadImage } = params;

    // Вычисляем размеры и позицию
    const dimensions = calculateLayoutDimensions(layout, product, containerWidth, containerHeight);

    // Динамически импортируем fabric только если нужно
    const fabric = (window as any).fabric;
    if (!fabric) {
        console.error('[renderLayout] fabric.js не загружен');
        return null;
    }

    if (layout.isImageLayout()) {
        const img = await loadImage(layout.url);
        const image = new fabric.Image(img);

        // Вычисляем актуальный scale с учётом текущего размера области печати
        let actualScale = layout.size;
        
        // Если есть сохраненная относительная ширина (процент от области печати),
        // пересчитываем scale для текущего размера области печати
        const relativeWidth = (layout as any)._relativeWidth;
        if (relativeWidth && relativeWidth > 0) {
            // Вычисляем целевую ширину в пикселях для текущей области печати
            const targetWidth = dimensions.printAreaWidth * relativeWidth;
            // Вычисляем scale для достижения этой ширины
            actualScale = targetWidth / img.width;
            console.debug(`[renderLayout] Адаптация к новому размеру: relativeWidth=${relativeWidth.toFixed(3)}, targetWidth=${targetWidth.toFixed(1)}px, scale=${actualScale.toFixed(3)}`);
        } 
        // Автоматическая подгонка размера если изображение слишком большое
        else if (layout.size === 1 && img.width > dimensions.printAreaWidth) {
            actualScale = dimensions.printAreaWidth / img.width;
            
            // ВАЖНО: Обновляем layout.size для сохранения относительного размера
            layout.size = actualScale;
            
            // Сохраняем относительную ширину
            const objectWidth = img.width * actualScale;
            const relW = objectWidth / dimensions.printAreaWidth;
            (layout as any)._relativeWidth = relW;
            
            console.debug(`[renderLayout] Автоподгонка размера: ${img.width}px → ${dimensions.printAreaWidth}px, scale=${actualScale.toFixed(3)}, relativeWidth=${relW.toFixed(3)}`);
        }
        // Если _relativeWidth отсутствует (старые layouts), вычисляем его из layout.size
        else if (!relativeWidth || relativeWidth === 0) {
            const objectWidth = img.width * layout.size;
            const relW = objectWidth / dimensions.printAreaWidth;
            (layout as any)._relativeWidth = relW;
            console.debug(`[renderLayout] Вычислен _relativeWidth для старого layout: ${relW.toFixed(3)}`);
        }

        image.set({
            left: dimensions.left,
            top: dimensions.top,
            scaleX: actualScale,
            scaleY: actualScale * layout.aspectRatio,
            angle: dimensions.angle,
            name: layout.id,
            layoutUrl: layout.url, // Для отслеживания изменений URL
        } as any);

        return image;
    } else if (layout.isTextLayout()) {
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
        } as any);

        return text;
    }

    return null;
}

/**
 * Отрисовывает слой напрямую на нативный canvas (без fabric.js)
 * Используется при экспорте в высоком разрешении
 * 
 * @param ctx - Контекст canvas для рисования
 * @param layout - Слой для отрисовки
 * @param product - Продукт с конфигурацией
 * @param containerWidth - Ширина canvas
 * @param containerHeight - Высота canvas
 * @param loadImage - Функция загрузки изображений
 */
export async function renderLayoutToCanvas(
    ctx: CanvasRenderingContext2D,
    layout: Layout,
    product: Product,
    containerWidth: number,
    containerHeight: number,
    loadImage: (src: string) => Promise<HTMLImageElement>
): Promise<void> {
    const dimensions = calculateLayoutDimensions(layout, product, containerWidth, containerHeight);

    if (layout.isImageLayout()) {
        const img = await loadImage(layout.url);

        // Сохраняем состояние контекста
        ctx.save();

        // Применяем трансформации
        ctx.translate(dimensions.left, dimensions.top);
        ctx.rotate((dimensions.angle * Math.PI) / 180);

        // Рисуем изображение с масштабированием
        const width = img.width * dimensions.scaleX;
        const height = img.height * dimensions.scaleY;
        ctx.drawImage(img, 0, 0, width, height);

        // Восстанавливаем состояние контекста
        ctx.restore();
    } else if (layout.isTextLayout()) {
        // Сохраняем состояние контекста
        ctx.save();

        // Применяем трансформации
        ctx.translate(dimensions.left, dimensions.top);
        ctx.rotate((dimensions.angle * Math.PI) / 180);

        // Настраиваем шрифт и рисуем текст
        ctx.font = `${layout.font.size * dimensions.scaleX}px ${layout.font.family}`;
        ctx.fillStyle = 'black'; // Можно добавить color в Layout если нужно
        ctx.fillText(layout.text, 0, 0);

        // Восстанавливаем состояние контекста
        ctx.restore();
    }
}

