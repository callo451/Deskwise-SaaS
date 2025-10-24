# Amazon S3 File Storage Implementation

## Overview

This document describes the complete Amazon S3 file storage integration for the unified ticketing system in Deskwise ITSM. The implementation supports uploading, downloading, and deleting ticket attachments with proper security, validation, and RBAC integration.

## Architecture

### Components

1. **S3 Storage Service** (`src/lib/services/s3-storage.ts`)
   - Core service for S3 operations
   - File upload, download URL generation, and deletion
   - File validation (type and size)
   - S3 key generation with unique identifiers

2. **API Routes**
   - `GET/POST /api/unified-tickets/[id]/attachments` - List and upload attachments
   - `GET/DELETE /api/unified-tickets/[id]/attachments/[attachmentId]` - Download URL and delete

3. **Database Collection**
   - `unified_ticket_attachments` - Stores attachment metadata
   - Fields: id, ticketId, orgId, filename, originalFilename, fileSize, contentType, s3Key, uploadedBy, uploadedByName, uploadedAt

4. **Type Definitions** (`src/lib/types.ts`)
   - `TicketAttachment` interface with S3-specific fields

## Installation

### 1. Install Required Packages

The following packages have been installed:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Installed packages:**
- `@aws-sdk/client-s3` - AWS SDK for S3 operations
- `@aws-sdk/s3-request-presigner` - Generate presigned URLs for secure downloads

### 2. Environment Variables

Add the following to your `.env.local` file:

```env
# Amazon S3 File Storage (uses same AWS credentials as SES)
AWS_S3_BUCKET_NAME=your-s3-bucket-name
AWS_S3_REGION=us-east-1

# Existing AWS credentials (shared with SES)
AWS_SES_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SES_SECRET_ACCESS_KEY=your-aws-secret-access-key
```

**Note:** The S3 service reuses the existing AWS SES credentials (`AWS_SES_ACCESS_KEY_ID` and `AWS_SES_SECRET_ACCESS_KEY`) for authentication.

### 3. AWS S3 Bucket Setup

1. **Create S3 Bucket:**
   - Log in to AWS Console
   - Navigate to S3
   - Create a new bucket with a unique name
   - Choose the same region as your SES configuration (default: us-east-1)

2. **Configure Bucket Permissions:**
   - Block all public access (recommended for security)
   - Enable versioning (optional, for file recovery)
   - Enable server-side encryption (AES-256)

3. **IAM Policy:**
   Ensure your AWS IAM user/role has the following permissions:

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
      "Resource": "arn:aws:s3:::your-s3-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::your-s3-bucket-name"
    }
  ]
}
```

## File Organization

Files are organized in S3 using the following structure:

```
{orgId}/tickets/{ticketId}/{uniqueId}-{sanitizedFilename}
```

**Example:**
```
org_123456789/tickets/507f1f77bcf86cd799439011/a3b4c5d6-invoice.pdf
```

### Key Benefits:
- **Organization Isolation**: Files are scoped by orgId for multi-tenancy
- **Ticket Association**: Easy to identify files by ticket
- **Unique Identifiers**: Prevents filename conflicts
- **Sanitization**: Removes dangerous characters from filenames

## API Usage

### 1. Upload Attachment

**Endpoint:** `POST /api/unified-tickets/[id]/attachments`

**Request:**
```javascript
const formData = new FormData()
formData.append('file', file) // File object from input

const response = await fetch(`/api/unified-tickets/${ticketId}/attachments`, {
  method: 'POST',
  body: formData,
})

