function initializeSocketEventHandlers(io, { JSON_FILE_PATH, fs }) {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // --- Progress Sending Logic --- //
    let progress = 0;
    let intervalId = null;

    function startSendingProgress() {
      if (intervalId) {
        clearInterval(intervalId);
      }
      intervalId = setInterval(() => {
        if (progress < 100) {
          const increment = Math.floor(Math.random() * 10) + 1;
          progress += increment;
          if (progress > 100) {
            progress = 100;
          }
          socket.emit("uploadProgress", { progress });
          // console.log(`Emitted progress ${progress}% to ${socket.id}`); // Optional: for debugging
        } else {
          clearInterval(intervalId);
          intervalId = null;
          socket.emit("uploadComplete", { message: "Upload finished!" });
          // console.log(`Progress complete for ${socket.id}.`); // Optional: for debugging
        }
      }, 1000);
    }
    startSendingProgress();

    socket.on("resetProgress", () => {
      console.log(`Received resetProgress from ${socket.id}`);
      progress = 0;
      socket.emit("uploadProgress", { progress });
      startSendingProgress();
      console.log(
        `Progress reset to 0 for ${socket.id}. Restarting progress interval.`
      );
    });
    // --- End Progress Sending Logic --- //

    // --- Form Data Handling --- //
    socket.on("submitFormData", async (data) => {
      console.log(`Received submitFormData from ${socket.id} with data:`, data);
      try {
        let existingData = [];
        try {
          const fileContent = await fs.readFile(JSON_FILE_PATH, "utf8");
          existingData = JSON.parse(fileContent);
          if (!Array.isArray(existingData)) {
            console.warn("Data file was not an array, re-initializing.");
            existingData = [];
          }
        } catch (readError) {
          if (readError.code !== "ENOENT") {
            console.error("Error reading data file:", readError);
            socket.emit("formDataSaved", {
              success: false,
              message: "Error reading data file.",
            });
            return;
          }
        }

        const newTimestamp = new Date().toISOString();
        const entryIndex = existingData.findIndex(
          (entry) => entry.socketId === socket.id
        );

        if (entryIndex !== -1) {
          existingData[entryIndex].message = data.message;
          existingData[entryIndex].timestamp = newTimestamp;
          console.log(`Updated entry for socketId: ${socket.id}`);
        } else {
          const dataToSave = {
            ...data,
            socketId: socket.id,
            timestamp: newTimestamp,
          };
          existingData.push(dataToSave);
          console.log(`Added new entry for socketId: ${socket.id}`);
        }

        await fs.writeFile(
          JSON_FILE_PATH,
          JSON.stringify(existingData, null, 2),
          "utf8"
        );
        console.log("Form data processed and saved to", JSON_FILE_PATH);
        socket.emit("formDataSaved", {
          success: true,
          message: "Data saved/updated successfully!",
        });
      } catch (writeError) {
        console.error("Error writing data file:", writeError);
        socket.emit("formDataSaved", {
          success: false,
          message: "Error writing data file.",
        });
      }
    });
    // --- End Form Data Handling --- //

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log(
          `Cleared progress interval for disconnected user ${socket.id}`
        );
      }
    });
  });
}

module.exports = { initializeSocketEventHandlers };
