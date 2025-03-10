'use client'

import aboutData from '@/data/about'
import Image from 'next/image'

export default function About() {
  return (
    <>
      {/* About Content */}
      <main className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Bio Section */}
          <section className="mb-20">
            <div className="content-section">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-1">
                  <div className="aspect-square rounded-lg overflow-hidden relative bg-foreground/10">
                    {/* Personal photo */}
                    <Image
                      src="/images/tarik/prague_1.png"
                      alt="Profile photo"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h1 className="text-4xl font-bold mb-2">{aboutData.name}</h1>
                  <h2 className="text-xl text-primary mb-6">{aboutData.title}</h2>

                  <div className="space-y-4">
                    {aboutData.bio.map((paragraph, index) => (
                      <p key={index} className="text-foreground/80">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Personal Life Section */}
          <section className="mb-20">

            <div className="content-section">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Image 1 */}
                <div className="relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                  <div style={{ paddingBottom: '177.77%' }} className="relative bg-foreground/10">
                    <Image
                      src="/images/tarik/hike.jpg"
                      alt="Personal life photo"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-sm">Enjoying the mountains</p>
                  </div>
                </div>

                {/* Image 2 */}
                <div className="relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                  <div style={{ paddingBottom: '177.77%' }} className="relative bg-foreground/10">
                    <Image
                      src="/images/tarik/weird.png"
                      alt="Personal life photo"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-sm">Stay messy, stay weird</p>
                  </div>
                </div>

                {/* Image 3 */}
                <div className="relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                  <div style={{ paddingBottom: '177.77%' }} className="relative bg-foreground/10">
                    <Image
                      src="/images/tarik/maximilen.jpg"
                      alt="Personal life photo"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-sm">I love taking photos. Check out my Instagram!</p>
                  </div>
                </div>

                {/* Image 4 */}
                <div className="relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                  <div style={{ paddingBottom: '177.77%' }} className="relative bg-foreground/10">
                    <Image
                      src="/images/tarik/cassette.jpg"
                      alt="Personal life photo"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-sm">My cassette collection</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Social Media Links Section */}
          <section className="mb-20">
            <div className="content-section">
              <div className="bg-foreground/5 dark:bg-foreground/10 p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold mb-6 text-center">Connect With Me</h3>
                <div className="flex flex-wrap justify-center gap-8">
                  {/* Instagram */}
                  <a
                    href="https://instagram.com/_tariqueue_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center group transition-transform hover:scale-110"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-yellow-500 flex items-center justify-center shadow-md mb-3">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                    <span className="text-foreground/80 group-hover:text-foreground">Instagram</span>
                  </a>

                  {/* Spotify */}
                  <a
                    href="https://open.spotify.com/user/morvanpir"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center group transition-transform hover:scale-110"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-green-500 to-green-400 flex items-center justify-center shadow-md mb-3">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                    </div>
                    <span className="text-foreground/80 group-hover:text-foreground">Spotify</span>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href="https://linkedin.com/in/tariksldr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center group transition-transform hover:scale-110"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center shadow-md mb-3">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    <span className="text-foreground/80 group-hover:text-foreground">LinkedIn</span>
                  </a>

                  {/* Duolingo */}
                  <a
                    href="https://www.duolingo.com/profile/tarikisildar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center group transition-transform hover:scale-110"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-green-500 to-teal-400 flex items-center justify-center shadow-md mb-3">
                      <Image
                        src="/duo.svg"
                        alt="Duolingo"
                        width={72}
                        height={72}
                        className="w-16 h-16 text-white"
                      />
                    </div>
                    <span className="text-foreground/80 group-hover:text-foreground">Duolingo</span>
                  </a>

                  {/* Microsoft Teams (Rickroll) */}
                  <a
                    href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center group transition-transform hover:scale-110"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gray-300 to-gray-300 flex items-center justify-center shadow-md mb-3">
                      <Image
                        src="/teams.svg"
                        alt="Microsoft Teams"
                        width={72}
                        height={72}
                        className="w-10 h-10 text-white"
                      />
                    </div>
                    <span className="text-foreground/80 group-hover:text-foreground">Teams</span>
                  </a>
                </div>
              </div>
            </div>
          </section>


        </div>
      </main>
    </>
  )
}