"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { 
  kiambuLocations, 
  getConstituencies, 
  getWardsByConstituency, 
  getVillagesByWard,
  getLocationPath,
  Location 
} from "@/lib/kiambu-locations"

interface LocationSelectorProps {
  selectedLocations: string[]
  onLocationsChange: (locations: string[]) => void
  label?: string
  placeholder?: string
}

export function LocationSelector({ 
  selectedLocations, 
  onLocationsChange, 
  label = "Target Locations",
  placeholder = "Select locations..."
}: LocationSelectorProps) {
  const [selectedConstituency, setSelectedConstituency] = useState<string>("")
  const [selectedWard, setSelectedWard] = useState<string>("")
  const [selectedVillage, setSelectedVillage] = useState<string>("")
  const [availableWards, setAvailableWards] = useState<Location[]>([])
  const [availableVillages, setAvailableVillages] = useState<Location[]>([])

  const constituencies = getConstituencies()

  useEffect(() => {
    if (selectedConstituency) {
      const wards = getWardsByConstituency(selectedConstituency)
      setAvailableWards(wards)
      setSelectedWard("")
      setSelectedVillage("")
      setAvailableVillages([])
    } else {
      setAvailableWards([])
      setSelectedWard("")
      setSelectedVillage("")
      setAvailableVillages([])
    }
  }, [selectedConstituency])

  useEffect(() => {
    if (selectedWard) {
      const villages = getVillagesByWard(selectedWard)
      setAvailableVillages(villages)
      setSelectedVillage("")
    } else {
      setAvailableVillages([])
      setSelectedVillage("")
    }
  }, [selectedWard])

  const handleAddLocation = () => {
    let locationToAdd = ""
    
    if (selectedVillage) {
      locationToAdd = selectedVillage
    } else if (selectedWard) {
      locationToAdd = selectedWard
    } else if (selectedConstituency) {
      locationToAdd = selectedConstituency
    }

    if (locationToAdd && !selectedLocations.includes(locationToAdd)) {
      onLocationsChange([...selectedLocations, locationToAdd])
      // Reset selections
      setSelectedConstituency("")
      setSelectedWard("")
      setSelectedVillage("")
    }
  }

  const handleRemoveLocation = (locationId: string) => {
    onLocationsChange(selectedLocations.filter(id => id !== locationId))
  }

  const canAddLocation = selectedConstituency && !selectedLocations.includes(
    selectedVillage || selectedWard || selectedConstituency
  )

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      
      {/* Location Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="constituency">Constituency</Label>
          <Select value={selectedConstituency} onValueChange={setSelectedConstituency}>
            <SelectTrigger>
              <SelectValue placeholder="Select constituency" />
            </SelectTrigger>
            <SelectContent>
              {constituencies.map((constituency) => (
                <SelectItem key={constituency.id} value={constituency.id}>
                  {constituency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ward">Ward</Label>
          <Select 
            value={selectedWard} 
            onValueChange={setSelectedWard}
            disabled={!selectedConstituency}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select ward" />
            </SelectTrigger>
            <SelectContent>
              {availableWards.map((ward) => (
                <SelectItem key={ward.id} value={ward.id}>
                  {ward.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="village">Village</Label>
          <Select 
            value={selectedVillage} 
            onValueChange={setSelectedVillage}
            disabled={!selectedWard}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select village" />
            </SelectTrigger>
            <SelectContent>
              {availableVillages.map((village) => (
                <SelectItem key={village.id} value={village.id}>
                  {village.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Add Location Button */}
      <Button 
        onClick={handleAddLocation}
        disabled={!canAddLocation}
        size="sm"
        className="w-full md:w-auto"
      >
        Add Location
      </Button>

      {/* Selected Locations */}
      {selectedLocations.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Locations ({selectedLocations.length})</Label>
          <div className="flex flex-wrap gap-2">
            {selectedLocations.map((locationId) => (
              <Badge 
                key={locationId} 
                variant="secondary" 
                className="flex items-center gap-1 pr-1"
              >
                <span className="text-xs">
                  {getLocationPath(locationId)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemoveLocation(locationId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add Options */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Quick Add</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allConstituencies = constituencies.map(c => c.id)
              const newLocations = [...new Set([...selectedLocations, ...allConstituencies])]
              onLocationsChange(newLocations)
            }}
          >
            All Constituencies
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allWards = constituencies.flatMap(c => c.children || [])
              const wardIds = allWards.map(w => w.id)
              const newLocations = [...new Set([...selectedLocations, ...wardIds])]
              onLocationsChange(newLocations)
            }}
          >
            All Wards
          </Button>
        </div>
      </div>
    </div>
  )
}