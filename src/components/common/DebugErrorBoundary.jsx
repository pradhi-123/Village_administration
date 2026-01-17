import React from 'react';

class DebugErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Debug Error Boundary Caught:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', background: '#fee2e2', border: '2px solid red', borderRadius: '8px', color: '#991b1b', margin: '20px' }}>
                    <h2>💥 Component Crashed</h2>
                    <pre style={{ overflow: 'auto', padding: '10px', background: 'rgba(255,255,255,0.5)' }}>
                        {this.state.error?.toString()}
                    </pre>
                    <details style={{ marginTop: '10px' }}>
                        <summary>Stack Trace</summary>
                        <pre style={{ fontSize: '0.8em' }}>
                            {this.state.errorInfo?.componentStack}
                        </pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default DebugErrorBoundary;
