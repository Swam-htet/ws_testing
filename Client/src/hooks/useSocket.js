import { useEffect, useState } from "react";
import io from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:3000";

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [progress, setProgress] = useState(0);
  const [submitStatus, setSubmitStatus] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);
    console.log(
      "Attempting to connect to WebSocket server at",
      SOCKET_SERVER_URL
    );

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server! ID:", newSocket.id);
      setIsConnected(true);
      setProgress(0); // Reset progress on new connection
      setSubmitStatus(""); // Clear status on new connection
    });

    newSocket.on("uploadProgress", (data) => {
      console.log("Upload progress received:", data);
      setProgress(data.progress);
    });

    newSocket.on("formDataSaved", (response) => {
      console.log("Server response after form submission:", response);
      setSubmitStatus(`Server: ${response.message}`);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected from WebSocket server:", reason);
      setIsConnected(false);
      setSubmitStatus("Disconnected. Please refresh or check server.");
    });

    newSocket.on("connect_error", (err) => {
      console.error("WebSocket connection error:", err);
      setIsConnected(false);
      setSubmitStatus("Connection Error. Is the server running?");
    });

    return () => {
      console.log("Disconnecting WebSocket via hook cleanup...");
      newSocket.disconnect();
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  const sendFormData = (formData) => {
    if (socket && socket.connected) {
      console.log("Hook: Submitting form data:", formData);
      socket.emit("submitFormData", formData);
      setSubmitStatus("Form data submitted to server...");
    } else {
      console.log("Hook: Socket not connected, cannot submit form.");
      setSubmitStatus("Error: Not connected to server.");
    }
  };

  const sendResetProgress = () => {
    if (socket && socket.connected) {
      console.log("Hook: Sending resetProgress event to server...");
      socket.emit("resetProgress");
      setSubmitStatus(""); // Clear submission status on progress reset
    } else {
      console.log("Hook: Socket not connected, cannot send resetProgress.");
    }
  };

  return {
    socket,
    progress,
    submitStatus,
    isConnected,
    sendFormData,
    sendResetProgress,
  };
};
