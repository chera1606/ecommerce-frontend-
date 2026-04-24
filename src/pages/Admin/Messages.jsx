import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Mail, Clock, CheckCircle, Trash2, Loader2, User } from 'lucide-react';
import './Customers.css'; // Reuse table styles

const Messages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        try {
            const res = await adminAPI.getAdminMessages();
            if (res.success) setMessages(res.data);
        } catch (error) {
            console.error('Failed to load messages', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        setUpdating(id);
        try {
            await adminAPI.updateMessageStatus(id, status);
            loadMessages();
        } catch (error) {
            console.error('Failed to update status', error);
        } finally {
            setUpdating(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        setDeleting(id);
        try {
            await adminAPI.deleteMessage(id);
            setMessages(messages.filter(m => m._id !== id));
        } catch (error) {
            console.error('Failed to delete message', error);
        } finally {
            setDeleting(null);
        }
    };

    if (loading) return <div className="admin-loading"><Loader2 className="animate-spin" size={40} /></div>;

    return (
        <div className="admin-page-container animate-fade">
            <div className="page-header">
                <div className="header-text">
                    <h1>Customer Messages</h1>
                    <p>Manage and respond to inquiries from the contact form.</p>
                </div>
            </div>

            <div className="admin-card table-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Message</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {messages.map(msg => (
                            <tr key={msg._id}>
                                <td>
                                    <div className="customer-info">
                                        <div className="customer-avatar"><User size={16} /></div>
                                        <div>
                                            <p className="customer-name">{msg.name}</p>
                                            <p className="customer-email">{msg.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <p className="msg-preview" title={msg.message}>{msg.message}</p>
                                </td>
                                <td>
                                    <span className={`status-pill status-${msg.status.toLowerCase()}`}>
                                        {msg.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="date-cell">
                                        <Clock size={14} />
                                        <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="action-btns">
                                        {msg.status === 'NEW' && (
                                            <button 
                                                className="btn-icon" 
                                                onClick={() => handleUpdateStatus(msg._id, 'READ')}
                                                disabled={updating === msg._id}
                                            >
                                                {updating === msg._id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                            </button>
                                        )}
                                        <button 
                                            className="btn-icon delete" 
                                            onClick={() => handleDelete(msg._id)}
                                            disabled={deleting === msg._id}
                                        >
                                            {deleting === msg._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {messages.length === 0 && (
                    <div className="empty-state">
                        <Mail size={40} />
                        <p>No messages found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
