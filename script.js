// Core Application Logic for StealthText
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_MESSAGE_LENGTH = 5000;
const MAGIC_BYTES = new Uint8Array([83, 84, 88, 49]); // 'STX1'

document.addEventListener('DOMContentLoaded', () => {
    // Encode UI Elements
    const encodeDropzone = document.getElementById('encode-dropzone');
    const encodeFile = document.getElementById('encode-file');
    const encodeUploadContent = document.getElementById('encode-upload-content');
    const encodePreviewContainer = document.getElementById('encode-preview-container');
    const encodePreview = document.getElementById('encode-preview');
    const encodeRemove = document.getElementById('encode-remove');
    const secretMessage = document.getElementById('secret-message');
    const charCount = document.getElementById('char-count');
    const capacityIndicator = document.getElementById('capacity-indicator');
    const encodePassword = document.getElementById('encode-password');
    const encodeBtn = document.getElementById('encode-btn');
    const downloadBtn = document.getElementById('download-btn');
    const encodeLoader = document.getElementById('encode-loader');

    // Decode UI Elements
    const decodeDropzone = document.getElementById('decode-dropzone');
    const decodeFile = document.getElementById('decode-file');
    const decodeUploadContent = document.getElementById('decode-upload-content');
    const decodePreviewContainer = document.getElementById('decode-preview-container');
    const decodePreview = document.getElementById('decode-preview');
    const decodeRemove = document.getElementById('decode-remove');
    const decodePassword = document.getElementById('decode-password');
    const decodeBtn = document.getElementById('decode-btn');
    const decodeLoader = document.getElementById('decode-loader');
    const resultPanel = document.getElementById('result-panel');
    const decodedText = document.getElementById('decoded-text');
    const copyBtn = document.getElementById('copy-btn');

    // State variables
    let currentEncodeImage = null;
    let currentDecodeImage = null;
    let encodedImageBlob = null;
    let maxCapacityBytes = 0;

    // ----- UI Interactions -----

    // Drag and Drop Logic
    function setupDropzone(dropzone, input, callback) {
        dropzone.addEventListener('click', (e) => {
            if(e.target.tagName !== 'BUTTON') {
                input.click();
            }
        });
        
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });
        
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                input.files = e.dataTransfer.files;
                callback(input.files[0]);
            }
        });

        input.addEventListener('change', () => {
            if (input.files && input.files.length > 0) {
                callback(input.files[0]);
            }
        });
    }

    setupDropzone(encodeDropzone, encodeFile, handleEncodeFile);
    setupDropzone(decodeDropzone, decodeFile, handleDecodeFile);

    function handleEncodeFile(file) {
        if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
            showToast('Please select a PNG or JPEG image.', 'error');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            showToast('Image size exceeds 25MB limit.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                currentEncodeImage = img;
                encodePreview.src = e.target.result;
                encodeUploadContent.classList.add('hidden');
                encodePreviewContainer.classList.remove('hidden');
                
                // Calculate capacity: (Width * Height * 3) / 8 bytes
                const totalPixels = img.width * img.height;
                maxCapacityBytes = Math.floor((totalPixels * 3) / 8) - 9; // -9 for header
                
                if (maxCapacityBytes < 0) maxCapacityBytes = 0;
                
                capacityIndicator.textContent = `Image capacity: ~${maxCapacityBytes} chars`;
                capacityIndicator.style.color = 'var(--text-muted)';
                
                checkEncodeReadiness();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function handleDecodeFile(file) {
        if (!file.type.match('image/png')) {
            showToast('Please select a PNG image for decoding. JPEGs destroy hidden data.', 'warning');
            // Still allow it, but warn them
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                currentDecodeImage = img;
                decodePreview.src = e.target.result;
                decodeUploadContent.classList.add('hidden');
                decodePreviewContainer.classList.remove('hidden');
                decodeBtn.disabled = false;
                resultPanel.classList.add('hidden');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Remove buttons
    encodeRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        currentEncodeImage = null;
        encodeFile.value = '';
        encodePreview.src = '';
        encodeUploadContent.classList.remove('hidden');
        encodePreviewContainer.classList.add('hidden');
        capacityIndicator.textContent = `Image capacity: 0 chars`;
        downloadBtn.classList.add('hidden');
        checkEncodeReadiness();
    });

    decodeRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        currentDecodeImage = null;
        decodeFile.value = '';
        decodePreview.src = '';
        decodeUploadContent.classList.remove('hidden');
        decodePreviewContainer.classList.add('hidden');
        decodeBtn.disabled = true;
        resultPanel.classList.add('hidden');
    });

    // Text area listener
    secretMessage.addEventListener('input', () => {
        const len = secretMessage.value.length;
        charCount.textContent = `${len} / ${MAX_MESSAGE_LENGTH}`;
        
        if (len > maxCapacityBytes && currentEncodeImage) {
            capacityIndicator.style.color = 'var(--error)';
            capacityIndicator.textContent = `Message exceeds capacity by ${len - maxCapacityBytes} chars!`;
        } else if (currentEncodeImage) {
            capacityIndicator.style.color = 'var(--text-muted)';
            capacityIndicator.textContent = `Image capacity: ~${maxCapacityBytes} chars`;
        }
        
        checkEncodeReadiness();
    });

    function checkEncodeReadiness() {
        const textLen = secretMessage.value.length;
        const isReady = currentEncodeImage && textLen > 0 && textLen <= maxCapacityBytes && textLen <= MAX_MESSAGE_LENGTH;
        encodeBtn.disabled = !isReady;
    }

    // ----- Cryptography & Steganography Core -----

    async function deriveKey(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );
        return crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    }

    async function encryptMessage(text, password) {
        if (!password) {
            const enc = new TextEncoder();
            return enc.encode(text);
        }
        const enc = new TextEncoder();
        const encodedText = enc.encode(text);
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveKey(password, salt);
        
        const ciphertext = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            encodedText
        );
        
        const payload = new Uint8Array(16 + 12 + ciphertext.byteLength);
        payload.set(salt, 0);
        payload.set(iv, 16);
        payload.set(new Uint8Array(ciphertext), 28);
        return payload;
    }

    async function decryptMessage(payload, password, hasPassword) {
        if (!hasPassword) {
            const dec = new TextDecoder();
            return dec.decode(payload);
        }
        if (!password) {
            throw new Error("Message is encrypted, but no password was provided.");
        }
        
        const salt = payload.slice(0, 16);
        const iv = payload.slice(16, 28);
        const ciphertext = payload.slice(28);
        
        const key = await deriveKey(password, salt);
        try {
            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                ciphertext
            );
            const dec = new TextDecoder();
            return dec.decode(decrypted);
        } catch (e) {
            throw new Error("Decryption failed. Incorrect password.");
        }
    }

    function encodeLSB(imageData, payload, hasPassword) {
        const data = imageData.data;
        const totalBytes = 9 + payload.length; // 4 magic + 4 len + 1 flag + payload
        const totalBits = totalBytes * 8;
        
        const capacityBits = (data.length / 4) * 3;
        if (totalBits > capacityBits) {
            throw new Error("Image too small to hold this message.");
        }
        
        const fullPayload = new Uint8Array(totalBytes);
        fullPayload.set(MAGIC_BYTES, 0);
        new DataView(fullPayload.buffer).setUint32(4, payload.length, false);
        fullPayload[8] = hasPassword ? 1 : 0;
        fullPayload.set(payload, 9);
        
        let bitIndex = 0;
        for (let i = 0; i < data.length; i++) {
            if ((i + 1) % 4 === 0) continue; // Skip alpha
            
            if (bitIndex < totalBits) {
                const byteIndex = Math.floor(bitIndex / 8);
                const bitInByte = 7 - (bitIndex % 8);
                const bit = (fullPayload[byteIndex] >> bitInByte) & 1;
                
                data[i] = (data[i] & 0xFE) | bit; // Set LSB
                bitIndex++;
            } else {
                break;
            }
        }
        return imageData;
    }

    function decodeLSB(imageData) {
        const data = imageData.data;
        const headerBits = 72; // 9 bytes * 8
        const headerBytes = new Uint8Array(9);
        let bitIndex = 0;
        
        for (let i = 0; i < data.length; i++) {
            if ((i + 1) % 4 === 0) continue;
            
            if (bitIndex < headerBits) {
                const bit = data[i] & 1;
                const byteIndex = Math.floor(bitIndex / 8);
                const bitInByte = 7 - (bitIndex % 8);
                if (bit) headerBytes[byteIndex] |= (1 << bitInByte);
                bitIndex++;
            } else {
                break;
            }
        }
        
        // Verify Magic
        for (let i = 0; i < 4; i++) {
            if (headerBytes[i] !== MAGIC_BYTES[i]) {
                throw new Error("No hidden message found in this image.");
            }
        }
        
        const payloadLength = new DataView(headerBytes.buffer).getUint32(4, false);
        const hasPassword = headerBytes[8] === 1;
        
        // Sanity Check
        const maxPossiblePayload = ((data.length / 4) * 3 / 8) - 9;
        if (payloadLength === 0 || payloadLength > maxPossiblePayload) {
            throw new Error("Corrupted hidden data found.");
        }
        
        const totalBits = (9 + payloadLength) * 8;
        const payload = new Uint8Array(payloadLength);
        bitIndex = 0;
        
        for (let i = 0; i < data.length; i++) {
            if ((i + 1) % 4 === 0) continue;
            
            if (bitIndex >= headerBits && bitIndex < totalBits) {
                const bit = data[i] & 1;
                const payloadBitIndex = bitIndex - headerBits;
                const byteIndex = Math.floor(payloadBitIndex / 8);
                const bitInByte = 7 - (payloadBitIndex % 8);
                if (bit) payload[byteIndex] |= (1 << bitInByte);
            }
            bitIndex++;
            if (bitIndex >= totalBits) break;
        }
        
        return { payload, hasPassword };
    }

    // ----- Action Listeners -----

    encodeBtn.addEventListener('click', async () => {
        const text = secretMessage.value;
        const password = encodePassword.value;
        
        encodeBtn.disabled = true;
        encodeLoader.classList.remove('hidden');
        downloadBtn.classList.add('hidden');
        
        try {
            // Give UI time to show loader
            await new Promise(r => setTimeout(r, 50)); 
            
            const payload = await encryptMessage(text, password);
            
            const canvas = document.createElement('canvas');
            canvas.width = currentEncodeImage.width;
            canvas.height = currentEncodeImage.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(currentEncodeImage, 0, 0);
            
            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            imageData = encodeLSB(imageData, payload, password.length > 0);
            ctx.putImageData(imageData, 0, 0);
            
            canvas.toBlob((blob) => {
                encodedImageBlob = blob;
                const url = URL.createObjectURL(blob);
                encodePreview.src = url; // Show modified image
                downloadBtn.classList.remove('hidden');
                showToast('Image successfully encrypted & encoded!', 'success');
                encodeBtn.disabled = false;
                encodeLoader.classList.add('hidden');
            }, 'image/png');
            
        } catch (e) {
            showToast(e.message, 'error');
            encodeBtn.disabled = false;
            encodeLoader.classList.add('hidden');
        }
    });

    downloadBtn.addEventListener('click', () => {
        if (!encodedImageBlob) return;
        const url = URL.createObjectURL(encodedImageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stealthtext_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    decodeBtn.addEventListener('click', async () => {
        const password = decodePassword.value;
        
        decodeBtn.disabled = true;
        decodeLoader.classList.remove('hidden');
        resultPanel.classList.add('hidden');
        
        try {
            await new Promise(r => setTimeout(r, 50));
            
            const canvas = document.createElement('canvas');
            canvas.width = currentDecodeImage.width;
            canvas.height = currentDecodeImage.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(currentDecodeImage, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const { payload, hasPassword } = decodeLSB(imageData);
            
            const text = await decryptMessage(payload, password, hasPassword);
            
            decodedText.textContent = text;
            resultPanel.classList.remove('hidden');
            showToast('Message successfully revealed!', 'success');
            
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            decodeBtn.disabled = false;
            decodeLoader.classList.add('hidden');
        }
    });

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(decodedText.textContent).then(() => {
            showToast('Copied to clipboard!', 'info');
        }).catch(() => {
            showToast('Failed to copy', 'error');
        });
    });

    // ----- Utility: Toast Notifications -----
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '';
        if(type === 'success') icon = '✅';
        else if(type === 'error') icon = '❌';
        else if(type === 'warning') icon = '⚠️';
        else icon = 'ℹ️';

        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 3000);
    }
});
