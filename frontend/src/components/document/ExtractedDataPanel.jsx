import React from 'react'

function Field({ label, value, onChange, status }) {
  const border = status === 'valid' ? 'border-green-300' : status === 'warn' ? 'border-yellow-300' : status === 'error' ? 'border-red-300' : 'border-gray-300';
  const dot = status === 'valid' ? 'bg-green-500' : status === 'warn' ? 'bg-yellow-500' : status === 'error' ? 'bg-red-500' : 'bg-gray-300';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm text-gray-700">{label}</div>
        <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
      </div>
      <input className={`w-full px-2 py-1 rounded border ${border} text-sm`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

const validity = {
  text: (v) => (!v ? 'warn' : 'valid'),
  vendor: (v) => (!v ? 'warn' : 'valid'),
  date: (v) => (!v ? 'warn' : /^\d{4}-\d{2}-\d{2}/.test(String(v)) ? 'valid' : 'error'),
  number: (v) => (v === null || v === undefined || v === '' ? 'warn' : isNaN(Number(v)) ? 'error' : 'valid'),
  currency: (v) => (!v ? 'warn' : /^[A-Za-z]{3}$/.test(String(v)) ? 'valid' : 'error'),
  optional: () => 'valid',
};

function flattenForCsv(obj) {
  const base = { ...obj };
  delete base.line_items;
  const flat = { ...base };
  if (Array.isArray(obj.line_items)) {
    obj.line_items.forEach((li, idx) => {
      flat[`line_items_${idx + 1}_description`] = li?.description ?? '';
      flat[`line_items_${idx + 1}_quantity`] = li?.quantity ?? '';
      flat[`line_items_${idx + 1}_unit_rate`] = li?.unit_rate ?? '';
      flat[`line_items_${idx + 1}_amount`] = li?.amount ?? '';
    });
  }
  return flat;
}

function csvEscape(v) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export default function ExtractedDataPanel({ id, data, onFieldChange, onLineItemChange }) {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document_${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const flat = flattenForCsv(data);
    const header = Object.keys(flat).join(',');
    const row = Object.values(flat).map(csvEscape).join(',');
    const csv = header + '\n' + row + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document_${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow h-[78vh] flex flex-col">
      <div className="sticky top-0 z-10 bg-white p-3 border-b">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Extracted Data</div>
          <div className="flex gap-2">
            <button onClick={exportJson} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm">Export JSON</button>
            <button onClick={exportCsv} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm">Export CSV</button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <Field label="Vendor" value={data.vendor_name} onChange={(v) => onFieldChange('vendor_name', v)} status={validity.vendor(data.vendor_name)} />
        <Field label="Customer" value={data.customer_name} onChange={(v) => onFieldChange('customer_name', v)} status={validity.text(data.customer_name)} />
        <Field label="Account #" value={data.account_number} onChange={(v) => onFieldChange('account_number', v)} status={validity.text(data.account_number)} />
        <Field label="Receipt #" value={data.receipt_number} onChange={(v) => onFieldChange('receipt_number', v)} status={validity.text(data.receipt_number)} />
        <Field label="Transaction ID" value={data.transaction_id} onChange={(v) => onFieldChange('transaction_id', v)} status={validity.text(data.transaction_id)} />
        <Field label="Transaction Date" value={data.transaction_date} onChange={(v) => onFieldChange('transaction_date', v)} status={validity.date(data.transaction_date)} />
        <Field label="Amount" value={data.amount} onChange={(v) => onFieldChange('amount', v)} status={validity.number(data.amount)} />
        <Field label="Currency" value={data.currency} onChange={(v) => onFieldChange('currency', v)} status={validity.currency(data.currency)} />
        <Field label="Payment Status" value={data.payment_status} onChange={(v) => onFieldChange('payment_status', v)} status={validity.text(data.payment_status)} />
        <Field label="Payment Method" value={data.payment_method} onChange={(v) => onFieldChange('payment_method', v)} status={validity.text(data.payment_method)} />
        <Field label="Linked Bill #" value={data.linked_bill_number} onChange={(v) => onFieldChange('linked_bill_number', v)} status={validity.text(data.linked_bill_number)} />
        <Field label="Billing Start" value={data.billing_period_start} onChange={(v) => onFieldChange('billing_period_start', v)} status={validity.date(data.billing_period_start)} />
        <Field label="Billing End" value={data.billing_period_end} onChange={(v) => onFieldChange('billing_period_end', v)} status={validity.date(data.billing_period_end)} />
        <Field label="Tax" value={data.tax_amount} onChange={(v) => onFieldChange('tax_amount', v)} status={validity.number(data.tax_amount)} />
        <Field label="Other Charges" value={data.other_charges} onChange={(v) => onFieldChange('other_charges', v)} status={validity.number(data.other_charges)} />
        <Field label="Total" value={data.total_amount} onChange={(v) => onFieldChange('total_amount', v)} status={validity.number(data.total_amount)} />
        <Field label="Generated At" value={data.generated_at} onChange={(v) => onFieldChange('generated_at', v)} status={validity.text(data.generated_at)} />
        <Field label="Remarks" value={data.remarks} onChange={(v) => onFieldChange('remarks', v)} status={validity.optional()} />

        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Line Items</div>
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
              <div className="col-span-6">Description</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Unit Rate</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            <div className="max-h-64 overflow-auto pr-1 space-y-2">
              {Array.isArray(data.line_items) && data.line_items.length > 0 ? (
                data.line_items.map((li, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      value={li?.description || ''}
                      onChange={(e) => onLineItemChange(idx, 'description', e.target.value)}
                      className="col-span-6 border rounded px-2 py-1 text-sm"
                      placeholder="Description"
                    />
                    <input
                      type="number"
                      value={li?.quantity || ''}
                      onChange={(e) => onLineItemChange(idx, 'quantity', e.target.value)}
                      className="col-span-2 border rounded px-2 py-1 text-sm"
                      placeholder="Qty"
                    />
                    <input
                      type="number"
                      value={li?.unit_rate || ''}
                      onChange={(e) => onLineItemChange(idx, 'unit_rate', e.target.value)}
                      className="col-span-2 border rounded px-2 py-1 text-sm"
                      placeholder="Unit Rate"
                    />
                    <input
                      type="number"
                      value={li?.amount || ''}
                      onChange={(e) => onLineItemChange(idx, 'amount', e.target.value)}
                      className="col-span-2 border rounded px-2 py-1 text-sm text-right"
                      placeholder="Amount"
                    />
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500 px-1">No line items</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 bg-white p-3 border-t">
        <button type="button" className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Save Changes</button>
      </div>
    </div>
  )
}


