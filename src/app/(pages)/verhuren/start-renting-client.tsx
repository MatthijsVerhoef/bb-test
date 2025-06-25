"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  DollarSign,
  Users,
  Shield,
  Clock,
  Star,
  TrendingUp,
  MapPin,
  Euro,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import PricingMap from "@/components/verhuren/pricing-map";
import { motion } from "framer-motion";
import AuthDialog from "@/components/constants/auth/auth-dialog";

export default function StartRentingClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  useEffect(() => {
    // If user is logged in, redirect to the add trailer form
    if (user && !loading) {
      router.push("/plaatsen");
    }
  }, [user, loading, router]);

  // If user is logged in, show nothing while redirecting
  if (user) {
    return null;
  }

  const benefits = [
    {
      icon: DollarSign,
      title: "Verdien extra geld",
      description:
        "Verdien tot €50 per dag door je aanhanger te verhuren aan mensen in je buurt",
    },
    {
      icon: Users,
      title: "Help je buurt",
      description:
        "Deel je aanhanger met buren die hem nodig hebben voor hun verhuizing of project",
    },
    {
      icon: Shield,
      title: "Veilig & verzekerd",
      description:
        "Alle verhuurders worden gescreend en elke verhuur is volledig verzekerd",
    },
    {
      icon: Clock,
      title: "Flexibel verhuren",
      description:
        "Je bepaalt zelf wanneer je aanhanger beschikbaar is en tegen welke prijs",
    },
  ];

  const steps = [
    {
      step: "1",
      title: "Account aanmaken",
      description: "Maak gratis een account aan en verifieer je identiteit",
    },
    {
      step: "2",
      title: "Aanhanger toevoegen",
      description:
        "Upload foto's en beschrijf je aanhanger met alle specificaties",
    },
    {
      step: "3",
      title: "Huurders ontvangen",
      description: "Ontvang boekingsverzoeken en verdien geld met je aanhanger",
    },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const renterImages = [
    {
      id: 1,
      img: "/assets/mock-renters/mock-renter-1.png",
    },
    {
      id: 2,
      img: "/assets/mock-renters/mock-renter-2.png",
    },
    {
      id: 3,
      img: "/assets/mock-renters/mock-renter-3.png",
    },
    {
      id: 4,
      img: "/assets/mock-renters/mock-renter-4.png",
    },
  ];

  const scaleIn = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5 },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      {/* Hero Section */}
      <div className="bg-white pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Main content grid */}
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left column - Content */}
            <motion.div
              {...fadeInUp}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8"
            >
              <div className="space-y-8">
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium text-black"
                  {...fadeInUp}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <Sparkles className="w-4 h-4" />
                  #1 Platform voor aanhanger verhuur
                </motion.div>
                <motion.h1
                  className="text-5xl lg:text-6xl font-bold text-gray-900 max-w-[550px] tracking-tight leading-[1.1]"
                  {...fadeInUp}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  Je aanhanger is geld waard
                </motion.h1>

                <motion.p
                  className="text-lg text-gray-600 leading-relaxed max-w-lg"
                  {...fadeInUp}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Zet je ongebruikte aanhanger om in een betrouwbare bron van
                  bijverdiensten. Simpel, veilig en winstgevend.
                </motion.p>
              </div>

              <motion.div
                className="pt-2"
                {...fadeInUp}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Button
                  className="h-12 px-8 rounded-full text-base font-medium bg-primary hover:bg-gray-800 transition-colors duration-200"
                  onClick={() => setShowAuthDialog(true)}
                >
                  Plaats nu je aanhanger
                </Button>
              </motion.div>

              {/* Minimal trust indicators */}
              <motion.div
                className="flex flex-wrap items-center gap-8 pt-8"
                {...fadeInUp}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {renterImages.map((i) => (
                      <div
                        key={i.id}
                        className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 border-2 border-white"
                      >
                        <img
                          alt="renter image"
                          className="rounded-full"
                          src={i.img}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-bold text-gray-900">10.000+</span>{" "}
                    tevreden verhuurders
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-bold text-gray-900">4.9/5</span>{" "}
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right column - Clean Pricing Card */}
            <motion.div
              {...fadeInUp}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative"
            >
              <div className="bg-[#F7F7F7] rounded-2xl overflow-hidden">
                {/* Map section */}
                <div className="p-6 pb-4">
                  <PricingMap />
                </div>

                {/* Stats grid */}
                <div className="px-6 pb-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center py-4 bg-white rounded-xl">
                      <div className="text-2xl font-medium text-gray-900 mb-1">
                        €25-45
                      </div>
                      <div className="text-sm text-gray-500">
                        Per dag gemiddeld
                      </div>
                    </div>
                    <div className="text-center py-4 bg-white rounded-xl">
                      <div className="text-2xl font-medium text-gray-900 mb-1">
                        20+
                      </div>
                      <div className="text-sm text-gray-500">
                        Verhuren per maand
                      </div>
                    </div>
                  </div>

                  {/* Bottom tip section */}
                  <div className="bg-white rounded-xl p-6">
                    <div className="text-sm text-gray-500 leading-relaxed">
                      <span className="font-medium text-gray-700">
                        Pro tip:
                      </span>{" "}
                      Verhuurders in de Randstad verdienen 40% meer dan het
                      landelijk gemiddelde.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <motion.div
        className="py-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            className="text-5xl max-w-[400px] md:text-[40px] mx-auto text-center font-semibold text-gray-900 mb-3 tracking-tight"
            {...fadeInUp}
          >
            Je aanhanger binnen 5 minuten online
          </motion.h2>
          <motion.p
            className="text-xl text-center text-gray-500 mb-10 font-light max-w-2xl mx-auto"
            {...fadeInUp}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Je aanhanger binnen 5 minuten online
          </motion.p>
          <motion.img
            src="https://a0.muscache.com/im/pictures/canvas/Canvas-1727297032876/original/8935d720-4242-4b19-893f-e53bdd2ef37b.jpeg?im_w=2560"
            className="w-[80%] mx-auto rounded-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
          />
          <motion.div
            className="grid md:grid-cols-4 gap-5 mt-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="text-start bg-[#F7F7F7] p-4 rounded-lg transition-colors duration-300"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="font-medium text-gray-900 mb-1">
                  {benefit.title}
                </h3>
                <p className="text-gray-500 font-light leading-relaxed text-sm">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div
        className="py-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            className="text-5xl max-w-[400px] md:text-[40px] mx-auto text-center font-semibold text-gray-900 mb-3 tracking-tight"
            {...fadeInUp}
          >
            Je aanhanger binnen 5 minuten online
          </motion.h2>
          <motion.p
            className="text-xl text-center text-gray-500 mb-10 font-light max-w-2xl mx-auto"
            {...fadeInUp}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Je aanhanger binnen 5 minuten online
          </motion.p>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="text-start"
                variants={fadeInUp}
                transition={{ duration: 0.3 }}
              >
                <div className="rounded-lg overflow-hidden">
                  <motion.img
                    className="rounded-lg w-full object-cover"
                    src="https://a0.muscache.com/im/pictures/canvas/Canvas-1729549212079/original/ab635304-9e92-4e0e-99fb-c4426a4f20cf.jpeg?im_w=1200"
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-0 mt-4">
                  {step.title}
                </h3>
                <p className="text-gray-500 font-light max-w-[90%] leading-relaxed text-sm">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Stats section */}
      <motion.div
        className="pt-10 pb-18"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="grid md:grid-cols-3 gap-12 text-center"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div
              className="rounded-lg bg-[#f7f7f7] p-4"
              variants={scaleIn}
            >
              <div className="text-4xl font-medium text-gray-900 mb-2">
                10.000+
              </div>
              <div className="text-gray-500 font-light">Verhuurders</div>
            </motion.div>
            <motion.div
              className="rounded-lg bg-[#f7f7f7] p-4"
              variants={scaleIn}
            >
              <div className="text-4xl font-medium text-gray-900 mb-2">€35</div>
              <div className="text-gray-500 font-light">Gemiddeld per dag</div>
            </motion.div>
            <motion.div
              className="rounded-lg bg-[#f7f7f7] p-4"
              variants={scaleIn}
            >
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-4xl font-medium text-gray-900">4.8</span>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 bg-yellow-400" />
              </div>
              <div className="text-gray-500 font-light">Beoordeling</div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        className="pb-20 pt-14 bg-[#F7F7F7]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-3xl mx-auto px-6">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <h2 className="text-3xl font-medium text-gray-900 mb-4">
              Veelgestelde vragen
            </h2>
          </motion.div>

          <motion.div
            className="space-y-12"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div
              className="border-b border-gray-100 pb-8"
              variants={fadeInUp}
            >
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                Hoe word ik betaald?
              </h3>
              <p className="text-gray-500 font-light leading-relaxed">
                Je ontvangt automatisch je geld binnen 24 uur na afloop van de
                verhuurperiode via je ingestelde betaalmethode.
              </p>
            </motion.div>

            <motion.div
              className="border-b border-gray-100 pb-8"
              variants={fadeInUp}
            >
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                Wat als mijn aanhanger beschadigd raakt?
              </h3>
              <p className="text-gray-500 font-light leading-relaxed">
                Elke verhuur is volledig verzekerd. Bij schade wordt dit
                volledig vergoed door onze verzekering.
              </p>
            </motion.div>

            <motion.div className="pb-8" variants={fadeInUp}>
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                Kan ik de prijs zelf bepalen?
              </h3>
              <p className="text-gray-500 font-light leading-relaxed">
                Ja! Je bepaalt zelf de dagprijs van je aanhanger. We geven wel
                een aanbevolen prijs op basis van vergelijkbare aanhangers in
                jouw gebied.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        initialView="login"
      />
    </div>
  );
}
