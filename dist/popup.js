(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["popup"] = factory();
	else
		root["popup"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/components/Popup.ts":
/*!*********************************!*\
  !*** ./src/components/Popup.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Popup)
/* harmony export */ });
const popupLogger = console.debug.bind(console, '[Popup]');
const logIssue = (key, payload) => {
    try {
        if (typeof window.OpenReplay?.handleError === 'function') {
            window.OpenReplay.handleError(new Error(key), payload);
        }
    }
    catch (e) {
        console.warn('[OpenReplay] Failed to log issue:', e);
    }
};
class Popup {
    constructor({ popupId, popupContentClass, closeButtonClass, timeoutSeconds = 10, autoShow = true, cookieName = 'popup', cookieExpiresDays = 1, }) {
        this.closeButton = null;
        this.autoShow = false;
        this.autoShowTimeout = null;
        this.timeoutSeconds = 25;
        this.cookieName = "popup";
        this.cookieExpiresDays = 1;
        if (!popupId || !popupContentClass) {
            logIssue('popup_init_error', {
                error: 'missing_required_params',
                hasPopupId: !!popupId,
                hasPopupContentClass: !!popupContentClass
            });
            throw new Error('[Popup] popupId or popupContentClass is not provided');
        }
        const findPopupBlock = document.getElementById(popupId);
        if (!findPopupBlock) {
            logIssue('popup_init_error', {
                error: 'popup_block_not_found',
                popupId: popupId
            });
            throw new Error(`Popup block with id ${popupId} not found`);
        }
        const findPopupContentBlock = document.querySelector(`.${popupContentClass}`);
        if (!findPopupContentBlock) {
            logIssue('popup_init_error', {
                error: 'popup_content_block_not_found',
                popupContentClass: popupContentClass
            });
            throw new Error(`Popup content block with class ${popupContentClass} not found`);
        }
        this.popupBlock = findPopupBlock;
        this.popupContentBlock = findPopupContentBlock;
        this.initPopupBlock();
        this.popupWrapperBlock = this.initPopupWrapper();
        const findCloseButton = document.querySelector(`.${closeButtonClass}`);
        if (!findCloseButton) {
            popupLogger(`close button with class ${closeButtonClass} not found`);
            logIssue('popup_close_button_not_found', {
                closeButtonClass: closeButtonClass
            });
        }
        this.closeButton = findCloseButton;
        this.initCloseButton();
        if (timeoutSeconds) {
            this.timeoutSeconds = timeoutSeconds;
        }
        if (autoShow) {
            this.autoShow = autoShow;
        }
        if (cookieName) {
            this.cookieName = cookieName;
        }
        if (cookieExpiresDays) {
            this.cookieExpiresDays = cookieExpiresDays;
        }
        if (this.popupBlock && this.closeButton) {
            this.initAutoShow();
        }
    }
    initPopupWrapper() {
        const popupWrapper = document.createElement('div');
        popupWrapper.style.display = 'block';
        popupWrapper.id = 'popup-wrapper';
        popupWrapper.style.position = 'fixed';
        popupWrapper.style.right = '0';
        popupWrapper.style.bottom = '0';
        popupWrapper.style.width = '100%';
        popupWrapper.style.zIndex = '9999';
        popupWrapper.style.pointerEvents = 'none';
        return popupWrapper;
    }
    initPopupBlock() {
        this.popupBlock.style.display = 'none';
    }
    initCloseButton() {
        if (!this.closeButton)
            return;
        this.closeButton.style.cursor = 'pointer';
        this.closeButton.onclick = () => this.close();
    }
    initAutoShow() {
        if (this.autoShow && !document.cookie.includes(`${this.cookieName}=true`)) {
            this.autoShowTimeout = setTimeout(() => this.show(), this.timeoutSeconds * 1000);
        }
        else {
            popupLogger('is not auto shown');
        }
    }
    show() {
        this.popupWrapperBlock.appendChild(this.popupBlock);
        this.popupContentBlock.style.pointerEvents = 'auto';
        this.popupBlock.style.display = 'block';
        document.body.appendChild(this.popupWrapperBlock);
        logIssue('popup_shown', {
            cookieName: this.cookieName,
            timeoutSeconds: this.timeoutSeconds,
            autoShow: this.autoShow
        });
    }
    close() {
        this.popupWrapperBlock.style.display = 'none';
        document.cookie = `${this.cookieName}=true; expires=${new Date(Date.now() + this.cookieExpiresDays * 24 * 60 * 60 * 1000).toUTCString()}; path=/;`;
        logIssue('popup_closed', {
            cookieName: this.cookieName,
            cookieExpiresDays: this.cookieExpiresDays
        });
    }
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
/*!******************************!*\
  !*** ./src/entries/popup.ts ***!
  \******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _components_Popup__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../components/Popup */ "./src/components/Popup.ts");

