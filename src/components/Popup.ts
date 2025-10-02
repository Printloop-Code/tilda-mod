import { PopupProps } from '../types/popup';

const popupLogger = console.debug.bind(console, '[Popup]');

export default class Popup {
    popupWrapperBlock: HTMLElement;
    popupBlock: HTMLElement;
    popupContentBlock: HTMLElement;
    closeButton: HTMLElement | null = null;

    autoShow: boolean = false;
    autoShowTimeout: NodeJS.Timeout | null = null;

    timeoutSeconds: number = 25;
    cookieName: string = "popup";
    cookieExpiresDays: number = 1;

    constructor({
        popupId,
        popupContentClass,
        closeButtonClass,
        timeoutSeconds = 10,
        autoShow = true,
        cookieName = 'popup',
        cookieExpiresDays = 1,
    }: PopupProps) {
        if (!popupId || !popupContentClass)
            throw new Error('[Popup] popupId or popupContentClass is not provided');

        const findPopupBlock = document.getElementById(popupId);

        if (!findPopupBlock) {
            throw new Error(`Popup block with id ${popupId} not found`);
        }

        const findPopupContentBlock = document.querySelector<HTMLElement>(`.${popupContentClass}`);

        if (!findPopupContentBlock) {
            throw new Error(`Popup content block with class ${popupContentClass} not found`);
        }

        this.popupBlock = findPopupBlock;
        this.popupContentBlock = findPopupContentBlock;
        this.initPopupBlock();
        this.popupWrapperBlock = this.initPopupWrapper();

        const findCloseButton = document.querySelector<HTMLElement>(`.${closeButtonClass}`);

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
        if (!this.closeButton) return;

        this.closeButton.style.cursor = 'pointer';
        this.closeButton.onclick = () => this.close();
    }

    initAutoShow() {
        if (this.autoShow && !document.cookie.includes(`${this.cookieName}=true`)) {
            this.autoShowTimeout = setTimeout(() => this.show(), this.timeoutSeconds * 1000);
        } else {
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

