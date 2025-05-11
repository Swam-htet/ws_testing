const crypto = require("crypto"); // For generating unique IDs

// Helper function to send messages to a ws client
function sendMessage(wsClient, type, payload) {
  if (wsClient.readyState === wsClient.OPEN) {
    wsClient.send(JSON.stringify({ type, payload }));
  }
}

function initializeWsEventHandlers(wss, { JSON_FILE_PATH, fs }) {
  const clients = new Map(); // To store client-specific data (progress, intervalId, etc.)

  wss.on("connection", (wsClient) => {
    const clientId = crypto.randomUUID();
    clients.set(wsClient, { id: clientId, progress: 0, intervalId: null });
    console.log(`WS Client connected: ${clientId}`);

    // --- Progress Sending Logic --- //
    function startSendingProgress() {
      let clientData = clients.get(wsClient);
      if (!clientData) return; // Client might have disconnected

      if (clientData.intervalId) {
        clearInterval(clientData.intervalId);
      }

      clientData.intervalId = setInterval(() => {
        clientData = clients.get(wsClient); // Refresh clientData
        if (!clientData || wsClient.readyState !== wsClient.OPEN) {
          if (clientData && clientData.intervalId)
            clearInterval(clientData.intervalId);
          return;
        }

        if (clientData.progress < 100) {
          const increment = Math.floor(Math.random() * 10) + 1;
          clientData.progress += increment;
          if (clientData.progress > 100) {
            clientData.progress = 100;
          }
          sendMessage(wsClient, "uploadProgress", {
            progress: clientData.progress,
          });
        } else {
          clearInterval(clientData.intervalId);
          clientData.intervalId = null;
          sendMessage(wsClient, "uploadComplete", {
            message: "Upload finished!",
          });
        }
      }, 1000);
      clients.set(wsClient, clientData); // Update clientData in map
    }
    startSendingProgress();
    // --- End Progress Sending Logic --- //

    wsClient.on("message", async (messageBuffer) => {
      let clientData = clients.get(wsClient);
      if (!clientData) return;

      let parsedMessage;
      try {
        parsedMessage = JSON.parse(messageBuffer.toString());
      } catch (e) {
        console.error(`WS Client ${clientData.id}: Error parsing message:`, e);
        return;
      }

      console.log(`WS Client ${clientData.id} sent:`, parsedMessage);

      switch (parsedMessage.type) {
        case "resetProgress":
          clientData.progress = 0;
          clients.set(wsClient, clientData);
          sendMessage(wsClient, "uploadProgress", {
            progress: clientData.progress,
          });
          startSendingProgress(); // This will also update clientData in the map
          console.log(
            `WS Client ${clientData.id}: Progress reset and interval restarted.`
          );
          break;

        case "submitFormData":
          const formData = parsedMessage.payload;
          console.log(`WS Client ${clientData.id} submitFormData:`, formData);
          try {
            let existingData = [];
            try {
              const fileContent = await fs.readFile(JSON_FILE_PATH, "utf8");
              existingData = JSON.parse(fileContent);
              if (!Array.isArray(existingData)) existingData = [];
            } catch (readError) {
              if (readError.code !== "ENOENT") {
                console.error(
                  `WS Client ${clientData.id}: Error reading data file:`,
                  readError
                );
                sendMessage(wsClient, "formDataSaved", {
                  success: false,
                  message: "Error reading data file.",
                });
                return;
              }
            }

            const newTimestamp = new Date().toISOString();
            const entryIndex = existingData.findIndex(
              (entry) => entry.socketId === clientData.id
            ); // Use clientData.id

            if (entryIndex !== -1) {
              existingData[entryIndex].message = formData.message;
              existingData[entryIndex].timestamp = newTimestamp;
            } else {
              existingData.push({
                ...formData,
                socketId: clientData.id,
                timestamp: newTimestamp,
              });
            }

            await fs.writeFile(
              JSON_FILE_PATH,
              JSON.stringify(existingData, null, 2),
              "utf8"
            );
            sendMessage(wsClient, "formDataSaved", {
              success: true,
              message: "Data saved/updated successfully!",
            });
          } catch (writeError) {
            console.error(
              `WS Client ${clientData.id}: Error writing data file:`,
              writeError
            );
            sendMessage(wsClient, "formDataSaved", {
              success: false,
              message: "Error writing data file.",
            });
          }
          break;

        default:
          console.log(
            `WS Client ${clientData.id}: Received unknown message type: ${parsedMessage.type}`
          );
      }
    });

    wsClient.on("close", () => {
      const clientData = clients.get(wsClient);
      if (clientData) {
        console.log(`WS Client disconnected: ${clientData.id}`);
        if (clientData.intervalId) {
          clearInterval(clientData.intervalId);
        }
        clients.delete(wsClient);
      }
    });

    wsClient.on("error", (error) => {
      const clientData = clients.get(wsClient);
      const id = clientData ? clientData.id : "unknown";
      console.error(`WS Client ${id} error:`, error);
      // Consider cleaning up if clientData exists and intervalId is set
      if (clientData && clientData.intervalId) {
        clearInterval(clientData.intervalId);
      }
      clients.delete(wsClient); // Remove on error too
    });
  });
}

module.exports = { initializeWsEventHandlers };
