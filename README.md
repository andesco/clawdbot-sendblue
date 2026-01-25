# clawdbot-sendblue

Text your [clawdbot](https://clawd.bot) via iMessage or SMS.

This plugin connects clawdbot to [Sendblue](https://sendblue.co), letting you chat with your AI assistant by texting a phone number.

**By default, only phone numbers you explicitly allow can text the bot.** Random people texting your Sendblue number will be ignored.

## Prerequisites

- [clawdbot](https://clawd.bot) installed and running
- [Node.js](https://nodejs.org) 18+
- A free Sendblue account

## Setup

### Step 1: Create a Sendblue Account

Sendblue offers a free tier for getting started.

1. Go to [sendblue.com/api](https://sendblue.com/api)
2. Click **"Try for free"** (or go directly to [dashboard.sendblue.com/company-signup](https://dashboard.sendblue.com/company-signup))
3. Fill out the signup form:
   - Enter your email and create a password
   - Provide basic company/project info
4. Verify your email if prompted
5. Once logged into the dashboard, you'll see:
   - **API Key** - copy this (used as `apiKey` in config)
   - **API Secret** - copy this (used as `apiSecret` in config)
   - **Your Sendblue phone number** - this is the number people will text (used as `phoneNumber` in config)

> **Note:** The free tier has usage limits. Check [sendblue.com](https://sendblue.com) for current pricing if you need higher volume.

### Step 2: Install the Plugin

```bash
git clone https://github.com/njerschow/clawdbot-sendblue ~/.clawdbot/extensions/sendblue
cd ~/.clawdbot/extensions/sendblue
npm install
npm run build
```

### Step 3: Configure

Edit `~/.clawdbot/clawdbot.json` and add the plugin config:

```json
{
  "plugins": {
    "entries": {
      "sendblue": {
        "enabled": true,
        "config": {
          "apiKey": "YOUR_SENDBLUE_API_KEY",
          "apiSecret": "YOUR_SENDBLUE_API_SECRET",
          "phoneNumber": "+15551234567",
          "allowFrom": ["+15559876543"]
        }
      }
    }
  }
}
```

Replace:
- `apiKey` - your Sendblue API key
- `apiSecret` - your Sendblue API secret
- `phoneNumber` - the Sendblue phone number (the one Sendblue gave you)
- `allowFrom` - **your personal phone number** (the phone you'll text from)

All phone numbers must be in E.164 format: `+1` followed by 10 digits (e.g., `+15551234567`).

> **Already have a `clawdbot.json`?** Just add the `sendblue` section inside your existing `plugins.entries` object.

### Step 4: Restart the Gateway

```bash
clawdbot gateway restart
```

### Step 5: Test It

Open your phone's messaging app and text your Sendblue number. You should get a response from clawdbot!

If you don't get a response, make sure you're texting **from** the number you put in `allowFrom`.

## Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `apiKey` | Yes | Your Sendblue API key |
| `apiSecret` | Yes | Your Sendblue API secret |
| `phoneNumber` | Yes | The Sendblue phone number (the bot's number) |
| `allowFrom` | Recommended | Your phone number(s) that can text the bot |
| `dmPolicy` | No | `"allowlist"` (default), `"open"`, or `"disabled"` |
| `pollIntervalMs` | No | How often to check for new messages in ms (default: 5000) |
| `webhook.enabled` | No | Enable webhook server for real-time messages (default: false) |
| `webhook.port` | No | Port for webhook server (default: 3141) |
| `webhook.path` | No | URL path for webhook endpoint (default: `/webhook/sendblue`) |

### Access Control

By default (`dmPolicy: "allowlist"`), only numbers listed in `allowFrom` can text the bot. Messages from other numbers are silently ignored.

To allow **anyone** to text the bot:

```json
"config": {
  "apiKey": "...",
  "apiSecret": "...",
  "phoneNumber": "...",
  "dmPolicy": "open"
}
```

To **disable** the channel entirely, set `dmPolicy: "disabled"`.

### Webhook Mode (Optional)

By default, the plugin polls Sendblue every 5 seconds for new messages. For faster, real-time message delivery, you can enable webhook mode:

```json
"config": {
  "apiKey": "...",
  "apiSecret": "...",
  "phoneNumber": "...",
  "allowFrom": ["..."],
  "webhook": {
    "enabled": true,
    "port": 3141
  }
}
```

When webhook mode is enabled:

1. The plugin starts an HTTP server on the specified port
2. You need to configure Sendblue to send webhooks to your server
3. Messages arrive instantly instead of waiting for the next poll

**To set up webhooks:**

1. Make sure your server is publicly accessible (you may need a reverse proxy like ngrok, Cloudflare Tunnel, or a public server)
2. In your Sendblue dashboard, set the webhook URL to: `https://your-server.com:3141/webhook/sendblue`
3. Restart the clawdbot gateway

> **Note:** If your server isn't publicly accessible, stick with polling mode (the default).

## Troubleshooting

**Not receiving messages**
- Make sure you're texting from a number in `allowFrom`
- Check that your Sendblue credentials are correct
- Check logs: `clawdbot logs`

**"Unknown channel id" error**
- Make sure you ran `npm run build` after cloning
- Check that the plugin is in `~/.clawdbot/extensions/sendblue`

**Messages not sending**
- Verify your Sendblue account is active and has API access
- Check your API credentials

## How It Works

**Polling mode (default):**
```
Your Phone
    │
    ▼ iMessage/SMS
Sendblue (cloud)
    │
    ▼ polls every 5s
clawdbot + this plugin
    │
    ▼ AI response
Sendblue → Your Phone
```

**Webhook mode:**
```
Your Phone
    │
    ▼ iMessage/SMS
Sendblue (cloud)
    │
    ▼ instant webhook POST
clawdbot + this plugin
    │
    ▼ AI response
Sendblue → Your Phone
```

In polling mode, the plugin checks Sendblue for new messages every 5 seconds (configurable). In webhook mode, Sendblue pushes messages to your server instantly. Either way, the AI's response is sent back via the Sendblue API.

## License

MIT
