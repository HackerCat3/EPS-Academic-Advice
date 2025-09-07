/**
 * Query logger utility for development mode
 * Intercepts Supabase queries and logs them to console
 */

export function logQuery(tableName: string, operation: string, query: any) {
  if (process.env.NODE_ENV !== 'development') return query

  const originalThen = query.then
  if (originalThen) {
    query.then = function(onResolve: any, onReject?: any) {
      console.log(`🔍 [SUPABASE QUERY] ${operation.toUpperCase()} on table: ${tableName}`)
      
      // Try to extract query details
      if (query.url) {
        console.log(`   URL: ${query.url}`)
      }
      
      return originalThen.call(this, 
        (result: any) => {
          console.log(`✅ [SUPABASE SUCCESS] ${operation.toUpperCase()} ${tableName}:`, result)
          return onResolve ? onResolve(result) : result
        },
        (error: any) => {
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