"use client"
/**
 * v0 by Vercel.
 * @see https://v0.dev/t/tFqbmV0Nrsx
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function Component() {
  return (
    <div 
      className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-[#1E293B] to-[#0F172A] text-white"
      style={{
        backgroundImage: "url('/LightBackground.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <header className="py-8 px-4 md:px-6 lg:px-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl text-white">Lit Alpha Box</h1>
        </div>
      </header>
      <main className="flex-1 py-12 px-4 md:px-6 lg:px-8">
        <div className="container mx-auto max-w-3xl space-y-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">The Wisdom of Crowds</h2>
            <p className="mt-4 text-lg text-gray-400">
                Harness the collective intelligence of the community to make informed decisions.  The wisdom of crowds principle suggests that collective decision-making, when diverse and independent, can lead to more accurate outcomes than relying on individual experts.  Share your predictions to learn what others are thinking!
            </p>
          </div>
          <div>
            <label htmlFor="prediction" className="block text-sm font-medium">
              What are your predictions for BTC, ETH, and LIT Protocol?
            </label>
            <div className="mt-1 flex flex-col gap-2">
              <Textarea
                id="prediction"
                name="prediction"
                rows={3}
                className="block w-full rounded-md border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-primary focus:ring-primary"
                placeholder="Enter your prediction..."
              />
              <Button className="flex-shrink-0" onClick={() => console.log("Submit prediction")}>
                1. Submit prediction
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Button className="flex-1" onClick={() => console.log("Mint NFT")}>
              2. Mint NFT
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => console.log("Unlock Alpha")}>
              3. Unlock Alpha
            </Button>
            <div className="bg-gray-800 p-4 rounded-md">
              <p>Click unlock alpha to see text here</p>
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-gray-800 py-6 px-4 md:px-6 lg:px-8">
        <div className="container mx-auto text-center text-sm text-gray-400">
          &copy; 2024 Lit Alpha Box. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
