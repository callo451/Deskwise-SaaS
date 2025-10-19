# Accounting Integrations Troubleshooting Guide

## Table of Contents
- [Common Error Messages](#common-error-messages)
- [OAuth Flow Issues](#oauth-flow-issues)
- [Sync Failures](#sync-failures)
- [Token Refresh Issues](#token-refresh-issues)
- [Rate Limit Handling](#rate-limit-handling)
- [Data Mapping Conflicts](#data-mapping-conflicts)
- [Webhook Troubleshooting](#webhook-troubleshooting)
- [Performance Issues](#performance-issues)
- [Support Escalation](#support-escalation)

---

## Common Error Messages

### "No accounting integration connected"

**Error Code**: `NO_INTEGRATION`

**Cause**: Organization doesn't have an active accounting integration.

**Solutions**:
1. Go to **Settings > Integrations > Accounting**
2. Connect to Xero, QuickBooks, or MYOB
3. Complete OAuth authorization
4. Verify status shows "Connected"

**API Response**:
```json
{
  "error": "No accounting integration connected",
  "code": "NO_INTEGRATION"
}
```

---

### "Client must be synced before invoice"

**Error Code**: `CLIENT_NOT_SYNCED`

**Cause**: Attempting to sync an invoice before the associated client/customer has been synced.

**Solutions**:

**Automatic (Recommended)**:
- Enable "Auto-sync clients" in integration settings
- Deskwise will automatically sync clients when syncing invoices

**Manual**:
1. Identify the client ID from error message
2. Go to **Clients** page
3. Find the client
4. Click **Sync to [Platform]**
5. Wait for sync to complete
6. Retry invoice sync

**API**:
```bash
# Sync client first
curl -X POST /api/integrations/accounting/sync/client \
  -d '{"clientId": "65a1b2c3d4e5f6789012999"}'

# Then sync invoice
curl -X POST /api/integrations/accounting/sync/invoice \
  -d '{"invoiceId": "65a1b2c3d4e5f6789012345"}'
```

---

### "Account code required"

**Error Code**: `MAPPING_NOT_FOUND`

**Cause**: Income account not mapped for product category.

**Solutions**:
1. Go to **Settings > Integrations > Accounting > Mappings**
2. Select **Account Mapping** tab
3. For each product category, select income account:
   - **Managed Services** → Account 4-1100 (or similar)
   - **Professional Services** → Account 4-1200
   - **Hardware** → Account 4-2100
4. Click **Save Mappings**
5. Retry sync

**Default Account**:
- Set a default income account in **General Settings** to use when specific mapping doesn't exist

---

### "Tax code not found"

**Error Code**: `XERO_VALIDATION_ERROR`, `QB_VALIDATION_ERROR`, `MYOB_TAX_CODE_INVALID`

**Cause**: Tax code used in Deskwise doesn't exist in accounting platform.

**Solutions**:

**For Xero**:
1. Log in to Xero
2. Go to **Settings > General Settings > Tax Rates**
3. Verify tax codes exist (e.g., "GST", "OUTPUT", "FRE")
4. Note exact code names (case-sensitive)
5. In Deskwise: **Settings > Integrations > Tax Mapping**
6. Map Deskwise tax rates to exact Xero codes

**For QuickBooks**:
1. Log in to QuickBooks
2. Go to **Taxes > Sales Tax**
3. Verify tax codes are active
4. Map in Deskwise to QB tax codes

**For MYOB**:
1. Log in to MYOB
2. Go to **Lists > Tax Codes**
3. Verify codes (e.g., "GST" for 10%, "FRE" for 0%)
4. Map exactly in Deskwise (case-sensitive)

---

### "Invoice number already exists"

**Error Code**: `DUPLICATE_EXTERNAL_ID`

**Cause**: Invoice number conflicts with existing invoice in accounting platform.

**Solutions**:

**Option 1 - Change Invoice Number**:
1. In Deskwise, edit the invoice
2. Change invoice number to unique value
3. Save and retry sync

**Option 2 - Link to Existing**:
1. If invoice legitimately exists in both systems
2. Use "Force Resync" to link them
3. Go to invoice > Integration dropdown > Force Resync

**Option 3 - Use Platform Numbering**:
1. Go to **Settings > Integrations > Invoice Settings**
2. Enable "Use platform auto-numbering"
3. Platform will assign numbers instead of Deskwise

---

### "Authentication expired"

**Error Code**: `TOKEN_EXPIRED`

**Cause**: OAuth access token has expired and refresh failed.

**Solutions**:
1. Go to **Settings > Integrations > Accounting**
2. Click **Reconnect**
3. Re-authorize with accounting platform
4. Verify status shows "Connected"

**Note**: This should not happen normally as Deskwise auto-refreshes tokens. If it persists, contact support.

---

### "Rate limit exceeded"

**Error Code**: `XERO_RATE_LIMIT`, `QB_RATE_LIMIT`, Platform-specific

**Cause**: Too many API requests to accounting platform.

**What Deskwise Does**:
- Automatically queues requests
- Uses exponential backoff
- Retries when limit resets

**What You Can Do**:
- Wait for queue to process (typically 5-60 minutes)
- Reduce bulk sync volume
- Schedule syncs during off-peak hours

**Platform Limits**:
- **Xero**: 60 requests/min, 5000/day
- **QuickBooks**: 500 requests/min (with burst limits)
- **MYOB**: 1000 requests/day, 5/second

---

## OAuth Flow Issues

### "Redirect URI mismatch"

**Symptoms**: OAuth authorization fails with redirect error.

**Causes & Solutions**:

**Cause 1: URL Mismatch**
- Redirect URI in app doesn't match configured URL
- **Solution**: Verify exact match (including trailing slash)

**Cause 2: HTTP vs HTTPS**
- Using HTTP in production
- **Solution**: Always use HTTPS in production

**Cause 3: Subdomain Difference**
- App configured for `app.deskwise.com` but using `www.deskwise.com`
- **Solution**: Update app or use correct subdomain

**How to Fix**:
1. Check current redirect URI in browser error
2. Log in to platform developer portal (Xero/QB/MYOB)
3. Update redirect URI to match exactly
4. Save changes
5. Retry OAuth flow

---

### "Invalid client credentials"

**Symptoms**: OAuth fails with "invalid client" error.

**Causes & Solutions**:

**Cause 1: Wrong Credentials**
- Using sandbox credentials in production (or vice versa)
- **Solution**: Verify environment matches credentials

**Cause 2: Expired/Revoked Credentials**
- Credentials regenerated in platform
- **Solution**: Get new credentials from platform

**Cause 3: Typo in Environment Variables**
- Credential copy-paste error
- **Solution**: Carefully re-copy credentials

**Verification Steps**:
```bash
# Check environment variables are set
echo $XERO_CLIENT_ID
echo $QBO_CLIENT_ID
echo $MYOB_CLIENT_ID

# Verify no extra spaces/newlines
# Credentials should be alphanumeric strings
```

---

### "User denied authorization"

**Symptoms**: User clicks "Cancel" or "Deny" during OAuth.

**Result**: No connection established.

**Solutions**:
- User must authorize Deskwise access
- Explain why integration is needed
- Restart OAuth flow and complete authorization

---

### "Organization not found" (Xero)

**Symptoms**: After successful OAuth, no organization selected.

**Causes & Solutions**:

**Cause**: User has multiple Xero organizations but didn't select one.

**Solution**:
1. During OAuth flow, user must select organization
2. If skipped, disconnect and reconnect
3. Ensure organization selection step is shown

**Admin Note**: Deskwise uses the first tenant by default. For multi-tenant scenarios, implement tenant selection UI.

---

## Sync Failures

### Invoice Validation Errors

#### Missing Required Fields

**Error**: "Required field missing: [field name]"

**Common Missing Fields**:
- **Client/Customer**: Every invoice needs a customer
- **Invoice Date**: Required by all platforms
- **Due Date**: Required by most platforms
- **Line Items**: At least one line item required
- **Total Amount**: Must be calculated correctly

**Solutions**:
1. Edit invoice in Deskwise
2. Fill in missing field(s)
3. Save and retry sync

---

#### Tax Calculation Mismatch

**Error**: "Tax amount doesn't match calculated tax"

**Cause**: Deskwise tax calculation differs from platform's calculation.

**Solutions**:

**Option 1 - Tax-Inclusive vs Tax-Exclusive**:
1. Go to **Settings > Integrations > Invoice Settings**
2. Set "Tax Amount Type" to match your platform
   - **Tax-Inclusive**: Total includes tax (common in AU/NZ)
   - **Tax-Exclusive**: Total + tax = grand total (common in US)
3. Retry sync

**Option 2 - Recalculate in Deskwise**:
1. Edit invoice
2. Recalculate tax amounts
3. Verify totals match expected values
4. Save and retry sync

---

#### Line Item Issues

**Error**: "Line item [X] has invalid data"

**Common Issues**:
- Quantity is zero or negative
- Rate/price is missing
- Description too long
- Invalid product reference

**Solutions**:
1. Review each line item
2. Ensure quantity > 0
3. Ensure rate is set
4. Shorten description if >4000 characters
5. Verify product exists and is active

---

### Client/Customer Sync Failures

#### Duplicate Customer

**Error**: "Customer with email [email] already exists"

**Causes & Solutions**:

**Cause**: Customer exists in platform with same email.

**Solution 1 - Link Existing**:
1. Go to client in Deskwise
2. Click **Integration** dropdown
3. Click **Link to Existing**
4. Search for customer in platform
5. Select and link

**Solution 2 - Update Email**:
1. If truly a duplicate, update email in Deskwise
2. Or update email in accounting platform
3. Retry sync

---

#### Invalid Address Format

**Error**: "Invalid billing address"

**Platforms have different address requirements**:

**Xero**: Flexible address format
**QuickBooks**: Strict country codes (2-letter ISO)
**MYOB**: Australian/NZ address formats preferred

**Solutions**:
1. Ensure all address fields are filled correctly:
   - Street, City, State, Postal Code, Country
2. Use standard country codes (US, AU, NZ, GB, CA)
3. For QuickBooks: Use 2-letter state codes (CA, NY, etc.)

---

### Product/Item Sync Failures

#### Missing Income Account

**Error**: "Income account required for item"

**Solutions**:
1. Go to **Settings > Integrations > Account Mapping**
2. Map product category to income account
3. Or set default income account in general settings
4. Retry product sync

---

#### Inventory vs Service Item Confusion

**Error**: "Cannot create inventory item without stock data"

**Platforms distinguish**:
- **Service Items**: Non-inventory, no stock tracking
- **Inventory Items**: Physical products with stock tracking

**Solutions**:

**For Services** (default):
- Sync as service items (no stock data needed)

**For Products**:
1. If tracking inventory, add stock quantity to product
2. If not tracking, sync as service item
3. In sync request, specify: `{"syncAs": "service"}`

---

## Token Refresh Issues

### "Token refresh failed"

**Symptoms**: Auto-refresh fails, connection shows "Unhealthy".

**Causes & Solutions**:

**Cause 1: Refresh Token Expired**
- Refresh tokens eventually expire (90 days for Xero, 100 days for QB)
- **Solution**: User must reconnect integration

**Cause 2: App Revoked**
- User revoked app access in platform
- **Solution**: Reconnect and re-authorize

**Cause 3: App Credentials Changed**
- Client ID/Secret changed in platform
- **Solution**: Update environment variables with new credentials

**How to Reconnect**:
1. Go to **Settings > Integrations > Accounting**
2. Note connection shows "Disconnected" or "Unhealthy"
3. Click **Reconnect**
4. Complete OAuth flow
5. Verify connection status is "Healthy"

---

### "Invalid grant" Error

**Symptoms**: Refresh token rejected by platform.

**Causes**:
- Refresh token revoked
- User changed password in platform
- App uninstalled by user
- Refresh token used from different IP (security measure)

**Solutions**:
1. Disconnect integration
2. Reconnect with fresh OAuth flow
3. Store new tokens

**Prevention**:
- Monitor token expiry dates
- Refresh tokens well before expiry
- Set up alerts for refresh failures

---

## Rate Limit Handling

### Understanding Rate Limits

**Xero**:
- **Minute Limit**: 60 requests per minute
- **Daily Limit**: 5,000 requests per day per organization
- **Concurrent**: Maximum 10 concurrent requests

**QuickBooks**:
- **Minute Limit**: 500 requests per minute per company
- **Burst Protection**: Max 100 requests in any 1-second window

**MYOB**:
- **Daily Limit**: 1,000 requests per day per company file
- **Second Limit**: 5 requests per second

### What Deskwise Does Automatically

1. **Request Throttling**: Limits requests to safe rate
2. **Exponential Backoff**: Waits longer after each retry
3. **Queue Management**: Holds requests when limit approached
4. **Smart Batching**: Combines multiple operations when possible

### What You Can Do

**During High Volume**:
1. **Prioritize Syncs**: Sync critical invoices first
2. **Schedule Syncs**: Use bulk sync during off-peak hours
3. **Reduce Frequency**: Disable real-time sync, use scheduled

**Monitoring**:
1. Go to **Settings > Integrations > Metrics**
2. View API usage graphs
3. See current queue depth
4. Adjust settings if frequently hitting limits

**Best Practices**:
- Sync in batches of 50-100 invoices
- Space out bulk operations (1-2 hours apart)
- Avoid syncing during month-end processing
- Use manual sync for large historical imports

---

## Data Mapping Conflicts

### Product Category Mapping Issues

**Problem**: Products in different categories need different accounts.

**Solution**:
1. Go to **Settings > Integrations > Account Mapping**
2. Create specific mappings:
   - Managed Services → 4-1100
   - Professional Services → 4-1200
   - Hardware Sales → 4-2100
   - Software Licenses → 4-2200
3. Set fallback default account
4. Ensure all products have a category assigned

---

### Tax Code Conflicts

**Problem**: Deskwise tax rate doesn't match any platform tax code.

**Example**: Deskwise has "10% Sales Tax" but platform only has "GST 10%"

**Solutions**:

**Option 1 - Rename in Deskwise**:
1. Go to **Settings > Tax Rates**
2. Edit tax rate name to match platform
3. Update mapping to use same code

**Option 2 - Create in Platform**:
1. Log in to accounting platform
2. Create new tax code matching Deskwise rate
3. Map in Deskwise integration settings

**Option 3 - Map to Closest**:
1. Accept slight mismatch
2. Map to closest available tax code
3. Document the mapping decision

---

### Payment Terms Mapping

**Problem**: Deskwise payment terms don't match platform terms.

**Deskwise Terms**: Net 15, Net 30, Net 45, Net 60, COD
**Platform Terms**: May use different IDs or formats

**Solutions**:
1. Go to **Settings > Integrations > Mappings > Payment Terms**
2. Map each Deskwise term to platform equivalent:
   - Net 15 → "15" (QB) or "15 days" (Xero)
   - Net 30 → "30" or "Net 30 Days"
   - COD → "COD" or "0" (immediate)
3. Save mappings

---

## Webhook Troubleshooting

### Webhooks Not Being Received

**Check 1: Webhook URL Accessibility**
```bash
# Test if webhook endpoint is publicly accessible
curl -X POST https://your-domain.com/api/integrations/accounting/webhook/xero \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Should return 200 OK (even if signature fails)
```

**Check 2: Webhook Configuration in Platform**
1. Log in to platform developer portal
2. Go to Webhooks section
3. Verify:
   - Webhook URL is correct
   - Events are subscribed (Invoice.Updated, Payment.Created, etc.)
   - Webhook is active/enabled

**Check 3: Firewall/Security**
- Ensure no firewall blocking platform IPs
- Check WAF/CDN not blocking webhook requests
- Verify HTTPS is properly configured

---

### Webhooks Failing Verification

**Error**: "Invalid signature"

**Causes & Solutions**:

**Cause 1: Wrong Secret**
- Webhook secret in .env doesn't match platform
- **Solution**: Regenerate secret in platform, update .env

**Cause 2: Signature Algorithm Mismatch**
- Using wrong HMAC algorithm
- **Solution**: Verify using HMAC-SHA256 (most platforms)

**Cause 3: Payload Modification**
- Middleware modifying request body
- **Solution**: Verify signature before body parsing

**Testing**:
```typescript
// Test signature verification manually
import crypto from 'crypto'

const payload = JSON.stringify(webhookPayload)
const signature = request.headers.get('x-xero-signature')
const secret = process.env.XERO_WEBHOOK_SECRET

const hmac = crypto.createHmac('sha256', secret)
hmac.update(payload)
const expectedSignature = hmac.digest('base64')

console.log('Received:', signature)
console.log('Expected:', expectedSignature)
console.log('Match:', signature === expectedSignature)
```

---

### Webhooks Received but Not Processing

**Check Processing Queue**:
1. Go to **Settings > Integrations > Webhooks**
2. View recent webhooks
3. Check status:
   - **Received**: Webhook received, not processed
   - **Processing**: Currently being processed
   - **Completed**: Successfully processed
   - **Failed**: Processing error

**Common Processing Errors**:
- Entity not found in Deskwise
- Sync in wrong direction (expecting from platform, but configured to platform)
- Webhook event type not handled

**Solutions**:
1. Check webhook logs for specific error
2. Ensure entity exists in both systems
3. Verify sync direction configuration
4. Add handler for new webhook event types if needed

---

## Performance Issues

### Slow Sync Times

**Symptoms**: Invoices taking minutes to sync.

**Causes & Solutions**:

**Cause 1: Large Invoice**
- Many line items (100+)
- **Solution**: Normal, platforms take time to process large invoices

**Cause 2: Network Latency**
- Slow connection to platform API
- **Solution**: Check network, try different time of day

**Cause 3: Platform Processing Time**
- Platform is slow (not Deskwise issue)
- **Solution**: Monitor platform status page, contact their support if persistent

**Cause 4: Queue Backlog**
- Many syncs queued ahead
- **Solution**: Wait for queue to clear, or increase worker count

---

### High Queue Depth

**Symptoms**: Sync queue has 1000+ pending jobs.

**Causes**:
- Bulk sync of many invoices
- Rate limit throttling
- Worker process not running

**Solutions**:

**Check Worker Status**:
```bash
# Verify worker is running
pm2 list
# or
docker ps | grep accounting-worker
```

**Increase Workers**:
```bash
# Scale up worker processes
pm2 scale accounting-worker +2
# or in docker-compose.yml
docker-compose up -d --scale accounting-worker=3
```

**Clear Stale Jobs**:
1. Go to **Settings > Integrations > Queue Management**
2. Filter by status: "Pending" and "Created > 24 hours ago"
3. Select stale jobs
4. Click **Cancel Selected**

---

### Database Performance

**Symptoms**: Sync history queries slow, integration pages loading slowly.

**Solutions**:

**Check Indexes**:
```javascript
// Verify indexes exist
db.accounting_sync_history.getIndexes()

// If missing, create:
db.accounting_sync_history.createIndex({ orgId: 1, createdAt: -1 })
db.accounting_sync_history.createIndex({ entityType: 1, entityId: 1 })
```

**Archive Old History**:
```javascript
// Delete history older than 90 days
db.accounting_sync_history.deleteMany({
  createdAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
})
```

**Optimize Queries**:
- Use date range filters
- Limit results to 50-100 records
- Use pagination

---

## Support Escalation

### When to Contact Support

Contact Deskwise support if:
- OAuth flow fails repeatedly after following troubleshooting steps
- Token refresh fails continuously (not user-initiated revocation)
- Syncs fail with "Internal Error" code
- Webhooks not received despite correct configuration
- Data corruption or sync conflicts
- Performance degradation not explained by queue depth

### Information to Provide

When contacting support, include:

**1. Integration Details**:
- Platform (Xero, QuickBooks, MYOB)
- Organization ID
- Tenant/Company ID
- Connected date

**2. Error Details**:
- Full error message
- Error code
- Timestamp of error
- Sync ID or Job ID (if available)

**3. Screenshots**:
- Error message screenshot
- Integration settings page
- Sync history showing failed attempts
- Platform developer portal (webhook config, etc.)

**4. Logs**:
- Export sync history for failed operations
- Webhook delivery logs from platform
- Browser console errors (if UI issue)

**5. Steps to Reproduce**:
- What you were trying to do
- Steps taken before error
- Expected outcome vs actual outcome

### Export Sync History

```bash
# Via API
curl https://your-domain.com/api/integrations/accounting/history/export?format=csv \
  -H "Cookie: your-session-cookie" \
  > sync-history.csv

# Via UI
1. Go to Settings > Integrations > Accounting > History
2. Click "Export to CSV"
3. Attach to support ticket
```

### Support Channels

- **Email**: integrations@deskwise.com
- **Support Portal**: https://support.deskwise.com
- **Priority Support**: Available for Enterprise plans
- **Response Time**: 24-48 hours (4 hours for priority)

### Community Support

- **Forum**: https://community.deskwise.com/c/integrations
- **Discord**: https://discord.gg/deskwise-support
- **GitHub Issues**: https://github.com/deskwise/deskwise/issues

---

## FAQ

**Q: Why did my invoice sync fail but the client synced successfully?**
A: Client sync succeeded, but invoice sync failed due to a different validation error (missing tax code, invalid line item, etc.). Check the specific invoice error message.

**Q: Can I sync historical invoices from before the integration was connected?**
A: Yes, select historical invoices and use "Bulk Sync". Be aware this may take time and could approach rate limits if syncing hundreds of invoices.

**Q: What happens if I disconnect and reconnect the integration?**
A: Existing links are preserved (if you choose "Keep links"). You can resume syncing without duplicates. Historical sync data is retained for 90 days.

**Q: Why are payments not syncing back to Deskwise?**
A: Check that "Auto-sync payments" is enabled in integration settings. Payment sync runs every 30 minutes. Force sync by clicking "Sync Payments Now".

**Q: Can I sync to multiple accounting platforms simultaneously?**
A: No, Deskwise supports one accounting integration per organization. Choose the platform your accountant uses.

**Q: How do I handle multi-currency invoices?**
A: Ensure your accounting platform supports multi-currency. Each invoice syncs with its specified currency. Exchange rates are handled by the accounting platform.

---

*Last Updated: January 2025*
*Version: 1.0*
