import { EditorStorageManager } from '../managers/EditorStorageManager';
import { Layout } from '../models/Layout';
import { CreateProductProps } from '../types';

type GenerateImageProps = {
    uri: string;
    prompt: string;
    shirtColor: string;
    image?: string | null | undefined;
    withAi: boolean;
    layoutId: Layout['id'] | null | undefined;
    isNew?: boolean;
    background?: boolean;
}

export async function generateImage({
    uri,
    prompt,
    shirtColor,
    image,
    withAi,
    layoutId,
    isNew = true,
    background = true,
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
    formData.set('background', background.toString());

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

    const response = await fetch(uri, {
        method: "POST",
        body: formData,
    });

    const responseData = await response.json();

    return responseData.image_url || responseData.image;
}

export function createProduct({ quantity, name, size, color, sides, article, price }: CreateProductProps) {
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

    if (typeof (window as any).tcart__addProduct === 'function') {
        try {
            (window as any).tcart__addProduct(resultProduct);
            try {
                (window as any).ym(103279214, 'reachGoal', 'add_to_cart')
            }
            catch (error) { }
        } catch (error) {
            console.error('[cart] Ошибка при добавлении продукта в корзину', error);
        }
    } else {
        console.warn('[cart] Корзина Tilda не загружена.');
    }
}

