import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const WalletInfo = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [showKeyError, setShowKeyError] = useState("");
  const [showKeyLoading, setShowKeyLoading] = useState(false);
  const { getPrivateKey } = useAuth();

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const response = await api.get("/students/my-wallet");
      setWallet(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Error fetching wallet");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading wallet information...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  if (!wallet) {
    return <div>No wallet found. Please contact your teacher.</div>;
  }

  return (
    <div>
      <h2>My Wallet</h2>
      <div style={styles.warning}>
        <strong>⚠️ Security Warning:</strong> Keep your private key secure!
        Never share it with anyone. If you lose it, you cannot recover your
        wallet.
      </div>
      <div style={styles.info}>
        <div style={styles.field}>
          <label style={styles.label}>Wallet Address:</label>
          <div style={styles.value}>{wallet.walletAddress}</div>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>RPC Endpoint:</label>
          <div style={styles.value}>http://localhost:8549</div>
          <div style={styles.help}>
            Use this endpoint to connect Remix IDE or VS Code
          </div>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Chain ID:</label>
          <div style={styles.value}>1337</div>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Private Key (show once):</label>
          {privateKey ? (
            <div style={styles.value}>{privateKey}</div>
          ) : (
            <div style={styles.keyBox}>
              <input
                type="password"
                placeholder="Enter password to reveal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
              <button
                onClick={async () => {
                  setShowKeyError("");
                  setShowKeyLoading(true);
                  try {
                    const data = await getPrivateKey(password);
                    setPrivateKey(data.privateKey);
                  } catch (err) {
                    setShowKeyError(err.response?.data?.error || "Failed to load key");
                  } finally {
                    setShowKeyLoading(false);
                  }
                }}
                style={styles.button}
                disabled={showKeyLoading || !password}
              >
                {showKeyLoading ? "Loading..." : "Show Private Key"}
              </button>
            </div>
          )}
          {showKeyError && <div style={styles.error}>{showKeyError}</div>}
        </div>
      </div>
    </div>
  );
};

const styles = {
  warning: {
    backgroundColor: "#fff3cd",
    border: "1px solid #ffc107",
    borderRadius: "4px",
    padding: "1rem",
    marginBottom: "1.5rem",
    color: "#856404",
  },
  info: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontWeight: "bold",
    color: "#333",
  },
  value: {
    padding: "0.75rem",
    backgroundColor: "#f5f5f5",
    borderRadius: "4px",
    fontFamily: "monospace",
    wordBreak: "break-all",
  },
  help: {
    fontSize: "0.9rem",
    color: "#666",
    fontStyle: "italic",
  },
  keyBox: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
    flexWrap: "wrap",
  },
  input: {
    padding: "0.5rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    minWidth: "220px",
  },
  button: {
    padding: "0.5rem 0.75rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  error: {
    color: "red",
    padding: "1rem",
    backgroundColor: "#ffe6e6",
    borderRadius: "4px",
  },
};

export default WalletInfo;
