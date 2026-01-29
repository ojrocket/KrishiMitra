// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', function () {
    // Initialize the application
    initializeApp();
});

function initializeApp() {
    // Set up event listeners
    setupEventListeners();

    // Initialize language selector
    initializeLanguageSelector();

    // Show welcome message
    showWelcomeMessage();
}

function setupEventListeners() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Language selector change event
    document.getElementById('languageSelect').addEventListener('change', function () {
        changeLanguage(this.value);
    });
}

function initializeLanguageSelector() {
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    document.getElementById('languageSelect').value = savedLanguage;
    changeLanguage(savedLanguage);
}

function changeLanguage(languageCode) {
    localStorage.setItem('selectedLanguage', languageCode);

    // Update UI text based on selected language
    const translations = {
        'en': {
            greeting: "Hello! I'm your AI farming assistant. How can I help you today?",
            voiceStatus: "Ready to help you"
        },
        'hi': {
            greeting: "नमस्ते! मैं आपका AI कृषि सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?",
            voiceStatus: "आपकी सहायता के लिए तैयार"
        },
        'pa': {
            greeting: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ AI ਖੇਤੀਬਾੜੀ ਸਹਾਇਕ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
            voiceStatus: "ਤੁਹਾਡੀ ਮਦਦ ਲਈ ਤਿਆਰ"
        },
        'te': {
            greeting: "నమస్కారం! నేను మీ AI వ్యవసాయ సహాయకుడను. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?",
            voiceStatus: "మీకు సహాయం చేయడానికి సిద్ధం"
        },
        'ta': {
            greeting: "வணக்கம்! நான் உங்கள் AI விவசாய உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
            voiceStatus: "உங்களுக்கு உதவ தயார்"
        }
    };

    const translation = translations[languageCode] || translations['en'];

    // Update greeting message
    const greetingElement = document.querySelector('.ai-message span');
    if (greetingElement) {
        greetingElement.textContent = translation.greeting;
    }

    // Update voice status
    const statusElement = document.getElementById('voiceStatus');
    if (statusElement) {
        statusElement.textContent = translation.voiceStatus;
    }
}

function showWelcomeMessage() {
    // Animate the hero section
    const heroContent = document.querySelector('.hero-content');
    heroContent.style.opacity = '0';
    heroContent.style.transform = 'translateY(50px)';

    setTimeout(() => {
        heroContent.style.transition = 'all 1s ease';
        heroContent.style.opacity = '1';
        heroContent.style.transform = 'translateY(0)';
    }, 100);
}

function scrollToFeatures() {
    document.getElementById('features').scrollIntoView({
        behavior: 'smooth'
    });
}

function startVoiceCall() {
    // This will be handled by voice-call.js
    toggleVoiceCall();
}

// Utility functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `

/* Chatbot Widget Styles */
.chatbot-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.chat-toggle-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4CAF50, #2E7D32);
    color: white;
    border: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    cursor: pointer;
    font-size: 24px;
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    align-items: center;
    justify-content: center;
}

.chat-toggle-btn:hover {
    transform: scale(1.1);
}

.chat-window {
    position: absolute;
    bottom: 80px;
    right: 0;
    width: 350px;
    height: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 5px 25px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform-origin: bottom right;
    animation: activeFromBottom 0.3s ease-out;
    border: 1px solid #e0e0e0;
}

@keyframes activeFromBottom {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
}

.chat-header {
    background: #4CAF50;
    color: white;
    padding: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: bold;
}

.chat-messages {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
    background: #f9f9f9;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.chat-message {
    max-width: 80%;
    padding: 10px 15px;
    border-radius: 15px;
    font-size: 14px;
    line-height: 1.4;
    word-wrap: break-word;
}

.bot-message {
    background: white;
    color: #333;
    align-self: flex-start;
    border-bottom-left-radius: 2px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    border: 1px solid #eee;
}

.user-message {
    background: #4CAF50;
    color: white;
    align-self: flex-end;
    border-bottom-right-radius: 2px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.chat-input-area {
    padding: 10px;
    background: white;
    border-top: 1px solid #eee;
    display: flex;
    gap: 10px;
}

.chat-input-area input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 20px;
    outline: none;
    font-size: 14px;
}

.chat-input-area input:focus {
    border-color: #4CAF50;
}

.chat-send-btn {
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    transition: background 0.2s;
}

.chat-send-btn:hover {
    background: #45a049;
}

.typing span {
    color: #888;
}

/* Responsive adjustment */
@media (max-width: 480px) {
    .chat-window {
        width: 300px;
        height: 400px;
    }
}
`;
document.head.appendChild(style);
