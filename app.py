from flask import Flask, request, jsonify, send_file, send_from_directory, Response
from flask_cors import CORS
import cv2
import numpy as np
import base64
import torch
import time
import os
import threading
from ultralytics import YOLO
import math
import dlib

app = Flask(__name__)
CORS(app)

# Load YOLOv8 model for helmet detection
model = YOLO("helmet-detection/best.pt")

# Load Haar cascade model for number plate detection
plate_cascade = cv2.CascadeClassifier("number-plate-detection/number.xml")

UPLOAD_FOLDER = "uploads"


def detect_helmets(image):
    results = model(image)  # YOLOv8 inference
    detections = results[0].boxes.data  # Extract detection data

    with_helmet = 0
    without_helmet = 0

    for det in detections:
        x1, y1, x2, y2, conf, cls = det.tolist()  # Extract values
        class_id = int(cls)
        print(
            f"Detected Classes: {[int(det[-1]) for det in detections]}"
        )  # Print class IDs
        print(model.names)  # Print the class labels YOLO is using

        # Assuming class 0 is 'helmet' and class 1 is 'no-helmet'
        label = "helmet" if class_id == 0 else "no-helmet"
        if label == "helmet":
            with_helmet += 1
        else:
            without_helmet += 1

        color = (
            (0, 255, 0) if label == "helmet" else (0, 0, 255)
        )  # Green for helmet, Red for no-helmet
        cv2.rectangle(image, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
        cv2.putText(
            image,
            label,
            (int(x1), int(y1) - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            2,
        )

    # Save output image
    import uuid  # Add this at the top of your file

    output_filename = f"output_{uuid.uuid4().hex}.jpg"  # Generate a unique file
    output_path = os.path.join(
        "uploads", output_filename
    )  # Save inside 'uploads' folder

    cv2.imwrite(output_path, image)

    return with_helmet, without_helmet, output_path, output_filename


@app.route("/detect/helmet", methods=["POST"])
def detect_helmet_api():
    file = request.files["image"]
    image = np.frombuffer(file.read(), np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    with_helmet, without_helmet, output_path, output_filename = detect_helmets(image)

    return jsonify(
        {
            "with_helmet": with_helmet,
            "without_helmet": without_helmet,
            "output_image_url": f"http://127.0.0.1:5000/uploads/{output_filename}",
        }
    )


@app.route("/uploads/<filename>")
def get_output_image(filename):
    return send_from_directory("uploads", filename)


# Paths for saving plates & uploads
UPLOAD_FOLDER = "uploads"
PLATES_FOLDER = "plates"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PLATES_FOLDER, exist_ok=True)

# Global variables for processing
video_path = None
processing_thread = None
saved_plates = []
stop_processing = False  # Control flag to stop processing


def process_video(video_path):
    """Opens an OpenCV window, detects plates, and allows saving them."""
    global saved_plates, stop_processing
    stop_processing = False
    cap = cv2.VideoCapture(video_path)
    count = 0

    window_name = "Number Plate Detection"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)  # Allows resizing
    cv2.setWindowProperty(window_name, cv2.WND_PROP_TOPMOST, 1)  # Forces window on top

    while cap.isOpened():
        for _ in range(2):  # Skip every other frame
            success, img = cap.read()
        if not success or stop_processing:
            break  # Stop when the video ends or user presses 'q'

        img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        plates = plate_cascade.detectMultiScale(img_gray, 1.1, 4)

        for x, y, w, h in plates:
            area = w * h
            if area > 500:  # Ignore small detections
                cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)
                cv2.putText(
                    img,
                    "Number Plate",
                    (x, y - 5),
                    cv2.FONT_HERSHEY_COMPLEX_SMALL,
                    1,
                    (255, 0, 255),
                    2,
                )

        # Bring window to the front
        cv2.imshow(window_name, img)
        cv2.setWindowProperty(window_name, cv2.WND_PROP_TOPMOST, 1)

        key = cv2.waitKey(1) & 0xFF

        # Save the number plate image when 's' is pressed
        if key == ord("s"):
            for x, y, w, h in plates:
                roi = img[y : y + h, x : x + w]
                filename = f"plate_{count}.jpg"
                filepath = os.path.join(PLATES_FOLDER, filename)
                cv2.imwrite(filepath, roi)
                saved_plates.append(filename)
                count += 1

        # Quit processing when 'q' is pressed
        elif key == ord("q"):
            stop_processing = True
            break

    cap.release()
    cv2.destroyAllWindows()


