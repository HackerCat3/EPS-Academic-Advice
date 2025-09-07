/**
 * Simple logging helper for Supabase queries in development
 */

export function logQuery(operation: string, tableName: string, data?: any) {
  if (process.env.NODE_ENV !== 'development') return

  console.log(`🔍 [SUPABASE] ${operation.toUpperCase()} on table: ${tableName}`)
  if (data) {
    console.log('   📝 Data:', JSON.stringify(data, null, 2))
  }
}

export function logQueryResult(operation: string, tableName: string, result: any) {
  if (process.env.NODE_ENV !== 'development') return

  if (result?.error) {
    console.error(`❌ [SUPABASE ERROR] ${operation.toUpperCase()} ${tableName}:`, result.error)
  } else {
    console.log(`✅ [SUPABASE SUCCESS] ${operation.toUpperCase()} ${tableName}:`, result)
  }
}

// Simple passthrough - no complex proxying
export function wrapSupabaseWithLogging(supabase: any) {
  return supabase
}