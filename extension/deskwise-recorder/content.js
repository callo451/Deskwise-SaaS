// Content script for Deskwise Knowledge Recorder
(function() {
  'use strict';

  class DeskwiseRecorder {
    constructor() {
      this.isRecording = false;
      this.clickHandler = null;
      this.keyboardHandler = null;
      this.recordingIndicator = null;
      this.stepCounter = 0;
      this.init();
    }

    init() {
      // Listen for recording state changes
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'startRecording') {
          this.startRecording();
          sendResponse({ success: true });
        } else if (request.action === 'stopRecording') {
          this.stopRecording();
          sendResponse({ success: true });
        }
      });

      // Check initial recording state
      chrome.runtime.sendMessage({ action: 'getRecordingState' }, (response) => {
        if (response && response.isRecording) {
          this.startRecording();
        }
      });
    }

    startRecording() {
      if (this.isRecording) return;
      
      this.isRecording = true;
      this.stepCounter = 0;
      this.showRecordingIndicator();
      this.attachEventListeners();
      
      // Show start recording notification
      this.showNotification('Recording started! Click elements to capture steps.', 'success');
    }

    stopRecording() {
      if (!this.isRecording) return;
      
      this.isRecording = false;
      this.hideRecordingIndicator();
      this.detachEventListeners();
      
      // Show stop recording notification
      this.showNotification('Recording stopped! Processing your guide...', 'info');
    }

    attachEventListeners() {
      this.clickHandler = this.handleClick.bind(this);
      this.keyboardHandler = this.handleKeyboard.bind(this);
      
      document.addEventListener('click', this.clickHandler, true);
      document.addEventListener('keydown', this.keyboardHandler, true);
    }

    detachEventListeners() {
      if (this.clickHandler) {
        document.removeEventListener('click', this.clickHandler, true);
      }
      if (this.keyboardHandler) {
        document.removeEventListener('keydown', this.keyboardHandler, true);
      }
    }

    handleClick(event) {
      if (!this.isRecording) return;
      
      // Ignore clicks on our recording indicator
      if (event.target.closest('#deskwise-recording-indicator')) {
        return;
      }

      const element = event.target;
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      this.stepCounter++;
      
      const clickData = {
        step: this.stepCounter,
        timestamp: Date.now(),
        action: 'click',
        coordinates: {
          x: event.clientX,
          y: event.clientY,
          pageX: event.pageX,
          pageY: event.pageY
        },
        element: {
          tagName: element.tagName,
          className: element.className,
          id: element.id,
          textContent: this.getElementText(element),
          selector: this.getElementSelector(element),
          attributes: this.getElementAttributes(element)
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollTop: scrollTop,
          scrollLeft: scrollLeft
        },
        boundingRect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top + scrollTop,
          left: rect.left + scrollLeft
        },
        url: window.location.href,
        title: document.title
      };

      // Add visual feedback
      this.addClickAnimation(event.clientX, event.clientY);
      
      // Send to background script for screenshot capture
      chrome.runtime.sendMessage({
        action: 'captureScreenshot',
        clickData: clickData
      });

      // Update step counter in indicator
      this.updateStepCounter();
    }

    handleKeyboard(event) {
      if (!this.isRecording) return;
      
      // Only capture important keys
      const importantKeys = ['Enter', 'Tab', 'Escape', 'Space'];
      if (!importantKeys.includes(event.key) && event.key.length > 1) return;
      
      const element = event.target;
      
      const keyboardData = {
        step: this.stepCounter + 0.5, // Sub-step
        timestamp: Date.now(),
        action: 'keyboard',
        key: event.key,
        element: {
          tagName: element.tagName,
          className: element.className,
          id: element.id,
          selector: this.getElementSelector(element)
        },
        url: window.location.href
      };

      chrome.runtime.sendMessage({
        action: 'captureKeyboard',
        keyboardData: keyboardData
      });
    }

    getElementText(element) {
      // Get meaningful text content
      const textContent = element.textContent?.trim();
      if (textContent && textContent.length > 0) {
        return textContent.substring(0, 100);
      }
      
      // Check for placeholder, alt text, or title
      return element.placeholder || element.alt || element.title || '';
    }

    getElementSelector(element) {
      // Generate a unique selector for the element
      if (element.id) {
        return `#${element.id}`;
      }
      
      if (element.className) {
        const classes = element.className.split(' ').filter(c => c);
        if (classes.length > 0) {
          return `.${classes[0]}`;
        }
      }
      
      // Use tag name and position
      const siblings = Array.from(element.parentElement?.children || []);
      const index = siblings.indexOf(element);
      return `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
    }

    getElementAttributes(element) {
      const attributes = {};
      const importantAttrs = ['type', 'name', 'value', 'href', 'src', 'alt', 'title', 'placeholder'];
      
      importantAttrs.forEach(attr => {
        if (element.hasAttribute(attr)) {
          attributes[attr] = element.getAttribute(attr);
        }
      });
      
      return attributes;
    }

    showRecordingIndicator() {
      this.recordingIndicator = document.createElement('div');
      this.recordingIndicator.id = 'deskwise-recording-indicator';
      this.recordingIndicator.innerHTML = `
        <div class="recording-status">
          <div class="recording-dot"></div>
          <span class="recording-text">Recording</span>
          <span class="step-counter">Step: 0</span>
        </div>
        <div class="recording-controls">
          <button class="stop-btn" id="stop-recording-btn">Stop</button>
        </div>
      `;
      
      const styles = `
        #deskwise-recording-indicator {
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          padding: 12px 20px;
          border-radius: 12px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
          z-index: 2147483647;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          min-width: 200px;
        }
        
        .recording-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .recording-dot {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        .recording-controls {
          display: flex;
          gap: 8px;
        }
        
        .stop-btn {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 4px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        
        .stop-btn:hover {
          background: rgba(255,255,255,0.3);
        }
        
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
      `;
      
      const styleSheet = document.createElement('style');
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
      
      document.body.appendChild(this.recordingIndicator);
      
      // Add stop button functionality
      const stopBtn = document.getElementById('stop-recording-btn');
      stopBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'stopRecording' });
      });
    }

    hideRecordingIndicator() {
      if (this.recordingIndicator) {
        this.recordingIndicator.remove();
        this.recordingIndicator = null;
      }
    }

    updateStepCounter() {
      const stepCounter = document.querySelector('.step-counter');
      if (stepCounter) {
        stepCounter.textContent = `Step: ${this.stepCounter}`;
      }
    }

    addClickAnimation(x, y) {
      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: fixed;
        top: ${y - 15}px;
        left: ${x - 15}px;
        width: 30px;
        height: 30px;
        border: 3px solid #ef4444;
        border-radius: 50%;
        background: rgba(239, 68, 68, 0.2);
        z-index: 2147483646;
        pointer-events: none;
        animation: clickRipple 0.6s ease-out;
      `;
      
      const rippleStyle = document.createElement('style');
      rippleStyle.textContent = `
        @keyframes clickRipple {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
      `;
      document.head.appendChild(rippleStyle);
      
      document.body.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
        rippleStyle.remove();
      }, 600);
    }

    showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 2147483647;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
      `;
      
      notification.textContent = message;
      
      const notificationStyle = document.createElement('style');
      notificationStyle.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(notificationStyle);
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
          notification.remove();
          notificationStyle.remove();
        }, 300);
      }, 3000);
    }
  }

  // Initialize the recorder when the page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new DeskwiseRecorder();
    });
  } else {
    new DeskwiseRecorder();
  }
})();