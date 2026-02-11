import { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import { Search, MapPin, Phone, Mail, User, Download, Trash2 } from 'lucide-react';

const Customers = () => {
    const { user } = useContext(AuthContext);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/customers');
            setCustomers(data);
        } catch (err) {
            console.error("Failed to fetch customers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleDelete = async (id) => {
        if (user?.role !== 'Super Admin') {
            alert('Only Super Admin can delete customers.');
            return;
        }

        const password = window.prompt('Enter your password to authorize deletion:');
        if (!password) return;

        if (window.confirm('Are you ABSOLUTELY sure you want to delete this customer?')) {
            try {
                await api.delete(`/customers/${id}`, { data: { password } });
                setCustomers(current => current.filter(c => c._id !== id));
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete customer. Check your password.');
                console.error(err);
                fetchCustomers();
            }
        }
    };

    const handleBulkDelete = async () => {
        if (user?.role !== 'Super Admin') {
            alert('Only Super Admin can delete all customers.');
            return;
        }

        const password = window.prompt('WARNING: This will delete ALL customers in the system. Enter your password to authorize:');
        if (!password) return;

        if (window.confirm('Are you ABSOLUTELY sure? This action is IRREVERSIBLE.')) {
            if (window.confirm('Final confirmation: Delete all customers?')) {
                try {
                    setLoading(true);
                    const { data } = await api.delete('/customers/bulk-delete', { data: { password } });
                    alert(data.message);
                    fetchCustomers();
                } catch (err) {
                    alert(err.response?.data?.message || 'Bulk deletion failed. Check your password.');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        (customer.phone2 && customer.phone2.includes(searchTerm))
    );

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Customers</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Search customers..."
                                style={{ paddingLeft: '2.5rem', width: '250px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {user?.role === 'Super Admin' && (
                        <button
                            onClick={() => {
                                const headers = ['Name', 'Contact 1', 'Contact 2', 'Address', 'City', 'Country', 'Email', 'Joined'];
                                const csvRows = [headers.join(',')];
                                customers.forEach(c => {
                                    const row = [
                                        `"${c.name}"`,
                                        `"${c.phone}"`,
                                        `"${c.phone2 || ''}"`,
                                        `"${c.address}"`,
                                        `"${c.city || ''}"`,
                                        `"${c.country || ''}"`,
                                        `"${c.email || ''}"`,
                                        new Date(c.createdAt).toLocaleDateString()
                                    ];
                                    csvRows.push(row.join(','));
                                });
                                const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'customers.csv';
                                a.click();
                            }}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}
                        >
                            <Download size={18} /> Export CSV
                        </button>
                    )}
                    {user?.role === 'Super Admin' && (
                        <button
                            onClick={handleBulkDelete}
                            className="btn"
                            style={{ background: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Trash2 size={18} /> Delete All Customers
                        </button>
                    )}
                </div>
            </div>

            <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Name</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Contact 1</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Contact 2</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Address</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>City</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Country</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Details</th>
                                <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Joined</th>
                                {user?.role === 'Super Admin' && <th style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.875rem' }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(customer => (
                                <tr key={customer._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '32px', height: '32px',
                                                borderRadius: '50%',
                                                background: 'var(--primary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.875rem', fontWeight: 'bold', color: '#fff'
                                            }}>
                                                {customer.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: '500' }}>{customer.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                        {customer.phone}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                                        {customer.phone2 || '-'}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                        {customer.address}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                        {customer.city || '-'}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                        {customer.country || '-'}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                        {customer.email && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Mail size={14} /> {customer.email}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                                        {new Date(customer.createdAt).toLocaleDateString()}
                                    </td>
                                    {user?.role === 'Super Admin' && (
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => handleDelete(customer._id)}
                                                className="btn"
                                                style={{ padding: '0.25rem', background: 'transparent', color: 'var(--danger)' }}
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Customers;
