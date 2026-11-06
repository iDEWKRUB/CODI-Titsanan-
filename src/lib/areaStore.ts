import { seedAreas, type ProblemReport, type SurveyAreaRecord } from '../data/orgMap'
import { makeStore } from './localStore'

const problems = makeStore<ProblemReport>('codi.areaProblems2', () => [])
export const useProblems = problems.use
export const nextProblemId = problems.next
export const saveProblem = problems.save
export const deleteProblem = problems.remove

const areas = makeStore<SurveyAreaRecord>('codi.surveyAreas', seedAreas)
export const useAreas = areas.use
export const getArea = areas.get
export const nextAreaId = areas.next
export const saveArea = areas.save
export const deleteArea = areas.remove
