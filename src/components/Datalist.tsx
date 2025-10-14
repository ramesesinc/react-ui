import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  Eye,
  Funnel,
  Pencil,
  RefreshCcw,
  Search,
  Trash,
} from "lucide-react";
import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import Tooltip from "./Tooltip";

type Column = {
  id: string;
  title: string;
  type?: string;
  sortable?: boolean;
  width?: number;
  alignment?: string;
  valignment?: string;
  style?: Record<string, any>;
  render?: (item: Record<string, any>) => React.ReactNode;
  primary?: boolean;
  visible?: boolean;
};

type ExtraAction = {
  name: string;
  icon?: React.ReactNode;
  onClick: (item: Record<string, any>) => void;
  order?: number;
};

type HiddenCol = { name: string };

export type DataListRef = {
  search: () => void;
  refresh: () => void;
  update: (items: Record<string, any>[]) => void;
  updateItem: (predicate: (item: Record<string, any>) => boolean, newItem: Record<string, any>) => void;
  removeItem: (predicate: (item: Record<string, any>) => boolean) => void;
};

type DataListHandler = {
  getColumns: () => Column[];
  getList: (params: Record<string, any>) => Promise<Record<string, any>[]>;
  uiref?: DataListRef; // injected by DataList
};

type DataListProps = {
  // New priority-based handler
  listHandler?: DataListHandler;

  // Legacy/manual mode
  cols?: Column[];
  handler?: (params: Record<string, any>) => Promise<Record<string, any>[]>;

  limit?: number;
  sortcol?: string;
  orderby?: string;
  hideToolbar?: boolean;

  openItem?: (item: Record<string, any>) => void;

  onEdit?: (item: Record<string, any>) => void;
  onView?: (item: Record<string, any>) => void;
  onDelete?: (item: Record<string, any>) => void;

  dropdown?: (item: Record<string, any>) => React.ReactNode;
  searchFields?: string[];

  addToolbar?: React.ReactNode;
  addAction?: ExtraAction[];
  toolbarActions?: ExtraAction[];

  allowSearch?: boolean;
  searchMode?: "auto" | "manual";

  emptyState?: { title?: string; message?: string };
  hiddencols?: HiddenCol[];

  error?: string;
};

const getNestedValue = (obj: any, path: string) => path.split(".").reduce((acc, part) => acc?.[part], obj);

