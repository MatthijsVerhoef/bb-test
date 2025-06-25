import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, CreditCard, ShieldCheck, Check, AlertCircle, Upload } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";

// Main hook to manage verification flows
export function useVerification(user, updateUser) {
  const [verificationDialog, setVerificationDialog] = useState(false);
  const [verifyType, setVerifyType] = useState(""); // "payment" or "license"
  const [verificationStep, setVerificationStep] = useState(1);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("ideal");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState({
    B: false,
    BE: false
  });

  // Open verification dialog
  const startVerification = (type) => {
    setVerifyType(type);
    setVerificationStep(1);
    setVerificationProgress(0);
    setVerificationSuccess(false);
    setVerificationError(null);
    setVerificationDialog(true);
    
    if (type === "payment") {
      setSelectedPaymentMethod(user.paymentMethods?.defaultMethod || "ideal");
    } else if (type === "license") {
      setUploadedFiles([]);
      setSelectedCategories({ B: false, BE: false });
    }
  };

  // Handle file upload for driver's license
  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
      setVerificationProgress(verificationStep === 1 ? 33 : verificationProgress);
    }
  };

  // Toggle license category selection
  const toggleCategory = (category) => {
    setSelectedCategories({
      ...selectedCategories,
      [category]: !selectedCategories[category]
    });
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (value) => {
    setSelectedPaymentMethod(value);
    setVerificationProgress(33);
  };

  // Move to next step in verification process
  const nextStep = () => {
    const newStep = verificationStep + 1;
    setVerificationStep(newStep);
    
    // Update progress based on step
    if (newStep === 2) {
      setVerificationProgress(66);
    } else if (newStep === 3) {
      setVerificationProgress(100);
    }
  };

  // Complete verification process
  const completeVerification = async () => {
    try {
      setVerificationProgress(100);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (verifyType === "payment") {
        // Update user payment information
        updateUser({
          ...user,
          paymentMethods: {
            ...user.paymentMethods,
            defaultMethod: selectedPaymentMethod,
            stripeConnected: true
          }
        });
      } else if (verifyType === "license") {
        // Update user license information
        updateUser({
          ...user,
          hasValidDriversLicense: true,
          licenseCategories: Object.keys(selectedCategories).filter(cat => selectedCategories[cat])
        });
      }
      
      setVerificationSuccess(true);
    } catch (error) {
      console.error("Verification failed:", error);
      setVerificationError("Verification failed. Please try again.");
    }
  };

  // Reset and close dialog
  const closeVerification = () => {
    setVerificationDialog(false);
  };

  return {
    verificationDialog,
    verifyType,
    verificationStep,
    verificationProgress,
    verificationSuccess,
    verificationError,
    selectedPaymentMethod,
    uploadedFiles,
    selectedCategories,
    startVerification,
    handleFileUpload,
    toggleCategory,
    handlePaymentMethodChange,
    nextStep,
    completeVerification,
    closeVerification
  };
}

