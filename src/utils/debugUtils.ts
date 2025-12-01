// Utilitários de debug para identificar problemas de tela preta

export const debugInfo = {
  // Informações do navegador
  userAgent: navigator.userAgent,
  platform: navigator.platform,
  language: navigator.language,
  cookieEnabled: navigator.cookieEnabled,
  
  // Informações da tela
  screenWidth: window.screen.width,
  screenHeight: window.screen.height,
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight,
  
  // Informações de performance
  deviceMemory: (navigator as any).deviceMemory || 'N/A',
  hardwareConcurrency: navigator.hardwareConcurrency || 'N/A',
  
  // Informações de conectividade
  onLine: navigator.onLine,
  connectionType: (navigator as any).connection?.effectiveType || 'N/A',
  
  // Informações do localStorage
  localStorageAvailable: (() => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  })(),
  
  // Informações de WebGL (para gráficos)
  webglSupported: (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  })(),
  
  // Informações de WebRTC (para real-time)
  webRTCSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
  
  // Timestamp
  timestamp: new Date().toISOString()
};

export const logDebugInfo = () => {
  console.log('🔍 Debug Info:', debugInfo);
  
  // Verificar problemas comuns
  const issues = [];
  
  if (!debugInfo.localStorageAvailable) {
    issues.push('❌ localStorage não disponível');
  }
  
  if (!debugInfo.webglSupported) {
    issues.push('❌ WebGL não suportado (pode afetar gráficos)');
  }
  
  if (!debugInfo.webRTCSupported) {
    issues.push('❌ WebRTC não suportado (pode afetar real-time)');
  }
  
  if (debugInfo.windowWidth < 768) {
    issues.push('⚠️ Tela pequena detectada (pode afetar layout)');
  }
  
  if (debugInfo.deviceMemory && debugInfo.deviceMemory < 4) {
    issues.push('⚠️ Pouca memória disponível (pode afetar performance)');
  }
  
  if (issues.length > 0) {
    console.warn('⚠️ Possíveis problemas detectados:', issues);
  } else {
    console.log('✅ Nenhum problema detectado');
  }
  
  return { debugInfo, issues };
};

export const checkThinkPadIssues = () => {
  const isThinkPad = debugInfo.userAgent.toLowerCase().includes('thinkpad') || 
                    debugInfo.userAgent.toLowerCase().includes('lenovo');
  
  if (isThinkPad) {
    console.log('💻 ThinkPad detectado - verificando problemas específicos...');
    
    // Verificar se é um navegador antigo
    const isOldBrowser = debugInfo.userAgent.includes('Chrome/') && 
                        parseInt(debugInfo.userAgent.split('Chrome/')[1]?.split('.')[0]) < 90;
    
    if (isOldBrowser) {
      console.warn('⚠️ Navegador antigo detectado - pode causar problemas de compatibilidade');
    }
    
    // Verificar resolução
    if (debugInfo.screenWidth < 1366) {
      console.warn('⚠️ Resolução baixa detectada - pode afetar o layout');
    }
    
    return {
      isThinkPad: true,
      isOldBrowser,
      lowResolution: debugInfo.screenWidth < 1366
    };
  }
  
  return { isThinkPad: false };
};
