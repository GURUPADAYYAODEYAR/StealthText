# StealthText – Encrypted Image Steganography Tool

**Hide secret messages inside ordinary images – with strong encryption and no visible change.**

![StealthText Demo](https://via.placeholder.com/800x400?text=StealthText+UI+Preview)  
*(Replace with an actual screenshot of your tool)*

---

## ✨ Overview

StealthText is a **100% client‑side** web application that lets you embed a text message into an image using **LSB steganography** (Least Significant Bit). The resulting image looks identical to the original, but contains your hidden message – optionally encrypted with **AES‑256‑GCM** using a password.

- 🔒 **No data ever leaves your browser** – everything happens locally.
- 🖼️ Works with PNG, JPEG, WebP (output is always PNG to preserve hidden data).
- 🔑 Optional password encryption (PBKDF2 + AES‑256‑GCM).
- 📤 Download the encoded image and share it anywhere.
- 📥 Upload an encoded image later to extract the hidden message.

---

## 🚀 Live Demo

[Click here to try StealthText online](#)  
(Add your GitHub Pages or Vercel link once deployed)

---

## 📋 Features

| Feature | Description |
|---------|-------------|
| **Image upload** | Drag & drop or file picker (max 25 MB, up to 4096×4096) |
| **Secret message** | Multi‑line text area, 5000 character limit |
| **Optional password** | If provided, message is encrypted with AES‑256‑GCM |
| **Capacity indicator** | Real‑time bar showing how much of the image is used |
| **Encoding** | Hides data in RGB LSBs, adds a 32‑bit length header |
| **Download** | Saves the encoded image as a lossless PNG |
| **Decoding** | Extracts and decrypts the hidden message from any PNG |
| **Copy extracted text** | One‑click copy to clipboard |
| **Toast notifications** | Clear success/error/warning messages |
| **Fully offline** | Works without an internet connection (after first load) |

---

## 🧠 How It Works

### Steganography (LSB Encoding)
- Each pixel has Red, Green, Blue channels (8 bits each).
- We modify only the **least significant bit** of each channel (1 bit per channel, 3 bits per pixel).
- The change is imperceptible to the human eye (only ±1 in colour value).
- The hidden data is preceded by a **magic header** (`STXT`) and a 32‑bit length to allow reliable extraction.

### Encryption (Optional)
- If a password is provided:
  - A random salt (16 bytes) and IV (12 bytes) are generated.
  - PBKDF2 (100,000 iterations) derives a 256‑bit key.
  - The message is encrypted with **AES‑256‑GCM**.
  - Salt, IV, and ciphertext (with authentication tag) are embedded together.
- If no password is used, the message is embedded as plain text (but still obfuscated via LSB).

### Decoding
- The tool reads the LSBs from the uploaded image to recover the payload.
- It checks for the `STXT` magic header and reads the length.
- If the payload starts with a flag indicating encryption, the user is prompted for the password.
- Decryption is performed using the same PBKDF2 parameters (salt and IV are stored alongside the ciphertext).

---

## 🖥️ Installation & Usage

You don’t need to install anything. Just open the `STEALTHTEXT-V1.html` file in any modern browser (Chrome, Firefox, Safari, Edge).

### Steps to hide a message

1. **Upload an image** – Drag & drop or click the upload zone.
2. **Type your secret message** (up to 5000 characters).
3. **(Optional) Enter a password** – leave blank for no encryption.
4. Click **🔒 Encrypt & Hide**.
5. Wait for completion, then click **⬇ Download PNG**.
6. Share the PNG image – the hidden message will survive.

### Steps to extract a message

1. **Upload the encoded image** (the PNG you downloaded earlier).
2. **If the message was encrypted**, enter the same password.
3. Click **🔍 Reveal Hidden Text**.
4. The extracted message will appear – copy it if needed.

---

## 🛠️ Technical Stack

- **Languages**: HTML5, CSS3, Vanilla JavaScript (ES2020)
- **APIs used**:
  - File API & Drag & Drop
  - Canvas API (pixel manipulation, `ImageData`)
  - Web Crypto API (`crypto.subtle` – AES‑GCM, PBKDF2)
  - `TextEncoder` / `TextDecoder`
- **No external libraries** – fully self‑contained.
- **Styling**: Custom CSS with glassmorphism, monospace fonts, and responsive grid.

---

## 🔒 Security & Privacy

- **All processing is client‑side** – no image or message is ever uploaded to any server.
- **Passwords are never stored** – they are used only temporarily to derive an encryption key.
- **Salt & IV are randomly generated** for each encoding session, ensuring unique ciphertext even for identical messages.
- **AES‑256‑GCM provides authenticated encryption** – tampering with the image will cause decryption to fail.

> ⚠️ **Warning**: If you forget the password, the message is **irrecoverable**. There is no backdoor.

---

## ⚠️ Important Notes

- **Always keep the encoded image as PNG**. Saving it as JPEG will re‑compress the pixels and destroy the hidden data.
- **Large messages need larger images**. The capacity bar shows how many bytes your image can hold.
- **JPEG uploads are allowed** for encoding, but the output will be PNG. The original JPEG will not be modified.
- **Decoding JPEG images** may fail if they have been re‑saved or compressed after encoding.

---

## 🧪 Test Cases (Acceptance Criteria)

| Test | Expected Result |
|------|------------------|
| Encode "Hello world" in a PNG, then decode same PNG | "Hello world" appears |
| Encode with password `abc123`, decode without password | Error / garbage |
| Encode with password `abc123`, decode with correct password | Original message |
| Encode a long message in a tiny image (e.g., 100×100) | Error: "Image too small" |
| Upload a non‑image file | Error toast |
| Decode a random image never encoded | "No hidden message found" |
| Encode with empty message | Encode button disabled |

---

## 📄 License

This project is open‑source and available under the **MIT License**.  
Feel free to use, modify, and distribute it.

---

## 👤 Author

**Gurupadayya Odeyar**  
- Email: [gurupadayyaodeyar@gmail.com]  
- GitHub: *(https://github.com/GURUPADAYYAODEYAR)*

---

## 🙏 Acknowledgements

- Web Crypto API documentation (MDN)
- LSB steganography concepts from digital image processing
- Fonts: [JetBrains Mono]
---

## 📮 Future Enhancements (Roadmap)

- [ ] Support for animated GIFs (frame‑by‑frame LSB)
- [ ] QR code fallback for very long messages
- [ ] Batch encoding (multiple messages in one image)
- [ ] Steganalysis resistance (randomised LSB patterns)
- [ ] Light / dark mode toggle (already designed but optional)

---

**Built with ❤️ and pure JavaScript – no servers, no trackers, just secrets.**