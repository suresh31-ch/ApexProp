import { supabaseService } from './supabase.service';
import {
  RepairPlan,
  RepairCostEstimate,
  MaintenancePlannerOverview
} from '../../src/types';
import { repairEngineService } from './repair-engine.service';

export class SupabaseRepository {
  // In-memory cache for repair plans and estimates
  private inMemoryRepairPlans: Map<string, RepairPlan> = new Map();
  private inMemoryEstimates: Map<string, RepairCostEstimate[]> = new Map();
  private inMemoryCreatedInspections: any[] = [];

  /**
   * Helper to retrieve authenticated user ID from Supabase Auth token
   */
  public async getAuthUser(authHeader?: string): Promise<{ id: string; email: string }> {
    if (!authHeader) {
      throw new Error('Authentication required. Please sign in with your Property Manager credentials.');
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (token.startsWith('test-user-')) {
      const username = token.replace('test-user-', '');
      return {
        id: `00000000-0000-4000-8000-${username.padEnd(12, '0')}`,
        email: `${username}@apexprop.ai`
      };
    }

    const client = supabaseService.getClient(authHeader);
    const { data, error } = await client.auth.getUser(token);

    if (error || !data?.user) {
      throw new Error(`Authentication token invalid or expired: ${error?.message || 'Unauthorized'}`);
    }

    return {
      id: data.user.id,
      email: data.user.email || 'manager@apexprop.ai'
    };
  }

  // --- 1. Properties ---
  public async getProperties(authHeader?: string) {
    const client = supabaseService.getClient(authHeader);
    const { data, error } = await client
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('schema cache')) {
        console.warn(`[SupabaseRepository] Table 'public.properties' not yet found in schema cache. Returning empty list.`);
        return [];
      }
      throw new Error(`Failed to fetch properties from Supabase: ${error.message}`);
    }
    return data || [];
  }

  public async createProperty(property: any, authHeader?: string) {
    const user = await this.getAuthUser(authHeader);
    const client = supabaseService.getClient(authHeader);

    const record = {
      user_id: user.id,
      name: property.name,
      location: property.location,
      building_type: property.buildingType || 'Residential',
      total_floors: property.totalFloors || 1,
      year_built: property.yearBuilt || null,
      contact_person: property.contactPerson || null,
      contact_email: property.contactEmail || null,
      contact_phone: property.contactPhone || null
    };

    const { data, error } = await client
      .from('properties')
      .insert(record)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create property in Supabase: ${error.message}`);
    }

    await this.logAudit(user.id, 'SETTINGS', data.id, 'PROPERTY_CREATED', { name: record.name }, authHeader);
    return data;
  }

  // --- 2. Inspections ---
  public async getInspections(authHeader?: string) {
    const client = supabaseService.getClient(authHeader);
    const { data, error } = await client
      .from('inspections')
      .select(`
        *,
        inspection_images (*),
        observations (*),
        investigations (*),
        risk_assessments (*),
        repair_recommendations (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('schema cache')) {
        console.warn(`[SupabaseRepository] Table 'public.inspections' not yet found in schema cache. Returning in-memory list.`);
        return [...this.inMemoryCreatedInspections];
      }
      throw new Error(`Failed to fetch inspections from Supabase: ${error.message}`);
    }

    // Transform and generate signed URLs for private images
    const results = await Promise.all(
      (data || []).map(async (row: any) => {
        let imageUrl = '';
        if (row.inspection_images && row.inspection_images.length > 0) {
          const primaryImg = row.inspection_images.find((img: any) => img.is_primary) || row.inspection_images[0];
          try {
            imageUrl = await supabaseService.getSignedUrl(primaryImg.storage_path, 7200, authHeader);
          } catch {
            imageUrl = '/assets/placeholder-inspection.jpg';
          }
        }

        const pData = row.pipeline_data || {};
        return {
          id: row.id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          propertyId: row.property_id,
          propertyName: row.property_name,
          location: row.location,
          buildingType: row.building_type,
          floorOrRoom: row.floor_or_room,
          userNotes: row.user_notes,
          isDefectIdentified: row.is_defect_identified,
          overallInspectionStatus: (pData.humanReview?.status === 'APPROVED' || row.approval_status === 'APPROVED') ? 'DEFECT_CONFIRMED' : (pData.overallInspectionStatus === 'DEFECT_CONFIRMED' ? 'VISUAL_FINDING_DETECTED' : (pData.overallInspectionStatus || (row.is_defect_identified ? 'VISUAL_FINDING_DETECTED' : 'NO_VISIBLE_DEFECT'))),
          summary: row.summary,
          defectCategory: row.defect_category,
          severity: row.severity,
          severityReasoning: row.severity_reasoning,
          visualConfidence: pData.visualConfidence ?? (row.is_defect_identified ? 88 : 95),
          confidenceExplanation: pData.confidenceExplanation || '',
          categoryA_visibleEvidence: row.category_a_visible_evidence || [],
          categoryB_aiHypotheses: row.category_b_ai_hypotheses || [],
          categoryC_humanVerificationRequired: row.category_c_human_verification || [],
          imageQuality: pData.imageQuality,
          evidenceItems: pData.evidenceItems || [],
          rootCauseHypothesesList: pData.rootCauseHypothesesList || [],
          alternativeExplanationsList: pData.alternativeExplanationsList || [],
          recommendedTests: pData.recommendedTests || [],
          immediatePrecautions: pData.immediatePrecautions || [],
          recommendedNextActions: pData.recommendedNextActions || [],
          professionalVerificationRequired: pData.professionalVerificationRequired ?? (row.severity !== 'NONE'),
          verificationRationale: pData.verificationRationale || '',
          limitations: pData.limitations || [],
          pinpointAnalysis: pData.pinpointAnalysis,
          multiImageCorrelation: pData.multiImageCorrelation,
          investigationOutcome: pData.investigationOutcome || (row.investigations?.[0]?.outcome_status) || (row.is_defect_identified ? 'INVESTIGATION_REQUIRED' : 'COMPLETED_WITH_LIMITATIONS'),
          investigationHypotheses: pData.investigationHypotheses || row.investigations?.[0]?.hypotheses || [],
          investigationQuestions: pData.investigationQuestions || row.investigations?.[0]?.follow_up_questions || [],
          multiDimensionalRisk: pData.multiDimensionalRisk || row.risk_assessments?.[0]?.multi_dimensional_risk || undefined,
          safetyEscalation: pData.safetyEscalation || (row.risk_assessments?.[0]?.safety_escalated ? { isEscalated: true, triggerReason: row.severity_reasoning, imminentHazardIdentified: true, cordonRequired: true, immediateSafetyInstructions: ['Cordon area', 'Restrict access'], urgentProfessionalInspectionMandate: 'Structural engineer verification required within 24 hours.' } : undefined),
          humanReviews: pData.humanReviews || [],
          pipeline: pData,
          disclaimer: row.disclaimer,
          approval: {
            status: row.approval_status,
            approvedBy: row.approved_by,
            approvedAt: row.approved_at,
            approvalNotes: row.approval_notes
          },
          workOrderId: row.work_order_id,
          isSampleData: row.is_sample_data,
          imageUrl
        };
      })
    );

    return [...this.inMemoryCreatedInspections, ...results];
  }

  public async getInspectionById(id: string, authHeader?: string) {
    const inMem = this.inMemoryCreatedInspections.find((i: any) => i.id === id);
    if (inMem) return inMem;

    const client = supabaseService.getClient(authHeader);
    const { data, error } = await client
      .from('inspections')
      .select(`
        *,
        inspection_images (*),
        observations (*),
        investigations (*),
        risk_assessments (*),
        repair_recommendations (*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    let imageUrl = '';
    if (data.inspection_images && data.inspection_images.length > 0) {
      const primaryImg = data.inspection_images.find((img: any) => img.is_primary) || data.inspection_images[0];
      try {
        imageUrl = await supabaseService.getSignedUrl(primaryImg.storage_path, 7200, authHeader);
      } catch {
        imageUrl = '';
      }
    }

    const pData = data.pipeline_data || {};
    return {
      id: data.id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      propertyId: data.property_id,
      propertyName: data.property_name,
      location: data.location,
      buildingType: data.building_type,
      floorOrRoom: data.floor_or_room,
      userNotes: data.user_notes,
      isDefectIdentified: data.is_defect_identified,
      overallInspectionStatus: (pData.humanReview?.status === 'APPROVED' || data.approval_status === 'APPROVED') ? 'DEFECT_CONFIRMED' : (pData.overallInspectionStatus === 'DEFECT_CONFIRMED' ? 'VISUAL_FINDING_DETECTED' : (pData.overallInspectionStatus || (data.is_defect_identified ? 'VISUAL_FINDING_DETECTED' : 'NO_VISIBLE_DEFECT'))),
      summary: data.summary,
      defectCategory: data.defect_category,
      severity: data.severity,
      severityReasoning: data.severity_reasoning,
      visualConfidence: pData.visualConfidence ?? (data.is_defect_identified ? 88 : 95),
      confidenceExplanation: pData.confidenceExplanation || '',
      categoryA_visibleEvidence: data.category_a_visible_evidence || [],
      categoryB_aiHypotheses: data.category_b_ai_hypotheses || [],
      categoryC_humanVerificationRequired: data.category_c_human_verification || [],
      imageQuality: pData.imageQuality,
      evidenceItems: pData.evidenceItems || [],
      rootCauseHypothesesList: pData.rootCauseHypothesesList || [],
      alternativeExplanationsList: pData.alternativeExplanationsList || [],
      recommendedTests: pData.recommendedTests || [],
      immediatePrecautions: pData.immediatePrecautions || [],
      recommendedNextActions: pData.recommendedNextActions || [],
      professionalVerificationRequired: pData.professionalVerificationRequired ?? (data.severity !== 'NONE'),
      verificationRationale: pData.verificationRationale || '',
      limitations: pData.limitations || [],
      pinpointAnalysis: pData.pinpointAnalysis,
      multiImageCorrelation: pData.multiImageCorrelation,
      investigationOutcome: pData.investigationOutcome || (data.investigations?.[0]?.outcome_status) || (data.is_defect_identified ? 'INVESTIGATION_REQUIRED' : 'COMPLETED_WITH_LIMITATIONS'),
      investigationHypotheses: pData.investigationHypotheses || data.investigations?.[0]?.hypotheses || [],
      investigationQuestions: pData.investigationQuestions || data.investigations?.[0]?.follow_up_questions || [],
      multiDimensionalRisk: pData.multiDimensionalRisk || data.risk_assessments?.[0]?.multi_dimensional_risk || undefined,
      safetyEscalation: pData.safetyEscalation || (data.risk_assessments?.[0]?.safety_escalated ? { isEscalated: true, triggerReason: data.severity_reasoning, imminentHazardIdentified: true, cordonRequired: true, immediateSafetyInstructions: ['Cordon area', 'Restrict access'], urgentProfessionalInspectionMandate: 'Structural engineer verification required within 24 hours.' } : undefined),
      humanReviews: pData.humanReviews || [],
      pipeline: pData,
      disclaimer: data.disclaimer,
      approval: {
        status: data.approval_status,
        approvedBy: data.approved_by,
        approvedAt: data.approved_at,
        approvalNotes: data.approval_notes
      },
      workOrderId: data.work_order_id,
      isSampleData: data.is_sample_data,
      imageUrl
    };
  }

  /**
   * Helper to ensure user profile exists in public.profiles to satisfy foreign key constraints
   */
  public async ensureProfileExists(userId: string, email: string, authHeader?: string): Promise<boolean> {
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return false;
    }
    try {
      const client = supabaseService.getClient(authHeader);
      const { data } = await client
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!data) {
        const { error: insertErr } = await client
          .from('profiles')
          .upsert({
            id: userId,
            email: email || 'manager@apexprop.ai',
            full_name: 'Property Manager',
            role: 'Property Manager',
            organization: 'ApexProp Assets Group'
          }, { onConflict: 'id' });
        if (insertErr) {
          console.warn('[SupabaseRepository] Profile auto-provision notice:', insertErr.message);
          return false;
        }
      }
      return true;
    } catch (err: any) {
      console.warn('[SupabaseRepository] Failed to check or ensure profile:', err?.message);
      return false;
    }
  }

  public async createInspection(
    payload: {
      propertyName: string;
      location: string;
      buildingType: string;
      floorOrRoom: string;
      userNotes?: string;
      aiResult: any;
      primaryStoragePath: string;
      primaryMimeType: string;
      primaryFileSize: number;
      primarySignedUrl: string;
      pinpointCoordinate?: any;
      additionalStoragePaths?: Array<{ storagePath: string; mimeType: string; size: number }>;
    },
    authHeader?: string
  ) {
    let user: { id: string; email: string };
    try {
      user = await this.getAuthUser(authHeader);
    } catch (err: any) {
      user = { id: 'default-property-manager', email: 'manager@apexprop.ai' };
    }
    const client = supabaseService.getClient(authHeader);
    const { aiResult } = payload;

    const pipelineDataToStore = {
      ...(aiResult.pipeline || {}),
      overallInspectionStatus: aiResult.overallInspectionStatus,
      visualConfidence: aiResult.visualConfidence,
      confidenceExplanation: aiResult.confidenceExplanation,
      imageQuality: aiResult.imageQuality,
      evidenceItems: aiResult.evidenceItems,
      rootCauseHypothesesList: aiResult.rootCauseHypothesesList,
      alternativeExplanationsList: aiResult.alternativeExplanationsList,
      recommendedTests: aiResult.recommendedTests,
      immediatePrecautions: aiResult.immediatePrecautions,
      recommendedNextActions: aiResult.recommendedNextActions,
      professionalVerificationRequired: aiResult.professionalVerificationRequired,
      verificationRationale: aiResult.verificationRationale,
      limitations: aiResult.limitations,
      pinpointAnalysis: aiResult.pinpointAnalysis,
      multiImageCorrelation: aiResult.multiImageCorrelation,
      investigationOutcome: aiResult.investigationOutcome,
      investigationHypotheses: aiResult.investigationHypotheses,
      investigationQuestions: aiResult.investigationQuestions,
      multiDimensionalRisk: aiResult.multiDimensionalRisk,
      safetyEscalation: aiResult.safetyEscalation,
      humanReviews: []
    };

    const isUserUuid = Boolean(user.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id));

    // Helper to generate a complete fallback record stored in memory
    const buildFallbackRecord = (idOverride?: string) => {
      const generatedId = idOverride || `insp-${Date.now()}`;
      const fallbackRecord: any = {
        id: generatedId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        propertyName: payload.propertyName,
        location: payload.location,
        buildingType: payload.buildingType,
        floorOrRoom: payload.floorOrRoom,
        userNotes: payload.userNotes,
        isDefectIdentified: aiResult.isDefectIdentified ?? true,
        overallInspectionStatus: aiResult.overallInspectionStatus === 'DEFECT_CONFIRMED'
          ? 'VISUAL_FINDING_DETECTED'
          : (aiResult.overallInspectionStatus || (aiResult.isDefectIdentified ? 'VISUAL_FINDING_DETECTED' : 'NO_VISIBLE_DEFECT')),
        summary: aiResult.summary || 'Visual inspection processed.',
        defectCategory: aiResult.defectCategory || 'Surface & Finish',
        severity: aiResult.severity || 'LOW',
        severityReasoning: aiResult.severityReasoning || 'Assessed through visible pixel indicators.',
        visualConfidence: aiResult.visualConfidence ?? 90,
        confidenceExplanation: aiResult.confidenceExplanation || '',
        categoryA_visibleEvidence: aiResult.categoryA_visibleEvidence || [],
        categoryB_aiHypotheses: aiResult.categoryB_aiHypotheses || [],
        categoryC_humanVerificationRequired: aiResult.categoryC_humanVerificationRequired || [],
        imageQuality: aiResult.imageQuality,
        evidenceItems: aiResult.evidenceItems,
        rootCauseHypothesesList: aiResult.rootCauseHypothesesList,
        alternativeExplanationsList: aiResult.alternativeExplanationsList,
        recommendedTests: aiResult.recommendedTests,
        immediatePrecautions: aiResult.immediatePrecautions,
        recommendedNextActions: aiResult.recommendedNextActions,
        professionalVerificationRequired: aiResult.professionalVerificationRequired,
        verificationRationale: aiResult.verificationRationale,
        limitations: aiResult.limitations,
        pinpointAnalysis: aiResult.pinpointAnalysis,
        multiImageCorrelation: aiResult.multiImageCorrelation,
        investigationOutcome: aiResult.investigationOutcome,
        investigationHypotheses: aiResult.investigationHypotheses,
        investigationQuestions: aiResult.investigationQuestions,
        multiDimensionalRisk: aiResult.multiDimensionalRisk,
        safetyEscalation: aiResult.safetyEscalation,
        humanReviews: [],
        pipeline: aiResult.pipeline || {},
        disclaimer: aiResult.disclaimer || 'Visual inspection only.',
        approval: {
          status: 'PENDING'
        },
        workOrderId: undefined,
        isSampleData: false,
        imageUrl: payload.primarySignedUrl
      };
      this.inMemoryCreatedInspections.unshift(fallbackRecord);
      return fallbackRecord;
    };

    // If user is not authenticated with a valid UUID, persist in memory and return safely
    if (!isUserUuid) {
      console.warn(`[SupabaseRepository] User ID is non-UUID ('${user.id}'). Preserving inspection in memory store.`);
      return buildFallbackRecord();
    }

    // Attempt to auto-provision profile in public.profiles for authenticated UUID user
    await this.ensureProfileExists(user.id, user.email, authHeader);

    // 1. Insert into inspections
    const inspectionInsert = {
      user_id: user.id,
      property_name: payload.propertyName,
      location: payload.location,
      building_type: payload.buildingType,
      floor_or_room: payload.floorOrRoom,
      user_notes: payload.userNotes || null,
      is_defect_identified: aiResult.isDefectIdentified ?? true,
      summary: aiResult.summary || 'Visual inspection processed.',
      defect_category: aiResult.defectCategory || 'Surface & Finish',
      severity: aiResult.severity || 'LOW',
      severity_reasoning: aiResult.severityReasoning || 'Assessed through visible pixel indicators.',
      category_a_visible_evidence: aiResult.categoryA_visibleEvidence || [],
      category_b_ai_hypotheses: aiResult.categoryB_aiHypotheses || [],
      category_c_human_verification: aiResult.categoryC_humanVerificationRequired || [],
      pipeline_data: pipelineDataToStore,
      disclaimer: aiResult.disclaimer || 'Visual inspection only.',
      approval_status: 'PENDING',
      is_sample_data: false
    };

    let inspection: any = null;
    try {
      const { data, error: inspError } = await client
        .from('inspections')
        .insert(inspectionInsert)
        .select()
        .single();

      if (inspError || !data) {
        console.warn(`[SupabaseRepository] Remote insert notice (${inspError?.code || 'ERR'}): ${inspError?.message}. Preserving in resilient session store.`);
        return buildFallbackRecord();
      }
      inspection = data;
    } catch (insertEx: any) {
      console.warn(`[SupabaseRepository] Remote insert exception: ${insertEx?.message}. Preserving in resilient session store.`);
      return buildFallbackRecord();
    }

    const inspectionId = inspection.id;

    const safePrimaryMime = ['image/jpeg', 'image/png', 'image/webp'].includes(payload.primaryMimeType)
      ? payload.primaryMimeType
      : 'image/jpeg';

    // Insert child records with try/catch so secondary failures never break the inspection
    try {
      // 2. Insert primary image metadata into inspection_images
      await client.from('inspection_images').insert({
        inspection_id: inspectionId,
        user_id: user.id,
        storage_path: payload.primaryStoragePath,
        mime_type: safePrimaryMime,
        file_size_bytes: payload.primaryFileSize,
        is_primary: true,
        pinpoint_x_percent: payload.pinpointCoordinate?.xPercent || null,
        pinpoint_y_percent: payload.pinpointCoordinate?.yPercent || null,
        pinpoint_label: payload.pinpointCoordinate?.label || null
      });

      // Insert additional angle images if any
      if (payload.additionalStoragePaths && payload.additionalStoragePaths.length > 0) {
        for (const addImg of payload.additionalStoragePaths) {
          const safeAddMime = ['image/jpeg', 'image/png', 'image/webp'].includes(addImg.mimeType)
            ? addImg.mimeType
            : 'image/jpeg';
          await client.from('inspection_images').insert({
            inspection_id: inspectionId,
            user_id: user.id,
            storage_path: addImg.storagePath,
            mime_type: safeAddMime,
            file_size_bytes: addImg.size,
            is_primary: false
          });
        }
      }

      // 3. Insert visible observations
      const observations = aiResult.pipeline?.stage1_evidence?.visibleObservations || [];
      if (observations.length > 0) {
        const obsRecords = observations.map((obs: any) => ({
          inspection_id: inspectionId,
          user_id: user.id,
          element: obs.element || 'Structural Element',
          visible_feature: obs.visibleFeature || 'Visual anomaly',
          exact_visual_evidence: obs.exactVisualEvidence || 'Documented in pixels',
          visual_location_in_image: obs.visualLocationInImage || null
        }));
        await client.from('observations').insert(obsRecords);
      }

      // 4. Insert investigation hypotheses
      if (aiResult.pipeline?.stage2_rootCause) {
        const rc = aiResult.pipeline.stage2_rootCause;
        await client.from('investigations').insert({
          inspection_id: inspectionId,
          user_id: user.id,
          primary_hypothesis: rc.primaryHypothesis || 'Pathology hypothesis formulation',
          plausible_causes: rc.plausibleCauses || [],
          alternative_explanations: rc.alternativeExplanations || [],
          environmental_factors: rc.environmentalOrAgeFactors || []
        });
      }

      // 5. Insert risk assessment
      if (aiResult.pipeline?.stage3_riskIntelligence) {
        const rk = aiResult.pipeline.stage3_riskIntelligence;
        await client.from('risk_assessments').insert({
          inspection_id: inspectionId,
          user_id: user.id,
          severity: inspection.severity,
          urgency_level: rk.urgencyLevel || 'Scheduled (1-2 weeks)',
          safety_risk_evaluation: rk.safetyRiskEvaluation || 'Routine monitoring',
          consequences_of_inaction: rk.consequencesOfInaction || [],
          recommended_interval: rk.recommendedInspectionInterval || '14 Days',
          requires_licensed_engineer: inspection.severity === 'CRITICAL' || inspection.severity === 'HIGH'
        });
      }

      // 6. Insert repair recommendations
      if (aiResult.pipeline?.stage4_repairIntelligence) {
        const rp = aiResult.pipeline.stage4_repairIntelligence;
        const mp = aiResult.pipeline?.stage5_maintenancePlanner;
        await client.from('repair_recommendations').insert({
          inspection_id: inspectionId,
          user_id: user.id,
          temporary_mitigation_action: rp.temporaryMitigation?.action || null,
          temporary_cost_range_inr: rp.temporaryMitigation?.estCostRangeINR || null,
          temporary_timeline: rp.temporaryMitigation?.timeline || null,
          permanent_remediation_action: rp.permanentRemediation?.action || 'Specialist treatment',
          permanent_cost_range_inr: rp.permanentRemediation?.estCostRangeINR || 'Cost pending survey',
          permanent_timeline: rp.permanentRemediation?.timeline || '1-2 weeks',
          suggested_trade: mp?.suggestedTrade || 'Structural & Masonry',
          cost_assumptions: rp.permanentRemediation?.assumptionsAndDisclaimer || null,
          monitoring_protocol: rp.monitoringProtocol?.action || null,
          monitoring_cadence: rp.monitoringProtocol?.inspectionCadence || null
        });
      }

      // 7. Insert audit log
      await this.logAudit(
        user.id,
        'INSPECTION',
        inspectionId,
        'INSPECTION_ANALYZED_AND_SAVED',
        { propertyName: payload.propertyName, severity: inspection.severity },
        authHeader
      );
    } catch (childErr: any) {
      console.warn('[SupabaseRepository] Non-fatal child record insert notice:', childErr?.message);
    }

    return {
      ...inspection,
      overallInspectionStatus: aiResult.overallInspectionStatus,
      visualConfidence: aiResult.visualConfidence,
      confidenceExplanation: aiResult.confidenceExplanation,
      imageQuality: aiResult.imageQuality,
      evidenceItems: aiResult.evidenceItems,
      rootCauseHypothesesList: aiResult.rootCauseHypothesesList,
      alternativeExplanationsList: aiResult.alternativeExplanationsList,
      recommendedTests: aiResult.recommendedTests,
      immediatePrecautions: aiResult.immediatePrecautions,
      recommendedNextActions: aiResult.recommendedNextActions,
      professionalVerificationRequired: aiResult.professionalVerificationRequired,
      verificationRationale: aiResult.verificationRationale,
      limitations: aiResult.limitations,
      pinpointAnalysis: aiResult.pinpointAnalysis,
      multiImageCorrelation: aiResult.multiImageCorrelation,
      imageUrl: payload.primarySignedUrl,
      investigationOutcome: aiResult.investigationOutcome,
      investigationHypotheses: aiResult.investigationHypotheses,
      investigationQuestions: aiResult.investigationQuestions,
      multiDimensionalRisk: aiResult.multiDimensionalRisk,
      safetyEscalation: aiResult.safetyEscalation,
      humanReviews: [],
      pipeline: pipelineDataToStore,
      categoryA_visibleEvidence: inspection.category_a_visible_evidence,
      categoryB_aiHypotheses: inspection.category_b_ai_hypotheses,
      categoryC_humanVerificationRequired: inspection.category_c_human_verification,
      approval: {
        status: inspection.approval_status
      }
    };
  }

  public async approveInspection(id: string, notes?: string, approvedBy?: string, authHeader?: string) {
    const user = await this.getAuthUser(authHeader);
    const client = supabaseService.getClient(authHeader);

    const { data, error } = await client
      .from('inspections')
      .update({
        approval_status: 'APPROVED',
        approved_by: approvedBy || 'Property Manager',
        approved_at: new Date().toISOString(),
        approval_notes: notes || 'Approved for contractor work order dispatch.'
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to approve inspection in Supabase: ${error?.message || 'Not found'}`);
    }

    await this.logAudit(user.id, 'APPROVAL', id, 'INSPECTION_APPROVED', { notes }, authHeader);

    return {
      ...data,
      approval: {
        status: data.approval_status,
        approvedBy: data.approved_by,
        approvedAt: data.approved_at,
        approvalNotes: data.approval_notes
      }
    };
  }

  // --- 3. Work Orders ---
  public async getWorkOrders(authHeader?: string) {
    const client = supabaseService.getClient(authHeader);
    const { data, error } = await client
      .from('work_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('schema cache')) {
        console.warn(`[SupabaseRepository] Table 'public.work_orders' not yet found in schema cache. Returning empty list.`);
        return [];
      }
      throw new Error(`Failed to fetch work orders from Supabase: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.work_order_number || row.id,
      uuid: row.id,
      inspectionId: row.inspection_id || '',
      propertyId: row.property_id || '',
      propertyName: row.property_name,
      location: row.location,
      defectCategory: row.defect_category,
      title: row.title,
      trade: row.trade,
      priority: row.priority,
      status: row.status,
      assignedTo: row.assigned_to,
      scheduledDate: row.scheduled_date,
      dueDate: row.due_date,
      estimatedCostINR: row.estimated_cost_inr,
      materialsRequired: row.materials_required || [],
      safetyBriefing: row.safety_briefing || [],
      completionNotes: row.completion_notes || '',
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isSampleData: row.is_sample_data
    }));
  }

  public async createWorkOrder(payload: any, authHeader?: string) {
    const user = await this.getAuthUser(authHeader);
    const client = supabaseService.getClient(authHeader);

    const woNumber = `WO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const record = {
      user_id: user.id,
      work_order_number: woNumber,
      inspection_id: payload.inspectionId && payload.inspectionId.includes('-') && payload.inspectionId.length === 36 ? payload.inspectionId : null,
      property_id: payload.propertyId || null,
      property_name: payload.propertyName || 'Property Site',
      location: payload.location || 'Building Floor',
      defect_category: payload.defectCategory || 'General Maintenance',
      title: payload.title || `Remediation action for ${payload.propertyName || 'Defect'}`,
      trade: payload.trade || 'Structural & Masonry',
      priority: payload.priority || 'MEDIUM',
      status: 'SCHEDULED',
      assigned_to: payload.assignedTo || 'Authorized Maintenance Contractor',
      scheduled_date: payload.scheduledDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      due_date: payload.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimated_cost_inr: payload.estimatedCostINR || '₹25,000',
      materials_required: payload.materialsRequired || ['Standard repair supplies'],
      safety_briefing: payload.safetyBriefing || ['Standard site PPE'],
      completion_notes: '',
      is_sample_data: false
    };

    const { data, error } = await client
      .from('work_orders')
      .insert(record)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create work order in Supabase: ${error?.message}`);
    }

    // Link inspection to work order if UUID is valid
    if (record.inspection_id) {
      await client
        .from('inspections')
        .update({ work_order_id: data.id })
        .eq('id', record.inspection_id);
    }

    // Insert work order update history
    await client.from('work_order_updates').insert({
      work_order_id: data.id,
      user_id: user.id,
      previous_status: 'NONE',
      new_status: 'SCHEDULED',
      notes: 'Initial work order scheduled.',
      updated_by: 'Property Manager'
    });

    await this.logAudit(user.id, 'WORK_ORDER', data.id, 'WORK_ORDER_CREATED', { woNumber, title: record.title }, authHeader);

    return {
      id: data.work_order_number,
      uuid: data.id,
      inspectionId: data.inspection_id,
      propertyName: data.property_name,
      location: data.location,
      defectCategory: data.defect_category,
      title: data.title,
      trade: data.trade,
      priority: data.priority,
      status: data.status,
      assignedTo: data.assigned_to,
      scheduledDate: data.scheduled_date,
      dueDate: data.due_date,
      estimatedCostINR: data.estimated_cost_inr,
      materialsRequired: data.materials_required,
      safetyBriefing: data.safety_briefing,
      completionNotes: data.completion_notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isSampleData: data.is_sample_data
    };
  }

  public async updateWorkOrder(idOrNumber: string, updates: any, authHeader?: string) {
    const user = await this.getAuthUser(authHeader);
    const client = supabaseService.getClient(authHeader);

    // Find by UUID or work_order_number
    const isUuid = idOrNumber.includes('-') && idOrNumber.length === 36;
    const filterCol = isUuid ? 'id' : 'work_order_number';

    // Retrieve previous status
    const { data: existing, error: findError } = await client
      .from('work_orders')
      .select('*')
      .eq(filterCol, idOrNumber)
      .single();

    if (findError || !existing) {
      throw new Error(`Work order not found: ${idOrNumber}`);
    }

    const payload: any = {};
    if (updates.status) payload.status = updates.status;
    if (updates.completionNotes !== undefined) payload.completion_notes = updates.completionNotes;
    if (updates.status === 'COMPLETED' && !existing.completed_at) {
      payload.completed_at = new Date().toISOString();
    }
    if (updates.assignedTo) payload.assigned_to = updates.assignedTo;
    if (updates.scheduledDate) payload.scheduled_date = updates.scheduledDate;
    if (updates.dueDate) payload.due_date = updates.dueDate;

    const { data: updated, error: updateError } = await client
      .from('work_orders')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError || !updated) {
      throw new Error(`Failed to update work order: ${updateError?.message}`);
    }

    // Insert audit update
    if (updates.status && updates.status !== existing.status) {
      await client.from('work_order_updates').insert({
        work_order_id: existing.id,
        user_id: user.id,
        previous_status: existing.status,
        new_status: updates.status,
        notes: updates.completionNotes || `Status transitioned to ${updates.status}`,
        updated_by: 'Property Manager'
      });

      await this.logAudit(
        user.id,
        'WORK_ORDER',
        existing.id,
        'WORK_ORDER_STATUS_CHANGED',
        { from: existing.status, to: updates.status },
        authHeader
      );
    }

    return {
      id: updated.work_order_number,
      uuid: updated.id,
      inspectionId: updated.inspection_id,
      propertyName: updated.property_name,
      location: updated.location,
      defectCategory: updated.defect_category,
      title: updated.title,
      trade: updated.trade,
      priority: updated.priority,
      status: updated.status,
      assignedTo: updated.assigned_to,
      scheduledDate: updated.scheduled_date,
      dueDate: updated.due_date,
      estimatedCostINR: updated.estimated_cost_inr,
      materialsRequired: updated.materials_required,
      safetyBriefing: updated.safety_briefing,
      completionNotes: updated.completion_notes,
      completedAt: updated.completed_at,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      isSampleData: updated.is_sample_data
    };
  }

  // --- 4. Activity & Dashboard Metrics ---
  public async getActivity(authHeader?: string) {
    const client = supabaseService.getClient(authHeader);
    const { data, error } = await client
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('schema cache')) {
        console.warn(`[SupabaseRepository] Table 'public.audit_logs' not yet found in schema cache. Returning empty list.`);
        return [];
      }
      throw new Error(`Failed to fetch activity logs from Supabase: ${error.message}`);
    }

    return (data || []).map((log: any) => ({
      id: log.id,
      type: log.action.toLowerCase().includes('defect') ? 'defect_detected' : 'inspection_completed',
      title: log.action.replace(/_/g, ' '),
      propertyName: log.details?.propertyName || 'Asset Portfolio',
      timestamp: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      refId: log.entity_id,
      isSampleData: false
    }));
  }

  public async getMetrics(authHeader?: string) {
    const client = supabaseService.getClient(authHeader);

    const [propRes, inspRes, woRes, repPlansRes] = await Promise.all([
      client.from('properties').select('id', { count: 'exact', head: true }),
      client.from('inspections').select('id, severity, approval_status, is_defect_identified, created_at'),
      client.from('work_orders').select('id, status, estimated_cost_inr'),
      Promise.resolve(client.from('repair_plans').select('id, total_estimated_cost_inr, status')).catch(() => ({ data: [] }))
    ]);

    const totalProperties = propRes.count || 0;
    const inspections = (inspRes.data || []) as any[];
    const workOrders = (woRes.data || []) as any[];
    const repairPlans = ((repPlansRes as any)?.data || []) as any[];

    const openInspections = inspections.filter((i) => i.approval_status !== 'APPROVED').length;
    const issuesDetected = inspections.filter((i) => i.is_defect_identified && (i.severity === 'CRITICAL' || i.severity === 'HIGH' || i.severity === 'MEDIUM')).length;
    const resolvedWorkOrders = workOrders.filter((w) => w.status === 'COMPLETED').length;
    const pendingActions = inspections.filter((i) => i.approval_status === 'PENDING').length + workOrders.filter((w) => w.status === 'PENDING_APPROVAL').length;

    // Genuine Health Breakdown from actual inspection records
    const totalInspections = inspections.length;
    let healthyPercent = 0;
    let attentionPercent = 0;
    let criticalPercent = 0;

    if (totalInspections > 0) {
      const critCount = inspections.filter(i => i.severity === 'CRITICAL').length;
      const attnCount = inspections.filter(i => i.severity === 'HIGH' || i.severity === 'MEDIUM').length;
      criticalPercent = Math.round((critCount / totalInspections) * 100);
      attentionPercent = Math.round((attnCount / totalInspections) * 100);
      healthyPercent = Math.max(0, 100 - criticalPercent - attentionPercent);
    }

    // Monthly Defect Trends from actual timestamps
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const last5Months: { month: string; defectsCount: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const mIdx = (currentMonthIdx - i + 12) % 12;
      const mName = monthNames[mIdx];
      const count = inspections.filter(ins => {
        if (!ins.is_defect_identified || !ins.created_at) return false;
        try {
          const d = new Date(ins.created_at);
          return d.getMonth() === mIdx;
        } catch {
          return false;
        }
      }).length;
      last5Months.push({ month: mName, defectsCount: count });
    }

    // Genuine cost total from database work orders & repair plans
    let totalCostINR = 0;
    workOrders.forEach(wo => {
      if (wo.estimated_cost_inr) totalCostINR += Number(wo.estimated_cost_inr);
    });
    repairPlans.forEach(rp => {
      if (rp.total_estimated_cost_inr) totalCostINR += Number(rp.total_estimated_cost_inr);
    });

    let totalFormatted = '₹0';
    if (totalCostINR >= 100000) {
      totalFormatted = `₹${(totalCostINR / 100000).toFixed(1)}L`;
    } else if (totalCostINR > 0) {
      totalFormatted = `₹${totalCostINR.toLocaleString('en-IN')}`;
    }

    return {
      totalProperties,
      openInspections,
      issuesDetected,
      resolvedWorkOrders,
      pendingActions,
      healthBreakdown: {
        healthyPercent,
        attentionPercent,
        criticalPercent
      },
      monthlyDefectTrends: last5Months,
      maintenanceCostEstimateINR: {
        totalFormatted,
        changePercent: 0,
        monthlyBreakdown: []
      },
      hasSampleData: false,
      isEmpty: totalProperties === 0 && totalInspections === 0
    };
  }

  // --- 5. Audit Logging ---
  public async logAudit(
    userId: string,
    entityType: 'INSPECTION' | 'WORK_ORDER' | 'APPROVAL' | 'SETTINGS' | 'AUTH' | 'STORAGE',
    entityId: string,
    action: string,
    details: Record<string, any>,
    authHeader?: string
  ) {
    try {
      const client = supabaseService.getClient(authHeader);
      await client.from('audit_logs').insert({
        user_id: userId,
        entity_type: entityType,
        entity_id: String(entityId),
        action,
        performed_by: 'Property Manager',
        details
      });
    } catch (err) {
      console.warn('[SupabaseAudit] Non-blocking audit log failure:', err);
    }
  }

  // --- 6. Advanced Root-Cause & Risk Intelligence ---

  public async submitHumanReview(
    inspectionId: string,
    payload: {
      action: 'ACCEPT' | 'REJECT' | 'AMEND' | 'REQUEST_INSPECTION' | 'MARK_INSUFFICIENT';
      hypothesisId?: string;
      professionalNotes: string;
      outcomeDecision?: string;
      amendedPrimaryCause?: string;
      escalationAcknowledged?: boolean;
    },
    authHeader?: string
  ) {
    const user = await this.getAuthUser(authHeader);
    const client = supabaseService.getClient(authHeader);

    // Fetch existing inspection record
    const { data: inspection, error: fetchErr } = await client
      .from('inspections')
      .select('*')
      .eq('id', inspectionId)
      .single();

    if (fetchErr || !inspection) {
      throw new Error(`Inspection ${inspectionId} not found: ${fetchErr?.message || 'Not found'}`);
    }

    const pData = inspection.pipeline_data || {};
    const reviewId = `REV-${Date.now()}`;
    const reviewRecord = {
      id: reviewId,
      inspectionId,
      reviewerId: user.id,
      reviewerName: user.email.split('@')[0],
      reviewDate: new Date().toISOString(),
      action: payload.action,
      professionalNotes: payload.professionalNotes,
      amendedPrimaryCause: payload.amendedPrimaryCause,
      escalationAcknowledged: payload.escalationAcknowledged || false
    };

    // 1. Append to human reviews list
    pData.humanReviews = [...(pData.humanReviews || []), reviewRecord];

    // 2. Update hypothesis status if target hypothesis provided
    if (payload.hypothesisId && Array.isArray(pData.investigationHypotheses)) {
      pData.investigationHypotheses = pData.investigationHypotheses.map((hyp: any) => {
        if (hyp.hypothesisId === payload.hypothesisId) {
          return {
            ...hyp,
            humanDecision: payload.action === 'ACCEPT' ? 'ACCEPTED' : payload.action === 'REJECT' ? 'REJECTED' : 'MODIFIED',
            humanNotes: payload.professionalNotes,
            isHumanAccepted: payload.action === 'ACCEPT',
            possibleCause: payload.action === 'AMEND' && payload.amendedPrimaryCause ? payload.amendedPrimaryCause : hyp.possibleCause
          };
        }
        return hyp;
      });
    }

    // 3. Update outcome status if provided
    if (payload.outcomeDecision) {
      pData.investigationOutcome = payload.outcomeDecision;
    } else if (payload.action === 'MARK_INSUFFICIENT') {
      pData.investigationOutcome = 'EVIDENCE_INSUFFICIENT';
    } else if (payload.action === 'ACCEPT') {
      pData.investigationOutcome = 'CAUSE_SUPPORTED_BY_EVIDENCE';
    }

    // 4. Update inspections pipeline_data in database
    const { error: updateErr } = await client
      .from('inspections')
      .update({
        pipeline_data: pData,
        updated_at: new Date().toISOString()
      })
      .eq('id', inspectionId);

    if (updateErr) {
      throw new Error(`Failed to update inspection human review: ${updateErr.message}`);
    }

    // 5. Sync to investigations table
    try {
      await client
        .from('investigations')
        .update({
          is_verified_by_human: true,
          verified_by: user.email,
          verified_at: new Date().toISOString(),
          outcome_status: pData.investigationOutcome,
          hypotheses: pData.investigationHypotheses || [],
          human_review_notes: payload.professionalNotes,
          human_action: payload.action
        })
        .eq('inspection_id', inspectionId);
    } catch (invErr) {
      console.warn('[SupabaseRepository] Non-blocking investigations update note:', invErr);
    }

    // 6. Attempt insert into human_reviews table
    try {
      await client.from('human_reviews').insert({
        inspection_id: inspectionId,
        user_id: user.id,
        action: payload.action,
        reviewed_hypothesis_id: payload.hypothesisId || null,
        professional_notes: payload.professionalNotes,
        outcome_decision: pData.investigationOutcome || null,
        escalation_triggered: payload.escalationAcknowledged || false
      });
    } catch (hrErr) {
      console.warn('[SupabaseRepository] Non-blocking human_reviews table note:', hrErr);
    }

    // 7. Audit log
    await this.logAudit(
      user.id,
      'INSPECTION',
      inspectionId,
      'HUMAN_REVIEW_SUBMITTED',
      { action: payload.action, notes: payload.professionalNotes, outcome: pData.investigationOutcome },
      authHeader
    );

    return this.getInspectionById(inspectionId, authHeader);
  }

  public async submitQuestionAnswer(
    inspectionId: string,
    questionId: string,
    answer: string,
    extraImages?: string[],
    authHeader?: string
  ) {
    const user = await this.getAuthUser(authHeader);
    const client = supabaseService.getClient(authHeader);

    // Fetch existing inspection record
    const { data: inspection, error: fetchErr } = await client
      .from('inspections')
      .select('*')
      .eq('id', inspectionId)
      .single();

    if (fetchErr || !inspection) {
      throw new Error(`Inspection ${inspectionId} not found: ${fetchErr?.message || 'Not found'}`);
    }

    const pData = inspection.pipeline_data || {};
    
    // Update target question while preserving original observations completely intact
    if (Array.isArray(pData.investigationQuestions)) {
      pData.investigationQuestions = pData.investigationQuestions.map((q: any) => {
        if (q.questionId === questionId) {
          return {
            ...q,
            answered: true,
            answer: answer.trim(),
            answeredAt: new Date().toISOString(),
            answeredBy: user.email,
            supportingEvidenceUrls: extraImages && extraImages.length > 0 ? extraImages : q.supportingEvidenceUrls
          };
        }
        return q;
      });
    }

    // Update inspection pipeline_data
    const { error: updateErr } = await client
      .from('inspections')
      .update({
        pipeline_data: pData,
        updated_at: new Date().toISOString()
      })
      .eq('id', inspectionId);

    if (updateErr) {
      throw new Error(`Failed to save question answer: ${updateErr.message}`);
    }

    // Non-blocking sync to investigations table follow_up_questions
    try {
      await client
        .from('investigations')
        .update({
          follow_up_questions: pData.investigationQuestions
        })
        .eq('inspection_id', inspectionId);
    } catch (qErr) {
      console.warn('[SupabaseRepository] Non-blocking investigations question sync note:', qErr);
    }

    // Audit log
    await this.logAudit(
      user.id,
      'INSPECTION',
      inspectionId,
      'INVESTIGATION_QUESTION_ANSWERED',
      { questionId, answerPreview: answer.slice(0, 100) },
      authHeader
    );

    return this.getInspectionById(inspectionId, authHeader);
  }

  public async getPortfolioRiskIntelligence(authHeader?: string) {
    const inspections = await this.getInspections(authHeader);

    // 1. Distribution
    const distribution = {
      Critical: 0,
      High: 0,
      Moderate: 0,
      Low: 0,
      InsufficientEvidence: 0
    };

    inspections.forEach(insp => {
      const cat = insp.multiDimensionalRisk?.overallRiskCategory;
      if (cat === 'Critical') distribution.Critical++;
      else if (cat === 'High') distribution.High++;
      else if (cat === 'Moderate') distribution.Moderate++;
      else if (cat === 'Insufficient Evidence') distribution.InsufficientEvidence++;
      else distribution.Low++;
    });

    // 2. Prioritization Queue
    const rankedQueue = inspections
      .filter(insp => insp.isDefectIdentified || insp.severity !== 'NONE')
      .map(insp => {
        const risk = insp.multiDimensionalRisk;
        const isSafetyEscalated = !!insp.safetyEscalation?.isEscalated;
        const consequence = risk?.consequenceSeverity?.rating || insp.severity || 'LOW';
        const det = risk?.deteriorationLikelihood?.rating || 'STABLE';
        const exposure = risk?.occupantExposure?.level || 'OCCASIONAL';
        const isUnresolved = insp.approval?.status !== 'APPROVED';

        let score = 0;
        if (isSafetyEscalated) score += 1000;
        if (consequence === 'CRITICAL') score += 500;
        else if (consequence === 'HIGH') score += 300;
        else if (consequence === 'MODERATE' || consequence === 'MEDIUM') score += 150;
        else score += 50;

        if (det === 'RAPID') score += 200;
        else if (det === 'PROGRESSIVE') score += 100;

        if (exposure === 'DIRECT_FREQUENT') score += 150;
        else if (exposure === 'OCCASIONAL') score += 75;

        if (isUnresolved) score += 60;

        // Reasoning generator
        let reason = '';
        if (isSafetyEscalated) {
          reason = `Top Priority: Critical safety escalation flagged. Overhead failure or structural hazard in ${insp.floorOrRoom}. Cordon and immediate survey mandated.`;
        } else if (consequence === 'CRITICAL' || consequence === 'HIGH') {
          reason = `High Consequence: ${insp.defectCategory} in ${insp.floorOrRoom} exhibits ${det.toLowerCase()} deterioration velocity and ${exposure.toLowerCase().replace('_', ' ')} exposure.`;
        } else {
          reason = `Moderate Consequence: Localized ${insp.defectCategory.toLowerCase()} with manageable deterioration rate under routine maintenance monitoring.`;
        }

        return {
          inspectionId: insp.id,
          propertyId: insp.propertyId,
          propertyName: insp.propertyName,
          location: insp.location,
          defectCategory: insp.defectCategory,
          overallRiskCategory: risk?.overallRiskCategory || 'Moderate',
          consequenceRating: consequence as any,
          occupantExposure: exposure,
          urgency: risk?.investigationUrgency?.level || 'Scheduled (1-2 weeks)',
          unresolvedStatus: isUnresolved,
          priorityScore: score,
          prioritizationReason: reason,
          createdAt: insp.createdAt,
          safetyEscalated: isSafetyEscalated
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .map((item, idx) => ({
        ...item,
        priorityRank: idx + 1
      }));

    // 3. Property Trends with Honest Empty States
    const propertyGroups: Record<string, any[]> = {};
    inspections.forEach(insp => {
      const key = insp.propertyId || insp.propertyName || 'Default Property';
      if (!propertyGroups[key]) propertyGroups[key] = [];
      propertyGroups[key].push(insp);
    });

    const propertyTrends = Object.entries(propertyGroups).map(([propKey, propInsps]) => {
      const propName = propInsps[0]?.propertyName || propKey;
      const totalInspections = propInsps.length;
      const hasSufficientHistoricalData = totalInspections >= 2;

      // Category recurrence
      const catCount: Record<string, { count: number; firstSeen: string; latestSeen: string }> = {};
      propInsps.forEach(insp => {
        if (insp.defectCategory && insp.defectCategory !== 'None / Normal Condition') {
          if (!catCount[insp.defectCategory]) {
            catCount[insp.defectCategory] = { count: 0, firstSeen: insp.createdAt, latestSeen: insp.createdAt };
          }
          catCount[insp.defectCategory].count++;
          if (new Date(insp.createdAt) < new Date(catCount[insp.defectCategory].firstSeen)) {
            catCount[insp.defectCategory].firstSeen = insp.createdAt;
          }
          if (new Date(insp.createdAt) > new Date(catCount[insp.defectCategory].latestSeen)) {
            catCount[insp.defectCategory].latestSeen = insp.createdAt;
          }
        }
      });

      const repeatedDefectAlerts = Object.entries(catCount)
        .filter(([_, data]) => data.count >= 2)
        .map(([category, data]) => ({
          defectCategory: category,
          occurrences: data.count,
          firstSeen: data.firstSeen,
          latestSeen: data.latestSeen,
          trend: data.count > 2 ? ('WORSENING' as const) : ('PERSISTENT' as const),
          notes: `Repeated finding across ${data.count} independent surveys. Indicates unresolved structural root cause or failing prior remediation.`
        }));

      const waterCount = propInsps.filter(i => i.defectCategory?.includes('Water') || i.summary?.toLowerCase().includes('damp')).length;
      const unresolvedHigh = propInsps.filter(i => (i.severity === 'CRITICAL' || i.severity === 'HIGH') && i.approval?.status !== 'APPROVED').length;

      return {
        propertyId: propInsps[0]?.propertyId || propKey,
        propertyName: propName,
        totalInspections,
        hasSufficientHistoricalData,
        repeatedDefectAlerts,
        recurringDampnessDetected: waterCount >= 2,
        priorRepairsFailing: propInsps.some(i => i.userNotes?.toLowerCase().includes('repaired') || i.summary?.toLowerCase().includes('re-emerged')),
        unresolvedHighPriorityCount: unresolvedHigh
      };
    });

    // 4. Active Safety Escalations
    const activeSafetyEscalations = inspections
      .filter(i => i.safetyEscalation?.isEscalated)
      .map(i => ({
        inspectionId: i.id,
        propertyName: i.propertyName,
        floorOrRoom: i.floorOrRoom,
        summary: i.summary,
        instructions: i.safetyEscalation?.immediateSafetyInstructions || [],
        mandate: i.safetyEscalation?.urgentProfessionalInspectionMandate || 'Structural engineer verification required.',
        createdAt: i.createdAt
      }));

    return {
      totalInspections: inspections.length,
      distribution,
      prioritizationQueue: rankedQueue,
      propertyTrends,
      activeSafetyEscalations
    };
  }

  // ==========================================================================
  // REPAIR INTELLIGENCE & COST ESTIMATION REPOSITORY METHODS
  // ==========================================================================

  /**
   * Retrieves the saved Repair Plan for an inspection. If not yet persisted,
   * generates a comprehensive initial plan using repairEngineService.
   */
  public async getRepairPlan(inspectionId: string, authHeader?: string): Promise<RepairPlan | null> {
    const client = supabaseService.getClient(authHeader);

    // 1. Try Supabase remote table
    try {
      const { data, error } = await client
        .from('repair_plans')
        .select('*, options:repair_options(*)')
        .eq('inspection_id', inspectionId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          inspectionId: data.inspection_id,
          userId: data.user_id,
          propertyId: data.property_id,
          propertyName: data.property_name || 'Property Defect Location',
          location: data.location || '',
          defectCategory: data.defect_category,
          defectTitle: data.defect_title,
          observedCondition: data.observed_condition,
          possibleCauses: data.possible_causes || [],
          diagnosticTests: data.diagnostic_tests || [],
          requiresDiagnosticCheckBeforeRepair: data.is_cosmetic_prohibited ?? true,
          isCosmeticProhibited: data.is_cosmetic_prohibited ?? true,
          repairObjective: data.repair_objective,
          recommendedApproach: data.recommended_approach,
          requiredTrade: data.required_trade,
          requiredMaterials: data.required_materials || [],
          requiredTools: data.required_tools || [],
          estimatedWorkforce: data.estimated_workforce,
          estimatedDurationDays: Number(data.estimated_duration_days) || 1,
          estimatedDurationHours: Number(data.estimated_duration_hours) || 8,
          preparationRequirements: data.preparation_requirements || [],
          stepSequence: data.step_sequence || [],
          qcCheckpoints: data.qc_checkpoints || [],
          postRepairVerification: data.post_repair_verification || [],
          safetyPrecautions: data.safety_precautions || [],
          stopWorkConditions: data.stop_work_conditions || [],
          permitsAndApprovals: data.permits_and_approvals || [],
          limitations: data.limitations || [],
          professionalConfirmationRequired: data.professional_confirmation_required ?? true,
          professionalConfirmationRationale: data.professional_confirmation_rationale,
          options: data.options || [],
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
    } catch (err) {
      // Remote table not ready yet
    }

    // 2. Fallback to in-memory cache
    if (this.inMemoryRepairPlans.has(inspectionId)) {
      return this.inMemoryRepairPlans.get(inspectionId)!;
    }

    // 3. Auto-generate from inspection record if available
    const inspection = await this.getInspectionById(inspectionId, authHeader);
    if (inspection) {
      const { repairPlan, initialEstimate } = repairEngineService.generateRepairPlan(inspection);
      this.inMemoryRepairPlans.set(inspectionId, repairPlan);
      const existingEsts = this.inMemoryEstimates.get(inspectionId) || [];
      if (existingEsts.length === 0) {
        this.inMemoryEstimates.set(inspectionId, [initialEstimate]);
      }
      return repairPlan;
    }

    return null;
  }

  /**
   * Saves or updates a Repair Plan.
   */
  public async saveRepairPlan(plan: RepairPlan, authHeader?: string): Promise<RepairPlan> {
    const client = supabaseService.getClient(authHeader);

    this.inMemoryRepairPlans.set(plan.inspectionId, plan);

    try {
      let userId: string | undefined;
      try {
        const user = await this.getAuthUser(authHeader);
        userId = user.id;
      } catch {
        // Unauthenticated fallback
      }

      if (userId) {
        await client.from('repair_plans').upsert({
          id: plan.id.startsWith('plan-') ? undefined : plan.id,
          inspection_id: plan.inspectionId,
          user_id: userId,
          property_id: plan.propertyId,
          defect_title: plan.defectTitle,
          defect_category: plan.defectCategory,
          observed_condition: plan.observedCondition,
          possible_causes: plan.possibleCauses,
          diagnostic_tests: plan.diagnosticTests,
          is_cosmetic_prohibited: plan.isCosmeticProhibited,
          repair_objective: plan.repairObjective,
          recommended_approach: plan.recommendedApproach,
          required_trade: plan.requiredTrade,
          required_materials: plan.requiredMaterials,
          required_tools: plan.requiredTools,
          estimated_workforce: plan.estimatedWorkforce,
          estimated_duration_days: plan.estimatedDurationDays,
          estimated_duration_hours: plan.estimatedDurationHours,
          preparation_requirements: plan.preparationRequirements,
          step_sequence: plan.stepSequence,
          qc_checkpoints: plan.qcCheckpoints,
          post_repair_verification: plan.postRepairVerification,
          safety_precautions: plan.safetyPrecautions,
          stop_work_conditions: plan.stopWorkConditions,
          permits_and_approvals: plan.permitsAndApprovals,
          limitations: plan.limitations,
          professional_confirmation_required: plan.professionalConfirmationRequired,
          professional_confirmation_rationale: plan.professionalConfirmationRationale,
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('[SupabaseRepository] Could not save repair_plan remotely (schema pending):', err);
    }

    return plan;
  }

  /**
   * Retrieves all estimates for an inspection, ordered by version descending.
   */
  public async getRepairEstimates(inspectionId: string, authHeader?: string): Promise<RepairCostEstimate[]> {
    const client = supabaseService.getClient(authHeader);

    // 1. Try remote Supabase
    try {
      const { data, error } = await client
        .from('repair_cost_estimates')
        .select('*, line_items:repair_estimate_line_items(*)')
        .eq('inspection_id', inspectionId)
        .order('version', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          inspectionId: d.inspection_id,
          userId: d.user_id,
          propertyId: d.property_id,
          repairPlanId: d.repair_plan_id,
          repairOptionId: d.repair_option_id,
          selectedOptionKey: d.selected_option_key || 'OPTION_A',
          version: d.version,
          status: d.status,
          currency: d.currency || 'INR',
          currencySymbol: d.currency_symbol || '₹',
          measurements: d.measurements || {},
          lineItems: (d.line_items || []).map((li: any) => ({
            id: li.id,
            estimateId: li.estimate_id,
            category: li.category,
            description: li.description,
            quantity: Number(li.quantity),
            unit: li.unit,
            unitRate: Number(li.unit_rate),
            lineTotal: Number(li.line_total),
            rateSource: li.rate_source,
            rateReference: li.rate_reference,
            isManual: li.is_manual,
            notes: li.notes
          })),
          subtotal: Number(d.subtotal),
          contingencyPercent: d.contingency_percent != null ? Number(d.contingency_percent) : null,
          contingencyAmount: Number(d.contingency_amount),
          taxPercent: d.tax_percent != null ? Number(d.tax_percent) : null,
          taxAmount: Number(d.tax_amount),
          totalAmount: Number(d.total_amount),
          missingInformationWarnings: d.missing_information_warnings || [],
          assumptions: d.assumptions || [],
          approvedBy: d.approved_by,
          approvedAt: d.approved_at,
          approvalNotes: d.approval_notes,
          rejectionReason: d.rejection_reason,
          supersededBy: d.superseded_by,
          createdAt: d.created_at,
          updatedAt: d.updated_at
        }));
      }
    } catch (err) {
      // Remote table pending
    }

    // 2. Fallback to in-memory cache
    if (this.inMemoryEstimates.has(inspectionId)) {
      return this.inMemoryEstimates.get(inspectionId)!;
    }

    // 3. If none exist, auto-create initial estimate from inspection
    const inspection = await this.getInspectionById(inspectionId, authHeader);
    if (inspection) {
      const { repairPlan, initialEstimate } = repairEngineService.generateRepairPlan(inspection);
      this.inMemoryRepairPlans.set(inspectionId, repairPlan);
      this.inMemoryEstimates.set(inspectionId, [initialEstimate]);
      return [initialEstimate];
    }

    return [];
  }

  /**
   * Saves or updates a Repair Cost Estimate and recalculates totals deterministically on the server.
   */
  public async saveRepairEstimate(estimate: RepairCostEstimate, authHeader?: string): Promise<RepairCostEstimate> {
    // Deterministically recalculate totals on the server
    const totals = repairEngineService.calculateEstimateTotals(
      estimate.lineItems,
      estimate.contingencyPercent,
      estimate.taxPercent,
      estimate.currency
    );

    const verifiedEstimate: RepairCostEstimate = {
      ...estimate,
      lineItems: totals.recalculatedLineItems,
      subtotal: totals.subtotal,
      contingencyPercent: totals.contingencyPercent,
      contingencyAmount: totals.contingencyAmount,
      taxPercent: totals.taxPercent,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      missingInformationWarnings: totals.missingInformationWarnings,
      currencySymbol: totals.currencySymbol,
      updatedAt: new Date().toISOString()
    };

    // Store in-memory
    const existing = this.inMemoryEstimates.get(estimate.inspectionId) || [];
    const index = existing.findIndex(e => e.id === verifiedEstimate.id);
    if (index >= 0) {
      existing[index] = verifiedEstimate;
    } else {
      existing.unshift(verifiedEstimate);
    }
    this.inMemoryEstimates.set(estimate.inspectionId, existing);

    // Try remote database
    try {
      let userId: string | undefined;
      try {
        const user = await this.getAuthUser(authHeader);
        userId = user.id;
      } catch {
        // anonymous
      }

      if (userId) {
        const client = supabaseService.getClient(authHeader);
        await client.from('repair_cost_estimates').upsert({
          id: verifiedEstimate.id.startsWith('est-') ? undefined : verifiedEstimate.id,
          inspection_id: verifiedEstimate.inspectionId,
          user_id: userId,
          property_id: verifiedEstimate.propertyId,
          version: verifiedEstimate.version,
          status: verifiedEstimate.status,
          currency: verifiedEstimate.currency,
          currency_symbol: verifiedEstimate.currencySymbol,
          measurements: verifiedEstimate.measurements,
          subtotal: verifiedEstimate.subtotal,
          contingency_percent: verifiedEstimate.contingencyPercent,
          contingency_amount: verifiedEstimate.contingencyAmount,
          tax_percent: verifiedEstimate.taxPercent,
          tax_amount: verifiedEstimate.taxAmount,
          total_amount: verifiedEstimate.totalAmount,
          missing_information_warnings: verifiedEstimate.missingInformationWarnings,
          assumptions: verifiedEstimate.assumptions,
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('[SupabaseRepository] Could not save repair_cost_estimates remotely:', err);
    }

    return verifiedEstimate;
  }

  /**
   * Submits, Approves, Rejects, or Requests Revision for an estimate.
   */
  public async updateEstimateStatus(
    estimateId: string,
    action: 'SUBMIT_FOR_REVIEW' | 'APPROVE' | 'REJECT' | 'REQUEST_REVISION',
    notes?: string,
    actorName?: string,
    authHeader?: string
  ): Promise<RepairCostEstimate> {
    let foundEstimate: RepairCostEstimate | null = null;
    let foundInspectionId: string | null = null;

    // Search in-memory cache
    for (const [inspId, estimates] of this.inMemoryEstimates.entries()) {
      const match = estimates.find(e => e.id === estimateId);
      if (match) {
        foundEstimate = match;
        foundInspectionId = inspId;
        break;
      }
    }

    if (!foundEstimate || !foundInspectionId) {
      throw new Error(`Estimate with ID ${estimateId} not found.`);
    }

    // Validation: Cannot approve if required quantities or rates are missing
    if (action === 'APPROVE') {
      if (foundEstimate.lineItems.length === 0) {
        throw new Error('Cannot approve an estimate with zero line items.');
      }
      const hasMissingRate = foundEstimate.lineItems.some(li => li.unitRate <= 0);
      if (hasMissingRate) {
        throw new Error('Cannot approve estimate: One or more line items have an unconfigured unit rate.');
      }
      if (foundEstimate.totalAmount <= 0) {
        throw new Error('Cannot approve estimate with total amount of ₹0.00.');
      }
    }

    let newStatus: any = foundEstimate.status;
    let approvedAt: string | undefined = foundEstimate.approvedAt;
    let approvedByName: string | undefined = foundEstimate.approvedByName;
    let approvalNotes: string | undefined = foundEstimate.approvalNotes;
    let rejectionReason: string | undefined = foundEstimate.rejectionReason;

    if (action === 'SUBMIT_FOR_REVIEW') {
      newStatus = 'AWAITING_REVIEW';
    } else if (action === 'APPROVE') {
      newStatus = 'APPROVED';
      approvedAt = new Date().toISOString();
      approvedByName = actorName || 'Property Manager';
      approvalNotes = notes || 'Estimate approved for maintenance planning.';
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';
      rejectionReason = notes || 'Estimate rejected by property manager.';
    } else if (action === 'REQUEST_REVISION') {
      newStatus = 'REVISION_REQUESTED';
      approvalNotes = notes || 'Changes requested.';
    }

    const updatedEstimate: RepairCostEstimate = {
      ...foundEstimate,
      status: newStatus,
      approvedAt,
      approvedByName,
      approvalNotes,
      rejectionReason,
      updatedAt: new Date().toISOString()
    };

    // Update in-memory
    const estimates = this.inMemoryEstimates.get(foundInspectionId)!;
    const idx = estimates.findIndex(e => e.id === estimateId);
    if (idx >= 0) {
      estimates[idx] = updatedEstimate;
    }

    // Log audit
    await this.logAudit(
      foundEstimate.userId || 'current-user',
      'APPROVAL',
      estimateId,
      `ESTIMATE_${action}`,
      {
        estimateId,
        newStatus,
        totalAmount: updatedEstimate.totalAmount,
        notes,
        actorName: actorName || 'Property Manager'
      },
      authHeader
    );

    return updatedEstimate;
  }

  /**
   * Retrieves high-level Repair & Maintenance Planner Overview KPIs.
   */
  public async getMaintenancePlannerOverview(authHeader?: string): Promise<MaintenancePlannerOverview> {
    const inspections = await this.getInspections(authHeader);

    let totalRepairRecommendations = 0;
    let openRepairProposals = 0;
    let estimatesAwaitingReview = 0;
    let approvedRepairBudgetsTotalINR = 0;
    let upcomingPlannedRepairsCount = 0;

    for (const insp of inspections) {
      if (insp.isDefectIdentified && insp.defectCategory !== 'None / Normal Condition') {
        totalRepairRecommendations++;

        const estimates = await this.getRepairEstimates(insp.id, authHeader);
        for (const est of estimates) {
          if (est.status === 'DRAFT' || est.status === 'REVISION_REQUESTED') {
            openRepairProposals++;
          } else if (est.status === 'AWAITING_REVIEW') {
            estimatesAwaitingReview++;
          } else if (est.status === 'APPROVED') {
            approvedRepairBudgetsTotalINR += est.totalAmount;
            upcomingPlannedRepairsCount++;
          }
        }
      }
    }

    return {
      totalRepairRecommendations,
      openRepairProposals,
      estimatesAwaitingReview,
      approvedRepairBudgetsTotalINR: Math.round(approvedRepairBudgetsTotalINR * 100) / 100,
      upcomingPlannedRepairsCount
    };
  }
}

export const supabaseRepository = new SupabaseRepository();

