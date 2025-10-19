# Accounting Integrations - Quick Setup Checklist

## ✅ Your Action Items (Copy & Check Off)

### 📝 **STEP 1: Register OAuth Apps** (30 minutes)

#### Xero
- [ ] Go to https://developer.xero.com/app/manage
- [ ] Create new app: "Deskwise ITSM"
- [ ] Redirect URI: `http://localhost:9002/api/integrations/xero/callback`
- [ ] Copy Client ID: `_______________________________________`
- [ ] Copy Client Secret: `_______________________________________`

#### QuickBooks
- [ ] Go to https://developer.intuit.com/app/developer/dashboard
- [ ] Create new app: "Deskwise ITSM"
- [ ] Redirect URI: `http://localhost:9002/api/integrations/quickbooks/callback`
- [ ] Copy Client ID: `_______________________________________`
- [ ] Copy Client Secret: `_______________________________________`

#### MYOB
- [ ] Go to https://developer.myob.com/api/myob-accountright-api/
- [ ] Register app: "Deskwise ITSM"
- [ ] Redirect URI: `http://localhost:9002/api/integrations/myob/callback`
- [ ] Copy API Key: `_______________________________________`
- [ ] Copy API Secret: `_______________________________________`

---

### 🔧 **STEP 2: Update .env.local** (5 minutes)

- [ ] Open `.env.local` file
- [ ] Add credentials from Step 1
- [ ] Generate encryption key: `openssl rand -base64 32`
- [ ] Paste encryption key
- [ ] Save file

**Template to copy:**
```env
# Xero
XERO_CLIENT_ID=
XERO_CLIENT_SECRET=
XERO_REDIRECT_URI=http://localhost:9002/api/integrations/xero/callback

# QuickBooks
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
QUICKBOOKS_REDIRECT_URI=http://localhost:9002/api/integrations/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox

# MYOB
MYOB_CLIENT_ID=
MYOB_CLIENT_SECRET=
MYOB_REDIRECT_URI=http://localhost:9002/api/integrations/myob/callback

# Security
INTEGRATION_ENCRYPTION_KEY=
```

---

### 🗄️ **STEP 3: Database Indexes** ✅ **COMPLETED**

- [x] Database indexes created automatically via script
- [x] Total of 24 indexes created (Xero: 9, QuickBooks: 8, MYOB: 7)

**Status**: This step has been automated and completed. You can skip this section.

---

### 🔄 **STEP 4: Restart Server** (1 minute)

- [ ] Stop dev server (Ctrl+C)
- [ ] Run `npm run dev`
- [ ] Wait for "Ready" message

---

### 🧪 **STEP 5: Test** (15 minutes)

- [ ] Go to `http://localhost:9002/settings/integrations`
- [ ] Verify page loads without errors
- [ ] Click "Connect to Xero" → Complete OAuth → See "Connected"
- [ ] Click "Connect to QuickBooks" → Complete OAuth → See "Connected"
- [ ] Open any invoice → Click "Sync to Xero" → Verify in Xero

---

## ⏱️ Time Estimate

| Step | Time |
|------|------|
| Register OAuth Apps | 30 min |
| Configure .env.local | 5 min |
| Database Indexes | ✅ DONE |
| Restart Server | 1 min |
| Testing | 15 min |
| **TOTAL** | **~51 minutes** |

---

## 🆘 Quick Troubleshooting

**OAuth popup blocked?**
→ Allow popups for localhost:9002

**"Redirect URI mismatch"?**
→ Check URI exactly matches in OAuth app settings

**"Client ID not found"?**
→ Restart dev server after editing .env.local

**Can't see integrations page?**
→ Make sure you're logged in as admin

---

## 📄 Full Documentation

See `ACCOUNTING_INTEGRATIONS_ACTION_PLAN.md` for complete details.

---

**Status**: ⬜ Not Started | ⏳ In Progress | ✅ Complete

**Current Status**: _______________

**Completed By**: _______________

**Date**: _______________
