'use client'

import { useState, useRef } from 'react'
import { Camera, Image as ImageIcon, X, Loader2, CheckCircle } from 'lucide-react'

interface PhotoUploaderProps {
  step: string
  onUpload?: (file: File, step: string) => Promise<string>
  previewUrl?: string
}

export default function PhotoUploader({ step, onUpload, previewUrl }: PhotoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(previewUrl || null)
  const [uploading, setUploading] = useState(false)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    const local = URL.createObjectURL(file)
    setPreview(local)

    if (onUpload) {
      setUploading(true)
      try {
        await onUpload(file, step)
      } finally {
        setUploading(false)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-white/12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="photo" className="w-full h-40 object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 size={28} className="text-white animate-spin" />
            </div>
          )}
          {!uploading && (
            <div className="absolute top-2 right-2 bg-[#10B981] rounded-full p-1">
              <CheckCircle size={16} className="text-white" />
            </div>
          )}
          <button
            onClick={() => setPreview(null)}
            className="absolute top-2 left-2 bg-black/60 rounded-full p-1"
          >
            <X size={14} className="text-white" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 bg-white/8 border border-white/12 border-dashed rounded-xl py-5 text-white/60 active:bg-white/15 transition-colors"
          >
            <Camera size={24} className="text-[#F5A623]" />
            <span className="text-xs">ถ่ายรูป</span>
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 bg-white/8 border border-white/12 border-dashed rounded-xl py-5 text-white/60 active:bg-white/15 transition-colors"
          >
            <ImageIcon size={24} className="text-blue-400" />
            <span className="text-xs">เลือกรูป</span>
          </button>
        </div>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
