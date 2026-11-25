import { useRef, useState } from 'react';
import XLSX from 'xlsx-js-style';
import {
  FaFileUpload,
  FaFileExcel,
  FaDownload,
  FaTimes,
  FaInfoCircle,
  FaSpinner,
  FaCopy,
  FaCheckCircle,
} from 'react-icons/fa';
import { api } from '../../utils/api';
import { adminToast } from '../../utils/adminToast';

// ── Brand palette (site gold) ────────────────────────────────────────────────
const GOLD = 'BCA142';
const GOLD_DARK = 'A8892F';
const ROW_ALT = 'FBF7EA';
const TEXT = '1F2937';
const BORDER = 'E3D9BC';
const LINK = '1155CC';

// Columns the admin has to provide in the uploaded sheet. Everything else is
// optional — for business/company accounts an extra "category" column is
// accepted when present.
const REQUIRED_FIELDS = ['name', 'email', 'country', 'phone'];

// Users often re-upload the exported sheet, whose headers are friendly ("Phone
// Number", "Email Address", ...) rather than the raw field names. Map every
// common spelling to the canonical key the import pipeline expects.
const HEADER_ALIASES = {
  name: ['name', 'full name', 'full_name', 'user name', 'username', 'contact name'],
  email: ['email', 'email address', 'e-mail', 'e mail', 'user email', 'contact email'],
  country: ['country', 'country name', 'nation'],
  phone: ['phone', 'phone number', 'mobile', 'mobile number', 'phone no', 'phone no.', 'contact phone', 'contact number', 'user phone'],
  category: ['category', 'business category', 'type'],
};

const ALIAS_LOOKUP = (() => {
  const map = {};
  Object.entries(HEADER_ALIASES).forEach(([key, aliases]) => {
    aliases.forEach((a) => {
      map[a] = key;
    });
  });
  return map;
})();

// Normalise a raw cell header into the canonical field key (or the original
// lowercased header when no alias matches).
const normalizeHeader = (header) => {
  const raw = String(header ?? '').trim().toLowerCase();
  if (!raw) return '';
  return ALIAS_LOOKUP[raw] || raw;
};

const ROLE_META = {
  user: { title: 'Regular Users', sheet: 'Regular Users', file: 'regular-users' },
  business: { title: 'Business Owners', sheet: 'Business Owners', file: 'business-owners' },
  company: { title: 'Company Owners', sheet: 'Company Owners', file: 'company-owners' },
};

// Columns shown in the import template. `required` drives both the on-screen
// guide and the sample file; only name/email/country/phone are mandatory —
// category is optional and can be left blank.
const templateFields = (role) => {
  const fields = [
    { key: 'name', label: 'Name', required: true, example: 'John Doe', desc: 'Full name of the account holder.' },
    { key: 'email', label: 'Email', required: true, example: 'john@example.com', desc: 'Unique email address. Duplicates are skipped.' },
    { key: 'country', label: 'Country', required: true, example: 'India', desc: 'Country name.' },
    { key: 'phone', label: 'Phone Number', required: true, example: '+91 9876543210', desc: 'Unique phone number. Duplicates are skipped.' },
  ];
  if (role === 'business' || role === 'company') {
    fields.push({
      key: 'category',
      label: 'Category',
      required: false,
      example: '',
      desc: 'Business category (optional) — leave blank if unknown.',
    });
  }
  return fields;
};

// Friendly headers for the exported sheet. Any DB column missing here still
// gets exported — it is simply title-cased from its column name.
const COLUMN_LABELS = {
  id: 'ID',
  name: 'Name',
  email: 'Email',
  phone: 'Phone Number',
  country: 'Country',
  role: 'Role',
  category: 'Category',
  status: 'Status',
  is_blacklisted: 'Blacklisted',
  created_at: 'Registered On',
  updated_at: 'Last Updated',
  state: 'State',
  city: 'City',
  company_address: 'Company Address',
  about_company: 'About Company',
  website: 'Website',
  skype: 'Skype',
  facebook: 'Facebook',
  twitter: 'Twitter',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  services: 'Services',
  logo: 'Logo Link',
  company_logo: 'Company Logo Link',
  incharge_image: 'Incharge Image Link',
  owner_name: 'Owner Name',
  owner_phone: 'Owner Phone',
  incharge_name: 'Incharge Name',
  incharge_phone: 'Incharge Phone',
  map_location: 'Map Location',
  latitude: 'Latitude',
  longitude: 'Longitude',
  referral_code: 'Referral Code',
  paypal_email: 'PayPal Email',
  email_verified: 'Email Verified',
  email_notifications: 'Email Notifications',
  sms_notifications: 'SMS Notifications',
  blacklist_reason: 'Blacklist Reason',
  blacklist_date: 'Blacklist Date',
};

