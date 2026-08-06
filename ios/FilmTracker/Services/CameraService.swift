import AVFoundation
import UIKit
import Observation

@Observable
final class CameraService: NSObject {
    enum CameraError: Error {
        case notAuthorized
        case sessionSetupFailed
        case captureFailed
    }
    
    var session = AVCaptureSession()
    private let photoOutput = AVCapturePhotoOutput()
    private var isSessionRunning = false
    private let sessionQueue = DispatchQueue(label: "com.filmtracker.camera.session")
    
    var captureCompletion: ((Data?) -> Void)?
    
    override init() {
        super.init()
    }
    
    func checkPermission() async -> Bool {
        #if targetEnvironment(simulator)
        return true
        #endif
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        switch status {
        case .authorized:
            return true
        case .notDetermined:
            return await AVCaptureDevice.requestAccess(for: .video)
        default:
            return false
        }
    }
    
    func setupSession() {
        #if targetEnvironment(simulator)
        return
        #endif
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            
            self.session.beginConfiguration()
            
            // Input
            guard let videoDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
                  let videoDeviceInput = try? AVCaptureDeviceInput(device: videoDevice),
                  self.session.canAddInput(videoDeviceInput) else {
                print("Could not add video device input to the session")
                self.session.commitConfiguration()
                return
            }
            self.session.addInput(videoDeviceInput)
            
            // Output
            if self.session.canAddOutput(self.photoOutput) {
                self.session.addOutput(self.photoOutput)
                self.photoOutput.isHighResolutionCaptureEnabled = true
            } else {
                print("Could not add photo output to the session")
                self.session.commitConfiguration()
                return
            }
            
            self.session.commitConfiguration()
        }
    }
    
    func start() {
        #if targetEnvironment(simulator)
        return
        #endif
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            if !self.session.isRunning {
                self.session.startRunning()
            }
        }
    }
    
    func stop() {
        #if targetEnvironment(simulator)
        return
        #endif
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            if self.session.isRunning {
                self.session.stopRunning()
            }
        }
    }
    
    func capturePhoto(completion: @escaping (Data?) -> Void) {
        #if targetEnvironment(simulator)
        completion(UIImage(systemName: "photo")?.jpegData(compressionQuality: 0.75))
        return
        #endif
        self.captureCompletion = completion
        
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            
            let settings = AVCapturePhotoSettings()
            if let photoOutputConnection = self.photoOutput.connection(with: .video) {
                // Ensure orientation is correct if needed, but for now we keep it simple
            }
            
            self.photoOutput.capturePhoto(with: settings, delegate: self)
        }
    }
}

extension CameraService: AVCapturePhotoCaptureDelegate {
    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        if let error = error {
            print("Error capturing photo: \(error.localizedDescription)")
            captureCompletion?(nil)
            return
        }
        
        guard let imageData = photo.fileDataRepresentation() else {
            captureCompletion?(nil)
            return
        }
        
        captureCompletion?(imageData)
    }
}
