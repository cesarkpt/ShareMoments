# 🎥 3PayaresTV - Luxury Event Experience

![Project Status](https://img.shields.io/badge/Status-Premium_Edition-D4AF37?style=total&logo=github)
![Fast Delivery](https://img.shields.io/badge/Tech-Tailwind_CSS-38B2AC?style=total&logo=tailwind-css)
![Google Apps Script](https://img.shields.io/badge/Server-Google_Apps_Script-4285F4?style=total&logo=google-drive)

**3PayaresTV** es una plataforma de gestión de eventos diseñada por y para fotógrafos que buscan ofrecer una experiencia de lujo, interactiva y en tiempo real. Con un diseño inspirado en la estética **Polaroid Modern**, permite a los invitados compartir momentos que cobran vida instantáneamente en las pantallas del evento.

---

## ✨ Características Principales

### 📸 Experiencia del Invitado (Client Experience)
*   **Diseño Polaroid Hero:** Bienvenida personalizada con una estética editorial y minimalista.
*   **Subida Inteligente:** Formulario optimizado para móviles para cargar fotos con dedicatorias manuscritas.
*   **Selector de Galería:** Interfaz intuitiva para navegar entre las fotos del evento y la galería de invitados.

### 🎛️ Panel Administrativo (Admin Control)
*   **Control de Tiempo (Timer):** Reloj dinámico para gestionar los momentos clave del evento (Ceremonia, Fiesta, etc.).
*   **Gestión de Perfiles:** Cambia instantáneamente entre diferentes eventos o clientes (Bodas, Quinces, Corporativo).
*   **Sync con Google Drive/Excel:** Sincronización robusta para almacenamiento y reportes automáticos.

### 📺 Proyección Cinematográfica (Streaming Pro)
*   **Full Screen Optimized:** Modo de pantalla completa optimizado para televisores y pantallas LED.
*   **Cross-Fade Transitions:** Transiciones suaves de 3 segundos para una visualización fluida.
*   **Dynamic QR:** Código QR integrado para que los invitados escaneen y participen sin salir de la proyección.

---

## 📂 Estructura del Proyecto

```bash
3payares_tv/
├── index.html            # Splash Screen (Pantalla de Bienvenida)
├── Code.gs               # Backend para Google Apps Script
├── admin/
│   ├── login.html        # Acceso administrativo
│   └── panel.html        # Centro de control de mando
├── client/
│   ├── welcome.html      # Registro inicial de invitado
│   ├── selector.html     # Hub de navegación de galería
│   ├── upload.html       # Formulario de subida Polaroid
│   ├── loading.html      # Pantalla de carga animada
│   └── contact.html      # Tarjeta digital del CEO
└── projection/
    ├── full_screen.html  # Proyección Estilo Evento Pro
    └── guests.html       # Proyección Mensajes Invitados
```

---

## 🚀 Instalación y Despliegue

### Opción A: Google Apps Script (Recomendado)
1.  Crea un nuevo proyecto en [script.google.com](https://script.google.com).
2.  Copia el contenido de `Code.gs`.
3.  Crea archivos HTML para cada sección manteniendo la estructura de nombres.
4.  Implementa como **Aplicación Web**.

### Opción B: Local / GitHub Pages
Solo sirve el archivo `index.html` en un entorno web. Nota: La funcionalidad de subida a Drive requiere el backend de `Code.gs`.

---

## 🎨 Diseño y Tipografía
*   **Logos & Branding:** 3PayaresTV y Luxury Moments.
*   **Tipografía Primaria:** `Epilogue Black` (Títulos).
*   **Tipografía Body:** `Inter` (UI/UX).
*   **Tipografía Accent:** `Reenie Beanie` (Estilo manuscrito para mensajes).
*   **Paleta:** Obsidian (#0A0A0A), Gilt (#D4AF37) y Porcelain White (#FDFDFD).

---

## 📧 Contacto
**CEO & Founder:** Cesar Payares Torres  
**WhatsApp:** [+57 320 543 5184](https://wa.me/573205435184)  
**Web:** [3payarestv.cercia.co](https://3payarestv.cercia.co)

© 2024 Editorial Executive Systems. Todos los derechos reservados.
