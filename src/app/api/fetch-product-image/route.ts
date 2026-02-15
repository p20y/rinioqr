import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')
    const asin = searchParams.get('asin')

    if (!url || !asin) {
        return NextResponse.json({ error: 'Missing url or asin parameter' }, { status: 400 })
    }

    try {
        // Fetch the Amazon product page
        const pageResponse = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0'
            }
        })

        if (!pageResponse.ok) {
            console.error('Failed to fetch Amazon page:', pageResponse.status)
            return NextResponse.json({ imageUrl: null })
        }

        const html = await pageResponse.text()
        const $ = cheerio.load(html)

        // Try multiple selectors to find the product image
        let imageUrl = null

        // Method 1: Main product image
        imageUrl = $('#landingImage').attr('src') || $('#landingImage').attr('data-old-hires')

        // Method 2: Image block
        if (!imageUrl) {
            imageUrl = $('#imgBlkFront').attr('src') || $('#imgBlkFront').attr('data-old-hires')
        }

        // Method 3: Alternative main image
        if (!imageUrl) {
            imageUrl = $('img.a-dynamic-image').first().attr('src') || $('img.a-dynamic-image').first().attr('data-old-hires')
        }

        // Method 4: Parse from JSON data
        if (!imageUrl) {
            const scriptTags = $('script').toArray()
            for (const script of scriptTags) {
                const content = $(script).html() || ''

                // Look for image data in various formats
                const patterns = [
                    /"hiRes":"([^"]+)"/,
                    /"large":"([^"]+)"/,
                    /"landingImageUrl":"([^"]+)"/,
                ]

                for (const pattern of patterns) {
                    const match = content.match(pattern)
                    if (match && match[1]) {
                        imageUrl = match[1].replace(/\\u002F/g, '/').replace(/\\\//g, '/')
                        break
                    }
                }
                if (imageUrl) break
            }
        }

        // Clean up the image URL
        if (imageUrl) {
            // Remove Amazon's dynamic sizing parameters for a clean URL
            imageUrl = imageUrl.split('._')[0] + '.jpg'

            // Ensure it's a full URL
            if (!imageUrl.startsWith('http')) {
                imageUrl = 'https:' + imageUrl
            }

            return NextResponse.json({ imageUrl })
        }

        return NextResponse.json({ imageUrl: null })
    } catch (error) {
        console.error('Error fetching product image:', error)
        return NextResponse.json({ imageUrl: null })
    }
}
