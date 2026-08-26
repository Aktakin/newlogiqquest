import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { BlockKind } from '@logiq/engine';

/**
 * Blocks can be dragged from the palette (a new block) or from a script (an
 * existing one). Browsers do not expose dataTransfer contents during dragover,
 * so the payload is kept in React state instead.
 */
export type DragPayload =
  | { source: 'palette'; kind: BlockKind; fnId?: string }
  | { source: 'script'; blockId: string }
  | null;

interface DragContextValue {
  payload: DragPayload;
  setPayload: (payload: DragPayload) => void;
}

const DragContext = createContext<DragContextValue | null>(null);

export function DragProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<DragPayload>(null);
  const value = useMemo(() => ({ payload, setPayload }), [payload]);
  return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
}

export function useDrag(): DragContextValue {
  const context = useContext(DragContext);
  if (!context) throw new Error('useDrag must be used inside <DragProvider>');
  return context;
}
