import React, { useEffect, useRef, useState } from 'react';
import { TextCase, UIInputControl } from '../common/types';
import { applyTextCase } from '../common/utils';

interface TextProps extends UIInputControl {
  noSpace?: boolean;
}

const resolveValue = (value: string | null, textcase: TextCase, noSpace: boolean): string | null => {
  if (value == null || value === '') {
    return null;
  }

  let str = value;
  if (noSpace) {
    str = str.replace(/\s+/g, '');
  }

  if (str == null || str === '') {
    return null;
  }
  return applyTextCase(str, textcase);
}

const Text: React.FC<TextProps> = ({
  binding,
  dynamic = false,

  name,
  label,
  labelClassName,
  noSpace = false,
  required = false,
  textcase = 'upper',
  align = 'left',
  placeholder,
  ...rest
}) => {
  const initialValue = resolveValue(binding.get(name), textcase, false);
  const [inputValue, setInputValue] = useState(initialValue ?? '');

  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (inputRef.current) {
      inputRef.current.setCustomValidity('');
    }

    let input = resolveValue(e.target.value, textcase, noSpace);
    if (input != null && input === '') {
      input = null;
    }
    setInputValue(input ?? '');
    binding.set(name, input, dynamic);
    console.log(binding.getData());
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
    setTouched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (noSpace && e.key === ' ') {
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (focused) return;

    let formatted = resolveValue(binding.get(name), textcase, false);
    formatted = (formatted ?? '');
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
      {/* Only show label if there's a value */}
      {label && (
        <label htmlFor={name} className={`text-sm font-medium text-gray-700 ${labelClassName ?? ''}`.trim()}>
          {label}
          {required && <span className="text-red-600 font-bold ml-1">*</span>}
        </label>
      )}

      <input
        {...rest}
        ref={inputRef}
        id={name}
        name={name}
        type='text'
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
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      />
    </div>
  );
};

export default Text;
