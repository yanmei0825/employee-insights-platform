import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getSession, sendMessageStream } from '../api/survey';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const PLACEHOLDERS: Record<string, string> = {
  ru: 'Напишите ответ...',
  en: 'Type your answer...',
  tr: 'Cevabınızı yazın...',
};

const SEND_LABELS: Record<string, string> = {
  ru: 'Отправить',
  en: 'Send',
  tr: 'Gönder',
};

export default function InterviewPage() {
  const { token } = useParams<{ token: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    getSession(token).then((s) => {
      setLanguage(s.language || 'en');
      setProgress(s.progress);
      if (s.status === 'completed') setComplete(true);
    });
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading || !token) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    let assistantContent = '';
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    await sendMessageStream(
      token,
      userMsg,
      (chunk) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
          return updated;
        });
      },
      async () => {
        setLoading(false);
        const s = await getSession(token);
        setProgress(s.progress);
        if (s.status === 'completed') setComplete(true);
      }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (complete) {
    const msgs: Record<string, string> = {
      ru: 'Интервью завершено. Спасибо за честные ответы.',
      en: 'Interview complete. Thank you for your honest answers.',
      tr: 'Görüşme tamamlandı. Dürüst cevaplarınız için teşekkürler.',
    };
    return (
      <div style={styles.center}>
        <p style={styles.completeText}>{msgs[language] ?? msgs.en}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      <div style={styles.messages}>
        {messages.map((m, i) => (
          <div key={i} style={m.role === 'user' ? styles.userBubble : styles.botBubble}>
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputRow}>
        <textarea
          style={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDERS[language] ?? PLACEHOLDERS.en}
          disabled={loading}
          rows={2}
          maxLength={1200}
        />
        <button style={styles.sendBtn} onClick={handleSend} disabled={loading || !input.trim()}>
          {SEND_LABELS[language] ?? SEND_LABELS.en}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 680, margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  progressBar: { height: 4, background: '#e5e7eb' },
  progressFill: { height: '100%', background: '#6366f1', transition: 'width 0.4s' },
  messages: { flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 12 },
  userBubble: { alignSelf: 'flex-end', background: '#6366f1', color: '#fff', padding: '10px 14px', borderRadius: '16px 16px 4px 16px', maxWidth: '75%', lineHeight: 1.5 },
  botBubble: { alignSelf: 'flex-start', background: '#f3f4f6', color: '#111', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', maxWidth: '75%', lineHeight: 1.5 },
  inputRow: { display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid #e5e7eb' },
  textarea: { flex: 1, resize: 'none', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px', fontSize: 15, outline: 'none' },
  sendBtn: { padding: '0 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  completeText: { fontSize: 18, color: '#374151', textAlign: 'center' },
};
