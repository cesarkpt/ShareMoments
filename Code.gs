/**
 * 3PAYARESTV v7F.1.0_Master_Consolidated
 * Sincronización Total y Motor de Identidad Robusto
 */

const ADMIN_PASS = "Mauro3dp*"; 
const FOLDER_PRINCIPAL_ID = "1p_S1YKaFAA7MLF_hnb8QlZWnWMFNt7tO"; 
const FOLDER_ASSETS_ID = "1p_S1YKaFAA7MLF_hnb8QlZWnWMFNt7tO"; // Unificado con FOLDER_PRINCIPAL
const DEFAULT_WATERMARK_ID = "1dpSRSjiABP2dqVgiWhz0RbWa07HbZdlp";

const USAGE_LIMITS = {
  "1": { maxUsers: 10, maxPhotosPerUser: 10, label: "Nivel 1 (10/10)" },
  "2": { maxUsers: 50, maxPhotosPerUser: 30, label: "Nivel 2 (50/30)" },
  "3": { maxUsers: 50, maxPhotosPerUser: 999999, label: "Nivel 3 (50/∞)" },
  "4": { maxUsers: 150, maxPhotosPerUser: 999999, label: "Nivel 4 (150/∞)" },
  "5": { maxUsers: 250, maxPhotosPerUser: 999999, label: "Nivel 5 (250/∞)" }
};

/**
 * --- MANEJADOR DE ENTRADA (PUENTE + APP) ---
 */
/**
 * --- MANEJADOR DE ENTRADA ROBUSTO ---
 */
