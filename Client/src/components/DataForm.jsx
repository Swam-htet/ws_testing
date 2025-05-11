import { useState } from "react";

function DataForm({ isConnected, formValueChange }) {
  const [formData, setFormData] = useState({ message: "" });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    formValueChange(formData);
  };

  return (
    <div>
      <label htmlFor="message">Message: </label>
      <input
        type="text"
        id="message"
        name="message"
        value={formData.message}
        onChange={handleInputChange}
        disabled={!isConnected}
      />
    </div>
  );
}

export default DataForm;
