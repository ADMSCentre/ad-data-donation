import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { useCallback, useEffect, useState } from 'react';
import { TableWithContext } from '../../../../types/elements';
import { BsTrash2, BsArrowCounterclockwise } from "react-icons/bs";

interface TableContainerProps {
  id: string
  table: TableWithContext
  updateTable: (tableId: string, table: TableWithContext) => void
  locale: string
}

const SearchBar = ({ search, setSearch }: { search: string, setSearch: (search: string) => void }) => {
  return (
    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className='w-1/4 px-2 border border-gray-300 rounded-md'
      placeholder='Search...'
    />
  )
}
function deleteTableRows(table: TableWithContext, deletedRows: string[][]): TableWithContext {
  const deleteIds = new Set<string>()
  for (const deletedSet of deletedRows) {
    for (const id of deletedSet) {
      deleteIds.add(id)
    }
  }

  const rows = table.originalBody.rows.filter((row) => !deleteIds.has(row.id))
  const deletedRowCount = table.originalBody.rows.length - rows.length
  return {
    ...table,
    body: { ...table.body, rows },
    deletedRowCount,
    deletedRows,
  }
}
export const AgGridTable = ({ id, table, updateTable, locale }: TableContainerProps): JSX.Element => {
  console.log(table)

  const [rows, setRows] = useState<any[]>([])
  const [columnDefs, setColumnDefs] = useState<any[]>([])
  const [search, setSearch] = useState<string>("")
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  const handleDelete = useCallback((rowIds?: string[]) => {
    if (!rowIds) return;
    if (rowIds.length > 0) {
      const deletedRows = [...table.deletedRows, rowIds]
      const newTable = deleteTableRows(table, deletedRows)
      updateTable(id, newTable)
    }
  }, [id, table])
  const handleUndo = useCallback(() => {
    const deletedRows = table.deletedRows.slice(0, -1)
    const newTable = deleteTableRows(table, deletedRows)
    updateTable(id, newTable)
  }, [id, table])
  useEffect(() => {
    const fields = table.head.cells
    setColumnDefs(fields.map((field, index) => {
      const colDef: any = {
        headerName: field,
        field: field,
        flex: 1,
        tooltipField: field,
        wrapHeaderText: true,
        autoHeaderHeight: true
      }
      if (index === 0) {
        colDef['checkboxSelection'] = true
        colDef['showDisabledCheckbox'] = true
        colDef['headerCheckboxSelection'] = true
        colDef['headerCheckboxSelectionFilteredOnly'] = true
        colDef['flex'] = 4
      }
      return colDef
    }))
    const rowData = table.body.rows.map((row) => {
      const data: any = {}
      for (const fieldIndex in fields) {
        const field = fields[fieldIndex]
        data[field] = row.cells[fieldIndex]
      }
      data.id = row.id
      return data
    })
    setRows(rowData)
  }, [table])

  return (
    // wrapping container with theme & size
    <div className='flex flex-col gap-4'>
      <div className='flex justify-between'>
        <span className='text-lg'>{table.title}</span>
        <SearchBar search={search} setSearch={setSearch} />
      </div>
      <div
        className="ag-theme-quartz" // applying the Data Grid theme
      >
        <AgGridReact
          rowData={rows}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={false}
          rowSelection='multiple'
          rowMultiSelectWithClick={true}
          domLayout='autoHeight'
          quickFilterText={search}
          autoSizeStrategy={{
            type: 'fitGridWidth'
          }}
          suppressPaginationPanel={false}
          tooltipShowMode='whenTruncated'
          tooltipMouseTrack={true}
          onSelectionChanged={(event) => {
            const selectedRows = event.api.getSelectedRows()
            setSelectedRows(selectedRows.map((row: any) => row.id))
          }}
        />
      </div>
      <div className='-mt-14 ml-4 z-10 flex gap-2 w-fit'>

        {
          table.deletedRowCount > 0 ?
            <button onClick={handleUndo}
              className='text-blue-500 px-2 rounded-md flex items-center gap-1 border border-blue-500 hover:bg-blue-500 hover:text-white'
            >
              <BsArrowCounterclockwise size={20} />
              Undo
            </button> : <button onClick={() => {
              handleDelete(selectedRows)
            }}
              className='text-red-500 px-2 rounded-md flex items-center gap-1 border border-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-red-500'
              disabled={selectedRows.length === 0}
            >
              <BsTrash2 size={20} />
              Delete {selectedRows.length > 0 ? `(${selectedRows.length})` : ''}
            </button>
        }
      </div>
    </div>
  )
}