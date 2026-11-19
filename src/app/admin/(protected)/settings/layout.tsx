import { SettingsNav } from "./settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-1 max-w-prose text-muted-foreground">
          These override the values in site.config.ts, which stay the defaults. A section you have not saved here
          keeps the file&apos;s values, and &quot;Reset to site.config.ts&quot; brings them back.
        </p>
      </div>
      <SettingsNav />
      <div className="flex flex-col gap-8">{children}</div>
    </div>
  );
}
