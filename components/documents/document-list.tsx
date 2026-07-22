'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  FileText, 
  Eye, 
  Download, 
  X, 
  Loader2, 
  ExternalLink, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Clock
} from 'lucide-react'
import type { UserRole } from '@/lib/db'
import { useLanguage } from '@/lib/language-context'
import { filterDocumentsByRole, canRoleApproveDocument } from '@/lib/document-permissions'
import { approveDocument, rejectDocument } from '@/app/actions/documents'

interface DocumentApproval {
  id: number
  approver_role: string
  approver_name: string
  approved: boolean
  comments: string | null
  approved_at: string
}

interface Document {
  id: number
  document_type: string
  file_name: string
  uploaded_by_name: string
  created_at: string
  approvals?: DocumentApproval[]
}

interface DocumentListProps {
  documents: Document[]
  userRole: UserRole
  arrivalId: number
}

export function DocumentList({ documents, userRole, arrivalId }: DocumentListProps) {
  const { t } = useLanguage()
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [comments, setComments] = useState('')
  const [rejectDialogDoc, setRejectDialogDoc] = useState<Document | null>(null)
  const [rejectComments, setRejectComments] = useState('')

  const authorityRoles = ['capitan_puerto', 'aduanas', 'migracion', 'salud', 'senassa', 'admin']
  const isAuthority = authorityRoles.includes(userRole)

  // Helper function to get document type label
  const getDocumentTypeLabel = (docType: string): string => {
    const labels: Record<string, string> = {
      NOA: t('documents.noa'),
      FAL1: t('documents.fal1'),
      FAL2: t('documents.fal2'),
      FAL3: t('documents.fal3'),
      FAL4: t('documents.fal4'),
      FAL5: t('documents.fal5'),
      FAL6: t('documents.fal6'),
      FAL7: t('documents.fal7'),
      CARGO_MANIFEST: t('documents.cargoManifest'),
      NIL_LIST: t('documents.nilList'),
      LAST_DEPARTURE: t('documents.lastDeparture'),
      MDH: t('documents.mdh'),
      POC: t('documents.poc'),
      OTHER: t('documents.other'),
    }
    return labels[docType] || docType
  }

  // Helper function to get role label
  const getRoleLabel = (role: string): string => {
    return t(`role.${role}`) || role
  }

  // Filter documents based on user role permissions
  const filteredDocuments = useMemo(() => {
    return filterDocumentsByRole(documents, userRole)
  }, [documents, userRole])

  useEffect(() => {
    if (viewingDocument) {
      setLoading(true)
      setError(null)
      setDocumentUrl(null)
      setComments('')
      
      fetch(`/api/documents/${viewingDocument.id}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(t('common.errorLoading'))
          }
          return response.blob()
        })
        .then(blob => {
          const url = URL.createObjectURL(blob)
          setDocumentUrl(url)
          setLoading(false)
        })
        .catch(err => {
          console.error('[v0] Error loading document:', err)
          setError(err.message)
          setLoading(false)
        })
    }
    
    return () => {
      if (documentUrl) {
        URL.revokeObjectURL(documentUrl)
      }
    }
  }, [viewingDocument])

  const handleClose = () => {
    if (documentUrl) {
      URL.revokeObjectURL(documentUrl)
    }
    setViewingDocument(null)
    setDocumentUrl(null)
    setError(null)
    setComments('')
    setActionError(null)
  }

  const handleApprove = async (doc: Document) => {
    setActionLoading(true)
    setActionError(null)
    
    const result = await approveDocument(doc.id, arrivalId, comments || undefined)
    
    if (result.error) {
      setActionError(result.error)
    } else {
      handleClose()
    }
    
    setActionLoading(false)
  }

  const handleReject = async () => {
    if (!rejectDialogDoc) return
    
    if (!rejectComments.trim()) {
      setActionError(t('approvals.cantReject'))
      return
    }
    
    setActionLoading(true)
    setActionError(null)
    
    const result = await rejectDocument(rejectDialogDoc.id, arrivalId, rejectComments)
    
    if (result.error) {
      setActionError(result.error)
    } else {
      setRejectDialogDoc(null)
      setRejectComments('')
      handleClose()
    }
    
    setActionLoading(false)
  }

  const getMyApproval = (doc: Document) => {
    return doc.approvals?.find(a => a.approver_role === userRole)
  }

  const canApproveDoc = (doc: Document) => {
    if (!isAuthority) return false
    if (!canRoleApproveDocument(userRole, doc.document_type)) return false
    const myApproval = getMyApproval(doc)
    return !myApproval
  }

  if (filteredDocuments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>{t('documents.noDocuments')}</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {filteredDocuments.map((doc) => {
          const myApproval = getMyApproval(doc)
          const canApprove = canApproveDoc(doc)
          
          return (
            <div
              key={doc.id}
              className="p-4 rounded-lg border border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium truncate">{doc.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getDocumentTypeLabel(doc.document_type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('documents.uploadedBy')} {doc.uploaded_by_name || t('common.user')} - {new Date(doc.created_at).toLocaleDateString('es-HN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {myApproval && (
                        <Badge 
                          variant={myApproval.approved ? 'default' : 'destructive'}
                          className={myApproval.approved ? 'bg-green-600' : ''}
                        >
                          {myApproval.approved ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> {t('arrivals.approved')}</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" /> {t('arrivals.rejected')}</>
                          )}
                        </Badge>
                      )}
                      {canApprove && (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          <Clock className="w-3 h-3 mr-1" /> {t('status.pending')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Show approvals history */}
                  {doc.approvals && doc.approvals.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {doc.approvals.map((approval) => (
                        <div 
                          key={approval.id} 
                          className={`text-xs p-2 rounded ${
                            approval.approved 
                              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {approval.approved ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            <span className="font-medium">
                              {getRoleLabel(approval.approver_role)}
                            </span>
                            <span>-</span>
                            <span>{approval.approver_name}</span>
                            <span className="text-muted-foreground">
                              {new Date(approval.approved_at).toLocaleDateString('es-HN')}
                            </span>
                          </div>
                          {approval.comments && (
                            <div className="mt-1 flex items-start gap-1">
                              <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>{approval.comments}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setViewingDocument(doc)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t('documents.preview')}
                </Button>
                <a 
                  href={`/api/documents/${doc.id}?download=true`} 
                  download={doc.file_name}
                >
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    {t('documents.download')}
                  </Button>
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* Document Viewer Modal */}
      <Dialog open={!!viewingDocument} onOpenChange={handleClose}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[96vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg">
                  {viewingDocument?.file_name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {viewingDocument && getDocumentTypeLabel(viewingDocument.document_type)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {documentUrl && (
                  <a 
                    href={documentUrl} 
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {t('documents.openNewTab')}
                    </Button>
                  </a>
                )}
                <a 
                  href={viewingDocument ? `/api/documents/${viewingDocument.id}?download=true` : '#'} 
                  download={viewingDocument?.file_name}
                >
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    {t('documents.download')}
                  </Button>
                </a>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden bg-muted/50">
              {loading && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">{t('status.loading')}</span>
                </div>
              )}
              {error && (
                <div className="flex flex-col items-center justify-center h-full text-destructive">
                  <p className="mb-4">{error}</p>
                  <a 
                    href={viewingDocument ? `/api/documents/${viewingDocument.id}?download=true` : '#'} 
                    download={viewingDocument?.file_name}
                  >
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      {t('documents.download')}
                    </Button>
                  </a>
                </div>
              )}
              {documentUrl && !loading && !error && (
                <iframe
                  src={documentUrl}
                  className="w-full h-full border-0"
                  title={viewingDocument?.file_name}
                  style={{ minHeight: 0 }}
                />
              )}
            </div>
            
            {/* Approval Panel - only for authorities who can approve */}
            {viewingDocument && isAuthority && canApproveDoc(viewingDocument) && (
              <div className="w-80 border-l bg-card p-4 flex flex-col shrink-0">
                <h3 className="font-semibold mb-4">{t('approvals.documentReview')}</h3>
                
                {actionError && (
                  <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm">
                    {actionError}
                  </div>
                )}
                
                <div className="space-y-4 flex-1">
                  <div>
                    <Label htmlFor="comments">{t('approvals.commentsOptional')}</Label>
                    <Textarea
                      id="comments"
                      placeholder={t('approvals.commentsPlaceholder')}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
                  <Button
                    onClick={() => handleApprove(viewingDocument)}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    {t('approvals.approveDocument')}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setRejectDialogDoc(viewingDocument)
                      setRejectComments('')
                    }}
                    disabled={actionLoading}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {t('approvals.rejectDocument')}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Already reviewed panel */}
            {viewingDocument && isAuthority && getMyApproval(viewingDocument) && (
              <div className="w-80 border-l bg-card p-4 flex flex-col shrink-0">
                <h3 className="font-semibold mb-4">{t('approvals.reviewStatus')}</h3>
                
                {(() => {
                  const approval = getMyApproval(viewingDocument)
                  return approval ? (
                    <div className={`p-4 rounded-lg ${
                      approval.approved 
                        ? 'bg-green-50 dark:bg-green-900/20' 
                        : 'bg-red-50 dark:bg-red-900/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {approval.approved ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-medium ${
                          approval.approved ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                        }`}>
                          {approval.approved ? t('approvals.approved') : t('approvals.rejected')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(approval.approved_at).toLocaleString('es-HN')}
                      </p>
                      {approval.comments && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium mb-1">{t('approvals.comments')}:</p>
                          <p className="text-sm text-muted-foreground">{approval.comments}</p>
                        </div>
                      )}
                    </div>
                  ) : null
                })()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={!!rejectDialogDoc} onOpenChange={() => setRejectDialogDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('approvals.rejectDocument')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('approvals.confirmReject')}: <strong>{rejectDialogDoc?.file_name}</strong>
            </p>
            <div>
              <Label htmlFor="rejectComments">{t('approvals.rejectReason')}</Label>
              <Textarea
                id="rejectComments"
                placeholder={t('approvals.rejectReasonPlaceholder')}
                value={rejectComments}
                onChange={(e) => setRejectComments(e.target.value)}
                rows={4}
                className="mt-1"
                required
              />
            </div>
            {actionError && (
              <div className="p-3 rounded bg-destructive/10 text-destructive text-sm">
                {actionError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogDoc(null)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={actionLoading || !rejectComments.trim()}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              {t('approvals.confirmReject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
