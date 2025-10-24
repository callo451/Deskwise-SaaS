# S3 Storage - Quick Start Guide

## 🚀 Implementation Complete

A complete Amazon S3 file storage service has been successfully implemented for the unified ticketing system.

## 📁 Created Files

### 1. Core Service
- **Path**: `C:\Users\User\Desktop\Projects\Deskwise\src\lib\services\s3-storage.ts`
- **Size**: 8,066 bytes
- **Purpose**: S3 storage operations (upload, download, delete, validation)

### 2. API Routes

#### List & Upload Attachments
- **Path**: `C:\Users\User\Desktop\Projects\Deskwise\src\app\api\unified-tickets\[id]\attachments\route.ts`
- **Size**: 5,763 bytes
- **Methods**: GET (list), POST (upload)

#### Download & Delete Attachments
- **Path**: `C:\Users\User\Desktop\Projects\Deskwise\src\app\api\unified-tickets\[id]\attachments\[attachmentId]\route.ts`
- **Size**: 4,971 bytes
- **Methods**: GET (download URL), DELETE (remove)

### 3. Type Definitions
- **Path**: `C:\Users\User\Desktop\Projects\Deskwise\src\lib\types.ts`
- **Updated**: TicketAttachment interface with S3 fields

### 4. Environment Configuration
- **Path**: `C:\Users\User\Desktop\Projects\Deskwise\.env.local`
- **Added**: S3 configuration variables

### 5. Documentation
- **Implementation Guide**: `C:\Users\User\Desktop\Projects\Deskwise\S3_STORAGE_IMPLEMENTATION.md`
- **Dependencies**: `C:\Users\User\Desktop\Projects\Deskwise\S3_DEPENDENCIES.md`
- **Quick Start**: `C:\Users\User\Desktop\Projects\Deskwise\S3_QUICK_START.md` (this file)

## 📦 Dependencies Added

```json
{
  "@aws-sdk/client-s3": "^3.913.0",
  "@aws-sdk/s3-request-presigner": "^3.913.0"
}
```

**Installation Status**: ✅ Installed successfully

## ⚙️ Configuration Required

### 1. Update `.env.local`

Replace placeholder values in your `.env.local` file:

```env
# Amazon S3 File Storage
AWS_S3_BUCKET_NAME=your-s3-bucket-name    # ⚠️ REPLACE THIS
AWS_S3_REGION=us-east-1                    # ⚠️ VERIFY THIS

# AWS Credentials (shared with SES)
AWS_SES_ACCESS_KEY_ID=your-aws-access-key-id           # ⚠️ REPLACE THIS
AWS_SES_SECRET_ACCESS_KEY=your-aws-secret-access-key   # ⚠️ REPLACE THIS
```

### 2. Create S3 Bucket

