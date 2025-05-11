import { useCallback, useEffect, useState } from "react";

const WEBSOCKET_URL = "ws://localhost:3000";
export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitStatus, setSubmitStatus] = useState("");

  useEffect(() => {
    console.log("Attempting to connect to WebSocket at", WEBSOCKET_URL);
    const ws = new WebSocket(WEBSOCKET_URL);
    setSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket connected!");
      setIsConnected(true);
      setProgress(0); // Reset progress on new connection
      setSubmitStatus(""); // Clear status on new connection
    };

    ws.onmessage = (event) => {
      try {
        const parsedMessage = JSON.parse(event.data);
        console.log("WebSocket message received:", parsedMessage);

        switch (parsedMessage.type) {
          case "uploadProgress":
            setProgress(parsedMessage.payload.progress);
            break;
          case "uploadComplete":
            console.log(
              "Upload complete message:",
              parsedMessage.payload.message
            );
            // You might want to set a specific status for this
            setSubmitStatus(
              parsedMessage.payload.message || "Upload complete!"
            );
            break;
          case "formDataSaved":
            setSubmitStatus(`Server: ${parsedMessage.payload.message}`);
            break;
          default:
            console.log("Received unhandled message type:", parsedMessage.type);
        }
      } catch (error) {
        console.error(
          "Error parsing WebSocket message or handling event:",
          error,
          event.data
        );
      }
    };

    ws.onclose = (event) => {
      console.log("WebSocket disconnected:", event.code, event.reason);
      setIsConnected(false);
      setSocket(null);
      if (event.wasClean) {
        setSubmitStatus("Disconnected cleanly.");
      } else {
        setSubmitStatus("Disconnected. Check server or network.");
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
      // For security reasons, detailed error messages are not available in the event for onerror
      setSubmitStatus(
        "WebSocket connection error. Is the server running and configured for ws?"
      );
      // No need to setSocket(null) here, onclose will usually follow
    };

    // Cleanup function to close the socket when the component unmounts or WEBSOCKET_URL changes
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log("Closing WebSocket connection via hook cleanup...");
        ws.close();
      }
    };
  }, []); // Only re-run if WEBSOCKET_URL changes, though it's constant here

  const sendFormData = useCallback(
    (payload) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        try {
          const message = JSON.stringify({
            type: "submitFormData",
            payload,
          });
          console.log("Sending WebSocket message:", message);
          socket.send(message);
          setSubmitStatus("Form data sent to server...");
        } catch (error) {
          console.error("Error sending WebSocket message:", error);
        }
      } else {
        console.log("WebSocket not connected, cannot send message.");
        setSubmitStatus("Error: Not connected to server to send message.");
      }
    },
    [socket]
  );

  const sendResetProgress = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "resetProgress" }));
    }
  }, [socket]);

  return {
    isConnected,
    progress,
    submitStatus,
    sendFormData,
    sendResetProgress,
  };
};
