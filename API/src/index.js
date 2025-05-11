const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs").promises;
const path = require("path");
const WebSocket = require("ws");
const { initializeWsEventHandlers } = require("./wsHandlers");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const DATA_DIR = path.join(__dirname, "data");
const JSON_FILE_PATH = path.join(DATA_DIR, "formData.json");

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log(`Data directory ensured: ${DATA_DIR}`);
  } catch (error) {
    console.error(`Error creating data directory ${DATA_DIR}:`, error);
  }
}
ensureDataDir();

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

// const io = new Server(server, {
//   cors: {
//     origin: allowedOrigins,
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });

// // Initialize socket event handlers by calling the imported function
// initializeSocketEventHandlers(io, { JSON_FILE_PATH, fs });

const wss = new WebSocket.Server({ server });

initializeWsEventHandlers(wss, { JSON_FILE_PATH, fs });

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
