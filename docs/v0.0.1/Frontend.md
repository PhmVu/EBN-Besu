# PHASE 4: FRONTEND

**Ngày bắt đầu:** TBD  
**Trạng thái:** ⏳ PENDING  
**Timeline:** 3-5 days

---

## 📊 TỔNG QUAN

Xây dựng Frontend (React/Vite) cho hệ thống quản lý lớp học.

---

## 🏗️ KIẾN TRÚC FRONTEND

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| HTTP Client | Axios |
| State Management | Context API |
| Styling | TailwindCSS |
| Wallet | Ethers.js + MetaMask |
| UI Components | Headless UI / Radix UI |

### Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── RegisterStudentForm.jsx
│   │   ├── Dashboard/
│   │   │   ├── TeacherDashboard.jsx
│   │   │   └── StudentDashboard.jsx
│   │   ├── Classes/
│   │   │   ├── ClassList.jsx
│   │   │   ├── ClassDetail.jsx
│   │   │   └── CreateClassForm.jsx
│   │   ├── Students/
│   │   │   ├── StudentList.jsx
│   │   │   └── AddStudentsForm.jsx
│   │   ├── Approvals/  ← NEW Phase 3.2
│   │   │   ├── PendingApprovalsPanel.jsx
│   │   │   ├── ApprovalCard.jsx
│   │   │   ├── ApprovalForm.jsx
│   │   │   └── StudentApprovalStatus.jsx
│   │   ├── Assignments/
│   │   │   ├── AssignmentList.jsx
│   │   │   ├── AssignmentDetail.jsx
│   │   │   └── CreateAssignmentForm.jsx
│   │   ├── Submissions/
│   │   │   ├── SubmissionForm.jsx
│   │   │   ├── SubmissionList.jsx
│   │   │   └── GradeForm.jsx
│   │   └── Common/
│   │       ├── Header.jsx
│   │       ├── Sidebar.jsx
│   │       ├── LoadingSpinner.jsx
│   │       └── ErrorAlert.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── AppContext.jsx
│   ├── services/
│   │   ├── api.js           → Axios instance + base config
│   │   ├── authService.js   → Auth API calls
│   │   ├── classService.js  → Class API calls
│   │   ├── studentService.js → Student API calls
│   │   ├── assignmentService.js → Assignment API calls
│   │   ├── submissionService.js → Submission API calls
│   │   └── approvalService.js → Approval API calls (Phase 3.2)
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ClassesPage.jsx
│   │   ├── AssignmentsPage.jsx
│   │   ├── SubmissionsPage.jsx
│   │   └── ProfilePage.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useApi.js
│   │   └── useLocalStorage.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
│   └── index.html
├── vite.config.js
├── package.json
└── .env.example
```

---

## 🎯 USER INTERFACES

### 1. Authentication Pages

**LoginPage**
- Email + password input
- "Login" button
- "Sign up as teacher" link
- "Register as student" link
- Error/success messages
- Redirect to dashboard on login

**RegisterPage (Teacher)**
- Email, password, fullName inputs
- "Register" button
- "Already have account?" link
- Auto-generate wallet info
- Show private key (one-time) with warning
- Save warning: "Store this key securely"

**RegisterStudentPage**
- Email, password, classCode inputs
- "Register as Student" button
- Class code validation
- Auto-join class after registration
- Wallet generation + display (show-once)

### 2. Teacher Dashboard

**Overview:**
- Quick stats (classes count, students count, pending approvals count ← NEW)
- Recent activities
- Quick action buttons

**Sidebar Navigation:**
- My Classes
- Approvals ← NEW
- Assignments
- Submissions
- Settings

**Main Content:**
- List of classes (clickable cards)
- "Create New Class" button
- Class details (click to expand):
  - Class info (name, code, status)
  - Enrolled students count
  - Pending approvals count ← NEW
  - "Manage Approvals" button ← NEW
  - "View Assignments" button
  - "Close Class" button (if OPEN)

### 3. Teacher - Approval Management ← NEW Phase 3.2

**Pending Approvals Panel:**
- Filter: All / Pending / Approved / Rejected
- List of pending students:
  - Student email
  - Requested date
  - Student wallet address
  - Action buttons: "Approve" | "Reject"

**Approve Modal:**
- Display student info
- Password input (required for security)
- "Approve" button
- Loading state while TX pending
- Success message with TX hash
- "View on Besu Explorer" link ← NEW
- Refresh list after approval

**Reject Modal:**
- Display student info
- Password input
- Rejection reason textarea (optional)
- "Reject" button
- Success message

**History:**
- Show approved/rejected students with:
  - Student email
  - Action (APPROVED/REJECTED)
  - Date
  - TX hash (clickable → Besu Explorer) ← NEW
  - Rejection reason (if rejected)

### 4. Student Dashboard

**Overview:**
- My classes list
- Approval status for each class ← NEW
- Quick assignment list

**Classes Panel:**
- List of enrolled classes (cards)
- For each class:
  - Class name + code
  - Approval status:
    - 🟡 PENDING - "Waiting for teacher approval"
    - ✅ APPROVED - "You're in this class" + TX hash ← NEW
    - ❌ REJECTED - "Rejected: {reason}"
    - ⏳ NOT_REQUESTED - "Request approval button" ← NEW

**Approval Status Details:** ← NEW
- Show approval status with timeline:
  - Requested: [date]
  - Reviewed: [date] (if approved/rejected)
  - TX Hash: [hash] with Besu Explorer link ← NEW
- If not yet requested: "Request Approval" button
- If REJECTED: Show rejection reason + "Request again" button

**Actions:**
- View class (if APPROVED)
- View assignments (if APPROVED)
- Request approval (if PENDING)

**Wallet Section:**
- "View My Wallet" button
- Shows: Address
- Shows: Private key (one-time display)
- Warning: "This is your only chance to save this key!"
- "Copy to clipboard" button
- "Save" button
- Cannot view again after closing

### 5. Classes Management

**ClassesPage:**
- List of classes (teacher) or enrolled classes (student)
- For each class (card):
  - Class name + code
  - Teacher name
  - Student count
  - Assignment count
  - Status (OPEN/CLOSED)
  - Last activity date

**CreateClassForm (Teacher):**
- Class name input
- Description textarea
- "Create Class" button
- Auto-deploys ClassManager + ScoreManager contracts
- Show loading + TX hash while deploying
- Redirect to class details on success

**ClassDetail:**
- Class info (name, code, status, contract addresses)
- Students list:
  - Student name + email
  - Wallet address
  - Enrollment date
  - Score (if any)
- Add students section (teacher):
  - Email list textarea
  - "Add Students" button
  - Creates PENDING approvals
  - Shows success: "X students added (pending approval)"

### 6. Assignments Management

**AssignmentListPage:**
- List of assignments for class
- For each assignment:
  - Title + description
  - Deadline
  - Student submission count (teacher)
  - My submission status (student)
  - Action buttons

**CreateAssignmentForm (Teacher):**
- Title, description, deadline inputs
- "Create Assignment" button
- Redirect to assignment detail

**StudentSubmissionView:**
- Assignment details
- "Submit Assignment" button (if not submitted)
- Shows submission status:
  - Not submitted: "Submit button active"
  - Submitted: "Grade: X/100" + "Submit date"
  - TX hash (clickable → Besu Explorer)

**TeacherGradeView:**
- Submissions list
- For each submission:
  - Student name
  - Submission date
  - Grade input
  - "Grade" button
  - TX hash (after grading)

---

## 🔗 API INTEGRATION

### Services Architecture

**authService.js:**
```javascript
login(email, password)
register(email, password, fullName)
registerStudent(email, password, classCode)
getProfile()
getPrivateKey(password)
logout()
```

**classService.js:**
```javascript
createClass(name, description)
listClasses()
getClassDetail(classId)
addStudentsToClass(classId, emails)
closeClass(classId)
```

**studentService.js:**
```javascript
getWalletInfo()
getMyClasses()
getMyScores()
```

**assignmentService.js:**
```javascript
createAssignment(classId, title, description, deadline)
listAssignments(classId)
getAssignment(assignmentId)
updateAssignment(assignmentId, updates)
deleteAssignment(assignmentId)
```

**submissionService.js:**
```javascript
submitAssignment(assignmentId, assignmentHash)
listSubmissions(assignmentId)
getMySubmission(assignmentId)
recordScore(submissionId, score)
```

**approvalService.js:** ← NEW Phase 3.2
```javascript
requestApproval(classId)
getPendingApprovals(classId)
getMyApprovalStatus(classId)
approveStudent(approvalId, password)
rejectStudent(approvalId, password, reason)
```

### Context Architecture

**AuthContext:**
- Current user info (id, email, role, wallet)
- JWT token
- Login/logout functions
- useAuth() hook

**AppContext:**
- Classes list
- Current selected class
- Students list
- Assignments list
- Approvals list ← NEW
- Loading states
- Error messages
- Refresh functions

---

## 🎨 UI/UX FEATURES

### Design Principles

✅ **Clean & Intuitive:** Easy navigation for teachers & students  
✅ **Role-Based Views:** Different UI for teacher vs student  
✅ **Real-time Updates:** Refresh lists after actions  
✅ **Error Handling:** Clear error messages with retry options  
✅ **Loading States:** Show spinners during API calls  
✅ **Responsive:** Mobile-friendly design  
✅ **Accessibility:** Keyboard navigation, ARIA labels  
✅ **Blockchain Links:** TX hash → Besu Explorer ← NEW  

### Approval UI Highlights ← NEW Phase 3.2

**Visual Indicators:**
- 🟡 PENDING badge
- ✅ APPROVED badge with checkmark
- ❌ REJECTED badge with reason tooltip
- ⏳ LOADING spinner during TX

**Blockchain Integration:**
- Show TX hash in human-readable format
- "View on Besu Explorer" link
- Verify contract state matches DB state
- Show block confirmation count

**Teacher Actions:**
- Inline approve/reject buttons
- Password verification modal
- TX status feedback (pending → confirmed)
- Error handling with retry

**Student Feedback:**
- Clear status messages
- TX hash for verification
- Timeline view of approval process
- Next steps guidance

---

## 🧪 TESTING

### Unit Tests

- Component rendering
- Form validation
- API service mocking
- Context updates

### Integration Tests

- Full auth flow
- Create class → deploy → add students
- Approval workflow (request → approve → verify)
- Assignment submission flow

### Manual Testing

- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile responsiveness
- TX hash verification on Besu Explorer
- Show-once wallet display
- API error handling

---

## 📋 IMPLEMENTATION CHECKLIST

**Authentication (3 days):**
- [ ] LoginForm + LoginPage
- [ ] RegisterForm + RegisterPage
- [ ] RegisterStudentForm + RegisterStudentPage
- [ ] AuthContext + useAuth hook
- [ ] JWT token storage + validation
- [ ] Protected routes + redirects

**Dashboard (1 day):**
- [ ] TeacherDashboard
- [ ] StudentDashboard
- [ ] Navigation sidebar
- [ ] Quick stats + recent activities

**Classes (1.5 days):**
- [ ] ClassList component
- [ ] ClassDetail component
- [ ] CreateClassForm
- [ ] Class contract deployment status

**Approvals (1 day):** ← NEW Phase 3.2
- [ ] ApprovalService
- [ ] PendingApprovalsPanel
- [ ] ApprovalCard component
- [ ] ApprovalForm (approve/reject)
- [ ] StudentApprovalStatus component
- [ ] Besu Explorer links

**Assignments (1.5 days):**
- [ ] AssignmentList
- [ ] CreateAssignmentForm
- [ ] AssignmentDetail
- [ ] Assignment service

**Submissions (1.5 days):**
- [ ] SubmissionForm
- [ ] SubmissionList
- [ ] GradeForm
- [ ] Submission service

**Styling & Polish (0.5 days):**
- [ ] TailwindCSS setup
- [ ] Responsive design
- [ ] Dark mode (optional)
- [ ] Loading states
- [ ] Error boundaries

**Total: ~8-10 days** (but scheduled for 3-5 days with efficient implementation)

---

## 🚀 BUILD & RUN

### Setup

```bash
# Create Vite project
npm create vite@latest blockchain-frontend -- --template react

# Install dependencies
npm install

# Create .env from .env.example
cp .env.example .env
```

### Environment Variables

```env
VITE_API_URL=http://localhost:5000
VITE_BESU_RPC_URL=http://localhost:8549
VITE_BESU_EXPLORER_URL=http://localhost:3000
```

### Development

```bash
npm run dev
# Access at http://localhost:5173
```

### Production Build

```bash
npm run build
npm run preview
```

---

## 📚 KEY DEPENDENCIES

```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.0.0",
  "axios": "^1.4.0",
  "ethers": "^6.0.0",
  "@web3-react/core": "^8.0.0",
  "tailwindcss": "^3.0.0",
  "headlessui": "^1.7.0"
}
```

---

## ⏳ STATUS

**Phase 3 Backend:** ✅ COMPLETE (23 endpoints ready)  
**Phase 4 Frontend:** ⏳ PENDING  
**Estimated Start:** After Phase 3.2 completion  
**Estimated Duration:** 3-5 days  

---

**Prepared:** 02/02/2026  
**Ready to Start:** After Phase 3.2
