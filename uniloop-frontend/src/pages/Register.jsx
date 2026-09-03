import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Input, Button, Card, UniLoopLogo } from '../components/ui';
import { Upload, User, School, Mail, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import api from '../lib/axios';

const STEP_EMAIL = 'email';
const STEP_OTP = 'otp';
const STEP_DETAILS = 'details';

export default function Register() {
    const [step, setStep] = useState(STEP_EMAIL);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [colleges, setColleges] = useState([]);
    const [detectedCollege, setDetectedCollege] = useState(null);
    const [resendTimer, setResendTimer] = useState(0);
    const otpRefs = useRef([]);
    const { register, login } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchColleges = async () => {
            try {
                const response = await api.get('/users/colleges');
                setColleges(response.data.data || []);
            } catch (error) {
                console.error('Failed to fetch colleges:', error);
            }
        };
        fetchColleges();
    }, []);

    useEffect(() => {
        if (resendTimer > 0) {
            const interval = setInterval(() => setResendTimer(t => t - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [resendTimer]);

    const emailDomain = useMemo(() => {
        const parts = email.split('@');
        return parts.length === 2 ? parts[1].toLowerCase() : '';
    }, [email]);

    useEffect(() => {
        if (!emailDomain) {
            setDetectedCollege(null);
            return;
        }
        const match = colleges.find(c => c.domain === emailDomain);
        if (match) {
            setDetectedCollege(match);
        } else {
            const isValidPattern = /\.(edu|ac\.[a-z]{2,3}|edu\.[a-z]{2,3})$/i.test(emailDomain);
            if (isValidPattern) {
                setDetectedCollege({ name: emailDomain.split('.')[0].toUpperCase(), domain: emailDomain, dynamic: true });
            } else {
                setDetectedCollege(null);
            }
        }
    }, [emailDomain, colleges]);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!detectedCollege) {
            toast.error('Please use a valid college/university email');
            return;
        }
        setIsLoading(true);
        try {
            const res = await api.post('/users/send-otp', { email });
            toast.success('Verification code sent to your email!');
            setStep(STEP_OTP);
            setResendTimer(60);
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send verification code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            otpRefs.current[5]?.focus();
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            toast.error('Please enter the complete 6-digit code');
            return;
        }
        setIsLoading(true);
        try {
            await api.post('/users/verify-otp', { email, otp: otpString });
            toast.success('Email verified successfully');
            setStep(STEP_DETAILS);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendTimer > 0) return;
        setIsLoading(true);
        try {
            await api.post('/users/send-otp', { email });
            toast.success('New verification code sent');
            setResendTimer(60);
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatar(file);
            const reader = new FileReader();
            reader.onload = (e) => setAvatarPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setIsLoading(true);
        try {
            const data = new FormData();
            data.append('fullName', formData.fullName);
            data.append('username', formData.username);
            data.append('email', email);
            data.append('password', formData.password);
            if (avatar) data.append('avatar', avatar);
            await register(data);
            await login({ email, password: formData.password });
            toast.success('Welcome to UniLoop!');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-8">
            <Card className="w-full max-w-md p-8">
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl mb-4 w-full flex justify-center shadow-inner">
                        <UniLoopLogo variant="vertical" size="md" showSlogan={true} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-gray-500 mt-1 text-sm">Join UniLoop with your college email</p>
                </div>

                {/* Step indicators */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    {[STEP_EMAIL, STEP_OTP, STEP_DETAILS].map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                step === s ? 'bg-blue-500 text-white' :
                                [STEP_EMAIL, STEP_OTP, STEP_DETAILS].indexOf(step) > i ? 'bg-green-500 text-white' :
                                'bg-gray-200 text-gray-500'
                            }`}>
                                {[STEP_EMAIL, STEP_OTP, STEP_DETAILS].indexOf(step) > i ? '✓' : i + 1}
                            </div>
                            {i < 2 && <div className={`w-12 h-0.5 mx-1 ${
                                [STEP_EMAIL, STEP_OTP, STEP_DETAILS].indexOf(step) > i ? 'bg-green-500' : 'bg-gray-200'
                            }`} />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Email */}
                {step === STEP_EMAIL && (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                        <Input
                            label="College Email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@college.ac.in"
                            required
                        />

                        {detectedCollege && detectedCollege.isDemo && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                                    <School size={16} className="text-green-600 flex-shrink-0" />
                                    <span className="text-green-800">
                                        <span className="font-medium">{detectedCollege.name}</span>
                                        {' '}&mdash; Demo mode
                                    </span>
                                </div>
                                <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                                    <strong>Note:</strong> Gmail access is provided for judges and testing purposes only. This will be disabled after the evaluation period. For regular use, please sign up with your college email.
                                </div>
                            </div>
                        )}

                        {detectedCollege && !detectedCollege.isDemo && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                                <School size={16} className="text-green-600 flex-shrink-0" />
                                <span className="text-green-800">
                                    <span className="font-medium">{detectedCollege.name}</span>
                                    {' '}&mdash; Items will be scoped to your college
                                </span>
                            </div>
                        )}

                        {email && email.includes('@') && !detectedCollege && (
                            <div className="px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm space-y-1">
                                <p className="text-amber-800 font-medium">
                                    Not a recognized college email.
                                </p>
                                <p className="text-amber-700">
                                    Use your .edu / .ac.in / .edu.in address. If your college isn't listed,{' '}
                                    <a
                                        href="https://github.com/RahulBharadwaz/Uniloop/issues"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline font-medium"
                                    >
                                        raise an issue here
                                    </a>{' '}
                                    and we'll add it.
                                </p>
                            </div>
                        )}

                        <Button type="submit" loading={isLoading} className="w-full" disabled={!detectedCollege}>
                            <Mail size={16} className="mr-2" />
                            Send Verification Code
                        </Button>
                    </form>
                )}

                {/* Step 2: OTP Verification */}
                {step === STEP_OTP && (
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                        <button
                            type="button"
                            onClick={() => setStep(STEP_EMAIL)}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
                        >
                            <ArrowLeft size={14} /> Change email
                        </button>

                        <div className="text-center mb-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full text-sm text-blue-700">
                                <Mail size={14} />
                                {email}
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 text-center">
                            Enter the 6-digit code sent to your email
                        </p>

                        <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => otpRefs.current[index] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    className="w-11 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            ))}
                        </div>

                        <Button type="submit" loading={isLoading} className="w-full">
                            <CheckCircle size={16} className="mr-2" />
                            Verify Email
                        </Button>

                        <p className="text-center text-sm text-gray-500">
                            Didn't receive the code?{' '}
                            {resendTimer > 0 ? (
                                <span className="text-gray-400">Resend in {resendTimer}s</span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    className="text-blue-600 hover:underline font-medium"
                                >
                                    Resend
                                </button>
                            )}
                        </p>
                    </form>
                )}

                {/* Step 3: Account Details */}
                {step === STEP_DETAILS && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm mb-2">
                            <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                            <span className="text-green-800">
                                <span className="font-medium">{email}</span> verified
                                {detectedCollege && <> &mdash; {detectedCollege.name}</>}
                            </span>
                        </div>

                        <div className="flex justify-center mb-4">
                            <label className="relative cursor-pointer">
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt="Avatar preview"
                                        className="w-24 h-24 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
                                        <User size={32} className="text-gray-400" />
                                    </div>
                                )}
                                <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <Upload size={14} className="text-white" />
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <Input
                            label="Full Name"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="John Doe"
                            required
                        />

                        <Input
                            label="Username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="johndoe"
                            required
                        />

                        <div className="relative">
                            <Input
                                label="Password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a strong password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="relative">
                            <Input
                                label="Confirm Password"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <Button type="submit" loading={isLoading} className="w-full">
                            Create Account
                        </Button>
                    </form>
                )}

                <p className="text-center text-gray-500 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 hover:underline font-medium">
                        Sign in
                    </Link>
                </p>
            </Card>
        </div>
    );
}
