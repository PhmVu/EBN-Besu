import { useEffect, useState } from "react";
import api from "../../services/api";

const SubmissionList = ({ assignmentId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (assignmentId) {
      fetchSubmissions();
    }
  }, [assignmentId]);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/assignments/${assignmentId}/submissions`);
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const recordScore = async (studentId) => {
    const score = Number(scores[studentId]);
    if (Number.isNaN(score)) return;
    try {
      await api.post(`/assignments/${assignmentId}/submissions/${studentId}/score`, { score });
      alert("Score recorded");
      fetchSubmissions();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to record score");
    }
  };

  if (!assignmentId) return <div>Select an assignment to view submissions.</div>;

  return (
    <div style={styles.card}>
      <h3>Submissions</h3>
      {loading && <div>Loading submissions...</div>}
      {error && <div style={styles.error}>{error}</div>}
      {submissions.length === 0 && !loading && <div>No submissions yet.</div>}
      <div style={styles.list}>
        {submissions.map((s) => (
          <div key={s.id} style={styles.item}>
            <div><strong>{s.email}</strong></div>
            <div>Student ID: {s.student_id}</div>
            <div>Submitted: {new Date(s.submitted_at).toLocaleString()}</div>
            <div>Hash: {s.assignment_hash}</div>
            <div style={styles.row}>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Score"
                value={scores[s.student_id] || ""}
                onChange={(e) => setScores({ ...scores, [s.student_id]: e.target.value })}
                style={styles.input}
              />
              <button onClick={() => recordScore(s.student_id)} style={styles.primary}>
                Grade
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: "white",
    padding: "1rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  list: { display: "grid", gap: "0.75rem" },
  item: {
    border: "1px solid #ddd",
    borderRadius: "6px",
    padding: "0.75rem",
    backgroundColor: "#fafafa",
  },
  row: { display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.5rem" },
  input: {
    padding: "0.4rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    width: "100px",
  },
  primary: {
    padding: "0.4rem 0.75rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  error: {
    color: "red",
    padding: "0.5rem",
    backgroundColor: "#ffe6e6",
    borderRadius: "4px",
  },
};

export default SubmissionList;