@app.route("/upload_video", methods=["POST"])
def upload_video():
    """Handles video upload and starts OpenCV processing."""
    global video_path, processing_thread, saved_plates

    if "video" not in request.files:
        return jsonify({"error": "No video file uploaded"}), 400

    file = request.files["video"]
    video_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(video_path)

    # Clear previously saved plates
    saved_plates.clear()

    # Start a new processing thread
    processing_thread = threading.Thread(target=process_video, args=(video_path,))
    processing_thread.start()

    return jsonify({"message": "Video uploaded, processing started!"})


@app.route("/get_saved_plates", methods=["GET"])
def get_saved_plates():
    """Returns a list of saved plates."""
    return jsonify({"plates": saved_plates})


@app.route("/plates/<filename>")
def serve_plate(filename):
    """Serves saved plates for download."""
    return send_from_directory(PLATES_FOLDER, filename)


@app.route("/stop_processing", methods=["POST"])
def stop_processing_route():
    """Stops video processing when user presses 'q'."""
    global stop_processing
    stop_processing = True
    return jsonify({"message": "Processing stopped."})


UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

carCascade = cv2.CascadeClassifier(
    "speed-detection/vech.xml"
)  # Pretrained vehicle model
video_path = None
processing_thread = None
stop_processing = False
vehicle_speeds = {}  # Dictionary to store unique vehicle IDs and their speeds
tracked_vehicles = {}  # Stores active vehicle trackers
next_vehicle_id = 0  # Counter to assign unique vehicle IDs


def estimateSpeed(prev_location, curr_location):
    d_pixels = math.sqrt(
        math.pow(curr_location[0] - prev_location[0], 2)
        + math.pow(curr_location[1] - prev_location[1], 2)
    )

    ppm = 8.8  # Pixels per meter (adjust based on camera setup)
    fps = 30  # Frames per second

    # Avoid speed spikes by setting an upper limit (e.g., 200 km/h)
    speed = (d_pixels / ppm) * fps * 3.6  # Convert to km/h
    speed = min(speed, 200)  # Prevent extreme values

    return speed


@app.route("/upload_video_speed", methods=["POST"])
def upload_video_speed():
    """Handles video upload and starts OpenCV speed detection processing."""
    global video_path, processing_thread

    if "video" not in request.files:
        return jsonify({"error": "No video file uploaded"}), 400

    file = request.files["video"]
    video_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(video_path)

    # Start a new processing thread for speed detection
    processing_thread = threading.Thread(target=process_video_speed, args=(video_path,))
    processing_thread.start()

    return jsonify({"message": "Video uploaded, processing started!"}), 200


# Speed detection function with OpenCV UI
def process_video_speed(video_path):
    global stop_processing, vehicle_speeds, tracked_vehicles, next_vehicle_id
    stop_processing = False
    vehicle_speeds.clear()
    tracked_vehicles.clear()
    next_vehicle_id = 0

    cap = cv2.VideoCapture(video_path)

    window_name = "Speed Detection"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.setWindowProperty(window_name, cv2.WND_PROP_TOPMOST, 1)

    while cap.isOpened():
        success, frame = cap.read()
        if not success or stop_processing:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        detected_cars = carCascade.detectMultiScale(gray, 1.1, 4)

        # Check each detected car and either track it or assign a new ID
        new_tracked_vehicles = {}
        for x, y, w, h in detected_cars:
            matched_vehicle_id = None

            # Check if this car matches an existing tracked vehicle
            for vehicle_id, tracker in tracked_vehicles.items():
                pos = tracker.get_position()
                tx1, ty1, tx2, ty2 = (
                    int(pos.left()),
                    int(pos.top()),
                    int(pos.right()),
                    int(pos.bottom()),
                )

                if abs(tx1 - x) < w and abs(ty1 - y) < h:
                    matched_vehicle_id = vehicle_id
                    break

            # If it's a new vehicle, assign a new ID
            if matched_vehicle_id is None:
                matched_vehicle_id = next_vehicle_id
                next_vehicle_id += 1

                # Start tracking the new vehicle
                tracker = dlib.correlation_tracker()
                tracker.start_track(frame, dlib.rectangle(x, y, x + w, y + h))
                tracked_vehicles[matched_vehicle_id] = tracker

            # Update the tracker
            new_tracked_vehicles[matched_vehicle_id] = tracked_vehicles[
                matched_vehicle_id
            ]

        # Update the tracked vehicles list
        tracked_vehicles = new_tracked_vehicles

        # Update speeds
        for vehicle_id, tracker in tracked_vehicles.items():
            tracker.update(frame)
            pos = tracker.get_position()
            x1, y1, x2, y2 = (
                int(pos.left()),
                int(pos.top()),
                int(pos.right()),
                int(pos.bottom()),
            )

            if vehicle_id in vehicle_speeds:
                speed = estimateSpeed(vehicle_speeds[vehicle_id], (x1, y1))
                vehicle_speeds[vehicle_id] = speed

                # Draw a background rectangle to prevent text overlapping
                cv2.rectangle(frame, (x1, y1 - 25), (x1 + 120, y1), (0, 0, 0), -1)
                cv2.putText(
                    frame,
                    f"ID {vehicle_id}: {int(speed)} km/h",
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 255, 255),
                    2,
                )

            vehicle_speeds[vehicle_id] = (x1, y1)

            # Draw the bounding box
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 255), 2)

        cv2.imshow(window_name, frame)
        cv2.setWindowProperty(window_name, cv2.WND_PROP_TOPMOST, 1)

        key = cv2.waitKey(1) & 0xFF

        # Quit processing when 'q' is pressed
        if key == ord("q"):
            stop_processing = True
            break

    cap.release()
    cv2.destroyAllWindows()


