import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
const CORRECT_PIN = '1234'
const PIN_LENGTH = 4
const NUMBER_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
const SCREENS = { SELECTION: 'selection', ADMIN: 'admin', USERS: 'users', ATTENDANCE: 'attendance', DASHBOARD: 'dashboard' }
const HISTORY_PERIODS = ['Diario', 'Semanal', 'Mensual', 'Anual']
const ADMIN_MENU = [
  { key: 'overview', label: 'Resumen' },
  { key: 'orders', label: 'Ordenes' },
  { key: 'customers', label: 'Clientes' },
  { key: 'builder', label: 'Editor POS' },
  { key: 'history', label: 'Historial' },
]
const SUPERVISOR_ADMIN_MENU = [
  { key: 'orders', label: 'Devoluciones' },
  { key: 'builder', label: 'Ajustes' },
]
const ROLE_CARDS = [
  { title: 'Admin', detail: 'Panel de administracion avanzado.', icon: 'A' },
  { title: 'Usuarios', detail: 'Gestion de usuarios, roles y sesiones.', icon: 'U' },
  { title: 'Registro de asistencia', detail: 'Entradas, salidas y control horario.', icon: 'R' },
  { title: 'Dashboard', detail: 'Resumen operativo y estado de tienda.', icon: 'D' },
  { title: 'Ajustes', detail: 'Preferencias y configuracion del sistema.', icon: 'S' },
]

const POS_MENUS = {
  pizza: {
    label: 'Pizza',
    icon: '🍕',
    color: '#ff6b3d',
    submenus: [
      { id: 'clasicas', label: 'Clasicas' },
      { id: 'premium', label: 'Premium' },
      { id: 'combos', label: 'Combos' },
    ],
    items: {
      clasicas: ['Pepperoni', 'Margarita', 'Hawaiana', 'Vegetariana'],
      premium: ['4 Quesos', 'BBQ Chicken', 'Trufa', 'Mediterranea'],
      combos: ['Combo 2x1', 'Familiar + Refresco', 'Party Pack'],
    },
  },
  burgers: {
    label: 'Burgers',
    icon: '🍔',
    color: '#ffb347',
    submenus: [
      { id: 'clasicas', label: 'Clasicas' },
      { id: 'dobles', label: 'Dobles' },
      { id: 'especiales', label: 'Especiales' },
    ],
    items: {
      clasicas: ['Cheeseburger', 'Bacon Burger', 'Classic Smash'],
      dobles: ['Doble Queso', 'Doble Bacon', 'Triple Stack'],
      especiales: ['Jalapeno Melt', 'Blue Cheese', 'Tex-Mex'],
    },
  },
  drinks: {
    label: 'Bebidas',
    icon: '🥤',
    color: '#3da9ff',
    submenus: [
      { id: 'frias', label: 'Frias' },
      { id: 'calientes', label: 'Calientes' },
      { id: 'batidos', label: 'Batidos' },
    ],
    items: {
      frias: ['Cola', 'Limonada', 'Te Frio', 'Agua'],
      calientes: ['Cafe', 'Capuccino', 'Chocolate'],
      batidos: ['Fresa', 'Vainilla', 'Chocolate'],
    },
  },
  dessert: {
    label: 'Postres',
    icon: '🍰',
    color: '#d26bff',
    submenus: [
      { id: 'helados', label: 'Helados' },
      { id: 'pasteles', label: 'Pasteles' },
      { id: 'extras', label: 'Extras' },
    ],
    items: {
      helados: ['Vainilla', 'Chocolate', 'Mixto'],
      pasteles: ['Cheesecake', 'Brownie', 'Red Velvet'],
      extras: ['Galletas', 'Donut', 'Fruit Cup'],
    },
  },
}

const UNIVERSAL_TOPPINGS = [
  { id: 'extra-cheese', icon: '🧀', label: 'Extra queso', color: '#ffd166', price: 1.6 },
  { id: 'mushroom', icon: '🍄', label: 'Hongos', color: '#b8a78f', price: 1.85 },
  { id: 'olive', icon: '🫒', label: 'Aceituna', color: '#7fb069', price: 1.45 },
  { id: 'onion', icon: '🧅', label: 'Cebolla', color: '#9f86c0', price: 1.25 },
  { id: 'pepper', icon: '🌶️', label: 'Picante', color: '#ff6b6b', price: 1.35 },
  { id: 'bacon', icon: '🥓', label: 'Bacon', color: '#f79d65', price: 2.15 },
]

const TOPPINGS_BY_CATEGORY = {
  pizza: UNIVERSAL_TOPPINGS,
  burgers: [
    { id: 'burger-cheese', icon: '🧀', label: 'Queso extra', color: '#ffd166', price: 1.6 },
    { id: 'burger-bacon', icon: '🥓', label: 'Bacon crispy', color: '#f79d65', price: 2.15 },
    { id: 'burger-pickle', icon: '🥒', label: 'Pepinillos', color: '#7fb069', price: 1.2 },
    { id: 'burger-bbq', icon: '🍯', label: 'Salsa BBQ', color: '#c98c4d', price: 1.35 },
  ],
  drinks: [
    { id: 'drink-ice', icon: '🧊', label: 'Hielo extra', color: '#8ed7ff', price: 0.6 },
    { id: 'drink-lemon', icon: '🍋', label: 'Rodaja limon', color: '#e8db52', price: 0.75 },
    { id: 'drink-syrup', icon: '🧴', label: 'Syrup sabor', color: '#d6a9ff', price: 0.95 },
    { id: 'drink-boba', icon: '⚫', label: 'Perlas boba', color: '#9e9e9e', price: 1.35 },
  ],
  dessert: [
    { id: 'dessert-choco', icon: '🍫', label: 'Salsa chocolate', color: '#8d6e63', price: 1.1 },
    { id: 'dessert-caramel', icon: '🍮', label: 'Caramelo', color: '#e6b56a', price: 0.95 },
    { id: 'dessert-fruit', icon: '🍓', label: 'Frutas frescas', color: '#ff7f9f', price: 1.25 },
    { id: 'dessert-cream', icon: '🍦', label: 'Crema extra', color: '#f2f2f2', price: 0.9 },
  ],
}

const CATEGORY_BASE_PRICE = {
  pizza: 12,
  burgers: 9,
  drinks: 4,
  dessert: 6,
}
const ITEM_BASE_PRICE = {
  Pepperoni: 13.5,
  Margarita: 12.75,
  Hawaiana: 13.2,
  Vegetariana: 12.95,
  '4 Quesos': 14.8,
  'BBQ Chicken': 15.25,
  Trufa: 16.4,
  Mediterranea: 14.6,
  'Combo 2x1': 18.75,
  'Familiar + Refresco': 22.9,
  'Party Pack': 27.5,
  Cheeseburger: 8.95,
  'Bacon Burger': 9.7,
  'Classic Smash': 9.4,
  'Doble Queso': 10.6,
  'Doble Bacon': 11.25,
  'Triple Stack': 12.1,
  'Jalapeno Melt': 10.8,
  'Blue Cheese': 10.95,
  'Tex-Mex': 10.7,
  Cola: 2.2,
  Limonada: 2.45,
  'Te Frio': 2.35,
  Agua: 1.9,
  Cafe: 2.65,
  Capuccino: 3.1,
  Chocolate: 2.95,
  Fresa: 3.45,
  Vainilla: 3.4,
  Mixto: 3.55,
  Cheesecake: 4.9,
  Brownie: 4.2,
  'Red Velvet': 5.1,
  Galletas: 2.95,
  Donut: 2.75,
  'Fruit Cup': 3.15,
}
const SIZE_OPTIONS = [
  { id: 'small', label: 'Pequena', multiplier: 0.85 },
  { id: 'medium', label: 'Mediana', multiplier: 1 },
  { id: 'large', label: 'Grande', multiplier: 1.3 },
]
const PIZZA_CRUST_OPTIONS = [
  { id: 'regular', label: 'Regular', extra: 0 },
  { id: 'cheese', label: 'Borde queso', extra: 1.75 },
  { id: 'thin', label: 'Thin crust', extra: 0.9 },
]
const PIZZA_BAKE_OPTIONS = [
  { id: 'normal', label: 'Normal', extra: 0 },
  { id: 'well_done', label: 'Well done', extra: 0 },
]
const SERVICE_MODES = [
  { id: 'dinein', icon: '🪑', label: 'Mesa' },
  { id: 'takeaway', icon: '🥡', label: 'Para llevar' },
]
const getServiceModeLabel = (modeId) => SERVICE_MODES.find((mode) => mode.id === modeId)?.label || 'Mesa'
const INITIAL_ORDER_NUMBER = 5555

const INITIAL_ORDERS = [
  { id: 'ORD-1001', customer: 'Mariana Diaz', total: 148, status: 'Pagada', payment: 'Tarjeta', items: 4, note: '' },
  { id: 'ORD-1002', customer: 'Carlos Ruiz', total: 82, status: 'En cocina', payment: 'Efectivo', items: 2, note: '' },
  { id: 'ORD-1003', customer: 'Lucia Mendez', total: 213, status: 'Pagada', payment: 'Transferencia', items: 6, note: '' },
]

const INITIAL_CUSTOMERS = [
  { id: 'CUS-01', name: 'Mariana Diaz', phone: '305-555-0192', address: '122 Market St', payment: 'Tarjeta' },
  { id: 'CUS-02', name: 'Carlos Ruiz', phone: '786-555-0180', address: '54 Sunset Ave', payment: 'Efectivo' },
  { id: 'CUS-03', name: 'Lucia Mendez', phone: '954-555-0120', address: '901 Ocean Dr', payment: 'Transferencia' },
]

const INITIAL_ACTION_BUTTONS = ['Cobro rapido', 'Descuento', 'Cuenta separada', 'Reimprimir ticket']
const INITIAL_TOPPINGS = ['Extra queso', 'Doble carne', 'Salsa picante']
const INITIAL_EMPLOYEE_FORM = {
  firstName: '',
  lastName: '',
  country: 'United States',
  state: '',
  city: '',
  address: '',
  postalCode: '',
  phone: '',
  email: '',
  idType: 'SSN',
  idNumber: '',
  role: 'Cajero',
  status: 'Activo',
  paymentMethod: 'Transferencia',
}

const toMoney = (value) =>
  Number(value || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })

const formatHours = (hours) => `${hours.toFixed(2)} h`
const DEMO_DB_KEY = 'wigo-pos-demo-db-v1'
const IS_STATIC_DEMO = typeof window !== 'undefined' && window.location.hostname.includes('github.io')

const isPrivilegedRole = (role = '') => {
  const normalized = String(role).trim().toLowerCase()
  return normalized === 'admin' || normalized === 'administrador' || normalized === 'system' || normalized === 'systempos'
}

const getRolePinRange = (role = '') => {
  const normalized = String(role).trim().toLowerCase()
  if (normalized.includes('super')) return [2001, 2999]
  if (normalized.includes('caj')) return [3001, 3999]
  if (normalized.includes('mes')) return [4001, 4999]
  return [5001, 9999]
}

const hasPrivilegedEmployee = (employees, ignoreId = '') =>
  employees.some((emp) => emp.id !== ignoreId && isPrivilegedRole(emp.role))

const generateDemoPin = (employees, role = '') => {
  const used = new Set(employees.map((emp) => emp.pin))
  let min = 1000
  let max = 1990
  let validator = () => true

  if (isPrivilegedRole(role)) {
    validator = (pin) => pin.endsWith('0')
  } else {
    ;[min, max] = getRolePinRange(role)
  }

  const candidates = []
  for (let value = min; value <= max; value += 1) {
    const pin = String(value)
    if (pin.length !== 4 || used.has(pin) || !validator(pin)) continue
    candidates.push(pin)
  }
  if (!candidates.length) return ''
  return candidates[Math.floor(Math.random() * candidates.length)]
}

const readDemoDb = () => {
  try {
    const raw = window.localStorage.getItem(DEMO_DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        employees: Array.isArray(parsed?.employees) ? parsed.employees : [],
        attendance: Array.isArray(parsed?.attendance) ? parsed.attendance : [],
        orders: Array.isArray(parsed?.orders) ? parsed.orders : [],
      }
    }
  } catch {
    // ignore localStorage parse issues and reset db
  }
  return { employees: [], attendance: [], orders: [] }
}

