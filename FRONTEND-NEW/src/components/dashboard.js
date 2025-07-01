import React from "react";

const Dashboard = () => {
  return (
    <div>
        <div
        style={{
            display: "flex",
            flexWrap: "wrap", 
            gap: "2rem",
            padding: "2.5rem",
            justifyContent:"center"
        }}
        >
        <div
            style={{
            backgroundColor: "#fff",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.06)",
            padding: "1.8rem 2.1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "300px"
            }}
        >
            <div>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#555" , fontWeight:"500" }}> My Projects</h2>
            <p style={{ margin: 0, fontSize: "30px", fontWeight: "bold", color: "black" }}>2</p>
            </div>
            <i
            className="fa-regular fa-folder"
            style={{
                fontSize: "35px",
                color: "#5b4bea",
                padding: "1rem",
                borderRadius: "50%"
            }}
            ></i>
        </div>

        <div
            style={{
            backgroundColor: "#fff",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.06)",
            padding: "1.8rem 2.1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "300px"
            }}
        >
            <div>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#555" , fontWeight:"500" }}> Test Cases </h2>
            <p style={{ margin: 0, fontSize: "30px", fontWeight: "bold", color: "black" }}> 68 </p>
            </div>
            <i
            className="fa-regular fa-file"
            style={{
                fontSize: "35px",
                color: "#5b4bea",
                padding: "1rem",
                borderRadius: "50%"
            }}
            ></i>
        </div>

        <div
            style={{
            backgroundColor: "#fff",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.06)",
            padding: "1.8rem 2.1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "300px"
            }}
        >
            <div>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#555" , fontWeight:"500"}}> Active Projects</h2>
            <p style={{ margin: 0, fontSize: "30px", fontWeight: "bold", color: "black" }}> 1 </p>
            </div>
            <i
            className="fa-solid fa-play"
            style={{
                fontSize: "35px",
                color: "#5b4bea",
                padding: "1rem",
                borderRadius: "50%"
            }}
            ></i>
        </div>

        <div
            style={{
            backgroundColor: "#fff",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.06)",
            padding: "1.8rem 2.1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "300px"
            }}
        >
            <div>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#555" , fontWeight:"500" }}> Frameworks </h2>
            <p style={{ margin: 0, fontSize: "30px", fontWeight: "bold", color: "black" }}> 3 </p>
            </div>
            <i
            className="fa-solid fa-code"
            style={{
                fontSize: "35px",
                color: "#5b4bea",
                padding: "1rem",
                borderRadius: "50%"
            }}
            ></i>
        </div>

        </div>

        <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "2rem 10rem"
        }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight:"500" }}>Recent Projects</h1>
            <button style={{
                padding: "1rem 1rem",
                backgroundColor: "white",
                color: "black",
                border: "none",
                borderRadius: "5px",
                fontSize: "18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
            }}>
                View All Projects <i className="fa-solid fa-circle-chevron-down"></i>
            </button>
        </div>

      <div 
        style={{
            display: "flex",
            flexWrap: "wrap", 
            gap: "2rem",
            padding: "1rem",
            justifyContent: "flex-start",
            fontFamily: "sans-serif"
        }}
        >
        <div
            style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
            padding: "2rem",
            width: "420px",
            marginLeft: "8rem"
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "22px", color: "#000", fontWeight: "600", margin: 0 }}>E-commerce App</h2>
            <span style={{
                backgroundColor: "#000",
                color: "#fff",
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: "13px",
                fontWeight: "500"
            }}>active</span>
            </div>

            <p style={{ fontSize: "17px", color: "#555", marginTop: "6px", marginBottom: "24px" }}>
            Mobile app automation testing
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "16px", color: "#333" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#555" }}>Test Cases</span>
                <strong style={{ color: "#000" }}>45</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#555" }}>Framework</span>
                <strong style={{ color: "#000" }}>Appium</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#555" }}>Last Updated</span>
                <strong style={{ color: "#000" }}>2 hours ago</strong>
            </div>
            </div>

            <hr style={{ margin: "24px 0", borderColor: "#eee" }} />

            <div style={{ display: "flex", gap: "12px" }}>
            <button style={{
                flex: 1,
                padding: "12px",
                fontSize: "15px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                backgroundColor: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
            }}>
                <i className="fa-solid fa-gear"></i> Configure
            </button>

            <button style={{
                flex: 1,
                padding: "12px",
                fontSize: "15px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(to right, #4e54c8, #8f94fb)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
            }}>
                <i className="fa-solid fa-play"></i> Execute
            </button>
            </div>
        </div>
        </div>


    </div>
  );
};

export default Dashboard;
