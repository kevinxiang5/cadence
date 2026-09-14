import AppKit
import Foundation
import ImageIO

/// App Store / Play / social banners from real speac screenshots.
/// iPhone 6.9" required size: 1320 × 2868, RGB, no alpha (Apple spec 2026).

let root = URL(fileURLWithPath: CommandLine.arguments.dropFirst().first(where: { !$0.hasPrefix("-") })
    ?? "/Users/kevin/Projects/cadence/assets/store")

let parchment = NSColor(srgbRed: 243 / 255, green: 237 / 255, blue: 227 / 255, alpha: 1)
let teal = NSColor(srgbRed: 14 / 255, green: 77 / 255, blue: 74 / 255, alpha: 1)
let muted = NSColor(srgbRed: 107 / 255, green: 122 / 255, blue: 120 / 255, alpha: 1)
let bezel = NSColor(srgbRed: 20 / 255, green: 36 / 255, blue: 36 / 255, alpha: 1)

func bitmap(width: Int, height: Int) -> NSBitmapImageRep {
    let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: width,
        pixelsHigh: height,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    )!
    rep.size = NSSize(width: width, height: height)
    return rep
}

/// Flatten to RGB PNG with no alpha — App Store Connect rejects transparency.
func flattenOpaque(_ src: NSBitmapImageRep) -> Data {
    let w = src.pixelsWide
    let h = src.pixelsHigh
    guard let srcCG = src.cgImage else { fatalError("no cgImage") }
    let space = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(
        data: nil,
        width: w,
        height: h,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: space,
        bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
    ) else { fatalError("flatten ctx") }
    ctx.setFillColor(parchment.cgColor)
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    ctx.draw(srcCG, in: CGRect(x: 0, y: 0, width: w, height: h))
    guard let out = ctx.makeImage() else { fatalError("flatten image") }
    let dest = NSMutableData()
    guard let destCG = CGImageDestinationCreateWithData(dest, "public.png" as CFString, 1, nil) else {
        fatalError("png dest")
    }
    CGImageDestinationAddImage(destCG, out, [
        kCGImagePropertyHasAlpha: false,
        kCGImageDestinationLossyCompressionQuality: 1,
    ] as CFDictionary)
    CGImageDestinationFinalize(destCG)
    return dest as Data
}

func serif(_ size: CGFloat, weight: NSFont.Weight = .bold) -> NSFont {
    let names = ["NewYork-Bold", "NewYork-Heavy", "IowanOldStyle-Bold", "Palatino-Bold"]
    for name in names {
        if let f = NSFont(name: name, size: size) { return f }
    }
    return NSFont.systemFont(ofSize: size, weight: weight)
}

func sans(_ size: CGFloat, weight: NSFont.Weight = .medium) -> NSFont {
    NSFont.systemFont(ofSize: size, weight: weight)
}

func drawCentered(
    _ text: String,
    font: NSFont,
    color: NSColor,
    in box: NSRect,
    lineHeight: CGFloat? = nil,
    pinBottom: Bool = false
) {
    let para = NSMutableParagraphStyle()
    para.alignment = .center
    if let lineHeight {
        para.minimumLineHeight = lineHeight
        para.maximumLineHeight = lineHeight
    }
    let attrs: [NSAttributedString.Key: Any] = [
        .font: font,
        .foregroundColor: color,
        .paragraphStyle: para,
        .kern: -0.8,
    ]
    let bounds = (text as NSString).boundingRect(
        with: NSSize(width: box.width, height: 800),
        options: [.usesLineFragmentOrigin, .usesFontLeading],
        attributes: attrs
    )
    let y = pinBottom ? box.minY : box.midY - bounds.height / 2
    let rect = NSRect(
        x: box.minX,
        y: y,
        width: box.width,
        height: bounds.height
    )
    (text as NSString).draw(in: rect, withAttributes: attrs)
}