if (typeof window !== 'undefined') {
    window.Popup = _components_Popup__WEBPACK_IMPORTED_MODULE_0__["default"];
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_components_Popup__WEBPACK_IMPORTED_MODULE_0__["default"]);

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXAuanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87Ozs7Ozs7Ozs7Ozs7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNlO0FBQ2Ysa0JBQWtCLGtJQUFrSTtBQUNwSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLG1EQUFtRCxTQUFTO0FBQzVEO0FBQ0EsaUVBQWlFLGtCQUFrQjtBQUNuRjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYiw4REFBOEQsbUJBQW1CO0FBQ2pGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyREFBMkQsaUJBQWlCO0FBQzVFO0FBQ0EsbURBQW1ELGtCQUFrQjtBQUNyRTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwREFBMEQsZ0JBQWdCO0FBQzFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSw2QkFBNkIsZ0JBQWdCLE9BQU8sVUFBVSxvRkFBb0YsT0FBTztBQUN6SjtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTs7Ozs7OztVQ3hIQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQ3RCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHlDQUF5Qyx3Q0FBd0M7V0FDakY7V0FDQTtXQUNBLEU7Ozs7O1dDUEEsd0Y7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdELEU7Ozs7Ozs7Ozs7Ozs7OztBQ053QztBQUN4QztBQUNBLG1CQUFtQix5REFBSztBQUN4QjtBQUNBLGlFQUFlLHlEQUFLLEVBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbiIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL2NvbXBvbmVudHMvUG9wdXAudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvZW50cmllcy9wb3B1cC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJwb3B1cFwiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJwb3B1cFwiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsICgpID0+IHtcbnJldHVybiAiLCJjb25zdCBwb3B1cExvZ2dlciA9IGNvbnNvbGUuZGVidWcuYmluZChjb25zb2xlLCAnW1BvcHVwXScpO1xuY29uc3QgbG9nSXNzdWUgPSAoa2V5LCBwYXlsb2FkKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cuT3BlblJlcGxheT8uaGFuZGxlRXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHdpbmRvdy5PcGVuUmVwbGF5LmhhbmRsZUVycm9yKG5ldyBFcnJvcihrZXkpLCBwYXlsb2FkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1tPcGVuUmVwbGF5XSBGYWlsZWQgdG8gbG9nIGlzc3VlOicsIGUpO1xuICAgIH1cbn07XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQb3B1cCB7XG4gICAgY29uc3RydWN0b3IoeyBwb3B1cElkLCBwb3B1cENvbnRlbnRDbGFzcywgY2xvc2VCdXR0b25DbGFzcywgdGltZW91dFNlY29uZHMgPSAxMCwgYXV0b1Nob3cgPSB0cnVlLCBjb29raWVOYW1lID0gJ3BvcHVwJywgY29va2llRXhwaXJlc0RheXMgPSAxLCB9KSB7XG4gICAgICAgIHRoaXMuY2xvc2VCdXR0b24gPSBudWxsO1xuICAgICAgICB0aGlzLmF1dG9TaG93ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYXV0b1Nob3dUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy50aW1lb3V0U2Vjb25kcyA9IDI1O1xuICAgICAgICB0aGlzLmNvb2tpZU5hbWUgPSBcInBvcHVwXCI7XG4gICAgICAgIHRoaXMuY29va2llRXhwaXJlc0RheXMgPSAxO1xuICAgICAgICBpZiAoIXBvcHVwSWQgfHwgIXBvcHVwQ29udGVudENsYXNzKSB7XG4gICAgICAgICAgICBsb2dJc3N1ZSgncG9wdXBfaW5pdF9lcnJvcicsIHtcbiAgICAgICAgICAgICAgICBlcnJvcjogJ21pc3NpbmdfcmVxdWlyZWRfcGFyYW1zJyxcbiAgICAgICAgICAgICAgICBoYXNQb3B1cElkOiAhIXBvcHVwSWQsXG4gICAgICAgICAgICAgICAgaGFzUG9wdXBDb250ZW50Q2xhc3M6ICEhcG9wdXBDb250ZW50Q2xhc3NcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbUG9wdXBdIHBvcHVwSWQgb3IgcG9wdXBDb250ZW50Q2xhc3MgaXMgbm90IHByb3ZpZGVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmluZFBvcHVwQmxvY2sgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwb3B1cElkKTtcbiAgICAgICAgaWYgKCFmaW5kUG9wdXBCbG9jaykge1xuICAgICAgICAgICAgbG9nSXNzdWUoJ3BvcHVwX2luaXRfZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgZXJyb3I6ICdwb3B1cF9ibG9ja19ub3RfZm91bmQnLFxuICAgICAgICAgICAgICAgIHBvcHVwSWQ6IHBvcHVwSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQb3B1cCBibG9jayB3aXRoIGlkICR7cG9wdXBJZH0gbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmluZFBvcHVwQ29udGVudEJsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLiR7cG9wdXBDb250ZW50Q2xhc3N9YCk7XG4gICAgICAgIGlmICghZmluZFBvcHVwQ29udGVudEJsb2NrKSB7XG4gICAgICAgICAgICBsb2dJc3N1ZSgncG9wdXBfaW5pdF9lcnJvcicsIHtcbiAgICAgICAgICAgICAgICBlcnJvcjogJ3BvcHVwX2NvbnRlbnRfYmxvY2tfbm90X2ZvdW5kJyxcbiAgICAgICAgICAgICAgICBwb3B1cENvbnRlbnRDbGFzczogcG9wdXBDb250ZW50Q2xhc3NcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQb3B1cCBjb250ZW50IGJsb2NrIHdpdGggY2xhc3MgJHtwb3B1cENvbnRlbnRDbGFzc30gbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wb3B1cEJsb2NrID0gZmluZFBvcHVwQmxvY2s7XG4gICAgICAgIHRoaXMucG9wdXBDb250ZW50QmxvY2sgPSBmaW5kUG9wdXBDb250ZW50QmxvY2s7XG4gICAgICAgIHRoaXMuaW5pdFBvcHVwQmxvY2soKTtcbiAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXJCbG9jayA9IHRoaXMuaW5pdFBvcHVwV3JhcHBlcigpO1xuICAgICAgICBjb25zdCBmaW5kQ2xvc2VCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuJHtjbG9zZUJ1dHRvbkNsYXNzfWApO1xuICAgICAgICBpZiAoIWZpbmRDbG9zZUJ1dHRvbikge1xuICAgICAgICAgICAgcG9wdXBMb2dnZXIoYGNsb3NlIGJ1dHRvbiB3aXRoIGNsYXNzICR7Y2xvc2VCdXR0b25DbGFzc30gbm90IGZvdW5kYCk7XG4gICAgICAgICAgICBsb2dJc3N1ZSgncG9wdXBfY2xvc2VfYnV0dG9uX25vdF9mb3VuZCcsIHtcbiAgICAgICAgICAgICAgICBjbG9zZUJ1dHRvbkNsYXNzOiBjbG9zZUJ1dHRvbkNsYXNzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNsb3NlQnV0dG9uID0gZmluZENsb3NlQnV0dG9uO1xuICAgICAgICB0aGlzLmluaXRDbG9zZUJ1dHRvbigpO1xuICAgICAgICBpZiAodGltZW91dFNlY29uZHMpIHtcbiAgICAgICAgICAgIHRoaXMudGltZW91dFNlY29uZHMgPSB0aW1lb3V0U2Vjb25kcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXV0b1Nob3cpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0b1Nob3cgPSBhdXRvU2hvdztcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29va2llTmFtZSkge1xuICAgICAgICAgICAgdGhpcy5jb29raWVOYW1lID0gY29va2llTmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29va2llRXhwaXJlc0RheXMpIHtcbiAgICAgICAgICAgIHRoaXMuY29va2llRXhwaXJlc0RheXMgPSBjb29raWVFeHBpcmVzRGF5cztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wb3B1cEJsb2NrICYmIHRoaXMuY2xvc2VCdXR0b24pIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEF1dG9TaG93KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5pdFBvcHVwV3JhcHBlcigpIHtcbiAgICAgICAgY29uc3QgcG9wdXBXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLmlkID0gJ3BvcHVwLXdyYXBwZXInO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUucG9zaXRpb24gPSAnZml4ZWQnO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUucmlnaHQgPSAnMCc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS5ib3R0b20gPSAnMCc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLnpJbmRleCA9ICc5OTk5JztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgICAgIHJldHVybiBwb3B1cFdyYXBwZXI7XG4gICAgfVxuICAgIGluaXRQb3B1cEJsb2NrKCkge1xuICAgICAgICB0aGlzLnBvcHVwQmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9XG4gICAgaW5pdENsb3NlQnV0dG9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuY2xvc2VCdXR0b24pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuY2xvc2VCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLmNsb3NlQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNsb3NlKCk7XG4gICAgfVxuICAgIGluaXRBdXRvU2hvdygpIHtcbiAgICAgICAgaWYgKHRoaXMuYXV0b1Nob3cgJiYgIWRvY3VtZW50LmNvb2tpZS5pbmNsdWRlcyhgJHt0aGlzLmNvb2tpZU5hbWV9PXRydWVgKSkge1xuICAgICAgICAgICAgdGhpcy5hdXRvU2hvd1RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuc2hvdygpLCB0aGlzLnRpbWVvdXRTZWNvbmRzICogMTAwMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwb3B1cExvZ2dlcignaXMgbm90IGF1dG8gc2hvd24nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzaG93KCkge1xuICAgICAgICB0aGlzLnBvcHVwV3JhcHBlckJsb2NrLmFwcGVuZENoaWxkKHRoaXMucG9wdXBCbG9jayk7XG4gICAgICAgIHRoaXMucG9wdXBDb250ZW50QmxvY2suc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgdGhpcy5wb3B1cEJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMucG9wdXBXcmFwcGVyQmxvY2spO1xuICAgICAgICBsb2dJc3N1ZSgncG9wdXBfc2hvd24nLCB7XG4gICAgICAgICAgICBjb29raWVOYW1lOiB0aGlzLmNvb2tpZU5hbWUsXG4gICAgICAgICAgICB0aW1lb3V0U2Vjb25kczogdGhpcy50aW1lb3V0U2Vjb25kcyxcbiAgICAgICAgICAgIGF1dG9TaG93OiB0aGlzLmF1dG9TaG93XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXJCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBkb2N1bWVudC5jb29raWUgPSBgJHt0aGlzLmNvb2tpZU5hbWV9PXRydWU7IGV4cGlyZXM9JHtuZXcgRGF0ZShEYXRlLm5vdygpICsgdGhpcy5jb29raWVFeHBpcmVzRGF5cyAqIDI0ICogNjAgKiA2MCAqIDEwMDApLnRvVVRDU3RyaW5nKCl9OyBwYXRoPS87YDtcbiAgICAgICAgbG9nSXNzdWUoJ3BvcHVwX2Nsb3NlZCcsIHtcbiAgICAgICAgICAgIGNvb2tpZU5hbWU6IHRoaXMuY29va2llTmFtZSxcbiAgICAgICAgICAgIGNvb2tpZUV4cGlyZXNEYXlzOiB0aGlzLmNvb2tpZUV4cGlyZXNEYXlzXG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IFBvcHVwIGZyb20gJy4uL2NvbXBvbmVudHMvUG9wdXAnO1xuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgd2luZG93LlBvcHVwID0gUG9wdXA7XG59XG5leHBvcnQgZGVmYXVsdCBQb3B1cDtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==