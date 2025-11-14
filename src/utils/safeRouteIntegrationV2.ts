/**
 * SafeRoute Integration V2 - Агрессивная версия
 * 
 * Эта версия:
 * 1. Создает поля телефона, если их нет
 * 2. Перехватывает FormData перед отправкой
 * 3. Гарантирует, что телефон попадет в запрос
 */

interface SafeRouteData {
    phone?: string;
    data?: {
        contacts?: {
            phone?: string;
            fullName?: string;
            email?: string;
        };
        [key: string]: any;
    };
    contacts?: {
        phone?: string;
        [key: string]: any;
    };
    recipient?: {
        phone?: string;
        [key: string]: any;
    };
    [key: string]: any;
}

export class SafeRouteIntegrationV2 {
    private phoneData: { iso: string; number: string; full: string } | null = null;
    private initialized = false;
    private originalFormDataAppend: any = null;

    constructor() {
        this.init();
    }

    private init(): void {
        if (this.initialized) return;

        console.log('[SafeRoute V2] 🚀 Инициализация агрессивной версии...');

        // 1. Слушаем postMessage
        window.addEventListener('message', this.handleMessage.bind(this));
        
        // 2. Перехватываем FormData
        this.interceptFormData();
        
        // 3. Перехватываем XMLHttpRequest
        this.interceptXHR();
        
        // 4. Перехватываем fetch
        this.interceptFetch();
        
        // 5. Перехватываем submit
        this.interceptSubmit();

        this.initialized = true;
        console.log('[SafeRoute V2] ✅ Инициализация завершена');
        
        // Экспорт в window
        (window as any).safeRouteV2 = this;
    }

    private handleMessage(event: MessageEvent): void {
        if (!event.origin.includes('saferoute.ru')) return;

        try {
            const data: SafeRouteData = typeof event.data === 'string' 
                ? JSON.parse(event.data) 
                : event.data;

            console.log('[SafeRoute V2] 📬 Сообщение от SafeRoute');

            // Извлекаем телефон
            const phone = this.extractPhone(data);
            if (phone) {
                console.log('[SafeRoute V2] 📱 Телефон:', phone);
                this.setPhone(phone);
            }
        } catch (error) {
            console.debug('[SafeRoute V2] Ошибка обработки:', error);
        }
    }

    private extractPhone(data: SafeRouteData): string | null {
        return data.phone ||
               data.data?.contacts?.phone ||
               data.contacts?.phone ||
               data.recipient?.phone ||
               null;
    }

    public setPhone(phone: string): void {
        const parsed = this.parsePhone(phone);
        if (!parsed) {
            console.warn('[SafeRoute V2] ❌ Не удалось распарсить:', phone);
            return;
        }

        this.phoneData = parsed;
        console.log('[SafeRoute V2] ✅ Телефон сохранен:', this.phoneData);

        // Сохраняем в sessionStorage
        try {
            sessionStorage.setItem('sr_phone', JSON.stringify(this.phoneData));
        } catch (e) {}

        // Сразу пытаемся заполнить форму
        this.fillPhoneFields();
    }

    private parsePhone(phone: string): { iso: string; number: string; full: string } | null {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 0) return null;

        let iso = '+7';
        let number = cleaned;

        if (cleaned.startsWith('7') && cleaned.length === 11) {
            number = cleaned.substring(1);
        } else if (cleaned.startsWith('8') && cleaned.length === 11) {
            number = cleaned.substring(1);
        } else if (cleaned.length === 10) {
            // OK
        } else {
            return null;
        }

