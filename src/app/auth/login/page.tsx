// app/login/page.tsx
"use client";

import { useState, FormEvent, ReactNode, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  FileText,
  Users,
  Calendar,
  MessageSquare,
  Lock as LockIcon,
} from "lucide-react";
import { createClient as supabase } from "@/utils/supabase/client";
import styles from "./login.module.css";

// ============================================
// Google Login Button Component
// ============================================
function GoogleLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const supabaseClient = supabase();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/pages/dashboard`,
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      console.error(
        "Google sign-in error:",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleGoogleSignIn}
      className={styles.googleButton}
      disabled={isLoading}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <svg className={styles.googleIcon} viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      {isLoading ? "Signing in..." : "Continue with Google"}
    </motion.button>
  );
}

// ============================================
// Login Form Component
// ============================================
function LoginForm() {
  const router = useRouter();
  const supabaseClient = useMemo(() => supabase(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (user) {
        router.replace("/pages/dashboard");
      }
    };

    checkSession();
  }, [router, supabaseClient]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsLoading(true);

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push("/pages/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in.";

      if (message.toLowerCase().includes("invalid login credentials")) {
        setError(
          "Invalid email or password. If you just signed up, confirm your email first using the Supabase email link.",
        );
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setError(null);
    setNotice(null);

    if (!email.trim()) {
      setError("Enter your email first, then click Send Magic Link.");
      return;
    }

    setIsMagicLoading(true);

    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/pages/dashboard`,
        },
      });

      if (error) throw error;

      setNotice(
        "Magic link sent. Open your email and use the link to sign in.",
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send magic link. Please try again.",
      );
    } finally {
      setIsMagicLoading(false);
    }
  };

  return (
    <div className={styles.loginFormContainer}>
      <div className={styles.formHeader}>
        <h2 className={styles.welcomeTitle}>Welcome Back</h2>
        <p className={styles.welcomeSubtitle}>
          Sign in to continue to the Senate Liaison Office Management System.
        </p>
      </div>

      {error && (
        <motion.div
          className={styles.errorAlert}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      {notice && (
        <motion.div
          className={styles.successAlert}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {notice}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.formLabel}>
            Email Address
          </label>
          <div className={styles.inputWrapper}>
            <Mail className={styles.inputIcon} size={20} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.formInput}
              placeholder="name@gmail.com"
              required
              disabled={isLoading}
              aria-label="Email address"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.formLabel}>
            Password
          </label>
          <div className={styles.inputWrapper}>
            <LockIcon className={styles.inputIcon} size={20} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.formInput}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              aria-label="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.passwordToggle}
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={0}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className={styles.formOptions}>
          <label className={styles.rememberMe}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />
            <span>Remember Me</span>
          </label>
          {/* <a href="/forgot-password" className={styles.forgotLink}>
            Forgot Password?
          </a> */}
        </div>

        <motion.button
          type="submit"
          className={styles.loginButton}
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <>
              <Loader2 className={styles.spinner} size={20} />
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </motion.button>
      </form>

      <div className={styles.divider}>
        <span>OR CONTINUE WITH</span>
      </div>

      <motion.button
        type="button"
        className={styles.magicLinkButton}
        onClick={handleMagicLink}
        disabled={isMagicLoading || isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isMagicLoading ? "Sending magic link..." : "Send Magic Link"}
      </motion.button>

      <GoogleLoginButton />

      <div className={styles.signupFooter}>
        <span>Don&apos;t have an account?</span>
        {/* <a href="/request-access" className={styles.requestLink}>
          Request Access
        </a> */}
      </div>
    </div>
  );
}

// ============================================
// Auth Layout Component
// ============================================
function AuthLayout({ children }: { children: ReactNode }) {
  const features = [
    { icon: ShieldCheck, label: "Secure Document Management" },
    { icon: Users, label: "Real-time Collaboration" },
    { icon: FileText, label: "Committee Communication" },
    { icon: Calendar, label: "Meeting & Calendar Management" },
    { icon: MessageSquare, label: "Internal Messaging" },
    { icon: LockIcon, label: "Enterprise-level Security" },
  ];

  return (
    <div className={styles.authContainer}>
      {/* Decorative Background Elements */}
      <div className={styles.bgBlurCircle1} />
      <div className={styles.bgBlurCircle2} />
      <div className={styles.bgGrid} />

      <div className={styles.authWrapper}>
        {/* Left Branding Column */}
        <motion.div
          className={styles.brandingColumn}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className={styles.brandingContent}>
            <div className={styles.brandingHeader}>
              <h1 className={styles.mainTitle}>SENATE LIAISON OFFICE</h1>
              <p className={styles.subtitle}>
                Digital Office Management System
              </p>
            </div>

            <p className={styles.description}>
              Securely manage correspondence, committee reports, meeting
              minutes, office communications, delegates, internal collaboration,
              and official Senate documents from a single modern workspace.
            </p>

            <div className={styles.featuresGrid}>
              {features.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  className={styles.featureItem}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.4 }}
                >
                  <feature.icon className={styles.featureIcon} size={18} />
                  <span>{feature.label}</span>
                </motion.div>
              ))}
            </div>

            <div className={styles.brandingFooter}>
              <p>© 2026 Senate Liaison Office</p>
              <p className={styles.footerTagline}>
                Empowering secure digital governance.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Authentication Column */}
        <motion.div
          className={styles.authColumn}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        >
          <div className={styles.authCard}>{children}</div>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================
export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
