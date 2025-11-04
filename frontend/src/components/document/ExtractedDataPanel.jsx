import React, { useState } from 'react'
import { updateExtractedDocumentApi } from '../../features/documents/api'
import { toast } from 'react-toastify'

function Field({ label, value, onChange, status, type = "text", disabled = false }) {
  const border = status === 'valid' ? 'border-green-300' : status === 'warn' ? 'border-yellow-300' : status === 'error' ? 'border-red-300' : 'border-gray-300';
  const dot = status === 'valid' ? 'bg-green-500' : status === 'warn' ? 'bg-yellow-500' : status === 'error' ? 'bg-red-500' : 'bg-gray-300';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm text-gray-700">{label}</div>
        <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
      </div>
      <input 
        type={type}
        className={`w-full px-2 py-1 rounded border ${border} text-sm ${disabled ? 'bg-gray-50' : ''}`} 
        value={value ?? ''} 
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  )
}

const validity = {
  text: (v) => (!v ? 'warn' : 'valid'),
  vendor: (v) => (!v ? 'warn' : 'valid'),
  date: (v) => (!v ? 'warn' : /^\d{4}-\d{2}-\d{2}/.test(String(v)) ? 'valid' : 'error'),
  number: (v) => (v === null || v === undefined || v === '' ? 'warn' : isNaN(Number(v)) ? 'error' : 'valid'),
  gstin: (v) => (!v ? 'warn' : /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(String(v)) ? 'valid' : 'error'),
  optional: () => 'valid',
};

