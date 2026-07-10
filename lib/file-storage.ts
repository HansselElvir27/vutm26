import fs from 'fs/promises'
import path from 'path'

/**
 * Saves a file buffer to the configured UPLOADS_BASE_PATH disk location.
 * Resolves to the absolute path of the saved file on disk.
 */
export async function saveFileToDisk(
  arrivalId: string | number,
  documentType: string,
  fileName: string,
  fileBuffer: Buffer
): Promise<string> {
  const uploadsBasePath = process.env.UPLOADS_BASE_PATH || 'C:\\Docsvutm26'
  
  // Create target directory: basePath/arrivalId
  const targetDir = path.join(uploadsBasePath, String(arrivalId))
  
  // Ensure the destination folder exists
  await fs.mkdir(targetDir, { recursive: true })
  
  // Construct a clean, unique file name to avoid collisions
  const cleanDocType = documentType.replace(/[^a-zA-Z0-9_-]/g, '')
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_')
  const finalFileName = `${cleanDocType}_${Date.now()}_${cleanFileName}`
  
  const targetPath = path.join(targetDir, finalFileName)
  
  // Save the buffer to disk
  await fs.writeFile(targetPath, fileBuffer)
  
  return targetPath
}
