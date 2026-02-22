"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PromoContent } from "@/types";
import Image from "next/image";

export function PromoSection() {
    const [promoContent, setPromoContent] = useState<PromoContent[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const supabase = createClient();
    const autoSwipeTimer = useRef<NodeJS.Timeout | null>(null);
    const pauseUntil = useRef<number>(0);

    useEffect(() => {
        const fetchContent = async () => {
            const { data } = await supabase
                .from('promo_content')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true })
                .order('created_at', { ascending: false });

            if (data && data.length > 0) {
                setPromoContent(data);
            }
        };

        fetchContent();
    }, [supabase]);

    // Auto-play observer for video
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        video.play().catch(() => { });
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
    }, [currentIndex, promoContent]); // Re-run when content changes

    // Reset video when switching
    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.load();
            video.play().catch(() => { });
        }
    }, [currentIndex]);

    const handlePrevious = useCallback(() => {
        pauseUntil.current = Date.now() + 10000; // pause auto-swipe for 10s after manual nav
        setCurrentIndex((prev) => (prev === 0 ? promoContent.length - 1 : prev - 1));
    }, [promoContent.length]);

    const handleNext = useCallback(() => {
        pauseUntil.current = Date.now() + 10000;
        setCurrentIndex((prev) => (prev === promoContent.length - 1 ? 0 : prev + 1));
    }, [promoContent.length]);

    // Auto-swipe interval
    useEffect(() => {
        if (promoContent.length <= 1) return;

        autoSwipeTimer.current = setInterval(() => {
            if (Date.now() < pauseUntil.current) return; // skip if user recently interacted
            setCurrentIndex((prev) => (prev === promoContent.length - 1 ? 0 : prev + 1));
        }, 5000);

        return () => {
            if (autoSwipeTimer.current) clearInterval(autoSwipeTimer.current);
        };
    }, [promoContent.length]);

    if (promoContent.length === 0) return null;

    const currentItem = promoContent[currentIndex];

    // Calculate aspect ratio class
    const getAspectRatioClass = (ratio: string) => {
        switch (ratio) {
            case '16:9': return 'aspect-video';
            case '9:16': return 'aspect-[9/16] max-w-sm mx-auto'; // Limit width for vertical content
            case '1:1': return 'aspect-square max-w-md mx-auto';
            case '4:5': return 'aspect-[4/5] max-w-md mx-auto';
            default: return 'aspect-video';
        }
    };

    return (
        <section className="py-16 px-4">
            <div className="max-w-5xl mx-auto">
                {/* <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold-500 mb-4">
                        Experience the Essence
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Discover the journey behind Attar al-Jannah
                    </p>
                </div> */}

                <div className="relative w-full group">
                    <Card className={`glass-strong rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${getAspectRatioClass(currentItem.aspect_ratio)}`}>
                        <CardContent className="p-0 h-full w-full bg-black">
                            {currentItem.type === 'video' && (
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-cover"
                                    loop
                                    muted
                                    playsInline
                                    controls
                                    poster={currentItem.thumbnail_url || undefined}
                                >
                                    <source src={currentItem.url} />
                                    Your browser does not support the video tag.
                                </video>
                            )}

                            {currentItem.type === 'image' && (
                                <Image
                                    src={currentItem.url}
                                    alt={currentItem.title}
                                    fill
                                    className="object-cover"
                                />
                            )}

                            {currentItem.type === 'youtube' && (
                                <iframe
                                    src={`https://www.youtube.com/embed/${getYouTubeId(currentItem.url)}?enablejsapi=1`}
                                    className="w-full h-full"
                                    title={currentItem.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            )}

                            {/* Navigation Arrows */}
                            {promoContent.length > 1 && (
                                <>
                                    <Button
                                        onClick={handlePrevious}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 p-0 transform hover:scale-110"
                                        aria-label="Previous item"
                                    >
                                        <ChevronLeft className="w-6 h-6 text-white" />
                                    </Button>
                                    <Button
                                        onClick={handleNext}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 p-0 transform hover:scale-110"
                                        aria-label="Next item"
                                    >
                                        <ChevronRight className="w-6 h-6 text-white" />
                                    </Button>
                                </>
                            )}

                            {/* Video Play Overlay (only for self-hosted video) */}
                            {currentItem.type === 'video' && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
                                        <Play className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                            )}

                            {/* Indicator Dots */}
                            {promoContent.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                    {promoContent.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentIndex(index)}
                                            className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                                ? "bg-white w-8"
                                                : "bg-white/50 hover:bg-white/75 w-2"
                                                }`}
                                            aria-label={`Go to item ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}

// Helper to extract YouTube ID
function getYouTubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
