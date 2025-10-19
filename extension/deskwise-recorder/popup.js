// Popup script for Deskwise Knowledge Recorder
class PopupController {
  constructor() {
    this.isRecording = false;
    this.sessionStart = null;
    this.sessionTimer = null;
    this.stepCount = 0;
    this.pageCount = 1;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupMessageListener();
    this.loadSettings();
    this.setupLogo();
    this.updateRecordingState();
    this.loadRecentSessions();
  }

  setupEventListeners() {
    // Recording controls
    document.getElementById('startRecording').addEventListener('click', () => {
      this.startRecording();
    });

    document.getElementById('stopRecording').addEventListener('click', () => {
      this.stopRecording();
    });

    // Settings toggles (use currentTarget to ensure container toggles)
    document.getElementById('autoCrop').addEventListener('click', (e) => {
      this.toggleSetting(e.currentTarget, 'autoCrop');
    });

    document.getElementById('aiDescriptions').addEventListener('click', (e) => {
      this.toggleSetting(e.currentTarget, 'aiDescriptions');
    });

    document.getElementById('keyboardActions').addEventListener('click', (e) => {
      this.toggleSetting(e.currentTarget, 'keyboardActions');
    });
  }

  setupLogo() {
    try {
      const img = document.getElementById('logoImg');
      if (!img) return;
      const fallback = chrome.runtime.getURL('icons/icon128.png');
      const applyFallback = () => {
        try {
          if (img.src !== fallback) img.src = fallback;
        } catch (_) {}
      };
      img.addEventListener('error', applyFallback, { once: true });
      // If already failed or blocked, naturalWidth will be 0 once complete
      if (img.complete && img.naturalWidth === 0) {
        applyFallback();
      }
    } catch (_) {
      // no-op
    }
  }

  setupMessageListener() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('📩 Popup received message:', request);
      
      if (request.action === 'stepCountUpdate') {
        this.stepCount = request.stepCount || 0;
        document.getElementById('stepCount').textContent = this.stepCount.toString();
        console.log('📊 Updated step count to:', this.stepCount);
      }
      
