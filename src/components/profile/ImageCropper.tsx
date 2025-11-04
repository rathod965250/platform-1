'use client'

import { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ImageCropperProps {
  imageSrc: string
  isOpen: boolean
  onClose: () => void
  onCropComplete: (croppedImageBlob: Blob) => void
}

type Area = {
  x: number
  y: number
  width: number
  height: number
}

export function ImageCropper({
  imageSrc,
  isOpen,
  onClose,
  onCropComplete,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
      setIsProcessing(false)
    }
  }, [isOpen])

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop)
  }, [])

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom)
  }, [])

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.src = url
    })

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('No 2d context')
    }

    // Since aspect is 1, the cropped area should be square
    // Use the width (or height, they should be equal) for the output size
    const size = Math.min(pixelCrop.width, pixelCrop.height)
    canvas.width = size
    canvas.height = size

    // Draw cropped image to square canvas
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      size,
      size,
      0,
      0,
      size,
      size
    )

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'))
            return
          }
          resolve(blob)
        },
        'image/jpeg',
        0.95
      )
    })
  }

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      toast.error('Please select a crop area')
      return
    }

    setIsProcessing(true)
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      onCropComplete(croppedImageBlob)
      onClose()
    } catch (error: any) {
      console.error('Error cropping image:', error)
      toast.error(error.message || 'Failed to crop image')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop Profile Picture</DialogTitle>
          <DialogDescription>
            Adjust the image to create a square profile picture
          </DialogDescription>
        </DialogHeader>
        <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden">
          <div className="relative w-full h-full">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteCallback}
              cropShape="rect"
              showGrid={false}
              style={{
                containerStyle: {
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                },
                cropAreaStyle: {
                  border: '2px solid rgb(59, 130, 246)',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                },
                mediaStyle: {
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                },
              }}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Zoom
            </label>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => {
                if (Array.isArray(value) && value.length > 0) {
                  setZoom(value[0])
                }
              }}
              className="w-full"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isProcessing || !croppedAreaPixels}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

