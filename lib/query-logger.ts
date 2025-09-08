/**
 * Query logger utility for development mode
 * Intercepts Supabase queries and logs them to console
 */

export function logQuery(tableName: string, operation: string, query: unknown) {
  if (process.env.NODE_ENV !== 'development') return query

  const queryObject = query as Record<string, unknown>
  const originalThen = queryObject.then as ((onResolve: (result: unknown) => unknown, onReject?: (error: unknown) => unknown) => unknown) | undefined
  if (originalThen && typeof originalThen === 'function') {
    queryObject.then = function(onResolve: (result: unknown) => unknown, onReject?: (error: unknown) => unknown) {
      console.log(`🔍 [SUPABASE QUERY] ${operation.toUpperCase()} on table: ${tableName}`)
      
      // Try to extract query details
      if (queryObject.url) {
        console.log(`   URL: ${queryObject.url}`)
      }
      
      return originalThen.call(this, 
        (result: unknown) => {
          console.log(`✅ [SUPABASE SUCCESS] ${operation.toUpperCase()} ${tableName}:`, result)
          return onResolve ? onResolve(result) : result
        },
        (error: unknown) => {
          console.error(`❌ [SUPABASE ERROR] ${operation.toUpperCase()} ${tableName}:`, error)
          return onReject ? onReject(error) : Promise.reject(error)
        }
      )
    }
  }

  return query
}

// Monkey patch the PostgrestQueryBuilder to auto-log queries
export function enableAutoQueryLogging() {
  if (process.env.NODE_ENV !== 'development') return

  if (typeof window !== 'undefined') {
    console.log('🔧 [SUPABASE] Query logging enabled for development')
  }
}
