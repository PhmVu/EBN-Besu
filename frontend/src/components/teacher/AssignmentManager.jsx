import { useEffect, useState } from "react";
import api from "../../services/api";
import SubmissionList from "./SubmissionList";

const AssignmentManager = ({ classId }) => {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [editingAssignmentId, setEditingAssignmentId] = useState("");
  const [form, setForm] = useState({ assignmentCode: "", title: "", description: "", deadline: "" });
  const [editForm, setEditForm] = useState({ assignmentCode: "", title: "", description: "", deadline: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatForInput = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  useEffect(() => {
    if (classId) {
      fetchAssignments();
    }
  }, [classId]);

  const fetchAssignments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/classes/${classId}/assignments`);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/classes/${classId}/assignments`, {
        assignment_code: form.assignmentCode || null,
        title: form.title,
        description: form.description,
        deadline: form.deadline || null,
      });
      setForm({ assignmentCode: "", title: "", description: "", deadline: "" });
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create assignment");
    }
  };

  const startEdit = (assignment) => {
    setEditingAssignmentId(assignment.id);
    setEditForm({
      assignmentCode: assignment.assignment_code || "",
      title: assignment.title || "",
      description: assignment.description || "",
      deadline: assignment.deadline ? formatForInput(assignment.deadline) : "",
    });
  };

  const cancelEdit = () => {
    setEditingAssignmentId("");
    setEditForm({ assignmentCode: "", title: "", description: "", deadline: "" });
  };

  const updateAssignment = async (assignmentId) => {
    setError("");
    try {
      await api.put(`/assignments/${assignmentId}`, {
        assignment_code: editForm.assignmentCode || null,
        title: editForm.title,
        description: editForm.description,
        deadline: editForm.deadline || null,
      });
      cancelEdit();
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update assignment");
    }
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm("Delete this assignment? This will remove submissions too.")) {
      return;
    }
    setError("");
    try {
      await api.delete(`/assignments/${assignmentId}`);
      if (selectedAssignmentId === assignmentId) {
        setSelectedAssignmentId("");
      }
      cancelEdit();
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete assignment");
    }
  };

  if (!classId) return <div>Select a class to manage assignments.</div>;

  return (
    <div style={styles.card}>
      <h2>Assignments</h2>
      <form onSubmit={createAssignment} style={styles.form}>
        <input
          type="text"
          placeholder="Assignment ID (optional)"
          value={form.assignmentCode}
          onChange={(e) => setForm({ ...form, assignmentCode: e.target.value })}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={styles.input}
        />
        <input
          type="datetime-local"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          style={styles.input}
        />
        <button type="submit" style={styles.primary}>Create</button>
      </form>

      {loading && <div>Loading assignments...</div>}
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.list}>
        {assignments.map((a) => (
          <div key={a.id} style={styles.item}>
            {editingAssignmentId === a.id ? (
              <div style={styles.editGrid}>
                <input
                  type="text"
                  value={editForm.assignmentCode}
                  onChange={(e) => setEditForm({ ...editForm, assignmentCode: e.target.value })}
                  style={styles.input}
                  placeholder="Assignment ID"
                />
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="datetime-local"
                  value={editForm.deadline}
                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                  style={styles.input}
                />
                <div style={styles.editActions}>
                  <button style={styles.primary} onClick={() => updateAssignment(a.id)}>Save</button>
                  <button style={styles.button} onClick={cancelEdit}>Cancel</button>
                  <button style={styles.danger} onClick={() => deleteAssignment(a.id)}>Delete</button>
                </div>
              </div>
            ) : (
              <>
                {a.assignment_code && (
                  <div style={styles.meta}>ID: {a.assignment_code}</div>
                )}
                <div><strong>{a.title}</strong></div>
                <div>{a.description}</div>
                <div>Deadline: {a.deadline ? new Date(a.deadline).toLocaleString() : "N/A"}</div>
                <div style={styles.actionsRow}>
                  <button
                    style={styles.button}
                    onClick={() => setSelectedAssignmentId(a.id)}
                  >
                    View Submissions
                  </button>
                  <button style={styles.outline} onClick={() => startEdit(a)}>
                    Edit
                  </button>
                  <button style={styles.danger} onClick={() => deleteAssignment(a.id)}>
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {selectedAssignmentId && (
        <div style={{ marginTop: "1rem" }}>
          <SubmissionList assignmentId={selectedAssignmentId} />
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
  form: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  input: {
    padding: "0.5rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
  },
  primary: {
    padding: "0.5rem 0.75rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  list: { display: "grid", gap: "0.75rem" },
  item: {
    border: "1px solid #ddd",
    borderRadius: "6px",
    padding: "0.75rem",
    backgroundColor: "#fafafa",
  },
  button: {
    marginTop: "0.5rem",
    padding: "0.4rem 0.75rem",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  outline: {
    marginTop: "0.5rem",
    padding: "0.4rem 0.75rem",
    backgroundColor: "white",
    color: "#0d6efd",
    border: "1px solid #0d6efd",
    borderRadius: "4px",
    cursor: "pointer",
  },
  danger: {
    marginTop: "0.5rem",
    padding: "0.4rem 0.75rem",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  actionsRow: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  editGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "0.5rem",
  },
  meta: {
    fontSize: "0.85rem",
    color: "#666",
  },
  editActions: {
    gridColumn: "1 / -1",
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  error: {
    color: "red",
    padding: "0.5rem",
    backgroundColor: "#ffe6e6",
    borderRadius: "4px",
  },
};

export default AssignmentManager;