const DataList = forwardRef<DataListRef, DataListProps>(
  (
    {
      listHandler,
      cols,
      handler,
      hiddencols,
      sortcol,
      orderby,
      limit = 20,
      openItem,
      hideToolbar = false,
      allowSearch = false,
      searchMode = "manual",
      onEdit,
      onView,
      onDelete,
      emptyState,
      dropdown,
      searchFields,
      addAction,
      addToolbar,
      toolbarActions,
      error: externalError,
    },
    ref
  ) => {
    const [items, setItems] = useState<Record<string, any>[]>([]);
    const [searchText, setSearchText] = useState("");
    const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);
    const [start, setStart] = useState(0);
    const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);

    // âœ… Decide columns & fetcher based on priority
    const columns = listHandler ? listHandler.getColumns() : cols ?? [];
    const visibleCols = cols?.filter((c: Column) => c.visible !== false) ?? [];
    const fetcher = listHandler ? listHandler.getList : handler;

    const defaultActions: ExtraAction[] = [
      onEdit
        ? { name: "Edit", icon: <Pencil size={16} className="text-green-500" />, onClick: onEdit, order: 2 }
        : null,
      onView ? { name: "View", icon: <Eye size={16} className="text-blue-600" />, onClick: onView, order: 3 } : null,
      onDelete
        ? { name: "Delete", icon: <Trash size={16} className="text-red-500" />, onClick: onDelete, order: 4 }
        : null,
    ].filter(Boolean) as ExtraAction[];

    const allRowActions = [
      ...(addAction?.map((a) => ({ ...a, order: a.order ? a.order + 1 : 1 })) ?? []),
      ...defaultActions,
    ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const showActions = allRowActions.length > 0;
    const sortedToolbarActions = (toolbarActions ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const doSearch = async (params: Record<string, any>) => {
      if (!fetcher) return;

      setLoading(true);
      setInternalError(null);
      try {
        let pkcol: Column | null = null;

        cols!.filter((c: Column) => {
          if (pkcol == null && Boolean(c.primary)) {
            pkcol = c;
          }
        });

        if (pkcol == null) {
          // throw new Error("Specify a primary column");
          setInternalError("Specify a primary column");
        }

        const projection: Record<string, any> = {};

        cols!.forEach((c: Column) => {
          projection[c.id] = 1;
        });

        const uFilter = {
          ...(params.filters ?? appliedFilters ?? {}),
          // add additional filter here
        };

        const query = {
          start: params._start ?? start,
          limit,
          searchtext: searchText,
          // cols: columns ?? null,
          // hiddencols: hiddencols ?? null,
          // sortcol: sortcol ?? params.sortcol ?? null,
          orderby: orderby ?? null,
          filter: uFilter,
          searchfields: searchFields ?? undefined,
          projection,
        };
        // console.log({ query });
        const results = await fetcher(query);

        let resolveItems = [];

        if (results == null) {
          resolveItems = [];
        } else if (Array.isArray(results)) {
          resolveItems = results;
        } else {
          resolveItems = (results as Record<string, any>).data;
        }

        setItems(resolveItems ?? []);
      } catch (err: any) {
        // console.error("DataList Error:", err);
        setInternalError(err?.message ?? "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    // âœ… Expose full ref API
    useImperativeHandle(ref, () => ({
      refresh: () => doSearch({ _start: start }),
      update: (newItems) => setItems(newItems),
      search: () => doSearch({ _start: 0 }),
      updateItem: (predicate, newItem) =>
        setItems((prev) => prev.map((item) => (predicate(item) ? { ...item, ...newItem } : item))),
      removeItem: (predicate) => setItems((prev) => prev.filter((item) => !predicate(item))),
    }));

    // Also inject into listHandler.uiref
    useEffect(() => {
      if (listHandler) {
        listHandler.uiref = {
          refresh: () => doSearch({ _start: start }),
          update: (newItems) => setItems(newItems),
          search: () => doSearch({ _start: 0 }),
          updateItem: (predicate, newItem) =>
            setItems((prev) => prev.map((item) => (predicate(item) ? { ...item, ...newItem } : item))),
          removeItem: (predicate) => setItems((prev) => prev.filter((item) => !predicate(item))),
        };
      }
    }, [listHandler, start]);

    // Initial load
    useEffect(() => {
      doSearch({ _start: 0 });
    }, []);

    // Auto search debounce
    useEffect(() => {
      if (searchMode === "auto") {
        const timeout = setTimeout(() => doSearch({ _start: start }), 300);
        return () => clearTimeout(timeout);
      }
    }, [searchText, appliedFilters, start, searchMode]);

    const displayedItems = items.slice(0, limit);
    const hasNext = items.length > limit;
    const finalError = externalError || internalError;

    return (
      <div className="flex flex-col font-sans font-sm rounded-md relative">
        {finalError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-2 flex items-center justify-between">
            <span className="ml-2 text-sm">{finalError}</span>
          </div>
        )}
        {/* Toolbar */}
        <div className={`${hideToolbar ? "hidden" : "flex"} justify-between items-center gap-4 p-2.5`}>
          <div>{addToolbar}</div>
          <div className="flex items-center gap-3 relative">
            {sortedToolbarActions.map((action) => (
              <Tooltip key={action.name} content={action.name} position="top">
                <button type="button" className="p-1 rounded hover:bg-gray-100" onClick={() => action.onClick?.({})}>
                  {React.isValidElement(action.icon) ? React.cloneElement(action.icon, { size: 16 }) : action.icon}
                </button>
              </Tooltip>
            ))}

            <button className="flex items-center gap-2 rounded-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700">
              <Funnel size={16} />
              Filter
            </button>

            <Tooltip content="Refresh" position="top">
              <button className="p-1 rounded hover:bg-gray-100" onClick={() => doSearch({ _start: start })}>
                <RefreshCcw size={16} />
              </button>
            </Tooltip>

            {/* Search */}
            {allowSearch && (
              <div className="relative inline-flex items-center">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (searchMode === "manual" && e.key === "Enter") {
                      e.preventDefault();
                      doSearch({ _start: 0 });
                    }
                  }}
                  placeholder="Search..."
                  className="border border-gray-300 rounded-md py-1 px-3 pr-8 text-sm outline-none focus:ring-1 focus:ring-blue-400 h-10"
                />
                {searchMode === "manual" && (
                  <button
                    type="button"
                    onClick={() => doSearch({ _start: 0 })}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800 flex items-center justify-center p-0"
                  >
                    <Search size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto relative">
          <table className="w-full border-collapse table-auto">
            <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_rgb(235,241,245)]">
              <tr>
                {/* {columns.map((col) => (
                  <th
                    key={col.id}
                    style={{ width: Number.isFinite(col.width) ? col.width : "auto" }}
                    className="px-4 py-3 text-left font-bold text-sm align-middle text-gray-400"
                  >
                    {col.title}
                  </th>
                ))} */}
                {visibleCols.map((col) => (
                  <th
                    key={col.id}
                    style={{ width: Number.isFinite(col.width) ? col.width : "auto" }}
                    className="px-4 py-3 text-left font-bold text-sm align-middle text-white bg-blue-400"
                  >
                    {col.title}
                  </th>
                ))}
                {showActions && <th className="px-4 py-3 text-center w-1"></th>}
                {dropdown && <th className="px-4 py-3 w-1" />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: limit }).map((_, idx) => (
                  <tr key={idx} className="h-12 even:bg-gray-50 odd:bg-white">
                    {/* {columns.map((c) => (
                      <td key={c.id} className="px-4 py-3 align-middle">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))} */}
                    {visibleCols.map((c) => (
                      <td key={c.id} className="px-4 py-3 align-middle">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                    {showActions && (
                      <td className="px-4 py-3 align-middle">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    )}
                    {dropdown && (
                      <td className="px-4 py-3 align-middle">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    )}
                  </tr>
                ))
              ) : displayedItems.length === 0 ? (
                <tr>
                  {/* <td colSpan={columns.length + 2} className="text-center py-8"> */}
                  <td
                    colSpan={visibleCols.length + (showActions ? 1 : 0) + (dropdown ? 1 : 0)}
                    className="text-center py-8"
                  >
                    <p className="font-semibold">{emptyState?.title ?? "No Data"}</p>
                    <p>{emptyState?.message ?? "Try adjusting filters or search."}</p>
                  </td>
                </tr>
              ) : (
                displayedItems.map((item: any, idx: any) => {
                  const isExpanded = expandedRowIndex === idx;
                  return (
                    <React.Fragment key={idx}>
                      <tr
                        className="h-12 even:bg-gray-50 odd:bg-white hover:bg-blue-100"
                        onClick={() => openItem?.(item)}
                        style={{ cursor: openItem ? "pointer" : undefined }}
                      >
                        {/* {columns.map((col) => (
                          <td key={col.id} className="px-4 py-3 align-middle border-b">
                            {col.render
                              ? col.render(item)
                              : getNestedValue(item, col.id) ?? <span className="text-gray-400">-</span>}
                          </td>
                        ))} */}
                        {visibleCols.map((col) => (
                          <td key={col.id} className="px-4 py-3 align-middle border-b">
                            {col.render
                              ? col.render(item)
                              : getNestedValue(item, col.id) ?? <span className="text-gray-400">-</span>}
                          </td>
                        ))}
                        {showActions && (
                          <td className="px-4 py-3 align-middle whitespace-nowrap border-b">
                            <div className="flex gap-1 justify-center">
                              {allRowActions.map((action) => (
                                <Tooltip key={action.name} content={action.name} position="top" color="dark">
                                  <button
                                    type="button"
                                    className="p-1 rounded hover:bg-[#f0f0f0]"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      action.onClick?.(item);
                                    }}
                                  >
                                    {React.isValidElement(action.icon)
                                      ? React.cloneElement(action.icon, { size: 16 })
                                      : action.icon}
                                  </button>
                                </Tooltip>
                              ))}
                            </div>
                          </td>
                        )}
                        {dropdown && (
                          <td className="px-4 py-3 align-middle">
                            <button
                              type="button"
                              className="p-1 rounded hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRowIndex(isExpanded ? null : idx);
                              }}
                            >
                              {isExpanded ? <ChevronLeft size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </td>
                        )}
                      </tr>
                      {dropdown && isExpanded && (
                        <tr className="bg-gray-100">
                          <td colSpan={visibleCols.length + (showActions ? 1 : 0)} className="p-4">
                            {dropdown(item)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="flex justify-end gap-2 p-2 bg-gray-50">
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              setStart(0);
              doSearch({ _start: 0 });
            }}
            disabled={start === 0}
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            type="button"
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              const prev = Math.max(0, start - limit);
              setStart(prev);
              doSearch({ _start: prev });
            }}
            disabled={start === 0}
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              const next = start + limit;
              setStart(next);
              doSearch({ _start: next });
            }}
            disabled={!hasNext}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }
);

export default DataList;
export type { Column, DataListHandler, DataListProps, ExtraAction };
