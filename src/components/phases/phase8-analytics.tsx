
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

export default function Phase8Analytics({ onComplete }: Phase8Props) {
  const pieChartData = [
    { name: "Passed", value: MOCK_ANALYTICS.passedTestCases, color: "#22c55e" },
    { name: "Failed", value: MOCK_ANALYTICS.failedTestCases, color: "#ef4444" },
    { name: "Skipped", value: MOCK_ANALYTICS.skippedTestCases, color: "#f59e0b" }
  ];
  
  const successRate = MOCK_ANALYTICS.successRate;
  const rateGaugeRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Animate success rate gauge
    const timer = setTimeout(() => {
      if (rateGaugeRef.current) {
        rateGaugeRef.current.style.width = `${successRate}%`;
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [successRate]);

  const handleDownload = () => {
    toast.success("Analytics report downloaded successfully");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          View comprehensive insights about your test automation performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-lg p-4 flex flex-col">
          <h3 className="text-sm font-medium text-muted-foreground">Total Test Cases</h3>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-3xl font-bold">{MOCK_ANALYTICS.totalTestCases}</p>
            <span className="text-success text-sm">+12% ↑</span>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 flex flex-col">
          <h3 className="text-sm font-medium text-muted-foreground">Executed Tests</h3>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-3xl font-bold">{MOCK_ANALYTICS.executedTestCases}</p>
            <span className="text-destructive text-sm">-5% ↓</span>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 flex flex-col">
          <h3 className="text-sm font-medium text-muted-foreground">Execution Time</h3>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-3xl font-bold">{MOCK_ANALYTICS.executionTime}s</p>
            <span className="text-success text-sm">-10% ↓</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-6 flex flex-col">
          <h3 className="text-sm font-medium mb-4">Success Rate</h3>
          <div className="h-6 w-full bg-secondary rounded-full overflow-hidden">
            <div
              ref={rateGaugeRef}
              className="h-full transition-all duration-1000 ease-out"
              style={{ 
                width: "0%", 
                backgroundColor: successRate > 90 
                  ? "#22c55e" 
                  : successRate > 60 
                    ? "#f59e0b" 
                    : "#ef4444" 
              }}
            >
            </div>
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
                  labelLine={true}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-sm font-medium mb-4">Test Execution History</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={MOCK_ANALYTICS.testExecutionHistory}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="passed" stackId="a" name="Passed" fill="#22c55e" />
              <Bar dataKey="failed" stackId="a" name="Failed" fill="#ef4444" />
              <Bar dataKey="skipped" stackId="a" name="Skipped" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-sm font-medium mb-2">Top Failed Tests</h3>
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Login Functionality</span>
              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">Failed 5 times</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-destructive" style={{ width: "80%" }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Product Search</span>
              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">Failed 3 times</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-destructive" style={{ width: "60%" }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Checkout Process</span>
              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">Failed 2 times</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-destructive" style={{ width: "40%" }}></div>
            </div>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-sm font-medium mb-2">Performance Metrics</h3>
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Average Execution Time</span>
              <span className="text-sm font-medium">245s</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: "65%" }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Code Coverage</span>
              <span className="text-sm font-medium">78%</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: "78%" }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Bug Detection Rate</span>
              <span className="text-sm font-medium">92%</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: "92%" }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
        >
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Download Report</span>
          </div>
        </button>
        
        <button
          onClick={onComplete}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Finish
        </button>
      </div>
    </div>
  );
}
