

import type { UrgencyInfo } from "@/lib/date-utils";

export type CustomerRole = 'lector' | 'colaborador' | 'administrador_cliente';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'customer';
}

export interface NotificationPreferences {
  deadline_urgent: { email: boolean };
  deadline_proximate: { email: boolean };
  deadline_last_day: { email: boolean };
}

export interface UserProfile {
  uid: string; // Firebase UID
  role: 'admin' | 'customer';
  customer_id?: string | null;
  customer_role?: CustomerRole | null;
  displayName: string;
  email: string;
  photo_url?: string; // gs:// path
  photo_signed_url?: string; // temporary public URL
  notification_preferences?: NotificationPreferences;
  terms_accepted_at?: string | null; // ISO 8601 string
}

export interface UserManagementProfile extends UserProfile {
    created_at: string;
    role: 'admin' | 'customer';
    customer_id?: string | null;
    customer_role?: CustomerRole | null;
}

export interface Customer {
  id: string;
  name: string;
  profileInfo: string; // For AI: industry, size, history
  logoUrl?: string; // gs:// URI
  logo_signed_url?: string | null; // Temporary public URL for viewing
  is_archived?: boolean;
}

export interface RequiredDocument {
  name: string;
  description: string;
  requires_signature?: boolean;
}

export interface ImportantDate {
  date: Date | string;
  label: string;
}

export interface IaRequiredDocument {
  document_name: string;
  requirement_details: string;
  requires_signature: boolean;
}

export interface BudgetItem {
  item: string;
  description?: string;
  quantity: number;
  unit_cost_suggestion?: number;
  total_cost_suggestion?: number;
  notes?: string;
}

export interface WBSNode {
  id: string;
  task_name: string;
  deliverable: string;
  budget_items: BudgetItem[];
  sub_tasks: WBSNode[];
}

export interface WBS {
  id: string;
  status: string;
  generated_at: string;
  data: WBSNode[];
}

export interface WbsCandidateDocument {
  id: number;
  filename: string;
  category: string;
}

export interface Observation {
  type: 'Jurídica' | 'Técnica' | 'Financiera';
  reference: string;
  finding: string;
  question_draft: string;
}

export interface ObservationsResult {
  observation_id: number;
  opportunity_id: number;
  generated_at: string;
  observations_count: number;
  observations: Observation[];
}

export interface QualifyingRequirements {
  financial_indicators: string[];
  organizational_capacity: string[];
  required_experience: string[];
}

// Nuevo tipo para los resultados del análisis de una adenda
export interface AdendaAnalysisResults {
  summary_of_changes: string;
  modified_dates: {
    original_label: string;
    new_date: string; // ISO Date String
    reason?: string;
  }[];
  modified_technical_requirements: {
    section_reference: string;
    summary_of_change: string;
  }[];
  new_required_documents: {
    document_name: string;
    requirement_details: string;
    requires_signature?: boolean;
  }[];
  modified_required_documents: {
    document_name: string;
    summary_of_change: string;
  }[];
}

// Nuevo tipo principal para el análisis de adenda
export interface AdendaAnalysis {
  id: number;
  opportunity_id: number;
  adenda_document_id: number;
  analysis_results: AdendaAnalysisResults;
  status: 'new' | 'reviewed';
  created_at: string; // ISO Date String
}


export interface Opportunity {
  id:string;
  customer_id: string;
  customerId?: string; // Added for consistency in sidebar
  name: string;
  title: string;
  description:string;
  deadline?: Date;
  status: string; 
  required_documents: RequiredDocument[];
  important_dates?: ImportantDate[];
  amount?: number | null;
  execution_period?: string;
  urgencyInfo?: UrgencyInfo | null; // For sidebar status
  timeRemaining?: {
      days: number | null;
      hours: number | null;
  };
  urgency?: 'overdue' | 'urgent' | 'upcoming' | 'normal';
  ia_analysis?: {
    analysis_status: 'pending_upload' | 'pending_analysis' | 'pending' | 'in_progress' | 'completed' | 'failed' | 'error';
    analysis_progress?: number | null;
    analysis_step?: string | null;
    error_message?: string;
    analysis_error_message?: string;
    technical_summary?: string;
    key_deliverables?: string[];
    required_documents_checklist?: IaRequiredDocument[];
    qualifying_requirements?: QualifyingRequirements;
  };
  work_breakdown_structure?: WBS;
  has_unread_adenda_analysis?: boolean; // Flag para una comprobación rápida
  is_archived?: boolean;
}

export interface OpportunityStatusInfo {
  all_statuses: string[];
  active_statuses: string[];
  default_status: string;
}

