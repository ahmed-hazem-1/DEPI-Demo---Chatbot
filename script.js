/* ============================================
   DEPI Chatbot - Advanced Features
   ============================================ */

class DEPIChatbot {
    constructor() {
        this.webhookUrl = 'https://mogeeb.shop/webhook/28936085-3283-4f68-b158-6d451ae34d21';
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.chatMessages = document.getElementById('chatMessages');
        this.toggleBtn = document.getElementById('toggleChat');
        this.chatbotWidget = document.querySelector('.chatbot-widget');
        this.isMinimized = false;
        this.isStreaming = false;
        this.messageCount = 0;
        this.maxMessages = 100; // Keep only last 100 messages to prevent performance issues

        this.initializeEventListeners();
        this.detectLanguage();
        this.addTypingEffect();
    }

    initializeEventListeners() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.toggleBtn.addEventListener('click', () => this.toggleChat());
    }

    toggleChat() {
        this.isMinimized = !this.isMinimized;
        const container = this.chatbotWidget.querySelector('.chatbot-container');
        
        if (this.isMinimized) {
            container.style.display = 'none';
            this.toggleBtn.textContent = '+';
            this.chatbotWidget.style.height = 'auto';
        } else {
            container.style.display = 'flex';
            this.toggleBtn.textContent = '−';
            this.chatbotWidget.style.height = 'auto';
            this.chatbotWidget.style.maxHeight = '600px';
        }
    }

    detectLanguage() {
        // Let the browser handle bidirectional text automatically
        // dir="auto" on the input element will handle this
    }

    addTypingEffect() {
        // Add character-by-character typing effect to initial message
        const initialMessage = this.chatMessages.querySelector('.bot-message');
        if (initialMessage) {
            const text = initialMessage.textContent;
            initialMessage.querySelector('.message-content').textContent = '';
            this.typeMessage(text, initialMessage.querySelector('.message-content'));
        }
    }

    typeMessage(text, element, speed = 30) {
        let i = 0;
        const type = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        };
        type();
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.messageCount++;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.sendBtn.disabled = true;

        // Show streaming indicator
        const streamingMsg = this.addStreamingIndicator();

        try {
            await this.streamResponseFromWebhook(message, streamingMsg);
        } catch (error) {
            console.error('Error:', error);
            streamingMsg.innerHTML = '<div class="message-content">Sorry, I encountered an error. Please try again.</div>';
        } finally {
            this.sendBtn.disabled = false;
            this.messageInput.focus();
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message new`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        if (sender === 'bot') {
            // Parse markdown for bot messages
            contentDiv.innerHTML = marked.parse(text);
            
            // Wrap content in a paragraph with proper direction if not already wrapped
            const paragraphs = contentDiv.querySelectorAll('p');
            paragraphs.forEach(p => {
                p.dir = 'auto';
                p.style.unicodeBidi = 'embed';
            });
            
            // Highlight code blocks
            contentDiv.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        } else {
            // Plain text for user messages
            contentDiv.textContent = text;
        }

        messageDiv.appendChild(contentDiv);
        this.chatMessages.appendChild(messageDiv);

        // Remove old messages if exceeding max limit
        const messages = this.chatMessages.querySelectorAll('.message');
        if (messages.length > this.maxMessages) {
            messages[0].remove();
        }

        // Auto-scroll to bottom with requestAnimationFrame
        requestAnimationFrame(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        });

        return messageDiv;
    }

    addStreamingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="streaming-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);

        // Remove old messages if exceeding max limit
        const messages = this.chatMessages.querySelectorAll('.message');
        if (messages.length > this.maxMessages) {
            messages[0].remove();
        }

        // Auto-scroll to bottom with requestAnimationFrame
        requestAnimationFrame(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        });

        return messageDiv;
    }

    async streamResponseFromWebhook(message, indicatorElement) {
        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    stream: true,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';
            let isFirstChunk = true;
            let buffer = '';
            let contentDiv = indicatorElement.querySelector('.message-content');
            let charIndex = 0; // For typing effect
            let typeTimer;

            const renderFullContent = () => {
                if (!contentDiv) return;
                
                contentDiv.innerHTML = marked.parse(fullResponse);
                
                // Apply direction to paragraphs
                const paragraphs = contentDiv.querySelectorAll('p');
                paragraphs.forEach(p => {
                    p.dir = 'auto';
                    p.style.unicodeBidi = 'embed';
                });
                
                // Highlight code blocks
                contentDiv.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });

                // Smooth scroll
                requestAnimationFrame(() => {
                    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
                });
            };

            const typeCharacter = () => {
                if (charIndex < fullResponse.length) {
                    contentDiv.textContent = fullResponse.substring(0, charIndex + 1);
                    charIndex++;
                    typeTimer = setTimeout(typeCharacter, 15); // Typing speed: 15ms per character
                    
                    // Scroll as text appears
                    requestAnimationFrame(() => {
                        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
                    });
                } else {
                    // When typing completes, render full markdown
                    clearTimeout(typeTimer);
                    renderFullContent();
                }
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                // Process complete JSON lines
                const lines = buffer.split('\n');
                buffer = lines[lines.length - 1];

                for (let i = 0; i < lines.length - 1; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    try {
                        const jsonData = JSON.parse(line);
                        
                        if (jsonData.type === 'item' && jsonData.content) {
                            fullResponse += jsonData.content;

                            if (isFirstChunk) {
                                contentDiv.innerHTML = '';
                                isFirstChunk = false;
                                // Start typing effect
                                typeCharacter();
                            }
                        }
                    } catch (e) {
                        continue;
                    }
                }
            }

            // Process remaining buffer
            if (buffer.trim()) {
                try {
                    const jsonData = JSON.parse(buffer);
                    if (jsonData.type === 'item' && jsonData.content) {
                        fullResponse += jsonData.content;
                    }
                } catch (e) {
                    // Ignore
                }
            }

            // If typing hasn't started, start it now
            if (isFirstChunk && fullResponse) {
                contentDiv.innerHTML = '';
                isFirstChunk = false;
                typeCharacter();
            }

            return fullResponse;
        } catch (error) {
            console.error('Streaming error:', error);
            throw error;
        }
    }

    // Alternative method for non-streaming responses
    async getResponseFromWebhook(message) {
        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.response || 'No response received';
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const chatbot = new DEPIChatbot();
    console.log('DEPI Chatbot initialized and ready!');
    
    // Add some interactivity to the page
    addPageAnimations();
});

// Configure marked options for better markdown rendering
marked.setOptions({
    breaks: true,
    gfm: true,
    pedantic: false,
});

// Add interactive animations to page elements
function addPageAnimations() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.style.animation = 'fadeInUp 0.6s ease-out backwards';
        
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}
