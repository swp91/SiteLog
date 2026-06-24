const DB_NAME = 'sitelog-idb'
const STORE_NAME = 'keyval'

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function idbGet(key: string): Promise<any> {
  if (typeof window === 'undefined') return null
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(key)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function idbSet(key: string, value: any): Promise<void> {
  if (typeof window === 'undefined') return
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(value, key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function idbDel(key: string): Promise<void> {
  if (typeof window === 'undefined') return
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function idbKeys(): Promise<string[]> {
  if (typeof window === 'undefined') return []
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAllKeys()
    request.onsuccess = () => resolve(request.result as string[])
    request.onerror = () => reject(request.error)
  })
}

export async function idbEntries(): Promise<[string, any][]> {
  if (typeof window === 'undefined') return []
  const keys = await idbKeys()
  const entries: [string, any][] = []
  for (const key of keys) {
    const val = await idbGet(key)
    entries.push([key, val])
  }
  return entries
}

// ── Offline Image Helpers & Cache ───────────────────────────────────────────

export const localUrlCache = new Map<string, string>()

/**
 * HTML 본문 속의 local-pending://{id} 주소를 메모리 캐시의 blob URL로 치환합니다. (동기식)
 */
export function restorePendingImagesSync(html: string): string {
  if (!html) return ''
  let result = html
  localUrlCache.forEach((localUrl, id) => {
    result = result.replaceAll(`local-pending://${id}`, localUrl)
  })
  return result
}

/**
 * HTML 본문 속의 blob URL들을 local-pending://{id} 주소로 치환하여 저장용으로 바꿉니다.
 */
export function convertToPendingPlaceholders(html: string): string {
  if (!html) return ''
  let result = html
  localUrlCache.forEach((localUrl, id) => {
    result = result.replaceAll(localUrl, `local-pending://${id}`)
  })
  return result
}

/**
 * HTML 내에 포함된 local-pending 식별자들을 IndexedDB에서 비동기로 가져와
 * 메모리 캐시에 복원한 뒤, 복원이 완료된 최종 HTML을 반환합니다. (비동기식)
 */
export async function restorePendingImagesAsync(html: string): Promise<string> {
  if (!html) return ''
  const regex = /local-pending:\/\/([a-zA-Z0-9_-]+)/g
  const matches = [...html.matchAll(regex)]
  
  if (matches.length === 0) return html

  let updatedHtml = html
  for (const match of matches) {
    const id = match[1]
    if (!localUrlCache.has(id)) {
      const pendingData = await idbGet(`pending-image-${id}`)
      if (pendingData && pendingData.blob) {
        try {
          const localUrl = URL.createObjectURL(pendingData.blob)
          localUrlCache.set(id, localUrl)
        } catch (e) {
          console.error('Failed to create object URL for restored image:', e)
        }
      }
    }

    const localUrl = localUrlCache.get(id)
    if (localUrl) {
      updatedHtml = updatedHtml.replaceAll(`local-pending://${id}`, localUrl)
    }
  }

  return updatedHtml
}

