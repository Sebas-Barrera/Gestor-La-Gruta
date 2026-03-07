import { useState } from 'react';
import { Search, SlidersHorizontal, Grid3X3, List, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductInfoPanel } from '@/components/ProductInfoPanel';
import { InventoryGrid } from '@/components/InventoryGrid';
import { ProductCard } from '@/components/ProductCard';
import { BarSelector } from '@/components/BarSelector';
import { products, bars } from '@/data/mockData';
import type { Product } from '@/types';

export function InventorySection() {
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0]);
  const [activeBarId, setActiveBarId] = useState('1');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(
    p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Bar Selector */}
      <BarSelector
        bars={bars}
        activeBarId={activeBarId}
        onBarChange={setActiveBarId}
        delay={0}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel - Product Info */}
        <div className="lg:col-span-2">
          <ProductInfoPanel
            product={selectedProduct}
            onAdjustStock={() => console.log('Adjust stock', selectedProduct.id)}
            onEditProduct={() => console.log('Edit product', selectedProduct.id)}
            delay={100}
          />
        </div>

        {/* Right Panel - Visual Grid */}
        <div className="lg:col-span-3">
          <InventoryGrid
            products={products}
            onSlotClick={(slotId) => console.log('Slot clicked', slotId)}
            delay={200}
          />
        </div>
      </div>

      {/* Product Cards Section */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Productos en Inventario
          </h3>
          
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por SKU o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 focus-visible:ring-emerald-500"
              />
            </div>

            {/* Filter */}
            <Button variant="outline" size="icon" className="hover:border-emerald-500 hover:text-emerald-600">
              <Filter className="w-4 h-4" />
            </Button>

            {/* Sort */}
            <Button variant="outline" className="gap-2 hover:border-emerald-500 hover:text-emerald-600">
              <SlidersHorizontal className="w-4 h-4" />
              Ordenar
            </Button>

            {/* View Toggle */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToLocation={(p) => {
                setSelectedProduct(p);
                console.log('Add to location', p.id);
              }}
              delay={300 + index * 100}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-1">
              No se encontraron productos
            </h4>
            <p className="text-sm text-gray-500">
              Intenta con otra búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
