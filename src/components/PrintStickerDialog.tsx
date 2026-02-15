'use client'

import { useState, useRef, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Printer } from 'lucide-react'

interface Product {
    id: string
    name: string
    asin: string
    marketplace: string
    image_url: string | null
    is_active: boolean
}

interface PrintStickerDialogProps {
    product: Product | null
    open: boolean
    onOpenChange: (open: boolean) => void
    origin: string
}

type StickerSize = 'small' | 'medium' | 'large' | 'sheet'

export function PrintStickerDialog({ product, open, onOpenChange, origin }: PrintStickerDialogProps) {
    const [stickerSize, setStickerSize] = useState<StickerSize>('medium')
    const printRef = useRef<HTMLDivElement>(null)

    if (!product) return null

    const qrUrl = `${origin}/p/${product.id}`

    const handlePrint = () => {
        window.print()
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Print QR Code Sticker</DialogTitle>
                        <DialogDescription>
                            Choose a sticker size and print it to attach to your product packaging
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Product Preview */}
                        <div className="p-4 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-4">
                                {product.image_url && (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-16 h-16 object-contain rounded"
                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                    />
                                )}
                                <div>
                                    <h3 className="font-semibold">{product.name}</h3>
                                    <p className="text-sm text-gray-600">ASIN: {product.asin}</p>
                                </div>
                            </div>
                        </div>

                        {/* Size Selection */}
                        <div className="space-y-4">
                            <Label className="text-base font-semibold">Sticker Size</Label>
                            <RadioGroup value={stickerSize} onValueChange={(value) => setStickerSize(value as StickerSize)}>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <RadioGroupItem value="small" id="small" />
                                        <Label htmlFor="small" className="flex-grow cursor-pointer">
                                            <div className="font-medium">Small (2" × 2")</div>
                                            <div className="text-sm text-gray-500">Compact sticker for small packages</div>
                                        </Label>
                                        <div className="text-xs text-gray-400">5cm × 5cm</div>
                                    </div>

                                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <RadioGroupItem value="medium" id="medium" />
                                        <Label htmlFor="medium" className="flex-grow cursor-pointer">
                                            <div className="font-medium">Medium (3" × 3")</div>
                                            <div className="text-sm text-gray-500">Standard size for most packages</div>
                                        </Label>
                                        <div className="text-xs text-gray-400">7.6cm × 7.6cm</div>
                                    </div>

                                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <RadioGroupItem value="large" id="large" />
                                        <Label htmlFor="large" className="flex-grow cursor-pointer">
                                            <div className="font-medium">Large (4" × 4")</div>
                                            <div className="text-sm text-gray-500">Large sticker for big packages</div>
                                        </Label>
                                        <div className="text-xs text-gray-400">10cm × 10cm</div>
                                    </div>

                                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <RadioGroupItem value="sheet" id="sheet" />
                                        <Label htmlFor="sheet" className="flex-grow cursor-pointer">
                                            <div className="font-medium">Sheet (6 per page)</div>
                                            <div className="text-sm text-gray-500">Print multiple stickers on one page</div>
                                        </Label>
                                        <div className="text-xs text-gray-400">Letter size</div>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Preview */}
                        <div className="space-y-2 no-print">
                            <Label className="text-base font-semibold">Preview</Label>
                            <div className="border rounded-lg p-6 bg-white flex justify-center">
                                <StickerPreview product={product} qrUrl={qrUrl} size={stickerSize} />
                            </div>
                        </div>

                        {/* Print Button */}
                        <div className="flex gap-3 no-print">
                            <Button onClick={handlePrint} className="flex-1" size="lg">
                                <Printer className="h-4 w-4 mr-2" />
                                Print Sticker
                            </Button>
                            <Button variant="outline" onClick={() => onOpenChange(false)} size="lg">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Hidden Print Content */}
            <div className="print-only">
                <PrintContent product={product} qrUrl={qrUrl} size={stickerSize} />
            </div>

            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-only, .print-only * {
                        visibility: visible;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-only {
                        position: absolute;
                        left: 0;
                        top: 0;
                    }
                }
                @media screen {
                    .print-only {
                        display: none;
                    }
                }
            `}</style>
        </>
    )
}

// Preview Component
function StickerPreview({ product, qrUrl, size }: { product: Product; qrUrl: string; size: StickerSize }) {
    const sizes = {
        small: { width: 100, qr: 70 },
        medium: { width: 150, qr: 110 },
        large: { width: 200, qr: 160 },
        sheet: { width: 120, qr: 80 }
    }

    const config = sizes[size]

    if (size === 'sheet') {
        return (
            <div className="grid grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                    <div key={i} className="border-2 border-dashed border-gray-300 p-3 rounded">
                        <SingleSticker product={product} qrUrl={qrUrl} qrSize={config.qr} compact />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div style={{ width: config.width }}>
            <SingleSticker product={product} qrUrl={qrUrl} qrSize={config.qr} />
        </div>
    )
}

// Single Sticker Component
function SingleSticker({ product, qrUrl, qrSize, compact = false }: { product: Product; qrUrl: string; qrSize: number; compact?: boolean }) {
    return (
        <div className="flex flex-col items-center text-center space-y-2">
            <QRCodeSVG
                value={qrUrl}
                size={qrSize}
                level="H"
                includeMargin={true}
            />
            {!compact && (
                <>
                    <div className="text-xs font-semibold line-clamp-2 px-2">{product.name}</div>
                    <div className="text-[10px] text-gray-600">Scan to leave a review</div>
                </>
            )}
            {compact && (
                <div className="text-[10px] text-gray-600">Scan for review</div>
            )}
        </div>
    )
}

// Print Content Component
function PrintContent({ product, qrUrl, size }: { product: Product; qrUrl: string; size: StickerSize }) {
    if (size === 'sheet') {
        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.5in',
                padding: '0.5in',
                width: '8.5in',
                minHeight: '11in'
            }}>
                {Array(6).fill(0).map((_, i) => (
                    <div key={i} style={{
                        border: '2px dashed #ccc',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        height: '4in'
                    }}>
                        <div style={{ marginBottom: '10px' }}>
                            <QRCodeSVG value={qrUrl} size={180} level="H" includeMargin={true} />
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', margin: '8px 0', maxWidth: '200px' }}>
                            {product.name}
                        </div>
                        <div style={{ fontSize: '9px', color: '#666' }}>
                            Scan to leave a review
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const sizeMap = {
        small: { dimension: '2in', qrSize: 140 },
        medium: { dimension: '3in', qrSize: 200 },
        large: { dimension: '4in', qrSize: 280 }
    }

    const config = sizeMap[size as keyof typeof sizeMap]

    return (
        <div style={{
            width: config.dimension,
            height: config.dimension,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <div style={{ marginBottom: '12px' }}>
                <QRCodeSVG value={qrUrl} size={config.qrSize} level="H" includeMargin={true} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', margin: '10px 0 6px 0' }}>
                {product.name}
            </div>
            <div style={{ fontSize: '10px', color: '#666' }}>
                Scan to leave a review
            </div>
        </div>
    )
}
