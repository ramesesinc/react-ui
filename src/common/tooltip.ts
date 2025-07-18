
interface TooltipModel {
  show: (input: HTMLInputElement | null, msg: string) => void;
}

export function useTooltip() {
    const model: TooltipModel = {
        show: (input: HTMLInputElement | null, msg: string) => {
            if ((msg ?? '') === '') {
                return; 
            }

            const el = input ?? null; 
            if ( el === null) {
                return; 
            }

            if ( el.disabled || el.readOnly ) {
                el.setCustomValidity(''); 
                return; 
            }

            el.setCustomValidity( msg );
            el.scrollIntoView({ behavior: 'smooth', block: 'center' }); 

            setTimeout(() => {
                el.focus(); 
                el.reportValidity();
            }, 10); 
        }
    }
    return model; 
}
