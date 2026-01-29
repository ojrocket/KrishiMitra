// Voice call functionality
let isVoiceActive = false;
let recognition = null;
let synthesis = null;
let currentLanguage = 'te';
let selectedVoice = null;

// Initialize speech recognition and synthesis
function initializeVoiceFeatures() {
    // Check for browser support
    if ('speechRecognition' in window || 'webkitSpeechRecognition' in window) {
        recognition = new (window.speechRecognition || window.webkitSpeechRecognition)();
        setupSpeechRecognition();
    }

    if ('speechSynthesis' in window) {
        synthesis = window.speechSynthesis;
    }

    // Get current language
    currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
}

function setupSpeechRecognition() {
    recognition.continuous = false;
    recognition.interimResults = false;

    // Set language based on selection
    const languageMap = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'pa': 'pa-IN',
        'te': 'te-IN',
        'ta': 'ta-IN'
    };

    recognition.lang = languageMap[currentLanguage] || 'en-US';

    recognition.onstart = function () {
        updateVoiceStatus('Listening...', 'listening');
        document.getElementById('voiceBtn').innerHTML = '<i class="fas fa-stop"></i><span>Stop Listening</span>';
    };

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        addMessageToConversation(transcript, 'user');
        processVoiceQuery(transcript);
    };

    recognition.onerror = function (event) {
        console.error('Speech recognition error:', event.error);
        updateVoiceStatus('Error occurred. Please try again.', 'error');
        resetVoiceButton();
    };

    recognition.onend = function () {
        resetVoiceButton();
    };
}

function toggleVoiceCall() {
    if (recognition) {
        initializeVoiceFeatures();
    }

    if (!isVoiceActive) {
        startListening();
    } else {
        stopListening();
    }
}

function startListening() {
    if (recognition) {
        isVoiceActive = true;
        recognition.start();
    } else {
        showNotification('Voice recognition not supported in this browser', 'error');
    }
}

function stopListening() {
    if (recognition && isVoiceActive) {
        recognition.stop();
        isVoiceActive = false;
        resetVoiceButton();
    }
}

function resetVoiceButton() {
    isVoiceActive = false;
    document.getElementById('voiceBtn').innerHTML = '<i class="fas fa-microphone"></i><span>Click to Talk</span>';
    updateVoiceStatus('Ready to help you', 'ready');
}

function updateVoiceStatus(message, status) {
    const statusElement = document.getElementById('voiceStatus');
    statusElement.textContent = message;
    statusElement.className = `voice-status ${status}`;
}

function addMessageToConversation(message, sender) {
    const conversationDisplay = document.getElementById('conversationDisplay');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const icon = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
    messageDiv.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;

    conversationDisplay.appendChild(messageDiv);
    conversationDisplay.scrollTop = conversationDisplay.scrollHeight;
}

function processVoiceQuery(query) {
    // Show processing status
    updateVoiceStatus('Processing your query...', 'processing');

    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query })
    })
        .then(response => response.json())
        .then(data => {
            const responseText = data.response;
            addMessageToConversation(responseText, 'ai');
            speakResponse(responseText);
            updateVoiceStatus('Ready to help you', 'ready');
        })
        .catch(error => {
            console.error('Error:', error);
            updateVoiceStatus('Error connecting to AI', 'error');
            const errorMsg = "Sorry, I'm having trouble connecting to the server.";
            addMessageToConversation(errorMsg, 'ai');
            speakResponse(errorMsg);
        });
}

// generateAIResponse is no longer needed as logic is moved to backend, 
// but keeping empty or removing it.
function generateAIResponse(query) {
    return "";
}


