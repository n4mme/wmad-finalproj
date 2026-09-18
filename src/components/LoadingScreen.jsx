import React from 'react';

const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center z-50">
            <div className="text-center">
                {/* Animated Logo/Icon */}
                <div className="relative mb-8">
                    {/* Outer rotating ring */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
                    </div>
                    
                    {/* Middle pulsing ring */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    </div>
                    
                    {/* Inner logo/icon */}
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <div className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
                            BH
                        </div>
                    </div>
                </div>
                
                {/* Loading text */}
                <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-3">
                    BiyaHele
                </h2>
                
                {/* Animated dots */}
                <div className="flex items-center justify-center space-x-2">
                    <span className="text-gray-600 font-medium">Loading</span>
                    <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-8 w-64 mx-auto">
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-teal-500 to-blue-500 animate-loading-bar"></div>
                    </div>
                </div>
            </div>
            
        </div>
    );
};

export default LoadingScreen;