function doGet(e) {
  try {
    // 1. VISTA BRIDGE: Soporte para comunicación segura (POST-less & CORS-free)
    if (e && e.parameter && e.parameter.view === 'bridge') {
      var result = null;
      var error = null;
      var method = e.parameter.method;
      var reqId = e.parameter.reqId;
      
      if (method) {
        try {
          var args = JSON.parse(e.parameter.args || "[]");
          var methodMap = {
            'getInitialData': getInitialData, 'uploadFile': uploadFile, 'getImages': getImages,
            'getImagesByType': getImagesByType, 'registrarVisita': registrarVisita,
            'registerLike': registerLike, 'getPolaroidLink': getPolaroidLink,
            'solicitarEliminacion': solicitarEliminacion, 'getPerfilesFull': getPerfilesFull,
            'getPerfilesUI': getPerfilesFull, 'crearNuevoEvento': crearNuevoEvento,
            'guardarPerfilActual': guardarPerfilActual, 'getEventoExtraDetails': getEventoExtraDetails,
            'actualizarTimer': actualizarTimer, 'controlTimer': controlTimer,
            'uploadBrandingAsset': uploadBrandingAsset, 'discoverAndSyncEvents': discoverAndSyncEvents,
            'getBackgroundsForDownload': getBackgroundsForDownload, 'repairAllAssetSharing': repairAllAssetSharing,
            'resetGeneralCache': resetGeneralCache, 'syncEventBranding': syncEventBranding
          };
          
          if (methodMap[method]) {
            result = methodMap[method].apply(null, args);
          } else {
            error = "Metodo no autorizado via bridge: " + method;
          }
        } catch (err) {
          error = err.toString();
        }
      }

      var response = { id: reqId || "init", result: result, error: error };
      var html = '<!DOCTYPE html><html><head><script>' +
                 '(function(){ ' +
                 'var resp = ' + JSON.stringify(response) + '; ' +
                 'window.parent.postMessage(resp, "*"); ' +
                 'if(window.top !== window.self) try { window.top.postMessage(resp, "*"); } catch(e){}' +
                 '})();' +
                 '</script></head><body><p style="color:#eee;font-family:sans-serif;font-size:9px;">3PayaresTV Bridge Active</p></body></html>';
      
      return HtmlService.createHtmlOutput(html)
        .setTitle("3PayaresTV Bridge")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // 2. MODO API (JSONP): Retrocompatibilidad
    if (e && e.parameter && e.parameter.callback) {
      var callback = e.parameter.callback;
      var method = e.parameter.method;
      var args = JSON.parse(e.parameter.args || "[]");
      try {
        var methodMap = {
          'getInitialData': getInitialData, 'uploadFile': uploadFile, 'getImages': getImages,
          'getImagesByType': getImagesByType, 'registrarVisita': registrarVisita,
          'registerLike': registerLike, 'getPolaroidLink': getPolaroidLink,
          'solicitarEliminacion': solicitarEliminacion, 'getPerfilesFull': getPerfilesFull,
          'crearNuevoEvento': crearNuevoEvento, 'guardarPerfilActual': guardarPerfilActual,
          'getEventoExtraDetails': getEventoExtraDetails, 'actualizarTimer': actualizarTimer,
          'controlTimer': controlTimer, 'uploadBrandingAsset': uploadBrandingAsset,
          'discoverAndSyncEvents': discoverAndSyncEvents, 'getBackgroundsForDownload': getBackgroundsForDownload,
          'repairAllAssetSharing': repairAllAssetSharing, 'resetGeneralCache': resetGeneralCache,
          'syncEventBranding': syncEventBranding
        };
        if (methodMap[method]) {
          var res = methodMap[method].apply(null, args);
          return ContentService.createTextOutput(callback + "(" + JSON.stringify(res) + ")").setMimeType(ContentService.MimeType.JAVASCRIPT);
        }
      } catch(err) {
        return ContentService.createTextOutput(callback + "(" + JSON.stringify({error: err.toString()}) + ")").setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
    }

    // 3. PANTALLA DE ESTADO / FALLBACK
    return HtmlService.createHtmlOutput("<h1>ShareMoments API: Activa</h1><p>El motor de comunicacion Bridge esta listo. Usa la interfaz local.</p>")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (globalErr) {
    return HtmlService.createHtmlOutput("<h1>Error Critico</h1><p>" + globalErr.toString() + "</p>");
  }
}

/**
 * 2.1 MODO POST: Soporte para archivos grandes (Hero, Watermark, Fotos)
 */
function doPost(e) {
  try {
    let method, args;
    
    const reqId = e.parameter.reqId;
    
    // 1. Detectar origen de datos (JSON fetch vs Form Submit)
    if (e.postData && e.postData.contents) {
      try {
        const data = JSON.parse(e.postData.contents);
        method = data.method;
        args = data.args;
      } catch (f) {
        method = e.parameter.method;
        args = JSON.parse(e.parameter.args || "[]");
      }
    } else {
      method = e.parameter.method;
      args = JSON.parse(e.parameter.args || "[]");
    }

    const methods = {
      'uploadFile': uploadFile,
      'uploadBrandingAsset': uploadBrandingAsset,
      'guardarPerfilActual': guardarPerfilActual,
      'controlTimer': controlTimer,
      'crearNuevoEvento': crearNuevoEvento,
      'saveProcessedImage': saveProcessedImage,
      'getBackgroundsForDownload': getBackgroundsForDownload,
      'registrarVisita': registrarVisita
    };

    if (methods[method]) {
      const result = methods[method].apply(null, args);
      
      // 2. Respuesta inteligente: JSON para fetch, HTML con script para Bridge
      if (e.parameter.transport === 'iframe' || e.parameter.view === 'bridge') {
        const html = `
          <!DOCTYPE html><html><head><script>
            window.parent.postMessage({ 
              id: ${JSON.stringify(reqId || "0")}, 
              result: ${JSON.stringify(result)},
              success: true
            }, "*");
          </script></head><body>Done: ${method}</body></html>
        `;
        return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      }
      
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: 'Method not found' })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}


/**
 * --- MOTORES DE PERSISTENCIA (JSON + CACHE) ---
 */
let MEMORY_CACHE_CONFIG = null;

function getBaseConfig() {
  if (MEMORY_CACHE_CONFIG) return MEMORY_CACHE_CONFIG;
  const cache = CacheService.getScriptCache();
  const cached = cache.get("perfiles_config_v4");
  if (cached) { try { MEMORY_CACHE_CONFIG = JSON.parse(cached); return MEMORY_CACHE_CONFIG; } catch(e) {} }

  try {
    let folder;
    try {
      folder = DriveApp.getFolderById(FOLDER_ASSETS_ID);
    } catch (err) {
      folder = DriveApp.getFolderById(FOLDER_PRINCIPAL_ID);
    }
    
    const archivos = folder.getFilesByName("config_perfiles_v4.json");
    let perfiles = {};
    
    let validFile = null;
    while(archivos.hasNext()) {
      let temp = archivos.next();
      if(!temp.isTrashed()) { validFile = temp; break; }
    }

    if (!validFile) {
      perfiles = { "General": crearBaseInicial() };
    } else {
      const blob = validFile.getBlob();
      const content = blob.getDataAsString();
      if (!content || content.trim() === "") perfiles = { "General": crearBaseInicial() };
      else perfiles = JSON.parse(content);
    }
    
    // Asegurar que General siempre exista
    if (!perfiles["General"]) perfiles["General"] = crearBaseInicial();
    
    MEMORY_CACHE_CONFIG = perfiles;
    return perfiles;
  } catch(e) { 
    Logger.log("Error en getBaseConfig: " + e.toString());
    return MEMORY_CACHE_CONFIG || { "General": crearBaseInicial() }; 
  }
}

function guardarBaseConfig(datosDict) {
  try {
    MEMORY_CACHE_CONFIG = datosDict;
    const jsonStr = JSON.stringify(datosDict);
    const cache = CacheService.getScriptCache();
    
    if (jsonStr.length < 95000) {
      cache.put("perfiles_config_v4", jsonStr, 21600);
    } else {
      cache.remove("perfiles_config_v4"); // Borrar si excede para forzar lectura fresca de Drive
    }

    let folder;
    try {
      folder = DriveApp.getFolderById(FOLDER_ASSETS_ID);
    } catch (err) {
      folder = DriveApp.getFolderById(FOLDER_PRINCIPAL_ID);
    }
    const archivos = folder.getFilesByName("config_perfiles_v4.json");
    let fileUpdated = false;
    
    while (archivos.hasNext()) {
      let f = archivos.next();
      if (!f.isTrashed()) {
        f.setContent(jsonStr);
        fileUpdated = true;
        break;
      }
    }
    if (!fileUpdated) folder.createFile("config_perfiles_v4.json", jsonStr, MimeType.PLAIN_TEXT);
  } catch(e) { throw new Error("Error al guardar: " + e.message); }
}

function crearBaseInicial(id = "General", folderId = null) {
  const base = { 
    eventName: id === "General" ? "ShareMoments" : id, 
    folderId: folderId || FOLDER_PRINCIPAL_ID,
    accentColor: "#D4AF37", 
    bgColor: "#0A0A0A", 
    watermarkId: DEFAULT_WATERMARK_ID, 
    timerStatus: "stopped",
    isGuestGalleryEnabled: true,
    isProGalleryEnabled: false,
    usageTier: "1",
    isPrintingEnabled: false,
    isDownloadEnabled: true,
    fontPrimary: "Inter",
    fontTitle: "Epilogue"
  };
  
  if (folderId) {
    const folders = DriveApp.getFolderById(folderId).getFolders();
    while (folders.hasNext()) {
      const f = folders.next();
      const n = f.getName();
      if (n === "G_INV_ORIG") base.invFolderId = f.getId();
      else if (n === "G_PROFESIONAL") base.proFolderId = f.getId();
      else if (n === "G_INV_POL") base.invFolderPolId = f.getId();
      else if (n === "G_PRO_POL") base.proFolderPolId = f.getId();
      else if (n === "G_ASSET_BRANDING") base.brandingFolderId = f.getId();
      else if (n === "G_FIRMAS" || n === "G__FIRMAS") base.firmaFolderId = f.getId();
    }
  }
  return base;
}

/**
 * --- RESOLUTOR DE CARPETAS ---
 */
function getOrCreateFolderResolver(eventoId, tipo) {
  const perfiles = getBaseConfig();
  let c = perfiles[eventoId];
  if (!c) {
    discoverAndSyncEvents();
    c = getBaseConfig()[eventoId] || perfiles["General"];
  }

  // Mapeo exhaustivo
  const mapping = {
    'inv': { prop: 'invFolderId', name: 'G_INV_ORIG' },
    'pro': { prop: 'proFolderId', name: 'G_PROFESIONAL' },
    'pol': { prop: 'invFolderPolId', name: 'G_INV_POL' },
    'inv_pol': { prop: 'invFolderPolId', name: 'G_INV_POL' },
    'pro_pol': { prop: 'proFolderPolId', name: 'G_PRO_POL' },
    'branding': { prop: 'brandingFolderId', name: 'G_ASSET_BRANDING' },
    'Selfie': { prop: 'firmaFolderId', name: 'G_FIRMAS' },
    'guestbook': { prop: 'firmaFolderId', name: 'G_FIRMAS' }
  };

  const map = mapping[tipo] || mapping['inv'];
  let propId = map.prop;
  let folderName = map.name;

  let folder;
  try {
    if (c[propId]) {
      folder = DriveApp.getFolderById(c[propId]);
      
      // VALIDACIÓN FLEXIBLE: Si el ID existe y tiene archivos, lo usamos aunque el nombre varíe un poco
      const currentName = folder.getName();
      Logger.log("Folder found: " + currentName + " for " + folderName);
      
      if (folder.isTrashed()) throw "En papelera";
    } else { 
      throw "Sin ID guardado"; 
    }
  } catch(e) {
    // Si el ID falla o el nombre no coincide, buscamos físicamente dentro del evento
    let parent;
    try {
      const parentId = (c.folderId && c.folderId !== FOLDER_PRINCIPAL_ID) ? c.folderId : FOLDER_PRINCIPAL_ID;
      parent = DriveApp.getFolderById(parentId);
    } catch(err) {
      parent = DriveApp.getFolderById(FOLDER_PRINCIPAL_ID);
    }
    
    // Búsqueda por nombre dentro de la carpeta del evento
    let foldersIter = parent.getFoldersByName(folderName);
    folder = null;
    while(foldersIter.hasNext()) {
      let f = foldersIter.next();
      if(!f.isTrashed()) { folder = f; break; }
    }
    
    if (!folder) {
      foldersIter = parent.getFoldersByName(folderName.replace('_', '__'));
      while(foldersIter.hasNext()) {
        let f = foldersIter.next();
        if(!f.isTrashed()) { folder = f; break; }
      }
    }
    if (!folder) folder = parent.createFolder(folderName);
    
    // Guardar ID y permisos
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    c[propId] = folder.getId();
    
    // Si es una carpeta nueva en un evento específico, actualizar configuración inmediatamente
    if (eventoId !== "General") {
      guardarBaseConfig(perfiles);
    }
  }
  return folder;
}

/**
 * --- PUENTES DE COMPATIBILIDAD PARA PROYECCIONES ---
 */
function getSignatures(eventId) {
  // Ahora devolvemos EXCLUSIVAMENTE lo que hay en la carpeta G_FIRMAS
  const photos = getImages('Selfie', eventId);
  return photos.map(p => ({
    author: p.autor,
    message: p.mensaje,
    url: "https://drive.google.com/thumbnail?id=" + p.id + "&sz=w600",
    timestamp: p.timestamp
  })).sort((a,b) => b.timestamp - a.timestamp);
}
function getGuestbook(eventId) { return getSignatures(eventId); }

/**
 * --- CORE API: INICIALIZACIÓN ---
 */
function getInitialData(idOverride, guestName) {
  if (idOverride === ADMIN_PASS) idOverride = arguments[1]; // Soporte para Bridge Admin
  
  const props = PropertiesService.getScriptProperties();
  const perfiles = getBaseConfig();
  
  let activeId = idOverride || props.getProperty("EVENTO_ACTIVO") || "General";
  if (activeId.toLowerCase() === 'event' || activeId === "") activeId = "General";
  
  let c = perfiles[activeId];
  if (!c) {
    c = perfiles["General"] || crearBaseInicial();
  }

  // --- LÓGICA DE CUOTAS POR INVITADO ---
  if (guestName) {
    const usageTier = c.usageTier || "1";
    const limits = USAGE_LIMITS[usageTier] || USAGE_LIMITS["1"];
    const currentQuota = parseInt(props.getProperty(`quota_${activeId}_${guestName}`) || "0");
    c.photosRemaining = Math.max(0, limits.maxPhotosPerUser - currentQuota);
    c.maxPhotosPerUser = limits.maxPhotosPerUser;
  }

  // --- MOTOR DE AUTO-DESCUBRIMIENTO (SELF-HEALING) ---
  const assetTypes = {
    'heroImage':   { prefix: 'HERO_',   urlField: 'heroImageUrl' },
    'bgImageId':   { prefix: 'BGROUND_', urlField: 'bgImageUrl' },
    'watermarkId': { prefix: 'WATERMARK_', urlField: 'watermarkUrl' },
    'tickerId':    { prefix: 'TICKER_', urlField: 'tickerUrl' }
  };

  let configChanged = false;
  let brandingFolder = null;

  for (const idField in assetTypes) {
    if (!c[idField] || !c[assetTypes[idField].urlField]) {
      try {
        if (!brandingFolder) {
          const parent = getEventFolder(activeId);
          if (parent) brandingFolder = getBrandingFolder(parent);
        }
        if (brandingFolder) {
          const files = brandingFolder.getFiles();
          let latest = null;
          let latestTime = 0;
          const prefix = assetTypes[idField].prefix;
          
          while (files.hasNext()) {
            const f = files.next();
            if (f.getName().startsWith(prefix) && !f.isTrashed()) {
              if (f.getLastUpdated().getTime() > latestTime) {
                latestTime = f.getLastUpdated().getTime();
                latest = f;
              }
            }
          }

          if (latest) {
            const fId = latest.getId();
            c[idField] = fId;
            c[assetTypes[idField].urlField] = (idField === 'watermarkId')
              ? "https://lh3.googleusercontent.com/d/" + fId
              : "https://drive.google.com/thumbnail?id=" + fId + "&sz=w2000";
            configChanged = true;
          }
        }
      } catch(e) { 
        Logger.log("Error en auto-curación " + idField + ": " + e.message); 
      }
    }
  }

  // Auto-descubrimiento y VALIDACIÓN para Libro de Firmas
  const evNormal = (activeId || "").toString().toLowerCase().replace(/_/g, " ");
  if (evNormal.includes("grado tata")) {
    if (c.firmaFolderId !== "1U4bT4xLwXsBDe9mKL-H8V1H8x8Sovq29") {
       c.firmaFolderId = "1U4bT4xLwXsBDe9mKL-H8V1H8x8Sovq29";
       configChanged = true;
    }
  }
  
  let forceFirmaSearch = !c.firmaFolderId;
  if (c.firmaFolderId) {
    try {
      const fName = DriveApp.getFolderById(c.firmaFolderId).getName();
      if (fName !== "G_FIRMAS" && fName !== "G__FIRMAS") {
        forceFirmaSearch = true; // El ID actual es erróneo (probablemente de otra galería)
        c.firmaFolderId = null; 
      }
    } catch(e) { forceFirmaSearch = true; }
  }

  if (forceFirmaSearch) {
    try {
      const eventFolder = getEventFolder(activeId);
      if (eventFolder) {
        const folders = eventFolder.getFolders();
        while (folders.hasNext()) {
          const sf = folders.next();
          const sn = sf.getName();
          if (sn === "G_FIRMAS" || sn === "G__FIRMAS") {
            c.firmaFolderId = sf.getId();
            configChanged = true;
            break;
          }
        }
      }
    } catch(e) {}
  }

  if (configChanged) {
    perfiles[activeId] = c;
    MEMORY_CACHE_CONFIG = perfiles;
    guardarBaseConfig(perfiles);
  }

  // Construir URLs de salida finales (con thumbnail por seguridad)
  let hUrl = c.heroImageUrl || "";
  if (!hUrl && c.heroImage) hUrl = "https://drive.google.com/thumbnail?id=" + c.heroImage + "&sz=w2000";

  let wUrl = c.watermarkUrl || "";
  if (!wUrl && c.watermarkId) wUrl = "https://lh3.googleusercontent.com/d/" + c.watermarkId;

  let bgUrl = c.bgImageUrl || "";
  if (!bgUrl && c.bgImageId) bgUrl = "https://drive.google.com/thumbnail?id=" + c.bgImageId + "&sz=w2000";

  return {
    ...c,
    eventId: activeId,
    eventName: c.eventName || (activeId === "General" ? "ShareMoments" : activeId),
    fullEventTitle: c.fullEventTitle || c.eventName || (activeId === "General" ? "ShareMoments" : activeId),
    heroImageUrl: hUrl,
    watermarkUrl: wUrl,
    bgImageUrl: bgUrl,
    accentColor: c.accentColor || "#D4AF37",
    titleColor: c.titleColor || "#FFFFFF",
    bgColor: c.bgColor || "#0A0A0A",
    fontPrimary: c.fontPrimary || "Inter",
    fontTitle: c.fontTitle || "Epilogue",
    timerStatus: c.timerStatus || "stopped",
    guestPhotosCount: countFilesById(c.invFolderId, 5),
    proPhotosCount: countFilesById(c.proFolderId, 5),
    signaturesCount: countFilesById(c.firmaFolderId, 100),
    limits: c.usageTier ? USAGE_LIMITS[c.usageTier] : USAGE_LIMITS["1"]
  };
}

/**
 * --- GESTIÓN DE EVENTOS Y SINCRO ---
 */
function getPerfilesFull(pass) {
  const checkPass = (pass || "").toString().trim();
  const validPass = ADMIN_PASS.toString().trim();
  
  if (checkPass !== validPass) {
    Logger.log("Intento de acceso denegado. Recibido: [" + checkPass + "]");
    throw "Denegado";
  }
  
  const perfiles = getBaseConfig();
  
  // Si está vacío (solo General), intentar descubrir físicamente
  if (Object.keys(perfiles).length <= 1) {
    return discoverAndSyncEvents(pass);
  }
  
  return { 
    activo: PropertiesService.getScriptProperties().getProperty("EVENTO_ACTIVO") || "General", 
    perfiles: perfiles 
  };
}

function discoverAndSyncEvents(pass) {
  const checkPass = (pass || "").toString().trim();
  const validPass = ADMIN_PASS.toString().trim();
  if (checkPass !== validPass) throw "Denegado";
  
  const parent = DriveApp.getFolderById(FOLDER_PRINCIPAL_ID);
  const folders = parent.getFolders();
  const found = [];
  
  while (folders.hasNext()) {
    const f = folders.next();
    const name = f.getName();
    if (name.startsWith("EVENTO_")) {
      const id = name.replace("EVENTO_", "");
      found.push({ id: id, folderId: f.getId(), name: id });
    }
  }
  
  const perfiles = getBaseConfig();
  found.forEach(ev => {
    if (!perfiles[ev.id]) {
      perfiles[ev.id] = crearBaseInicial(ev.id, ev.folderId);
    } else {
      // SIEMPRE actualizar el folderId y re-escanear subcarpetas aunque el perfil ya exista
      perfiles[ev.id].folderId = ev.folderId;
      try {
        const subFolders = DriveApp.getFolderById(ev.folderId).getFolders();
        while (subFolders.hasNext()) {
          const sf = subFolders.next();
          const sn = sf.getName();
          if (sn === "G_INV_ORIG")      perfiles[ev.id].invFolderId      = sf.getId();
          else if (sn === "G_PROFESIONAL") perfiles[ev.id].proFolderId   = sf.getId();
          else if (sn === "G_INV_POL")  perfiles[ev.id].invFolderPolId   = sf.getId();
          else if (sn === "G_PRO_POL")  perfiles[ev.id].proFolderPolId   = sf.getId();
          else if (sn === "G_ASSET_BRANDING") perfiles[ev.id].brandingFolderId = sf.getId();
          else if (sn === "G_FIRMAS" || sn === "G__FIRMAS") perfiles[ev.id].firmaFolderId = sf.getId();
        }
      } catch(e) { Logger.log("Error escaneando subcarpetas de " + ev.id + ": " + e.message); }
    }
    // Sincronización secundaria
    try { actualizarIndiceMaestro(ev.id, perfiles[ev.id]); } catch(e) {}
    try { sincronizarConExcel(ev.id, perfiles[ev.id]); } catch(e) {}
  });
  
  guardarBaseConfig(perfiles);
  
  return { 
    activo: PropertiesService.getScriptProperties().getProperty("EVENTO_ACTIVO") || "General", 
    perfiles: perfiles 
  };
}

function getEventoExtraDetails(pass, id) {
  if (pass !== ADMIN_PASS) throw "Denegado";
  
  const perfiles = getBaseConfig();
  let c = perfiles[id] || crearBaseInicial(id);
  
  // Contadores reales (limitados para evitar timeout)
  c.guestPhotosCount = countFilesById(c.invFolderId, 50);
  c.proPhotosCount = countFilesById(c.proFolderId, 50);
  
  return c;
}

function crearNuevoEvento(pass, nombreId) {
  if (pass !== ADMIN_PASS) throw "Denegado";
  const cleanId = nombreId.trim().replace(/[^a-zA-Z0-9 _-]/g, '');
  const perfiles = getBaseConfig();
  
  const folder = DriveApp.getFolderById(FOLDER_PRINCIPAL_ID).createFolder("EVENTO_" + cleanId);
  const nuevo = crearBaseInicial(cleanId, folder.getId());
  nuevo.eventName = nombreId;
  
  perfiles[cleanId] = nuevo;
  guardarBaseConfig(perfiles);
  
  try { actualizarIndiceMaestro(cleanId, nuevo); } catch(e) {}
  try { sincronizarConExcel(cleanId, nuevo); } catch(e) {}
  
  return { success: true, id: cleanId };
}

function guardarPerfilActual(pass, id, data, makeActive) {
  if (pass !== ADMIN_PASS) throw "Denegado";
  const perfiles = getBaseConfig();
  if (!perfiles[id]) perfiles[id] = crearBaseInicial(id);
  
  perfiles[id] = { ...perfiles[id], ...data };
  
  if (makeActive) {
    PropertiesService.getScriptProperties().setProperty("EVENTO_ACTIVO", id);
  }

  guardarBaseConfig(perfiles);
  
  try { sincronizarConExcel(id, perfiles[id]); } catch(e) { }
  try { actualizarIndiceMaestro(id, perfiles[id]); } catch(e) { }
  
  return { success: true, profile: perfiles[id] };
}

/**
 * --- MOTOR DE TIMER (UNIFICADO) ---
 */
function actualizarTimer(pass, id, action, payload) {
  if (pass !== ADMIN_PASS) throw "Denegado";
  return controlTimer(pass, id, action, (payload ? (parseInt(payload.h)*60 + parseInt(payload.m)) : 0), (payload ? payload.start : null));
}

function controlTimer(pass, id, action, minutes = 0, targetDate = null) {
  if (pass !== ADMIN_PASS) throw "Denegado";
  const perfiles = getBaseConfig();
  const c = perfiles[id];
  if (!c) throw "Evento no encontrado";
  
  const now = Date.now();
  
  if (action === 'start') {
    if (c.timerStatus === 'paused' && c.duracionRestanteMs) {
      c.fechaCierre = new Date(now + c.duracionRestanteMs).toISOString();
    } else {
      const ms = (minutes || 0) * 60000;
      if (ms <= 0) throw "Define una duración mayor a 0";
      c.fechaCierre = new Date(now + ms).toISOString();
      c.duracionRestanteMs = ms;
    }
    c.timerStatus = 'running';
  } 
  else if (action === 'pause') {
    if (c.timerStatus === 'running' && c.fechaCierre) {
      const remaining = new Date(c.fechaCierre).getTime() - now;
      c.duracionRestanteMs = Math.max(0, remaining);
      c.timerStatus = 'paused';
      c.fechaCierre = "";
    }
  }
  else if (action === 'stop' || action === 'stopped') {
    c.fechaCierre = "";
    c.duracionRestanteMs = 0;
    c.timerStatus = 'stopped';
  }
  else if (action === 'schedule' || action === 'scheduled') {
    if(!targetDate) throw "Fecha de inicio requerida";
    c.fechaInicio = new Date(targetDate).toISOString();
    c.duracionRestanteMs = minutes * 60000;
    c.timerStatus = 'scheduled';
  }
  
  // Unificar nombres de propiedades para evitar conflictos entre pantallas
  c.timerEndTime = c.fechaCierre;
  
  perfiles[id] = c;
  guardarBaseConfig(perfiles);
  
  try { sincronizarConExcel(id, c); } catch(e) { }
  try { actualizarIndiceMaestro(id, c); } catch(e) { }
  
  return { success: true, profile: c };
}

/**
 * --- GESTIÓN DE MEDIOS ---
 */
function uploadFile(base64Data, fileName, autor, mensaje, targetFolderId = null, categoria = "Todas", standardId = null, eventId = null) {
  const props = PropertiesService.getScriptProperties();
  const finalId = eventId || standardId;
  const activeEventId = (finalId && finalId !== "" && finalId.toLowerCase() !== "event") 
    ? finalId 
    : (props.getProperty("EVENTO_ACTIVO") || "General");

  // Determinar Tipo de Carpeta (Prioridad Categoría Selfie)
  let tipo = "inv";
  if (categoria === "Selfie") {
    tipo = "Selfie";
  } else if (targetFolderId) {
    const initial = getInitialData(activeEventId);
    if (targetFolderId === initial.proFolderId) tipo = "pro";
    else if (targetFolderId === initial.invFolderPolId) tipo = "pol";
  }

  const folderDestino = getOrCreateFolderResolver(activeEventId, tipo);
  
  const bytes = Utilities.base64Decode(base64Data.split(',')[1] || base64Data);
  const finalFileName = fileName || `${activeEventId}_${Date.now()}.jpg`;
  const file = folderDestino.createFile(Utilities.newBlob(bytes, "image/jpeg", finalFileName));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  const meta = { autor: autor, mensaje: mensaje, categoria: categoria, timestamp: Date.now(), standardId: standardId };
  props.setProperty("meta_" + file.getId(), JSON.stringify(meta));

  // Incrementar Cuota del Invitado
  if (autor) {
    const quotaKey = `quota_${activeEventId}_${autor}`;
    const current = parseInt(props.getProperty(quotaKey) || "0");
    props.setProperty(quotaKey, (current + 1).toString());
  }
  
  return { success: true, id: file.getId() };
}

function getImages(tipoGaleria, forcedEventId = null) {
  try {
    if (tipoGaleria === ADMIN_PASS) {
       tipoGaleria = arguments[1];
       forcedEventId = arguments[2];
    }
    
    const props = PropertiesService.getScriptProperties();
    const eventoId = (forcedEventId && forcedEventId !== "" && forcedEventId.toLowerCase() !== "event")
      ? forcedEventId
      : (props.getProperty("EVENTO_ACTIVO") || "General");
    
    // Soporte Multi-Carpeta
    let subTipo = 'inv';
    if (tipoGaleria === 'pro') subTipo = 'pro';
    if (tipoGaleria === 'Selfie' || tipoGaleria === 'guestbook' || tipoGaleria === 'signatures') subTipo = 'Selfie';
    
    const perfiles = getBaseConfig();
    const c = perfiles[eventoId] || perfiles["General"];
    
    let folderId = "";
    if (subTipo === 'pro') folderId = c.proFolderId;
    else if (subTipo === 'Selfie') folderId = c.firmaFolderId;
    else folderId = c.invFolderId;

    if (!folderId) return [];
    
    const folder = DriveApp.getFolderById(folderId);
    if(!folder || folder.isTrashed()) return [];
    const files = folder.getFiles();
    const images = [];
    while (files.hasNext()) {
      const f = files.next();
      const id = f.getId();
      
      // FALLBACK DE SEGURIDAD: Si no tiene metadata, crear una básica basada en el archivo
      const metaStr = props.getProperty("meta_" + id);
      const meta = metaStr ? JSON.parse(metaStr) : {"autor":"Invitado","mensaje":"","timestamp":f.getDateCreated().getTime()};
      
      images.push({ 
        id: id, 
        url: "https://drive.google.com/thumbnail?id=" + id + "&sz=w1000",
        likes: parseInt(props.getProperty("likes_" + id) || "0"),
        autor: meta.autor || meta.author || "Invitado",
        mensaje: meta.mensaje || "",
        timestamp: meta.timestamp || f.getDateCreated().getTime()
      });
    }

    return images.sort((a,b) => b.timestamp - a.timestamp);
  } catch(e) {
    Logger.log("Error en getImages: " + e.toString());
    return [];
  }
}

function getImagesByType(type, eventId) {
  return getImages(type, eventId);
}

function uploadBrandingAsset(pass, base64, fileName, id, type) {
  if (pass !== ADMIN_PASS) throw "Denegado";
  const folder = getOrCreateFolderResolver(id, 'branding');
  
  const patterns = { 
    'hero': 'HERO_', 
    'watermark': 'WATERMARK_', 
    'background': 'BGROUND_',
    'ticker': 'TICKER_',
    'qr': 'QRCODE_'
  };
  const pattern = patterns[type] || 'ASSET_';

  // Limpieza Proactiva: borrar archivos anteriores del mismo tipo en esta carpeta
  try {
    const oldFiles = folder.getFiles();
    while(oldFiles.hasNext()) {
      const f = oldFiles.next();
      if(f.getName().startsWith(pattern)) {
        try { f.setTrashed(true); } catch(e2) { Logger.log("No se pudo eliminar: " + f.getName()); }
      }
    }
  } catch(cleanErr) { Logger.log("Error en limpieza: " + cleanErr.message); }

  // Crear nuevo archivo
  const ext = (fileName.split('.').pop() || "jpg").toLowerCase();
  const cleanFileName = `${pattern}${id}_${Math.floor(Date.now() / 1000)}.${ext}`;
  const bytes = Utilities.base64Decode(base64.split(',')[1] || base64);
  const blob = Utilities.newBlob(bytes, "image/jpeg", cleanFileName);
  const file = folder.createFile(blob);

  // setSharing puede fallar con excepción en dominios de Google Workspace con políticas restrictivas.
  // Es CRÍTICO envolverlo en try/catch para que la función siempre llegue a guardar la URL en config.
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    Logger.log('setSharing OK: ' + file.getId());
  } catch(shareErr) {
    Logger.log('setSharing FALLÓ — continuando: ' + shareErr.message);
  }
  
  const fileId = file.getId();


  // --- URL CON PROPAGACIÓN INSTANTÁNEA ---
  // drive.google.com/thumbnail propaga permisos en segundos vs lh3 que puede tardar horas.
  // Para watermarks (logos con transparencia) se usa lh3 que sirve el archivo original.
  // Para fondos y hero (fotos JPEG) thumbnail sz=w2000 da calidad suficiente para pantalla completa.
  const thumbUrl = (type === 'watermark')
    ? "https://lh3.googleusercontent.com/d/" + fileId
    : "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w2000";

  // Invalidar cache en memoria ANTES de leer/guardar para que el siguiente request lea fresco
  MEMORY_CACHE_CONFIG = null;
  CacheService.getScriptCache().remove("perfiles_config_v4");

  const perfiles = getBaseConfig();
  if(!perfiles[id]) perfiles[id] = crearBaseInicial(id);
  const c = perfiles[id];
  
  if (type === 'hero') { 
    c.heroImageUrl = thumbUrl; 
    c.heroImage = fileId; 
  } else if (type === 'watermark') { 
    c.watermarkUrl = thumbUrl; 
    c.watermarkId = fileId; 
  } else if (type === 'background') { 
    c.bgImageUrl = thumbUrl; 
    c.bgImageId = fileId; 
  } else if (type === 'ticker') {
    c.tickerUrl = thumbUrl;
    c.tickerId = fileId;
  } else if (type === 'qr') {
    c.qrUrl = thumbUrl;
    c.qrId = fileId;
  }
  
  guardarBaseConfig(perfiles);
  Logger.log('Asset guardado: type=' + type + ' id=' + fileId + ' url=' + thumbUrl);
  return { success: true, url: thumbUrl, type: type };
}

function getPolaroidLink(photoId) {
  const props = PropertiesService.getScriptProperties();
  const burnedId = props.getProperty("burned_" + photoId);
  return burnedId ? "https://lh3.googleusercontent.com/d/" + burnedId : null;
}

function saveProcessedImage(base64, fileName, eventId, photoId, type) {
  // Esta función guarda la versión "quemada" (Polaroid) en la carpeta POL dedicada
  const folderType = (type === 'pro') ? 'pro_pol' : 'inv_pol';
  const folder = getOrCreateFolderResolver(eventId, folderType);
  const bytes = Utilities.base64Decode(base64.split(',')[1] || base64);
  const blob = Utilities.newBlob(bytes, "image/jpeg", fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  const props = PropertiesService.getScriptProperties();
  props.setProperty("burned_" + photoId, file.getId());
  
  return { success: true, url: "https://lh3.googleusercontent.com/d/" + file.getId(), fileId: file.getId() };
}


/**
 * --- SINCRO CON EXCEL (ESPEJO) ---
 */
function getMasterSheet() {
  const ssName = "Libro de Eventos Maestros_v7";
  const parent = DriveApp.getFolderById(FOLDER_PRINCIPAL_ID);
  const files = parent.getFilesByName(ssName);
  let ss;
  if (files.hasNext()) ss = SpreadsheetApp.openById(files.next().getId());
  else {
    ss = SpreadsheetApp.create(ssName);
    const sheet = ss.getSheets()[0];
    sheet.setName("Index");
    sheet.appendRow(["ID Evento", "Nombre Público", "Estado Timer", "Color Acento", "Total Fotos", "Last Sync"]);
    sheet.getRange("A1:F1").setFontWeight("bold").setBackground("#D4AF37").setFontColor("white");
    DriveApp.getFileById(ss.getId()).moveTo(parent);
  }
  return ss;
}

function actualizarIndiceMaestro(id, data) {
  try {
    const ss = getMasterSheet();
    const sheet = ss.getSheetByName("Index");
    const values = sheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] == id) { rowIndex = i + 1; break; }
    }
    const rowData = [id, data.eventName || id, data.timerStatus || "stopped", data.accentColor || "#D4AF37", data.guestPhotosCount || 0, new Date().toLocaleString()];
    if (rowIndex > 0) sheet.getRange(rowIndex, 1, 1, 6).setValues([rowData]);
    else sheet.appendRow(rowData);
  } catch(e) { Logger.log("Error en Indice Maestro: " + e.message); }
}

