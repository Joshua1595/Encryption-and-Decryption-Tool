const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const https = require('https');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Encryption endpoint
app.post('/encrypt', (req, res) => {
    const { text, key, algorithm, mode } = req.body;
    let encrypted;
    
    try {
        if (algorithm === 'AES') {
            encrypted = aesEncrypt(text, key, mode);
            res.json({ encrypted: encrypted.encrypted, iv: encrypted.iv });
        } else if (algorithm === '3DES') {
            encrypted = tripleDesEncrypt(text, key, mode);
            res.json({ encrypted: encrypted.encrypted, iv: encrypted.iv });
        } else if (algorithm === 'OTP') {
            const randomKey = generateRandomKey(text.length);
            encrypted = otpEncrypt(text, randomKey);
            res.json({ encrypted, key: randomKey });
        } else if (algorithm === 'RSA') {
            if (key && isValidKey(key, 'PUBLIC')) {
                encrypted = rsaEncrypt(text, key);
                res.json({ encrypted });
            } else {
                const { publicKey, privateKey } = generateRSAKeys();
                encrypted = rsaEncrypt(text, publicKey);
                res.json({ encrypted, publicKey, privateKey });
            }
        } else {
            throw new Error('Unsupported algorithm');
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Decryption endpoint
app.post('/decrypt', (req, res) => {
    const { text, key, algorithm, mode, iv, encryptionMode } = req.body;
    let decrypted;
    
    try {
        if (algorithm === 'AES') {
            decrypted = aesDecrypt(text, key, mode, iv);
        } else if (algorithm === '3DES') {
            decrypted = tripleDesDecrypt(text, key, mode, iv);
        } else if (algorithm === 'OTP') {
            decrypted = otpDecrypt(text, key);
        } else if (algorithm === 'RSA') {
            decrypted = rsaDecrypt(text, key);
        } else {
            throw new Error('Unsupported algorithm');
        }
        res.json({ decrypted });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// AES encryption with modes
function aesEncrypt(text, key, mode = 'ecb') {
    key = fixKeyLength(key, 16);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(`aes-128-${mode}`, Buffer.from(key), mode === 'ecb' ? null : iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return { encrypted, iv: mode === 'ecb' ? null : iv.toString('base64') };
}

// AES decryption with modes
function aesDecrypt(text, key, mode = 'ecb', iv = null) {
    key = fixKeyLength(key, 16);
    const decipher = crypto.createDecipheriv(`aes-128-${mode}`, Buffer.from(key), mode === 'ecb' ? null : Buffer.from(iv, 'base64'));
    let decrypted = decipher.update(text, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// 3DES encryption with modes
function tripleDesEncrypt(text, key, mode = 'ecb') {
    key = fixKeyLength(key, 24);
    const iv = crypto.randomBytes(8);
    const cipher = crypto.createCipheriv(`des-ede3-${mode}`, Buffer.from(key), mode === 'ecb' ? null : iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return { encrypted, iv: mode === 'ecb' ? null : iv.toString('base64') };
}

// 3DES decryption with modes
function tripleDesDecrypt(text, key, mode = 'ecb', iv = null) {
    key = fixKeyLength(key, 24);
    const decipher = crypto.createDecipheriv(`des-ede3-${mode}`, Buffer.from(key), mode === 'ecb' ? null : Buffer.from(iv, 'base64'));
    let decrypted = decipher.update(text, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
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

// RSA Functions
function generateRSAKeys() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return { publicKey, privateKey };
}

function rsaEncrypt(text, publicKey) {
    const buffer = Buffer.from(text, 'utf8');
    return crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
    }, buffer).toString('base64');
}

function rsaDecrypt(text, privateKey) {
    const buffer = Buffer.from(text, 'base64');
    return crypto.privateDecrypt({
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
    }, buffer).toString('utf8');
}

function isValidKey(key, type) {
    return key.includes(`-----BEGIN ${type} KEY-----`) && 
           key.includes(`-----END ${type} KEY-----`);
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

// HTTPS server configuration
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.cer'), // Changed from cert.pem to cert.cer
  // passphrase: 'yourpassword', // Uncomment if your key is encrypted
  // ca: fs.readFileSync('ca.pem'), // Optional, if you have a CA chain
};

https.createServer(options, app).listen(8443, () => {
  console.log('HTTPS  https://localhost:8443 ');
});