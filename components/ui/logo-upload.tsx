'use client'

import * as React from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LogoUploadProps {
  value?: File | string | null
  onChange: (file: File | null) => void
  disabled?: boolean
  className?: string
}

export function LogoUpload({ value, onChange, disabled, className }: LogoUploadProps) {
  const [preview, setPreview] = React.useState<string | null>(
    typeof value === 'string' ? value : null
  )
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value)
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    } else if (typeof value === 'string') {
      setPreview(value)
    } else {
      setPreview(null)
    }
  }, [value])

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      onChange(file)
    }
  }

  const onRemove = () => {
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className={cn(
          'relative flex aspect-square w-32 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition hover:bg-muted',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {preview ? (
          <>
            <img src={preview} alt="Logo preview" className="h-full w-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                className="absolute right-0 top-0 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm transition hover:scale-110"
              >
                <X className="size-4" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImageIcon className="size-8" />
            <span className="text-xs">Logo</span>
          </div>
        )}
      </div>

      {preview && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onRemove}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 px-3 text-xs -mt-1 mb-1"
        >
          Remove Image
        </Button>
      )}

      <div className="flex flex-col items-center justify-center gap-2">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={onSelectFile}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 size-4" />
          {preview ? 'Change Image' : 'Select Image'}
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Square image, PNG/JPG/SVG (max 2 MB)
      </p>
    </div>
  )
}
