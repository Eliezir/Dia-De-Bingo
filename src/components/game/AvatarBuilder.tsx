import { useState } from 'react'
// @ts-ignore - CommonJS module export
import Avatar, { genConfig } from 'react-nice-avatar'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { Icon } from '@iconify/react'

type AvatarConfig = ReturnType<typeof genConfig>

interface AvatarBuilderProps {
  currentConfig?: AvatarConfig | null
  onSave: (config: AvatarConfig) => void
  playerName: string
}

const SEX_OPTIONS = ['man', 'woman'] as const
const HAIR_STYLE_OPTIONS = ['normal', 'thick', 'mohawk', 'womanLong', 'womanShort'] as const
const EYE_STYLE_OPTIONS = ['circle', 'oval', 'smile'] as const
const GLASSES_STYLE_OPTIONS = ['none', 'round', 'square'] as const
const NOSE_STYLE_OPTIONS = ['short', 'long', 'round'] as const
const MOUTH_STYLE_OPTIONS = ['laugh', 'smile', 'peace'] as const
const SHIRT_STYLE_OPTIONS = ['hoody', 'short', 'polo'] as const
const HAT_STYLE_OPTIONS = ['none', 'beanie', 'turban'] as const
const EAR_SIZE_OPTIONS = ['small', 'big'] as const

interface NumberSelectorProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

function NumberSelector({ label, value, min, max, onChange }: NumberSelectorProps) {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1)
    } else {
      onChange(max)
    }
  }

  const handleIncrease = () => {
    if (value < max) {
      onChange(value + 1)
    } else {
      onChange(min)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
      <Label className="text-white/90 text-sm md:text-base font-semibold whitespace-nowrap min-w-[80px]">{label}</Label>
      <div className="flex items-center gap-2 flex-1 justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={handleDecrease}
          className="border-white/30 text-white hover:bg-white/10 h-9 w-9 p-0"
        >
          <Icon icon="material-symbols:arrow-back" className="text-lg" />
        </Button>
        <div className="min-w-[50px] text-center">
          <span className="text-xl md:text-2xl font-bold text-white">{value}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleIncrease}
          className="border-white/30 text-white hover:bg-white/10 h-9 w-9 p-0"
        >
          <Icon icon="material-symbols:arrow-forward" className="text-lg" />
        </Button>
      </div>
    </div>
  )
}

