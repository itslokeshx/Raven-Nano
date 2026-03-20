// System metrics generators for live data simulation

export const generateReactorOutput = () => {
  const base = 3.0;
  const fluctuation = Math.sin(Date.now() / 5000) * 0.15;
  return (base + fluctuation).toFixed(2);
};

export const generateCoreTemp = () => {
  const base = 1472;
  const fluctuation = (Math.random() - 0.5) * 40;
  return Math.round(base + fluctuation);
};

export const generateShieldStrength = () => {
  const base = 94;
  const fluctuation = (Math.random() - 0.5) * 6;
  return Math.min(100, Math.max(0, Math.round(base + fluctuation)));
};

export const generateNetworkPing = () => {
  return Math.floor(Math.random() * 6) + 2;
};

export const generateSuitIntegrity = () => {
  const base = 98;
  const fluctuation = (Math.random() - 0.5) * 4;
  return Math.min(100, Math.max(0, Math.round(base + fluctuation)));
};

export const generateEnvironmentData = () => {
  return {
    temperature: Math.round(72 + (Math.random() - 0.5) * 4),
    humidity: Math.round(45 + (Math.random() - 0.5) * 10),
    pressure: (1013.25 + (Math.random() - 0.5) * 5).toFixed(1),
  };
};

export const getThreatLevel = () => {
  const levels = ['NONE', 'NONE', 'NONE', 'NONE', 'ELEVATED', 'NONE', 'NONE'];
  return levels[Math.floor(Math.random() * levels.length)];
};

export const formatCoordinates = () => {
  const lat = 34.0259 + (Math.random() - 0.5) * 0.001;
  const lng = -118.7798 + (Math.random() - 0.5) * 0.001;
  return {
    lat: `${Math.abs(lat).toFixed(4)}° N`,
    lng: `${Math.abs(lng).toFixed(4)}° W`,
  };
};
