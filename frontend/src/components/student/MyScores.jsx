import { useState, useEffect } from "react";
import api from "../../services/api";

const MyScores = ({ classId, className }) => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classId) {
      fetchScores();
    } else {
      setScores([]);
      setLoading(false);
    }
  }, [classId]);

  const fetchScores = async () => {
    try {
      const response = await api.get("/students/my-scores", {
        params: { classId },
      });
      setScores(response.data.scores || []);
    } catch (error) {
      console.error("Error fetching scores:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!classId) {
    return (
      <div>
        <h2>My Scores</h2>
        <p>Please select an approved class in "My Classes" to view scores.</p>
      </div>
    );
  }

  if (loading) {
    return <div>Loading scores...</div>;
  }

  if (scores.length === 0) {
    return (
      <div>
        <h2>My Scores</h2>
        <p>No scores available yet.</p>
      </div>
    );
  }

  const numericScores = scores
    .map((s) => (typeof s.score === "number" ? s.score : null))
    .filter((v) => v !== null);
  const averageScore =
    numericScores.length > 0
      ? (numericScores.reduce((sum, v) => sum + v, 0) / numericScores.length).toFixed(2)
      : null;

  return (
    <div>
      <h2>My Scores</h2>
      <div style={styles.classLabel}>Class: <strong>{className || classId}</strong></div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => (
            <tr key={index}>
              <td>{score.assignment_id || score.id || "N/A"}</td>
              <td>{typeof score.score === "number" ? score.score : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={styles.avgRow}>
        Average: {averageScore !== null ? averageScore : ""}
      </div>
    </div>
  );
};

const styles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "1rem",
  },
  classLabel: {
    marginTop: "0.5rem",
    padding: "0.5rem 0.75rem",
    backgroundColor: "#eef5ff",
    border: "1px solid #cfe0ff",
    borderRadius: "6px",
    display: "inline-block",
  },
  avgRow: {
    marginTop: "0.75rem",
    fontWeight: 600,
    color: "#0d6efd",
  },
};

export default MyScores;
