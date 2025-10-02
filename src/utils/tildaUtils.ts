export function getLastChild(element: HTMLElement | null): HTMLElement | null {
    if (!element) return null;
    if (!element.firstElementChild) return element;

    return getLastChild(element.firstElementChild as HTMLElement);
}