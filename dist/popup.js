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
class Popup {
    constructor({ popupId, popupContentClass, closeButtonClass, timeoutSeconds = 10, autoShow = true, cookieName = 'popup', cookieExpiresDays = 1, }) {
        this.closeButton = null;
        this.autoShow = false;
        this.autoShowTimeout = null;
        this.timeoutSeconds = 25;
        this.cookieName = "popup";
        this.cookieExpiresDays = 1;
        if (!popupId || !popupContentClass)
            throw new Error('[Popup] popupId or popupContentClass is not provided');
        const findPopupBlock = document.getElementById(popupId);
        if (!findPopupBlock) {
            throw new Error(`Popup block with id ${popupId} not found`);
        }
        const findPopupContentBlock = document.querySelector(`.${popupContentClass}`);
        if (!findPopupContentBlock) {
            throw new Error(`Popup content block with class ${popupContentClass} not found`);
        }
        this.popupBlock = findPopupBlock;
        this.popupContentBlock = findPopupContentBlock;
        this.initPopupBlock();
        this.popupWrapperBlock = this.initPopupWrapper();
        const findCloseButton = document.querySelector(`.${closeButtonClass}`);
        if (!findCloseButton) {
            popupLogger(`close button with class ${closeButtonClass} not found`);
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
    }
    close() {
        this.popupWrapperBlock.style.display = 'none';
        document.cookie = `${this.cookieName}=true; expires=${new Date(Date.now() + this.cookieExpiresDays * 24 * 60 * 60 * 1000).toUTCString()}; path=/;`;
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_components_Popup__WEBPACK_IMPORTED_MODULE_0__["default"]);
window.Popup = _components_Popup__WEBPACK_IMPORTED_MODULE_0__["default"];

})();

