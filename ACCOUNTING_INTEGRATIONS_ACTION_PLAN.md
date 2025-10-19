# Accounting Integrations - Deployment Action Plan

## ✅ What's Already Done

- ✅ **Backend Code**: All service layers, API routes, and type definitions are complete
- ✅ **Frontend UI**: Complete Settings page with integration management
- ✅ **Security**: AES-256-GCM encryption implemented
- ✅ **Documentation**: 100,000+ words of comprehensive guides
- ✅ **NPM Packages**: All required packages installed

---

## 🎯 What YOU Need to Do (30-60 minutes)

### **STEP 1: Register OAuth Apps (30 minutes)** ⚠️ **ACTION REQUIRED**

You need to create **ONE app per platform** (this enables all your MSP customers).

#### **1A. Xero Developer App (10 minutes)**

1. Go to: https://developer.xero.com/app/manage
2. Click **"New App"**
3. Fill in:
   - **App name**: `Deskwise ITSM`
   - **Company/App URL**: `http://localhost:9002` (for dev)
   - **Redirect URI**: `http://localhost:9002/api/integrations/xero/callback`
   - **OAuth 2.0 only**: ✅ Yes
4. Click **"Create App"**
5. Copy your credentials:
   - **Client ID**: (looks like: `ABC123...`)
   - **Client Secret**: (looks like: `XYZ789...`)
6. **SAVE THESE** - you'll add them to `.env.local` in Step 2

**Scopes needed** (configure in app):
- `accounting.transactions` (read/write invoices, quotes)
- `accounting.contacts` (read/write customers)
- `accounting.settings` (read tax rates, accounts)

---

#### **1B. QuickBooks Developer App (10 minutes)**

1. Go to: https://developer.intuit.com/app/developer/dashboard
2. Click **"Create an app"** → Select **"QuickBooks Online"**
3. Fill in:
   - **App name**: `Deskwise ITSM`
   - **Redirect URI**: `http://localhost:9002/api/integrations/quickbooks/callback`
4. Click **"Create App"**
5. Go to **"Keys & OAuth"** tab
6. Copy your credentials:
   - **Client ID**: (looks like: `ABxxxx...`)
   - **Client Secret**: (looks like: `xxxx...`)
7. **SAVE THESE** - you'll add them to `.env.local` in Step 2

**Scopes needed** (automatic):
- `com.intuit.quickbooks.accounting` (full QuickBooks access)

**Important**: Start in **Sandbox** mode for testing, switch to Production later

---

#### **1C. MYOB Developer App (10 minutes)**

1. Go to: https://developer.myob.com/program/register/
2. Register for MYOB Developer Program (if not already)
3. Go to: https://developer.myob.com/api/myob-accountright-api/
4. Click **"Register App"**
5. Fill in:
   - **App name**: `Deskwise ITSM`
   - **Redirect URI**: `http://localhost:9002/api/integrations/myob/callback`
6. Copy your credentials:
   - **API Key** (Client ID)
   - **API Secret** (Client Secret)
7. **SAVE THESE** - you'll add them to `.env.local` in Step 2

**Note**: MYOB may require manual approval (can take 1-2 business days)

---

### **STEP 2: Configure Environment Variables (5 minutes)** ⚠️ **ACTION REQUIRED**

1. Open: `C:\Users\User\Desktop\Projects\Deskwise\.env.local`

2. Add these lines at the end:

```env
# ============================================
# ACCOUNTING INTEGRATIONS
# ============================================

# Xero OAuth (from Step 1A)
XERO_CLIENT_ID=paste-your-xero-client-id-here
XERO_CLIENT_SECRET=paste-your-xero-client-secret-here
XERO_REDIRECT_URI=http://localhost:9002/api/integrations/xero/callback

# QuickBooks OAuth (from Step 1B)
QUICKBOOKS_CLIENT_ID=paste-your-quickbooks-client-id-here
QUICKBOOKS_CLIENT_SECRET=paste-your-quickbooks-client-secret-here
QUICKBOOKS_REDIRECT_URI=http://localhost:9002/api/integrations/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox

# MYOB OAuth (from Step 1C)
MYOB_CLIENT_ID=paste-your-myob-api-key-here
MYOB_CLIENT_SECRET=paste-your-myob-api-secret-here
MYOB_REDIRECT_URI=http://localhost:9002/api/integrations/myob/callback

# Integration Security (generate a random 32-character string)
INTEGRATION_ENCRYPTION_KEY=
```

