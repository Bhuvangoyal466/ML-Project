import cv2
import os

# Path to Haar Cascade model for number plate detection
harcascade = "model/haarcascade_russian_plate_number.xml"

# Initialize for input video
cap = cv2.VideoCapture("video.mp4")
cap.set(3, 640)  # Set frame width
cap.set(4, 480)  # Set frame height

min_area = 500  # Minimum area for a detected plate to be considered valid

# Load the count from a file to prevent overwriting saved images
count_file = "plates/count.txt"
if os.path.exists(count_file):
    with open(count_file, "r") as f:
        content = f.read().strip()
        count = (
            int(content) if content.isdigit() else 0
        )  # Set count to 0 if file is empty or invalid
else:
    count = 0  # Default count if no file exists

while True:
    success, img = cap.read()  # Capture frame from video
    if not success:
        break  # Exit if video ends

    plate_cascade = cv2.CascadeClassifier(harcascade)  # Load Haar cascade model
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)  # Convert frame to grayscale
    plates = plate_cascade.detectMultiScale(img_gray, 1.1, 4)  # Detect plates

    for x, y, w, h in plates:
        area = w * h
        if area > min_area:  # Filter small detections
            # Draw a green rectangle around the detected plate
            cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)
            # Display label above the plate
            cv2.putText(
                img,
                "Number Plate",
                (x, y - 5),
                cv2.FONT_HERSHEY_COMPLEX_SMALL,
                1,
                (255, 0, 255),
                2,
            )

            # Extract the region of interest (ROI) for the number plate
            img_roi = img[y : y + h, x : x + w]
            cv2.imshow("ROI", img_roi)  # Show the detected plate

    cv2.imshow("Result", img)  # Display the frame with detection

    key = cv2.waitKey(1) & 0xFF

    # Save the number plate image when 's' key is pressed
    if key == ord("s") and "img_roi" in locals():
        filename = f"plates/scaned_img_{count}.jpg"
        cv2.imwrite(filename, img_roi)  # Save ROI as an image

        # Display "Plate Saved" message on screen
        cv2.rectangle(img, (0, 200), (640, 300), (0, 255, 0), cv2.FILLED)
        cv2.putText(
            img,
            "Plate Saved",
            (150, 265),
            cv2.FONT_HERSHEY_COMPLEX_SMALL,
            2,
            (0, 0, 255),
            2,
        )
        cv2.imshow("Result", img)
        cv2.waitKey(500)  # Pause to display the message

        count += 1  # Increment count for next image

        # Save updated count to file for persistence
        with open(count_file, "w") as f:
            f.write(str(count))

    # Quit when 'q' key is pressed
    elif key == ord("q"):
        break

# Release the video and close all OpenCV windows
cap.release()
cv2.destroyAllWindows()
