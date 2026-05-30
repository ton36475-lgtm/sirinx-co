import type {
  Customer, InstallationStep, Equipment,
  ProductionDay, ProductionMonth, ProductionYear,
  SavingsData, SupportTicket, Invoice, WarrantyDoc
} from '@/types'

export const mockCustomer: Customer = {
  id: 'cust-001',
  name: 'คุณสมชาย ใจดี',
  email: 'somchai@example.com',
  phone: '081-234-5678',
  address: '456/12 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400',
  systemSize: 30, // kWp
  installationStatus: 'completed',
  installationDate: '2024-03-15',
  contractNumber: 'SRX-2024-00123',
}

export const mockInstallationSteps: InstallationStep[] = [
  {
    id: 'step-1',
    title: 'เซ็นสัญญาและวางมัดจำ',
    description: 'ลูกค้าเซ็นสัญญาและชำระเงินมัดจำ 30%',
    status: 'completed',
    date: '2024-01-20',
    technician: 'ฝ่ายขาย',
  },
  {
    id: 'step-2',
    title: 'สำรวจพื้นที่และออกแบบระบบ',
    description: 'วิศวกรสำรวจหลังคา วัดขนาด และออกแบบระบบ Solar 30 kWp',
    status: 'completed',
    date: '2024-02-05',
    technician: 'ทีมวิศวกร',
  },
  {
    id: 'step-3',
    title: 'ยื่นขออนุมัติ PEA',
    description: 'ยื่นเอกสารขออนุมัติติดตั้งระบบผลิตไฟฟ้าจากการไฟฟ้าส่วนภูมิภาค',
    status: 'completed',
    date: '2024-02-20',
    technician: 'ฝ่ายเอกสาร',
  },
  {
    id: 'step-4',
    title: 'ติดตั้งอุปกรณ์',
    description: 'ติดตั้งแผง Solar 120 แผง, Inverter 3 ตัว และระบบสายไฟ',
    status: 'completed',
    date: '2024-03-10',
    technician: 'ช่างสมหมาย + ทีม 5 คน',
  },
  {
    id: 'step-5',
    title: 'ตรวจสอบและเปิดใช้งาน',
    description: 'วิศวกรตรวจสอบระบบ ทดสอบการทำงาน และเปิดใช้งาน',
    status: 'completed',
    date: '2024-03-15',
    technician: 'วิศวกรสุรชัย',
  },
  {
    id: 'step-6',
    title: 'อบรมการใช้งานและส่งมอบ',
    description: 'อบรมลูกค้าวิธีดูข้อมูลระบบ และส่งมอบเอกสารรับประกัน',
    status: 'completed',
    date: '2024-03-20',
    technician: 'ทีม After-Sales',
  },
]

export const mockEquipment: Equipment[] = [
  {
    id: 'eq-1',
    name: 'แผง Solar',
    brand: 'Longi',
    model: 'Hi-MO 6 LR5-72HIH-560M',
    quantity: 54,
    unit: 'แผง',
    warrantyUntil: '2049-03-15',
  },
  {
    id: 'eq-2',
    name: 'Inverter',
    brand: 'Huawei',
    model: 'SUN2000-10KTL-M1',
    quantity: 3,
    unit: 'เครื่อง',
    serialNumber: 'HW2024031501/02/03',
    warrantyUntil: '2034-03-15',
  },
  {
    id: 'eq-3',
    name: 'โครงสร้างหลังคา',
    brand: 'SIRINX',
    model: 'Aluminum Rail System',
    quantity: 1,
    unit: 'ชุด',
    warrantyUntil: '2044-03-15',
  },
]

// Generate 30 days of daily production data (March 2025)
function generateDailyData(): ProductionDay[] {
  const data: ProductionDay[] = []
  const baseKwh = [85, 92, 78, 110, 125, 118, 95, 88, 102, 115,
                    122, 109, 98, 88, 101, 118, 125, 130, 115, 105,
                    92, 88, 78, 95, 108, 118, 122, 115, 102, 98, 105]
  for (let i = 0; i < 31; i++) {
    const day = String(i + 1).padStart(2, '0')
    data.push({
      date: `${day}/03`,
      kwh: baseKwh[i] || 100,
      peak: +(baseKwh[i] / 5).toFixed(1) || 20,
    })
  }
  return data
}

