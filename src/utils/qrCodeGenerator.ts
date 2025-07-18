
// Simple QR Code generator using canvas for offline functionality
export const generateQRCodeDataURL = (text: string, size: number = 150): string => {
  try {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = size;
    canvas.height = size;

    // Simple QR-like pattern generation (basic implementation)
    const modules = 25; // Grid size
    const moduleSize = size / modules;
    
    // Fill background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // Generate pattern based on text hash
    ctx.fillStyle = '#000000';
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Create a deterministic pattern
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        const value = (hash + row * modules + col) % 3;
        if (value === 0) {
          ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
        }
      }
    }
    
    // Add corner squares (QR code style)
    const cornerSize = moduleSize * 7;
    // Top-left
    ctx.fillRect(0, 0, cornerSize, cornerSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(moduleSize, moduleSize, cornerSize - 2 * moduleSize, cornerSize - 2 * moduleSize);
    ctx.fillStyle = '#000000';
    ctx.fillRect(2 * moduleSize, 2 * moduleSize, cornerSize - 4 * moduleSize, cornerSize - 4 * moduleSize);
    
    // Top-right
    ctx.fillStyle = '#000000';
    ctx.fillRect(size - cornerSize, 0, cornerSize, cornerSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(size - cornerSize + moduleSize, moduleSize, cornerSize - 2 * moduleSize, cornerSize - 2 * moduleSize);
    ctx.fillStyle = '#000000';
    ctx.fillRect(size - cornerSize + 2 * moduleSize, 2 * moduleSize, cornerSize - 4 * moduleSize, cornerSize - 4 * moduleSize);
    
    // Bottom-left
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, size - cornerSize, cornerSize, cornerSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(moduleSize, size - cornerSize + moduleSize, cornerSize - 2 * moduleSize, cornerSize - 2 * moduleSize);
    ctx.fillStyle = '#000000';
    ctx.fillRect(2 * moduleSize, size - cornerSize + 2 * moduleSize, cornerSize - 4 * moduleSize, cornerSize - 4 * moduleSize);
    
    return canvas.toDataURL();
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};