func loadShot(_ name: String) -> NSImage {
    let url = root.appendingPathComponent("source/\(name).png")
    guard let img = NSImage(contentsOf: url) else {
        fputs("missing \(url.path)\n", stderr)
        exit(1)
    }
    return img
}

func drawPhone(shot: NSImage, in frame: NSRect) {
    let radius: CGFloat = 72
    let inset: CGFloat = 18

    NSGraphicsContext.current?.saveGraphicsState()
    let shadow = NSShadow()
    shadow.shadowColor = NSColor(srgbRed: 20 / 255, green: 36 / 255, blue: 36 / 255, alpha: 0.22)
    shadow.shadowBlurRadius = 36
    shadow.shadowOffset = NSSize(width: 0, height: -18)
    shadow.set()
    bezel.setFill()
    NSBezierPath(roundedRect: frame, xRadius: radius, yRadius: radius).fill()
    NSGraphicsContext.current?.restoreGraphicsState()

    bezel.setFill()
    NSBezierPath(roundedRect: frame, xRadius: radius, yRadius: radius).fill()

    let screen = frame.insetBy(dx: inset, dy: inset)
    let screenPath = NSBezierPath(roundedRect: screen, xRadius: radius - 10, yRadius: radius - 10)
    NSGraphicsContext.current?.saveGraphicsState()
    screenPath.addClip()
    let src = shot.size
    let scale = max(screen.width / src.width, screen.height / src.height)
    let drawW = src.width * scale
    let drawH = src.height * scale
    let drawRect = NSRect(
        x: screen.midX - drawW / 2,
        y: screen.midY - drawH / 2,
        width: drawW,
        height: drawH
    )
    shot.draw(in: drawRect, from: .zero, operation: .sourceOver, fraction: 1)
    NSGraphicsContext.current?.restoreGraphicsState()
}

struct Slide {
    let file: String
    let headline: String
    let sub: String
    let outName: String
}

func renderIPadPortrait(_ slide: Slide) {
    // 13" iPad Pro / Air — required if the app runs on iPad (Apple 2026 spec).
    let W = 2064
    let H = 2752
    let rep = bitmap(width: W, height: H)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    NSGraphicsContext.current?.imageInterpolation = .high
    NSGraphicsContext.current?.shouldAntialias = true

    parchment.setFill()
    NSBezierPath(rect: NSRect(x: 0, y: 0, width: W, height: H)).fill()

    let shot = loadShot(slide.file)
    let phoneW: CGFloat = 1040
    let phoneH: CGFloat = 1978
    let phoneX = (CGFloat(W) - phoneW) / 2
    let phoneY: CGFloat = 248
    drawPhone(shot: shot, in: NSRect(x: phoneX, y: phoneY, width: phoneW, height: phoneH))

    let headlineBox = NSRect(
        x: 72,
        y: 2268,
        width: CGFloat(W) - 144,
        height: 360
    )
    drawCentered(
        slide.headline,
        font: serif(108),
        color: teal,
        in: headlineBox,
        lineHeight: 120,
        pinBottom: slide.headline.contains("\n")
    )
    drawCentered(
        "speac",
        font: serif(48),
        color: teal,
        in: NSRect(x: 120, y: 84, width: CGFloat(W) - 240, height: 76)
    )

    NSGraphicsContext.restoreGraphicsState()
    write(rep, name: slide.outName)
}

