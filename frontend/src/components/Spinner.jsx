import React from 'react'

export default function Spinner({ message = 'Processing…' }) {
	return (
		// Use a light translucent backdrop + blur so the dashboard remains visible
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />

			<div className="relative bg-white/90 dark:bg-white/90 rounded-xl shadow-md ring-1 ring-gray-100 max-w-md w-full mx-4 p-6 sm:p-8">
				<div className="flex flex-col items-center">
					{/* Compact spinner matching app accent */}
					<div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
					<div className="mt-4 text-center text-gray-800 text-sm">
						<div className="font-medium">{message}</div>
						<div className="text-xs text-gray-500 mt-1">This window will close when data extraction is finishes.</div>
					</div>
				</div>
			</div>
		</div>
	)
}
