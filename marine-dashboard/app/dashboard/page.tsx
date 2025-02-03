"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll } from "framer-motion"
import Sidebar from "../components/sidebar"

const DashboardPage = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ container: containerRef })
  const [ballPosition, setBallPosition] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollPosition = containerRef.current.scrollTop
        setBallPosition(Math.min(scrollPosition / 2, 400)) // Adjust 400 based on your needs
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll)
      }
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#001F29] to-[#003543]">
      <Sidebar />

      <main ref={containerRef} className="flex-1 p-8 ml-24 mr-12 relative overflow-y-auto h-screen">
        <div className="relative z-30 space-y-48">
          {/* Box 1 - Upload Process */}
          <section className="content-box">
            <div className="bg-white/5 rounded-2xl p-10 backdrop-blur-xl border border-[#3BF4C7]/20">
              <h2 className="text-4xl font-bold text-[#3BF4C7] mb-8">Secure Upload Protocol</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-6">
                  <div className="w-1/2">
                    <h3 className="text-2xl text-white mb-4">Military-Grade Encryption</h3>
                    <p className="text-gray-300 leading-relaxed">
                      All uploads protected with AES-256 encryption during transfer and at rest. End-to-end security
                      protocol ensures maximum protection.
                    </p>
                  </div>
                  <div className="w-1/2">
                    <h3 className="text-2xl text-white mb-4">Blockchain Anchoring</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Immediate blockchain notarization on upload completion. Permanent timestamp proof stored across
                      multiple chains.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Box 2 - Hashing Process */}
          <section className="content-box">
            <div className="bg-white/5 rounded-2xl p-10 backdrop-blur-xl border border-[#3BF4C7]/20">
              <h2 className="text-4xl font-bold text-[#3BF4C7] mb-8">Advanced Hashing Matrix</h2>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-2xl text-white">Perceptual Hashing</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Multi-layer hash generation combining DCT coefficients and temporal sampling for video content
                    fingerprinting.
                  </p>
                </div>
                <div className="space-y-6">
                  <h3 className="text-2xl text-white">Blockchain Hashing</h3>
                  <p className="text-gray-300 leading-relaxed">
                    SHA-3 cryptographic hashing combined with Merkle tree structures for immutable content verification.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Box 3 - Verification System */}
          <section className="content-box">
            <div className="bg-white/5 rounded-2xl p-10 backdrop-blur-xl border border-[#3BF4C7]/20">
              <h2 className="text-4xl font-bold text-[#3BF4C7] mb-8">Global Verification Network</h2>
              <div className="flex space-x-8">
                <div className="w-1/2">
                  <h3 className="text-2xl text-white mb-4">Distributed Node System</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Worldwide node network for real-time content verification. Geographic redundancy ensures 100%
                    uptime.
                  </p>
                </div>
                <div className="w-1/2">
                  <h3 className="text-2xl text-white mb-4">AI Monitoring</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Deep learning models constantly scan global networks for content matches and potential
                    infringements.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Connecting line and ball */}
        <div className="fixed left-1/2 top-0 bottom-0 w-0.5 bg-[#3BF4C7] opacity-50" />
        <motion.div
          className="fixed left-1/2 w-6 h-6 bg-[#3BF4C7] rounded-full z-20 shadow-glow"
          style={{
            y: ballPosition,
            x: "-50%",
          }}
        />
      </main>
    </div>
  )
}

export default DashboardPage

