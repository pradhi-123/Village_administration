import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import '../../styles/base.css';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    type = 'button',
    fullWidth = false,
    disabled = false,
    className,
    style
}) => {
    const variants = {
        primary: {
            background: 'var(--grad-primary)',
            color: 'white',
            boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)',
        },
        secondary: {
            background: 'white',
            color: 'var(--color-primary)',
            border: '2px solid var(--color-primary)',
        },
        danger: {
            background: 'var(--grad-danger)',
            color: 'white',
            boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.4)',
        },
        success: {
            background: 'var(--grad-success)',
            color: 'white',
            boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)',
        }
    };

    return (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={clsx(className)}
            style={{
                padding: '16px 32px',
                borderRadius: '9999px', // Pill shape
                fontSize: '1rem',
                fontWeight: '700',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: fullWidth ? '100%' : 'auto',
                minHeight: '56px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                ...variants[variant],
                ...style
            }}
        >
            {children}
        </motion.button>
    );
};

export default Button;
