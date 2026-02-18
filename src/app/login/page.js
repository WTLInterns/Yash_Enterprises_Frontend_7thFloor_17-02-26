"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { gsap } from "gsap";

import { backendApi } from "@/services/api";
import { registerWebFcmToken } from "@/lib/web_push";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Organization options
  const organizations = [
    "Yash Enterprises",
    "Tech Solutions Inc",
    "Global Systems Ltd",
    "Digital Innovations",
    "Smart Technologies",
    "Future Corp",
    "Innovation Labs",
    "Advanced Solutions"
  ];

  const loginFormRef = useRef(null);
  const hitRef = useRef(null);
  const dummyCordRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("auth_token");
    if (token) router.replace("/");
  }, [router]);

  useEffect(() => {
    console.log("Lamp useEffect starting...");
    
    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      const HIT = hitRef.current;
      const DUMMY_CORD = dummyCordRef.current;
      const LOGIN_FORM = loginFormRef.current;

      console.log("Elements found:", { 
        HIT: !!HIT, 
        DUMMY_CORD: !!DUMMY_CORD, 
        LOGIN_FORM: !!LOGIN_FORM 
      });

      if (!HIT || !DUMMY_CORD || !LOGIN_FORM) {
        console.log("Missing elements, retrying...");
        return;
      }

      console.log("Hit area made invisible (no red dot)");

      const ENDX = 124;
      const ENDY = 348;

      let startX = 0;
      let startY = 0;
      let isDragging = false;

      const handleMouseDown = (e) => {
        console.log("Mouse down on hit area");
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        e.preventDefault();
      };

      const handleMouseMove = (e) => {
        if (!isDragging) return;
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        console.log("Dragging to:", currentX, currentY);
        
        // Simple SVG line update
        DUMMY_CORD.setAttribute('x2', currentX);
        DUMMY_CORD.setAttribute('y2', Math.max(400, currentY));
      };

      const handleMouseUp = (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        const DISTX = Math.abs(e.clientX - startX);
        const DISTY = Math.abs(e.clientY - startY);
        const TRAVELLED = Math.sqrt(DISTX * DISTX + DISTY * DISTY);
        
        console.log("Drag distance:", TRAVELLED);

        // Reset cord
        DUMMY_CORD.setAttribute('x2', ENDX);
        DUMMY_CORD.setAttribute('y2', ENDY);
        
        // Toggle lamp if dragged enough
        if (TRAVELLED > 50) {
          const isOn = document.documentElement.style.getPropertyValue('--on') === '1';
          document.documentElement.style.setProperty('--on', isOn ? '0' : '1');
          
          if (!isOn) {
            LOGIN_FORM.classList.add("active");
          } else {
            LOGIN_FORM.classList.remove("active");
          }
          
          console.log("Lamp toggled");
        }
      };

      // Add event listeners
      HIT.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      console.log("Event listeners added successfully");

    }, 500); // Wait 500ms for DOM

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || !organization) {
      toast.error("Please fill email, password, and organization");
      return;
    }

    setLoading(true);
    try {
      const response = await backendApi.post("/auth/login", {
        login_type: "email",
        email: username, // Send as email field
        password: password,
        organization: organization,
      });

      console.log("Login response:", response);

      if (response?.message === "Login successful" && response?.token) {
        localStorage.setItem("auth_token", response.token);
        localStorage.setItem("user_role", response.user?.role || "user");
        localStorage.setItem("user_data", JSON.stringify(response.user));

        try {
          const employeeId = response.user?.id;
          if (employeeId != null) {
            await registerWebFcmToken({ employeeId });
          }
        } catch (_e) {
          console.warn('FCM web token registration failed:', _e);
        }

        toast.success("Login successful!");
        router.push("/");
      } else {
        toast.error("Invalid credentials");
      }
    } catch (err) {
      const message = err?.data?.message || err?.data?.error || err?.message || "Login Failed";
      toast.error(message);
      console.error("Login error:", err);
      console.error("Error data:", err?.data);
      console.error("Error status:", err?.status);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={2000} />

      <style jsx global>{`
        *,
        *:after,
        *:before {
          box-sizing: border-box;
        }

        :root {
          --on: 0;
          --cord: #242424;
          --shade: #171717;
          --feature: #454545;
          --tongue: #e74c3c;
          --base-top: #616161;
          --base-side: #424242;
          --post: #616161;
          --opening: #212121;
          --b-1: #424242;
          --b-2: #212121;
          --b-3: hsla(
            45,
            calc((0 + (var(--on, 0) * 0)) * 1%),
            calc((20 + (var(--on, 0) * 30)) * 1%),
            0.5
          );
          --b-4: hsla(
            45,
            calc((0 + (var(--on, 0) * 0)) * 1%),
            calc((20 + (var(--on, 0) * 30)) * 1%),
            0.25
          );
          --l-1: hsla(
            45,
            calc((0 + (var(--on, 0) * 20)) * 1%),
            calc((50 + (var(--on, 0) * 50)) * 1%),
            0.85
          );
          --l-2: hsla(
            45,
            calc((0 + (var(--on, 0) * 20)) * 1%),
            calc((50 + (var(--on, 0) * 50)) * 1%),
            0.85
          );
          --shade-hue: 320;
          --t-1: hsl(
            var(--shade-hue),
            calc((0 + (var(--on, 0) * 20)) * 1%),
            calc((30 + (var(--on, 0) * 60)) * 1%)
          );
          --t-2: hsl(
            var(--shade-hue),
            calc((0 + (var(--on, 0) * 20)) * 1%),
            calc((20 + (var(--on, 0) * 35)) * 1%)
          );
          --t-3: hsl(
            var(--shade-hue),
            calc((0 + (var(--on, 0) * 20)) * 1%),
            calc((10 + (var(--on, 0) * 20)) * 1%)
          );
          --glow-color: hsl(320, 40%, 45%);
          --glow-color-dark: hsl(320, 40%, 35%);
        }

        body {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #121921;
          margin: 0;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16vmin;
          flex-wrap: wrap;
          padding: 2rem;
        }

        .login-form {
          background: rgba(18, 25, 33, 0.9);
          padding: 3rem 2.5rem;
          border-radius: 20px;
          min-width: 320px;
          opacity: 0;
          transform: scale(0.8) translateY(20px);
          pointer-events: none;
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 2px solid transparent;
          box-shadow: 0 0 0px rgba(255, 255, 255, 0);
          position: relative;
          animation: edgeLightning 4s ease-in-out infinite;
        }

        @keyframes edgeLightning {
          0%, 100% {
            border-color: rgba(255, 255, 255, 0.2);
            box-shadow: 
              0 0 5px rgba(255, 255, 255, 0.1),
              inset 0 0 5px rgba(255, 255, 255, 0.05);
          }
          25% {
            border-color: rgba(255, 100, 100, 0.5);
            box-shadow: 
              0 0 20px rgba(255, 100, 100, 0.3),
              0 0 40px rgba(255, 100, 100, 0.2),
              inset 0 0 20px rgba(255, 100, 100, 0.1);
          }
          50% {
            border-color: rgba(100, 100, 255, 0.5);
            box-shadow: 
              0 0 20px rgba(100, 100, 255, 0.3),
              0 0 40px rgba(100, 100, 255, 0.2),
              inset 0 0 20px rgba(100, 100, 255, 0.1);
          }
          75% {
            border-color: rgba(255, 255, 100, 0.5);
            box-shadow: 
              0 0 20px rgba(255, 255, 100, 0.3),
              0 0 40px rgba(255, 255, 100, 0.2),
              inset 0 0 20px rgba(255, 255, 100, 0.1);
          }
        }

        .login-form.active {
          opacity: 1;
          transform: scale(1) translateY(0);
          pointer-events: all;
          animation: edgeLightningActive 2s ease-in-out infinite;
        }

        @keyframes edgeLightningActive {
          0%, 100% {
            border-color: var(--glow-color);
            box-shadow: 
              0 0 20px var(--glow-color),
              0 0 40px var(--glow-color),
              inset 0 0 20px var(--glow-color);
          }
          50% {
            border-color: rgba(255, 255, 255, 0.8);
            box-shadow: 
              0 0 30px rgba(255, 255, 255, 0.5),
              0 0 60px rgba(255, 255, 255, 0.3),
              inset 0 0 30px rgba(255, 255, 255, 0.2);
          }
        }

        .login-form h2 {
          color: #fff;
          font-size: 2rem;
          margin: 0 0 2rem 0;
          text-align: center;
          text-shadow: 0 0 8px var(--glow-color);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          color: #aaa;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          text-shadow: 0 0 5px var(--glow-color);
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #fff;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-group select {
          cursor: pointer;
        }

        .form-group select option {
          background: #121921;
          color: #fff;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--glow-color);
          box-shadow: 0 0 10px var(--glow-color);
          background: rgba(255, 255, 255, 0.08);
        }

        .login-btn {
          width: 100%;
          padding: 0.875rem;
          background: linear-gradient(135deg, var(--glow-color), var(--glow-color-dark));
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .lamp {
          display: block;
          height: 40vmin;
          overflow: visible !important;
        }

        .cord {
          stroke: var(--cord);
        }

        .cord--rig {
          display: none;
        }

        .lamp__tongue {
          fill: var(--tongue);
        }

        .lamp__hit {
          cursor: pointer;
          opacity: 0;
        }

        .lamp__feature {
          fill: var(--feature);
        }

        .lamp__stroke {
          stroke: var(--feature);
        }

        .lamp__mouth,
        .lamp__light {
          opacity: var(--on, 0);
        }

        .shade__opening {
          fill: var(--opening);
        }

        .shade__opening-shade {
          opacity: calc(1 - var(--on, 0));
        }

        .post__body {
          fill: var(--post);
        }

        .base__top {
          fill: var(--base-top);
        }

        .base__side {
          fill: var(--base-side);
        }

        .top__body {
          fill: var(--t-3);
        }

        .password-wrap {
          position: relative;
        }

        .pass-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          cursor: pointer;
          color: #aaa;
        }
      `}</style>

      <div className="login-container">
        {/* FULL EXACT SVG (converted to JSX attribute names) */}
        <svg
          className="lamp"
          viewBox="0 0 333 484"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g className="lamp__shade shade">
            <ellipse className="shade__opening" cx="165" cy="220" rx="130" ry="20" />
            <ellipse
              className="shade__opening-shade"
              cx="165"
              cy="220"
              rx="130"
              ry="20"
              fill="url(#opening-shade)"
            />
          </g>

          <g className="lamp__base base">
            <path
              className="base__side"
              d="M165 464c44.183 0 80-8.954 80-20v-14h-22.869c-14.519-3.703-34.752-6-57.131-6-22.379 0-42.612 2.297-57.131 6H85v14c0 11.046 35.817 20 80 20z"
            />
            <path
              d="M165 464c44.183 0 80-8.954 80-20v-14h-22.869c-14.519-3.703-34.752-6-57.131-6-22.379 0-42.612 2.297-57.131 6H85v14c0 11.046 35.817 20 80 20z"
              fill="url(#side-shading)"
            />
            <ellipse className="base__top" cx="165" cy="430" rx="80" ry="20" />
            <ellipse cx="165" cy="430" rx="80" ry="20" fill="url(#base-shading)" />
          </g>

          <g className="lamp__post post">
            <path
              className="post__body"
              d="M180 142h-30v286c0 3.866 6.716 7 15 7 8.284 0 15-3.134 15-7V142z"
            />
            <path
              d="M180 142h-30v286c0 3.866 6.716 7 15 7 8.284 0 15-3.134 15-7V142z"
              fill="url(#post-shading)"
            />
          </g>

          <g className="lamp__cords cords">
            <path
              className="cord cord--rig"
              d="M124 187.033V347"
              stroke="var(--cord)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              className="cord cord--rig"
              d="M124 187.023s17.007 21.921 17.007 34.846c0 12.925-11.338 23.231-17.007 34.846-5.669 11.615-17.007 21.921-17.007 34.846 0 12.925 17.007 34.846 17.007 34.846"
              stroke="var(--cord)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              className="cord cord--rig"
              d="M124 187.017s-21.259 17.932-21.259 30.26c0 12.327 14.173 20.173 21.259 30.26 7.086 10.086 21.259 17.933 21.259 30.26 0 12.327-21.259 30.26-21.259 30.26"
              stroke="var(--cord)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              className="cord cord--rig"
              d="M124 187s29.763 8.644 29.763 20.735-19.842 13.823-29.763 20.734c-9.921 6.912-29.763 8.644-29.763 20.735S124 269.939 124 269.939"
              stroke="var(--cord)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              className="cord cord--rig"
              d="M124 187.029s-10.63 26.199-10.63 39.992c0 13.794 7.087 26.661 10.63 39.992 3.543 13.331 10.63 26.198 10.63 39.992 0 13.793-10.63 39.992-10.63 39.992"
              stroke="var(--cord)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              className="cord cord--rig"
              d="M124 187.033V347"
              stroke="var(--cord)"
              strokeWidth="6"
              strokeLinecap="round"
            />

            <line
              ref={dummyCordRef}
              className="cord cord--dummy"
              x1="124"
              y1="190"
              x2="124"
              y2="348"
              stroke="var(--cord)"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </g>

          <path
            className="lamp__light"
            d="M290.5 193H39L0 463.5c0 11.046 75.478 20 165.5 20s167-11.954 167-23l-42-267.5z"
            fill="url(#light)"
          />

          <g className="lamp__top top">
            <path
              className="top__body"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M164.859 0c55.229 0 100 8.954 100 20l29.859 199.06C291.529 208.451 234.609 200 164.859 200S38.189 208.451 35 219.06L64.859 20c0-11.046 44.772-20 100-20z"
            />
            <path
              className="top__shading"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M164.859 0c55.229 0 100 8.954 100 20l29.859 199.06C291.529 208.451 234.609 200 164.859 200S38.189 208.451 35 219.06L64.859 20c0-11.046 44.772-20 100-20z"
              fill="url(#top-shading)"
            />
          </g>

          <g className="lamp__face face">
            <g className="lamp__mouth">
              <path d="M165 178c19.882 0 36-16.118 36-36h-72c0 19.882 16.118 36 36 36z" fill="#141414" />
              <clipPath id="mouth">
                <path d="M165 178c19.882 0 36-16.118 36-36h-72c0 19.882 16.118 36 36 36z" />
              </clipPath>
              <g clipPath="url(#mouth)">
                <circle className="lamp__tongue" cx="179.4" cy="172.6" r="18" />
              </g>
            </g>

            <g className="lamp__eyes">
              <path
                className="lamp__eye lamp__stroke"
                d="M115 135c0-5.523-5.82-10-13-10s-13 4.477-13 10"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                className="lamp__eye lamp__stroke"
                d="M241 135c0-5.523-5.82-10-13-10s-13 4.477-13 10"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </g>
          </g>

          <defs>
            <linearGradient id="opening-shade" x1="35" y1="220" x2="295" y2="220" gradientUnits="userSpaceOnUse">
              <stop />
              <stop offset="1" stopColor="var(--shade)" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="base-shading" x1="85" y1="444" x2="245" y2="444" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--b-1)" />
              <stop offset="0.8" stopColor="var(--b-2)" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="side-shading" x1="119" y1="430" x2="245" y2="430" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--b-3)" />
              <stop offset="1" stopColor="var(--b-4)" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="post-shading" x1="150" y1="288" x2="180" y2="288" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--b-1)" />
              <stop offset="1" stopColor="var(--b-2)" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="light" x1="165.5" y1="218.5" x2="165.5" y2="483.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--l-1)" stopOpacity=".2" />
              <stop offset="1" stopColor="var(--l-2)" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="top-shading" x1="56" y1="110" x2="295" y2="110" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--t-1)" stopOpacity=".8" />
              <stop offset="1" stopColor="var(--t-2)" stopOpacity="0" />
            </linearGradient>
          </defs>

          <circle 
            ref={hitRef}
            className="lamp__hit" 
            cx="124" 
            cy="347" 
            r="66" 
            fill="#C4C4C4" 
            fillOpacity=".1" 
          />
        </svg>

        {/* LOGIN FORM */}
        <div ref={loginFormRef} className="login-form">
          <h2>Welcome Back</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Organization</label>
              <select value={organization} onChange={(e) => setOrganization(e.target.value)} required>
                <option value="">Select your organization</option>
                {organizations.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your email" required />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-wrap">
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
                <button type="button" className="pass-toggle" onClick={() => setShowPass((p) => !p)}>
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}