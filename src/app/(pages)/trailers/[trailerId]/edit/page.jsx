"use client";

import { use } from "react";
import OnePageTrailerForm from "@/components/add-trailer/one-page-trailer-form";

export default function EditTrailerPage({ params }) {
  const unwrappedParams = use(params);
  const trailerId = unwrappedParams.trailerId;
  
  return <OnePageTrailerForm trailerId={trailerId} />;
}