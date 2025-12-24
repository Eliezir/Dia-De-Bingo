const AUDIO_USED_KEY = 'bingo-audio-used'
const PHRASE_USED_KEY = 'bingo-phrase-used'

const WIN_AUDIOS = [
  '/audios/bingo/aplausos.mp3',
  '/audios/bingo/ayrton-senna-tema-da-vitoria.mp3',
  '/audios/bingo/receba-os-aplausos-do-torcedor-rival.mp3',
  '/audios/bingo/vinheta-galvao-do-tetra.mp3'
]

const LOSE_AUDIOS = [
  '/audios/error/ai_que_burro.mp3',
  '/audios/error/audio_5.mp3',
  '/audios/error/errou.mp3',
  '/audios/error/ihaaaa.mp3',
  '/audios/error/naruto-sad.mp3',
  '/audios/error/risada_quico.mp3',
  '/audios/error/sad.mp3'
]

const WIN_PHRASES = [
  '🎉 BINGO! Temos um vencedor(a)!',
  '🔥 EXPLODIU! Bingo confirmado!',
  '🏆 Parabéns! Você completou a cartela!',
  '💰 Alguém está com sorte hoje! BINGO!',
  '🎊 Uhuuu! A sorte sorriu para você!',
  '🚀 Direto para o pódio! BINGO!',
  '✨ Cartela cheia, coração feliz!',
  '🌟 Temos um mestre do Bingo entre nós!',
  '✅ Conferido e aprovado! É BINGO!',
  '🎈 A vitória chegou! Parabéns pelo Bingo!'
]

const LOSE_PHRASES = [
  '🤡 Alô, é do circo? Temos um palhaço gritando bingo errado!',
  '🛑 O VAR analisou e detectou: 100% de audácia e 0% de bingo.',
  '🤔 Marcou o número da Mega Sena na cartela errada, foi?',
  '🙈 Alguém traz um óculos para esse ser humano, por favor!',
  '🤏 Faltou isso aqui pra ser verdade... Mentira, faltou muito!',
  '🤣 O inimigo da vitória ataca novamente!',
  '🚩 Alarme falso! Voltem para seus lugares, nada para ver aqui.',
  '🕯️ O desespero é tanto que começou a inventar número!',
  '🤪 Tá ouvindo vozes ou só queria chamar atenção mesmo?'
]

function getUsedAudios(roomCode: string, type: 'win' | 'lose'): string[] {
  try {
    const key = `${AUDIO_USED_KEY}-${roomCode}-${type}`
    const raw = localStorage.getItem(key)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveUsedAudios(roomCode: string, type: 'win' | 'lose', used: string[]): void {
  const key = `${AUDIO_USED_KEY}-${roomCode}-${type}`
  localStorage.setItem(key, JSON.stringify(used))
}

function getUsedPhrases(roomCode: string, type: 'win' | 'lose'): string[] {
  try {
    const key = `${PHRASE_USED_KEY}-${roomCode}-${type}`
    const raw = localStorage.getItem(key)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveUsedPhrases(roomCode: string, type: 'win' | 'lose', used: string[]): void {
  const key = `${PHRASE_USED_KEY}-${roomCode}-${type}`
  localStorage.setItem(key, JSON.stringify(used))
}

export function getAvailableAudios(roomCode: string, type: 'win' | 'lose'): string[] {
  const allAudios = type === 'win' ? WIN_AUDIOS : LOSE_AUDIOS
  const used = getUsedAudios(roomCode, type)
  return allAudios.filter(audio => !used.includes(audio))
}

export function getRandomAudio(roomCode: string, type: 'win' | 'lose'): string {
  const available = getAvailableAudios(roomCode, type)
  
  if (available.length === 0) {
    const allAudios = type === 'win' ? WIN_AUDIOS : LOSE_AUDIOS
    saveUsedAudios(roomCode, type, [])
    return allAudios[Math.floor(Math.random() * allAudios.length)]
  }
  
  const selected = available[Math.floor(Math.random() * available.length)]
  return selected
}

export function markAudioAsUsed(roomCode: string, type: 'win' | 'lose', audioPath: string): void {
  const used = getUsedAudios(roomCode, type)
  if (!used.includes(audioPath)) {
    used.push(audioPath)
    saveUsedAudios(roomCode, type, used)
  }
}

export function getAvailablePhrases(type: 'win' | 'lose'): string[] {
  return type === 'win' ? WIN_PHRASES : LOSE_PHRASES
}

export function getRandomPhrase(type: 'win' | 'lose', roomCode: string): string {
  const allPhrases = type === 'win' ? WIN_PHRASES : LOSE_PHRASES
  const used = getUsedPhrases(roomCode, type)
  const available = allPhrases.filter(phrase => !used.includes(phrase))
  
  if (available.length === 0) {
    saveUsedPhrases(roomCode, type, [])
    return allPhrases[Math.floor(Math.random() * allPhrases.length)]
  }
  
  const selected = available[Math.floor(Math.random() * available.length)]
  return selected
}

export function markPhraseAsUsed(roomCode: string, type: 'win' | 'lose', phrase: string): void {
  const used = getUsedPhrases(roomCode, type)
  if (!used.includes(phrase)) {
    used.push(phrase)
    saveUsedPhrases(roomCode, type, used)
  }
}

export function resetAudioPool(roomCode: string): void {
  saveUsedAudios(roomCode, 'win', [])
  saveUsedAudios(roomCode, 'lose', [])
  saveUsedPhrases(roomCode, 'win', [])
  saveUsedPhrases(roomCode, 'lose', [])
}

