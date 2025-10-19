# Asset Barcode System Documentation

## Overview

The Deskwise ITAM platform now includes a comprehensive barcode system for asset tracking. Each asset can generate printable labels with either **CODE128 barcodes** or **QR codes**, optimized for universal label printers.

## Features

### 1. Individual Asset Labels
- **Location**: Asset Details Page (`/dashboard/assets/[id]`)
- **Position**: Prominently placed between the hero card and performance monitoring section
- **Features**:
  - Toggle between Barcode (CODE128) and QR Code formats
  - Real-time preview of the label
  - Download as SVG for editing
  - Direct printing to label printers
  - Includes asset name, location, category, and asset tag

### 2. Barcode/QR Code Toggle
- **Barcode (CODE128)**:
  - Standard 1D barcode format
  - Compatible with all barcode scanners
  - Displays asset tag below the barcode
  - Optimized width and height for readability

- **QR Code**:
  - 2D matrix barcode
  - Supports mobile scanning
  - High error correction level (Level H)
  - Includes margin for scanning reliability

### 3. Label Specifications
- **Size**: 4 inches (width) × 2 inches (height)
- **Format**: Standard label printer dimensions
- **Content**:
  - Header: Asset name and location/category
  - Center: Barcode or QR code
  - Footer: Asset tag in text format
- **Print-ready**: Optimized for Zebra, Dymo, Brother, and other label printers

### 4. Print Features
- **Direct Printing**: Opens browser print dialog with correct page size
- **Download SVG**: Export barcode/QR code as scalable vector graphic
- **Print Stylesheet**: Custom CSS for label dimensions
- **Auto-close**: Print window closes after printing

## Components

### AssetBarcodeLabel Component
**File**: `src/components/assets/AssetBarcodeLabel.tsx`

**Props**:
```typescript
interface AssetBarcodeLabelProps {
  assetTag: string      // The asset tag to encode
  assetName: string     // Display name of the asset
  location?: string     // Asset location
  category?: string     // Asset category
}
```

**Features**:
- State management for barcode/QR code toggle
- Print functionality with custom page size
- SVG download capability
- Responsive design with preview

### BulkAssetLabelPrint Component (Bonus)
**File**: `src/components/assets/BulkAssetLabelPrint.tsx`

**Features**:
- Print multiple asset labels at once
- Preview all selected labels before printing
- Same barcode/QR code toggle
- Optimized for batch printing operations

**Props**:
```typescript
interface BulkAssetLabelPrintProps {
  assets: Asset[]              // Array of assets
  selectedAssetIds: string[]   // IDs of selected assets
  onSelectionChange: (assetIds: string[]) => void
}
```

## Integration

### Asset Details Page
The barcode label is integrated into the asset details page at:
`src/app/dashboard/assets/[id]/page.tsx`

**Location**: Immediately after the hero card (asset overview)

**Code**:
```tsx
<AssetBarcodeLabel
  assetTag={asset.assetTag}
  assetName={asset.name}
  location={asset.location}
  category={asset.category}
/>
```

## Dependencies

### NPM Packages
1. **react-barcode** (v2.0.0+)
   - Generates CODE128 barcodes
   - SVG output for scalability
   - Customizable appearance

2. **qrcode.react** (v4.0.0+)
   - Generates QR codes as SVG
   - Multiple error correction levels
   - Responsive sizing

### Installation
```bash
npm install react-barcode qrcode.react
```

## Label Printer Compatibility

### Supported Printers
- ✅ Zebra ZD series (ZD410, ZD420, ZD620)
- ✅ Dymo LabelWriter series
- ✅ Brother QL series
- ✅ Rollo Label Printer
- ✅ Any printer supporting 4" × 2" labels

### Print Settings
1. **Paper Size**: 4 inches × 2 inches
2. **Orientation**: Portrait
3. **Margins**: 0 (borderless)
4. **Scale**: 100%

### Browser Print Dialog
The system automatically:
- Sets correct page dimensions
- Removes margins
- Optimizes for label printers
- Triggers print dialog

## Usage Guide

### For End Users

#### Printing Individual Asset Labels
1. Navigate to asset details page
2. Scroll to "Asset Label" section (below asset overview)
3. Choose label type:
   - Click "Barcode" for CODE128 barcode
   - Click "QR Code" for QR code format