const PREFERRED_ORDER = [
  'id', 'name', 'email', 'phone', 'country', 'role', 'category', 'status', 'is_blacklisted',
  'created_at', 'state', 'city', 'company_address', 'about_company', 'website', 'skype',
  'facebook', 'twitter', 'instagram', 'linkedin', 'services',
  'logo', 'company_logo', 'incharge_image',
  'owner_name', 'owner_phone', 'incharge_name', 'incharge_phone',
  'map_location', 'latitude', 'longitude',
  'referral_code', 'paypal_email', 'email_verified', 'email_notifications',
  'sms_notifications', 'blacklist_reason', 'blacklist_date', 'updated_at',
];

// Bank account fields flattened into the company export (bank 1, bank 2, ...).
const BANK_FIELDS = [
  ['bank_name', 'Bank Name'],
  ['account_holder_name', 'Account Holder'],
  ['account_number', 'Account Number'],
  ['swift_code', 'SWIFT Code'],
  ['iban_number', 'IBAN'],
  ['branch_name', 'Branch'],
  ['branch_address', 'Branch Address'],
  ['ifsc_code', 'IFSC Code'],
  ['routing_number', 'Routing Number'],
  ['is_default', 'Primary Account'],
  ['payment_instructions', 'Payment Instructions'],
];

const LINK_COLUMNS = ['logo', 'company_logo', 'incharge_image', 'website'];
const DATE_COLUMNS = ['created_at', 'updated_at', 'blacklist_date'];
const BOOLEAN_COLUMNS = ['is_blacklisted', 'email_verified', 'email_notifications', 'sms_notifications'];

