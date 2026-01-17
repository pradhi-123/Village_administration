import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import '../../styles/base.css';

const Card = ({ children, className, title, onClick, gradient = false, style }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={onClick ? { scale: 1.02 } : {}}
            whileTap={onClick ? { scale: 0.98 } : {}}
            onClick={onClick}
            className={clsx(className)}
            style={{
                background: gradient ? 'var(--gradient-card)' : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(12px)',
                borderRadius: '24px',
                boxShadow: gradient ? 'var(--shadow-md)' : '0 8px 32px rgba(0,0,0,0.05)',
                padding: '24px',
                marginBottom: '20px',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                position: 'relative',
                overflow: 'hidden',
                cursor: onClick ? 'pointer' : 'default',
                ...style
            }}
        >
            {title && (
                <h3 style={{
                    marginTop: 0,
                    marginBottom: '16px',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    color: 'var(--color-primary-dark)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    {title}
                </h3>
            )}
            {children}
        </motion.div>
    );
};

export default Card;
