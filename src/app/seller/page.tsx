'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { QRCodeSVG } from 'qrcode.react'
import { Trash2, ExternalLink, RefreshCw, Printer, LogOut, Crown } from 'lucide-react'
import Link from 'next/link'
import { AuthDebug } from '@/components/AuthDebug'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Alert,
    AlertDescription
} from "@/components/ui/alert"

interface Product {
    id: string
    name: string
    asin: string
    marketplace: string
    image_url: string | null
    created_at: string
    is_active: boolean
}

// Amazon marketplace configurations
const AMAZON_MARKETPLACES: Record<string, { domain: string; name: string; flag: string }> = {
    'amazon.com': { domain: 'amazon.com', name: 'United States', flag: '🇺🇸' },
    'amazon.ca': { domain: 'amazon.ca', name: 'Canada', flag: '🇨🇦' },
    'amazon.com.mx': { domain: 'amazon.com.mx', name: 'Mexico', flag: '🇲🇽' },
    'amazon.co.uk': { domain: 'amazon.co.uk', name: 'United Kingdom', flag: '🇬🇧' },
    'amazon.de': { domain: 'amazon.de', name: 'Germany', flag: '🇩🇪' },
    'amazon.fr': { domain: 'amazon.fr', name: 'France', flag: '🇫🇷' },
    'amazon.it': { domain: 'amazon.it', name: 'Italy', flag: '🇮🇹' },
    'amazon.es': { domain: 'amazon.es', name: 'Spain', flag: '🇪🇸' },
    'amazon.in': { domain: 'amazon.in', name: 'India', flag: '🇮🇳' },
    'amazon.co.jp': { domain: 'amazon.co.jp', name: 'Japan', flag: '🇯🇵' },
    'amazon.com.au': { domain: 'amazon.com.au', name: 'Australia', flag: '🇦🇺' },
    'amazon.sg': { domain: 'amazon.sg', name: 'Singapore', flag: '🇸🇬' },
    'amazon.ae': { domain: 'amazon.ae', name: 'UAE', flag: '🇦🇪' },
    'amazon.nl': { domain: 'amazon.nl', name: 'Netherlands', flag: '🇳🇱' },
    'amazon.sa': { domain: 'amazon.sa', name: 'Saudi Arabia', flag: '🇸🇦' },
}

// Parse Amazon URL to extract ASIN and marketplace
function parseAmazonUrl(url: string): { asin: string; marketplace: string } | null {
    try {
        const urlObj = new URL(url.trim())
        const hostname = urlObj.hostname.replace('www.', '')

        // Check if it's a valid Amazon domain
        if (!Object.keys(AMAZON_MARKETPLACES).includes(hostname)) {
            return null
        }

        // Extract ASIN from various Amazon URL formats
        // Format 1: /dp/{ASIN}
        // Format 2: /gp/product/{ASIN}
        // Format 3: /product/{ASIN}
        const dpMatch = urlObj.pathname.match(/\/dp\/([A-Z0-9]{10})/)
        const productMatch = urlObj.pathname.match(/\/(?:gp\/)?product\/([A-Z0-9]{10})/)

        const asin = dpMatch?.[1] || productMatch?.[1]

        if (!asin) {
            return null
        }

        return {
            asin,
            marketplace: hostname
        }
    } catch {
        return null
    }
}

