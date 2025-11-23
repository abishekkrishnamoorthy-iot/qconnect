import React from 'react'
import Header from '../components/common/Header'
import '../style/chat/chat.css'

const ChatPage = () => {
  return (
    <div className="chat-page">
      <Header />
      <main className="chat-shell">
        <section className="chat-card">
          <h1>Chat</h1>
          <p>Chat experience coming soon.</p>
        </section>
      </main>
    </div>
  )
}

export default ChatPage

