import React, { useState } from 'react';
import { MockDB } from '../../services/mockDatabase';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { Bell, Trash2, Send } from 'lucide-react';
import { AuditService } from '../../services/AuditService';

const AdminAnnouncements = () => {
    const [announcements, setAnnouncements] = useState(MockDB.getAnnouncements());
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', priority: 'Normal', audience: 'All' });

    const handleSendAnnouncement = (e) => {
        e.preventDefault();
        if (!newAnnouncement.title || !newAnnouncement.message) return;
        MockDB.addAnnouncement({
            ...newAnnouncement,
            date: new Date().toISOString(),
            sender: 'Admin'
        });
        AuditService.log('Admin', 'Post Announcement', { title: newAnnouncement.title, audience: newAnnouncement.audience });
        setAnnouncements(MockDB.getAnnouncements());
        setIsAnnouncementModalOpen(false);
        setNewAnnouncement({ title: '', message: '', priority: 'Normal', audience: 'All' });
        alert("Announcement Sent!");
    };

    const handleDeleteAnnouncement = (id) => {
        if (confirm("Delete this announcement?")) {
            MockDB.deleteAnnouncement(id);
            setAnnouncements(MockDB.getAnnouncements());
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3>Announcements</h3>
                <Button onClick={() => setIsAnnouncementModalOpen(true)} icon={Bell}>Post New</Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {announcements.slice().reverse().map(ann => (
                    <div key={ann.id} style={{ background: 'white', padding: '16px', borderRadius: '16px', borderLeft: `4px solid ${ann.priority === 'High' ? '#ef4444' : '#6366f1'}`, boxShadow: 'var(--shadow-soft)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{ann.title}</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <span style={{ fontSize: '0.8rem', background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px' }}>
                                    {ann.audience || 'All'}
                                </span>
                                <span style={{ fontSize: '0.8rem', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>
                                    {new Date(ann.date).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <div style={{ marginTop: '8px', color: '#4b5563' }}>{ann.message}</div>
                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleDeleteAnnouncement(ann.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
                {announcements.length === 0 && <div style={{ textAlign: 'center', color: '#888' }}>No announcements yet.</div>}
            </div>

            <Modal isOpen={isAnnouncementModalOpen} onClose={() => setIsAnnouncementModalOpen(false)} title="New Announcement">
                <form onSubmit={handleSendAnnouncement}>
                    <Input label="Title" value={newAnnouncement.title} onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} placeholder="Meeting Alert" />
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px' }}>Message</label>
                        <textarea
                            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', minHeight: '100px' }}
                            value={newAnnouncement.message}
                            onChange={e => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                            placeholder="Type your message..."
                        />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px' }}>Priority</label>
                        <select
                            value={newAnnouncement.priority}
                            onChange={e => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px' }}
                        >
                            <option value="Normal">Normal</option>
                            <option value="High">High (Urgent)</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px' }}>Target Audience</label>
                        <select
                            value={newAnnouncement.audience}
                            onChange={e => setNewAnnouncement({ ...newAnnouncement, audience: e.target.value })}
                            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px' }}
                        >
                            <option value="All">All Users</option>
                            <option value="Member">Members Only</option>
                            <option value="Cashier">Cashiers Only</option>
                        </select>
                    </div>
                    <Button type="submit" fullWidth icon={Send}>Post Announcement</Button>
                </form>
            </Modal>
        </div>
    );
};

export default AdminAnnouncements;
