'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { auth } from '@/lib/auth';
import Header from '@/components/Header';
import { listChatSessions, createChatSession, getChatHistory, sendChatMessage } from '@/lib/chat.api';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!auth.isAuthenticated()) { router.push('/auth/login'); return; }
    loadSessions();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const loadSessions = async () => {
    try {
      const data = await listChatSessions();
      setSessions(data);
    } catch { /* silent */ }
  };

  const selectSession = async (sessionId) => {
    if (streaming) return;
    setActiveSessionId(sessionId);
    setMessages([]);
    setLoadingHistory(true);
    try {
      const history = await getChatHistory(sessionId);
      setMessages(history.map((m) => ({ id: m.id, role: m.role, content: m.content, isPartial: m.isPartial })));
    } catch {
      toast.error('Failed to load conversation');
    } finally {
      setLoadingHistory(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const startNewChat = () => {
    if (streaming) return;
    setActiveSessionId(null);
    setMessages([]);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleStop = () => {
    if (abortRef.current) { abortRef.current(); abortRef.current = null; }
    setStreaming(false);
    setMessages((prev) => prev.map((m) => m.streaming ? { ...m, streaming: false, isPartial: true } : m));
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming) return;

    const userContent = input.trim();
    setInput('');
    setStreaming(true);

    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const { sessionId: newId } = await createChatSession();
        sessionId = newId;
        setActiveSessionId(newId);
      } catch {
        toast.error('Failed to start session');
        setStreaming(false);
        return;
      }
    }

    const userMsgId = `user-${Date.now()}`;
    const assistantId = `assistant-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: userContent },
      { id: assistantId, role: 'assistant', content: '', streaming: true },
    ]);

    const abort = sendChatMessage(sessionId, userContent, {
      onChunk: (chunk) => {
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: m.content + chunk } : m));
      },
      onDone: () => {
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m));
        setStreaming(false);
        abortRef.current = null;
        loadSessions();
        setTimeout(() => textareaRef.current?.focus(), 50);
      },
      onError: (message) => {
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: m.content || message, streaming: false, isError: true } : m)
        );
        setStreaming(false);
        abortRef.current = null;
        if (message !== 'Stream interrupted') toast.error(message || 'Response interrupted');
        setTimeout(() => textareaRef.current?.focus(), 50);
      },
    });

    abortRef.current = abort;
  }, [input, streaming, activeSessionId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const diffDays = Math.floor((new Date() - d) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="h-screen bg-linear-to-br from-gray-900 via-gray-800 to-black flex flex-col overflow-hidden">
      <Header />

      {/* Below header: sidebar + chat side by side, fills remaining height */}
      <div className="flex overflow-hidden flex-1" style={{ height: 'calc(100vh - 64px)' }}>

        {/* Sidebar */}
        <div className={`flex flex-col bg-gray-900/80 border-r border-white/10 transition-all duration-300 flex-shrink-0 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
          <div className="p-3 border-b border-white/10 flex-shrink-0">
            <button
              onClick={startNewChat}
              disabled={streaming}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-white/10 hover:bg-white/15 transition-all disabled:opacity-50 border border-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
            {sessions.length === 0 ? (
              <p className="text-xs text-gray-600 text-center mt-6 px-3">No conversations yet</p>
            ) : (
              <div className="space-y-0.5">
                <p className="text-xs text-gray-500 px-2 pb-1 font-medium uppercase tracking-wide">Recent</p>
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectSession(s.id)}
                    disabled={streaming}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 ${
                      activeSessionId === s.id
                        ? 'bg-white/15 text-white'
                        : 'text-gray-400 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-medium leading-snug">{s.title || 'New conversation'}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">{formatDate(s.updatedAt)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Chat top bar */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 flex-shrink-0 bg-gray-900/40">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-medium text-white">
              {activeSessionId
                ? (sessions.find((s) => s.id === activeSessionId)?.title || 'Conversation')
                : 'New Chat'}
            </span>
            <span className="text-xs text-gray-500 bg-white/8 px-2 py-0.5 rounded-full ml-auto">Gemini</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-3 text-gray-500">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm">Loading conversation...</span>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 pb-16">
                <div className="h-14 w-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-5">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">How can I help you?</h2>
                <p className="text-gray-500 text-sm max-w-sm">Ask me anything. I&apos;ll respond in real time, token by token.</p>
                <div className="grid grid-cols-2 gap-3 mt-8 max-w-lg w-full">
                  {['Explain microservices architecture', 'Write a TypeScript utility function', 'Debug my code', 'Suggest best practices'].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => { setInput(prompt); setTimeout(() => textareaRef.current?.focus(), 50); }}
                      className="text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-300 hover:text-white transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="max-w-[78%]">
                      {msg.role === 'user' ? (
                        <div className="bg-white/10 border border-white/10 px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-gray-100 leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      ) : (
                        <div className={`text-sm leading-relaxed ${msg.isError ? 'text-red-400' : 'text-gray-100'} ${msg.isPartial && !msg.streaming ? 'opacity-70' : ''}`}>
                          <div className="prose prose-invert prose-sm max-w-none
                            prose-p:my-1 prose-p:leading-relaxed
                            prose-headings:text-white prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1
                            prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                            prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5
                            prose-strong:text-white prose-em:text-gray-300
                            prose-blockquote:border-indigo-500 prose-blockquote:text-gray-400 prose-blockquote:my-2
                            prose-hr:border-white/10
                            prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
                            prose-code:text-indigo-300 prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
                            prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:my-2 prose-pre:p-0
                            prose-table:text-xs prose-th:text-gray-300 prose-td:text-gray-400
                          ">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                              components={{
                                pre: ({ children }) => (
                                  <pre className="overflow-x-auto p-3 text-xs">{children}</pre>
                                ),
                                table: ({ children }) => (
                                  <div className="overflow-x-auto">
                                    <table className="border-collapse w-full">{children}</table>
                                  </div>
                                ),
                                th: ({ children }) => (
                                  <th className="border border-white/20 px-3 py-1.5 bg-white/5 text-left">{children}</th>
                                ),
                                td: ({ children }) => (
                                  <td className="border border-white/10 px-3 py-1.5">{children}</td>
                                ),
                                a: ({ href, children }) => (
                                  <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                                ),
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                          {msg.streaming && <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-middle" />}
                          {msg.isPartial && !msg.streaming && <span className="text-xs text-gray-600 ml-2">(interrupted)</span>}
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="h-8 w-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 px-4 pb-5 pt-2 max-w-3xl mx-auto w-full">
            {streaming && (
              <div className="flex justify-center mb-3">
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-sm text-gray-300 hover:text-white transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                  Stop generating
                </button>
              </div>
            )}
            <div className="relative bg-white/5 border border-white/15 rounded-2xl focus-within:border-white/30 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message AI Assistant… (Enter to send, Shift+Enter for new line)"
                rows={1}
                disabled={streaming}
                className="w-full bg-transparent text-white placeholder-gray-600 resize-none focus:outline-none text-sm leading-relaxed px-4 pt-3.5 pb-12 disabled:opacity-40"
                style={{ minHeight: '52px', maxHeight: '160px' }}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span className="text-xs text-gray-600 select-none">{input.length > 0 ? input.length : 'Enter ↵'}</span>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || streaming}
                  className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-center text-[11px] text-gray-700 mt-2">AI can make mistakes. Verify important information.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