const prettify = (key) =>
  String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const thinBorder = (rgb) => ({
  top: { style: 'thin', color: { rgb } },
  bottom: { style: 'thin', color: { rgb } },
  left: { style: 'thin', color: { rgb } },
  right: { style: 'thin', color: { rgb } },
});

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatValue = (key, value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') {
    if (key === 'status') return value ? 'Active' : 'Inactive';
    return value ? 'Yes' : 'No';
  }
  if (key === 'status') return Number(value) ? 'Active' : 'Inactive';
  if (BOOLEAN_COLUMNS.includes(key)) return Number(value) ? 'Yes' : 'No';
  if (DATE_COLUMNS.includes(key)) return formatDate(value);
  if (key === 'services') {
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const isLink = (key, value) =>
  LINK_COLUMNS.includes(key) && /^https?:\/\//i.test(String(value || '').trim());

// Detect duplicate emails / phone numbers inside the uploaded rows so they can
// be surfaced before the import runs.
const findDuplicates = (rows) => {
  const emailSeen = new Map();
  const phoneSeen = new Map();
  rows.forEach((row) => {
    const email = String(row.email ?? '').trim().toLowerCase();
    if (email) emailSeen.set(email, (emailSeen.get(email) || 0) + 1);
    const phone = String(row.phone ?? row.mobile ?? '').trim().replace(/\D/g, '');
    if (phone) phoneSeen.set(phone, (phoneSeen.get(phone) || 0) + 1);
  });
  return {
    emails: [...emailSeen.entries()].filter(([, count]) => count > 1).map(([value]) => value),
    phones: [...phoneSeen.entries()].filter(([, count]) => count > 1).map(([value]) => value),
  };
};

const UsersBulkActions = ({ role, onImported }) => {
  const meta = ROLE_META[role] || ROLE_META.user;
  const fileInputRef = useRef(null);

  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [showTemplate, setShowTemplate] = useState(false);

  const fields = templateFields(role);

  const acceptHint = `CSV or Excel · required columns: ${REQUIRED_FIELDS.join(', ')}`;

  // ── Excel export ───────────────────────────────────────────────────────────
  const buildStyledSheet = (columns, rows, sheetName) => {
    const header = columns.map((c) => c.label);
    const aoa = [header, ...rows.map((row) => columns.map((c) => row[c.key] ?? ''))];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const range = XLSX.utils.decode_range(ws['!ref']);

    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        let cell = ws[addr];
        if (!cell) {
          cell = { t: 's', v: '' };
          ws[addr] = cell;
        }

        if (r === 0) {
          cell.s = {
            fill: { patternType: 'solid', fgColor: { rgb: GOLD } },
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: thinBorder(GOLD_DARK),
          };
        } else {
          const isAlt = r % 2 === 0;
          cell.s = {
            fill: { patternType: 'solid', fgColor: { rgb: isAlt ? ROW_ALT : 'FFFFFF' } },
            font: { color: { rgb: TEXT }, sz: 10 },
            alignment: { vertical: 'top', wrapText: true },
            border: thinBorder(BORDER),
          };
        }

        // Make logo / website values clickable in the sheet.
        if (r > 0 && columns[c]?.link && typeof cell.v === 'string' && /^https?:\/\//i.test(cell.v)) {
          cell.l = { Target: cell.v, Tooltip: cell.v };
          cell.s.font = { color: { rgb: LINK }, sz: 10, underline: true };
        }
      }
    }

    ws['!cols'] = columns.map((col) => {
      const longest = rows.reduce((max, row) => Math.max(max, String(row[col.key] ?? '').length), col.label.length);
      return { wch: Math.min(Math.max(longest + 2, 12), 45) };
    });
    ws['!rows'] = [{ hpt: 28 }];
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: columns.length - 1 } }),
    };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
    return wb;
  };

  const buildColumnsAndRows = (users) => {
    const keySet = new Set();
    users.forEach((user) => {
      Object.keys(user).forEach((key) => {
        if (key !== 'bankDetails') keySet.add(key);
      });
    });

    const orderedKeys = [
      ...PREFERRED_ORDER.filter((key) => keySet.has(key)),
      ...[...keySet].filter((key) => !PREFERRED_ORDER.includes(key)),
    ];

    const columns = orderedKeys.map((key) => ({
      key,
      label: COLUMN_LABELS[key] || prettify(key),
      link: LINK_COLUMNS.includes(key),
    }));

    // Company export also carries every bank account as its own set of columns.
    const maxBanks =
      role === 'company'
        ? users.reduce((max, user) => Math.max(max, (user.bankDetails || []).length), 0)
        : 0;

    if (maxBanks > 0) {
      const bankColumns = [];
      for (let i = 0; i < maxBanks; i++) {
        BANK_FIELDS.forEach(([field, label]) => {
          bankColumns.push({ key: `__bank_${i}_${field}`, label: `Bank ${i + 1} - ${label}`, bankIndex: i, field });
        });
      }
      const anchor = columns.findIndex((c) => c.key === 'paypal_email');
      if (anchor >= 0) columns.splice(anchor + 1, 0, ...bankColumns);
      else columns.push(...bankColumns);
    }

    const rows = users.map((user) =>
      columns.reduce((row, col) => {
        if (col.bankIndex !== undefined) {
          const bank = (user.bankDetails || [])[col.bankIndex];
          row[col.key] = bank ? formatValue(col.field, bank[col.field]) : '';
        } else {
          row[col.key] = formatValue(col.key, user[col.key]);
        }
        return row;
      }, {})
    );

    return { columns, rows };
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await api.get(`/api/user/admin-export/${role}`);
      const users = Array.isArray(res?.users) ? res.users : [];
      if (!users.length) {
        adminToast.info(`No ${meta.title.toLowerCase()} to export yet.`);
        return;
      }

      const { columns, rows } = buildColumnsAndRows(users);
      const wb = buildStyledSheet(columns, rows, meta.sheet);
      const stamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `${meta.file}-${stamp}.xlsx`);
      adminToast.success(`Exported ${users.length} record(s) to Excel.`);
    } catch (error) {
      console.error('Export error:', error);
      adminToast.error(error.message || 'Failed to export data.');
    } finally {
      setExporting(false);
    }
  };

  // ── Template download ──────────────────────────────────────────────────────
  const handleTemplate = () => {
    const columns = fields.map((f) => ({ key: f.key, label: f.label }));
    const sample = fields.reduce((row, f) => {
      row[f.key] = f.example;
      return row;
    }, {});
    const wb = buildStyledSheet(columns, [sample], 'Import Template');
    XLSX.writeFile(wb, `${meta.file}-import-template.xlsx`);
    adminToast.info(`Template ready — required columns: ${REQUIRED_FIELDS.join(', ')}.`);
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        adminToast.error('That file does not contain any sheet.');
        return;
      }

      // header:1 keeps raw rows so we can validate the header row reliably.
      const aoa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: 1,
        blankrows: false,
        defval: '',
      });
      if (!aoa.length) {
        adminToast.error('No rows found in that file.');
        return;
      }

      // Normalise headers so friendly spellings ("Phone Number", "Email
      // Address", ...) map to the canonical field keys.
      const headers = (aoa[0] || []).map(normalizeHeader);
      const missing = REQUIRED_FIELDS.filter((field) => !headers.includes(field));
      if (missing.length) {
        adminToast.error(`Missing required column(s): ${missing.join(', ')}.`);
        return;
      }

      const dataRows = aoa
        .slice(1)
        .filter((row) => row.some((value) => String(value ?? '').trim() !== ''));

      if (!dataRows.length) {
        adminToast.error('The file has a header row but no data rows.');
        return;
      }

      const rows = dataRows.map((row) => {
        const record = {};
        headers.forEach((header, index) => {
          if (header) record[header] = row[index] ?? '';
        });
        return record;
      });

      setPreview({ rows, fileName: file.name, duplicates: findDuplicates(rows) });
    } catch (error) {
      console.error('Import parse error:', error);
      adminToast.error('Could not read that file. Please upload a valid CSV or Excel file.');
    }
  };

  const confirmImport = async () => {
    if (!preview) return;
    try {
      setImporting(true);
      const res = await api.post('/api/user/admin-bulk-import', { role, users: preview.rows });
      setPreview(null);
      setResult(res);
      adminToast.success(res?.message || 'Users imported successfully.');
      onImported?.();
    } catch (error) {
      console.error('Import error:', error);
      adminToast.error(error.message || 'Failed to import users.');
    } finally {
      setImporting(false);
    }
  };

  const copyCredentials = async () => {
    const lines = (result?.inserted || []).map((u) => `${u.name}\t${u.email}\t${u.password}`);
    const text = `Name\tEmail\tPassword\n${lines.join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      adminToast.success('Credentials copied to clipboard.');
    } catch {
      adminToast.error('Could not copy — please copy manually.');
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv, .xlsx, .xls"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title={acceptHint}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <FaFileUpload />
          Import
        </button>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          title={`Download all ${meta.title.toLowerCase()} as a styled Excel sheet`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#bca142] text-white text-sm font-medium hover:bg-[#b8932f] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {exporting ? <FaSpinner className="animate-spin" /> : <FaFileExcel />}
          {exporting ? 'Exporting…' : 'Download Excel'}
        </button>

        <button
          type="button"
          onClick={() => setShowTemplate(true)}
          title="View the columns we need for importing"
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#bca142] text-[#8a6f1f] text-sm font-medium hover:bg-[#faf6ea] transition-colors"
        >
          <FaDownload />
          Template
        </button>
      </div>

      {/* ── Template / required-data modal ── */}
      {showTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Import Template — {meta.title}</h3>
              <button
                type="button"
                onClick={() => setShowTemplate(false)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <p className="text-sm text-gray-700">
                We need the following data to import {meta.title.toLowerCase()}. Add these columns to your CSV or
                Excel file — the header row must match the column names below.
              </p>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#bca142] text-white">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Column</th>
                      <th className="px-3 py-2 text-left font-medium">Required</th>
                      <th className="px-3 py-2 text-left font-medium">Details</th>
                      <th className="px-3 py-2 text-left font-medium">Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((f) => (
                      <tr key={f.key} className="border-b last:border-b-0 odd:bg-white even:bg-[#fbf7ea]">
                        <td className="px-3 py-2 font-medium text-gray-900">{f.label}</td>
                        <td className="px-3 py-2">
                          {f.required ? (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                              Required
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                              Optional
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{f.desc}</td>
                        <td className="px-3 py-2 text-gray-500">{f.example || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-[#faf6ea] border border-[#e3d9bc] p-3 text-sm text-[#7a621c]">
                <FaInfoCircle className="mt-0.5 shrink-0" />
                <ul className="list-disc space-y-1 pl-4">
                  <li>Only the columns marked <b>Required</b> must be filled in.</li>
                  <li><b>Email</b> and <b>Phone Number</b> must be unique — duplicate rows are skipped and reported after import.</li>
                  {role !== 'user' && <li><b>Category</b> is optional and can be left blank.</li>}
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTemplate(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleTemplate}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#bca142] text-white text-sm font-medium hover:bg-[#b8932f]"
                >
                  <FaDownload />
                  Download template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Import preview modal ── */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Import</h3>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="flex items-start gap-2 rounded-lg bg-[#faf6ea] border border-[#e3d9bc] p-3 text-sm text-[#7a621c]">
                <FaInfoCircle className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">
                    {preview.rows.length} row(s) found in {preview.fileName}
                  </p>
                  <p className="mt-1">
                    Required columns: <b>{REQUIRED_FIELDS.join(', ')}</b>. Rows with a duplicate email or
                    phone number, or an invalid email, are skipped and reported after import.
                  </p>
                </div>
              </div>

              {(preview.duplicates?.emails?.length > 0 || preview.duplicates?.phones?.length > 0) && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <FaInfoCircle className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Duplicates found in this file — only the first row is imported</p>
                    {preview.duplicates?.emails?.length > 0 && (
                      <p className="mt-1">
                        Duplicate email(s): <b>{preview.duplicates.emails.join(', ')}</b>
                      </p>
                    )}
                    {preview.duplicates?.phones?.length > 0 && (
                      <p className="mt-1">
                        Duplicate phone number(s): <b>{preview.duplicates.phones.join(', ')}</b>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#bca142] text-white">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">#</th>
                      <th className="px-3 py-2 text-left font-medium">Name</th>
                      <th className="px-3 py-2 text-left font-medium">Email</th>
                      <th className="px-3 py-2 text-left font-medium">Country</th>
                      <th className="px-3 py-2 text-left font-medium">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 8).map((row, index) => (
                      <tr key={index} className="border-b last:border-b-0 odd:bg-white even:bg-[#fbf7ea]">
                        <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                        <td className="px-3 py-2 text-gray-900">{String(row.name || '—')}</td>
                        <td className="px-3 py-2 text-gray-700">{String(row.email || '—')}</td>
                        <td className="px-3 py-2 text-gray-700">{String(row.country || '—')}</td>
                        <td className="px-3 py-2 text-gray-700">{String(row.phone || '—')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.rows.length > 8 && (
                  <p className="px-3 py-2 text-xs text-gray-500">
                    + {preview.rows.length - 8} more row(s)…
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmImport}
                  disabled={importing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60"
                >
                  {importing ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                  {importing ? 'Importing…' : `Import ${preview.rows.length} user(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Import result modal ── */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Import Result</h3>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-2xl font-semibold text-green-700">{result.summary?.inserted ?? 0}</p>
                  <p className="text-xs text-green-700">Imported</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="text-2xl font-semibold text-amber-700">{result.summary?.skipped ?? 0}</p>
                  <p className="text-xs text-amber-700">Skipped</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-2xl font-semibold text-red-700">{result.summary?.failed ?? 0}</p>
                  <p className="text-xs text-red-700">Failed</p>
                </div>
              </div>

              {result.inserted?.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">
                      Generated login passwords — share these with the user
                    </p>
                    <button
                      type="button"
                      onClick={copyCredentials}
                      className="flex items-center gap-1 text-xs font-medium text-[#8a6f1f] hover:underline"
                    >
                      <FaCopy /> Copy all
                    </button>
                  </div>
                  <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200">
                    <table className="min-w-full text-sm">
                      <thead className="sticky top-0 bg-[#faf6ea] text-[#7a621c]">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Name</th>
                          <th className="px-3 py-2 text-left font-medium">Email</th>
                          <th className="px-3 py-2 text-left font-medium">Password</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.inserted.map((u) => (
                          <tr key={u.id} className="border-b last:border-b-0">
                            <td className="px-3 py-2 text-gray-900">{u.name}</td>
                            <td className="px-3 py-2 text-gray-700">{u.email}</td>
                            <td className="px-3 py-2 font-mono text-gray-900">{u.password}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result.skipped?.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-medium text-amber-700">Skipped rows</p>
                  <ul className="max-h-32 overflow-y-auto rounded-lg bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
                    {result.skipped.map((s, i) => (
                      <li key={i}>
                        Row {s.row} — {s.email || '(no email)'}: {s.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.failed?.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-medium text-red-700">Failed rows</p>
                  <ul className="max-h-32 overflow-y-auto rounded-lg bg-red-50 p-3 text-xs text-red-800 space-y-1">
                    {result.failed.map((f, i) => (
                      <li key={i}>
                        Row {f.row} — {f.email || '(no email)'}: {f.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="px-4 py-2 rounded-lg bg-[#bca142] text-white text-sm font-medium hover:bg-[#b8932f]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UsersBulkActions;