// Verification Dialog Component
export function VerificationDialog({
  verificationDialog,
  verifyType,
  verificationStep,
  verificationProgress,
  verificationSuccess,
  verificationError,
  selectedPaymentMethod,
  uploadedFiles,
  selectedCategories,
  handleFileUpload,
  toggleCategory,
  handlePaymentMethodChange,
  nextStep,
  completeVerification,
  closeVerification
}) {
  return (
    <Dialog open={verificationDialog} onOpenChange={closeVerification}>
      <DialogContent className="max-w-md rounded-2xl p-8">
        <DialogHeader>
          <DialogTitle>
            {verifyType === "payment" ? "Verbind betaalmethode" : "Verifieer rijbewijs"}
          </DialogTitle>
          <DialogDescription>
            {verifyType === "payment" 
              ? "Volg de stappen om een betaalmethode te verbinden met je account" 
              : "Upload je rijbewijs voor verificatie"}
          </DialogDescription>
        </DialogHeader>
        
        {verificationSuccess ? (
          // Success state
          <div className="py-6 flex flex-col items-center text-center">
            <div className="bg-green-100 p-3 rounded-full mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Verificatie geslaagd!</h3>
            <p className="text-gray-500 mb-4">
              {verifyType === "payment" 
                ? "Je betaalmethode is succesvol verbonden." 
                : "Je rijbewijs is geverifieerd."}
            </p>
            <Button onClick={closeVerification}>Sluiten</Button>
          </div>
        ) : verificationError ? (
          // Error state
          <div className="py-6 flex flex-col items-center text-center">
            <div className="bg-red-100 p-3 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Verificatie mislukt</h3>
            <p className="text-gray-500 mb-4">{verificationError}</p>
            <Button onClick={closeVerification} variant="outline">Annuleren</Button>
            <Button onClick={() => nextStep(1)} className="mt-2">Opnieuw proberen</Button>
          </div>
        ) : (
          // Steps for verification process
          <div className="pb-4">
            {verifyType === "payment" ? (
              // Payment verification steps
              <>
                {verificationStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Kies een betaalmethode</h3>
                    <RadioGroup value={selectedPaymentMethod} onValueChange={handlePaymentMethodChange}>
                      <div className="flex items-center space-x-2 border rounded-lg py-4 px-3 mb-2">
                        <RadioGroupItem value="card" id="card-dialog" />
                        <Label htmlFor="card-dialog" className="flex items-center cursor-pointer">
                          <img className="w-5" alt="mastercard" src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_2019_logo.svg/1200px-Mastercard_2019_logo.svg.png" />
                          Credit/Debit Card
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-lg px-3 py-4">
                        <RadioGroupItem value="ideal" id="ideal-dialog" />
                        <Label htmlFor="ideal-dialog" className="flex items-center cursor-pointer">
                        <img className="w-5" alt="mastercard" src="https://upload.wikimedia.org/wikipedia/commons/9/93/IDEAL_logo.webp" />
                          iDEAL
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
                
                {verificationStep === 2 && (
                  <div className="space-y-4">
                    {selectedPaymentMethod === "card" ? (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <Label htmlFor="card-number">Kaartnummer</Label>
                          <Input id="card-number" placeholder="1234 5678 9012 3456" className="rounded-lg h-11 shadow-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-3">
                            <Label htmlFor="expiry">Vervaldatum</Label>
                            <Input id="expiry" placeholder="MM/YY" className="rounded-lg h-11 shadow-none" />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="cvc">CVC</Label>
                            <Input id="cvc" placeholder="123" className="rounded-lg h-11 shadow-none" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="name">Naam kaarthouder</Label>
                          <Input id="name" placeholder="J. Doe" className="rounded-lg h-11 shadow-none" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-3">
                          <Label htmlFor="bank">Kies je bank</Label>
                          <select 
                            id="bank" 
                            className="flex h-11 min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Selecteer je bank</option>
                            <option value="abn">ABN AMRO</option>
                            <option value="ing">ING</option>
                            <option value="rabo">Rabobank</option>
                            <option value="knab">Knab</option>
                            <option value="sns">SNS</option>
                            <option value="asn">ASN Bank</option>
                            <option value="regiobank">RegioBank</option>
                            <option value="bunq">bunq</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {verificationStep === 3 && (
                  <div className="space-y-4 flex flex-col items-center">
                    <h3 className="text-sm font-medium">Bevestig je betaalmethode</h3>
                    <div className="bg-gray-50 p-6 rounded-lg border w-full text-center">
                      <QrCode className="h-24 w-24 mx-auto mb-3 text-primary" />
                      <p className="text-sm text-gray-500">
                        {selectedPaymentMethod === "ideal" 
                          ? "Scan deze QR code met je bank app om de betaalmethode te bevestigen" 
                          : "We verwerken je kaartgegevens..."}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // License verification steps
              <>
                {verificationStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Upload je rijbewijs</h3>
                    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                      <div className="flex flex-col items-center">
                        <ShieldCheck className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-xs text-muted-foreground mb-4 max-w-sm">
                          Upload de voorkant van je rijbewijs. We verifiëren alleen je rijbevoegdheid en slaan geen gevoelige gegevens op.
                        </p>
                        
                        <div className="w-full">
                          <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="h-6 w-6 text-gray-500 mb-2" />
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Klik om te uploaden</span></p>
                                <p className="text-xs text-gray-500">JPG, PNG of PDF (max. 5MB)</p>
                              </div>
                              <input type="file" className="hidden" onChange={handleFileUpload} accept="image/jpeg,image/png,application/pdf" />
                            </label>
                          </div>
                        </div>
                        
                        {uploadedFiles.length > 0 && (
                          <div className="mt-4 text-sm flex items-center text-green-600">
                            <Check className="mr-1 h-4 w-4" />
                            {uploadedFiles.length} bestand(en) geüpload
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {verificationStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Selecteer je rijbewijscategorieën</h3>
                    <p className="text-xs text-gray-500">
                      Selecteer alle categorieën die op je rijbewijs staan. Categorie BE is nodig voor de meeste aanhangers.
                    </p>
                    
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="license-b" 
                          checked={selectedCategories.B}
                          onCheckedChange={() => toggleCategory('B')}
                        />
                        <Label htmlFor="license-b" className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">B</span>
                          Personenauto
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="license-be" 
                          checked={selectedCategories.BE}
                          onCheckedChange={() => toggleCategory('BE')}
                        />
                        <Label htmlFor="license-be" className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">BE</span>
                          Auto met aanhangwagen
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
                
                {verificationStep === 3 && (
                  <div className="space-y-4 flex flex-col items-center">
                    <h3 className="text-sm font-medium">Bevestig je gegevens</h3>
                    <div className="bg-gray-50 p-6 rounded-lg border w-full">
                      <p className="text-sm text-gray-700 mb-3 font-medium">Geüploade bestanden:</p>
                      <ul className="text-sm text-gray-500 list-disc pl-5 mb-4">
                        {uploadedFiles.map((file, index) => (
                          <li key={index}>{file.name}</li>
                        ))}
                      </ul>
                      
                      <p className="text-sm text-gray-700 mb-2 font-medium">Geselecteerde categorieën:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedCategories.B && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">B (Personenauto)</span>
                        )}
                        {selectedCategories.BE && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">BE (Auto met aanhangwagen)</span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-3">
                      Door te bevestigen ga je akkoord met de verificatie van je rijbewijs. Het verificatieproces kan tot 24 uur duren.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        <DialogFooter>
          {!verificationSuccess && !verificationError && (
            <>
              <Button variant="outline" onClick={closeVerification}>
                Annuleren
              </Button>
              {verificationStep < 3 ? (
                <Button onClick={nextStep} disabled={verificationStep === 1 && verifyType === "license" && uploadedFiles.length === 0}>
                  Volgende
                </Button>
              ) : (
                <Button onClick={completeVerification}>
                  Bevestigen
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}