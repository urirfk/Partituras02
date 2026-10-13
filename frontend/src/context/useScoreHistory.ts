import { useContext } from 'react';
import {
  ScoreHistoryContext,
  ScoreHistoryContextValue,
} from './ScoreHistoryContextInstance';

export const useScoreHistory = (): ScoreHistoryContextValue => {
  const context = useContext(ScoreHistoryContext);
  if (!context) {
    throw new Error('useScoreHistory must be used within a ScoreHistoryProvider');
  }
  return context;
};
