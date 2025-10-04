export interface Location {
  id: string
  name: string
  type: 'constituency' | 'ward' | 'village'
  parentId?: string
  children?: Location[]
}

export const kiambuLocations: Location[] = [
  {
    id: 'kiambu-constituency',
    name: 'Kiambu Constituency',
    type: 'constituency',
    children: [
      {
        id: 'kiambu-ward-1',
        name: 'Kiambu Ward',
        type: 'ward',
        parentId: 'kiambu-constituency',
        children: [
          { id: 'kiambu-village-1', name: 'Kiambu Town', type: 'village', parentId: 'kiambu-ward-1' },
          { id: 'kiambu-village-2', name: 'Kiambu Market', type: 'village', parentId: 'kiambu-ward-1' },
          { id: 'kiambu-village-3', name: 'Kiambu Estate', type: 'village', parentId: 'kiambu-ward-1' }
        ]
      },
      {
        id: 'kiambu-ward-2',
        name: 'Ndumberi Ward',
        type: 'ward',
        parentId: 'kiambu-constituency',
        children: [
          { id: 'ndumberi-village-1', name: 'Ndumberi', type: 'village', parentId: 'kiambu-ward-2' },
          { id: 'ndumberi-village-2', name: 'Riabai', type: 'village', parentId: 'kiambu-ward-2' },
          { id: 'ndumberi-village-3', name: 'Githunguri', type: 'village', parentId: 'kiambu-ward-2' }
        ]
      }
    ]
  },
  {
    id: 'githunguri-constituency',
    name: 'Githunguri Constituency',
    type: 'constituency',
    children: [
      {
        id: 'githunguri-ward-1',
        name: 'Githunguri Ward',
        type: 'ward',
        parentId: 'githunguri-constituency',
        children: [
          { id: 'githunguri-village-1', name: 'Githunguri Town', type: 'village', parentId: 'githunguri-ward-1' },
          { id: 'githunguri-village-2', name: 'Githunguri Market', type: 'village', parentId: 'githunguri-ward-1' },
          { id: 'githunguri-village-3', name: 'Githunguri Estate', type: 'village', parentId: 'githunguri-ward-1' }
        ]
      },
      {
        id: 'githunguri-ward-2',
        name: 'Ikinu Ward',
        type: 'ward',
        parentId: 'githunguri-constituency',
        children: [
          { id: 'ikinu-village-1', name: 'Ikinu', type: 'village', parentId: 'githunguri-ward-2' },
          { id: 'ikinu-village-2', name: 'Kiamwangi', type: 'village', parentId: 'githunguri-ward-2' },
          { id: 'ikinu-village-3', name: 'Githiga', type: 'village', parentId: 'githunguri-ward-2' }
        ]
      }
    ]
  },
  {
    id: 'juja-constituency',
    name: 'Juja Constituency',
    type: 'constituency',
    children: [
      {
        id: 'juja-ward-1',
        name: 'Juja Ward',
        type: 'ward',
        parentId: 'juja-constituency',
        children: [
          { id: 'juja-village-1', name: 'Juja Town', type: 'village', parentId: 'juja-ward-1' },
          { id: 'juja-village-2', name: 'Juja Market', type: 'village', parentId: 'juja-ward-1' },
          { id: 'juja-village-3', name: 'Juja Estate', type: 'village', parentId: 'juja-ward-1' }
        ]
      },
      {
        id: 'juja-ward-2',
        name: 'Theta Ward',
        type: 'ward',
        parentId: 'juja-constituency',
        children: [
          { id: 'theta-village-1', name: 'Theta', type: 'village', parentId: 'juja-ward-2' },
          { id: 'theta-village-2', name: 'Kalimoni', type: 'village', parentId: 'juja-ward-2' },
          { id: 'theta-village-3', name: 'Witeithie', type: 'village', parentId: 'juja-ward-2' }
        ]
      }
    ]
  },
  {
    id: 'thika-town-constituency',
    name: 'Thika Town Constituency',
    type: 'constituency',
    children: [
      {
        id: 'thika-ward-1',
        name: 'Thika Ward',
        type: 'ward',
        parentId: 'thika-town-constituency',
        children: [
          { id: 'thika-village-1', name: 'Thika Town', type: 'village', parentId: 'thika-ward-1' },
          { id: 'thika-village-2', name: 'Thika Market', type: 'village', parentId: 'thika-ward-1' },
          { id: 'thika-village-3', name: 'Thika Estate', type: 'village', parentId: 'thika-ward-1' }
        ]
      },
      {
        id: 'thika-ward-2',
        name: 'Township Ward',
        type: 'ward',
        parentId: 'thika-town-constituency',
        children: [
          { id: 'township-village-1', name: 'Township', type: 'village', parentId: 'thika-ward-2' },
          { id: 'township-village-2', name: 'Makongeni', type: 'village', parentId: 'thika-ward-2' },
          { id: 'township-village-3', name: 'Section 9', type: 'village', parentId: 'thika-ward-2' }
        ]
      }
    ]
  },
  {
    id: 'ruiru-constituency',
    name: 'Ruiru Constituency',
    type: 'constituency',
    children: [
      {
        id: 'ruiru-ward-1',
        name: 'Ruiru Ward',
        type: 'ward',
        parentId: 'ruiru-constituency',
        children: [
          { id: 'ruiru-village-1', name: 'Ruiru Town', type: 'village', parentId: 'ruiru-ward-1' },
          { id: 'ruiru-village-2', name: 'Ruiru Market', type: 'village', parentId: 'ruiru-ward-1' },
          { id: 'ruiru-village-3', name: 'Ruiru Estate', type: 'village', parentId: 'ruiru-ward-1' }
        ]
      },
      {
        id: 'ruiru-ward-2',
        name: 'Kahawa Sukari Ward',
        type: 'ward',
        parentId: 'ruiru-constituency',
        children: [
          { id: 'kahawa-village-1', name: 'Kahawa Sukari', type: 'village', parentId: 'ruiru-ward-2' },
          { id: 'kahawa-village-2', name: 'Kahawa Wendani', type: 'village', parentId: 'ruiru-ward-2' },
          { id: 'kahawa-village-3', name: 'Kahawa Barracks', type: 'village', parentId: 'ruiru-ward-2' }
        ]
      }
    ]
  },
  {
    id: 'gatundu-south-constituency',
    name: 'Gatundu South Constituency',
    type: 'constituency',
    children: [
      {
        id: 'gatundu-ward-1',
        name: 'Gatundu Ward',
        type: 'ward',
        parentId: 'gatundu-south-constituency',
        children: [
          { id: 'gatundu-village-1', name: 'Gatundu Town', type: 'village', parentId: 'gatundu-ward-1' },
          { id: 'gatundu-village-2', name: 'Gatundu Market', type: 'village', parentId: 'gatundu-ward-1' },
          { id: 'gatundu-village-3', name: 'Gatundu Estate', type: 'village', parentId: 'gatundu-ward-1' }
        ]
      },
      {
        id: 'gatundu-ward-2',
        name: 'Kiamwangi Ward',
        type: 'ward',
        parentId: 'gatundu-south-constituency',
        children: [
          { id: 'kiamwangi-village-1', name: 'Kiamwangi', type: 'village', parentId: 'gatundu-ward-2' },
          { id: 'kiamwangi-village-2', name: 'Kiganjo', type: 'village', parentId: 'gatundu-ward-2' },
          { id: 'kiamwangi-village-3', name: 'Ngewa', type: 'village', parentId: 'gatundu-ward-2' }
        ]
      }
    ]
  }
]

