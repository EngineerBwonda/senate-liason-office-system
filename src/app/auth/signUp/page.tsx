// app/register/page.tsx
"use client";

import { useState, FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Eye,
  EyeOff,
  Loader2,
  User,
  ShieldCheck,
  FileText,
  Users,
  Calendar,
  MessageSquare,
  Lock as LockIcon,
  Briefcase,
  Phone,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";
import styles from "./style.module.css";

const supabase = createSupabaseClient();

// ============================================
// Registration Form Component
// ============================================
function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
     position: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (!agreeToTerms) {
      setError("Please agree to the terms and conditions");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/pages/dashboard`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
             position: formData.position,
          },
        },
      });

      if (signUpError) throw signUpError;

      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to register. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.successContainer}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={styles.successContent}
        >
          <CheckCircle className={styles.successIcon} size={64} />
          <h2 className={styles.successTitle}>Registration Submitted</h2>
          <p className={styles.successMessage}>
            Your account request has been submitted for approval. You will
            receive a confirmation email once your account is verified.
          </p>
          <p className={styles.successRedirect}>Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  //===========================================================================================================================

  return (
    <div className={styles.registerFormContainer}>
      <div className={styles.formHeader}>
        <h2 className={styles.registerTitle}>Create Account</h2>
        <p className={styles.registerSubtitle}>
          Request access to the Senate Liaison Office Management System. All
          registrations require verification.
        </p>
      </div>

      {error && (
        <motion.div
          className={styles.errorAlert}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle size={20} />
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className={styles.registerForm}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="fullName" className={styles.formLabel}>
              Full Name
            </label>
            <div className={styles.inputWrapper}>
              <User className={styles.inputIcon} size={20} />
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="Dr. Jane Kamau"
                required
                disabled={isLoading}
                aria-label="Full name"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>
              Email Address
            </label>
            <div className={styles.inputWrapper}>
              <Mail className={styles.inputIcon} size={20} />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="name@senate.go.ke"
                required
                disabled={isLoading}
                aria-label="Email address"
              />
            </div>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="phone" className={styles.formLabel}>
              Phone Number
            </label>
            <div className={styles.inputWrapper}>
              <Phone className={styles.inputIcon} size={20} />
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="+254 700 000 000"
                required
                disabled={isLoading}
                aria-label="Phone number"
              />
            </div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="position" className={styles.formLabel}>
            Position / Title
          </label>
          <div className={styles.inputWrapper}>
            <Briefcase className={styles.inputIcon} size={20} />
            <input
              id="position"
              type="text"
              value={formData.position}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="e.g., Senior Legislative Officer"
              required
              disabled={isLoading}
              aria-label="Position"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.formLabel}>
              Password
            </label>
            <div className={styles.inputWrapper}>
              <LockIcon className={styles.inputIcon} size={20} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="Min. 8 characters"
                required
                disabled={isLoading}
                aria-label="Password"
                minLength={8}
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

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.formLabel}>
              Confirm Password
            </label>
            <div className={styles.inputWrapper}>
              <LockIcon className={styles.inputIcon} size={20} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="Confirm your password"
                required
                disabled={isLoading}
                aria-label="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={styles.passwordToggle}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                tabIndex={0}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.formOptions}>
          <label className={styles.termsCheck}>
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              disabled={isLoading}
            />
            <span>
              I agree to the{" "}
              <a href="/terms" className={styles.termsLink}>
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className={styles.termsLink}>
                Privacy Policy
              </a>
            </span>
          </label>
        </div>

        <motion.button
          type="submit"
          className={styles.registerButton}
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <>
              <Loader2 className={styles.spinner} size={20} />
              Creating Account...
            </>
          ) : (
            "Request Access"
          )}
        </motion.button>
      </form>

      <div className={styles.divider}>
        <span>ALREADY HAVE AN ACCOUNT?</span>
      </div>

      <div className={styles.signinFooter}>
        <a href="/auth/login" className={styles.signinLink}>
          Sign In
        </a>
        <span className={styles.signinText}>to access your account</span>
      </div>

      <div className={styles.verificationNote}>
        <ShieldCheck size={16} />
        <span>All registrations are verified for security purposes</span>
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
export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
