import React, { useEffect, useRef } from "react";
import { toast } from "sonner";
import { MOCK_ANALYTICS } from "@/lib/constants";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie
} from "recharts";

interface Phase8Props {
  onComplete: () => void;
}

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export default function Phase8Analytics({ onComplete }: Phase8Props) {
  const pieChartData: PieChartData[] = [
    { name: "Passed", value: MOCK_ANALYTICS.passedTestCases, color: "#22c55e" },
    { name: "Failed", value: MOCK_ANALYTICS.failedTestCases, color: "#ef4444" },
    { name: "Skipped", value: MOCK_ANALYTICS.skippedTestCases, color: "#f59e0b" }
  ];

  const successRate = MOCK_ANALYTICS.successRate;
  const rateGaugeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (rateGaugeRef.current) {
        rateGaugeRef.current.style.width = `${successRate}%`;
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [successRate]);

  const handleDownload = () => {
    const reportData = JSON.stringify(MOCK_ANALYTICS, null, 2);
    const blob = new Blob([reportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics-report.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Analytics report downloaded as JSON file!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Analytics Dashboard</h2>
        <p className="text-muted-foreground">View insights about your test automation performance.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Test Cases", value: MOCK_ANALYTICS.totalTestCases, trend: "+12% ↑", color: "text-success" },
          { label: "Executed Tests", value: MOCK_ANALYTICS.executedTestCases, trend: "-5% ↓", color: "text-destructive" },
          { label: "Execution Time", value: `${MOCK_ANALYTICS.executionTime}s`, trend: "-10% ↓", color: "text-success" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-card border rounded-lg p-4 flex flex-col">
            <h3 className="text-sm font-medium text-muted-foreground">{stat.label}</h3>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-bold">{stat.value}</p>
              <span className={`${stat.color} text-sm`}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Success Gauge + Pie Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-6 flex flex-col">
          <h3 className="text-sm font-medium mb-4">Success Rate</h3>
          <div className="h-6 w-full bg-secondary rounded-full overflow-hidden">
            <div
              ref={rateGaugeRef}
              className="h-full transition-all duration-1000 ease-out"
              style={{
                width: "0%",
                backgroundColor: successRate > 90 ? "#22c55e" : successRate > 60 ? "#f59e0b" : "#ef4444"
              }}
            ></div>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-sm">0%</span>
            <span className="text-xl font-semibold">{successRate}%</span>
            <span className="text-sm">100%</span>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-sm font-medium mb-4">Test Results</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieChartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Execution History Chart */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-sm font-medium mb-4">Test Execution History</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_ANALYTICS.testExecutionHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="passed" stackId="a" fill="#22c55e" />
              <Bar dataKey="failed" stackId="a" fill="#ef4444" />
              <Bar dataKey="skipped" stackId="a" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Failures + Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-sm font-medium mb-2">Top Failed Tests</h3>
          <div className="space-y-4 mt-4">
            {[
              { label: "Login Functionality", fails: 5, width: "80%" },
              { label: "Product Search", fails: 3, width: "60%" },
              { label: "Checkout Process", fails: 2, width: "40%" }
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{item.label}</span>
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                    Failed {item.fails} times
                  </span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-destructive" style={{ width: item.width }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-sm font-medium mb-2">Performance Metrics</h3>
          <div className="space-y-4 mt-4">
            {[
              { label: "Average Execution Time", value: "245s", width: "65%" },
              { label: "Code Coverage", value: "78%", width: "78%" },
              { label: "Bug Detection Rate", value: "92%", width: "92%" }
            ].map((metric, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{metric.label}</span>
                  <span className="text-sm font-medium">{metric.value}</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: metric.width }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
        >
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download Report</span>
          </div>
        </button>
        <button
          onClick={onComplete}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Finish
        </button>
      </div>
    </div>
  );
}
