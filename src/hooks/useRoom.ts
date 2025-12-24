import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase/client'
import { toast } from 'sonner'
import type { Player, Room } from '~/types/game'

interface CreateRoomRequest {
  name: string
}

interface CreateRoomResponse {
  data: Room[]
}

export const roomKeys = {
  all: ['rooms'] as const,
  details: () => [...roomKeys.all, 'detail'] as const,
  detail: (id: string) => [...roomKeys.details(), id] as const,
}

const createRoomFn = async (request: CreateRoomRequest): Promise<Room> => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('You must be logged in to create a room')
  }

  const { data, error } = await supabase.functions.invoke('create-room', {
    body: request,
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  })

  if (error) {
    throw new Error(error.message)
  }

  const room = data?.data?.[0]
  if (!room) {
    throw new Error('No room data returned')
  }

  return room
}

const getRoomByCodeFn = async (code: string): Promise<Room> => {
  const { data, error } = await supabase
    .from('room')
    .select('*')
    .eq('code', code)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export const useCreateRoom = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createRoomFn,
    onSuccess: (room) => {
      toast.success(`Sala "${room.name}" criada! Código: ${room.code}`)
      queryClient.invalidateQueries({ queryKey: roomKeys.all })
      queryClient.setQueryData(roomKeys.detail(room.code), room)
    },
    onError: (error: Error) => {
      toast.error(`Falha ao criar sala: ${error.message}`)
    },
  })
}

export const useJoinRoom = () => {
  return useMutation({
    mutationFn: async ({ roomCode, name }: { roomCode: string; name: string }): Promise<Player> => {
      const { data, error } = await supabase.functions.invoke('join-room', {
        body: { roomCode, name },
      })

      if (error) {
        throw new Error(error.message)
      }

      return data.player || data
    },
    onSuccess: (data) => {
      toast.success(`Bem-vindo à sala, ${data.name}!`)
    },
    onError: (error: Error) => {
      toast.error(`Falha ao entrar na sala: ${error.message}`)
    },
  })
}

export const useRoom = (code: string) => {
  return useQuery({
    queryKey: roomKeys.detail(code),
    queryFn: () => getRoomByCodeFn(code),
    enabled: !!code,
    retry: 1,
  })
}

export const useUpdateRoomStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ roomId, status, round }: { roomId: number; status: string; round?: number }) => {
      const updateData: any = { status }
      if (round !== undefined) {
        updateData.round = round
      }
      
      const { data, error } = await supabase
        .from('room')
        .update(updateData)
        .eq('id', roomId)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(roomKeys.detail(data.code), data)
      toast.success('Status da sala atualizado')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar sala: ${error.message}`)
    },
  })
}

export const useUpdatePlayerAvatar = () => {
  return useMutation({
    mutationFn: async ({ playerId, avatarConfig }: { playerId: number; avatarConfig: any }) => {
      const { data, error } = await supabase
        .from('player')
        .update({ avatar_config: avatarConfig })
        .eq('id', playerId)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar avatar: ${error.message}`)
    },
  })
} 