function getLocalizedResponse(category) {
    const responses = {
        'en': {
            disease: "I can help you identify plant diseases. Please upload an image of the affected plant, and I'll analyze it for you. Common signs include yellowing leaves, spots, or wilting.",
            growth: "For better crop growth, ensure proper soil nutrition with NPK fertilizers, maintain adequate watering, and consider crop rotation. What specific crop are you growing?",
            weather: "Weather plays a crucial role in farming. Check local forecasts for rainfall and plan irrigation accordingly. Avoid spraying during windy or rainy conditions.",
            general: "I'm here to help with all your farming needs. You can ask me about diseases, crop growth, weather advice, or upload plant images for analysis.",
            default: "I understand you need farming advice. Could you please be more specific about your question? I can help with diseases, crop growth, or general farming practices."
        },
        'hi': {
            disease: "मैं पौधों की बीमारियों की पहचान में आपकी मदद कर सकता हूं। कृपया प्रभावित पौधे की तस्वीर अपलोड करें, और मैं इसका विश्लेषण करूंगा।",
            growth: "बेहतर फसल के लिए, NPK उर्वरकों के साथ मिट्टी का पोषण सुनिश्चित करें, पर्याप्त पानी बनाए रखें, और फसल चक्र पर विचार करें।",
            weather: "मौसम खेती में महत्वपूर्ण भूमिका निभाता है। बारिश के लिए स्थानीय पूर्वानुमान देखें और सिंचाई की योजना बनाएं।",
            general: "मैं आपकी सभी खेती की जरूरतों में मदद के लिए यहां हूं। आप मुझसे बीमारियों, फसल की वृद्धि, या मौसम की सलाह के बारे में पूछ सकते हैं।",
            default: "मैं समझता हूं कि आपको खेती की सलाह चाहिए। कृपया अपने प्रश्न के बारे में अधिक स्पष्ट हों।"
        },
        'pa': {
            disease: "ਮੈਂ ਪੌਦਿਆਂ ਦੀਆਂ ਬਿਮਾਰੀਆਂ ਦੀ ਪਛਾਣ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਪ੍ਰਭਾਵਿਤ ਪੌਦੇ ਦੀ ਤਸਵੀਰ ਅੱਪਲੋਡ ਕਰੋ।",
            growth: "ਬਿਹਤਰ ਫਸਲ ਲਈ, NPK ਖਾਦਾਂ ਨਾਲ ਮਿੱਟੀ ਦਾ ਪੋਸ਼ਣ ਯਕੀਨੀ ਬਣਾਓ, ਢੁਕਵਾਂ ਪਾਣੀ ਬਣਾਈ ਰੱਖੋ।",
            weather: "ਮੌਸਮ ਖੇਤੀਬਾੜੀ ਵਿੱਚ ਮਹੱਤਵਪੂਰਨ ਭੂਮਿਕਾ ਨਿਭਾਉਂਦਾ ਹੈ। ਬਰਸਾਤ ਲਈ ਸਥਾਨਕ ਪੂਰਵ-ਅਨੁਮਾਨ ਦੇਖੋ।",
            general: "ਮੈਂ ਤੁਹਾਡੀਆਂ ਸਾਰੀਆਂ ਖੇਤੀਬਾੜੀ ਦੀਆਂ ਲੋੜਾਂ ਵਿੱਚ ਮਦਦ ਲਈ ਇੱਥੇ ਹਾਂ।",
            default: "ਮੈਂ ਸਮਝਦਾ ਹਾਂ ਕਿ ਤੁਹਾਨੂੰ ਖੇਤੀਬਾੜੀ ਦੀ ਸਲਾਹ ਚਾਹੀਦੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਵਾਲ ਬਾਰੇ ਹੋਰ ਸਪੱਸ਼ਟ ਹੋਵੋ।"
        },
        'te': {
            disease: "నేను మొక్కల వ్యాధుల గుర్తింపులో మీకు సహాయం చేయగలను. దయచేసి ప్రభావిత మొక్క చిత్రాన్ని అప్‌లోడ్ చేయండి.",
            growth: "మెరుగైన పంట పెరుగుదల కోసం, NPK ఎరువులతో మట్టి పోషణను నిర్ధారించండి, తగినంత నీటిని నిర్వహించండి.",
            weather: "వ్యవసాయంలో వాతావరణం కీలక పాత్ర పోషిస్తుంది. వర్షం కోసం స్థానిక అంచనాలను చూడండి.",
            general: "మీ అన్ని వ్యవసాయ అవసరాలలో సహాయం చేయడానికి నేను ఇక్కడ ఉన్నాను.",
            default: "మీకు వ్యవసాయ సలహా అవసరమని నేను అర్థం చేసుకున్నాను. దయచేసి మీ ప్రశ్న గురించి మరింత స్పష్టంగా చెప్పండి."
        },
        'ta': {
            disease: "தாவர நோய்களை அடையாளம் காண உங்களுக்கு உதவ முடியும். பாதிக்கப்பட்ட தாவரத்தின் படத்தை பதிவேற்றவும்.",
            growth: "சிறந்த பயிர் வளர்ச்சிக்கு, NPK உரங்களுடன் மண் ஊட்டச்சத்தை உறுதிப்படுத்துங்கள், போதுமான நீரைப் பராமரிக்கவும்.",
            weather: "வேளாண்மையில் வானிலை முக்கிய பங்கு வகிக்கிறது. மழைக்கான உள்ளூர் முன்னறிவிப்புகளைப் பார்க்கவும்.",
            general: "உங்கள் அனைத்து வேளாண்மை தேவைகளுக்கும் உதவ நான் இங்கே இருக்கிறேன்.",
            default: "உங்களுக்கு வேளாண்மை ஆலோசனை தேவை என்று நான் புரிந்துகொள்கிறேன். தயவுசெய்து உங்கள் கேள்வியைப் பற்றி இன்னும் குறிப்பிட்டுச் சொல்லுங்கள்."
        }
    };

    const currentLang = localStorage.getItem('selectedLanguage') || 'en';
    return responses[currentLang][category] || responses['en'][category];
}

