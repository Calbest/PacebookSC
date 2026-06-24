import { useState } from 'react'
import type { Location } from '../lib/standards'

interface Props {
  location: Location
}

export default function LocationLogo({ location }: Props) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="location-logo-fallback">
        {location.label}
      </div>
    )
  }

  return (
    <img
      src={location.logo}
      alt={`${location.label} logo`}
      className="location-logo-img"
      onError={() => setFailed(true)}
    />
  )
}
