import api from "../../services/api";

const ClassList = ({ classes, onRefresh, onSelect, selectedClassId }) => {

  const handleCloseClass = async (classId, classDbId) => {
    if (!window.confirm("Are you sure you want to close this class?")) {
      return;
    }

    try {
      await api.post(`/classes/${classDbId}/close`);
      alert("Class closed successfully");
      onRefresh();
    } catch (error) {
      alert(error.response?.data?.error || "Error closing class");
    }
  };

  if (classes.length === 0) {
    return (
      <div style={styles.empty}>
        <p>No classes yet. Create your first class!</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>My Classes</h2>
      <div style={styles.grid}>
        {classes.map((classItem) => (
          <div
            key={classItem.id}
            style={{
              ...styles.card,
              ...(selectedClassId === classItem.id ? styles.cardActive : {}),
            }}
          >
            <h3 style={styles.cardTitle}>{classItem.name}</h3>
            <p style={styles.classId}>Class ID: {classItem.class_id}</p>
            <p style={{ fontSize: "0.9rem", color: "#666", margin: "0.25rem 0" }}>
              <strong>DB ID for students:</strong> {classItem.id}
            </p>
            <p style={styles.description}>{classItem.description}</p>
            <div style={styles.status}>
              Status:{" "}
              <span
                style={{
                  color: classItem.status === "open" ? "green" : "red",
                }}
              >
                {classItem.status.toUpperCase()}
              </span>
            </div>
            <div style={styles.actions}>
              <button
                onClick={() => onSelect?.(classItem)}
                style={styles.viewButton}
              >
                Select
              </button>
              {classItem.status === "open" && (
                <button
                  onClick={() => handleCloseClass(classItem.class_id, classItem.id)}
                  style={styles.closeButton}
                >
                  Close Class
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
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
  cardActive: {
    borderColor: "#007bff",
    boxShadow: "0 0 0 1px #007bff",
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: "0.5rem",
    color: "#333",
  },
  classId: {
    color: "#666",
    fontSize: "0.9rem",
    marginBottom: "0.5rem",
  },
  description: {
    color: "#666",
    marginBottom: "1rem",
  },
  status: {
    marginBottom: "1rem",
    fontWeight: "bold",
  },
  actions: {
    display: "flex",
    gap: "0.5rem",
  },
  viewButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    flex: 1,
  },
  closeButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    flex: 1,
  },
  empty: {
    textAlign: "center",
    padding: "3rem",
    color: "#666",
  },
};

export default ClassList;
