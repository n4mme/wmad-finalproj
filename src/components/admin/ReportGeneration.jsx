import React, { useState } from 'react';
import { Download, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import FinancialReportModal from './FinancialReportModal';
import UserReportModal from './UserReportModal';
import ListingPerformanceReportModal from './ListingPerformanceReportModal';

const ReportGeneration = () => {
    const [isFinancialOpen, setIsFinancialOpen] = useState(false);
    const [isUserOpen, setIsUserOpen] = useState(false);
    const [isListingOpen, setIsListingOpen] = useState(false);
    const [financialDateRange, setFinancialDateRange] = useState({ start: '', end: '' });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [tempStartDate, setTempStartDate] = useState(null);
    const [tempEndDate, setTempEndDate] = useState(null);

    // Calendar helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        return { daysInMonth, startingDayOfWeek };
    };

    const isDatePast = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const handleDateClick = (date) => {
        // Allow all dates to be selected, including past dates
        if (!tempStartDate || (tempStartDate && tempEndDate)) {
            // Start new selection
            setTempStartDate(date);
            setTempEndDate(null);
        } else {
            // Complete selection
            if (date > tempStartDate) {
                setTempEndDate(date);
            } else {
                setTempStartDate(date);
                setTempEndDate(null);
            }
        }
    };

    const handleApplyDates = () => {
        if (tempStartDate && tempEndDate) {
            // Format dates as YYYY-MM-DD for the date range state
            const startYear = tempStartDate.getFullYear();
            const startMonth = String(tempStartDate.getMonth() + 1).padStart(2, '0');
            const startDay = String(tempStartDate.getDate()).padStart(2, '0');
            const startStr = `${startYear}-${startMonth}-${startDay}`;
            
            const endYear = tempEndDate.getFullYear();
            const endMonth = String(tempEndDate.getMonth() + 1).padStart(2, '0');
            const endDay = String(tempEndDate.getDate()).padStart(2, '0');
            const endStr = `${endYear}-${endMonth}-${endDay}`;
            
            setFinancialDateRange({ start: startStr, end: endStr });
            setShowDatePicker(false);
            // Reset temp dates after applying
            setTempStartDate(null);
            setTempEndDate(null);
        }
    };

    const handleClearDates = () => {
        setTempStartDate(null);
        setTempEndDate(null);
        setFinancialDateRange({ start: '', end: '' });
    };

    // Format date range for display
    const formatDateRange = () => {
        if (!financialDateRange.start || !financialDateRange.end) {
            return 'Select date range (optional)';
        }
        
        const startDate = new Date(financialDateRange.start);
        const endDate = new Date(financialDateRange.end);
        
        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        };
        
        const formatYear = (date) => {
            return date.toLocaleDateString('en-US', { 
                year: 'numeric' 
            });
        };
        
        const startFormatted = formatDate(startDate);
        const endFormatted = formatDate(endDate);
        const year = formatYear(endDate);
        
        // If same month, show: "Nov 13 - 15, 2025"
        // If different months, show: "Nov 13 - Dec 15, 2025"
        if (startDate.getMonth() === endDate.getMonth() && 
            startDate.getFullYear() === endDate.getFullYear()) {
            return `${startFormatted} - ${endDate.getDate()}, ${year}`;
        } else {
            return `${startFormatted} - ${endFormatted}, ${year}`;
        }
    };

    const renderCalendar = () => {
        const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
        const days = [];
        const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        // Empty cells for days before the month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isPast = isDatePast(date);
            const isSelected = (tempStartDate && date.toDateString() === tempStartDate.toDateString()) || 
                              (tempEndDate && date.toDateString() === tempEndDate.toDateString());
            const isInRange = tempStartDate && tempEndDate && date > tempStartDate && date < tempEndDate;
            
            let bgColor = 'bg-white hover:bg-gray-100';
            let textColor = 'text-gray-900';
            let cursor = 'cursor-pointer';
            
            // Past dates are still clickable, just styled slightly differently
            if (isSelected) {
                bgColor = 'bg-teal-600';
                textColor = 'text-white';
            } else if (isInRange) {
                bgColor = 'bg-teal-100';
                textColor = 'text-teal-900';
            } else if (isPast) {
                // Past dates are selectable but with a subtle style difference
                bgColor = 'bg-gray-50 hover:bg-gray-200';
                textColor = 'text-gray-700';
            }
            
            days.push(
                <button
                    key={day}
                    onClick={() => handleDateClick(date)}
                    className={`p-2 text-sm rounded-lg border-2 border-transparent ${bgColor} ${textColor} ${cursor} transition-all`}
                >
                    <div className="font-medium">{day}</div>
                </button>
            );
        }
        
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="font-semibold">{monthName}</h3>
                    <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Day names */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-2 text-xs font-semibold text-center text-gray-600">
                            {day}
                        </div>
                    ))}
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {days}
                </div>
                
                {/* Legend */}
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-white border border-gray-300 rounded mr-2"></div>
                        <span>Available</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-gray-50 rounded mr-2"></div>
                        <span>Past (Selectable)</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-teal-600 rounded mr-2"></div>
                        <span>Selected</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-teal-100 rounded mr-2"></div>
                        <span>In Range</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Report Generation</h3>
            <p className="text-sm text-gray-600 mb-6">
                Generate comprehensive reports for financial data, user activity, and listing performance.
            </p>

            {/* Date Range (Optional for Financial Report) */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range (Optional - for Financial Report only)
                </label>
                <button
                    type="button"
                    onClick={() => {
                        // Initialize temp dates from existing date range if available
                        if (financialDateRange.start && financialDateRange.end && !tempStartDate && !tempEndDate) {
                            setTempStartDate(new Date(financialDateRange.start));
                            setTempEndDate(new Date(financialDateRange.end));
                        }
                        setShowDatePicker(!showDatePicker);
                    }}
                    className="w-full border border-gray-300 rounded-lg p-3 text-left hover:border-gray-400 transition-colors"
                >
                    <p className="text-xs font-semibold text-gray-600 mb-1">START DATE & END DATE</p>
                    <p className="text-sm text-gray-900">
                        {formatDateRange()}
                    </p>
                </button>
                
                {/* Floating Date Picker */}
                {showDatePicker && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50" onClick={() => {
                            setShowDatePicker(false);
                            // Reset temp dates when closing without applying
                            setTempStartDate(null);
                            setTempEndDate(null);
                        }}></div>
                        <div className="relative bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 w-full max-w-3xl max-h-[85vh] overflow-y-auto">
                            {renderCalendar()}
                            {(tempStartDate || tempEndDate) && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                                    <p className="font-semibold mb-1">Selected Dates:</p>
                                    <p>Start: {tempStartDate ? tempStartDate.toLocaleDateString() : 'Not selected'}</p>
                                    <p>End: {tempEndDate ? tempEndDate.toLocaleDateString() : 'Not selected'}</p>
                                </div>
                            )}
                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleClearDates}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Clear
                                </button>
                                <button
                                    type="button"
                                    onClick={handleApplyDates}
                                    disabled={!tempStartDate || !tempEndDate}
                                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 transition-colors"
                                >
                                    Apply Dates
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                    Leave empty for all-time reports
                </p>
            </div>

            {/* Report Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => setIsFinancialOpen(true)}
                    className="px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                    <Download className="w-5 h-5" />
                    <span>Financial Report</span>
                </button>
                <button
                    onClick={() => setIsUserOpen(true)}
                    className="px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                    <Download className="w-5 h-5" />
                    <span>User Report</span>
                </button>
                <button
                    onClick={() => setIsListingOpen(true)}
                    className="px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                    <Download className="w-5 h-5" />
                    <span>Listing Performance Report</span>
                </button>
            </div>

            {isFinancialOpen && (
                <FinancialReportModal
                    dateRange={financialDateRange}
                    onClose={() => setIsFinancialOpen(false)}
                />
            )}
            {isUserOpen && (
                <UserReportModal onClose={() => setIsUserOpen(false)} />
            )}
            {isListingOpen && (
                <ListingPerformanceReportModal onClose={() => setIsListingOpen(false)} />
            )}
        </div>
    );
};

export default ReportGeneration;

