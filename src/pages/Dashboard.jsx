import { useContext, useState, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../api/axios';
import { ShoppingCart, Users, BadgeDollarSign, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="card glass" style={{
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'default',
        padding: '1.5rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--glass-border)',
    }}
    onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = `0 10px 30px -10px ${color}50`;
    }}
    onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.1)';
    }}
    >
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
                <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--text-light)', letterSpacing: '-0.02em' }}>{value}</h3>
            </div>
            <div style={{
                padding: '1rem',
                borderRadius: '1rem',
                background: `linear-gradient(135deg, ${color}30 0%, ${color}10 100%)`,
                color: color,
                boxShadow: `0 8px 16px -4px ${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Icon size={28} />
            </div>
        </div>
        
        <div style={{ 
            marginTop: '1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            fontSize: '0.85rem'
        }}>
            <div style={{ 
                padding: '0.25rem 0.5rem', 
                borderRadius: '2rem', 
                background: 'rgba(16, 185, 129, 0.1)', 
                color: 'var(--success)',
                fontWeight: 600
            }}>
                Today
            </div>
            <span style={{ color: 'var(--text-dim)' }}>vs average</span>
        </div>

        <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: `${color}08`,
            filter: 'blur(40px)',
            zIndex: 0
        }} />
    </div>
);

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({
        totalOrders: 0,
        todaysOrders: 0,
        totalRevenue: 0,
        todaysRevenue: 0,
        totalCustomers: 0,
        todaysCustomers: 0,
        recentOrders: []
    });
    const [matrixData, setMatrixData] = useState({ agents: [], products: [], data: {} });
    const [loading, setLoading] = useState(true);

    const getLocalISOInputString = (date) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const [dateRange, setDateRange] = useState({
        startDate: getLocalISOInputString(new Date(new Date().setHours(0, 1, 0, 0))),
        endDate: getLocalISOInputString(new Date(new Date().setHours(23, 59, 0, 0)))
    });

    const fetchMatrix = async (start, end) => {
        try {
            const { data } = await api.get(`/orders/matrix?startDate=${start}&endDate=${end}`);
            setMatrixData(data);
        } catch (err) {
            console.error("Failed to fetch dashboard matrix", err);
        }
    };

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

        fetchStats();
        fetchMatrix(dateRange.startDate, dateRange.endDate);
    }, []);

    const handleFilter = () => {
        fetchMatrix(dateRange.startDate, dateRange.endDate);
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: 'var(--text-dim)' }}>
            <div className="loader">Loading Dashboard...</div>
        </div>
    );

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: 'var(--text-light)' }}>
                    Market Overview
                </h1>
                <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem' }}>Welcome back, {user?.name || 'Admin'}. Here's what's happening today.</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '2rem',
                marginBottom: '3rem'
            }}>
                <StatCard title="Today's Orders" value={stats.todaysOrders || 0} icon={ShoppingCart} color="#65bd4a" />
                <StatCard title="Today's Revenue" value={`Rs. ${stats.todaysRevenue?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={BadgeDollarSign} color="#10b981" />
                <StatCard title="Today's Customers" value={stats.todaysCustomers || 0} icon={Users} color="#f59e0b" />
                <StatCard title="Performance" value="100%" icon={TrendingUp} color="#8b5cf6" />
            </div>

            <div className="card glass" style={{ 
                border: '1px solid var(--glass-border)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                background: 'var(--bg-card)'
            }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '2.5rem', 
                    flexWrap: 'wrap', 
                    gap: '1.5rem',
                    padding: '0.5rem'
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-light)' }}>Agent-wise Product Matrix</h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>Detailed breakdown of order volume by agent and product category.</p>
                    </div>
                    
                    <div style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        alignItems: 'center', 
                        flexWrap: 'wrap',
                        background: 'var(--bg-dark)',
                        padding: '1rem',
                        borderRadius: '1rem',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>START RANGE</label>
                            <input 
                                type="datetime-local" 
                                className="input-field" 
                                style={{ padding: '0.5rem', fontSize: '0.85rem', width: '200px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>END RANGE</label>
                            <input 
                                type="datetime-local" 
                                className="input-field" 
                                style={{ padding: '0.5rem', fontSize: '0.85rem', width: '200px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            />
                        </div>
                        <button 
                            className="btn-primary" 
                            style={{ 
                                padding: '0.75rem 1.5rem', 
                                marginTop: '1rem',
                                borderRadius: '0.75rem'
                            }}
                            onClick={handleFilter}
                        >
                            Filter Results
                        </button>
                    </div>
                </div>

                {matrixData.products.length > 0 ? (
                    <div style={{ 
                        overflowX: 'auto', 
                        borderRadius: '1rem', 
                        border: '1px solid var(--glass-border)',
                        background: 'var(--bg-dark)'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th style={{ 
                                        padding: '1.25rem 1.5rem', 
                                        color: 'var(--text-dim)', 
                                        background: 'var(--bg-dark)', 
                                        position: 'sticky', 
                                        left: 0, 
                                        zIndex: 2,
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        borderBottom: '1px solid var(--glass-border)'
                                    }}>Agent Name</th>
                                    {matrixData.products.map(p => (
                                        <th key={p} style={{ 
                                            padding: '1.25rem 1rem', 
                                            color: 'var(--text-light)', 
                                            fontSize: '0.85rem', 
                                            fontWeight: 600, 
                                            minWidth: '140px', 
                                            textAlign: 'center', 
                                            background: 'var(--bg-dark)',
                                            borderBottom: '1px solid var(--glass-border)'
                                        }}>
                                            {p}
                                        </th>
                                    ))}
                                    <th style={{ 
                                        padding: '1.25rem 1rem', 
                                        color: 'var(--text-light)', 
                                        fontWeight: 700, 
                                        textAlign: 'center', 
                                        background: 'var(--bg-dark)',
                                        borderBottom: '1px solid var(--glass-border)'
                                    }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matrixData.agents.map((agent, idx) => {
                                    let agentTotal = 0;
                                    return (
                                        <tr key={agent} style={{ 
                                            transition: 'background 0.2s',
                                            background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-dark)'
                                        }}
                                        >
                                            <td style={{ 
                                                padding: '1.25rem 1.5rem', 
                                                fontWeight: 600, 
                                                background: 'inherit', 
                                                position: 'sticky', 
                                                left: 0, 
                                                zIndex: 1,
                                                color: 'var(--text-light)',
                                                borderRight: '1px solid var(--glass-border)',
                                                borderBottom: '1px solid var(--glass-border)'
                                            }}>{agent}</td>
                                            {matrixData.products.map(product => {
                                                const count = matrixData.data[agent]?.[product] || 0;
                                                agentTotal += count;
                                                return (
                                                    <td key={product} style={{ 
                                                        padding: '1.25rem 1rem', 
                                                        textAlign: 'center', 
                                                        color: count > 0 ? 'var(--success)' : 'var(--text-dim)', 
                                                        fontWeight: count > 0 ? 700 : 400,
                                                        fontSize: count > 0 ? '1.1rem' : '0.9rem',
                                                        borderBottom: '1px solid var(--glass-border)'
                                                    }}>
                                                        {count > 0 ? count : '—'}
                                                    </td>
                                                );
                                            })}
                                            <td style={{ 
                                                padding: '1.25rem 1rem', 
                                                fontWeight: 800, 
                                                textAlign: 'center', 
                                                color: 'var(--text-light)',
                                                fontSize: '1.1rem',
                                                borderBottom: '1px solid var(--glass-border)'
                                            }}>{agentTotal}</td>
                                        </tr>
                                    );
                                })}
                                {/* Grand Total Row */}
                                <tr style={{ 
                                    background: 'var(--bg-dark)', 
                                    borderTop: '2px solid var(--primary)' 
                                }}>
                                    <td style={{ 
                                        padding: '1.5rem', 
                                        fontWeight: 800, 
                                        background: 'var(--bg-dark)', 
                                        position: 'sticky', 
                                        left: 0, 
                                        zIndex: 1,
                                        color: 'var(--primary)',
                                        textTransform: 'uppercase'
                                    }}>Grand Total</td>
                                    {matrixData.products.map(product => {
                                        let productTotal = 0;
                                        matrixData.agents.forEach(agent => {
                                            productTotal += (matrixData.data[agent]?.[product] || 0);
                                        });
                                        return (
                                            <td key={product} style={{ 
                                                padding: '1.5rem 1rem', 
                                                fontWeight: 800, 
                                                textAlign: 'center', 
                                                color: 'var(--primary)',
                                                fontSize: '1.2rem'
                                            }}>{productTotal}</td>
                                        );
                                    })}
                                    <td style={{ 
                                        padding: '1.5rem 1rem', 
                                        fontWeight: 900, 
                                        textAlign: 'center', 
                                        color: 'var(--primary)',
                                        fontSize: '1.3rem'
                                    }}>
                                        {matrixData.agents.reduce((acc, agent) => {
                                            return acc + (Object.values(matrixData.data[agent] || {}).reduce((a, b) => a + b, 0));
                                        }, 0)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ 
                        padding: '4rem 2rem', 
                        textAlign: 'center', 
                        color: 'var(--text-dim)',
                        background: 'var(--bg-dark)',
                        borderRadius: '1rem',
                        border: '1px dashed var(--glass-border)'
                    }}>
                        <Users size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                        <p style={{ fontSize: '1.1rem' }}>No order data matches your current filter criteria.</p>
                        <button 
                            className="btn" 
                            style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 600 }}
                            onClick={() => {
                                const today = new Date();
                                setDateRange({
                                    startDate: getLocalISOInputString(new Date(today.setHours(0, 1, 0, 0))),
                                    endDate: getLocalISOInputString(new Date(today.setHours(23, 59, 0, 0)))
                                });
                                fetchMatrix(
                                    getLocalISOInputString(new Date(today.setHours(0, 1, 0, 0))),
                                    getLocalISOInputString(new Date(today.setHours(23, 59, 0, 0)))
                                );
                            }}
                        >
                            Reset to Today
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
