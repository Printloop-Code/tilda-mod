export type PopupProps = {
    popupId: string;
    popupContentClass: string;
    closeButtonClass?: string;
    timeoutSeconds?: number;
    autoShow?: boolean;
    cookieName?: string;
    cookieExpiresDays?: number;
}