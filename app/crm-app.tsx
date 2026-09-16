'use client';

import CRM from './crm';
import { CrmNavProvider, type CrmRoute } from './crm-nav';

export { CrmLink, useCrmNav } from './crm-nav';

export default function CrmApp(props: CrmRoute) {
  return (
    <CrmNavProvider {...props}>
      {(route) => (
        <CRM
          module={route.module}
          initialFilter={route.initialFilter}
          accountView={route.accountView}
          accountYear={route.accountYear}
        />
      )}
    </CrmNavProvider>
  );
}
