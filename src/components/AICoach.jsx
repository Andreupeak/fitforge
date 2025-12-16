import { useState, useRef, useEffect } from 'react';

function AICoach() {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hey! 👋 I'm your AI Fitness Coach. Ask me anything about:\n\n• Exercise form & technique\n• Workout modifications\n• Nutrition for muscle building\n• Recovery tips\n• Flexibility exercises\n• Posture improvement\n\nHow can I help you today?"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            // Build conversation history (last 10 messages for context)
            const conversationHistory = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await fetch('/api/coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    conversationHistory
                })
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response
            }]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Sorry, I'm having trouble connecting right now. Please try again in a moment."
            }]);
        } finally {
            setLoading(false);
        }
    };

    const quickQuestions = [
        "How do I do a proper push-up?",
        "What should I eat to gain muscle?",
        "How long should I rest between sets?",
        "Stretches for better posture?"
    ];

    return (
        <div className="page" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{ padding: '20px 20px 12px', paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
                <h1 className="page-title">AI Coach</h1>
                <p className="page-subtitle">Your personal fitness advisor</p>
            </div>

            {/* Chat Container */}
            <div className="chat-container" style={{ flex: 1 }}>
                {/* Messages */}
                <div className="chat-messages">
                    {messages.map((message, i) => (
                        <div
                            key={i}
                            className={`chat-message ${message.role}`}
                        >
                            {message.content.split('\n').map((line, j) => (
                                <span key={j}>
                                    {line}
                                    {j < message.content.split('\n').length - 1 && <br />}
                                </span>
                            ))}
                        </div>
                    ))}

                    {loading && (
                        <div className="chat-message assistant">
                            <div style={{ display: 'flex', gap: 4 }}>
                                <span className="typing-dot">●</span>
                                <span className="typing-dot" style={{ animationDelay: '0.2s' }}>●</span>
                                <span className="typing-dot" style={{ animationDelay: '0.4s' }}>●</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Questions (only show if few messages) */}
                {messages.length <= 2 && (
                    <div style={{ padding: '0 16px 12px' }}>
                        <p className="text-muted" style={{ fontSize: 12, marginBottom: 8 }}>Quick questions:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {quickQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    className="chip"
                                    onClick={() => {
                                        setInput(q);
                                        setTimeout(() => sendMessage(), 100);
                                    }}
                                    style={{ fontSize: 12 }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="chat-input-container">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Ask your coach..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && sendMessage()}
                        disabled={loading}
                    />
                    <button
                        className="chat-send-btn"
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                    >
                        ↑
                    </button>
                </div>
            </div>

            <style>{`
        .typing-dot {
          animation: blink 1s infinite;
          color: var(--text-muted);
        }
        
        @keyframes blink {
          0%, 50% { opacity: 0.3; }
          25% { opacity: 1; }
        }
      `}</style>
        </div>
    );
}

export default AICoach;