export function AvatarBuilder({ currentConfig, onSave, playerName }: AvatarBuilderProps) {
  const [config, setConfig] = useState<AvatarConfig>(() => {
    if (currentConfig) {
      return currentConfig
    }
    return genConfig(playerName)
  })
  const [isOpen, setIsOpen] = useState(false)

  const handleRandomize = () => {
    setConfig(genConfig())
  }

  const handleSave = () => {
    onSave(config)
    setIsOpen(false)
  }

  const updateConfig = (key: keyof AvatarConfig, value: any) => {
    setConfig((prev: AvatarConfig) => ({ ...prev, [key]: value }))
  }

  // Helper functions to convert between index and value
  const getIndex = (array: readonly string[], value: string): number => {
    return array.indexOf(value as any)
  }

  const getValue = (array: readonly string[], index: number): string => {
    return array[index] || array[0]
  }

  const getHairStyleIndex = () => getIndex(HAIR_STYLE_OPTIONS, config.hairStyle || HAIR_STYLE_OPTIONS[0])
  const getEyeStyleIndex = () => getIndex(EYE_STYLE_OPTIONS, config.eyeStyle || EYE_STYLE_OPTIONS[0])
  const getGlassesStyleIndex = () => getIndex(GLASSES_STYLE_OPTIONS, config.glassesStyle || GLASSES_STYLE_OPTIONS[0])
  const getNoseStyleIndex = () => getIndex(NOSE_STYLE_OPTIONS, config.noseStyle || NOSE_STYLE_OPTIONS[0])
  const getMouthStyleIndex = () => getIndex(MOUTH_STYLE_OPTIONS, config.mouthStyle || MOUTH_STYLE_OPTIONS[0])
  const getShirtStyleIndex = () => getIndex(SHIRT_STYLE_OPTIONS, config.shirtStyle || SHIRT_STYLE_OPTIONS[0])
  const getHatStyleIndex = () => getIndex(HAT_STYLE_OPTIONS, config.hatStyle || HAT_STYLE_OPTIONS[0])
  const getEarSizeIndex = () => getIndex(EAR_SIZE_OPTIONS, config.earSize || EAR_SIZE_OPTIONS[0])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">
          <Icon icon="material-symbols:face" className="mr-2" />
          Personalizar Avatar
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[95vw] max-h-[95vh] overflow-y-auto bg-gradient-to-br from-[#3c95f1] to-[#c3def9] border-white/20 p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-white text-xl md:text-2xl font-bold">Personalizar Avatar</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 md:gap-6 mt-4">
          {/* Preview */}
          <div className="flex flex-col items-center justify-center p-4 md:p-6 bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white/20">
            <Avatar
              style={{ width: '150px', height: '150px' }}
              {...config}
            />
            <Button
              onClick={handleRandomize}
              variant="outline"
              className="mt-4 border-white/30 text-white hover:bg-white/10 w-full md:w-auto"
            >
              <Icon icon="material-symbols:shuffle" className="mr-2" />
              Aleatório
            </Button>
          </div>

          {/* Controls */}
          <div className="space-y-2 bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white/20 p-3 md:p-4">
            {/* Sex */}
            <div>
              <Label className="text-white/90 mb-2 block text-sm md:text-base font-semibold">Gênero</Label>
              <div className="flex gap-2">
                {SEX_OPTIONS.map((sex) => (
                  <Button
                    key={sex}
                    variant={config.sex === sex ? 'default' : 'outline'}
                    onClick={() => updateConfig('sex', sex)}
                    className={`flex-1 md:flex-none capitalize text-sm md:text-base ${
                      config.sex === sex 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                        : 'border-white/30 text-white hover:bg-white/10'
                    }`}
                  >
                    {sex === 'man' ? 'Masculino' : 'Feminino'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Hair Style */}
            <NumberSelector
              label="Cabelo"
              value={getHairStyleIndex() + 1}
              min={1}
              max={HAIR_STYLE_OPTIONS.length}
              onChange={(value) => updateConfig('hairStyle', getValue(HAIR_STYLE_OPTIONS, value - 1))}
            />

            {/* Eye Style */}
            <NumberSelector
              label="Olhos"
              value={getEyeStyleIndex() + 1}
              min={1}
              max={EYE_STYLE_OPTIONS.length}
              onChange={(value) => updateConfig('eyeStyle', getValue(EYE_STYLE_OPTIONS, value - 1))}
            />

            {/* Glasses */}
            <NumberSelector
              label="Óculos"
              value={getGlassesStyleIndex() + 1}
              min={1}
              max={GLASSES_STYLE_OPTIONS.length}
              onChange={(value) => updateConfig('glassesStyle', getValue(GLASSES_STYLE_OPTIONS, value - 1))}
            />

            {/* Nose Style */}
            <NumberSelector
              label="Nariz"
              value={getNoseStyleIndex() + 1}
              min={1}
              max={NOSE_STYLE_OPTIONS.length}
              onChange={(value) => updateConfig('noseStyle', getValue(NOSE_STYLE_OPTIONS, value - 1))}
            />

            {/* Mouth Style */}
            <NumberSelector
              label="Boca"
              value={getMouthStyleIndex() + 1}
              min={1}
              max={MOUTH_STYLE_OPTIONS.length}
              onChange={(value) => updateConfig('mouthStyle', getValue(MOUTH_STYLE_OPTIONS, value - 1))}
            />

            {/* Shirt Style */}
            <NumberSelector
              label="Roupa"
              value={getShirtStyleIndex() + 1}
              min={1}
              max={SHIRT_STYLE_OPTIONS.length}
              onChange={(value) => updateConfig('shirtStyle', getValue(SHIRT_STYLE_OPTIONS, value - 1))}
            />

            {/* Hat Style */}
            <NumberSelector
              label="Chapéu"
              value={getHatStyleIndex() + 1}
              min={1}
              max={HAT_STYLE_OPTIONS.length}
              onChange={(value) => updateConfig('hatStyle', getValue(HAT_STYLE_OPTIONS, value - 1))}
            />

            {/* Ear Size */}
            <NumberSelector
              label="Orelhas"
              value={getEarSizeIndex() + 1}
              min={1}
              max={EAR_SIZE_OPTIONS.length}
              onChange={(value) => updateConfig('earSize', getValue(EAR_SIZE_OPTIONS, value - 1))}
            />

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                <Label className="text-white/90 mb-2 block text-sm md:text-base font-semibold">Cor do Cabelo</Label>
                <input
                  type="color"
                  value={config.hairColor || '#000000'}
                  onChange={(e) => updateConfig('hairColor', e.target.value)}
                  className="w-full h-10 md:h-12 rounded-lg border-2 border-white/30 cursor-pointer bg-white/20"
                />
              </div>
              <div>
                <Label className="text-white/90 mb-2 block text-sm md:text-base font-semibold">Cor da Camisa</Label>
                <input
                  type="color"
                  value={config.shirtColor || '#000000'}
                  onChange={(e) => updateConfig('shirtColor', e.target.value)}
                  className="w-full h-10 md:h-12 rounded-lg border-2 border-white/30 cursor-pointer bg-white/20"
                />
              </div>
              <div>
                <Label className="text-white/90 mb-2 block text-sm md:text-base font-semibold">Cor da Pele</Label>
                <input
                  type="color"
                  value={config.faceColor || '#000000'}
                  onChange={(e) => updateConfig('faceColor', e.target.value)}
                  className="w-full h-10 md:h-12 rounded-lg border-2 border-white/30 cursor-pointer bg-white/20"
                />
              </div>
              <div>
                <Label className="text-white/90 mb-2 block text-sm md:text-base font-semibold">Cor de Fundo</Label>
                <input
                  type="color"
                  value={config.bgColor || '#000000'}
                  onChange={(e) => updateConfig('bgColor', e.target.value)}
                  className="w-full h-10 md:h-12 rounded-lg border-2 border-white/30 cursor-pointer bg-white/20"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4 md:mt-6">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
          >
            Salvar Avatar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

