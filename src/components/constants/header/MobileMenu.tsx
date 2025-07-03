"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileMenuContent } from "./MobileMenuContent";

interface MobileMenuProps {
  openAuthDialog: (view: "login" | "register") => void;
}

export const MobileMenu = ({ openAuthDialog }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg border-0 bg-gray-100 hover:border-gray-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M10 6h10" />
            <path d="M4 12h16" />
            <path d="M7 12h13" />
            <path d="M4 18h10" />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 mt-1 max-h-[80vh] overflow-y-auto rounded-xl border-none shadow-2xl z-[101]"
      >
        <MobileMenuContent
          openAuthDialog={openAuthDialog}
          setIsOpen={setIsOpen}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
