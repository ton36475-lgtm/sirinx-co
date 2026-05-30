export type InstallationStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
export type TicketCategory = 'equipment' | 'billing' | 'installation' | 'monitoring' | 'other'
export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'cancelled'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  systemSize: number // kWp
  installationStatus: InstallationStatus
  installationDate: string | null
  contractNumber: string
  avatarUrl?: string
}

export interface InstallationStep {
  id: string
  title: string
  description: string
  status: 'completed' | 'in_progress' | 'pending'
  date: string | null
  technician?: string
}

export interface Equipment {
  id: string
  name: string
  brand: string
  model: string
  quantity: number
  unit: string
  serialNumber?: string
  warrantyUntil?: string
}

export interface ProductionDay {
  date: string
  kwh: number
  peak: number // kW peak
}

export interface ProductionMonth {
  month: string
  kwh: number
  prevYear?: number
}

export interface ProductionYear {
  year: string
  kwh: number
}

export interface SavingsData {
  todayKwh: number
  monthKwh: number
  yearKwh: number
  lifetimeKwh: number
  todaySavings: number // THB
  monthSavings: number // THB
  yearSavings: number // THB
  lifetimeSavings: number // THB
  co2ReducedKg: number // kg total
  treesEquivalent: number
}

export interface TicketMessage {
  id: string
  sender: 'customer' | 'support'
  message: string
  createdAt: string
  attachments?: string[]
}

export interface SupportTicket {
  id: string
  title: string
  description: string
  status: TicketStatus
  category: TicketCategory
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
  images?: string[]
}

export interface Invoice {
  id: string
  invoiceNumber: string
  description: string
  amount: number // THB
  vatAmount: number
  totalAmount: number
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  paidDate: string | null
  pdfUrl?: string
}

export interface WarrantyDoc {
  id: string
  title: string
  type: 'panel' | 'inverter' | 'battery' | 'structure' | 'workmanship' | 'other'
  brand: string
  model: string
  warrantyYears: number
  startDate: string
  endDate: string
  documentUrl?: string
}
