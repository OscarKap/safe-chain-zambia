import { ChevronDown } from "lucide-react";
import { PROVINCES, ZAMBIA } from "@/data/facilities";

export function Field({ label, name, type = "text", required, placeholder, hint }: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string; hint?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}{required && <span className="text-destructive"> *</span>}</span>
      <input
        name={name} type={type} required={required} placeholder={placeholder}
        className="rounded-xl border border-input bg-background px-3.5 py-2.5 outline-none transition focus:ring-2 focus:ring-ring"
      />
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Select({ label, name, value, onChange, required, disabled, placeholder, options, hint }: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  required?: boolean; disabled?: boolean; placeholder: string;
  options: { value: string; label: string }[]; hint?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}{required && <span className="text-destructive"> *</span>}</span>
      <div className="relative">
        <select
          name={name} required={required} disabled={disabled} value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-input bg-background pl-3.5 pr-9 py-2.5 outline-none transition focus:ring-2 focus:ring-ring disabled:opacity-60"
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      </div>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function ProvinceDistrict({ province, district, onProvince, onDistrict }: {
  province: string; district: string; onProvince: (v: string) => void; onDistrict: (v: string) => void;
}) {
  const districts = province ? ZAMBIA[province] ?? [] : [];
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Select
        label="Province" name="province" required value={province}
        placeholder="Select province…"
        options={PROVINCES.map((p) => ({ value: p, label: p }))}
        onChange={(v) => { onProvince(v); onDistrict(""); }}
      />
      <Select
        label="District" name="district" required value={district}
        disabled={!province}
        placeholder={province ? "Select district…" : "Select province first"}
        options={districts.map((d) => ({ value: d, label: d }))}
        onChange={onDistrict}
      />
    </div>
  );
}
