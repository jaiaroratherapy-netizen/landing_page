import 'server-only'
// Reuse the exact browser module on the server: Node has WebCrypto and DecompressionStream too.
import '../public/aadhaar-qr.js'

export type AadhaarResult = {
  raw: string; version: string; name: string | null; dob: string | null; gender: string | null
  aadhaarLast4: string | null; generatedAt: string | null; mobileLast4: string | null; verifiedBy: string
}

type AadhaarModule = {
  read(text: string): Promise<AadhaarResult>
  matchesMobile(parsed: AadhaarResult, mobile: string): Promise<boolean | null>
  age(dob: string | null): number | null
  birthYear(dob: string | null): string | null
}

export const AadhaarQR = (globalThis as unknown as { AadhaarQR: AadhaarModule }).AadhaarQR
