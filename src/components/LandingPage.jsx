import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import BiyaHeleCombinedLogo from './BiyaHeleCombinedLogo.png';

// Import hero videos
import heroimage1 from './heroimage1.mp4';
import heroimage2 from './heroimage2.mp4';
import heroimage3 from './heroimage3.mp4';

// Icons from lucide-react
import { Home, Sparkles, Briefcase, Search, Calendar, Heart } from 'lucide-react';

// Video array - defined outside component to avoid recreation
const heroVideos = [heroimage1, heroimage2, heroimage3];

// --- Landing Page Header Component ---
const LandingHeader = () => {
    const navigate = useNavigate();

    const handleAuthNavigation = (view) => {
        navigate('/auth', { state: { defaultView: view } });
    }

    return (
        <header className="bg-white sticky top-0 z-50 w-full border-b border-gray-200">
            <div className="container mx-auto px-4 flex justify-between items-center py-2">
                {/* Logo */}
                <h1 className="flex items-center min-w-[100px] cursor-pointer" onClick={() => window.location.href = '/'}>
                    <img
                        src={BiyaHeleCombinedLogo}
                        alt="BiyaHele Logo"
                        className="h-10 sm:h-12 md:h-14 w-auto" 
                    />
                </h1>

                {/* --- RIGHT SIDE: Auth Buttons --- */}
                <div className="flex items-center space-x-4 min-w-[200px] justify-end">
                    <button 
                        onClick={() => handleAuthNavigation('login')}
                        data-testid="landing-login-button"
                        className="text-gray-700 hover:text-teal-500 font-medium whitespace-nowrap transition-colors"
                    >
                        Login
                    </button>
                    <button 
                        onClick={() => handleAuthNavigation('signup')}
                        data-testid="landing-signup-button"
                        className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </header>
    );
};