const result = await response.json()
// result.attachment contains the saved attachment metadata
```

**Response:**
```json
{
  "success": true,
  "attachment": {
    "_id": "507f1f77bcf86cd799439011",
    "id": "att_123456",
    "ticketId": "507f1f77bcf86cd799439011",
    "orgId": "org_123",
    "filename": "a3b4c5d6-invoice.pdf",
    "originalFilename": "invoice.pdf",
    "fileSize": 245678,
    "contentType": "application/pdf",
    "s3Key": "org_123/tickets/507f1f77bcf86cd799439011/a3b4c5d6-invoice.pdf",
    "uploadedBy": "user_123",
    "uploadedByName": "John Doe",
    "uploadedAt": "2025-01-15T10:30:00.000Z"
  },
  "message": "File uploaded successfully"
}
```

**Permissions Required:**
- `tickets.edit.all` OR `tickets.edit.own`

**Validation:**
- Max file size: 10MB
- Allowed file types: PDF, Office documents, images, archives (see full list below)

### 2. List Attachments

**Endpoint:** `GET /api/unified-tickets/[id]/attachments`

**Request:**
```javascript
const response = await fetch(`/api/unified-tickets/${ticketId}/attachments`)
const result = await response.json()
// result.attachments contains array of attachments
```

**Response:**
```json
{
  "success": true,
  "attachments": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "id": "att_123456",
      "ticketId": "507f1f77bcf86cd799439011",
      "filename": "a3b4c5d6-invoice.pdf",
      "originalFilename": "invoice.pdf",
      "fileSize": 245678,
      "contentType": "application/pdf",
      "s3Key": "org_123/tickets/507f1f77bcf86cd799439011/a3b4c5d6-invoice.pdf",
      "uploadedBy": "user_123",
      "uploadedByName": "John Doe",
      "uploadedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

**Permissions Required:**
- `tickets.view.all` OR `tickets.view.own`

### 3. Get Download URL

**Endpoint:** `GET /api/unified-tickets/[id]/attachments/[attachmentId]`

**Request:**
```javascript
const response = await fetch(`/api/unified-tickets/${ticketId}/attachments/${attachmentId}`)
const result = await response.json()
// result.downloadUrl is a presigned URL valid for 1 hour
```

**Response:**
```json
{
  "success": true,
  "downloadUrl": "https://your-bucket.s3.amazonaws.com/org_123/tickets/.../invoice.pdf?X-Amz-Algorithm=...",
  "attachment": {
    "id": "att_123456",
    "filename": "invoice.pdf",
    "fileSize": 245678,
    "contentType": "application/pdf",
    "uploadedBy": "John Doe",
    "uploadedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Permissions Required:**
- `tickets.view.all` OR `tickets.view.own`

**URL Expiration:** 1 hour (3600 seconds)

### 4. Delete Attachment

**Endpoint:** `DELETE /api/unified-tickets/[id]/attachments/[attachmentId]`

**Request:**
```javascript
const response = await fetch(`/api/unified-tickets/${ticketId}/attachments/${attachmentId}`, {
  method: 'DELETE',
})
const result = await response.json()
```

**Response:**
```json
{
  "success": true,
  "message": "Attachment deleted successfully"
}
```

**Permissions Required:**
- `tickets.delete` OR `tickets.edit.all`

**Effect:** Deletes file from both S3 and database

## File Validation

### Allowed File Types

The following MIME types are allowed by default:

**Documents:**
- `application/pdf`
- `application/msword` (DOC)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX)
- `application/vnd.ms-excel` (XLS)
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (XLSX)
- `application/vnd.ms-powerpoint` (PPT)
- `application/vnd.openxmlformats-officedocument.presentationml.presentation` (PPTX)
- `text/plain` (TXT)
- `text/csv` (CSV)

**Images:**
- `image/jpeg` (JPG, JPEG)
- `image/png` (PNG)
- `image/gif` (GIF)
- `image/webp` (WEBP)
- `image/svg+xml` (SVG)

**Archives:**
- `application/zip` (ZIP)
- `application/x-zip-compressed` (ZIP)
- `application/x-rar-compressed` (RAR)
- `application/x-7z-compressed` (7Z)

**Other:**
- `application/json` (JSON)
- `application/xml` (XML)
- `text/xml` (XML)

### Size Limits

- **Maximum file size:** 10MB per file
- **Configurable:** Change `MAX_FILE_SIZE` in the upload route

### Custom Validation

To customize allowed file types, modify the `validateFileType` method in `S3StorageService`:

```typescript
const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  // Add more types...
]

