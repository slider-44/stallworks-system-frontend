import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ userName, password });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(circle at 15% 10%, #7a1414 0%, #4a0d0d 45%, #2c0808 100%)",
      }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8"
        style={{
          background: "#fff8ee",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          border: "1px solid rgba(255,255,255,0.4)",
        }}
      >
        <div className="flex flex-col items-center mb-7">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3.5"
            style={{
              background: "linear-gradient(135deg,#c62828,#8f1d1d)",
              boxShadow: "0 8px 20px rgba(198,40,40,0.35)",
            }}
          >
            <ChefHat size={28} className="text-white" strokeWidth={2.4} />
          </div>
          <p
            className="text-center leading-tight"
            style={{
              fontFamily: "'Caprasimo', serif",
              fontSize: 20,
              color: "#5c1010",
              maxWidth: 260,
            }}
          >
            Cylene&rsquo;s Takawyaki
          </p>
          <p
            className="text-xs font-semibold mt-2.5 uppercase"
            style={{ color: "#a34b2a", letterSpacing: "1.5px" }}
          >
            Staff Point of Sale
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs font-bold mb-1.5"
              style={{ color: "#8f1d1d" }}
            >
              Username
            </label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your username"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm"
              style={{
                border: "1.5px solid #eddcc9",
                background: "#fffefb",
                color: "#3a2318",
              }}
              onFocus={(e) =>
                (e.target.style.boxShadow = "0 0 0 3px rgba(198,40,40,0.18)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
          </div>

          <div>
            <label
              className="block text-xs font-bold mb-1.5"
              style={{ color: "#8f1d1d" }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm"
              style={{
                border: "1.5px solid #eddcc9",
                background: "#fffefb",
                color: "#3a2318",
              }}
              onFocus={(e) =>
                (e.target.style.boxShadow = "0 0 0 3px rgba(198,40,40,0.18)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
          </div>

          {error && (
            <div
              className="text-sm rounded-lg px-3 py-2"
              style={{
                color: "#8f1d1d",
                background: "#fbe4e2",
                border: "1px solid #f2c2be",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-full disabled:opacity-60 mt-1.5"
            style={{
              background: "linear-gradient(135deg,#d0342c,#8f1d1d)",
              color: "#fff",
              boxShadow: "0 8px 18px rgba(143,29,29,0.4)",
              border: "none",
            }}
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            Log In
          </button>
        </form>

        <p
          className="text-center text-[11.5px] mt-6"
          style={{ color: "#b98a6d" }}
        >
          Evergreen Executive Village, Bagumbong, Caloocan City
        </p>
      </div>
    </div>
  );
}
