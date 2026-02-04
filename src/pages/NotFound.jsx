import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-dark)',
            color: 'var(--text-light)',
            textAlign: 'center',
            padding: '1rem'
        }}>
            <div className="card glass" style={{ maxWidth: '500px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <AlertTriangle size={40} color="var(--danger)" />
                </div>

                <h1 style={{ fontSize: '4rem', fontWeight: '800', margin: 0, lineHeight: 1, color: 'var(--text-light)' }}>404</h1>
                <h2 style={{ fontSize: '1.5rem', marginTop: '0.5rem', marginBottom: '1rem', color: 'var(--text-dim)' }}>Page Not Found</h2>

                <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', lineHeight: '1.6' }}>
                    The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
                </p>

                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Home size={20} />
                    <span>Back to Dashboard</span>
                </button>
            </div>
        </div>
    );
};

export default NotFound;
