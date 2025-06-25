"use client";

import { useState } from "react";
import { Info, Plus, Package, Euro, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AccessoireItems } from "@/lib/trailer-categories";

interface Accessoire {
  name: string;
  price?: number;
  selected?: boolean;
}

interface TrailerAccessoiresProps {
  trailerAccessoires: Accessoire[];
  setTrailerAccessoires: (accessoires: Accessoire[]) => void;
}

function getAccessoireIcon(name: string) {
  const found = AccessoireItems.find(
    (item) => item.accessoire.toLowerCase() === name.toLowerCase()
  );
  return found ? found.icon : <Package size={28} strokeWidth={1.5} />;
}

export default function TrailerAccessoires({
  trailerAccessoires,
  setTrailerAccessoires,
}: TrailerAccessoiresProps) {
  const [editingPriceFor, setEditingPriceFor] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Function to check if an accessory is selected
  const isSelected = (name: string) => {
    return trailerAccessoires.some(
      (acc) => acc.name.toLowerCase() === name.toLowerCase() && acc.selected
    );
  };

  // Get price for an accessory
  const getPrice = (name: string) => {
    const accessory = trailerAccessoires.find(
      (acc) => acc.name.toLowerCase() === name.toLowerCase()
    );
    return accessory?.price;
  };

  // Handler to toggle accessory selection
  const toggleAccessory = (name: string) => {
    setTrailerAccessoires((prev) => {
      const existingIndex = prev.findIndex(
        (acc) => acc.name.toLowerCase() === name.toLowerCase()
      );

      if (existingIndex !== -1) {
        // Toggle selection status if it exists
        const updatedAccessoires = [...prev];
        updatedAccessoires[existingIndex] = {
          ...updatedAccessoires[existingIndex],
          selected: !updatedAccessoires[existingIndex].selected,
        };
        return updatedAccessoires;
      } else {
        // Add new accessory as selected
        return [...prev, { name, selected: true }];
      }
    });
  };

  // Handler to add or update an accessory price
  const handleUpdatePrice = (name: string, price: number) => {
    setTrailerAccessoires((prev) => {
      const existingIndex = prev.findIndex(
        (acc) => acc.name.toLowerCase() === name.toLowerCase()
      );

      if (existingIndex !== -1) {
        // If accessory exists, update its price
        const updatedAccessoires = [...prev];
        updatedAccessoires[existingIndex] = {
          ...updatedAccessoires[existingIndex],
          price,
        };
        return updatedAccessoires;
      } else {
        // Add new accessory with price
        return [...prev, { name, price, selected: true }];
      }
    });

    // Reset editing state
    setEditingPriceFor(null);
    setPriceInput("");
  };

  // Handler for custom accessory
  const handleAddCustomAccessory = () => {
    if (customName.trim()) {
      const price = priceInput.trim() ? parseFloat(priceInput) : undefined;
      setTrailerAccessoires((prev) => [
        ...prev,
        { name: customName, price, selected: true },
      ]);

      // Reset
      setCustomName("");
      setPriceInput("");
      setShowCustomInput(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-in">
      <h2 className="text-3xl font-medium text-gray-900 mb-0">
        Aanhanger accessoires toevoegen
      </h2>
      <p className="text-gray-600 mt-3">
        Selecteer accessoires waar een huurder gebruik van kan maken en stel de
        prijs in voor het gebruik.
      </p>

      {/* Accessoires grid with integrated selection */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-3">
          {AccessoireItems.map((item) => {
            const selected = isSelected(item.accessoire);
            const isEditing = editingPriceFor === item.accessoire;
            const currentPrice = getPrice(item.accessoire);

            return (
              <div
                key={item.id}
                className={`relative bg-white rounded-md transition-all duration-200 p-4 h-auto min-h-28 cursor-pointer ${
                  selected
                    ? "border-2 border-black"
                    : "border hover:border-2 hover:border-gray-400"
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isEditing) {
                    toggleAccessory(item.accessoire);
                  }
                }}
                onClick={() => {
                  if (!isEditing) {
                    toggleAccessory(item.accessoire);
                  }
                }}
                aria-label={`${selected ? "Deselecteer" : "Selecteer"} ${
                  item.accessoire
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="flex justify-center text-black">
                    {item.icon}
                  </div>
                  <p className="mt-2 text-center text-sm font-medium text-gray-800">
                    {item.accessoire}
                  </p>

                  {selected && (
                    <div className="absolute top-2 right-2">
                      <Check size={18} className="text-black" />
                    </div>
                  )}

                  {/* Price display or input */}
                  {!isEditing ? (
                    <div
                      className="mt-3 flex bg-gray-100 rounded-md py-1.5 px-3 items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPriceFor(item.accessoire);
                        setPriceInput(
                          currentPrice !== undefined ? String(currentPrice) : ""
                        );
                      }}
                    >
                      <Euro size={16} className="mr-1 text-gray-600" />
                      <span className="text-sm">
                        {currentPrice !== undefined
                          ? `${currentPrice.toFixed(2)}`
                          : "Prijs instellen"}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="mt-2 flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center">
                        <span className="mr-1">€</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdatePrice(
                                item.accessoire,
                                parseFloat(priceInput) || 0
                              );
                            } else if (e.key === "Escape") {
                              setEditingPriceFor(null);
                              setPriceInput("");
                            }
                          }}
                          placeholder="0.00"
                          className="w-20 outline-0 h-8 text-sm"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-1 h-8 p-1"
                          onClick={() => {
                            handleUpdatePrice(
                              item.accessoire,
                              parseFloat(priceInput) || 0
                            );
                          }}
                        >
                          <Check size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Optional info popover/modal logic
                  }}
                  className="absolute top-2 left-2 p-1 text-gray-400 hover:text-primary transition-colors"
                  aria-label={`Meer info over ${item.accessoire}`}
                >
                  <Info size={18} strokeWidth={1.5} />
                </button>
              </div>
            );
          })}

          {/* Overig card for custom accessory */}
          {!showCustomInput ? (
            <div
              className="relative bg-white rounded-md border transition-all duration-200 p-4 h-28 cursor-pointer hover:border-2 hover:border-gray-400 flex flex-col justify-center items-center"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") setShowCustomInput(true);
              }}
              onClick={() => setShowCustomInput(true)}
              aria-label="Voer een eigen accessoire in"
            >
              <div className="flex justify-center text-black">
                <Plus size={28} strokeWidth={1.5} />
              </div>
              <p className="mt-2 text-center text-sm font-medium text-gray-800">
                Overig
              </p>
            </div>
          ) : (
            <div
              className="relative bg-white rounded-md border-2 border-black p-4 min-h-28"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="custom-name" className="text-sm font-medium">
                  Naam
                </Label>
                <Input
                  id="custom-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Bijv. Speciale bevestiging"
                  className="text-sm outline-0"
                  autoFocus
                />

                <Label
                  htmlFor="custom-price"
                  className="text-sm font-medium mt-2"
                >
                  Prijs (€)
                </Label>
                <Input
                  id="custom-price"
                  type="number"
                  step="0.01"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="10.00"
                  className="text-sm outline-0"
                />

                <div className="flex justify-between mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomName("");
                      setPriceInput("");
                    }}
                  >
                    Annuleren
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddCustomAccessory}
                    disabled={!customName.trim()}
                  >
                    Toevoegen
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
