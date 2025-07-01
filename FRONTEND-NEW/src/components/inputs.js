import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageUpload from "./imageuploads";
import StoryInput from "./storyinput";
import URLInput from "./urlinput";
import Execute from "./execute"; // 👈 Add your final step component here

const Input = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [persistedFiles, setPersistedFiles] = useState([]);

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ImageUpload
            handleNext={handleNext}
            persistedFiles={persistedFiles}
            setPersistedFiles={setPersistedFiles}
          />
        );
      case 2:
        return <StoryInput onBack={handleBack} onNext={handleNext} />;
      case 3:
        return <URLInput onBack={handleBack} onNext={handleNext} />; 
      case 4:
        return <Execute onBack={handleBack} />; 
      default:
        return null;
    }
  };

  return (
    <div>
      <div style={{ backgroundColor: "#f2f7fe", minHeight: "100vh" }}>
        <nav
          style={{
            backgroundColor: "#ffffff",
            minHeight: "8vh",
            padding: "1rem 5vw",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <i
              className="fa fa-code"
              style={{
                background:
                  "linear-gradient(90deg,rgb(87, 72, 222),rgb(47, 28, 220),rgb(236, 7, 253))",
                color: "white",
                padding: "1rem",
                borderRadius: "20%",
                fontSize: "15px",
              }}
            ></i>
            <div>
              <h4 style={{ margin: 0, fontSize: "22px" }}>AutoTest Studio</h4>
              <p style={{ margin: 0, fontSize: "16px", color: "#555" }}>
                Automation Development Platform
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/")}
            style={{
              padding: "0.8rem 1.5rem",
              background: "white",
              color: "black",
              border: "1px solid gray",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              marginTop: "1rem",
              fontWeight: "550",
            }}
          >
            Back to Dashboard
          </button>
        </nav>

        <h1
          style={{
            padding: "2rem 13vw 1rem",
            fontSize: "30px",
            margin: 0,
          }}
        >
          Project Setup Wizard
        </h1>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "2rem",
            padding: "1rem 13vw",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "1rem",
              flex: "1 1 300px",
              minWidth: "250px",
            }}
          >
            <div
              style={{
                backgroundColor: "#e0e0e0",
                padding: "0.75rem",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "50px",
                width: "60px",
              }}
            >
              <i
                className="fa-solid fa-arrow-up-from-bracket"
                style={{ fontSize: "26px", color: "gray" }}
              ></i>
            </div>
            <div>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>
                Upload Design
              </h2>
              <p style={{ margin: 0, fontSize: "15px", color: "#555" }}>
                Upload screenshots or visual designs of your application
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "1rem",
              flex: "1 1 300px",
              minWidth: "250px",
            }}
          >
            <div
              style={{
                backgroundColor: "#e0e0e0",
                padding: "0.75rem",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "50px",
                width: "60px",
              }}
            >
              <i
                className="fa-regular fa-message"
                style={{ fontSize: "26px", color: "gray" }}
              ></i>
            </div>
            <div>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>
                Import User Stories
              </h2>
              <p style={{ margin: 0, fontSize: "15px", color: "#555" }}>
                Add user stories from Jira, Excel, or create them manually
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "1rem",
              flex: "1 1 300px",
              minWidth: "250px",
            }}
          >
            <div
              style={{
                backgroundColor: "#e0e0e0",
                padding: "0.75rem",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "50px",
                width: "50px",
              }}
            >
              <i
                className="fa-solid fa-code"
                style={{ fontSize: "26px", color: "gray" }}
              ></i>
            </div>
            <div>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>
                Generate Scripts
              </h2>
              <p style={{ margin: 0, fontSize: "15px", color: "#555" }}>
                Configure framework and generate test scripts
              </p>
            </div>
          </div>
        </div>

        {renderStep()}
      </div>
    </div>
  );
};

export default Input;
