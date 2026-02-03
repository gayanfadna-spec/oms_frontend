import { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Save, User, Mail, Phone, MapPin, Lock, BadgeCheck, Edit, Trash2 } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const CreateAgent = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [agents, setAgents] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    const initialForm = {
        name: '',        // Full Name
        username: '',    // User Name
        email: '',
        password: '',
        phone: '',       // Contact Numbers
        address: '',
        role: 'Agent'    // Default role
    };

    const [form, setForm] = useState(initialForm);

    const fetchAgents = async () => {
        try {
            const { data } = await api.get('/auth/agents');
            setAgents(data);
        } catch (err) {
            console.error("Failed to fetch agents", err);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleEdit = (agent) => {
        setEditMode(true);
        setEditId(agent._id);
        setForm({
            name: agent.name,
            username: agent.username || '',
            email: agent.email,
            password: '', // Don't populate password
            phone: agent.phone || '',
            address: agent.address || '',
            role: agent.role || 'Agent'
        });
        setError('');
        setSuccess('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this agent?')) return;

        try {
            await api.delete(`/auth/${id}`);
            setSuccess('Agent deleted successfully');
            fetchAgents();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete agent');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (editMode) {
                await api.put(`/auth/${editId}`, form);
                setSuccess('Agent updated successfully!');
                setEditMode(false);
                setEditId(null);
            } else {
                await api.post('/auth/register', {
                    ...form,
                    // Role is now from form, default handled in state
                });
                setSuccess('User created successfully!');
            }
            setForm(initialForm); // Clear form
            fetchAgents(); // Refresh list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save agent');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '1200px' }}>
            <h1 style={{ marginBottom: '2rem' }}>{user?.role === 'Super Admin' ? 'Manage Users' : 'Manage Agents'}</h1>

            <div style={{ display: 'grid', gridTemplateColumns: user?.role === 'Super Admin' ? 'minmax(350px, 1fr) 2fr' : '1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Create/Edit Form */}
                {user?.role === 'Super Admin' && (
                    <div className="card glass">
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
                            {editMode ? 'Edit Agent' : 'Create New Agent'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {user?.role === 'Super Admin' && (
                                    <div className="input-group">
                                        <label className="input-label">Role</label>
                                        <div style={{ position: 'relative' }}>
                                            <BadgeCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                            <select
                                                name="role"
                                                className="input-field"
                                                style={{ paddingLeft: '2.5rem' }}
                                                value={form.role}
                                                onChange={handleChange}
                                            >
                                                <option value="Agent">Agent</option>
                                                <option value="Admin">Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                                <div className="input-group">
                                    <label className="input-label">Full Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                        <input
                                            name="name"
                                            type="text"
                                            className="input-field"
                                            style={{ paddingLeft: '2.5rem' }}
                                            placeholder="Full Name"
                                            value={form.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">User Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <BadgeCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                        <input
                                            name="username"
                                            type="text"
                                            className="input-field"
                                            style={{ paddingLeft: '2.5rem' }}
                                            placeholder="User Name"
                                            value={form.username}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Email</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                        <input
                                            name="email"
                                            type="email"
                                            className="input-field"
                                            style={{ paddingLeft: '2.5rem' }}
                                            placeholder="Email Address"
                                            value={form.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Password {editMode && '(Leave blank to keep current)'}</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                        <input
                                            name="password"
                                            type="password"
                                            className="input-field"
                                            style={{ paddingLeft: '2.5rem' }}
                                            placeholder="Password"
                                            value={form.password}
                                            onChange={handleChange}
                                            required={!editMode}
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Phone</label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                        <input
                                            name="phone"
                                            type="text"
                                            className="input-field"
                                            style={{ paddingLeft: '2.5rem' }}
                                            placeholder="Phone Number"
                                            value={form.phone}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <MapPin size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-dim)' }} />
                                        <textarea
                                            name="address"
                                            className="input-field"
                                            style={{ paddingLeft: '2.5rem', minHeight: '80px', resize: 'vertical' }}
                                            placeholder="Address"
                                            value={form.address}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, marginTop: '1rem' }}>
                                        <Save size={20} style={{ marginRight: '0.5rem' }} /> {editMode ? 'Update Agent' : 'Create Agent'}
                                    </button>
                                    {editMode && (
                                        <button
                                            type="button"
                                            className="btn"
                                            style={{ marginTop: '1rem', background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}
                                            onClick={() => { setEditMode(false); setForm(initialForm); setError(''); setSuccess(''); }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>

                                {error && <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</div>}
                                {success && <div style={{ color: 'var(--success)', fontSize: '0.9rem' }}>{success}</div>}
                            </div>
                        </form>
                    </div>
                )}

                {/* Agents List */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="card glass" style={{ height: '100%', padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Existing Agents</h2>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500 }}>Name / User</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500 }}>Role</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500 }}>Contact</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500 }}>Address</th>
                                        {user?.role === 'Super Admin' && (
                                            <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500 }}>Actions</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {agents.length === 0 ? (
                                        <tr>
                                            <td colSpan={user?.role === 'Super Admin' ? 4 : 3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                                                No agents found.
                                            </td>
                                        </tr>
                                    ) : (
                                        agents.map(agent => (
                                            <tr key={agent._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 'bold' }}>{agent.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>@{agent.username || 'N/A'}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '0.25rem',
                                                        fontSize: '0.75rem',
                                                        background: agent.role === 'Admin' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                                        color: agent.role === 'Admin' ? 'white' : 'inherit'
                                                    }}>
                                                        {agent.role}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div>{agent.email}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{agent.phone || 'N/A'}</div>
                                                </td>
                                                <td style={{ padding: '1rem', maxWidth: '200px' }}>
                                                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={agent.address}>
                                                        {agent.address || 'N/A'}
                                                    </div>
                                                </td>
                                                {user?.role === 'Super Admin' && (
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                onClick={() => handleEdit(agent)}
                                                                style={{ padding: '0.5rem', background: 'var(--primary)', border: 'none', borderRadius: '0.25rem', color: 'white', cursor: 'pointer' }}
                                                                title="Edit"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(agent._id)}
                                                                style={{ padding: '0.5rem', background: 'var(--danger)', border: 'none', borderRadius: '0.25rem', color: 'white', cursor: 'pointer' }}
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={14} />
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
            </div>
        </div>
    );
};

export default CreateAgent;
