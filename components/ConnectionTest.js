import React, { useState, useEffect } from 'react'
import { supabase, testConnection, getTables, getTableStructure, getTableData } from '../lib/supabase'

export default function ConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState('testing')
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [tableStructure, setTableStructure] = useState(null)
  const [tableData, setTableData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    initializeConnection()
  }, [])

  const initializeConnection = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Test basic connection
      const connectionResult = await testConnection()
      
      if (connectionResult.success) {
        setConnectionStatus('connected')
        
        // Get all tables
        const tablesResult = await getTables()
        if (tablesResult.success) {
          setTables(tablesResult.tables)
        } else {
          setError(`Failed to get tables: ${tablesResult.error}`)
        }
      } else {
        setConnectionStatus('failed')
        setError(`Connection failed: ${connectionResult.error}`)
      }
    } catch (err) {
      setConnectionStatus('failed')
      setError(`Unexpected error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleTableSelect = async (tableName) => {
    setSelectedTable(tableName)
    setLoading(true)
    setError(null)
    
    try {
      // Get table structure
      const structureResult = await getTableStructure(tableName)
      if (structureResult.success) {
        setTableStructure(structureResult.columns)
      } else {
        setError(`Failed to get table structure: ${structureResult.error}`)
        return
      }
      
      // Get sample data
      const dataResult = await getTableData(tableName, 5)
      if (dataResult.success) {
        setTableData(dataResult.data)
      } else {
        setError(`Failed to get table data: ${dataResult.error}`)
      }
    } catch (err) {
      setError(`Error loading table: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600'
      case 'failed': return 'text-red-600'
      default: return 'text-yellow-600'
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '✅'
      case 'failed': return '❌'
      default: return '⏳'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Supabase Database Connection Test
      </h1>
      
      {/* Connection Status */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">
          Connection Status: 
          <span className={`ml-2 ${getStatusColor()}`}>
            {getStatusIcon()} {connectionStatus.toUpperCase()}
          </span>
        </h2>
        
        {error && (
          <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {loading && (
          <div className="mt-2 text-blue-600">
            Loading...
          </div>
        )}
      </div>

      {/* Tables List */}
      {connectionStatus === 'connected' && tables.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Available Tables ({tables.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {tables.map((table, index) => (
              <button
                key={index}
                onClick={() => handleTableSelect(table.table_name)}
                className={`p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors ${
                  selectedTable === table.table_name 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-800">
                  {table.table_name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table Details */}
      {selectedTable && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">
            Table: <span className="text-blue-600">{selectedTable}</span>
          </h2>
          
          {/* Table Structure */}
          {tableStructure && (
            <div>
              <h3 className="text-lg font-medium mb-3">Table Structure</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left">Column</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Nullable</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableStructure.map((column, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-2 font-medium">
                          {column.column_name}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {column.data_type}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {column.is_nullable === 'YES' ? 'Yes' : 'No'}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {column.column_default || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sample Data */}
          {tableData && (
            <div>
              <h3 className="text-lg font-medium mb-3">Sample Data (First 5 rows)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      {tableStructure?.map((column, index) => (
                        <th key={index} className="border border-gray-300 px-4 py-2 text-left">
                          {column.column_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {tableStructure?.map((column, colIndex) => (
                          <td key={colIndex} className="border border-gray-300 px-4 py-2">
                            {row[column.column_name] !== null 
                              ? String(row[column.column_name]) 
                              : <span className="text-gray-400 italic">null</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={initializeConnection}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Refreshing...' : 'Refresh Connection'}
        </button>
      </div>
    </div>
  )
}
