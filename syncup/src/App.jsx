
import { useEffect, useState } from "react";
import "./index.css";
import BackgroundLayer from "./components/BackgroundLayer";
import BackgroundUploadButton from "./components/BackgroundUploadButton";
import ChatbotPanel from "./components/ChatbotPanel";
import NavBar from "./components/NavBar";
import WelcomeMessage from "./components/WelcomeMessage";
import ChecklistPage from "./components/ChecklistPage";
import {
  BACKGROUND_STORAGE_KEY,
  DEFAULT_BACKGROUND_SRC,
  HOME_ROUTES,
  LOGIN_KEY,
  SESSION_KEY,
  USERNAME_KEY,
  normalizeRoute,
  routeExists,
  sanitizeBackgroundSource,
} from "./components/homePageUtils";

function App() {
  const [screen, setScreen] = useState(() => {
    return localStorage.getItem(LOGIN_KEY) === "true"
      ? "home"
      : "auth";
  });
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  function updateLoginField(event) {
    setLoginForm({
      ...loginForm,
      [event.target.name]: event.target.value,
    });
  }

  function updateRegisterField(event) {
    setRegisterForm({
      ...registerForm,
      [event.target.name]: event.target.value,
    });
  }

  function showLogin() {
    setMode("login");
    setError("");
    setNotice("");
  }

  function showRegister() {
    setMode("register");
    setError("");
    setNotice("");
  }

  // ============================================================
  // LOGIN
  // ============================================================

  async function handleLogin(event) {
    event.preventDefault();

    setError("");
    setNotice("");

    if (!loginForm.email || !loginForm.password) {
      setError("Please complete all fields.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            email: loginForm.email,
            password: loginForm.password,
          }),
        }
      );

      const message = await response.text();

      const backendErrors = [
        "Email cannot be empty",
        "Invalid email format",
        "Password cannot be empty",
        "Password must be at least 8 characters",
        "Email not found",
        "Incorrect password",
        "Database error",
      ];

      if (
        !response.ok ||
        backendErrors.some((err) => message.includes(err))
      ) {
        setError(message);
        return;
      }

      if (message.startsWith("Login successful. Session ID: ")) {
        const sessionPrefix = "Login successful. Session ID: ";
        const usernameMarker = ". Username: ";

        const sessionStart = sessionPrefix.length;
        const usernamePosition = message.indexOf(usernameMarker);

        if (usernamePosition === -1) {
          setError("Login response was not in the expected format.");
          return;
        }

        const sessionId = message.substring(
          sessionStart,
          usernamePosition
        );

        const username = message.substring(
          usernamePosition + usernameMarker.length
        );

        localStorage.setItem(SESSION_KEY, sessionId);
        localStorage.setItem(USERNAME_KEY, username);

        setPendingEmail(loginForm.email);
        setScreen("two-factor");
      } else {
        setError(message);
      }
      } catch (error) {
      console.error("Login request failed:", error);
      setError("Could not connect to the Sync Up server.");
    }
  }

  // ============================================================
  // REGISTRATION
  // Only ONE request is sent to Spring Boot.
  // ============================================================

  async function handleRegistration(event) {
    event.preventDefault();

    if (isRegistering) {
      return;
    }

    setError("");
    setNotice("");

    const {
      username,
      email,
      password,
      confirmPassword,
    } = registerForm;

    if (!username || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsRegistering(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            username,
            email,
            password,
          }),
        }
      );

      const message = await response.text();

      if (
        !response.ok ||
        message !== "User registered successfully"
      ) {
        setError(message || "Registration failed.");
        return;
      }

      setLoginForm({
        email,
        password: "",
      });

      setRegisterForm({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setMode("login");

      setNotice(
        "Your account was created. Sign in to continue to 2-factor authentication."
      );
    } catch (error) {
      console.error("Registration request failed:", error);
      setError("Could not connect to the Sync Up server.");
    } finally {
      setIsRegistering(false);
    }
  }

  // ============================================================
  // TWO-FACTOR AUTHENTICATION
  // Demo behavior: any six-digit code is accepted.
  // ============================================================

  function handleTwoFactorSubmit(event) {
    event.preventDefault();

    setError("");

    if (!twoFactorCode) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    if (!/^\d{6}$/.test(twoFactorCode)) {
      setError("The verification code must contain exactly 6 digits.");
      return;
    }

    localStorage.setItem(LOGIN_KEY, "true");
    setScreen("home");
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  async function handleLogout() {
    setError("");

    const sessionId = localStorage.getItem(SESSION_KEY);

    if (!sessionId) {
      setError("No active session was found.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/logout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            sessionId,
          }),
        }
      );

      const message = await response.text();

      if (message === "Logout successful") {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(LOGIN_KEY);
        localStorage.removeItem(USERNAME_KEY);

        setScreen("auth");
        setMode("login");
        setTwoFactorCode("");

        setLoginForm({
          email: "",
          password: "",
        });

        setNotice("You have been signed out.");
      } else {
        setError(message);
      }
    } catch (error) {
      console.error("Logout request failed:", error);
      setError("Could not connect to the Sync Up server.");
    }
  }

  // ============================================================
  // HOME SCREEN
  // ============================================================

  if (screen === "home") {
    return <HomePage onLogout={handleLogout} />;
  }

  // ============================================================
  // TWO-FACTOR SCREEN
  // ============================================================

  if (screen === "two-factor") {
    return (
      <TwoFactorPage
        email={pendingEmail}
        code={twoFactorCode}
        setCode={setTwoFactorCode}
        error={error}
        onSubmit={handleTwoFactorSubmit}
        onBack={() => {
          setScreen("auth");
          setError("");
        }}
      />
    );
  }

  // ============================================================
  // LOGIN / REGISTRATION SCREEN
  // ============================================================

  return (
    <main className="auth-layout">
      <section className="brand-panel">
        <div className="brand-mark">S</div>

        <p className="eyebrow">SYNC UP SYSTEM</p>

        <h1>
          Stay connected with the people and work that matter.
        </h1>

        <p className="brand-description">
          Securely access your Sync Up account and keep everything
          organized in one calm, collaborative space.
        </p>

        <div className="brand-stat-row">
          <div>
            <strong>2FA</strong>
            <span>Protected access</span>
          </div>

          <div>
            <strong>24/7</strong>
            <span>Connected workspace</span>
          </div>
        </div>
      </section>

      <section className="form-panel">
        <div className="form-card">
          <div className="mobile-brand">
            <div className="brand-mark small">S</div>
            <span>Sync Up</span>
          </div>

          <div className="form-heading">
            <p className="eyebrow">WELCOME!</p>

            <h2>
              {mode === "login"
                ? "Sign in to Sync Up"
                : "Create your account"}
            </h2>

            <p>
              {mode === "login"
                ? "Enter your details to continue."
                : "Set up your account to get started."}
            </p>
          </div>

          <div className="mode-switcher">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={showLogin}
              type="button"
            >
              Sign in
            </button>

            <button
              className={mode === "register" ? "active" : ""}
              onClick={showRegister}
              type="button"
            >
              Sign up
            </button>
          </div>

          {error && <div className="message error">{error}</div>}

          {notice && <div className="message success">{notice}</div>}

          {mode === "login" ? (
            <form onSubmit={handleLogin}>
              <label htmlFor="login-email">Email address</label>

              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={loginForm.email}
                onChange={updateLoginField}
                autoComplete="email"
              />

              <div className="label-row">
                <label htmlFor="login-password">Password</label>
              </div>

              <input
                id="login-password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={loginForm.password}
                onChange={updateLoginField}
                autoComplete="current-password"
              />

              <button className="primary-button" type="submit">
                Continue to verification
                <span>→</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegistration}>
              <label htmlFor="register-username">Username</label>

              <input
                id="register-username"
                name="username"
                type="text"
                placeholder="Your name"
                value={registerForm.username}
                onChange={updateRegisterField}
                autoComplete="username"
              />

              <label htmlFor="register-email">Email address</label>

              <input
                id="register-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={registerForm.email}
                onChange={updateRegisterField}
                autoComplete="email"
              />

              <label htmlFor="register-password">Password</label>

              <input
                id="register-password"
                name="password"
                type="password"
                placeholder="At least 8 characters"
                value={registerForm.password}
                onChange={updateRegisterField}
                autoComplete="new-password"
              />

              <label htmlFor="register-confirm-password">
                Confirm password
              </label>

              <input
                id="register-confirm-password"
                name="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={registerForm.confirmPassword}
                onChange={updateRegisterField}
                autoComplete="new-password"
              />

              <button
                className="primary-button"
                type="submit"
                disabled={isRegistering}
              >
                {isRegistering
                  ? "Creating account..."
                  : "Create account"}
                <span>→</span>
              </button>
            </form>
          )}

          <p className="security-note">
            <span>✦</span>
            Your account is protected with two-factor authentication.
          </p>
        </div>
      </section>
    </main>
  );
}

