import { mapProvinces } from '../../data/thaiMap'

export type Place = { province?: string; region?: string; district?: string; subdistrict?: string; postcode?: string }

const strip = (s?: string) => (s ?? '').replace(/^(จังหวัด|อำเภอ|ตำบล|เขต|แขวง|อ\.|ต\.)\s*/, '').trim()

/** Pin position → address (OpenStreetMap Nominatim, Thai names). Returns what could be matched; never throws. */
export async function reverseGeocode(lat: number, lng: number): Promise<Place> {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&accept-language=th&lat=${lat}&lon=${lng}`)
    const j = (await r.json()) as { address?: Record<string, string> }
    const a = j.address ?? {}
    const prov = strip(a.state ?? a.province ?? a.city)
    const match = mapProvinces.find((p) => p.name === prov || prov.includes(p.name) || p.name.includes(prov))
    return {
      province: match?.name,
      region: match?.region,
      district: strip(a.county ?? a.city_district ?? a.district ?? a.town) || undefined,
      subdistrict: strip(a.suburb ?? a.village ?? a.neighbourhood ?? a.hamlet ?? a.quarter) || undefined,
      postcode: a.postcode,
    }
  } catch {
    return {}
  }
}
