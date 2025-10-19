// Background service worker for Deskwise Knowledge Recorder
// Updated to use new Deskwise API endpoints

// Configuration
const API_BASE_URL = 'http://localhost:9002';

class RecordingSession {
  constructor() {
    this.isRecording = false;
    this.steps = [];
    this.sessionId = null;
    this.tabId = null;
    this.startTime = null;
    this.currentUrl = null;
    this.sessionCreated = false; // Track if session was created in backend
  }

  async start(tabId) {
    console.log('🎬 Background: Starting recording session for tab:', tabId);

    // Don't start if already recording
    if (this.isRecording) {
      console.log('⚠️ Recording already in progress, ignoring start request');
      return;
    }

    // Capture the current tab URL
    try {
      const tab = await chrome.tabs.get(tabId);
      this.currentUrl = tab.url;
      console.log('🌐 Captured tab URL:', this.currentUrl);
    } catch (error) {
      console.error('❌ Failed to capture tab URL:', error);
      this.currentUrl = 'https://unknown';
    }

    this.isRecording = true;
    this.sessionId = `session_${Date.now()}`;
    this.tabId = tabId;
    this.startTime = Date.now();
    this.steps = [];
    this.sessionCreated = false;

    console.log('📝 Session details:', {
      sessionId: this.sessionId,
      tabId: this.tabId,
      startTime: this.startTime,
      currentUrl: this.currentUrl
    });

    // Create session in backend
    try {
      console.log('🚀 Creating session in backend...');
      const response = await fetch(`${API_BASE_URL}/api/knowledge-base/recorder/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: this.sessionId,
          url: this.currentUrl,
          title: `Recording on ${new URL(this.currentUrl).hostname}`,
          description: `Screen recording started at ${new Date().toLocaleString()}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Session created in backend:', data);
        this.sessionCreated = true;
      } else {
        const error = await response.text();
        console.error('❌ Failed to create session:', response.status, error);
        // Continue recording locally even if backend fails
      }
    } catch (error) {
      console.error('❌ Error creating session:', error);
      // Continue recording locally even if backend fails
    }

    // Inject content script to start recording
    try {
      console.log('💉 Injecting content script...');
      await chrome.scripting.executeScript({
        target: { tabId },
        func: function() {
          // Check if already initialized to prevent duplicate injection
          if (window.deskwiseRecorder) {
            console.log('⚠️ Recording already initialized, skipping...');
            return;
          }

          // Initialize the recording functionality
          window.deskwiseRecorder = {
            boundHandleClick: null,

            init: function() {
              this.boundHandleClick = this.handleClick.bind(this);
              document.addEventListener('click', this.boundHandleClick);
              this.showRecordingIndicator();
            },

            handleClick: function(event) {
              console.log('🖱️ Click detected!', event.target);

              const element = event.target;
              const rect = element.getBoundingClientRect();
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

              const clickData = {
                x: event.clientX,
                y: event.clientY,
                pageX: event.pageX,
                pageY: event.pageY,
                elementInfo: {
                  tagName: element.tagName,
                  className: element.className,
                  id: element.id,
                  textContent: element.textContent ? element.textContent.substring(0, 100).trim() : '',
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

              console.log('📋 Click data:', clickData);
              this.captureScreenshot(clickData);
            },

            captureScreenshot: function(clickData) {
              console.log('📷 Sending screenshot request to background...');

              // Check if chrome.runtime is available
              if (!chrome || !chrome.runtime) {
                console.error('❌ Chrome runtime not available');
                return;
              }

              // Send message to background script to capture screenshot
              try {
                chrome.runtime.sendMessage({
                  action: 'captureScreenshot',
                  clickData: clickData
                }, (response) => {
                  if (chrome.runtime.lastError) {
                    console.error('❌ Runtime error:', chrome.runtime.lastError);
                  } else {
                    console.log('✅ Screenshot request sent successfully', response);
                  }
                });
              } catch (error) {
                console.error('❌ Failed to send screenshot request:', error);
              }
            },

            getElementSelector: function(element) {
              if (element.id) return '#' + element.id;
              if (element.className) return '.' + element.className.split(' ')[0];
              return element.tagName.toLowerCase();
            },

            getElementAttributes: function(element) {
              const attrs = {};
              const attrNames = ['type', 'name', 'value', 'href', 'src', 'alt', 'title', 'placeholder'];
              attrNames.forEach(name => {
                if (element.hasAttribute(name)) {
                  attrs[name] = element.getAttribute(name);
                }
              });
              return attrs;
            },

            showRecordingIndicator: function() {
              console.log('🔴 Adding recording indicator to page');
              const indicator = document.createElement('div');
              indicator.id = 'deskwise-recording-indicator';
              indicator.innerHTML = '🔴 Recording - Deskwise';
              indicator.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #ef4444; color: white; padding: 8px 16px; border-radius: 20px; font-family: system-ui; font-size: 14px; font-weight: 500; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.3); animation: pulse 2s infinite;';
              document.body.appendChild(indicator);

              // Add pulse animation
              const style = document.createElement('style');
              style.textContent = '@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }';
              document.head.appendChild(style);

              console.log('✅ Recording indicator added successfully');
            }
          };

          window.deskwiseRecorder.init();
        }
      });

      console.log('✅ Content script injected successfully');
    } catch (error) {
      console.error('💥 Error during script injection:', error);
    }

    // Update badge
    try {
      chrome.action.setBadgeText({ text: "REC" });
      chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
      console.log('🎨 Recording badge set');
    } catch (error) {
      console.error('❌ Failed to set badge:', error);
    }
  }

  async stop() {
    console.log('🛑 Background: Stopping recording session');

    if (!this.isRecording) {
      console.log('⚠️ No active recording to stop');
      return;
    }

    const duration = Date.now() - this.startTime;
    this.isRecording = false;

    // Stop recording in content script
    if (this.tabId) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: this.tabId },
          func: function() {
            console.log('🛑 Stopping recording...');
            if (window.deskwiseRecorder) {
              if (window.deskwiseRecorder.boundHandleClick) {
                document.removeEventListener('click', window.deskwiseRecorder.boundHandleClick);
                console.log('🗑️ Event listener removed');
              }

              const indicator = document.getElementById('deskwise-recording-indicator');
              if (indicator) {
                indicator.remove();
                console.log('🗑️ Recording indicator removed');
              }

              window.deskwiseRecorder = null;
              console.log('✅ Recording stopped successfully');
            }
          }
        });
      } catch (error) {
        console.error('❌ Error stopping recording in content script:', error);
      }
    }

    // Reset badge
    try {
      chrome.action.setBadgeText({ text: "" });
      console.log('🎨 Recording badge cleared');
    } catch (error) {
      console.error('❌ Failed to clear badge:', error);
    }

    // Update session status in backend
    if (this.sessionCreated) {
      try {
        await fetch(`${API_BASE_URL}/api/knowledge-base/recorder/sessions/${this.sessionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            status: 'completed',
            duration: duration
          })
        });
        console.log('✅ Session status updated to completed');
      } catch (error) {
        console.error('❌ Error updating session status:', error);
      }
    }

    // Process and generate article
    await this.processSession();
  }

  async addStep(stepData) {
    if (!this.isRecording) return;

    const stepNumber = this.steps.length + 1;
    const step = {
      id: stepNumber,
      stepNumber: stepNumber,
      timestamp: Date.now(),
      relativeTime: Date.now() - this.startTime,
      ...stepData
    };

    this.steps.push(step);

    console.log(`📊 Step ${stepNumber} added! Total steps: ${this.steps.length}`);

    // Send step to backend if session was created
    if (this.sessionCreated && step.screenshotId) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/knowledge-base/recorder/steps`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            sessionId: this.sessionId,
            stepNumber: stepNumber,
            action: step.action.toLowerCase().split(' ')[0], // Extract 'click', 'type', etc.
            description: step.description,
            selector: step.clickData?.elementInfo?.selector,
            element: step.clickData?.elementInfo,
            viewport: step.clickData?.viewport,
            coordinates: {
              x: step.clickData?.x,
              y: step.clickData?.y,
              pageX: step.clickData?.pageX,
              pageY: step.clickData?.pageY
            },
            screenshotId: step.screenshotId,
            timestamp: step.relativeTime,
            url: step.clickData?.url
          })
        });

        if (response.ok) {
          console.log('✅ Step sent to backend successfully');
        } else {
          console.error('❌ Failed to send step to backend:', response.status);
        }
      } catch (error) {
        console.error('❌ Error sending step to backend:', error);
      }
    }

    // Store in chrome storage for persistence (fallback)
    chrome.storage.local.set({
      [`session_${this.sessionId}`]: {
        steps: this.steps,
        sessionId: this.sessionId,
        startTime: this.startTime
      }
    });

    // Notify popup of step count update
    try {
      chrome.runtime.sendMessage({
        action: 'stepCountUpdate',
        stepCount: this.steps.length
      });
    } catch (error) {
      // Popup might be closed, ignore error
    }
  }

  async processSession() {
    console.log(`🔄 Processing session with ${this.steps.length} steps...`);

    if (this.steps.length === 0) {
      console.log('⚠️ No steps recorded, skipping processing');
      return;
    }

    if (!this.sessionCreated) {
      console.log('⚠️ Session not created in backend, cannot generate article');

      // Show local results page as fallback
      const resultUrl = `data:text/html,${encodeURIComponent(this.generateLocalResultsPage())}`;
      chrome.tabs.create({ url: resultUrl });
      return;
    }

    try {
      console.log('🚀 Creating draft article from session...');

      // Create draft article from session
      const response = await fetch(`${API_BASE_URL}/api/knowledge-base/recorder/create-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: this.sessionId,
          category: 'How-To',
          tags: ['screen-recording'],
          visibility: 'internal'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Draft article created successfully:', data);

        // Open the article in edit mode in Deskwise
        const articleUrl = `${API_BASE_URL}/knowledge/${data.data.articleId}/edit`;
        chrome.tabs.create({ url: articleUrl });

        console.log('📖 Article opened in edit mode:', articleUrl);

        // Clean up local storage
        chrome.storage.local.remove(`session_${this.sessionId}`);
      } else {
        const error = await response.text();
        console.error('❌ Failed to generate article:', response.status, error);

        // Fallback to local results page
        const resultUrl = `data:text/html,${encodeURIComponent(this.generateLocalResultsPage())}`;
        chrome.tabs.create({ url: resultUrl });
      }

    } catch (error) {
      console.error('💥 Error processing session:', error);

      // Fallback to local results page
      const resultUrl = `data:text/html,${encodeURIComponent(this.generateLocalResultsPage())}`;
      chrome.tabs.create({ url: resultUrl });
    }
  }

  generateLocalResultsPage() {
    const stepsHtml = this.steps.map(step => `
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
        <h3>Step ${step.id}: ${step.action}</h3>
        <p><strong>Description:</strong> ${step.description}</p>
        <p><strong>Element:</strong> ${step.clickData?.elementInfo?.tagName} ${step.clickData?.elementInfo?.className ? '(' + step.clickData?.elementInfo?.className + ')' : ''}</p>
        <p><strong>Time:</strong> ${new Date(step.timestamp).toLocaleTimeString()}</p>
        ${step.screenshotUrl ? `<img src="${step.screenshotUrl}" style="max-width: 400px; border: 1px solid #ccc; border-radius: 4px; margin-top: 10px;">` : ''}
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recording Session Results</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
          .session-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .error-msg { background: #fee; color: #c00; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c00; }
        </style>
      </head>
      <body>
        <h1>🎯 Recording Session Results</h1>

        <div class="error-msg">
          <strong>⚠️ Note:</strong> This is a local fallback view. The recording could not be saved to Deskwise.
          Please ensure you are logged into Deskwise at <a href="${API_BASE_URL}" target="_blank">${API_BASE_URL}</a>
        </div>

        <div class="session-info">
          <p><strong>Session ID:</strong> ${this.sessionId}</p>
          <p><strong>Steps Recorded:</strong> ${this.steps.length}</p>
          <p><strong>Duration:</strong> ${Math.round((Date.now() - this.startTime) / 1000)}s</p>
          <p><strong>Website:</strong> ${this.currentUrl || 'Unknown'}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <h2>Recorded Steps</h2>
        ${stepsHtml}
      </body>
      </html>
    `;
  }
}

// Global recording session instance
let recordingSession = new RecordingSession();

// Handle extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  if (recordingSession.isRecording) {
    await recordingSession.stop();
  } else {
    await recordingSession.start(tab.id);
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📩 Background received message:', request.action, 'from sender:', sender);

  // Handle async operations
  (async () => {
    try {
      if (request.action === 'captureScreenshot') {
        console.log('📸 Handling screenshot capture');
        await handleScreenshotCapture(request.clickData, sender.tab.id);
        sendResponse({ success: true });
      } else if (request.action === 'getRecordingState') {
        console.log('🔍 Getting recording state:', recordingSession.isRecording);
        const sessionData = recordingSession.isRecording ? {
          startTime: recordingSession.startTime,
          stepCount: recordingSession.steps.length,
          sessionId: recordingSession.sessionId,
          tabId: recordingSession.tabId
        } : null;

        sendResponse({
          success: true,
          isRecording: recordingSession.isRecording,
          sessionData: sessionData
        });
      } else if (request.action === 'startRecording') {
        console.log('▶️ Starting recording for tab:', request.tabId || sender.tab.id);
        await recordingSession.start(request.tabId || sender.tab.id);
        sendResponse({ success: true });
      } else if (request.action === 'stopRecording') {
        console.log('⏹️ Stopping recording');
        await recordingSession.stop();
        sendResponse({ success: true });
      } else {
        console.log('❓ Unknown action:', request.action);
        sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('💥 Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // Keep message channel open for async responses
});

async function handleScreenshotCapture(clickData, tabId) {
  try {
    console.log('📸 Starting screenshot capture for click:', clickData);

    // Capture the visible tab
    const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    console.log('✅ Screenshot captured');

    // Crop screenshot around clicked area
    const croppedImage = await cropScreenshot(screenshot, clickData, tabId);

    // Upload screenshot to backend if session was created
    let screenshotId = null;
    let screenshotUrl = croppedImage;

    if (recordingSession.sessionCreated) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/knowledge-base/recorder/screenshots`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            sessionId: recordingSession.sessionId,
            stepNumber: recordingSession.steps.length + 1,
            imageData: croppedImage,
            width: clickData.viewport?.width || 0,
            height: clickData.viewport?.height || 0
          })
        });

        if (response.ok) {
          const data = await response.json();
          screenshotId = data.data.screenshotId;
          screenshotUrl = `${API_BASE_URL}${data.data.url}`;
          console.log('✅ Screenshot uploaded to backend:', screenshotId);
        } else {
          console.error('❌ Failed to upload screenshot:', response.status);
        }
      } catch (error) {
        console.error('❌ Error uploading screenshot:', error);
      }
    }

    // Generate step description
    const stepDescription = generateStepDescription(clickData);
    console.log('📝 Generated step description:', stepDescription);

    // Add to recording session
    await recordingSession.addStep({
      action: `Click on ${clickData.elementInfo.tagName}`,
      description: stepDescription,
      screenshotUrl: screenshotUrl,
      screenshotId: screenshotId,
      clickData: clickData
    });

    console.log('✅ Step added to recording session');

  } catch (error) {
    console.error('💥 Error capturing screenshot:', error);

    // Still add step without screenshot
    const stepDescription = generateStepDescription(clickData);
    await recordingSession.addStep({
      action: `Click on ${clickData.elementInfo.tagName}`,
      description: stepDescription,
      screenshotUrl: null,
      screenshotId: null,
      clickData: clickData
    });
  }
}

