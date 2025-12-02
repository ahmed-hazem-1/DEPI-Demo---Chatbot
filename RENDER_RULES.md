# DEPI Chatbot - Render Rules & Streaming Architecture

## Overview
This document outlines the rendering rules and streaming mechanism used in the DEPI Chatbot to ensure smooth, real-time display of markdown content with bidirectional text support.

---

## Streaming Rules

### 1. **Webhook Connection**
- **URL**: `https://mogeeb.shop/webhook/28936085-3283-4f68-b158-6d451ae34d21`
- **Method**: POST
- **Stream Format**: JSON Lines (newline-delimited JSON)
- **Response Type**: `ReadableStream` with JSON objects containing:
  - `type`: "item" (content indicator)
  - `content`: The actual text content to display

### 2. **Stream Collection Pipeline**
```
Webhook Response → ReadableStream → JSON Line Parser → Content Accumulation
```

#### Process:
1. Fetch webhook with `stream: true`
2. Read chunks from response body
3. Decode chunks using TextDecoder
4. Parse complete JSON lines (separated by `\n`)
5. Extract content where `jsonData.type === 'item'`
6. Accumulate in `fullResponse` variable
7. Handle remaining buffer after stream ends
8. Final decode flush to capture any remaining bytes

### 3. **Stream Reliability**
- **Timeout Protection**: 60-second timeout per stream read
- **Buffer Management**: 
  - Split buffer on newline characters
  - Last incomplete line held for next chunk
  - Final processing of remaining buffer after stream ends
- **Error Handling**: 
  - JSON parse errors logged but non-fatal
  - Stream continues despite malformed lines
  - User gets partial content if stream fails

---

## Rendering Rules