S3StorageService.validateFileType(file.type, allowedTypes)
```

## Security Features

### 1. Multi-Tenancy
- All files are scoped by organization ID (`orgId`)
- API routes verify organization ownership
- Database queries include `orgId` filter

### 2. RBAC Integration
- Upload requires `tickets.edit.all` or `tickets.edit.own`
- View/Download requires `tickets.view.all` or `tickets.view.own`
- Delete requires `tickets.delete` or `tickets.edit.all`

### 3. Presigned URLs
- Download URLs are temporary (1 hour expiration)
- No direct S3 access required
- S3 bucket can remain private

### 4. Server-Side Encryption
- All files encrypted at rest with AES-256
- Automatic encryption via S3 configuration

### 5. File Sanitization
- Filenames sanitized to remove dangerous characters
- Unique identifiers prevent filename conflicts
- Length limits prevent abuse

## Database Schema

### Collection: `unified_ticket_attachments`

```typescript
{
  _id: ObjectId,              // MongoDB document ID
  id: string,                 // Unique attachment ID
  ticketId: string,           // Parent ticket ID
  orgId: string,              // Organization ID (multi-tenancy)
  filename: string,           // Sanitized filename in S3
  originalFilename: string,   // Original uploaded filename
  fileSize: number,           // File size in bytes
  contentType: string,        // MIME type
  s3Key: string,              // S3 object key (full path)
  uploadedBy: string,         // User ID who uploaded
  uploadedByName: string,     // User display name
  uploadedAt: Date,           // Upload timestamp
}
```

### Indexes (Recommended)

Create these indexes for optimal performance:

```javascript
db.unified_ticket_attachments.createIndex({ orgId: 1, ticketId: 1 })
db.unified_ticket_attachments.createIndex({ orgId: 1, id: 1 }, { unique: true })
db.unified_ticket_attachments.createIndex({ s3Key: 1 })
```

## Error Handling

### Common Errors

1. **AWS Credentials Missing**
   ```
   Error: AWS credentials not configured
   ```
   - Solution: Set `AWS_SES_ACCESS_KEY_ID` and `AWS_SES_SECRET_ACCESS_KEY` in `.env.local`

2. **S3 Bucket Not Configured**
   ```
   Error: S3 bucket name not configured
   ```
   - Solution: Set `AWS_S3_BUCKET_NAME` in `.env.local`

3. **File Too Large**
   ```
   Error: File size exceeds 10MB limit
   ```
   - Solution: Reduce file size or increase `MAX_FILE_SIZE` limit

4. **Invalid File Type**
   ```
   Error: File type not allowed
   ```
   - Solution: Use an allowed file type or update validation rules

5. **Permission Denied**
   ```
   Error: Insufficient permissions
   ```
   - Solution: Ensure user has required RBAC permissions

## File Paths Reference

### Created Files

1. **Service:**
   - `C:\Users\User\Desktop\Projects\Deskwise\src\lib\services\s3-storage.ts`

2. **API Routes:**
   - `C:\Users\User\Desktop\Projects\Deskwise\src\app\api\unified-tickets\[id]\attachments\route.ts`
   - `C:\Users\User\Desktop\Projects\Deskwise\src\app\api\unified-tickets\[id]\attachments\[attachmentId]\route.ts`

3. **Type Definitions:**
   - Updated: `C:\Users\User\Desktop\Projects\Deskwise\src\lib\types.ts` (TicketAttachment interface)

4. **Environment:**
   - Updated: `C:\Users\User\Desktop\Projects\Deskwise\.env.local` (S3 configuration)

5. **Documentation:**
   - `C:\Users\User\Desktop\Projects\Deskwise\S3_STORAGE_IMPLEMENTATION.md` (this file)

### Dependencies Added

```json
{
  "@aws-sdk/client-s3": "^3.913.0",
  "@aws-sdk/s3-request-presigner": "^3.913.0"
}
```

## Testing

### Manual Testing Steps

1. **Upload Test:**
   ```bash
   curl -X POST http://localhost:9002/api/unified-tickets/{ticketId}/attachments \
     -H "Cookie: your-session-cookie" \
     -F "file=@/path/to/test-file.pdf"
   ```

2. **List Test:**
   ```bash
   curl http://localhost:9002/api/unified-tickets/{ticketId}/attachments \
     -H "Cookie: your-session-cookie"
   ```

3. **Download URL Test:**
   ```bash
   curl http://localhost:9002/api/unified-tickets/{ticketId}/attachments/{attachmentId} \
     -H "Cookie: your-session-cookie"
   ```

4. **Delete Test:**
   ```bash
   curl -X DELETE http://localhost:9002/api/unified-tickets/{ticketId}/attachments/{attachmentId} \
     -H "Cookie: your-session-cookie"
   ```

### Frontend Integration Example

```typescript
// Upload component
const handleFileUpload = async (file: File, ticketId: string) => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch(`/api/unified-tickets/${ticketId}/attachments`, {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    if (result.success) {
      console.log('Uploaded:', result.attachment)
      // Refresh attachment list
    } else {
      console.error('Upload failed:', result.error)
    }
  } catch (error) {
    console.error('Upload error:', error)
  }
}