export const mockDailyProduction: ProductionDay[] = generateDailyData()

export const mockMonthlyProduction: ProductionMonth[] = [
  { month: 'ม.ค.', kwh: 3120, prevYear: 0 },
  { month: 'ก.พ.', kwh: 2980, prevYear: 0 },
  { month: 'มี.ค.', kwh: 3350, prevYear: 0 },
  { month: 'เม.ย.', kwh: 3480, prevYear: 0 },
  { month: 'พ.ค.', kwh: 3210, prevYear: 0 },
  { month: 'มิ.ย.', kwh: 2850, prevYear: 0 },
  { month: 'ก.ค.', kwh: 2920, prevYear: 0 },
  { month: 'ส.ค.', kwh: 3010, prevYear: 0 },
  { month: 'ก.ย.', kwh: 2780, prevYear: 0 },
  { month: 'ต.ค.', kwh: 2990, prevYear: 0 },
  { month: 'พ.ย.', kwh: 3150, prevYear: 0 },
  { month: 'ธ.ค.', kwh: 3080, prevYear: 0 },
]

export const mockYearlyProduction: ProductionYear[] = [
  { year: '2563', kwh: 0 },
  { year: '2564', kwh: 0 },
  { year: '2565', kwh: 0 },
  { year: '2566', kwh: 0 },
  { year: '2567', kwh: 35920 },
]

export const mockSavings: SavingsData = {
  todayKwh: 118.5,
  monthKwh: 3350,
  yearKwh: 35920,
  lifetimeKwh: 35920,
  todaySavings: 474,
  monthSavings: 13400,
  yearSavings: 143680,
  lifetimeSavings: 143680,
  co2ReducedKg: 22571,
  treesEquivalent: 1128,
}