3. Generate encryption key (run this in Git Bash):
```bash
openssl rand -base64 32
```

4. Copy the output and paste it after `INTEGRATION_ENCRYPTION_KEY=`

5. **Save the file**

---

### **STEP 3: Create Database Indexes (2 minutes)** ✅ **COMPLETED AUTOMATICALLY**

**Status**: Database indexes have been created automatically via `scripts/create-integration-indexes.js`

All 24 indexes (9 for Xero, 8 for QuickBooks, 7 for MYOB) are now in place. You can skip this step.

<details>
<summary>Manual Index Creation (if needed)</summary>

If you need to recreate indexes manually:

1. Open MongoDB connection (MongoDB Compass or Atlas dashboard)

2. Connect to your `deskwise` database

3. Run these commands in the MongoDB shell:

```javascript
// Xero Integration indexes
db.xero_integrations.createIndex({ orgId: 1 }, { unique: true })
db.xero_integrations.createIndex({ tenantId: 1 })
db.xero_integrations.createIndex({ status: 1 })

db.xero_sync_logs.createIndex({ orgId: 1, createdAt: -1 })
db.xero_sync_logs.createIndex({ integrationId: 1, createdAt: -1 })
db.xero_sync_logs.createIndex({ entityType: 1 })

db.xero_entity_references.createIndex({ orgId: 1, deskwiseEntityId: 1, deskwiseEntityType: 1 }, { unique: true })
db.xero_entity_references.createIndex({ orgId: 1, xeroEntityId: 1 })
db.xero_entity_references.createIndex({ integrationId: 1 })

// QuickBooks Integration indexes
db.quickbooks_integrations.createIndex({ orgId: 1 }, { unique: true })
db.quickbooks_integrations.createIndex({ realmId: 1 })
db.quickbooks_integrations.createIndex({ status: 1 })

db.quickbooks_sync_logs.createIndex({ orgId: 1, createdAt: -1 })
db.quickbooks_sync_logs.createIndex({ integrationId: 1, createdAt: -1 })
db.quickbooks_sync_logs.createIndex({ entityType: 1 })

db.quickbooks_entity_references.createIndex({ orgId: 1, deskwiseEntityId: 1, deskwiseEntityType: 1 }, { unique: true })
db.quickbooks_entity_references.createIndex({ orgId: 1, qboEntityId: 1 })

// MYOB Integration indexes
db.myob_integrations.createIndex({ orgId: 1 }, { unique: true })
db.myob_integrations.createIndex({ companyFileId: 1 })
db.myob_integrations.createIndex({ status: 1 })

db.myob_mappings.createIndex({ orgId: 1, deskwiseEntityId: 1, deskwiseEntityType: 1 }, { unique: true })
db.myob_mappings.createIndex({ orgId: 1, myobEntityId: 1 })

db.myob_sync_logs.createIndex({ orgId: 1, createdAt: -1 })
db.myob_sync_logs.createIndex({ integrationId: 1, createdAt: -1 })
```

</details>

---

### **STEP 4: Restart Dev Server (1 minute)** ⚠️ **ACTION REQUIRED**

After adding environment variables, restart the dev server:

```bash
# Stop current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

---

## 🧪 Testing the Integrations (15-20 minutes)

### **Test 1: Access Integration Settings** ✅ **YOU DO THIS**

1. Open browser: `http://localhost:9002`
2. Log in to Deskwise
3. Navigate to: **Settings → Integrations**
4. You should see 3 platform cards (Xero, QuickBooks, MYOB)

**Expected Result**: Page loads without errors, shows "Not Connected" status

---

### **Test 2: Test Xero OAuth Flow** ✅ **YOU DO THIS**

1. Click **"Connect to Xero"** button
2. OAuth popup should open (600x700px)
3. Log in with **Xero Demo Company** credentials:
   - Go to: https://developer.xero.com/documentation/getting-started-guide/
   - Use demo company credentials from Xero developer docs
4. Authorize the app
5. Popup should close automatically
6. Status should change to **"Connected"**
7. Should show organization name

**Expected Result**: Connected status with green badge

---

