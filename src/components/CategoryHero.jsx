import React from 'react';

const CategoryHero = ({ category, title, subtitle }) => {
    // Define hero images/videos for each category
    const heroConfig = {
        home: {
            image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            overlay: 'bg-gradient-to-br from-teal-600/70 via-blue-600/60 to-cyan-500/70',
            animation: 'animate-gradient-xy',
        },
        experience: {
            image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            overlay: 'bg-gradient-to-br from-emerald-600/70 via-teal-600/60 to-green-500/70',
            animation: 'animate-gradient-xy',
        },
        service: {
            image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            overlay: 'bg-gradient-to-br from-indigo-600/70 via-purple-600/60 to-pink-500/70',
            animation: 'animate-gradient-xy',
        },
    };

    const config = heroConfig[category.toLowerCase()] || heroConfig.home;

    return (
        <div className="relative rounded-xl md:rounded-2xl overflow-hidden h-[200px] sm:h-[240px] md:h-[300px] lg:h-[350px] flex items-center justify-center text-center text-white p-4 mb-6 md:mb-8 group">
            {/* Background Image with Parallax Effect */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transform group-hover:scale-110 transition-transform duration-700 ease-out"
                style={{
                    backgroundImage: `url(${config.image})`,
                }}
            >
                {/* Animated Gradient Overlay */}
                <div className={`absolute inset-0 ${config.overlay} ${config.animation}`}></div>
                
                {/* Additional Dark Overlay for Text Readability */}
                <div className="absolute inset-0 bg-black/30 z-10"></div>
                
                {/* Animated Particles Effect */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${2 + Math.random() * 2}s`,
                            }}
                        ></div>
                    ))}
                </div>
            </div>
            
            {/* Content */}
            <div className="relative z-20 text-white px-2 sm:px-4 animate-fadeIn">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-2xl mb-3 transform group-hover:scale-105 transition-transform duration-300">
                    {title}
                </h1>
                <p className="mt-2 text-sm sm:text-base md:text-lg lg:text-xl drop-shadow-lg font-medium">
                    {subtitle}
                </p>
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50/20 to-transparent z-10"></div>
        </div>
    );
};

export default CategoryHero;

