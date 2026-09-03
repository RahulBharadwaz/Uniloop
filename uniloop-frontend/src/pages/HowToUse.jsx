import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button } from '../components/ui';
import {
    ArrowLeft, Mail, ShieldCheck, UserCheck, Search, ShoppingBag, PlusCircle,
    Tag, Gift, DollarSign, Package, Inbox, Check, X, MessageSquare,
    MapPin, Clock, Calendar, AlertCircle, Eye, Send, Star, HelpCircle,
    Camera, FileText, CheckCircle, ChevronDown, ChevronUp, Heart,
    Shield, TrendingUp, Users, Zap, ArrowRight
} from 'lucide-react';

const sections = [
    { id: 'getting-started', label: 'Getting Started', icon: UserCheck },
    { id: 'browse-share', label: 'Browse & Share', icon: ShoppingBag },
    { id: 'requests-deals', label: 'Requests & Deals', icon: Inbox },
    { id: 'lost-found', label: 'Lost & Found', icon: Search },
    { id: 'wanted-items', label: 'Wanted Items', icon: Heart },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'trust-score', label: 'Trust Score', icon: Shield },
    { id: 'tips', label: 'Tips', icon: Star },
    { id: 'quick-start', label: 'Quick Start', icon: Zap },
];

function SectionHeader({ icon: Icon, title, description }) {
    return (
        <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Icon size={20} className="text-gray-900" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">{title}</h2>
            </div>
            {description && <p className="text-gray-500 ml-13 text-sm">{description}</p>}
        </div>
    );
}

