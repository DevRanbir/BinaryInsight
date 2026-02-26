<!-- PROJECT IMAGE / BANNER -->
<p align="center">
  <img width="1854" height="1082" alt="image" src="https://github.com/user-attachments/assets/ae28727b-95db-45a9-833e-53a87c8673cd" />

</p>

# 🚀 BinaryInsight

> An AI-powered Pull Request & Code Review Management System to streamline PR workflows, automate reviewer assignment, assess risk, and determine deployment readiness.

---

## 📖 Description

BinaryInsight is a full-stack web application designed to optimize and automate the Pull Request (PR) lifecycle for development teams. It integrates with GitHub to fetch pull requests, performs AI-based risk analysis, assigns reviewers intelligently, tracks approvals, and calculates a deployment readiness score.

What makes it unique:
- AI-driven risk score generation for every pull request
- Smart reviewer auto-assignment based on workload and expertise
- Real-time deployment readiness scoring
- Complete PR lifecycle audit trail
- Enterprise-grade role-based access control

---

## ✨ Features

- **GitHub PR Integration** – Fetch and track pull requests directly via the GitHub API
- **AI-Based Risk Analyzer** – Calculates a risk score (0–10) with AI-generated summaries and security warnings
- **Smart Reviewer Assignment** – Auto-assigns reviewers based on workload, expertise tags, and module matching
- **Approval Workflow** – Configurable approval counts with approve/reject comments and visual progress tracking
- **Deployment Readiness Score** – Combines risk score, approval count, and review status into an actionable readiness percentage
- **Smart Notifications** – In-app and email alerts with escalation for overdue reviews
- **Audit Logs** – Complete PR lifecycle tracking with exportable, user-filtered logs
- **Analytics Dashboard** – Review time averages, high-risk PR trends, and reviewer performance metrics
- **Role-Based Access Control** – Developer, Reviewer, Admin, and Release Manager roles

---

## 🧠 Tech Stack

**Frontend**
- Next.js 16 / React 19
- TypeScript
- Tailwind CSS
- Radix UI
- Lucide React

**Backend**
- Node.js + Express
- Mongoose (MongoDB)

**AI / ML**
- OpenAI / Groq API (AI risk analysis)

**Authentication**
- NextAuth
- JSON Web Tokens (JWT)

**APIs & Integrations**
- GitHub REST API

**UI Components**
- shadcn/ui
- react-resizable-panels
- lottie-web / three.js

---

## 🏗️ Architecture / Workflow

```text
Developer → GitHub OAuth Login → Dashboard
    ↓
GitHub API → Fetch Pull Requests → Store PR Metadata
    ↓
AI Risk Analysis Engine → Risk Score + Security Warnings
    ↓
Smart Reviewer Assignment → Approval Workflow
    ↓
Deployment Readiness Score → Audit Logs + Analytics
```

---

## ⚙️ Installation & Setup

```bash
# Clone the repository
git clone https://github.com/DevRanbir/BinaryInsight.git

# Navigate to the project
cd BinaryInsight

# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file in the `server/` directory and add:

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
```

Create a `.env.local` file in the `client/` directory and add:

```env
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 🧪 Usage

* Step 1: Start the backend server — `cd server && npm run dev`
* Step 2: Start the frontend — `cd client && npm run dev`
* Step 3: Open `http://localhost:3000` and log in with GitHub OAuth
* Step 4: Navigate to the Dashboard to view and manage pull requests
* Step 5: Review AI-generated risk scores, assign reviewers, and approve/reject PRs
* Step 6: Monitor deployment readiness and export audit logs from the analytics panel

---

## 🎥 Demo

* **Live Demo:** Coming soon

---

## 📂 Project Structure

```text
BinaryInsight/
├── client/                    # Next.js frontend application
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   │   ├── analytics/     # Analytics dashboard
│   │   │   ├── api/           # API route handlers
│   │   │   ├── create-pr/     # Create PR page
│   │   │   ├── dashboard/     # Role-based dashboard
│   │   │   ├── deployments/   # Deployment readiness panel
│   │   │   ├── login/         # Authentication page
│   │   │   ├── pr/            # PR details & review page
│   │   │   └── settings/      # Admin configuration
│   │   ├── components/        # Reusable UI components
│   │   ├── lib/               # Utility functions
│   │   └── types/             # TypeScript type definitions
│   ├── public/                # Static assets
│   └── package.json
├── server/                    # Node.js + Express backend
│   ├── src/
│   │   ├── app.js             # Express app setup
│   │   └── index.js           # Server entry point
│   └── package.json
├── data.md                    # Project specification
├── package.json
└── README.md
```

---

## 🚧 Future Improvements

- [ ] Real-time webhook integration with GitHub
- [ ] Code coverage integration
- [ ] Slack / Microsoft Teams notification integration
- [ ] ML-based predictive bottleneck detection
- [ ] Multi-repository support
- [ ] CI/CD pipeline status display
- [ ] Mobile-responsive design enhancements

---

## 👥 Team / Author

* **Name:** DevRanbir
* **GitHub:** <a href="https://github.com/DevRanbir">https://github.com/DevRanbir</a>
* **Portfolio:** <a href="https://devranbir.github.io/">https://devranbir.github.io/</a>

---

## 📜 License

This project is licensed under the MIT License.
