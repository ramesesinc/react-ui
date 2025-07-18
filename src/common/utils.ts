import { TextCase } from "./types";

class TextCaseFormatter {
    apply( value: string, mode: TextCase ) {
        switch (mode) {
            case 'upper': return value.toUpperCase();
            case 'lower': return value.toLowerCase();
            case 'capitalize': return value.replace(/\b\w/g, char => char.toUpperCase());
            case 'none':
            default: return value;
        }
    }
}

export const applyTextCase = (value: string, mode: TextCase): string => {
    return new TextCaseFormatter().apply( value, mode ); 
};
