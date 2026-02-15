'use client'

import { useEffect, useRef } from 'react'
import QRCodeStyling, { Options, DotType, CornerDotType, CornerSquareType } from 'qr-code-styling'

export type QRPattern = 'square' | 'dots' | 'rounded'
export type QRCorner = 'square' | 'rounded'
export type QRFrame = 'none' | 'border' | 'scan-me' | 'scan-me-arrow'

export interface QRCodeStyledProps {
  value: string
  size?: number
  pattern?: QRPattern
  corner?: QRCorner
  color?: string
  frame?: QRFrame
  frameText?: string
}

const PATTERN_MAP: Record<QRPattern, DotType> = {
  square: 'square',
  dots: 'dots',
  rounded: 'rounded'
}

const CORNER_MAP: Record<QRCorner, CornerSquareType> = {
  square: 'square',
  rounded: 'extra-rounded'
}

export function QRCodeStyled({
  value,
  size = 256,
  pattern = 'square',
  corner = 'square',
  color = '#000000',
  frame = 'none',
  frameText = 'SCAN ME'
}: QRCodeStyledProps) {
  const ref = useRef<HTMLDivElement>(null)
  const qrCode = useRef<QRCodeStyling | null>(null)

  useEffect(() => {
    if (!ref.current) return

    const options: Options = {
      width: size,
      height: size,
      data: value,
      margin: frame === 'none' ? 10 : 20,
      qrOptions: {
        errorCorrectionLevel: 'H'
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.4,
        margin: 0
      },
      dotsOptions: {
        color: color,
        type: PATTERN_MAP[pattern]
      },
      backgroundOptions: {
        color: '#ffffff'
      },
      cornersSquareOptions: {
        color: color,
        type: CORNER_MAP[corner]
      },
      cornersDotOptions: {
        color: color,
        type: corner === 'rounded' ? 'dot' as CornerDotType : 'square' as CornerDotType
      }
    }

    if (!qrCode.current) {
      qrCode.current = new QRCodeStyling(options)
      qrCode.current.append(ref.current)
    } else {
      qrCode.current.update(options)
    }
  }, [value, size, pattern, corner, color, frame, frameText])

  if (frame === 'none') {
    return <div ref={ref} className="inline-block" />
  }

  if (frame === 'border') {
    return (
      <div className="inline-block border-4 border-black rounded-lg p-2">
        <div ref={ref} />
      </div>
    )
  }

  if (frame === 'scan-me') {
    return (
      <div className="inline-block border-4 border-black rounded-lg p-3">
        <div ref={ref} />
        <div className="text-center font-bold text-sm mt-2 tracking-wider">
          {frameText}
        </div>
      </div>
    )
  }

  if (frame === 'scan-me-arrow') {
    return (
      <div className="inline-block border-2 border-gray-800 rounded-2xl p-4 relative">
        <div ref={ref} />
        <div className="text-center font-serif italic text-base mt-3 flex items-center justify-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{frameText}</span>
        </div>
      </div>
    )
  }

  return <div ref={ref} className="inline-block" />
}
