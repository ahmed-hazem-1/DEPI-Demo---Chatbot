# DEPI Chatbot - Setup Guide

## Features
✅ **Streaming Support** - Real-time message streaming from webhook  
✅ **Markdown Rendering** - Full markdown support with syntax highlighting  
✅ **Arabic & English** - Automatic language detection with RTL support  
✅ **Animated UI** - Smooth animations and transitions  
✅ **Bottom-Right Widget** - Fixed position chatbot with minimize/maximize  
✅ **Responsive Design** - Works on desktop and mobile  

---

## Setup Instructions

### 1. **Configure Your n8n Webhook**

In `script.js`, update the webhook URL (line 11):

```javascript
this.webhookUrl = 'https://your-n8n-webhook-url.com/webhook';
```

### 2. **n8n Webhook Response Format**

Your n8n workflow should return responses in one of these formats:

#### For Streaming (recommended):
```json
{
  "message": "Your response here...",
  "stream": true
}
```

#### For Non-Streaming:
```json
{
  "response": "Your response here..."
}
```

### 3. **Server Setup**

The webpage needs to be served via HTTP/HTTPS. You can use:

**Option A: Python (Simple HTTP Server)**
```bash
python -m http.server 8000
```
Then open: `http://localhost:8000`

**Option B: Node.js (Using http-server)**
```bash
npm install -g http-server
http-server
```

**Option C: VS Code Live Server**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

---

## Project Structure

```
DEPI Demo - Chatbot/
├── index.html       # Main HTML file
├── styles.css       # DEPI theme styling
├── script.js        # Chatbot logic & webhooks
└── README.md        # This file
```

---

## Customization

### Change Colors (DEPI Theme)
Edit the CSS variables in `styles.css` (lines 8-22):

```css
:root {
    --primary-color: #1e3a5f;      /* Deep Blue */
    --secondary-color: #f39c12;    /* Golden */
    --accent-color: #3498db;       /* Light Blue */
    /* ... more colors ... */
}
```

### Modify Welcome Message
Edit the initial bot message in `index.html` (lines 46-50):

```html
<div class="message bot-message">
    <div class="message-content">
        <p>Your custom welcome message here!</p>
    </div>
</div>
```

### Adjust Chatbot Size
In `styles.css`, modify `.chatbot-widget`:

```css
.chatbot-widget {
    width: 380px;           /* Adjust width */
    max-height: 600px;      /* Adjust height */
    /* ... */
}
```

---

## Features Explained

### Streaming
The chatbot displays responses in real-time as they arrive from your n8n webhook. Perfect for long-running AI responses.

### Markdown Support
Messages support full markdown:
- **Bold**, *Italic*, ~~Strikethrough~~
- # Headers, Lists, Code blocks
- Tables, Blockquotes, Links

### Language Detection
Automatically detects Arabic/English and adjusts text alignment (RTL for Arabic).

### Auto-scroll
Chat automatically scrolls to show new messages.

### Message Animation
New messages slide in smoothly with fade effect.

---

## API Integration Example (n8n Webhook)

Here's a basic n8n workflow structure:

1. **Webhook Trigger** - Receives POST requests
2. **LLM Node** (OpenAI, Hugging Face, etc.)
3. **Response Node** - Returns JSON with "response" key

---

## CORS & Security Notes

If your chatbot is hosted on a different domain than your n8n instance:
- Configure CORS on your n8n webhook
- Or use a reverse proxy

For production:
- Add authentication tokens
- Validate user input
- Rate limit requests
- Use HTTPS

---

## Troubleshooting

**Chatbot not showing?**
- Check browser console (F12) for errors
- Verify webhook URL is correct
- Check CORS settings

**Streaming not working?**
- Ensure your webhook returns proper streaming format
- Check network tab in DevTools
- Verify response headers include `Content-Type: application/json`

**Markdown not rendering?**
- Verify marked.js library is loaded
- Check if response includes markdown syntax

---

## Browser Support

✅ Chrome, Firefox, Safari, Edge (latest versions)  
⚠️ Mobile browsers supported but optimized for desktop

---

## License
Free to use and modify for your project.

Made with ❤️ for DEPI
