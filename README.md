# LawGenie Backend

LawGenie backend powers document upload, summarization, translation, and legal document analysis. It is built using **Node.js + Express**, with **Multer** for file handling and **Ngrok** for secure public tunneling.

---

## 🚀 Features

* Upload PDF/DOCX documents
* Summarize legal documents
* Extract key terms & issues
* Compare contracts
* Translate documents
* RESTful API endpoints

---

## 📦 Prerequisites

* [Node.js](https://nodejs.org/) v18+
* [Firebase CLI](https://firebase.google.com/docs/cli) (if deploying via Firebase)
* [Ngrok](https://ngrok.com/) for tunneling

---

## 🔧 Installation

Clone the repository:

```bash
git clone https://github.com/your-username/lawgenie-backend.git
cd lawgenie-backend
```

Install dependencies:

```bash
npm install
```

---

## ▶️ Running the Backend

Start the backend server locally:

```bash
npm run dev
```

By default, the backend will run at:

```
http://localhost:5000
```

---

## 🌐 Exposing Backend via Ngrok

Since the frontend is hosted remotely (e.g., Firebase/Netlify), we need a **public URL** for backend API calls.

1. Start your backend:

   ```bash
   npm run dev
   ```

2. In a new terminal, run ngrok:

   ```bash
   ngrok http 5000
   ```

3. Ngrok will provide a public URL like:

   ```
   https://pollenlike-tenorless-clemmie.ngrok-free.app
   ```

4. Update your frontend `config.js` to use this URL:

   ```js
   const BASE_URL = "https://pollenlike-tenorless-clemmie.ngrok-free.app/api";

   const ENDPOINTS = {
     upload: `${BASE_URL}/upload`,
     summarize: `${BASE_URL}/summarize`,
     ask: `${BASE_URL}/ask`,
     keyterms: `${BASE_URL}/keyterms`,
     issues: `${BASE_URL}/issues`,
     compare: `${BASE_URL}/compare`,
     clauses: `${BASE_URL}/clauses`,
     comprehensive: `${BASE_URL}/comprehensive`,
     translate: `${BASE_URL}/translate/document`,
   };

   export default ENDPOINTS;
   ```

5. Restart the frontend — API requests will now be proxied to your backend via ngrok.

---

## 📁 Project Structure

```
functions/
│── index.js              # Firebase functions entry
│── routes/
│   ├── upload.js         # File upload route
│   ├── translate.js      # Translation routes
│   └── ...               # Other routes
│── services/
│   └── translateService.js
│── utils/
│   ├── fileProcessing.js
│   └── responseHelper.js
uploads/                  # Uploaded files
```

---

## 📌 Example API Call

**Upload a file**

```http
POST /api/upload
Content-Type: multipart/form-data
```

Response:

```json
{
  "success": true,
  "message": "File uploaded successfully ✅",
  "data": {
    "file_id": "f11e52e70f-pathak.pdf",
    "originalname": "pathak.pdf",
    "mimetype": "application/pdf",
    "size": 832227,
    "path": "/uploads/f11e52e70f-pathak.pdf"
  }
}
```

---

## ⚠️ Notes

* Ngrok free plan changes the URL each time you restart it.
  👉 Use **ngrok reserved domains** if you want a permanent URL.
* Make sure your backend port (`5000`) matches the one you expose with ngrok.
* Always update your frontend `config.js` after restarting ngrok (unless you have a reserved domain).

---
## 🔮 Future Enhancements

* Voice-controlled commands for document interactions.
* Real-time translation with speech-to-text integration.
* AI-powered contract drafting assistance.
* Multi-user collaboration and annotation.
* Enhanced dashboard for document management.

---

## 📜 License

MIT License © 2025 LawGenie
