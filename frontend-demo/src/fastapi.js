import { useState } from "react";
import axios from "axios";

const FastApi = () => {
  const [images, setImages] = useState([]);
  const [url, setUrl] = useState("");
  const [story, setStory] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleImageChange = (e) => {
    setImages(e.target.files);
  };

  const handleRunImages = async () => {
    if (!images.length) return alert("Please select image files.");
    setLoading(true);
  
    const formData = new FormData();
    formData.append("file", images[0]); // ✅ only first file sent under `file`
  
    try {
      const res = await axios.post("http://127.0.0.1:8001/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResults(res.data);
    } catch (err) {
      console.error("Error from image API", err);
    } finally {
      setLoading(false);
    }
  };
  

  const handleRunUrl = async () => {
    if (!url) return alert("Please enter a URL.");
    setLoading(true);

    try {
      const res = await axios.post("http://127.0.0.1:8001/submit-url", { url });
      setResults(res.data);
    } catch (err) {
      console.error("Error from URL API", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunStory = async () => {
    if (!story) return alert("Please enter a user story.");
    setLoading(true);

    try {
      const res = await axios.post("/api/generate-from-story", { story });
      setResults(res.data);
    } catch (err) {
      console.error("Error from story API", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div
        style={{
          backgroundColor: "#F8F3F3",
          minHeight: "100vh",
          backgroundSize: "cover",
          width: "100vw",
          margin: 0,
          padding: 0,
        }}
      >
        <div className="row m-0 p-0">
          <div className="col-xl-4">
            <div
              className="card mt-5"
              style={{
                height: "80vh",
                margin: "20px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                border: "0px",
              }}
            >
              <div
                className="card-header"
                style={{ fontSize: "22px", fontFamily: "cambria" }}
              >
                Utilities
              </div>

              {/* Image Upload */}
              <div className="mt-5 ms-2">
                <label className="font-semibold block mb-2">Upload Images:</label>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} />
                <button
                  className="mt-2 ms-3 px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={handleRunImages}
                >
                  Run from Images
                </button>
              </div>

              {/* URL Input */}
              <div className="mt-5 ms-2">
                <label className="font-semibold block mb-2">Enter URL:</label>
                <input
                  type="url"
                  placeholder="Enter URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <button
                  className="mt-2 ms-3 px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={handleRunUrl}
                >
                  Run from URL
                </button>
              </div>

              {/* Story Input */}
              <div className="mt-5 ms-2">
                <label className="font-semibold block mb-2">Enter Story:</label>
                <textarea
                  placeholder="Enter Story"
                  value={story}
                  rows={3}
                  onChange={(e) => setStory(e.target.value)}
                  className="w-100"
                />
                <button
                  className="mt-2 ms-3 px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={handleRunStory}
                >
                  Run from Story
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="col-xl-8">
            <div
              className="card mt-5"
              style={{
                height: "80vh",
                margin: "20px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                border: "0px",
                overflow: "auto",
              }}
            >
              <div className="card-body">
                {loading ? (
                  <p>Generating test cases...</p>
                ) : results ? (
                  <pre>{JSON.stringify(results, null, 2)}</pre>
                ) : (
                  <p>No data yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FastApi;
