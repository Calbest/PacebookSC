import { supabase } from './supabase'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  gender: string | null
  club_team: string | null
  high_school: string | null
  times: Record<string, string>
  updated_at: string
}

export type FriendshipStatus = 'pending' | 'accepted'

export interface Friendship {
  id: number
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
}

export async function upsertProfile(profile: Omit<Profile, 'updated_at'>) {
  return supabase.from('profiles').upsert(
    { ...profile, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  )
}

export async function searchProfiles(query: string, excludeId: string) {
  return supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, club_team, gender')
    .ilike('username', `%${query}%`)
    .neq('id', excludeId)
    .limit(8)
}

export async function getProfile(userId: string) {
  return supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<Profile>()
}

export async function getMyFriendships() {
  return supabase
    .from('friendships')
    .select('*')
    .returns<Friendship[]>()
}

export async function getFriendProfiles(friendIds: string[]) {
  if (!friendIds.length) return { data: [] as Profile[], error: null }
  return supabase
    .from('profiles')
    .select('*')
    .in('id', friendIds)
    .returns<Profile[]>()
}

export async function sendFriendRequest(addresseeId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error('Not signed in') }
  return supabase.from('friendships').insert({
    requester_id: user.id,
    addressee_id: addresseeId,
  })
}

export async function acceptFriendRequest(friendshipId: number) {
  return supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
}

export async function declineFriendRequest(friendshipId: number) {
  return supabase.from('friendships').delete().eq('id', friendshipId)
}

export async function removeFriend(friendshipId: number) {
  return supabase.from('friendships').delete().eq('id', friendshipId)
}
