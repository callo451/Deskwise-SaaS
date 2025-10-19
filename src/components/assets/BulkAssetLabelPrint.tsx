'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Printer, QrCode, Barcode as BarcodeIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Barcode from 'react-barcode'
import { QRCodeSVG } from 'qrcode.react'

interface Asset {
  _id: string
  assetTag: string
  name: string
  location?: string
  category?: string
}

interface BulkAssetLabelPrintProps {
  assets: Asset[]
  selectedAssetIds: string[]
  onSelectionChange: (assetIds: string[]) => void
}

export function BulkAssetLabelPrint({ assets, selectedAssetIds, onSelectionChange }: BulkAssetLabelPrintProps) {
  const [labelType, setLabelType] = useState<'barcode' | 'qrcode'>('barcode')
  const [open, setOpen] = useState(false)

  const selectedAssets = assets.filter(asset => selectedAssetIds.includes(asset._id))

  const handlePrintBulk = () => {
    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) return

    const labelsHTML = selectedAssets.map(asset => `
      <div class="label-container">
        <div class="label-header">
          <p class="label-title">${asset.name}</p>
          ${asset.location || asset.category ? `
            <p class="label-subtitle">${[asset.location, asset.category].filter(Boolean).join(' • ')}</p>
          ` : ''}
        </div>
        <div class="barcode-container" id="barcode-${asset._id}"></div>
        <div class="label-footer">Asset Tag: ${asset.assetTag}</div>
      </div>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bulk Asset Labels</title>
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
              .label-container {
                page-break-after: always;
              }
              .label-container:last-child {
                page-break-after: auto;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
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
              margin: 0.25in auto;
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
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head>
        <body>
          ${labelsHTML}
          <script>
            // Generate barcodes after DOM is loaded
            ${selectedAssets.map(asset => `
              JsBarcode("#barcode-${asset._id}", "${asset.assetTag}", {
                format: "CODE128",
                width: 2,
                height: 60,
                displayValue: true,
                fontSize: 14,
                margin: 10
              });
            `).join('\n')}

            setTimeout(function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }, 500);
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={selectedAssetIds.length === 0}>
          <Printer className="w-4 h-4 mr-2" />
          Print Labels ({selectedAssetIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Print Asset Labels</DialogTitle>
          <DialogDescription>
            Print labels for {selectedAssetIds.length} selected asset{selectedAssetIds.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
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

            <Button onClick={handlePrintBulk}>
              <Printer className="w-4 h-4 mr-2" />
              Print All Labels
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedAssets.map(asset => (
              <Card key={asset._id} className="relative">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{asset.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {asset.assetTag} {asset.location && `• ${asset.location}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white border rounded p-3 flex items-center justify-center">
                    {labelType === 'barcode' ? (
                      <Barcode
                        value={asset.assetTag}
                        format="CODE128"
                        width={1.5}
                        height={40}
                        displayValue={true}
                        fontSize={12}
                        margin={5}
                        background="#ffffff"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <QRCodeSVG
                          value={asset.assetTag}
                          size={80}
                          level="H"
                          includeMargin={true}
                        />
                        <p className="text-xs font-mono font-bold">{asset.assetTag}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
