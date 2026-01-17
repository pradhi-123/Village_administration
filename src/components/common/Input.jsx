import React, { useState } from 'react';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import '../../styles/base.css';

const Input = ({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    error,
    name,
    id,
    required,
    style,
    readOnly,
    ...props
}) => {
    const inputId = id || name;
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    // Determine Status Color
    const hasValue = value !== '' && value != null;
    const isValid = hasValue && !error;

    // Mobile number specific validation logic for color (simple check)
    const isMobile = name && (name.toLowerCase().includes('mobile') || name.toLowerCase().includes('phone'));
    const isMobileValid = isMobile && hasValue && String(value).length === 10;

    // Default border is now Primary Blue/Indigo instead of Gray, as requested
    let borderColor = '#818cf8'; // Indigo-400 (visible blue but slightly softer than focus)
    let focusColor = '#6366f1'; // Indigo-500

    if (error) {
        borderColor = 'var(--color-danger)';
        focusColor = 'var(--color-danger)';
    } else if (isValid && (isMobile ? isMobileValid : true) && !readOnly) {
        borderColor = '#10b981'; // Success Green
    }

    return (
        <div style={{ marginBottom: '16px', position: 'relative', ...style }}>
            {label && (
                <label
                    htmlFor={inputId}
                    style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: 'var(--color-text-main)',
                        fontSize: '0.9rem'
                    }}
                >
                    {label} {required && <span style={{ color: 'red' }}>*</span>}
                </label>
            )}
            <div style={{ position: 'relative' }}>
                <input
                    id={inputId}
                    name={name}
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={{
                        width: '100%',
                        padding: '12px 16px',
                        paddingRight: (isPassword || isValid || error) ? '40px' : '16px',
                        borderRadius: '12px',
                        border: `2px solid ${isFocused ? (error ? 'var(--color-danger)' : '#6366f1') : borderColor}`,
                        fontSize: '1rem',
                        outline: 'none',
                        backgroundColor: readOnly ? '#f3f4f6' : 'white',
                        transition: 'all 0.2s ease',
                        color: '#1f2937',
                        ...props.style // Allow overriding style via props
                    }}
                    {...props}
                />

                {/* Right Icon Actions */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: '12px',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none' // Default none, override for buttons
                }}>

                    {/* Password Toggle */}
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#6b7280',
                                padding: 0,
                                display: 'flex',
                                pointerEvents: 'auto'
                            }}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    )}

                    {/* Checkmark for Valid Non-Password Fields */}
                    {!isPassword && !error && isValid && (isMobile ? isMobileValid : true) && !readOnly && (
                        <Check size={20} color="#10b981" />
                    )}

                    {/* Error Icon */}
                    {error && (
                        <AlertCircle size={20} color="var(--color-danger)" />
                    )}
                </div>
            </div>

            {error && (
                <div style={{
                    color: 'var(--color-danger)',
                    fontSize: '0.85rem',
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '500'
                }}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default Input;
