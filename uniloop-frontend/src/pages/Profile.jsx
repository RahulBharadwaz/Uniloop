import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, Button, Input, Avatar, TrustScore, Loader } from '../components/ui';
import { Upload, Camera } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import api from '../lib/axios';

export default function Profile() {
    const { user, updateUser } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await api.patch('/users/update-account', formData);
            updateUser(response.data.data);
            toast.success('Profile updated successfully');
            setIsEditing(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const data = new FormData();
        data.append('avatar', file);

        try {
            const response = await api.patch('/users/avatar', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updateUser(response.data.data);
            toast.success('Avatar updated');
        } catch (error) {
            toast.error('Failed to update avatar');
        }
    };

    if (!user) return <Loader />;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

            <Card>
                <Card.Body className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Avatar src={user.avatar} name={user.fullName} size="xl" />
                            <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600">
                                <Camera size={16} className="text-white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">{user.fullName}</h2>
                            <p className="text-gray-500">@{user.username}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                        </div>
                        <div className="ml-auto">
                            <TrustScore score={user.trustScore ?? 50} size="lg" />
                        </div>
                    </div>

                    {/* Profile Form */}
                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Full Name"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled
                            />
                            <div className="flex gap-4">
                                <Button type="submit" loading={isLoading}>
                                    Save Changes
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="secondary"
                                    onClick={() => setIsEditing(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-500">Full Name</label>
                                <p className="font-medium">{user.fullName}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Email</label>
                                <p className="font-medium">{user.email}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Username</label>
                                <p className="font-medium">@{user.username}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Trust Score</label>
                                <p className="font-medium">{user.trustScore ?? 50} / 100</p>
                            </div>
                            <Button onClick={() => setIsEditing(true)}>
                                Edit Profile
                            </Button>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}