function sincronizarConExcel(eventoId, data) {
  try {
    let ssId = data.spreadsheetId;
    const parent = data.folderId ? DriveApp.getFolderById(data.folderId) : DriveApp.getFolderById(FOLDER_PRINCIPAL_ID);
    
    if (!ssId) {
      const fileName = "ShareMoments_" + (data.eventName || eventoId);
      const files = parent.getFilesByName(fileName);
      if (files.hasNext()) ssId = files.next().getId();
      else {
        const ss = SpreadsheetApp.create(fileName);
        ssId = ss.getId();
        DriveApp.getFileById(ssId).moveTo(parent);
      }
      data.spreadsheetId = ssId;
    }
    
    const ss = SpreadsheetApp.openById(ssId);
    let configSheet = ss.getSheetByName("Config") || ss.insertSheet("Config");
    configSheet.getRange("A1:B1").setValues([["Propiedad", "Valor"]]).setFontWeight("bold");
    
    const rows = [
      ["EventID", eventoId],
      ["EventName", data.eventName || ""],
      ["TimerStatus", data.timerStatus || "stopped"],
      ["RemainingMs", data.duracionRestanteMs || 0],
      ["EndAt", data.fechaCierre || ""],
      ["LastUpdate", new Date().toLocaleString()]
    ];
    configSheet.getRange(2, 1, rows.length, 2).setValues(rows);
  } catch(e) { Logger.log("Error sync excel indv: " + e.message); }
}

