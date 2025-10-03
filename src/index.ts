import Popup from './components/Popup';
import Editor from './components/Editor';
import { productConfigs, editorBlocks, formConfig } from './config/products';
import { CardForm } from './components/CardForm';

if (document.readyState !== 'loading') {
    createPopup();
} else {
    document.addEventListener('DOMContentLoaded', createPopup);
}

function createPopup() {
    (window as any).popup = new Popup({
        timeoutSeconds: 2,
        popupId: 'rec1269819191',
        popupContentClass: 'popup-content-rec1269819191',
        closeButtonClass: 'popup-close-rec1269819191',
    });
}

new Editor({
    blocks: editorBlocks,
    formConfig: formConfig,
    productConfigs: productConfigs,
});

// Инициализация CardForm
window.onload = () => {
    new CardForm({
        cardBlockId: "#rec1362370811",
        rules: [
            {
                variable: "term_variant",
                actions: [
                    {
                        value: "1-2 дня (+500р на изделие)",
                        sum: 500
                    }
                ]
            }
        ]
    });
};