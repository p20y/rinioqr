import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')
    const asin = searchParams.get('asin')

    if (!url || !asin) {
        return NextResponse.json({ error: 'Missing url or asin parameter' }, { status: 400 })
    }

    try {
        // Try multiple Amazon image URL formats
        const imageFormats = [
            `https://images-na.ssl-images-amazon.com/images/P/${asin}.jpg`,
            `https://m.media-amazon.com/images/I/${asin}.jpg`,
            `https://images-na.ssl-images-amazon.com/images/I/${asin}._AC_SL1500_.jpg`,
        ]

        // Test each format to find a working image
        for (const imgUrl of imageFormats) {
            try {
                const response = await fetch(imgUrl, { method: 'HEAD' })
                if (response.ok) {
                    const contentType = response.headers.get('content-type')
                    if (contentType && contentType.startsWith('image/')) {
                        return NextResponse.json({ imageUrl: imgUrl })
                    }
                }
            } catch {
                // Continue to next format
                continue
            }
        }

        // If standard formats don't work, try to scrape from the product page
        try {
            const pageResponse = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            })
            const html = await pageResponse.text()

            // Extract image URL from HTML using regex
            // Amazon uses various attributes for images
            const imagePatterns = [
                /"hiRes":"([^"]+)"/,
                /"large":"([^"]+)"/,
                /data-old-hires="([^"]+)"/,
                /"landingImageUrl":"([^"]+)"/,
                /data-a-dynamic-image="([^"]+)"/
            ]

            for (const pattern of imagePatterns) {
                const match = html.match(pattern)
                if (match && match[1]) {
                    let imageUrl = match[1]
                    // Handle escaped characters
                    imageUrl = imageUrl.replace(/\\u002F/g, '/')
                    imageUrl = imageUrl.replace(/\\\//g, '/')

                    // If it's a dynamic image JSON, extract the first URL
                    if (imageUrl.startsWith('{')) {
                        try {
                            const imageObj = JSON.parse(imageUrl)
                            const firstUrl = Object.keys(imageObj)[0]
                            if (firstUrl) {
                                return NextResponse.json({ imageUrl: firstUrl })
                            }
                        } catch {
                            continue
                        }
                    } else if (imageUrl.startsWith('http')) {
                        return NextResponse.json({ imageUrl })
                    }
                }
            }
        } catch (error) {
            console.error('Error scraping Amazon page:', error)
        }

        // If all methods fail, return null
        return NextResponse.json({ imageUrl: null })
    } catch (error) {
        console.error('Error fetching product image:', error)
        return NextResponse.json({ error: 'Failed to fetch product image' }, { status: 500 })
    }
}
