import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MockDB } from '../../services/mockDatabase';
import { Users, Edit, Camera, ArrowLeft } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { AuditService } from '../../services/AuditService';

const MemberFamily = ({ user: propUser, isCashierView = false }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user: authUser } = useAuth();

    // Fix: Load user from params if in cashier view
    const [user, setUser] = useState(propUser || (!isCashierView ? authUser : null));

    useEffect(() => {
        if (isCashierView && id && !propUser) {
            const foundUser = MockDB.getFamilies().find(f => f.id === id);
            setUser(foundUser);
        } else if (!isCashierView && !propUser) {
            setUser(authUser);
        }
    }, [isCashierView, id, authUser, propUser]);

    const handleBack = () => {
        if (isCashierView) {
            navigate(`/cashier/member/${user?.id || id}`);
        } else {
            navigate('/member');
        }
    };

    const [familyData, setFamilyData] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (!user) return;
        const family = MockDB.getFamilies().find(f => f.id === user.id);
        setFamilyData(family);
    }, [user]);

    const handleEdit = (member, index) => {
        setEditingMember({ ...member, index });
        setFormData({ mobile: member.mobile || '', photo: member.photo || null });
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFormData(p => ({ ...p, photo: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        const updatedMembers = [...familyData.members];
        updatedMembers[editingMember.index] = { ...editingMember, ...formData };
        delete updatedMembers[editingMember.index].index;

        const updatedFamily = { ...familyData, members: updatedMembers };
        MockDB.updateFamily(updatedFamily);
        AuditService.log('Member', 'Update Self Details', { memberName: editingMember.name });

        setFamilyData(updatedFamily);
        setEditingMember(null);
        alert('Details Updated');
    };

    if (!familyData) return <div>Loading...</div>;

    return (
        <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                    onClick={handleBack}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center' }}
                >
                    <ArrowLeft size={24} color="#374151" />
                </button>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1f2937' }}>My Family</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {familyData.members.map((member, idx) => (
                    <div key={idx} style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-soft)' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {member.photo ? (
                                <img src={member.photo} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Users size={24} color="#6366f1" />
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold' }}>{member.name}</div>
                            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                {member.age} Y • {member.gender}
                                {member.mobile && <div>📱 {member.mobile}</div>}
                            </div>
                        </div>
                        <button
                            onClick={() => handleEdit(member, idx)}
                            style={{ padding: '8px', borderRadius: '8px', background: '#f3f4f6', border: 'none', cursor: 'pointer', color: '#4b5563' }}
                        >
                            <Edit size={18} />
                        </button>
                    </div>
                ))}

                <Modal isOpen={!!editingMember} onClose={() => setEditingMember(null)} title="Edit Details">
                    {editingMember && (
                        <form onSubmit={handleSave}>
                            <div style={{ textAlign: 'center', marginBottom: '16px', color: '#6b7280', fontSize: '0.9rem' }}>
                                You can only update Mobile Number and Photo. Contact Admin for other changes.
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                                <label style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', border: '2px dashed #9ca3af' }}>
                                    {formData.photo ? (
                                        <img src={formData.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}><Camera /></div>
                                    )}
                                    <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
                                    <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.5)', color: 'white', textAlign: 'center', fontSize: '0.7rem' }}>Update</div>
                                </label>
                            </div>
                            {editingMember.age >= 18 && (
                                <Input
                                    label="Mobile Number"
                                    value={formData.mobile}
                                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                    placeholder="9876543210"
                                />
                            )}
                            <Button type="submit" fullWidth>Save Changes</Button>
                        </form>
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default MemberFamily;