// ============================================================
// TWO-FACTOR PAGE
// ============================================================

function TwoFactorPage({
  email,
  code,
  setCode,
  error,
  onSubmit,
  onBack,
}) {
  return (
    <main className="centered-layout">
      <section className="verification-card">
        <div className="verification-icon">✦</div>

        <p className="eyebrow">SECURITY CHECK</p>

        <h1>Verify your identity</h1>

        <p className="verification-description">
          Enter the 6-digit code sent to <strong>{email}</strong>.
        </p>

        {error && <div className="message error">{error}</div>}

        <form onSubmit={onSubmit}>
          <label htmlFor="two-factor-code">Verification code</label>

          <input
            id="two-factor-code"
            className="code-input"
            type="text"
            inputMode="numeric"
            maxLength="6"
            placeholder="000000"
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, ""))
            }
          />

          <button className="primary-button" type="submit">
            Verify and continue
            <span>→</span>
          </button>
        </form>

        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back to sign in
        </button>

        <p className="demo-hint">
          Demo: enter any 6-digit code, such as <strong>123456</strong>.
        </p>
      </section>
    </main>
  );
}

// ============================================================
// HOME PAGE
// ============================================================

function HomePage({ onLogout }) {
  const [activePath, setActivePath] = useState(() => {
    const startingPath = normalizeRoute(window.location.pathname);

    return routeExists(startingPath) ? startingPath : "/";
  });

  const [backgroundSrc, setBackgroundSrc] = useState(() => {
    return sanitizeBackgroundSource(
      localStorage.getItem(BACKGROUND_STORAGE_KEY) ||
        DEFAULT_BACKGROUND_SRC
    );
  });

  useEffect(() => {
    if (!routeExists(normalizeRoute(window.location.pathname))) {
      window.history.replaceState({}, "", "/");
    }

    function handlePopState() {
      const nextPath = normalizeRoute(window.location.pathname);

      if (routeExists(nextPath)) {
        setActivePath(nextPath);
      } else {
        window.history.replaceState({}, "", "/");
        setActivePath("/");
      }
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  function navigateTo(path) {
    if (path === activePath || !routeExists(path)) {
      return;
    }

    window.history.pushState({}, "", path);
    setActivePath(path);
  }

  function updateBackground(source, options = { persist: true }) {
    const safeSource = sanitizeBackgroundSource(source);
    setBackgroundSrc(safeSource);

    if (options.persist) {
      localStorage.setItem(BACKGROUND_STORAGE_KEY, safeSource);
    }
  }

    function renderPage() {
      if (activePath === "/") {
        return <WelcomeMessage />;
      }

      if (activePath === "/checklist") {
        return <ChecklistPage />;
      }

      return <PlaceholderPage route={activePath} onNavigate={navigateTo} />;
    }

  return (
    <div className="home-app-shell">
      <BackgroundLayer backgroundSrc={backgroundSrc} />

      <div className="home-app-content">
        <NavBar
          activePath={activePath}
          onNavigate={navigateTo}
          onLogout={onLogout}
        />

        <main className="home-main-content">
          {renderPage()}
        </main>

        <BackgroundUploadButton onBackgroundChange={updateBackground} />

        <ChatbotPanel onSetBackground={updateBackground} />
      </div>
    </div>
  );
}



function PlaceholderPage({ route, onNavigate }) {
  const routeInfo = HOME_ROUTES.find(
    (item) => item.path === route
  );

  const routeTitle = routeInfo?.label || "Page";

  return (
    <section className="placeholder-page">
      <h1>{routeTitle}</h1>

      <p>This page is coming soon.</p>

      <button
        type="button"
        className="primary-button placeholder-home-button"
        onClick={() => onNavigate("/")}
      >
        Back to Home
      </button>
    </section>
  );
}

export default App;
