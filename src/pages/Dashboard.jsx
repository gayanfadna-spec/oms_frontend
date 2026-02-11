import { useContext, useState, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../api/axios';
import { ShoppingCart, Users, BadgeDollarSign, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="card glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{title}</p>
                <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{value}</h3>
            </div>
            <div style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: `${color}20`,
                color: color
            }}>
                <Icon size={24} />
            </div>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--success)' }}>
            Today
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        todaysRevenue: 0,
        totalCustomers: 0,
        recentOrders: []
    });
    const [matrixData, setMatrixData] = useState({ agents: [], products: [], data: {} });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/orders/stats');
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchMatrix = async () => {
            try {
                const { data } = await api.get('/orders/matrix');
                setMatrixData(data);
            } catch (err) {
                console.error("Failed to fetch dashboard matrix", err);
            }
        };

        fetchStats();
        fetchMatrix();
    }, []);

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="container">
            <h1 style={{ marginBottom: '2rem' }}>Dashboard</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }} className="grid-cols-1-mobile">
                <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} color="#65bd4a" />
                <StatCard title="Today's Revenue" value={`Rs. ${stats.todaysRevenue?.toFixed(2) || '0.00'}`} icon={BadgeDollarSign} color="#10b981" />
                <StatCard title="Total Customers" value={stats.totalCustomers} icon={Users} color="#f59e0b" />
                <StatCard title="Performance" value="100%" icon={TrendingUp} color="#ec4899" />
            </div>

            {matrixData.products.length > 0 ? (
                <div className="card glass" style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>Agent-wise Product Order Count (Today)</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Updated: {new Date().toLocaleString('en-GB', { hour12: false })}</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '1rem', color: 'var(--text-dim)', background: 'rgba(0,0,0,0.2)', position: 'sticky', left: 0, zIndex: 1 }}>Agent</th>
                                    {matrixData.products.map(p => (
                                        <th key={p} style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 600, minWidth: '120px', textAlign: 'center' }}>
                                            {p}
                                        </th>
                                    ))}
                                    <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 'bold', textAlign: 'center' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matrixData.agents.map(agent => {
                                    let agentTotal = 0;
                                    return (
                                        <tr key={agent} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 500, background: 'rgba(0,0,0,0.2)', position: 'sticky', left: 0, zIndex: 1 }}>{agent}</td>
                                            {matrixData.products.map(product => {
                                                const count = matrixData.data[agent]?.[product] || 0;
                                                agentTotal += count;
                                                return (
                                                    <td key={product} style={{ padding: '1rem', textAlign: 'center', color: count > 0 ? 'var(--success)' : 'var(--text-dim)', fontWeight: count > 0 ? 600 : 400 }}>
                                                        {count}
                                                    </td>
                                                );
                                            })}
                                            <td style={{ padding: '1rem', fontWeight: 'bold', textAlign: 'center', color: 'var(--text-main)' }}>{agentTotal}</td>
                                        </tr>
                                    );
                                })}
                                {/* Grand Total Row */}
                                <tr style={{ background: 'rgba(255,255,255,0.05)', borderTop: '2px solid var(--glass-border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold', background: 'rgba(0,0,0,0.3)', position: 'sticky', left: 0, zIndex: 1 }}>Grand Total</td>
                                    {matrixData.products.map(product => {
                                        let productTotal = 0;
                                        matrixData.agents.forEach(agent => {
                                            productTotal += (matrixData.data[agent]?.[product] || 0);
                                        });
                                        return (
                                            <td key={product} style={{ padding: '1rem', fontWeight: 'bold', textAlign: 'center', color: '#60a5fa' }}>{productTotal}</td>
                                        );
                                    })}
                                    <td style={{ padding: '1rem', fontWeight: 'bold', textAlign: 'center', color: '#60a5fa' }}>
                                        {matrixData.agents.reduce((acc, agent) => {
                                            return acc + (Object.values(matrixData.data[agent] || {}).reduce((a, b) => a + b, 0));
                                        }, 0)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="card glass" style={{ marginTop: '2rem', padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No orders placed today.
                </div>
            )}

        </div>
    );
};

export default Dashboard;
