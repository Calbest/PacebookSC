export type Standard = { value: string; label: string }
export type Location = { value: string; label: string; logo: string; standards: Standard[] }

export const LOCATIONS: Location[] = [
  {
    value: 'southern-california',
    label: 'Southern California',
    logo: '/logos/scs.svg',
    standards: [
      { value: 'scs-b',          label: 'B Standard' },
      { value: 'scs-bb',         label: 'BB Standard' },
      { value: 'scs-a',          label: 'A Standard' },
      { value: 'scs-aa',         label: 'AA Standard' },
      { value: 'scs-aaa',        label: 'AAA Standard' },
      { value: 'scs-jo',         label: 'Junior Olympics (JO)' },
      { value: 'far-westerns',   label: 'Far Western Championships' },
      { value: 'scs-open',       label: 'Southern California Open' },
      { value: 'sectionals',     label: 'Speedo Western Sectionals' },
      { value: 'futures',        label: 'US Futures Championships' },
      { value: 'jr-nationals',   label: 'Speedo Junior Nationals' },
      { value: 'us-open',        label: 'US Open Championships' },
      { value: 'olympic-trials', label: 'US Olympic Trials' },
    ],
  },
  // More regions will be added here
]

export function getStandards(locationValue: string): Standard[] {
  return LOCATIONS.find(l => l.value === locationValue)?.standards ?? []
}
