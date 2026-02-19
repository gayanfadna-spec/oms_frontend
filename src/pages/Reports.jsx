import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../api/axios';
import { Download, Calendar } from 'lucide-react';

const Reports = () => {
    const { user } = useContext(AuthContext);

    // Get current month start and end in 24h format (YYYY-MM-DDTHH:mm)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const formatForInput = (date) => {
        const pad = (num) => String(num).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const [startDate, setStartDate] = useState(formatForInput(firstDay));
    const [endDate, setEndDate] = useState(formatForInput(lastDay));
    const [paymentStatus, setPaymentStatus] = useState('All');
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState('All');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [history, setHistory] = useState([]);

    const fetchAgents = async () => {
        try {
            const { data } = await api.get('/auth/agents');
            setAgents(data);
        } catch (err) {
            console.error("Failed to fetch agents", err);
        }
    };

    const fetchHistory = async () => {
        if (user.role === 'Agent') return; // Agents don't see export history
        try {
            const { data } = await api.get('/orders/export-history');
            setHistory(data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    };

    useEffect(() => {
        if (user && (user.role === 'Admin' || user.role === 'Super Admin')) {
            fetchHistory();
            fetchAgents();
        }
    }, [user]);

    const handleDownload = async () => {
        if (!startDate || !endDate) {
            setError('Please select both start and end dates.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let data;

            if (user.role === 'Agent') {
                // Agent - Get My Report (Read Only)
                const response = await api.get('/orders/my-report', {
                    params: {
                        startDate: new Date(startDate).toISOString(),
                        endDate: new Date(endDate).toISOString(),
                        paymentStatus
                    }
                });
                data = response.data;
            } else {
                // Admin - Export (Updates Status)
                const response = await api.put('/orders/export', {
                    startDate: new Date(startDate).toISOString(),
                    endDate: new Date(endDate).toISOString(),
                    paymentStatus,
                    agentId: selectedAgent
                });
                data = response.data;
            }

            if (data.length === 0) {
                setError('No orders found for the selected periods.');
                setLoading(false);
                return;
            }

            // Convert JSON to CSV
            const headers = [
                'Date', 'Time', 'Product', 'Remark', 'Subtotal (Rs.)', 'Discount (Rs.)', 'Delivery (Rs.)', 'Total (Rs.)', 'Customer Name', 'Address', 'City',
                'Contact 1', 'Contact 2', 'Qty', 'Payment Status',
                'Items Detail', 'Additional Remark', 'Agent'
            ];

            const isAdmin = user.role === 'Admin' || user.role === 'Super Admin';
            if (isAdmin) {
                headers.unshift('Order ID');
            }

            const csvRows = [headers.join(',')];

            data.forEach(order => {
                const productNames = order.items.map(i => i.productName).join(', ');
                const itemsWithQty = order.items.map(i => `${i.productName} ${i.quantity}`).join('; ');
                const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

                const createdAt = new Date(order.createdAt);

                const pad = (num) => String(num).padStart(2, '0');
                const dateStr = `${pad(createdAt.getDate())}/${pad(createdAt.getMonth() + 1)}/${createdAt.getFullYear()}`;
                const timeStr = `${pad(createdAt.getHours())}:${pad(createdAt.getMinutes())}:${pad(createdAt.getSeconds())}`;

                const row = [
                    `"${dateStr}"`,
                    `"${timeStr}"`,
                    `"${productNames.replace(/"/g, '""')}"`,
                    `"${(order.remark || '').replace(/"/g, '""')}"`,
                    order.totalAmount || 0,
                    order.discountAmount || 0,
                    order.deliveryCharge || 0,
                    order.finalAmount || 0,
                    `"${(order.customer?.name || 'N/A').replace(/"/g, '""')}"`,
                    `"${(order.customer?.address || '').replace(/"/g, '""')}"`,
                    `"${(order.customer?.city || '').replace(/"/g, '""')}"`,
                    `"${(order.customer?.phone || '').replace(/"/g, '""')}"`,
                    `"${(order.customer?.phone2 || '').replace(/"/g, '""')}"`,
                    totalQty,
                    `"${(order.paymentStatus || '').replace(/"/g, '""')}"`,
                    `"${itemsWithQty.replace(/"/g, '""')}"`,
                    `"${(order.additionalRemark || '').replace(/"/g, '""')}"`,
                    `"${(order.agent?.name || 'Unknown').replace(/"/g, '""')}"`
                ];

                if (isAdmin) {
                    row.unshift(`#${order._id.slice(-6).toUpperCase()}`);
                }

                csvRows.push(row.join(','));
            });

            const csvString = csvRows.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            const agentName = selectedAgent !== 'All'
                ? agents.find(a => a._id === selectedAgent)?.name?.replace(/\s+/g, '_') || 'Agent'
                : 'All_Agents';

            const formatFileNameDate = (d) => d.replace(/[:T]/g, '-').slice(0, 16);
            a.setAttribute('download', `orders_report_${agentName}_${formatFileNameDate(startDate)}_to_${formatFileNameDate(endDate)}.csv`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Refresh history only for admins
            if (user.role === 'Admin' || user.role === 'Super Admin') {
                fetchHistory();
            }

        } catch (err) {
            console.error("Download failed", err);
            setError('Failed to download report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1 style={{ marginBottom: '2rem' }}>Reports</h1>

            <div className="card glass" style={{ maxWidth: '600px', margin: '0 auto', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.75rem', background: 'var(--primary)', borderRadius: '0.5rem', color: 'white' }}>
                        <Download size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                            {user?.role === 'Agent' ? 'My Monthly Report' : 'Export Orders (Dispatch)'}
                        </h2>
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                            {user?.role === 'Agent'
                                ? 'Download a personal report of your orders. Does not change order status.'
                                : 'Download and dispatch orders within a specific date range.'}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Start Date & Time</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input
                                type="datetime-local"
                                className="input-field"
                                style={{ paddingLeft: '2.5rem' }}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">End Date & Time</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input
                                type="datetime-local"
                                className="input-field"
                                style={{ paddingLeft: '2.5rem' }}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Payment Type</label>
                        <select
                            className="input-field"
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                        >
                            <option value="All">All Payment Types</option>
                            <option value="Paid">Paid</option>
                            <option value="COD">COD</option>
                            <option value="Export">Export</option>
                        </select>
                    </div>

                    {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Select Agent</label>
                            <select
                                className="input-field"
                                value={selectedAgent}
                                onChange={(e) => setSelectedAgent(e.target.value)}
                            >
                                <option value="All">All Agents</option>
                                {agents.map(agent => (
                                    <option key={agent._id} value={agent._id}>
                                        {agent.name} ({agent.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {error && (
                    <div style={{ padding: '0.75rem', background: 'var(--danger)', color: 'white', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleDownload}
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                    disabled={loading}
                >
                    {loading ? 'Generating Report...' : (
                        <>
                            <Download size={20} /> {user?.role === 'Agent' ? 'Download My Report' : 'Export & Dispatch'}
                        </>
                    )}
                </button>
            </div>

            {user && (user.role === 'Admin' || user.role === 'Super Admin') && (
                <div className="card glass">
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Download History</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem', color: 'var(--text-dim)', fontSize: '0.875rem' }}>Date & Time</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--text-dim)', fontSize: '0.875rem' }}>Downloaded By</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--text-dim)', fontSize: '0.875rem' }}>Period</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--text-dim)', fontSize: '0.875rem' }}>Payment Type</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--text-dim)', fontSize: '0.875rem' }}>Orders</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((log) => (
                                    <tr key={log._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                                            {(() => {
                                                const d = new Date(log.generatedAt);
                                                const pad = (num) => String(num).padStart(2, '0');
                                                return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                                            })()}
                                        </td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                                            {log.generatedBy?.name || 'Unknown'}
                                        </td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                                            {(() => {
                                                const s = new Date(log.startDate);
                                                const e = new Date(log.endDate);
                                                const pad = (num) => String(num).padStart(2, '0');
                                                const format = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                                return `${format(s)} - ${format(e)}`;
                                            })()}
                                        </td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${log.paymentStatus === 'Paid' ? 'text-green-400 bg-green-400/10' : log.paymentStatus === 'Export' ? 'text-blue-400 bg-blue-400/10' : log.paymentStatus === 'COD' ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400 bg-gray-400/10'}`}
                                                style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                                                {log.paymentStatus || 'All'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                                            {log.orderCount}
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                                            No download history found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
//ww