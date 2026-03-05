import { createServer } from 'node:http'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PORT = Number(process.env.PORT || 4000)
const DB_PATH = join(process.cwd(), 'api', 'data.json')

const PERIOD_CONFIG = {
  Diario: { size: 24, labels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`) },
  Semanal: { size: 7, labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'] },
  Mensual: { size: 30, labels: Array.from({ length: 30 }, (_, i) => `D${i + 1}`) },
  Anual: { size: 12, labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] },
}

const defaultDb = {
  employees: [],
  attendance: [],
  orders: [],
}

if (!existsSync(DB_PATH)) {
  writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2))
}

const readDb = () => {
  try {
    return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
  } catch {
    return { ...defaultDb }
  }
}

const writeDb = (db) => {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

const sanitizeOrder = (order) => ({
  id: order.id,
  number: Number(order.number || 0),
  customerName: String(order.customerName || 'Consumidor final'),
  customerPhone: String(order.customerPhone || '-'),
  orderLabel: String(order.orderLabel || ''),
  serviceMode: String(order.serviceMode || 'takeaway'),
  lines: Array.isArray(order.lines) ? order.lines : [],
  subtotal: Number(order.subtotal || 0),
  discount: Number(order.discount || 0),
  total: Number(order.total || 0),
  status: String(order.status || 'Pagada'),
  payment: String(order.payment || 'Pendiente'),
  note: String(order.note || ''),
  createdAt: order.createdAt || new Date().toISOString(),
  updatedAt: order.updatedAt || null,
})

const json = (res, status, payload) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(payload))
}

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 1_000_000) req.destroy()
    })
    req.on('end', () => {
      if (!body) return resolve({})
      try {
        resolve(JSON.parse(body))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })

const generateSeries = (period, seed) => {
  const cfg = PERIOD_CONFIG[period] || PERIOD_CONFIG.Diario
  return Array.from({ length: cfg.size }, (_, index) => {
    const flow = 1200 + Math.sin((index + seed) * 0.42) * 460 + Math.cos((index + seed) * 0.17) * 210
    const sales = Math.max(220, Math.round(flow))
    const promos = Math.round(sales * (0.08 + ((index + seed) % 5) * 0.01))
    const discounts = Math.round(sales * (0.05 + ((index + seed) % 4) * 0.008))
    const expenses = Math.round(sales * (0.32 + ((index + seed) % 3) * 0.04))
    return { label: cfg.labels[index], sales, promos, discounts, expenses }
  })
}

const sumBy = (rows, key) => rows.reduce((acc, row) => acc + row[key], 0)

const dayKey = (date) => {
  const d = new Date(date)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

const isSameDay = (a, b) => dayKey(a) === dayKey(b)

const getWeeklyLogs = (db, employeeId) => {
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)
  return db.attendance
    .filter((log) => log.employeeId === employeeId && new Date(log.timestamp) >= weekAgo)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

const nextActionForEmployee = (db, employeeId) => {
  const logs = db.attendance
    .filter((log) => log.employeeId === employeeId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  if (!logs.length) return 'Entrada'
  const last = logs[0]
  return last.action === 'Entrada' ? 'Salida' : 'Entrada'
}

const isPrivilegedRole = (role = '') => {
  const normalized = String(role).trim().toLowerCase()
  return normalized === 'admin' || normalized === 'administrador' || normalized === 'system' || normalized === 'systempos'
}

const ROLE_PIN_RANGES = {
  supervisor: [2001, 2999],
  cajero: [3001, 3999],
  mesero: [4001, 4999],
  empleado: [5001, 9999],
}

const getRangeForRole = (role = '') => {
  const normalized = String(role).trim().toLowerCase()
  if (normalized.includes('super')) return ROLE_PIN_RANGES.supervisor
  if (normalized.includes('caj')) return ROLE_PIN_RANGES.cajero
  if (normalized.includes('mes')) return ROLE_PIN_RANGES.mesero
  return ROLE_PIN_RANGES.empleado
}

const hasPrivilegedEmployee = (employees, ignoreEmployeeId = '') =>
  employees.some((emp) => emp.id !== ignoreEmployeeId && isPrivilegedRole(emp.role))

const generatePinInRange = (employees, min, max, predicate = () => true) => {
  const usedPins = new Set(employees.map((emp) => emp.pin))
  const candidates = []
  for (let value = min; value <= max; value += 1) {
    const pin = String(value)
    if (pin.length !== 4) continue
    if (usedPins.has(pin)) continue
    if (!predicate(pin)) continue
    candidates.push(pin)
  }
  if (!candidates.length) return ''
  return candidates[Math.floor(Math.random() * candidates.length)]
}

const generateUniquePinByRole = (employees, role = '') => {
  if (isPrivilegedRole(role)) {
    // PIN for System/Admin must always end in 0.
    return generatePinInRange(employees, 1000, 1990, (pin) => pin.endsWith('0'))
  }
  const [min, max] = getRangeForRole(role)
  return generatePinInRange(employees, min, max)
}

const sanitizeEmployee = (employee) => ({
  id: employee.id,
  firstName: employee.firstName,
  lastName: employee.lastName,
  fullName: `${employee.firstName} ${employee.lastName}`.trim(),
  country: employee.country,
  state: employee.state,
  city: employee.city,
  address: employee.address,
  postalCode: employee.postalCode,
  phone: employee.phone,
  email: employee.email,
  idType: employee.idType,
  idNumber: employee.idNumber,
  role: employee.role,
  status: employee.status,
  paymentMethod: employee.paymentMethod,
  accessLevel: isPrivilegedRole(employee.role) ? 'system-admin' : 'standard',
  pin: employee.pin,
  createdAt: employee.createdAt,
})

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {})

  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const now = new Date()
  const seed = now.getHours() * 60 + now.getMinutes()

  if (url.pathname === '/api/health' && req.method === 'GET') {
    return json(res, 200, { ok: true, now: now.toISOString() })
  }

  if (url.pathname === '/api/admin/live' && req.method === 'GET') {
    const liveTrend = Array.from({ length: 10 }, (_, idx) => {
      const v = 65 + Math.sin((seed + idx) * 0.36) * 22 + Math.cos((seed + idx) * 0.22) * 8
      return Math.min(100, Math.max(35, Math.round(v)))
    })
    return json(res, 200, { liveTrend, updatedAt: now.toISOString() })
  }

  if (url.pathname === '/api/admin/summary' && req.method === 'GET') {
    const rows = generateSeries('Diario', seed)
    const sales = sumBy(rows, 'sales')
    const promos = sumBy(rows, 'promos')
    const discounts = sumBy(rows, 'discounts')
    const expenses = sumBy(rows, 'expenses')
    const progress = ((sales - expenses) / Math.max(sales, 1)) * 100
    return json(res, 200, { sales, promos, discounts, expenses, progress, updatedAt: now.toISOString() })
  }

  if (url.pathname === '/api/admin/day' && req.method === 'GET') {
    return json(res, 200, { rows: generateSeries('Diario', seed), updatedAt: now.toISOString() })
  }

  if (url.pathname === '/api/admin/history' && req.method === 'GET') {
    const period = url.searchParams.get('period') || 'Diario'
    return json(res, 200, { period, rows: generateSeries(period, seed), updatedAt: now.toISOString() })
  }

  if (url.pathname === '/api/employees' && req.method === 'GET') {
    const db = readDb()
    return json(res, 200, { employees: db.employees.map(sanitizeEmployee) })
  }

  if (url.pathname === '/api/employees' && req.method === 'POST') {
    try {
      const payload = await readBody(req)
      if (!payload.firstName || !payload.lastName || !payload.country || !payload.phone) {
        return json(res, 400, { error: 'firstName, lastName, country y phone son obligatorios' })
      }

      const db = readDb()
      const role = String(payload.role || 'Empleado').trim()

      if (isPrivilegedRole(role) && hasPrivilegedEmployee(db.employees)) {
        return json(res, 409, { error: 'Ya existe un usuario con acceso System/Admin. Solo se permite uno.' })
      }

      const pin = generateUniquePinByRole(db.employees, role)
      if (!pin) {
        return json(res, 409, { error: 'No hay PIN disponibles para ese puesto/rango.' })
      }

      const employee = {
        id: `EMP-${Date.now()}`,
        firstName: String(payload.firstName).trim(),
        lastName: String(payload.lastName).trim(),
        country: String(payload.country || '').trim(),
        state: String(payload.state || '').trim(),
        city: String(payload.city || '').trim(),
        address: String(payload.address || '').trim(),
        postalCode: String(payload.postalCode || '').trim(),
        phone: String(payload.phone || '').trim(),
        email: String(payload.email || '').trim(),
        idType: String(payload.idType || 'ID').trim(),
        idNumber: String(payload.idNumber || '').trim(),
        role,
        status: String(payload.status || 'Activo').trim(),
        paymentMethod: String(payload.paymentMethod || 'Efectivo').trim(),
        pin,
        createdAt: now.toISOString(),
      }
      db.employees.push(employee)
      writeDb(db)
      return json(res, 201, { employee: sanitizeEmployee(employee), generatedPin: pin })
    } catch {
      return json(res, 400, { error: 'Body invalido' })
    }
  }

  if (url.pathname.startsWith('/api/employees/') && req.method === 'PUT') {
    try {
      const employeeId = url.pathname.split('/').pop()
      const payload = await readBody(req)
      const db = readDb()
      const idx = db.employees.findIndex((emp) => emp.id === employeeId)
      if (idx < 0) return json(res, 404, { error: 'Empleado no encontrado' })

      const current = db.employees[idx]
      const nextRole = payload.role ? String(payload.role).trim() : current.role
      if (isPrivilegedRole(nextRole) && hasPrivilegedEmployee(db.employees, current.id)) {
        return json(res, 409, { error: 'Ya existe un usuario con acceso System/Admin. Solo se permite uno.' })
      }

      const nextEmployee = { ...current, ...payload }
      if (payload.role && payload.role !== current.role) {
        const generatedPin = generateUniquePinByRole(db.employees.filter((emp) => emp.id !== current.id), nextRole)
        if (!generatedPin) {
          return json(res, 409, { error: 'No hay PIN disponibles para ese puesto/rango.' })
        }
        nextEmployee.pin = generatedPin
      }
      db.employees[idx] = nextEmployee
      writeDb(db)
      return json(res, 200, { employee: sanitizeEmployee(db.employees[idx]) })
    } catch {
      return json(res, 400, { error: 'Body invalido' })
    }
  }

  if (url.pathname.startsWith('/api/employees/') && req.method === 'DELETE') {
    const employeeId = url.pathname.split('/').pop()
    const db = readDb()
    const before = db.employees.length
    db.employees = db.employees.filter((emp) => emp.id !== employeeId)
    db.attendance = db.attendance.filter((log) => log.employeeId !== employeeId)
    if (db.employees.length === before) return json(res, 404, { error: 'Empleado no encontrado' })
    writeDb(db)
    return json(res, 200, { ok: true })
  }

  if (url.pathname === '/api/auth/pin' && req.method === 'POST') {
    try {
      const payload = await readBody(req)
      const pin = String(payload.pin || '').trim()
      const db = readDb()
      const employee = db.employees.find((emp) => emp.pin === pin)
      if (!employee) return json(res, 404, { error: 'PIN no encontrado' })
      const weeklyHistory = getWeeklyLogs(db, employee.id)
      const nextAction = nextActionForEmployee(db, employee.id)
      return json(res, 200, {
        employee: sanitizeEmployee(employee),
        weeklyHistory,
        nextAction,
      })
    } catch {
      return json(res, 400, { error: 'Body invalido' })
    }
  }

  if (url.pathname === '/api/attendance/punch' && req.method === 'POST') {
    try {
      const payload = await readBody(req)
      const pin = String(payload.pin || '').trim()
      const db = readDb()
      const employee = db.employees.find((emp) => emp.pin === pin)
      if (!employee) return json(res, 404, { error: 'PIN no encontrado' })

      const action = nextActionForEmployee(db, employee.id)
      const attendanceLog = {
        id: `AT-${Date.now()}`,
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
        action,
        timestamp: now.toISOString(),
        dateKey: dayKey(now),
      }

      db.attendance.push(attendanceLog)
      writeDb(db)
      const weeklyHistory = getWeeklyLogs(db, employee.id)

      return json(res, 200, {
        message: action === 'Entrada' ? 'Hora de entrada confirmada' : 'Hora de salida confirmada',
        action,
        log: attendanceLog,
        weeklyHistory,
      })
    } catch {
      return json(res, 400, { error: 'Body invalido' })
    }
  }

  if (url.pathname === '/api/attendance/history' && req.method === 'GET') {
    const employeeId = url.searchParams.get('employeeId')
    if (!employeeId) return json(res, 400, { error: 'employeeId requerido' })
    const db = readDb()
    const weeklyHistory = getWeeklyLogs(db, employeeId)
    return json(res, 200, { weeklyHistory })
  }

  if (url.pathname === '/api/attendance/today' && req.method === 'GET') {
    const employeeId = url.searchParams.get('employeeId')
    if (!employeeId) return json(res, 400, { error: 'employeeId requerido' })
    const db = readDb()
    const logs = db.attendance.filter((log) => log.employeeId === employeeId && isSameDay(log.timestamp, now))
    return json(res, 200, { logs })
  }

  if (url.pathname === '/api/orders' && req.method === 'GET') {
    const db = readDb()
    const orders = [...(db.orders || [])]
      .map(sanitizeOrder)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return json(res, 200, { orders })
  }

  if (url.pathname === '/api/orders' && req.method === 'POST') {
    try {
      const payload = await readBody(req)
      if (!payload?.id || !Array.isArray(payload?.lines) || !payload.lines.length) {
        return json(res, 400, { error: 'id y lines son requeridos' })
      }
      const db = readDb()
      const idx = (db.orders || []).findIndex((order) => order.id === payload.id)
      const order = sanitizeOrder({
        ...payload,
        createdAt: payload.createdAt || now.toISOString(),
        updatedAt: now.toISOString(),
      })

      if (idx >= 0) {
        db.orders[idx] = { ...db.orders[idx], ...order, updatedAt: now.toISOString() }
      } else {
        db.orders = [...(db.orders || []), order]
      }
      writeDb(db)
      return json(res, idx >= 0 ? 200 : 201, { order: sanitizeOrder(order) })
    } catch {
      return json(res, 400, { error: 'Body invalido' })
    }
  }

  if (url.pathname.startsWith('/api/orders/') && req.method === 'PUT') {
    try {
      const orderId = url.pathname.split('/').pop()
      const payload = await readBody(req)
      const db = readDb()
      const idx = (db.orders || []).findIndex((order) => order.id === orderId)
      if (idx < 0) return json(res, 404, { error: 'Orden no encontrada' })
      db.orders[idx] = sanitizeOrder({ ...db.orders[idx], ...payload, id: orderId, updatedAt: now.toISOString() })
      writeDb(db)
      return json(res, 200, { order: sanitizeOrder(db.orders[idx]) })
    } catch {
      return json(res, 400, { error: 'Body invalido' })
    }
  }

  if (url.pathname.startsWith('/api/orders/') && req.method === 'DELETE') {
    const orderId = url.pathname.split('/').pop()
    const db = readDb()
    const before = (db.orders || []).length
    db.orders = (db.orders || []).filter((order) => order.id !== orderId)
    if (db.orders.length === before) return json(res, 404, { error: 'Orden no encontrada' })
    writeDb(db)
    return json(res, 200, { ok: true })
  }

  return json(res, 404, { error: 'Not found' })
}).listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})
