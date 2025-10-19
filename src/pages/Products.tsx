import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, ShoppingCart } from 'lucide-react';
import { brands, categories } from '@/lib/products-data';
import { db, type Product } from '@/lib/realtime-db';
import { getCartItemCount } from '@/lib/cart-storage';

const Products = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cartCount, setCartCount] = useState(() => getCartItemCount());
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadProducts();

    const unsubscribe = db.subscribeToProducts((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setProducts((prev) => [payload.new!, ...prev]);
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setProducts((prev) =>
          prev.map((p) => (p.id === payload.new!.id ? payload.new! : p))
        );
      } else if (payload.eventType === 'DELETE' && payload.old) {
        setProducts((prev) => prev.filter((p) => p.id !== payload.old!.id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadProducts = async () => {
    const data = await db.getProducts();
    setProducts(data);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (!product.is_active) return false;

      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBrand = selectedBrand === 'all' || product.brand === selectedBrand;
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

      return matchesSearch && matchesBrand && matchesCategory;
    });
  }, [products, searchQuery, selectedBrand, selectedCategory]);

  useEffect(() => {
    const handleCartUpdate = () => {
      setCartCount(getCartItemCount());
    };
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>

          <Button
            variant="outline"
            className="gap-2 relative"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart className="h-5 w-5" />
            Cart
            {cartCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 rounded-full">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Product Catalog</h1>
          <p className="text-muted-foreground">Browse our wide selection of wires and cables</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger>
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map(brand => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
              <div className="aspect-video overflow-hidden bg-accent/20">
                <img
                  src={product.image_url || 'https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg'}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>

              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                  {product.stock_quantity > 0 ? (
                    <Badge variant="secondary">In Stock</Badge>
                  ) : (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{product.brand}</span>
                  <span className="text-xs">•</span>
                  <span className="text-xs">{product.category}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {product.description}
                </p>
                <div className="text-2xl font-bold text-primary">
                  ₹{product.base_price.toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">/{product.unit_type}</span>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full bg-gradient-to-r from-primary to-secondary"
                  onClick={() => navigate(`/products/${product.id}`)}
                  disabled={product.stock_quantity === 0}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-4">No products found</p>
            <Button onClick={() => {
              setSearchQuery('');
              setSelectedBrand('all');
              setSelectedCategory('all');
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
