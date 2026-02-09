import { PrismaClient } from "@prisma/client";

/**
 * INTEREST REPOSITORY
 * Manages user interest data in the database for feed personalization
 * 
 * Key Operations:
 * - Track user affinity scores per category
 * - Find top users for specific categories (used in Push Model)
 * - Update scores based on interactions (Like +5, Comment +10, Unlike -5)
 */
export class InterestRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Upsert user interest for a category
   * If exists: increment score, else: create new record
   */
  async upsertInterest(userId: string, category: string, scoreChange: number) {
    console.log(`   📊 [INTEREST REPO] Upserting interest - User: ${userId}, Category: ${category}, Change: ${scoreChange > 0 ? '+' : ''}${scoreChange}`);
    
    const existing = await this.prisma.userInterest.findUnique({
      where: { userId_category: { userId, category } }
    });

    if (existing) {
      const newScore = Math.max(0, existing.affinityScore + scoreChange);
      await this.prisma.userInterest.update({
        where: { userId_category: { userId, category } },
        data: { affinityScore: newScore }
      });
      console.log(`   ✅ [INTEREST REPO] Updated - Old: ${existing.affinityScore}, New: ${newScore}`);
    } else {
      const initialScore = Math.max(0, scoreChange);
      await this.prisma.userInterest.create({
        data: { userId, category, affinityScore: initialScore }
      });
      console.log(`   ✅ [INTEREST REPO] Created new interest with score: ${initialScore}`);
    }
  }

  /**
   * Get all interests for a user (used in Re-rank Model)
   */
  async getUserInterests(userId: string) {
    return this.prisma.userInterest.findMany({
      where: { userId },
      orderBy: { affinityScore: 'desc' }
    });
  }

  /**
   * Get users with affinity score >= minScore for any of the given categories
   * Used in PUSH MODEL to determine which users should receive a new post
   */
  async getUsersWithMinScoreForCategories(categories: string[], minScore: number) {
    console.log(`   🔍 [INTEREST REPO] Finding users with score >= ${minScore} for categories: [${categories.join(', ')}]`);
    
    const users = await this.prisma.userInterest.findMany({
      where: {
        category: { in: categories },
        affinityScore: { gte: minScore }
      },
      select: {
        userId: true,
        category: true,
        affinityScore: true
      }
    });

    // Group by userId and get max affinity score
    const userMap = new Map<string, number>();
    users.forEach(u => {
      const current = userMap.get(u.userId) || 0;
      userMap.set(u.userId, Math.max(current, u.affinityScore));
    });

    const result = Array.from(userMap.entries()).map(([userId, maxAffinity]) => ({
      userId,
      maxAffinity
    }));

    console.log(`   ✅ [INTEREST REPO] Found ${result.length} users matching criteria`);
    return result;
  }

  /**
   * Get user's affinity score for a specific category
   */
  async getUserCategoryAffinity(userId: string, category: string): Promise<number> {
    const interest = await this.prisma.userInterest.findUnique({
      where: { userId_category: { userId, category } }
    });
    return interest?.affinityScore || 0;
  }
}
