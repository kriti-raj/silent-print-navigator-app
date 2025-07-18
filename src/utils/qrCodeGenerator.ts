
// QR Code generator using online API for better reliability
export const generateQRCodeDataURL = (text: string, size: number = 150): string => {
  try {
    // Use QR Server API for reliable QR generation
    const encodedText = encodeURIComponent(text);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&format=png&margin=10`;
    console.log('Generated QR URL:', qrUrl);
    return qrUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};
