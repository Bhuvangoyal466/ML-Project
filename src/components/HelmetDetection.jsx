/* eslint-disable no-unused-vars */
import { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

// ✅ Import FontAwesome and specific icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMotorcycle,
    faVideo,
    faImage,
    faUpload,
} from "@fortawesome/free-solid-svg-icons";

export default function HelmetDetection({ bgImage }) {
    const [image, setImage] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [outputImageUrl, setOutputImageUrl] = useState(null);
    const [helmetCount, setHelmetCount] = useState(0);
    const [noHelmetCount, setNoHelmetCount] = useState(0);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setImage(file);
        setImageUrl(URL.createObjectURL(file));
    };

    const handleUpload = async () => {
        if (!image) return alert("Please upload an image first.");

        const formData = new FormData();
        formData.append("image", image);

        const response = await fetch("http://127.0.0.1:5000/detect/helmet", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        setHelmetCount(data.with_helmet);
        setNoHelmetCount(data.without_helmet);
        setOutputImageUrl(`${data.output_image_url}?timestamp=${new Date().getTime()}`);

    };

    return (
        <div className="relative flex justify-center items-center min-h-screen overflow-auto p-6">
            {/* ✅ Background Image Layer */}
            <div
                className="absolute inset-0 bg-cover bg-center h-full w-full"
                style={{ backgroundImage: `url(${bgImage})` }}
            ></div>
            <div className="absolute inset-0 bg-black opacity-50 h-full w-full"></div>

            {/* ✅ Main Content (Text & UI are Above the Overlay) */}
            <div className="relative z-10 text-center">
                <h1 className="text-4xl font-bold text-white mb-6">
                    <FontAwesomeIcon
                        icon={faMotorcycle}
                        className="text-white mr-2"
                    />
                    Helmet Detection
                </h1>

                <Card className="p-6 w-full max-w-lg shadow-2xl rounded-xl bg-[#f1faee]">
                    <CardContent className="flex flex-col items-center gap-4">
                        <label className="text-black border border-black rounded-sm cursor-pointer p-2 flex items-center gap-2">
                            <FontAwesomeIcon
                                icon={faImage}
                                className="text-[#000]"
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                hidden
                            />
                            Upload Photo
                        </label>

                        {imageUrl && (
                            <img
                                src={imageUrl}
                                alt="Preview"
                                className="w-48 h-48 object-cover rounded-lg shadow-md mb-4"
                            />
                        )}

                        <Button
                            onClick={handleUpload}
                            className="bg-[#ef233c] text-white px-6 py-2 rounded-lg hover:bg-[#d90429] flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faUpload} />
                            Upload & Detect
                        </Button>

                        {outputImageUrl && (
                            <div className="mt-6 p-4 bg-white dark:bg-gray-700 shadow-md rounded-lg flex flex-col items-center">
                                <h2 className="text-lg font-semibold text-[#2b2d42] dark:text-white">
                                    Detection Result:
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300">
                                    With Helmet: {helmetCount}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Without Helmet: {noHelmetCount}
                                </p>
                                <img
                                    src={outputImageUrl}
                                    alt="Processed Output"
                                    className="mt-4 w-64 h-64 object-cover rounded-lg shadow-md"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