function speakResponse(text) {
    if (synthesis && synthesis.speaking) {
        synthesis.cancel();
    }

    if (synthesis) {
        const utterance = new SpeechSynthesisUtterance(text);

        // Set voice based on language with improved selection
        const voices = synthesis.getVoices();
        let chosenVoice = null;

        // Check if user selected a specific voice
        if (selectedVoice !== null && voices[selectedVoice]) {
            chosenVoice = voices[selectedVoice];
            console.log(`Using manually selected voice: ${chosenVoice.name} (${chosenVoice.lang})`);
        } else {
            // Auto-select based on language
            const languageMap = {
                'en': ['en-US', 'en-GB', 'en'],
                'hi': ['hi-IN', 'hi', 'en-IN'],
                'pa': ['pa-IN', 'pa', 'en-IN'],
                'te': ['te-IN', 'te', 'en-IN', 'kn-IN', 'ml-IN'], // Telugu with fallbacks
                'ta': ['ta-IN', 'ta', 'en-IN']
            };

            const targetLangs = languageMap[currentLanguage] || ['en-US'];

            // Try to find the best matching voice
            for (const lang of targetLangs) {
                chosenVoice = voices.find(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0]));
                if (chosenVoice) break;
            }

            // If no specific voice found, try any voice that might work for the region
            if (!chosenVoice && currentLanguage !== 'en') {
                chosenVoice = voices.find(v => v.lang.includes('IN') || v.lang.includes('en'));
            }

            // Final fallback to any available voice
            if (!chosenVoice && voices.length > 0) {
                chosenVoice = voices[0];
            }

            if (chosenVoice) {
                console.log(`Using auto-selected voice: ${chosenVoice.name} (${chosenVoice.lang}) for language: ${currentLanguage}`);
            } else {
                console.warn('No suitable voice found for language:', currentLanguage);
            }
        }

        if (chosenVoice) {
            utterance.voice = chosenVoice;
        }

        // Adjust speech parameters based on language
        const languageSettings = {
            'te': { rate: 0.8, pitch: 1.1, volume: 0.9 }, // Telugu specific settings
            'hi': { rate: 0.85, pitch: 1, volume: 0.9 },
            'pa': { rate: 0.8, pitch: 1, volume: 0.9 },
            'ta': { rate: 0.8, pitch: 1.1, volume: 0.9 },
            'en': { rate: 0.9, pitch: 1, volume: 0.8 }
        };

        const settings = languageSettings[currentLanguage] || languageSettings['en'];
        utterance.rate = settings.rate;
        utterance.pitch = settings.pitch;
        utterance.volume = settings.volume;

        // Add language attribute for better pronunciation
        utterance.lang = languageMap[currentLanguage][0];

        synthesis.speak(utterance);
    }
}