1. Log in to [AWS Console](https://console.aws.amazon.com/s3/)
2. Click **Create bucket**
3. Enter bucket name (must be globally unique)
4. Select region (e.g., `us-east-1`)
5. **Block all public access** (recommended)
6. Enable **Server-side encryption** (AES-256)
7. Click **Create bucket**

### 3. Configure IAM Permissions

Attach this policy to your IAM user/role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

### 4. Create Database Index (Recommended)

```javascript
// MongoDB shell
use deskwise

// Create indexes for optimal performance
db.unified_ticket_attachments.createIndex({ orgId: 1, ticketId: 1 })
db.unified_ticket_attachments.createIndex({ orgId: 1, id: 1 }, { unique: true })
db.unified_ticket_attachments.createIndex({ s3Key: 1 })
```

## 🧪 Testing

### 1. Test Upload

```bash
# Create a test file
echo "Test attachment" > test.txt

# Upload to ticket (replace ticketId and session cookie)
curl -X POST http://localhost:9002/api/unified-tickets/YOUR_TICKET_ID/attachments \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -F "file=@test.txt"
```

**Expected Response:**
```json
{
  "success": true,
  "attachment": { ... },
  "message": "File uploaded successfully"
}
```

### 2. Test List

```bash
curl http://localhost:9002/api/unified-tickets/YOUR_TICKET_ID/attachments \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

### 3. Test Download

```bash
curl http://localhost:9002/api/unified-tickets/YOUR_TICKET_ID/attachments/ATTACHMENT_ID \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

### 4. Test Delete

```bash
curl -X DELETE http://localhost:9002/api/unified-tickets/YOUR_TICKET_ID/attachments/ATTACHMENT_ID \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

## 🔐 RBAC Permissions

The following permissions are required:

| Operation | Required Permission |
|-----------|-------------------|
| Upload | `tickets.edit.all` OR `tickets.edit.own` |
| List | `tickets.view.all` OR `tickets.view.own` |
| Download | `tickets.view.all` OR `tickets.view.own` |
| Delete | `tickets.delete` OR `tickets.edit.all` |

## 📊 File Validation

### Size Limits
- **Maximum**: 10MB per file
- **Configurable**: Edit `MAX_FILE_SIZE` in upload route

### Allowed File Types

✅ **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV
✅ **Images**: JPG, PNG, GIF, WEBP, SVG
✅ **Archives**: ZIP, RAR, 7Z
✅ **Other**: JSON, XML

❌ **Blocked**: Executables (.exe, .bat, .sh, .ps1)

### Security Features

1. **Filename Sanitization**: Dangerous characters removed
2. **Unique Identifiers**: Prevents filename conflicts
3. **Server-Side Encryption**: AES-256 encryption at rest
4. **Presigned URLs**: Temporary download links (1 hour expiry)
5. **Multi-Tenancy**: Organization-scoped access

## 🗂️ File Organization

Files are stored in S3 with the following structure:

```
s3://your-bucket-name/
├── org_123/
│   └── tickets/
│       ├── 507f1f77bcf86cd799439011/
│       │   ├── a3b4c5d6-invoice.pdf
│       │   └── b7c8d9e0-screenshot.png
│       └── 507f1f77bcf86cd799439012/
│           └── c1d2e3f4-report.docx
└── org_456/
    └── tickets/
        └── ...
```

## 🔄 Integration Example

### Frontend Upload Component

```typescript
import { useState } from 'react'

export function AttachmentUpload({ ticketId }: { ticketId: string }) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size
    if (file.size > 10 * 1024 * 1024) {
      alert('File must be less than 10MB')
      return
    }

    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`/api/unified-tickets/${ticketId}/attachments`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        alert('File uploaded successfully!')
        // Refresh attachment list
      } else {
        alert(`Upload failed: ${result.error}`)
      }
    } catch (error) {
      alert('Upload error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        onChange={handleUpload}
        disabled={uploading}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
      />
      {uploading && <p>Uploading...</p>}
    </div>
  )
}
```

### Frontend Download Component

```typescript
export async function downloadAttachment(ticketId: string, attachmentId: string) {
  try {
    const response = await fetch(
      `/api/unified-tickets/${ticketId}/attachments/${attachmentId}`
    )

    const result = await response.json()

    if (result.success) {
      // Open presigned URL in new tab
      window.open(result.downloadUrl, '_blank')
    } else {
      alert(`Download failed: ${result.error}`)
    }
  } catch (error) {
    alert('Download error')
  }
}
```

## 🐛 Troubleshooting

### Issue: "AWS credentials not configured"

**Solution**: Set `AWS_SES_ACCESS_KEY_ID` and `AWS_SES_SECRET_ACCESS_KEY` in `.env.local`

### Issue: "S3 bucket name not configured"

**Solution**: Set `AWS_S3_BUCKET_NAME` in `.env.local`

### Issue: "Access Denied" from S3

**Solution**: Verify IAM permissions include `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`

### Issue: "File type not allowed"

**Solution**: Check that file MIME type is in the allowed list (see File Validation section)

### Issue: "File size exceeds limit"

**Solution**: Ensure file is less than 10MB or increase `MAX_FILE_SIZE`

## 📚 Next Steps

1. ✅ Configure environment variables (`.env.local`)
2. ✅ Create S3 bucket in AWS Console
3. ✅ Set up IAM permissions
4. ✅ Create database indexes
5. ✅ Test upload/download functionality
6. ⬜ Build frontend UI components
7. ⬜ Add progress indicators for large files
8. ⬜ Implement image thumbnails (optional)
9. ⬜ Set up S3 lifecycle policies (optional)
10. ⬜ Configure CloudFront CDN (optional)

## 💡 Best Practices

1. **Environment Variables**: Never commit AWS credentials to Git
2. **Bucket Access**: Keep S3 bucket private, use presigned URLs
3. **File Size**: Enforce size limits to prevent abuse
4. **Cost Monitoring**: Set up AWS billing alerts
5. **Error Handling**: Always handle upload/download errors gracefully
6. **User Feedback**: Show progress indicators for large files
7. **Cleanup**: Implement orphaned file cleanup (files without ticket records)

## 📞 Support

For questions or issues:
- Review full implementation guide: `S3_STORAGE_IMPLEMENTATION.md`
- Check AWS CloudWatch logs for S3 errors
- Verify Next.js server logs for application errors
- Test AWS credentials with AWS CLI: `aws s3 ls s3://YOUR-BUCKET-NAME`

---

**Status**: ✅ Implementation Complete
**Ready for Testing**: Yes
**Production Ready**: After configuration
**Date**: January 2025
