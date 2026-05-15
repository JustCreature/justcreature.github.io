PROJECT_NAME = FilmTracker
BUNDLE_ID = com.filmtracker.FilmTracker
DESTINATION = platform=iOS Simulator,name=iPhone 17
SIM_NAME = iPhone 17

.PHONY: up down clean test build install launch generate

# Starts the simulator, builds the app, installs it, and launches it.
up: generate build install launch
	open -a Simulator

# Regenerates the Xcode project using xcodegen.
generate:
	xcodegen generate

# Builds the app for the simulator.
build:
	xcodebuild -project $(PROJECT_NAME).xcodeproj \
		-scheme $(PROJECT_NAME) \
		-destination '$(DESTINATION)' \
		-configuration Debug \
		-derivedDataPath build \
		build

# Boots the simulator (if needed) and installs the app.
install:
	xcrun simctl boot "$(SIM_NAME)" || true
	xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/$(PROJECT_NAME).app

# Launches the app on the booted simulator.
launch:
	xcrun simctl launch booted $(BUNDLE_ID)

# Shuts down the simulator.
down:
	xcrun simctl shutdown booted || true

# Runs all tests (Unit + UI).
test:
	xcodebuild test -project $(PROJECT_NAME).xcodeproj \
		-scheme $(PROJECT_NAME) \
		-destination '$(DESTINATION)' \
		-derivedDataPath build

# Cleans build artifacts and the generated Xcode project.
clean:
	rm -rf build
	rm -rf $(PROJECT_NAME).xcodeproj