__webpack_exports__ = __webpack_exports__["default"];
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXAuanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87Ozs7Ozs7Ozs7Ozs7O0FDVkE7QUFDZTtBQUNmLGtCQUFrQixrSUFBa0k7QUFDcEo7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtREFBbUQsU0FBUztBQUM1RDtBQUNBLGlFQUFpRSxrQkFBa0I7QUFDbkY7QUFDQSw4REFBOEQsbUJBQW1CO0FBQ2pGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyREFBMkQsaUJBQWlCO0FBQzVFO0FBQ0EsbURBQW1ELGtCQUFrQjtBQUNyRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMERBQTBELGdCQUFnQjtBQUMxRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCLGdCQUFnQixPQUFPLFVBQVUsb0ZBQW9GLE9BQU87QUFDeko7QUFDQTs7Ozs7OztVQ3BGQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQ3RCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHlDQUF5Qyx3Q0FBd0M7V0FDakY7V0FDQTtXQUNBLEU7Ozs7O1dDUEEsd0Y7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdELEU7Ozs7Ozs7Ozs7Ozs7OztBQ053QztBQUN4QyxpRUFBZSx5REFBSyxFQUFDO0FBQ3JCLGVBQWUseURBQUsiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbiIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0Ly4vc3JjL2NvbXBvbmVudHMvUG9wdXAudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9mcm9udGVuZC1wcm9qZWN0L3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vZnJvbnRlbmQtcHJvamVjdC93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2Zyb250ZW5kLXByb2plY3QvLi9zcmMvZW50cmllcy9wb3B1cC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJwb3B1cFwiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJwb3B1cFwiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsICgpID0+IHtcbnJldHVybiAiLCJjb25zdCBwb3B1cExvZ2dlciA9IGNvbnNvbGUuZGVidWcuYmluZChjb25zb2xlLCAnW1BvcHVwXScpO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUG9wdXAge1xuICAgIGNvbnN0cnVjdG9yKHsgcG9wdXBJZCwgcG9wdXBDb250ZW50Q2xhc3MsIGNsb3NlQnV0dG9uQ2xhc3MsIHRpbWVvdXRTZWNvbmRzID0gMTAsIGF1dG9TaG93ID0gdHJ1ZSwgY29va2llTmFtZSA9ICdwb3B1cCcsIGNvb2tpZUV4cGlyZXNEYXlzID0gMSwgfSkge1xuICAgICAgICB0aGlzLmNsb3NlQnV0dG9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5hdXRvU2hvdyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmF1dG9TaG93VGltZW91dCA9IG51bGw7XG4gICAgICAgIHRoaXMudGltZW91dFNlY29uZHMgPSAyNTtcbiAgICAgICAgdGhpcy5jb29raWVOYW1lID0gXCJwb3B1cFwiO1xuICAgICAgICB0aGlzLmNvb2tpZUV4cGlyZXNEYXlzID0gMTtcbiAgICAgICAgaWYgKCFwb3B1cElkIHx8ICFwb3B1cENvbnRlbnRDbGFzcylcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW1BvcHVwXSBwb3B1cElkIG9yIHBvcHVwQ29udGVudENsYXNzIGlzIG5vdCBwcm92aWRlZCcpO1xuICAgICAgICBjb25zdCBmaW5kUG9wdXBCbG9jayA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHBvcHVwSWQpO1xuICAgICAgICBpZiAoIWZpbmRQb3B1cEJsb2NrKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBvcHVwIGJsb2NrIHdpdGggaWQgJHtwb3B1cElkfSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaW5kUG9wdXBDb250ZW50QmxvY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuJHtwb3B1cENvbnRlbnRDbGFzc31gKTtcbiAgICAgICAgaWYgKCFmaW5kUG9wdXBDb250ZW50QmxvY2spIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUG9wdXAgY29udGVudCBibG9jayB3aXRoIGNsYXNzICR7cG9wdXBDb250ZW50Q2xhc3N9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucG9wdXBCbG9jayA9IGZpbmRQb3B1cEJsb2NrO1xuICAgICAgICB0aGlzLnBvcHVwQ29udGVudEJsb2NrID0gZmluZFBvcHVwQ29udGVudEJsb2NrO1xuICAgICAgICB0aGlzLmluaXRQb3B1cEJsb2NrKCk7XG4gICAgICAgIHRoaXMucG9wdXBXcmFwcGVyQmxvY2sgPSB0aGlzLmluaXRQb3B1cFdyYXBwZXIoKTtcbiAgICAgICAgY29uc3QgZmluZENsb3NlQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLiR7Y2xvc2VCdXR0b25DbGFzc31gKTtcbiAgICAgICAgaWYgKCFmaW5kQ2xvc2VCdXR0b24pIHtcbiAgICAgICAgICAgIHBvcHVwTG9nZ2VyKGBjbG9zZSBidXR0b24gd2l0aCBjbGFzcyAke2Nsb3NlQnV0dG9uQ2xhc3N9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xvc2VCdXR0b24gPSBmaW5kQ2xvc2VCdXR0b247XG4gICAgICAgIHRoaXMuaW5pdENsb3NlQnV0dG9uKCk7XG4gICAgICAgIGlmICh0aW1lb3V0U2Vjb25kcykge1xuICAgICAgICAgICAgdGhpcy50aW1lb3V0U2Vjb25kcyA9IHRpbWVvdXRTZWNvbmRzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhdXRvU2hvdykge1xuICAgICAgICAgICAgdGhpcy5hdXRvU2hvdyA9IGF1dG9TaG93O1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb29raWVOYW1lKSB7XG4gICAgICAgICAgICB0aGlzLmNvb2tpZU5hbWUgPSBjb29raWVOYW1lO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb29raWVFeHBpcmVzRGF5cykge1xuICAgICAgICAgICAgdGhpcy5jb29raWVFeHBpcmVzRGF5cyA9IGNvb2tpZUV4cGlyZXNEYXlzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnBvcHVwQmxvY2sgJiYgdGhpcy5jbG9zZUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5pbml0QXV0b1Nob3coKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0UG9wdXBXcmFwcGVyKCkge1xuICAgICAgICBjb25zdCBwb3B1cFdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICBwb3B1cFdyYXBwZXIuaWQgPSAncG9wdXAtd3JhcHBlcic7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gICAgICAgIHBvcHVwV3JhcHBlci5zdHlsZS5yaWdodCA9ICcwJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLmJvdHRvbSA9ICcwJztcbiAgICAgICAgcG9wdXBXcmFwcGVyLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUuekluZGV4ID0gJzk5OTknO1xuICAgICAgICBwb3B1cFdyYXBwZXIuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICAgICAgcmV0dXJuIHBvcHVwV3JhcHBlcjtcbiAgICB9XG4gICAgaW5pdFBvcHVwQmxvY2soKSB7XG4gICAgICAgIHRoaXMucG9wdXBCbG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH1cbiAgICBpbml0Q2xvc2VCdXR0b24oKSB7XG4gICAgICAgIGlmICghdGhpcy5jbG9zZUJ1dHRvbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgIHRoaXMuY2xvc2VCdXR0b24ub25jbGljayA9ICgpID0+IHRoaXMuY2xvc2UoKTtcbiAgICB9XG4gICAgaW5pdEF1dG9TaG93KCkge1xuICAgICAgICBpZiAodGhpcy5hdXRvU2hvdyAmJiAhZG9jdW1lbnQuY29va2llLmluY2x1ZGVzKGAke3RoaXMuY29va2llTmFtZX09dHJ1ZWApKSB7XG4gICAgICAgICAgICB0aGlzLmF1dG9TaG93VGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5zaG93KCksIHRoaXMudGltZW91dFNlY29uZHMgKiAxMDAwKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBvcHVwTG9nZ2VyKCdpcyBub3QgYXV0byBzaG93bicpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNob3coKSB7XG4gICAgICAgIHRoaXMucG9wdXBXcmFwcGVyQmxvY2suYXBwZW5kQ2hpbGQodGhpcy5wb3B1cEJsb2NrKTtcbiAgICAgICAgdGhpcy5wb3B1cENvbnRlbnRCbG9jay5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICB0aGlzLnBvcHVwQmxvY2suc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5wb3B1cFdyYXBwZXJCbG9jayk7XG4gICAgfVxuICAgIGNsb3NlKCkge1xuICAgICAgICB0aGlzLnBvcHVwV3JhcHBlckJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGRvY3VtZW50LmNvb2tpZSA9IGAke3RoaXMuY29va2llTmFtZX09dHJ1ZTsgZXhwaXJlcz0ke25ldyBEYXRlKERhdGUubm93KCkgKyB0aGlzLmNvb2tpZUV4cGlyZXNEYXlzICogMjQgKiA2MCAqIDYwICogMTAwMCkudG9VVENTdHJpbmcoKX07IHBhdGg9LztgO1xuICAgIH1cbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IFBvcHVwIGZyb20gJy4uL2NvbXBvbmVudHMvUG9wdXAnO1xuZXhwb3J0IGRlZmF1bHQgUG9wdXA7XG53aW5kb3cuUG9wdXAgPSBQb3B1cDtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==