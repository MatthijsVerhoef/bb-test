"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/client";
import { PackageIcon, ArrowLeft, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg mx-auto"
      >
        <div className="flex justify-center mb-0">
          <div className="relative w-48 h-48">
            {/* Main trailer icon */}
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2,
              }}
            >
              <PackageIcon
                size={160}
                className="text-primary opacity-80"
                strokeWidth={1}
              />
            </motion.div>

            {/* Question mark */}
            <motion.div
              className="absolute top-0 right-0 bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <span className="text-3xl font-bold text-primary">?</span>
            </motion.div>
          </div>
        </div>

        <motion.h1
          className="text-3xl sm:text-4xl font-bold mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <span className="text-primary">Oeps!</span> Deze pagina is zoek
        </motion.h1>

        <motion.p
          className="text-muted-foreground mb-8 text-base sm:text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          De pagina die je zoekt is niet gevonden. Misschien is deze verplaatst,
          verwijderd, of heb je een typefout gemaakt in de URL.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <Home size={18} />
              <span>Terug naar Home</span>
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/aanbod">
              <Search size={18} />
              <span>Zoek aanhangers</span>
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-16 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <p>
          Hulp nodig?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Neem contact met ons op
          </Link>
        </p>
      </motion.div>

      {/* BuurBak branding at bottom */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <Link href="/" className="flex items-center justify-center">
          <p className="font-bold text-2xl">
            <span className="text-primary">Buur</span>
            <span className="text-green-700">Bak</span>
          </p>
        </Link>
      </motion.div>
    </div>
  );
}
