import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const LABELS = {
  '': 'Home',
  dashboard: 'Dashboard',
  documents: 'Documents',
};

function Breadcrumbs() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);

  const items = [{ path: '/', label: LABELS[''] }];
  let acc = '';
  parts.forEach((segment) => {
    acc += `/${segment}`;
    items.push({ path: acc, label: LABELS[segment] || segment });
  });

  return (
    <nav className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 flex-wrap">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-2">
              {idx > 0 && <span className="text-gray-400">/</span>}
              {isLast ? (
                <span className="font-medium text-gray-800 dark:text-gray-100">{item.label}</span>
              ) : (
                <Link className="hover:underline" to={item.path}>{item.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumbs


