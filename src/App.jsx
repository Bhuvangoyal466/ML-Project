/* eslint-disable no-unused-vars */
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "../src/components/Home";
import HelmetDetection from "../src/components/HelmetDetection";
import NumberPlateDetection from "../src/components/NumberPlateDetection";
import SpeedDetection from "../src/components/SpeedDetection";
import AccidentDetection from "../src/components/AccidentDetection";
import { Button } from "../src/components/ui/button";
import { useState } from "react";

// ✅ Background Image URL
const bgImage = "background.webp";

function App() {
    return (
        <Router>
            <div
                style={{
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <nav className="flex justify-between items-center p-4 bg-[#2b2d42] text-white shadow-lg">
                    <div className="flex gap-4">
                        <Button
                            asChild
                            variant="outline"
                            className="text-gray-900"
                        >
                            <Link to="/">Home</Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="text-gray-900 "
                        >
                            <Link to="/helmet-detection">Helmet Detection</Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="text-gray-900 "
                        >
                            <Link to="/number-plate-detection">
                                Number Plate Detection
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="text-gray-900 "
                        >
                            <Link to="/speed-detection">Speed Detection</Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="text-gray-900 "
                        >
                            <Link to="/accident-detection">
                                Accident Detection
                            </Link>
                        </Button>
                    </div>
                </nav>

                {/* ✅ Pass Background Image Prop to All Components */}
                <Routes>
                    <Route path="/" element={<Home bgImage={bgImage} />} />
                    <Route
                        path="/helmet-detection"
                        element={<HelmetDetection bgImage={bgImage} />}
                    />
                    <Route
                        path="/number-plate-detection"
                        element={<NumberPlateDetection bgImage={bgImage} />}
                    />
                    <Route
                        path="/speed-detection"
                        element={<SpeedDetection bgImage={bgImage} />}
                    />
                    <Route
                        path="/accident-detection"
                        element={<AccidentDetection bgImage={bgImage} />}
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
