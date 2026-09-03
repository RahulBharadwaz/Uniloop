import { Link } from 'react-router-dom';
import { Button, UniLoopLogo } from '../components/ui';
import { Package, Users, Shield, Clock, Search, MessageSquare, ShoppingBag, PlusCircle, AlertCircle, HelpCircle, Github } from 'lucide-react';
import useAuthStore from '../stores/authStore';

const features = [
    {
        icon: Package,
        title: 'Share Items',
        description: 'Rent, sell, or give away items you no longer need.'
    },
    {
        icon: Users,
        title: 'Campus Community',
        description: 'Connect with fellow students at your university.'
    },
    {
        icon: Shield,
        title: 'Trust System',
        description: 'Build your reputation through successful transactions.'
    },
    {
        icon: Clock,
        title: 'Smart Reminders',
        description: 'Never forget a return date with automatic reminders.'
    },
    {
        icon: Search,
        title: 'Lost & Found',
        description: 'Report or find lost items on campus.'
    },
    {
        icon: MessageSquare,
        title: 'Private Chat',
        description: 'Communicate securely with transaction partners.'
    },
];

const actionCards = [
    {
        icon: ShoppingBag,
        title: 'Browse Items',
        description: 'Discover items shared by your campus community.',
        to: '/items'
    },
    {
        icon: PlusCircle,
        title: 'List an Item',
        description: 'Share, rent, or sell something you own.',
        to: '/my-items/new'
    },
    {
        icon: Search,
        title: 'Lost & Found',
        description: 'Report or find lost items on campus.',
        to: '/lost-found'
    },
    {
        icon: AlertCircle,
        title: 'Wanted Items',
        description: 'Post or browse items people are looking for.',
        to: '/wanted'
    },
    {
        icon: HelpCircle,
        title: 'How to Use',
        description: 'Step-by-step guide to get the most out of UniLoop.',
        to: '/how-to-use'
    }
];

export default function Home() {
    const { isAuthenticated, user } = useAuthStore();

    return (
        <div className="space-y-16">
            {/* Hero Section */}
            <section className="text-center py-16">
                <div className="max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 px-4 py-1.5 rounded-full mb-6 shadow-sm">
                        <UniLoopLogo variant="icon" size="sm" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#090A35] font-['Montserrat',sans-serif]">
                            Loop More · Spend Less
                        </span>
                    </div>
                    <h1 className="text-5xl font-bold text-gray-900 mb-6">
                        {isAuthenticated && user?.college
                            ? <>Welcome to UniLoop at <span className="text-blue-600">{user.college}</span></>
                            : <>Share More, <span className="text-blue-600">Spend Less</span></>
                        }
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        The campus sharing platform where students rent, sell, and share items with each other.
                        {!isAuthenticated && ' Join your university community today.'}
                    </p>
                    {!isAuthenticated && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex justify-center gap-4">
                                <Link to="/register">
                                    <Button size="lg">Get Started</Button>
                                </Link>
                                <Link to="/items">
                                    <Button size="lg" variant="outline">Browse Items</Button>
                                </Link>
                            </div>
                            <Link to="/how-to-use" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-700 font-semibold px-6 py-3 rounded-full hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all shadow-sm hover:shadow-md">
                                <HelpCircle size={20} />
                                New here? Learn how UniLoop works →
                            </Link>
                        </div>
                    )}
                    {isAuthenticated && (
                        <div className="mt-6">
                            <Link to="/how-to-use" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-600 font-medium px-5 py-2.5 rounded-full hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all text-sm">
                                <HelpCircle size={16} />
                                How to use UniLoop →
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Quick Access Grid (Authenticated) */}
            {isAuthenticated && (
                <section>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {actionCards.map((card, index) => (
                            <Link key={index} to={card.to}>
                                <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md hover:border-blue-200 transition-all text-center h-full">
                                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                        <card.icon className="text-blue-600" size={28} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{card.title}</h3>
                                    <p className="text-sm text-gray-500">{card.description}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Features Section (non-authenticated) */}
            {!isAuthenticated && (
                <section>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Why UniLoop?
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div 
                                key={index}
                                className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"
                            >
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                    <feature.icon className="text-blue-600" size={24} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* CTA Section (non-authenticated) */}
            {!isAuthenticated && (
                <section className="bg-blue-600 rounded-2xl p-12 text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">
                        Ready to start sharing?
                    </h2>
                    <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                        Join hundreds of students who are already saving money and reducing waste
                        by sharing items on UniLoop.
                    </p>
                    <Link to="/register">
                        <Button size="lg" variant="secondary">
                            Sign Up with Campus Email
                        </Button>
                    </Link>
                </section>
            )}

            {/* Open Source / Contribute */}
            <section className="text-center py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Github className="text-white" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Want to Contribute?
                    </h2>
                    <p className="text-gray-600 mb-6">
                        UniLoop is open source. Help us build a better campus sharing experience.
                    </p>
                    <a
                        href="https://github.com/RahulBharadwaz/ShareNet-Web"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
                    >
                        <Github size={18} />
                        View on GitHub
                    </a>
                </div>
            </section>
        </div>
    );
}
