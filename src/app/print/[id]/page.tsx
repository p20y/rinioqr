'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Printer, ArrowLeft, Palette } from 'lucide-react'
import Link from 'next/link'

interface Product {
    id: string
    name: string
    asin: string
    marketplace: string
    image_url: string | null
    is_active: boolean
}

type StickerSize = 'small' | 'medium' | 'large' | 'sheet'
type StickerStyle = 'minimal' | 'standard' | 'branded' | 'custom'

export default function PrintPage() {
    const params = useParams()
    const router = useRouter()
    const { id } = params

    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [stickerSize, setStickerSize] = useState<StickerSize>('medium')
    const [stickerStyle, setStickerStyle] = useState<StickerStyle>('standard')
    const [customText, setCustomText] = useState('Scan to leave a review')
    const [customBrand, setCustomBrand] = useState('')
    const [origin, setOrigin] = useState('')

    useEffect(() => {
        setOrigin(window.location.origin)
        if (id) {
            fetchProduct(id as string)
        }
    }, [id])

    const fetchProduct = async (productId: string) => {
        setLoading(true)
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single()

        if (error || !data) {
            console.error('Error fetching product:', error)
        } else {
            setProduct(data as Product)
        }
        setLoading(false)
    }

    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p>Loading product...</p>
                </div>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="pt-6">
                        <p className="text-center text-red-600">Product not found</p>
                        <Button asChild className="w-full mt-4">
                            <Link href="/seller">Back to Dashboard</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const qrUrl = `${origin}/p/${product.id}`

    return (
        <>
            <div className="min-h-screen bg-gray-50 p-8 no-print">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" asChild>
                                <Link href="/seller">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Dashboard
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Print Stickers</h1>
                                <p className="text-gray-600 mt-1">Customize and print QR code stickers for {product.name}</p>
                            </div>
                        </div>
                        <Button onClick={handlePrint} size="lg" className="gap-2">
                            <Printer className="h-5 w-5" />
                            Print Stickers
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Side - Customization Options */}
                        <div className="space-y-6">
                            {/* Product Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        Product Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        {product.image_url && (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-20 h-20 object-contain rounded border bg-white"
                                                onError={(e) => e.currentTarget.style.display = 'none'}
                                            />
                                        )}
                                        <div>
                                            <h3 className="font-semibold text-lg">{product.name}</h3>
                                            <p className="text-sm text-gray-600">ASIN: {product.asin}</p>
                                            <p className="text-sm text-gray-600">Marketplace: {product.marketplace}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Sticker Size */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Sticker Size</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup value={stickerSize} onValueChange={(value) => setStickerSize(value as StickerSize)}>
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <RadioGroupItem value="small" id="size-small" />
                                                <Label htmlFor="size-small" className="flex-grow cursor-pointer">
                                                    <div className="font-medium">Small (2" × 2")</div>
                                                    <div className="text-sm text-gray-500">Compact for small packages</div>
                                                </Label>
                                            </div>

                                            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <RadioGroupItem value="medium" id="size-medium" />
                                                <Label htmlFor="size-medium" className="flex-grow cursor-pointer">
                                                    <div className="font-medium">Medium (3" × 3")</div>
                                                    <div className="text-sm text-gray-500">Standard size</div>
                                                </Label>
                                            </div>

                                            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <RadioGroupItem value="large" id="size-large" />
                                                <Label htmlFor="size-large" className="flex-grow cursor-pointer">
                                                    <div className="font-medium">Large (4" × 4")</div>
                                                    <div className="text-sm text-gray-500">For big packages</div>
                                                </Label>
                                            </div>

                                            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <RadioGroupItem value="sheet" id="size-sheet" />
                                                <Label htmlFor="size-sheet" className="flex-grow cursor-pointer">
                                                    <div className="font-medium">Sheet (6 per page)</div>
                                                    <div className="text-sm text-gray-500">Batch printing</div>
                                                </Label>
                                            </div>
                                        </div>
                                    </RadioGroup>
                                </CardContent>
                            </Card>

                            {/* Design Style */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Palette className="h-5 w-5" />
                                        Design Style
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup value={stickerStyle} onValueChange={(value) => setStickerStyle(value as StickerStyle)}>
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <RadioGroupItem value="minimal" id="style-minimal" />
                                                <Label htmlFor="style-minimal" className="flex-grow cursor-pointer">
                                                    <div className="font-medium">Minimal</div>
                                                    <div className="text-sm text-gray-500">QR code only</div>
                                                </Label>
                                            </div>

                                            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <RadioGroupItem value="standard" id="style-standard" />
                                                <Label htmlFor="style-standard" className="flex-grow cursor-pointer">
                                                    <div className="font-medium">Standard</div>
                                                    <div className="text-sm text-gray-500">QR code with instructions</div>
                                                </Label>
                                            </div>

                                            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <RadioGroupItem value="branded" id="style-branded" />
                                                <Label htmlFor="style-branded" className="flex-grow cursor-pointer">
                                                    <div className="font-medium">Branded</div>
                                                    <div className="text-sm text-gray-500">With product image and name</div>
                                                </Label>
                                            </div>

                                            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <RadioGroupItem value="custom" id="style-custom" />
                                                <Label htmlFor="style-custom" className="flex-grow cursor-pointer">
                                                    <div className="font-medium">Custom</div>
                                                    <div className="text-sm text-gray-500">Customize text and branding</div>
                                                </Label>
                                            </div>
                                        </div>
                                    </RadioGroup>

                                    {/* Custom Options */}
                                    {stickerStyle === 'custom' && (
                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <Label htmlFor="custom-text">Custom Message</Label>
                                                <Textarea
                                                    id="custom-text"
                                                    placeholder="Enter your custom message"
                                                    value={customText}
                                                    onChange={(e) => setCustomText(e.target.value)}
                                                    className="mt-1"
                                                    rows={2}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="custom-brand">Brand Name (Optional)</Label>
                                                <Input
                                                    id="custom-brand"
                                                    placeholder="Your brand name"
                                                    value={customBrand}
                                                    onChange={(e) => setCustomBrand(e.target.value)}
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Side - Preview */}
                        <div>
                            <Card className="sticky top-8">
                                <CardHeader>
                                    <CardTitle>Preview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 flex justify-center items-center min-h-[500px]">
                                        <StickerPreview
                                            product={product}
                                            qrUrl={qrUrl}
                                            size={stickerSize}
                                            style={stickerStyle}
                                            customText={customText}
                                            customBrand={customBrand}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-500 mt-4 text-center">
                                        This is how your sticker will appear when printed
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Content */}
            <div className="print-only">
                <PrintContent
                    product={product}
                    qrUrl={qrUrl}
                    size={stickerSize}
                    style={stickerStyle}
                    customText={customText}
                    customBrand={customBrand}
                />
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
                    @page {
                        margin: 0.5in;
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
function StickerPreview({ product, qrUrl, size, style, customText, customBrand }: {
    product: Product
    qrUrl: string
    size: StickerSize
    style: StickerStyle
    customText: string
    customBrand: string
}) {
    const sizes = {
        small: { width: 120, qr: 80 },
        medium: { width: 180, qr: 130 },
        large: { width: 240, qr: 180 },
        sheet: { width: 150, qr: 100 }
    }

    const config = sizes[size]

    if (size === 'sheet') {
        return (
            <div className="grid grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                    <div key={i} className="border-2 border-dashed border-gray-300 p-2 rounded">
                        <SingleSticker
                            product={product}
                            qrUrl={qrUrl}
                            qrSize={config.qr}
                            style={style}
                            customText={customText}
                            customBrand={customBrand}
                        />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div style={{ width: config.width }}>
            <SingleSticker
                product={product}
                qrUrl={qrUrl}
                qrSize={config.qr}
                style={style}
                customText={customText}
                customBrand={customBrand}
            />
        </div>
    )
}

// Single Sticker Component
function SingleSticker({ product, qrUrl, qrSize, style, customText, customBrand }: {
    product: Product
    qrUrl: string
    qrSize: number
    style: StickerStyle
    customText: string
    customBrand: string
}) {
    return (
        <div className="flex flex-col items-center text-center space-y-2">
            {style === 'branded' && product.image_url && (
                <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-12 object-contain mb-1"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                />
            )}

            {style === 'custom' && customBrand && (
                <div className="text-sm font-bold mb-1">{customBrand}</div>
            )}

            <QRCodeSVG
                value={qrUrl}
                size={qrSize}
                level="H"
                includeMargin={true}
            />

            {style !== 'minimal' && (
                <>
                    {style === 'branded' && (
                        <div className="text-xs font-semibold line-clamp-2 px-2">{product.name}</div>
                    )}
                    <div className="text-[10px] text-gray-600">
                        {style === 'custom' ? customText : 'Scan to leave a review'}
                    </div>
                </>
            )}
        </div>
    )
}

// Print Content Component
function PrintContent({ product, qrUrl, size, style, customText, customBrand }: {
    product: Product
    qrUrl: string
    size: StickerSize
    style: StickerStyle
    customText: string
    customBrand: string
}) {
    if (size === 'sheet') {
        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.5in',
                width: '100%'
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
                        minHeight: '3.5in',
                        pageBreakInside: 'avoid'
                    }}>
                        <PrintSticker
                            product={product}
                            qrUrl={qrUrl}
                            qrSize={180}
                            style={style}
                            customText={customText}
                            customBrand={customBrand}
                        />
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
            <PrintSticker
                product={product}
                qrUrl={qrUrl}
                qrSize={config.qrSize}
                style={style}
                customText={customText}
                customBrand={customBrand}
            />
        </div>
    )
}

// Print Sticker Component
function PrintSticker({ product, qrUrl, qrSize, style, customText, customBrand }: {
    product: Product
    qrUrl: string
    qrSize: number
    style: StickerStyle
    customText: string
    customBrand: string
}) {
    return (
        <>
            {style === 'branded' && product.image_url && (
                <img
                    src={product.image_url}
                    alt={product.name}
                    style={{ height: '60px', objectFit: 'contain', marginBottom: '10px' }}
                    onError={(e) => e.currentTarget.style.display = 'none'}
                />
            )}

            {style === 'custom' && customBrand && (
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>{customBrand}</div>
            )}

            <div style={{ marginBottom: style === 'minimal' ? 0 : '12px' }}>
                <QRCodeSVG value={qrUrl} size={qrSize} level="H" includeMargin={true} />
            </div>

            {style !== 'minimal' && (
                <>
                    {style === 'branded' && (
                        <div style={{ fontSize: '13px', fontWeight: 'bold', margin: '10px 0 6px 0' }}>
                            {product.name}
                        </div>
                    )}
                    <div style={{ fontSize: '10px', color: '#666' }}>
                        {style === 'custom' ? customText : 'Scan to leave a review'}
                    </div>
                </>
            )}
        </>
    )
}
