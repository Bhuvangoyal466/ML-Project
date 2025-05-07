/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

// ✅ Import FontAwesome and specific icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCarBurst,
    faVideo,
    faUpload,
    faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

export default function AccidentDetection({ bgImage }) {
    const [video, setVideo] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [accidentDetected, setAccidentDetected] = useState(false);
    const [totalAccidents, setTotalAccidents] = useState(0);
    const [accidentTimestamps, setAccidentTimestamps] = useState([]);

    // ✅ Fetch accident status periodically
    useEffect(() => {
        const interval = setInterval(fetchAccidentStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchAccidentStatus = async () => {
        try {
            const response = await fetch(
                "http://127.0.0.1:5000/get_accident_status"
            );
            const data = await response.json();
            setAccidentDetected(data.accident_detected);
            setTotalAccidents(data.total_accidents);
            setAccidentTimestamps(data.accident_timestamps);
        } catch (error) {
            console.error("Error fetching accident status:", error);
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setVideo(file);
            setVideoUrl(URL.createObjectURL(file));
            setAccidentDetected(false);
            setTotalAccidents(0);
            setAccidentTimestamps([]);
        }
    };

    // ✅ Upload Video Function
    const handleUpload = async () => {
        if (!video) return alert("Please upload a video first.");
        setLoading(true);

        const formData = new FormData();
        formData.append("video", video);

        try {
            const response = await fetch(
                "http://127.0.0.1:5000/upload_video_acc",
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (response.ok) {
                alert("Video uploaded! Processing...");
                fetchAccidentStatus();
            } else {
                alert("Failed to process video. Try again.");
            }
        } catch (error) {
            console.error("Error uploading video:", error);
            alert("Failed to upload. Check backend!");
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
                <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCarBurst} className="text-white" />
                    Accident Detection
                </h1>

                <Card className="p-6 w-full max-w-lg shadow-2xl rounded-xl bg-[#f1faee] dark:bg-gray-800">
                    <CardContent className="flex flex-col items-center gap-4">
                        {/* 📂 File Upload with Icon */}
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

                        {/* 🎥 Video Preview */}
                        {videoUrl && (
                            <video
                                src={videoUrl}
                                controls
                                className="w-full rounded-lg shadow-md border"
                            />
                        )}

                        {/* 🚀 Upload Button */}
                        <Button
                            onClick={handleUpload}
                            className="w-full bg-[#ef233c] text-white py-2 rounded-lg hover:bg-[#d90429] flex items-center gap-2"
                            disabled={loading} // ✅ Disables button while uploading
                        >
                            <FontAwesomeIcon icon={faUpload} />
                            {loading ? "Processing..." : "Upload Video"}
                        </Button>

                        {/* ⚠️ Accident Detection Status */}
                        <p
                            className={`text-lg font-bold flex items-center gap-2 ${
                                accidentDetected
                                    ? "text-red-600"
                                    : "text-green-600"
                            }`}
                        >
                            <FontAwesomeIcon
                                icon={
                                    accidentDetected
                                        ? faTriangleExclamation
                                        : faCarBurst
                                }
                            />
                            {accidentDetected
                                ? `Total Accidents: ${totalAccidents}`
                                : "No Accidents Detected"}
                        </p>

                        {/* 📌 Display Accident Timestamps */}
                        <div className="mt-4 w-full text-left">
                            <h2 className="text-lg font-semibold text-[#2b2d42] dark:text-white">
                                Accident Timestamps:
                            </h2>
                            <ul className="list-disc list-inside text-gray-800 dark:text-gray-300">
                                {accidentTimestamps.length > 0 ? (
                                    accidentTimestamps.map((time, i) => (
                                        <li key={i}>Accident at {time}s</li>
                                    ))
                                ) : (
                                    <li>No accidents recorded</li>
                                )}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
