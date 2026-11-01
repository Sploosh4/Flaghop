export function Icon({kind}: {kind: 'home' | 'computer' | 'gear' | 'file' | 'search' | 'left' | 'right'}) {
  const paths = {home: 'm3 10 9-7 9 7v11h-7v-7h-4v7H3Z', computer: 'M3 3h18v13H3ZM8 21h8M12 16v5',
    gear: 'm9 3-1 3-3 1-2 3 2 2-1 3 3 2 1 3h4l1-3 3-1 2-3-2-2 1-3-3-2-1-3ZM9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
    file: 'M5 3h9l5 5v13H5ZM14 3v6h5', search: 'M10 3a7 7 0 1 0 0 14 7 7 0 1 0 0-14Zm5 12 6 6',
    left: 'M3 3h18v18H3ZM8 3v18m8-11-4 4 4 4', right: 'M3 3h18v18H3ZM8 3v18m4-11 4 4-4 4'};
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]}/></svg>;
}
