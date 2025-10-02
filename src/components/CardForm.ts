import { CardFormProps, RuleCart } from '../types';

export class CardForm {
    cardBlock: HTMLElement;
    form: HTMLFormElement;

    fields: NodeListOf<Element>;
    rules: RuleCart[];

    actionsStates = new Map();

    constructor({ cardBlockId, rules }: CardFormProps) {

        this.cardBlock = document.querySelector(cardBlockId)! as HTMLElement;

        if (!this.cardBlock) {
            console.error(`Card block with id ${cardBlockId} not found`);
        }

        this.form = this.cardBlock.querySelector('form')! as HTMLFormElement;

        if (!this.form) {
            console.error(`Form block with id ${cardBlockId} not found`);
        } else {
            this.initForm();
        }

        this.rules = rules;
        this.fields = document.querySelectorAll('.t-input-group') as NodeListOf<Element>;

        this.initRules();
    }

    initForm() {
        console.debug('[form] [init]', this.form.elements);

        this.form.addEventListener('input', async (e) => {
            console.debug('[form] [input]', e);
            console.debug((e.target as HTMLInputElement)?.value, "|", (e.target as HTMLInputElement)?.name);

            if ((e.target as HTMLInputElement)?.name == "address") {
                if ((e.target as HTMLInputElement)?.value.length > 3) {
                    const data = await this.searchAddress((e.target as HTMLInputElement)?.value);
                    console.debug('[form] [input] address', data);
                }
            }
        })
    }

    async searchAddress(address: string) {
        const response = await fetch("https://b2b.taxi.tst.yandex.net/api/b2b/platform/location/detect", {
            method: "POST",
            body: JSON.stringify({
                location: address,
            }),
        });

        const data = await response.json();

        return data;
    }

    initRules() {
        this.applyActions();
    }

    async applyActions(oldState = new Map()) {
        await new Promise(resolve => setInterval(() => {
            if ([...document.querySelectorAll(`.t706__product-title`)].length > 0) {
                resolve(void 0);
            }
        }, 200));

        for (const [key, state] of this.actionsStates) {
            if (state.value !== oldState.get(key)?.value) {
                if (state.value) {

                    (window as any).tcart__addProduct({
                        id: 'urgently_' + Date.now(),
                        name: state.action.value,
                        price: state.action.sum,
                        quantity: 1,
                    })

                    const changeProduct = await new Promise<HTMLElement | undefined>(resolve => setTimeout(() => {
                        const changeProduct = ([...document.querySelectorAll(`.t706__product-title`)] as HTMLElement[])
                            .find((e: HTMLElement) => e.innerText === state.action.value)?.parentElement;

                        if (changeProduct) {
                            resolve(changeProduct);
                        }
                    }, 100))

                    if (changeProduct) {
                        const changeProductButton = changeProduct.querySelector(`.t706__product-plusminus`) as HTMLElement;
                        changeProductButton.style.display = 'none';
                    }
                } else {
                    const delProduct = ([...document.querySelectorAll(`.t706__product-title`)] as HTMLElement[])
                        .find((e: HTMLElement) => e.innerText === state.action.value)?.parentElement;

                    if (delProduct) {
                        const delProductButton = delProduct.querySelector(`.t706__product-del`) as HTMLElement;
                        delProductButton.click();
                    }
                }
            }
        }
    }
}