// --- Hero Video Component with seamless transitions (crossfade technique) ---
const HeroVideoSection = () => {
    const video1Ref = useRef(null);
    const video2Ref = useRef(null);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [activeVideo, setActiveVideo] = useState(1); // 1 or 2
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    useEffect(() => {
        const video1 = video1Ref.current;
        const video2 = video2Ref.current;
        if (!video1 || !video2) return;
        
        const currentVideo = activeVideo === 1 ? video1 : video2;
        const nextVideo = activeVideo === 1 ? video2 : video1;
        
        // Preload and prepare next video
        const nextIndex = (currentVideoIndex + 1) % heroVideos.length;
        nextVideo.src = heroVideos[nextIndex];
        nextVideo.load();
        
        const handleTimeUpdate = () => {
            // When current video is 0.3 seconds from ending, start next video
            if (currentVideo.currentTime >= currentVideo.duration - 0.3 && !isTransitioning) {
                setIsTransitioning(true);
                nextVideo.currentTime = 0;
                nextVideo.play().catch(() => {});
                
                // Crossfade transition
                setTimeout(() => {
                    setActiveVideo(activeVideo === 1 ? 2 : 1);
                    setCurrentVideoIndex(nextIndex);
                    setIsTransitioning(false);
                    currentVideo.pause();
                    currentVideo.currentTime = 0;
                }, 100);
            }
        };
        
        const handleVideoEnd = () => {
            // Fallback: if timeupdate didn't trigger, switch immediately
            if (!isTransitioning) {
                setIsTransitioning(true);
                nextVideo.currentTime = 0;
                nextVideo.play().catch(() => {});
                
                setTimeout(() => {
                    setActiveVideo(activeVideo === 1 ? 2 : 1);
                    setCurrentVideoIndex(nextIndex);
                    setIsTransitioning(false);
                    currentVideo.pause();
                    currentVideo.currentTime = 0;
                }, 50);
            }
        };
        
        currentVideo.addEventListener('timeupdate', handleTimeUpdate);
        currentVideo.addEventListener('ended', handleVideoEnd);
        
        // Start playing current video
        currentVideo.load();
        const playPromise = currentVideo.play();
        
        if (playPromise !== undefined) {
            playPromise.catch((error) => {
                console.log('Video autoplay prevented:', error);
            });
        }
        
        return () => {
            currentVideo.removeEventListener('timeupdate', handleTimeUpdate);
            currentVideo.removeEventListener('ended', handleVideoEnd);
        };
    }, [currentVideoIndex, activeVideo, isTransitioning]);
    
    return (
        <div className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[90vh] overflow-hidden bg-black">
            {/* Video 1 */}
            <video
                ref={video1Ref}
                className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-300 ${
                    activeVideo === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
                muted
                playsInline
                loop={false}
                preload="auto"
            >
                <source src={heroVideos[currentVideoIndex]} type="video/mp4" />
            </video>
            
            {/* Video 2 */}
            <video
                ref={video2Ref}
                className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-300 ${
                    activeVideo === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
                muted
                playsInline
                loop={false}
                preload="auto"
            >
                <source src={heroVideos[(currentVideoIndex + 1) % heroVideos.length]} type="video/mp4" />
            </video>
            
            {/* Dark overlay for better text visibility */}
            <div className="absolute inset-0 bg-black bg-opacity-50 z-20"></div>
            
            {/* Text Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6 md:px-8 z-30">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-3 sm:mb-4 md:mb-6 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] leading-tight">
                    Where Travel Meets Comfort, Offering the Best Experiences and Unmatched Services
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] max-w-4xl font-medium">
                    Find unique stays, craft lasting experiences, and access unmatched professional support.
                </p>
            </div>
        </div>
    );
};

// --- Browse Collections Section with Shuffle Animation ---
const BrowseCollectionsSection = ({ onNavigateToViewingPage }) => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);
    
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                    }
                });
            },
            { threshold: 0.2 }
        );
        
        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }
        
        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []);
    
    const categories = [
        {
            id: 'home',
            icon: Home,
            title: 'Homes',
            description: 'cozy, intimate, and comfortable place.',
            color: 'from-blue-500 to-blue-600',
            hoverColor: 'hover:from-blue-600 hover:to-blue-700',
            onClick: () => {
                onNavigateToViewingPage('Home');
            }
        },
        {
            id: 'experience',
            icon: Sparkles,
            title: 'Experiences',
            description: 'experience something like never before',
            color: 'from-purple-500 to-purple-600',
            hoverColor: 'hover:from-purple-600 hover:to-purple-700',
            onClick: () => {
                onNavigateToViewingPage('Experiences');
            }
        },
        {
            id: 'service',
            icon: Briefcase,
            title: 'Services',
            description: 'services from the professionals',
            color: 'from-teal-500 to-teal-600',
            hoverColor: 'hover:from-teal-600 hover:to-teal-700',
            onClick: () => {
                onNavigateToViewingPage('Services');
            }
        }
    ];
    
    // Display order: Homes, Experiences, Services (0, 1, 2)
    const displayOrder = [0, 1, 2];
    
    return (
        <section ref={sectionRef} className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-white to-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Browse Our Unique Collections.
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                        From your stay to your adventure—we cover every part of your journey
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
                    {displayOrder.map((order, index) => {
                        const category = categories[order];
                        const Icon = category.icon;
                        return (
                            <div
                                key={category.id}
                                className={`
                                    transform transition-all duration-700 ease-out
                                    ${isVisible 
                                        ? 'opacity-100 translate-y-0 scale-100' 
                                        : 'opacity-0 translate-y-10 scale-95'
                                    }
                                    ${index === 0 ? 'delay-100' : index === 1 ? 'delay-200' : 'delay-300'}
                                `}
                            >
                                <button
                                    onClick={category.onClick}
                                    className={`
                                        w-full p-8 sm:p-10 rounded-2xl shadow-xl
                                        bg-gradient-to-br ${category.color} ${category.hoverColor}
                                        text-white transform transition-all duration-300
                                        hover:scale-105 hover:shadow-2xl
                                        flex flex-col items-center justify-center
                                        min-h-[280px] sm:min-h-[320px]
                                    `}
                                >
                                    <div className="mb-4 sm:mb-6">
                                        <Icon className="w-12 h-12 sm:w-16 sm:h-16" />
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                                        {category.title}
                                    </h3>
                                    <p className="text-sm sm:text-base text-white/90 text-center">
                                        {category.description}
                                    </p>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

// --- How It Works Section ---
const HowItWorksSection = () => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);
    
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                    }
                });
            },
            { threshold: 0.2 }
        );
        
        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }
        
        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []);
    
    const steps = [
        {
            number: '01',
            title: 'Search',
            description: 'Browse through our curated collection of homes, experiences, and services. Use filters to find exactly what you need.',
            icon: Search,
            color: 'from-blue-500 to-indigo-600',
            delay: 'delay-100'
        },
        {
            number: '02',
            title: 'Book',
            description: 'Select your dates, choose your preferences, and complete your booking with secure payment options.',
            icon: Calendar,
            color: 'from-teal-500 to-cyan-600',
            delay: 'delay-200'
        },
        {
            number: '03',
            title: 'Enjoy',
            description: 'Experience your perfect stay, unforgettable adventure, or professional service. Create memories that last a lifetime.',
            icon: Heart,
            color: 'from-pink-500 to-rose-600',
            delay: 'delay-300'
        }
    ];
    
    return (
        <section ref={sectionRef} className="py-16 sm:py-20 md:py-24 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        This is How your Journey Starts
                    </h2>
                </div>
                
                    <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div
                                    key={step.number}
                                    className={`
                                        transform transition-all duration-700 ease-out relative
                                        ${isVisible 
                                            ? 'opacity-100 translate-y-0' 
                                            : 'opacity-0 translate-y-10'
                                        }
                                        ${step.delay}
                                    `}
                                >
                                    <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10 hover:shadow-2xl transition-shadow duration-300 border border-gray-100">
                                        {/* Number Badge */}
                                        <div className={`
                                            w-16 h-16 sm:w-20 sm:h-20 rounded-full
                                            bg-gradient-to-br ${step.color}
                                            flex items-center justify-center
                                            mb-6 mx-auto
                                            transform transition-transform duration-300
                                            ${isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}
                                        `}>
                                            <span className="text-white text-xl sm:text-2xl font-bold">
                                                {step.number}
                                            </span>
                                        </div>
                                        
                                        {/* Icon */}
                                        <div className="mb-6 flex justify-center">
                                            <div className={`
                                                p-4 rounded-full bg-gradient-to-br ${step.color}
                                                transform transition-all duration-500
                                                ${isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}
                                            `}>
                                                <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                            </div>
                                        </div>
                                        
                                        {/* Content */}
                                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 text-center">
                                            {step.title}
                                        </h3>
                                        <p className="text-gray-600 text-center text-sm sm:text-base leading-relaxed">
                                            {step.description}
                                        </p>
                                        
                                        {/* Arrow (for desktop) */}
                                        {index < steps.length - 1 && (
                                            <div className="hidden md:block absolute top-1/2 -right-5 transform -translate-y-1/2">
                                                <div className="w-10 h-1 bg-gradient-to-r from-teal-400 to-blue-400"></div>
                                                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-8 border-l-teal-400 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- Main Landing Page Component ---
export default function LandingPage() {
    const navigate = useNavigate();
    
    const handleNavigateToViewingPage = (category) => {
        // Navigate to viewing page with category parameter and scroll flag
        navigate('/viewing', { state: { category, scrollToHero: true } });
    };
    
    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <script src="https://cdn.tailwindcss.com"></script>
            <LandingHeader />
            
            {/* Hero Video Section */}
            <HeroVideoSection />
            
            {/* Browse Collections Section */}
            <BrowseCollectionsSection onNavigateToViewingPage={handleNavigateToViewingPage} />
            
            {/* How It Works Section */}
            <HowItWorksSection />
            
            {/* Enhanced Footer */}
            <footer className="bg-gradient-to-r from-teal-600 to-teal-700 text-white mt-16">
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* About Section */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">About BiyaHele</h3>
                            <p className="text-teal-100 text-sm leading-relaxed">
                                Your trusted platform for finding the perfect accommodation in the Philippines. 
                                From serene beaches to vibrant cities, we help you find your rest.
                            </p>
                        </div>
                        
                        {/* Quick Links */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="text-teal-100 hover:text-white transition">About Us</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Careers</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Press</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Blog</a></li>
                            </ul>
                        </div>
                        
                        {/* Support */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Support</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Help Center</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Safety Information</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Cancellation Options</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Contact Us</a></li>
                            </ul>
                        </div>
                        
                        {/* Hosting */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Hosting</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="text-teal-100 hover:text-white transition">List Your Property</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Host Resources</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Community Forum</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Hosting Responsibly</a></li>
                            </ul>
                        </div>
                    </div>
                    
                    {/* Bottom Bar */}
                    <div className="border-t border-teal-500 pt-6 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-teal-100 text-sm mb-4 md:mb-0">
                            &copy; 2025 BiyaHele. All rights reserved. Find your rest.
                        </p>
                        <div className="flex space-x-6">
                            <a href="#" className="text-teal-100 hover:text-white transition">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                            <a href="#" className="text-teal-100 hover:text-white transition">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                            </a>
                            <a href="#" className="text-teal-100 hover:text-white transition">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
