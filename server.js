const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Encryption endpoint
app.post('/encrypt', (req, res) => {
    const { text, key, algorithm, mode } = req.body;
    let encrypted;
    try {
        if (algorithm === 'AES') {
            encrypted = aesEncrypt(text, key, mode);
        } else if (algorithm === '3DES') {
            encrypted = tripleDesEncrypt(text, key, mode);
        } else if (algorithm === 'OTP') {
            const randomKey = generateRandomKey(text.length);
            encrypted = otpEncrypt(text, randomKey);
            res.json({ encrypted, key: randomKey }); // Send the generated key back to the front-end
            return;
        } else {
            throw new Error('Unsupported algorithm');
        }
        res.json({ encrypted: encrypted.encrypted, iv: encrypted.iv }); // Return only the encrypted message and IV
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Decryption endpoint
app.post('/decrypt', (req, res) => {
    const { text, key, algorithm, mode, iv, encryptionMode } = req.body;
    let decrypted;
    try {
        // Check if the decryption mode matches the encryption mode
        if (mode !== encryptionMode) {
            throw new Error('Decryption mode must match the encryption mode.');
        }

        if (algorithm === 'AES') {
            decrypted = aesDecrypt(text, key, mode, iv);
        } else if (algorithm === '3DES') {
            decrypted = tripleDesDecrypt(text, key, mode, iv);
        } else if (algorithm === 'OTP') {
            decrypted = otpDecrypt(text, key);
        } else {
            throw new Error('Unsupported algorithm');
        }
        res.json({ decrypted }); // Return only the decrypted message
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// AES encryption with modes
function aesEncrypt(text, key, mode = 'ecb') {
    key = fixKeyLength(key, 16);
    const iv = crypto.randomBytes(16); // Initialization vector for modes other than ECB
    const cipher = crypto.createCipheriv(`aes-128-${mode}`, Buffer.from(key), mode === 'ecb' ? null : iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return { encrypted, iv: mode === 'ecb' ? null : iv.toString('base64') }; // Return encrypted message and IV
}

// AES decryption with modes
function aesDecrypt(text, key, mode = 'ecb', iv = null) {
    key = fixKeyLength(key, 16);
    const decipher = crypto.createDecipheriv(`aes-128-${mode}`, Buffer.from(key), mode === 'ecb' ? null : Buffer.from(iv, 'base64'));
    let decrypted = decipher.update(text, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted; // Return the decrypted message
}

// 3DES encryption with modes
function tripleDesEncrypt(text, key, mode = 'ecb') {
    key = fixKeyLength(key, 24);
    const iv = crypto.randomBytes(8); // Initialization vector for modes other than ECB
    const cipher = crypto.createCipheriv(`des-ede3-${mode}`, Buffer.from(key), mode === 'ecb' ? null : iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return { encrypted, iv: mode === 'ecb' ? null : iv.toString('base64') }; // Return encrypted message and IV
}

// 3DES decryption with modes
function tripleDesDecrypt(text, key, mode = 'ecb', iv = null) {
    key = fixKeyLength(key, 24);
    const decipher = crypto.createDecipheriv(`des-ede3-${mode}`, Buffer.from(key), mode === 'ecb' ? null : Buffer.from(iv, 'base64'));
    let decrypted = decipher.update(text, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted; // Return the decrypted message
}

// OTP encryption
function otpEncrypt(text, key) {
    if (key.length !== text.length) throw new Error('Key length must be equal to text length for OTP.');
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
        encrypted += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i));
    }
    return Buffer.from(encrypted).toString('base64');
}

// OTP decryption
function otpDecrypt(text, key) {
    const decodedText = Buffer.from(text, 'base64').toString('utf8');
    if (key.length !== decodedText.length) throw new Error('Key length must be equal to text length for OTP.');
    let decrypted = '';
    for (let i = 0; i < decodedText.length; i++) {
        decrypted += String.fromCharCode(decodedText.charCodeAt(i) ^ key.charCodeAt(i));
    }
    return decrypted;
}

// Generate random key for OTP
function generateRandomKey(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < length; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

// Fix key length
function fixKeyLength(key, length) {
    while (key.length < length) key += key;
    return key.substring(0, length);
}

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});