@app.route("/get_vehicle_speeds", methods=["GET"])
def get_vehicle_speeds():
    return jsonify(vehicle_speeds)


@app.route("/stop_processing_speed", methods=["POST"])
def stop_processing_route_speed():
    global stop_processing, vehicle_speeds, tracked_vehicles
    stop_processing = True
    vehicle_speeds.clear()  # Clear vehicle speed data after stopping
    tracked_vehicles.clear()  # Clear vehicle tracking data

    return jsonify({"message": "Processing stopped successfully."}), 200


UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load YOLOv8 model for accident detection
model_acc = YOLO("accident-detection/best.pt")  # Change path if needed

video_path = None
processing_thread = None
stop_processing = False
accident_detected = False
total_accidents = 0
accident_timestamps = []
last_accident_time = (
    -5
)  # Stores the last recorded accident timestamp (initialize with -5)


@app.route("/upload_video_acc", methods=["POST"])
def upload_video_acc():
    global video_path, processing_thread

    if "video" not in request.files:
        return jsonify({"error": "No video file uploaded"}), 400

    file = request.files["video"]
    video_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(video_path)

    # Start a new processing thread for accident detection
    processing_thread = threading.Thread(target=process_video_acc, args=(video_path,))
    processing_thread.start()

    return jsonify({"message": "Video uploaded, processing started!"}), 200


# Function to process video and detect accidents
def process_video_acc(video_path):
    global stop_processing, accident_detected, total_accidents, accident_timestamps, last_accident_time
    stop_processing = False
    accident_detected = False
    total_accidents = 0
    accident_timestamps.clear()
    last_accident_time = (
        -5
    )  # Start with a negative value so the first detection is counted

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = 0

    window_name = "Accident Detection"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.setWindowProperty(window_name, cv2.WND_PROP_TOPMOST, 1)

    while cap.isOpened():
        success, frame = cap.read()
        if not success or stop_processing:
            break

        frame_count += 1
        time_in_seconds = frame_count / fps

        # YOLO inference
        results = model_acc(frame)

        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                label = f"{model_acc.names[cls]} {conf:.2f}"

                # Draw bounding box
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.putText(
                    frame,
                    label,
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 0, 255),
                    2,
                )

                # **✅ New Fix: Only Count If At Least 2s Have Passed Since Last Detection**
                if "accident" in model_acc.names[cls].lower() and conf > 0.5:
                    if (
                        time_in_seconds - last_accident_time > 2
                    ):  # Prevent duplicate detection
                        accident_detected = True
                        total_accidents += 1
                        accident_timestamps.append(round(time_in_seconds, 2))
                        last_accident_time = (
                            time_in_seconds  # Update last accident time
                        )

        cv2.imshow(window_name, frame)
        cv2.setWindowProperty(window_name, cv2.WND_PROP_TOPMOST, 1)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            stop_processing = True
            break

    cap.release()
    cv2.destroyAllWindows()


@app.route("/get_accident_status", methods=["GET"])
def get_accident_status():
    return jsonify(
        {
            "accident_detected": accident_detected,
            "total_accidents": total_accidents,
            "accident_timestamps": accident_timestamps,
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
