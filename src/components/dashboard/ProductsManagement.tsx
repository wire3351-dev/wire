import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { brands, categories } from '@/lib/products-data';
import { db, type Product } from '@/lib/realtime-db';
import { toast } from 'sonner';
import { Package, Plus, Pencil, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';

type ProductFormState = {
  name: string;
  brand: string;
  category: string;
  color: string;
  description: string;
  base_price: string;
  unit_type: 'metres' | 'coils' | 'pieces' | 'rolls';
  stock_quantity: string;
  image_url: string;
  specifications: string;
  is_active: boolean;
};

const emptyForm: ProductFormState = {
  name: '',
  brand: brands[0] || '',
  category: categories[0] || '',
  color: '',
  description: '',
  base_price: '',
  unit_type: 'metres',
  stock_quantity: '0',
  image_url: '',
  specifications: '',
  is_active: true,
};

function ProductFormFields({ formData, onChange }: { formData: ProductFormState; onChange: (field: string, value: string | boolean) => void }) {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g., FR PVC Insulated Wire 1.5 sq mm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="brand">Brand *</Label>
          <Select value={formData.brand} onValueChange={(value) => onChange('brand', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              {brands.map(brand => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => onChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Available Colors (comma-separated)</Label>
        <Input
          id="color"
          value={formData.color}
          onChange={(e) => onChange('color', e.target.value)}
          placeholder="Red, Blue, Yellow, Green"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Product description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="base_price">Base Price (₹) *</Label>
          <Input
            id="base_price"
            type="number"
            step="0.01"
            value={formData.base_price}
            onChange={(e) => onChange('base_price', e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit_type">Unit Type *</Label>
          <Select value={formData.unit_type} onValueChange={(value) => onChange('unit_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metres">Metres</SelectItem>
              <SelectItem value="coils">Coils</SelectItem>
              <SelectItem value="pieces">Pieces</SelectItem>
              <SelectItem value="rolls">Rolls</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stock_quantity">Stock Quantity *</Label>
        <Input
          id="stock_quantity"
          type="number"
          value={formData.stock_quantity}
          onChange={(e) => onChange('stock_quantity', e.target.value)}
          placeholder="0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url">Image URL</Label>
        <Input
          id="image_url"
          type="url"
          value={formData.image_url}
          onChange={(e) => onChange('image_url', e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="specifications">Specifications (JSON format)</Label>
        <Textarea
          id="specifications"
          value={formData.specifications}
          onChange={(e) => onChange('specifications', e.target.value)}
          placeholder='{"voltage": "1100V", "conductor": "Copper"}'
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => onChange('is_active', checked)}
        />
        <Label htmlFor="is_active">Product is active and visible</Label>
      </div>
    </div>
  );
}

export function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<ProductFormState>(emptyForm);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await db.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();

    const unsubscribe = db.subscribeToProducts((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setProducts((prev) => [payload.new!, ...prev]);
        toast.success('New product added');
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setProducts((prev) =>
          prev.map((p) => (p.id === payload.new!.id ? payload.new! : p))
        );
        toast.info('Product updated');
      } else if (payload.eventType === 'DELETE' && payload.old) {
        setProducts((prev) => prev.filter((p) => p.id !== payload.old!.id));
        toast.info('Product deleted');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadProducts]);

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      category: product.category,
      color: product.color.join(', '),
      description: product.description || '',
      base_price: product.base_price.toString(),
      unit_type: product.unit_type as any,
      stock_quantity: product.stock_quantity.toString(),
      image_url: product.image_url || '',
      specifications: JSON.stringify(product.specifications || {}),
      is_active: product.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;

    try {
      await db.deleteProduct(product.id);
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.brand || !formData.category || !formData.base_price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      let specs = {};
      if (formData.specifications) {
        try {
          specs = JSON.parse(formData.specifications);
        } catch {
          toast.error('Invalid JSON in specifications');
          setIsSaving(false);
          return;
        }
      }

      const productData = {
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        color: formData.color.split(',').map(c => c.trim()).filter(Boolean),
        description: formData.description || null,
        specifications: specs,
        base_price: parseFloat(formData.base_price),
        unit_type: formData.unit_type,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        image_url: formData.image_url || null,
        brochure_url: null,
        is_active: formData.is_active,
        created_by: null,
      };

      if (editingProduct) {
        await db.updateProduct(editingProduct.id, productData);
        toast.success('Product updated successfully');
      } else {
        await db.createProduct(productData);
        toast.success('Product created successfully');
      }

      setIsDialogOpen(false);
      setFormData(emptyForm);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      await db.updateProduct(product.id, { is_active: !product.is_active });
      toast.success(`Product ${product.is_active ? 'deactivated' : 'activated'}`);
    } catch (error) {
      console.error('Error toggling product status:', error);
      toast.error('Failed to update product status');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products Management
            </CardTitle>
            <CardDescription>Add, edit, and manage your product catalog</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadProducts} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAdd} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                  <DialogDescription>
                    {editingProduct ? 'Update product details' : 'Add a new product to your catalog'}
                  </DialogDescription>
                </DialogHeader>
                <ProductFormFields formData={formData} onChange={handleFormChange} />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No products found. Add your first product to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                  </TableCell>
                  <TableCell>{product.brand}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell>₹{product.base_price.toFixed(2)}/{product.unit_type}</TableCell>
                  <TableCell>{product.stock_quantity}</TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleProductStatus(product)}
                        title={product.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(product)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
