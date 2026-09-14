import AppKit
import Foundation

/// Transparent concentric rings matching scripts/draw-logo.swift.
/// Outer / inner get a small gap so they can spin without looking like 3/4 circles.

let canvas: CGFloat = 1024
let teal = NSColor(red: 14 / 255, green: 77 / 255, blue: 74 / 255, alpha: 1)
let stroke: CGFloat = 42
let innerR: CGFloat = 118
let midR: CGFloat = 198
let outerR: CGFloat = 278
let cx = canvas / 2
let cy = canvas / 2
let outDir = URL(fileURLWithPath: CommandLine.arguments.count > 1
    ? CommandLine.arguments[1]
    : "/Users/kevin/Projects/cadence/assets/images")

func makeBitmap() -> NSBitmapImageRep {
    let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: Int(canvas),
        pixelsHigh: Int(canvas),
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    )!
    rep.size = NSSize(width: canvas, height: canvas)
    return rep
}

func withContext(_ draw: () -> Void) -> NSBitmapImageRep {
    let rep = makeBitmap()
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    NSGraphicsContext.current?.shouldAntialias = true
    if let ctx = NSGraphicsContext.current?.cgContext {
        ctx.clear(CGRect(x: 0, y: 0, width: canvas, height: canvas))
    }
    draw()
    NSGraphicsContext.restoreGraphicsState()
    return rep
}

func strokeArc(radius r: CGFloat, start: CGFloat, sweep: CGFloat) {
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

func write(_ rep: NSBitmapImageRep, name: String) {
    let url = outDir.appendingPathComponent(name)
    guard let png = rep.representation(using: .png, properties: [:]) else { exit(1) }
    try! png.write(to: url)
    print("wrote \(url.path)")
}

// AppKit 0° = 3 o’clock, CCW. Logo gaps sit on the cardinals.
let midGap: CGFloat = 28
let midSweep: CGFloat = 90 - midGap

let outer = withContext {
    teal.setStroke()
    // ~20° gap — still reads as the solid outer ring
    strokeArc(radius: outerR, start: 10, sweep: 340)
}
write(outer, name: "ring-outer.png")

let mid = withContext {
    teal.setStroke()
    for i in 0..<4 {
        strokeArc(radius: midR, start: midGap / 2 + CGFloat(i) * 90, sweep: midSweep)
    }
}
write(mid, name: "ring-mid.png")

let inner = withContext {
    teal.setStroke()
    // slightly larger gap so round caps don’t close the ring
    strokeArc(radius: innerR, start: 18, sweep: 324)
}
write(inner, name: "ring-inner.png")
