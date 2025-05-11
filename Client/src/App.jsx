import "./App.css";
import DataForm from "./components/DataForm";
import { useWebSocket } from "./hooks/useWebSocket";
function App() {
  // const {
  //   progress,
  //   submitStatus,
  //   isConnected,
  //   sendFormData,
  //   sendResetProgress,
  // } = useSocket();

  const {
    progress,
    submitStatus,
    isConnected,
    sendFormData,
    sendResetProgress,
  } = useWebSocket();

  const handleResetClick = () => {
    sendResetProgress();
  };

  return (
    <>
      <h4>WebSocket Upload Progress: {progress}%</h4>
      <progress
        id="progressBar"
        value={progress}
        max="100"
        style={{ width: "100%" }}
      ></progress>
      <div>
        <button onClick={handleResetClick} disabled={!isConnected}>
          Reset Progress on Server
        </button>
      </div>

      <hr />

      <h2>Submit Data</h2>
      <DataForm isConnected={isConnected} formValueChange={sendFormData} />
      {submitStatus && <p>{submitStatus}</p>}
      {!isConnected && (
        <p style={{ color: "red" }}>Currently disconnected from server.</p>
      )}
    </>
  );
}

export default App;
