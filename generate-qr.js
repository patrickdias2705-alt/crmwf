const QRCode = require('qrcode');

async function generateQR() {
  try {
    // Gerar QR Code para WhatsApp Web
    const qrData = 'https://web.whatsapp.com/';
    const qrCode = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      scale: 5,
      width: 500,
      margin: 2
    });
    
    console.log('QR Code gerado:');
    console.log(qrCode);
    
    // Salvar em arquivo para teste
    const fs = require('fs');
    const base64Data = qrCode.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync('test-qr.png', base64Data, 'base64');
    console.log('QR Code salvo em test-qr.png');
    
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
  }
}

generateQR();
