import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function Auth() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email_id: "",
    password: "",
  });


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };


  const handleSubmit = async (event) => {
    event.preventDefault();


    try{
        const response = await axios.post(
          "http://127.0.0.1:8000/auth/login",
          formData,
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        if(response.data.access_token){
            localStorage.setItem("access_token", response.data.access_token);
        }

        navigate("/dashboard");
    } catch (error) {
        toast.error(error.response?.data?.message || "Login failed", {
          position: "top-right",
        });
        console.log(error)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-linear-to-br from-blue-100 to-blue-300">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Login / Register
        </h2>

        {/* <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="John"
              required
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              required
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>
        </div> */}

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-1">
            Email
          </label>
          <input
            type="email"
            name="email_id"
            value={formData.email_id}
            onChange={handleChange}
            placeholder="example@email.com"
            required
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-semibold mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded-md font-semibold hover:bg-blue-600 transition"
        >
          Submit
        </button>

        <p className="text-center text-gray-500 text-sm mt-4">
          Already have an account?{" "}
          <span className="text-blue-600 hover:underline cursor-pointer">
            Login here
          </span>
        </p>
        <ToastContainer />
      </form>
    </div>
  );
}


export default Auth;