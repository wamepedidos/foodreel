import { restaurantConfig } from '../config/restaurant';
import type { ExperienceComment } from '../types';
import type { CreateCommentPayload } from '../types/api';
import { apiRequest, createVisibilityPoller } from './apiClient';
import { incrementCachedDishComments } from './dishesService';

type CommentsCallback = (comments: ExperienceComment[]) => void;
type Unsubscribe = () => void;
const LOCAL_COMMENTS_KEY = 'foodreel-local-comments';

export async function getComments(targetType: CreateCommentPayload['targetType'], targetId: string, signal?: AbortSignal) {
  const comments = await apiRequest<ExperienceComment[], { restaurantId: string; targetId: string; targetType: CreateCommentPayload['targetType'] }>(
    'getComments',
    {
      restaurantId: restaurantConfig.restaurantId,
      targetId,
      targetType
    },
    { signal }
  );
  return mergeComments(readLocalComments(targetType, targetId), comments);
}

export function subscribeToComments(
  targetType: CreateCommentPayload['targetType'],
  targetId: string,
  callback: CommentsCallback
): Unsubscribe {
  return createVisibilityPoller((signal) => getComments(targetType, targetId, signal), callback, {
    intervalMs: 5000,
    onError: () => undefined
  });
}

export function subscribeToExperienceComments(experiencePostId: string, callback: CommentsCallback) {
  return subscribeToComments('experiencePost', experiencePostId, callback);
}

export function subscribeToDishComments(dishId: string, callback: CommentsCallback) {
  return subscribeToComments('dish', dishId, callback);
}

export async function createComment(input: CreateCommentPayload) {
  const comment = await apiRequest<ExperienceComment, CreateCommentPayload>('createComment', input);
  saveLocalComment(input.targetType, input.targetId, comment);
  return comment;
}

export function mergeComments(current: ExperienceComment[], incoming: ExperienceComment[]) {
  const commentsById = new Map<string, ExperienceComment>();
  [...current, ...incoming].forEach((comment) => {
    commentsById.set(comment.id, comment);
  });
  return [...commentsById.values()].sort((left, right) => commentCreatedAt(left) - commentCreatedAt(right));
}

function commentCreatedAt(comment: ExperienceComment) {
  const time = new Date(comment.createdAt).getTime();
  return Number.isFinite(time) ? time : 0;
}

function localCommentKey(targetType: CreateCommentPayload['targetType'], targetId: string) {
  return `${restaurantConfig.restaurantId}:${targetType}:${targetId}`;
}

function readLocalComments(targetType: CreateCommentPayload['targetType'], targetId: string) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(LOCAL_COMMENTS_KEY) ?? '{}') as Record<string, ExperienceComment[]>;
    return stored[localCommentKey(targetType, targetId)] ?? [];
  } catch {
    return [];
  }
}

function saveLocalComment(targetType: CreateCommentPayload['targetType'], targetId: string, comment: ExperienceComment) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(LOCAL_COMMENTS_KEY) ?? '{}') as Record<string, ExperienceComment[]>;
    const key = localCommentKey(targetType, targetId);
    stored[key] = mergeComments(stored[key] ?? [], [comment]).slice(-100);
    window.localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(stored));
  } catch {
    // Local cache is a display fallback; the server write above is authoritative.
  }
}

export async function createExperienceComment(input: {
  experiencePostId: string;
  userId: string;
  userName: string;
  text: string;
  parentId?: string | null;
}) {
  return createComment({
    parentCommentId: input.parentId ?? null,
    restaurantId: restaurantConfig.restaurantId,
    targetId: input.experiencePostId,
    targetType: 'experiencePost',
    text: input.text,
    userId: input.userId,
    userName: input.userName
  });
}

export async function createDishComment(input: {
  dishId: string;
  userId: string;
  userName: string;
  text: string;
  parentId?: string | null;
}) {
  const comment = await createComment({
    parentCommentId: input.parentId ?? null,
    restaurantId: restaurantConfig.restaurantId,
    targetId: input.dishId,
    targetType: 'dish',
    text: input.text,
    userId: input.userId,
    userName: input.userName
  });
  incrementCachedDishComments(input.dishId);
  return comment;
}
