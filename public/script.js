let encryptionIV = null;
let encryptionMode = null;
let rsaKeyImportStep = 0;

// DOM Elements
const algorithmSelect = document.getElementById('algorithm');
const encryptKeyField = document.getElementById('encryptKey');
const decryptKeyField = document.getElementById('decryptKey');
const modeSelect = document.getElementById('mode');
const decryptModeSelect = document.getElementById('decryptMode');
const rsaWarning = document.getElementById('rsaWarning');
const importKeysBtn = document.getElementById('importKeysButton');
const privateKeyInput = document.getElementById('privateKeyFile');
const publicKeyInput = document.getElementById('publicKeyFile');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    algorithmSelect.dispatchEvent(new Event('change'));
});

// Algorithm selection handler
algorithmSelect.addEventListener('change', (e) => {
    const algorithm = e.target.value;
    const isRSA = algorithm === 'RSA';
    const isOTP = algorithm === 'OTP';

    // Reset all fields to default state
    encryptKeyField.readOnly = false;
    decryptKeyField.readOnly = false;
    encryptKeyField.placeholder = "Enter encryption key...";
    decryptKeyField.placeholder = "Enter decryption key...";
    modeSelect.disabled = false;
    decryptModeSelect.disabled = false;
    rsaWarning.style.display = 'none';
    importKeysBtn.style.display = 'none';

    // Special handling for specific algorithms
    if (isOTP) {
        encryptKeyField.readOnly = true;
        encryptKeyField.value = '';
        encryptKeyField.placeholder = "Key will be generated...";
        modeSelect.disabled = true;
        decryptModeSelect.disabled = true;
    } else if (isRSA) {
        encryptKeyField.readOnly = true;
        encryptKeyField.value = '';
        encryptKeyField.placeholder = "Public key (import .pem file)";
        decryptKeyField.readOnly = true;
        decryptKeyField.value = '';
        decryptKeyField.placeholder = "Private key (import .pem file)";
        modeSelect.disabled = true;
        decryptModeSelect.disabled = true;
        rsaWarning.style.display = 'block';
        importKeysBtn.style.display = 'block';
    }
});


// RSA Key Import Flow
importKeysBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (rsaKeyImportStep === 0) {
        publicKeyInput.value = '';
        privateKeyInput.value = '';
        rsaKeyImportStep = 1; // Next step is importing public key
        publicKeyInput.click();
    } else if (rsaKeyImportStep === 1 || rsaKeyImportStep === 1.5) {
        rsaKeyImportStep = 2; // Next step is importing private key
        privateKeyInput.click();
    } else if (rsaKeyImportStep === 2) {
        alert('Both public and private keys have been imported.');
        rsaKeyImportStep = 0; // Reset
    }
});

publicKeyInput.addEventListener('change', handlePublicKeyImport);
privateKeyInput.addEventListener('change', handlePrivateKeyImport);

async function handlePublicKeyImport(e) {
    if (rsaKeyImportStep === 1) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.pem')) {
            alert('Please select a .pem file for the public key');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            let publicKey = event.target.result;

            // Normalize and validate public key
            publicKey = normalizeKey(publicKey, 'PUBLIC');
            if (!isValidKey(publicKey, 'PUBLIC')) {
                showKeyFormatError('PUBLIC');
                rsaKeyImportStep = 0; // Reset on error
                return;
            }

            encryptKeyField.value = publicKey;
            alert('Public key successfully imported! Click "Import RSA Keys" again to import the private key.');
            rsaKeyImportStep = 1.5; // Indicate public key is loaded, waiting for next click
        };
        reader.onerror = () => {
            alert('Error reading public key file');
            rsaKeyImportStep = 0; // Reset on error
        };
        reader.readAsText(file);
    }
}

async function handlePrivateKeyImport(e) {
    if (rsaKeyImportStep === 2) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.pem')) {
            alert('Please select a .pem file for the private key');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            let privateKey = event.target.result;

            // Normalize and validate private key
            privateKey = normalizeKey(privateKey, 'PRIVATE');
            if (!isValidKey(privateKey, 'PRIVATE')) {
                showKeyFormatError('PRIVATE');
                rsaKeyImportStep = 1.5; // Go back to expecting private key on next click
                return;
            }

            decryptKeyField.value = privateKey;
            rsaKeyImportStep = 0; // Reset import process
            alert('Private key successfully imported!');
            alert('Both public and private keys have been imported.'); // Show final success message
        };
        reader.onerror = () => {
            alert('Error reading private key file');
            rsaKeyImportStep = 1.5; // Go back to expecting private key on next click
        };
        reader.readAsText(file);
    }
}
// Encryption handler
document.getElementById('encryptButton').addEventListener('click', handleEncryption);

