import { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Package, Search, Plus, Save, Edit, Trash2 } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const Products = () => {
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Management State
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    const initialForm = {
        name: '',
        price: '',
        weight: '',
        unit: 'g',
        description: '',
        active: true
    };
    const [form, setForm] = useState(initialForm);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/products');
            setProducts(data);
        } catch (err) {
            console.error("Failed to fetch products", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm({ ...form, [e.target.name]: value });
    };

    const handleCreateClick = () => {
        setForm(initialForm);
        setEditMode(false);
        setEditId(null);
        setShowForm(true);
        setFormError('');
        setFormSuccess('');
    };

    const handleEditClick = (product) => {
        setForm({
            name: product.name,
            price: product.price,
            weight: product.weight,
            unit: product.unit || 'g',
            description: product.description || '',
            active: product.active !== undefined ? product.active : true
        });
        setEditMode(true);
        setEditId(product._id);
        setShowForm(true);
        setFormError('');
        setFormSuccess('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete product');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        try {
            if (editMode) {
                await api.put(`/products/${editId}`, form);
                setFormSuccess('Product updated successfully!');
            } else {
                await api.post('/products', form);
                setFormSuccess('Product created successfully!');
                setForm(initialForm);
            }
            fetchProducts();
            if (editMode) {
                setTimeout(() => setShowForm(false), 1500);
            }
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to save product');
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Loading...</div>;

    const isSuperAdmin = user?.role === 'Super Admin';

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Products</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Search products..."
                                style={{ paddingLeft: '2.5rem', width: '250px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {isSuperAdmin && (
                        <button className="btn btn-primary" onClick={handleCreateClick}>
                            <Plus size={20} style={{ marginRight: '0.5rem' }} /> New Product
                        </button>
                    )}
                </div>
            </div>

            {/* Product Form (Modal-ish or Inline) */}
            {isSuperAdmin && showForm && (
                <div className="card glass" style={{ marginBottom: '2rem', border: '1px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{editMode ? 'Edit Product' : 'Create New Product'}</h2>
                        <button onClick={() => setShowForm(false)} style={{ background: 'transparent', color: 'var(--text-dim)' }}>Cancel</button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                        <div className="input-group">
                            <label className="input-label">Product Name</label>
                            <input name="name" className="input-field" value={form.name} onChange={handleChange} required />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Price (Rs.)</label>
                            <input type="number" name="price" className="input-field" value={form.price} onChange={handleChange} required />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Weight</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="number" name="weight" className="input-field" value={form.weight} onChange={handleChange} required style={{ flex: 1 }} />
                                <select name="unit" className="input-field" value={form.unit} onChange={handleChange} style={{ width: '100px' }}>
                                    <option value="g">g</option>
                                    <option value="ml">ml</option>
                                    <option value="capsules">capsules</option>
                                </select>
                            </div>
                        </div>



                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label className="input-label">Description</label>
                            <textarea name="description" className="input-field" style={{ minHeight: '80px' }} value={form.description} onChange={handleChange} />
                        </div>

                        <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" id="active" name="active" checked={form.active} onChange={handleChange} style={{ width: 'auto' }} />
                            <label htmlFor="active" style={{ cursor: 'pointer' }}>Available (Active)</label>
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                <Save size={18} style={{ marginRight: '0.5rem' }} /> {editMode ? 'Update Product' : 'Create Product'}
                            </button>
                        </div>

                        {formError && <div style={{ gridColumn: 'span 2', color: 'var(--danger)' }}>{formError}</div>}
                        {formSuccess && <div style={{ gridColumn: 'span 2', color: 'var(--success)' }}>{formSuccess}</div>}
                    </form>
                </div>
            )}

            <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500 }}>Product Name</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500 }}>Price</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500 }}>Weight</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500 }}>Status</th>
                                {isSuperAdmin && <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500 }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={isSuperAdmin ? 6 : 5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                                        No products found.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map(product => (
                                    <tr key={product._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ padding: '0.5rem', background: 'var(--bg-dark)', borderRadius: '0.5rem' }}>
                                                    <Package size={20} color="var(--primary)" />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                                                    {product.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{product.description.substring(0, 30)}...</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                                            Rs. {product.price.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>{product.weight} {product.unit || 'g'}</td>

                                        <td style={{ padding: '1rem' }}>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${product.active ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}
                                                style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                                                {product.active ? 'Available' : 'Unavailable'}
                                            </span>
                                        </td>
                                        {isSuperAdmin && (
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => handleEditClick(product)} className="btn" style={{ padding: '0.25rem', color: 'var(--text-main)', background: 'transparent' }} title="Edit">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(product._id)} className="btn" style={{ padding: '0.25rem', color: 'var(--danger)', background: 'transparent' }} title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Products;
