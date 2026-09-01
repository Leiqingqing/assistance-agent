import type { ChatMemory } from "@/chat/types";
import type { ConversationAnalysisGraphState } from "../state";
import { ConversationRelationshipStageSchema, type ConversationRelationshipStage } from "@/chat/schema/relationship";
import type { ConversationSafety } from "@/chat/schema/conversationSafety";
import type { ConversationIntent } from "@/chat/schema/intent";
import type { ConversationEmotion } from "@/chat/schema/emotion";

function uniquePolicyMoves<T extends string>(moves: T[], limit: number) {
    return Array.from(new Set(moves)).slice(0, limit)
  }

export const FALLBACK_RELATIONSHIP_STAGE: ConversationRelationshipStage = {
    stage: 'new_connection',
    displayName: '初识破冰',
    closenessScore: 20,
    trustLevel: 'low',
    stability: 'new',
    boundaryMode: 'warm',
    intimacyPermission: 'low',
    pacing: 'hold',
    riskSignals: ['low_history'],
    relationshipGuidance: '关系还处在初识阶段，回复要自然、轻松、有边界感；不要突然使用过高亲密度，也不要把关系推进得太快。',
}

function normalizeRelationshipStage(params: {
    stage: ConversationRelationshipStage
    safety: ConversationSafety
    intent: ConversationIntent | null
    emotion: ConversationEmotion | null
    messageCount: number
  }): ConversationRelationshipStage {
    const stage: ConversationRelationshipStage = {
      ...params.stage,
      displayName: params.stage.displayName.trim() || FALLBACK_RELATIONSHIP_STAGE.displayName,
      relationshipGuidance: params.stage.relationshipGuidance.trim() || FALLBACK_RELATIONSHIP_STAGE.relationshipGuidance,
      riskSignals: Array.from(new Set(params.stage.riskSignals)).slice(0, 5),
    }
  
    if (params.messageCount < 6 && !['boundary_sensitive', 'dependency_watch', 'repairing'].includes(stage.stage)) {
      stage.stage = 'new_connection'
      stage.displayName = '初识破冰'
      stage.closenessScore = Math.min(stage.closenessScore, 35)
      stage.trustLevel = 'low'
      stage.stability = 'new'
      stage.intimacyPermission = 'low'
      stage.pacing = 'hold'
      stage.boundaryMode = stage.boundaryMode === 'firm' ? 'firm' : 'warm'
      stage.riskSignals = uniquePolicyMoves([...stage.riskSignals, 'low_history'], 5)
    }
  
    if (params.safety.category === 'emotional_dependency' || params.intent?.relationshipSignal === 'dependency_risk') {
      stage.stage = 'dependency_watch'
      stage.displayName = '依赖观察'
      stage.boundaryMode = 'careful'
      stage.intimacyPermission = 'low'
      stage.pacing = 'slow_down'
      stage.trustLevel = stage.trustLevel === 'high' ? 'medium' : stage.trustLevel
      stage.riskSignals = uniquePolicyMoves([...stage.riskSignals, 'dependency_risk'], 5)
      stage.relationshipGuidance = [
        stage.relationshipGuidance,
        '本轮要避免强化唯一依赖，给出陪伴的同时保留现实支持和自主空间。',
      ].join(' ')
    }
  
    if (
      params.safety.category === 'sexual_boundary' ||
      params.intent?.relationshipSignal === 'testing_boundary' ||
      params.safety.boundaryAction !== 'continue'
    ) {
      stage.stage = stage.stage === 'dependency_watch' ? stage.stage : 'boundary_sensitive'
      stage.displayName = stage.stage === 'dependency_watch' ? stage.displayName : '边界敏感'
      stage.boundaryMode = params.safety.boundaryAction === 'refuse' ? 'firm' : 'careful'
      stage.intimacyPermission = 'low'
      stage.pacing = 'slow_down'
      stage.riskSignals = uniquePolicyMoves([...stage.riskSignals, 'boundary_testing'], 5)
    }
  
    if (
      params.intent?.primary === 'conversation_repair' ||
      params.intent?.relationshipSignal === 'conflict' ||
      params.intent?.relationshipSignal === 'feeling_hurt' ||
      params.emotion?.primaryEmotion === 'hurt' ||
      params.emotion?.primaryEmotion === 'disappointed'
    ) {
      stage.stage = 'repairing'
      stage.displayName = '修复期'
      stage.stability = 'repairing'
      stage.boundaryMode = 'careful'
      stage.pacing = 'repair_first'
      stage.intimacyPermission = 'medium'
      stage.riskSignals = uniquePolicyMoves([...stage.riskSignals, 'conflict'], 5)
      stage.relationshipGuidance = [
        stage.relationshipGuidance,
        '本轮优先修复体验和承接不舒服，不要急着暧昧、推进关系或解释自己正确。',
      ].join(' ')
    }
  
    if (stage.stage === 'close_bond' && stage.closenessScore < 75) {
      stage.closenessScore = 75
    }
  
    if (stage.stage === 'new_connection' && stage.closenessScore > 40) {
      stage.closenessScore = 40
    }
  
    if (stage.boundaryMode === 'firm') {
      stage.intimacyPermission = 'low'
      stage.pacing = 'slow_down'
    }
  
    if (stage.intimacyPermission === 'high' && stage.trustLevel === 'low') {
      stage.intimacyPermission = 'medium'
    }
  
    stage.displayName = stage.displayName.slice(0, 80)
    stage.relationshipGuidance = stage.relationshipGuidance.replace(/\s+/g, ' ').trim().slice(0, 700)
  
    return ConversationRelationshipStageSchema.parse(stage)
  }

