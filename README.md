# MSUKASHA B2B Seller Portal

## Setup Instructions

```bash
npm install
node server.js
```

Server runs on: http://localhost:8000

## Folder Structure
```
sellermsukasha/
├── server.js          ← Main entry point
├── .env               ← Environment variables (PORT, MONGO_URI)
├── package.json
├── config/
│   └── db.js          ← MongoDB connection
├── routes/
│   ├── auth.js        ← /api/auth routes
│   └── vendor.js      ← /api/vendor routes
├── controllers/
│   ├── authController.js
│   └── vendorController.js
├── models/
│   ├── Seller.js
│   └── Product.js
├── pages/             ← All HTML pages
├── public/
│   ├── js/main.js     ← Frontend JS
│   ├── style.css      ← Stylesheet
│   └── uploads/       ← Uploaded files
└── landing.html       ← Homepage
```
