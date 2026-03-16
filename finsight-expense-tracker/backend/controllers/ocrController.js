const Tesseract = require('tesseract.js');
const path = require('path');
const logger = require('../utils/logger');

const scanReceipt = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No receipt file provided' });
        }

        const imagePath = path.resolve(req.file.path);
        logger.info(`Starting AI Scan on receipt: ${imagePath}`);

        // Run Tesseract OCR
        const { data: { text } } = await Tesseract.recognize(
            imagePath,
            'eng'
        );

        if (!text || text.trim().length < 5) {
            logger.warn(`OCR returned empty or very short text. Length: ${text ? text.length : 0}. Text found: "${text}"`);
            return res.status(422).json({
                success: false,
                message: 'Could not read clear text from this receipt. Please ensure the image is well-lit and contains legible text.'
            });
        }

        logger.info(`AI Scan completed successfully. Found ${text.length} characters.`);
        const cleanText = text.replace(/\s+/g, ' ');

        // 1. Extract Amount (Robust Regex)
        // Matches values like 10.99, 1,250.00, or just 50
        const amountPatterns = [
            /(?:total|amount|sum|due|pay|totaal|net)[:\s]*[^\d]*([\d,]+\.\d{2})/i, // Standard with decimals
            /(?:total|amount|sum|due|pay|totaal|net)[:\s]*[^\d]*(\d+)/i,          // Whole numbers
            /([\d,]+\.\d{2})/g                                                   // Any decimal pair
        ];

        let amount = 0;
        for (const pattern of amountPatterns) {
            const matches = [...text.matchAll(pattern)];
            if (matches.length > 0) {
                // Get the last match (often grand total is at bottom)
                const val = matches[matches.length - 1][1].replace(',', '');
                amount = parseFloat(val);
                if (amount > 0) break;
            }
        }

        // 2. Extract Date
        const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})|(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g;
        const dateMatch = text.match(dateRegex);
        let date = new Date().toISOString().split('T')[0];
        if (dateMatch) {
            try {
                const parsedDate = new Date(dateMatch[0].replace(/[\.\-]/g, '/'));
                if (!isNaN(parsedDate)) {
                    date = parsedDate.toISOString().split('T')[0];
                }
            } catch (e) {
                logger.warn('Date parsing failed during scan');
            }
        }

        // 3. Extract Merchant (Clean first lines)
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
        const title = lines[0] || 'Scanned Receipt';

        res.json({
            success: true,
            data: {
                amount: amount || 0,
                date: date,
                title: title.substring(0, 50),
                confidence: 'High'
            }
        });

    } catch (error) {
        logger.error('AI Scan Error:', error);
        res.status(500).json({
            success: false,
            message: 'AI Scan service failed. ' + (error.message.includes('Tesseract') ? 'Processor timeout.' : error.message)
        });
    }
};

module.exports = { scanReceipt };
