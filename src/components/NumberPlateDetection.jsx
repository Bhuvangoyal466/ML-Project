/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCarSide,
    faVideo,
    faUpload,
} from "@fortawesome/free-solid-svg-icons";

export default function NumberPlateDetection({ darkMode, bgImage }) {
    const [video, setVideo] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [savedPlates, setSavedPlates] = useState([]);

    useEffect(() => {
        fetchSavedPlates();
    }, []);

    const fetchSavedPlates = async () => {
        try {
            const response = await fetch(
                "http://127.0.0.1:5000/get_saved_plates"
            );
            const data = await response.json();
            setSavedPlates(data.plates);
        } catch (error) {
            console.error("Error fetching plates:", error);
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setVideo(file);
            setVideoUrl(URL.createObjectURL(file));
            setSavedPlates([]);
        }
    };

    const handleUpload = async () => {
        if (!video) return alert("Please upload a video first.");
        setLoading(true);

        const formData = new FormData();
        formData.append("video", video);

        try {
            await fetch("http://127.0.0.1:5000/upload_video", {
                method: "POST",
                body: formData,
            });
            alert("Video uploaded! Processing...");
            fetchSavedPlates();
        } catch (error) {
            console.error("Error uploading video:", error);
            alert("Failed to process video. Try again.");
        }

        setLoading(false);
    };

    return (
        <div className="relative flex justify-center items-center min-h-screen overflow-auto p-6">
            {/* ✅ Background Image Layer */}
            <div
                className="absolute inset-0 bg-cover bg-center h-full w-full"
                style={{ backgroundImage: `url(${bgImage})` }}
            ></div>
            <div className="absolute inset-0 bg-black opacity-50 h-full w-full"></div>

            {/* ✅ Main Content (Above the Background) */}
            <div className="relative z-10 text-center">
                <h1 className="text-3xl font-bold text-white mb-6">
                    <FontAwesomeIcon
                        icon={faCarSide}
                        className="text-white mr-2"
                    />
                    Number Plate Detection
                </h1>

                <Card className="p-6 w-full max-w-lg shadow-2xl rounded-xl bg-[#f1faee] dark:bg-gray-800">
                    <CardContent className="flex flex-col items-center gap-4">
                        <label className="text-black border border-black rounded-sm cursor-pointer p-2 flex items-center gap-2">
                            <FontAwesomeIcon
                                icon={faVideo}
                                className="text-[#000]"
                            />
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleFileChange}
                                hidden
                            />
                            Upload Video
                        </label>

                        {videoUrl && (
                            <video
                                src={videoUrl}
                                controls
                                className="w-full rounded-lg shadow-md border"
                            />
                        )}

                        <Button
                            onClick={handleUpload}
                            className="w-full bg-[#ef233c] text-white py-2 rounded-lg hover:bg-[#d90429]"
                        >
                            <FontAwesomeIcon icon={faUpload} />
                            {loading ? "Processing..." : "Upload Video"}
                        </Button>

                        {/* ✅ Added Bullet Points for 'S' and 'Q' Instructions */}
                        <div className="text-gray-700 text-left mt-2">
                            <p>
                                <strong>Instructions:</strong>
                            </p>
                            <ul className="list-disc list-inside mt-1">
                                <li>
                                    Press <strong>'S'</strong> to capture the
                                    number plate from the current frame.
                                </li>
                                <li>
                                    Press <strong>'Q'</strong> to terminate the
                                    program.
                                </li>
                            </ul>
                        </div>

                        {savedPlates.length > 0 && (
                            <div className="mt-4 w-full">
                                <h2 className="text-lg font-semibold text-[#2b2d42] text-center dark:text-white">
                                    Detected Plates
                                </h2>
                                <div className="flex flex-wrap gap-4 justify-center mt-2">
                                    {savedPlates.map((plate, index) => (
                                        <div
                                            key={index}
                                            className="text-center"
                                        >
                                            <img
                                                src={`http://127.0.0.1:5000/plates/${plate}`}
                                                alt={`Plate ${index}`}
                                                className="w-40 h-20 object-cover rounded-lg shadow-md border"
                                            />
                                            <a
                                                href={`http://127.0.0.1:5000/plates/${plate}`}
                                                download
                                                className="block mt-2 text-blue-500 underline"
                                            >
                                                Download
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
