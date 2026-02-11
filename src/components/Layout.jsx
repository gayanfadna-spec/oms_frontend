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
    AlertTriangle,
    XCircle
} from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) setSidebarOpen(false);
            else setSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-dark)', position: 'relative' }}>
            {/* Mobile Overlay */}
            {!sidebarOpen && window.innerWidth <= 768 && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 40,
                        backdropFilter: 'blur(2px)'
                    }}
                />
            )}

            {/* Sidebar */}
            <aside style={{
                position: isMobile ? 'fixed' : 'relative',
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 50,
                height: '100%',
                width: sidebarOpen ? '260px' : '0px',
                background: 'var(--bg-card)',
                borderRight: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.3s ease, transform 0.3s ease',
                padding: sidebarOpen ? '0' : '0',
                overflow: 'hidden',
                flexShrink: 0,
                transform: (isMobile && !sidebarOpen) ? 'translateX(-100%)' : 'translateX(0)'
            }}>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {isMobile && (
                        <button
                            onClick={() => setSidebarOpen(false)}
                            style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'transparent', color: 'var(--text-dim)' }}
                        >
                            <XCircle size={24} />
                        </button>
                    )}
                    <img src="/logo.png" alt="Fadna OMS" style={{ maxWidth: '140px', height: 'auto', marginBottom: '0.5rem' }} />
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.75rem', lineHeight: '1.4' }}>
                        <div>{formatDate(currentTime)}</div>
                        <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '0.9rem' }}>{formatTime(currentTime)}</div>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => isMobile && setSidebarOpen(false)}
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
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
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
                        animation: 'pulse 2s infinite',
                        fontSize: isMobile ? '0.8rem' : '1rem'
                    }}>
                        <AlertTriangle size={isMobile ? 18 : 24} />
                        <span>{isMobile ? `${pendingEditsCount} Pending Edits` : `URGENT: You have ${pendingEditsCount} pending edit request${pendingEditsCount > 1 ? 's' : ''}. Please check Orders immediately.`}</span>
                    </div>
                )}
                <header style={{
                    height: '64px',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 1.5rem',
                    background: 'var(--bg-card)',
                    zIndex: 30
                }}>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', color: 'var(--text-dim)', padding: '0.5rem' }}>
                        <Menu size={24} />
                    </button>
                    {isMobile && (
                        <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Fadna OMS</div>
                    )}
                    <div className="hidden-mobile" style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                        {user?.name} ({user?.role})
                    </div>
                </header>
                <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '1rem' : '2rem' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};


export default Layout;
//hhhhgtg