export type JobStatus =
  | 'pending'
  | 'accepted'
  | 'traveling'
  | 'installing'
  | 'testing'
  | 'completed'
  | 'cancelled'

export interface Customer {
  id: string
  name: string
  phone: string
  address: string
  lat?: number
  lng?: number
  company?: string
}

export interface SolarSystem {
  capacity_kwp: number
  panel_count: number
  inverter_brand: string
  inverter_model: string
  roof_type: string
  notes?: string
}

export interface JobPhoto {
  id: string
  url: string
  step: string
  caption?: string
  uploaded_at: string
}

export interface Job {
  id: string
  job_number: string
  customer: Customer
  solar_system: SolarSystem
  status: JobStatus
  scheduled_date: string
  scheduled_time: string
  address: string
  payment_amount: number
  photos: JobPhoto[]
  notes?: string
  created_at: string
  updated_at: string
}

export interface ChecklistStep {
  id: string
  phase: 'pre' | 'install' | 'post'
  title: string
  description: string
  required_photo: boolean
  completed: boolean
  photo_url?: string
  notes?: string
}

export interface EarningsRecord {
  date: string
  amount: number
  jobs: number
}

export interface InventoryItem {
  id: string
  name: string
  unit: string
  quantity: number
  min_quantity: number
  category: 'panel' | 'inverter' | 'cable' | 'rail' | 'hardware' | 'other'
}

export interface Contractor {
  id: string
  name: string
  phone: string
  email?: string
  rating: number
  total_jobs: number
  total_earnings: number
  cert_level: string
  avatar_url?: string
  specialties: string[]
  joined_date: string
}
