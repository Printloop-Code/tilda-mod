import Popup from './components/Popup';
import Editor from './components/Editor';
import { CardForm } from './components/CardForm';
import { initSafeRouteV2 } from './utils/safeRouteIntegrationV2';

(window as any).popup = Popup;
(window as any).editor = Editor;
(window as any).cardForm = CardForm;

// Инициализируем агрессивную интеграцию SafeRoute V2
// Гарантирует, что телефон попадет в форму
initSafeRouteV2();
