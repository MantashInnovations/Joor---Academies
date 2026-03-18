export default function FinancePage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Finance</h2>
      <p className="text-muted-foreground">Monitor academy revenue, salaries, and expenses.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {['Fees', 'Salaries', 'Expenses'].map((item) => (
          <div key={item} className="p-6 rounded-lg border bg-card shadow-sm flex flex-col gap-2">
            <h3 className="font-semibold">{item}</h3>
            <p className="text-xs text-muted-foreground">Manage {item.toLowerCase()} records.</p>
            <div className="mt-4 h-24 w-full bg-muted/30 rounded border border-dashed flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Module Placeholder</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