/**
 * --- UTILIDADES ---
 */
function countFilesById(fid, limit) {
  if(!fid) return 0;
  try {
    let count = 0;
    const f = DriveApp.getFolderById(fid).getFiles();
    while(f.hasNext() && count < (limit || 200)) { f.next(); count++; }
    return count;
  } catch(e) { return 0; }
}

function resetGeneralCache(pass) {
  if (pass !== ADMIN_PASS) throw "Denegado";
  MEMORY_CACHE_CONFIG = null;
  CacheService.getScriptCache().remove("perfiles_config_v4");
  return { success: true };
}

function getBackgroundsForDownload() {
  try {
    const folder = DriveApp.getFolderById("1DdltzLaj_R59nh-YbBLxAHIxY28co92b");
    const files = folder.getFiles();
    const result = [];
    while (files.hasNext()) {
      const f = files.next();
      result.push({
        id: f.getId(),
        name: f.getName(),
        url: "https://lh3.googleusercontent.com/d/" + f.getId()
      });
    }
    // Si la carpeta está vacía devolvemos uno por defecto de seguridad
    if (result.length === 0) {
      result.push({ id: "1kodBC5_JaDYSfEJlOBih_Xy8uabIBb3j", name: "Default White", url: "https://lh3.googleusercontent.com/d/1kodBC5_JaDYSfEJlOBih_Xy8uabIBb3j" });
    }
    return result;
  } catch(e) {
    return [{ id: "1kodBC5_JaDYSfEJlOBih_Xy8uabIBb3j", name: "Default (Error o Bloqueado)", url: "https://lh3.googleusercontent.com/d/1kodBC5_JaDYSfEJlOBih_Xy8uabIBb3j" }];
  }
}


