"use client";

import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin } from "lucide-react";
import { FaInstagram, FaYoutube, FaWhatsapp } from "react-icons/fa";

export function Footer() {
    const currentYear = new Date().getFullYear();

    const contactInfo = {
        phones: ['+91 907 235 8001', '+91 907 235 8002'],
        email: 'minhajuljanna786@gmail.com',
        locations: [
            {
                name: 'Naduvannur',
                mapUrl: 'https://maps.app.goo.gl/gT7RwZSpQqmjpqV38'
            },
            {
                name: 'Pullaloor',
                mapUrl: 'https://maps.app.goo.gl/mXJCQo9cKFyygfqY6'
            },
            {
                name: 'Koduvally',
                mapUrl: 'https://maps.app.goo.gl/17bmxLvf7SXiJLag6'
            }
        ],
        social: [
            { name: 'Instagram', icon: FaInstagram, url: 'https://instagram.com/minhajul_janna_/' },
            { name: 'Youtube', icon: FaYoutube, url: 'https://youtube.com/@minhajuljanna' },
            { name: 'WhatsApp', icon: FaWhatsapp, url: 'https://whatsapp.com/channel/0029VaxowK2DzgTE7cdK4G11' }
        ]
    };

    return (
        <footer className="relative py-12 px-4 border-t border-border bg-gradient-to-b from-background to-primary/5 dark:to-primary/10">
            <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    {/* Brand Section with Logo */}
                    <div className="md:col-span-1 space-y-3">
                        <div className="flex justify-center md:justify-start">
                            <Image
                                src="/assets/dars logo.svg"
                                alt="Minhajul Janna Dars"
                                width={120}
                                height={120}
                                className="w-24 h-auto dark:brightness-[180%] dark:contrast-75 transition-all"
                            />
                        </div>
                        <div className="flex justify-center md:justify-start">
                            <Image
                                src="/assets/typography.svg"
                                alt="عطر الجنّة"
                                width={200}
                                height={60}
                                className="h-12 w-auto"
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Essence of Minhajul Janna
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                            Made with ❤️ for spreading the fragrance of Paradise
                        </p>
                    </div>

                    {/* Contact Section */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-foreground">Contact Us</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                                <Link
                                    href={`mailto:${contactInfo.email}`}
                                    className="hover:text-primary transition-colors break-all"
                                >
                                    {contactInfo.email}
                                </Link>
                            </div>
                            {contactInfo.phones.map((phone, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                                    <Link
                                        href={`tel:${phone.replace(/\s/g, '')}`}
                                        className="hover:text-primary transition-colors"
                                    >
                                        {phone}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Locations Section */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-foreground">Our Locations</h4>
                        <div className="space-y-2">
                            {contactInfo.locations.map((location, index) => (
                                <Link
                                    key={index}
                                    href={location.mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                                    {location.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Social Media Section */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-foreground">Follow Us</h4>
                        <div className="flex gap-3">
                            {contactInfo.social.map((platform, index) => {
                                const IconComponent = platform.icon;
                                return (
                                    <Link
                                        key={index}
                                        href={platform.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group"
                                        aria-label={platform.name}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors group-hover:scale-110 duration-200">
                                            <IconComponent className="w-5 h-5 text-primary" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                        <p className="text-xs text-muted-foreground/70 mt-2">
                            Stay connected with our community
                        </p>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

                {/* Copyright & Developer Credit */}
                <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                        © {currentYear} Minhajul Janna Dars. All rights reserved.
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                        Developed by{" "}
                        <Link
                            href="https://NavarMP.DigiBayt.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors font-medium"
                        >
                            Muhammed Navar
                        </Link>
                    </p>
                </div>
            </div>
        </footer>
    );
}
