import { CardForm } from '../components/CardForm';

// Устанавливаем в window для доступа из HTML
if (typeof window !== 'undefined') {
  (window as any).CardForm = CardForm;
}

export default CardForm;


