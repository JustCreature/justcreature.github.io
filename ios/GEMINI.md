# iOS Film Photography Tracker

This project is a native iOS Swift port of a PWA film photography tracker. It provides a specialized UI for tracking film photography metadata (exposures, aperture, shutter speed, ISO/EI, focal length, geolocation, and notes) per film roll, along with camera and lens equipment management.

## Project Overview

- **Purpose:** To help film photographers record and manage their metadata on the go with a high-quality, immersive iOS experience.
- **Key Features:**
    - **Film Roll Management:** Track progress, film stock, and metadata for multiple rolls.
    - **Equipment Management:** Maintain a database of cameras and lenses (supporting both prime and zoom).
    - **Immersive Capture UI:** A custom camera viewfinder with manual controls, novel radial dial pickers, and a simulated light meter.
    - **Gallery & Contact Sheet:** View exposures in strip or grid formats, with detailed EXIF-style readouts.
    - **Import/Export:** Compatibility with the original PWA's JSON format for easy data migration and backup.
- **Reference Implementation:** The `film-photo-tracker/` directory contains a React-based functional prototype used for design and logic reference.

## Technology Stack

- **Language:** Swift 5.9+
- **Framework:** SwiftUI
- **Persistence:** SwiftData (`@Model`, `ModelContainer`)
- **Concurrency:** Swift Concurrency (async/await)
- **Architecture:** MVVM with the `@Observable` macro
- **APIs/Services:**
    - `AVFoundation`: Camera session and photo capture.
    - `CoreLocation`: Geotagging exposures.
    - `PhotosUI`: Importing images from the iOS Photo Library.
    - `SwiftData`: Local database management.

## Building and Running

### iOS Application (Xcode)
1. Open the project in Xcode (requires macOS with Xcode 15+).
2. Ensure the `FilmTracker` scheme is selected.
3. Build and run on an iOS 17+ Simulator or physical device.
4. **Testing:** Run tests using `Cmd+U` or via the Test Navigator. The project uses XCTest and XCUITest.

### Reference Prototype (Web)
1. Open `film-photo-tracker/index.html` in a modern web browser to view the functional design reference.

## Development Conventions

### Architecture & Style
- **MVVM:** Strictly follow the Model-View-ViewModel pattern. Use the `@Observable` macro for ViewModels.
- **Design System:** Adhere to the design tokens defined in `global-plan.md`. Use the specific hex codes for backgrounds (`#0a0a0b`), surfaces, and the primary accent (`#f4a261`).
- **Typography:** Use **Inter Tight** for UI elements and **SF Mono / JetBrains Mono** for numeric readouts and metadata.
- **Surgical Updates:** When modifying code, maintain the existing architectural patterns and avoid unnecessary refactoring.

### Image Handling
- **Downscaling:** All images (camera capture, gallery import, etc.) must be run through a shared `ImageUtils.downscale(_:)` helper.
- **Specs:** Max dimension of 1280px (maintaining aspect ratio), JPEG format, 0.75 quality.
- **Storage:** Use `@Attribute(.externalStorage)` in SwiftData models to keep large image blobs outside the main SQLite database.

### Testing
- **Mandatory Verification:** Every new feature or bug fix must be accompanied by relevant unit or UI tests.
- **Target:** Primary testing target is `FilmTrackerTests`.
- **Environment:** Tests should ideally be runnable on the latest iPhone simulator (e.g., iPhone 16).

## Directory Structure

- `ios/FilmTracker/`: Main source code directory (Swift files).
- `ios/film-photo-tracker/`: React-based reference prototype and mockups.
- `ios/global-plan.md`: The master implementation roadmap and design spec.

## Functional Parity & Reference
This project is a rewrite of the original application, which can be found at `/Users/nikitazavartsev/prog_projects/film-meta-tracker`. That repository should be checked as a primary reference to ensure all necessary functionalities and logic (e.g., specific metadata handling, export formats) are accurately implemented in this iOS version.