export default function SellerPage() {
    const router = useRouter()
    const { user, userMetadata, signOut, canAddProduct, refreshUserMetadata } = useAuth()
    const [products, setProducts] = useState<Product[]>([])
    const [productUrl, setProductUrl] = useState('')
    const [name, setName] = useState('')
    const [asin, setAsin] = useState('')
    const [marketplace, setMarketplace] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetchLoading, setFetchLoading] = useState(true)
    const [productToDelete, setProductToDelete] = useState<Product | null>(null)
    const [urlError, setUrlError] = useState('')
    const [showLimitWarning, setShowLimitWarning] = useState(false)

    useEffect(() => {
        if (user) {
            fetchProducts()
        }
    }, [user])

    const fetchProducts = async () => {
        if (!user) return

        setFetchLoading(true)
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching products:', error)
        } else {
            setProducts(data || [])
        }
        setFetchLoading(false)
    }

    // Fetch product image from Amazon page
    const fetchProductImage = async (url: string, asin: string) => {
        try {
            // Call our API route to fetch the image
            const response = await fetch(`/api/fetch-product-image?url=${encodeURIComponent(url)}&asin=${asin}`)
            const data = await response.json()

            if (data.imageUrl) {
                setImageUrl(data.imageUrl)
            } else {
                // Fallback: try a generic Amazon image URL
                setImageUrl(`https://images-na.ssl-images-amazon.com/images/P/${asin}.jpg`)
            }
        } catch (error) {
            console.error('Error fetching product image:', error)
            // Fallback to generic URL
            setImageUrl(`https://images-na.ssl-images-amazon.com/images/P/${asin}.jpg`)
        }
    }

    // Handle Amazon URL input
    const handleUrlChange = async (url: string) => {
        setProductUrl(url)
        setUrlError('')

        if (!url.trim()) {
            setAsin('')
            setMarketplace('')
            setName('')
            setImageUrl('')
            return
        }

        const parsed = parseAmazonUrl(url)
        if (parsed) {
            setAsin(parsed.asin)
            setMarketplace(parsed.marketplace)
            setUrlError('')

            // Auto-generate product name from ASIN (user can override)
            if (!name) {
                setName(`Product ${parsed.asin}`)
            }

            // Automatically fetch product image
            setImageUrl('') // Clear previous image
            await fetchProductImage(url, parsed.asin)
        } else if (url.length > 10) {
            setUrlError('Invalid Amazon URL. Please enter a valid product URL.')
            setAsin('')
            setMarketplace('')
        }
    }

    const addProduct = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !asin || !marketplace) {
            alert('Please enter a valid Amazon product URL')
            return
        }

        // Wait for user metadata to load
        if (!userMetadata) {
            alert('Loading your account information, please try again in a moment...')
            return
        }

        // Check product limit
        if (!canAddProduct()) {
            setShowLimitWarning(true)
            return
        }

        if (!user) {
            alert('You must be logged in to add products')
            return
        }

        setLoading(true)
        const { data, error } = await supabase
            .from('products')
            .insert({
                name,
                asin,
                marketplace,
                image_url: imageUrl || null,
                user_id: user.id
            })
            .select()
            .single()

        if (error || !data) {
            console.error('Error adding product:', error)
            alert('Error adding product')
        } else {
            setProducts([data, ...products])
            setProductUrl('')
            setName('')
            setAsin('')
            setMarketplace('')
            setImageUrl('')
            // Refresh user metadata to update product count
            await refreshUserMetadata()
        }
        setLoading(false)
    }

    const handleDeleteClick = (product: Product) => {
        setProductToDelete(product)
    }

    const confirmDelete = async () => {
        if (!productToDelete) return

        const { error } = await supabase
            .from('products')
            .delete()
            .match({ id: productToDelete.id })

        if (error) {
            console.error('Error deleting product:', error)
            alert('Error deleting product')
        } else {
            setProducts(products.filter(p => p.id !== productToDelete.id))
            // Refresh user metadata to update product count
            await refreshUserMetadata()
        }
        setProductToDelete(null)
    }

    const handleSignOut = async () => {
        // signOut() will handle the redirect to /login
        await signOut()
    }

    const toggleActive = async (product: Product) => {
        const newValue = !product.is_active
        const { error } = await supabase
            .from('products')
            .update({ is_active: newValue })
            .eq('id', product.id)

        if (error) {
            console.error('Error updating product:', error)
            alert('Error updating status')
        } else {
            setProducts(products.map(p => p.id === product.id ? { ...p, is_active: newValue } : p))
        }
    }

    // Get current host for QR code URL
    const [origin, setOrigin] = useState('')
    useEffect(() => {
        setOrigin(window.location.origin)
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header with User Info */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
                        {userMetadata && (
                            <p className="text-sm text-gray-600 mt-1">
                                Welcome back, {userMetadata.full_name || userMetadata.email}
                            </p>
                        )}
                    </div>
                    <Button variant="outline" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </Button>
                </div>

                {/* Usage Stats Card */}
                {userMetadata && (
                    <Card className={`border-2 ${userMetadata.current_product_count >= userMetadata.product_limit ? 'border-amber-500 bg-amber-50' : 'border-blue-500 bg-blue-50'}`}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold capitalize">
                                            {userMetadata.subscription_status} Plan
                                        </h3>
                                        {userMetadata.subscription_status !== 'free' && (
                                            <Crown className="h-5 w-5 text-amber-500" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Products: <span className="font-semibold">{userMetadata.current_product_count} / {userMetadata.product_limit}</span>
                                    </p>
                                    {userMetadata.total_scans > 0 && (
                                        <p className="text-sm text-gray-600">
                                            Total QR Scans: <span className="font-semibold">{userMetadata.total_scans.toLocaleString()}</span>
                                        </p>
                                    )}
                                </div>
                                <div>
                                    {userMetadata.current_product_count >= userMetadata.product_limit ? (
                                        <Button onClick={() => router.push('/billing')} variant="default">
                                            Upgrade Plan
                                        </Button>
                                    ) : userMetadata.subscription_status === 'free' && (
                                        <Button onClick={() => router.push('/billing')} variant="outline">
                                            Upgrade to unlock more
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Limit Warning Alert */}
                {showLimitWarning && (
                    <Alert variant="destructive">
                        <AlertDescription className="flex items-center justify-between">
                            <span>
                                You've reached your product limit ({userMetadata?.product_limit} products).
                                Upgrade your plan to add more products.
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowLimitWarning(false)}
                                >
                                    Dismiss
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => router.push('/billing')}
                                >
                                    Upgrade Now
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Add Product Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Product</CardTitle>
                        <CardDescription>Paste your Amazon product URL to auto-extract details and generate a QR code.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={addProduct} className="space-y-4">
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="productUrl">Amazon Product URL</Label>
                                <Input
                                    id="productUrl"
                                    placeholder="https://www.amazon.com/dp/B08N5KWB9H"
                                    value={productUrl}
                                    onChange={(e) => handleUrlChange(e.target.value)}
                                    className={urlError ? 'border-red-500' : ''}
                                />
                                {urlError && <p className="text-sm text-red-500">{urlError}</p>}
                                {marketplace && (
                                    <p className="text-sm text-green-600">
                                        ✓ Detected: {AMAZON_MARKETPLACES[marketplace]?.flag} {AMAZON_MARKETPLACES[marketplace]?.name} - ASIN: {asin}
                                    </p>
                                )}
                            </div>

                            {asin && marketplace && (
                                <>
                                    <div className="grid w-full gap-1.5">
                                        <Label htmlFor="name">Product Name (Optional)</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. Wireless Mouse"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                        <p className="text-xs text-gray-500">Leave empty to use ASIN as name</p>
                                    </div>

                                    {imageUrl && (
                                        <div className="grid w-full gap-1.5">
                                            <Label>Product Image Preview</Label>
                                            <div className="p-4 bg-gray-50 rounded border">
                                                <img
                                                    src={imageUrl}
                                                    alt="Product preview"
                                                    className="h-32 object-contain mx-auto"
                                                    onError={(e) => {
                                                        const target = e.currentTarget as HTMLImageElement
                                                        target.style.display = 'none'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <Button type="submit" disabled={loading || !userMetadata} className="w-full">
                                        {loading ? 'Adding...' : !userMetadata ? 'Loading...' : 'Generate QR Code'}
                                    </Button>
                                </>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Product List */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-semibold">Your Products</h2>
                        <Button variant="ghost" size="sm" onClick={fetchProducts} disabled={fetchLoading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${fetchLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>

                    {fetchLoading ? (
                        <div className="text-center py-10">Loading products...</div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">No products found. Add one above!</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {products.map((product) => (
                                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex gap-4">
                                            {/* Product Image */}
                                            <div className="flex-shrink-0">
                                                {product.image_url ? (
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="w-24 h-24 object-contain rounded border bg-white"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none'
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-24 h-24 bg-gray-100 rounded border flex items-center justify-center">
                                                        <span className="text-gray-400 text-xs">No Image</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Product Details */}
                                            <div className="flex-grow space-y-2">
                                                <div>
                                                    <h3 className="font-bold text-lg leading-tight">{product.name}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-sm text-gray-600">
                                                            {AMAZON_MARKETPLACES[product.marketplace]?.flag} {AMAZON_MARKETPLACES[product.marketplace]?.name}
                                                        </span>
                                                        <span className="text-xs text-gray-400">•</span>
                                                        <span className="text-sm text-gray-500">ASIN: {product.asin}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {product.is_active ? '● Active' : '○ Disabled'}
                                                    </span>
                                                </div>

                                                <div className="pt-2 flex gap-2 flex-wrap">
                                                    <Button
                                                        variant={product.is_active ? "outline" : "default"}
                                                        size="sm"
                                                        onClick={() => toggleActive(product)}
                                                    >
                                                        {product.is_active ? 'Disable' : 'Enable'}
                                                    </Button>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/print/${product.id}`}>
                                                            <Printer className="h-4 w-4 mr-2" />
                                                            Print
                                                        </Link>
                                                    </Button>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={`/p/${product.id}`} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                            Test
                                                        </a>
                                                    </Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(product)}>
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* QR Code */}
                                            <div className="flex-shrink-0">
                                                <div className="flex flex-col items-center space-y-1 bg-white p-2 rounded border">
                                                    {origin && (
                                                        <QRCodeSVG
                                                            value={`${origin}/p/${product.id}`}
                                                            size={100}
                                                            level="H"
                                                            includeMargin={true}
                                                        />
                                                    )}
                                                    <span className="text-xs text-gray-500 font-medium">Scan</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{productToDelete?.name}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Debug component - shows auth state */}
            <AuthDebug />
        </div>
    )
}
