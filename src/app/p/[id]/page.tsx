'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Star } from 'lucide-react'

interface Product {
    id: string
    name: string
    asin: string
    marketplace: string
    image_url: string | null
    is_active: boolean
}

export default function ConsumerPage() {
    const params = useParams()
    const { id } = params

    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
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

        if (error) {
            console.error('Error fetching product:', error)
            setError('Product not found or invalid QR code.')
        } else {
            if (!data.is_active) {
                // Redirect to Amazon Product Page if disabled (using correct marketplace)
                window.location.href = `https://${data.marketplace}/dp/${data.asin}`
                return
            }
            setProduct(data)
        }
        setLoading(false)
    }

    const handleLeaveReview = () => {
        if (!product) return
        // Deep link to Amazon Create Review page (using correct marketplace)
        const amazonReviewUrl = `https://${product.marketplace}/review/create-review?asin=${product.asin}`
        window.location.href = amazonReviewUrl
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    <p className="text-gray-500">Loading product details...</p>
                </div>
            </div>
        )
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-700">Error</CardTitle>
                        <CardDescription className="text-red-600">{error || 'Something went wrong.'}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
            <Card className="max-w-md w-full shadow-lg border-orange-100">
                <CardHeader className="text-center space-y-4">
                    {/* Product Image */}
                    {product.image_url ? (
                        <div className="mx-auto mb-2">
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-32 object-contain mx-auto rounded"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                }}
                            />
                        </div>
                    ) : (
                        <div className="mx-auto bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mb-2">
                            <Star className="h-8 w-8 text-orange-500 fill-orange-500" />
                        </div>
                    )}

                    <CardTitle className="text-2xl font-bold text-gray-900">Enjoying your purchase?</CardTitle>
                    <CardDescription className="text-lg text-gray-600">
                        We'd love to hear your feedback on: <br />
                        <span className="font-semibold text-gray-900 block mt-1">{product.name}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-sm text-center text-gray-600 border border-gray-100">
                        Sharing your experience helps others make better choices and helps us improve our products.
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3">
                    <Button
                        className="w-full h-14 text-lg bg-[#FF9900] hover:bg-[#e68a00] text-white font-bold shadow-md transition-all hover:scale-[1.02]"
                        onClick={handleLeaveReview}
                    >
                        Leave a Review on Amazon
                    </Button>
                    <p className="text-xs text-center text-gray-400 mt-2">
                        You will be redirected to {product.marketplace} securely.
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
