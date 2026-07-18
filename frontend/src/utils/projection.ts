import type { SimulationResult, ImpactAxis } from '../features/scenario/types';

export interface ProjectedResult {
  year: number;
  overall_score: number;
  impacts: ImpactAxis[];
}

export function generateProjections(baseResult: SimulationResult, startYear: number = 2024, endYear: number = 2035): ProjectedResult[] {
  const projections: ProjectedResult[] = [];
  
  // Create deterministic pseudo-random seeds based on the query string
  const seed = baseResult.query.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // We'll define a trajectory type for each category to make it interesting
  // e.g. some drop first then rise, some rise linearly, some exponential
  const trajectories: Record<string, { type: 'linear' | 'delay' | 'compounding' | 'diminishing'; volatility: number }> = {
    financial: { type: 'compounding', volatility: 0.1 },
    environmental: { type: 'delay', volatility: 0.05 },
    human: { type: 'linear', volatility: 0.02 },
    risks: { type: 'diminishing', volatility: 0.15 },
    opportunities: { type: 'compounding', volatility: 0.08 },
  };

  const totalYears = endYear - startYear;

  for (let y = startYear; y <= endYear; y++) {
    if (y === startYear) {
      projections.push({
        year: y,
        overall_score: baseResult.overall_score,
        impacts: baseResult.impacts
      });
      continue;
    }

    const t = (y - startYear) / totalYears; // 0.0 to 1.0 progress
    
    const projectedImpacts = baseResult.impacts.map(impact => {
      const config = trajectories[impact.category] || { type: 'linear', volatility: 0.05 };
      let multiplier = 1.0;
      
      // Pseudo-random noise based on year and category
      const noise = (Math.sin(seed + y + impact.category.charCodeAt(0)) * config.volatility);

      // Determine how the score changes over time. 
      // If base score > 50, it tends to improve or stabilize. If < 50, it might worsen or improve slowly.
      const isPositive = impact.score >= 50;
      const targetDelta = isPositive ? (100 - impact.score) * 0.4 : (0 - impact.score) * 0.3; 
      
      let progress = 0;
      switch (config.type) {
        case 'linear':
          progress = t;
          break;
        case 'delay': // Slow start, fast later (x^3)
          progress = Math.pow(t, 3);
          break;
        case 'compounding': // Accelerates (x^2)
          progress = Math.pow(t, 2);
          break;
        case 'diminishing': // Fast start, slows down (sqrt)
          progress = Math.sqrt(t);
          break;
      }

      let newScore = impact.score + (targetDelta * progress) + (noise * 100);
      newScore = Math.max(10, Math.min(100, newScore)); // Clamp between 10-100

      // Adjust details optionally (we'll just leave text same but update numbers conceptually if needed, 
      // for now keeping details the same but axis score changes)
      
      return {
        ...impact,
        score: newScore,
      };
    });

    const newOverall = projectedImpacts.reduce((sum, imp) => sum + imp.score, 0) / projectedImpacts.length;

    projections.push({
      year: y,
      overall_score: newOverall,
      impacts: projectedImpacts
    });
  }

  return projections;
}
