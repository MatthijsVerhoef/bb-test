import { RentalStatus, PaymentStatus, DamageStatus } from './types';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
};

export const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case RentalStatus.COMPLETED:
      return "secondary";
    case RentalStatus.ACTIVE:
      return "default";
    case RentalStatus.CONFIRMED:
      return "outline";
    case RentalStatus.CANCELLED:
      return "destructive";
    case RentalStatus.PENDING:
      return "warning";
    case RentalStatus.LATE_RETURN:
      return "destructive";
    case RentalStatus.DISPUTED:
      return "destructive";
    default:
      return "outline";
  }
};

export const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case PaymentStatus.COMPLETED:
      return "success";
    case PaymentStatus.PENDING:
      return "warning";
    case PaymentStatus.FAILED:
      return "destructive";
    case PaymentStatus.REFUNDED:
      return "secondary";
    case PaymentStatus.PARTIALLY_REFUNDED:
      return "secondary";
    default:
      return "outline";
  }
};

export const getDamageStatusColor = (status: string) => {
  switch (status) {
    case DamageStatus.NONE:
      return "outline";
    case DamageStatus.MINOR:
      return "warning";
    case DamageStatus.MODERATE:
      return "warning";
    case DamageStatus.SEVERE:
      return "destructive";
    default:
      return "outline";
  }
};

export const getDutchStatus = (status: string): string => {
  const dutchStatusMap: Record<string, string> = {
    PENDING: "In afwachting",
    CONFIRMED: "Bevestigd",
    ACTIVE: "Actief",
    CANCELLED: "Geannuleerd",
    COMPLETED: "Voltooid",
    LATE_RETURN: "Verlate teruggave",
    DISPUTED: "In geschil",
  };
  return dutchStatusMap[status] || String(status).replace("_", " ");
};

export const truncateDescription = (text: string, maxLength = 1000) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};