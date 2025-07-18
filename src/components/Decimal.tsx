import React, { useEffect, useState, useRef } from 'react';
import { BindingModel, UIInputControl } from '@rameses/client';

interface DecimalProps extends UIInputControl {
   name: string;
   min?: number;
   max?: number;
   fractionDigits?: number;
}

const validCharPattern = /^[-\d.]+$/;
const strictNumPattern  = /^-?\d*\.?\d*$/;

const isValidInput = ( str: string ) : boolean => {
   return (validCharPattern.test( str ) && strictNumPattern.test( str ));
}

const toNumber = (value: number | string | null) : number | null => {
   if ((value ?? '') === '') return null; 
   if (typeof value === 'number' && !isNaN( value )) {
      return value as number;
   }
   try {
      const str = value!.toString().replace(/,/g, '');
      if ( isValidInput( str )) {
         const num = parseFloat( str ); 
         if (typeof num === 'number' && !isNaN( num )) {
            return num; 
         } 
      }
      return null;
   } 
   catch(err) { 
      return null; 
   } 
};

const formatNumber = (value: number | string | null, digits: number = 2 ) : string => {
   let num = toNumber( value ); 
   if ( num === null ) {
      return '';
   }

   if (typeof num === 'number' && !isNaN(num)) {
      const options = { minimumFractionDigits: digits, maximumFractionDigits: digits }
      return new Intl.NumberFormat('en-US', options).format( num );
   } else {
      return '';
   }
}; 

type InputState = {
   value: string;
   focused: boolean;
   touched: boolean;
}

const createInputState = ( value: string, focused: boolean, touched: boolean ) : InputState => {
   return { value, focused, touched } as InputState; 
};

const Decimal: React.FC<DecimalProps> = ({
   binding,
   dynamic = false,

   name,
   label,
   required = false,
   align = 'right',
   placeholder,
   min,
   max,
   fractionDigits = 2,
   ...rest
}) => {
   const initialValue = formatNumber( binding.get( name), fractionDigits ).replace(/,/g, ''); 

   const [inputState, setInputState] = useState<InputState>( createInputState( initialValue, false, false)); 

   const inputRef = useRef<HTMLInputElement | null>(null);

   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Prevent invalid characters even in number input
      const invalidKeys = ['e', 'E', '+'];
      if (invalidKeys.includes(e.key)) {
         e.preventDefault();
         return;
      }
   };

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if ( inputRef.current ) {
         inputRef.current.setCustomValidity(''); 
      }

      const newValue = (e.target.value ?? '');
      const newInput = { ...inputState }; 
      if (newValue === '') {
         newInput.value = newValue; 
         setInputState( newInput ); 
         binding.set(name, null, dynamic);
      }
      else {
         newInput.value = newValue; 
         setInputState( newInput ); 
         const formatted = formatNumber( toNumber( newValue ), fractionDigits ); 
         binding.set( name, toNumber( formatted ), dynamic);
      }
   };

   const handleFocus = () => {
      const newInput = { ...inputState, focused: true }; 

      if ((newInput.value ?? '') !== '') {
         const parsed = newInput.value.replace(/,/g, '');
         newInput.value = parsed; 
      }
      
      setInputState( newInput ); 
   };

   const handleBlur = () => {
      const newInput = { ...inputState, focused: false, touched: true }; 

      const formatted = formatNumber( binding.get( name ), fractionDigits );
      if (( formatted ?? '') !== '') {
         newInput.value = formatted; 
      }

      setInputState( newInput ); 
   };

   const minValue = toNumber(min ?? null);
   const maxValue = toNumber(max ?? null);

   useEffect(() => {
      if ( inputState.focused ) return;

      const formatted = formatNumber( binding.get( name ), fractionDigits );
      if ( formatted !== inputState.value ) {
         const newInput = { ...inputState }
         newInput.value = formatted;
         setInputState( newInput ); 
      }

   }, [binding.raw, inputState.focused]);

   useEffect(() => {
      const validateHandler = () => {
         const el = inputRef.current;
         const newValue = (el?.value ?? '');
         if (required && newValue === '') {
            binding.showTooltip(el, 'Please fill out this field');
            return `${label} field is required`;
         }
         const num = toNumber( newValue ); 
         if ( num === null ) return null; 

         if ( minValue !== null && num < minValue ) {
            const msg = `Value must be greater than or equal to ${minValue}`;
            binding.showTooltip(el, msg);
            return `${label}: ${msg}`;
         }
         if ( maxValue !== null && num > maxValue ) {
            const msg = `Value must be less than or equal to ${maxValue}`;
            binding.showTooltip(el, msg);
            return `${label}: ${msg}`;
         }

         return null; 
      };

      binding.addValidationHandler(validateHandler);
      return () => binding.removeValidationHandler(validateHandler);
   }, []);

   const alignClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
   }[align];

   const inReadMode = binding.isReadMode(); 
   const defaultStyleClass = "text-sm px-2 py-2 border rounded-md shadow-sm transition-colors duration-150 ease-in-out";
   const focusStyleClass = `focus:outline-none ${inReadMode ? 'bg-gray-50' : 'focus:bg-yellow-50'} focus:ring-1 focus:ring-blue-400`;

   return (
      <div className="flex flex-col gap-1 mb-4">
         {label && (
            <label htmlFor={name} className="text-sm font-medium text-gray-700">
               {label}
               {required && <span className="text-red-600 font-bold ml-1">*</span>}
            </label>
         )}

         <input
            {...rest}
            ref={inputRef}
            id={name}
            name={name}
            value={inputState.value}
            type={inputState.focused ? 'number' : 'text'}
            step='any'
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            required={required}
            placeholder={inReadMode ? '' : placeholder}
            disabled={inReadMode}
            className={`
               ${defaultStyleClass}
               ${focusStyleClass}
               ${alignClass} 
               no-spinner 
            `}
         />
      </div>
   );
};

export default Decimal;
