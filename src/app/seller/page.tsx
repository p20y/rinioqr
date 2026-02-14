'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { QRCodeSVG } from 'qrcode.react'
import { Trash2, ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface Product {
    id: string
    name: string
    asin: string
    created_at: string
    is_active: boolean
}

export default function SellerPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [name, setName] = useState('')
    const [asin, setAsin] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetchLoading, setFetchLoading] = useState(true)

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        setFetchLoading(true)
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching products:', error)
        } else {
            setProducts(data || [])
        }
        setFetchLoading(false)
    }

    const addProduct = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !asin) return

        setLoading(true)
        const { data, error } = await supabase
            .from('products')
            .insert([{ name, asin }])
            .select()

        if (error) {
            console.error('Error adding product:', error)
            alert('Error adding product')
        } else {
            setProducts([data[0], ...products])
            setName('')
            setAsin('')
        }
        setLoading(false)
    }

    const deleteProduct = async (id: string) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this product?')
        if (!confirmDelete) return

        const { error } = await supabase
            .from('products')
            .delete()
            .match({ id })

        if (error) {
            console.error('Error deleting product:', error)
            alert('Error deleting product')
        } else {
            setProducts(products.filter(p => p.id !== id))
        }
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

                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
                    <Button variant="outline" asChild>
                        <Link href="/">Back to Home</Link>
                    </Button>
                </div>

                {/* Add Product Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Product</CardTitle>
                        <CardDescription>Enter product details to generate a QR code.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={addProduct} className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="name">Product Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Wireless Mouse"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="asin">Amazon ASIN</Label>
                                <Input
                                    id="asin"
                                    placeholder="e.g. B08N5KWB9H"
                                    value={asin}
                                    onChange={(e) => setAsin(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Adding...' : 'Generate QR'}
                            </Button>
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
                                <Card key={product.id} className="overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2">
                                                <h3 className="font-bold text-xl">{product.name}</h3>
                                                <p className="text-sm text-gray-500">ASIN: {product.asin}</p>
                                                <p className="text-xs text-gray-400 font-mono">{product.id}</p>

                                                <div className="pt-4 flex gap-2 flex-wrap">
                                                    <Button
                                                        variant={product.is_active ? "default" : "secondary"}
                                                        size="sm"
                                                        onClick={() => toggleActive(product)}
                                                    >
                                                        {product.is_active ? 'Disable' : 'Enable'}
                                                    </Button>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={`/p/${product.id}`} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                            Test Link
                                                        </a>
                                                    </Button>
                                                    <Button variant="destructive" size="sm" onClick={() => deleteProduct(product.id)}>
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center space-y-2 bg-white p-2 rounded border">
                                                {origin && (
                                                    <QRCodeSVG
                                                        value={`${origin}/p/${product.id}`}
                                                        size={120}
                                                        level="H"
                                                        includeMargin={true}
                                                    />
                                                )}
                                                <span className="text-xs text-gray-500 font-medium">Scan for Review</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
