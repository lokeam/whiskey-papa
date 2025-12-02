"use client"

import React from 'react';
import { cn } from "@/components/ui/utils";
import Link from 'next/link';

import { WhiskeyPapaLogo } from "../ui/logos/WhiskeyPapaLogo";
import { MenuIcon } from "@/components/ui/logos/MenuIcon";
import { CircleQuestionMarkIcon } from "@/components/ui/logos/CircleQuestionMarkIcon";
import { AvatarIcon } from "@/components/ui/logos/AvatarIcon";
import { ChevronIcon } from "@/components/ui/logos/ChevronIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface TopNavigationProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean;
  ref?: React.Ref<HTMLElement>
  onMenuClick?: () => void;
  breadcrumbs?: BreadcrumbItem[];
}

export function TopNavigation({
  className,
  children,
  fixed,
  onMenuClick,
  breadcrumbs,
  ...props
}: TopNavigationProps) {

  return (
    <header
      id="top-nav"
      className="hidden py-4 md:grid sticky top-0 z-50 bg-transparent backdrop-blur"
      style={{
        gridTemplateColumns: 'auto 1fr auto',
        gap: '1rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
      }}
      {...props}
    >
      {/* Left: Mobile Hamburger + Logo */}
      <div className="flex items-center gap-3 ">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-accent rounded-md transition-colors"
          aria-label="Toggle sidebar"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <WhiskeyPapaLogo className="size-10" />
        </Link>
      </div>

      {/* Center: Breadcrumb Navigation - aligned with main content */}
      <div className="flex items-center">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="w-full max-w-7xl mx-auto px-16">
            <nav className="flex items-center gap-2 text-md">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <ChevronIcon direction="right" className="w-3 h-3 text-muted-foreground" />
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium truncate max-w-xs" title={crumb.label}>
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Right: Help + Avatar */}
      <div className="flex items-center gap-2 justify-self-end">
        {/* Help Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Help"
            >
              <CircleQuestionMarkIcon className="h-7 w-7" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Help & Support</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Lorem ipsum dolor sit
            </DropdownMenuItem>
            <DropdownMenuItem>
              Consectetur adipiscing elit
            </DropdownMenuItem>
            <DropdownMenuItem>
              Sed do eiusmod tempor
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Incididunt ut labore
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="User menu"
            >
              <AvatarIcon className="h-8 w-8" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Lorem ipsum dolor sit
            </DropdownMenuItem>
            <DropdownMenuItem>
              Consectetur adipiscing elit
            </DropdownMenuItem>
            <DropdownMenuItem>
              Sed do eiusmod tempor
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Incididunt ut labore
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {children}
    </header>
  );
};