/**
 * Mock Services for Internship Demonstration
 * These simulate advanced features like AI OCR and Bank Synchronization
 */

const mockOcrService = async (fileBuffer) => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Randomize some "found" data
    const merchants = ['Amazon Business', 'Starbucks', 'Uber', 'Office Depot', 'Shell'];
    const selectedMerchant = merchants[Math.floor(Math.random() * merchants.length)];
    const randomAmount = (Math.random() * 100 + 5).toFixed(2);

    return {
        success: true,
        data: {
            merchant: selectedMerchant,
            totalAmount: randomAmount,
            currency: 'USD',
            date: new Date().toISOString().split('T')[0],
            confidence: 0.98,
            detectedTax: (randomAmount * 0.08).toFixed(2),
        }
    };
};

const mockBankSyncService = async (accountToken) => {
    // Simulate API call to Plaid/Bank
    await new Promise(resolve => setTimeout(resolve, 2000));

    return [
        { id: 'tx_1', amount: 45.00, merchant: 'Grocery Store', date: '2024-03-10' },
        { id: 'tx_2', amount: 12.50, merchant: 'Digital Ocean', date: '2024-03-11' },
        { id: 'tx_3', amount: 120.00, merchant: 'Conference Tech', date: '2024-03-12' },
    ];
};

module.exports = {
    mockOcrService,
    mockBankSyncService
};
