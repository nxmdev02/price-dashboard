import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

interface ServiceAccountFile {
  project_id: string
  client_email: string
  private_key: string
}

let adminApp: App | undefined

function readLocalServiceAccount(path: string): ServiceAccount {
  const absolutePath = resolve(process.cwd(), path)
  const parsed = JSON.parse(readFileSync(absolutePath, 'utf8')) as Partial<ServiceAccountFile>

  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error('Firebase 서비스 계정 파일에 필수 항목이 없습니다.')
  }

  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key,
  }
}

export function getFirebaseAdminApp(): App {
  if (adminApp) return adminApp

  const existingApp = getApps()[0]
  if (existingApp) {
    adminApp = existingApp
    return adminApp
  }

  const config = useRuntimeConfig()
  const serviceAccount = config.firebaseServiceAccountPath
    ? readLocalServiceAccount(config.firebaseServiceAccountPath)
    : {
        projectId: config.firebaseProjectId,
        clientEmail: config.firebaseClientEmail,
        privateKey: config.firebasePrivateKey.replace(/\\n/g, '\n'),
      }

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('Firebase Admin 환경변수가 설정되지 않았습니다.')
  }

  adminApp = initializeApp({ credential: cert(serviceAccount) })
  return adminApp
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp())
}

export function getAdminFirestore() {
  return getFirestore(getFirebaseAdminApp())
}
