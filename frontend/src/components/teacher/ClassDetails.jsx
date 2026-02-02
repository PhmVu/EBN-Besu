import { useEffect, useState } from "react";
import api from "../../services/api";

const ClassDetails = ({ classItem, onClose, onRefresh }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (classItem?.id) {
      fetchStats();
    }
  }, [classItem?.id]);

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/classes/${classItem.id}/statistics`);
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  if (!classItem) return null;

  return (
    <div style={styles.card}>
      <h2>Class Overview</h2>
      <div><strong>Name:</strong> {classItem.name}</div>
      <div><strong>Class ID:</strong> {classItem.class_id}</div>
      <div style={{ color: "#2563eb", fontWeight: "bold", margin: "0.5rem 0" }}>
        <strong>DB ID (for students to join):</strong> {classItem.id}
      </div>
      <div><strong>Status:</strong> {classItem.status}</div>
      {classItem.class_manager_address && (
        <div><strong>ClassManager:</strong> {classItem.class_manager_address}</div>
      )}
      {classItem.score_manager_address && (
        <div><strong>ScoreManager:</strong> {classItem.score_manager_address}</div>
      )}

      <div style={styles.actions}>
        {classItem.status === "open" && (
          <button onClick={onClose} style={styles.danger}>Close Class</button>
        )}
        <button onClick={onRefresh} style={styles.button}>Refresh</button>
      </div>

      {loading && <div>Loading statistics...</div>}
      {error && <div style={styles.error}>{error}</div>}

      {stats && (
        <div style={styles.stats}>
          <div><strong>Students:</strong> {stats.totals.students}</div>
          <div><strong>Assignments:</strong> {stats.totals.assignments}</div>
          <div><strong>Submissions:</strong> {stats.submissions.total}</div>
          <div><strong>Graded:</strong> {stats.submissions.graded}</div>
          <div><strong>Avg Score:</strong> {stats.scores.average ?? "N/A"}</div>
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  actions: {
    marginTop: "1rem",
    display: "flex",
    gap: "0.5rem",
  },
  button: {
    padding: "0.5rem 0.75rem",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  danger: {
    padding: "0.5rem 0.75rem",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  stats: {
    marginTop: "1rem",
    padding: "1rem",
    backgroundColor: "#fafafa",
    borderRadius: "6px",
    border: "1px solid #eee",
    display: "grid",
    gap: "0.5rem",
  },
  error: {
    color: "red",
    marginTop: "0.5rem",
  },
};

export default ClassDetails;
