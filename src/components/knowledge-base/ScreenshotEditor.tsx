'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  ArrowRight,
  Highlighter,
  Type,
  Circle,
  Undo,
  Redo,
  Save,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type AnnotationTool = 'arrow' | 'highlight' | 'text' | 'blur' | 'circle' | 'none'

interface Point {
  x: number
  y: number
}

interface Annotation {
  type: AnnotationTool
  points: Point[]
  text?: string
  color?: string
  width?: number
}

interface ScreenshotEditorProps {
  imageUrl: string
  onSave: (editedImageData: string, annotations: Annotation[]) => Promise<void>
  onCancel: () => void
}

export default function ScreenshotEditor({
  imageUrl,
  onSave,
  onCancel,
}: ScreenshotEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [selectedTool, setSelectedTool] = useState<AnnotationTool>('none')
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [undoStack, setUndoStack] = useState<Annotation[][]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null)
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState<Point | null>(null)
  const [color, setColor] = useState('#FF0000')
  const [lineWidth, setLineWidth] = useState(3)
  const [saving, setSaving] = useState(false)

  // Load image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImage(img)
      redrawCanvas(img, [])
    }
    img.src = imageUrl
  }, [imageUrl])

  // Redraw canvas with image and annotations
  const redrawCanvas = (img: HTMLImageElement, annots: Annotation[]) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions to match image
    canvas.width = img.width
    canvas.height = img.height

    // Draw image
    ctx.drawImage(img, 0, 0)

    // Draw all annotations
    annots.forEach((annotation) => {
      drawAnnotation(ctx, annotation)
    })
  }

  // Draw a single annotation
  const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    ctx.strokeStyle = annotation.color || color
    ctx.fillStyle = annotation.color || color
    ctx.lineWidth = annotation.width || lineWidth

    const points = annotation.points

    switch (annotation.type) {
      case 'arrow':
        if (points.length === 2) {
          drawArrow(ctx, points[0], points[1])
        }
        break

      case 'highlight':
        if (points.length >= 2) {
          ctx.globalAlpha = 0.3
          ctx.strokeStyle = annotation.color || color
          ctx.lineWidth = 20
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.beginPath()
          ctx.moveTo(points[0].x, points[0].y)
          points.forEach((point) => {
            ctx.lineTo(point.x, point.y)
          })
          ctx.stroke()
          ctx.globalAlpha = 1.0
        }
        break

      case 'text':
        if (points.length > 0 && annotation.text) {
          ctx.font = '24px Arial'
          ctx.fillStyle = annotation.color || color
          ctx.fillText(annotation.text, points[0].x, points[0].y)
        }
        break

      case 'blur':
        if (points.length === 2) {
          const x = Math.min(points[0].x, points[1].x)
          const y = Math.min(points[0].y, points[1].y)
          const width = Math.abs(points[1].x - points[0].x)
          const height = Math.abs(points[1].y - points[0].y)

          // Simple pixelation effect for blur
          const imageData = ctx.getImageData(x, y, width, height)
          const pixelSize = 10

          for (let py = 0; py < height; py += pixelSize) {
            for (let px = 0; px < width; px += pixelSize) {
              const i = (py * width + px) * 4
              const r = imageData.data[i]
              const g = imageData.data[i + 1]
              const b = imageData.data[i + 2]

              // Fill pixelSize x pixelSize block with average color
              for (let dy = 0; dy < pixelSize && py + dy < height; dy++) {
                for (let dx = 0; dx < pixelSize && px + dx < width; dx++) {
                  const di = ((py + dy) * width + (px + dx)) * 4
                  imageData.data[di] = r
                  imageData.data[di + 1] = g
                  imageData.data[di + 2] = b
                }
              }
            }
          }

          ctx.putImageData(imageData, x, y)
        }
        break

      case 'circle':
        if (points.length === 2) {
          const radius = Math.sqrt(
            Math.pow(points[1].x - points[0].x, 2) +
            Math.pow(points[1].y - points[0].y, 2)
          )
          ctx.beginPath()
          ctx.arc(points[0].x, points[0].y, radius, 0, 2 * Math.PI)
          ctx.stroke()
        }
        break
    }
  }

  // Draw arrow with arrowhead
  const drawArrow = (ctx: CanvasRenderingContext2D, from: Point, to: Point) => {
    const headLength = 20
    const angle = Math.atan2(to.y - from.y, to.x - from.x)

    // Draw line
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()

    // Draw arrowhead
    ctx.beginPath()
    ctx.moveTo(to.x, to.y)
    ctx.lineTo(
      to.x - headLength * Math.cos(angle - Math.PI / 6),
      to.y - headLength * Math.sin(angle - Math.PI / 6)
    )
    ctx.moveTo(to.x, to.y)
    ctx.lineTo(
      to.x - headLength * Math.cos(angle + Math.PI / 6),
      to.y - headLength * Math.sin(angle + Math.PI / 6)
    )
    ctx.stroke()
  }

  // Get mouse position relative to canvas
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  // Mouse down handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'none') return

    const pos = getMousePos(e)

    if (selectedTool === 'text') {
      setTextPosition(pos)
      return
    }

    setIsDrawing(true)
    setCurrentAnnotation({
      type: selectedTool,
      points: [pos],
      color,
      width: lineWidth,
    })
  }

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation || !image) return

    const pos = getMousePos(e)

    if (currentAnnotation.type === 'highlight') {
      // Add points for freehand drawing
      const updatedAnnotation = {
        ...currentAnnotation,
        points: [...currentAnnotation.points, pos],
      }
      setCurrentAnnotation(updatedAnnotation)
      redrawCanvas(image, [...annotations, updatedAnnotation])
    } else {
      // Update endpoint for arrow, circle, blur
      const updatedAnnotation = {
        ...currentAnnotation,
        points: [currentAnnotation.points[0], pos],
      }
      setCurrentAnnotation(updatedAnnotation)
      redrawCanvas(image, [...annotations, updatedAnnotation])
    }
  }

  // Mouse up handler
  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return

    setIsDrawing(false)

    // Save annotation to stack
    const newAnnotations = [...annotations, currentAnnotation]
    setAnnotations(newAnnotations)
    setUndoStack([...undoStack, annotations])
    setCurrentAnnotation(null)

    if (image) {
      redrawCanvas(image, newAnnotations)
    }
  }

  // Add text annotation
  const handleAddText = () => {
    if (!textPosition || !textInput.trim() || !image) return

    const textAnnotation: Annotation = {
      type: 'text',
      points: [textPosition],
      text: textInput,
      color,
    }

    const newAnnotations = [...annotations, textAnnotation]
    setAnnotations(newAnnotations)
    setUndoStack([...undoStack, annotations])
    redrawCanvas(image, newAnnotations)

    // Reset text input
    setTextInput('')
    setTextPosition(null)
  }

  // Undo annotation
  const handleUndo = () => {
    if (undoStack.length === 0) return

    const previousState = undoStack[undoStack.length - 1]
    setAnnotations(previousState)
    setUndoStack(undoStack.slice(0, -1))

    if (image) {
      redrawCanvas(image, previousState)
    }
  }

  // Save edited image
  const handleSave = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setSaving(true)
    try {
      const editedImageData = canvas.toDataURL('image/png')
      await onSave(editedImageData, annotations)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-7xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Edit Screenshot</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 p-4 bg-muted rounded-lg">
            {/* Tools */}
            <div className="flex gap-1">
              <Button
                variant={selectedTool === 'arrow' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('arrow')}
                title="Arrow"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant={selectedTool === 'highlight' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('highlight')}
                title="Highlight"
              >
                <Highlighter className="w-4 h-4" />
              </Button>
              <Button
                variant={selectedTool === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('text')}
                title="Text"
              >
                <Type className="w-4 h-4" />
              </Button>
              <Button
                variant={selectedTool === 'blur' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('blur')}
                title="Blur"
              >
                <div className="w-4 h-4 rounded-full bg-current opacity-50" />
              </Button>
              <Button
                variant={selectedTool === 'circle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('circle')}
                title="Circle"
              >
                <Circle className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Color picker */}
            <div className="flex items-center gap-2">
              <Label htmlFor="color" className="text-sm">
                Color:
              </Label>
              <input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-8 rounded border cursor-pointer"
              />
            </div>

            {/* Line width */}
            <div className="flex items-center gap-2">
              <Label htmlFor="lineWidth" className="text-sm">
                Width:
              </Label>
              <Input
                id="lineWidth"
                type="number"
                min="1"
                max="20"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-16"
              />
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Undo/Redo */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Save */}
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>

          {/* Text input dialog */}
          {textPosition && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <Label htmlFor="textInput">Enter text:</Label>
              <div className="flex gap-2">
                <Input
                  id="textInput"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your text..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddText()
                    if (e.key === 'Escape') setTextPosition(null)
                  }}
                  autoFocus
                />
                <Button onClick={handleAddText} disabled={!textInput.trim()}>
                  Add
                </Button>
                <Button variant="outline" onClick={() => setTextPosition(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Canvas */}
          <div className="border rounded-lg overflow-auto max-h-[60vh] bg-muted/50">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={cn(
                'max-w-full h-auto',
                selectedTool !== 'none' && 'cursor-crosshair'
              )}
            />
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Instructions:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Select a tool from the toolbar</li>
              <li>Arrow: Click and drag to draw an arrow</li>
              <li>Highlight: Click and drag to draw freehand highlights</li>
              <li>Text: Click where you want to add text, then type</li>
              <li>Blur: Click and drag to select area to pixelate</li>
              <li>Circle: Click center point and drag to size</li>
              <li>Use Undo to remove the last annotation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
