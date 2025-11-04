import React from 'react'
import Navbar from './Navbar'
import Breadcrumbs from './Breadcrumbs'

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-50">
      <Navbar />
      {/* <Breadcrumbs /> */}
      <main className="pt-16 mx-auto px-4 pb-12">
        {children}
      </main>
    </div>
  )
}

export default Layout