func renderPortrait(_ slide: Slide) {
    let W = 1320
    let H = 2868
    let rep = bitmap(width: W, height: H)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    NSGraphicsContext.current?.imageInterpolation = .high
    NSGraphicsContext.current?.shouldAntialias = true

    parchment.setFill()
    NSBezierPath(rect: NSRect(x: 0, y: 0, width: W, height: H)).fill()

    let shot = loadShot(slide.file)
    // Same frame on all three slides so 2 matches 1 and 3.
    let phoneW: CGFloat = 1000
    let phoneH: CGFloat = 1902
    let phoneX = (CGFloat(W) - phoneW) / 2
    let phoneY: CGFloat = 308
    drawPhone(shot: shot, in: NSRect(x: phoneX, y: phoneY, width: phoneW, height: phoneH))

    // Headline stays where 1 and 3 already are — not tied to the phone.
    let headlineBox = NSRect(
        x: 28,
        y: 2355,
        width: CGFloat(W) - 56,
        height: 280
    )
    drawCentered(
        slide.headline,
        font: serif(118),
        color: teal,
        in: headlineBox,
        lineHeight: 128,
        pinBottom: slide.headline.contains("\n")
    )
    drawCentered(
        "speac",
        font: serif(44),
        color: teal,
        in: NSRect(x: 80, y: 88, width: CGFloat(W) - 160, height: 70)
    )

    NSGraphicsContext.restoreGraphicsState()
    write(rep, name: slide.outName)
}

func renderWideBanner() {
    let W = 1920
    let H = 1080
    let rep = bitmap(width: W, height: H)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    NSGraphicsContext.current?.imageInterpolation = .high

    parchment.setFill()
    NSBezierPath(rect: NSRect(x: 0, y: 0, width: W, height: H)).fill()

    drawCentered(
        "speac",
        font: serif(64),
        color: teal,
        in: NSRect(x: 64, y: 640, width: 620, height: 90)
    )
    drawCentered(
        "Two minutes.\nThen you’re sharper.",
        font: serif(42),
        color: teal,
        in: NSRect(x: 64, y: 430, width: 620, height: 160),
        lineHeight: 52
    )
    drawCentered(
        "On-device speaking coach. No account.",
        font: sans(24, weight: .medium),
        color: muted,
        in: NSRect(x: 64, y: 340, width: 620, height: 40)
    )

    let shots = ["library", "today", "coach"].map(loadShot)
    let phoneW: CGFloat = 340
    let origins: [CGPoint] = [
        CGPoint(x: 760, y: 90),
        CGPoint(x: 1080, y: 140),
        CGPoint(x: 1400, y: 90),
    ]
    for (i, shot) in shots.enumerated() {
        let h = phoneW * (shot.size.height / shot.size.width)
        drawPhone(shot: shot, in: NSRect(x: origins[i].x, y: origins[i].y, width: phoneW, height: h))
    }

    NSGraphicsContext.restoreGraphicsState()
    write(rep, name: "banner-1920x1080.png")
}

func renderPlayFeature() {
    let W = 1024
    let H = 500
    let rep = bitmap(width: W, height: H)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    NSGraphicsContext.current?.imageInterpolation = .high

    parchment.setFill()
    NSBezierPath(rect: NSRect(x: 0, y: 0, width: W, height: H)).fill()

    drawCentered(
        "speac",
        font: serif(56),
        color: teal,
        in: NSRect(x: 40, y: 300, width: 420, height: 80)
    )
    drawCentered(
        "Two minutes.\nThen you’re sharper.",
        font: serif(28),
        color: teal,
        in: NSRect(x: 40, y: 160, width: 420, height: 100),
        lineHeight: 36
    )
    drawCentered(
        "On-device. No account.",
        font: sans(18, weight: .medium),
        color: muted,
        in: NSRect(x: 40, y: 90, width: 420, height: 30)
    )

    let shot = loadShot("today")
    let phoneW: CGFloat = 230
    let phoneH = phoneW * (shot.size.height / shot.size.width)
    drawPhone(shot: shot, in: NSRect(x: 720, y: (CGFloat(H) - phoneH) / 2, width: phoneW, height: phoneH))

    NSGraphicsContext.restoreGraphicsState()
    write(rep, name: "play-feature-1024x500.png")
}

