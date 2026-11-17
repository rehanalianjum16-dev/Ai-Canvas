import React from 'react'

<a href=""></a>
function push() {
  if (typeof window !== 'undefined') {
    window.location.href = 'https://www.google.com'
    
  }
  alert('Redirecting to Google...');

  return <div className="rehan" />
}

export default push
