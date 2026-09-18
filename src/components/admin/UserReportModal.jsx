import React, { useState, useEffect, useRef } from 'react';
import { X, Download } from 'lucide-react';
import BiyaHeleCombinedLogo from '../BiyaHeleCombinedLogo.png';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
// Note: html2pdf.js needs to be imported differently
let html2pdf;
try {
    html2pdf = require('html2pdf.js');
} catch (e) {
    html2pdf = null;
}

const UserReportModal = ({ onClose }) => {
    const contentRef = useRef(null);
    const [users, setUsers] = useState([]);
    const [summary, setSummary] = useState({
        totalUsers: 0,
        totalHosts: 0,
        totalGuests: 0,
        activeUsers: 0,
        inactiveUsers: 0,
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const allUsersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Exclude admin accounts from total count
            const usersData = allUsersData.filter(u => u.role !== 'admin');

            const hosts = usersData.filter(u => u.role === 'host');
            const guests = usersData.filter(u => u.role === 'guest');
            const activeUsers = usersData.filter(u => u.emailVerified || u.otpVerified).length;
            const inactiveUsers = usersData.length - activeUsers;

            setSummary({
                totalUsers: usersData.length, // Total Guests + Total Hosts (excludes admin)
                totalHosts: hosts.length,
                totalGuests: guests.length,
                activeUsers,
                inactiveUsers,
            });

            // Load additional user details
            const usersWithDetails = await Promise.all(
                usersData.map(async (user) => {
                    // Handle lastLogin - could be a timestamp, Date object, or null
                    let lastLoginDate = null;
                    if (user.lastLogin) {
                        if (user.lastLogin.toDate) {
                            lastLoginDate = user.lastLogin.toDate();
                        } else if (user.lastLogin instanceof Date) {
                            lastLoginDate = user.lastLogin;
                        } else if (typeof user.lastLogin === 'string' || typeof user.lastLogin === 'number') {
                            lastLoginDate = new Date(user.lastLogin);
                        }
                    }
                    
                    // For active users without lastLogin, use createdAt as fallback
                    const isActive = user.emailVerified || user.otpVerified;
                    if (isActive && !lastLoginDate && user.createdAt) {
                        if (user.createdAt.toDate) {
                            lastLoginDate = user.createdAt.toDate();
                        } else if (user.createdAt instanceof Date) {
                            lastLoginDate = user.createdAt;
                        } else if (typeof user.createdAt === 'string' || typeof user.createdAt === 'number') {
                            lastLoginDate = new Date(user.createdAt);
                        }
                    }
                    
                    return {
                        ...user,
                        lastLogin: lastLoginDate,
                    };
                })
            );

            setUsers(usersWithDetails);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const handleDownloadPDF = async () => {
        if (!html2pdf) {
            alert('PDF generation library not available. Please install html2pdf.js');
            return;
        }
        const element = contentRef.current;
        
        if (!element) {
            alert('Content element not found');
            return;
        }
        
        // Get the scrollable parent container and modal container
        const scrollableParent = element.closest('.overflow-y-auto');
        const modalContainer = element.closest('.bg-white.rounded-lg');
        
        const originalStyles = {
            maxHeight: scrollableParent?.style.maxHeight,
            overflow: scrollableParent?.style.overflow,
            height: scrollableParent?.style.height,
            modalMaxHeight: modalContainer?.style.maxHeight
        };
        
        // Temporarily expand ALL containers to show all content
        if (scrollableParent) {
            scrollableParent.style.maxHeight = 'none';
            scrollableParent.style.overflow = 'visible';
            scrollableParent.style.height = 'auto';
        }
        if (modalContainer) {
            modalContainer.style.maxHeight = 'none';
        }
        
        // Force reflow and wait for layout to update
        void element.offsetHeight; // Force reflow
        
        // Scroll to ensure all content is in view
        if (scrollableParent) {
            scrollableParent.scrollTop = 0;
        }
        element.scrollTop = 0;
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get the table element to verify all rows are present
        const table = element.querySelector('table');
        const tableRows = table ? table.querySelectorAll('tbody tr') : [];
        console.log(`Total users to export: ${tableRows.length}`);
        
        // Verify all rows are rendered
        if (users && users.length > 0 && tableRows.length !== users.length) {
            console.warn(`Warning: Table has ${tableRows.length} rows but users array has ${users.length} users`);
        }
        
        // Calculate actual full height from the expanded element
        const fullHeight = element.scrollHeight || element.offsetHeight;
        const fullWidth = element.scrollWidth || element.offsetWidth;
        
        console.log(`Element dimensions - Width: ${fullWidth}, Height: ${fullHeight}`);
        console.log(`Table rows count: ${tableRows.length}`);
        
        // Don't limit height - let html2canvas capture everything
        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: 'user-report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                logging: false,
                letterRendering: true,
                width: fullWidth,
                // Don't set height - let it auto-calculate to capture all content
                windowWidth: fullWidth,
                // Don't limit windowHeight - let it capture full content
                scrollX: 0,
                scrollY: 0,
                allowTaint: true,
                backgroundColor: '#ffffff',
                removeContainer: false,
                onclone: (clonedDoc) => {
                    try {
                        // Ensure the cloned element also has no height restrictions
                        const clonedElement = clonedDoc.querySelector('[data-content-ref]') || 
                                             (clonedDoc.body && clonedDoc.body.firstElementChild) ||
                                             (clonedDoc.documentElement && clonedDoc.documentElement.firstElementChild);
                        if (clonedElement) {
                            clonedElement.style.height = 'auto';
                            clonedElement.style.maxHeight = 'none';
                            clonedElement.style.overflow = 'visible';
                        }
                        // Also ensure table and tbody have no restrictions
                        const clonedTable = clonedDoc.querySelector('table');
                        if (clonedTable) {
                            clonedTable.style.height = 'auto';
                            clonedTable.style.maxHeight = 'none';
                        }
                        const clonedTbody = clonedDoc.querySelector('tbody');
                        if (clonedTbody) {
                            clonedTbody.style.height = 'auto';
                            clonedTbody.style.maxHeight = 'none';
                        }
                    } catch (e) {
                        console.warn('Error in onclone callback:', e);
                    }
                }
            },
            jsPDF: { 
                unit: 'in', 
                format: 'a4', 
                orientation: 'landscape' 
            },
            pagebreak: { 
                mode: ['avoid-all', 'css', 'legacy'],
                before: '.page-break-before',
                after: '.page-break-after',
                avoid: ['tr', 'thead']
            }
        };
        
        try {
            // Generate PDF directly from the expanded element
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            // Restore original styles
            if (scrollableParent) {
                if (originalStyles.maxHeight) scrollableParent.style.maxHeight = originalStyles.maxHeight;
                else scrollableParent.style.removeProperty('max-height');
                if (originalStyles.overflow) scrollableParent.style.overflow = originalStyles.overflow;
                else scrollableParent.style.removeProperty('overflow');
                if (originalStyles.height) scrollableParent.style.height = originalStyles.height;
                else scrollableParent.style.removeProperty('height');
            }
            if (modalContainer && originalStyles.modalMaxHeight) {
                modalContainer.style.maxHeight = originalStyles.modalMaxHeight;
            } else if (modalContainer) {
                modalContainer.style.removeProperty('max-height');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">User Report</h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleDownloadPDF}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download PDF</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div ref={contentRef} data-content-ref className="p-8" style={{ width: '100%', overflow: 'visible', minHeight: '100%' }}>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <img
                            src={BiyaHeleCombinedLogo}
                            alt="BiyaHele Logo"
                            className="h-12 w-auto"
                        />
                        <div className="text-right">
                            <h3 className="text-2xl font-bold text-gray-900">User Report</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Generated: {new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                Period: All Time – Present
                            </p>
                        </div>
                    </div>

                    {/* User Summary */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">User Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Total Users</p>
                                <p className="text-xl font-bold text-gray-900">{summary.totalUsers}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Hosts</p>
                                <p className="text-xl font-bold text-teal-600">{summary.totalHosts}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Guests</p>
                                <p className="text-xl font-bold text-teal-600">{summary.totalGuests}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Active Users</p>
                                <p className="text-xl font-bold text-green-600">{summary.activeUsers}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Inactive Users</p>
                                <p className="text-xl font-bold text-red-600">{summary.inactiveUsers}</p>
                            </div>
                        </div>
                    </div>

                    {/* All Users */}
                    <div className="mb-6" style={{ pageBreakInside: 'auto' }}>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">All Users</h4>
                        <div style={{ overflowX: 'visible', width: '100%', overflowY: 'visible' }}>
                            <table className="w-full border-collapse text-sm" style={{ tableLayout: 'auto', width: '100%', wordWrap: 'break-word' }}>
                                <thead>
                                    <tr className="bg-gray-100" style={{ pageBreakInside: 'avoid', pageBreakAfter: 'avoid' }}>
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '12%', minWidth: '100px' }}>Name</th>
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '18%', minWidth: '150px' }}>Email</th>
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '12%', minWidth: '100px' }}>Phone</th>
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '8%', minWidth: '70px' }}>Role</th>
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '12%', minWidth: '100px' }}>Join Date</th>
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '12%', minWidth: '100px' }}>Last Login</th>
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '10%', minWidth: '80px' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, index) => (
                                        <tr key={user.id} style={{ pageBreakInside: 'auto' }}>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>{user.fullName || 'N/A'}</td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>{user.email}</td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>{user.mobileNumber || 'N/A'}</td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs capitalize" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>{user.role}</td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                                                {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                                                {user.lastLogin ? (user.lastLogin instanceof Date ? user.lastLogin.toLocaleDateString() : new Date(user.lastLogin).toLocaleDateString()) : 'N/A'}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    (user.emailVerified || user.otpVerified) 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {(user.emailVerified || user.otpVerified) ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserReportModal;

