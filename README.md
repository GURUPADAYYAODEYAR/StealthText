# StealthText - Encrypted Image Steganography Tool

**StealthText** is a robust, entirely client-side web application that allows you to hide an encrypted text message inside a standard image file (PNG/JPEG) without perceptible changes. This leverages Least Significant Bit (LSB) steganography paired with military-grade AES-256-GCM encryption.

## Features
- **Client-Side Processing**: No servers, no backend. All encoding, decoding, and cryptography happen entirely in your browser using the Web Crypto API and Canvas API.
- **AES-256-GCM Encryption**: Secure your text with an optional password before it is steganographically embedded.
- **LSB Steganography**: Embeds the secret message directly into the pixel data (RGB channels) of the image seamlessly.
- **Modern UI**: An intuitive, responsive interface with a sleek glassmorphism aesthetic.
- **Validation & Fallbacks**: Image capacity calculation, file size/type validation, and error handling for corrupted data or incorrect passwords.

## How to Use

### Encrypt & Hide (Encoding)
1. Drag & drop or browse for an image (PNG or JPEG, Max 25MB).
2. Type the secret message you wish to hide (max 5000 characters). Ensure it fits within the image's capacity limit.
3. (Optional) Provide a password to encrypt the message. Without a password, the text will be embedded as plain-text inside the image pixels.
4. Click **Encrypt & Hide**.
5. Click **Download PNG** to retrieve your steganographically modified image. *Note: Saving as JPEG or modifying the image further will destroy the hidden data.*

### Decode & Reveal
1. Upload an image previously processed by StealthText.
2. If you used a password to encrypt the data, enter it in the password field.
3. Click **Reveal Hidden Text**.
4. The hidden message will be extracted, decrypted, and displayed!

## Deployment to GitHub

To host this project for free using GitHub Pages:
1. Initialize a git repository locally: `git init`
2. Add all files: `git add .`
3. Commit the code: `git commit -m "Initial commit"`
4. Link to your new GitHub repository: `git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git`
5. Push to the main branch: `git push -u origin main`
6. On GitHub, navigate to **Settings** > **Pages**, select the `main` branch, and click **Save**. The app will be live!

## Tech Stack
- HTML5
- Custom CSS3 (Glassmorphism, Variables, Flexbox, Grid)
- Vanilla JavaScript (ES6, Web Crypto API, Canvas API, FileReader)

## Credits
**Made by:** Gurupadayya Odeyar  
**Email:** [gurupadayyaodeyar@gmail.com](mailto:gurupadayyaodeyar@gmail.com)
