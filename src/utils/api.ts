import { EditorStorageManager } from '../managers/EditorStorageManager';
import { Layout } from '../models/Layout';
import { CreateProductProps } from '../types';
import { productConfigs } from '../config/products';

// API endpoints
const API_ENDPOINTS = {
    WEBHOOK_REQUEST: 'https://primary-production-654c.up.railway.app/webhook/request',
} as const;

type GenerateImageProps = {
    prompt: string;
    shirtColor: string;
    image?: string | null | undefined;
    withAi: boolean;
    layoutId: Layout['id'] | null | undefined;
    isNew?: boolean;
}

export async function generateImage({
    prompt,
    shirtColor,
    image,
    withAi,
    layoutId,
    isNew = true,
}: GenerateImageProps): Promise<string> {
    const tempStorageManager = new EditorStorageManager();
    const userId = await (tempStorageManager as any).getUserId();

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
        const type = header!.split(':')[1]!.split(';')[0]!;

        console.debug('[generate image] [type]', type);

        const byteCharacters = atob(data!);
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

export function createProduct({ quantity, name, size, color, sides, productType }: CreateProductProps) {
    const productId = (Math.random() + 1).toString(36).substring(7) + "_" + Date.now();

    // Получаем конфигурацию продукта для определения цены
    const productConfig = productConfigs.find(p => p.type === productType);
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

    if (typeof (window as any).tcart__addProduct === 'function') {
        try {
            (window as any).tcart__addProduct(resultProduct);
        } catch (error) {
            console.error('[cart] Ошибка при добавлении продукта в корзину', error);
        }
    } else {
        console.warn('[cart] Корзина Tilda не загружена.');
    }
}

