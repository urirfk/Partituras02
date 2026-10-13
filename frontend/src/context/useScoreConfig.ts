import { useContext } from 'react';
import {
  ScoreConfigContext,
  ScoreConfigContextValue,
} from './ScoreConfigContextInstance';

export const useScoreConfig = (): ScoreConfigContextValue => {
  const context = useContext(ScoreConfigContext);
  if (!context) {
    throw new Error('useScoreConfig must be used within a ScoreConfigProvider');
  }
  return context;
};
