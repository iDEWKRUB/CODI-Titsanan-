import { seedDocs, type EDoc } from '../data/erpDoc'
import { makeStore } from './localStore'

export const edocs = makeStore<EDoc>('codi.edoc.docs', seedDocs)
export const useEDocs = edocs.use

/** PDFs are previewed from an in-memory object URL during the session (too big for localStorage) */
export const livePreview = new Map<number, string>()
