import { Blocks, Box, Globe, Grid2X2, Layers, Rocket, Shield, Target, Zap } from 'lucide-react';

/** 服务端 seed 只存整数下标，客户端用同一数组还原图标组件。 */
export const PROJECT_ICON_ORDER = [
   Box,
   Blocks,
   Globe,
   Grid2X2,
   Layers,
   Rocket,
   Shield,
   Target,
   Zap,
] as const;

export const iconByIndex = (index: number) =>
   PROJECT_ICON_ORDER[index % PROJECT_ICON_ORDER.length] ?? Box;
