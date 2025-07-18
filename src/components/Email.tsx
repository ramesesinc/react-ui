import React, { useEffect, useRef, useState } from 'react';
import { UIInputControl } from '@rameses/client';

interface EmailProps extends UIInputControl {
    name: string;
}

const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const Email: React.FC<EmailProps> = ({
    binding,
    dynamic = false,

    name,
    label,
    required = false,
    disabled = false,
    readonly = true,

    align = 'left',
    textcase = 'none',
    placeholder = 'you@example.com',
    ...rest
}) => {
    const initialValue = binding.get(name) ?? '';
    const [inputValue, setInputValue] = useState(initialValue);

    const [touched, setTouched] = useState(false);
    const [focused, setFocused] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (inputRef.current) {
            inputRef.current.setCustomValidity('');
        }

        let newValue = (e.target.value ?? '');
        setInputValue(newValue);

        let oldValue = (inputValue ?? '');
        if (oldValue === newValue) {
            setError(null);
        }
        else {
            const pass = validateInput(newValue);
            binding.set(name, (pass ? newValue : null), dynamic);
        }
    };

    const validateInput = (value: string): boolean => {
        if (value === '' || isValidEmail(value)) {
            setError(null);
            return true;
        }
        else {
            setError('Must contain a valid email address');
            return false;
        }
    };

    const handleFocus = () => {
        setFocused(true);
    };

    const handleBlur = () => {
        setFocused(false);
        setTouched(true);
        setError(null);
        // validateInput( inputValue );
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // no implementation yet
    };

    useEffect(() => {
        if (focused) return;

        const str = binding.get(name) ?? '';
        setInputValue(str);

    }, [binding.raw, focused]);

    useEffect(() => {
        const validateHandler = () => {
            const el = inputRef.current;
            if ((el ?? null) === null) {
                return null;
            }

            const newValue = (el!.value ?? '');
            if (required && newValue === '') {
                binding.showTooltip(el, 'Please fill out this field');
                return `${label} field is required`;
            }
            else if (newValue && !isValidEmail(newValue)) {
                const msg = 'Must contain a valid email address';
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
    const focusStyleClass = `focus:outline-none ${inReadMode ? 'bg-gray-50' : 'focus:bg-yellow-50'}  focus:ring-1 focus:ring-blue-400`;

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
                    type='text'
                    value={inputValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    required={required}
                    placeholder={inReadMode ? '' : placeholder}
                    title={error ?? undefined}
                    disabled={inReadMode}
                    className={`
                        ${defaultStyleClass} 
                        ${focusStyleClass} 
                        ${alignClass} 
                        ${error ? 'bg-red-100 ring-1 ring-red-300 pr-8' : ''}
                        w-full 
                    `}
                />

                {error && (
                    <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-red-600"
                        >
                            {/* Triangle outline */}
                            <polygon points="12 2 22 20 2 20" fill="none" stroke="currentColor" />

                            {/* Exclamation mark - line */}
                            <line x1="12" y1="8" x2="12" y2="13" stroke="currentColor" strokeWidth="2" />

                            {/* Exclamation mark - dot */}
                            <circle cx="12" cy="17" r="1.2" fill="currentColor" stroke="none" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Email;
