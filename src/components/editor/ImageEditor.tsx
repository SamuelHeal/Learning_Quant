"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageContent } from "@/types";
import { FiUpload } from "react-icons/fi";

interface ImageEditorProps {
  content: ImageContent;
  onUpdate: (updatedContent: Partial<ImageContent>) => void;
}

export default function ImageEditor({ content, onUpdate }: ImageEditorProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (field: keyof ImageContent, value: string) => {
    onUpdate({ [field]: value } as Partial<ImageContent>);
  };

  // This is a placeholder for image upload functionality
  // In a real app, you would implement file upload to your backend/storage
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // This is just a simulation for demonstration purposes
    // Normally, you would upload the file to a server and get back a URL
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        // In a real application, replace this with your actual upload logic
        // and use the returned URL from your server
        onUpdate({ src: event.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-bold">Image URL</label>
            <input
              type="text"
              value={content.src}
              onChange={(e) => handleChange("src", e.target.value)}
              className="brutalist-border w-full p-2"
              placeholder="https://example.com/image.jpg"
            />
            <div className="text-sm mt-1">Or upload an image:</div>
            <label className="brutalist-button inline-flex items-center gap-1 mt-1 cursor-pointer">
              <FiUpload /> Select Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block mb-1 font-bold">Alt Text</label>
            <input
              type="text"
              value={content.alt}
              onChange={(e) => handleChange("alt", e.target.value)}
              className="brutalist-border w-full p-2"
              placeholder="Descriptive text for the image"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold">Caption (optional)</label>
            <input
              type="text"
              value={content.caption || ""}
              onChange={(e) => handleChange("caption", e.target.value)}
              className="brutalist-border w-full p-2"
              placeholder="Image caption text"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setIsEditing(false)}
              className="brutalist-button"
            >
              Done Editing
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="brutalist-box p-4 mb-4">
            <div className="relative aspect-video">
              <Image
                src={content.src}
                alt={content.alt}
                fill
                className="object-cover"
              />
            </div>
            {content.caption && (
              <div className="mt-2 text-sm text-center">{content.caption}</div>
            )}
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="brutalist-button"
          >
            Edit Image
          </button>
        </div>
      )}
    </div>
  );
}
