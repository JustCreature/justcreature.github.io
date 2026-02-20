export const camera = {
    // Check if camera access is available
    isSupported: (): boolean => {
        const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';

        console.log('Camera support check:', {
            hasMediaDevices,
            isSecureContext,
            protocol: location.protocol,
            hostname: location.hostname
        });

        return hasMediaDevices && isSecureContext;
    },

    // Check camera permissions
    checkPermissions: async (): Promise<'granted' | 'denied' | 'prompt'> => {
        try {
            if (navigator.permissions) {
                const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
                return result.state;
            }
        } catch (error) {
            console.log('Permission API not supported:', error);
        }
        return 'prompt';
    },

    // Request camera permission and get media stream
    getMediaStream: async (): Promise<MediaStream> => {
        const constraints = [
            // Try rear camera with specific resolution first
            {
                video: {
                    facingMode: { exact: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            },
            // Try rear camera without exact constraint
            {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            },
            // Try front camera
            {
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            },
            // Try any camera with resolution
            {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            },
            // Try most basic constraints
            {
                video: true
            }
        ];

        for (let i = 0; i < constraints.length; i++) {
            try {
                console.log(`Trying camera constraints ${i + 1}/${constraints.length}:`, constraints[i]);
                const stream = await navigator.mediaDevices.getUserMedia(constraints[i]);
                console.log('Camera access successful with constraints:', constraints[i]);
                return stream;
            } catch (error) {
                console.warn(`Camera attempt ${i + 1} failed:`, error);
                if (i === constraints.length - 1) {
                    // Last attempt failed
                    throw new Error(`Camera access failed after ${constraints.length} attempts. Please check permissions and try again.`);
                }
            }
        }

        throw new Error('Unexpected error in camera access');
    },

    // Capture image from video stream with mobile optimizations
    captureImage: (video: HTMLVideoElement, zoomFactor: number = 1.0): string => {
        const canvas = document.createElement('canvas');

        // Get actual video dimensions
        const videoWidth = video.videoWidth || video.clientWidth;
        const videoHeight = video.videoHeight || video.clientHeight;

        if (videoWidth === 0 || videoHeight === 0) {
            throw new Error('Video not ready - invalid dimensions');
        }

        // Calculate crop area for zoom
        const cropWidth = videoWidth / zoomFactor;
        const cropHeight = videoHeight / zoomFactor;
        const cropX = (videoWidth - cropWidth) / 2;
        const cropY = (videoHeight - cropHeight) / 2;

        // Limit canvas size for mobile performance
        const maxSize = 1280;
        let canvasWidth = cropWidth;
        let canvasHeight = cropHeight;

        if (cropWidth > maxSize || cropHeight > maxSize) {
            const aspectRatio = cropWidth / cropHeight;
            if (cropWidth > cropHeight) {
                canvasWidth = maxSize;
                canvasHeight = maxSize / aspectRatio;
            } else {
                canvasHeight = maxSize;
                canvasWidth = maxSize * aspectRatio;
            }
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Unable to create canvas context');
        }

        try {
            // Draw only the cropped/zoomed portion of the video frame
            ctx.drawImage(
                video,
                cropX, cropY, cropWidth, cropHeight, // source rectangle (cropped area)
                0, 0, canvasWidth, canvasHeight // destination rectangle (full canvas)
            );

            // Use higher quality for smaller images, lower for larger ones
            const quality = canvasWidth * canvasHeight > 640 * 480 ? 0.7 : 0.8;
            const dataURL = canvas.toDataURL('image/jpeg', quality);

            if (!dataURL || dataURL.length < 100) {
                throw new Error('Failed to generate image data');
            }

            return dataURL;
        } catch (error) {
            console.error('Error drawing to canvas:', error);
            throw new Error('Failed to capture image from video');
        }
    },

    // Stop media stream
    stopStream: (stream: MediaStream): void => {
        stream.getTracks().forEach(track => track.stop());
    }
};

export const geolocation = {
    // Check if geolocation is supported
    isSupported: (): boolean => {
        return !!navigator.geolocation;
    },

    // Get current position
    getCurrentPosition: (): Promise<{ latitude: number; longitude: number }> => {
        return new Promise((resolve, reject) => {
            if (!geolocation.isSupported()) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    reject(new Error('Unable to get location'));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 600000 // 10 minutes
                }
            );
        });
    }
};

