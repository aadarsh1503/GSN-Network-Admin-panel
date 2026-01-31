import { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaSearch, 
  FaFilter,
  FaBoxes,
  FaTag,
  FaWeight,
  FaRuler,
  FaImage,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  Package,
  Tag,
  Weight,
  Ruler,
  Image,
  Save,
  X,
  Upload,
  ShoppingCart,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

const BusinessProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    sku: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    price: '',
    currency: 'USD',
    minOrderQuantity: '',
    packingType: '',
    isHazardous: false,
    requiresRefrigeration: false,
    image: null
  });

  const categories = [
    'Electronics', 'Food & Beverages', 'Textiles', 'Automotive', 
    'Pharmaceuticals', 'Manufacturing', 'Agriculture', 'Construction',
    'Oil & Gas', 'Mining', 'Retail', 'Wholesale'
  ];

  const packingTypes = [
    'Carton Box', 'Wooden Crate', 'Plastic Container', 'Metal Container',
    'Pallet', 'Bag', 'Drum', 'Custom Packaging'
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Mock products data
      const mockProducts = [
        {
          id: 1,
          name: 'Premium Electronic Components',
          category: 'Electronics',
          description: 'High-quality semiconductor components for industrial applications',
          sku: 'ELEC-001',
          weight: '2.5 kg',
          dimensions: { length: '30', width: '20', height: '15' },
          price: 150,
          currency: 'USD',
          minOrderQuantity: 100,
          packingType: 'Carton Box',
          isHazardous: false,
          requiresRefrigeration: false,
          image: null,
          createdAt: '2024-01-15T10:30:00Z',
          status: 'active'
        },
        {
          id: 2,
          name: 'Organic Cotton Fabric',
          category: 'Textiles',
          description: 'Premium organic cotton fabric for sustainable fashion',
          sku: 'TEXT-002',
          weight: '1.8 kg',
          dimensions: { length: '100', width: '150', height: '5' },
          price: 25,
          currency: 'USD',
          minOrderQuantity: 50,
          packingType: 'Plastic Container',
          isHazardous: false,
          requiresRefrigeration: false,
          image: null,
          createdAt: '2024-01-14T14:20:00Z',
          status: 'active'
        },
        {
          id: 3,
          name: 'Specialty Coffee Beans',
          category: 'Food & Beverages',
          description: 'Premium Arabica coffee beans from sustainable farms',
          sku: 'FOOD-003',
          weight: '60 kg',
          dimensions: { length: '40', width: '30', height: '25' },
          price: 12,
          currency: 'USD',
          minOrderQuantity: 200,
          packingType: 'Bag',
          isHazardous: false,
          requiresRefrigeration: true,
          image: null,
          createdAt: '2024-01-12T09:15:00Z',
          status: 'active'
        },
        {
          id: 4,
          name: 'Automotive Engine Parts',
          category: 'Automotive',
          description: 'High-performance engine components for luxury vehicles',
          sku: 'AUTO-004',
          weight: '15 kg',
          dimensions: { length: '50', width: '40', height: '30' },
          price: 500,
          currency: 'USD',
          minOrderQuantity: 10,
          packingType: 'Wooden Crate',
          isHazardous: false,
          requiresRefrigeration: false,
          image: null,
          createdAt: '2024-01-10T16:45:00Z',
          status: 'inactive'
        }
      ];
      
      setProducts(mockProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: '',
      description: '',
      sku: '',
      weight: '',
      dimensions: { length: '', width: '', height: '' },
      price: '',
      currency: 'USD',
      minOrderQuantity: '',
      packingType: '',
      isHazardous: false,
      requiresRefrigeration: false,
      image: null
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description,
      sku: product.sku,
      weight: product.weight,
      dimensions: product.dimensions,
      price: product.price,
      currency: product.currency,
      minOrderQuantity: product.minOrderQuantity,
      packingType: product.packingType,
      isHazardous: product.isHazardous,
      requiresRefrigeration: product.requiresRefrigeration,
      image: product.image
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.category || !formData.sku) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (editingProduct) {
        // Update existing product
        setProducts(products.map(p => 
          p.id === editingProduct.id 
            ? { ...editingProduct, ...formData, updatedAt: new Date().toISOString() }
            : p
        ));
        toast.success('Product updated successfully');
      } else {
        // Add new product
        const newProduct = {
          id: products.length + 1,
          ...formData,
          createdAt: new Date().toISOString(),
          status: 'active'
        };
        setProducts([...products, newProduct]);
        toast.success('Product added successfully');
      }
      
      closeModal();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== productId));
      toast.success('Product deleted successfully');
    }
  };

  const toggleStatus = (productId) => {
    setProducts(products.map(p => 
      p.id === productId 
        ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' }
        : p
    ));
    toast.success('Product status updated');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 border-t-[#bca142] mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-slate-700">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-50 via-yellow-100 to-yellow-50 rounded-2xl p-8 border border-yellow-200/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#bca142] to-[#B8941F] bg-clip-text text-transparent mb-2">
              Product Catalog
            </h1>
            <p className="text-slate-600 text-lg">Manage your business product inventory and specifications</p>
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600">Live Inventory</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full">
                <Package className="h-3 w-3 text-[#bca142]" />
                <span className="text-sm text-[#bca142]">{products.length} Products</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={openAddModal}
              className="flex items-center space-x-2 bg-gradient-to-r from-[#bca142] to-[#B8941F] hover:from-[#B8941F] hover:to-[#bca142] text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#bca142] to-[#B8941F] text-white">
              <Package className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{products.length}</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Total Products</h3>
          <p className="text-sm text-slate-600">In catalog</p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-white">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{products.filter(p => p.status === 'active').length}</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Active Products</h3>
          <p className="text-sm text-slate-600">Available for quotes</p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <Tag className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{new Set(products.map(p => p.category)).size}</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Categories</h3>
          <p className="text-sm text-slate-600">Product types</p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <BarChart3 className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-slate-800">
              ${products.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Total Value</h3>
          <p className="text-sm text-slate-600">Catalog worth</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">Category:</span>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#bca142] transition-all duration-300"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full bg-white/80 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <Package className="text-slate-400 h-16 w-16" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              {searchTerm || categoryFilter !== 'all' ? 'No products match your criteria' : 'No products yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start building your product catalog by adding your first product'
              }
            </p>
            {(!searchTerm && categoryFilter === 'all') && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                <span>Add First Product</span>
              </button>
            )}
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300 group"
            >
              {/* Product Image Placeholder */}
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl h-48 mb-4 flex items-center justify-center">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Package className="h-16 w-16 text-slate-400" />
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-slate-600">{product.category}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.status}
                  </span>
                </div>

                <p className="text-sm text-slate-600 line-clamp-2">{product.description}</p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">SKU:</span>
                    <p className="font-semibold text-slate-800">{product.sku}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Price:</span>
                    <p className="font-semibold text-slate-800">${product.price}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Weight:</span>
                    <p className="font-semibold text-slate-800">{product.weight}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Min Order:</span>
                    <p className="font-semibold text-slate-800">{product.minOrderQuantity}</p>
                  </div>
                </div>

                {/* Special Indicators */}
                <div className="flex items-center space-x-2">
                  {product.isHazardous && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Hazardous</span>
                  )}
                  {product.requiresRefrigeration && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Refrigerated</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <span className="text-xs text-slate-500">
                    Added {formatDate(product.createdAt)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleStatus(product.id)}
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        product.status === 'active'
                          ? 'bg-green-100 hover:bg-green-200 text-green-600'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                      title={product.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all duration-300"
                      title="Edit Product"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all duration-300"
                      title="Delete Product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Basic Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Product Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">SKU *</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                      placeholder="Product SKU"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                      placeholder="Product description"
                    />
                  </div>
                </div>

                {/* Specifications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Specifications</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Weight</label>
                    <input
                      type="text"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                      placeholder="e.g., 2.5 kg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Dimensions (L x W x H)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={formData.dimensions.length}
                        onChange={(e) => handleInputChange('dimensions.length', e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                        placeholder="Length"
                      />
                      <input
                        type="text"
                        value={formData.dimensions.width}
                        onChange={(e) => handleInputChange('dimensions.width', e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                        placeholder="Width"
                      />
                      <input
                        type="text"
                        value={formData.dimensions.height}
                        onChange={(e) => handleInputChange('dimensions.height', e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                        placeholder="Height"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Price</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Min Order Qty</label>
                      <input
                        type="number"
                        value={formData.minOrderQuantity}
                        onChange={(e) => handleInputChange('minOrderQuantity', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Packing Type</label>
                    <select
                      value={formData.packingType}
                      onChange={(e) => handleInputChange('packingType', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                    >
                      <option value="">Select Packing Type</option>
                      {packingTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isHazardous"
                        checked={formData.isHazardous}
                        onChange={(e) => handleInputChange('isHazardous', e.target.checked)}
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="isHazardous" className="ml-2 text-sm text-slate-700">Hazardous Material</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="requiresRefrigeration"
                        checked={formData.requiresRefrigeration}
                        onChange={(e) => handleInputChange('requiresRefrigeration', e.target.checked)}
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="requiresRefrigeration" className="ml-2 text-sm text-slate-700">Requires Refrigeration</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingProduct ? 'Update Product' : 'Add Product'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessProducts;