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
            window.OpenReplay.handleError(key, payload);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXAuanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87Ozs7Ozs7Ozs7Ozs7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNlO0FBQ2Ysa0JBQWtCLGtJQUFrSTtBQUNwSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLG1EQUFtRCxTQUFTO0FBQzVEO0FBQ0EsaUVBQWlFLGtCQUFrQjtBQUNuRjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYiw4REFBOEQsbUJBQW1CO0FBQ2pGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyREFBMkQsaUJBQWlCO0FBQzVFO0FBQ0EsbURBQW1ELGtCQUFrQjtBQUNyRTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwREFBMEQsZ0JBQWdCO0FBQzFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSw2QkFBNkIsZ0JBQWdCLE9BQU8sVUFBVSxvRkFBb0YsT0FBTztBQUN6SjtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTs7Ozs7OztVQ3hIQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQ3RCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHlDQUF5Qyx3Q0FBd0M7V0FDakY7V0FDQTtXQUNBLEU7Ozs7O1dDUEEsd0Y7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdELEU7Ozs7Ozs7Ozs7Ozs7OztBQ053QztBQUN4QztBQUNBLG1CQUFtQix5REFBSztBQUN4QjtBQUNBLGlFQUFlLHlEQUFLLEVBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbiIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL2NvbXBvbmVudHMvUG9wdXAudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvZW50cmllcy9wb3B1cC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJwb3B1cFwiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJwb3B1cFwiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsICgpID0+IHtcbnJldHVybiAiLCJjb25zdCBwb3B1cExvZ2dlciA9IGNvbnNvbGUuZGVidWcuYmluZChjb25zb2xlLCAnW1BvcHVwXScpO1xuY29uc3QgbG9nSXNzdWUgPSAoa2V5LCBwYXlsb2FkKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cuT3BlblJlcGxheT8uaGFuZGxlRXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHdpbmRvdy5PcGVuUmVwbGF5LmhhbmRsZUVycm9yKGtleSwgcGF5bG9hZCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbT3BlblJlcGxheV0gRmFpbGVkIHRvIGxvZyBpc3N1ZTonLCBlKTtcbiAgICB9XG59O1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUG9wdXAge1xuICAgIGNvbnN0cnVjdG9yKHsgcG9wdXBJZCwgcG9wdXBDb250ZW50Q2xhc3MsIGNsb3NlQnV0dG9uQ2xhc3MsIHRpbWVvdXRTZWNvbmRzID0gMTAsIGF1dG9TaG93ID0gdHJ1ZSwgY29va2llTmFtZSA9ICdwb3B1cCcsIGNvb2tpZUV4cGlyZXNEYXlzID0gMSwgfSkge1xuICAgICAgICB0aGlzLmNsb3NlQnV0dG9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5hdXRvU2hvdyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmF1dG9TaG93VGltZW91dCA9IG51bGw7XG4gICAgICAgIHRoaXMudGltZW91dFNlY29uZHMgPSAyNTtcbiAgICAgICAgdGhpcy5jb29raWVOYW1lID0gXCJwb3B1cFwiO1xuICAgICAgICB0aGlzLmNvb2tpZUV4cGlyZXNEYXlzID0gMTtcbiAgICAgICAgaWYgKCFwb3B1cElkIHx8ICFwb3B1cENvbnRlbnRDbGFzcykge1xuICAgICAgICAgICAgbG9nSXNzdWUoJ3BvcHVwX2luaXRfZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgZXJyb3I6ICdtaXNzaW5nX3JlcXVpcmVkX3BhcmFtcycsXG4gICAgICAgICAgICAgICAgaGFzUG9wdXBJZDogISFwb3B1cElkLFxuICAgICAgICAgICAgICAgIGhhc1BvcHVwQ29udGVudENsYXNzOiAhIXBvcHVwQ29udGVudENsYXNzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW1BvcHVwXSBwb3B1cElkIG9yIHBvcHVwQ29udGVudENsYXNzIGlzIG5vdCBwcm92aWRlZCcpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbmRQb3B1cEJsb2NrID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocG9wdXBJZCk7XG4gICAgICAgIGlmICghZmluZFBvcHVwQmxvY2spIHtcbiAgICAgICAgICAgIGxvZ0lzc3VlKCdwb3B1cF9pbml0X2Vycm9yJywge1xuICAgICAgICAgICAgICAgIGVycm9yOiAncG9wdXBfYmxvY2tfbm90X2ZvdW5kJyxcbiAgICAgICAgICAgICAgICBwb3B1cElkOiBwb3B1cElkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUG9wdXAgYmxvY2sgd2l0aCBpZCAke3BvcHVwSWR9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbmRQb3B1cENvbnRlbnRCbG9jayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke3BvcHVwQ29udGVudENsYXNzfWApO1xuICAgICAgICBpZiAoIWZpbmRQb3B1cENvbnRlbnRCbG9jaykge1xuICAgICAgICAgICAgbG9nSXNzdWUoJ3BvcHVwX2luaXRfZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgZXJyb3I6ICdwb3B1cF9jb250ZW50X2Jsb2NrX25vdF9mb3VuZCcsXG4gICAgICAgICAgICAgICAgcG9wdXBDb250ZW50Q2xhc3M6IHBvcHVwQ29udGVudENsYXNzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUG9wdXAgY29udGVudCBibG9jayB3aXRoIGNsYXNzICR7cG9wdXBDb250ZW50Q2xhc3N9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucG9wdXBCbG9jayA9IGZpbmRQb3B1cEJsb2NrO1xuICAgICAgICB0aGlzLnBvcHVwQ29udGVudEJsb2NrID0gZmluZFBvcHVwQ29udGVudEJsb2NrO1xuICAgICAgICB0aGlzLmluaXRQb3B1cEJsb2NrKCk7XG4gICAgICAgIHRoaXMucG9wdXBXcmFwcGVyQmxvY2sgPSB0aGlzLmluaXRQb3B1cFdyYXBwZXIoKTtcbiAgICAgICAgY29uc3QgZmluZENsb3NlQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLiR7Y2xvc2VCdXR0b25DbGFzc31gKTtcbiAgICAgICAgaWYgKCFmaW5kQ2xvc2VCdXR0b24pIHtcbiAgICAgICAgICAgIHBvcHVwTG9nZ2VyKGBjbG9zZSBidXR0b24gd2l0aCBjbGFzcyAke2Nsb3NlQnV0dG9uQ2xhc3N9IG5vdCBmb3VuZGApO1xuICAgICAgICAgICAgbG9nSXNzdWUoJ3BvcHVwX2Nsb3NlX2J1dHRvbl9ub3RfZm91bmQnLCB7XG4gICAgICAgICAgICAgICAgY2xvc2VCdXR0b25DbGFzczogY2xvc2VCdXR0b25DbGFzc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbiA9IGZpbmRDbG9zZUJ1dHRvbjtcbiAgICAgICAgdGhpcy5pbml0Q2xvc2VCdXR0b24oKTtcbiAgICAgICAgaWYgKHRpbWVvdXRTZWNvbmRzKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVvdXRTZWNvbmRzID0gdGltZW91dFNlY29uZHM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGF1dG9TaG93KSB7XG4gICAgICAgICAgICB0aGlzLmF1dG9TaG93ID0gYXV0b1Nob3c7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvb2tpZU5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuY29va2llTmFtZSA9IGNvb2tpZU5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvb2tpZUV4cGlyZXNEYXlzKSB7XG4gICAgICAgICAgICB0aGlzLmNvb2tpZUV4cGlyZXNEYXlzID0gY29va2llRXhwaXJlc0RheXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucG9wdXBCbG9jayAmJiB0aGlzLmNsb3NlQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRBdXRvU2hvdygpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGluaXRQb3B1cFdyYXBwZXIoKSB7XG4gICAgICAgIGNvbnN0IHBvcHVwV3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5pZCA9ICdwb3B1cC13cmFwcGVyJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLnJpZ2h0ID0gJzAnO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUuYm90dG9tID0gJzAnO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS56SW5kZXggPSAnOTk5OSc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgICAgICByZXR1cm4gcG9wdXBXcmFwcGVyO1xuICAgIH1cbiAgICBpbml0UG9wdXBCbG9jaygpIHtcbiAgICAgICAgdGhpcy5wb3B1cEJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgfVxuICAgIGluaXRDbG9zZUJ1dHRvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNsb3NlQnV0dG9uKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmNsb3NlQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gdGhpcy5jbG9zZSgpO1xuICAgIH1cbiAgICBpbml0QXV0b1Nob3coKSB7XG4gICAgICAgIGlmICh0aGlzLmF1dG9TaG93ICYmICFkb2N1bWVudC5jb29raWUuaW5jbHVkZXMoYCR7dGhpcy5jb29raWVOYW1lfT10cnVlYCkpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0b1Nob3dUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLnNob3coKSwgdGhpcy50aW1lb3V0U2Vjb25kcyAqIDEwMDApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcG9wdXBMb2dnZXIoJ2lzIG5vdCBhdXRvIHNob3duJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2hvdygpIHtcbiAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXJCbG9jay5hcHBlbmRDaGlsZCh0aGlzLnBvcHVwQmxvY2spO1xuICAgICAgICB0aGlzLnBvcHVwQ29udGVudEJsb2NrLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICAgIHRoaXMucG9wdXBCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLnBvcHVwV3JhcHBlckJsb2NrKTtcbiAgICAgICAgbG9nSXNzdWUoJ3BvcHVwX3Nob3duJywge1xuICAgICAgICAgICAgY29va2llTmFtZTogdGhpcy5jb29raWVOYW1lLFxuICAgICAgICAgICAgdGltZW91dFNlY29uZHM6IHRoaXMudGltZW91dFNlY29uZHMsXG4gICAgICAgICAgICBhdXRvU2hvdzogdGhpcy5hdXRvU2hvd1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY2xvc2UoKSB7XG4gICAgICAgIHRoaXMucG9wdXBXcmFwcGVyQmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgZG9jdW1lbnQuY29va2llID0gYCR7dGhpcy5jb29raWVOYW1lfT10cnVlOyBleHBpcmVzPSR7bmV3IERhdGUoRGF0ZS5ub3coKSArIHRoaXMuY29va2llRXhwaXJlc0RheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwKS50b1VUQ1N0cmluZygpfTsgcGF0aD0vO2A7XG4gICAgICAgIGxvZ0lzc3VlKCdwb3B1cF9jbG9zZWQnLCB7XG4gICAgICAgICAgICBjb29raWVOYW1lOiB0aGlzLmNvb2tpZU5hbWUsXG4gICAgICAgICAgICBjb29raWVFeHBpcmVzRGF5czogdGhpcy5jb29raWVFeHBpcmVzRGF5c1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCBQb3B1cCBmcm9tICcuLi9jb21wb25lbnRzL1BvcHVwJztcbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHdpbmRvdy5Qb3B1cCA9IFBvcHVwO1xufVxuZXhwb3J0IGRlZmF1bHQgUG9wdXA7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=