"use client";

import { useState } from "react";
import Select from "react-select";
import { postCategories } from "@/constants/categories";

export default function CreatePostPopup({ isOpen, onClose, onSubmit }) {
  const [content, setContent] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

  const categoryOptions = postCategories.map(cat => ({
    value: cat,
    label: cat
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedCategories.length === 0) {
      alert("Please select at least one category");
      return;
    }
    
    const categoryTags = selectedCategories.map(cat => cat.value);
    onSubmit({ content, categoryTags });
    setContent("");
    setSelectedCategories([]);
  };

  if (!isOpen) return null;

  const customStyles = {
    control: (base) => ({
      ...base,
      borderRadius: '0.75rem',
      borderColor: '#d1d5db',
      padding: '0.125rem',
      '&:hover': {
        borderColor: '#6366f1'
      }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#e0e7ff',
      borderRadius: '9999px'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#3730a3',
      fontWeight: '500'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#6366f1',
      borderRadius: '9999px',
      '&:hover': {
        backgroundColor: '#c7d2fe',
        color: '#4338ca'
      }
    })
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-white/20">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Create Post</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full border border-gray-300 rounded-xl p-3 mb-4 min-h-32 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            required
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Categories <span className="text-red-500">*</span>
            </label>
            <Select
              isMulti
              options={categoryOptions}
              value={selectedCategories}
              onChange={setSelectedCategories}
              placeholder="Select categories..."
              styles={customStyles}
              className="text-gray-900"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() || selectedCategories.length === 0}
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