function Step({ number, icon: Icon, title, description, isLast = false }) {
    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-900 flex items-center justify-center font-medium text-xs flex-shrink-0">
                    {number}
                </div>
                {!isLast && <div className="w-px h-full bg-gray-200 mt-2" />}
            </div>
            <div className="pb-8">
                <div className="flex items-center gap-2 mb-1">
                    {Icon && <Icon size={14} className="text-gray-400" />}
                    <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function Accordion({ icon: Icon, title, children }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                    <Icon size={18} className="text-gray-500" />
                    <span className="font-medium text-gray-900 text-sm">{title}</span>
                </div>
                {open ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            {open && <div className="p-4 bg-gray-50/50 border-t border-gray-100">{children}</div>}
        </div>
    );
}

function PipelineStep({ icon: Icon, label, isLast = false }) {
    return (
        <div className="flex items-center">
            <div className="flex flex-col items-center gap-1.5 px-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-900 text-white">
                    <Icon size={16} />
                </div>
                <span className="text-xs text-gray-600 whitespace-nowrap">{label}</span>
            </div>
            {!isLast && <ArrowRight size={14} className="text-gray-300 mx-1 flex-shrink-0" />}
        </div>
    );
}

export default function HowToUse() {
    return (
        <div className="max-w-4xl mx-auto pb-20 px-4">
            {/* Hero */}
            <div className="bg-gradient-to-br from-[#1d1d1f] to-[#2d2d30] rounded-2xl p-8 md:p-14 mb-10 text-white text-center relative overflow-hidden">
                <div className="relative">
                    <Link to="/" className="inline-flex items-center gap-1 text-white/50 hover:text-white/80 text-sm mb-8 transition-colors">
                        <ArrowLeft size={14} /> Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight">How to Use UniLoop</h1>
                    <p className="text-base text-white/60 max-w-xl mx-auto leading-relaxed">
                        Your complete guide to sharing, finding, and connecting on campus.
                    </p>
                </div>
            </div>

            {/* Table of Contents */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-14 scrollbar-hide">
                {sections.map(s => (
                    <a
                        key={s.id}
                        href={`#${s.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors whitespace-nowrap flex-shrink-0"
                    >
                        <s.icon size={13} />
                        {s.label}
                    </a>
                ))}
            </div>

            {/* ===== GETTING STARTED ===== */}
            <section id="getting-started" className="scroll-mt-20 mb-20">
                <SectionHeader icon={UserCheck} title="Getting Started" description="Create your account in 3 simple steps" />
                <div className="grid md:grid-cols-3 gap-5 mb-6">
                    {[
                        { icon: Mail, step: '1', title: 'Enter College Email', desc: 'Use your college email (e.g., you@iiitl.ac.in). We support 100+ Indian colleges — IITs, NITs, IIITs, BITS, VIT, SRM, and more.' },
                        { icon: ShieldCheck, step: '2', title: 'Verify with OTP', desc: 'We send a 6-digit code to your email. Enter it to prove ownership. The code expires in 10 minutes.' },
                        { icon: UserCheck, step: '3', title: 'Complete Profile', desc: 'Add your name, username, password, and optional profile photo. You\'re ready to go!' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 relative overflow-hidden">
                            <div className="absolute top-3 right-4">
                                <span className="text-gray-200 font-semibold text-3xl">{s.step}</span>
                            </div>
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                                <s.icon size={20} className="text-gray-700" />
                            </div>
                            <h3 className="font-medium text-gray-900 mb-2 text-sm">{s.title}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 leading-relaxed">
                        <strong>College scoping:</strong> Your email domain (e.g., @iiitl.ac.in) determines your college.
                        You'll only see items, lost &amp; found posts, and wanted requests from students at your same college.
                    </p>
                </div>
            </section>

            {/* ===== BROWSE & SHARE ===== */}
            <section id="browse-share" className="scroll-mt-20 mb-20">
                <SectionHeader icon={ShoppingBag} title="Browse & Share Items" description="Find what you need or share what you have" />

                <h3 className="font-medium text-gray-900 mb-4 text-sm tracking-tight">Three ways to share</h3>
                <div className="grid md:grid-cols-3 gap-4 mb-10">
                    {[
                        { label: 'For Rent', desc: 'Lend items for a period. Set a daily price, min/max days, and deposit.', icon: Clock },
                        { label: 'For Sale', desc: 'Sell items you no longer need. Set a price, negotiate with buyers.', icon: DollarSign },
                        { label: 'Free', desc: 'Give away items for free. Others can instantly claim them.', icon: Gift },
                    ].map((m, i) => (
                        <div key={i} className="bg-[#1d1d1f] rounded-xl p-5 text-white">
                            <m.icon size={20} className="mb-3 text-white/70" />
                            <h4 className="font-medium text-sm mb-1">{m.label}</h4>
                            <p className="text-xs text-white/60 leading-relaxed">{m.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2 text-sm">
                            <Search size={16} className="text-gray-400" /> Finding Items
                        </h3>
                        <Step number={1} icon={Search} title="Go to Browse" description="Click 'Browse' in the navbar to see all items from your college." />
                        <Step number={2} icon={Tag} title="Filter & Search" description="Filter by category (Electronics, Books, etc.), mode (Rent/Sale/Free), and price range." />
                        <Step number={3} icon={Eye} title="View Details" description="Click any item to see photos, description, owner info, and trust score." />
                        <Step number={4} icon={Send} title="Request or Claim" description="Click 'Request Item' for rent/sell items, or 'Claim Now' for free items." />
                        <Step number={5} icon={MessageSquare} title="Coordinate" description="Chat with the owner to arrange pickup details." isLast />
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2 text-sm">
                            <PlusCircle size={16} className="text-gray-400" /> Listing Items
                        </h3>
                        <Step number={1} icon={PlusCircle} title="Click 'List an Item'" description="From the home page or the navbar, click 'List an Item'." />
                        <Step number={2} icon={Camera} title="Add Photos & Details" description="Upload clear photos. Add a title, description, and select a category." />
                        <Step number={3} icon={Tag} title="Choose Mode & Price" description="Pick Rent, Sell, or Give. Set the price (if applicable) and item condition." />
                        <Step number={4} icon={MapPin} title="Set Pickup Location" description="Tell others where they can collect the item." />
                        <Step number={5} icon={CheckCircle} title="Publish" description="Hit publish. Students at your college will see it immediately." isLast />
                    </div>
                </div>
            </section>

            {/* ===== REQUESTS & DEALS ===== */}
            <section id="requests-deals" className="scroll-mt-20 mb-20">
                <SectionHeader icon={Inbox} title="Requests & Deals" description="How transactions work from start to finish" />

                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 mb-8">
                    <h3 className="font-medium text-gray-900 mb-4 text-center text-sm">Transaction Flow</h3>
                    <div className="flex items-start justify-center overflow-x-auto pb-2">
                        <PipelineStep icon={Send} label="Request" />
                        <PipelineStep icon={Check} label="Accepted" />
                        <PipelineStep icon={FileText} label="Agreement" />
                        <PipelineStep icon={Package} label="Active" />
                        <PipelineStep icon={CheckCircle} label="Completed" isLast />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2 text-sm">
                            <ShoppingBag size={16} className="text-gray-400" /> If You Want Something
                        </h3>
                        <Step number={1} icon={Send} title="Send a Request" description="Write a message explaining why you need it. For rent/sell, propose a price." />
                        <Step number={2} icon={Clock} title="Wait for Response" description="The owner reviews and accepts or rejects your request." />
                        <Step number={3} icon={FileText} title="Review Agreement" description="If accepted, the owner proposes terms (price, duration, conditions)." />
                        <Step number={4} icon={Check} title="Confirm Agreement" description="Accept the terms to start the deal." />
                        <Step number={5} icon={MessageSquare} title="Coordinate Pickup" description="Chat with the owner to arrange when and where." />
                        <Step number={6} icon={CheckCircle} title="Complete" description="Mark as returned (for rentals). Both get a trust score boost!" isLast />
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2 text-sm">
                            <Package size={16} className="text-gray-400" /> If You're the Owner
                        </h3>
                        <Step number={1} icon={Inbox} title="Check Inbox" description="New requests appear in your Inbox. You'll also get a notification." />
                        <Step number={2} icon={Check} title="Accept or Reject" description="Review the request and the requester's trust score. Accept or decline." />
                        <Step number={3} icon={FileText} title="Propose Agreement" description="Set the final price, duration, and any terms or conditions." />
                        <Step number={4} icon={MessageSquare} title="Coordinate" description="Chat with the requester about pickup time and place." />
                        <Step number={5} icon={CheckCircle} title="Confirm Completion" description="When the item is returned (or sold), confirm to close the deal." isLast />
                    </div>
                </div>
            </section>

            {/* ===== LOST & FOUND ===== */}
            <section id="lost-found" className="scroll-mt-20 mb-20">
                <SectionHeader icon={Search} title="Lost & Found" description="Help reunite items with their owners on campus" />

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2 text-sm">
                            <AlertCircle size={16} className="text-gray-400" /> I Lost Something
                        </h3>
                        <Step number={1} icon={PlusCircle} title="Report Lost Item" description="Go to Lost & Found → Report Item → select 'Lost'." />
                        <Step number={2} icon={Camera} title="Add Details" description="Describe the item, add photos, and mark the last-seen location." />
                        <Step number={3} icon={HelpCircle} title="Set Verification Questions" description="Add security questions only the real owner can answer." />
                        <Step number={4} icon={Clock} title="Wait for Claims" description="You'll be notified if someone claims to have found your item." />
                        <Step number={5} icon={Check} title="Verify & Recover" description="Verify the finder, chat, and arrange return." isLast />
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2 text-sm">
                            <Eye size={16} className="text-gray-400" /> I Found Something
                        </h3>
                        <Step number={1} icon={PlusCircle} title="Report Found Item" description="Go to Lost & Found → Report Item → select 'Found'." />
                        <Step number={2} icon={Camera} title="Add Details" description="Describe the item, add photos, and mark where you found it." />
                        <Step number={3} icon={Clock} title="Wait for the Owner" description="The real owner will claim the item." />
                        <Step number={4} icon={HelpCircle} title="Verify Identity" description="Answer their verification questions to confirm ownership." />
                        <Step number={5} icon={MessageSquare} title="Arrange Return" description="Chat and meet to hand over the item." isLast />
                    </div>
                </div>

                <h3 className="font-medium text-gray-900 mb-3 text-sm">Urgency Levels</h3>
                <div className="space-y-2 mb-6">
                    {[
                        { label: 'Critical', variant: 'danger', desc: 'Extremely urgent — wallet, keys, phone' },
                        { label: 'Urgent', variant: 'warning', desc: 'Time-sensitive — laptop, ID card' },
                        { label: 'Medium', variant: 'primary', desc: 'Important but not time-critical — books, accessories' },
                        { label: 'Low', variant: 'secondary', desc: 'Not urgent — clothing, stationery' },
                    ].map((u, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg">
                            <Badge variant={u.variant}>{u.label}</Badge>
                            <span className="text-xs text-gray-500">{u.desc}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
                    <HelpCircle size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 leading-relaxed">
                        <strong>Verification questions</strong> are security questions you set when posting a lost item (e.g., "What sticker is on the laptop lid?").
                        Only the real owner can answer correctly. This prevents false claims.
                    </p>
                </div>
            </section>

            {/* ===== WANTED ITEMS ===== */}
            <section id="wanted-items" className="scroll-mt-20 mb-20">
                <SectionHeader icon={Heart} title="Wanted Items" description="Post what you need or help someone out" />

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2 text-sm">
                            <AlertCircle size={16} className="text-gray-400" /> I Need Something
                        </h3>
                        <Step number={1} icon={PlusCircle} title="Post a Request" description="Describe what you need, set a budget and urgency level." />
                        <Step number={2} icon={Clock} title="Wait for Offers" description="Other students who have the item make offers (free, sell, or rent)." />
                        <Step number={3} icon={Eye} title="Review Offers" description="Compare offers, check trust scores, and pick the best one." />
                        <Step number={4} icon={Check} title="Accept an Offer" description="Accept the offer to open a chat with the offerer." />
                        <Step number={5} icon={MessageSquare} title="Coordinate" description="Arrange pickup and complete the exchange." isLast />
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2 text-sm">
                            <Gift size={16} className="text-gray-400" /> I Can Help Someone
                        </h3>
                        <Step number={1} icon={Search} title="Browse Wanted" description="Go to the Wanted section to see what students need." />
                        <Step number={2} icon={Eye} title="Find a Match" description="Look for something you have or can provide." />
                        <Step number={3} icon={Send} title="Make an Offer" description="Choose offer type (free/sell/rent), add a message and photos." />
                        <Step number={4} icon={Clock} title="Wait for Response" description="The requester reviews and accepts or rejects your offer." />
                        <Step number={5} icon={MessageSquare} title="Chat & Exchange" description="If accepted, chat opens. Coordinate the handover." isLast />
                    </div>
                </div>
            </section>

            {/* ===== CHAT ===== */}
            <section id="chat" className="scroll-mt-20 mb-20">
                <SectionHeader icon={MessageSquare} title="Chat & Messaging" description="Communicate securely with other students" />

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { icon: MessageSquare, title: 'Real-time Chat', desc: 'Instant messaging with typing indicators' },
                        { icon: MapPin, title: 'Share Location', desc: 'Send your GPS location for meetups' },
                        { icon: Calendar, title: 'Propose Meetup', desc: 'Suggest date, time, and place' },
                        { icon: Eye, title: 'Read Receipts', desc: 'Know when messages are seen' },
                    ].map((f, i) => (
                        <div key={i} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 text-center">
                            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <f.icon size={18} className="text-gray-600" />
                            </div>
                            <h4 className="font-medium text-xs text-gray-900 mb-1">{f.title}</h4>
                            <p className="text-xs text-gray-400">{f.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Chat is available in:</h4>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="primary">Deals & Transactions</Badge>
                        <Badge variant="danger">Lost & Found Claims</Badge>
                        <Badge variant="warning">Wanted Item Offers</Badge>
                    </div>
                </div>
            </section>

            {/* ===== TRUST SCORE ===== */}
            <section id="trust-score" className="scroll-mt-20 mb-20">
                <SectionHeader icon={Shield} title="Trust Score" description="Your reputation on campus" />

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 text-center col-span-1">
                        <div className="w-20 h-20 rounded-full border-2 border-gray-900 flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl font-semibold text-gray-900">50</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">Everyone starts at <strong>50/100</strong></p>
                        <div className="space-y-2 text-xs">
                            {[
                                { range: '80-100', color: 'bg-green-500', label: 'Excellent' },
                                { range: '60-79', color: 'bg-blue-500', label: 'Good' },
                                { range: '40-59', color: 'bg-yellow-500', label: 'Average' },
                                { range: '0-39', color: 'bg-red-500', label: 'Low' },
                            ].map((r, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
                                    <span className="text-gray-500">{r.range}: {r.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="col-span-2 space-y-2">
                        <h3 className="font-medium text-gray-900 mb-3 text-sm">What affects your score</h3>
                        {[
                            { action: 'On-time return', points: '+5', positive: true },
                            { action: 'Successful transaction', points: '+3', positive: true },
                            { action: 'Dispute resolved in your favor', points: '+5', positive: true },
                            { action: 'Late return (1-3 days)', points: '-5', positive: false },
                            { action: 'Late return (3+ days)', points: '-10', positive: false },
                            { action: 'Dispute raised against you', points: '-15', positive: false },
                        ].map((s, i) => (
                            <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${s.positive ? 'bg-gray-50 border-gray-100' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-center gap-2">
                                    {s.positive ? <TrendingUp size={14} className="text-green-600" /> : <X size={14} className="text-red-500" />}
                                    <span className="text-xs text-gray-700">{s.action}</span>
                                </div>
                                <span className={`font-semibold text-xs ${s.positive ? 'text-green-600' : 'text-red-500'}`}>
                                    {s.points}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TIPS ===== */}
            <section id="tips" className="scroll-mt-20 mb-20">
                <SectionHeader icon={Star} title="Tips & Best Practices" description="Make the most of UniLoop" />

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { icon: Camera, title: 'Add Clear Photos', desc: 'Well-lit photos from multiple angles help your item get noticed.' },
                        { icon: FileText, title: 'Write Good Descriptions', desc: 'Include brand, size, condition details, and any defects.' },
                        { icon: DollarSign, title: 'Set Fair Prices', desc: 'Research similar items. Fair prices lead to faster deals.' },
                        { icon: Clock, title: 'Respond Quickly', desc: 'Fast responses improve your trust score and close deals sooner.' },
                        { icon: MapPin, title: 'Meet in Safe Places', desc: 'Use campus common areas for pickups. Avoid isolated locations.' },
                        { icon: Shield, title: 'Build Trust', desc: 'Complete transactions honestly. Your score follows you.' },
                        { icon: HelpCircle, title: 'Use Verification Qs', desc: 'For Lost & Found, add questions only the real owner can answer.' },
                        { icon: CheckCircle, title: 'Be Honest', desc: 'Accurately describe item condition. Honesty builds community trust.' },
                    ].map((tip, i) => (
                        <div key={i} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                                <tip.icon size={16} className="text-gray-600" />
                            </div>
                            <h4 className="font-medium text-xs text-gray-900 mb-1">{tip.title}</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">{tip.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===== QUICK START ===== */}
            <section id="quick-start" className="scroll-mt-20 mb-10">
                <SectionHeader icon={Zap} title="Quick Start Guides" description="Step-by-step for every scenario" />

                <div className="space-y-3">
                    <Accordion icon={ShoppingBag} title="I want to borrow or buy something">
                        <ol className="space-y-2 text-xs text-gray-600">
                            <li><strong>1.</strong> Go to <strong>Browse</strong> from the navbar</li>
                            <li><strong>2.</strong> Use filters to find what you need</li>
                            <li><strong>3.</strong> Click an item to view details</li>
                            <li><strong>4.</strong> Click <strong>"Request Item"</strong> or <strong>"Make an Offer"</strong></li>
                            <li><strong>5.</strong> Wait for the owner to respond</li>
                            <li><strong>6.</strong> Accept the agreement terms</li>
                            <li><strong>7.</strong> Coordinate pickup via chat</li>
                            <li><strong>8.</strong> Return the item on time (for rentals)</li>
                        </ol>
                        <Link to="/items"><Button size="sm" className="mt-4">Browse Items</Button></Link>
                    </Accordion>

                    <Accordion icon={Package} title="I want to lend, sell, or give away something">
                        <ol className="space-y-2 text-xs text-gray-600">
                            <li><strong>1.</strong> Click <strong>"List an Item"</strong> from home or navbar</li>
                            <li><strong>2.</strong> Upload photos and add details</li>
                            <li><strong>3.</strong> Choose mode: Rent, Sell, or Give</li>
                            <li><strong>4.</strong> Set price and condition</li>
                            <li><strong>5.</strong> Publish — students at your college will see it</li>
                            <li><strong>6.</strong> Check your <strong>Inbox</strong> for requests</li>
                            <li><strong>7.</strong> Accept a request and propose agreement</li>
                            <li><strong>8.</strong> Confirm completion when done</li>
                        </ol>
                        <Link to="/my-items/new"><Button size="sm" variant="success" className="mt-4">List an Item</Button></Link>
                    </Accordion>

                    <Accordion icon={AlertCircle} title="I lost something on campus">
                        <ol className="space-y-2 text-xs text-gray-600">
                            <li><strong>1.</strong> Go to <strong>Lost & Found</strong></li>
                            <li><strong>2.</strong> Click <strong>"Report Item"</strong> → select <strong>"Lost"</strong></li>
                            <li><strong>3.</strong> Add detailed description, photo, and last-seen location</li>
                            <li><strong>4.</strong> Set urgency and add verification questions</li>
                            <li><strong>5.</strong> Wait for claims from people who found it</li>
                            <li><strong>6.</strong> Verify the finder using your security questions</li>
                            <li><strong>7.</strong> Chat to arrange return</li>
                            <li><strong>8.</strong> Mark as resolved when recovered</li>
                        </ol>
                        <Link to="/lost-found"><Button size="sm" variant="danger" className="mt-4">Go to Lost & Found</Button></Link>
                    </Accordion>

                    <Accordion icon={Eye} title="I found something on campus">
                        <ol className="space-y-2 text-xs text-gray-600">
                            <li><strong>1.</strong> Go to <strong>Lost & Found</strong></li>
                            <li><strong>2.</strong> Click <strong>"Report Item"</strong> → select <strong>"Found"</strong></li>
                            <li><strong>3.</strong> Describe the item and where you found it</li>
                            <li><strong>4.</strong> Wait for the real owner to claim it</li>
                            <li><strong>5.</strong> Verify their identity</li>
                            <li><strong>6.</strong> Arrange handover via chat</li>
                            <li><strong>7.</strong> Mark as resolved</li>
                        </ol>
                        <Link to="/lost-found"><Button size="sm" variant="success" className="mt-4">Report Found Item</Button></Link>
                    </Accordion>

                    <Accordion icon={Heart} title="I need something specific">
                        <ol className="space-y-2 text-xs text-gray-600">
                            <li><strong>1.</strong> Go to <strong>Wanted Items</strong></li>
                            <li><strong>2.</strong> Click <strong>"Post Wanted Item"</strong></li>
                            <li><strong>3.</strong> Describe what you need, set budget and urgency</li>
                            <li><strong>4.</strong> Wait for offers from other students</li>
                            <li><strong>5.</strong> Review offers and accept the best one</li>
                            <li><strong>6.</strong> Chat to coordinate</li>
                        </ol>
                        <Link to="/wanted/create"><Button size="sm" className="mt-4">Post Wanted Item</Button></Link>
                    </Accordion>

                    <Accordion icon={Gift} title="I can help someone who needs something">
                        <ol className="space-y-2 text-xs text-gray-600">
                            <li><strong>1.</strong> Go to <strong>Wanted Items</strong></li>
                            <li><strong>2.</strong> Browse requests from students</li>
                            <li><strong>3.</strong> Find something you can provide</li>
                            <li><strong>4.</strong> Click <strong>"Make an Offer"</strong></li>
                            <li><strong>5.</strong> Choose type: Free, Sell, or Rent</li>
                            <li><strong>6.</strong> Wait for acceptance</li>
                            <li><strong>7.</strong> Chat and complete the exchange</li>
                        </ol>
                        <Link to="/wanted"><Button size="sm" variant="outline" className="mt-4">Browse Wanted</Button></Link>
                    </Accordion>
                </div>
            </section>

            {/* Footer CTA */}
            <div className="bg-[#1d1d1f] rounded-2xl p-10 text-center text-white">
                <h2 className="text-xl font-semibold mb-2 tracking-tight">Ready to get started?</h2>
                <p className="text-white/50 text-sm mb-6">Join your campus community and start sharing today.</p>
                <div className="flex justify-center gap-3">
                    <Link to="/items"><Button variant="secondary" size="lg">Browse Items</Button></Link>
                    <Link to="/"><Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">Back to Home</Button></Link>
                </div>
            </div>
        </div>
    );
}
