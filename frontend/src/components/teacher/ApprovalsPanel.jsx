import { useEffect, useState } from "react";
import api from "../../services/api";

const ApprovalsPanel = ({ classId }) => {
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (classId) {
      fetchApprovals();
    }
  }, [classId, statusFilter]);

  const fetchApprovals = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/classes/${classId}/approvals`, {
        params: { status: statusFilter },
      });
      setApprovals(res.data.approvals || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId) => {
    try {
      await api.post(`/approvals/${approvalId}/approve`);
      fetchApprovals();
    } catch (err) {
      alert(err.response?.data?.error || "Approve failed");
    }
  };

  const handleReject = async (approvalId) => {
    const reason = window.prompt("Reason (optional):", "");
    try {
      await api.post(`/approvals/${approvalId}/reject`, {
        reason: reason || "",
      });
      fetchApprovals();
    } catch (err) {
      alert(err.response?.data?.error || "Reject failed");
    }
  };

  if (!classId) return <div>Select a class to manage approvals.</div>;

  return (
    <div style={styles.card}>
      <h2>Approvals</h2>
      <div style={styles.row}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.select}
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button onClick={fetchApprovals} style={styles.button}>
          Refresh
        </button>
      </div>

      {loading && <div>Loading approvals...</div>}
      {error && <div style={styles.error}>{error}</div>}

      {approvals.length === 0 && !loading && (
        <div>No approvals in this status.</div>
      )}

      <div style={styles.list}>
        {approvals.map((a) => (
          <div key={a.id} style={styles.item}>
            <div>
              <strong>{a.full_name || a.email}</strong>
              {a.full_name && <span style={{ color: "#666", fontSize: "0.9rem", marginLeft: "0.5rem" }}>({a.email})</span>}
            </div>
            <div>Wallet: {a.wallet_address || a.approval_wallet}</div>
            <div>Status: {a.status}</div>
            {a.tx_hash && <div>Tx: {a.tx_hash}</div>}
            {statusFilter === "PENDING" && (
              <div style={styles.actions}>
                <button onClick={() => handleApprove(a.id)} style={styles.primary}>
                  Approve
                </button>
                <button onClick={() => handleReject(a.id)} style={styles.danger}>
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
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
  row: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "1rem",
  },
  select: {
    padding: "0.5rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
  },
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
  list: { display: "grid", gap: "0.75rem" },
  item: {
    border: "1px solid #ddd",
    borderRadius: "6px",
    padding: "0.75rem",
    backgroundColor: "#fafafa",
  },
  actions: { marginTop: "0.5rem", display: "flex", gap: "0.5rem" },
  primary: {
    padding: "0.4rem 0.75rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  danger: {
    padding: "0.4rem 0.75rem",
    backgroundColor: "#dc3545",
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

export default ApprovalsPanel;
