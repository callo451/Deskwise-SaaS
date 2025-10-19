'use client'

import { useRef, useState } from 'react'
import Barcode from 'react-barcode'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Printer, Download, QrCode, Barcode as BarcodeIcon } from 'lucide-react'

interface AssetBarcodeLabelProps {
  assetTag: string
  assetName: string
  location?: string
  category?: string
}

export function AssetBarcodeLabel({ assetTag, assetName, location, category }: AssetBarcodeLabelProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [labelType, setLabelType] = useState<'barcode' | 'qrcode'>('barcode')

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Asset Label - ${assetTag}</title>
          <style>
            @page {
              size: 4in 2in;
              margin: 0;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .label-container {
              width: 4in;
              height: 2in;
              border: 2px dashed #ccc;
              padding: 0.25in;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: white;
            }
            .label-header {
              text-align: center;
              margin-bottom: 0.1in;
            }
            .label-title {
              font-size: 10pt;
              font-weight: bold;
              margin: 0;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .label-subtitle {
              font-size: 8pt;
              color: #666;
              margin: 2px 0 0 0;
            }
            .barcode-container {
              display: flex;
              justify-content: center;
              align-items: center;
              flex: 1;
            }
            .barcode-container svg {
              max-width: 100%;
              max-height: 0.8in;
            }
            .label-footer {
              text-align: center;
              font-size: 7pt;
              color: #666;
              border-top: 1px solid #eee;
              padding-top: 0.05in;
              margin-top: 0.05in;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 250);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownloadSVG = () => {
    const svg = printRef.current?.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)
    const downloadLink = document.createElement('a')
    downloadLink.href = svgUrl
    downloadLink.download = `asset-label-${labelType}-${assetTag}.svg`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(svgUrl)
  }

  return (
    <Card className="border-2 border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Asset Label</CardTitle>
            <CardDescription>Printable {labelType === 'barcode' ? 'barcode' : 'QR code'} label for asset tracking</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="flex border rounded-lg">
              <Button
                variant={labelType === 'barcode' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setLabelType('barcode')}
              >
                <BarcodeIcon className="w-4 h-4 mr-2" />
                Barcode
              </Button>
              <Button
                variant={labelType === 'qrcode' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-l-none border-l"
                onClick={() => setLabelType('qrcode')}
              >
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadSVG}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print Label
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={printRef} className="bg-white border rounded-lg p-4">
          <div className="label-header">
            <p className="label-title">{assetName}</p>
            {(location || category) && (
              <p className="label-subtitle">
                {[location, category].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>
          <div className="barcode-container">
            {labelType === 'barcode' ? (
              <Barcode
                value={assetTag}
                format="CODE128"
                width={2}
                height={60}
                displayValue={true}
                fontSize={14}
                margin={10}
                background="#ffffff"
              />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <QRCodeSVG
                  value={assetTag}
                  size={120}
                  level="H"
                  includeMargin={true}
                />
                <p className="text-sm font-mono font-bold">{assetTag}</p>
              </div>
            )}
          </div>
          <div className="label-footer">
            Asset Tag: {assetTag}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