function registrarVisita(name, message, eventId) {
  const props = PropertiesService.getScriptProperties();
  const key = "visita_" + eventId + "_" + Utilities.base64Encode(name);
  props.setProperty(key, JSON.stringify({ name: name, message: message, timestamp: Date.now() }));
  return { success: true };
}

function registerLike(photoId) {
  const props = PropertiesService.getScriptProperties();
  const current = parseInt(props.getProperty("likes_" + photoId) || "0");
  props.setProperty("likes_" + photoId, (current + 1).toString());
  return current + 1;
}

function solicitarEliminacion(photoId, eventId) {
  PropertiesService.getScriptProperties().setProperty("delete_req_" + photoId, "true");
  return { success: true };
}

function getScriptUrl() { return ScriptApp.getService().getUrl(); }
function include(f) { return HtmlService.createHtmlOutputFromFile(f).getContent(); }

/**
 * --- REPARACIÓN DE PERMISOS DE ASSETS ---
 * 1. Re-aplica ANYONE_WITH_LINK a archivos que existan y no estén en papelera.
 * 2. Purga referencias zombie (archivos eliminados o en papelera) del config.
 *    Después de purgar, getInitialData retornará URLs vacías → el PWA muestra fondo sólido.
 */
function repairAllAssetSharing(pass) {
  if (pass !== ADMIN_PASS) throw "Denegado";
  const perfiles = getBaseConfig();
  let fixed = 0;
  let purged = 0;
  let configDirty = false;

  // Mapa: campo ID → campo URL correspondiente en el config
  const idToUrlField = {
    'heroImage':   'heroImageUrl',
    'bgImageId':   'bgImageUrl',
    'watermarkId': 'watermarkUrl',
    'tickerId':    'tickerUrl',
    'qrId':        'qrUrl'
  };

  for (const eventoId in perfiles) {
    const c = perfiles[eventoId];
    for (const idField in idToUrlField) {
      const urlField = idToUrlField[idField];
      const fileId = c[idField];
      if (!fileId || String(fileId).length < 10) continue;

      try {
        const file = DriveApp.getFileById(fileId);
        if (file.isTrashed()) {
          // En papelera → purgar referencia
          c[idField] = '';
          c[urlField] = '';
          purged++;
          configDirty = true;
          Logger.log('PURGED (papelera): ' + idField + '=' + fileId + ' en evento ' + eventoId);
        } else {
          // Existe y activo → reparar permisos
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          // Migrar URL a formato thumbnail (propagación instantánea) si está en formato lh3
          const currentUrl = c[urlField] || '';
          if (idField !== 'watermarkId' && !currentUrl.includes('drive.google.com/thumbnail')) {
            c[urlField] = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w2000';
            configDirty = true;
            Logger.log('MIGRATED URL: ' + idField + ' → thumbnail format en evento ' + eventoId);
          }
          fixed++;
          Logger.log('FIXED sharing: ' + idField + '=' + fileId + ' en evento ' + eventoId);
        }
      } catch(e) {
        // Archivo no existe en absoluto → purgar referencia zombie
        c[idField] = '';
        c[urlField] = '';
        purged++;
        configDirty = true;
        Logger.log('PURGED (no existe): ' + idField + '=' + fileId + ' en evento ' + eventoId + ' — ' + e.message);
      }
    }
  }

  // Guardar config limpio si hubo cambios
  if (configDirty) {
    MEMORY_CACHE_CONFIG = null;
    CacheService.getScriptCache().remove("perfiles_config_v4");
    guardarBaseConfig(perfiles);
    Logger.log('Config guardado con referencias zombie purgadas.');
  }

  return { success: true, fixed: fixed, purged: purged };
}
/**
 * Sincroniza forzadamente los assets de branding desde la carpeta G_ASSET_BRANDING
 * Se usa principalmente desde el Panel de Admin para asegurar coherencia visual.
 */
