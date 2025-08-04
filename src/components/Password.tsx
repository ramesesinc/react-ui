import React, { useState, useRef, useEffect } from 'react';
import { EyeIcon, EyeOffIcon } from './icons';
import { UIInputControl } from '@rameses/ui';

interface PasswordProps extends UIInputControl { }

const Password: React.FC<PasswordProps> = ({
  binding,
  dynamic = false,

  name,
  label,
  required = false,

  align = 'left',
  placeholder,
  ...rest
}) => {
  const initialValue = binding.get(name);
  const [inputValue, setInputValue] = useState(initialValue ?? '');

  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (inputRef.current) {
      inputRef.current.setCustomValidity('');
    }

    const newValue = (e.target.value ?? '');
    setInputValue(newValue);
    binding.set(name, newValue === '' ? null : newValue, dynamic);
  };

  const handleBlur = () => {
    setTouched(true);
    setFocused(false);
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const toggleShowPass = () => {
    if (inputValue && inputValue !== '') {
      const input = inputRef.current;
      if (!input) return;

      const cursorPosition = input.selectionStart ?? inputValue.length;

      setShowPass(prev => !prev);

      // Wait for type change, then restore cursor
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      }, 0);
    }
  };

  useEffect(() => {
    if (focused) return;

    const str = binding.get(name) ?? '';
    setInputValue(str);

  }, [binding.raw, focused]);

  useEffect(() => {
    const validateHandler = () => {
      const el = inputRef.current;
      const newValue = (el?.value ?? '');
      if (required && newValue === '') {
        binding.showTooltip(el, 'Please fill out this field');
        return `${label} field is required`;
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

  let shouldShowPass = (focused && inputValue && inputValue !== '');
  if (inReadMode) shouldShowPass = false;

  return (
    <div className="flex flex-col gap-1 mb-4">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-600 font-bold ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          {...rest}
          ref={inputRef}
          id={name}
          name={name}
          type={showPass ? 'text' : 'password'}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          required={required}
          placeholder={shouldShowPass ? '' : placeholder}
          autoComplete="new-password"
          disabled={inReadMode}
          className={`
            ${defaultStyleClass} 
            ${(inputValue ?? '') === '' ? '' : 'font-mono'} 
            ${focusStyleClass} 
            ${alignClass} 
            w-full pr-8 
          `}
        />

        {!inReadMode && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleShowPass}
            className="absolute inset-y-0 right-2 flex items-center text-gray-500 text-xs"
            tabIndex={-1}
          >
            {showPass ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  );
};

export default Password;
