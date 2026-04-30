/**
 * ShareMoments - Configuración Global
 * Para optimizar este proyecto en GitHub, centralizamos la URL de la API aquí.
 */
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwgnvXB_yyn4AWPlHMuvFUCeUsLY0o90j7scM1ZhCbdXZj2zUhsovi42FIAVq1dCTLK/exec";

// Exportar para uso en módulos si es necesario (entorno moderno)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GAS_API_URL };
} else {
    window.GAS_API_URL = GAS_API_URL;
}
