import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MessageCircle, Send, Search, X } from 'lucide-react';
import { auth } from '../firebase';
import { 
    getUserMessageThreads, 
    sendMessage, 
    markThreadAsRead,
    getUserData,
    getListing
} from '../utils/firestoreUtils';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const Messages = ({ setPage, initialThreadId = null, onThreadDisplayed }) => {
    const [threads, setThreads] = useState([]);
    const [filteredThreads, setFilteredThreads] = useState([]);
    const [selectedThread, setSelectedThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [otherUserData, setOtherUserData] = useState(null);
    const [listingData, setListingData] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [userDataCache, setUserDataCache] = useState({}); // Cache for user data
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const unsubscribeMessagesRef = useRef(null);
    const hasAutoSelectedRef = useRef(false);

    useEffect(() => {
        if (initialThreadId) {
            hasAutoSelectedRef.current = false;
        }
    }, [initialThreadId]);

    useEffect(() => {
        loadThreads();
        
        // Listen for navigateToMessages event
        const handleNavigateToMessages = (event) => {
            if (event.detail?.threadId) {
                hasAutoSelectedRef.current = false;
                setSelectedThread(null);
                loadThreads();
            }
        };
        window.addEventListener('navigateToMessages', handleNavigateToMessages);
        
        return () => {
            window.removeEventListener('navigateToMessages', handleNavigateToMessages);
            if (unsubscribeMessagesRef.current) {
                unsubscribeMessagesRef.current();
            }
        };
    }, []);

    useEffect(() => {
        if (selectedThread) {
            loadMessages();
            loadOtherUserData();
            if (selectedThread.listingId) {
                loadListingData();
            }
        }
        return () => {
            if (unsubscribeMessagesRef.current) {
                unsubscribeMessagesRef.current();
            }
        };
    }, [selectedThread]);

    useEffect(() => {
        filterThreadsAsync();
    }, [searchQuery, threads]);

    const filterThreadsAsync = async () => {
        if (searchQuery.trim() === '') {
            setFilteredThreads(threads);
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const filtered = [];
        const user = auth.currentUser;
        
        for (const thread of threads) {
            const otherUserId = thread.guestId === user?.uid ? thread.hostId : thread.guestId;
            
            // Use cached data if available, otherwise fetch
            let userData = userDataCache[otherUserId];
            if (!userData) {
                const userResult = await getUserData(otherUserId);
                if (userResult.success) {
                    userData = userResult.data;
                    // Update cache
                    setUserDataCache(prev => ({ ...prev, [otherUserId]: userData }));
                } else {
                    continue; // Skip if we can't get user data
                }
            }
            
            const fullName = (userData.fullName || '').toLowerCase();
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts[nameParts.length - 1] || '';
            
            if (fullName.includes(query) || firstName.includes(query) || lastName.includes(query)) {
                filtered.push(thread);
            }
        }
        
        setFilteredThreads(filtered);
    };

    useEffect(() => {
        // Calculate total unread count
        const user = auth.currentUser;
        if (!user) return;
        
        const total = threads.reduce((sum, thread) => {
            return sum + (thread.unreadCount?.[user.uid] || 0);
        }, 0);
        setUnreadCount(total);
    }, [threads]);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadThreads = async () => {
        setIsLoading(true);
        const user = auth.currentUser;
        if (!user) {
            setIsLoading(false);
            return;
        }

        const result = await getUserMessageThreads(user.uid);
        if (result.success) {
            setThreads(result.data);
            setFilteredThreads(result.data);
            
            // Pre-load user data for all threads to cache for search
            const cache = {};
            for (const thread of result.data) {
                const otherUserId = thread.guestId === user.uid ? thread.hostId : thread.guestId;
                if (!cache[otherUserId]) {
                    const userResult = await getUserData(otherUserId);
                    if (userResult.success) {
                        cache[otherUserId] = userResult.data;
                    }
                }
            }
            setUserDataCache(cache);

            if (initialThreadId && !hasAutoSelectedRef.current) {
                const targetThread = result.data.find(thread => thread.id === initialThreadId);
                if (targetThread) {
                    setSelectedThread(targetThread);
                    hasAutoSelectedRef.current = true;
                    onThreadDisplayed?.();
                }
            }
        }
        setIsLoading(false);
    };

    const loadMessages = async () => {
        if (!selectedThread) return;

        const user = auth.currentUser;
        if (!user) return;

        // Clean up previous listener
        if (unsubscribeMessagesRef.current) {
            unsubscribeMessagesRef.current();
        }

        // Set up real-time listener
        const messagesRef = collection(db, 'messages', selectedThread.id, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messagesList = [];
            snapshot.forEach((doc) => {
                messagesList.push({ id: doc.id, ...doc.data() });
            });
            setMessages(messagesList);
            
            // Mark thread as read
            markThreadAsRead(selectedThread.id, user.uid);
        }, (error) => {
            console.error('Error loading messages:', error);
        });

        unsubscribeMessagesRef.current = unsubscribe;
    };

    const loadOtherUserData = async () => {
        if (!selectedThread) return;
        
        const user = auth.currentUser;
        if (!user) return;

        const otherUserId = selectedThread.guestId === user.uid ? selectedThread.hostId : selectedThread.guestId;
        const result = await getUserData(otherUserId);
        if (result.success) {
            setOtherUserData(result.data);
        }
    };

    const loadListingData = async () => {
        if (!selectedThread?.listingId) return;
        
        const result = await getListing(selectedThread.listingId);
        if (result.success) {
            setListingData(result.data);
        }
    };

    const handleSelectThread = (threadId) => {
        const thread = threads.find(t => t.id === threadId);
        if (thread) {
            setSelectedThread(thread);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedThread) return;

        const user = auth.currentUser;
        if (!user) return;

        const senderName = user.displayName || otherUserData?.fullName || user.email?.split('@')[0] || 'Guest';
        
        const result = await sendMessage(
            selectedThread.id,
            user.uid,
            senderName,
            messageText.trim()
        );

        if (result.success) {
            setMessageText('');
            scrollToBottom();
        } else {
            alert('Failed to send message. Please try again.');
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else {
            date = new Date(timestamp);
        }

        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Loading messages...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col h-screen">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-20">
                <div className="px-4 py-4">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setPage('Home')} 
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold">Messages</h1>
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-sm font-bold rounded-full px-2.5 py-1 min-w-[24px] text-center">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Inbox Sidebar */}
                <div className="w-full md:w-96 border-r bg-white flex flex-col h-full">
                    {/* Search Bar */}
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name or surname..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setFilteredThreads(threads);
                                    }}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Inbox Title */}
                    <div className="px-4 py-3 border-b bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-800">Inbox</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {filteredThreads.length} {filteredThreads.length === 1 ? 'conversation' : 'conversations'}
                        </p>
                    </div>

                    {/* Threads List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredThreads.length === 0 ? (
                            <div className="text-center py-20 px-4">
                                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold mb-2">
                                    {searchQuery ? 'No matches found' : 'No messages yet'}
                                </h2>
                                <p className="text-gray-600">
                                    {searchQuery 
                                        ? 'Try a different search term' 
                                        : 'Your conversations will appear here'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {filteredThreads.map((thread) => {
                                    const otherUserId = thread.guestId === auth.currentUser?.uid ? thread.hostId : thread.guestId;
                                    const unreadCount = thread.unreadCount?.[auth.currentUser?.uid] || 0;
                                    
                                    return (
                                        <ThreadItem
                                            key={thread.id}
                                            thread={thread}
                                            otherUserId={otherUserId}
                                            unreadCount={unreadCount}
                                            onClick={() => handleSelectThread(thread.id)}
                                            isSelected={selectedThread?.id === thread.id}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Messages Area */}
                <div className="flex-1 flex flex-col bg-gray-50 border-t md:border-t-0 md:border-l">
                    {selectedThread ? (
                        <>
                            {/* Conversation Header */}
                            <div className="bg-white border-b px-4 py-4 flex items-center gap-3">
                                {otherUserData?.photoURL ? (
                                    <img 
                                        src={otherUserData.photoURL} 
                                        alt={otherUserData.fullName || 'User'} 
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center">
                                        <span className="text-white font-semibold">
                                            {otherUserData?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-lg font-bold">{otherUserData?.fullName || 'User'}</h2>
                                    <p className="text-sm text-gray-500 capitalize">
                                        {otherUserData?.role || 'User'}
                                    </p>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div 
                                ref={messagesContainerRef}
                                className="flex-1 overflow-y-auto p-4 space-y-4"
                            >
                                {messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">No messages yet. Start the conversation!</p>
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((message) => {
                                        const isOwn = message.senderId === auth.currentUser?.uid;
                                        return (
                                            <div
                                                key={message.id}
                                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                                                        isOwn
                                                            ? 'bg-teal-600 text-white'
                                                            : 'bg-white border border-gray-200 text-gray-900'
                                                    }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                                                    <p className={`text-xs mt-1 ${isOwn ? 'text-teal-100' : 'text-gray-500'}`}>
                                                        {formatTime(message.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="bg-white border-t p-4">
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Type your message here..."
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!messageText.trim()}
                                        className="bg-teal-600 text-white p-2.5 rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                        title="Send message"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center px-6">
                                <MessageCircle className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-gray-600 mb-2">Select a conversation</h2>
                                <p className="text-gray-500">Choose a conversation from the inbox to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ThreadItem = ({ thread, otherUserId, unreadCount, onClick, isSelected }) => {
    const [otherUserData, setOtherUserData] = useState(null);
    const [listingData, setListingData] = useState(null);

    useEffect(() => {
        loadData();
    }, [otherUserId, thread.listingId]);

    const loadData = async () => {
        const userResult = await getUserData(otherUserId);
        if (userResult.success) {
            setOtherUserData(userResult.data);
        }
        
        if (thread.listingId) {
            const listingResult = await getListing(thread.listingId);
            if (listingResult.success) {
                setListingData(listingResult.data);
            }
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else {
            date = new Date(timestamp);
        }

        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    };

    return (
        <div
            onClick={onClick}
            className={`p-4 cursor-pointer transition-colors ${
                isSelected
                    ? 'bg-teal-600 text-white'
                    : unreadCount > 0
                        ? 'bg-teal-50 hover:bg-teal-100'
                        : 'hover:bg-gray-50'
            }`}
        >
            <div className="flex items-start gap-3">
                {otherUserData?.photoURL ? (
                    <img 
                        src={otherUserData.photoURL} 
                        alt={otherUserData.fullName || 'User'} 
                        className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
                    />
                ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-white text-teal-600' : 'bg-teal-600 text-white'
                    }`}>
                        <span className="font-semibold">
                            {otherUserData?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                            {otherUserData?.fullName || 'User'}
                        </h3>
                        {thread.lastMessage?.timestamp && (
                            <span className={`text-xs flex-shrink-0 ml-2 ${isSelected ? 'text-teal-100' : 'text-gray-500'}`}>
                                {formatTime(thread.lastMessage.timestamp)}
                            </span>
                        )}
                    </div>
                    <p className={`text-xs mb-1 capitalize ${isSelected ? 'text-teal-100' : 'text-gray-500'}`}>
                        {otherUserData?.role || 'User'}
                    </p>
                    {listingData && (
                        <p className={`text-sm mb-1 truncate ${isSelected ? 'text-teal-50' : 'text-gray-500'}`}>{listingData.title}</p>
                    )}
                    <p className={`text-sm truncate ${
                        unreadCount > 0 && !isSelected
                            ? 'font-semibold text-gray-900'
                            : isSelected
                                ? 'text-teal-50'
                                : 'text-gray-600'
                    }`}>
                        {thread.lastMessage?.text || 'No messages yet'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <div className="flex-shrink-0">
                        <span className={`text-xs font-bold rounded-full px-2 py-1 min-w-[20px] text-center inline-block ${
                            isSelected ? 'bg-white text-teal-600' : 'bg-red-500 text-white'
                        }`}>
                            {unreadCount}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
