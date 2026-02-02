import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const MyClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get("/students/my-classes");
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading classes...</div>;
  }

  if (classes.length === 0) {
    return (
      <div>
        <h2>My Classes</h2>
        <p>You are not enrolled in any classes yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>My Classes</h2>
      <div style={styles.grid}>
        {classes.map((classItem) => (
          <div
            key={classItem.id}
            style={{
              ...styles.card,
            }}
          >
            <h3>{classItem.name}</h3>
            <p style={styles.classId}>Class ID: {classItem.class_id}</p>
            <p style={styles.status}>
              Status:{" "}
              <span
                style={{
                  color: classItem.status === "open" ? "green" : "red",
                }}
              >
                {classItem.status.toUpperCase()}
              </span>
            </p>
            <p style={styles.enrolled}>
              Enrolled: {new Date(classItem.enrolled_at).toLocaleDateString()}
            </p>
            <button
              style={styles.selectButton}
              onClick={() => {
                navigate(`/student/classes/${classItem.id}`);
              }}
            >
              Open Class
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
    marginTop: "1.5rem",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "1.5rem",
    backgroundColor: "#fafafa",
  },
  classId: {
    color: "#666",
    fontSize: "0.9rem",
  },
  status: {
    fontWeight: "bold",
    marginTop: "0.5rem",
  },
  enrolled: {
    color: "#666",
    fontSize: "0.9rem",
    marginTop: "0.5rem",
  },
  selectButton: {
    marginTop: "0.75rem",
    padding: "0.5rem 0.75rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default MyClasses;
