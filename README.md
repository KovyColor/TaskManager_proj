# 🚀 Task Manager – Full-Stack Production Application

A production-ready full-stack Task Management system built with **Node.js, Express, MongoDB, and Vanilla JavaScript**.  
The application includes authentication, role-based access control (RBAC), task management, employee management, reports, and is deployed live on the web.

---

## 🌍 Live Demo

🔗 **Live Application:** https://taskmanager-proj.onrender.com

---

## 📌 Project Overview

This project is the final culmination of backend and frontend integration.  
It transforms a modular authenticated API into a fully deployed full-stack application.

The system supports:

- 🔐 JWT Authentication
- 👥 Role-Based Access Control (Admin/User)
- 📋 Task Management
- 🏢 Employee Management
- 📝 Reports System
- 📊 Filtering, Search & Pagination
- 🕓 Recently Viewed Tasks
- 🌐 Live Cloud Deployment (Render + MongoDB Atlas)

---

## 🛠 Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT (jsonwebtoken)
- bcrypt
- dotenv

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript (SPA-style UI)

### Deployment
- Render (Backend + Frontend)
- MongoDB Atlas (Database Hosting)

---

## 🏗 Architecture

The project follows a clean **MVC architecture**:

```
controllers/   → Business logic
models/        → Mongoose schemas
routes/        → API endpoints
middleware/    → Auth & RBAC
public/        → Frontend (HTML/CSS/JS)
server.js      → Entry point
```

---

## 🔐 Authentication & Authorization

### Authentication
- JWT-based authentication
- Token stored in `localStorage`
- Sent via `Authorization: Bearer <token>`

### Authorization (RBAC)
- **Admin**
  - Can see all tasks
  - Can delete any task
  - Can access Employees page
  - Can view all reports
- **User**
  - Can see only assigned/created tasks
  - Can create reports
  - Cannot access admin features

---

## 📋 Features

### ✅ Task Management
- Create, update, delete tasks
- Status control:
  - pending
  - in_progress
  - completed
- Search by title
- Filter by status
- Pagination
- Recently Viewed tasks (stored in DB)

### 👥 Employee Management (Admin Only)
- View all users
- Filter tasks by selected employee

### 📝 Reports System
- Users create reports
- Admin sees all reports
- Users see only their own
- Category filtering

### 🎨 UI Features
- SPA-style navigation
- Modal task details
- Responsive layout
- Active sidebar highlighting
- Smooth transitions

---

## 🔗 API Endpoints

### 🔐 Auth
```
POST /api/auth/register
POST /api/auth/login
```

### 📋 Tasks
```
GET    /api/tasks
POST   /api/tasks
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
GET    /api/tasks/:id
```

### 👥 Users
```
GET /api/users   (admin only)
```

### 📝 Reports
```
GET    /api/reports
POST   /api/reports
DELETE /api/reports/:id (admin only)
```

---

## ⚙️ Environment Variables

Create a `.env` file locally:

```
MONGO_URI=mongodb://127.0.0.1:27017/taskmanager
JWT_SECRET=your_secret_key
```

On Render, set:

```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
NODE_ENV=production
```

---

## 💻 Running Locally

1. Clone repository:
```
git clone https://github.com/your-username/task-manager.git
cd task-manager
```

2. Install dependencies:
```
npm install
```

3. Create `.env` file (see above)

4. Run server:
```
npm start
```

5. Open:
```
http://localhost:3000/login.html
```

---

## ☁️ Deployment

The application is deployed on **Render**.

Steps:
1. Push to GitHub
2. Connect repository to Render
3. Set environment variables
4. Deploy
5. Connect MongoDB Atlas

---

## 🧪 Postman Collection

A complete Postman collection is included with:

- Auth tests
- Task CRUD tests
- User tests
- Report tests

---

## 🔒 Security Considerations

- JWT_SECRET stored securely in environment variables
- MongoDB URI not exposed in repository
- Role-based access control enforced on backend
- Passwords hashed using bcrypt

---

## 🎓 Final Defense Preparation

Key concepts implemented:

- Full-Stack Integration
- MVC Architecture
- JWT Authentication
- RBAC Authorization
- Relational Data in MongoDB
- Production Deployment
- Environment Configuration

---

## 📊 Grading Criteria Coverage

| Requirement | Status |
|-------------|--------|
| Full Backend Logic | ✅ |
| Frontend Integration | ✅ |
| Role-Based Access | ✅ |
| Relational Integrity | ✅ |
| Deployment | ✅ |
| Clean MVC Structure | ✅ |
| Postman Collection | ✅ |
| Documentation | ✅ |

---

## 👨‍💻 Author

Final Project – Web Technologies  
Full-Stack Task Management System

---

