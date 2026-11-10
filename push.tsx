import React from 'react'

function push() {
  if (typeof window !== 'undefined') {
    window.location.href = 'https://www.google.com'
  }

  return <div className="rehan" />
}

export default push
