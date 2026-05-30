import { useState } from 'react'
import { Save, Palette } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { useOrg } from '@/hooks/useOrg'

const THEME_COLORS = [
  { label: 'Electric Blue', value: '#3B82F6' },
  { label: 'Emerald', value: '#10B981' },
  { label: 'Amber', value: '#F59E0B' },
  { label: 'Rose', value: '#F43F5E' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Teal', value: '#14B8A6' },
]

export function Settings() {
  const { activeOrg } = useOrg()
  const [orgName, setOrgName] = useState(activeOrg?.name ?? '')
  const [themeColor, setThemeColor] = useState(activeOrg?.theme_color ?? '#3B82F6')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    // Would call API in real impl
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Layout title="Settings">
      <div className="max-w-2xl space-y-6">
        {/* Org Settings */}
        <Card padding="lg">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">Organisation Settings</h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Organisation Name
              </label>
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-navy-900 px-3 py-2 text-sm text-slate-200 focus:border-electric-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Slug</label>
              <input
                value={activeOrg?.slug ?? ''}
                readOnly
                className="w-full cursor-not-allowed rounded-lg border border-slate-800 bg-navy-950 px-3 py-2 font-mono text-sm text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-600">Slug cannot be changed after creation.</p>
            </div>
          </div>
        </Card>

        {/* Branding */}
        <Card padding="lg">
          <div className="mb-4 flex items-center gap-2">
            <Palette className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Branding & Theme</h3>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">Theme Color</label>
            <div className="flex flex-wrap gap-2">
              {THEME_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setThemeColor(c.value)}
                  title={c.label}
                  className={`h-8 w-8 rounded-full transition-all ${
                    themeColor === c.value
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-navy-800 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent"
                title="Custom color"
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-full"
                style={{ backgroundColor: themeColor }}
              />
              <span className="font-mono text-xs text-slate-400">{themeColor}</span>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card padding="lg" className="border-rose-500/20">
          <h3 className="mb-4 text-sm font-semibold text-rose-400">Danger Zone</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">Delete Organisation</p>
              <p className="text-xs text-slate-500">
                This will permanently delete all data. This action cannot be undone.
              </p>
            </div>
            <Button variant="danger" size="sm">Delete Org</Button>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            icon={<Save className="h-4 w-4" />}
            onClick={handleSave}
          >
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Layout>
  )
}
