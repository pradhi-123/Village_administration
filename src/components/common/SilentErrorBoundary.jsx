import React from 'react';

class SilentErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.warn("SilentErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Render nothing or a fallback if provided, but default to null to "block" the error page
            return this.props.fallback || null;
        }

        return this.props.children;
    }
}

export default SilentErrorBoundary;
