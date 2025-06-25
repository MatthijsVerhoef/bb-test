"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Plus,
  Building,
  FileText,
  Download,
  ChevronRight,
  Loader2,
  ReceiptText,
} from "lucide-react";
import PaymentMethodManager from "@/components/profile/common/payment/PaymentMethodManager";
import { useStripePaymentMethods } from "@/hooks/useStripePaymentMethods";
import { useTranslation } from "@/lib/i18n/client";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  stripeCustomerId?: string | null;
  stripeAccountId?: string | null;
  role?: "USER" | "LESSOR" | "ADMIN" | "SUPPORT";
}

interface BillingSettingsFormProps {
  user: User;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  date: Date;
  receiptUrl?: string;
}

export function BillingSettingsForm({ user }: BillingSettingsFormProps) {
  const { t } = useTranslation('profile');
  const [showTransactions, setShowTransactions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Fetch user transactions
  useEffect(() => {
    if (showTransactions) {
      fetchTransactions();
    }
  }, [showTransactions]);

  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const response = await fetch("/api/user/transactions");
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Kon de transacties niet laden");
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  return (
    <motion.div
      className="space-y-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Payment Methods Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-medium text-gray-900">
            {t('settings.billing.paymentMethods.title')}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('settings.billing.paymentMethods.description')}
          </p>
        </div>

        {/* Using the existing PaymentMethodManager component */}
        <PaymentMethodManager
          user={user}
          editMode={editMode}
          onEditToggle={() => setEditMode(!editMode)}
          showCardHeader={false}
        />
      </div>

      {/* Transactions Section */}
      <div className="space-y-4">
        <button
          onClick={() => setShowTransactions(!showTransactions)}
          className="w-full flex items-center group"
        >
          <ReceiptText size={20} strokeWidth={1.5} />
          <div className="flex flex-col items-start">
            <h3 className="font-medium text-sm ms-3 mr-auto text-gray-900">
              {t('settings.billing.transactions.title')}
            </h3>
          </div>
          <ChevronRight
            className={`h-5 w-5 ms-auto text-gray-400 transition-transform ${
              showTransactions ? "rotate-90" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {showTransactions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1"
            >
              {isLoadingTransactions ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-2.5 group"
                  >
                    <div>
                      <p className="text-sm text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(new Date(transaction.date))} • €
                        {transaction.amount.toFixed(2)} •{" "}
                        <span
                          className={`${
                            transaction.status === "COMPLETED"
                              ? "text-green-600"
                              : transaction.status === "PENDING"
                              ? "text-yellow-600"
                              : "text-gray-600"
                          }`}
                        >
                          {transaction.status === "COMPLETED"
                            ? t('settings.billing.transactions.status.completed')
                            : transaction.status === "PENDING"
                            ? t('settings.billing.transactions.status.pending')
                            : transaction.status}
                        </span>
                      </p>
                    </div>
                    {transaction.receiptUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          window.open(transaction.receiptUrl, "_blank")
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-start text-sm py-4 text-gray-500">
                  {t('settings.billing.transactions.emptyState')}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
