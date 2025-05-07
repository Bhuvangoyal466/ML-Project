import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "../components/ui/card";

export default function Home({ bgImage }) {
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
                <Card className="w-96 shadow-2xl bg-white dark:bg-gray-800 p-6 rounded-lg">
                    <CardHeader>
                        <CardTitle className="text-[#ef233c] text-center text-2xl font-bold">
                            AI Traffic Monitoring
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700 dark:text-gray-300 text-center">
                            Select a feature from the navigation to start
                            detecting traffic violations.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
