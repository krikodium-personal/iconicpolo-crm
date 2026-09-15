'use client';
import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Camera, Package, Upload, X } from 'lucide-react';
import type { Order } from '@/lib/types';
import { decimal, parseDecimal } from '@/lib/money';
function selectFieldInput(e: { target: EventTarget }) {
  const input = e.target;
  if (!(input instanceof HTMLInputElement) || input.readOnly || input.disabled)
    return;
  if (
    ['checkbox', 'radio', 'file', 'button', 'submit', 'hidden', 'color'].includes(
      input.type,
    )
  )
    return;
  requestAnimationFrame(() => input.select());
}

const PHOTO_MAX_EDGE = 1600;
const PHOTO_MAX_BYTES = 350_000;

async function preparePhoto(file: File) {
  if (file.size <= PHOTO_MAX_BYTES && file.type === 'image/jpeg') return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('No se pudo preparar la foto.');
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (next) =>
        next
          ? resolve(next)
          : reject(new Error('No se pudo comprimir la foto.')),
      'image/jpeg',
      0.82,
    );
  });
  return new File(
    [blob],
    file.name.replace(/\.[^.]+$/i, '.jpg'),
    { type: 'image/jpeg' },
  );
}
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
      onFocus={selectFieldInput}
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
export function StatusMenu({
  value,
  options,
  title,
  description,
  onPick,
  extra,
}: {
  value: string;
  options: string[];
  title: string;
  description?: string;
  onPick: (value: string) => void | Promise<void>;
  extra?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError('');
      }}
    >
      <button
        type="button"
        className={`status ${value.replaceAll(' ', '-')} status-pick`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Cambiar ${title.toLowerCase()}: ${value}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {value}
      </button>
      <SheetContent side="bottom" className="status-sheet">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>
        <div className="status-sheet-options">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              disabled={busy}
              className={`status ${option.replaceAll(' ', '-')}${
                option === value ? ' is-current' : ''
              }`}
              onClick={async () => {
                if (option === value) {
                  setOpen(false);
                  return;
                }
                setBusy(true);
                setError('');
                try {
                  await onPick(option);
                  setOpen(false);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {option}
            </button>
          ))}
        </div>
        {error ? <p className="status-sheet-error">{error}</p> : null}
        {extra}
      </SheetContent>
    </Sheet>
  );
}
function payStatus(order: Order) {
  return order.paid === 0 && order.total > 0
    ? 'no pagado'
    : order.paid < order.total
      ? 'pago parcial'
      : 'pagado';
}
export function OrderPayMenu({
  order,
  onChange,
}: {
  order: Order;
  onChange: (pay: string, paid?: number) => Promise<void>;
}) {
  const value = payStatus(order);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState(value);
  const [amount, setAmount] = useState(decimal(order.paid));
  const [error, setError] = useState('');
  async function pick(option: string) {
    if (option === 'pago parcial') {
      setPicked(option);
      setError('');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onChange(option);
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function savePartial() {
    setBusy(true);
    setError('');
    try {
      await onChange('pago parcial', parseDecimal(amount));
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setPicked(value);
          setAmount(decimal(order.paid));
          setError('');
        }
      }}
    >
      <button
        type="button"
        className={`status ${value.replaceAll(' ', '-')} status-pick`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Cambiar pago: ${value}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {value}
      </button>
      <SheetContent side="bottom" className="status-sheet">
        <SheetHeader>
          <SheetTitle>Estado de pago</SheetTitle>
          <SheetDescription>
            Marcá si está cobrado. En un pago parcial, escribí el importe.
          </SheetDescription>
        </SheetHeader>
        <div className="status-sheet-options">
          {['no pagado', 'pago parcial', 'pagado'].map((option) => (
            <button
              key={option}
              type="button"
              disabled={busy}
              className={`status ${option.replaceAll(' ', '-')}${
                option === picked ? ' is-current' : ''
              }`}
              onClick={() => pick(option)}
            >
              {option}
            </button>
          ))}
        </div>
        {picked === 'pago parcial' ? (
          <>
            <label className="status-sheet-amount">
              Importe parcial
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <div className="status-sheet-options">
              <button
                type="button"
                disabled={busy}
                className="status pago-parcial"
                onClick={() => void savePartial()}
              >
                Guardar importe
              </button>
            </div>
          </>
        ) : null}
        {error ? <p className="pending-text">{error}</p> : null}
      </SheetContent>
    </Sheet>
  );
}
function cardDate(value: string) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}
export function OrderDeliveryMenu({
  delivery,
  onChange,
}: {
  delivery: string;
  onChange: (delivery: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState(delivery);
  const [error, setError] = useState('');
  const label = delivery
    ? `Entrega · ${cardDate(delivery)}`
    : 'Entrega · Sin definir';
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setValue(delivery);
          setError('');
        }
      }}
    >
      <button
        type="button"
        className={`status ${delivery ? 'entrega' : 'sin-definir'} status-pick`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Cambiar entrega: ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {label}
      </button>
      <SheetContent side="bottom" className="status-sheet">
        <SheetHeader>
          <SheetTitle>Fecha de entrega</SheetTitle>
          <SheetDescription>
            Definí el día o dejalo sin fecha.
          </SheetDescription>
        </SheetHeader>
        <label className="status-sheet-amount">
          Entrega
          <input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <div className="status-sheet-options">
          <button
            type="button"
            disabled={busy}
            className="status sin-definir"
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await onChange('');
                setOpen(false);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Sin definir
          </button>
          <button
            type="button"
            disabled={busy || !value}
            className="status entrega"
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await onChange(value);
                setOpen(false);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Guardar fecha
          </button>
        </div>
        {error ? <p className="pending-text">{error}</p> : null}
      </SheetContent>
    </Sheet>
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
  camera = false,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  onError: (v: string) => void;
  onBusy: (v: boolean) => void;
  max?: number;
  camera?: boolean;
}) {
  async function upload(files: FileList | null) {
    if (!files) return;
    onBusy(true);
    try {
      if (files.length + value.length > max)
        throw new Error(`Máximo ${max} fotos.`);
      const result = [...value];
      for (const file of Array.from(files)) {
        const photo = await preparePhoto(file);
        const form = new FormData();
        form.set('file', photo);
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
  const pick = (multiple: boolean, capture?: 'environment') => (
    <input
      type="file"
      accept={capture ? 'image/*' : 'image/jpeg,image/png,image/webp'}
      capture={capture}
      multiple={multiple}
      onChange={(e) => {
        void upload(e.target.files);
        e.target.value = '';
      }}
    />
  );
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
      {value.length < max && camera ? (
        <>
          <label className="upload">
            <Camera size={20} />
            <span>Sacar foto</span>
            <small>Cámara del teléfono</small>
            {pick(false, 'environment')}
          </label>
          <label className="upload">
            <Upload size={20} />
            <span>Subir foto</span>
            <small>JPG, PNG, WebP · 5 MB</small>
            {pick(max > 1)}
          </label>
        </>
      ) : value.length < max ? (
        <label className="upload">
          <Upload size={20} />
          <span>Subir foto</span>
          <small>JPG, PNG, WebP · 5 MB</small>
          {pick(max > 1)}
        </label>
      ) : null}
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
