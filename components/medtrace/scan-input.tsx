"use client";

import React from "react"

import { useState, useRef, useEffect } from "react";
import { ScanLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ScanInputProps {
  placeholder?: string;
  onScan: (value: string) => void;
  autoFocus?: boolean;
}

export function ScanInput({
  placeholder = "Escanear ID unitario...",
  onScan,
  autoFocus = true,
}: ScanInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onScan(trimmed);
      setValue("");
      inputRef.current?.focus();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="pl-10 h-12 text-base"
        />
      </div>
      <Button type="submit" size="lg" className="h-12 bg-primary text-primary-foreground hover:bg-primary/90">
        Enviar
      </Button>
    </form>
  );
}
