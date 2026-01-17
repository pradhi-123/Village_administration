import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', background: '#fee2e2', color: '#b91c1c', minHeight: '100vh' }}>
                    <h1>⚠️ Something went wrong</h1>
                    <details style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                        style={{
                            padding: '12px 24px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Reload Page
                    </button>
                    <p style={{ marginTop: '16px', fontSize: '0.8rem', opacity: 0.7 }}>
                        Technical Error: {this.state.error?.message}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
