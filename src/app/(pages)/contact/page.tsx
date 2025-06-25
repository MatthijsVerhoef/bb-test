"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MessageCircle, CheckCircle, X } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Reset form
      setFormData({ name: "", email: "", subject: "", message: "" });
      setSubmitStatus("success");
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 pt-32 pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">
            Contact opnemen
          </h1>
          <p className="text-lg text-gray-600">
            We helpen je graag verder. Stuur ons een bericht en we reageren binnen 24 uur.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <a
            href="mailto:info@buurbak.nl"
            className="flex flex-col items-center p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Mail className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Email</h3>
            <p className="text-sm text-gray-500 text-center">
              info@buurbak.nl
            </p>
          </a>

          <a
            href="tel:+31851234567"
            className="flex flex-col items-center p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Phone className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Telefoon</h3>
            <p className="text-sm text-gray-500 text-center">
              +31 85 123 4567
            </p>
          </a>

          <a
            href="https://wa.me/31612345678"
            className="flex flex-col items-center p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <MessageCircle className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">WhatsApp</h3>
            <p className="text-sm text-gray-500 text-center">
              +31 6 1234 5678
            </p>
          </a>
        </div>

        {/* Contact Form */}
        <div className="border border-gray-200 rounded-xl p-8">
          {/* Success Message */}
          {submitStatus === "success" && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-900">
                    Bericht verzonden!
                  </h3>
                  <p className="text-sm text-green-700">
                    Bedankt voor je bericht. We reageren binnen 24 uur.
                  </p>
                </div>
                <button
                  onClick={() => setSubmitStatus("idle")}
                  className="ml-auto text-green-600 hover:text-green-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {submitStatus === "error" && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <X className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-medium text-red-900">
                    Er ging iets mis
                  </h3>
                  <p className="text-sm text-red-700">
                    Probeer het opnieuw of neem direct contact met ons op.
                  </p>
                </div>
                <button
                  onClick={() => setSubmitStatus("idle")}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Naam
                </label>
                <Input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Je naam"
                  className="h-12 border-gray-300 rounded-lg focus:border-gray-900 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email
                </label>
                <Input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="je@email.nl"
                  className="h-12 border-gray-300 rounded-lg focus:border-gray-900 focus:ring-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Onderwerp
              </label>
              <Input
                name="subject"
                type="text"
                required
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Waar gaat je bericht over?"
                className="h-12 border-gray-300 rounded-lg focus:border-gray-900 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Bericht
              </label>
              <Textarea
                name="message"
                required
                rows={6}
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Vertel ons meer over je vraag..."
                className="resize-none border-gray-300 rounded-lg focus:border-gray-900 focus:ring-gray-900"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verzenden...
                </div>
              ) : (
                "Verstuur bericht"
              )}
            </Button>
          </form>
        </div>

        {/* Office Info */}
        <div className="mt-16 text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-6">
            Ons kantoor
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-lg mx-auto">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Adres</h3>
              <address className="text-gray-600 not-italic text-sm leading-relaxed">
                Voorbeeldstraat 123<br />
                1234 AB Amsterdam<br />
                Nederland
              </address>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Openingstijden</h3>
              <div className="text-gray-600 text-sm space-y-1">
                <div>Ma-Vr: 9:00 - 17:00</div>
                <div>Za: 10:00 - 16:00</div>
                <div>Zo: Gesloten</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}