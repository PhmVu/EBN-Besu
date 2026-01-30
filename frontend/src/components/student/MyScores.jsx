import { useState, useEffect } from "react";
import api from "../../services/api";

const MyScores = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      const response = await api.get("/students/my-scores");
      setScores(response.data);
    } catch (error) {
      console.error("Error fetching scores:", error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div>
      <h2>My Scores</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Class</th>
            <th>Score</th>
            <th>Recorded At</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => (
            <tr key={index}>
              <td>{score.className || score.classId}</td>
              <td>{score.score || "N/A"}</td>
              <td>
                {score.recordedAt
                  ? new Date(parseInt(score.recordedAt) * 1000).toLocaleString()
                  : "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "1rem",
  },
};

export default MyScores;
