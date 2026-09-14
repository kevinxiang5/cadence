import AppKit
import Foundation

/// Three concentric teal rings on tan.
/// Outer and inner are full circles. The middle ring is four quarter-arcs
/// with gaps in the outline at 12 / 3 / 6 / 9.

let canvas: CGFloat = 1024
let tan = NSColor(red: 243 / 255, green: 237 / 255, blue: 227 / 255, alpha: 1) // #F3EDE3
let teal = NSColor(red: 14 / 255, green: 77 / 255, blue: 74 / 255, alpha: 1)

func makeBitmap(_ side: Int) -> NSBitmapImageRep {
    let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: side,
        pixelsHigh: side,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    )!
    rep.size = NSSize(width: side, height: side)
    return rep
}

let final = makeBitmap(Int(canvas))
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: final)

tan.setFill()
NSBezierPath(rect: NSRect(x: 0, y: 0, width: canvas, height: canvas)).fill()

let cx = canvas / 2
let cy = canvas / 2
let stroke: CGFloat = 42
let innerR: CGFloat = 118
let midR: CGFloat = 198
let outerR: CGFloat = 278

func fullRing(_ r: CGFloat) {
    let path = NSBezierPath(ovalIn: NSRect(
        x: cx - r,
        y: cy - r,
        width: r * 2,
        height: r * 2
    ))
    path.lineWidth = stroke
    path.stroke()
}

func quarterRing(_ r: CGFloat) {
    // 28° empty at each cardinal, so the four arcs read as quarters.
    let gap: CGFloat = 28
    let starts: [CGFloat] = [
        gap / 2,
        90 + gap / 2,
        180 + gap / 2,
        270 + gap / 2,
    ]
    let sweep: CGFloat = 90 - gap
    for start in starts {
        let path = NSBezierPath()
        path.appendArc(
            withCenter: NSPoint(x: cx, y: cy),
            radius: r,
            startAngle: start,
            endAngle: start + sweep
        )
        path.lineWidth = stroke
        path.lineCapStyle = .round
        path.stroke()
    }
}

teal.setStroke()
fullRing(outerR)
quarterRing(midR)
fullRing(innerR)

NSGraphicsContext.restoreGraphicsState()

let out = URL(fileURLWithPath: CommandLine.arguments.count > 1
    ? CommandLine.arguments[1]
    : "/Users/kevin/Projects/cadence/assets/images/logo.png")
guard let png = final.representation(using: .png, properties: [:]) else { exit(1) }
try png.write(to: out)
print("wrote \(out.path)")