function flattenForCsv(obj) {
  const flat = {
    bill_id: obj.bill_id || '',
    bill_type: obj.bill_type || '',
    invoice_number: obj.invoice_number || '',
    order_id: obj.order_id || '',
    order_date: obj.order_date || '',
    invoice_date: obj.invoice_date || '',
    due_date: obj.due_date || '',
    payment_status: obj.payment_status || '',
    customer_name: obj.customer?.name || '',
    customer_address: obj.customer?.address || '',
    seller_name: obj.seller?.name || '',
    seller_gstin: obj.seller?.gstin || '',
    seller_address: obj.seller?.address || '',
  };

  // Add summary fields
  if (obj.summary) {
    flat.subtotal = obj.summary.subtotal || '';
    flat.cgst_total = obj.summary.cgst_total || '';
    flat.sgst_total = obj.summary.sgst_total || '';
    flat.igst_total = obj.summary.igst_total || '';
    flat.total_tax = obj.summary.total_tax || '';
    flat.shipping_charges = obj.summary.shipping_charges || '';
    flat.grand_total = obj.summary.grand_total || '';
  }

  // Add items
  if (Array.isArray(obj.items)) {
    obj.items.forEach((item, idx) => {
      flat[`item_${idx + 1}_name`] = item?.item_name || '';
      flat[`item_${idx + 1}_hsn_sac`] = item?.hsn_sac || '';
      flat[`item_${idx + 1}_quantity`] = item?.quantity || '';
      flat[`item_${idx + 1}_gross_amount`] = item?.gross_amount || '';
      flat[`item_${idx + 1}_discount`] = item?.discount || '';
      flat[`item_${idx + 1}_taxable_value`] = item?.taxable_value || '';
      flat[`item_${idx + 1}_cgst`] = item?.cgst || '';
      flat[`item_${idx + 1}_sgst`] = item?.sgst || '';
      flat[`item_${idx + 1}_igst`] = item?.igst || '';
      flat[`item_${idx + 1}_total_amount`] = item?.total_amount || '';
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
  const [editMode, setEditMode] = useState(false);
  const [modifiedData, setModifiedData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Helper to read current value, merging modified data with original data for nested objects
  const getFieldValue = (field, parentField = null) => {
    if (parentField) {
      // For nested objects (customer, seller, summary), merge original with modifications
      const originalData = data?.[parentField] || {};
      const modifiedDataForParent = modifiedData[parentField] || {};
      const mergedData = { ...originalData, ...modifiedDataForParent };
      return mergedData[field];
    }
    // For top-level fields
    if (modifiedData[field] !== undefined) return modifiedData[field];
    return data?.[field];
  };

  const getLineItemValue = (idx, field) => {
    if (modifiedData.items && modifiedData.items[idx] && modifiedData.items[idx][field] !== undefined) {
      return modifiedData.items[idx][field];
    }
    return data?.items?.[idx]?.[field];
  };

  const handleFieldChange = (field, value, parentField = null) => {
    const newModifiedData = { ...modifiedData };
    if (parentField) {
      // For nested objects, merge with original data to preserve unedited fields
      const originalData = data?.[parentField] || {};
      newModifiedData[parentField] = {
        ...originalData,
        ...(newModifiedData[parentField] || {}),
        [field]: value
      };
    } else {
      newModifiedData[field] = value;
    }
    setModifiedData(newModifiedData);
    onFieldChange(field, value, parentField);
  };

  const handleLineItemChange = (idx, field, value) => {
    const newModifiedData = { ...modifiedData };
    if (!newModifiedData.items) {
      newModifiedData.items = [...(data.items || [])];
    }
    if (!newModifiedData.items[idx]) {
      newModifiedData.items[idx] = {};
    }
    newModifiedData.items[idx][field] = value;
    setModifiedData(newModifiedData);
    onLineItemChange(idx, field, value);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updatedData = await updateExtractedDocumentApi(id, modifiedData);
      // Clear local edit state
      setEditMode(false);
      setModifiedData({});
      
      // Force parent to refetch latest data
      if (onFieldChange) {
        onFieldChange('_forceRefetch', Date.now());
      }
      
      toast.success('Changes saved');
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error(error?.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const requestSave = () => {
    const toastId = `confirm-save-${id}`;

    const handleConfirm = async () => {
      toast.dismiss(toastId);
      await handleSave();
    };

    const handleCancel = () => {
      toast.dismiss(toastId);
    };

    const ConfirmContent = (
      <div className="flex flex-col gap-3">
        <div className="text-sm">Save changes to this document?</div>
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 text-sm bg-gray-200 rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    );

    toast.info(ConfirmContent, { toastId, containerId: 'center', autoClose: false, closeOnClick: false, closeButton: false });
  };

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

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Basic Bill Information */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">Basic Information</div>
          <Field label="Bill ID" value={getFieldValue('bill_id')} onChange={(v) => handleFieldChange('bill_id', v)} status={validity.text(getFieldValue('bill_id'))} disabled={!editMode} />
          <Field label="Bill Type" value={getFieldValue('bill_type')} onChange={(v) => handleFieldChange('bill_type', v)} status={validity.text(getFieldValue('bill_type'))} disabled={!editMode} />
          <Field label="Invoice Number" value={getFieldValue('invoice_number')} onChange={(v) => handleFieldChange('invoice_number', v)} status={validity.text(getFieldValue('invoice_number'))} disabled={!editMode} />
          <Field label="Order ID" value={getFieldValue('order_id')} onChange={(v) => handleFieldChange('order_id', v)} status={validity.text(getFieldValue('order_id'))} disabled={!editMode} />
        </div>

        {/* Dates */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">Dates</div>
          <Field label="Order Date" value={getFieldValue('order_date')} onChange={(v) => handleFieldChange('order_date', v)} status={validity.date(getFieldValue('order_date'))} type="date" disabled={!editMode} />
          <Field label="Invoice Date" value={getFieldValue('invoice_date')} onChange={(v) => handleFieldChange('invoice_date', v)} status={validity.date(getFieldValue('invoice_date'))} type="date" disabled={!editMode} />
          <Field label="Due Date" value={getFieldValue('due_date')} onChange={(v) => handleFieldChange('due_date', v)} status={validity.date(getFieldValue('due_date'))} type="date" disabled={!editMode} />
        </div>

        {/* Customer Details */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">Customer Details</div>
          <Field 
            label="Customer Name" 
            value={getFieldValue('name', 'customer')} 
            onChange={(v) => handleFieldChange('name', v, 'customer')} 
            status={validity.text(getFieldValue('name', 'customer'))}
            disabled={!editMode}
          />
          <Field 
            label="Customer Address" 
            value={getFieldValue('address', 'customer')} 
            onChange={(v) => handleFieldChange('address', v, 'customer')} 
            status={validity.text(getFieldValue('address', 'customer'))}
            disabled={!editMode}
          />
        </div>

        {/* Seller Details */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">Seller Details</div>
          <Field 
            label="Seller Name" 
            value={getFieldValue('name', 'seller')} 
            onChange={(v) => handleFieldChange('name', v, 'seller')} 
            status={validity.text(getFieldValue('name', 'seller'))}
            disabled={!editMode}
          />
          <Field 
            label="GSTIN" 
            value={getFieldValue('gstin', 'seller')} 
            onChange={(v) => handleFieldChange('gstin', v, 'seller')} 
            status={validity.gstin(getFieldValue('gstin', 'seller'))}
            disabled={!editMode}
          />
          <Field 
            label="Seller Address" 
            value={getFieldValue('address', 'seller')} 
            onChange={(v) => handleFieldChange('address', v, 'seller')} 
            status={validity.text(getFieldValue('address', 'seller'))}
            disabled={!editMode}
          />
        </div>

        {/* Items */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">Items</div>
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
            <div className="col-span-6">Name</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-2">Discount</div>
            <div className="col-span-2">Amount</div>
          </div>
          <div className="max-h-64 overflow-auto pr-1 space-y-2">
            {Array.isArray(data.items) && data.items.length > 0 ? (
              data.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    className="col-span-6 border rounded px-2 py-1 text-sm"
                    value={getLineItemValue(idx, 'item_name') || ''}
                    onChange={(e) => handleLineItemChange(idx, 'item_name', e.target.value)}
                    disabled={!editMode}
                    placeholder="Item Name"
                  />
                  <input
                    type="number"
                    className="col-span-2 border rounded px-2 py-1 text-sm"
                    value={getLineItemValue(idx, 'quantity') || ''}
                    onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                    disabled={!editMode}
                    placeholder="Qty"
                  />
                  <input
                    type="number"
                    className="col-span-2 border rounded px-2 py-1 text-sm"
                    value={getLineItemValue(idx, 'discount') || ''}
                    onChange={(e) => handleLineItemChange(idx, 'discount', e.target.value)}
                    disabled={!editMode}
                    placeholder="Discount"
                  />
                  <input
                    type="number"
                    className="col-span-2 border rounded px-2 py-1 text-sm"
                    value={getLineItemValue(idx, 'gross_amount') || ''}
                    onChange={(e) => handleLineItemChange(idx, 'gross_amount', e.target.value)}
                    disabled={!editMode}
                    placeholder="Amount"
                  />
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500 px-1">No items</div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">Summary</div>
          <Field 
            label="Subtotal" 
            value={getFieldValue('subtotal', 'summary')} 
            onChange={(v) => handleFieldChange('subtotal', v, 'summary')} 
            status={validity.number(getFieldValue('subtotal', 'summary'))}
            type="number"
            disabled={!editMode}
          />
          <Field 
            label="CGST Total" 
            value={getFieldValue('cgst_total', 'summary')} 
            onChange={(v) => handleFieldChange('cgst_total', v, 'summary')} 
            status={validity.number(getFieldValue('cgst_total', 'summary'))}
            type="number"
            disabled={!editMode}
          />
          <Field 
            label="SGST Total" 
            value={getFieldValue('sgst_total', 'summary')} 
            onChange={(v) => handleFieldChange('sgst_total', v, 'summary')} 
            status={validity.number(getFieldValue('sgst_total', 'summary'))}
            type="number"
            disabled={!editMode}
          />
          <Field 
            label="IGST Total" 
            value={getFieldValue('igst_total', 'summary')} 
            onChange={(v) => handleFieldChange('igst_total', v, 'summary')} 
            status={validity.number(getFieldValue('igst_total', 'summary'))}
            type="number"
            disabled={!editMode}
          />
          <Field 
            label="Total Tax" 
            value={getFieldValue('total_tax', 'summary')} 
            onChange={(v) => handleFieldChange('total_tax', v, 'summary')} 
            status={validity.number(getFieldValue('total_tax', 'summary'))}
            type="number"
            disabled={!editMode}
          />
          <Field 
            label="Shipping Charges" 
            value={getFieldValue('shipping_charges', 'summary')} 
            onChange={(v) => handleFieldChange('shipping_charges', v, 'summary')} 
            status={validity.number(getFieldValue('shipping_charges', 'summary'))}
            type="number"
            disabled={!editMode}
          />
          <Field 
            label="Grand Total" 
            value={getFieldValue('grand_total', 'summary')} 
            onChange={(v) => handleFieldChange('grand_total', v, 'summary')} 
            status={validity.number(getFieldValue('grand_total', 'summary'))}
            type="number"
            disabled={!editMode}
          />
        </div>

        {/* Payment Status */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">Payment Status</div>
          <Field 
            label="Status" 
            value={data.payment_status} 
            onChange={(v) => handleFieldChange('payment_status', v)} 
            status={validity.text(data.payment_status)}
            disabled={!editMode}
          />
        </div>
      </div>

      <div className="sticky bottom-0 z-10 bg-white p-3 border-t">
        <button 
          type="button" 
          className={`w-full py-2 ${editMode ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded text-sm`}
          onClick={editMode ? requestSave : () => setEditMode(true)}
          disabled={editMode && isSaving}
        >
          {editMode ? (isSaving ? 'Saving...' : 'Save Changes') : 'Edit'}
        </button>
      </div>
    </div>
  )
}


