/**
 * Base de datos de Fritik en Google Apps Script (sin permisos de Google).
 *
 * Cada proyecto de Apps Script tiene su propio PropertiesService, así que
 * esta base es totalmente independiente de la de Chilokos. Usa bloques de
 * 8 KB y CacheService para lecturas rápidas. No usa Drive ni UrlFetchApp.
 */

var DB_VERSION = 2;
var DB_PREFIX = 'FRITIK_DB_';
var DB_CHUNKS_KEY = 'FRITIK_DB_CHUNKS';
var DB_CACHE_KEY = 'fritik_db_cache_v1';
var DB_CACHE_MAX = 95000;    // límite seguro de CacheService (~100 KB por clave)
var DB_CHUNK_SIZE = 8000;    // límite por propiedad del script (~9 KB)
var DB_MAX_BYTES = 430000;   // límite total de PropertiesService (~500 KB)

var _dbCache = null;
var _dirty = false;

var ROLE_RANK = { cliente: 1, mesero: 2, cocinero: 2, cajero: 3, encargado: 4, dueno: 5 };

// Carta de Fritik: [categoria, nombre, precio (EUR), emoji, descripcion]
var MENUS = [
  // La especialidad de la casa: churros recién hechos.
  ['Churros', 'Churros clásicos (6 uds)', 3.5, '🥨', 'Recién hechos, con azúcar y canela'],
  ['Churros', 'Churros con chocolate', 4.2, '🍫', 'Seis churros con chocolate caliente para mojar'],
  ['Churros', 'Churros rellenos de dulce de leche', 4.5, '🍮', 'Rellenos generosos de dulce de leche'],
  ['Churros', 'Churros rellenos de chocolate', 4.5, '🍫', 'Corazón de chocolate fundido'],
  ['Churros', 'Churros rellenos de fresa', 4.4, '🍓', 'Relleno de fresa dulce y cremoso'],
  ['Churros', 'Churros con Nutella', 4.8, '🌰', 'Bañados y rellenos de Nutella'],
  ['Churros', 'Churros con crema pastelera', 4.3, '🥛', 'Rellenos de crema pastelera de vainilla'],
  ['Churros', 'Churros de coco', 4.2, '🥥', 'Con coco rallado y leche condensada'],
  ['Churros', 'Churro gigante', 3.2, '🥨', 'Un churro XXL con azúcar y canela'],
  ['Churros', 'Docena para compartir', 6.5, '🎉', 'Doce churros clásicos con dos dips'],

  ['Dulces típicos', 'Cocadas', 1.8, '🥥', 'Coco rallado con panela, bocado dulce'],
  ['Dulces típicos', 'Dulce de leche', 2.2, '🍮', 'Leche cocida lentamente con un toque de vainilla'],
  ['Dulces típicos', 'Majarete', 2.0, '🌽', 'Crema de maíz con canela y papelón'],
  ['Dulces típicos', 'Besitos de coco', 1.9, '🥥', 'Bocaditos de coco horneados'],
  ['Dulces típicos', 'Panelitas', 1.7, '🍬', 'Panelitas de leche y azúcar'],

  ['Gomitas', 'Gomitas surtidas 100 g', 2.5, '🍬', 'Mezcla de sabores y colores'],
  ['Gomitas', 'Gomitas ácidas 100 g', 2.7, '🍋', 'Toque ácido con azúcar'],
  ['Gomitas', 'Ositos de goma 100 g', 2.4, '🐻', 'Ositos suaves de frutas'],
  ['Gomitas', 'Serpentinas 100 g', 2.5, '🐍', 'Gomitas largas de fresa y limón'],
  ['Gomitas', 'Gusano ácido 100 g', 2.6, '🐛', 'Gomita ácida de colores'],

  ['Chocolates', 'Bombones surtidos', 3.5, '🍫', 'Surtido de chocolate con leche y blanco'],
  ['Chocolates', 'Trufas de cacao', 3.8, '🍫', 'Trufas rellenas de ganache'],
  ['Chocolates', 'Chocolate con leche 80 g', 3.2, '🍫', 'Barra cremosa de chocolate'],
  ['Chocolates', 'Chocolate amargo 70%', 3.6, '🍫', 'Cacao intenso, barra de 80 g'],
  ['Chocolates', 'Brownie de chocolate', 3.9, '🍰', 'Brownie húmedo con chispas de chocolate'],

  ['Postres', 'Fresas con crema', 4.5, '🍓', 'Fresas frescas con crema dulce'],
  ['Postres', 'Crepas de dulce de leche', 4.8, '🥞', 'Crepas rellenas y bañadas'],
  ['Postres', 'Cupcake de vainilla', 3.5, '🧁', 'Bizcocho de vainilla con frosting'],
  ['Postres', 'Donas glaseadas', 2.9, '🍩', 'Donas esponjosas con glaseado'],
  ['Postres', 'Helado artesanal', 3.2, '🍦', 'Dos bolas a elección'],

  ['Bebidas', 'Chocolate caliente', 3.0, '☕', 'El acompañante perfecto para tus churros'],
  ['Bebidas', 'Malteada de fresa', 4.5, '🥤', 'Leche, fresa y helado'],
  ['Bebidas', 'Malteada de chocolate', 4.5, '🥤', 'Chocolate, leche y helado'],
  ['Bebidas', 'Jugo de mango', 3.0, '🥭', 'Mango natural'],
  ['Bebidas', 'Refresco 355 ml', 2.2, '🥤', 'Coca-Cola, Sprite o Fanta'],
  ['Bebidas', 'Café de olla', 2.8, '☕', 'Café con canela y papelón'],
];

