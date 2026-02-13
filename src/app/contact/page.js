"use client";
import { useState } from "react";
export default function Contact() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
  });

  function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("submit",formData);
    if(!validateEmail(formData.email)){
        alert("Please enter a valid email address.");
        return;
    }
    alert("Message sent successfully!");
    setFormData({
        fullName: "",
        email: "",
        message: "",
    })
  };
  return (
    <div className="flex flex-col min-h-screen justify-center items-center">
      <h1 className="text-4xl font-bold p-2">Contact Page</h1>
      <div className="flex flex-col gap-4 p-4 bg-gray-100 rounded-lg shadow-md">
        <form className="flex flex-col p-3 gap-4" onSubmit={handleSubmit}>
          <label htmlFor="name" className="text-2xl">
            Name
          </label>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            className="w-100 h-10 border-2 p-2 rounded-lg"
            value={formData.fullName}
            onChange={(e)=>{setFormData({...formData, fullName : e.target.value})}}
            required
          />
          <label htmlFor="email" className="text-2xl">
            Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            className="w-100 h-10 border-2 p-2  rounded-lg"
            value={formData.email}
            onChange={(e)=>{setFormData({...formData, email : e.target.value})}}
            required
          />
          <label htmlFor="message" className="text-2xl">
            Message
          </label>
          <textarea
            name="message"
            placeholder="Your Message"
            className="w-100 h-20 border-2 p-2  rounded-lg"
            value={formData.message}
            onChange={(e)=>{setFormData({...formData, message : e.target.value})}}
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
