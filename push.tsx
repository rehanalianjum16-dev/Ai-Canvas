import React from 'react'
function push() {
  if (typeof window !== 'undefined') {
    window.location.href = 'https://www.google.com'
    
  }
  alert('Redirecting to Google...');

  return
}

export default push