        const formatted = this.formatPhone(number);
        return {
            iso: iso,
            number: formatted,
            full: `${iso} ${formatted}`
        };
    }

    private formatPhone(phone: string): string {
        if (phone.length !== 10) return phone;
        return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6, 8)}-${phone.substring(8, 10)}`;
    }

    private fillPhoneFields(): void {
        if (!this.phoneData) return;

        // Ищем все формы на странице
        const forms = document.querySelectorAll('form');
        let filled = false;

        forms.forEach(form => {
            // Создаем/обновляем поля телефона
            const isoInput = this.ensureInput(form, 'tildaspec-phone-part[]-iso', 'hidden');
            const numberInput = this.ensureInput(form, 'tildaspec-phone-part[]', 'tel');
            const phoneInput = this.ensureInput(form, 'phone', 'hidden');

            if (isoInput && this.phoneData) {
                isoInput.value = this.phoneData.iso;
                filled = true;
            }
            if (numberInput && this.phoneData) {
                numberInput.value = this.phoneData.number;
                filled = true;
            }
            if (phoneInput && this.phoneData) {
                phoneInput.value = this.phoneData.full;
                filled = true;
            }
        });

        if (filled) {
            console.log('[SafeRoute V2] ✅ Поля заполнены');
        }
    }

    private ensureInput(form: HTMLFormElement, name: string, type: string): HTMLInputElement | null {
        let input = form.querySelector(`input[name="${name}"]`) as HTMLInputElement;
        
        if (!input) {
            // Создаем поле, если его нет
            input = document.createElement('input');
            input.type = type;
            input.name = name;
            input.style.display = 'none';
            form.appendChild(input);
            console.log('[SafeRoute V2] ➕ Создано поле:', name);
        }

        return input;
    }

    /**
     * Перехват FormData для добавления телефона
     */
    private interceptFormData(): void {
        const self = this;
        const OriginalFormData = window.FormData;

        (window as any).FormData = function(form?: HTMLFormElement) {
            const formData = new OriginalFormData(form);

            // Если есть сохраненный телефон, добавляем его
            if (self.phoneData) {
                // Проверяем, нет ли уже этих полей
                if (!formData.has('phone') || !formData.get('phone')) {
                    formData.set('tildaspec-phone-part[]-iso', self.phoneData.iso);
                    formData.set('tildaspec-phone-part[]', self.phoneData.number);
                    formData.set('phone', self.phoneData.full);
                    console.log('[SafeRoute V2] 📦 Телефон добавлен в FormData');
                }
            }

            return formData;
        };

        // Копируем прототип
        (window as any).FormData.prototype = OriginalFormData.prototype;

        console.log('[SafeRoute V2] ✅ FormData перехвачен');
    }

    /**
     * Перехват XMLHttpRequest
     */
    private interceptXHR(): void {
        const self = this;
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method: string, url: string, ...args: any[]) {
            (this as any)._url = url;
            (this as any)._method = method;
            return originalOpen.apply(this, [method, url, ...args] as any);
        };

        XMLHttpRequest.prototype.send = function(body?: any) {
            const url = (this as any)._url || '';
            
            // Проверяем, это запрос к Tilda forms API
            if (url.includes('forms.tildaapi.com') || url.includes('/form/submit')) {
                console.log('[SafeRoute V2] 🌐 Перехват XHR к:', url);

                if (self.phoneData && body instanceof FormData) {
                    // Добавляем телефон в FormData
                    if (!body.has('phone') || !body.get('phone')) {
                        body.set('tildaspec-phone-part[]-iso', self.phoneData.iso);
                        body.set('tildaspec-phone-part[]', self.phoneData.number);
                        body.set('phone', self.phoneData.full);
                        console.log('[SafeRoute V2] ✅ Телефон добавлен в XHR');
                    }
                } else if (self.phoneData && typeof body === 'string') {
                    // URL-encoded формат
                    const params = new URLSearchParams(body);
                    if (!params.has('phone') || !params.get('phone')) {
                        params.set('tildaspec-phone-part[]-iso', self.phoneData.iso);
                        params.set('tildaspec-phone-part[]', self.phoneData.number);
                        params.set('phone', self.phoneData.full);
                        body = params.toString();
                        console.log('[SafeRoute V2] ✅ Телефон добавлен в XHR (URLEncoded)');
                    }
                }
            }

            return originalSend.call(this, body);
        };

        console.log('[SafeRoute V2] ✅ XMLHttpRequest перехвачен');
    }

    /**
     * Перехват fetch
     */
    private interceptFetch(): void {
        const self = this;
        const originalFetch = window.fetch;

        window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

            if (url.includes('forms.tildaapi.com') || url.includes('/form/submit')) {
                console.log('[SafeRoute V2] 🌐 Перехват fetch к:', url);

                if (self.phoneData && init?.body instanceof FormData) {
                    if (!init.body.has('phone') || !init.body.get('phone')) {
                        init.body.set('tildaspec-phone-part[]-iso', self.phoneData.iso);
                        init.body.set('tildaspec-phone-part[]', self.phoneData.number);
                        init.body.set('phone', self.phoneData.full);
                        console.log('[SafeRoute V2] ✅ Телефон добавлен в fetch');
                    }
                }
            }

            return originalFetch.apply(window, [input, init] as any);
        };

        console.log('[SafeRoute V2] ✅ fetch перехвачен');
    }

    /**
     * Перехват submit
     */
    private interceptSubmit(): void {
        document.addEventListener('submit', (event) => {
            const form = event.target as HTMLFormElement;
            
            console.log('[SafeRoute V2] 📤 Submit формы:', form.action);

            // Заполняем поля перед отправкой
            if (this.phoneData) {
                this.fillPhoneFields();
            }

            // Пытаемся загрузить из sessionStorage
            if (!this.phoneData) {
                try {
                    const saved = sessionStorage.getItem('sr_phone');
                    if (saved) {
                        this.phoneData = JSON.parse(saved);
                        this.fillPhoneFields();
                    }
                } catch (e) {}
            }
        }, true);

        console.log('[SafeRoute V2] ✅ Submit перехвачен');
    }

    public getPhone(): { iso: string; number: string; full: string } | null {
        return this.phoneData;
    }
}

// Автоинициализация
let instance: SafeRouteIntegrationV2 | null = null;

export function initSafeRouteV2(): SafeRouteIntegrationV2 {
    if (!instance) {
        instance = new SafeRouteIntegrationV2();
    }
    return instance;
}

// Запуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSafeRouteV2);
} else {
    initSafeRouteV2();
}

