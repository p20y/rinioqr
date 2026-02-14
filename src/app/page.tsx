
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white text-center space-y-8">
            <main className="flex flex-col gap-6 items-center max-w-2xl">
                <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl text-gray-900">
                    Rinio<span className="text-orange-500">QR</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-[600px]">
                    Generate smart QR codes for your Amazon products to simplify the review process for your customers.
                </p>

                <div className="flex gap-4">
                    <Button asChild size="lg" className="h-12 px-8 text-lg">
                        <Link href="/seller">
                            Go to Seller Dashboard
                        </Link>
                    </Button>
                </div>
            </main>

            <footer className="absolute bottom-8 text-sm text-gray-400">
                © {new Date().getFullYear()} RinioQR. Built for Sellers.
            </footer>
        </div>
    )
}
