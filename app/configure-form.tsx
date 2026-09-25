'use client';
import { useState, type CSSProperties } from 'react';
import {
  BOTA_ACABADOS,
  BOTA_BASE_MODELO,
  BOTA_COLORS,
  BOTA_MATERIALS,
  BOTA_MEASURES,
  BOTA_MODELOS,
  BOTA_PLACES,
  botaModeloPriceId,
  CASCO_DISENO_MAX,
  CASCO_ESTAMPADOS,
  CASCO_FABRIC_PARTS,
  CASCO_MATERIAL_PRICE_KEY,
  CASCO_MATERIALES,
  CASCO_PALETTE_IDS,
  CASCO_SLOT_FULL_MESSAGE,
  CASCO_TAMANOS_INICIALES,
  CASCO_TAMANOS_LOGO,
  CASCO_TALLES,
  CASCO_VISERAS,
  COUNTRIES,
  FONTS,
  HELMET_MATERIALS,
  HELMET_SIZES,
  INITIAL_COLORS,
  LEGACY_BODY_COLORS,
  LEATHER_HEX,
  LEATHER_PHOTOS,
  MONTURA_MATERIALS,
  MONTURA_PERSONALIZACION_PLACES,
  RODILLERA_COLORS,
  RODILLERA_MODELOS,
  RODILLERA_PLACES,
  RODILLERA_SIZES,
  RODILLERA_TIPOS,
  cascoCanEnableKind,
  cascoFreeSlots,
  cascoPalette,
  changeCascoMaterial,
  changeCascoVisera,
  emptyPricing,
  findCascoTalle,
  firstCascoColor,
  posicionLabel,
  pricePoint,
  talleLabel,
  type BotaConfig,
  type BotaMeasureId,
  type CascoConfigLegacy,
  type CascoConfigV2,
  type CascoMaterialTipo,
  type CascoPosicion,
  type CascoSlotKind,
  type ColorElegido,
  type ConfiguredKind,
  type ConfiguredPricing,
  type ExtraCharge,
  type MonturaConfig,
  type ProductConfig,
  type RodilleraConfig,
  configLabels,
  extraCharges,
  extraTotals,
  selectedReferenceIds,
  fontStack,
  isNewCascoConfig,
  stockKey,
  stockForConfig,
  configDesignPhotos,
} from '@/lib/configure';
import { formatMoney } from '@/lib/money';
import type { Movement } from '@/lib/types';
import { Field, Pick, Photos, ProductPhoto } from './ui';

function ColorPicker({
  label,
  value,
  onChange,
  colors = INITIAL_COLORS,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  colors?: typeof INITIAL_COLORS;
}) {
  const selected = colors.find((color) => color.id === value);
  return (
    <label className="field wide color-picker-field">
      <span className="color-picker-heading">
        <span>{label}</span>
        {selected ? (
          <strong className="color-picker-selection">{selected.name}</strong>
        ) : null}
      </span>
      <div className="color-picker">
        <div className="color-swatches">
          {colors.map((color) => (
            <button
              key={color.id}
              type="button"
              aria-label={color.name}
              aria-pressed={color.id === value}
              className={`color-swatch${color.id === value ? ' selected' : ''}`}
              style={{ background: color.hex }}
              title={color.name}
              onClick={() => onChange(color.id)}
            />
          ))}
        </div>
      </div>
    </label>
  );
}

function CatalogColorPicker({
  label,
  paletteId,
  value,
  onChange,
}: {
  label: string;
  paletteId: string;
  value?: ColorElegido;
  onChange: (color: ColorElegido) => void;
}) {
  const palette = cascoPalette(paletteId);
  const selected =
    value && palette.find((color) => color.position === value.position);
  const selectedName = selected?.nombre || value?.nombre;
  return (
    <label className="field wide color-picker-field">
      <span className="color-picker-heading">
        <span>{label}</span>
        {selectedName ? (
          <strong className="color-picker-selection">{selectedName}</strong>
        ) : null}
      </span>
      <div className="color-picker">
        <div className="color-swatches">
          {palette.map((color) => (
            <button
              key={color.position}
              type="button"
              aria-label={color.nombre}
              aria-pressed={color.position === value?.position}
              className={`color-swatch${color.position === value?.position ? ' selected' : ''}`}
              style={{ background: color.hex }}
              title={color.nombre}
              onClick={() =>
                onChange({
                  palette: paletteId,
                  position: color.position,
                  nombre: color.nombre,
                  hex: color.hex,
                })
              }
            />
          ))}
        </div>
      </div>
    </label>
  );
}

function CountrySearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (country: string) => void;
}) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLocaleLowerCase('es');
  const filtered: string[] = needle
    ? COUNTRIES.filter((country) =>
        country.toLocaleLowerCase('es').includes(needle),
      )
    : [...COUNTRIES];
  const options = value && !filtered.includes(value)
    ? [value, ...filtered]
    : filtered;
  return (
    <Field label="País *" wide>
      <div className="country-search">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar país"
          aria-label="Buscar país"
        />
        <Pick
          label="País"
          value={value}
          onChange={onChange}
          options={options.map((country) => ({
            value: country,
            label: country,
          }))}
        />
      </div>
    </Field>
  );
}

function SlotPick({
  kind,
  posicion,
  config,
  onChange,
}: {
  kind: CascoSlotKind;
  posicion: CascoPosicion;
  config: CascoConfigV2;
  onChange: (posicion: CascoPosicion) => void;
}) {
  const slots = cascoFreeSlots(config, kind);
  if (slots.length <= 1) {
    const only = slots[0] || posicion;
    return (
      <Field label="Posición *">
        <p>{posicionLabel(only)}</p>
      </Field>
    );
  }
  return (
    <Field label="Posición *">
      <Pick
        label="Posición"
        value={posicion}
        onChange={(v) => onChange(v as CascoPosicion)}
        options={slots.map((id) => ({
          value: id,
          label: posicionLabel(id),
        }))}
      />
    </Field>
  );
}

function SlotToggle({
  label,
  kind,
  enabled,
  config,
  onEnable,
  onDisable,
}: {
  label: string;
  kind: CascoSlotKind;
  enabled: boolean;
  config: CascoConfigV2;
  onEnable: (posicion: CascoPosicion) => void;
  onDisable: () => void;
}) {
  const [rejected, setRejected] = useState(false);
  const blocked = !enabled && !cascoCanEnableKind(config, kind);
  if (rejected && !blocked) setRejected(false);
  return (
    <Field label={label}>
      <Pick
        label={label}
        value={enabled ? 'si' : 'no'}
        onChange={(v) => {
          setRejected(false);
          if (v !== 'si') {
            onDisable();
            return;
          }
          const slot = cascoFreeSlots(config, kind)[0];
          if (!slot) {
            setRejected(true);
            return;
          }
          onEnable(slot);
        }}
        options={[
          { value: 'no', label: 'No' },
          { value: 'si', label: 'Sí · costo extra' },
        ]}
      />
      {blocked ? (
        <output className={`hint${rejected ? ' slot-full' : ''}`}>
          {CASCO_SLOT_FULL_MESSAGE}
        </output>
      ) : null}
    </Field>
  );
}