async function cropScreenshot(screenshot, clickData, tabId) {
  try {
    console.log('✂️ Starting screenshot cropping...');

    // Inject cropping functionality into the content script
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: function(screenshot, clickData) {
        return new Promise((resolve) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const img = new Image();
          img.src = screenshot;

          img.onload = () => {
            const dpr = window.devicePixelRatio || 1;
            const cropPadding = Math.min(300, Math.max(150, Math.min(window.innerWidth, window.innerHeight) / 4));

            const adjustedX = clickData.x * dpr;
            const adjustedY = clickData.y * dpr;

            const cropX = Math.max(0, adjustedX - cropPadding);
            const cropY = Math.max(0, adjustedY - cropPadding);
            const cropWidth = Math.min(img.width - cropX, cropPadding * 2);
            const cropHeight = Math.min(img.height - cropY, cropPadding * 2);

            canvas.width = cropWidth;
            canvas.height = cropHeight;

            ctx.drawImage(
              img,
              cropX, cropY, cropWidth, cropHeight,
              0, 0, cropWidth, cropHeight
            );

            // Add click indicator
            const indicatorRadius = 15;
            const relativeClickX = adjustedX - cropX;
            const relativeClickY = adjustedY - cropY;

            if (relativeClickX >= 0 && relativeClickX <= cropWidth &&
                relativeClickY >= 0 && relativeClickY <= cropHeight) {

              ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
              ctx.beginPath();
              ctx.arc(relativeClickX, relativeClickY, indicatorRadius, 0, 2 * Math.PI);
              ctx.fill();

              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 2;
              ctx.stroke();

              ctx.fillStyle = 'white';
              ctx.beginPath();
              ctx.arc(relativeClickX, relativeClickY, 3, 0, 2 * Math.PI);
              ctx.fill();
            }

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, cropWidth, cropHeight);

            const croppedDataUrl = canvas.toDataURL('image/png', 0.9);
            console.log('✅ Screenshot cropped successfully');
            resolve(croppedDataUrl);
          };

          img.onerror = () => {
            console.error('❌ Failed to load screenshot for cropping');
            resolve(screenshot);
          };
        });
      },
      args: [screenshot, clickData]
    });

    return results[0].result;
  } catch (error) {
    console.error('💥 Error during screenshot cropping:', error);
    return screenshot;
  }
}

function generateStepDescription(clickData) {
  const element = clickData.elementInfo;

  if (element.tagName === 'BUTTON') {
    return `Click the "${element.textContent}" button`;
  } else if (element.tagName === 'A') {
    return `Click the "${element.textContent}" link`;
  } else if (element.tagName === 'INPUT') {
    return `Click on the input field${element.id ? ` (${element.id})` : ''}`;
  } else if (element.id) {
    return `Click on the element with ID "${element.id}"`;
  } else if (element.className) {
    return `Click on the ${element.tagName.toLowerCase()} with class "${element.className.split(' ')[0]}"`;
  } else {
    return `Click on the ${element.tagName.toLowerCase()} element`;
  }
}
