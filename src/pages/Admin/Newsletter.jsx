import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Mail, Clock, Trash2, Loader2, User, Newspaper } from 'lucide-react';
import './Customers.css'; // Reuse table styles

const Newsletter = () => {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        loadSubscribers();
    }, []);

    const loadSubscribers = async () => {
        try {
            const res = await adminAPI.getSubscribers();
            if (res.success) setSubscribers(res.data);
        } catch (error) {
            console.error('Failed to load subscribers', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this subscriber?")) return;
        setDeleting(id);
        try {
            await adminAPI.deleteSubscriber(id);
            setSubscribers(subscribers.filter(s => s._id !== id));
        } catch (error) {
            console.error('Failed to delete', error);
        } finally {
            setDeleting(null);
        }
    };

    if (loading) return <div className="admin-loading"><Loader2 className="animate-spin" size={40} /></div>;

    return (
        <div className="admin-page-container animate-fade">
            <div className="page-header">
                <div className="header-text">
                    <h1>Newsletter Subscribers</h1>
                    <p>Manage your mailing list and track subscription growth.</p>
                </div>
            </div>

            <div className="admin-card table-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Subscriber</th>
                            <th>Subscribed On</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subscribers.map(sub => (
                            <tr key={sub._id}>
                                <td>
                                    <div className="customer-info">
                                        <div className="customer-avatar"><User size={16} /></div>
                                        <div>
                                            <p className="customer-email">{sub.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="date-cell">
                                        <Clock size={14} />
                                        <span>{new Date(sub.subscribedAt || sub.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className="status-pill status-active">Active</span>
                                </td>
                                <td>
                                    <div className="action-btns">
                                        <button 
                                            className="btn-icon delete" 
                                            onClick={() => handleDelete(sub._id)}
                                            disabled={deleting === sub._id}
                                        >
                                            {deleting === sub._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {subscribers.length === 0 && (
                    <div className="empty-state">
                        <Newspaper size={40} />
                        <p>No subscribers found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Newsletter;