function syncEventBranding(eventId) {
  try {
    const perfiles = getBaseConfig();
    if (!perfiles[eventId]) perfiles[eventId] = crearBaseInicial(eventId);
    const c = perfiles[eventId];
    
    const parent = getEventFolder(eventId);
    if (!parent) return { error: "No se encontró la carpeta del evento" };
    
    const brandingFolder = getBrandingFolder(parent);
    const files = brandingFolder.getFiles();
    
    const assetTypes = {
      'HERO_':   { id: 'heroImage',   url: 'heroImageUrl' },
      'BGROUND_': { id: 'bgImageId',   url: 'bgImageUrl' },
      'WATERMARK_': { id: 'WATERMARK_Id', url: 'watermarkUrl' }, // Ajuste a prefix
      'TICKER_': { id: 'tickerId',    url: 'tickerUrl' }
    };
    
    let changed = false;
    // Agrupar archivos por tipo para encontrar el más reciente de cada uno
    const found = {};
    
    while (files.hasNext()) {
      const f = files.next();
      const n = f.getName(); // Sensible a mayúsculas (Patrón: HERO_...)
      for (const prefix in assetTypes) {
        if (n.startsWith(prefix) && !f.isTrashed()) {
          if (!found[prefix] || f.getLastUpdated().getTime() > found[prefix].time) {
            found[prefix] = { id: f.getId(), time: f.getLastUpdated().getTime() };
          }
        }
      }
    }
    
    for (const prefix in assetTypes) {
      if (found[prefix]) {
        const info = assetTypes[prefix];
        const fId = found[prefix].id;
        if (c[info.id] !== fId) {
          c[info.id] = fId;
          c[info.url] = (prefix === 'WATERMARK_')
            ? "https://lh3.googleusercontent.com/d/" + fId
            : "https://drive.google.com/thumbnail?id=" + fId + "&sz=w2000";
          changed = true;
        }
      }
    }
    
    if (changed) {
      perfiles[eventId] = c;
      guardarBaseConfig(perfiles);
    }
    
    return { success: true, data: c };
  } catch(e) {
    return { error: e.toString() };
  }
}
function getBrandingFolder(parentFolder) {
  const folders = parentFolder.getFoldersByName("G_ASSET_BRANDING");
  if(folders.hasNext()) return folders.next();
  return parentFolder.createFolder("G_ASSET_BRANDING");
}

/**
 * Localiza la carpeta física de un evento (EVENTO_xxx) en Drive
 */
function getEventFolder(eventId) {
  if (!eventId || eventId === "General") return DriveApp.getFolderById(FOLDER_PRINCIPAL_ID);
  
  const parent = DriveApp.getFolderById(FOLDER_PRINCIPAL_ID);
  const folders = parent.getFoldersByName("EVENTO_" + eventId);
  if (folders.hasNext()) {
    const f = folders.next();
    if (!f.isTrashed()) return f;
  }
  return null;
}
