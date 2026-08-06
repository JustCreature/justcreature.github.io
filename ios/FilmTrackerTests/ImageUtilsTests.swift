import XCTest
import UIKit
@testable import FilmTracker

final class ImageUtilsTests: XCTestCase {
    func testDownscaleLargeImage() {
        // Create a 2000x2000 white image
        let size = CGSize(width: 2000, height: 2000)
        UIGraphicsBeginImageContext(size)
        UIColor.white.setFill()
        UIRectFill(CGRect(origin: .zero, size: size))
        let largeImage = UIGraphicsGetImageFromCurrentImageContext()!
        UIGraphicsEndImageContext()
        
        let data = ImageUtils.downscale(largeImage)
        XCTAssertNotNil(data)
        
        let processedImage = UIImage(data: data!)!
        XCTAssertTrue(processedImage.size.width <= 1280)
        XCTAssertTrue(processedImage.size.height <= 1280)
        
        // Size check (should be under 500KB for a plain white image)
        XCTAssertTrue(data!.count < 500 * 1024)
    }
    
    func testDownscaleSmallImage() {
        // Create a 500x500 white image
        let size = CGSize(width: 500, height: 500)
        UIGraphicsBeginImageContext(size)
        UIColor.white.setFill()
        UIRectFill(CGRect(origin: .zero, size: size))
        let smallImage = UIGraphicsGetImageFromCurrentImageContext()!
        UIGraphicsEndImageContext()
        
        let data = ImageUtils.downscale(smallImage)
        XCTAssertNotNil(data)
        
        let processedImage = UIImage(data: data!)!
        XCTAssertEqual(processedImage.size.width, 500)
        XCTAssertEqual(processedImage.size.height, 500)
    }
}
