import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/base.css'; // Ensure base styles are loaded

const LanguageToggle = () => {
    const { language, toggleLanguage } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            className="language-toggle"
            aria-label="Switch Language"
            style={{
                padding: '8px 16px',
                borderRadius: '20px',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '0.9rem',
                border: '2px solid white',
                boxShadow: 'var(--shadow-md)'
            }}
        >
            {language === 'en' ? 'தமிழ்' : 'English'}
        </button>
    );
};

export default LanguageToggle;
