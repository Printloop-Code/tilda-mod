import Editor from '../components/Editor';

// Устанавливаем в window для доступа из HTML
if (typeof window !== 'undefined') {
  (window as any).Editor = Editor;
}

// Экспортируем Editor как default для UMD бандла
export default Editor;
