import { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Search, Plus, Trash2, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const OrderEntry = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [phone, setPhone] = useState('');
    const [customer, setCustomer] = useState(null);
    const [isNewCustomer, setIsNewCustomer] = useState(false);

    // New Customer Form State
    const [customerForm, setCustomerForm] = useState({
        name: '',
        phone2: '', // Contact 2
        address: '',
        city: '',
        country: 'Sri Lanka',
        email: ''
    });

    const [products, setProducts] = useState([]);
    const [items, setItems] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0); // Store fixed amount
    const [remark, setRemark] = useState('');
    const [additionalRemark, setAdditionalRemark] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [deliveryCharge, setDeliveryCharge] = useState(0);
    const [isManualDelivery, setIsManualDelivery] = useState(false);

    // Auto-calculate delivery charge
    useEffect(() => {
        if (!isManualDelivery && !id) {
            const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const isFreeDeliveryItem = items.length === 1 && items[0].productName === "Moist Curl Leave On Conditioner";

            if (isFreeDeliveryItem) {
                setDeliveryCharge(0);
            } else {
                setDeliveryCharge((subtotal < 2500 && subtotal > 0) ? 350 : 0);
            }
        }
    }, [items, isManualDelivery, id]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await api.get('/products');
                setProducts(data);
            } catch (err) {
                console.error("Failed to fetch products", err);
            }
        };
        fetchProducts();
    }, []);

    // NEW: Fetch order details if editing
    useEffect(() => {
        if (id) {
            const fetchOrder = async () => {
                setLoading(true);
                try {
                    const { data } = await api.get(`/orders/${id}`);
                    // Populate state
                    setCustomer(data.customer);
                    setPhone(data.customer.phone);
                    setCustomerForm({
                        name: data.customer.name,
                        phone2: data.customer.phone2 || '',
                        address: data.customer.address,
                        city: data.customer.city || '',
                        country: data.customer.country || 'Sri Lanka',
                        email: data.customer.email || ''
                    });

                    // Map items to match our state structure
                    // Need to ensure product ID is set correctly
                    const mappedItems = data.items.map(i => ({
                        product: i.product._id || i.product, // Handle populated vs unpopulated
                        productName: i.productName,
                        quantity: i.quantity,
                        price: i.price
                    }));
                    setItems(mappedItems);
                    setPaymentMethod(data.paymentStatus || 'COD');
                    setDeliveryCharge(data.deliveryCharge || 0);
                    setIsManualDelivery(true);

                    setDiscountAmount(data.discountAmount || 0);
                    // Reverse calculate percentage for UI consistency if needed
                    if (data.discountAmount > 0) {
                        const subtotal = data.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                        if (subtotal > 0) {
                            setDiscountPercentage(Math.round((data.discountAmount / subtotal) * 100));
                        }
                    } else {
                        setDiscountPercentage(0);
                    }

                    setRemark(data.remark || '');
                } catch (err) {
                    setError('Failed to load order details');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchOrder();
        }
    }, [id]);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setCustomer(null);
        setIsNewCustomer(false);

        try {
            const { data } = await api.get(`/customers/lookup/${phone}`);
            setCustomer(data);
            setCustomerForm({
                name: data.name,
                phone2: data.phone2 || '',
                address: data.address,
                city: data.city || '',
                country: data.country || 'Sri Lanka',
                email: data.email || ''
            });
        } catch (err) {
            if (err.response?.status === 404) {
                setIsNewCustomer(true);
                setCustomerForm({ name: '', phone2: '', address: '', city: '', country: 'Sri Lanka', email: '' }); // Reset form
            } else {
                setError('Error searching customer');
            }
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setItems([...items, { product: '', quantity: 1, price: 0 }]);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        if (field === 'product') {
            // Legacy/Direct ID updates (if needed)
            const product = products.find(p => p._id === value);
            if (product) {
                newItems[index].price = product.price;
                newItems[index].productName = product.name;
            }
        } else if (field === 'productName') {
            // Search by name
            const product = products.find(p => p.name === value);
            if (product) {
                newItems[index].product = product._id;
                newItems[index].price = product.price;
            } else {
                newItems[index].product = ''; // Reset ID if no match
            }
        }

        setItems(newItems);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        return Math.max(0, subtotal + deliveryCharge - discountAmount);
    };

    const handleDiscountPercentageChange = (value) => {
        const pct = Math.min(100, Math.max(0, Number(value)));
        setDiscountPercentage(pct);
        const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        setDiscountAmount(Number(((subtotal * pct) / 100).toFixed(2)));
    };

    const handleDiscountAmountChange = (value) => {
        const amt = Math.max(0, Number(value));
        setDiscountAmount(amt);
        const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        if (subtotal > 0) {
            setDiscountPercentage(Number(((amt / subtotal) * 100).toFixed(2)));
        } else {
            setDiscountPercentage(0);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            let customerId = customer?._id;

            // If new customer, create first. 
            // TODO: If existing customer & details changed, should we update? 
            // For now, assuming only new customers are created here.
            if (!customer) {
                // User didn't search, or search failed (isNewCustomer). 
                // Try to create. If it fails because exists, we find and update.
                try {
                    const { data: newCust } = await api.post('/customers', {
                        ...customerForm,
                        phone
                    });
                    customerId = newCust._id;
                } catch (createErr) {
                    if (createErr.response?.status === 400) {
                        // Assume already exists. Find it.
                        const { data: existingCust } = await api.get(`/customers/lookup/${phone}`);
                        // Update it with the new form details
                        await api.put(`/customers/${existingCust._id}`, {
                            ...customerForm,
                            // phone is immutable
                        });
                        customerId = existingCust._id;
                    } else {
                        throw createErr;
                    }
                }
            } else {
                // We have a loaded customer, update them
                await api.put(`/customers/${customer._id}`, {
                    ...customerForm,
                    // Phone is immutable here since it's the lookup key
                });
                customerId = customer._id;
            }

            // Create Order
            const total = calculateTotal();
            const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

            const orderData = {
                customerId,
                items: items.map(i => ({
                    product: i.product,
                    productName: products.find(p => p._id === i.product)?.name || 'Unknown',
                    quantity: Number(i.quantity),
                    price: Number(i.price)
                })),
                totalAmount: subtotal, // Use subtotal as base amount
                discountAmount: Number(discountAmount),
                finalAmount: total,
                deliveryCharge: Number(deliveryCharge),
                paymentStatus: paymentMethod, // Use selected payment method
                remark, // Optional remark
                additionalRemark // Second optional remark
            };

            if (id) {
                await api.put(`/orders/${id}`, orderData);
            } else {
                await api.post('/orders', orderData);
            }
            navigate('/orders'); // Redirect to orders list
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || 'Failed to create order';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1 style={{ marginBottom: '2rem' }}>{id ? 'Edit Order' : 'New Order'}</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Customer Section */}
                <div className="card glass">
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Customer Details</h2>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter Phone Number..."
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary">
                            <Search size={20} />
                        </button>
                    </form>

                    {/* Always show form, populated if customer found */}
                    <div className="input-group">
                        <label className="input-label">Contact 1 (Primary)</label>
                        <input
                            className="input-field"
                            value={phone}
                            disabled // Primary contact is the search key
                            style={{ opacity: 0.7, cursor: 'not-allowed' }}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Contact 2 (Secondary)</label>
                        <input
                            className="input-field"
                            value={customerForm.phone2}
                            onChange={e => setCustomerForm({ ...customerForm, phone2: e.target.value })}
                            placeholder="Optional"
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Name</label>
                        <input
                            className="input-field"
                            value={customerForm.name}
                            onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                            required
                        // If customer found, they might want to edit it? Assuming yes for now.
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Address</label>
                        <input
                            className="input-field"
                            value={customerForm.address}
                            onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">City</label>
                        <input
                            className="input-field"
                            value={customerForm.city}
                            onChange={e => setCustomerForm({ ...customerForm, city: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Country</label>
                        <input
                            className="input-field"
                            value={customerForm.country}
                            onChange={e => setCustomerForm({ ...customerForm, country: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Email (Optional)</label>
                        <input
                            type="email"
                            className="input-field"
                            value={customerForm.email}
                            onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                        />
                    </div>

                    {customer && (
                        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--success)' }}>
                            <p>Existing customer loaded. You can update details if needed.</p>
                        </div>
                    )}
                </div>

                {/* Order Items Section */}
                <div className="card glass">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Order Items</h2>
                        <button type="button" onClick={addItem} className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <Plus size={16} /> Add Item
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {items.map((item, index) => (
                            <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                    list={`product-list-${index}`}
                                    className="input-field"
                                    value={item.productName || ''}
                                    onChange={(e) => updateItem(index, 'productName', e.target.value)}
                                    placeholder="Type to search product..."
                                />
                                <datalist id={`product-list-${index}`}>
                                    {products.map(p => (
                                        <option key={p._id} value={p.name}>Rs. {p.price}</option>
                                    ))}
                                </datalist>
                                <input
                                    type="number"
                                    className="input-field"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                />
                                <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                    Rs. {(item.price * item.quantity).toFixed(2)}
                                </div>
                                <button onClick={() => removeItem(index)} style={{ color: 'var(--danger)', background: 'transparent' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', color: 'var(--text-dim)' }}>
                            <span>Subtotal:</span>
                            <span>Rs. {items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', color: 'var(--warning)' }}>
                            <span>Delivery Charge:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span>+ Rs.</span>
                                <input
                                    type="number"
                                    min="0"
                                    className="input-field"
                                    style={{ width: '80px', padding: '0.25rem' }}
                                    value={deliveryCharge}
                                    onChange={(e) => {
                                        setDeliveryCharge(Number(e.target.value));
                                        setIsManualDelivery(true);
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', color: 'var(--success)' }}>
                            <span>Discount (%):</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="input-field"
                                    style={{ width: '80px', padding: '0.25rem' }}
                                    value={discountPercentage}
                                    onChange={(e) => handleDiscountPercentageChange(e.target.value)}
                                />
                                <span>%</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', color: 'var(--success)' }}>
                            <span>Discount Amount (Rs.):</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span>- Rs.</span>
                                <input
                                    type="number"
                                    min="0"
                                    className="input-field"
                                    style={{ width: '100px', padding: '0.25rem' }}
                                    value={discountAmount}
                                    onChange={(e) => handleDiscountAmountChange(e.target.value)}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '1rem' }}>
                                {/* Payment Method Selector Moved Here */}
                                <span style={{ fontWeight: 500 }}>Payment:</span>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="COD"
                                        checked={paymentMethod === 'COD'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    COD
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="Paid"
                                        checked={paymentMethod === 'Paid'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    Paid
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="Export"
                                        checked={paymentMethod === 'Export'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    Export
                                </label>
                            </div>
                            <div>
                                Total: Rs. {calculateTotal().toFixed(2)}
                            </div>
                        </div>

                        <div className="input-group" style={{ marginTop: '1rem' }}>
                            <label className="input-label">Remark (Any discounts or special instructions)</label>
                            <textarea
                                className="input-field"
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                placeholder="Add any notes about this order..."
                                rows="3"
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div className="input-group" style={{ marginTop: '1rem' }}>
                            <label className="input-label">Additional Remark (Are there want to add any doctor consultation )</label>
                            <textarea
                                className="input-field"
                                value={additionalRemark}
                                onChange={(e) => setAdditionalRemark(e.target.value)}
                                placeholder="Add any other details..."
                                rows="2"
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            className="btn btn-primary"
                            disabled={loading || items.length === 0 || !phone}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}
                        >
                            <Save size={20} /> {id ? 'Update Order' : 'Create Order'}
                        </button>
                    </div>
                    {error && <div style={{ marginTop: '1rem', color: 'var(--danger)' }}>{error}</div>}
                </div>
            </div>
        </div>
    );
};

export default OrderEntry;
