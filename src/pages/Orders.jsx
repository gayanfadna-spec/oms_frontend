import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import {
    Search, Filter, ChevronDown, CheckCircle, XCircle, Clock, Truck,
    Package, Edit, Trash2, Upload, MessageCircle, MapPin, Eye,
    Printer, Copy, Check, ShoppingBag, DollarSign, Calendar, User, FileText, Phone, Mail
} from 'lucide-react';

const Orders = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [agentFilter, setAgentFilter] = useState('');
    const [markFilter, setMarkFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [copiedId, setCopiedId] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const LIMIT = 50;

    const fetchOrders = async (pageNumber = 1, append = false) => {
        try {
            if (append) setLoadingMore(true);
            else setLoading(true);

            const { data } = await api.get(`/orders?page=${pageNumber}&limit=${LIMIT}`);
            
            if (append) {
                setOrders(prev => [...prev, ...data]);
            } else {
                setOrders(data);
            }

            if (data.length < LIMIT) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchOrders(1, false);
    }, []);

    useEffect(() => {
        setSelectedOrderIds([]);
    }, [searchTerm]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchOrders(nextPage, true);
    };

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

    const uniqueAgents = [...new Set(orders.map(order => order.agent?.name).filter(Boolean))];

    const freeIssueCount = orders.filter(o => o.isFreeIssue).length;
    const exchangeCount = orders.filter(o => o.isExchange).length;

    const filteredOrders = orders.filter(order => {
        const matchesSearch = (order.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.customer?.phone || '').includes(searchTerm) ||
            order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.remark || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.paymentStatus || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.isFreeIssue && 'free issue'.includes(searchTerm.toLowerCase())) ||
            (order.isExchange && 'exchange'.includes(searchTerm.toLowerCase()));
            
        const matchesAgent = agentFilter ? order.agent?.name === agentFilter : true;
        
        const matchesMark = markFilter === 'ALL'
            ? true
            : markFilter === 'FREE_ISSUE'
                ? Boolean(order.isFreeIssue)
                : markFilter === 'EXCHANGE'
                    ? Boolean(order.isExchange)
                    : true;

        const matchesStatus = statusFilter === 'ALL'
            ? true
            : order.status === statusFilter;

        return matchesSearch && matchesAgent && matchesMark && matchesStatus;
    });

    const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin';

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
            fetchOrders(1, false);
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
            fetchOrders(1, false); // Refresh to see changes (or update local state optimistically)
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };


    const handleDeleteSelected = async () => {
        if (!isAdmin) {
            alert('Only Admin or Super Admin can delete orders.');
            return;
        }

        const password = window.prompt(`Enter your password to authorize deletion of ${selectedOrderIds.length} orders:`);
        if (!password) return;

        if (window.confirm(`Are you sure you want to delete ${selectedOrderIds.length} selected orders?`)) {
            try {
                setLoading(true);
                const { data } = await api.delete('/orders/bulk-delete', { data: { password, orderIds: selectedOrderIds } });
                alert(data.message);
                setSelectedOrderIds([]);
                fetchOrders(1, false);
            } catch (err) {
                alert(err.response?.data?.message || 'Deletion failed. Check your password.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    const toggleSelectOrder = (id) => {
        setSelectedOrderIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0) {
            setSelectedOrderIds([]);
        } else {
            setSelectedOrderIds(filteredOrders.map(o => o._id));
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
                fetchOrders(1, false); // Revert/Refresh on error
            }
        }
    };

    const handleRequestEdit = async (id) => {
        const message = window.prompt("Enter a note for the agent explaining why this order needs editing:");
        if (message) {
            try {
                await api.post(`/orders/${id}/request-edit`, { message });
                alert("Edit request sent!");
                fetchOrders(1, false); // Refresh to show pending status
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to send request');
            }
        }
    };

    const handleOpenOrderDetails = async (order) => {
        setSelectedOrder(order);
        try {
            const { data } = await api.get(`/orders/${order._id}`);
            setSelectedOrder(data);
        } catch (err) {
            console.error("Failed to fetch fresh order details", err);
        }
    };

    const handleCopyId = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Orders</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Search orders..."
                                style={{ paddingLeft: '2.5rem', width: '350px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {isAdmin && (
                        <div>
                            <label htmlFor="csv-upload" className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Upload size={18} /> Import CSV
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
                    {isAdmin && selectedOrderIds.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="btn"
                            style={{ background: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Trash2 size={18} /> Delete Selected ({selectedOrderIds.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Tabs Toolbar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.25rem',
                padding: '0.6rem 1rem',
                background: 'var(--bg-card)',
                borderRadius: '0.75rem',
                border: '1px solid var(--glass-border)'
            }}>
                {/* Order Mark Filters: All, Free Issue, Exchange */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', marginRight: '0.25rem' }}>Type:</span>
                    <button
                        onClick={() => setMarkFilter('ALL')}
                        style={{
                            padding: '0.35rem 0.85rem',
                            borderRadius: '9999px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: markFilter === 'ALL' ? 'var(--primary)' : 'transparent',
                            color: markFilter === 'ALL' ? '#ffffff' : 'var(--text-dim)',
                            border: markFilter === 'ALL' ? 'none' : '1px solid var(--glass-border)',
                            transition: 'all 0.2s'
                        }}
                    >
                        All ({orders.length})
                    </button>

                    <button
                        onClick={() => setMarkFilter('FREE_ISSUE')}
                        style={{
                            padding: '0.35rem 0.85rem',
                            borderRadius: '9999px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: markFilter === 'FREE_ISSUE' ? '#3b82f6' : 'rgba(59, 130, 246, 0.1)',
                            color: markFilter === 'FREE_ISSUE' ? '#ffffff' : '#60a5fa',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            transition: 'all 0.2s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                        }}
                    >
                        <span>Free Issue</span>
                        <span style={{
                            background: markFilter === 'FREE_ISSUE' ? 'rgba(255,255,255,0.25)' : 'rgba(59, 130, 246, 0.2)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '9999px',
                            fontSize: '0.7rem'
                        }}>
                            {freeIssueCount}
                        </span>
                    </button>

                    <button
                        onClick={() => setMarkFilter('EXCHANGE')}
                        style={{
                            padding: '0.35rem 0.85rem',
                            borderRadius: '9999px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: markFilter === 'EXCHANGE' ? '#f59e0b' : 'rgba(245, 158, 11, 0.1)',
                            color: markFilter === 'EXCHANGE' ? '#ffffff' : '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            transition: 'all 0.2s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                        }}
                    >
                        <span>Exchange</span>
                        <span style={{
                            background: markFilter === 'EXCHANGE' ? 'rgba(255,255,255,0.25)' : 'rgba(245, 158, 11, 0.2)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '9999px',
                            fontSize: '0.7rem'
                        }}>
                            {exchangeCount}
                        </span>
                    </button>
                </div>

                {/* Status Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', marginRight: '0.25rem' }}>Status:</span>
                    {['ALL', 'Pending', 'Dispatched', 'Returned'].map(st => (
                        <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            style={{
                                padding: '0.3rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                background: statusFilter === st ? 'var(--text-light)' : 'transparent',
                                color: statusFilter === st ? 'var(--bg-dark)' : 'var(--text-dim)',
                                border: statusFilter === st ? 'none' : '1px solid var(--glass-border)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {st === 'ALL' ? 'All' : st}
                        </button>
                    ))}
                    {(markFilter !== 'ALL' || statusFilter !== 'ALL') && (
                        <button
                            onClick={() => { setMarkFilter('ALL'); setStatusFilter('ALL'); }}
                            style={{
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.75rem',
                                background: 'transparent',
                                color: 'var(--danger)',
                                cursor: 'pointer'
                            }}
                            title="Reset filters"
                        >
                            Reset
                        </button>
                    )}
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
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <select
                                            value={agentFilter}
                                            onChange={(e) => setAgentFilter(e.target.value)}
                                            style={{
                                                background: 'transparent',
                                                color: agentFilter ? 'var(--text-main)' : 'var(--text-dim)',
                                                border: 'none',
                                                outline: 'none',
                                                cursor: 'pointer',
                                                fontWeight: 500,
                                                fontSize: '0.875rem',
                                                appearance: 'none',
                                                paddingRight: '1rem',
                                                backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ef4444%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'right center',
                                                backgroundSize: '10px'
                                            }}
                                            title="Filter by Agent"
                                        >
                                            <option value="" style={{ color: 'black' }}>Agent</option>
                                            {uniqueAgents.map(agent => (
                                                <option key={agent} value={agent} style={{ color: 'black' }}>{agent}</option>
                                            ))}
                                        </select>
                                    </div>
                                </th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Date & Time</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Actions</th>
                                {isAdmin && (
                                    <th style={{ padding: '1rem', width: '40px', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                                            onChange={toggleSelectAll}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr
                                    key={order._id}
                                    className="order-table-row"
                                    onClick={() => handleOpenOrderDetails(order)}
                                    title="Click to view full order details"
                                    style={{
                                        borderBottom: '1px solid var(--glass-border)',
                                        background: (order.editRequest?.pending && user?._id === (order.agent?._id || order.agent)) ? 'rgba(239, 68, 68, 0.25)' : order.isDownloaded ? 'rgba(74, 222, 128, 0.15)' : 'transparent',
                                        borderLeft: (order.editRequest?.pending && user?._id === (order.agent?._id || order.agent)) ? '4px solid #ef4444' : order.isDownloaded ? '4px solid var(--success)' : '4px solid transparent',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenOrderDetails(order); }}
                                            style={{
                                                background: 'rgba(101, 189, 74, 0.12)',
                                                border: '1px solid rgba(101, 189, 74, 0.3)',
                                                color: 'var(--primary)',
                                                borderRadius: '0.375rem',
                                                padding: '0.25rem 0.5rem',
                                                fontFamily: 'monospace',
                                                fontWeight: 700,
                                                fontSize: '0.85rem',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                cursor: 'pointer'
                                            }}
                                            title="Click to view full order details"
                                        >
                                            <Eye size={13} />
                                            #{order._id.slice(-6).toUpperCase()}
                                        </button>
                                        {order.isDownloaded && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <CheckCircle size={12} /> Downloaded
                                            </div>
                                        )}
                                        {(order.isFreeIssue || order.isExchange) && (
                                            <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                                                {order.isFreeIssue && (
                                                    <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa', fontWeight: 'bold' }}>
                                                        FREE ISSUE
                                                    </span>
                                                )}
                                                {order.isExchange && (
                                                    <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontWeight: 'bold' }}>
                                                        EXCHANGE
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div
                                            style={{ fontWeight: 'bold', cursor: 'pointer', color: 'var(--primary)' }}
                                            onClick={(e) => { e.stopPropagation(); setSelectedCustomer(order.customer); }}
                                            title="View Customer Profile"
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
                                    <td style={{ padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
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
                                        <div>{new Date(order.createdAt).toLocaleString()}</div>
                                        {order.editedBy && order.editedBy.length > 0 && (() => {
                                            const lastEdit = order.editedBy[order.editedBy.length - 1];
                                            return (
                                                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-main)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#60a5fa' }}>
                                                        <Edit size={12} />
                                                        <span>Updated by {lastEdit.agent?.name || 'Unknown'}</span>
                                                    </div>
                                                    <div style={{ marginLeft: '1.25rem', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                                                        {new Date(lastEdit.at).toLocaleString()}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td style={{ padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            {/* View Full Details Button */}
                                            <button
                                                onClick={() => handleOpenOrderDetails(order)}
                                                className="btn"
                                                style={{ padding: '0.25rem', background: 'transparent', color: 'var(--primary)' }}
                                                title="View Full Order Details"
                                            >
                                                <Eye size={18} />
                                            </button>

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
                                    {isAdmin && (
                                        <td style={{ padding: '1rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedOrderIds.includes(order._id)}
                                                onChange={() => toggleSelectOrder(order._id)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {hasMore && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', marginBottom: '2rem' }}>
                    <button
                        onClick={handleLoadMore}
                        className="btn btn-primary"
                        disabled={loadingMore}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}
                    >
                        {loadingMore ? (
                            <>
                                <Clock className="animate-spin" size={18} />
                                Loading...
                            </>
                        ) : (
                            <>
                                <ChevronDown size={18} />
                                Load More Orders
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Customer Details Modal */}
            {selectedCustomer && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '2rem'
                }} onClick={() => setSelectedCustomer(null)}>
                    <div className="card glass" style={{
                        maxWidth: '500px',
                        width: '100%',
                        position: 'relative',
                        padding: '2rem'
                    }} onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedCustomer(null)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'transparent',
                                color: 'var(--text-dim)'
                            }}
                        >
                            <XCircle size={24} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: 'white'
                            }}>
                                {selectedCustomer.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 style={{ margin: 0 }}>{selectedCustomer.name}</h2>
                                <p style={{ margin: 0, color: 'var(--text-dim)' }}>Customer Profile</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                                <MessageCircle size={20} style={{ color: 'var(--primary)', marginTop: '0.25rem' }} />
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Primary Contact</div>
                                    <div style={{ fontWeight: 500 }}>{selectedCustomer.phone}</div>
                                    {selectedCustomer.phone2 && (
                                        <>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>Secondary Contact</div>
                                            <div style={{ fontWeight: 500 }}>{selectedCustomer.phone2}</div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                                <MapPin size={20} style={{ color: 'var(--primary)', marginTop: '0.25rem' }} />
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Address</div>
                                    <div style={{ fontWeight: 500 }}>
                                        {selectedCustomer.address}<br />
                                        {selectedCustomer.city}, {selectedCustomer.country}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '2rem' }}
                            onClick={() => setSelectedCustomer(null)}
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            )}

            {/* Order Full Details Modal */}
            {selectedOrder && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }} onClick={() => setSelectedOrder(null)}>
                    <div
                        id="order-details-printable"
                        className="card glass"
                        style={{
                            maxWidth: '850px',
                            width: '100%',
                            maxHeight: '92vh',
                            overflowY: 'auto',
                            position: 'relative',
                            padding: '2rem',
                            borderRadius: '1rem'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            className="no-print"
                            onClick={() => setSelectedOrder(null)}
                            style={{
                                position: 'absolute',
                                top: '1.25rem',
                                right: '1.25rem',
                                background: 'transparent',
                                color: 'var(--text-dim)',
                                cursor: 'pointer',
                                padding: '0.25rem'
                            }}
                            title="Close"
                        >
                            <XCircle size={24} />
                        </button>

                        {/* Modal Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            paddingBottom: '1.5rem',
                            borderBottom: '1px solid var(--glass-border)',
                            marginBottom: '1.5rem'
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <h2 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Package size={24} style={{ color: 'var(--primary)' }} />
                                        Order Details
                                        <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>
                                            #{selectedOrder._id.slice(-6).toUpperCase()}
                                        </span>
                                    </h2>
                                    {/* Copy Full Mongo ID */}
                                    <button
                                        className="no-print"
                                        onClick={() => handleCopyId(selectedOrder._id)}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid var(--glass-border)',
                                            color: 'var(--text-dim)',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            fontFamily: 'monospace'
                                        }}
                                        title="Copy full Mongo ID"
                                    >
                                        {copiedId ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                                        {copiedId ? 'Copied ID' : selectedOrder._id}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <Calendar size={14} />
                                        {new Date(selectedOrder.createdAt).toLocaleString()}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <User size={14} />
                                        Agent: <strong style={{ color: 'var(--text-main)' }}>{selectedOrder.agent?.name || 'Unknown'}</strong>
                                    </span>
                                </div>
                            </div>

                            {/* Status Badges */}
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem' }}>
                                    <StatusIcon status={selectedOrder.status} />
                                    {selectedOrder.status}
                                </span>
                                <span style={{
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    background: selectedOrder.paymentStatus === 'Paid' ? 'rgba(74, 222, 128, 0.15)' : selectedOrder.paymentStatus === 'Export' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(250, 204, 21, 0.15)',
                                    color: selectedOrder.paymentStatus === 'Paid' ? '#4ade80' : selectedOrder.paymentStatus === 'Export' ? '#60a5fa' : '#facc15'
                                }}>
                                    Payment: {selectedOrder.paymentStatus || 'COD'}
                                </span>
                                {selectedOrder.isDownloaded && (
                                    <span style={{
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        background: 'rgba(74, 222, 128, 0.15)',
                                        color: '#4ade80',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}>
                                        <CheckCircle size={12} /> Exported
                                    </span>
                                )}
                                {selectedOrder.isFreeIssue && (
                                    <span style={{
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        background: 'rgba(96, 165, 250, 0.2)',
                                        color: '#60a5fa'
                                    }}>
                                        Free Issue
                                    </span>
                                )}
                                {selectedOrder.isExchange && (
                                    <span style={{
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        background: 'rgba(245, 158, 11, 0.2)',
                                        color: '#f59e0b'
                                    }}>
                                        Exchange
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Edit Alert (if pending) */}
                        {selectedOrder.editRequest?.pending && (
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.5rem',
                                marginBottom: '1.5rem',
                                fontSize: '0.875rem'
                            }}>
                                <strong>Edit Request Pending:</strong> {selectedOrder.editRequest.message}
                                {selectedOrder.editRequest.from?.name && <span> (Requested by: {selectedOrder.editRequest.from.name})</span>}
                            </div>
                        )}

                        {/* Two Column Section: Customer & Notes */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: '1.25rem',
                            marginBottom: '1.5rem'
                        }}>
                            {/* Customer Details Box */}
                            <div style={{
                                background: 'var(--bg-dark)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '0.75rem',
                                padding: '1.25rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '50%',
                                        background: 'var(--primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        color: 'white',
                                        fontSize: '1.1rem'
                                    }}>
                                        {selectedOrder.customer?.name?.charAt(0).toUpperCase() || 'C'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                                            {selectedOrder.customer?.name || 'Customer Name Unavailable'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Customer Profile</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Phone size={15} style={{ color: 'var(--primary)' }} />
                                        <span>Primary Phone: <strong>{selectedOrder.customer?.phone || '-'}</strong></span>
                                    </div>
                                    {selectedOrder.customer?.phone2 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Phone size={15} style={{ color: 'var(--text-dim)' }} />
                                            <span>Secondary Phone: <strong>{selectedOrder.customer.phone2}</strong></span>
                                        </div>
                                    )}
                                    {selectedOrder.customer?.email && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Mail size={15} style={{ color: 'var(--primary)' }} />
                                            <span>Email: <strong>{selectedOrder.customer.email}</strong></span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.25rem' }}>
                                        <MapPin size={16} style={{ color: 'var(--primary)', marginTop: '0.15rem', flexShrink: 0 }} />
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Delivery Address:</div>
                                            <div style={{ fontWeight: 500 }}>
                                                {selectedOrder.customer?.address || '-'}
                                                {selectedOrder.customer?.city ? `, ${selectedOrder.customer.city}` : ''}
                                                {selectedOrder.customer?.country ? `, ${selectedOrder.customer.country}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Notes & Edit History Box */}
                            <div style={{
                                background: 'var(--bg-dark)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '0.75rem',
                                padding: '1.25rem'
                            }}>
                                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileText size={18} style={{ color: 'var(--primary)' }} />
                                    Order Notes & Remarks
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                                    <div>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Primary Remark:</span>
                                        <div style={{ fontWeight: 500, marginTop: '0.15rem' }}>
                                            {selectedOrder.remark || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>None</span>}
                                        </div>
                                    </div>

                                    {selectedOrder.additionalRemark && (
                                        <div>
                                            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Additional Remark:</span>
                                            <div style={{ fontWeight: 500, marginTop: '0.15rem' }}>
                                                {selectedOrder.additionalRemark}
                                            </div>
                                        </div>
                                    )}

                                    {selectedOrder.editedBy && selectedOrder.editedBy.length > 0 && (
                                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                                            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Modification History:</span>
                                            {selectedOrder.editedBy.map((edit, idx) => (
                                                <div key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                                                    Updated by <strong style={{ color: 'var(--text-main)' }}>{edit.agent?.name || 'Agent'}</strong> on {new Date(edit.at).toLocaleString()}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Order Items Table */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ShoppingBag size={18} style={{ color: 'var(--primary)' }} />
                                Ordered Products ({selectedOrder.items?.length || 0})
                            </div>

                            <div style={{
                                overflowX: 'auto',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '0.75rem',
                                background: 'var(--bg-dark)'
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.05)' }}>
                                            <th style={{ padding: '0.75rem 1rem', color: 'var(--text-dim)', fontWeight: 600 }}>#</th>
                                            <th style={{ padding: '0.75rem 1rem', color: 'var(--text-dim)', fontWeight: 600 }}>Product Name</th>
                                            <th style={{ padding: '0.75rem 1rem', color: 'var(--text-dim)', fontWeight: 600, textAlign: 'center' }}>Qty</th>
                                            <th style={{ padding: '0.75rem 1rem', color: 'var(--text-dim)', fontWeight: 600, textAlign: 'right' }}>Unit Price</th>
                                            <th style={{ padding: '0.75rem 1rem', color: 'var(--text-dim)', fontWeight: 600, textAlign: 'right' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.items?.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                                                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-dim)', width: '40px' }}>{idx + 1}</td>
                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{item.productName}</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        background: 'rgba(255,255,255,0.08)',
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: '0.25rem',
                                                        fontWeight: 600
                                                    }}>
                                                        {item.quantity}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Rs. {item.price?.toFixed(2)}</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                                                    Rs. {(item.price * item.quantity).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{
                                width: '100%',
                                maxWidth: '380px',
                                background: 'var(--bg-dark)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '0.75rem',
                                padding: '1rem 1.25rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.875rem' }}>
                                    <span style={{ color: 'var(--text-dim)' }}>Subtotal:</span>
                                    <span>Rs. {selectedOrder.totalAmount?.toFixed(2)}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.875rem' }}>
                                    <span style={{ color: 'var(--text-dim)' }}>Delivery Charge:</span>
                                    <span>Rs. {(selectedOrder.deliveryCharge || 0).toFixed(2)}</span>
                                </div>

                                {selectedOrder.discountAmount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.875rem', color: 'var(--success)' }}>
                                        <span>Discount:</span>
                                        <span>- Rs. {selectedOrder.discountAmount?.toFixed(2)}</span>
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    paddingTop: '0.75rem',
                                    marginTop: '0.5rem',
                                    borderTop: '2px solid var(--glass-border)',
                                    fontSize: '1.15rem',
                                    fontWeight: 'bold'
                                }}>
                                    <span>Final Total:</span>
                                    <span style={{ color: 'var(--primary)' }}>
                                        Rs. {selectedOrder.finalAmount?.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions Footer */}
                        <div className="no-print" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            paddingTop: '1.25rem',
                            borderTop: '1px solid var(--glass-border)'
                        }}>
                            <button
                                onClick={() => window.print()}
                                className="btn"
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--glass-border)',
                                    color: 'var(--text-main)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.6rem 1.25rem'
                                }}
                            >
                                <Printer size={18} /> Print Order
                            </button>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?._id === (selectedOrder.agent?._id || selectedOrder.agent)?.toString()) && (
                                    <button
                                        onClick={() => {
                                            const id = selectedOrder._id;
                                            setSelectedOrder(null);
                                            navigate(`/order/edit/${id}`);
                                        }}
                                        className="btn"
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid var(--primary)',
                                            color: 'var(--primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.6rem 1.25rem'
                                        }}
                                    >
                                        <Edit size={18} /> Edit Order
                                    </button>
                                )}
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setSelectedOrder(null)}
                                    style={{ padding: '0.6rem 1.75rem' }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
