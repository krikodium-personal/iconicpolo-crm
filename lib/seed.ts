import { db } from '@/db';
import { obj, stmt, ensureAccountTables } from './server';
import { RODILLERA_FIELDS, RODILLERA_SKU_ATTRIBUTES } from './variants';
export async function seed(demo: boolean) {
  const d = db();
  await ensureAccountTables();
  const contactColumns = await stmt('PRAGMA table_info(contacts)').all();
  const contactColumnNames = new Set(
    contactColumns.results.map((column) => String(obj(column).name)),
  );
  const categoryNames = [
    ['monturas', 'Monturas'],
    ['botas', 'Botas'],
    ['tacos', 'Tacos'],
    ['rodilleras', 'Rodilleras'],
    ['cabezadas', 'Cabezadas'],
    ['cascos', 'Cascos'],
    ['accesorios', 'Accesorios'],
  ];
  const statements = [
    ...(!contactColumnNames.has('title')
      ? [stmt("ALTER TABLE contacts ADD title text NOT NULL DEFAULT ''")]
      : []),
    ...(!contactColumnNames.has('whatsapp_group')
      ? [
          stmt(
            "ALTER TABLE contacts ADD whatsapp_group text NOT NULL DEFAULT ''",
          ),
        ]
      : []),
    stmt("INSERT OR IGNORE INTO settings(id,currency) VALUES(1,'ARS')"),
    ...categoryNames.map(([id, name]) =>
      stmt(
        'INSERT OR IGNORE INTO categories(id,name,fields) VALUES(?,?,?)',
        id,
        name,
        JSON.stringify(
          id === 'monturas'
            ? [
                { name: 'Talle', values: ['16', '17', '18'] },
                { name: 'Color', values: ['Habano', 'Negro'] },
              ]
            : [],
        ),
      ),
    ),
    stmt(
      "UPDATE products SET category='cascos', version=version+1 WHERE category='accesorios' AND lower(name) LIKE 'casco%'",
    ),
    stmt(
      "UPDATE products SET category='cabezadas', version=version+1 WHERE category='accesorios' AND (lower(name) LIKE 'cabezada%' OR lower(name) LIKE 'cierra boca%' OR lower(name)='pelham' OR lower(name) LIKE 'riendas%' OR lower(name) LIKE 'riendillas%')",
    ),
    stmt(
      'UPDATE categories SET fields=? WHERE id=?',
      JSON.stringify(RODILLERA_FIELDS),
      'rodilleras',
    ),
    ...Object.entries(RODILLERA_SKU_ATTRIBUTES).map(([sku, attributes]) =>
      stmt(
        'UPDATE products SET attributes=json_patch(attributes, ?), version=version+1 WHERE sku=?',
        JSON.stringify(attributes),
        sku,
      ),
    ),
  ];
  if (demo) {
    if (
      await stmt(
        'SELECT id FROM products UNION ALL SELECT id FROM contacts UNION ALL SELECT id FROM orders LIMIT 1',
      ).first()
    )
      throw new Error('Los ejemplos sólo se pueden cargar en una base vacía.');
    for (const [id, kind, name, contact, phone, address] of [
      [
        'demo-s1',
        'supplier',
        'Talabartería del Sur',
        'Tomás Medina',
        '5491100000001',
        'Pilar, Buenos Aires',
      ],
      [
        'demo-s2',
        'supplier',
        'Estancia Leather',
        'Lucía Costa',
        '5491100000002',
        'San Antonio de Areco',
      ],
      [
        'demo-c1',
        'customer',
        'Sofía Alvear',
        'Sofía',
        '5491100000003',
        'Pilar, Buenos Aires',
      ],
      [
        'demo-c2',
        'customer',
        'Club Hípico Los Robles',
        'Martín Vidal',
        '5491100000004',
        'General Rodríguez',
      ],
      [
        'demo-c3',
        'customer',
        'Santiago Rivas',
        'Santiago',
        '5491100000005',
        'San Isidro',
      ],
    ])
      statements.push(
        stmt(
          "INSERT INTO contacts(id,kind,name,contact,phone,address,email,notes) VALUES(?,?,?,?,?,?,?,'Dato ficticio de ejemplo')",
          id,
          kind,
          name,
          contact,
          phone,
          address,
          `${id}@example.com`,
        ),
      );
    for (const [id, name, sku, cat, supplier, cost, price, stock] of [
      [
        'demo-p1',
        'Montura de salto Heritage',
        'MON-001',
        'monturas',
        'demo-s1',
        42000000,
        68000000,
        4,
      ],
      [
        'demo-p2',
        'Botas de polo Classic',
        'BOT-001',
        'botas',
        'demo-s2',
        16500000,
        28000000,
        8,
      ],
      [
        'demo-p3',
        'Taco de polo Pro 52',
        'TAC-001',
        'tacos',
        'demo-s1',
        6500000,
        11500000,
        12,
      ],
      [
        'demo-p4',
        'Rodilleras de cuero',
        'ROD-001',
        'rodilleras',
        'demo-s2',
        5500000,
        9500000,
        2,
      ],
      [
        'demo-p5',
        'Bolso ecuestre Weekend',
        'ACC-001',
        'accesorios',
        'demo-s2',
        4800000,
        8500000,
        6,
      ],
    ] as const) {
      statements.push(
        stmt(
          'INSERT INTO products(id,name,sku,category,supplier_id,cost,price,ff_discount,options) VALUES(?,?,?,?,?,?,?,?,?)',
          id,
          name,
          sku,
          cat,
          supplier,
          cost,
          price,
          1500,
          JSON.stringify(
            id === 'demo-p1'
              ? [
                  {
                    id: 'grabado',
                    name: 'Grabado personalizado',
                    price: 1200000,
                    cost: 400000,
                    photo: '',
                  },
                ]
              : [],
          ),
        ),
      );
      statements.push(
        stmt(
          "INSERT INTO stock_movements(id,product_id,quantity,reason,created_at) VALUES(?,?,?,'Stock inicial de ejemplo',?)",
          `initial-${id}`,
          id,
          stock,
          new Date().toISOString(),
        ),
      );
    }
    const orders = [
      [
        'demo-o1',
        'IC-DEMO-001',
        'demo-c1',
        'demo-p1',
        'Montura de salto Heritage',
        'MON-001',
        68000000,
        42000000,
        'cerrado',
        68000000,
      ],
      [
        'demo-o2',
        'IC-DEMO-002',
        'demo-c2',
        'demo-p2',
        'Botas de polo Classic',
        'BOT-001',
        28000000,
        16500000,
        'en producción',
        14000000,
      ],
      [
        'demo-o3',
        'IC-DEMO-003',
        'demo-c3',
        'demo-p3',
        'Taco de polo Pro 52',
        'TAC-001',
        11500000,
        6500000,
        'abierto',
        0,
      ],
    ] as const;
    for (const [
      id,
      number,
      customer,
      pid,
      name,
      sku,
      price,
      cost,
      status,
      paid,
    ] of orders) {
      statements.push(
        stmt(
          "INSERT INTO orders(id,number,customer_id,date,delivery,total,cost,paid,notes) VALUES(?,?,?,'2026-09-09','2026-09-18',?,?,?,'Pedido ficticio de ejemplo')",
          id,
          number,
          customer,
          price,
          cost,
          paid,
        ),
      );
      statements.push(
        stmt(
          'INSERT INTO order_items(id,order_id,product_id,name,sku,selections,unit_price,unit_cost,quantity,discount,total,cost) VALUES(?,?,?,?,?,\'{"options":[],"attributes":{}}\',?,?,1,0,?,?)',
          `${id}-item`,
          id,
          pid,
          name,
          sku,
          price,
          cost,
          price,
          cost,
        ),
      );
      statements.push(
        stmt(
          'UPDATE orders SET status=?,version=version+1 WHERE id=?',
          status,
          id,
        ),
      );
    }
  }
  await d.batch(statements);
  return { ok: true };
}