export interface DocumentItem {
  id: string;
  kind?: 'OpportunityDocuments' | 'CustomerGeneralDocuments';
  opportunityId?: string;
  name: string; 
  description: string;
  status: 'pending' | 'uploaded' | 'approved' | 'rejected';
  fileUrl?: string; // gs:// URI from backend
  signed_url?: string; // Signed URL for viewing/downloading
  fileName?: string; // This will hold the 'filename' from the backend
  document_type?: string; 
  expected_type_label?: string; // This is the field to match against requirement name
  uploadedAt?: Date;
  uploadedBy?: string; // User ID
  is_tender_document?: boolean;
  tender_document_category?: string;
  document_status?: 'template' | 'signed';
  is_active?: boolean;
}

export interface CustomerDocument {
  id: string;
  kind?: string;
  customerId: string;
  category: 'experience' | 'rup' | 'financial_statements' | 'other' | 'branding';
  name: string;
  description: string;
  status: 'pending' | 'uploaded' | 'verified';
  fileUrl?: string;
  signedUrl?: string;
  fileName?: string;
  filename?: string;
  uploadedAt?: Date;
  financial_extraction_status?: 'queued' | 'processing' | 'completed' | 'failed' | null;
  extracted_contract_data?: string | CertificationExtractedData | null;
  extraction_progress?: number | null;
  extraction_step?: string | null;
  extraction_started_at?: Date | null;
  extraction_updated_at?: Date | null;
  extraction_error?: string | null;
  financial_profile_id?: number | null;
}

export interface FinancialIndicators {
  liquidez?: number | null;
  endeudamiento?: number | null;
  razon_cobertura_intereses?: number | null;
  rentabilidad_patrimonio?: number | null;
  rentabilidad_activo?: number | null;
  capital_de_trabajo?: number | null;
}

export interface BalanceSummary {
  activo_corriente?: number | null;
  activo_total?: number | null;
  pasivo_corriente?: number | null;
  pasivo_total?: number | null;
  patrimonio?: number | null;
  utilidad_neta?: number | null;
}

export interface ExperienceSector {
  unspsc_code?: string | null;
  sector_description: string;
  total_contracts: number;
  total_value_cop?: number | null;
  largest_single_contract_cop?: number | null;
}

export interface CustomerFinancialProfile {
  id: number;
  source_type: 'rup' | 'financial_statements';
  fiscal_year: number | null;
  is_current: boolean;
  rup_renewal_date?: string | null;
  extracted_at: string;
  financial_indicators: FinancialIndicators;
  balance_summary: BalanceSummary;
  experience_by_sector: ExperienceSector[];
  k_contratacion?: number | null;
  capacidad_residual?: number | null;
  source_document_id?: number | null;
}

export interface CustomerFinancialProfileResponse {
  rup: CustomerFinancialProfile | null;
  financial_statements: CustomerFinancialProfile | null;
  history: CustomerFinancialProfile[];
}

export interface CertificationExtractedData {
  contracting_entity?: string | null;
  contract_object?: string | null;
  contract_value_cop?: number | null;
  contract_value_smmlv?: number | null;
  execution_start?: string | null;
  execution_end?: string | null;
  satisfactory_completion?: boolean | null;
  sector_keywords?: string[];
}

export interface RupContractCertification {
  id: number;
  name: string;
  filename: string;
  extracted_contract_data?: CertificationExtractedData | null;
}

export interface RupContract {
  id: number;
  rup_consecutive: number;
  contracting_entity: string;
  contract_value_smmlv?: number | null;
  contract_value_cop?: number | null;
  unspsc_codes: string[];
  fiscal_year?: number | null;
  certification_doc_id?: number | null;
  certification?: RupContractCertification | null;
}

export interface RupContractsResponse {
  contracts: RupContract[];
  total: number;
}

export interface ProposalDocument {
  id: string;
  opportunity_id: string;
  parent_document_id: string | null;
  filename: string;
  version_label: string;
  is_latest_version: boolean;
  uploaded_by: string; // user uid
  uploaded_by_display_name: string;
  uploaded_at: string; // ISO 8601 string
  status: string;
  description?: string;
  file_url: string; // gs:// uri
  signed_url: string; // temporary public url
}

export interface ProposalDocumentStatusInfo {
  all_statuses: string[];
  default_status: string;
}

export interface OpportunityComment {
  id: string;
  author_user_id: string; // Deprecated but kept for backward compatibility
  author_display_name: string; // Deprecated
  author_photo_url: string | null; // Deprecated
  author?: {
    uid: string;
    displayName: string;
    photo_signed_url: string | null;
  };
  comment_text: string;
  created_at: string; // ISO 8601 string
  replies: OpportunityComment[];
  is_deleted?: boolean;
}

