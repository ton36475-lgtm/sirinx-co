'use client'

import { useState, useEffect } from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  mockCustomer, mockSavings, mockTickets,
  mockInvoices, mockWarrantyDocs, mockInstallationSteps,
  mockEquipment, mockDailyProduction, mockMonthlyProduction,
  mockYearlyProduction,
} from '@/lib/mockData'
import type {
  Customer, SavingsData, SupportTicket, Invoice,
  WarrantyDoc, InstallationStep, Equipment,
  ProductionDay, ProductionMonth, ProductionYear,
} from '@/types'

export function useCustomer() {
  const [customer, setCustomer] = useState<Customer>(mockCustomer)
  const [savings, setSavings] = useState<SavingsData>(mockSavings)
  const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets)
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices)
  const [warrantyDocs, setWarrantyDocs] = useState<WarrantyDoc[]>(mockWarrantyDocs)
  const [installationSteps, setInstallationSteps] = useState<InstallationStep[]>(mockInstallationSteps)
  const [equipment, setEquipment] = useState<Equipment[]>(mockEquipment)
  const [dailyProduction, setDailyProduction] = useState<ProductionDay[]>(mockDailyProduction)
  const [monthlyProduction, setMonthlyProduction] = useState<ProductionMonth[]>(mockMonthlyProduction)
  const [yearlyProduction, setYearlyProduction] = useState<ProductionYear[]>(mockYearlyProduction)
  const [loading, setLoading] = useState(false)
  const [usingMock, setUsingMock] = useState(!isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setUsingMock(true)
      return
    }
    // When Supabase is configured, fetch real data here
    // setLoading(true)
    // supabase.from('customers').select('*').single().then(...)
  }, [])

  return {
    customer,
    savings,
    tickets,
    invoices,
    warrantyDocs,
    installationSteps,
    equipment,
    dailyProduction,
    monthlyProduction,
    yearlyProduction,
    loading,
    usingMock,
    setCustomer,
    setTickets,
  }
}
