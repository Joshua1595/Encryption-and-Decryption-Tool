let encryptionIV = null; // Store the IV for decryption
let encryptionMode = null; // Store the encryption mode

// Handle algorithm selection changes
document.getElementById('algorithm').addEventListener('change', (e) => {
    const algorithm = e.target.value;
    const encryptKeyInput = document.getElementById('encryptKey');
    const decryptKeyInput = document.getElementById('decryptKey');
    const modeSelect = document.getElementById('mode');
    const decryptModeSelect = document.getElementById('decryptMode');
    const rsaWarning = document.getElementById('rsaWarning');

    // Reset all fields to default state first
    encryptKeyInput.readOnly = false;
    decryptKeyInput.readOnly = false;
    encryptKeyInput.placeholder = "Enter encryption key...";
    decryptKeyInput.placeholder = "Enter decryption key...";
    modeSelect.disabled = false;
    decryptModeSelect.disabled = false;
    rsaWarning.style.display = 'none';

    // Special handling for specific algorithms
    if (algorithm === 'OTP') {
        encryptKeyInput.readOnly = true;
        encryptKeyInput.value = '';
        encryptKeyInput.placeholder = "Key will be generated...";
        modeSelect.disabled = true;
        decryptModeSelect.disabled = true;
    } else if (algorithm === 'RSA') {
        encryptKeyInput.readOnly = true;
        encryptKeyInput.value = '';
        encryptKeyInput.placeholder = "Public key will be generated...";
        decryptKeyInput.readOnly = true;
        decryptKeyInput.value = '';
        decryptKeyInput.placeholder = "Private key will be generated...";
        modeSelect.disabled = true;
        decryptModeSelect.disabled = true;
        rsaWarning.style.display = 'block';
    }
});

// Handle encryption button click
document.getElementById('encryptButton').addEventListener('click', async () => {
    const algorithm = document.getElementById('algorithm').value;
    const text = document.getElementById('encryptInput').value.trim();
    const key = document.getElementById('encryptKey').value.trim();
    const mode = document.getElementById('mode').value;
    
    // Validate inputs
    if (!text) {
        alert('Please enter a message to encrypt.');
        return;
    }
    
    if (algorithm !== 'OTP' && algorithm !== 'RSA' && !key) {
        alert('Please enter an encryption key.');
        return;
    }

    try {
        // Show loading state
        const encryptButton = document.getElementById('encryptButton');
        encryptButton.disabled = true;
        encryptButton.textContent = 'Encrypting...';

        const response = await fetch('/encrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, key, algorithm, mode }),
        });

        const data = await response.json();
        if (data.error) {
            alert(`Error: ${data.error}`);
        } else {
            document.getElementById('encryptOutput').value = data.encrypted;
            encryptionIV = data.iv;
            encryptionMode = mode;
            
            // Handle algorithm-specific responses
            if (algorithm === 'OTP') {
                document.getElementById('encryptKey').value = data.key;
                document.getElementById('decryptKey').value = data.key;
            } else if (algorithm === 'RSA') {
                const formattedPublicKey = formatKey(data.publicKey, 'PUBLIC KEY');
                const formattedPrivateKey = formatKey(data.privateKey, 'PRIVATE KEY');
                document.getElementById('encryptKey').value = formattedPublicKey;
                document.getElementById('decryptKey').value = formattedPrivateKey;
            }
        }
    } catch (error) {
        console.error('Encryption error:', error);
        alert('Encryption failed. Please check the console for details.');
    } finally {
        // Reset button state
        const encryptButton = document.getElementById('encryptButton');
        encryptButton.disabled = false;
        encryptButton.textContent = 'Encrypt';
    }
});

// Handle decryption button click
document.getElementById('decryptButton').addEventListener('click', async () => {
    const algorithm = document.getElementById('algorithm').value;
    const text = document.getElementById('decryptInput').value.trim();
    let key = document.getElementById('decryptKey').value;
    const mode = document.getElementById('decryptMode').value;

    // Validate inputs
    if (!text) {
        alert('Please enter a message to decrypt.');
        return;
    }
    
    if (!key) {
        alert('Please enter a decryption key.');
        return;
    }

    try {
        // Show loading state
        const decryptButton = document.getElementById('decryptButton');
        decryptButton.disabled = true;
        decryptButton.textContent = 'Decrypting...';

        const response = await fetch('/decrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                text, 
                key, 
                algorithm, 
                mode, 
                iv: encryptionIV, 
                encryptionMode 
            }),
        });

        const data = await response.json();
        if (data.error) {
            alert(`Error: ${data.error}`);
        } else {
            document.getElementById('decryptOutput').value = data.decrypted;
        }
    } catch (error) {
        console.error('Decryption error:', error);
        alert('Decryption failed. Please check the console for details.');
    } finally {
        // Reset button state
        const decryptButton = document.getElementById('decryptButton');
        decryptButton.disabled = false;
        decryptButton.textContent = 'Decrypt';
    }
});

// Copy encrypted message to clipboard
document.getElementById('copyEncryptButton').addEventListener('click', () => {
    const encryptedMessage = document.getElementById('encryptOutput').value;
    if (encryptedMessage) {
        navigator.clipboard.writeText(encryptedMessage)
            .then(() => alert('Encrypted message copied to clipboard!'))
            .catch(err => console.error('Failed to copy:', err));
    } else {
        alert('No encrypted message to copy.');
    }
});

// Copy decrypted message to clipboard
document.getElementById('copyDecryptButton').addEventListener('click', () => {
    const decryptedMessage = document.getElementById('decryptOutput').value;
    if (decryptedMessage) {
        navigator.clipboard.writeText(decryptedMessage)
            .then(() => alert('Decrypted message copied to clipboard!'))
            .catch(err => console.error('Failed to copy:', err));
    } else {
        alert('No decrypted message to copy.');
    }
});

// Copy public key to clipboard
document.getElementById('copyPublicKey').addEventListener('click', () => {
    const publicKey = document.getElementById('encryptKey').value;
    if (publicKey) {
        navigator.clipboard.writeText(publicKey)
            .then(() => alert('Public key copied to clipboard!'))
            .catch(err => console.error('Failed to copy:', err));
    } else {
        alert('No public key to copy.');
    }
});

// Copy private key to clipboard
document.getElementById('copyPrivateKey').addEventListener('click', () => {
    const privateKey = document.getElementById('decryptKey').value;
    if (privateKey) {
        if (confirm('WARNING: Private keys should be kept secret. Copy anyway?')) {
            navigator.clipboard.writeText(privateKey)
                .then(() => alert('Private key copied to clipboard!'))
                .catch(err => console.error('Failed to copy:', err));
        }
    } else {
        alert('No private key to copy.');
    }
});

// Helper function to format keys with proper headers
function formatKey(key, keyType) {
    if (!key.includes(`-----BEGIN ${keyType}-----`)) {
        key = `-----BEGIN ${keyType}-----\n${key}\n-----END ${keyType}-----`;
    }
    return key;
}

// Initialize the UI based on the default algorithm
document.addEventListener('DOMContentLoaded', () => {
    // Trigger the algorithm change handler to set initial state
    document.getElementById('algorithm').dispatchEvent(new Event('change'));
});