function uid(prefix) {
  prefix = prefix || '';
  return prefix + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
}

function carta() {
  return MENUS.map(function (m) {
    return {
      id: uid('m_'), category: m[0], name: m[1], price: m[2],
      emoji: m[3], description: m[4], available: true,
    };
  });
}

function seed() {
  var now = Date.now();
  var users = [
    { id: uid('u_'), username: 'dueno', password: '1234', name: 'Dueño Fritik', role: 'dueno', active: true },
    { id: uid('u_'), username: 'encargado', password: '1234', name: 'Ana Encargada', role: 'encargado', active: true },
    { id: uid('u_'), username: 'mesero', password: '1234', name: 'Carlos Vendedor', role: 'mesero', active: true },
    { id: uid('u_'), username: 'cocina', password: '1234', name: 'Roberto Preparador', role: 'cocinero', active: true },
    { id: uid('u_'), username: 'caja', password: '1234', name: 'Lucía Cajera', role: 'cajero', active: true },
  ];

  var tables = [];
  for (var i = 1; i <= 8; i++) {
    tables.push({ id: 'mesa-' + i, number: i, seats: i <= 4 ? 2 : 4, status: 'libre' });
  }

  return {
    version: DB_VERSION,
    users: users,
    menu: carta(),
    tables: tables,
    orders: [],
    notifications: [],
    sessions: {},
    counters: { order: 1 },
    createdAt: now,
  };
}

/* ---------------- Lectura / escritura troceada ---------------- */
function readDbRaw_() {
  var cache = CacheService.getScriptCache();
  try {
    var cached = cache.get(DB_CACHE_KEY);
    if (cached) return cached;
  } catch (e) { /* cache opcional */ }

  var props = PropertiesService.getScriptProperties().getProperties();
  var total = Number(props[DB_CHUNKS_KEY] || 0);
  if (!total) return null;
  var partes = [];
  for (var i = 0; i < total; i++) {
    var trozo = props[DB_PREFIX + i];
    if (trozo == null) return null;
    partes.push(trozo);
  }
  return partes.join('');
}

