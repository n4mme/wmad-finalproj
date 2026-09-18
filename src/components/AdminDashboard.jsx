import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, getDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import BiyaHeleCombinedLogo from './BiyaHeleCombinedLogo.png';
import { Menu, X, LogOut, LayoutDashboard, DollarSign, Users, FileText, Settings, Shield, UserCheck, TrendingUp, Star, BarChart3, PieChart, LineChart, Download, Printer, Filter, X as XIcon, Sparkles } from 'lucide-react';
import DashboardOverview from './admin/DashboardOverview';
import CashOutApproval from './admin/CashOutApproval';
import TerminationAppeals from './admin/TerminationAppeals';
import ServiceFees from './admin/ServiceFees';
import PolicyCompliance from './admin/PolicyCompliance';
import UserManagement from './admin/UserManagement';
import AdminWishlist from './admin/AdminWishlist';

const AdminDashboard = ({ onSignOut }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [adminData, setAdminData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadAdminData = async () => {
            const auth = getAuth();
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (data.role !== 'admin') {
                        // Redirect if not admin
                        navigate('/');
                        return;
                    }
                    setAdminData(data);
                }
            }
        };
        loadAdminData();
    }, [navigate]);

    const handleSignOut = async () => {
        try {
            await signOut(getAuth());
            if (onSignOut) onSignOut();
            navigate('/auth');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
        { id: 'cashout', label: 'Cash Out Approval', icon: DollarSign },
        { id: 'wishlist', label: 'Wishlist', icon: Sparkles },
        { id: 'appeals', label: 'Termination Appeals', icon: FileText },
        { id: 'servicefees', label: 'Service Fees', icon: Settings },
        { id: 'policy', label: 'Policy & Compliance', icon: Shield },
        { id: 'users', label: 'User Management', icon: Users },
    ];

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <DashboardOverview />;
            case 'cashout':
                return <CashOutApproval />;
            case 'wishlist':
                return <AdminWishlist />;
            case 'appeals':
                return <TerminationAppeals />;
            case 'servicefees':
                return <ServiceFees />;
            case 'policy':
                return <PolicyCompliance />;
            case 'users':
                return <UserManagement />;
            default:
                return <DashboardOverview />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Menu className="w-6 h-6 text-gray-600" />
                        </button>
                        <img
                            src={BiyaHeleCombinedLogo}
                            alt="BiyaHele Logo"
                            className="h-10 w-auto"
                        />
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                                {adminData?.email || 'admin@gmail.com'}
                            </p>
                            <p className="text-xs text-gray-500">Administrator</p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside
                    className={`bg-white border-r border-gray-200 transition-all duration-300 ${
                        isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
                    }`}
                >
                    <nav className="p-4 space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setCurrentPage(item.id)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                        currentPage === item.id
                                            ? 'bg-teal-50 text-teal-700 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-0' : 'ml-0'}`}>
                    <div className="p-6">
                        {renderPage()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;