async function handleEncryption() {
    const algorithm = algorithmSelect.value;
    const text = document.getElementById('encryptInput').value.trim();
    const key = encryptKeyField.value.trim();
    const mode = modeSelect.value;

    // Validate inputs
    if (!text) {
        alert('Please enter a message to encrypt.');
        return;
    }

    if (algorithm !== 'OTP' && algorithm !== 'RSA' && !key) {
        alert('Please enter an encryption key.');
        return;
    }

    if (algorithm === 'RSA' && !isValidKey(key, 'PUBLIC')) {
        alert('Please import a valid RSA public key file.');
        return;
    }

    try {
        // UI Feedback
        const btn = document.getElementById('encryptButton');
        btn.disabled = true;
        btn.textContent = 'Encrypting...';

        // API Call
        const response = await fetch('https://localhost:8443/encrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, key, algorithm, mode })
        });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        // Update UI
        document.getElementById('encryptOutput').value = data.encrypted;
        encryptionIV = data.iv;
        encryptionMode = mode;
        // For OTP, display the generated key
        if (algorithm === 'OTP' && data.key) {
            encryptKeyField.value = data.key;
        }
         
    } catch (error) {
        console.error('Encryption error:', error);
        alert(`Encryption failed: ${error.message}`);
    } finally {
        const btn = document.getElementById('encryptButton');
        btn.disabled = false;
        btn.textContent = 'Encrypt';
    }
}

// Decryption handler
document.getElementById('decryptButton').addEventListener('click', handleDecryption);

async function handleDecryption() {
    const algorithm = algorithmSelect.value;
    const text = document.getElementById('decryptInput').value.trim();
    const key = decryptKeyField.value;

    // Validate inputs
    if (!text || !key) {
        alert('Please enter both message and key.');
        return;
    }

    if (algorithm === 'RSA' && !isValidKey(key, 'PRIVATE')) {
        alert('Invalid RSA private key format.');
        return;
    }

    try {
        // UI Feedback
        const btn = document.getElementById('decryptButton');
        btn.disabled = true;
        btn.textContent = 'Decrypting...';

        // API Call
        const response = await fetch('https://localhost:8443/decrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                key,
                algorithm,
                mode: decryptModeSelect.value,
                iv: encryptionIV,
                encryptionMode
            })
        });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        // Update UI
        document.getElementById('decryptOutput').value = data.decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        alert("Decryption mode must be the same as Encryption Mode")
    } finally {
        const btn = document.getElementById('decryptButton');
        btn.disabled = false;
        btn.textContent = 'Decrypt';
    }
}

// Copy buttons functionality (no changes needed here)
document.getElementById('copyEncryptButton').addEventListener('click', () => {
    copyToClipboard('encryptOutput', 'Encrypted message');
});

document.getElementById('copyDecryptButton').addEventListener('click', () => {
    copyToClipboard('decryptOutput', 'Decrypted message');
});

document.getElementById('copyPublicKey').addEventListener('click', () => {
    copyToClipboard('encryptKey', 'Public key');
});

document.getElementById('copyPrivateKey').addEventListener('click', () => {
    const privateKey = decryptKeyField.value;
    if (!privateKey) {
        alert('No private key to copy.');
        return;
    }

    if (confirm('WARNING: Private keys should be kept secret. Copy to clipboard anyway?')) {
        copyToClipboard('decryptKey', 'Private key');
    }
});

// Helper functions (no changes needed here)
function copyToClipboard(elementId, label) {
    const text = document.getElementById(elementId).value;
    if (!text) {
        alert(`No ${label.toLowerCase()} to copy.`);
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => alert(`${label} copied to clipboard!`))
        .catch(err => {
            console.error('Copy failed:', err);
            alert(`Failed to copy ${label.toLowerCase()}.`);
        });
}

function isValidKey(key, type) {
    if (!key) return false;

    const beginMarker = `-----BEGIN ${type} KEY-----`;
    const endMarker = `-----END ${type} KEY-----`;

    return key.includes(beginMarker) &&
           key.includes(endMarker) &&
           key.indexOf(beginMarker) < key.indexOf(endMarker) &&
           key.length > beginMarker.length + endMarker.length + 10;
}

function normalizeKey(key, type) {
    key = key.replace(/\r\n/g, '\n').trim();

    // Fix common format issues
    if (type === 'PRIVATE') {
        if (key.includes('BEGIN RSA PRIVATE KEY')) {
            return key.replace('BEGIN RSA PRIVATE KEY', 'BEGIN PRIVATE KEY')
                      .replace('END RSA PRIVATE KEY', 'END PRIVATE KEY');
        }
    } else if (type === 'PUBLIC') {
        if (key.includes('BEGIN RSA PUBLIC KEY')) {
            return key.replace('BEGIN RSA PUBLIC KEY', 'BEGIN PUBLIC KEY')
                      .replace('END RSA PUBLIC KEY', 'END PUBLIC KEY');
        }
    }

    // Add headers if missing
    if (!key.includes('BEGIN')) {
        return `-----BEGIN ${type} KEY-----\n${key}\n-----END ${type} KEY-----`;
    }

    return key;
}

function formatKey(key, keyType) {
    if (!key.includes(`-----BEGIN ${keyType}-----`)) {
        key = `-----BEGIN ${keyType}-----\n${key}\n-----END ${keyType}-----`;
    }
    return key;
}

function showKeyFormatError(type) {
    const example = type === 'PRIVATE' ?
        "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----" :
        "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----";

    alert(`Invalid ${type.toLowerCase()} key format. Your key should look like:\n\n${example}\n\n` +
          `Please ensure you're using a valid PEM format key file.`);
}