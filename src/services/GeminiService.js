import { GoogleGenerativeAI } from "@google/generative-ai";

export const GeminiService = {
    analyzeBill: async (imageFile, apiKey) => {
        if (!apiKey) {
            throw new Error("API Key is required");
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            // Convert file to base64
            const base64Data = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(imageFile);
            });

            const prompt = "Analyze this bill/receipt. returning a JSON object with two fields: 'summary' (a concise 1-sentence description of items purchased) and 'amount' (the total numeric amount found). Do not use markdown formatting. Example: { \"summary\": \"Bought 5 bags of cement\", \"amount\": 2500 }";

            const image = {
                inlineData: {
                    data: base64Data,
                    mimeType: imageFile.type
                }
            };

            const result = await model.generateContent([prompt, image]);
            const response = await result.response;
            const text = response.text();

            // Cleanup code blocks if present
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);

        } catch (error) {
            console.warn("Gemini Real API Failed/Skipped, switching to Local OCR Mode.", error);

            // --- FALLBACK: LOCAL OCR (Tesseract.js) ---
            // This runs entirely in the browser, no API key needed.
            try {
                const Tesseract = await import('tesseract.js');
                const { data: { text } } = await Tesseract.recognize(imageFile, 'eng', {
                    logger: m => console.log(m)
                });

                console.log("OCR Text:", text);

                // Simple Logic to extract "Total" and "Amount"
                // 1. Look for currency symbols or numbers
                // 2. Look for keywords like "Total", "Amount", "Grand Total"

                const lines = text.split('\n').filter(line => line.trim() !== '');
                let summary = lines.slice(0, 3).join(', ').substring(0, 100) + "..."; // First few lines usually have store name/items
                let amount = 0;

                // Regex to find prices
                const priceRegex = /(\d+[.,]\d{2})/g;
                const matches = text.match(priceRegex);
                if (matches) {
                    // Start by assuming the largest number is the total
                    const numbers = matches.map(m => parseFloat(m.replace(/,/g, '')));
                    const maxVal = Math.max(...numbers);
                    if (maxVal > 0) amount = maxVal;
                }

                // Refined summary if possible
                if (lines.length > 0) {
                    summary = `Extracted text: ${lines[0]}...`;
                }

                return {
                    summary: summary || "Scanned Bill Content (OCR)",
                    amount: amount || 0,
                    confidence: 0.8
                };

            } catch (ocrError) {
                console.error("OCR Failed:", ocrError);
                return {
                    summary: "Could not read bill text. Please enter manually.",
                    amount: 0,
                    confidence: 0.0
                };
            }
        }
    }
};

