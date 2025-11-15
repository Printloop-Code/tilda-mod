import Popup from './components/Popup';
import Editor from './components/Editor';
import { CardForm } from './components/CardForm';
import { initSafeRouteV2 } from './utils/safeRouteIntegrationV2';

(window as any).Popup = Popup;
(window as any).Editor = Editor;
(window as any).CardForm = CardForm;

// Инициализируем агрессивную интеграцию SafeRoute V2
// Гарантирует, что телефон попадет в форму
initSafeRouteV2();
