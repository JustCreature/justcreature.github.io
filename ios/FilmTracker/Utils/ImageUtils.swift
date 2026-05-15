import UIKit

enum ImageUtils {
    static func downscale(_ image: UIImage) -> Data? {
        let maxDimension: CGFloat = 1280
        let size = image.size
        
        let widthRatio  = maxDimension / size.width
        let heightRatio = maxDimension / size.height
        
        var newSize: CGSize
        if widthRatio < heightRatio {
            newSize = CGSize(width: size.width * widthRatio, height: size.height * widthRatio)
        } else {
            newSize = CGSize(width: size.width * heightRatio, height: size.height * heightRatio)
        }
        
        if size.width <= maxDimension && size.height <= maxDimension {
            return image.jpegData(compressionQuality: 0.75)
        }
        
        let rect = CGRect(origin: .zero, size: newSize)
        UIGraphicsBeginImageContextWithOptions(newSize, false, 1.0)
        image.draw(in: rect)
        let newImage = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        
        return newImage?.jpegData(compressionQuality: 0.75)
    }
    
    static func downscale(_ data: Data) -> Data? {
        guard let image = UIImage(data: data) else { return nil }
        return downscale(image)
    }
}
