import React, { useEffect, useState, useRef } from 'react';
import { UIInputControl } from '@rameses/ui';

interface NumberProps extends UIInputControl {
   min?: number;
   max?: number;
   noFormat?: boolean;
}

const toNumber = (value: number | string | null): number | null => {
   if ((value ?? '') === '') return null;
   if (typeof value === 'number' && !isNaN(value)) {
      return value as number;
   }
   try {
      const str = value!.toString();
      if (/^[-\d]+$/.test(str) && /^-?\d+$/.test(str)) {
         const num = parseInt(str.replace(/,/g, ''), 10);
         if (typeof num === 'number' && !isNaN(num)) {
            return num;
         }
      }
      return null;
   }
   catch (err) {
      return null;
   }
};

const formatNumber = (value: number | string | null, noFormat: boolean = false): string => {
   let num = toNumber(value);
   if (num === null) {
      return '';
   }

   if (typeof num === 'number' && !isNaN(num)) {
      if (noFormat) return String(num);
      return new Intl.NumberFormat('en-US').format(num);
   }
   else {
      return '';
   }
};


const Number: React.FC<NumberProps> = ({
   binding,
   dynamic = false,

   name,
   label,
   required = false,
   align = 'right',
   placeholder,
   min,
   max,
   noFormat = false,
   ...rest
}) => {
   const initialValue = formatNumber(binding.get(name), noFormat);

   const [inputValue, setInputValue] = useState(initialValue.toString());

   const [touched, setTouched] = useState(false);
   const [focused, setFocused] = useState(false);

   const inputRef = useRef<HTMLInputElement | null>(null);

   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Prevent invalid characters even in number input
      const invalidKeys = ['e', 'E', '+', '.'];
      if (invalidKeys.includes(e.key)) {
         e.preventDefault();
         return;
      }
   };

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (inputRef.current) {
         inputRef.current.setCustomValidity('');
      }

      let newValue = (e.target.value ?? '');
      if (newValue === '') {
         setInputValue(newValue);
         binding.set(name, null, dynamic);
      }
      else if (/^[-]?\d*$/.test(newValue)) {
         setInputValue(newValue);

         const pass = /^-?\d+$/.test(newValue);
         binding.set(name, pass ? parseInt(newValue, 10) : null, dynamic);
      }
      else {
         binding.set(name, null, dynamic);
      }
   };

   const handleFocus = () => {
      if ((inputValue ?? '') !== '') {
         let parsed = inputValue.replace(/,/g, '');
         setInputValue(parsed);
      }

      setFocused(true);
   };

   const handleBlur = () => {
      setFocused(false);
      setTouched(true);

      const formatted = formatNumber(binding.get(name), noFormat);
      if ((formatted ?? '') !== '') {
         setInputValue(formatted);
      }
   };

   const minValue = toNumber(min ?? null);
   const maxValue = toNumber(max ?? null);

   useEffect(() => {
      if (focused) return;

      const formatted = formatNumber(binding.get(name), noFormat);
      if (formatted !== inputValue) {
         setInputValue(formatted);
      }

   }, [binding.raw, focused]);

   useEffect(() => {
      const validateHandler = () => {
         const el = inputRef.current;
         const newValue = (el?.value ?? '');
         if (required && newValue === '') {
            binding.showTooltip(el, 'Please fill out this field');
            return `${label} field is required`;
         }
         const num = toNumber(newValue);
         if (num !== null) {
            if (minValue !== null && num < minValue) {
               const msg = `Value must be greater than or equal to ${minValue}`;
               binding.showTooltip(el, msg);
               return `${label}: ${msg}`;
            }
            if (maxValue !== null && num > maxValue) {
               const msg = `Value must be less than or equal to ${maxValue}`;
               binding.showTooltip(el, msg);
               return `${label}: ${msg}`;
            }
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
            type={focused ? 'number' : 'text'}
            value={inputValue}
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

export default Number;
