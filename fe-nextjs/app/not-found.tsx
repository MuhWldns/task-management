"use client";
import Image from "next/image";
import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="text-center max-w-2xl">
        {/* Image */}
        <div className="mb-8">
          <Image
            src="data:image/jpeg;base64,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"
            alt="404 Not Found"
            width={500}
            height={400}
            className="rounded-lg mx-auto"
          />
        </div>

        {/* Error Text */}
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-blue-600 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">NOT FOUND</h2>
          <p className="text-xl text-gray-600">PAGENYA GAK ADA WLEOLEOL </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/" className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
            <Home className="mr-2 h-5 w-5" />
            Balik ke Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-8 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Balik ke Halaman Sebelumnya
          </button>
        </div>
      </div>
    </div>
  );
}
