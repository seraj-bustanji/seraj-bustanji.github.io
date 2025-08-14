# 📧 Email Setup Guide for Portfolio

## 🚀 **Option 1: EmailJS (Recommended)**

### **Step 1: Create EmailJS Account**
1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### **Step 2: Add Email Service**
1. In EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions
5. **Note down your Service ID** (e.g., `service_7vpeux7`)

### **Step 3: Create Email Template**
1. Go to "Email Templates"
2. Click "Create New Template"
3. Use this template:

```html
Subject: New Portfolio Contact: {{subject}}

Hello {{to_name}},

You have received a new message from your portfolio:

Name: {{from_name}}
Email: {{from_email}}
Subject: {{subject}}

Message:
{{message}}

---
Sent from your portfolio contact form
```

4. **Note down your Template ID** (e.g., `template_x279ifr`)

### **Step 4: Get Your Public Key**
1. Go to "Account" → "API Keys"
2. **Copy your Public Key** (e.g., `tkj6MNMDakdT_BDLv`)

### **Step 5: Update Your Code**
Replace the placeholders in `script.js`:

```javascript
// Line 108: Replace YOUR_PUBLIC_KEY
emailjs.init("tkj6MNMDakdT_BDLv");

// Line 140: Replace YOUR_SERVICE_ID and YOUR_TEMPLATE_ID
emailjs.send('service_7vpeux7', 'template_x279ifr', templateParams)
```

### **Step 6: Test**
1. Open your portfolio in a browser
2. Fill out the contact form
3. Submit and check your email!

---

## 🔧 **Option 2: Formspree (Alternative)**

If EmailJS doesn't work for you, try Formspree:

### **Step 1: Create Formspree Account**
1. Go to [Formspree.io](https://formspree.io/)
2. Sign up for free
3. Create a new form

### **Step 2: Update HTML**
Replace the form action in `index.html`:

```html
<form id="contactForm" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

### **Step 3: Update JavaScript**
Replace the email sending code with:

```javascript
// Simple form submission
contactForm.submit();
```

---

## 🛠️ **Option 3: Netlify Forms (If Hosted on Netlify)**

If you host on Netlify, add this to your form:

```html
<form name="contact" netlify>
```

---

## 📋 **Quick Setup Checklist**

### **For EmailJS:**
- [ ] Create EmailJS account
- [ ] Add email service (Gmail/Outlook)
- [ ] Create email template
- [ ] Get Service ID, Template ID, and Public Key
- [ ] Update `script.js` with your IDs
- [ ] Test the form

### **Your EmailJS IDs:**
- **Public Key**: `user_________________`
- **Service ID**: `service_________________`
- **Template ID**: `template_________________`

---

## 🎯 **Benefits of EmailJS:**
- ✅ Works entirely on frontend
- ✅ No server required
- ✅ Free tier available (200 emails/month)
- ✅ Professional email templates
- ✅ Spam protection
- ✅ Easy setup

---

## 📞 **Need Help?**
- EmailJS Documentation: https://www.emailjs.com/docs/
- EmailJS Support: support@emailjs.com
- Free tier includes: 200 emails/month, 2 email templates

---

**Once you have your EmailJS IDs, just replace the placeholders in `script.js` and your contact form will work perfectly!** 🚀 