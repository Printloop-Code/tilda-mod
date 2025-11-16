(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["core"] = factory();
	else
		root["core"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/utils/safeRouteIntegrationV2.ts":
/*!*********************************************!*\
  !*** ./src/utils/safeRouteIntegrationV2.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SafeRouteIntegrationV2: () => (/* binding */ SafeRouteIntegrationV2),
/* harmony export */   initSafeRouteV2: () => (/* binding */ initSafeRouteV2)
/* harmony export */ });
class SafeRouteIntegrationV2 {
    constructor() {
        this.phoneData = null;
        this.initialized = false;
        this.originalFormDataAppend = null;
        this.init();
    }
    init() {
        if (this.initialized)
            return;
        console.log('[SafeRoute V2] 🚀 Инициализация агрессивной версии...');
        window.addEventListener('message', this.handleMessage.bind(this));
        this.interceptFormData();
        this.interceptXHR();
        this.interceptFetch();
        this.interceptSubmit();
        this.initialized = true;
        console.log('[SafeRoute V2] ✅ Инициализация завершена');
        window.safeRouteV2 = this;
    }
    handleMessage(event) {
        if (!event.origin.includes('saferoute.ru'))
            return;
        try {
            const data = typeof event.data === 'string'
                ? JSON.parse(event.data)
                : event.data;
            console.log('[SafeRoute V2] 📬 Сообщение от SafeRoute');
            const phone = this.extractPhone(data);
            if (phone) {
                console.log('[SafeRoute V2] 📱 Телефон:', phone);
                this.setPhone(phone);
            }
        }
        catch (error) {
            console.debug('[SafeRoute V2] Ошибка обработки:', error);
        }
    }
    extractPhone(data) {
        return data.phone ||
            data.data?.contacts?.phone ||
            data.contacts?.phone ||
            data.recipient?.phone ||
            null;
    }
    setPhone(phone) {
        const parsed = this.parsePhone(phone);
        if (!parsed) {
            console.warn('[SafeRoute V2] ❌ Не удалось распарсить:', phone);
            return;
        }
        this.phoneData = parsed;
        console.log('[SafeRoute V2] ✅ Телефон сохранен:', this.phoneData);
        try {
            sessionStorage.setItem('sr_phone', JSON.stringify(this.phoneData));
        }
        catch (e) { }
        this.fillPhoneFields();
    }
    parsePhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 0)
            return null;
        let iso = '+7';
        let number = cleaned;
        if (cleaned.startsWith('7') && cleaned.length === 11) {
            number = cleaned.substring(1);
        }
        else if (cleaned.startsWith('8') && cleaned.length === 11) {
            number = cleaned.substring(1);
        }
        else if (cleaned.length === 10) {
        }
        else {
            return null;
        }
        const formatted = this.formatPhone(number);
        return {
            iso: iso,
            number: formatted,
            full: `${iso} ${formatted}`
        };
    }
    formatPhone(phone) {
        if (phone.length !== 10)
            return phone;
        return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6, 8)}-${phone.substring(8, 10)}`;
    }
    fillPhoneFields() {
        if (!this.phoneData)
            return;
        const forms = document.querySelectorAll('form');
        let filled = false;
        forms.forEach(form => {
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
    ensureInput(form, name, type) {
        let input = form.querySelector(`input[name="${name}"]`);
        if (!input) {
            input = document.createElement('input');
            input.type = type;
            input.name = name;
            input.style.display = 'none';
            form.appendChild(input);
            console.log('[SafeRoute V2] ➕ Создано поле:', name);
        }
        return input;
    }
    interceptFormData() {
        const self = this;
        const OriginalFormData = window.FormData;
        window.FormData = function (form) {
            const formData = new OriginalFormData(form);
            if (self.phoneData) {
                if (!formData.has('phone') || !formData.get('phone')) {
                    formData.set('tildaspec-phone-part[]-iso', self.phoneData.iso);
                    formData.set('tildaspec-phone-part[]', self.phoneData.number);
                    formData.set('phone', self.phoneData.full);
                    console.log('[SafeRoute V2] 📦 Телефон добавлен в FormData');
                }
            }
            return formData;
        };
        window.FormData.prototype = OriginalFormData.prototype;
        console.log('[SafeRoute V2] ✅ FormData перехвачен');
    }
    interceptXHR() {
        const self = this;
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function (method, url, ...args) {
            this._url = url;
            this._method = method;
            return originalOpen.apply(this, [method, url, ...args]);
        };
        XMLHttpRequest.prototype.send = function (body) {
            const url = this._url || '';
            if (url.includes('forms.tildaapi.com') || url.includes('/form/submit')) {
                console.log('[SafeRoute V2] 🌐 Перехват XHR к:', url);
                if (self.phoneData && body instanceof FormData) {
                    if (!body.has('phone') || !body.get('phone')) {
                        body.set('tildaspec-phone-part[]-iso', self.phoneData.iso);
                        body.set('tildaspec-phone-part[]', self.phoneData.number);
                        body.set('phone', self.phoneData.full);
                        console.log('[SafeRoute V2] ✅ Телефон добавлен в XHR');
                    }
                }
                else if (self.phoneData && typeof body === 'string') {
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
    interceptFetch() {
        const self = this;
        const originalFetch = window.fetch;
        window.fetch = function (input, init) {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
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
            return originalFetch.apply(window, [input, init]);
        };
        console.log('[SafeRoute V2] ✅ fetch перехвачен');
    }
    interceptSubmit() {
        document.addEventListener('submit', (event) => {
            const form = event.target;
            console.log('[SafeRoute V2] 📤 Submit формы:', form.action);
            if (this.phoneData) {
                this.fillPhoneFields();
            }
            if (!this.phoneData) {
                try {
                    const saved = sessionStorage.getItem('sr_phone');
                    if (saved) {
                        this.phoneData = JSON.parse(saved);
                        this.fillPhoneFields();
                    }
                }
                catch (e) { }
            }
        }, true);
        console.log('[SafeRoute V2] ✅ Submit перехвачен');
    }
    getPhone() {
        return this.phoneData;
    }
}
let instance = null;
function initSafeRouteV2() {
    if (!instance) {
        instance = new SafeRouteIntegrationV2();
    }
    return instance;
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSafeRouteV2);
}
else {
    initSafeRouteV2();
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*****************************!*\
  !*** ./src/entries/core.ts ***!
  \*****************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _utils_safeRouteIntegrationV2__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/safeRouteIntegrationV2 */ "./src/utils/safeRouteIntegrationV2.ts");

(0,_utils_safeRouteIntegrationV2__WEBPACK_IMPORTED_MODULE_0__.initSafeRouteV2)();
const Core = { init: _utils_safeRouteIntegrationV2__WEBPACK_IMPORTED_MODULE_0__.initSafeRouteV2 };
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Core);

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0QsTzs7Ozs7Ozs7Ozs7Ozs7O0FDVk87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQixLQUFLLEVBQUUsVUFBVTtBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLHNCQUFzQixJQUFJLHNCQUFzQixHQUFHLHNCQUFzQixHQUFHLHVCQUF1QjtBQUN0SDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0RBQXNELEtBQUs7QUFDM0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztVQzVPQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQ3RCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHlDQUF5Qyx3Q0FBd0M7V0FDakY7V0FDQTtXQUNBLEU7Ozs7O1dDUEEsd0Y7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdELEU7Ozs7Ozs7Ozs7Ozs7OztBQ05rRTtBQUNsRSw4RUFBZTtBQUNmLGVBQWUsTUFBTSwwRUFBZTtBQUNwQyxpRUFBZSxJQUFJLEVBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbiIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL3V0aWxzL3NhZmVSb3V0ZUludGVncmF0aW9uVjIudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvZW50cmllcy9jb3JlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcImNvcmVcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wiY29yZVwiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsICgpID0+IHtcbnJldHVybiAiLCJleHBvcnQgY2xhc3MgU2FmZVJvdXRlSW50ZWdyYXRpb25WMiB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucGhvbmVEYXRhID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9yaWdpbmFsRm9ybURhdGFBcHBlbmQgPSBudWxsO1xuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG4gICAgaW5pdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDwn5qAINCY0L3QuNGG0LjQsNC70LjQt9Cw0YbQuNGPINCw0LPRgNC10YHRgdC40LLQvdC+0Lkg0LLQtdGA0YHQuNC4Li4uJyk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5oYW5kbGVNZXNzYWdlLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmludGVyY2VwdEZvcm1EYXRhKCk7XG4gICAgICAgIHRoaXMuaW50ZXJjZXB0WEhSKCk7XG4gICAgICAgIHRoaXMuaW50ZXJjZXB0RmV0Y2goKTtcbiAgICAgICAgdGhpcy5pbnRlcmNlcHRTdWJtaXQoKTtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDinIUg0JjQvdC40YbQuNCw0LvQuNC30LDRhtC40Y8g0LfQsNCy0LXRgNGI0LXQvdCwJyk7XG4gICAgICAgIHdpbmRvdy5zYWZlUm91dGVWMiA9IHRoaXM7XG4gICAgfVxuICAgIGhhbmRsZU1lc3NhZ2UoZXZlbnQpIHtcbiAgICAgICAgaWYgKCFldmVudC5vcmlnaW4uaW5jbHVkZXMoJ3NhZmVyb3V0ZS5ydScpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHR5cGVvZiBldmVudC5kYXRhID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgID8gSlNPTi5wYXJzZShldmVudC5kYXRhKVxuICAgICAgICAgICAgICAgIDogZXZlbnQuZGF0YTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDwn5OsINCh0L7QvtCx0YnQtdC90LjQtSDQvtGCIFNhZmVSb3V0ZScpO1xuICAgICAgICAgICAgY29uc3QgcGhvbmUgPSB0aGlzLmV4dHJhY3RQaG9uZShkYXRhKTtcbiAgICAgICAgICAgIGlmIChwaG9uZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDwn5OxINCi0LXQu9C10YTQvtC9OicsIHBob25lKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFBob25lKHBob25lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tTYWZlUm91dGUgVjJdINCe0YjQuNCx0LrQsCDQvtCx0YDQsNCx0L7RgtC60Lg6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGV4dHJhY3RQaG9uZShkYXRhKSB7XG4gICAgICAgIHJldHVybiBkYXRhLnBob25lIHx8XG4gICAgICAgICAgICBkYXRhLmRhdGE/LmNvbnRhY3RzPy5waG9uZSB8fFxuICAgICAgICAgICAgZGF0YS5jb250YWN0cz8ucGhvbmUgfHxcbiAgICAgICAgICAgIGRhdGEucmVjaXBpZW50Py5waG9uZSB8fFxuICAgICAgICAgICAgbnVsbDtcbiAgICB9XG4gICAgc2V0UGhvbmUocGhvbmUpIHtcbiAgICAgICAgY29uc3QgcGFyc2VkID0gdGhpcy5wYXJzZVBob25lKHBob25lKTtcbiAgICAgICAgaWYgKCFwYXJzZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW1NhZmVSb3V0ZSBWMl0g4p2MINCd0LUg0YPQtNCw0LvQvtGB0Ywg0YDQsNGB0L/QsNGA0YHQuNGC0Yw6JywgcGhvbmUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucGhvbmVEYXRhID0gcGFyc2VkO1xuICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g4pyFINCi0LXQu9C10YTQvtC9INGB0L7RhdGA0LDQvdC10L06JywgdGhpcy5waG9uZURhdGEpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSgnc3JfcGhvbmUnLCBKU09OLnN0cmluZ2lmeSh0aGlzLnBob25lRGF0YSkpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7IH1cbiAgICAgICAgdGhpcy5maWxsUGhvbmVGaWVsZHMoKTtcbiAgICB9XG4gICAgcGFyc2VQaG9uZShwaG9uZSkge1xuICAgICAgICBjb25zdCBjbGVhbmVkID0gcGhvbmUucmVwbGFjZSgvXFxEL2csICcnKTtcbiAgICAgICAgaWYgKGNsZWFuZWQubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGxldCBpc28gPSAnKzcnO1xuICAgICAgICBsZXQgbnVtYmVyID0gY2xlYW5lZDtcbiAgICAgICAgaWYgKGNsZWFuZWQuc3RhcnRzV2l0aCgnNycpICYmIGNsZWFuZWQubGVuZ3RoID09PSAxMSkge1xuICAgICAgICAgICAgbnVtYmVyID0gY2xlYW5lZC5zdWJzdHJpbmcoMSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY2xlYW5lZC5zdGFydHNXaXRoKCc4JykgJiYgY2xlYW5lZC5sZW5ndGggPT09IDExKSB7XG4gICAgICAgICAgICBudW1iZXIgPSBjbGVhbmVkLnN1YnN0cmluZygxKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjbGVhbmVkLmxlbmd0aCA9PT0gMTApIHtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZvcm1hdHRlZCA9IHRoaXMuZm9ybWF0UGhvbmUobnVtYmVyKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlzbzogaXNvLFxuICAgICAgICAgICAgbnVtYmVyOiBmb3JtYXR0ZWQsXG4gICAgICAgICAgICBmdWxsOiBgJHtpc299ICR7Zm9ybWF0dGVkfWBcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZm9ybWF0UGhvbmUocGhvbmUpIHtcbiAgICAgICAgaWYgKHBob25lLmxlbmd0aCAhPT0gMTApXG4gICAgICAgICAgICByZXR1cm4gcGhvbmU7XG4gICAgICAgIHJldHVybiBgKCR7cGhvbmUuc3Vic3RyaW5nKDAsIDMpfSkgJHtwaG9uZS5zdWJzdHJpbmcoMywgNil9LSR7cGhvbmUuc3Vic3RyaW5nKDYsIDgpfS0ke3Bob25lLnN1YnN0cmluZyg4LCAxMCl9YDtcbiAgICB9XG4gICAgZmlsbFBob25lRmllbGRzKCkge1xuICAgICAgICBpZiAoIXRoaXMucGhvbmVEYXRhKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBmb3JtcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2Zvcm0nKTtcbiAgICAgICAgbGV0IGZpbGxlZCA9IGZhbHNlO1xuICAgICAgICBmb3Jtcy5mb3JFYWNoKGZvcm0gPT4ge1xuICAgICAgICAgICAgY29uc3QgaXNvSW5wdXQgPSB0aGlzLmVuc3VyZUlucHV0KGZvcm0sICd0aWxkYXNwZWMtcGhvbmUtcGFydFtdLWlzbycsICdoaWRkZW4nKTtcbiAgICAgICAgICAgIGNvbnN0IG51bWJlcklucHV0ID0gdGhpcy5lbnN1cmVJbnB1dChmb3JtLCAndGlsZGFzcGVjLXBob25lLXBhcnRbXScsICd0ZWwnKTtcbiAgICAgICAgICAgIGNvbnN0IHBob25lSW5wdXQgPSB0aGlzLmVuc3VyZUlucHV0KGZvcm0sICdwaG9uZScsICdoaWRkZW4nKTtcbiAgICAgICAgICAgIGlmIChpc29JbnB1dCAmJiB0aGlzLnBob25lRGF0YSkge1xuICAgICAgICAgICAgICAgIGlzb0lucHV0LnZhbHVlID0gdGhpcy5waG9uZURhdGEuaXNvO1xuICAgICAgICAgICAgICAgIGZpbGxlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobnVtYmVySW5wdXQgJiYgdGhpcy5waG9uZURhdGEpIHtcbiAgICAgICAgICAgICAgICBudW1iZXJJbnB1dC52YWx1ZSA9IHRoaXMucGhvbmVEYXRhLm51bWJlcjtcbiAgICAgICAgICAgICAgICBmaWxsZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBob25lSW5wdXQgJiYgdGhpcy5waG9uZURhdGEpIHtcbiAgICAgICAgICAgICAgICBwaG9uZUlucHV0LnZhbHVlID0gdGhpcy5waG9uZURhdGEuZnVsbDtcbiAgICAgICAgICAgICAgICBmaWxsZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGZpbGxlZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tTYWZlUm91dGUgVjJdIOKchSDQn9C+0LvRjyDQt9Cw0L/QvtC70L3QtdC90YsnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbnN1cmVJbnB1dChmb3JtLCBuYW1lLCB0eXBlKSB7XG4gICAgICAgIGxldCBpbnB1dCA9IGZvcm0ucXVlcnlTZWxlY3RvcihgaW5wdXRbbmFtZT1cIiR7bmFtZX1cIl1gKTtcbiAgICAgICAgaWYgKCFpbnB1dCkge1xuICAgICAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgaW5wdXQudHlwZSA9IHR5cGU7XG4gICAgICAgICAgICBpbnB1dC5uYW1lID0gbmFtZTtcbiAgICAgICAgICAgIGlucHV0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICBmb3JtLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDinpUg0KHQvtC30LTQsNC90L4g0L/QvtC70LU6JywgbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgIH1cbiAgICBpbnRlcmNlcHRGb3JtRGF0YSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGNvbnN0IE9yaWdpbmFsRm9ybURhdGEgPSB3aW5kb3cuRm9ybURhdGE7XG4gICAgICAgIHdpbmRvdy5Gb3JtRGF0YSA9IGZ1bmN0aW9uIChmb3JtKSB7XG4gICAgICAgICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBPcmlnaW5hbEZvcm1EYXRhKGZvcm0pO1xuICAgICAgICAgICAgaWYgKHNlbGYucGhvbmVEYXRhKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFmb3JtRGF0YS5oYXMoJ3Bob25lJykgfHwgIWZvcm1EYXRhLmdldCgncGhvbmUnKSkge1xuICAgICAgICAgICAgICAgICAgICBmb3JtRGF0YS5zZXQoJ3RpbGRhc3BlYy1waG9uZS1wYXJ0W10taXNvJywgc2VsZi5waG9uZURhdGEuaXNvKTtcbiAgICAgICAgICAgICAgICAgICAgZm9ybURhdGEuc2V0KCd0aWxkYXNwZWMtcGhvbmUtcGFydFtdJywgc2VsZi5waG9uZURhdGEubnVtYmVyKTtcbiAgICAgICAgICAgICAgICAgICAgZm9ybURhdGEuc2V0KCdwaG9uZScsIHNlbGYucGhvbmVEYXRhLmZ1bGwpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g8J+TpiDQotC10LvQtdGE0L7QvSDQtNC+0LHQsNCy0LvQtdC9INCyIEZvcm1EYXRhJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZvcm1EYXRhO1xuICAgICAgICB9O1xuICAgICAgICB3aW5kb3cuRm9ybURhdGEucHJvdG90eXBlID0gT3JpZ2luYWxGb3JtRGF0YS5wcm90b3R5cGU7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDinIUgRm9ybURhdGEg0L/QtdGA0LXRhdCy0LDRh9C10L0nKTtcbiAgICB9XG4gICAgaW50ZXJjZXB0WEhSKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxPcGVuID0gWE1MSHR0cFJlcXVlc3QucHJvdG90eXBlLm9wZW47XG4gICAgICAgIGNvbnN0IG9yaWdpbmFsU2VuZCA9IFhNTEh0dHBSZXF1ZXN0LnByb3RvdHlwZS5zZW5kO1xuICAgICAgICBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUub3BlbiA9IGZ1bmN0aW9uIChtZXRob2QsIHVybCwgLi4uYXJncykge1xuICAgICAgICAgICAgdGhpcy5fdXJsID0gdXJsO1xuICAgICAgICAgICAgdGhpcy5fbWV0aG9kID0gbWV0aG9kO1xuICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsT3Blbi5hcHBseSh0aGlzLCBbbWV0aG9kLCB1cmwsIC4uLmFyZ3NdKTtcbiAgICAgICAgfTtcbiAgICAgICAgWE1MSHR0cFJlcXVlc3QucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbiAoYm9keSkge1xuICAgICAgICAgICAgY29uc3QgdXJsID0gdGhpcy5fdXJsIHx8ICcnO1xuICAgICAgICAgICAgaWYgKHVybC5pbmNsdWRlcygnZm9ybXMudGlsZGFhcGkuY29tJykgfHwgdXJsLmluY2x1ZGVzKCcvZm9ybS9zdWJtaXQnKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDwn4yQINCf0LXRgNC10YXQstCw0YIgWEhSINC6OicsIHVybCk7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYucGhvbmVEYXRhICYmIGJvZHkgaW5zdGFuY2VvZiBGb3JtRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWJvZHkuaGFzKCdwaG9uZScpIHx8ICFib2R5LmdldCgncGhvbmUnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9keS5zZXQoJ3RpbGRhc3BlYy1waG9uZS1wYXJ0W10taXNvJywgc2VsZi5waG9uZURhdGEuaXNvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHkuc2V0KCd0aWxkYXNwZWMtcGhvbmUtcGFydFtdJywgc2VsZi5waG9uZURhdGEubnVtYmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHkuc2V0KCdwaG9uZScsIHNlbGYucGhvbmVEYXRhLmZ1bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tTYWZlUm91dGUgVjJdIOKchSDQotC10LvQtdGE0L7QvSDQtNC+0LHQsNCy0LvQtdC9INCyIFhIUicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNlbGYucGhvbmVEYXRhICYmIHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKGJvZHkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXBhcmFtcy5oYXMoJ3Bob25lJykgfHwgIXBhcmFtcy5nZXQoJ3Bob25lJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtcy5zZXQoJ3RpbGRhc3BlYy1waG9uZS1wYXJ0W10taXNvJywgc2VsZi5waG9uZURhdGEuaXNvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtcy5zZXQoJ3RpbGRhc3BlYy1waG9uZS1wYXJ0W10nLCBzZWxmLnBob25lRGF0YS5udW1iZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zLnNldCgncGhvbmUnLCBzZWxmLnBob25lRGF0YS5mdWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHkgPSBwYXJhbXMudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDinIUg0KLQtdC70LXRhNC+0L0g0LTQvtCx0LDQstC70LXQvSDQsiBYSFIgKFVSTEVuY29kZWQpJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3JpZ2luYWxTZW5kLmNhbGwodGhpcywgYm9keSk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDinIUgWE1MSHR0cFJlcXVlc3Qg0L/QtdGA0LXRhdCy0LDRh9C10L0nKTtcbiAgICB9XG4gICAgaW50ZXJjZXB0RmV0Y2goKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBjb25zdCBvcmlnaW5hbEZldGNoID0gd2luZG93LmZldGNoO1xuICAgICAgICB3aW5kb3cuZmV0Y2ggPSBmdW5jdGlvbiAoaW5wdXQsIGluaXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycgPyBpbnB1dCA6IGlucHV0IGluc3RhbmNlb2YgVVJMID8gaW5wdXQuaHJlZiA6IGlucHV0LnVybDtcbiAgICAgICAgICAgIGlmICh1cmwuaW5jbHVkZXMoJ2Zvcm1zLnRpbGRhYXBpLmNvbScpIHx8IHVybC5pbmNsdWRlcygnL2Zvcm0vc3VibWl0JykpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1NhZmVSb3V0ZSBWMl0g8J+MkCDQn9C10YDQtdGF0LLQsNGCIGZldGNoINC6OicsIHVybCk7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYucGhvbmVEYXRhICYmIGluaXQ/LmJvZHkgaW5zdGFuY2VvZiBGb3JtRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWluaXQuYm9keS5oYXMoJ3Bob25lJykgfHwgIWluaXQuYm9keS5nZXQoJ3Bob25lJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXQuYm9keS5zZXQoJ3RpbGRhc3BlYy1waG9uZS1wYXJ0W10taXNvJywgc2VsZi5waG9uZURhdGEuaXNvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXQuYm9keS5zZXQoJ3RpbGRhc3BlYy1waG9uZS1wYXJ0W10nLCBzZWxmLnBob25lRGF0YS5udW1iZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5pdC5ib2R5LnNldCgncGhvbmUnLCBzZWxmLnBob25lRGF0YS5mdWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDinIUg0KLQtdC70LXRhNC+0L0g0LTQvtCx0LDQstC70LXQvSDQsiBmZXRjaCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsRmV0Y2guYXBwbHkod2luZG93LCBbaW5wdXQsIGluaXRdKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc29sZS5sb2coJ1tTYWZlUm91dGUgVjJdIOKchSBmZXRjaCDQv9C10YDQtdGF0LLQsNGH0LXQvScpO1xuICAgIH1cbiAgICBpbnRlcmNlcHRTdWJtaXQoKSB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZm9ybSA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDwn5OkIFN1Ym1pdCDRhNC+0YDQvNGLOicsIGZvcm0uYWN0aW9uKTtcbiAgICAgICAgICAgIGlmICh0aGlzLnBob25lRGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmlsbFBob25lRmllbGRzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMucGhvbmVEYXRhKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2F2ZWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKCdzcl9waG9uZScpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2F2ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGhvbmVEYXRhID0gSlNPTi5wYXJzZShzYXZlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGxQaG9uZUZpZWxkcygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbU2FmZVJvdXRlIFYyXSDinIUgU3VibWl0INC/0LXRgNC10YXQstCw0YfQtdC9Jyk7XG4gICAgfVxuICAgIGdldFBob25lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5waG9uZURhdGE7XG4gICAgfVxufVxubGV0IGluc3RhbmNlID0gbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBpbml0U2FmZVJvdXRlVjIoKSB7XG4gICAgaWYgKCFpbnN0YW5jZSkge1xuICAgICAgICBpbnN0YW5jZSA9IG5ldyBTYWZlUm91dGVJbnRlZ3JhdGlvblYyKCk7XG4gICAgfVxuICAgIHJldHVybiBpbnN0YW5jZTtcbn1cbmlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnbG9hZGluZycpIHtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgaW5pdFNhZmVSb3V0ZVYyKTtcbn1cbmVsc2Uge1xuICAgIGluaXRTYWZlUm91dGVWMigpO1xufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgeyBpbml0U2FmZVJvdXRlVjIgfSBmcm9tICcuLi91dGlscy9zYWZlUm91dGVJbnRlZ3JhdGlvblYyJztcbmluaXRTYWZlUm91dGVWMigpO1xuY29uc3QgQ29yZSA9IHsgaW5pdDogaW5pdFNhZmVSb3V0ZVYyIH07XG5leHBvcnQgZGVmYXVsdCBDb3JlO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9