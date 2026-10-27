"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { apiDelete, apiPut } from "@/lib/api-client";

export type GeminiKeyStatus = { masked: string } | null;

type SettingsPanelProps = {
  geminiKey: GeminiKeyStatus;
  onGeminiKeyChange: (status: GeminiKeyStatus) => void;
  onAccountDeleted: () => void;
  onApiError: (error: unknown, fallback: string) => string;
  onClose: () => void;
};

const inputClassName =
  "min-h-12 w-full border border-border bg-white px-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary";

export function SettingsPanel({
  geminiKey,
  onGeminiKeyChange,
  onAccountDeleted,
  onApiError,
  onClose,
}: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState("");
  const [keyMessage, setKeyMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [password, setPassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSaveKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiKey.trim()) return;

    setIsSavingKey(true);
    setKeyMessage(null);

    try {
      const result = await apiPut<{ geminiKey: GeminiKeyStatus }>(
        "/api/settings/gemini-key",
        { apiKey: apiKey.trim() },
      );
      onGeminiKeyChange(result.geminiKey);
      setApiKey("");
      setKeyMessage({ text: "Key saved. Smart search and auto-tagging are on.", isError: false });
    } catch (error) {
      setKeyMessage({ text: onApiError(error, "Could not save this key"), isError: true });
    } finally {
      setIsSavingKey(false);
    }
  }

  async function handleRemoveKey() {
    setIsSavingKey(true);
    setKeyMessage(null);

    try {
      await apiDelete("/api/settings/gemini-key");
      onGeminiKeyChange(null);
      setKeyMessage({ text: "Key removed. Search now uses keywords only.", isError: false });
    } catch (error) {
      setKeyMessage({ text: onApiError(error, "Could not remove the key"), isError: true });
    } finally {
      setIsSavingKey(false);
    }
  }

  async function handleDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password) return;
    if (
      !window.confirm(
        "Delete your account and everything you saved? This can't be undone.",
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await apiDelete("/api/account", { password });
      onAccountDeleted();
    } catch (error) {
      setDeleteError(onApiError(error, "Could not delete your account"));
      setIsDeleting(false);
    }
  }

  return (
    <section
      id="settings-panel"
      aria-labelledby="settings-title"
      className="mt-8 border border-border bg-background p-5 sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id="settings-title" className="font-display text-3xl">
          Settings
        </h2>
        <button type="button" onClick={onClose} className="border border-border px-4 py-2 text-sm">
          Close
        </button>
      </div>

      <div className="mt-6 grid gap-3">
        <h3 className="text-lg font-medium">Gemini API key</h3>
        <p className="text-sm leading-6 text-muted">
          Unlost uses your own free Gemini key for smart search, tags and image
          descriptions, so your usage never depends on anyone else&rsquo;s quota.
          Get one at{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Google AI Studio
          </a>
          . Without a key, everything still works with keyword search.
        </p>
        <p className="text-sm leading-6 text-muted">
          On Google&rsquo;s free tier, Google may use what you send to improve its
          products. Don&rsquo;t save anything you wouldn&rsquo;t want processed that way.
        </p>

        <p className="text-sm">
          {geminiKey ? (
            <>
              Current key: <span className="font-mono">{geminiKey.masked}</span>
            </>
          ) : (
            "No key added yet."
          )}
        </p>

        <form onSubmit={(event) => void handleSaveKey(event)} className="flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">{geminiKey ? "Replace Gemini API key" : "Gemini API key"}</span>
            <input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder={geminiKey ? "Paste a new key to replace it" : "Paste your Gemini API key"}
              className={inputClassName}
            />
          </label>
          <button
            type="submit"
            disabled={isSavingKey || !apiKey.trim()}
            className="bg-foreground px-6 py-3 text-white disabled:opacity-60"
          >
            {isSavingKey ? "Checking..." : "Save key"}
          </button>
          {geminiKey ? (
            <button
              type="button"
              disabled={isSavingKey}
              onClick={() => void handleRemoveKey()}
              className="border border-border px-6 py-3 disabled:opacity-60"
            >
              Remove
            </button>
          ) : null}
        </form>
        <p
          role="status"
          className={`text-sm ${keyMessage?.isError ? "text-red-600" : "text-muted"}`}
        >
          {keyMessage?.text}
        </p>
      </div>

      <div className="mt-8 grid gap-3 border-t border-border pt-6">
        <h3 className="text-lg font-medium">Delete account</h3>
        <p className="text-sm leading-6 text-muted">
          Permanently deletes your account, every item and image you saved, and
          your stored API key.
        </p>
        <form
          onSubmit={(event) => void handleDeleteAccount(event)}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <label className="flex-1">
            <span className="sr-only">Confirm with your password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Your password"
              className={inputClassName}
            />
          </label>
          <button
            type="submit"
            disabled={isDeleting || !password}
            className="bg-red-700 px-6 py-3 text-white disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete account"}
          </button>
        </form>
        {deleteError ? (
          <p role="alert" className="text-sm text-red-600">
            {deleteError}
          </p>
        ) : null}
      </div>
    </section>
  );
}