// Download component
const handleDownload = async (ticketId: string, attachmentId: string) => {
  try {
    const response = await fetch(`/api/unified-tickets/${ticketId}/attachments/${attachmentId}`)
    const result = await response.json()

    if (result.success) {
      // Open presigned URL in new tab
      window.open(result.downloadUrl, '_blank')
    }
  } catch (error) {
    console.error('Download error:', error)
  }
}

// Delete component
const handleDelete = async (ticketId: string, attachmentId: string) => {
  if (!confirm('Are you sure you want to delete this attachment?')) return

  try {
    const response = await fetch(`/api/unified-tickets/${ticketId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    })

    const result = await response.json()
    if (result.success) {
      console.log('Deleted successfully')
      // Refresh attachment list
    }
  } catch (error) {
    console.error('Delete error:', error)
  }
}
```

## Best Practices

1. **Always validate files on the server side** - Never trust client-side validation alone
2. **Use presigned URLs for downloads** - Keeps S3 bucket private and secure
3. **Implement proper error handling** - Provide clear feedback to users
4. **Monitor S3 costs** - Set up billing alerts for unexpected usage
5. **Regular cleanup** - Consider implementing a cleanup job for orphaned files
6. **Backup strategy** - Enable S3 versioning or cross-region replication for critical files

## Future Enhancements

1. **Image Thumbnails:** Generate thumbnails for image attachments
2. **Virus Scanning:** Integrate ClamAV or AWS GuardDuty for malware detection
3. **File Preview:** Add in-browser preview for PDFs and images
4. **Bulk Operations:** Support uploading/downloading multiple files at once
5. **Progress Indicators:** Show upload progress for large files
6. **File Versioning:** Track file version history
7. **CDN Integration:** Use CloudFront for faster global downloads

## Troubleshooting

### Issue: "Access Denied" errors from S3

**Cause:** IAM permissions insufficient

**Solution:**
1. Verify IAM policy includes required S3 actions
2. Check bucket name matches configuration
3. Ensure credentials are correct

### Issue: Presigned URLs not working

**Cause:** Clock skew or expired credentials

**Solution:**
1. Sync server time with NTP
2. Regenerate AWS credentials
3. Check URL hasn't expired (1 hour default)

### Issue: Files not deleting properly

**Cause:** Orphaned S3 objects

**Solution:**
1. Verify S3 key matches database record
2. Check IAM delete permissions
3. Use AWS Console to manually verify deletion

## Support

For issues or questions:
1. Check AWS CloudWatch logs for S3 API errors
2. Review Next.js server logs for application errors
3. Verify environment variables are set correctly
4. Test AWS credentials with AWS CLI: `aws s3 ls s3://your-bucket-name`

---

**Implementation Date:** January 2025
**Version:** 1.0.0
**Author:** Deskwise Development Team
