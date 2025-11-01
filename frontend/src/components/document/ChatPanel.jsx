import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { sendChatMessageApi, getChatHistoryApi } from '../../features/documents/api'

export default function ChatPanel() {
  const { id } = useParams()
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const messagesEndRef = useRef(null)

  // Load chat history on mount
  useEffect(() => {
    if (!id) return
    let isMounted = true
    ;(async () => {
      try {
        setLoadingHistory(true)
        const history = await getChatHistoryApi(id)
        if (isMounted && history.messages) {
          // Reverse to show oldest first
          setMessages([...history.messages].reverse())
        }
      } catch (e) {
        console.error('Failed to load chat history:', e)
        if (isMounted) {
          setMessages([])
        }
      } finally {
        if (isMounted) {
          setLoadingHistory(false)
        }
      }
    })()
    return () => { isMounted = false }
  }, [id])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendChat = async () => {
    if (!chatInput.trim() || !id || loading) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setLoading(true)

    // Add user message optimistically
    const userMsg = {
      message: userMessage,
      response: null,
      created_at: new Date().toISOString(),
      id: `temp-${Date.now()}`
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const response = await sendChatMessageApi(id, userMessage)
      
      // Replace temp message with actual message record (which contains both user message and AI response)
      setMessages(prev => {
        const updated = prev.filter(m => m.id !== userMsg.id)
        return [
          ...updated,
          {
            id: response.message_id,
            document_id: parseInt(id),
            user_id: 0, // Will be set from backend
            message: userMessage,
            response: response.response,
            created_at: new Date().toISOString()
          }
        ]
      })
    } catch (e) {
      console.error('Failed to send message:', e)
      // Remove failed message and show error
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
      const errorMsg = {
        role: 'assistant',
        message: null,
        response: `Error: ${e?.response?.data?.detail || e.message || 'Failed to send message'}`,
        created_at: new Date().toISOString(),
        id: `error-${Date.now()}`
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp)
      
      // Format date as "Nov/1/2025"
      const month = date.toLocaleDateString([], { month: 'short' })
      const day = date.getDate()
      const year = date.getFullYear()
      const dateStr = `${month}/${day}/${year}`
      
      // Format time as "01:37 PM"
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      
      return `${dateStr} ${timeStr}`
    } catch {
      return ''
    }
  }

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-[78vh]">
      <div className="sticky top-0 z-10 bg-white p-4 border-b">
        <h3 className="text-sm font-semibold text-gray-700">Chat Interface</h3>
        <p className="text-xs text-gray-500 mt-1">Ask questions about this document</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-gray-500">Loading chat history...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">No messages yet</div>
              <div className="text-xs text-gray-400">
                Ask questions like:<br />
                "What is the total amount?"<br />
                "List all line items"<br />
                "What is the vendor name?"
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            // Each message record contains both user message and AI response
            const userMessage = msg.message || msg.text || ''
            const aiResponse = msg.response || ''
            
            return (
              <div key={msg.id || idx} className="space-y-2">
                {/* User Message */}
                {userMessage && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%]">
                      <div className="bg-blue-600 text-white px-4 py-2 rounded-lg rounded-tr-none shadow-sm">
                        <div className="text-sm whitespace-pre-wrap wrap-break-words">{userMessage}</div>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 text-right pr-1">
                        {formatTimestamp(msg.created_at)}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* AI Response */}
                {aiResponse && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%]">
                      <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg rounded-tl-none shadow-sm">
                        <div className="text-sm text-gray-800 whitespace-pre-wrap wrap-break-words">
                          {aiResponse}
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 pl-1">
                        {formatTimestamp(msg.created_at)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Thinking...
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 z-10 bg-white p-4 border-t">
        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendChat()
              }
            }}
            disabled={loading}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Ask a question about this document..."
          />
          <button
            onClick={sendChat}
            disabled={loading || !chatInput.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