func renderThumb() {
    let S = 1024
    let rep = bitmap(width: S, height: S)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    NSGraphicsContext.current?.shouldAntialias = true

    parchment.setFill()
    NSBezierPath(rect: NSRect(x: 0, y: 0, width: S, height: S)).fill()

    let cx: CGFloat = 512
    let cy: CGFloat = 600
    let stroke: CGFloat = 36
    teal.setStroke()

    func fullRing(_ r: CGFloat) {
        let path = NSBezierPath(ovalIn: NSRect(x: cx - r, y: cy - r, width: r * 2, height: r * 2))
        path.lineWidth = stroke
        path.stroke()
    }
    func quarterRing(_ r: CGFloat) {
        let gap: CGFloat = 28
        let starts: [CGFloat] = [gap / 2, 90 + gap / 2, 180 + gap / 2, 270 + gap / 2]
        let sweep: CGFloat = 90 - gap
        for start in starts {
            let path = NSBezierPath()
            path.appendArc(withCenter: NSPoint(x: cx, y: cy), radius: r, startAngle: start, endAngle: start + sweep)
            path.lineWidth = stroke
            path.lineCapStyle = .round
            path.stroke()
        }
    }
    fullRing(210)
    quarterRing(148)
    fullRing(86)

    drawCentered("speac", font: serif(92), color: teal, in: NSRect(x: 80, y: 170, width: 864, height: 120))
    drawCentered("daily speech", font: sans(28, weight: .medium), color: muted, in: NSRect(x: 80, y: 110, width: 864, height: 40))

    NSGraphicsContext.restoreGraphicsState()
    write(rep, name: "thumb-1024.png")
    write(rep, name: "app-icon-1024.png")
}

func write(_ rep: NSBitmapImageRep, name: String) {
    let url = root.appendingPathComponent(name)
    let png = flattenOpaque(rep)
    try! png.write(to: url)
    print("wrote \(url.lastPathComponent)  \(rep.pixelsWide)×\(rep.pixelsHigh)  \(png.count / 1024)KB")
}

let slides = [
    Slide(file: "today", headline: "Two minutes.\nThen you’re sharper.", sub: "Daily speaking coach. On this phone.", outName: "01-today-1320x2868.png"),
    Slide(file: "coach", headline: "Drills that stick.", sub: "Same talk. Tighter each time.", outName: "02-coach-1320x2868.png"),
    Slide(file: "library", headline: "A prompt.\nOut loud.", sub: "Interview, debate, story, pitch.", outName: "03-library-1320x2868.png"),
]

let ipadSlides = [
    Slide(file: "today", headline: "Two minutes.\nThen you’re sharper.", sub: "Daily speaking coach. On this phone.", outName: "01-today-2064x2752.png"),
    Slide(file: "coach", headline: "Drills that stick.", sub: "Same talk. Tighter each time.", outName: "02-coach-2064x2752.png"),
    Slide(file: "library", headline: "A prompt.\nOut loud.", sub: "Interview, debate, story, pitch.", outName: "03-library-2064x2752.png"),
]

if CommandLine.arguments.contains("--ipad-only") {
    for slide in ipadSlides { renderIPadPortrait(slide) }
    print("done")
    exit(0)
}

for slide in slides { renderPortrait(slide) }
for slide in ipadSlides { renderIPadPortrait(slide) }
renderWideBanner()
renderPlayFeature()
renderThumb()

// Optional 6.5" copies via sips-equivalent scale
for name in ["01-today", "02-coach", "03-library"] {
    let src = root.appendingPathComponent("\(name)-1320x2868.png")
    guard let img = NSImage(contentsOf: src) else { continue }
    let rep = bitmap(width: 1290, height: 2796)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    NSGraphicsContext.current?.imageInterpolation = .high
    img.draw(in: NSRect(x: 0, y: 0, width: 1290, height: 2796), from: .zero, operation: .sourceOver, fraction: 1)
    NSGraphicsContext.restoreGraphicsState()
    write(rep, name: "\(name)-1290x2796.png")
}

print("done")
