"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Award, Phone, Mail, MapPin } from "lucide-react";
import { FaInstagram, FaYoutube, FaWhatsapp } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

// Contact information
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

export function AboutDars() {
    return (
        <section className="relative py-20 px-4 bg-gradient-to-b from-primary/5 to-background dark:from-primary/10">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Title with Dars Logo */}
                <div className="text-center space-y-6">
                    {/* Dars Logo-Calligraphy */}
                    <div className="flex justify-center">
                        <Image
                            src="/assets/dars logo-calligraphy.svg"
                            alt="Minhajul Janna Dars"
                            width={500}
                            height={150}
                            className="w-full max-w-2xl h-auto dark:brightness-[200%] dark:contrast-75 transition-all"
                            priority
                        />
                    </div>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        A sacred journey of knowledge and spiritual enlightenment
                    </p>
                </div>

                {/* Content */}
                <Card className="glass-strong border-primary/30 dark:border-primary/20 rounded-3xl">
                    <CardContent className="p-8 md:p-12">
                        <div className="space-y-8">
                            <p className="text-lg text-muted-foreground leading-relaxed text-center">
                                Shaikhuna Parannur Usthad Smarakha Minhajul Janna Dars is a dedicated Islamic educational institution committed to spreading
                                authentic knowledge and nurturing spiritual growth. Through comprehensive programs and
                                community-driven initiatives, we strive to illuminate the path towards Paradise.
                            </p>

                            <div className="grid md:grid-cols-3 gap-6 mt-8">
                                <div className="text-center space-y-3">
                                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-gold-500/20 flex items-center justify-center">
                                        <BookOpen className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">Islamic Education</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Authentic knowledge from the Quran and Sunnah
                                    </p>
                                </div>

                                <div className="text-center space-y-3">
                                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-gold-500/20 flex items-center justify-center">
                                        <Users className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">Community</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Building a strong brotherhood
                                    </p>
                                </div>

                                <div className="text-center space-y-3">
                                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-gold-500/20 flex items-center justify-center">
                                        <Award className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">Excellence</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Striving for the highest standards of learning
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* About Ustad */}
                <Card className="glass-strong border-gold-300 dark:border-gold-700 rounded-3xl">
                    <CardContent className="p-8 md:p-12">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="relative w-40 h-40 md:w-48 md:h-48 flex-shrink-0">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-gold-500 opacity-20 blur-xl"></div>
                                <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-gold-500/30">
                                    <Image
                                        src="/assets/ustad.webp"
                                        alt="Jaleel Baqawi Parannur"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-4">
                                <div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold-500">
                                        About Mudarris
                                    </h3>
                                    <p className="text-xl font-semibold text-foreground mt-2">
                                        Usthad PP Abdul Jaleel Baqavi Parannur
                                    </p>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    A dedicated Islamic scholar committed to spreading authentic knowledge and guiding
                                    the community on the path of righteousness. With years of experience in Islamic education,
                                    Ustad provides comprehensive teachings rooted in the Quran and Sunnah.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact & Support */}
                {/* <Card className="glass-strong border-primary/30 dark:border-primary/20 rounded-3xl">
                    <CardContent className="p-8 md:p-12">
                        <div className="space-y-8">
                            <div className="text-center">
                                <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                                    Contact & Support
                                </h3>
                                <p className="text-muted-foreground mt-2">
                                    Get in touch with us for any inquiries or support
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8"> */}
                                {/* Phone & Email */}
                                {/* <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-primary">
                                            <Phone className="w-5 h-5" />
                                            <h4 className="font-semibold">Phone</h4>
                                        </div>
                                        {contactInfo.phones.map((phone, index) => (
                                            <Link
                                                key={index}
                                                href={`tel:${phone.replace(/\s/g, '')}`}
                                                className="block text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                {phone}
                                            </Link>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-primary">
                                            <Mail className="w-5 h-5" />
                                            <h4 className="font-semibold">Email</h4>
                                        </div>
                                        <Link
                                            href={`mailto:${contactInfo.email}`}
                                            className="block text-muted-foreground hover:text-primary transition-colors break-all"
                                        >
                                            {contactInfo.email}
                                        </Link>
                                    </div>
                                </div> */}

                                {/* Locations */}
                                {/* <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-primary">
                                        <MapPin className="w-5 h-5" />
                                        <h4 className="font-semibold">Locations</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {contactInfo.locations.map((location, index) => (
                                            <Link
                                                key={index}
                                                href={location.mapUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block"
                                            >
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start rounded-xl hover:bg-primary/10"
                                                >
                                                    <MapPin className="mr-2 h-4 w-4" />
                                                    {location.name}
                                                </Button>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div> */}

                            {/* Social Media */}
                            {/* <div className="space-y-4 pt-6 border-t border-border">
                                <h4 className="font-semibold text-center text-foreground">
                                    Follow Us
                                </h4>
                                <div className="flex justify-center gap-4">
                                    {contactInfo.social.map((platform, index) => {
                                        const IconComponent = platform.icon;
                                        return (
                                            <Link
                                                key={index}
                                                href={platform.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors group-hover:scale-110 duration-200">
                                                    <IconComponent className="w-6 h-6 text-primary" />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card> */}
            </div>
        </section>
    );
}
