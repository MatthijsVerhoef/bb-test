"use client";

import React from "react";

// Icon wrapper component to standardize all SVG icons
interface IconWrapperProps {
  children: React.ReactNode;
  isSelected?: boolean;
}

export function IconWrapper({
  children,
  isSelected = false,
}: IconWrapperProps) {
  return (
    <div
      className={`
        flex items-center justify-center 
        w-8 h-8
        ${isSelected ? "text-orange-700" : "text-gray-700"}
        transition-colors duration-200
      `}
    >
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            size: 24,
            strokeWidth: 1.5,
            color: "currentColor",
          })
        : children}
    </div>
  );
}

// Redefine your trailer type button component without borders
interface TrailerTypeButtonProps {
  icon: React.ReactNode;
  name: string;
  isSelected: boolean;
  onClick: () => void;
}

export function TrailerTypeButton({
  icon,
  name,
  isSelected,
  onClick,
}: TrailerTypeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 w-[70px] 
        flex flex-col items-center justify-center
        py-2 px-1
        transition-colors duration-200
        ${
          isSelected
            ? "text-primary/90 border-b-2 border-primary"
            : "text-gray-700 hover:text-gray-900 border-b-2 border-transparent"
        }
      `}
      title={name}
    >
      <IconWrapper isSelected={isSelected}>{icon}</IconWrapper>
      <span className="text-[0.70rem] font-medium text-center truncate w-full">
        {name.length > 14 ? `${name.slice(0, 12)}...` : name}
      </span>
    </button>
  );
}
