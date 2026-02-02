import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import StudentAssignments from "../components/student/StudentAssignments";
import MyScores from "../components/student/MyScores";

const StudentClassPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classItem, setClassItem] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClass = async () => {
      try {
        const res = await api.get("/students/my-classes");
        const found = (res.data.classes || []).find(
          (c) => String(c.id) === String(classId)
        );
        setClassItem(found || null);
      } catch (error) {
        setClassItem(null);
      } finally {
        setLoading(false);
      }
    };

    loadClass();
  }, [classId]);

  if (loading) return <div>Loading class...</div>;

  if (!classItem) {
    return (
      <div style={styles.container}>
        <button style={styles.back} onClick={() => navigate("/dashboard")}>
          Back to My Classes
        </button>
        <div style={styles.empty}>Class not found or not approved.</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button style={styles.back} onClick={() => navigate("/dashboard")}>
        Back to My Classes
      </button>

      <div style={styles.detailCard}>
        <div style={styles.detailHeader}>
          <div>
            <h2 style={{ margin: 0 }}>{classItem.name}</h2>
            <div style={styles.muted}>Class ID: {classItem.class_id}</div>
          </div>
          <div style={styles.badge}>{classItem.status.toUpperCase()}</div>
        </div>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(activeTab === "info" ? styles.activeTab : {}) }}
            onClick={() => setActiveTab("info")}
          >
            Info
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === "assignments" ? styles.activeTab : {}) }}
            onClick={() => setActiveTab("assignments")}
          >
            Assignments
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === "scores" ? styles.activeTab : {}) }}
            onClick={() => setActiveTab("scores")}
          >
            My Scores
          </button>
        </div>

        {activeTab === "info" && (
          <div>
            <div style={styles.section}>
              <h4>Class Information</h4>
              <p>{classItem.description || "No description"}</p>
              <p style={styles.muted}>Teacher: {classItem.teacher_email}</p>
            </div>
            <div style={styles.section}>
              <h4>Lecture Files</h4>
              <div style={styles.emptyFiles}>No lecture files uploaded yet.</div>
            </div>
          </div>
        )}

        {activeTab === "assignments" && (
          <StudentAssignments classId={classItem.id} className={classItem.name} />
        )}

        {activeTab === "scores" && (
          <MyScores classId={classItem.id} className={classItem.name} />
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: "1200px", margin: "2rem auto", padding: "0 2rem" },
  back: {
    marginBottom: "1rem",
    padding: "0.5rem 0.75rem",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  detailCard: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "1.5rem",
    backgroundColor: "#ffffff",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  badge: {
    backgroundColor: "#e7f1ff",
    color: "#0d6efd",
    padding: "0.25rem 0.5rem",
    borderRadius: "999px",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  tabs: {
    display: "flex",
    gap: "0.5rem",
    borderBottom: "2px solid #eee",
    marginBottom: "1rem",
  },
  tab: {
    padding: "0.5rem 0.75rem",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    color: "#666",
  },
  activeTab: {
    color: "#0d6efd",
    borderBottomColor: "#0d6efd",
    fontWeight: 600,
  },
  section: { marginBottom: "1rem" },
  muted: { color: "#666" },
  emptyFiles: {
    padding: "0.75rem",
    border: "1px dashed #ccc",
    borderRadius: "6px",
    color: "#555",
    backgroundColor: "#f8f9fa",
  },
  empty: {
    padding: "1rem",
    border: "1px dashed #ccc",
    borderRadius: "6px",
    color: "#555",
    backgroundColor: "#f8f9fa",
  },
};

export default StudentClassPage;
