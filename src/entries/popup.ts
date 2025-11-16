import Popup from '../components/Popup';

// Устанавливаем в window для доступа из HTML
if (typeof window !== 'undefined') {
  (window as any).Popup = Popup;
}

// Экспортируем Popup как default для UMD бандла
export default Popup;
