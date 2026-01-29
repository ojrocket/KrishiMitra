// Floating Chatbot Functionality

function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    const chatToggleBtn = document.getElementById('chatToggleBtn');

    if (chatWindow.style.display === 'none' || chatWindow.style.display === '') {
        chatWindow.style.display = 'flex';
        chatToggleBtn.innerHTML = '<i class="fas fa-times"></i>';
        // Focus input
        setTimeout(() => document.getElementById('chatInput').focus(), 100);
    } else {
        chatWindow.style.display = 'none';
        chatToggleBtn.innerHTML = '<i class="fas fa-comment-dots"></i>';
    }
}

function handleChatInput(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // Clear input
    input.value = '';

    // Add user message
    addChatMessage(message, 'user');

    // Show typing indicator
    const typingId = showTypingIndicator();

    // Call Backend
    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: message })
    })
        .then(response => response.json())
        .then(data => {
            removeChatMessage(typingId);
            addChatMessage(data.response, 'bot');
        })
        .catch(error => {
            console.error('Error:', error);
            removeChatMessage(typingId);
            addChatMessage("Sorry, I'm having trouble connecting to the server.", 'bot');
        });
}

function addChatMessage(text, sender) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;

    // Format links if any (simple)
    // text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');

    messageDiv.innerHTML = `<span>${text}</span>`;

    if (settings && sender === 'bot') {
        // Could add timestamp or icon here
    }

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return messageDiv.id = 'msg-' + Date.now();
}

function showTypingIndicator() {
    const messagesDiv = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot-message typing';
    typingDiv.innerHTML = '<span><i class="fas fa-ellipsis-h fa-beat"></i></span>';
    typingDiv.id = 'typing-' + Date.now();
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return typingDiv.id;
}

function removeChatMessage(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}
