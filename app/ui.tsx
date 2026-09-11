'use client';
import Image from 'next/image';
import type { ReactNode } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, Upload, X } from 'lucide-react';
export function Field({
  label,
  children,
  wide = false,
  pending = false,
  pendingLabel = 'Pendiente de definir',
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
  pending?: boolean;
  pendingLabel?: string;
}) {
  return (
    <label
      className={`field ${wide ? 'wide' : ''} ${pending ? 'pending' : ''}`}
    >
      <span>{label}</span>
      {children}
      {pending ? <small className="pending-text">{pendingLabel}</small> : null}
    </label>
  );
}
export function Pick({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v ?? '')}
      disabled={disabled}
    >
      <SelectTrigger aria-label={label} className="picker">
        <SelectValue>
          {options.find((o) => o.value === value)?.label || 'Seleccionar'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function SelectCheck({
  label,
  checked,
  mixed = false,
  onChange,
}: {
  label: string;
  checked: boolean;
  mixed?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Checkbox
      aria-label={label}
      checked={checked}
      indeterminate={mixed}
      onCheckedChange={(value) => onChange(value === true)}
    />
  );
}
export function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="check">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
      />
      {label}
    </label>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <span className={`status ${value.replaceAll(' ', '-')}`}>{value}</span>
  );
}
export function ProductPhoto({ url, name }: { url?: string; name: string }) {
  return url ? (
    <Image
      unoptimized
      width={110}
      height={110}
      className="product-photo"
      src={url}
      alt={name}
    />
  ) : (
    <span className="product-photo no-photo">
      <Package size={23} />
    </span>
  );
}
export function Photos({
  value,
  onChange,
  onError,
  onBusy,
  max = 10,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  onError: (v: string) => void;
  onBusy: (v: boolean) => void;
  max?: number;
}) {
  async function upload(files: FileList | null) {
    if (!files) return;
    onBusy(true);
    try {
      if (files.length + value.length > max)
        throw new Error(`Máximo ${max} fotos.`);
      const result = [...value];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set('file', file);
        const r = await fetch('/api/images', { method: 'POST', body: form });
        const data = (await r.json()) as { error: string; url: string };
        if (!r.ok) throw new Error(data.error);
        result.push(data.url);
      }
      onChange(result);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo cargar.');
    } finally {
      onBusy(false);
    }
  }
  return (
    <div className="photos">
      {value.map((url, i) => (
        <div className="photo-wrap" key={url}>
          <Image
            unoptimized
            width={110}
            height={110}
            src={url}
            alt={`Foto ${i + 1}`}
          />
          <button
            type="button"
            className="photo-remove"
            aria-label={`Quitar foto ${i + 1}`}
            onClick={() => onChange(value.filter((_, n) => n !== i))}
          >
            <X size={15} />
          </button>
        </div>
      ))}
      {value.length < max && (
        <label className="upload">
          <Upload size={20} />
          <span>Subir foto</span>
          <small>JPG, PNG, WebP · 5 MB</small>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={max > 1}
            onChange={(e) => {
              void upload(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      )}
    </div>
  );
}
export function ErrorBox({ message }: { message: string }) {
  return message ? (
    <p className="error" role="alert">
      {message}
    </p>
  ) : null;
}
