import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Download, Home, Users, Calendar } from "lucide-react";

const COLORS = ["#4f46e5", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

const HabitatDesigner = () => {
  const [shape, setShape] = useState("cylinder");
  const [width, setWidth] = useState(6);
  const [height, setHeight] = useState(8);
  const [crew, setCrew] = useState(4);
  const [days, setDays] = useState(180);
  const [zones, setZones] = useState([]);

  const addZone = () => {
    setZones([
      ...zones,
      { id: zones.length + 1, name: `Zone ${zones.length + 1}`, area: 5 },
    ]);
  };

  const totalArea = zones.reduce((sum, z) => sum + z.area, 0);
  const volume =
    shape === "cylinder"
      ? Math.PI * Math.pow(width / 2, 2) * height
      : width * width * height;

  const exportJSON = () => {
    const data = {
      shape,
      dimensions: { width, height },
      crew,
      days,
      zones,
      totalArea,
      volume,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "habitat_layout.json";
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center text-indigo-400 mb-8">
        🚀 Habitat Designer
      </h1>

      <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {/* Left Panel */}
        <div className="space-y-6">
          {/* Habitat Config */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-5">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-indigo-400" />
              Habitat Configuration
            </h2>
            <div className="space-y-3">
              <label className="block">
                Shape:
                <select
                  value={shape}
                  onChange={(e) => setShape(e.target.value)}
                  className="ml-2 bg-gray-700 rounded px-2 py-1"
                >
                  <option value="cylinder">Cylinder</option>
                  <option value="cube">Cube</option>
                </select>
              </label>
              <label className="block">
                Width (m):
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(+e.target.value)}
                  className="ml-2 bg-gray-700 rounded px-2 py-1 w-20"
                />
              </label>
              <label className="block">
                Height (m):
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(+e.target.value)}
                  className="ml-2 bg-gray-700 rounded px-2 py-1 w-20"
                />
              </label>
              <label className="block flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Crew Size:
                <input
                  type="number"
                  value={crew}
                  onChange={(e) => setCrew(+e.target.value)}
                  className="ml-2 bg-gray-700 rounded px-2 py-1 w-20"
                />
              </label>
              <label className="block flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-400" />
                Mission Days:
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(+e.target.value)}
                  className="ml-2 bg-gray-700 rounded px-2 py-1 w-20"
                />
              </label>
            </div>
          </div>

          {/* Zones */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-5">
            <h2 className="text-xl font-semibold mb-4">Zones</h2>
            <button
              onClick={addZone}
              className="flex items-center gap-2 bg-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Zone
            </button>
            <ul className="mt-4 space-y-2">
              {zones.map((zone, i) => (
                <li
                  key={zone.id}
                  className="bg-gray-700 rounded px-3 py-2 flex justify-between items-center"
                >
                  <input
                    type="text"
                    value={zone.name}
                    onChange={(e) => {
                      const updated = [...zones];
                      updated[i].name = e.target.value;
                      setZones(updated);
                    }}
                    className="bg-transparent outline-none"
                  />
                  <input
                    type="number"
                    value={zone.area}
                    onChange={(e) => {
                      const updated = [...zones];
                      updated[i].area = +e.target.value;
                      setZones(updated);
                    }}
                    className="bg-gray-600 rounded px-2 py-1 w-20"
                  />
                  <span className="text-sm">m²</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-5 space-y-6">
          <h2 className="text-xl font-semibold mb-2">Analysis</h2>
          <p>
            <strong>Volume:</strong> {volume.toFixed(2)} m³
          </p>
          <p>
            <strong>Total Zone Area:</strong> {totalArea} m²
          </p>
          <p>
            <strong>Per Crew Area:</strong> {(totalArea / crew).toFixed(2)} m²
          </p>

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={zones}
                  dataKey="area"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {zones.map((_, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={COLORS[idx % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Export */}
          <button
            onClick={exportJSON}
            className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>
    </div>
  );
};

export default HabitatDesigner;
