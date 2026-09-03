import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, User, LogOut, Package, Search, MessageSquare, MapPin, Inbox, ClipboardList, Heart } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import useNotificationStore from '../../stores/notificationStore';
import { Avatar, Badge, UniLoopLogo } from '../ui';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const { user, isAuthenticated, logout } = useAuthStore();
    const { unreadCount } = useNotificationStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navLinks = [
        { to: '/items', label: 'Browse', icon: Search, title: 'Browse items shared by students' },
        { to: '/my-items', label: 'My Items', icon: Package, title: "Items you've listed" },
        { to: '/requests', label: 'Inbox', icon: Inbox, title: "Requests and offers you've sent or received" },
        { to: '/transactions', label: 'Deals', icon: MessageSquare, title: 'Your accepted deals and pickups' },
        { to: '/lost-found', label: 'Lost & Found', icon: MapPin, title: 'Report or find lost items on campus' },
        { to: '/wanted', label: 'Wanted', icon: Heart, title: 'Items students are looking for' },
    ];

    return (
        <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2.5 group py-1">
                            <UniLoopLogo variant="horizontal" size="sm" />
                            {isAuthenticated && user?.college && (
                                <span className="hidden sm:inline-block text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium border border-slate-200">
                                    {user.college}
                                </span>
                            )}
                        </Link>

                        {isAuthenticated && (
                            <div className="hidden md:flex ml-10 space-x-1">
                                {navLinks.map(link => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        title={link.title}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                    >
                                        <link.icon size={18} />
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                <Link to="/notifications" className="relative p-2 text-gray-600 hover:text-gray-900">
                                    <Bell size={22} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Link>

                                <div className="relative">
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100"
                                    >
                                        <Avatar src={user?.avatar} name={user?.fullName} size="sm" />
                                        <span className="hidden sm:block text-sm font-medium">{user?.fullName?.split(' ')[0]}</span>
                                    </button>

                                    {showDropdown && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                                            <Link
                                                to="/profile"
                                                onClick={() => setShowDropdown(false)}
                                                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                                            >
                                                <User size={18} />
                                                Profile
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-gray-100"
                                            >
                                                <LogOut size={18} />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link to="/login" className="px-4 py-2 text-gray-600 hover:text-gray-900">
                                    Login
                                </Link>
                                <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    Sign Up
                                </Link>
                            </div>
                        )}

                        <button
                            className="md:hidden p-2"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {isOpen && isAuthenticated && (
                    <div className="md:hidden py-4 border-t">
                        {navLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                title={link.title}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                            >
                                <link.icon size={18} />
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    );
}
