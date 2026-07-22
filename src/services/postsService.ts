import { restaurantConfig } from '../config/restaurant';
import type { CreateExperiencePostInput, ExperiencePost } from '../types';
import type { CreateExperiencePayload, RegisterSharePayload, RegisterViewPayload, ToggleLikePayload } from '../types/api';
import { apiRequest, createVisibilityPoller } from './apiClient';

type PostCallback = (post: ExperiencePost | null) => void;
type Unsubscribe = () => void;

export async function createExperiencePost(input: CreateExperiencePostInput) {
  return apiRequest<ExperiencePost, CreateExperiencePayload>('createExperiencePost', input);
}

export async function getExperiencePostById(experiencePostId: string, userId?: string, signal?: AbortSignal) {
  return apiRequest<ExperiencePost | null, { experiencePostId: string; userId?: string }>(
    'getExperiencePost',
    { experiencePostId, userId },
    { signal }
  );
}

export async function getApprovedPosts(options: { limit?: number; pageToken?: string } = {}) {
  return apiRequest<{ posts: ExperiencePost[]; nextPageToken: string }, { limit?: number; pageToken?: string; restaurantId: string }>(
    'getApprovedPosts',
    {
      limit: options.limit ?? 20,
      pageToken: options.pageToken,
      restaurantId: restaurantConfig.restaurantId
    }
  );
}

export function subscribeToExperiencePost(experiencePostId: string, userId: string, callback: PostCallback): Unsubscribe {
  return createVisibilityPoller((signal) => getExperiencePostById(experiencePostId, userId, signal), callback, {
    intervalMs: 5000,
    onError: () => undefined
  });
}

export async function likeExperiencePost(experiencePostId: string, userId: string, liked: boolean) {
  const result = await apiRequest<{ liked: boolean; count: number; target: ExperiencePost | null }, ToggleLikePayload>('toggleLike', {
    liked,
    restaurantId: restaurantConfig.restaurantId,
    sessionId: userId,
    targetId: experiencePostId,
    targetType: 'experiencePost',
    userId
  });
  return result.target;
}

export async function registerExperienceView(experiencePostId: string, userId: string) {
  const result = await apiRequest<{ counted: boolean; count: number; target: ExperiencePost | null }, RegisterViewPayload>('registerView', {
    restaurantId: restaurantConfig.restaurantId,
    sessionId: userId,
    targetId: experiencePostId,
    targetType: 'experiencePost',
    userId
  });
  return result.target;
}

export async function shareExperiencePost(experiencePostId: string, userId?: string, shareMethod: RegisterSharePayload['shareMethod'] = 'nativeShare') {
  const result = await apiRequest<{ count: number; target: ExperiencePost | null }, RegisterSharePayload>('registerShare', {
    restaurantId: restaurantConfig.restaurantId,
    sessionId: userId,
    shareMethod,
    targetId: experiencePostId,
    targetType: 'experiencePost',
    userId
  });
  return result.target;
}
