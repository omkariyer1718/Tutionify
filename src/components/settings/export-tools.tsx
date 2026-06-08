'use client'

export function ExportTools() {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Export Data</h3>
      <p className="text-sm text-gray-500 mb-6">Download your data as CSV files for backup or analysis in Excel/Google Sheets.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-1">Students Database</h4>
          <p className="text-xs text-gray-500 mb-4">Export all active and alumni students with contact details.</p>
          <a href="/api/export/students" download className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900">
            Download CSV
          </a>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-1">Fee Records</h4>
          <p className="text-xs text-gray-500 mb-4">Export all fee records for the current academic year.</p>
          <a href="/api/export/fees" download className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900">
            Download CSV
          </a>
        </div>
      </div>
    </div>
  )
}