// Test voice features function
function testVoiceFeatures() {
    if (!recognition) {
        showNotification('Voice recognition not supported in this browser', 'error');
        return;
    }

    showNotification('Voice features are working! Click the microphone button to start.', 'success');

    // Test speech synthesis with current language
    if (synthesis) {
        const testMessages = {
            'en': 'Voice features are working correctly!',
            'hi': 'वॉइस फीचर्स सही तरीके से काम कर रहे हैं!',
            'pa': 'ਵੌਇਸ ਫੀਚਰ ਸਹੀ ਢੰਗ ਨਾਲ ਕੰਮ ਕਰ ਰਹੇ ਹਨ!',
            'te': 'వాయిస్ ఫీచర్లు సరిగ్గా పని చేస్తున్నాయి!',
            'ta': 'குரல் அம்சங்கள் சரியாக வேலை செய்கின்றன!'
        };

        const testMessage = testMessages[currentLanguage] || testMessages['en'];
        const testUtterance = new SpeechSynthesisUtterance(testMessage);

        // Use the same voice selection logic as speakResponse
        const voices = synthesis.getVoices();
        let chosenVoice = null;

        // Check if user selected a specific voice
        if (selectedVoice !== null && voices[selectedVoice]) {
            chosenVoice = voices[selectedVoice];
            console.log(`Test using manually selected voice: ${chosenVoice.name} (${chosenVoice.lang})`);
        } else {
            // Auto-select based on language
            const languageMap = {
                'en': ['en-US', 'en-GB', 'en'],
                'hi': ['hi-IN', 'hi', 'en-IN'],
                'pa': ['pa-IN', 'pa', 'en-IN'],
                'te': ['te-IN', 'te', 'en-IN', 'kn-IN', 'ml-IN'],
                'ta': ['ta-IN', 'ta', 'en-IN']
            };

            const targetLangs = languageMap[currentLanguage] || ['en-US'];

            for (const lang of targetLangs) {
                chosenVoice = voices.find(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0]));
                if (chosenVoice) break;
            }

            if (!chosenVoice && currentLanguage !== 'en') {
                chosenVoice = voices.find(v => v.lang.includes('IN') || v.lang.includes('en'));
            }

            if (!chosenVoice && voices.length > 0) {
                chosenVoice = voices[0];
            }

            if (chosenVoice) {
                console.log(`Test using auto-selected voice: ${chosenVoice.name} (${chosenVoice.lang})`);
            }
        }

        if (chosenVoice) {
            testUtterance.voice = chosenVoice;
        }

        synthesis.speak(testUtterance);
    }
}

// Debug function to list available voices
function listAvailableVoices() {
    if (synthesis) {
        const voices = synthesis.getVoices();
        console.log('Available voices:');
        voices.forEach((voice, index) => {
            console.log(`${index}: ${voice.name} (${voice.lang}) - ${voice.voiceURI}`);
        });
    } else {
        console.log('Speech synthesis not supported');
    }
}

// Populate voice selector dropdown
function populateVoiceSelector() {
    const voiceSelect = document.getElementById('voiceSelect');
    if (!voiceSelect || !synthesis) return;

    const voices = synthesis.getVoices();
    voiceSelect.innerHTML = '<option value="">Auto-select</option>';

    voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });
}

// Initialize voice features when DOM loads
document.addEventListener('DOMContentLoaded', function () {
    initializeVoiceFeatures();

    // Wait for voices to be loaded
    if (synthesis) {
        synthesis.onvoiceschanged = function () {
            console.log('Voices loaded:', synthesis.getVoices().length);
            populateVoiceSelector();
        };
    }

    // Update language when selector changes
    document.getElementById('languageSelect').addEventListener('change', function () {
        currentLanguage = this.value;
        localStorage.setItem('selectedLanguage', currentLanguage);

        if (recognition) {
            const languageMap = {
                'en': 'en-US',
                'hi': 'hi-IN',
                'pa': 'pa-IN',
                'te': 'te-IN',
                'ta': 'ta-IN'
            };
            recognition.lang = languageMap[currentLanguage] || 'en-US';
        }

        // Update status message in current language
        const statusMessages = {
            'en': 'Ready to help you',
            'hi': 'आपकी सहायता के लिए तैयार',
            'pa': 'ਤੁਹਾਡੀ ਮਦਦ ਲਈ ਤਿਆਰ',
            'te': 'మీకు సహాయం చేయడానికి సిద్ధం',
            'ta': 'உங்களுக்கு உதவ தயார்'
        };
        updateVoiceStatus(statusMessages[currentLanguage] || statusMessages['en'], 'ready');
    });

    // Handle voice selection change
    document.getElementById('voiceSelect').addEventListener('change', function () {
        const value = this.value;
        selectedVoice = value === '' ? null : parseInt(value);
        console.log('Selected voice index:', selectedVoice);
    });
});

