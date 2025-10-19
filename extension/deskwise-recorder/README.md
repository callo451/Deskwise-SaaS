# Deskwise Knowledge Recorder

A Chrome/Edge extension that automatically records mouse clicks and generates step-by-step guides for your Deskwise knowledge base.

## Features

- **Click Recording**: Records every mouse click with precise coordinates and element information
- **Automatic Screenshots**: Captures and crops screenshots around each click area
- **Smart Element Detection**: Identifies buttons, links, inputs, and other interactive elements
- **AI-Powered Descriptions**: Generates natural language descriptions for each step
- **Knowledge Base Integration**: Automatically creates articles in your Deskwise knowledge base
- **Visual Feedback**: Shows recording indicator and click animations
- **Session Management**: Tracks recording sessions with step counts and timestamps

## Installation

### From Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store
2. Search for "Deskwise Knowledge Recorder"
3. Click "Add to Chrome"

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `extension/deskwise-recorder` folder
5. The extension icon should appear in your toolbar

## Usage

### Starting a Recording
1. Click the Deskwise extension icon in your toolbar
2. Click "Start Recording" in the popup
3. A red recording indicator will appear on the page
4. Navigate and click on elements you want to document

### During Recording
- Each click will be captured with a screenshot
- A red circle animation shows where you clicked
- The recording indicator shows the current step count
- Press the "Stop" button in the indicator to end recording

### After Recording
- The extension automatically processes your session
- Screenshots are cropped around click areas
- AI generates step descriptions
- A new article is created in your knowledge base
- View the generated guide in Deskwise

## Configuration

### Settings (Available in Popup)
- **Auto-crop screenshots**: Automatically crop around click areas
- **Generate AI descriptions**: Use AI to create step descriptions
- **Include keyboard actions**: Record important keyboard interactions

### Deskwise Integration
The extension connects to your Deskwise instance at:
- Local development: `http://localhost:9002`
- Production: `https://your-deskwise-domain.com`

## How It Works

1. **Click Detection**: Content script listens for mouse clicks
2. **Screenshot Capture**: Background script captures visible tab
3. **Image Processing**: Screenshots are cropped around click areas
4. **Data Collection**: Element information and context is gathered
5. **AI Processing**: Steps are processed with AI for descriptions
6. **Article Creation**: Complete guide is sent to Deskwise API

## Technical Details

### Files Structure
- `manifest.json`: Extension configuration
- `background.js`: Service worker for screenshot capture
- `content.js`: Content script for click detection
- `popup.html/js`: Extension popup interface
- `recorder.css`: Styles for recording indicators

### Permissions
- `activeTab`: Access to current tab content
- `scripting`: Inject content scripts
- `storage`: Store recording sessions
- `desktopCapture`: Capture screenshots
- `tabs`: Access tab information

### Data Storage
- Recording sessions stored in Chrome's local storage
- Automatically cleaned up after processing
- No sensitive data is permanently stored

## Privacy & Security

- Only captures data during active recording sessions
- Screenshots are processed locally before upload
- No data is collected without explicit user action
- All data is sent to your own Deskwise instance

## Troubleshooting

### Extension Not Working
1. Check that developer mode is enabled
2. Verify the extension has necessary permissions
3. Try reloading the extension
4. Check browser console for errors

### Recording Issues
1. Ensure Deskwise is running and accessible
2. Check network connectivity
3. Verify popup settings are correct
4. Try refreshing the page before recording

### Generated Guides
1. Check the Knowledge Base → Sessions page
2. Verify AI service is configured in Deskwise
3. Review extension popup for error messages

## Development

### Building the Extension
1. Make changes to source files
2. Test in Chrome developer mode
3. Package for distribution if needed

### API Integration
The extension communicates with these Deskwise API endpoints:
- `POST /api/knowledge-base/recorder`: Create new guides
- `GET /api/knowledge-base/recorder`: List recorded sessions
- `GET /api/knowledge-base/sessions/{id}`: Get session details

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Contact your Deskwise administrator
4. Submit issues on the project repository

## Version History

### v1.0.0
- Initial release
- Basic click recording and screenshot capture
- AI-powered guide generation
- Knowledge base integration
- Visual recording indicators

## License

This extension is part of the Deskwise platform and follows the same licensing terms.