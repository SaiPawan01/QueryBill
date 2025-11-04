import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../utils/api";

import { toast } from "react-toastify";



function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email_id: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    // Clear form when switching modes
    setFormData({
      first_name: "",
      last_name: "",
      email_id: "",
      password: "",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const payload = isLogin 
        ? { email_id: formData.email_id, password: formData.password }
        : formData;

      const response = isLogin 
        ? await authAPI.login(payload)
        : await authAPI.register(payload);

      if (isLogin) {
        if (response.data.access_token) {
          localStorage.setItem("access_token", response.data.access_token);
        }
        toast.success("Login successful!", {
          position: "top-right",
          autoClose: 1000,
        });
        navigate("/dashboard");
      } else {
        toast.success("Registration successful! Please login.", {
          position: "top-right",
        });
        setIsLogin(true);
        setFormData({
          first_name: "",
          last_name: "",
          email_id: "",
          password: "",
        });
      }
    } catch (error) {
      // Prefer backend-provided error detail fields. Fall back to generic messages.
      const backendDetail = error.response?.data?.detail || error.response?.data?.message || error.response?.data?.error;
      const errorMessage = backendDetail || (isLogin ? "Login failed. Please check your credentials." : "Registration failed. Please try again.");
      toast.error(errorMessage, { position: "top-right" });
      console.error("Auth error:", error?.response?.data ?? error.message ?? error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-linear-to-r from-blue-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
            QueryBill
          </h1>
          <div className="sm:block text-sm font-medium tracking-wide text-gray-600 dark:text-gray-300 mb-4">
            Smart extraction & Q&A
          </div>
          {/* <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            {isLogin ? "Welcome back! 👋" : "Create your account ✨"}
          </p> */}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 border dark:border-gray-700"
        >
          {/* <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800 dark:text-gray-100">
            {isLogin ? "Sign In" : "Sign Up"}
          </h2> */}

          {!isLogin && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email_id"
              value={formData.email_id}
              onChange={handleChange}
              placeholder="example@email.com"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            {isLogin ? "Sign In" : "Create Account"}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium focus:outline-none focus:underline"
                onClick={toggleMode}
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

      </div>
    </div>
  );
}


export default LoginPage;