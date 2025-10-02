import Popup from './components/Popup';
import Editor from './components/Editor';
import { productConfigs, editorBlocks, formConfig } from './config/products';

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

// // Инициализация CardForm
// window.onload = () => {
//     new CardForm({
//         cardBlockId: "#rec1334316211",
//         rules: [
//             {
//                 variable: "additional_services",
//                 actions: [
//                     {
//                         value: "Срочный заказ, печать до 2 дней (+500р)",
//                         sum: 500
//                     }
//                 ]
//             },
//             {
//                 variable: "delivery",
//                 actions: [
//                     {
//                         value: "Доставка до ПВЗ",
//                     },
//                     {
//                         value: "Доставка курьером"
//                     }
//                 ]
//             }
//         ]
//     });
// };