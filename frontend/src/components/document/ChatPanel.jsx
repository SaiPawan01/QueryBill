import React, { useState } from 'react'

function answerQuestion(q, data) {
  const text = (q || '').toLowerCase();
  if (!data) return "I don't have data yet.";
  if (text.includes('total')) return `Total amount is ${data.total_amount ?? 'unknown'}.`;
  if (text.includes('vendor')) return `Vendor is ${data.vendor_name ?? 'unknown'}.`;
  if (text.includes('date')) return `Transaction date is ${data.transaction_date ?? 'unknown'}.`;
  if (text.includes('line items') || text.includes('items')) {
    const items = Array.isArray(data.line_items) ? data.line_items : [];
    if (items.length === 0) return 'No line items found.';
    return items.map((li, i) => `${i + 1}. ${li?.description ?? 'N/A'} - ${li?.amount ?? 'N/A'}`).join('\n');
  }
  return 'I can answer questions about totals, vendor, date, and line items.';
}

export default function ChatPanel({ data }) {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', text: chatInput, at: new Date().toISOString() };
    const aiMsg = { role: 'assistant', text: answerQuestion(chatInput, data), at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setChatInput('');
  };

  return (
    <div className="col-span-12 lg:col-span-4 bg-white rounded-lg shadow p-3 flex flex-col h-[78vh]">
      <div className="text-sm text-gray-600 mb-2">Ask about this document</div>
      <div className="flex-1 overflow-auto border rounded p-2 space-y-2 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-xs text-gray-500">Ask questions like "What is the total amount?" or "List line items".</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
              <div className={m.role === 'user' ? 'inline-block bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm' : 'inline-block bg-white border px-3 py-1.5 rounded-md text-sm'}>
                {m.text}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{new Date(m.at).toLocaleTimeString()}</div>
            </div>
          ))
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendChat() }} className="flex-1 border rounded px-3 py-2 text-sm" placeholder="Ask a question..." />
        <button onClick={sendChat} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">Send</button>
      </div>
    </div>
  )
}


