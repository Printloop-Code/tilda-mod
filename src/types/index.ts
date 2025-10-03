// Базовые типы
export type Position = {
    x: number;
    y: number;
}

export type Font = {
    family: string;
    size: number;
}

export type LayoutType = 'image' | 'text';

export type SideEnum = 'front' | 'back';

export type Size = "S" | "M" | "L" | "XL" | "2XL";

export type Color = {
    name: string;
    hex: string;
}

// Layout типы
export type BaseLayoutProps = {
    id?: string;
    position?: Position;
    size?: number;
    aspectRatio?: number;
    view: SideEnum;
    angle?: number;
    name?: string | null;
}

export type ImageLayoutProps = BaseLayoutProps & {
    type: 'image';
    url: string;
}

export type TextLayoutProps = BaseLayoutProps & {
    type: 'text';
    text?: string;
    font?: Font;
}

export type LayoutProps = ImageLayoutProps | TextLayoutProps;

// Product типы
export type PrintConfig = {
    side: SideEnum;
    position: Position;
    size: {
        width: number;
        height: number;
    };
}

export type Mockup = {
    side: SideEnum;
    url: string;
    color: Color;
}

export type Product = {
    type: 'tshirt' | 'hoodie';
    productName: string;
    sizes?: Size[];
    mockups: Mockup[];
    printConfig: PrintConfig[];
    price: number; // Цена за односторонний принт
    doubleSidedPrice: number; // Цена за двухсторонний принт
}

// Editor типы
export type EditorState = {
    date: string;
    type: Product['type'];
    color: string;
    side: SideEnum;
    size: Size;
}

export type UserData = {
    userId: string;
}

// History типы
export type LayerOperation = 'add' | 'remove';

export type LayerHistoryItem = {
    id: string;
    timestamp: number;
    operation: LayerOperation;
    layout: any;
    side: SideEnum;
    type: Product['type'];
    description?: string;
}

export type HistoryItem = {
    id: string;
    timestamp: number;
    side: SideEnum;
    type: Product['type'];
    color: string;
    size: string;
    layouts: any[];
    description?: string;
}

export type HistoryFilter = {
    side: SideEnum;
    type: Product['type'];
}

// UI типы
export type EditorProps = {
    blocks: {
        editorBlockClass: string;
        changeSideButtonClass: string;
        productListBlockClass: string;
        productItemClass: string;
        productItemImageClass: string;
        productItemTextClass: string;
        editorSumBlockClass: string;
        editorSettingsBlockClass: string;
        editorClipImageBlockClass: string;
        editorAddOrderButtonClass: string;
        editorProductNameClass: string;
        editorColorsListBlockClass: string;
        editorColorItemBlockClass: string;
        editorSizesListBlockClass: string;
        editorSizeItemBlockClass: string;
        editorLayoutsListBlockClass: string;
        editorLayoutItemBlockClass: string;
        editorLayoutItemBlockViewClass: string;
        editorLayoutItemBlockNameClass: string;
        editorLayoutItemBlockRemoveClass: string;
        editorUploadImageButtonClass: string;
        editorUploadViewBlockClass: string;
        editorUploadCancelButtonClass: string;
        editorLayoutItemBlockEditClass: string;
        editorQuantityFormBlockClass: string;
        editorHistoryUndoBlockClass: string;
        editorHistoryRedoBlockClass: string;
        editorLoadWithAiButtonClass: string;
        editorLoadWithoutAiButtonClass: string;
    }
    formConfig?: {
        formBlockClass: string;
        formInputVariableName: string;
        formButtonClass: string;
    }
    productConfigs: Product[];
}

// Popup типы
export type PopupProps = {
    popupId: string;
    popupContentClass: string;
    timeoutSeconds?: number;
    closeButtonClass?: string;
    autoShow?: boolean;
    cookieName?: string;
    cookieExpiresDays?: number;
}

// CardForm типы
export type RuleCart = {
    variable: string;
    actions: {
        value: string;
        sum?: number;
        quantityType?: 'fixed' | 'perProduct'; // fixed = 1 шт, perProduct = по количеству товаров
        quantity?: number; // конкретное количество (если не указано, используется quantityType)
    }[];
}

export type CardFormProps = {
    cardBlockId: string;
    rules: RuleCart[];
}

// Product creation типы
export type CardProduct = {
    image_url: string;
}

export type CreateProductProps = {
    quantity: number;
    name: string;
    size: Size;
    color: Color;
    sides: { image_url: string }[];
    productType: Product['type'];
    article: number;
}