### 1. **Display Timing**
- **Start**: Immediately begin typing animation (don't wait for all data)
- **Speed**: 8ms per character for smooth animation
- **Concurrent**: Typing and stream collection happen simultaneously
- **Catch-up**: If stream is faster than typing, typing pauses and waits (50ms checks)
- **Completion**: After stream ends, typing finishes remaining characters

### 2. **Markdown Processing**
- **Parser**: Marked.js library
- **Options**: 
  - `breaks: true` (line breaks treated as `<br>`)
  - `gfm: true` (GitHub Flavored Markdown)
  - `pedantic: false` (strict CommonMark compliance)
- **Code Highlighting**: Highlight.js for syntax coloring
- **Timing**: Markdown renders on every update (continuous throughout typing)

### 3. **Text Direction (Bidirectional Support)**

#### CSS Rules Applied:
```css
direction: auto;           /* Let browser detect text direction */
unicode-bidi: embed;       /* Treat as separate bidirectional context */
text-align: start;         /* Natural alignment based on direction */
```

#### JavaScript Application:
```javascript
const paragraphs = contentDiv.querySelectorAll('p');
paragraphs.forEach(p => {
    p.dir = 'auto';
    p.style.unicodeBidi = 'embed';
});
```

#### Behavior:
- **Arabic Text**: Renders right-to-left
- **English Text**: Renders left-to-right
- **Mixed Content**: Each runs naturally in its direction
- **Automatic Detection**: Browser detects dominant text direction per paragraph

### 4. **Content Updates**
- **Trigger**: Every character added during typing animation
- **Debounce**: None (real-time updates every 8ms)
- **Re-render**: Full markdown re-parse on each update
- **Performance**: CSS containment prevents layout thrashing
  ```css
  contain: layout style paint;
  will-change: transform, opacity;
  -webkit-overflow-scrolling: touch;
  ```

### 5. **Auto-scrolling**
- **Method**: `requestAnimationFrame` for smooth scrolling
- **Target**: `this.chatMessages.scrollTop = this.chatMessages.scrollHeight`
- **When**: After each render update
- **Detection**: Checks if user is at bottom (within 50px margin)
- **Behavior**: 
  - Auto-scroll if user is at bottom
  - Stop auto-scroll if user scrolls up to read

---

## Rendering Pipeline Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. User sends message                               │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ 2. Show streaming indicator (bouncing dots)         │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ 3. Start Stream Reading & Start Typing Animation    │
│    (Parallel processes)                             │
└────────┬──────────────────────────────┬─────────────┘
         │                              │
    ┌────▼─────────────────┐       ┌────▼──────────────────┐
    │ Stream Collection:   │       │ Typing Animation:     │
    │ - Read chunks       │       │ - Add char every 8ms  │
    │ - Parse JSON lines  │       │ - Render markdown     │
    │ - Accumulate text   │       │ - Update DOM          │
    │ - Handle buffer     │       │ - Auto-scroll         │
    └────┬─────────────────┘       └────┬──────────────────┘
         │                              │
         │     ┌──────────────────────┬─┘
         │     │ Wait if stream faster
         │     │ Continue if more data
         │     │
         └──────┬─────────────────────────────────────┐
                │                                     │
┌───────────────▼─────────────────────────────────────▼──┐
│ 4. Stream Complete & Typing Catches Up                 │
└───────────────┬────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────┐
│ 5. Final Markdown Render                               │
│    - Full HTML rendering                               │
│    - Code syntax highlighting                          │
│    - Direction detection for all paragraphs             │
└───────────────┬────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────┐
│ 6. Display Complete Response                           │
└────────────────────────────────────────────────────────┘
```

---

## Key Performance Optimizations

### 1. **Parallel Processing**
- Stream reading and typing animation run independently
- No blocking operations
- Smooth user experience even with network delays

### 2. **CSS Containment**
```css
contain: layout style paint;
```
- Limits browser reflow to message element only
- Prevents entire page from re-calculating layout
- Critical for 100+ message chats

### 3. **GPU Acceleration**
```css
will-change: transform, opacity;
transform: translateY(0);
```
- Promotes message elements to GPU layer
- Smoother animation and scrolling

### 4. **Smooth Scrolling**
```css
-webkit-overflow-scrolling: touch;
```
- Hardware-accelerated scrolling on touch devices
- Smooth momentum scrolling

### 5. **RequestAnimationFrame**
```javascript
requestAnimationFrame(() => {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
});
```
- Synchronizes scroll with browser refresh rate
- No jank or visual artifacts

---

## Message Limits

- **Max Messages**: 100 per chat session
- **Strategy**: Remove oldest message when limit exceeded
- **Reason**: Prevent memory bloat and maintain performance
- **User Impact**: Transparent (auto-archived, not deleted from storage)

---

## Error Handling Rules

### Stream Errors:
1. **JSON Parse Errors** → Log to console, skip line, continue streaming
2. **Network Timeout** → After 60s, process what we have, complete gracefully
3. **Stream Read Failure** → Catch, log, show error message to user
4. **No Response** → Show "No response received" message

### Render Errors:
1. **Markdown Parse Error** → Catch, log, fall back to plain text
2. **Syntax Highlight Error** → Catch, log, continue without highlighting
3. **DOM Error** → Check if contentDiv exists before rendering

---

## Browser Compatibility

| Feature | Support |
|---------|---------|
| ReadableStream | Chrome 52+, Firefox 65+, Safari 10.1+ |
| TextDecoder | Chrome 38+, Firefox 19+, Safari 10.1+ |
| RequestAnimationFrame | All modern browsers |
| CSS Grid/Flexbox | All modern browsers |
| Marked.js | All browsers |
| Highlight.js | All browsers |
| Dir="auto" | All modern browsers |
| Unicode-bidi: embed | All modern browsers |

---

## Testing Checklist

- [ ] Stream receives full response without stopping
- [ ] Markdown renders live while typing
- [ ] Arabic/English mixed text displays correctly
- [ ] Code blocks render with syntax highlighting
- [ ] Emoji and special characters display properly
- [ ] Long responses (1000+ chars) perform smoothly
- [ ] Chat with 100+ messages remains responsive
- [ ] Auto-scroll works when user at bottom
- [ ] Auto-scroll stops when user scrolls up
- [ ] Mobile responsive layout (480px, 768px, 1024px)
- [ ] Touch scrolling smooth on mobile
- [ ] Reconnect after network error
- [ ] Multiple messages in sequence work correctly

---

## Future Improvements

1. **Streaming Optimization**
   - Add compression support (gzip)
   - Implement progressive JPEG rendering
   - Add CDN support for faster delivery

2. **Rendering Enhancement**
   - Add dark mode support
   - Custom markdown themes
   - LaTeX/MathJax support for equations

3. **Features**
   - Message editing/deletion
   - Copy to clipboard button
   - Share conversation
   - Export as PDF

4. **Performance**
   - Implement virtual scrolling for 1000+ messages
   - Add service worker caching
   - Optimize bundle size

---

**Last Updated**: December 2, 2025
**Version**: 1.0
**Status**: Production Ready ✅