export interface Notification {
  id: number;
  user_uid: string;
  message: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string; // ISO 8601 string
}

// --- Elegibility Analysis ---

export type EligibilityStatus = 'cumple' | 'no_cumple' | 'parcial' | 'sin_datos';

export interface FinancialIndicatorResult {
  requirement_text: string;
  indicator_name: string | null;
  threshold_description: string | null;
  client_value: number | null;
  fiscal_year_used: number | null;
  status: EligibilityStatus;
  gap_description: string | null;
  remediation_suggestion: string | null;
}

export interface FinancialEligibilityBlock {
  status: EligibilityStatus;
  indicators: FinancialIndicatorResult[];
}

export interface QualifyingExperience {
  source: 'rup_cert' | 'standalone_cert';
  certification_doc_id: number;
  rup_contract_id: number | null;
  rup_consecutive: number | null;
  contracting_entity: string | null;
  contract_object: string | null;
  value_smmlv: number | null;
  match_explanation: string;
}

export interface RupContractWithoutCert {
  rup_contract_id: number;
  rup_consecutive: number | null;
  contracting_entity: string;
  value_smmlv: number | null;
  potentially_qualifying_for: string[];
}

export interface ExperienceRequirementResult {
  requirement_text: string;
  status: EligibilityStatus;
  qualifying_experiences: QualifyingExperience[];
  gap_description: string | null;
  remediation_suggestion: string | null;
}

export interface ExperienceEligibilityBlock {
  status: EligibilityStatus;
  presupuesto_oficial_cop: number | null;
  presupuesto_oficial_smmlv: number | null;
  smmlv_anio: number | null;
  requirements: ExperienceRequirementResult[];
  rup_contracts_without_cert: RupContractWithoutCert[];
}

export interface EligibilityAnalysis {
  id: number;
  opportunity_id: number;
  customer_id: number;
  generated_at: string;
  overall_status: EligibilityStatus;
  financial_block: FinancialEligibilityBlock | null;
  experience_block: ExperienceEligibilityBlock | null;
}

export type NivelSuscripcion = 'esencial' | 'profesional' | 'experto';

export interface PlanConfig {
  nombre_visible: string;
  descripcion_corta?: string;
  precio_mensual_cop?: string;
  limites: {
    max_fuentes_secop_rss?: number;
    max_palabras_clave_positivas?: number;
    max_palabras_clave_negativas?: number;
    max_destinatarios_correo?: number;
    max_palabras_clave_doradas?: number;
    max_tipos_servicio_items?: number;
    max_ubicaciones_preferidas_items?: number;
    max_entidades_interes_items?: number;
    max_areas_fortaleza_colaboracion?: number;
  };
  features_habilitadas: {
    dashboard_oportunidades?: boolean;
    analisis_gemini_completo?: boolean;
    alertas_inmediatas_urgentes?: boolean;
    permite_fuentes_adicionales_no_secop?: boolean;
    filtrado_por_valor_configurable?: boolean;
    palabra_clave_dorada_config?: boolean;
    snooze_oportunidades?: boolean;
  };
}

export interface DescubreClienteProfile {
  nombre_empresa: string;
  nombre_persona_contacto?: string;
  cargo_persona_contacto?: string;
  email_contacto_principal?: string;
  nivel_suscripcion: NivelSuscripcion;
  tipos_servicio?: string[];
  palabras_clave_positivas?: string[];
  palabras_clave_negativas?: string[];
  palabras_clave_doradas?: string[];
  valor_minimo_interes?: number;
  ubicaciones_preferidas?: string[];
  entidades_interes?: string[];
  send_notifications?: string[];
  modalidades_preferidas?: string[];
  perfil_partnership?: {
    dispuesto_a_ser_partner: boolean;
    areas_fortaleza_partner: string[];
    descripcion_oferta_partner: string;
  };
  fecha_inicio_suscripcion?: string;
  fecha_proximo_pago?: string | null;
}

export interface FuenteSecop {
  id_fuente: string;
  url?: string;
  nombre_descriptivo_fuente: string;
}

export interface EstadoBidtoryInfo {
  code: string;
  message: string;
  sugerencias: string[];
}

export interface DescubreDashboardData {
  cliente: DescubreClienteProfile;
  plan_actual: PlanConfig;
  fuentes_suscritas: FuenteSecop[];
  fuentes_secop_disponibles_para_suscripcion: FuenteSecop[];
  categorias_colaboracion_disponibles: { id: string; nombre: string }[];
  tipos_documento_identificacion_disponibles: { id: string; nombre_visible: string }[];
  modalidades_secop_disponibles: {
    id: string;
    nombre_visible: string;
    descripcion_corta: string;
  }[];
  estado_bidtory_info: EstadoBidtoryInfo;
}