4. Preview the label in the card
5. Click "Print Label" to print
6. Or click "Download" to save as SVG

#### Label Information
Each label includes:
- **Top**: Asset name and location/category
- **Center**: Barcode or QR code with asset tag
- **Bottom**: Text representation of asset tag

### For Administrators

#### Bulk Printing (Future Feature)
The `BulkAssetLabelPrint` component can be integrated into the assets list page for batch operations:
1. Select multiple assets
2. Click "Print Labels" button
3. Choose barcode or QR code format
4. Preview all labels
5. Print all at once

## Technical Details

### Barcode Format (CODE128)
- **Type**: 1D linear barcode
- **Character Set**: Full ASCII (128 characters)
- **Width**: 2 pixels per bar
- **Height**: 60 pixels
- **Human-readable**: Yes (displayed below)
- **Margins**: 10 pixels

### QR Code Format
- **Type**: 2D matrix barcode
- **Size**: 120×120 pixels (adjustable)
- **Error Correction**: Level H (30% recovery)
- **Margin**: Included automatically
- **Encoding**: UTF-8

### Print Window Implementation
```javascript
// Opens custom print window
const printWindow = window.open('', '', 'width=800,height=600')

// Sets page size and styles
@page {
  size: 4in 2in;
  margin: 0;
}

// Auto-triggers print
window.print()

// Closes after printing
window.onafterprint = function() {
  window.close()
}
```

## Design Considerations

### Layout Integration
The barcode label card is positioned strategically:
- ✅ **Prominent**: Visible without scrolling (after hero card)
- ✅ **Contextual**: Near asset identification information
- ✅ **Non-intrusive**: Doesn't block critical data
- ✅ **Responsive**: Adapts to mobile and tablet screens

### Visual Design
- **Border**: Dashed border for print preview indicator
- **Background**: White card with light border
- **Typography**: Clear, readable fonts
- **Icons**: Lucide icons for actions
- **Spacing**: Proper padding for label elements

### Accessibility
- Clear action buttons with icons
- High contrast for barcode readability
- Descriptive labels and tooltips
- Keyboard-accessible controls

## Future Enhancements

### Potential Additions
1. **Custom Label Templates**
   - Multiple label sizes
   - Custom fields
   - Logo placement

2. **Batch Generation**
   - CSV import for bulk labels
   - Template management
   - Print queue

3. **Advanced Barcodes**
   - Code 39
   - Data Matrix
   - PDF417

4. **Label History**
   - Track printed labels
   - Reprint history
   - Label versioning

5. **Integration**
   - API endpoint for label generation
   - Mobile app scanning
   - Automated inventory checks

## Troubleshooting

### Common Issues

#### Labels Not Printing
- Check printer is connected and powered on
- Verify label size matches printer settings (4" × 2")
- Enable pop-ups in browser for print window
- Try different browser (Chrome recommended)

#### Barcode Not Scanning
- Ensure adequate lighting
- Check barcode hasn't been damaged
- Verify scanner supports CODE128
- Increase barcode size if too small

#### QR Code Not Scanning
- Use high-quality print settings
- Ensure adequate contrast
- Check camera/scanner supports QR codes
- Verify asset tag is valid

#### Download Not Working
- Check browser allows downloads
- Verify SVG file opens correctly
- Try different file viewer
- Check disk space

## Best Practices

### Printing
1. Use high-quality label paper
2. Clean printer regularly
3. Test print before bulk operations
4. Store labels properly (cool, dry place)

### Asset Tagging
1. Place labels on flat, clean surfaces
2. Avoid curved or textured surfaces
3. Position for easy scanning
4. Protect from moisture and abrasion

### Barcode Selection
- **Use Barcodes** for: Traditional scanners, long-range scanning
- **Use QR Codes** for: Mobile devices, storing additional data

## Support

For issues or questions about the barcode system:
1. Check this documentation
2. Review component source code
3. Test with different browsers
4. Verify printer compatibility

## Version History

- **v1.0** (October 2025)
  - Initial implementation
  - CODE128 barcode support
  - QR code support
  - Individual label printing
  - Download as SVG
  - Responsive design
  - Universal label printer compatibility
