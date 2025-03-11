'use client'

import Link from 'next/link'

export default function CV() {
  // Convert a standard Google Drive file URL to an embed URL
  // Example input: https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing
  // You'll need to replace YOUR_GOOGLE_DRIVE_PDF_URL with your actual Google Drive PDF URL
  const googleDriveFileUrl = "https://drive.google.com/file/d/1lECifvuwI0C0rcDrEyp-JhCZPJO3Hddc/view?usp=sharing"

  // Extract the file ID from the Google Drive URL
  const getEmbedUrl = (url: string) => {
    // For a URL like https://drive.google.com/file/d/ABCDEFG/view?usp=sharing
    // We need to extract the file ID (ABCDEFG in this example)
    const match = url.match(/\/d\/(.+?)\//)
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`
    }
    return url // Return original if we can't extract the ID
  }

  const embedUrl = getEmbedUrl(googleDriveFileUrl)

  const handlePrint = () => {
    // Open the direct PDF URL in a new tab for printing
    window.open(googleDriveFileUrl, '_blank')
  }

  const handleDownload = () => {
    // Generate a download URL from the file ID
    const match = googleDriveFileUrl.match(/\/d\/(.+?)\//)
    if (match && match[1]) {
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`
      window.open(downloadUrl, '_blank')
    }
  }

  return (
    <main className="py-20 px-4 print:pt-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 print:hidden flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-4xl font-bold mb-4 sm:mb-0">Curriculum Vitae</h1>
          <div className="flex space-x-4">
            <button
              onClick={handlePrint}
              className="border border-foreground/20 hover:border-primary text-foreground hover:text-primary px-6 py-2 rounded-full font-medium transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
              </svg>
              Print CV
            </button>
            <button
              onClick={handleDownload}
              className="border border-foreground/20 hover:border-primary text-foreground hover:text-primary px-6 py-2 rounded-full font-medium transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download CV
            </button>
            <Link
              href="/about"
              className="border border-foreground/20 hover:border-primary text-foreground hover:text-primary px-6 py-2 rounded-full font-medium transition-colors"
            >
              Back to About
            </Link>
          </div>
        </div>

        {/* CV PDF Viewer */}
        <div className="w-full h-[1200px] rounded-lg overflow-hidden shadow-lg">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="autoplay"
            title="CV PDF"
          ></iframe>
        </div>
      </div>
    </main>
  )
}