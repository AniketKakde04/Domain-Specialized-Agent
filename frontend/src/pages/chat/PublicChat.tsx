import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles, Mic, X } from 'lucide-react';
import { api } from '@/services/api';
import { useVoice } from '@/contexts/VoiceContext';

interface Message {
    role: 'user' | 'bot';
    content: string;
}

export const PublicChat = () => {
    const { shareId } = useParams<{ shareId: string }>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [botName, setBotName] = useState('AI Assistant');
    const [botId, setBotId] = useState<string | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [imageBase64, setImageBase64] = useState<string | null>(null);

    const { connect, isConnecting: isVoiceConnecting } = useVoice();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!shareId) return;
        api.getPublicBot(shareId)
            .then(data => {
                setBotName(data.name);
                setBotId(data.id);
                setInitialLoading(false);
            })
            .catch(() => {
                setNotFound(true);
                setInitialLoading(false);
            });
    }, [shareId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        const trimmed = input.trim();
        if ((!trimmed && !imageBase64) || isLoading || !shareId) return;

        let uiContent = trimmed || "Sent an image";
        if (imageBase64) {
            uiContent += "\n[Image Attached]";
        }

        setMessages(prev => [...prev, { role: 'user', content: uiContent }]);
        setInput('');
        const payloadImage = imageBase64;
        setImageBase64(null);
        setIsLoading(true);

        try {
            const data = await api.sendPublicMessage(shareId, trimmed, payloadImage || undefined);
            setMessages(prev => [...prev, { role: 'bot', content: data.answer || 'No response.' }]);
        } catch {
            setMessages(prev => [...prev, { role: 'bot', content: '⚠️ Something went wrong. Please try again.' }]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setImageBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-slate-600" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Bot Not Found</h1>
                <p className="text-slate-400 max-w-sm">This bot doesn't exist or is no longer publicly available.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-950 font-sans">
            {/* Header */}
            <div className="h-16 border-b border-slate-800 flex items-center justify-center px-6 bg-slate-900/80 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-base font-bold text-white">{botName}</h1>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center mb-6">
                                <Sparkles className="w-10 h-10 text-indigo-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Chat with {botName}</h2>
                            <p className="text-slate-400 max-w-sm text-sm">Send a message to start the conversation.</p>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'bot' && (
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-md'
                                        : 'bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-bl-md'
                                        }`}>
                                        {msg.content}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                                            <User className="w-4 h-4 text-slate-300" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}

                    {isLoading && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-bl-md px-5 py-4">
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="border-t border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 py-4 shrink-0">
                <div className="max-w-3xl mx-auto">
                    {imageBase64 && (
                        <div className="mb-2 relative inline-block">
                            <img src={imageBase64} alt="Upload preview" className="h-20 w-auto rounded-lg border border-slate-700 object-cover" />
                            <button onClick={() => setImageBase64(null)} className="absolute -top-2 -right-2 bg-slate-800 border border-slate-700 rounded-full p-1 text-slate-400 hover:text-white">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                    <div className="flex gap-3 items-end">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message or upload soil health card..."
                            rows={1}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none min-h-[44px] max-h-[120px]"
                            style={{ height: 'auto', overflow: 'hidden' }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                            }}
                        />
                        <label className="h-[44px] w-[44px] flex items-center justify-center bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer" title="Attach Image">
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        </label>
                        <button
                            onClick={() => botId && connect(botId)}
                            disabled={isVoiceConnecting || isLoading || !botId}
                            className="h-[44px] w-[44px] flex items-center justify-center bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all disabled:opacity-50"
                            title="Start Voice Chat"
                        >
                            <Mic className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={!(input.trim() || imageBase64) || isLoading}
                            className="h-[44px] px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
                <p className="text-center mt-3 text-xs text-slate-600">
                    Powered by <span className="text-indigo-400 font-semibold">BotCraft</span>
                </p>
            </div>
        </div>
    );
};
