import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { DitheredImage } from './DitheredImage';

interface SceneProps {
  imageSrc: string;
  width?: number;
  height?: number;
  colorQuantization?: number;
}

export const Scene: React.FC<SceneProps> = ({
  imageSrc,
  width = 4.85,
  height = 4.85,
  colorQuantization = 4,
}) => {
  return (
    <div style={{ width: '485px', height: '485px', position: 'relative' }}>
      <Canvas
        style={{
          width: '100%',
          height: '100%',
        }}
        dpr={[1, 2]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
      >
        {/* Use orthographic camera for pixel-perfect rendering */}
        <OrthographicCamera
          makeDefault
          position={[0, 0, 5]}
          zoom={100}
          near={0.1}
          far={1000}
        />

        {/* Ambient light for basic illumination */}
        <ambientLight intensity={1} />

        {/* Our dithered image */}
        <DitheredImage
          src={imageSrc}
          width={width}
          height={height}
          colorQuantization={colorQuantization}
        />
      </Canvas>
    </div>
  );
};