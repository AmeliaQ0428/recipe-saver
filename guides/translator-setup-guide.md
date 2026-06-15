# Setup Guide: Mandarin ↔ English Translator (Microsoft Translator)

This guide walks you through setting up **Microsoft Translator** so your mom (Huawei, Mandarin) and your partner (iPhone, English) can talk to each other with live translation — whether they're in the same room or in different countries.

It's a free app, no account required for the people joining the conversation, and no coding needed.

---

## How it will work, in plain terms

1. You create one **"conversation"** inside the app and give it a permanent code (e.g. `ABCDE`).
2. Your mom's phone and your partner's phone both **join that same conversation code**, each picking their own language (Mandarin for mom, English for partner).
3. From then on, whenever either of them opens the app and that conversation:
   - They press and hold the big microphone button
   - They speak
   - They release
   - Their words appear (and can be read aloud) in the other person's language on the other person's screen

This works in person (both phones in the same room) **and** remotely (different countries) — same setup either way.

---

## Step 1 — Install on the iPhone (your partner's phone)

1. Open the **App Store**.
2. Search for **"Microsoft Translator"**.
3. Look for the icon with the blue/white "T" logo, published by **Microsoft Corporation**.
4. Tap **Get** / the download icon, and let it install.

This step should be straightforward — no Google account or special steps needed on iPhone.

---

## Step 2 — Install on the Huawei phone (your mom's phone)

Your mom's Huawei doesn't have the Google Play Store, so try these in order:

### Option A — Huawei AppGallery (try this first)
1. Open **AppGallery** on her phone.
2. Tap the search icon and search **"Microsoft Translator"**.
3. If it appears with the Microsoft "T" logo, install it normally.

### Option B — Petal Search (if AppGallery doesn't have it)
1. Open the **Petal Search** app (usually pre-installed on Huawei phones, or available in AppGallery).
2. Search **"Microsoft Translator"**.
3. Petal Search can often find and install apps that aren't directly in AppGallery. Install from there.

### Option C — Fallback: Huawei's built-in translator (in-person only)
If neither option above works, Huawei phones have a **built-in AI translation feature** (sometimes called "Real-Time Translation" or accessible via the Celia voice assistant). This can work for **in-person** conversations (passing the phone back and forth) but **won't support the remote, two-phone "Conversation" feature** described in this guide. If you end up here, let me know and we can write a separate guide for that fallback specifically.

> **Note for you:** I can't check your mom's specific phone model remotely. Please try Option A first and tell me what you find — if Microsoft Translator isn't there, try Option B before falling back to Option C.

---

## Step 3 — Download offline language packs (recommended)

This makes translation faster and more reliable, and lets it work with no/weak internet.

On **both phones**, inside Microsoft Translator:
1. Open the app's menu (usually three lines or a gear/settings icon).
2. Find **"Offline languages"** or **"Manage offline languages"**.
3. Download:
   - **Chinese (Simplified)**
   - **English**

Do this on both the iPhone and the Huawei phone.

---

## Step 4 — Create a permanent conversation (do this yourself first)

You'll set this up once, then your mom and partner just reuse it forever.

1. Open Microsoft Translator on **your own phone** (or whichever phone you're setting up from).
2. Tap the **"Conversation"** icon (usually a speech-bubble/people icon on the home screen).
3. Choose to **start a new conversation**.
4. Set your spoken language (e.g., English).
5. The app will display a **5-letter conversation code** and/or a **QR code**.
6. Look for an option like **"Make this code permanent"** or **"Save conversation"** — turn this on so the code doesn't expire. (If you can't find this option, a regular code is still fine — just write it down and reuse it each time; codes are often valid for 24 hours, which is enough if everyone joins around the same time.)
7. **Write down the 5-letter code** somewhere safe — you'll give this to your mom and your partner.

---

## Step 5 — Join the conversation from each phone

### On the iPhone (partner):
1. Open Microsoft Translator.
2. Tap **"Conversation"** → **"Join a conversation"**.
3. Enter the 5-letter code (or scan the QR code).
4. When asked for a name, enter something simple (e.g., "Partner").
5. Choose **English** as the spoken/listening language.

### On the Huawei (mom):
1. Open Microsoft Translator.
2. Tap **"Conversation"** → **"Join a conversation"**.
3. Enter the same 5-letter code (or scan the QR code).
4. When asked for a name, enter something simple in Chinese (e.g., "妈妈").
5. Choose **Chinese (Simplified) / Mandarin** as the spoken/listening language.

---

## Step 6 — Daily use (what to teach them)

Once both are in the conversation:

1. **Press and hold** the big microphone button.
2. **Speak** in your own language.
3. **Release** the button when done.
4. Your words appear translated on the other person's screen — and the app can also **read it aloud** in their language (look for a speaker icon next to each message).

That's it — same steps every time, on both phones, in person or remote.

---

## Troubleshooting

- **Mom's Shanghai-accented Mandarin isn't recognized well:**
  - In the app's language settings, make sure the input language is set to **Chinese (Simplified, Mandarin/Putonghua)** — not Cantonese or another dialect.
  - Encourage speaking a little slower and closer to the microphone, with short sentences (the app handles short, clear sentences much better than long run-on speech).
  - If specific words/names are consistently wrong, it's usually a recognition issue with proper nouns — try spelling them out or using a more common alternative word.

- **No internet on one side:** As long as the offline language packs (Step 3) are downloaded, basic translation should still work, though quality and speech playback may be reduced offline.

- **Conversation code expired:** If you didn't find the "permanent code" option in Step 4, just create a new conversation, get a fresh code, and re-share it. Consider pinning the code somewhere both your mom and partner can find it (e.g., a note in a shared chat).

---

## Test checklist (do this before handing phones over)

Before teaching your mom and partner, test it yourself:

- [ ] Install the app on two phones (or your phone + a second device/tablet)
- [ ] Both join the same conversation code, one set to English, one set to Chinese (Simplified)
- [ ] On the English device: press mic, say "Hello, how are you today?" → confirm Chinese translation appears correctly on the other device
- [ ] On the Chinese device: press mic, say a Mandarin sentence → confirm English translation appears correctly
- [ ] Confirm the speaker/read-aloud icon works on both sides
- [ ] Close and reopen the app on both devices, rejoin with the same code, confirm it still works (this confirms the code is reusable for daily use)

Once all of these pass, you're ready to set up your mom's and partner's actual phones using Steps 1–5 above, then walk them through the cheat sheets:
- [`cheat-sheet-mom-zh.md`](cheat-sheet-mom-zh.md) — for your mom (in Chinese)
- [`cheat-sheet-partner-en.md`](cheat-sheet-partner-en.md) — for your partner (in English)
