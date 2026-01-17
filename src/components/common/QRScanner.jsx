import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, AlertOctagon } from 'lucide-react';

const QRScanner = ({ onScanSuccess, onClose }) => {
    // Constant ID for the scanner DOM element
    const qrcodeRegionId = "html5qr-code-full-region";
    const scannerRef = useRef(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [isMounted, setIsMounted] = useState(true);

    useEffect(() => {
        setIsMounted(true);
        let scannerInstance = null;
        let timeoutId = null;

        const initializeScanner = async () => {
            try {
                // 1. Clean slate: wait for DOM and ensure no previous instance exists
                await new Promise(resolve => { timeoutId = setTimeout(resolve, 300); });
                if (!isMounted) return;

                const element = document.getElementById(qrcodeRegionId);
                if (!element) {
                    throw new Error("Scanner display area initialization failed.");
                }

                // 2. Attempt to clear any existing instance (critical for strict mode)
                try {
                    // Create a temporary instance to access the static clear method if needed, 
                    // or just rely on the library's internal handling. 
                    // Html5Qrcode handles clearing if we reconstruct with the same ID usually,
                    // but calling stop is safer if we had a ref.
                    if (scannerRef.current) {
                        await scannerRef.current.stop().catch(() => { });
                        await scannerRef.current.clear().catch(() => { });
                        scannerRef.current = null;
                    }
                } catch (e) {
                    console.warn("Cleanup warning:", e);
                }

                // 3. Create new instance
                scannerInstance = new Html5Qrcode(qrcodeRegionId);
                scannerRef.current = scannerInstance;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                // 4. Start Camera
                await scannerInstance.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        // Success Callback
                        if (isMounted) {
                            // Stop scanning immediately on success to prevent multiple triggers
                            scannerInstance.stop().then(() => {
                                scannerInstance.clear();
                                onScanSuccess(decodedText);
                            }).catch(err => {
                                console.warn("Stop failed on success", err);
                                onScanSuccess(decodedText); // Still trigger success
                            });
                        }
                    },
                    (errorMessage) => {
                        // Ignore frame errors, they are noisy
                    }
                );

            } catch (err) {
                console.error("Scanner Initialization Error:", err);
                if (isMounted) {
                    // Format error for user
                    let msg = "Camera access failed.";
                    if (err.name === 'NotAllowedError') msg = "Camera permission denied.";
                    if (err.name === 'NotFoundError') msg = "No camera found.";
                    if (err.name === 'NotReadableError') msg = "Camera is in use by another app.";
                    setErrorMsg(msg);
                }
            }
        };

        initializeScanner();

        // CLEANUP FUNCTION
        return () => {
            setIsMounted(false);
            if (timeoutId) clearTimeout(timeoutId);

            if (scannerInstance) {
                scannerInstance.stop().then(() => {
                    scannerInstance.clear().catch(() => { });
                }).catch(() => {
                    scannerInstance.clear().catch(() => { });
                });
            }
        };
    }, []); // Empty dependency array = run once on mount

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: '350px',
            background: 'black',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
            {/* Close Button */}
            <button
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    zIndex: 20,
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(4px)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                }}
            >
                <X size={24} />
            </button>

            {/* ERROR STATE */}
            {errorMsg ? (
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <AlertOctagon size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '8px' }}>Scanner Error</div>
                    <div style={{ color: '#fca5a5', marginBottom: '24px' }}>{errorMsg}</div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'white',
                            color: 'black',
                            border: 'none',
                            padding: '8px 24px',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Close
                    </button>
                </div>
            ) : (
                /* SCANNER CONTAINER */
                <div
                    id={qrcodeRegionId}
                    style={{ width: '100%', height: '100%' }}
                />
            )}
        </div>
    );
};

export default QRScanner;
