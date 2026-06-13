"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  OPENAI_MODELS,
  useTestIntegration,
  useUpdateIntegration,
  type Integration,
  type IntegrationUpdateInput,
  type OpenAiModel,
} from "@/lib/api/integrations";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select, type SelectOption } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface IntegrationConfigModalProps {
  integration: Integration | null;
  onClose: () => void;
}

export function IntegrationConfigModal({ integration, onClose }: IntegrationConfigModalProps) {
  const { t, locale } = useI18n();
  const update = useUpdateIntegration();
  const test = useTestIntegration();

  const isOpenAi = integration?.code === "openai";
  const cfg = (integration?.config ?? {}) as Record<string, unknown>;
  const hasKey = Boolean(cfg.apiKey);
  const hasSecret = Boolean(cfg.webhookSecret);

  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState<OpenAiModel>("gpt-4o-mini");
  const [domain, setDomain] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [widgetScriptUrl, setWidgetScriptUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!integration) return;
    const c = integration.config as Record<string, unknown>;
    setEnabled(integration.isEnabled);
    setApiKey("");
    setWebhookSecret("");
    setError(null);
    setTestResult(null);
    setModel((c.model as OpenAiModel) ?? "gpt-4o-mini");
    setDomain((c.domain as string) ?? "");
    setWidgetScriptUrl((c.widgetScriptUrl as string) ?? "");
    setPhoneNumbers(Array.isArray(c.phoneNumbers) ? (c.phoneNumbers as string[]).join(", ") : "");
  }, [integration]);

  const modelOptions: SelectOption[] = useMemo(
    () => OPENAI_MODELS.map((m) => ({ value: m, label: t(`integrations.model.${m}`) })),
    [t],
  );

  if (!integration) return null;

  function buildInput(): IntegrationUpdateInput | null {
    if (isOpenAi) {
      if (!hasKey && !apiKey.trim()) {
        setError(t("integrations.err.keyRequired"));
        return null;
      }
      const config: Record<string, unknown> = { model, enabled };
      if (apiKey.trim()) config.apiKey = apiKey.trim();
      return { isEnabled: enabled, config };
    }
    // OnlinePBX
    if (!domain.trim()) {
      setError(t("integrations.err.domainRequired"));
      return null;
    }
    if (!hasKey && !apiKey.trim()) {
      setError(t("integrations.err.keyRequired"));
      return null;
    }
    if (!hasSecret && !webhookSecret.trim()) {
      setError(t("integrations.err.secretRequired"));
      return null;
    }
    const config: Record<string, unknown> = {
      domain: domain.trim(),
      phoneNumbers: phoneNumbers
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
    };
    if (apiKey.trim()) config.apiKey = apiKey.trim();
    if (webhookSecret.trim()) config.webhookSecret = webhookSecret.trim();
    if (widgetScriptUrl.trim()) config.widgetScriptUrl = widgetScriptUrl.trim();
    return { isEnabled: enabled, config };
  }

  async function handleSave() {
    setError(null);
    const input = buildInput();
    if (!input) return;
    try {
      await update.mutateAsync({ id: integration!.id, input });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.localized(locale) : t("common.error"));
    }
  }

  async function handleTest() {
    setError(null);
    setTestResult(null);
    try {
      const result = await test.mutateAsync(integration!.id);
      setTestResult(result);
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof ApiError ? err.localized(locale) : t("common.error") });
    }
  }

  return (
    <Modal
      open={Boolean(integration)}
      onClose={onClose}
      size="lg"
      title={isOpenAi ? t("integrations.openai.title") : t("integrations.onlinepbx.title")}
      subtitle={isOpenAi ? t("integrations.openai.subtitle") : t("integrations.onlinepbx.subtitle")}
      footer={
        <>
          <Button variant="ghost" onClick={handleTest} loading={test.isPending} disabled={update.isPending}>
            {test.isPending ? t("integrations.testing") : t("integrations.test")}
          </Button>
          <div className="flex-1" />
          <Button variant="secondary" onClick={onClose} disabled={update.isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} loading={update.isPending}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-7">
        {isOpenAi ? (
          <>
            <section className="space-y-4">
              <h4 className="label">1. {t("integrations.section.apiConnection")}</h4>
              <Field label={`${t("integrations.f.openaiKey")} *`} htmlFor="i-key">
                <Input
                  id="i-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasKey ? (cfg.apiKey as string) : "sk-proj-..."}
                  autoComplete="off"
                />
              </Field>
              <p className="text-xs text-ink-muted">
                {t("integrations.f.openaiKeyHint")}
                {hasKey && ` · ${t("integrations.secretKept")}`}
              </p>
            </section>
            <section className="space-y-4">
              <h4 className="label">2. {t("integrations.section.model")}</h4>
              <Field label={t("integrations.f.model")} htmlFor="i-model">
                <Select
                  id="i-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value as OpenAiModel)}
                  options={modelOptions}
                />
              </Field>
              <EnableRow t={t} enabled={enabled} onChange={setEnabled} />
            </section>
          </>
        ) : (
          <>
            <section className="space-y-4">
              <h4 className="label">1. {t("integrations.section.server")}</h4>
              <Field label={`${t("integrations.f.domain")} *`} htmlFor="i-domain">
                <Input
                  id="i-domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="u010686"
                />
              </Field>
            </section>
            <section className="space-y-4">
              <h4 className="label">2. {t("integrations.section.apiSecurity")}</h4>
              <Field label={`${t("integrations.f.apiKey")} *`} htmlFor="i-pbxkey">
                <Input
                  id="i-pbxkey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasKey ? (cfg.apiKey as string) : "••••••••"}
                  autoComplete="off"
                />
              </Field>
              <Field label={`${t("integrations.f.webhookSecret")} *`} htmlFor="i-secret">
                <Input
                  id="i-secret"
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder={hasSecret ? (cfg.webhookSecret as string) : "••••••••"}
                  autoComplete="off"
                />
              </Field>
              {(hasKey || hasSecret) && (
                <p className="text-xs text-ink-muted">{t("integrations.secretKept")}</p>
              )}
            </section>
            <section className="space-y-4">
              <h4 className="label">3. {t("integrations.section.phoneCallback")}</h4>
              <Field label={t("integrations.f.phoneNumbers")} htmlFor="i-phones">
                <Input
                  id="i-phones"
                  value={phoneNumbers}
                  onChange={(e) => setPhoneNumbers(e.target.value)}
                  placeholder="+998901234567, +998712345678"
                />
              </Field>
              <p className="text-xs text-ink-muted">{t("integrations.f.phoneNumbersHint")}</p>
              <Field label={t("integrations.f.widgetUrl")} htmlFor="i-widget">
                <Input
                  id="i-widget"
                  value={widgetScriptUrl}
                  onChange={(e) => setWidgetScriptUrl(e.target.value)}
                  placeholder="https://callback3.onlinepbx.uz/?cb-id=..."
                />
              </Field>
              <p className="text-xs text-ink-muted">{t("integrations.f.widgetUrlHint")}</p>
              <EnableRow t={t} enabled={enabled} onChange={setEnabled} />
            </section>
          </>
        )}

        {testResult && (
          <p
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              testResult.ok ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"
            }`}
          >
            {testResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {testResult.message}
          </p>
        )}
        {error && <p className="rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>}
      </div>
    </Modal>
  );
}

function EnableRow({
  t,
  enabled,
  onChange,
}: {
  t: (k: string) => string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-3">
      <div>
        <p className="text-sm font-medium text-ink">{t("integrations.f.enable")}</p>
        <p className="text-xs text-ink-muted">{t("integrations.f.enableHint")}</p>
      </div>
      <Switch checked={enabled} onCheckedChange={onChange} aria-label={t("integrations.f.enable")} />
    </div>
  );
}
