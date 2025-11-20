import { Video, Shield, Building2, KeyRound } from 'lucide-react';
import React from 'react';

export const allFeaturesList = ['CCTV', 'Guarded', 'Multi-storey parking', 'Valet parking'];

export const featureIcons: { [key: string]: React.ElementType } = {
  'CCTV': Video,
  'Guarded': Shield,
  'Multi-storey parking': Building2,
  'Valet parking': KeyRound
};
