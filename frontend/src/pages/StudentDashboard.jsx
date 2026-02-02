import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import WalletInfo from "../components/student/WalletInfo";
import MyClasses from "../components/student/MyClasses";
import ApprovalPanel from "../components/student/ApprovalPanel";

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("wallet");

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Student Dashboard</h1>
        <div style={styles.userInfo}>
          <span>Welcome, {user?.fullName || user?.email}</span>
          <button onClick={logout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab("wallet")}
            style={{
              ...styles.tab,
              ...(activeTab === "wallet" ? styles.activeTab : {}),
            }}
          >
            My Wallet
          </button>
          <button
            onClick={() => setActiveTab("classes")}
            style={{
              ...styles.tab,
              ...(activeTab === "classes" ? styles.activeTab : {}),
            }}
          >
            My Classes
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            style={{
              ...styles.tab,
              ...(activeTab === "approvals" ? styles.activeTab : {}),
            }}
          >
            Approvals
          </button>
          
        </div>

        <div style={styles.content}>
          {activeTab === "wallet" && <WalletInfo />}
          {activeTab === "classes" && <MyClasses />}
          {activeTab === "approvals" && <ApprovalPanel />}
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    padding: "1rem 2rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  logoutButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  main: {
    maxWidth: "1200px",
    margin: "2rem auto",
    padding: "0 2rem",
  },
  tabs: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "2rem",
    borderBottom: "2px solid #ddd",
  },
  tab: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    fontSize: "1rem",
    color: "#666",
  },
  activeTab: {
    color: "#007bff",
    borderBottomColor: "#007bff",
  },
  content: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
};

export default StudentDashboard;
