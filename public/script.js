let encryptionIV = null; // Store the IV for decryption
let encryptionMode = null; // Store the encryption mode

document.getElementById('algorithm').addEventListener('change', (e) => {
    const algorithm = e.target.value;
    const encryptKeyInput = document.getElementById('encryptKey');
    const modeSelect = document.getElementById('mode');
    const decryptModeSelect = document.getElementById('decryptMode');

    if (algorithm === 'OTP') {
        encryptKeyInput.readOnly = true;
        encryptKeyInput.value = ''; // Clear the key input for OTP
        modeSelect.disabled = true;
        decryptModeSelect.disabled = true;
    } else {
        encryptKeyInput.readOnly = false;
        modeSelect.disabled = false;
        decryptModeSelect.disabled = false;
    }
});

document.getElementById('encryptButton').addEventListener('click', async () => {
    const algorithm = document.getElementById('algorithm').value;
    const text = document.getElementById('encryptInput').value.trim();
    const key = document.getElementById('encryptKey').value.trim();
    const mode = document.getElementById('mode').value;
    
    if (!text || (algorithm !== 'OTP' && !key)) {
        alert('Please enter a message and key.');
        return;
    }

    try {
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
            document.getElementById('encryptOutput').value = data.encrypted; // Display the encrypted message
            encryptionIV = data.iv; // Store the IV for decryption
            encryptionMode = mode; // Store the encryption mode
            if (algorithm === 'OTP') {
                document.getElementById('encryptKey').value = data.key; // Display the generated key
            }
        }
    } catch (error) {
        console.error('Encryption error:', error);
        alert('Encryption failed. Please check the console for details.');
    }
});

document.getElementById('decryptButton').addEventListener('click', async () => {
    const algorithm = document.getElementById('algorithm').value;
    const text = document.getElementById('decryptInput').value.trim();
    const key = document.getElementById('decryptKey').value.trim();
    const mode = document.getElementById('decryptMode').value;

    if (!text || !key) {
        alert('Please enter a message and key.');
        return;
    }

    try {
        const response = await fetch('/decrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, key, algorithm, mode, iv: encryptionIV, encryptionMode }), // Pass the encryption mode
        });

        const data = await response.json();
        if (data.error) {
            alert(`Error: ${data.error}`);
        } else {
            document.getElementById('decryptOutput').value = data.decrypted; // Display the decrypted message
        }
    } catch (error) {
        console.error('Decryption error:', error);
        alert('Decryption failed. Please check the console for details.');
    }
});

// Copy buttons
document.getElementById('copyEncryptButton').addEventListener('click', () => {
    const encryptedMessage = document.getElementById('encryptOutput').value;
    if (encryptedMessage) {
        navigator.clipboard.writeText(encryptedMessage);
        alert('Encrypted message copied to clipboard!');
    } else {
        alert('No encrypted message to copy.');
    }
});

document.getElementById('copyDecryptButton').addEventListener('click', () => {
    const decryptedMessage = document.getElementById('decryptOutput').value;
    if (decryptedMessage) {
        navigator.clipboard.writeText(decryptedMessage);
        alert('Decrypted message copied to clipboard!');
    } else {
        alert('No decrypted message to copy.');
    }
});