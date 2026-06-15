"use client";

import { useEffect, useState } from "react";
import { Check, Copy, CopyCheck, Eye, EyeOff, KeyRound, User2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface Credentials {
  login: string;
  password: string;
}

interface Props {
  open: boolean;
  credentials: Credentials | null;
  onClose: () => void;
}

/** One-time dialog shown after creating a user — login + auto-generated password. */
export function CredentialsModal({ open, credentials, onClose }: Props) {
  const { t } = useI18n();
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState<"login" | "password" | "all" | null>(null);

  useEffect(() => {
    if (open) {
      setReveal(false);
      setCopied(null);
    }
  }, [open]);

  async function copy(text: string, key: "login" | "password" | "all") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  if (!credentials) return null;
  const { login, password } = credentials;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={t("users.credentials.title")}
      subtitle={t("users.credentials.subtitle")}
      footer={
        <Button
          onClick={() => copy(`${t("users.credentials.login")}: ${login}\n${t("users.credentials.password")}: ${password}`, "all")}
        >
          {copied === "all" ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {t("users.credentials.copyAll")}
        </Button>
      }
    >
      <div className="space-y-3">
        <CredRow
          icon={<User2 className="h-4 w-4" />}
          label={t("users.credentials.login")}
          value={login}
          mono
          copied={copied === "login"}
          onCopy={() => copy(login, "login")}
        />
        <CredRow
          icon={<KeyRound className="h-4 w-4" />}
          label={t("users.credentials.password")}
          value={reveal ? password : "•".repeat(Math.max(password.length, 8))}
          mono
          copied={copied === "password"}
          onCopy={() => copy(password, "password")}
          trailing={
            <button
              type="button"
              onClick={() => setReveal((r) => !r)}
              className="rounded p-1 text-ink-muted hover:text-ink focus-visible:focus-ring"
              aria-label={t("users.credentials.toggle")}
            >
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
      </div>
    </Modal>
  );
}

function CredRow({
  icon,
  label,
  value,
  mono,
  copied,
  onCopy,
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  copied: boolean;
  onCopy: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
      <span className="text-ink-muted">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-muted">{label}</p>
        <p className={`truncate text-sm font-semibold text-ink ${mono ? "font-mono tnum" : ""}`}>{value}</p>
      </div>
      {trailing}
      <button
        type="button"
        onClick={onCopy}
        className="rounded-lg border border-line p-2 text-ink-muted transition-colors hover:bg-parchment hover:text-ink focus-visible:focus-ring"
        aria-label="copy"
      >
        {copied ? <Check className="h-4 w-4 text-positive" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
