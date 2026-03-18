export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Settings</h2>
      <p className="text-muted-foreground">Configure academy profile and system preferences.</p>
      <div className="grid gap-6 max-w-2xl py-4">
        <div className="p-4 rounded-lg border border-border bg-card shadow-sm space-y-4">
          <h3 className="text-lg font-medium">Academy Information</h3>
          <div className="grid gap-2">
            <span className="text-sm font-medium">Academy Name</span>
            <div className="p-2 rounded border bg-muted/50 text-sm">Joor Academy</div>
          </div>
          <div className="grid gap-2">
            <span className="text-sm font-medium">Contact Email</span>
            <div className="p-2 rounded border bg-muted/50 text-sm">contact@jooracademy.com</div>
          </div>
        </div>
      </div>
    </div>
  )
}
