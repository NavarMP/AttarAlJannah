"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";

const videos = [
    { src: "/assets/promo.webm", title: "Promo Video" },
    { src: "/assets/message.webm", title: "Message Video" }
];

export function PromoVideoSection() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        video.play();
                    } else {
                        video.pause();
                    }
                });
            },
            { threshold: 0.5 }
        );

        observer.observe(video);

        return () => {
            observer.disconnect();
        };
    }, []);

    // Reset video when switching
    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.load();
            video.play();
        }
    }, [currentVideoIndex]);

    const handlePrevious = () => {
        setCurrentVideoIndex((prev) => (prev === 0 ? videos.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentVideoIndex((prev) => (prev === videos.length - 1 ? 0 : prev + 1));
    };

    return (
        <section className="py-16 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold-500 mb-4">
                        Experience the Essence
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Discover the journey behind Attar al-Jannah
                    </p>
                </div>

                <Card className="glass-strong rounded-3xl overflow-hidden">
                    <CardContent className="p-0">
                        <div className="relative aspect-video w-full group">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                loop
                                muted
                                playsInline
                                controls
                            >
                                <source src={videos[currentVideoIndex].src} type="video/webm" />
                                Your browser does not support the video tag.
                            </video>

                            {/* Navigation Arrows */}
                            {videos.length > 1 && (
                                <>
                                    <Button
                                        onClick={handlePrevious}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 p-0"
                                        aria-label="Previous video"
                                    >
                                        <ChevronLeft className="w-6 h-6 text-white" />
                                    </Button>
                                    <Button
                                        onClick={handleNext}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 p-0"
                                        aria-label="Next video"
                                    >
                                        <ChevronRight className="w-6 h-6 text-white" />
                                    </Button>
                                </>
                            )}

                            {/* Play overlay for better UX */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Play className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            {/* Video indicator dots */}
                            {videos.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                    {videos.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentVideoIndex(index)}
                                            className={`w-2 h-2 rounded-full transition-all ${index === currentVideoIndex
                                                    ? "bg-white w-6"
                                                    : "bg-white/50 hover:bg-white/75"
                                                }`}
                                            aria-label={`Go to video ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