const writeDemoDb = (db) => {
  window.localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db))
}

const getWeeklyLogs = (db, employeeId) => {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return db.attendance
    .filter((log) => log.employeeId === employeeId && new Date(log.timestamp).getTime() >= weekAgo)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

const nextActionForEmployee = (db, employeeId) => {
  const logs = db.attendance
    .filter((log) => log.employeeId === employeeId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  if (!logs.length) return 'Entrada'
  return logs[0].action === 'Entrada' ? 'Salida' : 'Entrada'
}

const generateHistoryRows = (period = 'Diario') => {
  const configs = {
    Diario: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
    Semanal: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
    Mensual: Array.from({ length: 30 }, (_, i) => `D${i + 1}`),
    Anual: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  }
  const labels = configs[period] || configs.Diario
  return labels.map((label, idx) => {
    const sales = Math.max(220, Math.round(1200 + Math.sin(idx * 0.42) * 460 + Math.cos(idx * 0.17) * 210))
    const promos = Math.round(sales * (0.08 + (idx % 5) * 0.01))
    const discounts = Math.round(sales * (0.05 + (idx % 4) * 0.008))
    const expenses = Math.round(sales * (0.32 + (idx % 3) * 0.04))
    return { label, sales, promos, discounts, expenses }
  })
}

const buildDemoSummary = () => {
  const rows = generateHistoryRows('Diario')
  const sales = rows.reduce((sum, r) => sum + r.sales, 0)
  const promos = rows.reduce((sum, r) => sum + r.promos, 0)
  const discounts = rows.reduce((sum, r) => sum + r.discounts, 0)
  const expenses = rows.reduce((sum, r) => sum + r.expenses, 0)
  const progress = ((sales - expenses) / Math.max(sales, 1)) * 100
  return { sales, promos, discounts, expenses, progress }
}

const mockFetchJson = async (path, options = {}) => {
  const method = String(options.method || 'GET').toUpperCase()
  const url = new URL(path, 'https://local.mock')
  const db = readDemoDb()

  if (url.pathname === '/api/admin/summary' && method === 'GET') return buildDemoSummary()
  if (url.pathname === '/api/admin/day' && method === 'GET') return { rows: generateHistoryRows('Diario') }
  if (url.pathname === '/api/admin/history' && method === 'GET') return { rows: generateHistoryRows(url.searchParams.get('period') || 'Diario') }
  if (url.pathname === '/api/admin/live' && method === 'GET') {
    const liveTrend = Array.from({ length: 10 }, (_, idx) => {
      const v = 65 + Math.sin((Date.now() / 1000 + idx) * 0.36) * 22 + Math.cos((Date.now() / 1000 + idx) * 0.22) * 8
      return Math.min(100, Math.max(35, Math.round(v)))
    })
    return { liveTrend }
  }

  if (url.pathname === '/api/orders' && method === 'GET') return { orders: db.orders }
  if (url.pathname === '/api/orders' && method === 'POST') {
    const order = JSON.parse(options.body || '{}')
    const saved = { ...order, createdAt: order.createdAt || new Date().toISOString() }
    db.orders = [saved, ...db.orders.filter((row) => row.id !== saved.id)]
    writeDemoDb(db)
    return { order: saved }
  }
  if (url.pathname.startsWith('/api/orders/') && method === 'PUT') {
    const orderId = decodeURIComponent(url.pathname.split('/').pop())
    const payload = JSON.parse(options.body || '{}')
    let updated = null
    db.orders = db.orders.map((row) => {
      if (row.id !== orderId) return row
      updated = { ...row, ...payload, updatedAt: payload.updatedAt || new Date().toISOString() }
      return updated
    })
    if (!updated) throw new Error('HTTP 404')
    writeDemoDb(db)
    return { order: updated }
  }

  if (url.pathname === '/api/employees' && method === 'GET') return { employees: db.employees }
  if (url.pathname === '/api/employees' && method === 'POST') {
    const payload = JSON.parse(options.body || '{}')
    const role = String(payload.role || 'Empleado').trim()
    if (isPrivilegedRole(role) && hasPrivilegedEmployee(db.employees)) throw new Error('Ya existe un usuario System/Admin')
    const pin = generateDemoPin(db.employees, role)
    if (!pin) throw new Error('No hay PIN disponibles')
    const employee = {
      id: `EMP-${Date.now()}`,
      ...payload,
      role,
      pin,
      fullName: `${payload.firstName || ''} ${payload.lastName || ''}`.trim(),
      accessLevel: isPrivilegedRole(role) ? 'system-admin' : 'standard',
      createdAt: new Date().toISOString(),
    }
    db.employees.push(employee)
    writeDemoDb(db)
    return { employee, generatedPin: pin }
  }
  if (url.pathname.startsWith('/api/employees/') && method === 'PUT') {
    const employeeId = decodeURIComponent(url.pathname.split('/').pop())
    const payload = JSON.parse(options.body || '{}')
    const idx = db.employees.findIndex((emp) => emp.id === employeeId)
    if (idx < 0) throw new Error('HTTP 404')
    const current = db.employees[idx]
    const nextRole = payload.role ? String(payload.role).trim() : current.role
    if (isPrivilegedRole(nextRole) && hasPrivilegedEmployee(db.employees, current.id)) throw new Error('Ya existe un usuario System/Admin')
    const next = { ...current, ...payload }
    if (payload.role && payload.role !== current.role) {
      const pin = generateDemoPin(db.employees.filter((emp) => emp.id !== current.id), nextRole)
      if (!pin) throw new Error('No hay PIN disponibles')
      next.pin = pin
      next.accessLevel = isPrivilegedRole(nextRole) ? 'system-admin' : 'standard'
    }
    next.fullName = `${next.firstName || ''} ${next.lastName || ''}`.trim()
    db.employees[idx] = next
    writeDemoDb(db)
    return { employee: next }
  }
  if (url.pathname.startsWith('/api/employees/') && method === 'DELETE') {
    const employeeId = decodeURIComponent(url.pathname.split('/').pop())
    db.employees = db.employees.filter((emp) => emp.id !== employeeId)
    db.attendance = db.attendance.filter((log) => log.employeeId !== employeeId)
    writeDemoDb(db)
    return { ok: true }
  }

  if (url.pathname === '/api/auth/pin' && method === 'POST') {
    const payload = JSON.parse(options.body || '{}')
    const employee = db.employees.find((emp) => emp.pin === String(payload.pin || '').trim())
    if (!employee) throw new Error('HTTP 404')
    return {
      employee,
      weeklyHistory: getWeeklyLogs(db, employee.id),
      nextAction: nextActionForEmployee(db, employee.id),
    }
  }
  if (url.pathname === '/api/attendance/punch' && method === 'POST') {
    const payload = JSON.parse(options.body || '{}')
    const pin = String(payload.pin || '').trim()
    const employee = db.employees.find((emp) => emp.pin === pin)
    if (!employee) throw new Error('HTTP 404')
    const action = nextActionForEmployee(db, employee.id)
    db.attendance.push({
      id: `AT-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
      action,
      timestamp: new Date().toISOString(),
    })
    writeDemoDb(db)
    return {
      message: action === 'Entrada' ? 'Hora de entrada confirmada' : 'Hora de salida confirmada',
      action,
      weeklyHistory: getWeeklyLogs(db, employee.id),
    }
  }
  if (url.pathname === '/api/attendance/history' && method === 'GET') {
    const employeeId = url.searchParams.get('employeeId')
    return { weeklyHistory: getWeeklyLogs(db, employeeId) }
  }

  throw new Error('HTTP 404')
}

const calculateWorkedHours = (weeklyHistory = []) => {
  const sorted = [...weeklyHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  let openEntry = null
  let totalMs = 0

  sorted.forEach((log) => {
    if (log.action === 'Entrada') {
      openEntry = new Date(log.timestamp)
      return
    }

    if (log.action === 'Salida' && openEntry) {
      const out = new Date(log.timestamp)
      if (out > openEntry) totalMs += out - openEntry
      openEntry = null
    }
  })

  return totalMs / (1000 * 60 * 60)
}

const getItemPrice = (category, itemName, sizeId = 'medium') => {
  const itemBase = ITEM_BASE_PRICE[itemName] ?? CATEGORY_BASE_PRICE[category] ?? 8
  const sizeMultiplier = SIZE_OPTIONS.find((size) => size.id === sizeId)?.multiplier ?? 1
  return Number((itemBase * sizeMultiplier).toFixed(2))
}

const getProductIcon = (category, itemName = '') => {
  const text = String(itemName).toLowerCase()
  if (category === 'pizza') {
    if (text.includes('hawa')) return '🍍'
    if (text.includes('ques')) return '🧀'
    if (text.includes('bbq')) return '🍗'
    if (text.includes('combo')) return '📦'
    return '🍕'
  }
  if (category === 'burgers') {
    if (text.includes('bacon')) return '🥓'
    if (text.includes('cheese') || text.includes('queso')) return '🧀'
    return '🍔'
  }
  if (category === 'drinks') {
    if (text.includes('cafe') || text.includes('capu') || text.includes('chocolate')) return '☕'
    if (text.includes('agua')) return '💧'
    return '🥤'
  }
  if (category === 'dessert') {
    if (text.includes('helad')) return '🍨'
    if (text.includes('brownie') || text.includes('gallet') || text.includes('donut')) return '🍪'
    return '🍰'
  }
  return '🧾'
}

const mapLabelsToToppingIds = (category, labels = []) => {
  const catalog = TOPPINGS_BY_CATEGORY[category] || UNIVERSAL_TOPPINGS
  return labels
    .map((label) => catalog.find((item) => item.label === label)?.id)
    .filter(Boolean)
}

const formatPizzaProfile = (profile) => {
  if (!profile) return 'Pizza clasica'
  const left = profile.left?.length ? `Izq: ${profile.left.join(', ')}` : 'Izq: sin extras'
  const right = profile.right?.length ? `Der: ${profile.right.join(', ')}` : 'Der: sin extras'
  const full = profile.full?.length ? `Completa: ${profile.full.join(', ')}` : 'Completa: sin extras'
  return `${left} | ${right} | ${full}`
}

const toAdminOrder = (order) => ({
  id: order.id,
  customer: order.customerName || 'Consumidor final',
  total: Number(order.total || 0),
  status: order.status || 'Pagada',
  payment: order.payment || 'Pendiente',
  items: Array.isArray(order.lines) ? order.lines.reduce((sum, line) => sum + Number(line.qty || 0), 0) : 0,
  note: order.note || '',
})

function App() {
  const [isLightMode, setIsLightMode] = useState(() => {
    if (typeof window === 'undefined') return true
    const storedTheme = window.localStorage.getItem('pos-theme')
    if (storedTheme === 'light') return true
    if (storedTheme === 'dark') return false
    return true
  })
  const [now, setNow] = useState(new Date())
  const [pin, setPin] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [screen, setScreen] = useState(SCREENS.SELECTION)
  const [error, setError] = useState('')
  const [apiError, setApiError] = useState('')

  const [summary, setSummary] = useState({ sales: 0, promos: 0, discounts: 0, expenses: 0, progress: 0 })
  const [todayRows, setTodayRows] = useState([])
  const [historyRows, setHistoryRows] = useState([])
  const [liveTrend, setLiveTrend] = useState([58, 64, 61, 70, 67, 72, 69, 77, 74, 82])

  const [historyPeriod, setHistoryPeriod] = useState('Diario')
  const [adminSection, setAdminSection] = useState('overview')
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false)

  const [orders, setOrders] = useState(INITIAL_ORDERS)
  const [selectedOrderId, setSelectedOrderId] = useState(INITIAL_ORDERS[0].id)
  const [orderDraft, setOrderDraft] = useState(INITIAL_ORDERS[0])

  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS)
  const [selectedCustomerId, setSelectedCustomerId] = useState(INITIAL_CUSTOMERS[0].id)
  const [customerDraft, setCustomerDraft] = useState(INITIAL_CUSTOMERS[0])

  const [actionButtons, setActionButtons] = useState(INITIAL_ACTION_BUTTONS)
  const [newActionButton, setNewActionButton] = useState('')
  const [toppings, setToppings] = useState(INITIAL_TOPPINGS)
  const [newTopping, setNewTopping] = useState('')
  const [employees, setEmployees] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [employeeDraft, setEmployeeDraft] = useState(null)
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [employeeForm, setEmployeeForm] = useState(INITIAL_EMPLOYEE_FORM)
  const [lastGeneratedPin, setLastGeneratedPin] = useState('')
  const [employeeWeeklyHistory, setEmployeeWeeklyHistory] = useState([])
  const [attendanceSession, setAttendanceSession] = useState(null)

  const [posCategory, setPosCategory] = useState('pizza')
  const [selectedSize, setSelectedSize] = useState('medium')
  const [selectedCrust, setSelectedCrust] = useState('regular')
  const [selectedBake, setSelectedBake] = useState('normal')
  const [pizzaConfigLocked, setPizzaConfigLocked] = useState({ size: false, crust: false, bake: false })
  const [selectedPosItem, setSelectedPosItem] = useState('')
  const [selectedToppings, setSelectedToppings] = useState([])
  const [showToppingsMenu, setShowToppingsMenu] = useState(false)
  const [pizzaToppingsBySide, setPizzaToppingsBySide] = useState({ left: [], right: [], full: [] })
  const [cartItems, setCartItems] = useState([])
  const [showOrdersPanel, setShowOrdersPanel] = useState(false)
  const [showDiscountMenu, setShowDiscountMenu] = useState(false)
  const [ordersView, setOrdersView] = useState('sent')
  const [discountValue, setDiscountValue] = useState(0)
  const [clientPhone, setClientPhone] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [serviceMode, setServiceMode] = useState('takeaway')
  const [showPhoneSearch, setShowPhoneSearch] = useState(false)
  const [showClientPanel, setShowClientPanel] = useState(false)
  const [clientLookupStatus, setClientLookupStatus] = useState('idle')
  const [clientLookupMessage, setClientLookupMessage] = useState('')
  const [posCustomers, setPosCustomers] = useState(() =>
    INITIAL_CUSTOMERS.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address || '',
      points: customer.points || 0,
    }))
  )
  const [orderNumber, setOrderNumber] = useState(INITIAL_ORDER_NUMBER)
  const [savedPosOrders, setSavedPosOrders] = useState([])
  const [selectedPosOrderId, setSelectedPosOrderId] = useState('')
  const [editingPosOrderId, setEditingPosOrderId] = useState('')
  const [posNotice, setPosNotice] = useState('')
  const [posNoticeDuration, setPosNoticeDuration] = useState(2200)
  const [pendingDeleteOrderId, setPendingDeleteOrderId] = useState('')
  const [recentSentOrder, setRecentSentOrder] = useState(null)
  const [noteLineKey, setNoteLineKey] = useState('')

  useEffect(() => {
    window.localStorage.setItem('pos-theme', isLightMode ? 'light' : 'dark')
  }, [isLightMode])
  const [noteDraft, setNoteDraft] = useState('')
  const [isSelectionIdle, setIsSelectionIdle] = useState(false)
  const DISCOUNT_PRESETS = [0, 5, 10, 15, 20, 25, 30, 40, 50]

  const currentRole = String(attendanceSession?.employee?.role || '').toLowerCase()
  const isSupervisorUser = currentRole.includes('super')
  const isSystemAdminUser =
    !attendanceSession ||
    attendanceSession?.employee?.accessLevel === 'system-admin' ||
    currentRole === 'admin' ||
    currentRole === 'administrador' ||
    currentRole === 'system' ||
    currentRole === 'systempos'
  const canAccessAdminPanel = isSystemAdminUser || isSupervisorUser
  const adminMenu = isSupervisorUser ? SUPERVISOR_ADMIN_MENU : ADMIN_MENU

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!lastGeneratedPin) return
    const timer = setTimeout(() => {
      setLastGeneratedPin('')
    }, 3500)
    return () => clearTimeout(timer)
  }, [lastGeneratedPin])

  useEffect(() => {
    if (!posNotice) return
    const timer = setTimeout(() => setPosNotice(''), posNoticeDuration)
    return () => clearTimeout(timer)
  }, [posNotice, posNoticeDuration])

  useEffect(() => {
    if (!recentSentOrder) return
    const timer = setTimeout(() => setRecentSentOrder(null), 1500)
    return () => clearTimeout(timer)
  }, [recentSentOrder])

  useEffect(() => {
    let timer = null
    const events = ['pointerdown', 'pointermove', 'touchstart', 'keydown']
    const markActive = () => {
      setIsSelectionIdle(false)
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setIsSelectionIdle(true), 5000)
    }

    markActive()
    events.forEach((eventName) => window.addEventListener(eventName, markActive, { passive: true }))
    return () => {
      if (timer) clearTimeout(timer)
      events.forEach((eventName) => window.removeEventListener(eventName, markActive))
    }
  }, [])

  useEffect(() => {
    if (!noteLineKey) return
    const exists = cartItems.some((line) => line.lineKey === noteLineKey)
    if (!exists) {
      setNoteLineKey('')
      setNoteDraft('')
    }
  }, [cartItems, noteLineKey])

  const fetchJson = async (path, options = {}) => {
    if (IS_STATIC_DEMO) {
      return mockFetchJson(path, options)
    }
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    } catch {
      // Fallback for static hosting (e.g., GitHub Pages) where backend API is unavailable.
      return mockFetchJson(path, options)
    }
  }

  const loadSummary = async () => {
    const data = await fetchJson('/api/admin/summary')
    setSummary(data)
  }

  const loadDayRows = async () => {
    const data = await fetchJson('/api/admin/day')
    setTodayRows(data.rows || [])
  }

  const loadHistory = async (period) => {
    const data = await fetchJson(`/api/admin/history?period=${encodeURIComponent(period)}`)
    setHistoryRows(data.rows || [])
  }

  const loadLiveTrend = async () => {
    const data = await fetchJson('/api/admin/live')
    setLiveTrend(data.liveTrend || [])
  }

  const loadPosOrders = async () => {
    const data = await fetchJson('/api/orders')
    const list = data.orders || []
    setSavedPosOrders(list)
    setOrders((prev) => {
      const apiRows = list.map(toAdminOrder)
      return apiRows.length ? apiRows : prev
    })
  }

  const showPosNotice = (message, durationMs = 2200) => {
    setPosNoticeDuration(durationMs)
    setPosNotice(message)
  }

  const loadEmployees = async () => {
    const data = await fetchJson('/api/employees')
    const list = data.employees || []
    setEmployees(list)
    if (!selectedEmployeeId && list.length) {
      setSelectedEmployeeId(list[0].id)
      setEmployeeDraft(list[0])
    }
  }

  const loadEmployeeWeeklyHistory = async (employeeId) => {
    if (!employeeId) return
    const data = await fetchJson(`/api/attendance/history?employeeId=${encodeURIComponent(employeeId)}`)
    setEmployeeWeeklyHistory(data.weeklyHistory || [])
  }

  useEffect(() => {
    if (!isUnlocked || screen !== SCREENS.ADMIN) return

    let alive = true
    const boot = async () => {
      try {
        await Promise.all([loadSummary(), loadDayRows(), loadHistory(historyPeriod), loadLiveTrend()])
        if (alive) setApiError('')
      } catch {
        if (alive) setApiError('No se pudo conectar al backend API')
      }
    }

    boot()
    const general = setInterval(() => {
      loadSummary().catch(() => setApiError('No se pudo conectar al backend API'))
      loadDayRows().catch(() => setApiError('No se pudo conectar al backend API'))
    }, 10000)
    const live = setInterval(() => {
      loadLiveTrend().catch(() => setApiError('No se pudo conectar al backend API'))
    }, 2500)

    return () => {
      alive = false
      clearInterval(general)
      clearInterval(live)
    }
  }, [isUnlocked, screen, historyPeriod])

  useEffect(() => {
    if (!isUnlocked || screen !== SCREENS.ADMIN || adminSection !== 'history') return
    loadHistory(historyPeriod).catch(() => setApiError('No se pudo conectar al backend API'))
  }, [historyPeriod, isUnlocked, screen, adminSection])

  useEffect(() => {
    if (!isUnlocked || screen !== SCREENS.USERS) return
    loadEmployees().catch(() => setApiError('No se pudo cargar empleados'))
  }, [isUnlocked, screen])

  useEffect(() => {
    if (!isUnlocked) return
    if (screen !== SCREENS.DASHBOARD && screen !== SCREENS.ADMIN) return
    loadPosOrders().catch(() => setApiError('No se pudieron cargar ordenes'))
  }, [isUnlocked, screen])

  useEffect(() => {
    if (!selectedEmployeeId || screen !== SCREENS.USERS) return
    loadEmployeeWeeklyHistory(selectedEmployeeId).catch(() => setApiError('No se pudo cargar historial semanal'))
  }, [selectedEmployeeId, screen])

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return
    if (pin === CORRECT_PIN) {
      setIsUnlocked(true)
      setScreen(SCREENS.SELECTION)
      setError('')
      return
    }

    let cancelled = false
    const verifyEmployeePin = async () => {
      try {
        const data = await fetchJson('/api/auth/pin', {
          method: 'POST',
          body: JSON.stringify({ pin }),
        })
        if (cancelled) return
        setAttendanceSession({
          pin,
          employee: data.employee,
          weeklyHistory: data.weeklyHistory || [],
          nextAction: data.nextAction || 'Entrada',
          statusMessage: '',
        })
        setIsUnlocked(true)
        setScreen(SCREENS.ATTENDANCE)
        setPin('')
        setError('')
      } catch {
        if (cancelled) return
        setError('Codigo no valido')
        setTimeout(() => {
          setPin('')
          setError('')
        }, 700)
      }
    }

    verifyEmployeePin()
    return () => {
      cancelled = true
    }
  }, [pin])

  useEffect(() => {
    const picked = orders.find((order) => order.id === selectedOrderId)
    if (picked) setOrderDraft(picked)
  }, [selectedOrderId, orders])

  useEffect(() => {
    const picked = customers.find((customer) => customer.id === selectedCustomerId)
    if (picked) setCustomerDraft(picked)
  }, [selectedCustomerId, customers])

  useEffect(() => {
    const picked = employees.find((employee) => employee.id === selectedEmployeeId)
    if (picked) setEmployeeDraft(picked)
  }, [selectedEmployeeId, employees])

  useEffect(() => {
    setSelectedPosItem('')
    setSelectedToppings([])
    setShowToppingsMenu(false)
    setPizzaToppingsBySide({ left: [], right: [], full: [] })
    setSelectedSize('medium')
    setSelectedCrust('regular')
    setSelectedBake('normal')
    setPizzaConfigLocked({ size: false, crust: false, bake: false })
  }, [posCategory])

  useEffect(() => {
    setClientLookupStatus('idle')
    setClientLookupMessage('')
  }, [clientPhone])

  const timeText = useMemo(
    () =>
      now.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [now]
  )

  const dateText = useMemo(
    () =>
      now.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    [now]
  )

  const currentRate = liveTrend[liveTrend.length - 1] || 0
  const previousRate = liveTrend[liveTrend.length - 2] || currentRate
  const trendDirection = currentRate - previousRate

  const addDigit = (value) => {
    if (isUnlocked) return
    if (pin.length >= PIN_LENGTH) return
    setError('')
    setPin((prev) => prev + value)
  }

  const clearLast = () => {
    if (isUnlocked) return
    setPin((prev) => prev.slice(0, -1))
    setError('')
  }

  const lockAgain = () => {
    setIsUnlocked(false)
    setPin('')
    setError('')
    setApiError('')
    setScreen(SCREENS.SELECTION)
    setAdminSection('overview')
    setAttendanceSession(null)
  }

  useEffect(() => {
    if (isUnlocked) return
    const onKeyDown = (event) => {
      if (event.key >= '0' && event.key <= '9') return addDigit(event.key)
      if (event.key === 'Backspace') return clearLast()
      if (event.key === 'Escape') {
        setPin('')
        setError('')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isUnlocked, pin])

  const openModule = (title) => {
    const key = (title || '').toLowerCase()
    if (key === 'admin' || key === 'administrador') {
      if (!canAccessAdminPanel) {
        alert('Acceso denegado: solo Supervisor o System/Admin pueden entrar a Admin')
        return
      }
      if (isSupervisorUser) {
        setAdminSection('orders')
      }
      setScreen(SCREENS.ADMIN)
      return
    }
    if (key === 'usuarios') {
      setScreen(SCREENS.USERS)
      return
    }
    if (key === 'registro de asistencia') {
      setScreen(SCREENS.ATTENDANCE)
      return
    }
    if (key === 'dashboard' || key === 'systempos') {
      setScreen(SCREENS.DASHBOARD)
      return
    }
    alert(`Modulo ${title} en construccion`)
  }

  const saveOrderEdits = () => {
    setOrders((prev) => prev.map((order) => (order.id === orderDraft.id ? orderDraft : order)))
  }

  const refundSelectedOrder = () => {
    setOrders((prev) =>
      prev.map((order) => (order.id === selectedOrderId ? { ...order, status: 'Reembolsada', note: 'Reembolso aplicado' } : order))
    )
  }

  const saveCustomerEdits = () => {
    setCustomers((prev) => prev.map((customer) => (customer.id === customerDraft.id ? customerDraft : customer)))
  }

  const addActionButton = () => {
    const clean = newActionButton.trim()
    if (!clean) return
    setActionButtons((prev) => [...prev, clean])
    setNewActionButton('')
  }

  const addTopping = () => {
    const clean = newTopping.trim()
    if (!clean) return
    setToppings((prev) => [...prev, clean])
    setNewTopping('')
  }

  const registerEmployee = async () => {
    try {
      const data = await fetchJson('/api/employees', {
        method: 'POST',
        body: JSON.stringify(employeeForm),
      })
      setLastGeneratedPin(data.generatedPin || '')
      setEmployeeForm(INITIAL_EMPLOYEE_FORM)
      await loadEmployees()
      setApiError('')
    } catch (err) {
      setApiError(err.message || 'No se pudo registrar empleado')
    }
  }

  const saveEmployeeEdits = async () => {
    if (!employeeDraft?.id) return
    try {
      await fetchJson(`/api/employees/${employeeDraft.id}`, {
        method: 'PUT',
        body: JSON.stringify(employeeDraft),
      })
      await loadEmployees()
      await loadEmployeeWeeklyHistory(employeeDraft.id)
      setApiError('')
    } catch (err) {
      setApiError(err.message || 'No se pudo guardar empleado')
    }
  }

  const startEditEmployee = (employee) => {
    setSelectedEmployeeId(employee.id)
    setEmployeeDraft(employee)
  }

  const deleteEmployee = async (employeeId) => {
    try {
      await fetchJson(`/api/employees/${employeeId}`, { method: 'DELETE' })
      if (selectedEmployeeId === employeeId) {
        setSelectedEmployeeId('')
        setEmployeeDraft(null)
        setEmployeeWeeklyHistory([])
      }
      await loadEmployees()
      setApiError('')
    } catch (err) {
      setApiError(err.message || 'No se pudo borrar empleado')
    }
  }

  const handleAttendanceConfirm = async () => {
    if (!attendanceSession?.pin) return
    try {
      const data = await fetchJson('/api/attendance/punch', {
        method: 'POST',
        body: JSON.stringify({ pin: attendanceSession.pin }),
      })
      setAttendanceSession((prev) => ({
        ...prev,
        weeklyHistory: data.weeklyHistory || [],
        nextAction: data.action === 'Entrada' ? 'Salida' : 'Entrada',
        statusMessage: data.message || 'Marcacion confirmada',
      }))
      setApiError('')

      // Si confirma entrada o salida, vuelve automaticamente a pantalla de bloqueo.
      if (data.action === 'Entrada' || data.action === 'Salida') {
        setTimeout(() => {
          lockAgain()
        }, 900)
      }
    } catch (err) {
      setApiError(err.message || 'No se pudo confirmar marcacion')
    }
  }

  const filteredEmployees = employees.filter((employee) => {
    const text = `${employee.fullName} ${employee.email} ${employee.role}`.toLowerCase()
    return text.includes(employeeSearch.toLowerCase())
  })

  const attendanceTotalHours = calculateWorkedHours(attendanceSession?.weeklyHistory || [])

  const currentMenu = POS_MENUS[posCategory]
  const isPizzaCategory = posCategory === 'pizza'
  const currentItems = currentMenu ? [...new Set(Object.values(currentMenu.items || {}).flat())] : []
  const categoryToppings = TOPPINGS_BY_CATEGORY[posCategory] || UNIVERSAL_TOPPINGS
  const pizzaLeftToppings = categoryToppings.filter((top) => pizzaToppingsBySide.left.includes(top.id))
  const pizzaRightToppings = categoryToppings.filter((top) => pizzaToppingsBySide.right.includes(top.id))
  const pizzaFullToppings = categoryToppings.filter((top) => pizzaToppingsBySide.full.includes(top.id))
  const pizzaLeftLabels = pizzaLeftToppings.map((top) => top.label)
  const pizzaRightLabels = pizzaRightToppings.map((top) => top.label)
  const pizzaFullLabels = pizzaFullToppings.map((top) => top.label)
  const pizzaProfileSummary = formatPizzaProfile({
    left: pizzaLeftLabels,
    right: pizzaRightLabels,
    full: pizzaFullLabels,
  })
  const selectedCrustData = PIZZA_CRUST_OPTIONS.find((opt) => opt.id === selectedCrust) || PIZZA_CRUST_OPTIONS[0]
  const selectedBakeData = PIZZA_BAKE_OPTIONS.find((opt) => opt.id === selectedBake) || PIZZA_BAKE_OPTIONS[0]
  const pizzaStyleSummary = `${selectedCrustData.label} | ${selectedBakeData.label}`
  const pizzaExtraCost =
    pizzaFullToppings.reduce((sum, top) => sum + top.price, 0) +
    pizzaLeftToppings.reduce((sum, top) => sum + top.price * 0.5, 0) +
    pizzaRightToppings.reduce((sum, top) => sum + top.price * 0.5, 0) +
    selectedCrustData.extra +
    selectedBakeData.extra
  const activeCustomer = useMemo(
    () => posCustomers.find((customer) => customer.phone.trim() === clientPhone.trim()) || null,
    [posCustomers, clientPhone]
  )
  const selectedToppingsPrice = categoryToppings.filter((top) => selectedToppings.includes(top.id)).reduce(
    (sum, top) => sum + top.price,
    0
  )
  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0),
    [cartItems]
  )
  const discountAmount = useMemo(() => {
    return Math.min(cartSubtotal, cartSubtotal * (Number(discountValue || 0) / 100))
  }, [cartSubtotal, discountValue])
  const cartTotal = Math.max(0, cartSubtotal - discountAmount)
  const selectedCodeTokens = useMemo(() => {
    if (!selectedPosItem) return ['SIN_SELECCION']
    const sizeLabel = SIZE_OPTIONS.find((size) => size.id === selectedSize)?.label || 'MEDIANA'
    const tokens = [selectedPosItem.toUpperCase(), `SIZE:${sizeLabel.toUpperCase()}`]

    if (isPizzaCategory) {
      tokens.push(`BORDE:${selectedCrustData.label.toUpperCase()}`)
      tokens.push(`HORNEADO:${selectedBakeData.label.toUpperCase().replace(' ', '_')}`)
      if (pizzaLeftLabels.length) tokens.push(`IZQ:${pizzaLeftLabels.join('+').toUpperCase()}`)
      if (pizzaRightLabels.length) tokens.push(`DER:${pizzaRightLabels.join('+').toUpperCase()}`)
      if (pizzaFullLabels.length) tokens.push(`FULL:${pizzaFullLabels.join('+').toUpperCase()}`)
    } else if (selectedToppings.length) {
      const toppingLabels = categoryToppings
        .filter((top) => selectedToppings.includes(top.id))
        .map((top) => top.label.toUpperCase())
      if (toppingLabels.length) tokens.push(`TOP:${toppingLabels.join('+')}`)
    }

    return tokens.slice(0, 8)
  }, [
    selectedPosItem,
    selectedSize,
    isPizzaCategory,
    selectedCrustData.label,
    selectedBakeData.label,
    pizzaLeftLabels,
    pizzaRightLabels,
    pizzaFullLabels,
    categoryToppings,
    selectedToppings,
  ])
  const sentOrders = savedPosOrders.filter((order) => (order.status || 'Pagada') !== 'Cancelada')
  const cancelledOrders = savedPosOrders.filter((order) => (order.status || '') === 'Cancelada')
  const realtimeOrders = [...savedPosOrders]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 12)

  const toggleTopping = (toppingId) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingId) ? prev.filter((id) => id !== toppingId) : [...prev, toppingId]
    )
  }

  const togglePizzaTopping = (side, toppingId) => {
    setPizzaToppingsBySide((prev) => {
      const current = prev[side] || []
      const next = current.includes(toppingId) ? current.filter((id) => id !== toppingId) : [...current, toppingId]
      return { ...prev, [side]: next }
    })
  }

  const addPosItem = (itemName) => {
    if (!itemName) {
      showPosNotice('Selecciona un producto primero', 1200)
      return
    }
    const basePrice = getItemPrice(posCategory, itemName, selectedSize)
    const toppingLabels = categoryToppings.filter((top) => selectedToppings.includes(top.id)).map((top) => top.label)
    const pizzaProfile =
      posCategory === 'pizza'
        ? {
            left: pizzaLeftLabels,
            right: pizzaRightLabels,
            full: pizzaFullLabels,
          }
        : null
    const unitPrice =
      posCategory === 'pizza' ? Number((basePrice + pizzaExtraCost).toFixed(2)) : Number((basePrice + selectedToppingsPrice).toFixed(2))
    const lineKey =
      posCategory === 'pizza'
        ? `${itemName}-${selectedSize}-${selectedCrust}-${selectedBake}-pizza-${pizzaProfile.left.join('|')}-${pizzaProfile.right.join('|')}-${pizzaProfile.full.join('|')}`
        : `${itemName}-${selectedSize}-full-${toppingLabels.join('|')}`

    setCartItems((prev) => {
      const existing = prev.find((line) => line.lineKey === lineKey)
      if (existing) return prev.map((line) => (line.lineKey === lineKey ? { ...line, qty: line.qty + 1 } : line))
      return [
        ...prev,
        {
          lineKey,
          itemName,
          category: posCategory,
          size: selectedSize,
          crust: posCategory === 'pizza' ? selectedCrust : '',
          bake: posCategory === 'pizza' ? selectedBake : '',
          mode: 'full',
          pizzaProfile,
          toppings: toppingLabels,
          qty: 1,
          unitPrice,
        },
      ]
    })
    setSelectedPosItem('')
    setSelectedToppings([])
    setPizzaToppingsBySide({ left: [], right: [], full: [] })
    setShowToppingsMenu(false)
    setSelectedSize('medium')
    setSelectedCrust('regular')
    setSelectedBake('normal')
    setPizzaConfigLocked({ size: false, crust: false, bake: false })
    showPosNotice(`${itemName} agregado`, 500)
  }

  const updateLineQty = (lineKey, delta) => {
    setCartItems((prev) =>
      prev
        .map((line) => (line.lineKey === lineKey ? { ...line, qty: Math.max(0, line.qty + delta) } : line))
        .filter((line) => line.qty > 0)
    )
  }

  const removeLine = (lineKey) => {
    setCartItems((prev) => prev.filter((line) => line.lineKey !== lineKey))
  }

  const addNoteToLine = (lineKey) => {
    const line = cartItems.find((item) => item.lineKey === lineKey)
    if (!line) return
    setNoteLineKey(lineKey)
    setNoteDraft(line.note || '')
  }

  const saveLineNote = () => {
    if (!noteLineKey) return
    setCartItems((prev) =>
      prev.map((item) => (item.lineKey === noteLineKey ? { ...item, note: String(noteDraft).trim() } : item))
    )
    setNoteLineKey('')
    setNoteDraft('')
  }

  const applyLineToConfigurator = (line) => {
    setSelectedPosItem(line.itemName || '')
    setSelectedSize(line.size || 'medium')
    setSelectedCrust(line.crust || 'regular')
    setSelectedBake(line.bake || 'normal')
    if (line.category === 'pizza') {
      const left = mapLabelsToToppingIds('pizza', line.pizzaProfile?.left || [])
      const right = mapLabelsToToppingIds('pizza', line.pizzaProfile?.right || [])
      const full = mapLabelsToToppingIds('pizza', line.pizzaProfile?.full || [])
      setPizzaToppingsBySide({ left, right, full })
      setSelectedToppings([])
      setShowToppingsMenu(true)
      setPizzaConfigLocked({ size: true, crust: true, bake: true })
      return
    }
    setSelectedToppings(mapLabelsToToppingIds(line.category, line.toppings || []))
    setPizzaToppingsBySide({ left: [], right: [], full: [] })
    setShowToppingsMenu((line.toppings || []).length > 0)
    setPizzaConfigLocked({ size: false, crust: false, bake: false })
  }

  const editLineItem = (lineKey) => {
    const line = cartItems.find((item) => item.lineKey === lineKey)
    if (!line) return
    setCartItems((prev) => prev.filter((item) => item.lineKey !== lineKey))
    if (posCategory === line.category) {
      applyLineToConfigurator(line)
    } else {
      setPosCategory(line.category)
      setTimeout(() => applyLineToConfigurator(line), 0)
    }
    showPosNotice('Articulo cargado para editar', 1100)
  }

  const addOrUpdateCustomer = () => {
    const phone = clientPhone.trim()
    const name = clientName.trim()
    const address = clientAddress.trim()
    if (!phone || !name) return

    setPosCustomers((prev) => {
      const exists = prev.some((customer) => customer.phone === phone)
      if (exists) {
        return prev.map((customer) => (customer.phone === phone ? { ...customer, name, address } : customer))
      }
      return [...prev, { id: `CUS-${Date.now()}`, name, phone, address, points: 0 }]
    })
    showPosNotice('Cliente guardado', 1200)
    setClientLookupStatus('found')
    setClientLookupMessage(`Cliente listo: ${name}`)
    setShowClientPanel(false)
  }

  const searchCustomerByPhone = () => {
    const phone = clientPhone.trim()
    if (!phone) {
      setClientLookupStatus('idle')
      setClientLookupMessage('Ingresa un numero para buscar')
      return
    }
    const found = posCustomers.find((customer) => customer.phone.trim() === phone)
    if (!found) {
      setClientName('')
      setClientAddress('')
      setClientLookupStatus('not_found')
      setClientLookupMessage('Cliente no se encuentra registrado')
      setShowClientPanel(false)
      return
    }

    setClientName(found.name)
    setClientAddress(found.address || '')
    setClientLookupStatus('found')
    setClientLookupMessage(`Cliente encontrado: ${found.name}`)
    setShowClientPanel(false)
  }

  const resetOrderDraft = () => {
    setCartItems([])
    setDiscountValue(0)
    setEditingPosOrderId('')
    setSelectedPosOrderId('')
    setSelectedToppings([])
    setPizzaToppingsBySide({ left: [], right: [], full: [] })
    setSelectedPosItem('')
    setSelectedSize('medium')
    setSelectedCrust('regular')
    setSelectedBake('normal')
    setPizzaConfigLocked({ size: false, crust: false, bake: false })
    setServiceMode('takeaway')
    setClientName('')
    setClientPhone('')
    setClientAddress('')
    setClientLookupStatus('idle')
    setClientLookupMessage('')
    setShowPhoneSearch(false)
    setShowClientPanel(false)
    setShowDiscountMenu(false)
    setPendingDeleteOrderId('')
    setNoteLineKey('')
    setNoteDraft('')
  }

  const savePosOrder = async () => {
    if (!cartItems.length) return
    const isEditing = Boolean(editingPosOrderId)
    const payload = {
      id: isEditing ? editingPosOrderId : `ORD-${orderNumber}`,
      number: orderNumber,
      customerName: clientName.trim() || activeCustomer?.name || 'Consumidor final',
      customerPhone: clientPhone.trim() || '-',
      serviceMode,
      lines: cartItems,
      subtotal: cartSubtotal,
      discount: discountAmount,
      total: cartTotal,
      status: 'Pagada',
      payment: 'Pendiente',
      note: '',
      createdAt: new Date().toISOString(),
    }

    try {
      let savedOrder = null
      if (isEditing) {
        const response = await fetchJson(`/api/orders/${encodeURIComponent(editingPosOrderId)}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        savedOrder = response?.order || payload
      } else {
        const response = await fetchJson('/api/orders', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        savedOrder = response?.order || payload
      }
      setSavedPosOrders((prev) => {
        if (isEditing) return prev.map((order) => (order.id === savedOrder.id ? savedOrder : order))
        const rest = prev.filter((order) => order.id !== savedOrder.id)
        return [savedOrder, ...rest]
      })
      setOrders((prev) => {
        const mapped = toAdminOrder(savedOrder)
        if (isEditing) return prev.map((order) => (order.id === mapped.id ? mapped : order))
        return [mapped, ...prev.filter((order) => order.id !== mapped.id)]
      })
      await loadPosOrders().catch(() => {})
      setApiError('')
      setRecentSentOrder(savedOrder)
      setSelectedPosOrderId(savedOrder.id)
    } catch (err) {
      setApiError(err.message || 'No se pudo guardar la orden')
      showPosNotice('No se pudo enviar la orden', 1500)
      return
    }

    if (clientPhone.trim() && !isEditing) {
      const phone = clientPhone.trim()
      const name = clientName.trim() || activeCustomer?.name || 'Cliente'
      setPosCustomers((prev) => {
        const found = prev.find((customer) => customer.phone === phone)
        if (!found) return [...prev, { id: `CUS-${Date.now()}`, name, phone, points: 1 }]
        return prev.map((customer) =>
          customer.phone === phone ? { ...customer, name, points: (customer.points || 0) + 1 } : customer
        )
      })
    }

    showPosNotice(isEditing ? 'Orden editada y enviada' : 'Orden enviada', 1200)
    if (!isEditing) setOrderNumber((prev) => prev + 1)
    resetOrderDraft()
  }

  const handleSaveOrderClick = (event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    savePosOrder()
  }

  const printPosOrder = () => {
    if (!cartItems.length) return
    showPosNotice(`Orden ${orderNumber} enviada a impresion`, 1200)
    setOrderNumber((prev) => prev + 1)
    resetOrderDraft()
  }

  const editPosOrder = (orderId) => {
    const order = savedPosOrders.find((row) => row.id === orderId)
    if (!order) return
    setEditingPosOrderId(order.id)
    setSelectedPosOrderId(order.id)
    setOrderNumber(order.number)
    setClientName(order.customerName === 'Consumidor final' ? '' : order.customerName)
    setClientPhone(order.customerPhone === '-' ? '' : order.customerPhone)
    setServiceMode(order.serviceMode || 'takeaway')
    const customer = posCustomers.find((entry) => entry.phone === order.customerPhone)
    setClientAddress(customer?.address || '')
    setCartItems(order.lines || [])
    setDiscountValue(Number(order.discount || 0))
    showPosNotice(`Editando orden ${order.number}`, 1000)
    setShowOrdersPanel(false)
  }

  const deletePosOrder = async (orderId) => {
    try {
      await fetchJson(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Cancelada', updatedAt: new Date().toISOString() }),
      })
      await loadPosOrders()
    } catch (err) {
      setApiError(err.message || 'No se pudo borrar la orden')
      return
    }
    if (selectedPosOrderId === orderId || editingPosOrderId === orderId) resetOrderDraft()
    setPendingDeleteOrderId('')
    showPosNotice('Orden cancelada', 1200)
  }

  return (
    <main className={`lockscreen ${isLightMode ? 'theme-off' : 'theme-dark'}`}>
      <div className="overlay" />

      <button
        type="button"
        className={`theme-switch ${isLightMode ? 'off' : 'on'}`}
        onClick={() => setIsLightMode((prev) => !prev)}
        aria-label={`Cambiar a modo ${isLightMode ? 'oscuro' : 'claro'}`}
        aria-pressed={isLightMode}
      >
        {isLightMode ? 'Modo oscuro' : 'Modo claro'}
      </button>

      <section className={`content ${error ? 'shake' : ''} ${isUnlocked ? 'is-unlocked' : ''}`}>
        <p className="date">{dateText}</p>
        <h1 className="time">{timeText}</h1>

        {isUnlocked ? (
          screen === SCREENS.SELECTION ? (
            <section className="selection-panel" aria-label="Panel de seleccion">
              <header className="selection-header">
                <h2><span className="brand-micros">SystemPOS</span><span className="brand-sub">MICROS STYLE</span></h2>
                <p>Acceso rapido por perfil operativo</p>
              </header>
              <div className="selection-grid">
                {ROLE_CARDS.map((card) => (
                  <button key={card.title} type="button" className="selection-card" onClick={() => openModule(card.title)}>
                    <h3>
                      <span className="card-icon">{card.icon}</span>
                      {card.title}
                    </h3>
                    <p>{card.detail}</p>
                  </button>
                ))}
              </div>
              <button className="action-btn" onClick={lockAgain} type="button">
                Cerrar sesion
              </button>
            </section>
          ) : screen === SCREENS.ADMIN ? (
            <section className="admin-panel" aria-label="Panel administrador">
              <header className="admin-header">
                <div>
                  <h2>SystemPOS MICROS Admin</h2>
                  <p>Actualizacion: {now.toLocaleTimeString('es-AR')}</p>
                </div>
                <div className="admin-actions">
                  <button type="button" className="small-btn" onClick={() => setScreen(SCREENS.SELECTION)}>
                    Volver
                  </button>
                  <button type="button" className="small-btn danger" onClick={lockAgain}>
                    Salir
                  </button>
                </div>
              </header>

              {apiError ? <p className="api-error">{apiError}</p> : null}

              <div className="admin-layout">
                <aside className={`admin-menu ${isMenuCollapsed ? 'collapsed' : ''}`}>
                  <button type="button" className="menu-toggle" onClick={() => setIsMenuCollapsed((prev) => !prev)}>
                    {isMenuCollapsed ? '>>' : '<<'} Menu
                  </button>
                  <nav className="menu-list">
                    {adminMenu.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={`menu-item ${adminSection === item.key ? 'active' : ''}`}
                        onClick={() => setAdminSection(item.key)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </nav>
                </aside>

                <section className="admin-main">
                  <div className="priority-strip">
                    <article className="priority-card">
                      <p>Ventas del dia</p>
                      <strong>{toMoney(summary.sales)}</strong>
                    </article>
                    <article className="priority-card">
                      <p>Promociones</p>
                      <strong>{toMoney(summary.promos)}</strong>
                    </article>
                    <article className="priority-card">
                      <p>Gastos</p>
                      <strong>{toMoney(summary.expenses)}</strong>
                    </article>
                    <article className="priority-card">
                      <p>Tendencia</p>
                      <strong className={trendDirection >= 0 ? 'up' : 'down'}>
                        {trendDirection >= 0 ? '+' : '-'}
                        {Math.abs(trendDirection)}
                      </strong>
                    </article>
                  </div>

                  <div className="top-graphs">
                    <article className="graph-card">
                      <h3>Subidas/Bajadas en vivo</h3>
                      <div className="live-chart">
                        {liveTrend.map((point, idx) => {
                          const prev = liveTrend[idx - 1] ?? point
                          const direction = point >= prev ? 'up' : 'down'
                          return <div key={`${point}-${idx}`} className={`live-bar ${direction}`} style={{ height: `${point}%` }} />
                        })}
                      </div>
                    </article>
                    <article className="graph-card">
                      <h3>Ventas vs Gastos</h3>
                      <div className="history-chart">
                        {historyRows.slice(-10).map((row) => (
                          <div key={row.label} className="history-bar-group">
                            <div className="bar sales" style={{ height: `${Math.min(100, row.sales / 20)}%` }} />
                            <div className="bar expenses" style={{ height: `${Math.min(100, row.expenses / 20)}%` }} />
                            <span>{row.label}</span>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>

                  {adminSection === 'overview' ? (
                    <section className="admin-body">
                      <h3>Resumen Operativo</h3>
                      <div className="kpi-grid">
                        <article className="kpi-card">
                          <p>Desarrollo del dia</p>
                          <strong>{Number(summary.progress || 0).toFixed(1)}%</strong>
                        </article>
                        <article className="kpi-card">
                          <p>Descuentos</p>
                          <strong>{toMoney(summary.discounts)}</strong>
                        </article>
                        <article className="kpi-card">
                          <p>Ordenes activas</p>
                          <strong>{orders.filter((order) => order.status !== 'Reembolsada').length}</strong>
                        </article>
                        <article className="kpi-card">
                          <p>Registros del dia</p>
                          <strong>{todayRows.length}</strong>
                        </article>
                      </div>
                    </section>
                  ) : null}

                  {adminSection === 'orders' ? (
                    <section className="admin-body split-area">
                      <article className="panel-block">
                        <h3>Historial de ordenes</h3>
                        <div className="list-box">
                          {orders.map((order) => (
                            <button
                              key={order.id}
                              type="button"
                              className={`list-row ${selectedOrderId === order.id ? 'active' : ''}`}
                              onClick={() => setSelectedOrderId(order.id)}
                            >
                              <span>{order.id}</span>
                              <span>{order.customer}</span>
                              <span>{toMoney(order.total)}</span>
                              <span>{order.status}</span>
                            </button>
                          ))}
                        </div>
                      </article>
                      <article className="panel-block">
                        <h3>Editar orden / Reembolso</h3>
                        <div className="form-grid">
                          <label>
                            Cliente
                            <input
                              value={orderDraft.customer || ''}
                              disabled={isSupervisorUser}
                              onChange={(event) => setOrderDraft((prev) => ({ ...prev, customer: event.target.value }))}
                            />
                          </label>
                          <label>
                            Total
                            <input
                              type="number"
                              value={orderDraft.total || 0}
                              disabled={isSupervisorUser}
                              onChange={(event) =>
                                setOrderDraft((prev) => ({ ...prev, total: Number(event.target.value || 0) }))
                              }
                            />
                          </label>
                          <label>
                            Estado
                            <select
                              value={orderDraft.status || 'Pagada'}
                              disabled={isSupervisorUser}
                              onChange={(event) => setOrderDraft((prev) => ({ ...prev, status: event.target.value }))}
                            >
                              <option>Pagada</option>
                              <option>En cocina</option>
                              <option>Pendiente</option>
                              <option>Reembolsada</option>
                            </select>
                          </label>
                          <label>
                            Forma de pago
                            <select
                              value={orderDraft.payment || 'Efectivo'}
                              disabled={isSupervisorUser}
                              onChange={(event) => setOrderDraft((prev) => ({ ...prev, payment: event.target.value }))}
                            >
                              <option>Efectivo</option>
                              <option>Tarjeta</option>
                              <option>Transferencia</option>
                            </select>
                          </label>
                          <label className="wide">
                            Nota
                            <input
                              value={orderDraft.note || ''}
                              disabled={isSupervisorUser}
                              onChange={(event) => setOrderDraft((prev) => ({ ...prev, note: event.target.value }))}
                            />
                          </label>
                        </div>
                        <div className="button-row">
                          {!isSupervisorUser ? (
                            <button type="button" className="small-btn" onClick={saveOrderEdits}>
                              Guardar cambios
                            </button>
                          ) : null}
                          <button type="button" className="small-btn danger" onClick={refundSelectedOrder}>
                            Devolver dinero
                          </button>
                        </div>
                      </article>
                    </section>
                  ) : null}

                  {adminSection === 'customers' ? (
                    <section className="admin-body split-area">
                      <article className="panel-block">
                        <h3>Clientes guardados</h3>
                        <div className="list-box">
                          {customers.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              className={`list-row ${selectedCustomerId === customer.id ? 'active' : ''}`}
                              onClick={() => setSelectedCustomerId(customer.id)}
                            >
                              <span>{customer.name}</span>
                              <span>{customer.phone}</span>
                              <span>{customer.payment}</span>
                            </button>
                          ))}
                        </div>
                      </article>
                      <article className="panel-block">
                        <h3>Editar cliente</h3>
                        <div className="form-grid">
                          <label>
                            Nombre
                            <input
                              value={customerDraft.name || ''}
                              onChange={(event) => setCustomerDraft((prev) => ({ ...prev, name: event.target.value }))}
                            />
                          </label>
                          <label>
                            Telefono
                            <input
                              value={customerDraft.phone || ''}
                              onChange={(event) => setCustomerDraft((prev) => ({ ...prev, phone: event.target.value }))}
                            />
                          </label>
                          <label className="wide">
                            Direccion
                            <input
                              value={customerDraft.address || ''}
                              onChange={(event) => setCustomerDraft((prev) => ({ ...prev, address: event.target.value }))}
                            />
                          </label>
                          <label>
                            Forma de pago
                            <select
                              value={customerDraft.payment || 'Efectivo'}
                              onChange={(event) => setCustomerDraft((prev) => ({ ...prev, payment: event.target.value }))}
                            >
                              <option>Efectivo</option>
                              <option>Tarjeta</option>
                              <option>Transferencia</option>
                            </select>
                          </label>
                        </div>
                        <div className="button-row">
                          <button type="button" className="small-btn" onClick={saveCustomerEdits}>
                            Guardar cliente
                          </button>
                        </div>
                      </article>
                    </section>
                  ) : null}

                  {adminSection === 'builder' ? (
                    <section className="admin-body split-area">
                      <article className="panel-block">
                        <h3>Botones rapidos del POS</h3>
                        <div className="chip-list">
                          {actionButtons.map((item) => (
                            <div key={item} className="chip">
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() => setActionButtons((prev) => prev.filter((label) => label !== item))}
                              >
                                X
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="inline-form">
                          <input value={newActionButton} onChange={(event) => setNewActionButton(event.target.value)} placeholder="Nuevo boton" />
                          <button type="button" onClick={addActionButton}>
                            Agregar
                          </button>
                        </div>
                      </article>
                      <article className="panel-block">
                        <h3>Toppings extra</h3>
                        <div className="chip-list">
                          {toppings.map((item) => (
                            <div key={item} className="chip">
                              <span>{item}</span>
                              <button type="button" onClick={() => setToppings((prev) => prev.filter((label) => label !== item))}>
                                X
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="inline-form">
                          <input value={newTopping} onChange={(event) => setNewTopping(event.target.value)} placeholder="Nuevo topping" />
                          <button type="button" onClick={addTopping}>
                            Agregar
                          </button>
                        </div>
                      </article>
                    </section>
                  ) : null}

                  {adminSection === 'history' ? (
                    <section className="admin-body table-wrap">
                      <div className="period-row">
                        {HISTORY_PERIODS.map((period) => (
                          <button
                            key={period}
                            type="button"
                            className={`period-btn ${historyPeriod === period ? 'active' : ''}`}
                            onClick={() => setHistoryPeriod(period)}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                      <table>
                        <thead>
                          <tr>
                            <th>Periodo</th>
                            <th>Ventas</th>
                            <th>Promos</th>
                            <th>Descuentos</th>
                            <th>Gastos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyRows.map((row) => (
                            <tr key={row.label}>
                              <td>{row.label}</td>
                              <td>{toMoney(row.sales)}</td>
                              <td>{toMoney(row.promos)}</td>
                              <td>{toMoney(row.discounts)}</td>
                              <td>{toMoney(row.expenses)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>
                  ) : null}
                </section>
              </div>
            </section>
          ) : screen === SCREENS.DASHBOARD ? (
            <section className="admin-panel" aria-label="Dashboard POS">
              <header className="admin-header">
                <div>
                  <h2>SystemPOS MICROS</h2>
                  <p>Interfaz tactil de alta resolucion con menus y submenus</p>
                </div>
                <div className="admin-actions">
                  <button type="button" className="small-btn" onClick={() => setScreen(SCREENS.SELECTION)}>
                    Volver
                  </button>
                  <button type="button" className="small-btn danger" onClick={lockAgain}>
                    Salir
                  </button>
                </div>
              </header>
              {apiError ? <p className="api-error">{apiError}</p> : null}

              <section className="dashboard-shell">
                <aside className="dashboard-menu">
                  {Object.entries(POS_MENUS).map(([key, menu]) => (
                    <button
                      key={key}
                      type="button"
                      className={`dash-menu-btn ${posCategory === key ? 'active' : ''}`}
                      style={{ '--menu-color': menu.color }}
                      onClick={() => setPosCategory(key)}
                    >
                      <span className="dash-icon">{menu.icon}</span>
                      <span>{menu.label}</span>
                    </button>
                  ))}
                </aside>

                <div className="dashboard-main">
                  <div className="pos-workspace">
                    <div className="pos-catalog">
                      {isPizzaCategory && selectedPosItem ? (
                        <div className="pizza-quick-config">
                          <div className="config-row">
                            <span>Tamano</span>
                            {pizzaConfigLocked.size ? (
                              <button type="button" className="mini-config-btn active static">
                                {SIZE_OPTIONS.find((size) => size.id === selectedSize)?.label || 'Mediana'}
                              </button>
                            ) : (
                              SIZE_OPTIONS.map((size) => (
                                <button
                                  key={size.id}
                                  type="button"
                                  className={`mini-config-btn ${selectedSize === size.id ? 'active' : ''}`}
                                  onClick={() => {
                                    setSelectedSize(size.id)
                                    setPizzaConfigLocked((prev) => ({ ...prev, size: true }))
                                  }}
                                >
                                  {size.label}
                                </button>
                              ))
                            )}
                          </div>
                          <div className="config-row">
                            <span>Borde</span>
                            {pizzaConfigLocked.crust ? (
                              <button type="button" className="mini-config-btn active static">
                                {PIZZA_CRUST_OPTIONS.find((crust) => crust.id === selectedCrust)?.label || 'Regular'}
                              </button>
                            ) : (
                              PIZZA_CRUST_OPTIONS.map((crust) => (
                                <button
                                  key={crust.id}
                                  type="button"
                                  className={`mini-config-btn ${selectedCrust === crust.id ? 'active' : ''}`}
                                  onClick={() => {
                                    setSelectedCrust(crust.id)
                                    setPizzaConfigLocked((prev) => ({ ...prev, crust: true }))
                                  }}
                                >
                                  {crust.label}
                                </button>
                              ))
                            )}
                          </div>
                          <div className="config-row">
                            <span>Horneado</span>
                            {pizzaConfigLocked.bake ? (
                              <button type="button" className="mini-config-btn active static">
                                {PIZZA_BAKE_OPTIONS.find((bake) => bake.id === selectedBake)?.label || 'Normal'}
                              </button>
                            ) : (
                              PIZZA_BAKE_OPTIONS.map((bake) => (
                                <button
                                  key={bake.id}
                                  type="button"
                                  className={`mini-config-btn ${selectedBake === bake.id ? 'active' : ''}`}
                                  onClick={() => {
                                    setSelectedBake(bake.id)
                                    setPizzaConfigLocked((prev) => ({ ...prev, bake: true }))
                                  }}
                                >
                                  {bake.label}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      ) : null}

                      <div className="item-grid">
                        {currentItems.map((item) => (
                          <button
                            key={item}
                            type="button"
                            className={`item-btn ${selectedPosItem === item ? 'active' : ''}`}
                            style={{ '--item-color': currentMenu.color }}
                            onClick={() => setSelectedPosItem(item)}
                          >
                            <span>{item}</span>
                            <small>{toMoney(getItemPrice(posCategory, item, selectedSize))}</small>
                          </button>
                        ))}
                      </div>

                      <div className={`selection-action-row ${isSelectionIdle ? 'idle-motion' : ''}`}>
                        <div className="selected-preview-panel">
                          <div className="selected-preview-head">
                            <div className="selected-title-row">
                              <span className="selected-inline-icon">{selectedPosItem ? getProductIcon(posCategory, selectedPosItem) : '🎯'}</span>
                              <strong className="selected-title">Seleccionado</strong>
                            </div>
                            <p>
                              {selectedPosItem ? `${SIZE_OPTIONS.find((size) => size.id === selectedSize)?.label}` : 'Sin seleccion'}
                              {isPizzaCategory && selectedPosItem ? ` | ${pizzaStyleSummary}` : ''}
                              {!isPizzaCategory && selectedToppings.length ? ` | Extras: ${toMoney(selectedToppingsPrice)}` : ''}
                            </p>
                          </div>
                          <div className="selected-code-grid">
                            {selectedCodeTokens.map((token, index) => (
                              <span key={`${token}-${index}`} className="selected-code-chip">
                                {token}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button type="button" className="small-btn add-cart-btn" onClick={() => addPosItem(selectedPosItem)}>
                          Agregar a carrito
                        </button>
                      </div>

                      <button type="button" className="small-btn" onClick={() => setShowToppingsMenu((prev) => !prev)}>
                        Toppings
                      </button>

                      {isPizzaCategory && showToppingsMenu ? (
                        <section className="pizza-mode-box">
                          <h3>Pizza personalizada por seccion</h3>
                          <div className="pizza-builder-grid">
                            <article className="pizza-side-card">
                              <h4>◖ Mitad izquierda</h4>
                              <div className="toppings-grid side">
                                {categoryToppings.map((topping) => (
                                  <button
                                    key={`left-${topping.id}`}
                                    type="button"
                                    className={`topping-btn ${pizzaToppingsBySide.left.includes(topping.id) ? 'active' : ''}`}
                                    style={{ '--topping-color': topping.color }}
                                    onClick={() => togglePizzaTopping('left', topping.id)}
                                    title={topping.label}
                                  >
                                    <span className="topping-icon">{topping.icon}</span>
                                    <span className="topping-label">
                                      {topping.label} +{toMoney(topping.price)}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </article>
                            <article className="pizza-side-card">
                              <h4>◗ Mitad derecha</h4>
                              <div className="toppings-grid side">
                                {categoryToppings.map((topping) => (
                                  <button
                                    key={`right-${topping.id}`}
                                    type="button"
                                    className={`topping-btn ${pizzaToppingsBySide.right.includes(topping.id) ? 'active' : ''}`}
                                    style={{ '--topping-color': topping.color }}
                                    onClick={() => togglePizzaTopping('right', topping.id)}
                                    title={topping.label}
                                  >
                                    <span className="topping-icon">{topping.icon}</span>
                                    <span className="topping-label">
                                      {topping.label} +{toMoney(topping.price)}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </article>
                            <article className="pizza-side-card full">
                              <h4>● Completa</h4>
                              <div className="toppings-grid side">
                                {categoryToppings.map((topping) => (
                                  <button
                                    key={`full-${topping.id}`}
                                    type="button"
                                    className={`topping-btn ${pizzaToppingsBySide.full.includes(topping.id) ? 'active' : ''}`}
                                    style={{ '--topping-color': topping.color }}
                                    onClick={() => togglePizzaTopping('full', topping.id)}
                                    title={topping.label}
                                  >
                                    <span className="topping-icon">{topping.icon}</span>
                                    <span className="topping-label">
                                      {topping.label} +{toMoney(topping.price)}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </article>
                          </div>
                          <p className="pizza-builder-summary">
                            Extra toppings pizza: {toMoney(pizzaExtraCost)}
                          </p>
                        </section>
                      ) : null}

                      {!isPizzaCategory && showToppingsMenu ? (
                        <section className="toppings-box">
                          <h3>Toppings con iconos</h3>
                          <div className="toppings-grid">
                            {categoryToppings.map((topping) => (
                              <button
                                key={topping.id}
                                type="button"
                                className={`topping-btn ${selectedToppings.includes(topping.id) ? 'active' : ''}`}
                                style={{ '--topping-color': topping.color }}
                                onClick={() => toggleTopping(topping.id)}
                                title={topping.label}
                              >
                                <span className="topping-icon">{topping.icon}</span>
                                <span className="topping-label">
                                  {topping.label} +{toMoney(topping.price)}
                                </span>
                              </button>
                            ))}
                          </div>
                        </section>
                      ) : null}
                    </div>

                    <aside className="order-panel">
                      <header className="order-header">
                        <h3>Orden #{orderNumber}</h3>
                        <span>
                          {editingPosOrderId ? 'Editando' : 'Nueva'} | {getServiceModeLabel(serviceMode)}
                        </span>
                      </header>
                      <label className="client-name-inline top">
                        Nombre del cliente
                        <input
                          className="client-name-input-compact"
                          value={clientName}
                          onChange={(event) => setClientName(event.target.value)}
                          placeholder="Ej: Eduardo"
                        />
                      </label>

                      <div className="order-client">
                        {clientLookupMessage ? (
                          <p className={`client-lookup-message ${clientLookupStatus === 'not_found' ? 'warn' : 'ok'}`}>
                            {clientLookupMessage}
                          </p>
                        ) : null}
                        {showClientPanel ? (
                          <div className="client-panel">
                            <label>
                              Nombre
                              <input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Nombre cliente" />
                            </label>
                            <label>
                              Numero
                              <input value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} placeholder="305-555-0101" />
                            </label>
                            <label>
                              Direccion
                              <input value={clientAddress} onChange={(event) => setClientAddress(event.target.value)} placeholder="Direccion" />
                            </label>
                            <div className="client-panel-actions">
                              <button type="button" className="small-btn" onClick={addOrUpdateCustomer}>
                                Guardar
                              </button>
                              <button type="button" className="small-btn" onClick={() => setShowClientPanel(false)}>
                                Cerrar
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="order-lines">
                        {cartItems.length ? (
                          cartItems.map((line) => (
                            <div key={line.lineKey} className="order-line">
                              <div>
                                <div className="line-head">
                                  <strong>{line.itemName}</strong>
                                  <div className="line-mini-actions">
                                    <button type="button" className="line-mini-btn" title="Agregar nota" onClick={() => addNoteToLine(line.lineKey)}>
                                      📝
                                    </button>
                                    <button type="button" className="line-mini-btn" title="Editar articulo" onClick={() => editLineItem(line.lineKey)}>
                                      ✏️
                                    </button>
                                  </div>
                                </div>
                                <p>
                                  {line.size ? `${SIZE_OPTIONS.find((size) => size.id === line.size)?.label} | ` : ''}
                                  {line.category === 'pizza'
                                    ? `${line.crust ? `${PIZZA_CRUST_OPTIONS.find((item) => item.id === line.crust)?.label || 'Regular'} | ` : ''}${
                                        line.bake ? `${PIZZA_BAKE_OPTIONS.find((item) => item.id === line.bake)?.label || 'Normal'} | ` : ''
                                      }${formatPizzaProfile(line.pizzaProfile)}`
                                    : line.category}
                                  {line.category !== 'pizza' && line.toppings.length ? ` + ${line.toppings.join(', ')}` : ''}
                                </p>
                                {line.note ? <p className="line-note">Nota: {line.note}</p> : null}
                                <p>
                                  x{line.qty} @ {toMoney(line.unitPrice)}
                                </p>
                              </div>
                              <div className="line-actions">
                                <button type="button" onClick={() => updateLineQty(line.lineKey, -1)}>
                                  -
                                </button>
                                <span>{line.qty}</span>
                                <button type="button" onClick={() => updateLineQty(line.lineKey, 1)}>
                                  +
                                </button>
                                <button type="button" onClick={() => removeLine(line.lineKey)}>
                                  X
                                </button>
                              </div>
                              <strong>{toMoney(line.qty * line.unitPrice)}</strong>
                            </div>
                          ))
                        ) : (
                          <p className="empty-order">Sin productos en esta orden</p>
                        )}
                      </div>

                      {noteLineKey ? (
                        <div className="line-note-panel">
                          <p>Nota del articulo</p>
                          <textarea
                            value={noteDraft}
                            onChange={(event) => setNoteDraft(event.target.value)}
                            placeholder="Escribe la nota aqui..."
                          />
                          <div className="line-note-actions">
                            <button type="button" className="small-btn" onClick={saveLineNote}>
                              Guardar
                            </button>
                            <button
                              type="button"
                              className="small-btn"
                              onClick={() => {
                                setNoteLineKey('')
                                setNoteDraft('')
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="order-footer">
                        <div className="total-box">
                          <p>Servicio: {getServiceModeLabel(serviceMode)}</p>
                          <p>Subtotal: {toMoney(cartSubtotal)}</p>
                          <p>Descuento: -{toMoney(discountAmount)}</p>
                          <strong>Total: {toMoney(cartTotal)}</strong>
                        </div>

                        <div className="order-actions">
                          <button type="button" className="small-btn" onClick={handleSaveOrderClick}>
                            Enviar
                          </button>
                          <button type="button" className="small-btn" onClick={printPosOrder}>
                            Print
                          </button>
                          <button type="button" className="small-btn" onClick={() => setShowOrdersPanel((prev) => !prev)}>
                            Ordenes
                          </button>
                          <button
                            type="button"
                            className="small-btn danger"
                            onClick={() => selectedPosOrderId && setPendingDeleteOrderId(selectedPosOrderId)}
                          >
                            Eliminar orden
                          </button>
                        </div>

                        <div className="order-tools-row">
                          <button
                            type="button"
                            className="search-icon-btn client-toggle-btn"
                            onClick={() => setShowPhoneSearch((prev) => !prev)}
                            title="Buscar cliente"
                            aria-label="Buscar cliente"
                          >
                            🔍
                          </button>
                          {clientLookupStatus === 'not_found' ? (
                            <button
                              type="button"
                              className="plus-icon-btn"
                              title="Agregar cliente"
                              aria-label="Agregar cliente"
                              onClick={() => setShowClientPanel((prev) => !prev)}
                            >
                              +
                            </button>
                          ) : null}
                          <div className="service-mode-row">
                            {SERVICE_MODES.map((mode) => (
                              <button
                                key={mode.id}
                                type="button"
                                className={`service-mode-btn ${serviceMode === mode.id ? 'active' : ''}`}
                                onClick={() => setServiceMode(mode.id)}
                                title={mode.label}
                                aria-label={mode.label}
                              >
                                {mode.icon}
                              </button>
                            ))}
                          </div>
                        </div>

                        {showPhoneSearch ? (
                          <div className="search-row">
                            <input
                              value={clientPhone}
                              onChange={(event) => setClientPhone(event.target.value)}
                              placeholder="305-555-0101"
                            />
                            <button type="button" className="search-icon-btn" onClick={searchCustomerByPhone}>
                              🔍
                            </button>
                          </div>
                        ) : null}

                        <div className="discount-row">
                          <button
                            type="button"
                            className="discount-icon-btn"
                            title="Descuento porcentual"
                            onClick={() => setShowDiscountMenu((prev) => !prev)}
                          >
                            % {discountValue}
                          </button>
                        </div>

                        {showDiscountMenu ? (
                          <div className="discount-menu">
                            <div className="search-row">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={discountValue}
                                onChange={(event) => setDiscountValue(Number(event.target.value || 0))}
                                placeholder="0 - 100"
                              />
                              <button type="button" className="small-btn" onClick={() => setShowDiscountMenu(false)}>
                                OK
                              </button>
                            </div>
                            {DISCOUNT_PRESETS.map((percent) => (
                              <button
                                key={percent}
                                type="button"
                                className={`discount-chip ${discountValue === percent ? 'active' : ''}`}
                                onClick={() => {
                                  setDiscountValue(percent)
                                  setShowDiscountMenu(false)
                                }}
                              >
                                {percent}%
                              </button>
                            ))}
                          </div>
                        ) : null}

                        {pendingDeleteOrderId ? (
                          <div className="delete-confirm">
                            <p>Seguro que deseas eliminar esta orden?</p>
                            <div className="delete-confirm-actions">
                              <button type="button" className="small-btn danger" onClick={() => deletePosOrder(pendingDeleteOrderId)}>
                                Si
                              </button>
                              <button type="button" className="small-btn" onClick={() => setPendingDeleteOrderId('')}>
                                No
                              </button>
                            </div>
                          </div>
                        ) : null}

                        {posNotice ? <p className="success-note">{posNotice}</p> : null}
                        {recentSentOrder ? (
                          <button
                            type="button"
                            className="recent-sent-toast"
                            onClick={() => {
                              editPosOrder(recentSentOrder.id)
                              setRecentSentOrder(null)
                            }}
                          >
                            Enviada #{recentSentOrder.number} - {recentSentOrder.customerName} - {getServiceModeLabel(recentSentOrder.serviceMode)} - {toMoney(recentSentOrder.total)} (click para editar)
                          </button>
                        ) : null}

                        {showOrdersPanel ? (
                          <div className="orders-drawer">
                            <div className="orders-drawer-head">
                              <h4>Panel de ordenes</h4>
                              <button type="button" className="small-btn" onClick={() => setShowOrdersPanel(false)}>
                                Cerrar
                              </button>
                            </div>
                            <div className="orders-filter-row">
                              <button
                                type="button"
                                className={`period-btn ${ordersView === 'sent' ? 'active' : ''}`}
                                onClick={() => setOrdersView('sent')}
                              >
                                Enviadas
                              </button>
                              <button
                                type="button"
                                className={`period-btn ${ordersView === 'cancelled' ? 'active' : ''}`}
                                onClick={() => setOrdersView('cancelled')}
                              >
                                Canceladas
                              </button>
                              <button
                                type="button"
                                className={`period-btn ${ordersView === 'realtime' ? 'active' : ''}`}
                                onClick={() => setOrdersView('realtime')}
                              >
                                Tiempo real
                              </button>
                            </div>
                            <div className="saved-orders">
                              {(ordersView === 'sent' ? sentOrders : ordersView === 'cancelled' ? cancelledOrders : realtimeOrders).length ? (
                                (ordersView === 'sent' ? sentOrders : ordersView === 'cancelled' ? cancelledOrders : realtimeOrders).map((order) => (
                                  <button
                                    key={order.id}
                                    type="button"
                                    className={`saved-order-btn ${selectedPosOrderId === order.id ? 'active' : ''}`}
                                    onClick={() => editPosOrder(order.id)}
                                  >
                                    <span>#{order.number}</span>
                                    <span>
                                      {order.customerName} · {getServiceModeLabel(order.serviceMode)}
                                    </span>
                                    <span>{order.lines.reduce((sum, line) => sum + line.qty, 0)} items</span>
                                    <span>{new Date(order.updatedAt || order.createdAt).toLocaleTimeString('es-AR')}</span>
                                    <strong>{toMoney(order.total)}</strong>
                                  </button>
                                ))
                              ) : (
                                <p className="empty-order">Sin ordenes en esta vista</p>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </aside>
                  </div>
                </div>
              </section>
            </section>
          ) : screen === SCREENS.USERS ? (
            <section className="admin-panel" aria-label="Panel usuarios">
              <header className="admin-header">
                <div>
                  <h2>Panel de Usuarios / Empleados</h2>
                  <p>Registro legal, PIN de marcacion y gestion de perfiles</p>
                </div>
                <div className="admin-actions">
                  <button type="button" className="small-btn" onClick={() => setScreen(SCREENS.SELECTION)}>
                    Volver
                  </button>
                  <button type="button" className="small-btn danger" onClick={lockAgain}>
                    Salir
                  </button>
                </div>
              </header>

              {apiError ? <p className="api-error">{apiError}</p> : null}
              {lastGeneratedPin ? <p className="success-note">Empleado creado. PIN generado: {lastGeneratedPin}</p> : null}

              <section className="admin-body split-area">
                <article className="panel-block">
                  <h3>Registrar empleado (datos legales)</h3>
                  <div className="form-grid">
                    <label>
                      Nombre
                      <input value={employeeForm.firstName} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, firstName: event.target.value }))} />
                    </label>
                    <label>
                      Apellido
                      <input value={employeeForm.lastName} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, lastName: event.target.value }))} />
                    </label>
                    <label>
                      Pais
                      <input value={employeeForm.country} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, country: event.target.value }))} />
                    </label>
                    <label>
                      Estado/Provincia
                      <input value={employeeForm.state} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, state: event.target.value }))} />
                    </label>
                    <label>
                      Ciudad
                      <input value={employeeForm.city} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, city: event.target.value }))} />
                    </label>
                    <label className="wide">
                      Direccion
                      <input value={employeeForm.address} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, address: event.target.value }))} />
                    </label>
                    <label>
                      ZIP / Codigo postal
                      <input value={employeeForm.postalCode} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, postalCode: event.target.value }))} />
                    </label>
                    <label>
                      Telefono
                      <input value={employeeForm.phone} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, phone: event.target.value }))} />
                    </label>
                    <label>
                      Email
                      <input value={employeeForm.email} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, email: event.target.value }))} />
                    </label>
                    <label>
                      Tipo de ID
                      <select value={employeeForm.idType} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, idType: event.target.value }))}>
                        <option>SSN</option>
                        <option>Passport</option>
                        <option>DNI</option>
                        <option>DriverLicense</option>
                      </select>
                    </label>
                    <label>
                      Numero de ID
                      <input value={employeeForm.idNumber} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, idNumber: event.target.value }))} />
                    </label>
                    <label>
                      Rol
                      <select value={employeeForm.role} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, role: event.target.value }))}>
                        <option>Admin</option>
                        <option>Supervisor</option>
                        <option>Cajero</option>
                        <option>Mesero</option>
                        <option>Empleado</option>
                      </select>
                    </label>
                    <label>
                      Metodo de pago
                      <select value={employeeForm.paymentMethod} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, paymentMethod: event.target.value }))}>
                        <option>Transferencia</option>
                        <option>Efectivo</option>
                        <option>Cheque</option>
                      </select>
                    </label>
                  </div>
                  <div className="button-row">
                    <button type="button" className="small-btn" onClick={registerEmployee}>
                      Registrar empleado
                    </button>
                  </div>
                </article>

                <article className="panel-block">
                  <h3>Empleados registrados</h3>
                  <div className="inline-form">
                    <input value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} placeholder="Buscar empleado" />
                    <button type="button" onClick={loadEmployees}>
                      Recargar
                    </button>
                  </div>
                  <div className="list-box">
                    {filteredEmployees.map((employee) => (
                      <div key={employee.id} className={`employee-row ${selectedEmployeeId === employee.id ? 'active' : ''}`}>
                        <button type="button" className="employee-main" onClick={() => setSelectedEmployeeId(employee.id)}>
                          <span>{employee.fullName}</span>
                          <span>{employee.role}</span>
                          <span>{employee.phone}</span>
                          <span>PIN {employee.pin}</span>
                        </button>
                        <div className="employee-actions">
                          <button type="button" className="icon-btn edit" title="Editar" onClick={() => startEditEmployee(employee)}>
                            âœŽ
                          </button>
                          <button type="button" className="icon-btn delete" title="Borrar" onClick={() => deleteEmployee(employee.id)}>
                            ðŸ—‘
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="admin-body split-area">
                <article className="panel-block">
                  <h3>Editar empleado</h3>
                  {employeeDraft ? (
                    <div className="form-grid">
                      <label>
                        Nombre
                        <input value={employeeDraft.firstName || ''} onChange={(event) => setEmployeeDraft((prev) => ({ ...prev, firstName: event.target.value }))} />
                      </label>
                      <label>
                        Apellido
                        <input value={employeeDraft.lastName || ''} onChange={(event) => setEmployeeDraft((prev) => ({ ...prev, lastName: event.target.value }))} />
                      </label>
                      <label>
                        Telefono
                        <input value={employeeDraft.phone || ''} onChange={(event) => setEmployeeDraft((prev) => ({ ...prev, phone: event.target.value }))} />
                      </label>
                      <label>
                        Email
                        <input value={employeeDraft.email || ''} onChange={(event) => setEmployeeDraft((prev) => ({ ...prev, email: event.target.value }))} />
                      </label>
                      <label>
                        Rol
                        <select value={employeeDraft.role || 'Empleado'} onChange={(event) => setEmployeeDraft((prev) => ({ ...prev, role: event.target.value }))}>
                          <option>Admin</option>
                          <option>Supervisor</option>
                          <option>Cajero</option>
                          <option>Mesero</option>
                          <option>Empleado</option>
                        </select>
                      </label>
                      <label>
                        Estado
                        <select value={employeeDraft.status || 'Activo'} onChange={(event) => setEmployeeDraft((prev) => ({ ...prev, status: event.target.value }))}>
                          <option>Activo</option>
                          <option>Inactivo</option>
                        </select>
                      </label>
                    </div>
                  ) : null}
                  <div className="button-row">
                    <button type="button" className="small-btn" onClick={saveEmployeeEdits}>
                      Guardar empleado
                    </button>
                  </div>
                </article>

                <article className="panel-block">
                  <h3>Historial semanal del empleado</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Personal</th>
                        <th>Accion</th>
                        <th>Fecha/Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeWeeklyHistory.length ? (
                        employeeWeeklyHistory.map((item) => (
                          <tr key={item.id}>
                            <td>{item.employeeName || `${employeeDraft?.firstName || ''} ${employeeDraft?.lastName || ''}`.trim()}</td>
                            <td>{item.action}</td>
                            <td>{new Date(item.timestamp).toLocaleString('es-AR')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3">Sin registros semanales</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </article>
              </section>
            </section>
          ) : (
            <section className="admin-panel" aria-label="Panel de asistencia por PIN">
              <header className="admin-header">
                <div>
                  <h2>Marcacion de asistencia</h2>
                  <p>PIN de empleado para confirmar entrada o salida</p>
                </div>
                <div className="admin-actions">
                  <button type="button" className="small-btn" onClick={() => setScreen(SCREENS.SELECTION)}>
                    Volver
                  </button>
                  <button type="button" className="small-btn danger" onClick={lockAgain}>
                    Salir
                  </button>
                </div>
              </header>
              {attendanceSession?.employee ? (
                <section className="admin-body">
                  <div className="priority-strip">
                    <article className="priority-card">
                      <p>Empleado</p>
                      <strong>{attendanceSession.employee.fullName}</strong>
                    </article>
                    <article className="priority-card">
                      <p>Rol</p>
                      <strong>{attendanceSession.employee.role}</strong>
                    </article>
                    <article className="priority-card">
                      <p>Siguiente accion</p>
                      <strong>{attendanceSession.nextAction}</strong>
                    </article>
                    <article className="priority-card">
                      <p>Total horas (semana)</p>
                      <strong>{formatHours(attendanceTotalHours)}</strong>
                    </article>
                  </div>
                  <div className="button-row">
                    <button type="button" className="small-btn" onClick={handleAttendanceConfirm}>
                      Confirmar hora de {attendanceSession.nextAction.toLowerCase()}
                    </button>
                  </div>
                  {attendanceSession.statusMessage ? <p className="api-error">{attendanceSession.statusMessage}</p> : null}
                  <details className="panel-block" open>
                    <summary>Historial semanal del empleado</summary>
                    <table>
                      <thead>
                        <tr>
                          <th>Personal</th>
                          <th>Accion</th>
                          <th>Fecha/Hora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceSession.weeklyHistory.length ? (
                          attendanceSession.weeklyHistory.map((item) => (
                            <tr key={item.id}>
                              <td>{item.employeeName || attendanceSession.employee.fullName}</td>
                              <td>{item.action}</td>
                              <td>{new Date(item.timestamp).toLocaleString('es-AR')}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3">Sin registros semanales</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </details>
                </section>
              ) : (
                <section className="admin-body">
                  <h3>Esperando PIN de empleado</h3>
                  <p>Ingresa el PIN en la pantalla de bloqueo para habilitar esta vista.</p>
                </section>
              )}
            </section>
          )
        ) : (
          <>
            <p className="hint">Ingresa el PIN de 4 digitos</p>
            <div className="pin-dots" aria-label="Estado del PIN">
              {[0, 1, 2, 3].map((idx) => (
                <span key={idx} className={`dot ${idx < pin.length ? 'filled' : ''}`} />
              ))}
            </div>
            <div className="keypad">
              {NUMBER_KEYS.slice(0, 9).map((n) => (
                <button key={n} type="button" className="key" onClick={() => addDigit(n)}>
                  {n}
                </button>
              ))}
              <button type="button" className="key action" onClick={clearLast}>
                Borrar
              </button>
              <button type="button" className="key" onClick={() => addDigit('0')}>
                0
              </button>
              <button type="button" className="key action" onClick={() => setPin('')}>
                Limpiar
              </button>
            </div>
            <p className="error" role="status" aria-live="polite">
              {error}
            </p>
          </>
        )}
      </section>
    </main>
  )
}

export default App







