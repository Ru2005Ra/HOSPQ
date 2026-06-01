import { useState, useEffect } from "react";
import { Label } from "./ui/label";
import { getProvinces, getDistricts, getSectors, getVillages } from "@/lib/locations";

interface LocationSelectorProps {
  value: {
    province: string;
    district: string;
    sector: string;
    village: string;
  };
  onChange: (location: {
    province: string;
    district: string;
    sector: string;
    village: string;
  }) => void;
}

export function LocationSelector({ value, onChange }: LocationSelectorProps) {
  const [districts, setDistricts] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [villages, setVillages] = useState<string[]>([]);

  // When province changes, reset district, sector, village and fetch new districts
  useEffect(() => {
    if (value.province) {
      const newDistricts = getDistricts(value.province);
      setDistricts(newDistricts);
      setSectors([]);
      setVillages([]);
      if (value.district && !newDistricts.includes(value.district)) {
        onChange({
          ...value,
          district: "",
          sector: "",
          village: "",
        });
      }
    } else {
      setDistricts([]);
    }
  }, [value.province]);

  // When district changes, reset sector, village and fetch new sectors
  useEffect(() => {
    if (value.province && value.district) {
      const newSectors = getSectors(value.province, value.district);
      setSectors(newSectors);
      setVillages([]);
      if (value.sector && !newSectors.includes(value.sector)) {
        onChange({
          ...value,
          sector: "",
          village: "",
        });
      }
    } else {
      setSectors([]);
    }
  }, [value.district, value.province]);

  // When sector changes, fetch new villages
  useEffect(() => {
    if (value.province && value.district && value.sector) {
      const newVillages = getVillages(value.province, value.district, value.sector);
      setVillages(newVillages);
      if (value.village && !newVillages.includes(value.village)) {
        onChange({
          ...value,
          village: "",
        });
      }
    } else {
      setVillages([]);
    }
  }, [value.sector, value.province, value.district]);

  const provinces = getProvinces();

  return (
    <div className="grid gap-4 grid-cols-2">
      {/* Province */}
      <div>
        <Label>Province *</Label>
        <select
          required
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={value.province}
          onChange={(e) =>
            onChange({
              ...value,
              province: e.target.value,
              district: "",
              sector: "",
              village: "",
            })
          }
        >
          <option value="">Select province</option>
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* District */}
      <div>
        <Label>District *</Label>
        <select
          required
          disabled={!value.province}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          value={value.district}
          onChange={(e) =>
            onChange({
              ...value,
              district: e.target.value,
              sector: "",
              village: "",
            })
          }
        >
          <option value="">Select district</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Sector */}
      <div>
        <Label>Sector *</Label>
        <select
          required
          disabled={!value.district}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          value={value.sector}
          onChange={(e) =>
            onChange({
              ...value,
              sector: e.target.value,
              village: "",
            })
          }
        >
          <option value="">Select sector</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Village */}
      <div>
        <Label>Village *</Label>
        <select
          required
          disabled={!value.sector}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          value={value.village}
          onChange={(e) =>
            onChange({
              ...value,
              village: e.target.value,
            })
          }
        >
          <option value="">Select village</option>
          {villages.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
