import os
import json
import subprocess
import sys
from datetime import datetime

# --- Adjust path to your exiftool binary if needed ---
EXIFTOOL_PATH = r"C:\Program Files\exiftool-13.38_64\exiftool.exe"

def apply_metadata(folder_path):
    # Find JSON file
    json_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.json')]
    if not json_files:
        print("❌ No JSON file found in folder.")
        return
    json_path = os.path.join(folder_path, json_files[0])
    print(f"📄 Using JSON: {json_path}")

    # Find and sort TIF files
    tif_files = sorted(
        [f for f in os.listdir(folder_path) if f.lower().endswith('.tif')],
        key=lambda x: x.lower()
    )
    if not tif_files:
        print("❌ No .tif files found.")
        return
    print(f"🖼 Found {len(tif_files)} .tif files")

    # Read JSON
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    exposures = sorted(data["exposures"], key=lambda e: e["exposureNumber"])
    total_exposures = len(exposures)
    print(f"📷 Found {total_exposures} exposures in JSON")

    # If more photos than exposures — skip the first few
    if len(tif_files) > total_exposures:
        diff = len(tif_files) - total_exposures
        print(f"⚠️ Skipping first {diff} .tif files (more photos than exposures)")
        tif_files = tif_files[diff:]

    # Apply metadata
    for tif_file, exp in zip(tif_files, exposures):
        tif_path = os.path.join(folder_path, tif_file)
        print(f"✏️ Updating {tif_file} for exposure #{exp['exposureNumber']}")

        # Parse exposure values
        aperture = float(exp.get("aperture", "").replace(",", ".").replace("f/", ""))
        shutter = exp.get("shutterSpeed", "")
        add_info = exp.get("additionalInfo", "")
        captured_at = exp.get("capturedAt")
        latitude = exp.get("location", {}).get("latitude")
        longitude = exp.get("location", {}).get("longitude")

        # Parse datetime into Exif format
        try:
            dt_obj = datetime.fromisoformat(captured_at.replace("Z", "+00:00"))
            capture_date = dt_obj.strftime("%Y:%m:%d %H:%M:%S")
        except Exception:
            capture_date = ""

        # Build exiftool args
        args = [
            EXIFTOOL_PATH,
            "-overwrite_original",
            "-Make=Zenit",
            "-Model=Zenit ET",
            "-LensModel=Helios 44-2 58mm f/2",
            f"-FNumber={aperture}" if aperture else "",
            f"-ExposureTime={shutter}" if shutter else "",
            f"-ISO={data['filmRoll'].get('iso', 200)}",
            "-FocalLength=58mm",
            f"-UserComment={add_info}" if add_info else "",
            f"-DateTimeOriginal={capture_date}" if capture_date else "",
            f"-GPSLatitude={latitude}" if latitude else "",
            "-GPSLatitudeRef=N" if latitude else "",
            f"-GPSLongitude={longitude}" if longitude else "",
            "-GPSLongitudeRef=E" if longitude else "",
            # "-GPSAltitude=35",
            # "-City=Berlin",
            "-Country=Austria",
            f"-ImageDescription=Film: {data['filmRoll'].get('name', 'Unknown')}",
            tif_path
        ]

        # Filter out empty args
        args = [a for a in args if a]
        subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    print("✅ All metadata applied successfully!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python apply_filmroll_metadata.py <folder_path>")
        sys.exit(1)

    folder = sys.argv[1]
    apply_metadata(folder)
