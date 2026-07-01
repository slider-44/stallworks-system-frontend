import React, { useState } from "react";
import {
  Users,
  ShoppingBag,
  Briefcase,
  Star,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const statCards = [
  { label: "Total Users", value: "277", icon: Users, from: "from-emerald-400", to: "to-emerald-600", trendUp: true },
  { label: "Total Users", value: "277", icon: ShoppingBag, from: "from-fuchsia-500", to: "to-purple-600", trendUp: true },
  { label: "Total Users", value: "277", icon: Briefcase, from: "from-sky-400", to: "to-blue-600", trendUp: false },
  { label: "Total Users", value: "277", icon: Star, from: "from-amber-400", to: "to-orange-500", trendUp: false },
];

const pieData = [
  { name: "2013", value: 25.9, color: "#60a5fa" },
  { name: "2014", value: 30.3, color: "#ef4444" },
  { name: "2015", value: 17.1, color: "#f97316" },
  { name: "2016", value: 26.7, color: "#16a34a" },
];

const products = [{ rating: 4.5 }, { rating: 4.0 }, { rating: 5.0 }, { rating: 5.0 }];

function StarRow({ filled }) {
  return (
    <div className="flex gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < filled ? "fill-amber-400 stroke-amber-400" : "stroke-slate-300"}
        />
      ))}
    </div>
  );
}

export default function DashboardHome() {
  const [showBy, setShowBy] = useState("None");
  const [categoryBy, setCategoryBy] = useState("None");

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {statCards.map((c, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-5 bg-gradient-to-br ${c.from} ${c.to} text-white shadow-lg shadow-slate-200 overflow-hidden`}
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-white/90">{c.label}</p>
                <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center">
                  <c.icon size={17} />
                </div>
              </div>
              <p className="text-4xl font-bold mt-2">{c.value}</p>
              <div className="flex items-center justify-between mt-6">
                <span className="text-xs text-white/85">Last Month</span>
                <button className="text-white/80 hover:text-white">
                  <MoreVertical size={16} />
                </button>
              </div>
              <div className="absolute -bottom-3 right-4 text-white/30">
                {c.trendUp ? <TrendingUp size={40} /> : <TrendingDown size={40} />}
              </div>
            </div>
          ))}
        </div>

        {/* Total sales pie */}
        <div className="xl:col-span-2 rounded-2xl p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-white/85">Total Sales</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">$3,787,681.00</p>
              <p className="text-xs text-white/70 mt-1">$3,578.90 in last month</p>
            </div>
            <button className="text-white/80 hover:text-white">
              <MoreVertical size={16} />
            </button>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={0} outerRadius={62} stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 text-xs">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-white/85">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Best selling products */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-lg font-bold text-slate-800">Best Selling Products</h2>

        <div className="flex flex-col sm:flex-row gap-4 mt-5">
          <div>
            <label className="text-xs font-semibold tracking-wide text-slate-400">SHOW BY</label>
            <div className="relative mt-1">
              <select
                value={showBy}
                onChange={(e) => setShowBy(e.target.value)}
                className="appearance-none w-48 border border-slate-200 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option>None</option>
                <option>Top Rated</option>
                <option>Most Sold</option>
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold tracking-wide text-slate-400">CATEGORY BY</label>
            <div className="relative mt-1">
              <select
                value={categoryBy}
                onChange={(e) => setCategoryBy(e.target.value)}
                className="appearance-none w-48 border border-slate-200 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option>None</option>
                <option>Womens</option>
                <option>Mens</option>
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-lg">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-blue-700 text-white text-xs uppercase tracking-wide">
                <th className="text-left font-semibold py-3 px-3 rounded-l-lg">UID</th>
                <th className="text-left font-semibold py-3 px-3">Product</th>
                <th className="text-left font-semibold py-3 px-3">Category</th>
                <th className="text-left font-semibold py-3 px-3">Brand</th>
                <th className="text-left font-semibold py-3 px-3">Price</th>
                <th className="text-left font-semibold py-3 px-3">Stock</th>
                <th className="text-left font-semibold py-3 px-3">Rating</th>
                <th className="text-left font-semibold py-3 px-3">Order</th>
                <th className="text-left font-semibold py-3 px-3">Sales</th>
                <th className="text-left font-semibold py-3 px-3 rounded-r-lg">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i} className={`${i % 2 === 0 ? "bg-slate-50" : "bg-white"} border-b border-slate-100 last:border-0`}>
                  <td className="py-3 px-3 text-slate-500">#1</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-slate-200 shrink-0" />
                      <div>
                        <p className="font-medium text-slate-700 leading-tight">Tops and skirt set for …</p>
                        <p className="text-xs text-slate-400">Women's exclusive sum…</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500">womans</td>
                  <td className="py-3 px-3 text-slate-500">richman</td>
                  <td className="py-3 px-3">
                    <p className="text-slate-400 line-through text-xs">$21.00</p>
                    <p className="text-red-500 font-semibold">$21.00</p>
                  </td>
                  <td className="py-3 px-3">
                    <StarRow filled={Math.round(p.rating)} />
                  </td>
                  <td className="py-3 px-3 text-slate-500">4.9(16)</td>
                  <td className="py-3 px-3 text-slate-500">380</td>
                  <td className="py-3 px-3 text-slate-500">$38k</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <button className="w-7 h-7 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center hover:bg-purple-200">
                        <Eye size={14} />
                      </button>
                      <button className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200">
                        <Pencil size={14} />
                      </button>
                      <button className="w-7 h-7 rounded-md bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
