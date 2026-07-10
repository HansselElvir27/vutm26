'use client'

import * as React from 'react'

export type Language = 'es' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'vutm-language'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<Language>('es')
  const [isInitialized, setIsInitialized] = React.useState(false)

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null
    if (stored && (stored === 'es' || stored === 'en')) {
      setLanguageState(stored)
    }
    setIsInitialized(true)
  }, [])

  const setLanguage = React.useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
  }, [])

  const t = React.useCallback((key: string): string => {
    const translations: Record<Language, Record<string, string>> = {
      es: {
        // Header
        'header.notifications': 'Notificaciones',
        'header.myProfile': 'Mi Perfil',
        'header.logout': 'Cerrar Sesión',
        'header.language': 'Idioma',
        
        // Sidebar
        'sidebar.dashboard': 'Panel Principal',
        'sidebar.myArrivals': 'Mis Arribos',
        'sidebar.newArrival': 'Nuevo Arribo',
        'sidebar.documents': 'Documentos',
        'sidebar.arrivals': 'Arribos',
        'sidebar.approvals': 'Aprobaciones',
        'sidebar.allArrivals': 'Todos los Arribos',
        'sidebar.users': 'Usuarios',
        'sidebar.settings': 'Configuración',
        'sidebar.statistics': 'Estadísticas',
        
        // Roles
        'role.admin': 'Administrador',
        'role.naviera': 'Agente Naviero',
        'role.capitan_puerto': 'Capitanía de Puerto',
        'role.aduanas': 'Aduanas',
        'role.migracion': 'Migración',
        'role.salud': 'Sanidad',
        'role.senassa': 'SENASA',
        'role.oficial_cim': 'Oficial CIM',
        
        // Login
        'login.title': 'Iniciar Sesión',
        'login.email': 'Correo Electrónico',
        'login.password': 'Contraseña',
        'login.submit': 'Ingresar',
        'login.error': 'Credenciales inválidas',
        
        // Arrivals
        'arrivals.title': 'Arribos',
        'arrivals.new': 'Nuevo Arribo',
        'arrivals.view': 'Ver Detalles',
        'arrivals.edit': 'Editar',
        'arrivals.delete': 'Eliminar',
        'arrivals.status': 'Estado',
        'arrivals.submitted': 'Enviado',
        'arrivals.pending': 'Pendiente',
        'arrivals.approved': 'Aprobado',
        'arrivals.rejected': 'Rechazado',
        'arrivals.createNotification': 'Crear Notificación de Arribo',
        'arrivals.updateArrival': 'Actualizar Arribo',
        
        // Vessel Form
        'vessel.shipName': 'Nombre del Buque',
        'vessel.omiNumber': 'Número OMI',
        'vessel.flag': 'Bandera',
        'vessel.flagCountry': 'País de bandera',
        'vessel.type': 'Tipo de Buque',
        'vessel.typeSelect': 'Seleccione tipo',
        'vessel.callSign': 'Indicativo de Llamada',
        'vessel.gt': 'Arqueo Bruto (GT)',
        'vessel.length': 'Eslora (metros)',
        'vessel.breadth': 'Manga (metros)',
        'vessel.voyageNumber': 'Número de Viaje',
        
        // Route & Ports
        'route.lastPort': 'Último Puerto',
        'route.lastPortCountry': 'País del Último Puerto',
        'route.arrivalPort': 'Puerto de Arribo',
        'route.selectPort': 'Seleccione puerto',
        
        // Arrival Date
        'arrival.date': 'Fecha Estimada de Arribo',
        'arrival.time': 'Hora Estimada de Arribo',
        
        // Documents
        'documents.title': 'Documentos',
        'documents.upload': 'Subir Documento',
        'documents.download': 'Descargar',
        'documents.preview': 'Vista Previa',
        'documents.required': 'Requerido',
        'documents.noa': 'NOA - Notificación de Arribo',
        'documents.fal1': 'FAL1 - Declaración General',
        'documents.fal2': 'FAL2 - Declaración de Carga',
        'documents.fal3': 'FAL3 - Provisiones del Buque',
        'documents.fal4': 'FAL4 - Efectos de la Tripulación',
        'documents.fal5': 'FAL5 - Lista de Tripulación',
        'documents.fal6': 'FAL6 - Lista de Pasajeros',
        'documents.fal7': 'FAL7 - Mercancías Peligrosas',
        'documents.cargoManifest': 'Manifiesto de Carga Detallado',
        'documents.nilList': 'Lista NIL',
        'documents.lastDeparture': 'Ultimo ZARPE',
        'documents.mdh': 'MDH - Declaración Marítima de Sanidad',
        'documents.poc': 'POC - Ultimos 10 Puertos',
        'documents.other': 'Otro Documento',
        'documents.selectPdf': 'Haga clic para seleccionar archivo PDF',
        'documents.maxSize': 'Max. 10MB',
        'documents.noDocuments': 'No hay documentos para revisar',
        'documents.uploadedBy': 'Por',
        'documents.documentViewer': 'Visor de Documentos',
        'documents.openNewTab': 'Abrir en nueva pestaña',
        
        // Additional Options
        'options.title': 'Información Adicional',
        'options.observations': 'Observaciones',
        'options.observationsPlaceholder': 'Notas adicionales sobre el arribo...',
        'options.isDonation': 'Es donación',
        'options.fastArrival': 'Arribo rápido',
        'options.crewChange': 'Cambio de tripulación',
        'options.needsAssistance': 'Necesita asistencia',
        
        // Approvals
        'approvals.title': 'Aprobaciones',
        'approvals.approve': 'Aprobar',
        'approvals.reject': 'Rechazar',
        'approvals.approveAll': 'Aprobar Todos',
        'approvals.approveDocument': 'Aprobar Documento',
        'approvals.rejectDocument': 'Rechazar Documento',
        'approvals.documentReview': 'Revisión del Documento',
        'approvals.reviewStatus': 'Estado de Revisión',
        'approvals.approved': 'Documento Aprobado',
        'approvals.rejected': 'Documento Rechazado',
        'approvals.comments': 'Comentarios',
        'approvals.commentsOptional': 'Comentarios (opcional para aprobar)',
        'approvals.commentsPlaceholder': 'Agregue observaciones o comentarios...',
        'approvals.rejectReason': 'Motivo del rechazo (requerido)',
        'approvals.rejectReasonPlaceholder': 'Explique el motivo del rechazo...',
        'approvals.confirmReject': 'Confirmar Rechazo',
        'approvals.cantReject': 'Debe proporcionar un motivo para el rechazo',
        
        // Status
        'status.pending': 'Pendiente',
        'status.loading': 'Cargando documento...',
        'status.saving': 'Guardando...',
        
        // Document Errors
        'arrivals.requiredDocsError': 'Debe adjuntar los documentos NOA y FAL1 para crear la notificación de arribo',
        'documents.noaPdfError': 'El documento NOA debe ser un archivo PDF',
        'documents.noaSizeError': 'El documento NOA no debe exceder 10MB',
        'documents.fal1PdfError': 'El documento FAL1 debe ser un archivo PDF',
        'documents.fal1SizeError': 'El documento FAL1 no debe exceder 10MB',
        
        // Common
        'common.save': 'Guardar',
        'common.cancel': 'Cancelar',
        'common.submit': 'Enviar',
        'common.back': 'Volver',
        'common.search': 'Buscar',
        'common.filter': 'Filtrar',
        'common.actions': 'Acciones',
        'common.loading': 'Cargando...',
        'common.error': 'Error',
        'common.success': 'Éxito',
        'common.yes': 'Sí',
        'common.no': 'No',
        'common.user': 'Usuario',
        'common.required': 'Requerido',
        
        // Titles
        'app.title': 'Ventanilla Única de Transporte Marítimo',
        'app.subtitle': 'Marina Mercante Honduras',
        'app.vesselInfo': 'Información del Buque',
        'app.vesselData': 'Datos de identificación de la embarcación',
        'app.routePorts': 'Ruta y Puertos',
        'app.routeInfo': 'Información sobre origen y destino',
        'app.arrivalDateTime': 'Fecha y Hora de Arribo',
        'app.arrivalEstimate': 'Estimación de llegada al puerto',
        'app.requiredDocs': 'Documentos Requeridos',
        'app.requiredDocsInfo': 'Adjunte los documentos obligatorios para la notificación de arribo',
        
        // Dashboard
        'dashboard.welcome': 'Bienvenido',
        'dashboard.agentPanel': 'Panel de control de agente naviero',
        'dashboard.authorityPanel': 'Panel de control de autoridad',
        'dashboard.totalArrivals': 'Total de Arribos',
        'dashboard.registeredByYou': 'Registrados por usted',
        'dashboard.inYourPort': 'En su puerto',
        'dashboard.inSystem': 'En el sistema',
        'dashboard.pendingApproval': 'En espera de aprobación',
        'dashboard.readyForZarpe': 'Listos para zarpe',
        'dashboard.uploadedFiles': 'Archivos cargados',
        'dashboard.recentArrivals': 'Arribos Recientes',
        'dashboard.yourNotifications': 'Sus últimas notificaciones de arribo',
        'dashboard.notificationsInPort': 'Últimas notificaciones en',
        'dashboard.systemNotifications': 'Últimas notificaciones en el sistema',
        'dashboard.noArrivals': 'No hay arribos registrados',
        'dashboard.createFirst': 'Crear primera notificación de arrival',
        'dashboard.eta': 'ETA',
        
        // Arrivals List Page
        'arrivalsList.manageNotifications': 'Gestione sus notificaciones de arrival',
        'arrivalsList.reviewNotifications': 'Revise y apruebe notificaciones de arrival',
        'arrivalsList.arrivalsList': 'Lista de Arribos',
        'arrivalsList.recordsFound': 'registros encontrados',
        'arrivalsList.noArrivals': 'No hay arrivals registrados',
        'arrivalsList.createFirst': 'Crear su primera notificación de arrival',
        'arrivalsList.flag': 'Bandera:',
        
        // Documents Page
        'docs.yourDocuments': 'Documentos adjuntos a sus notificaciones de arrival',
        'docs.systemDocuments': 'Documentos del sistema para revisión y aprobación',
        'docs.documentList': 'Lista de Documentos',
        'docs.documentsFound': 'documentos encontrados',
        'docs.noDocuments': 'No hay documentos',
        'docs.appearHere': 'Los documentos aparecen aquí cuando se adjuntan a un arrival',
        
        // Status List
        'statusList.draft': 'Borrador',
        'statusList.submitted': 'Enviado',
        'statusList.approvedByCaptain': 'Aprobado por Capitán',
        'statusList.docsComplete': 'Docs Completos',
        'statusList.readyForZarpe': 'Listo para Zarpe',
        'statusList.zarpeApproved': 'Zarpe Aprobado',
        'statusList.completed': 'Completado',
        
        // Zarpe Print
        'zarpe.vesselName': 'Nombre del Buque',
        'zarpe.omiNumber': 'Número OMI',
        'zarpe.flag': 'Bandera',
        'zarpe.length': 'Eslora (m)',
        'zarpe.gt': 'Tonelaje Bruto (GT)',
        'zarpe.type': 'Tipo',
        'zarpe.captainName': 'Nombre del Capitán',
        'zarpe.passport': 'Pasaporte',
        'zarpe.nationality': 'Nacionalidad',
        'zarpe.departurePort': 'Puerto de Salida',
        'zarpe.voyageNumber': 'Número de Viaje',
        'zarpe.destinationPort': 'Puerto de Destino',
        'zarpe.departureDate': 'Fecha de Salida',
        'zarpe.departureTime': 'Hora de Salida',
        'zarpe.provenance': 'Procedencia',
        'zarpe.crew': 'Tripulación',
        'zarpe.passengers': 'Pasajeros',
        'zarpe.cargo': 'Carga a Bordo',
        'zarpe.shippingAgent': 'Agente Naviero',
        'zarpe.cimOperator': 'Operador CIM',
        'zarpe.observations': 'Observaciones',
        'zarpe.cimPreApproval': 'Pre-Aprobación CIM',
        'zarpe.portCaptain': 'Capitán de Puerto',
        'zarpe.cimOfficial': 'Oficial CIM',
        'zarpe.authenticity': 'Verificación de Autenticidad',
        'zarpe.scanQR': 'Escanee el código QR para verificar',
        'zarpe.zarpeNo': 'Zarpe No.',
        'zarpe.issued': 'Emitido',
        'zarpe.approved': 'Aprobado',
        'zarpe.vesselData': 'Datos del Buque',
        'zarpe.captainData': 'Datos del Capitán',
        'zarpe.voyageData': 'Datos del Viaje',
        'zarpe.otherData': 'Otros Datos',
        'zarpe.republic': 'REPÚBLICA DE HONDURAS',
        'zarpe.maritime': 'Dirección General de Marina Mercante',
        'zarpe.zarpeTitle': 'ZARPE DE PUERTO',
        'zarpe.generatedBy': 'Generado por VUTMHN',
        'zarpe.validWithQR': 'Este documento es válido únicamente con el código QR de verificación',
        'zarpe.noCargo': 'Sin carga',
        
        // Statistics
        'stats.title': 'Estadísticas del Sistema',
        'stats.systemOverview': 'Visión general de todos los puertos',
        'stats.portData': 'Datos de',
        'stats.totalArrivals': 'Total Arribos',
        'stats.registered': 'Registrados en el sistema',
        'stats.pending': 'Pendientes',
        'stats.awaitingApproval': 'Esperando aprobación',
        'stats.issuedZarpes': 'Zarpes Emitidos',
        'stats.approvedSigned': 'Aprobados y firmados',
        'stats.documents': 'Documentos',
        'stats.totalProcessed': 'Total procesados',
        'stats.activeAgents': 'Navieras Activas',
        'stats.last30Days': 'Últimos 30 días',
        'stats.arrivalsByMonth': 'Arribos por Mes',
        'stats.last6Months': 'Tendencia de los últimos 6 meses',
        'stats.arrivalsByPort': 'Arribos por Puerto',
        'stats.distributionByPort': 'Distribución por puerto de destino',
        'stats.documentsByType': 'Documentos por Tipo',
        'stats.docsProcessed': 'Cantidad de documentos procesados',
        'stats.arrivalStatus': 'Estado de Arribos',
        'stats.distributionByStatus': 'Distribución por estado actual',
        
        // New Statistics
        'stats.mostActivePort': 'Puerto con Más Actividad',
        'stats.mostActiveAgent': 'Naviera con Más Actividad',
        'stats.vesselsByPort': 'Cantidad de Buques por Puerto',
        'stats.vesselsByStatus': 'Buques según su Actividad',
        'stats.topVesselTypes': 'Top Tipos de Buques',
        'stats.topFlags': 'Top Banderas',
        'stats.zarpeStats': 'Estadísticas de Zarpes',
        'stats.avgCrew': 'Promedio de Tripulación',
        'stats.avgPassengers': 'Promedio de Pasajeros',
        'stats.documentCompliance': 'Cumplimiento de Documentos',
        'stats.pendingZarpes': 'Zarpes Pendientes',
        'stats.completedZarpes': 'Zarpes Completados',
        
        // Users Management
        'users.title': 'Gestión de Usuarios',
        'users.description': 'Administre los usuarios, roles y permisos de acceso al sistema',
        'users.newUser': 'Nuevo Usuario',
        'users.editUser': 'Editar Usuario',
        'users.deleteUser': 'Eliminar Usuario',
        'users.deleteConfirm': '¿Está seguro de que desea eliminar a este usuario?',
        'users.deleteWarning': 'Esta acción no se puede deshacer y revocará inmediatamente el acceso del usuario.',
        'users.name': 'Nombre Completo',
        'users.email': 'Correo Electrónico',
        'users.role': 'Rol / Cargo',
        'users.port': 'Puerto Asignado',
        'users.company': 'Empresa / Naviera',
        'users.password': 'Contraseña',
        'users.passwordHelp': 'Deje en blanco si no desea cambiar la contraseña',
        'users.actions': 'Acciones',
        'users.noUsers': 'No se encontraron usuarios',
        'users.searchPlaceholder': 'Buscar por nombre o correo...',
        'users.allRoles': 'Todos los roles',
        'users.allPorts': 'Todos los puertos',
        'users.successCreate': 'Usuario creado exitosamente',
        'users.successUpdate': 'Usuario actualizado exitosamente',
        'users.successDelete': 'Usuario eliminado exitosamente',
        'users.companyPlaceholder': 'Nombre de la empresa naviera',
        'users.selectPort': 'Seleccione un puerto asignado',
        'users.selectRole': 'Seleccione un rol',
      },
      en: {
        // Header
        'header.notifications': 'Notifications',
        'header.myProfile': 'My Profile',
        'header.logout': 'Log Out',
        'header.language': 'Language',
        
        // Sidebar
        'sidebar.dashboard': 'Dashboard',
        'sidebar.myArrivals': 'My Arrivals',
        'sidebar.newArrival': 'New Arrival',
        'sidebar.documents': 'Documents',
        'sidebar.arrivals': 'Arrivals',
        'sidebar.approvals': 'Approvals',
        'sidebar.allArrivals': 'All Arrivals',
        'sidebar.users': 'Users',
        'sidebar.settings': 'Settings',
        'sidebar.statistics': 'Statistics',
        
        // Roles
        'role.admin': 'Administrator',
        'role.naviera': 'Shipping Agent',
        'role.capitan_puerto': 'Port Captaincy',
        'role.aduanas': 'Customs',
        'role.migracion': 'Migration',
        'role.salud': 'Health',
        'role.senassa': 'SENASA',
        'role.oficial_cim': 'CIM Official',
        
        // Login
        'login.title': 'Sign In',
        'login.email': 'Email',
        'login.password': 'Password',
        'login.submit': 'Sign In',
        'login.error': 'Invalid credentials',
        
        // Arrivals
        'arrivals.title': 'Arrivals',
        'arrivals.new': 'New Arrival',
        'arrivals.view': 'View Details',
        'arrivals.edit': 'Edit',
        'arrivals.delete': 'Delete',
        'arrivals.status': 'Status',
        'arrivals.submitted': 'Submitted',
        'arrivals.pending': 'Pending',
        'arrivals.approved': 'Approved',
        'arrivals.rejected': 'Rejected',
        'arrivals.createNotification': 'Create Arrival Notification',
        'arrivals.updateArrival': 'Update Arrival',
        
        // Vessel Form
        'vessel.shipName': 'Vessel Name',
        'vessel.omiNumber': 'IMO Number',
        'vessel.flag': 'Flag',
        'vessel.flagCountry': 'Flag Country',
        'vessel.type': 'Vessel Type',
        'vessel.typeSelect': 'Select type',
        'vessel.callSign': 'Call Sign',
        'vessel.gt': 'Gross Tonnage (GT)',
        'vessel.length': 'Length (meters)',
        'vessel.breadth': 'Breadth (meters)',
        'vessel.voyageNumber': 'Voyage Number',
        
        // Route & Ports
        'route.lastPort': 'Last Port',
        'route.lastPortCountry': 'Last Port Country',
        'route.arrivalPort': 'Port of Arrival',
        'route.selectPort': 'Select port',
        
        // Arrival Date
        'arrival.date': 'Estimated Arrival Date',
        'arrival.time': 'Estimated Arrival Time',
        
        // Documents
        'documents.title': 'Documents',
        'documents.upload': 'Upload Document',
        'documents.download': 'Download',
        'documents.preview': 'Preview',
        'documents.required': 'Required',
        'documents.noa': 'NOA - Arrival Notification',
        'documents.fal1': 'FAL1 - General Declaration',
        'documents.fal2': 'FAL2 - Cargo Declaration',
        'documents.fal3': 'FAL3 - Ship\'s Stores',
        'documents.fal4': 'FAL4 - Crew Effects',
        'documents.fal5': 'FAL5 - Crew List',
        'documents.fal6': 'FAL6 - Passenger List',
        'documents.fal7': 'FAL7 - Dangerous Goods',
        'documents.cargoManifest': 'Detailed Cargo Manifest',
        'documents.nilList': 'NIL List',
        'documents.lastDeparture': 'Last Port Clearance',
        'documents.mdh': 'MDH - Maritime Health Declaration',
        'documents.poc': 'POC - Protection Certificate',
        'documents.other': 'Other Document',
        'documents.selectPdf': 'Click to select PDF file',
        'documents.maxSize': 'Max. 10MB',
        'documents.noDocuments': 'No documents to review',
        'documents.uploadedBy': 'By',
        'documents.documentViewer': 'Document Viewer',
        'documents.openNewTab': 'Open in new tab',
        
        // Additional Options
        'options.title': 'Additional Information',
        'options.observations': 'Observations',
        'options.observationsPlaceholder': 'Additional notes about the arrival...',
        'options.isDonation': 'Is donation',
        'options.fastArrival': 'Fast arrival',
        'options.crewChange': 'Crew change',
        'options.needsAssistance': 'Needs assistance',
        
        // Approvals
        'approvals.title': 'Approvals',
        'approvals.approve': 'Approve',
        'approvals.reject': 'Reject',
        'approvals.approveAll': 'Approve All',
        'approvals.approveDocument': 'Approve Document',
        'approvals.rejectDocument': 'Reject Document',
        'approvals.documentReview': 'Document Review',
        'approvals.reviewStatus': 'Review Status',
        'approvals.approved': 'Document Approved',
        'approvals.rejected': 'Document Rejected',
        'approvals.comments': 'Comments',
        'approvals.commentsOptional': 'Comments (optional to approve)',
        'approvals.commentsPlaceholder': 'Add observations or comments...',
        'approvals.rejectReason': 'Rejection reason (required)',
        'approvals.rejectReasonPlaceholder': 'Explain the reason for rejection...',
        'approvals.confirmReject': 'Confirm Rejection',
        'approvals.cantReject': 'You must provide a reason for rejection',
        
        // Status
        'status.pending': 'Pending',
        'status.loading': 'Loading document...',
        'status.saving': 'Saving...',
        
        // Document Errors
        'arrivals.requiredDocsError': 'You must attach NOA and FAL1 documents to create the arrival notification',
        'documents.noaPdfError': 'The NOA document must be a PDF file',
        'documents.noaSizeError': 'The NOA document must not exceed 10MB',
        'documents.fal1PdfError': 'The FAL1 document must be a PDF file',
        'documents.fal1SizeError': 'The FAL1 document must not exceed 10MB',
        
        // Common
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.submit': 'Submit',
        'common.back': 'Back',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.actions': 'Actions',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success',
        'common.yes': 'Yes',
        'common.no': 'No',
        'common.user': 'User',
        'common.required': 'Required',
        
        // Titles
        'app.title': 'Single Window for Maritime Transport',
        'app.subtitle': 'Honduras Merchant Marine',
        'app.vesselInfo': 'Vessel Information',
        'app.vesselData': 'Vessel identification data',
        'app.routePorts': 'Route and Ports',
        'app.routeInfo': 'Information about origin and destination',
        'app.arrivalDateTime': 'Date and Time of Arrival',
        'app.arrivalEstimate': 'Estimated arrival at port',
        'app.requiredDocs': 'Required Documents',
        'app.requiredDocsInfo': 'Attach the required documents for the arrival notification',
        
        // Dashboard
        'dashboard.welcome': 'Welcome',
        'dashboard.agentPanel': 'Shipping Agent Dashboard',
        'dashboard.authorityPanel': 'Authority Dashboard',
        'dashboard.totalArrivals': 'Total Arrivals',
        'dashboard.registeredByYou': 'Registered by you',
        'dashboard.inYourPort': 'In your port',
        'dashboard.inSystem': 'In the system',
        'dashboard.pendingApproval': 'Awaiting approval',
        'dashboard.readyForZarpe': 'Ready for departure',
        'dashboard.uploadedFiles': 'Uploaded files',
        'dashboard.recentArrivals': 'Recent Arrivals',
        'dashboard.yourNotifications': 'Your recent arrival notifications',
        'dashboard.notificationsInPort': 'Recent notifications in',
        'dashboard.systemNotifications': 'Recent notifications in the system',
        'dashboard.noArrivals': 'No arrivals registered',
        'dashboard.createFirst': 'Create your first arrival notification',
        'dashboard.eta': 'ETA',
        
        // Arrivals List Page
        'arrivalsList.manageNotifications': 'Manage your arrival notifications',
        'arrivalsList.reviewNotifications': 'Review and approve arrival notifications',
        'arrivalsList.arrivalsList': 'Arrivals List',
        'arrivalsList.recordsFound': 'records found',
        'arrivalsList.noArrivals': 'No arrivals registered',
        'arrivalsList.createFirst': 'Create your first arrival notification',
        'arrivalsList.flag': 'Flag:',
        
        // Documents Page
        'docs.yourDocuments': 'Documents attached to your arrival notifications',
        'docs.systemDocuments': 'System documents for review and approval',
        'docs.documentList': 'Documents List',
        'docs.documentsFound': 'documents found',
        'docs.noDocuments': 'No documents',
        'docs.appearHere': 'Documents appear here when attached to an arrival',
        
        // Status List
        'statusList.draft': 'Draft',
        'statusList.submitted': 'Submitted',
        'statusList.approvedByCaptain': 'Approved by Captain',
        'statusList.docsComplete': 'Docs Complete',
        'statusList.readyForZarpe': 'Ready for Departure',
        'statusList.zarpeApproved': 'Departure Approved',
        'statusList.completed': 'Completed',
        
        // Zarpe Print
        'zarpe.vesselName': 'Ship Name',
        'zarpe.omiNumber': 'IMO Number',
        'zarpe.flag': 'Flag',
        'zarpe.length': 'Length (m)',
        'zarpe.gt': 'Gross Tonnage (GT)',
        'zarpe.type': 'Type',
        'zarpe.captainName': "Captain's Name",
        'zarpe.passport': 'Passport',
        'zarpe.nationality': 'Nationality',
        'zarpe.departurePort': 'Departure Port',
        'zarpe.voyageNumber': 'Voyage Number',
        'zarpe.destinationPort': 'Destination Port',
        'zarpe.departureDate': 'Departure Date',
        'zarpe.departureTime': 'Departure Time',
        'zarpe.provenance': 'Provenance',
        'zarpe.crew': 'Crew',
        'zarpe.passengers': 'Passengers',
        'zarpe.cargo': 'Cargo on Board',
        'zarpe.shippingAgent': 'Shipping Agent',
        'zarpe.cimOperator': 'CIM Operator',
        'zarpe.observations': 'Observations',
        'zarpe.cimPreApproval': 'CIM Pre-Approval',
        'zarpe.portCaptain': 'Port Captain',
        'zarpe.cimOfficial': 'CIM Official',
        'zarpe.authenticity': 'Authenticity Verification',
        'zarpe.scanQR': 'Scan QR code to verify',
        'zarpe.zarpeNo': 'Departure Permit No.',
        'zarpe.issued': 'Issued',
        'zarpe.approved': 'Approved',
        'zarpe.vesselData': 'Vessel Data',
        'zarpe.captainData': 'Captain Data',
        'zarpe.voyageData': 'Voyage Data',
        'zarpe.otherData': 'Other Data',
        'zarpe.republic': 'REPUBLIC OF HONDURAS',
        'zarpe.maritime': 'General Directorate of Merchant Marine',
        'zarpe.zarpeTitle': 'PORT DEPARTURE',
        'zarpe.generatedBy': 'Generated by VUTMHN',
        'zarpe.validWithQR': 'This document is valid only with QR verification code',
        'zarpe.noCargo': 'No cargo',
        
        // Statistics
        'stats.title': 'System Statistics',
        'stats.systemOverview': 'Overview of all ports',
        'stats.portData': 'Data from',
        'stats.totalArrivals': 'Total Arrivals',
        'stats.registered': 'Registered in the system',
        'stats.pending': 'Pending',
        'stats.awaitingApproval': 'Awaiting approval',
        'stats.issuedZarpes': 'Issued Zarpes',
        'stats.approvedSigned': 'Approved and signed',
        'stats.documents': 'Documents',
        'stats.totalProcessed': 'Total processed',
        'stats.activeAgents': 'Active Shipping Agents',
        'stats.last30Days': 'Last 30 days',
        'stats.arrivalsByMonth': 'Arrivals by Month',
        'stats.last6Months': 'Trend of the last 6 months',
        'stats.arrivalsByPort': 'Arrivals by Port',
        'stats.distributionByPort': 'Distribution by destination port',
        'stats.documentsByType': 'Documents by Type',
        'stats.docsProcessed': 'Number of documents processed',
        'stats.arrivalStatus': 'Arrival Status',
        'stats.distributionByStatus': 'Distribution by current status',
        
        // New Statistics
        'stats.mostActivePort': 'Most Active Port',
        'stats.mostActiveAgent': 'Most Active Shipping Agent',
        'stats.vesselsByPort': 'Number of Vessels by Port',
        'stats.vesselsByStatus': 'Vessels by Activity',
        'stats.topVesselTypes': 'Top Vessel Types',
        'stats.topFlags': 'Top Flags',
        'stats.zarpeStats': 'Zarpe Statistics',
        'stats.avgCrew': 'Average Crew',
        'stats.avgPassengers': 'Average Passengers',
        'stats.documentCompliance': 'Document Compliance',
        'stats.pendingZarpes': 'Pending Zarpes',
        'stats.completedZarpes': 'Completed Zarpes',
        
        // Users Management
        'users.title': 'User Management',
        'users.description': 'Manage system users, roles, and access permissions',
        'users.newUser': 'New User',
        'users.editUser': 'Edit User',
        'users.deleteUser': 'Delete User',
        'users.deleteConfirm': 'Are you sure you want to delete this user?',
        'users.deleteWarning': 'This action cannot be undone and will immediately revoke user access.',
        'users.name': 'Full Name',
        'users.email': 'Email Address',
        'users.role': 'Role / Position',
        'users.port': 'Assigned Port',
        'users.company': 'Company / Shipping Agency',
        'users.password': 'Password',
        'users.passwordHelp': 'Leave blank to keep current password',
        'users.actions': 'Actions',
        'users.noUsers': 'No users found',
        'users.searchPlaceholder': 'Search by name or email...',
        'users.allRoles': 'All roles',
        'users.allPorts': 'All ports',
        'users.successCreate': 'User created successfully',
        'users.successUpdate': 'User updated successfully',
        'users.successDelete': 'User deleted successfully',
        'users.companyPlaceholder': 'Shipping agency name',
        'users.selectPort': 'Select assigned port',
        'users.selectRole': 'Select a role',
      }
    }
    
    return translations[language][key] || key
  }, [language])

  if (!isInitialized) {
    return null
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = React.useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

