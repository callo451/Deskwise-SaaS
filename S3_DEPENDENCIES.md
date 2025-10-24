# S3 Storage - Package Dependencies

## Installed Packages

The following npm packages were installed for the S3 file storage implementation:

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.913.0",
    "@aws-sdk/s3-request-presigner": "^3.913.0"
  }
}
```

## Package Details

### @aws-sdk/client-s3 (v3.913.0)
- **Purpose**: AWS SDK for JavaScript S3 Client
- **Size**: ~1.2MB (minified)
- **Features**:
  - PutObject (upload files)
  - DeleteObject (delete files)
  - HeadObject (get file metadata)
  - Full TypeScript support
  - Tree-shakeable (only import what you use)

### @aws-sdk/s3-request-presigner (v3.913.0)
- **Purpose**: Generate presigned URLs for S3 objects
- **Size**: ~50KB (minified)
- **Features**:
  - Generate temporary download URLs
  - Configurable expiration time
  - Secure access without exposing credentials
  - Works with private S3 buckets

## Installation Command

If you need to reinstall these packages:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Peer Dependencies

These packages have the following peer dependencies (already satisfied by Next.js):

- `@smithy/types` (included with AWS SDK)
- `@smithy/util-utf8` (included with AWS SDK)

## Version Compatibility

- **Node.js**: >= 16.x (Next.js 15 requirement)
- **TypeScript**: >= 4.7 (Next.js 15 requirement)
- **AWS SDK v3**: Compatible with all AWS regions and services

## Security Considerations

1. **AWS Credentials**: Never commit AWS credentials to version control
2. **Environment Variables**: Store credentials in `.env.local` (gitignored)
3. **IAM Permissions**: Use least-privilege IAM policies
4. **Presigned URLs**: Keep expiration times short (default: 1 hour)

## Bundle Size Impact

Total bundle size increase: ~1.25MB (minified)

This is acceptable for server-side usage. The packages are only imported in API routes, not client-side code, so they don't affect the client bundle size.

## Alternative Options Considered

### 1. AWS SDK v2 (Legacy)
- **Why not used**: AWS SDK v3 is smaller, faster, and tree-shakeable
- **Migration**: v3 is the recommended version for new projects

### 2. Multer + Local Storage
- **Why not used**: Not suitable for multi-instance deployments
- **Limitations**: Files stored on single server, no redundancy

### 3. Third-party services (Cloudinary, Uploadcare)
- **Why not used**: Additional cost, vendor lock-in
- **When to use**: If you need advanced image processing

## Monitoring & Cost

### AWS SDK Metrics
- Monitor API calls via AWS CloudWatch
- Track S3 request counts and error rates
- Set up billing alerts for unexpected usage

### Cost Estimation
- **Storage**: ~$0.023/GB/month (S3 Standard)
- **Requests**: ~$0.005/1000 PUT requests
- **Bandwidth**: ~$0.09/GB transferred out

For 1000 tickets with 5MB average attachments:
- Storage: 5GB × $0.023 = **$0.115/month**
- Uploads: 1000 × $0.005/1000 = **$0.005/month**
- Total: **~$0.12/month**

## Development vs Production

### Development
- Use a separate S3 bucket for development
- Consider using LocalStack for local S3 emulation
- Enable debug logging for troubleshooting

### Production
- Enable S3 versioning for file recovery
- Configure lifecycle policies for old files
- Use CloudFront CDN for global distribution
- Enable S3 access logging for auditing

## Troubleshooting

### Package Installation Issues

If you encounter installation errors:

1. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

2. **Delete node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Use specific versions:**
   ```bash
   npm install @aws-sdk/client-s3@3.913.0 @aws-sdk/s3-request-presigner@3.913.0
   ```

### TypeScript Errors

If you see TypeScript errors related to AWS SDK:

1. **Ensure @types are installed:**
   ```bash
   npm install --save-dev @types/node
   ```

2. **Check tsconfig.json:**
   ```json
   {
     "compilerOptions": {
       "moduleResolution": "bundler",
       "types": ["node"]
     }
   }
   ```

## Update Strategy

### Patch Updates (3.913.x)
- Safe to update automatically
- Bug fixes and performance improvements

### Minor Updates (3.x.0)
- Review release notes
- Test in development before production
- May include new features

### Major Updates (4.x.0)
- Breaking changes likely
- Thorough testing required
- Check migration guide

## Related Documentation

- [AWS SDK for JavaScript v3 Docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3 Client Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [Presigner Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_s3_request_presigner.html)

---

**Last Updated**: January 2025
**SDK Version**: 3.913.0