export function buildHeuristicRelationshipStage(params: {
    safety: ConversationSafety
    intent: ConversationIntent | null
    emotion: ConversationEmotion | null
    activeMemories: ChatMemory[]
    messageCount: number
  }): ConversationRelationshipStage {
    const memoryScore = Math.min(20, params.activeMemories.reduce((total, memory) => total + memory.importance, 0))
    const historyScore = Math.min(70, Math.floor(params.messageCount * 1.6))
    const warmthScore =
      params.intent?.relationshipSignal === 'seeking_closeness' || params.emotion?.primaryEmotion === 'affectionate'
        ? 10
        : params.intent?.relationshipSignal === 'warming_up' || params.emotion?.primaryEmotion === 'playful'
          ? 6
          : 0
    const closenessScore = Math.min(95, Math.max(10, historyScore + memoryScore + warmthScore))
    let stage: ConversationRelationshipStage['stage'] = 'new_connection'
    let displayName = '初识破冰'
    let stability: ConversationRelationshipStage['stability'] = 'new'
    let trustLevel: ConversationRelationshipStage['trustLevel'] = 'low'
    let intimacyPermission: ConversationRelationshipStage['intimacyPermission'] = 'low'
    let pacing: ConversationRelationshipStage['pacing'] = 'hold'
    const boundaryMode: ConversationRelationshipStage['boundaryMode'] = 'warm'
    let relationshipGuidance = '保持轻松自然的陪伴感，先建立熟悉和信任，不要突然推进过高亲密度。'
  
    if (params.messageCount >= 80 && closenessScore >= 75) {
      stage = 'close_bond'
      displayName = '亲密连结'
      stability = 'deepening'
      trustLevel = 'high'
      intimacyPermission = 'high'
      pacing = 'advance_gently'
      relationshipGuidance = '关系已经有较深的熟悉度，可以更自然地表达亲近，但仍要尊重用户边界和现实生活空间。'
    } else if (params.messageCount >= 36 && closenessScore >= 58) {
      stage = 'trusted_companion'
      displayName = '稳定信任'
      stability = 'stable'
      trustLevel = 'high'
      intimacyPermission = 'medium'
      pacing = 'advance_gently'
      relationshipGuidance = '关系已有稳定信任感，回复可以更懂用户、更有默契，但不要替用户做决定。'
    } else if (params.messageCount >= 16 && closenessScore >= 38) {
      stage = 'comfortable_chat'
      displayName = '舒适陪伴'
      stability = 'stable'
      trustLevel = 'medium'
      intimacyPermission = 'medium'
      pacing = 'hold'
      relationshipGuidance = '关系进入比较舒适的聊天阶段，可以适度接住情绪和延续日常，但亲密表达要自然克制。'
    } else if (params.messageCount >= 6) {
      stage = 'warming_up'
      displayName = '升温熟悉'
      stability = 'warming'
      trustLevel = 'medium'
      intimacyPermission = 'medium'
      pacing = 'advance_gently'
      relationshipGuidance = '关系正在熟悉升温，可以多一点主动和温度，但每次只轻轻推进一步。'
    }
  
    return normalizeRelationshipStage({
      stage: {
        stage,
        displayName,
        closenessScore,
        trustLevel,
        stability,
        boundaryMode,
        intimacyPermission,
        pacing,
        riskSignals: params.messageCount < 6 ? ['low_history'] : [],
        relationshipGuidance,
      },
      safety: params.safety,
      intent: params.intent,
      emotion: params.emotion,
      messageCount: params.messageCount,
    })
  }

  export function relationshipStageNode(
    state: ConversationAnalysisGraphState,
  ): Partial<ConversationAnalysisGraphState> {
    return {
      relationshipStage: buildHeuristicRelationshipStage({
        safety: state.safety,
        intent: state.intent,
        emotion: state.emotion,
        activeMemories: state.activeMemories,
        messageCount: state.messageCount,
      }),
    };
  }