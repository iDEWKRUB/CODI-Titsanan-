import { blankCourse, seedCertLog, seedCerts, seedCourses, type Certificate, type CertLog, type Course } from '../data/leader'
import { makeStore } from './localStore'

// records saved by an older build may miss newer fields
const courses = makeStore<Course>('codi.courses', seedCourses, (c) => ({ ...blankCourse(c.id), ...c }))
export const useCourses = courses.use
export const getCourse = courses.get
export const nextCourseId = courses.next
export const saveCourse = courses.save
export const updateCourse = courses.update
export const deleteCourse = courses.remove

const certs = makeStore<Certificate>('codi.certificates', seedCerts)
export const useCerts = certs.use
export const getCert = certs.get
export const nextCertId = certs.next
export const saveCert = certs.save
export const deleteCert = certs.remove

const log = makeStore<CertLog>('codi.certlog', seedCertLog)
export const useCertLog = log.use
export const addCertLog = (action: string, by = 'ปรียาดา เจริญ…') =>
  log.save({ id: log.next(), date: new Date().toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-'), action, by })
