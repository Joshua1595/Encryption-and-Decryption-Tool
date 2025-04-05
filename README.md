# **Encryption and Decryption With RSA Web Application**



## **Introduction**

This project is a web-based encryption and decryption tool built with **Node.js** and **Express** for the backend, and **HTML**, **CSS**, and **JavaScript** for the frontend. It supports multiple cryptographic algorithms (**AES**, **3DES**, **OTP** and **RSA**) and encryption modes (**ECB**, **CBC**, **CTR**, **CFB**). The application provides a user-friendly interface for encrypting and decrypting text securely.

> **Note**: This project is for educational purposes and is not intended for production use.

---

## **Features**

- **Supported Algorithms**:
  - AES (Advanced Encryption Standard)
  - 3DES (Triple Data Encryption Standard)
  - OTP (One-Time Pad)
  - RSA(Rivest–Shamir–Adleman)
- **Encryption Modes**:
  - ECB (Electronic Codebook)
  - CBC (Cipher Block Chaining)
  - CTR (Counter)
  - CFB (Cipher Feedback)
- **User Interface**:
  - Input fields for plaintext/ciphertext and keys.
  - Dropdowns for selecting algorithms and modes.
  - Buttons for encryption, decryption, and copying results.
- **Error Handling**:
  - Handles invalid inputs, unsupported algorithms, and mismatched modes.
- **Secure Key Management**:
  - Ensures proper key lengths and generates random keys for OTP.
- **Initialization Vectors (IVs)**:
  - Automatically generated for modes like CBC, CTR, and CFB.

---

## **Technologies Used**

- **Backend**:
  - Node.js
  - Express.js
  - Crypto (Node.js built-in module)
- **Frontend**:
  - HTML
  - CSS
  - JavaScript (Fetch API for backend communication)
- **Development Tools**:
  - Visual Studio Code
  - Git (for version control)

---

## **Setup Instructions**

### **Prerequisites**
- Node.js and npm installed on your machine.
- A modern web browser (e.g., Chrome, Firefox, Edge).

### **Steps to Run the Application**
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/encryption-tool.git
   cd encryption-tool
## Run locally

### Install

``` bash
node install
```

### Run

``` bash
npm start
```

### Tests

``` bash
npm test
```

### Tests coverage

``` bash
npm run test:coverage
```

### Functional tests

``` bash
npm run test:functional
```

### Run all the tests

``` bash
npm run test:all
```

## Docker

### Docker Compose

> Be sure that you are not running MongoDB + another node.js app that uses the `3000` port

```bash
docker-compose up
```

---

### **Steps to Use in VS Code**
1. Open your project in VS Code.
2. Create a new file in the root directory and name it `README.md`.
3. Copy the above content and paste it into the `README.md` file.
4. Save the file.

This `README.md` is ready to use and includes all the necessary details for your project. Let me know if you need further assistance!
