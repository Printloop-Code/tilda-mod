import { initSafeRouteV2 } from '../utils/safeRouteIntegrationV2';

// Инициализируем агрессивную интеграцию SafeRoute V2
// Гарантирует, что телефон попадет в форму
initSafeRouteV2();

// Экспортируем для возможности использования
export default { init: initSafeRouteV2 };

