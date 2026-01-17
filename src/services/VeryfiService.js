export const VeryfiService = {
    /**
     * Analyze a bill/receipt using Veryfi API
     * @param {File} file - The image file to analyze
     * @param {Object} credentials - { clientId, username, apiKey }
     */
    processDocument: async (file, credentials) => {
        console.log("Veryfi Processing Started...", file.name);

        if (!credentials || !credentials.clientId || !credentials.username || !credentials.apiKey) {
            // If any key is missing, throw specific error to trigger prompt
            throw new Error("MISSING_KEYS");
        }

        // --- REAL API IMPLEMENTATION ---
        const formData = new FormData();
        formData.append('file', file);
        formData.append('file_name', file.name);

        // Veryfi requires specific headers
        // Client-ID: {CLIENT_ID}
        // Authorization: apikey {USERNAME}:{API_KEY}
        const headers = {
            'Client-Id': credentials.clientId,
            'Authorization': `apikey ${credentials.username}:${credentials.apiKey}`,
            'Accept': 'application/json'
        };

        try {
            const response = await fetch('https://api.veryfi.com/api/v8/partner/documents', {
                method: 'POST',
                headers: headers,
                body: formData
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Veryfi API Error: ${response.status} ${errText}`);
            }

            const data = await response.json();

            // Normalize Response
            return {
                vendor: {
                    name: data.vendor ? data.vendor.name : "Unknown Vendor",
                    address: data.vendor ? data.vendor.address : ""
                },
                date: data.date,
                total: data.total,
                currency_code: data.currency_code,
                line_items: data.line_items || [],
                summary: `Verified Purchase from ${data.vendor ? data.vendor.name : 'Unknown Vendor'}`,
                amount: data.total
            };

        } catch (error) {
            console.error("Veryfi API Request Failed:", error);
            throw error;
        }
    }
};