// Helper functions
export const getConstituencies = (): Location[] => {
  return kiambuLocations.filter(location => location.type === 'constituency')
}

export const getWardsByConstituency = (constituencyId: string): Location[] => {
  const constituency = kiambuLocations.find(loc => loc.id === constituencyId)
  return constituency?.children?.filter(child => child.type === 'ward') || []
}

export const getVillagesByWard = (wardId: string): Location[] => {
  for (const constituency of kiambuLocations) {
    const ward = constituency.children?.find(child => child.id === wardId)
    if (ward) {
      return ward.children?.filter(child => child.type === 'village') || []
    }
  }
  return []
}

export const getLocationPath = (locationId: string): string => {
  for (const constituency of kiambuLocations) {
    if (constituency.id === locationId) {
      return constituency.name
    }
    
    for (const ward of constituency.children || []) {
      if (ward.id === locationId) {
        return `${constituency.name} > ${ward.name}`
      }
      
      for (const village of ward.children || []) {
        if (village.id === locationId) {
          return `${constituency.name} > ${ward.name} > ${village.name}`
        }
      }
    }
  }
  return 'Unknown Location'
}

export const getAllLocations = (): Location[] => {
  const allLocations: Location[] = []
  
  for (const constituency of kiambuLocations) {
    allLocations.push(constituency)
    
    for (const ward of constituency.children || []) {
      allLocations.push(ward)
      
      for (const village of ward.children || []) {
        allLocations.push(village)
      }
    }
  }
  
  return allLocations
}