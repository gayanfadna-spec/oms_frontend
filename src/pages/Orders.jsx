import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import { Search, Filter, ChevronDown, CheckCircle, XCircle, Clock, Truck, Package, Edit, Trash2, Upload, MessageCircle } from 'lucide-react';

const Orders = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/orders');
            setOrders(data);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'text-yellow-400 bg-yellow-400/10';
            case 'Dispatched': return 'text-green-400 bg-green-400/10'; // Green for Dispatched
            case 'Returned': return 'text-red-400 bg-red-400/10'; // Red for Returned
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    const StatusIcon = ({ status }) => {
        switch (status) {
            case 'Pending': return <Clock size={16} />;
            case 'Dispatched': return <Truck size={16} />;
            case 'Returned': return <XCircle size={16} />;
            default: return <Package size={16} />;
        }
    };

    const filteredOrders = orders.filter(order =>
        (order.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer?.phone || '').includes(searchTerm) ||
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.remark || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.paymentStatus || '').toLowerCase().includes(searchTerm.toLowerCase())
    );



    const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin';

    // ... fetchOrders, useEffect ...

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            const { data } = await api.post('/orders/bulk-import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert(`Import successful! ${data.successCount} orders imported. ${data.errorCount} errors.`);
            if (data.errorCount > 0) {
                console.warn("Import errors:", data.errors);
            }
            fetchOrders();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Import failed');
        } finally {
            setLoading(false);
            event.target.value = null; // Reset input
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await api.put(`/orders/${orderId}`, { status: newStatus });
            fetchOrders(); // Refresh to see changes (or update local state optimistically)
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };



    const handleBulkDelete = async () => {
        if (user?.role !== 'Super Admin') {
            alert('Only Super Admin can delete all orders.');
            return;
        }

        const password = window.prompt('WARNING: This will delete ALL orders in the system. Enter your password to authorize:');
        if (!password) return;

        if (window.confirm('Are you ABSOLUTELY sure? This action is IRREVERSIBLE.')) {
            if (window.confirm('Final confirmation: Delete all orders?')) {
                try {
                    setLoading(true);
                    const { data } = await api.delete('/orders/bulk-delete', { data: { password } });
                    alert(data.message);
                    fetchOrders();
                } catch (err) {
                    alert(err.response?.data?.message || 'Bulk deletion failed. Check your password.');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    const handleDelete = async (id) => {
        if (user?.role !== 'Super Admin' && user?.role !== 'Admin') {
            alert('Only Admin or Super Admin can delete orders.');
            return;
        }

        const password = window.prompt('Enter your password to authorize deletion:');
        if (!password) return;

        if (window.confirm('Are you ABSOLUTELY sure you want to delete this order?')) {
            try {
                await api.delete(`/orders/${id}`, { data: { password } });
                setOrders(currentOrders => currentOrders.filter(order => order._id !== id)); // Optimistic update
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete order. Check your password.');
                console.error(err);
                fetchOrders(); // Revert/Refresh on error
            }
        }
    };

    const handleRequestEdit = async (id) => {
        const message = window.prompt("Enter a note for the agent explaining why this order needs editing:");
        if (message) {
            try {
                await api.post(`/orders/${id}/request-edit`, { message });
                alert("Edit request sent!");
                fetchOrders(); // Refresh to show pending status
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to send request');
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container">
            <div style={{
                display: 'flex',
                flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: window.innerWidth <= 768 ? 'flex-start' : 'center',
                marginBottom: '2rem',
                gap: '1rem'
            }}>
                <h1 style={{ margin: 0 }}>Orders</h1>
                <div style={{
                    display: 'flex',
                    flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                    gap: '1rem',
                    width: window.innerWidth <= 768 ? '100%' : 'auto'
                }}>
                    <div className="input-group" style={{ marginBottom: 0, width: '100%' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Search orders..."
                                style={{ paddingLeft: '2.5rem', width: '100%', minWidth: window.innerWidth <= 768 ? '0' : '350px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', width: window.innerWidth <= 768 ? '100%' : 'auto' }}>
                        {isAdmin && (
                            <div style={{ flex: 1 }}>
                                <label htmlFor="csv-upload" className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1rem' }}>
                                    <Upload size={18} /> <span className={window.innerWidth <= 640 ? 'text-xs' : ''}>Import</span>
                                </label>
                                <input
                                    id="csv-upload"
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        )}
                        {user?.role === 'Super Admin' && (
                            <button
                                onClick={handleBulkDelete}
                                className="btn"
                                style={{
                                    background: 'var(--danger)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1rem',
                                    flex: 1
                                }}
                            >
                                <Trash2 size={18} /> <span className={window.innerWidth <= 640 ? 'text-xs' : ''}>Clear All</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>



            <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Order ID</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Customer</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Items</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Remark</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Add. Remark</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Total</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Payment</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Status</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Agent</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Date & Time</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order._id} style={{
                                    borderBottom: '1px solid var(--glass-border)',
                                    background: (order.editRequest?.pending && user?._id === (order.agent?._id || order.agent)) ? 'rgba(239, 68, 68, 0.25)' : order.isDownloaded ? 'rgba(74, 222, 128, 0.15)' : 'transparent',
                                    borderLeft: (order.editRequest?.pending && user?._id === (order.agent?._id || order.agent)) ? '4px solid #ef4444' : order.isDownloaded ? '4px solid var(--success)' : '4px solid transparent'
                                }}>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>
                                        #{order._id.slice(-6).toUpperCase()}
                                        {order.isDownloaded && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <CheckCircle size={12} /> Downloaded
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div
                                            onClick={() => setSelectedCustomer(order.customer)}
                                            style={{ fontWeight: 'bold', cursor: 'pointer', color: 'var(--primary)', textDecoration: 'none' }}
                                            className="customer-name-link"
                                            title="Click to view details"
                                        >
                                            {order.customer?.name || 'Unknown'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{order.customer?.phone}</div>
                                        {order.customer?.phone2 && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Alt: {order.customer?.phone2}</div>
                                        )}
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{order.customer?.city}, {order.customer?.country}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            {order.items.map((item, idx) => (
                                                <div key={idx} style={{ fontSize: '0.875rem' }}>
                                                    {item.quantity}x {item.productName}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', maxWidth: '350px' }}>
                                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={order.remark}>
                                            {order.remark || '-'}
                                            {order.discountAmount > 0 && (
                                                <div style={{ color: 'var(--success)', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: 'bold' }}>
                                                    Discount: Rs. {order.discountAmount.toFixed(2)}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', maxWidth: '350px' }}>
                                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={order.additionalRemark}>
                                            {order.additionalRemark || '-'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>
                                        Rs. {order.finalAmount?.toFixed(2)}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${order.paymentStatus === 'Paid' ? 'text-green-400 bg-green-400/10' : order.paymentStatus === 'Export' ? 'text-blue-400 bg-blue-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}
                                            style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                                            {order.paymentStatus || 'COD'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {isAdmin ? (
                                            <select
                                                className={`input-field ${getStatusColor(order.status)}`}
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                style={{ padding: '0.25rem', fontSize: '0.875rem', width: 'auto', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
                                            >
                                                <option value="Pending" className="text-yellow-400 bg-gray-900">Pending</option>
                                                <option value="Dispatched" className="text-green-400 bg-gray-900">Dispatched</option>
                                                <option value="Returned" className="text-red-400 bg-gray-900">Returned</option>
                                            </select>
                                        ) : (
                                            <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(order.status)}`}
                                                style={{ display: 'inline-flex', padding: '0.25rem 0.75rem', borderRadius: '9999px', gap: '0.5rem' }}>
                                                <StatusIcon status={order.status} />
                                                {order.status}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{order.agent?.name}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                                        <div>{new Date(order.createdAt).toLocaleString('en-GB', { hour12: false })}</div>
                                        {order.editedBy && order.editedBy.length > 0 && (() => {
                                            const lastEdit = order.editedBy[order.editedBy.length - 1];
                                            return (
                                                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-main)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#60a5fa' }}>
                                                        <Edit size={12} />
                                                        <span>Updated by {lastEdit.agent?.name || 'Unknown'}</span>
                                                    </div>
                                                    <div style={{ marginLeft: '1.25rem', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                                                        {new Date(lastEdit.at).toLocaleString('en-GB', { hour12: false })}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {/* DEBUG: Remove this later */}
                                        {console.log(`Order ${order._id}:`, {
                                            userId: user?._id,
                                            agentId: order.agent?._id,
                                            agentField: order.agent,
                                            pending: order.editRequest?.pending,
                                            match: user?._id === order.agent?._id?.toString()
                                        })}
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            {/* Edit Request Notification for Owner */}
                                            {(order.editRequest?.pending && user?._id === order.agent?._id?.toString()) && (
                                                <div
                                                    onClick={() => alert(`Request from ${order.editRequest.from?.name || 'Agent'}:\n\n${order.editRequest.message}`)}
                                                    title={`Request from ${order.editRequest.from?.name || 'Agent'}: ${order.editRequest.message}`}
                                                    style={{ color: '#ec4899', marginRight: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                >
                                                    <MessageCircle size={18} />
                                                    <span style={{ fontSize: '0.75rem', marginLeft: '0.25rem', maxWidth: '100px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                                        {order.editRequest.message}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?._id === order.agent?._id?.toString()) ? (
                                                <>
                                                    <button
                                                        onClick={() => navigate(`/order/edit/${order._id}`)}
                                                        className="btn"
                                                        style={{ padding: '0.25rem', background: 'transparent', color: 'var(--text-main)' }}
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    {(user?.role === 'Super Admin' || user?.role === 'Admin') && (
                                                        <button
                                                            onClick={() => handleDelete(order._id)}
                                                            className="btn"
                                                            style={{ padding: '0.25rem', background: 'transparent', color: 'var(--danger)' }}
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                // Request Edit Button for Non-Owners
                                                <button
                                                    onClick={() => handleRequestEdit(order._id)}
                                                    className="btn"
                                                    style={{ padding: '0.25rem', background: 'transparent', color: 'var(--text-dim)' }}
                                                    title="Request Edit"
                                                >
                                                    <MessageCircle size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Customer Details Popup */}
            {selectedCustomer && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => setSelectedCustomer(null)}
                >
                    <div
                        className="card glass"
                        style={{
                            width: '95%',
                            maxWidth: '450px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            padding: window.innerWidth <= 768 ? '1.5rem' : '2rem',
                            position: 'relative',
                            border: '1px solid var(--primary)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, color: 'var(--primary)' }}>Customer Details</h2>
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                style={{ background: 'transparent', color: 'var(--text-dim)', fontSize: '1.5rem', lineHeight: 1 }}
                            >
                                &times;
                            </button>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div className="detail-item">
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Full Name</label>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedCustomer.name}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="detail-item">
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Phone</label>
                                    <div>{selectedCustomer.phone}</div>
                                </div>
                                {selectedCustomer.phone2 && (
                                    <div className="detail-item">
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Phone 2 (Alt)</label>
                                        <div>{selectedCustomer.phone2}</div>
                                    </div>
                                )}
                            </div>

                            <div className="detail-item">
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Address</label>
                                <div style={{ lineHeight: '1.4' }}>{selectedCustomer.address || 'No address provided'}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="detail-item">
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>City</label>
                                    <div>{selectedCustomer.city || 'N/A'}</div>
                                </div>
                                <div className="detail-item">
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Country</label>
                                    <div>{selectedCustomer.country || 'Sri Lanka'}</div>
                                </div>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '2rem' }}
                            onClick={() => setSelectedCustomer(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .customer-name-link:hover {
                    text-decoration: underline !important;
                    color: var(--primary-light) !important;
                }
            `}</style>
        </div>
    );
};

export default Orders;