function ReferenceShots({
  kind,
  value,
  pricing,
}: {
  kind: ConfiguredKind;
  value: ProductConfig;
  pricing: ConfiguredPricing;
}) {
  const shots = selectedReferenceIds(kind, value)
    .map((id) => ({
      id,
      url: pricing.photos[id] || '',
    }))
    .filter((item) => item.url);
  if (!shots.length) return null;
  return (
    <div className="reference-shots">
      {shots.map((shot) => (
        <ProductPhoto key={shot.id} name="Referencia" url={shot.url} />
      ))}
    </div>
  );
}

function hexLuminance(hex: string) {
  const n = hex.replace('#', '');
  if (n.length < 6) return 0;
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function mixHex(hex: string, toward: [number, number, number], amount: number) {
  const n = hex.replace('#', '');
  if (n.length < 6) return hex;
  const rgb = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return `#${rgb
    .map((c, i) =>
      Math.round(c + (toward[i] - c) * amount)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

function leatherSurface(id?: string) {
  if (!id) return '';
  return LEATHER_HEX[id] || INITIAL_COLORS.find((item) => item.id === id)?.hex || LEGACY_BODY_COLORS.find((item) => item.id === id)?.hex || '';
}

function leatherPreviewStyle(hex: string, photo?: string): CSSProperties {
  return {
    '--preview-leather': hex,
    '--preview-leather-hi': mixHex(hex, [255, 255, 255], 0.2),
    '--preview-leather-lo': mixHex(hex, [0, 0, 0], 0.22),
    '--preview-leather-edge': mixHex(hex, [0, 0, 0], 0.28),
    ...(photo ? { '--preview-leather-photo': `url(${photo})` } : {}),
  } as CSSProperties;
}

function InitialsPreview({
  text,
  fontId,
  colorId,
  colorHex,
  colorName,
  surfaceId,
  surfaceHex,
}: {
  text: string;
  fontId: string;
  colorId?: string;
  colorHex?: string;
  colorName?: string;
  surfaceId?: string;
  surfaceHex?: string;
}) {
  const font = FONTS.find((item) => item.id === fontId);
  const color =
    INITIAL_COLORS.find((item) => item.id === colorId) ||
    LEGACY_BODY_COLORS.find((item) => item.id === colorId);
  const shown = text.trim();
  const ink = colorHex || color?.hex || '#111111';
  const surface = surfaceHex || leatherSurface(surfaceId);
  const photo = surfaceId ? LEATHER_PHOTOS[surfaceId] : '';
  const darkSurface = surface
    ? hexLuminance(surface) < 0.48
    : hexLuminance(ink) > 0.55;
  return (
    <Field label="Vista previa" wide>
      <div
        className={`initials-preview${darkSurface ? ' on-dark' : ''}${photo ? ' has-photo' : ''}`}
        style={
          surface || photo ? leatherPreviewStyle(surface || '#1c1612', photo) : undefined
        }
      >
        <span
          className={`initials-preview-mark${shown ? '' : ' placeholder'}`}
          style={{ fontFamily: fontStack(fontId), color: ink }}
        >
          {shown || 'IC'}
        </span>
        <small>
          {font?.label || 'Tipografía'} · {colorName || color?.name || 'Color'}
          {shown ? '' : ' · escribí el texto'}
        </small>
      </div>
    </Field>
  );
}

function sanitizeMeasure(value: string) {
  const next = value.replace(',', '.').replace(/[^\d.]/g, '');
  const dot = next.indexOf('.');
  if (dot === -1) return next;
  return `${next.slice(0, dot + 1)}${next
    .slice(dot + 1)
    .replace(/\./g, '')
    .slice(0, 2)}`;
}

function ExtraNote({
  extra,
  currency,
}: {
  extra: ExtraCharge;
  currency: string;
}) {
  if (extra.pending) {
    return (
      <p className="hint extra-pending">
        Precio pendiente · definilo en Productos
      </p>
    );
  }
  if (!extra.price && !extra.cost) return null;
  return (
    <p className="hint">
      +{formatMoney(extra.price, currency)}
      {extra.cost ? ` · costo ${formatMoney(extra.cost, currency)}` : ''}
    </p>
  );
}

function setCascoColor(
  config: CascoConfigV2,
  part: keyof CascoConfigV2['colores'],
  color: ColorElegido,
): CascoConfigV2 {
  return { ...config, colores: { ...config.colores, [part]: color } };
}

function CascoConfiguratorNew({
  value,
  onChange,
  movements = [],
  productId,
  pricing,
  currency,
  onError,
  onBusy,
}: {
  value: CascoConfigV2;
  onChange: (next: CascoConfigV2) => void;
  movements?: import('@/lib/types').Movement[];
  productId?: string;
  pricing: ConfiguredPricing;
  currency: string;
  onError?: (message: string) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const [colorResetHint, setColorResetHint] = useState('');
  const extras = extraCharges('casco', value, pricing);
  const totals = extraTotals('casco', value, pricing);
  const available =
    productId != null
      ? stockForConfig(movements, productId, stockKey('casco', value))
      : null;
  const set = (patch: Partial<CascoConfigV2>) => onChange({ ...value, ...patch });
  const fabricPalette =
    value.material === 'prints' ? '' : value.material;
  const showBand = value.visera === 'argentine' && value.material !== 'prints';
  return (
    <div className="configurator">
      <ReferenceShots kind="casco" value={value} pricing={pricing} />
      <div className="form-grid">
        <Field label="Modelo *">
          <Pick
            label="Modelo"
            value={value.modelo}
            onChange={(v) => set({ modelo: v as CascoConfigV2['modelo'] })}
            options={[
              { value: 'h1', label: 'H1 homologado' },
              { value: 'standard', label: 'Standard sin homologar' },
            ]}
          />
          {value.modelo === 'h1' ? (
            <ExtraNote
              extra={pricePoint(pricing, 'modelo_h1')}
              currency={currency}
            />
          ) : null}
        </Field>
        <Field label="Estilo *">
          <Pick
            label="Estilo"
            value={value.visera}
            onChange={(v) =>
              onChange(changeCascoVisera(value, v as CascoConfigV2['visera']))
            }
            options={CASCO_VISERAS.map((item) => ({
              value: item.id,
              label: item.id === 'english' ? 'Inglesa (Lock/English)' : item.nombre,
            }))}
          />
        </Field>
        <Field label="Material *">
          <Pick
            label="Material"
            value={value.material}
            onChange={(v) => {
              const next = v as CascoMaterialTipo;
              onChange(changeCascoMaterial(value, next));
              setColorResetHint(
                next === 'prints'
                  ? 'Los colores de tela se ocultan: elegí un estampado.'
                  : 'Los colores de tela se reiniciaron al cambiar el material.',
              );
            }}
            options={CASCO_MATERIALES.map((item) => ({
              value: item.id,
              label: item.nombre,
            }))}
          />
          <ExtraNote
            extra={pricePoint(pricing, CASCO_MATERIAL_PRICE_KEY[value.material])}
            currency={currency}
          />
        </Field>
      </div>
      {colorResetHint ? <p className="hint">{colorResetHint}</p> : null}
      {value.material === 'prints' ? (
        <Field label="Estampado *">
          <Pick
            label="Estampado"
            value={value.estampado || 'topographic'}
            onChange={(v) =>
              set({ estampado: v as NonNullable<CascoConfigV2['estampado']> })
            }
            options={CASCO_ESTAMPADOS.map((item) => ({
              value: item.id,
              label: item.nombre,
            }))}
          />
        </Field>
      ) : (
        <>
          {CASCO_FABRIC_PARTS.filter(
            (part) => part.field !== 'peakBand' || showBand,
          ).map((part) => (
            <CatalogColorPicker
              key={part.field}
              label={`${part.label} *`}
              paletteId={fabricPalette}
              value={value.colores[part.field]}
              onChange={(color) =>
                onChange(setCascoColor(value, part.field, color))
              }
            />
          ))}
        </>
      )}
      <div className="form-grid">
        <Field label="Correaje">
          <Pick
            label="Correaje"
            value={value.colores.strap ? 'si' : 'no'}
            onChange={(v) =>
              onChange({
                ...value,
                colores: {
                  ...value.colores,
                  strap:
                    v === 'si'
                      ? firstCascoColor(CASCO_PALETTE_IDS.barbijo)
                      : undefined,
                },
              })
            }
            options={[
              { value: 'no', label: 'Sin correaje' },
              { value: 'si', label: 'Con correaje' },
            ]}
          />
          {value.colores.strap ? (
            <ExtraNote
              extra={pricePoint(pricing, 'correaje')}
              currency={currency}
            />
          ) : null}
        </Field>
      </div>
      {value.colores.strap ? (
        <CatalogColorPicker
          label="Color de correaje *"
          paletteId={CASCO_PALETTE_IDS.barbijo}
          value={value.colores.strap}
          onChange={(color) => onChange(setCascoColor(value, 'strap', color))}
        />
      ) : null}
      <CatalogColorPicker
        label="Tapones *"
        paletteId={CASCO_PALETTE_IDS.ojales}
        value={value.colores.airholes}
        onChange={(color) => onChange(setCascoColor(value, 'airholes', color))}
      />
      <CatalogColorPicker
        label="Logo Iconic *"
        paletteId={CASCO_PALETTE_IDS.logoHilo}
        value={value.logoIconic}
        onChange={(color) => set({ logoIconic: color })}
      />
      <p className="hint">Va en el lado derecho.</p>
      <div className="form-grid">
        <SlotToggle
          label="Iniciales"
          kind="iniciales"
          enabled={Boolean(value.iniciales)}
          config={value}
          onDisable={() => set({ iniciales: undefined })}
          onEnable={(posicion) =>
            set({
              iniciales: {
                posicion,
                texto: '',
                tamano: 'M',
                colorHilo: firstCascoColor(CASCO_PALETTE_IDS.logoHilo),
                tipografia: 'trajan',
              },
            })
          }
        />
      </div>
      {value.iniciales ? (
        <>
          <SlotPick
            kind="iniciales"
            posicion={value.iniciales.posicion}
            config={value}
            onChange={(posicion) =>
              set({
                iniciales: { ...value.iniciales!, posicion },
              })
            }
          />
          <div className="form-grid">
            <Field label="Texto de iniciales *">
              <input
                value={value.iniciales.texto}
                maxLength={24}
                onChange={(e) =>
                  set({
                    iniciales: {
                      ...value.iniciales!,
                      texto: e.target.value,
                    },
                  })
                }
                placeholder="IC"
              />
            </Field>
            <Field label="Tamaño *">
              <Pick
                label="Tamaño de iniciales"
                value={value.iniciales.tamano}
                onChange={(v) =>
                  set({
                    iniciales: {
                      ...value.iniciales!,
                      tamano: v as 'S' | 'M' | 'L',
                    },
                  })
                }
                options={CASCO_TAMANOS_INICIALES[value.iniciales.posicion].map(
                  (size) => ({
                    value: size.id,
                    label: `${size.nombre} · ${size.mm} mm`,
                  }),
                )}
              />
            </Field>
          </div>
          <Field label="Tipografía *">
            <Pick
              label="Tipografía"
              value={value.iniciales.tipografia}
              onChange={(v) =>
                set({
                  iniciales: { ...value.iniciales!, tipografia: v },
                })
              }
              options={FONTS.map((font) => ({
                value: font.id,
                label: font.label,
              }))}
            />
          </Field>
          <CatalogColorPicker
            label="Color de hilo *"
            paletteId={CASCO_PALETTE_IDS.logoHilo}
            value={value.iniciales.colorHilo}
            onChange={(color) =>
              set({
                iniciales: { ...value.iniciales!, colorHilo: color },
              })
            }
          />
          <InitialsPreview
            text={value.iniciales.texto}
            fontId={value.iniciales.tipografia}
            colorHex={value.iniciales.colorHilo.hex}
            colorName={`${value.iniciales.colorHilo.nombre} · ${posicionLabel(value.iniciales.posicion)}`}
            surfaceHex={value.colores.top?.hex}
          />
          <ExtraNote
            extra={pricePoint(pricing, 'iniciales')}
            currency={currency}
          />
        </>
      ) : null}
      <div className="form-grid">
        <SlotToggle
          label="Bandera"
          kind="bandera"
          enabled={Boolean(value.bandera)}
          config={value}
          onDisable={() => set({ bandera: undefined })}
          onEnable={(posicion) => set({ bandera: { posicion, pais: 'Argentina' } })}
        />
      </div>
      {value.bandera ? (
        <>
          <SlotPick
            kind="bandera"
            posicion={value.bandera.posicion}
            config={value}
            onChange={(posicion) =>
              set({
                bandera: { ...value.bandera!, posicion },
              })
            }
          />
          <CountrySearch
            value={value.bandera.pais}
            onChange={(pais) =>
              set({ bandera: { ...value.bandera!, pais } })
            }
          />
          <ExtraNote
            extra={pricePoint(pricing, 'bandera')}
            currency={currency}
          />
        </>
      ) : null}
      <div className="form-grid">
        <SlotToggle
          label="Logo propio"
          kind="logoPropio"
          enabled={Boolean(value.logoPropio)}
          config={value}
          onDisable={() => set({ logoPropio: undefined })}
          onEnable={(posicion) =>
            set({
              logoPropio: {
                posicion,
                imagen: '',
                tamano: 'M',
                colorHilo: firstCascoColor(CASCO_PALETTE_IDS.logoHilo),
              },
            })
          }
        />
      </div>
      {value.logoPropio ? (
        <>
          <SlotPick
            kind="logoPropio"
            posicion={value.logoPropio.posicion}
            config={value}
            onChange={(posicion) =>
              set({
                logoPropio: { ...value.logoPropio!, posicion },
              })
            }
          />
          <Field label="Tamaño *">
            <Pick
              label="Tamaño del logo"
              value={value.logoPropio.tamano}
              onChange={(v) =>
                set({
                  logoPropio: {
                    ...value.logoPropio!,
                    tamano: v as 'S' | 'M' | 'L',
                  },
                })
              }
              options={CASCO_TAMANOS_LOGO.map((size) => ({
                value: size.id,
                label: size.nombre,
              }))}
            />
          </Field>
          <CatalogColorPicker
            label="Color de hilo *"
            paletteId={CASCO_PALETTE_IDS.logoHilo}
            value={value.logoPropio.colorHilo}
            onChange={(color) =>
              set({
                logoPropio: { ...value.logoPropio!, colorHilo: color },
              })
            }
          />
          <Field label="Imagen del logo *" wide>
            <Photos
              value={
                value.logoPropio.imagen ? [value.logoPropio.imagen] : []
              }
              max={1}
              onChange={(urls) =>
                set({
                  logoPropio: {
                    ...value.logoPropio!,
                    imagen: urls[0] || '',
                  },
                })
              }
              onError={onError || (() => undefined)}
              onBusy={onBusy || (() => undefined)}
            />
          </Field>
          <ExtraNote
            extra={pricePoint(pricing, 'logoPersonalizado')}
            currency={currency}
          />
        </>
      ) : null}
      <Field label="Talle *" wide>
        <Pick
          label="Talle"
          value={
            value.talle && typeof value.talle === 'object'
              ? String(value.talle.cm)
              : '__empty__'
          }
          onChange={(v) =>
            set({
              talle: v === '__empty__' ? '' : findCascoTalle(Number(v)) || '',
            })
          }
          options={[
            { value: '__empty__', label: 'Elegí el talle' },
            ...CASCO_TALLES.map((talle) => ({
              value: String(talle.cm),
              label: talleLabel(talle),
            })),
          ]}
        />
      </Field>
      <Field label="Imágenes de referencia del diseño" wide>
        <Photos
          value={configDesignPhotos('casco', value)}
          max={CASCO_DISENO_MAX}
          camera
          onChange={(urls) =>
            set({ disenoImagenes: urls, disenoImagen: urls[0] || '' })
          }
          onError={onError || (() => undefined)}
          onBusy={onBusy || (() => undefined)}
        />
        <small>
          Podés adjuntar varios bocetos, mockups o fotos del casco para ilustrar
          el diseño al proveedor.
        </small>
      </Field>
      <ConfigSummary
        kind="casco"
        value={value}
        extras={extras}
        available={available}
        totals={totals}
        currency={currency}
      />
    </div>
  );
}

export function Configurator({
  kind,
  value,
  onChange,
  movements = [],
  productId,
  pricing = emptyPricing(),
  currency = 'USD',
  onError,
  onBusy,
}: {
  kind: ConfiguredKind;
  value: ProductConfig;
  onChange: (next: ProductConfig) => void;
  movements?: Movement[];
  productId?: string;
  pricing?: ConfiguredPricing;
  currency?: string;
  onError?: (message: string) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const extras = extraCharges(kind, value, pricing);
  const totals = extraTotals(kind, value, pricing);
  const available =
    productId != null
      ? stockForConfig(movements, productId, stockKey(kind, value))
      : null;
  if (kind === 'montura') {
    const c = value as MonturaConfig;
    const set = (patch: Partial<MonturaConfig>) => onChange({ ...c, ...patch });
    return (
      <div className="configurator">
        <ReferenceShots kind="montura" value={c} pricing={pricing} />
        <div className="form-grid">
          <Field label="Tipo *">
            <Pick
              label="Tipo"
              value={c.tipo}
              onChange={(v) => set({ tipo: v as MonturaConfig['tipo'] })}
              options={[
                { value: 'americana', label: 'Americana' },
                { value: 'bauti', label: 'Bauti' },
              ]}
            />
          </Field>
          <Field label="Material *">
            <Pick
              label="Material"
              value={c.material}
              onChange={(v) =>
                set({ material: v as MonturaConfig['material'] })
              }
              options={MONTURA_MATERIALS.map((material) => ({
                value: material.id,
                label: material.label,
              }))}
            />
          </Field>
          <Field label="Color *">
            <Pick
              label="Color"
              value={c.color}
              onChange={(v) => set({ color: v as MonturaConfig['color'] })}
              options={[
                { value: 'negro', label: 'Negro' },
                { value: 'marron', label: 'Marrón' },
              ]}
            />
          </Field>
          <Field label="Tamaño *">
            <Pick
              label="Tamaño"
              value={c.tamano}
              onChange={(v) => set({ tamano: v as MonturaConfig['tamano'] })}
              options={['18', '19', '20'].map((size) => ({
                value: size,
                label: size,
              }))}
            />
          </Field>
          <Field label="Acabado asiento *">
            <Pick
              label="Acabado asiento"
              value={c.acabadoAsiento}
              onChange={(v) =>
                set({
                  acabadoAsiento: v as MonturaConfig['acabadoAsiento'],
                })
              }
              options={[
                { value: 'liso', label: 'Liso' },
                { value: 'perforado', label: 'Perforado' },
              ]}
            />
          </Field>
          <Field label="Material asiento *">
            <Pick
              label="Material asiento"
              value={c.materialAsiento}
              onChange={(v) =>
                set({
                  materialAsiento: v as MonturaConfig['materialAsiento'],
                })
              }
              options={MONTURA_MATERIALS.map((material) => ({
                value: material.id,
                label: material.label,
              }))}
            />
          </Field>
          <Field label="Faldín *">
            <Pick
              label="Faldín"
              value={c.faldin ? 'con' : 'sin'}
              onChange={(v) => set({ faldin: v === 'con' })}
              options={[
                { value: 'con', label: 'Con' },
                { value: 'sin', label: 'Sin' },
              ]}
            />
          </Field>
          <Field label="Corte *">
            <Pick
              label="Corte"
              value={c.corte}
              onChange={(v) => set({ corte: v as MonturaConfig['corte'] })}
              options={[
                { value: 'tapita', label: 'Tapita' },
                { value: 'costura', label: 'Costura' },
              ]}
            />
          </Field>
          <Field label="Porta estribera inglés">
            <Pick
              label="Porta estribera inglés"
              value={c.portaEstriberaIngles ? 'si' : 'no'}
              onChange={(v) => set({ portaEstriberaIngles: v === 'si' })}
              options={[
                { value: 'no', label: 'No' },
                { value: 'si', label: 'Sí · costo extra' },
              ]}
            />
            {c.portaEstriberaIngles ? (
              <ExtraNote
                extra={pricePoint(pricing, 'portaEstribera')}
                currency={currency}
              />
            ) : null}
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Iniciales">
            <Pick
              label="Iniciales"
              value={c.iniciales ? 'si' : 'no'}
              onChange={(v) =>
                set(
                  v === 'si'
                    ? {
                        iniciales: true,
                        logoPersonalizado: false,
                        logoPersonalizadoImagen: '',
                      }
                    : { iniciales: false },
                )
              }
              options={[
                { value: 'no', label: 'No' },
                { value: 'si', label: 'Sí · costo extra' },
              ]}
            />
          </Field>
          <Field label="Logo personalizado">
            <Pick
              label="Logo personalizado"
              value={c.logoPersonalizado ? 'si' : 'no'}
              onChange={(v) =>
                set(
                  v === 'si'
                    ? {
                        logoPersonalizado: true,
                        iniciales: false,
                        inicialesTexto: '',
                      }
                    : {
                        logoPersonalizado: false,
                        logoPersonalizadoImagen: '',
                      },
                )
              }
              options={[
                { value: 'no', label: 'No' },
                { value: 'si', label: 'Sí · costo extra' },
              ]}
            />
          </Field>
          {c.iniciales || c.logoPersonalizado ? (
            <Field label="Ubicación *">
              <Pick
                label="Ubicación"
                value={c.personalizacionUbicacion}
                onChange={(v) =>
                  set({
                    personalizacionUbicacion:
                      v as MonturaConfig['personalizacionUbicacion'],
                  })
                }
                options={MONTURA_PERSONALIZACION_PLACES.map((place) => ({
                  value: place.id,
                  label: place.label,
                }))}
              />
            </Field>
          ) : null}
          {c.iniciales ? (
            <>
              <Field label="Texto de iniciales *">
                <input
                  value={c.inicialesTexto}
                  maxLength={24}
                  onChange={(e) => set({ inicialesTexto: e.target.value })}
                  placeholder="IC"
                />
              </Field>
              <Field label="Tipografía *">
                <Pick
                  label="Tipografía"
                  value={c.inicialesTipografia}
                  onChange={(v) => set({ inicialesTipografia: v })}
                  options={FONTS.map((font) => ({
                    value: font.id,
                    label: font.label,
                  }))}
                />
              </Field>
              <ColorPicker
                label="Color de iniciales *"
                value={c.inicialesColor}
                onChange={(id) => set({ inicialesColor: id })}
              />
              <InitialsPreview
                text={c.inicialesTexto}
                fontId={c.inicialesTipografia}
                colorId={c.inicialesColor}
                surfaceId={c.color}
              />
              <ExtraNote
                extra={pricePoint(pricing, 'iniciales')}
                currency={currency}
              />
            </>
          ) : null}
        </div>
        {c.logoPersonalizado ? (
          <>
            <Field label="Imagen del logo *" wide>
              <Photos
                value={
                  c.logoPersonalizadoImagen
                    ? [c.logoPersonalizadoImagen]
                    : []
                }
                max={1}
                onChange={(urls) =>
                  set({ logoPersonalizadoImagen: urls[0] || '' })
                }
                onError={onError || (() => undefined)}
                onBusy={onBusy || (() => undefined)}
              />
            </Field>
            <ExtraNote
              extra={pricePoint(pricing, 'logoPersonalizado')}
              currency={currency}
            />
          </>
        ) : null}
        <Field label="Comentarios" wide>
          <textarea
            value={c.comentarios}
            maxLength={500}
            rows={3}
            placeholder="Aclaraciones para el taller o el proveedor…"
            onChange={(e) => set({ comentarios: e.target.value })}
          />
        </Field>
        <ConfigSummary
          kind="montura"
          value={c}
          extras={extras}
          available={available}
          totals={totals}
          currency={currency}
        />
      </div>
    );
  }
  if (kind === 'rodillera') {
    const c = value as RodilleraConfig;
    const set = (patch: Partial<RodilleraConfig>) =>
      onChange({ ...c, ...patch });
    return (
      <div className="configurator">
        <ReferenceShots kind="rodillera" value={c} pricing={pricing} />
        <div className="form-grid">
          <Field label="Tipo *">
            <Pick
              label="Tipo"
              value={c.tipo}
              onChange={(v) => set({ tipo: v as RodilleraConfig['tipo'] })}
              options={RODILLERA_TIPOS.map((tipo) => ({
                value: tipo.id,
                label: tipo.label,
              }))}
            />
          </Field>
          <Field label="Modelo *">
            <Pick
              label="Modelo"
              value={c.modelo}
              onChange={(v) => set({ modelo: v as RodilleraConfig['modelo'] })}
              options={RODILLERA_MODELOS.map((modelo) => ({
                value: modelo.id,
                label: modelo.label,
              }))}
            />
            {c.modelo === 'premium' ? (
              <ExtraNote
                extra={pricePoint(pricing, 'modelo_premium')}
                currency={currency}
              />
            ) : null}
          </Field>
          <Field label="Color *">
            <Pick
              label="Color"
              value={c.color}
              onChange={(v) => set({ color: v as RodilleraConfig['color'] })}
              options={RODILLERA_COLORS.map((color) => ({
                value: color.id,
                label: color.label,
              }))}
            />
          </Field>
          <Field label="Tamaño *">
            <Pick
              label="Tamaño"
              value={c.tamano}
              onChange={(v) => set({ tamano: v as RodilleraConfig['tamano'] })}
              options={RODILLERA_SIZES.map((size) => ({
                value: size.id,
                label: size.label,
              }))}
            />
          </Field>
          <Field label="Color protector centro *" wide>
            <Pick
              label="Color protector centro"
              value={c.protectorCentroColor}
              onChange={(v) =>
                set({
                  protectorCentroColor:
                    v as RodilleraConfig['protectorCentroColor'],
                })
              }
              options={RODILLERA_COLORS.map((color) => ({
                value: color.id,
                label: color.label,
              }))}
            />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Iniciales">
            <Pick
              label="Iniciales"
              value={c.iniciales ? 'si' : 'no'}
              onChange={(v) => set({ iniciales: v === 'si' })}
              options={[
                { value: 'no', label: 'No' },
                { value: 'si', label: 'Sí · costo extra' },
              ]}
            />
          </Field>
          {c.iniciales ? (
            <>
              <Field label="Texto de iniciales *">
                <input
                  value={c.inicialesTexto}
                  maxLength={24}
                  onChange={(e) => set({ inicialesTexto: e.target.value })}
                  placeholder="IC"
                />
              </Field>
              <Field label="Tamaño *">
                <Pick
                  label="Tamaño de iniciales"
                  value={c.inicialesTamano}
                  onChange={(v) =>
                    set({
                      inicialesTamano: v as RodilleraConfig['inicialesTamano'],
                    })
                  }
                  options={RODILLERA_SIZES.map((size) => ({
                    value: size.id,
                    label: size.label,
                  }))}
                />
              </Field>
              <Field label="Ubicación *">
                <Pick
                  label="Ubicación de iniciales"
                  value={c.inicialesUbicacion}
                  onChange={(v) =>
                    set({
                      inicialesUbicacion:
                        v as RodilleraConfig['inicialesUbicacion'],
                    })
                  }
                  options={RODILLERA_PLACES.map((place) => ({
                    value: place.id,
                    label: place.label,
                  }))}
                />
              </Field>
              <Field label="Tipografía *">
                <Pick
                  label="Tipografía"
                  value={c.inicialesTipografia}
                  onChange={(v) => set({ inicialesTipografia: v })}
                  options={FONTS.map((font) => ({
                    value: font.id,
                    label: font.label,
                  }))}
                />
              </Field>
              <ColorPicker
                label="Color de iniciales *"
                value={c.inicialesColor}
                onChange={(id) => set({ inicialesColor: id })}
              />
              <InitialsPreview
                text={c.inicialesTexto}
                fontId={c.inicialesTipografia}
                colorId={c.inicialesColor}
                surfaceId={c.color}
              />
              <ExtraNote
                extra={pricePoint(pricing, 'iniciales')}
                currency={currency}
              />
            </>
          ) : null}
          <Field label="Bordado">
            <Pick
              label="Bordado"
              value={c.bordado ? 'si' : 'no'}
              onChange={(v) => set({ bordado: v === 'si' })}
              options={[
                { value: 'no', label: 'No' },
                { value: 'si', label: 'Sí · costo extra' },
              ]}
            />
          </Field>
        </div>
        {c.bordado ? (
          <>
            <div className="form-grid">
              <Field label="Tamaño *">
                <Pick
                  label="Tamaño de bordado"
                  value={c.bordadoTamano}
                  onChange={(v) =>
                    set({
                      bordadoTamano: v as RodilleraConfig['bordadoTamano'],
                    })
                  }
                  options={RODILLERA_SIZES.map((size) => ({
                    value: size.id,
                    label: size.label,
                  }))}
                />
              </Field>
              <Field label="Ubicación *">
                <Pick
                  label="Ubicación de bordado"
                  value={c.bordadoUbicacion}
                  onChange={(v) =>
                    set({
                      bordadoUbicacion:
                        v as RodilleraConfig['bordadoUbicacion'],
                    })
                  }
                  options={RODILLERA_PLACES.map((place) => ({
                    value: place.id,
                    label: place.label,
                  }))}
                />
              </Field>
            </div>
            <ColorPicker
              label="Color de hilo *"
              value={c.bordadoColor}
              onChange={(id) => set({ bordadoColor: id })}
            />
            <Field label="Imagen del bordado *" wide>
              <Photos
                value={c.bordadoImagen ? [c.bordadoImagen] : []}
                max={1}
                onChange={(urls) => set({ bordadoImagen: urls[0] || '' })}
                onError={onError || (() => undefined)}
                onBusy={onBusy || (() => undefined)}
              />
            </Field>
            <ExtraNote
              extra={pricePoint(pricing, 'bordado')}
              currency={currency}
            />
          </>
        ) : null}
        <ConfigSummary
          kind="rodillera"
          value={c}
          extras={extras}
          available={available}
          totals={totals}
          currency={currency}
        />
      </div>
    );
  }
  if (kind === 'bota') {
    const c = value as BotaConfig;
    const set = (patch: Partial<BotaConfig>) => onChange({ ...c, ...patch });
    const setMeasure = (id: BotaMeasureId, value: string) =>
      set({
        medidas: {
          ...c.medidas,
          [id]: sanitizeMeasure(value),
        },
      });
    return (
      <div className="configurator">
        <ReferenceShots kind="bota" value={c} pricing={pricing} />
        <div className="form-grid">
          <Field label="Modelo *">
            <Pick
              label="Modelo"
              value={c.modelo}
              onChange={(v) => set({ modelo: v as BotaConfig['modelo'] })}
              options={BOTA_MODELOS.map((modelo) => ({
                value: modelo.id,
                label: modelo.label,
              }))}
            />
            {c.modelo !== BOTA_BASE_MODELO ? (
              <ExtraNote
                extra={pricePoint(pricing, botaModeloPriceId(c.modelo))}
                currency={currency}
              />
            ) : null}
          </Field>
          <Field label="Material *">
            <Pick
              label="Material"
              value={c.material}
              onChange={(v) => set({ material: v as BotaConfig['material'] })}
              options={BOTA_MATERIALS.map((material) => ({
                value: material.id,
                label: material.label,
              }))}
            />
            <ExtraNote
              extra={pricePoint(pricing, `material_${c.material}`)}
              currency={currency}
            />
          </Field>
          <Field label="Color *">
            <Pick
              label="Color"
              value={c.color}
              onChange={(v) => set({ color: v as BotaConfig['color'] })}
              options={BOTA_COLORS.map((color) => ({
                value: color.id,
                label: color.label,
              }))}
            />
          </Field>
          <Field label="Acabado *">
            <Pick
              label="Acabado"
              value={c.acabado}
              onChange={(v) => set({ acabado: v as BotaConfig['acabado'] })}
              options={BOTA_ACABADOS.map((acabado) => ({
                value: acabado.id,
                label: acabado.label,
              }))}
            />
          </Field>
        </div>
        <section className="bota-measures">
          <figure className="bota-measures-chart">
            <img
              src="/botas-medidas.png"
              alt="Referencia de las 7 medidas de la bota"
            />
            <figcaption>Referencia de medidas</figcaption>
          </figure>
          <div className="bota-measures-fields">
            {BOTA_MEASURES.map((measure) => (
              <Field key={measure.id} label={`${measure.n}. ${measure.label} *`}>
                <input
                  required
                  inputMode="decimal"
                  placeholder="0"
                  value={c.medidas[measure.id]}
                  onChange={(e) =>
                    setMeasure(measure.id, e.target.value)
                  }
                />
              </Field>
            ))}
          </div>
        </section>
        <div className="form-grid">
          <Field label="Iniciales">
            <Pick
              label="Iniciales"
              value={c.iniciales ? 'si' : 'no'}
              onChange={(v) => set({ iniciales: v === 'si' })}
              options={[
                { value: 'no', label: 'No' },
                { value: 'si', label: 'Sí · costo extra' },
              ]}
            />
          </Field>
          {c.iniciales ? (
            <>
              <Field label="Texto de iniciales *">
                <input
                  value={c.inicialesTexto}
                  maxLength={24}
                  onChange={(e) => set({ inicialesTexto: e.target.value })}
                  placeholder="IC"
                />
              </Field>
              <Field label="Ubicación *">
                <Pick
                  label="Ubicación de iniciales"
                  value={c.inicialesUbicacion}
                  onChange={(v) =>
                    set({
                      inicialesUbicacion:
                        v as BotaConfig['inicialesUbicacion'],
                    })
                  }
                  options={BOTA_PLACES.map((place) => ({
                    value: place.id,
                    label: place.label,
                  }))}
                />
              </Field>
              <Field label="Tipografía *">
                <Pick
                  label="Tipografía"
                  value={c.inicialesTipografia}
                  onChange={(v) => set({ inicialesTipografia: v })}
                  options={FONTS.map((font) => ({
                    value: font.id,
                    label: font.label,
                  }))}
                />
              </Field>
              <ColorPicker
                label="Color de iniciales *"
                value={c.inicialesColor}
                onChange={(id) => set({ inicialesColor: id })}
              />
              <InitialsPreview
                text={c.inicialesTexto}
                fontId={c.inicialesTipografia}
                colorId={c.inicialesColor}
                surfaceId={c.color}
              />
              <ExtraNote
                extra={pricePoint(pricing, 'iniciales')}
                currency={currency}
              />
            </>
          ) : null}
          <Field label="Parche">
            <Pick
              label="Parche"
              value={c.parche ? 'con' : 'sin'}
              onChange={(v) => set({ parche: v === 'con' })}
              options={[
                { value: 'sin', label: 'Sin' },
                { value: 'con', label: 'Con · costo extra' },
              ]}
            />
            {c.parche ? (
              <ExtraNote
                extra={pricePoint(pricing, 'parche')}
                currency={currency}
              />
            ) : null}
          </Field>
          <Field label="Pasador rodillera">
            <Pick
              label="Pasador rodillera"
              value={c.pasadorRodillera ? 'con' : 'sin'}
              onChange={(v) => set({ pasadorRodillera: v === 'con' })}
              options={[
                { value: 'sin', label: 'Sin' },
                { value: 'con', label: 'Con · costo extra' },
              ]}
            />
            {c.pasadorRodillera ? (
              <ExtraNote
                extra={pricePoint(pricing, 'pasadorRodillera')}
                currency={currency}
              />
            ) : null}
          </Field>
          <Field label="Tope espuelas">
            <Pick
              label="Tope espuelas"
              value={c.topeEspuelas ? 'con' : 'sin'}
              onChange={(v) => set({ topeEspuelas: v === 'con' })}
              options={[
                { value: 'sin', label: 'Sin' },
                { value: 'con', label: 'Con · costo extra' },
              ]}
            />
            {c.topeEspuelas ? (
              <ExtraNote
                extra={pricePoint(pricing, 'topeEspuelas')}
                currency={currency}
              />
            ) : null}
          </Field>
          <Field label="Engrasado">
            <Pick
              label="Engrasado"
              value={c.engrasado ? 'si' : 'no'}
              onChange={(v) => set({ engrasado: v === 'si' })}
              options={[
                { value: 'no', label: 'No' },
                { value: 'si', label: 'Sí · costo extra' },
              ]}
            />
            {c.engrasado ? (
              <ExtraNote
                extra={pricePoint(pricing, 'engrasado')}
                currency={currency}
              />
            ) : null}
          </Field>
        </div>
        <ConfigSummary
          kind="bota"
          value={c}
          extras={extras}
          available={available}
          totals={totals}
          currency={currency}
        />
      </div>
    );
  }
  if (isNewCascoConfig(value)) {
    return (
      <CascoConfiguratorNew
        value={value}
        onChange={onChange}
        movements={movements}
        productId={productId}
        pricing={pricing}
        currency={currency}
        onError={onError}
        onBusy={onBusy}
      />
    );
  }
  const c = value as CascoConfigLegacy;
  const set = (patch: Partial<CascoConfigLegacy>) =>
    onChange({ ...c, ...patch });
  return (
    <div className="configurator">
      <ReferenceShots kind="casco" value={c} pricing={pricing} />
      <Field label="Imágenes de referencia del diseño" wide>
        <Photos
          value={configDesignPhotos('casco', c)}
          max={CASCO_DISENO_MAX}
          camera
          onChange={(urls) =>
            set({ disenoImagenes: urls, disenoImagen: urls[0] || '' })
          }
          onError={onError || (() => undefined)}
          onBusy={onBusy || (() => undefined)}
        />
        <small>
          Podés adjuntar varios bocetos, mockups o fotos del casco para ilustrar
          el diseño al proveedor.
        </small>
      </Field>
      <div className="form-grid">
        <Field label="Modelo *">
          <Pick
            label="Modelo"
            value={c.modelo}
            onChange={(v) => set({ modelo: v as CascoConfigLegacy['modelo'] })}
            options={[
              { value: 'h1', label: 'H1 homologado' },
              { value: 'standard', label: 'Standard sin homologar' },
            ]}
          />
          {c.modelo === 'h1' ? (
            <ExtraNote
              extra={pricePoint(pricing, 'modelo_h1')}
              currency={currency}
            />
          ) : null}
        </Field>
        <Field label="Tipo de vicera *">
          <Pick
            label="Tipo de vicera"
            value={c.vicera}
            onChange={(v) => set({ vicera: v as CascoConfigLegacy['vicera'] })}
            options={[
              { value: 'lock', label: 'Lock / English' },
              { value: 'argentina', label: 'Argentina' },
            ]}
          />
        </Field>
        <Field label="Tamaño *" wide>
          <Pick
            label="Tamaño"
            value={c.tamano}
            onChange={(v) => set({ tamano: v })}
            options={HELMET_SIZES.map((size) => ({
              value: size.id,
              label: size.label,
            }))}
          />
        </Field>
        <Field label="Material externo *">
          <Pick
            label="Material externo"
            value={c.materialExterno}
            onChange={(v) =>
              set({ materialExterno: v as CascoConfigLegacy['materialExterno'] })
            }
            options={HELMET_MATERIALS.map((material) => ({
              value: material.id,
              label: material.label,
            }))}
          />
          <ExtraNote
            extra={pricePoint(pricing, `material_${c.materialExterno}`)}
            currency={currency}
          />
        </Field>
      </div>
      <ColorPicker
        label="Color casco *"
        value={c.colorCasco}
        colors={LEGACY_BODY_COLORS}
        onChange={(id) => set({ colorCasco: id })}
      />
      <ColorPicker
        label="Vicera arriba *"
        value={c.colorViceraArriba}
        colors={LEGACY_BODY_COLORS}
        onChange={(id) => set({ colorViceraArriba: id })}
      />
      <ColorPicker
        label="Vicera abajo *"
        value={c.colorViceraAbajo}
        colors={LEGACY_BODY_COLORS}
        onChange={(id) => set({ colorViceraAbajo: id })}
      />
      {c.vicera === 'argentina' ? (
        <ColorPicker
          label="Banda vicera *"
          value={c.colorBandaVicera}
          colors={LEGACY_BODY_COLORS}
          onChange={(id) => set({ colorBandaVicera: id })}
        />
      ) : null}
      <ColorPicker
        label="Tapones / airholes *"
        value={c.colorTapones}
        colors={LEGACY_BODY_COLORS}
        onChange={(id) => set({ colorTapones: id })}
      />
      <div className="form-grid">
        <Field label="Correaje *">
          <Pick
            label="Correaje"
            value={c.correaje ? 'si' : 'no'}
            onChange={(v) => set({ correaje: v === 'si' })}
            options={[
              { value: 'no', label: 'Sin correaje' },
              { value: 'si', label: 'Con correaje' },
            ]}
          />
        </Field>
        {c.correaje ? (
          <ColorPicker
            label="Color de correaje *"
            value={c.correajeColor}
            colors={LEGACY_BODY_COLORS}
            onChange={(id) => set({ correajeColor: id })}
          />
        ) : null}
        <Field label="Logo IC · ubicación *">
          <Pick
            label="Ubicación logo IC"
            value={c.logoIcUbicacion}
            onChange={(v) =>
              set({ logoIcUbicacion: v as CascoConfigLegacy['logoIcUbicacion'] })
            }
            options={[
              { value: 'derecha', label: 'Lado derecho' },
              { value: 'izquierda', label: 'Lado izquierdo' },
            ]}
          />
        </Field>
        <Field label="Color personalizado logo IC">
          <Pick
            label="Color personalizado logo IC"
            value={c.logoIcColorPersonalizado ? 'si' : 'no'}
            onChange={(v) => set({ logoIcColorPersonalizado: v === 'si' })}
            options={[
              { value: 'no', label: 'Color estándar' },
              { value: 'si', label: 'Personalizado · costo extra' },
            ]}
          />
        </Field>
      </div>
      {c.logoIcColorPersonalizado ? (
        <>
          <ColorPicker
            label="Color del logo IC *"
            value={c.logoIcColor}
            onChange={(id) => set({ logoIcColor: id })}
          />
          <ExtraNote
            extra={pricePoint(pricing, 'logoIcColor')}
            currency={currency}
          />
        </>
      ) : null}
      <div className="form-grid">
        <Field label="Iniciales">
          <Pick
            label="Iniciales"
            value={c.iniciales ? 'si' : 'no'}
            onChange={(v) => set({ iniciales: v === 'si' })}
            options={[
              { value: 'no', label: 'No' },
              { value: 'si', label: 'Sí · costo extra' },
            ]}
          />
        </Field>
        {c.iniciales ? (
          <>
            <Field label="Texto de iniciales *">
              <input
                value={c.inicialesTexto}
                maxLength={24}
                onChange={(e) => set({ inicialesTexto: e.target.value })}
                placeholder="IC"
              />
            </Field>
            <Field label="Tipografía *">
              <Pick
                label="Tipografía"
                value={c.inicialesTipografia}
                onChange={(v) => set({ inicialesTipografia: v })}
                options={FONTS.map((font) => ({
                  value: font.id,
                  label: font.label,
                }))}
              />
            </Field>
            <Field label="Ubicación *">
              <Pick
                label="Ubicación de iniciales"
                value={c.inicialesUbicacion}
                onChange={(v) =>
                  set({
                    inicialesUbicacion: v as CascoConfigLegacy['inicialesUbicacion'],
                  })
                }
                options={[
                  { value: 'derecha', label: 'Derecha' },
                  { value: 'izquierda', label: 'Izquierda' },
                ]}
              />
            </Field>
            <Field label="Tamaño *">
              <Pick
                label="Tamaño de iniciales"
                value={c.inicialesTamano}
                onChange={(v) =>
                  set({ inicialesTamano: v as CascoConfigLegacy['inicialesTamano'] })
                }
                options={[
                  { value: '14', label: 'Chico · 14 mm' },
                  { value: '16', label: 'Mediano · 16 mm' },
                  { value: '18', label: 'Grande · 18 mm' },
                ]}
              />
            </Field>
            <ColorPicker
              label="Color de iniciales *"
              value={c.inicialesColor}
              onChange={(id) => set({ inicialesColor: id })}
            />
            <InitialsPreview
              text={c.inicialesTexto}
              fontId={c.inicialesTipografia}
              colorId={c.inicialesColor}
              surfaceId={c.colorCasco}
            />
            <ExtraNote
              extra={pricePoint(pricing, 'iniciales')}
              currency={currency}
            />
          </>
        ) : null}
        <Field label="Bandera bordada">
          <Pick
            label="Bandera bordada"
            value={c.bandera ? 'si' : 'no'}
            onChange={(v) => set({ bandera: v === 'si' })}
            options={[
              { value: 'no', label: 'No' },
              { value: 'si', label: 'Sí · costo extra' },
            ]}
          />
        </Field>
        {c.bandera ? (
          <>
            <Field label="País *">
              <Pick
                label="País"
                value={c.banderaPais}
                onChange={(v) => set({ banderaPais: v })}
                options={COUNTRIES.map((country) => ({
                  value: country,
                  label: country,
                }))}
              />
            </Field>
            <Field label="Ubicación *">
              <Pick
                label="Ubicación de bandera"
                value={c.banderaUbicacion}
                onChange={(v) =>
                  set({
                    banderaUbicacion: v as CascoConfigLegacy['banderaUbicacion'],
                  })
                }
                options={[
                  { value: 'derecha', label: 'Derecha' },
                  { value: 'izquierda', label: 'Izquierda' },
                  { value: 'frente', label: 'Frente' },
                  { value: 'atras', label: 'Atrás' },
                ]}
              />
            </Field>
            <ExtraNote
              extra={pricePoint(pricing, 'bandera')}
              currency={currency}
            />
          </>
        ) : null}
        <Field label="Logo personalizado">
          <Pick
            label="Logo personalizado"
            value={c.logoPersonalizado ? 'si' : 'no'}
            onChange={(v) => set({ logoPersonalizado: v === 'si' })}
            options={[
              { value: 'no', label: 'No' },
              { value: 'si', label: 'Sí · costo extra' },
            ]}
          />
        </Field>
      </div>
      {c.logoPersonalizado ? (
        <>
          <div className="form-grid">
            <Field label="Posición *">
              <Pick
                label="Posición del logo"
                value={c.logoPersonalizadoPosicion}
                onChange={(v) =>
                  set({
                    logoPersonalizadoPosicion:
                      v as CascoConfigLegacy['logoPersonalizadoPosicion'],
                  })
                }
                options={[
                  { value: 'derecha', label: 'Derecha' },
                  { value: 'izquierda', label: 'Izquierda' },
                  { value: 'frente', label: 'Frente' },
                  { value: 'atras', label: 'Atrás' },
                ]}
              />
            </Field>
            <Field label="Tamaño *">
              <Pick
                label="Tamaño del logo"
                value={c.logoPersonalizadoTamano}
                onChange={(v) =>
                  set({
                    logoPersonalizadoTamano:
                      v as CascoConfigLegacy['logoPersonalizadoTamano'],
                  })
                }
                options={[
                  { value: 'chico', label: 'Chico' },
                  { value: 'mediano', label: 'Mediano' },
                  { value: 'grande', label: 'Grande' },
                ]}
              />
            </Field>
          </div>
          <Field label="Imagen del logo *" wide>
            <Photos
              value={
                c.logoPersonalizadoImagen ? [c.logoPersonalizadoImagen] : []
              }
              max={1}
              onChange={(urls) =>
                set({ logoPersonalizadoImagen: urls[0] || '' })
              }
              onError={onError || (() => undefined)}
              onBusy={onBusy || (() => undefined)}
            />
          </Field>
          <ExtraNote
            extra={pricePoint(pricing, 'logoPersonalizado')}
            currency={currency}
          />
        </>
      ) : null}
      <ConfigSummary
        kind="casco"
        value={c}
        extras={extras}
        available={available}
        totals={totals}
        currency={currency}
      />
    </div>
  );
}

const EXTRA_LABEL: Record<string, string> = {
  faldin: 'Faldín',
  portaEstribera: 'Porta estribera inglés',
  iniciales: 'Iniciales',
  correaje: 'Correaje',
  bandera: 'Bandera',
  logoIcColor: 'Color logo IC',
  logoPersonalizado: 'Logo personalizado',
  bordado: 'Bordado',
  parche: 'Parche',
  pasadorRodillera: 'Pasador rodillera',
  topeEspuelas: 'Tope espuelas',
  engrasado: 'Engrasado',
};

function extraForLabel(
  label: string,
  extras: ReturnType<typeof extraCharges>,
) {
  return extras.find((charge) => {
    if (EXTRA_LABEL[charge.id] === label) return true;
    if (charge.id === 'correaje' && label === 'Correaje') return true;
    if (charge.id === 'logoPersonalizado' && label === 'Logo propio')
      return true;
    if (charge.id.startsWith('tipo_') && label === 'Tipo') return true;
    if (charge.id.startsWith('material_') && label === 'Material') return true;
    if (charge.id.startsWith('asiento_') && label === 'Material asiento')
      return true;
    if (charge.id.startsWith('modelo_') && label === 'Modelo') return true;
    if (charge.id.startsWith('material_') && label === 'Material externo')
      return true;
    return false;
  });
}

function ConfigSummary({
  kind,
  value,
  extras,
  available,
  totals,
  currency,
}: {
  kind: ConfiguredKind;
  value: ProductConfig;
  extras: ReturnType<typeof extraCharges>;
  available: number | null;
  totals: ReturnType<typeof extraTotals>;
  currency: string;
}) {
  const labels = configLabels(kind, value);
  return (
    <div className="config-summary">
      {available != null ? (
        <p>
          <strong>{available}</strong> unidades de esta combinación en stock.
        </p>
      ) : null}
      <ul>
        {Object.entries(labels).map(([label, text]) => {
          const charge = extraForLabel(label, extras);
          return (
            <li key={label}>
              {label}: {text}
              {charge?.extra.pending
                ? ' · extra pendiente'
                : charge?.extra.price
                  ? ` · +${formatMoney(charge.extra.price, currency)}`
                  : ''}
            </li>
          );
        })}
      </ul>
      {totals.pending ? (
        <p className="hint">
          Completá los precios de esta configuración en Productos.
        </p>
      ) : null}
    </div>
  );
}