export const mockTickets: SupportTicket[] = [
  {
    id: 'TKT-2025-001',
    title: 'Inverter แสดงไฟเตือนสีส้ม',
    description: 'Inverter ตัวที่ 2 แสดงไฟเตือนสีส้มตั้งแต่เมื่อเช้า ไม่แน่ใจว่าผิดปกติหรือเปล่า',
    status: 'resolved',
    category: 'equipment',
    priority: 'medium',
    createdAt: '2025-01-15T09:30:00Z',
    updatedAt: '2025-01-16T14:00:00Z',
    messages: [
      {
        id: 'msg-1',
        sender: 'customer',
        message: 'Inverter ตัวที่ 2 มีไฟสีส้มกะพริบ ปกติไหมครับ?',
        createdAt: '2025-01-15T09:30:00Z',
      },
      {
        id: 'msg-2',
        sender: 'support',
        message: 'สวัสดีครับ ขอบคุณที่แจ้งมาครับ ไฟสีส้มอาจเกิดจากอุณหภูมิสูงในช่วงบ่าย ปกติจะหายเองตอนเย็นครับ ถ้ายังมีอยู่พรุ่งนี้เช้า รบกวนแจ้งอีกครั้งนะครับ',
        createdAt: '2025-01-15T10:15:00Z',
      },
      {
        id: 'msg-3',
        sender: 'customer',
        message: 'โอเค ขอบคุณครับ เมื่อกี้หายแล้ว',
        createdAt: '2025-01-15T17:30:00Z',
      },
    ],
  },
  {
    id: 'TKT-2025-002',
    title: 'ขอใบเสร็จสำหรับยื่นภาษี',
    description: 'ขอใบเสร็จรับเงินฉบับสมบูรณ์สำหรับยื่นลดหย่อนภาษีปี 2024',
    status: 'closed',
    category: 'billing',
    priority: 'low',
    createdAt: '2025-01-10T11:00:00Z',
    updatedAt: '2025-01-11T09:00:00Z',
    messages: [
      {
        id: 'msg-4',
        sender: 'customer',
        message: 'ขอใบเสร็จรับเงินด้วยนะครับ จะยื่นลดหย่อนภาษี',
        createdAt: '2025-01-10T11:00:00Z',
      },
      {
        id: 'msg-5',
        sender: 'support',
        message: 'ได้เลยครับ ส่งใบเสร็จไปทาง email ที่ลงทะเบียนไว้แล้วครับ ตรวจสอบด้วยนะครับ',
        createdAt: '2025-01-11T09:00:00Z',
      },
    ],
  },
  {
    id: 'TKT-2025-003',
    title: 'แผงไม่ผลิตไฟช่วงกลางวัน',
    description: 'สังเกตว่าช่วง 12:00-14:00 ผลิตไฟน้อยผิดปกติ ตรวจสอบด้วยครับ',
    status: 'in_progress',
    category: 'equipment',
    priority: 'high',
    createdAt: '2025-02-20T13:00:00Z',
    updatedAt: '2025-02-21T10:00:00Z',
    messages: [
      {
        id: 'msg-6',
        sender: 'customer',
        message: 'ช่วงเที่ยงถึงบ่ายสองโมง ผลิตได้แค่ 15 kW ทั้งที่ควรได้ 25+ kW ครับ',
        createdAt: '2025-02-20T13:00:00Z',
      },
      {
        id: 'msg-7',
        sender: 'support',
        message: 'รับทราบครับ กำลังตรวจสอบข้อมูล monitoring จากระบบ จะติดต่อกลับภายใน 24 ชั่วโมงครับ',
        createdAt: '2025-02-20T14:30:00Z',
      },
    ],
  },
]

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2024-0123',
    description: 'ค่ามัดจำติดตั้งระบบ Solar 30 kWp (30%)',
    amount: 300000,
    vatAmount: 21000,
    totalAmount: 321000,
    status: 'paid',
    issueDate: '2024-01-20',
    dueDate: '2024-01-25',
    paidDate: '2024-01-22',
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2024-0124',
    description: 'ค่าติดตั้งระบบ Solar 30 kWp (70%)',
    amount: 700000,
    vatAmount: 49000,
    totalAmount: 749000,
    status: 'paid',
    issueDate: '2024-03-15',
    dueDate: '2024-03-20',
    paidDate: '2024-03-18',
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2025-0045',
    description: 'ค่าบำรุงรักษาประจำปี 2025 (O&M Service)',
    amount: 18000,
    vatAmount: 1260,
    totalAmount: 19260,
    status: 'pending',
    issueDate: '2025-01-01',
    dueDate: '2025-02-01',
    paidDate: null,
  },
]

export const mockWarrantyDocs: WarrantyDoc[] = [
  {
    id: 'war-1',
    title: 'รับประกันแผง Solar',
    type: 'panel',
    brand: 'Longi Solar',
    model: 'Hi-MO 6 LR5-72HIH-560M',
    warrantyYears: 25,
    startDate: '2024-03-15',
    endDate: '2049-03-15',
  },
  {
    id: 'war-2',
    title: 'รับประกัน Performance แผง (Linear)',
    type: 'panel',
    brand: 'Longi Solar',
    model: 'Hi-MO 6 LR5-72HIH-560M',
    warrantyYears: 30,
    startDate: '2024-03-15',
    endDate: '2054-03-15',
  },
  {
    id: 'war-3',
    title: 'รับประกัน Inverter',
    type: 'inverter',
    brand: 'Huawei',
    model: 'SUN2000-10KTL-M1',
    warrantyYears: 10,
    startDate: '2024-03-15',
    endDate: '2034-03-15',
  },
  {
    id: 'war-4',
    title: 'รับประกันโครงสร้าง',
    type: 'structure',
    brand: 'SIRINX',
    model: 'Aluminum Rail System',
    warrantyYears: 20,
    startDate: '2024-03-15',
    endDate: '2044-03-15',
  },
  {
    id: 'war-5',
    title: 'รับประกันงานติดตั้ง',
    type: 'workmanship',
    brand: 'SIRINX',
    model: 'Installation Warranty',
    warrantyYears: 5,
    startDate: '2024-03-15',
    endDate: '2029-03-15',
  },
]
