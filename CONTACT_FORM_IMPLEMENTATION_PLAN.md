# Contact Form Implementation Plan

## ✅ Current Status

### Completed:
1. ✅ **Database Migration** - Created `contact_messages` table with:
   - Fields: `id`, `name`, `email`, `message`, `status`, `user_id`, `admin_notes`, `replied_at`, `replied_by`, `created_at`, `updated_at`
   - Status tracking: `new`, `read`, `replied`, `archived`
   - RLS policies for security
   - Indexes for performance

2. ✅ **API Route** - Created `/api/contact/submit` endpoint:
   - Validates all required fields
   - Email format validation
   - Message length validation (max 5000 chars)
   - Links to user profile if authenticated
   - Stores messages in database

3. ✅ **Frontend Integration** - Updated `ContactFormSection.tsx`:
   - Now calls the API endpoint
   - Proper error handling
   - Success/error toast notifications

---

## 🔄 Next Steps: Response System

### Option 1: Email Notification System (Recommended)

#### A. Admin Email Notifications
**Purpose:** Notify admin when a new contact message is received

**Implementation:**
1. **Use Supabase Edge Functions** (Recommended)
   - Create edge function: `notify-admin-contact`
   - Triggered via database webhook or API call
   - Sends email using SendGrid, Resend, or similar service

2. **Alternative: Use Next.js API Route with Email Service**
   - Add email service integration (Resend, SendGrid, AWS SES)
   - Call from `/api/contact/submit` route after database insert

**Email Template:**
```
Subject: New Contact Form Submission - CrackAtom

Hello Admin,

You have received a new contact form submission:

Name: {name}
Email: {email}
Message: {message}

Submitted: {created_at}

View in Dashboard: {dashboard_url}
```

#### B. User Confirmation Email
**Purpose:** Confirm to user that their message was received

**Implementation:**
1. Send email immediately after form submission
2. Include their message for reference
3. Set expectations (response time)

**Email Template:**
```
Subject: We've Received Your Message - CrackAtom

Hi {name},

Thank you for reaching out to CrackAtom!

We've received your message:
"{message}"

Our team will review your message and get back to you within 1-2 business days.

Best regards,
The CrackAtom Team
```

---

### Option 2: Admin Dashboard View

#### Implementation:
1. **Create Admin Contact Messages Page**
   - Route: `/admin/contact-messages`
   - View all messages with filters (status, date, email)
   - Mark as read/replied/archived
   - Add admin notes
   - Reply functionality

2. **Database Queries:**
```typescript
// Get all messages (admin only)
const { data: messages } = await supabase
  .from('contact_messages')
  .select('*')
  .order('created_at', { ascending: false })

// Filter by status
.eq('status', 'new')

// Update message status
.update({ status: 'replied', replied_at: new Date().toISOString() })
```

---

### Option 3: Automated Response System

#### Features:
1. **Auto-Reply on Submission**
   - Immediate confirmation email
   - Already implemented in frontend (toast)

2. **Smart Categorization** (Future Enhancement)
   - Use AI to categorize messages (support, feedback, partnership, etc.)
   - Auto-assign to appropriate team member

3. **Response Templates**
   - Pre-written templates for common inquiries
   - Quick reply buttons in admin dashboard

---

## 📧 Email Service Integration Options

### 1. Resend (Recommended - Easy Setup)
```bash
npm install resend
```

**Setup:**
1. Sign up at resend.com
2. Get API key
3. Add to `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

**Usage in API Route:**
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Send to admin
await resend.emails.send({
  from: 'CrackAtom <noreply@crackatom.com>',
  to: ['admin@crackatom.com'],
  subject: 'New Contact Form Submission',
  html: emailTemplate
})

// Send to user
await resend.emails.send({
  from: 'CrackAtom <noreply@crackatom.com>',
  to: [email],
  subject: 'We\'ve Received Your Message',
  html: userConfirmationTemplate
})
```

### 2. SendGrid
```bash
npm install @sendgrid/mail
```

### 3. AWS SES
- More complex setup
- Better for high volume
- Requires AWS account

---

## 🗄️ Database Schema

### `contact_messages` Table:
```sql
- id: UUID (Primary Key)
- name: TEXT (Required)
- email: TEXT (Required, indexed)
- message: TEXT (Required)
- status: TEXT (new, read, replied, archived) - Default: 'new'
- user_id: UUID (Optional - links to profiles if logged in)
- admin_notes: TEXT (Optional - for internal notes)
- replied_at: TIMESTAMP (When admin replied)
- replied_by: UUID (Admin who replied)
- created_at: TIMESTAMP (Auto)
- updated_at: TIMESTAMP (Auto)
```

---

## 🔐 Security Considerations

✅ **RLS Policies Implemented:**
- Anyone can submit (anon users)
- Users can view their own messages
- Admins can view/update all messages

✅ **Input Validation:**
- Name, email, message required
- Email format validation
- Message length limit (5000 chars)
- SQL injection protection (Supabase handles this)

✅ **Rate Limiting** (Future Enhancement):
- Limit submissions per IP/email
- Prevent spam

---

## 📊 Admin Dashboard Features (To Implement)

1. **Message List View**
   - Table with columns: Name, Email, Message (truncated), Status, Date
   - Filters: Status, Date Range
   - Search: By name, email, or message content

2. **Message Detail View**
   - Full message display
   - User info (if logged in)
   - Status management (dropdown)
   - Admin notes field
   - Reply button (opens email client or sends email)

3. **Statistics**
   - Total messages
   - Unread messages count
   - Messages by status
   - Recent activity

---

## 🚀 Quick Start Guide

### To Complete Email Integration:

1. **Run the migration:**
```bash
# In Supabase dashboard, run the migration:
# supabase/migrations/023_add_contact_messages_table.sql
```

2. **Set up email service (Resend example):**
```bash
npm install resend
```

3. **Add environment variable:**
```env
RESEND_API_KEY=your_api_key_here
ADMIN_EMAIL=admin@crackatom.com
```

4. **Update API route** to send emails (see example in plan above)

5. **Test the flow:**
   - Submit contact form
   - Check database for new message
   - Verify emails are sent

---

## 📝 Response Workflow

### Current Flow:
1. User fills form → ✅ Submits → ✅ Saved to database
2. User sees success message → ✅ Confirmation toast

### Recommended Complete Flow:
1. User fills form → Submits → Saved to database
2. **Admin receives email notification** → Can respond
3. **User receives confirmation email** → Knows message was received
4. Admin views in dashboard → Updates status → Replies
5. **User receives response email** → Gets their answer

---

## 🎯 Priority Implementation Order

1. ✅ **Database & API** (Completed)
2. 🔄 **Email Notifications** (Next - High Priority)
   - Admin notification
   - User confirmation
3. 📊 **Admin Dashboard** (Medium Priority)
   - View messages
   - Status management
4. 🔔 **Advanced Features** (Low Priority)
   - Auto-categorization
   - Response templates
   - Analytics

---

## 📞 Support Integration

Consider integrating with:
- **Intercom** - Live chat + ticketing
- **Zendesk** - Full support system
- **Freshdesk** - Customer support platform

These can automatically create tickets from contact form submissions.

