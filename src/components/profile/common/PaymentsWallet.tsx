import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  PlusCircle,
  Download,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle,
  Clock,
  Filter,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

interface PaymentsWalletProps {
  wallet: {
    balance: number;
    currency: string;
    lastPayout: Date | null;
  } | null;
  role: "USER" | "LESSOR" | "ADMIN" | "SUPPORT";
}

// Sample transactions for demonstration
const sampleTransactions = [
  {
    id: "tx-123",
    type: "PAYOUT",
    amount: -250.0,
    status: "COMPLETED",
    date: new Date(2025, 2, 15),
    description: "Payout to bank account",
  },
  {
    id: "tx-124",
    type: "RENTAL_INCOME",
    amount: 120.0,
    status: "COMPLETED",
    date: new Date(2025, 2, 14),
    description: "Rental income for Trailer XL",
  },
  {
    id: "tx-125",
    type: "RENTAL_PAYMENT",
    amount: -85.5,
    status: "COMPLETED",
    date: new Date(2025, 2, 10),
    description: "Payment for Small Trailer rental",
  },
  {
    id: "tx-126",
    type: "DEPOSIT",
    amount: 200.0,
    status: "COMPLETED",
    date: new Date(2025, 2, 5),
    description: "Wallet top-up",
  },
  {
    id: "tx-127",
    type: "RENTAL_INCOME",
    amount: 175.0,
    status: "PENDING",
    date: new Date(2025, 2, 16),
    description: "Rental income for Car Trailer",
  },
];

export default function PaymentsWallet({ wallet, role }: PaymentsWalletProps) {
  const [filter, setFilter] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: wallet?.currency || "EUR",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  // Filter transactions based on type
  const filteredTransactions = filter
    ? sampleTransactions.filter((tx) => tx.type === filter)
    : sampleTransactions;

  // Get transaction icon based on type
  const getTransactionIcon = (type: string, status: string) => {
    if (status === "PENDING")
      return <Clock className="h-5 w-5 text-amber-500" />;

    switch (type) {
      case "PAYOUT":
        return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
      case "RENTAL_INCOME":
        return <ArrowDownCircle className="h-5 w-5 text-green-500" />;
      case "RENTAL_PAYMENT":
        return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
      case "DEPOSIT":
        return <ArrowDownCircle className="h-5 w-5 text-green-500" />;
      default:
        return <CreditCard className="h-5 w-5 text-primary" />;
    }
  };

  // Get the status badge for a transaction
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-600 border-green-200"
          >
            <CheckCircle className="h-3 w-3 mr-1" /> Completed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-600 border-amber-200"
          >
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payments & Wallet</h2>
        <p className="text-muted-foreground">
          Manage your payment methods and wallet balance
        </p>
      </div>

      {/* Wallet Section */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balance</CardTitle>
          {wallet?.lastPayout && (
            <CardDescription>
              Last payout: {formatDate(wallet.lastPayout)}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                {wallet ? formatCurrency(wallet.balance) : "€0.00"}
              </div>
              <p className="text-sm text-muted-foreground">
                Available in your wallet
              </p>
            </div>

            <div className="flex space-x-2 mt-4 md:mt-0">
              {role === "LESSOR" && wallet && wallet.balance > 0 && (
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Request Payout
                </Button>
              )}
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Funds
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="paymentMethods">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Transaction History</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  {filter
                    ? `Filter: ${filter.replace("_", " ")}`
                    : "All Transactions"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length > 0 ? (
                <div className="space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 bg-muted/50">
                          {getTransactionIcon(
                            transaction.type,
                            transaction.status
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">
                            {transaction.description}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(transaction.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className={`font-medium ${
                            transaction.amount > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.amount > 0 ? "+" : ""}
                          {formatCurrency(transaction.amount)}
                        </span>
                        <div className="mt-1">
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-center mt-4">
                    <Button variant="outline" size="sm">
                      View All Transactions
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <CreditCard className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">No Transactions</h3>
                  <p className="text-muted-foreground text-center max-w-sm mt-1">
                    {filter
                      ? `You don't have any ${filter
                          .replace("_", " ")
                          .toLowerCase()} transactions.`
                      : "Your transaction history will appear here."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paymentMethods" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your payment cards and bank accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <CreditCard className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No Payment Methods</h3>
                <p className="text-muted-foreground text-center max-w-sm mt-1">
                  You haven't added any payment methods yet.
                </p>
                <Button className="mt-4">Add Payment Method</Button>
              </div>
            </CardContent>
          </Card>

          {role === "LESSOR" && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Payout Methods</CardTitle>
                <CardDescription>
                  Where we should send your rental income
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg border-primary/20 bg-primary/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">Bank Account</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          NL** **** **** **** 56
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Added on 10-01-2025
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-50 border-green-200"
                      >
                        <CheckCircle className="h-3 w-3 mr-1 text-green-500" />{" "}
                        Default
                      </Badge>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Payout Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Settings</CardTitle>
          <CardDescription>
            Customize how your invoices and receipts are handled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Automatic Receipts</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically receive receipts for all transactions
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications for payment events
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            {role === "LESSOR" && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Automatic Payouts</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatically transfer funds when balance exceeds €200
                    </p>
                  </div>
                  <Switch />
                </div>

                <Separator />
              </>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Download Annual Statement</h3>
                <p className="text-sm text-muted-foreground">
                  Download your annual transaction summary for tax purposes
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
