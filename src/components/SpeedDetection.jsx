import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUpload,
    faVideo,
    faTachometerAlt,
} from "@fortawesome/free-solid-svg-icons";

export default function SpeedDetection({ bgImage }) {
    // ✅ Define State Variables
    const [video, setVideo] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [vehicleSpeeds, setVehicleSpeeds] = useState({});

    useEffect(() => {
        fetchVehicleSpeeds();
    }, []);

    // ✅ Function to Fetch Vehicle Speeds
    const fetchVehicleSpeeds = async () => {
        try {
            const response = await fetch(
                "http://127.0.0.1:5000/get_vehicle_speeds"
            );
            const data = await response.json();
            setVehicleSpeeds(data);
        } catch (error) {
            console.error("Error fetching vehicle speeds:", error);
        }
    };

    // ✅ Function to Handle Video Upload
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setVideo(file);
            setVideoUrl(URL.createObjectURL(file));
            setVehicleSpeeds({});
        }
    };

    // ✅ Function to Handle Upload
    const handleUpload = async () => {
        if (!video) return alert("Please upload a video first.");
        setLoading(true);

        const formData = new FormData();
        formData.append("video", video);

        try {
            const response = await fetch(
                "http://127.0.0.1:5000/upload_video_speed",
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (response.ok) {
                alert("Video uploaded! Processing...");
                fetchVehicleSpeeds(); // ✅ Fetch speeds after upload
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
                <h1 className="text-3xl font-bold text-white mb-6">
                    <FontAwesomeIcon
                        icon={faTachometerAlt}
                        className="text-white mr-2"
                    />
                    Speed Detection System
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

                        {/* ✅ Corrected Upload Button */}
                        <Button
                            onClick={handleUpload}
                            className="w-full bg-[#ef233c] text-white py-2 rounded-lg hover:bg-[#d90429] flex items-center gap-2"
                            disabled={loading} // ✅ Prevents multiple clicks
                        >
                            <FontAwesomeIcon icon={faUpload} />
                            {loading ? "Processing..." : "Upload Video"}
                        </Button>

                        <div className="mt-4 text-center w-full">
                            {Object.keys(vehicleSpeeds).length > 0 ? (
                                <>
                                    <h2 className="text-lg font-semibold text-[#2b2d42] dark:text-white">
                                        Detected Vehicle Speeds
                                    </h2>
                                    <ul>
                                        {Object.entries(vehicleSpeeds).map(
                                            ([id, speed]) => {
                                                // ✅ Convert speed to string and take only first 2 digits
                                                let formattedSpeed = speed
                                                    .toString()
                                                    .replace(/\D/g, "")
                                                    .slice(0, 2);

                                                // ✅ Ensure at least 2 digits (e.g., "3" becomes "30")
                                                if (formattedSpeed.length < 2) {
                                                    formattedSpeed =
                                                        formattedSpeed.padEnd(
                                                            2,
                                                            "0"
                                                        );
                                                }

                                                return (
                                                    <li
                                                        key={id}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={
                                                                faTachometerAlt
                                                            }
                                                            className="text-black"
                                                        />
                                                        Vehicle {id}:{" "}
                                                        <span className="font-bold text-[#d90429]">
                                                            {formattedSpeed}{" "}
                                                            km/h
                                                        </span>
                                                    </li>
                                                );
                                            }
                                        )}
                                    </ul>
                                </>
                            ) : (
                                <h2 className="text-lg font-semibold text-[#2b2d42] dark:text-white">
                                    Upload video to get started
                                </h2>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
