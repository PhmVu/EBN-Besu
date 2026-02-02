import { useState } from "react";
import api from "../../services/api";

const ApprovalPanel = () => {
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStatus = async () => {
    if (!classId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/classes/${classId}/my-approval-status`);
      setStatus(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  };

  const requestApproval = async () => {
    if (!classId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post(`/classes/${classId}/request-approval`, {});
      setStatus(res.data.approval || { status: "PENDING" });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to request approval");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Approval Request</h2>
      <div style={styles.row}>
        <input
          type="text"
          placeholder="Class DB ID (e.g., 4)"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          style={styles.input}
        />
        <button onClick={fetchStatus} style={styles.button} disabled={loading}>
          Check Status
        </button>
        <button
          onClick={requestApproval}
          style={styles.primary}
          disabled={loading}
        >
          Request Approval
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {status && (
        <div style={styles.card}>
          <div><strong>Status:</strong> {status.status || "PENDING"}</div>
          {status.message && <div>{status.message}</div>}
          {status.requested_at && (
            <div>Requested: {new Date(status.requested_at).toLocaleString()}</div>
          )}
          {status.reviewed_at && (
            <div>Reviewed: {new Date(status.reviewed_at).toLocaleString()}</div>
          )}
          {status.rejection_reason && (
            <div>Reason: {status.rejection_reason}</div>
          )}
          {status.tx_hash && (
            <div>Tx: {status.tx_hash}</div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  row: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  input: {
    padding: "0.5rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    minWidth: "200px",
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
  error: {
    color: "red",
    marginTop: "1rem",
    padding: "0.5rem",
    backgroundColor: "#ffe6e6",
    borderRadius: "4px",
  },
  card: {
    marginTop: "1rem",
    padding: "1rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    backgroundColor: "#fafafa",
  },
};

export default ApprovalPanel;
