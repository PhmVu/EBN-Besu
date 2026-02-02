import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import ClassList from "../components/teacher/ClassList";
import CreateClass from "../components/teacher/CreateClass";
import ClassDetails from "../components/teacher/ClassDetails";
import ApprovalsPanel from "../components/teacher/ApprovalsPanel";
import AssignmentManager from "../components/teacher/AssignmentManager";

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get("/classes");
      const nextClasses = response.data || [];
      setClasses(nextClasses);
      if (selectedClass) {
        const refreshed = nextClasses.find((c) => c.id === selectedClass.id);
        if (refreshed) {
          setSelectedClass(refreshed);
        }
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassCreated = () => {
    setShowCreateForm(false);
    fetchClasses();
  };

  const closeSelectedClass = async () => {
    if (!selectedClass) return;
    if (!window.confirm("Are you sure you want to close this class?")) return;
    try {
      await api.post(`/classes/${selectedClass.id}/close`);
      await fetchClasses();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to close class");
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Teacher Dashboard</h1>
        <div style={styles.userInfo}>
          <span>Welcome, {user?.fullName || user?.email}</span>
          <button onClick={logout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.actions}>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={styles.createButton}
          >
            {showCreateForm ? "Cancel" : "Create New Class"}
          </button>
        </div>

        {showCreateForm && (
          <CreateClass onClassCreated={handleClassCreated} />
        )}

        {loading ? (
          <div>Loading classes...</div>
        ) : (
          <div style={styles.grid}>
            <div>
              <ClassList
                classes={classes}
                onRefresh={fetchClasses}
                onSelect={(cls) => {
                  setSelectedClass(cls);
                  setActiveTab("overview");
                }}
                selectedClassId={selectedClass?.id}
              />
            </div>
            <div>
              {!selectedClass ? (
                <div style={styles.empty}>Select a class to manage.</div>
              ) : (
                <>
                  <div style={styles.tabs}>
                    <button
                      onClick={() => setActiveTab("overview")}
                      style={{
                        ...styles.tab,
                        ...(activeTab === "overview" ? styles.activeTab : {}),
                      }}
                    >
                      Overview
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
                    <button
                      onClick={() => setActiveTab("assignments")}
                      style={{
                        ...styles.tab,
                        ...(activeTab === "assignments" ? styles.activeTab : {}),
                      }}
                    >
                      Assignments
                    </button>
                  </div>

                  {activeTab === "overview" && (
                    <ClassDetails
                      classItem={selectedClass}
                      onClose={closeSelectedClass}
                      onRefresh={fetchClasses}
                    />
                  )}
                  {activeTab === "approvals" && (
                    <ApprovalsPanel classId={selectedClass.id} />
                  )}
                  {activeTab === "assignments" && (
                    <AssignmentManager classId={selectedClass.id} />
                  )}
                </>
              )}
            </div>
          </div>
        )}
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
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.5fr",
    gap: "1.5rem",
  },
  actions: {
    marginBottom: "2rem",
  },
  createButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  tabs: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1rem",
    borderBottom: "2px solid #eee",
  },
  tab: {
    padding: "0.5rem 1rem",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    color: "#666",
  },
  activeTab: {
    color: "#007bff",
    borderBottomColor: "#007bff",
  },
  empty: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
};

export default TeacherDashboard;