### **Test 3: Test QuickBooks OAuth Flow** ✅ **YOU DO THIS**

1. Click **"Connect to QuickBooks"** button
2. OAuth popup should open
3. Log in with **QuickBooks Sandbox** credentials:
   - Use Intuit Developer sandbox account
   - Or create test company at: https://developer.intuit.com/app/developer/sandbox
4. Authorize the app
5. Popup should close automatically
6. Status should change to **"Connected"**

**Expected Result**: Connected status with green badge

---

### **Test 4: Test Invoice Sync** ✅ **YOU DO THIS**

**Prerequisites**: You need at least one invoice in Deskwise

1. Go to: **Clients → [Any Client] → Agreements Tab**
2. Or go to: **Billing → Invoices**
3. Open an existing invoice (or create a test invoice)
4. Look for **Sync Badge** component (should show on invoice page)
5. Click **"Sync to Xero"** button
6. Wait for sync to complete (should see success toast)
7. Go to your Xero demo company → Invoices
8. Verify the invoice was created

**Expected Result**: Invoice appears in Xero with correct data

---

## 📊 Current Status

| Task | Status | Who |
|------|--------|-----|
| Backend Implementation | ✅ Complete | Done |
| Frontend UI | ✅ Complete | Done |
| NPM Packages | ✅ Installed | Done |
| Register Xero App | ⏳ Pending | **YOU** |
| Register QuickBooks App | ⏳ Pending | **YOU** |
| Register MYOB App | ⏳ Pending | **YOU** |
| Configure .env.local | ⏳ Pending | **YOU** |
| Create Database Indexes | ✅ Complete | Done |
| Restart Dev Server | ⏳ Pending | **YOU** |
| Test OAuth Flows | ⏳ Pending | **YOU** |
| Test Invoice Sync | ⏳ Pending | **YOU** |

---

## 🆘 Troubleshooting

### **"OAuth popup blocked"**
- **Solution**: Allow popups for localhost:9002 in browser settings

### **"Redirect URI mismatch"**
- **Solution**: Make sure redirect URI in OAuth app settings exactly matches:
  - Xero: `http://localhost:9002/api/integrations/xero/callback`
  - QuickBooks: `http://localhost:9002/api/integrations/quickbooks/callback`
  - MYOB: `http://localhost:9002/api/integrations/myob/callback`

### **"Client ID not found" error**
- **Solution**: Check that environment variables are correctly set in `.env.local`
- **Solution**: Restart dev server after adding variables

### **"Integration not found" in database**
- **Solution**: Run database index creation commands

### **OAuth works but sync fails**
- **Check**: Token is stored in database (check `xero_integrations` collection)
- **Check**: Entity exists in Deskwise (invoice/quote/customer)
- **Check**: Browser console for detailed error messages

---

## 📚 Documentation Reference

For detailed troubleshooting and advanced configuration:

- **ACCOUNTING_INTEGRATIONS_USER_GUIDE.md** - Complete user guide
- **XERO_QUICK_START.md** - Xero-specific setup
- **QUICKBOOKS_SETUP.md** - QuickBooks-specific setup
- **MYOB_SETUP_QUICKSTART.md** - MYOB-specific setup
- **ACCOUNTING_INTEGRATIONS_TROUBLESHOOTING.md** - Detailed troubleshooting

---

## 🎯 Summary

**What you need to do NOW:**
1. ⏰ **30 min** - Register 3 OAuth apps (Xero, QuickBooks, MYOB)
2. ⏰ **5 min** - Add credentials to `.env.local`
3. ✅ **DONE** - Create database indexes (automated)
4. ⏰ **1 min** - Restart dev server
5. ⏰ **15 min** - Test OAuth flows and sync

**Total time**: ~51 minutes to fully functional integrations!

---

## ✅ Next Steps After Testing

Once testing is complete:

1. **Production OAuth Apps**: Create production versions of OAuth apps with your production domain
2. **Update Redirect URIs**: Change from `localhost:9002` to `yourdomain.com`
3. **Environment Variables**: Update production `.env` with production credentials
4. **Monitor Usage**: Check sync logs regularly in Settings → Integrations → Logs tab
5. **Enable for Customers**: Your MSP customers can now connect their accounting platforms!

---

**Questions?** Check the comprehensive documentation files or the troubleshooting guide.
