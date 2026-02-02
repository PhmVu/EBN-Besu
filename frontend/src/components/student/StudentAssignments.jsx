import { useEffect, useState } from "react";
import api from "../../services/api";

const StudentAssignments = ({ classId, className }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hashes, setHashes] = useState({});
  const [submissionMap, setSubmissionMap] = useState({});
  const [scoreMap, setScoreMap] = useState({});

  useEffect(() => {
    if (classId) {
      loadAssignments();
      loadScores();
    } else {
      setAssignments([]);
      setSubmissionMap({});
      setScoreMap({});
    }
  }, [classId]);

  const loadAssignments = async () => {
    if (!classId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/classes/${classId}/assignments`);
      setAssignments(res.data.assignments || []);
      setSubmissionMap({});
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const loadScores = async () => {
    if (!classId) return;
    try {
      const res = await api.get("/students/my-scores", { params: { classId } });
      const map = {};
      (res.data.scores || []).forEach((s) => {
        if (s.assignment_id) {
          map[s.assignment_id] = s.score;
        }
      });
      setScoreMap(map);
    } catch (err) {
      setScoreMap({});
    }
  };

  const submitAssignment = async (assignmentId) => {
    const assignmentHash = hashes[assignmentId];
    if (!assignmentHash) return;
    try {
      await api.post(`/assignments/${assignmentId}/submit`, { assignmentHash });
      await checkSubmission(assignmentId);
      setHashes((prev) => ({ ...prev, [assignmentId]: "" }));
    } catch (err) {
      alert(err.response?.data?.error || "Submit failed");
    }
  };

  const checkSubmission = async (assignmentId) => {
    try {
      const res = await api.get(`/assignments/${assignmentId}/my-submission`);
      setSubmissionMap((prev) => ({ ...prev, [assignmentId]: res.data }));
    } catch (err) {
      setSubmissionMap((prev) => ({ ...prev, [assignmentId]: null }));
    }
  };

  return (
    <div>
      <h2>Assignments</h2>
      {!classId && (
        <div style={styles.notice}>
          Please select an approved class in "My Classes" to view assignments.
        </div>
      )}
      {classId && (
        <div style={styles.row}>
          <div style={styles.classLabel}>
            Class: <strong>{className || classId}</strong>
          </div>
          <button onClick={loadAssignments} style={styles.button}>
            Refresh
          </button>
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}
      {loading && <div>Loading assignments...</div>}

      {classId && assignments.length === 0 && !loading && (
        <div>No assignments for this class.</div>
      )}

      <div style={styles.list}>
        {assignments.map((a) => (
          <div key={a.id} style={styles.card}>
            <div style={styles.meta}>Assignment ID: {a.assignment_code || a.id}</div>
            <h3>{a.title}</h3>
            <p>{a.description}</p>
            <p>Deadline: {a.deadline ? new Date(a.deadline).toLocaleString() : "N/A"}</p>
            <div style={styles.row}>
              <input
                type="text"
                placeholder="assignmentHash"
                value={hashes[a.id] || ""}
                onChange={(e) =>
                  setHashes((prev) => ({ ...prev, [a.id]: e.target.value }))
                }
                style={styles.input}
              />
              <button onClick={() => submitAssignment(a.id)} style={styles.primary}>
                Submit
              </button>
              <button onClick={() => checkSubmission(a.id)} style={styles.button}>
                Check Submission
              </button>
            </div>
            {submissionMap[a.id] && (
              <div style={styles.submission}>
                <div>Submitted: {new Date(submissionMap[a.id].submitted_at).toLocaleString()}</div>
                <div>Hash: {submissionMap[a.id].assignment_hash}</div>
              </div>
            )}
            <div style={styles.scoreLine}>
              Score: {typeof scoreMap[a.id] === "number" ? scoreMap[a.id] : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  row: { display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" },
  input: {
    padding: "0.5rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    minWidth: "240px",
  },
  notice: {
    marginTop: "0.75rem",
    padding: "0.75rem",
    backgroundColor: "#f8f9fa",
    border: "1px dashed #ccc",
    borderRadius: "6px",
    color: "#555",
  },
  classLabel: {
    padding: "0.5rem 0.75rem",
    backgroundColor: "#eef5ff",
    border: "1px solid #cfe0ff",
    borderRadius: "6px",
  },
  button: {
    padding: "0.5rem 0.75rem",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  primary: {
    padding: "0.5rem 0.75rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  list: { marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" },
  card: {
    border: "1px solid #ddd",
    borderRadius: "6px",
    padding: "1rem",
    backgroundColor: "#fafafa",
  },
  error: {
    color: "red",
    marginTop: "1rem",
    padding: "0.5rem",
    backgroundColor: "#ffe6e6",
    borderRadius: "4px",
  },
  submission: { marginTop: "0.5rem", fontSize: "0.9rem", color: "#333" },
  scoreLine: { marginTop: "0.5rem", fontWeight: 600, color: "#0d6efd" },
  meta: { fontSize: "0.85rem", color: "#666" },
};

export default StudentAssignments;