export const lightMeter = {
    // Get camera's actual exposure settings (ISO, exposure time)
    getCameraExposureData: (stream: MediaStream): { iso: number; exposureTime: number } | null => {
        try {
            const videoTrack = stream.getVideoTracks()[0];
            if (!videoTrack) return null;

            const settings = videoTrack.getSettings() as MediaTrackSettings & {
                iso?: number;
                exposureTime?: number;
            };

            // Get actual ISO and exposure time from camera hardware
            const iso = settings.iso;
            const exposureTime = settings.exposureTime;

            if (iso && exposureTime) {
                console.log('Camera settings:', { iso, exposureTime, settings });
                return { iso, exposureTime };
            }

            return null;
        } catch (error) {
            console.warn('Could not get camera exposure data:', error);
            return null;
        }
    },

    // Calculate EV from camera's actual ISO and exposure time
    calculateEVFromCamera: (iso: number, exposureTime: number, aperture: string): number => {
        // EV formula: EV = log2(N²/t) + log2(ISO/100)
        // Where:
        // - N = f-number (aperture)
        // - t = exposure time in seconds
        // - ISO = sensitivity

        const fNumber = parseFloat(aperture.replace('f/', ''));

        // Convert exposure time from microseconds to seconds
        const exposureSeconds = exposureTime / 1000000;

        // Calculate EV
        const ev = Math.log2((fNumber * fNumber) / exposureSeconds) + Math.log2(iso / 100);

        console.log('EV calculation:', { fNumber, exposureSeconds, iso, ev });

        return Math.round(ev * 10) / 10; // Round to 1 decimal
    },

    // Fallback: Analyze frame brightness from video element (less accurate due to auto-exposure)
    analyzeFrameBrightness: (video: HTMLVideoElement): number => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
            return 128; // Default mid-gray if not ready
        }

        // Use smaller canvas for performance (scale down by 4)
        canvas.width = Math.floor(video.videoWidth / 4);
        canvas.height = Math.floor(video.videoHeight / 4);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let totalLuminance = 0;
        let pixelCount = 0;

        // Sample every 4th pixel for better performance
        for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // ITU-R BT.709 luminance formula
            const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            totalLuminance += luminance;
            pixelCount++;
        }

        return totalLuminance / pixelCount; // Returns 0-255
    },

    // Fallback: Convert brightness to EV (less accurate)
    brightnessToEV: (brightness: number): number => {
        // Empirical formula: brightness 0-255 → EV
        const normalizedBrightness = brightness / 255;

        // Logarithmic scale
        const ev = Math.log2(normalizedBrightness * 100 + 0.01) + 3.5;

        return Math.round(ev * 10) / 10; // Round to 1 decimal
    },

    // Calculate shutter speed for given aperture and EV
    calculateShutterSpeed: (aperture: string, ev: number, iso: number): string => {
        // EV formula: EV = log2(N²/t) + log2(ISO/100)
        // Solve for t (shutter speed time)
        // t = N² / (2^EV * ISO/100)

        // Parse aperture (e.g., "f/2.8" → 2.8)
        const fNumber = parseFloat(aperture.replace('f/', ''));

        // Calculate shutter time in seconds
        const shutterTime = (fNumber * fNumber) / (Math.pow(2, ev) * (iso / 100));

        // Convert to standard shutter speed notation
        return lightMeter.formatShutterSpeed(shutterTime);
    },

    // Format shutter time to standard notation (e.g., 1/125, 1/500)
    formatShutterSpeed: (timeInSeconds: number): string => {
        if (timeInSeconds >= 1) {
            // Slow shutter: 1", 2", 4"
            return `${Math.round(timeInSeconds)}"`;
        } else {
            // Fast shutter: 1/125, 1/500, etc.
            const denominator = Math.round(1 / timeInSeconds);

            // Snap to standard values
            const standardSpeeds = [4000, 2000, 1000, 500, 250, 125, 60, 30, 15, 8, 4, 2];
            const closest = standardSpeeds.reduce((prev, curr) =>
                Math.abs(curr - denominator) < Math.abs(prev - denominator) ? curr : prev
            );

            return `1/${closest}`;
        }
    }
};

export const fileUtils = {
    // Scale and compress image file (for gallery uploads)
    scaleImageFile: (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            // Validate file first
            if (!file || !(file instanceof File)) {
                reject(new Error('Invalid file provided'));
                return;
            }

            // Check file size (limit to 10MB for mobile compatibility)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                reject(new Error('File too large. Please select a smaller image.'));
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                reject(new Error('Please select an image file.'));
                return;
            }

            // Create image element to load file
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                try {
                    URL.revokeObjectURL(url); // Clean up

                    // Same scaling logic as camera.captureImage()
                    const maxSize = 1280;
                    let canvasWidth = img.width;
                    let canvasHeight = img.height;

                    if (img.width > maxSize || img.height > maxSize) {
                        const aspectRatio = img.width / img.height;
                        if (img.width > img.height) {
                            canvasWidth = maxSize;
                            canvasHeight = maxSize / aspectRatio;
                        } else {
                            canvasHeight = maxSize;
                            canvasWidth = maxSize * aspectRatio;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Unable to create canvas context'));
                        return;
                    }

                    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

                    // Same quality calculation as camera.captureImage()
                    const quality = canvasWidth * canvasHeight > 640 * 480 ? 0.7 : 0.8;
                    const dataURL = canvas.toDataURL('image/jpeg', quality);

                    if (!dataURL || dataURL.length < 100) {
                        reject(new Error('Failed to generate image data'));
                        return;
                    }

                    resolve(dataURL);
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image file'));
            };

            img.src = url;
        });
    },

    // Convert file to base64 with mobile-specific handling
    fileToBase64: (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            // Validate file first
            if (!file || !(file instanceof File)) {
                reject(new Error('Invalid file provided'));
                return;
            }

            // Check file size (limit to 10MB for mobile compatibility)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                reject(new Error('File too large. Please select a smaller image.'));
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                reject(new Error('Please select an image file.'));
                return;
            }

            const reader = new FileReader();

            reader.onload = () => {
                try {
                    if (typeof reader.result === 'string') {
                        resolve(reader.result);
                    } else {
                        reject(new Error('Failed to convert file to base64'));
                    }
                } catch (error) {
                    console.error('FileReader result processing error:', error);
                    reject(new Error('Error processing file'));
                }
            };

            reader.onerror = (error) => {
                console.error('FileReader error:', error);
                reject(new Error('Failed to read file'));
            };

            reader.onabort = () => {
                reject(new Error('File reading was aborted'));
            };

            try {
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error starting file read:', error);
                reject(new Error('Failed to start reading file'));
            }
        });
    },

    // Create and trigger download
    downloadData: (data: string, filename: string, mimeType: string = 'application/json'): void => {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};