/*
 * Aadhaar Secure QR reader + UIDAI signature check, entirely in the browser.
 *
 * The QR holds a big decimal number: the big-endian bytes of a GZIP stream.
 * Decompressed, text fields are separated by 0xFF (ISO-8859-1), then the photo
 * (JPEG 2000), and the last 256 bytes are an RSA SHA-256 signature over
 * everything before them, made with one of UIDAI's offline keys below.
 *
 *  - Legacy layout: 16 fields, photo, then 32-byte SHA-256 email/mobile hashes
 *    (first field: 0 none, 1 email, 2 mobile, 3 both).
 *  - Versioned layout ("V2"+): version, the same 16 fields, last 4 digits of
 *    mobile, photo. No hashes.
 *
 * Public keys come from UIDAI's certificates at https://uidai.gov.in/en/data-and-download
 * (uidai_offline_publickey_*.cer). Expired certs stay listed because older printed
 * QRs were signed with them.
 */
(function (root) {
  'use strict';

  var KEYS = [
    ['uidai_offline_publickey_2026', 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAh1+zYnvbcEm0Yz73s5u42odpUJMr9wv5bVw7sOE5nFNbrB+U++5I0f8cL2HoHnJOkwvLZzrD0jG/vxAKi6vii/gjEzUEgrkdIHxMP3D6GJs0MSQHiEXvIGOwPIH3BLtBOc3m28NVNT6Q9iq0gUwuxnlhV38UdNhCllqNYhWmAMPJkImgaKrRZvY2pWNs6gd+PlAF/9SO69x3+1meA8kPk2ZvQanZlx9tfaExeOe9or3NQiKy2+UbtXrpcoAfYbbWi1OUzXi5bJdhbGp239c1fX6UKyUM5IUMY+m3I7wu2WQ7lmeO2n/vwzQz/PKHXPWYu3bydWMLdCi07vOQBqzCKwIDAQAB'],
    ['uidai_offline_publickey_17022026', 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmMIJKj28JcTN1B72p2/pgzDCoguhs/rbIXgN/ybNNh0NVOrZV2KllrmT5VOYlMrABpvIp7JU/n6hma3/O14n7nvngJ/y3colh8rk7msDwVAO7ZuVD+GCzfaYPLLkUS+wqH7M7FOHIn/pyJo1Rkxm98lO3dyox5RuLG2Uqm7JfVIomm0t7QKJoM5rf8JNvPXdwsxN89eWlT2Bf7BF//G3FKiF7ZHfvIyyqte/3orRRG/M80QqLrDP1RIeOa53ZTgILXcyQOb2yZOqNH3iN2uSKRsusNO17To5FOb2J9Hd5wIMuDv3zw4MWTrKAWuTYon90QSeGRKv1d5AQNRt0x5dSwIDAQAB'],
    ['uidai_offline_publickey_26022021', 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAonIsDl8t5bpwftk/A27CsfC5VZMjkPrMDwvL8gyAoVwIi0iGhmty6yWrC/VaL+Brae29XMg7dMdwnbIUHmwHxovN+FnT2vfz/O0kHQcgVdwVSIR0tFwsmC+pVKpSqm//skgYYcZQhdhLZBWOn0PZ81ymm0jOkwBSIQKkyuCTv/1HSwjTLR0EBvaH9+Vb0iaiOEv1ikHDhMOXTxx8URWBnJJt463z7LuZBMSG8fXVMDl3vqY1hDZzKbXBaK/clRIXMff0jUOvfPMfabHju+eUnceosQwL3eurq96+oHahz4FmrfBqikHe3xQ7/4NdvSvVuwth0kcsI0ptRBG8m1NglQIDAQAB'],
    ['uidai_offline_publickey_29032019', 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAm3ajjc3OQhTkP92CnmYEjXAwVG0KE5AHu6e5hlx1t2zp6ys9pOVlzVTLdRFWj3yLRbSePe75e2UTet0JUCraF7/NrXsARPyjDoVcTTlyj+JEcOYI7VUwg9e35Xp47ADNso6HzHhG1FJ9DMylWMP7ewob/Z0Lnbp1M4ZYGTBE/bZwrfORmZjl8ZKzExd2uzSDGu9qcX0B6bCLvxlwKSobfCtTgWIoZP06+HcKuJ570fi6Z8W7epbL/OPf92eKUyy39W00KZceuHFGonwhLCF/4t7aMySrpVf65wla8dO2NvXylWRyV7j6rR6DnUSFQZSOgZuJyPxMLS3fEzIEOd82WQIDAQAB'],
    ['uidai_offline_publickey_26022019', 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvVU9vwpfi5Qw/7KbqFeQWIu+mora/myGB2drvtYg+YWU7GfpXhTYeeAvaXlfFir1jPoIQLXgUIZ3Q6CHPEXbAddT3/kF3tHIZ6A1RrFZr2T+0VJpk6QAj8kYwyOwUwZzvQFrKTV5XvH8CWLGiCy7fsMBowqNpoN+lBVD1mvnNckOEQ2WtcWMn5kxRWGqACPRQmbioZE6FPJp0ZaxO84xA3l5TP590qXj9G2f/qxaNmuUm4/P8S+T6gxhZlWfBVeH9al2MR77VedOFyRm4+AYPUzHoY7nVbJAdIxOGA7HO0wcHDyMOeKWAsCuxLcE1WCSEnLeDia/J21QCWrKCBnXHwIDAQAB']
  ];

  var FIELDS = ['email_mobile', 'reference_id', 'name', 'dob', 'gender',
    'careof', 'dist', 'landmark', 'house', 'loc', 'pc', 'po', 'state', 'street', 'subdist', 'vtc'];
  var VERSIONS = ['V2', 'V3', 'V5'];
  var SIG = 256, HASH = 32, MAX_DIGITS = 8000;

  function fail(code, message) { var e = new Error(message); e.code = code; throw e; }

  function digitsToBytes(digits) {
    var hex = BigInt(digits).toString(16);
    if (hex.length % 2) hex = '0' + hex;
    var out = new Uint8Array(hex.length / 2);
    for (var i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }

  function b64ToBytes(b64) {
    var bin = atob(b64), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function hex(bytes) {
    return Array.prototype.map.call(bytes, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  function latin1(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return s.trim();
  }

  async function gunzip(bytes) {
    var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  /** Parse the raw QR text. Throws an Error with .code on anything that isn't a Secure QR. */
  async function parse(text) {
    var raw = String(text || '').trim();
    if (/^</.test(raw)) fail('OLD_QR', 'This is an old Aadhaar QR without a digital signature.');
    if (!/^\d+$/.test(raw) || raw.length > MAX_DIGITS) fail('NOT_AADHAAR', 'This is not an Aadhaar Secure QR code.');

    var gz = digitsToBytes(raw);
    if (gz[0] !== 0x1f || gz[1] !== 0x8b) fail('NOT_AADHAAR', 'This is not an Aadhaar Secure QR code.');

    var data;
    try { data = await gunzip(gz); } catch (e) { fail('CORRUPT', 'The QR data could not be read.'); }
    if (data.length <= SIG) fail('CORRUPT', 'The QR data is too short.');

    var signed = data.subarray(0, data.length - SIG);
    var signature = data.subarray(data.length - SIG);

    var head = latin1(signed.subarray(0, 4));
    var vm = /^V(\d+)/.exec(head);
    var version = vm && signed[vm[0].length] === 0xff ? vm[0] : null;
    if (version && VERSIONS.indexOf(version) < 0) fail('UNSUPPORTED', 'This Aadhaar QR version (' + version + ') is not supported yet.');

    var names = version ? ['version'].concat(FIELDS, ['mobile_last4']) : FIELDS;
    var f = {}, offset = 0;
    for (var i = 0; i < names.length; i++) {
      var end = signed.indexOf(0xff, offset);
      if (end < 0) fail('CORRUPT', 'The QR data has fewer fields than expected.');
      f[names[i]] = latin1(signed.subarray(offset, end)) || null;
      offset = end + 1;
    }
    if (['0', '1', '2', '3'].indexOf(f.email_mobile) < 0) fail('CORRUPT', 'The QR data is not in the expected format.');

    var hasEmail = !version && (f.email_mobile === '1' || f.email_mobile === '3');
    var hasMobile = !version && (f.email_mobile === '2' || f.email_mobile === '3');
    var hashBytes = (hasEmail + hasMobile) * HASH;
    var tail = signed.subarray(signed.length - hashBytes);

    var ref = f.reference_id || '';
    var ts = ref.slice(4);
    var generatedAt = /^\d{14}/.test(ts)
      ? ts.slice(0, 4) + '-' + ts.slice(4, 6) + '-' + ts.slice(6, 8) + ' ' + ts.slice(8, 10) + ':' + ts.slice(10, 12)
      : null;

    return {
      raw: raw,
      version: version || 'legacy',
      name: f.name,
      dob: f.dob,
      gender: f.gender,
      aadhaarLast4: /^\d{4}/.test(ref) ? ref.slice(0, 4) : null,
      generatedAt: generatedAt,
      mobileLast4: f.mobile_last4 && /^\d{4}$/.test(f.mobile_last4) ? f.mobile_last4 : null,
      mobileHash: hasMobile ? hex(tail.subarray(tail.length - HASH)) : null,
      address: ['careof', 'house', 'street', 'landmark', 'loc', 'vtc', 'po', 'subdist', 'dist', 'state', 'pc']
        .map(function (k) { return f[k]; }).filter(Boolean).join(', '),
      photo: signed.subarray(offset, signed.length - hashBytes),
      _signed: signed,
      _signature: signature
    };
  }

  /** Name of the UIDAI key whose signature matches, or null. */
  async function verifySignature(parsed, keys) {
    var subtle = root.crypto && root.crypto.subtle;
    if (!subtle) fail('NO_CRYPTO', 'This browser cannot check digital signatures. Please open the page over https.');
    var list = keys || KEYS;
    for (var i = 0; i < list.length; i++) {
      var key = await subtle.importKey('spki', b64ToBytes(list[i][1]),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
      if (await subtle.verify('RSASSA-PKCS1-v1_5', key, parsed._signature, parsed._signed)) return list[i][0];
    }
    return null;
  }

  /** Parse + verify. Resolves with the parsed data plus .verifiedBy (key name). Rejects if the signature is not UIDAI's. */
  async function read(text, keys) {
    var parsed = await parse(text);
    var by = await verifySignature(parsed, keys);
    if (!by) fail('BAD_SIGNATURE', 'This QR is not signed by UIDAI.');
    parsed.verifiedBy = by;
    return parsed;
  }

  /** true / false if the mobile number can be checked against the QR, null if the QR carries no mobile info. */
  async function matchesMobile(parsed, mobile) {
    var digits = String(mobile || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '');
    if (digits.length !== 10) return null;
    if (parsed.mobileLast4) return digits.slice(-4) === parsed.mobileLast4;
    if (!parsed.mobileHash || !parsed.aadhaarLast4) return null;
    // UIDAI scheme: SHA-256 hex, repeated (last digit of Aadhaar) times, at least once
    var rounds = Math.max(1, +parsed.aadhaarLast4.charAt(3)), h = digits;
    for (var i = 0; i < rounds; i++) {
      h = hex(new Uint8Array(await root.crypto.subtle.digest('SHA-256', new TextEncoder().encode(h))));
    }
    return h === parsed.mobileHash;
  }

  /** Age in whole years from "DD-MM-YYYY", "DD/MM/YYYY" or "YYYY"; null if unreadable. Year-only counts from 1 Jan. */
  function age(dob, now) {
    var m = /^(\d{2})[-\/](\d{2})[-\/](\d{4})$/.exec(dob || '') || /^(\d{4})$/.exec(dob || '');
    if (!m) return null;
    var d = m.length === 4 ? new Date(+m[3], +m[2] - 1, +m[1]) : new Date(+m[1], 0, 1);
    now = now || new Date();
    var a = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
    return a;
  }

  function birthYear(dob) { var m = /(\d{4})$/.exec(dob || ''); return m ? m[1] : null; }

  root.AadhaarQR = { read: read, parse: parse, verifySignature: verifySignature, matchesMobile: matchesMobile, age: age, birthYear: birthYear, KEYS: KEYS };
})(typeof window !== 'undefined' ? window : globalThis);
