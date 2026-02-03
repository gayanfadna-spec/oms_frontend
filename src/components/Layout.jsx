import { useContext, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import api from '../api/axios';
import {
    LayoutDashboard,
    PlusCircle,
    ShoppingCart,
    Users,
    Package,
    BarChart3,
    LogOut,
    Menu,
    UserPlus,
    AlertTriangle
} from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Check for pending edits
    const [pendingEditsCount, setPendingEditsCount] = useState(0);

    useEffect(() => {
        const checkPendingEdits = async () => {
            if (user) {
                try {
                    const { data } = await api.get('/orders/pending-edits-count');
                    setPendingEditsCount(data.count);
                } catch (error) {
                    console.error("Failed to check pending edits", error);
                }
            }
        };

        checkPendingEdits();
        const interval = setInterval(checkPendingEdits, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [user]);


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'New Order', path: '/order/new', icon: PlusCircle },
        { label: 'Orders', path: '/orders', icon: ShoppingCart },
        { label: 'Products', path: '/products', icon: Package },
        { label: 'Customers', path: '/customers', icon: Users },
    ];

    if (user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Agent') {
        navItems.push(
            { label: 'Reports', path: '/reports', icon: BarChart3 }
        );
    }

    if (user?.role === 'Admin' || user?.role === 'Super Admin') {
        navItems.push(
            { label: user.role === 'Super Admin' ? 'Users' : 'Agents', path: '/agents/new', icon: UserPlus }
        );
    }

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // ... (rest of the component)

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-dark)' }}>
            {/* Sidebar */}
            <aside style={{
                width: sidebarOpen ? '260px' : '0px',
                background: 'var(--bg-card)',
                borderRight: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.3s ease',
                overflow: 'hidden',
                flexShrink: 0
            }}>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/logo.png" alt="Fadna OMS" style={{ maxWidth: '140px', height: 'auto', marginBottom: '0.5rem' }} />
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.75rem', lineHeight: '1.4' }}>
                        <div>{formatDate(currentTime)}</div>
                        <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '0.9rem' }}>{formatTime(currentTime)}</div>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '1rem' }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.5rem',
                                color: isActive ? 'white' : (item.label === 'Orders' && pendingEditsCount > 0) ? '#ef4444' : 'var(--text-dim)',
                                background: isActive ? 'var(--primary)' : (item.label === 'Orders' && pendingEditsCount > 0) ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                marginBottom: '0.5rem',
                                transition: 'all 0.2s',
                                border: (item.label === 'Orders' && pendingEditsCount > 0 && !isActive) ? '1px solid #ef4444' : 'none'
                            })}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{user?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{user?.role}</div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            color: 'var(--danger)',
                            background: 'transparent',
                            padding: '0.5rem',
                            width: '100%'
                        }}
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {pendingEditsCount > 0 && (
                    <div style={{
                        background: '#ef4444',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontWeight: 'bold',
                        animation: 'pulse 2s infinite'
                    }}>
                        <AlertTriangle size={24} />
                        <span>URGENT: You have {pendingEditsCount} pending edit request{pendingEditsCount > 1 ? 's' : ''}. Please check Orders immediately.</span>
                    </div>
                )}
                <header style={{
                    height: '64px',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 1.5rem',
                    background: 'var(--bg-card)' // or transparent if we want glass effect on header
                }}>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', color: 'var(--text-dim)' }}>
                        <Menu size={24} />
                    </button>
                </header>
                <div style={{ flex: 1, overflow: 'auto', padding: '2rem' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