      sendResponse({ received: true });
      return true;
    });
  }

  async updateRecordingState() {
    try {
      console.log('🔍 Checking recording state...');
      
      // Get recording state from background script instead of content script
      const response = await chrome.runtime.sendMessage({ action: 'getRecordingState' });
      console.log('📊 Recording state response:', response);
      
      if (response && response.success) {
        this.isRecording = response.isRecording || false;
        
        // If recording, get session details
        if (this.isRecording && response.sessionData) {
          this.sessionStart = response.sessionData.startTime;
          this.stepCount = response.sessionData.stepCount || 0;
          this.pageCount = 1;
          this.startTimer();
        }
        
        console.log('🎯 Current recording state:', this.isRecording);
        this.updateUI();
      } else {
        console.log('❌ Failed to get recording state, assuming not recording');
        this.isRecording = false;
        this.updateUI();
      }
    } catch (error) {
      console.error('💥 Error getting recording state:', error);
      this.isRecording = false;
      this.updateUI();
    }
  }

  async startRecording() {
    try {
      console.log('🎬 Starting recording process...');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('📋 Active tab:', tab);
      
      if (!tab || !tab.id) {
        throw new Error('No active tab found');
      }
      
      // Send message to background script
      console.log('📤 Sending start recording message to background script...');
      const response = await chrome.runtime.sendMessage({ action: 'startRecording', tabId: tab.id });
      console.log('📥 Background script response:', response);
      
      if (response && response.success) {
        console.log('✅ Recording started successfully');
        this.isRecording = true;
        this.sessionStart = Date.now();
        this.stepCount = 0;
        this.pageCount = 1;
        this.updateUI();
        this.startTimer();
        
        // Show success notification
        this.showNotification('Recording started!', 'success');
      } else {
        console.error('❌ Background script returned unsuccessful response:', response);
        this.showNotification('Failed to start recording - Background script error', 'error');
      }
    } catch (error) {
      console.error('💥 Error starting recording:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      this.showNotification(`Failed to start recording: ${error.message}`, 'error');
    }
  }

  async stopRecording() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'stopRecording' });
      
      if (response.success) {
        this.isRecording = false;
        this.updateUI();
        this.stopTimer();
        
        // Show success notification
        this.showNotification('Recording stopped! Processing guide...', 'success');
        
        // Refresh recent sessions
        setTimeout(() => {
          this.loadRecentSessions();
        }, 1000);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      this.showNotification('Failed to stop recording', 'error');
    }
  }

  updateUI() {
    const statusEl = document.getElementById('recordingStatus');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const startBtn = document.getElementById('startRecording');
    const stopBtn = document.getElementById('stopRecording');
    const sessionInfo = document.getElementById('sessionInfo');

    if (this.isRecording) {
      statusEl.className = 'status recording';
      statusIndicator.className = 'status-indicator recording';
      statusText.textContent = 'Recording in progress...';
      startBtn.style.display = 'none';
      stopBtn.style.display = 'block';
      sessionInfo.style.display = 'block';
    } else {
      statusEl.className = 'status idle';
      statusIndicator.className = 'status-indicator idle';
      statusText.textContent = 'Ready to record';
      startBtn.style.display = 'block';
      stopBtn.style.display = 'none';
      sessionInfo.style.display = 'none';
    }
  }

  startTimer() {
    this.sessionTimer = setInterval(() => {
      if (this.sessionStart) {
        const elapsed = Date.now() - this.sessionStart;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        document.getElementById('duration').textContent = 
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  stopTimer() {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  toggleSetting(element, settingKey) {
    const isActive = element.classList.toggle('active');
    
    // Save setting
    chrome.storage.sync.set({ [settingKey]: isActive });
    
    // Visual feedback
    this.showNotification(`${settingKey} ${isActive ? 'enabled' : 'disabled'}`, 'info');
  }

  async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get(['autoCrop', 'aiDescriptions', 'keyboardActions']);
      
      // Set default values
      const defaults = {
        autoCrop: true,
        aiDescriptions: true,
        keyboardActions: false
      };
      
      Object.entries(defaults).forEach(([key, defaultValue]) => {
        const value = settings[key] !== undefined ? settings[key] : defaultValue;
        const element = document.getElementById(key);
        if (element) {
          element.classList.toggle('active', value);
        }
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async loadRecentSessions() {
    try {
      const result = await chrome.storage.local.get(null);
      const sessions = Object.entries(result)
        .filter(([key]) => key.startsWith('session_'))
        .map(([key, value]) => ({ id: key, ...value }))
        .sort((a, b) => b.startTime - a.startTime)
        .slice(0, 3);

      const container = document.getElementById('recentSessionsList');
      
      if (sessions.length === 0) {
        container.innerHTML = `
          <div class="session-item">
            <div class="session-details">
              <div class="session-title">No recent sessions</div>
              <div class="session-meta">Start recording to see sessions here</div>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = sessions.map(session => `
        <div class="session-item">
          <div class="session-details">
            <div class="session-title">${session.steps?.length || 0} steps recorded</div>
            <div class="session-meta">${new Date(session.startTime).toLocaleDateString()}</div>
          </div>
          <div class="session-actions">
            <button class="btn btn-secondary btn-mini" onclick="viewSession('${session.id}')">View</button>
            <button class="btn btn-secondary btn-mini" onclick="deleteSession('${session.id}')">Delete</button>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading recent sessions:', error);
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Global functions for session management
window.viewSession = async (sessionId) => {
  try {
    const result = await chrome.storage.local.get(sessionId);
    const session = result[sessionId];
    
    if (session) {
      // Open session details in new tab
      const url = `http://localhost:9002/knowledge-base/sessions/${sessionId}`;
      chrome.tabs.create({ url });
    }
  } catch (error) {
    console.error('Error viewing session:', error);
  }
};

window.deleteSession = async (sessionId) => {
  try {
    await chrome.storage.local.remove(sessionId);
    
    // Refresh the sessions list
    const popup = new PopupController();
    popup.loadRecentSessions();
    popup.showNotification('Session deleted', 'success');
  } catch (error) {
    console.error('Error deleting session:', error);
  }
};

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);