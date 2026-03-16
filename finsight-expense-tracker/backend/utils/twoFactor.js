const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

/**
 * Generate 2FA secret and QR code for user
 */
const generate2FASecret = async (userEmail) => {
    const secret = speakeasy.generateSecret({
        name: `Finsight:${userEmail}`,
        issuer: 'Finsight',
        length: 20
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
        secret: secret.base32,
        qrcode: qrCodeUrl
    };
};

/**
 * Verify 2FA token
 */
const verify2FAToken = (secret, token) => {
    return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2 // Allow 2 time steps before/after for clock drift
    });
};

const generateQRCode = async (secret, userEmail) => {
    const otpauth_url = `otpauth://totp/Finsight:${userEmail}?secret=${secret}&issuer=Finsight`;
    return await QRCode.toDataURL(otpauth_url);
};

module.exports = {
    generate2FASecret,
    verify2FAToken,
    generateQRCode
};
