# 🔐 Password Strength & Breach Checker

## 📌 Overview
The **Password Strength & Breach Checker** is a full-stack web application that helps users:
- Evaluate the strength of their passwords in real-time.
- Check if a password has been breached using the **HaveIBeenPwned API**.
- Save passwords (securely hashed) against different apps/websites in **MongoDB**.
- Receive **real-time breach alerts** via **Socket.io**.

This project was developed as part of SIT725, focusing on secure design, testing, and best practices for HD-level quality.

---

## 🚀 Features
- **Password Strength Meter**: Detects weak, medium, strong, and very strong passwords.
- **Breach Checker**: Uses k-anonymity with SHA1 hashing against HaveIBeenPwned.
- **Password Storage**: Save hashed passwords with associated app/website name in MongoDB.
- **Real-Time Notifications**: Socket.io alerts if a saved password is found breached.
- **Password Generator**: Suggests a random strong password.
- **Testing**: Mocha + Chai + Supertest integration.

---

## 🛠 Tech Stack
- **Frontend**: HTML, CSS, Vanilla JS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Local / Atlas)
- **Real-time**: Socket.io
- **Testing**: Mocha, Chai, Supertest, Sinon
- **Version Control**: Git + GitHub
- **Project Management**: Trello

---

## 📂 Project Structure
password-checker/
│── app.js # Main entry point
│── .env # Environment variables (not committed)
│── config/ # Database configuration
│── controllers/ # Controllers (strength, breach)
│── models/ # Mongoose models (Password schema)
│── routes/ # API routes
│── public/ # Static frontend files (JS, CSS)
│ ├── js/main.js
│ └── css/styles.css
│── views/ # HTML frontend (index.html)
│── tests/ # Unit & integration tests
│── README.md # Documentation


1. Install dependencies
npm install

2. Setup environment variables

Create a .env file:

PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/passwordCheckerDB

3. Run the application
# Development (auto-restart with nodemon)
npm run dev

# Production
npm start

4. Open in browser
http://localhost:3000

5. Running Tests

We use Mocha + Chai + Supertest + Sinon for testing.

Run all tests:

npm test


Run a specific test:

npx mocha tests/unitTests/strengthController.test.js --exit

6. Architecture and use case diagrams:

link- https://excalidraw.com/#json=K9actp4xYhnBcFzWj5b-6,kzARM2Mc02vVYHN-mhEykw

## 🖼️ Screenshots
| Password Strength Meter | Breach Check Result |
(https://docs.google.com/document/d/1HPT9gStHryZ1CFglNiIqZw11lUZygbIuZXI9uonFicQ/edit?usp=sharing)

# SecurePasswordManager - Backend

This is the **backend service** for SecurePasswordManager, built with **Node.js, Express, and MongoDB**.  
It provides APIs for:
- User authentication (signup/login)
- Secure password storage with AES encryption
- Password retrieval and deletion (scoped per user session)

---

## 🚀 Features
- **Authentication**
  - Signup with email + password (hashed using bcrypt)
  - Login with session-based authentication
  - Sessions persisted with `express-session` (ready for `connect-mongo` in production)

- **Password Management**
  - Save a password (AES-256 encrypted before storing in MongoDB)
  - Retrieve all passwords (decrypted before returning)
  - Delete a saved password by ID

- **Security**
  - AES-256-GCM encryption for passwords
  - Passwords never stored in plaintext
  - User login credentials hashed with bcrypt
  - Session-based authentication (no passwords in client storage)

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Express
- **Database:** MongoDB (local or Atlas)
- **Auth:** express-session, bcryptjs
- **Encryption:** crypto (AES-256-GCM)

---

## 📦 Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/<your-username>/SecurePasswordManager.git
   cd SecurePasswordManager
Install dependencies:

bash
Copy code
npm install
Create a .env file:

env
Copy code
MONGO_URI=mongodb+srv://s225615024_db_user:SecurePasswordManager@cluster0.dvzafac.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
SESSION_SECRET=your_session_secret_here
Run the server:

bash
Copy code
npm start
Server runs on http://localhost:3000

🔑 API Endpoints
Auth
Method	Endpoint	Body	Description
POST	/api/signup	{ fullName, email, password }	Create a new account
POST	/api/login	{ email, password }	Log in a user (session created)
GET	/api/logout	–	Log out current session

Passwords
Method	Endpoint	Body	Description
POST	/api/save-password	{ appName, username, password }	Save a new password (AES encrypted)
GET	/api/passwords	–	Retrieve all saved passwords (decrypted)
DELETE	/api/passwords/:id	–	Delete a password by ID

🔒 Security Notes
Passwords are AES-256-GCM encrypted before saving to MongoDB.

User login passwords are hashed with bcrypt.

Sessions are secured with SESSION_SECRET. In production, use connect-mongo to persist sessions.

Never commit .env to GitHub.

🧪 Testing with Postman
Signup → POST /api/signup

Login → POST /api/login (stores session cookie)

Save Password → POST /api/save-password

Get Passwords → GET /api/passwords

Delete Password → DELETE /api/passwords/:id




## 📚 References
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [MongoDB Docs](https://www.mongodb.com/docs/)

## Test Coverage
See the [Test Coverage & Results Report](docs/test-report.md) for details, or open the Playwright HTML report in `playwright-report/index.html`.