function writeDbRaw_(json) {
  var propsService = PropertiesService.getScriptProperties();
  var prevTotal = Number(propsService.getProperty(DB_CHUNKS_KEY) || 0);
  var trozos = [];
  for (var i = 0; i < json.length; i += DB_CHUNK_SIZE) {
    trozos.push(json.slice(i, i + DB_CHUNK_SIZE));
  }
  var valores = {};
  for (var j = 0; j < trozos.length; j++) {
    valores[DB_PREFIX + j] = trozos[j];
  }
  valores[DB_CHUNKS_KEY] = String(trozos.length);
  propsService.setProperties(valores, false);
  if (prevTotal > trozos.length) {
    var sobrantes = [];
    for (var k = trozos.length; k < prevTotal; k++) sobrantes.push(DB_PREFIX + k);
    propsService.deleteProperties(sobrantes);
  }
  try {
    if (json.length < DB_CACHE_MAX) {
      CacheService.getScriptCache().put(DB_CACHE_KEY, json, 21600);
    } else {
      CacheService.getScriptCache().remove(DB_CACHE_KEY);
    }
  } catch (e) { /* la cache es opcional */ }
}

function loadDb_() {
  if (_dbCache) return _dbCache;

  var db = null;
  var raw = readDbRaw_();
  if (raw) {
    try { db = JSON.parse(raw); } catch (e) { db = null; }
  }
  if (!db) {
    db = seed();
    _dirty = true;
  }

  db.notifications = db.notifications || [];
  db.sessions = db.sessions || {};
  db.counters = db.counters || { order: 1 };
  if (!db.version || db.version < DB_VERSION) {
    db.menu = carta();
    db.version = DB_VERSION;
    _dirty = true;
  }
  if (!db.users || !db.users.length) {
    db = seed();
    _dirty = true;
  }

  _dbCache = db;
  return db;
}

function db() { return loadDb_(); }

function save() { _dirty = true; }

function isDirty_() { return _dirty; }

/**
 * Si la base crece demasiado, elimina los pedidos cerrados más antiguos.
 * Devuelve true si hubo recorte.
 */
function shrinkDb_(db) {
  var cerrados = db.orders
    .filter(function (o) { return o.status === 'pagado' || o.status === 'cancelado'; })
    .sort(function (a, b) { return a.createdAt - b.createdAt; });

  var recortado = false;
  while (cerrados.length && JSON.stringify(db).length > DB_MAX_BYTES) {
    var viejo = cerrados.shift();
    var idx = db.orders.indexOf(viejo);
    if (idx !== -1) { db.orders.splice(idx, 1); recortado = true; }
  }
  return recortado;
}

function commitDb_() {
  var db = _dbCache || loadDb_();
  var json = JSON.stringify(db);

  if (json.length > DB_MAX_BYTES) {
    shrinkDb_(db);
    json = JSON.stringify(db);
  }

  try {
    writeDbRaw_(json);
  } catch (e) {
    // Cuota llena: recorta pedidos viejos y reintenta una vez.
    shrinkDb_(db);
    json = JSON.stringify(db);
    try {
      writeDbRaw_(json);
    } catch (e2) {
      return; // se reintenta en la próxima petición
    }
  }
  _dirty = false;
}

/* ---------------- Higiene de datos ---------------- */
function pruneIfNeeded_() {
  var props = PropertiesService.getScriptProperties();
  var last = Number(props.getProperty('LAST_PRUNE') || 0);
  var now = Date.now();
  if (now - last < 60 * 60 * 1000) return;

  var db = loadDb_();
  var cambiado = false;
  for (var token in db.sessions) {
    if (now - (db.sessions[token].createdAt || 0) > SESSION_TTL) {
      delete db.sessions[token];
      cambiado = true;
    }
  }
  var vigentes = db.notifications.filter(function (n) { return now - n.createdAt <= SESSION_TTL; });
  if (vigentes.length !== db.notifications.length) {
    db.notifications = vigentes;
    cambiado = true;
  }
  if (cambiado) _dirty = true;
  props.setProperty('LAST_PRUNE', String(now));
}
