require("dotenv").config();

// Validate required environment variables
const requiredEnvVars = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET",
  "RPC_URL",
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.warn(
    `Warning: Missing environment variables: ${missingEnvVars.join(", ")}`
  );
  console.warn("Please check .env file and set required variables");
}

// Validate JWT secret in production
if (process.env.NODE_ENV === "production") {
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET === "change_this_secret_in_production"
  ) {
    throw new Error(
      "JWT_SECRET must be set and changed in production environment"
    );
  }
}

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "change_this_secret_in_production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // Database
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    name: process.env.DB_NAME || "besu_training",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
  },

  // Blockchain
  blockchain: {
    rpcUrl: process.env.RPC_URL || "http://localhost:8549",
    rpcWsUrl: process.env.RPC_WS_URL || "ws://localhost:8550",
    chainId: parseInt(process.env.CHAIN_ID || "1337"),
    adminAddress: process.env.ADMIN_ADDRESS,
    adminPrivateKey: process.env.ADMIN_PRIVATE_KEY,
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  // Logging
  logLevel: process.env.LOG_LEVEL || "info",
};
