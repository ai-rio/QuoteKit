'use client'

import { useEffect, useState } from 'react'
import { 
  AlertCircle,
  CheckCircle, 
  CreditCard, 
  DollarSign,
  Edit3, 
  Package,
  Plus, 
  RefreshCw, 
  Trash2} from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface StripeProduct {
  id: string | null
  stripe_product_id: string
  name: string
  description?: string
  active: boolean
  default_price?: any
  created?: number
  updated?: number
  images?: string[]
  metadata?: any
  created_at?: string
  updated_at?: string
}

interface StripePrice {
  id: string | null
  stripe_price_id: string
  stripe_product_id: string
  product_name?: string
  unit_amount: number
  currency: string
  recurring_interval?: string | null
  active: boolean
  created?: number
  metadata?: any
  created_at?: string
  updated_at?: string
}

export default function PricingManagementPage() {
  const [products, setProducts] = useState<StripeProduct[]>([])
  const [prices, setPrices] = useState<StripePrice[]>([])
  const [loading, setLoading] = useState({ products: false, prices: false })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Product creation state
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    active: true
  })
  
  // Product edit state
  const [showEditProductDialog, setShowEditProductDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<StripeProduct | null>(null)
  
  // Price creation state
  const [showPriceDialog, setShowPriceDialog] = useState(false)
  const [newPrice, setNewPrice] = useState({
    product_id: '',
    unit_amount: '',
    currency: 'usd',
    recurring_interval: '' as '' | 'month' | 'year',
    active: true
  })

  // Price edit state
  const [showEditPriceDialog, setShowEditPriceDialog] = useState(false)
  const [editingPrice, setEditingPrice] = useState<StripePrice | null>(null)

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    title: string
    message: string
    action: () => void
    destructive?: boolean
  } | null>(null)

  useEffect(() => {
    fetchProducts()
    fetchPrices()
  }, [])

  const fetchProducts = async () => {
    setLoading(prev => ({ ...prev, products: true }))
    try {
      const response = await fetch('/api/admin/stripe-config/products')
      const data = await response.json()
      
      if (response.ok) {
        setProducts(data.products || [])
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch products' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch products' })
    } finally {
      setLoading(prev => ({ ...prev, products: false }))
    }
  }

  const fetchPrices = async () => {
    setLoading(prev => ({ ...prev, prices: true }))
    try {
      const response = await fetch('/api/admin/stripe-config/prices')
      const data = await response.json()
      
      if (response.ok) {
        setPrices(data.prices || [])
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch prices' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch prices' })
    } finally {
      setLoading(prev => ({ ...prev, prices: false }))
    }
  }

  const createProduct = async () => {
    if (!newProduct.name.trim()) {
      setMessage({ type: 'error', text: 'Product name is required' })
      return
    }

    try {
      const response = await fetch('/api/admin/stripe-config/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          description: newProduct.description,
          active: newProduct.active
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Product created successfully!' })
        setShowProductDialog(false)
        setNewProduct({ name: '', description: '', active: true })
        fetchProducts() // Refresh products list
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create product' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create product' })
    }
  }

  const updateProduct = async () => {
    if (!editingProduct) return

    try {
      const response = await fetch('/api/admin/stripe-config/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripe_product_id: editingProduct.stripe_product_id,
          name: editingProduct.name,
          description: editingProduct.description,
          active: editingProduct.active
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Product updated successfully!' })
        setShowEditProductDialog(false)
        setEditingProduct(null)
        fetchProducts() // Refresh products list
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update product' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update product' })
    }
  }

  const deleteProduct = async (product: StripeProduct) => {
    try {
      const response = await fetch('/api/admin/stripe-config/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripe_product_id: product.stripe_product_id
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Product deleted successfully!' })
        fetchProducts() // Refresh products list
      } else {
        if (data.has_prices) {
          setMessage({ type: 'error', text: 'Cannot delete product with associated prices. Archive the product instead.' })
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to delete product' })
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete product' })
    }
  }

  const toggleProductActive = async (product: StripeProduct) => {
    try {
      const response = await fetch('/api/admin/stripe-config/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripe_product_id: product.stripe_product_id,
          active: !product.active
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Product ${!product.active ? 'activated' : 'archived'} successfully!` })
        fetchProducts() // Refresh products list
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update product' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update product' })
    }
  }

  const createPrice = async () => {
    if (!newPrice.product_id || !newPrice.unit_amount) {
      setMessage({ type: 'error', text: 'Product and unit amount are required' })
      return
    }

    const unitAmountCents = Math.round(parseFloat(newPrice.unit_amount) * 100)
    if (isNaN(unitAmountCents) || unitAmountCents <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' })
      return
    }

    try {
      const response = await fetch('/api/admin/stripe-config/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: newPrice.product_id,
          unit_amount: unitAmountCents,
          currency: newPrice.currency,
          recurring_interval: newPrice.recurring_interval || null,
          active: newPrice.active
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Price created successfully!' })
        setShowPriceDialog(false)
        setNewPrice({ product_id: '', unit_amount: '', currency: 'usd', recurring_interval: '', active: true })
        fetchPrices() // Refresh prices list
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create price' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create price' })
    }
  }

  const updatePrice = async () => {
    if (!editingPrice) return

    try {
      const response = await fetch('/api/admin/stripe-config/prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripe_price_id: editingPrice.stripe_price_id,
          active: editingPrice.active,
          metadata: editingPrice.metadata
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Price updated successfully!' })
        setShowEditPriceDialog(false)
        setEditingPrice(null)
        fetchPrices() // Refresh prices list
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update price' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update price' })
    }
  }

  const togglePriceActive = async (price: StripePrice) => {
    try {
      const response = await fetch('/api/admin/stripe-config/prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripe_price_id: price.stripe_price_id,
          active: !price.active
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Price ${!price.active ? 'activated' : 'archived'} successfully!` })
        fetchPrices() // Refresh prices list
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update price' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update price' })
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const getRecurringText = (interval: string | null | undefined) => {
    if (!interval) return 'One-time'
    return interval === 'month' ? 'Monthly' : interval === 'year' ? 'Yearly' : interval
  }

  const showConfirmation = (title: string, message: string, action: () => void, destructive = false) => {
    setConfirmAction({ title, message, action, destructive })
    setShowConfirmDialog(true)
  }

  const executeConfirmAction = () => {
    if (confirmAction) {
      confirmAction.action()
    }
    setShowConfirmDialog(false)
    setConfirmAction(null)
  }

  return (
    <div className="space-y-8 bg-light-concrete min-h-screen p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-quote-header text-charcoal font-bold">
          Pricing Management
        </h1>
        <p className="text-charcoal/70">
          Manage your Stripe products and pricing plans
        </p>
      </div>

      {/* Global Alert Messages */}
      {message && (
        <Alert className={message.type === 'error' ? 'border-error-red bg-error-red/10' : 'border-success-green bg-success-green/10'}>
          <AlertDescription className={message.type === 'error' ? 'text-error-red' : 'text-success-green'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Products Section */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-section-title text-charcoal">
                <Package className="w-5 h-5" />
                Products
              </CardTitle>
              <CardDescription className="text-charcoal/70">
                Manage your subscription products and services
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchProducts}
                disabled={loading.products}
                variant="outline"
                size="sm"
                className="bg-paper-white text-forest-green border-2 border-forest-green hover:bg-forest-green hover:text-paper-white font-bold transition-all duration-200"
              >
                {loading.products ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
              <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-paper-white border-stone-gray">
                  <DialogHeader>
                    <DialogTitle className="text-charcoal text-section-title">Create New Product</DialogTitle>
                    <DialogDescription className="text-charcoal/70">
                      Add a new product to your Stripe catalog
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      <Label htmlFor="product-name" className="text-label text-charcoal font-medium">
                        Product Name *
                      </Label>
                      <Input
                        id="product-name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Premium Plan"
                        className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                        required
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="product-description" className="text-label text-charcoal font-medium">
                        Description
                      </Label>
                      <Input
                        id="product-description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of the product"
                        className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="product-active"
                        checked={newProduct.active}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, active: e.target.checked }))}
                        className="text-forest-green focus:ring-forest-green"
                      />
                      <Label htmlFor="product-active" className="text-charcoal">
                        Active (available for purchase)
                      </Label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowProductDialog(false)}
                        className="bg-paper-white text-forest-green border-2 border-forest-green hover:bg-forest-green hover:text-paper-white font-bold transition-all duration-200"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={createProduct}
                        className="bg-forest-green text-paper-white hover:opacity-90 active:opacity-80 font-bold transition-all duration-200"
                      >
                        Create Product
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading.products ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-charcoal/50" />
              <span className="ml-2 text-charcoal/70">Loading products...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-charcoal/30 mx-auto mb-3" />
              <p className="text-charcoal/70 mb-4">No products found</p>
              <p className="text-sm text-charcoal/50">Create your first product to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <div
                  key={product.stripe_product_id}
                  className="border border-stone-gray rounded-lg p-4 bg-light-concrete"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-charcoal">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-charcoal/70 mt-1">{product.description}</p>
                      )}
                    </div>
                    <Badge variant={product.active ? "active" : "archived"}>
                      {product.active ? "Active" : "Archived"}
                    </Badge>
                  </div>
                  <div className="text-xs text-charcoal/50 mb-3">
                    ID: {product.stripe_product_id}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingProduct(product)
                        setShowEditProductDialog(true)
                      }}
                      className="bg-paper-white text-forest-green border-2 border-forest-green hover:bg-forest-green hover:text-paper-white font-bold transition-all duration-200"
                      title="Edit Product"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showConfirmation(
                        `${product.active ? 'Archive' : 'Restore'} Product`,
                        `Are you sure you want to ${product.active ? 'archive' : 'restore'} "${product.name}"?`,
                        () => toggleProductActive(product)
                      )}
                      className={`bg-paper-white border-2 hover:text-paper-white font-bold transition-all duration-200 ${
                        product.active ? 'text-error-red border-error-red hover:bg-error-red' : 'text-success-green border-success-green hover:bg-success-green'
                      }`}
                      title={product.active ? 'Archive Product' : 'Restore Product'}
                    >
                      {product.active ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showConfirmation(
                        'Delete Product',
                        `Are you sure you want to permanently delete "${product.name}"? This action cannot be undone. The product must have no associated prices.`,
                        () => deleteProduct(product),
                        true
                      )}
                      className="bg-paper-white text-error-red border-2 border-error-red hover:bg-error-red hover:text-paper-white font-bold transition-all duration-200"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prices Section */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-section-title text-charcoal">
                <DollarSign className="w-5 h-5" />
                Pricing Plans
              </CardTitle>
              <CardDescription className="text-charcoal/70">
                Set up pricing for your products and services
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchPrices}
                disabled={loading.prices}
                variant="outline"
                size="sm"
                className="bg-paper-white text-forest-green border-2 border-forest-green hover:bg-forest-green hover:text-paper-white font-bold transition-all duration-200"
              >
                {loading.prices ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
              <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Price
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-paper-white border-stone-gray">
                  <DialogHeader>
                    <DialogTitle className="text-charcoal text-section-title">Create New Price</DialogTitle>
                    <DialogDescription className="text-charcoal/70">
                      Add a new price for one of your products
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      <Label htmlFor="price-product" className="text-label text-charcoal font-medium">
                        Product *
                      </Label>
                      <select
                        id="price-product"
                        value={newPrice.product_id}
                        onChange={(e) => setNewPrice(prev => ({ ...prev, product_id: e.target.value }))}
                        className="w-full px-3 py-2 bg-light-concrete text-charcoal border border-stone-gray rounded-md focus:border-forest-green focus:ring-forest-green"
                        required
                      >
                        <option value="">Select a product</option>
                        {products.filter(p => p.active).map(product => (
                          <option key={product.stripe_product_id} value={product.stripe_product_id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="price-amount" className="text-label text-charcoal font-medium">
                        Price (USD) *
                      </Label>
                      <Input
                        id="price-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newPrice.unit_amount}
                        onChange={(e) => setNewPrice(prev => ({ ...prev, unit_amount: e.target.value }))}
                        placeholder="29.99"
                        className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 font-mono"
                        required
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="price-billing" className="text-label text-charcoal font-medium">
                        Billing Type
                      </Label>
                      <select
                        id="price-billing"
                        value={newPrice.recurring_interval}
                        onChange={(e) => setNewPrice(prev => ({ ...prev, recurring_interval: e.target.value as '' | 'month' | 'year' }))}
                        className="w-full px-3 py-2 bg-light-concrete text-charcoal border border-stone-gray rounded-md focus:border-forest-green focus:ring-forest-green"
                      >
                        <option value="">One-time payment</option>
                        <option value="month">Monthly subscription</option>
                        <option value="year">Yearly subscription</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="price-active"
                        checked={newPrice.active}
                        onChange={(e) => setNewPrice(prev => ({ ...prev, active: e.target.checked }))}
                        className="text-forest-green focus:ring-forest-green"
                      />
                      <Label htmlFor="price-active" className="text-charcoal">
                        Active (available for purchase)
                      </Label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowPriceDialog(false)}
                        className="bg-paper-white text-forest-green border-2 border-forest-green hover:bg-forest-green hover:text-paper-white font-bold transition-all duration-200"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={createPrice}
                        className="bg-forest-green text-paper-white hover:opacity-90 active:opacity-80 font-bold transition-all duration-200"
                      >
                        Create Price
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading.prices ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-charcoal/50" />
              <span className="ml-2 text-charcoal/70">Loading prices...</span>
            </div>
          ) : prices.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-charcoal/30 mx-auto mb-3" />
              <p className="text-charcoal/70 mb-4">No prices found</p>
              <p className="text-sm text-charcoal/50">Create your first price to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prices.map(price => (
                <div
                  key={price.stripe_price_id}
                  className="border border-stone-gray rounded-lg p-4 bg-light-concrete"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-lg font-bold text-charcoal">
                          {formatCurrency(price.unit_amount, price.currency)}
                        </span>
                        <Badge variant="outline">
                      {getRecurringText(price.recurring_interval)}
                    </Badge>
                      </div>
                      {price.product_name && (
                        <p className="text-sm text-charcoal/70">{price.product_name}</p>
                      )}
                    </div>
                    <Badge variant={price.active ? "active" : "archived"}>
                      {price.active ? "Active" : "Archived"}
                    </Badge>
                  </div>
                  <div className="text-xs text-charcoal/50 mb-3">
                    ID: {price.stripe_price_id}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPrice(price)
                        setShowEditPriceDialog(true)
                      }}
                      className="bg-paper-white text-forest-green border-2 border-forest-green hover:bg-forest-green hover:text-paper-white font-bold transition-all duration-200"
                      title="Edit Price"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showConfirmation(
                        `${price.active ? 'Archive' : 'Restore'} Price`,
                        `Are you sure you want to ${price.active ? 'archive' : 'restore'} this price (${formatCurrency(price.unit_amount, price.currency)})?`,
                        () => togglePriceActive(price)
                      )}
                      className={`bg-paper-white border-2 hover:text-paper-white font-bold transition-all duration-200 ${
                        price.active ? 'text-error-red border-error-red hover:bg-error-red' : 'text-success-green border-success-green hover:bg-success-green'
                      }`}
                      title={price.active ? 'Archive Price' : 'Restore Price'}
                    >
                      {price.active ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={showEditProductDialog} onOpenChange={setShowEditProductDialog}>
        <DialogContent className="bg-paper-white border-stone-gray">
          <DialogHeader>
            <DialogTitle className="text-charcoal text-section-title">Edit Product</DialogTitle>
            <DialogDescription className="text-charcoal/70">
              Update product information
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <Label htmlFor="edit-product-name" className="text-label text-charcoal font-medium">
                  Product Name *
                </Label>
                <Input
                  id="edit-product-name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  placeholder="e.g., Premium Plan"
                  className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="edit-product-description" className="text-label text-charcoal font-medium">
                  Description
                </Label>
                <Input
                  id="edit-product-description"
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                  placeholder="Brief description of the product"
                  className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-product-active"
                  checked={editingProduct.active}
                  onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, active: e.target.checked }) : null)}
                  className="text-forest-green focus:ring-forest-green"
                />
                <Label htmlFor="edit-product-active" className="text-charcoal">
                  Active (available for purchase)
                </Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditProductDialog(false)
                    setEditingProduct(null)
                  }}
                  className="bg-paper-white text-forest-green border-2 border-forest-green hover:bg-forest-green hover:text-paper-white font-bold transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateProduct}
                  className="bg-forest-green text-paper-white hover:opacity-90 active:opacity-80 font-bold transition-all duration-200"
                >
                  Update Product
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Price Dialog */}
      <Dialog open={showEditPriceDialog} onOpenChange={setShowEditPriceDialog}>
        <DialogContent className="bg-paper-white border-stone-gray">
          <DialogHeader>
            <DialogTitle className="text-charcoal text-section-title">Edit Price</DialogTitle>
            <DialogDescription className="text-charcoal/70">
              Update price settings (Note: Amount and billing frequency cannot be changed)
            </DialogDescription>
          </DialogHeader>
          {editingPrice && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <Label className="text-label text-charcoal font-medium">
                  Current Price
                </Label>
                <div className="p-3 bg-light-concrete border border-stone-gray rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-charcoal">
                      {formatCurrency(editingPrice.unit_amount, editingPrice.currency)}
                    </span>
                    <Badge variant="outline">
                      {getRecurringText(editingPrice.recurring_interval)}
                    </Badge>
                  </div>
                  {editingPrice.product_name && (
                    <p className="text-sm text-charcoal/70 mt-1">{editingPrice.product_name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-price-active"
                  checked={editingPrice.active}
                  onChange={(e) => setEditingPrice(prev => prev ? ({ ...prev, active: e.target.checked }) : null)}
                  className="text-forest-green focus:ring-forest-green"
                />
                <Label htmlFor="edit-price-active" className="text-charcoal">
                  Active (available for purchase)
                </Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditPriceDialog(false)
                    setEditingPrice(null)
                  }}
                  className="bg-paper-white text-forest-green border-2 border-forest-green hover:bg-forest-green hover:text-paper-white font-bold transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={updatePrice}
                  className="bg-forest-green text-paper-white hover:opacity-90 active:opacity-80 font-bold transition-all duration-200"
                >
                  Update Price
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-paper-white border-stone-gray">
          <DialogHeader>
            <DialogTitle className={`text-section-title ${confirmAction?.destructive ? 'text-error-red' : 'text-charcoal'}`}>
              {confirmAction?.title}
            </DialogTitle>
            <DialogDescription className="text-charcoal/70">
              {confirmAction?.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false)
                setConfirmAction(null)
              }}
              className="bg-paper-white text-forest-green border-2 border-forest-green hover:bg-forest-green hover:text-paper-white font-bold transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={executeConfirmAction}
              className={confirmAction?.destructive ? 
                "bg-paper-white text-error-red border-2 border-error-red hover:bg-error-red hover:text-paper-white font-bold transition-all duration-200" : 
                "bg-forest-green text-paper-white hover:opacity-90 active:opacity-80 font-bold transition-all duration-200"
              }
            >
              {confirmAction?.destructive ? 'Delete' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}